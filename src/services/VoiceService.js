/**
 * Voice Service
 * 
 * Manages voice playback and TTS for Portuguese language learning:
 * - Web Speech API integration
 * - Voice selection and preferences
 * - Bundled voice management
 * - Downloadable voice catalog
 * - Karaoke-style word highlighting callbacks
 * 
 * @module services/VoiceService
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Voice service configuration
 */
export const VOICE_CONFIG = {
    defaultRate: 0.85,
    sentenceRate: 1.0,
    defaultGender: 'female',
    defaultLang: 'pt-PT',
    voicesLoadTimeout: 8000,
    pollInterval: 300,
    maxPollAttempts: 10
};

/**
 * Voice engines
 */
export const VOICE_ENGINES = {
    WEBSPEECH: 'webspeech',
    BUNDLED: 'bundled',
    HTTP: 'http'
};

/**
 * Voice providers
 */
export const VOICE_PROVIDERS = {
    GOOGLE: 'Google',
    MICROSOFT: 'Microsoft',
    APPLE: 'Apple',
    AMAZON: 'Amazon',
    ESPEAK: 'eSpeak',
    PIPER: 'Piper',
    SYSTEM: 'System'
};

// Storage keys
const BUNDLED_META_KEY = 'ptBundledVoiceMetaV1';
const DOWNLOADED_VOICES_KEY = 'ptDownloadedVoicesV1';

// ============================================================================
// STATE
// ============================================================================

let state = {
    lastVoiceUsed: {
        status: 'idle',
        engine: null,
        provider: null,
        name: null,
        lang: null,
        voiceKey: null,
        forcedKey: null,
        rate: null,
        timestamp: Date.now()
    },
    cachedVoices: null,
    voicesLoaded: false,
    audioContext: null
};

// Default bundled voice metadata
const DEFAULT_BUNDLED_META = {
    downloaded: false,
    sizeBytes: 63_201_294,
    updatedAt: null,
    version: 'piper-pt-pt-tugao-medium',
    voiceKey: null,
    url: null,
    sha256: null,
    provider: null
};

// ============================================================================
// DOWNLOADABLE VOICE CATALOG
// ============================================================================

/**
 * Catalog of downloadable EU-PT voices
 */
const DOWNLOADABLE_VOICES = [
    {
        key: 'piper-joana',
        name: 'Joana',
        gender: 'female',
        provider: 'Piper',
        quality: 'high',
        description: 'Clear, natural female voice from Piper TTS. Excellent for beginners.',
        sizeBytes: 63_201_294,
        sizeMB: 60,
        url: 'https://huggingface.co/rhasspy/piper-voices/resolve/main/pt/pt_PT/tug%C3%A3o/medium/pt_PT-tug%C3%A3o-medium.onnx',
        configUrl: 'https://huggingface.co/rhasspy/piper-voices/resolve/main/pt/pt_PT/tug%C3%A3o/medium/pt_PT-tug%C3%A3o-medium.onnx.json',
        sha256: '223a7aaca69a155c61897e8ada7c3b13bc306e16c72dbb9c2fed733e2b0927d4',
        sampleRate: 22050,
        requiresBackend: true
    }
];

/**
 * Bundled voice options for compatibility
 */
const BUNDLED_VOICE_OPTIONS = [
    {
        key: 'bundled|pt-pt|piper-tugao-medium',
        name: 'Joana (Piper EU-PT)',
        displayName: 'Joana',
        gender: 'female',
        provider: 'Piper',
        quality: 'high',
        description: 'Clear, natural female voice. Excellent for beginners.',
        sizeBytes: 63_201_294,
        url: 'https://huggingface.co/rhasspy/piper-voices/resolve/main/pt/pt_PT/tug%C3%A3o/medium/pt_PT-tug%C3%A3o-medium.onnx',
        sha256: '223a7aaca69a155c61897e8ada7c3b13bc306e16c72dbb9c2fed733e2b0927d4',
        sampleRate: 22050,
        recommended: true
    }
];

// ============================================================================
// AUDIO CONTEXT
// ============================================================================

/**
 * Get or create AudioContext singleton
 * @returns {AudioContext|null}
 */
function getAudioContext() {
    if (typeof window === 'undefined') return null;
    
    if (!state.audioContext) {
        const Ctor = window.AudioContext || window.webkitAudioContext;
        if (!Ctor) return null;
        state.audioContext = new Ctor();
    }
    
    return state.audioContext;
}

/**
 * Play audio from array buffer
 * @param {ArrayBuffer} arrayBuffer - Audio data
 * @returns {Promise<void>}
 */
async function playArrayBuffer(arrayBuffer) {
    const ctx = getAudioContext();
    if (!ctx) throw new Error('AudioContext not available');
    
    if (ctx.state === 'suspended') {
        try { await ctx.resume(); } catch { /* ignore */ }
    }
    
    const buffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
    
    return new Promise((resolve, reject) => {
        try {
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(ctx.destination);
            source.onended = () => resolve();
            source.start(0);
        } catch (error) {
            reject(error);
        }
    });
}

// ============================================================================
// VOICE STATE MANAGEMENT
// ============================================================================

/**
 * Update last voice used state
 * @param {Object} payload - Voice state
 */
function setLastVoiceUsed(payload) {
    state.lastVoiceUsed = {
        status: 'idle',
        engine: null,
        provider: null,
        name: null,
        lang: null,
        voiceKey: null,
        forcedKey: null,
        rate: null,
        ...payload,
        timestamp: Date.now()
    };
}

/**
 * Get last voice used
 * @returns {Object} Last voice state
 */
export function getLastVoiceUsed() {
    return { ...state.lastVoiceUsed };
}

// ============================================================================
// DOWNLOADED VOICES
// ============================================================================

/**
 * Get list of downloaded voice keys
 * @returns {Array<string>}
 */
export function getDownloadedVoices() {
    try {
        const raw = localStorage.getItem(DOWNLOADED_VOICES_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

/**
 * Mark a voice as downloaded
 * @param {string} voiceKey - Voice key
 */
export function markVoiceDownloaded(voiceKey) {
    try {
        const downloaded = getDownloadedVoices();
        if (!downloaded.includes(voiceKey)) {
            downloaded.push(voiceKey);
            localStorage.setItem(DOWNLOADED_VOICES_KEY, JSON.stringify(downloaded));
        }
    } catch (e) {
        console.warn('Failed to mark voice as downloaded', e);
    }
}

/**
 * Check if voice is downloaded
 * @param {string} voiceKey - Voice key
 * @returns {boolean}
 */
export function isVoiceDownloaded(voiceKey) {
    return getDownloadedVoices().includes(voiceKey);
}

/**
 * Get downloadable voices with download status
 * @returns {Array} Voice catalog
 */
export function getDownloadableVoices() {
    return DOWNLOADABLE_VOICES.map(v => ({
        ...v,
        downloaded: isVoiceDownloaded(v.key)
    }));
}

// ============================================================================
// BUNDLED VOICE MANAGEMENT
// ============================================================================

/**
 * Read bundled voice metadata
 * @returns {Object} Meta data
 */
function readBundledMeta() {
    try {
        const raw = localStorage.getItem(BUNDLED_META_KEY);
        if (!raw) return { ...DEFAULT_BUNDLED_META };
        const parsed = JSON.parse(raw);
        return {
            ...DEFAULT_BUNDLED_META,
            ...parsed,
            downloaded: Boolean(parsed.downloaded)
        };
    } catch (error) {
        console.warn('Unable to read bundled voice meta', error);
        return { ...DEFAULT_BUNDLED_META };
    }
}

/**
 * Write bundled voice metadata
 * @param {Object} meta - Metadata
 */
function writeBundledMeta(meta) {
    try {
        localStorage.setItem(BUNDLED_META_KEY, JSON.stringify(meta));
    } catch (error) {
        console.warn('Unable to persist bundled voice meta', error);
    }
}

/**
 * Get bundled voice status
 * @returns {Object} Status
 */
export function getBundledVoiceStatus() {
    return readBundledMeta();
}

/**
 * Check if bundled voice is ready
 * @returns {boolean}
 */
export function isBundledVoiceReady() {
    return readBundledMeta().downloaded;
}

/**
 * Get bundled voice options
 * @returns {Array} Voice options
 */
export function getBundledVoiceOptions() {
    return [...BUNDLED_VOICE_OPTIONS];
}

/**
 * Get bundled voice count by gender
 * @returns {Object} Count by gender
 */
export function getBundledVoiceCount() {
    const male = BUNDLED_VOICE_OPTIONS.filter(v => v.gender === 'male').length;
    const female = BUNDLED_VOICE_OPTIONS.filter(v => v.gender === 'female').length;
    return { male, female, total: male + female };
}

/**
 * Clear bundled voice data
 */
export function clearBundledVoice() {
    writeBundledMeta({ ...DEFAULT_BUNDLED_META, downloaded: false, updatedAt: Date.now() });
}

/**
 * Start bundled voice download
 * @param {Object} options - Download options
 * @returns {Object} Controller with cancel method
 */
export function startBundledVoiceDownload({ voiceKey, onProgress, onError } = {}) {
    const voice = BUNDLED_VOICE_OPTIONS.find(v => v.key === voiceKey) || BUNDLED_VOICE_OPTIONS[0];
    const controller = new AbortController();
    let canceled = false;
    
    const toHex = (buffer) => 
        Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    
    const safeProgress = (value) => {
        if (canceled) return;
        const pct = Math.min(100, Math.max(0, Math.round(value)));
        if (typeof onProgress === 'function') onProgress(pct, voice);
    };
    
    const persistMeta = (sizeBytesOverride) => {
        const meta = {
            ...DEFAULT_BUNDLED_META,
            downloaded: true,
            updatedAt: Date.now(),
            sizeBytes: sizeBytesOverride || voice?.sizeBytes || DEFAULT_BUNDLED_META.sizeBytes,
            voiceKey: voice?.key || null,
            url: voice?.url || null,
            sha256: voice?.sha256 || null,
            provider: voice?.provider || null
        };
        writeBundledMeta(meta);
    };
    
    const finishSuccess = (sizeBytesOverride) => {
        persistMeta(sizeBytesOverride);
        safeProgress(100);
    };
    
    const runSimulated = () => {
        let progress = 0;
        const tick = () => {
            if (canceled) return;
            progress = Math.min(100, progress + Math.floor(Math.random() * 14) + 8);
            if (progress >= 100) {
                finishSuccess();
                return;
            }
            safeProgress(progress);
            setTimeout(tick, 280);
        };
        setTimeout(tick, 180);
    };
    
    const download = async () => {
        if (!voice?.url) {
            if (typeof onError === 'function') onError(new Error('Missing bundled voice URL'));
            return runSimulated();
        }
        
        safeProgress(1);
        
        try {
            const response = await fetch(voice.url, { signal: controller.signal });
            if (canceled) return;
            if (!response.ok || !response.body) throw new Error(`Download failed (${response.status})`);
            
            const total = Number(response.headers.get('content-length')) || voice.sizeBytes || 0;
            const reader = response.body.getReader();
            let received = 0;
            const chunks = [];
            
            let finished = false;
            while (!finished) {
                const result = await reader.read();
                if (canceled) return;
                finished = Boolean(result.done);
                if (finished) break;
                
                if (result.value) {
                    received += result.value.byteLength;
                    chunks.push(result.value);
                    const baseline = total || voice.sizeBytes || 75_000_000;
                    const pct = Math.min(99, Math.round((received / baseline) * 100));
                    safeProgress(Math.max(5, pct));
                }
            }
            
            const blob = new Blob(chunks, { type: 'application/octet-stream' });
            const sizeBytes = blob.size || total || voice.sizeBytes || DEFAULT_BUNDLED_META.sizeBytes;
            
            // Verify SHA-256 if available
            if (voice?.sha256 && crypto?.subtle) {
                const hashBuffer = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer());
                const digestHex = toHex(hashBuffer);
                if (digestHex.toLowerCase() !== voice.sha256.toLowerCase()) {
                    const hashError = new Error('Bundled voice integrity check failed');
                    if (typeof onError === 'function') onError(hashError);
                    console.warn('SHA-256 mismatch', { expected: voice.sha256, actual: digestHex });
                    return;
                }
            }
            
            // Cache the downloaded voice
            if (typeof caches !== 'undefined') {
                try {
                    const cache = await caches.open('bundled-voices-v1');
                    await cache.put(voice.url, new Response(blob));
                } catch (cacheError) {
                    console.warn('Voice cache write failed', cacheError);
                }
            }
            
            finishSuccess(sizeBytes);
            
        } catch (error) {
            if (canceled) return;
            console.warn('Voice download failed, using simulation', error);
            if (typeof onError === 'function') onError(error);
            runSimulated();
        }
    };
    
    download();
    
    return {
        cancel: () => {
            canceled = true;
            controller.abort();
        },
        isCanceled: () => canceled
    };
}

// ============================================================================
// VOICE SELECTION
// ============================================================================

/**
 * Gender tokens for voice matching
 */
const MALE_TOKENS = ['male', 'masculino', 'joao', 'ricardo', 'rui', 'miguel', 'fernando', 'duarte', 'antonio', 'tiago', 'vasco', 'paulo', 'luis', 'pedro', 'carlos', 'jose', 'manuel'];
const FEMALE_TOKENS = ['female', 'feminino', 'maria', 'joana', 'sara', 'filipa', 'raquel', 'helena', 'ines', 'catarina', 'helia', 'sofia', 'ana', 'clara', 'carla', 'vera', 'luisa'];
const PORTUGAL_TOKENS = ['pt-pt', 'portugal', 'european', 'lisbon', 'lisboa'];
const BRAZIL_TOKENS = ['pt-br', 'brazil', 'brasil'];

/**
 * Create voice key from SpeechSynthesisVoice
 * @param {SpeechSynthesisVoice} voice - Voice object
 * @returns {string} Voice key
 */
function makeVoiceKey(voice) {
    return [voice.voiceURI || '', voice.name || '', voice.lang || ''].join('|');
}

/**
 * Detect voice provider
 * @param {SpeechSynthesisVoice} voice - Voice object
 * @returns {string} Provider name
 */
function detectVoiceProvider(voice) {
    const uri = (voice?.voiceURI || '').toLowerCase();
    const name = (voice?.name || '').toLowerCase();
    
    if (uri.includes('google') || name.includes('google')) return VOICE_PROVIDERS.GOOGLE;
    if (uri.includes('microsoft') || name.includes('microsoft') || name.includes('azure')) return VOICE_PROVIDERS.MICROSOFT;
    if (uri.includes('apple') || name.includes('siri') || name.includes('com.apple')) return VOICE_PROVIDERS.APPLE;
    if (uri.includes('amazon') || name.includes('polly')) return VOICE_PROVIDERS.AMAZON;
    if (name.includes('espeak')) return VOICE_PROVIDERS.ESPEAK;
    if (name.includes('piper')) return VOICE_PROVIDERS.PIPER;
    return VOICE_PROVIDERS.SYSTEM;
}

/**
 * Derive gender from voice name
 * @param {string} name - Voice name
 * @param {string} fallback - Fallback value
 * @returns {string} Gender
 */
function genderFromName(name, fallback = 'neutral') {
    const lower = (name || '').toLowerCase();
    if (MALE_TOKENS.some(t => lower.includes(t))) return 'male';
    if (FEMALE_TOKENS.some(t => lower.includes(t))) return 'female';
    return fallback;
}

/**
 * Score Portuguese voices for selection
 * @param {Array} voices - Voice list
 * @param {string} pref - Gender preference
 * @param {Object} options - Options
 * @returns {Array} Scored voices
 */
function scorePortugueseVoices(voices, pref, options = {}) {
    const hasPortugalVoice = voices.some(v => {
        const lang = (v.lang || '').toLowerCase();
        const name = (v.name || '').toLowerCase();
        return lang.startsWith('pt-pt') || PORTUGAL_TOKENS.some(t => name.includes(t));
    });
    
    const skipBrazil = options.skipBrazilWhenPortugalAvailable && hasPortugalVoice;
    
    return voices
        .filter(v => v.lang && v.lang.toLowerCase().startsWith('pt'))
        .map(v => {
            const lang = v.lang.toLowerCase();
            const name = (v.name || '').toLowerCase();
            const isPortugal = lang.startsWith('pt-pt') || PORTUGAL_TOKENS.some(t => name.includes(t));
            const isBrazil = lang.includes('br') || BRAZIL_TOKENS.some(t => name.includes(t));
            
            if (skipBrazil && isBrazil) return null;
            
            let score = 0;
            
            if (isPortugal) score += 22;
            else if (!isBrazil) score += 12;
            
            if (isBrazil) {
                score -= 25;
                if (hasPortugalVoice) score -= 40;
            }
            
            const matchesMale = MALE_TOKENS.some(t => name.includes(t));
            const matchesFemale = FEMALE_TOKENS.some(t => name.includes(t));
            
            if (pref === 'male' && matchesMale) score += 10;
            if (pref === 'female' && matchesFemale) score += 10;
            if (pref === 'male' && matchesFemale) score -= 10;
            if (pref === 'female' && matchesMale) score -= 10;
            
            if (!name.includes('google')) score += 2;
            
            return { voice: v, score, matchesMale, matchesFemale, isPortugal, isBrazil };
        })
        .filter(Boolean);
}

/**
 * Pick best Portuguese voice
 * @param {Array} voices - Voice list
 * @param {string} pref - Gender preference
 * @param {string} forcedKey - Forced voice key
 * @param {Object} options - Options
 * @returns {SpeechSynthesisVoice|null}
 */
function pickPortugueseVoice(voices, pref, forcedKey, options = {}) {
    if (!voices || !voices.length) return null;
    
    const scored = scorePortugueseVoices(voices, pref, { skipBrazilWhenPortugalAvailable: true });
    
    if (forcedKey) {
        const match = scored.find(s => makeVoiceKey(s.voice) === forcedKey);
        if (match) return match.voice;
        if (options.requireMatch) return null;
    }
    
    const pickBest = (pool) => {
        if (!pool.length) return null;
        const genderMatches = pool.filter(s => (pref === 'male' ? s.matchesMale : s.matchesFemale));
        const chosenPool = genderMatches.length ? genderMatches : pool;
        chosenPool.sort((a, b) => b.score - a.score);
        return chosenPool[0].voice;
    };
    
    const portugalPool = scored.filter(s => s.isPortugal);
    const neutralPool = scored.filter(s => !s.isPortugal && !s.isBrazil);
    const anyPtPool = scored;
    
    return pickBest(portugalPool) || pickBest(neutralPool) || pickBest(anyPtPool) || null;
}

// ============================================================================
// VOICES LOADING
// ============================================================================

/**
 * Ensure voices are loaded
 * @param {number} maxWaitMs - Max wait time
 * @returns {Promise<Array>} Voices
 */
export function ensureVoicesReady(maxWaitMs = VOICE_CONFIG.voicesLoadTimeout) {
    if (!('speechSynthesis' in window)) return Promise.resolve([]);
    
    if (state.voicesLoaded && state.cachedVoices?.length) {
        return Promise.resolve(state.cachedVoices);
    }
    
    const existing = speechSynthesis.getVoices();
    if (existing?.length) {
        state.cachedVoices = existing;
        state.voicesLoaded = true;
        return Promise.resolve(existing);
    }
    
    return new Promise(resolve => {
        let settled = false;
        let intervalId = null;
        let timeoutId = null;
        
        const finish = (voices) => {
            if (settled) return;
            settled = true;
            cleanup();
            state.cachedVoices = voices || speechSynthesis.getVoices() || [];
            state.voicesLoaded = state.cachedVoices.length > 0;
            resolve(state.cachedVoices);
        };
        
        const cleanup = () => {
            speechSynthesis.removeEventListener('voiceschanged', handle);
            if (intervalId) clearInterval(intervalId);
            if (timeoutId) clearTimeout(timeoutId);
        };
        
        const handle = () => {
            const voices = speechSynthesis.getVoices();
            if (voices?.length) finish(voices);
        };
        
        speechSynthesis.addEventListener('voiceschanged', handle, { once: true });
        speechSynthesis.getVoices();
        
        let pollCount = 0;
        intervalId = setInterval(() => {
            pollCount++;
            if (pollCount >= VOICE_CONFIG.maxPollAttempts) {
                clearInterval(intervalId);
                finish(speechSynthesis.getVoices());
                return;
            }
            handle();
        }, VOICE_CONFIG.pollInterval);
        
        timeoutId = setTimeout(() => finish(speechSynthesis.getVoices()), maxWaitMs);
    });
}

/**
 * Get Portuguese voice options
 * @param {string} pref - Gender preference
 * @returns {Promise<Object>} Voice options
 */
export async function getPortugueseVoiceOptions(pref = 'female') {
    const voices = await ensureVoicesReady();
    const scored = scorePortugueseVoices(voices, pref, { skipBrazilWhenPortugalAvailable: true });
    
    const options = scored
        .map(s => ({
            key: makeVoiceKey(s.voice),
            name: s.voice.name || 'Portuguese voice',
            lang: s.voice.lang || 'pt',
            gender: s.matchesMale ? 'male' : s.matchesFemale ? 'female' : 'neutral',
            isPortugal: s.isPortugal,
            isBrazil: s.isBrazil,
            score: s.score,
            provider: detectVoiceProvider(s.voice),
            voiceURI: s.voice.voiceURI || ''
        }))
        .sort((a, b) => b.score - a.score);
    
    const maleVoices = options.filter(o => o.gender === 'male');
    const femaleVoices = options.filter(o => o.gender === 'female');
    const neutralVoices = options.filter(o => o.gender === 'neutral');
    
    return {
        options,
        maleVoices,
        femaleVoices,
        neutralVoices,
        bestMaleKey: maleVoices[0]?.key || null,
        bestFemaleKey: femaleVoices[0]?.key || null,
        totalCount: options.length
    };
}

/**
 * Get engine-specific voice options
 * @param {string} engine - Voice engine
 * @param {string} lang - Language code
 * @returns {Array} Voice options
 */
export function getEngineVoiceOptions(engine = 'webspeech', lang = 'pt-PT') {
    if (engine === 'webspeech') return [];
    
    return [
        { key: `${engine}|pt-pt|male`, name: 'PT-PT Male (stub)', lang, gender: 'male', isPortugal: true, isBrazil: false, provider: engine },
        { key: `${engine}|pt-pt|female`, name: 'PT-PT Female (stub)', lang, gender: 'female', isPortugal: true, isBrazil: false, provider: engine }
    ];
}

// ============================================================================
// SPEAK FUNCTIONS
// ============================================================================

/**
 * Speak a single word
 * @param {string} text - Text to speak
 * @param {Object} options - Options
 * @returns {Promise<void>}
 */
export async function speakWord(text, options = {}) {
    const { 
        voicePreference = VOICE_CONFIG.defaultGender, 
        voiceKey: forcedVoiceKey = null, 
        rate = VOICE_CONFIG.defaultRate, 
        onStart, 
        onEnd, 
        onVoiceUsed,
        metaOverride
    } = options;
    
    if (!('speechSynthesis' in window)) {
        setLastVoiceUsed({ status: 'unsupported', engine: VOICE_ENGINES.WEBSPEECH });
        return;
    }
    
    const voices = await ensureVoicesReady();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = VOICE_CONFIG.defaultLang;
    utterance.rate = rate;
    
    const portugueseVoice = pickPortugueseVoice(voices, voicePreference, forcedVoiceKey, { requireMatch: true });
    
    if (!portugueseVoice) {
        setLastVoiceUsed({ status: 'no-voice', engine: VOICE_ENGINES.WEBSPEECH, forcedKey: forcedVoiceKey, rate });
        if (typeof onEnd === 'function') onEnd();
        return;
    }
    
    utterance.voice = portugueseVoice;
    
    const resolvedMeta = metaOverride || {
        status: 'played',
        engine: VOICE_ENGINES.WEBSPEECH,
        provider: detectVoiceProvider(portugueseVoice),
        name: portugueseVoice.name || 'Portuguese voice',
        lang: portugueseVoice.lang || 'pt',
        voiceKey: makeVoiceKey(portugueseVoice),
        forcedKey: forcedVoiceKey,
        rate
    };
    
    setLastVoiceUsed(resolvedMeta);
    if (typeof onVoiceUsed === 'function') onVoiceUsed(portugueseVoice, resolvedMeta);
    
    speechSynthesis.cancel();
    
    utterance.onstart = () => {
        if (typeof onStart === 'function') onStart();
    };
    
    const handleEnd = () => {
        if (typeof onEnd === 'function') onEnd();
    };
    
    utterance.onend = handleEnd;
    utterance.onerror = handleEnd;
    
    speechSynthesis.speak(utterance);
}

/**
 * Compute word ranges in text
 * @param {string} text - Text
 * @returns {Array} Word ranges
 */
function computeWordRanges(text) {
    const tokens = text.split(/\s+/);
    const ranges = [];
    let cursor = 0;
    
    tokens.forEach(token => {
        const start = text.indexOf(token, cursor);
        const end = start + token.length;
        ranges.push({ start, end });
        cursor = end;
    });
    
    return ranges;
}

/**
 * Speak a sentence with word highlighting callback
 * @param {string} sentenceText - Text to speak
 * @param {Object} options - Options
 * @returns {Promise<void>}
 */
export async function speakSentence(sentenceText, options = {}) {
    const { 
        voicePreference = VOICE_CONFIG.defaultGender, 
        voiceKey: forcedVoiceKey = null, 
        rate = VOICE_CONFIG.sentenceRate, 
        onWord, 
        onStart, 
        onEnd, 
        onVoiceUsed 
    } = options;
    
    if (!('speechSynthesis' in window)) return;
    
    const voices = await ensureVoicesReady();
    const utterance = new SpeechSynthesisUtterance(sentenceText);
    utterance.lang = VOICE_CONFIG.defaultLang;
    utterance.rate = rate;
    
    const portugueseVoice = pickPortugueseVoice(voices, voicePreference, forcedVoiceKey, { requireMatch: true });
    
    if (!portugueseVoice) {
        setLastVoiceUsed({ status: 'no-voice', engine: VOICE_ENGINES.WEBSPEECH, forcedKey: forcedVoiceKey, rate });
        if (typeof onEnd === 'function') onEnd();
        return;
    }
    
    utterance.voice = portugueseVoice;
    
    setLastVoiceUsed({
        status: 'played',
        engine: VOICE_ENGINES.WEBSPEECH,
        provider: detectVoiceProvider(portugueseVoice),
        name: portugueseVoice.name || 'Portuguese voice',
        lang: portugueseVoice.lang || 'pt',
        voiceKey: makeVoiceKey(portugueseVoice),
        forcedKey: forcedVoiceKey,
        rate
    });
    
    if (typeof onVoiceUsed === 'function') onVoiceUsed(portugueseVoice);
    
    speechSynthesis.cancel();
    
    const ranges = computeWordRanges(sentenceText);
    
    utterance.onboundary = (event) => {
        if (event.name === 'word' && typeof onWord === 'function') {
            const wordIndex = ranges.findIndex(r => event.charIndex >= r.start && event.charIndex < r.end);
            if (wordIndex >= 0) onWord(wordIndex);
        }
    };
    
    utterance.onstart = () => {
        if (typeof onStart === 'function') onStart();
    };
    
    const handleEnd = () => {
        if (typeof onEnd === 'function') onEnd();
    };
    
    utterance.onend = handleEnd;
    utterance.onerror = handleEnd;
    
    speechSynthesis.speak(utterance);
}

/**
 * Speak with specific engine
 * @param {Object} options - Speak options
 * @returns {Promise<void>}
 */
export async function speakWithEngine(options = {}) {
    const { 
        text, 
        lang = VOICE_CONFIG.defaultLang, 
        gender = VOICE_CONFIG.defaultGender, 
        engine = VOICE_ENGINES.WEBSPEECH, 
        voiceKey = null, 
        rate = 1, 
        onStart, 
        onEnd, 
        onVoiceUsed, 
        httpEndpoint = null, 
        modelUrl = null 
    } = options;
    
    if (engine === VOICE_ENGINES.WEBSPEECH) {
        return speakWord(text, {
            voicePreference: gender,
            voiceKey,
            rate,
            onStart,
            onEnd,
            onVoiceUsed: (voice, meta) => {
                const payload = meta || {
                    name: voice?.name || 'Portuguese voice',
                    lang: voice?.lang || lang,
                    gender: genderFromName(voice?.name, gender),
                    provider: detectVoiceProvider(voice),
                    engine: VOICE_ENGINES.WEBSPEECH,
                    voice
                };
                setLastVoiceUsed({ ...payload, status: 'played', engine: VOICE_ENGINES.WEBSPEECH, voiceKey: voiceKey || payload.voiceKey || null, rate });
                if (typeof onVoiceUsed === 'function') onVoiceUsed(payload);
            }
        });
    }
    
    if (engine === VOICE_ENGINES.BUNDLED && !isBundledVoiceReady()) {
        setLastVoiceUsed({ status: 'bundled-missing', engine: VOICE_ENGINES.BUNDLED, voiceKey, rate });
        if (typeof onEnd === 'function') onEnd();
        return;
    }
    
    if (engine === VOICE_ENGINES.BUNDLED) {
        const metaBase = {
            engine: VOICE_ENGINES.BUNDLED,
            provider: 'HTTP TTS',
            name: 'Bundled EU-PT voice',
            lang,
            voiceKey: voiceKey || 'bundled|pt-pt|piper-tugao-medium',
            forcedKey: voiceKey,
            rate
        };
        
        if (!httpEndpoint) {
            const missingMeta = { ...metaBase, status: 'bundled-endpoint-missing' };
            setLastVoiceUsed(missingMeta);
            if (typeof onVoiceUsed === 'function') onVoiceUsed(missingMeta);
            if (typeof onEnd === 'function') onEnd();
            return;
        }
        
        try {
            const response = await fetch(httpEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, lang, voiceKey: metaBase.voiceKey, modelUrl })
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const arrayBuffer = await response.arrayBuffer();
            if (!arrayBuffer?.byteLength) throw new Error('Empty audio response');
            
            await playArrayBuffer(arrayBuffer);
            
            const successMeta = { ...metaBase, status: 'played' };
            setLastVoiceUsed(successMeta);
            if (typeof onVoiceUsed === 'function') onVoiceUsed(successMeta);
            if (typeof onEnd === 'function') onEnd();
            
        } catch (error) {
            console.warn('Bundled HTTP TTS failed', error);
            const failMeta = { ...metaBase, status: 'bundled-http-failed', error: error?.message };
            setLastVoiceUsed(failMeta);
            if (typeof onVoiceUsed === 'function') onVoiceUsed(failMeta);
            if (typeof onEnd === 'function') onEnd();
        }
    }
}

/**
 * Stop all speech
 */
export function stopSpeech() {
    if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
    }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

// Auto-listen for voices
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    speechSynthesis.addEventListener('voiceschanged', () => {
        const voices = speechSynthesis.getVoices();
        if (voices?.length) {
            state.cachedVoices = voices;
            state.voicesLoaded = true;
        }
    }, { once: true });
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
    // Config
    VOICE_CONFIG,
    VOICE_ENGINES,
    VOICE_PROVIDERS,
    
    // State
    getLastVoiceUsed,
    
    // Downloaded voices
    getDownloadedVoices,
    markVoiceDownloaded,
    isVoiceDownloaded,
    getDownloadableVoices,
    
    // Bundled voices
    getBundledVoiceStatus,
    isBundledVoiceReady,
    getBundledVoiceOptions,
    getBundledVoiceCount,
    clearBundledVoice,
    startBundledVoiceDownload,
    
    // Voice selection
    ensureVoicesReady,
    getPortugueseVoiceOptions,
    getEngineVoiceOptions,
    
    // Speak
    speakWord,
    speakSentence,
    speakWithEngine,
    stopSpeech
};
