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

class EventStreamingService {
    constructor() {
        this.eventQueue = [];
        this.debounceTimer = null;
        this.listeners = [];
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
        if (!wordId || !lessonId || !exerciseType) {
            console.warn('[EventStream] answer_attempt missing required fields', { wordId, lessonId, exerciseType });
        }
        return this.track(EVENT_TYPES.ANSWER_ATTEMPT, {
            wordId,
            lessonId,
            correctness: Boolean(correctness),
            responseTime: Number(responseTime) || 0,
            hintUsed: Boolean(hintUsed),
            attemptNumber: Number(attemptNumber) || 1,
            exerciseType
        });
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
        if (!wordId) {
            console.warn('[EventStream] pronunciation_score missing wordId');
        }
        return this.track(EVENT_TYPES.PRONUNCIATION_SCORE, {
            wordId,
            overallScore: Number(overallScore) || 0,
            phonemeBreakdown: Array.isArray(phonemeBreakdown) ? phonemeBreakdown : [],
            timestamp: Date.now()
        });
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
        if (!lessonId) {
            console.warn('[EventStream] lesson_complete missing lessonId');
        }
        return this.track(EVENT_TYPES.LESSON_COMPLETE, {
            lessonId,
            duration: Number(duration) || 0,
            accuracy: Number(accuracy) || 0,
            exerciseTypesUsed: Array.isArray(exerciseTypesUsed) ? exerciseTypesUsed : [],
            rescueLessonsTriggered: Number(rescueLessonsTriggered) || 0
        });
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
        if (!wordId || !reason) {
            console.warn('[EventStream] word_skipped missing required fields', { wordId, reason });
        }
        return this.track(EVENT_TYPES.WORD_SKIPPED, {
            wordId,
            reason: ['timeout', 'manual'].includes(reason) ? reason : 'manual',
            exerciseType: exerciseType || 'unknown'
        });
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
        if (!tipId || !category) {
            console.warn('[EventStream] ai_tip_shown missing required fields', { tipId, category });
        }
        return this.track(EVENT_TYPES.AI_TIP_SHOWN, {
            tipId,
            category,
            triggerSignal: triggerSignal || 'unspecified',
            userId: userStorage.getCurrentUserId()
        });
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
        if (!wordId || !technique) {
            console.warn('[EventStream] stuck_word_rescue missing required fields', { wordId, technique });
        }
        return this.track(EVENT_TYPES.STUCK_WORD_RESCUE, {
            wordId,
            technique,
            attemptNumber: Number(attemptNumber) || 3,
            wasSuccessful: Boolean(wasSuccessful)
        });
    }

    /**
     * 7. exercise_interaction - Emitted on any exercise interaction
     * @param {Object} params - Event parameters
     * @param {string} params.exerciseType - Type of exercise
     * @param {string} params.interactionType - 'click', 'type', or 'drag'
     * @returns {Object} The created event
     */
    emitExerciseInteraction({ exerciseType, interactionType }) {
        if (!exerciseType || !interactionType) {
            console.warn('[EventStream] exercise_interaction missing required fields', { exerciseType, interactionType });
        }
        return this.track(EVENT_TYPES.EXERCISE_INTERACTION, {
            exerciseType,
            interactionType: ['click', 'type', 'drag'].includes(interactionType) ? interactionType : 'click',
            timestamp: Date.now()
        });
    }

    /**
     * Generic emit method for custom events (also supports 'learning_event' for AI pipeline)
     * @param {string} eventType - Event type
     * @param {Object} data - Event data
     * @returns {Object} The created event
     */
    emit(eventType, data = {}) {
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
