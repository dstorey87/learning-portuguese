# Image Curator

AI-powered image curation for Portuguese vocabulary learning.

## Overview

This tool uses Ollama vision models to evaluate and curate images for vocabulary words, ensuring high-quality educational content. It integrates with Pexels and Pixabay APIs for image search with intelligent failover.

## Features

- **GPU Management**: Monitors NVIDIA GPU utilization and throttles when busy
- **Vision Model Evaluation**: Uses llama3.2-vision or llava to score images
- **Multi-API Search**: Integrates with Pexels and Pixabay with automatic failover
- **Rate Limiting**: Built-in rate limiters prevent API abuse
- **Caching**: File-based cache for search results
- **Batch Processing**: Process multiple words efficiently
- **Automatic Approval**: Images scored on relevance, clarity, appropriateness, and quality

## Requirements

- Python 3.10+
- Ollama with a vision model installed
- (Optional) NVIDIA GPU for faster processing
- (Optional) Pexels and/or Pixabay API keys for image search

## Setup

```bash
# Install dependencies
cd image-curator
pip install -r requirements.txt

# Pull a vision model (if not already installed)
ollama pull llama3.2-vision

# Set API keys (optional, for image search)
export PEXELS_API_KEY="your-pexels-key"
export PIXABAY_API_KEY="your-pixabay-key"
```

### Getting API Keys

1. **Pexels**: Sign up at https://www.pexels.com/api/ (free, 200 requests/hour)
2. **Pixabay**: Sign up at https://pixabay.com/api/docs/ (free, 100 requests/minute)

## Usage

### Check System Status
```bash
python curator.py --status
```

### Evaluate Single Image
```bash
python curator.py --evaluate "https://example.com/image.jpg" \
    --word "gato" \
    --translation "cat" \
    --context "Animals category"
```

### Search for Images (API Client)
```python
from api_client import create_api_client
import asyncio

async def search():
    client = create_api_client()
    results = await client.search_for_word(
        portuguese_word='gato',
        english_translation='cat',
        category='animals',
        count=5
    )
    for img in results:
        print(f"{img.source}: {img.url}")

asyncio.run(search())
```

### Full Curation Pipeline
```python
from image_search import create_orchestrator
import asyncio

async def curate():
    orchestrator = create_orchestrator(enable_vision=True)
    
    results = await orchestrator.search_and_evaluate(
        portuguese_word='gato',
        english_translation='cat',
        category='animals',
        search_count=5,
        return_count=1,
        use_vision=True
    )
    
    for img, score in results:
        print(f"Score {score:.2f}: {img.url}")
        print(f"Attribution: {img.attribution}")

asyncio.run(curate())
```

### Batch Processing
```python
from image_search import create_orchestrator
import asyncio

async def batch_curate():
    orchestrator = create_orchestrator()
    
    words = [
        {'portuguese': 'gato', 'english': 'cat', 'category': 'animals'},
        {'portuguese': 'cão', 'english': 'dog', 'category': 'animals'},
        {'portuguese': 'três', 'english': 'three', 'category': 'numbers'}
    ]
    
    results = await orchestrator.curate_vocabulary_list(
        words=words,
        batch_size=3,
        use_vision=False  # Faster without vision evaluation
    )
    
    for word, images in results.items():
        print(f"{word}: {len(images)} images found")

asyncio.run(batch_curate())
```

## Scoring Criteria

Each image is scored 0-10 on:
- **Relevance**: Does the image clearly represent the word?
- **Clarity**: Is the main subject unambiguous?
- **Appropriateness**: Suitable for all-ages educational content?
- **Quality**: Well-composed and professional?

Default approval requires:
- Average score ≥ 7.0/10
- OR: Relevance ≥ 7 AND average ≥ 6.0

## Configuration

Edit `api_config.json` to configure APIs:

```json
{
  "apis": {
    "pexels": {
      "enabled": true,
      "priority": 1,
      "rate_limit": { "requests_per_hour": 200 }
    },
    "pixabay": {
      "enabled": true,
      "priority": 2,
      "rate_limit": { "requests_per_minute": 100 }
    }
  }
}
```

## Integration

The curator integrates with the main app via:
1. Admin dashboard for manual curation
2. API endpoint for batch processing
3. Scheduled jobs for periodic validation

## GPU Notes

- Automatically detects NVIDIA GPUs
- Pauses when utilization > 75%
- Falls back to CPU if no GPU available
