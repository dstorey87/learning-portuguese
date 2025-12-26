/**
 * Building Blocks: Question Words
 * 
 * TIER 1 - Essential for asking questions
 * 
 * Question words help you gather information and navigate conversations.
 * These are crucial for daily interactions.
 * 
 * Prerequisites: bb-001 (Pronouns)
 * 
 * @module data/building-blocks/questions
 */

export const questionsLesson = {
    id: 'bb-008',
    title: 'Question Words: O que, Quem, Onde, Quando',
    topic: 'building-blocks',
    tier: 1,
    level: 'beginner',
    description: 'Learn essential question words to ask anything in Portuguese.',
    prerequisites: ['bb-001'],
    estimatedTime: '10 min',
    
    concept: {
        title: 'Asking Questions in Portuguese',
        explanation: 'Portuguese question words are straightforward. Unlike English, you often don\'t need to invert word order - just add "?" and use rising intonation. "É que" is often added for emphasis.',
        mnemonic: 'Remember the 5 Ws + H: O quê (What), Quem (Who), Onde (Where), Quando (When), Porque/Porquê (Why), Como (How).'
    },
    
    words: [
        {
            pt: 'o que / o quê',
            en: 'what',
            audio: 'o-que',
            pronunciation: 'oo keh',
            type: 'interrogative',
            grammarNotes: '"O que" at start of sentence, "o quê" at end or standalone. Can also be just "que".',
            examples: [
                { pt: 'O que é isto?', en: 'What is this?' },
                { pt: 'O que queres?', en: 'What do you want?' },
                { pt: 'Isto é o quê?', en: 'This is what?' },
                { pt: 'Que horas são?', en: 'What time is it?' }
            ],
            aiTip: 'Start → "O que". End → "o quê". Short form "que" works in many cases.'
        },
        {
            pt: 'quem',
            en: 'who',
            audio: 'quem',
            pronunciation: 'keng',
            type: 'interrogative',
            grammarNotes: 'Used for people. Nasal ending like "em". Invariable (same for singular and plural).',
            examples: [
                { pt: 'Quem é?', en: 'Who is it?' },
                { pt: 'Quem está aí?', en: 'Who is there?' },
                { pt: 'Com quem falas?', en: 'Who are you talking with?' },
                { pt: 'De quem é isto?', en: 'Whose is this?' }
            ],
            aiTip: '"De quem" = whose. "Com quem" = with whom. "Para quem" = for whom.'
        },
        {
            pt: 'onde',
            en: 'where',
            audio: 'onde',
            pronunciation: 'on-deh',
            type: 'interrogative',
            grammarNotes: 'Asks for location. Can combine with prepositions: "de onde" (from where), "para onde" (to where).',
            examples: [
                { pt: 'Onde estás?', en: 'Where are you?' },
                { pt: 'Onde fica o hotel?', en: 'Where is the hotel located?' },
                { pt: 'De onde és?', en: 'Where are you from?' },
                { pt: 'Para onde vais?', en: 'Where are you going?' }
            ],
            aiTip: '"De onde" = from where (origin). "Para onde" = where to (destination).'
        },
        {
            pt: 'quando',
            en: 'when',
            audio: 'quando',
            pronunciation: 'kwahn-doo',
            type: 'interrogative',
            grammarNotes: 'Asks about time. Also used as connector (when = whenever).',
            examples: [
                { pt: 'Quando chegas?', en: 'When do you arrive?' },
                { pt: 'Quando é a festa?', en: 'When is the party?' },
                { pt: 'Desde quando?', en: 'Since when?' },
                { pt: 'Até quando?', en: 'Until when?' }
            ],
            aiTip: '"Desde quando" = since when. "Até quando" = until when. Common combinations!'
        },
        {
            pt: 'porquê / porque',
            en: 'why / because',
            audio: 'porque',
            pronunciation: 'por-keh',
            type: 'interrogative',
            grammarNotes: '"Porquê?" (with accent) asks why in questions. "Porque" (no accent) answers with because.',
            examples: [
                { pt: 'Porquê?', en: 'Why?' },
                { pt: 'Porque não?', en: 'Why not?' },
                { pt: 'Porque é que não vens?', en: 'Why aren\'t you coming?' }
            ],
            aiTip: 'Question: "Porquê?" (why) - Answer: "Porque..." (because). The accent matters!'
        },
        {
            pt: 'como',
            en: 'how',
            audio: 'como',
            pronunciation: 'koh-moo',
            type: 'interrogative',
            grammarNotes: 'Asks about manner or method. Also means "like/as" in comparisons.',
            examples: [
                { pt: 'Como estás?', en: 'How are you?' },
                { pt: 'Como se chama?', en: 'What\'s your name? (How do you call yourself?)' },
                { pt: 'Como se diz em português?', en: 'How do you say it in Portuguese?' },
                { pt: 'Como assim?', en: 'What do you mean? (How so?)' }
            ],
            aiTip: '"Como" is super useful! "Como estás?" is the most common greeting.'
        },
        {
            pt: 'quanto / quanta / quantos / quantas',
            en: 'how much / how many',
            audio: 'quanto',
            pronunciation: 'kwahn-too',
            type: 'interrogative',
            grammarNotes: 'Agrees in gender and number: quanto (m.sg), quanta (f.sg), quantos (m.pl), quantas (f.pl).',
            examples: [
                { pt: 'Quanto custa?', en: 'How much does it cost?' },
                { pt: 'Quantos anos tens?', en: 'How old are you?' },
                { pt: 'Quantas pessoas?', en: 'How many people?' },
                { pt: 'Quanto tempo?', en: 'How much time?' }
            ],
            aiTip: 'Match gender: "Quanto" for masc, "Quanta" for fem. Plural adds -s.'
        },
        {
            pt: 'qual / quais',
            en: 'which / what',
            audio: 'qual',
            pronunciation: 'kwahl',
            type: 'interrogative',
            grammarNotes: 'Used when there\'s a choice or to identify. "Qual" (singular), "Quais" (plural).',
            examples: [
                { pt: 'Qual é o teu nome?', en: 'What is your name?' },
                { pt: 'Qual preferes?', en: 'Which one do you prefer?' },
                { pt: 'Quais são os preços?', en: 'What are the prices?' },
                { pt: 'Qual é a diferença?', en: 'What is the difference?' }
            ],
            aiTip: '"Qual é..." is very common for asking "What is...?" when identifying something.'
        }
    ],
    
    // Question formation patterns
    questionPatterns: {
        title: 'Question Formation',
        patterns: [
            {
                name: 'Simple Inversion',
                description: 'Just add ? and rising intonation',
                example: { pt: 'Tu falas português?', en: 'Do you speak Portuguese?' }
            },
            {
                name: 'Question Word + Verb',
                description: 'Start with question word',
                example: { pt: 'Onde moras?', en: 'Where do you live?' }
            },
            {
                name: 'Question Word + é que',
                description: 'Add "é que" for emphasis (very common)',
                example: { pt: 'Onde é que moras?', en: 'Where do you live?' }
            }
        ]
    },
    
    sentences: [
        { pt: 'O que é isto?', en: 'What is this?' },
        { pt: 'Quem está aí?', en: 'Who is there?' },
        { pt: 'Onde fica a estação?', en: 'Where is the station?' },
        { pt: 'Quando começa?', en: 'When does it start?' },
        { pt: 'Porquê?', en: 'Why?' },
        { pt: 'Como se diz?', en: 'How do you say it?' },
        { pt: 'Quanto custa?', en: 'How much does it cost?' },
        { pt: 'Qual é o problema?', en: 'What is the problem?' }
    ],
    
    challenges: [
        {
            type: 'multiple-choice',
            question: 'How do you ask "Where are you?"',
            options: ['Quando estás?', 'Onde estás?', 'O que estás?', 'Quem estás?'],
            correct: 1,
            explanation: '"Onde" means "where". "Onde estás?" = Where are you?'
        },
        {
            type: 'multiple-choice',
            question: '"Quem é?" asks about:',
            options: ['Place', 'Time', 'Person', 'Reason'],
            correct: 2,
            explanation: '"Quem" means "who" - it asks about people.'
        },
        {
            type: 'multiple-choice',
            question: 'How do you ask "How much does it cost?"',
            options: ['Como custa?', 'Quando custa?', 'Quanto custa?', 'Que custa?'],
            correct: 2,
            explanation: '"Quanto custa?" - "quanto" asks about quantity/amount.'
        },
        {
            type: 'fill-blank',
            sentence: '___ horas são? (What time is it?)',
            options: ['O que', 'Que', 'Quando'],
            correct: 1,
            explanation: '"Que horas são?" is the standard way to ask the time.'
        },
        {
            type: 'fill-blank',
            sentence: '___ é o teu nome? (What is your name?)',
            options: ['O que', 'Qual', 'Como'],
            correct: 1,
            explanation: '"Qual é o teu nome?" uses "qual" (which/what) for identification.'
        },
        {
            type: 'fill-blank',
            sentence: '___ anos tens? (How old are you?)',
            options: ['Quanto', 'Quantos', 'Como'],
            correct: 1,
            explanation: '"Quantos anos" - plural because asking about years (multiple).'
        },
        {
            type: 'translate',
            prompt: 'When is the party?',
            answer: 'Quando é a festa?',
            hints: ['quando = when', 'é = is', 'a = the', 'festa = party']
        },
        {
            type: 'translate',
            prompt: 'Where do you live?',
            answer: 'Onde moras?',
            hints: ['onde = where', 'moras = do you live (morar)']
        },
        {
            type: 'match',
            prompt: 'Match the question word with its meaning',
            pairs: [
                { left: 'o que', right: 'what' },
                { left: 'quem', right: 'who' },
                { left: 'onde', right: 'where' },
                { left: 'quando', right: 'when' },
                { left: 'como', right: 'how' }
            ]
        }
    ],
    
    quickReference: {
        questionWords: [
            { pt: 'o que / que', en: 'what' },
            { pt: 'quem', en: 'who' },
            { pt: 'onde', en: 'where' },
            { pt: 'quando', en: 'when' },
            { pt: 'porquê', en: 'why' },
            { pt: 'como', en: 'how' },
            { pt: 'quanto(s)/quanta(s)', en: 'how much/many' },
            { pt: 'qual/quais', en: 'which/what' }
        ],
        commonQuestions: [
            { pt: 'Como estás?', en: 'How are you?' },
            { pt: 'Quanto custa?', en: 'How much?' },
            { pt: 'Onde fica...?', en: 'Where is...?' },
            { pt: 'O que é isto?', en: 'What is this?' }
        ]
    },
    
    dynamicAiTips: [
        {
            triggerCondition: 'que_vs_qual',
            tip: 'Use "que" for general "what". Use "qual" when identifying or choosing from options.'
        },
        {
            triggerCondition: 'quanto_gender',
            tip: 'Match "quanto" to the noun: quanto tempo, quanta água, quantos livros, quantas pessoas.'
        },
        {
            triggerCondition: 'e_que_pattern',
            tip: 'Adding "é que" is very common: "Onde é que moras?" sounds more natural than just "Onde moras?"'
        }
    ]
};

export default questionsLesson;
