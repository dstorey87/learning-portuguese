/**
 * Event Streaming Service
 * Real-time streaming of user events to AI pipeline
 * Debounced and batched for efficiency
 */

import { LEARNING_CONFIG } from '../config/constants.js';
import { userStorage } from './userStorage.js';

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

    // === Private methods ===

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
