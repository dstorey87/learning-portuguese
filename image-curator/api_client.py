"""
Image API Client for Image Curator
Integrates with Pexels and Pixabay APIs for image search with failover support.
"""

import asyncio
import aiohttp
import json
import logging
import os
from pathlib import Path
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


@dataclass
class ImageResult:
    """Standardized image result from any API."""
    id: str
    url: str
    thumbnail_url: str
    width: int
    height: int
    alt_text: str
    photographer: str
    photographer_url: str
    source: str  # 'pexels', 'pixabay', etc.
    license: str
    attribution: str
    tags: List[str] = field(default_factory=list)
    
    def to_dict(self) -> Dict:
        return {
            'id': self.id,
            'url': self.url,
            'thumbnail_url': self.thumbnail_url,
            'width': self.width,
            'height': self.height,
            'alt_text': self.alt_text,
            'photographer': self.photographer,
            'photographer_url': self.photographer_url,
            'source': self.source,
            'license': self.license,
            'attribution': self.attribution,
            'tags': self.tags
        }


class RateLimiter:
    """Simple rate limiter for API requests."""
    
    def __init__(self, requests_per_period: int, period_seconds: int = 3600):
        self.requests_per_period = requests_per_period
        self.period_seconds = period_seconds
        self.requests: List[datetime] = []
    
    async def acquire(self) -> bool:
        """Check if request is allowed, return True if OK."""
        now = datetime.now()
        cutoff = now - timedelta(seconds=self.period_seconds)
        
        # Remove old requests
        self.requests = [r for r in self.requests if r > cutoff]
        
        if len(self.requests) >= self.requests_per_period:
            wait_time = (self.requests[0] - cutoff).total_seconds()
            logger.warning(f"Rate limit reached, waiting {wait_time:.1f}s")
            await asyncio.sleep(wait_time)
            return await self.acquire()
        
        self.requests.append(now)
        return True


class PexelsClient:
    """Pexels API client."""
    
    def __init__(self, api_key: str, config: Dict):
        self.api_key = api_key
        self.config = config
        self.base_url = config.get('base_url', 'https://api.pexels.com/v1')
        self.rate_limiter = RateLimiter(
            config.get('rate_limit', {}).get('requests_per_hour', 200)
        )
        self.preferred_size = config.get('preferred_size', 'medium')
    
    async def search(
        self,
        query: str,
        count: int = 5,
        session: Optional[aiohttp.ClientSession] = None
    ) -> List[ImageResult]:
        """Search for images on Pexels."""
        await self.rate_limiter.acquire()
        
        own_session = session is None
        if own_session:
            session = aiohttp.ClientSession()
        
        try:
            headers = {'Authorization': self.api_key}
            params = {
                'query': query,
                'per_page': count,
                'orientation': 'landscape'
            }
            
            async with session.get(
                f"{self.base_url}/search",
                headers=headers,
                params=params
            ) as response:
                if response.status != 200:
                    logger.error(f"Pexels API error: {response.status}")
                    return []
                
                data = await response.json()
                return self._parse_results(data.get('photos', []))
                
        except Exception as e:
            logger.error(f"Pexels search failed: {e}")
            return []
        finally:
            if own_session:
                await session.close()
    
    def _parse_results(self, photos: List[Dict]) -> List[ImageResult]:
        """Parse Pexels API response into standardized results."""
        results = []
        for photo in photos:
            src = photo.get('src', {})
            results.append(ImageResult(
                id=f"pexels_{photo.get('id')}",
                url=src.get(self.preferred_size, src.get('medium', '')),
                thumbnail_url=src.get('tiny', src.get('small', '')),
                width=photo.get('width', 0),
                height=photo.get('height', 0),
                alt_text=photo.get('alt', ''),
                photographer=photo.get('photographer', 'Unknown'),
                photographer_url=photo.get('photographer_url', ''),
                source='pexels',
                license='Pexels License',
                attribution=f"Photo by {photo.get('photographer', 'Unknown')} on Pexels"
            ))
        return results


class PixabayClient:
    """Pixabay API client."""
    
    def __init__(self, api_key: str, config: Dict):
        self.api_key = api_key
        self.config = config
        self.base_url = config.get('base_url', 'https://pixabay.com/api')
        self.rate_limiter = RateLimiter(
            config.get('rate_limit', {}).get('requests_per_minute', 100),
            period_seconds=60
        )
        self.preferred_size = config.get('preferred_size', 'webformatURL')
    
    async def search(
        self,
        query: str,
        count: int = 5,
        session: Optional[aiohttp.ClientSession] = None
    ) -> List[ImageResult]:
        """Search for images on Pixabay."""
        await self.rate_limiter.acquire()
        
        own_session = session is None
        if own_session:
            session = aiohttp.ClientSession()
        
        try:
            params = {
                'key': self.api_key,
                'q': query,
                'per_page': count,
                'image_type': 'photo',
                'safesearch': 'true',
                'orientation': 'horizontal'
            }
            
            async with session.get(self.base_url, params=params) as response:
                if response.status != 200:
                    logger.error(f"Pixabay API error: {response.status}")
                    return []
                
                data = await response.json()
                return self._parse_results(data.get('hits', []))
                
        except Exception as e:
            logger.error(f"Pixabay search failed: {e}")
            return []
        finally:
            if own_session:
                await session.close()
    
    def _parse_results(self, hits: List[Dict]) -> List[ImageResult]:
        """Parse Pixabay API response into standardized results."""
        results = []
        for hit in hits:
            results.append(ImageResult(
                id=f"pixabay_{hit.get('id')}",
                url=hit.get(self.preferred_size, hit.get('webformatURL', '')),
                thumbnail_url=hit.get('previewURL', ''),
                width=hit.get('imageWidth', 0),
                height=hit.get('imageHeight', 0),
                alt_text=hit.get('tags', ''),
                photographer=hit.get('user', 'Unknown'),
                photographer_url=f"https://pixabay.com/users/{hit.get('user', '')}-{hit.get('user_id', '')}",
                source='pixabay',
                license='Pixabay License',
                attribution=f"Image by {hit.get('user', 'Unknown')} from Pixabay",
                tags=[t.strip() for t in hit.get('tags', '').split(',')]
            ))
        return results


class ImageAPIClient:
    """Unified client for multiple image APIs with failover."""
    
    def __init__(self, config_path: Optional[str] = None):
        """
        Initialize the API client.
        
        Args:
            config_path: Path to api_config.json, or None for default
        """
        self.config_path = config_path or Path(__file__).parent / 'api_config.json'
        self.config = self._load_config()
        self.clients: Dict[str, Any] = {}
        self._init_clients()
    
    def _load_config(self) -> Dict:
        """Load API configuration."""
        try:
            with open(self.config_path) as f:
                return json.load(f)
        except FileNotFoundError:
            logger.warning(f"Config not found: {self.config_path}, using defaults")
            return {'apis': {}, 'defaults': {}}
    
    def _init_clients(self) -> None:
        """Initialize enabled API clients."""
        apis = self.config.get('apis', {})
        
        # Pexels
        if apis.get('pexels', {}).get('enabled', False):
            api_key = os.environ.get('PEXELS_API_KEY')
            if api_key:
                self.clients['pexels'] = PexelsClient(api_key, apis['pexels'])
                logger.info("Pexels client initialized")
            else:
                logger.warning("PEXELS_API_KEY not set, Pexels disabled")
        
        # Pixabay
        if apis.get('pixabay', {}).get('enabled', False):
            api_key = os.environ.get('PIXABAY_API_KEY')
            if api_key:
                self.clients['pixabay'] = PixabayClient(api_key, apis['pixabay'])
                logger.info("Pixabay client initialized")
            else:
                logger.warning("PIXABAY_API_KEY not set, Pixabay disabled")
        
        if not self.clients:
            logger.warning("No API clients initialized - set API keys in environment")
    
    async def search(
        self,
        query: str,
        count: int = 5,
        sources: Optional[List[str]] = None
    ) -> List[ImageResult]:
        """
        Search for images across all enabled APIs.
        
        Args:
            query: Search query
            count: Number of results to return
            sources: Specific sources to use, or None for all
        
        Returns:
            List of ImageResult, deduplicated and sorted by source priority
        """
        if not self.clients:
            logger.error("No API clients available")
            return []
        
        # Determine which clients to use
        apis_config = self.config.get('apis', {})
        clients_to_use = []
        
        for name, client in self.clients.items():
            if sources and name not in sources:
                continue
            priority = apis_config.get(name, {}).get('priority', 99)
            clients_to_use.append((priority, name, client))
        
        # Sort by priority
        clients_to_use.sort(key=lambda x: x[0])
        
        # Search with failover
        results = []
        async with aiohttp.ClientSession() as session:
            for priority, name, client in clients_to_use:
                try:
                    api_results = await client.search(query, count, session)
                    results.extend(api_results)
                    logger.info(f"{name}: found {len(api_results)} results for '{query}'")
                    
                    # If we have enough results, stop
                    if len(results) >= count:
                        break
                        
                except Exception as e:
                    logger.error(f"{name} failed: {e}, trying next API")
                    continue
        
        return results[:count]
    
    async def search_for_word(
        self,
        portuguese_word: str,
        english_translation: str,
        category: str = "",
        count: int = 3
    ) -> List[ImageResult]:
        """
        Search for images appropriate for a vocabulary word.
        
        Args:
            portuguese_word: The Portuguese word
            english_translation: English translation to search for
            category: Word category for context
            count: Number of results
        
        Returns:
            List of ImageResult
        """
        # Build optimized search query
        query = english_translation
        
        # Add category context for better results
        category_hints = {
            'numbers': 'count quantity',
            'family': 'family person portrait',
            'food': 'food dish cuisine',
            'transportation': 'vehicle transport',
            'weather': 'weather nature sky',
            'body': 'human body anatomy',
            'colors': 'color colorful',
            'animals': 'animal wildlife nature'
        }
        
        for cat_key, hint in category_hints.items():
            if cat_key in category.lower():
                query = f"{english_translation} {hint}"
                break
        
        logger.info(f"Searching for '{portuguese_word}' ({english_translation}): query='{query}'")
        return await self.search(query, count)
    
    def get_status(self) -> Dict:
        """Get client status."""
        return {
            'config_path': str(self.config_path),
            'enabled_apis': list(self.clients.keys()),
            'defaults': self.config.get('defaults', {}),
            'api_keys_set': {
                'pexels': bool(os.environ.get('PEXELS_API_KEY')),
                'pixabay': bool(os.environ.get('PIXABAY_API_KEY')),
                'unsplash': bool(os.environ.get('UNSPLASH_ACCESS_KEY'))
            }
        }


# Convenience function
def create_api_client(config_path: Optional[str] = None) -> ImageAPIClient:
    """Create an image API client."""
    return ImageAPIClient(config_path)


if __name__ == '__main__':
    import sys
    logging.basicConfig(level=logging.INFO)
    
    client = create_api_client()
    print(json.dumps(client.get_status(), indent=2))
    
    # Test search if API keys are set
    if client.clients:
        async def test_search():
            results = await client.search_for_word(
                portuguese_word='três',
                english_translation='three',
                category='numbers',
                count=3
            )
            for r in results:
                print(f"  - {r.source}: {r.alt_text[:50]}... ({r.url[:60]}...)")
        
        asyncio.run(test_search())
    else:
        print("\nSet PEXELS_API_KEY or PIXABAY_API_KEY to enable image search")
