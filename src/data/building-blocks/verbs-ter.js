/**
 * Building Blocks: Verb TER (to have)
 * 
 * TIER 1 - Essential verb for possession, age, expressions
 * 
 * "Ter" is crucial for expressing possession, age, and many idiomatic expressions.
 * Unlike English, Portuguese uses TER for age: "Tenho 30 anos" (I have 30 years).
 * 
 * Prerequisites: bb-001 (Pronouns)
 * 
 * @module data/building-blocks/verbs-ter
 */

export const verbTerLesson = {
    id: 'bb-004',
    title: 'Verb: Ter (to have)',
    topic: 'building-blocks',
    tier: 1,
    level: 'beginner',
    description: 'Essential verb for possession, age, and common expressions.',
    prerequisites: ['bb-001'],
    estimatedTime: '12 min',
    
    // Key concept
    concept: {
        title: 'TER - More Than Just "Have"',
        explanation: 'TER means "to have" but is used differently than English. Most importantly, Portuguese uses TER for age: "Tenho 20 anos" (I have 20 years = I am 20 years old). It\'s also used in many expressions.',
        mnemonic: 'TER = "To Express/Relate (having)" - you HAVE things, age, and feelings.'
    },
    
    words: [
        {
            pt: 'tenho',
            en: 'I have',
            audio: 'tenho',
            pronunciation: 'ten-yoo',
            type: 'verb',
            tense: 'present',
            person: '1st singular',
            infinitive: 'ter',
            grammarNotes: 'First person singular. Note the "nh" sounds like Spanish "ñ" or Italian "gn".',
            culturalNote: 'Used for age: "Tenho 25 anos" (I\'m 25 years old).',
            examples: [
                { pt: 'Tenho um carro.', en: 'I have a car.' },
                { pt: 'Tenho 30 anos.', en: 'I am 30 years old.' },
                { pt: 'Tenho fome.', en: 'I am hungry. (lit. I have hunger)' }
            ],
            aiTip: '"nh" is like "ny" in "canyon" - practice: "ten-yoo".'
        },
        {
            pt: 'tens',
            en: 'you have (informal)',
            audio: 'tens',
            pronunciation: 'tensh',
            type: 'verb',
            tense: 'present',
            person: '2nd singular informal',
            infinitive: 'ter',
            grammarNotes: 'Informal second person. Used with "tu".',
            culturalNote: 'Common question: "Tens tempo?" (Do you have time?)',
            examples: [
                { pt: 'Tens irmãos?', en: 'Do you have siblings?' },
                { pt: 'Quantos anos tens?', en: 'How old are you? (informal)' },
                { pt: 'Tens razão.', en: 'You\'re right. (lit. You have reason)' }
            ],
            aiTip: 'In Portugal, "tens" is very common in casual speech.'
        },
        {
            pt: 'tem',
            en: 'has / have (formal)',
            audio: 'tem',
            pronunciation: 'teng',
            type: 'verb',
            tense: 'present',
            person: '3rd singular',
            infinitive: 'ter',
            grammarNotes: 'Third person singular. The "m" has a nasal quality.',
            culturalNote: 'Formal question: "Quantos anos tem?" (How old are you?)',
            examples: [
                { pt: 'Ela tem dois filhos.', en: 'She has two children.' },
                { pt: 'O hotel tem piscina.', en: 'The hotel has a pool.' },
                { pt: 'Você tem sede?', en: 'Are you thirsty? (formal)' }
            ],
            aiTip: 'Also used impersonally: "Tem café?" (Is there coffee? / Do you have coffee?)'
        },
        {
            pt: 'temos',
            en: 'we have',
            audio: 'temos',
            pronunciation: 'teh-moosh',
            type: 'verb',
            tense: 'present',
            person: '1st plural',
            infinitive: 'ter',
            grammarNotes: 'First person plural. The "-mos" ending is consistent across verbs.',
            culturalNote: '"Temos de ir" means "We have to go" - TER + de = obligation.',
            examples: [
                { pt: 'Temos uma casa grande.', en: 'We have a big house.' },
                { pt: 'Temos de estudar.', en: 'We have to study.' },
                { pt: 'Não temos tempo.', en: 'We don\'t have time.' }
            ],
            aiTip: 'TER + de + infinitive = "have to" (obligation): "Tenho de ir" (I have to go).'
        },
        {
            pt: 'têm',
            en: 'they have / you all have',
            audio: 'teem',
            pronunciation: 'tay-eng',
            type: 'verb',
            tense: 'present',
            person: '3rd plural',
            infinitive: 'ter',
            grammarNotes: 'Third person plural. Note the circumflex accent (ê) distinguishes from singular "tem".',
            culturalNote: 'The accent is the ONLY difference between "tem" (has) and "têm" (have - plural).',
            examples: [
                { pt: 'Eles têm muito trabalho.', en: 'They have a lot of work.' },
                { pt: 'Vocês têm razão.', en: 'You all are right.' },
                { pt: 'As casas têm jardim.', en: 'The houses have a garden.' }
            ],
            aiTip: 'Watch the accent! têm (plural) vs tem (singular) - spoken slightly longer.'
        }
    ],
    
    // Expressions with TER
    expressions: {
        title: 'Common Expressions with TER',
        list: [
            {
                pt: 'ter fome',
                en: 'to be hungry',
                literal: 'to have hunger',
                example: { pt: 'Tenho fome.', en: 'I\'m hungry.' }
            },
            {
                pt: 'ter sede',
                en: 'to be thirsty',
                literal: 'to have thirst',
                example: { pt: 'Tens sede?', en: 'Are you thirsty?' }
            },
            {
                pt: 'ter sono',
                en: 'to be sleepy',
                literal: 'to have sleep',
                example: { pt: 'Tenho muito sono.', en: 'I\'m very sleepy.' }
            },
            {
                pt: 'ter medo',
                en: 'to be afraid',
                literal: 'to have fear',
                example: { pt: 'Ela tem medo de cães.', en: 'She\'s afraid of dogs.' }
            },
            {
                pt: 'ter razão',
                en: 'to be right',
                literal: 'to have reason',
                example: { pt: 'Tens razão!', en: 'You\'re right!' }
            },
            {
                pt: 'ter pressa',
                en: 'to be in a hurry',
                literal: 'to have hurry',
                example: { pt: 'Tenho pressa.', en: 'I\'m in a hurry.' }
            },
            {
                pt: 'ter sorte',
                en: 'to be lucky',
                literal: 'to have luck',
                example: { pt: 'Temos muita sorte.', en: 'We\'re very lucky.' }
            },
            {
                pt: 'ter calor/frio',
                en: 'to be hot/cold (person)',
                literal: 'to have heat/cold',
                example: { pt: 'Tens frio?', en: 'Are you cold?' }
            }
        ]
    },
    
    sentences: [
        { pt: 'Tenho 25 anos.', en: 'I am 25 years old.' },
        { pt: 'Ela tem dois irmãos.', en: 'She has two brothers.' },
        { pt: 'Tens fome?', en: 'Are you hungry?' },
        { pt: 'Temos de ir.', en: 'We have to go.' },
        { pt: 'Não tenho tempo.', en: 'I don\'t have time.' },
        { pt: 'Ele tem razão.', en: 'He is right.' },
        { pt: 'Quantos anos tens?', en: 'How old are you?' },
        { pt: 'Eles têm uma casa bonita.', en: 'They have a beautiful house.' }
    ],
    
    // Conjugation table
    conjugationTable: {
        infinitive: 'ter',
        meaning: 'to have',
        present: {
            'eu': 'tenho',
            'tu': 'tens',
            'ele/ela/você': 'tem',
            'nós': 'temos',
            'eles/elas/vocês': 'têm'
        }
    },
    
    challenges: [
        {
            type: 'multiple-choice',
            question: 'How do you say "I have" in Portuguese?',
            options: ['tem', 'tenho', 'temos', 'têm'],
            correct: 1,
            explanation: '"Tenho" is the first person singular of "ter" (I have).'
        },
        {
            type: 'multiple-choice',
            question: 'How do you ask "How old are you?" (informal) in Portuguese?',
            options: ['Como estás?', 'Quantos anos tens?', 'Tens anos?', 'És velho?'],
            correct: 1,
            explanation: 'Portuguese uses TER for age: "Quantos anos tens?" (How many years do you have?)'
        },
        {
            type: 'multiple-choice',
            question: '"Tenho fome" means:',
            options: ['I have food', 'I am hungry', 'I make food', 'I want food'],
            correct: 1,
            explanation: '"Ter fome" = "to be hungry" (literally "to have hunger").'
        },
        {
            type: 'translate',
            prompt: 'I am 30 years old.',
            answer: 'Tenho 30 anos.',
            hints: ['tenho = I have', 'anos = years', 'Portuguese uses "have years" for age']
        },
        {
            type: 'translate',
            prompt: 'She has two children.',
            answer: 'Ela tem dois filhos.',
            hints: ['ela = she', 'tem = has', 'dois = two', 'filhos = children/sons']
        },
        {
            type: 'fill-blank',
            sentence: 'Eles ___ muito trabalho.',
            options: ['tem', 'temos', 'têm'],
            correct: 2,
            explanation: '"Têm" (with accent) is used with "eles" (They have a lot of work).'
        },
        {
            type: 'fill-blank',
            sentence: '___ de estudar. (We have to study)',
            options: ['Tem', 'Temos', 'Têm'],
            correct: 1,
            explanation: '"Temos" is "we have". TER + de = "have to".'
        },
        {
            type: 'match',
            prompt: 'Match the expression with its meaning',
            pairs: [
                { left: 'ter fome', right: 'to be hungry' },
                { left: 'ter sede', right: 'to be thirsty' },
                { left: 'ter razão', right: 'to be right' },
                { left: 'ter sorte', right: 'to be lucky' }
            ]
        }
    ],
    
    // Quick reference
    quickReference: {
        conjugation: [
            { pronoun: 'eu', form: 'tenho', example: 'Tenho um carro.' },
            { pronoun: 'tu', form: 'tens', example: 'Tens fome?' },
            { pronoun: 'ele/ela/você', form: 'tem', example: 'Ele tem razão.' },
            { pronoun: 'nós', form: 'temos', example: 'Temos de ir.' },
            { pronoun: 'eles/elas/vocês', form: 'têm', example: 'Eles têm sorte.' }
        ],
        keyUses: ['Possession', 'Age', 'Expressions', 'Obligation (ter de)'],
        expressionsTip: 'Many English "to be" expressions use TER in Portuguese: hungry, thirsty, cold, hot, right, afraid.'
    },
    
    dynamicAiTips: [
        {
            triggerCondition: 'age_with_ser',
            tip: 'Age uses TER, not SER! "Tenho 25 anos" NOT "Sou 25 anos".'
        },
        {
            triggerCondition: 'tem_vs_teem',
            tip: 'Watch the accent: tem (singular - he/she/you has) vs têm (plural - they have).'
        },
        {
            triggerCondition: 'expressions_with_estar',
            tip: 'Physical sensations use TER: "Tenho fome/sede/frio" NOT "Estou fome".'
        }
    ]
};

export default verbTerLesson;
