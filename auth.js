// auth.js - User authentication and lives/hearts system
// Provides admin login with unlimited hearts and user management

const AUTH_STORAGE_KEY = 'portugueseAuth';
const ADMIN_PASSWORD = 'portulingo2025'; // Simple admin password
const MAX_HEARTS = 5;
const HEART_REFILL_MINUTES = 30;

// Default user state
const defaultUser = {
    loggedIn: false,
    isAdmin: false,
    username: 'Guest',
    hearts: MAX_HEARTS,
    lastHeartLoss: null,
    streak: 0,
    xp: 0,
    lastActiveDate: null
};

// Load user from localStorage
export function getUser() {
    try {
        const stored = localStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
            const user = JSON.parse(stored);
            // Check heart refill on load
            return checkAndRefillHearts(user);
        }
    } catch (e) {
        console.warn('Failed to load auth:', e);
    }
    return { ...defaultUser };
}

// Save user to localStorage
export function saveUser(user) {
    try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } catch (e) {
        console.warn('Failed to save auth:', e);
    }
}

// Check if hearts should be refilled based on time
function checkAndRefillHearts(user) {
    if (user.isAdmin) {
        user.hearts = MAX_HEARTS; // Admins always have full hearts
        return user;
    }
    
    if (user.hearts >= MAX_HEARTS) return user;
    if (!user.lastHeartLoss) return user;
    
    const now = Date.now();
    const timeSinceLoss = now - user.lastHeartLoss;
    const minutesPassed = timeSinceLoss / (1000 * 60);
    const heartsToAdd = Math.floor(minutesPassed / HEART_REFILL_MINUTES);
    
    if (heartsToAdd > 0) {
        user.hearts = Math.min(MAX_HEARTS, user.hearts + heartsToAdd);
        if (user.hearts >= MAX_HEARTS) {
            user.lastHeartLoss = null; // Reset timer when full
        } else {
            // Adjust last loss time to account for partial refills
            user.lastHeartLoss = now - ((minutesPassed % HEART_REFILL_MINUTES) * 60 * 1000);
        }
        saveUser(user);
    }
    
    return user;
}

// Login as regular user
export function login(username) {
    const user = getUser();
    user.loggedIn = true;
    user.username = username || 'Learner';
    user.isAdmin = false;
    saveUser(user);
    return user;
}

// Login as admin
export function loginAdmin(password) {
    if (password !== ADMIN_PASSWORD) {
        return { success: false, error: 'Invalid admin password' };
    }
    
    const user = getUser();
    user.loggedIn = true;
    user.isAdmin = true;
    user.username = 'Admin';
    user.hearts = MAX_HEARTS;
    saveUser(user);
    return { success: true, user };
}

// Logout
export function logout() {
    const user = { ...defaultUser };
    saveUser(user);
    return user;
}

// Check if user is admin
export function isAdmin() {
    return getUser().isAdmin;
}

// Get current hearts
export function getHearts() {
    const user = getUser();
    if (user.isAdmin) return Infinity;
    return user.hearts;
}

// Lose a heart (returns false if no hearts left)
export function loseHeart() {
    const user = getUser();
    if (user.isAdmin) return true; // Admins never lose
    if (user.hearts <= 0) return false;
    
    user.hearts--;
    user.lastHeartLoss = Date.now();
    saveUser(user);
    
    // Dispatch event for UI update
    window.dispatchEvent(new CustomEvent('heartsChanged', { detail: { hearts: user.hearts } }));
    
    return user.hearts > 0;
}

// Add a heart (for rewards, watching ads, etc.)
export function addHeart() {
    const user = getUser();
    if (user.isAdmin) return MAX_HEARTS;
    if (user.hearts >= MAX_HEARTS) return MAX_HEARTS;
    
    user.hearts++;
    saveUser(user);
    
    window.dispatchEvent(new CustomEvent('heartsChanged', { detail: { hearts: user.hearts } }));
    return user.hearts;
}

// Refill all hearts (admin action or reward)
export function refillHearts() {
    const user = getUser();
    user.hearts = MAX_HEARTS;
    user.lastHeartLoss = null;
    saveUser(user);
    
    window.dispatchEvent(new CustomEvent('heartsChanged', { detail: { hearts: user.hearts } }));
    return MAX_HEARTS;
}

// Get time until next heart refill (in minutes)
export function getTimeToNextHeart() {
    const user = getUser();
    if (user.isAdmin || user.hearts >= MAX_HEARTS || !user.lastHeartLoss) {
        return 0;
    }
    
    const now = Date.now();
    const timeSinceLoss = now - user.lastHeartLoss;
    const minutesPassed = timeSinceLoss / (1000 * 60);
    const minutesRemaining = HEART_REFILL_MINUTES - (minutesPassed % HEART_REFILL_MINUTES);
    
    return Math.ceil(minutesRemaining);
}

// Add XP
export function addXP(amount) {
    const user = getUser();
    user.xp = (user.xp || 0) + amount;
    saveUser(user);
    
    window.dispatchEvent(new CustomEvent('xpChanged', { detail: { xp: user.xp } }));
    return user.xp;
}

// Update streak
export function updateStreak() {
    const user = getUser();
    const today = new Date().toDateString();
    const lastActive = user.lastActiveDate;
    
    if (lastActive === today) {
        // Already active today
        return user.streak;
    }
    
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (lastActive === yesterday) {
        // Continue streak
        user.streak++;
    } else if (lastActive !== today) {
        // Streak broken, start fresh
        user.streak = 1;
    }
    
    user.lastActiveDate = today;
    saveUser(user);
    
    window.dispatchEvent(new CustomEvent('streakChanged', { detail: { streak: user.streak } }));
    return user.streak;
}

// Start heart refill timer (call on page load)
let heartRefillInterval = null;

export function startHeartRefillTimer() {
    if (heartRefillInterval) return;
    
    heartRefillInterval = setInterval(() => {
        const user = getUser();
        if (!user.isAdmin && user.hearts < MAX_HEARTS) {
            checkAndRefillHearts(user);
            window.dispatchEvent(new CustomEvent('heartsChanged', { detail: { hearts: user.hearts } }));
        }
    }, 60000); // Check every minute
}

export function stopHeartRefillTimer() {
    if (heartRefillInterval) {
        clearInterval(heartRefillInterval);
        heartRefillInterval = null;
    }
}

// Check if user has hearts available
export function hasHearts() {
    const user = getUser();
    return user.isAdmin || user.hearts > 0;
}

// Get XP
export function getXP() {
    return getUser().xp || 0;
}

// Get streak
export function getStreak() {
    return getUser().streak || 0;
}

// Format refill time as MM:SS
export function formatRefillTime() {
    const totalMins = getTimeToNextHeart();
    const mins = Math.floor(totalMins);
    const secs = Math.floor((totalMins - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Complete a lesson (updates daily progress)
export function completeLesson() {
    const user = getUser();
    const today = new Date().toDateString();
    
    if (user.lastActiveDate !== today) {
        user.lessonsToday = 0;
    }
    
    user.lessonsToday = (user.lessonsToday || 0) + 1;
    user.lastActiveDate = today;
    saveUser(user);
    updateStreak();
    
    window.dispatchEvent(new CustomEvent('lessonCompleted', { 
        detail: { lessonsToday: user.lessonsToday, goal: 3 } 
    }));
    
    return user.lessonsToday;
}

// Get daily progress
export function getDailyProgress() {
    const user = getUser();
    const today = new Date().toDateString();
    
    if (user.lastActiveDate !== today) {
        return { lessonsToday: 0, goal: 3 };
    }
    
    return { lessonsToday: user.lessonsToday || 0, goal: 3 };
}

// Export constants for UI
export const AUTH_CONSTANTS = {
    MAX_HEARTS,
    HEART_REFILL_MINUTES
};
