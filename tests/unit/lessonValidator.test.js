/**
 * LessonValidator Unit Tests
 * 
 * Tests for lesson schema validation service.
 */

import { test, expect } from '@playwright/test';

const HOME_URL = 'http://localhost:4321/';

test.beforeEach(async ({ page }) => {
    await page.goto(HOME_URL);
});

// ============================================================================
// VALIDATION RESULT
// ============================================================================

test.describe('LessonValidator: ValidationResult', () => {
    test('VALID-001: should initialize as valid', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { ValidationResult } = await import('/src/services/LessonValidator.js');
            const r = new ValidationResult();
            return { valid: r.valid, errorsLen: r.errors.length, warningsLen: r.warnings.length };
        });
        expect(result.valid).toBe(true);
        expect(result.errorsLen).toBe(0);
        expect(result.warningsLen).toBe(0);
    });
    
    test('VALID-002: should become invalid when error added', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { ValidationResult } = await import('/src/services/LessonValidator.js');
            const r = new ValidationResult();
            r.addError('test.field', 'Test error');
            return { valid: r.valid, errorsLen: r.errors.length };
        });
        expect(result.valid).toBe(false);
        expect(result.errorsLen).toBe(1);
    });
    
    test('VALID-003: should stay valid when warning added', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { ValidationResult } = await import('/src/services/LessonValidator.js');
            const r = new ValidationResult();
            r.addWarning('test.field', 'Test warning');
            return { valid: r.valid, warningsLen: r.warnings.length };
        });
        expect(result.valid).toBe(true);
        expect(result.warningsLen).toBe(1);
    });
    
    test('VALID-004: should convert to object correctly', async ({ page }) => {
        const obj = await page.evaluate(async () => {
            const { ValidationResult } = await import('/src/services/LessonValidator.js');
            const r = new ValidationResult();
            r.addError('field', 'Error');
            r.addWarning('field', 'Warning');
            return r.toObject();
        });
        expect(obj.valid).toBe(false);
        expect(obj.errorCount).toBe(1);
        expect(obj.warningCount).toBe(1);
    });
});

// ============================================================================
// LESSON VALIDATION
// ============================================================================

test.describe('LessonValidator: Lesson Validation', () => {
    test('LESSON-001: should reject null lesson', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { LessonValidator } = await import('/src/services/LessonValidator.js');
            const v = new LessonValidator();
            return v.validateLesson(null).toObject();
        });
        expect(result.valid).toBe(false);
    });
    
    test('LESSON-002: should reject lesson without id', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { LessonValidator } = await import('/src/services/LessonValidator.js');
            const v = new LessonValidator();
            return v.validateLesson({ title: 'Test', topic: 'test', words: [{ pt: 'a', en: 'b' }] }).toObject();
        });
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.path === 'id')).toBe(true);
    });
    
    test('LESSON-003: should reject lesson with invalid id format', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { LessonValidator } = await import('/src/services/LessonValidator.js');
            const v = new LessonValidator();
            return v.validateLesson({ id: 'Invalid ID!', title: 'Test', topic: 'test', words: [{ pt: 'a', en: 'b' }] }).toObject();
        });
        expect(result.valid).toBe(false);
    });
    
    test('LESSON-004: should accept valid kebab-case id', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { LessonValidator } = await import('/src/services/LessonValidator.js');
            const v = new LessonValidator();
            const r = v.validateLesson({ id: 'valid-lesson-id', title: 'Test', topic: 'test', words: [{ pt: 'a', en: 'b' }] });
            return r.errors.filter(e => e.path === 'id').length;
        });
        expect(result).toBe(0);
    });
    
    test('LESSON-005: should reject lesson without title', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { LessonValidator } = await import('/src/services/LessonValidator.js');
            const v = new LessonValidator();
            return v.validateLesson({ id: 'test', topic: 'test', words: [{ pt: 'a', en: 'b' }] }).toObject();
        });
        expect(result.valid).toBe(false);
    });
    
    test('LESSON-006: should accept minimal valid lesson', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { LessonValidator } = await import('/src/services/LessonValidator.js');
            const v = new LessonValidator();
            return v.validateLesson({
                id: 'test-lesson',
                title: 'Test Lesson',
                topic: 'test',
                words: [{ pt: 'olá', en: 'hello' }]
            }).toObject();
        });
        expect(result.valid).toBe(true);
    });
    
    test('LESSON-007: should reject invalid tier', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { LessonValidator } = await import('/src/services/LessonValidator.js');
            const v = new LessonValidator();
            return v.validateLesson({
                id: 'test',
                title: 'Test',
                topic: 'test',
                tier: 5,
                words: [{ pt: 'a', en: 'b' }]
            }).toObject();
        });
        expect(result.valid).toBe(false);
    });
    
    test('LESSON-008: should accept valid tiers (1-4)', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { LessonValidator, VALID_TIERS } = await import('/src/services/LessonValidator.js');
            const v = new LessonValidator();
            const results = [];
            for (const tier of VALID_TIERS) {
                const r = v.validateLesson({
                    id: 'test',
                    title: 'Test',
                    topic: 'test',
                    tier,
                    words: [{ pt: 'a', en: 'b' }]
                });
                results.push(r.errors.filter(e => e.path === 'tier').length);
            }
            return results;
        });
        expect(result.every(count => count === 0)).toBe(true);
    });
});

// ============================================================================
// WORD VALIDATION
// ============================================================================

test.describe('LessonValidator: Word Validation', () => {
    test('WORD-001: should reject word without pt', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { LessonValidator } = await import('/src/services/LessonValidator.js');
            const v = new LessonValidator();
            return v.validateWord({ en: 'hello' }).toObject();
        });
        expect(result.valid).toBe(false);
    });
    
    test('WORD-002: should reject word without en', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { LessonValidator } = await import('/src/services/LessonValidator.js');
            const v = new LessonValidator();
            return v.validateWord({ pt: 'olá' }).toObject();
        });
        expect(result.valid).toBe(false);
    });
    
    test('WORD-003: should accept minimal valid word', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { LessonValidator } = await import('/src/services/LessonValidator.js');
            const v = new LessonValidator();
            return v.validateWord({ pt: 'olá', en: 'hello' }).toObject();
        });
        expect(result.valid).toBe(true);
    });
    
    test('WORD-004: should warn about missing pronunciation', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { LessonValidator } = await import('/src/services/LessonValidator.js');
            const v = new LessonValidator();
            return v.validateWord({ pt: 'olá', en: 'hello' }).toObject();
        });
        expect(result.warnings.some(w => w.message.includes('pronunciation'))).toBe(true);
    });
});

// ============================================================================
// CHALLENGE VALIDATION
// ============================================================================

test.describe('LessonValidator: Challenge Validation', () => {
    test('CHALLENGE-001: should reject challenge without type', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { LessonValidator } = await import('/src/services/LessonValidator.js');
            const v = new LessonValidator();
            return v.validateChallenge({}).toObject();
        });
        expect(result.valid).toBe(false);
    });
    
    test('CHALLENGE-002: should reject invalid challenge type', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { LessonValidator } = await import('/src/services/LessonValidator.js');
            const v = new LessonValidator();
            return v.validateChallenge({ type: 'invalid-type' }).toObject();
        });
        expect(result.valid).toBe(false);
    });
    
    test('CHALLENGE-003: should validate multiple-choice required fields', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { LessonValidator } = await import('/src/services/LessonValidator.js');
            const v = new LessonValidator();
            return v.validateChallenge({ type: 'multiple-choice' }).toObject();
        });
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.path.includes('question'))).toBe(true);
    });
    
    test('CHALLENGE-004: should accept valid multiple-choice', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { LessonValidator } = await import('/src/services/LessonValidator.js');
            const v = new LessonValidator();
            return v.validateChallenge({
                type: 'multiple-choice',
                question: 'What is "hello" in Portuguese?',
                options: ['Olá', 'Adeus', 'Obrigado', 'Por favor'],
                correct: 0
            }).toObject();
        });
        expect(result.valid).toBe(true);
    });
    
    test('CHALLENGE-005: should validate translate required fields', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { LessonValidator } = await import('/src/services/LessonValidator.js');
            const v = new LessonValidator();
            return v.validateChallenge({ type: 'translate' }).toObject();
        });
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.path.includes('prompt'))).toBe(true);
    });
    
    test('CHALLENGE-006: should validate match required fields', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { LessonValidator } = await import('/src/services/LessonValidator.js');
            const v = new LessonValidator();
            return v.validateChallenge({ type: 'match' }).toObject();
        });
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.path.includes('pairs'))).toBe(true);
    });
    
    test('CHALLENGE-007: should accept valid match challenge', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { LessonValidator } = await import('/src/services/LessonValidator.js');
            const v = new LessonValidator();
            return v.validateChallenge({
                type: 'match',
                pairs: [
                    { left: 'eu', right: 'I' },
                    { left: 'tu', right: 'you' },
                    { left: 'ele', right: 'he' }
                ]
            }).toObject();
        });
        expect(result.valid).toBe(true);
    });
    
    test('CHALLENGE-008: should validate sentence-builder required fields', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { LessonValidator } = await import('/src/services/LessonValidator.js');
            const v = new LessonValidator();
            return v.validateChallenge({ type: 'sentence-builder' }).toObject();
        });
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.path.includes('targetSentence'))).toBe(true);
    });
    
    test('CHALLENGE-009: should validate conjugation required fields', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { LessonValidator } = await import('/src/services/LessonValidator.js');
            const v = new LessonValidator();
            return v.validateChallenge({ type: 'conjugation' }).toObject();
        });
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.path.includes('verb'))).toBe(true);
    });
    
    test('CHALLENGE-010: should accept valid conjugation challenge', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { LessonValidator } = await import('/src/services/LessonValidator.js');
            const v = new LessonValidator();
            return v.validateChallenge({
                type: 'conjugation',
                verb: 'ser',
                tense: 'presente',
                person: 'eu',
                answer: 'sou'
            }).toObject();
        });
        expect(result.valid).toBe(true);
    });
});

// ============================================================================
// FULL LESSON VALIDATION
// ============================================================================

test.describe('LessonValidator: Full Lesson', () => {
    test('FULL-001: should validate complete lesson', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { LessonValidator } = await import('/src/services/LessonValidator.js');
            const v = new LessonValidator();
            return v.validateLesson({
                id: 'bb-pronouns-intro',
                title: 'Personal Pronouns: Introduction',
                topic: 'building-blocks',
                tier: 1,
                level: 'beginner',
                description: 'Learn the basic personal pronouns in Portuguese.',
                estimatedTime: '10 min',
                words: [
                    {
                        pt: 'eu',
                        en: 'I',
                        pronunciation: {
                            ipa: '/ew/',
                            guide: 'EH-oo',
                            difficulty: 'easy'
                        },
                        grammar: {
                            type: 'pronoun',
                            person: '1st',
                            number: 'singular'
                        },
                        examples: [
                            { pt: 'Eu sou português.', en: 'I am Portuguese.' }
                        ]
                    }
                ],
                challenges: [
                    {
                        type: 'multiple-choice',
                        question: 'What is "I" in Portuguese?',
                        options: ['eu', 'tu', 'ele', 'ela'],
                        correct: 0
                    }
                ],
                metadata: {
                    createdBy: 'human',
                    version: '1.0.0',
                    status: 'published'
                }
            }).toObject();
        });
        expect(result.valid).toBe(true);
        expect(result.errorCount).toBe(0);
    });
    
    test('FULL-002: convenience functions work', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { validateLesson, isValidLesson } = await import('/src/services/LessonValidator.js');
            const lesson = { id: 'test', title: 'Test', topic: 'test', words: [{ pt: 'a', en: 'b' }] };
            return {
                resultValid: validateLesson(lesson).valid,
                isValid: isValidLesson(lesson),
                invalidIsValid: isValidLesson({})
            };
        });
        expect(result.resultValid).toBe(true);
        expect(result.isValid).toBe(true);
        expect(result.invalidIsValid).toBe(false);
    });
});
