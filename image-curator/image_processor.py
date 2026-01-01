"""
Image processing utilities for the curator.
Ensures all saved images are resized to 1200x900 at 85% JPEG quality.
"""

import io
import logging
from dataclasses import dataclass
from typing import Tuple

from PIL import Image, ImageOps

logger = logging.getLogger(__name__)


@dataclass
class ProcessedImage:
    """Container for processed image output."""

    data: bytes
    width: int
    height: int
    format: str
    file_size: int


class ImageProcessor:
    """Resize and optimize images for lesson usage."""

    def __init__(self, target_size: Tuple[int, int] = (1200, 900), quality: int = 85):
        self.target_width, self.target_height = target_size
        self.quality = quality

    def process(self, image_bytes: bytes) -> ProcessedImage:
        """
        Resize and compress image to target dimensions.

        Args:
            image_bytes: Raw bytes of the downloaded image.

        Returns:
            ProcessedImage with resized JPEG bytes and metadata.
        """
        with Image.open(io.BytesIO(image_bytes)) as img:
            # Convert to RGB to avoid PNG alpha issues
            if img.mode not in ("RGB", "RGBA"):
                img = img.convert("RGB")

            # Letterbox/crop to target aspect while preserving content
            img = ImageOps.fit(
                img, (self.target_width, self.target_height), method=Image.LANCZOS
            )

            buffer = io.BytesIO()
            img.save(buffer, format="JPEG", quality=self.quality, optimize=True)
            data = buffer.getvalue()

            return ProcessedImage(
                data=data,
                width=self.target_width,
                height=self.target_height,
                format="jpg",
                file_size=len(data),
            )


# Convenience helper
def process_image(image_bytes: bytes) -> ProcessedImage:
    """Process image with default settings (1200x900 @ 85%)."""
    processor = ImageProcessor()
    return processor.process(image_bytes)

