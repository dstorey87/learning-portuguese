/**
 * Word Knowledge Database
 * 
 * Rich explanations for Portuguese words to enable deep learning.
 * Each entry provides: pronunciation guide, etymology, memory tricks,
 * usage context, common mistakes, example sentences, and grammar notes.
 * 
 * Key for pronunciation challenges:
 * - nasal: Contains nasal vowels (ão, ã, õ, etc.)
 * - stress: Stress pattern different from English
 * - reduction: Contains reduced vowels (EU-PT)
 * - digraph: Contains lh, nh, ch, or rr
 * - cedilla: Contains ç
 * - accent: Requires correct accent placement
 */

export const WORD_KNOWLEDGE = {
  // ============ ESSENTIAL GREETINGS ============
  'olá': {
    ipa: '/ɔˈla/',
    pronunciation: {
      guide: 'oh-LAH (stress on second syllable)',
      breakdown: 'O (like "o" in "hot") + LÁ (like "la" in "la la")',
      challenge: 'accent',
      tip: 'The stress MUST be on the second syllable. Say it with emphasis: oh-LAH!',
      commonMistake: 'English speakers often say "OH-la" with stress on first syllable',
      audioFocus: 'Listen for the rising tone on the final "á"'
    },
    etymology: 'From Spanish "hola" - the H became silent, and Portuguese dropped it',
    memoryTrick: 'Think of "Olé!" from Spanish celebrations - same energy!',
    usage: {
      formality: 'informal to neutral',
      context: 'Use anytime - at cafes, with friends, on the street',
      alternative: 'In formal settings, prefer "Bom dia/Boa tarde"'
    },
    frequency: 1,
    examples: [
      { pt: 'Olá! Tudo bem?', en: 'Hello! How are you?', context: 'casual greeting' },
      { pt: 'Olá, sou o João.', en: 'Hello, I\'m João.', context: 'introduction' },
      { pt: 'Olá, com licença...', en: 'Hello, excuse me...', context: 'getting attention' }
    ],
    grammar: 'Standalone interjection - can start any conversation',
    cultural: 'Portuguese greetings are warm. Always greet shopkeepers when entering!'
  },

  'bom dia': {
    ipa: '/bõ ˈdi.ɐ/',
    pronunciation: {
      guide: 'bohn DEE-ah',
      breakdown: 'BOM (nasal "o" + m) + DIA (DEE-ah)',
      challenge: 'nasal',
      tip: 'The "om" in "bom" is NASAL - air goes through your nose, not your mouth. Like humming "mmm" but with an "o"',
      commonMistake: 'Saying "bom" like English "bomb" without nasalization',
      audioFocus: 'Notice the nasal "om" - it should resonate in your nose'
    },
    etymology: 'Bom (good) + dia (day) - literally "good day"',
    memoryTrick: 'Imagine a "bomb" going off in the morning to wake you up - but make it nasal!',
    usage: {
      formality: 'polite and universal',
      context: 'Use until about noon/lunchtime',
      alternative: 'After lunch, switch to "Boa tarde"'
    },
    frequency: 2,
    examples: [
      { pt: 'Bom dia! Dormiu bem?', en: 'Good morning! Did you sleep well?', context: 'morning greeting' },
      { pt: 'Bom dia, um café por favor.', en: 'Good morning, a coffee please.', context: 'at a café' },
      { pt: 'Muito bom dia!', en: 'Very good morning!', context: 'enthusiastic' }
    ],
    grammar: 'Can be used alone or at the start of a sentence. "Bom" agrees with "dia" (masculine)',
    cultural: 'Always say "Bom dia" when entering shops, offices, or meeting anyone before noon'
  },

  'boa tarde': {
    ipa: '/ˈbo.ɐ ˈtaɾ.dɨ/',
    pronunciation: {
      guide: 'BOH-ah TAR-deh',
      breakdown: 'BOA (BOH-ah) + TARDE (TAR-deh)',
      challenge: 'reduction',
      tip: 'In EU-PT, the final "e" in "tarde" is almost swallowed - it\'s barely pronounced',
      commonMistake: 'Pronouncing the final "e" too strongly like "tar-DAY"',
      audioFocus: 'The "e" at the end is very soft, almost just a breath'
    },
    etymology: 'Boa (good, feminine) + tarde (afternoon) - "tarde" comes from Latin "tardus" (late)',
    memoryTrick: 'You\'re "tardy" in the afternoon - hence "tarde"!',
    usage: {
      formality: 'polite and universal',
      context: 'Use from lunchtime until sunset (roughly noon to 6-7pm)',
      alternative: 'After sunset, switch to "Boa noite"'
    },
    frequency: 3,
    examples: [
      { pt: 'Boa tarde! Posso ajudar?', en: 'Good afternoon! Can I help?', context: 'shop greeting' },
      { pt: 'Boa tarde, está tudo bem?', en: 'Good afternoon, is everything ok?', context: 'checking in' }
    ],
    grammar: '"Boa" is feminine to agree with "tarde" (feminine noun)',
    cultural: 'Portuguese time-based greetings are strictly followed. Using the wrong one sounds odd.'
  },

  'boa noite': {
    ipa: '/ˈbo.ɐ ˈnoj.tɨ/',
    pronunciation: {
      guide: 'BOH-ah NOY-teh',
      breakdown: 'BOA (BOH-ah) + NOITE (NOY-teh)',
      challenge: 'reduction',
      tip: 'The "oi" sounds like "oy" in "boy". Final "e" is very soft in EU-PT.',
      commonMistake: 'Saying "noy-TEE" with a strong final syllable',
      audioFocus: 'Focus on the "oi" diphthong - it should flow as one sound'
    },
    etymology: 'Boa (good) + noite (night) - from Latin "nox, noctis"',
    memoryTrick: 'Night = Noite - they look similar! Both have "n" and "t"',
    usage: {
      formality: 'polite and universal',
      context: 'Use after sunset AND when saying goodbye at night',
      alternative: 'Unlike English, "Boa noite" works for both greeting AND leaving'
    },
    frequency: 4,
    examples: [
      { pt: 'Boa noite, como foi o dia?', en: 'Good evening, how was your day?', context: 'evening greeting' },
      { pt: 'Boa noite, durma bem!', en: 'Good night, sleep well!', context: 'saying goodbye' }
    ],
    grammar: '"Boa" is feminine to agree with "noite" (feminine noun)',
    cultural: 'Used both as a greeting in the evening AND when parting at night'
  },

  'adeus': {
    ipa: '/ɐˈdewʃ/',
    pronunciation: {
      guide: 'ah-DAYSH',
      breakdown: 'A (ah) + DEUS (DAYSH - like "day" + "sh")',
      challenge: 'reduction',
      tip: 'The final "s" becomes "sh" sound in EU-PT!',
      commonMistake: 'Saying "ah-DAY-oos" with a clear "s" sound instead of "sh"',
      audioFocus: 'Listen for the "sh" sound at the end, and the "eu" diphthong'
    },
    etymology: 'From "a Deus" meaning "to God" - commending someone to God\'s care',
    memoryTrick: 'Think "I\'m DEW-ing away" - sounds like "deus"',
    usage: {
      formality: 'somewhat formal/final',
      context: 'Use for longer/permanent goodbyes. For casual "see you later", prefer "até logo"',
      alternative: 'Chau (informal), Até já (see you soon), Até logo (see you later)'
    },
    frequency: 15,
    examples: [
      { pt: 'Adeus, foi um prazer!', en: 'Goodbye, it was a pleasure!', context: 'formal farewell' },
      { pt: 'Adeus, boa viagem!', en: 'Goodbye, have a good trip!', context: 'sending off' }
    ],
    grammar: 'Standalone interjection - from historical phrase "à Deus"',
    cultural: 'Slightly formal/final. Don\'t use for casual "see you tomorrow" situations.'
  },

  'até logo': {
    ipa: '/ɐˈtɛ ˈlɔ.ɡu/',
    pronunciation: {
      guide: 'ah-TEH LO-goo',
      breakdown: 'ATÉ (ah-TEH) + LOGO (LO-goo)',
      challenge: 'stress',
      tip: 'Stress is on "TÉ" and on "LO". The "o" in "logo" is open like "log"',
      commonMistake: 'Stressing the wrong syllable: "AH-teh" instead of "ah-TEH"',
      audioFocus: 'Both words have the stress on their first main syllable'
    },
    etymology: 'Até (until) + logo (soon/later) - literally "until later"',
    memoryTrick: 'Like a LOGO on a sign saying "See you later!"',
    usage: {
      formality: 'informal to neutral',
      context: 'Perfect for casual goodbyes when you expect to see them again',
      alternative: 'Até já (see you in a bit), Até amanhã (see you tomorrow)'
    },
    frequency: 10,
    examples: [
      { pt: 'Até logo, vemo-nos amanhã!', en: 'See you later, we\'ll see each other tomorrow!', context: 'casual farewell' },
      { pt: 'Ok, até logo!', en: 'Ok, see you later!', context: 'quick goodbye' }
    ],
    grammar: '"Até" is a preposition meaning "until" - very versatile',
    cultural: 'Much more common than "adeus" for everyday situations'
  },

  // ============ POLITE EXPRESSIONS ============
  'por favor': {
    ipa: '/puɾ fɐˈvoɾ/',
    pronunciation: {
      guide: 'poor fah-VOR',
      breakdown: 'POR (poor) + FAVOR (fah-VOR)',
      challenge: 'stress',
      tip: 'Stress is on the final syllable "VOR". The R at the end is soft.',
      commonMistake: 'Saying "poor FAY-vor" like English "favor"',
      audioFocus: 'The "a" in favor is like "ah", not like "ay"'
    },
    etymology: 'Por (by/for) + favor (favor) - literally "by favor"',
    memoryTrick: 'Do me a "FAVOR" - the words are almost identical!',
    usage: {
      formality: 'essential politeness',
      context: 'Use when asking for anything - it\'s considered rude without it',
      alternative: 'Se faz favor (more formal, older style)'
    },
    frequency: 5,
    examples: [
      { pt: 'Um café, por favor.', en: 'A coffee, please.', context: 'ordering' },
      { pt: 'Por favor, pode repetir?', en: 'Please, can you repeat?', context: 'asking for help' },
      { pt: 'Fecha a porta, por favor.', en: 'Close the door, please.', context: 'request' }
    ],
    grammar: 'Always at the end of a request or after what you\'re asking for',
    cultural: 'Absolutely essential! Portuguese culture highly values politeness.'
  },

  'obrigado': {
    ipa: '/obɾiˈɡa.du/',
    pronunciation: {
      guide: 'oh-bree-GAH-doo',
      breakdown: 'O (oh) + BRI (bree) + GA (GAH) + DO (doo)',
      challenge: 'stress',
      tip: 'Stress is on GA. If you\'re female, say "obrigadA" (oh-bree-GAH-dah)',
      commonMistake: 'Forgetting to change to "obrigada" if you\'re female',
      audioFocus: 'Listen for the stressed "GA" syllable'
    },
    etymology: 'From Latin "obligatus" (obliged) - literally "I am obliged to you"',
    memoryTrick: 'I\'m OBLIGATED to thank you! O-BRIG-ado ≈ Obligated',
    usage: {
      formality: 'essential politeness',
      context: 'Use after receiving anything - service, help, items, information',
      alternative: 'Muito obrigado (thank you very much)'
    },
    frequency: 3,
    examples: [
      { pt: 'Obrigado pela ajuda!', en: 'Thank you for the help!', context: 'gratitude' },
      { pt: 'Muito obrigado!', en: 'Thank you very much!', context: 'strong thanks' },
      { pt: 'Obrigada, é muito gentil.', en: 'Thank you, that\'s very kind. (female speaker)', context: 'polite thanks' }
    ],
    grammar: 'GENDERED! Males say "obrigado", females say "obrigada". It agrees with the SPEAKER, not the person being thanked.',
    cultural: 'The gender agreement is about YOU, not who you\'re thanking!'
  },

  'desculpe': {
    ipa: '/dɨʃˈkul.pɨ/',
    pronunciation: {
      guide: 'desh-KOOL-peh',
      breakdown: 'DES (desh) + CUL (KOOL) + PE (peh)',
      challenge: 'reduction',
      tip: 'The "s" before "c" becomes "sh" in EU-PT! Final "e" is very soft.',
      commonMistake: 'Saying "des-KOOL-pay" with strong final syllable',
      audioFocus: 'Notice how the "s" sounds like "sh"'
    },
    etymology: 'From "des-" (un-) + "culpa" (blame/guilt) - literally "unblame"',
    memoryTrick: 'Des-CULP-e = remove the CULPRIT\'s guilt',
    usage: {
      formality: 'polite',
      context: 'For minor apologies and getting attention',
      alternative: 'Perdão (pardon), Peço desculpa (I apologize - more formal)'
    },
    frequency: 12,
    examples: [
      { pt: 'Desculpe, não ouvi.', en: 'Sorry, I didn\'t hear.', context: 'apologizing' },
      { pt: 'Desculpe, onde fica o metro?', en: 'Excuse me, where is the metro?', context: 'getting attention' },
      { pt: 'Desculpe o atraso.', en: 'Sorry for the delay.', context: 'apologizing for lateness' }
    ],
    grammar: 'Imperative form of "desculpar" (to excuse). For "I\'m sorry" use "Peço desculpa"',
    cultural: 'Use liberally - it\'s polite to over-apologize rather than under-apologize'
  },

  // ============ ESSENTIAL VERBS ============
  'ser': {
    ipa: '/seɾ/',
    pronunciation: {
      guide: 'SEHR (like "sir" but shorter)',
      breakdown: 'Single syllable with soft R',
      challenge: 'reduction',
      tip: 'The R is soft/tapped, not rolling. Very short word.',
      commonMistake: 'Making the R too strong or rolling',
      audioFocus: 'Quick, clean pronunciation with soft ending'
    },
    etymology: 'From Latin "esse" (to be) - one of the oldest verbs',
    memoryTrick: 'SER = Permanent essence, who you ARE at your core',
    usage: {
      formality: 'universal',
      context: 'For PERMANENT or inherent characteristics - identity, nationality, profession, time',
      alternative: 'ESTAR is for temporary states. This distinction is CRUCIAL!'
    },
    frequency: 1,
    examples: [
      { pt: 'Eu sou português.', en: 'I am Portuguese.', context: 'nationality - permanent' },
      { pt: 'Ela é médica.', en: 'She is a doctor.', context: 'profession - permanent' },
      { pt: 'São três horas.', en: 'It is three o\'clock.', context: 'time' },
      { pt: 'O café é bom aqui.', en: 'The coffee is good here.', context: 'inherent quality' }
    ],
    conjugation: {
      present: { eu: 'sou', tu: 'és', você: 'é', ele: 'é', nós: 'somos', eles: 'são' },
      note: 'IRREGULAR - must memorize each form'
    },
    grammar: 'Use for: identity, origin, profession, time, inherent qualities, ownership',
    cultural: 'The SER vs ESTAR distinction doesn\'t exist in English but is ESSENTIAL in Portuguese'
  },

  'estar': {
    ipa: '/ɨʃˈtaɾ/',
    pronunciation: {
      guide: 'esh-TAR',
      breakdown: 'ES (esh) + TAR (tar)',
      challenge: 'reduction',
      tip: 'The "e" at the start is very reduced in EU-PT - almost like "sh-TAR"',
      commonMistake: 'Saying "ess-TAR" with a clear first vowel',
      audioFocus: 'Notice how the first syllable is swallowed'
    },
    etymology: 'From Latin "stare" (to stand) - suggests temporary position',
    memoryTrick: 'ESTAR = temporary STATE. Both have "STA"!',
    usage: {
      formality: 'universal',
      context: 'For TEMPORARY conditions - feelings, locations, health, ongoing actions',
      alternative: 'SER is for permanent characteristics'
    },
    frequency: 2,
    examples: [
      { pt: 'Estou cansado.', en: 'I am tired.', context: 'temporary feeling' },
      { pt: 'Onde está o café?', en: 'Where is the café?', context: 'location' },
      { pt: 'Ela está doente.', en: 'She is sick.', context: 'temporary health' },
      { pt: 'Estou a aprender português.', en: 'I am learning Portuguese.', context: 'ongoing action' }
    ],
    conjugation: {
      present: { eu: 'estou', tu: 'estás', você: 'está', ele: 'está', nós: 'estamos', eles: 'estão' },
      note: 'Note the nasal "ão" in "estão"!'
    },
    grammar: 'Use for: location, temporary states, feelings, health, weather, progressive actions (estar a + infinitive)',
    cultural: 'Saying "sou cansado" (I am tired with SER) would mean you\'re inherently a tired person!'
  },

  'ter': {
    ipa: '/teɾ/',
    pronunciation: {
      guide: 'TEHR (rhymes with "where")',
      breakdown: 'Single syllable, soft R',
      challenge: 'reduction',
      tip: 'Very short! The E is open like in "pet"',
      commonMistake: 'Making it too long or adding emphasis',
      audioFocus: 'Quick and clean, soft R ending'
    },
    etymology: 'From Latin "tenere" (to hold)',
    memoryTrick: 'TER = to have/hold. Think "TERrain" - you HAVE land',
    usage: {
      formality: 'universal',
      context: 'Possession, age, obligations (ter que/de), there is/are (haver replacement)',
      alternative: 'Haver is more formal for "there is" but ter is often used'
    },
    frequency: 3,
    examples: [
      { pt: 'Tenho um carro.', en: 'I have a car.', context: 'possession' },
      { pt: 'Ela tem trinta anos.', en: 'She is thirty years old.', context: 'age (have X years)' },
      { pt: 'Tenho que ir.', en: 'I have to go.', context: 'obligation' },
      { pt: 'Tens fome?', en: 'Are you hungry?', context: 'have hunger' }
    ],
    conjugation: {
      present: { eu: 'tenho', tu: 'tens', você: 'tem', ele: 'tem', nós: 'temos', eles: 'têm' },
      note: 'Note the circumflex in "têm" (they have) to distinguish from "tem" (you/he has)'
    },
    grammar: 'Used for age (ter X anos), hunger (ter fome), thirst (ter sede), luck (ter sorte)',
    cultural: 'Portuguese uses "ter" where English uses "be" for many expressions'
  },

  'ir': {
    ipa: '/iɾ/',
    pronunciation: {
      guide: 'EER (like "ear" without the opening)',
      breakdown: 'Single syllable, soft R',
      challenge: 'reduction',
      tip: 'Very short vowel followed by soft R. Rhymes with nothing in English!',
      commonMistake: 'Making the vowel too long',
      audioFocus: 'Quick "ee" + soft tap of R'
    },
    etymology: 'From Latin "ire" (to go)',
    memoryTrick: 'IR sounds like "ear" - your EARS GO everywhere with you!',
    usage: {
      formality: 'universal',
      context: 'Movement to places, future intentions (ir + infinitive)',
      alternative: 'For future actions: ir + infinitive (vou comer = I\'m going to eat)'
    },
    frequency: 5,
    examples: [
      { pt: 'Vou ao supermercado.', en: 'I\'m going to the supermarket.', context: 'movement' },
      { pt: 'Vamos embora!', en: 'Let\'s go!', context: 'leaving' },
      { pt: 'Eles vão chegar tarde.', en: 'They are going to arrive late.', context: 'future' },
      { pt: 'Como vai?', en: 'How are you going? (How are you?)', context: 'greeting' }
    ],
    conjugation: {
      present: { eu: 'vou', tu: 'vais', você: 'vai', ele: 'vai', nós: 'vamos', eles: 'vão' },
      note: 'HIGHLY IRREGULAR - the present tense comes from "vadere", not "ire"!'
    },
    grammar: 'IR + A/PARA + place for movement. IR + infinitive for future.',
    cultural: '"Como vai?" (How are you going?) is a very common greeting'
  },

  // ============ QUESTION WORDS ============
  'o quê': {
    ipa: '/u ˈkɛ/',
    pronunciation: {
      guide: 'oo KEH',
      breakdown: 'O (oo) + QUÊ (KEH - open E sound)',
      challenge: 'accent',
      tip: 'The accent on "ê" indicates a stressed, open E sound',
      commonMistake: 'Confusing with "que" (that/which) which is unstressed',
      audioFocus: 'Strong emphasis on the "ê"'
    },
    etymology: 'O (the) + quê (what thing)',
    memoryTrick: 'Think of the English "Ké?" as in "What?" with an accent',
    usage: {
      formality: 'neutral',
      context: 'Used at end of questions or standalone. "Que" is used before verbs.',
      alternative: '"Que" (what) when before a verb: "Que queres?" (What do you want?)'
    },
    frequency: 8,
    examples: [
      { pt: 'O quê? Não ouvi.', en: 'What? I didn\'t hear.', context: 'asking to repeat' },
      { pt: 'Está a fazer o quê?', en: 'What are you doing?', context: 'end of sentence' },
      { pt: 'O quê?!', en: 'What?!', context: 'surprise' }
    ],
    grammar: 'Used at end of sentences or standalone. "Que" is used before verbs.',
    cultural: 'Saying just "O quê?" can sound surprised or incredulous'
  },

  'onde': {
    ipa: '/ˈõdɨ/',
    pronunciation: {
      guide: 'ON-deh (nasal ON)',
      breakdown: 'ON (nasal) + DE (deh - reduced)',
      challenge: 'nasal',
      tip: 'The "on" is NASAL - like the French "on". The "de" is very reduced.',
      commonMistake: 'Not nasalizing the "on"',
      audioFocus: 'Feel the vibration in your nose on "on"'
    },
    etymology: 'From Latin "unde" (from where)',
    memoryTrick: 'ONDE = ON-Day - "ON which DAY?" - nope, it means WHERE!',
    usage: {
      formality: 'neutral',
      context: 'Asking about location or direction',
      alternative: 'Aonde (to where) for destinations with movement'
    },
    frequency: 10,
    examples: [
      { pt: 'Onde fica o metro?', en: 'Where is the metro?', context: 'asking directions' },
      { pt: 'Onde estás?', en: 'Where are you?', context: 'location' },
      { pt: 'De onde és?', en: 'Where are you from?', context: 'origin' }
    ],
    grammar: '"Onde fica?" = Where is (location). "Aonde vai?" = Where to (destination)',
    cultural: 'Very useful for tourists - you\'ll use this constantly!'
  },

  'quando': {
    ipa: '/ˈkwɐ̃.du/',
    pronunciation: {
      guide: 'KWAN-doo',
      breakdown: 'QUAN (kwan - nasal) + DO (doo)',
      challenge: 'nasal',
      tip: 'The "an" is nasal. It\'s like saying "kw" + nasal "an" + "doo"',
      commonMistake: 'Not nasalizing the "an"',
      audioFocus: 'The "an" should resonate in your nose'
    },
    etymology: 'From Latin "quando"',
    memoryTrick: 'QUANDO = WHEN-do - sounds like "when do"!',
    usage: {
      formality: 'neutral',
      context: 'Asking about time - both specific times and duration',
      alternative: 'A que horas? (At what time?) for specific clock times'
    },
    frequency: 15,
    examples: [
      { pt: 'Quando chega o comboio?', en: 'When does the train arrive?', context: 'time' },
      { pt: 'Desde quando estás aqui?', en: 'Since when have you been here?', context: 'duration' },
      { pt: 'Quando nasceste?', en: 'When were you born?', context: 'past event' }
    ],
    grammar: 'Works as question word and conjunction (when = quando)',
    cultural: 'Time is flexible in Portugal - "logo" (soon) might mean hours!'
  },

  'como': {
    ipa: '/ˈko.mu/',
    pronunciation: {
      guide: 'KO-moo',
      breakdown: 'CO (ko) + MO (moo)',
      challenge: 'reduction',
      tip: 'Both vowels are somewhat reduced but clear. Like "comb" without the B.',
      commonMistake: 'Saying "COH-moh" with too open vowels',
      audioFocus: 'Quick and clean, with rounded "o" sounds'
    },
    etymology: 'From Latin "quomodo" (in what manner)',
    memoryTrick: 'COMO = cOMO in COMO se dice? = HOW do you say?',
    usage: {
      formality: 'neutral',
      context: 'Asking how/in what way. Also means "like" and "I eat" (different meanings!)',
      alternative: 'De que forma? (In what way?) - more formal'
    },
    frequency: 7,
    examples: [
      { pt: 'Como está?', en: 'How are you?', context: 'greeting (formal)' },
      { pt: 'Como se chama?', en: 'What is your name?', context: 'asking name' },
      { pt: 'Como se diz...?', en: 'How do you say...?', context: 'language learning' },
      { pt: 'Como água no trabalho.', en: 'I eat at work.', context: 'different meaning: I eat' }
    ],
    grammar: 'Question word (how), conjunction (like/as), and verb form (I eat - from comer)',
    cultural: '"Como está?" is polite. "Tudo bem?" is more casual for "how are you?"'
  },

  'porquê': {
    ipa: '/puɾˈke/',
    pronunciation: {
      guide: 'poor-KEH',
      breakdown: 'POR (poor) + QUÊ (KEH)',
      challenge: 'accent',
      tip: 'Stress is on "QUÊ". As one word with accent, it\'s used standalone or at sentence end.',
      commonMistake: 'Confusing with "porque" (because) and "por que" (for which reason)',
      audioFocus: 'Strong emphasis on the final syllable'
    },
    etymology: 'Por (by/for) + quê (what) - literally "for what"',
    memoryTrick: 'POR-QUÊ = "For WHAT?" = WHY. The accent shows it\'s a question word.',
    usage: {
      formality: 'neutral',
      context: 'Asking why - used at END of sentences or standalone',
      alternative: 'Por que (two words) before verbs: "Por que fizeste isso?"'
    },
    frequency: 12,
    examples: [
      { pt: 'Porquê?', en: 'Why?', context: 'standalone question' },
      { pt: 'Não sei porquê.', en: 'I don\'t know why.', context: 'end of sentence' },
      { pt: 'Por que fizeste isso?', en: 'Why did you do that?', context: 'two words before verb' }
    ],
    grammar: 'FOUR FORMS: porquê (standalone), por que (question+verb), porque (because), por quê (rare)',
    cultural: 'Getting these distinctions right marks you as a careful learner!'
  },

  // ============ NUMBERS ============
  'um': {
    ipa: '/ũ/',
    pronunciation: {
      guide: 'oon (nasal)',
      breakdown: 'Single nasal syllable',
      challenge: 'nasal',
      tip: 'This is NASAL! The air goes through your nose, not your mouth. Like humming "mm" but with "oo".',
      commonMistake: 'Saying "oom" with closed lips at the end - it should be open but nasal',
      audioFocus: 'Feel the vibration in your nose, not your lips'
    },
    etymology: 'From Latin "unus" (one)',
    memoryTrick: 'UM = one. In English we say "um..." when thinking - now you\'ll say "one..."!',
    usage: {
      formality: 'universal',
      context: 'Number one, indefinite article (a/an for masculine)',
      alternative: 'Uma for feminine nouns'
    },
    frequency: 5,
    examples: [
      { pt: 'Um café, por favor.', en: 'A coffee, please.', context: 'ordering' },
      { pt: 'Tenho um irmão.', en: 'I have one brother.', context: 'counting' },
      { pt: 'É só um minuto.', en: 'It\'s just one minute.', context: 'time' }
    ],
    grammar: 'Also the indefinite article (a/an). Feminine form is "uma".',
    cultural: 'When ordering coffee, "um café" means one espresso!'
  },

  'dois': {
    ipa: '/dojʃ/',
    pronunciation: {
      guide: 'doysh',
      breakdown: 'DOI (doy) + S (sh)',
      challenge: 'reduction',
      tip: 'The "oi" diphthong sounds like "oy" in "boy", and the final "s" becomes "sh" in EU-PT!',
      commonMistake: 'Saying "doy-ees" with separate syllables, or not making the "sh" sound',
      audioFocus: 'Listen for "oy" + "sh" at the end'
    },
    etymology: 'From Latin "duo" (two)',
    memoryTrick: 'DOIS = DOI-S = two boys (dois rapazes) playing!',
    usage: {
      formality: 'universal',
      context: 'Number two (masculine)',
      alternative: 'Duas for feminine nouns'
    },
    frequency: 8,
    examples: [
      { pt: 'Dois bilhetes, por favor.', en: 'Two tickets, please.', context: 'ordering' },
      { pt: 'São duas horas.', en: 'It\'s two o\'clock.', context: 'time - feminine "horas"' },
      { pt: 'Tenho dois filhos.', en: 'I have two sons.', context: 'counting' }
    ],
    grammar: 'Gendered! Dois (masc), Duas (fem). Unlike English, numbers 1-2 agree with noun gender.',
    cultural: 'Always check if the noun is masculine or feminine!'
  },

  'três': {
    ipa: '/tɾeʃ/',
    pronunciation: {
      guide: 'tresh',
      breakdown: 'Single syllable with tapped R and "sh" ending',
      challenge: 'accent',
      tip: 'The "ê" is a closed E sound (like in "bed" but tighter). Final "s" = "sh"!',
      commonMistake: 'Saying "trays" with an open E or "tress" without the sh',
      audioFocus: 'Listen for the closed "e" and the final "sh"'
    },
    etymology: 'From Latin "tres" (three)',
    memoryTrick: 'TRÊS = TRES, but with an accent - just add the "h" in "tresh"!',
    usage: {
      formality: 'universal',
      context: 'Number three - no gender agreement needed after 2',
      alternative: '-'
    },
    frequency: 10,
    examples: [
      { pt: 'São três euros.', en: 'It\'s three euros.', context: 'price' },
      { pt: 'Às três horas.', en: 'At three o\'clock.', context: 'time' },
      { pt: 'Três cafés, por favor.', en: 'Three coffees, please.', context: 'ordering' }
    ],
    grammar: 'No gender agreement - "três" works for both masculine and feminine nouns',
    cultural: 'The "êis" spelling variant exists but "três" is standard'
  },

  // ============ ESSENTIAL PHRASES ============
  'quanto custa': {
    ipa: '/ˈkwɐ̃.tu ˈkuʃ.tɐ/',
    pronunciation: {
      guide: 'KWAN-too KOOSH-tah',
      breakdown: 'QUANTO (KWAN-too) + CUSTA (KOOSH-tah)',
      challenge: 'nasal',
      tip: 'The "an" in "quanto" is nasal. The "s" before "t" becomes "sh"!',
      commonMistake: 'Not nasalizing "an" or saying "KOOS-ta" without the "sh"',
      audioFocus: 'Listen for the nasal "an" and the "sh" in "custa"'
    },
    etymology: 'Quanto (how much) + custa (it costs)',
    memoryTrick: 'QUANTO = quantity. CUSTA = costs. What\'s the cost quantity?',
    usage: {
      formality: 'neutral',
      context: 'Asking the price of something',
      alternative: 'Qual é o preço? (What\'s the price?) - more formal'
    },
    frequency: 6,
    examples: [
      { pt: 'Quanto custa isto?', en: 'How much does this cost?', context: 'shopping' },
      { pt: 'Quanto custam os bilhetes?', en: 'How much do the tickets cost?', context: 'plural' },
      { pt: 'Quanto custa o quilo?', en: 'How much per kilo?', context: 'market' }
    ],
    grammar: 'Custam (they cost) for plural items',
    cultural: 'Essential for any market, shop, or restaurant!'
  },

  'não percebo': {
    ipa: '/nɐ̃w pɨɾˈse.bu/',
    pronunciation: {
      guide: 'now per-SEH-boo',
      breakdown: 'NÃO (now - nasal) + PERCEBO (per-SEH-boo)',
      challenge: 'nasal',
      tip: 'The "ão" in "não" is VERY nasal - like English "now" but through your nose. Stress on "SE".',
      commonMistake: 'Saying "no" without nasalization',
      audioFocus: 'Feel the strong nasal "ão" at the start'
    },
    etymology: 'Não (not) + percebo (I understand/perceive)',
    memoryTrick: 'I do NOT PERCEIVE = I don\'t understand',
    usage: {
      formality: 'neutral to polite',
      context: 'When you don\'t understand something said',
      alternative: 'Não entendo (I don\'t understand) - slightly different nuance'
    },
    frequency: 8,
    examples: [
      { pt: 'Não percebo, pode repetir?', en: 'I don\'t understand, can you repeat?', context: 'asking for clarification' },
      { pt: 'Desculpe, não percebo português muito bem.', en: 'Sorry, I don\'t understand Portuguese very well.', context: 'explaining limitation' }
    ],
    grammar: '"Perceber" is more common in EU-PT than "entender" for understanding language/meaning',
    cultural: 'Very useful phrase for language learners - use it often!'
  },

  'com licença': {
    ipa: '/kõ liˈsẽsɐ/',
    pronunciation: {
      guide: 'kon lee-SEN-sah',
      breakdown: 'COM (kon - nasal) + LICENÇA (lee-SEN-sah)',
      challenge: 'nasal',
      tip: 'Both "com" and the "en" in "licença" are nasal! Stress is on "SEN".',
      commonMistake: 'Not nasalizing properly or saying "license-ah"',
      audioFocus: 'Double nasal sounds - "om" and "en"'
    },
    etymology: 'Com (with) + licença (license/permission)',
    memoryTrick: 'With LICENSE = with permission to pass',
    usage: {
      formality: 'polite',
      context: 'When physically passing by someone or interrupting',
      alternative: 'Desculpe for getting attention or apologizing'
    },
    frequency: 15,
    examples: [
      { pt: 'Com licença, posso passar?', en: 'Excuse me, can I pass?', context: 'in a crowd' },
      { pt: 'Com licença, preciso de sair.', en: 'Excuse me, I need to leave.', context: 'leaving a row' }
    ],
    grammar: 'Fixed expression - always used together',
    cultural: 'Use when physically needing to move past someone - very common on public transport'
  }
};

/**
 * Get comprehensive word knowledge for teaching
 * @param {string} word - Portuguese word (lowercase, without accents for lookup)
 * @returns {Object|null} Word knowledge object or null if not found
 */
export function getWordKnowledge(word) {
  if (!word) return null;
  
  // Normalize for lookup: lowercase and basic form
  const normalized = word.toLowerCase().trim();
  
  // Direct lookup
  if (WORD_KNOWLEDGE[normalized]) {
    return WORD_KNOWLEDGE[normalized];
  }
  
  // Try without accents for lookup
  const noAccents = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (WORD_KNOWLEDGE[noAccents]) {
    return WORD_KNOWLEDGE[noAccents];
  }
  
  // Try with common variations
  const variations = [
    normalized.replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i').replace(/ó/g, 'o').replace(/ú/g, 'u'),
    normalized.replace(/ã/g, 'a').replace(/õ/g, 'o'),
    normalized.replace(/ç/g, 'c')
  ];
  
  for (const variant of variations) {
    if (WORD_KNOWLEDGE[variant]) {
      return WORD_KNOWLEDGE[variant];
    }
  }
  
  return null;
}

/**
 * Get pronunciation challenge type for a word
 * @param {string} word - Portuguese word
 * @returns {string} Challenge type: 'nasal', 'stress', 'reduction', 'digraph', 'cedilla', 'accent', or 'general'
 */
export function getPronunciationChallengeType(word) {
  const knowledge = getWordKnowledge(word);
  if (knowledge?.pronunciation?.challenge) {
    return knowledge.pronunciation.challenge;
  }
  
  // Auto-detect based on word content
  const w = word.toLowerCase();
  
  if (/[ãõ]|ão|ões|am$|em$|om$|um$/.test(w)) return 'nasal';
  if (/lh|nh/.test(w)) return 'digraph';
  if (/ç/.test(w)) return 'cedilla';
  if (/[áéíóúâêôà]/.test(w)) return 'accent';
  if (/rr|ch/.test(w)) return 'digraph';
  
  return 'general';
}

/**
 * Generate a pronunciation tip for a word without full knowledge
 * @param {string} word - Portuguese word
 * @returns {string} Basic pronunciation guidance
 */
export function generateBasicPronunciationTip(word) {
  const challengeType = getPronunciationChallengeType(word);
  
  const tips = {
    nasal: 'This word contains NASAL sounds - let air flow through your nose when you see ã, õ, ão, or final m/n.',
    digraph: 'Contains a special sound combination: LH sounds like "ly", NH sounds like Spanish "ñ", RR is a strong rolling R.',
    cedilla: 'The Ç (cedilla) makes an "S" sound, never a "K" sound.',
    accent: 'The accent mark shows which syllable is stressed. Put emphasis there!',
    stress: 'Pay attention to which syllable receives emphasis.',
    reduction: 'In EU-PT, unstressed vowels are very soft or "swallowed".',
    general: 'Listen carefully to the audio and try to match the rhythm and sounds.'
  };
  
  return tips[challengeType] || tips.general;
}

/**
 * Get all words with knowledge for a specific challenge type
 * @param {string} challengeType - Type of pronunciation challenge
 * @returns {Array} List of words with that challenge type
 */
export function getWordsByPronunciationChallenge(challengeType) {
  return Object.entries(WORD_KNOWLEDGE)
    .filter(([, data]) => data.pronunciation?.challenge === challengeType)
    .map(([word, data]) => ({ word, ...data }));
}

export default {
  WORD_KNOWLEDGE,
  getWordKnowledge,
  getPronunciationChallengeType,
  generateBasicPronunciationTip,
  getWordsByPronunciationChallenge
};
