/**
 * AI Tip Generator Service
 * 
 * Generates personalized, context-aware tips for learners based on:
 * - User performance data (from LearnerProfiler)
 * - Current lesson/word data
 * - AI reference material (phonemes, grammar, mnemonics)
 * - User's specific weak areas
 * 
 * This service bridges the AI reference data with real-time tip generation.
 * 
 * @module services/learning/AITipGenerator
 */

// Import AI reference data
import { getPhonemeTeachingTip } from '../../data/ai-reference/index.js';
import * as Logger from '../Logger.js';

import MnemonicPatterns from '../../data/ai-reference/mnemonic-patterns.js';
import TeachingSequences from '../../data/ai-reference/teaching-sequences.js';

// Destructure helpers from imports
const {
    generateKeywordHints,
    getGenderTrick,
    getVerbMemoryAid,
    getPronunciationAid,
    getConfusionPairMnemonic,
    PRONUNCIATION_MEMORY_AIDS
} = MnemonicPatterns;

const { LESSON_SIZE_GUIDELINES } = TeachingSequences;

// =============================================================================
// TIP GENERATORS BY CATEGORY
// =============================================================================

/**
 * Generate pronunciation tips based on user's pronunciation data
 */
function generatePronunciationTips(userData, currentWord) {
    const tips = [];
    
    // Check pronunciation issues from user data
    if (userData.pronunciationIssues) {
        for (const issue of userData.pronunciationIssues) {
            const phonemeHelp = getPronunciationAid(issue.phoneme);
            if (phonemeHelp) {
                tips.push({
                    type: 'pronunciation',
                    priority: issue.averageScore < 50 ? 'high' : 'medium',
                    tip: `The "${issue.phoneme}" sound: ${phonemeHelp.english_approximation}. ${phonemeHelp.trick}`,
                    practice: phonemeHelp.practice,
                    phoneme: issue.phoneme,
                    score: issue.averageScore
                });
            }
        }
    }
    
    // Check if current word has difficult sounds
    if (currentWord) {
        const wordPt = currentWord.pt || currentWord.word;
        
        // Check for nasal vowels
        if (/[ãõẽĩũ]|ão|ões|ães/.test(wordPt)) {
            const nasalTip = PRONUNCIATION_MEMORY_AIDS.nasalVowels.ão || PRONUNCIATION_MEMORY_AIDS.nasalVowels.ãe;
            if (nasalTip) {
                tips.push({
                    type: 'pronunciation',
                    priority: 'high',
                    tip: `This word has a nasal sound! ${nasalTip.trick}`,
                    practice: nasalTip.practice
                });
            }
        }
        
        // Check for lh/nh
        if (/lh|nh/.test(wordPt)) {
            const sound = wordPt.includes('lh') ? 'lh' : 'nh';
            const consonantTip = PRONUNCIATION_MEMORY_AIDS.consonants[sound];
            if (consonantTip) {
                tips.push({
                    type: 'pronunciation',
                    priority: 'medium',
                    tip: `"${sound}" sounds like: ${consonantTip.english_approximation}. ${consonantTip.trick}`,
                    practice: consonantTip.practice
                });
            }
        }
        
        // Check for final S (PT-PT specific)
        if (/s$/.test(wordPt)) {
            tips.push({
                type: 'pronunciation',
                priority: 'low',
                tip: PRONUNCIATION_MEMORY_AIDS.finalS.trick,
                note: 'This is a key feature of European Portuguese!'
            });
        }
    }
    
    return tips;
}

/**
 * Generate grammar tips based on user's grammar mistakes
 */
function generateGrammarTips(userData, currentWord) {
    const tips = [];
    
    // Check for ser/estar confusion
    if (userData.topWeaknesses) {
        const serEstarConfusion = userData.topWeaknesses.find(
            w => (w.word1 === 'ser' && w.word2 === 'estar') || 
                 (w.word1 === 'estar' && w.word2 === 'ser')
        );
        
        if (serEstarConfusion) {
            const mnemonic = getConfusionPairMnemonic('ser', 'estar');
            if (mnemonic) {
                tips.push({
                    type: 'grammar',
                    priority: 'high',
                    tip: mnemonic.trick,
                    example: mnemonic.example,
                    confusion: mnemonic.confusion
                });
            }
        }
    }
    
    // Check current word for grammar tips
    if (currentWord) {
        const wordType = currentWord.type || currentWord.wordType;
        
        // Verb conjugation tips
        if (wordType === 'verb' || currentWord.infinitive) {
            const infinitive = currentWord.infinitive || currentWord.pt;
            const verbAid = getVerbMemoryAid(infinitive);
            if (verbAid) {
                tips.push({
                    type: 'grammar',
                    priority: 'medium',
                    tip: verbAid.irregular 
                        ? `"${infinitive}" is irregular! ${verbAid.trick}`
                        : `"${infinitive}" follows the ${verbAid.type} pattern: ${verbAid.mnemonic}`,
                    pattern: verbAid.pattern,
                    story: verbAid.story
                });
            }
        }
        
        // Gender tips for nouns
        if (wordType === 'noun' || currentWord.gender) {
            const gender = currentWord.gender;
            const wordPt = currentWord.pt || currentWord.word;
            const genderTrick = getGenderTrick(wordPt, gender);
            if (genderTrick) {
                tips.push({
                    type: 'grammar',
                    priority: 'low',
                    tip: genderTrick.suggestion,
                    visualCode: genderTrick.visualCode
                });
            }
        }
    }
    
    return tips;
}

/**
 * Generate memory/mnemonic tips
 */
function generateMemoryTips(userData, currentWord) {
    const tips = [];
    
    if (!currentWord) return tips;
    
    const wordPt = currentWord.pt || currentWord.word;
    const wordEn = currentWord.en || currentWord.english || currentWord.meaning;
    
    // Generate keyword hints
    const hints = generateKeywordHints(wordPt, wordEn);
    
    // If word has building blocks (like -ção, -dade)
    if (hints.buildingBlocks.length > 0) {
        const block = hints.buildingBlocks[0];
        tips.push({
            type: 'memory',
            priority: 'medium',
            tip: `Notice the "${block.part}" ending? It means "${block.meaning}" - just like English words with that pattern!`,
            buildingBlock: block
        });
    }
    
    // Add keyword mnemonic suggestion
    tips.push({
        type: 'memory',
        priority: 'low',
        tip: `Memory trick: Find an English word that sounds like "${wordPt}" and create a vivid mental image connecting it to "${wordEn}".`,
        suggestions: hints.suggestions
    });
    
    return tips;
}

/**
 * Generate weakness-based tips
 */
function generateWeaknessTips(userData) {
    const tips = [];
    
    if (!userData.topWeaknesses || userData.topWeaknesses.length === 0) {
        return tips;
    }
    
    // Get top weakness
    const topWeakness = userData.topWeaknesses[0];
    
    // Check if it's a known confusion pair
    const pairMnemonic = getConfusionPairMnemonic(topWeakness.word1, topWeakness.word2);
    
    if (pairMnemonic) {
        tips.push({
            type: 'weakness',
            priority: 'high',
            tip: `Confusing "${topWeakness.word1}" with "${topWeakness.word2}"? ${pairMnemonic.trick}`,
            example: pairMnemonic.example
        });
    } else {
        // Generic weakness tip
        tips.push({
            type: 'weakness',
            priority: 'high',
            tip: `You often mix up "${topWeakness.word1}" and "${topWeakness.word2}". Try writing 3 sentences using each correctly!`
        });
    }
    
    return tips;
}

/**
 * Generate timing/performance tips
 */
function generateTimingTips(userData) {
    const tips = [];
    
    // Slow response time tip
    if (userData.averageResponseTime && userData.averageResponseTime > 10000) {
        tips.push({
            type: 'timing',
            priority: 'low',
            tip: 'Try to answer a bit faster! Quick recall strengthens memory. Trust your first instinct.',
            metric: userData.averageResponseTime
        });
    }
    
    // Fast but incorrect tip
    if (userData.speedAccuracyRatio && userData.speedAccuracyRatio < 0.6) {
        tips.push({
            type: 'timing',
            priority: 'medium',
            tip: 'Slow down just a little! Your speed is great but taking an extra moment can improve accuracy.',
            metric: userData.speedAccuracyRatio
        });
    }
    
    // Session length tip
    if (userData.sessionsCompleted && userData.sessionsCompleted < 3) {
        tips.push({
            type: 'motivation',
            priority: 'low',
            tip: `${LESSON_SIZE_GUIDELINES.sessionDuration.optimal} sessions work best. Try to practice daily for best results!`
        });
    }
    
    return tips;
}

/**
 * Generate motivation tips
 */
function generateMotivationTips(userData) {
    const tips = [];
    
    // Streak tip
    if (userData.streakDays && userData.streakDays > 0) {
        if (userData.streakDays >= 7) {
            tips.push({
                type: 'motivation',
                priority: 'low',
                tip: `🔥 Amazing! ${userData.streakDays} day streak! Research shows consistent practice leads to fluency.`
            });
        } else if (userData.streakDays >= 3) {
            tips.push({
                type: 'motivation',
                priority: 'low',
                tip: `${userData.streakDays} days in a row! Keep it up - you're building a great habit!`
            });
        }
    }
    
    // Accuracy tip
    if (userData.overallAccuracy) {
        if (userData.overallAccuracy >= 80) {
            tips.push({
                type: 'motivation',
                priority: 'low',
                tip: `${Math.round(userData.overallAccuracy)}% accuracy! You're mastering this material. Ready for harder content?`
            });
        } else if (userData.overallAccuracy >= 60) {
            tips.push({
                type: 'motivation',
                priority: 'low',
                tip: `${Math.round(userData.overallAccuracy)}% and improving! Focus on your weak spots and you'll see gains.`
            });
        }
    }
    
    return tips;
}

// =============================================================================
// MAIN TIP GENERATOR CLASS
// =============================================================================

/**
 * AI Tip Generator Class
 */
export class AITipGenerator {
    /**
     * Create tip generator
     * @param {Object} options - Configuration
     */
    constructor(options = {}) {
        this.options = {
            maxTips: 5,
            priorityOrder: ['high', 'medium', 'low'],
            enabledCategories: [
                'pronunciation',
                'grammar',
                'memory',
                'weakness',
                'timing',
                'motivation'
            ],
            ...options
        };
        
        Logger.debug('AITipGenerator', 'Initialized', { options: this.options });
    }
    
    /**
     * Generate all tips for user and current word
     * @param {Object} userData - User learning data from LearnerProfiler
     * @param {Object} currentWord - Current word being studied
     * @param {Object} lessonData - Current lesson data
     * @returns {Array} Prioritized tips
     */
    generateTips(userData = {}, currentWord = null, lessonData = null) {
        const allTips = [];
        
        // Generate tips from each category
        if (this.options.enabledCategories.includes('pronunciation')) {
            allTips.push(...generatePronunciationTips(userData, currentWord));
        }
        
        if (this.options.enabledCategories.includes('grammar')) {
            allTips.push(...generateGrammarTips(userData, currentWord));
        }
        
        if (this.options.enabledCategories.includes('memory')) {
            allTips.push(...generateMemoryTips(userData, currentWord));
        }
        
        if (this.options.enabledCategories.includes('weakness')) {
            allTips.push(...generateWeaknessTips(userData));
        }
        
        if (this.options.enabledCategories.includes('timing')) {
            allTips.push(...generateTimingTips(userData));
        }
        
        if (this.options.enabledCategories.includes('motivation')) {
            allTips.push(...generateMotivationTips(userData));
        }
        
        // Add lesson-specific tips
        if (lessonData && lessonData.dynamicAiTips) {
            allTips.push(...this.matchDynamicTips(userData, lessonData.dynamicAiTips));
        }
        
        // Prioritize and limit tips
        const sortedTips = this.prioritizeTips(allTips);
        const limitedTips = sortedTips.slice(0, this.options.maxTips);
        
        Logger.debug('AITipGenerator', 'Generated tips', {
            total: allTips.length,
            returned: limitedTips.length
        });
        
        return limitedTips;
    }
    
    /**
     * Match dynamic tips from lesson data based on user conditions
     * @param {Object} userData - User data
     * @param {Array} dynamicTips - Lesson's dynamic tips array
     * @returns {Array} Matched tips
     */
    matchDynamicTips(userData, dynamicTips) {
        const matched = [];
        
        for (const tipConfig of dynamicTips) {
            const condition = tipConfig.triggerCondition;
            let shouldAdd = false;
            
            // Check various conditions
            switch (condition) {
                case 'confused_tu_voce':
                    shouldAdd = userData.topWeaknesses?.some(
                        w => (w.word1 === 'tu' || w.word2 === 'tu') && 
                             (w.word1 === 'você' || w.word2 === 'você')
                    );
                    break;
                    
                case 'confused_gender_pronouns':
                    shouldAdd = userData.topWeaknesses?.some(
                        w => /^(ele|ela|eles|elas)$/.test(w.word1) || 
                             /^(ele|ela|eles|elas)$/.test(w.word2)
                    );
                    break;
                    
                case 'wrong_gender_article':
                    shouldAdd = userData.recentMistakes?.some(
                        m => m.type === 'article_gender'
                    );
                    break;
                    
                case 'confused_ser_estar':
                    shouldAdd = userData.topWeaknesses?.some(
                        w => (w.word1 === 'ser' || w.word2 === 'ser') &&
                             (w.word1 === 'estar' || w.word2 === 'estar')
                    );
                    break;
                    
                case 'wrong_conjugation':
                    shouldAdd = userData.recentMistakes?.some(
                        m => m.type === 'conjugation'
                    );
                    break;
                    
                case 'missing_article':
                    shouldAdd = userData.recentMistakes?.some(
                        m => m.type === 'missing_article'
                    );
                    break;
                    
                default:
                    // Generic fallback - show tip occasionally
                    shouldAdd = Math.random() < 0.2;
            }
            
            if (shouldAdd) {
                matched.push({
                    type: 'lesson',
                    priority: 'medium',
                    tip: tipConfig.tip,
                    condition
                });
            }
        }
        
        return matched;
    }
    
    /**
     * Prioritize tips by importance
     * @param {Array} tips - All generated tips
     * @returns {Array} Sorted tips
     */
    prioritizeTips(tips) {
        const priorityWeight = {
            'high': 3,
            'medium': 2,
            'low': 1
        };
        
        // Category weight (more important categories first)
        const categoryWeight = {
            'weakness': 5,
            'pronunciation': 4,
            'grammar': 3,
            'memory': 2,
            'timing': 1,
            'motivation': 0,
            'lesson': 2
        };
        
        return tips.sort((a, b) => {
            // First sort by priority
            const priorityDiff = (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
            if (priorityDiff !== 0) return priorityDiff;
            
            // Then by category
            return (categoryWeight[b.type] || 0) - (categoryWeight[a.type] || 0);
        });
    }
    
    /**
     * Get a quick tip for a specific word (lightweight version)
     * @param {Object} word - Word object
     * @returns {Object|null} Single tip
     */
    getQuickTip(word) {
        if (!word) return null;
        
        const tips = this.generateTips({}, word, null);
        return tips[0] || null;
    }
    
    /**
     * Get reference info for a sound/phoneme
     * @param {string} sound - Phoneme or sound
     * @returns {Object|null} Phoneme info
     */
    getPhonemeReference(sound) {
        return getPronunciationAid(sound) || getPhonemeTeachingTip(sound);
    }
    
    /**
     * Get mnemonic for a word pair confusion
     * @param {string} word1 - First word
     * @param {string} word2 - Second word
     * @returns {Object|null} Mnemonic info
     */
    getConfusionMnemonic(word1, word2) {
        return getConfusionPairMnemonic(word1, word2);
    }
}

/**
 * Create AITipGenerator instance
 * @param {Object} options - Configuration
 * @returns {AITipGenerator} Generator instance
 */
export function createAITipGenerator(options = {}) {
    return new AITipGenerator(options);
}

// Singleton instance for convenience
let defaultGenerator = null;

/**
 * Get or create default generator
 * @returns {AITipGenerator}
 */
export function getDefaultGenerator() {
    if (!defaultGenerator) {
        defaultGenerator = new AITipGenerator();
    }
    return defaultGenerator;
}

/**
 * Generate tips using default generator
 * @param {Object} userData - User data
 * @param {Object} currentWord - Current word
 * @param {Object} lessonData - Lesson data
 * @returns {Array} Tips
 */
export function generateTips(userData, currentWord, lessonData) {
    return getDefaultGenerator().generateTips(userData, currentWord, lessonData);
}

export default {
    AITipGenerator,
    createAITipGenerator,
    getDefaultGenerator,
    generateTips
};
