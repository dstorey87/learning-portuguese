/**
 * PhoneticScorer Unit Tests
 * Tests for enhanced Levenshtein scoring with Portuguese phonetic analysis
 */

import { test, expect } from '@playwright/test';

const HOME_URL = 'http://localhost:4321/';

// Helper to execute code in browser context
async function evalInPage(page, fn) {
    return page.evaluate(fn);
}

test.describe('PhoneticScorer Unit Tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(HOME_URL);
        await page.waitForLoadState('networkidle');
    });

    // Configuration Tests
    test('PHONETIC-T001: PHONETIC_CONFIG has correct default values', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { PHONETIC_CONFIG } = await import('/src/services/PhoneticScorer.js');
            return {
                hasExcellentScore: 'excellentScore' in PHONETIC_CONFIG,
                hasGoodScore: 'goodScore' in PHONETIC_CONFIG,
                hasFairScore: 'fairScore' in PHONETIC_CONFIG,
                hasWeights: 'weights' in PHONETIC_CONFIG,
                excellentScore: PHONETIC_CONFIG.excellentScore,
                goodScore: PHONETIC_CONFIG.goodScore
            };
        });
        
        expect(result.hasExcellentScore).toBe(true);
        expect(result.hasGoodScore).toBe(true);
        expect(result.hasFairScore).toBe(true);
        expect(result.hasWeights).toBe(true);
        expect(result.excellentScore).toBe(90);
        expect(result.goodScore).toBe(75);
    });

    test('PHONETIC-T002: PHONETIC_GROUPS has all phonetic categories', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { PHONETIC_GROUPS } = await import('/src/services/PhoneticScorer.js');
            return {
                hasNasals: 'nasals' in PHONETIC_GROUPS,
                hasSibilants: 'sibilants' in PHONETIC_GROUPS,
                hasVowels: 'vowels' in PHONETIC_GROUPS,
                hasRhotics: 'rhotics' in PHONETIC_GROUPS,
                hasDigraphs: 'digraphs' in PHONETIC_GROUPS,
                hasConfusions: 'confusions' in PHONETIC_GROUPS
            };
        });
        
        expect(result.hasNasals).toBe(true);
        expect(result.hasSibilants).toBe(true);
        expect(result.hasVowels).toBe(true);
        expect(result.hasRhotics).toBe(true);
        expect(result.hasDigraphs).toBe(true);
        expect(result.hasConfusions).toBe(true);
    });

    test('PHONETIC-T003: PORTUGUESE_PHONEMES has difficulty ratings', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { PORTUGUESE_PHONEMES } = await import('/src/services/PhoneticScorer.js');
            return {
                hasAo: 'ão' in PORTUGUESE_PHONEMES,
                hasLh: 'lh' in PORTUGUESE_PHONEMES,
                hasNh: 'nh' in PORTUGUESE_PHONEMES,
                aoInfo: PORTUGUESE_PHONEMES['ão'],
                lhInfo: PORTUGUESE_PHONEMES['lh']
            };
        });
        
        expect(result.hasAo).toBe(true);
        expect(result.hasLh).toBe(true);
        expect(result.hasNh).toBe(true);
        expect(result.aoInfo.difficulty).toBe(5);
        expect(result.aoInfo.tip).toBeTruthy();
        expect(result.lhInfo.difficulty).toBe(4);
    });

    // Levenshtein Distance Tests
    test('PHONETIC-T010: levenshteinDistance calculates correctly', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { levenshteinDistance } = await import('/src/services/PhoneticScorer.js');
            return {
                identical: levenshteinDistance('hello', 'hello'),
                oneEdit: levenshteinDistance('hello', 'hallo'),
                twoEdits: levenshteinDistance('hello', 'holla'),
                empty: levenshteinDistance('', 'abc'),
                different: levenshteinDistance('abc', 'xyz')
            };
        });
        
        expect(result.identical).toBe(0);
        expect(result.oneEdit).toBe(1);
        expect(result.twoEdits).toBe(2);
        expect(result.empty).toBe(3);
        expect(result.different).toBe(3);
    });

    test('PHONETIC-T011: phoneticLevenshtein weights similar sounds', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { levenshteinDistance, phoneticLevenshtein } = await import('/src/services/PhoneticScorer.js');
            
            // Compare standard vs phonetic Levenshtein
            const standard = levenshteinDistance('voce', 'você');
            const phonetic = phoneticLevenshtein('voce', 'você');
            
            return {
                standard,
                phonetic,
                phoneticIsLower: phonetic < standard
            };
        });
        
        // Phonetic version should give lower distance for similar sounds
        expect(result.phoneticIsLower).toBe(true);
    });

    test('PHONETIC-T012: getPhoneticSimilarity returns 0-1 range', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { getPhoneticSimilarity } = await import('/src/services/PhoneticScorer.js');
            return {
                identical: getPhoneticSimilarity('a', 'a'),
                similar: getPhoneticSimilarity('a', 'á'),
                different: getPhoneticSimilarity('a', 'z'),
                sibilant: getPhoneticSimilarity('s', 'z')
            };
        });
        
        expect(result.identical).toBe(1);
        expect(result.similar).toBeGreaterThan(0.5);
        expect(result.different).toBe(0);
        expect(result.sibilant).toBeGreaterThan(0);
    });

    // Word Matching Tests
    test('PHONETIC-T020: matchWords finds exact matches', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { matchWords } = await import('/src/services/PhoneticScorer.js');
            const match = matchWords(
                ['bom', 'dia'],
                ['bom', 'dia']
            );
            return {
                matchCount: match.matchCount,
                missedCount: match.missed.length,
                accuracy: match.accuracy
            };
        });
        
        expect(result.matchCount).toBe(2);
        expect(result.missedCount).toBe(0);
        expect(result.accuracy).toBe(1);
    });

    test('PHONETIC-T021: matchWords finds close matches', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { matchWords } = await import('/src/services/PhoneticScorer.js');
            const match = matchWords(
                ['bon', 'dia'],  // 'bon' is close to 'bom'
                ['bom', 'dia']
            );
            return {
                matchCount: match.matchCount,
                closeMatchCount: match.closeMatches.length,
                exactMatchCount: match.matched.length
            };
        });
        
        expect(result.matchCount).toBe(2);
        expect(result.closeMatchCount).toBe(1);
        expect(result.exactMatchCount).toBe(1);
    });

    test('PHONETIC-T022: matchWords identifies missed words', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { matchWords } = await import('/src/services/PhoneticScorer.js');
            const match = matchWords(
                ['bom'],
                ['bom', 'dia', 'senhor']
            );
            return {
                missedCount: match.missed.length,
                missed: match.missed,
                accuracy: match.accuracy
            };
        });
        
        expect(result.missedCount).toBe(2);
        expect(result.missed).toContain('dia');
        expect(result.missed).toContain('senhor');
        expect(result.accuracy).toBeLessThan(1);
    });

    test('PHONETIC-T023: matchWords identifies extra words', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { matchWords } = await import('/src/services/PhoneticScorer.js');
            const match = matchWords(
                ['muito', 'bom', 'dia'],
                ['bom', 'dia']
            );
            return {
                extraCount: match.extra.length,
                extra: match.extra
            };
        });
        
        expect(result.extraCount).toBe(1);
        expect(result.extra).toContain('muito');
    });

    // Phoneme Analysis Tests
    test('PHONETIC-T030: analyzePhonemes detects nasal ão', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { analyzePhonemes } = await import('/src/services/PhoneticScorer.js');
            const analysis = analyzePhonemes('não');
            return {
                hasPhonemes: analysis.phonemes.length > 0,
                hasChallenges: analysis.challenges.length > 0,
                difficulty: analysis.difficulty,
                foundAo: analysis.phonemes.some(p => p.type === 'ão')
            };
        });
        
        expect(result.hasPhonemes).toBe(true);
        expect(result.hasChallenges).toBe(true);
        expect(result.difficulty).toBeGreaterThan(0);
        expect(result.foundAo).toBe(true);
    });

    test('PHONETIC-T031: analyzePhonemes detects digraphs lh/nh', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { analyzePhonemes } = await import('/src/services/PhoneticScorer.js');
            const lhAnalysis = analyzePhonemes('filho');
            const nhAnalysis = analyzePhonemes('senhor');
            return {
                hasLh: lhAnalysis.phonemes.some(p => p.type === 'lh'),
                hasNh: nhAnalysis.phonemes.some(p => p.type === 'nh')
            };
        });
        
        expect(result.hasLh).toBe(true);
        expect(result.hasNh).toBe(true);
    });

    test('PHONETIC-T032: analyzePhonemes detects cedilla', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { analyzePhonemes } = await import('/src/services/PhoneticScorer.js');
            const analysis = analyzePhonemes('coração');
            return {
                foundCedilla: analysis.phonemes.some(p => p.type === 'ç'),
                hasDifficultSounds: analysis.hasDifficultSounds
            };
        });
        
        expect(result.foundCedilla).toBe(true);
    });

    test('PHONETIC-T033: getPhonemeFeeback returns tips for problem words', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { getPhonemeFeeback } = await import('/src/services/PhoneticScorer.js');
            const feedback = getPhonemeFeeback(['não', 'coração']);
            return {
                hasFeedback: feedback.length > 0,
                firstHasTip: feedback[0]?.tip !== undefined,
                firstHasType: feedback[0]?.type !== undefined
            };
        });
        
        expect(result.hasFeedback).toBe(true);
        expect(result.firstHasTip).toBe(true);
        expect(result.firstHasType).toBe(true);
    });

    // Main Scoring Function Tests
    test('PHONETIC-T040: calculateScore returns complete result', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { calculateScore } = await import('/src/services/PhoneticScorer.js');
            const score = calculateScore('bom dia', 'bom dia');
            return {
                hasScore: 'score' in score,
                hasRating: 'rating' in score,
                hasDetails: 'details' in score,
                hasWordMatch: 'wordMatch' in score,
                hasTips: 'tips' in score,
                score: score.score,
                rating: score.rating
            };
        });
        
        expect(result.hasScore).toBe(true);
        expect(result.hasRating).toBe(true);
        expect(result.hasDetails).toBe(true);
        expect(result.hasWordMatch).toBe(true);
        expect(result.hasTips).toBe(true);
        expect(result.score).toBeGreaterThanOrEqual(90);
        expect(result.rating).toBe('excellent');
    });

    test('PHONETIC-T041: calculateScore handles empty transcription', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { calculateScore } = await import('/src/services/PhoneticScorer.js');
            const score = calculateScore('', 'bom dia');
            return {
                score: score.score,
                rating: score.rating,
                hasFeedback: score.feedback.length > 0
            };
        });
        
        expect(result.score).toBe(0);
        expect(result.rating).toBe('no-speech');
        expect(result.hasFeedback).toBe(true);
    });

    test('PHONETIC-T042: calculateScore generates appropriate ratings', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { calculateScore } = await import('/src/services/PhoneticScorer.js');
            
            const excellent = calculateScore('bom dia', 'bom dia');
            const good = calculateScore('bon dia', 'bom dia');
            const needsWork = calculateScore('dia', 'bom dia senhor');
            
            return {
                excellentRating: excellent.rating,
                excellentScore: excellent.score,
                goodScore: good.score,
                needsWorkScore: needsWork.score
            };
        });
        
        expect(result.excellentRating).toBe('excellent');
        expect(result.excellentScore).toBeGreaterThanOrEqual(90);
        expect(result.goodScore).toBeGreaterThanOrEqual(60);
        expect(result.needsWorkScore).toBeLessThan(result.excellentScore);
    });

    test('PHONETIC-T043: calculateScore includes phoneme issues', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { calculateScore } = await import('/src/services/PhoneticScorer.js');
            // Deliberately miss the nasal sound
            const score = calculateScore('nao', 'não');
            return {
                hasPhonemeIssues: 'phonemeIssues' in score,
                hasAnalysis: 'analysis' in score,
                analysis: score.analysis
            };
        });
        
        expect(result.hasPhonemeIssues).toBe(true);
        expect(result.hasAnalysis).toBe(true);
        expect(result.analysis.hasDifficultSounds).toBe(true);
    });

    test('PHONETIC-T044: calculateScore provides tips', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { calculateScore } = await import('/src/services/PhoneticScorer.js');
            const score = calculateScore('wrong words', 'não obrigado');
            return {
                hasTips: score.tips.length > 0,
                tipsAreStrings: score.tips.every(t => typeof t === 'string')
            };
        });
        
        expect(result.hasTips).toBe(true);
        expect(result.tipsAreStrings).toBe(true);
    });

    // Convenience Function Tests
    test('PHONETIC-T050: quickScore returns just the numeric score', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { quickScore } = await import('/src/services/PhoneticScorer.js');
            const score = quickScore('bom dia', 'bom dia');
            return {
                isNumber: typeof score === 'number',
                score: score
            };
        });
        
        expect(result.isNumber).toBe(true);
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(100);
    });

    test('PHONETIC-T051: passesThreshold checks against threshold', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { passesThreshold } = await import('/src/services/PhoneticScorer.js');
            return {
                perfect: passesThreshold('bom dia', 'bom dia'),
                partial: passesThreshold('bom', 'bom dia senhor', 50),
                failing: passesThreshold('xyz', 'bom dia', 80)
            };
        });
        
        expect(result.perfect).toBe(true);
        expect(result.failing).toBe(false);
    });

    // Default Export Tests
    test('PHONETIC-T060: default export includes all public functions', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const phoneticModule = await import('/src/services/PhoneticScorer.js');
            const defaultExport = phoneticModule.default;
            
            return {
                hasConfig: 'PHONETIC_CONFIG' in defaultExport,
                hasGroups: 'PHONETIC_GROUPS' in defaultExport,
                hasPhonemes: 'PORTUGUESE_PHONEMES' in defaultExport,
                hasCalculateScore: 'calculateScore' in defaultExport,
                hasQuickScore: 'quickScore' in defaultExport,
                hasPassesThreshold: 'passesThreshold' in defaultExport,
                hasLevenshtein: 'levenshteinDistance' in defaultExport,
                hasPhoneticLevenshtein: 'phoneticLevenshtein' in defaultExport,
                hasMatchWords: 'matchWords' in defaultExport,
                hasAnalyzePhonemes: 'analyzePhonemes' in defaultExport
            };
        });
        
        expect(result.hasConfig).toBe(true);
        expect(result.hasGroups).toBe(true);
        expect(result.hasPhonemes).toBe(true);
        expect(result.hasCalculateScore).toBe(true);
        expect(result.hasQuickScore).toBe(true);
        expect(result.hasPassesThreshold).toBe(true);
        expect(result.hasLevenshtein).toBe(true);
        expect(result.hasPhoneticLevenshtein).toBe(true);
        expect(result.hasMatchWords).toBe(true);
        expect(result.hasAnalyzePhonemes).toBe(true);
    });
});
