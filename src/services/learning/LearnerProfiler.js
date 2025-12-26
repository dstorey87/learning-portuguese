/**
 * LearnerProfiler - Adaptive Learning Intelligence
 * 
 * Analyzes user learning patterns to:
 * 1. Detect weaknesses and confusion pairs
 * 2. Identify optimal learning times
 * 3. Apply Krashen's i+1 comprehensible input theory
 * 4. Generate personalized recommendations
 */

import * as Logger from '../Logger.js';

const PORTUGUESE_CONFUSION_PATTERNS = {
    gender: { patterns: ['o/a', 'um/uma', '-o/-a'], description: 'Grammatical gender assignment' },
    falseFriends: { patterns: ['actually/atualmente', 'pretend/pretender'], description: 'False cognates' },
    verbConjugation: { patterns: ['ser/estar', '-ar/-er/-ir'], description: 'Verb conjugation patterns' },
    pronunciation: { patterns: ['ão/am', 'nh/lh', 'r/rr'], description: 'Difficult sounds' },
    wordOrder: { patterns: ['adjective-noun'], description: 'Word order differences' }
};

export const ProficiencyLevel = {
    A1: { level: 1, name: 'Beginner', vocabularyTarget: 500 },
    A2: { level: 2, name: 'Elementary', vocabularyTarget: 1000 },
    B1: { level: 3, name: 'Intermediate', vocabularyTarget: 2000 },
    B2: { level: 4, name: 'Upper Intermediate', vocabularyTarget: 4000 },
    C1: { level: 5, name: 'Advanced', vocabularyTarget: 8000 },
    C2: { level: 6, name: 'Mastery', vocabularyTarget: 16000 }
};

export class LearnerProfiler {
    constructor(userId) {
        this.userId = userId;
        this.profile = this.loadProfile();
        this.recentEvents = [];
        this.maxRecentEvents = 1000;
    }

    loadProfile() {
        const storageKey = `${this.userId}_learner_profile`;
        try {
            const saved = localStorage.getItem(storageKey);
            if (saved) return JSON.parse(saved);
        } catch (error) {
            Logger.warn('learner_profiler', 'Failed to load profile', { error: error.message });
        }
        return this.createDefaultProfile();
    }

    createDefaultProfile() {
        return {
            userId: this.userId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            currentLevel: 'A1',
            estimatedVocabulary: 0,
            learningPatterns: { bestHours: [], worstHours: [], averageSessionLength: 0, preferredLessonTypes: [], averageResponseTime: 0 },
            weaknesses: { confusionPairs: [], difficultCategories: [], pronunciationIssues: [], grammarGaps: [] },
            strengths: { masteredCategories: [], strongPhonemes: [], fastRecallWords: [] },
            metrics: { totalSessions: 0, totalTime: 0, wordsLearned: 0, wordsMastered: 0, averageAccuracy: 0, currentStreak: 0, longestStreak: 0, lastSessionDate: null },
            comprehensibleInput: { knownWords: [], targetWords: [], tooHardWords: [] },
            hourlyPerformance: Array(24).fill(null).map(() => ({ attempts: 0, correct: 0, accuracy: 0 })),
            dailyPerformance: []
        };
    }

    saveProfile() {
        this.profile.updatedAt = new Date().toISOString();
        const storageKey = `${this.userId}_learner_profile`;
        try {
            localStorage.setItem(storageKey, JSON.stringify(this.profile));
        } catch (error) {
            Logger.error('learner_profiler', 'Failed to save profile', { error: error.message });
        }
    }

    processEvent(event) {
        this.recentEvents.push({ ...event, processedAt: Date.now() });
        if (this.recentEvents.length > this.maxRecentEvents) {
            this.recentEvents = this.recentEvents.slice(-this.maxRecentEvents);
        }

        switch (event.eventType) {
            case 'answer_correct':
            case 'answer_incorrect':
                this.processAnswerEvent(event);
                break;
            case 'pronunciation_score':
                this.processPronunciationEvent(event);
                break;
            case 'lesson_complete':
                this.processLessonComplete(event);
                break;
            case 'session_start':
                this.processSessionStart(event);
                break;
            default:
                Logger.debug('learner_profiler', 'Unknown event type', { eventType: event.eventType });
        }

        this.updateHourlyPerformance(event);
        if (this.recentEvents.length % 10 === 0) this.saveProfile();
    }

    processAnswerEvent(event) {
        const isCorrect = event.eventType === 'answer_correct';
        const metrics = this.profile.metrics;
        const total = metrics.wordsLearned || 1;
        metrics.averageAccuracy = (metrics.averageAccuracy * (total - 1) + (isCorrect ? 100 : 0)) / total;

        if (event.responseTime) {
            const avgTime = this.profile.learningPatterns.averageResponseTime || 0;
            this.profile.learningPatterns.averageResponseTime = (avgTime * (total - 1) + event.responseTime) / total;
        }

        if (!isCorrect && event.userAnswer && event.correctAnswer) {
            this.trackConfusionPair(event.wordId, event.userAnswer, event.correctAnswer);
        }

        this.updateWordKnowledge(event.wordId);
        if (this.recentEvents.length % 20 === 0) this.analyzePatterns();
    }

    processPronunciationEvent(event) {
        const { wordId, score, phonemes } = event;
        if (phonemes && Array.isArray(phonemes)) {
            for (const phoneme of phonemes) {
                if (phoneme.score < 70) this.trackPronunciationIssue(phoneme.symbol, phoneme.score);
                else if (phoneme.score > 90) this.trackStrongPhoneme(phoneme.symbol);
            }
        }
        if (score < 60) this.addToWeakness('pronunciation', wordId);
    }

    processLessonComplete(event) {
        const { score, duration, category } = event;
        this.profile.metrics.totalSessions++;
        this.profile.metrics.totalTime += (duration || 0) / 60000;
        if (score < 70 && category) this.addToDifficultCategory(category, score);
        else if (score > 90 && category) this.addToMasteredCategory(category);
    }

    processSessionStart(event) {
        this.profile.metrics.lastSessionDate = new Date(event.timestamp).toISOString();
        const lastSession = this.profile.metrics.lastSessionDate;
        if (lastSession) {
            const daysSince = this.daysBetween(new Date(lastSession), new Date());
            if (daysSince <= 1) {
                this.profile.metrics.currentStreak++;
                if (this.profile.metrics.currentStreak > this.profile.metrics.longestStreak) {
                    this.profile.metrics.longestStreak = this.profile.metrics.currentStreak;
                }
            } else {
                this.profile.metrics.currentStreak = 1;
            }
        } else {
            this.profile.metrics.currentStreak = 1;
        }
    }

    updateHourlyPerformance(event) {
        if (!['answer_correct', 'answer_incorrect'].includes(event.eventType)) return;
        const hour = new Date(event.timestamp).getHours();
        const hourData = this.profile.hourlyPerformance[hour];
        hourData.attempts++;
        if (event.eventType === 'answer_correct') hourData.correct++;
        hourData.accuracy = (hourData.correct / hourData.attempts) * 100;
        this.calculateBestWorstHours();
    }

    calculateBestWorstHours() {
        const hourlyData = this.profile.hourlyPerformance.map((data, hour) => ({ hour, ...data })).filter(d => d.attempts >= 10);
        if (hourlyData.length < 3) return;
        hourlyData.sort((a, b) => b.accuracy - a.accuracy);
        this.profile.learningPatterns.bestHours = hourlyData.slice(0, 3).map(d => d.hour);
        this.profile.learningPatterns.worstHours = hourlyData.slice(-3).map(d => d.hour);
    }

    trackConfusionPair(wordId, userAnswer, correctAnswer) {
        const pairs = this.profile.weaknesses.confusionPairs;
        const user = userAnswer.toLowerCase().trim();
        const existing = pairs.find(p => (p.word1 === wordId && p.word2 === user) || (p.word1 === user && p.word2 === wordId));
        if (existing) { existing.errorCount++; existing.lastError = Date.now(); }
        else { pairs.push({ word1: wordId, word2: user, correctAnswer: correctAnswer.toLowerCase().trim(), errorCount: 1, lastError: Date.now() }); }
        if (pairs.length > 50) {
            pairs.sort((a, b) => b.errorCount - a.errorCount);
            this.profile.weaknesses.confusionPairs = pairs.slice(0, 50);
        }
    }

    trackPronunciationIssue(phoneme, score) {
        const issues = this.profile.weaknesses.pronunciationIssues;
        const existing = issues.find(i => i.phoneme === phoneme);
        if (existing) { existing.count++; existing.averageScore = (existing.averageScore * (existing.count - 1) + score) / existing.count; }
        else { issues.push({ phoneme, count: 1, averageScore: score, pattern: this.findPronunciationPattern(phoneme) }); }
    }

    trackStrongPhoneme(phoneme) {
        const strengths = this.profile.strengths.strongPhonemes;
        if (!strengths.includes(phoneme)) strengths.push(phoneme);
    }

    findPronunciationPattern(phoneme) {
        for (const [, pattern] of Object.entries(PORTUGUESE_CONFUSION_PATTERNS.pronunciation.patterns)) {
            if (pattern.includes(phoneme)) return pattern;
        }
        return null;
    }

    updateWordKnowledge(wordId) {
        const ci = this.profile.comprehensibleInput;
        const recentAttempts = this.recentEvents.filter(e => e.wordId === wordId && ['answer_correct', 'answer_incorrect'].includes(e.eventType)).slice(-5);
        if (recentAttempts.length < 3) return;
        const correctCount = recentAttempts.filter(e => e.eventType === 'answer_correct').length;
        const accuracy = correctCount / recentAttempts.length;
        ci.knownWords = ci.knownWords.filter(w => w !== wordId);
        ci.targetWords = ci.targetWords.filter(w => w !== wordId);
        ci.tooHardWords = ci.tooHardWords.filter(w => w !== wordId);
        if (accuracy >= 0.9) ci.knownWords.push(wordId);
        else if (accuracy >= 0.5) ci.targetWords.push(wordId);
        else ci.tooHardWords.push(wordId);
    }

    addToWeakness(type, item) {
        void type; void item; // Placeholder for future implementation
    }

    addToDifficultCategory(category, score) {
        const difficulties = this.profile.weaknesses.difficultCategories;
        const existing = difficulties.find(d => d.category === category);
        if (existing) { existing.attempts++; existing.averageScore = (existing.averageScore * (existing.attempts - 1) + score) / existing.attempts; }
        else { difficulties.push({ category, attempts: 1, averageScore: score }); }
    }

    addToMasteredCategory(category) {
        const mastered = this.profile.strengths.masteredCategories;
        if (!mastered.includes(category)) mastered.push(category);
    }

    analyzePatterns() {
        this.detectRepeatedFailures();
        this.detectSpeedPatterns();
        this.updateEstimatedVocabulary();
        this.assessLevel();
    }

    detectRepeatedFailures() {
        const failures = this.recentEvents.filter(e => e.eventType === 'answer_incorrect').reduce((acc, e) => { acc[e.wordId] = (acc[e.wordId] || 0) + 1; return acc; }, {});
        const problematicWords = Object.entries(failures).filter(([, count]) => count >= 3).map(([wordId, count]) => ({ wordId, failureCount: count }));
        if (problematicWords.length > 0) Logger.info('learner_profiler', 'Detected problematic words', { words: problematicWords });
        return problematicWords;
    }

    detectSpeedPatterns() {
        const withTime = this.recentEvents.filter(e => e.responseTime && e.eventType === 'answer_correct');
        if (withTime.length < 10) return;
        const avgTime = withTime.reduce((sum, e) => sum + e.responseTime, 0) / withTime.length;
        const fastRecalls = withTime.filter(e => e.responseTime < avgTime * 0.5).map(e => e.wordId);
        this.profile.strengths.fastRecallWords = [...new Set(fastRecalls)].slice(0, 100);
    }

    updateEstimatedVocabulary() {
        const knownWords = this.profile.comprehensibleInput.knownWords;
        this.profile.estimatedVocabulary = knownWords.length;
        this.profile.metrics.wordsLearned = knownWords.length;
        this.profile.metrics.wordsMastered = this.profile.strengths.fastRecallWords.length;
    }

    assessLevel() {
        const vocabulary = this.profile.estimatedVocabulary;
        let newLevel = 'A1';
        for (const [level, data] of Object.entries(ProficiencyLevel)) {
            if (vocabulary >= data.vocabularyTarget * 0.8) newLevel = level;
        }
        if (this.profile.metrics.averageAccuracy < 60 && newLevel !== 'A1') {
            const currentIndex = Object.keys(ProficiencyLevel).indexOf(newLevel);
            if (currentIndex > 0) newLevel = Object.keys(ProficiencyLevel)[currentIndex - 1];
        }
        this.profile.currentLevel = newLevel;
    }

    getNextWordsToLearn(count = 10) {
        const target = this.profile.comprehensibleInput.targetWords.slice(0, count);
        return { targetWords: target, needsGeneration: target.length < count, knownWordCount: this.profile.comprehensibleInput.knownWords.length };
    }

    getRecommendations() {
        const recommendations = [];
        const currentHour = new Date().getHours();
        const { bestHours, worstHours } = this.profile.learningPatterns;
        if (worstHours.includes(currentHour)) {
            recommendations.push({ type: 'timing', priority: 'medium', message: `Better performance at ${bestHours.join(', ')}h` });
        }
        const confusionPairs = this.profile.weaknesses.confusionPairs.sort((a, b) => b.errorCount - a.errorCount).slice(0, 3);
        if (confusionPairs.length > 0) {
            recommendations.push({ type: 'weakness', priority: 'high', message: 'Focus on confused words', data: confusionPairs.map(p => `${p.word1} vs ${p.word2}`) });
        }
        if (this.profile.metrics.currentStreak >= 7) {
            recommendations.push({ type: 'motivation', priority: 'low', message: `${this.profile.metrics.currentStreak}-day streak!` });
        }
        return recommendations;
    }

    getSummaryForAI() {
        return {
            userId: this.userId,
            level: this.profile.currentLevel,
            vocabularySize: this.profile.estimatedVocabulary,
            accuracy: Math.round(this.profile.metrics.averageAccuracy),
            streak: this.profile.metrics.currentStreak,
            topWeaknesses: this.profile.weaknesses.confusionPairs.slice(0, 5),
            pronunciationIssues: this.profile.weaknesses.pronunciationIssues.slice(0, 5),
            bestLearningHours: this.profile.learningPatterns.bestHours,
            recommendedWords: this.getNextWordsToLearn(5).targetWords
        };
    }

    daysBetween(date1, date2) {
        return Math.floor(Math.abs(new Date(date2).getTime() - new Date(date1).getTime()) / (1000 * 60 * 60 * 24));
    }
}

export function createLearnerProfiler(userId) { return new LearnerProfiler(userId); }
export default LearnerProfiler;
