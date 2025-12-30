/**
 * Unit tests for EventStreamingService (TM-002)
 * Tests all 7 required telemetry event types
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
const mockUUID = 'mock-uuid-12345';
vi.stubGlobal('crypto', {
    randomUUID: vi.fn(() => mockUUID)
});

// Mock sessionStorage
const sessionStorageMock = {
    store: {},
    getItem: vi.fn((key) => sessionStorageMock.store[key] || null),
    setItem: vi.fn((key, value) => { sessionStorageMock.store[key] = value; }),
    removeItem: vi.fn((key) => { delete sessionStorageMock.store[key]; }),
    clear: vi.fn(() => { sessionStorageMock.store = {}; })
};
vi.stubGlobal('sessionStorage', sessionStorageMock);

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
import { eventStream, EVENT_TYPES } from '../../src/services/eventStreaming.js';
import { userStorage } from '../../src/services/userStorage.js';

describe('EventStreamingService - TM-002', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        sessionStorageMock.clear();
        eventStream.eventQueue = [];
        eventStream.listeners = [];
    });

    afterEach(() => {
        vi.clearAllTimers();
    });

    describe('EVENT_TYPES constants', () => {
        it('should export all 7 required event types', () => {
            expect(EVENT_TYPES.ANSWER_ATTEMPT).toBe('answer_attempt');
            expect(EVENT_TYPES.PRONUNCIATION_SCORE).toBe('pronunciation_score');
            expect(EVENT_TYPES.LESSON_COMPLETE).toBe('lesson_complete');
            expect(EVENT_TYPES.WORD_SKIPPED).toBe('word_skipped');
            expect(EVENT_TYPES.AI_TIP_SHOWN).toBe('ai_tip_shown');
            expect(EVENT_TYPES.STUCK_WORD_RESCUE).toBe('stuck_word_rescue');
            expect(EVENT_TYPES.EXERCISE_INTERACTION).toBe('exercise_interaction');
        });

        it('should export legacy event types for backward compatibility', () => {
            expect(EVENT_TYPES.WORD_ATTEMPT).toBe('word_attempt');
            expect(EVENT_TYPES.PRONUNCIATION).toBe('pronunciation');
            expect(EVENT_TYPES.QUIZ_ANSWER).toBe('quiz_answer');
            expect(EVENT_TYPES.UI_ACTION).toBe('ui_action');
        });
    });

    describe('emitAnswerAttempt()', () => {
        it('should emit answer_attempt with all required fields', () => {
            const params = {
                wordId: 'word-123',
                lessonId: 'lesson-456',
                correctness: true,
                responseTime: 2500,
                hintUsed: false,
                attemptNumber: 1,
                exerciseType: 'word_order'
            };

            const event = eventStream.emitAnswerAttempt(params);

            expect(event.eventType).toBe('answer_attempt');
            expect(event.data.wordId).toBe('word-123');
            expect(event.data.lessonId).toBe('lesson-456');
            expect(event.data.correctness).toBe(true);
            expect(event.data.responseTime).toBe(2500);
            expect(event.data.hintUsed).toBe(false);
            expect(event.data.attemptNumber).toBe(1);
            expect(event.data.exerciseType).toBe('word_order');
        });

        it('should coerce correctness to boolean', () => {
            const event = eventStream.emitAnswerAttempt({
                wordId: 'w1',
                lessonId: 'l1',
                correctness: 1, // truthy
                responseTime: 100,
                hintUsed: 0, // falsy
                attemptNumber: 1,
                exerciseType: 'cloze'
            });

            expect(event.data.correctness).toBe(true);
            expect(event.data.hintUsed).toBe(false);
        });

        it('should default responseTime and attemptNumber when missing', () => {
            const event = eventStream.emitAnswerAttempt({
                wordId: 'w1',
                lessonId: 'l1',
                correctness: true,
                exerciseType: 'cloze'
            });

            expect(event.data.responseTime).toBe(0);
            expect(event.data.attemptNumber).toBe(1);
        });

        it('should use schema validation for missing fields (TM-003)', () => {
            // With strict validation enabled, missing fields should throw
            eventStream.setStrictValidation(true);
            
            expect(() => {
                eventStream.emitAnswerAttempt({});
            }).toThrow('Event validation failed');
            
            eventStream.setStrictValidation(false);
        });
    });

    describe('emitPronunciationScore()', () => {
        it('should emit pronunciation_score with all fields', () => {
            const params = {
                wordId: 'word-abc',
                overallScore: 85,
                phonemeBreakdown: [
                    { phoneme: 'ɐ', score: 90, accuracy: 'good' },
                    { phoneme: 'ʃ', score: 80, accuracy: 'fair' }
                ]
            };

            const event = eventStream.emitPronunciationScore(params);

            expect(event.eventType).toBe('pronunciation_score');
            expect(event.data.wordId).toBe('word-abc');
            expect(event.data.overallScore).toBe(85);
            expect(event.data.phonemeBreakdown).toHaveLength(2);
            expect(event.data.timestamp).toBeDefined();
        });

        it('should default phonemeBreakdown to empty array', () => {
            const event = eventStream.emitPronunciationScore({
                wordId: 'w1',
                overallScore: 70
            });

            expect(event.data.phonemeBreakdown).toEqual([]);
        });

        it('should coerce invalid phonemeBreakdown to empty array', () => {
            const event = eventStream.emitPronunciationScore({
                wordId: 'w1',
                overallScore: 70,
                phonemeBreakdown: 'invalid'
            });

            expect(event.data.phonemeBreakdown).toEqual([]);
        });

        it('should use schema validation for missing wordId (TM-003)', () => {
            eventStream.setStrictValidation(true);
            
            expect(() => {
                eventStream.emitPronunciationScore({ overallScore: 50 });
            }).toThrow('Missing required field: wordId');
            
            eventStream.setStrictValidation(false);
        });
    });

    describe('emitLessonComplete()', () => {
        it('should emit lesson_complete with all fields', () => {
            const params = {
                lessonId: 'articles-101',
                duration: 300000, // 5 minutes
                accuracy: 92,
                exerciseTypesUsed: ['word_order', 'cloze', 'listening'],
                rescueLessonsTriggered: 1
            };

            const event = eventStream.emitLessonComplete(params);

            expect(event.eventType).toBe('lesson_complete');
            expect(event.data.lessonId).toBe('articles-101');
            expect(event.data.duration).toBe(300000);
            expect(event.data.accuracy).toBe(92);
            expect(event.data.exerciseTypesUsed).toEqual(['word_order', 'cloze', 'listening']);
            expect(event.data.rescueLessonsTriggered).toBe(1);
        });

        it('should default arrays and numbers', () => {
            const event = eventStream.emitLessonComplete({
                lessonId: 'l1'
            });

            expect(event.data.duration).toBe(0);
            expect(event.data.accuracy).toBe(0);
            expect(event.data.exerciseTypesUsed).toEqual([]);
            expect(event.data.rescueLessonsTriggered).toBe(0);
        });

        it('should use schema validation for missing lessonId (TM-003)', () => {
            eventStream.setStrictValidation(true);
            
            expect(() => {
                eventStream.emitLessonComplete({});
            }).toThrow('Missing required field: lessonId');
            
            eventStream.setStrictValidation(false);
        });
    });

    describe('emitWordSkipped()', () => {
        it('should emit word_skipped with all fields', () => {
            const event = eventStream.emitWordSkipped({
                wordId: 'word-xyz',
                reason: 'timeout',
                exerciseType: 'pronunciation_drill'
            });

            expect(event.eventType).toBe('word_skipped');
            expect(event.data.wordId).toBe('word-xyz');
            expect(event.data.reason).toBe('timeout');
            expect(event.data.exerciseType).toBe('pronunciation_drill');
        });

        it('should validate reason to allowed values', () => {
            const event1 = eventStream.emitWordSkipped({
                wordId: 'w1',
                reason: 'manual',
                exerciseType: 'cloze'
            });
            expect(event1.data.reason).toBe('manual');

            const event2 = eventStream.emitWordSkipped({
                wordId: 'w1',
                reason: 'invalid_reason',
                exerciseType: 'cloze'
            });
            expect(event2.data.reason).toBe('manual'); // defaults to manual
        });

        it('should default exerciseType to unknown', () => {
            const event = eventStream.emitWordSkipped({
                wordId: 'w1',
                reason: 'manual'
            });

            expect(event.data.exerciseType).toBe('unknown');
        });
    });

    describe('emitAITipShown()', () => {
        it('should emit ai_tip_shown with all fields', () => {
            const event = eventStream.emitAITipShown({
                tipId: 'tip-001',
                category: 'pronunciation',
                triggerSignal: 'low_score'
            });

            expect(event.eventType).toBe('ai_tip_shown');
            expect(event.data.tipId).toBe('tip-001');
            expect(event.data.category).toBe('pronunciation');
            expect(event.data.triggerSignal).toBe('low_score');
            expect(event.data.userId).toBe('test-user-123');
        });

        it('should default triggerSignal to unspecified', () => {
            const event = eventStream.emitAITipShown({
                tipId: 'tip-002',
                category: 'grammar'
            });

            expect(event.data.triggerSignal).toBe('unspecified');
        });

        it('should use schema validation for missing fields (TM-003)', () => {
            eventStream.setStrictValidation(true);
            
            expect(() => {
                eventStream.emitAITipShown({});
            }).toThrow('Event validation failed');
            
            eventStream.setStrictValidation(false);
        });
    });

    describe('emitStuckWordRescue()', () => {
        it('should emit stuck_word_rescue with all fields', () => {
            const event = eventStream.emitStuckWordRescue({
                wordId: 'difficult-word',
                technique: 'keyword_mnemonic',
                attemptNumber: 4,
                wasSuccessful: true
            });

            expect(event.eventType).toBe('stuck_word_rescue');
            expect(event.data.wordId).toBe('difficult-word');
            expect(event.data.technique).toBe('keyword_mnemonic');
            expect(event.data.attemptNumber).toBe(4);
            expect(event.data.wasSuccessful).toBe(true);
        });

        it('should default attemptNumber to 3', () => {
            const event = eventStream.emitStuckWordRescue({
                wordId: 'w1',
                technique: 'minimal_pair',
                wasSuccessful: false
            });

            expect(event.data.attemptNumber).toBe(3);
        });

        it('should coerce wasSuccessful to boolean', () => {
            const event = eventStream.emitStuckWordRescue({
                wordId: 'w1',
                technique: 'spaced_repetition',
                wasSuccessful: 0
            });

            expect(event.data.wasSuccessful).toBe(false);
        });
    });

    describe('emitExerciseInteraction()', () => {
        it('should emit exercise_interaction with all fields', () => {
            const event = eventStream.emitExerciseInteraction({
                exerciseType: 'drag_drop',
                interactionType: 'drag'
            });

            expect(event.eventType).toBe('exercise_interaction');
            expect(event.data.exerciseType).toBe('drag_drop');
            expect(event.data.interactionType).toBe('drag');
            expect(event.data.timestamp).toBeDefined();
        });

        it('should validate interactionType to allowed values', () => {
            const click = eventStream.emitExerciseInteraction({
                exerciseType: 'mcq',
                interactionType: 'click'
            });
            expect(click.data.interactionType).toBe('click');

            const type = eventStream.emitExerciseInteraction({
                exerciseType: 'cloze',
                interactionType: 'type'
            });
            expect(type.data.interactionType).toBe('type');

            const invalid = eventStream.emitExerciseInteraction({
                exerciseType: 'test',
                interactionType: 'swipe'
            });
            expect(invalid.data.interactionType).toBe('click'); // defaults to click
        });
    });

    describe('emit() generic method', () => {
        it('should allow custom event types', () => {
            const event = eventStream.emit('custom_event', { foo: 'bar' });

            expect(event.eventType).toBe('custom_event');
            expect(event.data.foo).toBe('bar');
        });

        it('should support learning_event for AI pipeline', () => {
            const event = eventStream.emit('learning_event', {
                userId: 'user-123',
                wordId: 'word-456',
                action: 'studied'
            });

            expect(event.eventType).toBe('learning_event');
            expect(event.data.userId).toBe('user-123');
        });
    });

    describe('getEventsByType()', () => {
        it('should filter events by type', () => {
            vi.mocked(userStorage.get).mockReturnValue([
                { eventType: 'answer_attempt', data: { wordId: 'w1' } },
                { eventType: 'pronunciation_score', data: { wordId: 'w2' } },
                { eventType: 'answer_attempt', data: { wordId: 'w3' } }
            ]);

            const answerEvents = eventStream.getEventsByType('answer_attempt');

            expect(answerEvents).toHaveLength(2);
            expect(answerEvents[0].data.wordId).toBe('w1');
            expect(answerEvents[1].data.wordId).toBe('w3');
        });

        it('should return empty array if no events match', () => {
            vi.mocked(userStorage.get).mockReturnValue([]);

            const events = eventStream.getEventsByType('nonexistent');

            expect(events).toEqual([]);
        });
    });

    describe('getEventStats()', () => {
        it('should return statistics about stored events', () => {
            vi.mocked(userStorage.get).mockReturnValue([
                { eventType: 'answer_attempt', data: {} },
                { eventType: 'answer_attempt', data: {} },
                { eventType: 'pronunciation_score', data: {} },
                { eventType: 'lesson_complete', data: {} }
            ]);

            const stats = eventStream.getEventStats();

            expect(stats.totalEvents).toBe(4);
            expect(stats.byType.answer_attempt).toBe(2);
            expect(stats.byType.pronunciation_score).toBe(1);
            expect(stats.byType.lesson_complete).toBe(1);
            expect(stats.lastEvent).toBeDefined();
        });

        it('should handle empty event list', () => {
            vi.mocked(userStorage.get).mockReturnValue([]);

            const stats = eventStream.getEventStats();

            expect(stats.totalEvents).toBe(0);
            expect(stats.byType).toEqual({});
            expect(stats.lastEvent).toBeNull();
        });
    });

    describe('Event structure', () => {
        it('should include standard fields in all events', () => {
            const event = eventStream.emitAnswerAttempt({
                wordId: 'w1',
                lessonId: 'l1',
                correctness: true,
                responseTime: 100,
                hintUsed: false,
                attemptNumber: 1,
                exerciseType: 'cloze'
            });

            // Standard fields
            expect(event.id).toBe(mockUUID);
            expect(event.timestamp).toBeDefined();
            expect(event.userId).toBe('test-user-123');
            expect(event.sessionId).toBeDefined();
            expect(event.data.deviceType).toBe('desktop');
            expect(event.context).toBeDefined();
        });

        it('should persist events to storage', () => {
            vi.mocked(userStorage.get).mockReturnValue([]);

            eventStream.emitAnswerAttempt({
                wordId: 'w1',
                lessonId: 'l1',
                correctness: true,
                responseTime: 100,
                hintUsed: false,
                attemptNumber: 1,
                exerciseType: 'cloze'
            });

            expect(userStorage.set).toHaveBeenCalledWith('events', expect.any(Array));
        });
    });

    describe('subscribe() notifications', () => {
        it('should notify subscribers of new events', () => {
            const callback = vi.fn();
            eventStream.subscribe(callback);

            eventStream.emitAnswerAttempt({
                wordId: 'w1',
                lessonId: 'l1',
                correctness: true,
                responseTime: 100,
                hintUsed: false,
                attemptNumber: 1,
                exerciseType: 'cloze'
            });

            expect(callback).toHaveBeenCalledWith(expect.objectContaining({
                eventType: 'answer_attempt'
            }));
        });

        it('should return unsubscribe function', () => {
            const callback = vi.fn();
            const unsubscribe = eventStream.subscribe(callback);

            unsubscribe();

            eventStream.emitAnswerAttempt({
                wordId: 'w1',
                lessonId: 'l1',
                correctness: true,
                responseTime: 100,
                hintUsed: false,
                attemptNumber: 1,
                exerciseType: 'cloze'
            });

            expect(callback).not.toHaveBeenCalled();
        });
    });
});
