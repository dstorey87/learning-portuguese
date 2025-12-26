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
});

test.describe('Building Blocks: Verb SER Lesson', () => {
    
    test('BB-SER-001: Ser lesson has required structure', async ({ page }) => {
        const lesson = await evalInPage(page, async () => {
            const { verbSerLesson } = await import('/src/data/building-blocks/index.js');
            return {
                id: verbSerLesson?.id,
                title: verbSerLesson?.title,
                tier: verbSerLesson?.tier,
                prerequisites: verbSerLesson?.prerequisites
            };
        });
        
        expect(lesson).toBeDefined();
        expect(lesson.id).toBe('bb-002');
    });
    
    test('BB-SER-002: Ser lesson has conjugation table', async ({ page }) => {
        const conjugation = await evalInPage(page, async () => {
            const { verbSerLesson } = await import('/src/data/building-blocks/index.js');
            return verbSerLesson?.conjugationTable;
        });
        
        expect(conjugation).toBeDefined();
        expect(conjugation.infinitive).toBe('ser');
        expect(conjugation.present).toHaveProperty('eu');
        expect(conjugation.present['eu']).toBe('sou');
    });
    
    test('BB-SER-003: Ser lesson has all forms', async ({ page }) => {
        const words = await evalInPage(page, async () => {
            const { verbSerLesson } = await import('/src/data/building-blocks/index.js');
            return verbSerLesson?.words?.map(w => w.pt);
        });
        
        expect(words).toContain('sou');
        expect(words).toContain('és');
        expect(words).toContain('é');
        expect(words).toContain('somos');
        expect(words).toContain('são');
    });
});

test.describe('Building Blocks: Verb ESTAR Lesson', () => {
    
    test('BB-ESTAR-001: Estar lesson has required structure', async ({ page }) => {
        const lesson = await evalInPage(page, async () => {
            const { verbEstarLesson } = await import('/src/data/building-blocks/index.js');
            return verbEstarLesson;
        });
        
        expect(lesson).toBeDefined();
        expect(lesson.id).toBe('bb-003');
    });
    
    test('BB-ESTAR-002: Estar lesson has comparison with SER', async ({ page }) => {
        const comparison = await evalInPage(page, async () => {
            const { verbEstarLesson } = await import('/src/data/building-blocks/index.js');
            return verbEstarLesson?.comparison;
        });
        
        expect(comparison).toBeDefined();
        expect(comparison.examples?.length).toBeGreaterThan(0);
    });
});

test.describe('Building Blocks: Verb TER Lesson', () => {
    
    test('BB-TER-001: Ter lesson has required structure', async ({ page }) => {
        const lesson = await evalInPage(page, async () => {
            const { verbTerLesson } = await import('/src/data/building-blocks/index.js');
            return verbTerLesson;
        });
        
        expect(lesson).toBeDefined();
        expect(lesson.id).toBe('bb-004');
    });
    
    test('BB-TER-002: Ter lesson has expressions section', async ({ page }) => {
        const expressions = await evalInPage(page, async () => {
            const { verbTerLesson } = await import('/src/data/building-blocks/index.js');
            return verbTerLesson?.expressions;
        });
        
        expect(expressions).toBeDefined();
        expect(expressions.list?.length).toBeGreaterThan(0);
    });
});

test.describe('Building Blocks: Articles Lesson', () => {
    
    test('BB-ART-001: Articles lesson has required structure', async ({ page }) => {
        const lesson = await evalInPage(page, async () => {
            const { articlesLesson } = await import('/src/data/building-blocks/index.js');
            return articlesLesson;
        });
        
        expect(lesson).toBeDefined();
        expect(lesson.id).toBe('bb-005');
    });
    
    test('BB-ART-002: Articles lesson has all 8 articles', async ({ page }) => {
        const words = await evalInPage(page, async () => {
            const { articlesLesson } = await import('/src/data/building-blocks/index.js');
            return articlesLesson?.words?.map(w => w.pt);
        });
        
        expect(words).toContain('o');
        expect(words).toContain('a');
        expect(words).toContain('os');
        expect(words).toContain('as');
        expect(words).toContain('um');
        expect(words).toContain('uma');
        expect(words).toContain('uns');
        expect(words).toContain('umas');
    });
});

test.describe('Building Blocks: Connectors Lesson', () => {
    
    test('BB-CONN-001: Connectors lesson has required structure', async ({ page }) => {
        const lesson = await evalInPage(page, async () => {
            const { connectorsLesson } = await import('/src/data/building-blocks/index.js');
            return connectorsLesson;
        });
        
        expect(lesson).toBeDefined();
        expect(lesson.id).toBe('bb-006');
    });
    
    test('BB-CONN-002: Connectors lesson has basic connectors', async ({ page }) => {
        const words = await evalInPage(page, async () => {
            const { connectorsLesson } = await import('/src/data/building-blocks/index.js');
            return connectorsLesson?.words?.map(w => w.pt);
        });
        
        expect(words).toContain('e');
        expect(words).toContain('ou');
        expect(words).toContain('mas');
        expect(words).toContain('porque');
    });
});

test.describe('Building Blocks: Prepositions Lesson', () => {
    
    test('BB-PREP-001: Prepositions lesson has required structure', async ({ page }) => {
        const lesson = await evalInPage(page, async () => {
            const { prepositionsLesson } = await import('/src/data/building-blocks/index.js');
            return prepositionsLesson;
        });
        
        expect(lesson).toBeDefined();
        expect(lesson.id).toBe('bb-007');
    });
    
    test('BB-PREP-002: Prepositions lesson has contractions table', async ({ page }) => {
        const table = await evalInPage(page, async () => {
            const { prepositionsLesson } = await import('/src/data/building-blocks/index.js');
            return prepositionsLesson?.contractionTable;
        });
        
        expect(table).toBeDefined();
        expect(table.rows?.length).toBeGreaterThan(0);
    });
});

test.describe('Building Blocks: Questions Lesson', () => {
    
    test('BB-QUEST-001: Questions lesson has required structure', async ({ page }) => {
        const lesson = await evalInPage(page, async () => {
            const { questionsLesson } = await import('/src/data/building-blocks/index.js');
            return questionsLesson;
        });
        
        expect(lesson).toBeDefined();
        expect(lesson.id).toBe('bb-008');
    });
    
    test('BB-QUEST-002: Questions lesson has question patterns', async ({ page }) => {
        const patterns = await evalInPage(page, async () => {
            const { questionsLesson } = await import('/src/data/building-blocks/index.js');
            return questionsLesson?.questionPatterns;
        });
        
        expect(patterns).toBeDefined();
        expect(patterns.patterns?.length).toBeGreaterThan(0);
    });
});

test.describe('Building Blocks: Negation Lesson', () => {
    
    test('BB-NEG-001: Negation lesson has required structure', async ({ page }) => {
        const lesson = await evalInPage(page, async () => {
            const { negationLesson } = await import('/src/data/building-blocks/index.js');
            return negationLesson;
        });
        
        expect(lesson).toBeDefined();
        expect(lesson.id).toBe('bb-009');
    });
    
    test('BB-NEG-002: Negation lesson has negation patterns', async ({ page }) => {
        const patterns = await evalInPage(page, async () => {
            const { negationLesson } = await import('/src/data/building-blocks/index.js');
            return negationLesson?.negationPatterns;
        });
        
        expect(patterns).toBeDefined();
        expect(patterns.patterns?.length).toBeGreaterThan(0);
    });
});

test.describe('Building Blocks: Possessives Lesson', () => {
    
    test('BB-POSS-001: Possessives lesson has required structure', async ({ page }) => {
        const lesson = await evalInPage(page, async () => {
            const { possessivesLesson } = await import('/src/data/building-blocks/index.js');
            return possessivesLesson;
        });
        
        expect(lesson).toBeDefined();
        expect(lesson.id).toBe('bb-010');
    });
    
    test('BB-POSS-002: Possessives lesson has possessive table', async ({ page }) => {
        const table = await evalInPage(page, async () => {
            const { possessivesLesson } = await import('/src/data/building-blocks/index.js');
            return possessivesLesson?.possessiveTable;
        });
        
        expect(table).toBeDefined();
        expect(table.rows?.length).toBeGreaterThan(0);
    });
});

test.describe('Building Blocks: Topic Structure', () => {
    
    test('BB-TOPIC-001: Building blocks topic has all 10 lessons', async ({ page }) => {
        const topic = await evalInPage(page, async () => {
            const { buildingBlocksTopic } = await import('/src/data/building-blocks/index.js');
            return {
                lessonCount: buildingBlocksTopic.lessons.length,
                lessonIds: buildingBlocksTopic.lessons.map(l => l.id)
            };
        });
        
        expect(topic.lessonCount).toBe(10);
        expect(topic.lessonIds).toContain('bb-001');
        expect(topic.lessonIds).toContain('bb-002');
        expect(topic.lessonIds).toContain('bb-003');
        expect(topic.lessonIds).toContain('bb-004');
        expect(topic.lessonIds).toContain('bb-005');
        expect(topic.lessonIds).toContain('bb-006');
        expect(topic.lessonIds).toContain('bb-007');
        expect(topic.lessonIds).toContain('bb-008');
        expect(topic.lessonIds).toContain('bb-009');
        expect(topic.lessonIds).toContain('bb-010');
    });
    
    test('BB-TOPIC-002: All lessons have challenges', async ({ page }) => {
        const challengeCounts = await evalInPage(page, async () => {
            const { buildingBlocksTopic } = await import('/src/data/building-blocks/index.js');
            return buildingBlocksTopic.lessons.map(l => ({
                id: l.id,
                challengeCount: l.challenges?.length || 0
            }));
        });
        
        challengeCounts.forEach(lesson => {
            expect(lesson.challengeCount, `${lesson.id} should have challenges`).toBeGreaterThan(0);
        });
    });
    
    test('BB-TOPIC-003: All lessons have words/content', async ({ page }) => {
        const wordCounts = await evalInPage(page, async () => {
            const { buildingBlocksTopic } = await import('/src/data/building-blocks/index.js');
            return buildingBlocksTopic.lessons.map(l => ({
                id: l.id,
                wordCount: l.words?.length || 0
            }));
        });
        
        wordCounts.forEach(lesson => {
            expect(lesson.wordCount, `${lesson.id} should have words`).toBeGreaterThan(0);
        });
    });
    
    test('BB-TOPIC-004: Prerequisite chain is valid', async ({ page }) => {
        const prerequisites = await evalInPage(page, async () => {
            const { buildingBlocksTopic } = await import('/src/data/building-blocks/index.js');
            return buildingBlocksTopic.lessons.map(l => ({
                id: l.id,
                prerequisites: l.prerequisites || []
            }));
        });
        
        // First lesson (pronouns) should have no prerequisites
        expect(prerequisites[0].prerequisites).toHaveLength(0);
        
        // All prerequisites should reference existing lessons
        const allIds = prerequisites.map(l => l.id);
        prerequisites.forEach(lesson => {
            lesson.prerequisites.forEach(prereq => {
                expect(allIds, `${lesson.id} has invalid prereq: ${prereq}`).toContain(prereq);
            });
        });
    });
});
