# 🖼️ AI Image Curator - Implementation Plan

**Created**: December 31, 2025  
**Status**: Planning Complete - Ready for Implementation  
**Priority**: High (Critical for lesson quality)

---

## Executive Summary

Build an autonomous, LLM-powered image curation system that:
1. Scans all vocabulary words across lessons
2. Queries free image APIs (Pexels + Pixabay)
3. Uses local vision AI (via Ollama) to validate image relevance
4. Saves curated images with full metadata
5. Updates CSV files with validated image URLs
6. Provides admin console for control and monitoring

---

## Requirements (User-Specified)

### Core Requirements
- **100% Free**: No paid APIs, no throttling concerns
- **GPU Throttle**: 75% maximum at all times
- **Controllable**: Start/stop from admin dashboard
- **Visible**: Real-time view of processing and image selection
- **Offline When Done**: AI process terminates after task completion
- **Local-First**: All processing on local machine via Ollama

### Technical Constraints
- **2x 11GB VRAM GPUs available** - Use whichever has lowest utilization
- **No API rate limit issues** - Use multiple sources with fallback
- **Image Size**: 1200×900 JPEG at 85% quality
- **Cloud-Ready**: Design for future AWS S3 migration

---

## Implementation Branches (7 Total)

### Branch 1: `feature/IMG-001-skip-missing-images`
**Purpose**: Skip challenges without valid images (no heart loss)

**Tasks**:
1. Update `ChallengeRenderer.js` to detect missing images
2. Add `imageRequired` flag to challenge types that need images
3. Skip challenge if image missing or placeholder
4. No heart penalty for skipped challenges
5. Show visual indicator that challenge was skipped
6. Add telemetry for skipped challenges

**Files**:
- `src/components/lesson/ChallengeRenderer.js`
- `src/config/lessonTemplates.config.js`
- `src/services/Logger.js`

**Tests**:
- Challenge skips when image_url is empty
- Challenge skips when image_url is placeholder
- No heart loss on skip
- Telemetry fires correctly

---

### Branch 2: `feature/IMG-002-curator-core`
**Purpose**: Python curator service with vision model integration

**Directory Structure**:
```
image-curator/
├── curator.py           # Main entry point
├── config.py            # Configuration management
├── gpu_manager.py       # GPU selection & throttling
├── vision_client.py     # Ollama vision model interface
├── word_scanner.py      # CSV word extraction
├── image_processor.py   # Download, resize, optimize
├── db.py               # SQLite for image library
├── websocket_server.py  # Real-time comms to frontend
├── requirements.txt     # Python dependencies
└── README.md           # Usage instructions
```

**GPU Management**:
```python
# gpu_manager.py
import subprocess
import json

def get_gpu_utilization():
    """Get utilization for all GPUs"""
    result = subprocess.run(
        ['nvidia-smi', '--query-gpu=index,utilization.gpu,memory.used,memory.total', 
         '--format=csv,noheader,nounits'],
        capture_output=True, text=True
    )
    gpus = []
    for line in result.stdout.strip().split('\n'):
        idx, util, mem_used, mem_total = line.split(', ')
        gpus.append({
            'index': int(idx),
            'utilization': int(util),
            'memory_used': int(mem_used),
            'memory_total': int(mem_total)
        })
    return gpus

def select_best_gpu():
    """Select GPU with lowest utilization"""
    gpus = get_gpu_utilization()
    best = min(gpus, key=lambda g: g['utilization'])
    return best['index']

def check_throttle():
    """Return True if we should pause (>75% utilization)"""
    gpus = get_gpu_utilization()
    current = gpus[select_best_gpu()]
    return current['utilization'] > 75
```

**Vision Model Interface**:
```python
# vision_client.py
import ollama
import base64

class VisionClient:
    def __init__(self, model='qwen2.5-vl:8b'):
        self.model = model
        
    def evaluate_image(self, image_path: str, target_word: str, context: str) -> dict:
        """Score image relevance to target word"""
        with open(image_path, 'rb') as f:
            image_data = base64.b64encode(f.read()).decode()
        
        prompt = f"""
        You are evaluating if this image is appropriate for teaching the Portuguese word "{target_word}".
        Context: {context}
        
        Score the image on these criteria (0-10 each):
        1. RELEVANCE: Does the image clearly show/represent "{target_word}"?
        2. CLARITY: Is the main subject clear and not confusing?
        3. APPROPRIATENESS: Is it suitable for educational content?
        4. QUALITY: Is the image well-composed and professional?
        
        Respond ONLY in JSON format:
        {{"relevance": X, "clarity": X, "appropriateness": X, "quality": X, "reason": "brief explanation", "recommended": true/false}}
        """
        
        response = ollama.chat(
            model=self.model,
            messages=[{
                'role': 'user',
                'content': prompt,
                'images': [image_data]
            }]
        )
        
        return self._parse_response(response['message']['content'])
```

**Dependencies** (`requirements.txt`):
```
ollama>=0.1.0
pillow>=10.0.0
requests>=2.31.0
aiohttp>=3.9.0
websockets>=12.0
aiosqlite>=0.19.0
nvidia-ml-py3>=7.352.0
pydantic>=2.0.0
```

---

### Branch 3: `feature/IMG-003-api-integration`
**Purpose**: Pexels + Pixabay API integration with failover

**API Configuration** (`apis.json`):
```json
{
  "apis": {
    "pexels": {
      "enabled": true,
      "priority": 1,
      "base_url": "https://api.pexels.com/v1",
      "key_env_var": "PEXELS_API_KEY",
      "rate_limit": {
        "requests_per_hour": 200,
        "note": "Can request unlimited access"
      },
      "features": {
        "search": true,
        "alt_text": true,
        "attribution_required": true
      }
    },
    "pixabay": {
      "enabled": true,
      "priority": 2,
      "base_url": "https://pixabay.com/api",
      "key_env_var": "PIXABAY_API_KEY",
      "rate_limit": {
        "requests_per_minute": 100,
        "note": "Full API access available on request"
      },
      "features": {
        "search": true,
        "must_download": true,
        "attribution_required": true
      }
    }
  }
}
```

**API Client**:
```python
# api_client.py
import aiohttp
import os
from typing import List, Dict

class ImageAPIClient:
    def __init__(self, config_path='apis.json'):
        self.config = self._load_config(config_path)
        self.session = None
        
    async def search_images(self, query: str, count: int = 3) -> List[Dict]:
        """Search across all enabled APIs"""
        results = []
        
        for api_name, api_config in sorted(
            self.config['apis'].items(), 
            key=lambda x: x[1]['priority']
        ):
            if not api_config['enabled']:
                continue
                
            try:
                api_results = await self._search_api(api_name, query, count)
                results.extend(api_results)
                
                if len(results) >= count:
                    break
            except Exception as e:
                print(f"API {api_name} failed: {e}")
                continue
                
        return results[:count]
    
    async def _search_pexels(self, query: str, count: int) -> List[Dict]:
        """Search Pexels API"""
        headers = {'Authorization': os.getenv('PEXELS_API_KEY')}
        url = f"https://api.pexels.com/v1/search?query={query}&per_page={count}"
        
        async with self.session.get(url, headers=headers) as resp:
            data = await resp.json()
            return [{
                'url': photo['src']['large'],
                'alt': photo.get('alt', ''),
                'source': 'pexels',
                'photographer': photo['photographer'],
                'source_url': photo['url']
            } for photo in data.get('photos', [])]
    
    async def _search_pixabay(self, query: str, count: int) -> List[Dict]:
        """Search Pixabay API"""
        key = os.getenv('PIXABAY_API_KEY')
        url = f"https://pixabay.com/api/?key={key}&q={query}&per_page={count}&image_type=photo"
        
        async with self.session.get(url) as resp:
            data = await resp.json()
            return [{
                'url': hit['largeImageURL'],
                'alt': hit.get('tags', ''),
                'source': 'pixabay',
                'user': hit['user'],
                'source_url': hit['pageURL']
            } for hit in data.get('hits', [])]
```

---

### Branch 4: `feature/IMG-004-admin-console`
**Purpose**: Admin UI for curator control and live view

**Components**:

1. **ImageCuratorConsole.js** - Main console component
```javascript
// src/pages/admin/ImageCuratorConsole.js
export class ImageCuratorConsole {
    constructor(container) {
        this.container = container;
        this.ws = null;
        this.isRunning = false;
        this.currentWord = null;
        this.candidateImages = [];
    }
    
    render() {
        return `
            <div class="curator-console">
                <div class="curator-header">
                    <h2>🖼️ AI Image Curator</h2>
                    <div class="curator-controls">
                        <button id="btn-start-curator" class="btn btn-success">
                            ▶️ Start Curator
                        </button>
                        <button id="btn-stop-curator" class="btn btn-danger" disabled>
                            ⏹️ Stop Curator
                        </button>
                    </div>
                </div>
                
                <div class="curator-status">
                    <div class="status-indicator" id="curator-status">
                        <span class="status-dot offline"></span>
                        <span>Offline</span>
                    </div>
                    <div class="gpu-stats" id="gpu-stats">
                        GPU: --% | VRAM: --/-- GB
                    </div>
                </div>
                
                <div class="curator-config">
                    <label>Vision Model:
                        <select id="vision-model">
                            <option value="qwen2.5-vl:8b" selected>Qwen2.5-VL 8B (Recommended)</option>
                            <option value="qwen2.5-vl:4b">Qwen2.5-VL 4B (Faster)</option>
                            <option value="llava:7b">LLaVA 7B</option>
                            <option value="minicpm-v:8b">MiniCPM-V 8B</option>
                        </select>
                    </label>
                    <label>Candidates per word:
                        <input type="number" id="candidates-count" value="3" min="1" max="10">
                    </label>
                    <label>
                        <input type="checkbox" id="crash-resume" checked>
                        Resume on crash
                    </label>
                </div>
                
                <div class="curator-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" id="progress-fill" style="width: 0%"></div>
                    </div>
                    <span id="progress-text">0/0 words processed</span>
                </div>
                
                <div class="curator-current">
                    <h3>Currently Processing</h3>
                    <div class="current-word" id="current-word">
                        Waiting to start...
                    </div>
                    <div class="candidate-images" id="candidate-images">
                        <!-- Candidate images will be rendered here -->
                    </div>
                </div>
                
                <div class="curator-log">
                    <h3>Activity Log</h3>
                    <div class="log-container" id="curator-log">
                        <!-- Log entries -->
                    </div>
                </div>
            </div>
        `;
    }
    
    async startCurator() {
        // Connect WebSocket and start Python curator
        this.ws = new WebSocket('ws://localhost:8765');
        this.ws.onmessage = (event) => this.handleMessage(JSON.parse(event.data));
        
        // Start Python process via server API
        await fetch('/api/curator/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: document.getElementById('vision-model').value,
                candidates: parseInt(document.getElementById('candidates-count').value),
                resumeOnCrash: document.getElementById('crash-resume').checked
            })
        });
    }
    
    async stopCurator() {
        await fetch('/api/curator/stop', { method: 'POST' });
        this.ws?.close();
    }
    
    handleMessage(msg) {
        switch (msg.type) {
            case 'status':
                this.updateStatus(msg.data);
                break;
            case 'progress':
                this.updateProgress(msg.data);
                break;
            case 'current_word':
                this.showCurrentWord(msg.data);
                break;
            case 'candidates':
                this.showCandidates(msg.data);
                break;
            case 'selected':
                this.showSelected(msg.data);
                break;
            case 'log':
                this.addLogEntry(msg.data);
                break;
            case 'gpu':
                this.updateGPUStats(msg.data);
                break;
        }
    }
    
    showCandidates(candidates) {
        const container = document.getElementById('candidate-images');
        container.innerHTML = candidates.map((c, i) => `
            <div class="candidate ${c.selected ? 'selected' : ''}" data-index="${i}">
                <img src="${c.url}" alt="${c.alt}">
                <div class="candidate-info">
                    <div class="score">Score: ${c.score}/40</div>
                    <div class="source">${c.source}</div>
                    ${c.selected ? '<div class="selected-badge">✓ Selected</div>' : ''}
                </div>
            </div>
        `).join('');
    }
}
```

2. **Curator Styles** (`src/styles/curator.css`):
```css
.curator-console {
    padding: 1.5rem;
    background: var(--bg-secondary);
    border-radius: 12px;
}

.curator-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.curator-controls button {
    margin-left: 0.5rem;
}

.status-indicator {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.status-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
}

.status-dot.offline { background: #6b7280; }
.status-dot.running { background: #22c55e; animation: pulse 1s infinite; }
.status-dot.paused { background: #f59e0b; }
.status-dot.error { background: #ef4444; }

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}

.candidate-images {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    margin-top: 1rem;
}

.candidate {
    border: 2px solid transparent;
    border-radius: 8px;
    overflow: hidden;
    transition: all 0.2s;
}

.candidate.selected {
    border-color: var(--success);
    box-shadow: 0 0 12px rgba(34, 197, 94, 0.3);
}

.candidate img {
    width: 100%;
    height: 150px;
    object-fit: cover;
}

.candidate-info {
    padding: 0.5rem;
    background: var(--bg-primary);
}

.progress-bar {
    height: 8px;
    background: var(--bg-tertiary);
    border-radius: 4px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--primary), var(--success));
    transition: width 0.3s;
}

.curator-log {
    max-height: 200px;
    overflow-y: auto;
    font-family: monospace;
    font-size: 0.85rem;
}

.log-entry {
    padding: 0.25rem 0.5rem;
    border-bottom: 1px solid var(--border);
}

.log-entry.error { color: var(--error); }
.log-entry.success { color: var(--success); }
```

---

### Branch 5: `feature/IMG-005-image-library`
**Purpose**: Searchable image database with cloud-ready structure

**Database Schema** (SQLite, designed for AWS migration):
```sql
-- images.db
CREATE TABLE images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    word TEXT NOT NULL,
    lesson_id TEXT,
    url TEXT NOT NULL,
    local_path TEXT,
    source TEXT NOT NULL,  -- 'pexels', 'pixabay', 'manual'
    source_url TEXT,
    photographer TEXT,
    alt_text TEXT,
    description TEXT,
    category TEXT,
    tags TEXT,  -- JSON array
    width INTEGER,
    height INTEGER,
    file_size INTEGER,
    format TEXT,
    
    -- AI validation
    ai_score_relevance INTEGER,
    ai_score_clarity INTEGER,
    ai_score_appropriateness INTEGER,
    ai_score_quality INTEGER,
    ai_score_total INTEGER,
    ai_model TEXT,
    ai_reason TEXT,
    ai_validated_at DATETIME,
    
    -- Status
    status TEXT DEFAULT 'candidate',  -- 'candidate', 'selected', 'rejected', 'manual'
    manually_verified BOOLEAN DEFAULT FALSE,
    verified_by TEXT,
    verified_at DATETIME,
    
    -- Metadata
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(word, url)
);

CREATE INDEX idx_images_word ON images(word);
CREATE INDEX idx_images_lesson ON images(lesson_id);
CREATE INDEX idx_images_status ON images(status);
CREATE INDEX idx_images_category ON images(category);

CREATE TABLE image_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    image_id INTEGER,
    action TEXT,  -- 'created', 'selected', 'rejected', 'verified'
    actor TEXT,   -- 'ai', 'admin:username'
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (image_id) REFERENCES images(id)
);
```

**Local Storage Structure**:
```
assets/
└── images/
    ├── image-not-found.svg
    └── library/
        ├── greetings/
        │   ├── ola_pexels_12345.jpg
        │   └── ola_pexels_12345.json  # metadata sidecar
        ├── numbers/
        ├── family/
        ├── food/
        ├── transport/
        ├── weather/
        └── body/
```

**Metadata Sidecar** (`*.json`):
```json
{
  "word": "olá",
  "lesson": "001_greetings",
  "source": "pexels",
  "source_url": "https://www.pexels.com/photo/12345",
  "photographer": "John Doe",
  "license": "Pexels License",
  "attribution": "Photo by John Doe on Pexels",
  "original_url": "https://images.pexels.com/...",
  "downloaded_at": "2025-12-31T14:30:00Z",
  "dimensions": { "width": 1200, "height": 900 },
  "file_size": 245000,
  "ai_validation": {
    "model": "qwen2.5-vl:8b",
    "scores": {
      "relevance": 9,
      "clarity": 8,
      "appropriateness": 10,
      "quality": 8,
      "total": 35
    },
    "reason": "Clear image of person waving hello, suitable for teaching greetings",
    "validated_at": "2025-12-31T14:30:05Z"
  }
}
```

---

### Branch 6: `feature/IMG-006-refinements`
**Purpose**: Queue management, pause/resume, manual overrides

**Features**:

1. **Queue Management**:
   - Priority queue (words without images first)
   - Resume from last position on crash
   - Skip already-curated words

2. **Manual Override Console**:
```javascript
// AdminImageOverride component
renderOverridePanel(word) {
    return `
        <div class="override-panel">
            <h4>Manual Override: ${word}</h4>
            <div class="current-image">
                <img src="${this.getCurrentImage(word)}" alt="Current">
                <span>Current Selection</span>
            </div>
            <div class="override-options">
                <button class="btn" onclick="this.searchNew('${word}')">
                    🔍 Search New Images
                </button>
                <button class="btn" onclick="this.uploadCustom('${word}')">
                    📤 Upload Custom
                </button>
                <button class="btn" onclick="this.rejectCurrent('${word}')">
                    ❌ Reject & Skip
                </button>
            </div>
            <div class="rejected-images">
                <h5>Previously Rejected</h5>
                <!-- Show rejected alternatives -->
            </div>
        </div>
    `;
}
```

3. **Batch Operations**:
   - Re-validate all images with new model
   - Export/import image mappings
   - Bulk URL replacement

---

## Vision Model Research (December 2025 - Latest)

> **Research Sources**: Ollama Library, Koyeb, Labellerr, DataCamp, HuggingFace, Reddit r/ollama, PhotoPrism docs, GitHub (OpenBMB/MiniCPM-V)

### Recommended Models for 11GB VRAM GPUs (via Ollama)

| Model | Parameters | VRAM Needed | Speed | Quality | Best For |
|-------|------------|-------------|-------|---------|----------|
| **Qwen2.5-VL 7B** | 7B | ~6-8GB | Fast | Excellent | **Recommended default** - Best overall accuracy |
| Qwen2.5-VL 3B | 3B | ~4GB | Very Fast | Very Good | Speed priority, nearly as good as 7B |
| **Gemma 3 4B** | 4B | ~5GB | Fast | Excellent | Great vision + multilingual (140+ languages) |
| Gemma 3 12B | 12B | ~9-11GB | Medium | Superior | If VRAM allows, excellent quality |
| MiniCPM-V 8B | 8B | ~6-8GB | Fast | Excellent | Strong OCR, beats GPT-4o mini |
| LLaVA 7B | 7B | ~5-6GB | Fast | Good | Well-documented, stable |
| Llama 3.2 Vision 11B | 11B | ~8-10GB | Medium | Excellent | Strong document understanding |
| Qwen3-VL 8B | 8B | ~6-8GB | Fast | Excellent | Latest Qwen, most powerful |

### Latest Model Updates (Q4 2024 - Q1 2025)

#### 🥇 **Qwen2.5-VL Series** (Alibaba - January 2025)
- **7B model on par with GPT-4o mini** according to benchmarks
- **3B model performs like previous 7B** - excellent efficiency
- Native Dynamic Resolution ViT handles diverse image sizes
- Supports 29 languages including Portuguese
- 128K context window
- Apache 2.0 license
- **Ollama**: `ollama pull qwen2.5vl:7b` or `ollama pull qwen2.5vl:3b`

#### 🥈 **Gemma 3** (Google DeepMind - March 2025)
- 4B, 12B, 27B parameter sizes available
- "Pan & Scan" algorithm for high-resolution text reading
- SigLIP vision encoder (896×896 images)
- 128K context window, 140+ languages
- Excellent for multilingual OCR
- **Ollama**: `ollama pull gemma3:4b` or `ollama pull gemma3:12b`

#### 🥉 **MiniCPM-V 2.6/4.5** (OpenBMB - Late 2024)
- **8B parameters, surpasses GPT-4o mini, GPT-4V, Claude 3.5 Sonnet** for single image
- Processes up to 1.8 million pixels (1344×1344)
- State-of-the-art OCRBench performance
- Only 640 tokens for 1.8M pixel image (75% fewer than others)
- Low hallucination rates
- **Ollama**: `ollama pull minicpm-v:8b`

#### **Qwen3-VL** (Alibaba - October 2024)
- Latest in Qwen family (2B, 4B, 8B, 30B, 32B sizes)
- Most powerful vision-language model in Qwen series
- **Ollama**: `ollama pull qwen3-vl:8b`

#### **Llama 3.2 Vision** (Meta - September 2024)
- 11B and 90B sizes
- 128K context window
- Strong in VQA, captioning, document understanding
- Community license allows commercial use
- **Ollama**: `ollama pull llama3.2-vision:11b`

### Model Comparison for Image Classification Task

Based on PhotoPrism's vision model comparison (Dec 2024):
```
Qwen2.5-VL:7B → Best overall accuracy, detailed captions, slower
Qwen2.5-VL:3B → Nearly as good, faster, less strong at OCR
Gemma 3:4B    → Excellent balance, great multilingual
MiniCPM-V:8b  → Best OCR, lowest hallucination
LLaVA:7b      → Good baseline, well-supported
```

### VRAM Requirements by Model Size

| Model Size | FP16 VRAM | Q4 Quantized | Q8 Quantized |
|------------|-----------|--------------|--------------|
| 3B | ~6GB | ~2.5GB | ~4GB |
| 4B | ~8GB | ~3GB | ~5GB |
| 7B | ~14GB | ~5GB | ~8GB |
| 8B | ~16GB | ~6GB | ~9GB |
| 11B | ~22GB | ~8GB | ~12GB |
| 12B | ~24GB | ~8GB | ~13GB |

**For 11GB VRAM**: Use Q4 quantized 7B/8B models or Q8 quantized 3B/4B models

### Model Installation Commands
```bash
# PRIMARY RECOMMENDATION - Best balance for 11GB VRAM
ollama pull qwen2.5vl:7b

# ALTERNATIVES
ollama pull qwen2.5vl:3b        # Faster, nearly as good
ollama pull gemma3:4b           # Google, excellent multilingual
ollama pull gemma3:12b          # Higher quality if VRAM allows
ollama pull minicpm-v:8b        # Best for OCR tasks
ollama pull qwen3-vl:8b         # Latest Qwen
ollama pull llava:7b            # Well-documented fallback
ollama pull llama3.2-vision:11b # Meta, strong document understanding
```

### Why Qwen2.5-VL 7B for Image Curation?

1. **Best overall accuracy** for image understanding tasks
2. **Fits in ~6GB VRAM** quantized, leaving room for 75% throttle
3. **Strong multilingual** - 29 languages including Portuguese
4. **Good at object identification** - critical for "does this image show X?"
5. **Detailed captions** - helps with metadata generation
6. **Apache 2.0 license** - fully commercial use
7. **Active community** - well-supported on Ollama (1.1M+ pulls)
8. **Structured output** - reliable JSON responses

### Alternative Strategy: Model Tiering

For maximum accuracy, use a tiered approach:
1. **Fast Pass**: Qwen2.5-VL 3B for initial candidate filtering
2. **Quality Pass**: Qwen2.5-VL 7B for final selection verification
3. **OCR Fallback**: MiniCPM-V 8B for text-heavy images

---

## API Setup Instructions

### Pexels API
1. Go to https://www.pexels.com/api/
2. Create free account
3. Get API key (instant approval)
4. Add to `.env`: `PEXELS_API_KEY=your_key`
5. Rate limit: 200/hour (can request unlimited)

### Pixabay API  
1. Go to https://pixabay.com/api/docs/
2. Create free account
3. Get API key (instant approval)
4. Add to `.env`: `PIXABAY_API_KEY=your_key`
5. Rate limit: 100/minute (full access available)

---

## Implementation Order

1. **IMG-001** (1-2 hours): Skip missing images logic
2. **IMG-002** (4-6 hours): Python curator core
3. **IMG-003** (2-3 hours): API integration
4. **IMG-004** (3-4 hours): Admin console UI
5. **IMG-005** (2-3 hours): Image library database
6. **IMG-006** (2-3 hours): Refinements and polish

**Total Estimated Time**: 14-21 hours

---

## Testing Strategy

### Unit Tests
- GPU manager selects lowest utilization GPU
- Vision client parses JSON responses correctly
- API client handles rate limits and failover
- Image processor resizes to correct dimensions

### Integration Tests
- Full pipeline: word → search → evaluate → save
- WebSocket communication with frontend
- Database operations

### E2E Tests (Playwright)
- Admin console loads and displays correctly
- Start/stop curator controls work
- Progress updates in real-time
- Images display in candidate grid

---

## Success Criteria

1. ✅ All vocabulary words have curated images
2. ✅ Images are validated by vision AI (score ≥28/40)
3. ✅ No rate limit errors from APIs
4. ✅ GPU stays under 75% utilization
5. ✅ Admin can start/stop/monitor curator
6. ✅ System recovers from crashes
7. ✅ Metadata fully tracked for all images

---

## Future Enhancements (Post-MVP)

- [ ] AWS S3 image hosting
- [ ] CDN integration for faster loading
- [ ] Automatic image refresh (check for broken URLs)
- [ ] A/B testing different images per word
- [ ] User feedback on image quality
- [ ] Batch processing multiple lessons in parallel

---

## Configuration Reference

### Environment Variables
```bash
# .env
PEXELS_API_KEY=your_pexels_key
PIXABAY_API_KEY=your_pixabay_key
CURATOR_VISION_MODEL=qwen2.5-vl:8b
CURATOR_CANDIDATES_PER_WORD=3
CURATOR_MIN_SCORE=28
CURATOR_GPU_THROTTLE=75
CURATOR_IMAGE_WIDTH=1200
CURATOR_IMAGE_HEIGHT=900
CURATOR_IMAGE_QUALITY=85
```

### Admin Dashboard Settings (UI)
- Vision model selection (dropdown)
- Candidates per word (1-10)
- Resume on crash (checkbox)
- GPU throttle percentage (slider)
- Minimum AI score threshold (slider)

---

**Document Version**: 1.0  
**Last Updated**: December 31, 2025  
**Author**: AI Assistant (GitHub Copilot)
