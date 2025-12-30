/**
 * Authentication Service
 * 
 * Provides user authentication, hearts/lives system, XP, and streak management.
 * Re-exports functionality from the root auth.js with service-layer abstractions.
 * 
 * @module services/AuthService
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Authentication configuration
 */
export const AUTH_CONFIG = {
    storageKey: 'portugueseAuth',
    adminPassword: 'portulingo2025',
    maxHearts: 5,
    heartRefillMinutes: 30,
    dailyGoal: 3,
    xpPerCorrect: 10,
    xpPerLesson: 50,
    xpPerStreak: 5
};

/**
 * User roles
 */
export const USER_ROLES = {
    GUEST: 'guest',
    USER: 'user',
    ADMIN: 'admin'
};

/**
 * Auth events
 */
export const AUTH_EVENTS = {
    HEARTS_CHANGED: 'heartsChanged',
    XP_CHANGED: 'xpChanged',
    STREAK_CHANGED: 'streakChanged',
    LESSON_COMPLETED: 'lessonCompleted',
    LOGIN: 'userLogin',
    LOGOUT: 'userLogout'
};

// ============================================================================
// STATE
// ============================================================================

/**
 * Default user state
 */
const defaultUserState = {
    loggedIn: false,
    isAdmin: false,
    username: 'Guest',
    role: USER_ROLES.GUEST,
    hearts: AUTH_CONFIG.maxHearts,
    lastHeartLoss: null,
    streak: 0,
    xp: 0,
    lastActiveDate: null,
    lessonsToday: 0,
    totalLessons: 0,
    preferences: {}
};

let heartRefillInterval = null;

// ============================================================================
// STORAGE HELPERS
// ============================================================================

/**
 * Load user from localStorage
 * @returns {Object} User state
 */
export function loadUser() {
    try {
        const stored = localStorage.getItem(AUTH_CONFIG.storageKey);
        if (stored) {
            const user = JSON.parse(stored);
            return checkAndRefillHearts(user);
        }
    } catch (e) {
        console.warn('Failed to load auth:', e);
    }
    return { ...defaultUserState };
}

/**
 * Save user to localStorage
 * @param {Object} user - User state to save
 */
export function saveUser(user) {
    try {
        localStorage.setItem(AUTH_CONFIG.storageKey, JSON.stringify(user));
    } catch (e) {
        console.warn('Failed to save auth:', e);
    }
}

/**
 * Get current user
 * @returns {Object} Current user state
 */
export function getUser() {
    return loadUser();
}

// ============================================================================
// HEART/LIVES SYSTEM
// ============================================================================

/**
 * Check if hearts should be refilled based on time
 * @param {Object} user - User state
 * @returns {Object} Updated user state
 */
function checkAndRefillHearts(user) {
    if (user.isAdmin) {
        user.hearts = AUTH_CONFIG.maxHearts;
        return user;
    }
    
    if (user.hearts >= AUTH_CONFIG.maxHearts) return user;
    if (!user.lastHeartLoss) return user;
    
    const now = Date.now();
    const timeSinceLoss = now - user.lastHeartLoss;
    const minutesPassed = timeSinceLoss / (1000 * 60);
    const heartsToAdd = Math.floor(minutesPassed / AUTH_CONFIG.heartRefillMinutes);
    
    if (heartsToAdd > 0) {
        user.hearts = Math.min(AUTH_CONFIG.maxHearts, user.hearts + heartsToAdd);
        if (user.hearts >= AUTH_CONFIG.maxHearts) {
            user.lastHeartLoss = null;
        } else {
            user.lastHeartLoss = now - ((minutesPassed % AUTH_CONFIG.heartRefillMinutes) * 60 * 1000);
        }
        saveUser(user);
    }
    
    return user;
}

/**
 * Get current hearts count
 * @returns {number|Infinity} Hearts count
 */
export function getHearts() {
    const user = getUser();
    if (user.isAdmin) return Infinity;
    return user.hearts;
}

/**
 * Check if user has hearts available
 * @returns {boolean} True if hearts available
 */
export function hasHearts() {
    const user = getUser();
    return user.isAdmin || user.hearts > 0;
}

/**
 * Lose a heart
 * @returns {boolean} True if still has hearts left
 */
export function loseHeart() {
    const user = getUser();
    if (user.isAdmin) return true;
    if (user.hearts <= 0) return false;
    
    user.hearts--;
    user.lastHeartLoss = Date.now();
    saveUser(user);
    
    dispatchAuthEvent(AUTH_EVENTS.HEARTS_CHANGED, { hearts: user.hearts });
    return user.hearts > 0;
}

/**
 * Add a heart
 * @returns {number} New hearts count
 */
export function addHeart() {
    const user = getUser();
    if (user.isAdmin) return AUTH_CONFIG.maxHearts;
    if (user.hearts >= AUTH_CONFIG.maxHearts) return AUTH_CONFIG.maxHearts;
    
    user.hearts++;
    saveUser(user);
    
    dispatchAuthEvent(AUTH_EVENTS.HEARTS_CHANGED, { hearts: user.hearts });
    return user.hearts;
}

/**
 * Refill all hearts
 * @returns {number} Full hearts count
 */
export function refillHearts() {
    const user = getUser();
    user.hearts = AUTH_CONFIG.maxHearts;
    user.lastHeartLoss = null;
    saveUser(user);
    
    dispatchAuthEvent(AUTH_EVENTS.HEARTS_CHANGED, { hearts: user.hearts });
    return AUTH_CONFIG.maxHearts;
}

/**
 * Set hearts to specific value (admin function)
 * @param {number} count - New hearts count
 * @returns {number} New hearts count
 */
export function setHearts(count) {
    const user = getUser();
    user.hearts = Math.max(0, Math.min(AUTH_CONFIG.maxHearts, count));
    if (count >= AUTH_CONFIG.maxHearts) {
        user.lastHeartLoss = null;
    }
    saveUser(user);
    
    dispatchAuthEvent(AUTH_EVENTS.HEARTS_CHANGED, { hearts: user.hearts });
    return user.hearts;
}

/**
 * Get time until next heart refill
 * @returns {number} Minutes until next heart
 */
export function getTimeToNextHeart() {
    const user = getUser();
    if (user.isAdmin || user.hearts >= AUTH_CONFIG.maxHearts || !user.lastHeartLoss) {
        return 0;
    }
    
    const now = Date.now();
    const timeSinceLoss = now - user.lastHeartLoss;
    const minutesPassed = timeSinceLoss / (1000 * 60);
    const minutesRemaining = AUTH_CONFIG.heartRefillMinutes - (minutesPassed % AUTH_CONFIG.heartRefillMinutes);
    
    return Math.ceil(minutesRemaining);
}

/**
 * Format refill time as MM:SS
 * @returns {string} Formatted time
 */
export function formatRefillTime() {
    const totalMins = getTimeToNextHeart();
    const mins = Math.floor(totalMins);
    const secs = Math.floor((totalMins - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Start heart refill timer
 */
export function startHeartRefillTimer() {
    if (heartRefillInterval) return;
    
    heartRefillInterval = setInterval(() => {
        const user = getUser();
        if (!user.isAdmin && user.hearts < AUTH_CONFIG.maxHearts) {
            const updated = checkAndRefillHearts(user);
            dispatchAuthEvent(AUTH_EVENTS.HEARTS_CHANGED, { hearts: updated.hearts });
        }
    }, 60000);
}

/**
 * Stop heart refill timer
 */
export function stopHeartRefillTimer() {
    if (heartRefillInterval) {
        clearInterval(heartRefillInterval);
        heartRefillInterval = null;
    }
}

// ============================================================================
// XP SYSTEM
// ============================================================================

/**
 * Get current XP
 * @returns {number} XP amount
 */
export function getXP() {
    return getUser().xp || 0;
}

/**
 * Add XP
 * @param {number} amount - XP to add
 * @returns {number} New total XP
 */
export function addXP(amount) {
    const user = getUser();
    user.xp = (user.xp || 0) + amount;
    saveUser(user);
    
    dispatchAuthEvent(AUTH_EVENTS.XP_CHANGED, { xp: user.xp });
    return user.xp;
}

/**
 * Set XP to specific value (admin function)
 * @param {number} amount - New XP amount
 * @returns {number} New XP amount
 */
export function setXP(amount) {
    const user = getUser();
    user.xp = Math.max(0, amount);
    saveUser(user);
    
    dispatchAuthEvent(AUTH_EVENTS.XP_CHANGED, { xp: user.xp });
    return user.xp;
}

// ============================================================================
// STREAK SYSTEM
// ============================================================================

/**
 * Get current streak
 * @returns {number} Streak count
 */
export function getStreak() {
    return getUser().streak || 0;
}

/**
 * Update streak (call daily on first activity)
 * @returns {number} New streak count
 */
export function updateStreak() {
    const user = getUser();
    const today = new Date().toDateString();
    const lastActive = user.lastActiveDate;
    
    if (lastActive === today) {
        return user.streak;
    }
    
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (lastActive === yesterday) {
        user.streak++;
    } else if (lastActive !== today) {
        user.streak = 1;
    }
    
    user.lastActiveDate = today;
    saveUser(user);
    
    dispatchAuthEvent(AUTH_EVENTS.STREAK_CHANGED, { streak: user.streak });
    return user.streak;
}

/**
 * Set streak to specific value (admin function)
 * @param {number} count - New streak count
 * @returns {number} New streak count
 */
export function setStreak(count) {
    const user = getUser();
    user.streak = Math.max(0, count);
    saveUser(user);
    
    dispatchAuthEvent(AUTH_EVENTS.STREAK_CHANGED, { streak: user.streak });
    return user.streak;
}

// ============================================================================
// AUTHENTICATION
// ============================================================================

/**
 * Login as regular user
 * @param {string} username - Username
 * @returns {Object} User state
 */
export function login(username) {
    const user = getUser();
    user.loggedIn = true;
    user.username = username || 'Learner';
    user.isAdmin = false;
    user.role = USER_ROLES.USER;
    saveUser(user);
    
    dispatchAuthEvent(AUTH_EVENTS.LOGIN, { user });
    return user;
}

/**
 * Login as admin
 * @param {string} password - Admin password
 * @returns {Object} Result { success, error?, user? }
 */
export function loginAdmin(password) {
    if (password !== AUTH_CONFIG.adminPassword) {
        return { success: false, error: 'Invalid admin password' };
    }
    
    const user = getUser();
    user.loggedIn = true;
    user.isAdmin = true;
    user.username = 'Admin';
    user.role = USER_ROLES.ADMIN;
    user.hearts = AUTH_CONFIG.maxHearts;
    saveUser(user);
    
    dispatchAuthEvent(AUTH_EVENTS.LOGIN, { user });
    return { success: true, user };
}

/**
 * Logout
 * @returns {Object} Reset user state
 */
export function logout() {
    const user = { ...defaultUserState };
    saveUser(user);
    
    dispatchAuthEvent(AUTH_EVENTS.LOGOUT, {});
    return user;
}

/**
 * Check if current user is admin
 * @returns {boolean} True if admin
 */
export function isAdmin() {
    return getUser().isAdmin;
}

/**
 * Check if user is logged in
 * @returns {boolean} True if logged in
 */
export function isLoggedIn() {
    return getUser().loggedIn;
}

/**
 * Get user role
 * @returns {string} User role
 */
export function getRole() {
    const user = getUser();
    if (user.isAdmin) return USER_ROLES.ADMIN;
    if (user.loggedIn) return USER_ROLES.USER;
    return USER_ROLES.GUEST;
}

// ============================================================================
// LESSON PROGRESS
// ============================================================================

/**
 * Complete a lesson
 * @returns {number} Lessons completed today
 */
export function completeLesson() {
    const user = getUser();
    const today = new Date().toDateString();
    
    if (user.lastActiveDate !== today) {
        user.lessonsToday = 0;
    }
    
    user.lessonsToday = (user.lessonsToday || 0) + 1;
    user.totalLessons = (user.totalLessons || 0) + 1;
    user.lastActiveDate = today;
    saveUser(user);
    updateStreak();
    
    dispatchAuthEvent(AUTH_EVENTS.LESSON_COMPLETED, { 
        lessonsToday: user.lessonsToday, 
        goal: AUTH_CONFIG.dailyGoal,
        totalLessons: user.totalLessons
    });
    
    return user.lessonsToday;
}

/**
 * Get daily progress
 * @returns {Object} { lessonsToday, goal, completed }
 */
export function getDailyProgress() {
    const user = getUser();
    const today = new Date().toDateString();
    
    if (user.lastActiveDate !== today) {
        return { lessonsToday: 0, goal: AUTH_CONFIG.dailyGoal, completed: false };
    }
    
    const lessonsToday = user.lessonsToday || 0;
    return { 
        lessonsToday, 
        goal: AUTH_CONFIG.dailyGoal, 
        completed: lessonsToday >= AUTH_CONFIG.dailyGoal 
    };
}

/**
 * Get total lessons completed
 * @returns {number} Total lessons
 */
export function getTotalLessons() {
    return getUser().totalLessons || 0;
}

// ============================================================================
// EVENT HELPERS
// ============================================================================

/**
 * Dispatch auth event
 * @param {string} eventName - Event name
 * @param {Object} detail - Event detail
 */
function dispatchAuthEvent(eventName, detail) {
    window.dispatchEvent(new CustomEvent(eventName, { detail }));
}

/**
 * Subscribe to auth event
 * @param {string} eventName - Event name
 * @param {Function} callback - Event callback
 * @returns {Function} Unsubscribe function
 */
export function onAuthEvent(eventName, callback) {
    window.addEventListener(eventName, callback);
    return () => window.removeEventListener(eventName, callback);
}

// ============================================================================
// ADMIN FUNCTIONS
// ============================================================================

/**
 * Reset all user stats (admin function)
 */
export function resetUserStats() {
    const user = getUser();
    user.hearts = AUTH_CONFIG.maxHearts;
    user.lastHeartLoss = null;
    user.xp = 0;
    user.streak = 0;
    user.lessonsToday = 0;
    saveUser(user);
    
    dispatchAuthEvent(AUTH_EVENTS.HEARTS_CHANGED, { hearts: user.hearts });
    dispatchAuthEvent(AUTH_EVENTS.XP_CHANGED, { xp: user.xp });
    dispatchAuthEvent(AUTH_EVENTS.STREAK_CHANGED, { streak: user.streak });
}

/**
 * Get all user stats summary
 * @returns {Object} Stats summary
 */
export function getUserStats() {
    const user = getUser();
    return {
        username: user.username,
        role: getRole(),
        hearts: getHearts(),
        maxHearts: AUTH_CONFIG.maxHearts,
        xp: user.xp || 0,
        streak: user.streak || 0,
        lessonsToday: user.lessonsToday || 0,
        totalLessons: user.totalLessons || 0,
        dailyGoal: AUTH_CONFIG.dailyGoal,
        dailyCompleted: (user.lessonsToday || 0) >= AUTH_CONFIG.dailyGoal,
        timeToNextHeart: getTimeToNextHeart()
    };
}

// ============================================================================
// USER PREFERENCES
// ============================================================================

/**
 * Get user preferences
 * @returns {Object} Preferences object
 */
export function getPreferences() {
    return getUser().preferences || {};
}

/**
 * Update user preferences
 * @param {Object} prefs - Preferences to merge
 * @returns {Object} Updated preferences
 */
export function updatePreferences(prefs) {
    const user = getUser();
    user.preferences = { ...user.preferences, ...prefs };
    saveUser(user);
    return user.preferences;
}

// ============================================================================
// USER MANAGEMENT (ADMIN FUNCTIONS)
// ============================================================================

/**
 * Get all users from localStorage (admin function)
 * Scans localStorage for user data patterns
 * @returns {Array} Array of user objects
 */
export function getAllUsers() {
    const users = [];
    const seenUserIds = new Set();
    
    // Scan localStorage for user data
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        
        // Look for user-specific keys (pattern: userId_*)
        const match = key.match(/^([^_]+)_(progress|stuck_words|events|preferences)$/);
        if (match) {
            const userId = match[0].split('_')[0];
            if (!seenUserIds.has(userId) && userId !== 'admin' && userId !== 'undefined') {
                seenUserIds.add(userId);
            }
        }
        
        // Also check for direct auth keys
        if (key === AUTH_CONFIG.storageKey) {
            try {
                const authData = JSON.parse(localStorage.getItem(key));
                if (authData.username && !seenUserIds.has(authData.username)) {
                    seenUserIds.add(authData.username);
                }
            } catch (e) {
                // Ignore parse errors
            }
        }
    }
    
    // Also check for registered users list
    try {
        const registeredUsers = localStorage.getItem('registered_users');
        if (registeredUsers) {
            const parsed = JSON.parse(registeredUsers);
            parsed.forEach(u => {
                if (u.userId && !seenUserIds.has(u.userId)) {
                    seenUserIds.add(u.userId);
                }
            });
        }
    } catch (e) {
        // Ignore
    }
    
    // Build user objects
    seenUserIds.forEach(userId => {
        try {
            const userAuth = localStorage.getItem(`${userId}_auth`);
            const parsed = userAuth ? JSON.parse(userAuth) : {};
            
            users.push({
                userId,
                username: parsed.username || userId,
                isAdmin: parsed.isAdmin || false,
                role: parsed.role || USER_ROLES.USER,
                lastActive: parsed.lastActiveDate || null
            });
        } catch (e) {
            users.push({
                userId,
                username: userId,
                isAdmin: false,
                role: USER_ROLES.USER,
                lastActive: null
            });
        }
    });
    
    // Add current user if not in list
    const currentUser = getUser();
    if (currentUser.username && !seenUserIds.has(currentUser.username)) {
        users.push({
            userId: currentUser.username,
            username: currentUser.username,
            isAdmin: currentUser.isAdmin,
            role: currentUser.role || USER_ROLES.USER,
            lastActive: currentUser.lastActiveDate
        });
    }
    
    return users;
}

/**
 * Login as a specific user (admin impersonation)
 * @param {string} targetUserId - User ID to login as
 * @returns {Object} Result { success, user?, error? }
 */
export function loginAsUser(targetUserId) {
    const currentUser = getUser();
    
    // Only admins can impersonate
    if (!currentUser.isAdmin) {
        return { success: false, error: 'Admin access required for impersonation' };
    }
    
    // Try to load the target user's data
    try {
        const targetAuth = localStorage.getItem(`${targetUserId}_auth`);
        let targetData;
        
        if (targetAuth) {
            targetData = JSON.parse(targetAuth);
        } else {
            // Create minimal user data if doesn't exist
            targetData = {
                ...defaultUserState,
                loggedIn: true,
                username: targetUserId,
                role: USER_ROLES.USER
            };
        }
        
        // Mark as impersonated session
        targetData.impersonatedBy = currentUser.username;
        targetData.impersonationStart = Date.now();
        
        saveUser(targetData);
        
        dispatchAuthEvent(AUTH_EVENTS.LOGIN, { user: targetData, impersonation: true });
        
        return { success: true, user: targetData };
    } catch (e) {
        return { success: false, error: `Failed to impersonate: ${e.message}` };
    }
}

/**
 * Register a new user (for tracking purposes)
 * @param {string} userId - User ID
 * @param {Object} metadata - Optional metadata
 */
export function registerUser(userId, metadata = {}) {
    try {
        const registeredUsers = JSON.parse(localStorage.getItem('registered_users') || '[]');
        
        if (!registeredUsers.find(u => u.userId === userId)) {
            registeredUsers.push({
                userId,
                registeredAt: Date.now(),
                ...metadata
            });
            localStorage.setItem('registered_users', JSON.stringify(registeredUsers));
        }
    } catch (e) {
        console.warn('Failed to register user:', e);
    }
}

// ============================================================================
// EXPORTS FOR BACKWARDS COMPATIBILITY
// ============================================================================

export const AUTH_CONSTANTS = {
    MAX_HEARTS: AUTH_CONFIG.maxHearts,
    HEART_REFILL_MINUTES: AUTH_CONFIG.heartRefillMinutes
};

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
    // Config
    AUTH_CONFIG,
    AUTH_CONSTANTS,
    USER_ROLES,
    AUTH_EVENTS,
    
    // User
    getUser,
    loadUser,
    saveUser,
    
    // Auth
    login,
    loginAdmin,
    logout,
    isAdmin,
    isLoggedIn,
    getRole,
    
    // Hearts
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
    
    // XP
    getXP,
    addXP,
    setXP,
    
    // Streak
    getStreak,
    updateStreak,
    setStreak,
    
    // Progress
    completeLesson,
    getDailyProgress,
    getTotalLessons,
    
    // Events
    onAuthEvent,
    
    // Admin
    resetUserStats,
    getUserStats,
    getAllUsers,
    loginAsUser,
    registerUser,
    
    // Preferences
    getPreferences,
    updatePreferences
};
