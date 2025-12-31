/**
 * Building Blocks: Possessives
 * 
 * TIER 1 - Essential for expressing ownership
 * 
 * Portuguese possessives agree with the thing possessed, not the owner.
 * This is a key difference from English!
 * 
 * Prerequisites: bb-001 (Pronouns), bb-005 (Articles)
 * 
 * @module data/building-blocks/possessives
 */

export const possessivesLesson = {
    id: 'bb-010',
    title: 'Possessives: Meu, Teu, Seu, Nosso',
    topic: 'building-blocks',
    tier: 1,
    level: 'beginner',
    templateId: 'grammar',
    description: 'Learn to express ownership with possessive adjectives and pronouns.',
    prerequisites: ['bb-001', 'bb-005'],
    estimatedTime: '12 min',
    
    concept: {
        title: 'Portuguese Possessives',
        explanation: 'Possessives in Portuguese agree with the THING POSSESSED, not the owner! "Meu livro" (my book - masc) but "Minha casa" (my house - fem). Each possessive has 4 forms: masc/fem × singular/plural.',
        mnemonic: 'Match the THING, not the person! "Meu" for masc things, "Minha" for fem things.'
    },
    
    words: [
        {
            pt: 'meu / minha / meus / minhas',
            en: 'my',
            audio: 'meu',
            pronunciation: 'meh-oo / meen-yah',
            type: 'possessive',
            owner: '1st singular (eu)',
            forms: {
                masculine_singular: 'meu',
                feminine_singular: 'minha',
                masculine_plural: 'meus',
                feminine_plural: 'minhas'
            },
            grammarNotes: 'Agrees with the possessed noun, not the speaker. "Meu" for masc, "minha" for fem.',
            examples: [
                { pt: 'O meu livro.', en: 'My book. (masc)' },
                { pt: 'A minha casa.', en: 'My house. (fem)' },
                { pt: 'Os meus amigos.', en: 'My friends. (masc pl)' },
                { pt: 'As minhas chaves.', en: 'My keys. (fem pl)' }
            ],
            aiTip: 'The article (o, a, os, as) is often used with possessives: "o meu carro".'
        },
        {
            pt: 'teu / tua / teus / tuas',
            en: 'your (informal)',
            audio: 'teu',
            pronunciation: 'teh-oo / too-ah',
            type: 'possessive',
            owner: '2nd singular informal (tu)',
            forms: {
                masculine_singular: 'teu',
                feminine_singular: 'tua',
                masculine_plural: 'teus',
                feminine_plural: 'tuas'
            },
            grammarNotes: 'Matches "tu" (informal you). Used with close friends, family.',
            examples: [
                { pt: 'O teu carro.', en: 'Your car. (informal)' },
                { pt: 'A tua mãe.', en: 'Your mother. (informal)' },
                { pt: 'Os teus livros.', en: 'Your books. (informal)' },
                { pt: 'As tuas ideias.', en: 'Your ideas. (informal)' }
            ],
            aiTip: 'Use "teu/tua" with people you\'d address as "tu" (informal you).'
        },
        {
            pt: 'seu / sua / seus / suas',
            en: 'your (formal) / his / her / its / their',
            audio: 'seu',
            pronunciation: 'seh-oo / soo-ah',
            type: 'possessive',
            owner: '3rd singular/plural; 2nd formal (você)',
            forms: {
                masculine_singular: 'seu',
                feminine_singular: 'sua',
                masculine_plural: 'seus',
                feminine_plural: 'suas'
            },
            grammarNotes: 'Can be ambiguous! Covers: his, her, its, your (formal), their. Context clarifies.',
            culturalNote: 'To avoid ambiguity, Portuguese often uses "dele/dela" (of him/her) instead of "seu".',
            examples: [
                { pt: 'O seu nome.', en: 'Your name. (formal) / His/Her name.' },
                { pt: 'A sua casa.', en: 'Your house. (formal) / His/Her house.' },
                { pt: 'O carro dele.', en: 'His car. (clearer)' },
                { pt: 'A casa dela.', en: 'Her house. (clearer)' }
            ],
            aiTip: 'Use "dele" (his), "dela" (her), "deles/delas" (their) to avoid ambiguity with "seu".'
        },
        {
            pt: 'nosso / nossa / nossos / nossas',
            en: 'our',
            audio: 'nosso',
            pronunciation: 'noh-soo / noh-sah',
            type: 'possessive',
            owner: '1st plural (nós)',
            forms: {
                masculine_singular: 'nosso',
                feminine_singular: 'nossa',
                masculine_plural: 'nossos',
                feminine_plural: 'nossas'
            },
            grammarNotes: 'Corresponds to "nós" (we). Agreement with possessed noun.',
            examples: [
                { pt: 'O nosso país.', en: 'Our country.' },
                { pt: 'A nossa família.', en: 'Our family.' },
                { pt: 'Os nossos planos.', en: 'Our plans.' },
                { pt: 'As nossas férias.', en: 'Our vacation/holidays.' }
            ],
            aiTip: '"Nosso" is straightforward - no ambiguity like "seu"!'
        },
        {
            pt: 'dele / dela / deles / delas',
            en: 'his / her / their',
            audio: 'dele',
            pronunciation: 'deh-leh / deh-lah',
            type: 'possessive',
            owner: '3rd person (clarifying)',
            grammarNotes: 'Literally "of him/her/them". ALWAYS comes AFTER the noun. Used to clarify ownership.',
            examples: [
                { pt: 'O carro dele.', en: 'His car. (the car of him)' },
                { pt: 'A casa dela.', en: 'Her house. (the house of her)' },
                { pt: 'Os filhos deles.', en: 'Their children. (of them - masc)' },
                { pt: 'As amigas delas.', en: 'Their friends. (of them - fem)' }
            ],
            aiTip: '"Dele" goes AFTER noun: "O livro dele" NOT "Dele livro". This is clearer than "seu".'
        }
    ],
    
    // Possessive forms table
    possessiveTable: {
        title: 'Possessive Forms',
        headers: ['Owner', 'Masc. Sg.', 'Fem. Sg.', 'Masc. Pl.', 'Fem. Pl.'],
        rows: [
            { owner: 'eu (I)', ms: 'meu', fs: 'minha', mp: 'meus', fp: 'minhas' },
            { owner: 'tu (you-inf)', ms: 'teu', fs: 'tua', mp: 'teus', fp: 'tuas' },
            { owner: 'ele/ela/você', ms: 'seu', fs: 'sua', mp: 'seus', fp: 'suas' },
            { owner: 'nós (we)', ms: 'nosso', fs: 'nossa', mp: 'nossos', fp: 'nossas' },
            { owner: 'eles/elas', ms: 'seu', fs: 'sua', mp: 'seus', fp: 'suas' }
        ]
    },
    
    // Clarification with de + pronoun
    clarification: {
        title: 'Clarifying Ownership with "de + pronoun"',
        explanation: 'Because "seu/sua" is ambiguous, use "de + pronoun" after the noun for clarity:',
        examples: [
            { ambiguous: 'O seu carro', meaning: 'Your/His/Her car', clear: 'O carro dele / dela' },
            { ambiguous: 'A sua casa', meaning: 'Your/His/Her house', clear: 'A casa dele / dela' }
        ]
    },
    
    sentences: [
        { pt: 'O meu nome é João.', en: 'My name is João.' },
        { pt: 'A tua mãe está em casa?', en: 'Is your mother at home?' },
        { pt: 'O nosso carro é azul.', en: 'Our car is blue.' },
        { pt: 'As minhas chaves estão na mesa.', en: 'My keys are on the table.' },
        { pt: 'Este é o livro dele.', en: 'This is his book.' },
        { pt: 'A casa dela é grande.', en: 'Her house is big.' },
        { pt: 'Os teus amigos são simpáticos.', en: 'Your friends are nice.' },
        { pt: 'A nossa família é pequena.', en: 'Our family is small.' }
    ],
    
    challenges: [
        {
            type: 'multiple-choice',
            question: '"___ casa é bonita" (MY house is beautiful). Casa is feminine, so:',
            options: ['Meu', 'Minha', 'Meus', 'Minhas'],
            correct: 1,
            explanation: '"Casa" is feminine singular, so use "Minha casa".'
        },
        {
            type: 'multiple-choice',
            question: 'Possessives agree with:',
            options: ['The owner', 'The thing possessed', 'Both', 'Neither'],
            correct: 1,
            explanation: 'Portuguese possessives agree with the THING POSSESSED, not the owner.'
        },
        {
            type: 'multiple-choice',
            question: 'How do you clearly say "his car" (avoiding ambiguity)?',
            options: ['O seu carro', 'O carro dele', 'Seu dele carro', 'O meu carro'],
            correct: 1,
            explanation: '"O carro dele" (the car of him) is unambiguous for "his car".'
        },
        {
            type: 'fill-blank',
            sentence: 'O ___ livro está na mesa. (My book - livro is masculine)',
            options: ['meu', 'minha', 'meus'],
            correct: 0,
            explanation: '"Livro" is masculine singular, so use "meu".'
        },
        {
            type: 'fill-blank',
            sentence: 'A ___ casa é grande. (Our house - casa is feminine)',
            options: ['nosso', 'nossa', 'nossos'],
            correct: 1,
            explanation: '"Casa" is feminine singular, so use "nossa".'
        },
        {
            type: 'fill-blank',
            sentence: 'Os ___ amigos são simpáticos. (Your friends - informal)',
            options: ['teu', 'tua', 'teus'],
            correct: 2,
            explanation: '"Amigos" is masculine plural, so use "teus".'
        },
        {
            type: 'translate',
            prompt: 'My keys are on the table.',
            answer: 'As minhas chaves estão na mesa.',
            hints: ['as = the (fem pl)', 'minhas = my (fem pl)', 'chaves = keys', 'estão = are', 'na = on the', 'mesa = table']
        },
        {
            type: 'translate',
            prompt: 'Her house is beautiful.',
            answer: 'A casa dela é bonita.',
            hints: ['a = the', 'casa = house', 'dela = her (of her)', 'é = is', 'bonita = beautiful']
        },
        {
            type: 'match',
            prompt: 'Match the possessive with the noun',
            pairs: [
                { left: 'meu', right: 'livro (book - masc)' },
                { left: 'minha', right: 'casa (house - fem)' },
                { left: 'meus', right: 'amigos (friends - masc pl)' },
                { left: 'minhas', right: 'chaves (keys - fem pl)' }
            ]
        }
    ],
    
    quickReference: {
        myForms: ['meu (m.sg)', 'minha (f.sg)', 'meus (m.pl)', 'minhas (f.pl)'],
        yourInformal: ['teu (m.sg)', 'tua (f.sg)', 'teus (m.pl)', 'tuas (f.pl)'],
        yourFormal: ['seu (m.sg)', 'sua (f.sg)', 'seus (m.pl)', 'suas (f.pl)'],
        our: ['nosso (m.sg)', 'nossa (f.sg)', 'nossos (m.pl)', 'nossas (f.pl)'],
        clarifiers: ['dele (his)', 'dela (her)', 'deles (their-m)', 'delas (their-f)'],
        rule: 'Possessives match the THING, not the owner!'
    },
    
    dynamicAiTips: [
        {
            triggerCondition: 'wrong_possessive_agreement',
            tip: 'Check the noun\'s gender! "Meu livro" (masc) but "Minha casa" (fem). Match the THING!'
        },
        {
            triggerCondition: 'seu_ambiguity',
            tip: '"Seu" is ambiguous (his/her/your). Use "dele/dela" after the noun to be clear.'
        },
        {
            triggerCondition: 'missing_article',
            tip: 'Portuguese often uses article + possessive: "O meu carro", not just "meu carro".'
        }
    ]
};

export default possessivesLesson;
