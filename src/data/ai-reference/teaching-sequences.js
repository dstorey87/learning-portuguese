/**
 * Teaching Sequences Reference
 * 
 * Optimal order for introducing concepts based on:
 * - Linguistic prerequisites (what must be learned first)
 * - Frequency in everyday language
 * - Difficulty for English speakers
 * - Building-block relationships
 * 
 * The AI MUST respect these sequences when creating lessons.
 * 
 * @module data/ai-reference/teaching-sequences
 */

// =============================================================================
// MASTER LEARNING PATH
// =============================================================================

export const MASTER_LEARNING_PATH = {
    description: 'The optimal sequence for teaching Portuguese to English speakers',
    
    tiers: [
        // TIER 1: BUILDING BLOCKS (Must learn first)
        {
            tier: 1,
            name: 'Building Blocks',
            description: 'Essential pieces needed to construct ANY sentence',
            prerequisite: null,
            estimatedTime: '2-3 weeks',
            sequence: [
                {
                    order: 1,
                    topic: 'Personal Pronouns',
                    id: 'bb-001',
                    reason: 'Cannot construct sentences without knowing who/what the subject is',
                    words: ['eu', 'tu', 'você', 'ele', 'ela', 'nós', 'eles', 'elas'],
                    mustLearnBefore: ['any verb conjugation', 'any possessive']
                },
                {
                    order: 2,
                    topic: 'Essential Verbs (Ser/Estar)',
                    id: 'bb-002',
                    reason: 'Most fundamental verbs - appear in almost every conversation',
                    words: ['ser', 'estar', 'sou', 'estou', 'é', 'está'],
                    mustLearnBefore: ['other verbs', 'adjectives in sentences'],
                    prerequisite: 'bb-001'
                },
                {
                    order: 3,
                    topic: 'Definite Articles',
                    id: 'bb-003',
                    reason: 'Portuguese uses articles much more than English',
                    words: ['o', 'a', 'os', 'as'],
                    mustLearnBefore: ['nouns in sentences', 'possessives'],
                    prerequisite: 'bb-001'
                },
                {
                    order: 4,
                    topic: 'Indefinite Articles',
                    id: 'bb-004',
                    reason: 'Needed for introducing new concepts',
                    words: ['um', 'uma', 'uns', 'umas'],
                    mustLearnBefore: ['noun phrases'],
                    prerequisite: 'bb-003'
                },
                {
                    order: 5,
                    topic: 'Core Prepositions',
                    id: 'bb-005',
                    reason: 'Connect words and enable complex sentences',
                    words: ['de', 'em', 'a', 'para', 'com'],
                    mustLearnBefore: ['location phrases', 'possession expressions'],
                    prerequisite: 'bb-003'
                },
                {
                    order: 6,
                    topic: 'Basic Contractions',
                    id: 'bb-006',
                    reason: 'Contractions are mandatory in Portuguese, not optional',
                    words: ['do', 'da', 'no', 'na', 'ao', 'à'],
                    mustLearnBefore: ['natural speech'],
                    prerequisite: 'bb-005'
                },
                {
                    order: 7,
                    topic: 'Negation',
                    id: 'bb-007',
                    reason: 'Simple but essential - just "não" before verb',
                    words: ['não', 'nunca', 'nada', 'ninguém'],
                    prerequisite: 'bb-002'
                },
                {
                    order: 8,
                    topic: 'Question Words',
                    id: 'bb-008',
                    reason: 'Needed to ask questions',
                    words: ['o que', 'quem', 'onde', 'quando', 'como', 'por que', 'quanto'],
                    prerequisite: 'bb-002'
                },
                {
                    order: 9,
                    topic: 'Possessives',
                    id: 'bb-009',
                    reason: 'Used constantly - my, your, his, etc.',
                    words: ['meu/minha', 'teu/tua', 'seu/sua', 'nosso/nossa', 'dele/dela'],
                    prerequisite: 'bb-003'
                },
                {
                    order: 10,
                    topic: 'Basic Connectors',
                    id: 'bb-010',
                    reason: 'Link ideas together',
                    words: ['e', 'ou', 'mas', 'porque', 'então', 'quando'],
                    prerequisite: 'bb-002'
                }
            ]
        },
        
        // TIER 2: ESSENTIAL COMMUNICATION
        {
            tier: 2,
            name: 'Essential Communication',
            description: 'Basic survival language for everyday situations',
            prerequisite: 'Building Blocks complete',
            estimatedTime: '3-4 weeks',
            sequence: [
                {
                    order: 1,
                    topic: 'Greetings & Polite Phrases',
                    id: 'ec-001',
                    reason: 'First thing needed in any social interaction',
                    words: ['olá', 'bom dia', 'obrigado', 'por favor', 'desculpe'],
                    prerequisite: 'bb-002'
                },
                {
                    order: 2,
                    topic: 'Numbers 1-20',
                    id: 'ec-002',
                    reason: 'Needed for time, prices, quantities',
                    words: ['um', 'dois', 'três', '...vinte'],
                    prerequisite: 'bb-004'
                },
                {
                    order: 3,
                    topic: 'Core Verbs (Ter, Ir, Fazer)',
                    id: 'ec-003',
                    reason: 'Most common verbs after ser/estar',
                    words: ['ter', 'ir', 'fazer', 'querer', 'poder'],
                    prerequisite: 'bb-002'
                },
                {
                    order: 4,
                    topic: 'Time Expressions',
                    id: 'ec-004',
                    reason: 'Essential for scheduling and daily life',
                    words: ['hoje', 'amanhã', 'ontem', 'agora', 'hora', 'minuto'],
                    prerequisite: 'ec-002'
                },
                {
                    order: 5,
                    topic: 'Days & Months',
                    id: 'ec-005',
                    reason: 'Calendar vocabulary',
                    words: ['segunda-feira', '...domingo', 'janeiro', '...dezembro'],
                    prerequisite: 'ec-004'
                },
                {
                    order: 6,
                    topic: 'Basic Adjectives',
                    id: 'ec-006',
                    reason: 'Describe people, things, experiences',
                    words: ['grande', 'pequeno', 'bom', 'mau', 'bonito', 'novo', 'velho'],
                    prerequisite: 'bb-002'
                },
                {
                    order: 7,
                    topic: 'Colors',
                    id: 'ec-007',
                    reason: 'Common descriptors',
                    words: ['vermelho', 'azul', 'verde', 'amarelo', 'branco', 'preto'],
                    prerequisite: 'ec-006'
                },
                {
                    order: 8,
                    topic: 'Family',
                    id: 'ec-008',
                    reason: 'Personal introductions and conversations',
                    words: ['pai', 'mãe', 'filho', 'irmão', 'avô', 'avó'],
                    prerequisite: 'bb-009'
                }
            ]
        },
        
        // TIER 3: DAILY TOPICS
        {
            tier: 3,
            name: 'Daily Topics',
            description: 'Vocabulary for everyday situations',
            prerequisite: 'Essential Communication complete',
            estimatedTime: '4-6 weeks',
            sequence: [
                { order: 1, topic: 'Food & Drinks', id: 'dt-001' },
                { order: 2, topic: 'Restaurant & Ordering', id: 'dt-002' },
                { order: 3, topic: 'Shopping', id: 'dt-003' },
                { order: 4, topic: 'Transportation', id: 'dt-004' },
                { order: 5, topic: 'Directions', id: 'dt-005' },
                { order: 6, topic: 'Weather', id: 'dt-006' },
                { order: 7, topic: 'Home & Living', id: 'dt-007' },
                { order: 8, topic: 'Body & Health', id: 'dt-008' },
                { order: 9, topic: 'Work & Professions', id: 'dt-009' },
                { order: 10, topic: 'Hobbies & Free Time', id: 'dt-010' }
            ]
        },
        
        // TIER 4: ADVANCED
        {
            tier: 4,
            name: 'Advanced',
            description: 'Complex grammar and nuanced vocabulary',
            prerequisite: 'Daily Topics complete',
            estimatedTime: 'Ongoing',
            sequence: [
                { order: 1, topic: 'Past Tense (Pretérito Perfeito)', id: 'adv-001' },
                { order: 2, topic: 'Imperfect Tense', id: 'adv-002' },
                { order: 3, topic: 'Future Tense', id: 'adv-003' },
                { order: 4, topic: 'Conditional', id: 'adv-004' },
                { order: 5, topic: 'Subjunctive (Presente)', id: 'adv-005' },
                { order: 6, topic: 'Object Pronouns', id: 'adv-006' },
                { order: 7, topic: 'Reflexive Verbs', id: 'adv-007' },
                { order: 8, topic: 'Idiomatic Expressions', id: 'adv-008' }
            ]
        }
    ]
};

// =============================================================================
// PHONEME TEACHING ORDER
// =============================================================================

export const PHONEME_TEACHING_ORDER = {
    description: 'Order for introducing Portuguese sounds to English speakers',
    
    levels: [
        {
            level: 1,
            name: 'Familiar Sounds',
            priority: 'background',
            sounds: ['basic vowels a, e, i, o, u', 'basic consonants p, b, t, d, k, g, f, v, m, n, l'],
            note: 'Similar to English - mention but don\'t drill'
        },
        {
            level: 2,
            name: 'S-Sound Rules',
            priority: 'high',
            sounds: ['final S as /ʃ/', 's between vowels as /z/', 'ç as /s/', 'ss as /s/'],
            note: 'Critical for PT-PT - drill extensively',
            exercises: ['dois → doysh', 'três → tresh', 'casa → kaza', 'passo → pasu']
        },
        {
            level: 3,
            name: 'R-Sounds',
            priority: 'high',
            sounds: ['intervocalic r as /ɾ/ (tap)', 'initial r and rr as /ʁ/ (uvular)'],
            note: 'Different from English - needs practice',
            exercises: ['caro vs carro', 'para vs parra', 'rato', 'rio']
        },
        {
            level: 4,
            name: 'Palatal Consonants',
            priority: 'high',
            sounds: ['lh as /ʎ/', 'nh as /ɲ/'],
            note: 'New sounds for English speakers',
            exercises: ['filho', 'trabalho', 'vinho', 'banho']
        },
        {
            level: 5,
            name: 'Vowel Reduction',
            priority: 'medium',
            sounds: ['unstressed e as /ɨ/', 'unstressed o as /u/', 'unstressed a as /ɐ/'],
            note: 'Key to natural PT-PT pronunciation',
            exercises: ['pequeno', 'telefone', 'casa', 'bonito']
        },
        {
            level: 6,
            name: 'Nasal Vowels',
            priority: 'critical',
            sounds: ['ã, an, am', 'õ, on, om', 'em, en', 'im, in', 'um, un'],
            note: 'HARDEST for English speakers - extensive drilling',
            exercises: ['irmã', 'bom', 'também', 'fim', 'um']
        },
        {
            level: 7,
            name: 'Nasal Diphthongs',
            priority: 'critical',
            sounds: ['ão', 'ões', 'ães', 'ãos'],
            note: 'THE Portuguese sounds - most time needed here',
            exercises: ['não', 'mão', 'limões', 'mães', 'irmãos', 'coração', 'avião']
        }
    ]
};

// =============================================================================
// GRAMMAR TEACHING ORDER
// =============================================================================

export const GRAMMAR_TEACHING_ORDER = {
    description: 'Order for introducing grammatical concepts',
    
    sequence: [
        {
            order: 1,
            concept: 'Subject + Verb + Object',
            prerequisite: null,
            example: 'Eu como pão.',
            note: 'Basic sentence structure - similar to English'
        },
        {
            order: 2,
            concept: 'Noun Gender (o/a)',
            prerequisite: 1,
            example: 'o livro, a casa',
            note: 'Must introduce early - affects everything'
        },
        {
            order: 3,
            concept: 'Adjective Agreement',
            prerequisite: 2,
            example: 'o carro vermelho, a casa vermelha',
            note: 'Adjectives change to match noun gender'
        },
        {
            order: 4,
            concept: 'Ser vs Estar',
            prerequisite: 1,
            example: 'Sou português. / Estou em Lisboa.',
            note: 'Critical distinction - teach with clear rules'
        },
        {
            order: 5,
            concept: 'Regular -AR Verb Conjugation',
            prerequisite: 1,
            example: 'falo, falas, fala, falamos, falam',
            note: 'Start with -AR as most common'
        },
        {
            order: 6,
            concept: 'Negation with "não"',
            prerequisite: 5,
            example: 'Não falo inglês.',
            note: 'Simple - just add não before verb'
        },
        {
            order: 7,
            concept: 'Question Formation',
            prerequisite: 6,
            example: 'Falas português? / O que fazes?',
            note: 'Rising intonation + question words'
        },
        {
            order: 8,
            concept: 'Regular -ER/-IR Conjugation',
            prerequisite: 5,
            example: 'como, comes... / parto, partes...',
            note: 'Build on -AR patterns'
        },
        {
            order: 9,
            concept: 'Irregular Verbs (ter, ir, fazer)',
            prerequisite: 8,
            example: 'tenho, tens... / vou, vais...',
            note: 'High-frequency irregulars'
        },
        {
            order: 10,
            concept: 'Progressive (estar a + infinitive)',
            prerequisite: 4,
            example: 'Estou a comer.',
            note: 'PT-PT uses "a + infinitive" not gerund'
        },
        {
            order: 11,
            concept: 'Near Future (ir + infinitive)',
            prerequisite: 9,
            example: 'Vou estudar amanhã.',
            note: 'Most common future in spoken language'
        },
        {
            order: 12,
            concept: 'Object Pronouns',
            prerequisite: 11,
            example: 'Vejo-te amanhã.',
            note: 'Pronoun placement is complex'
        },
        {
            order: 13,
            concept: 'Past Tense (Pretérito Perfeito)',
            prerequisite: 11,
            example: 'Ontem falei com ela.',
            note: 'Completed past actions'
        },
        {
            order: 14,
            concept: 'Imperfect Tense',
            prerequisite: 13,
            example: 'Quando era criança...',
            note: 'Background, habits, ongoing past'
        },
        {
            order: 15,
            concept: 'Subjunctive (basic)',
            prerequisite: 14,
            example: 'Espero que estejas bem.',
            note: 'After certain verbs/expressions'
        }
    ]
};

// =============================================================================
// LESSON SIZE GUIDELINES
// =============================================================================

export const LESSON_SIZE_GUIDELINES = {
    wordsPerLesson: {
        newWords: { min: 5, max: 10, recommended: 7 },
        reviewWords: { min: 3, max: 5, recommended: 4 },
        reason: 'Research shows 7±2 items is optimal for working memory'
    },
    
    challengesPerLesson: {
        minimum: 5,
        maximum: 15,
        recommended: 8,
        breakdown: {
            multipleChoice: '30% - for initial recognition',
            fillBlank: '30% - for contextual understanding',
            translation: '25% - for production',
            pronunciation: '15% - for speaking practice'
        }
    },
    
    sessionDuration: {
        minimum: '5 minutes',
        maximum: '20 minutes',
        optimal: '10-15 minutes',
        reason: 'Attention and retention decline after 15 minutes'
    },
    
    reviewInterval: {
        immediate: 'Same session - 2-3 mini reviews',
        sameDay: '4-6 hours later',
        nextDay: '24 hours',
        extended: 'FSRS algorithm determines based on performance'
    }
};

// =============================================================================
// EXPORT HELPERS
// =============================================================================

/**
 * Get lesson prerequisites
 */
export function getPrerequisites(lessonId) {
    for (const tier of MASTER_LEARNING_PATH.tiers) {
        const lesson = tier.sequence.find(l => l.id === lessonId);
        if (lesson) {
            return {
                lesson,
                tier: tier.tier,
                prerequisite: lesson.prerequisite,
                mustLearnBefore: lesson.mustLearnBefore || []
            };
        }
    }
    return null;
}

/**
 * Get recommended next lessons
 */
export function getRecommendedNextLessons(completedLessonIds) {
    const recommendations = [];
    
    for (const tier of MASTER_LEARNING_PATH.tiers) {
        for (const lesson of tier.sequence) {
            // Skip completed lessons
            if (completedLessonIds.includes(lesson.id)) continue;
            
            // Check if prerequisite is met
            if (!lesson.prerequisite || completedLessonIds.includes(lesson.prerequisite)) {
                recommendations.push({
                    id: lesson.id,
                    topic: lesson.topic,
                    tier: tier.tier,
                    reason: lesson.reason
                });
            }
        }
    }
    
    // Sort by tier, then by order
    return recommendations.sort((a, b) => {
        if (a.tier !== b.tier) return a.tier - b.tier;
        return a.order - b.order;
    });
}

/**
 * Get phoneme teaching sequence for a user's level
 */
export function getPhonemeSequence(currentPhonemeLevel = 1) {
    return PHONEME_TEACHING_ORDER.levels.filter(l => l.level >= currentPhonemeLevel);
}

/**
 * Get grammar sequence for user's level
 */
export function getGrammarSequence(completedGrammarConcepts = []) {
    return GRAMMAR_TEACHING_ORDER.sequence.filter(
        item => !completedGrammarConcepts.includes(item.order)
    );
}

export default {
    MASTER_LEARNING_PATH,
    PHONEME_TEACHING_ORDER,
    GRAMMAR_TEACHING_ORDER,
    LESSON_SIZE_GUIDELINES,
    getPrerequisites,
    getRecommendedNextLessons,
    getPhonemeSequence,
    getGrammarSequence
};
