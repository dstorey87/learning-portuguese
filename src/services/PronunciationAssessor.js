/**
 * PronunciationAssessor.js
 * 
 * Client-side pronunciation assessment for European Portuguese.
 * Uses phonetic comparison with Levenshtein distance to score user attempts.
 * 
 * Features:
 * - Phoneme-aware comparison
 * - Portuguese-specific normalization
 * - Detailed feedback generation
 * - Integration with AI chat for pronunciation practice
 * 
 * @module PronunciationAssessor
 * @since Phase 15 - Voice Integration Excellence
 */

import { createLogger } from './Logger.js';

const logger = createLogger({ context: 'PronunciationAssessor' });

// ============================================================================
// Configuration
// ============================================================================

/**
 * Assessment configuration
 */
export const ASSESSMENT_CONFIG = {
    // Score thresholds
    excellentThreshold: 0.95,
    goodThreshold: 0.80,
    fairThreshold: 0.60,
    
    // Feedback settings
    maxErrorsToShow: 3,
    playAudioOnLowScore: true,
    lowScoreThreshold: 0.60
};

// ============================================================================
// Portuguese Phoneme Mappings
// ============================================================================

/**
 * European Portuguese phoneme variations
 * Maps common spelling patterns to their phonetic representations
 */
export const PHONEME_MAP = {
    // Vowels
    'a': ['a', 'ɐ'],
    'á': ['a'],
    'à': ['a'],
    'ã': ['ɐ̃'],
    'â': ['ɐ'],
    'e': ['e', 'ɛ', 'ə', 'i'],
    'é': ['ɛ'],
    'ê': ['e'],
    'i': ['i'],
    'í': ['i'],
    'o': ['o', 'ɔ', 'u'],
    'ó': ['ɔ'],
    'ô': ['o'],
    'õ': ['õ'],
    'u': ['u'],
    'ú': ['u'],
    
    // Consonants with variations
    'r': ['ʁ', 'ɾ', 'r'],      // Initial r vs intervocalic r
    'rr': ['ʁ'],               // Double r = uvular
    's': ['s', 'z', 'ʃ', 'ʒ'], // Position-dependent
    'ss': ['s'],               // Always voiceless
    'c': ['k', 's'],           // Before a,o,u vs e,i
    'ç': ['s'],                // Always s sound
    'g': ['g', 'ʒ'],           // Before a,o,u vs e,i
    'ch': ['ʃ'],               // Always sh sound
    'lh': ['ʎ'],               // Palatal lateral
    'nh': ['ɲ'],               // Palatal nasal
    'x': ['ʃ', 'ks', 'z', 's'],// Multiple possibilities
    'z': ['z', 'ʃ'],           // Position-dependent
    'qu': ['k', 'kw'],         // Before e,i vs a,o
    
    // Common consonants
    'b': ['b'],
    'd': ['d'],
    'f': ['f'],
    'j': ['ʒ'],
    'k': ['k'],
    'l': ['l', 'ɫ'],           // Clear vs dark l
    'm': ['m'],
    'n': ['n'],
    'p': ['p'],
    't': ['t'],
    'v': ['v'],
    'w': ['w'],
    'y': ['j']
};

/**
 * Common Portuguese diphthongs and their pronunciations
 */
export const DIPHTHONGS = {
    'ai': ['aj'],
    'au': ['aw'],
    'ei': ['ej', 'ɐj'],
    'eu': ['ew'],
    'iu': ['iw'],
    'oi': ['oj', 'uj'],
    'ou': ['o', 'ow'],
    'ui': ['uj'],
    'ão': ['ɐ̃w̃'],
    'ãe': ['ɐ̃j̃'],
    'õe': ['õj̃'],
    'ões': ['õj̃ʃ']
};

/**
 * Portuguese phonetic variations (common mishearings mapped to correct forms)
 */
export const PHONETIC_VARIATIONS = {
    'obrigado': ['obrigadu', 'brigado', 'abrigado', 'obrigato'],
    'obrigada': ['obrigada', 'brigada', 'abrigada'],
    'bom dia': ['bon dia', 'bom día', 'bomdia', 'bom di'],
    'boa tarde': ['boa tardi', 'boatarde', 'boa tardi'],
    'boa noite': ['boa noiti', 'boanoite', 'boa noiti'],
    'olá': ['ola', 'olah', 'hola', 'olla'],
    'tchau': ['chau', 'ciau', 'xau', 'chao'],
    'adeus': ['adeush', 'adeus', 'a deus'],
    'por favor': ['purfavor', 'por favór', 'porfavor', 'pur favor'],
    'com licença': ['conlicença', 'com licensa', 'com lisensa'],
    'desculpe': ['desculpi', 'disculpe', 'desculpa', 'disculpa'],
    'não': ['nao', 'naum', 'nâo', 'now'],
    'sim': ['sin', 'seem', 'si'],
    'muito': ['muinto', 'mto', 'muit', 'muito'],
    'bem': ['ben', 'bein', 'bem'],
    
    // Numbers
    'um': ['un', 'hum', 'um'],
    'dois': ['doys', 'doiz', 'dois'],
    'três': ['tres', 'trez', 'treis'],
    'quatro': ['cuatro', 'quatro'],
    'cinco': ['sinco', 'cinko', 'cinco'],
    
    // Pronouns
    'eu': ['ew', 'éu', 'eu'],
    'tu': ['tú', 'tu'],
    'você': ['voce', 'vosse', 'vose'],
    'ele': ['eli', 'ele'],
    'ela': ['éla', 'ela'],
    'nós': ['nos', 'nóz', 'nois'],
    'vocês': ['voces', 'voceis', 'voseis'],
    'eles': ['elis', 'eles'],
    'elas': ['élas', 'elas']
};
// ============================================================================
// PronunciationAssessor Class
// ============================================================================

export class PronunciationAssessor {
    constructor(config = {}) {
        this.config = { ...ASSESSMENT_CONFIG, ...config };
    }
    
    /**
     * Assess pronunciation accuracy
     * @param {string} expected - The expected Portuguese word/phrase
     * @param {string} heard - What was transcribed from user speech
     * @returns {Object} Assessment result with score, errors, and feedback
     */
    assess(expected, heard) {
        if (!expected || !heard) {
            return {
                expected,
                heard,
                exactMatch: false,
                score: 0,
                errors: [],
                feedback: this.generateFeedback(0, [], expected),
                phonemeBreakdown: []
            };
        }
        
        logger.debug('Assessing pronunciation', { expected, heard });
        
        // Normalize both strings for comparison
        const normalizedExpected = this.normalizeForComparison(expected);
        const normalizedHeard = this.normalizeForComparison(heard);
        
        // Check for exact match first
        const exactMatch = normalizedExpected === normalizedHeard;
        
        // Check for known variations (but not exact matches)
        const isKnownVariation = !exactMatch && this.checkKnownVariations(expected, heard);
        
        // Calculate similarity score
        let similarity;
        if (exactMatch) {
            similarity = 1.0; // Perfect score for exact matches
        } else if (isKnownVariation) {
            similarity = 0.95; // High score for recognized variations
        } else {
            similarity = this.calculateSimilarity(normalizedExpected, normalizedHeard);
        }
        
        // Identify specific errors
        const errors = exactMatch ? [] : this.identifyErrors(normalizedExpected, normalizedHeard);
        
        // Generate feedback
        const feedback = this.generateFeedback(similarity, errors, expected);
        
        // Get phoneme breakdown for learning
        const phonemeBreakdown = this.getPhonemeBreakdown(expected);
        
        const result = {
            expected,
            heard,
            normalizedExpected,
            normalizedHeard,
            exactMatch,
            score: Math.round(similarity * 100),
            errors,
            feedback,
            phonemeBreakdown,
            isKnownVariation
        };
        
        logger.info('Assessment complete', { 
            word: expected, 
            score: result.score, 
            exactMatch: result.exactMatch 
        });
        
        return result;
    }
    
    /**
     * Normalize text for comparison
     * @param {string} text - Text to normalize
     * @returns {string} Normalized text
     */
    normalizeForComparison(text) {
        if (!text) return '';
        
        return text
            .toLowerCase()
            .trim()
            // Remove diacritics (á/ã/ç/etc.) so accent marks don't overly penalize pronunciation matching
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            // Normalize whitespace
            .replace(/\s+/g, ' ')
            // Remove punctuation
            .replace(/[.,!?;:'"()[\]{}]/g, '')
            // Normalize common variations
            .replace(/[""'']/g, "'");
    }
    
    /**
     * Check if heard text is a known phonetic variation of expected
     * @param {string} expected - Expected word
     * @param {string} heard - Heard word
     * @returns {boolean} True if recognized variation
     */
    checkKnownVariations(expected, heard) {
        const expectedLower = expected.toLowerCase().trim();
        const heardLower = heard.toLowerCase().trim();
        
        // Direct match
        if (expectedLower === heardLower) return true;
        
        // Check in variations map
        const variations = PHONETIC_VARIATIONS[expectedLower];
        if (variations && variations.includes(heardLower)) {
            return true;
        }
        
        // Check without accents
        const expectedNoAccent = this.stripAccents(expectedLower);
        const heardNoAccent = this.stripAccents(heardLower);
        
        if (expectedNoAccent === heardNoAccent) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Strip diacritics/accents from text
     * @param {string} text - Text with accents
     * @returns {string} Text without accents
     */
    stripAccents(text) {
        return text
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    }
    
    /**
     * Calculate similarity between two strings using Levenshtein distance
     * @param {string} str1 - First string
     * @param {string} str2 - Second string
     * @returns {number} Similarity score between 0 and 1
     */
    calculateSimilarity(str1, str2) {
        const len1 = str1.length;
        const len2 = str2.length;
        
        if (len1 === 0 && len2 === 0) return 1;
        if (len1 === 0) return 0;
        if (len2 === 0) return 0;
        
        // Create distance matrix
        const matrix = [];
        
        for (let i = 0; i <= len1; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= len2; j++) {
            matrix[0][j] = j;
        }
        
        // Fill in the rest of the matrix
        for (let i = 1; i <= len1; i++) {
            for (let j = 1; j <= len2; j++) {
                const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1,      // deletion
                    matrix[i][j - 1] + 1,      // insertion
                    matrix[i - 1][j - 1] + cost // substitution
                );
            }
        }
        
        const distance = matrix[len1][len2];
        const maxLen = Math.max(len1, len2);
        
        return 1 - (distance / maxLen);
    }
    
    /**
     * Identify specific character-level errors
     * @param {string} expected - Expected string
     * @param {string} heard - Heard string
     * @returns {Array} Array of error objects
     */
    identifyErrors(expected, heard) {
        const errors = [];
        
        let expectedIndex = 0;
        let heardIndex = 0;
        
        while (expectedIndex < expected.length || heardIndex < heard.length) {
            const expChar = expected[expectedIndex];
            const heardChar = heard[heardIndex];
            
            if (expChar !== heardChar) {
                if (!expChar) {
                    // Extra character in heard
                    errors.push({
                        position: heardIndex,
                        expected: '(nothing)',
                        heard: heardChar,
                        type: 'extra',
                        suggestion: `Remove "${heardChar}"`
                    });
                    heardIndex++;
                } else if (!heardChar) {
                    // Missing character
                    errors.push({
                        position: expectedIndex,
                        expected: expChar,
                        heard: '(missing)',
                        type: 'missing',
                        suggestion: `Add "${expChar}"`
                    });
                    expectedIndex++;
                } else {
                    // Wrong character
                    errors.push({
                        position: expectedIndex,
                        expected: expChar,
                        heard: heardChar,
                        type: 'wrong',
                        suggestion: `Say "${expChar}" instead of "${heardChar}"`
                    });
                    expectedIndex++;
                    heardIndex++;
                }
            } else {
                expectedIndex++;
                heardIndex++;
            }
            
            // Limit errors to avoid overwhelming feedback
            if (errors.length >= this.config.maxErrorsToShow + 2) break;
        }
        
        return errors.slice(0, this.config.maxErrorsToShow);
    }
    
    /**
     * Generate user-friendly feedback based on score and errors
     * @param {number} score - Similarity score (0-1)
     * @param {Array} errors - Array of errors
     * @param {string} originalWord - Original word for context
     * @returns {Object} Feedback object
     */
    generateFeedback(score, errors, originalWord) {
        if (score >= this.config.excellentThreshold) {
            return {
                overall: 'Excellent! Perfect pronunciation! 🌟',
                emoji: '🌟',
                level: 'excellent',
                tips: [],
                playAudio: false
            };
        }
        
        if (score >= this.config.goodThreshold) {
            return {
                overall: 'Great job! Very close to native pronunciation. ✨',
                emoji: '✨',
                level: 'good',
                tips: errors.slice(0, 2).map(e => e.suggestion).filter(Boolean),
                playAudio: false
            };
        }
        
        if (score >= this.config.fairThreshold) {
            return {
                overall: 'Good effort! Keep practicing this word. 👍',
                emoji: '👍',
                level: 'fair',
                tips: errors.slice(0, 3).map(e => e.suggestion).filter(Boolean),
                playAudio: true
            };
        }
        
        // Low score - needs more practice
        return {
            overall: "Let's practice this one more. Listen carefully and try again.",
            emoji: '🔄',
            level: 'needs-work',
            tips: [
                `Try breaking it down: ${this.syllabify(originalWord)}`,
                'Listen to the native pronunciation and repeat slowly',
                'Focus on each syllable separately'
            ],
            playAudio: true
        };
    }
    
    /**
     * Simple Portuguese syllabification
     * @param {string} word - Word to syllabify
     * @returns {string} Word with hyphens between syllables
     */
    syllabify(word) {
        if (!word) return '';
        
        const vowels = 'aeiouáéíóúâêôãõ';
        const syllables = [];
        let current = '';
        
        for (let i = 0; i < word.length; i++) {
            const char = word[i].toLowerCase();
            current += word[i];
            
            if (vowels.includes(char)) {
                // Look ahead for consonant clusters
                const next = word[i + 1]?.toLowerCase();
                const nextNext = word[i + 2]?.toLowerCase();
                
                // Check for common patterns that keep syllables together
                if (next && !vowels.includes(next)) {
                    // Consonant follows vowel
                    if (nextNext && vowels.includes(nextNext)) {
                        // CV pattern - split before consonant
                        syllables.push(current);
                        current = '';
                    } else if (nextNext && !vowels.includes(nextNext)) {
                        // CC cluster - might split between
                        const cluster = next + nextNext;
                        const keepTogether = ['br', 'bl', 'cr', 'cl', 'dr', 'fl', 
                                             'fr', 'gl', 'gr', 'pl', 'pr', 'tr', 
                                             'vr', 'ch', 'lh', 'nh'];
                        if (!keepTogether.includes(cluster)) {
                            // Split after first consonant
                            current += next;
                            i++;
                            syllables.push(current);
                            current = '';
                        }
                    }
                }
            }
        }
        
        if (current) syllables.push(current);
        
        return syllables.join('-') || word;
    }
    
    /**
     * Get phoneme breakdown for a Portuguese word
     * @param {string} word - Word to analyze
     * @returns {Array} Array of phoneme objects
     */
    getPhonemeBreakdown(word) {
        if (!word) return [];
        
        const breakdown = [];
        const chars = word.toLowerCase().split('');
        
        for (let i = 0; i < chars.length; i++) {
            const char = chars[i];
            const nextChar = chars[i + 1];
            
            // Check for digraphs first
            const digraph = char + (nextChar || '');
            if (PHONEME_MAP[digraph]) {
                breakdown.push({
                    letters: digraph,
                    sounds: PHONEME_MAP[digraph],
                    position: i
                });
                i++; // Skip next character
                continue;
            }
            
            // Single character
            if (PHONEME_MAP[char]) {
                breakdown.push({
                    letters: char,
                    sounds: PHONEME_MAP[char],
                    position: i
                });
            } else {
                // Unknown character, keep as is
                breakdown.push({
                    letters: char,
                    sounds: [char],
                    position: i
                });
            }
        }
        
        return breakdown;
    }
    
    /**
     * Check if pronunciation assessment is available
     * @returns {boolean} Always true for this client-side implementation
     */
    isAvailable() {
        return true;
    }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let assessorInstance = null;

/**
 * Get or create PronunciationAssessor singleton
 * @param {Object} config - Configuration options
 * @returns {PronunciationAssessor}
 */
export function getPronunciationAssessor(config = {}) {
    if (!assessorInstance) {
        assessorInstance = new PronunciationAssessor(config);
    }
    return assessorInstance;
}

/**
 * Quick assessment function
 * @param {string} expected - Expected pronunciation
 * @param {string} heard - What was heard
 * @returns {Object} Assessment result
 */
export function assessPronunciation(expected, heard) {
    return getPronunciationAssessor().assess(expected, heard);
}

// ============================================================================
// Default Export
// ============================================================================

export default {
    PronunciationAssessor,
    getPronunciationAssessor,
    assessPronunciation,
    ASSESSMENT_CONFIG,
    PHONEME_MAP,
    DIPHTHONGS,
    PHONETIC_VARIATIONS
};
