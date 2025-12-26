/**
 * Building Blocks Lessons Unit Tests
 * 
 * Tests for the new Building Blocks lesson structure
 */

import { test, expect } from '@playwright/test';

const HOME_URL = 'http://localhost:4321/';

// Helper to run code in page context
async function evalInPage(page, fn, ...args) {
    return page.evaluate(fn, ...args);
}

test.beforeEach(async ({ page }) => {
    await page.goto(HOME_URL);
});

test.describe('Building Blocks: Pronouns Lesson', () => {
    
    test('BB-001: Pronouns lesson has required structure', async ({ page }) => {
        const lesson = await evalInPage(page, async () => {
            const { pronounsLesson } = await import('/src/data/building-blocks/index.js');
            return pronounsLesson;
        });
        
        expect(lesson).toBeDefined();
        expect(lesson.id).toBe('bb-001');
        expect(lesson.title).toBe('Personal Pronouns');
        expect(lesson.tier).toBe(1);
        expect(lesson.level).toBe('beginner');
    });
    
    test('BB-002: Pronouns lesson has all 8 pronouns', async ({ page }) => {
        const words = await evalInPage(page, async () => {
            const { pronounsLesson } = await import('/src/data/building-blocks/index.js');
            return pronounsLesson.words;
        });
        
        expect(words).toHaveLength(8);
        
        const pronouns = words.map(w => w.pt);
        expect(pronouns).toContain('eu');
        expect(pronouns).toContain('tu');
        expect(pronouns).toContain('você');
        expect(pronouns).toContain('ele');
        expect(pronouns).toContain('ela');
        expect(pronouns).toContain('nós');
        expect(pronouns).toContain('eles');
        expect(pronouns).toContain('elas');
    });
    
    test('BB-003: Each pronoun has required properties', async ({ page }) => {
        const words = await evalInPage(page, async () => {
            const { pronounsLesson } = await import('/src/data/building-blocks/index.js');
            return pronounsLesson.words;
        });
        
        words.forEach(word => {
            expect(word).toHaveProperty('pt');
            expect(word).toHaveProperty('en');
            expect(word).toHaveProperty('audio');
            expect(word).toHaveProperty('pronunciation');
            expect(word).toHaveProperty('grammarNotes');
            expect(word).toHaveProperty('examples');
        });
    });
    
    test('BB-004: Each pronoun has example sentences', async ({ page }) => {
        const words = await evalInPage(page, async () => {
            const { pronounsLesson } = await import('/src/data/building-blocks/index.js');
            return pronounsLesson.words;
        });
        
        words.forEach(word => {
            expect(word.examples).toBeDefined();
            expect(Array.isArray(word.examples)).toBe(true);
            expect(word.examples.length).toBeGreaterThan(0);
            
            word.examples.forEach(ex => {
                expect(ex).toHaveProperty('pt');
                expect(ex).toHaveProperty('en');
            });
        });
    });
    
    test('BB-005: Pronouns lesson has challenges', async ({ page }) => {
        const challenges = await evalInPage(page, async () => {
            const { pronounsLesson } = await import('/src/data/building-blocks/index.js');
            return pronounsLesson.challenges;
        });
        
        expect(challenges).toBeDefined();
        expect(Array.isArray(challenges)).toBe(true);
        expect(challenges.length).toBeGreaterThan(0);
    });
    
    test('BB-006: Multiple choice challenges have correct structure', async ({ page }) => {
        const challenges = await evalInPage(page, async () => {
            const { pronounsLesson } = await import('/src/data/building-blocks/index.js');
            return pronounsLesson.challenges.filter(c => c.type === 'multiple-choice');
        });
        
        challenges.forEach(challenge => {
            expect(challenge).toHaveProperty('question');
            expect(challenge).toHaveProperty('options');
            expect(challenge).toHaveProperty('correct');
            expect(challenge).toHaveProperty('explanation');
            expect(Array.isArray(challenge.options)).toBe(true);
            expect(challenge.options.length).toBe(4);
            expect(typeof challenge.correct).toBe('number');
        });
    });
    
    test('BB-007: Translation challenges have correct structure', async ({ page }) => {
        const challenges = await evalInPage(page, async () => {
            const { pronounsLesson } = await import('/src/data/building-blocks/index.js');
            return pronounsLesson.challenges.filter(c => c.type === 'translate');
        });
        
        challenges.forEach(challenge => {
            expect(challenge).toHaveProperty('prompt');
            expect(challenge).toHaveProperty('answer');
            expect(challenge).toHaveProperty('hints');
            expect(Array.isArray(challenge.hints)).toBe(true);
        });
    });
    
    test('BB-008: Fill-blank challenges have correct structure', async ({ page }) => {
        const challenges = await evalInPage(page, async () => {
            const { pronounsLesson } = await import('/src/data/building-blocks/index.js');
            return pronounsLesson.challenges.filter(c => c.type === 'fill-blank');
        });
        
        challenges.forEach(challenge => {
            expect(challenge).toHaveProperty('sentence');
            expect(challenge).toHaveProperty('options');
            expect(challenge).toHaveProperty('correct');
            expect(challenge).toHaveProperty('explanation');
        });
    });
    
    test('BB-009: Pronouns lesson has quick reference', async ({ page }) => {
        const quickRef = await evalInPage(page, async () => {
            const { pronounsLesson } = await import('/src/data/building-blocks/index.js');
            return pronounsLesson.quickReference;
        });
        
        expect(quickRef).toBeDefined();
        expect(quickRef).toHaveProperty('singular');
        expect(quickRef).toHaveProperty('plural');
        expect(quickRef.singular.length).toBe(5);
        expect(quickRef.plural.length).toBe(3);
    });
    
    test('BB-010: Pronouns lesson has no prerequisites', async ({ page }) => {
        const prerequisites = await evalInPage(page, async () => {
            const { pronounsLesson } = await import('/src/data/building-blocks/index.js');
            return pronounsLesson.prerequisites;
        });
        
        expect(prerequisites).toBeDefined();
        expect(Array.isArray(prerequisites)).toBe(true);
        expect(prerequisites.length).toBe(0);
    });
    
    test('BB-011: Building blocks topic is defined', async ({ page }) => {
        const topic = await evalInPage(page, async () => {
            const { buildingBlocksTopic } = await import('/src/data/building-blocks/index.js');
            return {
                id: buildingBlocksTopic.id,
                title: buildingBlocksTopic.title,
                tier: buildingBlocksTopic.tier,
                order: buildingBlocksTopic.order,
                lessonCount: buildingBlocksTopic.lessons.length
            };
        });
        
        expect(topic.id).toBe('building-blocks');
        expect(topic.title).toBe('Building Blocks');
        expect(topic.tier).toBe(1);
        expect(topic.order).toBe(0);
        expect(topic.lessonCount).toBeGreaterThan(0);
    });
    
    test('BB-012: getBuildingBlockLessons returns lessons array', async ({ page }) => {
        const lessons = await evalInPage(page, async () => {
            const { getBuildingBlockLessons } = await import('/src/data/building-blocks/index.js');
            return getBuildingBlockLessons();
        });
        
        expect(Array.isArray(lessons)).toBe(true);
        expect(lessons.length).toBeGreaterThan(0);
    });
    
    test('BB-013: getBuildingBlockLesson finds lesson by ID', async ({ page }) => {
        const lesson = await evalInPage(page, async () => {
            const { getBuildingBlockLesson } = await import('/src/data/building-blocks/index.js');
            return getBuildingBlockLesson('bb-001');
        });
        
        expect(lesson).toBeDefined();
        expect(lesson.id).toBe('bb-001');
        expect(lesson.title).toBe('Personal Pronouns');
    });
    
    test('BB-014: getBuildingBlockLesson returns null for unknown ID', async ({ page }) => {
        const lesson = await evalInPage(page, async () => {
            const { getBuildingBlockLesson } = await import('/src/data/building-blocks/index.js');
            return getBuildingBlockLesson('unknown-id');
        });
        
        expect(lesson).toBeNull();
    });
    
    test('BB-015: arePrerequisitesMet works correctly', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { arePrerequisitesMet } = await import('/src/data/building-blocks/index.js');
            // bb-001 has no prerequisites, so should always return true
            return arePrerequisitesMet('bb-001', []);
        });
        
        expect(result).toBe(true);
    });
    
});
