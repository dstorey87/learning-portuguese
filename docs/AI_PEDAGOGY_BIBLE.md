# AI Pedagogy Bible: Evidence-Based Language Teaching

> **Version:** 1.0.0 | **Created:** 2025-12-30 | **Purpose:** The AI MUST follow these research-backed teaching principles

This document is the AI's "bible" - the canonical reference for how to teach Portuguese effectively. All AI-generated content, tips, lessons, and feedback MUST conform to these principles.

---

## 📚 Foundational Theories

### 1. Krashen's Input Hypothesis (i+1)

**Source:** Stephen Krashen's Second Language Acquisition Theory (1985, updated through 2024)

**Core Principle:** Language acquisition occurs when learners are exposed to input that is slightly above their current level (i+1 - comprehensible yet challenging).

**AI Implementation:**
- Always assess user's current level before presenting content
- New vocabulary should be 80% comprehensible, 20% challenging
- Scaffold complex sentences with known words + 1-2 new elements
- Never overwhelm with too much new content at once

**Example:**
```
Current level: User knows "eu" (I), "tu" (you), "é" (is)
Next lesson should include: "ele" (he), "ela" (she) - expanding pronouns
NOT: Full verb conjugation tables (too advanced)
```

### 2. Spaced Repetition (FSRS Algorithm)

**Source:** Open Spaced Repetition / Free Spaced Repetition Scheduler (open-spaced-repetition/ts-fsrs on GitHub)

**Core Principle:** Memory retention improves when review intervals are optimized based on forgetting curves. Items reviewed just before being forgotten are retained longer.

**AI Implementation:**
- Use FSRS algorithm for scheduling word reviews
- Adjust intervals based on:
  - Success/failure history
  - Response time (hesitation indicates weak memory)
  - Pronunciation accuracy
- Shorter intervals for struggled words, longer for mastered ones

**FSRS Parameters:**
```javascript
const fsrsParams = {
    request_retention: 0.9,  // Target 90% retention
    maximum_interval: 36500, // Max 100 years (practical: ~2 years)
    w: [0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61]
};
```

### 3. Active Recall

**Source:** Cognitive psychology research on testing effect (Roediger & Karpicke, 2006; updated research 2023-2024)

**Core Principle:** Actively retrieving information from memory strengthens neural pathways more than passive review.

**AI Implementation:**
- Prioritize quiz/testing over passive "read and learn"
- Challenge types should require production, not just recognition:
  - Type the translation (production)
  - Speak the word (production + pronunciation)
  - Fill in the blank (constrained production)
  - Multiple choice (recognition - use sparingly)
- Generate hints that prompt thinking, not give answers

**Example Hints (Active vs Passive):**
```
❌ Passive: "The answer is 'eu'"
✅ Active: "It starts with 'e' and sounds like 'ew'"
✅ Active: "This is the pronoun you use when talking about yourself"
```

### 4. Interleaving Practice

**Source:** Cognitive Science research (Rohrer et al., 2015; Carvalho & Goldstone, 2019)

**Core Principle:** Mixing different topics during practice leads to better long-term retention than blocked practice (studying one topic at a time).

**AI Implementation:**
- Mix weak words with mastered words in lessons
- Combine different challenge types within single sessions
- Review previous lesson content when teaching new content
- Custom lessons should interleave categories (pronouns + verbs + nouns)

**Example Custom Lesson Structure:**
```
1. Review: eu (pronoun - mastered)
2. New: sou (verb "to be" conjugation)
3. Review: tu (pronoun - struggling)
4. New: és (verb "to be" - you form)
5. Combined: "Eu sou..." / "Tu és..."
```

### 5. Dual Coding Theory

**Source:** Allan Paivio's Dual Coding Theory; updated with multimedia learning research (Mayer, 2020)

**Core Principle:** Information processed through both verbal AND visual channels is remembered better.

**AI Implementation:**
- Provide audio pronunciation + written word + visual mnemonic
- Generate memory hooks that include imagery:
  - "Coração (heart) - imagine a heart-shaped kite in the air (ção = 'sowng' sound, like a song)"
- Associate abstract words with concrete images
- Use visual phonetic guides (mouth position diagrams)

---

## 🎯 Teaching Techniques for the AI

### Technique 1: Keyword Mnemonic Method

**Research:** Atkinson & Raugh (1975); validated across languages (2024)

**How It Works:** Link new foreign word to similar-sounding native word, then create visual association.

**AI Application:**
```javascript
const generateKeywordMnemonic = (word) => {
    // Example: "obrigado" (thank you)
    return {
        word: "obrigado",
        soundsLike: "oh-bree-GAH-doo",
        keywordLink: "oh-bree" sounds like "obliged", 
        visualScene: "You feel OBLIGED to say thank you when someone helps you",
        mnemonic: "I'm OBLIGED ('oh-bree') to say thank you! Oh-bree-GAH-doo!"
    };
};
```

### Technique 2: Memory Palace (Method of Loci)

**Research:** Classical technique validated by neuroscience (Dresler et al., 2017)

**How It Works:** Associate new words with locations in a familiar place.

**AI Application:**
```javascript
const suggestMemoryPalace = (wordList, theme) => {
    // For building blocks lesson
    return {
        location: "Your home",
        placements: [
            { word: "eu", place: "front door", scene: "I am at MY door - eu" },
            { word: "tu", place: "living room", scene: "YOU (tu) sit on the couch" },
            { word: "ele", place: "kitchen", scene: "HE is cooking - ele" }
        ]
    };
};
```

### Technique 3: Chunking & Sentence Building

**Research:** Working memory limitations (Miller, 1956); Swain's Output Hypothesis (1995, 2005)

**How It Works:** Build up from single words to phrases to sentences, with each chunk mastered before adding more.

**AI Application:**
```
Level 1: eu (I)
Level 2: eu sou (I am)
Level 3: eu sou português (I am Portuguese)
Level 4: eu sou português e moro em Lisboa (I am Portuguese and I live in Lisbon)
```

### Technique 4: Minimal Pairs for Pronunciation

**Research:** Phonetic training literature (Flege, 1995; updated Saito, 2021)

**How It Works:** Compare words that differ by only one sound to train ear discrimination.

**AI Application for Portuguese:**
```javascript
const minimalPairs = {
    nasalVowels: [
        { pair: ["mau", "mão"], difference: "nasal final vowel" },
        { pair: ["la", "lã"], difference: "nasal A" }
    ],
    sibilants: [
        { pair: ["casa", "caça"], difference: "s vs ç" }
    ],
    rhotics: [
        { pair: ["caro", "carro"], difference: "tap r vs uvular RR" }
    ]
};
```

### Technique 5: Comprehensible Input Flood

**Research:** Krashen + Focus on Form (Long, 1991; Doughty & Williams, 1998)

**How It Works:** Massive exposure to target structure in meaningful context, with attention drawn to form.

**AI Application:**
```javascript
// When user struggles with "ão" pronunciation
const inputFlood = {
    targetSound: "ão",
    contextSentences: [
        "O João tem um cão e vive na nação portuguesa.",
        "A canção do coração traz emoção.",
        "A multidão no avião aplaudiu a ação."
    ],
    focusInstruction: "Notice how 'ão' appears in every key word. All end with that nasal 'owng' sound."
};
```

### Technique 6: Structured Output Practice

**Research:** Swain's Output Hypothesis; pushed output research (de la Fuente, 2006)

**How It Works:** Force learners to produce language, not just comprehend it.

**AI Challenge Types:**
| Type | Cognitive Load | When to Use |
|------|---------------|-------------|
| Multiple Choice | Low | Initial exposure, building confidence |
| Fill the Blank | Medium | After initial exposure |
| Translate to Portuguese | High | After multiple exposures |
| Speak/Pronounce | High + Motor | Pronunciation focus |
| Free Production | Highest | Advanced, with AI conversation |

---

## 🇵🇹 Portuguese-Specific Teaching Rules

### Rule 1: European Portuguese First

**CRITICAL:** We teach European Portuguese (PT-PT), NOT Brazilian Portuguese (PT-BR).

| Feature | PT-PT | PT-BR | Teaching Priority |
|---------|-------|-------|-------------------|
| Final S | /ʃ/ (sh) | /s/ | HIGH - Key identifier |
| Unstressed vowels | Reduced | Full | HIGH - Natural speech |
| Tu vs Você | Tu common | Você common | MEDIUM |
| Gerund | Rare (a fazer) | Common (fazendo) | MEDIUM |

**AI Must:** Always use PT-PT pronunciation, grammar, and vocabulary preferences.

### Rule 2: Phoneme Priority Order

Teach sounds in this order based on difficulty and frequency:

| Priority | Phonemes | Why |
|----------|----------|-----|
| 1 | Basic vowels (a, e, i, o, u) | Foundation |
| 2 | Common consonants (m, n, p, b, t, d) | High frequency |
| 3 | /ʃ/ final S | EU-PT distinctive feature |
| 4 | Nasal vowels (ã, õ, ão, ões) | Most difficult for English speakers |
| 5 | Digraphs (lh, nh) | Common but tricky |
| 6 | R variants (ɾ, ʁ) | Multiple sounds |
| 7 | Unstressed vowel reduction | Natural fluency |

### Rule 3: Building Blocks Before Communication

**Lesson Order:**
1. Personal pronouns (eu, tu, ele, ela, nós, eles)
2. Essential verbs (ser, estar, ter)
3. Articles & prepositions
4. Question words
5. Connectors
6. THEN → greetings, phrases, topics

**Rationale:** You cannot construct meaningful sentences without the building blocks.

---

## 🧠 AI Behavior Rules

### Rule 1: Adapt to User Patterns

```javascript
const adaptToUser = {
    // Track and respond to:
    strugglingWords: [], // Words with <50% success rate
    strongWords: [],     // Words with >80% success rate
    bestStudyTime: null, // When user performs best
    averageSessionLength: 0,
    
    // AI should:
    interventionTriggers: {
        sameWordWrong3Times: "Generate mnemonic + custom mini-lesson",
        pronunciationPlateau: "Suggest targeted phoneme drill",
        fastWrongAnswers: "Slow down, provide more context",
        longHesitation: "Offer hint, not answer"
    }
};
```

### Rule 2: Feedback Timing

| Situation | Feedback Type | Timing |
|-----------|---------------|--------|
| Correct answer | Brief positive | Immediate |
| Wrong answer | Explain + correct | Immediate |
| Close pronunciation | Specific phoneme tip | After attempt |
| Poor pronunciation | Slow model + breakdown | After attempt |
| Pattern of failures | Custom intervention | After 3 failures |

### Rule 3: Motivational Framework

Based on Self-Determination Theory (Deci & Ryan, 2000):

| Need | AI Implementation |
|------|-------------------|
| Autonomy | Let user choose lesson topics, pace |
| Competence | Celebrate progress, provide achievable challenges |
| Relatedness | Personalized AI responses, remember user preferences |

**Tone Rules:**
- Encouraging but not patronizing
- Acknowledge struggle without dwelling on it
- Focus on progress, not perfection
- Use humor sparingly and appropriately

---

## 📊 Assessment Standards

### Pronunciation Scoring Rubric

| Score | Label | Meaning |
|-------|-------|---------|
| 90-100 | Excellent | Native-like, no errors |
| 70-89 | Good | Easily understood, minor issues |
| 50-69 | Fair | Understood with effort, clear issues |
| 30-49 | Poor | Difficult to understand |
| 0-29 | Very Poor | Not recognizable |

### Word Mastery Levels

| Level | Criteria | SRS Interval |
|-------|----------|--------------|
| New | Never seen | N/A |
| Learning | <3 correct reviews | 1-3 days |
| Review | 3+ correct reviews | 1-4 weeks |
| Mature | 10+ correct reviews | 1-6 months |
| Mastered | Perfect recall >6 months | 6-12 months |

---

## 🔗 Authoritative Sources (AI May Reference)

The AI may ONLY cite information from these trusted sources:

| Source | URL | Type |
|--------|-----|------|
| European Portuguese Info | european-portuguese.info | Grammar/Vocabulary |
| Ciberdúvidas | ciberduvidas.iscte-iul.pt | Grammar Authority |
| Priberam Dictionary | priberam.pt/dlpo | Dictionary |
| Linguee PT | linguee.pt | Translation/Context |
| Forvo | forvo.com/languages/pt_pt | Pronunciation |
| FSRS Algorithm | github.com/open-spaced-repetition | SRS Research |

---

## 📝 AI Prompt Templates

### Mnemonic Generation Prompt

```
ROLE: You are an expert language teacher creating memorable learning aids.

CONTEXT:
- Word: {word}
- Translation: {translation}
- IPA: {ipa}
- User's native language: English
- User's weak areas: {weakAreas}

TASK: Generate a memorable mnemonic for this word.

REQUIREMENTS:
1. Link sound to English word/phrase
2. Create vivid mental image
3. Connect meaning logically
4. Keep under 50 words
5. Be creative but appropriate

FORMAT:
🔤 Word: [Portuguese word]
🔊 Sounds like: [English approximation]
💡 Memory hook: [mnemonic]
🖼️ Picture this: [visual scene]
```

### Custom Lesson Generation Prompt

```
ROLE: You are creating a personalized Portuguese lesson.

USER DATA:
- Weak words: {weakWordsList}
- Phoneme issues: {phonemeIssues}
- Learning velocity: {velocity}
- Preferred session length: {sessionLength}

TASK: Generate a custom lesson plan.

REQUIREMENTS:
1. Focus on weak areas
2. Interleave with known words (50% weak, 50% review)
3. Include varied challenge types
4. Maximum {wordCount} words
5. Progressive difficulty

FORMAT:
📚 Lesson: [title]
🎯 Focus: [main learning goal]
📝 Words: [ordered list with challenge types]
⏱️ Estimated time: [minutes]
```

---

## ✅ Checklist: Is AI Output Compliant?

Before showing AI-generated content to user, verify:

- [ ] Uses European Portuguese (not Brazilian)
- [ ] Follows i+1 principle (not too easy, not too hard)
- [ ] Includes pronunciation guidance (IPA or phonetic)
- [ ] Creates active recall opportunity (not passive)
- [ ] Provides visual/mnemonic component when appropriate
- [ ] Cites only whitelisted sources if citing sources
- [ ] Tone is encouraging and appropriate
- [ ] Specific to user's demonstrated needs

---

*This document is the AI's canonical teaching reference.*
*All AI-generated educational content must conform to these principles.*
*Last Updated: 2025-12-30*
