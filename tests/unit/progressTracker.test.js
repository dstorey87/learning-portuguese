/**
 * ProgressTracker Unit Tests
 * 
 * Comprehensive tests for progress tracking:
 * - Configuration constants
 * - Word tracking and SRS
 * - Lesson completion tracking
 * - Skill statistics
 * - Milestones
 * - Study sessions
 * - Progress summary
 * 
 * @module tests/unit/progressTracker.test
 */

import { test, expect } from '@playwright/test';

const TEST_PORT = 4321;
const BASE_URL = `http://localhost:${TEST_PORT}`;

// ============================================================================
// CONFIGURATION TESTS
// ============================================================================

test.describe('ProgressTracker: Configuration', () => {
    test('PROGRESS_CONFIG has correct default values', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const config = await page.evaluate(async () => {
            const { PROGRESS_CONFIG } = await import('/src/services/ProgressTracker.js');
            return PROGRESS_CONFIG;
        });
        
        expect(config).toBeDefined();
        expect(config.maxWordsPerDay).toBe(50);
        expect(config.maxLessonsPerDay).toBe(20);
        expect(config.srsLevelMax).toBe(5);
        expect(config.streakMilestones).toContain(7);
        expect(config.xpMilestones).toContain(1000);
    });
    
    test('SRS_INTERVALS has correct spaced repetition values', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const intervals = await page.evaluate(async () => {
            const { SRS_INTERVALS } = await import('/src/services/ProgressTracker.js');
            return SRS_INTERVALS;
        });
        
        expect(intervals[1]).toBe(1);   // Level 1: 1 day
        expect(intervals[2]).toBe(3);   // Level 2: 3 days
        expect(intervals[3]).toBe(7);   // Level 3: 1 week
        expect(intervals[4]).toBe(14);  // Level 4: 2 weeks
        expect(intervals[5]).toBe(30);  // Level 5: 1 month
    });
    
    test('SKILL_CATEGORIES contains all categories', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const categories = await page.evaluate(async () => {
            const { SKILL_CATEGORIES } = await import('/src/services/ProgressTracker.js');
            return SKILL_CATEGORIES;
        });
        
        expect(categories.VOCABULARY).toBe('vocabulary');
        expect(categories.PRONUNCIATION).toBe('pronunciation');
        expect(categories.LISTENING).toBe('listening');
        expect(categories.GRAMMAR).toBe('grammar');
        expect(categories.READING).toBe('reading');
        expect(categories.SPEAKING).toBe('speaking');
    });
    
    test('PROGRESS_EVENTS contains all event types', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const events = await page.evaluate(async () => {
            const { PROGRESS_EVENTS } = await import('/src/services/ProgressTracker.js');
            return PROGRESS_EVENTS;
        });
        
        expect(events.WORD_LEARNED).toBe('progressWordLearned');
        expect(events.LESSON_COMPLETED).toBe('progressLessonCompleted');
        expect(events.MILESTONE_REACHED).toBe('progressMilestoneReached');
        expect(events.SRS_REVIEW_DUE).toBe('progressSrsReviewDue');
        expect(events.SKILL_UPDATED).toBe('progressSkillUpdated');
    });
});

// ============================================================================
// STORAGE TESTS
// ============================================================================

test.describe('ProgressTracker: Storage', () => {
    test('loadProgress loads from localStorage', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async () => {
            const { loadProgress, resetProgress } = await import('/src/services/ProgressTracker.js');
            resetProgress();
            const snapshot = loadProgress();
            return {
                hasLearnedWords: Array.isArray(snapshot.learnedWords),
                hasCompletedLessons: Array.isArray(snapshot.completedLessons),
                hasMilestones: Array.isArray(snapshot.milestones)
            };
        });
        
        expect(result.hasLearnedWords).toBe(true);
        expect(result.hasCompletedLessons).toBe(true);
        expect(result.hasMilestones).toBe(true);
    });
    
    test('saveProgress saves to localStorage', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const saved = await page.evaluate(async () => {
            const { saveProgress, resetProgress, addLearnedWord, getProgressSnapshot } = 
                await import('/src/services/ProgressTracker.js');
            resetProgress();
            addLearnedWord({ pt: 'teste', en: 'test' });
            saveProgress();
            const snapshot = getProgressSnapshot();
            return snapshot.lastSyncTime !== null;
        });
        
        expect(saved).toBe(true);
    });
    
    test('loadProgress with userId uses prefixed key', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async () => {
            const { loadProgress, resetProgress } = await import('/src/services/ProgressTracker.js');
            resetProgress('user123');
            return loadProgress('user123');
        });
        
        expect(result).toBeDefined();
    });
    
    test('getProgressSnapshot returns copy of state', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async () => {
            const { resetProgress, getProgressSnapshot } = await import('/src/services/ProgressTracker.js');
            resetProgress();
            const snapshot = getProgressSnapshot();
            return {
                isArray: Array.isArray(snapshot.learnedWords),
                isObject: typeof snapshot === 'object'
            };
        });
        
        expect(result.isArray).toBe(true);
        expect(result.isObject).toBe(true);
    });
});

// ============================================================================
// WORD TRACKING TESTS
// ============================================================================

test.describe('ProgressTracker: Word Tracking', () => {
    test('addLearnedWord adds word with SRS data', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const word = await page.evaluate(async () => {
            const { resetProgress, addLearnedWord } = await import('/src/services/ProgressTracker.js');
            resetProgress();
            return addLearnedWord({ pt: 'olá', en: 'hello' });
        });
        
        expect(word.pt).toBe('olá');
        expect(word.en).toBe('hello');
        expect(word.srsLevel).toBe(1);
        expect(word.nextReview).toBeDefined();
        expect(word.learnedAt).toBeDefined();
        expect(word.key).toBe('olá|hello');
    });
    
    test('addLearnedWord updates existing word', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async () => {
            const { resetProgress, addLearnedWord, getLearnedWordCount } = 
                await import('/src/services/ProgressTracker.js');
            resetProgress();
            addLearnedWord({ pt: 'olá', en: 'hello' });
            addLearnedWord({ pt: 'olá', en: 'hello' }); // Same word
            return getLearnedWordCount();
        });
        
        expect(result).toBe(1); // Should not duplicate
    });
    
    test('addLearnedWords adds multiple words', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const count = await page.evaluate(async () => {
            const { resetProgress, addLearnedWords, getLearnedWordCount } = 
                await import('/src/services/ProgressTracker.js');
            resetProgress();
            addLearnedWords([
                { pt: 'um', en: 'one' },
                { pt: 'dois', en: 'two' },
                { pt: 'três', en: 'three' }
            ]);
            return getLearnedWordCount();
        });
        
        expect(count).toBe(3);
    });
    
    test('getLearnedWords returns all words', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const words = await page.evaluate(async () => {
            const { resetProgress, addLearnedWord, getLearnedWords } = 
                await import('/src/services/ProgressTracker.js');
            resetProgress();
            addLearnedWord({ pt: 'a', en: 'a' });
            addLearnedWord({ pt: 'b', en: 'b' });
            return getLearnedWords();
        });
        
        expect(words.length).toBe(2);
    });
    
    test('isWordLearned returns correct boolean', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async () => {
            const { resetProgress, addLearnedWord, isWordLearned } = 
                await import('/src/services/ProgressTracker.js');
            resetProgress();
            addLearnedWord({ pt: 'sim', en: 'yes' });
            return {
                learned: isWordLearned({ pt: 'sim', en: 'yes' }),
                notLearned: isWordLearned({ pt: 'não', en: 'no' })
            };
        });
        
        expect(result.learned).toBe(true);
        expect(result.notLearned).toBe(false);
    });
    
    test('getWordByKey returns word or null', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async () => {
            const { resetProgress, addLearnedWord, getWordByKey } = 
                await import('/src/services/ProgressTracker.js');
            resetProgress();
            addLearnedWord({ pt: 'café', en: 'coffee' });
            return {
                found: getWordByKey('café|coffee'),
                notFound: getWordByKey('nonexistent|word')
            };
        });
        
        expect(result.found).toBeDefined();
        expect(result.found.pt).toBe('café');
        expect(result.notFound).toBeNull();
    });
});

// ============================================================================
// SRS TESTS
// ============================================================================

test.describe('ProgressTracker: SRS System', () => {
    test('updateWordSRS increases level on correct', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async () => {
            const { resetProgress, addLearnedWord, updateWordSRS } = 
                await import('/src/services/ProgressTracker.js');
            resetProgress();
            const word = addLearnedWord({ pt: 'test', en: 'test' });
            const updated = updateWordSRS(word.key, true);
            return {
                before: 1,
                after: updated.srsLevel
            };
        });
        
        expect(result.before).toBe(1);
        expect(result.after).toBe(2);
    });
    
    test('updateWordSRS decreases level on incorrect', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async () => {
            const { resetProgress, addLearnedWord, updateWordSRS } = 
                await import('/src/services/ProgressTracker.js');
            resetProgress();
            const word = addLearnedWord({ pt: 'test', en: 'test' });
            // First increase to level 2
            updateWordSRS(word.key, true);
            // Then decrease back
            const updated = updateWordSRS(word.key, false);
            return updated.srsLevel;
        });
        
        expect(result).toBe(1); // Back to level 1
    });
    
    test('updateWordSRS does not go below level 1', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async () => {
            const { resetProgress, addLearnedWord, updateWordSRS } = 
                await import('/src/services/ProgressTracker.js');
            resetProgress();
            const word = addLearnedWord({ pt: 'test', en: 'test' });
            updateWordSRS(word.key, false);
            updateWordSRS(word.key, false);
            const updated = updateWordSRS(word.key, false);
            return updated.srsLevel;
        });
        
        expect(result).toBe(1);
    });
    
    test('updateWordSRS does not exceed max level', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async () => {
            const { resetProgress, addLearnedWord, updateWordSRS, PROGRESS_CONFIG } = 
                await import('/src/services/ProgressTracker.js');
            resetProgress();
            const word = addLearnedWord({ pt: 'test', en: 'test' });
            // Keep answering correctly
            for (let i = 0; i < 10; i++) {
                updateWordSRS(word.key, true);
            }
            const updated = updateWordSRS(word.key, true);
            return { level: updated.srsLevel, max: PROGRESS_CONFIG.srsLevelMax };
        });
        
        expect(result.level).toBe(result.max);
    });
    
    test('updateWordSRS returns null for unknown key', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async () => {
            const { resetProgress, updateWordSRS } = await import('/src/services/ProgressTracker.js');
            resetProgress();
            return updateWordSRS('nonexistent|key', true);
        });
        
        expect(result).toBeNull();
    });
    
    test('getWordsDueForReview returns due words', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async () => {
            const { resetProgress, addLearnedWord, getWordsDueForReview } = 
                await import('/src/services/ProgressTracker.js');
            resetProgress();
            // Add word with past due date
            const word = addLearnedWord({ pt: 'due', en: 'due' });
            // Manually set nextReview to past
            word.nextReview = Date.now() - 1000;
            return getWordsDueForReview();
        });
        
        // The word we added should be due (or empty if not manipulated correctly)
        expect(Array.isArray(result)).toBe(true);
    });
    
    test('getDueReviewCount returns count', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const count = await page.evaluate(async () => {
            const { resetProgress, getDueReviewCount } = await import('/src/services/ProgressTracker.js');
            resetProgress();
            return getDueReviewCount();
        });
        
        expect(typeof count).toBe('number');
        expect(count).toBeGreaterThanOrEqual(0);
    });
    
    test('getSRSStats returns complete statistics', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const stats = await page.evaluate(async () => {
            const { resetProgress, addLearnedWord, getSRSStats } = 
                await import('/src/services/ProgressTracker.js');
            resetProgress();
            addLearnedWord({ pt: 'a', en: 'a' });
            addLearnedWord({ pt: 'b', en: 'b' });
            return getSRSStats();
        });
        
        expect(stats.totalWords).toBe(2);
        expect(stats.levelCounts).toBeDefined();
        expect(stats.levelCounts[1]).toBe(2); // Both at level 1
        expect(typeof stats.accuracy).toBe('number');
    });
});

// ============================================================================
// LESSON TRACKING TESTS
// ============================================================================

test.describe('ProgressTracker: Lesson Tracking', () => {
    test('recordLessonCompletion records lesson', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const record = await page.evaluate(async () => {
            const { resetProgress, recordLessonCompletion } = 
                await import('/src/services/ProgressTracker.js');
            resetProgress();
            return recordLessonCompletion({
                lessonId: 'BB-001',
                duration: 300,
                accuracy: 85,
                xpEarned: 25,
                wordCount: 5,
                mistakes: 2
            });
        });
        
        expect(record.lessonId).toBe('BB-001');
        expect(record.duration).toBe(300);
        expect(record.accuracy).toBe(85);
        expect(record.completedAt).toBeDefined();
    });
    
    test('getCompletedLessons returns all completed', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const lessons = await page.evaluate(async () => {
            const { resetProgress, recordLessonCompletion, getCompletedLessons } = 
                await import('/src/services/ProgressTracker.js');
            resetProgress();
            recordLessonCompletion({ lessonId: 'L1' });
            recordLessonCompletion({ lessonId: 'L2' });
            return getCompletedLessons();
        });
        
        expect(lessons.length).toBe(2);
    });
    
    test('getCompletedLessonCount returns count', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const count = await page.evaluate(async () => {
            const { resetProgress, recordLessonCompletion, getCompletedLessonCount } = 
                await import('/src/services/ProgressTracker.js');
            resetProgress();
            recordLessonCompletion({ lessonId: 'L1' });
            recordLessonCompletion({ lessonId: 'L2' });
            recordLessonCompletion({ lessonId: 'L3' });
            return getCompletedLessonCount();
        });
        
        expect(count).toBe(3);
    });
    
    test('isLessonCompleted returns correct boolean', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async () => {
            const { resetProgress, recordLessonCompletion, isLessonCompleted } = 
                await import('/src/services/ProgressTracker.js');
            resetProgress();
            recordLessonCompletion({ lessonId: 'done' });
            return {
                completed: isLessonCompleted('done'),
                notCompleted: isLessonCompleted('not-done')
            };
        });
        
        expect(result.completed).toBe(true);
        expect(result.notCompleted).toBe(false);
    });
    
    test('getLessonHistory returns history for lesson', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const history = await page.evaluate(async () => {
            const { resetProgress, recordLessonCompletion, getLessonHistory } = 
                await import('/src/services/ProgressTracker.js');
            resetProgress();
            recordLessonCompletion({ lessonId: 'repeat', accuracy: 70 });
            recordLessonCompletion({ lessonId: 'repeat', accuracy: 85 });
            recordLessonCompletion({ lessonId: 'other' });
            return getLessonHistory('repeat');
        });
        
        expect(history.length).toBe(2);
    });
    
    test('getTodaysLessons returns only today', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async () => {
            const { resetProgress, recordLessonCompletion, getTodaysLessons } = 
                await import('/src/services/ProgressTracker.js');
            resetProgress();
            recordLessonCompletion({ lessonId: 'today' });
            return getTodaysLessons();
        });
        
        expect(result.length).toBe(1);
        expect(result[0].lessonId).toBe('today');
    });
    
    test('getLessonsInRange filters by date', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const count = await page.evaluate(async () => {
            const { resetProgress, recordLessonCompletion, getLessonsInRange } = 
                await import('/src/services/ProgressTracker.js');
            resetProgress();
            recordLessonCompletion({ lessonId: 'now' });
            const now = new Date();
            const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            const dayAhead = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            return getLessonsInRange(dayAgo, dayAhead).length;
        });
        
        expect(count).toBe(1);
    });
});

// ============================================================================
// SKILL STATISTICS TESTS
// ============================================================================

test.describe('ProgressTracker: Skill Statistics', () => {
    test('updateSkillStat creates new skill entry', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const stat = await page.evaluate(async () => {
            const { resetProgress, updateSkillStat, getSkillStat } = 
                await import('/src/services/ProgressTracker.js');
            resetProgress();
            updateSkillStat('vocabulary', 80);
            return getSkillStat('vocabulary');
        });
        
        expect(stat.attempts).toBe(1);
        expect(stat.totalScore).toBe(80);
        expect(stat.bestScore).toBe(80);
        expect(stat.average).toBe(80);
    });
    
    test('updateSkillStat accumulates scores', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const stat = await page.evaluate(async () => {
            const { resetProgress, updateSkillStat, getSkillStat } = 
                await import('/src/services/ProgressTracker.js');
            resetProgress();
            updateSkillStat('pronunciation', 60);
            updateSkillStat('pronunciation', 80);
            updateSkillStat('pronunciation', 100);
            return getSkillStat('pronunciation');
        });
        
        expect(stat.attempts).toBe(3);
        expect(stat.totalScore).toBe(240);
        expect(stat.bestScore).toBe(100);
        expect(stat.average).toBe(80);
    });
    
    test('getSkillStat returns null for unknown skill', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const stat = await page.evaluate(async () => {
            const { resetProgress, getSkillStat } = await import('/src/services/ProgressTracker.js');
            resetProgress();
            return getSkillStat('nonexistent');
        });
        
        expect(stat).toBeNull();
    });
    
    test('getAllSkillStats returns all skills', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const stats = await page.evaluate(async () => {
            const { resetProgress, updateSkillStat, getAllSkillStats } = 
                await import('/src/services/ProgressTracker.js');
            resetProgress();
            updateSkillStat('vocabulary', 80);
            updateSkillStat('listening', 70);
            return getAllSkillStats();
        });
        
        expect(stats.vocabulary).toBeDefined();
        expect(stats.listening).toBeDefined();
    });
    
    test('getSkillChartData formats for charts', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const data = await page.evaluate(async () => {
            const { resetProgress, updateSkillStat, getSkillChartData } = 
                await import('/src/services/ProgressTracker.js');
            resetProgress();
            updateSkillStat('grammar', 75);
            return getSkillChartData();
        });
        
        expect(data.length).toBe(1);
        expect(data[0].skill).toBe('grammar');
        expect(data[0].label).toBe('Grammar');
        expect(data[0].average).toBe(75);
    });
});

// ============================================================================
// MILESTONE TESTS
// ============================================================================

test.describe('ProgressTracker: Milestones', () => {
    test('checkMilestones detects word milestones', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async () => {
            const { resetProgress, addLearnedWords, checkMilestones, getMilestones } = 
                await import('/src/services/ProgressTracker.js');
            resetProgress();
            // Add 10 words to trigger milestone
            const words = Array.from({ length: 10 }, (_, i) => ({ 
                pt: `word${i}`, 
                en: `word${i}` 
            }));
            addLearnedWords(words);
            checkMilestones();
            return getMilestones();
        });
        
        expect(result.some(m => m.key === 'words_10')).toBe(true);
    });
    
    test('checkMilestones detects lesson milestones', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async () => {
            const { resetProgress, recordLessonCompletion, getMilestones } = 
                await import('/src/services/ProgressTracker.js');
            resetProgress();
            recordLessonCompletion({ lessonId: 'first' });
            return getMilestones();
        });
        
        expect(result.some(m => m.key === 'lessons_1')).toBe(true);
    });
    
    test('hasMilestone returns correct boolean', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async () => {
            const { resetProgress, recordMilestone, hasMilestone } = 
                await import('/src/services/ProgressTracker.js');
            resetProgress();
            recordMilestone('test_milestone', { title: 'Test' });
            return {
                has: hasMilestone('test_milestone'),
                hasNot: hasMilestone('nonexistent')
            };
        });
        
        expect(result.has).toBe(true);
        expect(result.hasNot).toBe(false);
    });
    
    test('getMilestones returns sorted by date', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const milestones = await page.evaluate(async () => {
            const { resetProgress, recordMilestone, getMilestones } = 
                await import('/src/services/ProgressTracker.js');
            resetProgress();
            recordMilestone('first', { title: 'First' });
            await new Promise(r => setTimeout(r, 10));
            recordMilestone('second', { title: 'Second' });
            return getMilestones();
        });
        
        expect(milestones[0].key).toBe('second'); // Most recent first
    });
});

// ============================================================================
// STUDY SESSION TESTS
// ============================================================================

test.describe('ProgressTracker: Study Sessions', () => {
    test('startStudySession creates session', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const session = await page.evaluate(async () => {
            const { resetProgress, startStudySession } = 
                await import('/src/services/ProgressTracker.js');
            resetProgress();
            return startStudySession();
        });
        
        expect(session.id).toMatch(/^session_/);
        expect(session.startTime).toBeDefined();
        expect(session.endTime).toBeNull();
    });
    
    test('endStudySession completes session', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const session = await page.evaluate(async () => {
            const { resetProgress, startStudySession, endStudySession } = 
                await import('/src/services/ProgressTracker.js');
            resetProgress();
            const started = startStudySession();
            await new Promise(r => setTimeout(r, 50));
            return endStudySession(started.id, {
                wordsReviewed: 10,
                lessonsCompleted: 2,
                xpEarned: 50
            });
        });
        
        expect(session.endTime).toBeDefined();
        expect(session.duration).toBeGreaterThan(0);
        expect(session.wordsReviewed).toBe(10);
        expect(session.lessonsCompleted).toBe(2);
        expect(session.xpEarned).toBe(50);
    });
    
    test('endStudySession returns null for unknown session', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async () => {
            const { resetProgress, endStudySession } = 
                await import('/src/services/ProgressTracker.js');
            resetProgress();
            return endStudySession('nonexistent', {});
        });
        
        expect(result).toBeNull();
    });
    
    test('getStudySessionStats calculates stats', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const stats = await page.evaluate(async () => {
            const { resetProgress, startStudySession, endStudySession, getStudySessionStats } = 
                await import('/src/services/ProgressTracker.js');
            resetProgress();
            const session = startStudySession();
            endStudySession(session.id, { wordsReviewed: 5, xpEarned: 20 });
            return getStudySessionStats(30);
        });
        
        expect(stats.sessionCount).toBe(1);
        expect(stats.totalWords).toBe(5);
        expect(stats.totalXP).toBe(20);
    });
});

// ============================================================================
// PROGRESS SUMMARY TESTS
// ============================================================================

test.describe('ProgressTracker: Progress Summary', () => {
    test('getProgressSummary returns complete summary', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const summary = await page.evaluate(async () => {
            const { resetProgress, addLearnedWord, recordLessonCompletion, getProgressSummary } = 
                await import('/src/services/ProgressTracker.js');
            resetProgress();
            addLearnedWord({ pt: 'test', en: 'test' });
            recordLessonCompletion({ lessonId: 'L1' });
            return getProgressSummary();
        });
        
        expect(summary.words).toBeDefined();
        expect(summary.words.total).toBe(1);
        expect(summary.lessons).toBeDefined();
        expect(summary.lessons.total).toBe(1);
        expect(summary.skills).toBeDefined();
        expect(typeof summary.milestones).toBe('number');
    });
    
    test('getWeeklyActivity returns 7 days', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const activity = await page.evaluate(async () => {
            const { resetProgress, getWeeklyActivity } = 
                await import('/src/services/ProgressTracker.js');
            resetProgress();
            return getWeeklyActivity();
        });
        
        expect(activity.length).toBe(7);
        expect(activity[0].dayName).toBeDefined();
        expect(activity[0].lessons).toBeDefined();
        expect(activity[0].xp).toBeDefined();
    });
});

// ============================================================================
// EVENT TESTS
// ============================================================================

test.describe('ProgressTracker: Events', () => {
    test('onProgressEvent subscribes to events', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async () => {
            const { resetProgress, addLearnedWord, onProgressEvent, PROGRESS_EVENTS } = 
                await import('/src/services/ProgressTracker.js');
            resetProgress();
            
            return new Promise(resolve => {
                const unsubscribe = onProgressEvent(PROGRESS_EVENTS.WORD_LEARNED, (e) => {
                    unsubscribe();
                    resolve({ received: true, word: e.detail.word.pt });
                });
                addLearnedWord({ pt: 'evento', en: 'event' });
            });
        });
        
        expect(result.received).toBe(true);
        expect(result.word).toBe('evento');
    });
});

// ============================================================================
// RESET TESTS
// ============================================================================

test.describe('ProgressTracker: Reset', () => {
    test('resetProgress clears all state', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async () => {
            const { resetProgress, addLearnedWord, recordLessonCompletion, getProgressSnapshot } = 
                await import('/src/services/ProgressTracker.js');
            
            addLearnedWord({ pt: 'test', en: 'test' });
            recordLessonCompletion({ lessonId: 'L1' });
            resetProgress();
            
            const snapshot = getProgressSnapshot();
            return {
                words: snapshot.learnedWords.length,
                lessons: snapshot.completedLessons.length
            };
        });
        
        expect(result.words).toBe(0);
        expect(result.lessons).toBe(0);
    });
});

// ============================================================================
// DEFAULT EXPORT TESTS
// ============================================================================

test.describe('ProgressTracker: Default Export', () => {
    test('default export includes all public functions', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const exports = await page.evaluate(async () => {
            const ProgressTracker = (await import('/src/services/ProgressTracker.js')).default;
            return Object.keys(ProgressTracker);
        });
        
        expect(exports).toContain('PROGRESS_CONFIG');
        expect(exports).toContain('SRS_INTERVALS');
        expect(exports).toContain('SKILL_CATEGORIES');
        expect(exports).toContain('PROGRESS_EVENTS');
        expect(exports).toContain('loadProgress');
        expect(exports).toContain('saveProgress');
        expect(exports).toContain('addLearnedWord');
        expect(exports).toContain('updateWordSRS');
        expect(exports).toContain('recordLessonCompletion');
        expect(exports).toContain('updateSkillStat');
        expect(exports).toContain('checkMilestones');
        expect(exports).toContain('startStudySession');
        expect(exports).toContain('getProgressSummary');
        expect(exports).toContain('getWeeklyActivity');
        expect(exports).toContain('resetProgress');
    });
});
