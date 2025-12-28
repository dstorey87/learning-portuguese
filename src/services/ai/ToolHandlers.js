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
import * as StuckWordsService from '../learning/StuckWordsService.js';

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
    // CREATE_CUSTOM_LESSON - Generate a full, high-quality lesson
    // ========================================================================
    /**
     * Creates a complete lesson with:
     * - Words with pt, en, pronunciation, IPA, grammarNotes, culturalNote, aiTip, examples
     * - Sentences for practice
     * - Multiple challenge types (multiple-choice, translate, fill-blank)
     * - Quick reference cards
     * 
     * Naming convention: AI-XXX-topic-kebab-case (e.g., AI-001-basic-greetings)
     */
    registry.setHandler('create_custom_lesson', async ({ 
        title, 
        description = '', 
        topic = 'vocabulary',
        focusArea = 'mixed', 
        words = [], 
        sentences = [],
        challenges = [], 
        targetPhonemes = [], 
        difficulty = 'beginner',
        quickReference = null
    }) => {
        try {
            // Validation - require proper word structure
            if (!title) {
                return { success: false, error: 'Title is required' };
            }
            if (!words || words.length === 0) {
                return { success: false, error: 'At least one word is required. Each word needs: pt (Portuguese), en (English), and preferably pronunciation, ipa, examples, grammarNotes, culturalNote, and aiTip' };
            }
            
            // Validate word quality
            const wordErrors = [];
            words.forEach((w, idx) => {
                if (!w.pt) wordErrors.push(`Word ${idx + 1}: missing Portuguese (pt)`);
                if (!w.en) wordErrors.push(`Word ${idx + 1}: missing English (en)`);
            });
            if (wordErrors.length > 0) {
                return { success: false, error: `Invalid words: ${wordErrors.join('; ')}` };
            }
            
            const userId = localStorage.getItem('currentUserId') || 'default';
            
            // Generate standardized lesson ID: AI-XXX-topic-kebab-case
            const existingLessons = JSON.parse(localStorage.getItem(`${CUSTOM_LESSONS_KEY}_${userId}`) || '[]');
            const nextNum = String(existingLessons.length + 1).padStart(3, '0');
            const topicSlug = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
            const lessonId = `AI-${nextNum}-${topicSlug}`;
            
            // Build comprehensive word structure matching standard lessons
            const processedWords = words.map((w, idx) => ({
                id: `${lessonId}_word_${idx}`,
                pt: w.pt,
                en: w.en,
                audio: w.audio || w.pt.toLowerCase().replace(/[^a-záàâãéêíóôõúç]/gi, ''),
                pronunciation: w.pronunciation || '',
                ipa: w.ipa || '',
                type: w.type || 'vocabulary',
                grammarNotes: w.grammarNotes || w.notes || '',
                culturalNote: w.culturalNote || '',
                aiTip: w.aiTip || w.tip || '',
                examples: (w.examples || []).map(ex => ({
                    pt: typeof ex === 'string' ? ex : ex.pt,
                    en: typeof ex === 'string' ? '' : ex.en
                })),
                isFromAI: true
            }));
            
            // Build sentences if not provided - generate from word examples
            let processedSentences = sentences || [];
            if (processedSentences.length === 0) {
                // Extract sentences from word examples
                processedWords.forEach(w => {
                    if (w.examples && w.examples.length > 0) {
                        w.examples.forEach(ex => {
                            if (ex.pt && ex.en) {
                                processedSentences.push({ pt: ex.pt, en: ex.en });
                            }
                        });
                    }
                });
            }
            
            // Build challenges - auto-generate if not provided
            let processedChallenges = challenges || [];
            if (processedChallenges.length === 0 && processedWords.length >= 2) {
                // Auto-generate basic challenges
                processedChallenges = [];
                
                // Multiple choice for each word (up to 4)
                processedWords.slice(0, 4).forEach((w, idx) => {
                    const otherWords = processedWords.filter((_, i) => i !== idx).slice(0, 3);
                    const options = [w.en, ...otherWords.map(ow => ow.en)].sort(() => Math.random() - 0.5);
                    processedChallenges.push({
                        id: `${lessonId}_mc_${idx}`,
                        type: 'multiple-choice',
                        question: `What does "${w.pt}" mean?`,
                        options: options,
                        correct: options.indexOf(w.en),
                        explanation: w.grammarNotes || `"${w.pt}" means "${w.en}" in Portuguese.`
                    });
                });
                
                // Translation challenge
                if (processedSentences.length > 0) {
                    const sent = processedSentences[0];
                    processedChallenges.push({
                        id: `${lessonId}_trans_0`,
                        type: 'translate',
                        prompt: sent.en,
                        answer: sent.pt,
                        hints: processedWords.slice(0, 3).map(w => `${w.pt} = ${w.en}`)
                    });
                }
                
                // Fill in the blank
                if (processedSentences.length > 1) {
                    const sent = processedSentences[1];
                    const wordInSent = processedWords.find(w => sent.pt.includes(w.pt));
                    if (wordInSent) {
                        const blankedSentence = sent.pt.replace(wordInSent.pt, '___');
                        const options = [wordInSent.pt, ...processedWords.filter(w => w.pt !== wordInSent.pt).slice(0, 2).map(w => w.pt)];
                        processedChallenges.push({
                            id: `${lessonId}_fill_0`,
                            type: 'fill-blank',
                            sentence: blankedSentence,
                            options: options.sort(() => Math.random() - 0.5),
                            correct: options.indexOf(wordInSent.pt),
                            explanation: `The correct word is "${wordInSent.pt}" (${wordInSent.en}).`
                        });
                    }
                }
            }
            
            // Build quick reference if not provided
            const processedQuickRef = quickReference || {
                words: processedWords.map(w => ({
                    word: w.pt,
                    meaning: w.en,
                    pronunciation: w.pronunciation || w.ipa
                }))
            };
            
            // Build complete lesson structure
            const lesson = {
                id: lessonId,
                title,
                description: description || `AI-generated lesson: ${title}. ${processedWords.length} words to master.`,
                topic: `AI: ${topic.charAt(0).toUpperCase() + topic.slice(1)}`,
                topicId: 'ai-generated',
                tier: 4,
                level: difficulty,
                isAIGenerated: true,
                createdAt: new Date().toISOString(),
                createdBy: 'AI Tutor',
                focusArea,
                difficulty,
                targetPhonemes,
                estimatedTime: `${Math.max(5, processedWords.length * 2 + processedChallenges.length)} min`,
                
                // Core content
                words: processedWords,
                sentences: processedSentences,
                challenges: processedChallenges,
                quickReference: processedQuickRef,
                
                // Metadata for UI
                metadata: {
                    wordCount: processedWords.length,
                    sentenceCount: processedSentences.length,
                    challengeCount: processedChallenges.length,
                    estimatedMinutes: Math.max(5, processedWords.length * 2 + processedChallenges.length),
                    hasGrammarNotes: processedWords.some(w => w.grammarNotes),
                    hasCulturalNotes: processedWords.some(w => w.culturalNote),
                    hasExamples: processedWords.some(w => w.examples?.length > 0)
                }
            };
            
            // Store in localStorage
            const storageKey = `${CUSTOM_LESSONS_KEY}_${userId}`;
            existingLessons.push(lesson);
            localStorage.setItem(storageKey, JSON.stringify(existingLessons));
            
            // Emit event for UI update
            eventStream.track('custom_lesson_created', {
                lessonId,
                title,
                wordCount: processedWords.length,
                challengeCount: processedChallenges.length,
                focusArea,
                difficulty
            });
            
            // Dispatch custom event for app.js to pick up
            window.dispatchEvent(new CustomEvent('ai-lesson-created', { 
                detail: { lesson } 
            }));
            
            Logger.info('tool_handlers', 'Created full AI lesson', { 
                lessonId, 
                title, 
                wordCount: processedWords.length,
                sentenceCount: processedSentences.length,
                challengeCount: processedChallenges.length
            });
            
            return {
                success: true,
                lesson: {
                    id: lessonId,
                    title,
                    description: lesson.description,
                    wordCount: processedWords.length,
                    sentenceCount: processedSentences.length,
                    challengeCount: processedChallenges.length,
                    focusArea,
                    difficulty,
                    estimatedMinutes: lesson.metadata.estimatedMinutes,
                    hasGrammarNotes: lesson.metadata.hasGrammarNotes,
                    hasCulturalNotes: lesson.metadata.hasCulturalNotes,
                    hasExamples: lesson.metadata.hasExamples
                },
                message: `✅ Created "${title}" (${lessonId}) with ${processedWords.length} words, ${processedSentences.length} sentences, and ${processedChallenges.length} challenges. The lesson is now available in your lesson list!`,
                nextStep: 'Use verify_custom_lesson to check the lesson quality, or navigate to the Learn page to try it.'
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

    // ==========================================================================
    // VERIFY_CUSTOM_LESSON - Check lesson quality and completeness
    // ==========================================================================
    registry.setHandler('verify_custom_lesson', async ({ lessonId }) => {
        try {
            if (!lessonId) {
                return { success: false, error: 'Lesson ID is required' };
            }
            
            const userId = localStorage.getItem('currentUserId') || 'default';
            const storageKey = `${CUSTOM_LESSONS_KEY}_${userId}`;
            const lessons = JSON.parse(localStorage.getItem(storageKey) || '[]');
            
            const lesson = lessons.find(l => l.id === lessonId);
            if (!lesson) {
                return { 
                    found: false, 
                    error: `Lesson "${lessonId}" not found. Check the lesson ID.` 
                };
            }
            
            // Quality checks
            const issues = [];
            const suggestions = [];
            let qualityScore = 100;
            
            // Word quality checks
            if (!lesson.words || lesson.words.length === 0) {
                issues.push('❌ No words in lesson');
                qualityScore -= 50;
            } else {
                if (lesson.words.length < 3) {
                    suggestions.push('⚠️ Consider adding more words (recommended: 5-8)');
                    qualityScore -= 10;
                }
                
                const wordsWithoutPronunciation = lesson.words.filter(w => !w.pronunciation && !w.ipa);
                if (wordsWithoutPronunciation.length > 0) {
                    suggestions.push(`⚠️ ${wordsWithoutPronunciation.length} word(s) missing pronunciation guide`);
                    qualityScore -= 5 * wordsWithoutPronunciation.length;
                }
                
                const wordsWithoutExamples = lesson.words.filter(w => !w.examples || w.examples.length === 0);
                if (wordsWithoutExamples.length > 0) {
                    suggestions.push(`⚠️ ${wordsWithoutExamples.length} word(s) missing example sentences`);
                    qualityScore -= 3 * wordsWithoutExamples.length;
                }
                
                const wordsWithoutGrammar = lesson.words.filter(w => !w.grammarNotes);
                if (wordsWithoutGrammar.length > lesson.words.length / 2) {
                    suggestions.push('💡 Consider adding grammar notes to more words');
                    qualityScore -= 5;
                }
                
                const wordsWithoutAiTip = lesson.words.filter(w => !w.aiTip);
                if (wordsWithoutAiTip.length > lesson.words.length / 2) {
                    suggestions.push('💡 Consider adding learning tips (aiTip) to more words');
                    qualityScore -= 5;
                }
            }
            
            // Challenge quality checks
            if (!lesson.challenges || lesson.challenges.length === 0) {
                suggestions.push('⚠️ No challenges/exercises. Learners need practice!');
                qualityScore -= 15;
            } else {
                if (lesson.challenges.length < 3) {
                    suggestions.push('💡 Add more challenges for better retention (recommended: 5+)');
                    qualityScore -= 5;
                }
                
                const challengeTypes = new Set(lesson.challenges.map(c => c.type));
                if (challengeTypes.size < 2) {
                    suggestions.push('💡 Mix challenge types (multiple-choice, translate, fill-blank)');
                    qualityScore -= 5;
                }
            }
            
            // Sentence checks
            if (!lesson.sentences || lesson.sentences.length === 0) {
                suggestions.push('💡 Add example sentences for context');
                qualityScore -= 5;
            }
            
            qualityScore = Math.max(0, qualityScore);
            
            const qualityRating = qualityScore >= 90 ? '⭐⭐⭐ Excellent' :
                                  qualityScore >= 70 ? '⭐⭐ Good' :
                                  qualityScore >= 50 ? '⭐ Needs improvement' :
                                  '❌ Poor quality';
            
            Logger.info('tool_handlers', 'Verified custom lesson', { 
                lessonId, 
                qualityScore,
                issueCount: issues.length,
                suggestionCount: suggestions.length
            });
            
            return {
                found: true,
                lesson: {
                    id: lesson.id,
                    title: lesson.title,
                    wordCount: lesson.words?.length || 0,
                    sentenceCount: lesson.sentences?.length || 0,
                    challengeCount: lesson.challenges?.length || 0
                },
                quality: {
                    score: qualityScore,
                    rating: qualityRating,
                    issues,
                    suggestions
                },
                summary: issues.length === 0 && suggestions.length <= 2 
                    ? `✅ "${lesson.title}" is ready! Quality: ${qualityRating}`
                    : `"${lesson.title}" needs attention. ${issues.length} issues, ${suggestions.length} suggestions. Quality: ${qualityRating}`
            };
        } catch (error) {
            Logger.error('tool_handlers', 'verify_custom_lesson failed', { error: error.message });
            return { found: false, error: error.message };
        }
    });

    // ==========================================================================
    // LOOKUP & NAVIGATION TOOLS
    // ==========================================================================

    /**
     * lookup_word - Search for a word in lesson data
     */
    registry.setHandler('lookup_word', async ({ word, includeRelated }) => {
        try {
            const { getAllLessons } = await import('../../data/LessonLoader.js');
            const allLessons = getAllLessons();
            const searchTerm = word.toLowerCase();
            
            const results = [];
            
            for (const lesson of allLessons) {
                if (!lesson.words) continue;
                
                for (const w of lesson.words) {
                    // Check Portuguese word
                    if (w.pt?.toLowerCase().includes(searchTerm) || 
                        w.en?.toLowerCase().includes(searchTerm)) {
                        results.push({
                            pt: w.pt,
                            en: w.en,
                            ipa: w.ipa || null,
                            partOfSpeech: w.partOfSpeech || null,
                            notes: w.notes || null,
                            examples: w.examples || [],
                            lessonId: lesson.id,
                            lessonTitle: lesson.title
                        });
                    }
                }
            }
            
            // Also check custom AI lessons
            const userId = localStorage.getItem('currentUserId') || 'guest';
            const customKey = `ai_custom_lessons_${userId}`;
            const customLessons = JSON.parse(localStorage.getItem(customKey) || '[]');
            
            for (const lesson of customLessons) {
                if (!lesson.words) continue;
                
                for (const w of lesson.words) {
                    if (w.pt?.toLowerCase().includes(searchTerm) || 
                        w.en?.toLowerCase().includes(searchTerm)) {
                        results.push({
                            pt: w.pt,
                            en: w.en,
                            ipa: w.ipa || null,
                            partOfSpeech: w.partOfSpeech || null,
                            notes: w.notes || null,
                            examples: w.examples || [],
                            lessonId: lesson.id,
                            lessonTitle: lesson.title,
                            isCustomLesson: true
                        });
                    }
                }
            }
            
            Logger.info('tool_handlers', 'lookup_word', { word, resultsCount: results.length });
            
            if (results.length === 0) {
                return {
                    found: false,
                    message: `No results found for "${word}". Try a different spelling or search term.`
                };
            }
            
            return {
                found: true,
                count: results.length,
                results: results.slice(0, 10), // Limit to 10 results
                message: `Found ${results.length} result(s) for "${word}"`
            };
        } catch (error) {
            Logger.error('tool_handlers', 'lookup_word failed', { error: error.message });
            return { found: false, error: error.message };
        }
    });

    /**
     * start_lesson - Navigate to start a specific lesson
     */
    registry.setHandler('start_lesson', async ({ lessonId }) => {
        try {
            const { getLessonById } = await import('../../data/LessonLoader.js');
            const lesson = getLessonById(lessonId);
            
            // Also check custom lessons
            if (!lesson) {
                const userId = localStorage.getItem('currentUserId') || 'guest';
                const customKey = `ai_custom_lessons_${userId}`;
                const customLessons = JSON.parse(localStorage.getItem(customKey) || '[]');
                const customLesson = customLessons.find(l => l.id === lessonId);
                
                if (!customLesson) {
                    return {
                        success: false,
                        error: `Lesson "${lessonId}" not found`
                    };
                }
            }
            
            // Dispatch event to start lesson (app.js listens for this)
            window.dispatchEvent(new CustomEvent('start-lesson', { 
                detail: { lessonId }
            }));
            
            Logger.info('tool_handlers', 'start_lesson', { lessonId });
            
            return {
                success: true,
                lessonId,
                message: `Starting lesson: ${lesson?.title || lessonId}`
            };
        } catch (error) {
            Logger.error('tool_handlers', 'start_lesson failed', { error: error.message });
            return { success: false, error: error.message };
        }
    });

    /**
     * get_available_lessons - Get list of all available lessons
     */
    registry.setHandler('get_available_lessons', async ({ topic, level, limit, includeProgress }) => {
        try {
            const { getAllLessons, getLessonsByTopic, LESSON_TIERS } = await import('../../data/LessonLoader.js');
            
            let lessons = getAllLessons();
            
            // Filter by topic if specified
            if (topic) {
                const topicLower = topic.toLowerCase();
                lessons = lessons.filter(l => 
                    l.topicId?.toLowerCase().includes(topicLower) ||
                    l.topicTitle?.toLowerCase().includes(topicLower) ||
                    l.title?.toLowerCase().includes(topicLower)
                );
            }
            
            // Filter by level if specified
            if (level) {
                const levelMap = {
                    'beginner': LESSON_TIERS.BUILDING_BLOCKS,
                    'basics': LESSON_TIERS.BUILDING_BLOCKS,
                    'essential': LESSON_TIERS.ESSENTIAL,
                    'intermediate': LESSON_TIERS.DAILY_TOPICS,
                    'advanced': LESSON_TIERS.ADVANCED
                };
                const targetTier = levelMap[level.toLowerCase()];
                if (targetTier) {
                    lessons = lessons.filter(l => l.tier === targetTier);
                }
            }
            
            // Add custom AI lessons
            const userId = localStorage.getItem('currentUserId') || 'guest';
            const customKey = `ai_custom_lessons_${userId}`;
            const customLessons = JSON.parse(localStorage.getItem(customKey) || '[]');
            
            const customFormatted = customLessons.map(l => ({
                id: l.id,
                title: l.title,
                description: l.description || `AI-generated lesson with ${l.words?.length || 0} words`,
                topicId: 'ai-generated',
                topicTitle: 'AI Generated',
                wordCount: l.words?.length || 0,
                isCustomLesson: true
            }));
            
            // Format standard lessons
            const formatted = lessons.map(l => ({
                id: l.id,
                title: l.title,
                description: l.description || null,
                topicId: l.topicId,
                topicTitle: l.topicTitle,
                tier: l.tier,
                wordCount: l.words?.length || 0
            }));
            
            // Combine and limit
            const allFormatted = [...formatted, ...customFormatted];
            const limited = limit ? allFormatted.slice(0, limit) : allFormatted;
            
            Logger.info('tool_handlers', 'get_all_lessons', { 
                topic, level, limit, 
                resultCount: limited.length 
            });
            
            return {
                count: limited.length,
                totalAvailable: allFormatted.length,
                lessons: limited,
                hasCustomLessons: customLessons.length > 0
            };
        } catch (error) {
            Logger.error('tool_handlers', 'get_all_lessons failed', { error: error.message });
            return { count: 0, lessons: [], error: error.message };
        }
    });

    // ========================================================================
    // STUCK WORDS RESCUE TOOLS
    // ========================================================================

    /**
     * get_stuck_words - Get words the user is struggling with
     */
    registry.setHandler('get_stuck_words', async ({ category, limit = 10, includeRescued = false }) => {
        try {
            const stuckWords = StuckWordsService.getStuckWords({ category, limit, includeRescued });
            const stats = StuckWordsService.getStuckWordStats();
            
            Logger.info('tool_handlers', 'get_stuck_words', { 
                count: stuckWords.length, 
                category 
            });
            
            return {
                count: stuckWords.length,
                stats,
                words: stuckWords.map(w => ({
                    wordKey: w.wordKey,
                    pt: w.pt,
                    en: w.en,
                    failureCount: w.failureCount,
                    pronunciationScore: w.avgPronunciationScore,
                    failureTypes: w.failureTypes,
                    confusedWith: w.confusedWith,
                    stuckDays: w.stuckSince ? Math.floor((Date.now() - new Date(w.stuckSince).getTime()) / (1000 * 60 * 60 * 24)) : 0,
                    recommendedTechniques: StuckWordsService.getRecommendedTechniques(w.wordKey).slice(0, 3).map(t => t.name)
                }))
            };
        } catch (error) {
            Logger.error('tool_handlers', 'get_stuck_words failed', { error: error.message });
            return { count: 0, words: [], error: error.message };
        }
    });

    /**
     * generate_mnemonic_story - Create keyword mnemonic for a stuck word
     * This provides building blocks; AI should create the actual story
     */
    registry.setHandler('generate_mnemonic_story', async ({ pt, en, wordKey }) => {
        try {
            const buildingBlocks = StuckWordsService.getMnemonicBuildingBlocks(pt, en);
            
            // Record that we're applying this technique
            if (wordKey) {
                StuckWordsService.recordRescueAttempt(wordKey, 'keyword_mnemonic', { generated: true });
            }
            
            Logger.info('tool_handlers', 'generate_mnemonic_story', { pt, en });
            
            return {
                success: true,
                word: pt,
                meaning: en,
                buildingBlocks,
                technique: StuckWordsService.RESCUE_TECHNIQUES.KEYWORD_MNEMONIC,
                instructions: [
                    `1. Find a KEYWORD: English word that sounds like "${pt}"`,
                    `2. Create a BIZARRE IMAGE: Connect the keyword to "${en}"`,
                    '3. Make it VIVID: Add action, emotion, exaggeration',
                    '4. VISUALIZE: Close eyes and see the scene for 5 seconds',
                    '5. RECALL: Say the Portuguese word and see the image'
                ],
                exampleFormat: `"${pt}" sounds like [KEYWORD]. Imagine [BIZARRE SCENE connecting KEYWORD to "${en}"]`
            };
        } catch (error) {
            Logger.error('tool_handlers', 'generate_mnemonic_story failed', { error: error.message });
            return { success: false, error: error.message };
        }
    });

    /**
     * create_memory_palace_scene - Place words in a mental location
     */
    registry.setHandler('create_memory_palace_scene', async ({ words, location = 'your home' }) => {
        try {
            if (!words || words.length === 0) {
                return { success: false, error: 'At least one word is required' };
            }
            
            // Common room sequence for memory palace
            const rooms = [
                { name: 'front door', tip: 'What do you see when you first enter?' },
                { name: 'hallway', tip: 'Walk through and notice details' },
                { name: 'living room', tip: 'Look at the furniture and decorations' },
                { name: 'kitchen', tip: 'Open cabinets, check the fridge' },
                { name: 'bedroom', tip: 'Look at the bed, nightstand, closet' },
                { name: 'bathroom', tip: 'Check the mirror, shower, toilet' },
                { name: 'backyard/balcony', tip: 'Step outside and look around' }
            ];
            
            const placements = words.slice(0, 7).map((w, idx) => {
                const room = rooms[idx] || rooms[idx % rooms.length];
                const wordKey = `${w.pt}|${w.en}`;
                
                // Record rescue attempt
                StuckWordsService.recordRescueAttempt(wordKey, 'memory_palace', { 
                    room: room.name, 
                    position: idx 
                });
                
                return {
                    position: idx + 1,
                    room: room.name,
                    roomTip: room.tip,
                    word: w.pt,
                    meaning: w.en,
                    suggestionPrompt: `Place "${w.pt}" (${w.en}) in the ${room.name}. Make it BIZARRE and INTERACTIVE.`
                };
            });
            
            Logger.info('tool_handlers', 'create_memory_palace_scene', { 
                wordCount: words.length, 
                location 
            });
            
            return {
                success: true,
                technique: StuckWordsService.RESCUE_TECHNIQUES.MEMORY_PALACE,
                location,
                placements,
                walkthrough: [
                    `1. Close your eyes and visualize ${location}`,
                    '2. Start at the front door and walk through each room',
                    '3. In each room, SEE the bizarre image for that word',
                    '4. Make the images INTERACT with the room (sitting on furniture, stuck to walls)',
                    '5. Practice walking through and recalling each word',
                    '6. Do this 3 times today, then once tomorrow'
                ]
            };
        } catch (error) {
            Logger.error('tool_handlers', 'create_memory_palace_scene failed', { error: error.message });
            return { success: false, error: error.message };
        }
    });

    /**
     * generate_multi_sensory_drill - Engage multiple learning channels
     */
    registry.setHandler('generate_multi_sensory_drill', async ({ pt, en, wordKey, includeAudio = true }) => {
        try {
            // Generate drill exercises
            const drill = {
                word: pt,
                meaning: en,
                exercises: [
                    {
                        channel: 'visual',
                        name: 'See It',
                        instruction: `Look at "${pt}" for 10 seconds. Notice each letter.`,
                        action: 'stare'
                    },
                    {
                        channel: 'auditory',
                        name: 'Hear It',
                        instruction: `Listen to "${pt}" 3 times. Focus on the rhythm and sounds.`,
                        action: 'listen'
                    },
                    {
                        channel: 'kinesthetic-write',
                        name: 'Write It',
                        instruction: `Write "${pt}" 5 times by hand. Say it as you write.`,
                        action: 'write'
                    },
                    {
                        channel: 'kinesthetic-speak',
                        name: 'Say It',
                        instruction: `Say "${pt}" out loud 5 times. Exaggerate the sounds.`,
                        action: 'speak'
                    },
                    {
                        channel: 'motor',
                        name: 'Gesture It',
                        instruction: `Create a hand gesture for "${en}". Do the gesture while saying "${pt}".`,
                        action: 'gesture'
                    },
                    {
                        channel: 'recall',
                        name: 'Close Eyes Recall',
                        instruction: `Close your eyes. Say "${pt}" and spell it out loud.`,
                        action: 'recall'
                    }
                ]
            };
            
            // Play audio if requested
            if (includeAudio) {
                await registry.execute('speak_portuguese', { text: pt, speed: 0.8 });
            }
            
            // Record rescue attempt
            if (wordKey) {
                StuckWordsService.recordRescueAttempt(wordKey, 'multi_sensory', { drill: true });
            }
            
            Logger.info('tool_handlers', 'generate_multi_sensory_drill', { pt, en });
            
            return {
                success: true,
                technique: StuckWordsService.RESCUE_TECHNIQUES.MULTI_SENSORY,
                drill,
                completionTime: '3-5 minutes',
                repetitionSchedule: [
                    'Do this drill NOW',
                    'Repeat in 4 hours',
                    'Repeat tomorrow morning',
                    'Repeat in 3 days'
                ]
            };
        } catch (error) {
            Logger.error('tool_handlers', 'generate_multi_sensory_drill failed', { error: error.message });
            return { success: false, error: error.message };
        }
    });

    /**
     * create_minimal_pairs_contrast - Compare confusing words
     */
    registry.setHandler('create_minimal_pairs_contrast', async ({ word1, word2, includeAudio = true }) => {
        try {
            if (!word1?.pt || !word2?.pt) {
                return { success: false, error: 'Both words required with pt and en properties' };
            }
            
            const contrast = {
                pair: [
                    { pt: word1.pt, en: word1.en },
                    { pt: word2.pt, en: word2.en }
                ],
                differences: [],
                exercises: []
            };
            
            // Analyze differences
            const pt1 = word1.pt.toLowerCase();
            const pt2 = word2.pt.toLowerCase();
            
            // Find differing characters
            for (let i = 0; i < Math.max(pt1.length, pt2.length); i++) {
                if (pt1[i] !== pt2[i]) {
                    contrast.differences.push({
                        position: i,
                        word1Char: pt1[i] || '(none)',
                        word2Char: pt2[i] || '(none)'
                    });
                }
            }
            
            // Generate exercises
            contrast.exercises = [
                {
                    type: 'listen_identify',
                    instruction: 'Listen to a word and identify which one it is',
                    items: [
                        { audio: word1.pt, answer: word1.en },
                        { audio: word2.pt, answer: word2.en }
                    ]
                },
                {
                    type: 'fill_blank',
                    instruction: 'Fill in the correct word',
                    items: [
                        { 
                            sentence: `I want to say "${word1.en}" in Portuguese: ___`,
                            answer: word1.pt
                        },
                        { 
                            sentence: `I want to say "${word2.en}" in Portuguese: ___`,
                            answer: word2.pt
                        }
                    ]
                },
                {
                    type: 'quick_switch',
                    instruction: 'Rapidly alternate saying both words 5 times each',
                    pattern: `${word1.pt} - ${word2.pt} - ${word1.pt} - ${word2.pt}...`
                }
            ];
            
            // Play both words if audio requested
            if (includeAudio) {
                await registry.execute('speak_portuguese', { text: word1.pt, speed: 0.8 });
                await new Promise(r => setTimeout(r, 1500));
                await registry.execute('speak_portuguese', { text: word2.pt, speed: 0.8 });
            }
            
            // Record rescue attempts for both words
            const key1 = `${word1.pt}|${word1.en}`;
            const key2 = `${word2.pt}|${word2.en}`;
            StuckWordsService.recordRescueAttempt(key1, 'minimal_pairs', { pairedWith: word2.pt });
            StuckWordsService.recordRescueAttempt(key2, 'minimal_pairs', { pairedWith: word1.pt });
            
            Logger.info('tool_handlers', 'create_minimal_pairs_contrast', { 
                word1: word1.pt, 
                word2: word2.pt 
            });
            
            return {
                success: true,
                technique: StuckWordsService.RESCUE_TECHNIQUES.MINIMAL_PAIRS,
                contrast,
                tip: `Focus on the DIFFERENCE: "${pt1}" vs "${pt2}". What makes them unique?`
            };
        } catch (error) {
            Logger.error('tool_handlers', 'create_minimal_pairs_contrast failed', { error: error.message });
            return { success: false, error: error.message };
        }
    });

    /**
     * generate_context_flood - Show word in many different contexts
     */
    registry.setHandler('generate_context_flood', async ({ pt, en, wordKey, count = 10 }) => {
        try {
            // Record rescue attempt
            if (wordKey) {
                StuckWordsService.recordRescueAttempt(wordKey, 'context_flood', { count });
            }
            
            Logger.info('tool_handlers', 'generate_context_flood', { pt, en, count });
            
            // Return template for AI to fill with real sentences
            return {
                success: true,
                technique: StuckWordsService.RESCUE_TECHNIQUES.CONTEXT_FLOOD,
                word: pt,
                meaning: en,
                requestedSentences: count,
                sentenceTypes: [
                    { type: 'simple_statement', example: 'Basic declarative sentence' },
                    { type: 'question', example: 'Question using the word' },
                    { type: 'negative', example: 'Negative sentence' },
                    { type: 'command', example: 'Imperative/command' },
                    { type: 'past_tense', example: 'Past tense usage' },
                    { type: 'future_tense', example: 'Future tense usage' },
                    { type: 'conditional', example: 'Conditional usage' },
                    { type: 'with_adjective', example: 'With descriptive adjective' },
                    { type: 'dialogue', example: 'In a conversation exchange' },
                    { type: 'idiomatic', example: 'Common phrase or idiom' }
                ],
                instructions: [
                    `Generate ${count} sentences using "${pt}" (${en})`,
                    'Each sentence should show a DIFFERENT usage',
                    'Include sentence types from the list above',
                    'Provide Portuguese + English translation for each',
                    'Mark collocations (words that commonly appear with this word)'
                ]
            };
        } catch (error) {
            Logger.error('tool_handlers', 'generate_context_flood failed', { error: error.message });
            return { success: false, error: error.message };
        }
    });

    /**
     * create_stuck_words_rescue_lesson - Create a HYBRID lesson combining:
     * - User's requested topic
     * - Stuck words that are RELEVANT to that topic
     * 
     * This is the KEY tool for smart lesson generation
     */
    registry.setHandler('create_stuck_words_rescue_lesson', async ({ 
        topic,
        title,
        description,
        newWords = [],
        includeStuckWords = true,
        maxStuckWords = 3,
        difficulty = 'beginner',
        rescueTechniques = ['keyword_mnemonic', 'context_flood']
    }) => {
        try {
            if (!topic && newWords.length === 0) {
                return { 
                    success: false, 
                    error: 'Either topic or newWords is required' 
                };
            }
            
            const userId = localStorage.getItem('currentUserId') || 'default';
            
            // Get relevant stuck words for this topic
            let stuckWordsToInclude = [];
            if (includeStuckWords) {
                const topicKeywords = topic?.split(/\s+/) || [];
                stuckWordsToInclude = StuckWordsService.getRelevantStuckWords(topic, topicKeywords);
                
                // Limit to maxStuckWords
                stuckWordsToInclude = stuckWordsToInclude.slice(0, maxStuckWords);
            }
            
            // Build combined word list
            const allWords = [];
            
            // Add new words (the main lesson content)
            for (const w of newWords) {
                allWords.push({
                    ...w,
                    isNew: true,
                    isStuckWord: false
                });
            }
            
            // Add relevant stuck words with rescue content
            for (const stuck of stuckWordsToInclude) {
                const mnemonicBlocks = StuckWordsService.getMnemonicBuildingBlocks(stuck.pt, stuck.en);
                const recommendedTech = StuckWordsService.getRecommendedTechniques(stuck.wordKey);
                
                allWords.push({
                    pt: stuck.pt,
                    en: stuck.en,
                    isNew: false,
                    isStuckWord: true,
                    stuckData: {
                        failureCount: stuck.failureCount,
                        confusedWith: stuck.confusedWith,
                        recommendedTechniques: recommendedTech.map(t => t.name)
                    },
                    mnemonicHints: mnemonicBlocks.suggestedKeywords,
                    rescueTip: `You've struggled with this ${stuck.failureCount} times. Let's use a memory trick!`
                });
                
                // Record that we're including this in a rescue lesson
                StuckWordsService.recordRescueAttempt(stuck.wordKey, 'rescue_lesson', { topic });
            }
            
            // Generate lesson ID
            const existingLessons = JSON.parse(localStorage.getItem(`${CUSTOM_LESSONS_KEY}_${userId}`) || '[]');
            const nextNum = String(existingLessons.length + 1).padStart(3, '0');
            const topicSlug = (topic || 'rescue').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
            const lessonId = `AI-${nextNum}-rescue-${topicSlug}`;
            
            // Build lesson
            const lesson = {
                id: lessonId,
                title: title || `${topic || 'Vocabulary'} + Your Stuck Words`,
                description: description || `Custom lesson combining ${topic || 'new vocabulary'} with words you're working to master.`,
                topic: `AI: ${topic || 'Rescue'}`,
                topicId: 'ai-rescue',
                tier: 4,
                level: difficulty,
                isAIGenerated: true,
                isRescueLesson: true,
                createdAt: new Date().toISOString(),
                createdBy: 'AI Tutor',
                focusArea: 'mixed',
                
                // Words with rescue metadata
                words: allWords.map((w, idx) => ({
                    id: `${lessonId}_word_${idx}`,
                    pt: w.pt,
                    en: w.en,
                    audio: w.audio || w.pt.toLowerCase().replace(/[^a-záàâãéêíóôõúç]/gi, ''),
                    pronunciation: w.pronunciation || '',
                    ipa: w.ipa || '',
                    type: w.type || 'vocabulary',
                    grammarNotes: w.grammarNotes || '',
                    culturalNote: w.culturalNote || '',
                    aiTip: w.isStuckWord ? w.rescueTip : (w.aiTip || ''),
                    examples: w.examples || [],
                    isStuckWord: w.isStuckWord || false,
                    mnemonicHints: w.mnemonicHints || [],
                    stuckData: w.stuckData || null
                })),
                
                // Rescue-specific metadata
                rescueMetadata: {
                    stuckWordsIncluded: stuckWordsToInclude.length,
                    newWordsIncluded: newWords.length,
                    techniquesFocused: rescueTechniques,
                    relevanceMatching: stuckWordsToInclude.map(w => ({
                        word: w.pt,
                        relevanceScore: w.relevanceScore || 0
                    }))
                },
                
                metadata: {
                    wordCount: allWords.length,
                    stuckWordCount: stuckWordsToInclude.length,
                    newWordCount: newWords.length,
                    hasRescueContent: stuckWordsToInclude.length > 0
                }
            };
            
            // Store lesson
            existingLessons.push(lesson);
            localStorage.setItem(`${CUSTOM_LESSONS_KEY}_${userId}`, JSON.stringify(existingLessons));
            
            // Emit event
            eventStream.track('rescue_lesson_created', {
                lessonId,
                topic,
                stuckWordCount: stuckWordsToInclude.length,
                newWordCount: newWords.length
            });
            
            window.dispatchEvent(new CustomEvent('ai-lesson-created', { detail: { lesson } }));
            
            Logger.info('tool_handlers', 'create_stuck_words_rescue_lesson', {
                lessonId,
                topic,
                stuckWords: stuckWordsToInclude.length,
                newWords: newWords.length
            });
            
            return {
                success: true,
                lesson: {
                    id: lessonId,
                    title: lesson.title,
                    wordCount: allWords.length,
                    stuckWordsIncluded: stuckWordsToInclude.map(w => ({ pt: w.pt, en: w.en })),
                    newWordsIncluded: newWords.length
                },
                message: stuckWordsToInclude.length > 0
                    ? `✅ Created "${lesson.title}" with ${newWords.length} new words AND ${stuckWordsToInclude.length} stuck word(s) you need to practice. Look for the 🔴 markers on stuck words!`
                    : `✅ Created "${lesson.title}" with ${newWords.length} words. No stuck words matched this topic.`,
                stuckWordsNote: stuckWordsToInclude.length > 0
                    ? `Included stuck words: ${stuckWordsToInclude.map(w => w.pt).join(', ')}. These need extra attention!`
                    : 'No stuck words were relevant to this topic, so only new words were added.'
            };
        } catch (error) {
            Logger.error('tool_handlers', 'create_stuck_words_rescue_lesson failed', { error: error.message });
            return { success: false, error: error.message };
        }
    });

    /**
     * record_word_failure - Track when a user fails a word
     */
    registry.setHandler('record_word_failure', async ({ wordKey, pt, en, failureType, confusedWith, pronunciationScore, category }) => {
        try {
            const result = StuckWordsService.recordFailure({
                wordKey: wordKey || `${pt}|${en}`,
                pt,
                en,
                failureType,
                confusedWith,
                pronunciationScore,
                category
            });
            
            Logger.info('tool_handlers', 'record_word_failure', { pt, failureType });
            
            const isNowStuck = result.stuckSince && result.failureCount >= 3;
            
            return {
                success: true,
                word: pt,
                failureCount: result.failureCount,
                isStuck: isNowStuck,
                message: isNowStuck 
                    ? `"${pt}" is now marked as stuck (${result.failureCount} failures). Consider using rescue techniques!`
                    : `Recorded failure for "${pt}". ${3 - result.failureCount} more failures before marked as stuck.`
            };
        } catch (error) {
            Logger.error('tool_handlers', 'record_word_failure failed', { error: error.message });
            return { success: false, error: error.message };
        }
    });

    /**
     * get_rescue_techniques - Get available rescue techniques for a word
     */
    registry.setHandler('get_rescue_techniques', async ({ wordKey, pt, en }) => {
        try {
            const key = wordKey || `${pt}|${en}`;
            const techniques = StuckWordsService.getRecommendedTechniques(key);
            const allTechniques = Object.values(StuckWordsService.RESCUE_TECHNIQUES);
            
            Logger.info('tool_handlers', 'get_rescue_techniques', { wordKey: key });
            
            return {
                success: true,
                word: pt,
                recommendedTechniques: techniques.map(t => ({
                    id: t.id,
                    name: t.name,
                    description: t.description,
                    effectiveness: `${Math.round(t.effectiveness * 100)}%`,
                    bestFor: t.bestFor
                })),
                allTechniques: allTechniques.map(t => ({
                    id: t.id,
                    name: t.name,
                    description: t.description
                }))
            };
        } catch (error) {
            Logger.error('tool_handlers', 'get_rescue_techniques failed', { error: error.message });
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
