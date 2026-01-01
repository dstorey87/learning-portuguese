"""
Vision Client for Image Curator
Uses Ollama vision models to evaluate image relevance for vocabulary words.
"""

import base64
import json
import logging
import re
from pathlib import Path
from typing import Dict, Optional, Union
from dataclasses import dataclass

try:
    import ollama

    OLLAMA_AVAILABLE = True
except ImportError:
    OLLAMA_AVAILABLE = False

logger = logging.getLogger(__name__)


@dataclass
class ImageScore:
    """Structured image evaluation result."""

    relevance: int  # 0-10: Does image represent the word?
    clarity: int  # 0-10: Is main subject clear?
    appropriateness: int  # 0-10: Suitable for education?
    quality: int  # 0-10: Well-composed and professional?
    reason: str  # Brief explanation
    recommended: bool  # Final recommendation
    raw_response: str = ""  # Original model response

    @property
    def total_score(self) -> int:
        """Combined score out of 40."""
        return self.relevance + self.clarity + self.appropriateness + self.quality

    @property
    def average_score(self) -> float:
        """Average score out of 10."""
        return self.total_score / 4

    def to_dict(self) -> Dict:
        """Convert to dictionary."""
        return {
            "relevance": self.relevance,
            "clarity": self.clarity,
            "appropriateness": self.appropriateness,
            "quality": self.quality,
            "total_score": self.total_score,
            "average_score": round(self.average_score, 2),
            "reason": self.reason,
            "recommended": self.recommended,
        }


class VisionClient:
    """Client for evaluating images using Ollama vision models."""

    # Models in preference order (first available will be used)
    VISION_MODELS = [
        "llama3.2-vision:11b",  # Best quality
        "llama3.2-vision",  # Default
        "llava:13b",  # Good alternative
        "llava:7b",  # Lighter alternative
        "llava",  # Fallback
    ]

    def __init__(
        self,
        model: Optional[str] = None,
        host: str = "http://localhost:11434",
        num_gpu: Optional[int] = None,
    ):
        """
        Initialize vision client.

        Args:
            model: Specific model to use, or None for auto-detect
            host: Ollama server URL
            num_gpu: Number of GPU layers to use (None=all, lower values reduce GPU load)
        """
        if not OLLAMA_AVAILABLE:
            raise ImportError("ollama package not installed. Run: pip install ollama")

        self.host = host
        self.client = ollama.Client(host=host)
        self.model = model or self._detect_best_model()
        self.num_gpu = num_gpu  # Limit GPU layers to reduce load

        if not self.model:
            logger.warning(
                "No vision model available. Pull one with: ollama pull llama3.2-vision"
            )
            logger.warning(
                "Vision evaluation will not work until a model is installed."
            )
        else:
            logger.info(f"Vision client initialized with model: {self.model}")

    def _detect_best_model(self) -> Optional[str]:
        """Find the best available vision model."""
        try:
            response = self.client.list()
            models_list = response.get("models", [])

            # Build set of available model names
            available = set()
            for m in models_list:
                # Handle both 'name' and 'model' keys
                model_name = m.get("name") or m.get("model", "")
                if model_name:
                    available.add(model_name)
                    available.add(model_name.split(":")[0])

            logger.debug(f"Available models: {available}")

            # Check each preferred model
            for model in self.VISION_MODELS:
                base_name = model.split(":")[0]
                if model in available or base_name in available:
                    logger.info(f"Auto-detected vision model: {model}")
                    return model

            # Check for any model with 'vision' or 'llava' in name
            for name in available:
                if "vision" in name.lower() or "llava" in name.lower():
                    logger.info(f"Found vision-capable model: {name}")
                    return name

            logger.warning(
                "No vision model found. Install one with: ollama pull llama3.2-vision"
            )
            return None

        except Exception as e:
            logger.error(f"Failed to list models: {e}")
            return None

    def has_vision_model(self) -> bool:
        """Check if a vision model is available."""
        return self.model is not None

    def _encode_image(self, image_path: Union[str, Path]) -> str:
        """Read and base64 encode an image file."""
        path = Path(image_path)
        if not path.exists():
            raise FileNotFoundError(f"Image not found: {path}")

        with open(path, "rb") as f:
            return base64.b64encode(f.read()).decode("utf-8")

    def _parse_response(self, response_text: str) -> ImageScore:
        """Parse model response into ImageScore."""
        # Try to extract JSON from response
        json_match = re.search(r"\{[^{}]*\}", response_text, re.DOTALL)

        if json_match:
            try:
                data = json.loads(json_match.group())
                return ImageScore(
                    relevance=int(data.get("relevance", 0)),
                    clarity=int(data.get("clarity", 0)),
                    appropriateness=int(data.get("appropriateness", 0)),
                    quality=int(data.get("quality", 0)),
                    reason=str(data.get("reason", "No reason provided")),
                    recommended=bool(data.get("recommended", False)),
                    raw_response=response_text,
                )
            except (json.JSONDecodeError, ValueError) as e:
                logger.warning(f"Failed to parse JSON response: {e}")

        # Fallback: try to extract numbers
        logger.warning("Using fallback response parsing")
        numbers = re.findall(r"\b([0-9]|10)\b", response_text)
        scores = [int(n) for n in numbers[:4]] if len(numbers) >= 4 else [0, 0, 0, 0]

        return ImageScore(
            relevance=scores[0] if len(scores) > 0 else 0,
            clarity=scores[1] if len(scores) > 1 else 0,
            appropriateness=scores[2] if len(scores) > 2 else 0,
            quality=scores[3] if len(scores) > 3 else 0,
            reason=response_text[:200],
            recommended=sum(scores) >= 28,  # 70% threshold
            raw_response=response_text,
        )

    def evaluate_image(
        self,
        image_path: Union[str, Path],
        target_word: str,
        translation: str,
        context: str = "",
    ) -> ImageScore:
        """
        Evaluate if an image is appropriate for teaching a vocabulary word.

        Args:
            image_path: Path to image file
            target_word: Portuguese word being taught
            translation: English translation
            context: Additional context (category, example sentence, etc.)

        Returns:
            ImageScore with detailed evaluation
        """
        image_data = self._encode_image(image_path)

        prompt = f"""You are evaluating if this image is appropriate for teaching the Portuguese word "{target_word}" (meaning: "{translation}").
{f'Context: {context}' if context else ''}

Score the image on these criteria (0-10 each):
1. RELEVANCE: Does the image clearly show/represent "{translation}"?
2. CLARITY: Is the main subject clear and unambiguous?
3. APPROPRIATENESS: Is it suitable for educational content (all ages)?
4. QUALITY: Is the image well-composed and professional-looking?

Respond ONLY with valid JSON in this exact format:
{{"relevance": X, "clarity": X, "appropriateness": X, "quality": X, "reason": "brief 1-2 sentence explanation", "recommended": true/false}}

Be strict: only recommend (true) if total score >= 28/40 AND relevance >= 7."""

        try:
            # Build options with GPU limiting if configured
            options = {}
            if self.num_gpu is not None:
                options["num_gpu"] = self.num_gpu

            response = self.client.chat(
                model=self.model,
                messages=[{"role": "user", "content": prompt, "images": [image_data]}],
                options=options if options else None,
            )

            response_text = response["message"]["content"]
            logger.debug(f"Raw response for {target_word}: {response_text}")

            return self._parse_response(response_text)

        except Exception as e:
            logger.error(f"Vision evaluation failed: {e}")
            return ImageScore(
                relevance=0,
                clarity=0,
                appropriateness=0,
                quality=0,
                reason=f"Evaluation failed: {str(e)}",
                recommended=False,
                raw_response="",
            )

    def evaluate_url(
        self, image_url: str, target_word: str, translation: str, context: str = ""
    ) -> ImageScore:
        """
        Evaluate an image from URL (downloads temporarily).

        Args:
            image_url: URL of image to evaluate
            target_word: Portuguese word being taught
            translation: English translation
            context: Additional context

        Returns:
            ImageScore with detailed evaluation
        """
        import tempfile
        import requests

        try:
            # Download image to temp file
            response = requests.get(image_url, timeout=30)
            response.raise_for_status()

            # Determine extension from content type
            content_type = response.headers.get("content-type", "image/jpeg")
            ext = (
                ".jpg"
                if "jpeg" in content_type
                else ".png" if "png" in content_type else ".jpg"
            )

            with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
                tmp.write(response.content)
                tmp_path = tmp.name

            try:
                return self.evaluate_image(tmp_path, target_word, translation, context)
            finally:
                # Clean up temp file
                Path(tmp_path).unlink(missing_ok=True)

        except requests.RequestException as e:
            logger.error(f"Failed to download image: {e}")
            return ImageScore(
                relevance=0,
                clarity=0,
                appropriateness=0,
                quality=0,
                reason=f"Download failed: {str(e)}",
                recommended=False,
                raw_response="",
            )

    def get_status(self) -> Dict:
        """Get client status."""
        return {
            "ollama_available": OLLAMA_AVAILABLE,
            "host": self.host,
            "model": self.model,
            "ready": self.model is not None,
            "install_command": (
                "ollama pull llama3.2-vision" if not self.model else None
            ),
        }


# Factory function
def create_vision_client(model: Optional[str] = None) -> VisionClient:
    """Create a vision client with auto-detection."""
    return VisionClient(model=model)


if __name__ == "__main__":
    # Quick test
    logging.basicConfig(level=logging.DEBUG)

    try:
        client = create_vision_client()
        print(f"Status: {json.dumps(client.get_status(), indent=2)}")
    except Exception as e:
        print(f"Failed to create client: {e}")
