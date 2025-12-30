/**
 * Building Blocks: Articles (Definite & Indefinite)
 * 
 * TIER 1 - Essential for constructing sentences
 * 
 * Portuguese articles have gender (masculine/feminine) and number (singular/plural).
 * Articles must agree with the noun they accompany.
 * 
 * Prerequisites: bb-001 (Pronouns)
 * 
 * @module data/building-blocks/articles
 */

export const articlesLesson = {
    id: 'bb-005',
    title: 'Articles: O, A, Um, Uma',
    topic: 'building-blocks',
    tier: 1,
    level: 'beginner',
    templateId: 'grammar',
    description: 'Master the definite and indefinite articles in Portuguese.',
    prerequisites: ['bb-001'],
    estimatedTime: '10 min',
    
    // Key concept
    concept: {
        title: 'Portuguese Articles',
        explanation: 'Portuguese has TWO types of articles: Definite (the) and Indefinite (a/an). Each type has FOUR forms based on gender and number. The article MUST match the noun in gender and number.',
        mnemonic: 'O/A = THE (definite), Um/Uma = A/AN (indefinite). O/Um = masculine, A/Uma = feminine.'
    },
    
    words: [
        // Definite Articles
        {
            pt: 'o',
            en: 'the (masculine singular)',
            audio: 'o',
            pronunciation: 'oo',
            type: 'article',
            articleType: 'definite',
            gender: 'masculine',
            number: 'singular',
            grammarNotes: 'Used before masculine singular nouns. Most nouns ending in -o are masculine.',
            examples: [
                { pt: 'o livro', en: 'the book' },
                { pt: 'o carro', en: 'the car' },
                { pt: 'o homem', en: 'the man' }
            ],
            aiTip: 'Most nouns ending in -o, -or, -ão are masculine.'
        },
        {
            pt: 'a',
            en: 'the (feminine singular)',
            audio: 'a',
            pronunciation: 'ah',
            type: 'article',
            articleType: 'definite',
            gender: 'feminine',
            number: 'singular',
            grammarNotes: 'Used before feminine singular nouns. Most nouns ending in -a are feminine.',
            examples: [
                { pt: 'a casa', en: 'the house' },
                { pt: 'a mesa', en: 'the table' },
                { pt: 'a mulher', en: 'the woman' }
            ],
            aiTip: 'Most nouns ending in -a, -ade, -ção are feminine.'
        },
        {
            pt: 'os',
            en: 'the (masculine plural)',
            audio: 'os',
            pronunciation: 'oosh',
            type: 'article',
            articleType: 'definite',
            gender: 'masculine',
            number: 'plural',
            grammarNotes: 'Used before masculine plural nouns. Add -s to the singular article.',
            examples: [
                { pt: 'os livros', en: 'the books' },
                { pt: 'os carros', en: 'the cars' },
                { pt: 'os homens', en: 'the men' }
            ],
            aiTip: 'Simple: o → os. Just add -s for plural masculine articles.'
        },
        {
            pt: 'as',
            en: 'the (feminine plural)',
            audio: 'as',
            pronunciation: 'ahsh',
            type: 'article',
            articleType: 'definite',
            gender: 'feminine',
            number: 'plural',
            grammarNotes: 'Used before feminine plural nouns. Add -s to the singular article.',
            examples: [
                { pt: 'as casas', en: 'the houses' },
                { pt: 'as mesas', en: 'the tables' },
                { pt: 'as mulheres', en: 'the women' }
            ],
            aiTip: 'Simple: a → as. Just add -s for plural feminine articles.'
        },
        // Indefinite Articles
        {
            pt: 'um',
            en: 'a/an (masculine)',
            audio: 'um',
            pronunciation: 'oong',
            type: 'article',
            articleType: 'indefinite',
            gender: 'masculine',
            number: 'singular',
            grammarNotes: 'Used before masculine singular nouns when referring to any one of a kind.',
            examples: [
                { pt: 'um livro', en: 'a book' },
                { pt: 'um carro', en: 'a car' },
                { pt: 'um amigo', en: 'a friend (male)' }
            ],
            aiTip: 'The "m" is nasal - the sound should resonate in your nose.'
        },
        {
            pt: 'uma',
            en: 'a/an (feminine)',
            audio: 'uma',
            pronunciation: 'oo-mah',
            type: 'article',
            articleType: 'indefinite',
            gender: 'feminine',
            number: 'singular',
            grammarNotes: 'Used before feminine singular nouns when referring to any one of a kind.',
            examples: [
                { pt: 'uma casa', en: 'a house' },
                { pt: 'uma amiga', en: 'a friend (female)' },
                { pt: 'uma cidade', en: 'a city' }
            ],
            aiTip: 'Note: "uma" has two syllables, unlike "um" which is one nasal syllable.'
        },
        {
            pt: 'uns',
            en: 'some (masculine)',
            audio: 'uns',
            pronunciation: 'oonsh',
            type: 'article',
            articleType: 'indefinite',
            gender: 'masculine',
            number: 'plural',
            grammarNotes: 'Means "some" for masculine plural nouns. Less common than definite articles.',
            examples: [
                { pt: 'uns livros', en: 'some books' },
                { pt: 'uns amigos', en: 'some friends' },
                { pt: 'uns dias', en: 'some days' }
            ],
            aiTip: 'The plural indefinite articles mean "some" rather than just plural "a".'
        },
        {
            pt: 'umas',
            en: 'some (feminine)',
            audio: 'umas',
            pronunciation: 'oo-mahsh',
            type: 'article',
            articleType: 'indefinite',
            gender: 'feminine',
            number: 'plural',
            grammarNotes: 'Means "some" for feminine plural nouns.',
            examples: [
                { pt: 'umas casas', en: 'some houses' },
                { pt: 'umas pessoas', en: 'some people' },
                { pt: 'umas semanas', en: 'some weeks' }
            ],
            aiTip: 'Remember: plural indefinite = "some", not just grammatical plural.'
        }
    ],
    
    // Usage guide
    usageGuide: {
        title: 'When to Use Each Article',
        sections: [
            {
                name: 'Definite (o, a, os, as)',
                description: 'Use when referring to specific things or things in general',
                examples: [
                    { pt: 'O café é bom.', en: 'The coffee is good. (specific) / Coffee is good. (general)' },
                    { pt: 'Gosto da música.', en: 'I like music. (Portuguese uses article with general concepts)' }
                ]
            },
            {
                name: 'Indefinite (um, uma, uns, umas)',
                description: 'Use when referring to non-specific items or introducing something new',
                examples: [
                    { pt: 'Quero um café.', en: 'I want a coffee. (any coffee)' },
                    { pt: 'Vi uma mulher.', en: 'I saw a woman. (introducing)' }
                ]
            },
            {
                name: 'No Article',
                description: 'Omit article with professions after SER',
                examples: [
                    { pt: 'Sou professor.', en: 'I am a teacher. (NO article)' },
                    { pt: 'Ela é médica.', en: 'She is a doctor. (NO article)' }
                ]
            }
        ]
    },
    
    // Article summary table
    articleTable: {
        definite: {
            title: 'Definite Articles (The)',
            masculine: { singular: 'o', plural: 'os' },
            feminine: { singular: 'a', plural: 'as' }
        },
        indefinite: {
            title: 'Indefinite Articles (A/An/Some)',
            masculine: { singular: 'um', plural: 'uns' },
            feminine: { singular: 'uma', plural: 'umas' }
        }
    },
    
    sentences: [
        { pt: 'O livro é interessante.', en: 'The book is interesting.' },
        { pt: 'A casa é grande.', en: 'The house is big.' },
        { pt: 'Os carros são novos.', en: 'The cars are new.' },
        { pt: 'As mesas são de madeira.', en: 'The tables are made of wood.' },
        { pt: 'Tenho um carro.', en: 'I have a car.' },
        { pt: 'Ela tem uma casa bonita.', en: 'She has a beautiful house.' },
        { pt: 'Comprei uns livros.', en: 'I bought some books.' },
        { pt: 'Preciso de umas informações.', en: 'I need some information.' }
    ],
    
    challenges: [
        {
            type: 'multiple-choice',
            question: 'Which article goes with "livro" (book - masculine)?',
            options: ['a', 'o', 'as', 'uma'],
            correct: 1,
            explanation: '"Livro" is masculine singular, so use "o" (the) or "um" (a).'
        },
        {
            type: 'multiple-choice',
            question: 'Which article goes with "casas" (houses - feminine plural)?',
            options: ['o', 'a', 'os', 'as'],
            correct: 3,
            explanation: '"Casas" is feminine plural, so use "as" (the).'
        },
        {
            type: 'multiple-choice',
            question: 'How do you say "a book" (indefinite)?',
            options: ['o livro', 'um livro', 'a livro', 'uma livro'],
            correct: 1,
            explanation: '"Livro" is masculine, so use "um" for indefinite article.'
        },
        {
            type: 'fill-blank',
            sentence: '___ menina é inteligente. (The girl is intelligent.)',
            options: ['O', 'A', 'Um', 'Uma'],
            correct: 1,
            explanation: '"Menina" (girl) is feminine, so use "A" (the).'
        },
        {
            type: 'fill-blank',
            sentence: 'Quero ___ café. (I want a coffee.)',
            options: ['o', 'a', 'um', 'uma'],
            correct: 2,
            explanation: '"Café" is masculine, and we want "a coffee" (indefinite), so use "um".'
        },
        {
            type: 'fill-blank',
            sentence: '___ homens são altos. (The men are tall.)',
            options: ['O', 'A', 'Os', 'As'],
            correct: 2,
            explanation: '"Homens" is masculine plural, so use "Os".'
        },
        {
            type: 'translate',
            prompt: 'The woman has a house.',
            answer: 'A mulher tem uma casa.',
            hints: ['a = the (feminine)', 'mulher = woman', 'tem = has', 'uma = a (feminine)', 'casa = house']
        },
        {
            type: 'match',
            prompt: 'Match the article with its type',
            pairs: [
                { left: 'o', right: 'definite masculine singular' },
                { left: 'as', right: 'definite feminine plural' },
                { left: 'um', right: 'indefinite masculine singular' },
                { left: 'umas', right: 'indefinite feminine plural' }
            ]
        }
    ],
    
    // Quick reference
    quickReference: {
        table: [
            { type: 'Definite (The)', masc_sing: 'o', masc_plur: 'os', fem_sing: 'a', fem_plur: 'as' },
            { type: 'Indefinite (A/Some)', masc_sing: 'um', masc_plur: 'uns', fem_sing: 'uma', fem_plur: 'umas' }
        ],
        genderTips: [
            'Words ending in -o are usually masculine',
            'Words ending in -a are usually feminine',
            'Words ending in -ção, -dade, -agem are feminine',
            'Words ending in -or, -ão are usually masculine'
        ]
    },
    
    dynamicAiTips: [
        {
            triggerCondition: 'wrong_gender_article',
            tip: 'Check the noun ending: -o usually = masculine (o/um), -a usually = feminine (a/uma).'
        },
        {
            triggerCondition: 'missing_article',
            tip: 'Portuguese uses articles more than English. Even with general concepts: "Gosto da música" (I like music).'
        },
        {
            triggerCondition: 'article_with_profession',
            tip: 'Don\'t use articles with professions after SER: "Sou professor" NOT "Sou um professor".'
        }
    ]
};

export default articlesLesson;
