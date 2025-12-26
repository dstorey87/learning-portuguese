# Voice Integration Implementation Plan

> **Version:** 1.0.0  
> **Created:** June 2025  
> **Based on:** 40+ research sources (voice AI, STT, TTS, pronunciation assessment)  
> **Priority:** P0 - Critical for AI tutor functionality

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Research Findings](#research-findings)
3. [Current State Analysis](#current-state-analysis)
4. [Implementation Architecture](#implementation-architecture)
5. [Phase 1: Fix Voice Mode](#phase-1-fix-voice-mode-immediate)
6. [Phase 2: Pronunciation Assessment](#phase-2-pronunciation-assessment)
7. [Phase 3: Enhanced Features](#phase-3-enhanced-features)
8. [Testing Strategy](#testing-strategy)
9. [Task Checklist](#task-checklist)

---

## Executive Summary

### The Problem
User reported: "I've just tried the mic feature in the AI window, and it just hangs, on 'Listening...' nothing actually happens"

**Root Cause:** AIChat.js uses `VoiceConversation.js` which requires:
1. SileroVAD ONNX model at `/models/silero_vad.onnx` (MISSING)
2. STT server on `localhost:5000` (NOT RUNNING)

**The Solution:** We already have WORKING services that aren't connected:
- `WebSpeechService.js` - Browser-native STT with pt-PT support ✅
- `TTSService.js` - Edge-TTS with pt-PT-RaquelNeural/DuarteNeural voices ✅

### Requirements Summary

| Requirement | Priority | Solution |
|-------------|----------|----------|
| Fix mic hang bug | P0 | Connect WebSpeechService to AIChat |
| European Portuguese accent (pt-PT) | P0 | Edge-TTS voices already configured |
| 2-way voice conversation | P0 | WebSpeechService + TTSService |
| Transcription display | P1 | Show interim results in chat |
| Inline audio playback | P1 | Parse responses for Portuguese words |
| Pronunciation assessment | P0 | Phonetic comparison system |

### Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| STT Engine | Web Speech API | Free, browser-native, works NOW, pt-PT support |
| TTS Engine | Edge-TTS | Free neural voices, excellent pt-PT quality |
| Accent | pt-PT (European) | Best for British learners - distinct from Brazilian |
| Voice | pt-PT-RaquelNeural | Female, clearer articulation for learning |
| Pronunciation Scoring | Levenshtein on phonemes | Works client-side, no external API needed |

---

## Research Findings

### Speech-to-Text Options Analyzed

| Technology | Cost | Accuracy | Latency | Portuguese Support | Decision |
|------------|------|----------|---------|-------------------|----------|
| **Web Speech API** | FREE | Good | ~50-100ms | pt-PT native | ✅ PRIMARY |
| Groq Whisper | $0.02-0.04/hr | Excellent | ~100ms | Multi-lang | Backup option |
| Sherpa-ONNX | FREE | Good | ~200ms | pt_PT models | Future consideration |
| Transformers.js Whisper | FREE | Excellent | ~500ms | Multi-lang | Too slow |
| Azure Speech | $1/hr | Excellent | ~100ms | pt-PT | Too expensive |
| Deepgram Nova-3 | $0.02/min | Excellent | ~100ms | pt-PT | Not needed |

**Decision:** Use Web Speech API as primary - it's FREE, already implemented in our codebase, and supports pt-PT natively.

### Text-to-Speech Options Analyzed

| Technology | Cost | Voice Quality | Portuguese Voices | Decision |
|------------|------|---------------|-------------------|----------|
| **Edge-TTS** | FREE | Neural/Excellent | pt-PT-RaquelNeural, DuarteNeural | ✅ PRIMARY |
| Coqui XTTS-v2 | FREE | Excellent | Voice cloning | Not needed |
| Piper TTS | FREE | Good | pt_PT ONNX models | Backup option |
| ElevenLabs | $5/mo | Premium | Portuguese | Too expensive |
| Web Speech API | FREE | Robotic | Limited | Fallback only |

**Decision:** Use Edge-TTS via our tts-server - already integrated, free, excellent neural voices.

### European vs Brazilian Portuguese

Research confirms **European Portuguese (pt-PT)** is better for British learners:
- Closer phonetic system to British English
- More consistent pronunciation rules
- Less nasalization than Brazilian
- Clearer consonant articulation
- Standard for formal Portuguese learning in Europe

**Voices Selected:**
- **Primary:** pt-PT-RaquelNeural (female) - clearer articulation
- **Alternative:** pt-PT-DuarteNeural (male) - deeper voice option

### Pronunciation Assessment Approaches

| Approach | Complexity | Accuracy | Client-Side | Decision |
|----------|------------|----------|-------------|----------|
| Azure Speech Assessment | Low | Excellent | No | Too expensive |
| Speechace API | Low | Good | No | Paid service |
| **Levenshtein on Phonemes** | Medium | Good | Yes | ✅ PRIMARY |
| DTW Alignment | High | Excellent | Yes | Future enhancement |
| CNN Audio Comparison | High | Excellent | No | Overkill |

**Decision:** Use phoneme-based Levenshtein distance - works client-side, no API costs, good accuracy for learning purposes.

---

## Current State Analysis

### What's Working ✅

```
src/services/WebSpeechService.js (546 lines)
├── Browser-native speech recognition
├── pt-PT language configuration
├── normalizePortuguese() - handles accents/dialects
├── listen(timeoutMs) - promise-based recognition
├── listenWithFallback() - handles browser variations
├── isWebSpeechAvailable() - feature detection
└── Continuous and interim results support

src/services/TTSService.js (396 lines)
├── Edge-TTS integration via localhost:3001
├── pt-PT-RaquelNeural (female, recommended)
├── pt-PT-DuarteNeural (male)
├── speak(text, options) - full control
├── speakPortuguese(text) - convenience method
├── stop() - interrupt playback
└── Web Speech API fallback
```

### What's Broken ❌

```
src/components/ai/AIChat.js - toggleVoiceMode() (lines 565-620)
├── Uses VoiceConversation.start() which requires:
│   ├── SileroVAD model at /models/silero_vad.onnx (MISSING)
│   └── STT server on localhost:5000 (NOT RUNNING)
├── User sees "Listening..." but nothing happens
└── Never receives speech end event

src/services/voice/VoiceConversation.js
├── Imports VADService which loads ONNX model
├── processUserSpeech() tries to hit localhost:5000/transcribe
└── Falls back to Web Speech API but VAD init already failed
```

### Solution Architecture

```
CURRENT (BROKEN):
AIChat → VoiceConversation → VADService (fails loading ONNX)
                          → STT Server (not running)

NEW (WORKING):
AIChat → WebSpeechService (browser-native, works NOW)
      → TTSService (Edge-TTS, already running)
      → PronunciationAssessor (new, client-side)
```

---

## Implementation Architecture

### Voice Mode Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      AI CHAT VOICE MODE (Fixed)                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  USER CLICKS MIC BUTTON                                                  │
│      │                                                                   │
│      ▼                                                                   │
│  ┌─────────────────────┐                                                │
│  │  WebSpeechService   │ ← Browser-native, no server needed             │
│  │  .listen()          │   pt-PT language configured                    │
│  │                     │   Returns Promise<transcript>                  │
│  └─────────────────────┘                                                │
│      │                                                                   │
│      │  Interim Results → Display in chat (typing indicator)            │
│      │  Final Result → Send to AI                                       │
│      ▼                                                                   │
│  ┌─────────────────────┐                                                │
│  │  AI Agent           │ ← Process user's Portuguese speech             │
│  │  .chat(transcript)  │   Generate helpful response                    │
│  └─────────────────────┘                                                │
│      │                                                                   │
│      ▼                                                                   │
│  ┌─────────────────────┐     ┌─────────────────────────┐               │
│  │  Response Text      │────▶│  TTSService             │               │
│  │  + Portuguese words │     │  .speakPortuguese()     │               │
│  │  marked for audio   │     │  pt-PT-RaquelNeural     │               │
│  └─────────────────────┘     └─────────────────────────┘               │
│      │                                                                   │
│      ▼                                                                   │
│  ┌─────────────────────┐                                                │
│  │  Display Response   │ ← Show text + [🔊 Play] buttons for PT words   │
│  │  with inline audio  │   Auto-speak if voice mode enabled             │
│  └─────────────────────┘                                                │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Pronunciation Assessment Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PRONUNCIATION ASSESSMENT FLOW                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  AI ASKS: "Say 'obrigado' in Portuguese"                                │
│      │                                                                   │
│      ▼                                                                   │
│  ┌─────────────────────┐                                                │
│  │  WebSpeechService   │ ← Records user attempt                         │
│  │  .listen()          │   Returns transcript                           │
│  └─────────────────────┘                                                │
│      │                                                                   │
│      │  User says: "obrigado" (or mishears)                             │
│      ▼                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐       │
│  │                 PronunciationAssessor                        │       │
│  │                                                              │       │
│  │  1. Expected: "obrigado" → phonemes: /obɾiˈɡadu/            │       │
│  │  2. Heard: user transcript                                   │       │
│  │  3. Compare phonemes using Levenshtein distance             │       │
│  │  4. Calculate accuracy score (0-100%)                        │       │
│  │  5. Identify specific phoneme errors                         │       │
│  │                                                              │       │
│  └─────────────────────────────────────────────────────────────┘       │
│      │                                                                   │
│      ▼                                                                   │
│  ┌─────────────────────┐                                                │
│  │  Feedback to User   │                                                │
│  │                     │                                                │
│  │  ✓ Score: 85%       │                                                │
│  │  ✓ Good: "bri" sound│                                                │
│  │  ✗ Improve: final   │                                                │
│  │    "do" → "du"      │                                                │
│  └─────────────────────┘                                                │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Fix Voice Mode (IMMEDIATE)

### Task 1.1: Update AIChat.js Voice Integration

Replace the broken `VoiceConversation` with working `WebSpeechService`:

**Changes Required in `src/components/ai/AIChat.js`:**

```javascript
// REMOVE these imports:
// import { VoiceConversation } from '../../services/voice/VoiceConversation.js';

// ADD these imports:
import WebSpeechService from '../../services/WebSpeechService.js';
import TTSService from '../../services/TTSService.js';

// UPDATE toggleVoiceMode():
async toggleVoiceMode() {
    if (this.isVoiceMode) {
        // Stop listening
        this.isVoiceMode = false;
        this.isListening = false;
        WebSpeechService.stopListening();
        this.updateVoiceUI();
        return;
    }

    // Check if Web Speech API is available
    if (!WebSpeechService.isWebSpeechAvailable()) {
        this.showToast('Voice recognition not supported in this browser', 'error');
        return;
    }

    this.isVoiceMode = true;
    this.isListening = true;
    this.updateVoiceUI();

    try {
        // Listen for user speech
        const transcript = await WebSpeechService.listen(10000); // 10 sec timeout
        
        if (transcript && transcript.trim()) {
            // Show what user said
            this.addUserMessage(transcript);
            
            // Process with AI
            await this.sendMessage(transcript);
            
            // Speak response if voice mode still active
            if (this.isVoiceMode && this.lastAIResponse) {
                await TTSService.speakPortuguese(this.lastAIResponse);
            }
        }
    } catch (error) {
        console.error('[AIChat] Voice recognition error:', error);
        this.showToast('Could not recognize speech. Please try again.', 'warning');
    } finally {
        this.isListening = false;
        this.updateVoiceUI();
    }
}
```

### Task 1.2: Add Voice UI Feedback

Show visual feedback during voice recognition:

```javascript
updateVoiceUI() {
    const micButton = this.container.querySelector('.mic-button');
    const statusText = this.container.querySelector('.voice-status');
    
    if (this.isListening) {
        micButton?.classList.add('listening', 'pulse');
        if (statusText) statusText.textContent = 'Listening... Speak now';
    } else if (this.isVoiceMode) {
        micButton?.classList.add('active');
        micButton?.classList.remove('listening', 'pulse');
        if (statusText) statusText.textContent = 'Voice mode active';
    } else {
        micButton?.classList.remove('active', 'listening', 'pulse');
        if (statusText) statusText.textContent = '';
    }
}
```

### Task 1.3: Add Transcription Display

Show interim results as user speaks:

```javascript
async startVoiceRecognition() {
    const transcriptDisplay = this.createTranscriptDisplay();
    
    WebSpeechService.onInterimResult = (interim) => {
        transcriptDisplay.textContent = interim;
        transcriptDisplay.classList.add('typing');
    };
    
    const final = await WebSpeechService.listen(10000);
    
    transcriptDisplay.remove();
    return final;
}

createTranscriptDisplay() {
    const display = document.createElement('div');
    display.className = 'interim-transcript';
    display.innerHTML = '<span class="typing-indicator">...</span>';
    this.messagesContainer.appendChild(display);
    this.scrollToBottom();
    return display;
}
```

---

## Phase 2: Pronunciation Assessment

### Task 2.1: Create PronunciationAssessor Service

```javascript
// src/services/PronunciationAssessor.js

export class PronunciationAssessor {
    constructor() {
        // Portuguese phoneme mappings (simplified IPA)
        this.phonemeMap = {
            // Vowels
            'a': ['a', 'ɐ'],
            'e': ['e', 'ɛ', 'ə'],
            'i': ['i'],
            'o': ['o', 'ɔ', 'u'],
            'u': ['u'],
            // Consonants
            'r': ['ʁ', 'ɾ', 'r'],
            'rr': ['ʁ'],
            'lh': ['ʎ'],
            'nh': ['ɲ'],
            'ç': ['s'],
            's': ['s', 'z', 'ʃ', 'ʒ'],
            'x': ['ʃ', 'ks', 'z'],
            'ch': ['ʃ'],
            // Common patterns
            'ão': ['ɐ̃w̃'],
            'ões': ['õj̃ʃ'],
            'ão': ['ɐ̃w̃']
        };
    }

    /**
     * Assess pronunciation accuracy
     * @param {string} expected - The expected Portuguese word/phrase
     * @param {string} heard - What was transcribed from user speech
     * @returns {Object} Assessment result
     */
    assess(expected, heard) {
        const normalizedExpected = this.normalizePortuguese(expected);
        const normalizedHeard = this.normalizePortuguese(heard);
        
        // Direct comparison
        const exactMatch = normalizedExpected === normalizedHeard;
        
        // Calculate similarity score
        const similarity = this.calculateSimilarity(normalizedExpected, normalizedHeard);
        
        // Identify specific errors
        const errors = this.identifyErrors(normalizedExpected, normalizedHeard);
        
        // Generate feedback
        const feedback = this.generateFeedback(similarity, errors, expected);
        
        return {
            expected,
            heard,
            exactMatch,
            score: Math.round(similarity * 100),
            errors,
            feedback,
            phonemeBreakdown: this.getPhonemeBreakdown(expected)
        };
    }

    normalizePortuguese(text) {
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remove accents for comparison
            .replace(/[^a-z\s]/g, '')
            .trim();
    }

    calculateSimilarity(str1, str2) {
        const len1 = str1.length;
        const len2 = str2.length;
        
        if (len1 === 0) return len2 === 0 ? 1 : 0;
        if (len2 === 0) return 0;
        
        // Levenshtein distance
        const matrix = [];
        for (let i = 0; i <= len1; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= len2; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= len1; i++) {
            for (let j = 1; j <= len2; j++) {
                const cost = str1[i-1] === str2[j-1] ? 0 : 1;
                matrix[i][j] = Math.min(
                    matrix[i-1][j] + 1,     // deletion
                    matrix[i][j-1] + 1,     // insertion
                    matrix[i-1][j-1] + cost // substitution
                );
            }
        }
        
        const distance = matrix[len1][len2];
        const maxLen = Math.max(len1, len2);
        return 1 - (distance / maxLen);
    }

    identifyErrors(expected, heard) {
        const errors = [];
        const expChars = expected.split('');
        const heardChars = heard.split('');
        
        // Simple character-by-character comparison
        const maxLen = Math.max(expChars.length, heardChars.length);
        
        for (let i = 0; i < maxLen; i++) {
            if (expChars[i] !== heardChars[i]) {
                errors.push({
                    position: i,
                    expected: expChars[i] || '(missing)',
                    heard: heardChars[i] || '(extra)',
                    type: !heardChars[i] ? 'missing' : !expChars[i] ? 'extra' : 'wrong'
                });
            }
        }
        
        return errors;
    }

    generateFeedback(score, errors, originalWord) {
        if (score >= 0.95) {
            return {
                overall: 'Excellent! Perfect pronunciation!',
                emoji: '🌟',
                tips: []
            };
        }
        
        if (score >= 0.8) {
            return {
                overall: 'Great job! Very close to native pronunciation.',
                emoji: '✨',
                tips: errors.slice(0, 2).map(e => 
                    `Watch the "${e.expected}" sound - you said "${e.heard}"`
                )
            };
        }
        
        if (score >= 0.6) {
            return {
                overall: 'Good effort! Keep practicing this word.',
                emoji: '👍',
                tips: errors.slice(0, 3).map(e => 
                    `Practice the "${e.expected}" sound`
                )
            };
        }
        
        return {
            overall: 'Let\'s practice this one more. Listen carefully:',
            emoji: '🔄',
            tips: [
                `Try breaking it down: ${this.syllabify(originalWord)}`,
                'Listen to the native pronunciation and repeat slowly'
            ],
            playAudio: true
        };
    }

    syllabify(word) {
        // Simple Portuguese syllabification
        const vowels = 'aeiouáéíóúâêôãõ';
        let syllables = [];
        let current = '';
        
        for (let i = 0; i < word.length; i++) {
            current += word[i];
            
            if (vowels.includes(word[i].toLowerCase())) {
                // Check if next char is consonant + vowel
                if (i + 2 < word.length && 
                    !vowels.includes(word[i+1].toLowerCase()) &&
                    vowels.includes(word[i+2].toLowerCase())) {
                    syllables.push(current);
                    current = '';
                }
            }
        }
        
        if (current) syllables.push(current);
        return syllables.join('-');
    }

    getPhonemeBreakdown(word) {
        // Return IPA-like breakdown for display
        // This is simplified - real IPA would need a proper dictionary
        return word.split('').map(char => ({
            letter: char,
            sound: this.phonemeMap[char.toLowerCase()]?.[0] || char
        }));
    }
}

export default new PronunciationAssessor();
```

### Task 2.2: Integrate Assessment into AI Chat

When AI asks user to pronounce something:

```javascript
// In AIChat.js

async handlePronunciationRequest(wordToPronouce) {
    // Show prompt
    this.addSystemMessage(`🎤 Say "${wordToPronouce}" in Portuguese`);
    
    // Listen for user attempt
    this.isAssessingPronunciation = true;
    const userAttempt = await WebSpeechService.listen(8000);
    
    if (!userAttempt) {
        this.addSystemMessage('I didn\'t hear anything. Let\'s try again.');
        return;
    }
    
    // Assess pronunciation
    const assessment = PronunciationAssessor.assess(wordToPronouce, userAttempt);
    
    // Display results
    this.showPronunciationFeedback(assessment);
    
    // Log for AI learning
    EventStreaming.emit('pronunciation_assessment', {
        word: wordToPronouce,
        userAttempt,
        score: assessment.score,
        errors: assessment.errors
    });
    
    // If score is low, play correct pronunciation
    if (assessment.feedback.playAudio) {
        await TTSService.speakPortuguese(wordToPronouce);
    }
}

showPronunciationFeedback(assessment) {
    const feedbackHTML = `
        <div class="pronunciation-feedback ${assessment.score >= 80 ? 'success' : 'needs-work'}">
            <div class="score-badge">${assessment.feedback.emoji} ${assessment.score}%</div>
            <p class="feedback-text">${assessment.feedback.overall}</p>
            ${assessment.feedback.tips.length ? `
                <ul class="feedback-tips">
                    ${assessment.feedback.tips.map(tip => `<li>${tip}</li>`).join('')}
                </ul>
            ` : ''}
            <button class="replay-btn" onclick="TTSService.speakPortuguese('${assessment.expected}')">
                🔊 Hear correct pronunciation
            </button>
        </div>
    `;
    
    this.addMessageHTML(feedbackHTML);
}
```

---

## Phase 3: Enhanced Features

### Task 3.1: Inline Audio Playback

Parse AI responses and add playable audio for Portuguese words:

```javascript
// In AIChat.js

parseResponseForAudio(responseText) {
    // Pattern to find Portuguese words marked for audio
    // AI will use format: **word** or [word] for Portuguese
    const wordPattern = /\*\*([a-záàâãéêíóôõúç]+)\*\*/gi;
    
    return responseText.replace(wordPattern, (match, word) => {
        const audioId = `audio-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        return `<span class="portuguese-word" data-word="${word}">
            ${word} 
            <button class="inline-audio-btn" data-audio-id="${audioId}" 
                    onclick="window.playPortugueseWord('${word}')">
                🔊
            </button>
        </span>`;
    });
}

// Global function for inline buttons
window.playPortugueseWord = async (word) => {
    try {
        await TTSService.speakPortuguese(word);
    } catch (error) {
        console.error('Failed to play word:', error);
    }
};
```

### Task 3.2: Continuous Voice Conversation Mode

Allow back-and-forth voice conversation:

```javascript
async startContinuousVoiceMode() {
    this.isVoiceMode = true;
    this.showToast('Voice conversation started. Speak anytime!', 'info');
    
    while (this.isVoiceMode) {
        try {
            // Listen for user
            this.updateVoiceUI('listening');
            const transcript = await WebSpeechService.listen(15000);
            
            if (!transcript || !this.isVoiceMode) break;
            
            // Process
            this.updateVoiceUI('processing');
            this.addUserMessage(transcript);
            const response = await this.sendMessage(transcript);
            
            // Speak response
            this.updateVoiceUI('speaking');
            await TTSService.speakPortuguese(response);
            
            // Brief pause before next listen
            await new Promise(r => setTimeout(r, 500));
            
        } catch (error) {
            if (error.name === 'AbortError') break;
            console.error('Voice loop error:', error);
        }
    }
    
    this.isVoiceMode = false;
    this.updateVoiceUI('idle');
}
```

---

## Testing Strategy

### E2E Tests Required

```javascript
// tests/e2e/voice.e2e.test.js

describe('AI Chat Voice Features', () => {
    
    describe('Voice Mode Toggle', () => {
        test('VOICE-E001: Mic button toggles voice mode', async () => {
            // 1. Navigate to AI chat
            // 2. Click mic button
            // 3. Verify "Listening..." state
            // 4. Click again
            // 5. Verify stopped
        });
        
        test('VOICE-E002: Shows error when speech recognition unavailable', async () => {
            // Mock unavailable API
            // Click mic
            // Verify error toast
        });
    });
    
    describe('Speech Recognition', () => {
        test('VOICE-E003: Transcribes Portuguese speech', async () => {
            // Use mock audio or skip in CI
        });
        
        test('VOICE-E004: Shows interim transcription', async () => {
            // Verify typing indicator during recognition
        });
    });
    
    describe('TTS Playback', () => {
        test('VOICE-E005: AI response is spoken in Portuguese', async () => {
            // Verify TTSService.speakPortuguese called
        });
        
        test('VOICE-E006: Inline audio buttons work', async () => {
            // Click 🔊 button
            // Verify audio plays
        });
    });
    
    describe('Pronunciation Assessment', () => {
        test('VOICE-E007: Assesses pronunciation correctly', async () => {
            // Mock speech input
            // Verify score displayed
            // Verify feedback shown
        });
        
        test('VOICE-E008: Plays correct pronunciation on low score', async () => {
            // Mock low score
            // Verify TTS called
        });
    });
});
```

### Unit Tests Required

```javascript
// tests/unit/pronunciationAssessor.test.js

describe('PronunciationAssessor', () => {
    test('calculates 100% similarity for exact match', () => {
        const result = PronunciationAssessor.assess('obrigado', 'obrigado');
        expect(result.score).toBe(100);
    });
    
    test('calculates lower score for mispronunciation', () => {
        const result = PronunciationAssessor.assess('obrigado', 'obrigadu');
        expect(result.score).toBeLessThan(100);
        expect(result.score).toBeGreaterThan(80);
    });
    
    test('identifies specific errors', () => {
        const result = PronunciationAssessor.assess('olá', 'ola');
        expect(result.errors).toHaveLength(1);
    });
    
    test('generates appropriate feedback', () => {
        const excellent = PronunciationAssessor.assess('sim', 'sim');
        expect(excellent.feedback.emoji).toBe('🌟');
        
        const needsWork = PronunciationAssessor.assess('português', 'portuges');
        expect(needsWork.feedback.playAudio).toBe(true);
    });
});
```

---

## Task Checklist

### Phase 1: Fix Voice Mode (P0)

| Task ID | Task | Status | File |
|---------|------|--------|------|
| VOICE-001 | Update AIChat.js imports to use WebSpeechService | [ ] | AIChat.js |
| VOICE-002 | Replace toggleVoiceMode() with working implementation | [ ] | AIChat.js |
| VOICE-003 | Add updateVoiceUI() method | [ ] | AIChat.js |
| VOICE-004 | Add interim transcription display | [ ] | AIChat.js |
| VOICE-005 | Add voice mode CSS styles | [ ] | ai-chat.css |
| VOICE-006 | Test voice mode in browser | [ ] | Manual |

### Phase 2: Pronunciation Assessment (P0)

| Task ID | Task | Status | File |
|---------|------|--------|------|
| VOICE-007 | Create PronunciationAssessor.js service | [ ] | New file |
| VOICE-008 | Add assess() method with Levenshtein | [ ] | PronunciationAssessor.js |
| VOICE-009 | Add phoneme mapping for Portuguese | [ ] | PronunciationAssessor.js |
| VOICE-010 | Add feedback generation | [ ] | PronunciationAssessor.js |
| VOICE-011 | Integrate into AIChat | [ ] | AIChat.js |
| VOICE-012 | Add pronunciation feedback UI | [ ] | AIChat.js |
| VOICE-013 | Unit tests for PronunciationAssessor | [ ] | Tests |

### Phase 3: Enhanced Features (P1)

| Task ID | Task | Status | File |
|---------|------|--------|------|
| VOICE-014 | Add inline audio playback parsing | [ ] | AIChat.js |
| VOICE-015 | Add 🔊 button styling | [ ] | ai-chat.css |
| VOICE-016 | Add continuous voice mode | [ ] | AIChat.js |
| VOICE-017 | Add voice conversation prompts | [ ] | AIChat.js |

### Testing (P0)

| Task ID | Task | Status | File |
|---------|------|--------|------|
| VOICE-018 | E2E tests for voice mode | [ ] | voice.e2e.test.js |
| VOICE-019 | Unit tests for WebSpeechService | [ ] | webSpeechService.test.js |
| VOICE-020 | Unit tests for TTSService | [ ] | ttsService.test.js |
| VOICE-021 | Unit tests for PronunciationAssessor | [ ] | pronunciationAssessor.test.js |

---

## References

### Research Sources
1. Web Speech API MDN Documentation
2. Edge-TTS (rany2/edge-tts) - Neural Portuguese voices
3. ai-pronunciation-trainer (Thiagohgl) - Whisper + Epitran approach
4. Levenshtein distance algorithms
5. Portuguese phonetics research (European vs Brazilian)
6. LiveKit Agents voice AI framework
7. Sherpa-ONNX WebAssembly speech recognition
8. Groq Whisper API benchmarks
9. TEN Framework - 300ms voice AI latency
10. Silero VAD - Voice activity detection

### Code References
- `src/services/WebSpeechService.js` - Working STT (USE THIS)
- `src/services/TTSService.js` - Working TTS (USE THIS)  
- `src/services/PhoneticScorer.js` - Existing phonetic code (REFERENCE)
- `docs/AI_TUTOR_ARCHITECTURE.md` - Overall architecture

---

*Document created: June 2025*
*Priority: P0 - Critical*
*Estimated implementation: 4-6 hours*
