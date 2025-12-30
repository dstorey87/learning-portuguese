/**
 * Progress Tracker Service
 * 
 * Tracks learning progress, word mastery, and skill development:
 * - Words learned and SRS levels
 * - Lesson completion history
 * - Skill statistics and charts
 * - Learning milestones
 * - Study recommendations
 * 
 * @module services/ProgressTracker
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Progress tracking configuration
 */
export const PROGRESS_CONFIG = {
    maxWordsPerDay: 50,
    maxLessonsPerDay: 20,
    srsLevelMax: 5,
    streakMilestones: [3, 7, 14, 30, 60, 100, 365],
    xpMilestones: [100, 500, 1000, 2500, 5000, 10000]
};

/**
 * SM-2 Spaced Repetition intervals (days)
 */
export const SRS_INTERVALS = {
    1: 1,    // Level 1: 1 day
    2: 3,    // Level 2: 3 days
    3: 7,    // Level 3: 1 week
    4: 14,   // Level 4: 2 weeks
    5: 30    // Level 5: 1 month
};

/**
 * Skill categories
 */
export const SKILL_CATEGORIES = {
    VOCABULARY: 'vocabulary',
    PRONUNCIATION: 'pronunciation',
    LISTENING: 'listening',
    GRAMMAR: 'grammar',
    READING: 'reading',
    SPEAKING: 'speaking'
};

/**
 * Progress events
 */
export const PROGRESS_EVENTS = {
    WORD_LEARNED: 'progressWordLearned',
    LESSON_COMPLETED: 'progressLessonCompleted',
    MILESTONE_REACHED: 'progressMilestoneReached',
    SRS_REVIEW_DUE: 'progressSrsReviewDue',
    SKILL_UPDATED: 'progressSkillUpdated',
    PRONUNCIATION_RECORDED: 'progressPronunciationRecorded',
    PHONEME_WEAKNESS_DETECTED: 'progressPhonemeWeaknessDetected'
};

// ============================================================================
// STATE
// ============================================================================

let progressState = {
    learnedWords: [],
    completedLessons: [],
    skillStats: {},
    milestones: [],
    studySessions: [],
    pronunciationHistory: {},  // Per-word pronunciation attempts
    phonemeWeaknesses: {},     // Tracked phoneme issues
    lastSyncTime: null
};

// ============================================================================
// STORAGE HELPERS - USER-ISOLATED (CRITICAL!)
// ============================================================================

const STORAGE_KEY = 'portulingo_progress';
let currentUserId = null;

/**
 * Set the current user ID - MUST be called on login/app init
 * All progress data is isolated per user
 */
export function setCurrentUser(userId) {
    if (!userId) {
        console.warn('ProgressTracker: No userId provided, using "guest"');
        userId = 'guest';
    }
    currentUserId = userId;
    // Load this user's progress when they're set
    loadProgress();
}

/**
 * Get current user ID (never returns null - defaults to 'guest')
 */
export function getCurrentUserId() {
    if (!currentUserId) {
        // Try to get from localStorage (set by AuthService)
        currentUserId = localStorage.getItem('currentUserId') || 'guest';
    }
    return currentUserId;
}

/**
 * Get user-specific storage key
 * ALWAYS prefixed with userId to ensure data isolation
 */
function getUserStorageKey() {
    const userId = getCurrentUserId();
    return `${userId}_${STORAGE_KEY}`;
}

/**
 * Load progress from localStorage for CURRENT user only
 * @returns {Object} Progress data
 */
export function loadProgress() {
    try {
        const key = getUserStorageKey();
        const saved = localStorage.getItem(key);
        if (saved) {
            progressState = { ...createDefaultProgressState(), ...JSON.parse(saved) };
        } else {
            // No saved progress for this user - start fresh
            progressState = createDefaultProgressState();
        }
        console.log(`ProgressTracker: Loaded progress for user "${getCurrentUserId()}" (${progressState.learnedWords?.length || 0} words)`);
    } catch (e) {
        console.error('Failed to load progress:', e);
        progressState = createDefaultProgressState();
    }
    return getProgressSnapshot();
}

/**
 * Save progress to localStorage for CURRENT user only
 */
export function saveProgress() {
    try {
        const key = getUserStorageKey();
        progressState.lastSyncTime = Date.now();
        localStorage.setItem(key, JSON.stringify(progressState));
    } catch (e) {
        console.error('Failed to save progress:', e);
    }
}

/**
 * Create default progress state
 */
function createDefaultProgressState() {
    return {
        learnedWords: [],
        completedLessons: [],
        skillStats: {},
        milestones: [],
        studySessions: [],
        pronunciationHistory: {},
        phonemeWeaknesses: {},
        lastSyncTime: null
    };
}

/**
 * Get snapshot of progress state
 * @returns {Object} Progress snapshot
 */
export function getProgressSnapshot() {
    return {
        learnedWords: [...progressState.learnedWords],
        completedLessons: [...progressState.completedLessons],
        skillStats: { ...progressState.skillStats },
        milestones: [...progressState.milestones],
        studySessions: [...progressState.studySessions],
        lastSyncTime: progressState.lastSyncTime
    };
}

// ============================================================================
// WORD TRACKING
// ============================================================================

/**
 * Get word key for deduplication
 * @param {Object} word - Word object
 * @returns {string} Word key
 */
function getWordKey(word) {
    const pt = (word.pt || '').toLowerCase().trim();
    const en = (word.en || '').toLowerCase().trim();
    return `${pt}|${en}`;
}

/**
 * Add learned word
 * @param {Object} word - Word object
 * @returns {Object} Updated word with SRS data
 */
export function addLearnedWord(word) {
    const key = getWordKey(word);
    const existingIndex = progressState.learnedWords.findIndex(w => getWordKey(w) === key);
    
    const wordData = {
        ...word,
        key,
        srsLevel: 1,
        nextReview: Date.now() + SRS_INTERVALS[1] * 24 * 60 * 60 * 1000,
        lastReviewed: Date.now(),
        reviewCount: 0,
        correctCount: 0,
        learnedAt: Date.now()
    };
    
    if (existingIndex >= 0) {
        // Update existing word
        const existing = progressState.learnedWords[existingIndex];
        wordData.srsLevel = existing.srsLevel;
        wordData.nextReview = existing.nextReview;
        wordData.learnedAt = existing.learnedAt;
        wordData.reviewCount = existing.reviewCount;
        wordData.correctCount = existing.correctCount;
        progressState.learnedWords[existingIndex] = wordData;
    } else {
        // Add new word
        progressState.learnedWords.push(wordData);
        dispatchProgressEvent(PROGRESS_EVENTS.WORD_LEARNED, { word: wordData });
    }
    
    saveProgress();
    return wordData;
}

/**
 * Add multiple learned words
 * @param {Array} words - Array of word objects
 * @returns {Array} Updated words
 */
export function addLearnedWords(words) {
    return words.map(word => addLearnedWord(word));
}

/**
 * Get all learned words
 * @returns {Array} Learned words
 */
export function getLearnedWords() {
    return [...progressState.learnedWords];
}

/**
 * Get learned word count
 * @returns {number} Word count
 */
export function getLearnedWordCount() {
    return progressState.learnedWords.length;
}

/**
 * Check if word is learned
 * @param {Object} word - Word to check
 * @returns {boolean} True if learned
 */
export function isWordLearned(word) {
    const key = getWordKey(word);
    return progressState.learnedWords.some(w => getWordKey(w) === key);
}

/**
 * Get word by key
 * @param {string} key - Word key
 * @returns {Object|null} Word data
 */
export function getWordByKey(key) {
    return progressState.learnedWords.find(w => w.key === key) || null;
}

// ============================================================================
// SRS (SPACED REPETITION)
// ============================================================================

/**
 * Update word SRS level after review
 * @param {string} key - Word key
 * @param {boolean} correct - Whether answer was correct
 * @returns {Object|null} Updated word
 */
export function updateWordSRS(key, correct) {
    const wordIndex = progressState.learnedWords.findIndex(w => w.key === key);
    if (wordIndex < 0) return null;
    
    const word = { ...progressState.learnedWords[wordIndex] };
    word.reviewCount = (word.reviewCount || 0) + 1;
    word.lastReviewed = Date.now();
    
    if (correct) {
        word.correctCount = (word.correctCount || 0) + 1;
        // Increase SRS level
        if (word.srsLevel < PROGRESS_CONFIG.srsLevelMax) {
            word.srsLevel++;
        }
    } else {
        // Decrease SRS level (minimum 1)
        if (word.srsLevel > 1) {
            word.srsLevel--;
        }
    }
    
    // Calculate next review time
    const interval = SRS_INTERVALS[word.srsLevel] || 1;
    word.nextReview = Date.now() + interval * 24 * 60 * 60 * 1000;
    
    progressState.learnedWords[wordIndex] = word;
    saveProgress();
    
    return word;
}

/**
 * Get words due for review
 * @param {number} limit - Max words to return
 * @returns {Array} Words due for review
 */
export function getWordsDueForReview(limit = 20) {
    const now = Date.now();
    return progressState.learnedWords
        .filter(w => w.nextReview <= now)
        .sort((a, b) => a.nextReview - b.nextReview)
        .slice(0, limit);
}

/**
 * Get count of words due for review
 * @returns {number} Due word count
 */
export function getDueReviewCount() {
    const now = Date.now();
    return progressState.learnedWords.filter(w => w.nextReview <= now).length;
}

/**
 * Get SRS statistics
 * @returns {Object} SRS stats
 */
export function getSRSStats() {
    const levelCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalReviews = 0;
    let totalCorrect = 0;
    
    for (const word of progressState.learnedWords) {
        levelCounts[word.srsLevel] = (levelCounts[word.srsLevel] || 0) + 1;
        totalReviews += word.reviewCount || 0;
        totalCorrect += word.correctCount || 0;
    }
    
    return {
        levelCounts,
        totalWords: progressState.learnedWords.length,
        totalReviews,
        totalCorrect,
        accuracy: totalReviews > 0 ? Math.round((totalCorrect / totalReviews) * 100) : 0,
        dueForReview: getDueReviewCount()
    };
}

// ============================================================================
// LESSON TRACKING
// ============================================================================

/**
 * Record completed lesson
 * @param {Object} lessonData - Lesson completion data
 * @returns {Object} Recorded lesson
 */
export function recordLessonCompletion(lessonData) {
    const record = {
        lessonId: lessonData.lessonId,
        completedAt: Date.now(),
        duration: lessonData.duration || 0,
        accuracy: lessonData.accuracy || 0,
        xpEarned: lessonData.xpEarned || 0,
        wordsLearned: lessonData.wordCount || 0,
        mistakes: lessonData.mistakes || 0
    };
    
    progressState.completedLessons.push(record);
    saveProgress();
    
    dispatchProgressEvent(PROGRESS_EVENTS.LESSON_COMPLETED, { lesson: record });
    checkMilestones();
    
    return record;
}

/**
 * Get completed lessons
 * @returns {Array} Completed lessons
 */
export function getCompletedLessons() {
    return [...progressState.completedLessons];
}

/**
 * Get completed lesson count
 * @returns {number} Lesson count
 */
export function getCompletedLessonCount() {
    return progressState.completedLessons.length;
}

/**
 * Check if lesson is completed
 * @param {string} lessonId - Lesson ID
 * @returns {boolean} True if completed
 */
export function isLessonCompleted(lessonId) {
    return progressState.completedLessons.some(l => l.lessonId === lessonId);
}

/**
 * Get lesson completion history
 * @param {string} lessonId - Lesson ID
 * @returns {Array} Completion history for lesson
 */
export function getLessonHistory(lessonId) {
    return progressState.completedLessons.filter(l => l.lessonId === lessonId);
}

/**
 * Get today's completed lessons
 * @returns {Array} Today's lessons
 */
export function getTodaysLessons() {
    const todayStart = new Date().setHours(0, 0, 0, 0);
    return progressState.completedLessons.filter(l => l.completedAt >= todayStart);
}

/**
 * Get lessons completed in date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Array} Lessons in range
 */
export function getLessonsInRange(startDate, endDate) {
    const start = startDate.getTime();
    const end = endDate.getTime();
    return progressState.completedLessons.filter(l => l.completedAt >= start && l.completedAt <= end);
}

// ============================================================================
// SKILL STATISTICS
// ============================================================================

/**
 * Update skill statistics
 * @param {string} skill - Skill category
 * @param {number} score - Score achieved (0-100)
 */
export function updateSkillStat(skill, score) {
    if (!progressState.skillStats[skill]) {
        progressState.skillStats[skill] = {
            attempts: 0,
            totalScore: 0,
            bestScore: 0,
            lastUpdated: null
        };
    }
    
    const stats = progressState.skillStats[skill];
    stats.attempts++;
    stats.totalScore += score;
    stats.bestScore = Math.max(stats.bestScore, score);
    stats.lastUpdated = Date.now();
    
    saveProgress();
    dispatchProgressEvent(PROGRESS_EVENTS.SKILL_UPDATED, { skill, stats });
}

/**
 * Get skill statistics
 * @param {string} skill - Skill category
 * @returns {Object|null} Skill stats
 */
export function getSkillStat(skill) {
    const stats = progressState.skillStats[skill];
    if (!stats) return null;
    
    return {
        ...stats,
        average: stats.attempts > 0 ? Math.round(stats.totalScore / stats.attempts) : 0
    };
}

/**
 * Get all skill statistics
 * @returns {Object} All skill stats
 */
export function getAllSkillStats() {
    const result = {};
    
    for (const skill of Object.values(SKILL_CATEGORIES)) {
        const stats = getSkillStat(skill);
        if (stats) {
            result[skill] = stats;
        }
    }
    
    return result;
}

/**
 * Get skill breakdown for chart
 * @returns {Array} Skill data for chart
 */
export function getSkillChartData() {
    return Object.entries(progressState.skillStats).map(([skill, stats]) => ({
        skill,
        label: skill.charAt(0).toUpperCase() + skill.slice(1),
        average: stats.attempts > 0 ? Math.round(stats.totalScore / stats.attempts) : 0,
        best: stats.bestScore,
        attempts: stats.attempts
    }));
}

// ============================================================================
// PRONUNCIATION TRACKING (SPEECH-053)
// ============================================================================

/**
 * Record a pronunciation attempt for a word
 * @param {string} wordKey - Word identifier (e.g., "eu|I")
 * @param {Object} result - Pronunciation result from PhoneticScorer
 * @param {number} result.score - Score 0-100
 * @param {string} result.rating - 'excellent', 'good', 'fair', 'poor'
 * @param {Array} [result.phonemeIssues] - Array of phoneme problems
 * @param {string} [result.transcription] - What was heard
 * @param {string} [result.expected] - What was expected
 */
export function recordPronunciationAttempt(wordKey, result) {
    if (!progressState.pronunciationHistory[wordKey]) {
        progressState.pronunciationHistory[wordKey] = {
            attempts: [],
            bestScore: 0,
            averageScore: 0,
            lastAttempt: null,
            totalAttempts: 0
        };
    }
    
    const history = progressState.pronunciationHistory[wordKey];
    const attempt = {
        score: result.score || 0,
        rating: result.rating || 'poor',
        phonemeIssues: result.phonemeIssues || [],
        transcription: result.transcription || '',
        expected: result.expected || '',
        timestamp: Date.now()
    };
    
    // Keep last 20 attempts per word to save storage
    history.attempts.push(attempt);
    if (history.attempts.length > 20) {
        history.attempts.shift();
    }
    
    history.totalAttempts++;
    history.bestScore = Math.max(history.bestScore, attempt.score);
    history.lastAttempt = attempt.timestamp;
    
    // Recalculate average from stored attempts
    const sum = history.attempts.reduce((acc, a) => acc + a.score, 0);
    history.averageScore = Math.round(sum / history.attempts.length);
    
    // Track phoneme weaknesses
    if (attempt.phonemeIssues && attempt.phonemeIssues.length > 0) {
        trackPhonemeWeaknesses(attempt.phonemeIssues, wordKey);
    }
    
    // Also update the general pronunciation skill
    updateSkillStat(SKILL_CATEGORIES.PRONUNCIATION, attempt.score);
    
    saveProgress();
    dispatchProgressEvent(PROGRESS_EVENTS.PRONUNCIATION_RECORDED, { wordKey, attempt, history });
    
    return history;
}

/**
 * Track phoneme weaknesses from pronunciation attempts
 * @param {Array} phonemeIssues - Array of {phoneme, issue, tip}
 * @param {string} wordKey - Word where issue occurred
 */
function trackPhonemeWeaknesses(phonemeIssues, wordKey) {
    for (const issue of phonemeIssues) {
        const phoneme = issue.phoneme || issue;
        if (!progressState.phonemeWeaknesses[phoneme]) {
            progressState.phonemeWeaknesses[phoneme] = {
                count: 0,
                words: [],
                lastSeen: null,
                tips: []
            };
        }
        
        const weakness = progressState.phonemeWeaknesses[phoneme];
        weakness.count++;
        weakness.lastSeen = Date.now();
        
        // Track which words this phoneme fails in
        if (!weakness.words.includes(wordKey)) {
            weakness.words.push(wordKey);
            // Keep max 10 example words
            if (weakness.words.length > 10) {
                weakness.words.shift();
            }
        }
        
        // Store tips for AI reference
        if (issue.tip && !weakness.tips.includes(issue.tip)) {
            weakness.tips.push(issue.tip);
            if (weakness.tips.length > 5) {
                weakness.tips.shift();
            }
        }
    }
    
    // Dispatch event if any phoneme appears 3+ times
    const significantWeaknesses = Object.entries(progressState.phonemeWeaknesses)
        .filter(([, data]) => data.count >= 3)
        .map(([phoneme, data]) => ({ phoneme, ...data }));
    
    if (significantWeaknesses.length > 0) {
        dispatchProgressEvent(PROGRESS_EVENTS.PHONEME_WEAKNESS_DETECTED, { 
            weaknesses: significantWeaknesses 
        });
    }
}

/**
 * Get pronunciation history for a word
 * @param {string} wordKey - Word identifier
 * @returns {Object|null} Pronunciation history
 */
export function getPronunciationHistory(wordKey) {
    return progressState.pronunciationHistory[wordKey] || null;
}

/**
 * Get all pronunciation history
 * @returns {Object} All pronunciation history
 */
export function getAllPronunciationHistory() {
    return { ...progressState.pronunciationHistory };
}

/**
 * Get pronunciation progress over time for a word
 * @param {string} wordKey - Word identifier
 * @returns {Array} Array of {score, timestamp} for charting
 */
export function getPronunciationProgress(wordKey) {
    const history = progressState.pronunciationHistory[wordKey];
    if (!history) return [];
    
    return history.attempts.map(a => ({
        score: a.score,
        timestamp: a.timestamp
    }));
}

/**
 * Get words that need pronunciation practice (score < threshold)
 * @param {number} threshold - Score threshold (default 70)
 * @returns {Array} Words needing practice
 */
export function getWordsNeedingPronunciationPractice(threshold = 70) {
    return Object.entries(progressState.pronunciationHistory)
        .filter(([, history]) => history.averageScore < threshold)
        .map(([wordKey, history]) => ({
            wordKey,
            averageScore: history.averageScore,
            bestScore: history.bestScore,
            attempts: history.totalAttempts,
            lastAttempt: history.lastAttempt
        }))
        .sort((a, b) => a.averageScore - b.averageScore); // Worst first
}

/**
 * Get phoneme weaknesses for AI analysis
 * @param {number} minCount - Minimum failure count to include
 * @returns {Array} Phoneme weaknesses sorted by severity
 */
export function getPhonemeWeaknesses(minCount = 2) {
    return Object.entries(progressState.phonemeWeaknesses)
        .filter(([, data]) => data.count >= minCount)
        .map(([phoneme, data]) => ({
            phoneme,
            count: data.count,
            words: data.words,
            tips: data.tips,
            lastSeen: data.lastSeen
        }))
        .sort((a, b) => b.count - a.count); // Most frequent first
}

/**
 * Get pronunciation summary for AI context
 * @returns {Object} Summary for AI pipeline
 */
export function getPronunciationSummary() {
    const allHistory = Object.entries(progressState.pronunciationHistory);
    const weaknesses = getPhonemeWeaknesses(1);
    
    if (allHistory.length === 0) {
        return {
            totalAttempts: 0,
            wordsAttempted: 0,
            overallAverage: 0,
            strongWords: [],
            weakWords: [],
            phonemeWeaknesses: [],
            needsPractice: false
        };
    }
    
    // Calculate overall stats
    let totalScore = 0;
    let totalAttempts = 0;
    const wordStats = [];
    
    for (const [wordKey, history] of allHistory) {
        totalScore += history.averageScore * history.totalAttempts;
        totalAttempts += history.totalAttempts;
        wordStats.push({ wordKey, ...history });
    }
    
    const overallAverage = totalAttempts > 0 ? Math.round(totalScore / totalAttempts) : 0;
    
    // Identify strong and weak words
    const sorted = wordStats.sort((a, b) => b.averageScore - a.averageScore);
    const strongWords = sorted.filter(w => w.averageScore >= 80).slice(0, 5);
    const weakWords = sorted.filter(w => w.averageScore < 60).slice(-5).reverse();
    
    return {
        totalAttempts,
        wordsAttempted: allHistory.length,
        overallAverage,
        strongWords: strongWords.map(w => ({ word: w.wordKey, score: w.averageScore })),
        weakWords: weakWords.map(w => ({ word: w.wordKey, score: w.averageScore })),
        phonemeWeaknesses: weaknesses.slice(0, 5),
        needsPractice: weakWords.length > 0 || weaknesses.length > 0
    };
}

/**
 * Clear pronunciation history for a word
 * @param {string} wordKey - Word identifier
 */
export function clearPronunciationHistory(wordKey) {
    delete progressState.pronunciationHistory[wordKey];
    saveProgress();
}

/**
 * Reset all pronunciation data (admin only)
 */
export function resetPronunciationData() {
    progressState.pronunciationHistory = {};
    progressState.phonemeWeaknesses = {};
    saveProgress();
}

// ============================================================================
// MILESTONES
// ============================================================================

/**
 * Check and record milestones
 */
export function checkMilestones() {
    const wordCount = getLearnedWordCount();
    const lessonCount = getCompletedLessonCount();
    const newMilestones = [];
    
    // Word milestones
    const wordMilestones = [10, 25, 50, 100, 250, 500, 1000];
    for (const milestone of wordMilestones) {
        const key = `words_${milestone}`;
        if (wordCount >= milestone && !hasMilestone(key)) {
            newMilestones.push(recordMilestone(key, {
                type: 'words',
                value: milestone,
                title: `${milestone} Words Learned!`
            }));
        }
    }
    
    // Lesson milestones
    const lessonMilestones = [1, 5, 10, 25, 50, 100, 250];
    for (const milestone of lessonMilestones) {
        const key = `lessons_${milestone}`;
        if (lessonCount >= milestone && !hasMilestone(key)) {
            newMilestones.push(recordMilestone(key, {
                type: 'lessons',
                value: milestone,
                title: `${milestone} Lessons Completed!`
            }));
        }
    }
    
    return newMilestones;
}

/**
 * Record milestone
 * @param {string} key - Milestone key
 * @param {Object} data - Milestone data
 * @returns {Object} Recorded milestone
 */
export function recordMilestone(key, data) {
    const milestone = {
        key,
        ...data,
        achievedAt: Date.now()
    };
    
    progressState.milestones.push(milestone);
    saveProgress();
    
    dispatchProgressEvent(PROGRESS_EVENTS.MILESTONE_REACHED, { milestone });
    return milestone;
}

/**
 * Check if milestone achieved
 * @param {string} key - Milestone key
 * @returns {boolean} True if achieved
 */
export function hasMilestone(key) {
    return progressState.milestones.some(m => m.key === key);
}

/**
 * Get all milestones
 * @returns {Array} Milestones
 */
export function getMilestones() {
    return [...progressState.milestones].sort((a, b) => b.achievedAt - a.achievedAt);
}

// ============================================================================
// STUDY SESSIONS
// ============================================================================

/**
 * Start study session
 * @returns {Object} Session data
 */
export function startStudySession() {
    const session = {
        id: `session_${Date.now()}`,
        startTime: Date.now(),
        endTime: null,
        wordsReviewed: 0,
        lessonsCompleted: 0,
        xpEarned: 0
    };
    
    progressState.studySessions.push(session);
    return session;
}

/**
 * End study session
 * @param {string} sessionId - Session ID
 * @param {Object} stats - Session stats
 * @returns {Object|null} Updated session
 */
export function endStudySession(sessionId, stats = {}) {
    const sessionIndex = progressState.studySessions.findIndex(s => s.id === sessionId);
    if (sessionIndex < 0) return null;
    
    const session = progressState.studySessions[sessionIndex];
    session.endTime = Date.now();
    session.duration = session.endTime - session.startTime;
    session.wordsReviewed = stats.wordsReviewed || 0;
    session.lessonsCompleted = stats.lessonsCompleted || 0;
    session.xpEarned = stats.xpEarned || 0;
    
    progressState.studySessions[sessionIndex] = session;
    saveProgress();
    
    return session;
}

/**
 * Get study session statistics
 * @param {number} days - Number of days to analyze
 * @returns {Object} Session stats
 */
export function getStudySessionStats(days = 30) {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const recentSessions = progressState.studySessions.filter(s => s.startTime >= cutoff);
    
    let totalTime = 0;
    let totalWords = 0;
    let totalLessons = 0;
    let totalXP = 0;
    
    for (const session of recentSessions) {
        totalTime += session.duration || 0;
        totalWords += session.wordsReviewed || 0;
        totalLessons += session.lessonsCompleted || 0;
        totalXP += session.xpEarned || 0;
    }
    
    return {
        sessionCount: recentSessions.length,
        totalTimeMinutes: Math.round(totalTime / 60000),
        averageSessionMinutes: recentSessions.length > 0 
            ? Math.round(totalTime / 60000 / recentSessions.length) 
            : 0,
        totalWords,
        totalLessons,
        totalXP
    };
}

// ============================================================================
// PROGRESS SUMMARY
// ============================================================================

/**
 * Get comprehensive progress summary
 * @returns {Object} Progress summary
 */
export function getProgressSummary() {
    const srsStats = getSRSStats();
    const skillStats = getAllSkillStats();
    const sessionStats = getStudySessionStats();
    
    return {
        words: {
            total: getLearnedWordCount(),
            dueForReview: srsStats.dueForReview,
            accuracy: srsStats.accuracy,
            levelBreakdown: srsStats.levelCounts
        },
        lessons: {
            total: getCompletedLessonCount(),
            today: getTodaysLessons().length
        },
        skills: skillStats,
        milestones: getMilestones().length,
        studySessions: sessionStats
    };
}

/**
 * Get weekly activity data
 * @returns {Array} Daily activity for last 7 days
 */
export function getWeeklyActivity() {
    const result = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const dayStart = date.getTime();
        const dayEnd = dayStart + 24 * 60 * 60 * 1000;
        
        const lessons = progressState.completedLessons.filter(
            l => l.completedAt >= dayStart && l.completedAt < dayEnd
        );
        
        result.push({
            date: date.toISOString().split('T')[0],
            dayName: date.toLocaleDateString('en', { weekday: 'short' }),
            lessons: lessons.length,
            xp: lessons.reduce((sum, l) => sum + (l.xpEarned || 0), 0)
        });
    }
    
    return result;
}

// ============================================================================
// EVENTS
// ============================================================================

/**
 * Dispatch progress event
 * @param {string} eventName - Event name
 * @param {Object} detail - Event detail
 */
function dispatchProgressEvent(eventName, detail) {
    window.dispatchEvent(new CustomEvent(eventName, { detail }));
}

/**
 * Subscribe to progress event
 * @param {string} eventName - Event name
 * @param {Function} callback - Event callback
 * @returns {Function} Unsubscribe function
 */
export function onProgressEvent(eventName, callback) {
    window.addEventListener(eventName, callback);
    return () => window.removeEventListener(eventName, callback);
}

// ============================================================================
// RESET / ADMIN
// ============================================================================

/**
 * Reset all progress for CURRENT user (admin only)
 */
export function resetProgress() {
    const userId = getCurrentUserId();
    console.log(`ProgressTracker: Resetting all progress for user "${userId}"`);
    progressState = createDefaultProgressState();
    saveProgress();
}

/**
 * Reset progress for a SPECIFIC user (admin only)
 * @param {string} userId - User ID to reset
 */
export function resetProgressForUser(userId) {
    if (!userId) return;
    const key = `${userId}_${STORAGE_KEY}`;
    localStorage.removeItem(key);
    console.log(`ProgressTracker: Cleared all progress for user "${userId}"`);
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
    // Config
    PROGRESS_CONFIG,
    SRS_INTERVALS,
    SKILL_CATEGORIES,
    PROGRESS_EVENTS,
    
    // User Management (CRITICAL for isolation)
    setCurrentUser,
    getCurrentUserId,
    
    // Storage
    loadProgress,
    saveProgress,
    getProgressSnapshot,
    
    // Words
    addLearnedWord,
    addLearnedWords,
    getLearnedWords,
    getLearnedWordCount,
    isWordLearned,
    getWordByKey,
    
    // SRS
    updateWordSRS,
    getWordsDueForReview,
    getDueReviewCount,
    getSRSStats,
    
    // Lessons
    recordLessonCompletion,
    getCompletedLessons,
    getCompletedLessonCount,
    isLessonCompleted,
    getLessonHistory,
    getTodaysLessons,
    getLessonsInRange,
    
    // Skills
    updateSkillStat,
    getSkillStat,
    getAllSkillStats,
    getSkillChartData,
    
    // Pronunciation (SPEECH-053)
    recordPronunciationAttempt,
    getPronunciationHistory,
    getAllPronunciationHistory,
    getPronunciationProgress,
    getWordsNeedingPronunciationPractice,
    getPhonemeWeaknesses,
    getPronunciationSummary,
    clearPronunciationHistory,
    resetPronunciationData,
    
    // Milestones
    checkMilestones,
    recordMilestone,
    hasMilestone,
    getMilestones,
    
    // Sessions
    startStudySession,
    endStudySession,
    getStudySessionStats,
    
    // Summary
    getProgressSummary,
    getWeeklyActivity,
    
    // Events
    onProgressEvent,
    
    // Admin
    resetProgress,
    resetProgressForUser
};
