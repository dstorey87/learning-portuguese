/**
 * AI Speech Recognition Module
 * 
 * Unified speech recognition interface that coordinates:
 * - Web Speech API (via WebSpeechService) for quick browser-native recognition
 * - Whisper models (via Transformers.js) for high-accuracy offline recognition
 * - PhoneticScorer for Portuguese-specific pronunciation scoring
 * 
 * @module ai-speech
 * @since Phase 14 - Pronunciation Assessment Excellence
 */

import { 
    getWebSpeechService, 
    isWebSpeechAvailable,
    detectPortugueseSupport,
    WEBSPEECH_CONFIG
} from './src/services/WebSpeechService.js';

import {
    calculateScore,
    analyzePhonemes,
    PHONETIC_CONFIG
} from './src/services/PhoneticScorer.js';

import { createLogger } from './src/services/Logger.js';

const Logger = createLogger('ai-speech');

// ============================================================================
// WHISPER CONFIGURATION
// ============================================================================

/**
 * Available Whisper models with metadata
 */
export const WHISPER_MODELS = {
    tiny: {
        id: 'tiny',
        url: 'Xenova/whisper-tiny',
        size: '75MB',
        speed: 'fast',
        accuracy: 'basic',
        description: 'Fast, basic accuracy - good for testing'
    },
    base: {
        id: 'base',
        url: 'Xenova/whisper-base',
        size: '150MB',
        speed: 'medium',
        accuracy: 'good',
        description: 'Balanced speed and accuracy'
    },
    small: {
        id: 'small',
        url: 'Xenova/whisper-small',
        size: '244MB',
        speed: 'slow',
        accuracy: 'excellent',
        description: 'Best accuracy, slower loading'
    }
};

/**
 * Whisper configuration
 */
export const WHISPER_CONFIG = {
    defaultModel: 'tiny',
    language: 'portuguese',
    task: 'transcribe',
    returnTimestamps: true,
    chunkLengthS: 30,
    strideLength: 5,
    cacheName: 'whisper-models-v1',
    // Cache and loading improvements
    maxRetries: 3,
    retryDelayMs: 1000,
    preloadDelay: 2000,  // Delay before background preload
    cacheExpireDays: 30  // How long to keep cached models
};

// ============================================================================
// STATE
// ============================================================================

let whisperPipeline = null;
let whisperModelLoading = false;
let whisperModelLoaded = false;
let currentWhisperModel = null;
let webSpeechInstance = null;
let loadError = null;
let transformersEnv = null;  // Cached Transformers.js environment

// Audio recording state (for Whisper)
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;
let recordingStream = null;

// ============================================================================
// WHISPER MODEL MANAGEMENT
// ============================================================================

/**
 * Check if Whisper model is cached in browser storage
 * @param {string} modelSize - 'tiny', 'base', or 'small'
 * @returns {Promise<{cached: boolean, size?: number, date?: string}>}
 */
export async function checkWhisperCache(modelSize = WHISPER_CONFIG.defaultModel) {
    try {
        const modelInfo = WHISPER_MODELS[modelSize] || WHISPER_MODELS.tiny;
        
        // Check Cache API for model files
        if ('caches' in window) {
            const cache = await caches.open(WHISPER_CONFIG.cacheName);
            const keys = await cache.keys();
            const modelKeys = keys.filter(k => k.url.includes(modelInfo.url.replace('/', '_')));
            
            if (modelKeys.length > 0) {
                // Estimate cached size
                let totalSize = 0;
                for (const key of modelKeys) {
                    const response = await cache.match(key);
                    if (response) {
                        const blob = await response.blob();
                        totalSize += blob.size;
                    }
                }
                
                return {
                    cached: true,
                    size: totalSize,
                    files: modelKeys.length,
                    model: modelSize
                };
            }
        }
        
        // Also check IndexedDB (Transformers.js uses this)
        if ('indexedDB' in window) {
            return new Promise((resolve) => {
                const request = indexedDB.open('transformers-cache', 1);
                request.onsuccess = () => {
                    const db = request.result;
                    if (db.objectStoreNames.contains('models')) {
                        const tx = db.transaction('models', 'readonly');
                        const store = tx.objectStore('models');
                        const getRequest = store.get(modelInfo.url);
                        getRequest.onsuccess = () => {
                            resolve({
                                cached: !!getRequest.result,
                                model: modelSize,
                                source: 'indexeddb'
                            });
                        };
                        getRequest.onerror = () => resolve({ cached: false, model: modelSize });
                    } else {
                        resolve({ cached: false, model: modelSize });
                    }
                    db.close();
                };
                request.onerror = () => resolve({ cached: false, model: modelSize });
            });
        }
        
        return { cached: false, model: modelSize };
    } catch (error) {
        Logger.warn('Cache check failed', { error: error.message });
        return { cached: false, model: modelSize, error: error.message };
    }
}

/**
 * Clear Whisper model cache
 * @param {string} modelSize - Optional: specific model to clear, or 'all'
 * @returns {Promise<boolean>}
 */
export async function clearWhisperCache(modelSize = 'all') {
    try {
        if ('caches' in window) {
            if (modelSize === 'all') {
                await caches.delete(WHISPER_CONFIG.cacheName);
                Logger.info('Cleared all Whisper cache');
            } else {
                const cache = await caches.open(WHISPER_CONFIG.cacheName);
                const keys = await cache.keys();
                const modelInfo = WHISPER_MODELS[modelSize];
                if (modelInfo) {
                    const toDelete = keys.filter(k => k.url.includes(modelInfo.url.replace('/', '_')));
                    await Promise.all(toDelete.map(k => cache.delete(k)));
                    Logger.info('Cleared Whisper cache for model', { model: modelSize });
                }
            }
        }
        
        // Also clear memory
        if (currentWhisperModel === modelSize || modelSize === 'all') {
            whisperPipeline = null;
            whisperModelLoaded = false;
            currentWhisperModel = null;
        }
        
        return true;
    } catch (error) {
        Logger.error('Failed to clear cache', { error: error.message });
        return false;
    }
}

/**
 * Get loading error if initialization failed
 * @returns {Object|null} Error info or null
 */
export function getWhisperLoadError() {
    return loadError;
}

/**
 * Initialize Whisper model with improved caching and progress
 * @param {string} modelSize - 'tiny', 'base', or 'small'
 * @param {Function} onProgress - Progress callback (0-100)
 * @param {Object} options - Additional options: { forceReload, timeout }
 * @returns {Promise<boolean>} Success status
 */
export async function initializeWhisper(modelSize = WHISPER_CONFIG.defaultModel, onProgress = null, options = {}) {
    const { forceReload = false, timeout = 120000 } = options;
    
    // Already loaded?
    if (whisperModelLoaded && currentWhisperModel === modelSize && !forceReload) {
        Logger.debug('Whisper model already loaded', { model: modelSize });
        if (onProgress) onProgress(100);
        return true;
    }
    
    // Currently loading?
    if (whisperModelLoading) {
        Logger.debug('Whisper model loading in progress, waiting...');
        // Wait for current loading to complete with timeout
        const startWait = Date.now();
        while (whisperModelLoading) {
            if (Date.now() - startWait > timeout) {
                Logger.warn('Timeout waiting for model load');
                return false;
            }
            await new Promise(r => setTimeout(r, 100));
        }
        return whisperModelLoaded;
    }
    
    whisperModelLoading = true;
    currentWhisperModel = modelSize;
    loadError = null;
    
    const attemptLoad = async (retry = 0) => {
        try {
            Logger.info('Loading Whisper model', { model: modelSize, attempt: retry + 1 });
            
            // Dynamic import of Transformers.js (cached after first load)
            if (!transformersEnv) {
                const transformers = await import(
                    'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2'
                );
                transformersEnv = {
                    pipeline: transformers.pipeline,
                    env: transformers.env
                };
            }
            
            const { pipeline: createPipeline, env } = transformersEnv;
            
            // Configure caching for persistence
            env.cacheDir = './.cache/transformers';
            env.allowLocalModels = true;
            env.useBrowserCache = true;  // Use browser Cache API
            
            const modelInfo = WHISPER_MODELS[modelSize] || WHISPER_MODELS.tiny;
            
            if (onProgress) onProgress(5);
            
            // Check cache status first
            const cacheStatus = await checkWhisperCache(modelSize);
            if (cacheStatus.cached) {
                Logger.info('Loading Whisper from cache', { model: modelSize });
                if (onProgress) onProgress(20);  // Skip to 20% if cached
            }
            
            // Create pipeline with progress tracking and timeout
            const loadPromise = createPipeline(
                'automatic-speech-recognition',
                modelInfo.url,
                {
                    progress_callback: (progress) => {
                        if (onProgress && progress.progress !== undefined) {
                            // Scale progress: cached=20-95, fresh=5-95
                            const baseProgress = cacheStatus.cached ? 20 : 5;
                            const scaledProgress = baseProgress + Math.round(progress.progress * (95 - baseProgress) / 100);
                            onProgress(Math.min(95, scaledProgress));
                        }
                    },
                    // Enable quantization for faster loading and smaller files
                    quantized: true
                }
            );
            
            // Add timeout
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Model loading timeout')), timeout);
            });
            
            whisperPipeline = await Promise.race([loadPromise, timeoutPromise]);
            
            if (onProgress) onProgress(100);
            
            whisperModelLoaded = true;
            loadError = null;
            Logger.info('Whisper model loaded successfully', { 
                model: modelSize, 
                fromCache: cacheStatus.cached,
                attempts: retry + 1 
            });
            return true;
            
        } catch (error) {
            Logger.error('Whisper load attempt failed', { 
                error: error.message, 
                model: modelSize, 
                attempt: retry + 1 
            });
            
            // Retry logic
            if (retry < WHISPER_CONFIG.maxRetries - 1) {
                const delay = WHISPER_CONFIG.retryDelayMs * Math.pow(2, retry);  // Exponential backoff
                Logger.info(`Retrying in ${delay}ms...`);
                await new Promise(r => setTimeout(r, delay));
                return attemptLoad(retry + 1);
            }
            
            // All retries exhausted
            loadError = {
                message: error.message,
                model: modelSize,
                attempts: retry + 1,
                timestamp: new Date().toISOString()
            };
            
            whisperModelLoaded = false;
            whisperPipeline = null;
            return false;
        }
    };
    
    try {
        return await attemptLoad(0);
    } finally {
        whisperModelLoading = false;
    }
}

/**
 * Preload Whisper model in background (non-blocking)
 * Useful for warming up the model while user is doing other things
 * @param {string} modelSize - Model to preload
 * @returns {Promise<void>}
 */
export async function preloadWhisper(modelSize = WHISPER_CONFIG.defaultModel) {
    if (whisperModelLoaded && currentWhisperModel === modelSize) {
        Logger.debug('Model already loaded, skip preload');
        return;
    }
    
    // Delay preload to not interfere with initial page load
    await new Promise(r => setTimeout(r, WHISPER_CONFIG.preloadDelay));
    
    Logger.info('Starting background Whisper preload', { model: modelSize });
    
    // Load silently in background
    await initializeWhisper(modelSize, null, { timeout: 180000 });
}

/**
 * Check if Whisper is ready for use
 * @returns {boolean}
 */
export function isWhisperReady() {
    return whisperModelLoaded && whisperPipeline !== null;
}

/**
 * Check if browser supports Whisper requirements
 * @returns {boolean}
 */
export function canUseWhisper() {
    const hasWebWorker = typeof Worker !== 'undefined';
    const hasAudioContext = typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined';
    const hasMediaDevices = navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
    const hasWasm = typeof WebAssembly !== 'undefined';
    
    return hasWebWorker && hasAudioContext && hasMediaDevices && hasWasm;
}

/**
 * Get Whisper model info
 * @returns {Object} Current model info or null
 */
export function getWhisperModelInfo() {
    if (!whisperModelLoaded) return null;
    return {
        model: currentWhisperModel,
        ...WHISPER_MODELS[currentWhisperModel]
    };
}

/**
 * Unload Whisper model to free memory
 */
export async function unloadWhisper() {
    whisperPipeline = null;
    whisperModelLoaded = false;
    currentWhisperModel = null;
    Logger.info('Whisper model unloaded');
}

// ============================================================================
// AUDIO RECORDING (for Whisper)
// ============================================================================

/**
 * Start recording audio for Whisper transcription
 * @returns {Promise<void>}
 */
export async function startRecording() {
    if (isRecording) {
        throw new Error('Already recording');
    }
    
    try {
        recordingStream = await navigator.mediaDevices.getUserMedia({
            audio: {
                sampleRate: 16000,
                channelCount: 1,
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }
        });
        
        audioChunks = [];
        
        // Select best available format
        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
            ? 'audio/webm;codecs=opus'
            : MediaRecorder.isTypeSupported('audio/webm')
                ? 'audio/webm'
                : 'audio/wav';
        
        mediaRecorder = new MediaRecorder(recordingStream, { mimeType });
        
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };
        
        mediaRecorder.start(100); // Collect in 100ms chunks
        isRecording = true;
        
        Logger.debug('Recording started', { mimeType });
        
    } catch (error) {
        Logger.error('Failed to start recording', { error: error.message });
        throw new Error(`Microphone access denied: ${error.message}`);
    }
}

/**
 * Stop recording and return audio blob
 * @returns {Promise<Blob>}
 */
export async function stopRecording() {
    if (!isRecording || !mediaRecorder) {
        throw new Error('Not recording');
    }
    
    return new Promise((resolve, reject) => {
        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: mediaRecorder.mimeType });
            
            // Stop all tracks
            if (recordingStream) {
                recordingStream.getTracks().forEach(track => track.stop());
                recordingStream = null;
            }
            
            isRecording = false;
            mediaRecorder = null;
            audioChunks = [];
            
            Logger.debug('Recording stopped', { blobSize: audioBlob.size });
            resolve(audioBlob);
        };
        
        mediaRecorder.onerror = (error) => {
            isRecording = false;
            reject(error);
        };
        
        mediaRecorder.stop();
    });
}

/**
 * Get current recording state
 * @returns {boolean}
 */
export function getRecordingState() {
    return isRecording;
}

// ============================================================================
// WHISPER TRANSCRIPTION
// ============================================================================

/**
 * Transcribe audio using Whisper
 * @param {Blob|ArrayBuffer} audio - Audio data
 * @param {string} language - Language code (default: 'portuguese')
 * @returns {Promise<{text: string, segments: Array}>}
 */
export async function transcribe(audio, language = WHISPER_CONFIG.language) {
    if (!isWhisperReady()) {
        throw new Error('Whisper model not loaded. Call initializeWhisper() first.');
    }
    
    try {
        // Convert Blob to ArrayBuffer if needed
        let audioData = audio;
        if (audio instanceof Blob) {
            audioData = await audio.arrayBuffer();
        }
        
        // Decode audio to Float32Array
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        const audioContext = new AudioContextClass({ sampleRate: 16000 });
        const audioBuffer = await audioContext.decodeAudioData(audioData);
        const audioArray = audioBuffer.getChannelData(0);
        
        // Close audio context to free resources
        await audioContext.close();
        
        // Run Whisper inference
        const result = await whisperPipeline(audioArray, {
            language,
            task: WHISPER_CONFIG.task,
            return_timestamps: WHISPER_CONFIG.returnTimestamps,
            chunk_length_s: WHISPER_CONFIG.chunkLengthS,
            stride_length_s: WHISPER_CONFIG.strideLength
        });
        
        Logger.debug('Whisper transcription complete', { text: result.text });
        
        return {
            text: result.text?.trim() || '',
            segments: result.chunks || [],
            language: result.language
        };
        
    } catch (error) {
        Logger.error('Transcription failed', { error: error.message });
        throw error;
    }
}

/**
 * Record and transcribe with Whisper in one call
 * @param {number} maxDurationMs - Maximum recording duration
 * @param {Object} callbacks - onStart, onProgress, onComplete
 * @returns {Promise<{text: string, duration: number, segments: Array}>}
 */
export async function recordAndTranscribe(maxDurationMs = 10000, callbacks = {}) {
    const { onStart, onProgress, onComplete } = callbacks;
    
    // Initialize Whisper if not ready
    if (!isWhisperReady()) {
        Logger.info('Whisper not ready, initializing...');
        const loaded = await initializeWhisper(
            currentWhisperModel || WHISPER_CONFIG.defaultModel,
            onProgress
        );
        if (!loaded) {
            throw new Error('Failed to load Whisper model');
        }
    }
    
    await startRecording();
    if (onStart) onStart();
    
    const startTime = Date.now();
    
    return new Promise((resolve, reject) => {
        let progressInterval = null;
        
        const finishRecording = async () => {
            if (progressInterval) clearInterval(progressInterval);
            
            try {
                const audioBlob = await stopRecording();
                const duration = Date.now() - startTime;
                
                const result = await transcribe(audioBlob);
                
                const finalResult = {
                    text: result.text,
                    segments: result.segments,
                    duration
                };
                
                if (onComplete) onComplete(finalResult);
                resolve(finalResult);
                
            } catch (error) {
                reject(error);
            }
        };
        
        // Progress updates
        progressInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            if (onProgress) {
                onProgress(Math.min(100, Math.round((elapsed / maxDurationMs) * 100)));
            }
            
            if (elapsed >= maxDurationMs) {
                finishRecording();
            }
        }, 100);
        
        // Allow early stop via global function
        window._stopWhisperRecording = finishRecording;
    });
}

/**
 * Stop current Whisper recording early
 */
export function stopRecordingEarly() {
    if (window._stopWhisperRecording) {
        window._stopWhisperRecording();
        window._stopWhisperRecording = null;
    }
}

// ============================================================================
// WEB SPEECH API (using WebSpeechService)
// ============================================================================

/**
 * Listen and transcribe using Web Speech API
 * @param {number} timeoutMs - Maximum listening time
 * @param {Object} options - Additional options
 * @returns {Promise<{text: string, confidence: number, alternatives: Array}>}
 */
export async function listenAndTranscribe(timeoutMs = 5000, options = {}) {
    // Get or create WebSpeechService instance
    if (!webSpeechInstance) {
        webSpeechInstance = getWebSpeechService();
    }
    
    try {
        const result = await webSpeechInstance.listen({
            timeout: timeoutMs,
            language: options.lang || WEBSPEECH_CONFIG.language
        });
        
        return {
            text: result.text?.trim() || '',
            confidence: result.confidence || 0,
            alternatives: result.alternatives || [],
            noSpeech: !result.text
        };
        
    } catch (error) {
        // Handle specific error types gracefully
        if (error.message?.includes('no-speech') || error.code === 'no-speech') {
            return { text: '', confidence: 0, alternatives: [], noSpeech: true };
        }
        throw error;
    }
}

/**
 * Use Web Speech API with callback handlers (legacy support)
 * @param {string} expectedText - Expected text for comparison
 * @param {Object} handlers - onResult, onError, onEnd callbacks
 * @returns {Object} Controller with stop/abort methods
 */
export function useWebSpeechRecognition(expectedText, handlers = {}) {
    const { onResult, onError, onEnd } = handlers;
    
    if (!isWebSpeechAvailable()) {
        if (onError) onError(new Error('Speech recognition not supported'));
        return null;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = WEBSPEECH_CONFIG.language;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = WEBSPEECH_CONFIG.maxAlternatives;
    
    recognition.onresult = (event) => {
        const transcript = event.results[0]?.[0]?.transcript || '';
        const confidence = event.results[0]?.[0]?.confidence || 0;
        
        // Use PhoneticScorer for scoring
        const score = scorePronunciation(transcript, expectedText);
        
        if (onResult) {
            onResult({
                text: transcript,
                confidence: Math.round(confidence * 100),
                ...score
            });
        }
    };
    
    recognition.onerror = (event) => {
        if (onError) onError(new Error(event.error || 'Recognition failed'));
    };
    
    recognition.onend = () => {
        if (onEnd) onEnd();
    };
    
    recognition.start();
    
    return {
        stop: () => recognition.stop(),
        abort: () => recognition.abort()
    };
}

// ============================================================================
// PRONUNCIATION SCORING (using PhoneticScorer)
// ============================================================================

/**
 * Score pronunciation comparing transcribed to expected text
 * @param {string} transcribed - What the user said
 * @param {string} expected - What they should have said
 * @param {Object} wordKnowledge - Optional word knowledge for better feedback
 * @returns {Object} Score and detailed feedback
 */
export function scorePronunciation(transcribed, expected, wordKnowledge = null) {
    // Use PhoneticScorer for main scoring
    const result = calculateScore(transcribed, expected);
    
    // Add word knowledge tips if available
    if (wordKnowledge?.pronunciation && result.score < 80) {
        if (wordKnowledge.pronunciation.tip && !result.tips.includes(wordKnowledge.pronunciation.tip)) {
            result.tips.unshift(wordKnowledge.pronunciation.tip);
        }
        if (result.score < 60 && wordKnowledge.pronunciation.commonMistake) {
            result.tips.push(`Avoid: ${wordKnowledge.pronunciation.commonMistake}`);
        }
    }
    
    return result;
}

/**
 * Analyze Portuguese phoneme patterns in text
 * @param {string} text - Text to analyze
 * @returns {Object} Phoneme analysis
 */
export function analyzePortuguesePhonemes(text) {
    return analyzePhonemes(text);
}

// ============================================================================
// ADVANCED PRONUNCIATION TESTING
// ============================================================================

/**
 * Test pronunciation with multiple attempts and best score selection
 * @param {string} expected - Expected Portuguese text
 * @param {Object} options - Options including maxAttempts, timeoutMs, wordKnowledge
 * @returns {Promise<Object>} Best score result with all attempts
 */
export async function testPronunciation(expected, options = {}) {
    const {
        maxAttempts = 1,
        timeoutMs = 6000,
        wordKnowledge = null,
        onAttemptStart = null,
        onAttemptEnd = null
    } = options;
    
    const attempts = [];
    let bestScore = null;
    
    for (let i = 0; i < maxAttempts; i++) {
        if (onAttemptStart) onAttemptStart(i + 1);
        
        try {
            const result = await listenAndTranscribe(timeoutMs);
            
            if (result.text) {
                const score = scorePronunciation(result.text, expected, wordKnowledge);
                score.attempt = i + 1;
                score.confidence = result.confidence;
                score.alternatives = result.alternatives;
                
                // Check alternatives for better matches
                if (result.alternatives && result.alternatives.length > 0) {
                    for (const alt of result.alternatives) {
                        const altScore = scorePronunciation(alt.text || alt, expected, wordKnowledge);
                        if (altScore.score > score.score) {
                            Object.assign(score, altScore);
                            score.usedAlternative = true;
                            score.originalTranscript = result.text;
                        }
                    }
                }
                
                attempts.push(score);
                
                if (!bestScore || score.score > bestScore.score) {
                    bestScore = score;
                }
                
                // If excellent, no need for more attempts
                if (score.score >= PHONETIC_CONFIG.excellentScore) {
                    break;
                }
            } else {
                attempts.push({
                    score: 0,
                    rating: 'no-speech',
                    feedback: 'No speech detected',
                    attempt: i + 1
                });
            }
        } catch (err) {
            Logger.error('Pronunciation test attempt failed', { attempt: i + 1, error: err.message });
            attempts.push({
                score: 0,
                rating: 'error',
                feedback: err.message,
                attempt: i + 1,
                error: err
            });
        }
        
        if (onAttemptEnd) onAttemptEnd(i + 1, attempts[attempts.length - 1]);
    }
    
    return {
        bestScore: bestScore || { score: 0, rating: 'no-speech', feedback: 'No speech detected' },
        attempts,
        totalAttempts: attempts.length,
        improved: attempts.length > 1 && bestScore &&
            bestScore.score > (attempts[0]?.score || 0)
    };
}

// ============================================================================
// DIAGNOSTICS
// ============================================================================

/**
 * Run comprehensive speech recognition diagnostics
 * @returns {Promise<Object>} Diagnostic results
 */
export async function runSpeechDiagnostics() {
    const results = {
        timestamp: new Date().toISOString(),
        overall: 'unknown',
        checks: [],
        recommendations: [],
        canUseSpeech: false
    };
    
    // 1. Web Speech API support
    const hasSpeechRecognition = isWebSpeechAvailable();
    results.checks.push({
        name: 'Web Speech API',
        status: hasSpeechRecognition ? 'pass' : 'fail',
        detail: hasSpeechRecognition ? 'Available' : 'Not supported',
        critical: true
    });
    
    // 2. Portuguese support
    const ptSupport = detectPortugueseSupport();
    results.checks.push({
        name: 'Portuguese Support',
        status: ptSupport.length > 0 ? 'pass' : 'warning',
        detail: ptSupport.length > 0 ? `Supports: ${ptSupport.join(', ')}` : 'May use fallback',
        critical: false
    });
    
    // 3. MediaDevices API
    const hasMediaDevices = navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function';
    results.checks.push({
        name: 'MediaDevices API',
        status: hasMediaDevices ? 'pass' : 'fail',
        detail: hasMediaDevices ? 'Available' : 'Not supported',
        critical: true
    });
    
    // 4. Secure context
    const isSecure = window.isSecureContext || ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
    results.checks.push({
        name: 'Secure Context',
        status: isSecure ? 'pass' : 'fail',
        detail: isSecure ? 'HTTPS or localhost' : 'Requires HTTPS',
        critical: true
    });
    
    // 5. Microphone permission
    let micPermission = 'unknown';
    try {
        if (navigator.permissions?.query) {
            const permission = await navigator.permissions.query({ name: 'microphone' });
            micPermission = permission.state;
        }
    } catch (e) {
        // Permission query not supported
    }
    
    results.checks.push({
        name: 'Microphone Permission',
        status: micPermission === 'granted' ? 'pass' : micPermission === 'denied' ? 'fail' : 'warning',
        detail: micPermission === 'granted' ? 'Granted' : micPermission === 'denied' ? 'Denied' : 'Not yet requested',
        critical: true
    });
    
    // 6. Network connectivity
    const isOnline = navigator.onLine;
    results.checks.push({
        name: 'Network',
        status: isOnline ? 'pass' : 'fail',
        detail: isOnline ? 'Online' : 'Offline',
        critical: true
    });
    
    // 7. Whisper support
    const whisperSupport = canUseWhisper();
    results.checks.push({
        name: 'Whisper Support',
        status: whisperSupport ? 'pass' : 'warning',
        detail: whisperSupport ? 'Browser supports Whisper' : 'Whisper not available',
        critical: false
    });
    
    // 8. Whisper loaded
    results.checks.push({
        name: 'Whisper Model',
        status: isWhisperReady() ? 'pass' : 'warning',
        detail: isWhisperReady() ? `Loaded: ${currentWhisperModel}` : 'Not loaded',
        critical: false
    });
    
    // Calculate overall
    const criticalChecks = results.checks.filter(c => c.critical);
    const criticalPasses = criticalChecks.filter(c => c.status === 'pass').length;
    const criticalFails = criticalChecks.filter(c => c.status === 'fail').length;
    
    if (criticalFails === 0) {
        results.overall = 'ready';
        results.canUseSpeech = true;
        results.summary = '✅ Speech recognition is ready!';
    } else if (criticalPasses > criticalFails) {
        results.overall = 'partial';
        results.canUseSpeech = false;
        results.summary = '⚠️ Some issues detected.';
    } else {
        results.overall = 'not-ready';
        results.canUseSpeech = false;
        results.summary = '❌ Speech recognition unavailable.';
    }
    
    // Add recommendations
    if (!hasSpeechRecognition) {
        results.recommendations.push('Use Chrome, Edge, or Safari for speech recognition.');
    }
    if (micPermission === 'denied') {
        results.recommendations.push('Allow microphone access in browser settings.');
    }
    if (!isSecure) {
        results.recommendations.push('Access the site via HTTPS.');
    }
    if (!isOnline) {
        results.recommendations.push('Check your internet connection.');
    }
    
    Logger.info('Speech diagnostics complete', results);
    return results;
}

/**
 * Quick check if speech recognition is available
 * @returns {Object} Quick status
 */
export function quickSpeechCheck() {
    const available = isWebSpeechAvailable();
    const hasMediaDevices = navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function';
    const isSecure = window.isSecureContext || ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
    const isOnline = navigator.onLine;
    
    const canUse = available && hasMediaDevices && isSecure && isOnline;
    
    return {
        available: canUse,
        webSpeech: available,
        whisper: canUseWhisper(),
        whisperReady: isWhisperReady(),
        reasons: [
            !available && 'Browser does not support speech recognition',
            !hasMediaDevices && 'Microphone access not available',
            !isSecure && 'Must be on HTTPS or localhost',
            !isOnline && 'No internet connection'
        ].filter(Boolean)
    };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
    // Whisper
    initializeWhisper,
    isWhisperReady,
    canUseWhisper,
    getWhisperModelInfo,
    unloadWhisper,
    preloadWhisper,
    checkWhisperCache,
    clearWhisperCache,
    getWhisperLoadError,
    WHISPER_MODELS,
    WHISPER_CONFIG,
    
    // Recording (for Whisper)
    startRecording,
    stopRecording,
    getRecordingState,
    transcribe,
    recordAndTranscribe,
    stopRecordingEarly,
    
    // Web Speech API
    listenAndTranscribe,
    useWebSpeechRecognition,
    
    // Scoring
    scorePronunciation,
    analyzePortuguesePhonemes,
    
    // Testing
    testPronunciation,
    
    // Diagnostics
    runSpeechDiagnostics,
    quickSpeechCheck
};
