/**
 * Building Blocks: Verb ESTAR (to be - temporary)
 * 
 * TIER 1 - Must learn after pronouns and SER
 * 
 * "Estar" expresses temporary states, locations, emotions, conditions.
 * Understanding SER vs ESTAR is fundamental to Portuguese.
 * 
 * Prerequisites: bb-001 (Pronouns), bb-002 (Ser)
 * 
 * @module data/building-blocks/verbs-estar
 */

export const verbEstarLesson = {
    id: 'bb-003',
    title: 'Verb: Estar (to be - temporary)',
    topic: 'building-blocks',
    tier: 1,
    level: 'beginner',
    templateId: 'grammar',
    description: 'The essential verb for expressing temporary states, emotions, and locations.',
    prerequisites: ['bb-001', 'bb-002'], // Requires pronouns AND ser first
    estimatedTime: '15 min',
    
    // Key concept
    concept: {
        title: 'ESTAR: Temporary States',
        explanation: 'While SER expresses permanent characteristics, ESTAR is for temporary states, emotions, locations, and conditions that can change. Think: How are you RIGHT NOW?',
        mnemonic: 'ESTAR = "Existing State Temporarily At Rest" - things that are true NOW but may change.'
    },
    
    // Comparison with SER
    comparison: {
        title: 'SER vs ESTAR - Key Differences',
        examples: [
            {
                context: 'Describing a person',
                ser: { pt: 'Ela é bonita.', en: 'She is beautiful. (inherent trait)' },
                estar: { pt: 'Ela está bonita.', en: 'She looks beautiful. (today/right now)' }
            },
            {
                context: 'Describing mood',
                ser: { pt: 'Ele é feliz.', en: 'He is (a) happy (person). (personality)' },
                estar: { pt: 'Ele está feliz.', en: 'He is happy. (right now)' }
            },
            {
                context: 'Location vs Origin',
                ser: { pt: 'Sou de Lisboa.', en: 'I am from Lisbon. (origin - permanent)' },
                estar: { pt: 'Estou em Lisboa.', en: 'I am in Lisbon. (current location)' }
            }
        ]
    },
    
    words: [
        {
            pt: 'estou',
            en: 'I am (temporary)',
            audio: 'estou',
            pronunciation: 'shtoh',
            type: 'verb',
            tense: 'present',
            person: '1st singular',
            infinitive: 'estar',
            grammarNotes: 'First person singular of "estar". Note the "e" is silent - pronounced "shtou".',
            culturalNote: 'Used in greetings: "Como estás?" (How are you?) - asking about current state.',
            examples: [
                { pt: 'Estou bem.', en: 'I am well/fine.' },
                { pt: 'Estou cansado.', en: 'I am tired.' },
                { pt: 'Estou em casa.', en: 'I am at home.' }
            ],
            aiTip: 'The initial "e" in Portuguese ESTAR sounds like "sh" - "shtoh"!'
        },
        {
            pt: 'estás',
            en: 'you are (informal, temporary)',
            audio: 'estas',
            pronunciation: 'shtahsh',
            type: 'verb',
            tense: 'present',
            person: '2nd singular informal',
            infinitive: 'estar',
            grammarNotes: 'Informal second person of "estar". The accent (á) indicates stress.',
            culturalNote: 'Common greeting: "Como estás?" (How are you? - informal)',
            examples: [
                { pt: 'Como estás?', en: 'How are you? (informal)' },
                { pt: 'Estás bem?', en: 'Are you okay? (informal)' },
                { pt: 'Onde estás?', en: 'Where are you? (informal)' }
            ],
            aiTip: 'Notice how "estás" asks about current state, not permanent condition.'
        },
        {
            pt: 'está',
            en: 'is / are (formal, temporary)',
            audio: 'esta',
            pronunciation: 'shtah',
            type: 'verb',
            tense: 'present',
            person: '3rd singular',
            infinitive: 'estar',
            grammarNotes: 'Third person singular, also used with você (formal you). Most common form.',
            culturalNote: 'Formal greeting: "Como está?" Also used for weather: "Está frio" (It\'s cold).',
            examples: [
                { pt: 'Ele está doente.', en: 'He is sick.' },
                { pt: 'Ela está em Lisboa.', en: 'She is in Lisbon.' },
                { pt: 'Como está?', en: 'How are you? (formal)' },
                { pt: 'Está frio hoje.', en: 'It\'s cold today.' }
            ],
            aiTip: 'ESTAR is used for weather: "Está quente/frio/a chover" (It\'s hot/cold/raining).'
        },
        {
            pt: 'estamos',
            en: 'we are (temporary)',
            audio: 'estamos',
            pronunciation: 'shtah-moosh',
            type: 'verb',
            tense: 'present',
            person: '1st plural',
            infinitive: 'estar',
            grammarNotes: 'First person plural. Like SER, "a gente" uses singular form: "a gente está".',
            culturalNote: 'Common: "Estamos bem" (We\'re fine) - answering "Como estão?"',
            examples: [
                { pt: 'Estamos aqui.', en: 'We are here.' },
                { pt: 'Estamos a aprender português.', en: 'We are learning Portuguese.' },
                { pt: 'Estamos prontos.', en: 'We are ready.' }
            ],
            aiTip: 'Portugal uses "estar a + infinitive" for present continuous: "Estou a comer" (I am eating).'
        },
        {
            pt: 'estão',
            en: 'they are / you all are (temporary)',
            audio: 'estao',
            pronunciation: 'shtah-oon',
            type: 'verb',
            tense: 'present',
            person: '3rd plural',
            infinitive: 'estar',
            grammarNotes: 'Third person plural. Used with eles/elas/vocês. Nasal ~ao ending.',
            culturalNote: 'Question: "Onde estão?" (Where are they? / Where are you all?)',
            examples: [
                { pt: 'Eles estão em casa.', en: 'They are at home.' },
                { pt: 'Como estão?', en: 'How are you all?' },
                { pt: 'Vocês estão atrasados.', en: 'You all are late.' }
            ],
            aiTip: 'Same nasal sound as "são" - practice the ~ao ending!'
        }
    ],
    
    // When to use ESTAR
    usageGuide: {
        title: 'When to use ESTAR',
        categories: [
            {
                name: 'Location',
                description: 'Where someone/something IS right now',
                examples: [
                    { pt: 'Estou em casa.', en: 'I am at home.' },
                    { pt: 'O livro está na mesa.', en: 'The book is on the table.' }
                ]
            },
            {
                name: 'Emotions/Mood',
                description: 'How someone FEELS now',
                examples: [
                    { pt: 'Estou feliz.', en: 'I am happy (right now).' },
                    { pt: 'Ela está triste.', en: 'She is sad.' }
                ]
            },
            {
                name: 'Health/Condition',
                description: 'Physical state at the moment',
                examples: [
                    { pt: 'Estou cansado.', en: 'I am tired.' },
                    { pt: 'Ele está doente.', en: 'He is sick.' }
                ]
            },
            {
                name: 'Weather',
                description: 'Current weather conditions',
                examples: [
                    { pt: 'Está frio.', en: 'It\'s cold.' },
                    { pt: 'Está a chover.', en: 'It\'s raining.' }
                ]
            },
            {
                name: 'Ongoing Actions',
                description: 'Present continuous (estar a + infinitive)',
                examples: [
                    { pt: 'Estou a trabalhar.', en: 'I am working.' },
                    { pt: 'Ela está a comer.', en: 'She is eating.' }
                ]
            }
        ]
    },
    
    sentences: [
        { pt: 'Como estás?', en: 'How are you? (informal)' },
        { pt: 'Estou muito bem, obrigado.', en: 'I\'m very well, thank you.' },
        { pt: 'Onde estás?', en: 'Where are you? (informal)' },
        { pt: 'Estou em Lisboa.', en: 'I\'m in Lisbon.' },
        { pt: 'Ela está cansada.', en: 'She is tired.' },
        { pt: 'Está frio hoje.', en: 'It\'s cold today.' },
        { pt: 'Estamos a aprender português.', en: 'We are learning Portuguese.' },
        { pt: 'Eles estão em casa.', en: 'They are at home.' }
    ],
    
    // Conjugation table
    conjugationTable: {
        infinitive: 'estar',
        meaning: 'to be (temporary)',
        present: {
            'eu': 'estou',
            'tu': 'estás',
            'ele/ela/você': 'está',
            'nós': 'estamos',
            'eles/elas/vocês': 'estão'
        }
    },
    
    challenges: [
        {
            type: 'multiple-choice',
            question: 'How do you say "I am (temporarily)" with ESTAR?',
            options: ['está', 'estou', 'estamos', 'estão'],
            correct: 1,
            explanation: '"Estou" is the first person singular of "estar" (I am - temporary).'
        },
        {
            type: 'multiple-choice',
            question: '"Estou cansado" means:',
            options: ['I am always tired', 'I am tired (now)', 'I was tired', 'I will be tired'],
            correct: 1,
            explanation: 'ESTAR expresses temporary states - being tired right now.'
        },
        {
            type: 'multiple-choice',
            question: 'Which verb would you use: "Ela ___ em Lisboa" (She is IN Lisbon)?',
            options: ['é', 'está'],
            correct: 1,
            explanation: 'ESTAR is used for current location. SER + de would be for origin.'
        },
        {
            type: 'translate',
            prompt: 'How are you? (formal)',
            answer: 'Como está?',
            hints: ['como = how', 'está = are (you - formal, with estar)']
        },
        {
            type: 'translate',
            prompt: 'I am at home.',
            answer: 'Estou em casa.',
            hints: ['estou = I am (estar)', 'em = at/in', 'casa = home/house']
        },
        {
            type: 'translate',
            prompt: 'It\'s cold today.',
            answer: 'Está frio hoje.',
            hints: ['está = it is (estar)', 'frio = cold', 'hoje = today']
        },
        {
            type: 'fill-blank',
            sentence: 'Eles ___ em casa.',
            options: ['está', 'estou', 'estão'],
            correct: 2,
            explanation: '"Estão" is used with "eles" (They are at home).'
        },
        {
            type: 'fill-blank',
            sentence: 'Eu ___ feliz hoje.',
            options: ['sou', 'estou', 'são'],
            correct: 1,
            explanation: '"Estou" with ESTAR because happy TODAY is temporary.'
        },
        {
            type: 'choice',
            question: '"Ela ___ professora." Which verb? (She is a teacher - profession)',
            options: ['é (ser)', 'está (estar)'],
            correct: 0,
            explanation: 'Professions are permanent characteristics - use SER: "Ela é professora."'
        }
    ],
    
    // Quick reference
    quickReference: {
        conjugation: [
            { pronoun: 'eu', form: 'estou', example: 'Estou bem.' },
            { pronoun: 'tu', form: 'estás', example: 'Como estás?' },
            { pronoun: 'ele/ela/você', form: 'está', example: 'Está frio.' },
            { pronoun: 'nós', form: 'estamos', example: 'Estamos em casa.' },
            { pronoun: 'eles/elas/vocês', form: 'estão', example: 'Onde estão?' }
        ],
        keyUses: ['Location', 'Emotions', 'Health', 'Weather', 'Ongoing Actions'],
        vsSerTip: 'Ask yourself: Can this change? If yes → ESTAR. If permanent → SER.'
    },
    
    dynamicAiTips: [
        {
            triggerCondition: 'confused_ser_estar',
            tip: 'ESTAR = temporary/changeable. "Estou cansado" (I\'m tired now) vs "Sou alto" (I\'m tall - permanent).'
        },
        {
            triggerCondition: 'wrong_location_verb',
            tip: 'For current location, always use ESTAR: "Estou em Lisboa" NOT "Sou em Lisboa".'
        },
        {
            triggerCondition: 'wrong_weather_verb',
            tip: 'Weather uses ESTAR because it changes: "Está frio/quente/a chover".'
        }
    ]
};

export default verbEstarLesson;
