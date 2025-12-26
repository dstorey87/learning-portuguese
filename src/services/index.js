/**
 * Services Index
 * Business logic and API integrations
 * 
 * @module services
 */

export { UserStorage } from './userStorage.js';
export { EventStreaming } from './eventStreaming.js';
export { AIPipeline } from './aiPipeline.js';
export { HealthMonitor } from './healthMonitor.js';

// Auth Service
export {
    AUTH_CONFIG,
    AUTH_CONSTANTS,
    USER_ROLES,
    AUTH_EVENTS,
    getUser,
    loadUser,
    saveUser,
    login,
    loginAdmin,
    logout,
    isAdmin,
    isLoggedIn,
    getRole,
    getHearts,
    hasHearts,
    loseHeart,
    addHeart,
    refillHearts,
    setHearts,
    getTimeToNextHeart,
    formatRefillTime,
    startHeartRefillTimer,
    stopHeartRefillTimer,
    getXP,
    addXP,
    setXP,
    getStreak,
    updateStreak,
    setStreak,
    completeLesson,
    getDailyProgress,
    getTotalLessons,
    onAuthEvent,
    resetUserStats,
    getUserStats,
    getPreferences,
    updatePreferences,
    default as AuthService
} from './AuthService.js';

// AI Service
export {
    AI_CONFIG,
    AI_PROVIDERS,
    FEEDBACK_TYPES,
    checkOllamaStatus,
    getAIStatus,
    setModel,
    initAIService,
    getPronunciationFeedback,
    getTranslationFeedback,
    getGrammarHelp,
    getGrammarTopics,
    getStudyRecommendations,
    chat,
    streamChat,
    streamOllama,
    default as AIService
} from './AIService.js';

// Voice Service
export {
    VOICE_CONFIG,
    VOICE_ENGINES,
    VOICE_PROVIDERS,
    getLastVoiceUsed,
    getDownloadedVoices,
    markVoiceDownloaded,
    isVoiceDownloaded,
    getDownloadableVoices,
    getBundledVoiceStatus,
    isBundledVoiceReady,
    getBundledVoiceOptions,
    getBundledVoiceCount,
    clearBundledVoice,
    startBundledVoiceDownload,
    ensureVoicesReady,
    getPortugueseVoiceOptions,
    getEngineVoiceOptions,
    speakWord,
    speakSentence,
    speakWithEngine,
    stopSpeech,
    default as VoiceService
} from './VoiceService.js';

// TTS Service
export {
    TTS_CONFIG,
    TTS_ENGINES,
    TTS_LOCALES,
    EDGE_VOICES,
    checkServerHealth as checkTTSServerHealth,
    getServerStatus as getTTSServerStatus,
    refreshServerStatus as refreshTTSServerStatus,
    getAvailableVoices as getTTSVoices,
    getVoice as getTTSVoice,
    getRecommendedVoice,
    speak as ttsSpeak,
    speakWithVoice,
    speakPortuguese,
    stop as ttsStop,
    isSpeaking,
    getPlaybackState,
    initTTSService,
    default as TTSService
} from './TTSService.js';

// Lesson Service
export {
    LESSON_CONFIG,
    CHALLENGE_TYPES,
    CHALLENGE_PHASES,
    getWordKey,
    resolveWordForm,
    buildQuizOptions,
    buildLessonChallenges,
    initLessonState,
    getLessonState,
    getCurrentChallenge,
    nextChallenge,
    recordCorrect,
    recordMistake,
    resetLessonState,
    getLessonDuration,
    getLessonAccuracy,
    calculateAccuracy,
    updateLessonAccuracyData,
    buildHintForWord,
    generateHints,
    getMnemonic,
    getAllMnemonics,
    buildLessonCompletionData,
    calculateLessonXP,
    default as LessonService
} from './LessonService.js';

// Progress Tracker Service
export {
    PROGRESS_CONFIG,
    SRS_INTERVALS,
    SKILL_CATEGORIES,
    PROGRESS_EVENTS,
    loadProgress,
    saveProgress,
    getProgressSnapshot,
    addLearnedWord,
    addLearnedWords,
    getLearnedWords,
    getLearnedWordCount,
    isWordLearned,
    getWordByKey,
    updateWordSRS,
    getWordsDueForReview,
    getDueReviewCount,
    getSRSStats,
    recordLessonCompletion,
    getCompletedLessons,
    getCompletedLessonCount,
    isLessonCompleted,
    getLessonHistory,
    getTodaysLessons,
    getLessonsInRange,
    updateSkillStat,
    getSkillStat,
    getAllSkillStats,
    getSkillChartData,
    checkMilestones,
    recordMilestone,
    hasMilestone,
    getMilestones,
    startStudySession,
    endStudySession,
    getStudySessionStats,
    getProgressSummary,
    getWeeklyActivity,
    onProgressEvent,
    resetProgress,
    default as ProgressTracker
} from './ProgressTracker.js';

// Logger Service
export {
    LOG_LEVELS,
    LOGGER_CONFIG,
    debug,
    info,
    warn,
    error,
    createLogger,
    setContext,
    clearContext,
    setLevel,
    getLevel,
    setConsoleEnabled,
    setHistoryEnabled,
    startTimer,
    endTimer,
    timeAsync,
    timeSync,
    groupStart,
    groupStartCollapsed,
    groupEnd,
    getHistory,
    getErrors,
    getWarnings,
    clearHistory,
    exportHistory,
    logObject,
    logTable,
    trace,
    assert,
    isDebugEnabled,
    getStats as getLoggerStats,
    default as Logger
} from './Logger.js';

export const SERVICES_VERSION = '0.1.0';
