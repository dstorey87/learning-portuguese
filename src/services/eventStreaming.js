/**
 * Event Streaming Service
 * Real-time streaming of user events to AI pipeline
 * Debounced and batched for efficiency
 * 
 * TM-002: Implements all 7 required telemetry event types:
 * 1. answer_attempt - On any answer submit
 * 2. pronunciation_score - After pronunciation check
 * 3. lesson_complete - On lesson finish
 * 4. word_skipped - When user skips
 * 5. ai_tip_shown - When tip displays
 * 6. stuck_word_rescue - When rescue triggers
 * 7. exercise_interaction - On any interaction
 */

import { LEARNING_CONFIG } from '../config/constants.js';
import { userStorage } from './userStorage.js';

// Event type constants
export const EVENT_TYPES = {
    ANSWER_ATTEMPT: 'answer_attempt',
    PRONUNCIATION_SCORE: 'pronunciation_score',
    LESSON_COMPLETE: 'lesson_complete',
    WORD_SKIPPED: 'word_skipped',
    AI_TIP_SHOWN: 'ai_tip_shown',
    STUCK_WORD_RESCUE: 'stuck_word_rescue',
    EXERCISE_INTERACTION: 'exercise_interaction',
    // Legacy types for backward compatibility
    WORD_ATTEMPT: 'word_attempt',
    PRONUNCIATION: 'pronunciation',
    QUIZ_ANSWER: 'quiz_answer',
    UI_ACTION: 'ui_action',
    LESSON_NAV: 'lesson_nav',
    SESSION_START: 'session_start',
    SESSION_END: 'session_end'
};

// TM-003: JSON Schemas for event validation
export const EVENT_SCHEMAS = {
    [EVENT_TYPES.ANSWER_ATTEMPT]: {
        required: ['wordId', 'lessonId', 'exerciseType'],
        optional: ['correctness', 'responseTime', 'hintUsed', 'attemptNumber'],
        types: {
            wordId: 'string',
            lessonId: 'string',
            exerciseType: 'string',
            correctness: 'boolean',
            responseTime: 'number',
            hintUsed: 'boolean',
            attemptNumber: 'number'
        }
    },
    [EVENT_TYPES.PRONUNCIATION_SCORE]: {
        required: ['wordId'],
        optional: ['overallScore', 'phonemeBreakdown', 'timestamp'],
        types: {
            wordId: 'string',
            overallScore: 'number',
            phonemeBreakdown: 'array',
            timestamp: 'number'
        }
    },
    [EVENT_TYPES.LESSON_COMPLETE]: {
        required: ['lessonId'],
        optional: ['duration', 'accuracy', 'exerciseTypesUsed', 'rescueLessonsTriggered'],
        types: {
            lessonId: 'string',
            duration: 'number',
            accuracy: 'number',
            exerciseTypesUsed: 'array',
            rescueLessonsTriggered: 'number'
        }
    },
    [EVENT_TYPES.WORD_SKIPPED]: {
        required: ['wordId', 'reason'],
        optional: ['exerciseType'],
        types: {
            wordId: 'string',
            reason: 'string',
            exerciseType: 'string'
        },
        enums: {
            reason: ['timeout', 'manual']
        }
    },
    [EVENT_TYPES.AI_TIP_SHOWN]: {
        required: ['tipId', 'category'],
        optional: ['triggerSignal', 'userId'],
        types: {
            tipId: 'string',
            category: 'string',
            triggerSignal: 'string',
            userId: 'string'
        },
        enums: {
            category: ['pronunciation', 'grammar', 'memory', 'encouragement', 'vocabulary', 'general']
        }
    },
    [EVENT_TYPES.STUCK_WORD_RESCUE]: {
        required: ['wordId', 'technique'],
        optional: ['attemptNumber', 'wasSuccessful'],
        types: {
            wordId: 'string',
            technique: 'string',
            attemptNumber: 'number',
            wasSuccessful: 'boolean'
        }
    },
    [EVENT_TYPES.EXERCISE_INTERACTION]: {
        required: ['exerciseType', 'interactionType'],
        optional: ['timestamp'],
        types: {
            exerciseType: 'string',
            interactionType: 'string',
            timestamp: 'number'
        },
        enums: {
            interactionType: ['click', 'type', 'drag']
        }
    }
};

/**
 * Validate event payload against schema
 * @param {string} eventType - Event type
 * @param {Object} data - Event data
 * @param {boolean} strict - If true, throws on missing required fields
 * @returns {Object} Validation result {valid, errors}
 */
export function validateEventPayload(eventType, data, strict = false) {
    const schema = EVENT_SCHEMAS[eventType];
    const errors = [];
    
    // Skip validation for legacy/unknown event types
    if (!schema) {
        return { valid: true, errors: [] };
    }
    
    // Check required fields
    for (const field of schema.required) {
        if (data[field] === undefined || data[field] === null || data[field] === '') {
            errors.push(`Missing required field: ${field}`);
        }
    }
    
    // Check types for provided fields
    for (const [field, expectedType] of Object.entries(schema.types)) {
        if (data[field] !== undefined && data[field] !== null) {
            const actualType = Array.isArray(data[field]) ? 'array' : typeof data[field];
            if (actualType !== expectedType) {
                errors.push(`Invalid type for ${field}: expected ${expectedType}, got ${actualType}`);
            }
        }
    }
    
    // Check enum constraints
    if (schema.enums) {
        for (const [field, allowedValues] of Object.entries(schema.enums)) {
            if (data[field] !== undefined && !allowedValues.includes(data[field])) {
                errors.push(`Invalid value for ${field}: must be one of [${allowedValues.join(', ')}]`);
            }
        }
    }
    
    const valid = errors.length === 0;
    
    if (!valid && strict) {
        throw new Error(`Event validation failed for ${eventType}: ${errors.join('; ')}`);
    }
    
    return { valid, errors };
}

class EventStreamingService {
    constructor(options = {}) {
        this.eventQueue = [];
        this.debounceTimer = null;
        this.listeners = [];
        // TM-003: Enable strict validation (throws on invalid payloads)
        this.strictValidation = options.strictValidation ?? false;
    }

    /**
     * Enable or disable strict validation
     * @param {boolean} strict - If true, invalid payloads throw errors
     */
    setStrictValidation(strict) {
        this.strictValidation = strict;
    }

    /**
     * Validate event data and optionally throw on errors
     * @param {string} eventType - Event type
     * @param {Object} data - Event data
     * @returns {Object} Validation result
     */
    validateEvent(eventType, data) {
        return validateEventPayload(eventType, data, this.strictValidation);
    }

    /**
     * Create a real-time event object
     */
    createEvent(eventType, data) {
        return {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            eventType,
            userId: userStorage.getCurrentUserId(),
            sessionId: this._getSessionId(),
            data: {
                ...data,
                deviceType: this._getDeviceType(),
            },
            context: {
                currentLesson: this._getCurrentLesson(),
                sessionDuration: this._getSessionDuration(),
            }
        };
    }

    /**
     * Track a user event
     */
    track(eventType, data = {}) {
        const event = this.createEvent(eventType, data);
        this.eventQueue.push(event);
        
        // Store event locally
        this._persistEvent(event);
        
        // Debounce sending to AI
        this._debounceSend();
        
        // Notify listeners immediately
        this.listeners.forEach(listener => listener(event));
        
        return event;
    }

    /**
     * Subscribe to events in real-time
     */
    subscribe(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }

    /**
     * Track word attempt
     */
    trackWordAttempt(wordId, correct, responseTime, userInput) {
        return this.track('word_attempt', {
            wordId,
            correct,
            responseTime,
            userInput,
            attemptNumber: this._getAttemptCount(wordId) + 1,
        });
    }

    /**
     * Track pronunciation score
     */
    trackPronunciation(wordId, score, phonemeBreakdown, audioUrl) {
        return this.track('pronunciation', {
            wordId,
            score,
            phonemeBreakdown,
            audioUrl,
        });
    }

    /**
     * Track quiz answer
     */
    trackQuizAnswer(quizId, questionId, selectedOption, correctOption, timeSpent) {
        return this.track('quiz_answer', {
            quizId,
            questionId,
            selectedOption,
            correctOption,
            correct: selectedOption === correctOption,
            timeSpent,
        });
    }

    /**
     * Track UI interaction
     */
    trackUIAction(action, element, details = {}) {
        return this.track('ui_action', {
            action,
            element,
            ...details,
        });
    }

    /**
     * Track lesson navigation
     */
    trackLessonNav(fromLesson, toLesson, reason) {
        return this.track('lesson_nav', {
            fromLesson,
            toLesson,
            reason,
        });
    }

    /**
     * Track session start
     */
    trackSessionStart() {
        this._startSession();
        return this.track('session_start', {});
    }

    /**
     * Track session end
     */
    trackSessionEnd() {
        const duration = this._getSessionDuration();
        const event = this.track('session_end', { duration });
        this._endSession();
        return event;
    }

    // ========================================================================
    // TM-002: REQUIRED TELEMETRY EVENTS (7 types)
    // TM-003: With payload validation
    // ========================================================================

    /**
     * 1. answer_attempt - Emitted on any answer submit
     * @param {Object} params - Event parameters
     * @param {string} params.wordId - Word identifier
     * @param {string} params.lessonId - Current lesson ID
     * @param {boolean} params.correctness - Whether answer was correct
     * @param {number} params.responseTime - Time taken in ms
     * @param {boolean} params.hintUsed - Whether hint was shown
     * @param {number} params.attemptNumber - Which attempt this is (1, 2, 3...)
     * @param {string} params.exerciseType - Type of exercise (word_order, cloze, etc.)
     * @returns {Object} The created event
     */
    emitAnswerAttempt({ wordId, lessonId, correctness, responseTime, hintUsed, attemptNumber, exerciseType }) {
        const data = {
            wordId,
            lessonId,
            correctness: Boolean(correctness),
            responseTime: Number(responseTime) || 0,
            hintUsed: Boolean(hintUsed),
            attemptNumber: Number(attemptNumber) || 1,
            exerciseType
        };
        this.validateEvent(EVENT_TYPES.ANSWER_ATTEMPT, data);
        return this.track(EVENT_TYPES.ANSWER_ATTEMPT, data);
    }

    /**
     * 2. pronunciation_score - Emitted after pronunciation check
     * @param {Object} params - Event parameters
     * @param {string} params.wordId - Word identifier
     * @param {number} params.overallScore - Score 0-100
     * @param {Array} params.phonemeBreakdown - Per-phoneme scores [{phoneme, score, accuracy}]
     * @returns {Object} The created event
     */
    emitPronunciationScore({ wordId, overallScore, phonemeBreakdown = [] }) {
        const data = {
            wordId,
            overallScore: Number(overallScore) || 0,
            phonemeBreakdown: Array.isArray(phonemeBreakdown) ? phonemeBreakdown : [],
            timestamp: Date.now()
        };
        this.validateEvent(EVENT_TYPES.PRONUNCIATION_SCORE, data);
        return this.track(EVENT_TYPES.PRONUNCIATION_SCORE, data);
    }

    /**
     * 3. lesson_complete - Emitted when lesson finishes
     * @param {Object} params - Event parameters
     * @param {string} params.lessonId - Lesson identifier
     * @param {number} params.duration - Time spent in ms
     * @param {number} params.accuracy - Overall accuracy 0-100
     * @param {Array<string>} params.exerciseTypesUsed - List of exercise types encountered
     * @param {number} params.rescueLessonsTriggered - Count of rescue lessons triggered
     * @returns {Object} The created event
     */
    emitLessonComplete({ lessonId, duration, accuracy, exerciseTypesUsed = [], rescueLessonsTriggered = 0 }) {
        const data = {
            lessonId,
            duration: Number(duration) || 0,
            accuracy: Number(accuracy) || 0,
            exerciseTypesUsed: Array.isArray(exerciseTypesUsed) ? exerciseTypesUsed : [],
            rescueLessonsTriggered: Number(rescueLessonsTriggered) || 0
        };
        this.validateEvent(EVENT_TYPES.LESSON_COMPLETE, data);
        return this.track(EVENT_TYPES.LESSON_COMPLETE, data);
    }

    /**
     * 4. word_skipped - Emitted when user skips a word
     * @param {Object} params - Event parameters
     * @param {string} params.wordId - Word identifier
     * @param {string} params.reason - 'timeout' or 'manual'
     * @param {string} params.exerciseType - Type of exercise when skipped
     * @returns {Object} The created event
     */
    emitWordSkipped({ wordId, reason, exerciseType }) {
        const data = {
            wordId,
            reason: ['timeout', 'manual'].includes(reason) ? reason : 'manual',
            exerciseType: exerciseType || 'unknown'
        };
        this.validateEvent(EVENT_TYPES.WORD_SKIPPED, data);
        return this.track(EVENT_TYPES.WORD_SKIPPED, data);
    }

    /**
     * 5. ai_tip_shown - Emitted when an AI tip is displayed
     * @param {Object} params - Event parameters
     * @param {string} params.tipId - Unique tip identifier
     * @param {string} params.category - Tip category (pronunciation, grammar, memory, encouragement)
     * @param {string} params.triggerSignal - What triggered the tip (low_score, repeated_fail, etc.)
     * @returns {Object} The created event
     */
    emitAITipShown({ tipId, category, triggerSignal }) {
        const data = {
            tipId,
            category,
            triggerSignal: triggerSignal || 'unspecified',
            userId: userStorage.getCurrentUserId()
        };
        this.validateEvent(EVENT_TYPES.AI_TIP_SHOWN, data);
        return this.track(EVENT_TYPES.AI_TIP_SHOWN, data);
    }

    /**
     * 6. stuck_word_rescue - Emitted when rescue technique is triggered
     * @param {Object} params - Event parameters
     * @param {string} params.wordId - Word identifier
     * @param {string} params.technique - Rescue technique used (keyword_mnemonic, minimal_pair, etc.)
     * @param {number} params.attemptNumber - Which failure attempt triggered this (3, 4, 5...)
     * @param {boolean} params.wasSuccessful - Whether the rescue led to success
     * @returns {Object} The created event
     */
    emitStuckWordRescue({ wordId, technique, attemptNumber, wasSuccessful }) {
        const data = {
            wordId,
            technique,
            attemptNumber: Number(attemptNumber) || 3,
            wasSuccessful: Boolean(wasSuccessful)
        };
        this.validateEvent(EVENT_TYPES.STUCK_WORD_RESCUE, data);
        return this.track(EVENT_TYPES.STUCK_WORD_RESCUE, data);
    }

    /**
     * 7. exercise_interaction - Emitted on any exercise interaction
     * @param {Object} params - Event parameters
     * @param {string} params.exerciseType - Type of exercise
     * @param {string} params.interactionType - 'click', 'type', or 'drag'
     * @returns {Object} The created event
     */
    emitExerciseInteraction({ exerciseType, interactionType }) {
        const data = {
            exerciseType,
            interactionType: ['click', 'type', 'drag'].includes(interactionType) ? interactionType : 'click',
            timestamp: Date.now()
        };
        this.validateEvent(EVENT_TYPES.EXERCISE_INTERACTION, data);
        return this.track(EVENT_TYPES.EXERCISE_INTERACTION, data);
    }

    /**
     * Generic emit method for custom events (also supports 'learning_event' for AI pipeline)
     * TM-003: Validates against schema if defined
     * @param {string} eventType - Event type
     * @param {Object} data - Event data
     * @returns {Object} The created event
     */
    emit(eventType, data = {}) {
        // Validate if schema exists for this event type
        this.validateEvent(eventType, data);
        return this.track(eventType, data);
    }

    /**
     * Get all events for a specific type
     * @param {string} eventType - Event type to filter by
     * @returns {Array} Matching events
     */
    getEventsByType(eventType) {
        const events = userStorage.get('events') || [];
        return events.filter(e => e.eventType === eventType);
    }

    /**
     * Get event statistics
     * @returns {Object} Event counts by type
     */
    getEventStats() {
        const events = userStorage.get('events') || [];
        const stats = {};
        
        events.forEach(e => {
            stats[e.eventType] = (stats[e.eventType] || 0) + 1;
        });
        
        return {
            totalEvents: events.length,
            byType: stats,
            lastEvent: events[events.length - 1] || null
        };
    }

    /**
     * Get per-exercise performance and weak word signals for personalization
     * @returns {Object} { stats, strongTypes, weakTypes, weakWordIds }
     */
    getExercisePerformance() {
        const events = userStorage.get('events') || [];
        const attempts = events.filter(e =>
            e.eventType === EVENT_TYPES.ANSWER_ATTEMPT || e.eventType === 'word_attempt'
        );

        const stats = {};
        const wordStats = new Map();

        for (const event of attempts) {
            const data = event.data || {};
            const exerciseType = data.exerciseType || 'unknown';
            const correct = data.correctness ?? data.correct ?? false;
            const wordId = data.wordId || data.word || null;

            if (!stats[exerciseType]) {
                stats[exerciseType] = { correct: 0, total: 0 };
            }
            stats[exerciseType].total += 1;
            if (correct) stats[exerciseType].correct += 1;

            if (wordId) {
                if (!wordStats.has(wordId)) {
                    wordStats.set(wordId, { correct: 0, total: 0 });
                }
                const entry = wordStats.get(wordId);
                entry.total += 1;
                if (correct) entry.correct += 1;
            }
        }

        const normalizedStats = Object.entries(stats).reduce((acc, [type, value]) => {
            const accuracy = value.total > 0 ? value.correct / value.total : 0;
            acc[type] = { ...value, accuracy };
            return acc;
        }, {});

        const strongTypes = Object.entries(normalizedStats)
            .filter(([, value]) => value.total >= 3 && value.accuracy >= 0.75)
            .map(([type]) => type);

        const weakTypes = Object.entries(normalizedStats)
            .filter(([, value]) => value.total >= 3 && value.accuracy < 0.6)
            .map(([type]) => type);

        const weakWordIds = Array.from(wordStats.entries())
            .map(([wordId, value]) => ({
                wordId,
                accuracy: value.total > 0 ? value.correct / value.total : 0,
                incorrect: value.total - value.correct,
                total: value.total
            }))
            .filter(entry => entry.total >= 2 && entry.accuracy < 0.7)
            .sort((a, b) => b.incorrect - a.incorrect || b.total - a.total)
            .map(entry => entry.wordId);

        return {
            stats: normalizedStats,
            strongTypes,
            weakTypes,
            weakWordIds
        };
    }

    // ========================================================================
    // PRIVATE METHODS
    // ========================================================================

    _debounceSend() {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        
        this.debounceTimer = setTimeout(() => {
            if (this.eventQueue.length >= LEARNING_CONFIG.batchSize) {
                this._sendToAI();
            }
        }, LEARNING_CONFIG.debounceDelay);
    }

    _sendToAI() {
        if (this.eventQueue.length === 0) return;
        
        const batch = this.eventQueue.splice(0, LEARNING_CONFIG.batchSize);
        
        // This will be connected to the AI pipeline
        console.log('[EventStream] Sending batch to AI:', batch.length, 'events');
        
        // Emit batch event for AI pipeline to consume
        window.dispatchEvent(new CustomEvent('ai-event-batch', { 
            detail: { events: batch } 
        }));
    }

    _persistEvent(event) {
        const events = userStorage.get('events') || [];
        events.push(event);
        
        // Keep last 1000 events
        if (events.length > 1000) {
            events.splice(0, events.length - 1000);
        }
        
        userStorage.set('events', events);
    }

    _getSessionId() {
        let session = sessionStorage.getItem('portuSessionId');
        if (!session) {
            session = crypto.randomUUID();
            sessionStorage.setItem('portuSessionId', session);
        }
        return session;
    }

    _startSession() {
        sessionStorage.setItem('portuSessionStart', Date.now().toString());
    }

    _endSession() {
        sessionStorage.removeItem('portuSessionStart');
        sessionStorage.removeItem('portuSessionId');
    }

    _getSessionDuration() {
        const start = sessionStorage.getItem('portuSessionStart');
        return start ? Date.now() - parseInt(start) : 0;
    }

    _getCurrentLesson() {
        // Will be connected to lesson state
        return window.currentLesson || null;
    }

    _getAttemptCount(wordId) {
        const events = userStorage.get('events') || [];
        return events.filter(e => 
            e.eventType === 'word_attempt' && 
            e.data.wordId === wordId
        ).length;
    }

    _getDeviceType() {
        const width = window.innerWidth;
        if (width < 768) return 'mobile';
        if (width < 1024) return 'tablet';
        return 'desktop';
    }
}

// Export singleton instance
export const eventStream = new EventStreamingService();
export default eventStream;
