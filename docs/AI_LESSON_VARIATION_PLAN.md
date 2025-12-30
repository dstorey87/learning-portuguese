# AI Lesson Variation Master Plan

> **Version:** 1.0 | **Status:** Canonical | **Updated:** 2025-12-30

This is the **single source of truth** for lesson architecture, exercise types, sequencing, AI adaptation, telemetry, and testing. All implementation must reference this document. No new exercise type or flow may be added without first documenting it here.

---

## Table of Contents

1. [User Requirements](#user-requirements)
2. [Global Criteria](#global-criteria)
3. [Source Table (Prioritized)](#source-table-prioritized)
4. [Lesson Order & Rationale](#lesson-order--rationale)
5. [Exercise Type Catalog](#exercise-type-catalog)
6. [AI Lesson Generation & Adaptation](#ai-lesson-generation--adaptation)
7. [Telemetry Requirements](#telemetry-requirements)
8. [MCP Playwright Validation Scenarios](#mcp-playwright-validation-scenarios)
9. [Execution Tasks](#execution-tasks)
10. [Definitions of Done (Per Track)](#definitions-of-done-per-track)
11. [LLM Interchangeability](#llm-interchangeability)
12. [Enforcement Rules](#enforcement-rules)

---

## User Requirements

| Requirement | Implementation |
|-------------|----------------|
| Remove "list all words first" | Practice-first: every lesson opens with an active exercise |
| Add missing-word/find-the-word | Cloze and word-bank exercises with distractors |
| Click-to-order sentences | Word order builder with drag/click + foil words |
| Visual references (finger numbers, pastry for pastel) | Image assets required; preload with alt text |
| Type-from-image/audio | Image→type and Audio→type exercises |
| Lessons in correct order | Building Blocks → Essential Communication → Daily Topics |
| English lesson names + descriptions | English title + subline on every card/detail |
| AI generates and adapts lessons | Static seed (Phase 1) → Adaptive (Phase 2) → Portfolio-based (Phase 3) |
| Varied lesson types | 15+ exercise types in catalog |
| Interchangeable LLM | Model registry with fallback to local Ollama |
| End-to-end Playwright validation | MCP tools on http://localhost:63436 with screenshots |

---

## Global Criteria

**These rules apply to EVERY task. No exceptions.**

| Criterion | Enforcement |
|-----------|-------------|
| **Zero tolerance for bugs** | No known failures permitted; fix and rerun immediately |
| **No-stop rule** | Continue fix→validate loop until all MCP scenarios pass with evidence |
| **Practice-first** | No word-list-first screens; first view must be an active exercise |
| **English titles** | Every lesson card/detail has English title + subline description |
| **Telemetry required** | Every interaction emits events (answer_attempt, pronunciation_score, etc.) |
| **User isolation** | All storage keys prefixed with `${userId}_` |
| **Asset rules** | Images preloaded, alt text present, numbers show visual fingers |
| **Reference enforcement** | Each task must cite source(s) from Source Table |
| **Playwright evidence** | Capture screenshots + asset URLs; failure blocks completion |
| **Source verification** | Implementer must read cited source before implementing |

---

## Source Table (Prioritized)

Sources ordered by direct usefulness to this plan (exercise design first, then sequencing, adaptivity, testing, ops).

| # | Source | URL | Relevance |
|---|--------|-----|-----------|
| 1 | Duolingo Exercise Types | https://duolingo.fandom.com/wiki/Exercise_types | Reference patterns for reorder, cloze, picture flashcards, distractors |
| 2 | Duolingo Teaching Method | https://blog.duolingo.com/how-we-learn | Implicit learning, functional approach; informs practice-first |
| 3 | Babbel Methodology | https://www.babbel.com/en/method | Chunk-based phrases and spaced review; guides chunking |
| 4 | Rosetta Stone Dynamic Immersion | https://blog.rosettastone.com/how-rosetta-stone-works/ | Picture-word association for image-heavy tasks |
| 5 | Pimsleur Method | https://www.pimsleur.com/the-pimsleur-method | Graduated interval recall; informs audio-first drills |
| 6 | LingQ Comprehensible Input | https://www.lingq.com/en/learn-languages-like-steve-kaufmann/ | Reading and listening in context; supports i+1 |
| 7 | Memrise Mems | https://memrise.zendesk.com/hc/en-us/articles/201222409-What-are-Mems | Visual mnemonics; supports memory palace |
| 8 | Drops Visual Vocab | https://languagedrops.com/ | Fast visual drills; inspires rapid recall with imagery |
| 9 | Mondly VR | https://www.mondly.com/vr | Immersive scenarios; informs dialogue reorder |
| 10 | Busuu Methodology | https://www.busuu.com/en/it-works/busuu-methodology | Communicative chunks; free practice prompts |
| 11 | iTalki Tutoring | https://www.italki.com/ | Live practice benchmark; conversational goals |
| 12 | Lingoda CEFR | https://www.lingoda.com/en/cefr/ | CEFR progression; sets gating thresholds |
| 13 | Glossika Mass Sentences | https://ai.glossika.com/ | Sentence-based spaced drills; rapid recall |
| 14 | Clozemaster Cloze-in-Context | https://www.clozemaster.com/ | Cloze design; missing-word tasks with context |
| 15 | FluentU Authentic Video | https://www.fluentu.com/blog/faq/ | Authentic media with captions; dual coding |
| 16 | Speechling Pronunciation | https://speechling.com/ | Shadowing and coach feedback; shadowing DoD |
| 17 | Krashen Input Hypothesis | https://www.sdkrashen.com/content/books/principles_and_practice.pdf | i+1 input; sequencing and input flood |
| 18 | Krashen Affective Filter | https://seidlitzblog.org/2020/09/22/what-is-the-affective-filter/ | Lower anxiety; encouragement tips |
| 19 | Swain Output Hypothesis | https://www.researchgate.net/publication/248970712_The_Output_Hypothesis | Pushed output; production tasks |
| 20 | VanPatten Input Processing | https://benjamins.com/catalog/sibil.62.01lee | Structured input; form-focused tasks |
| 21 | Paul Nation Four Strands | https://www.wgtn.ac.nz/lals/resources/paul-nations-resources/paul-nations-publications/publications/documents/1996-Four-strands.pdf | Balance input/output/form/fluency |
| 22 | FSRS vs SM-2 | https://faqs.ankiweb.net/what-spaced-repetition-algorithm-does-anki-use.html | Scheduling model for review share |
| 23 | Retrieval Practice (Roediger & Karpicke) | https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6047985/ | Testing effect; frequent recall tasks |
| 24 | Interleaving (Nakata & Suzuki 2019) | https://yuichisuzuki.net/wp-content/uploads/2023/04/Nakata-Suzuki-2019-MLJ.pdf | Interleave topics; mix review items |
| 25 | Dual Coding (Paivio) | https://en.wikipedia.org/wiki/Dual-coding_theory | Combine text, image, audio |
| 26 | Multimedia Principles (Mayer) | https://en.wikipedia.org/wiki/Multimedia_learning#Mayer%27s_principles | Reduce cognitive load |
| 27 | Desirable Difficulties (Bjork) | https://bjorklab.psych.ucla.edu/wp-content/uploads/sites/13/2016/07/RBjork_inpress.pdf | Effortful retrieval |
| 28 | Elaborative Interrogation | https://arc.duke.edu/learning/strategies/elaborative-interrogation | Why-questions; rationale prompts |
| 29 | TBLT Overview | https://www.sanako.com/blog/task-based-language-teaching | Real tasks; communicative exercises |
| 30 | CEFR Framework | https://www.coe.int/en/web/common-european-framework-reference-languages | Level descriptors for gating |
| 31 | ACTFL Proficiency | https://www.actfl.org/resources/actfl-proficiency-guidelines-2012 | Output criteria per level |
| 32 | Minimal Pairs | https://pronuncian.com/minimal-pairs | Phoneme discrimination tasks |
| 33 | Dictogloss | https://www.teachingenglish.org.uk/article/dictogloss | Pushed output and syntax |
| 34 | Errorless vs Correction | https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7343685/ | Feedback timing; gentle corrections |
| 35 | Shadowing Technique | https://www.mezzoguild.com/shadowing/ | Shadowing DoD implementation |
| 36 | Gamification Impact | https://elearningindustry.com/gamification-in-learning-enhancing-engagement-and-retention | Motivation loops |
| 37 | Adaptive Learning ITS Survey | https://arxiv.org/abs/2404.02798 | Adaptive tutor patterns |
| 38 | ASR Scoring for CAPT | https://www.mdpi.com/2076-3417/11/15/6695 | Phoneme scoring reference |
| 39 | Speed Control and Prosody | https://www.sciencedirect.com/science/article/pii/S0167639319301219 | Playback speed effects |
| 40 | Number Listening Research | https://www.sciencedirect.com/science/article/pii/S0883035514000523 | Number comprehension |
| 41 | Confusion Pair Logging | https://www.frontiersin.org/articles/10.3389/fpsyg.2023.1210187/full | ASR + peer correction |
| 42 | Memory Palace Mnemonics | https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4339011/ | Spatial mnemonics |
| 43 | Keyword Mnemonic | https://link.springer.com/article/10.3758/BF03209391 | Classic keyword method |
| 44 | Input Flood | https://www.researchgate.net/publication/26484044_Input_enhancement_Input_flood | Emphasize forms in context |
| 45 | Chunking/Multiword Units | https://www.taylorfrancis.com/chapters/edit/10.4324/9781315835771-4/lexical-approach-david-nattinger-jeanette-decarrico | Phrase-level learning |
| 46 | Feedback Latency | https://www.sciencedirect.com/science/article/pii/S1877042812049480 | Immediate vs delayed |
| 47 | Visual Imagery Efficacy | https://www.mdpi.com/2227-7102/9/3/210 | Visual aids impact |
| 48 | Encouragement in SLA | https://www.tandfonline.com/doi/full/10.1080/2331186X.2017.1331533 | Motivational messaging |
| 49 | Interleaved Grammar Practice | https://onlinelibrary.wiley.com/doi/10.1111/lang.12659 | Interleaving grammar |
| 50 | IPA Corrective Feedback | https://www.cambridge.org/core/journals/studies-in-second-language-acquisition/article/abs/phonological-feedback-in-l2/ | IPA-based corrections |
| 51 | Timed Retrieval | https://www.sciencedirect.com/science/article/pii/S0742051X17301767 | Speeded tests |
| 52 | Distractor Design | https://www.ascd.org/el/articles/the-art-of-constructing-multiple-choice-questions | Best practices for foils |
| 53 | ZPD Scaffolding | https://journals.bilpubgroup.com/index.php/fls/article/view/9624 | Scaffold tasks |
| 54 | Authentic Audio with Captions | https://www.papora.com/learn-english/fluentu/ | Captions + audio benefits |
| 55 | Model Selection Ops | https://arxiv.org/abs/2309.03409 | Cost/latency trade-offs |
| 56 | Privacy in Adaptive Tutors | https://dl.acm.org/doi/10.1145/3510063.3510120 | Per-user isolation |
| 57 | Learning Analytics Events | https://dl.acm.org/doi/10.1145/3410360.3410740 | Event schemas |
| 58 | Admin Observability | https://martinfowler.com/articles/observability.html | Monitoring patterns |
| 59 | CEFR Number Benchmarks | https://www.efset.org/cefr/ | Level expectations |
| 60 | Visual Numeracy Aids | https://www.sciencedirect.com/science/article/pii/S0732312316301042 | Visuals for numbers |

---

## Lesson Order & Rationale

### Sequence

```
Building Blocks → Essential Communication → Daily Topics
```

### Building Blocks (Tier 1) - Must complete first

These are the foundational elements without which no meaningful sentence can be constructed. The user must know these inside-out before progressing.

| Category | Items | Why First |
|----------|-------|-----------|
| **Pronouns** | eu, tu, ele/ela, nós, vocês, eles/elas | Every sentence needs a subject; pronouns are the most common subjects |
| **Articles** | o, a, os, as, um, uma | Portuguese requires articles more than English; gender agreement is critical |
| **Basic Verbs** | ser, estar, ter, ir, fazer | Core verbs cover 60%+ of everyday communication |
| **Negation** | não, nunca, nada, ninguém | Users must negate before they can express preferences or disagreement |
| **Connectors** | e, mas, ou, porque, quando | Link ideas; essential for compound sentences |
| **Prepositions** | de, em, para, com, por | Spatial/temporal relationships; highly frequent |

**Rationale (Sources 17, 21, 30):**
- Krashen's i+1: Each lesson adds exactly one new concept to known material
- Nation's Four Strands: Balance receptive/productive skills from day one
- CEFR A1: "Can understand and use familiar everyday expressions and very basic phrases"

### Essential Communication (Tier 2) - Unlocks at 80% Tier 1

| Category | Items | Why Second |
|----------|-------|-----------|
| **Greetings/Farewells** | olá, bom dia, adeus, até logo | Social necessity; uses pronouns + verbs learned |
| **Numbers 0-100** | zero through cem | Prices, times, dates require numbers |
| **Time Expressions** | hoje, amanhã, ontem, agora, depois | Temporal reference for all narratives |
| **Questions** | quem, o que, onde, quando, como, porquê | Information gathering; uses known verbs |
| **Common Adjectives** | bom, mau, grande, pequeno, novo, velho | Description requires noun+adjective agreement |

### Daily Topics (Tier 3) - Unlocks at 80% Tier 2

| Category | Items | Why Third |
|----------|-------|-----------|
| **Food/Restaurant** | menu vocab, ordering phrases | Practical need for travelers; complex sentences |
| **Travel/Directions** | transport, navigation, locations | Builds on prepositions + questions |
| **Shopping** | prices, quantities, transactions | Applies numbers + adjectives |
| **Health** | body parts, symptoms, emergencies | Safety vocabulary |
| **Work/Occupations** | professions, workplace vocab | Social conversation topics |

### Unlock Logic

```javascript
// src/services/LessonService.js
function canUnlockLesson(lessonId, userProgress) {
  const prereqs = lessonMetadata[lessonId].prerequisites;
  return prereqs.every(prereqId => 
    userProgress[prereqId]?.accuracy >= 0.80
  );
}
```

**Gate at 80% accuracy (Sources 30, 31):**
- CEFR/ACTFL research shows 80% mastery ensures retention
- Below 80%, cognitive load of new material causes interference
- Prevents "house of cards" where advanced lessons fail due to weak foundations

### Interleaving (Sources 24, 49)

Every lesson session includes:
- **70% new material** from current lesson
- **20% review** from prior tier (FSRS-scheduled)
- **10% preview** of upcoming concepts (priming)

---

## Exercise Type Catalog

Each exercise type has a complete specification including Definition of Done, telemetry requirements, files to modify, and source references.

### Type 1: Word Order Builder

**Description:** User is presented with scrambled words and must arrange them into a correct sentence. Includes distractor words that do NOT belong in the sentence.

**User Experience:**
1. See scrambled word tiles (e.g., "gosto | eu | não | pizza | de | banana")
2. Click/drag tiles into order
3. "banana" is a distractor - selecting it is wrong
4. Hint appears after 1 failed attempt
5. Submit and see immediate feedback

**Technical Specification:**

| Attribute | Specification |
|-----------|---------------|
| **Interaction** | Drag-and-drop or click-to-place |
| **Distractors** | Minimum 2 foil words per sentence |
| **Hints** | Show hint after 1 failed attempt |
| **Validation** | Check syntax, word order, agreement |
| **Telemetry** | `attempt_time`, `correctness`, `confusion_pairs`, `hint_used`, `distractor_selected` |
| **Files to Change** | `src/components/lesson/ChallengeRenderer.js`, `src/data/lessons/*.js` |
| **Sources** | 1 (Duolingo patterns), 2 (practice-first), 24 (interleaving), 52 (distractor design) |

**Definition of Done:**
- [ ] Renders word tiles in randomized order
- [ ] Includes ≥2 distractor words visually distinct
- [ ] Validates syntax and agreement on submit
- [ ] Shows hint after 1 fail (not immediately)
- [ ] Emits all telemetry events on submit
- [ ] Unit test covers ordering logic + distractor rejection
- [ ] Playwright screenshot confirms rendering
- [ ] No word-list screen precedes this exercise

**Playwright Test (MCP):**
```
1. mcp_playwright_browser_navigate to lesson with word-order exercise
2. mcp_playwright_browser_snapshot to verify tiles visible
3. mcp_playwright_browser_click on tiles in wrong order
4. Verify hint appears after failure
5. mcp_playwright_browser_click on tiles in correct order
6. mcp_playwright_browser_take_screenshot of success state
7. mcp_playwright_browser_evaluate to confirm telemetry fired
```

---

### Type 2: Sentence Builder with Distractors

**Description:** Word bank contains all correct words PLUS foils (wrong words). User selects words to build the sentence.

**User Experience:**
1. See target sentence in English: "I like coffee"
2. Word bank shows: "eu | gosto | de | café | leite | chá | não"
3. Select "eu", "gosto", "de", "café"
4. "leite", "chá", "não" are distractors
5. Wrong selections are logged but allowed (for learning)

**Technical Specification:**

| Attribute | Specification |
|-----------|---------------|
| **Word Bank** | All correct words + ≥2 distractors |
| **Validation** | Semantic correctness (translation matches) |
| **Telemetry** | `wrong_token_picks`, `attempt_count`, `time_per_selection` |
| **Files to Change** | `ChallengeRenderer.js`, lesson schemas in `src/data/lessons/*.js` |
| **Sources** | 1, 14 (Clozemaster), 52 (distractor design) |

**Definition of Done:**
- [ ] Word bank displays with correct + distractor words
- [ ] Distractors are plausible (same category, e.g., drinks)
- [ ] Wrong picks logged but exercise continues
- [ ] Correct sentence validated on submit
- [ ] Telemetry emitted with all fields
- [ ] Playwright confirms word bank visibility

---

### Type 3: Cloze Translation (Missing Word)

**Description:** Context sentence with blank; user fills the missing word via keyboard or click from options.

**User Experience:**
1. See: "Eu _____ café todos os dias" (I drink coffee every day)
2. Type "bebo" or select from options
3. Feedback distinguishes spelling error vs wrong word entirely

**Technical Specification:**

| Attribute | Specification |
|-----------|---------------|
| **Context** | Full sentence visible with _____ blank |
| **Input Mode** | Keyboard typing OR word bank click (configurable) |
| **Error Categorization** | `spelling_error` vs `lexical_error` vs `correct` |
| **Accent Handling** | Accept with/without accents, but note if missing |
| **Telemetry** | `latency`, `error_type`, `attempts`, `accent_used` |
| **Files to Change** | `ChallengeRenderer.js`, lesson schemas |
| **Sources** | 1, 14 (Clozemaster cloze-in-context), 23 (retrieval practice) |

**Definition of Done:**
- [ ] Blank renders clearly in sentence
- [ ] Accepts keyboard input with accent tolerance
- [ ] Categorizes error type correctly
- [ ] Shows different feedback for spelling vs lexical
- [ ] Telemetry emitted with error categorization
- [ ] Screenshot shows cloze format clearly

---

### Type 4: Picture Flashcard (Find the Word)

**Description:** Display 3+ images; user selects image matching the spoken/written word.

**User Experience:**
1. Hear/see: "maçã" (apple)
2. See 4 images: apple, banana, orange, grape
3. Click the apple image
4. Immediate feedback

**Technical Specification:**

| Attribute | Specification |
|-----------|---------------|
| **Images** | Minimum 3, maximum 6, all preloaded |
| **Alt Text** | Required on every image for accessibility |
| **Correct Answer** | Exactly 1 correct |
| **Audio** | TTS plays word on load (optional replay button) |
| **Telemetry** | `chosen_option`, `asset_load_success`, `time_to_select` |
| **Files to Change** | `LessonCard.js`, lesson data, `assets/` folder |
| **Sources** | 1, 4 (Rosetta Stone immersion), 15 (FluentU), 47 (visual imagery) |

**Definition of Done:**
- [ ] 3+ images render without lazy-load failures
- [ ] Images preloaded (checked via evaluate)
- [ ] Alt text present on all images
- [ ] Correct selection triggers success feedback
- [ ] Wrong selection triggers try-again feedback
- [ ] Telemetry includes asset URLs
- [ ] Playwright `evaluate` confirms image URLs are valid

---

### Type 5: Image → Type Word (e.g., pastel → pastry)

**Description:** Show image; user types the target word in Portuguese.

**User Experience:**
1. See image of a pastry (pastel de nata)
2. Text prompt: "Type the Portuguese word for this"
3. User types "pastel"
4. Accept with or without accent; note if missing

**Technical Specification:**

| Attribute | Specification |
|-----------|---------------|
| **Image** | Subject-matched photo (NOT abstract/gradient) |
| **Input** | Text field; accent-tolerant |
| **Validation** | Exact match or close spelling |
| **Telemetry** | `keystroke_count`, `response_time`, `accent_correct` |
| **Files to Change** | `ChallengeRenderer.js`, assets folder |
| **Sources** | 4 (Rosetta Stone), 7 (Memrise), 8 (Drops) |

**Definition of Done:**
- [ ] Image displays BEFORE input field (not after)
- [ ] No word list shown first - this IS the first view
- [ ] Accepts accented characters (ã, ç, etc.)
- [ ] Feedback on submit is immediate
- [ ] Telemetry captures keystrokes and timing
- [ ] Playwright screenshot shows image + input field together
- [ ] Image URL matches subject (verified via evaluate)

---

### Type 6: Audio → Type Word (Dictation)

**Description:** Play audio; user types what they hear.

**User Experience:**
1. Audio plays automatically: "obrigado"
2. User types what they heard
3. Replay button available
4. Speed slider to slow down audio
5. Submit and see accuracy score

**Technical Specification:**

| Attribute | Specification |
|-----------|---------------|
| **Audio Source** | Edge-TTS pt-PT voices (Male: Duarte, Female: Raquel) - configurable from admin |
| **Controls** | Play, Replay, Speed slider (0.5x - 1.5x) |
| **Scoring** | WER-style (word error rate) |
| **Telemetry** | `wer_score`, `replay_count`, `speed_used`, `time_to_submit` |
| **Files to Change** | `AudioPreprocessor.js`, `ChallengeRenderer.js`, `VoiceService.js` |
| **Sources** | 5 (Pimsleur), 38 (ASR scoring), 39 (speed control) |

**Definition of Done:**
- [ ] Audio plays on exercise start
- [ ] Replay button works (unlimited replays)
- [ ] Speed slider visibly moves and affects playback
- [ ] Accurate WER scoring on submit
- [ ] Telemetry includes all audio interaction data
- [ ] Playwright verifies speed slider interaction

---

### Type 7: Audio → Pick Meaning (MCQ)

**Description:** Play audio; user selects meaning from 4 English options.

**User Experience:**
1. Audio plays: "Onde está o banco?"
2. See 4 options: "Where is the bank?", "Where is the bathroom?", "What is the bank?", "When is the bank?"
3. Select correct translation
4. Immediate feedback

**Technical Specification:**

| Attribute | Specification |
|-----------|---------------|
| **Options** | 1 correct + 3 distractors |
| **Distractor Quality** | Similar structure, plausible confusion |
| **Order** | Randomized each attempt |
| **Telemetry** | `chosen_option`, `was_distractor`, `audio_replay_count` |
| **Files to Change** | `ChallengeRenderer.js` |
| **Sources** | 1, 52 (distractor design) |

**Definition of Done:**
- [ ] 4 options displayed clearly
- [ ] Order randomized (not alphabetical)
- [ ] Correct answer validated
- [ ] Distractors are plausible (not obviously wrong)
- [ ] Telemetry logs which option selected
- [ ] Playwright confirms MCQ rendering

---

### Type 8: Minimal Pair Picker

**Description:** Play two similar sounds; user identifies target.

**User Experience:**
1. Target prompt: "Select 'avô' (grandfather)"
2. Two audio buttons: "avô" vs "avó"
3. User clicks one
4. Feedback explains the phonetic difference

**Technical Specification:**

| Attribute | Specification |
|-----------|---------------|
| **Sounds** | Two phonetically similar words |
| **Examples** | avô/avó, pão/pau, mão/mau |
| **Feedback** | Explain IPA difference on wrong answer |
| **Telemetry** | `confusion_matrix` entry, `attempts` |
| **Files to Change** | `PronunciationService.js`, `ChallengeRenderer.js` |
| **Sources** | 32 (minimal pairs), 38 (ASR scoring), 50 (IPA feedback) |

**Definition of Done:**
- [ ] Two audio options clearly labeled
- [ ] Both play distinct audio files
- [ ] Selection captured correctly
- [ ] Confusion logged to user's phoneme profile
- [ ] Feedback includes IPA explanation
- [ ] Playwright verifies both audio buttons work

---

### Type 9: Word-to-Image Match Grid

**Description:** Match 4-6 words to their corresponding images.

**User Experience:**
1. See grid: 4 words on left, 4 images on right
2. Draw lines or click pairs to match
3. All pairs must be correct to complete
4. Errors shown per pair

**Technical Specification:**

| Attribute | Specification |
|-----------|---------------|
| **Pairs** | 4-6 word-image pairs |
| **Shuffle** | Both words and images randomized |
| **Completion** | All pairs must match |
| **Telemetry** | `attempts_per_pair`, `total_time`, `wrong_matches` |
| **Files to Change** | `ChallengeRenderer.js`, assets |
| **Sources** | 1, 4 (Rosetta Stone), 8 (Drops) |

**Definition of Done:**
- [ ] Grid displays shuffled words and images
- [ ] Matching interaction works (line or click)
- [ ] All pairs must match to complete
- [ ] Per-pair telemetry logged
- [ ] Playwright screenshot confirms grid layout

---

### Type 10: Grammar Transform

**Description:** Transform word/phrase (e.g., present → past, singular → plural).

**User Experience:**
1. Prompt: "Change to past tense: eu falo"
2. User types: "eu falei"
3. Feedback on morphology correctness
4. Error categorized: tense/person/gender/number

**Technical Specification:**

| Attribute | Specification |
|-----------|---------------|
| **Transforms** | Tense, person, gender, number |
| **Validation** | Morphologically correct |
| **Error Categories** | `tense_error`, `person_error`, `gender_error`, `number_error` |
| **Telemetry** | `error_category`, `transform_type`, `attempts` |
| **Files to Change** | `ChallengeRenderer.js`, `src/data/ai-reference/grammar-patterns.js` |
| **Sources** | 20 (VanPatten), 24 (interleaving), 49 (interleaved grammar) |

**Definition of Done:**
- [ ] Prompt clearly states transformation required
- [ ] Validates morphology (not just string match)
- [ ] Categorizes errors correctly
- [ ] References `grammar-patterns.js` for rules
- [ ] Telemetry includes error categorization
- [ ] Playwright confirms prompt rendering

---

### Type 11: Listen-and-Reorder Dialogue

**Description:** Play dialogue clips out of order; user sequences them.

**User Experience:**
1. See 3 audio clips (shuffled)
2. Listen to each clip
3. Drag/click to arrange in correct order
4. Submit and see if conversation flows logically

**Technical Specification:**

| Attribute | Specification |
|-----------|---------------|
| **Clips** | 2-4 dialogue turns |
| **Context** | Real conversation scenario |
| **Telemetry** | `mis_order_count`, `clips_played`, `total_time` |
| **Files to Change** | `ChallengeRenderer.js`, audio assets |
| **Sources** | 9 (Mondly), 29 (TBLT) |

**Definition of Done:**
- [ ] Multiple clips play independently
- [ ] Drag/click to reorder works
- [ ] Order validated on submit
- [ ] Telemetry captures ordering attempts
- [ ] Playwright confirms reordering UI

---

### Type 12: Pronunciation Shadowing

**Description:** User records themselves repeating a phrase; scored against target.

**User Experience:**
1. Target audio plays: "Bom dia, como está?"
2. User clicks record and repeats
3. Recording compared to target
4. Per-phoneme feedback displayed
5. IPA differences highlighted

**Technical Specification:**

| Attribute | Specification |
|-----------|---------------|
| **Target** | Native audio + IPA transcription |
| **Recording** | User mic input via WebAudio API |
| **Scoring** | ASR + PhoneticScorer (per-phoneme) |
| **Telemetry** | `per_phoneme_accuracy[]`, `overall_score`, `problem_phonemes[]` |
| **Files to Change** | `PronunciationService.js`, `PhoneticScorer.js`, `ChallengeRenderer.js` |
| **Sources** | 16 (Speechling), 35 (shadowing), 50 (IPA feedback) |

**Definition of Done:**
- [ ] Target audio plays with transcript shown
- [ ] Recording captures user audio
- [ ] Phonetic scoring returns per-phoneme
- [ ] Per-phoneme feedback displayed (green/yellow/red)
- [ ] IPA differences explained
- [ ] Telemetry includes phoneme breakdown
- [ ] Playwright verifies record button functionality

---

### Type 13: Number Comprehension

**Description:** Play number audio; user types digits; finger image shown as visual aid.

**User Experience:**
1. Audio plays: "vinte e três" (23)
2. Image shows: 2 fingers on one hand + 3 on another (for 1-10) OR digits display
3. User types: "23"
4. Feedback on correctness

**Technical Specification:**

| Attribute | Specification |
|-----------|---------------|
| **Audio** | Number spoken in Portuguese (Edge-TTS pt-PT, male/female from admin config) |
| **Visual** | Finger image (1-10) or digit display (11+) |
| **Input** | Numeric keyboard input |
| **Telemetry** | `off_by_error` (how far from correct), `response_time` |
| **Files to Change** | `ChallengeRenderer.js`, number assets |
| **Sources** | 40 (number listening), 59 (CEFR numbers), 60 (visual numeracy) |

**Definition of Done:**
- [ ] Audio plays number clearly
- [ ] Finger/digit image visible alongside audio
- [ ] Numeric input validates correctly
- [ ] Off-by errors logged (e.g., typed 32 instead of 23)
- [ ] Telemetry captures error magnitude
- [ ] Playwright screenshot shows finger image

---

### Type 14: Rapid Recall (Timed)

**Description:** Timed session (30-60s) of rapid-fire vocabulary.

**User Experience:**
1. Timer starts: 30 seconds
2. Flash card appears: image + audio
3. User types answer quickly
4. Next card appears immediately
5. Score at end: items/second + accuracy

**Technical Specification:**

| Attribute | Specification |
|-----------|---------------|
| **Timer** | Visible countdown (30-60s configurable) |
| **Items** | Random vocabulary from completed lessons |
| **Pace** | Auto-advance after answer or 5s timeout |
| **Telemetry** | `items_per_second`, `accuracy`, `timeout_count` |
| **Files to Change** | `ChallengeRenderer.js`, timer utility |
| **Sources** | 23 (retrieval practice), 27 (desirable difficulties), 51 (timed retrieval) |

**Definition of Done:**
- [ ] Timer displays and counts down visibly
- [ ] Items cycle with auto-advance
- [ ] Score calculated at end
- [ ] Items per second + accuracy shown
- [ ] Telemetry includes rate metrics
- [ ] Playwright confirms timer visible and counting

---

### Type 15: Multi-Modal Dual Coding

**Description:** Present word with text + image + audio simultaneously; user recalls translation.

**User Experience:**
1. See: Word "gato", Image of cat, Audio plays "gato"
2. User types English translation: "cat"
3. After submit, asked which modality helped most
4. Logs modality preference for future lessons

**Technical Specification:**

| Attribute | Specification |
|-----------|---------------|
| **Modalities** | Text visible, image visible, audio auto-plays |
| **Recall** | User types translation |
| **Follow-up** | "Which helped you remember?" (text/image/audio) |
| **Telemetry** | `modality_clicked`, `modality_preference`, `recall_success` |
| **Files to Change** | `ChallengeRenderer.js`, asset preload |
| **Sources** | 25 (dual coding), 26 (multimedia principles), 47 (visual imagery) |

**Definition of Done:**
- [ ] All three modalities render simultaneously
- [ ] Audio plays on load
- [ ] User can click to replay audio
- [ ] Translation validated
- [ ] Modality preference captured
- [ ] Telemetry captures which modality used
- [ ] Playwright confirms all three elements visible

---

## AI Lesson Generation & Adaptation

The AI system generates and adapts lessons in three phases based on user profile maturity.

### Phase 1: Static Seed (0-50 interactions)

**What Happens:**
- AI generates lessons from curated templates
- Outputs are deterministic - same user input produces same lesson
- No personalization based on performance
- Focus on establishing baseline user profile

**Why:**
- Insufficient data to personalize reliably (Sources 37, 56)
- Risk of overfitting to noise from small sample
- Users need consistent experience while building familiarity

**Implementation (Files: `src/services/ai/AIAgent.js`):**
```javascript
async function generateLesson(userId, lessonId, profileData) {
  const interactionCount = profileData.totalInteractions || 0;
  
  if (interactionCount < 50) {
    // Phase 1: Use template-based generation
    return generateFromTemplate(lessonId, {
      exerciseTypes: ['word_order', 'cloze', 'picture_flashcard'],
      difficultyLevel: 'standard',
      includeReview: false // No interleaving yet
    });
  }
  // ... phases 2 and 3
}
```

**Definition of Done:**
- [ ] AIAgent detects interaction count < 50
- [ ] Uses template-based generation (no profiler signals)
- [ ] Exercise mix follows default distribution
- [ ] Telemetry still captured for future phases
- [ ] Unit test confirms phase detection

---

### Phase 2: Adaptive (50-200 interactions)

**What Happens:**
- AI selects exercise types based on user weaknesses
- Rescue techniques rotate on repeated failures
- Tips generated dynamically from performance data
- Interleaving begins (review items mixed in)

**Signals Consumed (from LearnerProfiler):**
| Signal | Source | Action |
|--------|--------|--------|
| `pronunciation_weak_phonemes[]` | PhoneticScorer | More shadowing/minimal pairs for those phonemes |
| `confusion_pairs[]` | Word-order telemetry | Targeted drills on confused words |
| `avg_response_latency` | All exercises | Simpler prompts if latency high |
| `repeated_fail_words[]` | StuckWordsService | Trigger rescue technique |

**Rescue Technique Rotation (on 3rd fail of same word):**

| Attempt | Technique | Implementation | Source |
|---------|-----------|----------------|--------|
| 3 | Keyword Mnemonic | English word sounds like Portuguese | 43 |
| 4 | Minimal Pair Drill | Compare with similar-sounding word | 32 |
| 5 | Memory Palace | Associate with physical location | 42 |
| 6 | Input Flood | Multiple sentences with target word | 44 |
| 7 | Image Association | Strong visual connection | 47 |

**Implementation (Files: `StuckWordsService.js`, `AITipGenerator.js`):**
```javascript
function selectRescueTechnique(wordId, failCount) {
  const techniques = ['keyword_mnemonic', 'minimal_pair', 'memory_palace', 'input_flood', 'image_association'];
  const index = (failCount - 3) % techniques.length;
  return techniques[index];
}
```

**Definition of Done:**
- [ ] AIAgent detects 50+ interactions
- [ ] Consumes LearnerProfiler signals
- [ ] Exercise mix changes based on weaknesses
- [ ] StuckWordsService triggers rescue at 3rd fail
- [ ] Different technique each subsequent fail
- [ ] Rescue events logged
- [ ] Unit tests for technique rotation

---

### Phase 3: Portfolio-Based (200+ interactions)

**What Happens:**
- Full adaptive generation including FSRS scheduling
- Custom mini-lessons generated for persistent weak areas
- User can save/discard generated lessons
- Review ratio determined by spaced repetition algorithm

**Features:**
- FSRS next-interval determines review ratio (10-30%)
- Weakness analysis across all exercise types
- Custom lesson generation with user approval flow
- Performance predictions for upcoming items

**FSRS Integration (Files: `FSRSEngine.js`, `AIAgent.js`):**
```javascript
function calculateReviewRatio(userId) {
  const dueItems = FSRSEngine.getDueItems(userId);
  const totalItems = FSRSEngine.getTotalItems(userId);
  
  // Review 10-30% based on due items
  const ratio = Math.min(0.30, Math.max(0.10, dueItems.length / totalItems));
  return ratio;
}
```

**Definition of Done:**
- [ ] AIAgent detects 200+ interactions
- [ ] FSRS scheduling determines review items
- [ ] Custom lesson generation works
- [ ] Save/discard flow implemented
- [ ] Telemetry includes FSRS intervals
- [ ] Integration test for full adaptive path

---

### AI Tips Integration

**Source Signals (from AITipGenerator + reference data):**
- Pronunciation scores → pronunciation tips using `phonemes.js`
- Confusion pairs → grammar tips using `grammar-patterns.js`
- Response latency → retrieval practice tips
- Hint usage → memory tips using `mnemonic-patterns.js`
- Repeated failures → motivation tips (Source 48)

**Tip Delivery Rules:**
1. Tips rotate - no repeats within session
2. Maximum 2 tips per exercise
3. Always include encouragement when accuracy < 70%
4. Tips must be GENERATED, never hardcoded text
5. Reference user's specific weak phonemes/words

**Implementation (Files: `AITipGenerator.js`):**
```javascript
function generateTips(userId, exerciseResult, lessonContext) {
  const tips = [];
  const profile = LearnerProfiler.getProfile(userId);
  
  // Pronunciation tip if score < 80%
  if (exerciseResult.pronunciationScore < 0.80) {
    const weakPhoneme = profile.weakestPhoneme;
    tips.push(generatePronunciationTip(weakPhoneme)); // Uses phonemes.js
  }
  
  // Encouragement if struggling
  if (profile.recentAccuracy < 0.70) {
    tips.push(generateEncouragementTip(profile)); // Never hardcoded
  }
  
  return tips.slice(0, 2); // Max 2 tips
}
```

**Definition of Done:**
- [ ] Tips generated from user data (not hardcoded)
- [ ] Uses reference material (phonemes.js, grammar-patterns.js, etc.)
- [ ] Rotates tips within session
- [ ] Max 2 tips per exercise enforced
- [ ] Encouragement at < 70% accuracy
- [ ] Telemetry includes tip IDs shown

---

## Telemetry Requirements

### Required Events

Every user interaction MUST emit events. Missing telemetry = broken feature.

| Event | Required Fields | Storage Key | Source |
|-------|-----------------|-------------|--------|
| `answer_attempt` | wordId, lessonId, correctness, responseTime, hintUsed, attemptNumber, exerciseType | `${userId}_events` | 57 |
| `pronunciation_score` | wordId, overallScore, phonemeBreakdown[], timestamp | `${userId}_pronunciation` | 38 |
| `lesson_complete` | lessonId, duration, accuracy, exerciseTypesUsed[], rescueLessonsTriggered | `${userId}_lessons` | 57 |
| `word_skipped` | wordId, reason (timeout/manual), exerciseType | `${userId}_skips` | 57 |
| `ai_tip_shown` | tipId, category, triggerSignal, userId | `${userId}_tips` | 57 |
| `stuck_word_rescue` | wordId, technique, attemptNumber, wasSuccessful | `${userId}_rescues` | 57 |
| `exercise_interaction` | exerciseType, interactionType (click/type/drag), timestamp | `${userId}_interactions` | 57 |

### Implementation Pattern

**EVERY exercise must include this pattern:**

```javascript
// src/components/lesson/ChallengeRenderer.js
import { Logger } from '../../services/Logger.js';
import { EventStreaming } from '../../services/eventStreaming.js';

function onExerciseSubmit(result) {
  const userId = AuthService.getCurrentUser()?.id;
  if (!userId) throw new Error('No user ID - telemetry would fail');
  
  // 1. Log locally
  Logger.info('answer_attempt', {
    userId,
    wordId: currentWord.id,
    lessonId: currentLesson.id,
    correctness: result.correct,
    responseTime: result.duration,
    hintUsed: result.hintUsed,
    attemptNumber: result.attempt,
    exerciseType: currentExercise.type
  });
  
  // 2. Stream to AI pipeline
  EventStreaming.emit('learning_event', {
    eventType: 'answer_attempt',
    userId,
    timestamp: Date.now(),
    ...result
  });
}
```

### Per-User Isolation

**All storage keys MUST be prefixed with `${userId}_`**

```javascript
// CORRECT
localStorage.setItem(`${userId}_progress`, JSON.stringify(data));

// WRONG - will mix user data
localStorage.setItem('progress', JSON.stringify(data));
```

**Enforcement (checked in code review and tests):**
- [ ] All localStorage keys use `${userId}_` prefix
- [ ] No global keys for user-specific data
- [ ] ProgressTracker.setCurrentUser() called before any storage
- [ ] Unit tests verify isolation

---

## MCP Playwright Validation Scenarios

**URL:** http://localhost:63436

**Tools Required:**
- `mcp_playwright_browser_navigate` - Go to URL
- `mcp_playwright_browser_click` - Click elements
- `mcp_playwright_browser_type` - Type into inputs
- `mcp_playwright_browser_take_screenshot` - Capture evidence
- `mcp_playwright_browser_evaluate` - Extract data (URLs, etc.)
- `mcp_playwright_browser_snapshot` - Accessibility tree

**FAILURE POLICY:** Any scenario failure blocks task completion. Fix → rerun → repeat until ALL pass.

### Scenario 1: App Load & Render

**Steps:**
1. `mcp_playwright_browser_navigate` to http://localhost:63436
2. `mcp_playwright_browser_snapshot` to verify page structure
3. `mcp_playwright_browser_take_screenshot` filename: `app-load.png`

**Pass Criteria:**
- Page renders without errors
- Main navigation visible
- No console errors (check via `mcp_playwright_browser_console_messages`)

**Evidence Required:**
- Screenshot path: `test-results/app-load.png`
- Console error count: 0

---

### Scenario 2: Lesson Smoke (Word Order → Cloze → Picture)

**Steps:**
1. Navigate to lessons grid
2. `mcp_playwright_browser_snapshot` - verify English titles visible
3. `mcp_playwright_browser_click` on first lesson card
4. Verify first screen is EXERCISE (not word list)
5. Complete word-order exercise (click tiles in order)
6. Submit and verify feedback
7. Complete cloze exercise (type missing word)
8. Submit and verify feedback
9. Complete picture flashcard (click correct image)
10. `mcp_playwright_browser_take_screenshot` at each step
11. `mcp_playwright_browser_evaluate` to extract image URLs

**Pass Criteria:**
- English titles + sublines visible on grid
- First screen is active exercise (not word list)
- Word-order tiles render with distractors
- Cloze blank visible in sentence
- Picture options include correct + distractors
- All images have valid URLs (not placeholders)

**Evidence Required:**
- Screenshots: `lesson-grid.png`, `word-order.png`, `cloze.png`, `picture.png`
- Image URLs extracted and logged
- Telemetry events verified via evaluate

---

### Scenario 3: Image Typing (pastel → pastry)

**Steps:**
1. Navigate to image-typing lesson
2. `mcp_playwright_browser_snapshot` - verify image present
3. `mcp_playwright_browser_evaluate` - extract image URL
4. Verify image is subject-matched (NOT gradient/abstract)
5. `mcp_playwright_browser_type` translation into input
6. Submit and verify feedback
7. `mcp_playwright_browser_take_screenshot`

**Pass Criteria:**
- Image displays BEFORE input field
- No word list screen preceded this
- Image URL contains relevant subject keywords
- Input accepts accented characters
- Feedback appears on submit

**Evidence Required:**
- Screenshot: `image-typing.png`
- Image URL logged (must be food-related for pastel)
- Verify no word-list DOM element exists

---

### Scenario 4: Numbers with Finger Image

**Steps:**
1. Navigate to number comprehension lesson
2. `mcp_playwright_browser_click` play audio button
3. `mcp_playwright_browser_snapshot` - verify finger image
4. `mcp_playwright_browser_type` numeric answer
5. Submit and verify feedback
6. `mcp_playwright_browser_take_screenshot`

**Pass Criteria:**
- Audio plays (check via evaluate for audio element state)
- Finger image visible (for 1-10) or digit display (11+)
- Numeric input accepts only digits
- Feedback shows correct/incorrect

**Evidence Required:**
- Screenshot: `number-finger.png`
- Audio element `currentTime > 0` (was played)
- Finger image URL logged

---

### Scenario 5: Voice Dictation with Speed Control

**Steps:**
1. Navigate to dictation lesson
2. `mcp_playwright_browser_click` play audio
3. `mcp_playwright_browser_click` speed slider (drag to 0.75x)
4. `mcp_playwright_browser_evaluate` - verify slider value changed
5. `mcp_playwright_browser_type` transcript
6. Submit and verify WER score
7. `mcp_playwright_browser_take_screenshot`

**Pass Criteria:**
- Audio plays on button click
- Speed slider moves and affects playback
- Slider value persists after drag
- WER score displayed on submit

**Evidence Required:**
- Screenshot: `dictation-speed.png`
- Slider value logged (should be < 1.0)
- Audio playbackRate logged

---

### Scenario 6: Adaptive Path Verification

**Steps:**
1. Clear localStorage for test user
2. Seed profile with specific weaknesses:
   - Low pronunciation score for /ão/ phoneme
   - 3 failures on word "pão"
3. Navigate to lesson
4. `mcp_playwright_browser_snapshot` - verify exercise selection
5. Expect: minimal pair exercise for /ão/ OR rescue technique for "pão"
6. `mcp_playwright_browser_take_screenshot`
7. Compare to new user (different exercise mix)

**Pass Criteria:**
- Seeded profile loads correctly
- Exercise mix differs from default
- Weak phoneme addressed in exercise selection
- Rescue technique triggered for stuck word

**Evidence Required:**
- Screenshot: `adaptive-seeded.png`, `adaptive-new.png`
- Exercise type IDs logged for both profiles
- Verification that they differ

---

### Scenario 7: English Titles & Sublines

**Steps:**
1. Navigate to lessons grid
2. `mcp_playwright_browser_snapshot` - capture all lesson cards
3. For each card, verify:
   - Title text is in English
   - Subline description exists and is English
4. `mcp_playwright_browser_take_screenshot`

**Pass Criteria:**
- Every lesson card has English title (no Portuguese-only titles)
- Every card has descriptive subline
- No empty titles or sublines

**Evidence Required:**
- Screenshot: `titles-sublines.png`
- List of all titles extracted via evaluate

---

### Scenario 8: Practice-First Verification

**Steps:**
1. Navigate to any lesson
2. `mcp_playwright_browser_snapshot` on first screen
3. Verify DOM contains exercise elements (input, buttons, tiles)
4. Verify DOM does NOT contain word-list element
5. `mcp_playwright_browser_take_screenshot`

**Pass Criteria:**
- First visible screen is an active exercise
- No "word list" or "vocabulary preview" screen
- User can interact immediately

**Evidence Required:**
- Screenshot: `practice-first.png`
- DOM query results: exercise elements present, word-list absent

---

## Execution Tasks

### Track 1: Lesson Architecture Rebuild

| Task ID | Task | Files to Change | Definition of Done | Sources |
|---------|------|-----------------|-------------------|---------|
| LA-001 | Remove word-list-first screens | `ChallengeRenderer.js`, `src/data/lessons/*.js` | First screen is exercise; no word list DOM element exists; Playwright Scenario 8 passes | 1, 2 |
| LA-002 | Add English titles to all lessons | `LessonCard.js`, lesson metadata in `src/data/lessons/*.js` | Every card shows English title; no Portuguese-only titles; Playwright Scenario 7 passes | 2, 30 |
| LA-003 | Add subline descriptions | `LessonCard.js`, lesson metadata | Every card has descriptive subline under title; Scenario 7 passes | 2, 30 |
| LA-004 | Implement fundamentals gate (80%) | `ProgressTracker.js`, `LessonService.js` | Lessons locked until prereq ≥80%; UI shows lock icon + requirement; unit test confirms | 17, 21, 30 |
| LA-005 | Reorder lessons by tier | `src/data/lessons/*.js`, metadata | Building Blocks → Essential → Daily; unit test confirms order | 17, 21, 30 |
| LA-006 | Implement word-order builder | `ChallengeRenderer.js` | Full Type 1 DoD met; Playwright Scenario 2 passes | 1, 2, 24, 52 |
| LA-007 | Implement sentence builder with distractors | `ChallengeRenderer.js` | Full Type 2 DoD met | 1, 14, 52 |
| LA-008 | Implement cloze translation | `ChallengeRenderer.js` | Full Type 3 DoD met; Scenario 2 passes | 1, 14, 23 |
| LA-009 | Implement picture flashcard | `LessonCard.js`, assets | Full Type 4 DoD met; Scenario 2 passes | 1, 4, 15, 47 |
| LA-010 | Implement image→type (pastel) | `ChallengeRenderer.js`, assets | Full Type 5 DoD met; Scenario 3 passes | 4, 7, 8 |
| LA-011 | Implement audio→type dictation | `ChallengeRenderer.js`, `VoiceService.js` | Full Type 6 DoD met; Scenario 5 passes | 5, 38, 39 |
| LA-012 | Implement audio→pick MCQ | `ChallengeRenderer.js` | Full Type 7 DoD met | 1, 52 |
| LA-013 | Implement minimal pair picker | `PronunciationService.js`, `ChallengeRenderer.js` | Full Type 8 DoD met | 32, 38, 50 |
| LA-014 | Implement word-image match grid | `ChallengeRenderer.js`, assets | Full Type 9 DoD met | 1, 4, 8 |
| LA-015 | Implement grammar transform | `ChallengeRenderer.js`, `grammar-patterns.js` | Full Type 10 DoD met | 20, 24, 49 |
| LA-016 | Implement dialogue reorder | `ChallengeRenderer.js`, audio assets | Full Type 11 DoD met | 9, 29 |
| LA-017 | Implement pronunciation shadowing | `PronunciationService.js`, `PhoneticScorer.js` | Full Type 12 DoD met | 16, 35, 50 |
| LA-018 | Implement number comprehension | `ChallengeRenderer.js`, number assets | Full Type 13 DoD met; Scenario 4 passes | 40, 59, 60 |
| LA-019 | Implement rapid recall | `ChallengeRenderer.js`, timer utility | Full Type 14 DoD met | 23, 27, 51 |
| LA-020 | Implement multi-modal dual coding | `ChallengeRenderer.js`, assets | Full Type 15 DoD met | 25, 26, 47 |
| LA-021 | Asset preload system | Asset pipeline, `LessonCard.js` | All images preloaded before render; alt text required; failing assets block build | 4, 15, 47 |

### Track 2: AI Adaptation

| Task ID | Task | Files to Change | Definition of Done | Sources |
|---------|------|-----------------|-------------------|---------|
| AI-001 | Phase 1 static seed generation | `AIAgent.js` | < 50 interactions uses templates; no profiler signals consumed; unit test confirms | 17, 37 |
| AI-002 | Phase 2 adaptive selection | `AIAgent.js`, `LearnerProfiler.js` | 50+ interactions uses profiler; exercise mix changes based on weaknesses; Scenario 6 passes | 19, 21, 37 |
| AI-003 | Phase 3 portfolio-based | `AIAgent.js`, `FSRSEngine.js` | 200+ interactions uses FSRS; custom lesson generation works | 22, 37 |
| AI-004 | Rescue technique rotation | `StuckWordsService.js` | Different technique on each fail (3rd+); logged to telemetry; unit test confirms rotation | 7, 32, 42, 43, 44, 47 |
| AI-005 | Dynamic AI tips from performance | `AITipGenerator.js`, reference data | Tips generated (not hardcoded); uses phonemes.js, grammar-patterns.js; rotates in session | 48, 36 |
| AI-006 | FSRS integration for review | `FSRSEngine.js`, `AIAgent.js` | 10-30% review items interleaved; FSRS intervals respected | 22, 24 |
| AI-007 | Encouragement tips at < 70% | `AITipGenerator.js` | Motivation tip generated when accuracy < 70%; never hardcoded | 18, 48 |

### Track 3: Telemetry

| Task ID | Task | Files to Change | Definition of Done | Sources |
|---------|------|-----------------|-------------------|---------|
| TM-001 | User-prefixed storage keys | All services using localStorage | All keys use `${userId}_` prefix; unit test checks all storage calls | 56 |
| TM-002 | Implement all required events | `Logger.js`, `eventStreaming.js`, `ChallengeRenderer.js` | All 7 event types (see table) emitted; payloads validated | 57 |
| TM-003 | Event payload validation | Unit tests | Payloads match schema; missing fields throw error | 57 |
| TM-004 | Isolation verification | Integration tests | Two users in same browser have separate data; no cross-contamination | 56 |

### Track 4: Testing & Validation

| Task ID | Task | Files to Change | Definition of Done | Sources |
|---------|------|-----------------|-------------------|---------|
| TV-001 | MCP Playwright Scenario 1 (App Load) | tests/e2e/*, docs | Scenario passes with screenshot evidence | - |
| TV-002 | MCP Playwright Scenario 2 (Lesson Smoke) | tests/e2e/* | All 4 screenshots captured; image URLs logged; telemetry verified | 1, 4 |
| TV-003 | MCP Playwright Scenario 3 (Image Typing) | tests/e2e/* | Image URL is subject-matched; no word-list screen | 4, 7, 8 |
| TV-004 | MCP Playwright Scenario 4 (Numbers) | tests/e2e/* | Finger image visible; audio plays; numeric input works | 40, 59, 60 |
| TV-005 | MCP Playwright Scenario 5 (Dictation) | tests/e2e/* | Speed slider affects playback; WER score shown | 38, 39 |
| TV-006 | MCP Playwright Scenario 6 (Adaptive) | tests/e2e/* | Seeded profile produces different exercises than new profile | 37 |
| TV-007 | MCP Playwright Scenario 7 (Titles) | tests/e2e/* | All English titles + sublines visible | - |
| TV-008 | MCP Playwright Scenario 8 (Practice-First) | tests/e2e/* | First screen is exercise; no word-list DOM | 2 |
| TV-009 | Unit tests for exercise types | tests/unit/* | Each of 15 types has unit test coverage | - |
| TV-010 | Integration tests for AI pipeline | tests/integration/* | AIAgent → LearnerProfiler → StuckWordsService flow tested | - |

### Track 5: LLM Interchangeability

| Task ID | Task | Files to Change | Definition of Done | Sources |
|---------|------|-----------------|-------------------|---------|
| LM-001 | Model registry implementation | `src/config/models.config.js`, `AIAgent.js` | Registry schema implemented; multiple models defined | 55 |
| LM-002 | Model selection from config | `AIAgent.js` | Config change switches model at runtime; no code change needed | 55 |
| LM-003 | Fallback to local on failure | `AIAgent.js` | Remote model failure falls back to Ollama; logged | 55 |
| LM-004 | Model logging per turn | `AIAgent.js` | Every AI response logs model ID used | 55 |
| LM-005 | Context capping per model | `AIAgent.js` | Context length respects model metadata; truncation if needed | 55 |
| LM-006 | Provider-agnostic prompts | All prompts | No provider-specific tokens; strip formatting before send | 55 |

---

## Definitions of Done (Per Track)

### Track 1: Lesson Architecture - Complete When:

- [ ] **No word-list-first screens anywhere** - Every lesson opens with active exercise
- [ ] **All 15 exercise types implemented** - Each meets its type-specific DoD
- [ ] **English titles on all lessons** - No Portuguese-only titles visible
- [ ] **Subline descriptions on all lessons** - Every card has explanation
- [ ] **Fundamentals gate enforced** - 80% accuracy required to unlock next tier
- [ ] **Lessons ordered by tier** - Building Blocks → Essential → Daily
- [ ] **All assets preloaded** - No lazy-load failures; alt text present
- [ ] **Distractors in relevant exercises** - Minimum 2 foils where specified
- [ ] **Playwright Scenarios 2, 3, 4, 7, 8 pass** - With screenshot evidence

### Track 2: AI Adaptation - Complete When:

- [ ] **Phase 1 works** - < 50 interactions uses templates only
- [ ] **Phase 2 works** - 50+ interactions adapts to weaknesses
- [ ] **Phase 3 works** - 200+ interactions uses FSRS scheduling
- [ ] **Rescue techniques rotate** - Different technique each fail (3rd+)
- [ ] **AI tips are generated** - Never hardcoded; uses reference material
- [ ] **Tips rotate in session** - No repeats within same session
- [ ] **Encouragement at < 70%** - Motivation tip generated automatically
- [ ] **Playwright Scenario 6 passes** - Adaptive path verified

### Track 3: Telemetry - Complete When:

- [ ] **All 7 event types emitted** - See required events table
- [ ] **All events have correct payloads** - Validated by unit tests
- [ ] **User isolation verified** - No cross-user data leakage
- [ ] **All storage keys prefixed** - `${userId}_` on everything
- [ ] **Rescue events logged** - technique + attempt + success captured

### Track 4: Testing - Complete When:

- [ ] **All 8 MCP Playwright scenarios pass** - With screenshot evidence
- [ ] **Screenshots stored in test-results/** - Named per scenario
- [ ] **Asset URLs logged** - Image URLs captured via evaluate
- [ ] **Unit tests green** - For all 15 exercise types
- [ ] **Integration tests green** - For AI pipeline
- [ ] **Lint clean** - `npm run lint` passes
- [ ] **Full suite passes** - `npm test` before merge

### Track 5: LLM Interchangeability - Complete When:

- [ ] **Model registry exists** - Multiple models defined in config
- [ ] **Config switch works** - Model changes without code changes
- [ ] **Fallback works** - Remote failure → local Ollama
- [ ] **Model logged per turn** - Every response identifies model used
- [ ] **Context capped** - Truncation per model metadata
- [ ] **Prompts are agnostic** - No provider-specific formatting

---

## LLM Interchangeability

### Model Registry Schema

```javascript
// src/config/models.config.js
export const MODEL_REGISTRY = {
  'ollama-qwen': {
    provider: 'ollama',
    modelId: 'qwen2.5:latest',
    endpoint: 'http://localhost:11434',
    contextLimit: 8192,
    costWeight: 0,        // Free (local)
    latencyWeight: 1,     // Fast (local)
    capabilities: ['chat', 'tool_use']
  },
  'ollama-llama': {
    provider: 'ollama',
    modelId: 'llama3.2:latest',
    endpoint: 'http://localhost:11434',
    contextLimit: 8192,
    costWeight: 0,
    latencyWeight: 1,
    capabilities: ['chat']
  },
  'openai-gpt4': {
    provider: 'openai',
    modelId: 'gpt-4-turbo',
    endpoint: 'https://api.openai.com/v1',
    contextLimit: 128000,
    costWeight: 10,       // Expensive
    latencyWeight: 5,     // Network latency
    capabilities: ['chat', 'tool_use', 'vision']
  },
  'anthropic-claude': {
    provider: 'anthropic',
    modelId: 'claude-3-sonnet',
    endpoint: 'https://api.anthropic.com/v1',
    contextLimit: 200000,
    costWeight: 8,
    latencyWeight: 5,
    capabilities: ['chat', 'tool_use']
  }
};

export const DEFAULT_MODEL = 'ollama-qwen';
export const FALLBACK_MODEL = 'ollama-qwen'; // Always local
```

### Model Selection Logic

```javascript
// src/services/ai/AIAgent.js
async function selectModel(config) {
  const preferred = config.modelPreference || DEFAULT_MODEL;
  const model = MODEL_REGISTRY[preferred];
  
  if (!model) {
    Logger.warn('model_not_found', { requested: preferred, fallback: FALLBACK_MODEL });
    return MODEL_REGISTRY[FALLBACK_MODEL];
  }
  
  // Test connectivity for remote models
  if (model.provider !== 'ollama') {
    const available = await testRemoteModel(model);
    if (!available) {
      Logger.warn('remote_model_unavailable', { model: preferred, fallback: FALLBACK_MODEL });
      return MODEL_REGISTRY[FALLBACK_MODEL];
    }
  }
  
  // Test Ollama availability
  if (model.provider === 'ollama') {
    const available = await checkOllamaAvailable(model.endpoint);
    if (!available) {
      Logger.error('ollama_unavailable', { endpoint: model.endpoint });
      throw new Error('Local Ollama unavailable and no remote fallback');
    }
  }
  
  return model;
}
```

### Prompt Guardrails

```javascript
// Before sending to any model
function sanitizePrompt(prompt, model) {
  // Strip provider-specific tokens
  let clean = prompt
    .replace(/\[INST\]/g, '')      // Llama format
    .replace(/\[\/INST\]/g, '')
    .replace(/<\|im_start\|>/g, '') // ChatML format
    .replace(/<\|im_end\|>/g, '');
  
  // Cap context length
  if (clean.length > model.contextLimit * 4) { // ~4 chars per token estimate
    Logger.warn('context_truncated', { 
      original: clean.length, 
      limit: model.contextLimit 
    });
    clean = truncateContext(clean, model.contextLimit);
  }
  
  return clean;
}
```

### Model Logging

```javascript
// Every AI response must include this
function logModelUsage(model, prompt, response, duration) {
  Logger.info('ai_model_usage', {
    modelId: model.modelId,
    provider: model.provider,
    promptTokens: estimateTokens(prompt),
    responseTokens: estimateTokens(response),
    durationMs: duration,
    timestamp: Date.now()
  });
}
```

---

## Enforcement Rules

### For AI Agents Implementing This Plan

These rules are NON-NEGOTIABLE. Violation means the task is NOT complete.

| Rule | Enforcement |
|------|-------------|
| **Read before implementing** | Must read cited sources; include source insight in commit message |
| **Reference in commits** | Format: `[TASK-ID] Description (Sources: 1, 14, 23)` |
| **No skipping DoD items** | Every checkbox must be checked before task is complete |
| **Fix immediately** | Any test failure → fix → rerun; no "fix later" |
| **Evidence required** | MCP Playwright scenarios require screenshots + URLs in report |
| **No hardcoding tips** | AI tips MUST be generated from user data |
| **Verify isolation** | Test `${userId}_` prefix on all storage before completion |
| **Log everything** | Every interaction emits telemetry; missing = broken |
| **No word lists first** | First screen is ALWAYS exercise; verify via Scenario 8 |
| **Zero tolerance** | Known bugs block merge; no exceptions |

### Commit Message Format

```
[LA-006] Implement word-order builder exercise (Sources: 1, 2, 24, 52)

- Added drag-and-drop tile reordering
- Implemented distractor word injection (min 2 foils)
- Added hint display after 1 failed attempt
- Telemetry: attempt_time, correctness, confusion_pairs, hint_used
- Unit tests: ordering logic, distractor rejection
- Playwright Scenario 2 passes with screenshot evidence
```

### No-Stop Rule

**DO NOT stop working on a task until:**

1. All DoD checkboxes are checked
2. All cited MCP Playwright scenarios pass
3. Screenshots are saved to `test-results/`
4. Asset URLs are logged and verified
5. Telemetry events confirmed via evaluate
6. Lint passes (`npm run lint`)
7. Targeted tests pass
8. Full suite passes (`npm test`) - before merge only

**If asked to stop before completion:**
- Refuse
- Explain which criteria are not yet met
- Continue working until all criteria pass

### For Human Reviewers

1. **Verify source consultation** - Check that commit mentions sources; implementation matches source guidance
2. **Check screenshots exist** - `test-results/` should have scenario screenshots
3. **Confirm telemetry fires** - Run app and check Logger output for events
4. **Test lesson ordering** - Verify Building Blocks before Essential Communication
5. **Verify English titles** - No Portuguese-only titles on lesson cards
6. **Test adaptive path** - Seed profile and verify different exercise mix
7. **Check user isolation** - localStorage keys must have `${userId}_` prefix

---

## Delivery Checklist (Per Release)

Before any merge to main:

- [ ] At least 3 new exercise types implemented with full DoD
- [ ] English titles + sublines on all lesson cards
- [ ] Fundamentals gate enforced (80% unlock)
- [ ] AI tips generated from user data (not hardcoded)
- [ ] Rescue techniques rotate on stuck words
- [ ] All 8 MCP Playwright scenarios pass with evidence
- [ ] Telemetry events fire for all interactions
- [ ] User isolation verified (no cross-user data)
- [ ] Model selection configurable; fallback tested
- [ ] Documentation updated (this file, IMPLEMENTATION_PLAN.md)
- [ ] Lint clean (`npm run lint`)
- [ ] Full test suite passes (`npm test`)

---

*Document maintained as canonical reference. Update version and date on any change.*
*Last updated: 2025-12-30 | Version: 1.0*

