/**
 * StuckWordsService - Track and rescue words users struggle with
 * 
 * A word is considered "stuck" when:
 * - Failed 3+ times in quizzes/reviews
 * - Pronunciation score < 60% on 3+ attempts
 * - Marked manually by user as difficult
 * 
 * Provides rescue techniques based on research:
 * - Keyword mnemonic method
 * - Memory palace (method of loci)
 * - Multi-sensory encoding
 * - Minimal pairs contrast
 * - Context flooding
 * - Spaced retrieval practice
 * 
 * @module services/learning/StuckWordsService
 */

import * as Logger from '../Logger.js';

// ============================================================================
// CONFIGURATION
// ============================================================================

const STUCK_THRESHOLD = 3;           // Failures to be considered stuck
const PRONUNCIATION_THRESHOLD = 60;  // Score below this is struggling
const STORAGE_KEY = 'stuck_words';

// Rescue technique effectiveness ratings (from research)
export const RESCUE_TECHNIQUES = {
    KEYWORD_MNEMONIC: {
        id: 'keyword_mnemonic',
        name: 'Keyword Mnemonic',
        description: 'Create a sound-alike keyword + bizarre visual story',
        effectiveness: 0.95,  // 2-3x better than rote learning
        bestFor: ['vocabulary', 'abstract_words', 'similar_sounding']
    },
    MEMORY_PALACE: {
        id: 'memory_palace',
        name: 'Memory Palace',
        description: 'Place word in a familiar location with vivid imagery',
        effectiveness: 0.90,
        bestFor: ['lists', 'sequences', 'multiple_words']
    },
    MULTI_SENSORY: {
        id: 'multi_sensory',
        name: 'Multi-Sensory Drill',
        description: 'Engage visual + auditory + kinesthetic channels',
        effectiveness: 0.85,
        bestFor: ['pronunciation', 'spelling', 'muscle_memory']
    },
    MINIMAL_PAIRS: {
        id: 'minimal_pairs',
        name: 'Minimal Pairs Contrast',
        description: 'Compare with similar confusing words',
        effectiveness: 0.88,
        bestFor: ['confusion_pairs', 'pronunciation', 'similar_words']
    },
    CONTEXT_FLOOD: {
        id: 'context_flood',
        name: 'Context Flood',
        description: 'See word in 10+ different real sentences',
        effectiveness: 0.82,
        bestFor: ['usage', 'collocations', 'meaning']
    },
    ETYMOLOGY: {
        id: 'etymology',
        name: 'Etymology & Word Roots',
        description: 'Understand word origins and related words',
        effectiveness: 0.78,
        bestFor: ['cognates', 'word_families', 'meaning']
    },
    SPACED_RETRIEVAL: {
        id: 'spaced_retrieval',
        name: 'Active Spaced Retrieval',
        description: 'Forced recall at increasing intervals',
        effectiveness: 0.92,
        bestFor: ['long_term_retention', 'review', 'consolidation']
    }
};

// ============================================================================
// STATE
// ============================================================================

let stuckWordsState = {
    words: {},          // wordKey -> StuckWordData
    rescueAttempts: {}, // wordKey -> Array of rescue attempts
    lastUpdated: null
};

/**
 * @typedef {Object} StuckWordData
 * @property {string} wordKey - Unique word identifier
 * @property {string} pt - Portuguese word
 * @property {string} en - English translation
 * @property {number} failureCount - Times failed in quizzes
 * @property {number} pronunciationFailures - Times failed pronunciation
 * @property {number} avgPronunciationScore - Average pronunciation score
 * @property {Array<string>} failureTypes - Types of failures (quiz, pronunciation, timing)
 * @property {Array<string>} confusedWith - Words often confused with this one
 * @property {string} stuckSince - ISO timestamp when first stuck
 * @property {string} lastAttempt - ISO timestamp of last attempt
 * @property {Array<string>} appliedTechniques - Techniques already tried
 * @property {boolean} rescued - Whether word has been rescued (mastered after being stuck)
 * @property {string} category - Word category if known
 */

// ============================================================================
// STORAGE
// ============================================================================

/**
 * Load stuck words from localStorage
 * @param {string} userId - User ID
 */
export function loadStuckWords(userId = 'default') {
    try {
        const key = `${userId}_${STORAGE_KEY}`;
        const saved = localStorage.getItem(key);
        if (saved) {
            stuckWordsState = JSON.parse(saved);
        }
    } catch (e) {
        Logger.error('stuck_words', 'Failed to load', { error: e.message });
    }
}

/**
 * Save stuck words to localStorage
 * @param {string} userId - User ID
 */
export function saveStuckWords(userId = 'default') {
    try {
        const key = `${userId}_${STORAGE_KEY}`;
        stuckWordsState.lastUpdated = new Date().toISOString();
        localStorage.setItem(key, JSON.stringify(stuckWordsState));
    } catch (e) {
        Logger.error('stuck_words', 'Failed to save', { error: e.message });
    }
}

// ============================================================================
// TRACKING
// ============================================================================

/**
 * Record a failure for a word
 * @param {Object} params - Failure parameters
 * @param {string} params.wordKey - Word identifier
 * @param {string} params.pt - Portuguese word
 * @param {string} params.en - English translation
 * @param {string} params.failureType - 'quiz', 'pronunciation', 'timing', 'confusion'
 * @param {string} [params.confusedWith] - Word it was confused with
 * @param {number} [params.pronunciationScore] - Score if pronunciation failure
 * @param {string} [params.category] - Word category
 */
export function recordFailure({ wordKey, pt, en, failureType, confusedWith, pronunciationScore, category }) {
    const userId = localStorage.getItem('currentUserId') || 'default';
    loadStuckWords(userId);
    
    if (!stuckWordsState.words[wordKey]) {
        stuckWordsState.words[wordKey] = {
            wordKey,
            pt,
            en,
            failureCount: 0,
            pronunciationFailures: 0,
            avgPronunciationScore: 100,
            failureTypes: [],
            confusedWith: [],
            stuckSince: null,
            lastAttempt: new Date().toISOString(),
            appliedTechniques: [],
            rescued: false,
            category: category || 'unknown'
        };
    }
    
    const word = stuckWordsState.words[wordKey];
    word.lastAttempt = new Date().toISOString();
    
    // Record failure type
    if (failureType && !word.failureTypes.includes(failureType)) {
        word.failureTypes.push(failureType);
    }
    
    // Track quiz/general failures
    if (failureType !== 'pronunciation') {
        word.failureCount++;
    }
    
    // Track pronunciation failures
    if (failureType === 'pronunciation' && pronunciationScore !== undefined) {
        word.pronunciationFailures++;
        // Running average
        const totalAttempts = word.pronunciationFailures;
        word.avgPronunciationScore = Math.round(
            ((word.avgPronunciationScore * (totalAttempts - 1)) + pronunciationScore) / totalAttempts
        );
    }
    
    // Track confusion pairs
    if (confusedWith && !word.confusedWith.includes(confusedWith)) {
        word.confusedWith.push(confusedWith);
    }
    
    // Mark as stuck if threshold reached
    const isStuck = word.failureCount >= STUCK_THRESHOLD || 
                    (word.pronunciationFailures >= STUCK_THRESHOLD && word.avgPronunciationScore < PRONUNCIATION_THRESHOLD);
    
    if (isStuck && !word.stuckSince) {
        word.stuckSince = new Date().toISOString();
        Logger.info('stuck_words', 'Word marked as stuck', { wordKey, pt, failureCount: word.failureCount });
        
        // Auto-trigger rescue lesson generation
        // This event will be picked up by the AI pipeline or UI to create a rescue lesson
        window.dispatchEvent(new CustomEvent('word-stuck', {
            detail: {
                wordKey,
                word: word,
                userId,
                timestamp: Date.now()
            }
        }));
    }
    
    saveStuckWords(userId);
    return word;
}

/**
 * Record a success for a word (potentially rescue it)
 * @param {string} wordKey - Word identifier
 * @param {string} successType - 'quiz', 'pronunciation', 'review'
 * @param {number} [score] - Score achieved
 */
export function recordSuccess(wordKey, successType, score) {
    const userId = localStorage.getItem('currentUserId') || 'default';
    loadStuckWords(userId);
    
    const word = stuckWordsState.words[wordKey];
    if (!word) return null;
    
    word.lastAttempt = new Date().toISOString();
    
    // Reduce failure count on success
    if (word.failureCount > 0) {
        word.failureCount--;
    }
    
    // Update pronunciation score
    if (successType === 'pronunciation' && score !== undefined) {
        if (score >= 80) {
            // Significant improvement
            word.avgPronunciationScore = Math.round((word.avgPronunciationScore + score) / 2);
            if (word.pronunciationFailures > 0) {
                word.pronunciationFailures--;
            }
        }
    }
    
    // Check if rescued (no longer stuck)
    const stillStuck = word.failureCount >= STUCK_THRESHOLD || 
                       (word.avgPronunciationScore < PRONUNCIATION_THRESHOLD && word.pronunciationFailures >= 2);
    
    if (!stillStuck && word.stuckSince) {
        word.rescued = true;
        Logger.info('stuck_words', 'Word rescued!', { wordKey, pt: word.pt });
    }
    
    saveStuckWords(userId);
    return word;
}

/**
 * Mark a word as stuck manually
 * @param {string} wordKey - Word identifier
 * @param {string} pt - Portuguese word
 * @param {string} en - English translation
 * @param {string} reason - Why user finds it difficult
 */
export function markAsStuck(wordKey, pt, en, reason = 'manual') {
    const userId = localStorage.getItem('currentUserId') || 'default';
    loadStuckWords(userId);
    
    if (!stuckWordsState.words[wordKey]) {
        stuckWordsState.words[wordKey] = {
            wordKey,
            pt,
            en,
            failureCount: STUCK_THRESHOLD, // Auto-meet threshold
            pronunciationFailures: 0,
            avgPronunciationScore: 100,
            failureTypes: [reason],
            confusedWith: [],
            stuckSince: new Date().toISOString(),
            lastAttempt: new Date().toISOString(),
            appliedTechniques: [],
            rescued: false,
            category: 'unknown'
        };
    } else {
        stuckWordsState.words[wordKey].stuckSince = new Date().toISOString();
        stuckWordsState.words[wordKey].failureTypes.push(reason);
    }
    
    saveStuckWords(userId);
    return stuckWordsState.words[wordKey];
}

// ============================================================================
// RETRIEVAL
// ============================================================================

/**
 * Get all stuck words
 * @param {Object} options - Filter options
 * @param {boolean} options.includeRescued - Include words that were rescued
 * @param {string} options.category - Filter by category
 * @param {number} options.limit - Max words to return
 * @returns {Array<StuckWordData>} Stuck words
 */
export function getStuckWords({ includeRescued = false, category = null, limit = 50 } = {}) {
    const userId = localStorage.getItem('currentUserId') || 'default';
    loadStuckWords(userId);
    
    let words = Object.values(stuckWordsState.words)
        .filter(w => w.stuckSince !== null)
        .filter(w => includeRescued || !w.rescued);
    
    if (category) {
        const catLower = category.toLowerCase();
        words = words.filter(w => 
            w.category?.toLowerCase().includes(catLower) ||
            w.pt?.toLowerCase().includes(catLower) ||
            w.en?.toLowerCase().includes(catLower)
        );
    }
    
    // Sort by most stuck (highest failure count, longest stuck duration)
    words.sort((a, b) => {
        const aScore = a.failureCount + (a.pronunciationFailures * 0.5);
        const bScore = b.failureCount + (b.pronunciationFailures * 0.5);
        return bScore - aScore;
    });
    
    return words.slice(0, limit);
}

/**
 * Get stuck words that are RELEVANT to a topic
 * This is key for creating hybrid lessons
 * @param {string} topic - Topic to match against
 * @param {Array<string>} keywords - Additional keywords to match
 * @returns {Array<StuckWordData>} Relevant stuck words
 */
export function getRelevantStuckWords(topic, keywords = []) {
    const allStuck = getStuckWords({ limit: 100 });
    
    if (!topic && keywords.length === 0) {
        return allStuck.slice(0, 5);
    }
    
    const searchTerms = [
        topic?.toLowerCase(),
        ...keywords.map(k => k?.toLowerCase())
    ].filter(Boolean);
    
    // Score each stuck word by relevance
    const scored = allStuck.map(word => {
        let relevanceScore = 0;
        
        for (const term of searchTerms) {
            // Check Portuguese word
            if (word.pt?.toLowerCase().includes(term)) relevanceScore += 3;
            // Check English translation
            if (word.en?.toLowerCase().includes(term)) relevanceScore += 3;
            // Check category
            if (word.category?.toLowerCase().includes(term)) relevanceScore += 2;
            // Check confusion pairs
            if (word.confusedWith?.some(c => c.toLowerCase().includes(term))) relevanceScore += 1;
        }
        
        return { ...word, relevanceScore };
    });
    
    // Return only words with some relevance, sorted by score
    return scored
        .filter(w => w.relevanceScore > 0)
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 3);
}

/**
 * Get stuck word statistics
 * @returns {Object} Statistics
 */
export function getStuckWordStats() {
    const userId = localStorage.getItem('currentUserId') || 'default';
    loadStuckWords(userId);
    
    const words = Object.values(stuckWordsState.words);
    const stuck = words.filter(w => w.stuckSince && !w.rescued);
    const rescued = words.filter(w => w.rescued);
    
    return {
        totalTracked: words.length,
        currentlyStuck: stuck.length,
        rescued: rescued.length,
        rescueRate: words.length > 0 ? Math.round((rescued.length / words.length) * 100) : 0,
        mostStuckWords: stuck.slice(0, 5).map(w => ({ pt: w.pt, en: w.en, failures: w.failureCount })),
        commonFailureTypes: getCommonFailureTypes(stuck),
        avgFailureCount: stuck.length > 0 
            ? Math.round(stuck.reduce((sum, w) => sum + w.failureCount, 0) / stuck.length) 
            : 0
    };
}

/**
 * Get common failure types from stuck words
 * @param {Array} words - Stuck words
 * @returns {Object} Failure type counts
 */
function getCommonFailureTypes(words) {
    const counts = {};
    for (const word of words) {
        for (const type of word.failureTypes || []) {
            counts[type] = (counts[type] || 0) + 1;
        }
    }
    return counts;
}

// ============================================================================
// RESCUE TECHNIQUES
// ============================================================================

/**
 * Record that a rescue technique was applied to a word
 * @param {string} wordKey - Word identifier
 * @param {string} techniqueId - Technique ID from RESCUE_TECHNIQUES
 * @param {Object} result - Result of applying the technique
 */
export function recordRescueAttempt(wordKey, techniqueId, result) {
    const userId = localStorage.getItem('currentUserId') || 'default';
    loadStuckWords(userId);
    
    const word = stuckWordsState.words[wordKey];
    if (!word) return null;
    
    if (!word.appliedTechniques.includes(techniqueId)) {
        word.appliedTechniques.push(techniqueId);
    }
    
    // Store rescue attempt history
    if (!stuckWordsState.rescueAttempts[wordKey]) {
        stuckWordsState.rescueAttempts[wordKey] = [];
    }
    
    stuckWordsState.rescueAttempts[wordKey].push({
        techniqueId,
        timestamp: new Date().toISOString(),
        result: result || {}
    });
    
    saveStuckWords(userId);
    return word;
}

/**
 * Get recommended rescue techniques for a word
 * @param {string} wordKey - Word identifier
 * @returns {Array} Recommended techniques
 */
export function getRecommendedTechniques(wordKey) {
    const userId = localStorage.getItem('currentUserId') || 'default';
    loadStuckWords(userId);
    
    const word = stuckWordsState.words[wordKey];
    if (!word) return Object.values(RESCUE_TECHNIQUES);
    
    const recommendations = [];
    const alreadyTried = word.appliedTechniques || [];
    
    // Prioritize based on failure types
    if (word.confusedWith?.length > 0) {
        if (!alreadyTried.includes('minimal_pairs')) {
            recommendations.push(RESCUE_TECHNIQUES.MINIMAL_PAIRS);
        }
    }
    
    if (word.failureTypes?.includes('pronunciation') || word.avgPronunciationScore < 70) {
        if (!alreadyTried.includes('multi_sensory')) {
            recommendations.push(RESCUE_TECHNIQUES.MULTI_SENSORY);
        }
    }
    
    // Always recommend keyword mnemonic for vocabulary
    if (!alreadyTried.includes('keyword_mnemonic')) {
        recommendations.push(RESCUE_TECHNIQUES.KEYWORD_MNEMONIC);
    }
    
    // Context flood for usage/meaning issues
    if (!alreadyTried.includes('context_flood')) {
        recommendations.push(RESCUE_TECHNIQUES.CONTEXT_FLOOD);
    }
    
    // Add remaining techniques
    for (const technique of Object.values(RESCUE_TECHNIQUES)) {
        if (!recommendations.some(r => r.id === technique.id) && !alreadyTried.includes(technique.id)) {
            recommendations.push(technique);
        }
    }
    
    return recommendations.slice(0, 5);
}

// ============================================================================
// MNEMONIC GENERATION HELPERS
// ============================================================================

/**
 * Generate keyword mnemonic components for a Portuguese word
 * This helps the AI create better mnemonics
 * @param {string} pt - Portuguese word
 * @param {string} en - English meaning
 * @returns {Object} Mnemonic building blocks
 */
export function getMnemonicBuildingBlocks(pt, en) {
    const ptLower = pt.toLowerCase();
    
    // Find English words that sound similar to the Portuguese word
    const soundAlikes = [];
    
    // Common sound mappings PT -> EN
    const soundMappings = {
        'ão': ['own', 'on', 'ow'],
        'ção': ['song', 'sow'],
        'lh': ['lee', 'li'],
        'nh': ['ny', 'ni'],
        'ei': ['ay', 'ai'],
        'ou': ['ow', 'oh'],
        'eu': ['ay-oo', 'ew'],
        'ó': ['oh', 'or'],
        'á': ['ah', 'ar'],
        'é': ['eh', 'air'],
        'í': ['ee'],
        'ú': ['oo'],
        'ç': ['s'],
        'ch': ['sh'],
        'x': ['sh', 'ks'],
        'rr': ['h', 'r'],
        'r': ['r', 'h']
    };
    
    // Find applicable sound mappings
    for (const [ptSound, enSounds] of Object.entries(soundMappings)) {
        if (ptLower.includes(ptSound)) {
            soundAlikes.push({
                ptSound,
                enSounds,
                position: ptLower.indexOf(ptSound)
            });
        }
    }
    
    return {
        word: pt,
        meaning: en,
        syllables: pt.split(/[aeiouáéíóúâêôãõ]/i).filter(Boolean).length + 1,
        startsLike: pt.substring(0, 3),
        endsLike: pt.substring(pt.length - 3),
        soundAlikes,
        suggestedKeywords: generateKeywordSuggestions(pt),
        visualizationTips: [
            'Make the image BIZARRE and exaggerated',
            'Add MOVEMENT and ACTION',
            'Include EMOTION (funny, scary, gross)',
            'Use FAMILIAR places or people',
            'Make it MULTISENSORY (sounds, smells, textures)'
        ]
    };
}

/**
 * Generate keyword suggestions based on Portuguese word
 * @param {string} pt - Portuguese word
 * @returns {Array<string>} Suggested English keywords
 */
function generateKeywordSuggestions(pt) {
    const suggestions = [];
    const ptLower = pt.toLowerCase();
    
    // Common Portuguese -> English sound mappings for keywords
    const keywordHints = {
        'bom': ['bomb', 'boom'],
        'dia': ['deer', 'dia-mond'],
        'obri': ['obi', 'bree'],
        'gado': ['got', 'gator'],
        'sim': ['seem', 'sim'],
        'não': ['now', 'noun'],
        'por': ['pour', 'poor'],
        'favor': ['favor'],
        'casa': ['casa', 'cause'],
        'água': ['aqua'],
        'pão': ['pow', 'paw'],
        'café': ['cafe'],
        'com': ['come', 'comb'],
        'sem': ['same', 'seem'],
        'bem': ['bem', 'bam'],
        'mal': ['mall', 'mal'],
        'mais': ['mice', 'my'],
        'menos': ['men', 'menu'],
        'muito': ['moo-ee-too', 'mute'],
        'pouco': ['poco', 'poke'],
        'grande': ['grand'],
        'pequeno': ['peek', 'pequin'],
        'novo': ['no-vo', 'nova'],
        'velho': ['vel', 'veil']
    };
    
    for (const [ptPart, keywords] of Object.entries(keywordHints)) {
        if (ptLower.includes(ptPart)) {
            suggestions.push(...keywords);
        }
    }
    
    // Add first syllable-based suggestions
    if (suggestions.length < 2) {
        const firstTwo = ptLower.substring(0, 2);
        const firstThree = ptLower.substring(0, 3);
        suggestions.push(`Think of English words starting with "${firstTwo}" or "${firstThree}"`);
    }
    
    return suggestions;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
    // Configuration
    STUCK_THRESHOLD,
    RESCUE_TECHNIQUES,
    
    // Storage
    loadStuckWords,
    saveStuckWords,
    
    // Tracking
    recordFailure,
    recordSuccess,
    markAsStuck,
    
    // Retrieval
    getStuckWords,
    getRelevantStuckWords,
    getStuckWordStats,
    
    // Rescue
    recordRescueAttempt,
    getRecommendedTechniques,
    getMnemonicBuildingBlocks
};
