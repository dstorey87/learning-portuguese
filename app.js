import { topics, getAllLessonsFlat } from './data.js';
import {
    speakWithEngine,
    getPortugueseVoiceOptions,
    getLastVoiceUsed,
    getBundledVoiceStatus,
    getBundledVoiceOptions,
    startBundledVoiceDownload,
    clearBundledVoice
} from './audio.js';

const APP_VERSION = '0.4.0';
const STORAGE_KEY = 'portugueseLearningData';
const VOICE_STORAGE_KEY = 'portugueseVoiceSettings';
const THEME_STORAGE_KEY = 'portugueseTheme';
const DEMO_PHRASE = 'Olá! Vamos praticar português europeu: pão, coração, obrigado, vinte e oito.';
const lessonImages = {
    1: 'https://images.unsplash.com/photo-1527863280610-12192d6dc2e7?auto=format&fit=crop&w=1200&q=80',  // Essential Greetings - handshake
    9: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80',  // Polite Starts - thank you hands
    10: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80', // Numbers - counting blocks
    11: 'https://images.unsplash.com/photo-1432107294469-414527cb5c65?auto=format&fit=crop&w=1200&q=80', // Cafe Survival - coffee cup
    12: 'https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=1200&q=80', // Getting Around - Lisbon street
    13: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&q=80', // Rapid Replies - conversation
    14: 'https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=1200&q=80', // Mini Dialogues - cafe chat
    15: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=1200&q=80', // Travel Phrases - suitcase
    16: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&q=80', // Restaurant - dining table
    2: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80',  // At the Airport - airplane
    3: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=1200&q=80',  // Getting Around - metro
    4: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80',  // Ordering Coffee - espresso
    5: 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80',  // Rotina - morning routine
    6: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&w=1200&q=80',  // Shopping - market
    7: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',  // Office - workspace
    8: 'https://images.unsplash.com/photo-1507537509458-b8312d35a233?auto=format&fit=crop&w=1200&q=80'   // Career - interview
};
const speechState = {
    initialized: false,
    supported: false,
    reason: 'Not initialized',
    listening: false,
    recognizer: null
};

function formatBytes(bytes) {
    if (!bytes || Number.isNaN(bytes)) return '';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unit = 0;
    while (size >= 1024 && unit < units.length - 1) {
        size /= 1024;
        unit += 1;
    }
    return `${Math.round(size * 10) / 10} ${units[unit]}`;
}

function normalizeText(value) {
    return (value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function scoreSpeechTranscript(transcript, target) {
    const tWords = normalizeText(transcript).split(' ').filter(Boolean);
    const targetWords = normalizeText(target).split(' ').filter(Boolean);
    if (!tWords.length || !targetWords.length) return 0;
    const matches = targetWords.filter(word => tWords.includes(word)).length;
    return Math.round((matches / targetWords.length) * 100);
}

function ensureSpeechRecognition() {
    if (speechState.initialized) return speechState.supported;
    const SpeechRecognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SpeechRecognition) {
        speechState.initialized = true;
        speechState.supported = false;
        speechState.reason = 'Speech recognition not supported in this browser.';
        return false;
    }
    try {
        const recognizer = new SpeechRecognition();
        recognizer.lang = 'pt-PT';
        recognizer.continuous = false;
        recognizer.interimResults = false;
        speechState.recognizer = recognizer;
        speechState.supported = true;
        speechState.reason = 'Ready';
    } catch (error) {
        speechState.supported = false;
        speechState.reason = error?.message || 'Speech recognition unavailable.';
    }
    speechState.initialized = true;
    return speechState.supported;
}

const userData = {
    learnedWords: [],
    streak: 0,
    isPremium: false,
    speakerGender: 'male',
    lessonsCompleted: 0,
    activeLesson: null,
    mistakes: [],
    successes: [],
    lessonDurations: [],
    lessonAccuracy: [],
    lessonAttempts: [],
    lessonCorrect: [],
    lastLessonId: null,
    lastStudyDate: null
};

const uiState = {
    selectedTopic: 'all',
    lessonStartMs: null,
    skillStats: [],
    theme: 'light'
};

const vaultFilters = {
    query: '',
    sort: 'pt'
};

// SM-2 Spaced Repetition Algorithm constants
const SRS_INTERVALS = {
    1: 1,        // 1 day
    2: 3,        // 3 days
    3: 7,        // 1 week
    4: 14,       // 2 weeks
    5: 30        // 1 month
};

// Mnemonic memory aids for difficult words
const MNEMONICS = {
    'pão': { tip: '🍞 Sounds like "pow!" - bread gives you power!', phonetic: 'POWNG (nasal)' },
    'mãe': { tip: '👩 "Mine" - my mother is mine', phonetic: 'MING (nasal)' },
    'não': { tip: '🚫 "Now!" but with nasal - say NO now!', phonetic: 'NOWNG (nasal)' },
    'obrigado': { tip: '🙏 "Oh breeGAdoh" - Oh I\'m glad to thank you', phonetic: 'oh-bree-GAH-doo' },
    'obrigada': { tip: '🙏 "Oh breeGAdah" - Female form ends in A', phonetic: 'oh-bree-GAH-dah' },
    'sim': { tip: '✓ "Seem" - seems like yes!', phonetic: 'SEENG (nasal)' },
    'bom': { tip: '👍 "Bong" - good vibes like a bong', phonetic: 'BONG (nasal)' },
    'boa': { tip: '👌 "BOah" -boa constrictor is good at hugging', phonetic: 'BOH-ah' },
    'dia': { tip: '☀️ "DEE-ah" - day starts with D', phonetic: 'DEE-ah' },
    'noite': { tip: '🌙 "NOYt" - night, no light', phonetic: 'NOY-tuh' },
    'água': { tip: '💧 "AH-gwah" - agua = water, remember aquarium', phonetic: 'AH-gwah' },
    'por favor': { tip: '🙏 "Poor fah-VOOR" - please do me a favor', phonetic: 'poor fah-VOOR' },
    'desculpe': { tip: '😬 "desh-KOOL-puh" - excuse me, don\'t be cruel', phonetic: 'desh-KOOL-puh' },
    'coração': { tip: '❤️ "koo-rah-SOWNG" - heart with strong nasal ending', phonetic: 'koo-rah-SOWNG' },
    'estou': { tip: '📍 "shTOH" - I AM (temporary state)', phonetic: 'shTOH' },
    'sou': { tip: '🧑 "SOH" - I AM (permanent identity)', phonetic: 'SOH' }
};

const voiceDefaults = {
    selectedSource: 'auto',
    selectedVoiceKey: null,
    allowBundled: true,
    bundledVoiceKey: null,
    bundledApiUrl: '',
    bundled: { downloaded: false, downloading: false, progress: 0, sizeBytes: null, provider: null, url: null, voiceKey: null },
    detectedSystemOptions: []
};

const voiceState = structuredClone(voiceDefaults);
let bundledDownloadJob = null;

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    loadUserData();
    renderVersion();
    renderTopicFilters();
    renderLessons();
    hookSpeakerRadios();
    setupEventListeners();
    setupNavigation();
    setupVoiceSettings();
    renderCoachPanel();
    updatePlanAccess();
    updateDashboard();
});

function initTheme() {
    let saved = null;
    try {
        saved = localStorage.getItem(THEME_STORAGE_KEY);
    } catch (error) {
        console.warn('Unable to read theme preference', error);
    }

    const prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial = saved || (prefersDark ? 'dark' : 'light');
    applyTheme(initial);

    if (typeof window !== 'undefined' && window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            let stored = null;
            try {
                stored = localStorage.getItem(THEME_STORAGE_KEY);
            } catch (error) {
                console.warn('Unable to read stored theme during media change', error);
            }
            if (stored) return;
            applyTheme(e.matches ? 'dark' : 'light');
        });
    }
}

function applyTheme(mode) {
    const next = mode === 'dark' ? 'dark' : 'light';
    uiState.theme = next;
    document.body.classList.toggle('dark-theme', next === 'dark');
    const toggle = document.getElementById('themeToggle');
    if (toggle) {
        toggle.textContent = next === 'dark' ? 'Light mode' : 'Dark mode';
        toggle.setAttribute('aria-pressed', next === 'dark');
    }
    try {
        localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch (error) {
        console.warn('Unable to persist theme preference', error);
    }
}

function toggleTheme() {
    applyTheme(uiState.theme === 'dark' ? 'light' : 'dark');
}

function loadUserData() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) Object.assign(userData, JSON.parse(saved));
    } catch (error) {
        console.warn('Unable to load user data', error);
    }
    if (!Array.isArray(userData.learnedWords)) userData.learnedWords = [];
    if (!userData.speakerGender) userData.speakerGender = 'male';
    if (typeof userData.lessonsCompleted !== 'number') userData.lessonsCompleted = 0;
    if (!Array.isArray(userData.mistakes)) userData.mistakes = [];
    if (!Array.isArray(userData.successes)) userData.successes = [];
    if (!Array.isArray(userData.lessonDurations)) userData.lessonDurations = [];
    if (!Array.isArray(userData.lessonAccuracy)) userData.lessonAccuracy = [];
    if (!Array.isArray(userData.lessonAttempts)) userData.lessonAttempts = [];
    if (!Array.isArray(userData.lessonCorrect)) userData.lessonCorrect = [];
    if (!userData.lastLessonId) userData.lastLessonId = null;

    hydrateLearnedWords();
}

function hydrateLearnedWords() {
    const allLessons = getAllLessonsFlat();
    userData.learnedWords = userData.learnedWords.map(entry => {
        const matchedLesson = entry.lessonId
            ? allLessons.find(lesson => lesson.id === entry.lessonId)
            : allLessons.find(lesson => lesson.words.some(word => word.en === entry.en || word.pt === entry.resolvedFrom || word.pt === entry.pt));

        return {
            ...entry,
            srsLevel: entry.srsLevel || 1,
            lastReviewed: entry.lastReviewed || Date.now(),
            lessonId: entry.lessonId || matchedLesson?.id || null,
            topicId: entry.topicId || matchedLesson?.topicId || null,
            topicTitle: entry.topicTitle || matchedLesson?.topicTitle || null
        };
    });
}

function saveUserData() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    } catch (error) {
        console.warn('Unable to save user data', error);
    }
}

function loadVoiceSettings() {
    const base = structuredClone(voiceDefaults);
    try {
        const savedRaw = localStorage.getItem(VOICE_STORAGE_KEY);
        if (!savedRaw) return base;
        const parsed = JSON.parse(savedRaw);
        return {
            ...base,
            ...parsed,
            bundled: {
                ...base.bundled,
                ...(parsed.bundled || {})
            },
            bundledApiUrl: parsed.bundledApiUrl || base.bundledApiUrl,
            bundledVoiceKey: parsed.bundledVoiceKey || base.bundledVoiceKey,
            detectedSystemOptions: Array.isArray(parsed.detectedSystemOptions) ? parsed.detectedSystemOptions : [],
            selectedVoiceKey: parsed.selectedVoiceKey || parsed.voiceKey || base.selectedVoiceKey,
            selectedSource: parsed.selectedSource || base.selectedSource,
            allowBundled: typeof parsed.allowBundled === 'boolean' ? parsed.allowBundled : base.allowBundled
        };
    } catch (error) {
        console.warn('Unable to read voice settings', error);
        return base;
    }
}

function saveVoiceSettings(settings) {
    try {
        localStorage.setItem(VOICE_STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
        console.warn('Unable to persist voice settings', error);
    }
}

function hydrateBundledFromMeta() {
    const meta = getBundledVoiceStatus();
    voiceState.bundled = {
        downloaded: Boolean(meta.downloaded),
        downloading: false,
        progress: meta.downloaded ? 100 : 0,
        sizeBytes: meta.sizeBytes || null,
        provider: meta.provider || null,
        url: meta.url || null,
        voiceKey: meta.voiceKey || null
    };
    if (!voiceState.bundledVoiceKey) {
        const bundledOptions = getBundledVoiceOptions();
        voiceState.bundledVoiceKey = bundledOptions[0]?.key || null;
    }
}

function reconcileVoiceSelection(reason = '') {
    const options = getSystemVoiceOptions();
    const hasSystem = options.length > 0;
    const bundledReady = voiceState.allowBundled && voiceState.bundled.downloaded;

    if (!voiceState.selectedSource) voiceState.selectedSource = 'auto';
    if (!voiceState.allowBundled && voiceState.selectedSource === 'bundled') {
        voiceState.selectedSource = 'system';
    }

    if (voiceState.selectedSource === 'system' && !hasSystem) {
        voiceState.selectedSource = bundledReady ? 'bundled' : 'auto';
    }

    if (voiceState.selectedSource === 'bundled' && !bundledReady) {
        voiceState.selectedSource = hasSystem ? 'system' : 'auto';
    }

    if (voiceState.selectedSource === 'auto') {
        if (hasSystem) {
            voiceState.selectedSource = 'system';
        } else if (bundledReady) {
            voiceState.selectedSource = 'bundled';
        }
    }

    if (voiceState.selectedSource === 'system' && hasSystem && voiceState.selectedVoiceKey) {
        const stillExists = options.find(o => o.key === voiceState.selectedVoiceKey);
        if (!stillExists) voiceState.selectedVoiceKey = options[0]?.key || null;
    }

    if (voiceState.selectedSource === 'system' && hasSystem && !voiceState.selectedVoiceKey) {
        voiceState.selectedVoiceKey = options[0]?.key || null;
    }

    return reason;
}

function renderVersion() {
    const versionEl = document.getElementById('appVersion');
    if (versionEl) versionEl.textContent = `v${APP_VERSION}`;
}

function renderTopicFilters() {
    const container = document.getElementById('topicFilters');
    if (!container) return;
    const topicList = ['all', ...topics.map(t => t.id)];
    container.innerHTML = topicList
        .map(id => {
            const label = id === 'all' ? 'All Topics' : topics.find(t => t.id === id)?.title || id;
            const active = uiState.selectedTopic === id ? 'active' : '';
            return `<button class="topic-chip ${active}" data-topic="${id}">${label}</button>`;
        })
        .join('');

    container.querySelectorAll('.topic-chip').forEach(btn => {
        btn.addEventListener('click', () => {
            uiState.selectedTopic = btn.dataset.topic;
            renderTopicFilters();
            renderLessons();
        });
    });
}

function getLessonImage(lesson) {
    if (lesson.image) return lesson.image;
    // Use lesson-specific images first, fall back to default
    return lessonImages[lesson.id] || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80';
}

function renderLessons() {
    const grid = document.getElementById('lessonGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const lessons = getAllLessonsFlat().filter(lesson => {
        if (uiState.selectedTopic !== 'all' && lesson.topicId !== uiState.selectedTopic) return false;
        if (!userData.isPremium && lesson.gated) return false;
        return true;
    });

    lessons.forEach(lesson => {
        const imageUrl = getLessonImage(lesson);
        const card = document.createElement('div');
        card.className = 'lesson-card';
        card.innerHTML = `
            <div class="lesson-thumb" style="background-image: url('${imageUrl}')"></div>
            <div class="lesson-meta">${lesson.topicTitle} · ${lesson.level}</div>
            <h3>${lesson.title}</h3>
            <p class="word-count">${lesson.words.length} words • ${lesson.sentences?.length || 0} sentences</p>
            ${lesson.gated ? '<span class="badge-premium">Premium</span>' : ''}
            ${userData.activeLesson === lesson.id ? '<span class="badge-active">In progress</span>' : ''}
        `;
        card.addEventListener('click', () => startLesson(lesson.id));
        grid.appendChild(card);
    });

    if (!lessons.length) {
        grid.innerHTML = '<p class="muted">No lessons available for this filter.</p>';
    }
}

function startLesson(lessonId) {
    const lesson = getAllLessonsFlat().find(l => l.id === lessonId);
    if (!lesson) return;
    if (lesson.gated && !userData.isPremium) {
        showPaywall();
        return;
    }

    userData.activeLesson = lessonId;
    uiState.lessonStartMs = Date.now();
    saveUserData();

    const imageUrl = getLessonImage(lesson);

    const section = document.querySelector('.learning-section');
    if (!section) return;
    section.innerHTML = `
        <div class="lesson-header">
            <button class="btn-back" id="backToLessons">← Back</button>
            <div>
                <p class="lesson-meta">${lesson.topicTitle} · ${lesson.level}</p>
                <h2>${lesson.title}</h2>
            </div>
        </div>
        <div class="lesson-hero" style="background-image: url('${imageUrl}')">
            <div class="lesson-hero-label">${lesson.title}</div>
        </div>
        <div class="lesson-words" id="lessonWords"></div>
        <div class="lesson-sentences" id="lessonSentences"></div>
        <div class="lesson-practice">
            <div class="practice-block">
                <h3>Fill in the blanks</h3>
                <p class="muted">Type the Portuguese. We check accents and spelling.</p>
                <div class="fill-grid" id="fillBlanks"></div>
            </div>
            <div class="practice-block">
                <h3>Speak & Check</h3>
                <p class="muted">Say the phrase and we match it against EU-PT.</p>
                <div class="speak-grid" id="speakPractice"></div>
            </div>
            <div class="practice-block">
                <h3>Spaced Repetition Drill</h3>
                <p class="muted">Master words through 3 rounds: Recognition → Production → Context</p>
                <div id="repetitionDrill"></div>
            </div>
        </div>
        <div class="lesson-quiz" id="lessonQuiz"></div>
        <div class="lesson-actions">
            <button class="btn-complete" id="completeLesson">Mark Lesson Complete</button>
        </div>
    `;

    document.getElementById('backToLessons').addEventListener('click', backToLessons);
    document.getElementById('completeLesson').addEventListener('click', () => completeLesson(lesson));

    const wordsContainer = document.getElementById('lessonWords');
    lesson.words.forEach(word => {
        const wordCard = createWordCard(word);
        wordsContainer.appendChild(wordCard);
    });

    const sentencesContainer = document.getElementById('lessonSentences');
    (lesson.sentences || []).forEach(sentence => {
        const card = document.createElement('div');
        card.className = 'sentence-card';
        card.innerHTML = `
            <div class="sentence-pt">${sentence.pt}</div>
            <div class="sentence-en">${sentence.en}</div>
        `;
        sentencesContainer.appendChild(card);
    });

    renderFillBlanks(lesson);
    renderSpeakPractice(lesson);
    renderRepetitionDrill(lesson);
    renderLessonQuizShell(lesson);
}

function createWordCard(word) {
    const resolved = resolveWordForm(word, userData.speakerGender);
    const alt = getAlternateForm(word, userData.speakerGender);
    const card = document.createElement('div');
    card.className = 'word-card';
    card.innerHTML = `
        <div class="portuguese">${resolved}</div>
        <div class="english">${word.en}</div>
        ${alt ? `<div class="alt-form">Alternate: ${alt}</div>` : ''}
    `;
    card.addEventListener('click', () => {
        playPortugueseText(resolved, { rate: 0.9 });
    });
    return card;
}

function renderFillBlanks(lesson) {
    const container = document.getElementById('fillBlanks');
    if (!container) return;
    container.innerHTML = '';
    const shuffled = shuffleArray([...lesson.words]);
    const targets = shuffled.slice(0, Math.min(6, lesson.words.length));
    if (!targets.length) {
        container.innerHTML = '<p class="muted">No words found for this lesson yet.</p>';
        return;
    }

    targets.forEach(word => {
        const resolved = resolveWordForm(word, userData.speakerGender);
        const row = document.createElement('div');
        row.className = 'fill-item';
        row.innerHTML = `
            <div class="fill-prompt">${word.en}</div>
            <input type="text" aria-label="Type the Portuguese" placeholder="Type in Portuguese" />
            <button class="btn-small">Check</button>
            <div class="fill-feedback" aria-live="polite"></div>
        `;

        const input = row.querySelector('input');
        const button = row.querySelector('button');
        const feedback = row.querySelector('.fill-feedback');

        button.addEventListener('click', () => {
            const typed = normalizeText(input.value);
            const target = normalizeText(resolved);
            const isCorrect = typed === target;
            if (isCorrect) {
                feedback.textContent = '✅ Correct!';
                feedback.className = 'fill-feedback success';
                recordSuccess({ ...word, pt: resolved }, { source: 'fill-blank', lessonId: lesson.id, boostMistake: true, mistakeKey: getWordKey(word) });
            } else {
                feedback.textContent = `❌ Expected: ${resolved}`;
                feedback.className = 'fill-feedback error';
                recordMistake({ ...word, pt: resolved }, { source: 'fill-blank', details: `Typed: ${input.value}`, lessonId: lesson.id });
            }
        });

        container.appendChild(row);
    });
}

function renderSpeakPractice(lesson) {
    const container = document.getElementById('speakPractice');
    if (!container) return;
    container.innerHTML = '';
    const samples = (lesson.sentences && lesson.sentences.length ? lesson.sentences : lesson.words).slice(0, 2);

    if (!samples.length) {
        container.innerHTML = '<p class="muted">Add sentences to practice speaking for this lesson.</p>';
        return;
    }

    samples.forEach(sample => {
        const targetText = sample.pt || resolveWordForm(sample, userData.speakerGender);
        const card = document.createElement('div');
        card.className = 'speak-card';
        card.innerHTML = `
            <div class="speak-target">${targetText}</div>
            <div class="speak-actions">
                <button class="btn-small" data-target="${targetText}">Check my speech</button>
                <button class="btn-small ghost" data-play="${targetText}">Play demo</button>
            </div>
            <div class="speak-feedback" aria-live="polite"></div>
        `;
        const playBtn = card.querySelector('button[data-play]');
        const checkBtn = card.querySelector('button[data-target]');
        const feedback = card.querySelector('.speak-feedback');

        playBtn.addEventListener('click', () => {
            playPortugueseText(targetText, { rate: 0.9 });
        });

        checkBtn.addEventListener('click', () => {
            handleSpeakCheck(targetText, feedback, checkBtn, lesson.id);
        });

        container.appendChild(card);
    });
}

function handleSpeakCheck(target, feedbackEl, buttonEl, lessonId) {
    const supported = ensureSpeechRecognition();
    if (!supported) {
        feedbackEl.textContent = `${speechState.reason} Try the text drill instead.`;
        feedbackEl.className = 'speak-feedback error';
        return;
    }
    const recognizer = speechState.recognizer;
    if (!recognizer) return;
    if (speechState.listening) {
        feedbackEl.textContent = 'Already listening…';
        return;
    }

    speechState.listening = true;
    feedbackEl.textContent = '🎤 Listening…';
    feedbackEl.className = 'speak-feedback';
    buttonEl.disabled = true;

    recognizer.onresult = event => {
        const transcript = event.results?.[0]?.[0]?.transcript || '';
        const score = scoreSpeechTranscript(transcript, target);
        const passed = score >= 70;
        feedbackEl.textContent = passed
            ? `✅ Nice! Heard: “${transcript}” (${score}% match)`
            : `❌ Heard: “${transcript}” (${score}% match). Try again or slow down.`;
        feedbackEl.className = `speak-feedback ${passed ? 'success' : 'error'}`;
        const word = { pt: target, en: target, lessonId };
        if (passed) {
            recordSuccess(word, { source: 'speech-check', lessonId });
        } else {
            recordMistake(word, { source: 'speech-check', details: transcript, lessonId });
        }
    };

    recognizer.onerror = event => {
        const errorMap = {
            'not-allowed': 'Microphone access denied. Please enable permissions in browser settings.',
            'no-speech': 'No speech detected. Try again and speak clearly.',
            'network': 'Network error. Check your internet connection.',
            'aborted': 'Recognition aborted. Click to retry.'
        };
        feedbackEl.innerHTML = `<strong>Error:</strong> ${errorMap[event.error] || event.error} <button class="btn-small" onclick="this.closest('.speak-card, .quiz-speak-row').querySelector('.btn-small[data-target], .btn-small[data-speak]').click(); this.remove();">🔄 Retry</button>`;
        feedbackEl.className = 'speak-feedback error';
    };

    recognizer.onend = () => {
        speechState.listening = false;
        buttonEl.disabled = false;
        buttonEl.classList.remove('progressing');
    };

    try {
        recognizer.start();
    } catch (error) {
        speechState.listening = false;
        buttonEl.disabled = false;
        buttonEl.classList.remove('progressing');
        feedbackEl.innerHTML = `<strong>Error:</strong> ${error.message} <button class="btn-small" onclick="this.closest('.speak-card, .quiz-speak-row').querySelector('.btn-small[data-target], .btn-small[data-speak]').click(); this.remove();">🔄 Retry</button>`;
        feedbackEl.className = 'speak-feedback error';
    }
}

function renderLessonQuizShell(lesson) {
    const container = document.getElementById('lessonQuiz');
    if (!container) return;
    container.innerHTML = `
        <div class="quiz-card">
            <div class="quiz-header">
                <div>
                    <div class="lesson-meta">${lesson.topicTitle} · ${lesson.level}</div>
                    <h3>Lesson Test</h3>
                </div>
                <button class="btn-small" id="startLessonQuizBtn">Start Quiz</button>
            </div>
            <p class="muted">Mix of multiple-choice, fill-in, and optional speaking checks.</p>
            <div id="lessonQuizStage"></div>
        </div>
    `;

    const startBtn = document.getElementById('startLessonQuizBtn');
    if (startBtn) startBtn.addEventListener('click', () => startLessonQuiz(lesson));
}

function buildLessonQuiz(lesson) {
    const pool = Array.isArray(lesson.words) ? lesson.words : [];
    const questions = [];
    const mcqWords = shuffleArray(pool).slice(0, Math.min(4, pool.length));
    mcqWords.forEach(word => {
        const options = buildQuizOptions(word, pool);
        questions.push({
            type: 'mcq',
            prompt: `What does “${resolveWordForm(word, userData.speakerGender)}” mean?`,
            options,
            answerKey: getWordKey(word),
            word
        });
    });

    const fillWords = pool.slice(0, Math.min(2, pool.length));
    fillWords.forEach(word => {
        questions.push({
            type: 'fill',
            prompt: `Type the Portuguese for: ${word.en}`,
            answer: resolveWordForm(word, userData.speakerGender),
            word
        });
    });

    const speakSource = (lesson.sentences && lesson.sentences.length ? lesson.sentences[0].pt : (pool[0] ? resolveWordForm(pool[0], userData.speakerGender) : null));
    if (speakSource) {
        questions.push({
            type: 'speak',
            prompt: 'Say this aloud in EU-PT',
            target: speakSource,
            word: { pt: speakSource, en: speakSource }
        });
    }

    return questions;
}

function startLessonQuiz(lesson) {
    const stage = document.getElementById('lessonQuizStage');
    if (!stage) return;
    const questions = buildLessonQuiz(lesson);
    if (!questions.length) {
        stage.innerHTML = '<p class="muted">Add words to this lesson to generate a quiz.</p>';
        return;
    }

    const state = { 
        index: 0, 
        correct: 0, 
        attempts: 0,
        mcqCorrect: 0,
        fillCorrect: 0,
        speakCorrect: 0,
        mcqTotal: 0,
        fillTotal: 0,
        speakTotal: 0
    };

    const renderQuestion = () => {
        const current = questions[state.index];
        if (!current) return finish();
        stage.innerHTML = '';
        const wrapper = document.createElement('div');
        wrapper.className = 'lesson-quiz-question';
        wrapper.innerHTML = `
            <div class="quiz-question">${state.index + 1}/${questions.length} · ${current.prompt}</div>
            <div class="quiz-body"></div>
            <div class="quiz-feedback" aria-live="polite"></div>
        `;
        const body = wrapper.querySelector('.quiz-body');
        const feedback = wrapper.querySelector('.quiz-feedback');

        if (current.type === 'mcq') {
            const group = document.createElement('div');
            group.className = 'quiz-options';
            current.options.forEach(opt => {
                const btn = document.createElement('button');
                btn.className = 'quiz-option';
                btn.textContent = opt.en;
                btn.addEventListener('click', () => {
                    const isCorrect = opt.key === current.answerKey;
                    handleQuizResult(isCorrect, current.word, feedback, group, btn, opt.en);
                });
                group.appendChild(btn);
            });
            body.appendChild(group);
        }

        if (current.type === 'fill') {
            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = 'Type in Portuguese';
            input.className = 'quiz-input';
            const btn = document.createElement('button');
            btn.className = 'btn-small';
            btn.textContent = 'Check';
            btn.addEventListener('click', () => {
                const typed = normalizeText(input.value);
                const target = normalizeText(current.answer);
                const isCorrect = typed === target;
                handleQuizResult(isCorrect, current.word, feedback, null, btn, input.value, current.answer);
            });
            body.appendChild(input);
            body.appendChild(btn);
        }

        if (current.type === 'speak') {
            const target = current.target;
            const speakRow = document.createElement('div');
            speakRow.className = 'quiz-speak-row';
            speakRow.innerHTML = `
                <div class="speak-target">${target}</div>
                <div class="quiz-speak-actions">
                    <button class="btn-small" data-speak="go">Check speech</button>
                    <button class="btn-small ghost" data-play="demo">Play demo</button>
                </div>
            `;
            const speakBtn = speakRow.querySelector('button[data-speak]');
            const playBtn = speakRow.querySelector('button[data-play]');
            playBtn.addEventListener('click', () => playPortugueseText(target, { rate: 0.9 }));
            speakBtn.addEventListener('click', () => {
                handleSpeakCheck(target, feedback, speakBtn, lesson.id);
                // We consider a pass when feedback class switches to success.
                const observer = new MutationObserver(() => {
                    if (feedback.classList.contains('success')) {
                        observer.disconnect();
                        advance(true, current.word);
                    }
                });
                observer.observe(feedback, { attributes: true, attributeFilter: ['class'] });
            });
            body.appendChild(speakRow);
        }

        stage.appendChild(wrapper);
    };

    const handleQuizResult = (isCorrect, word, feedbackEl, buttonGroup, clickedBtn, provided, expected) => {
        state.attempts += 1;
        const current = questions[state.index];
        
        // Track by question type
        if (current.type === 'mcq') {
            state.mcqTotal += 1;
            if (isCorrect) state.mcqCorrect += 1;
        } else if (current.type === 'fill') {
            state.fillTotal += 1;
            if (isCorrect) state.fillCorrect += 1;
        } else if (current.type === 'speak') {
            state.speakTotal += 1;
            if (isCorrect) state.speakCorrect += 1;
        }
        
        if (buttonGroup) {
            buttonGroup.querySelectorAll('button').forEach(btn => btn.disabled = true);
        }
        if (clickedBtn) clickedBtn.disabled = true;
        if (isCorrect) {
            state.correct += 1;
            feedbackEl.textContent = '✅ Correct!';
            feedbackEl.className = 'quiz-feedback success';
            recordSuccess(word, { source: 'lesson-quiz', lessonId: lesson.id, boostMistake: true, mistakeKey: getWordKey(word) });
        } else {
            feedbackEl.textContent = expected ? `❌ Expected: ${expected}` : `❌ ${word.pt} = ${word.en}`;
            feedbackEl.className = 'quiz-feedback error';
            recordMistake(word, { source: 'lesson-quiz', details: provided || 'wrong', lessonId: lesson.id });
        }
        setTimeout(() => advance(isCorrect, word), 600);
    };

    const advance = () => {
        state.index += 1;
        if (state.index >= questions.length) {
            finish();
        } else {
            renderQuestion();
        }
    };

    const finish = () => {
        const score = questions.length ? Math.round((state.correct / questions.length) * 100) : 0;
        
        // Calculate per-type scores
        const mcqPct = state.mcqTotal ? Math.round((state.mcqCorrect / state.mcqTotal) * 100) : 0;
        const fillPct = state.fillTotal ? Math.round((state.fillCorrect / state.fillTotal) * 100) : 0;
        const speakPct = state.speakTotal ? Math.round((state.speakCorrect / state.speakTotal) * 100) : 0;
        
        // Determine badge
        const badge = score >= 95 ? '🥇 GOLD' : score >= 80 ? '🥈 SILVER' : score >= 60 ? '🥉 BRONZE' : '📝 PRACTICE';
        
        stage.innerHTML = `
            <div class="quiz-summary">
                <div class="lesson-badge">${badge}</div>
                <div class="quiz-score">${score}%</div>
                <h4>Quiz Breakdown:</h4>
                <div class="score-breakdown">
                    ${state.mcqTotal ? `<p>Multiple Choice: ${state.mcqCorrect}/${state.mcqTotal} (${mcqPct}%)</p>` : ''}
                    ${state.fillTotal ? `<p>Fill-in-the-Blank: ${state.fillCorrect}/${state.fillTotal} (${fillPct}%)</p>` : ''}
                    ${state.speakTotal ? `<p>Speech Recognition: ${state.speakCorrect}/${state.speakTotal} (${speakPct}%)</p>` : ''}
                </div>
                <p><strong>${state.correct} / ${questions.length} correct</strong></p>
                <p class="muted">Replay the quiz anytime to improve your streak and SRS.</p>
            </div>
        `;
        const all = getAllLessonsFlat();
        const idx = all.findIndex(l => l.id === lesson.id);
        if (idx !== -1) {
            userData.lessonAttempts[idx] = (userData.lessonAttempts[idx] || 0) + state.attempts;
            userData.lessonCorrect[idx] = (userData.lessonCorrect[idx] || 0) + state.correct;
            const attempts = userData.lessonAttempts[idx];
            const correct = userData.lessonCorrect[idx];
            userData.lessonAccuracy[idx] = attempts ? Math.round((correct / attempts) * 100) : score;
            saveUserData();
            renderLessonInsights();
            renderSkillDashboard();
        }
    };

    renderQuestion();
}

function resolveWordForm(word, speakerGender) {
    if (word.gendered && speakerGender === 'female' && word.ptFem) return word.ptFem;
    return word.pt;
}

function getAlternateForm(word, speakerGender) {
    if (!word.gendered) return '';
    if (speakerGender === 'female' && word.pt) return word.pt;
    if (speakerGender === 'male' && word.ptFem) return word.ptFem;
    return '';
}

function getWordKey(word) {
    return `${word.pt}|${word.en}`;
}

function recordMistake(word, context = {}) {
    const key = getWordKey(word);
    let entry = userData.mistakes.find(m => m.key === key);
    if (!entry) {
        entry = { key, pt: word.pt, en: word.en, count: 0, lastSeen: 0, contexts: [] };
        userData.mistakes.push(entry);
    }
    entry.count += 1;
    entry.lastSeen = Date.now();
    if (context.details) {
        entry.contexts = [context.details, ...(entry.contexts || [])].slice(0, 5);
    }
    updateSrs(key, false);
    updateLessonAccuracy(resolveLessonId(word, context.lessonId), false);
    saveUserData();
    renderCoachPanel();
    renderSrsBuckets();
    renderLessonInsights();
    renderSkillDashboard();
}

function recordSuccess(word, context = {}) {
    const key = getWordKey(word);
    let entry = userData.successes.find(m => m.key === key);
    if (!entry) {
        entry = { key, pt: word.pt, en: word.en, count: 0, lastSeen: 0 };
        userData.successes.push(entry);
    }
    entry.count += 1;
    entry.lastSeen = Date.now();
    if (context.boostMistake && context.mistakeKey) {
        const mistake = userData.mistakes.find(m => m.key === context.mistakeKey);
        if (mistake && mistake.count > 0) mistake.count = Math.max(0, mistake.count - 1);
    }
    updateSrs(key, true);
    updateLessonAccuracy(resolveLessonId(word, context.lessonId), true);
    saveUserData();
    renderCoachPanel();
    renderSrsBuckets();
    renderLessonInsights();
    renderSkillDashboard();
}

function updateSrs(key, correct) {
    const entry = userData.learnedWords.find(w => getWordKey(w) === key);
    if (!entry) return;
    
    // Initialize SRS properties if missing
    if (!entry.srsLevel) entry.srsLevel = 1;
    if (!entry.easeFactor) entry.easeFactor = 2.5;
    if (!entry.repetitions) entry.repetitions = 0;
    if (!entry.nextReview) entry.nextReview = Date.now();
    
    // SM-2 Algorithm implementation
    if (correct) {
        entry.repetitions += 1;
        
        if (entry.repetitions === 1) {
            entry.srsLevel = 1;
        } else if (entry.repetitions === 2) {
            entry.srsLevel = Math.min(5, 2);
        } else {
            // Promote based on performance
            const newLevel = Math.min(5, entry.srsLevel + 1);
            entry.srsLevel = newLevel;
        }
        
        // Calculate next review interval using SM-2
        const interval = SRS_INTERVALS[entry.srsLevel];
        entry.nextReview = Date.now() + (interval * 24 * 60 * 60 * 1000);
        
        // Adjust ease factor (quality = 4 for correct)
        entry.easeFactor = Math.max(1.3, entry.easeFactor + (0.1 - (5 - 4) * (0.08 + (5 - 4) * 0.02)));
        
    } else {
        // Reset on failure
        entry.repetitions = 0;
        entry.srsLevel = 1;
        entry.nextReview = Date.now() + (1 * 60 * 60 * 1000); // Review in 1 hour
        
        // Decrease ease factor (quality = 0 for incorrect)
        entry.easeFactor = Math.max(1.3, entry.easeFactor + (0.1 - (5 - 0) * (0.08 + (5 - 0) * 0.02)));
    }
    
    entry.lastReviewed = Date.now();
}

// Get words due for review
function getDueWords() {
    const now = Date.now();
    return userData.learnedWords.filter(word => {
        const nextReview = word.nextReview || 0;
        return now >= nextReview;
    });
}

// Get word mnemonic if available
function getMnemonic(word) {
    const pt = word.pt?.toLowerCase();
    return MNEMONICS[pt] || null;
}

function resolveLessonId(word, providedLessonId) {
    if (providedLessonId) return providedLessonId;
    const key = getWordKey(word);
    const entry = userData.learnedWords.find(w => getWordKey(w) === key);
    return entry?.lessonId || null;
}

function updateLessonAccuracy(lessonId, correct) {
    if (!lessonId) return;
    const idx = getAllLessonsFlat().findIndex(lesson => lesson.id === lessonId);
    if (idx === -1) return;
    userData.lessonAttempts[idx] = (userData.lessonAttempts[idx] || 0) + 1;
    if (correct) userData.lessonCorrect[idx] = (userData.lessonCorrect[idx] || 0) + 1;
    const attempts = userData.lessonAttempts[idx] || 0;
    const correctCount = userData.lessonCorrect[idx] || 0;
    userData.lessonAccuracy[idx] = attempts ? Math.round((correctCount / attempts) * 100) : 0;
}

function generateHints(limit = 5) {
    const sorted = [...userData.mistakes].sort((a, b) => b.count - a.count || b.lastSeen - a.lastSeen);
    const hints = sorted.slice(0, limit).map(item => {
        const tip = buildHintForWord(item);
        return { ...item, tip };
    });

    if (!hints.length) {
        return [
            {
                key: 'foundation-pronunciation',
                pt: 'Pronúncia',
                en: 'Pronunciation',
                count: 0,
                tip: 'Shadow the demo phrase at 0.9× speed, focusing on nasal vowels (ão/ãe/õe) and stress. Repeat 3–5 times.'
            }
        ];
    }
    return hints;
}

function buildHintForWord(item) {
    const text = item.pt?.toLowerCase() || '';
    if (/ão|õe|õe?s|ães|ãos/.test(text)) return 'Shorten the vowel then nasalize: practice “pão / mãos / corações” with slow audio.';
    if (/obrigad[oa]/.test(text)) return 'Match gender: obrigado (masc), obrigada (fem). Say it after every request to cement formality.';
    if (/por favor|por favor/.test(text)) return 'Pair “por favor” with rising intonation; follow with obrigada/obrigado to close politely.';
    if (/metro|comboio|autocarro/.test(text)) return 'Transport nouns use o artigo “o”. Drill: “Onde fica o metro/o comboio/o autocarro?”.';
    if (/sou|estou|tenho/.test(text)) return 'Ser vs. estar vs. ter: ser=permanent, estar=state/location, ter=possession. Build 3 mini sentences for each.';
    return 'Say the Portuguese twice, then EN once. Record and compare to the demo audio, fixing one sound (s/ʃ/ʒ/r) at a time.';
}

function completeLesson(lesson) {
    const lessonId = lesson.id;
    const idx = getAllLessonsFlat().findIndex(l => l.id === lessonId);

    lesson.words.forEach(word => {
        const resolved = resolveWordForm(word, userData.speakerGender);
        const key = getWordKey(word);
        const exists = userData.learnedWords.find(w => getWordKey(w) === key);
        if (!exists) {
            userData.learnedWords.push({
                ...word,
                pt: resolved,
                resolvedFrom: word.pt,
                genderUsed: userData.speakerGender,
                lessonId,
                topicId: lesson.topicId,
                topicTitle: lesson.topicTitle,
                srsLevel: 1,
                lastReviewed: Date.now()
            });
        }
        recordSuccess({ ...word, pt: resolved, lessonId }, { source: 'lesson-complete', boostMistake: true, mistakeKey: key, lessonId });
    });

    userData.lessonsCompleted += 1;
    userData.streak += 1;
    userData.activeLesson = null;
    userData.lastLessonId = lessonId;

    if (uiState.lessonStartMs && idx !== -1) {
        const durationSec = Math.max(1, Math.round((Date.now() - uiState.lessonStartMs) / 1000));
        userData.lessonDurations[idx] = durationSec;
        uiState.lessonStartMs = null;
    }

    if (idx !== -1 && typeof userData.lessonAccuracy[idx] !== 'number') {
        userData.lessonAccuracy[idx] = 100;
    }
    saveUserData();
    updateDashboard();

    alert(`🎉 Lesson complete! You learned ${lesson.words.length} words.`);
    backToLessons();
}

function backToLessons() {
    const section = document.querySelector('.learning-section');
    if (!section) return;
    section.innerHTML = `
        <div class="learning-header">
            <div>
                <h2>Begin Your Journey</h2>
                <p class="muted">Pick a topic and start listening.</p>
            </div>
            <div class="speaker-toggle">
                <label><input type="radio" name="speakerGender" value="male" ${userData.speakerGender === 'male' ? 'checked' : ''}> Male form</label>
                <label><input type="radio" name="speakerGender" value="female" ${userData.speakerGender === 'female' ? 'checked' : ''}> Female form</label>
            </div>
        </div>
        <div class="topics-bar" id="topicFilters"></div>
        <div class="lesson-grid" id="lessonGrid"></div>
    `;
    renderTopicFilters();
    renderLessons();
    hookSpeakerRadios();
}

function hookSpeakerRadios() {
    document.querySelectorAll('input[name="speakerGender"]').forEach(radio => {
        radio.addEventListener('change', e => {
            userData.speakerGender = e.target.value;
            saveUserData();
            renderLessons();
            renderVault();
        });
    });
}

function updateDashboard() {
    const totalWordsEl = document.getElementById('totalWords');
    const streakEl = document.getElementById('streak');
    const statusEl = document.getElementById('accountStatus');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');

    if (totalWordsEl) totalWordsEl.textContent = userData.learnedWords.length;
    if (streakEl) streakEl.textContent = userData.streak;
    if (statusEl) statusEl.textContent = userData.isPremium ? 'Premium Member' : 'Free Plan';

    const allLessons = getAllLessonsFlat().filter(l => !l.gated || userData.isPremium);
    const progress = allLessons.length ? Math.min(userData.lessonsCompleted, allLessons.length) / allLessons.length * 100 : 0;
    if (progressFill) progressFill.style.width = `${progress}%`;
    if (progressText) progressText.textContent = `${Math.round(progress)}% Complete`;

    renderVault();
    updatePlanAccess();
    renderLessonInsights();
    renderSrsBuckets();
    renderSkillDashboard();
}

function updatePlanAccess() {
    const paidCard = document.getElementById('paidPlan');
    const locked = document.getElementById('paidPlanLocked');
    const body = document.getElementById('paidPlanBody');
    if (!paidCard || !locked || !body) return;
    const unlocked = Boolean(userData.isPremium);
    paidCard.classList.toggle('unlocked', unlocked);
    locked.style.display = unlocked ? 'none' : 'grid';
    body.style.display = unlocked ? 'block' : 'none';
}

function renderVault() {
    const wordList = document.getElementById('wordList');
    if (!wordList) return;
    renderSrsBuckets();
    const search = vaultFilters.query.trim().toLowerCase();

    const filtered = userData.learnedWords
        .filter(word => {
            if (!search) return true;
            const tokens = [word.pt, word.en, word.resolvedFrom].filter(Boolean).join(' ').toLowerCase();
            return tokens.includes(search);
        })
        .sort((a, b) => {
            const key = vaultFilters.sort === 'en' ? 'en' : 'pt';
            return (a[key] || '').localeCompare(b[key] || '');
        });

    wordList.innerHTML = '';
    filtered.forEach(word => {
        const card = document.createElement('div');
        card.className = 'word-card';
        
        // Check for mnemonic
        const mnemonic = getMnemonic(word);
        const mnemonicHTML = mnemonic ? `<div class="mnemonic-hint" style="font-size: 0.85em; opacity: 0.7; margin-top: 4px;">💡 ${mnemonic.tip}</div>` : '';
        
        card.innerHTML = `
            <div class="portuguese">${word.pt}</div>
            <div class="english">${word.en}</div>
            ${word.resolvedFrom && word.resolvedFrom !== word.pt ? `<div class="alt-form">Base: ${word.resolvedFrom}</div>` : ''}
            ${mnemonicHTML}
        `;
        wordList.appendChild(card);
    });

    setActiveSortButton(vaultFilters.sort);
}

function renderSrsBuckets() {
    const container = document.getElementById('srsBuckets');
    if (!container) return;
    const buckets = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    userData.learnedWords.forEach(word => {
        const level = word.srsLevel || 1;
        buckets[level] = (buckets[level] || 0) + 1;
    });
    const total = userData.learnedWords.length || 1;
    container.innerHTML = Object.entries(buckets)
        .map(([level, count]) => {
            const pct = Math.round((count / total) * 100);
            return `<span class="srs-chip" data-level="${level}">L${level}: ${count} (${pct}%)</span>`;
        })
        .join('');
}

function renderLessonInsights() {
    const accuracyEl = document.getElementById('lessonAccuracyStat');
    const timeEl = document.getElementById('lessonTimeStat');
    const detailEl = document.getElementById('lessonDetailStat');
    if (!accuracyEl && !timeEl && !detailEl) return;

    const accuracies = userData.lessonAccuracy.filter(val => typeof val === 'number');
    const avgAccuracy = accuracies.length ? Math.round(accuracies.reduce((a, b) => a + b, 0) / accuracies.length) : 0;
    if (accuracyEl) accuracyEl.textContent = accuracies.length ? `${avgAccuracy}% avg accuracy` : 'No accuracy data yet';

    const durations = userData.lessonDurations.map(Number).filter(val => Number.isFinite(val) && val > 0);
    const avgDuration = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
    if (timeEl) timeEl.textContent = durations.length ? `${avgDuration}s avg time` : 'No time tracked yet';

    if (detailEl) {
        const lessons = getAllLessonsFlat();
        const lastId = userData.lastLessonId;
        if (!lastId) {
            detailEl.textContent = 'Complete a lesson to see details.';
        } else {
            const idx = lessons.findIndex(l => l.id === lastId);
            const lesson = lessons[idx];
            const accText = idx !== -1 && typeof userData.lessonAccuracy[idx] === 'number' ? `${userData.lessonAccuracy[idx]}%` : '—';
            const durText = idx !== -1 && userData.lessonDurations[idx] ? `${userData.lessonDurations[idx]}s` : '—';
            detailEl.textContent = lesson ? `${lesson.title}: ${accText}, ${durText}` : `Lesson ${lastId}: ${accText}, ${durText}`;
        }
    }
}

function startReviewQuiz(targetPool = null) {
    const promptEl = document.getElementById('reviewPrompt');
    const optionsEl = document.getElementById('reviewOptions');
    const resultContainer = document.getElementById('reviewResult');
    if (!promptEl || !optionsEl || !resultContainer) return;

    // Prioritize due words for spaced repetition
    const dueWords = getDueWords();
    const pool = Array.isArray(targetPool) && targetPool.length ? targetPool : 
                 (dueWords.length > 0 ? dueWords : userData.learnedWords);

    if (!pool.length) {
        promptEl.textContent = 'Learn a lesson first to unlock review quizzes.';
        optionsEl.innerHTML = '';
        resultContainer.textContent = '';
        resultContainer.className = 'review-result error';
        return;
    }

    const word = pickReviewWord(pool);
    if (!word) return;
    const choices = buildQuizOptions(word, pool);

    promptEl.textContent = `What does “${word.pt}” mean?`;
    optionsEl.innerHTML = '';
    resultContainer.textContent = '';
    resultContainer.className = 'review-result';

    choices.forEach(choice => {
        const btn = document.createElement('button');
        btn.className = 'option-chip';
        btn.textContent = choice.en;
        btn.addEventListener('click', () => handleReviewChoice(choice, word, resultContainer, optionsEl));
        optionsEl.appendChild(btn);
    });
}

function pickReviewWord(pool) {
    const ordered = [...pool].sort((a, b) => (a.srsLevel || 1) - (b.srsLevel || 1) || (a.lastReviewed || 0) - (b.lastReviewed || 0));
    const slice = ordered.slice(0, Math.min(5, ordered.length));
    if (!slice.length) return null;
    const randomIndex = Math.floor(Math.random() * slice.length);
    return slice[randomIndex];
}

function buildQuizOptions(correctWord, pool) {
    const poolOthers = pool.filter(w => getWordKey(w) !== getWordKey(correctWord));
    const globalOthers = userData.learnedWords.filter(w => getWordKey(w) !== getWordKey(correctWord));
    const combined = shuffleArray([...poolOthers, ...globalOthers]);
    const distractors = combined.slice(0, 3);
    const options = shuffleArray([correctWord, ...distractors]);
    return options.map(option => ({
        key: getWordKey(option),
        en: option.en,
        lessonId: option.lessonId || correctWord.lessonId
    }));
}

function shuffleArray(list) {
    const arr = [...list];
    for (let i = arr.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function handleReviewChoice(choice, correctWord, resultContainer, optionsEl) {
    optionsEl.querySelectorAll('button').forEach(btn => {
        btn.disabled = true;
    });

    const isCorrect = choice.key === getWordKey(correctWord);
    if (isCorrect) {
        recordSuccess(correctWord, { source: 'review-quiz', boostMistake: true, mistakeKey: getWordKey(correctWord), lessonId: correctWord.lessonId });
    } else {
        recordMistake(correctWord, { source: 'review-quiz', details: `Selected: ${choice.en}`, lessonId: correctWord.lessonId });
    }

    resultContainer.textContent = isCorrect ? `✅ Correct! ${correctWord.pt} = ${correctWord.en}` : `❌ ${correctWord.pt} means "${correctWord.en}".`;
    resultContainer.className = `review-result ${isCorrect ? 'success' : 'error'}`;

    optionsEl.querySelectorAll('button').forEach(btn => {
        if (btn.textContent === correctWord.en) btn.classList.add('correct');
        if (btn.textContent === choice.en && !isCorrect) btn.classList.add('selected-wrong');
    });
}

function resetProgress() {
    const confirmed = confirm('Reset all progress, streak, and learned words?');
    if (!confirmed) return;
    userData.learnedWords = [];
    userData.streak = 0;
    userData.lessonsCompleted = 0;
    userData.activeLesson = null;
    userData.mistakes = [];
    userData.successes = [];
    userData.lessonDurations = [];
    userData.lessonAccuracy = [];
    userData.lessonAttempts = [];
    userData.lessonCorrect = [];
    userData.lastLessonId = null;
    uiState.lessonStartMs = null;
    saveUserData();
    updateDashboard();
    backToLessons();
}

function showPaywall() {
    const modal = document.getElementById('paywall');
    if (modal) modal.style.display = 'flex';
}

function hidePaywall() {
    const modal = document.getElementById('paywall');
    if (modal) modal.style.display = 'none';
}

function setupEventListeners() {
    const premiumBtn = document.getElementById('premiumBtn');
    if (premiumBtn) premiumBtn.addEventListener('click', showPaywall);
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) themeToggle.addEventListener('click', toggleTheme);
    const unlockPaidPlan = document.getElementById('unlockPaidPlan');
    if (unlockPaidPlan) unlockPaidPlan.addEventListener('click', showPaywall);
    const closePaywall = document.querySelector('.close-paywall');
    if (closePaywall) closePaywall.addEventListener('click', hidePaywall);
    const subscribeBtn = document.querySelector('.btn-subscribe');
    if (subscribeBtn) {
        subscribeBtn.addEventListener('click', () => {
            alert('Payment integration would go here. For now, premium unlocked.');
            userData.isPremium = true;
            saveUserData();
            updateDashboard();
            hidePaywall();
            renderLessons();
            updatePlanAccess();
        });
    }

    const startBtn = document.getElementById('startBtn');
    if (startBtn) startBtn.addEventListener('click', () => document.getElementById('learn').scrollIntoView({ behavior: 'smooth' }));

    const reviewBtn = document.getElementById('reviewBtn');
    if (reviewBtn) reviewBtn.addEventListener('click', startReviewQuiz);

    const resetBtn = document.getElementById('resetProgressBtn');
    if (resetBtn) resetBtn.addEventListener('click', resetProgress);

    const vaultSearch = document.getElementById('vaultSearch');
    if (vaultSearch) {
        vaultSearch.addEventListener('input', e => {
            vaultFilters.query = e.target.value;
            renderVault();
        });
    }
    const sortPt = document.getElementById('vaultSortPt');
    const sortEn = document.getElementById('vaultSortEn');
    const clearFilters = document.getElementById('vaultClearFilters');
    if (sortPt) sortPt.addEventListener('click', () => { vaultFilters.sort = 'pt'; renderVault(); setActiveSortButton('pt'); });
    if (sortEn) sortEn.addEventListener('click', () => { vaultFilters.sort = 'en'; renderVault(); setActiveSortButton('en'); });
    if (clearFilters) clearFilters.addEventListener('click', () => {
        vaultFilters.query = '';
        vaultFilters.sort = 'pt';
        if (vaultSearch) vaultSearch.value = '';
        renderVault();
        setActiveSortButton('pt');
    });
}

function setupNavigation() {
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const targetId = e.target.getAttribute('href').replace('#', '');
            const section = document.getElementById(targetId);
            if (section) section.scrollIntoView({ behavior: 'smooth' });
            if (targetId === 'vault' || targetId === 'dashboard') updateDashboard();
        });
    });
}

function setupVoiceSettings() {
    const demoEl = document.getElementById('voiceDemo');
    if (demoEl) demoEl.textContent = `Demo: ${DEMO_PHRASE}`;

    const optionSelect = document.getElementById('voiceSelect');
    const sourceSelect = document.getElementById('voiceSourceSelect');
    const sampleBtn = document.getElementById('voiceSampleBtn');
    const saveBtn = document.getElementById('voiceSaveBtn');
    const disableBtn = document.getElementById('voiceDisableBundledBtn');
    const downloadBtn = document.getElementById('voiceDownloadBtn');
    const bundledApiInput = document.getElementById('voiceBundledApiUrl');

    const saved = loadVoiceSettings();
    Object.assign(voiceState, saved);
    if (!voiceState.selectedVoiceKey && saved.voiceKey) voiceState.selectedVoiceKey = saved.voiceKey;
    hydrateBundledFromMeta();
    normalizeVoiceState();
    syncVoiceControls();
    updateVoiceDiagnostics('Detecting EU-PT system voices...');

    getPortugueseVoiceOptions(userData.speakerGender)
        .then(({ options, bestMaleKey, bestFemaleKey }) => {
            voiceState.detectedSystemOptions = options;
            const suggested = userData.speakerGender === 'male' ? bestMaleKey : bestFemaleKey;
            voiceState.selectedVoiceKey = voiceState.selectedVoiceKey || suggested || options[0]?.key || null;
            if (!voiceState.bundledVoiceKey) {
                const bundledOptions = getBundledVoiceOptions();
                voiceState.bundledVoiceKey = bundledOptions[0]?.key || null;
            }
            if (options.length && voiceState.selectedSource === 'auto') {
                voiceState.selectedSource = 'system';
            }
            reconcileVoiceSelection('system detection complete');
            normalizeVoiceState();
            persistVoiceState();
            syncVoiceControls();
            const detectedStatus = options.length
                ? `Detected ${options.length} EU-PT system ${options.length === 1 ? 'voice' : 'voices'}.`
                : 'No EU-PT system voice detected. Install a system Portuguese (Portugal) voice or download the bundled model.';
            updateVoiceDiagnostics(detectedStatus);
        })
        .catch(() => {
            updateVoiceDiagnostics('Voice detection failed. Try again after enabling audio permissions.');
        });

    if (sourceSelect) {
        sourceSelect.addEventListener('change', e => {
            voiceState.selectedSource = e.target.value;
            normalizeVoiceState();
            reconcileVoiceSelection('manual source change');
            persistVoiceState();
            syncVoiceControls();
            updateVoiceDiagnostics('Voice source updated.');
        });
    }

    if (bundledApiInput) {
        bundledApiInput.addEventListener('change', e => {
            voiceState.bundledApiUrl = (e.target.value || '').trim();
            persistVoiceState();
            updateVoiceDiagnostics(voiceState.bundledApiUrl ? 'Bundled TTS endpoint saved.' : 'Cleared bundled TTS endpoint.');
        });
    }

    if (optionSelect) {
        optionSelect.addEventListener('change', e => {
            const value = e.target.value;
            if (value && value.startsWith('bundled|')) {
                voiceState.bundledVoiceKey = value;
                voiceState.selectedSource = 'bundled';
            } else {
                voiceState.selectedVoiceKey = value || null;
                voiceState.selectedSource = 'system';
            }
            normalizeVoiceState();
            persistVoiceState();
            syncVoiceControls();
            updateVoiceDiagnostics('Voice selection updated.');
        });
    }

    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            persistVoiceState();
            updateVoiceDiagnostics(voiceState.selectedVoiceKey ? 'Default voice saved locally.' : 'Select a voice to save first.');
        });
    }

    if (disableBtn) {
        disableBtn.addEventListener('click', () => {
            voiceState.allowBundled = !voiceState.allowBundled;
            if (!voiceState.allowBundled && voiceState.selectedSource === 'bundled') {
                voiceState.selectedSource = 'system';
            }
            if (bundledDownloadJob?.cancel) {
                bundledDownloadJob.cancel();
                bundledDownloadJob = null;
            }
            if (!voiceState.allowBundled) {
                voiceState.bundled.downloading = false;
                voiceState.bundled.progress = 0;
            }
            normalizeVoiceState();
            reconcileVoiceSelection('bundled toggle');
            persistVoiceState();
            syncVoiceControls();
            updateVoiceDiagnostics(voiceState.allowBundled ? 'Bundled voices enabled.' : 'Bundled voices disabled.');
        });
    }

    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => handleBundledDownloadClick());
    }

    if (sampleBtn) {
        sampleBtn.addEventListener('click', async () => {
            sampleBtn.disabled = true;
            await playPortugueseText(DEMO_PHRASE, { rate: 0.95 });
            sampleBtn.disabled = false;
        });
    }
}

function persistVoiceState(extra = {}) {
    Object.assign(voiceState, extra);
    normalizeVoiceState();
    saveVoiceSettings({
        ...voiceState,
        voiceKey: voiceState.selectedVoiceKey,
        bundledVoiceKey: voiceState.bundledVoiceKey,
        preferredGender: userData.speakerGender,
        bundledApiUrl: voiceState.bundledApiUrl
    });
}

function normalizeVoiceState() {
    if (!voiceState.selectedSource) voiceState.selectedSource = 'auto';
    if (!voiceState.allowBundled && voiceState.selectedSource === 'bundled') {
        voiceState.selectedSource = 'system';
    }
    if (!voiceState.bundledVoiceKey) {
        const bundledOptions = getBundledVoiceOptions();
        voiceState.bundledVoiceKey = bundledOptions[0]?.key || null;
    }
    const bundledOptions = getBundledVoiceOptions();
    const bundledSelected = bundledOptions.find(o => o.key === voiceState.bundledVoiceKey);
    if (bundledSelected && voiceState.bundled.sizeBytes == null) {
        voiceState.bundled.sizeBytes = bundledSelected.sizeBytes;
    }
    const options = getSystemVoiceOptions();
    if (voiceState.selectedVoiceKey && !options.find(o => o.key === voiceState.selectedVoiceKey)) {
        voiceState.selectedVoiceKey = options[0]?.key || null;
    }
    reconcileVoiceSelection();
}

function getSystemVoiceOptions() {
    return Array.isArray(voiceState.detectedSystemOptions) ? voiceState.detectedSystemOptions : [];
}

function resolveVoiceChoice() {
    reconcileVoiceSelection();
    const systemOptions = getSystemVoiceOptions();
    const selectedSystem = systemOptions.find(o => o.key === voiceState.selectedVoiceKey) || systemOptions[0] || null;
    const bundledReady = voiceState.allowBundled && voiceState.bundled.downloaded;
    const bundledOptions = getBundledVoiceOptions();
    const selectedBundled = bundledOptions.find(o => o.key === voiceState.bundledVoiceKey) || bundledOptions[0] || null;

    if (voiceState.selectedSource === 'system' && selectedSystem) {
        return { engine: 'webspeech', source: 'system', voiceKey: selectedSystem.key, label: `${selectedSystem.name} (${selectedSystem.provider})` };
    }
    if (voiceState.selectedSource === 'bundled' && bundledReady) {
        return selectedBundled
            ? { engine: 'bundled', source: 'bundled', voiceKey: selectedBundled.key, label: `${selectedBundled.name} (${selectedBundled.provider})`, bundledVoice: selectedBundled }
            : { engine: 'bundled', source: 'bundled', voiceKey: 'bundled|pt-pt|piper-medium', label: 'Bundled Piper (stub)', bundledVoice: null };
    }

    if (voiceState.selectedSource === 'auto' || !voiceState.selectedSource) {
        if (selectedSystem) return { engine: 'webspeech', source: 'system', voiceKey: selectedSystem.key, label: `${selectedSystem.name} (${selectedSystem.provider})` };
        if (bundledReady && selectedBundled) return { engine: 'bundled', source: 'bundled', voiceKey: selectedBundled.key, label: `${selectedBundled.name} (${selectedBundled.provider})`, bundledVoice: selectedBundled };
    }

    return { engine: null, source: voiceState.selectedSource, voiceKey: null, label: 'No EU-PT voice available yet' };
}

function syncVoiceControls() {
    const optionSelect = document.getElementById('voiceSelect');
    const sourceSelect = document.getElementById('voiceSourceSelect');
    const disableBtn = document.getElementById('voiceDisableBundledBtn');
    const downloadBtn = document.getElementById('voiceDownloadBtn');
    const bundledApiInput = document.getElementById('voiceBundledApiUrl');

    const options = getSystemVoiceOptions();
    const bundledOptions = voiceState.allowBundled ? getBundledVoiceOptions() : [];
    if (optionSelect) {
        const systemOptionsHtml = options.length
            ? `<optgroup label="System EU-PT voices">${options.map(opt => `<option value="${opt.key}">${opt.name} - ${opt.provider}</option>`).join('')}</optgroup>`
            : '<option value="" disabled>No EU-PT system voice found</option>';
        const bundledOptionsHtml = bundledOptions.length
            ? `<optgroup label="Bundled EU-PT voices">${bundledOptions.map(opt => `<option value="${opt.key}">${opt.name} (${opt.provider})</option>`).join('')}</optgroup>`
            : '';
        optionSelect.innerHTML = `${systemOptionsHtml}${bundledOptionsHtml}`;

        if (voiceState.selectedSource === 'bundled' && voiceState.bundledVoiceKey && bundledOptions.find(o => o.key === voiceState.bundledVoiceKey)) {
            optionSelect.value = voiceState.bundledVoiceKey;
        } else if (voiceState.selectedVoiceKey && options.find(o => o.key === voiceState.selectedVoiceKey)) {
            optionSelect.value = voiceState.selectedVoiceKey;
        } else if (voiceState.selectedSource === 'bundled' && bundledOptions.length) {
            optionSelect.value = bundledOptions[0].key;
            voiceState.bundledVoiceKey = bundledOptions[0].key;
        }
    }

    if (sourceSelect) {
        sourceSelect.innerHTML = `
            <option value="auto">Auto (system first)</option>
            <option value="system">System only</option>
            <option value="bundled" ${voiceState.allowBundled ? '' : 'disabled'}>Bundled (Piper)</option>
        `;
        sourceSelect.value = voiceState.selectedSource || 'auto';
    }

    if (disableBtn) disableBtn.textContent = voiceState.allowBundled ? 'Disable Bundled Voices' : 'Enable Bundled Voices';

    if (downloadBtn) {
        const bundledOptions = getBundledVoiceOptions();
        const selectedBundled = bundledOptions.find(o => o.key === voiceState.bundledVoiceKey) || bundledOptions[0];
        const sizeText = selectedBundled?.sizeBytes ? ` (~${formatBytes(selectedBundled.sizeBytes)})` : voiceState.bundled.sizeBytes ? ` (~${formatBytes(voiceState.bundled.sizeBytes)})` : '';
        if (voiceState.bundled.downloading) {
            downloadBtn.textContent = `Cancel Download (${voiceState.bundled.progress}% )`;
            downloadBtn.disabled = false;
        } else if (voiceState.bundled.downloaded) {
            downloadBtn.textContent = 'Delete Bundled Voice';
            downloadBtn.disabled = false;
        } else {
            downloadBtn.textContent = `Download Bundled Voice${sizeText}`;
            downloadBtn.disabled = false;
        }
    }

    if (bundledApiInput) {
        bundledApiInput.value = voiceState.bundledApiUrl || '';
        bundledApiInput.placeholder = 'https://your-tts-endpoint.example.com/tts';
    }
}

function updateVoiceDiagnostics(statusText) {
    const statusEl = document.getElementById('voiceStatus');
    const availabilityEl = document.getElementById('voiceAvailability');
    const selectionEl = document.getElementById('voiceSelection');
    const lastEl = document.getElementById('voiceLastUsed');

    const options = getSystemVoiceOptions();
    const bundledOptions = voiceState.allowBundled ? getBundledVoiceOptions() : [];
    const systemList = options.length ? options.map(o => `${o.name} (${o.provider})`).join(', ') : 'None detected';
    const selectedBundled = bundledOptions.find(o => o.key === voiceState.bundledVoiceKey) || bundledOptions[0];
    const bundledList = bundledOptions.length ? bundledOptions.map(o => `${o.name} (${o.provider})`).join(', ') : 'None available';
    const sizeText = selectedBundled?.sizeBytes ? ` (~${formatBytes(selectedBundled.sizeBytes)})` : voiceState.bundled.sizeBytes ? ` (~${formatBytes(voiceState.bundled.sizeBytes)})` : '';
    const bundledText = !voiceState.allowBundled
        ? 'Disabled'
        : voiceState.bundled.downloading
            ? `Downloading (${voiceState.bundled.progress}%)${sizeText}`
            : voiceState.bundled.downloaded
                ? `Ready (${selectedBundled ? `${selectedBundled.name} (${selectedBundled.provider})` : 'Bundled voice'}${sizeText || ''})`
                : `Not downloaded${sizeText ? `, ${sizeText}` : ''}`;

    const endpointText = voiceState.bundledApiUrl ? 'Bundled HTTP endpoint configured.' : 'Bundled HTTP endpoint not set.';

    if (availabilityEl) availabilityEl.textContent = `System voices: ${systemList}. Bundled voice: ${bundledText}. Bundled options: ${bundledList}. ${endpointText}`;

    const choice = resolveVoiceChoice();
    if (selectionEl) selectionEl.textContent = choice.engine
        ? `Selected: ${choice.label} [${choice.source}].`
        : 'Selected: none (text only until a voice is ready).';

    const last = getLastVoiceUsed();
    const lastText = last?.status === 'played'
        ? `Last playback: ${last.name || 'Voice'} via ${last.provider || last.engine || 'unknown'} (${last.lang || 'pt'})`
        : `Last playback: ${last?.status || 'idle'} (no audio yet).`;
    if (lastEl) lastEl.textContent = lastText;

    const fallbackStatus = statusText || (options.length
        ? `Detected ${options.length} EU-PT system ${options.length === 1 ? 'voice' : 'voices'}.`
        : 'No EU-PT system voice detected yet. Install a system voice or download the bundled model.');
    if (statusEl) {
        statusEl.textContent = fallbackStatus;
        const choice = resolveVoiceChoice();
        const hasVoice = Boolean(choice.engine);
        const needsDownload = voiceState.selectedSource === 'bundled' && !voiceState.bundled.downloaded;
        statusEl.classList.toggle('success', hasVoice);
        statusEl.classList.toggle('error', !hasVoice && needsDownload);
        statusEl.classList.toggle('pending', !hasVoice && !needsDownload);
    }
}

function handleBundledDownloadClick() {
    if (!voiceState.allowBundled) {
        updateVoiceDiagnostics('Enable bundled voices to download the offline model.');
        return;
    }
    if (voiceState.bundled.downloading) {
        if (bundledDownloadJob?.cancel) bundledDownloadJob.cancel();
        clearBundledVoice();
        hydrateBundledFromMeta();
        voiceState.bundled.downloading = false;
        voiceState.bundled.progress = 0;
        persistVoiceState();
        syncVoiceControls();
        updateVoiceDiagnostics('Bundled download canceled.');
        return;
    }

    if (voiceState.bundled.downloaded) {
        clearBundledVoice();
        hydrateBundledFromMeta();
        reconcileVoiceSelection('bundled cleared');
        persistVoiceState();
        syncVoiceControls();
        updateVoiceDiagnostics('Bundled voice cleared from cache.');
        return;
    }

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        updateVoiceDiagnostics('You are offline. Connect to download the bundled voice.');
        return;
    }

    const bundledOptions = getBundledVoiceOptions();
    const selected = bundledOptions.find(o => o.key === voiceState.bundledVoiceKey) || bundledOptions[0];
    const sizeText = selected?.sizeBytes ? formatBytes(selected.sizeBytes) : '50–120 MB';
    const providerText = selected?.provider ? `${selected.provider} ` : '';
    const confirmed = confirm(`Download the bundled EU-PT voice ${providerText}${selected?.name ? `(${selected.name}) ` : ''}(~${sizeText}). Keep the app open during download?`);
    if (!confirmed) {
        updateVoiceDiagnostics('Bundled download canceled.');
        return;
    }

    voiceState.bundled = {
        downloaded: false,
        downloading: true,
        progress: 0,
        sizeBytes: selected?.sizeBytes || voiceState.bundled.sizeBytes,
        provider: selected?.provider || null,
        voiceKey: selected?.key || null,
        url: selected?.url || null
    };
    syncVoiceControls();
    updateVoiceDiagnostics(`Downloading bundled voice (~${sizeText})...`);

    bundledDownloadJob = startBundledVoiceDownload({
        voiceKey: selected?.key,
        onProgress: (progress, voice) => {
            voiceState.bundled.progress = progress;
            voiceState.bundled.downloading = progress < 100;
            if (voice) {
                voiceState.bundled.sizeBytes = voice.sizeBytes;
                voiceState.bundled.provider = voice.provider;
                voiceState.bundled.voiceKey = voice.key;
                voiceState.bundled.url = voice.url;
            }
            if (progress >= 100) {
                hydrateBundledFromMeta();
                reconcileVoiceSelection('bundled download complete');
                persistVoiceState();
                syncVoiceControls();
                updateVoiceDiagnostics('Bundled voice ready and cached locally.');
                bundledDownloadJob = null;
                return;
            }
            syncVoiceControls();
            updateVoiceDiagnostics(`Downloading bundled voice (${progress}%)...`);
        },
        onError: () => {
            updateVoiceDiagnostics('Network download failed; retrying with a simulated fallback...');
        }
    });
}

async function playPortugueseText(text, { rate = 0.95 } = {}) {
    const choice = resolveVoiceChoice();
    if (!choice.engine) {
        const needsBundled = voiceState.selectedSource === 'bundled' || (!getSystemVoiceOptions().length && voiceState.allowBundled);
        const message = needsBundled
            ? 'Download the bundled EU-PT model to enable playback, or install a system voice.'
            : 'No EU-PT voice available yet. Install a system voice or download the bundled one.';
        updateVoiceDiagnostics(message);
        return;
    }
    if (choice.source === 'bundled' && (!voiceState.allowBundled || !voiceState.bundled.downloaded)) {
        updateVoiceDiagnostics('Download the bundled voice to use this source.');
        return;
    }

    await speakWithEngine({
        text,
        lang: 'pt-PT',
        gender: userData.speakerGender,
        engine: choice.engine,
        voiceKey: choice.engine === 'webspeech' ? choice.voiceKey : null,
        httpEndpoint: choice.engine === 'bundled' ? voiceState.bundledApiUrl : null,
        modelUrl: choice.engine === 'bundled' ? (choice.bundledVoice?.url || null) : null,
        rate,
        onStart: () => updateVoiceDiagnostics(`Playing via ${choice.label}.`),
        onEnd: () => updateVoiceDiagnostics(`Playback finished via ${choice.label}.`),
        onVoiceUsed: (meta) => {
            if (meta?.status === 'bundled-endpoint-missing') {
                updateVoiceDiagnostics('Add a bundled TTS API URL to enable playback.');
                return;
            }
            if (meta?.status === 'bundled-http-failed') {
                updateVoiceDiagnostics('Bundled TTS endpoint failed. Check the URL/CORS and try again.');
                return;
            }
            updateVoiceDiagnostics(`Playback started via ${choice.label}.`);
        }
    });
}

function setActiveSortButton(key) {
    const sortPt = document.getElementById('vaultSortPt');
    const sortEn = document.getElementById('vaultSortEn');
    if (sortPt) sortPt.classList.toggle('active', key === 'pt');
    if (sortEn) sortEn.classList.toggle('active', key === 'en');
}

function renderCoachPanel() {
    const container = document.getElementById('aiHints');
    if (!container) return;
    const hints = generateHints();
    if (!hints || !hints.length) {
        container.innerHTML = '<p class="muted">Complete a lesson or quiz to see personalized tips.</p>';
        return;
    }

    container.innerHTML = '';
    const list = document.createElement('div');
    list.className = 'hint-list';

    hints.forEach(hint => {
        const row = document.createElement('div');
        row.className = 'hint-row';
        row.innerHTML = `
            <div class="hint-header">
                <span>${hint.pt} → ${hint.en || ''}</span>
                <span class="hint-meta">Attempts: ${hint.count || 0}</span>
            </div>
            <div class="hint-body">${hint.tip}</div>
            <div class="hint-actions">
                <button class="btn-small" data-pt="${hint.pt}">Hear in EU-PT</button>
                <button class="btn-small" data-review="${hint.key}">Quick review</button>
            </div>
        `;
        list.appendChild(row);
    });
    container.appendChild(list);

    container.querySelectorAll('button[data-pt]').forEach(btn => {
        btn.addEventListener('click', () => {
            const text = btn.getAttribute('data-pt');
            playPortugueseText(text, { rate: 0.9 });
        });
    });

    container.querySelectorAll('button[data-review]').forEach(btn => {
        btn.addEventListener('click', () => {
            const key = btn.getAttribute('data-review');
            const target = userData.learnedWords.find(w => getWordKey(w) === key);
            if (!target) {
                alert('Learn this word in a lesson to review it.');
                return;
            }
            startReviewQuiz([target]);
        });
    });

    renderSkillDashboard();
}

function analyzeSkills() {
    const skillDefs = [
        {
            id: 'nasal',
            label: 'Nasal vowels',
            predicate: word => /ão|õe|ães|ãos|em\b|ens/.test((word.pt || '').toLowerCase()),
            fix: 'Shadow pão/mão/coração slowly at 0.9×, 5 reps each, focusing on nasal release.'
        },
        {
            id: 'gender',
            label: 'Gender agreement',
            predicate: word => {
                const pt = (word.pt || '').toLowerCase();
                return Boolean(word.gendered || word.ptFem || /a$/.test(pt) || /o$/.test(pt));
            },
            fix: 'Drill masc↔fem pairs aloud (obrigado/obrigada, pronto/pronta). Alternate every repetition.'
        },
        {
            id: 'ser_estar',
            label: 'Ser vs. Estar',
            predicate: word => /\bser\b|\bestar\b|sou|estou|és|é|somos|estão/.test((word.pt || '').toLowerCase()),
            fix: 'Build 3 mini sentences for ser (identity), 3 for estar (state/location); read, then record.'
        },
        {
            id: 'por_para',
            label: 'Por vs. Para',
            predicate: word => /\bpor\b|\bpara\b/.test((word.pt || '').toLowerCase()),
            fix: 'Write 4 contrasts: “para Lisboa” (destination) vs “por Lisboa” (through); say each aloud twice.'
        },
        {
            id: 'tenses',
            label: 'Tenses & time',
            predicate: word => /amanh[ãa]|ontem|depois|antes|semana|m[eê]s|ano|vou|fui|iria/.test((word.pt || '').toLowerCase()) || /(will|yesterday|tomorrow|later)/.test((word.en || '').toLowerCase()),
            fix: 'Say past→present→future for one verb (fui/vou/trabalharei); record and compare rhythm.'
        }
    ];

    const attemptsByKey = new Map();
    userData.mistakes.forEach(m => {
        attemptsByKey.set(m.key, { misses: m.count || 0, hits: 0 });
    });
    userData.successes.forEach(s => {
        const existing = attemptsByKey.get(s.key) || { misses: 0, hits: 0 };
        existing.hits += s.count || 0;
        attemptsByKey.set(s.key, existing);
    });

    const stats = skillDefs.map(def => ({ ...def, misses: 0, attempts: 0, accuracy: 100, wordKeys: [], example: null }));

    userData.learnedWords.forEach(word => {
        const matches = skillDefs.filter(def => def.predicate(word));
        if (!matches.length) return;
        const counts = attemptsByKey.get(getWordKey(word)) || { misses: 0, hits: 0 };
        const attempts = (counts.misses || 0) + (counts.hits || 0);
        matches.forEach(def => {
            const stat = stats.find(s => s.id === def.id);
            stat.misses += counts.misses || 0;
            stat.attempts += attempts;
            stat.wordKeys.push(getWordKey(word));
            if (!stat.example || (counts.misses || 0) > (stat.example?.misses || 0)) {
                stat.example = { word, misses: counts.misses || 0 };
            }
        });
    });

    stats.forEach(stat => {
        stat.accuracy = stat.attempts ? Math.round(((stat.attempts - stat.misses) / stat.attempts) * 100) : 100;
    });
    uiState.skillStats = stats;
    return stats;
}

function renderSkillDashboard() {
    const statsEl = document.getElementById('skillStats');
    const fixEl = document.getElementById('fixPackList');
    const stats = analyzeSkills();
    if (!statsEl && !fixEl) return;

    const sorted = stats.sort((a, b) => (b.misses || 0) - (a.misses || 0));

    if (statsEl) {
        if (!stats.length) {
            statsEl.innerHTML = '<p class="muted">Complete a lesson to see skill stats.</p>';
        } else {
            statsEl.innerHTML = sorted
                .map(stat => {
                    const severity = stat.misses >= 3 ? 'focus' : stat.misses >= 1 ? 'watch' : 'solid';
                    const label = severity === 'focus' ? 'Focus' : severity === 'watch' ? 'Watch' : 'Solid';
                    return `
                        <div class="skill-card ${severity}" data-skill="${stat.id}">
                            <div class="skill-title">${stat.label}</div>
                            <div class="skill-accuracy">${stat.accuracy}% accuracy</div>
                            <div class="skill-meta">${stat.misses || 0} misses · ${stat.attempts || 0} attempts</div>
                            <span class="skill-pill">${label}</span>
                        </div>
                    `;
                })
                .join('');
        }
    }

    if (fixEl) {
        const focused = sorted.filter(stat => stat.misses > 0).slice(0, 3);
        const source = focused.length ? focused : sorted.slice(0, 2);
        if (!source.length) {
            fixEl.innerHTML = '<p class="muted">No fix packs yet—make a few attempts first.</p>';
        } else {
            fixEl.innerHTML = source
                .map(stat => {
                    const example = stat.example?.word?.pt ? `Try: ${stat.example.word.pt}` : 'Pick any word in this skill.';
                    return `
                        <div class="fix-pack">
                            <div class="fix-title">${stat.label}</div>
                            <p class="fix-body">${stat.fix}</p>
                            <p class="fix-example muted">${example}</p>
                            <button class="btn-small" data-fix="${stat.id}">Drill now</button>
                        </div>
                    `;
                })
                .join('');

            fixEl.querySelectorAll('button[data-fix]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const skillId = btn.getAttribute('data-fix');
                    startSkillFixPack(skillId);
                });
            });
        }
    }
}

function startSkillFixPack(skillId) {
    const stat = uiState.skillStats.find(s => s.id === skillId);
    if (!stat || !stat.wordKeys.length) {
        alert('No words in this skill yet. Complete a lesson first.');
        return;
    }
    const pool = stat.wordKeys
        .map(key => findWordByKey(key))
        .filter(Boolean);
    if (!pool.length) {
        alert('No review items found for this skill yet.');
        return;
    }
    startReviewQuiz(pool);
}

function findWordByKey(key) {
    const learned = userData.learnedWords.find(w => getWordKey(w) === key);
    if (learned) return learned;
    const fromLessons = getAllLessonsFlat()
        .flatMap(lesson => lesson.words.map(word => ({ ...word, topicId: lesson.topicId, topicTitle: lesson.topicTitle, lessonId: lesson.id, srsLevel: 1, lastReviewed: Date.now() })));
    return fromLessons.find(w => getWordKey(w) === key) || null;
}

// === SPACED REPETITION DRILL MODE (3 rounds: recognition, production, context) ===
function renderRepetitionDrill(lesson) {
    const container = document.getElementById('repetitionDrill');
    if (!container) return;
    
    container.innerHTML = `
        <div class="drill-card">
            <h4>🔄 Spaced Repetition Drill</h4>
            <p class="muted">Master words through 3 rounds: Recognition → Production → Context</p>
            <button class="btn-small" id="startDrillBtn">Start Drill</button>
            <div id="drillStage"></div>
        </div>
    `;
    
    const startBtn = document.getElementById('startDrillBtn');
    if (startBtn) startBtn.addEventListener('click', () => startRepetitionDrill(lesson));
}

function startRepetitionDrill(lesson) {
    const stage = document.getElementById('drillStage');
    if (!stage) return;
    
    const words = shuffleArray(lesson.words).slice(0, Math.min(8, lesson.words.length));
    const state = { round: 1, wordIndex: 0, scores: {} };
    
    const renderRound = () => {
        if (state.round > 3) return finishDrill();
        if (state.wordIndex >= words.length) {
            state.wordIndex = 0;
            state.round += 1;
            return renderRound();
        }
        
        const word = words[state.wordIndex];
        const key = getWordKey(word);
        stage.innerHTML = '';
        
        if (state.round === 1) {
            // Round 1: PT → EN recognition
            stage.innerHTML = `
                <div class="drill-question">
                    <div class="drill-round">Round 1/3: Recognition</div>
                    <div class="drill-prompt">${resolveWordForm(word, userData.speakerGender)}</div>
                    <p>What does this mean?</p>
                    <input type="text" placeholder="Type in English" id="drillInput" />
                    <button class="btn-small" id="drillCheck">Check</button>
                    <div class="drill-feedback" aria-live="polite"></div>
                </div>
            `;
            
            const input = document.getElementById('drillInput');
            const checkBtn = document.getElementById('drillCheck');
            const feedback = stage.querySelector('.drill-feedback');
            
            checkBtn.addEventListener('click', () => {
                const answer = normalizeText(input.value);
                const correct = normalizeText(word.en);
                const passed = answer === correct;
                
                feedback.textContent = passed ? '✅ Correct!' : `❌ Answer: ${word.en}`;
                feedback.className = `drill-feedback ${passed ? 'success' : 'error'}`;
                
                state.scores[key] = (state.scores[key] || 0) + (passed ? 1 : 0);
                
                setTimeout(() => {
                    state.wordIndex += 1;
                    renderRound();
                }, 1200);
            });
            
        } else if (state.round === 2) {
            // Round 2: EN → PT production
            stage.innerHTML = `
                <div class="drill-question">
                    <div class="drill-round">Round 2/3: Production</div>
                    <div class="drill-prompt">${word.en}</div>
                    <p>Type this in Portuguese:</p>
                    <input type="text" placeholder="Type in Portuguese" id="drillInput" />
                    <button class="btn-small" id="drillCheck">Check</button>
                    <div class="drill-feedback" aria-live="polite"></div>
                </div>
            `;
            
            const input = document.getElementById('drillInput');
            const checkBtn = document.getElementById('drillCheck');
            const feedback = stage.querySelector('.drill-feedback');
            
            checkBtn.addEventListener('click', () => {
                const answer = normalizeText(input.value);
                const correct = normalizeText(resolveWordForm(word, userData.speakerGender));
                const passed = answer === correct;
                
                feedback.textContent = passed ? '✅ Excellent!' : `❌ Answer: ${resolveWordForm(word, userData.speakerGender)}`;
                feedback.className = `drill-feedback ${passed ? 'success' : 'error'}`;
                
                state.scores[key] = (state.scores[key] || 0) + (passed ? 1 : 0);
                
                setTimeout(() => {
                    state.wordIndex += 1;
                    renderRound();
                }, 1200);
            });
            
        } else if (state.round === 3) {
            // Round 3: Context sentence completion
            const sentence = lesson.sentences && lesson.sentences.length ? lesson.sentences[0] : null;
            if (sentence) {
                stage.innerHTML = `
                    <div class="drill-question">
                        <div class="drill-round">Round 3/3: Context</div>
                        <div class="drill-prompt">${sentence.pt}</div>
                        <p>Say this sentence aloud:</p>
                        <button class="btn-small" data-speak="${sentence.pt}">🎤 Check Speech</button>
                        <div class="drill-feedback" aria-live="polite"></div>
                    </div>
                `;
                
                const speakBtn = stage.querySelector('button[data-speak]');
                const feedback = stage.querySelector('.drill-feedback');
                
                speakBtn.addEventListener('click', () => {
                    handleSpeakCheck(sentence.pt, feedback, speakBtn, lesson.id);
                    setTimeout(() => {
                        state.wordIndex += 1;
                        renderRound();
                    }, 2500);
                });
            } else {
                state.wordIndex += 1;
                renderRound();
            }
        }
    };
    
    const finishDrill = () => {
        const totalScore = Object.values(state.scores).reduce((a, b) => a + b, 0);
        const maxScore = words.length * 2;
        const percentage = Math.round((totalScore / maxScore) * 100);
        
        stage.innerHTML = `
            <div class="quiz-summary">
                <div class="quiz-score">${percentage}%</div>
                <p>Mastery Score: ${totalScore} / ${maxScore}</p>
                <p class="muted">Great work! Repeat daily to boost retention.</p>
            </div>
        `;
    };
    
    renderRound();
}

// Quiz scoring is now handled inline in the finish() function
