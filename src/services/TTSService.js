/**
 * TTS Service
 * 
 * High-quality neural Text-to-Speech service for Portuguese:
 * - Edge-TTS via backend proxy (primary, neural quality)
 * - Web Speech API fallback (offline/when server unavailable)
 * 
 * Portuguese Voices (Edge-TTS):
 * 🇵🇹 Portugal: Duarte (M), Raquel (F) - EU-PT recommended
 * 🇧🇷 Brazil: António (M), Francisca (F), Macério (M), Thalita (F)
 * 
 * @module services/TTSService
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * TTS Service configuration
 */
export const TTS_CONFIG = {
    serverUrl: 'http://localhost:3001',
    timeout: 15000,
    healthCheckInterval: 30000,
    defaultVoice: 'pt-PT-RaquelNeural',
    defaultRate: 1.0,
    minRate: 0.5,
    maxRate: 2.0
};

/**
 * TTS Engines
 */
export const TTS_ENGINES = {
    EDGE_TTS: 'edge-tts',
    WEB_SPEECH: 'web-speech'
};

/**
 * Voice locales
 */
export const TTS_LOCALES = {
    PORTUGAL: 'pt-PT',
    BRAZIL: 'pt-BR'
};

// ============================================================================
// VOICE CATALOG
// ============================================================================

/**
 * Edge-TTS Voice catalog
 */
export const EDGE_VOICES = {
    // European Portuguese (preferred)
    'pt-PT-DuarteNeural': {
        id: 'pt-PT-DuarteNeural',
        name: 'Duarte',
        gender: 'male',
        locale: TTS_LOCALES.PORTUGAL,
        region: 'Portugal',
        quality: 'neural',
        recommended: true,
        description: 'Clear male voice, perfect for European Portuguese'
    },
    'pt-PT-RaquelNeural': {
        id: 'pt-PT-RaquelNeural',
        name: 'Raquel',
        gender: 'female',
        locale: TTS_LOCALES.PORTUGAL,
        region: 'Portugal',
        quality: 'neural',
        recommended: true,
        description: 'Natural female voice, great for beginners'
    },
    // Brazilian Portuguese
    'pt-BR-AntonioNeural': {
        id: 'pt-BR-AntonioNeural',
        name: 'António',
        gender: 'male',
        locale: TTS_LOCALES.BRAZIL,
        region: 'Brazil',
        quality: 'neural'
    },
    'pt-BR-FranciscaNeural': {
        id: 'pt-BR-FranciscaNeural',
        name: 'Francisca',
        gender: 'female',
        locale: TTS_LOCALES.BRAZIL,
        region: 'Brazil',
        quality: 'neural'
    },
    'pt-BR-MacerioMultilingualNeural': {
        id: 'pt-BR-MacerioMultilingualNeural',
        name: 'Macério',
        gender: 'male',
        locale: TTS_LOCALES.BRAZIL,
        region: 'Brazil',
        quality: 'neural-multilingual'
    },
    'pt-BR-ThalitaMultilingualNeural': {
        id: 'pt-BR-ThalitaMultilingualNeural',
        name: 'Thalita',
        gender: 'female',
        locale: TTS_LOCALES.BRAZIL,
        region: 'Brazil',
        quality: 'neural-multilingual'
    }
};

// ============================================================================
// STATE
// ============================================================================

let state = {
    serverAvailable: null, // null = unknown, true/false = tested
    lastServerCheck: 0,
    currentAudio: null,
    lastUsedVoice: null,
    lastUsedEngine: null
};

// ============================================================================
// SERVER HEALTH
// ============================================================================

/**
 * Check if Edge-TTS server is available
 * @returns {Promise<boolean>} Server availability
 */
export async function checkServerHealth() {
    const now = Date.now();
    
    // Use cached result if recent
    if (state.serverAvailable !== null && (now - state.lastServerCheck) < TTS_CONFIG.healthCheckInterval) {
        return state.serverAvailable;
    }
    
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        
        const response = await fetch(`${TTS_CONFIG.serverUrl}/health`, {
            signal: controller.signal
        });
        
        clearTimeout(timeout);
        state.serverAvailable = response.ok;
        state.lastServerCheck = now;
        
        if (response.ok) {
            const data = await response.json();
            console.log('🎤 Edge-TTS server connected:', data);
        }
        
        return state.serverAvailable;
        
    } catch (error) {
        console.warn('Edge-TTS server not available:', error.message);
        state.serverAvailable = false;
        state.lastServerCheck = now;
        return false;
    }
}

/**
 * Get server status
 * @returns {Object} Server status
 */
export function getServerStatus() {
    return {
        available: state.serverAvailable,
        lastCheck: state.lastServerCheck,
        url: TTS_CONFIG.serverUrl
    };
}

/**
 * Force server health re-check
 * @returns {Promise<boolean>} Server availability
 */
export async function refreshServerStatus() {
    state.lastServerCheck = 0;
    return checkServerHealth();
}

// ============================================================================
// VOICE SELECTION
// ============================================================================

/**
 * Get all available voices
 * @returns {Object} Voice catalog
 */
export function getAvailableVoices() {
    const voices = Object.values(EDGE_VOICES);
    const portugal = voices.filter(v => v.locale === TTS_LOCALES.PORTUGAL);
    const brazil = voices.filter(v => v.locale === TTS_LOCALES.BRAZIL);
    
    return {
        all: voices,
        portugal,
        brazil,
        byGender: {
            male: voices.filter(v => v.gender === 'male'),
            female: voices.filter(v => v.gender === 'female')
        },
        recommended: voices.filter(v => v.recommended),
        default: TTS_CONFIG.defaultVoice
    };
}

/**
 * Get voice by ID
 * @param {string} voiceId - Voice ID
 * @returns {Object|null} Voice info
 */
export function getVoice(voiceId) {
    return EDGE_VOICES[voiceId] || null;
}

/**
 * Get recommended voice for gender
 * @param {string} gender - 'male' or 'female'
 * @param {string} locale - 'pt-PT' or 'pt-BR'
 * @returns {Object|null} Voice info
 */
export function getRecommendedVoice(gender = 'female', locale = TTS_LOCALES.PORTUGAL) {
    const voices = Object.values(EDGE_VOICES);
    
    // First try exact match
    const exact = voices.find(v => 
        v.gender === gender && 
        v.locale === locale && 
        v.recommended
    );
    if (exact) return exact;
    
    // Try same locale
    const sameLocale = voices.find(v => 
        v.gender === gender && 
        v.locale === locale
    );
    if (sameLocale) return sameLocale;
    
    // Try any with same gender
    const sameGender = voices.find(v => v.gender === gender && v.recommended);
    if (sameGender) return sameGender;
    
    // Default
    return EDGE_VOICES[TTS_CONFIG.defaultVoice];
}

// ============================================================================
// EDGE-TTS SPEECH
// ============================================================================

/**
 * Convert rate (0.5-2.0) to Edge-TTS format
 * @param {number} rate - Rate value
 * @returns {string} Edge-TTS rate string
 */
function formatEdgeTTSRate(rate) {
    const ratePercent = Math.round((rate - 1) * 100);
    return ratePercent >= 0 ? `+${ratePercent}%` : `${ratePercent}%`;
}

/**
 * Speak using Edge-TTS server
 * @param {string} text - Text to speak
 * @param {Object} options - Options
 * @returns {Promise<void>}
 */
async function speakWithEdgeTTS(text, options = {}) {
    const { 
        voice = TTS_CONFIG.defaultVoice, 
        rate = TTS_CONFIG.defaultRate, 
        onStart, 
        onEnd 
    } = options;
    
    const rateStr = formatEdgeTTSRate(rate);
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TTS_CONFIG.timeout);
    
    try {
        const response = await fetch(`${TTS_CONFIG.serverUrl}/tts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, voice, rate: rateStr }),
            signal: controller.signal
        });
        
        clearTimeout(timeout);
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(error.message || error.error || `HTTP ${response.status}`);
        }
        
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        
        return new Promise((resolve, reject) => {
            state.currentAudio = new Audio(audioUrl);
            
            state.currentAudio.onloadedmetadata = () => {
                if (typeof onStart === 'function') onStart();
            };
            
            state.currentAudio.onended = () => {
                URL.revokeObjectURL(audioUrl);
                state.currentAudio = null;
                if (typeof onEnd === 'function') onEnd();
                resolve();
            };
            
            state.currentAudio.onerror = () => {
                URL.revokeObjectURL(audioUrl);
                state.currentAudio = null;
                reject(new Error('Audio playback failed'));
            };
            
            state.currentAudio.play().catch(reject);
        });
        
    } catch (error) {
        clearTimeout(timeout);
        throw error;
    }
}

// ============================================================================
// WEB SPEECH FALLBACK
// ============================================================================

/**
 * Speak using Web Speech API (fallback)
 * @param {string} text - Text to speak
 * @param {Object} options - Options
 * @returns {Promise<Object>} Result
 */
function speakWithWebSpeech(text, options = {}) {
    const { rate = TTS_CONFIG.defaultRate, onStart, onEnd, onError } = options;
    
    return new Promise((resolve, reject) => {
        if (!('speechSynthesis' in window)) {
            const err = new Error('Web Speech API not supported');
            if (typeof onError === 'function') onError(err);
            reject(err);
            return;
        }
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = TTS_LOCALES.PORTUGAL;
        utterance.rate = rate;
        
        // Try to find a Portuguese voice
        const voices = speechSynthesis.getVoices();
        const ptVoice = voices.find(v => v.lang.startsWith('pt-PT')) ||
                        voices.find(v => v.lang.startsWith('pt'));
        if (ptVoice) {
            utterance.voice = ptVoice;
        }
        
        utterance.onstart = () => {
            if (typeof onStart === 'function') onStart();
        };
        
        utterance.onend = () => {
            if (typeof onEnd === 'function') onEnd();
            resolve({ engine: TTS_ENGINES.WEB_SPEECH, voice: ptVoice?.name || 'default' });
        };
        
        utterance.onerror = (e) => {
            if (typeof onError === 'function') onError(e);
            reject(e);
        };
        
        speechSynthesis.cancel();
        speechSynthesis.speak(utterance);
    });
}

// ============================================================================
// MAIN SPEAK FUNCTION
// ============================================================================

/**
 * Speak text using Edge-TTS (primary) or Web Speech API (fallback)
 * @param {string} text - Text to speak
 * @param {Object} options - Options
 * @returns {Promise<Object>} Result with engine and voice used
 */
export async function speak(text, options = {}) {
    const {
        voice = TTS_CONFIG.defaultVoice,
        rate = TTS_CONFIG.defaultRate,
        onStart,
        onEnd,
        onError,
        fallbackToWebSpeech = true
    } = options;
    
    // Stop any current audio
    stop();
    
    // Try Edge-TTS first
    const serverOk = await checkServerHealth();
    
    if (serverOk) {
        try {
            await speakWithEdgeTTS(text, { voice, rate, onStart, onEnd });
            state.lastUsedVoice = voice;
            state.lastUsedEngine = TTS_ENGINES.EDGE_TTS;
            return { engine: TTS_ENGINES.EDGE_TTS, voice };
        } catch (error) {
            console.warn('Edge-TTS failed, trying fallback:', error);
            if (typeof onError === 'function') onError(error);
        }
    }
    
    // Fallback to Web Speech API
    if (fallbackToWebSpeech) {
        const result = await speakWithWebSpeech(text, { rate, onStart, onEnd, onError });
        state.lastUsedVoice = result.voice;
        state.lastUsedEngine = TTS_ENGINES.WEB_SPEECH;
        return result;
    }
    
    throw new Error('No TTS engine available');
}

/**
 * Speak with specific voice
 * @param {string} text - Text to speak
 * @param {string} voiceId - Voice ID
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Result
 */
export async function speakWithVoice(text, voiceId, options = {}) {
    return speak(text, { ...options, voice: voiceId });
}

/**
 * Speak Portuguese (EU-PT) text
 * @param {string} text - Text to speak
 * @param {Object} options - Options
 * @returns {Promise<Object>} Result
 */
export async function speakPortuguese(text, options = {}) {
    const voice = options.gender === 'male' 
        ? 'pt-PT-DuarteNeural' 
        : 'pt-PT-RaquelNeural';
    return speak(text, { ...options, voice });
}

// ============================================================================
// PLAYBACK CONTROL
// ============================================================================

/**
 * Stop current speech
 */
export function stop() {
    if (state.currentAudio) {
        state.currentAudio.pause();
        state.currentAudio = null;
    }
    if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
    }
}

/**
 * Check if currently speaking
 * @returns {boolean}
 */
export function isSpeaking() {
    if (state.currentAudio && !state.currentAudio.paused) {
        return true;
    }
    if ('speechSynthesis' in window && speechSynthesis.speaking) {
        return true;
    }
    return false;
}

/**
 * Get current playback state
 * @returns {Object} Playback state
 */
export function getPlaybackState() {
    return {
        speaking: isSpeaking(),
        lastVoice: state.lastUsedVoice,
        lastEngine: state.lastUsedEngine,
        hasAudio: state.currentAudio !== null
    };
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize TTS service
 * @returns {Promise<Object>} Init status
 */
export async function initTTSService() {
    const serverOk = await checkServerHealth();
    const voices = getAvailableVoices();
    
    return {
        initialized: true,
        serverAvailable: serverOk,
        voices: voices.all.length,
        recommendedVoices: voices.recommended.length,
        defaultVoice: TTS_CONFIG.defaultVoice,
        timestamp: Date.now()
    };
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
    // Config
    TTS_CONFIG,
    TTS_ENGINES,
    TTS_LOCALES,
    EDGE_VOICES,
    
    // Server
    checkServerHealth,
    getServerStatus,
    refreshServerStatus,
    
    // Voices
    getAvailableVoices,
    getVoice,
    getRecommendedVoice,
    
    // Speak
    speak,
    speakWithVoice,
    speakPortuguese,
    
    // Playback
    stop,
    isSpeaking,
    getPlaybackState,
    
    // Init
    initTTSService
};
