/**
 * FSRSEngine Unit Tests
 * Tests for FSRS-5 spaced repetition algorithm
 * 
 * Tests run in browser context via Playwright
 */

import { test, expect } from '@playwright/test';

const HOME_URL = 'http://localhost:4321/';

// Helper to run code in browser context
async function evalInPage(page, fn) {
    return await page.evaluate(fn);
}

test.describe('FSRSEngine Unit Tests', () => {
    
    test.beforeEach(async ({ page }) => {
        await page.goto(HOME_URL);
    });

    // ========================================================================
    // RATING & STATE ENUM TESTS
    // ========================================================================

    test('FSRS-T001: Rating enum has correct values', async ({ page }) => {
        const ratings = await evalInPage(page, async () => {
            const { Rating } = await import('/src/services/learning/FSRSEngine.js');
            return {
                Again: Rating.Again,
                Hard: Rating.Hard,
                Good: Rating.Good,
                Easy: Rating.Easy
            };
        });
        
        expect(ratings.Again).toBe(1);
        expect(ratings.Hard).toBe(2);
        expect(ratings.Good).toBe(3);
        expect(ratings.Easy).toBe(4);
    });

    test('FSRS-T002: State enum has correct values', async ({ page }) => {
        const states = await evalInPage(page, async () => {
            const { State } = await import('/src/services/learning/FSRSEngine.js');
            return {
                New: State.New,
                Learning: State.Learning,
                Review: State.Review,
                Relearning: State.Relearning
            };
        });
        
        expect(states.New).toBe(0);
        expect(states.Learning).toBe(1);
        expect(states.Review).toBe(2);
        expect(states.Relearning).toBe(3);
    });

    // ========================================================================
    // CREATE CARD TESTS
    // ========================================================================

    test('FSRS-T003: createCard creates new card with defaults', async ({ page }) => {
        const card = await evalInPage(page, async () => {
            const { FSRSEngine } = await import('/src/services/learning/FSRSEngine.js');
            const engine = new FSRSEngine();
            return engine.createCard('word-001');
        });
        
        expect(card.wordId).toBe('word-001');
        expect(card.state).toBe(0); // State.New
        expect(card.difficulty).toBe(0);
        expect(card.stability).toBe(0);
        expect(card.reps).toBe(0);
        expect(card.lapses).toBe(0);
        expect(card.due).toBeDefined();
    });

    // ========================================================================
    // SCHEDULE - NEW CARDS TESTS
    // ========================================================================

    test('FSRS-T004: schedule handles Again rating on new card', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { FSRSEngine, Rating, State } = await import('/src/services/learning/FSRSEngine.js');
            const engine = new FSRSEngine();
            const card = engine.createCard('word-001');
            const scheduled = engine.schedule(card, Rating.Again);
            return { state: scheduled.state, reps: scheduled.reps, expectedLearning: State.Learning };
        });
        
        expect(result.state).toBe(result.expectedLearning);
        expect(result.reps).toBe(1);
    });

    test('FSRS-T005: schedule handles Good rating on new card', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { FSRSEngine, Rating, State } = await import('/src/services/learning/FSRSEngine.js');
            const engine = new FSRSEngine();
            const card = engine.createCard('word-001');
            const scheduled = engine.schedule(card, Rating.Good);
            return { state: scheduled.state, reps: scheduled.reps, expectedLearning: State.Learning };
        });
        
        expect(result.state).toBe(result.expectedLearning);
        expect(result.reps).toBe(1);
    });

    test('FSRS-T006: schedule handles Easy rating - graduate immediately', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { FSRSEngine, Rating, State } = await import('/src/services/learning/FSRSEngine.js');
            const engine = new FSRSEngine();
            const card = engine.createCard('word-001');
            const scheduled = engine.schedule(card, Rating.Easy);
            return { 
                state: scheduled.state, 
                reps: scheduled.reps, 
                scheduledDays: scheduled.scheduledDays,
                expectedReview: State.Review 
            };
        });
        
        expect(result.state).toBe(result.expectedReview);
        expect(result.reps).toBe(1);
        expect(result.scheduledDays).toBeGreaterThan(0);
    });

    test('FSRS-T007: Again results in higher difficulty than Easy', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { FSRSEngine, Rating } = await import('/src/services/learning/FSRSEngine.js');
            const engine = new FSRSEngine();
            const cardAgain = engine.schedule(engine.createCard('w1'), Rating.Again);
            const cardEasy = engine.schedule(engine.createCard('w2'), Rating.Easy);
            return { againDiff: cardAgain.difficulty, easyDiff: cardEasy.difficulty };
        });
        
        expect(result.againDiff).toBeGreaterThan(result.easyDiff);
    });

    test('FSRS-T008: Easy results in higher stability than Again', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { FSRSEngine, Rating } = await import('/src/services/learning/FSRSEngine.js');
            const engine = new FSRSEngine();
            const cardAgain = engine.schedule(engine.createCard('w1'), Rating.Again);
            const cardEasy = engine.schedule(engine.createCard('w2'), Rating.Easy);
            return { againStab: cardAgain.stability, easyStab: cardEasy.stability };
        });
        
        expect(result.easyStab).toBeGreaterThan(result.againStab);
    });

    // ========================================================================
    // SCHEDULE - LEARNING CARDS TESTS
    // ========================================================================

    test('FSRS-T009: Learning card graduates to Review after Good', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { FSRSEngine, Rating, State } = await import('/src/services/learning/FSRSEngine.js');
            const engine = new FSRSEngine();
            let card = engine.createCard('word-001');
            card = engine.schedule(card, Rating.Hard); // Enter learning
            card = engine.schedule(card, Rating.Good); // Graduate
            return { state: card.state, scheduledDays: card.scheduledDays, expectedReview: State.Review };
        });
        
        expect(result.state).toBe(result.expectedReview);
        expect(result.scheduledDays).toBeGreaterThan(0);
    });

    test('FSRS-T010: Learning card stays in Learning after Again', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { FSRSEngine, Rating, State } = await import('/src/services/learning/FSRSEngine.js');
            const engine = new FSRSEngine();
            let card = engine.createCard('word-001');
            card = engine.schedule(card, Rating.Hard); // Enter learning
            card = engine.schedule(card, Rating.Again); // Fail
            return { state: card.state, expectedLearning: State.Learning };
        });
        
        expect(result.state).toBe(result.expectedLearning);
    });

    test('FSRS-T011: Tracks repetitions correctly', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { FSRSEngine, Rating } = await import('/src/services/learning/FSRSEngine.js');
            const engine = new FSRSEngine();
            let card = engine.createCard('word-001');
            card = engine.schedule(card, Rating.Hard);
            const reps1 = card.reps;
            card = engine.schedule(card, Rating.Hard);
            const reps2 = card.reps;
            card = engine.schedule(card, Rating.Good);
            const reps3 = card.reps;
            return { reps1, reps2, reps3 };
        });
        
        expect(result.reps1).toBe(1);
        expect(result.reps2).toBe(2);
        expect(result.reps3).toBe(3);
    });

    // ========================================================================
    // SCHEDULE - REVIEW CARDS TESTS
    // ========================================================================

    test('FSRS-T012: Review card lapses to Relearning on Again', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { FSRSEngine, Rating, State } = await import('/src/services/learning/FSRSEngine.js');
            const engine = new FSRSEngine();
            let card = engine.createCard('word-001');
            card = engine.schedule(card, Rating.Easy); // Graduate
            card.lastReview = new Date(Date.now() - 24 * 60 * 60 * 1000);
            card.elapsedDays = 1;
            const scheduled = engine.schedule(card, Rating.Again);
            return { state: scheduled.state, lapses: scheduled.lapses, expectedRelearning: State.Relearning };
        });
        
        expect(result.state).toBe(result.expectedRelearning);
        expect(result.lapses).toBe(1);
    });

    test('FSRS-T013: Successful recall increases stability', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { FSRSEngine, Rating } = await import('/src/services/learning/FSRSEngine.js');
            const engine = new FSRSEngine();
            let card = engine.createCard('word-001');
            card = engine.schedule(card, Rating.Easy);
            const originalStability = card.stability;
            card.lastReview = new Date(Date.now() - 24 * 60 * 60 * 1000);
            card.elapsedDays = 1;
            const scheduled = engine.schedule(card, Rating.Good);
            return { original: originalStability, after: scheduled.stability };
        });
        
        expect(result.after).toBeGreaterThan(result.original);
    });

    test('FSRS-T014: Lapse decreases stability', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { FSRSEngine, Rating } = await import('/src/services/learning/FSRSEngine.js');
            const engine = new FSRSEngine();
            let card = engine.createCard('word-001');
            card = engine.schedule(card, Rating.Easy);
            const originalStability = card.stability;
            card.lastReview = new Date(Date.now() - 24 * 60 * 60 * 1000);
            card.elapsedDays = 1;
            const scheduled = engine.schedule(card, Rating.Again);
            return { original: originalStability, after: scheduled.stability };
        });
        
        expect(result.after).toBeLessThan(result.original);
    });

    // ========================================================================
    // getDueCards TESTS
    // ========================================================================

    test('FSRS-T015: getDueCards returns due cards sorted', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { FSRSEngine } = await import('/src/services/learning/FSRSEngine.js');
            const engine = new FSRSEngine();
            const now = Date.now();
            const cards = [
                { ...engine.createCard('w1'), due: new Date(now - 1000) },
                { ...engine.createCard('w2'), due: new Date(now + 100000) },
                { ...engine.createCard('w3'), due: new Date(now - 5000) }
            ];
            const due = engine.getDueCards(cards);
            return { count: due.length, first: due[0]?.wordId, second: due[1]?.wordId };
        });
        
        expect(result.count).toBe(2);
        expect(result.first).toBe('w3'); // Oldest first
        expect(result.second).toBe('w1');
    });

    test('FSRS-T016: getDueCards returns empty when none due', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { FSRSEngine } = await import('/src/services/learning/FSRSEngine.js');
            const engine = new FSRSEngine();
            const cards = [
                { ...engine.createCard('w1'), due: new Date(Date.now() + 100000) },
                { ...engine.createCard('w2'), due: new Date(Date.now() + 200000) }
            ];
            return engine.getDueCards(cards).length;
        });
        
        expect(result).toBe(0);
    });

    // ========================================================================
    // STATISTICS TESTS
    // ========================================================================

    test('FSRS-T017: getStatistics calculates correctly', async ({ page }) => {
        const stats = await evalInPage(page, async () => {
            const { FSRSEngine, State } = await import('/src/services/learning/FSRSEngine.js');
            const engine = new FSRSEngine();
            const cards = [
                { state: State.New, stability: 0, difficulty: 0, due: new Date() },
                { state: State.Learning, stability: 1, difficulty: 5, due: new Date() },
                { state: State.Review, stability: 10, difficulty: 4, due: new Date(Date.now() + 100000) },
                { state: State.Review, stability: 20, difficulty: 6, due: new Date() },
                { state: State.Relearning, stability: 2, difficulty: 7, due: new Date() }
            ];
            return engine.getStatistics(cards);
        });
        
        expect(stats.total).toBe(5);
        expect(stats.new).toBe(1);
        expect(stats.learning).toBe(1);
        expect(stats.review).toBe(2);
        expect(stats.relearning).toBe(1);
        expect(stats.due).toBe(4);
    });

    // ========================================================================
    // FORGETTING CURVE TESTS
    // ========================================================================

    test('FSRS-T018: forgettingCurve returns 1 at time 0', async ({ page }) => {
        const r = await evalInPage(page, async () => {
            const { FSRSEngine } = await import('/src/services/learning/FSRSEngine.js');
            const engine = new FSRSEngine();
            return engine.forgettingCurve(0, 10);
        });
        
        expect(r).toBeCloseTo(1, 5);
    });

    test('FSRS-T019: forgettingCurve decreases over time', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { FSRSEngine } = await import('/src/services/learning/FSRSEngine.js');
            const engine = new FSRSEngine();
            const stability = 10;
            return {
                r1: engine.forgettingCurve(1, stability),
                r2: engine.forgettingCurve(5, stability),
                r3: engine.forgettingCurve(10, stability)
            };
        });
        
        expect(result.r1).toBeGreaterThan(result.r2);
        expect(result.r2).toBeGreaterThan(result.r3);
    });

    // ========================================================================
    // MIGRATION TESTS
    // ========================================================================

    test('FSRS-T020: migrateFromSM2 converts cards correctly', async ({ page }) => {
        const fsrsCard = await evalInPage(page, async () => {
            const { FSRSEngine, State } = await import('/src/services/learning/FSRSEngine.js');
            const engine = new FSRSEngine();
            const sm2Card = {
                id: 'word-001',
                interval: 7,
                easeFactor: 2.5,
                repetitions: 5,
                dueDate: new Date().toISOString(),
                lapses: 1
            };
            const card = engine.migrateFromSM2(sm2Card);
            return { ...card, expectedReview: State.Review };
        });
        
        expect(fsrsCard.wordId).toBe('word-001');
        expect(fsrsCard.stability).toBe(7);
        expect(fsrsCard.state).toBe(fsrsCard.expectedReview);
        expect(fsrsCard.reps).toBe(5);
        expect(fsrsCard.lapses).toBe(1);
    });

    // ========================================================================
    // SINGLETON & CUSTOM PARAMS TESTS
    // ========================================================================

    test('FSRS-T021: exports singleton fsrs instance', async ({ page }) => {
        const isFSRS = await evalInPage(page, async () => {
            const { fsrs, FSRSEngine } = await import('/src/services/learning/FSRSEngine.js');
            return fsrs instanceof FSRSEngine;
        });
        
        expect(isFSRS).toBe(true);
    });

    test('FSRS-T022: accepts custom retention target', async ({ page }) => {
        const retention = await evalInPage(page, async () => {
            const { FSRSEngine } = await import('/src/services/learning/FSRSEngine.js');
            const engine = new FSRSEngine({ requestRetention: 0.95 });
            return engine.params.requestRetention;
        });
        
        expect(retention).toBe(0.95);
    });

    test('FSRS-T023: accepts custom maximum interval', async ({ page }) => {
        const maxInterval = await evalInPage(page, async () => {
            const { FSRSEngine } = await import('/src/services/learning/FSRSEngine.js');
            const engine = new FSRSEngine({ maximumInterval: 365 });
            return engine.params.maximumInterval;
        });
        
        expect(maxInterval).toBe(365);
    });
});
