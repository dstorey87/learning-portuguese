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
    // Recheck more frequently so we recover quickly when the TTS server starts.
    healthCheckInterval: 5000,
    // Default to a clear EU-PT male voice to match the learner experience.
    defaultVoice: 'pt-PT-DuarteNeural',
    defaultRate: 1.0,
    // Allow slower speech for pronunciation-focused learning.
    minRate: 0.35,
    maxRate: 2.0
};

// Defaults for AI tutor voice (consistent male English + male EU-PT).
export const DEFAULT_ENGLISH_VOICE = 'en-US-GuyNeural';
export const DEFAULT_PORTUGUESE_VOICE = 'pt-PT-DuarteNeural';
// Slower is better for learning pronunciation (especially EU-PT vowel reduction).
export const DEFAULT_PORTUGUESE_RATE = 0.58;

function applyPortugueseLearnerClarity(text) {
    const raw = String(text || '').replace(/\s+/g, ' ').trim();
    if (!raw) return '';

    // For single words, rate control is usually enough.
    const words = raw.split(' ').filter(Boolean);
    if (words.length <= 1) return raw;

    // For learners, add mild pauses between words without changing the visible text.
    // Commas create a short pause in most neural voices and help intelligibility.
    return words.join(', ');
}

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
    // English voices (for AI responses in English)
    'en-GB-SoniaNeural': {
        id: 'en-GB-SoniaNeural',
        name: 'Sonia',
        gender: 'female',
        locale: 'en-GB',
        region: 'UK',
        quality: 'neural',
        recommended: true,
        description: 'Clear British English voice for explanations'
    },
    'en-US-GuyNeural': {
        id: 'en-US-GuyNeural',
        name: 'Guy',
        gender: 'male',
        locale: 'en-US',
        region: 'US',
        quality: 'neural',
        recommended: true,
        description: 'Clear American English male voice'
    },
    'en-US-JennyNeural': {
        id: 'en-US-JennyNeural',
        name: 'Jenny',
        gender: 'female',
        locale: 'en-US',
        region: 'US',
        quality: 'neural',
        description: 'American English voice'
    },
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
    currentAudioResolve: null,
    currentAudioReject: null,
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
    const english = voices.filter(v => typeof v.locale === 'string' && v.locale.startsWith('en-'));
    const portugal = voices.filter(v => v.locale === TTS_LOCALES.PORTUGAL);
    const brazil = voices.filter(v => v.locale === TTS_LOCALES.BRAZIL);
    
    return {
        all: voices,
        english,
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
            state.currentAudioResolve = resolve;
            state.currentAudioReject = reject;
            
            state.currentAudio.onloadedmetadata = () => {
                if (typeof onStart === 'function') onStart();
            };
            
            state.currentAudio.onended = () => {
                URL.revokeObjectURL(audioUrl);
                state.currentAudio = null;
                state.currentAudioResolve = null;
                state.currentAudioReject = null;
                if (typeof onEnd === 'function') onEnd();
                resolve();
            };
            
            state.currentAudio.onerror = () => {
                URL.revokeObjectURL(audioUrl);
                state.currentAudio = null;
                state.currentAudioResolve = null;
                state.currentAudioReject = null;
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
    const { language = TTS_LOCALES.PORTUGAL, rate = TTS_CONFIG.defaultRate, onStart, onEnd, onError, preferGender } = options;
    
    return new Promise((resolve, reject) => {
        if (!('speechSynthesis' in window)) {
            const err = new Error('Web Speech API not supported');
            if (typeof onError === 'function') onError(err);
            reject(err);
            return;
        }
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = language;
        utterance.rate = rate;
        
        // Try to find a voice matching the requested language.
        // NOTE: Web Speech voices do not reliably expose gender; we use a best-effort name heuristic.
        const voices = speechSynthesis.getVoices();
        const langPrefix = language.split('-')[0];
        const matchesLanguage = (v) => v.lang === language || v.lang?.startsWith(`${langPrefix}-`) || v.lang === langPrefix;

        // Comprehensive male/female voice name heuristics for Web Speech fallback
        const genderRe = preferGender === 'male'
            ? /(\bmale\b|guy|david|mark|ryan|james|george|daniel|michael|jorge|joa[oã]o|duarte|ant[oó]nio|miguel|pedro|richard|brian|paul)/i
            : preferGender === 'female'
                ? /(\bfemale\b|jenny|sonia|raquel|maria|ana|francisca|thalita|samantha|susan|sarah|emily|linda|zira|helena)/i
                : null;

        const candidates = Array.isArray(voices) ? voices : [];
        const preferredByGender = genderRe
            ? candidates.filter(v => matchesLanguage(v) && genderRe.test(v.name || ''))
            : [];

        const targetVoice = preferredByGender[0] ||
            candidates.find(v => matchesLanguage(v)) ||
            candidates.find(v => v.lang?.startsWith('en')) ||
            candidates.find(v => v.lang?.startsWith('pt'));
        if (targetVoice) {
            utterance.voice = targetVoice;
        }
        
        utterance.onstart = () => {
            if (typeof onStart === 'function') onStart();
        };
        
        utterance.onend = () => {
            if (typeof onEnd === 'function') onEnd();
            resolve({ engine: TTS_ENGINES.WEB_SPEECH, voice: targetVoice?.name || 'default', language });
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
        language,
        onStart,
        onEnd,
        onError,
        fallbackToWebSpeech = true
    } = options;
    
    // DEBUG: Log what voice is being requested
    console.log('[TTS] speak() called:', { 
        text: text?.substring(0, 50) + (text?.length > 50 ? '...' : ''),
        voice, 
        rate, 
        language,
        fallbackToWebSpeech 
    });
    
    // Stop any current audio
    stop();
    
    // Try Edge-TTS first
    const serverOk = await checkServerHealth();
    console.log('[TTS] Server health:', serverOk);
    
    if (serverOk) {
        try {
            console.log('[TTS] Using Edge-TTS with voice:', voice);
            await speakWithEdgeTTS(text, { voice, rate, onStart, onEnd });
            state.lastUsedVoice = voice;
            state.lastUsedEngine = TTS_ENGINES.EDGE_TTS;
            console.log('[TTS] ✅ Edge-TTS succeeded:', { engine: 'edge-tts', voice });
            return { engine: TTS_ENGINES.EDGE_TTS, voice };
        } catch (error) {
            console.warn('[TTS] Edge-TTS failed, trying fallback:', error);
            if (typeof onError === 'function') onError(error);
        }
    }
    
    // Fallback to Web Speech API
    if (fallbackToWebSpeech) {
        const inferredLanguage = language || (typeof voice === 'string' ? voice.split('-').slice(0, 2).join('-') : undefined) || TTS_LOCALES.PORTUGAL;
        // Infer preferGender from voice ID if not explicitly provided
        const { preferGender } = options;
        const genderFromVoice = typeof voice === 'string' && /guy|duarte|ant[oó]nio|david|ryan|mark|jorge|maceri/i.test(voice) ? 'male' : undefined;
        const effectiveGender = preferGender || genderFromVoice;
        console.log('[TTS] ⚠️ Falling back to WebSpeech:', { language: inferredLanguage, preferGender: effectiveGender });
        const result = await speakWithWebSpeech(text, { language: inferredLanguage, rate, onStart, onEnd, onError, preferGender: effectiveGender });
        state.lastUsedVoice = result.voice;
        state.lastUsedEngine = TTS_ENGINES.WEB_SPEECH;
        console.log('[TTS] WebSpeech result:', result);
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
 * Speak Portuguese (EU-PT) text - SLOW for learning
 * @param {string} text - Text to speak
 * @param {Object} options - Options
 * @returns {Promise<Object>} Result
 */
export async function speakPortuguese(text, options = {}) {
    const voice = options.voice || (options.gender === 'male' ? 'pt-PT-DuarteNeural' : DEFAULT_PORTUGUESE_VOICE);
    const rate = typeof options.rate === 'number' ? options.rate : DEFAULT_PORTUGUESE_RATE;
    const clarity = options.clarity === true || options.clarity === 'learner';
    const finalText = clarity ? applyPortugueseLearnerClarity(text) : text;
    console.log('[TTS] speakPortuguese:', { voice, rate, text: text?.substring(0, 30) });
    return speak(finalText, { ...options, voice, rate, language: TTS_LOCALES.PORTUGAL });
}

/**
 * Speak English text (for AI explanations) - clear American accent
 * @param {string} text - Text to speak
 * @param {Object} options - Options
 * @returns {Promise<Object>} Result
 */
export async function speakEnglish(text, options = {}) {
    const voice = options.voice || DEFAULT_ENGLISH_VOICE;
    const rate = typeof options.rate === 'number' ? options.rate : 1.0;
    console.log('[TTS] speakEnglish:', { voice, rate, text: text?.substring(0, 30) });
    // Prefer a matching Web Speech fallback language when Edge-TTS is unavailable
    const language = typeof voice === 'string' && voice.startsWith('en-GB') ? 'en-GB' : 'en-US';
    return speak(text, { ...options, voice, rate, language });
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
        // Resolve any pending await so callers don't hang when stop is user-initiated.
        if (typeof state.currentAudioResolve === 'function') {
            try { state.currentAudioResolve(); } catch { /* ignore */ }
        }
        state.currentAudioResolve = null;
        state.currentAudioReject = null;
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
