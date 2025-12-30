/**
 * Unit tests for Event Payload Validation (TM-003)
 * Tests JSON schemas and validation for all 7 event types
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock userStorage
vi.mock('../../src/services/userStorage.js', () => ({
    userStorage: {
        getCurrentUserId: vi.fn(() => 'test-user-123'),
        get: vi.fn(() => []),
        set: vi.fn()
    }
}));

// Mock constants
vi.mock('../../src/config/constants.js', () => ({
    LEARNING_CONFIG: {
        batchSize: 10,
        debounceDelay: 1000
    }
}));

// Mock crypto.randomUUID
vi.stubGlobal('crypto', {
    randomUUID: vi.fn(() => 'mock-uuid-12345')
});

// Mock sessionStorage
vi.stubGlobal('sessionStorage', {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn()
});

// Mock window
vi.stubGlobal('window', {
    innerWidth: 1200,
    dispatchEvent: vi.fn(),
    currentLesson: null,
    CustomEvent: class CustomEvent {
        constructor(type, options) {
            this.type = type;
            this.detail = options?.detail;
        }
    }
});

// Import after mocks
import { 
    EVENT_TYPES, 
    EVENT_SCHEMAS, 
    validateEventPayload, 
    eventStream 
} from '../../src/services/eventStreaming.js';

describe('Event Schema Validation - TM-003', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        eventStream.eventQueue = [];
        eventStream.listeners = [];
        eventStream.setStrictValidation(false); // Start with non-strict
    });

    describe('EVENT_SCHEMAS structure', () => {
        it('should define schemas for all 7 required event types', () => {
            expect(EVENT_SCHEMAS[EVENT_TYPES.ANSWER_ATTEMPT]).toBeDefined();
            expect(EVENT_SCHEMAS[EVENT_TYPES.PRONUNCIATION_SCORE]).toBeDefined();
            expect(EVENT_SCHEMAS[EVENT_TYPES.LESSON_COMPLETE]).toBeDefined();
            expect(EVENT_SCHEMAS[EVENT_TYPES.WORD_SKIPPED]).toBeDefined();
            expect(EVENT_SCHEMAS[EVENT_TYPES.AI_TIP_SHOWN]).toBeDefined();
            expect(EVENT_SCHEMAS[EVENT_TYPES.STUCK_WORD_RESCUE]).toBeDefined();
            expect(EVENT_SCHEMAS[EVENT_TYPES.EXERCISE_INTERACTION]).toBeDefined();
        });

        it('should have required and optional arrays in each schema', () => {
            Object.values(EVENT_SCHEMAS).forEach(schema => {
                expect(schema.required).toBeInstanceOf(Array);
                expect(schema.optional).toBeInstanceOf(Array);
                expect(schema.types).toBeInstanceOf(Object);
            });
        });
    });

    describe('validateEventPayload()', () => {
        describe('answer_attempt schema', () => {
            it('should pass with all required fields', () => {
                const result = validateEventPayload(EVENT_TYPES.ANSWER_ATTEMPT, {
                    wordId: 'w1',
                    lessonId: 'l1',
                    exerciseType: 'cloze'
                });
                expect(result.valid).toBe(true);
                expect(result.errors).toHaveLength(0);
            });

            it('should fail when missing wordId', () => {
                const result = validateEventPayload(EVENT_TYPES.ANSWER_ATTEMPT, {
                    lessonId: 'l1',
                    exerciseType: 'cloze'
                });
                expect(result.valid).toBe(false);
                expect(result.errors).toContain('Missing required field: wordId');
            });

            it('should fail when missing lessonId', () => {
                const result = validateEventPayload(EVENT_TYPES.ANSWER_ATTEMPT, {
                    wordId: 'w1',
                    exerciseType: 'cloze'
                });
                expect(result.valid).toBe(false);
                expect(result.errors).toContain('Missing required field: lessonId');
            });

            it('should fail when missing exerciseType', () => {
                const result = validateEventPayload(EVENT_TYPES.ANSWER_ATTEMPT, {
                    wordId: 'w1',
                    lessonId: 'l1'
                });
                expect(result.valid).toBe(false);
                expect(result.errors).toContain('Missing required field: exerciseType');
            });

            it('should validate type for responseTime', () => {
                const result = validateEventPayload(EVENT_TYPES.ANSWER_ATTEMPT, {
                    wordId: 'w1',
                    lessonId: 'l1',
                    exerciseType: 'cloze',
                    responseTime: 'not-a-number'
                });
                expect(result.valid).toBe(false);
                expect(result.errors).toContain('Invalid type for responseTime: expected number, got string');
            });
        });

        describe('pronunciation_score schema', () => {
            it('should pass with wordId only', () => {
                const result = validateEventPayload(EVENT_TYPES.PRONUNCIATION_SCORE, {
                    wordId: 'w1'
                });
                expect(result.valid).toBe(true);
            });

            it('should fail when missing wordId', () => {
                const result = validateEventPayload(EVENT_TYPES.PRONUNCIATION_SCORE, {
                    overallScore: 85
                });
                expect(result.valid).toBe(false);
                expect(result.errors).toContain('Missing required field: wordId');
            });

            it('should validate phonemeBreakdown as array', () => {
                const result = validateEventPayload(EVENT_TYPES.PRONUNCIATION_SCORE, {
                    wordId: 'w1',
                    phonemeBreakdown: 'not-an-array'
                });
                expect(result.valid).toBe(false);
                expect(result.errors).toContain('Invalid type for phonemeBreakdown: expected array, got string');
            });
        });

        describe('lesson_complete schema', () => {
            it('should pass with lessonId only', () => {
                const result = validateEventPayload(EVENT_TYPES.LESSON_COMPLETE, {
                    lessonId: 'l1'
                });
                expect(result.valid).toBe(true);
            });

            it('should fail when missing lessonId', () => {
                const result = validateEventPayload(EVENT_TYPES.LESSON_COMPLETE, {
                    duration: 5000
                });
                expect(result.valid).toBe(false);
                expect(result.errors).toContain('Missing required field: lessonId');
            });

            it('should validate exerciseTypesUsed as array', () => {
                const result = validateEventPayload(EVENT_TYPES.LESSON_COMPLETE, {
                    lessonId: 'l1',
                    exerciseTypesUsed: 'cloze' // should be array
                });
                expect(result.valid).toBe(false);
                expect(result.errors).toContain('Invalid type for exerciseTypesUsed: expected array, got string');
            });
        });

        describe('word_skipped schema', () => {
            it('should pass with required fields', () => {
                const result = validateEventPayload(EVENT_TYPES.WORD_SKIPPED, {
                    wordId: 'w1',
                    reason: 'timeout'
                });
                expect(result.valid).toBe(true);
            });

            it('should validate reason enum', () => {
                const result = validateEventPayload(EVENT_TYPES.WORD_SKIPPED, {
                    wordId: 'w1',
                    reason: 'invalid_reason'
                });
                expect(result.valid).toBe(false);
                expect(result.errors.some(e => e.includes('Invalid value for reason'))).toBe(true);
            });

            it('should accept both timeout and manual reasons', () => {
                const timeout = validateEventPayload(EVENT_TYPES.WORD_SKIPPED, {
                    wordId: 'w1',
                    reason: 'timeout'
                });
                expect(timeout.valid).toBe(true);

                const manual = validateEventPayload(EVENT_TYPES.WORD_SKIPPED, {
                    wordId: 'w1',
                    reason: 'manual'
                });
                expect(manual.valid).toBe(true);
            });
        });

        describe('ai_tip_shown schema', () => {
            it('should pass with required fields', () => {
                const result = validateEventPayload(EVENT_TYPES.AI_TIP_SHOWN, {
                    tipId: 'tip-1',
                    category: 'pronunciation'
                });
                expect(result.valid).toBe(true);
            });

            it('should fail when missing tipId', () => {
                const result = validateEventPayload(EVENT_TYPES.AI_TIP_SHOWN, {
                    category: 'grammar'
                });
                expect(result.valid).toBe(false);
                expect(result.errors).toContain('Missing required field: tipId');
            });

            it('should validate category enum', () => {
                const validCategories = ['pronunciation', 'grammar', 'memory', 'encouragement', 'vocabulary', 'general'];
                
                validCategories.forEach(category => {
                    const result = validateEventPayload(EVENT_TYPES.AI_TIP_SHOWN, {
                        tipId: 'tip-1',
                        category
                    });
                    expect(result.valid).toBe(true);
                });

                const invalid = validateEventPayload(EVENT_TYPES.AI_TIP_SHOWN, {
                    tipId: 'tip-1',
                    category: 'invalid_category'
                });
                expect(invalid.valid).toBe(false);
            });
        });

        describe('stuck_word_rescue schema', () => {
            it('should pass with required fields', () => {
                const result = validateEventPayload(EVENT_TYPES.STUCK_WORD_RESCUE, {
                    wordId: 'w1',
                    technique: 'keyword_mnemonic'
                });
                expect(result.valid).toBe(true);
            });

            it('should fail when missing technique', () => {
                const result = validateEventPayload(EVENT_TYPES.STUCK_WORD_RESCUE, {
                    wordId: 'w1'
                });
                expect(result.valid).toBe(false);
                expect(result.errors).toContain('Missing required field: technique');
            });

            it('should validate wasSuccessful as boolean', () => {
                const result = validateEventPayload(EVENT_TYPES.STUCK_WORD_RESCUE, {
                    wordId: 'w1',
                    technique: 'spaced_repetition',
                    wasSuccessful: 'yes' // should be boolean
                });
                expect(result.valid).toBe(false);
                expect(result.errors).toContain('Invalid type for wasSuccessful: expected boolean, got string');
            });
        });

        describe('exercise_interaction schema', () => {
            it('should pass with required fields', () => {
                const result = validateEventPayload(EVENT_TYPES.EXERCISE_INTERACTION, {
                    exerciseType: 'cloze',
                    interactionType: 'click'
                });
                expect(result.valid).toBe(true);
            });

            it('should validate interactionType enum', () => {
                // Valid values
                ['click', 'type', 'drag'].forEach(interactionType => {
                    const result = validateEventPayload(EVENT_TYPES.EXERCISE_INTERACTION, {
                        exerciseType: 'cloze',
                        interactionType
                    });
                    expect(result.valid).toBe(true);
                });

                // Invalid value
                const invalid = validateEventPayload(EVENT_TYPES.EXERCISE_INTERACTION, {
                    exerciseType: 'cloze',
                    interactionType: 'swipe'
                });
                expect(invalid.valid).toBe(false);
            });
        });

        describe('Legacy and unknown event types', () => {
            it('should skip validation for legacy event types', () => {
                const result = validateEventPayload('word_attempt', {});
                expect(result.valid).toBe(true); // No schema, passes by default
            });

            it('should skip validation for unknown event types', () => {
                const result = validateEventPayload('custom_event', { anything: 'goes' });
                expect(result.valid).toBe(true);
            });
        });
    });

    describe('Strict validation mode', () => {
        it('should throw error in strict mode when required fields missing', () => {
            expect(() => {
                validateEventPayload(EVENT_TYPES.ANSWER_ATTEMPT, {}, true);
            }).toThrow('Event validation failed for answer_attempt');
        });

        it('should not throw in non-strict mode', () => {
            expect(() => {
                validateEventPayload(EVENT_TYPES.ANSWER_ATTEMPT, {}, false);
            }).not.toThrow();
        });

        it('should include all errors in the thrown error message', () => {
            try {
                validateEventPayload(EVENT_TYPES.ANSWER_ATTEMPT, {}, true);
            } catch (e) {
                expect(e.message).toContain('Missing required field: wordId');
                expect(e.message).toContain('Missing required field: lessonId');
                expect(e.message).toContain('Missing required field: exerciseType');
            }
        });
    });

    describe('eventStream.setStrictValidation()', () => {
        it('should enable strict validation', () => {
            eventStream.setStrictValidation(true);
            
            expect(() => {
                eventStream.emitAnswerAttempt({});
            }).toThrow();
        });

        it('should disable strict validation', () => {
            eventStream.setStrictValidation(false);
            
            expect(() => {
                eventStream.emitAnswerAttempt({
                    wordId: 'w1',
                    lessonId: 'l1',
                    exerciseType: 'cloze'
                });
            }).not.toThrow();
        });
    });

    describe('eventStream.validateEvent()', () => {
        it('should return validation result', () => {
            const result = eventStream.validateEvent(EVENT_TYPES.ANSWER_ATTEMPT, {
                wordId: 'w1',
                lessonId: 'l1',
                exerciseType: 'cloze'
            });
            expect(result.valid).toBe(true);
        });

        it('should respect strictValidation setting', () => {
            eventStream.setStrictValidation(true);
            
            expect(() => {
                eventStream.validateEvent(EVENT_TYPES.ANSWER_ATTEMPT, {});
            }).toThrow();
        });
    });

    describe('Integration: emit methods with validation', () => {
        beforeEach(() => {
            eventStream.setStrictValidation(true);
        });

        afterEach(() => {
            eventStream.setStrictValidation(false);
        });

        it('emitAnswerAttempt should throw on missing required fields in strict mode', () => {
            expect(() => {
                eventStream.emitAnswerAttempt({});
            }).toThrow('Event validation failed');
        });

        it('emitPronunciationScore should throw on missing wordId in strict mode', () => {
            expect(() => {
                eventStream.emitPronunciationScore({});
            }).toThrow('Missing required field: wordId');
        });

        it('emitLessonComplete should throw on missing lessonId in strict mode', () => {
            expect(() => {
                eventStream.emitLessonComplete({});
            }).toThrow('Missing required field: lessonId');
        });

        it('emitWordSkipped should throw on missing fields in strict mode', () => {
            expect(() => {
                eventStream.emitWordSkipped({});
            }).toThrow('Event validation failed');
        });

        it('emitAITipShown should throw on missing fields in strict mode', () => {
            expect(() => {
                eventStream.emitAITipShown({});
            }).toThrow('Event validation failed');
        });

        it('emitStuckWordRescue should throw on missing fields in strict mode', () => {
            expect(() => {
                eventStream.emitStuckWordRescue({});
            }).toThrow('Event validation failed');
        });

        it('emitExerciseInteraction should throw on missing fields in strict mode', () => {
            expect(() => {
                eventStream.emitExerciseInteraction({});
            }).toThrow('Event validation failed');
        });

        it('emit() should validate against schema for known event types', () => {
            expect(() => {
                eventStream.emit(EVENT_TYPES.ANSWER_ATTEMPT, {});
            }).toThrow('Event validation failed');
        });

        it('emit() should not throw for unknown event types', () => {
            expect(() => {
                eventStream.emit('custom_event', { any: 'data' });
            }).not.toThrow();
        });
    });

    describe('Valid payloads pass validation', () => {
        beforeEach(() => {
            eventStream.setStrictValidation(true);
        });

        afterEach(() => {
            eventStream.setStrictValidation(false);
        });

        it('should emit valid answer_attempt', () => {
            const event = eventStream.emitAnswerAttempt({
                wordId: 'w1',
                lessonId: 'l1',
                correctness: true,
                responseTime: 1500,
                hintUsed: false,
                attemptNumber: 1,
                exerciseType: 'cloze'
            });
            expect(event.eventType).toBe('answer_attempt');
        });

        it('should emit valid pronunciation_score', () => {
            const event = eventStream.emitPronunciationScore({
                wordId: 'w1',
                overallScore: 85,
                phonemeBreakdown: [{ phoneme: 'a', score: 90 }]
            });
            expect(event.eventType).toBe('pronunciation_score');
        });

        it('should emit valid lesson_complete', () => {
            const event = eventStream.emitLessonComplete({
                lessonId: 'l1',
                duration: 300000,
                accuracy: 92,
                exerciseTypesUsed: ['cloze', 'word_order'],
                rescueLessonsTriggered: 0
            });
            expect(event.eventType).toBe('lesson_complete');
        });

        it('should emit valid word_skipped', () => {
            const event = eventStream.emitWordSkipped({
                wordId: 'w1',
                reason: 'timeout',
                exerciseType: 'pronunciation'
            });
            expect(event.eventType).toBe('word_skipped');
        });

        it('should emit valid ai_tip_shown', () => {
            const event = eventStream.emitAITipShown({
                tipId: 'tip-123',
                category: 'pronunciation',
                triggerSignal: 'low_score'
            });
            expect(event.eventType).toBe('ai_tip_shown');
        });

        it('should emit valid stuck_word_rescue', () => {
            const event = eventStream.emitStuckWordRescue({
                wordId: 'w1',
                technique: 'keyword_mnemonic',
                attemptNumber: 4,
                wasSuccessful: true
            });
            expect(event.eventType).toBe('stuck_word_rescue');
        });

        it('should emit valid exercise_interaction', () => {
            const event = eventStream.emitExerciseInteraction({
                exerciseType: 'drag_drop',
                interactionType: 'drag'
            });
            expect(event.eventType).toBe('exercise_interaction');
        });
    });
});
