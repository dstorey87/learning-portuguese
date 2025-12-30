/**
 * Vocabulary Reference by Theme
 * 
 * Thematic vocabulary lists for AI lesson generation:
 * - Common collocations and phrases
 * - Usage contexts
 * - Cultural notes
 * - Frequency rankings
 * 
 * CRITICAL: European Portuguese vocabulary preferences
 * 
 * @module data/ai-reference/vocabulary-themes
 */

// =============================================================================
// THEMATIC VOCABULARY
// =============================================================================

export const VOCABULARY_THEMES = {
    // GREETINGS & BASICS
    greetings: {
        theme: 'Greetings & Polite Expressions',
        level: 'A1',
        priority: 'essential',
        words: [
            { pt: 'olá', en: 'hello', usage: 'informal, any time', pronunciation: 'oh-LAH' },
            { pt: 'bom dia', en: 'good morning', usage: 'until noon', pronunciation: 'bom DEE-ah' },
            { pt: 'boa tarde', en: 'good afternoon', usage: 'noon to sunset', pronunciation: 'BOH-ah TAR-deh' },
            { pt: 'boa noite', en: 'good evening/night', usage: 'after sunset', pronunciation: 'BOH-ah NOY-teh' },
            { pt: 'adeus', en: 'goodbye', usage: 'formal/long farewell', pronunciation: 'ah-DEH-oosh' },
            { pt: 'até logo', en: 'see you later', usage: 'informal', pronunciation: 'ah-TEH LOH-goo' },
            { pt: 'tchau', en: 'bye', usage: 'very informal', pronunciation: 'chow' },
            { pt: 'obrigado/a', en: 'thank you', usage: 'masc/fem speaker', pronunciation: 'oh-bree-GAH-doo/dah' },
            { pt: 'de nada', en: 'you\'re welcome', usage: 'standard response', pronunciation: 'deh NAH-dah' },
            { pt: 'por favor', en: 'please', usage: 'polite request', pronunciation: 'poor fah-VOR' },
            { pt: 'desculpe', en: 'excuse me/sorry', usage: 'formal apology', pronunciation: 'desh-KOOL-peh' },
            { pt: 'com licença', en: 'excuse me', usage: 'asking to pass', pronunciation: 'kom lee-SEN-sah' }
        ],
        phrases: [
            { pt: 'Como está?', en: 'How are you? (formal)', context: 'formal greeting' },
            { pt: 'Como estás?', en: 'How are you? (informal)', context: 'informal greeting' },
            { pt: 'Tudo bem?', en: 'Everything okay?', context: 'casual greeting' },
            { pt: 'Muito prazer.', en: 'Nice to meet you.', context: 'introductions' },
            { pt: 'Igualmente.', en: 'Likewise.', context: 'response to "muito prazer"' }
        ],
        culturalNotes: [
            'Portuguese uses gender in "obrigado" (male speaker) vs "obrigada" (female speaker)',
            'The two-kiss greeting (cheek to cheek) is common in Portugal',
            '"Tu" is common in informal settings in Portugal, unlike Brazil'
        ]
    },
    
    // NUMBERS
    numbers: {
        theme: 'Numbers',
        level: 'A1',
        priority: 'essential',
        words: [
            { pt: 'zero', en: 'zero', pronunciation: 'ZEH-roo' },
            { pt: 'um/uma', en: 'one', pronunciation: 'oom/OO-mah', note: 'gender agreement' },
            { pt: 'dois/duas', en: 'two', pronunciation: 'doysh/DOO-ash', note: 'gender agreement' },
            { pt: 'três', en: 'three', pronunciation: 'tresh' },
            { pt: 'quatro', en: 'four', pronunciation: 'KWAH-troo' },
            { pt: 'cinco', en: 'five', pronunciation: 'SEEN-koo' },
            { pt: 'seis', en: 'six', pronunciation: 'saysh' },
            { pt: 'sete', en: 'seven', pronunciation: 'SEH-teh' },
            { pt: 'oito', en: 'eight', pronunciation: 'OY-too' },
            { pt: 'nove', en: 'nine', pronunciation: 'NOH-veh' },
            { pt: 'dez', en: 'ten', pronunciation: 'desh' },
            { pt: 'onze', en: 'eleven', pronunciation: 'ON-zeh' },
            { pt: 'doze', en: 'twelve', pronunciation: 'DOH-zeh' },
            { pt: 'treze', en: 'thirteen', pronunciation: 'TREH-zeh' },
            { pt: 'catorze', en: 'fourteen', pronunciation: 'kah-TOR-zeh' },
            { pt: 'quinze', en: 'fifteen', pronunciation: 'KEEN-zeh' },
            { pt: 'vinte', en: 'twenty', pronunciation: 'VEEN-teh' },
            { pt: 'trinta', en: 'thirty', pronunciation: 'TREEN-tah' },
            { pt: 'quarenta', en: 'forty', pronunciation: 'kwah-REN-tah' },
            { pt: 'cinquenta', en: 'fifty', pronunciation: 'seen-KWEN-tah' },
            { pt: 'cem', en: 'one hundred', pronunciation: 'seng' },
            { pt: 'mil', en: 'one thousand', pronunciation: 'meel' }
        ],
        patterns: [
            '21-29: vinte e um, vinte e dois...',
            '100-199: cento e um, cento e dois... (NOT cem e)',
            '200+: duzentos, trezentos... (has gender: duzentos/duzentas)'
        ],
        culturalNotes: [
            'Portugal uses comma for decimal: 3,50€ (three euros fifty)',
            'Period for thousands: 1.000 = one thousand',
            'Numbers 1 and 2 have gender agreement'
        ]
    },
    
    // FAMILY
    family: {
        theme: 'Family',
        level: 'A1',
        priority: 'high',
        words: [
            { pt: 'a família', en: 'family', pronunciation: 'fah-MEE-lyah' },
            { pt: 'os pais', en: 'parents', pronunciation: 'paysh' },
            { pt: 'o pai', en: 'father', pronunciation: 'pie' },
            { pt: 'a mãe', en: 'mother', pronunciation: 'mahng' },
            { pt: 'o filho', en: 'son', pronunciation: 'FEE-lyoo' },
            { pt: 'a filha', en: 'daughter', pronunciation: 'FEE-lyah' },
            { pt: 'os filhos', en: 'children/sons', pronunciation: 'FEE-lyoosh' },
            { pt: 'o irmão', en: 'brother', pronunciation: 'eer-MAHNG' },
            { pt: 'a irmã', en: 'sister', pronunciation: 'eer-MAHNG' },
            { pt: 'os irmãos', en: 'siblings/brothers', pronunciation: 'eer-MAHNGSH' },
            { pt: 'o avô', en: 'grandfather', pronunciation: 'ah-VOH' },
            { pt: 'a avó', en: 'grandmother', pronunciation: 'ah-VOH' },
            { pt: 'os avós', en: 'grandparents', pronunciation: 'ah-VOHSH' },
            { pt: 'o tio', en: 'uncle', pronunciation: 'TEE-oo' },
            { pt: 'a tia', en: 'aunt', pronunciation: 'TEE-ah' },
            { pt: 'o primo', en: 'cousin (male)', pronunciation: 'PREE-moo' },
            { pt: 'a prima', en: 'cousin (female)', pronunciation: 'PREE-mah' },
            { pt: 'o marido', en: 'husband', pronunciation: 'mah-REE-doo' },
            { pt: 'a mulher/esposa', en: 'wife', pronunciation: 'moo-LYEHR / esh-POH-zah' },
            { pt: 'o neto', en: 'grandson', pronunciation: 'NEH-too' },
            { pt: 'a neta', en: 'granddaughter', pronunciation: 'NEH-tah' }
        ],
        phrases: [
            { pt: 'Tenho dois irmãos.', en: 'I have two siblings/brothers.' },
            { pt: 'Sou filho único.', en: 'I\'m an only child (male).' },
            { pt: 'Sou filha única.', en: 'I\'m an only child (female).' },
            { pt: 'Os meus pais moram em Lisboa.', en: 'My parents live in Lisbon.' }
        ],
        culturalNotes: [
            'Portuguese families often live close together (multi-generational)',
            'Sunday lunch with family is a strong tradition',
            'Children often use diminutives: avozinho/avozinha (grandpa/grandma)'
        ]
    },
    
    // FOOD & DRINKS
    food: {
        theme: 'Food & Drinks',
        level: 'A1-A2',
        priority: 'high',
        words: [
            // Basics
            { pt: 'o pão', en: 'bread', pronunciation: 'pahng', usage: 'very common' },
            { pt: 'a água', en: 'water', pronunciation: 'AH-gwah', usage: 'essential' },
            { pt: 'o café', en: 'coffee', pronunciation: 'kah-FEH', usage: 'cultural staple' },
            { pt: 'o chá', en: 'tea', pronunciation: 'shah' },
            { pt: 'o leite', en: 'milk', pronunciation: 'LAY-teh' },
            { pt: 'o vinho', en: 'wine', pronunciation: 'VEE-nyoo', usage: 'Portugal famous for wine' },
            { pt: 'a cerveja', en: 'beer', pronunciation: 'sehr-VEH-zhah' },
            // Meals
            { pt: 'o pequeno-almoço', en: 'breakfast', pronunciation: 'peh-KEH-noo al-MOH-soo', note: 'PT-PT term' },
            { pt: 'o almoço', en: 'lunch', pronunciation: 'al-MOH-soo', usage: 'main meal' },
            { pt: 'o jantar', en: 'dinner', pronunciation: 'zhahn-TAR' },
            { pt: 'o lanche', en: 'snack', pronunciation: 'LAHN-sheh' },
            // Common foods
            { pt: 'o arroz', en: 'rice', pronunciation: 'ah-ROHSH' },
            { pt: 'a batata', en: 'potato', pronunciation: 'bah-TAH-tah' },
            { pt: 'o peixe', en: 'fish', pronunciation: 'PAY-sheh' },
            { pt: 'a carne', en: 'meat', pronunciation: 'KAR-neh' },
            { pt: 'o frango', en: 'chicken', pronunciation: 'FRAHN-goo' },
            { pt: 'o ovo', en: 'egg', pronunciation: 'OH-voo' },
            { pt: 'o queijo', en: 'cheese', pronunciation: 'KAY-zhoo' },
            { pt: 'a fruta', en: 'fruit', pronunciation: 'FROO-tah' },
            { pt: 'os legumes', en: 'vegetables', pronunciation: 'leh-GOO-mesh' },
            { pt: 'a sopa', en: 'soup', pronunciation: 'SOH-pah', usage: 'common starter' }
        ],
        phrases: [
            { pt: 'Queria um café, por favor.', en: 'I\'d like a coffee, please.', context: 'ordering' },
            { pt: 'A conta, por favor.', en: 'The bill, please.', context: 'restaurant' },
            { pt: 'Tem água sem gás?', en: 'Do you have still water?', context: 'asking' },
            { pt: 'Está muito bom!', en: 'It\'s very good!', context: 'compliment' },
            { pt: 'Bom apetite!', en: 'Bon appétit!', context: 'before eating' }
        ],
        culturalNotes: [
            'Portuguese coffee culture: "um café" is a small espresso (bica in Lisbon, cimbalino in Porto)',
            '"Meia de leite" = half coffee, half milk (larger than a café)',
            'Bacalhau (codfish) has reportedly 365 ways to prepare - one for each day',
            'Lunch is the main meal, often including soup + main + dessert'
        ]
    },
    
    // TRAVEL & DIRECTIONS
    travel: {
        theme: 'Travel & Directions',
        level: 'A2',
        priority: 'high',
        words: [
            { pt: 'o aeroporto', en: 'airport', pronunciation: 'ah-eh-roh-POR-too' },
            { pt: 'a estação', en: 'station', pronunciation: 'esh-tah-SAHNG' },
            { pt: 'o comboio', en: 'train', pronunciation: 'kom-BOY-oo', note: 'PT-PT (BR: trem)' },
            { pt: 'o autocarro', en: 'bus', pronunciation: 'ow-toh-KAH-roo', note: 'PT-PT (BR: ônibus)' },
            { pt: 'o metro', en: 'subway', pronunciation: 'MEH-troo' },
            { pt: 'o táxi', en: 'taxi', pronunciation: 'TAK-see' },
            { pt: 'o avião', en: 'airplane', pronunciation: 'ah-vee-AHNG' },
            { pt: 'o carro', en: 'car', pronunciation: 'KAH-roo' },
            { pt: 'a rua', en: 'street', pronunciation: 'ROO-ah' },
            { pt: 'a avenida', en: 'avenue', pronunciation: 'ah-veh-NEE-dah' },
            { pt: 'a praça', en: 'square', pronunciation: 'PRAH-sah' },
            { pt: 'o bilhete', en: 'ticket', pronunciation: 'bee-LYEH-teh' },
            { pt: 'a viagem', en: 'trip', pronunciation: 'vee-AH-zhem' },
            // Directions
            { pt: 'a esquerda', en: 'left', pronunciation: 'esh-KEHR-dah' },
            { pt: 'a direita', en: 'right', pronunciation: 'dee-RAY-tah' },
            { pt: 'em frente', en: 'straight ahead', pronunciation: 'ehm FREHN-teh' },
            { pt: 'perto', en: 'near', pronunciation: 'PEHR-too' },
            { pt: 'longe', en: 'far', pronunciation: 'LON-zheh' },
            { pt: 'aqui', en: 'here', pronunciation: 'ah-KEE' },
            { pt: 'ali', en: 'there', pronunciation: 'ah-LEE' }
        ],
        phrases: [
            { pt: 'Onde fica...?', en: 'Where is...?', context: 'asking location' },
            { pt: 'Como vou para...?', en: 'How do I get to...?', context: 'asking directions' },
            { pt: 'Vire à esquerda.', en: 'Turn left.', context: 'direction' },
            { pt: 'Siga em frente.', en: 'Go straight ahead.', context: 'direction' },
            { pt: 'Um bilhete para Lisboa, por favor.', en: 'One ticket to Lisbon, please.', context: 'transport' },
            { pt: 'A que horas parte o comboio?', en: 'What time does the train leave?', context: 'transport' }
        ],
        culturalNotes: [
            'Portugal has excellent public transport, especially in Lisbon and Porto',
            'Lisbon trams (elétricos) are iconic - especially Line 28',
            'Portuguese addresses often use floor numbers: "1º esquerdo" (1st floor, left)'
        ]
    },
    
    // WORK & PROFESSIONS
    work: {
        theme: 'Work & Professions',
        level: 'A2',
        priority: 'medium',
        words: [
            { pt: 'o trabalho', en: 'work/job', pronunciation: 'trah-BAH-lyoo' },
            { pt: 'o emprego', en: 'employment/job', pronunciation: 'ehm-PREH-goo' },
            { pt: 'a empresa', en: 'company', pronunciation: 'ehm-PREH-zah' },
            { pt: 'o escritório', en: 'office', pronunciation: 'esh-kree-TOH-ryoo' },
            { pt: 'o/a chefe', en: 'boss', pronunciation: 'SHEH-feh' },
            { pt: 'o/a colega', en: 'colleague', pronunciation: 'koh-LEH-gah' },
            // Professions (note: most have masc/fem forms)
            { pt: 'o médico/a médica', en: 'doctor', pronunciation: 'MEH-dee-koo/kah' },
            { pt: 'o professor/a professora', en: 'teacher', pronunciation: 'proo-feh-SOR/SOH-rah' },
            { pt: 'o advogado/a advogada', en: 'lawyer', pronunciation: 'ahd-voo-GAH-doo/dah' },
            { pt: 'o engenheiro/a engenheira', en: 'engineer', pronunciation: 'ehn-zheh-NYAY-roo/rah' },
            { pt: 'o/a jornalista', en: 'journalist', pronunciation: 'zhor-nah-LEESH-tah' },
            { pt: 'o enfermeiro/a enfermeira', en: 'nurse', pronunciation: 'ehn-fehr-MAY-roo/rah' },
            { pt: 'o/a estudante', en: 'student', pronunciation: 'esh-too-DAHN-teh' },
            { pt: 'o empregado/a empregada', en: 'employee', pronunciation: 'ehm-preh-GAH-doo/dah' },
            { pt: 'o cozinheiro/a cozinheira', en: 'cook/chef', pronunciation: 'koh-zee-NYAY-roo/rah' }
        ],
        phrases: [
            { pt: 'O que fazes? / Em que trabalhas?', en: 'What do you do? (profession)' },
            { pt: 'Sou professor.', en: 'I\'m a teacher.', note: 'No article before profession!' },
            { pt: 'Trabalho numa empresa.', en: 'I work at a company.' },
            { pt: 'Estou desempregado/a.', en: 'I\'m unemployed.' }
        ],
        culturalNotes: [
            'Portuguese don\'t use articles before professions: "Sou professor" not "Sou um professor"',
            'Work hours: typical is 9-18h with lunch break 12-14h',
            'August is common vacation month - many businesses close'
        ]
    },
    
    // TIME EXPRESSIONS
    time: {
        theme: 'Time Expressions',
        level: 'A1-A2',
        priority: 'essential',
        words: [
            { pt: 'o dia', en: 'day', pronunciation: 'DEE-ah' },
            { pt: 'a semana', en: 'week', pronunciation: 'seh-MAH-nah' },
            { pt: 'o mês', en: 'month', pronunciation: 'mesh' },
            { pt: 'o ano', en: 'year', pronunciation: 'AH-noo' },
            { pt: 'hoje', en: 'today', pronunciation: 'OH-zheh' },
            { pt: 'amanhã', en: 'tomorrow', pronunciation: 'ah-mah-NYAHNG' },
            { pt: 'ontem', en: 'yesterday', pronunciation: 'ON-tehm' },
            { pt: 'agora', en: 'now', pronunciation: 'ah-GOH-rah' },
            { pt: 'depois', en: 'after/later', pronunciation: 'deh-POYSH' },
            { pt: 'antes', en: 'before', pronunciation: 'AHN-tesh' },
            { pt: 'sempre', en: 'always', pronunciation: 'SEHM-preh' },
            { pt: 'nunca', en: 'never', pronunciation: 'NOON-kah' },
            { pt: 'às vezes', en: 'sometimes', pronunciation: 'ash VEH-zesh' },
            { pt: 'a hora', en: 'hour', pronunciation: 'OH-rah' },
            { pt: 'o minuto', en: 'minute', pronunciation: 'mee-NOO-too' },
            { pt: 'a manhã', en: 'morning', pronunciation: 'mah-NYAHNG' },
            { pt: 'a tarde', en: 'afternoon', pronunciation: 'TAR-deh' },
            { pt: 'a noite', en: 'night/evening', pronunciation: 'NOY-teh' }
        ],
        daysOfWeek: [
            { pt: 'segunda-feira', en: 'Monday', short: 'segunda' },
            { pt: 'terça-feira', en: 'Tuesday', short: 'terça' },
            { pt: 'quarta-feira', en: 'Wednesday', short: 'quarta' },
            { pt: 'quinta-feira', en: 'Thursday', short: 'quinta' },
            { pt: 'sexta-feira', en: 'Friday', short: 'sexta' },
            { pt: 'sábado', en: 'Saturday' },
            { pt: 'domingo', en: 'Sunday' }
        ],
        months: [
            { pt: 'janeiro', en: 'January' },
            { pt: 'fevereiro', en: 'February' },
            { pt: 'março', en: 'March' },
            { pt: 'abril', en: 'April' },
            { pt: 'maio', en: 'May' },
            { pt: 'junho', en: 'June' },
            { pt: 'julho', en: 'July' },
            { pt: 'agosto', en: 'August' },
            { pt: 'setembro', en: 'September' },
            { pt: 'outubro', en: 'October' },
            { pt: 'novembro', en: 'November' },
            { pt: 'dezembro', en: 'December' }
        ],
        phrases: [
            { pt: 'Que horas são?', en: 'What time is it?' },
            { pt: 'São três horas.', en: 'It\'s three o\'clock.' },
            { pt: 'É uma hora.', en: 'It\'s one o\'clock.', note: 'singular form for 1' },
            { pt: 'Às duas e meia.', en: 'At half past two.' },
            { pt: 'Às três menos um quarto.', en: 'At quarter to three.' }
        ],
        culturalNotes: [
            'Portugal uses 24-hour time officially: "São 15 horas"',
            'Days are numbered (2ª feira = Monday = 2nd day) because Sunday was 1st',
            'Months and days are NOT capitalized in Portuguese'
        ]
    },
    
    // WEATHER
    weather: {
        theme: 'Weather',
        level: 'A1-A2',
        priority: 'medium',
        words: [
            { pt: 'o tempo', en: 'weather/time', pronunciation: 'TEHM-poo' },
            { pt: 'o sol', en: 'sun', pronunciation: 'sol' },
            { pt: 'a chuva', en: 'rain', pronunciation: 'SHOO-vah' },
            { pt: 'o vento', en: 'wind', pronunciation: 'VEHN-too' },
            { pt: 'a nuvem', en: 'cloud', pronunciation: 'NOO-vehm' },
            { pt: 'a neve', en: 'snow', pronunciation: 'NEH-veh' },
            { pt: 'a tempestade', en: 'storm', pronunciation: 'tehm-pesh-TAH-deh' },
            { pt: 'quente', en: 'hot', pronunciation: 'KEHN-teh' },
            { pt: 'frio', en: 'cold', pronunciation: 'FREE-oo' },
            { pt: 'fresco', en: 'cool/fresh', pronunciation: 'FRESH-koo' }
        ],
        phrases: [
            { pt: 'Como está o tempo?', en: 'How\'s the weather?' },
            { pt: 'Está sol.', en: 'It\'s sunny.' },
            { pt: 'Está a chover.', en: 'It\'s raining.', note: 'estar a + infinitive for progressive' },
            { pt: 'Faz calor.', en: 'It\'s hot.', note: 'fazer for weather' },
            { pt: 'Faz frio.', en: 'It\'s cold.' },
            { pt: 'Está nublado.', en: 'It\'s cloudy.' },
            { pt: 'Está bom tempo.', en: 'The weather is nice.' }
        ],
        culturalNotes: [
            'Portugal has a Mediterranean climate - hot dry summers, mild wet winters',
            'Weather uses "fazer" (Faz calor) not "estar" for temperature',
            'Northern Portugal (Porto region) is rainier than Lisbon and the south'
        ]
    }
};

// =============================================================================
// COMMON COLLOCATIONS - Words that go together
// =============================================================================

export const COMMON_COLLOCATIONS = {
    verbs: {
        fazer: ['fazer uma pergunta (ask a question)', 'fazer um favor (do a favor)', 'fazer exercício (exercise)', 'fazer compras (go shopping)', 'fazer anos (have a birthday)'],
        ter: ['ter fome (be hungry)', 'ter sede (be thirsty)', 'ter sono (be sleepy)', 'ter razão (be right)', 'ter cuidado (be careful)', 'ter pressa (be in a hurry)'],
        dar: ['dar um passeio (take a walk)', 'dar uma volta (go for a walk)', 'dar os parabéns (congratulate)'],
        tomar: ['tomar café (have coffee)', 'tomar banho (take a shower)', 'tomar conta (take care of)'],
        ir: ['ir de férias (go on vacation)', 'ir às compras (go shopping)', 'ir a pé (go on foot)']
    },
    adjectives: {
        bom: ['bom dia', 'boa noite', 'boa viagem (good trip)', 'bom apetite'],
        grande: ['um grande problema (a big problem)', 'uma grande cidade (a big city)'],
        novo: ['Ano Novo (New Year)', 'uma nova oportunidade (a new opportunity)']
    }
};

// =============================================================================
// FALSE FRIENDS - Words that look similar but mean different things
// =============================================================================

export const FALSE_FRIENDS = [
    {
        pt: 'assistir',
        meaning: 'to watch/attend (NOT to assist)',
        english_lookalike: 'assist',
        correct_translation: 'ajudar',
        example: 'Vou assistir ao jogo. = I\'m going to watch the game.'
    },
    {
        pt: 'pretender',
        meaning: 'to intend (NOT to pretend)',
        english_lookalike: 'pretend',
        correct_translation: 'fingir',
        example: 'Pretendo ir amanhã. = I intend to go tomorrow.'
    },
    {
        pt: 'atualmente',
        meaning: 'currently/nowadays (NOT actually)',
        english_lookalike: 'actually',
        correct_translation: 'na verdade / de facto',
        example: 'Atualmente vivo em Lisboa. = Currently I live in Lisbon.'
    },
    {
        pt: 'eventualmente',
        meaning: 'possibly/perhaps (NOT eventually)',
        english_lookalike: 'eventually',
        correct_translation: 'finalmente / por fim',
        example: 'Eventualmente vou. = I might possibly go.'
    },
    {
        pt: 'parentes',
        meaning: 'relatives (NOT parents)',
        english_lookalike: 'parents',
        correct_translation: 'pais',
        example: 'Os meus parentes = My relatives.'
    },
    {
        pt: 'exquisito',
        meaning: 'weird/strange (NOT exquisite)',
        english_lookalike: 'exquisite',
        correct_translation: 'requintado / primoroso',
        example: 'Que comportamento exquisito! = What strange behavior!'
    },
    {
        pt: 'pasta',
        meaning: 'folder/briefcase (NOT pasta)',
        english_lookalike: 'pasta',
        correct_translation: 'massa',
        example: 'A pasta de documentos = The folder of documents.'
    },
    {
        pt: 'constipação',
        meaning: 'a cold (NOT constipation)',
        english_lookalike: 'constipation',
        correct_translation: 'prisão de ventre',
        example: 'Tenho uma constipação. = I have a cold.'
    },
    {
        pt: 'sensível',
        meaning: 'sensitive (NOT sensible)',
        english_lookalike: 'sensible',
        correct_translation: 'sensato',
        example: 'Ela é muito sensível. = She is very sensitive.'
    },
    {
        pt: 'livraria',
        meaning: 'bookstore (NOT library)',
        english_lookalike: 'library',
        correct_translation: 'biblioteca',
        example: 'Comprei este livro na livraria. = I bought this book at the bookstore.'
    }
];

// =============================================================================
// EXPORT HELPERS
// =============================================================================

/**
 * Get vocabulary for a specific theme
 */
export function getVocabularyByTheme(theme) {
    return VOCABULARY_THEMES[theme.toLowerCase()] || null;
}

/**
 * Get all themes list
 */
export function getThemesList() {
    return Object.keys(VOCABULARY_THEMES).map(key => ({
        id: key,
        name: VOCABULARY_THEMES[key].theme,
        level: VOCABULARY_THEMES[key].level,
        wordCount: VOCABULARY_THEMES[key].words.length
    }));
}

/**
 * Get collocations for a verb
 */
export function getCollocationsForVerb(verb) {
    return COMMON_COLLOCATIONS.verbs[verb.toLowerCase()] || [];
}

/**
 * Check if word is a false friend
 */
export function getFalseFriendWarning(word) {
    return FALSE_FRIENDS.find(ff => 
        ff.pt.toLowerCase() === word.toLowerCase() ||
        ff.english_lookalike.toLowerCase() === word.toLowerCase()
    );
}

/**
 * Get vocabulary by level
 */
export function getVocabularyByLevel(level) {
    const levelThemes = [];
    for (const [key, theme] of Object.entries(VOCABULARY_THEMES)) {
        if (theme.level.includes(level)) {
            levelThemes.push({
                id: key,
                theme: theme.theme,
                words: theme.words
            });
        }
    }
    return levelThemes;
}

export default {
    VOCABULARY_THEMES,
    COMMON_COLLOCATIONS,
    FALSE_FRIENDS,
    getVocabularyByTheme,
    getThemesList,
    getCollocationsForVerb,
    getFalseFriendWarning,
    getVocabularyByLevel
};
