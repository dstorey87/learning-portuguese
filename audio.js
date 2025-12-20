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

export function getLastVoiceUsed() {
  return lastVoiceUsed;
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

export async function speakWithEngine({ text, lang = 'pt-PT', gender = 'female', engine = 'webspeech', voiceKey = null, rate = 1, onStart, onEnd, onVoiceUsed }) {
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

  // Temporary stub for bundled/alt engines: play via Web Speech but log the intended engine
  const metaOverride = {
    status: 'played',
    engine,
    provider: engine,
    name: `${engine} EU-PT voice`,
    lang,
    voiceKey: voiceKey || `${engine}|pt-pt|default`,
    forcedKey: voiceKey,
    rate
  };
  setLastVoiceUsed(metaOverride);
  if (typeof onVoiceUsed === 'function') onVoiceUsed(metaOverride);
  return speakWord(text, {
    voicePreference: gender,
    voiceKey: null,
    rate,
    onStart,
    onEnd,
    metaOverride
  });
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
      provider: (s.voice.voiceURI || '').toLowerCase().includes('google') ? 'Google' : 'System'
    }))
    .sort((a, b) => b.score - a.score);

  const bestMale = options.find(o => o.gender === 'male') || null;
  const bestFemale = options.find(o => o.gender === 'female') || null;
  return {
    options,
    bestMaleKey: bestMale?.key || null,
    bestFemaleKey: bestFemale?.key || null
  };
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

// Ensure voices list is available; poll for slower browsers before giving up
function ensureVoicesReady(maxWaitMs = 8000) {
  if (!('speechSynthesis' in window)) return Promise.resolve([]);

  const existing = speechSynthesis.getVoices();
  if (existing && existing.length) return Promise.resolve(existing);

  return new Promise(resolve => {
    let settled = false;
    const finish = (voices) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(voices || speechSynthesis.getVoices() || []);
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

    speechSynthesis.addEventListener('voiceschanged', handle);
    // Kick off loading; some browsers need a call to populate
    speechSynthesis.getVoices();

    const intervalId = setInterval(handle, 200);
    const timeoutId = setTimeout(() => finish(speechSynthesis.getVoices()), maxWaitMs);
  });
}

speechSynthesis.addEventListener('voiceschanged', () => {
  // preload voices
  speechSynthesis.getVoices();
});
