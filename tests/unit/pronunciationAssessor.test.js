/**
 * PronunciationAssessor Unit Tests
 * 
 * Tests for the client-side pronunciation assessment service.
 * 
 * @module tests/unit/pronunciationAssessor.test.js
 * @since Phase 15 - Voice Integration Excellence
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:4321/';

test.describe('PronunciationAssessor Unit Tests', () => {
    
    test.beforeEach(async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForTimeout(500);
    });
    
    test.describe('Similarity Calculation', () => {
        
        test('ASSESS-U001: Returns 100% for exact match', async ({ page }) => {
            const result = await page.evaluate(async () => {
                const { getPronunciationAssessor } = await import('/src/services/PronunciationAssessor.js');
                const assessor = getPronunciationAssessor();
                return assessor.assess('obrigado', 'obrigado');
            });
            
            expect(result.score).toBe(100);
            expect(result.exactMatch).toBe(true);
        });
        
        test('ASSESS-U002: Returns high score for minor difference', async ({ page }) => {
            const result = await page.evaluate(async () => {
                const { getPronunciationAssessor } = await import('/src/services/PronunciationAssessor.js');
                const assessor = getPronunciationAssessor();
                return assessor.assess('obrigado', 'obrigadu');
            });
            
            // Should be high score (known variation)
            expect(result.score).toBeGreaterThanOrEqual(85);
        });
        
        test('ASSESS-U003: Returns lower score for significant difference', async ({ page }) => {
            const result = await page.evaluate(async () => {
                const { getPronunciationAssessor } = await import('/src/services/PronunciationAssessor.js');
                const assessor = getPronunciationAssessor();
                return assessor.assess('obrigado', 'hello');
            });
            
            // Should be low score for completely different word
            expect(result.score).toBeLessThan(50);
            expect(result.exactMatch).toBe(false);
        });
        
        test('ASSESS-U004: Handles empty strings gracefully', async ({ page }) => {
            const result = await page.evaluate(async () => {
                const { getPronunciationAssessor } = await import('/src/services/PronunciationAssessor.js');
                const assessor = getPronunciationAssessor();
                return assessor.assess('', '');
            });
            
            expect(result.score).toBe(0);
        });
        
        test('ASSESS-U005: Handles null/undefined gracefully', async ({ page }) => {
            const result = await page.evaluate(async () => {
                const { getPronunciationAssessor } = await import('/src/services/PronunciationAssessor.js');
                const assessor = getPronunciationAssessor();
                return assessor.assess(null, undefined);
            });
            
            expect(result.score).toBe(0);
        });
    });
    
    test.describe('Phonetic Variations', () => {
        
        test('ASSESS-U006: Recognizes known variations of obrigado', async ({ page }) => {
            const results = await page.evaluate(async () => {
                const { getPronunciationAssessor } = await import('/src/services/PronunciationAssessor.js');
                const assessor = getPronunciationAssessor();
                
                const variations = ['obrigado', 'obrigadu', 'brigado'];
                return variations.map(v => assessor.assess('obrigado', v));
            });
            
            // All known variations should score high
            results.forEach(result => {
                expect(result.score).toBeGreaterThanOrEqual(70);
            });
        });
        
        test('ASSESS-U007: Recognizes variations of olá', async ({ page }) => {
            const results = await page.evaluate(async () => {
                const { getPronunciationAssessor } = await import('/src/services/PronunciationAssessor.js');
                const assessor = getPronunciationAssessor();
                
                const variations = ['olá', 'ola', 'olah'];
                return variations.map(v => assessor.assess('olá', v));
            });
            
            // Variations without accent should score high
            results.forEach(result => {
                expect(result.score).toBeGreaterThanOrEqual(80);
            });
        });
        
        test('ASSESS-U008: Case insensitive comparison', async ({ page }) => {
            const result = await page.evaluate(async () => {
                const { getPronunciationAssessor } = await import('/src/services/PronunciationAssessor.js');
                const assessor = getPronunciationAssessor();
                return assessor.assess('OBRIGADO', 'obrigado');
            });
            
            expect(result.score).toBe(100);
            expect(result.exactMatch).toBe(true);
        });
    });
    
    test.describe('Error Identification', () => {
        
        test('ASSESS-U009: Identifies missing characters', async ({ page }) => {
            const result = await page.evaluate(async () => {
                const { getPronunciationAssessor } = await import('/src/services/PronunciationAssessor.js');
                const assessor = getPronunciationAssessor();
                return assessor.assess('obrigado', 'obrigad');
            });
            
            // Should identify missing 'o' at the end
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors.some(e => e.type === 'missing')).toBe(true);
        });
        
        test('ASSESS-U010: Identifies extra characters', async ({ page }) => {
            const result = await page.evaluate(async () => {
                const { getPronunciationAssessor } = await import('/src/services/PronunciationAssessor.js');
                const assessor = getPronunciationAssessor();
                return assessor.assess('ola', 'olaa');
            });
            
            // Should identify extra 'a' at the end
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors.some(e => e.type === 'extra')).toBe(true);
        });
        
        test('ASSESS-U011: Identifies wrong characters', async ({ page }) => {
            const result = await page.evaluate(async () => {
                const { getPronunciationAssessor } = await import('/src/services/PronunciationAssessor.js');
                const assessor = getPronunciationAssessor();
                return assessor.assess('sim', 'som');
            });
            
            // Should identify wrong character
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors.some(e => e.type === 'wrong')).toBe(true);
        });
    });
    
    test.describe('Feedback Generation', () => {
        
        test('ASSESS-U012: Generates excellent feedback for 95%+', async ({ page }) => {
            const result = await page.evaluate(async () => {
                const { getPronunciationAssessor } = await import('/src/services/PronunciationAssessor.js');
                const assessor = getPronunciationAssessor();
                return assessor.assess('obrigado', 'obrigado');
            });
            
            expect(result.feedback.level).toBe('excellent');
            expect(result.feedback.emoji).toBe('🌟');
            expect(result.feedback.playAudio).toBe(false);
        });
        
        test('ASSESS-U013: Generates good feedback for 80-95%', async ({ page }) => {
            const result = await page.evaluate(async () => {
                const { getPronunciationAssessor } = await import('/src/services/PronunciationAssessor.js');
                const assessor = getPronunciationAssessor();
                // Small difference should give 80-95%
                return assessor.assess('obrigado', 'obrigadu');
            });
            
            // Should be good or excellent (since it's a known variation)
            expect(['excellent', 'good'].includes(result.feedback.level)).toBe(true);
        });
        
        test('ASSESS-U014: Generates needs-work feedback for <60%', async ({ page }) => {
            const result = await page.evaluate(async () => {
                const { getPronunciationAssessor } = await import('/src/services/PronunciationAssessor.js');
                const assessor = getPronunciationAssessor();
                return assessor.assess('obrigado', 'hello');
            });
            
            expect(result.feedback.level).toBe('needs-work');
            expect(result.feedback.emoji).toBe('🔄');
            expect(result.feedback.playAudio).toBe(true);
        });
        
        test('ASSESS-U015: Includes tips for non-perfect scores', async ({ page }) => {
            const result = await page.evaluate(async () => {
                const { getPronunciationAssessor } = await import('/src/services/PronunciationAssessor.js');
                const assessor = getPronunciationAssessor();
                return assessor.assess('português', 'portuges');
            });
            
            // Should have tips for improvement
            expect(result.feedback.tips).toBeDefined();
            expect(result.feedback.tips.length).toBeGreaterThan(0);
        });
    });
    
    test.describe('Syllabification', () => {
        
        test('ASSESS-U016: Syllabifies simple words', async ({ page }) => {
            const result = await page.evaluate(async () => {
                const { getPronunciationAssessor } = await import('/src/services/PronunciationAssessor.js');
                const assessor = getPronunciationAssessor();
                return assessor.syllabify('obrigado');
            });
            
            // Should contain hyphens
            expect(result).toContain('-');
        });
        
        test('ASSESS-U017: Handles single syllable words', async ({ page }) => {
            const result = await page.evaluate(async () => {
                const { getPronunciationAssessor } = await import('/src/services/PronunciationAssessor.js');
                const assessor = getPronunciationAssessor();
                return assessor.syllabify('sim');
            });
            
            // Should return word (possibly with or without hyphens)
            expect(result.replace(/-/g, '')).toBe('sim');
        });
    });
    
    test.describe('Phoneme Breakdown', () => {
        
        test('ASSESS-U018: Returns phoneme breakdown', async ({ page }) => {
            const result = await page.evaluate(async () => {
                const { getPronunciationAssessor } = await import('/src/services/PronunciationAssessor.js');
                const assessor = getPronunciationAssessor();
                const assessment = assessor.assess('olá', 'ola');
                return assessment.phonemeBreakdown;
            });
            
            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBeGreaterThan(0);
        });
        
        test('ASSESS-U019: Phoneme breakdown has correct structure', async ({ page }) => {
            const result = await page.evaluate(async () => {
                const { getPronunciationAssessor } = await import('/src/services/PronunciationAssessor.js');
                const assessor = getPronunciationAssessor();
                return assessor.getPhonemeBreakdown('sim');
            });
            
            // Each item should have letters, sounds, and position
            result.forEach(item => {
                expect(item.letters).toBeDefined();
                expect(item.sounds).toBeDefined();
                expect(Array.isArray(item.sounds)).toBe(true);
                expect(typeof item.position).toBe('number');
            });
        });
    });
    
    test.describe('Service Availability', () => {
        
        test('ASSESS-U020: Service reports as available', async ({ page }) => {
            const isAvailable = await page.evaluate(async () => {
                const { getPronunciationAssessor } = await import('/src/services/PronunciationAssessor.js');
                const assessor = getPronunciationAssessor();
                return assessor.isAvailable();
            });
            
            expect(isAvailable).toBe(true);
        });
        
        test('ASSESS-U021: Singleton returns same instance', async ({ page }) => {
            const isSame = await page.evaluate(async () => {
                const { getPronunciationAssessor } = await import('/src/services/PronunciationAssessor.js');
                const assessor1 = getPronunciationAssessor();
                const assessor2 = getPronunciationAssessor();
                return assessor1 === assessor2;
            });
            
            expect(isSame).toBe(true);
        });
    });
    
    test.describe('Edge Cases', () => {
        
        test('ASSESS-U022: Handles accented vs unaccented comparison', async ({ page }) => {
            const result = await page.evaluate(async () => {
                const { getPronunciationAssessor } = await import('/src/services/PronunciationAssessor.js');
                const assessor = getPronunciationAssessor();
                return assessor.assess('não', 'nao');
            });
            
            // Should recognize accent variation
            expect(result.score).toBeGreaterThanOrEqual(80);
        });
        
        test('ASSESS-U023: Handles whitespace differences', async ({ page }) => {
            const result = await page.evaluate(async () => {
                const { getPronunciationAssessor } = await import('/src/services/PronunciationAssessor.js');
                const assessor = getPronunciationAssessor();
                return assessor.assess('bom dia', 'bom dia');
            });
            
            expect(result.score).toBe(100);
        });
        
        test('ASSESS-U024: Handles punctuation', async ({ page }) => {
            const result = await page.evaluate(async () => {
                const { getPronunciationAssessor } = await import('/src/services/PronunciationAssessor.js');
                const assessor = getPronunciationAssessor();
                return assessor.assess('olá!', 'ola');
            });
            
            // Should ignore punctuation
            expect(result.score).toBeGreaterThanOrEqual(80);
        });
    });
});
