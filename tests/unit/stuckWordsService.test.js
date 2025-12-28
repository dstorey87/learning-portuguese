/**
 * StuckWordsService Unit Tests
 * 
 * Tests the stuck words tracking and rescue techniques functionality
 */

import { test, expect } from '@playwright/test';

test.describe('StuckWordsService Unit Tests', () => {
    
    test.beforeEach(async ({ page }) => {
        // Navigate to app and clear localStorage
        await page.goto('http://localhost:4174');
        await page.evaluate(() => {
            // Clear any existing stuck words data
            Object.keys(localStorage).forEach(key => {
                if (key.includes('stuck_words')) {
                    localStorage.removeItem(key);
                }
            });
            localStorage.setItem('currentUserId', 'test-user');
        });
    });

    test('STUCK-T001: recordFailure creates word entry on first failure', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { recordFailure } = await import('/src/services/learning/StuckWordsService.js');
            return recordFailure({
                wordKey: 'obrigado|thank you',
                pt: 'obrigado',
                en: 'thank you',
                failureType: 'quiz',
                category: 'greetings'
            });
        });
        
        expect(result).toBeTruthy();
        expect(result.pt).toBe('obrigado');
        expect(result.failureCount).toBe(1);
        expect(result.stuckSince).toBeNull(); // Not stuck yet (needs 3 failures)
    });

    test('STUCK-T002: Word becomes stuck after 3 failures', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { recordFailure } = await import('/src/services/learning/StuckWordsService.js');
            
            // Record 3 failures
            recordFailure({ wordKey: 'bom|good', pt: 'bom', en: 'good', failureType: 'quiz' });
            recordFailure({ wordKey: 'bom|good', pt: 'bom', en: 'good', failureType: 'quiz' });
            const final = recordFailure({ wordKey: 'bom|good', pt: 'bom', en: 'good', failureType: 'quiz' });
            
            return final;
        });
        
        expect(result.failureCount).toBe(3);
        expect(result.stuckSince).toBeTruthy(); // Now stuck!
    });

    test('STUCK-T003: getStuckWords returns stuck words sorted by severity', async ({ page }) => {
        const stuckWords = await page.evaluate(async () => {
            const { recordFailure, getStuckWords } = await import('/src/services/learning/StuckWordsService.js');
            
            // Create word with 5 failures (very stuck)
            for (let i = 0; i < 5; i++) {
                recordFailure({ wordKey: 'muito|very', pt: 'muito', en: 'very', failureType: 'quiz' });
            }
            
            // Create word with 3 failures (just stuck)
            for (let i = 0; i < 3; i++) {
                recordFailure({ wordKey: 'bem|well', pt: 'bem', en: 'well', failureType: 'quiz' });
            }
            
            return getStuckWords();
        });
        
        expect(stuckWords.length).toBe(2);
        // Most stuck word should be first
        expect(stuckWords[0].pt).toBe('muito');
        expect(stuckWords[0].failureCount).toBe(5);
        expect(stuckWords[1].pt).toBe('bem');
    });

    test('STUCK-T004: getRelevantStuckWords filters by topic', async ({ page }) => {
        const relevantWords = await page.evaluate(async () => {
            const { recordFailure, getRelevantStuckWords } = await import('/src/services/learning/StuckWordsService.js');
            
            // Create stuck words with categories
            for (let i = 0; i < 3; i++) {
                recordFailure({ wordKey: 'um|one', pt: 'um', en: 'one', failureType: 'quiz', category: 'numbers' });
                recordFailure({ wordKey: 'olá|hello', pt: 'olá', en: 'hello', failureType: 'quiz', category: 'greetings' });
            }
            
            // Search for numbers topic
            return getRelevantStuckWords('numbers', ['one', 'two']);
        });
        
        // Should find 'um' but not 'olá'
        expect(relevantWords.length).toBeGreaterThan(0);
        expect(relevantWords.some(w => w.pt === 'um')).toBe(true);
    });

    test('STUCK-T005: recordSuccess reduces failure count', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { recordFailure, recordSuccess, getStuckWords } = await import('/src/services/learning/StuckWordsService.js');
            
            // Make word stuck
            for (let i = 0; i < 3; i++) {
                recordFailure({ wordKey: 'sim|yes', pt: 'sim', en: 'yes', failureType: 'quiz' });
            }
            
            // Record a success
            const afterSuccess = recordSuccess('sim|yes', 'quiz', 100);
            
            return { afterSuccess, stuckWords: getStuckWords() };
        });
        
        expect(result.afterSuccess.failureCount).toBe(2); // Reduced from 3
    });

    test('STUCK-T006: getRecommendedTechniques returns techniques based on failure type', async ({ page }) => {
        const techniques = await page.evaluate(async () => {
            const { recordFailure, getRecommendedTechniques } = await import('/src/services/learning/StuckWordsService.js');
            
            // Create word with pronunciation failure
            for (let i = 0; i < 3; i++) {
                recordFailure({ 
                    wordKey: 'são|are', 
                    pt: 'são', 
                    en: 'are', 
                    failureType: 'pronunciation',
                    pronunciationScore: 40
                });
            }
            
            return getRecommendedTechniques('são|are');
        });
        
        expect(techniques.length).toBeGreaterThan(0);
        // Should recommend multi-sensory for pronunciation issues
        expect(techniques.some(t => t.id === 'multi_sensory')).toBe(true);
    });

    test('STUCK-T007: recordRescueAttempt tracks applied techniques', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { recordFailure, recordRescueAttempt, getStuckWords } = await import('/src/services/learning/StuckWordsService.js');
            
            // Create stuck word
            for (let i = 0; i < 3; i++) {
                recordFailure({ wordKey: 'não|no', pt: 'não', en: 'no', failureType: 'quiz' });
            }
            
            // Apply rescue technique
            const attempt = recordRescueAttempt('não|no', 'keyword_mnemonic', { storyCreated: true });
            
            // Check technique was recorded in the word's appliedTechniques
            const stuckWords = getStuckWords();
            const word = stuckWords.find(w => w.wordKey === 'não|no');
            
            return { 
                attempt, 
                appliedTechniques: word?.appliedTechniques || []
            };
        });
        
        // The rescue attempt should be tracked
        expect(result.attempt).toBeTruthy();
        expect(result.appliedTechniques).toContain('keyword_mnemonic');
    });

    test('STUCK-T008: getMnemonicBuildingBlocks returns sound-alike suggestions', async ({ page }) => {
        const blocks = await page.evaluate(async () => {
            const { getMnemonicBuildingBlocks } = await import('/src/services/learning/StuckWordsService.js');
            return getMnemonicBuildingBlocks('obrigado', 'thank you');
        });
        
        expect(blocks.word).toBe('obrigado');
        expect(blocks.meaning).toBe('thank you');
        expect(blocks.suggestedKeywords).toBeDefined();
        expect(blocks.visualizationTips).toBeDefined();
    });

    test('STUCK-T009: getStuckWordStats returns correct statistics', async ({ page }) => {
        const stats = await page.evaluate(async () => {
            const { recordFailure, getStuckWordStats } = await import('/src/services/learning/StuckWordsService.js');
            
            // Create some stuck words
            for (let i = 0; i < 3; i++) {
                recordFailure({ wordKey: 'test1|test1', pt: 'test1', en: 'test1', failureType: 'quiz' });
            }
            for (let i = 0; i < 4; i++) {
                recordFailure({ wordKey: 'test2|test2', pt: 'test2', en: 'test2', failureType: 'quiz' });
            }
            
            return getStuckWordStats();
        });
        
        expect(stats.totalTracked).toBe(2);
        expect(stats.currentlyStuck).toBe(2);
        expect(stats.avgFailureCount).toBeDefined();
    });

    test('STUCK-T010: markAsStuck manually marks word as stuck', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { markAsStuck, getStuckWords } = await import('/src/services/learning/StuckWordsService.js');
            
            // Manually mark word as stuck
            markAsStuck('difícil|difficult', 'difícil', 'difficult', 'I always forget this one');
            
            return getStuckWords();
        });
        
        expect(result.length).toBe(1);
        expect(result[0].pt).toBe('difícil');
        expect(result[0].stuckSince).toBeTruthy();
    });

    test('STUCK-T011: Confusion pairs are tracked when provided', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { recordFailure, getStuckWords } = await import('/src/services/learning/StuckWordsService.js');
            
            // Record failure with confusion
            for (let i = 0; i < 3; i++) {
                recordFailure({ 
                    wordKey: 'ser|to be', 
                    pt: 'ser', 
                    en: 'to be', 
                    failureType: 'confusion',
                    confusedWith: 'estar'
                });
            }
            
            const words = getStuckWords();
            return words.find(w => w.pt === 'ser');
        });
        
        expect(result.confusedWith).toContain('estar');
    });

    test('STUCK-T012: RESCUE_TECHNIQUES has effectiveness ratings', async ({ page }) => {
        const techniques = await page.evaluate(async () => {
            const { RESCUE_TECHNIQUES } = await import('/src/services/learning/StuckWordsService.js');
            return RESCUE_TECHNIQUES;
        });
        
        expect(techniques.KEYWORD_MNEMONIC.effectiveness).toBe(0.95);
        expect(techniques.SPACED_RETRIEVAL.effectiveness).toBe(0.92);
        expect(techniques.MEMORY_PALACE.effectiveness).toBe(0.90);
        expect(techniques.MINIMAL_PAIRS.effectiveness).toBe(0.88);
    });
});
