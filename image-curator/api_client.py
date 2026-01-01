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
            "id": self.id,
            "url": self.url,
            "thumbnail_url": self.thumbnail_url,
            "width": self.width,
            "height": self.height,
            "alt_text": self.alt_text,
            "photographer": self.photographer,
            "photographer_url": self.photographer_url,
            "source": self.source,
            "license": self.license,
            "attribution": self.attribution,
            "tags": self.tags,
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
        self.base_url = config.get("base_url", "https://api.pexels.com/v1")
        self.rate_limiter = RateLimiter(
            config.get("rate_limit", {}).get("requests_per_hour", 200)
        )
        self.preferred_size = config.get("preferred_size", "medium")

    async def search(
        self,
        query: str,
        count: int = 5,
        session: Optional[aiohttp.ClientSession] = None,
    ) -> List[ImageResult]:
        """Search for images on Pexels."""
        await self.rate_limiter.acquire()

        own_session = session is None
        if own_session:
            session = aiohttp.ClientSession()

        try:
            headers = {"Authorization": self.api_key}
            params = {"query": query, "per_page": count, "orientation": "landscape"}

            async with session.get(
                f"{self.base_url}/search", headers=headers, params=params
            ) as response:
                if response.status != 200:
                    logger.error(f"Pexels API error: {response.status}")
                    return []

                data = await response.json()
                return self._parse_results(data.get("photos", []))

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
            src = photo.get("src", {})
            results.append(
                ImageResult(
                    id=f"pexels_{photo.get('id')}",
                    url=src.get(self.preferred_size, src.get("medium", "")),
                    thumbnail_url=src.get("tiny", src.get("small", "")),
                    width=photo.get("width", 0),
                    height=photo.get("height", 0),
                    alt_text=photo.get("alt", ""),
                    photographer=photo.get("photographer", "Unknown"),
                    photographer_url=photo.get("photographer_url", ""),
                    source="pexels",
                    license="Pexels License",
                    attribution=f"Photo by {photo.get('photographer', 'Unknown')} on Pexels",
                )
            )
        return results


class PixabayClient:
    """Pixabay API client."""

    def __init__(self, api_key: str, config: Dict):
        self.api_key = api_key
        self.config = config
        self.base_url = config.get("base_url", "https://pixabay.com/api")
        self.rate_limiter = RateLimiter(
            config.get("rate_limit", {}).get("requests_per_minute", 100),
            period_seconds=60,
        )
        self.preferred_size = config.get("preferred_size", "webformatURL")

    async def search(
        self,
        query: str,
        count: int = 5,
        session: Optional[aiohttp.ClientSession] = None,
    ) -> List[ImageResult]:
        """Search for images on Pixabay."""
        await self.rate_limiter.acquire()

        own_session = session is None
        if own_session:
            session = aiohttp.ClientSession()

        try:
            params = {
                "key": self.api_key,
                "q": query,
                "per_page": count,
                "image_type": "photo",
                "safesearch": "true",
                "orientation": "horizontal",
            }

            async with session.get(self.base_url, params=params) as response:
                if response.status != 200:
                    logger.error(f"Pixabay API error: {response.status}")
                    return []

                data = await response.json()
                return self._parse_results(data.get("hits", []))

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
            results.append(
                ImageResult(
                    id=f"pixabay_{hit.get('id')}",
                    url=hit.get(self.preferred_size, hit.get("webformatURL", "")),
                    thumbnail_url=hit.get("previewURL", ""),
                    width=hit.get("imageWidth", 0),
                    height=hit.get("imageHeight", 0),
                    alt_text=hit.get("tags", ""),
                    photographer=hit.get("user", "Unknown"),
                    photographer_url=f"https://pixabay.com/users/{hit.get('user', '')}-{hit.get('user_id', '')}",
                    source="pixabay",
                    license="Pixabay License",
                    attribution=f"Image by {hit.get('user', 'Unknown')} from Pixabay",
                    tags=[t.strip() for t in hit.get("tags", "").split(",")],
                )
            )
        return results


class OpenverseClient:
    """Openverse API client - 800M Creative Commons licensed images."""

    def __init__(self, api_key: str, config: Dict):
        self.api_key = api_key
        self.config = config
        self.base_url = config.get("base_url", "https://api.openverse.org/v1/images")
        # Openverse: 100 requests/day free, 10K with approved credentials
        self.rate_limiter = RateLimiter(
            config.get("rate_limit", {}).get("requests_per_day", 100),
            period_seconds=86400,  # 24 hours
        )

    async def search(
        self,
        query: str,
        count: int = 5,
        session: Optional[aiohttp.ClientSession] = None,
    ) -> List[ImageResult]:
        """Search for images on Openverse."""
        await self.rate_limiter.acquire()

        own_session = session is None
        if own_session:
            session = aiohttp.ClientSession()

        try:
            headers = {"Authorization": f"Bearer {self.api_key}"}
            params = {
                "q": query,
                "page_size": count,
                "license_type": "commercial",  # Safe for any use
                "mature": "false",
            }

            async with session.get(
                self.base_url, headers=headers, params=params
            ) as response:
                if response.status != 200:
                    logger.error(f"Openverse API error: {response.status}")
                    return []

                data = await response.json()
                return self._parse_results(data.get("results", []))

        except Exception as e:
            logger.error(f"Openverse search failed: {e}")
            return []
        finally:
            if own_session:
                await session.close()

    def _parse_results(self, results: List[Dict]) -> List[ImageResult]:
        """Parse Openverse API response into standardized results."""
        parsed = []
        for item in results:
            parsed.append(
                ImageResult(
                    id=f"openverse_{item.get('id')}",
                    url=item.get("url", ""),
                    thumbnail_url=item.get("thumbnail", item.get("url", "")),
                    width=item.get("width", 0) or 0,
                    height=item.get("height", 0) or 0,
                    alt_text=item.get("title", ""),
                    photographer=item.get("creator", "Unknown") or "Unknown",
                    photographer_url=item.get("creator_url", "") or "",
                    source="openverse",
                    license=item.get("license", "CC"),
                    attribution=item.get("attribution", f"Via Openverse ({item.get('source', 'unknown')})"),
                    tags=[t.get("name", "") for t in item.get("tags", []) if isinstance(t, dict)],
                )
            )
        return parsed


class ImageAPIClient:
    """Unified client for multiple image APIs with failover."""

    def __init__(self, config_path: Optional[str] = None):
        """
        Initialize the API client.

        Args:
            config_path: Path to api_config.json, or None for default
        """
        self.config_path = config_path or Path(__file__).parent / "api_config.json"
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
            return {"apis": {}, "defaults": {}}

    def _init_clients(self) -> None:
        """Initialize enabled API clients."""
        apis = self.config.get("apis", {})

        # Pexels
        if apis.get("pexels", {}).get("enabled", False):
            api_key = os.environ.get("PEXELS_API_KEY")
            if api_key:
                self.clients["pexels"] = PexelsClient(api_key, apis["pexels"])
                logger.info("Pexels client initialized")
            else:
                logger.warning("PEXELS_API_KEY not set, Pexels disabled")

        # Pixabay
        if apis.get("pixabay", {}).get("enabled", False):
            api_key = os.environ.get("PIXABAY_API_KEY")
            if api_key:
                self.clients["pixabay"] = PixabayClient(api_key, apis["pixabay"])
                logger.info("Pixabay client initialized")
            else:
                logger.warning("PIXABAY_API_KEY not set, Pixabay disabled")

        # Openverse
        if apis.get("openverse", {}).get("enabled", False):
            api_key = os.environ.get("OPENVERSE_API_KEY")
            if api_key:
                self.clients["openverse"] = OpenverseClient(api_key, apis["openverse"])
                logger.info("Openverse client initialized")
            else:
                logger.warning("OPENVERSE_API_KEY not set, Openverse disabled")

        if not self.clients:
            logger.warning("No API clients initialized - set API keys in environment")

    async def search(
        self, query: str, count: int = 5, sources: Optional[List[str]] = None
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
        apis_config = self.config.get("apis", {})
        clients_to_use = []

        for name, client in self.clients.items():
            if sources and name not in sources:
                continue
            priority = apis_config.get(name, {}).get("priority", 99)
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
                    logger.info(
                        f"{name}: found {len(api_results)} results for '{query}'"
                    )

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
        count: int = 5,
    ) -> List[ImageResult]:
        """
        Search for images appropriate for a vocabulary word.
        
        Uses intelligent query building based on word type and category
        to find the most relevant educational images.

        Args:
            portuguese_word: The Portuguese word
            english_translation: English translation to search for
            category: Word category for context
            count: Number of results

        Returns:
            List of ImageResult
        """
        # Smart query building based on word characteristics
        query = self._build_smart_query(portuguese_word, english_translation, category)
        
        logger.info(
            f"Searching for '{portuguese_word}' ({english_translation}): query='{query}'"
        )
        
        results = await self.search(query, count)
        
        # If no results, try fallback queries
        if not results:
            fallback_queries = self._get_fallback_queries(english_translation, category)
            for fallback in fallback_queries:
                logger.info(f"Trying fallback query: '{fallback}'")
                results = await self.search(fallback, count)
                if results:
                    break
        
        return results

    def _build_smart_query(
        self, portuguese_word: str, english_translation: str, category: str
    ) -> str:
        """
        Build an intelligent search query based on word type.
        
        Different word types need different search strategies:
        - Concrete nouns: Direct search works well
        - Abstract concepts: Need visual metaphors
        - Greetings: Need people interacting
        - Verbs: Need action shots
        - Adjectives: Need examples showing the quality
        """
        translation_lower = english_translation.lower()
        
        # Word-specific overrides for difficult/abstract words
        word_specific_queries = {
            # Greetings - need people interacting
            "hello": "people waving hello greeting friendly",
            "good morning": "sunrise morning greeting coffee wake up",
            "good afternoon": "afternoon sun people meeting",
            "good evening": "evening sunset dinner greeting",
            "good night": "night moon stars bedtime",
            "goodbye": "people waving goodbye farewell",
            "bye": "friends waving bye casual farewell",
            "see you later": "friends parting see you soon",
            "see you tomorrow": "calendar tomorrow planning meeting",
            "see you soon": "clock time soon meeting",
            "how are you": "people conversation friendly chat",
            "fine": "thumbs up okay happy person",
            "thank you": "grateful thankful appreciation handshake",
            "thanks": "thank you gratitude appreciation",
            "you're welcome": "welcoming friendly hospitality",
            "please": "polite request please manners",
            "excuse me": "polite apology excuse pardon",
            "sorry": "apologetic sorry regret",
            "yes": "thumbs up yes agreement nodding",
            "no": "no refusal head shake",
            "maybe": "thinking uncertain perhaps considering",
            "of course": "confident certain absolutely sure",
            "okay": "okay agreement thumbs up fine",
            
            # Pronouns - need clear single/plural/gender distinctions
            "i": "person pointing self me individual",
            "you": "person pointing you conversation",
            "he": "man male person portrait",
            "she": "woman female person portrait",
            "it": "object thing item neutral",
            "we": "group people together team us",
            "they": "group people them others",
            
            # Articles - need examples of the concept
            "the": "specific item pointing definite",
            "a": "single one item object",
            "an": "single item object one",
            
            # Numbers - clear visual representations
            "one": "number 1 one single item",
            "two": "number 2 two pair items",
            "three": "number 3 three items trio",
            "four": "number 4 four items",
            "five": "number 5 five items hand fingers",
            "six": "number 6 six items",
            "seven": "number 7 seven items",
            "eight": "number 8 eight items",
            "nine": "number 9 nine items",
            "ten": "number 10 ten items both hands",
            
            # Common verbs
            "to be": "existence being identity person",
            "to have": "having possession holding hands",
            "to go": "walking going movement travel",
            "to come": "arriving coming approach",
            "to want": "desire wanting wish reaching",
            "to eat": "eating food meal dining",
            "to drink": "drinking beverage glass",
            "to sleep": "sleeping bed rest peaceful",
            "to speak": "speaking talking conversation",
            "to work": "working office job profession",
        }
        
        # Check for word-specific query
        if translation_lower in word_specific_queries:
            return word_specific_queries[translation_lower]
        
        # Category-based query enhancement
        category_hints = {
            "greetings": "people greeting friendly interaction",
            "numbers": "number counting quantity clear",
            "family": "family portrait people relatives",
            "food": "food dish cuisine delicious",
            "transportation": "vehicle transport travel",
            "weather": "weather nature sky outdoor",
            "body": "human body anatomy health",
            "colors": "color vibrant colorful",
            "animals": "animal wildlife nature",
            "time": "clock time schedule",
            "calendar": "calendar date schedule",
            "verbs": "action movement doing",
            "adjectives": "quality characteristic",
            "pronouns": "person people portrait",
            "general": "",  # No extra hints for general
        }
        
        category_lower = category.lower() if category else "general"
        
        for cat_key, hint in category_hints.items():
            if cat_key in category_lower:
                if hint:
                    return f"{english_translation} {hint}"
                break
        
        # Default: just use the translation with "clear" for better results
        return f"{english_translation} clear"

    def _get_fallback_queries(
        self, english_translation: str, category: str
    ) -> List[str]:
        """
        Generate fallback queries if primary search fails.
        """
        fallbacks = []
        
        # Try just the word
        fallbacks.append(english_translation)
        
        # Try with "illustration" for abstract concepts
        fallbacks.append(f"{english_translation} illustration")
        
        # Try with "concept" for very abstract words
        fallbacks.append(f"{english_translation} concept")
        
        # Category-specific fallbacks
        if "greeting" in category.lower():
            fallbacks.append("people meeting friendly")
        elif "number" in category.lower():
            fallbacks.append("counting numbers education")
        
        return fallbacks

    def get_status(self) -> Dict:
        """Get client status."""
        return {
            "config_path": str(self.config_path),
            "enabled_apis": list(self.clients.keys()),
            "defaults": self.config.get("defaults", {}),
            "api_keys_set": {
                "pexels": bool(os.environ.get("PEXELS_API_KEY")),
                "pixabay": bool(os.environ.get("PIXABAY_API_KEY")),
                "openverse": bool(os.environ.get("OPENVERSE_API_KEY")),
            },
        }


# Convenience function
def create_api_client(config_path: Optional[str] = None) -> ImageAPIClient:
    """Create an image API client."""
    return ImageAPIClient(config_path)


if __name__ == "__main__":
    import sys

    logging.basicConfig(level=logging.INFO)

    client = create_api_client()
    print(json.dumps(client.get_status(), indent=2))

    # Test search if API keys are set
    if client.clients:

        async def test_search():
            results = await client.search_for_word(
                portuguese_word="três",
                english_translation="three",
                category="numbers",
                count=3,
            )
            for r in results:
                print(f"  - {r.source}: {r.alt_text[:50]}... ({r.url[:60]}...)")

        asyncio.run(test_search())
    else:
        print("\nSet PEXELS_API_KEY or PIXABAY_API_KEY to enable image search")
