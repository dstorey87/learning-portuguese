/**
 * Portuguese Phonemes Reference
 * 
 * Complete IPA phoneme reference for European Portuguese with:
 * - IPA symbols and descriptions
 * - Mouth/tongue positions for teaching
 * - Minimal pairs for discrimination training
 * - Common mistakes by English speakers
 * - Teaching tips and corrections
 * 
 * CRITICAL: This is European Portuguese (PT-PT), NOT Brazilian Portuguese
 * 
 * @module data/ai-reference/phonemes
 */

// =============================================================================
// VOWELS - European Portuguese
// =============================================================================

export const VOWELS = {
    // Oral vowels
    oral: [
        {
            ipa: '/a/',
            symbol: 'a',
            description: 'Open front unrounded vowel',
            example: { word: 'pai', translation: 'father', position: 'stressed' },
            mouthPosition: 'Mouth wide open, tongue low and front',
            commonMistake: 'English speakers may make it too "flat" like American "a"',
            tip: 'Think of the "a" in British "father" - open and clear'
        },
        {
            ipa: '/ɐ/',
            symbol: 'a (unstressed)',
            description: 'Near-open central vowel',
            example: { word: 'casa', translation: 'house', position: 'final unstressed' },
            mouthPosition: 'Mouth slightly open, tongue central and low',
            commonMistake: 'English speakers pronounce it as full "a" instead of reduced',
            tip: 'In unstressed position, "a" becomes much shorter and more central, almost like "uh"'
        },
        {
            ipa: '/e/',
            symbol: 'é',
            description: 'Close-mid front unrounded vowel',
            example: { word: 'café', translation: 'coffee', position: 'stressed with acute' },
            mouthPosition: 'Lips slightly spread, tongue mid-high and front',
            commonMistake: 'Making it too close to English "ay" diphthong',
            tip: 'Keep it pure and steady - no glide at the end. Like French "é"'
        },
        {
            ipa: '/ɛ/',
            symbol: 'e (open)',
            description: 'Open-mid front unrounded vowel',
            example: { word: 'pé', translation: 'foot', position: 'stressed' },
            mouthPosition: 'Mouth more open than /e/, tongue lower',
            commonMistake: 'Confusing with /e/ - this one is more open',
            tip: 'Like the "e" in "bed" but slightly more open'
        },
        {
            ipa: '/ɨ/',
            symbol: 'e (unstressed)',
            description: 'Close central unrounded vowel',
            example: { word: 'pequeno', translation: 'small', position: 'unstressed e' },
            mouthPosition: 'Lips neutral, tongue high and central',
            commonMistake: 'Pronouncing as full "e" instead of reducing it',
            tip: 'KEY PT-PT feature: Unstressed "e" almost disappears, becomes a very quick "uh" or even silent'
        },
        {
            ipa: '/i/',
            symbol: 'i',
            description: 'Close front unrounded vowel',
            example: { word: 'vida', translation: 'life', position: 'stressed' },
            mouthPosition: 'Lips spread, tongue high and front',
            commonMistake: 'Making it too long',
            tip: 'Like English "ee" but shorter and tenser'
        },
        {
            ipa: '/o/',
            symbol: 'ô',
            description: 'Close-mid back rounded vowel',
            example: { word: 'avô', translation: 'grandfather', position: 'stressed with circumflex' },
            mouthPosition: 'Lips rounded, tongue mid-high and back',
            commonMistake: 'Adding an "oo" glide at the end',
            tip: 'Keep lips rounded but stable - no diphthong'
        },
        {
            ipa: '/ɔ/',
            symbol: 'o (open)',
            description: 'Open-mid back rounded vowel',
            example: { word: 'avó', translation: 'grandmother', position: 'stressed with acute' },
            mouthPosition: 'Lips rounded, mouth more open, tongue lower than /o/',
            commonMistake: 'Confusing avô (grandfather /o/) with avó (grandmother /ɔ/)',
            tip: 'Notice: avÔ (closed) vs avÓ (open) - the accent tells you!'
        },
        {
            ipa: '/u/',
            symbol: 'u',
            description: 'Close back rounded vowel',
            example: { word: 'tudo', translation: 'everything', position: 'stressed' },
            mouthPosition: 'Lips tightly rounded, tongue high and back',
            commonMistake: 'Not rounding lips enough',
            tip: 'Like English "oo" in "boot" but with tighter lip rounding'
        },
        {
            ipa: '/u/',
            symbol: 'o (unstressed)',
            description: 'Unstressed "o" becomes /u/',
            example: { word: 'como', translation: 'how/I eat', position: 'final unstressed' },
            mouthPosition: 'Same as /u/',
            commonMistake: 'Saying "co-mo" instead of "co-mu"',
            tip: 'KEY PT-PT feature: Final unstressed "o" sounds like "u"'
        }
    ],
    
    // Nasal vowels - The HARDEST for English speakers
    nasal: [
        {
            ipa: '/ɐ̃/',
            symbol: 'ã, an, am',
            description: 'Nasal central vowel',
            example: { word: 'irmã', translation: 'sister', position: 'final' },
            mouthPosition: 'Like /ɐ/ but air goes through nose simultaneously',
            commonMistake: 'Adding an "n" sound after the vowel instead of nasalizing',
            tip: 'DO NOT say "ah-n". Let air flow through your nose during the vowel itself. Pinch your nose - you should feel vibration!',
            practiceSequence: ['a', 'ã', 'a', 'ã'] // Alternate to feel the difference
        },
        {
            ipa: '/ẽ/',
            symbol: 'en, em',
            description: 'Nasal close-mid front vowel',
            example: { word: 'também', translation: 'also', position: 'final' },
            mouthPosition: 'Like /e/ but nasalized',
            commonMistake: 'Saying "tam-bem" with full consonant',
            tip: 'The "m" is not pronounced - it just indicates nasalization'
        },
        {
            ipa: '/ĩ/',
            symbol: 'in, im',
            description: 'Nasal close front vowel',
            example: { word: 'fim', translation: 'end', position: 'final' },
            mouthPosition: 'Like /i/ but nasalized',
            commonMistake: 'Pronouncing the "m" as a separate consonant',
            tip: 'No "m" sound - just nasalize the "i"'
        },
        {
            ipa: '/õ/',
            symbol: 'on, om',
            description: 'Nasal close-mid back vowel',
            example: { word: 'bom', translation: 'good', position: 'final' },
            mouthPosition: 'Like /o/ but nasalized',
            commonMistake: 'Saying "bom" like English "bomb"',
            tip: 'Lips rounded, air through nose, no final "m" consonant'
        },
        {
            ipa: '/ũ/',
            symbol: 'un, um',
            description: 'Nasal close back vowel',
            example: { word: 'um', translation: 'one/a', position: 'standalone' },
            mouthPosition: 'Like /u/ but nasalized',
            commonMistake: 'Saying "oom" with consonant',
            tip: 'Keep it nasal throughout - very short'
        }
    ],
    
    // Nasal diphthongs - CRITICAL
    nasalDiphthongs: [
        {
            ipa: '/ɐ̃w̃/',
            symbol: 'ão',
            description: 'THE Portuguese sound - nasal diphthong',
            example: { word: 'não', translation: 'no', position: 'common ending' },
            mouthPosition: 'Start with nasal /ɐ̃/, glide to nasal /w̃/ (like nasal "ow")',
            commonMistake: 'Saying "ow" without nasalization, or separating into two syllables',
            tip: 'THE MOST IMPORTANT SOUND. Think "owng" but all through your nose. Practice: mão, pão, são, cão',
            priority: 'CRITICAL',
            practiceWords: ['não', 'mão', 'pão', 'irmão', 'coração', 'avião', 'limão', 'verão']
        },
        {
            ipa: '/õj̃/',
            symbol: 'ões',
            description: 'Plural nasal diphthong',
            example: { word: 'limões', translation: 'lemons', position: 'plural ending' },
            mouthPosition: 'Nasal /õ/ gliding to nasal /j̃/',
            commonMistake: 'Not nasalizing the glide, saying "oyns"',
            tip: 'This is how you pluralize -ão words. All nasal throughout.',
            priority: 'HIGH',
            pluralRule: '-ão → -ões (most common plural pattern)'
        },
        {
            ipa: '/ɐ̃j̃/',
            symbol: 'ãe, ães',
            description: 'Nasal diphthong in plurals',
            example: { word: 'mães', translation: 'mothers', position: 'plural' },
            mouthPosition: 'Nasal /ɐ̃/ gliding to nasal /j̃/',
            commonMistake: 'Forgetting nasalization on the glide',
            tip: 'Some -ão words pluralize to -ães: mão → mães, cão → cães',
            priority: 'MEDIUM',
            pluralRule: '-ão → -ães (some words like mão, cão, pão, alemão)'
        },
        {
            ipa: '/ɐ̃w̃/',
            symbol: 'ãos',
            description: 'Some -ão plurals stay similar',
            example: { word: 'irmãos', translation: 'brothers/siblings', position: 'plural' },
            mouthPosition: 'Same as ão, with /s/ at end',
            commonMistake: 'Using wrong plural pattern',
            tip: 'Some -ão words just add -s: irmão → irmãos, mão (hand) exceptions',
            priority: 'MEDIUM',
            pluralRule: '-ão → -ãos (some words like irmão, cidadão, cristão)'
        }
    ]
};

// =============================================================================
// CONSONANTS - European Portuguese
// =============================================================================

export const CONSONANTS = {
    // Stops
    stops: [
        {
            ipa: '/p/',
            symbol: 'p',
            description: 'Voiceless bilabial stop',
            example: { word: 'pai', translation: 'father' },
            tip: 'Same as English "p", not aspirated before vowels'
        },
        {
            ipa: '/b/',
            symbol: 'b',
            description: 'Voiced bilabial stop',
            example: { word: 'bom', translation: 'good' },
            tip: 'Same as English "b"'
        },
        {
            ipa: '/t/',
            symbol: 't',
            description: 'Voiceless alveolar stop',
            example: { word: 'tu', translation: 'you' },
            tip: 'Same as English "t" but tongue touches just behind teeth'
        },
        {
            ipa: '/d/',
            symbol: 'd',
            description: 'Voiced alveolar stop',
            example: { word: 'dia', translation: 'day' },
            tip: 'Same as English "d"'
        },
        {
            ipa: '/k/',
            symbol: 'c, qu',
            description: 'Voiceless velar stop',
            example: { word: 'casa', translation: 'house' },
            tip: '"c" before a/o/u or "qu" before e/i'
        },
        {
            ipa: '/g/',
            symbol: 'g, gu',
            description: 'Voiced velar stop',
            example: { word: 'gato', translation: 'cat' },
            tip: '"g" before a/o/u or "gu" before e/i'
        }
    ],
    
    // Fricatives
    fricatives: [
        {
            ipa: '/f/',
            symbol: 'f',
            description: 'Voiceless labiodental fricative',
            example: { word: 'falar', translation: 'to speak' },
            tip: 'Same as English "f"'
        },
        {
            ipa: '/v/',
            symbol: 'v',
            description: 'Voiced labiodental fricative',
            example: { word: 'vida', translation: 'life' },
            tip: 'Same as English "v"'
        },
        {
            ipa: '/s/',
            symbol: 's (initial), ss, c (before e/i), ç',
            description: 'Voiceless alveolar fricative',
            example: { word: 'saber', translation: 'to know' },
            commonMistake: 'Using "s" sound where Portuguese has "z"',
            tip: 'Initial s, double ss, c before e/i, and ç are all /s/'
        },
        {
            ipa: '/z/',
            symbol: 's (between vowels), z',
            description: 'Voiced alveolar fricative',
            example: { word: 'casa', translation: 'house' },
            commonMistake: 'Not voicing the "s" between vowels',
            tip: 'IMPORTANT: "s" between vowels is always /z/ like "z" in "zoo". Casa = "ca-za"'
        },
        {
            ipa: '/ʃ/',
            symbol: 'ch, x',
            description: 'Voiceless postalveolar fricative (sh)',
            example: { word: 'chave', translation: 'key' },
            tip: 'Like English "sh" in "ship"'
        },
        {
            ipa: '/ʃ/',
            symbol: 's (final), s (before consonant)',
            description: 'Final S in PT-PT',
            example: { word: 'dois', translation: 'two' },
            commonMistake: 'Using English "s" instead of "sh"',
            tip: 'KEY PT-PT FEATURE: Final "s" and "s" before consonants is ALWAYS "sh"! "dois" = "doysh", "estar" = "shtahr"',
            priority: 'CRITICAL'
        },
        {
            ipa: '/ʒ/',
            symbol: 'j, g (before e/i)',
            description: 'Voiced postalveolar fricative',
            example: { word: 'já', translation: 'already' },
            tip: 'Like the "s" in English "measure" or "vision"'
        }
    ],
    
    // Nasals
    nasals: [
        {
            ipa: '/m/',
            symbol: 'm',
            description: 'Bilabial nasal',
            example: { word: 'mãe', translation: 'mother' },
            tip: 'Same as English "m"'
        },
        {
            ipa: '/n/',
            symbol: 'n',
            description: 'Alveolar nasal',
            example: { word: 'não', translation: 'no' },
            tip: 'Same as English "n"'
        },
        {
            ipa: '/ɲ/',
            symbol: 'nh',
            description: 'Palatal nasal',
            example: { word: 'vinho', translation: 'wine' },
            mouthPosition: 'Middle of tongue touches roof of mouth, air through nose',
            commonMistake: 'Saying "n-y" as two sounds',
            tip: 'Like "ny" in "canyon" or Spanish "ñ" - ONE sound, not two. "vi-nyu" not "vin-yo"',
            priority: 'HIGH'
        }
    ],
    
    // Liquids
    liquids: [
        {
            ipa: '/l/',
            symbol: 'l (initial, before vowel)',
            description: 'Alveolar lateral',
            example: { word: 'lua', translation: 'moon' },
            tip: 'Same as English "l" at start of words'
        },
        {
            ipa: '/ɫ/',
            symbol: 'l (final)',
            description: 'Dark L (velarized)',
            example: { word: 'mal', translation: 'bad' },
            tip: 'Final "l" is dark like English "call" - tongue back'
        },
        {
            ipa: '/ʎ/',
            symbol: 'lh',
            description: 'Palatal lateral',
            example: { word: 'filho', translation: 'son' },
            mouthPosition: 'Middle of tongue against palate, sides let air through',
            commonMistake: 'Saying "l-y" as two sounds, or just "l"',
            tip: 'Like "lli" in "million" or Italian "gl" in "famiglia". "fi-lyu" as ONE sound',
            priority: 'HIGH'
        },
        {
            ipa: '/ɾ/',
            symbol: 'r (between vowels, after consonant)',
            description: 'Alveolar tap',
            example: { word: 'para', translation: 'for' },
            mouthPosition: 'Quick single tap of tongue tip against ridge',
            commonMistake: 'Using English "r" or trilling',
            tip: 'Single quick tap like the "tt" in American "butter" or "ladder"'
        },
        {
            ipa: '/ʁ/',
            symbol: 'r (initial), rr',
            description: 'Uvular fricative',
            example: { word: 'rato', translation: 'rat' },
            mouthPosition: 'Back of tongue near uvula, friction',
            commonMistake: 'Using English "r" or Spanish trilled "rr"',
            tip: 'PT-PT uses a back-of-throat "r" like French. Initial "r" and "rr" = uvular. Think clearing your throat gently.',
            priority: 'MEDIUM',
            alternates: 'Some speakers use a trill /r/ or uvular trill /ʀ/'
        }
    ]
};

// =============================================================================
// MINIMAL PAIRS - For pronunciation discrimination training
// =============================================================================

export const MINIMAL_PAIRS = {
    // Nasal vs Oral
    nasalization: [
        { pair: ['la', 'lã'], ipa: ['/la/', '/lɐ̃/'], meaning: ['there', 'wool'], focus: 'nasal ã' },
        { pair: ['vi', 'vim'], ipa: ['/vi/', '/vĩ/'], meaning: ['I saw', 'I came'], focus: 'nasal im' },
        { pair: ['so', 'som'], ipa: ['/so/', '/sõ/'], meaning: ['only', 'sound'], focus: 'nasal om' },
        { pair: ['mau', 'mão'], ipa: ['/maw/', '/mɐ̃w̃/'], meaning: ['bad', 'hand'], focus: 'nasal ão diphthong' }
    ],
    
    // Open vs Closed vowels
    vowelHeight: [
        { pair: ['avô', 'avó'], ipa: ['/aˈvo/', '/aˈvɔ/'], meaning: ['grandfather', 'grandmother'], focus: 'closed vs open o' },
        { pair: ['pôr', 'por'], ipa: ['/poɾ/', '/puɾ/'], meaning: ['to put', 'by/for'], focus: 'circumflex shows closed vowel' },
        { pair: ['sede', 'sede'], ipa: ['/ˈsedɨ/', '/ˈsɛdɨ/'], meaning: ['headquarters', 'thirst'], focus: 'same spelling, different pronunciation' }
    ],
    
    // S sounds
    sibilants: [
        { pair: ['caça', 'casa'], ipa: ['/ˈkasɐ/', '/ˈkazɐ/'], meaning: ['hunt', 'house'], focus: 'ç/ss vs intervocalic s' },
        { pair: ['aço', 'aso'], ipa: ['/ˈasu/', '/ˈazu/'], meaning: ['steel', '(not a word)'], focus: 'ç is always /s/' },
        { pair: ['passo', 'paço'], ipa: ['/ˈpasu/', '/ˈpasu/'], meaning: ['step', 'palace'], focus: 'ss and ç both = /s/' }
    ],
    
    // R sounds
    rhotics: [
        { pair: ['caro', 'carro'], ipa: ['/ˈkaɾu/', '/ˈkaʁu/'], meaning: ['expensive', 'car'], focus: 'tap r vs uvular rr' },
        { pair: ['era', 'erra'], ipa: ['/ˈɛɾɐ/', '/ˈɛʁɐ/'], meaning: ['era/was', 'errs'], focus: 'single vs double r' },
        { pair: ['para', 'parra'], ipa: ['/ˈpaɾɐ/', '/ˈpaʁɐ/'], meaning: ['for', 'vine'], focus: 'tap vs uvular' }
    ],
    
    // LH vs L
    palatals: [
        { pair: ['filo', 'filho'], ipa: ['/ˈfilu/', '/ˈfiʎu/'], meaning: ['thread/phylum', 'son'], focus: 'l vs lh' },
        { pair: ['mula', 'mulha'], ipa: ['/ˈmulɐ/', '/ˈmuʎɐ/'], meaning: ['mule', '(archaic: wife)'], focus: 'l vs lh' }
    ],
    
    // NH vs N
    nasalPalatals: [
        { pair: ['ano', 'anho'], ipa: ['/ˈɐnu/', '/ˈɐɲu/'], meaning: ['year', 'lamb'], focus: 'n vs nh' },
        { pair: ['vino', 'vinho'], ipa: ['/ˈvinu/', '/ˈviɲu/'], meaning: ['(not Portuguese)', 'wine'], focus: 'n vs nh' }
    ]
};

// =============================================================================
// COMMON ENGLISH SPEAKER MISTAKES
// =============================================================================

export const ENGLISH_SPEAKER_MISTAKES = [
    {
        mistake: 'Using English "r"',
        correction: 'Portuguese has two r sounds: tap (between vowels) and uvular (initial/double)',
        examples: ['rato', 'carro', 'para'],
        priority: 'HIGH',
        exerciseType: 'minimal_pairs'
    },
    {
        mistake: 'Not nasalizing vowels',
        correction: 'Nasal vowels are produced with air through the nose, not by adding "n"',
        examples: ['não', 'mãe', 'bom', 'um'],
        priority: 'CRITICAL',
        exerciseType: 'nasal_drill'
    },
    {
        mistake: 'Pronouncing final "s" as English /s/',
        correction: 'Final "s" in PT-PT is always /ʃ/ (sh)',
        examples: ['dois', 'três', 'vocês', 'as casas'],
        priority: 'CRITICAL',
        exerciseType: 'final_s_drill'
    },
    {
        mistake: 'Pronouncing all vowels fully',
        correction: 'Unstressed vowels in PT-PT are heavily reduced or silent',
        examples: ['pequeno', 'telefone', 'presidente'],
        priority: 'HIGH',
        exerciseType: 'vowel_reduction'
    },
    {
        mistake: 'Adding diphthongs to pure vowels',
        correction: 'Keep vowels pure - no glide at the end',
        examples: ['café', 'avô', 'peru'],
        priority: 'MEDIUM',
        exerciseType: 'vowel_purity'
    },
    {
        mistake: 'Saying "ão" as two syllables',
        correction: '"ão" is ONE nasal diphthong, not "a-o"',
        examples: ['não', 'mão', 'coração'],
        priority: 'CRITICAL',
        exerciseType: 'ao_diphthong'
    },
    {
        mistake: 'Pronouncing "lh" as "l" or "ly"',
        correction: '"lh" is a single palatal sound like "lli" in "million"',
        examples: ['filho', 'trabalho', 'melhor'],
        priority: 'HIGH',
        exerciseType: 'lh_drill'
    },
    {
        mistake: 'Pronouncing "nh" as "n-y"',
        correction: '"nh" is a single palatal nasal like Spanish "ñ"',
        examples: ['vinho', 'banho', 'conhecer'],
        priority: 'HIGH',
        exerciseType: 'nh_drill'
    }
];

// =============================================================================
// PHONEME DIFFICULTY RANKING (for teaching order)
// =============================================================================

export const PHONEME_DIFFICULTY_RANKING = [
    // Level 1 - Easy (similar to English)
    {
        level: 1,
        name: 'Foundation',
        phonemes: ['/p/', '/b/', '/t/', '/d/', '/k/', '/g/', '/f/', '/v/', '/m/', '/n/', '/l/', '/a/', '/i/', '/u/'],
        description: 'Sounds very similar to English, minimal practice needed'
    },
    // Level 2 - Medium (slight differences)
    {
        level: 2,
        name: 'Intermediate',
        phonemes: ['/e/', '/ɛ/', '/o/', '/ɔ/', '/s/', '/z/', '/ʃ/', '/ʒ/'],
        description: 'Familiar sounds but with Portuguese-specific patterns'
    },
    // Level 3 - Hard (new for English speakers)
    {
        level: 3,
        name: 'Advanced',
        phonemes: ['/ɾ/', '/ʁ/', '/ʎ/', '/ɲ/', '/ɨ/', '/ɐ/'],
        description: 'New sounds requiring focused practice'
    },
    // Level 4 - Very Hard (nasal vowels)
    {
        level: 4,
        name: 'Expert',
        phonemes: ['/ɐ̃/', '/ẽ/', '/ĩ/', '/õ/', '/ũ/', '/ɐ̃w̃/', '/õj̃/'],
        description: 'Nasal sounds - hardest for English speakers'
    }
];

// =============================================================================
// TEACHING TIPS BY PHONEME CATEGORY
// =============================================================================

export const PHONEME_TEACHING_TIPS = {
    nasalVowels: {
        general: 'Practice with your nose pinched - you should feel blockage when trying to say nasal vowels',
        sequence: ['ã', 'õ', 'ão', 'ões'],
        activities: [
            'Compare "la" vs "lã" while pinching nose',
            'Hum while saying nasal vowels',
            'Record and compare to native speakers',
            'Practice word chains: mão → mãos → mães'
        ]
    },
    finalS: {
        general: 'Every time you see final "s" or "s" before a consonant, say "sh"',
        sequence: ['dois', 'três', 'as casas', 'os meninos', 'estar'],
        activities: [
            'Practice counting: um, doish, trêsh...',
            'Read articles aloud: as, os, dos, das',
            'Say common phrases: vamos! (vamush!)'
        ]
    },
    rSounds: {
        general: 'Initial R and RR are from the back of throat (uvular). R between vowels is a quick tap.',
        sequence: ['tap: para, caro, era', 'uvular: rato, rei, carro'],
        activities: [
            'Gargle gently to feel uvular position',
            'Say "butter" quickly to feel tap r',
            'Contrast: caro (expensive) vs carro (car)'
        ]
    },
    lhNh: {
        general: 'These are single sounds, not two letters. Think Italian "gl" and Spanish "ñ".',
        sequence: ['lh: filho, trabalho', 'nh: vinho, banho'],
        activities: [
            'Say "million" and isolate the "lli" sound',
            'Say "canyon" and isolate the "ny" sound',
            'Practice: olho, espelho, joelho / banho, caminho, vizinho'
        ]
    }
};

// =============================================================================
// EXPORT HELPERS
// =============================================================================

/**
 * Get phoneme info by IPA symbol
 */
export function getPhonemeByIPA(ipa) {
    const allPhonemes = [
        ...VOWELS.oral,
        ...VOWELS.nasal,
        ...VOWELS.nasalDiphthongs,
        ...CONSONANTS.stops,
        ...CONSONANTS.fricatives,
        ...CONSONANTS.nasals,
        ...CONSONANTS.liquids
    ];
    return allPhonemes.find(p => p.ipa === ipa);
}

/**
 * Get teaching tips for a problematic phoneme
 */
export function getPhonemeTeachingTip(phonemeSymbol) {
    const allPhonemes = [
        ...VOWELS.oral,
        ...VOWELS.nasal,
        ...VOWELS.nasalDiphthongs,
        ...CONSONANTS.stops,
        ...CONSONANTS.fricatives,
        ...CONSONANTS.nasals,
        ...CONSONANTS.liquids
    ];
    const phoneme = allPhonemes.find(p => p.symbol === phonemeSymbol || p.ipa === phonemeSymbol);
    return phoneme ? {
        phoneme: phoneme.symbol,
        ipa: phoneme.ipa,
        tip: phoneme.tip,
        commonMistake: phoneme.commonMistake,
        mouthPosition: phoneme.mouthPosition,
        priority: phoneme.priority || 'NORMAL'
    } : null;
}

/**
 * Get minimal pairs for a specific sound contrast
 */
export function getMinimalPairsForSound(soundType) {
    return MINIMAL_PAIRS[soundType] || [];
}

/**
 * Get all critical phonemes (must teach)
 */
export function getCriticalPhonemes() {
    return [
        ...VOWELS.nasalDiphthongs.filter(p => p.priority === 'CRITICAL'),
        ...CONSONANTS.fricatives.filter(p => p.priority === 'CRITICAL'),
        ...CONSONANTS.nasals.filter(p => p.priority === 'HIGH'),
        ...CONSONANTS.liquids.filter(p => p.priority === 'HIGH')
    ];
}

export default {
    VOWELS,
    CONSONANTS,
    MINIMAL_PAIRS,
    ENGLISH_SPEAKER_MISTAKES,
    PHONEME_DIFFICULTY_RANKING,
    PHONEME_TEACHING_TIPS,
    getPhonemeByIPA,
    getPhonemeTeachingTip,
    getMinimalPairsForSound,
    getCriticalPhonemes
};
