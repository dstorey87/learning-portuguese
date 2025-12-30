/**
 * LessonService Unit Tests
 * 
 * Comprehensive tests for lesson management:
 * - Configuration constants
 * - Challenge building and sequencing
 * - Lesson state management
 * - Accuracy tracking
 * - Hint generation
 * - Mnemonics
 * - Lesson completion
 * 
 * @module tests/unit/lessonService.test
 */

import { test, expect } from '@playwright/test';

const TEST_PORT = 4321;
const BASE_URL = `http://localhost:${TEST_PORT}`;

// ============================================================================
// TEST DATA
// ============================================================================

const mockLesson = {
    id: 'BB-001',
    title: 'Personal Pronouns',
    words: [
        { pt: 'eu', en: 'I', ipa: '/ew/' },
        { pt: 'tu', en: 'you (informal)', ipa: '/tu/' },
        { pt: 'você', en: 'you (formal)', ipa: '/voˈse/' },
        { pt: 'nós', en: 'we', ipa: '/nɔʃ/' }
    ],
    sentences: [
        { pt: 'Eu sou português.', en: 'I am Portuguese.' }
    ]
};

const mockWord = { pt: 'obrigado', en: 'thank you' };
const mockWordFemale = { pt: 'obrigada', en: 'thank you' };

// ============================================================================
// CONFIGURATION TESTS
// ============================================================================

test.describe('LessonService: Configuration', () => {
    test('LESSON_CONFIG has correct default values', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const config = await page.evaluate(async () => {
            const { LESSON_CONFIG } = await import('/src/services/LessonService.js');
            return LESSON_CONFIG;
        });
        
        expect(config).toBeDefined();
        expect(config.maxPronunciationWords).toBe(4);
        expect(config.maxFillWords).toBe(5);
        expect(config.maxListenWords).toBe(3);
        expect(config.maxPronunciationAttempts).toBe(3);
        expect(config.defaultQuizOptions).toBe(4);
    });
    
    test('CHALLENGE_TYPES contains all challenge types', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const types = await page.evaluate(async () => {
            const { CHALLENGE_TYPES } = await import('/src/services/LessonService.js');
            return CHALLENGE_TYPES;
        });
        
        expect(types).toBeDefined();
        expect(types.LEARN_WORD).toBe('learn-word');
        expect(types.PRONUNCIATION).toBe('pronunciation');
        expect(types.MCQ).toBe('mcq');
        expect(types.TYPE_ANSWER).toBe('type-answer');
        expect(types.LISTEN_TYPE).toBe('listen-type');
        expect(types.SENTENCE).toBe('sentence');
    });
    
    test('CHALLENGE_PHASES contains all phases', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const phases = await page.evaluate(async () => {
            const { CHALLENGE_PHASES } = await import('/src/services/LessonService.js');
            return CHALLENGE_PHASES;
        });
        
        expect(phases).toBeDefined();
        expect(phases.LEARN).toBe('learn');
        expect(phases.PRONOUNCE).toBe('pronounce');
        expect(phases.PRACTICE).toBe('practice');
        expect(phases.APPLY).toBe('apply');
    });
});

// ============================================================================
// UTILITY FUNCTION TESTS
// ============================================================================

test.describe('LessonService: Utility Functions', () => {
    test('getWordKey generates unique key from pt|en', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const key = await page.evaluate(async () => {
            const { getWordKey } = await import('/src/services/LessonService.js');
            return getWordKey({ pt: 'Olá', en: 'Hello' });
        });
        
        expect(key).toBe('olá|hello');
    });
    
    test('getWordKey handles missing properties', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const key = await page.evaluate(async () => {
            const { getWordKey } = await import('/src/services/LessonService.js');
            return getWordKey({ pt: 'test' });
        });
        
        expect(key).toBe('test|');
    });
    
    test('resolveWordForm returns pt by default', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async () => {
            const { resolveWordForm } = await import('/src/services/LessonService.js');
            return resolveWordForm({ pt: 'amigo', en: 'friend' });
        });
        
        expect(result).toBe('amigo');
    });
    
    test('resolveWordForm handles obrigado/obrigada gender', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const results = await page.evaluate(async () => {
            const { resolveWordForm } = await import('/src/services/LessonService.js');
            return {
                male: resolveWordForm({ pt: 'obrigado' }, 'male'),
                female: resolveWordForm({ pt: 'obrigado' }, 'female')
            };
        });
        
        expect(results.male).toBe('obrigado');
        expect(results.female).toBe('obrigada');
    });
    
    test('resolveWordForm uses genderForms when provided', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async () => {
            const { resolveWordForm } = await import('/src/services/LessonService.js');
            const word = {
                pt: 'cansado',
                genderForms: { male: 'cansado', female: 'cansada', neutral: 'cansado' }
            };
            return {
                male: resolveWordForm(word, 'male'),
                female: resolveWordForm(word, 'female')
            };
        });
        
        expect(result.male).toBe('cansado');
        expect(result.female).toBe('cansada');
    });
    
    test('resolveWordForm handles null word', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async () => {
            const { resolveWordForm } = await import('/src/services/LessonService.js');
            return resolveWordForm(null);
        });
        
        expect(result).toBe('');
    });
});

// ============================================================================
// CHALLENGE BUILDING TESTS
// ============================================================================

test.describe('LessonService: Challenge Building', () => {
    test('buildQuizOptions returns correct number of options', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const options = await page.evaluate(async () => {
            const { buildQuizOptions, LESSON_CONFIG } = await import('/src/services/LessonService.js');
            const words = [
                { pt: 'eu', en: 'I' },
                { pt: 'tu', en: 'you' },
                { pt: 'ele', en: 'he' },
                { pt: 'ela', en: 'she' },
                { pt: 'nós', en: 'we' }
            ];
            const options = buildQuizOptions(words[0], words);
            return { options, defaultCount: LESSON_CONFIG.defaultQuizOptions };
        });
        
        expect(options.options.length).toBe(options.defaultCount);
        expect(options.options).toContain('I'); // Correct answer included
    });
    
    test('buildQuizOptions includes correct answer', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const hasCorrect = await page.evaluate(async () => {
            const { buildQuizOptions } = await import('/src/services/LessonService.js');
            const target = { pt: 'água', en: 'water' };
            const words = [target, { pt: 'café', en: 'coffee' }];
            const options = buildQuizOptions(target, words);
            return options.includes('water');
        });
        
        expect(hasCorrect).toBe(true);
    });
    
    test('buildLessonChallenges (BEGINNER) creates selection-based challenges only', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async (lesson) => {
            const { buildLessonChallenges, CHALLENGE_TYPES } = 
                await import('/src/services/LessonService.js');
            // Default is beginner mode - no typing/pronunciation
            const challenges = buildLessonChallenges(lesson);
            
            return {
                total: challenges.length,
                hasLearnWord: challenges.some(c => c.type === 'learn-word'),
                hasMCQ: challenges.some(c => c.type === 'mcq'),
                // These should NOT appear at beginner level
                hasPronunciation: challenges.some(c => c.type === 'pronunciation'),
                hasTypeAnswer: challenges.some(c => c.type === 'type-answer'),
                hasListenType: challenges.some(c => c.type === 'listen-type'),
                types: [...new Set(challenges.map(c => c.type))]
            };
        }, mockLesson);
        
        // BEGINNER mode should have MCQ and Learn Word
        expect(result.total).toBeGreaterThan(0);
        expect(result.hasLearnWord).toBe(true);
        expect(result.hasMCQ).toBe(true);
        // But NOT pronunciation or typing (those are INTERMEDIATE/HARD)
        expect(result.hasPronunciation).toBe(false);
        expect(result.hasTypeAnswer).toBe(false);
        expect(result.hasListenType).toBe(false);
    });
    
    test('buildLessonChallenges (HARD) creates all challenge phases', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async (lesson) => {
            const { buildLessonChallenges, CHALLENGE_TYPES } = 
                await import('/src/services/LessonService.js');
            // Hard mode with full progress = all challenge types
            const challenges = buildLessonChallenges(lesson, {
                difficultyLevel: 'hard',
                lessonProgress: { accuracy: 100, completions: 10 }
            });
            
            return {
                total: challenges.length,
                hasLearnWord: challenges.some(c => c.type === 'learn-word'),
                hasPronunciation: challenges.some(c => c.type === 'pronunciation'),
                hasMCQ: challenges.some(c => c.type === 'mcq'),
                hasTypeAnswer: challenges.some(c => c.type === 'type-answer'),
                hasListenType: challenges.some(c => c.type === 'listen-type'),
                hasSentence: challenges.some(c => c.type === 'sentence'),
                types: [...new Set(challenges.map(c => c.type))]
            };
        }, mockLesson);
        
        expect(result.total).toBeGreaterThan(0);
        expect(result.hasLearnWord).toBe(true);
        expect(result.hasPronunciation).toBe(true);
        expect(result.hasMCQ).toBe(true);
        expect(result.hasTypeAnswer).toBe(true);
        expect(result.hasListenType).toBe(true);
        expect(result.hasSentence).toBe(true);
    });
    
    test('buildLessonChallenges handles lesson with no sentences', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async () => {
            const { buildLessonChallenges, CHALLENGE_TYPES } = 
                await import('/src/services/LessonService.js');
            const lesson = {
                id: 'test',
                words: [{ pt: 'sim', en: 'yes' }],
                sentences: []
            };
            const challenges = buildLessonChallenges(lesson);
            return {
                total: challenges.length,
                hasSentence: challenges.some(c => c.type === CHALLENGE_TYPES.SENTENCE)
            };
        });
        
        expect(result.total).toBeGreaterThan(0);
        expect(result.hasSentence).toBe(false);
    });
});

// ============================================================================
// LESSON STATE TESTS
// ============================================================================

test.describe('LessonService: Lesson State Management', () => {
    test('initLessonState initializes state correctly', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const state = await page.evaluate(async (lesson) => {
            const { initLessonState } = await import('/src/services/LessonService.js');
            return initLessonState(lesson);
        }, mockLesson);
        
        expect(state.lesson).toBeDefined();
        expect(state.lesson.id).toBe('BB-001');
        expect(state.challenges.length).toBeGreaterThan(0);
        expect(state.currentIndex).toBe(0);
        expect(state.correct).toBe(0);
        expect(state.mistakes).toBe(0);
        expect(state.wrongAnswers).toEqual([]);
        expect(state.progress).toBe(0);
        expect(state.isComplete).toBe(false);
    });
    
    test('getLessonState returns current state', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const state = await page.evaluate(async (lesson) => {
            const { initLessonState, getLessonState } = await import('/src/services/LessonService.js');
            initLessonState(lesson);
            return getLessonState();
        }, mockLesson);
        
        expect(state).toBeDefined();
        expect(state.lesson).toBeDefined();
        expect(state.currentChallenge).toBeDefined();
    });
    
    test('getCurrentChallenge returns current challenge', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const challenge = await page.evaluate(async (lesson) => {
            const { initLessonState, getCurrentChallenge } = await import('/src/services/LessonService.js');
            initLessonState(lesson);
            return getCurrentChallenge();
        }, mockLesson);
        
        expect(challenge).toBeDefined();
        expect(challenge.type).toBeDefined();
    });
    
    test('nextChallenge advances index', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async (lesson) => {
            const { initLessonState, nextChallenge, getLessonState } = 
                await import('/src/services/LessonService.js');
            initLessonState(lesson);
            const before = getLessonState().currentIndex;
            nextChallenge();
            const after = getLessonState().currentIndex;
            return { before, after };
        }, mockLesson);
        
        expect(result.before).toBe(0);
        expect(result.after).toBe(1);
    });
    
    test('recordCorrect increments correct count', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async (lesson) => {
            const { initLessonState, recordCorrect, getLessonState } = 
                await import('/src/services/LessonService.js');
            initLessonState(lesson);
            const before = getLessonState().correct;
            recordCorrect();
            recordCorrect();
            const after = getLessonState().correct;
            return { before, after };
        }, mockLesson);
        
        expect(result.before).toBe(0);
        expect(result.after).toBe(2);
    });
    
    test('recordMistake increments mistakes and adds to wrongAnswers', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async (lesson) => {
            const { initLessonState, recordMistake, getLessonState } = 
                await import('/src/services/LessonService.js');
            initLessonState(lesson);
            const word = { pt: 'erro', en: 'mistake' };
            recordMistake(word);
            const state = getLessonState();
            return {
                mistakes: state.mistakes,
                wrongAnswers: state.wrongAnswers
            };
        }, mockLesson);
        
        expect(result.mistakes).toBe(1);
        expect(result.wrongAnswers.length).toBe(1);
        expect(result.wrongAnswers[0].pt).toBe('erro');
    });
    
    test('resetLessonState clears all state', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async (lesson) => {
            const { initLessonState, recordCorrect, resetLessonState, getLessonState } = 
                await import('/src/services/LessonService.js');
            initLessonState(lesson);
            recordCorrect();
            resetLessonState();
            return getLessonState();
        }, mockLesson);
        
        expect(result.lesson).toBeNull();
        expect(result.challenges.length).toBe(0);
        expect(result.correct).toBe(0);
    });
    
    test('getLessonDuration calculates duration correctly', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const duration = await page.evaluate(async (lesson) => {
            const { initLessonState, getLessonDuration } = await import('/src/services/LessonService.js');
            initLessonState(lesson);
            // Wait a bit to get non-zero duration
            await new Promise(r => setTimeout(r, 100));
            return getLessonDuration();
        }, mockLesson);
        
        expect(duration).toBeGreaterThanOrEqual(0);
    });
    
    test('getLessonAccuracy calculates accuracy correctly', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const accuracy = await page.evaluate(async (lesson) => {
            const { initLessonState, recordCorrect, recordMistake, getLessonAccuracy } = 
                await import('/src/services/LessonService.js');
            initLessonState(lesson);
            recordCorrect();
            recordCorrect();
            recordCorrect();
            recordMistake();
            return getLessonAccuracy();
        }, mockLesson);
        
        expect(accuracy).toBe(75); // 3/4 = 75%
    });
    
    test('getLessonAccuracy returns 100 when no attempts', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const accuracy = await page.evaluate(async (lesson) => {
            const { initLessonState, getLessonAccuracy } = await import('/src/services/LessonService.js');
            initLessonState(lesson);
            return getLessonAccuracy();
        }, mockLesson);
        
        expect(accuracy).toBe(100);
    });
});

// ============================================================================
// ACCURACY TRACKING TESTS
// ============================================================================

test.describe('LessonService: Accuracy Tracking', () => {
    test('calculateAccuracy returns correct percentage', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async () => {
            const { calculateAccuracy } = await import('/src/services/LessonService.js');
            return {
                full: calculateAccuracy(10, 10),
                partial: calculateAccuracy(10, 7),
                zero: calculateAccuracy(10, 0),
                noAttempts: calculateAccuracy(0, 0)
            };
        });
        
        expect(result.full).toBe(100);
        expect(result.partial).toBe(70);
        expect(result.zero).toBe(0);
        expect(result.noAttempts).toBe(0);
    });
    
    test('updateLessonAccuracyData updates user data correctly', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async () => {
            const { updateLessonAccuracyData } = await import('/src/services/LessonService.js');
            let userData = {};
            userData = updateLessonAccuracyData(userData, 0, true);  // Correct
            userData = updateLessonAccuracyData(userData, 0, true);  // Correct
            userData = updateLessonAccuracyData(userData, 0, false); // Wrong
            return userData;
        });
        
        expect(result.lessonAttempts[0]).toBe(3);
        expect(result.lessonCorrect[0]).toBe(2);
        expect(result.lessonAccuracy[0]).toBe(67); // 2/3 = 67%
    });
    
    test('updateLessonAccuracyData handles negative index', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async () => {
            const { updateLessonAccuracyData } = await import('/src/services/LessonService.js');
            const userData = { test: 'data' };
            return updateLessonAccuracyData(userData, -1, true);
        });
        
        expect(result.test).toBe('data');
        expect(result.lessonAttempts).toBeUndefined();
    });
});

// ============================================================================
// HINT GENERATION TESTS
// ============================================================================

test.describe('LessonService: Hint Generation', () => {
    test('buildHintForWord returns hint for nasal sounds', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const hint = await page.evaluate(async () => {
            const { buildHintForWord } = await import('/src/services/LessonService.js');
            return buildHintForWord({ pt: 'pão', en: 'bread' });
        });
        
        expect(hint).toContain('nasal');
    });
    
    test('buildHintForWord returns hint for obrigado', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const hint = await page.evaluate(async () => {
            const { buildHintForWord } = await import('/src/services/LessonService.js');
            return buildHintForWord({ pt: 'obrigado', en: 'thank you' });
        });
        
        expect(hint).toContain('gender');
    });
    
    test('buildHintForWord returns hint for por favor', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const hint = await page.evaluate(async () => {
            const { buildHintForWord } = await import('/src/services/LessonService.js');
            return buildHintForWord({ pt: 'por favor', en: 'please' });
        });
        
        expect(hint).toContain('por favor');
    });
    
    test('buildHintForWord returns default hint for unknown words', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const hint = await page.evaluate(async () => {
            const { buildHintForWord } = await import('/src/services/LessonService.js');
            return buildHintForWord({ pt: 'gato', en: 'cat' });
        });
        
        expect(hint).toContain('Portuguese');
    });
    
    test('generateHints sorts by count and returns limited results', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async () => {
            const { generateHints } = await import('/src/services/LessonService.js');
            const mistakes = [
                { pt: 'a', count: 1 },
                { pt: 'b', count: 5 },
                { pt: 'c', count: 3 },
                { pt: 'd', count: 2 }
            ];
            return generateHints(mistakes, 2);
        });
        
        expect(result.length).toBe(2);
        expect(result[0].pt).toBe('b'); // Highest count first
        expect(result[1].pt).toBe('c');
        expect(result[0].tip).toBeDefined();
    });
    
    test('generateHints returns default hint when no mistakes', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async () => {
            const { generateHints } = await import('/src/services/LessonService.js');
            return generateHints([]);
        });
        
        expect(result.length).toBe(1);
        expect(result[0].key).toBe('foundation-pronunciation');
    });
});

// ============================================================================
// MNEMONIC TESTS
// ============================================================================

test.describe('LessonService: Mnemonics', () => {
    test('getMnemonic returns mnemonic for known word', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const mnemonic = await page.evaluate(async () => {
            const { getMnemonic } = await import('/src/services/LessonService.js');
            return getMnemonic({ pt: 'obrigado' });
        });
        
        expect(mnemonic).toContain('obligated');
    });
    
    test('getMnemonic returns null for unknown word', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const mnemonic = await page.evaluate(async () => {
            const { getMnemonic } = await import('/src/services/LessonService.js');
            return getMnemonic({ pt: 'unknown_word_xyz' });
        });
        
        expect(mnemonic).toBeNull();
    });
    
    test('getMnemonic is case-insensitive', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const mnemonic = await page.evaluate(async () => {
            const { getMnemonic } = await import('/src/services/LessonService.js');
            return getMnemonic({ pt: 'OBRIGADO' });
        });
        
        expect(mnemonic).toContain('obligated');
    });
    
    test('getAllMnemonics returns all mnemonics', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const mnemonics = await page.evaluate(async () => {
            const { getAllMnemonics } = await import('/src/services/LessonService.js');
            return getAllMnemonics();
        });
        
        expect(mnemonics).toBeDefined();
        expect(Object.keys(mnemonics).length).toBeGreaterThan(0);
        expect(mnemonics['eu']).toBeDefined();
        expect(mnemonics['sim']).toBeDefined();
    });
});

// ============================================================================
// LESSON COMPLETION TESTS
// ============================================================================

test.describe('LessonService: Lesson Completion', () => {
    test('buildLessonCompletionData builds complete data', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async (lesson) => {
            const { initLessonState, recordCorrect, recordMistake, buildLessonCompletionData } = 
                await import('/src/services/LessonService.js');
            initLessonState(lesson);
            recordCorrect();
            recordCorrect();
            recordMistake({ pt: 'erro' });
            return buildLessonCompletionData(lesson, 'female');
        }, mockLesson);
        
        expect(result.lessonId).toBe('BB-001');
        expect(result.learnedWords.length).toBe(4);
        expect(result.wordCount).toBe(4);
        expect(result.correct).toBe(2);
        expect(result.mistakes).toBe(1);
        expect(result.accuracy).toBe(67);
        expect(result.timestamp).toBeDefined();
    });
    
    test('buildLessonCompletionData resolves word forms by gender', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async () => {
            const { initLessonState, buildLessonCompletionData } = 
                await import('/src/services/LessonService.js');
            const lesson = {
                id: 'test',
                words: [{ pt: 'obrigado', en: 'thank you' }]
            };
            initLessonState(lesson);
            return buildLessonCompletionData(lesson, 'female');
        });
        
        expect(result.learnedWords[0].pt).toBe('obrigada');
        expect(result.learnedWords[0].genderUsed).toBe('female');
    });
    
    test('calculateLessonXP calculates base XP', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const xp = await page.evaluate(async () => {
            const { calculateLessonXP } = await import('/src/services/LessonService.js');
            return calculateLessonXP({
                wordCount: 5,
                accuracy: 80,
                mistakes: 1
            });
        });
        
        // base 10 + words 5*2 = 20
        expect(xp).toBe(20);
    });

    test('buildLessonChallenges honors pre-built rescue challenges', async ({ page }) => {
        await page.goto(BASE_URL);

        const challenges = await page.evaluate(async () => {
            const { buildLessonChallenges } = await import('/src/services/LessonService.js');
            const lesson = {
                words: [
                    { pt: 'um', en: 'one' },
                    { pt: 'dois', en: 'two', isStuckWord: true }
                ],
                    challenges: [
                        { type: 'learn-word', wordIndex: 0 },
                        { type: 'rescue-keyword-mnemonic', wordIndex: 1, steps: ['scene'] }
                    ]
            };
            return buildLessonChallenges(lesson);
        });

        expect(challenges).toHaveLength(2);
        expect(challenges[0].type).toBe('learn-word');
        expect(challenges[0].word.pt).toBe('um');
        expect(challenges[1].type).toBe('rescue-keyword-mnemonic');
        expect(challenges[1].word.pt).toBe('dois');
    });
    
    test('calculateLessonXP adds accuracy bonus for 90%+', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const xp = await page.evaluate(async () => {
            const { calculateLessonXP } = await import('/src/services/LessonService.js');
            return calculateLessonXP({
                wordCount: 5,
                accuracy: 95,
                mistakes: 1
            });
        });
        
        // base 10 + words 10 + accuracy 5 = 25
        expect(xp).toBe(25);
    });
    
    test('calculateLessonXP adds perfect bonus for no mistakes', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const xp = await page.evaluate(async () => {
            const { calculateLessonXP } = await import('/src/services/LessonService.js');
            return calculateLessonXP({
                wordCount: 5,
                accuracy: 100,
                mistakes: 0
            });
        });
        
        // base 10 + words 10 + accuracy 5 + perfect 10 = 35
        expect(xp).toBe(35);
    });
});

// ============================================================================
// DEFAULT EXPORT TESTS
// ============================================================================

test.describe('LessonService: Default Export', () => {
    test('default export includes all public functions', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const exports = await page.evaluate(async () => {
            const LessonService = (await import('/src/services/LessonService.js')).default;
            return Object.keys(LessonService);
        });
        
        expect(exports).toContain('LESSON_CONFIG');
        expect(exports).toContain('CHALLENGE_TYPES');
        expect(exports).toContain('CHALLENGE_PHASES');
        expect(exports).toContain('getWordKey');
        expect(exports).toContain('resolveWordForm');
        expect(exports).toContain('buildQuizOptions');
        expect(exports).toContain('buildLessonChallenges');
        expect(exports).toContain('initLessonState');
        expect(exports).toContain('getLessonState');
        expect(exports).toContain('getCurrentChallenge');
        expect(exports).toContain('nextChallenge');
        expect(exports).toContain('recordCorrect');
        expect(exports).toContain('recordMistake');
        expect(exports).toContain('resetLessonState');
        expect(exports).toContain('getLessonDuration');
        expect(exports).toContain('getLessonAccuracy');
        expect(exports).toContain('calculateAccuracy');
        expect(exports).toContain('updateLessonAccuracyData');
        expect(exports).toContain('buildHintForWord');
        expect(exports).toContain('generateHints');
        expect(exports).toContain('getMnemonic');
        expect(exports).toContain('getAllMnemonics');
        expect(exports).toContain('buildLessonCompletionData');
        expect(exports).toContain('calculateLessonXP');
    });
});
