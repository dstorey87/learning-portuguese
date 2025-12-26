/**
 * PhoneticScorer.js
 * 
 * Enhanced pronunciation scoring with Portuguese-specific phonetic analysis.
 * Provides:
 * - Enhanced Levenshtein with phonetic similarity weighting
 * - Portuguese phoneme pattern detection
 * - Word-level and phoneme-level feedback
 * - Score calculation with multiple metrics
 * 
 * @module PhoneticScorer
 * @since Phase 14 - Pronunciation Assessment Excellence
 */

import { createLogger } from './Logger.js';

// ============================================================================
// Configuration
// ============================================================================

/**
 * Phonetic scoring configuration
 */
export const PHONETIC_CONFIG = {
    // Score thresholds
    excellentScore: 90,
    goodScore: 75,
    fairScore: 60,
    needsWorkScore: 40,
    
    // Weighting for combined score
    weights: {
        levenshtein: 0.35,    // Raw text similarity
        wordMatch: 0.30,      // Word-level accuracy
        phonetic: 0.25,       // Phonetic similarity
        length: 0.10          // Length similarity
    },
    
    // Phonetic similarity bonus
    phoneticBonusMax: 15,
    
    // Fuzzy matching threshold (Levenshtein distance as % of word length)
    fuzzyMatchThreshold: 0.35
};

/**
 * Portuguese phonetic groups - sounds that are commonly confused
 * Each group contains characters/patterns that sound similar
 */
export const PHONETIC_GROUPS = {
    // Nasal vowels - commonly mishear
    nasals: [
        ['ã', 'an', 'am'],
        ['õ', 'on', 'om'],
        ['ão', 'aum', 'oun'],
        ['ãe', 'ain', 'aen'],
        ['ões', 'oens', 'oins']
    ],
    
    // S sounds in EU-PT
    sibilants: [
        ['s', 'z', 'ç', 'ss'],
        ['x', 'ch', 'sh'],
        ['sc', 'sç', 'xc']
    ],
    
    // Vowels
    vowels: [
        ['a', 'á', 'à', 'â'],
        ['e', 'é', 'ê', 'è'],
        ['i', 'í', 'ì'],
        ['o', 'ó', 'ô', 'ò'],
        ['u', 'ú', 'ù']
    ],
    
    // R sounds
    rhotics: [
        ['r', 'rr'],
        ['r', 'h']  // Initial R can sound like H
    ],
    
    // Digraphs
    digraphs: [
        ['lh', 'li', 'ly'],
        ['nh', 'ni', 'ny', 'ñ']
    ],
    
    // Common confusions
    confusions: [
        ['b', 'v'],  // B/V confusion
        ['c', 'k', 'qu'],
        ['g', 'j'],
        ['m', 'n']   // At word end
    ]
};

/**
 * Portuguese phoneme patterns with difficulty ratings
 */
export const PORTUGUESE_PHONEMES = {
    // Nasal vowels (very difficult)
    'ão': {
        ipa: '/ɐ̃w̃/',
        difficulty: 5,
        name: 'nasal diphthong ão',
        tip: 'Say "ow" while humming through your nose. The nasalization is key!',
        commonErrors: ['Saying plain "ow"', 'Adding an "n" sound at the end'],
        examples: ['não', 'pão', 'mão', 'cão']
    },
    'ã': {
        ipa: '/ɐ̃/',
        difficulty: 4,
        name: 'nasal a',
        tip: 'Like "uh" but with air flowing through your nose.',
        commonErrors: ['Saying plain "a"', 'Over-emphasizing'],
        examples: ['maçã', 'lã', 'amanhã']
    },
    'õ': {
        ipa: '/õ/',
        difficulty: 4,
        name: 'nasal o',
        tip: 'Like "oh" but with air flowing through your nose.',
        commonErrors: ['Saying plain "o"'],
        examples: ['põe', 'limões']
    },
    
    // Digraphs (hard)
    'lh': {
        ipa: '/ʎ/',
        difficulty: 4,
        name: 'palatal lateral',
        tip: 'Press tongue against roof of mouth, say "lee" quickly. Like Spanish "ll".',
        commonErrors: ['Saying L + H separately', 'Saying just "l"'],
        examples: ['filho', 'trabalho', 'ovelha']
    },
    'nh': {
        ipa: '/ɲ/',
        difficulty: 4,
        name: 'palatal nasal',
        tip: 'Like "ny" in "canyon" or Spanish "ñ".',
        commonErrors: ['Saying N + H separately', 'Saying just "n"'],
        examples: ['senhor', 'amanhã', 'banheiro']
    },
    
    // S sounds (medium)
    'final_s': {
        ipa: '/ʃ/',
        difficulty: 3,
        name: 'final S (as SH)',
        tip: 'In EU-PT, final S sounds like "sh". Say "esh" not "ess".',
        commonErrors: ['Using American S sound', 'Dropping the S entirely'],
        examples: ['os', 'as', 'portugueses']
    },
    
    // R sounds (medium)
    'rr': {
        ipa: '/ʁ/',
        difficulty: 3,
        name: 'guttural R',
        tip: 'Like clearing your throat gently, or French R.',
        commonErrors: ['Using English R', 'Rolling like Spanish'],
        examples: ['carro', 'corrida', 'terra']
    },
    'initial_r': {
        ipa: '/ʁ/',
        difficulty: 3,
        name: 'initial R',
        tip: 'At the start of words, R is guttural (like RR).',
        commonErrors: ['Using soft R'],
        examples: ['rio', 'rua', 'rosa']
    },
    
    // Vowel reduction (EU-PT specific)
    'unstressed_e': {
        ipa: '/ɨ/',
        difficulty: 3,
        name: 'reduced E',
        tip: 'Unstressed E is very soft, almost swallowed. Much softer than Brazilian PT.',
        commonErrors: ['Pronouncing every vowel clearly'],
        examples: ['telefone', 'presente', 'verde']
    },
    
    // Easier sounds
    'ç': {
        ipa: '/s/',
        difficulty: 1,
        name: 'cedilla',
        tip: 'Always sounds like S, never K.',
        commonErrors: ['Saying K sound'],
        examples: ['coração', 'açúcar', 'começar']
    }
};

// ============================================================================
// Levenshtein Distance (Enhanced)
// ============================================================================

/**
 * Calculate standard Levenshtein distance between two strings
 * @param {string} s1 - First string
 * @param {string} s2 - Second string
 * @returns {number} Edit distance
 */
export function levenshteinDistance(s1, s2) {
    if (!s1) return s2?.length || 0;
    if (!s2) return s1.length;
    
    const m = s1.length;
    const n = s2.length;
    
    // Use single array for space optimization
    let prev = Array(n + 1).fill(0).map((_, i) => i);
    let curr = Array(n + 1).fill(0);
    
    for (let i = 1; i <= m; i++) {
        curr[0] = i;
        for (let j = 1; j <= n; j++) {
            if (s1[i - 1] === s2[j - 1]) {
                curr[j] = prev[j - 1];
            } else {
                curr[j] = 1 + Math.min(prev[j], curr[j - 1], prev[j - 1]);
            }
        }
        [prev, curr] = [curr, prev];
    }
    
    return prev[n];
}

/**
 * Calculate Levenshtein distance with phonetic weighting
 * Substitutions between phonetically similar sounds cost less
 * @param {string} s1 - First string
 * @param {string} s2 - Second string
 * @returns {number} Weighted edit distance
 */
export function phoneticLevenshtein(s1, s2) {
    if (!s1) return s2?.length || 0;
    if (!s2) return s1.length;
    
    const m = s1.length;
    const n = s2.length;
    
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
    
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            const c1 = s1[i - 1].toLowerCase();
            const c2 = s2[j - 1].toLowerCase();
            
            if (c1 === c2) {
                dp[i][j] = dp[i - 1][j - 1];
            } else {
                // Check if phonetically similar
                const similarity = getPhoneticSimilarity(c1, c2);
                const substitutionCost = 1 - (similarity * 0.7); // 0.3 to 1.0
                
                dp[i][j] = Math.min(
                    dp[i - 1][j] + 1,           // deletion
                    dp[i][j - 1] + 1,           // insertion
                    dp[i - 1][j - 1] + substitutionCost  // substitution
                );
            }
        }
    }
    
    return dp[m][n];
}

/**
 * Get phonetic similarity between two characters (0-1)
 * @param {string} c1 - First character
 * @param {string} c2 - Second character
 * @returns {number} Similarity score 0-1
 */
export function getPhoneticSimilarity(c1, c2) {
    if (c1 === c2) return 1;
    
    const c1Lower = c1.toLowerCase();
    const c2Lower = c2.toLowerCase();
    
    // Check all phonetic groups
    for (const groupType of Object.values(PHONETIC_GROUPS)) {
        for (const group of groupType) {
            const has1 = group.some(p => p.includes(c1Lower));
            const has2 = group.some(p => p.includes(c2Lower));
            if (has1 && has2) {
                return 0.8; // High similarity for same phonetic group
            }
        }
    }
    
    // Check if same vowel family (with/without accents)
    const vowelFamilies = PHONETIC_GROUPS.vowels;
    for (const family of vowelFamilies) {
        if (family.includes(c1Lower) && family.includes(c2Lower)) {
            return 0.9; // Very high for accent variations
        }
    }
    
    return 0; // No phonetic similarity
}

// ============================================================================
// Word Matching
// ============================================================================

/**
 * Compare words with fuzzy matching
 * @param {string[]} transcribedWords - Words from transcription
 * @param {string[]} expectedWords - Expected words
 * @param {number} threshold - Fuzzy match threshold (0-1)
 * @returns {Object} Match results
 */
export function matchWords(transcribedWords, expectedWords, threshold = PHONETIC_CONFIG.fuzzyMatchThreshold) {
    const matched = [];
    const missed = [];
    const closeMatches = [];
    const extra = [];
    
    const usedTranscribed = new Set();
    
    // Find matches for each expected word
    expectedWords.forEach(expected => {
        const expectedLower = expected.toLowerCase();
        
        // Look for exact match first
        const exactIndex = transcribedWords.findIndex((tw, i) => 
            !usedTranscribed.has(i) && tw.toLowerCase() === expectedLower
        );
        
        if (exactIndex >= 0) {
            matched.push({ expected, transcribed: transcribedWords[exactIndex], distance: 0 });
            usedTranscribed.add(exactIndex);
            return;
        }
        
        // Look for close match
        let bestMatch = null;
        let bestDistance = Infinity;
        let bestIndex = -1;
        
        transcribedWords.forEach((tw, i) => {
            if (usedTranscribed.has(i)) return;
            
            const distance = phoneticLevenshtein(tw.toLowerCase(), expectedLower);
            const maxLen = Math.max(tw.length, expected.length);
            const normalizedDistance = distance / maxLen;
            
            if (normalizedDistance <= threshold && distance < bestDistance) {
                bestDistance = distance;
                bestMatch = tw;
                bestIndex = i;
            }
        });
        
        if (bestMatch) {
            closeMatches.push({ 
                expected, 
                transcribed: bestMatch, 
                distance: bestDistance,
                similarity: 1 - (bestDistance / Math.max(bestMatch.length, expected.length))
            });
            usedTranscribed.add(bestIndex);
        } else {
            missed.push(expected);
        }
    });
    
    // Find extra words
    transcribedWords.forEach((tw, i) => {
        if (!usedTranscribed.has(i)) {
            extra.push(tw);
        }
    });
    
    return {
        matched,
        closeMatches,
        missed,
        extra,
        matchCount: matched.length + closeMatches.length,
        totalExpected: expectedWords.length,
        accuracy: expectedWords.length > 0 
            ? (matched.length + closeMatches.length * 0.8) / expectedWords.length 
            : 1
    };
}

// ============================================================================
// Phoneme Analysis
// ============================================================================

/**
 * Analyze Portuguese phonemes in text
 * @param {string} text - Portuguese text
 * @returns {Object} Phoneme analysis
 */
export function analyzePhonemes(text) {
    if (!text) return { phonemes: [], challenges: [], difficulty: 0 };
    
    const phonemes = [];
    const challenges = [];
    let totalDifficulty = 0;
    
    const textLower = text.toLowerCase();
    
    // Check for each known phoneme pattern
    Object.entries(PORTUGUESE_PHONEMES).forEach(([key, phoneme]) => {
        let matches = [];
        
        switch (key) {
            case 'ão':
                matches = textLower.match(/ão/g) || [];
                break;
            case 'ã':
                // Match ã but not ão
                matches = textLower.match(/ã(?!o)/g) || [];
                break;
            case 'õ':
                matches = textLower.match(/õ/g) || [];
                break;
            case 'lh':
                matches = textLower.match(/lh/g) || [];
                break;
            case 'nh':
                matches = textLower.match(/nh/g) || [];
                break;
            case 'final_s':
                matches = textLower.match(/s(?=\s|$|[,.])/g) || [];
                break;
            case 'rr':
                matches = textLower.match(/rr/g) || [];
                break;
            case 'initial_r':
                matches = textLower.match(/\br(?=[aeiouáéíóúâêô])/g) || [];
                break;
            case 'unstressed_e':
                // Simplified: e not followed by accent marks
                matches = textLower.match(/e(?![́̂])/g) || [];
                // Limit to avoid over-counting
                matches = matches.slice(0, 3);
                break;
            case 'ç':
                matches = textLower.match(/ç/g) || [];
                break;
        }
        
        if (matches.length > 0) {
            phonemes.push({
                type: key,
                count: matches.length,
                ...phoneme
            });
            
            if (phoneme.difficulty >= 3) {
                challenges.push({
                    type: key,
                    name: phoneme.name,
                    tip: phoneme.tip,
                    difficulty: phoneme.difficulty
                });
            }
            
            totalDifficulty += phoneme.difficulty * matches.length;
        }
    });
    
    // Sort challenges by difficulty
    challenges.sort((a, b) => b.difficulty - a.difficulty);
    
    return {
        phonemes,
        challenges,
        difficulty: Math.min(5, totalDifficulty / 5), // Normalize to 0-5
        primaryChallenge: challenges[0] || null,
        hasDifficultSounds: challenges.length > 0
    };
}

/**
 * Get feedback for specific phoneme issues
 * @param {string[]} problematicWords - Words that were missed or close matches
 * @param {string} expectedText - Full expected text
 * @returns {Object[]} Array of phoneme feedback items
 */
export function getPhonemeFeeback(problematicWords) {
    const feedback = [];
    const seenTypes = new Set();
    
    problematicWords.forEach(word => {
        const analysis = analyzePhonemes(word);
        
        analysis.phonemes.forEach(phoneme => {
            if (!seenTypes.has(phoneme.type) && phoneme.difficulty >= 3) {
                feedback.push({
                    type: phoneme.type,
                    name: phoneme.name,
                    tip: phoneme.tip,
                    examples: phoneme.examples?.slice(0, 2) || [word]
                });
                seenTypes.add(phoneme.type);
            }
        });
    });
    
    // Limit to top 2 most relevant
    return feedback.slice(0, 2);
}

// ============================================================================
// Main Scoring Function
// ============================================================================

/**
 * Calculate comprehensive pronunciation score
 * @param {string} transcribed - What user said
 * @param {string} expected - What they should have said
 * @param {Object} options - Additional options
 * @returns {Object} Detailed score result
 */
export function calculateScore(transcribed, expected, options = {}) {
    const logger = createLogger({ context: 'PhoneticScorer' });
    
    // Handle empty input
    if (!transcribed || !transcribed.trim()) {
        return {
            score: 0,
            rating: 'no-speech',
            feedback: "We didn't hear anything. Make sure your microphone is working.",
            details: {
                levenshteinScore: 0,
                wordScore: 0,
                phoneticScore: 0,
                lengthScore: 0
            },
            tips: ['Speak clearly and close to your microphone'],
            phonemeIssues: [],
            transcribed: '',
            expected
        };
    }
    
    // Normalize texts
    const transcribedNorm = transcribed.toLowerCase().trim().replace(/[.,!?]/g, '');
    const expectedNorm = expected.toLowerCase().trim().replace(/[.,!?]/g, '');
    
    // Split into words
    const transcribedWords = transcribedNorm.split(/\s+/).filter(Boolean);
    const expectedWords = expectedNorm.split(/\s+/).filter(Boolean);
    
    // 1. Calculate Levenshtein score
    const levDistance = phoneticLevenshtein(transcribedNorm, expectedNorm);
    const maxLen = Math.max(transcribedNorm.length, expectedNorm.length, 1);
    const levenshteinScore = Math.round((1 - levDistance / maxLen) * 100);
    
    // 2. Calculate word match score
    const wordMatch = matchWords(transcribedWords, expectedWords);
    const wordScore = Math.round(wordMatch.accuracy * 100);
    
    // 3. Calculate phonetic similarity bonus
    let phoneticBonus = 0;
    if (wordMatch.closeMatches.length > 0) {
        const avgSimilarity = wordMatch.closeMatches.reduce((sum, m) => sum + m.similarity, 0) 
            / wordMatch.closeMatches.length;
        phoneticBonus = Math.round(avgSimilarity * PHONETIC_CONFIG.phoneticBonusMax);
    }
    const phoneticScore = Math.min(100, wordScore + phoneticBonus);
    
    // 4. Calculate length similarity
    const lengthRatio = Math.min(transcribedWords.length, expectedWords.length) / 
        Math.max(transcribedWords.length, expectedWords.length, 1);
    const lengthScore = Math.round(lengthRatio * 100);
    
    // 5. Combined weighted score
    const weights = PHONETIC_CONFIG.weights;
    let combinedScore = Math.round(
        levenshteinScore * weights.levenshtein +
        wordScore * weights.wordMatch +
        phoneticScore * weights.phonetic +
        lengthScore * weights.length
    );
    combinedScore = Math.min(100, Math.max(0, combinedScore));
    
    // 6. Analyze phoneme issues
    const problematicWords = [...wordMatch.missed, ...wordMatch.closeMatches.map(m => m.expected)];
    const phonemeIssues = getPhonemeFeeback(problematicWords);
    const expectedAnalysis = analyzePhonemes(expected);
    
    // 7. Generate rating and feedback
    const { rating, emoji, feedback } = generateFeedback(
        combinedScore, 
        wordMatch, 
        phonemeIssues
    );
    
    // 8. Generate tips
    const tips = generateTips(combinedScore, wordMatch, phonemeIssues, options);
    
    logger.debug('Score calculated', {
        score: combinedScore,
        rating,
        levenshteinScore,
        wordScore,
        phoneticBonus
    });
    
    return {
        score: combinedScore,
        rating,
        emoji,
        feedback,
        
        details: {
            levenshteinScore,
            wordScore,
            phoneticScore,
            lengthScore,
            phoneticBonus
        },
        
        wordMatch: {
            matched: wordMatch.matched,
            closeMatches: wordMatch.closeMatches,
            missed: wordMatch.missed,
            extra: wordMatch.extra
        },
        
        phonemeIssues,
        analysis: expectedAnalysis,
        tips,
        
        transcribed,
        expected
    };
}

/**
 * Generate rating and feedback message
 */
function generateFeedback(score, wordMatch, phonemeIssues) {
    let rating, emoji, feedback;
    
    if (score >= PHONETIC_CONFIG.excellentScore) {
        rating = 'excellent';
        emoji = '🎉';
        feedback = 'Excelente! Your pronunciation is spot on!';
    } else if (score >= PHONETIC_CONFIG.goodScore) {
        rating = 'good';
        emoji = '👍';
        feedback = 'Muito bom! Very good pronunciation.';
        if (wordMatch.closeMatches.length > 0) {
            feedback += ' Just small refinements needed.';
        }
    } else if (score >= PHONETIC_CONFIG.fairScore) {
        rating = 'fair';
        emoji = '💪';
        feedback = 'Bom progresso! Getting closer.';
        if (wordMatch.missed.length > 0) {
            const focusWords = wordMatch.missed.slice(0, 2);
            feedback += ` Focus on: "${focusWords.join('", "')}".`;
        }
    } else if (score >= PHONETIC_CONFIG.needsWorkScore) {
        rating = 'needs-work';
        emoji = '🔄';
        feedback = 'Keep practicing! Listen carefully.';
        if (phonemeIssues.length > 0) {
            feedback += ` Watch out for ${phonemeIssues[0].name}.`;
        }
    } else {
        rating = 'try-again';
        emoji = '🎯';
        feedback = "Let's try again. Listen to the audio first.";
    }
    
    return { rating, emoji, feedback };
}

/**
 * Generate contextual tips
 */
function generateTips(score, wordMatch, phonemeIssues, options) {
    const tips = [];
    
    // Add phoneme-specific tips
    phonemeIssues.forEach(issue => {
        if (tips.length < 2) {
            tips.push(issue.tip);
        }
    });
    
    // Add general tips based on score
    if (score < PHONETIC_CONFIG.needsWorkScore) {
        tips.unshift('Play the audio and repeat exactly what you hear');
    }
    
    if (wordMatch.missed.length >= 2) {
        tips.push('Try speaking more slowly and clearly');
    }
    
    if (wordMatch.extra.length >= 2) {
        tips.push('Listen carefully to the exact words in the phrase');
    }
    
    // Add word knowledge tips if available
    if (options.wordKnowledge?.pronunciation?.tip) {
        tips.push(options.wordKnowledge.pronunciation.tip);
    }
    
    return tips.slice(0, 3); // Max 3 tips
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Quick score check (returns just the numeric score)
 * @param {string} transcribed - What user said
 * @param {string} expected - What they should have said
 * @returns {number} Score 0-100
 */
export function quickScore(transcribed, expected) {
    const result = calculateScore(transcribed, expected);
    return result.score;
}

/**
 * Check if score passes threshold
 * @param {string} transcribed - What user said
 * @param {string} expected - What they should have said
 * @param {number} threshold - Minimum passing score
 * @returns {boolean}
 */
export function passesThreshold(transcribed, expected, threshold = PHONETIC_CONFIG.fairScore) {
    return quickScore(transcribed, expected) >= threshold;
}

// ============================================================================
// Default Export
// ============================================================================

export default {
    // Configuration
    PHONETIC_CONFIG,
    PHONETIC_GROUPS,
    PORTUGUESE_PHONEMES,
    
    // Core functions
    calculateScore,
    quickScore,
    passesThreshold,
    
    // Levenshtein
    levenshteinDistance,
    phoneticLevenshtein,
    getPhoneticSimilarity,
    
    // Word matching
    matchWords,
    
    // Phoneme analysis
    analyzePhonemes,
    getPhonemeFeeback
};
