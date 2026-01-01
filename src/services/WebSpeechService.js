/**
 * WebSpeechService.js
 * 
 * Enhanced Web Speech API integration specifically optimized for European Portuguese (pt-PT).
 * Provides robust speech recognition with:
 * - pt-PT specific configuration
 * - Multiple alternative transcriptions for better matching
 * - Graceful error handling with user-friendly messages
 * - Retry logic with progressive fallback
 * - Portuguese-aware phonetic normalization
 * 
 * @module WebSpeechService
 * @since Phase 14 - Pronunciation Assessment Excellence
 */

import { createLogger } from './Logger.js';

// ============================================================================
// Configuration & Constants
// ============================================================================

/**
 * Web Speech API configuration optimized for Portuguese
 */
export const WEBSPEECH_CONFIG = {
    // Primary language defaults to European Portuguese for this app
    // English falls back automatically when needed.
    language: 'pt-PT',
    
    // Fallback languages in priority order
    fallbackLanguages: ['pt-PT', 'pt'],
    
    // Recognition settings
    continuous: false,
    interimResults: true, // Get results as user speaks
    maxAlternatives: 5, // Get multiple interpretations
    
    // Timeouts
    defaultTimeoutMs: 6000,
    minTimeoutMs: 2000,
    maxTimeoutMs: 15000,
    
    // Retry settings
    maxRetries: 3,
    retryDelayMs: 500,
    
    // Audio constraints for better recognition
    audioConstraints: {
        sampleRate: 16000,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
    }
};

/**
 * Recognition states
 */
export const RECOGNITION_STATES = {
    IDLE: 'idle',
    STARTING: 'starting',
    LISTENING: 'listening',
    PROCESSING: 'processing',
    STOPPED: 'stopped',
    ERROR: 'error'
};

/**
 * Recognition events
 */
export const RECOGNITION_EVENTS = {
    STATE_CHANGE: 'stateChange',
    START: 'start',
    AUDIO_START: 'audioStart',
    AUDIO_END: 'audioEnd',
    SPEECH_START: 'speechStart',
    SPEECH_END: 'speechEnd',
    RESULT: 'result',
    INTERIM_RESULT: 'interimResult',
    NO_MATCH: 'noMatch',
    ERROR: 'error',
    END: 'end'
};

/**
 * Error codes with user-friendly messages
 */
export const SPEECH_ERRORS = {
    'no-speech': {
        code: 'no-speech',
        message: 'No speech detected. Please try speaking again.',
        recoverable: true,
        suggestion: 'Make sure your microphone is working and speak clearly.'
    },
    'audio-capture': {
        code: 'audio-capture',
        message: 'Microphone not found or not working.',
        recoverable: false,
        suggestion: 'Please check your microphone connection and settings.'
    },
    'not-allowed': {
        code: 'not-allowed',
        message: 'Microphone access was denied.',
        recoverable: false,
        suggestion: 'Click the lock icon in your browser address bar to allow microphone access.'
    },
    'network': {
        code: 'network',
        message: 'Network error during recognition.',
        recoverable: true,
        suggestion: 'Please check your internet connection and try again.'
    },
    'aborted': {
        code: 'aborted',
        message: 'Recognition was cancelled.',
        recoverable: true,
        suggestion: 'Click the microphone button to try again.'
    },
    'service-not-allowed': {
        code: 'service-not-allowed',
        message: 'Speech recognition service not available.',
        recoverable: false,
        suggestion: 'This feature may not be available in your region or browser.'
    },
    'bad-grammar': {
        code: 'bad-grammar',
        message: 'Grammar configuration error.',
        recoverable: false,
        suggestion: 'Please refresh the page and try again.'
    },
    'language-not-supported': {
        code: 'language-not-supported',
        message: 'Portuguese recognition not available.',
        recoverable: true,
        suggestion: 'Trying alternative language settings.'
    },
    'unknown': {
        code: 'unknown',
        message: 'An unexpected error occurred.',
        recoverable: true,
        suggestion: 'Please try again or refresh the page.'
    }
};

// ============================================================================
// Portuguese-Specific Normalization
// ============================================================================

/**
 * Portuguese phonetic variations mapping
 * Maps common recognition variations to canonical forms
 */
const PHONETIC_VARIATIONS = {
    // Common mishearings
    'obrigado': ['obrigadu', 'brigado', 'abrigado'],
    'obrigada': ['obrigada', 'brigada', 'abrigada'],
    'bom dia': ['bon dia', 'bom día', 'bomdia'],
    'boa tarde': ['boa tardi', 'boatarde'],
    'boa noite': ['boa noiti', 'boanoite'],
    'olá': ['ola', 'olah', 'hola'],
    'tchau': ['chau', 'ciau', 'xau'],
    'por favor': ['purfavor', 'por favór', 'porfavor'],
    'com licença': ['conlicença', 'com licensa'],
    'desculpe': ['desculpi', 'disculpe', 'desculpa'],
    'não': ['nao', 'naum', 'nâo'],
    'sim': ['sin', 'seem'],
    'muito': ['muinto', 'mto', 'muit'],
    'bem': ['ben', 'bein'],
    
    // Numbers
    'um': ['un', 'hum'],
    'dois': ['doys', 'doiz'],
    'três': ['tres', 'trez'],
    'quatro': ['cuatro'],
    'cinco': ['sinco', 'cinko'],
    
    // Pronouns
    'eu': ['ew', 'éu'],
    'tu': ['tú'],
    'ele': ['eli'],
    'ela': ['éla'],
    'nós': ['nos', 'nóz'],
    'vocês': ['voces', 'voceis'],
    'eles': ['elis'],
    'elas': ['élas']
};

/**
 * Digit to Portuguese number word mapping
 * Used when speech recognition converts spoken "quatro" to "4"
 */
const DIGIT_TO_PORTUGUESE = {
    '0': 'zero',
    '1': 'um',
    '2': 'dois',
    '3': 'três',
    '4': 'quatro',
    '5': 'cinco',
    '6': 'seis',
    '7': 'sete',
    '8': 'oito',
    '9': 'nove',
    '10': 'dez',
    '11': 'onze',
    '12': 'doze',
    '13': 'treze',
    '14': 'catorze',
    '15': 'quinze',
    '16': 'dezasseis',
    '17': 'dezassete',
    '18': 'dezoito',
    '19': 'dezanove',
    '20': 'vinte'
};

/**
 * Normalize Portuguese text for comparison
 * @param {string} text - Text to normalize
 * @returns {string} Normalized text
 */
export function normalizePortuguese(text) {
    if (!text) return '';
    
    let normalized = text
        .toLowerCase()
        .trim()
        // Normalize whitespace
        .replace(/\s+/g, ' ')
        // Remove punctuation except essential ones
        .replace(/[.,!?;:'"()[\]{}]/g, '')
        // Normalize quotes
        .replace(/[""'']/g, "'");
    
    // Convert digits back to Portuguese number words (fix for speech recognition issue)
    // This handles cases where the browser converts spoken "quatro" to "4"
    normalized = normalized.replace(/\b(\d+)\b/g, (match, digit) => {
        return DIGIT_TO_PORTUGUESE[digit] || match;
    });
    
    // Apply known phonetic variations
    Object.entries(PHONETIC_VARIATIONS).forEach(([correct, variations]) => {
        variations.forEach(variation => {
            const regex = new RegExp(`\\b${variation}\\b`, 'gi');
            normalized = normalized.replace(regex, correct);
        });
    });
    
    return normalized;
}

/**
 * Normalize text while preserving accents for scoring
 * @param {string} text - Text to normalize
 * @returns {string} Normalized text with accents preserved
 */
export function normalizePreserveAccents(text) {
    if (!text) return '';
    
    return text
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/[.,!?;:'"()[\]{}]/g, '');
}

/**
 * Strip all diacritics for basic comparison
 * @param {string} text - Text with diacritics
 * @returns {string} Text without diacritics
 */
export function stripDiacritics(text) {
    if (!text) return '';
    
    return text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

// ============================================================================
// WebSpeechService Class
// ============================================================================

/**
 * Enhanced Web Speech API service for Portuguese recognition
 */
export class WebSpeechService {
    constructor(config = {}) {
        this.config = { ...WEBSPEECH_CONFIG, ...config };
        this.logger = createLogger({ context: 'WebSpeechService' });
        
        // State
        this.state = RECOGNITION_STATES.IDLE;
        this.recognition = null;
        this.currentLanguageIndex = 0;
        this.retryCount = 0;
        
        // Event listeners
        this.listeners = new Map();
        
        // Results
        this.lastResult = null;
        this.interimResults = [];
        
        // Check availability
        this.available = this._checkAvailability();
        
        if (!this.available) {
            this.logger.warn('Web Speech API not available in this browser');
        }
    }
    
    /**
     * Check if Web Speech API is available
     * @returns {boolean} True if available
     */
    _checkAvailability() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        return Boolean(SpeechRecognition);
    }
    
    /**
     * Get the SpeechRecognition constructor
     * @returns {SpeechRecognition|null}
     */
    _getSpeechRecognition() {
        return window.SpeechRecognition || window.webkitSpeechRecognition || null;
    }
    
    /**
     * Set recognition state
     * @param {string} state - New state
     */
    _setState(state) {
        const oldState = this.state;
        this.state = state;
        this._emit(RECOGNITION_EVENTS.STATE_CHANGE, { oldState, newState: state });
    }
    
    /**
     * Subscribe to events
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);
        
        return () => this.off(event, callback);
    }
    
    /**
     * Unsubscribe from events
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    off(event, callback) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).delete(callback);
        }
    }
    
    /**
     * Emit event to listeners
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
    _emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (err) {
                    this.logger.error('Event listener error', { event, error: err.message });
                }
            });
        }
    }
    
    /**
     * Get current language based on fallback index
     * @returns {string} Language code
     */
    _getCurrentLanguage() {
        if (this.currentLanguageIndex === 0) {
            return this.config.language;
        }
        const fallbackIndex = this.currentLanguageIndex - 1;
        return this.config.fallbackLanguages[fallbackIndex] || this.config.language;
    }
    
    /**
     * Create and configure recognition instance
     * @returns {SpeechRecognition|null}
     */
    _createRecognition() {
        const SpeechRecognition = this._getSpeechRecognition();
        if (!SpeechRecognition) return null;
        
        const recognition = new SpeechRecognition();
        
        // Configure
        recognition.lang = this._getCurrentLanguage();
        recognition.continuous = this.config.continuous;
        recognition.interimResults = this.config.interimResults;
        recognition.maxAlternatives = this.config.maxAlternatives;
        
        // Event handlers
        recognition.onstart = () => {
            this._setState(RECOGNITION_STATES.LISTENING);
            this._emit(RECOGNITION_EVENTS.START, {});
            this.logger.debug('Recognition started', { language: recognition.lang });
        };
        
        recognition.onaudiostart = () => {
            this._emit(RECOGNITION_EVENTS.AUDIO_START, {});
        };
        
        recognition.onaudioend = () => {
            this._emit(RECOGNITION_EVENTS.AUDIO_END, {});
        };
        
        recognition.onspeechstart = () => {
            this._emit(RECOGNITION_EVENTS.SPEECH_START, {});
        };
        
        recognition.onspeechend = () => {
            this._emit(RECOGNITION_EVENTS.SPEECH_END, {});
        };
        
        recognition.onresult = (event) => {
            this._handleResult(event);
        };
        
        recognition.onnomatch = () => {
            this._emit(RECOGNITION_EVENTS.NO_MATCH, {});
        };
        
        recognition.onerror = (event) => {
            this._handleError(event);
        };
        
        recognition.onend = () => {
            this._setState(RECOGNITION_STATES.STOPPED);
            this._emit(RECOGNITION_EVENTS.END, {});
        };
        
        return recognition;
    }
    
    /**
     * Handle recognition result
     * @param {SpeechRecognitionEvent} event
     */
    _handleResult(event) {
        const result = event.results[event.resultIndex];
        
        if (!result) return;
        
        // Collect all alternatives
        const alternatives = [];
        for (let i = 0; i < result.length; i++) {
            alternatives.push({
                text: result[i].transcript,
                confidence: result[i].confidence,
                normalized: normalizePortuguese(result[i].transcript)
            });
        }
        
        if (result.isFinal) {
            // Final result
            this.lastResult = {
                text: alternatives[0]?.text || '',
                confidence: alternatives[0]?.confidence || 0,
                normalized: alternatives[0]?.normalized || '',
                alternatives,
                isFinal: true,
                language: this._getCurrentLanguage()
            };
            
            this._emit(RECOGNITION_EVENTS.RESULT, this.lastResult);
            this.logger.debug('Final result', this.lastResult);
        } else {
            // Interim result
            const interim = {
                text: alternatives[0]?.text || '',
                confidence: alternatives[0]?.confidence || 0,
                isFinal: false
            };
            
            this.interimResults.push(interim);
            this._emit(RECOGNITION_EVENTS.INTERIM_RESULT, interim);
        }
    }
    
    /**
     * Handle recognition error
     * @param {SpeechRecognitionErrorEvent} event
     */
    _handleError(event) {
        const errorCode = event.error || 'unknown';
        const errorInfo = SPEECH_ERRORS[errorCode] || SPEECH_ERRORS.unknown;
        
        this._setState(RECOGNITION_STATES.ERROR);
        
        const error = {
            ...errorInfo,
            originalError: event.error,
            message: errorInfo.message + (event.message ? ` (${event.message})` : ''),
            language: this._getCurrentLanguage()
        };
        
        this._emit(RECOGNITION_EVENTS.ERROR, error);
        this.logger.error('Recognition error', error);
    }
    
    /**
     * Check if service is available
     * @returns {boolean}
     */
    isAvailable() {
        return this.available;
    }
    
    /**
     * Get current state
     * @returns {string}
     */
    getState() {
        return this.state;
    }
    
    /**
     * Check if currently listening
     * @returns {boolean}
     */
    isListening() {
        return this.state === RECOGNITION_STATES.LISTENING;
    }
    
    /**
     * Start recognition
     * @param {Object} options - Override options
     * @returns {Promise<boolean>} True if started successfully
     */
    async start(options = {}) {
        if (!this.available) {
            throw new Error('Web Speech API not available');
        }
        
        if (this.state === RECOGNITION_STATES.LISTENING) {
            this.logger.warn('Already listening');
            return false;
        }
        
        // Reset state
        this.lastResult = null;
        this.interimResults = [];
        this.currentLanguageIndex = 0;
        this.retryCount = 0;
        
        // Apply option overrides
        if (options.language) {
            this.config.language = options.language;
        }
        
        // Create recognition
        this.recognition = this._createRecognition();
        if (!this.recognition) {
            throw new Error('Failed to create recognition instance');
        }
        
        this._setState(RECOGNITION_STATES.STARTING);
        
        try {
            this.recognition.start();
            return true;
        } catch (err) {
            this._setState(RECOGNITION_STATES.ERROR);
            throw err;
        }
    }
    
    /**
     * Stop recognition
     */
    stop() {
        if (this.recognition) {
            try {
                this.recognition.stop();
            } catch (err) {
                this.logger.warn('Error stopping recognition', { error: err.message });
            }
        }
        this._setState(RECOGNITION_STATES.STOPPED);
    }
    
    /**
     * Abort recognition immediately
     */
    abort() {
        if (this.recognition) {
            try {
                this.recognition.abort();
            } catch (err) {
                this.logger.warn('Error aborting recognition', { error: err.message });
            }
        }
        this._setState(RECOGNITION_STATES.STOPPED);
    }
    
    /**
     * Listen and return transcription result
     * @param {number} timeoutMs - Maximum listening time
     * @param {Object} options - Additional options
     * @returns {Promise<Object>} Recognition result
     */
    async listen(timeoutMs = null, options = {}) {
        const timeout = timeoutMs || this.config.defaultTimeoutMs;
        const waitForSpeechEnd = options?.waitForSpeechEnd === true;
        const postSpeechEndDelayMs = Number.isFinite(options?.postSpeechEndDelayMs) ? Number(options.postSpeechEndDelayMs) : 200;
        
        return new Promise(async (resolve, reject) => {
            let timeoutId = null;
            let resultReceived = false;
            let finalResult = null;
            let speechEnded = false;
            let resolved = false;

            const tryResolve = () => {
                if (resolved) return;
                if (!finalResult) return;
                if (waitForSpeechEnd && !speechEnded) return;

                resolved = true;
                cleanup();

                const finish = () => resolve(finalResult);
                if (waitForSpeechEnd && postSpeechEndDelayMs > 0) {
                    setTimeout(finish, postSpeechEndDelayMs);
                } else {
                    finish();
                }
            };
            
            // Set up result handler
            const handleResult = (result) => {
                if (result.isFinal && !resultReceived) {
                    resultReceived = true;
                    finalResult = result;
                    if (!waitForSpeechEnd) {
                        cleanup();
                        resolve(result);
                        return;
                    }
                    tryResolve();
                }
            };

            const handleSpeechEnd = () => {
                speechEnded = true;
                if (waitForSpeechEnd) tryResolve();
            };
            
            // Set up error handler
            const handleError = (error) => {
                if (!resultReceived) {
                    cleanup();
                    
                    // For recoverable errors, return empty result instead of rejecting
                    if (error.recoverable && error.code === 'no-speech') {
                        resolve({
                            text: '',
                            confidence: 0,
                            normalized: '',
                            alternatives: [],
                            isFinal: true,
                            noSpeech: true,
                            error
                        });
                    } else {
                        reject(error);
                    }
                }
            };
            
            // Set up end handler
            const handleEnd = () => {
                speechEnded = true;
                if (waitForSpeechEnd && finalResult) {
                    tryResolve();
                    return;
                }

                if (!resultReceived) {
                    cleanup();
                    // Return whatever we have
                    resolve(this.lastResult || {
                        text: '',
                        confidence: 0,
                        normalized: '',
                        alternatives: [],
                        isFinal: true,
                        noSpeech: true
                    });
                }
            };
            
            // Cleanup function
            const cleanup = () => {
                if (timeoutId) clearTimeout(timeoutId);
                this.off(RECOGNITION_EVENTS.RESULT, handleResult);
                this.off(RECOGNITION_EVENTS.SPEECH_END, handleSpeechEnd);
                this.off(RECOGNITION_EVENTS.ERROR, handleError);
                this.off(RECOGNITION_EVENTS.END, handleEnd);
            };
            
            // Subscribe to events
            this.on(RECOGNITION_EVENTS.RESULT, handleResult);
            this.on(RECOGNITION_EVENTS.SPEECH_END, handleSpeechEnd);
            this.on(RECOGNITION_EVENTS.ERROR, handleError);
            this.on(RECOGNITION_EVENTS.END, handleEnd);
            
            // Set timeout
            timeoutId = setTimeout(() => {
                if (!resultReceived) {
                    this.stop();
                }
            }, timeout);
            
            // Start recognition
            try {
                await this.start(options);
            } catch (err) {
                cleanup();
                reject(err);
            }
        });
    }
    
    /**
     * Listen with retry logic for language fallback
     * @param {number} timeoutMs - Timeout per attempt
     * @param {Object} options - Options
     * @returns {Promise<Object>} Best result from all attempts
     */
    async listenWithFallback(timeoutMs = null, options = {}) {
        const languages = [this.config.language, ...this.config.fallbackLanguages];
        const results = [];
        
        for (const lang of languages) {
            try {
                const result = await this.listen(timeoutMs, { ...options, language: lang });
                
                if (result.text && result.confidence > 0) {
                    result.language = lang;
                    results.push(result);
                    
                    // If confidence is high enough, use this result
                    if (result.confidence >= 0.8) {
                        this.logger.debug('High confidence result', { language: lang, confidence: result.confidence });
                        return result;
                    }
                }
            } catch (err) {
                this.logger.warn('Language attempt failed', { language: lang, error: err.message });
            }
            
            this.currentLanguageIndex++;
        }
        
        // Return best result from all attempts
        if (results.length > 0) {
            results.sort((a, b) => b.confidence - a.confidence);
            return results[0];
        }
        
        // No results from any language
        return {
            text: '',
            confidence: 0,
            normalized: '',
            alternatives: [],
            isFinal: true,
            noSpeech: true
        };
    }

    /**
     * Listen for bilingual input (Portuguese + English)
     * Uses the preferred language directly - no fallback (user only speaks once).
     * Language detection is done post-hoc based on the transcribed text.
     * 
     * @param {number} timeoutMs - Timeout for recognition
     * @param {Object} options - Additional options
     * @param {string} options.preferredLanguage - 'pt-PT' or 'en-GB' (default: 'en-GB')
     * @param {boolean} options.waitForSpeechEnd - Wait for speech end before returning
     * @param {number} options.postSpeechEndDelayMs - Delay after speech ends
     * @returns {Promise<Object>} Recognition result with detected language
     */
    async listenBilingual(timeoutMs = null, options = {}) {
        const {
            preferredLanguage = 'en-GB',
            ...restOptions
        } = options;

        const lang = preferredLanguage;

        const emptyResult = {
            text: '',
            confidence: 0,
            normalized: '',
            alternatives: [],
            isFinal: true,
            noSpeech: true,
            detectedLanguage: lang
        };

        /**
         * Detect if transcribed text is likely Portuguese based on content.
         * Used to set detectedLanguage for downstream processing.
         */
        const looksLikePortuguese = (text = '') => {
            if (!text) return false;
            const lower = text.toLowerCase();
            // Portuguese diacritics
            if (/[áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ]/.test(text)) return true;
            // Common Portuguese words/phrases
            if (/(\b(obrigad[oa]|olá|bom dia|boa tarde|boa noite|por favor|desculp[ae]|com licença|tchau|não|sim|muito|bem|está|estou|tenho|quero|posso|preciso|como|onde|quando|porque|porquê|também|sempre|nunca|agora|depois|antes|aqui|ali|isso|isto|esse|este|vocês?|eles?|elas?|nós|meu|minha|teu|tua|seu|sua)\b)/i.test(lower)) return true;
            return false;
        };

        this.logger.info('Starting voice recognition', { language: lang });

        let result = null;
        try {
            result = await this.listen(timeoutMs, { ...restOptions, language: lang });
        } catch (err) {
            this.logger.warn('Voice recognition failed', { language: lang, error: err.message });
            return emptyResult;
        }

        if (!result || !result.text || result.noSpeech) {
            this.logger.info('No speech detected', { language: lang });
            return emptyResult;
        }

        // Detect actual language from content (may differ from recognition language)
        const detectedLanguage = looksLikePortuguese(result.text) ? 'pt-PT' : 'en-GB';

        this.logger.info('Voice recognition complete', {
            recognitionLang: lang,
            detectedLanguage,
            confidence: result.confidence,
            text: result.text.substring(0, 50)
        });

        return {
            text: result.text,
            confidence: result.confidence,
            normalized: result.text,
            alternatives: result.alternatives || [],
            isFinal: true,
            noSpeech: false,
            detectedLanguage
        };
    }
    
    /**
     * Clean up resources
     */
    destroy() {
        this.abort();
        this.listeners.clear();
        this.recognition = null;
    }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let webSpeechServiceInstance = null;

/**
 * Get or create WebSpeechService singleton
 * @param {Object} config - Configuration options
 * @returns {WebSpeechService}
 */
export function getWebSpeechService(config = {}) {
    if (!webSpeechServiceInstance) {
        webSpeechServiceInstance = new WebSpeechService(config);
    }
    return webSpeechServiceInstance;
}

/**
 * Reset the singleton (for testing)
 */
export function resetWebSpeechService() {
    if (webSpeechServiceInstance) {
        webSpeechServiceInstance.destroy();
        webSpeechServiceInstance = null;
    }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Quick check if Web Speech is available
 * @returns {boolean}
 */
export function isWebSpeechAvailable() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    return Boolean(SpeechRecognition);
}

/**
 * Detect supported Portuguese variants
 * @returns {Promise<string[]>} Array of supported language codes
 */
export async function detectPortugueseSupport() {
    const supported = [];
    const toTest = ['pt-PT', 'pt-BR', 'pt'];
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return supported;
    
    // Unfortunately there's no way to query supported languages
    // We just return all variants as potentially supported
    return toTest;
}

// ============================================================================
// Default Export
// ============================================================================

export default {
    // Configuration
    WEBSPEECH_CONFIG,
    RECOGNITION_STATES,
    RECOGNITION_EVENTS,
    SPEECH_ERRORS,
    
    // Class
    WebSpeechService,
    
    // Singleton
    getWebSpeechService,
    resetWebSpeechService,
    
    // Normalization
    normalizePortuguese,
    normalizePreserveAccents,
    stripDiacritics,
    
    // Utilities
    isWebSpeechAvailable,
    detectPortugueseSupport
};
