/**
 * Building Blocks: Verb SER (to be - permanent)
 * 
 * TIER 1 - Must learn after pronouns
 * 
 * "Ser" is one of the most important Portuguese verbs.
 * It expresses permanent states, identity, origin, characteristics.
 * 
 * Prerequisites: bb-001 (Personal Pronouns)
 * 
 * @module data/building-blocks/verbs-ser
 */

export const verbSerLesson = {
    id: 'bb-002',
    title: 'Verb: Ser (to be - permanent)',
    topic: 'building-blocks',
    tier: 1,
    level: 'beginner',
    description: 'The essential verb for expressing identity, origin, and permanent characteristics.',
    prerequisites: ['bb-001'], // Requires pronouns first
    estimatedTime: '15 min',
    
    // Key concept introduction
    concept: {
        title: 'SER vs ESTAR',
        explanation: 'Portuguese has TWO verbs for "to be": SER and ESTAR. SER is for permanent things (identity, profession, origin, characteristics). ESTAR is for temporary states (location, emotions, conditions). This lesson covers SER.',
        mnemonic: 'SER = "Situation/State that Endures Regularly" - things that don\'t change easily.'
    },
    
    words: [
        {
            pt: 'sou',
            en: 'I am',
            audio: 'sou',
            pronunciation: 'soh',
            type: 'verb',
            tense: 'present',
            person: '1st singular',
            infinitive: 'ser',
            grammarNotes: 'First person singular of "ser". Used for identity, profession, nationality.',
            culturalNote: 'Often used to introduce yourself: "Sou o João" (I\'m João).',
            examples: [
                { pt: 'Eu sou português.', en: 'I am Portuguese.' },
                { pt: 'Sou médico.', en: 'I am a doctor.' },
                { pt: 'Sou de Lisboa.', en: 'I am from Lisbon.' }
            ],
            aiTip: 'No article needed with professions: "Sou médico" not "Sou um médico".'
        },
        {
            pt: 'és',
            en: 'you are (informal)',
            audio: 'es',
            pronunciation: 'ehsh',
            type: 'verb',
            tense: 'present',
            person: '2nd singular informal',
            infinitive: 'ser',
            grammarNotes: 'Informal second person. The accent distinguishes it from "es" (archaic).',
            culturalNote: 'Used with "tu" - informal settings like friends, family.',
            examples: [
                { pt: 'Tu és muito inteligente.', en: 'You are very intelligent.' },
                { pt: 'És de onde?', en: 'Where are you from? (informal)' }
            ],
            aiTip: 'Notice the acute accent (é) - it indicates the stressed syllable.'
        },
        {
            pt: 'é',
            en: 'is / you are (formal)',
            audio: 'e',
            pronunciation: 'eh',
            type: 'verb',
            tense: 'present',
            person: '3rd singular',
            infinitive: 'ser',
            grammarNotes: 'Used with ele/ela/você. Most common form in daily conversation.',
            culturalNote: 'This form covers he/she AND formal you (você).',
            examples: [
                { pt: 'Ele é meu amigo.', en: 'He is my friend.' },
                { pt: 'Ela é professora.', en: 'She is a teacher.' },
                { pt: 'Você é muito amável.', en: 'You are very kind. (formal)' },
                { pt: 'Isto é importante.', en: 'This is important.' }
            ],
            aiTip: 'This single form works for he, she, it, and formal you!'
        },
        {
            pt: 'somos',
            en: 'we are',
            audio: 'somos',
            pronunciation: 'soh-moosh',
            type: 'verb',
            tense: 'present',
            person: '1st plural',
            infinitive: 'ser',
            grammarNotes: 'First person plural. Used with "nós" or "a gente" (though "a gente é" uses singular).',
            culturalNote: 'In casual speech, "A gente é" (singular form) is often used instead of "Nós somos".',
            examples: [
                { pt: 'Nós somos amigos.', en: 'We are friends.' },
                { pt: 'Somos de Portugal.', en: 'We are from Portugal.' }
            ],
            aiTip: 'Remember: "A gente" = we, but uses "é" (singular): "A gente é portuguesa".'
        },
        {
            pt: 'são',
            en: 'they are / you are (plural)',
            audio: 'sao',
            pronunciation: 'sah-oon',
            type: 'verb',
            tense: 'present',
            person: '3rd plural',
            infinitive: 'ser',
            grammarNotes: 'Third person plural. Also used with "vocês" (you all). The til (~) indicates nasal sound.',
            culturalNote: 'Also used to tell time: "São duas horas" (It\'s two o\'clock).',
            examples: [
                { pt: 'Eles são estudantes.', en: 'They are students.' },
                { pt: 'Vocês são bem-vindos.', en: 'You all are welcome.' },
                { pt: 'São dez euros.', en: 'It\'s ten euros.' }
            ],
            aiTip: 'The nasal ~ao sound is unique to Portuguese. Practice it!'
        }
    ],
    
    // When to use SER
    usageGuide: {
        title: 'When to use SER',
        categories: [
            {
                name: 'Identity',
                description: 'Who someone IS',
                examples: [
                    { pt: 'Sou o Pedro.', en: 'I\'m Pedro.' },
                    { pt: 'Ela é minha mãe.', en: 'She is my mother.' }
                ]
            },
            {
                name: 'Profession',
                description: 'What someone does (permanently)',
                examples: [
                    { pt: 'Sou professor.', en: 'I am a teacher.' },
                    { pt: 'Ele é médico.', en: 'He is a doctor.' }
                ]
            },
            {
                name: 'Origin',
                description: 'Where someone is FROM',
                examples: [
                    { pt: 'Sou de Lisboa.', en: 'I am from Lisbon.' },
                    { pt: 'Somos portugueses.', en: 'We are Portuguese.' }
                ]
            },
            {
                name: 'Characteristics',
                description: 'Permanent traits',
                examples: [
                    { pt: 'Ela é alta.', en: 'She is tall.' },
                    { pt: 'O carro é vermelho.', en: 'The car is red.' }
                ]
            },
            {
                name: 'Time & Date',
                description: 'Telling time and dates',
                examples: [
                    { pt: 'Que horas são?', en: 'What time is it?' },
                    { pt: 'São três horas.', en: 'It\'s three o\'clock.' },
                    { pt: 'Hoje é segunda-feira.', en: 'Today is Monday.' }
                ]
            },
            {
                name: 'Material',
                description: 'What something is made of',
                examples: [
                    { pt: 'A mesa é de madeira.', en: 'The table is (made) of wood.' }
                ]
            }
        ]
    },
    
    sentences: [
        { pt: 'Eu sou de Portugal.', en: 'I am from Portugal.' },
        { pt: 'Tu és muito simpático.', en: 'You are very nice. (informal)' },
        { pt: 'Ela é professora de português.', en: 'She is a Portuguese teacher.' },
        { pt: 'Nós somos estudantes.', en: 'We are students.' },
        { pt: 'Eles são meus amigos.', en: 'They are my friends.' },
        { pt: 'O céu é azul.', en: 'The sky is blue.' },
        { pt: 'Isto é muito interessante.', en: 'This is very interesting.' },
        { pt: 'Que horas são?', en: 'What time is it?' }
    ],
    
    // Conjugation table
    conjugationTable: {
        infinitive: 'ser',
        meaning: 'to be (permanent)',
        present: {
            'eu': 'sou',
            'tu': 'és',
            'ele/ela/você': 'é',
            'nós': 'somos',
            'eles/elas/vocês': 'são'
        }
    },
    
    challenges: [
        {
            type: 'multiple-choice',
            question: 'How do you say "I am" with the verb SER?',
            options: ['é', 'sou', 'somos', 'são'],
            correct: 1,
            explanation: '"Sou" is the first person singular of "ser" (I am).'
        },
        {
            type: 'multiple-choice',
            question: 'Which form of SER would you use with "eles"?',
            options: ['é', 'somos', 'são', 'sou'],
            correct: 2,
            explanation: '"São" is used with eles/elas/vocês (they/you all).'
        },
        {
            type: 'multiple-choice',
            question: '"O Carlos é professor." What does this mean?',
            options: ['Carlos has a teacher', 'Carlos is a teacher', 'Carlos was a teacher', 'Carlos will be a teacher'],
            correct: 1,
            explanation: '"É professor" means "is a teacher" - profession uses SER.'
        },
        {
            type: 'translate',
            prompt: 'We are from Lisbon.',
            answer: 'Nós somos de Lisboa.',
            hints: ['nós = we', 'somos = we are (ser)', 'de = from', 'Lisboa = Lisbon']
        },
        {
            type: 'translate',
            prompt: 'She is tall.',
            answer: 'Ela é alta.',
            hints: ['ela = she', 'é = is (ser)', 'alta = tall (feminine)']
        },
        {
            type: 'fill-blank',
            sentence: 'Eu ___ médico.',
            options: ['é', 'sou', 'são'],
            correct: 1,
            explanation: '"Sou" is the correct form for "eu" (I am a doctor).'
        },
        {
            type: 'fill-blank',
            sentence: 'Eles ___ portugueses.',
            options: ['é', 'somos', 'são'],
            correct: 2,
            explanation: '"São" is used with "eles" (They are Portuguese).'
        },
        {
            type: 'match',
            prompt: 'Match the pronoun with the correct form of SER',
            pairs: [
                { left: 'eu', right: 'sou' },
                { left: 'tu', right: 'és' },
                { left: 'ela', right: 'é' },
                { left: 'nós', right: 'somos' },
                { left: 'eles', right: 'são' }
            ]
        }
    ],
    
    // Quick reference for conjugation
    quickReference: {
        conjugation: [
            { pronoun: 'eu', form: 'sou', example: 'Eu sou português.' },
            { pronoun: 'tu', form: 'és', example: 'Tu és simpático.' },
            { pronoun: 'ele/ela/você', form: 'é', example: 'Ele é professor.' },
            { pronoun: 'nós', form: 'somos', example: 'Nós somos amigos.' },
            { pronoun: 'eles/elas/vocês', form: 'são', example: 'Eles são de Lisboa.' }
        ],
        keyUses: ['Identity', 'Origin', 'Profession', 'Characteristics', 'Time/Date', 'Material']
    },
    
    dynamicAiTips: [
        {
            triggerCondition: 'confused_ser_estar',
            tip: 'Remember: SER = permanent (I AM tall, she IS a doctor). ESTAR = temporary (I AM tired, she IS happy today).'
        },
        {
            triggerCondition: 'wrong_conjugation',
            tip: 'Check the pronoun! eu→sou, tu→és, ele/ela/você→é, nós→somos, eles/elas→são'
        },
        {
            triggerCondition: 'adding_article_to_profession',
            tip: 'In Portuguese, don\'t use "um/uma" with professions: "Sou médico" NOT "Sou um médico".'
        }
    ]
};

export default verbSerLesson;
