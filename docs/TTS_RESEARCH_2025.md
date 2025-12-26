# European Portuguese (PT-PT) TTS Research — 2025

Comprehensive research into text-to-speech options for European Portuguese, conducted January 2025. This document evaluates commercial APIs, open-source models, and browser-native solutions for high-quality PT-PT voice synthesis.

---

## Executive Summary

**Best Options Ranked:**

| Rank | Solution | Quality | Cost | Integration | PT-PT Support |
|------|----------|---------|------|-------------|---------------|
| 🥇 | **Edge-TTS** | ★★★★★ | FREE | Medium | Native (3 voices) |
| 🥈 | **Chatterbox Multilingual** | ★★★★★ | FREE (self-host) | Medium | Native + Voice Clone |
| 🥉 | **Microsoft Azure TTS** | ★★★★★ | $4/1M chars | Easy (API) | Native Neural |
| 4 | **Amazon Polly** | ★★★★☆ | $4/1M chars | Easy (API) | Native Neural |
| 5 | **Fish Audio** | ★★★★★ | Freemium | Easy (API) | 70+ langs + Clone |
| 6 | **Piper (Browser via WASM)** | ★★★☆☆ | FREE | Medium | 1 voice (tugão) |
| 7 | **Coqui XTTS v2** | ★★★★☆ | FREE (self-host) | Complex | European PT model |
| 8 | **Parler-TTS Multilingual** | ★★★★☆ | FREE (self-host) | Complex | Portuguese (unclear variant) |
| 9 | **Google Cloud TTS** | ★★★★☆ | $4-16/1M chars | Easy (API) | pt-PT Neural2 |

**❌ NOT Recommended for PT-PT:**
- **OpenAI TTS** — Only American accent for Portuguese (confirmed by community)
- **Kokoro TTS** — Only pt-BR (Brazilian), no pt-PT support
- **ElevenLabs** — Brazilian accent when selecting Portuguese (per Reddit)

---

## Detailed Analysis

### 1. Edge-TTS (via `edge-tts` Python Package) ⭐ RECOMMENDED

**Overview:** Free access to Microsoft Edge's online TTS service without API key. Uses the same high-quality neural voices as Azure TTS.

**PT-PT Voices:**
- `pt-PT-RaquelNeural` (Female) — Natural, clear
- `pt-PT-DuarteNeural` (Male) — Natural, professional  
- `pt-PT-FernandaNeural` (Female) — Added recently

**Pros:**
- ✅ Completely FREE (no API key, no limits documented)
- ✅ Neural quality identical to Azure
- ✅ Rate/volume/pitch control via SSML
- ✅ Generates subtitles alongside audio
- ✅ 9.6k GitHub stars, actively maintained
- ✅ Used by 4,100+ projects

**Cons:**
- ❌ Requires Python backend or proxy service
- ❌ Depends on Microsoft's Edge service availability
- ❌ Not browser-native (needs server-side generation)

**Integration Path:**
```python
import edge_tts
import asyncio

async def generate_portuguese():
    communicate = edge_tts.Communicate(
        "Olá, como está?",
        "pt-PT-RaquelNeural"
    )
    await communicate.save("output.mp3")

asyncio.run(generate_portuguese())
```

**Repository:** https://github.com/rany2/edge-tts

---

### 2. Chatterbox Multilingual ⭐ RECOMMENDED (Self-Hosted)

**Overview:** Resemble AI's MIT-licensed production-grade TTS with voice cloning. Supports 22 languages including Portuguese with the 🇵🇹 flag (European).

**Key Features:**
- Voice cloning with 10-30 seconds of audio
- Emotion exaggeration control (unique feature)
- OpenAI API compatible endpoints
- Outperforms ElevenLabs in benchmarks

**Supported Languages (22):**
```
ar, da, de, el, en, es, fi, fr, he, hi, it, ja, ko, ms, nl, no, pl, pt, ru, sv, sw, tr
```

**PT Support:** `pt` = Portuguese 🇵🇹 (flag indicates European)

**Pros:**
- ✅ FREE and open source (MIT license)
- ✅ Voice cloning capability
- ✅ Emotion control
- ✅ Self-hostable (privacy)
- ✅ OpenAI API compatible

**Cons:**
- ❌ Requires GPU for inference (L40/A6000 recommended)
- ❌ Complex deployment
- ❌ Portuguese quality untested vs Azure

**Integration:** Docker + Python API server
**Repository:** https://github.com/ResembleAI/chatterbox

---

### 3. Microsoft Azure TTS (Commercial)

**Overview:** Industry-leading neural TTS with extensive language support. Used by enterprise applications.

**PT-PT Voices:**
- `pt-PT-RaquelNeural` (Female)
- `pt-PT-DuarteNeural` (Male)
- `pt-PT-FernandaNeural` (Female)

**Pricing:** ~$4 per 1 million characters (Neural voices)

**Pros:**
- ✅ Highest quality neural voices
- ✅ Official SDK for many languages
- ✅ SSML support for fine control
- ✅ Real-time streaming

**Cons:**
- ❌ Requires Azure account
- ❌ Pay-per-use costs
- ❌ API key management

---

### 4. Amazon Polly (Commercial)

**Overview:** AWS text-to-speech service. **Duolingo uses Polly for all their TTS.**

**PT-PT Voices:**
- `Inês` / `Ines` (Female, Neural) — Announced neural in 2022
- `Cristiano` (Male)

**Pricing:** ~$4 per 1 million characters (Neural), $1 for Standard

**Duolingo's Choice:** Per AWS blog, Duolingo chose Polly because:
> "TTS provides consistency across all content, allows rapid iteration, and scales better than human recordings"

**Pros:**
- ✅ Proven at scale (Duolingo)
- ✅ Neural Inês voice is high quality
- ✅ AWS ecosystem integration
- ✅ Lexicons for pronunciation customization

**Cons:**
- ❌ AWS account required
- ❌ Pay-per-use costs
- ❌ Fewer PT-PT voices than Azure

---

### 5. Fish Audio (Commercial + Free Tier)

**Overview:** AI voice platform with 1000+ voices in 70+ languages, voice cloning with 15 seconds of audio.

**Features:**
- Ultra-low latency API
- Voice cloning
- Emotion control
- 200,000+ community voices

**Pros:**
- ✅ Free tier available
- ✅ Massive voice library
- ✅ Easy API integration
- ✅ Voice cloning

**Cons:**
- ❌ Quality varies by voice
- ❌ Paid for heavy usage

**Website:** https://fish.audio

---

### 6. Piper TTS (Browser via WASM)

**Overview:** Fast, local neural TTS. Can run in browser via WebAssembly using `@mintplex-labs/piper-tts-web` or sherpa-onnx.

**PT-PT Voices:**
- `pt_PT-tugão-medium` — Only 1 official voice
- Repository is **ARCHIVED** (no new development)

**Browser Integration:**
```javascript
import { PiperTTS } from '@mintplex-labs/piper-tts-web';

const piper = new PiperTTS();
await piper.download('pt_PT-tugão-medium');
const audio = await piper.synthesize('Olá mundo');
```

**Pros:**
- ✅ Runs entirely in browser (no server)
- ✅ Fast inference
- ✅ Privacy (offline capable)
- ✅ Free

**Cons:**
- ❌ Only 1 PT-PT voice
- ❌ Repository archived
- ❌ Lower quality than neural APIs

**NPM:** https://www.npmjs.com/package/@mintplex-labs/piper-tts-web

---

### 7. Coqui TTS / XTTS v2 (Open Source)

**Overview:** Open-source TTS with multilingual support and voice cloning. Fork maintained at `idiap/coqui-ai-TTS`.

**Portuguese Model:**
- `tts_models/pt/cv/vits` — European Portuguese (trained on Common Voice)

**XTTS v2 Features:**
- Voice cloning with 6-second reference
- 17 languages including Portuguese
- Zero-shot voice transfer

**Pros:**
- ✅ Open source
- ✅ European Portuguese model exists
- ✅ Voice cloning
- ✅ Self-hostable

**Cons:**
- ❌ Original Coqui company shut down
- ❌ Complex setup
- ❌ Requires Python 3.10

**Repository:** https://github.com/idiap/coqui-ai-TTS

---

### 8. Parler-TTS (Open Source)

**Overview:** Lightweight open-source TTS from Hugging Face. Multilingual version supports 8 European languages.

**Languages:** English, French, Spanish, Portuguese, Polish, German, Italian, Dutch

**Note:** Portuguese support is listed, but unclear if European or Brazilian variant.

**Pros:**
- ✅ Fully open source
- ✅ Lightweight model
- ✅ Prompt-based voice control

**Cons:**
- ❌ Portuguese variant unclear
- ❌ Requires Python backend

**Repository:** https://huggingface.co/parler-tts/parler-tts-mini-multilingual-v1.1

---

### 9. Orpheus TTS (Open Source - 2025)

**Overview:** New 2025 open-source TTS powered by Llama-3b backbone. Supports multiple languages including Portuguese.

**Languages:** English, Spanish, French, German, Italian, Portuguese, and more

**Note:** GitHub issue requesting "Official Brazilian Portuguese" suggests current support may be European or generic.

**Pros:**
- ✅ Very human-like output
- ✅ Open source
- ✅ Active development

**Cons:**
- ❌ Heavy model (requires GPU)
- ❌ Portuguese quality unverified

**Repository:** https://github.com/canopyai/Orpheus-TTS

---

### 10. F5-TTS (Open Source - Voice Cloning)

**Overview:** Breakthrough voice cloning technology from 2024. Clone voices with 10-15 seconds of audio.

**Portuguese:** Community model `firstpixel/F5-TTS-pt-br` exists for Brazilian Portuguese (pt-BR).

**No PT-PT model yet**, but could be trained with European Portuguese data.

**Pros:**
- ✅ Excellent voice cloning
- ✅ Free and open source
- ✅ Fast inference

**Cons:**
- ❌ Only pt-BR model available
- ❌ Would need to train PT-PT model

---

## Web Speech API (Browser Native)

**Overview:** Built-in browser TTS. Quality depends on OS and browser.

**PT-PT Voice Availability:**
- **Windows 10/11:** Microsoft voices via Edge
- **macOS:** Limited Portuguese support
- **Linux:** eSpeak (robotic quality)
- **Chrome:** Uses system voices + some Google voices
- **Edge:** Full access to Microsoft Neural voices

**Implementation (Current in app):**
```javascript
const utterance = new SpeechSynthesisUtterance(text);
utterance.lang = 'pt-PT';
speechSynthesis.speak(utterance);
```

**Pros:**
- ✅ Zero cost
- ✅ No backend needed
- ✅ Instant integration

**Cons:**
- ❌ Inconsistent across devices
- ❌ Quality varies wildly
- ❌ Limited control

---

## How Language Learning Apps Do It (2025)

| App | Approach | PT-PT Support |
|-----|----------|---------------|
| **Duolingo** | Amazon Polly TTS | Only Brazilian PT |
| **Babbel** | Native speaker recordings | European Portuguese ✅ |
| **Pimsleur** | Native speaker recordings | European Portuguese ✅ |
| **Mondly** | TTS (unknown provider) | European Portuguese |
| **Busuu** | Native recordings + TTS | Mixed |

**Key Insight:** Premium apps (Babbel, Pimsleur) use actual native speaker recordings for best quality. Budget apps use TTS with varying quality.

---

## Recommended Implementation Strategy

### Phase 1: Immediate (Browser + Edge-TTS Proxy)
1. Keep Web Speech API as fallback (current)
2. Add Edge-TTS via simple Python/Node proxy
3. Cache generated audio for repeated phrases

### Phase 2: Enhanced (Voice Variety)
1. Pre-generate audio for all lesson content
2. Store as static assets (no runtime TTS needed)
3. Use Edge-TTS for dynamic content only

### Phase 3: Advanced (Voice Cloning)
1. Self-host Chatterbox Multilingual
2. Create custom PT-PT voice from quality samples
3. Generate entire lesson library with consistent voice

---

## Quick Reference: PT-PT Voice IDs

| Provider | Voice ID | Gender |
|----------|----------|--------|
| Azure/Edge | `pt-PT-RaquelNeural` | Female |
| Azure/Edge | `pt-PT-DuarteNeural` | Male |
| Azure/Edge | `pt-PT-FernandaNeural` | Female |
| Amazon Polly | `Ines` | Female (Neural) |
| Amazon Polly | `Cristiano` | Male |
| Google Cloud | `pt-PT-Standard-*` | Various |
| Google Cloud | `pt-PT-Wavenet-*` | Various |
| Piper | `pt_PT-tugão-medium` | Male |
| Coqui | `tts_models/pt/cv/vits` | Male |

---

## Conclusion

**For this project, Edge-TTS is the clear winner:**
- FREE (no API costs)
- High-quality neural voices (same as paid Azure)
- 3 PT-PT voices (2 female, 1 male)
- Active community (9.6k stars)
- Simple Python integration

**Fallback strategy:** Piper via WASM for offline/browser-only scenarios, Web Speech API as final fallback.

---

*Last updated: January 2025*
*Research conducted for Learning Portuguese v0.5.x*
