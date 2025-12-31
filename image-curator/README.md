# Image Curator

AI-powered image curation for Portuguese vocabulary learning.

## Overview

This tool uses Ollama vision models to evaluate and curate images for vocabulary words, ensuring high-quality educational content.

## Features

- **GPU Management**: Monitors NVIDIA GPU utilization and throttles when busy
- **Vision Model Evaluation**: Uses llama3.2-vision or llava to score images
- **Batch Processing**: Process multiple words efficiently
- **Automatic Approval**: Images scored on relevance, clarity, appropriateness, and quality

## Requirements

- Python 3.10+
- Ollama with a vision model installed
- (Optional) NVIDIA GPU for faster processing

## Setup

```bash
# Install dependencies
cd image-curator
pip install -r requirements.txt

# Pull a vision model (if not already installed)
ollama pull llama3.2-vision
```

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

### Programmatic Usage
```python
from curator import ImageCurator

curator = ImageCurator(approval_threshold=7.0)

# Evaluate single image
result = curator.evaluate_single(
    word="gato",
    translation="cat",
    image_url="https://example.com/cat.jpg"
)

print(f"Status: {result.status}")
print(f"Score: {result.score.average_score}/10")
print(f"Reason: {result.score.reason}")
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

## Integration

The curator integrates with the main app via:
1. Admin dashboard for manual curation
2. API endpoint for batch processing
3. Scheduled jobs for periodic validation

## GPU Notes

- Automatically detects NVIDIA GPUs
- Pauses when utilization > 75%
- Falls back to CPU if no GPU available
