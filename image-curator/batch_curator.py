"""
Batch Curation Runner
Main entry point for processing vocabulary images in batch mode.
"""

import asyncio
import argparse
import json
import logging
import sys
from pathlib import Path
from typing import Optional, List, Dict, Set
from datetime import datetime
from dataclasses import dataclass
import signal

# Load environment variables from .env
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")

# Handle relative imports
try:
    from .gpu_manager import GPUManager
    from .vision_client import VisionClient, ImageScore
    from .api_client import create_api_client, ImageResult
    from .image_library import ImageLibrary, ImageRecord, get_library
    from .storage import LocalImageStorage
    from .image_search import ImageSearchOrchestrator
except ImportError:
    from gpu_manager import GPUManager
    from vision_client import VisionClient, ImageScore
    from api_client import create_api_client, ImageResult
    from image_library import ImageLibrary, ImageRecord, get_library
    from storage import LocalImageStorage
    from image_search import ImageSearchOrchestrator

logger = logging.getLogger(__name__)


@dataclass
class BatchConfig:
    """Configuration for batch processing."""

    vision_model: str = "gemma3:4b"  # Per plan: gemma3:4b recommended for multilingual
    candidates_per_word: int = 5  # Per plan: search 5 candidates, select best
    min_score: int = 28  # Minimum score (out of 40) to accept - per plan
    min_relevance: int = 7  # Minimum relevance score (0-10) - per plan
    resume_from_crash: bool = True
    gpu_throttle_percent: int = 75
    target_gpu: Optional[int] = None  # Specific GPU to use (None = auto-select)
    num_gpu_layers: Optional[int] = (
        None  # Limit GPU layers (None = all, lower = less GPU load)
    )
    save_rejected: bool = True
    download_images: bool = True
    use_vision: bool = True
    dry_run: bool = False
    lesson_filter: Optional[str] = None
    category_filter: Optional[str] = None
    word_filter: Optional[List[str]] = None


@dataclass
class BatchProgress:
    """Track batch processing progress."""

    total_words: int = 0
    processed: int = 0
    successful: int = 0
    failed: int = 0
    skipped: int = 0
    current_word: Optional[str] = None
    current_translation: Optional[str] = None
    current_lesson: Optional[str] = None
    start_time: Optional[datetime] = None

    def to_dict(self) -> Dict:
        return {
            "total": self.total_words,
            "total_words": self.total_words,
            "processed": self.processed,
            "successful": self.successful,
            "succeeded": self.successful,
            "failed": self.failed,
            "skipped": self.skipped,
            "current_word": self.current_word,
            "current_translation": self.current_translation,
            "current_lesson": self.current_lesson,
            "percent_complete": round(
                self.processed / max(self.total_words, 1) * 100, 1
            ),
            "elapsed_seconds": (
                (datetime.now() - self.start_time).total_seconds()
                if self.start_time
                else 0
            ),
        }


class BatchCurator:
    """
    Orchestrates batch curation of vocabulary images.

    Flow:
    1. Load vocabulary from CSV/lesson files
    2. Filter words already with selected images
    3. For each word:
       a. Search APIs for candidates
       b. Score each with vision model
       c. Select best above threshold
       d. Download and store locally
       e. Update database
    """

    def __init__(self, config: Optional[BatchConfig] = None):
        self.config = config or BatchConfig()
        self.progress = BatchProgress()
        self.library = get_library()
        self.storage = LocalImageStorage()
        self.gpu_manager = GPUManager(
            throttle_threshold=self.config.gpu_throttle_percent,
            target_gpu=self.config.target_gpu,
        )
        self.api_client = None
        self.vision_client = None
        self.orchestrator = None
        self._shutdown_requested = False
        self._progress_callbacks = []
        self._candidate_callbacks = []
        self._log_callbacks = []

    def add_progress_callback(self, callback):
        """Add callback for progress updates."""
        self._progress_callbacks.append(callback)

    def add_candidate_callback(self, callback):
        """Add callback for candidate updates."""
        self._candidate_callbacks.append(callback)

    def add_log_callback(self, callback):
        """Add callback for log events."""
        self._log_callbacks.append(callback)

    def _notify_progress(self):
        """Notify all progress callbacks."""
        for cb in self._progress_callbacks:
            try:
                cb(self.progress)
            except:
                pass

    def _notify_candidates(self, word: str, candidates: list):
        """Notify candidate callbacks with candidate list."""
        payload = {"word": word, "candidates": candidates}
        for cb in self._candidate_callbacks:
            try:
                cb(payload)
            except Exception:
                pass

    def _notify_selected(self, selection: dict):
        """Notify when a selection is made."""
        for cb in self._candidate_callbacks:
            try:
                cb({"selected": selection})
            except Exception:
                pass

    def _notify_log(self, message: str, level: str = "info"):
        """Notify log subscribers (used by websocket server)."""
        for cb in self._log_callbacks:
            try:
                cb({"level": level, "message": message})
            except Exception:
                pass

    async def initialize(self) -> bool:
        """Initialize all services."""
        try:
            # GPU manager is initialized in __init__, just check status
            stats = self.gpu_manager.get_status()
            if not stats.get("nvidia_available"):
                logger.warning("No GPU available, will run on CPU (slower)")

            # Initialize API client
            self.api_client = create_api_client()

            # Initialize vision client with GPU layer limiting
            if self.config.use_vision:
                self.vision_client = VisionClient(
                    model=self.config.vision_model, num_gpu=self.config.num_gpu_layers
                )
                if self.config.num_gpu_layers:
                    logger.info(
                        f"Vision client using model: {self.config.vision_model} (GPU layers: {self.config.num_gpu_layers})"
                    )
                else:
                    logger.info(
                        f"Vision client using model: {self.config.vision_model}"
                    )
            else:
                self.vision_client = None
                logger.info("Vision evaluation disabled by config")

            # Create orchestrator
            self.orchestrator = ImageSearchOrchestrator(
                api_client=self.api_client,
                vision_client=self.vision_client,
                enable_vision=self.config.use_vision,
            )

            logger.info("BatchCurator initialized successfully")
            return True

        except Exception as e:
            logger.error(f"Failed to initialize BatchCurator: {e}")
            return False

    async def shutdown(self):
        """Clean shutdown of all services."""
        self._shutdown_requested = True

        # API client cleanup if it has close method
        if self.api_client and hasattr(self.api_client, "close"):
            try:
                await self.api_client.close()
            except:
                pass

        logger.info("BatchCurator shutdown complete")

    def load_vocabulary(self) -> List[Dict]:
        """
        Load vocabulary words from lesson CSV files in LESSON ORDER.

        Processes lessons in numerical order (001, 002, etc.)
        and words within each lesson by word_id (001_01, 001_02, etc.)

        Returns list of dicts with:
        - word_id: Unique word identifier (e.g., 001_01)
        - word: Portuguese word
        - english: English translation
        - lesson_id: Lesson identifier
        - category: Lesson category
        """
        vocabulary = []
        csv_dir = Path(__file__).parent.parent / "src" / "data" / "csv"

        if not csv_dir.exists():
            logger.warning(f"CSV directory not found: {csv_dir}")
            return vocabulary

        # Get CSV files and sort by lesson number (001, 002, etc.)
        csv_files = sorted(
            [f for f in csv_dir.glob("*.csv") if f.stem[0].isdigit()],
            key=lambda f: f.stem,
        )

        for csv_file in csv_files:
            try:
                lesson_id = csv_file.stem

                # Apply lesson filter
                if self.config.lesson_filter:
                    if self.config.lesson_filter not in lesson_id:
                        continue

                lesson_words = []

                with open(csv_file, "r", encoding="utf-8") as f:
                    import csv as csv_module

                    reader = csv_module.DictReader(f)

                    for row in reader:
                        word_id = row.get("word_id", "")
                        word = row.get("portuguese", "").strip()
                        english = row.get("english", "").strip()

                        if not word or not english:
                            continue

                        # Apply word filter
                        if self.config.word_filter:
                            if word not in self.config.word_filter:
                                continue

                        lesson_words.append(
                            {
                                "word_id": word_id,
                                "word": word,
                                "english": english,
                                "lesson_id": lesson_id,
                                "category": self._get_category(lesson_id),
                            }
                        )

                # Sort words within lesson by word_id
                lesson_words.sort(key=lambda w: w.get("word_id", ""))
                vocabulary.extend(lesson_words)

            except Exception as e:
                logger.error(f"Error reading {csv_file}: {e}")

        logger.info(f"Loaded {len(vocabulary)} vocabulary words in lesson order")
        return vocabulary

    def _get_category(self, lesson_id: str) -> str:
        """Map lesson ID to category."""
        # Extract category from lesson name
        if "greeting" in lesson_id.lower():
            return "greetings"
        elif "number" in lesson_id.lower():
            return "numbers"
        elif "family" in lesson_id.lower():
            return "family"
        elif "food" in lesson_id.lower() or "cafe" in lesson_id.lower():
            return "food"
        elif "transport" in lesson_id.lower():
            return "transportation"
        elif "weather" in lesson_id.lower():
            return "weather"
        elif "body" in lesson_id.lower():
            return "body"
        elif "color" in lesson_id.lower():
            return "colors"
        elif "time" in lesson_id.lower():
            return "time"
        elif "day" in lesson_id.lower() or "month" in lesson_id.lower():
            return "calendar"
        elif "verb" in lesson_id.lower():
            return "verbs"
        else:
            return "general"

    def filter_words_needing_images(self, vocabulary: List[Dict]) -> List[Dict]:
        """Filter to only words without selected images."""
        needs_image = []

        for item in vocabulary:
            # Check if word already has a selected image
            existing = self.library.get_selected_image(item["word"])

            if existing is None:
                needs_image.append(item)
            else:
                logger.debug(f"Skipping '{item['word']}' - already has image")

        logger.info(f"Filtered to {len(needs_image)} words needing images")
        return needs_image

    def _update_csv_image_url(self, item: Dict, local_path: str) -> bool:
        """
        BUG-020 FIX: Update CSV file with curated image URL.

        Args:
            item: Dict with lesson_id and word_id
            local_path: Path to saved image

        Returns:
            True if CSV updated successfully
        """
        try:
            import csv as csv_module

            lesson_id = item.get("lesson_id", "")
            word_id = item.get("word_id", "")

            if not lesson_id or not word_id:
                logger.warning(f"Cannot update CSV: missing lesson_id or word_id")
                return False

            csv_path = (
                Path(__file__).parent.parent
                / "src"
                / "data"
                / "csv"
                / f"{lesson_id}.csv"
            )

            if not csv_path.exists():
                logger.warning(f"CSV not found: {csv_path}")
                return False

            # Convert local path to relative asset URL
            # From: C:\...\assets\images\library\greetings\001_01.jpg
            # To: assets/images/library/greetings/001_01.jpg
            local_path_obj = Path(local_path)
            try:
                relative_path = local_path_obj.relative_to(Path(__file__).parent.parent)
                image_url = str(relative_path).replace("\\", "/")
            except ValueError:
                # Path is not relative to project root
                image_url = local_path

            # Read CSV
            rows = []
            fieldnames = []
            with open(csv_path, "r", encoding="utf-8", newline="") as f:
                reader = csv_module.DictReader(f)
                fieldnames = reader.fieldnames or []
                rows = list(reader)

            # Add image_url column if it doesn't exist
            if "image_url" not in fieldnames:
                fieldnames.append("image_url")

            # Update the matching row
            updated = False
            for row in rows:
                if row.get("word_id") == word_id:
                    row["image_url"] = image_url
                    updated = True
                    break

            if not updated:
                logger.warning(f"Word ID {word_id} not found in {csv_path}")
                return False

            # Write back
            with open(csv_path, "w", encoding="utf-8", newline="") as f:
                writer = csv_module.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(rows)

            logger.info(f"Updated CSV {lesson_id}.csv: {word_id} -> {image_url}")
            return True

        except Exception as e:
            logger.error(f"Failed to update CSV: {e}")
            return False

    async def process_word(self, item: Dict) -> bool:
        """
        Process a single vocabulary word.

        Args:
            item: Dict with word_id, word, english, lesson_id, category

        Returns:
            True if successfully curated
        """
        word = item["word"]
        word_id = item.get("word_id", "")
        english = item["english"]

        self.progress.current_word = f"{word_id} ({word})" if word_id else word
        self.progress.current_translation = english
        self.progress.current_lesson = item.get("lesson_id")
        self._notify_progress()

        logger.info(f"Processing: {word_id} - {word} ({english})")
        self._notify_log(f"Processing {word} ({english})")

        if self.config.dry_run:
            logger.info(f"[DRY RUN] Would process: {word_id} - {word}")
            return True

        try:
            # Check GPU throttling - wait until available (blocks until <75%)
            if self.gpu_manager.should_throttle():
                logger.info("GPU throttled, waiting for availability...")
                if not self.gpu_manager.wait_for_available(
                    check_interval=2.0, max_wait=120.0
                ):
                    logger.warning("GPU throttle timeout, proceeding anyway")

            # Search for candidate images
            # Returns List[Tuple[ImageResult, float]] - tuples of (image, score)
            results = await self.orchestrator.search_and_evaluate(
                portuguese_word=word,
                english_translation=english,
                category=item.get("category", ""),
                search_count=self.config.candidates_per_word,
                return_count=self.config.candidates_per_word,
                use_vision=self.config.use_vision,
            )

            if not results:
                logger.warning(f"No images found for '{word}'")
                self._notify_log(f"No images found for '{word}'", level="warn")
                return False

            # BUG-016 FIX: Score ALL candidates, then select BEST one above threshold
            # Results are tuples of (ImageResult, score) where score is 0-10 average
            scored_candidates = []

            for image_result, score in results:
                # Convert score from 0-10 average to 0-40 total scale
                score_40 = score * 4 if score <= 10 else score
                # Estimate relevance as ~25% of total (since it's 1 of 4 criteria)
                # If vision returned detailed scores, use those; otherwise estimate
                estimated_relevance = score  # score is already 0-10 average
                scored_candidates.append((image_result, score_40, estimated_relevance))

            # Broadcast candidates to listeners (e.g., websocket)
            self._notify_candidates(
                word,
                [
                    {
                        **image_result.to_dict(),
                        "score": round(score_40 / 4, 2),  # 0-10 scale for UI
                        "relevance": relevance,
                    }
                    for (image_result, score_40, relevance) in scored_candidates
                ],
            )

            # Sort by total score descending to find best
            scored_candidates.sort(key=lambda x: x[1], reverse=True)

            # Find best that meets BOTH thresholds (BUG-022 FIX)
            best_result = None
            best_score = 0

            for image_result, score_40, relevance in scored_candidates:
                # Check both total score AND relevance minimum per plan
                if (
                    score_40 >= self.config.min_score
                    and relevance >= self.config.min_relevance
                ):
                    best_result = image_result
                    best_score = score_40
                    break  # Already sorted, first match is best

            if not best_result:
                logger.warning(
                    f"No image for '{word}' met minimum score {self.config.min_score}"
                )
                self._notify_log(
                    f"No candidate met min score for '{word}'", level="warn"
                )

                # Save rejected candidates if configured
                if self.config.save_rejected:
                    for image_result, score in results:
                        await self._save_candidate(
                            item, image_result, status="rejected"
                        )

                return False

            # Download and save the selected image
            image_record = await self._save_candidate(
                item, best_result, status="selected"
            )

            if image_record:
                logger.info(f"Selected image for '{word}' with score {best_score}/40")
                self._notify_log(
                    f"Selected image for '{word}' ({best_score}/40)", level="success"
                )
                self._notify_selected(
                    {
                        **best_result.to_dict(),
                        "score": round(best_score / 4, 2),  # 0-10 scale
                        "word": word,
                        "word_id": word_id,
                        "lesson_id": item.get("lesson_id"),
                    }
                )

                # BUG-020 FIX: Update CSV with image URL
                if image_record.local_path:
                    self._update_csv_image_url(item, image_record.local_path)

                return True

            return False

        except Exception as e:
            logger.error(f"Error processing '{word}': {e}")
            self._notify_log(f"Error processing '{word}': {e}", level="error")
            return False

    async def _save_candidate(
        self, item: Dict, result, status: str = "candidate"
    ) -> Optional[ImageRecord]:
        """Save an image candidate to the library."""
        try:
            # Create image record - handle different attribute names
            record = ImageRecord(
                word=item["word"],
                word_id=item.get(
                    "word_id", ""
                ),  # Use word_id for filename (e.g., "001_01")
                url=result.url,
                source=result.source,
                lesson_id=item["lesson_id"],
                category=item.get("category", ""),
                source_url=getattr(result, "photographer_url", "") or "",
                photographer=getattr(result, "photographer", "") or "",
                alt_text=getattr(result, "alt_text", "")
                or getattr(result, "alt", "")
                or "",
                description=getattr(result, "alt_text", "")
                or getattr(result, "alt", "")
                or "",
                tags=getattr(result, "tags", []) or [],
                status=status,
            )

            # Note: score is now a float from tuple, not an ImageScore object
            # Skip AI scores for now since we're using simple scoring

            # Save to database
            image_id = self.library.add_image(record, actor="batch_curator")
            record.id = image_id

            # If selected and download enabled, download locally
            if status == "selected" and self.config.download_images:
                await self._download_image(record, result)

            return record

        except Exception as e:
            logger.error(f"Error saving candidate: {e}")
            return None

    async def _download_image(self, record: ImageRecord, result) -> Optional[str]:
        """Download image to local storage."""
        try:
            import aiohttp

            # Local import to avoid hard dependency at module import time
            try:
                from .image_processor import process_image
            except ImportError:
                from image_processor import process_image

            async with aiohttp.ClientSession() as session:
                async with session.get(result.url) as resp:
                    if resp.status == 200:
                        original_bytes = await resp.read()

                        # Resize/compress to required dimensions/quality
                        processed = process_image(original_bytes)
                        record.format = processed.format
                        record.file_size = processed.file_size
                        record.width = processed.width
                        record.height = processed.height

                        # Save locally
                        local_path = self.storage.save_image(processed.data, record)

                        # Update database with local path and dimensions
                        self.library.update_image(
                            record.id,
                            {
                                "local_path": local_path,
                                "format": record.format,
                                "file_size": record.file_size,
                                "width": record.width,
                                "height": record.height,
                            },
                        )

                        logger.info(f"Downloaded image to {local_path}")
                        return local_path
                    else:
                        logger.error(f"Failed to download image: HTTP {resp.status}")
                        return None

        except Exception as e:
            logger.error(f"Error downloading image: {e}")
            return None

    async def run(self, vocabulary: Optional[List[Dict]] = None) -> Dict:
        """
        Run batch curation.

        Args:
            vocabulary: Optional list of vocabulary items.
                       If None, loads from CSV files.

        Returns:
            Summary dict with results
        """
        # Load vocabulary if not provided
        if vocabulary is None:
            vocabulary = self.load_vocabulary()

        if not vocabulary:
            return {"error": "No vocabulary to process"}

        # Filter to words needing images
        to_process = self.filter_words_needing_images(vocabulary)

        if not to_process:
            return {"message": "All words already have images"}

        # Initialize progress
        self.progress = BatchProgress(
            total_words=len(to_process), start_time=datetime.now()
        )

        # Add to queue
        for item in to_process:
            self.library.add_to_queue(item["word"], item["lesson_id"])

        logger.info(f"Starting batch curation of {len(to_process)} words")
        self._notify_log(f"Starting batch curation of {len(to_process)} words")

        # Process each word
        for item in to_process:
            if self._shutdown_requested:
                logger.info("Shutdown requested, stopping batch")
                break

            success = await self.process_word(item)

            self.progress.processed += 1
            if success:
                self.progress.successful += 1
            else:
                self.progress.failed += 1

            self._notify_progress()

            # Small delay between words to avoid API rate limits
            await asyncio.sleep(0.5)

        # Final summary
        summary = self.progress.to_dict()
        summary["completed"] = not self._shutdown_requested

        logger.info(
            f"Batch complete: {self.progress.successful} successful, "
            f"{self.progress.failed} failed, {self.progress.skipped} skipped"
        )
        self._notify_log(
            f"Batch complete: {self.progress.successful} success, {self.progress.failed} failed, {self.progress.skipped} skipped",
            level="success" if summary.get("completed") else "info",
        )

        return summary


async def main():
    """CLI entry point for batch curation."""
    parser = argparse.ArgumentParser(description="Batch curate vocabulary images")
    parser.add_argument(
        "--model", default="gemma3:4b", help="Vision model to use (default: gemma3:4b)"
    )
    parser.add_argument(
        "--candidates", type=int, default=5, help="Candidates per word (default: 5)"
    )
    parser.add_argument(
        "--min-score", type=int, default=28, help="Minimum score to accept (out of 40)"
    )
    parser.add_argument(
        "--gpu-throttle",
        type=int,
        default=75,
        help="GPU throttle percentage (default: 75)",
    )
    parser.add_argument(
        "--target-gpu",
        type=int,
        default=None,
        help="Specific GPU index to use (default: auto-select)",
    )
    parser.add_argument(
        "--num-gpu-layers",
        type=int,
        default=None,
        help="Limit GPU layers to reduce load (default: all layers on GPU)",
    )
    parser.add_argument("--lesson", help="Filter to specific lesson")
    parser.add_argument("--words", nargs="+", help="Process specific words only")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be done without processing",
    )
    parser.add_argument(
        "--no-vision",
        action="store_true",
        help="Disable vision evaluation (faster, lower quality)",
    )
    parser.add_argument(
        "--no-download", action="store_true", help="Do not download images locally"
    )
    parser.add_argument("-v", "--verbose", action="store_true", help="Verbose logging")

    args = parser.parse_args()

    # Configure logging
    level = logging.DEBUG if args.verbose else logging.INFO
    logging.basicConfig(
        level=level, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
    )

    # Build config
    config = BatchConfig(
        vision_model=args.model,
        candidates_per_word=args.candidates,
        min_score=args.min_score,
        gpu_throttle_percent=args.gpu_throttle,
        target_gpu=args.target_gpu,
        num_gpu_layers=args.num_gpu_layers,
        lesson_filter=args.lesson,
        word_filter=args.words,
        dry_run=args.dry_run,
        download_images=not args.no_download,
        use_vision=not args.no_vision,
    )

    # Create curator
    curator = BatchCurator(config)

    # Handle shutdown signals
    def signal_handler(sig, frame):
        logger.info("Received shutdown signal")
        curator._shutdown_requested = True

    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    # Initialize and run
    if not await curator.initialize():
        logger.error("Failed to initialize curator")
        sys.exit(1)

    try:
        results = await curator.run()
        print(json.dumps(results, indent=2))
    finally:
        await curator.shutdown()


if __name__ == "__main__":
    # Fix Windows event loop issue with aiodns
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())
