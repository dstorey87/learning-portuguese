/**
 * Portuguese Grammar Patterns Reference
 * 
 * Comprehensive grammar reference for AI lesson generation:
 * - Essential verb conjugations (ser, estar, ter, ir, fazer, etc.)
 * - Noun gender patterns and rules
 * - Article usage (definite/indefinite)
 * - Preposition patterns
 * - Sentence structure patterns
 * 
 * CRITICAL: European Portuguese (PT-PT) grammar conventions
 * 
 * @module data/ai-reference/grammar-patterns
 */

// =============================================================================
// VERB CONJUGATIONS - Present Tense
// =============================================================================

export const VERB_CONJUGATIONS = {
    // SER - To be (permanent states, identity)
    ser: {
        infinitive: 'ser',
        meaning: 'to be (permanent/identity)',
        irregular: true,
        usage: 'Identity, origin, profession, time, characteristics',
        present: {
            eu: 'sou',
            tu: 'és',
            'você/ele/ela': 'é',
            nós: 'somos',
            'vocês/eles/elas': 'são'
        },
        pastSimple: {
            eu: 'fui',
            tu: 'foste',
            'você/ele/ela': 'foi',
            nós: 'fomos',
            'vocês/eles/elas': 'foram'
        },
        imperfect: {
            eu: 'era',
            tu: 'eras',
            'você/ele/ela': 'era',
            nós: 'éramos',
            'vocês/eles/elas': 'eram'
        },
        future: {
            eu: 'serei',
            tu: 'serás',
            'você/ele/ela': 'será',
            nós: 'seremos',
            'vocês/eles/elas': 'serão'
        },
        examples: [
            { pt: 'Eu sou português.', en: 'I am Portuguese.' },
            { pt: 'Ela é médica.', en: 'She is a doctor.' },
            { pt: 'Nós somos amigos.', en: 'We are friends.' }
        ],
        teachingTip: 'SER is for WHO you are, WHAT you are, WHERE you are from. Permanent or defining characteristics.'
    },
    
    // ESTAR - To be (temporary states, location)
    estar: {
        infinitive: 'estar',
        meaning: 'to be (temporary/location)',
        irregular: true,
        usage: 'Location, temporary states, feelings, progressive actions',
        present: {
            eu: 'estou',
            tu: 'estás',
            'você/ele/ela': 'está',
            nós: 'estamos',
            'vocês/eles/elas': 'estão'
        },
        pastSimple: {
            eu: 'estive',
            tu: 'estiveste',
            'você/ele/ela': 'esteve',
            nós: 'estivemos',
            'vocês/eles/elas': 'estiveram'
        },
        imperfect: {
            eu: 'estava',
            tu: 'estavas',
            'você/ele/ela': 'estava',
            nós: 'estávamos',
            'vocês/eles/elas': 'estavam'
        },
        future: {
            eu: 'estarei',
            tu: 'estarás',
            'você/ele/ela': 'estará',
            nós: 'estaremos',
            'vocês/eles/elas': 'estarão'
        },
        examples: [
            { pt: 'Eu estou bem.', en: 'I am well.' },
            { pt: 'Ela está em casa.', en: 'She is at home.' },
            { pt: 'Estamos cansados.', en: 'We are tired.' }
        ],
        teachingTip: 'ESTAR is for HOW you are, WHERE you are NOW. Temporary states that can change.'
    },
    
    // TER - To have
    ter: {
        infinitive: 'ter',
        meaning: 'to have',
        irregular: true,
        usage: 'Possession, age, auxiliary verb (compound past)',
        present: {
            eu: 'tenho',
            tu: 'tens',
            'você/ele/ela': 'tem',
            nós: 'temos',
            'vocês/eles/elas': 'têm'
        },
        pastSimple: {
            eu: 'tive',
            tu: 'tiveste',
            'você/ele/ela': 'teve',
            nós: 'tivemos',
            'vocês/eles/elas': 'tiveram'
        },
        imperfect: {
            eu: 'tinha',
            tu: 'tinhas',
            'você/ele/ela': 'tinha',
            nós: 'tínhamos',
            'vocês/eles/elas': 'tinham'
        },
        future: {
            eu: 'terei',
            tu: 'terás',
            'você/ele/ela': 'terá',
            nós: 'teremos',
            'vocês/eles/elas': 'terão'
        },
        examples: [
            { pt: 'Eu tenho um cão.', en: 'I have a dog.' },
            { pt: 'Ela tem trinta anos.', en: 'She is thirty years old.' },
            { pt: 'Temos de ir.', en: 'We have to go.' }
        ],
        teachingTip: 'TER is used for possession and AGE (not ser/estar). "Ter que/de" means "have to".'
    },
    
    // IR - To go
    ir: {
        infinitive: 'ir',
        meaning: 'to go',
        irregular: true,
        usage: 'Movement, future (ir + infinitive)',
        present: {
            eu: 'vou',
            tu: 'vais',
            'você/ele/ela': 'vai',
            nós: 'vamos',
            'vocês/eles/elas': 'vão'
        },
        pastSimple: {
            eu: 'fui',
            tu: 'foste',
            'você/ele/ela': 'foi',
            nós: 'fomos',
            'vocês/eles/elas': 'foram'
        },
        imperfect: {
            eu: 'ia',
            tu: 'ias',
            'você/ele/ela': 'ia',
            nós: 'íamos',
            'vocês/eles/elas': 'iam'
        },
        future: {
            eu: 'irei',
            tu: 'irás',
            'você/ele/ela': 'irá',
            nós: 'iremos',
            'vocês/eles/elas': 'irão'
        },
        examples: [
            { pt: 'Eu vou ao supermercado.', en: 'I go to the supermarket.' },
            { pt: 'Vamos jantar.', en: 'Let\'s have dinner. / We\'re going to have dinner.' },
            { pt: 'Ela vai estudar.', en: 'She is going to study.' }
        ],
        teachingTip: 'IR + infinitive is the common way to express future in spoken Portuguese. "Vou falar" = "I\'m going to speak".'
    },
    
    // FAZER - To do/make
    fazer: {
        infinitive: 'fazer',
        meaning: 'to do, to make',
        irregular: true,
        usage: 'Actions, weather, time expressions',
        present: {
            eu: 'faço',
            tu: 'fazes',
            'você/ele/ela': 'faz',
            nós: 'fazemos',
            'vocês/eles/elas': 'fazem'
        },
        pastSimple: {
            eu: 'fiz',
            tu: 'fizeste',
            'você/ele/ela': 'fez',
            nós: 'fizemos',
            'vocês/eles/elas': 'fizeram'
        },
        imperfect: {
            eu: 'fazia',
            tu: 'fazias',
            'você/ele/ela': 'fazia',
            nós: 'fazíamos',
            'vocês/eles/elas': 'faziam'
        },
        future: {
            eu: 'farei',
            tu: 'farás',
            'você/ele/ela': 'fará',
            nós: 'faremos',
            'vocês/eles/elas': 'farão'
        },
        examples: [
            { pt: 'O que fazes?', en: 'What are you doing?' },
            { pt: 'Faz calor.', en: 'It\'s hot. (weather)' },
            { pt: 'Faz dois anos.', en: 'It\'s been two years.' }
        ],
        teachingTip: 'FAZER is used for weather (faz frio/calor) and time since (faz X anos). Very common verb!'
    },
    
    // PODER - Can/to be able to
    poder: {
        infinitive: 'poder',
        meaning: 'can, to be able to',
        irregular: true,
        usage: 'Ability, permission, possibility',
        present: {
            eu: 'posso',
            tu: 'podes',
            'você/ele/ela': 'pode',
            nós: 'podemos',
            'vocês/eles/elas': 'podem'
        },
        pastSimple: {
            eu: 'pude',
            tu: 'pudeste',
            'você/ele/ela': 'pôde',
            nós: 'pudemos',
            'vocês/eles/elas': 'puderam'
        },
        imperfect: {
            eu: 'podia',
            tu: 'podias',
            'você/ele/ela': 'podia',
            nós: 'podíamos',
            'vocês/eles/elas': 'podiam'
        },
        examples: [
            { pt: 'Posso ajudar?', en: 'Can I help?' },
            { pt: 'Não posso ir.', en: 'I can\'t go.' },
            { pt: 'Podes repetir?', en: 'Can you repeat?' }
        ],
        teachingTip: 'PODER + infinitive for ability or permission. Common in polite requests.'
    },
    
    // QUERER - To want
    querer: {
        infinitive: 'querer',
        meaning: 'to want',
        irregular: true,
        usage: 'Desires, wishes, ordering',
        present: {
            eu: 'quero',
            tu: 'queres',
            'você/ele/ela': 'quer',
            nós: 'queremos',
            'vocês/eles/elas': 'querem'
        },
        pastSimple: {
            eu: 'quis',
            tu: 'quiseste',
            'você/ele/ela': 'quis',
            nós: 'quisemos',
            'vocês/eles/elas': 'quiseram'
        },
        imperfect: {
            eu: 'queria',
            tu: 'querias',
            'você/ele/ela': 'queria',
            nós: 'queríamos',
            'vocês/eles/elas': 'queriam'
        },
        examples: [
            { pt: 'Quero água.', en: 'I want water.' },
            { pt: 'O que queres?', en: 'What do you want?' },
            { pt: 'Queria um café.', en: 'I would like a coffee.' }
        ],
        teachingTip: 'Use "Queria..." (imperfect) for polite requests, like "I would like..."'
    }
};

// Regular verb conjugation patterns
export const REGULAR_VERB_PATTERNS = {
    AR: {
        name: '-AR verbs',
        example: 'falar (to speak)',
        present: {
            stem: 'fal',
            endings: { eu: 'o', tu: 'as', 'ele/ela/você': 'a', nós: 'amos', 'eles/elas/vocês': 'am' }
        },
        pastSimple: {
            endings: { eu: 'ei', tu: 'aste', 'ele/ela/você': 'ou', nós: 'ámos', 'eles/elas/vocês': 'aram' }
        },
        imperfect: {
            endings: { eu: 'ava', tu: 'avas', 'ele/ela/você': 'ava', nós: 'ávamos', 'eles/elas/vocês': 'avam' }
        },
        commonVerbs: ['falar', 'andar', 'gostar', 'trabalhar', 'estudar', 'morar', 'ajudar', 'comprar', 'pagar']
    },
    ER: {
        name: '-ER verbs',
        example: 'comer (to eat)',
        present: {
            stem: 'com',
            endings: { eu: 'o', tu: 'es', 'ele/ela/você': 'e', nós: 'emos', 'eles/elas/vocês': 'em' }
        },
        pastSimple: {
            endings: { eu: 'i', tu: 'este', 'ele/ela/você': 'eu', nós: 'emos', 'eles/elas/vocês': 'eram' }
        },
        imperfect: {
            endings: { eu: 'ia', tu: 'ias', 'ele/ela/você': 'ia', nós: 'íamos', 'eles/elas/vocês': 'iam' }
        },
        commonVerbs: ['comer', 'beber', 'conhecer', 'escrever', 'entender', 'aprender', 'vender', 'correr']
    },
    IR: {
        name: '-IR verbs',
        example: 'partir (to leave)',
        present: {
            stem: 'part',
            endings: { eu: 'o', tu: 'es', 'ele/ela/você': 'e', nós: 'imos', 'eles/elas/vocês': 'em' }
        },
        pastSimple: {
            endings: { eu: 'i', tu: 'iste', 'ele/ela/você': 'iu', nós: 'imos', 'eles/elas/vocês': 'iram' }
        },
        imperfect: {
            endings: { eu: 'ia', tu: 'ias', 'ele/ela/você': 'ia', nós: 'íamos', 'eles/elas/vocês': 'iam' }
        },
        commonVerbs: ['partir', 'abrir', 'assistir', 'decidir', 'dividir', 'dormir', 'sentir', 'seguir']
    }
};

// =============================================================================
// NOUN GENDER RULES
// =============================================================================

export const NOUN_GENDER_RULES = {
    masculine: {
        typical: [
            { ending: '-o', examples: ['livro (book)', 'carro (car)', 'gato (cat)'], reliability: 'high' },
            { ending: '-or', examples: ['amor (love)', 'calor (heat)', 'professor (teacher)'], reliability: 'high' },
            { ending: '-ema', examples: ['problema (problem)', 'sistema (system)', 'tema (theme)'], reliability: 'high', note: 'Greek origin words in -ema are masculine!' },
            { ending: 'consonant', examples: ['mar (sea)', 'sol (sun)', 'hotel', 'papel'], reliability: 'medium' }
        ],
        exceptions: ['foto (photo) - feminine despite -o', 'moto (motorcycle) - feminine despite -o', 'tribo (tribe) - feminine']
    },
    feminine: {
        typical: [
            { ending: '-a', examples: ['casa (house)', 'mesa (table)', 'água (water)'], reliability: 'high' },
            { ending: '-ção', examples: ['ação (action)', 'informação (information)', 'estação (station)'], reliability: 'very high' },
            { ending: '-dade', examples: ['cidade (city)', 'universidade (university)', 'idade (age)'], reliability: 'very high' },
            { ending: '-agem', examples: ['viagem (trip)', 'mensagem (message)', 'imagem (image)'], reliability: 'very high' },
            { ending: '-tude', examples: ['atitude (attitude)', 'juventude (youth)'], reliability: 'very high' }
        ],
        exceptions: ['dia (day) - masculine despite -a', 'mapa (map) - masculine', 'poeta (poet) - can be either']
    },
    teachingTips: [
        'When learning a noun, ALWAYS learn it with its article: "o livro", not just "livro"',
        '-ção words are ALWAYS feminine (a informação, a ação)',
        '-ema words from Greek are masculine (o problema, o sistema)',
        'Most words ending in -o are masculine, -a are feminine, but learn exceptions',
        'New words from English often follow the original pattern or become masculine by default'
    ]
};

// =============================================================================
// ARTICLES
// =============================================================================

export const ARTICLES = {
    definite: {
        forms: {
            masculine: { singular: 'o', plural: 'os' },
            feminine: { singular: 'a', plural: 'as' }
        },
        usage: [
            'Before nouns when referring to specific things: "O livro está na mesa" (The book is on the table)',
            'Before possessives (different from English): "O meu carro" (My car - literally "the my car")',
            'Before titles: "O senhor Silva" (Mr. Silva)',
            'Before languages: "O português é bonito" (Portuguese is beautiful)',
            'Before countries (usually): "O Brasil", "A França", but not always: "Portugal"'
        ],
        contractions: {
            'de + o': 'do',
            'de + a': 'da',
            'de + os': 'dos',
            'de + as': 'das',
            'em + o': 'no',
            'em + a': 'na',
            'em + os': 'nos',
            'em + as': 'nas',
            'a + o': 'ao',
            'a + a': 'à',
            'a + os': 'aos',
            'a + as': 'às',
            'por + o': 'pelo',
            'por + a': 'pela',
            'por + os': 'pelos',
            'por + as': 'pelas'
        }
    },
    indefinite: {
        forms: {
            masculine: { singular: 'um', plural: 'uns' },
            feminine: { singular: 'uma', plural: 'umas' }
        },
        usage: [
            'Introducing something for the first time: "Tenho um cão" (I have a dog)',
            'For "some" in plural: "Comprei uns livros" (I bought some books)',
            'Omit before professions (different from English): "Sou professor" NOT "Sou um professor"'
        ]
    },
    teachingTips: [
        'Portuguese uses articles MORE than English - especially before possessives',
        'Learn contractions early - they\'re very common in natural speech',
        'The contraction "à" (a + a) has an accent to distinguish from preposition "a"',
        'Don\'t use articles before professions/nationalities: "Sou português, sou médico"'
    ]
};

// =============================================================================
// PREPOSITIONS
// =============================================================================

export const PREPOSITIONS = {
    common: [
        {
            preposition: 'de',
            meaning: 'of, from',
            usage: ['origin', 'possession', 'material', 'time'],
            examples: [
                { pt: 'Sou de Lisboa.', en: 'I\'m from Lisbon.' },
                { pt: 'O livro do João.', en: 'João\'s book. (the book of João)' },
                { pt: 'Uma mesa de madeira.', en: 'A wooden table. (of wood)' }
            ],
            contracts: ['de + o = do', 'de + a = da', 'de + ele = dele', 'de + este = deste']
        },
        {
            preposition: 'em',
            meaning: 'in, on, at',
            usage: ['location', 'time periods', 'means of transport'],
            examples: [
                { pt: 'Estou em casa.', en: 'I\'m at home.' },
                { pt: 'Em janeiro.', en: 'In January.' },
                { pt: 'Vou de carro.', en: 'I\'m going by car.' }
            ],
            contracts: ['em + o = no', 'em + a = na', 'em + ele = nele', 'em + este = neste']
        },
        {
            preposition: 'a',
            meaning: 'to, at',
            usage: ['direction', 'indirect object', 'time (hours)'],
            examples: [
                { pt: 'Vou a Lisboa.', en: 'I\'m going to Lisbon.' },
                { pt: 'Dou o livro ao João.', en: 'I give the book to João.' },
                { pt: 'Às três horas.', en: 'At three o\'clock.' }
            ],
            contracts: ['a + o = ao', 'a + a = à', 'a + aquele = àquele']
        },
        {
            preposition: 'para',
            meaning: 'to, for (direction, purpose)',
            usage: ['destination (more permanent than "a")', 'purpose', 'recipient'],
            examples: [
                { pt: 'Vou para o Brasil.', en: 'I\'m going to Brazil (to stay).' },
                { pt: 'É para ti.', en: 'It\'s for you.' },
                { pt: 'Estudo para aprender.', en: 'I study to learn.' }
            ],
            note: '"A" is temporary movement, "para" suggests staying or purpose'
        },
        {
            preposition: 'com',
            meaning: 'with',
            usage: ['accompaniment', 'instrument', 'manner'],
            examples: [
                { pt: 'Vou com o João.', en: 'I\'m going with João.' },
                { pt: 'Escrevo com caneta.', en: 'I write with a pen.' }
            ],
            contracts: ['com + mim = comigo', 'com + ti = contigo', 'com + ele = com ele (or consigo in PT-PT)']
        },
        {
            preposition: 'por',
            meaning: 'by, through, for (reason)',
            usage: ['agent (passive)', 'movement through', 'reason', 'exchange'],
            examples: [
                { pt: 'Escrito por Camões.', en: 'Written by Camões.' },
                { pt: 'Passámos por Lisboa.', en: 'We passed through Lisbon.' },
                { pt: 'Por favor.', en: 'Please. (for favor)' }
            ],
            contracts: ['por + o = pelo', 'por + a = pela']
        },
        {
            preposition: 'sem',
            meaning: 'without',
            usage: ['absence'],
            examples: [
                { pt: 'Café sem açúcar.', en: 'Coffee without sugar.' }
            ]
        },
        {
            preposition: 'sobre',
            meaning: 'about, on (topic), over',
            usage: ['topic', 'position'],
            examples: [
                { pt: 'Um livro sobre Portugal.', en: 'A book about Portugal.' },
                { pt: 'O livro está sobre a mesa.', en: 'The book is on the table.' }
            ]
        }
    ],
    
    teachingTips: [
        'MEMORIZE contractions - they\'re not optional in Portuguese',
        '"A" vs "para": "a" for temporary direction, "para" for destination/purpose',
        '"Por" vs "para": "por" is reason/cause, "para" is purpose/goal',
        'Portuguese uses prepositions where English doesn\'t: "gostar de" (to like of)',
        'Verbs often require specific prepositions: "começar a", "acabar de", "precisar de"'
    ]
};

// =============================================================================
// SENTENCE STRUCTURES
// =============================================================================

export const SENTENCE_STRUCTURES = {
    basicSVO: {
        name: 'Subject-Verb-Object',
        pattern: '[Subject] [Verb] [Object]',
        examples: [
            { pt: 'Eu como pão.', en: 'I eat bread.' },
            { pt: 'O João lê o livro.', en: 'João reads the book.' }
        ],
        note: 'Portuguese often drops subject pronouns when clear from context'
    },
    
    negation: {
        name: 'Negation',
        pattern: '[Subject] não [Verb]',
        examples: [
            { pt: 'Não falo inglês.', en: 'I don\'t speak English.' },
            { pt: 'Ela não está em casa.', en: 'She isn\'t at home.' }
        ],
        note: 'Just add "não" before the verb - much simpler than English!'
    },
    
    questions: {
        yesNo: {
            pattern: '[Statement] + rising intonation OR É que + [statement]',
            examples: [
                { pt: 'Falas português?', en: 'Do you speak Portuguese?' },
                { pt: 'É que falas português?', en: 'Do you speak Portuguese? (emphatic)' }
            ]
        },
        whQuestions: {
            words: {
                'O que': 'What',
                'Quem': 'Who',
                'Onde': 'Where',
                'Quando': 'When',
                'Por que / Porquê': 'Why',
                'Como': 'How',
                'Quanto/a/os/as': 'How much/many',
                'Qual/Quais': 'Which'
            },
            pattern: '[Question word] + é que + [statement] OR [Question word] + [verb] + [subject]',
            examples: [
                { pt: 'Onde é que moras?', en: 'Where do you live?' },
                { pt: 'O que fazes?', en: 'What do you do?' },
                { pt: 'Quem é ele?', en: 'Who is he?' }
            ]
        }
    },
    
    progressive: {
        name: 'Progressive (PT-PT)',
        pattern: 'estar a + infinitive',
        examples: [
            { pt: 'Estou a comer.', en: 'I am eating.' },
            { pt: 'Ela está a trabalhar.', en: 'She is working.' }
        ],
        note: 'PT-PT uses "estar a + infinitive", NOT "estar + gerund" like Brazilian Portuguese'
    },
    
    nearFuture: {
        name: 'Near Future',
        pattern: 'ir + infinitive',
        examples: [
            { pt: 'Vou estudar amanhã.', en: 'I\'m going to study tomorrow.' },
            { pt: 'Vamos jantar às oito.', en: 'We\'re going to have dinner at eight.' }
        ],
        note: 'Most common way to express future in spoken Portuguese'
    },
    
    recentPast: {
        name: 'Recent Past',
        pattern: 'acabar de + infinitive',
        examples: [
            { pt: 'Acabei de chegar.', en: 'I just arrived.' },
            { pt: 'Ele acabou de sair.', en: 'He just left.' }
        ]
    },
    
    comparison: {
        comparative: {
            more: 'mais + adj + (do) que',
            less: 'menos + adj + (do) que',
            equal: 'tão + adj + como',
            examples: [
                { pt: 'Ela é mais alta do que eu.', en: 'She is taller than me.' },
                { pt: 'Este livro é tão interessante como aquele.', en: 'This book is as interesting as that one.' }
            ]
        },
        superlative: {
            pattern: 'o/a mais + adj',
            examples: [
                { pt: 'Ela é a mais inteligente.', en: 'She is the most intelligent.' }
            ],
            irregular: {
                'bom → melhor': 'good → better/best',
                'mau → pior': 'bad → worse/worst',
                'grande → maior': 'big → bigger/biggest',
                'pequeno → menor': 'small → smaller/smallest'
            }
        }
    }
};

// =============================================================================
// SER vs ESTAR - The Critical Distinction
// =============================================================================

export const SER_VS_ESTAR = {
    overview: 'Both mean "to be" but are NOT interchangeable. This is one of the hardest concepts for English speakers.',
    
    useSer: {
        name: 'Use SER for',
        cases: [
            { case: 'Identity', example: 'Eu sou o João.', translation: 'I am João.' },
            { case: 'Origin', example: 'Sou de Portugal.', translation: 'I\'m from Portugal.' },
            { case: 'Profession', example: 'Ela é médica.', translation: 'She is a doctor.' },
            { case: 'Nationality', example: 'Somos portugueses.', translation: 'We are Portuguese.' },
            { case: 'Time', example: 'São três horas.', translation: 'It\'s three o\'clock.' },
            { case: 'Date', example: 'Hoje é segunda-feira.', translation: 'Today is Monday.' },
            { case: 'Material', example: 'A mesa é de madeira.', translation: 'The table is (made of) wood.' },
            { case: 'Possession', example: 'O livro é meu.', translation: 'The book is mine.' },
            { case: 'Permanent characteristics', example: 'Ela é alta e bonita.', translation: 'She is tall and beautiful.' }
        ],
        mnemonic: 'SER = DOCTOR (Description, Origin, Characteristic, Time, Occupation, Relationship)'
    },
    
    useEstar: {
        name: 'Use ESTAR for',
        cases: [
            { case: 'Location', example: 'Estou em Lisboa.', translation: 'I am in Lisbon.' },
            { case: 'Temporary state', example: 'Estou cansado.', translation: 'I am tired.' },
            { case: 'Mood/feelings', example: 'Ela está feliz.', translation: 'She is happy (right now).' },
            { case: 'Health', example: 'Como estás? Estou bem.', translation: 'How are you? I\'m fine.' },
            { case: 'Weather', example: 'Está frio.', translation: 'It\'s cold.' },
            { case: 'Progressive', example: 'Estou a trabalhar.', translation: 'I am working.' },
            { case: 'Result of action', example: 'A porta está aberta.', translation: 'The door is open (was opened).' }
        ],
        mnemonic: 'ESTAR = PLACE (Position, Location, Action, Condition, Emotion)'
    },
    
    meaningChanges: {
        note: 'Some adjectives change meaning with ser vs estar!',
        examples: [
            { adjective: 'listo', ser: 'ser listo = be clever (permanent)', estar: 'estar listo = be ready (temporary)' },
            { adjective: 'malo', ser: 'ser malo = be bad/evil (character)', estar: 'estar malo = be sick (condition)' },
            { adjective: 'aburrido', ser: 'ser aburrido = be boring (permanent)', estar: 'estar aburrido = be bored (feeling)' },
            { adjective: 'verde', ser: 'ser verde = be green (color)', estar: 'estar verde = be unripe' },
            { adjective: 'rico', ser: 'ser rico = be rich', estar: 'estar rico = taste delicious' }
        ]
    },
    
    teachingTips: [
        'If it can change → ESTAR (location, mood, health)',
        'If it defines who/what something IS → SER',
        'Location of people/things → ESTAR',
        'Location of events → SER! ("A festa é em Lisboa" - The party is in Lisbon)',
        'When in doubt with adjectives: "Would this change tomorrow?" Yes → ESTAR, No → SER'
    ]
};

// =============================================================================
// EXPORT HELPERS
// =============================================================================

/**
 * Get verb conjugation by infinitive
 */
export function getVerbConjugation(infinitive) {
    return VERB_CONJUGATIONS[infinitive] || null;
}

/**
 * Get regular verb pattern
 */
export function getRegularVerbPattern(ending) {
    return REGULAR_VERB_PATTERNS[ending.toUpperCase()] || null;
}

/**
 * Get gender rule for a word ending
 */
export function getGenderRuleForEnding(ending) {
    const mascRules = NOUN_GENDER_RULES.masculine.typical.find(r => r.ending === ending);
    const femRules = NOUN_GENDER_RULES.feminine.typical.find(r => r.ending === ending);
    return mascRules || femRules || null;
}

/**
 * Get preposition info
 */
export function getPrepositionInfo(prep) {
    return PREPOSITIONS.common.find(p => p.preposition === prep) || null;
}

/**
 * Get article contraction
 */
export function getContraction(prep, article) {
    const key = `${prep} + ${article}`;
    return ARTICLES.definite.contractions[key] || null;
}

/**
 * Get ser vs estar guidance for adjective
 */
export function getSerEstarGuidance(adjective) {
    const change = SER_VS_ESTAR.meaningChanges.examples.find(
        e => e.adjective.toLowerCase() === adjective.toLowerCase()
    );
    return change || {
        general: 'Use SER for permanent traits, ESTAR for temporary states',
        tip: SER_VS_ESTAR.teachingTips
    };
}

export default {
    VERB_CONJUGATIONS,
    REGULAR_VERB_PATTERNS,
    NOUN_GENDER_RULES,
    ARTICLES,
    PREPOSITIONS,
    SENTENCE_STRUCTURES,
    SER_VS_ESTAR,
    getVerbConjugation,
    getRegularVerbPattern,
    getGenderRuleForEnding,
    getPrepositionInfo,
    getContraction,
    getSerEstarGuidance
};
