/**
 * Building Blocks: Prepositions
 * 
 * TIER 1 - Essential for expressing relationships
 * 
 * Prepositions show relationships between words (location, direction, time, etc.)
 * Portuguese prepositions often combine with articles (contractions).
 * 
 * Prerequisites: bb-001 (Pronouns), bb-005 (Articles)
 * 
 * @module data/building-blocks/prepositions
 */

export const prepositionsLesson = {
    id: 'bb-007',
    title: 'Prepositions: De, Em, Para, Com',
    topic: 'building-blocks',
    tier: 1,
    level: 'beginner',
    templateId: 'grammar',
    description: 'Learn essential prepositions and their contractions with articles.',
    prerequisites: ['bb-001', 'bb-005'],
    estimatedTime: '12 min',
    
    concept: {
        title: 'Portuguese Prepositions',
        explanation: 'Prepositions connect words and show relationships. In Portuguese, they often CONTRACT with articles: de + o = do, em + a = na. Learning these contractions is essential!',
        mnemonic: 'DE-EM-PARA-COM = "Destination, Environment, Movement, Path, Accompaniment, Relation, Approach, Connection, Ownership, Manner"'
    },
    
    words: [
        {
            pt: 'de',
            en: 'of / from',
            audio: 'de',
            pronunciation: 'deh',
            type: 'preposition',
            grammarNotes: 'Most common preposition. Shows origin, possession, material, content.',
            contractions: [
                { with: 'o', result: 'do', example: 'do livro (of the book)' },
                { with: 'a', result: 'da', example: 'da casa (of the house)' },
                { with: 'os', result: 'dos', example: 'dos carros (of the cars)' },
                { with: 'as', result: 'das', example: 'das pessoas (of the people)' },
                { with: 'um', result: 'dum', example: 'dum amigo (of a friend) - optional' },
                { with: 'uma', result: 'duma', example: 'duma cidade (of a city) - optional' }
            ],
            examples: [
                { pt: 'Sou de Portugal.', en: 'I am from Portugal.' },
                { pt: 'O livro do João.', en: 'João\'s book. (the book of João)' },
                { pt: 'Uma chávena de café.', en: 'A cup of coffee.' },
                { pt: 'A porta da casa.', en: 'The door of the house.' }
            ],
            aiTip: 'ALWAYS contract de + article: "do João" NOT "de o João".'
        },
        {
            pt: 'em',
            en: 'in / on / at',
            audio: 'em',
            pronunciation: 'eng',
            type: 'preposition',
            grammarNotes: 'Used for location (in, on, at). Contracts with articles.',
            contractions: [
                { with: 'o', result: 'no', example: 'no carro (in the car)' },
                { with: 'a', result: 'na', example: 'na mesa (on the table)' },
                { with: 'os', result: 'nos', example: 'nos livros (in the books)' },
                { with: 'as', result: 'nas', example: 'nas casas (in the houses)' },
                { with: 'um', result: 'num', example: 'num café (in a café)' },
                { with: 'uma', result: 'numa', example: 'numa cidade (in a city)' }
            ],
            examples: [
                { pt: 'Estou em casa.', en: 'I am at home.' },
                { pt: 'O livro está na mesa.', en: 'The book is on the table.' },
                { pt: 'Vivo no Porto.', en: 'I live in Porto.' },
                { pt: 'Em janeiro.', en: 'In January.' }
            ],
            aiTip: 'Use "em" for location with ESTAR: "Estou em Lisboa" / "Estou no hotel".'
        },
        {
            pt: 'para',
            en: 'to / for',
            audio: 'para',
            pronunciation: 'pah-rah',
            type: 'preposition',
            grammarNotes: 'Shows direction, purpose, recipient. In speech often shortened to "pra".',
            contractions: [
                { with: 'o', result: 'para o / pro', example: 'para o João / pro João' },
                { with: 'a', result: 'para a / pra', example: 'para a escola / pra escola' }
            ],
            examples: [
                { pt: 'Vou para Lisboa.', en: 'I\'m going to Lisbon.' },
                { pt: 'Isto é para ti.', en: 'This is for you.' },
                { pt: 'Estudo para aprender.', en: 'I study to learn.' },
                { pt: 'O comboio para o Porto.', en: 'The train to Porto.' }
            ],
            aiTip: 'In spoken Portuguese, "para" often becomes "pra": "Vou pra casa" = "Vou para casa".'
        },
        {
            pt: 'com',
            en: 'with',
            audio: 'com',
            pronunciation: 'kong',
            type: 'preposition',
            grammarNotes: 'Shows accompaniment, manner, or instrument. No contractions with articles.',
            specialContractions: [
                { with: 'mim', result: 'comigo', meaning: 'with me' },
                { with: 'ti', result: 'contigo', meaning: 'with you (informal)' },
                { with: 'si', result: 'consigo', meaning: 'with himself/yourself (formal)' },
                { with: 'nós', result: 'connosco', meaning: 'with us' }
            ],
            examples: [
                { pt: 'Vou com a Maria.', en: 'I\'m going with Maria.' },
                { pt: 'Café com leite.', en: 'Coffee with milk.' },
                { pt: 'Vens comigo?', en: 'Are you coming with me?' },
                { pt: 'Falo contigo depois.', en: 'I\'ll talk with you later.' }
            ],
            aiTip: 'Special forms: comigo (with me), contigo (with you), connosco (with us)!'
        },
        {
            pt: 'por',
            en: 'by / through / for',
            audio: 'por',
            pronunciation: 'poor',
            type: 'preposition',
            grammarNotes: 'Shows agent (passive), motion through, reason, exchange.',
            contractions: [
                { with: 'o', result: 'pelo', example: 'pelo caminho (through the path)' },
                { with: 'a', result: 'pela', example: 'pela janela (through the window)' },
                { with: 'os', result: 'pelos', example: 'pelos jardins (through the gardens)' },
                { with: 'as', result: 'pelas', example: 'pelas ruas (through the streets)' }
            ],
            examples: [
                { pt: 'Feito por mim.', en: 'Made by me.' },
                { pt: 'Vamos pelo parque.', en: 'Let\'s go through the park.' },
                { pt: 'Obrigado por tudo.', en: 'Thanks for everything.' },
                { pt: 'Pago dez euros por isto.', en: 'I\'ll pay ten euros for this.' }
            ],
            aiTip: '"Por" contracts to pel- with articles: pelo, pela, pelos, pelas.'
        },
        {
            pt: 'a',
            en: 'to / at',
            audio: 'a',
            pronunciation: 'ah',
            type: 'preposition',
            grammarNotes: 'Shows direction, recipient, time. Contracts with articles to form "ao/à".',
            contractions: [
                { with: 'o', result: 'ao', example: 'ao lado (at the side)' },
                { with: 'a', result: 'à', example: 'à direita (to the right)' },
                { with: 'os', result: 'aos', example: 'aos poucos (little by little)' },
                { with: 'as', result: 'às', example: 'às vezes (sometimes)' }
            ],
            examples: [
                { pt: 'Vou ao cinema.', en: 'I\'m going to the cinema.' },
                { pt: 'Estou à espera.', en: 'I am waiting.' },
                { pt: 'Às três horas.', en: 'At three o\'clock.' },
                { pt: 'À direita.', en: 'To the right.' }
            ],
            aiTip: 'The accent in "à" shows it\'s a contraction: a (preposition) + a (article) = à.'
        }
    ],
    
    // Contraction reference table
    contractionTable: {
        title: 'Preposition + Article Contractions',
        headers: ['Prep', '+ o', '+ a', '+ os', '+ as'],
        rows: [
            { prep: 'de', o: 'do', a: 'da', os: 'dos', as: 'das' },
            { prep: 'em', o: 'no', a: 'na', os: 'nos', as: 'nas' },
            { prep: 'a', o: 'ao', a: 'à', os: 'aos', as: 'às' },
            { prep: 'por', o: 'pelo', a: 'pela', os: 'pelos', as: 'pelas' }
        ]
    },
    
    sentences: [
        { pt: 'Sou de Lisboa.', en: 'I am from Lisbon.' },
        { pt: 'Estou no escritório.', en: 'I\'m at the office.' },
        { pt: 'Vou para casa.', en: 'I\'m going home.' },
        { pt: 'Venho com a Maria.', en: 'I\'m coming with Maria.' },
        { pt: 'Passo pelo parque.', en: 'I pass through the park.' },
        { pt: 'Vou ao médico.', en: 'I\'m going to the doctor.' },
        { pt: 'A chave da porta.', en: 'The key to the door.' },
        { pt: 'Às nove horas.', en: 'At nine o\'clock.' }
    ],
    
    challenges: [
        {
            type: 'multiple-choice',
            question: 'How do you say "from the house" (de + a casa)?',
            options: ['de a casa', 'da casa', 'do casa', 'na casa'],
            correct: 1,
            explanation: 'de + a = da. "Da casa" means "from/of the house".'
        },
        {
            type: 'multiple-choice',
            question: 'What is "em + o" (in the)?',
            options: ['emo', 'no', 'do', 'ao'],
            correct: 1,
            explanation: 'em + o = no. Example: "no carro" (in the car).'
        },
        {
            type: 'multiple-choice',
            question: 'How do you say "with me"?',
            options: ['com mim', 'comigo', 'de mim', 'para mim'],
            correct: 1,
            explanation: '"Com" + "mim" contracts to "comigo".'
        },
        {
            type: 'fill-blank',
            sentence: 'O livro está ___ mesa. (on the table)',
            options: ['no', 'na', 'da', 'do'],
            correct: 1,
            explanation: 'em + a (mesa is feminine) = na. "Na mesa" = on the table.'
        },
        {
            type: 'fill-blank',
            sentence: 'Sou ___ Portugal. (from)',
            options: ['de', 'em', 'para', 'com'],
            correct: 0,
            explanation: '"De" means "from" when expressing origin: "Sou de Portugal".'
        },
        {
            type: 'fill-blank',
            sentence: 'Vou ___ cinema. (to the)',
            options: ['ao', 'no', 'do', 'para'],
            correct: 0,
            explanation: 'a + o = ao. "Vou ao cinema" = I\'m going to the cinema.'
        },
        {
            type: 'translate',
            prompt: 'I am in Lisbon.',
            answer: 'Estou em Lisboa.',
            hints: ['estou = I am', 'em = in', 'Lisboa = Lisbon']
        },
        {
            type: 'translate',
            prompt: 'The book on the table.',
            answer: 'O livro na mesa.',
            hints: ['o = the', 'livro = book', 'na = on the (em + a)', 'mesa = table']
        },
        {
            type: 'match',
            prompt: 'Match the contraction',
            pairs: [
                { left: 'de + o', right: 'do' },
                { left: 'em + a', right: 'na' },
                { left: 'a + o', right: 'ao' },
                { left: 'por + a', right: 'pela' }
            ]
        }
    ],
    
    quickReference: {
        basicPrepositions: [
            { pt: 'de', en: 'of/from', use: 'Origin, possession' },
            { pt: 'em', en: 'in/on/at', use: 'Location' },
            { pt: 'para', en: 'to/for', use: 'Direction, purpose' },
            { pt: 'com', en: 'with', use: 'Accompaniment' },
            { pt: 'por', en: 'by/through', use: 'Agent, motion through' },
            { pt: 'a', en: 'to/at', use: 'Direction, time' }
        ],
        commonContractions: [
            'de + o = do, de + a = da',
            'em + o = no, em + a = na',
            'a + o = ao, a + a = à',
            'por + o = pelo, por + a = pela'
        ],
        comContractions: [
            'com + mim = comigo (with me)',
            'com + ti = contigo (with you)',
            'com + nós = connosco (with us)'
        ]
    },
    
    dynamicAiTips: [
        {
            triggerCondition: 'missing_contraction',
            tip: 'Don\'t forget contractions! "de o" → "do", "em a" → "na". They\'re not optional!'
        },
        {
            triggerCondition: 'para_vs_a',
            tip: '"Para" suggests permanent direction. "A" suggests temporary visit. "Vou para Lisboa" (moving there) vs "Vou a Lisboa" (visiting).'
        },
        {
            triggerCondition: 'wrong_comigo',
            tip: 'With pronouns: comigo (me), contigo (you), connosco (us) - NOT "com mim", "com ti".'
        }
    ]
};

export default prepositionsLesson;
