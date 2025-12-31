/**
 * Building Blocks: Personal Pronouns
 * 
 * TIER 1 - Must learn first before other lessons
 * 
 * Personal pronouns are the foundation of Portuguese sentences.
 * Learning these first allows users to construct basic sentences
 * immediately when combined with verbs.
 * 
 * @module data/building-blocks/pronouns
 */

export const pronounsLesson = {
    id: 'bb-001',
    title: 'Personal Pronouns',
    topic: 'building-blocks',
    tier: 1,
    level: 'beginner',
    templateId: 'grammar',
    description: 'Essential pronouns for constructing any Portuguese sentence.',
    prerequisites: [], // This is the first lesson - no prerequisites
    estimatedTime: '10 min',
    
    words: [
        {
            pt: 'eu',
            en: 'I',
            audio: 'eu',
            pronunciation: 'eh-oo',
            type: 'pronoun',
            person: '1st singular',
            grammarNotes: 'Subject pronoun. Often omitted in Portuguese when conjugation makes the subject clear.',
            culturalNote: 'In Portuguese, the pronoun is often dropped because verb conjugation already indicates the subject.',
            examples: [
                { pt: 'Eu falo português.', en: 'I speak Portuguese.' },
                { pt: 'Eu sou de Lisboa.', en: 'I am from Lisbon.' }
            ],
            aiTip: 'Practice saying "Eu sou..." (I am...) to introduce yourself.'
        },
        {
            pt: 'tu',
            en: 'you (informal)',
            audio: 'tu',
            pronunciation: 'too',
            type: 'pronoun',
            person: '2nd singular informal',
            grammarNotes: 'Informal "you" used with friends, family, and peers. Uses 2nd person verb conjugation.',
            culturalNote: 'In Portugal, "tu" is common in casual settings. Some regions prefer "você" even informally.',
            examples: [
                { pt: 'Tu falas inglês?', en: 'Do you speak English? (informal)' },
                { pt: 'Tu és muito simpático.', en: 'You are very nice. (informal)' }
            ],
            aiTip: 'Use "tu" only when you\'re sure the relationship is informal.'
        },
        {
            pt: 'você',
            en: 'you (formal/neutral)',
            audio: 'voce',
            pronunciation: 'voh-seh',
            type: 'pronoun',
            person: '2nd singular formal',
            grammarNotes: 'Formal "you" that uses 3rd person verb conjugation (same as ele/ela).',
            culturalNote: 'More common in Brazil. In Portugal, used for respect or in professional settings.',
            examples: [
                { pt: 'Você fala português?', en: 'Do you speak Portuguese? (formal)' },
                { pt: 'Você é de onde?', en: 'Where are you from? (formal)' }
            ],
            aiTip: 'When unsure, use "você" - it\'s safer in professional or new situations.'
        },
        {
            pt: 'ele',
            en: 'he',
            audio: 'ele',
            pronunciation: 'eh-leh',
            type: 'pronoun',
            person: '3rd singular masculine',
            grammarNotes: 'Masculine third person singular. Used for male people and masculine nouns.',
            culturalNote: 'Portuguese nouns have gender, so even objects can be "ele" if masculine.',
            examples: [
                { pt: 'Ele é meu amigo.', en: 'He is my friend.' },
                { pt: 'Ele mora em Lisboa.', en: 'He lives in Lisbon.' }
            ],
            aiTip: 'Remember: ele = he, ela = she. The ending -e vs -a often indicates gender.'
        },
        {
            pt: 'ela',
            en: 'she',
            audio: 'ela',
            pronunciation: 'eh-lah',
            type: 'pronoun',
            person: '3rd singular feminine',
            grammarNotes: 'Feminine third person singular. Used for female people and feminine nouns.',
            culturalNote: 'Many Portuguese words ending in -a are feminine.',
            examples: [
                { pt: 'Ela é minha irmã.', en: 'She is my sister.' },
                { pt: 'Ela trabalha no hospital.', en: 'She works at the hospital.' }
            ],
            aiTip: 'Notice how ela ends in -a, matching feminine noun patterns.'
        },
        {
            pt: 'nós',
            en: 'we',
            audio: 'nos',
            pronunciation: 'nohsh',
            type: 'pronoun',
            person: '1st plural',
            grammarNotes: 'First person plural. The accent (ó) indicates stress. Informal alternative: "a gente" (takes 3rd person singular).',
            culturalNote: 'In casual speech, "a gente" is very common in Portugal as an alternative to "nós".',
            examples: [
                { pt: 'Nós falamos português.', en: 'We speak Portuguese.' },
                { pt: 'Nós vamos ao Porto.', en: 'We are going to Porto.' }
            ],
            aiTip: 'Informal tip: "A gente fala português" is equivalent to "Nós falamos português".'
        },
        {
            pt: 'eles',
            en: 'they (masculine/mixed)',
            audio: 'eles',
            pronunciation: 'eh-lesh',
            type: 'pronoun',
            person: '3rd plural masculine',
            grammarNotes: 'Used for groups of males or mixed groups. Even one male in a group makes it "eles".',
            culturalNote: 'Portuguese follows the grammatical rule where masculine form is used for mixed groups.',
            examples: [
                { pt: 'Eles são estudantes.', en: 'They are students. (masc/mixed)' },
                { pt: 'Eles vivem no Brasil.', en: 'They live in Brazil.' }
            ],
            aiTip: 'Mixed group = masculine plural. This is standard in Portuguese grammar.'
        },
        {
            pt: 'elas',
            en: 'they (feminine)',
            audio: 'elas',
            pronunciation: 'eh-lash',
            type: 'pronoun',
            person: '3rd plural feminine',
            grammarNotes: 'Used ONLY for groups of all females. One male switches to "eles".',
            culturalNote: 'Use only when the entire group is female.',
            examples: [
                { pt: 'Elas são professoras.', en: 'They are teachers. (all female)' },
                { pt: 'Elas trabalham juntas.', en: 'They work together. (all female)' }
            ],
            aiTip: 'Remember: elas = all female, eles = any males present or mixed group.'
        }
    ],
    
    sentences: [
        { pt: 'Eu sou português.', en: 'I am Portuguese. (male)' },
        { pt: 'Tu és muito inteligente.', en: 'You are very intelligent. (informal)' },
        { pt: 'Você é bem-vindo.', en: 'You are welcome. (formal)' },
        { pt: 'Ele é médico.', en: 'He is a doctor.' },
        { pt: 'Ela é advogada.', en: 'She is a lawyer.' },
        { pt: 'Nós somos amigos.', en: 'We are friends.' },
        { pt: 'Eles são do Porto.', en: 'They are from Porto. (masc/mixed)' },
        { pt: 'Elas são estudantes.', en: 'They are students. (all female)' }
    ],
    
    challenges: [
        {
            type: 'multiple-choice',
            question: 'How do you say "I" in Portuguese?',
            options: ['tu', 'eu', 'ele', 'nós'],
            correct: 1,
            explanation: '"Eu" is the first person singular pronoun meaning "I".'
        },
        {
            type: 'multiple-choice',
            question: 'Which pronoun would you use to address your boss formally?',
            options: ['tu', 'você', 'ele', 'eu'],
            correct: 1,
            explanation: '"Você" is the formal "you" used in professional settings.'
        },
        {
            type: 'multiple-choice',
            question: 'If a group has 5 women and 1 man, which pronoun do you use?',
            options: ['elas', 'eles', 'nós', 'vocês'],
            correct: 1,
            explanation: 'In Portuguese, any male presence makes the group "eles" (masculine).'
        },
        {
            type: 'translate',
            prompt: 'We are from Portugal.',
            answer: 'Nós somos de Portugal.',
            hints: ['nós = we', 'somos = are (1st plural of ser)', 'de = from']
        },
        {
            type: 'translate',
            prompt: 'She is my friend.',
            answer: 'Ela é minha amiga.',
            hints: ['ela = she', 'é = is', 'minha = my (feminine)', 'amiga = friend (female)']
        },
        {
            type: 'fill-blank',
            sentence: '___ falo português.',
            options: ['Eu', 'Tu', 'Ele'],
            correct: 0,
            explanation: '"Eu falo" = "I speak". The verb ending -o indicates first person.'
        },
        {
            type: 'fill-blank',
            sentence: '___ são estudantes.',
            context: '(referring to a group of women)',
            options: ['Eles', 'Elas', 'Nós'],
            correct: 1,
            explanation: 'For an all-female group, use "Elas".'
        }
    ],
    
    // Summary cards for quick review
    quickReference: {
        singular: [
            { pronoun: 'eu', meaning: 'I', usage: '1st person' },
            { pronoun: 'tu', meaning: 'you (informal)', usage: '2nd person informal' },
            { pronoun: 'você', meaning: 'you (formal)', usage: '2nd person formal' },
            { pronoun: 'ele', meaning: 'he', usage: '3rd person masc' },
            { pronoun: 'ela', meaning: 'she', usage: '3rd person fem' }
        ],
        plural: [
            { pronoun: 'nós', meaning: 'we', usage: '1st person plural' },
            { pronoun: 'eles', meaning: 'they (m/mixed)', usage: '3rd person masc/mixed' },
            { pronoun: 'elas', meaning: 'they (f)', usage: '3rd person fem only' }
        ]
    },
    
    // AI-powered tips that update based on user performance
    dynamicAiTips: [
        {
            triggerCondition: 'confused_tu_voce',
            tip: 'Having trouble choosing between tu and você? When meeting someone new or in any professional context, default to "você". It\'s safer and more respectful.'
        },
        {
            triggerCondition: 'confused_gender_pronouns',
            tip: 'Remember the gender pattern: words ending in -e (ele, eles) are masculine, words ending in -a (ela, elas) are feminine.'
        },
        {
            triggerCondition: 'forgetting_nos_accent',
            tip: 'Don\'t forget the accent! "Nós" (we) has an acute accent. This distinguishes it from "nos" (us/ourselves).'
        }
    ]
};

export default pronounsLesson;
