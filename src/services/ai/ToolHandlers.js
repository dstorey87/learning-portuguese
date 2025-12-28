/**
 * ToolHandlers - Connect AI Tools to Actual Services
 * 
 * Wires each tool in ToolRegistry to real service implementations
 */

import { getToolRegistry } from './ToolRegistry.js';
import { fsrs, Rating, State } from '../learning/FSRSEngine.js';
import * as Logger from '../Logger.js';
import * as ProgressTracker from '../ProgressTracker.js';
import * as TTSService from '../TTSService.js';
import * as VoiceService from '../VoiceService.js';
import { eventStream } from '../eventStreaming.js';
import LearnerProfiler from '../learning/LearnerProfiler.js';

// Custom lesson storage key prefix
const CUSTOM_LESSONS_KEY = 'ai_custom_lessons';

/**
 * Initialize all tool handlers
 */
export function initializeToolHandlers() {
    const registry = getToolRegistry();
    
    // ========================================================================
    // GET_DUE_WORDS - Spaced repetition due cards
    // ========================================================================
    registry.setHandler('get_due_words', async ({ limit = 10, category, includeNew = true }) => {
        try {
            const learned = ProgressTracker.getLearnedWords();
            
            // Convert to FSRS cards
            const cards = learned.map(word => {
                const existing = word.fsrsCard || fsrs.createCard(word.key);
                return { ...existing, wordData: word };
            });
            
            // Get due cards
            let dueCards = fsrs.getDueCards(cards, limit);
            
            // Filter by category if specified
            if (category) {
                dueCards = dueCards.filter(card => 
                    card.wordData?.category?.toLowerCase().includes(category.toLowerCase())
                );
            }
            
            // Include new words if requested
            if (includeNew && dueCards.length < limit) {
                const newCount = limit - dueCards.length;
                const newWords = learned
                    .filter(w => !w.fsrsCard || w.fsrsCard.state === State.New)
                    .slice(0, newCount);
                dueCards = [...dueCards, ...newWords.map(w => ({ 
                    wordData: w, 
                    state: State.New,
                    isNew: true 
                }))];
            }
            
            Logger.info('tool_handlers', 'Got due words', { count: dueCards.length });
            
            return {
                dueCount: dueCards.length,
                words: dueCards.map(card => ({
                    wordId: card.wordData?.key || card.wordId,
                    portuguese: card.wordData?.pt,
                    english: card.wordData?.en,
                    state: card.state,
                    dueDate: card.due,
                    stability: card.stability,
                    isNew: card.isNew || card.state === State.New
                }))
            };
        } catch (error) {
            Logger.error('tool_handlers', 'get_due_words failed', { error: error.message });
            return { error: error.message, dueCount: 0, words: [] };
        }
    });
    
    // ========================================================================
    // RECORD_ANSWER - Update SRS and emit learning event
    // ========================================================================
    registry.setHandler('record_answer', async ({ wordId, rating, responseTime, userAnswer }) => {
        try {
            // Get existing card or create new one
            const word = ProgressTracker.getWordByKey(wordId);
            let card = word?.fsrsCard || fsrs.createCard(wordId);
            
            // Schedule with FSRS
            const fsrsRating = [Rating.Again, Rating.Again, Rating.Hard, Rating.Good, Rating.Easy][rating] || Rating.Good;
            const result = fsrs.schedule(card, fsrsRating);
            
            // Update word SRS data
            ProgressTracker.updateWordSRS(wordId, {
                fsrsCard: result,
                lastReview: new Date().toISOString(),
                nextReview: result.due?.toISOString()
            });
            
            // Emit learning event
            eventStream.trackWordAttempt(wordId, rating >= 3, responseTime, userAnswer);
            
            // Track in event stream for AI pipeline
            eventStream.track('answer_recorded', {
                wordId,
                rating,
                responseTime,
                isCorrect: rating >= 3,
                nextReviewDays: result.scheduledDays
            });
            
            Logger.info('tool_handlers', 'Recorded answer', { wordId, rating, nextDays: result.scheduledDays });
            
            return {
                success: true,
                wordId,
                newState: result.state,
                nextReviewDays: result.scheduledDays,
                stability: result.stability,
                message: rating >= 3 ? 'Great job!' : 'Keep practicing!'
            };
        } catch (error) {
            Logger.error('tool_handlers', 'record_answer failed', { error: error.message });
            return { success: false, error: error.message };
        }
    });
    
    // ========================================================================
    // SPEAK_PORTUGUESE - Text-to-speech
    // ========================================================================
    registry.setHandler('speak_portuguese', async ({ text, voice = 'duarte', speed = 1.0 }) => {
        try {
            const voiceId = voice === 'raquel' ? 'pt-PT-RaquelNeural' : 'pt-PT-DuarteNeural';

            // Prefer TTSService (handles server health + Web Speech fallback internally)
            await TTSService.speak(text, {
                voice: voiceId,
                rate: speed,
                fallbackToWebSpeech: true
            });
            
            Logger.info('tool_handlers', 'Spoke Portuguese', { text: text.substring(0, 30), voice });
            
            return { success: true, text, voice: voiceId, speed };
        } catch (error) {
            Logger.error('tool_handlers', 'speak_portuguese failed', { error: error.message });
            return { success: false, error: error.message };
        }
    });
    
    // ========================================================================
    // GET_PRONUNCIATION_GUIDE - IPA and tips
    // ========================================================================
    registry.setHandler('get_pronunciation_guide', async ({ text, includeAudio = false }) => {
        try {
            // Common Portuguese pronunciation patterns
            const guides = {
                'ão': { ipa: '/ɐ̃w̃/', tip: 'Nasalized "ow" - like "now" but through your nose' },
                'ões': { ipa: '/õjʃ/', tip: 'Nasalized "oynsh"' },
                'lh': { ipa: '/ʎ/', tip: 'Like "lli" in "million"' },
                'nh': { ipa: '/ɲ/', tip: 'Like "ny" in "canyon"' },
                'rr': { ipa: '/ʁ/', tip: 'Uvular trill - back of throat' },
                'r': { ipa: '/ɾ/', tip: 'Single tap like Spanish "r"' },
                'ç': { ipa: '/s/', tip: 'Always "s" sound' },
                'x': { ipa: '/ʃ/', tip: 'Usually "sh" sound' },
                'ch': { ipa: '/ʃ/', tip: '"sh" sound' },
                'ge': { ipa: '/ʒ/', tip: 'Like "s" in "measure"' },
                'gi': { ipa: '/ʒi/', tip: 'Like "zi"' }
            };
            
            // Find applicable guides
            const applicable = [];
            const lowerText = text.toLowerCase();
            for (const [pattern, guide] of Object.entries(guides)) {
                if (lowerText.includes(pattern)) {
                    applicable.push({ pattern, ...guide });
                }
            }
            
            // Speak if requested
            if (includeAudio) {
                await registry.execute('speak_portuguese', { text, speed: 0.8 });
            }
            
            return {
                text,
                guides: applicable,
                generalTip: 'European Portuguese is more closed and nasal than Brazilian Portuguese. Unstressed vowels are often reduced or silent.'
            };
        } catch (error) {
            Logger.error('tool_handlers', 'get_pronunciation_guide failed', { error: error.message });
            return { error: error.message };
        }
    });
    
    // ========================================================================
    // ANALYZE_PRONUNCIATION - Compare user attempt to expected
    // ========================================================================
    registry.setHandler('analyze_pronunciation', async ({ expectedText, userTranscript }) => {
        try {
            const expected = expectedText.toLowerCase().trim();
            const transcript = userTranscript.toLowerCase().trim();
            
            // Simple word-by-word comparison
            const expectedWords = expected.split(/\s+/);
            const transcriptWords = transcript.split(/\s+/);
            
            const matched = [];
            const missed = [];
            
            for (const word of expectedWords) {
                if (transcriptWords.includes(word) || 
                    transcriptWords.some(t => t.includes(word) || word.includes(t))) {
                    matched.push(word);
                } else {
                    missed.push(word);
                }
            }
            
            const score = Math.round((matched.length / expectedWords.length) * 100);
            
            let feedback = '';
            if (score >= 90) feedback = 'Excellent pronunciation! You sound very natural.';
            else if (score >= 70) feedback = 'Good effort! A few words need practice.';
            else if (score >= 50) feedback = 'Keep practicing! Focus on the missed words.';
            else feedback = 'Let\'s work on this together. Try speaking more slowly.';
            
            // Track pronunciation attempt
            eventStream.track('pronunciation_analyzed', {
                expected: expectedText,
                transcript: userTranscript,
                score,
                matchedCount: matched.length,
                missedCount: missed.length
            });
            
            return {
                score,
                rating: score >= 90 ? 'excellent' : score >= 70 ? 'good' : score >= 50 ? 'fair' : 'needs_practice',
                matched,
                missed,
                feedback,
                suggestions: missed.length > 0 ? missed.map(w => `Practice: "${w}"`) : []
            };
        } catch (error) {
            Logger.error('tool_handlers', 'analyze_pronunciation failed', { error: error.message });
            return { error: error.message, score: 0 };
        }
    });
    
    // ========================================================================
    // SEARCH_PORTUGUESE - Whitelisted resource search
    // ========================================================================
    registry.setHandler('search_portuguese', async ({ query, sources = ['priberam', 'infopedia'] }) => {
        try {
            // Import WebSearchTool dynamically to avoid circular deps
            const { getWebSearch } = await import('./WebSearchTool.js');
            const webSearch = getWebSearch();
            
            const result = await webSearch.search(query, sources);
            
            Logger.info('tool_handlers', 'Searched Portuguese', { query, sources });
            
            return result;
        } catch (error) {
            Logger.error('tool_handlers', 'search_portuguese failed', { error: error.message });
            return { success: false, error: error.message, results: [] };
        }
    });
    
    // ========================================================================
    // GET_LESSON_CONTEXT - Current lesson info
    // ========================================================================
    registry.setHandler('get_lesson_context', async ({ lessonId, includeProgress = true }) => {
        try {
            // Get from global window state or ProgressTracker
            const currentLesson = window.currentLesson || null;
            const lesson = lessonId ? 
                ProgressTracker.getCompletedLessons().find(l => l.id === lessonId) :
                currentLesson;
            
            let progress = null;
            if (includeProgress && lesson) {
                const completed = ProgressTracker.isLessonCompleted(lesson.id);
                const history = ProgressTracker.getLessonHistory(lesson.id);
                progress = {
                    completed,
                    attempts: history?.length || 0,
                    bestScore: history?.reduce((max, h) => Math.max(max, h.score || 0), 0) || 0,
                    lastAttempt: history?.[history.length - 1]?.timestamp
                };
            }
            
            return {
                lesson: lesson ? {
                    id: lesson.id,
                    title: lesson.title,
                    topic: lesson.topic,
                    wordCount: lesson.words?.length || 0,
                    words: lesson.words?.slice(0, 10).map(w => ({ pt: w.pt, en: w.en }))
                } : null,
                progress,
                isActive: !!currentLesson
            };
        } catch (error) {
            Logger.error('tool_handlers', 'get_lesson_context failed', { error: error.message });
            return { lesson: null, progress: null, error: error.message };
        }
    });
    
    // ========================================================================
    // GET_LEARNER_WEAKNESSES - Analyze learner profile for weak areas
    // ========================================================================
    registry.setHandler('get_learner_weaknesses', async ({ 
        includeConfusionPairs = true, 
        includePronunciationIssues = true, 
        includeSRSDue = true, 
        limit = 10 
    }) => {
        try {
            const userId = localStorage.getItem('currentUserId') || 'default';
            const profiler = new LearnerProfiler(userId);
            const summary = profiler.getSummaryForAI();
            
            const weaknesses = {
                userId,
                level: summary.level,
                accuracy: summary.accuracy,
                vocabularySize: summary.vocabularySize
            };
            
            // Confusion pairs - words the user mixes up
            if (includeConfusionPairs) {
                weaknesses.confusionPairs = summary.topWeaknesses?.slice(0, limit) || [];
            }
            
            // Pronunciation issues
            if (includePronunciationIssues) {
                const phonemeWeaknesses = ProgressTracker.getPhonemeWeaknesses(1)?.slice(0, limit) || [];
                const wordsNeedingPractice = ProgressTracker.getWordsNeedingPronunciationPractice(70)?.slice(0, limit) || [];
                
                weaknesses.pronunciationIssues = {
                    weakPhonemes: phonemeWeaknesses.map(p => ({
                        phoneme: p.phoneme,
                        errorCount: p.count,
                        exampleWords: p.words?.slice(0, 3) || [],
                        tips: p.tips
                    })),
                    wordsNeedingPractice: wordsNeedingPractice.map(w => ({
                        word: w.wordKey,
                        averageScore: w.averageScore,
                        attempts: w.attempts
                    }))
                };
            }
            
            // SRS due words
            if (includeSRSDue) {
                const dueResult = await registry.execute('get_due_words', { limit, includeNew: false });
                weaknesses.dueWords = dueResult.result?.words || [];
            }
            
            // Recommended words to learn next
            weaknesses.recommendedWords = summary.recommendedWords || [];
            weaknesses.bestLearningHours = summary.bestLearningHours || [];
            
            Logger.info('tool_handlers', 'Got learner weaknesses', { 
                userId, 
                confusionPairs: weaknesses.confusionPairs?.length,
                weakPhonemes: weaknesses.pronunciationIssues?.weakPhonemes?.length
            });
            
            return weaknesses;
        } catch (error) {
            Logger.error('tool_handlers', 'get_learner_weaknesses failed', { error: error.message });
            return { error: error.message };
        }
    });
    
    // ========================================================================
    // CREATE_CUSTOM_LESSON - Generate a personalized lesson
    // ========================================================================
    registry.setHandler('create_custom_lesson', async ({ 
        title, 
        description = '', 
        focusArea = 'mixed', 
        words = [], 
        challenges = [], 
        targetPhonemes = [], 
        difficulty = 'beginner' 
    }) => {
        try {
            if (!title || words.length === 0) {
                return { success: false, error: 'Title and at least one word are required' };
            }
            
            const userId = localStorage.getItem('currentUserId') || 'default';
            const lessonId = `ai_lesson_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            // Build lesson structure matching existing lesson format
            const lesson = {
                id: lessonId,
                title,
                description: description || `AI-generated ${focusArea} practice lesson`,
                topic: `AI: ${focusArea.charAt(0).toUpperCase() + focusArea.slice(1)}`,
                tier: 4, // Custom AI lessons
                isAIGenerated: true,
                createdAt: new Date().toISOString(),
                createdBy: 'AI Assistant',
                focusArea,
                difficulty,
                targetPhonemes,
                words: words.map((w, idx) => ({
                    id: `${lessonId}_word_${idx}`,
                    pt: w.pt,
                    en: w.en,
                    ipa: w.ipa || '',
                    tip: w.tip || '',
                    category: w.category || 'vocabulary',
                    examples: w.examples || [],
                    isFromAI: true
                })),
                challenges: challenges.map((c, idx) => ({
                    id: `${lessonId}_challenge_${idx}`,
                    ...c
                })),
                metadata: {
                    wordCount: words.length,
                    challengeCount: challenges.length,
                    estimatedMinutes: Math.max(5, words.length * 2 + challenges.length * 1)
                }
            };
            
            // Store in localStorage
            const storageKey = `${CUSTOM_LESSONS_KEY}_${userId}`;
            const existingLessons = JSON.parse(localStorage.getItem(storageKey) || '[]');
            existingLessons.push(lesson);
            localStorage.setItem(storageKey, JSON.stringify(existingLessons));
            
            // Emit event for UI update
            eventStream.track('custom_lesson_created', {
                lessonId,
                title,
                wordCount: words.length,
                focusArea,
                difficulty
            });
            
            // Dispatch custom event for app.js to pick up
            window.dispatchEvent(new CustomEvent('ai-lesson-created', { 
                detail: { lesson } 
            }));
            
            Logger.info('tool_handlers', 'Created custom lesson', { 
                lessonId, 
                title, 
                wordCount: words.length 
            });
            
            return {
                success: true,
                lesson: {
                    id: lessonId,
                    title,
                    description: lesson.description,
                    wordCount: words.length,
                    challengeCount: challenges.length,
                    focusArea,
                    difficulty,
                    estimatedMinutes: lesson.metadata.estimatedMinutes
                },
                message: `Created "${title}" with ${words.length} words. The lesson is now available in your lesson list.`
            };
        } catch (error) {
            Logger.error('tool_handlers', 'create_custom_lesson failed', { error: error.message });
            return { success: false, error: error.message };
        }
    });
    
    // ========================================================================
    // GET_CUSTOM_LESSONS - Retrieve all AI-generated lessons
    // ========================================================================
    registry.setHandler('get_custom_lessons', async ({ includeCompleted = true }) => {
        try {
            const userId = localStorage.getItem('currentUserId') || 'default';
            const storageKey = `${CUSTOM_LESSONS_KEY}_${userId}`;
            const lessons = JSON.parse(localStorage.getItem(storageKey) || '[]');
            
            let result = lessons;
            
            if (!includeCompleted) {
                const completedIds = ProgressTracker.getCompletedLessons().map(l => l.id);
                result = lessons.filter(l => !completedIds.includes(l.id));
            }
            
            return {
                count: result.length,
                lessons: result.map(l => ({
                    id: l.id,
                    title: l.title,
                    description: l.description,
                    focusArea: l.focusArea,
                    difficulty: l.difficulty,
                    wordCount: l.words?.length || 0,
                    challengeCount: l.challenges?.length || 0,
                    createdAt: l.createdAt,
                    isCompleted: ProgressTracker.isLessonCompleted(l.id)
                }))
            };
        } catch (error) {
            Logger.error('tool_handlers', 'get_custom_lessons failed', { error: error.message });
            return { count: 0, lessons: [], error: error.message };
        }
    });
    
    // ========================================================================
    // DELETE_CUSTOM_LESSON - Remove a custom lesson
    // ========================================================================
    registry.setHandler('delete_custom_lesson', async ({ lessonId }) => {
        try {
            if (!lessonId) {
                return { success: false, error: 'Lesson ID is required' };
            }
            
            const userId = localStorage.getItem('currentUserId') || 'default';
            const storageKey = `${CUSTOM_LESSONS_KEY}_${userId}`;
            const lessons = JSON.parse(localStorage.getItem(storageKey) || '[]');
            
            const index = lessons.findIndex(l => l.id === lessonId);
            if (index === -1) {
                return { success: false, error: 'Lesson not found' };
            }
            
            const deletedLesson = lessons.splice(index, 1)[0];
            localStorage.setItem(storageKey, JSON.stringify(lessons));
            
            // Emit event for UI update
            eventStream.track('custom_lesson_deleted', { lessonId });
            
            // Dispatch custom event for app.js to pick up
            window.dispatchEvent(new CustomEvent('ai-lesson-deleted', { 
                detail: { lessonId } 
            }));
            
            Logger.info('tool_handlers', 'Deleted custom lesson', { lessonId });
            
            return {
                success: true,
                deletedLesson: {
                    id: deletedLesson.id,
                    title: deletedLesson.title
                },
                message: `Deleted lesson "${deletedLesson.title}"`
            };
        } catch (error) {
            Logger.error('tool_handlers', 'delete_custom_lesson failed', { error: error.message });
            return { success: false, error: error.message };
        }
    });
    
    Logger.info('tool_handlers', 'All tool handlers initialized');
    return registry;
}

// Auto-initialize on import
let initialized = false;
export function ensureToolHandlersInitialized() {
    if (!initialized) {
        initializeToolHandlers();
        initialized = true;
    }
}
