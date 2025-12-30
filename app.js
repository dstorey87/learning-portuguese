import { getAllLessonsFlat } from './data.js';
import { 
    getAllTopics,
    getAllLessons,
    getLessonById as loaderGetLessonById,
    getLessonImage
} from './src/data/LessonLoader.js';
import {
    ChallengeRenderer,
    buildLessonChallenges,
    normalizeText
} from './src/components/lesson/ChallengeRenderer.js';
import {
    AUTH_CONSTANTS,
    getHearts,
    hasHearts,
    loseHeart,
    getStreak,
    getXP,
    addXP,
    formatRefillTime,
    getTimeToNextHeart,
    startHeartRefillTimer,
    login,
    loginAdmin,
    getUser,
    logout,
    isAdmin
} from './src/services/AuthService.js';
import { userStorage } from './src/services/userStorage.js';
import * as ProgressTracker from './src/services/ProgressTracker.js';
import { getLearnedWords, SRS_INTERVALS } from './src/services/ProgressTracker.js';
import Toast from './src/components/common/Toast.js';
import {
    getWordKnowledge,
    generateBasicPronunciationTip,
    getPronunciationChallengeType
} from './word-knowledge.js';
import * as aiSpeech from './ai-speech.js';
import * as TTSService from './src/services/TTSService.js';
import {
    getPortugueseVoiceOptions,
    getDownloadableVoices,
    markVoiceDownloaded,
    startBundledVoiceDownload,
    speakWithEngine as voiceSpeakWithEngine
} from './src/services/VoiceService.js';

// =========== STUB SERVICES (for features not yet fully wired) ===========
const aiTts = {
    async checkServerHealth() { return TTSService.checkServerHealth(); },
    async speak(text, options = {}) { return TTSService.speak(text, options); }
};

// =========== VOICE/SPEECH STATE ===========
const voiceState = {
    speed: 0.6,
    selectedVoiceKey: null,
    detectedSystemOptions: []
};
const speechState = {
    listening: false,
    recognizer: null,
    reason: 'Speech recognition unavailable.'
};

// =========== FEATURE CONSTANTS (stubs for unimplemented features) ===========
const NOTEPAD_STORAGE_KEY = 'portugueseNotepad';
const FLASHCARDS_STORAGE_KEY = 'portugueseFlashcards';
const DEMO_PHRASE = 'Bom dia, como está?';
const DIALOGUES = [];
const GRAMMAR_CARDS = {};
const MNEMONICS = {};

// =========== STUB FUNCTIONS ===========
function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
}

function loadVoiceSettings() {
    try { return JSON.parse(localStorage.getItem('voiceSettings') || '{}'); }
    catch { return {}; }
}

function saveVoiceSettings(settings) {
    localStorage.setItem('voiceSettings', JSON.stringify(settings));
}

function ensureSpeechRecognition() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

function scoreSpeechTranscript(transcribed, expected) {
    return aiSpeech.scorePronunciation(transcribed, expected);
}

function speakWithEngine(options, state) {
    const opts = typeof options === 'string' ? { text: options } : { ...(options || {}) };
    if (!opts.text) return;
    const resolvedRate = opts.rate ?? state?.speed ?? voiceState.speed ?? 0.6;
    return voiceSpeakWithEngine({ ...opts, rate: resolvedRate });
}

// Debounce helper with namespace support
const _debounceTimers = {};
function debounce(namespace, fn, delay) {
    if (_debounceTimers[namespace]) clearTimeout(_debounceTimers[namespace]);
    _debounceTimers[namespace] = setTimeout(fn, delay);
}

// =========== USER DATA PERSISTENCE ===========
const USER_DATA_KEY_BASE = 'portugueseProgress';
let currentUserId = bootstrapAuthUser();

function sanitizeUserId(name = 'guest') {
    const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return base || 'guest';
}

function getUserDataKey() {
    return `${USER_DATA_KEY_BASE}_${currentUserId || 'guest'}`;
}

function bootstrapAuthUser() {
    let activeUser = getUser();
    if (!activeUser.loggedIn) {
        activeUser = login('Guest');
    }
    const userId = sanitizeUserId(activeUser.username || 'guest');
    localStorage.setItem('currentUserId', userId);

    // Set user context for isolated services
    try { userStorage.setCurrentUser(userId); } catch (err) { console.warn('Failed to set userStorage context', err); }
    try { ProgressTracker.setCurrentUser(userId); } catch (err) { console.warn('Failed to set ProgressTracker user context', err); }

    return userId;
}

function getDefaultUserData() {
    return {
        learnedWords: [],
        lessonsCompleted: 0,
        streak: 0,
        isPremium: false,
        speakerGender: 'male',
        activeLesson: null,
        lastLessonId: null,
        lessonAttempts: [],
        lessonCorrect: [],
        lessonAccuracy: [],
        lessonDurations: [],
        mistakes: [],
        successes: [],
        hardMode: false
    };
}

function normalizeUserData(data = {}) {
    const normalizeArrayish = (value) => {
        if (Array.isArray(value)) return value;
        if (value && typeof value === 'object') return Object.assign([], value);
        return [];
    };

    return {
        ...data,
        learnedWords: Array.isArray(data.learnedWords) ? data.learnedWords : [],
        lessonAttempts: normalizeArrayish(data.lessonAttempts),
        lessonCorrect: normalizeArrayish(data.lessonCorrect),
        lessonAccuracy: normalizeArrayish(data.lessonAccuracy),
        lessonDurations: normalizeArrayish(data.lessonDurations),
        mistakes: Array.isArray(data.mistakes) ? data.mistakes : [],
        successes: Array.isArray(data.successes) ? data.successes : [],
        hardMode: !!data.hardMode
    };
}

function loadUserData() {
    try {
        const stored = localStorage.getItem(getUserDataKey());
        if (stored) {
            return normalizeUserData({
                ...getDefaultUserData(),
                ...JSON.parse(stored)
            });
        }
    } catch (e) {
        console.warn('Failed to load user data:', e);
    }
    return getDefaultUserData();
}

function saveUserData(data = userData) {
    try {
        const normalized = normalizeUserData(data);
        userData = normalized;
        localStorage.setItem(getUserDataKey(), JSON.stringify(normalized));
    } catch (e) {
        console.warn('Failed to save user data:', e);
    }
}

// =========== GLOBALS / STATE ===========
// These are exposed to window for backwards compatibility with other scripts
let userData = loadUserData();
const uiState = {
    selectedTopic: 'all',
    lessonStartMs: null,
    activeLessonState: null,
    skillStats: []
};
const vaultFilters = { query: '', sort: 'pt' };

// Expose critical functions/objects to window for other modules
window.ChallengeRenderer = { ChallengeRenderer, buildLessonChallenges };
window.ProgressTracker = { getLearnedWords };
window.Toast = Toast;

// =========== AI CUSTOM LESSONS ===========
const CUSTOM_LESSONS_KEY = 'ai_custom_lessons';

function getCustomAILessons() {
    const userId = localStorage.getItem('currentUserId') || 'default';
    const storageKey = `${CUSTOM_LESSONS_KEY}_${userId}`;
    try {
        return JSON.parse(localStorage.getItem(storageKey) || '[]');
    } catch {
        return [];
    }
}

function getCustomAILessonById(lessonId) {
    return getCustomAILessons().find(l => l.id === lessonId);
}

// Listen for AI lesson creation/deletion events
window.addEventListener('ai-lesson-created', () => {
    console.log('[AI Lesson] New lesson created, refreshing grid');
    renderLessons();
    Toast.success('🤖 New AI lesson created!', 3000);
});

window.addEventListener('ai-lesson-deleted', () => {
    console.log('[AI Lesson] Lesson deleted, refreshing grid');
    renderLessons();
});

// Listen for AI agent requesting to start a lesson
window.addEventListener('start-lesson', (event) => {
    const { lessonId } = event.detail;
    console.log('[AI Agent] Starting lesson:', lessonId);
    startLesson(lessonId);
});

// =========== LESSON HELPERS ===========
function getLessonByIdForUI(lessonId) {
    // Try custom AI lesson first, then new loader, fallback to legacy
    const customLesson = getCustomAILessonById(lessonId);
    if (customLesson) return customLesson;
    return loaderGetLessonById(lessonId) || getAllLessonsFlat().find(l => l.id === lessonId);
}

// Build a single background-image (no layering) to keep the subject photo visible
function buildLessonThumbStyle(imageData = {}) {
    const sources = [
        imageData.remoteUrl,
        imageData.remoteFallbackUrl,
        imageData.url,
        imageData.localUrl && !imageData.localUrl.endsWith('default.svg') ? imageData.localUrl : null,
        imageData.svgUrl
    ].filter(Boolean);

    const primary = sources[0] || '';
    return primary ? `url("${primary}")` : '';
}

// =========== TOPIC FILTERS & LESSON GRID ===========
function renderTopicFilters() {
    const container = document.getElementById('topicFilters');
    if (!container) return;
    
    const allTopics = getAllTopics();
    const topicList = ['all', ...allTopics.map(t => t.id)];
    
    container.innerHTML = topicList
        .map(id => {
            const label = id === 'all' ? 'All Topics' : allTopics.find(t => t.id === id)?.title || id;
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

function renderLessons() {
    const grid = document.getElementById('lessonGrid');
    if (!grid) return;
    
    const allTopics = getAllTopics();
    let lessons = getAllLessons();
    
    // Filter by selected topic (unless it's 'ai-generated')
    if (uiState.selectedTopic && uiState.selectedTopic !== 'all' && uiState.selectedTopic !== 'ai-generated') {
        lessons = lessons.filter(l => l.topicId === uiState.selectedTopic);
    }
    
    // If viewing AI-generated topic, only show those
    if (uiState.selectedTopic === 'ai-generated') {
        lessons = [];
    }
    
    // Filter out gated lessons for non-premium users
    lessons = lessons.filter(l => !l.gated || userData.isPremium);
    
    grid.innerHTML = '';
    
    // Render standard lessons
    lessons.forEach(lesson => {
        const card = document.createElement('div');
        card.className = 'lesson-card';
        card.dataset.lessonId = lesson.id;
        
        const imageData = getLessonImage(lesson);
        const imageStyle = buildLessonThumbStyle(imageData);
        const topic = allTopics.find(t => t.id === lesson.topicId);
        const accuracy = userData.lessonAccuracy?.[lesson.id];
        const accuracyText = typeof accuracy === 'number' ? `${accuracy}%` : '—';
        
        card.innerHTML = `
            <div class="lesson-thumb" style="background-image: ${imageStyle}"></div>
            <h3>${lesson.title}</h3>
            <p class="lesson-meta">${topic?.title || lesson.topicId} · ${lesson.level || 'beginner'}</p>
            <p class="word-count">${lesson.words?.length || 0} words</p>
            <p class="lesson-accuracy">Accuracy: ${accuracyText}</p>
            ${userData.activeLesson === lesson.id ? '<span class="badge-active">In progress</span>' : ''}
        `;

        const thumb = card.querySelector('.lesson-thumb');
        if (thumb && imageStyle) {
            thumb.style.backgroundImage = imageStyle;
        }
        card.addEventListener('click', () => startLesson(lesson.id));
        grid.appendChild(card);
    });

    // Get custom AI lessons
    const aiLessons = getCustomAILessons();
    
    // Show AI lessons if viewing 'all' or 'ai-generated' topic and there are any
    if (aiLessons.length > 0 && (!uiState.selectedTopic || uiState.selectedTopic === 'all' || uiState.selectedTopic === 'ai-generated')) {
        // Add section header for AI lessons
        const aiHeader = document.createElement('div');
        aiHeader.className = 'ai-lessons-header';
        aiHeader.innerHTML = `
            <h3>🤖 AI-Generated Lessons</h3>
            <p class="muted">Custom lessons created by your AI tutor based on your learning needs</p>
        `;
        grid.appendChild(aiHeader);
        
        // Render AI lessons
        aiLessons.forEach(lesson => {
            const card = document.createElement('div');
            card.className = 'lesson-card ai-lesson-card';
            card.dataset.lessonId = lesson.id;
            
            const accuracy = userData.lessonAccuracy?.[lesson.id];
            const accuracyText = typeof accuracy === 'number' ? `${accuracy}%` : '—';
            const isCompleted = userData.lessonsCompleted && userData.completedLessonIds?.includes(lesson.id);
            
            card.innerHTML = `
                <div class="lesson-thumb ai-lesson-thumb">
                    <span class="ai-badge">🤖 AI</span>
                </div>
                <h3>${lesson.title}</h3>
                <p class="lesson-meta">${lesson.focusArea || 'Mixed'} · ${lesson.difficulty || 'beginner'}</p>
                <p class="word-count">${lesson.words?.length || 0} words</p>
                <p class="lesson-accuracy">Accuracy: ${accuracyText}</p>
                ${isCompleted ? '<span class="badge-completed">✓ Completed</span>' : ''}
                ${userData.activeLesson === lesson.id ? '<span class="badge-active">In progress</span>' : ''}
                <button class="delete-ai-lesson" data-lesson-id="${lesson.id}" title="Delete this lesson">🗑️</button>
            `;
            
            // Click to start lesson (not on delete button)
            card.addEventListener('click', (e) => {
                if (!e.target.classList.contains('delete-ai-lesson')) {
                    startLesson(lesson.id);
                }
            });
            
            grid.appendChild(card);
        });
        
        // Add delete button listeners
        grid.querySelectorAll('.delete-ai-lesson').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const lessonId = btn.dataset.lessonId;
                if (confirm('Delete this AI-generated lesson?')) {
                    deleteCustomAILesson(lessonId);
                }
            });
        });
    }

    if (!lessons.length && aiLessons.length === 0) {
        grid.innerHTML = '<p class="muted">No lessons available for this filter.</p>';
    }
}

// Delete a custom AI lesson
function deleteCustomAILesson(lessonId) {
    const userId = localStorage.getItem('currentUserId') || 'default';
    const storageKey = `${CUSTOM_LESSONS_KEY}_${userId}`;
    const lessons = getCustomAILessons().filter(l => l.id !== lessonId);
    localStorage.setItem(storageKey, JSON.stringify(lessons));
    renderLessons();
    Toast.info('AI lesson deleted', 2000);
}

// =========== DUOLINGO-STYLE LESSON FLOW ===========
// Clean implementation: data-driven challenges + accordion layout via ChallengeRenderer

function startLesson(lessonId) {
    const lesson = getLessonByIdForUI(lessonId);
    if (!lesson) return;
    if (lesson.gated && !userData.isPremium) {
        showPaywall();
        return;
    }

    if (!hasHearts()) {
        showHeartsModal();
        return;
    }

    userData.activeLesson = lessonId;
    uiState.lessonStartMs = Date.now();
    saveUserData();

    const challenges = buildLessonChallenges(lesson, {
        learnedWords: getLearnedWords()
    });

    const lessonState = {
        lesson,
        challenges,
        currentIndex: 0,
        correct: 0,
        mistakes: 0,
        startTime: Date.now(),
        wrongAnswers: [],
        hardMode: !!userData.hardMode
    };

    uiState.activeLessonState = lessonState;

    const section = document.querySelector('.learning-section');
    if (!section) return;

    const renderHearts = () => {
        const heartsEl = document.getElementById('lessonHearts');
        if (!heartsEl) return;
        const hearts = getHearts();
        heartsEl.innerHTML = hearts === Infinity
            ? '<span class="unlimited-hearts">∞</span>'
            : '❤️'.repeat(Math.max(0, hearts)) + '🖤'.repeat(Math.max(0, AUTH_CONSTANTS.MAX_HEARTS - hearts));
    };

    section.innerHTML = `
        <div class="lesson-flow">
            <div class="lesson-flow-header">
                <button class="btn-back" id="backToLessons">✕</button>
                <div class="lesson-progress-bar">
                    <div class="lesson-progress-fill" id="lessonProgressFill"></div>
                </div>
                <label class="lesson-mode-toggle">
                    <input type="checkbox" id="hardModeToggle" ${lessonState.hardMode ? 'checked' : ''}>
                    <span>Hard mode (type answers)</span>
                </label>
                <div class="lesson-hearts" id="lessonHearts"></div>
            </div>
            <div class="lesson-challenge-container" id="challengeContainer"></div>
        </div>
    `;

    renderHearts();

    lessonState.renderer = new ChallengeRenderer({
        playWord: (value, speed = 1) => {
            if (value && typeof value === 'object') {
                const resolved = resolveWordForm(value, userData.speakerGender);
                return playWord(resolved, speed);
            }
            return playWord(value, speed);
        },
        getWordKnowledge,
        generatePronunciationTip: generateBasicPronunciationTip,
        getPronunciationChallengeType,
        testPronunciation: async (target, options = {}) => aiSpeech.testPronunciation(target, options),
        saveToFlashcards,
        loseHeart,
        getHearts,
        hasHearts,
        speakerGender: userData.speakerGender,
        isHardMode: lessonState.hardMode,
        onChallengeComplete: (state) => {
            state.currentIndex += 1;
            renderChallenge(state);
        },
        onHeartsUpdate: renderHearts,
        onShowHeartsModal: showHeartsModal
    });

    const hardModeToggle = document.getElementById('hardModeToggle');
    if (hardModeToggle) {
        hardModeToggle.checked = lessonState.hardMode;
        hardModeToggle.addEventListener('change', () => {
            lessonState.hardMode = hardModeToggle.checked;
            userData.hardMode = lessonState.hardMode;
            saveUserData();
            lessonState.renderer?.setHardMode(lessonState.hardMode);
            renderChallenge(lessonState);
        });
    }

    document.getElementById('backToLessons').addEventListener('click', () => {
        if (!confirm('Exit lesson? Your progress will be saved.')) return;
        lessonState.renderer?.destroy();
        backToLessons();
    });

    renderChallenge(lessonState);
}

function renderChallenge(state) {
    const container = document.getElementById('challengeContainer');
    const progressFill = document.getElementById('lessonProgressFill');
    if (!container) return;

    const progress = (state.currentIndex / state.challenges.length) * 100;
    if (progressFill) progressFill.style.width = `${progress}%`;

    if (state.currentIndex >= state.challenges.length) {
        renderLessonComplete(state);
        return;
    }

    const challenge = state.challenges[state.currentIndex];
    state.renderer?.setSpeakerGender(userData.speakerGender);
    if (state.renderer?.setHardMode) {
        state.renderer.setHardMode(state.hardMode);
    }
    state.renderer?.render(container, challenge, state);
}

function renderLessonComplete(state) {
    const container = document.getElementById('challengeContainer');
    if (!container) return;

    state.renderer?.destroy();
    state.renderer = null;
    uiState.activeLessonState = null;

    const durationSec = Math.max(1, Math.round((Date.now() - state.startTime) / 1000));
    const minutes = Math.floor(durationSec / 60);
    const seconds = durationSec % 60;

    const gradedChallenges = (state.challenges || []).filter(c => c.type !== 'learn-word');
    const gradedCount = gradedChallenges.length || 1;
    const correct = Math.max(0, state.correct || 0);
    const accuracy = Math.min(100, Math.round((correct / gradedCount) * 100));

    container.innerHTML = `
        <div class="challenge-card lesson-complete">
            <div class="challenge-instruction">Lesson complete</div>
            <div class="completion-message">
                <h2>Complete</h2>
                <div class="completion-stats">
                    <div><strong>Accuracy:</strong> ${accuracy}%</div>
                    <div><strong>Time:</strong> ${minutes}:${String(seconds).padStart(2, '0')}</div>
                </div>
            </div>
            <div class="challenge-footer">
                <button class="btn-continue" id="finishLessonBtn">Finish</button>
            </div>
        </div>
    `;

    document.getElementById('finishLessonBtn')?.addEventListener('click', () => {
        completeLesson(state.lesson, { showAlert: false });
    });
}

// Escape HTML special characters
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Removed unused fill-in and speak practice renderers (no UI containers)

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
function completeLesson(lesson, options = {}) {
    const { showAlert = true } = options;
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

    if (showAlert) {
        alert(`🎉 Lesson complete! You learned ${lesson.words.length} words.`);
    }
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

    const accuracies = Array.isArray(userData.lessonAccuracy)
        ? userData.lessonAccuracy.filter(val => typeof val === 'number')
        : [];
    const avgAccuracy = accuracies.length ? Math.round(accuracies.reduce((a, b) => a + b, 0) / accuracies.length) : 0;
    if (accuracyEl) accuracyEl.textContent = accuracies.length ? `${avgAccuracy}% avg accuracy` : 'No accuracy data yet';

    const durations = Array.isArray(userData.lessonDurations)
        ? userData.lessonDurations.map(Number).filter(val => Number.isFinite(val) && val > 0)
        : [];
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
                voice: aiState.selectedVoice,  // Use user's selected voice
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
// eslint-disable-next-line no-unused-vars
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

// eslint-disable-next-line no-unused-vars
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

// eslint-disable-next-line no-unused-vars
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

// eslint-disable-next-line no-unused-vars
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
// eslint-disable-next-line no-unused-vars
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
    
    // User button - shows login modal for guests, logout option for logged-in users
    const userBtn = document.getElementById('userBtn');
    if (userBtn) {
        userBtn.addEventListener('click', () => {
            const user = getUser();
            if (user.loggedIn && user.username && user.username !== 'Guest') {
                // Already logged in - ask if they want to logout
                if (confirm(`Logged in as ${user.username}. Do you want to log out?`)) {
                    handleLogout();
                }
            } else {
                // Not logged in - show login modal
                showLoginModal();
            }
        });
    }
    
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

    if (pageName === 'learn') {
        renderTopicFilters();
        renderLessons();
        hookSpeakerRadios();
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
    updateUserButton();
}

/**
 * Update the user button in the header to show current user status
 */
function updateUserButton() {
    const userBtn = document.getElementById('userBtn');
    if (!userBtn) return;
    
    const user = getUser();
    if (user.loggedIn && user.username && user.username !== 'Guest') {
        // Logged in user
        const displayName = user.username.length > 10 ? user.username.slice(0, 10) + '…' : user.username;
        userBtn.innerHTML = user.isAdmin ? `👑 ${displayName}` : `👤 ${displayName}`;
        userBtn.title = `Logged in as ${user.username}. Click to logout.`;
        userBtn.classList.add('logged-in');
    } else {
        // Guest
        userBtn.innerHTML = '👤 Guest';
        userBtn.title = 'Click to sign in';
        userBtn.classList.remove('logged-in');
    }
}

function setActiveUserContext(user) {
    currentUserId = sanitizeUserId(user?.username || 'guest');
    localStorage.setItem('currentUserId', currentUserId);
    
    // CRITICAL: Set user context for ALL user-isolated services
    try {
        userStorage.setCurrentUser(currentUserId);
    } catch (err) {
        console.warn('Failed to bind userStorage context', err);
    }
    
    // Set ProgressTracker user context (loads their specific data)
    try {
        ProgressTracker.setCurrentUser(currentUserId);
    } catch (err) {
        console.warn('Failed to set ProgressTracker user context', err);
    }
    
    userData = loadUserData();
    saveUserData(userData);
    updateHeaderStats();
    renderLessons();
    
    // Show/hide admin nav tab based on admin status
    const adminNavTab = document.getElementById('adminNavTab');
    if (adminNavTab) {
        adminNavTab.style.display = user?.isAdmin ? 'flex' : 'none';
    }
    
    // Initialize admin dashboard if admin
    if (user?.isAdmin) {
        try {
            import('./src/pages/admin/AdminDashboard.js').then(module => {
                module.initAdminDashboard();
                const container = document.getElementById('adminDashboardContainer');
                if (container) {
                    container.innerHTML = module.renderAdminDashboard();
                }
            }).catch(err => {
                console.warn('Failed to load admin dashboard:', err);
            });
        } catch (err) {
            console.warn('Failed to import admin dashboard:', err);
        }
    }
    
    console.log(`[AUTH] User context set: ${currentUserId} - all data is now user-specific`);
}

function showLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        // Reset inline positioning and use the CSS class for proper centering
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.right = '0';
        modal.style.bottom = '0';
        modal.classList.add('active');
        
        const usernameInput = document.getElementById('usernameInput');
        if (usernameInput) usernameInput.focus();
    }
}

function hideLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
    }
    const error = document.getElementById('loginError');
    if (error) error.style.display = 'none';
    const usernameInput = document.getElementById('usernameInput');
    if (usernameInput) usernameInput.value = '';
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

function handleUserLogin() {
    const usernameInput = document.getElementById('usernameInput');
    const passwordInput = document.getElementById('adminPassword');
    const errorEl = document.getElementById('loginError');
    const username = (usernameInput?.value || '').trim();
    const password = (passwordInput?.value || '').trim();

    const wantsAdmin = !!password;

    if (!username && !wantsAdmin) {
        if (errorEl) {
            errorEl.textContent = 'Please enter a name to continue.';
            errorEl.style.display = 'block';
        }
        return;
    }

    if (wantsAdmin) {
        const result = loginAdmin(password);
        if (!result.success) {
            if (errorEl) {
                errorEl.textContent = result.error || 'Invalid admin password';
                errorEl.style.display = 'block';
            }
            return;
        }
        setActiveUserContext(result.user);
        hideLoginModal();
        showNotification(`👑 Welcome, Admin`, 'success');
        return;
    }

    const user = login(username);
    setActiveUserContext(user);
    hideLoginModal();
    showNotification(`👋 Welcome, ${username}!`, 'success');
}

function handleGuestLogin() {
    const user = login('Guest');
    setActiveUserContext(user);
    hideLoginModal();
    showNotification('Continuing as Guest', 'info');
}

function handleLogout() {
    logout();
    currentUserId = bootstrapAuthUser();
    userData = loadUserData();
    renderLessons();
    updateHeaderStats();
    showNotification('Logged out', 'info');
}

// showNotification now delegates to Toast component
function showNotification(message, type = 'info') {
    // Prefer the namespace helper; fallback to the core show method
    if (typeof Toast.notify === 'function') {
        return Toast.notify(message, type);
    }
    if (typeof Toast.show === 'function') {
        return Toast.show(message, type);
    }
    // Final fallback to type-specific helpers
    if (type === 'success' && typeof Toast.success === 'function') {
        return Toast.success(message);
    }
    if (type === 'error' && typeof Toast.error === 'function') {
        return Toast.error(message);
    }
    if (type === 'warning' && typeof Toast.warning === 'function') {
        return Toast.warning(message);
    }
    if (typeof Toast.info === 'function') {
        return Toast.info(message);
    }
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
        loginBtn.addEventListener('click', handleUserLogin);
    }

    const guestBtn = document.getElementById('guestBtn');
    if (guestBtn) {
        guestBtn.addEventListener('click', handleGuestLogin);
    }
    
    const usernameInput = document.getElementById('usernameInput');
    if (usernameInput) {
        usernameInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') handleUserLogin();
        });
    }
    
    const passwordInput = document.getElementById('adminPassword');
    if (passwordInput) {
        passwordInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') handleUserLogin();
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

// eslint-disable-next-line no-unused-vars
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

// Quiz scoring is now handled inline in the finish() function

// ===== AI Tutor Integration =====
const aiState = {
    ttsAvailable: false,
    whisperLoaded: false,
    whisperLoading: false,
    ollamaAvailable: false,
    recording: false,
    selectedVoice: 'pt-PT-DuarteNeural'  // Male voice (user preference)
};

// ============================================================================
// BOOTSTRAP
// ============================================================================

function initApp() {
    // Wire navigation + hash-based routing
    setupNavigation();

    // Wire app-wide UI event handlers
    setupEventListeners();

    // Initial Learn page content
    renderTopicFilters();
    renderLessons();
    hookSpeakerRadios();

    // Header/profile stats
    updateDashboard();
}

// Ensure routing/navigation and core UI wiring is initialized.
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        try {
            initApp();
        } catch (err) {
            console.error('App initialization failed:', err);
        }
    });
} else {
    try {
        initApp();
    } catch (err) {
        console.error('App initialization failed:', err);
    }
}
