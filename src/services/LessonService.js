/**
 * Lesson Service
 * 
 * Manages lesson logic, challenges, and progress tracking:
 * - Lesson state management
 * - Challenge building and sequencing
 * - Progress tracking and accuracy
 * - Word resolution and gender handling
 * - Hint generation for mistakes
 * 
 * @module services/LessonService
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Lesson configuration
 */
export const LESSON_CONFIG = {
    maxPronunciationWords: 4,
    maxFillWords: 5,
    maxListenWords: 3,
    maxPronunciationAttempts: 3,
    defaultQuizOptions: 4
};

/**
 * Challenge types
 */
export const CHALLENGE_TYPES = {
    LEARN_WORD: 'learn-word',
    PRONUNCIATION: 'pronunciation',
    MCQ: 'mcq',
    TYPE_ANSWER: 'type-answer',
    LISTEN_TYPE: 'listen-type',
    SENTENCE: 'sentence',
    // Rescue-specific learning style drills
    RESCUE_KEYWORD: 'rescue-keyword-mnemonic',
    RESCUE_MULTI_SENSORY: 'rescue-multi-sensory',
    RESCUE_MEMORY_PALACE: 'rescue-memory-palace',
    RESCUE_ACTIVE_RECALL: 'rescue-active-recall',
    RESCUE_SPACED_REPETITION: 'rescue-spaced-repetition',
    RESCUE_FEYNMAN: 'rescue-feynman',
    RESCUE_CONTEXT_FLOOD: 'rescue-context-flood'
};

/**
 * Challenge phases
 */
export const CHALLENGE_PHASES = {
    LEARN: 'learn',
    PRONOUNCE: 'pronounce',
    PRACTICE: 'practice',
    APPLY: 'apply'
};

// ============================================================================
// STATE
// ============================================================================

let state = {
    currentLesson: null,
    currentChallenges: [],
    currentIndex: 0,
    correct: 0,
    mistakes: 0,
    startTime: null,
    wrongAnswers: [],
    lessonStartMs: null
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Shuffle array (Fisher-Yates)
 * @param {Array} array - Array to shuffle
 * @returns {Array} Shuffled array
 */
function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

/**
 * Get unique key for a word
 * @param {Object} word - Word object
 * @returns {string} Word key
 */
export function getWordKey(word) {
    const pt = (word.pt || '').toLowerCase().trim();
    const en = (word.en || '').toLowerCase().trim();
    return `${pt}|${en}`;
}

/**
 * Resolve word form based on gender
 * @param {Object} word - Word object
 * @param {string} gender - Speaker gender
 * @returns {string} Resolved Portuguese form
 */
export function resolveWordForm(word, gender = 'female') {
    if (!word) return '';
    
    // Check for gender-specific forms
    if (word.genderForms) {
        return word.genderForms[gender] || word.genderForms.neutral || word.pt;
    }
    
    // Handle common patterns
    const pt = word.pt || '';
    
    // obrigado/obrigada pattern
    if (/obrigad[oa]$/i.test(pt)) {
        return gender === 'male' ? pt.replace(/[oa]$/i, 'o') : pt.replace(/[oa]$/i, 'a');
    }
    
    // Adjectives ending in -o/-a
    if (word.isAdjective && /[oa]$/i.test(pt)) {
        return gender === 'male' ? pt.replace(/a$/i, 'o') : pt.replace(/o$/i, 'a');
    }
    
    return pt;
}

// ============================================================================
// CHALLENGE BUILDING
// ============================================================================

/**
 * Build quiz options for a word
 * @param {Object} targetWord - Target word
 * @param {Array} allWords - All words in lesson
 * @returns {Array} Quiz options
 */
export function buildQuizOptions(targetWord, allWords) {
    const options = [targetWord.en];
    
    // Get other words as distractors
    const others = allWords.filter(w => getWordKey(w) !== getWordKey(targetWord));
    const shuffled = shuffleArray(others);
    
    // Add up to 3 distractors
    for (const word of shuffled) {
        if (options.length >= LESSON_CONFIG.defaultQuizOptions) break;
        if (!options.includes(word.en)) {
            options.push(word.en);
        }
    }
    
    // If not enough options, add generic distractors
    const genericDistractors = ['Hello', 'Goodbye', 'Yes', 'No', 'Please', 'Thank you', 'Water', 'Food'];
    for (const distractor of shuffleArray(genericDistractors)) {
        if (options.length >= LESSON_CONFIG.defaultQuizOptions) break;
        if (!options.includes(distractor)) {
            options.push(distractor);
        }
    }
    
    return shuffleArray(options);
}

/**
 * Build challenges for a lesson
 * @param {Object} lesson - Lesson object
 * @returns {Array} Challenge sequence
 */
export function buildLessonChallenges(lesson) {
    // If lesson provides pre-built challenges (e.g., AI rescue lessons), honor them
    if (lesson.challenges && lesson.challenges.length > 0) {
        return lesson.challenges.map((challenge, idx) => {
            const resolvedWord = typeof challenge.wordIndex === 'number'
                ? lesson.words?.[challenge.wordIndex]
                : challenge.word;
            return {
                ...challenge,
                word: resolvedWord || challenge.word,
                index: challenge.index ?? idx
            };
        });
    }

    const challenges = [];
    const words = lesson.words || [];
    const sentences = lesson.sentences || [];
    
    // Phase 1: Learn new words (listen & see)
    words.forEach((word, idx) => {
        challenges.push({
            type: CHALLENGE_TYPES.LEARN_WORD,
            word,
            phase: CHALLENGE_PHASES.LEARN,
            index: idx
        });
    });
    
    // Phase 2: Pronunciation practice
    const pronWords = shuffleArray([...words]).slice(0, LESSON_CONFIG.maxPronunciationWords);
    pronWords.forEach(word => {
        challenges.push({
            type: CHALLENGE_TYPES.PRONUNCIATION,
            word,
            phase: CHALLENGE_PHASES.PRONOUNCE,
            maxAttempts: LESSON_CONFIG.maxPronunciationAttempts
        });
    });
    
    // Phase 3: Multiple choice quizzes
    const shuffledWords = shuffleArray([...words]);
    shuffledWords.forEach(word => {
        challenges.push({
            type: CHALLENGE_TYPES.MCQ,
            word,
            phase: CHALLENGE_PHASES.PRACTICE,
            options: buildQuizOptions(word, words)
        });
    });
    
    // Phase 4: Type the Portuguese
    const fillWords = shuffleArray([...words]).slice(0, LESSON_CONFIG.maxFillWords);
    fillWords.forEach(word => {
        challenges.push({
            type: CHALLENGE_TYPES.TYPE_ANSWER,
            word,
            phase: CHALLENGE_PHASES.PRACTICE
        });
    });
    
    // Phase 5: Listen and type
    const listenWords = shuffleArray([...words]).slice(0, LESSON_CONFIG.maxListenWords);
    listenWords.forEach(word => {
        challenges.push({
            type: CHALLENGE_TYPES.LISTEN_TYPE,
            word,
            phase: CHALLENGE_PHASES.PRACTICE
        });
    });
    
    // Phase 6: Sentences
    sentences.forEach(sentence => {
        challenges.push({
            type: CHALLENGE_TYPES.SENTENCE,
            sentence,
            phase: CHALLENGE_PHASES.APPLY
        });
    });
    
    return challenges;
}

// ============================================================================
// LESSON STATE MANAGEMENT
// ============================================================================

/**
 * Initialize lesson state
 * @param {Object} lesson - Lesson object
 * @returns {Object} Lesson state
 */
export function initLessonState(lesson) {
    const challenges = buildLessonChallenges(lesson);
    
    state = {
        currentLesson: lesson,
        currentChallenges: challenges,
        currentIndex: 0,
        correct: 0,
        mistakes: 0,
        startTime: Date.now(),
        wrongAnswers: [],
        lessonStartMs: Date.now()
    };
    
    return getLessonState();
}

/**
 * Get current lesson state
 * @returns {Object} Lesson state
 */
export function getLessonState() {
    return {
        lesson: state.currentLesson,
        challenges: state.currentChallenges,
        currentIndex: state.currentIndex,
        correct: state.correct,
        mistakes: state.mistakes,
        startTime: state.startTime,
        wrongAnswers: [...state.wrongAnswers],
        lessonStartMs: state.lessonStartMs,
        progress: state.currentChallenges.length > 0 
            ? (state.currentIndex / state.currentChallenges.length) * 100 
            : 0,
        isComplete: state.currentIndex >= state.currentChallenges.length,
        currentChallenge: state.currentChallenges[state.currentIndex] || null
    };
}

/**
 * Get current challenge
 * @returns {Object|null} Current challenge
 */
export function getCurrentChallenge() {
    return state.currentChallenges[state.currentIndex] || null;
}

/**
 * Advance to next challenge
 * @returns {Object} Updated state
 */
export function nextChallenge() {
    state.currentIndex++;
    return getLessonState();
}

/**
 * Record correct answer
 * @returns {Object} Updated state
 */
export function recordCorrect() {
    state.correct++;
    return getLessonState();
}

/**
 * Record mistake
 * @param {Object} word - Word that was wrong
 * @returns {Object} Updated state
 */
export function recordMistake(word) {
    state.mistakes++;
    if (word) {
        state.wrongAnswers.push(word);
    }
    return getLessonState();
}

/**
 * Reset lesson state
 */
export function resetLessonState() {
    state = {
        currentLesson: null,
        currentChallenges: [],
        currentIndex: 0,
        correct: 0,
        mistakes: 0,
        startTime: null,
        wrongAnswers: [],
        lessonStartMs: null
    };
}

/**
 * Calculate lesson duration in seconds
 * @returns {number} Duration in seconds
 */
export function getLessonDuration() {
    if (!state.lessonStartMs) return 0;
    return Math.max(1, Math.round((Date.now() - state.lessonStartMs) / 1000));
}

/**
 * Calculate lesson accuracy
 * @returns {number} Accuracy percentage
 */
export function getLessonAccuracy() {
    const total = state.correct + state.mistakes;
    if (total === 0) return 100;
    return Math.round((state.correct / total) * 100);
}

// ============================================================================
// ACCURACY TRACKING
// ============================================================================

/**
 * Calculate accuracy for a lesson
 * @param {number} attempts - Total attempts
 * @param {number} correct - Correct answers
 * @returns {number} Accuracy percentage
 */
export function calculateAccuracy(attempts, correct) {
    if (!attempts || attempts === 0) return 0;
    return Math.round((correct / attempts) * 100);
}

/**
 * Update lesson accuracy in user data structure
 * @param {Object} userData - User data
 * @param {number} lessonIndex - Lesson index
 * @param {boolean} isCorrect - Whether answer was correct
 * @returns {Object} Updated data
 */
export function updateLessonAccuracyData(userData, lessonIndex, isCorrect) {
    if (lessonIndex < 0) return userData;
    
    const data = { ...userData };
    
    // Initialize arrays if needed
    if (!Array.isArray(data.lessonAttempts)) data.lessonAttempts = [];
    if (!Array.isArray(data.lessonCorrect)) data.lessonCorrect = [];
    if (!Array.isArray(data.lessonAccuracy)) data.lessonAccuracy = [];
    
    // Update counts
    data.lessonAttempts[lessonIndex] = (data.lessonAttempts[lessonIndex] || 0) + 1;
    if (isCorrect) {
        data.lessonCorrect[lessonIndex] = (data.lessonCorrect[lessonIndex] || 0) + 1;
    }
    
    // Calculate accuracy
    const attempts = data.lessonAttempts[lessonIndex] || 0;
    const correct = data.lessonCorrect[lessonIndex] || 0;
    data.lessonAccuracy[lessonIndex] = calculateAccuracy(attempts, correct);
    
    return data;
}

// ============================================================================
// HINT GENERATION
// ============================================================================

/**
 * Build hint for a word
 * @param {Object} item - Mistake item
 * @returns {string} Hint text
 */
export function buildHintForWord(item) {
    const text = (item.pt || '').toLowerCase();
    
    if (/ão|õe|õe?s|ães|ãos/.test(text)) {
        return 'Shorten the vowel then nasalize: practice "pão / mãos / corações" with slow audio.';
    }
    if (/obrigad[oa]/.test(text)) {
        return 'Match gender: obrigado (masc), obrigada (fem). Say it after every request to cement formality.';
    }
    if (/por favor/.test(text)) {
        return 'Pair "por favor" with rising intonation; follow with obrigada/obrigado to close politely.';
    }
    if (/metro|comboio|autocarro/.test(text)) {
        return 'Transport nouns use o artigo "o". Drill: "Onde fica o metro/o comboio/o autocarro?".';
    }
    if (/sou|estou|tenho/.test(text)) {
        return 'Ser vs. estar vs. ter: ser=permanent, estar=state/location, ter=possession. Build 3 mini sentences for each.';
    }
    
    return 'Say the Portuguese twice, then EN once. Record and compare to the demo audio, fixing one sound (s/ʃ/ʒ/r) at a time.';
}

/**
 * Generate hints from mistakes
 * @param {Array} mistakes - User mistakes
 * @param {number} limit - Max hints
 * @returns {Array} Hints
 */
export function generateHints(mistakes = [], limit = 5) {
    const sorted = [...mistakes].sort((a, b) => 
        (b.count || 0) - (a.count || 0) || 
        (b.lastSeen || 0) - (a.lastSeen || 0)
    );
    
    const hints = sorted.slice(0, limit).map(item => {
        const tip = buildHintForWord(item);
        return { ...item, tip };
    });
    
    if (hints.length === 0) {
        return [{
            key: 'foundation-pronunciation',
            pt: 'Pronúncia',
            en: 'Pronunciation',
            count: 0,
            tip: 'Shadow the demo phrase at 0.9× speed, focusing on nasal vowels (ão/ãe/õe) and stress. Repeat 3–5 times.'
        }];
    }
    
    return hints;
}

// ============================================================================
// MNEMONICS
// ============================================================================

/**
 * Built-in mnemonics
 */
const MNEMONICS = {
    'obrigado': 'Think: "I\'m obligated to thank you" → obrigado',
    'obrigada': 'Think: "I\'m obligated to thank you" → obrigada (feminine)',
    'bom dia': 'Bom = Boom! Good morning boom! → Bom dia',
    'boa tarde': 'BOA constrictor in the afternoon → Boa tarde',
    'boa noite': 'BOA constrictor at night → Boa noite',
    'olá': 'Sounds like "oh-LAH!" with excitement → Olá',
    'adeus': 'A-DEUS (to God) - formal goodbye → Adeus',
    'tchau': 'Like Italian "ciao" → Tchau',
    'sim': 'SEEM simple = yes → Sim',
    'não': 'NOW with nasal = no → Não',
    'por favor': 'Pour favor = please pour me a favor → Por favor',
    'desculpe': 'Des-CULL-pay = excuse me → Desculpe',
    'água': 'AH-gwa = water → Água',
    'café': 'Ka-FEH = coffee (like English) → Café',
    'eu': 'EH-oo = I → Eu',
    'tu': 'TOO = you (informal) → Tu',
    'você': 'vo-SEH = you (formal) → Você',
    'nós': 'NOSH = we (rhymes with "wash") → Nós',
    'eles': 'EL-esh = they (masc) → Eles',
    'elas': 'EL-ash = they (fem) → Elas'
};

/**
 * Get mnemonic for a word
 * @param {Object} word - Word object
 * @returns {string|null} Mnemonic
 */
export function getMnemonic(word) {
    const pt = (word.pt || '').toLowerCase();
    return MNEMONICS[pt] || null;
}

/**
 * Get all mnemonics
 * @returns {Object} All mnemonics
 */
export function getAllMnemonics() {
    return { ...MNEMONICS };
}

// ============================================================================
// LESSON COMPLETION
// ============================================================================

/**
 * Build lesson completion data
 * @param {Object} lesson - Lesson object
 * @param {string} speakerGender - Speaker gender
 * @returns {Object} Completion data
 */
export function buildLessonCompletionData(lesson, speakerGender = 'female') {
    const words = lesson.words || [];
    const lessonId = lesson.id;
    
    const learnedWords = words.map(word => {
        const resolved = resolveWordForm(word, speakerGender);
        return {
            ...word,
            pt: resolved,
            resolvedFrom: word.pt,
            genderUsed: speakerGender,
            lessonId,
            topicId: lesson.topicId,
            topicTitle: lesson.topicTitle,
            srsLevel: 1,
            lastReviewed: Date.now()
        };
    });
    
    return {
        lessonId,
        learnedWords,
        wordCount: words.length,
        duration: getLessonDuration(),
        accuracy: getLessonAccuracy(),
        correct: state.correct,
        mistakes: state.mistakes,
        wrongAnswers: state.wrongAnswers,
        timestamp: Date.now()
    };
}

/**
 * Calculate XP earned for lesson
 * @param {Object} completionData - Completion data
 * @returns {number} XP earned
 */
export function calculateLessonXP(completionData) {
    const baseXP = 10;
    const wordXP = (completionData.wordCount || 0) * 2;
    const accuracyBonus = completionData.accuracy >= 90 ? 5 : 0;
    const perfectBonus = completionData.mistakes === 0 ? 10 : 0;
    
    return baseXP + wordXP + accuracyBonus + perfectBonus;
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
    // Config
    LESSON_CONFIG,
    CHALLENGE_TYPES,
    CHALLENGE_PHASES,
    
    // Utilities
    getWordKey,
    resolveWordForm,
    buildQuizOptions,
    
    // Challenge building
    buildLessonChallenges,
    
    // State management
    initLessonState,
    getLessonState,
    getCurrentChallenge,
    nextChallenge,
    recordCorrect,
    recordMistake,
    resetLessonState,
    getLessonDuration,
    getLessonAccuracy,
    
    // Accuracy
    calculateAccuracy,
    updateLessonAccuracyData,
    
    // Hints
    buildHintForWord,
    generateHints,
    
    // Mnemonics
    getMnemonic,
    getAllMnemonics,
    
    // Completion
    buildLessonCompletionData,
    calculateLessonXP
};
