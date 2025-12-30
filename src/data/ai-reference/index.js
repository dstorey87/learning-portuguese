/**
 * AI Reference Data - Central Hub
 * 
 * This module provides the AI with all the reference material it needs
 * to generate courses, lessons, tips, and user-specific content.
 * 
 * IMPORTANT: The AI should consult this data before generating any content
 * to ensure accuracy, consistency, and pedagogical correctness.
 * 
 * @module data/ai-reference
 */

// Core reference modules
export * from './phonemes.js';
export * from './grammar-patterns.js';
export * from './vocabulary-themes.js';
export * from './teaching-sequences.js';
export * from './mnemonic-patterns.js';

/**
 * AI Reference Summary
 * Quick access to what reference data is available
 */
export const AI_REFERENCE_SUMMARY = {
    version: '1.0.0',
    lastUpdated: '2025-12-30',
    
    modules: {
        phonemes: {
            description: 'Complete Portuguese phoneme reference with IPA, mouth positions, minimal pairs',
            usage: 'Pronunciation teaching, phonetic correction, accent coaching'
        },
        grammarPatterns: {
            description: 'Verb conjugations, noun gender rules, article patterns, sentence structures',
            usage: 'Grammar explanations, error correction, sentence building'
        },
        vocabularyThemes: {
            description: 'Thematic word lists with collocations, common phrases, usage context',
            usage: 'Lesson generation, vocabulary expansion, contextual learning'
        },
        teachingSequences: {
            description: 'Optimal order for introducing concepts, prerequisite chains',
            usage: 'Course planning, adaptive learning paths, difficulty progression'
        },
        mnemonicPatterns: {
            description: 'Memory techniques, keyword patterns, visual associations',
            usage: 'Creating memorable learning aids, helping stuck words'
        }
    },
    
    europeanPortugueseFeatures: {
        note: 'ALL content MUST be European Portuguese (PT-PT), not Brazilian',
        keyDifferences: [
            'Final S → /ʃ/ (sh sound)',
            'Reduced unstressed vowels',
            'Tu form more common than você',
            'Gerund rare (use "a + infinitive")',
            'Different vocabulary for some common words'
        ]
    }
};

/**
 * Get reference data for AI prompt injection
 * Returns a structured summary for the AI system prompt
 */
export function getAIReferenceContext() {
    return {
        dialect: 'European Portuguese (PT-PT)',
        phonemePriorities: [
            { sound: 'ão', difficulty: 'highest', tip: 'Nasal "owng" - key Portuguese sound' },
            { sound: 'ões', difficulty: 'high', tip: 'Plural of ão - "oynsh"' },
            { sound: 'lh', difficulty: 'medium', tip: 'Like "lli" in million' },
            { sound: 'nh', difficulty: 'medium', tip: 'Like "ny" in canyon' },
            { sound: 'final S', difficulty: 'medium', tip: 'Always "sh" in PT-PT' }
        ],
        teachingPrinciples: [
            'i+1: Slightly above current level',
            'Active recall over passive recognition',
            'Interleave weak + strong words',
            'Multiple modalities (see, hear, speak, write)',
            'Immediate feedback with explanation'
        ],
        lessonOrder: [
            '1. Building blocks (pronouns, articles, prepositions)',
            '2. Core verbs (ser, estar, ter)',
            '3. Essential communication',
            '4. Daily topics',
            '5. Advanced expressions'
        ]
    };
}

export default {
    AI_REFERENCE_SUMMARY,
    getAIReferenceContext
};
