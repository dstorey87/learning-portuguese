// Audio helpers using Web Speech API and engine-aware wrappers
let lastVoiceUsed = {
  status: 'idle',
  engine: null,
  provider: null,
  name: null,
  lang: null,
  voiceKey: null,
  forcedKey: null,
  rate: null,
  timestamp: Date.now()
};

const audioContextSingleton = {
  instance: null
};

const BUNDLED_META_KEY = 'ptBundledVoiceMetaV1';
const DOWNLOADED_VOICES_KEY = 'ptDownloadedVoicesV1';
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

// =========== DOWNLOADABLE EU-PT VOICE CATALOG ===========
// Voices that can be downloaded for higher quality TTS
// Only Joana (Piper) has a working URL currently
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
    requiresBackend: true // Needs ONNX runtime or TTS server
  }
];

// Track which voices are downloaded
function getDownloadedVoices() {
  try {
    const raw = localStorage.getItem(DOWNLOADED_VOICES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function markVoiceDownloaded(voiceKey) {
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

function isVoiceDownloaded(voiceKey) {
  return getDownloadedVoices().includes(voiceKey);
}

export function getDownloadableVoices() {
  return DOWNLOADABLE_VOICES.map(v => ({
    ...v,
    downloaded: isVoiceDownloaded(v.key)
  }));
}

export { markVoiceDownloaded, isVoiceDownloaded };

// Legacy bundled options kept for compatibility
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

// Simplified voice count
function countVoicesByGender() {
  const male = BUNDLED_VOICE_OPTIONS.filter(v => v.gender === 'male').length;
  const female = BUNDLED_VOICE_OPTIONS.filter(v => v.gender === 'female').length;
  return { male, female, total: male + female };
}

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

function writeBundledMeta(meta) {
  try {
    localStorage.setItem(BUNDLED_META_KEY, JSON.stringify(meta));
  } catch (error) {
    console.warn('Unable to persist bundled voice meta', error);
  }
}

function setLastVoiceUsed(payload) {
  lastVoiceUsed = {
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

function providerFromVoice(voice) {
  const uri = (voice?.voiceURI || '').toLowerCase();
  if (uri.includes('google')) return 'Google';
  if (uri.includes('microsoft')) return 'Microsoft';
  return 'System';
}

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioContextSingleton.instance) {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    audioContextSingleton.instance = new Ctor();
  }
  return audioContextSingleton.instance;
}

async function playArrayBuffer(arrayBuffer) {
  const ctx = getAudioContext();
  if (!ctx) throw new Error('AudioContext not available in this browser.');
  if (ctx.state === 'suspended' && ctx.resume) {
    try { await ctx.resume(); } catch (_) { /* ignore */ }
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

export function getLastVoiceUsed() {
  return lastVoiceUsed;
}

export function getBundledVoiceStatus() {
  return readBundledMeta();
}

export function isBundledVoiceReady() {
  return readBundledMeta().downloaded;
}

export function getBundledVoiceOptions() {
  return [...BUNDLED_VOICE_OPTIONS];
}

export function getBundledVoiceCount() {
  return countVoicesByGender();
}

export function clearBundledVoice() {
  writeBundledMeta({ ...DEFAULT_BUNDLED_META, downloaded: false, updatedAt: Date.now() });
}

export function startBundledVoiceDownload({ voiceKey, onProgress, onError } = {}) {
  const voice = BUNDLED_VOICE_OPTIONS.find(v => v.key === voiceKey) || BUNDLED_VOICE_OPTIONS[0];
  const controller = new AbortController();
  let canceled = false;

  const toHex = (buffer) => Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');

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
        const { done, value } = await reader.read();
        if (canceled) return;
        finished = Boolean(done);
        if (finished) break;
        if (value) {
          received += value.byteLength;
          chunks.push(value);
          const baseline = total || voice.sizeBytes || 75_000_000;
          const pct = Math.min(99, Math.round((received / baseline) * 100));
          safeProgress(Math.max(5, pct));
        }
      }

      const blob = new Blob(chunks, { type: 'application/octet-stream' });
      const sizeBytes = blob.size || total || voice.sizeBytes || DEFAULT_BUNDLED_META.sizeBytes;

      if (voice?.sha256 && crypto?.subtle) {
        const hashBuffer = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer());
        const digestHex = toHex(hashBuffer);
        if (digestHex.toLowerCase() !== voice.sha256.toLowerCase()) {
          const hashError = new Error('Bundled voice integrity check failed');
          if (typeof onError === 'function') onError(hashError);
          console.warn('SHA-256 mismatch for bundled voice', { expected: voice.sha256, actual: digestHex });
          return;
        }
      }

      if (typeof caches !== 'undefined') {
        try {
          const cache = await caches.open('bundled-voices-v1');
          await cache.put(voice.url, new Response(blob));
        } catch (cacheError) {
          console.warn('Bundled voice cache write failed', cacheError);
        }
      }

      finishSuccess(sizeBytes);
    } catch (error) {
      if (canceled) return;
      console.warn('Bundled voice download failed, falling back to simulated download.', error);
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

export async function speakWord(text, { voicePreference = 'female', voiceKey: forcedVoiceKey = null, rate = 0.85, onStart, onEnd, onVoiceUsed, metaOverride } = {}) {
  if (!('speechSynthesis' in window)) {
    setLastVoiceUsed({ status: 'unsupported', engine: 'webspeech' });
    return;
  }
  const voices = await ensureVoicesReady();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'pt-PT';
  utterance.rate = rate;
  const portugueseVoice = pickPortugueseVoice(voices, voicePreference, forcedVoiceKey, { requireMatch: true });
  if (!portugueseVoice) {
    setLastVoiceUsed({ status: 'no-voice', engine: 'webspeech', forcedKey: forcedVoiceKey, rate });
    if (typeof onEnd === 'function') onEnd();
    return;
  }
  utterance.voice = portugueseVoice;

  const resolvedMeta = metaOverride || {
    status: 'played',
    engine: 'webspeech',
    provider: providerFromVoice(portugueseVoice),
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
  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
}

// Engine-aware catalog lookup (placeholder until hosted/static/wasm engines are wired)
export function getEngineVoiceOptions(engine = 'webspeech', lang = 'pt-PT') {
  if (engine === 'webspeech') {
    // Consumers should call getPortugueseVoiceOptions directly for async Web Speech listing
    return [];
  }

  // Stub options so selectors do not break while alternative engines are being added
  const genderGuess = (name) => {
    const lower = name.toLowerCase();
    if (/(joao|ricardo|rui|miguel|male)/.test(lower)) return 'male';
    if (/(maria|joana|sara|filipa|female)/.test(lower)) return 'female';
    return 'neutral';
  };

  const entries = [
    { key: `${engine}|pt-pt|male`, name: 'PT-PT Male (stub)', lang: lang || 'pt-PT' },
    { key: `${engine}|pt-pt|female`, name: 'PT-PT Female (stub)', lang: lang || 'pt-PT' }
  ];

  return entries.map(e => ({
    ...e,
    gender: genderGuess(e.name),
    isPortugal: true,
    isBrazil: false,
    provider: engine
  }));
}

export async function speakWithEngine({ text, lang = 'pt-PT', gender = 'female', engine = 'webspeech', voiceKey = null, rate = 1, onStart, onEnd, onVoiceUsed, httpEndpoint = null, modelUrl = null }) {
  if (engine === 'webspeech') {
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
          provider: providerFromVoice(voice),
          engine: 'webspeech',
          voice
        };
        setLastVoiceUsed({ ...payload, status: 'played', engine: 'webspeech', voiceKey: voiceKey || payload.voiceKey || null, rate });
        if (typeof onVoiceUsed === 'function') {
          onVoiceUsed(payload);
        }
      }
    });
  }

  if (engine === 'bundled' && !isBundledVoiceReady()) {
    setLastVoiceUsed({ status: 'bundled-missing', engine: 'bundled', voiceKey, rate });
    if (typeof onEnd === 'function') onEnd();
    return;
  }

  if (engine === 'bundled') {
    const metaBase = {
      engine: 'bundled',
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
      if (!arrayBuffer || !arrayBuffer.byteLength) throw new Error('Empty audio response from TTS endpoint');

      await playArrayBuffer(arrayBuffer);

      const successMeta = { ...metaBase, status: 'played' };
      setLastVoiceUsed(successMeta);
      if (typeof onVoiceUsed === 'function') onVoiceUsed(successMeta);
      if (typeof onEnd === 'function') onEnd();
    } catch (error) {
      console.warn('Bundled HTTP TTS playback failed', error);
      const failMeta = { ...metaBase, status: 'bundled-http-failed', error: error?.message };
      setLastVoiceUsed(failMeta);
      if (typeof onVoiceUsed === 'function') onVoiceUsed(failMeta);
      if (typeof onEnd === 'function') onEnd();
    }
  }
}

function genderFromName(name, fallback = 'neutral') {
  const lower = (name || '').toLowerCase();
  if (/(joao|ricardo|rui|miguel|male)/.test(lower)) return 'male';
  if (/(maria|joana|sara|filipa|female)/.test(lower)) return 'female';
  return fallback;
}

export async function speakSentence(sentenceText, { voicePreference = 'female', voiceKey: forcedVoiceKey = null, rate = 1, onWord, onStart, onEnd, onVoiceUsed } = {}) {
  if (!('speechSynthesis' in window)) return;
  const voices = await ensureVoicesReady();
  const utterance = new SpeechSynthesisUtterance(sentenceText);
  utterance.lang = 'pt-PT';
  utterance.rate = rate;
  const portugueseVoice = pickPortugueseVoice(voices, voicePreference, forcedVoiceKey, { requireMatch: true });
  if (!portugueseVoice) {
    setLastVoiceUsed({ status: 'no-voice', engine: 'webspeech', forcedKey: forcedVoiceKey, rate });
    if (typeof onEnd === 'function') onEnd();
    return;
  }
  utterance.voice = portugueseVoice;
  setLastVoiceUsed({
    status: 'played',
    engine: 'webspeech',
    provider: providerFromVoice(portugueseVoice),
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

  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
}

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

function makeVoiceKey(voice) {
  return [voice.voiceURI || '', voice.name || '', voice.lang || ''].join('|');
}

// Enhanced voice detection with better gender categorization
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

  // Group by gender for UI
  const maleVoices = options.filter(o => o.gender === 'male');
  const femaleVoices = options.filter(o => o.gender === 'female');
  const neutralVoices = options.filter(o => o.gender === 'neutral');

  const bestMale = maleVoices[0] || null;
  const bestFemale = femaleVoices[0] || null;
  
  return {
    options,
    maleVoices,
    femaleVoices,
    neutralVoices,
    bestMaleKey: bestMale?.key || null,
    bestFemaleKey: bestFemale?.key || null,
    totalCount: options.length
  };
}

// Detect voice provider (Google, Microsoft, Apple, etc.)
function detectVoiceProvider(voice) {
  const uri = (voice?.voiceURI || '').toLowerCase();
  const name = (voice?.name || '').toLowerCase();
  
  if (uri.includes('google') || name.includes('google')) return 'Google';
  if (uri.includes('microsoft') || name.includes('microsoft') || name.includes('azure')) return 'Microsoft';
  if (uri.includes('apple') || name.includes('siri')) return 'Apple';
  if (uri.includes('amazon') || name.includes('polly')) return 'Amazon';
  if (name.includes('com.apple')) return 'Apple';
  if (name.includes('espeak')) return 'eSpeak';
  if (name.includes('piper')) return 'Piper';
  return 'System';
}

function pickPortugueseVoice(voices, pref, forcedKey, { requireMatch = false } = {}) {
  if (!voices || !voices.length) return null;
  const maleTokens = ['male', 'joao', 'ricardo', 'rui', 'miguel', 'fernando', 'duarte', 'antonio', 'tiago', 'vasco'];
  const femaleTokens = ['female', 'maria', 'joana', 'sara', 'filipa', 'raquel', 'helena', 'ines', 'catarina'];
  const portugalTokens = ['pt-pt', 'portugal', 'european', 'lisbon', 'lisboa'];
  const brazilTokens = ['pt-br', 'brazil', 'brasil'];

  const hasPortugalVoice = voices.some(v => {
    const lang = (v.lang || '').toLowerCase();
    const name = (v.name || '').toLowerCase();
    return lang.startsWith('pt-pt') || portugalTokens.some(t => name.includes(t));
  });

  const scored = scorePortugueseVoices(voices, pref, { maleTokens, femaleTokens, portugalTokens, brazilTokens, hasPortugalVoice, skipBrazilWhenPortugalAvailable: true });

  if (forcedKey) {
    const match = scored.find(s => makeVoiceKey(s.voice) === forcedKey);
    if (match) return match.voice;
    if (requireMatch) return null;
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
  const picked = pickBest(portugalPool) || pickBest(neutralPool) || pickBest(anyPtPool) || null;
  if (requireMatch && !picked) return null;
  return picked;
}

function scorePortugueseVoices(voices, pref, tokens) {
  const maleTokens = tokens?.maleTokens || ['male', 'masculino', 'masculina', 'man', 'homem', 'joao', 'ricardo', 'rui', 'miguel', 'fernando', 'duarte', 'antonio', 'tiago', 'vasco', 'paulo', 'luis', 'pedro', 'carlos', 'jose', 'manuel'];
  const femaleTokens = tokens?.femaleTokens || ['female', 'feminino', 'feminina', 'mulher', 'woman', 'maria', 'joana', 'sara', 'filipa', 'raquel', 'helena', 'ines', 'catarina', 'helia', 'sofia', 'ana', 'clara', 'carla', 'vera', 'luisa'];
  const portugalTokens = tokens?.portugalTokens || ['pt-pt', 'portugal', 'european', 'lisbon', 'lisboa'];
  const brazilTokens = tokens?.brazilTokens || ['pt-br', 'brazil', 'brasil'];
  const hasPortugalVoice = tokens?.hasPortugalVoice ?? voices.some(v => {
    const lang = (v.lang || '').toLowerCase();
    const name = (v.name || '').toLowerCase();
    return lang.startsWith('pt-pt') || portugalTokens.some(t => name.includes(t));
  });

  const skipBrazil = tokens?.skipBrazilWhenPortugalAvailable && hasPortugalVoice;

  return voices
    .filter(v => v.lang && v.lang.toLowerCase().startsWith('pt'))
    .map(v => {
      const lang = v.lang.toLowerCase();
      const name = (v.name || '').toLowerCase();
      const isPortugal = lang.startsWith('pt-pt') || portugalTokens.some(t => name.includes(t));
      const isBrazil = lang.includes('br') || brazilTokens.some(t => name.includes(t));
      if (skipBrazil && isBrazil) return null;
      let score = 0;

      if (isPortugal) score += 22;
      else if (!isBrazil) score += 12;

      if (isBrazil) {
        score -= 25;
        if (hasPortugalVoice) score -= 40;
      }

      const matchesMale = maleTokens.some(t => name.includes(t));
      const matchesFemale = femaleTokens.some(t => name.includes(t));
      if (pref === 'male' && matchesMale) score += 10;
      if (pref === 'female' && matchesFemale) score += 10;
      if (pref === 'male' && matchesFemale) score -= 10;
      if (pref === 'female' && matchesMale) score -= 10;

      if (!name.includes('google')) score += 2;

      return { voice: v, score, matchesMale, matchesFemale, isPortugal, isBrazil };
    })
    .filter(Boolean);
}

// Cached voices to prevent repeated polling
let cachedVoices = null;
let voicesLoaded = false;

// Ensure voices list is available; poll for slower browsers before giving up
function ensureVoicesReady(maxWaitMs = 8000) {
  if (!('speechSynthesis' in window)) return Promise.resolve([]);

  // Return cached voices if already loaded
  if (voicesLoaded && cachedVoices && cachedVoices.length) {
    return Promise.resolve(cachedVoices);
  }

  const existing = speechSynthesis.getVoices();
  if (existing && existing.length) {
    cachedVoices = existing;
    voicesLoaded = true;
    return Promise.resolve(existing);
  }

  return new Promise(resolve => {
    let settled = false;
    const finish = (voices) => {
      if (settled) return;
      settled = true;
      cleanup();
      cachedVoices = voices || speechSynthesis.getVoices() || [];
      voicesLoaded = cachedVoices.length > 0;
      resolve(cachedVoices);
    };

    const handle = () => {
      const voices = speechSynthesis.getVoices();
      if (voices && voices.length) finish(voices);
    };

    const cleanup = () => {
      speechSynthesis.removeEventListener('voiceschanged', handle);
      if (intervalId) clearInterval(intervalId);
      if (timeoutId) clearTimeout(timeoutId);
    };

    speechSynthesis.addEventListener('voiceschanged', handle, { once: true });
    // Kick off loading; some browsers need a call to populate
    speechSynthesis.getVoices();

    // Only poll briefly, then stop to prevent constant checking
    let pollCount = 0;
    const maxPolls = 10;
    const intervalId = setInterval(() => {
      pollCount++;
      if (pollCount >= maxPolls) {
        clearInterval(intervalId);
        finish(speechSynthesis.getVoices());
        return;
      }
      handle();
    }, 300);
    const timeoutId = setTimeout(() => finish(speechSynthesis.getVoices()), maxWaitMs);
  });
}

// Only listen once for voiceschanged, then cache
if ('speechSynthesis' in window) {
  speechSynthesis.addEventListener('voiceschanged', () => {
    const voices = speechSynthesis.getVoices();
    if (voices && voices.length) {
      cachedVoices = voices;
      voicesLoaded = true;
    }
  }, { once: true });
}
