/**
 * Building Blocks: Negation & Affirmation
 * 
 * TIER 1 - Essential for expressing yes/no and negatives
 * 
 * Learn how to affirm, deny, and negate in Portuguese.
 * Portuguese allows double negatives (unlike English!).
 * 
 * Prerequisites: bb-001 (Pronouns)
 * 
 * @module data/building-blocks/negation
 */

export const negationLesson = {
    id: 'bb-009',
    title: 'Negation: Sim, Não, Nunca, Nada',
    topic: 'building-blocks',
    tier: 1,
    level: 'beginner',
    templateId: 'standard',
    description: 'Learn to affirm, deny, and express negation in Portuguese.',
    prerequisites: ['bb-001'],
    estimatedTime: '8 min',
    
    concept: {
        title: 'Negation in Portuguese',
        explanation: 'Portuguese negation is simple: put "não" before the verb. Unlike English, Portuguese USES double negatives: "Não tenho nada" (I don\'t have nothing = I have nothing). The more negatives, the more emphatic!',
        mnemonic: 'NÃO goes BEFORE the verb. Double negatives are CORRECT and EMPHATIC!'
    },
    
    words: [
        {
            pt: 'sim',
            en: 'yes',
            audio: 'sim',
            pronunciation: 'seeng',
            type: 'adverb',
            category: 'affirmation',
            grammarNotes: 'Basic affirmation. Nasal ending. Can be emphasized: "Sim, sim!"',
            examples: [
                { pt: 'Sim, quero.', en: 'Yes, I want to.' },
                { pt: 'Sim, obrigado.', en: 'Yes, thank you.' },
                { pt: 'Sim, é verdade.', en: 'Yes, it\'s true.' },
                { pt: 'Sim, sim, já vou!', en: 'Yes, yes, I\'m coming!' }
            ],
            aiTip: 'In casual speech, "sim" can become "sii" (stretched). Also, nodding alone works!'
        },
        {
            pt: 'não',
            en: 'no / not',
            audio: 'nao',
            pronunciation: 'nah-oo',
            type: 'adverb',
            category: 'negation',
            grammarNotes: 'Most important negative word. Goes BEFORE the verb to negate. Also answers "no".',
            examples: [
                { pt: 'Não, obrigado.', en: 'No, thank you.' },
                { pt: 'Não falo inglês.', en: 'I don\'t speak English.' },
                { pt: 'Não é verdade.', en: 'It\'s not true.' },
                { pt: 'Porque não?', en: 'Why not?' }
            ],
            aiTip: 'Position matters: "Não" BEFORE verb. "Eu não falo" NOT "Eu falo não".'
        },
        {
            pt: 'nunca',
            en: 'never',
            audio: 'nunca',
            pronunciation: 'noon-kah',
            type: 'adverb',
            category: 'negation',
            grammarNotes: 'Can be used alone or with "não" for emphasis. Both are correct!',
            examples: [
                { pt: 'Nunca fui a Lisboa.', en: 'I\'ve never been to Lisbon.' },
                { pt: 'Não vou nunca.', en: 'I\'m never going. (emphatic)' },
                { pt: 'Nunca mais!', en: 'Never again!' },
                { pt: 'Nunca é tarde.', en: 'It\'s never too late.' }
            ],
            aiTip: '"Nunca" alone OR "não...nunca" both work. Double negative = MORE emphatic.'
        },
        {
            pt: 'nada',
            en: 'nothing / anything',
            audio: 'nada',
            pronunciation: 'nah-dah',
            type: 'pronoun',
            category: 'negation',
            grammarNotes: 'Means "nothing" with não, "anything" in questions. Common in "de nada" (you\'re welcome).',
            examples: [
                { pt: 'Não sei nada.', en: 'I don\'t know anything.' },
                { pt: 'Nada a declarar.', en: 'Nothing to declare.' },
                { pt: 'De nada!', en: 'You\'re welcome!' },
                { pt: 'Não há nada.', en: 'There\'s nothing.' }
            ],
            aiTip: '"De nada" = you\'re welcome. One of the most useful phrases!'
        },
        {
            pt: 'ninguém',
            en: 'nobody / anyone',
            audio: 'ninguem',
            pronunciation: 'ning-geng',
            type: 'pronoun',
            category: 'negation',
            grammarNotes: 'Refers to people. "Nobody" with não, "anyone" in questions.',
            examples: [
                { pt: 'Não há ninguém.', en: 'There\'s nobody.' },
                { pt: 'Ninguém sabe.', en: 'Nobody knows.' },
                { pt: 'Não vi ninguém.', en: 'I didn\'t see anyone.' },
                { pt: 'Há alguém? Não, ninguém.', en: 'Is anyone there? No, nobody.' }
            ],
            aiTip: 'Opposite of "alguém" (someone). Both have nasal endings.'
        },
        {
            pt: 'nenhum / nenhuma',
            en: 'none / no (adjective)',
            audio: 'nenhum',
            pronunciation: 'nen-yoong / nen-yoo-mah',
            type: 'adjective',
            category: 'negation',
            grammarNotes: 'Agrees with noun: nenhum (masc), nenhuma (fem). Means "no" as in "no problem".',
            examples: [
                { pt: 'Nenhum problema.', en: 'No problem.' },
                { pt: 'Não tenho nenhuma ideia.', en: 'I have no idea.' },
                { pt: 'Nenhum deles veio.', en: 'None of them came.' },
                { pt: 'De modo nenhum!', en: 'No way!' }
            ],
            aiTip: 'Match gender: "nenhum livro" (no book), "nenhuma casa" (no house).'
        },
        {
            pt: 'também não',
            en: 'neither / not either',
            audio: 'tambem-nao',
            pronunciation: 'tahm-beng nah-oo',
            type: 'phrase',
            category: 'negation',
            grammarNotes: 'Used to agree with negative statement. Portuguese version of "me neither".',
            examples: [
                { pt: 'Eu também não.', en: 'Me neither.' },
                { pt: 'Não gosto. - Eu também não.', en: 'I don\'t like it. - Me neither.' },
                { pt: 'Ele também não vem.', en: 'He\'s not coming either.' }
            ],
            aiTip: '"Também" = also. "Também não" = also not = neither/me neither.'
        },
        {
            pt: 'ainda não',
            en: 'not yet',
            audio: 'ainda-nao',
            pronunciation: 'ah-een-dah nah-oo',
            type: 'phrase',
            category: 'negation',
            grammarNotes: '"Ainda" = still/yet. "Ainda não" = not yet. Implies it will happen.',
            examples: [
                { pt: 'Ainda não chegou.', en: 'He hasn\'t arrived yet.' },
                { pt: 'Ainda não sei.', en: 'I don\'t know yet.' },
                { pt: 'Já comeste? Ainda não.', en: 'Have you eaten? Not yet.' }
            ],
            aiTip: '"Já" = already. "Ainda não" = not yet. Common pair!'
        }
    ],
    
    // Negation patterns
    negationPatterns: {
        title: 'How to Negate',
        patterns: [
            {
                name: 'Simple Negation',
                rule: 'Não + verb',
                example: { pt: 'Não falo português.', en: 'I don\'t speak Portuguese.' }
            },
            {
                name: 'Double Negation',
                rule: 'Não + verb + negative word',
                example: { pt: 'Não sei nada.', en: 'I don\'t know anything.' }
            },
            {
                name: 'Negative Word First',
                rule: 'Negative word + verb (no need for "não")',
                example: { pt: 'Nunca fui lá.', en: 'I never went there.' }
            },
            {
                name: 'Emphatic Double',
                rule: 'Não + verb + nunca/nada/ninguém',
                example: { pt: 'Não vou nunca!', en: 'I\'m never going!' }
            }
        ]
    },
    
    sentences: [
        { pt: 'Não, obrigado.', en: 'No, thank you.' },
        { pt: 'Não falo português.', en: 'I don\'t speak Portuguese.' },
        { pt: 'Nunca estive em Lisboa.', en: 'I\'ve never been to Lisbon.' },
        { pt: 'Não sei nada.', en: 'I don\'t know anything.' },
        { pt: 'Ninguém sabe.', en: 'Nobody knows.' },
        { pt: 'Eu também não.', en: 'Me neither.' },
        { pt: 'Ainda não chegou.', en: 'He hasn\'t arrived yet.' },
        { pt: 'Não há nenhum problema.', en: 'There\'s no problem.' }
    ],
    
    challenges: [
        {
            type: 'multiple-choice',
            question: 'Where does "não" go in a sentence?',
            options: ['After the verb', 'Before the verb', 'At the end', 'Before the subject'],
            correct: 1,
            explanation: '"Não" goes BEFORE the verb: "Eu não falo" (I don\'t speak).'
        },
        {
            type: 'multiple-choice',
            question: '"Não sei nada" is:',
            options: ['Incorrect - double negative', 'Correct - emphatic negative', 'Only used in Brazil', 'Formal language only'],
            correct: 1,
            explanation: 'Double negatives are correct in Portuguese! They add emphasis.'
        },
        {
            type: 'multiple-choice',
            question: 'How do you say "Me neither"?',
            options: ['Eu também', 'Eu também não', 'Eu não também', 'Eu nunca'],
            correct: 1,
            explanation: '"Eu também não" = Me neither (I also not).'
        },
        {
            type: 'fill-blank',
            sentence: '___ falo inglês. (I don\'t speak English)',
            options: ['Não', 'Nunca', 'Nada'],
            correct: 0,
            explanation: '"Não" + verb = basic negation.'
        },
        {
            type: 'fill-blank',
            sentence: 'Não há ___. (There\'s nobody)',
            options: ['nada', 'ninguém', 'nunca'],
            correct: 1,
            explanation: '"Ninguém" = nobody (for people).'
        },
        {
            type: 'fill-blank',
            sentence: '___ não chegou. (He hasn\'t arrived yet)',
            options: ['Nunca', 'Ainda', 'Nada'],
            correct: 1,
            explanation: '"Ainda não" = not yet.'
        },
        {
            type: 'translate',
            prompt: 'I don\'t know anything.',
            answer: 'Não sei nada.',
            hints: ['não = not', 'sei = I know', 'nada = anything/nothing']
        },
        {
            type: 'translate',
            prompt: 'Nobody came.',
            answer: 'Ninguém veio.',
            hints: ['ninguém = nobody', 'veio = came (vir)']
        },
        {
            type: 'match',
            prompt: 'Match the negative word with its meaning',
            pairs: [
                { left: 'não', right: 'no/not' },
                { left: 'nunca', right: 'never' },
                { left: 'nada', right: 'nothing' },
                { left: 'ninguém', right: 'nobody' }
            ]
        }
    ],
    
    quickReference: {
        negativeWords: [
            { pt: 'não', en: 'no/not', position: 'before verb' },
            { pt: 'nunca', en: 'never', position: 'before or after verb' },
            { pt: 'nada', en: 'nothing', position: 'after verb' },
            { pt: 'ninguém', en: 'nobody', position: 'subject or object' },
            { pt: 'nenhum/a', en: 'none/no', position: 'with nouns' }
        ],
        usefulPhrases: [
            { pt: 'De nada!', en: 'You\'re welcome!' },
            { pt: 'Eu também não.', en: 'Me neither.' },
            { pt: 'Ainda não.', en: 'Not yet.' },
            { pt: 'Nunca mais!', en: 'Never again!' }
        ],
        rule: 'Double negatives are CORRECT and EMPHATIC in Portuguese!'
    },
    
    dynamicAiTips: [
        {
            triggerCondition: 'wrong_nao_position',
            tip: '"Não" goes BEFORE the verb, always: "Eu não falo" NOT "Eu falo não".'
        },
        {
            triggerCondition: 'avoiding_double_negative',
            tip: 'Unlike English, Portuguese LOVES double negatives! "Não sei nada" is perfect.'
        },
        {
            triggerCondition: 'ninguem_nada_confusion',
            tip: '"Ninguém" = nobody (people). "Nada" = nothing (things).'
        }
    ]
};

export default negationLesson;
