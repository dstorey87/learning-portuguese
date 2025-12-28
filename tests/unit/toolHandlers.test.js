/**
 * ToolHandlers Unit Tests
 * Tests for src/services/ai/ToolHandlers.js
 * Tests AI tool handlers including lesson creation
 */
import { test, expect } from '@playwright/test';
const HOME_URL = 'http://localhost:4321/';

// Helper to run code in browser context
async function evalInPage(page, fn) {
    return await page.evaluate(fn);
}

test.describe('ToolHandlers Unit Tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(HOME_URL);
        // Clear any existing custom lessons and stuck word state for isolation
        await page.evaluate(() => {
            localStorage.setItem('currentUserId', 'test-user');
            const keys = Object.keys(localStorage).filter(k => 
                k.includes('ai_custom_lessons') ||
                k.includes('stuck_words') ||
                k.includes('rescue_attempts')
            );
            keys.forEach(k => localStorage.removeItem(k));
        });
    });
    
    // ========================================================================
    // TOOL REGISTRY TESTS
    // ========================================================================
    
    test('TOOL-T001: getToolRegistry returns registry with tools', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { getToolRegistry } = await import('/src/services/ai/ToolRegistry.js');
            const registry = getToolRegistry();
            return {
                hasList: typeof registry.listTools === 'function',
                toolCount: registry.listTools().length,
                tools: registry.listTools()
            };
        });
        
        expect(result.hasList).toBe(true);
        expect(result.toolCount).toBeGreaterThan(5);
        expect(result.tools).toContain('get_due_words');
        expect(result.tools).toContain('speak_portuguese');
        expect(result.tools).toContain('get_learner_weaknesses');
        expect(result.tools).toContain('create_custom_lesson');
    });
    // ========================================================================
    // GET_LEARNER_WEAKNESSES TESTS
    // ========================================================================
    
    test('TOOL-T002: get_learner_weaknesses handler exists and returns data', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { getToolRegistry } = await import('/src/services/ai/ToolRegistry.js');
            await import('/src/services/ai/ToolHandlers.js').then(m => m.ensureToolHandlersInitialized());
            
            const registry = getToolRegistry();
            const handler = registry.getHandler('get_learner_weaknesses');
            
            if (!handler) return { error: 'No handler found' };
            
            const result = await registry.execute('get_learner_weaknesses', {
                includeConfusionPairs: true,
                includePronunciationIssues: true,
                limit: 5
            });
            
            return result;
        });
        
        expect(result.success).toBe(true);
        expect(result.result).toBeDefined();
        expect(result.result).toHaveProperty('userId');
        expect(result.result).toHaveProperty('level');
    });
    // ========================================================================
    // CREATE_CUSTOM_LESSON TESTS
    // ========================================================================
    
    test('TOOL-T003: create_custom_lesson creates a lesson', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { getToolRegistry } = await import('/src/services/ai/ToolRegistry.js');
            await import('/src/services/ai/ToolHandlers.js').then(m => m.ensureToolHandlersInitialized());
            
            const registry = getToolRegistry();
            
            const createResult = await registry.execute('create_custom_lesson', {
                title: 'Test AI Lesson',
                description: 'A test lesson created by the test suite',
                focusArea: 'pronunciation',
                words: [
                    { pt: 'Olá', en: 'Hello', ipa: '/ɔˈla/', tip: 'Stress on the last syllable' },
                    { pt: 'Obrigado', en: 'Thank you', ipa: '/obriˈɡadu/', tip: 'Male speaker uses -o ending' }
                ],
                difficulty: 'beginner'
            });
            
            return createResult;
        });
        
        expect(result.success).toBe(true);
        expect(result.result).toBeDefined();
        expect(result.result.success).toBe(true);
        expect(result.result.lesson).toBeDefined();
        expect(result.result.lesson.title).toBe('Test AI Lesson');
        expect(result.result.lesson.wordCount).toBe(2);
    });
    
    test('TOOL-T004: create_custom_lesson stores lesson in localStorage', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { getToolRegistry } = await import('/src/services/ai/ToolRegistry.js');
            await import('/src/services/ai/ToolHandlers.js').then(m => m.ensureToolHandlersInitialized());
            
            const registry = getToolRegistry();
            
            await registry.execute('create_custom_lesson', {
                title: 'Storage Test Lesson',
                words: [{ pt: 'Teste', en: 'Test' }]
            });
            
            // Check localStorage
            const userId = localStorage.getItem('currentUserId') || 'default';
            const storageKey = `ai_custom_lessons_${userId}`;
            const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
            
            return {
                lessonCount: stored.length,
                firstLessonTitle: stored[0]?.title,
                hasWords: stored[0]?.words?.length > 0
            };
        });
        
        expect(result.lessonCount).toBeGreaterThan(0);
        expect(result.firstLessonTitle).toBe('Storage Test Lesson');
        expect(result.hasWords).toBe(true);
    });
    
    test('TOOL-T005: create_custom_lesson requires title and words', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { getToolRegistry } = await import('/src/services/ai/ToolRegistry.js');
            await import('/src/services/ai/ToolHandlers.js').then(m => m.ensureToolHandlersInitialized());
            
            const registry = getToolRegistry();
            
            // Try to create with empty words array
            const emptyWords = await registry.execute('create_custom_lesson', {
                title: 'Test Lesson',
                words: []  // Empty array
            });
            
            return { emptyWordsResult: emptyWords };
        });
        
        expect(result.emptyWordsResult.result.success).toBe(false);
        expect(result.emptyWordsResult.result.error).toContain('required');
    });
    // ========================================================================
    // VERIFY_CUSTOM_LESSON TESTS
    // ========================================================================

    test('TOOL-T013: verify_custom_lesson rates complete lesson as excellent', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { getToolRegistry } = await import('/src/services/ai/ToolRegistry.js');
            await import('/src/services/ai/ToolHandlers.js').then(m => m.ensureToolHandlersInitialized());

            const registry = getToolRegistry();

            const createResult = await registry.execute('create_custom_lesson', {
                title: 'Quality Lesson',
                description: 'High-quality lesson with full pedagogy data',
                topic: 'food',
                focusArea: 'vocabulary',
                difficulty: 'beginner',
                words: [
                    {
                        pt: 'maçã',
                        en: 'apple',
                        ipa: '/mɐˈsɐ̃/',
                        grammarNotes: 'feminine noun',
                        aiTip: 'Remember the nasal ã sound',
                        examples: [{ pt: 'Eu como uma maçã.', en: 'I eat an apple.' }]
                    },
                    {
                        pt: 'pão',
                        en: 'bread',
                        ipa: '/pɐ̃w̃/',
                        grammarNotes: 'masculine noun',
                        aiTip: 'Pay attention to the nasal ão vowel',
                        examples: [{ pt: 'Ele compra pão fresco.', en: 'He buys fresh bread.' }]
                    },
                    {
                        pt: 'queijo',
                        en: 'cheese',
                        ipa: '/ˈkej.ʒu/',
                        grammarNotes: 'masculine noun',
                        aiTip: 'Soft j sound in the middle',
                        examples: [{ pt: 'Gosto de queijo português.', en: 'I like Portuguese cheese.' }]
                    }
                ]
            });

            const lessonId = createResult.result.lesson.id;
            const verifyResult = await registry.execute('verify_custom_lesson', { lessonId });

            return {
                createSuccess: createResult.success,
                createdLesson: createResult.result.lesson,
                verifySuccess: verifyResult.success,
                verify: verifyResult.result
            };
        });

        expect(result.createSuccess).toBe(true);
        expect(result.createdLesson.wordCount).toBe(3);
        expect(result.verifySuccess).toBe(true);
        expect(result.verify.found).toBe(true);
        expect(result.verify.quality.score).toBeGreaterThanOrEqual(90);
        expect(result.verify.quality.rating).toContain('Excellent');
        expect(result.verify.quality.issues.length).toBe(0);
    });
    // ========================================================================
    // GET_CUSTOM_LESSONS TESTS
    // ========================================================================
    
    test('TOOL-T006: get_custom_lessons retrieves stored lessons', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { getToolRegistry } = await import('/src/services/ai/ToolRegistry.js');
            await import('/src/services/ai/ToolHandlers.js').then(m => m.ensureToolHandlersInitialized());
            
            const registry = getToolRegistry();
            
            // Create a lesson first
            await registry.execute('create_custom_lesson', {
                title: 'Retrieval Test Lesson',
                words: [{ pt: 'Bom dia', en: 'Good morning' }]
            });
            
            // Retrieve lessons
            const getResult = await registry.execute('get_custom_lessons', {});
            
            return getResult;
        });
        
        expect(result.success).toBe(true);
        expect(result.result.count).toBeGreaterThan(0);
        expect(result.result.lessons[0].title).toBe('Retrieval Test Lesson');
    });
    
    // ========================================================================
    // DELETE_CUSTOM_LESSON TESTS
    // ========================================================================
    
    test('TOOL-T007: delete_custom_lesson removes a lesson', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { getToolRegistry } = await import('/src/services/ai/ToolRegistry.js');
            await import('/src/services/ai/ToolHandlers.js').then(m => m.ensureToolHandlersInitialized());
            
            const registry = getToolRegistry();
            
            // Create a lesson
            const createResult = await registry.execute('create_custom_lesson', {
                title: 'Deletion Test Lesson',
                words: [{ pt: 'Adeus', en: 'Goodbye' }]
            });
            
            const lessonId = createResult.result.lesson.id;
            
            // Delete it
            const deleteResult = await registry.execute('delete_custom_lesson', { lessonId });
            
            // Verify it's gone
            const getResult = await registry.execute('get_custom_lessons', {});
            const stillExists = getResult.result.lessons.some(l => l.id === lessonId);
            
            return {
                deleteSuccess: deleteResult.result.success,
                deletedTitle: deleteResult.result.deletedLesson?.title,
                stillExists
            };
        });
        
        expect(result.deleteSuccess).toBe(true);
        expect(result.deletedTitle).toBe('Deletion Test Lesson');
        expect(result.stillExists).toBe(false);
    });
    
    // ========================================================================
    // LOOKUP_WORD TESTS
    // ========================================================================
    
    test('TOOL-T008: lookup_word finds Portuguese words', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { getToolRegistry } = await import('/src/services/ai/ToolRegistry.js');
            await import('/src/services/ai/ToolHandlers.js').then(m => m.ensureToolHandlersInitialized());
            
            const registry = getToolRegistry();
            
            const lookupResult = await registry.execute('lookup_word', {
                word: 'eu',  // "I" in Portuguese - should be in pronouns lesson
                includeRelated: false
            });
            
            return lookupResult;
        });
        
        expect(result.success).toBe(true);
        expect(result.result.found).toBe(true);
        expect(result.result.count).toBeGreaterThan(0);
        expect(result.result.results[0]).toHaveProperty('pt');
        expect(result.result.results[0]).toHaveProperty('en');
    });
    
    test('TOOL-T009: lookup_word returns not found for nonexistent word', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { getToolRegistry } = await import('/src/services/ai/ToolRegistry.js');
            await import('/src/services/ai/ToolHandlers.js').then(m => m.ensureToolHandlersInitialized());
            
            const registry = getToolRegistry();
            
            const lookupResult = await registry.execute('lookup_word', {
                word: 'xyznonexistentword123',
                includeRelated: false
            });
            
            return lookupResult;
        });
        
        expect(result.success).toBe(true);
        expect(result.result.found).toBe(false);
    });
    // ========================================================================
    // GET_AVAILABLE_LESSONS TESTS
    // ========================================================================
    
    test('TOOL-T010: get_available_lessons returns lesson list', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            try {
                const { getToolRegistry } = await import('/src/services/ai/ToolRegistry.js');
                await import('/src/services/ai/ToolHandlers.js').then(m => m.ensureToolHandlersInitialized());
                
                const registry = getToolRegistry();
                
                const lessonsResult = await registry.execute('get_available_lessons', {
                    limit: 10
                });
                
                return lessonsResult;
            } catch (e) {
                return { error: e.message, stack: e.stack };
            }
        });
        
        // Handle case where result is an error object
        if (result.error) {
            console.log('Handler error:', result.error);
        }
        
        expect(result.success).toBe(true);
        expect(result.result.count).toBeGreaterThan(0);
        expect(result.result.lessons.length).toBeLessThanOrEqual(10);
        expect(result.result.lessons[0]).toHaveProperty('id');
        expect(result.result.lessons[0]).toHaveProperty('title');
    });
    
    test('TOOL-T011: get_available_lessons filters by topic', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            try {
                const { getToolRegistry } = await import('/src/services/ai/ToolRegistry.js');
                await import('/src/services/ai/ToolHandlers.js').then(m => m.ensureToolHandlersInitialized());
                
                const registry = getToolRegistry();
                
                const lessonsResult = await registry.execute('get_available_lessons', {
                    topic: 'building-blocks'
                });
                
                return lessonsResult;
            } catch (e) {
                return { error: e.message, stack: e.stack };
            }
        });
        
        if (result.error) {
            console.log('Handler error:', result.error);
        }
        
        expect(result.success).toBe(true);
        expect(result.result.count).toBeGreaterThan(0);
        // All returned should be from building-blocks topic
        const allBB = result.result.lessons.every(l => 
            l.topicId?.includes('building-blocks') || 
            l.topicTitle?.toLowerCase().includes('building')
        );
        expect(allBB).toBe(true);
    });
    
    // ========================================================================
    // START_LESSON TESTS  
    // ========================================================================
    
    test('TOOL-T012: start_lesson dispatches event for valid lesson', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            try {
                const { getToolRegistry } = await import('/src/services/ai/ToolRegistry.js');
                await import('/src/services/ai/ToolHandlers.js').then(m => m.ensureToolHandlersInitialized());
                
                const registry = getToolRegistry();
                
                // Listen for the event
                let eventReceived = false;
                let eventLessonId = null;
                window.addEventListener('start-lesson', (e) => {
                    eventReceived = true;
                    eventLessonId = e.detail.lessonId;
                });
                
                // Use bb-001 which is the actual pronouns lesson ID
                const startResult = await registry.execute('start_lesson', {
                    lessonId: 'bb-001'
                });
                
                // Wait a moment for event to propagate
                await new Promise(resolve => setTimeout(resolve, 100));
                
                return {
                    executeSuccess: startResult.success,
                    handlerResult: startResult.result,
                    executeError: startResult.error,
                    eventReceived,
                    eventLessonId
                };
            } catch (e) {
                return { error: e.message, stack: e.stack };
            }
        });
        
        if (result.error) {
            console.log('Test error:', result.error);
        }
        
        // Check that execute succeeded
        expect(result.executeSuccess).toBe(true);
        // Check event was dispatched
        expect(result.eventReceived).toBe(true);
        expect(result.eventLessonId).toBe('bb-001');
    });
    test('TOOL-T014: create_stuck_words_rescue_lesson blends stuck + new words with all rescue styles', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { getToolRegistry } = await import('/src/services/ai/ToolRegistry.js');
            const { recordFailure } = await import('/src/services/learning/StuckWordsService.js');
            await import('/src/services/ai/ToolHandlers.js').then(m => m.ensureToolHandlersInitialized());

            const registry = getToolRegistry();

            // Seed a relevant stuck word
            recordFailure({ wordKey: 'queijo|cheese', pt: 'queijo', en: 'cheese', failureType: 'quiz', category: 'food' });
            recordFailure({ wordKey: 'queijo|cheese', pt: 'queijo', en: 'cheese', failureType: 'quiz', category: 'food' });
            recordFailure({ wordKey: 'queijo|cheese', pt: 'queijo', en: 'cheese', failureType: 'quiz', category: 'food' });

            const originalRandom = Math.random;
            Math.random = () => 0.42; // deterministic shuffle for test stability

            const createResult = await registry.execute('create_stuck_words_rescue_lesson', {
                topic: 'food',
                newWords: [
                    {
                        pt: 'maçã',
                        en: 'apple',
                        examples: [{ pt: 'Eu como uma maçã.', en: 'I eat an apple.' }]
                    },
                    {
                        pt: 'pão',
                        en: 'bread',
                        examples: [{ pt: 'Ele compra pão fresco.', en: 'He buys fresh bread.' }]
                    }
                ],
                includeStuckWords: true,
                maxStuckWords: 1,
                difficulty: 'beginner'
            });

            Math.random = originalRandom;

            const lessonId = createResult.result.lesson.id;
            const userId = localStorage.getItem('currentUserId') || 'default';
            const stored = JSON.parse(localStorage.getItem(`ai_custom_lessons_${userId}`) || '[]');
            const lesson = stored.find(l => l.id === lessonId);

            const rescueChallenges = lesson.challenges.filter(c => c.phase === 'rescue');
            const learnChallenges = lesson.challenges.filter(c => c.phase === 'learn');
            const techniqueCounts = rescueChallenges.reduce((acc, c) => {
                acc[c.techniqueId] = (acc[c.techniqueId] || 0) + 1;
                return acc;
            }, {});

            return {
                createSuccess: createResult.success,
                lesson,
                wordCount: lesson.words.length,
                stuckWordCount: lesson.words.filter(w => w.isStuckWord).length,
                learnCount: learnChallenges.length,
                rescueCount: rescueChallenges.length,
                techniqueCounts
            };
        });

        expect(result.createSuccess).toBe(true);
        expect(result.wordCount).toBe(3); // 2 new + 1 stuck
        expect(result.stuckWordCount).toBe(1);
        expect(result.learnCount).toBe(3);
        expect(result.rescueCount).toBe(21); // 7 styles per word
        expect(Object.values(result.techniqueCounts).every(count => count === result.wordCount)).toBe(true);
    });
});
