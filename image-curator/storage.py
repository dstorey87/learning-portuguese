"""
Metadata Sidecar Generator
Creates JSON metadata files for downloaded images.
"""

import json
import logging
from pathlib import Path
from typing import Dict, Optional, Any
from datetime import datetime
from dataclasses import asdict

# Handle both relative and absolute imports
try:
    from .image_library import ImageRecord
except ImportError:
    from image_library import ImageRecord

logger = logging.getLogger(__name__)


class MetadataSidecar:
    """
    Manages metadata sidecar files for images.
    Each downloaded image gets a corresponding .json file with:
    - Source attribution
    - AI validation scores
    - Verification status
    - Usage history
    """
    
    def __init__(self, library_root: Optional[str] = None):
        """
        Initialize the metadata handler.
        
        Args:
            library_root: Root directory for image library
        """
        self.library_root = Path(library_root or Path(__file__).parent.parent / 'assets' / 'images' / 'library')
        self.library_root.mkdir(parents=True, exist_ok=True)
    
    def get_metadata_path(self, image_path: str) -> Path:
        """Get the metadata file path for an image."""
        image_path = Path(image_path)
        return image_path.with_suffix(image_path.suffix + '.json')
    
    def save_metadata(self, image: ImageRecord, local_path: str) -> Path:
        """
        Save metadata sidecar for an image.
        
        Args:
            image: ImageRecord with all image data
            local_path: Path where image is saved
        
        Returns:
            Path to metadata file
        """
        metadata_path = self.get_metadata_path(local_path)
        
        metadata = {
            'version': '1.0',
            'generated_at': datetime.now().isoformat(),
            'image': {
                'id': image.id,
                'word': image.word,
                'lesson_id': image.lesson_id,
                'category': image.category,
                'format': image.format,
                'width': image.width,
                'height': image.height,
                'file_size': image.file_size
            },
            'source': {
                'provider': image.source,
                'url': image.source_url or image.url,
                'photographer': image.photographer,
                'alt_text': image.alt_text,
                'description': image.description,
                'tags': image.tags or []
            },
            'ai_validation': {
                'model': image.ai_model,
                'validated_at': image.ai_validated_at,
                'scores': {
                    'relevance': image.ai_score_relevance,
                    'clarity': image.ai_score_clarity,
                    'appropriateness': image.ai_score_appropriateness,
                    'quality': image.ai_score_quality,
                    'total': image.ai_score_total
                },
                'reason': image.ai_reason
            },
            'status': {
                'current': image.status,
                'manually_verified': image.manually_verified,
                'verified_by': image.verified_by,
                'verified_at': image.verified_at
            },
            'timestamps': {
                'created_at': image.created_at,
                'updated_at': image.updated_at
            }
        }
        
        # Write metadata file
        metadata_path.parent.mkdir(parents=True, exist_ok=True)
        with open(metadata_path, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Saved metadata to {metadata_path}")
        return metadata_path
    
    def load_metadata(self, image_path: str) -> Optional[Dict]:
        """
        Load metadata sidecar for an image.
        
        Args:
            image_path: Path to image file
        
        Returns:
            Metadata dictionary or None if not found
        """
        metadata_path = self.get_metadata_path(image_path)
        
        if not metadata_path.exists():
            return None
        
        try:
            with open(metadata_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Failed to load metadata from {metadata_path}: {e}")
            return None
    
    def update_metadata(self, image_path: str, updates: Dict) -> bool:
        """
        Update specific fields in metadata.
        
        Args:
            image_path: Path to image file
            updates: Dictionary of updates to apply
        
        Returns:
            True if updated successfully
        """
        metadata = self.load_metadata(image_path)
        if not metadata:
            return False
        
        # Deep merge updates
        self._deep_merge(metadata, updates)
        metadata['generated_at'] = datetime.now().isoformat()
        
        metadata_path = self.get_metadata_path(image_path)
        with open(metadata_path, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, indent=2, ensure_ascii=False)
        
        return True
    
    def delete_metadata(self, image_path: str) -> bool:
        """Delete metadata sidecar."""
        metadata_path = self.get_metadata_path(image_path)
        
        if metadata_path.exists():
            metadata_path.unlink()
            logger.info(f"Deleted metadata {metadata_path}")
            return True
        return False
    
    def _deep_merge(self, base: Dict, updates: Dict) -> None:
        """Deep merge updates into base dictionary."""
        for key, value in updates.items():
            if key in base and isinstance(base[key], dict) and isinstance(value, dict):
                self._deep_merge(base[key], value)
            else:
                base[key] = value


class LocalImageStorage:
    """
    Manages local image file storage organized by category.
    
    Structure:
    assets/images/library/
    ├── greetings/
    │   ├── ola.jpg
    │   ├── ola.jpg.json
    │   ├── bom_dia.png
    │   └── bom_dia.png.json
    ├── numbers/
    │   ├── um.jpg
    │   └── um.jpg.json
    └── uncategorized/
        └── ...
    """
    
    def __init__(self, library_root: Optional[str] = None):
        """Initialize storage handler."""
        self.library_root = Path(library_root or Path(__file__).parent.parent / 'assets' / 'images' / 'library')
        self.library_root.mkdir(parents=True, exist_ok=True)
        self.metadata = MetadataSidecar(str(self.library_root))
    
    def get_storage_path(self, word: str, category: str, extension: str = 'jpg') -> Path:
        """
        Get the storage path for an image.
        
        Args:
            word: The vocabulary word
            category: Image category (lesson type)
            extension: File extension
        
        Returns:
            Path where image should be stored
        """
        # Sanitize word for filename
        safe_word = self._sanitize_filename(word)
        category = category or 'uncategorized'
        
        category_dir = self.library_root / category
        category_dir.mkdir(parents=True, exist_ok=True)
        
        return category_dir / f"{safe_word}.{extension}"
    
    def save_image(self, image_data: bytes, image: ImageRecord) -> str:
        """
        Save image file and metadata.
        
        Args:
            image_data: Raw image bytes
            image: ImageRecord with metadata
        
        Returns:
            Local path where image was saved
        """
        # Determine extension from format or URL
        extension = image.format or self._get_extension(image.url) or 'jpg'
        
        # Get storage path
        local_path = self.get_storage_path(
            image.word, 
            image.category,
            extension
        )
        
        # Handle duplicates by adding suffix
        if local_path.exists():
            base = local_path.stem
            suffix = 1
            while local_path.exists():
                local_path = local_path.with_stem(f"{base}_{suffix}")
                suffix += 1
        
        # Save image file
        local_path.write_bytes(image_data)
        logger.info(f"Saved image to {local_path}")
        
        # Update image record with local path
        image.local_path = str(local_path)
        
        # Save metadata sidecar
        self.metadata.save_metadata(image, str(local_path))
        
        return str(local_path)
    
    def delete_image(self, local_path: str) -> bool:
        """Delete image and its metadata."""
        path = Path(local_path)
        
        success = True
        if path.exists():
            path.unlink()
            logger.info(f"Deleted image {local_path}")
        else:
            success = False
        
        # Also delete metadata
        self.metadata.delete_metadata(local_path)
        
        return success
    
    def get_all_images(self, category: Optional[str] = None) -> list:
        """
        Get all images in library.
        
        Args:
            category: Filter by category, or None for all
        
        Returns:
            List of (image_path, metadata) tuples
        """
        results = []
        
        if category:
            search_dirs = [self.library_root / category]
        else:
            search_dirs = [d for d in self.library_root.iterdir() if d.is_dir()]
        
        for dir_path in search_dirs:
            if not dir_path.exists():
                continue
                
            for file_path in dir_path.glob('*'):
                # Skip metadata files
                if file_path.suffix == '.json':
                    continue
                
                # Skip non-image files
                if file_path.suffix.lower() not in ['.jpg', '.jpeg', '.png', '.gif', '.webp']:
                    continue
                
                metadata = self.metadata.load_metadata(str(file_path))
                results.append((str(file_path), metadata))
        
        return results
    
    def get_storage_stats(self) -> Dict:
        """Get storage statistics."""
        stats = {
            'total_images': 0,
            'total_size_bytes': 0,
            'by_category': {},
            'by_format': {}
        }
        
        for category_dir in self.library_root.iterdir():
            if not category_dir.is_dir():
                continue
            
            category = category_dir.name
            stats['by_category'][category] = {'count': 0, 'size': 0}
            
            for file_path in category_dir.glob('*'):
                if file_path.suffix == '.json':
                    continue
                
                if file_path.suffix.lower() in ['.jpg', '.jpeg', '.png', '.gif', '.webp']:
                    size = file_path.stat().st_size
                    stats['total_images'] += 1
                    stats['total_size_bytes'] += size
                    stats['by_category'][category]['count'] += 1
                    stats['by_category'][category]['size'] += size
                    
                    ext = file_path.suffix.lower().lstrip('.')
                    if ext not in stats['by_format']:
                        stats['by_format'][ext] = 0
                    stats['by_format'][ext] += 1
        
        # Convert bytes to human readable
        stats['total_size_mb'] = round(stats['total_size_bytes'] / (1024 * 1024), 2)
        
        return stats
    
    def _sanitize_filename(self, word: str) -> str:
        """Sanitize word for use as filename."""
        # Replace spaces and special chars
        safe = word.lower().strip()
        safe = safe.replace(' ', '_')
        # Remove any non-alphanumeric chars except underscore
        safe = ''.join(c for c in safe if c.isalnum() or c == '_')
        return safe or 'unnamed'
    
    def _get_extension(self, url: str) -> Optional[str]:
        """Extract file extension from URL."""
        if not url:
            return None
        
        # Handle query strings
        path = url.split('?')[0]
        
        for ext in ['jpg', 'jpeg', 'png', 'gif', 'webp']:
            if path.lower().endswith(f'.{ext}'):
                return ext
        
        return None


if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    
    storage = LocalImageStorage()
    stats = storage.get_storage_stats()
    print("Storage Statistics:")
    print(json.dumps(stats, indent=2))
