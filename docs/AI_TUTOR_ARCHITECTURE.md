# AI Tutor Architecture - Enhanced Implementation Plan

> **Version:** 1.0.0  
> **Created:** December 26, 2025  
> **Based on:** 50+ research sources (March-December 2025)  
> **Goal:** Best-in-class AI tutor with superb voice capability

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Stage 1: Core AI Agent Architecture](#stage-1-core-ai-agent-architecture)
3. [Stage 2: Voice Conversation Pipeline](#stage-2-voice-conversation-pipeline)
4. [Stage 3: Lesson Generation System](#stage-3-lesson-generation-system)
5. [Stage 4: Adaptive Learning Engine](#stage-4-adaptive-learning-engine)
6. [Stage 5: Memory & Context Management](#stage-5-memory--context-management)
7. [Stage 6: Web Search Integration](#stage-6-web-search-integration)
8. [Implementation Priority](#implementation-priority)

---

## Executive Summary

### The Vision
Transform the AI from a passive tip generator into an **autonomous, goal-oriented agent** that:
- **Speaks and listens** with <300ms latency for natural conversation
- **Creates all lesson types** (speaking, text, audio, listening) on demand
- **Adapts in real-time** to user's learning style and weaknesses
- **Accesses user statistics** to personalize every interaction
- **Searches the web** for authoritative Portuguese resources
- **Learns incrementally** without impacting performance

### Key Research Findings

| Finding | Source | Impact |
|---------|--------|--------|
| 300ms rule for voice AI | TEN Framework 2025 | Voice latency target |
| Qwen2.5-7B best for tool calling | LLM benchmarks 2025 | Model selection |
| FSRS outperforms SM-2 | Anki FSRS-5 research | Spaced repetition upgrade |
| Context engineering > prompt engineering | Industry shift 2025 | Architecture approach |
| Agentic architecture transforms passive LLMs | Multi-agent research 2025 | Core design pattern |

### Hardware Constraints
- **GPU:** 11GB VRAM (RTX 2080 Ti / RTX 3080)
- **Optimal Model:** Qwen2.5-7B-Instruct-Q4_K_M (~4.5GB VRAM)
- **Parallel Config:** OLLAMA_NUM_PARALLEL=2, OLLAMA_FLASH_ATTENTION=1

---

## Stage 1: Core AI Agent Architecture

### 1.1 Current Problem

The AI is fragmented across multiple phases without unified architecture:
- `aiPipeline.js` - Event processing
- `AIService.js` - Basic Ollama wrapper
- `eventStreaming.js` - Data collection
- No central orchestration
- No tool calling capability
- No autonomous decision-making

### 1.2 Target: Unified AI Agent

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AI AGENT ORCHESTRATOR                              │
│                         (src/services/ai/AIAgent.js)                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   TOOLS     │  │   MEMORY    │  │  LEARNER    │  │   VOICE     │        │
│  │  REGISTRY   │  │  MANAGER    │  │  PROFILER   │  │  PIPELINE   │        │
│  │             │  │             │  │             │  │             │        │
│  │ - get_stats │  │ - context   │  │ - weak_words│  │ - STT       │        │
│  │ - create_   │  │ - history   │  │ - phonemes  │  │ - LLM       │        │
│  │   lesson    │  │ - RAG       │  │ - patterns  │  │ - TTS       │        │
│  │ - web_search│  │ - sliding   │  │ - style     │  │ - VAD       │        │
│  │ - pronounce │  │   window    │  │ - velocity  │  │             │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
│         │                │                │                │                │
│         └────────────────┴────────────────┴────────────────┘                │
│                                    │                                        │
│                          ┌─────────▼─────────┐                             │
│                          │   OLLAMA LLM      │                             │
│                          │  qwen2.5:7b       │                             │
│                          │                   │                             │
│                          │  Tool Calling +   │                             │
│                          │  Structured Output│                             │
│                          └───────────────────┘                             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.3 Tool Registry Design

The AI Agent uses Ollama's native tool calling to execute actions:

```javascript
// src/services/ai/ToolRegistry.js

export const TOOLS = {
    // ═══════════════════════════════════════════════════════════════════════
    // USER DATA TOOLS
    // ═══════════════════════════════════════════════════════════════════════
    
    get_user_statistics: {
        name: 'get_user_statistics',
        description: 'Get current user learning statistics including weak words, success rates, and progress',
        parameters: {
            type: 'object',
            properties: {
                include_weak_words: {
                    type: 'boolean',
                    description: 'Include list of words user struggles with'
                },
                include_phoneme_scores: {
                    type: 'boolean', 
                    description: 'Include pronunciation phoneme breakdown'
                },
                time_range: {
                    type: 'string',
                    enum: ['today', 'week', 'month', 'all'],
                    description: 'Time range for statistics'
                }
            },
            required: []
        },
        handler: async (params, context) => {
            const { userId } = context;
            const progressTracker = await import('../ProgressTracker.js');
            return progressTracker.getComprehensiveStats(userId, params);
        }
    },
    
    get_current_lesson_context: {
        name: 'get_current_lesson_context',
        description: 'Get information about the lesson user is currently viewing',
        parameters: {
            type: 'object',
            properties: {},
            required: []
        },
        handler: async (params, context) => {
            const { currentLesson, currentWord } = context;
            return { lesson: currentLesson, word: currentWord };
        }
    },
    
    // ═══════════════════════════════════════════════════════════════════════
    // LESSON CREATION TOOLS
    // ═══════════════════════════════════════════════════════════════════════
    
    create_custom_lesson: {
        name: 'create_custom_lesson',
        description: 'Create a personalized lesson based on user weaknesses or requested topic',
        parameters: {
            type: 'object',
            properties: {
                title: {
                    type: 'string',
                    description: 'Lesson title'
                },
                focus_type: {
                    type: 'string',
                    enum: ['weak_words', 'phoneme_practice', 'topic', 'confusion_pairs'],
                    description: 'What the lesson focuses on'
                },
                lesson_type: {
                    type: 'string',
                    enum: ['speaking', 'listening', 'reading', 'writing', 'mixed'],
                    description: 'Primary lesson modality'
                },
                difficulty: {
                    type: 'string',
                    enum: ['easy', 'medium', 'hard'],
                    description: 'Lesson difficulty level'
                },
                word_ids: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Specific word IDs to include (optional)'
                }
            },
            required: ['title', 'focus_type', 'lesson_type']
        },
        handler: async (params, context) => {
            const generator = await import('./LessonGenerator.js');
            return generator.createLesson(params, context.userId);
        }
    },
    
    // ═══════════════════════════════════════════════════════════════════════
    // VOICE TOOLS
    // ═══════════════════════════════════════════════════════════════════════
    
    speak_portuguese: {
        name: 'speak_portuguese',
        description: 'Speak text in Portuguese with neural voice',
        parameters: {
            type: 'object',
            properties: {
                text: {
                    type: 'string',
                    description: 'Portuguese text to speak'
                },
                voice: {
                    type: 'string',
                    enum: ['duarte', 'raquel'],
                    description: 'Voice to use (male/female)'
                },
                speed: {
                    type: 'number',
                    description: 'Speech rate (0.5-2.0)',
                    minimum: 0.5,
                    maximum: 2.0
                }
            },
            required: ['text']
        },
        handler: async (params) => {
            const tts = await import('../TTSService.js');
            await tts.speak(params.text, params.voice || 'raquel', params.speed || 1.0);
            return { spoken: true, text: params.text };
        }
    },
    
    get_pronunciation_guide: {
        name: 'get_pronunciation_guide',
        description: 'Get detailed pronunciation guide for a Portuguese word',
        parameters: {
            type: 'object',
            properties: {
                word: {
                    type: 'string',
                    description: 'Portuguese word to get pronunciation for'
                }
            },
            required: ['word']
        },
        handler: async (params) => {
            const phonetics = await import('../PhoneticScorer.js');
            return phonetics.getDetailedGuide(params.word);
        }
    },
    
    // ═══════════════════════════════════════════════════════════════════════
    // WEB SEARCH TOOLS
    // ═══════════════════════════════════════════════════════════════════════
    
    search_portuguese_resources: {
        name: 'search_portuguese_resources',
        description: 'Search whitelisted Portuguese language resources for grammar, vocabulary, or cultural information',
        parameters: {
            type: 'object',
            properties: {
                query: {
                    type: 'string',
                    description: 'Search query in English or Portuguese'
                },
                source_type: {
                    type: 'string',
                    enum: ['grammar', 'dictionary', 'pronunciation', 'cultural', 'all'],
                    description: 'Type of source to search'
                }
            },
            required: ['query']
        },
        handler: async (params) => {
            const webSearch = await import('./WebSearchTool.js');
            return webSearch.searchWhitelisted(params.query, params.source_type);
        }
    },
    
    // ═══════════════════════════════════════════════════════════════════════
    // PROGRESS TRACKING TOOLS
    // ═══════════════════════════════════════════════════════════════════════
    
    record_interaction: {
        name: 'record_interaction',
        description: 'Record a learning interaction for progress tracking',
        parameters: {
            type: 'object',
            properties: {
                event_type: {
                    type: 'string',
                    enum: ['tip_given', 'lesson_created', 'question_answered', 'pronunciation_help']
                },
                word_id: {
                    type: 'string',
                    description: 'Word ID if applicable'
                },
                effectiveness: {
                    type: 'string',
                    enum: ['helpful', 'neutral', 'not_helpful'],
                    description: 'User feedback on interaction'
                }
            },
            required: ['event_type']
        },
        handler: async (params, context) => {
            const eventStream = await import('../eventStreaming.js');
            return eventStream.emit('ai_interaction', { ...params, userId: context.userId });
        }
    }
};

// Tool validation layer - NEVER trust model output blindly
export function validateToolCall(toolName, params) {
    const tool = TOOLS[toolName];
    if (!tool) {
        throw new Error(`Unknown tool: ${toolName}`);
    }
    
    // Validate required parameters
    const required = tool.parameters.required || [];
    for (const param of required) {
        if (params[param] === undefined) {
            throw new Error(`Missing required parameter: ${param}`);
        }
    }
    
    // Validate parameter types and enums
    const props = tool.parameters.properties || {};
    for (const [key, value] of Object.entries(params)) {
        const schema = props[key];
        if (!schema) continue;
        
        if (schema.enum && !schema.enum.includes(value)) {
            throw new Error(`Invalid value for ${key}: ${value}. Must be one of: ${schema.enum.join(', ')}`);
        }
        
        if (schema.type === 'number') {
            if (schema.minimum !== undefined && value < schema.minimum) {
                throw new Error(`${key} must be >= ${schema.minimum}`);
            }
            if (schema.maximum !== undefined && value > schema.maximum) {
                throw new Error(`${key} must be <= ${schema.maximum}`);
            }
        }
    }
    
    return true;
}
```

### 1.4 AI Agent Core Implementation

```javascript
// src/services/ai/AIAgent.js

import { TOOLS, validateToolCall } from './ToolRegistry.js';
import { MemoryManager } from './MemoryManager.js';
import { LearnerProfiler } from './LearnerProfiler.js';

export class AIAgent {
    constructor() {
        this.model = 'qwen2.5:7b';
        this.baseUrl = 'http://localhost:11434';
        this.memory = new MemoryManager();
        this.profiler = new LearnerProfiler();
        this.maxToolCalls = 5; // Prevent infinite loops
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // SYSTEM PROMPT - The Agent's Identity
    // ═══════════════════════════════════════════════════════════════════════
    
    getSystemPrompt(context) {
        return `You are an expert European Portuguese (pt-PT) language tutor with deep knowledge of:
- Portuguese grammar, vocabulary, and pronunciation
- Language learning pedagogy (Krashen's i+1, spaced repetition, CAPT)
- Learner psychology and motivation

ROLE & PERSONALITY:
- Warm, encouraging, patient
- Adapt explanations to learner's level
- Use humor and mnemonics to make learning memorable
- Always use European Portuguese, NEVER Brazilian Portuguese

AVAILABLE TOOLS:
You have access to these tools - use them proactively:
${Object.entries(TOOLS).map(([name, tool]) => `- ${name}: ${tool.description}`).join('\n')}

CURRENT CONTEXT:
- User: ${context.username}
- Current Lesson: ${context.currentLesson?.title || 'None'}
- Current Word: ${context.currentWord?.pt || 'None'}
- Weak Areas: ${context.weakAreas?.join(', ') || 'Unknown'}
- Session Duration: ${context.sessionDuration || 0} minutes

RESPONSE GUIDELINES:
1. Keep responses concise (under 150 words unless explaining complex grammar)
2. Always include pronunciation in IPA: /example/
3. Bold Portuguese words: **palavra**
4. Use tools to get data before making assumptions
5. If creating lessons, explain what you're including and why

CONSTRAINTS:
- Only reference whitelisted Portuguese resources
- Never make up translations - use dictionary tool if unsure
- Respect user's learning pace - don't overwhelm
- Mark uncertainty clearly: "I believe..." or "Checking..."`;
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // MAIN CHAT METHOD - With Tool Calling Loop
    // ═══════════════════════════════════════════════════════════════════════
    
    async chat(userMessage, context = {}) {
        // 1. Build context from memory and profiler
        const enrichedContext = await this.buildContext(context);
        
        // 2. Prepare messages with system prompt
        const messages = [
            { role: 'system', content: this.getSystemPrompt(enrichedContext) },
            ...this.memory.getRecentHistory(10),
            { role: 'user', content: userMessage }
        ];
        
        // 3. Call Ollama with tools
        let response = await this.callOllama(messages);
        let toolCallCount = 0;
        
        // 4. Tool calling loop
        while (response.tool_calls && toolCallCount < this.maxToolCalls) {
            const toolResults = await this.executeToolCalls(response.tool_calls, enrichedContext);
            
            // Add tool results to conversation
            messages.push({ role: 'assistant', content: response.message.content, tool_calls: response.tool_calls });
            messages.push({ role: 'tool', content: JSON.stringify(toolResults) });
            
            // Get next response
            response = await this.callOllama(messages);
            toolCallCount++;
        }
        
        // 5. Store in memory
        this.memory.addMessage('user', userMessage);
        this.memory.addMessage('assistant', response.message.content);
        
        return {
            content: response.message.content,
            toolsUsed: toolCallCount > 0,
            context: enrichedContext
        };
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // OLLAMA API CALL
    // ═══════════════════════════════════════════════════════════════════════
    
    async callOllama(messages) {
        const response = await fetch(`${this.baseUrl}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: this.model,
                messages,
                tools: this.getToolDefinitions(),
                stream: false,
                options: {
                    temperature: 0.7,
                    top_p: 0.9,
                    num_predict: 500
                }
            })
        });
        
        if (!response.ok) {
            throw new Error(`Ollama error: ${response.status}`);
        }
        
        return response.json();
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // TOOL EXECUTION
    // ═══════════════════════════════════════════════════════════════════════
    
    async executeToolCalls(toolCalls, context) {
        const results = [];
        
        for (const call of toolCalls) {
            try {
                // Validate before execution
                validateToolCall(call.function.name, call.function.arguments);
                
                // Execute tool
                const tool = TOOLS[call.function.name];
                const result = await tool.handler(call.function.arguments, context);
                
                results.push({
                    tool: call.function.name,
                    success: true,
                    result
                });
                
                // Log for admin visibility
                this.logToolCall(call.function.name, call.function.arguments, result);
                
            } catch (error) {
                results.push({
                    tool: call.function.name,
                    success: false,
                    error: error.message
                });
            }
        }
        
        return results;
    }
    
    getToolDefinitions() {
        return Object.entries(TOOLS).map(([name, tool]) => ({
            type: 'function',
            function: {
                name: tool.name,
                description: tool.description,
                parameters: tool.parameters
            }
        }));
    }
    
    async buildContext(baseContext) {
        const profile = await this.profiler.getProfile(baseContext.userId);
        return {
            ...baseContext,
            weakAreas: profile.weakWords.slice(0, 5).map(w => w.word),
            learningStyle: profile.preferredStyle,
            sessionDuration: Math.round((Date.now() - (baseContext.sessionStart || Date.now())) / 60000)
        };
    }
    
    logToolCall(toolName, params, result) {
        console.log(`[AI Tool] ${toolName}`, { params, success: !!result });
        // Also send to event stream for admin dashboard
    }
}

export default new AIAgent();
```

### 1.5 Implementation Tasks - Stage 1

| Task ID | Task | Status | Priority |
|---------|------|--------|----------|
| AI-ARCH-001 | Create `src/services/ai/` directory structure | [ ] | P0 |
| AI-ARCH-002 | Implement `ToolRegistry.js` with all tools | [ ] | P0 |
| AI-ARCH-003 | Implement `AIAgent.js` core orchestrator | [ ] | P0 |
| AI-ARCH-004 | Implement `MemoryManager.js` | [ ] | P0 |
| AI-ARCH-005 | Implement `LearnerProfiler.js` | [ ] | P0 |
| AI-ARCH-006 | Add tool validation layer | [ ] | P0 |
| AI-ARCH-007 | Wire AIAgent into existing chat UI | [ ] | P0 |
| AI-ARCH-008 | Create admin tool call log viewer | [ ] | P1 |
| AI-ARCH-009 | Unit tests for ToolRegistry | [ ] | P0 |
| AI-ARCH-010 | Unit tests for AIAgent | [ ] | P0 |

---

## Stage 2: Voice Conversation Pipeline

### 2.1 The 300ms Rule

Research from TEN Framework (2025) establishes that **voice AI must respond under 300ms** for natural conversation. This requires:
- Streaming STT (Speech-to-Text)
- Streaming LLM response
- Streaming TTS (Text-to-Speech)
- Voice Activity Detection (VAD) for turn-taking

### 2.2 Voice Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         VOICE CONVERSATION PIPELINE                          │
│                      Target Latency: <300ms to first audio                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  USER SPEAKS                                                                 │
│      │                                                                       │
│      ▼                                                                       │
│  ┌─────────────┐                                                            │
│  │ SILERO VAD  │ ← Voice Activity Detection (browser)                       │
│  │             │   Detects speech start/end                                  │
│  │ ~20ms       │   Filters background noise                                  │
│  └─────────────┘                                                            │
│      │                                                                       │
│      ▼                                                                       │
│  ┌─────────────┐                                                            │
│  │ AUDIO       │ ← Preprocessing                                            │
│  │ PROCESSOR   │   - Resample to 16kHz                                      │
│  │             │   - Noise reduction                                         │
│  │ ~30ms       │   - Volume normalization                                    │
│  └─────────────┘                                                            │
│      │                                                                       │
│      ▼                                                                       │
│  ┌─────────────┐     ┌─────────────┐                                        │
│  │ FASTER      │ OR  │ WEB SPEECH  │ ← STT Engine Selection                 │
│  │ WHISPER     │     │ API         │   Based on availability                │
│  │             │     │             │                                        │
│  │ ~100-200ms  │     │ ~50-100ms   │                                        │
│  └─────────────┘     └─────────────┘                                        │
│      │                                                                       │
│      ▼                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐            │
│  │                    AI AGENT (Streaming)                      │            │
│  │                                                              │            │
│  │  Input: Transcribed text + context                          │            │
│  │  Output: Streamed tokens → immediate TTS                    │            │
│  │                                                              │            │
│  │  ~50ms to first token (streaming)                           │            │
│  └─────────────────────────────────────────────────────────────┘            │
│      │                                                                       │
│      ▼                                                                       │
│  ┌─────────────┐     ┌─────────────┐                                        │
│  │ EDGE-TTS    │ OR  │ PIPER TTS   │ ← TTS Engine Selection                 │
│  │ (Cloud)     │     │ (Local)     │   Based on latency needs               │
│  │             │     │             │                                        │
│  │ ~80ms       │     │ ~40ms       │                                        │
│  └─────────────┘     └─────────────┘                                        │
│      │                                                                       │
│      ▼                                                                       │
│  USER HEARS RESPONSE                                                        │
│                                                                              │
│  TOTAL: ~200-350ms (acceptable for conversation)                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Silero VAD Integration

Voice Activity Detection enables natural turn-taking:

```javascript
// src/services/voice/VADService.js

export class VADService {
    constructor() {
        this.model = null;
        this.isListening = false;
        this.speechStartCallback = null;
        this.speechEndCallback = null;
        
        // VAD parameters
        this.config = {
            positiveSpeechThreshold: 0.5,
            negativeSpeechThreshold: 0.35,
            redemptionFrames: 8,
            frameSamples: 1536,
            minSpeechFrames: 3,
            preSpeechPadFrames: 1,
            submitUserSpeechOnPause: false
        };
    }
    
    async initialize() {
        // Load Silero VAD ONNX model
        const ort = await import('onnxruntime-web');
        this.model = await ort.InferenceSession.create('/models/silero_vad.onnx');
        
        // Initialize audio context
        this.audioContext = new AudioContext({ sampleRate: 16000 });
    }
    
    async startListening(onSpeechStart, onSpeechEnd, onSpeechData) {
        this.speechStartCallback = onSpeechStart;
        this.speechEndCallback = onSpeechEnd;
        
        // Get microphone stream
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                channelCount: 1,
                sampleRate: 16000,
                echoCancellation: true,
                noiseSuppression: true
            }
        });
        
        // Create audio processor
        const source = this.audioContext.createMediaStreamSource(stream);
        const processor = this.audioContext.createScriptProcessor(this.config.frameSamples, 1, 1);
        
        let speechFrames = [];
        let isSpeaking = false;
        let silenceFrames = 0;
        
        processor.onaudioprocess = async (e) => {
            const audioData = e.inputBuffer.getChannelData(0);
            
            // Run VAD inference
            const speechProb = await this.runVAD(audioData);
            
            if (speechProb > this.config.positiveSpeechThreshold) {
                if (!isSpeaking) {
                    isSpeaking = true;
                    this.speechStartCallback?.();
                }
                speechFrames.push(audioData.slice());
                silenceFrames = 0;
            } else if (isSpeaking) {
                silenceFrames++;
                if (silenceFrames > this.config.redemptionFrames) {
                    // Speech ended
                    isSpeaking = false;
                    const fullAudio = this.concatenateFrames(speechFrames);
                    this.speechEndCallback?.(fullAudio);
                    onSpeechData?.(fullAudio);
                    speechFrames = [];
                }
            }
        };
        
        source.connect(processor);
        processor.connect(this.audioContext.destination);
        this.isListening = true;
    }
    
    async runVAD(audioData) {
        const tensor = new ort.Tensor('float32', audioData, [1, audioData.length]);
        const results = await this.model.run({ input: tensor });
        return results.output.data[0];
    }
    
    concatenateFrames(frames) {
        const totalLength = frames.reduce((sum, f) => sum + f.length, 0);
        const result = new Float32Array(totalLength);
        let offset = 0;
        for (const frame of frames) {
            result.set(frame, offset);
            offset += frame.length;
        }
        return result;
    }
    
    stopListening() {
        this.isListening = false;
        // Cleanup audio nodes
    }
}
```

### 2.4 Streaming Voice Response

```javascript
// src/services/voice/VoiceConversation.js

import { VADService } from './VADService.js';
import { AIAgent } from '../ai/AIAgent.js';
import { TTSService } from '../TTSService.js';

export class VoiceConversation {
    constructor() {
        this.vad = new VADService();
        this.agent = AIAgent;
        this.tts = new TTSService();
        this.isConversing = false;
    }
    
    async start(context) {
        await this.vad.initialize();
        
        this.vad.startListening(
            // On speech start
            () => {
                console.log('[Voice] User started speaking');
                this.tts.stop(); // Stop any current playback
            },
            
            // On speech end
            async (audioData) => {
                console.log('[Voice] User finished speaking');
                await this.processUserSpeech(audioData, context);
            }
        );
        
        this.isConversing = true;
    }
    
    async processUserSpeech(audioData, context) {
        // 1. Transcribe speech (fastest available engine)
        const transcription = await this.transcribe(audioData);
        console.log('[Voice] Transcribed:', transcription);
        
        if (!transcription.trim()) return;
        
        // 2. Get AI response with streaming
        const response = await this.agent.chat(transcription, {
            ...context,
            isVoice: true
        });
        
        // 3. Speak response
        await this.speakResponse(response.content);
    }
    
    async transcribe(audioData) {
        // Try Whisper first, fallback to Web Speech API
        try {
            return await this.transcribeWhisper(audioData);
        } catch {
            return await this.transcribeWebSpeech(audioData);
        }
    }
    
    async transcribeWhisper(audioData) {
        // Use existing Whisper service
        const whisper = await import('../speechRecognition.js');
        return whisper.transcribe(audioData);
    }
    
    async transcribeWebSpeech(audioData) {
        // Fallback to Web Speech API
        // Note: Web Speech API works with live audio, not buffers
        // This is a simplified example
        return new Promise((resolve, reject) => {
            const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
            recognition.lang = 'pt-PT';
            recognition.onresult = (e) => resolve(e.results[0][0].transcript);
            recognition.onerror = reject;
            recognition.start();
        });
    }
    
    async speakResponse(text) {
        // Use Edge-TTS with Portuguese voice
        await this.tts.speak(text, {
            voice: 'pt-PT-RaquelNeural',
            rate: 1.0
        });
    }
    
    stop() {
        this.vad.stopListening();
        this.tts.stop();
        this.isConversing = false;
    }
}
```

### 2.5 Voice UI Component

```javascript
// src/components/ai/VoiceChatButton.js

export class VoiceChatButton {
    constructor(container, aiAgent) {
        this.container = container;
        this.agent = aiAgent;
        this.conversation = null;
        this.isActive = false;
        this.render();
    }
    
    render() {
        this.element = document.createElement('div');
        this.element.className = 'voice-chat-container';
        this.element.innerHTML = `
            <button class="voice-chat-btn" id="voiceChatBtn">
                <span class="voice-icon">🎤</span>
                <span class="voice-status">Tap to talk</span>
            </button>
            <div class="voice-visualizer" id="voiceVisualizer" style="display: none;">
                <canvas id="waveformCanvas" width="200" height="50"></canvas>
                <div class="voice-state">Listening...</div>
            </div>
        `;
        
        this.container.appendChild(this.element);
        this.bindEvents();
    }
    
    bindEvents() {
        const btn = this.element.querySelector('#voiceChatBtn');
        
        btn.addEventListener('click', async () => {
            if (this.isActive) {
                this.stopConversation();
            } else {
                await this.startConversation();
            }
        });
    }
    
    async startConversation() {
        const { VoiceConversation } = await import('../../services/voice/VoiceConversation.js');
        this.conversation = new VoiceConversation();
        
        try {
            await this.conversation.start({
                userId: getCurrentUserId(),
                currentLesson: getCurrentLesson()
            });
            
            this.isActive = true;
            this.updateUI('listening');
        } catch (error) {
            console.error('Failed to start voice conversation:', error);
            this.showError('Microphone access required');
        }
    }
    
    stopConversation() {
        this.conversation?.stop();
        this.isActive = false;
        this.updateUI('idle');
    }
    
    updateUI(state) {
        const btn = this.element.querySelector('#voiceChatBtn');
        const visualizer = this.element.querySelector('#voiceVisualizer');
        const status = this.element.querySelector('.voice-status');
        
        switch (state) {
            case 'listening':
                btn.classList.add('active');
                visualizer.style.display = 'block';
                status.textContent = 'Listening...';
                break;
            case 'processing':
                status.textContent = 'Thinking...';
                break;
            case 'speaking':
                status.textContent = 'Speaking...';
                break;
            case 'idle':
            default:
                btn.classList.remove('active');
                visualizer.style.display = 'none';
                status.textContent = 'Tap to talk';
        }
    }
    
    showError(message) {
        // Show toast notification
    }
}
```

### 2.6 Implementation Tasks - Stage 2

| Task ID | Task | Status | Priority |
|---------|------|--------|----------|
| VOICE-001 | Create `src/services/voice/` directory | [ ] | P0 |
| VOICE-002 | Implement `VADService.js` with Silero | [ ] | P0 |
| VOICE-003 | Download/integrate Silero VAD ONNX model | [ ] | P0 |
| VOICE-004 | Implement `VoiceConversation.js` orchestrator | [ ] | P0 |
| VOICE-005 | Add streaming LLM response handling | [ ] | P0 |
| VOICE-006 | Implement `VoiceChatButton.js` component | [ ] | P0 |
| VOICE-007 | Add waveform visualizer during recording | [ ] | P1 |
| VOICE-008 | Implement voice state machine (listening/processing/speaking) | [ ] | P0 |
| VOICE-009 | Add voice settings (voice selection, speed) | [ ] | P1 |
| VOICE-010 | Test latency and optimize for <300ms | [ ] | P0 |

---

*Stage 2 Complete. Next: Stage 3 - Lesson Generation System*

---

## Stage 3: Lesson Generation System

### 3.1 Requirements

The AI must be able to create **ALL lesson types**:
- **Speaking lessons** - Pronunciation practice with scoring
- **Listening lessons** - Audio comprehension exercises  
- **Reading lessons** - Text comprehension and translation
- **Writing lessons** - Fill-in-blank, sentence construction
- **Mixed lessons** - Combination of modalities

Lessons must be:
- Stored in a simple format (JSON schema)
- Editable by admins
- Deletable only by admin (AI cannot delete existing lessons)
- Generated based on user weaknesses or topics

### 3.2 Lesson Schema DSL

```javascript
// src/data/schemas/LessonSchema.js

export const LessonSchema = {
    // Metadata
    id: 'string',           // Unique ID: "custom_001", "BB-001"
    title: 'string',        // "Nasal Vowels Practice"
    type: 'enum',           // 'standard' | 'custom' | 'ai-generated'
    modality: 'enum',       // 'speaking' | 'listening' | 'reading' | 'writing' | 'mixed'
    tier: 'number',         // 1-4 (difficulty tier)
    category: 'string',     // 'building-blocks', 'daily-life', 'custom'
    
    // Ownership & Protection
    createdBy: 'string',    // 'system' | 'admin' | 'ai' | userId
    createdAt: 'timestamp',
    isProtected: 'boolean', // true = cannot be deleted by AI
    
    // Prerequisites
    prerequisites: ['string'], // Lesson IDs that must be completed first
    
    // Content
    words: [{
        id: 'string',
        pt: 'string',           // Portuguese word
        en: 'string',           // English translation
        pronunciation: {
            ipa: 'string',      // /koɾɐˈsɐ̃w̃/
            audio: 'string',    // Audio file path or TTS reference
            syllables: 'string', // "co-ra-ção"
            tips: ['string']    // Pronunciation tips
        },
        grammar: {
            partOfSpeech: 'string',
            gender: 'string',   // 'm' | 'f' | 'n'
            plural: 'string',
            conjugation: 'object' // For verbs
        },
        examples: [{
            pt: 'string',
            en: 'string',
            audio: 'string'
        }],
        culturalNote: 'string',
        aiTip: 'string'         // Dynamically generated
    }],
    
    // Challenges
    challenges: [{
        type: 'enum',  // See challenge types below
        // ... type-specific fields
    }],
    
    // AI Metadata
    aiGeneration: {
        reason: 'string',       // "5+ failures on nasal vowels"
        basedOnData: 'object',  // The data that triggered generation
        generatedAt: 'timestamp'
    }
};

// Challenge Types
export const ChallengeTypes = {
    // SPEAKING CHALLENGES
    'pronunciation': {
        type: 'pronunciation',
        word: 'string',
        expectedIPA: 'string',
        passingScore: 'number',     // 0-100
        maxAttempts: 'number',
        hints: ['string']
    },
    
    'repeat-sentence': {
        type: 'repeat-sentence',
        sentence: { pt: 'string', en: 'string' },
        audio: 'string',
        passingScore: 'number'
    },
    
    // LISTENING CHALLENGES
    'listen-select': {
        type: 'listen-select',
        audio: 'string',            // Audio to play
        question: 'string',         // "What did you hear?"
        options: ['string'],        // Multiple choice options
        correct: 'number'           // Index of correct answer
    },
    
    'listen-type': {
        type: 'listen-type',
        audio: 'string',
        expectedText: 'string',
        acceptVariations: ['string']
    },
    
    // READING CHALLENGES
    'multiple-choice': {
        type: 'multiple-choice',
        question: 'string',
        options: ['string'],
        correct: 'number',
        explanation: 'string'
    },
    
    'translate': {
        type: 'translate',
        direction: 'pt-en' | 'en-pt',
        prompt: 'string',
        acceptedAnswers: ['string'],
        hints: ['string']
    },
    
    // WRITING CHALLENGES
    'fill-blank': {
        type: 'fill-blank',
        sentence: 'string',         // "Eu ___ português" 
        blanks: [{
            position: 'number',
            answer: 'string',
            acceptVariations: ['string']
        }],
        wordBank: ['string']        // Optional word bank
    },
    
    'sentence-build': {
        type: 'sentence-build',
        words: ['string'],          // Scrambled words
        correctOrder: ['number'],   // Correct indices
        translation: 'string'
    },
    
    'free-write': {
        type: 'free-write',
        prompt: 'string',
        minWords: 'number',
        aiEvaluation: 'boolean'     // AI grades response
    }
};
```

### 3.3 Lesson Generator Implementation

```javascript
// src/services/ai/LessonGenerator.js

import { AIAgent } from './AIAgent.js';
import { LessonSchema, ChallengeTypes } from '../../data/schemas/LessonSchema.js';

export class LessonGenerator {
    constructor() {
        this.agent = AIAgent;
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // MAIN GENERATION METHOD
    // ═══════════════════════════════════════════════════════════════════════
    
    async createLesson(params, userId) {
        const { title, focus_type, lesson_type, difficulty, word_ids } = params;
        
        // 1. Gather data for lesson generation
        const lessonData = await this.gatherLessonData(focus_type, userId, word_ids);
        
        // 2. Generate lesson structure using AI
        const lessonStructure = await this.generateStructure(
            title,
            lesson_type,
            difficulty,
            lessonData
        );
        
        // 3. Validate and save lesson
        const lesson = this.validateLesson(lessonStructure);
        await this.saveLesson(lesson, userId);
        
        return lesson;
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // DATA GATHERING
    // ═══════════════════════════════════════════════════════════════════════
    
    async gatherLessonData(focusType, userId, wordIds) {
        const progressTracker = await import('../ProgressTracker.js');
        const stats = await progressTracker.getComprehensiveStats(userId);
        
        switch (focusType) {
            case 'weak_words':
                return {
                    words: stats.weakWords.slice(0, 10),
                    reason: 'Words with success rate below 60%'
                };
                
            case 'phoneme_practice':
                const weakPhonemes = stats.phonemeScores
                    .filter(p => p.score < 70)
                    .map(p => p.phoneme);
                return {
                    phonemes: weakPhonemes,
                    words: this.getWordsWithPhonemes(weakPhonemes),
                    reason: 'Phonemes with score below 70%'
                };
                
            case 'confusion_pairs':
                return {
                    pairs: stats.confusionPairs.slice(0, 5),
                    reason: 'Words frequently confused'
                };
                
            case 'topic':
                // AI will generate topic-based content
                return { topic: true };
                
            default:
                if (wordIds?.length) {
                    return {
                        words: await this.getWordsByIds(wordIds),
                        reason: 'User-selected words'
                    };
                }
                return { words: stats.weakWords.slice(0, 10) };
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // AI STRUCTURE GENERATION
    // ═══════════════════════════════════════════════════════════════════════
    
    async generateStructure(title, modality, difficulty, data) {
        const prompt = this.buildGenerationPrompt(title, modality, difficulty, data);
        
        // Use Ollama with structured output
        const response = await fetch('http://localhost:11434/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'qwen2.5:7b',
                messages: [
                    { role: 'system', content: this.getGeneratorSystemPrompt() },
                    { role: 'user', content: prompt }
                ],
                format: this.getLessonJSONSchema(),
                stream: false
            })
        });
        
        const result = await response.json();
        return JSON.parse(result.message.content);
    }
    
    buildGenerationPrompt(title, modality, difficulty, data) {
        return `Create a Portuguese lesson with these specifications:

TITLE: ${title}
MODALITY: ${modality}
DIFFICULTY: ${difficulty}

DATA TO INCORPORATE:
${JSON.stringify(data, null, 2)}

REQUIREMENTS:
1. Include 5-10 words appropriate for the modality
2. Create 8-12 challenges matching the modality:
   - Speaking: pronunciation, repeat-sentence
   - Listening: listen-select, listen-type
   - Reading: multiple-choice, translate
   - Writing: fill-blank, sentence-build
   - Mixed: combination of all types
3. Each word needs: pt, en, IPA pronunciation, example sentences
4. Challenges should progress from easy to hard
5. Include cultural notes where relevant
6. Generate helpful AI tips for each word

Return a complete lesson JSON matching the schema.`;
    }
    
    getGeneratorSystemPrompt() {
        return `You are a Portuguese language lesson generator. 
You create structured lesson content in JSON format.
Always use European Portuguese (pt-PT), never Brazilian.
Include accurate IPA pronunciations.
Make lessons engaging with varied challenge types.
Ensure grammar notes are accurate.`;
    }
    
    getLessonJSONSchema() {
        // Pydantic-style schema for Ollama structured output
        return {
            type: 'object',
            properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                modality: { type: 'string', enum: ['speaking', 'listening', 'reading', 'writing', 'mixed'] },
                tier: { type: 'integer', minimum: 1, maximum: 4 },
                words: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            pt: { type: 'string' },
                            en: { type: 'string' },
                            pronunciation: {
                                type: 'object',
                                properties: {
                                    ipa: { type: 'string' },
                                    tips: { type: 'array', items: { type: 'string' } }
                                }
                            },
                            examples: { type: 'array', items: { type: 'object' } }
                        },
                        required: ['id', 'pt', 'en']
                    }
                },
                challenges: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            type: { type: 'string' },
                            // Dynamic based on challenge type
                        }
                    }
                }
            },
            required: ['id', 'title', 'modality', 'words', 'challenges']
        };
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // VALIDATION & STORAGE
    // ═══════════════════════════════════════════════════════════════════════
    
    validateLesson(lesson) {
        // Ensure required fields
        if (!lesson.id || !lesson.title || !lesson.words?.length) {
            throw new Error('Invalid lesson structure');
        }
        
        // Add metadata
        return {
            ...lesson,
            type: 'ai-generated',
            createdBy: 'ai',
            createdAt: Date.now(),
            isProtected: false,  // AI-generated can be deleted
            category: 'custom'
        };
    }
    
    async saveLesson(lesson, userId) {
        // Save to user's custom lessons
        const storageKey = `${userId}_customLessons`;
        const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
        existing.push(lesson);
        localStorage.setItem(storageKey, JSON.stringify(existing));
        
        // Emit event for UI update
        window.dispatchEvent(new CustomEvent('lessonCreated', { detail: lesson }));
        
        return lesson;
    }
}

export default new LessonGenerator();
```

### 3.4 Lesson Protection Rules

```javascript
// src/services/ai/LessonProtection.js

export const LessonProtection = {
    // Rules for lesson deletion
    canDelete(lesson, requestedBy) {
        // System lessons are NEVER deletable
        if (lesson.createdBy === 'system') {
            return { allowed: false, reason: 'System lessons cannot be deleted' };
        }
        
        // Admin can delete anything non-system
        if (requestedBy.isAdmin) {
            return { allowed: true };
        }
        
        // AI cannot delete lessons
        if (requestedBy === 'ai') {
            return { allowed: false, reason: 'AI cannot delete lessons' };
        }
        
        // Users can only delete their own AI-generated lessons
        if (lesson.createdBy === 'ai' && lesson.createdFor === requestedBy.userId) {
            return { allowed: true };
        }
        
        return { allowed: false, reason: 'Permission denied' };
    },
    
    // Rules for lesson editing
    canEdit(lesson, requestedBy) {
        if (lesson.createdBy === 'system') {
            // Only admin can edit system lessons
            return { allowed: requestedBy.isAdmin };
        }
        
        if (requestedBy.isAdmin) {
            return { allowed: true };
        }
        
        // AI cannot edit existing lessons
        if (requestedBy === 'ai') {
            return { allowed: false, reason: 'AI cannot edit existing lessons' };
        }
        
        return { allowed: false };
    }
};
```

### 3.5 Implementation Tasks - Stage 3

| Task ID | Task | Status | Priority |
|---------|------|--------|----------|
| LESSON-GEN-001 | Create `LessonSchema.js` with full schema | [ ] | P0 |
| LESSON-GEN-002 | Implement `LessonGenerator.js` | [ ] | P0 |
| LESSON-GEN-003 | Add structured output schema for Ollama | [ ] | P0 |
| LESSON-GEN-004 | Implement `LessonProtection.js` | [ ] | P0 |
| LESSON-GEN-005 | Create speaking lesson generator | [ ] | P0 |
| LESSON-GEN-006 | Create listening lesson generator | [ ] | P0 |
| LESSON-GEN-007 | Create reading lesson generator | [ ] | P0 |
| LESSON-GEN-008 | Create writing lesson generator | [ ] | P0 |
| LESSON-GEN-009 | Create mixed lesson generator | [ ] | P0 |
| LESSON-GEN-010 | Add UI for custom lesson management | [ ] | P1 |
| LESSON-GEN-011 | Unit tests for LessonGenerator | [ ] | P0 |
| LESSON-GEN-012 | E2E tests for lesson creation flow | [ ] | P0 |

---

*Stage 3 Complete. Next: Stage 4 - Adaptive Learning Engine*

---

## Stage 4: Adaptive Learning Engine

### 4.1 Core Principles

Based on language learning research (Krashen i+1, CAPT, FSRS):

1. **Comprehensible Input (i+1)**: Content slightly above current level
2. **Adaptive Difficulty**: Adjust in real-time based on performance
3. **Spaced Repetition**: FSRS-5 algorithm (replaces SM-2)
4. **Multimodal Learning**: Different styles for different learners
5. **Immediate Feedback**: Correct errors within seconds

### 4.2 FSRS-5 Algorithm Upgrade

Replace the 30-year-old SM-2 with modern FSRS-5:

```javascript
// src/services/learning/FSRSEngine.js

/**
 * FSRS-5 Spaced Repetition Algorithm
 * Based on: https://github.com/open-spaced-repetition/fsrs4anki
 * 
 * Key improvements over SM-2:
 * - Learns from user's actual review history
 * - Predicts memory stability more accurately
 * - Adapts to individual learning patterns
 * - Similar performance to SM-17 (latest)
 */

export class FSRSEngine {
    constructor() {
        // Default FSRS-5 parameters (can be personalized)
        this.params = {
            w: [0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61],
            requestRetention: 0.9,  // Target 90% retention
            maximumInterval: 36500, // Max 100 years
            easyBonus: 1.3,
            hardInterval: 1.2
        };
    }
    
    /**
     * Calculate next review based on FSRS-5
     * @param {Object} card - Card state (difficulty, stability, etc.)
     * @param {number} rating - User rating (1=Again, 2=Hard, 3=Good, 4=Easy)
     * @returns {Object} Updated card state with next interval
     */
    schedule(card, rating) {
        const now = Date.now();
        const elapsedDays = card.lastReview 
            ? (now - card.lastReview) / (1000 * 60 * 60 * 24) 
            : 0;
        
        // Calculate retrievability (probability of recall)
        const retrievability = this.calculateRetrievability(card.stability, elapsedDays);
        
        // Update stability based on rating
        const newStability = this.updateStability(
            card.stability,
            card.difficulty,
            retrievability,
            rating
        );
        
        // Update difficulty
        const newDifficulty = this.updateDifficulty(card.difficulty, rating);
        
        // Calculate next interval
        const interval = this.calculateInterval(newStability);
        
        return {
            ...card,
            stability: newStability,
            difficulty: newDifficulty,
            lastReview: now,
            nextReview: now + (interval * 24 * 60 * 60 * 1000),
            interval,
            reps: card.reps + 1,
            lapses: rating === 1 ? card.lapses + 1 : card.lapses
        };
    }
    
    /**
     * Calculate probability of recall (retrievability)
     * R(t) = e^(-t/S) where S is stability
     */
    calculateRetrievability(stability, elapsedDays) {
        if (stability <= 0) return 0;
        return Math.exp(-elapsedDays / stability);
    }
    
    /**
     * Update stability based on FSRS-5 formula
     */
    updateStability(stability, difficulty, retrievability, rating) {
        const w = this.params.w;
        
        if (rating === 1) {
            // Forgot - stability decreases
            return w[11] * Math.pow(difficulty, -w[12]) * 
                   (Math.pow(stability + 1, w[13]) - 1) * 
                   Math.exp(w[14] * (1 - retrievability));
        }
        
        // Remembered - stability increases
        const hardPenalty = rating === 2 ? w[15] : 1;
        const easyBonus = rating === 4 ? w[16] : 1;
        
        return stability * (
            1 + Math.exp(w[8]) * 
            (11 - difficulty) * 
            Math.pow(stability, -w[9]) * 
            (Math.exp(w[10] * (1 - retrievability)) - 1) * 
            hardPenalty * easyBonus
        );
    }
    
    /**
     * Update difficulty based on rating
     */
    updateDifficulty(difficulty, rating) {
        const w = this.params.w;
        const nextDifficulty = difficulty - w[6] * (rating - 3);
        
        // Clamp between 1 and 10
        return Math.min(10, Math.max(1, 
            w[7] * this.params.w[4] + (1 - w[7]) * nextDifficulty
        ));
    }
    
    /**
     * Calculate optimal interval for target retention
     */
    calculateInterval(stability) {
        const interval = stability * Math.log(this.params.requestRetention) / Math.log(0.9);
        return Math.min(this.params.maximumInterval, Math.max(1, Math.round(interval)));
    }
    
    /**
     * Initialize new card
     */
    initCard(wordId) {
        return {
            wordId,
            stability: 0,
            difficulty: 5,  // Start at medium difficulty
            lastReview: null,
            nextReview: Date.now(),
            interval: 0,
            reps: 0,
            lapses: 0
        };
    }
    
    /**
     * Get cards due for review
     */
    getDueCards(cards) {
        const now = Date.now();
        return cards
            .filter(c => c.nextReview <= now)
            .sort((a, b) => a.nextReview - b.nextReview);
    }
}

export default new FSRSEngine();
```

### 4.3 Learner Profile System

```javascript
// src/services/ai/LearnerProfiler.js

export class LearnerProfiler {
    constructor() {
        this.profileCache = new Map();
    }
    
    /**
     * Build comprehensive learner profile from event history
     */
    async getProfile(userId) {
        if (this.profileCache.has(userId)) {
            return this.profileCache.get(userId);
        }
        
        const events = await this.getEventHistory(userId);
        const profile = this.analyzeEvents(events);
        
        this.profileCache.set(userId, profile);
        return profile;
    }
    
    analyzeEvents(events) {
        return {
            // Learning Style Detection
            preferredStyle: this.detectLearningStyle(events),
            
            // Performance Patterns
            bestTimeOfDay: this.detectBestTime(events),
            optimalSessionLength: this.detectOptimalSession(events),
            attentionPattern: this.detectAttentionPattern(events),
            
            // Weakness Analysis
            weakWords: this.findWeakWords(events),
            weakPhonemes: this.findWeakPhonemes(events),
            confusionPairs: this.findConfusionPairs(events),
            
            // Strength Analysis
            strongWords: this.findStrongWords(events),
            masteredPhonemes: this.findMasteredPhonemes(events),
            
            // Progress Metrics
            learningVelocity: this.calculateVelocity(events),
            retentionRate: this.calculateRetention(events),
            streakData: this.calculateStreak(events),
            
            // Engagement Patterns
            preferredChallengeTypes: this.detectPreferredChallenges(events),
            skippedChallengeTypes: this.detectSkippedChallenges(events),
            helpSeekingPattern: this.detectHelpPattern(events)
        };
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // LEARNING STYLE DETECTION
    // ═══════════════════════════════════════════════════════════════════════
    
    detectLearningStyle(events) {
        const styles = {
            visual: 0,      // Prefers reading, images
            auditory: 0,    // Prefers listening, speaking
            kinesthetic: 0  // Prefers typing, interaction
        };
        
        for (const event of events) {
            // Visual indicators
            if (event.type === 'option_expand' && event.panel === 'examples') {
                styles.visual++;
            }
            
            // Auditory indicators
            if (event.type === 'audio_play' || event.type === 'pronunciation_attempt') {
                styles.auditory++;
            }
            
            // Kinesthetic indicators
            if (event.type === 'fill-blank' || event.type === 'sentence-build') {
                styles.kinesthetic++;
            }
        }
        
        const total = styles.visual + styles.auditory + styles.kinesthetic || 1;
        
        return {
            visual: styles.visual / total,
            auditory: styles.auditory / total,
            kinesthetic: styles.kinesthetic / total,
            dominant: Object.entries(styles).sort((a, b) => b[1] - a[1])[0][0]
        };
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // TIME PATTERN DETECTION
    // ═══════════════════════════════════════════════════════════════════════
    
    detectBestTime(events) {
        const hourlyPerformance = new Array(24).fill(null).map(() => ({
            attempts: 0,
            correct: 0
        }));
        
        for (const event of events) {
            if (event.type !== 'answer_attempt') continue;
            
            const hour = new Date(event.timestamp).getHours();
            hourlyPerformance[hour].attempts++;
            if (event.wasCorrect) {
                hourlyPerformance[hour].correct++;
            }
        }
        
        // Find best performing hours
        const hourlyScores = hourlyPerformance.map((h, i) => ({
            hour: i,
            score: h.attempts > 5 ? h.correct / h.attempts : 0
        }));
        
        hourlyScores.sort((a, b) => b.score - a.score);
        
        return {
            bestHours: hourlyScores.slice(0, 3).map(h => h.hour),
            worstHours: hourlyScores.slice(-3).map(h => h.hour),
            recommendation: this.getTimeRecommendation(hourlyScores[0].hour)
        };
    }
    
    getTimeRecommendation(bestHour) {
        if (bestHour >= 5 && bestHour < 12) return 'morning_learner';
        if (bestHour >= 12 && bestHour < 17) return 'afternoon_learner';
        if (bestHour >= 17 && bestHour < 21) return 'evening_learner';
        return 'night_owl';
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // WEAKNESS DETECTION
    // ═══════════════════════════════════════════════════════════════════════
    
    findWeakWords(events) {
        const wordStats = new Map();
        
        for (const event of events) {
            if (!event.wordId) continue;
            
            if (!wordStats.has(event.wordId)) {
                wordStats.set(event.wordId, {
                    word: event.word,
                    attempts: 0,
                    correct: 0,
                    pronunciationScores: [],
                    lastAttempt: 0
                });
            }
            
            const stats = wordStats.get(event.wordId);
            
            if (event.type === 'answer_attempt') {
                stats.attempts++;
                if (event.wasCorrect) stats.correct++;
                stats.lastAttempt = event.timestamp;
            }
            
            if (event.type === 'pronunciation_attempt') {
                stats.pronunciationScores.push(event.score);
            }
        }
        
        // Calculate weakness score
        const weakWords = [];
        for (const [wordId, stats] of wordStats) {
            if (stats.attempts < 3) continue; // Need enough data
            
            const successRate = stats.correct / stats.attempts;
            const avgPronunciation = stats.pronunciationScores.length 
                ? stats.pronunciationScores.reduce((a, b) => a + b, 0) / stats.pronunciationScores.length
                : 100;
            
            // Weakness score: lower is weaker
            const weaknessScore = (successRate * 0.6) + (avgPronunciation / 100 * 0.4);
            
            if (weaknessScore < 0.6) {
                weakWords.push({
                    wordId,
                    word: stats.word,
                    successRate,
                    avgPronunciation,
                    weaknessScore,
                    lastAttempt: stats.lastAttempt
                });
            }
        }
        
        return weakWords.sort((a, b) => a.weaknessScore - b.weaknessScore);
    }
    
    findWeakPhonemes(events) {
        const phonemeStats = new Map();
        
        for (const event of events) {
            if (event.type !== 'pronunciation_attempt' || !event.phonemeBreakdown) continue;
            
            for (const phoneme of event.phonemeBreakdown) {
                if (!phonemeStats.has(phoneme.phoneme)) {
                    phonemeStats.set(phoneme.phoneme, {
                        phoneme: phoneme.phoneme,
                        scores: [],
                        issues: []
                    });
                }
                
                const stats = phonemeStats.get(phoneme.phoneme);
                stats.scores.push(phoneme.score);
                if (phoneme.issue) stats.issues.push(phoneme.issue);
            }
        }
        
        // Find weak phonemes
        const weakPhonemes = [];
        for (const [phoneme, stats] of phonemeStats) {
            if (stats.scores.length < 5) continue;
            
            const avgScore = stats.scores.reduce((a, b) => a + b, 0) / stats.scores.length;
            
            if (avgScore < 70) {
                weakPhonemes.push({
                    phoneme,
                    avgScore,
                    attempts: stats.scores.length,
                    commonIssue: this.getMostCommon(stats.issues)
                });
            }
        }
        
        return weakPhonemes.sort((a, b) => a.avgScore - b.avgScore);
    }
    
    findConfusionPairs(events) {
        const confusions = new Map();
        
        for (const event of events) {
            if (event.type !== 'answer_attempt' || event.wasCorrect) continue;
            
            const pair = [event.correctAnswer, event.userAnswer].sort().join('|');
            
            if (!confusions.has(pair)) {
                confusions.set(pair, {
                    word1: event.correctAnswer,
                    word2: event.userAnswer,
                    count: 0
                });
            }
            
            confusions.get(pair).count++;
        }
        
        return Array.from(confusions.values())
            .filter(c => c.count >= 2)
            .sort((a, b) => b.count - a.count);
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // UTILITY METHODS
    // ═══════════════════════════════════════════════════════════════════════
    
    getMostCommon(arr) {
        if (!arr.length) return null;
        const counts = {};
        arr.forEach(item => counts[item] = (counts[item] || 0) + 1);
        return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
    }
    
    async getEventHistory(userId) {
        const key = `${userId}_events`;
        return JSON.parse(localStorage.getItem(key) || '[]');
    }
    
    invalidateCache(userId) {
        this.profileCache.delete(userId);
    }
}

export default new LearnerProfiler();
```

### 4.4 Adaptive Difficulty System

```javascript
// src/services/learning/AdaptiveDifficulty.js

export class AdaptiveDifficulty {
    constructor() {
        // Krashen's i+1: content just above current level
        this.targetDifficulty = 0.7; // 70% success rate = optimal challenge
        this.adjustmentRate = 0.1;   // How fast to adjust
    }
    
    /**
     * Calculate optimal difficulty for next challenge
     */
    calculateNextDifficulty(recentPerformance, currentDifficulty) {
        const recentSuccessRate = this.calculateRecentSuccess(recentPerformance);
        
        // If too easy (>85% success), increase difficulty
        if (recentSuccessRate > 0.85) {
            return Math.min(1.0, currentDifficulty + this.adjustmentRate);
        }
        
        // If too hard (<55% success), decrease difficulty  
        if (recentSuccessRate < 0.55) {
            return Math.max(0.1, currentDifficulty - this.adjustmentRate);
        }
        
        // In sweet spot, maintain
        return currentDifficulty;
    }
    
    /**
     * Select words/challenges matching target difficulty
     */
    selectContent(availableContent, profile, count = 10) {
        const targetDiff = this.calculateNextDifficulty(
            profile.recentPerformance,
            profile.currentDifficulty
        );
        
        // Score each content item by how well it matches target difficulty
        const scored = availableContent.map(item => ({
            ...item,
            matchScore: 1 - Math.abs(item.difficulty - targetDiff)
        }));
        
        // Interleaving: mix weak words with known words
        const weakWords = profile.weakWords.slice(0, Math.ceil(count * 0.4));
        const matchedWords = scored
            .filter(w => !weakWords.find(ww => ww.wordId === w.id))
            .sort((a, b) => b.matchScore - a.matchScore)
            .slice(0, count - weakWords.length);
        
        // Combine and shuffle
        const result = [...weakWords, ...matchedWords];
        return this.shuffle(result);
    }
    
    calculateRecentSuccess(performance, window = 20) {
        const recent = performance.slice(-window);
        if (!recent.length) return 0.5;
        
        const correct = recent.filter(p => p.correct).length;
        return correct / recent.length;
    }
    
    shuffle(array) {
        const result = [...array];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }
}
```

### 4.5 Implementation Tasks - Stage 4

| Task ID | Task | Status | Priority |
|---------|------|--------|----------|
| ADAPT-001 | Implement `FSRSEngine.js` | [ ] | P0 |
| ADAPT-002 | Migrate from SM-2 to FSRS-5 | [ ] | P0 |
| ADAPT-003 | Implement `LearnerProfiler.js` | [ ] | P0 |
| ADAPT-004 | Add learning style detection | [ ] | P1 |
| ADAPT-005 | Add best-time-of-day detection | [ ] | P1 |
| ADAPT-006 | Implement weakness detection | [ ] | P0 |
| ADAPT-007 | Implement confusion pair detection | [ ] | P0 |
| ADAPT-008 | Implement `AdaptiveDifficulty.js` | [ ] | P0 |
| ADAPT-009 | Wire profiler to AI Agent context | [ ] | P0 |
| ADAPT-010 | Create learner profile dashboard | [ ] | P1 |
| ADAPT-011 | Unit tests for FSRSEngine | [ ] | P0 |
| ADAPT-012 | Unit tests for LearnerProfiler | [ ] | P0 |

---

*Stage 4 Complete. Next: Stage 5 - Memory & Context Management*

---

## Stage 5: Memory & Context Management

### 5.1 The Challenge

LLMs have limited context windows. With Qwen2.5-7B at 4096 tokens:
- Can't include entire conversation history
- Can't include all user progress data
- Need smart context selection

Research shows: **Mem0 reduces token costs by 80-90%** while maintaining quality.

### 5.2 Memory Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          MEMORY MANAGEMENT SYSTEM                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                      CONTEXT WINDOW (4096 tokens)                     │  │
│  ├───────────────────────────────────────────────────────────────────────┤  │
│  │                                                                        │  │
│  │  SYSTEM PROMPT (fixed)                             ~500 tokens        │  │
│  │  ┌───────────────────────────────────────────────────────────────┐   │  │
│  │  │ Role, personality, tools, constraints                         │   │  │
│  │  └───────────────────────────────────────────────────────────────┘   │  │
│  │                                                                        │  │
│  │  COMPRESSED CONTEXT (dynamic)                      ~1000 tokens       │  │
│  │  ┌───────────────────────────────────────────────────────────────┐   │  │
│  │  │ User profile summary                                          │   │  │
│  │  │ Current lesson context                                        │   │  │
│  │  │ Top 5 weak words + issues                                     │   │  │
│  │  │ Recent AI tips given (deduplicated)                          │   │  │
│  │  └───────────────────────────────────────────────────────────────┘   │  │
│  │                                                                        │  │
│  │  CONVERSATION HISTORY (sliding window)             ~1500 tokens       │  │
│  │  ┌───────────────────────────────────────────────────────────────┐   │  │
│  │  │ Last 8-10 messages (summarized if older)                     │   │  │
│  │  │ Tool call results                                             │   │  │
│  │  └───────────────────────────────────────────────────────────────┘   │  │
│  │                                                                        │  │
│  │  USER MESSAGE + RESPONSE BUFFER                    ~1000 tokens       │  │
│  │  ┌───────────────────────────────────────────────────────────────┐   │  │
│  │  │ Current user message                                          │   │  │
│  │  │ Space for AI response                                         │   │  │
│  │  └───────────────────────────────────────────────────────────────┘   │  │
│  │                                                                        │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                    LONG-TERM STORAGE (localStorage)                   │  │
│  ├───────────────────────────────────────────────────────────────────────┤  │
│  │                                                                        │  │
│  │  Full Event History         │  Full Chat History      │  Learner      │  │
│  │  (last 1000 events)         │  (all conversations)    │  Profile      │  │
│  │                              │                         │               │  │
│  │  Retrieved via tools when   │  Summarized before      │  Updated      │  │
│  │  AI needs specific data     │  adding to context      │  async        │  │
│  │                              │                         │               │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.3 Memory Manager Implementation

```javascript
// src/services/ai/MemoryManager.js

export class MemoryManager {
    constructor() {
        this.maxTokens = 4096;
        this.systemPromptTokens = 500;
        this.contextTokens = 1000;
        this.historyTokens = 1500;
        this.responseBuffer = 1000;
        
        this.conversationHistory = [];
        this.contextCache = null;
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // CONTEXT BUILDING
    // ═══════════════════════════════════════════════════════════════════════
    
    async buildContext(userId) {
        if (this.contextCache?.userId === userId && 
            Date.now() - this.contextCache.timestamp < 30000) {
            return this.contextCache.context;
        }
        
        const profile = await this.getCompressedProfile(userId);
        const lessonContext = await this.getCurrentLessonContext();
        const recentTips = await this.getRecentTips(userId, 5);
        
        const context = {
            user: {
                name: profile.username,
                level: profile.level,
                totalWords: profile.totalWordsLearned,
                streak: profile.currentStreak
            },
            weakAreas: profile.weakWords.slice(0, 5).map(w => ({
                word: w.word,
                issue: w.mainIssue,
                successRate: Math.round(w.successRate * 100) + '%'
            })),
            currentLesson: lessonContext ? {
                title: lessonContext.title,
                word: lessonContext.currentWord,
                progress: `${lessonContext.progress}/${lessonContext.total}`
            } : null,
            recentTips: recentTips
        };
        
        this.contextCache = {
            userId,
            timestamp: Date.now(),
            context
        };
        
        return context;
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // CONVERSATION HISTORY (SLIDING WINDOW)
    // ═══════════════════════════════════════════════════════════════════════
    
    addMessage(role, content) {
        this.conversationHistory.push({
            role,
            content,
            timestamp: Date.now()
        });
        
        // Keep only recent messages
        this.trimHistory();
    }
    
    trimHistory() {
        const maxMessages = 10;
        
        if (this.conversationHistory.length > maxMessages) {
            // Summarize old messages before removing
            const oldMessages = this.conversationHistory.slice(0, -maxMessages);
            const summary = this.summarizeMessages(oldMessages);
            
            // Keep summary + recent messages
            this.conversationHistory = [
                { role: 'system', content: `Previous conversation summary: ${summary}` },
                ...this.conversationHistory.slice(-maxMessages)
            ];
        }
    }
    
    summarizeMessages(messages) {
        // Simple extractive summary for now
        // Could use LLM for better summary
        const topics = new Set();
        const words = new Set();
        
        for (const msg of messages) {
            // Extract Portuguese words mentioned
            const ptWords = msg.content.match(/\*\*(\w+)\*\*/g);
            ptWords?.forEach(w => words.add(w.replace(/\*/g, '')));
            
            // Detect topics
            if (msg.content.includes('pronunciation')) topics.add('pronunciation');
            if (msg.content.includes('grammar')) topics.add('grammar');
            if (msg.content.includes('lesson')) topics.add('lessons');
        }
        
        return `Discussed: ${Array.from(topics).join(', ')}. Words: ${Array.from(words).slice(0, 5).join(', ')}`;
    }
    
    getRecentHistory(count = 10) {
        return this.conversationHistory.slice(-count);
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // HELPER METHODS
    // ═══════════════════════════════════════════════════════════════════════
    
    async getCompressedProfile(userId) {
        const { LearnerProfiler } = await import('./LearnerProfiler.js');
        const profile = await LearnerProfiler.getProfile(userId);
        
        // Return only essential data
        return {
            username: profile.username,
            level: profile.level,
            totalWordsLearned: profile.totalWords,
            currentStreak: profile.streakDays,
            weakWords: profile.weakWords.slice(0, 10),
            learningStyle: profile.preferredStyle.dominant
        };
    }
    
    async getCurrentLessonContext() {
        // Get from app state
        const lesson = window.currentLesson;
        if (!lesson) return null;
        
        return {
            title: lesson.title,
            currentWord: lesson.words[lesson.currentIndex],
            progress: lesson.currentIndex + 1,
            total: lesson.words.length
        };
    }
    
    async getRecentTips(userId, count) {
        const key = `${userId}_aiTips`;
        const tips = JSON.parse(localStorage.getItem(key) || '[]');
        return tips.slice(-count).map(t => t.tip);
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // TOKEN ESTIMATION
    // ═══════════════════════════════════════════════════════════════════════
    
    estimateTokens(text) {
        // Rough estimation: ~4 chars per token for English
        // Portuguese may vary slightly
        return Math.ceil(text.length / 4);
    }
    
    async canAddMessage(message) {
        const currentTokens = this.estimateTokens(
            JSON.stringify(this.conversationHistory)
        );
        const messageTokens = this.estimateTokens(message);
        
        const available = this.maxTokens - this.systemPromptTokens - 
                         this.contextTokens - this.responseBuffer;
        
        return currentTokens + messageTokens < available;
    }
    
    clearHistory() {
        this.conversationHistory = [];
        this.contextCache = null;
    }
}

export default new MemoryManager();
```

### 5.4 Implementation Tasks - Stage 5

| Task ID | Task | Status | Priority |
|---------|------|--------|----------|
| MEM-001 | Implement `MemoryManager.js` | [ ] | P0 |
| MEM-002 | Add sliding context window | [ ] | P0 |
| MEM-003 | Implement conversation summarization | [ ] | P1 |
| MEM-004 | Add context compression | [ ] | P0 |
| MEM-005 | Implement token estimation | [ ] | P0 |
| MEM-006 | Wire memory manager to AIAgent | [ ] | P0 |
| MEM-007 | Add context caching | [ ] | P1 |
| MEM-008 | Unit tests for MemoryManager | [ ] | P0 |

---

## Stage 6: Web Search Integration

### 6.1 Whitelisted Sources

The AI can ONLY search these authoritative Portuguese resources:

| Source | URL | Purpose |
|--------|-----|---------|
| Priberam | priberam.pt/dlpo | Dictionary, definitions |
| Infopédia | infopedia.pt | Encyclopedia, grammar |
| Ciberdúvidas | ciberduvidas.iscte-iul.pt | Grammar authority |
| Linguee | linguee.pt | Translation context |
| Forvo | forvo.com/languages/pt_pt | Pronunciation |
| European Portuguese Info | european-portuguese.info | Learning resources |

### 6.2 Web Search Tool Implementation

```javascript
// src/services/ai/WebSearchTool.js

export class WebSearchTool {
    constructor() {
        this.whitelist = {
            dictionary: [
                { name: 'Priberam', url: 'https://dicionario.priberam.org/', pattern: '/search?q=' },
                { name: 'Infopédia', url: 'https://www.infopedia.pt/', pattern: 'search?q=' }
            ],
            grammar: [
                { name: 'Ciberdúvidas', url: 'https://ciberduvidas.iscte-iul.pt/', pattern: 'pesquisa/' },
                { name: 'European Portuguese', url: 'https://european-portuguese.info/', pattern: 'search?q=' }
            ],
            pronunciation: [
                { name: 'Forvo', url: 'https://forvo.com/', pattern: 'search/pt/' }
            ],
            translation: [
                { name: 'Linguee', url: 'https://www.linguee.pt/', pattern: 'search?query=' }
            ]
        };
        
        this.cache = new Map();
        this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
    }
    
    /**
     * Search whitelisted sources for information
     */
    async searchWhitelisted(query, sourceType = 'all') {
        // Check cache first
        const cacheKey = `${sourceType}:${query}`;
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheExpiry) {
                return cached.results;
            }
        }
        
        const sources = sourceType === 'all' 
            ? Object.values(this.whitelist).flat()
            : this.whitelist[sourceType] || [];
        
        const results = await Promise.all(
            sources.map(source => this.searchSource(source, query))
        );
        
        const flatResults = results.flat().filter(r => r !== null);
        
        // Cache results
        this.cache.set(cacheKey, {
            timestamp: Date.now(),
            results: flatResults
        });
        
        return flatResults;
    }
    
    async searchSource(source, query) {
        try {
            // Use backend proxy to avoid CORS
            const response = await fetch('/api/web-search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    source: source.name,
                    url: source.url + source.pattern + encodeURIComponent(query)
                })
            });
            
            if (!response.ok) return null;
            
            const data = await response.json();
            
            return {
                source: source.name,
                url: data.url,
                title: data.title,
                snippet: data.snippet,
                relevance: this.calculateRelevance(data.snippet, query)
            };
        } catch (error) {
            console.warn(`Search failed for ${source.name}:`, error);
            return null;
        }
    }
    
    calculateRelevance(snippet, query) {
        if (!snippet) return 0;
        const words = query.toLowerCase().split(/\s+/);
        const snippetLower = snippet.toLowerCase();
        const matches = words.filter(w => snippetLower.includes(w)).length;
        return matches / words.length;
    }
    
    /**
     * Look up a specific word in dictionary
     */
    async lookupWord(word) {
        const results = await this.searchWhitelisted(word, 'dictionary');
        
        if (!results.length) {
            return { found: false, word };
        }
        
        // Parse dictionary result
        const best = results.sort((a, b) => b.relevance - a.relevance)[0];
        
        return {
            found: true,
            word,
            source: best.source,
            definition: best.snippet,
            url: best.url
        };
    }
    
    /**
     * Get pronunciation from Forvo
     */
    async getPronunciation(word) {
        const results = await this.searchWhitelisted(word, 'pronunciation');
        
        if (!results.length) {
            return { found: false, word };
        }
        
        return {
            found: true,
            word,
            url: results[0].url,
            hasAudio: true
        };
    }
}

export default new WebSearchTool();
```

### 6.3 Backend Proxy for CORS

```javascript
// server.js (add this route)

app.post('/api/web-search', async (req, res) => {
    const { url, source } = req.body;
    
    // Validate URL is whitelisted
    const allowedDomains = [
        'priberam.org',
        'infopedia.pt',
        'ciberduvidas.iscte-iul.pt',
        'linguee.pt',
        'forvo.com',
        'european-portuguese.info'
    ];
    
    const urlObj = new URL(url);
    if (!allowedDomains.some(d => urlObj.hostname.includes(d))) {
        return res.status(403).json({ error: 'Domain not whitelisted' });
    }
    
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'PortuLingo/1.0 (Language Learning App)'
            }
        });
        
        const html = await response.text();
        
        // Parse HTML to extract relevant content
        const parsed = parseSearchResult(html, source);
        
        res.json(parsed);
    } catch (error) {
        res.status(500).json({ error: 'Search failed' });
    }
});
```

### 6.4 Implementation Tasks - Stage 6

| Task ID | Task | Status | Priority |
|---------|------|--------|----------|
| WEB-001 | Implement `WebSearchTool.js` | [ ] | P1 |
| WEB-002 | Add backend CORS proxy | [ ] | P1 |
| WEB-003 | Implement result caching | [ ] | P1 |
| WEB-004 | Add dictionary lookup tool | [ ] | P1 |
| WEB-005 | Add pronunciation lookup tool | [ ] | P1 |
| WEB-006 | Wire to AI Agent tools | [ ] | P1 |
| WEB-007 | Add admin whitelist management UI | [ ] | P2 |
| WEB-008 | Unit tests for WebSearchTool | [ ] | P1 |

---

## Implementation Priority Summary

### Phase 1: Core Foundation (Weeks 1-2)
| Stage | Tasks | Priority |
|-------|-------|----------|
| Stage 1 | AI Agent + Tool Registry | P0 |
| Stage 4 | FSRS-5 + Learner Profiler | P0 |
| Stage 5 | Memory Manager | P0 |

### Phase 2: Voice & Generation (Weeks 3-4)
| Stage | Tasks | Priority |
|-------|-------|----------|
| Stage 2 | Voice Pipeline + VAD | P0 |
| Stage 3 | Lesson Generator | P0 |

### Phase 3: Enhancement (Weeks 5-6)
| Stage | Tasks | Priority |
|-------|-------|----------|
| Stage 6 | Web Search | P1 |
| Stage 4 | Learning Style Detection | P1 |
| All | Admin Dashboards | P1 |

---

## Appendix: Research Sources

### Voice AI
1. TEN Framework - WebSocket voice assistant architecture (2025)
2. Silero VAD - Browser-based voice activity detection
3. Faster Whisper - CTranslate2 optimized STT
4. Edge-TTS - Neural Portuguese voices

### Adaptive Learning
5. FSRS-5 - Modern spaced repetition (Anki research)
6. Krashen's i+1 - Comprehensible input theory
7. CAPT - Computer-Assisted Pronunciation Training
8. Learner modeling research (2025)

### LLM Architecture
9. Ollama tool calling documentation
10. Qwen2.5-7B benchmarks for instruction following
11. Context engineering best practices (2025)
12. Mem0 memory management research

### Language Learning
13. European Portuguese phonetics research
14. Pronunciation assessment with GOP scoring
15. Gamification in language learning (GNPL framework)

---

*Document created: December 26, 2025*
*Total implementation tasks: 66*
*Estimated hours: 120-160*
