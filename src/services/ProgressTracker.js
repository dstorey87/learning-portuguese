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
    SKILL_UPDATED: 'progressSkillUpdated'
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
    lastSyncTime: null
};

// ============================================================================
// STORAGE HELPERS
// ============================================================================

const STORAGE_KEY = 'portulingo_progress';

/**
 * Load progress from localStorage
 * @param {string} userId - Optional user ID prefix
 * @returns {Object} Progress data
 */
export function loadProgress(userId = null) {
    try {
        const key = userId ? `${userId}_${STORAGE_KEY}` : STORAGE_KEY;
        const saved = localStorage.getItem(key);
        if (saved) {
            progressState = { ...progressState, ...JSON.parse(saved) };
        }
    } catch (e) {
        console.error('Failed to load progress:', e);
    }
    return getProgressSnapshot();
}

/**
 * Save progress to localStorage
 * @param {string} userId - Optional user ID prefix
 */
export function saveProgress(userId = null) {
    try {
        const key = userId ? `${userId}_${STORAGE_KEY}` : STORAGE_KEY;
        progressState.lastSyncTime = Date.now();
        localStorage.setItem(key, JSON.stringify(progressState));
    } catch (e) {
        console.error('Failed to save progress:', e);
    }
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
 * Reset all progress (admin only)
 * @param {string} userId - User ID
 */
export function resetProgress(userId = null) {
    progressState = {
        learnedWords: [],
        completedLessons: [],
        skillStats: {},
        milestones: [],
        studySessions: [],
        lastSyncTime: null
    };
    saveProgress(userId);
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
    resetProgress
};
