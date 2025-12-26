/**
 * AI TTS Engine - High-quality neural Text-to-Speech
 * 
 * Supports:
 * - Edge-TTS (via backend proxy) - Primary, high-quality neural voices
 * - Web Speech API - Fallback for offline/when server unavailable
 * 
 * Portuguese Voices (Edge-TTS):
 * 🇵🇹 Portugal: Duarte (M), Raquel (F) - EU-PT recommended
 * 🇧🇷 Brazil: António (M), Francisca (F), Macério (M), Thalita (F)
 */

// TTS Server configuration
const TTS_SERVER_URL = 'http://localhost:3001';
const TTS_TIMEOUT_MS = 15000;

// Voice catalog matching server
const EDGE_VOICES = {
    // European Portuguese (preferred)
    'pt-PT-DuarteNeural': {
        id: 'pt-PT-DuarteNeural',
        name: 'Duarte',
        gender: 'male',
        locale: 'pt-PT',
        region: 'Portugal',
        quality: 'neural',
        recommended: true,
        description: 'Clear male voice, perfect for European Portuguese'
    },
    'pt-PT-RaquelNeural': {
        id: 'pt-PT-RaquelNeural',
        name: 'Raquel',
        gender: 'female',
        locale: 'pt-PT',
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
        locale: 'pt-BR',
        region: 'Brazil',
        quality: 'neural'
    },
    'pt-BR-FranciscaNeural': {
        id: 'pt-BR-FranciscaNeural',
        name: 'Francisca',
        gender: 'female',
        locale: 'pt-BR',
        region: 'Brazil',
        quality: 'neural'
    },
    'pt-BR-MacerioMultilingualNeural': {
        id: 'pt-BR-MacerioMultilingualNeural',
        name: 'Macério',
        gender: 'male',
        locale: 'pt-BR',
        region: 'Brazil',
        quality: 'neural-multilingual'
    },
    'pt-BR-ThalitaMultilingualNeural': {
        id: 'pt-BR-ThalitaMultilingualNeural',
        name: 'Thalita',
        gender: 'female',
        locale: 'pt-BR',
        region: 'Brazil',
        quality: 'neural-multilingual'
    }
};

// State tracking
let serverAvailable = null; // null = unknown, true/false = tested
let lastServerCheck = 0;
const SERVER_CHECK_INTERVAL = 30000; // Re-check every 30s

// Audio playback
let currentAudio = null;

/**
 * Check if Edge-TTS server is available
 */
export async function checkServerHealth() {
    const now = Date.now();
    
    // Use cached result if recent
    if (serverAvailable !== null && (now - lastServerCheck) < SERVER_CHECK_INTERVAL) {
        return serverAvailable;
    }
    
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        
        const response = await fetch(`${TTS_SERVER_URL}/health`, {
            signal: controller.signal
        });
        
        clearTimeout(timeout);
        serverAvailable = response.ok;
        lastServerCheck = now;
        
        if (response.ok) {
            const data = await response.json();
            console.log('🎤 Edge-TTS server connected:', data);
        }
        
        return serverAvailable;
    } catch (error) {
        console.warn('Edge-TTS server not available:', error.message);
        serverAvailable = false;
        lastServerCheck = now;
        return false;
    }
}

/**
 * Get all available voices
 */
export function getAvailableVoices() {
    const voices = Object.values(EDGE_VOICES);
    const portugal = voices.filter(v => v.locale === 'pt-PT');
    const brazil = voices.filter(v => v.locale === 'pt-BR');
    
    return {
        all: voices,
        portugal,
        brazil,
        byGender: {
            male: voices.filter(v => v.gender === 'male'),
            female: voices.filter(v => v.gender === 'female')
        },
        recommended: voices.filter(v => v.recommended),
        default: 'pt-PT-RaquelNeural'
    };
}

/**
 * Speak text using Edge-TTS (primary) or Web Speech API (fallback)
 */
export async function speak(text, options = {}) {
    const {
        voice = 'pt-PT-RaquelNeural',
        rate = 1.0,
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
            return { engine: 'edge-tts', voice };
        } catch (error) {
            console.warn('Edge-TTS failed, trying fallback:', error);
            if (onError) onError(error);
        }
    }
    
    // Fallback to Web Speech API
    if (fallbackToWebSpeech) {
        return speakWithWebSpeech(text, { rate, onStart, onEnd, onError });
    }
    
    throw new Error('No TTS engine available');
}

/**
 * Speak using Edge-TTS server
 */
async function speakWithEdgeTTS(text, { voice, rate, onStart, onEnd }) {
    // Convert rate (0.5-2.0) to Edge-TTS format (-50% to +100%)
    const ratePercent = Math.round((rate - 1) * 100);
    const rateStr = ratePercent >= 0 ? `+${ratePercent}%` : `${ratePercent}%`;
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TTS_TIMEOUT_MS);
    
    try {
        const response = await fetch(`${TTS_SERVER_URL}/tts`, {
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
            currentAudio = new Audio(audioUrl);
            
            currentAudio.onloadedmetadata = () => {
                if (onStart) onStart();
            };
            
            currentAudio.onended = () => {
                URL.revokeObjectURL(audioUrl);
                currentAudio = null;
                if (onEnd) onEnd();
                resolve();
            };
            
            currentAudio.onerror = () => {
                URL.revokeObjectURL(audioUrl);
                currentAudio = null;
                reject(new Error('Audio playback failed'));
            };
            
            currentAudio.play().catch(reject);
        });
        
    } catch (error) {
        clearTimeout(timeout);
        throw error;
    }
}

/**
 * Speak using Web Speech API (fallback)
 */
function speakWithWebSpeech(text, { rate, onStart, onEnd, onError }) {
    return new Promise((resolve, reject) => {
        if (!('speechSynthesis' in window)) {
            const err = new Error('Web Speech API not supported');
            if (onError) onError(err);
            reject(err);
            return;
        }
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-PT';
        utterance.rate = rate;
        
        // Try to find a Portuguese voice
        const voices = speechSynthesis.getVoices();
        const ptVoice = voices.find(v => v.lang.startsWith('pt-PT')) ||
                        voices.find(v => v.lang.startsWith('pt'));
        if (ptVoice) {
            utterance.voice = ptVoice;
        }
        
        utterance.onstart = () => {
            if (onStart) onStart();
        };
        
        utterance.onend = () => {
            if (onEnd) onEnd();
            resolve({ engine: 'web-speech', voice: ptVoice?.name || 'default' });
        };
        
        utterance.onerror = (e) => {
            if (onError) onError(e);
            reject(e);
        };
        
        speechSynthesis.cancel();
        speechSynthesis.speak(utterance);
    });
}

/**
 * Stop current speech
 */
export function stop() {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }
    if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
    }
}

/**
 * Check if currently speaking
 */
export function isSpeaking() {
    if (currentAudio && !currentAudio.paused) {
        return true;
    }
    if ('speechSynthesis' in window && speechSynthesis.speaking) {
        return true;
    }
    return false;
}

// Export for use in other modules
export default {
    speak,
    stop,
    isSpeaking,
    checkServerHealth,
    getAvailableVoices,
    EDGE_VOICES,
    TTS_SERVER_URL
};
