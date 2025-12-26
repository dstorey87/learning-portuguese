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

// Voice services (to be created)
// export { VoiceService } from './VoiceService.js';
// export { TTSService } from './TTSService.js';

export const SERVICES_VERSION = '0.1.0';
