/**
 * auth.js - BRIDGE FILE
 * 
 * Re-exports from src/services/AuthService.js for backwards compatibility.
 * This file will be removed once app.js is updated to import directly from services.
 * 
 * @deprecated Use imports from './src/services/AuthService.js' directly
 */

// Re-export everything from the new AuthService
export {
    // Configuration
    AUTH_CONFIG,
    AUTH_CONSTANTS,
    USER_ROLES,
    AUTH_EVENTS,
    
    // User management
    getUser,
    loadUser,
    saveUser,
    
    // Authentication
    login,
    loginAdmin,
    logout,
    isAdmin,
    isLoggedIn,
    getRole,
    
    // Hearts/Lives system
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
    
    // XP system
    getXP,
    addXP,
    setXP,
    
    // Streak system
    getStreak,
    updateStreak,
    setStreak,
    
    // Lesson progress
    completeLesson,
    getDailyProgress,
    getTotalLessons,
    
    // Events
    onAuthEvent,
    
    // Admin functions
    resetUserStats,
    getUserStats,
    
    // Preferences
    getPreferences,
    updatePreferences,
    
    // Default export
    default as AuthService
} from './src/services/AuthService.js';
