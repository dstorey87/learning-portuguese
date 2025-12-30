/**
 * Mnemonic Patterns Reference
 * 
 * Templates and patterns for generating memorable learning aids:
 * - Keyword mnemonics (sound-alike associations)
 * - Memory palace placements
 * - Visual association patterns
 * - Common Portuguese patterns to exploit
 * 
 * @module data/ai-reference/mnemonic-patterns
 */

// =============================================================================
// KEYWORD MNEMONIC TEMPLATES
// =============================================================================

export const KEYWORD_MNEMONIC_TEMPLATES = {
    description: 'Link Portuguese word to similar-sounding English word + vivid image',
    
    patterns: [
        {
            id: 'sound-alike',
            name: 'Sound-Alike Keywords',
            description: 'Find English word that sounds like Portuguese word',
            template: '"{pt}" sounds like "{keyword}". Imagine {visual_scene}.',
            examples: [
                {
                    pt: 'obrigado',
                    en: 'thank you',
                    keyword: 'obliged',
                    visual: 'You feel OBLIGED to thank someone when they help you',
                    full: '"Obrigado" sounds like "obliged". Imagine feeling so OBLIGED to thank someone that you bow deeply!'
                },
                {
                    pt: 'gato',
                    en: 'cat',
                    keyword: 'got-a',
                    visual: '"I\'ve GOT A cat!" - picture yourself saying this while hugging a fluffy cat',
                    full: '"Gato" sounds like "got a". Imagine shouting "I GOT A cat!" while a cat jumps into your arms.'
                },
                {
                    pt: 'carro',
                    en: 'car',
                    keyword: 'car-row',
                    visual: 'A row of cars lined up',
                    full: '"Carro" sounds like "car-row". Picture a long ROW of CARs in a parking lot.'
                }
            ]
        },
        {
            id: 'first-syllable',
            name: 'First Syllable Hook',
            description: 'Use first syllable to create association',
            template: '"{pt}" starts with "{syllable}" like "{english_word}"...',
            examples: [
                {
                    pt: 'trabalho',
                    en: 'work',
                    syllable: 'tra',
                    hook: 'travel',
                    visual: 'You TRAVEL to your WORK - "tra-balho"'
                }
            ]
        },
        {
            id: 'rhyme-chain',
            name: 'Rhyme Chain',
            description: 'Create rhyming phrase to remember',
            template: '"{pt}" rhymes with... {rhyme_phrase}',
            examples: [
                {
                    pt: 'falar',
                    en: 'to speak',
                    rhyme: 'falar - stellar - be a stellar SPEAKER!'
                }
            ]
        }
    ],
    
    buildingBlocks: {
        description: 'Common Portuguese word parts that have consistent meanings',
        elements: [
            { part: '-ção', meaning: '-tion (action/state)', examples: ['informação', 'ação', 'estação'] },
            { part: '-dade', meaning: '-ity (quality)', examples: ['cidade', 'universidade', 'idade'] },
            { part: '-mente', meaning: '-ly (adverb)', examples: ['rapidamente', 'felizmente'] },
            { part: '-eiro/-eira', meaning: 'one who does/maker', examples: ['cozinheiro', 'enfermeira'] },
            { part: '-oso/-osa', meaning: '-ous (full of)', examples: ['famoso', 'nervoso'] },
            { part: 're-', meaning: 're- (again)', examples: ['refazer', 'reler'] },
            { part: 'des-', meaning: 'un-/dis-', examples: ['desculpe', 'desligar'] }
        ]
    }
};

// =============================================================================
// MEMORY PALACE TEMPLATES
// =============================================================================

export const MEMORY_PALACE_TEMPLATES = {
    description: 'Place words in mental locations for spatial memory',
    
    defaultLocations: [
        {
            name: 'Your Home',
            rooms: ['front door', 'entryway', 'living room', 'kitchen', 'dining room', 'bedroom', 'bathroom', 'backyard'],
            bestFor: 'General vocabulary sets',
            tip: 'Use YOUR actual home - familiar spaces work best'
        },
        {
            name: 'A Journey',
            locations: ['starting point', 'first street', 'first landmark', 'crossing', 'destination entrance', 'inside destination'],
            bestFor: 'Sequenced vocabulary (numbers, days)',
            tip: 'Use a route you walk regularly'
        },
        {
            name: 'Your Body',
            locations: ['head', 'eyes', 'ears', 'mouth', 'shoulders', 'hands', 'chest', 'belly', 'legs', 'feet'],
            bestFor: 'Body parts, emotions, physical descriptions',
            tip: 'Touch each body part while learning'
        }
    ],
    
    placementRules: [
        'Make the image BIZARRE - strange images stick',
        'Make it ACTIVE - the word should be DOING something',
        'Use EXAGGERATION - make it huge, tiny, colorful',
        'Add EMOTION - funny, scary, surprising',
        'Engage SENSES - what do you see, hear, smell, feel?'
    ],
    
    examplePlacements: [
        {
            word: { pt: 'porta', en: 'door' },
            location: 'front door',
            scene: 'A massive golden PORTA (door) with a face, yelling "PORTA!" every time you enter',
            why: 'The word IS the object, making it impossible to forget'
        },
        {
            word: { pt: 'água', en: 'water' },
            location: 'kitchen sink',
            scene: 'You turn on the tap and ÁGUA (water) shoots out like a fire hose, flooding the kitchen while you scream "ÁGUA!"',
            why: 'Exaggerated action + emotion'
        }
    ]
};

// =============================================================================
// GENDER MEMORY TRICKS
// =============================================================================

export const GENDER_MEMORY_TRICKS = {
    description: 'Techniques for remembering noun gender',
    
    visualCoding: {
        masculine: {
            color: 'blue',
            symbol: '♂',
            image: 'boxing gloves',
            technique: 'Visualize masculine words wearing boxing gloves or painted blue'
        },
        feminine: {
            color: 'pink',
            symbol: '♀',
            image: 'flower crown',
            technique: 'Visualize feminine words wearing a flower crown or painted pink'
        }
    },
    
    patterns: [
        {
            rule: 'Words ending in -o are usually masculine',
            reliability: 'HIGH',
            examples: ['o livro', 'o carro', 'o gato'],
            exceptions: ['a foto', 'a moto', 'a rádio'],
            trick: 'O = masculine O-shape'
        },
        {
            rule: 'Words ending in -a are usually feminine',
            reliability: 'HIGH',
            examples: ['a casa', 'a mesa', 'a água'],
            exceptions: ['o dia', 'o mapa', 'o problema'],
            trick: 'A = feminine A-pron shape'
        },
        {
            rule: 'Words ending in -ção are ALWAYS feminine',
            reliability: 'VERY HIGH',
            examples: ['a informação', 'a ação', 'a estação'],
            exceptions: [],
            trick: 'Imagine -ção words as queens giving instructions'
        },
        {
            rule: 'Words ending in -dade are ALWAYS feminine',
            reliability: 'VERY HIGH',
            examples: ['a cidade', 'a universidade', 'a idade'],
            exceptions: [],
            trick: '-DADE = DADdy-less (no masculine energy)'
        },
        {
            rule: 'Greek words ending in -ema/-oma are masculine',
            reliability: 'HIGH',
            examples: ['o problema', 'o sistema', 'o idioma'],
            trick: 'Greek scholars were traditionally men (historical mnemonic)'
        }
    ]
};

// =============================================================================
// VERB CONJUGATION PATTERNS
// =============================================================================

export const VERB_MEMORY_PATTERNS = {
    description: 'Patterns to help remember verb conjugations',
    
    presentTense: {
        AR: {
            pattern: 'o-as-a-amos-am',
            mnemonic: 'Oh, As A Amos Am',
            story: 'Oh! As (you) and A (he/she) and AMOS (we are friends) and AM (they = I am many)',
            example: 'falo, falas, fala, falamos, falam'
        },
        ER: {
            pattern: 'o-es-e-emos-em',
            mnemonic: 'Oh Es E Emos Em',
            story: 'E sounds dominate - think "Everything E"',
            example: 'como, comes, come, comemos, comem'
        },
        IR: {
            pattern: 'o-es-e-imos-em',
            mnemonic: 'Oh Es E Imos Em',
            story: 'Same as -ER except nós = -imos (we go inside - IR inside)',
            example: 'parto, partes, parte, partimos, partem'
        }
    },
    
    irregularVerbs: {
        ser: {
            present: 'sou, és, é, somos, são',
            trick: 'SOU = Self Own Universe (I am). SÃO = São Paulo (they are like a big city - many!)',
            story: 'I am SOU-premely myself. You és-sentially are. He é (just IS). We SOMos together. They SÃO many.'
        },
        estar: {
            present: 'estou, estás, está, estamos, estão',
            trick: 'All start with ESTA- (this state) + regular-ish endings',
            story: 'ESTOU (I state this), ESTás (you state), ESTá (he states)...'
        },
        ter: {
            present: 'tenho, tens, tem, temos, têm',
            trick: 'TENHO = TEN-hold (I hold TEN things). TEM = same for him. TÊM = many (accent shows plural)',
            story: 'I TENHO (hold), you TENS (tense - you have tension), he TEM, we TEMOS, they TÊM'
        },
        ir: {
            present: 'vou, vais, vai, vamos, vão',
            trick: 'VOU = I VOW to go. VAMOS = famous Portuguese expression!',
            story: 'I VOW (vou) to go. You\'re going to VAI-land. VAMOS means "let\'s go!"'
        }
    }
};

// =============================================================================
// PRONUNCIATION MEMORY AIDS
// =============================================================================

export const PRONUNCIATION_MEMORY_AIDS = {
    nasalVowels: {
        ão: {
            english_approximation: 'owng (with nose)',
            trick: 'Think of saying "OW!" but through your nose while humming',
            practice: 'Say "ow" then pinch your nose - feel the vibration? That\'s nasal!'
        },
        ãe: {
            english_approximation: 'eye-ng',
            trick: 'Like saying "EYE" through your nose',
            practice: 'Mães (mothers) have EYES on you - nasal eyes!'
        }
    },
    
    consonants: {
        lh: {
            english_approximation: 'ly (as in million)',
            trick: 'LH = "LYUH" - Lovely Husband (filho = son, like a lovely husband to be)',
            practice: 'Say "million" - the "lli" sound is LH!'
        },
        nh: {
            english_approximation: 'ny (as in canyon)',
            trick: 'NH = "NYUH" - New York (vinho = wine from NY vineyards)',
            practice: 'Say "canyon" - that "ny" sound is NH!'
        },
        rr: {
            english_approximation: 'French R / throat clearing',
            trick: 'RR = Raging Rapids in your throat',
            practice: 'Gently clear your throat - that\'s uvular R!'
        }
    },
    
    finalS: {
        rule: 'Final S is always "SH" in PT-PT',
        trick: 'Imagine every S at the end is wearing a SHawl',
        examples: ['dois = doysh', 'três = tresh', 'vocês = voh-seysh']
    }
};

// =============================================================================
// CONFUSION PAIR MNEMONICS
// =============================================================================

export const CONFUSION_PAIR_MNEMONICS = {
    description: 'Memory tricks for commonly confused word pairs',
    
    pairs: [
        {
            words: ['ser', 'estar'],
            confusion: 'Both mean "to be"',
            trick: 'SER = Self Exists Regularly (permanent). ESTAR = Exists State Temporarily Always Returning (temporary)',
            example: 'Sou alto (I AM tall - permanent) vs Estou cansado (I AM tired - temporary)'
        },
        {
            words: ['por', 'para'],
            confusion: 'Both can mean "for"',
            trick: 'POR = cause/reason (WHY). PARA = purpose/goal (FOR WHAT)',
            example: 'Por que? (Why?) vs Para que? (For what purpose?)'
        },
        {
            words: ['tu', 'você'],
            confusion: 'Both mean "you"',
            trick: 'TU = Totally Unofficial (informal). VOCÊ = Very Official Courtesy Expression (formal)',
            example: 'Tu falas (you speak, to friend) vs Você fala (you speak, to stranger)'
        },
        {
            words: ['conhecer', 'saber'],
            confusion: 'Both can mean "to know"',
            trick: 'CONHECER = CONTACT (people, places). SABER = STUFF (facts, skills)',
            example: 'Conheço Lisboa (I know/am familiar with Lisbon) vs Sei falar português (I know how to speak Portuguese)'
        },
        {
            words: ['avô', 'avó'],
            confusion: 'Similar spelling, different genders',
            trick: 'avÔ = grandpa has a big belly (Ô is round). avÓ = grandma is sharp (Ó has accent pointing up)',
            example: 'O meu avô (my grandfather) vs A minha avó (my grandmother)'
        }
    ]
};

// =============================================================================
// EXPORT HELPERS
// =============================================================================

/**
 * Generate a keyword mnemonic for a word
 */
export function generateKeywordHints(pt, en) {
    // Find similar-sounding English words
    const hints = {
        word: pt,
        meaning: en,
        soundsLike: [],
        firstSyllable: pt.slice(0, 3),
        buildingBlocks: [],
        suggestions: []
    };
    
    // Check for known building blocks
    for (const block of KEYWORD_MNEMONIC_TEMPLATES.buildingBlocks.elements) {
        if (pt.includes(block.part)) {
            hints.buildingBlocks.push({
                part: block.part,
                meaning: block.meaning
            });
        }
    }
    
    // Add general suggestions
    hints.suggestions = [
        `Find an English word that sounds like "${pt}"`,
        `Create a vivid, bizarre mental image connecting that word to "${en}"`,
        `Make the image emotional - funny, scary, or surprising`,
        `Visualize the scene for 5 seconds while saying "${pt}"`
    ];
    
    return hints;
}

/**
 * Get memory palace placement suggestion
 */
export function getMemoryPalaceSuggestion(words, theme = 'home') {
    const palace = MEMORY_PALACE_TEMPLATES.defaultLocations.find(
        p => p.name.toLowerCase().includes(theme.toLowerCase())
    ) || MEMORY_PALACE_TEMPLATES.defaultLocations[0];
    
    return {
        location: palace.name,
        rooms: palace.rooms.slice(0, words.length),
        rules: MEMORY_PALACE_TEMPLATES.placementRules,
        assignments: words.map((w, i) => ({
            word: w,
            room: palace.rooms[i % palace.rooms.length],
            prompt: `Place "${w.pt}" (${w.en}) in the ${palace.rooms[i % palace.rooms.length]}. Make it BIZARRE!`
        }))
    };
}

/**
 * Get gender memory trick for a word
 */
export function getGenderTrick(word, gender) {
    const tricks = GENDER_MEMORY_TRICKS.patterns.filter(p => {
        if (gender === 'masculine' && p.rule.includes('masculine')) return true;
        if (gender === 'feminine' && p.rule.includes('feminine')) return true;
        return false;
    });
    
    const visualCode = GENDER_MEMORY_TRICKS.visualCoding[gender];
    
    return {
        word,
        gender,
        visualCode,
        applicableTricks: tricks,
        suggestion: `Visualize "${word}" ${visualCode.technique}`
    };
}

/**
 * Get verb conjugation memory aid
 */
export function getVerbMemoryAid(infinitive, tense = 'present') {
    const irregular = VERB_MEMORY_PATTERNS.irregularVerbs[infinitive];
    if (irregular) {
        return {
            verb: infinitive,
            irregular: true,
            tense,
            ...irregular
        };
    }
    
    // Determine verb type from ending
    const ending = infinitive.slice(-2).toUpperCase();
    const regular = VERB_MEMORY_PATTERNS.presentTense[ending];
    
    return regular ? {
        verb: infinitive,
        irregular: false,
        type: ending,
        tense,
        ...regular
    } : null;
}

/**
 * Get pronunciation aid for a sound
 */
export function getPronunciationAid(sound) {
    // Check nasal vowels
    if (PRONUNCIATION_MEMORY_AIDS.nasalVowels[sound]) {
        return {
            sound,
            type: 'nasal_vowel',
            ...PRONUNCIATION_MEMORY_AIDS.nasalVowels[sound]
        };
    }
    
    // Check consonants
    if (PRONUNCIATION_MEMORY_AIDS.consonants[sound]) {
        return {
            sound,
            type: 'consonant',
            ...PRONUNCIATION_MEMORY_AIDS.consonants[sound]
        };
    }
    
    return null;
}

/**
 * Get mnemonic for confused pair
 */
export function getConfusionPairMnemonic(word1, word2) {
    const pair = CONFUSION_PAIR_MNEMONICS.pairs.find(
        p => p.words.includes(word1) && p.words.includes(word2)
    );
    return pair || null;
}

export default {
    KEYWORD_MNEMONIC_TEMPLATES,
    MEMORY_PALACE_TEMPLATES,
    GENDER_MEMORY_TRICKS,
    VERB_MEMORY_PATTERNS,
    PRONUNCIATION_MEMORY_AIDS,
    CONFUSION_PAIR_MNEMONICS,
    generateKeywordHints,
    getMemoryPalaceSuggestion,
    getGenderTrick,
    getVerbMemoryAid,
    getPronunciationAid,
    getConfusionPairMnemonic
};
