/**
 * Building Blocks: Connectors (Conjunctions)
 * 
 * TIER 1 - Essential for connecting ideas
 * 
 * Connectors/conjunctions link words, phrases, and clauses.
 * These are fundamental for forming complete sentences.
 * 
 * Prerequisites: bb-001 (Pronouns)
 * 
 * @module data/building-blocks/connectors
 */

export const connectorsLesson = {
    id: 'bb-006',
    title: 'Connectors: E, Ou, Mas, Porque',
    topic: 'building-blocks',
    tier: 1,
    level: 'beginner',
    description: 'Learn essential conjunctions to connect ideas in Portuguese.',
    prerequisites: ['bb-001'],
    estimatedTime: '8 min',
    
    // Key concept
    concept: {
        title: 'Connecting Your Ideas',
        explanation: 'Connectors are the glue of language. They join words, phrases, and sentences together. These small words have big impact on meaning and flow.',
        mnemonic: 'E-OU-MAS-PORQUE: "Everyone Observes Usually More And Sometimes, Perhaps Or Reasons Question Usually Everything"... or just remember them as the 4 basic connectors!'
    },
    
    words: [
        {
            pt: 'e',
            en: 'and',
            audio: 'e',
            pronunciation: 'ee',
            type: 'conjunction',
            conjunctionType: 'coordinating',
            grammarNotes: 'The most common connector. Joins similar items, phrases, or clauses.',
            examples: [
                { pt: 'Café e leite.', en: 'Coffee and milk.' },
                { pt: 'Eu e tu.', en: 'You and I. (lit. I and you)' },
                { pt: 'Ele é alto e inteligente.', en: 'He is tall and intelligent.' },
                { pt: 'Estudo e trabalho.', en: 'I study and work.' }
            ],
            aiTip: 'Unlike English, Portuguese lists the speaker FIRST: "Eu e ele" not "Ele e eu".'
        },
        {
            pt: 'ou',
            en: 'or',
            audio: 'ou',
            pronunciation: 'oh',
            type: 'conjunction',
            conjunctionType: 'coordinating',
            grammarNotes: 'Used for alternatives or choices. Can be inclusive or exclusive depending on context.',
            examples: [
                { pt: 'Café ou chá?', en: 'Coffee or tea?' },
                { pt: 'Agora ou depois.', en: 'Now or later.' },
                { pt: 'Um ou dois.', en: 'One or two.' },
                { pt: 'Queres ir ou ficar?', en: 'Do you want to go or stay?' }
            ],
            aiTip: '"Ou" is pronounced like "oh", not like English "oo".'
        },
        {
            pt: 'mas',
            en: 'but',
            audio: 'mas',
            pronunciation: 'mahsh',
            type: 'conjunction',
            conjunctionType: 'coordinating',
            grammarNotes: 'Shows contrast or exception. Very common in everyday speech.',
            examples: [
                { pt: 'Pequeno mas forte.', en: 'Small but strong.' },
                { pt: 'Gosto de café, mas prefiro chá.', en: 'I like coffee, but I prefer tea.' },
                { pt: 'É caro, mas vale a pena.', en: 'It\'s expensive, but it\'s worth it.' }
            ],
            aiTip: 'In European Portuguese, final "s" often sounds like "sh".'
        },
        {
            pt: 'porque',
            en: 'because',
            audio: 'porque',
            pronunciation: 'por-keh',
            type: 'conjunction',
            conjunctionType: 'subordinating',
            grammarNotes: 'Gives reason or explanation. Note: "porquê" (with accent) is used at the end of sentences or as a noun.',
            culturalNote: 'Watch out for the different spellings: porque (because), porquê (why - at end), por que (why - in questions), por quê (why - at end of question).',
            examples: [
                { pt: 'Estou feliz porque é sexta-feira.', en: 'I\'m happy because it\'s Friday.' },
                { pt: 'Não vou porque estou cansado.', en: 'I\'m not going because I\'m tired.' },
                { pt: 'Falo português porque vivo em Portugal.', en: 'I speak Portuguese because I live in Portugal.' }
            ],
            aiTip: 'One word "porque" = because. Two words "por que" = why (in questions).'
        },
        {
            pt: 'também',
            en: 'also / too',
            audio: 'tambem',
            pronunciation: 'tahm-beng',
            type: 'adverb',
            conjunctionType: 'additive',
            grammarNotes: 'Adds information. Usually placed after the verb or at the end of the phrase.',
            examples: [
                { pt: 'Eu também.', en: 'Me too.' },
                { pt: 'Ela também fala inglês.', en: 'She also speaks English.' },
                { pt: 'Gosto de café e de chá também.', en: 'I like coffee and tea too.' }
            ],
            aiTip: 'Position matters: "Eu também gosto" (I also like) vs "Eu gosto também" (I like it too).'
        },
        {
            pt: 'então',
            en: 'so / then / therefore',
            audio: 'entao',
            pronunciation: 'en-tah-oo',
            type: 'adverb',
            conjunctionType: 'consecutive',
            grammarNotes: 'Shows consequence or sequence. Very versatile word in conversation.',
            culturalNote: 'Often used as filler or to start a response: "Então..." (So...)',
            examples: [
                { pt: 'Então, vamos?', en: 'So, shall we go?' },
                { pt: 'Tenho fome, então vou comer.', en: 'I\'m hungry, so I\'m going to eat.' },
                { pt: 'Primeiro estudas, então brincas.', en: 'First you study, then you play.' }
            ],
            aiTip: '"Então" is super common in conversation as a pause word, like "so" or "well" in English.'
        },
        {
            pt: 'quando',
            en: 'when',
            audio: 'quando',
            pronunciation: 'kwahn-doo',
            type: 'conjunction',
            conjunctionType: 'temporal',
            grammarNotes: 'Introduces time clauses. Can be a question word or connector.',
            examples: [
                { pt: 'Quando chegas?', en: 'When do you arrive?' },
                { pt: 'Telefona-me quando chegares.', en: 'Call me when you arrive.' },
                { pt: 'Quando era criança, vivia em Lisboa.', en: 'When I was a child, I lived in Lisbon.' }
            ],
            aiTip: '"Quando" as a question starts the sentence; as a connector, it links two clauses.'
        },
        {
            pt: 'se',
            en: 'if',
            audio: 'se',
            pronunciation: 'seh',
            type: 'conjunction',
            conjunctionType: 'conditional',
            grammarNotes: 'Introduces conditional clauses. Also used as reflexive pronoun (himself/herself).',
            examples: [
                { pt: 'Se quiseres, podemos ir.', en: 'If you want, we can go.' },
                { pt: 'Se chover, fico em casa.', en: 'If it rains, I\'ll stay home.' },
                { pt: 'Não sei se posso.', en: 'I don\'t know if I can.' }
            ],
            aiTip: 'Context tells you if "se" is "if" (connector) or reflexive (himself/herself).'
        }
    ],
    
    sentences: [
        { pt: 'Gosto de café e chá.', en: 'I like coffee and tea.' },
        { pt: 'Queres café ou chá?', en: 'Do you want coffee or tea?' },
        { pt: 'É pequeno, mas é muito bom.', en: 'It\'s small, but it\'s very good.' },
        { pt: 'Estudo porque quero aprender.', en: 'I study because I want to learn.' },
        { pt: 'Eu também falo português.', en: 'I also speak Portuguese.' },
        { pt: 'Então, o que pensas?', en: 'So, what do you think?' },
        { pt: 'Quando é que começa?', en: 'When does it start?' },
        { pt: 'Se pudesse, viajava mais.', en: 'If I could, I would travel more.' }
    ],
    
    challenges: [
        {
            type: 'multiple-choice',
            question: 'How do you say "and" in Portuguese?',
            options: ['ou', 'e', 'mas', 'porque'],
            correct: 1,
            explanation: '"E" means "and" - the simplest connector.'
        },
        {
            type: 'multiple-choice',
            question: '"Gosto de pizza ___ não gosto de hambúrguer." What connector fits?',
            options: ['e', 'ou', 'mas', 'porque'],
            correct: 2,
            explanation: '"Mas" (but) shows contrast: I like pizza BUT I don\'t like hamburger.'
        },
        {
            type: 'multiple-choice',
            question: 'Complete: "Estudo português ___ vivo em Portugal."',
            options: ['mas', 'ou', 'porque', 'e'],
            correct: 2,
            explanation: '"Porque" (because) gives the reason: I study Portuguese BECAUSE I live in Portugal.'
        },
        {
            type: 'fill-blank',
            sentence: 'Café ___ chá - qual preferes?',
            options: ['e', 'ou', 'mas'],
            correct: 1,
            explanation: '"Ou" (or) presents a choice between options.'
        },
        {
            type: 'fill-blank',
            sentence: 'Eu ___ quero um café.',
            options: ['também', 'mas', 'ou'],
            correct: 0,
            explanation: '"Também" (also/too) adds agreement: I ALSO want a coffee.'
        },
        {
            type: 'translate',
            prompt: 'I am tired but happy.',
            answer: 'Estou cansado mas feliz.',
            hints: ['estou = I am', 'cansado = tired', 'mas = but', 'feliz = happy']
        },
        {
            type: 'translate',
            prompt: 'So, what do you want?',
            answer: 'Então, o que queres?',
            hints: ['então = so', 'o que = what', 'queres = do you want']
        },
        {
            type: 'match',
            prompt: 'Match the Portuguese connector with its meaning',
            pairs: [
                { left: 'e', right: 'and' },
                { left: 'ou', right: 'or' },
                { left: 'mas', right: 'but' },
                { left: 'porque', right: 'because' }
            ]
        }
    ],
    
    // Quick reference
    quickReference: {
        basic: [
            { pt: 'e', en: 'and', use: 'Adding items/ideas' },
            { pt: 'ou', en: 'or', use: 'Choices/alternatives' },
            { pt: 'mas', en: 'but', use: 'Contrast/exception' },
            { pt: 'porque', en: 'because', use: 'Giving reasons' }
        ],
        advanced: [
            { pt: 'também', en: 'also/too', use: 'Adding agreement' },
            { pt: 'então', en: 'so/then', use: 'Consequence/sequence' },
            { pt: 'quando', en: 'when', use: 'Time clauses' },
            { pt: 'se', en: 'if', use: 'Conditions' }
        ]
    },
    
    dynamicAiTips: [
        {
            triggerCondition: 'porque_porquê_confusion',
            tip: '"Porque" (together, no accent) = because. "Porquê?" (with accent) = why? at end of sentence.'
        },
        {
            triggerCondition: 'wrong_connector',
            tip: 'Think about the relationship: Adding? → e. Choice? → ou. Contrast? → mas. Reason? → porque.'
        },
        {
            triggerCondition: 'também_position',
            tip: '"Também" can go after verb or at end: "Eu também quero" = "Eu quero também".'
        }
    ]
};

export default connectorsLesson;
