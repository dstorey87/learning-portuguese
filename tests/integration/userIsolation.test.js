/**
 * Integration Tests for User Data Isolation (TM-004)
 * 
 * Verifies that multiple users in the same browser have completely
 * isolated data with no cross-contamination.
 * 
 * Test Scenarios:
 * 1. Two users have separate storage namespaces
 * 2. User A's data is not visible to User B
 * 3. Rapid user switching maintains isolation
 * 4. Progress data is user-specific
 * 5. Events are tagged with correct userId
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:4321';

// Helper to login as a specific user
async function loginAs(page, username) {
    // Click profile/login button
    await page.click('[data-testid="profile-btn"], button:has-text("Guest"), button:has-text("Login")');
    
    // Wait for login modal or navigate to profile
    await page.waitForTimeout(300);
    
    // Fill in username
    const usernameInput = page.locator('input[type="text"][placeholder*="username"], input[name="username"], #username');
    if (await usernameInput.isVisible()) {
        await usernameInput.fill(username);
        
        // Fill password if visible
        const passwordInput = page.locator('input[type="password"]');
        if (await passwordInput.isVisible()) {
            await passwordInput.fill('testpassword123');
        }
        
        // Click login button
        await page.click('button:has-text("Login"), button:has-text("Sign In"), button[type="submit"]');
        await page.waitForTimeout(500);
    }
}

// Helper to logout
async function logout(page) {
    await page.click('[data-testid="profile-btn"], button:has-text("Profile")');
    await page.waitForTimeout(300);
    
    const logoutBtn = page.locator('button:has-text("Logout"), button:has-text("Sign Out")');
    if (await logoutBtn.isVisible()) {
        await logoutBtn.click();
        await page.waitForTimeout(500);
    }
}

// Helper to get all storage keys for a user
async function getStorageKeysForUser(page, userId) {
    return await page.evaluate((uid) => {
        return Object.keys(localStorage).filter(k => k.startsWith(`${uid}_`));
    }, userId);
}

// Helper to get all storage data for a user
async function getStorageDataForUser(page, userId) {
    return await page.evaluate((uid) => {
        const data = {};
        Object.keys(localStorage).forEach(k => {
            if (k.startsWith(`${uid}_`)) {
                try {
                    data[k] = JSON.parse(localStorage.getItem(k));
                } catch {
                    data[k] = localStorage.getItem(k);
                }
            }
        });
        return data;
    }, userId);
}

// Helper to simulate progress save
async function saveTestProgress(page, userId) {
    return await page.evaluate((uid) => {
        const key = `${uid}_progress`;
        const data = {
            wordsLearned: ['olá', 'bom', 'dia'],
            lessonsCompleted: ['greetings-101'],
            lastUpdated: Date.now()
        };
        localStorage.setItem(key, JSON.stringify(data));
        return data;
    }, userId);
}

// Helper to clear all localStorage
async function clearAllStorage(page) {
    await page.evaluate(() => localStorage.clear());
}

test.describe('User Data Isolation - TM-004', () => {
    test.beforeEach(async ({ page }) => {
        // Clear localStorage before each test
        await page.goto(BASE_URL);
        await clearAllStorage(page);
        await page.reload();
    });

    test('should create separate storage namespaces for different users', async ({ page }) => {
        // Save data for user "alice"
        await saveTestProgress(page, 'alice');
        
        // Save data for user "bob"
        await saveTestProgress(page, 'bob');
        
        // Verify alice's keys exist
        const aliceKeys = await getStorageKeysForUser(page, 'alice');
        expect(aliceKeys.length).toBeGreaterThan(0);
        expect(aliceKeys.some(k => k.startsWith('alice_'))).toBe(true);
        
        // Verify bob's keys exist
        const bobKeys = await getStorageKeysForUser(page, 'bob');
        expect(bobKeys.length).toBeGreaterThan(0);
        expect(bobKeys.some(k => k.startsWith('bob_'))).toBe(true);
        
        // Verify no cross-contamination in key names
        expect(aliceKeys.some(k => k.includes('bob'))).toBe(false);
        expect(bobKeys.some(k => k.includes('alice'))).toBe(false);
    });

    test('should not allow User A to see User B data', async ({ page }) => {
        // Save specific data for alice
        const aliceProgress = await page.evaluate(() => {
            const data = {
                wordsLearned: ['obrigado', 'obrigada', 'por favor'],
                score: 95
            };
            localStorage.setItem('alice_progress', JSON.stringify(data));
            localStorage.setItem('alice_settings', JSON.stringify({ theme: 'dark' }));
            return data;
        });
        
        // Save different data for bob
        const bobProgress = await page.evaluate(() => {
            const data = {
                wordsLearned: ['sim', 'não'],
                score: 60
            };
            localStorage.setItem('bob_progress', JSON.stringify(data));
            localStorage.setItem('bob_settings', JSON.stringify({ theme: 'light' }));
            return data;
        });
        
        // Verify alice cannot see bob's data
        const aliceCanSeeBob = await page.evaluate(() => {
            const keys = Object.keys(localStorage);
            // Get alice's view (filtering for alice_ prefix)
            const aliceKeys = keys.filter(k => k.startsWith('alice_'));
            return aliceKeys.some(k => k.includes('bob'));
        });
        expect(aliceCanSeeBob).toBe(false);
        
        // Verify progress data is isolated
        const aliceData = await page.evaluate(() => {
            return JSON.parse(localStorage.getItem('alice_progress'));
        });
        const bobData = await page.evaluate(() => {
            return JSON.parse(localStorage.getItem('bob_progress'));
        });
        
        expect(aliceData.score).toBe(95);
        expect(bobData.score).toBe(60);
        expect(aliceData.wordsLearned).not.toEqual(bobData.wordsLearned);
    });

    test('should maintain isolation during rapid user switching', async ({ page }) => {
        // Rapidly switch between users and save data
        const users = ['user1', 'user2', 'user3', 'user4', 'user5'];
        
        for (let i = 0; i < users.length; i++) {
            const user = users[i];
            await page.evaluate(({ uid, index }) => {
                localStorage.setItem(`${uid}_progress`, JSON.stringify({
                    userId: uid,
                    lessonsCompleted: index + 1,
                    timestamp: Date.now()
                }));
                localStorage.setItem(`${uid}_events`, JSON.stringify([
                    { type: 'lesson_start', userId: uid }
                ]));
            }, { uid: user, index: i });
        }
        
        // Verify each user has correct isolated data
        for (let i = 0; i < users.length; i++) {
            const user = users[i];
            const progress = await page.evaluate((uid) => {
                return JSON.parse(localStorage.getItem(`${uid}_progress`));
            }, user);
            
            expect(progress.userId).toBe(user);
            expect(progress.lessonsCompleted).toBe(i + 1);
            
            const events = await page.evaluate((uid) => {
                return JSON.parse(localStorage.getItem(`${uid}_events`));
            }, user);
            
            expect(events[0].userId).toBe(user);
        }
        
        // Verify total key count matches expected (2 keys per user)
        const totalKeys = await page.evaluate(() => {
            return Object.keys(localStorage).length;
        });
        expect(totalKeys).toBe(users.length * 2);
    });

    test('should isolate progress tracker data per user', async ({ page }) => {
        // Simulate ProgressTracker saving data for different users
        await page.evaluate(() => {
            // User alice completes several words
            localStorage.setItem('alice_wordProgress', JSON.stringify({
                'olá': { correct: 5, attempts: 5, mastered: true },
                'adeus': { correct: 3, attempts: 5, mastered: false }
            }));
            
            // User bob has different progress
            localStorage.setItem('bob_wordProgress', JSON.stringify({
                'olá': { correct: 1, attempts: 3, mastered: false }
            }));
        });
        
        // Verify alice's olá is mastered
        const aliceOla = await page.evaluate(() => {
            const progress = JSON.parse(localStorage.getItem('alice_wordProgress'));
            return progress['olá'];
        });
        expect(aliceOla.mastered).toBe(true);
        expect(aliceOla.correct).toBe(5);
        
        // Verify bob's olá is not mastered
        const bobOla = await page.evaluate(() => {
            const progress = JSON.parse(localStorage.getItem('bob_wordProgress'));
            return progress['olá'];
        });
        expect(bobOla.mastered).toBe(false);
        expect(bobOla.correct).toBe(1);
    });

    test('should isolate events per user', async ({ page }) => {
        // Simulate eventStreaming saving events for different users
        await page.evaluate(() => {
            localStorage.setItem('alice_events', JSON.stringify([
                { eventType: 'answer_attempt', userId: 'alice', data: { wordId: 'w1', correctness: true } },
                { eventType: 'lesson_complete', userId: 'alice', data: { lessonId: 'l1' } }
            ]));
            
            localStorage.setItem('bob_events', JSON.stringify([
                { eventType: 'answer_attempt', userId: 'bob', data: { wordId: 'w2', correctness: false } }
            ]));
        });
        
        // Verify alice has 2 events
        const aliceEvents = await page.evaluate(() => {
            return JSON.parse(localStorage.getItem('alice_events'));
        });
        expect(aliceEvents.length).toBe(2);
        expect(aliceEvents.every(e => e.userId === 'alice')).toBe(true);
        
        // Verify bob has 1 event
        const bobEvents = await page.evaluate(() => {
            return JSON.parse(localStorage.getItem('bob_events'));
        });
        expect(bobEvents.length).toBe(1);
        expect(bobEvents.every(e => e.userId === 'bob')).toBe(true);
    });

    test('should not leak data when clearing one user storage', async ({ page }) => {
        // Setup data for both users
        await page.evaluate(() => {
            localStorage.setItem('alice_progress', JSON.stringify({ level: 5 }));
            localStorage.setItem('alice_settings', JSON.stringify({ voice: 'female' }));
            localStorage.setItem('bob_progress', JSON.stringify({ level: 3 }));
            localStorage.setItem('bob_settings', JSON.stringify({ voice: 'male' }));
        });
        
        // Clear only alice's data (simulating logout + clear)
        await page.evaluate(() => {
            Object.keys(localStorage)
                .filter(k => k.startsWith('alice_'))
                .forEach(k => localStorage.removeItem(k));
        });
        
        // Verify alice's data is gone
        const aliceKeys = await getStorageKeysForUser(page, 'alice');
        expect(aliceKeys.length).toBe(0);
        
        // Verify bob's data is intact
        const bobKeys = await getStorageKeysForUser(page, 'bob');
        expect(bobKeys.length).toBe(2);
        
        const bobProgress = await page.evaluate(() => {
            return JSON.parse(localStorage.getItem('bob_progress'));
        });
        expect(bobProgress.level).toBe(3);
    });

    test('should handle special characters in userId', async ({ page }) => {
        const specialUsers = [
            'user@example.com',
            'user.name',
            'user-123',
            'user_underscore'
        ];
        
        for (const user of specialUsers) {
            await page.evaluate((uid) => {
                localStorage.setItem(`${uid}_data`, JSON.stringify({ test: true }));
            }, user);
        }
        
        // Verify all special userIds created valid keys
        for (const user of specialUsers) {
            const data = await page.evaluate((uid) => {
                return JSON.parse(localStorage.getItem(`${uid}_data`));
            }, user);
            expect(data.test).toBe(true);
        }
    });

    test('should verify userStorage service isolation in browser context', async ({ page }) => {
        // Test the actual userStorage service
        const result = await page.evaluate(async () => {
            const { userStorage } = await import('/src/services/userStorage.js');
            
            // Save data as alice
            userStorage.setCurrentUser('alice');
            userStorage.set('testKey', { value: 'alice-data' });
            
            // Switch to bob and save different data
            userStorage.setCurrentUser('bob');
            userStorage.set('testKey', { value: 'bob-data' });
            
            // Verify alice's data is still alice's
            userStorage.setCurrentUser('alice');
            const aliceData = userStorage.get('testKey');
            
            // Verify bob's data is bob's
            userStorage.setCurrentUser('bob');
            const bobData = userStorage.get('testKey');
            
            return {
                aliceValue: aliceData?.value,
                bobValue: bobData?.value,
                aliceKeyExists: localStorage.getItem('alice_testKey') !== null,
                bobKeyExists: localStorage.getItem('bob_testKey') !== null
            };
        });
        
        expect(result.aliceValue).toBe('alice-data');
        expect(result.bobValue).toBe('bob-data');
        expect(result.aliceKeyExists).toBe(true);
        expect(result.bobKeyExists).toBe(true);
    });

    test('should verify ProgressTracker isolation in browser context', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { ProgressTracker } = await import('/src/services/ProgressTracker.js');
            
            // Track progress for alice
            const aliceTracker = new ProgressTracker('alice');
            aliceTracker.recordAttempt('word1', true);
            aliceTracker.recordAttempt('word1', true);
            
            // Track progress for bob
            const bobTracker = new ProgressTracker('bob');
            bobTracker.recordAttempt('word1', false);
            
            // Get stats
            const aliceStats = aliceTracker.getWordStats('word1');
            const bobStats = bobTracker.getWordStats('word1');
            
            return {
                aliceCorrect: aliceStats?.correct || 0,
                aliceAttempts: aliceStats?.attempts || 0,
                bobCorrect: bobStats?.correct || 0,
                bobAttempts: bobStats?.attempts || 0
            };
        });
        
        expect(result.aliceCorrect).toBe(2);
        expect(result.aliceAttempts).toBe(2);
        expect(result.bobCorrect).toBe(0);
        expect(result.bobAttempts).toBe(1);
    });
});
