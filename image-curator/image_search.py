"""
Image Search Orchestrator for Image Curator
Combines API search, caching, and vision evaluation for smart image selection.
"""

import asyncio
import json
import logging
import hashlib
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from datetime import datetime

# Support both relative and absolute imports
try:
    from .api_client import ImageAPIClient, ImageResult, create_api_client
    from .vision_client import VisionClient, create_vision_client
    from .gpu_manager import get_gpu_manager
except ImportError:
    from api_client import ImageAPIClient, ImageResult, create_api_client
    from vision_client import VisionClient, create_vision_client
    from gpu_manager import get_gpu_manager

logger = logging.getLogger(__name__)


class ImageCache:
    """Simple file-based cache for image search results."""
    
    def __init__(self, cache_dir: Optional[Path] = None):
        self.cache_dir = cache_dir or Path(__file__).parent / '.cache'
        self.cache_dir.mkdir(exist_ok=True)
    
    def _get_cache_key(self, query: str, source: str = 'all') -> str:
        """Generate cache key for a query."""
        key_str = f"{query.lower()}:{source}"
        return hashlib.md5(key_str.encode()).hexdigest()
    
    def _get_cache_path(self, cache_key: str) -> Path:
        """Get path to cache file."""
        return self.cache_dir / f"{cache_key}.json"
    
    def get(self, query: str, source: str = 'all', max_age_hours: int = 24) -> Optional[List[Dict]]:
        """Get cached results if available and fresh."""
        cache_key = self._get_cache_key(query, source)
        cache_path = self._get_cache_path(cache_key)
        
        if not cache_path.exists():
            return None
        
        try:
            with open(cache_path) as f:
                data = json.load(f)
            
            # Check age
            cached_at = datetime.fromisoformat(data.get('cached_at', '2000-01-01'))
            age_hours = (datetime.now() - cached_at).total_seconds() / 3600
            
            if age_hours > max_age_hours:
                logger.debug(f"Cache expired for '{query}'")
                return None
            
            return data.get('results', [])
            
        except Exception as e:
            logger.warning(f"Cache read error: {e}")
            return None
    
    def set(self, query: str, results: List[Dict], source: str = 'all') -> None:
        """Cache search results."""
        cache_key = self._get_cache_key(query, source)
        cache_path = self._get_cache_path(cache_key)
        
        try:
            data = {
                'query': query,
                'source': source,
                'cached_at': datetime.now().isoformat(),
                'results': results
            }
            with open(cache_path, 'w') as f:
                json.dump(data, f, indent=2)
            logger.debug(f"Cached {len(results)} results for '{query}'")
        except Exception as e:
            logger.warning(f"Cache write error: {e}")
    
    def clear(self) -> int:
        """Clear all cached results. Returns count of cleared items."""
        count = 0
        for cache_file in self.cache_dir.glob('*.json'):
            cache_file.unlink()
            count += 1
        return count


class ImageSearchOrchestrator:
    """
    Orchestrates the image search pipeline:
    1. Check cache
    2. Search APIs
    3. Evaluate with vision model
    4. Cache and return best results
    """
    
    def __init__(
        self,
        api_client: Optional[ImageAPIClient] = None,
        vision_client: Optional[VisionClient] = None,
        cache: Optional[ImageCache] = None,
        enable_vision: bool = True
    ):
        self.api_client = api_client or create_api_client()
        self.vision_client = vision_client or create_vision_client() if enable_vision else None
        self.cache = cache or ImageCache()
        self.gpu_manager = get_gpu_manager()
    
    async def search_and_evaluate(
        self,
        portuguese_word: str,
        english_translation: str,
        category: str = "",
        search_count: int = 5,
        return_count: int = 1,
        use_cache: bool = True,
        use_vision: bool = True
    ) -> List[Tuple[ImageResult, float]]:
        """
        Search for images and optionally evaluate with vision model.
        
        Args:
            portuguese_word: The Portuguese word
            english_translation: English translation
            category: Word category
            search_count: How many images to fetch from APIs
            return_count: How many images to return
            use_cache: Whether to use cached results
            use_vision: Whether to evaluate with vision model
        
        Returns:
            List of (ImageResult, score) tuples, sorted by score descending
        """
        cache_key = f"{portuguese_word}:{english_translation}"
        
        # Check cache first
        if use_cache:
            cached = self.cache.get(cache_key)
            if cached:
                logger.info(f"Cache hit for '{portuguese_word}'")
                results = [
                    (ImageResult(**r['result']), r['score'])
                    for r in cached[:return_count]
                ]
                return results
        
        # Search APIs
        logger.info(f"Searching for '{portuguese_word}' ({english_translation})")
        images = await self.api_client.search_for_word(
            portuguese_word=portuguese_word,
            english_translation=english_translation,
            category=category,
            count=search_count
        )
        
        if not images:
            logger.warning(f"No images found for '{portuguese_word}'")
            return []
        
        # Evaluate with vision model if enabled
        scored_results: List[Tuple[ImageResult, float]] = []
        
        if use_vision and self.vision_client and self.vision_client.has_vision_model():
            # Check GPU availability
            if self.gpu_manager.should_throttle():
                logger.warning("GPU throttling active, skipping vision evaluation")
                scored_results = [(img, 0.5) for img in images]
            else:
                for image in images:
                    try:
                        score = await self._evaluate_image(
                            image.url,
                            portuguese_word,
                            english_translation
                        )
                        scored_results.append((image, score))
                    except Exception as e:
                        logger.error(f"Vision evaluation failed for {image.id}: {e}")
                        scored_results.append((image, 0.3))
        else:
            # No vision model - assign neutral scores
            scored_results = [(img, 0.5) for img in images]
        
        # Sort by score descending
        scored_results.sort(key=lambda x: x[1], reverse=True)
        
        # Cache results
        cache_data = [
            {'result': r.to_dict(), 'score': s}
            for r, s in scored_results
        ]
        self.cache.set(cache_key, cache_data)
        
        return scored_results[:return_count]
    
    async def _evaluate_image(
        self,
        image_url: str,
        portuguese_word: str,
        english_translation: str
    ) -> float:
        """Evaluate an image using vision model."""
        if not self.vision_client:
            return 0.5
        
        prompt = f"""Rate how well this image represents the concept "{english_translation}" for language learning.
Consider:
- Is the concept clearly visible?
- Is it unambiguous?
- Is it appropriate for education?
- Would a learner understand what it represents?

Rate from 0.0 (poor) to 1.0 (excellent)."""
        
        result = await self.vision_client.evaluate_image(image_url, prompt)
        
        # Parse score from result
        try:
            # Try to extract a number from the response
            import re
            numbers = re.findall(r'0\.\d+|1\.0|1|0', result)
            if numbers:
                return float(numbers[0])
        except:
            pass
        
        return 0.5  # Default neutral score
    
    async def curate_vocabulary_list(
        self,
        words: List[Dict],
        batch_size: int = 5,
        use_vision: bool = True
    ) -> Dict[str, List[Dict]]:
        """
        Curate images for a list of vocabulary words.
        
        Args:
            words: List of word dicts with 'portuguese', 'english', 'category' keys
            batch_size: How many words to process in parallel
            use_vision: Whether to use vision evaluation
        
        Returns:
            Dict mapping portuguese words to their curated images
        """
        results = {}
        
        for i in range(0, len(words), batch_size):
            batch = words[i:i + batch_size]
            tasks = []
            
            for word in batch:
                tasks.append(self.search_and_evaluate(
                    portuguese_word=word.get('portuguese', word.get('pt', '')),
                    english_translation=word.get('english', word.get('en', '')),
                    category=word.get('category', ''),
                    use_vision=use_vision
                ))
            
            batch_results = await asyncio.gather(*tasks, return_exceptions=True)
            
            for word, result in zip(batch, batch_results):
                pt_word = word.get('portuguese', word.get('pt', ''))
                if isinstance(result, Exception):
                    logger.error(f"Failed to curate '{pt_word}': {result}")
                    results[pt_word] = []
                elif result:
                    results[pt_word] = [
                        {**img.to_dict(), 'score': score}
                        for img, score in result
                    ]
                else:
                    results[pt_word] = []
        
        return results
    
    def get_status(self) -> Dict:
        """Get orchestrator status."""
        return {
            'api_client': self.api_client.get_status() if self.api_client else None,
            'vision_client': self.vision_client.get_status() if self.vision_client else None,
            'gpu': self.gpu_manager.get_status(),
            'cache_dir': str(self.cache.cache_dir)
        }


# Convenience functions
def create_orchestrator(enable_vision: bool = True) -> ImageSearchOrchestrator:
    """Create an image search orchestrator."""
    return ImageSearchOrchestrator(enable_vision=enable_vision)


async def search_for_word(
    portuguese_word: str,
    english_translation: str,
    category: str = ""
) -> List[Dict]:
    """
    Quick function to search for images for a vocabulary word.
    
    Returns list of image dicts with 'url', 'thumbnail_url', 'attribution', etc.
    """
    orchestrator = create_orchestrator(enable_vision=False)
    results = await orchestrator.search_and_evaluate(
        portuguese_word=portuguese_word,
        english_translation=english_translation,
        category=category,
        return_count=3
    )
    return [img.to_dict() for img, score in results]


if __name__ == '__main__':
    import sys
    logging.basicConfig(level=logging.INFO)
    
    orchestrator = create_orchestrator()
    print("Orchestrator Status:")
    print(json.dumps(orchestrator.get_status(), indent=2))
    
    # Test if API keys are available
    if orchestrator.api_client.clients:
        print("\nTest search for 'três' (three)...")
        
        async def test():
            results = await orchestrator.search_and_evaluate(
                portuguese_word='três',
                english_translation='three',
                category='numbers',
                use_vision=False
            )
            for img, score in results:
                print(f"  Score {score:.2f}: {img.source} - {img.alt_text[:40]}...")
        
        asyncio.run(test())
    else:
        print("\nNo API keys configured. Set PEXELS_API_KEY or PIXABAY_API_KEY.")
