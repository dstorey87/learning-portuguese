/**
 * AuthService Unit Tests
 * 
 * Tests for src/services/AuthService.js
 * Tests run in browser context via Playwright to access localStorage
 * 
 * Required tests per IMPLEMENTATION_PLAN.md TEST-001 (19 tests):
 * AUTH-T001 through AUTH-T019
 */

import { test, expect } from '@playwright/test';

const HOME_URL = 'http://localhost:4321/';
const AUTH_STORAGE_KEY = 'portugueseAuth';

// Helper to run code in browser context
async function evalInPage(page, fn) {
    return await page.evaluate(fn);
}

// Clear auth state before each test
test.beforeEach(async ({ page }) => {
    await page.goto(HOME_URL);
    await page.evaluate((key) => {
        localStorage.removeItem(key);
    }, AUTH_STORAGE_KEY);
    // Reload to get clean state
    await page.reload();
});

test.describe('AuthService Unit Tests', () => {
    
    // ========================================================================
    // USER MANAGEMENT TESTS
    // ========================================================================
    
    test('AUTH-T001: getUser() returns user object', async ({ page }) => {
        const user = await evalInPage(page, async () => {
            const { getUser } = await import('/src/services/AuthService.js');
            return getUser();
        });
        
        expect(user).toBeDefined();
        expect(typeof user).toBe('object');
        expect(user).toHaveProperty('loggedIn');
        expect(user).toHaveProperty('hearts');
        expect(user).toHaveProperty('streak');
        expect(user).toHaveProperty('xp');
    });
    
    test('AUTH-T002: saveUser() persists to localStorage', async ({ page }) => {
        const savedUser = await evalInPage(page, async () => {
            const { saveUser, loadUser } = await import('/src/services/AuthService.js');
            const testUser = {
                loggedIn: true,
                username: 'TestUser',
                hearts: 3,
                xp: 100,
                streak: 5
            };
            saveUser(testUser);
            return loadUser();
        });
        
        expect(savedUser.username).toBe('TestUser');
        expect(savedUser.hearts).toBe(3);
        expect(savedUser.xp).toBe(100);
        expect(savedUser.streak).toBe(5);
    });
    
    // ========================================================================
    // AUTHENTICATION TESTS
    // ========================================================================
    
    test('AUTH-T003: login() sets loggedIn=true', async ({ page }) => {
        const user = await evalInPage(page, async () => {
            const { login, getUser } = await import('/src/services/AuthService.js');
            login('TestUser');
            return getUser();
        });
        
        expect(user.loggedIn).toBe(true);
        expect(user.username).toBe('TestUser');
    });
    
    test('AUTH-T004: loginAdmin() requires correct password', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { loginAdmin, isAdmin } = await import('/src/services/AuthService.js');
            const loginResult = loginAdmin('portulingo2025');
            return { 
                loginSuccess: loginResult.success, 
                isAdmin: isAdmin() 
            };
        });
        
        expect(result.loginSuccess).toBe(true);
        expect(result.isAdmin).toBe(true);
    });
    
    test('AUTH-T005: loginAdmin() with wrong password fails', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { loginAdmin, isAdmin } = await import('/src/services/AuthService.js');
            const loginResult = loginAdmin('wrongpassword');
            return { 
                loginSuccess: loginResult.success, 
                error: loginResult.error,
                isAdmin: isAdmin() 
            };
        });
        
        expect(result.loginSuccess).toBe(false);
        expect(result.error).toBe('Invalid admin password');
        expect(result.isAdmin).toBe(false);
    });
    
    test('AUTH-T006: logout() clears user state', async ({ page }) => {
        const user = await evalInPage(page, async () => {
            const { login, logout, getUser } = await import('/src/services/AuthService.js');
            login('TestUser');
            logout();
            return getUser();
        });
        
        expect(user.loggedIn).toBe(false);
        expect(user.username).toBe('Guest');
    });
    
    test('AUTH-T007: isAdmin() returns correct boolean', async ({ page }) => {
        const results = await evalInPage(page, async () => {
            const { isAdmin, loginAdmin, logout } = await import('/src/services/AuthService.js');
            
            // Initially not admin
            const beforeAdmin = isAdmin();
            
            // After admin login
            loginAdmin('portulingo2025');
            const afterAdmin = isAdmin();
            
            // After logout
            logout();
            const afterLogout = isAdmin();
            
            return { beforeAdmin, afterAdmin, afterLogout };
        });
        
        expect(results.beforeAdmin).toBe(false);
        expect(results.afterAdmin).toBe(true);
        expect(results.afterLogout).toBe(false);
    });
    
    // ========================================================================
    // HEARTS/LIVES SYSTEM TESTS
    // ========================================================================
    
    test('AUTH-T008: getHearts() returns number or Infinity', async ({ page }) => {
        const results = await evalInPage(page, async () => {
            const { getHearts, loginAdmin, logout } = await import('/src/services/AuthService.js');
            
            // Regular user hearts
            const regularHearts = getHearts();
            
            // Admin gets Infinity
            loginAdmin('portulingo2025');
            const adminHearts = getHearts();
            
            logout();
            return { regularHearts, adminHearts };
        });
        
        expect(typeof results.regularHearts).toBe('number');
        expect(results.regularHearts).toBeLessThanOrEqual(5);
        expect(results.adminHearts).toBe(Infinity);
    });
    
    test('AUTH-T009: loseHeart() decrements hearts', async ({ page }) => {
        const results = await evalInPage(page, async () => {
            const { getHearts, loseHeart, refillHearts } = await import('/src/services/AuthService.js');
            
            // Start with full hearts
            refillHearts();
            const before = getHearts();
            
            // Lose a heart
            loseHeart();
            const after = getHearts();
            
            return { before, after };
        });
        
        expect(results.before).toBe(5);
        expect(results.after).toBe(4);
    });
    
    test('AUTH-T010: loseHeart() dispatches heartsChanged event', async ({ page }) => {
        const eventFired = await evalInPage(page, async () => {
            const { loseHeart, refillHearts } = await import('/src/services/AuthService.js');
            
            return new Promise((resolve) => {
                refillHearts();
                
                window.addEventListener('heartsChanged', (e) => {
                    resolve({ eventFired: true, hearts: e.detail?.hearts });
                }, { once: true });
                
                loseHeart();
                
                // Fallback if event doesn't fire
                setTimeout(() => resolve({ eventFired: false }), 100);
            });
        });
        
        expect(eventFired.eventFired).toBe(true);
        expect(eventFired.hearts).toBe(4);
    });
    
    test('AUTH-T011: addHeart() increments hearts', async ({ page }) => {
        const results = await evalInPage(page, async () => {
            const { getHearts, loseHeart, addHeart, refillHearts } = await import('/src/services/AuthService.js');
            
            // Start with full, lose 2, add 1
            refillHearts();
            loseHeart();
            loseHeart();
            const before = getHearts();
            
            addHeart();
            const after = getHearts();
            
            return { before, after };
        });
        
        expect(results.before).toBe(3);
        expect(results.after).toBe(4);
    });
    
    test('AUTH-T012: refillHearts() sets to max', async ({ page }) => {
        const hearts = await evalInPage(page, async () => {
            const { getHearts, loseHeart, refillHearts } = await import('/src/services/AuthService.js');
            
            loseHeart();
            loseHeart();
            loseHeart();
            refillHearts();
            
            return getHearts();
        });
        
        expect(hearts).toBe(5);
    });
    
    test('AUTH-T013: getTimeToNextHeart() calculates correctly', async ({ page }) => {
        const time = await evalInPage(page, async () => {
            const { getTimeToNextHeart, loseHeart, refillHearts } = await import('/src/services/AuthService.js');
            
            // Full hearts = no refill needed
            refillHearts();
            const fullTime = getTimeToNextHeart();
            
            // After losing heart, should have time > 0
            loseHeart();
            const afterLossTime = getTimeToNextHeart();
            
            return { fullTime, afterLossTime };
        });
        
        expect(time.fullTime).toBe(0);
        expect(time.afterLossTime).toBeGreaterThan(0);
        expect(time.afterLossTime).toBeLessThanOrEqual(30);
    });
    
    // ========================================================================
    // XP SYSTEM TESTS
    // ========================================================================
    
    test('AUTH-T015: addXP() adds to total', async ({ page }) => {
        const results = await evalInPage(page, async () => {
            const { getXP, addXP, setXP } = await import('/src/services/AuthService.js');
            
            setXP(0);
            const before = getXP();
            
            addXP(50);
            const after = getXP();
            
            addXP(25);
            const final = getXP();
            
            return { before, after, final };
        });
        
        expect(results.before).toBe(0);
        expect(results.after).toBe(50);
        expect(results.final).toBe(75);
    });
    
    test('AUTH-T016: addXP() dispatches xpChanged event', async ({ page }) => {
        const eventFired = await evalInPage(page, async () => {
            const { addXP, setXP } = await import('/src/services/AuthService.js');
            
            return new Promise((resolve) => {
                setXP(0);
                
                window.addEventListener('xpChanged', (e) => {
                    resolve({ eventFired: true, xp: e.detail?.xp });
                }, { once: true });
                
                addXP(100);
                
                // Fallback if event doesn't fire
                setTimeout(() => resolve({ eventFired: false }), 100);
            });
        });
        
        expect(eventFired.eventFired).toBe(true);
        expect(eventFired.xp).toBe(100);
    });
    
    // ========================================================================
    // STREAK SYSTEM TESTS
    // ========================================================================
    
    test('AUTH-T017: updateStreak() continues streak', async ({ page }) => {
        const streak = await evalInPage(page, async () => {
            const { updateStreak, getStreak, saveUser, getUser } = await import('/src/services/AuthService.js');
            
            // Set yesterday as last active
            const user = getUser();
            const yesterday = new Date(Date.now() - 86400000).toDateString();
            user.lastActiveDate = yesterday;
            user.streak = 5;
            saveUser(user);
            
            // Update streak for today
            updateStreak();
            
            return getStreak();
        });
        
        expect(streak).toBe(6);
    });
    
    test('AUTH-T018: updateStreak() breaks streak after gap', async ({ page }) => {
        const streak = await evalInPage(page, async () => {
            const { updateStreak, getStreak, saveUser, getUser } = await import('/src/services/AuthService.js');
            
            // Set 2 days ago as last active (gap of 1 day)
            const user = getUser();
            const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toDateString();
            user.lastActiveDate = twoDaysAgo;
            user.streak = 10;
            saveUser(user);
            
            // Update streak should reset
            updateStreak();
            
            return getStreak();
        });
        
        expect(streak).toBe(1);
    });
    
    test('AUTH-T019: completeLesson() increments lessonsToday', async ({ page }) => {
        const results = await evalInPage(page, async () => {
            const { completeLesson, getDailyProgress, getTotalLessons, logout, login } = await import('/src/services/AuthService.js');
            
            // Fresh start
            logout();
            login('TestUser');
            
            const beforeProgress = getDailyProgress();
            const totalBefore = getTotalLessons();
            
            completeLesson();
            
            const afterProgress = getDailyProgress();
            const totalAfter = getTotalLessons();
            
            return { 
                before: beforeProgress.lessonsToday, 
                after: afterProgress.lessonsToday, 
                totalBefore, 
                totalAfter 
            };
        });
        
        expect(results.after).toBe(results.before + 1);
        expect(results.totalAfter).toBe(results.totalBefore + 1);
    });
    
});
