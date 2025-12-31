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

    vision_model: str = "llama3.2-vision:11b"
    candidates_per_word: int = 3
    min_score: int = 28  # Minimum score (out of 40) to accept
    resume_from_crash: bool = True
    gpu_throttle_percent: int = 75
    save_rejected: bool = True
    download_images: bool = True
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
    start_time: Optional[datetime] = None

    def to_dict(self) -> Dict:
        return {
            "total_words": self.total_words,
            "processed": self.processed,
            "successful": self.successful,
            "failed": self.failed,
            "skipped": self.skipped,
            "current_word": self.current_word,
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
        self.gpu_manager = GPUManager(throttle_percent=self.config.gpu_throttle_percent)
        self.api_client = None
        self.vision_client = None
        self.orchestrator = None
        self._shutdown_requested = False
        self._progress_callbacks = []

    def add_progress_callback(self, callback):
        """Add callback for progress updates."""
        self._progress_callbacks.append(callback)

    def _notify_progress(self):
        """Notify all progress callbacks."""
        for cb in self._progress_callbacks:
            try:
                cb(self.progress)
            except:
                pass

    async def initialize(self) -> bool:
        """Initialize all services."""
        try:
            # Initialize GPU manager
            await self.gpu_manager.initialize()

            # Check GPU availability
            stats = self.gpu_manager.get_stats()
            if not stats.get("available"):
                logger.warning("No GPU available, will run on CPU (slower)")

            # Initialize API client
            self.api_client = create_api_client()

            # Initialize vision client
            self.vision_client = VisionClient(model=self.config.vision_model)

            # Check if model is available
            if not await self.vision_client.check_model():
                logger.warning(f"Model {self.config.vision_model} not available")
                return False

            # Create orchestrator
            self.orchestrator = ImageSearchOrchestrator(
                api_client=self.api_client, vision_client=self.vision_client
            )

            logger.info("BatchCurator initialized successfully")
            return True

        except Exception as e:
            logger.error(f"Failed to initialize BatchCurator: {e}")
            return False

    async def shutdown(self):
        """Clean shutdown of all services."""
        self._shutdown_requested = True

        if self.api_client:
            await self.api_client.close()
        if self.gpu_manager:
            await self.gpu_manager.shutdown()

        logger.info("BatchCurator shutdown complete")

    def load_vocabulary(self) -> List[Dict]:
        """
        Load vocabulary words from lesson CSV files.

        Returns list of dicts with:
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

        for csv_file in csv_dir.glob("*.csv"):
            try:
                lesson_id = csv_file.stem

                # Apply lesson filter
                if self.config.lesson_filter:
                    if self.config.lesson_filter not in lesson_id:
                        continue

                with open(csv_file, "r", encoding="utf-8") as f:
                    # Skip header line
                    lines = f.readlines()[1:]

                    for line in lines:
                        parts = line.strip().split(",")
                        if len(parts) >= 2:
                            word = parts[0].strip()
                            english = parts[1].strip()

                            # Apply word filter
                            if self.config.word_filter:
                                if word not in self.config.word_filter:
                                    continue

                            vocabulary.append(
                                {
                                    "word": word,
                                    "english": english,
                                    "lesson_id": lesson_id,
                                    "category": self._get_category(lesson_id),
                                }
                            )

            except Exception as e:
                logger.error(f"Error reading {csv_file}: {e}")

        logger.info(f"Loaded {len(vocabulary)} vocabulary words")
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

    async def process_word(self, item: Dict) -> bool:
        """
        Process a single vocabulary word.

        Args:
            item: Dict with word, english, lesson_id, category

        Returns:
            True if successfully curated
        """
        word = item["word"]
        english = item["english"]

        self.progress.current_word = word
        self._notify_progress()

        logger.info(f"Processing: {word} ({english})")

        if self.config.dry_run:
            logger.info(f"[DRY RUN] Would process: {word}")
            return True

        try:
            # Wait for GPU availability
            await self.gpu_manager.wait_until_ready()

            # Search for candidate images
            search_query = f"{english} {word}"
            results = await self.orchestrator.search_and_evaluate(
                word=word, query=search_query, count=self.config.candidates_per_word
            )

            if not results:
                logger.warning(f"No images found for '{word}'")
                return False

            # Find best scoring image above threshold
            best_result = None
            best_score = 0

            for result in results:
                if result.score and result.score.total > best_score:
                    if result.score.total >= self.config.min_score:
                        best_result = result
                        best_score = result.score.total

            if not best_result:
                logger.warning(
                    f"No image for '{word}' met minimum score {self.config.min_score}"
                )

                # Save rejected candidates if configured
                if self.config.save_rejected:
                    for result in results:
                        await self._save_candidate(item, result, status="rejected")

                return False

            # Download and save the selected image
            image_record = await self._save_candidate(
                item, best_result, status="selected"
            )

            if image_record:
                logger.info(f"Selected image for '{word}' with score {best_score}/40")
                return True

            return False

        except Exception as e:
            logger.error(f"Error processing '{word}': {e}")
            return False

    async def _save_candidate(
        self, item: Dict, result, status: str = "candidate"
    ) -> Optional[ImageRecord]:
        """Save an image candidate to the library."""
        try:
            # Create image record
            record = ImageRecord(
                word=item["word"],
                url=result.url,
                source=result.source,
                lesson_id=item["lesson_id"],
                category=item["category"],
                source_url=result.source_url,
                photographer=result.photographer,
                alt_text=result.alt,
                description=result.alt,
                tags=result.tags or [],
                status=status,
            )

            # Add AI scores if available
            if result.score:
                record.ai_score_relevance = result.score.relevance
                record.ai_score_clarity = result.score.clarity
                record.ai_score_appropriateness = result.score.appropriateness
                record.ai_score_quality = result.score.quality
                record.ai_score_total = result.score.total
                record.ai_reason = result.score.reason
                record.ai_model = self.config.vision_model
                record.ai_validated_at = datetime.now().isoformat()

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

            async with aiohttp.ClientSession() as session:
                async with session.get(result.url) as resp:
                    if resp.status == 200:
                        image_data = await resp.read()

                        # Detect format
                        content_type = resp.headers.get("content-type", "")
                        if "png" in content_type:
                            record.format = "png"
                        elif "gif" in content_type:
                            record.format = "gif"
                        elif "webp" in content_type:
                            record.format = "webp"
                        else:
                            record.format = "jpg"

                        record.file_size = len(image_data)

                        # Save locally
                        local_path = self.storage.save_image(image_data, record)

                        # Update database with local path
                        self.library.update_image(
                            record.id,
                            {
                                "local_path": local_path,
                                "format": record.format,
                                "file_size": record.file_size,
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

        return summary


async def main():
    """CLI entry point for batch curation."""
    parser = argparse.ArgumentParser(description="Batch curate vocabulary images")
    parser.add_argument(
        "--model", default="llama3.2-vision:11b", help="Vision model to use"
    )
    parser.add_argument("--candidates", type=int, default=3, help="Candidates per word")
    parser.add_argument(
        "--min-score", type=int, default=28, help="Minimum score to accept (out of 40)"
    )
    parser.add_argument(
        "--gpu-throttle", type=int, default=75, help="GPU throttle percentage"
    )
    parser.add_argument("--lesson", help="Filter to specific lesson")
    parser.add_argument("--words", nargs="+", help="Process specific words only")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be done without processing",
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
        lesson_filter=args.lesson,
        word_filter=args.words,
        dry_run=args.dry_run,
        download_images=not args.no_download,
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
    asyncio.run(main())
