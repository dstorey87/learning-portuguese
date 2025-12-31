# Image Library Directory

This directory contains locally stored vocabulary images organized by category.

## Structure

```
library/
├── greetings/           # Greeting words
│   ├── ola.jpg
│   └── ola.jpg.json     # Metadata sidecar
├── numbers/             # Number vocabulary
├── colors/              # Color vocabulary
├── food/                # Food vocabulary
└── uncategorized/       # Images without category
```

## Metadata Sidecars

Each image has a corresponding `.json` metadata file containing:
- Source attribution (photographer, API source)
- AI validation scores
- Verification status
- Timestamps

## Usage

Images are managed by the Image Curator system. Do not manually modify files in this directory.

Use the admin dashboard Image Curator console or batch processing tools to:
- Add new images
- Review and approve candidates
- Update metadata
