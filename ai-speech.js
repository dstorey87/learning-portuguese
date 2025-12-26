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
    cacheName: 'whisper-models-v1'
};

// ============================================================================
// STATE
// ============================================================================

let whisperPipeline = null;
let whisperModelLoading = false;
let whisperModelLoaded = false;
let currentWhisperModel = null;
let webSpeechInstance = null;

// Audio recording state (for Whisper)
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;
let recordingStream = null;

// ============================================================================
// WHISPER MODEL MANAGEMENT
// ============================================================================

/**
 * Initialize Whisper model with improved caching and progress
 * @param {string} modelSize - 'tiny', 'base', or 'small'
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise<boolean>} Success status
 */
export async function initializeWhisper(modelSize = WHISPER_CONFIG.defaultModel, onProgress = null) {
    // Already loaded?
    if (whisperModelLoaded && currentWhisperModel === modelSize) {
        Logger.debug('Whisper model already loaded', { model: modelSize });
        return true;
    }
    
    // Currently loading?
    if (whisperModelLoading) {
        Logger.debug('Whisper model loading in progress, waiting...');
        // Wait for current loading to complete
        while (whisperModelLoading) {
            await new Promise(r => setTimeout(r, 100));
        }
        return whisperModelLoaded;
    }
    
    whisperModelLoading = true;
    currentWhisperModel = modelSize;
    
    try {
        Logger.info('Loading Whisper model', { model: modelSize });
        
        // Dynamic import of Transformers.js
        const { pipeline: createPipeline, env } = await import(
            'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2'
        );
        
        // Configure caching
        env.cacheDir = './.cache/transformers';
        env.allowLocalModels = true;
        
        const modelInfo = WHISPER_MODELS[modelSize] || WHISPER_MODELS.tiny;
        
        if (onProgress) onProgress(5);
        
        // Create pipeline with progress tracking
        whisperPipeline = await createPipeline(
            'automatic-speech-recognition',
            modelInfo.url,
            {
                progress_callback: (progress) => {
                    if (onProgress && progress.progress !== undefined) {
                        // Scale from 5-95 to leave room for init/complete
                        const scaledProgress = 5 + Math.round(progress.progress * 0.9);
                        onProgress(Math.min(95, scaledProgress));
                    }
                },
                // Enable quantization for faster loading
                quantized: true
            }
        );
        
        if (onProgress) onProgress(100);
        
        whisperModelLoaded = true;
        Logger.info('Whisper model loaded successfully', { model: modelSize });
        return true;
        
    } catch (error) {
        Logger.error('Failed to load Whisper model', { error: error.message, model: modelSize });
        whisperModelLoaded = false;
        whisperPipeline = null;
        return false;
    } finally {
        whisperModelLoading = false;
    }
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
