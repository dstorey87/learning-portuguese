/**
 * PronunciationService - Main Speech Recognition Orchestrator
 * 
 * Coordinates:
 * - Multiple recognition engines (Azure, Whisper, Web Speech API)
 * - Audio recording and preprocessing
 * - Pronunciation scoring and feedback
 * - Progress tracking and AI integration
 * 
 * @module PronunciationService
 */

import { AudioRecorder, RECORDER_EVENTS, RECORDER_STATES, canRecord } from './AudioRecorder.js';
import { AudioPreprocessor, prepareForRecognition } from './AudioPreprocessor.js';
import { Logger } from './Logger.js';

// ===========================================
// CONFIGURATION
// ===========================================

export const PRONUNCIATION_CONFIG = {
    // Default recording settings
    recordingTimeoutMs: 5000,
    maxRecordingMs: 10000,
    minRecordingMs: 500,
    
    // Engine selection
    defaultEngine: 'webspeech',
    enginePriority: ['azure', 'whisper', 'webspeech', 'fallback'],
    
    // Scoring thresholds
    excellentScore: 90,
    goodScore: 75,
    fairScore: 60,
    needsWorkScore: 40,
    
    // Retry settings
    maxAttempts: 3,
    attemptDelayMs: 500,
    
    // Language
    language: 'pt-PT',
    alternativeLanguages: ['pt-BR', 'pt']
};

export const ENGINE_STATUS = {
    AVAILABLE: 'available',
    UNAVAILABLE: 'unavailable',
    LOADING: 'loading',
    ERROR: 'error',
    NOT_CONFIGURED: 'not-configured'
};

export const PRONUNCIATION_EVENTS = {
    ENGINE_READY: 'engineReady',
    RECORDING_START: 'recordingStart',
    RECORDING_STOP: 'recordingStop',
    LEVEL_UPDATE: 'levelUpdate',
    PROCESSING: 'processing',
    RESULT: 'result',
    ERROR: 'error',
    ATTEMPT_START: 'attemptStart',
    ATTEMPT_END: 'attemptEnd'
};

// ===========================================
// PRONUNCIATION SERVICE CLASS
// ===========================================

export class PronunciationService {
    constructor(config = {}) {
        this.config = { ...PRONUNCIATION_CONFIG, ...config };
        this.logger = Logger.createLogger({ context: 'PronunciationService' });
        
        // Services
        this.recorder = new AudioRecorder();
        this.preprocessor = new AudioPreprocessor();
        
        // Engine status
        this.engines = new Map();
        this.currentEngine = null;
        
        // Event listeners
        this.listeners = new Map();
        
        // State
        this.isInitialized = false;
        this.isProcessing = false;
        
        // Setup recorder events
        this.setupRecorderEvents();
    }
    
    // ===========================================
    // INITIALIZATION
    // ===========================================
    
    /**
     * Initialize pronunciation service
     * Checks available engines and selects best one
     */
    async initialize() {
        if (this.isInitialized) return;
        
        this.logger.info('Initializing PronunciationService');
        
        // Check all engines
        await this.checkEngines();
        
        // Select best available engine
        this.selectBestEngine();
        
        this.isInitialized = true;
        this.emit(PRONUNCIATION_EVENTS.ENGINE_READY, {
            engine: this.currentEngine,
            engines: Object.fromEntries(this.engines)
        });
        
        this.logger.info('PronunciationService initialized', { 
            engine: this.currentEngine,
            available: this.getAvailableEngines()
        });
    }
    
    /**
     * Check availability of all engines
     */
    async checkEngines() {
        // Check Web Speech API
        const webSpeechAvailable = this.checkWebSpeechAPI();
        this.engines.set('webspeech', {
            status: webSpeechAvailable ? ENGINE_STATUS.AVAILABLE : ENGINE_STATUS.UNAVAILABLE,
            capabilities: ['word', 'confidence'],
            latency: 'low',
            accuracy: 'fair',
            offline: false
        });
        
        // Check Whisper availability
        const whisperStatus = await this.checkWhisper();
        this.engines.set('whisper', whisperStatus);
        
        // Check Azure (requires configuration)
        const azureStatus = this.checkAzure();
        this.engines.set('azure', azureStatus);
        
        // Fallback is always available
        this.engines.set('fallback', {
            status: ENGINE_STATUS.AVAILABLE,
            capabilities: ['text'],
            latency: 'instant',
            accuracy: 'basic',
            offline: true
        });
    }
    
    /**
     * Check Web Speech API availability
     */
    checkWebSpeechAPI() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        return !!SpeechRecognition && canRecord();
    }
    
    /**
     * Check Whisper availability
     */
    async checkWhisper() {
        // Check if Whisper can be loaded
        const hasWebWorker = typeof Worker !== 'undefined';
        const hasWasm = typeof WebAssembly !== 'undefined';
        
        if (!hasWebWorker || !hasWasm) {
            return {
                status: ENGINE_STATUS.UNAVAILABLE,
                reason: 'Browser does not support Web Workers or WebAssembly'
            };
        }
        
        return {
            status: ENGINE_STATUS.AVAILABLE,
            capabilities: ['word', 'timestamp'],
            latency: 'medium',
            accuracy: 'good',
            offline: true,
            modelLoaded: false
        };
    }
    
    /**
     * Check Azure Speech availability
     */
    checkAzure() {
        // Check for Azure configuration
        const hasConfig = !!(
            window.AZURE_SPEECH_KEY || 
            process?.env?.AZURE_SPEECH_KEY ||
            this.config.azureKey
        );
        
        if (!hasConfig) {
            return {
                status: ENGINE_STATUS.NOT_CONFIGURED,
                capabilities: ['phoneme', 'word', 'gop', 'ipa'],
                latency: 'low',
                accuracy: 'excellent',
                offline: false
            };
        }
        
        return {
            status: ENGINE_STATUS.AVAILABLE,
            capabilities: ['phoneme', 'word', 'gop', 'ipa'],
            latency: 'low',
            accuracy: 'excellent',
            offline: false
        };
    }
    
    /**
     * Select best available engine
     */
    selectBestEngine() {
        for (const engineId of this.config.enginePriority) {
            const engine = this.engines.get(engineId);
            if (engine && engine.status === ENGINE_STATUS.AVAILABLE) {
                this.currentEngine = engineId;
                return;
            }
        }
        
        // Fall back to fallback
        this.currentEngine = 'fallback';
    }
    
    /**
     * Get available engines
     */
    getAvailableEngines() {
        return Array.from(this.engines.entries())
            .filter(([_, e]) => e.status === ENGINE_STATUS.AVAILABLE)
            .map(([id]) => id);
    }
    
    // ===========================================
    // EVENT HANDLING
    // ===========================================
    
    /**
     * Subscribe to events
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);
        return () => this.off(event, callback);
    }
    
    off(event, callback) {
        this.listeners.get(event)?.delete(callback);
    }
    
    emit(event, data) {
        this.listeners.get(event)?.forEach(cb => {
            try { cb(data); } catch (e) { console.error(e); }
        });
    }
    
    /**
     * Setup recorder event forwarding
     */
    setupRecorderEvents() {
        this.recorder.on(RECORDER_EVENTS.STATE_CHANGE, ({ newState }) => {
            if (newState === RECORDER_STATES.RECORDING) {
                this.emit(PRONUNCIATION_EVENTS.RECORDING_START, {});
            } else if (newState === RECORDER_STATES.IDLE && this.wasRecording) {
                this.emit(PRONUNCIATION_EVENTS.RECORDING_STOP, {});
            }
            this.wasRecording = newState === RECORDER_STATES.RECORDING;
        });
        
        this.recorder.on(RECORDER_EVENTS.LEVEL, (data) => {
            this.emit(PRONUNCIATION_EVENTS.LEVEL_UPDATE, data);
        });
        
        this.recorder.on(RECORDER_EVENTS.ERROR, (data) => {
            this.emit(PRONUNCIATION_EVENTS.ERROR, data);
        });
    }
    
    // ===========================================
    // MAIN API
    // ===========================================
    
    /**
     * Test pronunciation of a word or phrase
     * @param {string} expectedText - The text the user should say
     * @param {Object} options - Options
     * @returns {Promise<PronunciationResult>}
     */
    async testPronunciation(expectedText, options = {}) {
        if (!this.isInitialized) {
            await this.initialize();
        }
        
        if (this.isProcessing) {
            throw new Error('Already processing');
        }
        
        const {
            timeout = this.config.recordingTimeoutMs,
            maxAttempts = 1,
            engine = this.currentEngine,
            wordKnowledge = null,
            onLevelUpdate = null
        } = options;
        
        this.isProcessing = true;
        this.logger.info('Starting pronunciation test', { expectedText, engine });
        
        // Subscribe to level updates if callback provided
        let levelUnsub = null;
        if (onLevelUpdate) {
            levelUnsub = this.on(PRONUNCIATION_EVENTS.LEVEL_UPDATE, onLevelUpdate);
        }
        
        try {
            // Single attempt or multiple
            if (maxAttempts === 1) {
                return await this.singleAttempt(expectedText, { timeout, engine, wordKnowledge });
            } else {
                return await this.multipleAttempts(expectedText, { 
                    timeout, 
                    maxAttempts, 
                    engine, 
                    wordKnowledge 
                });
            }
        } finally {
            this.isProcessing = false;
            if (levelUnsub) levelUnsub();
        }
    }
    
    /**
     * Single pronunciation attempt
     */
    async singleAttempt(expectedText, options) {
        const { timeout, engine, wordKnowledge } = options;
        
        this.emit(PRONUNCIATION_EVENTS.ATTEMPT_START, { attempt: 1, total: 1 });
        
        try {
            // Record audio
            await this.recorder.start();
            
            // Wait for timeout or manual stop
            await new Promise(resolve => setTimeout(resolve, timeout));
            
            // Stop recording
            const recording = await this.recorder.stop();
            
            this.emit(PRONUNCIATION_EVENTS.PROCESSING, {});
            
            // Process and recognize
            const result = await this.processRecording(recording, expectedText, engine, wordKnowledge);
            
            this.emit(PRONUNCIATION_EVENTS.RESULT, result);
            this.emit(PRONUNCIATION_EVENTS.ATTEMPT_END, { attempt: 1, result });
            
            return result;
            
        } catch (err) {
            this.recorder.cancel();
            const errorResult = this.createErrorResult(err, expectedText);
            this.emit(PRONUNCIATION_EVENTS.ERROR, errorResult);
            return errorResult;
        }
    }
    
    /**
     * Multiple pronunciation attempts with best score selection
     */
    async multipleAttempts(expectedText, options) {
        const { timeout, maxAttempts, engine, wordKnowledge } = options;
        const attempts = [];
        let bestResult = null;
        
        for (let i = 0; i < maxAttempts; i++) {
            this.emit(PRONUNCIATION_EVENTS.ATTEMPT_START, { attempt: i + 1, total: maxAttempts });
            
            try {
                const result = await this.singleAttempt(expectedText, { timeout, engine, wordKnowledge });
                result.attempt = i + 1;
                attempts.push(result);
                
                if (!bestResult || result.score > bestResult.score) {
                    bestResult = result;
                }
                
                this.emit(PRONUNCIATION_EVENTS.ATTEMPT_END, { attempt: i + 1, result });
                
                // If excellent, stop early
                if (result.score >= this.config.excellentScore) {
                    break;
                }
                
                // Delay between attempts
                if (i < maxAttempts - 1) {
                    await new Promise(r => setTimeout(r, this.config.attemptDelayMs));
                }
                
            } catch (err) {
                attempts.push(this.createErrorResult(err, expectedText, i + 1));
            }
        }
        
        return {
            ...bestResult,
            attempts,
            totalAttempts: attempts.length,
            improved: attempts.length > 1 && bestResult.score > (attempts[0]?.score || 0)
        };
    }
    
    /**
     * Process recording with selected engine
     */
    async processRecording(recording, expectedText, engine, wordKnowledge) {
        // Preprocess audio
        const processed = await prepareForRecognition(recording.blob);
        
        if (!processed.hasSpeech) {
            return {
                score: 0,
                rating: 'no-speech',
                feedback: "We didn't hear anything. Make sure your microphone is working.",
                transcribed: '',
                expected: expectedText,
                tips: ['Speak clearly and close to your microphone']
            };
        }
        
        // Get transcription based on engine
        let transcription;
        
        switch (engine) {
            case 'webspeech':
                transcription = await this.transcribeWithWebSpeech(expectedText);
                break;
            case 'whisper':
                transcription = await this.transcribeWithWhisper(processed);
                break;
            case 'azure':
                transcription = await this.transcribeWithAzure(processed, expectedText);
                break;
            case 'fallback':
            default:
                // Fallback - just use empty transcription
                transcription = { text: '', confidence: 0, engine: 'fallback' };
        }
        
        // Score pronunciation
        const score = this.scorePronunciation(transcription.text, expectedText, wordKnowledge);
        
        return {
            ...score,
            transcription,
            engine,
            audioStats: {
                duration: processed.duration,
                speechRatio: processed.speechRatio,
                level: processed.rmsLevel
            }
        };
    }
    
    // ===========================================
    // ENGINE IMPLEMENTATIONS
    // ===========================================
    
    /**
     * Transcribe using Web Speech API
     */
    transcribeWithWebSpeech(expectedText) {
        return new Promise((resolve, reject) => {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            
            if (!SpeechRecognition) {
                reject(new Error('Web Speech API not supported'));
                return;
            }
            
            const recognition = new SpeechRecognition();
            recognition.lang = this.config.language;
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.maxAlternatives = 3;
            
            let hasResult = false;
            
            recognition.onresult = (event) => {
                hasResult = true;
                const result = event.results[0];
                const alternatives = [];
                
                for (let i = 0; i < result.length; i++) {
                    alternatives.push({
                        text: result[i].transcript,
                        confidence: result[i].confidence
                    });
                }
                
                resolve({
                    text: result[0]?.transcript?.trim() || '',
                    confidence: Math.round((result[0]?.confidence || 0) * 100),
                    alternatives: alternatives.slice(1),
                    engine: 'webspeech'
                });
            };
            
            recognition.onerror = (event) => {
                if (event.error === 'no-speech') {
                    resolve({ text: '', confidence: 0, noSpeech: true, engine: 'webspeech' });
                } else if (event.error === 'aborted') {
                    resolve({ text: '', confidence: 0, aborted: true, engine: 'webspeech' });
                } else {
                    reject(new Error(this.getWebSpeechErrorMessage(event.error)));
                }
            };
            
            recognition.onend = () => {
                if (!hasResult) {
                    resolve({ text: '', confidence: 0, ended: true, engine: 'webspeech' });
                }
            };
            
            recognition.start();
            
            // Timeout
            setTimeout(() => {
                try { recognition.stop(); } catch (e) { /* ignore */ }
            }, this.config.recordingTimeoutMs);
        });
    }
    
    /**
     * Get user-friendly error message for Web Speech API errors
     */
    getWebSpeechErrorMessage(errorCode) {
        const messages = {
            'not-allowed': 'Microphone access denied. Please allow microphone access.',
            'no-speech': 'No speech detected. Please try again.',
            'audio-capture': 'No microphone found. Please connect a microphone.',
            'network': 'Network error. Please check your internet connection.',
            'aborted': 'Recognition was cancelled.',
            'service-not-allowed': 'Speech recognition service not available.'
        };
        return messages[errorCode] || `Speech recognition error: ${errorCode}`;
    }
    
    /**
     * Transcribe using Whisper
     */
    async transcribeWithWhisper(processedAudio) {
        // Dynamic import to avoid loading if not used
        const { transcribe, initializeWhisper, isWhisperReady } = await import('../../ai-speech.js');
        
        if (!isWhisperReady()) {
            await initializeWhisper('tiny');
        }
        
        const result = await transcribe(processedAudio.data, 'portuguese');
        
        return {
            text: result.text?.trim() || '',
            segments: result.segments || [],
            engine: 'whisper'
        };
    }
    
    /**
     * Transcribe using Azure Speech
     * (Placeholder - requires Azure SDK integration)
     */
    async transcribeWithAzure(processedAudio, expectedText) {
        // TODO: Implement Azure Speech SDK integration
        this.logger.warn('Azure Speech not yet implemented, falling back to Web Speech');
        return this.transcribeWithWebSpeech(expectedText);
    }
    
    // ===========================================
    // SCORING
    // ===========================================
    
    /**
     * Score pronunciation by comparing transcribed to expected
     */
    scorePronunciation(transcribed, expected, wordKnowledge = null) {
        // Import scoring from existing ai-speech.js
        // This preserves the existing sophisticated scoring logic
        const { scorePronunciation: score } = require('../../ai-speech.js');
        return score(transcribed, expected, wordKnowledge);
    }
    
    /**
     * Create error result object
     */
    createErrorResult(error, expectedText, attempt = 1) {
        return {
            score: 0,
            rating: 'error',
            feedback: error.message || 'An error occurred',
            transcribed: '',
            expected: expectedText,
            tips: ['Please try again'],
            error: error,
            attempt
        };
    }
    
    // ===========================================
    // MANUAL CONTROLS
    // ===========================================
    
    /**
     * Start recording manually (for custom UI)
     */
    async startRecording() {
        if (!this.isInitialized) {
            await this.initialize();
        }
        await this.recorder.start();
    }
    
    /**
     * Stop recording manually
     */
    async stopRecording() {
        return await this.recorder.stop();
    }
    
    /**
     * Cancel recording
     */
    cancelRecording() {
        this.recorder.cancel();
    }
    
    /**
     * Get current audio level (0-100)
     */
    getCurrentLevel() {
        return this.recorder.getCurrentLevel();
    }
    
    /**
     * Check if currently recording
     */
    isRecording() {
        return this.recorder.isRecording();
    }
    
    // ===========================================
    // UTILITY
    // ===========================================
    
    /**
     * Run diagnostics
     */
    async runDiagnostics() {
        const { runSpeechDiagnostics } = await import('../../ai-speech.js');
        const diagnostics = await runSpeechDiagnostics();
        
        return {
            ...diagnostics,
            engines: Object.fromEntries(this.engines),
            currentEngine: this.currentEngine
        };
    }
    
    /**
     * Get current engine info
     */
    getEngineInfo() {
        return {
            current: this.currentEngine,
            info: this.engines.get(this.currentEngine),
            available: this.getAvailableEngines()
        };
    }
    
    /**
     * Set preferred engine
     */
    setEngine(engineId) {
        const engine = this.engines.get(engineId);
        if (engine && engine.status === ENGINE_STATUS.AVAILABLE) {
            this.currentEngine = engineId;
            this.logger.info('Engine changed', { engine: engineId });
            return true;
        }
        return false;
    }
    
    /**
     * Cleanup resources
     */
    destroy() {
        this.recorder.destroy();
        this.preprocessor.destroy();
        this.listeners.clear();
        this.isInitialized = false;
    }
}

// ===========================================
// SINGLETON INSTANCE
// ===========================================

let serviceInstance = null;

/**
 * Get shared PronunciationService instance
 */
export function getPronunciationService(config = {}) {
    if (!serviceInstance) {
        serviceInstance = new PronunciationService(config);
    }
    return serviceInstance;
}

/**
 * Reset shared instance
 */
export function resetPronunciationService() {
    if (serviceInstance) {
        serviceInstance.destroy();
        serviceInstance = null;
    }
}

// ===========================================
// CONVENIENCE FUNCTIONS
// ===========================================

/**
 * Quick pronunciation test
 */
export async function testPronunciation(expectedText, options = {}) {
    const service = getPronunciationService();
    return await service.testPronunciation(expectedText, options);
}

/**
 * Check if pronunciation testing is available
 */
export function canTestPronunciation() {
    return canRecord();
}

// ===========================================
// DEFAULT EXPORT
// ===========================================

export default {
    PronunciationService,
    PRONUNCIATION_CONFIG,
    PRONUNCIATION_EVENTS,
    ENGINE_STATUS,
    getPronunciationService,
    resetPronunciationService,
    testPronunciation,
    canTestPronunciation
};
