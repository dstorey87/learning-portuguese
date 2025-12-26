import { topics, getAllLessonsFlat } from './data.js';
// VoiceService - audio playback and voice management
import {
    speakWithEngine,
    getPortugueseVoiceOptions,
    startBundledVoiceDownload,
    getDownloadableVoices,
    markVoiceDownloaded
} from './src/services/VoiceService.js';
// TTSService - text-to-speech server integration
import * as aiTts from './src/services/TTSService.js';
// Speech recognition (Whisper/Web Speech API)
import * as aiSpeech from './ai-speech.js';
// AIService - Ollama AI integration
import * as aiTutor from './src/services/AIService.js';
import { getWordKnowledge, generateBasicPronunciationTip, getPronunciationChallengeType } from './word-knowledge.js';
// AuthService - authentication, hearts, XP, streaks
import {
    getHearts,
    hasHearts,
    loseHeart,
    addXP,
    updateStreak,
    getXP,
    getStreak,
    loginAdmin,
    logout,
    isAdmin,
    startHeartRefillTimer,
    getTimeToNextHeart,
    formatRefillTime,
    completeLesson as authCompleteLesson,
    AUTH_CONFIG as AUTH_CONSTANTS
} from './src/services/AuthService.js';

const APP_VERSION = '0.9.0';
const STORAGE_KEY = 'portugueseLearningData';
const VOICE_STORAGE_KEY = 'portugueseVoiceSettings';
const THEME_STORAGE_KEY = 'portugueseTheme';
const NOTEPAD_STORAGE_KEY = 'portugueseNotepad';
const FLASHCARDS_STORAGE_KEY = 'portugueseFlashcards';
const DEMO_PHRASE = 'Olá! Vamos praticar português europeu: pão, coração, obrigado, vinte e oito.';

// Debounce utility to prevent UI flicker from frequent updates
const debounceTimers = {};
function debounce(key, fn, delay = 100) {
    if (debounceTimers[key]) clearTimeout(debounceTimers[key]);
    debounceTimers[key] = setTimeout(() => {
        debounceTimers[key] = null;
        fn();
    }, delay);
}

// Throttle utility for frequent operations (reserved for future use)
// eslint-disable-next-line no-unused-vars
function throttle(fn, limit = 200) {
    let inThrottle = false;
    return function(...args) {
        if (!inThrottle) {
            fn.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}
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

// Real-world dialogue scenarios
const DIALOGUES = [
    {
        id: 'cafe-order',
        title: '☕ Ordering at a Café',
        difficulty: 'beginner',
        scene: 'You walk into a traditional Portuguese café in Lisboa.',
        nodes: [
            {
                id: 'start',
                speaker: 'Barista',
                text: 'Bom dia! O que deseja?',
                en: 'Good morning! What would you like?',
                choices: [
                    { text: 'Um café, por favor.', next: 'coffee-ordered', correct: true },
                    { text: 'Uma cerveja, por favor.', next: 'wrong-time', correct: false },
                    { text: 'Não, obrigado.', next: 'decline', correct: false }
                ]
            },
            {
                id: 'coffee-ordered',
                speaker: 'Barista',
                text: 'Café simples ou galão?',
                en: 'Espresso or latte?',
                choices: [
                    { text: 'Café simples.', next: 'simple-coffee', correct: true },
                    { text: 'Galão, por favor.', next: 'galao', correct: true },
                    { text: 'Com leite.', next: 'milk-clarify', correct: false }
                ]
            },
            {
                id: 'simple-coffee',
                speaker: 'Barista',
                text: 'Perfeito! São 70 cêntimos.',
                en: 'Perfect! That\'s 70 cents.',
                grammarNote: 'São = "are" (plural of ser for prices)',
                cultural: '☕ Portuguese espresso is strong and served in small cups!',
                end: true,
                success: true
            },
            {
                id: 'galao',
                speaker: 'Barista',
                text: 'Ótimo! Um euro e vinte.',
                en: 'Great! One euro twenty.',
                cultural: '🥛 Galão is Portuguese latte, served in a tall glass.',
                end: true,
                success: true
            },
            {
                id: 'wrong-time',
                speaker: 'Barista',
                text: 'Cerveja? São nove da manhã!',
                en: 'Beer? It\'s 9 in the morning!',
                hint: 'Cafés serve coffee in the morning, beer in the evening.',
                next: 'start'
            },
            {
                id: 'decline',
                speaker: 'Barista',
                text: 'Está bem. Tenha um bom dia!',
                en: 'Okay. Have a good day!',
                end: true,
                success: false
            },
            {
                id: 'milk-clarify',
                speaker: 'Barista',
                text: 'Quer dizer galão?',
                en: 'You mean galão?',
                hint: '"Com leite" is ambiguous. Use "galão" for latte.',
                next: 'coffee-ordered'
            }
        ]
    },
    {
        id: 'directions',
        title: '🗺️ Asking for Directions',
        difficulty: 'beginner',
        scene: 'You\'re lost in Porto and need to find the metro.',
        nodes: [
            {
                id: 'start',
                speaker: 'You',
                text: '[Choose how to ask]',
                en: 'How do you start?',
                choices: [
                    { text: 'Desculpe, onde fica o metro?', next: 'polite-ask', correct: true },
                    { text: 'Metro?', next: 'too-abrupt', correct: false },
                    { text: 'Olá! Preciso de ajuda.', next: 'friendly-start', correct: true }
                ]
            },
            {
                id: 'polite-ask',
                speaker: 'Local',
                text: 'O metro? Siga em frente e vire à direita.',
                en: 'The metro? Go straight and turn right.',
                grammarNote: 'Siga = command form of "seguir" (to follow)',
                cultural: '🚇 Porto has 6 metro lines, all color-coded.',
                end: true,
                success: true
            },
            {
                id: 'too-abrupt',
                speaker: 'Local',
                text: '[ignores you]',
                en: '[They walk past without answering]',
                hint: 'Always start with "Desculpe" or "Por favor" when asking strangers.',
                next: 'start'
            },
            {
                id: 'friendly-start',
                speaker: 'Local',
                text: 'Claro! O que procura?',
                en: 'Of course! What are you looking for?',
                choices: [
                    { text: 'O metro, por favor.', next: 'polite-ask', correct: true },
                    { text: 'A estação.', next: 'which-station', correct: false }
                ]
            },
            {
                id: 'which-station',
                speaker: 'Local',
                text: 'Que estação? Comboio ou metro?',
                en: 'Which station? Train or metro?',
                hint: 'Be specific: "o metro" or "a estação de comboios"',
                next: 'friendly-start'
            }
        ]
    },
    {
        id: 'market',
        title: '🛒 Shopping at the Market',
        difficulty: 'intermediate',
        scene: 'You\'re buying fruit at a local market in Lisbon.',
        nodes: [
            {
                id: 'start',
                speaker: 'Vendor',
                text: 'Bom dia! Quer experimentar?',
                en: 'Good morning! Want to try some?',
                choices: [
                    { text: 'Sim, por favor!', next: 'try-fruit', correct: true },
                    { text: 'Quanto custa?', next: 'ask-price', correct: true },
                    { text: 'Não, obrigado.', next: 'decline', correct: false }
                ]
            },
            {
                id: 'try-fruit',
                speaker: 'Vendor',
                text: 'Tome! Estas laranjas são do Algarve.',
                en: 'Here! These oranges are from Algarve.',
                cultural: '🍊 Algarve oranges are famous for their sweetness!',
                choices: [
                    { text: 'Delicioso! Quero um quilo.', next: 'buy-kilo', correct: true },
                    { text: 'Muito bom! Quanto é?', next: 'ask-price', correct: true }
                ]
            },
            {
                id: 'buy-kilo',
                speaker: 'Vendor',
                text: 'Um quilo? São dois euros.',
                en: 'One kilo? That\'s two euros.',
                grammarNote: 'Quilo = kilogram (Portuguese uses metric)',
                end: true,
                success: true
            },
            {
                id: 'ask-price',
                speaker: 'Vendor',
                text: 'Dois euros o quilo.',
                en: 'Two euros per kilo.',
                next: 'try-fruit'
            },
            {
                id: 'decline',
                speaker: 'Vendor',
                text: 'Está bem. Volte sempre!',
                en: 'Okay. Come back anytime!',
                end: true,
                success: false
            }
        ]
    }
];

// Grammar context cards - shown when relevant
const GRAMMAR_CARDS = {
    'ser_estar': {
        title: 'Ser vs. Estar',
        rule: 'SER = permanent identity, ESTAR = temporary state/location',
        examples: [
            { pt: 'Eu sou professor.', en: 'I am a teacher (permanent).', correct: 'ser' },
            { pt: 'Eu estou cansado.', en: 'I am tired (temporary).', correct: 'estar' },
            { pt: 'Ela é bonita.', en: 'She is beautiful (characteristic).', correct: 'ser' },
            { pt: 'Ela está em casa.', en: 'She is at home (location).', correct: 'estar' }
        ],
        triggers: ['sou', 'é', 'são', 'estou', 'está', 'estão']
    },
    'por_para': {
        title: 'Por vs. Para',
        rule: 'POR = through/by/cause, PARA = for/to/destination',
        examples: [
            { pt: 'Obrigado por ajudar.', en: 'Thanks for helping (cause).', correct: 'por' },
            { pt: 'Isto é para ti.', en: 'This is for you (recipient).', correct: 'para' },
            { pt: 'Viajo para Lisboa.', en: 'I travel to Lisbon (destination).', correct: 'para' },
            { pt: 'Passo por aqui.', en: 'I pass through here.', correct: 'por' }
        ],
        triggers: ['por', 'para']
    },
    'gender': {
        title: 'Gender Agreement',
        rule: 'Adjectives must match noun gender: -o (masc), -a (fem)',
        examples: [
            { pt: 'O gato preto', en: 'The black cat (masc)', correct: 'preto' },
            { pt: 'A casa branca', en: 'The white house (fem)', correct: 'branca' },
            { pt: 'Obrigado (♂) / Obrigada (♀)', en: 'Thank you', note: 'Even "thank you" changes!' }
        ],
        triggers: ['obrigado', 'obrigada', 'pronto', 'pronta', 'bonito', 'bonita']
    },
    'plurals': {
        title: 'Plural Formation',
        rule: 'Most: add -s. Ends in -ão: → -ões/-ães/-ãos',
        examples: [
            { pt: 'pão → pães', en: 'bread → breads' },
            { pt: 'coração → corações', en: 'heart → hearts' },
            { pt: 'mão → mãos', en: 'hand → hands' },
            { pt: 'casa → casas', en: 'house → houses (regular)' }
        ],
        triggers: ['pães', 'mãos', 'corações']
    }
};

const voiceDefaults = {
    selectedSource: 'auto',
    selectedVoiceKey: null,
    speed: 0.6,
    allowBundled: true,
    bundledVoiceKey: null,
    bundledApiUrl: '',
    bundled: { downloaded: false, downloading: false, progress: 0, sizeBytes: null, provider: null, url: null, voiceKey: null },
    detectedSystemOptions: []
};

const voiceState = structuredClone(voiceDefaults);

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
    setupNotepad();
    setupFlashcards();
    setupTranslator();
    setupVoiceSpeedControl();
    renderCoachPanel();
    updatePlanAccess();
    updateDashboard();
    renderDialogues();
    initAITutor();
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

// =========== DUOLINGO-STYLE LESSON FLOW ===========
// Progressive challenge system: one challenge at a time with smooth transitions

function startLesson(lessonId) {
    const lesson = getAllLessonsFlat().find(l => l.id === lessonId);
    if (!lesson) return;
    if (lesson.gated && !userData.isPremium) {
        showPaywall();
        return;
    }
    
    // Check hearts before starting (unless admin)
    if (!hasHearts()) {
        showHeartsModal();
        return;
    }

    userData.activeLesson = lessonId;
    uiState.lessonStartMs = Date.now();
    saveUserData();

    // Build challenge sequence
    const challenges = buildLessonChallenges(lesson);
    
    // Initialize lesson state
    const lessonState = {
        lesson,
        challenges,
        currentIndex: 0,
        correct: 0,
        mistakes: 0,
        startTime: Date.now(),
        wrongAnswers: [] // Track which words user got wrong for retry guidance
    };

    const section = document.querySelector('.learning-section');
    if (!section) return;
    
    // Get current hearts for display
    const hearts = getHearts();
    const heartsDisplay = hearts === Infinity 
        ? '<span class="unlimited-hearts">∞</span>' 
        : '❤️'.repeat(hearts) + '🖤'.repeat(AUTH_CONSTANTS.MAX_HEARTS - hearts);
    
    section.innerHTML = `
        <div class="lesson-flow">
            <div class="lesson-flow-header">
                <button class="btn-back" id="backToLessons">✕</button>
                <div class="lesson-progress-bar">
                    <div class="lesson-progress-fill" id="lessonProgressFill"></div>
                </div>
                <div class="lesson-hearts" id="lessonHearts">${heartsDisplay}</div>
            </div>
            <div class="lesson-challenge-container" id="challengeContainer"></div>
        </div>
    `;

    document.getElementById('backToLessons').addEventListener('click', () => {
        if (confirm('Exit lesson? Your progress will be saved.')) {
            backToLessons();
        }
    });

    // Start first challenge
    renderChallenge(lessonState);
}

function buildLessonChallenges(lesson) {
    const challenges = [];
    const words = lesson.words || [];
    const sentences = lesson.sentences || [];
    
    // Phase 1: Learn new words (listen & see)
    words.forEach((word, idx) => {
        challenges.push({
            type: 'learn-word',
            word,
            phase: 'learn',
            index: idx
        });
    });
    
    // Phase 2: Pronunciation practice - say each word
    // Take a subset of words for pronunciation practice
    const pronWords = shuffleArray([...words]).slice(0, Math.min(4, words.length));
    pronWords.forEach(word => {
        challenges.push({
            type: 'pronunciation',
            word,
            phase: 'pronounce',
            maxAttempts: 3
        });
    });
    
    // Phase 3: Multiple choice quizzes (batches of 4-5)
    const shuffledWords = shuffleArray([...words]);
    shuffledWords.forEach(word => {
        challenges.push({
            type: 'mcq',
            word,
            phase: 'practice',
            options: buildQuizOptions(word, words)
        });
    });
    
    // Phase 4: Type the Portuguese (fill in blank)
    const fillWords = shuffleArray([...words]).slice(0, Math.min(5, words.length));
    fillWords.forEach(word => {
        challenges.push({
            type: 'type-answer',
            word,
            phase: 'practice'
        });
    });
    
    // Phase 5: Listen and type
    const listenWords = shuffleArray([...words]).slice(0, Math.min(3, words.length));
    listenWords.forEach(word => {
        challenges.push({
            type: 'listen-type',
            word,
            phase: 'practice'
        });
    });
    
    // Phase 6: Sentences
    sentences.forEach(sentence => {
        challenges.push({
            type: 'sentence',
            sentence,
            phase: 'apply'
        });
    });
    
    return challenges;
}

function renderChallenge(state) {
    const container = document.getElementById('challengeContainer');
    const progressFill = document.getElementById('lessonProgressFill');
    
    if (!container) return;
    
    // Update progress bar
    const progress = (state.currentIndex / state.challenges.length) * 100;
    if (progressFill) progressFill.style.width = `${progress}%`;
    
    // Check if lesson complete
    if (state.currentIndex >= state.challenges.length) {
        renderLessonComplete(state);
        return;
    }
    
    const challenge = state.challenges[state.currentIndex];
    
    // Animate out old challenge, animate in new
    container.classList.add('challenge-exit');
    
    setTimeout(() => {
        container.innerHTML = '';
        container.classList.remove('challenge-exit');
        container.classList.add('challenge-enter');
        
        switch (challenge.type) {
            case 'learn-word':
                renderLearnWordChallenge(container, challenge, state);
                break;
            case 'pronunciation':
                renderPronunciationChallenge(container, challenge, state);
                break;
            case 'mcq':
                renderMCQChallenge(container, challenge, state);
                break;
            case 'type-answer':
                renderTypeChallenge(container, challenge, state);
                break;
            case 'listen-type':
                renderListenTypeChallenge(container, challenge, state);
                break;
            case 'sentence':
                renderSentenceChallenge(container, challenge, state);
                break;
        }
        
        setTimeout(() => container.classList.remove('challenge-enter'), 300);
    }, 200);
}

function renderLearnWordChallenge(container, challenge, state) {
    const word = challenge.word;
    const resolved = resolveWordForm(word, userData.speakerGender);
    const alt = getAlternateForm(word, userData.speakerGender);
    
    // Look up rich word knowledge
    const knowledge = getWordKnowledge(resolved);
    const hasKnowledge = knowledge !== null;
    
    // Build the rich teaching card
    let cardHTML = `
        <div class="challenge-card learn-card learn-card-rich">
            <div class="challenge-instruction">📚 Learn This Word</div>
            
            <div class="learn-word-header">
                <div class="learn-portuguese-main">${escapeHtml(resolved)}</div>
                ${hasKnowledge && knowledge.ipa ? `<div class="learn-ipa">${escapeHtml(knowledge.ipa)}</div>` : ''}
                <div class="learn-english-main">${escapeHtml(word.en)}</div>
                ${alt ? `<div class="learn-alt-form">Also: ${escapeHtml(alt)}</div>` : ''}
                <button class="btn-listen-main" id="listenBtn">🔊 Listen</button>
            </div>`;
    
    // Pronunciation section - always show
    cardHTML += `
            <div class="learn-section pronunciation-section">
                <div class="section-header">🗣️ Pronunciation</div>`;
    
    if (hasKnowledge && knowledge.pronunciation) {
        const p = knowledge.pronunciation;
        cardHTML += `
                <div class="pronunciation-guide">${escapeHtml(p.guide)}</div>
                ${p.breakdown ? `<div class="pronunciation-breakdown">Breakdown: ${escapeHtml(p.breakdown)}</div>` : ''}
                <div class="pronunciation-tip">
                    <span class="tip-icon">💡</span>
                    <span class="tip-text">${escapeHtml(p.tip)}</span>
                </div>
                ${p.commonMistake ? `<div class="common-mistake">
                    <span class="mistake-icon">⚠️</span>
                    <span class="mistake-label">Common mistake:</span> ${escapeHtml(p.commonMistake)}
                </div>` : ''}
                ${p.audioFocus ? `<div class="audio-focus">
                    <span class="focus-icon">👂</span>
                    ${escapeHtml(p.audioFocus)}
                </div>` : ''}`;
    } else {
        // Fallback pronunciation tip based on word analysis
        const tip = generateBasicPronunciationTip(resolved);
        const challengeType = getPronunciationChallengeType(resolved);
        cardHTML += `
                <div class="pronunciation-tip">
                    <span class="tip-icon">💡</span>
                    <span class="tip-text">${escapeHtml(tip)}</span>
                </div>
                <div class="challenge-type-badge ${challengeType}">${challengeType}</div>`;
    }
    cardHTML += `</div>`;
    
    // Memory & Etymology section
    if (hasKnowledge && (knowledge.etymology || knowledge.memoryTrick)) {
        cardHTML += `
            <div class="learn-section memory-section">
                <div class="section-header">🧠 Remember It</div>
                ${knowledge.etymology ? `<div class="etymology">
                    <span class="etymology-label">Origin:</span> ${escapeHtml(knowledge.etymology)}
                </div>` : ''}
                ${knowledge.memoryTrick ? `<div class="memory-trick">
                    <span class="trick-icon">💭</span>
                    ${escapeHtml(knowledge.memoryTrick)}
                </div>` : ''}
            </div>`;
    }
    
    // Examples section
    if (hasKnowledge && knowledge.examples && knowledge.examples.length > 0) {
        cardHTML += `
            <div class="learn-section examples-section">
                <div class="section-header">📝 Example Sentences</div>
                <div class="examples-list">`;
        
        knowledge.examples.forEach((ex, i) => {
            cardHTML += `
                    <div class="example-item" data-example="${i}">
                        <div class="example-pt">
                            ${escapeHtml(ex.pt)}
                            <button class="btn-listen-example" data-text="${escapeHtml(ex.pt)}" title="Listen">🔊</button>
                        </div>
                        <div class="example-en">${escapeHtml(ex.en)}</div>
                        ${ex.context ? `<div class="example-context">${escapeHtml(ex.context)}</div>` : ''}
                    </div>`;
        });
        
        cardHTML += `
                </div>
            </div>`;
    }
    
    // Grammar notes
    if (hasKnowledge && knowledge.grammar) {
        cardHTML += `
            <div class="learn-section grammar-section">
                <div class="section-header">📖 Grammar Note</div>
                <div class="grammar-note">${escapeHtml(knowledge.grammar)}</div>
            </div>`;
    }
    
    // Conjugation table for verbs
    if (hasKnowledge && knowledge.conjugation) {
        const conj = knowledge.conjugation;
        cardHTML += `
            <div class="learn-section conjugation-section">
                <div class="section-header">🔄 Present Tense</div>
                <div class="conjugation-table">
                    ${Object.entries(conj.present || {}).map(([pronoun, form]) => `
                        <div class="conj-row">
                            <span class="conj-pronoun">${escapeHtml(pronoun)}</span>
                            <span class="conj-form">${escapeHtml(form)}</span>
                        </div>
                    `).join('')}
                </div>
                ${conj.note ? `<div class="conj-note">${escapeHtml(conj.note)}</div>` : ''}
            </div>`;
    }
    
    // Usage context
    if (hasKnowledge && knowledge.usage) {
        const u = knowledge.usage;
        cardHTML += `
            <div class="learn-section usage-section">
                <div class="section-header">🎯 When to Use</div>
                <div class="usage-formality">Formality: <span class="formality-badge">${escapeHtml(u.formality)}</span></div>
                <div class="usage-context">${escapeHtml(u.context)}</div>
                ${u.alternative ? `<div class="usage-alternative">
                    <span class="alt-label">Alternative:</span> ${escapeHtml(u.alternative)}
                </div>` : ''}
            </div>`;
    }
    
    // Cultural note
    if (hasKnowledge && knowledge.cultural) {
        cardHTML += `
            <div class="learn-section cultural-section">
                <div class="section-header">🇵🇹 Cultural Insight</div>
                <div class="cultural-note">${escapeHtml(knowledge.cultural)}</div>
            </div>`;
    }
    
    // Footer with actions
    cardHTML += `
            <div class="learn-card-actions">
                <button class="btn-save-word" id="saveWordBtn" data-pt="${escapeHtml(resolved)}" data-en="${escapeHtml(word.en)}">💾 Save to Flashcards</button>
                <button class="btn-practice-say" id="practiceBtn">🎤 Practice Saying It</button>
            </div>
            <div class="challenge-footer">
                <div class="word-progress-indicator">Word ${challenge.index + 1} of ${state.challenges.filter(c => c.type === 'learn-word').length}</div>
                <button class="btn-continue" id="continueBtn">I've Got It! Continue →</button>
            </div>
        </div>
    `;
    
    container.innerHTML = cardHTML;
    
    // Auto-play audio after a short delay
    setTimeout(() => playWord(resolved), 400);
    
    // Event listeners
    document.getElementById('listenBtn').addEventListener('click', () => playWord(resolved));
    
    document.getElementById('saveWordBtn').addEventListener('click', (e) => {
        const btn = e.target;
        saveToFlashcards(btn.dataset.pt, btn.dataset.en, state.lesson.title);
        btn.textContent = '✓ Saved!';
        btn.disabled = true;
    });
    
    document.getElementById('practiceBtn').addEventListener('click', async () => {
        const btn = document.getElementById('practiceBtn');
        btn.textContent = '🎤 Listening...';
        btn.disabled = true;
        
        try {
            // Use the speech recognition system
            const result = await aiSpeech.listenAndTranscribe();
            if (result && result.text) {
                const score = aiSpeech.scorePronunciation(result.text, resolved);
                showPronunciationFeedback(container, score, resolved, result.text);
            } else {
                showPronunciationFeedback(container, null, resolved, null);
            }
        } catch (err) {
            console.error('Speech recognition error:', err);
            showPronunciationFeedback(container, null, resolved, null);
        }
        
        btn.textContent = '🎤 Try Again';
        btn.disabled = false;
    });
    
    // Listen buttons for examples
    container.querySelectorAll('.btn-listen-example').forEach(btn => {
        btn.addEventListener('click', () => {
            const text = btn.dataset.text;
            playWord(text);
        });
    });
    
    document.getElementById('continueBtn').addEventListener('click', () => {
        state.currentIndex++;
        renderChallenge(state);
    });
}

function showPronunciationFeedback(container, scoreResult, expected, transcribed) {
    // Remove any existing feedback
    const existingFeedback = container.querySelector('.pronunciation-feedback');
    if (existingFeedback) existingFeedback.remove();
    
    const feedbackDiv = document.createElement('div');
    feedbackDiv.className = 'pronunciation-feedback';
    
    if (!scoreResult || scoreResult.score === null) {
        feedbackDiv.innerHTML = `
            <div class="feedback-error">
                <span class="feedback-icon">❓</span>
                <span>Couldn't hear you clearly. Make sure your microphone is working and try again.</span>
            </div>
        `;
    } else {
        const score = scoreResult.score;
        let ratingClass = 'needs-work';
        let ratingText = 'Keep practicing';
        let icon = '🔄';
        
        if (score >= 90) {
            ratingClass = 'excellent';
            ratingText = 'Excellent! 🎉';
            icon = '✨';
        } else if (score >= 70) {
            ratingClass = 'good';
            ratingText = 'Good job!';
            icon = '👍';
        } else if (score >= 50) {
            ratingClass = 'fair';
            ratingText = 'Getting there';
            icon = '💪';
        }
        
        feedbackDiv.innerHTML = `
            <div class="feedback-result ${ratingClass}">
                <div class="feedback-score">
                    <span class="score-icon">${icon}</span>
                    <span class="score-value">${Math.round(score)}%</span>
                    <span class="score-label">${ratingText}</span>
                </div>
                <div class="feedback-comparison">
                    <div class="expected-text">
                        <span class="comparison-label">Expected:</span>
                        <span class="comparison-value">${escapeHtml(expected)}</span>
                    </div>
                    <div class="heard-text">
                        <span class="comparison-label">We heard:</span>
                        <span class="comparison-value">${escapeHtml(transcribed || '(nothing)')}</span>
                    </div>
                </div>
                ${score < 70 ? `
                    <div class="feedback-tip">
                        <span class="tip-icon">💡</span>
                        Listen to the audio again and focus on matching the rhythm and sounds.
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    // Insert after practice button
    const actionsDiv = container.querySelector('.learn-card-actions');
    if (actionsDiv) {
        actionsDiv.after(feedbackDiv);
    }
}

/**
 * Render a dedicated pronunciation challenge with robust feedback
 * This is a standalone challenge phase where users must achieve a passing score
 */
function renderPronunciationChallenge(container, challenge, state) {
    const word = challenge.word;
    const resolved = resolveWordForm(word, userData.speakerGender);
    const knowledge = getWordKnowledge(resolved) || getWordKnowledge(word.pt);
    const maxAttempts = challenge.maxAttempts || 3;
    const passScore = 65; // Minimum score to pass
    
    // Get pronunciation info from word knowledge
    const pronInfo = knowledge?.pronunciation;
    const hasPronounciation = pronInfo && pronInfo.ipa;
    
    // Count how many pronunciation challenges in this lesson
    const pronChallenges = state.challenges.filter(c => c.type === 'pronunciation');
    const currentPronIndex = pronChallenges.findIndex(c => c === challenge) + 1;
    
    container.innerHTML = `
        <div class="challenge-card pronunciation-card" id="pronunciationCard">
            <div class="challenge-header">
                <div class="challenge-instruction">🎤 Say this word aloud</div>
                <div class="attempt-tracker" id="attemptTracker">
                    Attempt <span id="attemptNum">1</span> of ${maxAttempts}
                </div>
            </div>
            
            <div class="pronunciation-target">
                <div class="target-word" id="targetWord">${escapeHtml(resolved)}</div>
                ${hasPronounciation ? `
                    <div class="pronunciation-guide">
                        <span class="ipa">[${escapeHtml(pronInfo.ipa)}]</span>
                        ${pronInfo.breakdown ? `<span class="breakdown">${escapeHtml(pronInfo.breakdown)}</span>` : ''}
                    </div>
                ` : ''}
                <button class="btn-listen-large" id="listenBtn">🔊 Listen First</button>
            </div>
            
            ${pronInfo?.tip ? `
                <div class="pronunciation-tip">
                    <span class="tip-icon">💡</span>
                    <span class="tip-text">${escapeHtml(pronInfo.tip)}</span>
                </div>
            ` : ''}
            
            <div class="pronunciation-meaning">
                <span class="meaning-label">Meaning:</span>
                <span class="meaning-text">${escapeHtml(word.en)}</span>
            </div>
            
            <div class="pronunciation-controls">
                <button class="btn-record" id="recordBtn">
                    <span class="record-icon">🎙️</span>
                    <span class="record-text">Hold to Speak</span>
                </button>
                <div class="recording-indicator hidden" id="recordingIndicator">
                    <span class="pulse"></span> Listening...
                </div>
            </div>
            
            <div class="pronunciation-result hidden" id="resultArea">
                <div class="result-score" id="resultScore"></div>
                <div class="result-comparison" id="resultComparison"></div>
                <div class="result-feedback" id="resultFeedback"></div>
                <div class="result-tips" id="resultTips"></div>
            </div>
            
            <div class="pronunciation-actions hidden" id="actionArea">
                <button class="btn-retry" id="retryBtn">🔄 Try Again</button>
                <button class="btn-continue" id="continueBtn">Continue →</button>
            </div>
            
            <div class="challenge-footer">
                <div class="word-progress-indicator">Pronunciation ${currentPronIndex} of ${pronChallenges.length}</div>
            </div>
        </div>
    `;
    
    // State for this challenge
    let currentAttempt = 0;
    let bestScore = null;
    let passed = false;
    
    // Play audio on click
    document.getElementById('listenBtn').addEventListener('click', () => {
        playWord(resolved);
    });
    
    // Auto-play on load
    setTimeout(() => playWord(resolved), 300);
    
    const recordBtn = document.getElementById('recordBtn');
    const recordingIndicator = document.getElementById('recordingIndicator');
    const resultArea = document.getElementById('resultArea');
    const actionArea = document.getElementById('actionArea');
    const attemptNumSpan = document.getElementById('attemptNum');
    
    // Use click for simplicity (not hold-to-speak)
    recordBtn.addEventListener('click', async () => {
        if (passed || currentAttempt >= maxAttempts) return;
        
        currentAttempt++;
        attemptNumSpan.textContent = currentAttempt;
        
        // Show recording state
        recordBtn.classList.add('hidden');
        recordingIndicator.classList.remove('hidden');
        resultArea.classList.add('hidden');
        actionArea.classList.add('hidden');
        
        try {
            // Use the enhanced testPronunciation function
            const result = await aiSpeech.testPronunciation(resolved, {
                maxAttempts: 1, // One attempt per click
                timeoutMs: 5000,
                wordKnowledge: knowledge
            });
            
            const score = result.bestScore;
            
            // Update best score
            if (!bestScore || score.score > bestScore.score) {
                bestScore = score;
            }
            
            // Check if passed
            if (score.score >= passScore) {
                passed = true;
            }
            
            // Hide recording indicator
            recordingIndicator.classList.add('hidden');
            resultArea.classList.remove('hidden');
            
            // Display results
            displayPronunciationResult(score, resolved, currentAttempt, maxAttempts, passed, passScore);
            
        } catch (err) {
            console.error('Pronunciation test error:', err);
            recordingIndicator.classList.add('hidden');
            recordBtn.classList.remove('hidden');
            
            // Show error in result area
            resultArea.classList.remove('hidden');
            document.getElementById('resultScore').innerHTML = `
                <div class="score-display error">
                    <span class="score-emoji">❌</span>
                    <span class="score-text">Error</span>
                </div>
            `;
            document.getElementById('resultFeedback').innerHTML = `
                <div class="feedback-error">${escapeHtml(err.message)}</div>
            `;
            document.getElementById('resultComparison').innerHTML = '';
            document.getElementById('resultTips').innerHTML = '';
            
            actionArea.classList.remove('hidden');
        }
    });
    
    function displayPronunciationResult(score, expected, attempt, maxAttempts, hasPassed, passThreshold) {
        const scoreDisplay = document.getElementById('resultScore');
        const comparison = document.getElementById('resultComparison');
        const feedback = document.getElementById('resultFeedback');
        const tips = document.getElementById('resultTips');
        
        // Score display with visual meter
        const scorePercent = Math.round(score.score);
        const scoreClass = scorePercent >= 90 ? 'excellent' : 
                          scorePercent >= 75 ? 'good' : 
                          scorePercent >= 60 ? 'fair' : 
                          scorePercent >= 40 ? 'needs-work' : 'poor';
        
        scoreDisplay.innerHTML = `
            <div class="score-display ${scoreClass}">
                <div class="score-meter">
                    <div class="score-fill" style="width: ${scorePercent}%"></div>
                    <div class="pass-marker" style="left: ${passThreshold}%"></div>
                </div>
                <div class="score-value">
                    <span class="score-emoji">${score.emoji || getScoreEmoji(scorePercent)}</span>
                    <span class="score-number">${scorePercent}%</span>
                    <span class="score-label">${score.rating || 'Score'}</span>
                </div>
            </div>
        `;
        
        // Comparison - what we heard vs expected
        const heard = score.transcribed || score.matchedWords?.join(' ') || '(nothing detected)';
        comparison.innerHTML = `
            <div class="comparison-row">
                <span class="comparison-label">Expected:</span>
                <span class="comparison-value expected">${escapeHtml(expected)}</span>
            </div>
            <div class="comparison-row">
                <span class="comparison-label">We heard:</span>
                <span class="comparison-value heard">${escapeHtml(heard)}</span>
            </div>
            ${score.closeMatches?.length > 0 ? `
                <div class="close-matches">
                    <span class="match-label">Close matches:</span>
                    ${score.closeMatches.map(m => `
                        <span class="match-item">"${escapeHtml(m.heard)}" ≈ "${escapeHtml(m.expected)}"</span>
                    `).join('')}
                </div>
            ` : ''}
        `;
        
        // Main feedback
        feedback.innerHTML = `
            <div class="feedback-message ${hasPassed ? 'passed' : ''}">${score.feedback || ''}</div>
        `;
        
        // Tips for improvement
        if (score.tips && score.tips.length > 0) {
            tips.innerHTML = `
                <div class="tips-section">
                    <div class="tips-header">💡 Tips:</div>
                    <ul class="tips-list">
                        ${score.tips.map(tip => `<li>${escapeHtml(tip)}</li>`).join('')}
                    </ul>
                </div>
            `;
        } else if (score.specificIssues && score.specificIssues.length > 0) {
            tips.innerHTML = `
                <div class="tips-section">
                    <div class="tips-header">🎯 Focus on:</div>
                    <ul class="tips-list">
                        ${score.specificIssues.slice(0, 2).map(issue => 
                            `<li><strong>${escapeHtml(issue.name)}:</strong> ${escapeHtml(issue.tip)}</li>`
                        ).join('')}
                    </ul>
                </div>
            `;
        } else {
            tips.innerHTML = '';
        }
        
        // Show action buttons
        actionArea.classList.remove('hidden');
        
        const retryBtn = document.getElementById('retryBtn');
        const continueBtn = document.getElementById('continueBtn');
        
        if (hasPassed) {
            // Passed - can continue
            retryBtn.classList.add('hidden');
            continueBtn.classList.remove('hidden');
            continueBtn.textContent = 'Continue →';
            document.getElementById('pronunciationCard').classList.add('challenge-passed');
        } else if (attempt >= maxAttempts) {
            // Out of attempts - must continue anyway (but word will be marked weak)
            retryBtn.classList.add('hidden');
            continueBtn.classList.remove('hidden');
            continueBtn.textContent = 'Continue (need more practice) →';
            document.getElementById('pronunciationCard').classList.add('challenge-failed');
            
            // Mark word as needing pronunciation work
            if (!state.weakWords) state.weakWords = [];
            if (!state.weakWords.find(w => getWordKey(w) === getWordKey(word))) {
                state.weakWords.push(word);
            }
        } else {
            // Can retry
            retryBtn.classList.remove('hidden');
            continueBtn.classList.add('hidden');
            recordBtn.classList.remove('hidden');
        }
        
        // Retry button - show record button again
        retryBtn.onclick = () => {
            resultArea.classList.add('hidden');
            actionArea.classList.add('hidden');
            recordBtn.classList.remove('hidden');
        };
        
        // Continue button
        continueBtn.onclick = () => {
            // Record score for this word
            if (bestScore) {
                state.pronunciationScores = state.pronunciationScores || {};
                state.pronunciationScores[getWordKey(word)] = bestScore.score;
            }
            
            // Move to next challenge
            state.currentIndex++;
            renderChallenge(state);
        };
    }
    
    function getScoreEmoji(score) {
        if (score >= 90) return '🎉';
        if (score >= 75) return '👍';
        if (score >= 60) return '💪';
        if (score >= 40) return '🔄';
        return '😅';
    }
}

function renderMCQChallenge(container, challenge, state) {
    const word = challenge.word;
    const resolved = resolveWordForm(word, userData.speakerGender);
    const options = challenge.options;
    
    container.innerHTML = `
        <div class="challenge-card mcq-card">
            <div class="challenge-instruction">What does this mean?</div>
            <div class="mcq-prompt">
                <span class="mcq-word">${escapeHtml(resolved)}</span>
                <button class="btn-listen-small" id="listenBtn">🔊</button>
            </div>
            <div class="mcq-options" id="mcqOptions">
                ${options.map((opt, i) => `
                    <button class="mcq-option" data-key="${opt.key}" data-index="${i}">
                        ${escapeHtml(opt.en)}
                    </button>
                `).join('')}
            </div>
            <div class="challenge-feedback" id="feedback"></div>
            <button class="btn-save-word btn-save-small" id="saveWordBtn" data-pt="${escapeHtml(resolved)}" data-en="${escapeHtml(word.en)}">💾 Save</button>
            <div class="challenge-footer hidden" id="footerActions">
                <button class="btn-continue" id="continueBtn">Continue</button>
            </div>
        </div>
    `;
    
    document.getElementById('listenBtn').addEventListener('click', () => playWord(resolved));
    document.getElementById('saveWordBtn').addEventListener('click', (e) => {
        const btn = e.target;
        saveToFlashcards(btn.dataset.pt, btn.dataset.en, state.lesson.title);
        btn.textContent = '✓ Saved!';
        btn.disabled = true;
    });
    
    const correctKey = getWordKey(word);
    const optionsContainer = document.getElementById('mcqOptions');
    const buttons = optionsContainer.querySelectorAll('.mcq-option');
    
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const selected = btn.dataset.key;
            const isCorrect = selected === correctKey;
            
            // Disable all buttons
            buttons.forEach(b => b.disabled = true);
            
            if (isCorrect) {
                btn.classList.add('correct');
                showChallengeFeedback(true, state);
                state.correct++;
            } else {
                btn.classList.add('incorrect');
                // Highlight correct answer
                buttons.forEach(b => {
                    if (b.dataset.key === correctKey) b.classList.add('correct');
                });
                showChallengeFeedback(false, state, word.en);
                state.mistakes++;
                // Track wrong answer for retry guidance
                state.wrongAnswers.push({ word: resolved, english: word.en, type: 'mcq' });
                updateHearts();
            }
            
            document.getElementById('footerActions').classList.remove('hidden');
            document.getElementById('continueBtn').addEventListener('click', () => {
                state.currentIndex++;
                renderChallenge(state);
            });
        });
    });
}

function renderTypeChallenge(container, challenge, state) {
    const word = challenge.word;
    const answer = resolveWordForm(word, userData.speakerGender);
    
    container.innerHTML = `
        <div class="challenge-card type-card">
            <div class="challenge-instruction">Write this in Portuguese</div>
            <div class="type-prompt">${escapeHtml(word.en)}</div>
            <input type="text" class="type-input" id="typeInput" placeholder="Type in Portuguese..." autocomplete="off" autocapitalize="off">
            <div class="challenge-feedback" id="feedback"></div>
            <button class="btn-save-word btn-save-small" id="saveWordBtn" data-pt="${escapeHtml(answer)}" data-en="${escapeHtml(word.en)}">💾 Save</button>
            <div class="challenge-footer">
                <button class="btn-skip" id="skipBtn">Skip</button>
                <button class="btn-check" id="checkBtn">Check</button>
            </div>
        </div>
    `;
    
    document.getElementById('saveWordBtn').addEventListener('click', (e) => {
        const btn = e.target;
        saveToFlashcards(btn.dataset.pt, btn.dataset.en, state.lesson.title);
        btn.textContent = '✓ Saved!';
        btn.disabled = true;
    });
    
    const input = document.getElementById('typeInput');
    const checkBtn = document.getElementById('checkBtn');
    const skipBtn = document.getElementById('skipBtn');
    
    input.focus();
    
    const checkAnswer = () => {
        const typed = normalizeText(input.value);
        const target = normalizeText(answer);
        const isCorrect = typed === target;
        
        input.disabled = true;
        checkBtn.disabled = true;
        skipBtn.disabled = true;
        
        if (isCorrect) {
            input.classList.add('correct');
            showChallengeFeedback(true, state);
            state.correct++;
        } else {
            input.classList.add('incorrect');
            showChallengeFeedback(false, state, answer);
            state.mistakes++;
            // Track wrong answer for retry guidance
            state.wrongAnswers.push({ word: answer, english: word.en, type: 'type' });
            updateHearts();
        }
        
        // Change to continue button
        checkBtn.textContent = 'Continue';
        checkBtn.disabled = false;
        checkBtn.classList.remove('btn-check');
        checkBtn.classList.add('btn-continue');
        checkBtn.onclick = () => {
            state.currentIndex++;
            renderChallenge(state);
        };
    };
    
    checkBtn.addEventListener('click', checkAnswer);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') checkAnswer();
    });
    
    skipBtn.addEventListener('click', () => {
        state.mistakes++;
        // Track skipped as wrong for retry guidance
        state.wrongAnswers.push({ word: answer, english: word.en, type: 'skip' });
        updateHearts();
        showChallengeFeedback(false, state, answer);
        input.disabled = true;
        checkBtn.textContent = 'Continue';
        checkBtn.classList.remove('btn-check');
        checkBtn.classList.add('btn-continue');
        checkBtn.onclick = () => {
            state.currentIndex++;
            renderChallenge(state);
        };
    });
}

function renderListenTypeChallenge(container, challenge, state) {
    const word = challenge.word;
    const answer = resolveWordForm(word, userData.speakerGender);
    
    container.innerHTML = `
        <div class="challenge-card listen-type-card">
            <div class="challenge-instruction">Type what you hear</div>
            <button class="btn-listen-large" id="listenBtn">🔊</button>
            <input type="text" class="type-input" id="typeInput" placeholder="Type what you hear..." autocomplete="off" autocapitalize="off">
            <div class="challenge-feedback" id="feedback"></div>
            <button class="btn-save-word btn-save-small" id="saveWordBtn" data-pt="${escapeHtml(answer)}" data-en="${escapeHtml(word.en)}">💾 Save</button>
            <div class="challenge-footer">
                <button class="btn-skip" id="skipBtn">Skip</button>
                <button class="btn-check" id="checkBtn">Check</button>
            </div>
        </div>
    `;
    
    // Auto-play audio
    setTimeout(() => playWord(answer), 300);
    
    document.getElementById('listenBtn').addEventListener('click', () => playWord(answer));
    document.getElementById('saveWordBtn').addEventListener('click', (e) => {
        const btn = e.target;
        saveToFlashcards(btn.dataset.pt, btn.dataset.en, state.lesson.title);
        btn.textContent = '✓ Saved!';
        btn.disabled = true;
    });
    
    const input = document.getElementById('typeInput');
    const checkBtn = document.getElementById('checkBtn');
    const skipBtn = document.getElementById('skipBtn');
    
    input.focus();
    
    const checkAnswer = () => {
        const typed = normalizeText(input.value);
        const target = normalizeText(answer);
        const isCorrect = typed === target;
        
        input.disabled = true;
        checkBtn.disabled = true;
        skipBtn.disabled = true;
        
        if (isCorrect) {
            input.classList.add('correct');
            showChallengeFeedback(true, state);
            state.correct++;
        } else {
            input.classList.add('incorrect');
            showChallengeFeedback(false, state, answer);
            state.mistakes++;
            // Track wrong answer for retry guidance
            state.wrongAnswers.push({ word: answer, english: word.en, type: 'listen' });
            updateHearts();
        }
        
        checkBtn.textContent = 'Continue';
        checkBtn.disabled = false;
        checkBtn.classList.remove('btn-check');
        checkBtn.classList.add('btn-continue');
        checkBtn.onclick = () => {
            state.currentIndex++;
            renderChallenge(state);
        };
    };
    
    checkBtn.addEventListener('click', checkAnswer);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') checkAnswer();
    });
    
    skipBtn.addEventListener('click', () => {
        state.mistakes++;
        // Track skipped as wrong for retry guidance
        state.wrongAnswers.push({ word: answer, english: word.en, type: 'skip' });
        updateHearts();
        showChallengeFeedback(false, state, answer);
        input.disabled = true;
        checkBtn.textContent = 'Continue';
        checkBtn.classList.remove('btn-check');
        checkBtn.classList.add('btn-continue');
        checkBtn.onclick = () => {
            state.currentIndex++;
            renderChallenge(state);
        };
    });
}

function renderSentenceChallenge(container, challenge, state) {
    const sentence = challenge.sentence;
    
    container.innerHTML = `
        <div class="challenge-card sentence-card-challenge">
            <div class="challenge-instruction">Listen and repeat</div>
            <div class="sentence-display">
                <div class="sentence-pt">${escapeHtml(sentence.pt)}</div>
                <div class="sentence-en">${escapeHtml(sentence.en)}</div>
            </div>
            <button class="btn-listen-large" id="listenBtn">🔊 Listen</button>
            <button class="btn-save-word btn-save-small" id="saveWordBtn" data-pt="${escapeHtml(sentence.pt)}" data-en="${escapeHtml(sentence.en)}">💾 Save Sentence</button>
            <div class="challenge-footer">
                <button class="btn-continue" id="continueBtn">Continue</button>
            </div>
        </div>
    `;
    
    // Auto-play
    setTimeout(() => playWord(sentence.pt), 300);
    
    document.getElementById('listenBtn').addEventListener('click', () => playWord(sentence.pt));
    document.getElementById('saveWordBtn').addEventListener('click', (e) => {
        const btn = e.target;
        saveToFlashcards(btn.dataset.pt, btn.dataset.en, state.lesson.title, 'sentence');
        btn.textContent = '✓ Saved!';
        btn.disabled = true;
    });
    document.getElementById('continueBtn').addEventListener('click', () => {
        state.currentIndex++;
        renderChallenge(state);
    });
}

function showChallengeFeedback(isCorrect, state, correctAnswer = null) {
    const feedback = document.getElementById('feedback');
    if (!feedback) return;
    
    if (isCorrect) {
        feedback.innerHTML = `<div class="feedback-correct">✓ Correct!</div>`;
        feedback.className = 'challenge-feedback success';
    } else {
        feedback.innerHTML = `
            <div class="feedback-incorrect">✗ Incorrect</div>
            ${correctAnswer ? `<div class="feedback-answer">Correct answer: <strong>${escapeHtml(correctAnswer)}</strong></div>` : ''}
        `;
        feedback.className = 'challenge-feedback error';
    }
}

function updateHearts() {
    const heartsEl = document.getElementById('lessonHearts');
    if (!heartsEl) return;
    
    // Use the global hearts system
    const globalHearts = getHearts();
    
    // Lose a heart on mistake
    const stillHasHearts = loseHeart();
    
    // Update display
    if (globalHearts === Infinity) {
        // Admin mode - show infinity symbol
        heartsEl.innerHTML = '<span class="unlimited-hearts">∞</span>';
    } else {
        const newHearts = getHearts();
        heartsEl.innerHTML = '❤️'.repeat(Math.max(0, newHearts)) + '🖤'.repeat(Math.max(0, AUTH_CONSTANTS.MAX_HEARTS - newHearts));
    }
    
    // If out of hearts, show modal
    if (!stillHasHearts && !hasHearts()) {
        setTimeout(() => {
            showHeartsModal();
        }, 500);
    }
}

function renderLessonComplete(state) {
    const container = document.getElementById('challengeContainer');
    if (!container) return;
    
    const duration = Math.round((Date.now() - state.startTime) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    
    // Only count challenges that are actually testable (not learn-word phase)
    const testChallenges = state.challenges.filter(c => c.type !== 'learn-word');
    const accuracy = testChallenges.length > 0 
        ? Math.round((state.correct / testChallenges.length) * 100) 
        : 100;
    
    const PASS_THRESHOLD = 85;
    const passed = accuracy >= PASS_THRESHOLD;
    
    // Only mark lesson complete if they passed
    if (passed) {
        // Add words to learned list
        state.lesson.words.forEach(word => {
            const resolved = resolveWordForm(word, userData.speakerGender);
            if (!userData.learned.some(l => l.word === resolved)) {
                userData.learned.push({
                    word: resolved,
                    english: word.en,
                    date: Date.now(),
                    lessonId: state.lesson.id,
                    srsLevel: 1,
                    nextReview: Date.now() + 24 * 60 * 60 * 1000
                });
            }
        });
        
        // Mark lesson complete
        if (!userData.completedLessons.includes(state.lesson.id)) {
            userData.completedLessons.push(state.lesson.id);
        }
        saveUserData();
        
        // Award XP for lesson completion
        const bonusXP = accuracy >= 100 ? 50 : accuracy >= 90 ? 30 : 20;
        addXP(bonusXP);
        
        // Update streak
        updateStreak();
        
        // Track lesson completion
        authCompleteLesson();
    }
    
    // Identify weak areas (words they got wrong)
    const weakWords = [];
    if (!passed && state.wrongAnswers) {
        state.wrongAnswers.forEach(wa => {
            if (!weakWords.includes(wa.word)) {
                weakWords.push(wa.word);
            }
        });
    }
    
    if (passed) {
        // Calculate XP earned
        const bonusXP = accuracy >= 100 ? 50 : accuracy >= 90 ? 30 : 20;
        const totalXP = (state.correct * 10) + bonusXP;
        
        // Success screen
        container.innerHTML = `
            <div class="lesson-complete-card lesson-passed">
                <div class="complete-celebration">🎉</div>
                <h2>Excelente! Lesson Complete!</h2>
                <div class="complete-stats">
                    <div class="stat stat-highlight">
                        <div class="stat-value">${accuracy}%</div>
                        <div class="stat-label">Accuracy</div>
                    </div>
                    <div class="stat stat-xp">
                        <div class="stat-value">+${totalXP}</div>
                        <div class="stat-label">XP Earned</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value">${state.lesson.words.length}</div>
                        <div class="stat-label">Words Learned</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value">${minutes}:${seconds.toString().padStart(2, '0')}</div>
                        <div class="stat-label">Time</div>
                    </div>
                </div>
                <p class="complete-message">You've mastered this lesson! The words have been added to your review list.</p>
                <div class="complete-actions">
                    <button class="btn-continue" id="backBtn">Continue to Next Lesson</button>
                </div>
            </div>
        `;
        
        document.getElementById('backBtn').addEventListener('click', backToLessons);
    } else {
        // Not passed - need to retry
        container.innerHTML = `
            <div class="lesson-complete-card lesson-needs-work">
                <div class="complete-icon">📚</div>
                <h2>Almost There!</h2>
                <div class="complete-stats">
                    <div class="stat stat-warning">
                        <div class="stat-value">${accuracy}%</div>
                        <div class="stat-label">Your Score</div>
                    </div>
                    <div class="stat stat-target">
                        <div class="stat-value">${PASS_THRESHOLD}%</div>
                        <div class="stat-label">Required</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value">${minutes}:${seconds.toString().padStart(2, '0')}</div>
                        <div class="stat-label">Time</div>
                    </div>
                </div>
                <div class="incomplete-message">
                    <p>You need <strong>${PASS_THRESHOLD}%</strong> to complete this lesson and truly learn the words.</p>
                    <p>Take your time with each word - understanding is more important than speed!</p>
                </div>
                ${weakWords.length > 0 ? `
                    <div class="weak-words-section">
                        <h3>🎯 Focus on these words:</h3>
                        <div class="weak-words-list">
                            ${weakWords.slice(0, 5).map(w => `
                                <div class="weak-word-chip">${escapeHtml(w)}</div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                <div class="complete-actions">
                    <button class="btn-retry" id="retryBtn">🔄 Try Again</button>
                    <button class="btn-secondary" id="backBtn">Exit to Lessons</button>
                </div>
                <div class="encouragement-note">
                    💪 Every attempt makes you better. You've got this!
                </div>
            </div>
        `;
        
        document.getElementById('retryBtn').addEventListener('click', () => {
            // Restart the same lesson
            startLesson(state.lesson.id);
        });
        
        document.getElementById('backBtn').addEventListener('click', backToLessons);
    }
}

// =========== KARAOKE-STYLE WORD CARD ===========
// Creates clickable text with character-by-character highlighting during speech
// eslint-disable-next-line no-unused-vars
function createWordCard(word) {
    const resolved = resolveWordForm(word, userData.speakerGender);
    const alt = getAlternateForm(word, userData.speakerGender);
    const card = document.createElement('div');
    card.className = 'word-card karaoke-card';
    
    // Wrap each character in a span for highlighting
    const ptChars = wrapCharsInSpans(resolved, 'pt-char');
    const enChars = wrapCharsInSpans(word.en, 'en-char');
    
    card.innerHTML = `
        <div class="karaoke-word">
            <div class="portuguese karaoke-text" data-text="${escapeHtml(resolved)}">${ptChars}</div>
            <div class="english karaoke-text" data-text="${escapeHtml(word.en)}">${enChars}</div>
            ${alt ? `<div class="alt-form">Alternate: ${alt}</div>` : ''}
            <div class="play-hint">🔊 Click to hear</div>
        </div>
        <div class="karaoke-progress" aria-hidden="true"></div>
    `;
    
    card.addEventListener('click', () => {
        playWithKaraokeHighlight(card, resolved, word.en);
    });
    
    return card;
}

// Wrap each character in a span for karaoke highlighting
function wrapCharsInSpans(text, className) {
    return text.split('').map((char, i) => 
        char === ' ' 
            ? `<span class="${className} space" data-index="${i}"> </span>`
            : `<span class="${className}" data-index="${i}">${escapeHtml(char)}</span>`
    ).join('');
}

// Escape HTML special characters
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Play audio with synchronized karaoke highlighting
// Uses Edge-TTS for proper PT-PT pronunciation with Web Speech fallback
// eslint-disable-next-line no-unused-vars
async function playWithKaraokeHighlight(card, ptText, _enText) {
    // Clear any existing highlights
    clearKaraokeHighlights(card);
    
    // Add playing state
    card.classList.add('playing');
    const progressBar = card.querySelector('.karaoke-progress');
    if (progressBar) progressBar.style.width = '0%';
    
    const ptChars = card.querySelectorAll('.pt-char');
    const enChars = card.querySelectorAll('.en-char');
    const totalChars = ptChars.length;
    
    // Estimate duration based on text length and speech rate
    const rate = voiceState.speed || 0.6;
    const estimatedDuration = Math.max(500, (ptText.length * 80) / rate);
    
    let currentCharIndex = 0;
    let animationId = null;
    let startTime = null;
    
    // Animate character highlighting
    const animateHighlight = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / estimatedDuration, 1);
        
        if (progressBar) progressBar.style.width = `${progress * 100}%`;
        
        const targetCharIndex = Math.floor(progress * totalChars);
        
        while (currentCharIndex <= targetCharIndex && currentCharIndex < totalChars) {
            if (ptChars[currentCharIndex]) {
                ptChars[currentCharIndex].classList.add('highlighted');
            }
            const enIndex = Math.floor((currentCharIndex / totalChars) * enChars.length);
            if (enChars[enIndex] && !enChars[enIndex].classList.contains('highlighted')) {
                enChars[enIndex].classList.add('highlighted');
            }
            currentCharIndex++;
        }
        
        if (progress < 1) {
            animationId = requestAnimationFrame(animateHighlight);
        } else {
            ptChars.forEach(c => c.classList.add('highlighted'));
            enChars.forEach(c => c.classList.add('highlighted'));
            setTimeout(() => {
                clearKaraokeHighlights(card);
                card.classList.remove('playing');
                if (progressBar) progressBar.style.width = '0%';
            }, 500);
        }
    };
    
    const cleanup = () => {
        if (animationId) cancelAnimationFrame(animationId);
        clearKaraokeHighlights(card);
        card.classList.remove('playing');
        if (progressBar) progressBar.style.width = '0%';
    };
    
    const finishAnimation = () => {
        if (animationId) cancelAnimationFrame(animationId);
        ptChars.forEach(c => c.classList.add('highlighted'));
        enChars.forEach(c => c.classList.add('highlighted'));
        setTimeout(() => {
            clearKaraokeHighlights(card);
            card.classList.remove('playing');
            if (progressBar) progressBar.style.width = '0%';
        }, 500);
    };
    
    // Try Edge-TTS first for proper PT-PT pronunciation
    try {
        const serverOk = await aiTts.checkServerHealth();
        if (serverOk) {
            startTime = null;
            animationId = requestAnimationFrame(animateHighlight);
            
            await aiTts.speak(ptText, {
                voice: 'pt-PT-RaquelNeural',
                rate: rate,
                onEnd: finishAnimation,
                onError: cleanup
            });
            return;
        }
    } catch (e) {
        console.warn('Edge-TTS unavailable for karaoke, using Web Speech:', e.message);
        cleanup();
    }
    
    // Fallback to Web Speech API
    if (!('speechSynthesis' in window)) {
        alert('Speech synthesis not supported in this browser.');
        cleanup();
        return;
    }
    
    const utterance = new SpeechSynthesisUtterance(ptText);
    utterance.lang = 'pt-PT';
    utterance.rate = rate;
    
    // Strictly prefer pt-PT voices
    let voices = speechSynthesis.getVoices();
    if (voices.length === 0) {
        await new Promise(resolve => {
            speechSynthesis.onvoiceschanged = () => {
                voices = speechSynthesis.getVoices();
                resolve();
            };
            setTimeout(resolve, 500);
        });
    }
    
    const ptPTVoice = voices.find(v => v.lang === 'pt-PT') ||
                     voices.find(v => v.lang.startsWith('pt-PT'));
    if (ptPTVoice) {
        utterance.voice = ptPTVoice;
    }
    
    utterance.onstart = () => {
        startTime = null;
        animationId = requestAnimationFrame(animateHighlight);
    };
    
    utterance.onend = finishAnimation;
    utterance.onerror = cleanup;
    
    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
}

// Clear all karaoke highlights from a card
function clearKaraokeHighlights(card) {
    card.querySelectorAll('.highlighted').forEach(el => el.classList.remove('highlighted'));
}

// =========== KARAOKE SENTENCE CARD ===========
// For full sentences with word-by-word sync
// eslint-disable-next-line no-unused-vars
function createSentenceCard(sentence) {
    const card = document.createElement('div');
    card.className = 'sentence-card karaoke-card';
    
    // Split into words for word-level highlighting
    const ptWords = sentence.pt.split(/\s+/);
    const enWords = sentence.en.split(/\s+/);
    
    const ptWordSpans = ptWords.map((w, i) => `<span class="pt-word" data-index="${i}">${escapeHtml(w)}</span>`).join(' ');
    const enWordSpans = enWords.map((w, i) => `<span class="en-word" data-index="${i}">${escapeHtml(w)}</span>`).join(' ');
    
    card.innerHTML = `
        <div class="karaoke-sentence">
            <div class="portuguese karaoke-text sentence-text">${ptWordSpans}</div>
            <div class="english karaoke-text sentence-text">${enWordSpans}</div>
            <div class="play-hint">🔊 Click to hear sentence</div>
        </div>
        <div class="karaoke-progress" aria-hidden="true"></div>
    `;
    
    card.addEventListener('click', () => {
        playWithWordHighlight(card, sentence.pt, sentence.en);
    });
    
    return card;
}

// Play sentence with word-by-word highlighting
// Uses Edge-TTS for proper PT-PT pronunciation
// eslint-disable-next-line no-unused-vars
async function playWithWordHighlight(card, ptText, _enText) {
    // Clear any existing highlights
    clearKaraokeHighlights(card);
    
    card.classList.add('playing');
    const progressBar = card.querySelector('.karaoke-progress');
    if (progressBar) progressBar.style.width = '0%';
    
    const ptWords = card.querySelectorAll('.pt-word');
    const enWords = card.querySelectorAll('.en-word');
    const totalWords = ptWords.length;
    
    const rate = voiceState.speed || 0.6;
    const estimatedDuration = Math.max(1000, (ptText.length * 60) / rate);
    
    let currentWordIndex = 0;
    let animationId = null;
    let startTime = null;
    
    const animateHighlight = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / estimatedDuration, 1);
        
        if (progressBar) progressBar.style.width = `${progress * 100}%`;
        
        const targetWordIndex = Math.floor(progress * totalWords);
        
        while (currentWordIndex <= targetWordIndex && currentWordIndex < totalWords) {
            ptWords.forEach(w => w.classList.remove('current'));
            enWords.forEach(w => w.classList.remove('current'));
            
            if (ptWords[currentWordIndex]) {
                ptWords[currentWordIndex].classList.add('highlighted', 'current');
            }
            const enIndex = Math.min(Math.floor((currentWordIndex / totalWords) * enWords.length), enWords.length - 1);
            if (enWords[enIndex]) {
                enWords[enIndex].classList.add('highlighted', 'current');
            }
            currentWordIndex++;
        }
        
        if (progress < 1) {
            animationId = requestAnimationFrame(animateHighlight);
        } else {
            ptWords.forEach(w => { w.classList.add('highlighted'); w.classList.remove('current'); });
            enWords.forEach(w => { w.classList.add('highlighted'); w.classList.remove('current'); });
            setTimeout(() => {
                clearKaraokeHighlights(card);
                card.classList.remove('playing');
                if (progressBar) progressBar.style.width = '0%';
            }, 600);
        }
    };
    
    const cleanup = () => {
        if (animationId) cancelAnimationFrame(animationId);
        clearKaraokeHighlights(card);
        card.classList.remove('playing');
        if (progressBar) progressBar.style.width = '0%';
    };
    
    const finishAnimation = () => {
        if (animationId) cancelAnimationFrame(animationId);
        ptWords.forEach(w => { w.classList.add('highlighted'); w.classList.remove('current'); });
        enWords.forEach(w => { w.classList.add('highlighted'); w.classList.remove('current'); });
        setTimeout(() => {
            clearKaraokeHighlights(card);
            card.classList.remove('playing');
            if (progressBar) progressBar.style.width = '0%';
        }, 600);
    };
    
    // Try Edge-TTS first for proper PT-PT pronunciation
    try {
        const serverOk = await aiTts.checkServerHealth();
        if (serverOk) {
            startTime = null;
            animationId = requestAnimationFrame(animateHighlight);
            
            await aiTts.speak(ptText, {
                voice: 'pt-PT-RaquelNeural',
                rate: rate,
                onEnd: finishAnimation,
                onError: cleanup
            });
            return;
        }
    } catch (e) {
        console.warn('Edge-TTS unavailable for word highlight, using Web Speech:', e.message);
        cleanup();
    }
    
    // Fallback to Web Speech API
    if (!('speechSynthesis' in window)) {
        alert('Speech synthesis not supported in this browser.');
        cleanup();
        return;
    }
    
    const utterance = new SpeechSynthesisUtterance(ptText);
    utterance.lang = 'pt-PT';
    utterance.rate = rate;
    
    let voices = speechSynthesis.getVoices();
    if (voices.length === 0) {
        await new Promise(resolve => {
            speechSynthesis.onvoiceschanged = () => {
                voices = speechSynthesis.getVoices();
                resolve();
            };
            setTimeout(resolve, 500);
        });
    }
    
    const ptPTVoice = voices.find(v => v.lang === 'pt-PT') ||
                     voices.find(v => v.lang.startsWith('pt-PT'));
    if (ptPTVoice) utterance.voice = ptPTVoice;
    
    // Use boundary events if available for more accurate word sync
    utterance.onboundary = (event) => {
        if (event.name === 'word') {
            const wordIndex = getWordIndexFromCharIndex(ptText, event.charIndex);
            if (wordIndex >= 0 && wordIndex < totalWords) {
                ptWords.forEach(w => w.classList.remove('current'));
                enWords.forEach(w => w.classList.remove('current'));
                
                ptWords[wordIndex]?.classList.add('highlighted', 'current');
                const enIdx = Math.min(Math.floor((wordIndex / totalWords) * enWords.length), enWords.length - 1);
                enWords[enIdx]?.classList.add('highlighted', 'current');
            }
        }
    };
    
    utterance.onstart = () => {
        startTime = null;
        animationId = requestAnimationFrame(animateHighlight);
    };
    
    utterance.onend = finishAnimation;
    utterance.onerror = cleanup;
    
    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
}

// Get word index from character index in text
function getWordIndexFromCharIndex(text, charIndex) {
    const words = text.split(/\s+/);
    let currentPos = 0;
    for (let i = 0; i < words.length; i++) {
        if (charIndex >= currentPos && charIndex < currentPos + words[i].length) {
            return i;
        }
        currentPos += words[i].length + 1; // +1 for space
    }
    return words.length - 1;
}

// eslint-disable-next-line no-unused-vars
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

// eslint-disable-next-line no-unused-vars
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

// eslint-disable-next-line no-unused-vars
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
            // Award XP for correct answer
            addXP(10);
        } else {
            feedbackEl.textContent = expected ? `❌ Expected: ${expected}` : `❌ ${word.pt} = ${word.en}`;
            feedbackEl.className = 'quiz-feedback error';
            recordMistake(word, { source: 'lesson-quiz', details: provided || 'wrong', lessonId: lesson.id });
            // Lose a heart on wrong answer
            const stillHasHearts = loseHeart();
            if (!stillHasHearts && !hasHearts()) {
                // Out of hearts - show modal after short delay
                setTimeout(() => {
                    showHeartsModal();
                }, 800);
            }
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

// Debounced UI updates to prevent flicker from rapid state changes
function debouncedUIUpdate() {
    debounce('ui-update', () => {
        renderCoachPanel();
        renderSrsBuckets();
        renderLessonInsights();
        renderSkillDashboard();
    }, 150);
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
    debouncedUIUpdate();
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
    debouncedUIUpdate();
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

// eslint-disable-next-line no-unused-vars
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

// Listening Drill Mode - Audio only, no text shown
function startListeningDrill() {
    const promptEl = document.getElementById('reviewPrompt');
    const optionsEl = document.getElementById('reviewOptions');
    const resultContainer = document.getElementById('reviewResult');
    if (!promptEl || !optionsEl || !resultContainer) return;

    const pool = userData.learnedWords;
    if (!pool.length) {
        promptEl.textContent = 'Learn a lesson first to unlock listening drills.';
        optionsEl.innerHTML = '';
        return;
    }

    const word = pickReviewWord(pool);
    if (!word) return;
    const choices = buildQuizOptions(word, pool);

    // Audio-only mode - hide Portuguese text
    promptEl.innerHTML = `<strong>🎧 Listen and select the meaning</strong><br><button class="btn-secondary" id="playAudioBtn">▶️ Play Audio</button>`;
    
    const playBtn = document.getElementById('playAudioBtn');
    if (playBtn) {
        playBtn.addEventListener('click', () => {
            const speed = parseFloat(document.getElementById('speedControl')?.value || 1);
            playWord(word.pt, speed);
        });
    }

    optionsEl.innerHTML = '';
    resultContainer.textContent = '';
    resultContainer.className = 'review-result';

    choices.forEach(choice => {
        const btn = document.createElement('button');
        btn.className = 'option-chip';
        btn.textContent = choice.en;
        btn.addEventListener('click', () => {
            const isCorrect = choice.key === getWordKey(word);
            if (isCorrect) {
                resultContainer.textContent = `✅ Correct! "${word.pt}" means "${word.en}"`;
                resultContainer.className = 'review-result success';
                recordSuccess(word, { source: 'listening-drill' });
                showGrammarCard(word.pt); // Show contextual grammar tips
            } else {
                resultContainer.textContent = `❌ Wrong. "${word.pt}" means "${word.en}", not "${choice.en}"`;
                resultContainer.className = 'review-result error';
                recordMistake(word, { source: 'listening-drill' });
            }
            optionsEl.querySelectorAll('button').forEach(b => b.disabled = true);
        });
        optionsEl.appendChild(btn);
    });

    // Auto-play on start
    setTimeout(() => playWord(word.pt, parseFloat(document.getElementById('speedControl')?.value || 1)), 300);
}

// Interleaved Review - Mix words from multiple lessons
function startInterleavedReview() {
    const promptEl = document.getElementById('reviewPrompt');
    const optionsEl = document.getElementById('reviewOptions');
    const resultContainer = document.getElementById('reviewResult');
    if (!promptEl || !optionsEl || !resultContainer) return;

    // Group words by lesson
    const lessonGroups = {};
    userData.learnedWords.forEach(word => {
        const lid = word.lessonId || 'unknown';
        if (!lessonGroups[lid]) lessonGroups[lid] = [];
        lessonGroups[lid].push(word);
    });

    const lessonIds = Object.keys(lessonGroups);
    if (lessonIds.length < 2) {
        promptEl.textContent = 'Complete at least 2 lessons to unlock interleaved review.';
        optionsEl.innerHTML = '';
        return;
    }

    // Pick words from 3 different lessons (interleaving)
    const mixedPool = [];
    for (let i = 0; i < 3; i++) {
        const randomLesson = lessonIds[Math.floor(Math.random() * lessonIds.length)];
        const lessonWords = lessonGroups[randomLesson];
        if (lessonWords.length > 0) {
            mixedPool.push(lessonWords[Math.floor(Math.random() * lessonWords.length)]);
        }
    }

    if (mixedPool.length === 0) return;

    const word = mixedPool[Math.floor(Math.random() * mixedPool.length)];
    const choices = buildQuizOptions(word, userData.learnedWords);

    const lessonInfo = getLessonById(word.lessonId);
    const lessonName = lessonInfo ? lessonInfo.title : 'Mixed';

    promptEl.innerHTML = `<small>From: ${lessonName}</small><br>What does "<strong>${word.pt}</strong>" mean?`;
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

// Progress Analytics with charts
function showAnalytics() {
    const modal = document.getElementById('analyticsModal');
    if (!modal) return;
    modal.style.display = 'flex';

    // Calculate retention curve (words remembered over time)
    const retentionData = calculateRetentionCurve();
    renderRetentionChart(retentionData);

    // Calculate forgetting curve (words due for review)
    const forgettingData = calculateForgettingCurve();
    renderForgettingChart(forgettingData);

    // Study statistics
    renderStudyStats();

    // Weak words
    renderWeakWords();
}

function calculateRetentionCurve() {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const data = [];

    for (let daysAgo = 7; daysAgo >= 0; daysAgo--) {
        const timestamp = now - (daysAgo * dayMs);
        const remembered = userData.learnedWords.filter(w => {
            const learned = w.lastReviewed || 0;
            return learned <= timestamp && (w.srsLevel || 1) >= 2;
        }).length;
        data.push({ day: daysAgo === 0 ? 'Today' : `${daysAgo}d ago`, count: remembered });
    }
    return data;
}

function calculateForgettingCurve() {
    const now = Date.now();
    const hourMs = 60 * 60 * 1000;
    const data = [];

    const intervals = [1, 6, 12, 24, 48, 72, 168]; // hours
    intervals.forEach(hours => {
        const due = userData.learnedWords.filter(w => {
            const next = w.nextReview || 0;
            return next > 0 && next <= (now + hours * hourMs);
        }).length;
        data.push({ time: `${hours}h`, count: due });
    });
    return data;
}

function renderRetentionChart(data) {
    const canvas = document.getElementById('retentionChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Simple bar chart
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const barWidth = canvas.width / data.length;
    const maxCount = Math.max(...data.map(d => d.count), 1);

    data.forEach((point, i) => {
        const barHeight = (point.count / maxCount) * (canvas.height - 30);
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(i * barWidth + 5, canvas.height - barHeight - 20, barWidth - 10, barHeight);
        
        ctx.fillStyle = '#333';
        ctx.font = '10px sans-serif';
        ctx.fillText(point.day, i * barWidth + 10, canvas.height - 5);
        ctx.fillText(point.count, i * barWidth + 15, canvas.height - barHeight - 25);
    });
}

function renderForgettingChart(data) {
    const canvas = document.getElementById('forgettingChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const barWidth = canvas.width / data.length;
    const maxCount = Math.max(...data.map(d => d.count), 1);

    data.forEach((point, i) => {
        const barHeight = (point.count / maxCount) * (canvas.height - 30);
        ctx.fillStyle = '#FF9800';
        ctx.fillRect(i * barWidth + 5, canvas.height - barHeight - 20, barWidth - 10, barHeight);
        
        ctx.fillStyle = '#333';
        ctx.font = '10px sans-serif';
        ctx.fillText(point.time, i * barWidth + 10, canvas.height - 5);
        ctx.fillText(point.count, i * barWidth + 15, canvas.height - barHeight - 25);
    });
}

function renderStudyStats() {
    const container = document.getElementById('studyStats');
    if (!container) return;

    const totalWords = userData.learnedWords.length;
    const dueWords = getDueWords().length;
    const masteredWords = userData.learnedWords.filter(w => (w.srsLevel || 1) >= 4).length;
    const weakWords = userData.learnedWords.filter(w => (w.srsLevel || 1) === 1).length;

    container.innerHTML = `
        <div class="stat-row"><strong>Total Words:</strong> ${totalWords}</div>
        <div class="stat-row"><strong>Due for Review:</strong> ${dueWords}</div>
        <div class="stat-row"><strong>Mastered (L4-L5):</strong> ${masteredWords}</div>
        <div class="stat-row"><strong>Weak (L1):</strong> ${weakWords}</div>
        <div class="stat-row"><strong>Lessons Completed:</strong> ${userData.lessonsCompleted}</div>
        <div class="stat-row"><strong>Current Streak:</strong> ${userData.streak} days</div>
    `;
}

function renderWeakWords() {
    const container = document.getElementById('weakWords');
    if (!container) return;

    const weak = userData.learnedWords
        .filter(w => (w.srsLevel || 1) === 1)
        .sort((a, b) => (b.lastReviewed || 0) - (a.lastReviewed || 0))
        .slice(0, 10);

    if (weak.length === 0) {
        container.innerHTML = '<p class="muted">No weak words! Great job! 🎉</p>';
        return;
    }

    container.innerHTML = '<div class="weak-list">' + weak.map(w => 
        `<div class="weak-item"><strong>${w.pt}</strong> = ${w.en}</div>`
    ).join('') + '</div>';
}

// Export user data as JSON file
function exportUserData() {
    const dataStr = JSON.stringify(userData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `portuguese-learning-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    alert('✅ Data exported successfully!');
}

// Import user data from JSON file
function importUserData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = e => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = event => {
            try {
                const imported = JSON.parse(event.target.result);
                const confirmed = confirm(`Import ${imported.learnedWords?.length || 0} learned words and all progress?`);
                if (!confirmed) return;
                
                // Merge or replace
                Object.assign(userData, imported);
                saveUserData();
                updateDashboard();
                renderVault();
                alert('✅ Data imported successfully!');
            } catch (error) {
                alert('❌ Invalid file format. Please select a valid backup file.');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

// Helper to play word with speed control - uses Edge-TTS for proper PT-PT pronunciation
async function playWord(text, speed = 1) {
    // Try Edge-TTS first (proper Portuguese neural voices)
    try {
        const serverOk = await aiTts.checkServerHealth();
        if (serverOk) {
            await aiTts.speak(text, {
                voice: 'pt-PT-RaquelNeural', // Portugal accent
                rate: speed
            });
            return;
        }
    } catch (e) {
        console.warn('Edge-TTS unavailable, using fallback:', e.message);
    }
    
    // Fallback: Use audio.js speak function if available
    if (typeof window.speak === 'function') {
        window.speak(text, { rate: speed });
        return;
    }
    
    // Last resort: Web Speech API with strict pt-PT voice selection
    if (window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-PT';
        utterance.rate = speed;
        
        // Wait for voices to load
        let voices = window.speechSynthesis.getVoices();
        if (voices.length === 0) {
            await new Promise(resolve => {
                window.speechSynthesis.onvoiceschanged = () => {
                    voices = window.speechSynthesis.getVoices();
                    resolve();
                };
                setTimeout(resolve, 500); // Timeout fallback
            });
        }
        
        // Strictly prefer pt-PT (Portugal) voices, avoid pt-BR
        const ptPTVoice = voices.find(v => v.lang === 'pt-PT') ||
                         voices.find(v => v.lang.startsWith('pt-PT'));
        
        if (ptPTVoice) {
            utterance.voice = ptPTVoice;
        } else {
            // Warn if no Portuguese voice found
            console.warn('No pt-PT voice found. Available voices:', 
                voices.filter(v => v.lang.includes('pt')).map(v => `${v.name} (${v.lang})`));
        }
        
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
    }
}

// Helper to get lesson by ID
function getLessonById(lessonId) {
    return getAllLessonsFlat().find(l => l.id === lessonId);
}

// Render dialogues (placeholder for future implementation)
function renderDialogues() {
    const container = document.getElementById('dialoguesList');
    if (!container) return;
    
    container.innerHTML = DIALOGUES.map(dialogue => `
        <div class="dialogue-card" data-id="${dialogue.id}">
            <h3>${dialogue.title}</h3>
            <p class="muted">${dialogue.difficulty}</p>
            <p>${dialogue.scene}</p>
        </div>
    `).join('');
}

// Show grammar card when relevant (placeholder)
function showGrammarCard(wordPt) {
    const relevantCard = Object.values(GRAMMAR_CARDS).find(card => 
        card.triggers?.some(t => wordPt.toLowerCase().includes(t))
    );
    
    // Display as tooltip or modal in future
    if (relevantCard) {
        console.log(`Grammar tip: ${relevantCard.title}`);
    }
    return relevantCard || null;
}

function showPaywall() {
    const modal = document.getElementById('paywall');
    if (modal) modal.style.display = 'flex';
}

function hidePaywall() {
    const modal = document.getElementById('paywall');
    if (modal) modal.style.display = 'none';
}

// =========== PERSONAL NOTEPAD ===========
let notepadData = [];

function loadNotepad() {
    try {
        const saved = localStorage.getItem(NOTEPAD_STORAGE_KEY);
        if (saved) notepadData = JSON.parse(saved);
    } catch (error) {
        console.warn('Unable to load notepad data', error);
    }
    if (!Array.isArray(notepadData)) notepadData = [];
}

function saveNotepad() {
    try {
        localStorage.setItem(NOTEPAD_STORAGE_KEY, JSON.stringify(notepadData));
    } catch (error) {
        console.warn('Unable to save notepad data', error);
    }
    updateNotepadCount();
}

function updateNotepadCount() {
    const countEl = document.getElementById('notepadCount');
    if (countEl) countEl.textContent = notepadData.length;
}

function addNotepadItem(pt, en, note = '') {
    if (!pt.trim()) return false;
    const item = {
        id: Date.now(),
        pt: pt.trim(),
        en: en.trim(),
        note: note.trim(),
        createdAt: new Date().toISOString()
    };
    notepadData.push(item);
    saveNotepad();
    renderNotepad();
    return true;
}

function deleteNotepadItem(id) {
    notepadData = notepadData.filter(item => item.id !== id);
    saveNotepad();
    renderNotepad();
}

function renderNotepad() {
    const list = document.getElementById('notepadList');
    if (!list) return;
    
    if (notepadData.length === 0) {
        list.innerHTML = '<div class="notepad-empty">No saved notes yet. Add words or phrases above!</div>';
        return;
    }
    
    list.innerHTML = notepadData.map(item => `
        <div class="notepad-item" data-id="${item.id}">
            <span class="pt">${item.pt}</span>
            <span class="en">${item.en || '—'}</span>
            <span class="note">${item.note || ''}</span>
            <button class="btn-speak-note" data-text="${item.pt}" aria-label="Speak">🔊</button>
            <button class="btn-delete-note" data-id="${item.id}" aria-label="Delete">✕</button>
        </div>
    `).join('');
    
    // Attach event listeners
    list.querySelectorAll('.btn-speak-note').forEach(btn => {
        btn.addEventListener('click', () => {
            const text = btn.dataset.text;
            if (text) speakWithEngine(text, voiceState);
        });
    });
    
    list.querySelectorAll('.btn-delete-note').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id, 10);
            if (id && confirm('Delete this note?')) deleteNotepadItem(id);
        });
    });
}

function setupNotepad() {
    loadNotepad();
    renderNotepad();
    updateNotepadCount();
    
    const addBtn = document.getElementById('addNoteBtn');
    const ptInput = document.getElementById('notepadPt');
    const enInput = document.getElementById('notepadEn');
    const noteInput = document.getElementById('notepadNote');
    
    if (addBtn && ptInput) {
        addBtn.addEventListener('click', () => {
            const success = addNotepadItem(
                ptInput.value,
                enInput?.value || '',
                noteInput?.value || ''
            );
            if (success) {
                ptInput.value = '';
                if (enInput) enInput.value = '';
                if (noteInput) noteInput.value = '';
                ptInput.focus();
            }
        });
        
        // Allow Enter key to add
        [ptInput, enInput, noteInput].filter(Boolean).forEach(input => {
            input.addEventListener('keypress', e => {
                if (e.key === 'Enter') addBtn.click();
            });
        });
    }
}

// =========== FLASHCARDS SYSTEM ===========
let flashcardsData = [];
let flashcardGroups = ['Default'];
const FLASHCARD_GROUPS_KEY = 'portugueseFlashcardGroups';

// Memory tips database for different word types
const MEMORY_TIPS = {
    greeting: [
        "🎯 Greetings follow time of day - practice them at those actual times!",
        "💡 Say this greeting out loud every time you enter a room",
        "🔗 Link to a daily routine: morning coffee = Bom dia!"
    ],
    number: [
        "🔢 Count objects around you in Portuguese daily",
        "📱 Change your phone to Portuguese to see numbers everywhere",
        "🎵 Learn the numbers song - rhythm helps memory!"
    ],
    food: [
        "☕ Order in Portuguese at your local café (even silently)",
        "🍽️ Label foods in your kitchen with Portuguese names",
        "📝 Write your shopping list in Portuguese"
    ],
    question: [
        "❓ Questions start with interrogative words - make flashcards!",
        "🗣️ Practice asking yourself questions throughout the day",
        "🎭 Role-play scenarios where you'd use this question"
    ],
    polite: [
        "🙏 Say this to yourself whenever you'd say it in English",
        "✨ Politeness wins hearts - use these at every opportunity",
        "🎯 Muscle memory: practice the mouth movements"
    ],
    verb: [
        "🎬 Visualize yourself doing the action while saying the word",
        "📖 Write 3 sentences using this verb in different contexts",
        "🔄 Practice conjugation: eu, tu, ele/ela, nós, eles"
    ],
    general: [
        "🧠 Create a mental image connecting the word to its meaning",
        "✍️ Write the word 5 times while saying it aloud",
        "🎵 Make up a silly rhyme or song with this word",
        "🔗 Connect to a similar-sounding English word (even if meaning differs)",
        "📍 Place yourself in a Portuguese setting using this word",
        "🎭 Act out using the word in a mini conversation"
    ]
};

function getMemoryTipForWord(pt, en, type = 'word') {
    let category = 'general';
    const ptLower = pt.toLowerCase();
    const enLower = en.toLowerCase();
    
    if (enLower.includes('hello') || enLower.includes('goodbye') || enLower.includes('morning') || 
        enLower.includes('afternoon') || enLower.includes('night') || enLower.includes('hi')) {
        category = 'greeting';
    } else if (/^(one|two|three|four|five|six|seven|eight|nine|ten|\d+)$/i.test(enLower) ||
               /^(um|dois|três|quatro|cinco|seis|sete|oito|nove|dez)/i.test(ptLower)) {
        category = 'number';
    } else if (enLower.includes('coffee') || enLower.includes('water') || enLower.includes('food') ||
               enLower.includes('eat') || enLower.includes('drink') || enLower.includes('restaurant')) {
        category = 'food';
    } else if (enLower.includes('?') || enLower.includes('where') || enLower.includes('what') ||
               enLower.includes('how') || enLower.includes('who') || enLower.includes('when')) {
        category = 'question';
    } else if (enLower.includes('please') || enLower.includes('thank') || enLower.includes('sorry') ||
               enLower.includes('excuse')) {
        category = 'polite';
    } else if (type === 'sentence' || ptLower.includes(' ')) {
        category = 'verb';
    }
    
    const tips = MEMORY_TIPS[category];
    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    return randomTip;
}

function loadFlashcards() {
    try {
        const saved = localStorage.getItem(FLASHCARDS_STORAGE_KEY);
        if (saved) flashcardsData = JSON.parse(saved);
        
        const savedGroups = localStorage.getItem(FLASHCARD_GROUPS_KEY);
        if (savedGroups) flashcardGroups = JSON.parse(savedGroups);
    } catch (error) {
        console.warn('Unable to load flashcards data', error);
    }
    if (!Array.isArray(flashcardsData)) flashcardsData = [];
    if (!Array.isArray(flashcardGroups) || flashcardGroups.length === 0) flashcardGroups = ['Default'];
}

function saveFlashcardsData() {
    try {
        localStorage.setItem(FLASHCARDS_STORAGE_KEY, JSON.stringify(flashcardsData));
        localStorage.setItem(FLASHCARD_GROUPS_KEY, JSON.stringify(flashcardGroups));
    } catch (error) {
        console.warn('Unable to save flashcards data', error);
    }
    updateFlashcardsCount();
}

function updateFlashcardsCount() {
    const countEl = document.getElementById('flashcardsCount');
    if (countEl) countEl.textContent = flashcardsData.length;
    
    const groupCountEl = document.getElementById('flashcardsGroupCount');
    if (groupCountEl) groupCountEl.textContent = flashcardGroups.length;
    
    // Calculate due cards (reviewed > 24h ago or never reviewed)
    const now = new Date();
    const dueCards = flashcardsData.filter(card => {
        if (!card.lastReviewed) return true;
        const lastReview = new Date(card.lastReviewed);
        const hoursSince = (now - lastReview) / (1000 * 60 * 60);
        // Spaced repetition: easier cards take longer before due
        const dueHours = card.difficulty === 1 ? 48 : card.difficulty === 2 ? 24 : 12;
        return hoursSince >= dueHours;
    });
    
    const dueCountEl = document.getElementById('flashcardsDueCount');
    if (dueCountEl) dueCountEl.textContent = dueCards.length;
}

function saveToFlashcards(pt, en, lessonTitle = '', type = 'word', note = '', group = 'Default') {
    if (!pt.trim()) return false;
    
    // Check if already exists
    const exists = flashcardsData.some(card => card.pt.toLowerCase() === pt.toLowerCase().trim());
    if (exists) return false;
    
    // Generate a memory tip
    const memoryTip = getMemoryTipForWord(pt, en, type);
    
    const card = {
        id: Date.now(),
        pt: pt.trim(),
        en: en.trim(),
        note: note.trim(),
        memoryTip: memoryTip,
        type: type, // 'word' or 'sentence'
        lessonTitle: lessonTitle,
        group: group,
        createdAt: new Date().toISOString(),
        lastReviewed: null,
        reviewCount: 0,
        difficulty: 2, // 1=easy, 2=medium, 3=hard (start at medium)
        correctStreak: 0
    };
    flashcardsData.push(card);
    saveFlashcardsData();
    return true;
}

function deleteFlashcard(id) {
    flashcardsData = flashcardsData.filter(card => card.id !== id);
    saveFlashcardsData();
    renderFlashcards();
}

function updateFlashcardNote(id, note) {
    const card = flashcardsData.find(c => c.id === id);
    if (card) {
        card.note = note;
        saveFlashcardsData();
    }
}

function saveChapterToFlashcards(lessonId, targetGroup = 'Default') {
    const lesson = getAllLessonsFlat().find(l => l.id === lessonId);
    if (!lesson) return 0;
    
    let savedCount = 0;
    lesson.words.forEach(word => {
        const resolved = resolveWordForm(word, userData.speakerGender);
        if (saveToFlashcards(resolved, word.en, lesson.title, 'word', '', targetGroup)) {
            savedCount++;
        }
    });
    
    if (lesson.sentences) {
        lesson.sentences.forEach(sentence => {
            if (saveToFlashcards(sentence.pt, sentence.en, lesson.title, 'sentence', '', targetGroup)) {
                savedCount++;
            }
        });
    }
    
    renderFlashcards();
    return savedCount;
}

function renderFlashcards() {
    const container = document.getElementById('flashcardsList');
    if (!container) return;
    
    // Get current filter
    const filterEl = document.getElementById('flashcardsGroupFilter');
    const searchEl = document.getElementById('flashcardsSearch');
    const selectedGroup = filterEl?.value || 'all';
    const searchTerm = searchEl?.value?.toLowerCase().trim() || '';
    
    // Filter cards
    let filteredCards = flashcardsData;
    if (selectedGroup !== 'all') {
        filteredCards = filteredCards.filter(card => card.group === selectedGroup);
    }
    if (searchTerm) {
        filteredCards = filteredCards.filter(card => 
            card.pt.toLowerCase().includes(searchTerm) || 
            card.en.toLowerCase().includes(searchTerm) ||
            (card.note && card.note.toLowerCase().includes(searchTerm))
        );
    }
    
    if (filteredCards.length === 0) {
        container.innerHTML = `
            <div class="flashcards-empty">
                <div class="empty-icon">🃏</div>
                <p>${flashcardsData.length === 0 ? 'No flashcards yet!' : 'No cards match your filter'}</p>
                <p class="empty-hint">Save words during lessons or add entire chapters above.</p>
            </div>
        `;
        return;
    }
    
    // Group by lesson or custom group
    const grouped = {};
    filteredCards.forEach(card => {
        const key = card.group || card.lessonTitle || 'Other';
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(card);
    });
    
    container.innerHTML = Object.entries(grouped).map(([groupTitle, cards]) => `
        <div class="flashcard-group">
            <div class="flashcard-group-header">
                <span class="group-title">📁 ${escapeHtml(groupTitle)}</span>
                <span class="group-count">${cards.length} cards</span>
            </div>
            <div class="flashcard-group-cards">
                ${cards.map(card => `
                    <div class="flashcard-item" data-id="${card.id}">
                        <div class="flashcard-content">
                            <div class="flashcard-pt">${escapeHtml(card.pt)}</div>
                            <div class="flashcard-en">${escapeHtml(card.en)}</div>
                            ${card.memoryTip ? `<div class="flashcard-tip">${escapeHtml(card.memoryTip)}</div>` : ''}
                            ${card.note ? `<div class="flashcard-note">📝 ${escapeHtml(card.note)}</div>` : ''}
                            <div class="flashcard-meta">
                                <span class="flashcard-type-badge ${card.type}">${card.type === 'sentence' ? '📝 Sentence' : '📖 Word'}</span>
                                ${card.reviewCount > 0 ? `<span class="review-badge">✓ ${card.reviewCount}x reviewed</span>` : ''}
                                <span class="difficulty-badge diff-${card.difficulty}">${card.difficulty === 1 ? '🟢 Easy' : card.difficulty === 2 ? '🟡 Medium' : '🔴 Hard'}</span>
                            </div>
                        </div>
                        <div class="flashcard-actions">
                            <button class="btn-speak-card" data-text="${escapeHtml(card.pt)}" aria-label="Speak">🔊</button>
                            <button class="btn-edit-note" data-id="${card.id}" aria-label="Add note">📝</button>
                            <button class="btn-move-group" data-id="${card.id}" aria-label="Move to group">📁</button>
                            <button class="btn-refresh-tip" data-id="${card.id}" aria-label="New tip">💡</button>
                            <button class="btn-delete-card" data-id="${card.id}" aria-label="Delete">✕</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
    
    // Attach event listeners
    container.querySelectorAll('.btn-speak-card').forEach(btn => {
        btn.addEventListener('click', () => {
            const text = btn.dataset.text;
            if (text) playWord(text);
        });
    });
    
    container.querySelectorAll('.btn-edit-note').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id, 10);
            const card = flashcardsData.find(c => c.id === id);
            if (!card) return;
            
            const newNote = prompt('Add a personal note for this card:', card.note || '');
            if (newNote !== null) {
                updateFlashcardNote(id, newNote);
                renderFlashcards();
            }
        });
    });
    
    container.querySelectorAll('.btn-move-group').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id, 10);
            const card = flashcardsData.find(c => c.id === id);
            if (!card) return;
            
            const groupOptions = flashcardGroups.join('\n');
            const newGroup = prompt(`Move to which group?\n\nAvailable groups:\n${groupOptions}\n\nOr type a new group name:`, card.group || 'Default');
            if (newGroup && newGroup.trim()) {
                moveCardToGroup(id, newGroup.trim());
            }
        });
    });
    
    container.querySelectorAll('.btn-refresh-tip').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id, 10);
            refreshMemoryTip(id);
        });
    });
    
    container.querySelectorAll('.btn-delete-card').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id, 10);
            if (id && confirm('Delete this flashcard?')) deleteFlashcard(id);
        });
    });
}

function moveCardToGroup(id, groupName) {
    const card = flashcardsData.find(c => c.id === id);
    if (!card) return;
    
    card.group = groupName;
    if (!flashcardGroups.includes(groupName)) {
        flashcardGroups.push(groupName);
    }
    saveFlashcardsData();
    renderFlashcards();
    updateGroupSelectors();
}

function refreshMemoryTip(id) {
    const card = flashcardsData.find(c => c.id === id);
    if (!card) return;
    
    card.memoryTip = getMemoryTipForWord(card.pt, card.en, card.type);
    saveFlashcardsData();
    renderFlashcards();
}

function createFlashcardGroup(name) {
    if (!name.trim()) return false;
    if (flashcardGroups.includes(name.trim())) return false;
    
    flashcardGroups.push(name.trim());
    saveFlashcardsData();
    updateGroupSelectors();
    renderGroupsList();
    return true;
}

function deleteFlashcardGroup(name) {
    if (name === 'Default') return false;
    
    // Move all cards in this group to Default
    flashcardsData.forEach(card => {
        if (card.group === name) card.group = 'Default';
    });
    
    flashcardGroups = flashcardGroups.filter(g => g !== name);
    saveFlashcardsData();
    updateGroupSelectors();
    renderGroupsList();
    renderFlashcards();
    return true;
}

function updateGroupSelectors() {
    const selectors = ['targetGroupSelector', 'exportGroupSelect', 'flashcardsGroupFilter', 'reviewGroupFilter'];
    
    selectors.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        
        const currentValue = el.value;
        const isFilter = id.includes('Filter') || id.includes('export');
        
        el.innerHTML = isFilter ? '<option value="all">All Groups</option>' : '<option value="">📁 Default Group</option>';
        
        flashcardGroups.forEach(group => {
            const option = document.createElement('option');
            option.value = group;
            option.textContent = group;
            el.appendChild(option);
        });
        
        if (currentValue && Array.from(el.options).some(o => o.value === currentValue)) {
            el.value = currentValue;
        }
    });
}

function renderGroupsList() {
    const container = document.getElementById('groupsList');
    if (!container) return;
    
    container.innerHTML = flashcardGroups.map(group => {
        const count = flashcardsData.filter(c => c.group === group).length;
        return `
            <div class="group-item">
                <span class="group-name">📁 ${escapeHtml(group)}</span>
                <span class="group-card-count">${count} cards</span>
                ${group !== 'Default' ? `<button class="btn-delete-group" data-group="${escapeHtml(group)}">✕</button>` : ''}
            </div>
        `;
    }).join('');
    
    container.querySelectorAll('.btn-delete-group').forEach(btn => {
        btn.addEventListener('click', () => {
            const group = btn.dataset.group;
            if (confirm(`Delete group "${group}"? Cards will be moved to Default.`)) {
                deleteFlashcardGroup(group);
            }
        });
    });
}

// =========== ANKI EXPORT ===========
function exportToAnki(groupFilter = 'all') {
    let cardsToExport = flashcardsData;
    if (groupFilter !== 'all') {
        cardsToExport = flashcardsData.filter(c => c.group === groupFilter);
    }
    
    if (cardsToExport.length === 0) {
        alert('No cards to export!');
        return;
    }
    
    // Anki import format: front<tab>back<tab>tags
    const lines = cardsToExport.map(card => {
        const front = card.pt;
        const back = `${card.en}${card.memoryTip ? '\\n\\n💡 ' + card.memoryTip : ''}${card.note ? '\\n📝 ' + card.note : ''}`;
        const tags = `portuguese ${card.type} ${(card.group || 'default').replace(/\s+/g, '_')}`;
        return `${front}\t${back}\t${tags}`;
    });
    
    const content = lines.join('\n');
    const filename = `portuguese-flashcards-${groupFilter === 'all' ? 'all' : groupFilter.replace(/\s+/g, '-')}.txt`;
    
    downloadFile(content, filename, 'text/plain');
    alert(`Exported ${cardsToExport.length} cards!\\n\\nTo import in Anki:\\n1. Open Anki → File → Import\\n2. Select the downloaded file\\n3. Set field separator to Tab\\n4. Map fields: Field 1 = Front, Field 2 = Back, Field 3 = Tags`);
}

function exportToCSV(groupFilter = 'all') {
    let cardsToExport = flashcardsData;
    if (groupFilter !== 'all') {
        cardsToExport = flashcardsData.filter(c => c.group === groupFilter);
    }
    
    if (cardsToExport.length === 0) {
        alert('No cards to export!');
        return;
    }
    
    const header = 'Portuguese,English,Type,Group,Memory Tip,Note,Review Count,Difficulty';
    const rows = cardsToExport.map(card => {
        return [
            `"${card.pt.replace(/"/g, '""')}"`,
            `"${card.en.replace(/"/g, '""')}"`,
            card.type,
            card.group || 'Default',
            `"${(card.memoryTip || '').replace(/"/g, '""')}"`,
            `"${(card.note || '').replace(/"/g, '""')}"`,
            card.reviewCount,
            card.difficulty === 1 ? 'Easy' : card.difficulty === 2 ? 'Medium' : 'Hard'
        ].join(',');
    });
    
    const content = [header, ...rows].join('\n');
    const filename = `portuguese-flashcards-${groupFilter === 'all' ? 'all' : groupFilter.replace(/\s+/g, '-')}.csv`;
    
    downloadFile(content, filename, 'text/csv');
}

function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function renderChapterSelector() {
    const selector = document.getElementById('chapterSelector');
    if (!selector) return;
    
    const lessons = getAllLessonsFlat();
    selector.innerHTML = `
        <option value="">-- Select a lesson --</option>
        ${lessons.map(lesson => `
            <option value="${lesson.id}">${escapeHtml(lesson.title)} (${lesson.words.length} words)</option>
        `).join('')}
    `;
}

function startFlashcardReview(groupFilter = 'all') {
    let cardsToReview = flashcardsData;
    
    if (groupFilter !== 'all') {
        cardsToReview = flashcardsData.filter(c => c.group === groupFilter);
    }
    
    if (cardsToReview.length === 0) {
        alert(groupFilter === 'all' 
            ? 'No flashcards to review! Save some words first.' 
            : `No flashcards in group "${groupFilter}"!`);
        return;
    }
    
    // Prioritize cards due for review (not reviewed recently or marked hard)
    const sortedCards = [...cardsToReview].sort((a, b) => {
        // Cards never reviewed come first
        if (!a.lastReviewed) return -1;
        if (!b.lastReviewed) return 1;
        
        // Then by difficulty (hard cards first)
        if (a.difficulty !== b.difficulty) return b.difficulty - a.difficulty;
        
        // Then by last reviewed date (oldest first)
        return new Date(a.lastReviewed) - new Date(b.lastReviewed);
    });
    
    // Shuffle but keep priority order somewhat intact
    const shuffled = sortedCards.map((card, index) => ({ card, priority: index }))
        .sort((a, b) => {
            // Group by priority tier (first 10, next 10, etc) and shuffle within
            const tierA = Math.floor(a.priority / 10);
            const tierB = Math.floor(b.priority / 10);
            if (tierA !== tierB) return tierA - tierB;
            return Math.random() - 0.5;
        })
        .map(item => item.card);
    
    let currentIndex = 0;
    
    const container = document.getElementById('flashcardsReviewArea');
    if (!container) return;
    
    function renderReviewCard() {
        if (currentIndex >= shuffled.length) {
            container.innerHTML = `
                <div class="review-complete">
                    <div class="complete-icon">🎉</div>
                    <h3>Review Complete!</h3>
                    <p>You reviewed ${shuffled.length} cards${groupFilter !== 'all' ? ` from "${groupFilter}"` : ''}</p>
                    <button class="btn-continue" id="restartReviewBtn">Review Again</button>
                </div>
            `;
            document.getElementById('restartReviewBtn').addEventListener('click', () => {
                currentIndex = 0;
                shuffled.sort(() => Math.random() - 0.5);
                renderReviewCard();
            });
            return;
        }
        
        const card = shuffled[currentIndex];
        
        container.innerHTML = `
            <div class="review-card">
                <div class="review-progress">${currentIndex + 1} / ${shuffled.length}</div>
                <div class="review-content">
                    <div class="review-front">
                        <div class="review-pt">${escapeHtml(card.pt)}</div>
                        <button class="btn-listen-small" id="reviewListenBtn">🔊</button>
                    </div>
                    <div class="review-back hidden" id="reviewBack">
                        <div class="review-en">${escapeHtml(card.en)}</div>
                        ${card.memoryTip ? `<div class="review-tip">💡 ${escapeHtml(card.memoryTip)}</div>` : ''}
                        ${card.note ? `<div class="review-note">📝 ${escapeHtml(card.note)}</div>` : ''}
                    </div>
                </div>
                <div class="review-actions">
                    <button class="btn-flip" id="flipBtn">Show Answer</button>
                    <div class="difficulty-buttons hidden" id="difficultyBtns">
                        <button class="btn-easy" data-diff="1">Easy 👍</button>
                        <button class="btn-medium" data-diff="2">Good 👌</button>
                        <button class="btn-hard" data-diff="3">Hard 😅</button>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('reviewListenBtn').addEventListener('click', () => playWord(card.pt));
        document.getElementById('flipBtn').addEventListener('click', () => {
            document.getElementById('reviewBack').classList.remove('hidden');
            document.getElementById('flipBtn').classList.add('hidden');
            document.getElementById('difficultyBtns').classList.remove('hidden');
        });
        
        document.querySelectorAll('.difficulty-buttons button').forEach(btn => {
            btn.addEventListener('click', () => {
                const diff = parseInt(btn.dataset.diff, 10);
                card.difficulty = diff;
                card.lastReviewed = new Date().toISOString();
                card.reviewCount++;
                // Update correct streak
                if (diff === 1) {
                    card.correctStreak = (card.correctStreak || 0) + 1;
                } else if (diff === 3) {
                    card.correctStreak = 0;
                }
                saveFlashcardsData();
                currentIndex++;
                renderReviewCard();
            });
        });
    }
    
    renderReviewCard();
}

function setupFlashcards() {
    loadFlashcards();
    renderFlashcards();
    renderChapterSelector();
    updateFlashcardsCount();
    updateGroupSelectors();
    renderGroupsList();
    
    // Save chapter button
    const saveChapterBtn = document.getElementById('saveChapterBtn');
    const chapterSelector = document.getElementById('chapterSelector');
    const targetGroupSelector = document.getElementById('targetGroupSelector');
    
    if (saveChapterBtn && chapterSelector) {
        saveChapterBtn.addEventListener('click', () => {
            const lessonId = chapterSelector.value;
            if (!lessonId) {
                alert('Please select a lesson first.');
                return;
            }
            const targetGroup = targetGroupSelector?.value || 'Default';
            const saved = saveChapterToFlashcards(lessonId, targetGroup);
            if (saved > 0) {
                alert(`Added ${saved} new cards to "${targetGroup}"!`);
                chapterSelector.value = '';
            } else {
                alert('All cards from this lesson are already saved!');
            }
        });
    }
    
    // Create group button
    const createGroupBtn = document.getElementById('createGroupBtn');
    const newGroupInput = document.getElementById('newGroupName');
    if (createGroupBtn && newGroupInput) {
        createGroupBtn.addEventListener('click', () => {
            const name = newGroupInput.value.trim();
            if (!name) {
                alert('Please enter a group name.');
                return;
            }
            if (createFlashcardGroup(name)) {
                alert(`Group "${name}" created!`);
                newGroupInput.value = '';
            } else {
                alert('This group already exists or the name is invalid.');
            }
        });
        
        newGroupInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') createGroupBtn.click();
        });
    }
    
    // Export buttons
    const exportAnkiBtn = document.getElementById('exportAnkiBtn');
    const exportCSVBtn = document.getElementById('exportCSVBtn');
    const exportGroupSelect = document.getElementById('exportGroupSelect');
    
    if (exportAnkiBtn) {
        exportAnkiBtn.addEventListener('click', () => {
            const group = exportGroupSelect?.value || 'all';
            exportToAnki(group);
        });
    }
    
    if (exportCSVBtn) {
        exportCSVBtn.addEventListener('click', () => {
            const group = exportGroupSelect?.value || 'all';
            exportToCSV(group);
        });
    }
    
    // Group filter for flashcards list
    const flashcardsGroupFilter = document.getElementById('flashcardsGroupFilter');
    const flashcardsSearch = document.getElementById('flashcardsSearch');
    
    if (flashcardsGroupFilter) {
        flashcardsGroupFilter.addEventListener('change', renderFlashcards);
    }
    
    if (flashcardsSearch) {
        flashcardsSearch.addEventListener('input', () => {
            debounce('flashcardsSearch', renderFlashcards, 300);
        });
    }
    
    // Start review button
    const reviewBtn = document.getElementById('startReviewBtn');
    if (reviewBtn) {
        reviewBtn.addEventListener('click', () => {
            const groupFilter = document.getElementById('reviewGroupFilter')?.value || 'all';
            startFlashcardReview(groupFilter);
        });
    }
}

// =========== SENTENCE TRANSLATOR ===========
// Common phrase dictionary for offline translation
const PHRASE_DICTIONARY = {
    'hello': { pt: 'Olá', notes: 'Informal greeting. For formal, use "Bom dia/tarde/noite".' },
    'hi': { pt: 'Olá', notes: 'Casual greeting.' },
    'good morning': { pt: 'Bom dia', notes: 'Used until around noon.' },
    'good afternoon': { pt: 'Boa tarde', notes: 'Used from noon until evening.' },
    'good evening': { pt: 'Boa noite', notes: 'Used in the evening. Also means "good night".' },
    'good night': { pt: 'Boa noite', notes: 'Same phrase for evening/night in EU-PT.' },
    'goodbye': { pt: 'Adeus', notes: 'Formal farewell. Use "Tchau" for casual.' },
    'bye': { pt: 'Tchau', notes: 'Informal, from Italian "ciao".' },
    'please': { pt: 'Por favor', notes: 'Always polite to add this.' },
    'thank you': { pt: 'Obrigado', notes: 'Male speaker says "obrigado", female says "obrigada".' },
    'thanks': { pt: 'Obrigado', notes: 'Male: obrigado, Female: obrigada.' },
    'you\'re welcome': { pt: 'De nada', notes: 'Literally "of nothing".' },
    'yes': { pt: 'Sim', notes: 'Simple affirmative.' },
    'no': { pt: 'Não', notes: 'Note the nasal sound (ão).' },
    'excuse me': { pt: 'Com licença', notes: 'For getting attention or passing by.' },
    'sorry': { pt: 'Desculpe', notes: 'Formal. Use "desculpa" for informal.' },
    'i\'m sorry': { pt: 'Desculpe', notes: 'Or "Peço desculpa" for more emphasis.' },
    'how are you': { pt: 'Como está?', notes: 'Formal. Use "Como estás?" with friends.' },
    'i\'m fine': { pt: 'Estou bem', notes: 'Use estar for temporary states.' },
    'what\'s your name': { pt: 'Como se chama?', notes: 'Formal. "Como te chamas?" is informal.' },
    'my name is': { pt: 'O meu nome é', notes: 'Or "Chamo-me..." (I call myself...)' },
    'nice to meet you': { pt: 'Prazer em conhecê-lo', notes: 'Use conhecê-la for a woman.' },
    'where is': { pt: 'Onde fica', notes: 'For locations. "Onde está" for movable things.' },
    'where is the bathroom': { pt: 'Onde fica a casa de banho?', notes: 'EU-PT uses "casa de banho", not "banheiro".' },
    'where is the metro': { pt: 'Onde fica o metro?', notes: 'Metro is masculine in PT.' },
    'how much': { pt: 'Quanto custa?', notes: 'For asking prices.' },
    'how much is this': { pt: 'Quanto custa isto?', notes: 'isto = this (near speaker).' },
    'i want': { pt: 'Quero', notes: 'From verb querer. Add "por favor" to be polite.' },
    'i would like': { pt: 'Queria', notes: 'More polite than "quero".' },
    'i don\'t understand': { pt: 'Não compreendo', notes: 'Or "Não percebo" (informal).' },
    'do you speak english': { pt: 'Fala inglês?', notes: 'Formal. "Falas inglês?" is informal.' },
    'i speak a little portuguese': { pt: 'Falo um pouco de português', notes: 'Good phrase to know!' },
    'one coffee please': { pt: 'Um café, por favor', notes: 'Café in Portugal is usually espresso.' },
    'two coffees please': { pt: 'Dois cafés, por favor', notes: 'Note the plural: cafés.' },
    'the bill please': { pt: 'A conta, por favor', notes: 'Use at restaurants.' },
    'water': { pt: 'Água', notes: 'Feminine noun: a água.' },
    'beer': { pt: 'Cerveja', notes: 'Or "imperial" for draft beer in Lisbon.' },
    'wine': { pt: 'Vinho', notes: 'Portugal is famous for wine!' },
    'bread': { pt: 'Pão', notes: 'Note the nasal ão sound.' },
    'help': { pt: 'Socorro', notes: 'For emergencies. "Ajuda" for general help.' },
    'i need help': { pt: 'Preciso de ajuda', notes: 'Preciso = I need.' },
    'today': { pt: 'Hoje', notes: 'The H is silent in Portuguese.' },
    'tomorrow': { pt: 'Amanhã', notes: 'Note the nasal ã.' },
    'yesterday': { pt: 'Ontem', notes: 'Simple past reference.' },
    'i love you': { pt: 'Amo-te', notes: 'Or "Eu amo-te" with emphasis.' },
    'i like': { pt: 'Gosto de', notes: 'Always followed by "de" + noun.' },
    'i don\'t like': { pt: 'Não gosto de', notes: 'Negation comes before the verb.' }
};

// Word-by-word fallback dictionary
const WORD_DICTIONARY = {
    'i': 'eu', 'you': 'tu/você', 'he': 'ele', 'she': 'ela', 'we': 'nós', 'they': 'eles/elas',
    'am': 'sou/estou', 'is': 'é/está', 'are': 'são/estão',
    'the': 'o/a', 'a': 'um/uma', 'an': 'um/uma',
    'and': 'e', 'or': 'ou', 'but': 'mas', 'with': 'com', 'without': 'sem',
    'for': 'para', 'to': 'para/a', 'from': 'de', 'in': 'em', 'on': 'em/sobre', 'at': 'em/a',
    'this': 'isto/este', 'that': 'isso/esse', 'here': 'aqui', 'there': 'ali/lá',
    'what': 'o quê', 'who': 'quem', 'when': 'quando', 'where': 'onde', 'why': 'porquê', 'how': 'como',
    'very': 'muito', 'good': 'bom/boa', 'bad': 'mau/má', 'big': 'grande', 'small': 'pequeno',
    'new': 'novo', 'old': 'velho', 'hot': 'quente', 'cold': 'frio',
    'have': 'tenho', 'want': 'quero', 'need': 'preciso', 'can': 'posso', 'must': 'devo',
    'go': 'ir/vou', 'come': 'vir/venho', 'eat': 'comer', 'drink': 'beber', 'see': 'ver', 'speak': 'falar',
    'food': 'comida', 'restaurant': 'restaurante', 'hotel': 'hotel', 'airport': 'aeroporto',
    'train': 'comboio', 'bus': 'autocarro', 'taxi': 'táxi', 'car': 'carro',
    'left': 'esquerda', 'right': 'direita', 'straight': 'em frente',
    'one': 'um', 'two': 'dois', 'three': 'três', 'four': 'quatro', 'five': 'cinco',
    'six': 'seis', 'seven': 'sete', 'eight': 'oito', 'nine': 'nove', 'ten': 'dez',
    'money': 'dinheiro', 'card': 'cartão', 'phone': 'telemóvel', 'ticket': 'bilhete'
};

function translateSentence(englishText) {
    const input = englishText.trim().toLowerCase();
    if (!input) return { pt: '', notes: 'Please enter some text to translate.' };
    
    // Check for exact phrase match first
    for (const [phrase, translation] of Object.entries(PHRASE_DICTIONARY)) {
        if (input === phrase || input === phrase + '?' || input === phrase + '.') {
            return translation;
        }
    }
    
    // Check for partial phrase matches
    for (const [phrase, translation] of Object.entries(PHRASE_DICTIONARY)) {
        if (input.includes(phrase)) {
            return {
                pt: translation.pt,
                notes: translation.notes + ' (Partial match - full sentence may differ.)'
            };
        }
    }
    
    // Fall back to word-by-word translation
    const words = input.replace(/[?!.,]/g, '').split(/\s+/);
    const translated = words.map(word => {
        const clean = word.toLowerCase();
        return WORD_DICTIONARY[clean] || `[${word}]`;
    });
    
    const hasUnknown = translated.some(w => w.startsWith('['));
    
    return {
        pt: translated.join(' '),
        notes: hasUnknown 
            ? 'Word-by-word translation (some words not found). Consider using simpler phrases.'
            : 'Word-by-word translation. Grammar may need adjustment for natural Portuguese.'
    };
}

let lastTranslation = null;

function setupTranslator() {
    const inputEl = document.getElementById('translatorInput');
    const translateBtn = document.getElementById('translateBtn');
    const outputEl = document.getElementById('translatorOutput');
    const ptEl = document.getElementById('translationPt');
    const notesEl = document.getElementById('translationNotes');
    const speakBtn = document.getElementById('speakTranslationBtn');
    const saveBtn = document.getElementById('saveTranslationBtn');
    
    if (!translateBtn || !inputEl) return;
    
    translateBtn.addEventListener('click', () => {
        const text = inputEl.value.trim();
        if (!text) return;
        
        const result = translateSentence(text);
        lastTranslation = { en: text, ...result };
        
        if (outputEl) outputEl.style.display = 'block';
        if (ptEl) ptEl.textContent = result.pt || 'Translation not found.';
        if (notesEl) notesEl.textContent = result.notes || '';
    });
    
    if (speakBtn) {
        speakBtn.addEventListener('click', () => {
            if (lastTranslation?.pt) {
                speakWithEngine(lastTranslation.pt, voiceState);
            }
        });
    }
    
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            if (lastTranslation?.pt) {
                addNotepadItem(lastTranslation.pt, lastTranslation.en, lastTranslation.notes);
                alert('Saved to your notepad!');
            }
        });
    }
    
    // Allow Enter key to translate
    if (inputEl) {
        inputEl.addEventListener('keypress', e => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                translateBtn.click();
            }
        });
    }
}

// =========== VOICE SPEED CONTROL ===========
function setupVoiceSpeedControl() {
    const slider = document.getElementById('voiceSpeedSlider');
    const display = document.getElementById('voiceSpeedValue');
    
    if (!slider) return;
    
    // Initialize from voiceState or use default
    const speed = voiceState.speed || 0.6;
    slider.value = speed;
    if (display) display.textContent = `Speed: ${speed.toFixed(1)}x`;
    
    slider.addEventListener('input', () => {
        const newSpeed = parseFloat(slider.value);
        voiceState.speed = newSpeed;
        if (display) display.textContent = `Speed: ${newSpeed.toFixed(1)}x`;
    });
    
    slider.addEventListener('change', () => {
        persistVoiceState();
    });
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

    const listeningDrillBtn = document.getElementById('listeningDrillBtn');
    if (listeningDrillBtn) listeningDrillBtn.addEventListener('click', startListeningDrill);

    const interleavedReviewBtn = document.getElementById('interleavedReviewBtn');
    if (interleavedReviewBtn) interleavedReviewBtn.addEventListener('click', startInterleavedReview);

    const viewAnalyticsBtn = document.getElementById('viewAnalyticsBtn');
    if (viewAnalyticsBtn) viewAnalyticsBtn.addEventListener('click', showAnalytics);

    const closeAnalytics = document.getElementById('closeAnalytics');
    if (closeAnalytics) closeAnalytics.addEventListener('click', () => {
        document.getElementById('analyticsModal').style.display = 'none';
    });

    const exportDataBtn = document.getElementById('exportDataBtn');
    if (exportDataBtn) exportDataBtn.addEventListener('click', exportUserData);

    const importDataBtn = document.getElementById('importDataBtn');
    if (importDataBtn) importDataBtn.addEventListener('click', importUserData);

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

// ===== PAGE-BASED NAVIGATION =====
// eslint-disable-next-line no-unused-vars
let currentPage = 'home';
let logoClickCount = 0;
let logoClickTimer = null;

function switchPage(pageName) {
    const pages = document.querySelectorAll('.page');
    const tabs = document.querySelectorAll('.nav-tab');
    
    pages.forEach(page => {
        page.classList.remove('active');
        if (page.dataset.page === pageName) {
            page.classList.add('active');
        }
    });
    
    tabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.page === pageName) {
            tab.classList.add('active');
        }
    });
    
    currentPage = pageName;
    window.location.hash = pageName;
    
    // Update dashboard when visiting profile
    if (pageName === 'profile' || pageName === 'practice') {
        updateDashboard();
    }
    
    // Scroll to top of new page
    window.scrollTo(0, 0);
}

function initPageFromHash() {
    const hash = window.location.hash.replace('#', '') || 'home';
    const validPages = ['home', 'learn', 'practice', 'profile'];
    const page = validPages.includes(hash) ? hash : 'home';
    switchPage(page);
}

function updateHeartsDisplay() {
    const heartsCount = document.getElementById('heartsCount');
    const heartsTimer = document.getElementById('heartsTimer');
    const hearts = getHearts();
    
    if (heartsCount) {
        if (hearts === Infinity) {
            heartsCount.textContent = '∞';
            heartsCount.classList.add('unlimited');
        } else {
            heartsCount.textContent = hearts;
            heartsCount.classList.remove('unlimited');
        }
    }
    
    if (heartsTimer) {
        if (hearts < AUTH_CONSTANTS.MAX_HEARTS && hearts !== Infinity) {
            heartsTimer.textContent = formatRefillTime();
            heartsTimer.style.display = 'inline';
        } else {
            heartsTimer.style.display = 'none';
        }
    }
}

function updateStreakDisplay() {
    const streakCount = document.getElementById('streakCount');
    if (streakCount) {
        streakCount.textContent = getStreak();
    }
}

function updateXPDisplay() {
    const xpCount = document.getElementById('xpCount');
    if (xpCount) {
        xpCount.textContent = getXP();
    }
}

function updateHeaderStats() {
    updateHeartsDisplay();
    updateStreakDisplay();
    updateXPDisplay();
}

function showLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.style.display = 'flex';
        const passwordInput = document.getElementById('adminPassword');
        if (passwordInput) passwordInput.focus();
    }
}

function hideLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) modal.style.display = 'none';
    const error = document.getElementById('loginError');
    if (error) error.style.display = 'none';
    const passwordInput = document.getElementById('adminPassword');
    if (passwordInput) passwordInput.value = '';
}

function showHeartsModal() {
    const modal = document.getElementById('heartsModal');
    if (modal) modal.style.display = 'flex';
    updateRefillCountdown();
}

function hideHeartsModal() {
    const modal = document.getElementById('heartsModal');
    if (modal) modal.style.display = 'none';
}

function updateRefillCountdown() {
    const countdown = document.getElementById('refillCountdown');
    if (!countdown) return;
    
    const mins = getTimeToNextHeart();
    if (mins <= 0) {
        countdown.textContent = 'Ready!';
    } else {
        countdown.textContent = formatRefillTime();
    }
}

function handleAdminLogin() {
    const passwordInput = document.getElementById('adminPassword');
    const errorEl = document.getElementById('loginError');
    
    if (!passwordInput) return;
    
    const result = loginAdmin(passwordInput.value);
    if (result.success) {
        hideLoginModal();
        updateHeaderStats();
        showNotification('🎉 Admin mode activated - Unlimited hearts!', 'success');
    } else {
        if (errorEl) {
            errorEl.textContent = result.error;
            errorEl.style.display = 'block';
        }
    }
}

function handleLogout() {
    logout();
    updateHeaderStats();
    showNotification('Logged out', 'info');
}

function showNotification(message, type = 'info') {
    // Simple notification - could be enhanced later
    const existing = document.querySelector('.notification-toast');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.className = `notification-toast notification-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 80px;
        left: 50%;
        transform: translateX(-50%);
        padding: 0.8rem 1.5rem;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : 'var(--accent)'};
        color: white;
        border-radius: 12px;
        font-weight: 600;
        z-index: 9999;
        animation: slideDown 0.3s ease;
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.remove(), 3000);
}

function setupNavigation() {
    // Bottom nav tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            switchPage(tab.dataset.page);
        });
    });
    
    // Logo triple-click for admin login
    const logoBtn = document.getElementById('logoBtn');
    if (logoBtn) {
        logoBtn.addEventListener('click', () => {
            logoClickCount++;
            if (logoClickTimer) clearTimeout(logoClickTimer);
            
            logoClickTimer = setTimeout(() => {
                logoClickCount = 0;
            }, 1000);
            
            if (logoClickCount >= 3) {
                logoClickCount = 0;
                if (isAdmin()) {
                    handleLogout();
                } else {
                    showLoginModal();
                }
            } else {
                switchPage('home');
            }
        });
    }
    
    // Start button goes to Learn page
    const startBtn = document.getElementById('startBtn');
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            switchPage('learn');
        });
    }
    
    // Login modal handlers
    const closeLogin = document.getElementById('closeLogin');
    if (closeLogin) {
        closeLogin.addEventListener('click', hideLoginModal);
    }
    
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', handleAdminLogin);
    }
    
    const passwordInput = document.getElementById('adminPassword');
    if (passwordInput) {
        passwordInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') handleAdminLogin();
        });
    }
    
    // Hearts modal handlers
    const closeHearts = document.getElementById('closeHearts');
    if (closeHearts) {
        closeHearts.addEventListener('click', hideHeartsModal);
    }
    
    const waitBtn = document.getElementById('waitBtn');
    if (waitBtn) {
        waitBtn.addEventListener('click', hideHeartsModal);
    }
    
    const getPremiumBtn = document.getElementById('getPremiumBtn');
    if (getPremiumBtn) {
        getPremiumBtn.addEventListener('click', () => {
            hideHeartsModal();
            showPaywall();
        });
    }
    
    // Hash change handler
    window.addEventListener('hashchange', initPageFromHash);
    
    // Listen for hearts changes
    window.addEventListener('heartsChanged', updateHeartsDisplay);
    window.addEventListener('xpChanged', updateXPDisplay);
    window.addEventListener('streakChanged', updateStreakDisplay);
    
    // Initialize from hash
    initPageFromHash();
    
    // Start heart refill timer
    startHeartRefillTimer();
    
    // Update header stats
    updateHeaderStats();
    
    // Update refill countdown every second if modal is open
    setInterval(() => {
        const modal = document.getElementById('heartsModal');
        if (modal && modal.style.display !== 'none') {
            updateRefillCountdown();
        }
    }, 1000);
}

function setupVoiceSettings() {
    const optionSelect = document.getElementById('voiceSelect');
    const sampleBtn = document.getElementById('voiceSampleBtn');
    const statusEl = document.getElementById('voiceStatus');
    const downloadList = document.getElementById('voiceDownloadList');

    const saved = loadVoiceSettings();
    Object.assign(voiceState, saved);
    if (!voiceState.selectedVoiceKey && saved.voiceKey) voiceState.selectedVoiceKey = saved.voiceKey;

    // Detect system voices and populate dropdown
    updateVoiceStatus('Detecting voices…');
    
    getPortugueseVoiceOptions(userData.speakerGender)
        .then(({ options, bestMaleKey, bestFemaleKey }) => {
            voiceState.detectedSystemOptions = options;
            const suggested = userData.speakerGender === 'male' ? bestMaleKey : bestFemaleKey;
            voiceState.selectedVoiceKey = voiceState.selectedVoiceKey || suggested || options[0]?.key || null;
            
            populateVoiceDropdown();
            populateDownloadSection();
            persistVoiceState();
            
            if (options.length) {
                updateVoiceStatus(`${options.length} voice${options.length > 1 ? 's' : ''} available`, 'success');
            } else {
                updateVoiceStatus('No voices found. Check browser settings.', 'error');
            }
        })
        .catch(() => {
            updateVoiceStatus('Voice detection failed', 'error');
        });

    // Voice selection change
    if (optionSelect) {
        optionSelect.addEventListener('change', e => {
            voiceState.selectedVoiceKey = e.target.value || null;
            persistVoiceState();
            updateVoiceStatus('✓ Voice saved', 'success');
        });
    }

    // Test voice button
    if (sampleBtn) {
        sampleBtn.addEventListener('click', async () => {
            sampleBtn.disabled = true;
            sampleBtn.textContent = '🔊 Playing…';
            await playPortugueseText(DEMO_PHRASE, { rate: 0.95 });
            sampleBtn.disabled = false;
            sampleBtn.textContent = '▶️ Test Voice';
        });
    }

    function populateVoiceDropdown() {
        if (!optionSelect) return;
        const options = getSystemVoiceOptions();
        
        if (!options.length) {
            optionSelect.innerHTML = '<option value="" disabled selected>No voices available</option>';
            return;
        }
        
        // Simple flat list of voices
        optionSelect.innerHTML = options.map(opt => 
            `<option value="${opt.key}">${opt.name} (${opt.provider})</option>`
        ).join('');
        
        // Select the saved voice or first available
        if (voiceState.selectedVoiceKey && options.find(o => o.key === voiceState.selectedVoiceKey)) {
            optionSelect.value = voiceState.selectedVoiceKey;
        } else if (options.length) {
            optionSelect.value = options[0].key;
            voiceState.selectedVoiceKey = options[0].key;
        }
    }
    
    function populateDownloadSection() {
        if (!downloadList) return;
        
        const downloadableVoices = getDownloadableVoices();
        
        if (!downloadableVoices.length) {
            downloadList.innerHTML = '<p class="muted small">No downloadable voices available yet.</p>';
            return;
        }
        
        downloadList.innerHTML = downloadableVoices.map(voice => `
            <div class="voice-download-item" data-voice-key="${voice.key}">
                <div class="voice-download-info">
                    <span class="voice-download-name">${voice.name} (${voice.provider})</span>
                    <span class="voice-download-meta">${voice.description} • ${voice.sizeMB || Math.round(voice.sizeBytes / 1024 / 1024)}MB</span>
                </div>
                <button class="voice-download-btn ${voice.downloaded ? 'downloaded' : ''}" 
                        data-voice-key="${voice.key}"
                        ${voice.requiresBackend ? 'title="Requires TTS server to use"' : ''}>
                    ${voice.downloaded ? '✓ Downloaded' : '📥 Download'}
                </button>
            </div>
        `).join('');
        
        // Add download handlers
        downloadList.querySelectorAll('.voice-download-btn').forEach(btn => {
            btn.addEventListener('click', () => handleVoiceDownload(btn.dataset.voiceKey));
        });
    }
    
    function handleVoiceDownload(voiceKey) {
        const voice = getDownloadableVoices().find(v => v.key === voiceKey);
        if (!voice || voice.downloaded) return;
        
        const btn = downloadList.querySelector(`button[data-voice-key="${voiceKey}"]`);
        const item = downloadList.querySelector(`div[data-voice-key="${voiceKey}"]`);
        
        if (!btn) return;
        btn.disabled = true;
        btn.textContent = 'Downloading… 0%';
        
        // Add progress bar
        let progressBar = item.querySelector('.voice-download-progress');
        if (!progressBar) {
            progressBar = document.createElement('div');
            progressBar.className = 'voice-download-progress';
            progressBar.innerHTML = '<div class="voice-download-progress-bar" style="width: 0%"></div>';
            item.appendChild(progressBar);
        }
        
        startBundledVoiceDownload({
            voiceKey: voice.key,
            onProgress: (pct) => {
                btn.textContent = `Downloading… ${pct}%`;
                const bar = progressBar.querySelector('.voice-download-progress-bar');
                if (bar) bar.style.width = `${pct}%`;
                
                if (pct >= 100) {
                    btn.textContent = '✓ Downloaded';
                    btn.classList.add('downloaded');
                    btn.disabled = false;
                    markVoiceDownloaded(voiceKey);
                    progressBar.remove();
                    updateVoiceStatus(`✓ ${voice.name} downloaded`, 'success');
                }
            },
            onError: (err) => {
                btn.textContent = '❌ Failed - Retry';
                btn.disabled = false;
                progressBar.remove();
                updateVoiceStatus(`Download failed: ${err?.message || 'Unknown error'}`, 'error');
            }
        });
    }
    
    function updateVoiceStatus(text, type = 'pending') {
        if (!statusEl) return;
        statusEl.textContent = text;
        statusEl.className = `voice-status ${type}`;
    }
}

function persistVoiceState(extra = {}) {
    Object.assign(voiceState, extra);
    saveVoiceSettings({
        ...voiceState,
        voiceKey: voiceState.selectedVoiceKey,
        preferredGender: userData.speakerGender
    });
}

function getSystemVoiceOptions() {
    return Array.isArray(voiceState.detectedSystemOptions) ? voiceState.detectedSystemOptions : [];
}

function resolveVoiceChoice() {
    const systemOptions = getSystemVoiceOptions();
    const selectedSystem = systemOptions.find(o => o.key === voiceState.selectedVoiceKey) || systemOptions[0] || null;

    if (selectedSystem) {
        return { 
            engine: 'webspeech', 
            source: 'system', 
            voiceKey: selectedSystem.key, 
            label: `${selectedSystem.name} (${selectedSystem.provider})` 
        };
    }

    return { engine: null, source: null, voiceKey: null, label: 'No voice available' };
}

async function playPortugueseText(text, { rate = 0.95 } = {}) {
    const choice = resolveVoiceChoice();
    if (!choice.engine) {
        console.warn('No voice available for playback');
        return;
    }

    await speakWithEngine({
        text,
        lang: 'pt-PT',
        gender: userData.speakerGender,
        engine: choice.engine,
        voiceKey: choice.voiceKey,
        rate
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
// eslint-disable-next-line no-unused-vars
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

// ===== AI Tutor Integration =====
const aiState = {
    ttsAvailable: false,
    whisperLoaded: false,
    whisperLoading: false,
    ollamaAvailable: false,
    recording: false,
    selectedVoice: 'pt-PT-RaquelNeural'
};

async function initAITutor() {
    // Check Edge-TTS server status
    checkTTSStatus();
    
    // Check Ollama status
    checkOllamaStatus();
    
    // Setup AI Tutor event listeners
    setupAITutorEvents();
}

async function checkTTSStatus() {
    const statusDot = document.getElementById('ttsStatus');
    const statusText = document.getElementById('ttsStatusText');
    
    if (!statusDot || !statusText) return;
    
    try {
        const available = await aiTts.checkServerHealth();
        aiState.ttsAvailable = available;
        
        if (available) {
            statusDot.className = 'status-dot status-online';
            statusText.textContent = 'Online';
        } else {
            statusDot.className = 'status-dot status-offline';
            statusText.textContent = 'Offline (using fallback)';
        }
    } catch (error) {
        console.warn('TTS status check failed:', error);
        statusDot.className = 'status-dot status-offline';
        statusText.textContent = 'Offline';
    }
}

async function checkOllamaStatus() {
    const statusDot = document.getElementById('ollamaStatus');
    const statusText = document.getElementById('ollamaStatusText');
    
    if (!statusDot || !statusText) return;
    
    try {
        const status = await aiTutor.checkOllamaStatus();
        aiState.ollamaAvailable = status.available;
        
        if (status.available) {
            statusDot.className = 'status-dot status-online';
            statusText.textContent = `Online (${status.model || 'ready'})`;
        } else {
            statusDot.className = 'status-dot status-offline';
            statusText.textContent = 'Offline (using rules)';
        }
    } catch (error) {
        console.warn('Ollama status check failed:', error);
        statusDot.className = 'status-dot status-offline';
        statusText.textContent = 'Offline';
    }
}

function setupAITutorEvents() {
    // Voice selection
    const voiceSelect = document.getElementById('aiVoiceSelect');
    if (voiceSelect) {
        voiceSelect.addEventListener('change', (e) => {
            aiState.selectedVoice = e.target.value;
        });
    }
    
    // Test voice button
    const testVoiceBtn = document.getElementById('testVoiceBtn');
    const voiceTestStatus = document.getElementById('voiceTestStatus');
    if (testVoiceBtn) {
        testVoiceBtn.addEventListener('click', async () => {
            if (voiceTestStatus) voiceTestStatus.textContent = 'Playing...';
            testVoiceBtn.disabled = true;
            
            try {
                await aiTts.speak('Olá! Eu sou a voz portuguesa.', {
                    voice: aiState.selectedVoice,
                    rate: 1.0
                });
                if (voiceTestStatus) voiceTestStatus.textContent = 'Done!';
            } catch (error) {
                console.error('Voice test failed:', error);
                if (voiceTestStatus) voiceTestStatus.textContent = 'Failed - trying fallback';
                // Try Web Speech fallback
                speakWithEngine(
                    'Olá! Vamos praticar português.',
                    { rate: voiceState.rate },
                    (result) => {
                        if (voiceTestStatus) {
                            voiceTestStatus.textContent = result.success ? 'Fallback OK' : 'Error';
                        }
                    }
                );
            }
            
            testVoiceBtn.disabled = false;
        });
    }
    
    // Hear phrase button
    const hearPhraseBtn = document.getElementById('hearPhraseBtn');
    const practicePhrase = document.getElementById('practicePhrase');
    if (hearPhraseBtn && practicePhrase) {
        hearPhraseBtn.addEventListener('click', async () => {
            const phrase = practicePhrase.value.trim() || 'Bom dia, como está?';
            hearPhraseBtn.disabled = true;
            
            try {
                await aiTts.speak(phrase, {
                    voice: aiState.selectedVoice,
                    rate: 1.0
                });
            } catch (error) {
                console.warn('Edge-TTS failed, using fallback:', error);
                speakWithEngine(phrase, { rate: voiceState.rate });
            }
            
            hearPhraseBtn.disabled = false;
        });
    }
    
    // Load Whisper button
    const loadWhisperBtn = document.getElementById('loadWhisperBtn');
    const recordBtn = document.getElementById('recordBtn');
    const recordingStatus = document.getElementById('recordingStatus');
    const whisperStatusDot = document.getElementById('whisperStatus');
    const whisperStatusText = document.getElementById('whisperStatusText');
    
    if (loadWhisperBtn) {
        loadWhisperBtn.addEventListener('click', async () => {
            if (aiState.whisperLoading || aiState.whisperLoaded) return;
            
            aiState.whisperLoading = true;
            loadWhisperBtn.disabled = true;
            loadWhisperBtn.textContent = '⏳ Loading...';
            if (recordingStatus) recordingStatus.textContent = 'Loading Whisper model...';
            if (whisperStatusDot) whisperStatusDot.className = 'status-dot status-checking';
            if (whisperStatusText) whisperStatusText.textContent = 'Loading...';
            
            try {
                await aiSpeech.initializeWhisper('tiny', (progress) => {
                    if (recordingStatus) {
                        recordingStatus.textContent = `Loading: ${Math.round(progress * 100)}%`;
                    }
                });
                
                aiState.whisperLoaded = true;
                aiState.whisperLoading = false;
                loadWhisperBtn.textContent = '✓ Loaded';
                if (recordBtn) recordBtn.disabled = false;
                if (recordingStatus) recordingStatus.textContent = 'Ready to record';
                if (whisperStatusDot) whisperStatusDot.className = 'status-dot status-online';
                if (whisperStatusText) whisperStatusText.textContent = 'Loaded';
            } catch (error) {
                console.error('Whisper loading failed:', error);
                aiState.whisperLoading = false;
                loadWhisperBtn.disabled = false;
                loadWhisperBtn.textContent = '📥 Load Whisper';
                if (recordingStatus) recordingStatus.textContent = 'Failed - try Web Speech';
                if (whisperStatusDot) whisperStatusDot.className = 'status-dot status-offline';
                if (whisperStatusText) whisperStatusText.textContent = 'Failed';
                
                // Enable recording with Web Speech fallback
                if (recordBtn) recordBtn.disabled = false;
            }
        });
    }
    
    // Record button
    if (recordBtn) {
        recordBtn.addEventListener('click', async () => {
            if (aiState.recording) {
                // Stop recording
                aiState.recording = false;
                recordBtn.classList.remove('recording');
                recordBtn.textContent = '🎙️ Record';
                if (recordingStatus) recordingStatus.textContent = 'Processing...';
                
                try {
                    let transcription;
                    if (aiState.whisperLoaded) {
                        transcription = await aiSpeech.stopRecording();
                    } else {
                        // Use Web Speech API fallback
                        transcription = await stopWebSpeechRecording();
                    }
                    
                    await handleTranscription(transcription);
                } catch (error) {
                    console.error('Transcription failed:', error);
                    if (recordingStatus) recordingStatus.textContent = 'Error - try again';
                }
            } else {
                // Start recording
                aiState.recording = true;
                recordBtn.classList.add('recording');
                recordBtn.textContent = '⏹️ Stop';
                if (recordingStatus) recordingStatus.textContent = 'Recording...';
                
                try {
                    if (aiState.whisperLoaded) {
                        await aiSpeech.startRecording();
                    } else {
                        // Use Web Speech API fallback
                        startWebSpeechRecording();
                    }
                } catch (error) {
                    console.error('Recording failed:', error);
                    aiState.recording = false;
                    recordBtn.classList.remove('recording');
                    recordBtn.textContent = '🎙️ Record';
                    if (recordingStatus) recordingStatus.textContent = 'Microphone error';
                }
            }
        });
    }
}

// Web Speech API fallback for recording
let webSpeechRecognizer = null;
let webSpeechResult = '';

function startWebSpeechRecording() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        throw new Error('Web Speech API not supported');
    }
    
    webSpeechRecognizer = new SpeechRecognition();
    webSpeechRecognizer.lang = 'pt-PT';
    webSpeechRecognizer.continuous = true;
    webSpeechRecognizer.interimResults = false;
    webSpeechResult = '';
    
    webSpeechRecognizer.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
                webSpeechResult += event.results[i][0].transcript + ' ';
            }
        }
    };
    
    webSpeechRecognizer.start();
}

function stopWebSpeechRecording() {
    return new Promise((resolve) => {
        if (webSpeechRecognizer) {
            webSpeechRecognizer.onend = () => {
                resolve(webSpeechResult.trim());
            };
            webSpeechRecognizer.stop();
        } else {
            resolve('');
        }
    });
}

async function handleTranscription(transcription) {
    const transcriptionResult = document.getElementById('transcriptionResult');
    const transcribedText = document.getElementById('transcribedText');
    const recordingStatus = document.getElementById('recordingStatus');
    const practicePhrase = document.getElementById('practicePhrase');
    const aiFeedback = document.getElementById('aiFeedback');
    const pronunciationScore = document.getElementById('pronunciationScore');
    const scoreBarFill = document.getElementById('scoreBarFill');
    const scoreText = document.getElementById('scoreText');
    
    if (!transcription) {
        if (recordingStatus) recordingStatus.textContent = 'No speech detected';
        return;
    }
    
    // Show transcription
    if (transcriptionResult && transcribedText) {
        transcriptionResult.style.display = 'block';
        transcribedText.textContent = transcription;
    }
    
    if (recordingStatus) recordingStatus.textContent = 'Getting feedback...';
    
    const expectedPhrase = practicePhrase?.value.trim() || 'Bom dia, como está?';
    
    // Calculate pronunciation score
    const score = aiSpeech.scorePronunciation(transcription, expectedPhrase);
    
    // Show score
    if (pronunciationScore && scoreBarFill && scoreText) {
        pronunciationScore.style.display = 'block';
        scoreBarFill.style.width = `${score.similarity}%`;
        scoreText.textContent = `${score.similarity}% match`;
    }
    
    // Get AI feedback
    if (aiFeedback) {
        aiFeedback.innerHTML = '<p class="muted">Analyzing your pronunciation...</p>';
        
        try {
            const feedback = await aiTutor.getPronunciationFeedback({
                expected: expectedPhrase,
                actual: transcription,
                score: score.similarity
            });
            
            // Format and display feedback
            let feedbackHtml = '';
            if (score.similarity >= 90) {
                feedbackHtml = `<p class="feedback-correct">✓ Excellent! Your pronunciation is very accurate.</p>`;
            } else if (score.similarity >= 70) {
                feedbackHtml = `<p>Good attempt! Score: ${score.similarity}%</p>`;
            } else {
                feedbackHtml = `<p class="feedback-error">Needs work. Score: ${score.similarity}%</p>`;
            }
            
            if (feedback.feedback) {
                feedbackHtml += `<p class="feedback-suggestion">${feedback.feedback}</p>`;
            }
            
            if (feedback.corrections && feedback.corrections.length > 0) {
                feedbackHtml += '<ul>';
                feedback.corrections.forEach(c => {
                    feedbackHtml += `<li><strong>${c.word}</strong>: ${c.suggestion}</li>`;
                });
                feedbackHtml += '</ul>';
            }
            
            aiFeedback.innerHTML = feedbackHtml;
        } catch (error) {
            console.error('AI feedback failed:', error);
            aiFeedback.innerHTML = `
                <p>Score: ${score.similarity}%</p>
                <p class="muted">AI feedback unavailable. ${score.similarity >= 80 ? 'Good job!' : 'Keep practicing!'}</p>
            `;
        }
    }
    
    if (recordingStatus) recordingStatus.textContent = 'Ready to record';
}
