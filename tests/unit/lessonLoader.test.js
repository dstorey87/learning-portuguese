/**
 * LessonLoader Tests
 * 
 * Tests for unified lesson loading with proper ordering
 * and prerequisite system.
 */

import { test, expect } from '@playwright/test';

const HOME_URL = 'http://localhost:4321/';

test.beforeEach(async ({ page }) => {
    await page.goto(HOME_URL);
});

// ============================================================================
// TIER CONSTANTS
// ============================================================================

test.describe('LessonLoader: LESSON_TIERS', () => {
    test('should have correct tier values', async ({ page }) => {
        const tiers = await page.evaluate(async () => {
            const { LESSON_TIERS } = await import('/src/data/LessonLoader.js');
            return LESSON_TIERS;
        });

        expect(tiers.BUILDING_BLOCKS).toBe(1);
        expect(tiers.ESSENTIAL).toBe(2);
        expect(tiers.DAILY_TOPICS).toBe(3);
        expect(tiers.ADVANCED).toBe(4);
    });
});

// ============================================================================
// TOPIC LOADING
// ============================================================================

test.describe('LessonLoader: getAllTopics', () => {
    test('should return array of topics', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { getAllTopics, clearCache } = await import('/src/data/LessonLoader.js');
            clearCache();
            const topics = getAllTopics();
            return { isArray: Array.isArray(topics), length: topics.length };
        });

        expect(result.isArray).toBe(true);
        expect(result.length).toBeGreaterThan(0);
    });

    test('should have building-blocks as first topic', async ({ page }) => {
        const firstTopicId = await page.evaluate(async () => {
            const { getAllTopics, clearCache } = await import('/src/data/LessonLoader.js');
            clearCache();
            return getAllTopics()[0].id;
        });

        expect(firstTopicId).toBe('building-blocks');
    });

    test('should sort topics by tier', async ({ page }) => {
        const isSorted = await page.evaluate(async () => {
            const { getAllTopics, clearCache } = await import('/src/data/LessonLoader.js');
            clearCache();
            const topics = getAllTopics();
            for (let i = 1; i < topics.length; i++) {
                const prevTier = topics[i - 1].tier || 99;
                const currTier = topics[i].tier || 99;
                if (prevTier > currTier) return false;
            }
            return true;
        });

        expect(isSorted).toBe(true);
    });
});

test.describe('LessonLoader: getTopicById', () => {
    test('should return topic by ID', async ({ page }) => {
        const topic = await page.evaluate(async () => {
            const { getTopicById, clearCache } = await import('/src/data/LessonLoader.js');
            clearCache();
            return getTopicById('building-blocks');
        });

        expect(topic).not.toBeNull();
        expect(topic.id).toBe('building-blocks');
    });

    test('should return null for invalid ID', async ({ page }) => {
        const topic = await page.evaluate(async () => {
            const { getTopicById, clearCache } = await import('/src/data/LessonLoader.js');
            clearCache();
            return getTopicById('nonexistent');
        });

        expect(topic).toBeNull();
    });
});

// ============================================================================
// LESSON LOADING
// ============================================================================

test.describe('LessonLoader: getAllLessons', () => {
    test('should return array of lessons', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { getAllLessons, clearCache } = await import('/src/data/LessonLoader.js');
            clearCache();
            const lessons = getAllLessons();
            return { isArray: Array.isArray(lessons), length: lessons.length };
        });

        expect(result.isArray).toBe(true);
        expect(result.length).toBeGreaterThan(0);
    });

    test('should have building blocks lessons first', async ({ page }) => {
        const first = await page.evaluate(async () => {
            const { getAllLessons, LESSON_TIERS, clearCache } = await import('/src/data/LessonLoader.js');
            clearCache();
            const lessons = getAllLessons();
            return { tier: lessons[0].tier, topicId: lessons[0].topicId, expected: LESSON_TIERS.BUILDING_BLOCKS };
        });

        expect(first.tier).toBe(first.expected);
        expect(first.topicId).toBe('building-blocks');
    });

    test('should include 10 building blocks lessons', async ({ page }) => {
        const count = await page.evaluate(async () => {
            const { getAllLessons, clearCache } = await import('/src/data/LessonLoader.js');
            clearCache();
            return getAllLessons().filter(l => l.topicId === 'building-blocks').length;
        });

        expect(count).toBe(10);
    });

    test('should include legacy lessons', async ({ page }) => {
        const count = await page.evaluate(async () => {
            const { getAllLessons, clearCache } = await import('/src/data/LessonLoader.js');
            clearCache();
            return getAllLessons().filter(l => l.topicId !== 'building-blocks').length;
        });

        expect(count).toBeGreaterThan(0);
    });
});

test.describe('LessonLoader: getLessonById', () => {
    test('should return lesson by string ID', async ({ page }) => {
        const lesson = await page.evaluate(async () => {
            const { getLessonById, clearCache } = await import('/src/data/LessonLoader.js');
            clearCache();
            return getLessonById('bb-001');
        });

        expect(lesson).not.toBeNull();
        expect(lesson.id).toBe('bb-001');
    });

    test('should return lesson by numeric ID', async ({ page }) => {
        const lesson = await page.evaluate(async () => {
            const { getLessonById, clearCache } = await import('/src/data/LessonLoader.js');
            clearCache();
            return getLessonById(1);
        });

        expect(lesson).not.toBeNull();
    });

    test('should be case insensitive', async ({ page }) => {
        const lesson = await page.evaluate(async () => {
            const { getLessonById, clearCache } = await import('/src/data/LessonLoader.js');
            clearCache();
            return getLessonById('BB-001');
        });

        expect(lesson).not.toBeNull();
        expect(lesson.id).toBe('bb-001');
    });

    test('should return null for invalid ID', async ({ page }) => {
        const lesson = await page.evaluate(async () => {
            const { getLessonById, clearCache } = await import('/src/data/LessonLoader.js');
            clearCache();
            return getLessonById('nonexistent');
        });

        expect(lesson).toBeNull();
    });
});

// ============================================================================
// LESSON IMAGES
// ============================================================================

test.describe('LessonLoader: getLessonImage', () => {
    test('should include English words in the remote image query', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { getLessonImage } = await import('/src/data/LessonLoader.js');
            const lesson = {
                id: 'test-lesson',
                title: 'Image Keyword Test',
                topicId: 'travel',
                words: [
                    { pt: 'comboio', en: 'Train' },
                    { pt: 'bilhete', en: 'Ticket' }
                ]
            };

            const image = getLessonImage(lesson);
            return image.remoteUrl || image.url;
        });

        const url = (result || '').toLowerCase();
        expect(url).toContain('train');
        expect(url).toContain('ticket');
    });
});

test.describe('LessonLoader: getLessonsByTopic', () => {
    test('should return lessons for building-blocks topic', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { getLessonsByTopic, clearCache } = await import('/src/data/LessonLoader.js');
            clearCache();
            const lessons = getLessonsByTopic('building-blocks');
            return { length: lessons.length, allMatch: lessons.every(l => l.topicId === 'building-blocks') };
        });

        expect(result.length).toBe(10);
        expect(result.allMatch).toBe(true);
    });

    test('should return lessons for greetings topic', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { getLessonsByTopic, clearCache } = await import('/src/data/LessonLoader.js');
            clearCache();
            const lessons = getLessonsByTopic('greetings');
            return { length: lessons.length, allMatch: lessons.every(l => l.topicId === 'greetings') };
        });

        expect(result.length).toBeGreaterThan(0);
        expect(result.allMatch).toBe(true);
    });

    test('should return empty array for invalid topic', async ({ page }) => {
        const length = await page.evaluate(async () => {
            const { getLessonsByTopic, clearCache } = await import('/src/data/LessonLoader.js');
            clearCache();
            return getLessonsByTopic('nonexistent').length;
        });

        expect(length).toBe(0);
    });
});

test.describe('LessonLoader: getLessonsByTier', () => {
    test('should return building blocks for tier 1', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { getLessonsByTier, LESSON_TIERS, clearCache } = await import('/src/data/LessonLoader.js');
            clearCache();
            const lessons = getLessonsByTier(LESSON_TIERS.BUILDING_BLOCKS);
            return { length: lessons.length, allMatch: lessons.every(l => l.tier === LESSON_TIERS.BUILDING_BLOCKS) };
        });

        expect(result.length).toBe(10);
        expect(result.allMatch).toBe(true);
    });

    test('should return essential lessons for tier 2', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { getLessonsByTier, LESSON_TIERS, clearCache } = await import('/src/data/LessonLoader.js');
            clearCache();
            const lessons = getLessonsByTier(LESSON_TIERS.ESSENTIAL);
            return { length: lessons.length, allMatch: lessons.every(l => l.tier === LESSON_TIERS.ESSENTIAL) };
        });

        expect(result.length).toBeGreaterThan(0);
        expect(result.allMatch).toBe(true);
    });
});

// ============================================================================
// PREREQUISITE SYSTEM
// ============================================================================

test.describe('LessonLoader: areBuildingBlocksComplete', () => {
    test('should return false when no lessons completed', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { areBuildingBlocksComplete, clearCache } = await import('/src/data/LessonLoader.js');
            clearCache();
            return areBuildingBlocksComplete([]);
        });

        expect(result).toBe(false);
    });

    test('should return false when partially completed', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { areBuildingBlocksComplete, clearCache } = await import('/src/data/LessonLoader.js');
            clearCache();
            return areBuildingBlocksComplete(['bb-001', 'bb-002', 'bb-003']);
        });

        expect(result).toBe(false);
    });

    test('should return true when all building blocks completed', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { areBuildingBlocksComplete, clearCache } = await import('/src/data/LessonLoader.js');
            clearCache();
            const allBB = ['bb-001', 'bb-002', 'bb-003', 'bb-004', 'bb-005',
                          'bb-006', 'bb-007', 'bb-008', 'bb-009', 'bb-010'];
            return areBuildingBlocksComplete(allBB);
        });

        expect(result).toBe(true);
    });
});

test.describe('LessonLoader: getBuildingBlocksProgress', () => {
    test('should return correct progress for no completions', async ({ page }) => {
        const progress = await page.evaluate(async () => {
            const { getBuildingBlocksProgress, clearCache } = await import('/src/data/LessonLoader.js');
            clearCache();
            return getBuildingBlocksProgress([]);
        });

        expect(progress.total).toBe(10);
        expect(progress.completed).toBe(0);
        expect(progress.remaining).toBe(10);
        expect(progress.percentage).toBe(0);
        expect(progress.isComplete).toBe(false);
    });

    test('should return correct progress for partial completions', async ({ page }) => {
        const progress = await page.evaluate(async () => {
            const { getBuildingBlocksProgress, clearCache } = await import('/src/data/LessonLoader.js');
            clearCache();
            return getBuildingBlocksProgress(['bb-001', 'bb-002']);
        });

        expect(progress.completed).toBe(2);
        expect(progress.remaining).toBe(8);
        expect(progress.percentage).toBe(20);
        expect(progress.isComplete).toBe(false);
    });

    test('should return complete status for all completions', async ({ page }) => {
        const progress = await page.evaluate(async () => {
            const { getBuildingBlocksProgress, clearCache } = await import('/src/data/LessonLoader.js');
            clearCache();
            const allBB = ['bb-001', 'bb-002', 'bb-003', 'bb-004', 'bb-005',
                          'bb-006', 'bb-007', 'bb-008', 'bb-009', 'bb-010'];
            return getBuildingBlocksProgress(allBB);
        });

        expect(progress.completed).toBe(10);
        expect(progress.remaining).toBe(0);
        expect(progress.percentage).toBe(100);
        expect(progress.isComplete).toBe(true);
    });
});

test.describe('LessonLoader: checkLessonAvailability', () => {
    test('should return unavailable for nonexistent lesson', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { checkLessonAvailability, clearCache } = await import('/src/data/LessonLoader.js');
            clearCache();
            return checkLessonAvailability('nonexistent', []);
        });

        expect(result.available).toBe(false);
        expect(result.reason).toBe('Lesson not found');
    });

    test('should return available for first building block', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { checkLessonAvailability, clearCache } = await import('/src/data/LessonLoader.js');
            clearCache();
            return checkLessonAvailability('bb-001', []);
        });

        expect(result.available).toBe(true);
        expect(result.reason).toBeNull();
    });

    test('should check building block prerequisites', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { checkLessonAvailability, clearCache } = await import('/src/data/LessonLoader.js');
            clearCache();
            const withoutPrereq = checkLessonAvailability('bb-002', []);
            const withPrereq = checkLessonAvailability('bb-002', ['bb-001']);
            return { withoutPrereq, withPrereq };
        });

        expect(result.withoutPrereq.available).toBe(false);
        expect(result.withPrereq.available).toBe(true);
    });

    test('should block gated content without building blocks', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { checkLessonAvailability, clearCache } = await import('/src/data/LessonLoader.js');
            clearCache();
            return checkLessonAvailability(2, []);
        });

        expect(result.available).toBe(false);
    });

    test('should allow gated content after building blocks complete', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { checkLessonAvailability, clearCache } = await import('/src/data/LessonLoader.js');
            clearCache();
            const allBB = ['bb-001', 'bb-002', 'bb-003', 'bb-004', 'bb-005',
                          'bb-006', 'bb-007', 'bb-008', 'bb-009', 'bb-010'];
            return checkLessonAvailability(2, allBB);
        });

        expect(result.available).toBe(true);
    });
});

test.describe('LessonLoader: getNextRecommendedLesson', () => {
    test('should recommend first building block for new users', async ({ page }) => {
        const next = await page.evaluate(async () => {
            const { getNextRecommendedLesson, clearCache } = await import('/src/data/LessonLoader.js');
            clearCache();
            return getNextRecommendedLesson([]);
        });

        expect(next).not.toBeNull();
        expect(next.id).toBe('bb-001');
    });

    test('should recommend second building block after first', async ({ page }) => {
        const next = await page.evaluate(async () => {
            const { getNextRecommendedLesson, clearCache } = await import('/src/data/LessonLoader.js');
            clearCache();
            return getNextRecommendedLesson(['bb-001']);
        });

        expect(next).not.toBeNull();
        expect(next.id).toBe('bb-002');
    });
});

test.describe('LessonLoader: getAvailableLessons', () => {
    test('should return only available lessons', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { getAvailableLessons, clearCache } = await import('/src/data/LessonLoader.js');
            clearCache();
            const available = getAvailableLessons([]);
            return { length: available.length, firstId: available[0]?.id };
        });

        expect(result.length).toBeGreaterThan(0);
        expect(result.firstId).toBe('bb-001');
    });

    test('should not include completed lessons', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { getAvailableLessons, clearCache } = await import('/src/data/LessonLoader.js');
            clearCache();
            const available = getAvailableLessons(['bb-001']);
            return available.map(l => l.id);
        });

        expect(result).not.toContain('bb-001');
    });
});

// ============================================================================
// STATS
// ============================================================================

test.describe('LessonLoader: getProgressStats', () => {
    test('should return correct stats for new users', async ({ page }) => {
        const stats = await page.evaluate(async () => {
            const { getProgressStats, clearCache } = await import('/src/data/LessonLoader.js');
            clearCache();
            return getProgressStats([]);
        });

        expect(stats.total.completed).toBe(0);
        expect(stats.total.percentage).toBe(0);
        expect(stats.buildingBlocks.completed).toBe(0);
    });

    test('should return correct stats for partial progress', async ({ page }) => {
        const stats = await page.evaluate(async () => {
            const { getProgressStats, clearCache } = await import('/src/data/LessonLoader.js');
            clearCache();
            return getProgressStats(['bb-001', 'bb-002']);
        });

        expect(stats.buildingBlocks.completed).toBe(2);
        expect(stats.buildingBlocks.percentage).toBe(20);
    });

    test('should include all tier categories', async ({ page }) => {
        const stats = await page.evaluate(async () => {
            const { getProgressStats, clearCache } = await import('/src/data/LessonLoader.js');
            clearCache();
            const s = getProgressStats([]);
            return {
                hasTotal: !!s.total,
                hasBB: !!s.buildingBlocks,
                hasEssentials: !!s.essentials,
                hasDailyTopics: !!s.dailyTopics,
                hasAdvanced: !!s.advanced
            };
        });

        expect(stats.hasTotal).toBe(true);
        expect(stats.hasBB).toBe(true);
        expect(stats.hasEssentials).toBe(true);
        expect(stats.hasDailyTopics).toBe(true);
        expect(stats.hasAdvanced).toBe(true);
    });
});

// ============================================================================
// CACHE
// ============================================================================

test.describe('LessonLoader: clearCache', () => {
    test('should clear cached data', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { getAllTopics, clearCache } = await import('/src/data/LessonLoader.js');
            clearCache();
            const topics1 = getAllTopics();
            clearCache();
            const topics2 = getAllTopics();
            // Can't compare object identity in evaluate, but should work
            return { count1: topics1.length, count2: topics2.length };
        });

        expect(result.count1).toBe(result.count2);
    });
});
