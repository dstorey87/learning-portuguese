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
9. [Agentic Workflow (For AI Agents)](#agentic-workflow-for-ai-agents--github-copilot)
10. [Execution Tasks](#execution-tasks)
11. [Definitions of Done (Per Track)](#definitions-of-done-per-track)
12. [LLM Interchangeability](#llm-interchangeability)
13. [Enforcement Rules](#enforcement-rules)

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

## Agentic Workflow (For AI Agents / GitHub Copilot)

This section provides explicit step-by-step instructions for AI agents to autonomously execute tasks from this plan.

### Task Execution Protocol

**For EVERY task in this document, follow this exact sequence:**

```
┌─────────────────────────────────────────────────────────────────┐
│  AGENTIC TASK EXECUTION FLOW                                    │
│                                                                 │
│  1. CREATE BRANCH                                               │
│     git checkout main && git pull origin main                   │
│     git checkout -b feature/<TASK-ID>-<short-description>       │
│                                                                 │
│  2. READ SOURCES                                                │
│     For each source number in task → read the URL               │
│     Extract key implementation insight                          │
│                                                                 │
│  3. IMPLEMENT                                                   │
│     Edit files listed in "Files to Change"                      │
│     Follow the Exercise Type DoD checkboxes                     │
│                                                                 │
│  4. TEST (targeted)                                             │
│     npx playwright test tests/e2e/<relevant>.e2e.test.js        │
│     npx playwright test tests/unit/<relevant>.test.js           │
│                                                                 │
│  5. MCP PLAYWRIGHT VALIDATE                                     │
│     mcp_playwright_browser_navigate → page                      │
│     mcp_playwright_browser_snapshot → verify structure          │
│     mcp_playwright_browser_click → test interactions            │
│     mcp_playwright_browser_take_screenshot → evidence           │
│     mcp_playwright_browser_evaluate → extract data              │
│                                                                 │
│  6. FIX LOOP (if failures)                                      │
│     Fix issue → rerun tests → revalidate with MCP               │
│     REPEAT until ALL pass                                       │
│                                                                 │
│  7. LINT                                                        │
│     npm run lint                                                │
│                                                                 │
│  8. COMMIT                                                      │
│     git add <files>                                             │
│     git commit -m "[TASK-ID] Description (Sources: X, Y, Z)"    │
│                                                                 │
│  9. PUSH & MERGE                                                │
│     git push -u origin feature/<TASK-ID>-<desc>                 │
│     git checkout main && git pull && git merge <branch>         │
│     git push origin main                                        │
│     git branch -d <branch>                                      │
│                                                                 │
│  10. REPORT                                                     │
│      Include: screenshot paths, test results, telemetry proof   │
│                                                                 │
│  11. ARCHIVE COMPLETED TASK                                     │
│      CUT the full task spec from this document                  │
│      PASTE into docs/COMPLETED_FEATURES.md (correct Track)      │
│      ADD completion metadata (date, commit hash)                │
│      UPDATE statistics table in COMPLETED_FEATURES.md           │
│      COMMIT both files: "[TASK-ID] Archive to COMPLETED"        │
└─────────────────────────────────────────────────────────────────┘
```

### Task Archiving Rule (MANDATORY)

**WHY:** This document must stay small enough for AI agent context windows (~8k-32k tokens). Moving completed tasks to the archive keeps the working document focused on remaining work.

**WHEN:** Immediately after merge to main, BEFORE starting next task.

**HOW:**
1. Open `docs/COMPLETED_FEATURES.md`
2. Find the correct Track section (LA/AI/TM/TV/LM)
3. Cut the ENTIRE task specification from this document
4. Paste into the archive with completion metadata:
   ```markdown
   ### [TASK-ID] - Task Name
   
   **Completed:** YYYY-MM-DD | **Commit:** [hash]
   ...full task spec...
   ```
5. Update the Statistics table at the bottom of COMPLETED_FEATURES.md
6. Commit BOTH files together:
   ```bash
   git add docs/AI_LESSON_VARIATION_PLAN.md docs/COMPLETED_FEATURES.md
   git commit -m "[TASK-ID] Archive completed task to COMPLETED_FEATURES.md"
   git push
   ```

**FAILURE TO ARCHIVE = INCOMPLETE TASK**

---

### Branch Naming Convention

| Task Type | Branch Format | Example |
|-----------|---------------|---------|
| Lesson Architecture | `feature/LA-XXX-<desc>` | `feature/LA-006-word-order-builder` |
| AI Adaptation | `feature/AI-XXX-<desc>` | `feature/AI-004-rescue-rotation` |
| Telemetry | `feature/TM-XXX-<desc>` | `feature/TM-002-event-emission` |
| Testing | `test/TV-XXX-<desc>` | `test/TV-002-lesson-smoke` |
| LLM | `feature/LM-XXX-<desc>` | `feature/LM-001-model-registry` |

### Commit Message Template

```
[TASK-ID] Brief description (Sources: X, Y, Z)

Implementation:
- What was added/changed
- Key decisions made

Testing:
- Unit tests: <file> - ✅ passed
- E2E tests: <file> - ✅ passed
- MCP Playwright: Scenario X - ✅ validated

Evidence:
- Screenshot: test-results/<task-id>.png
- Telemetry: <events verified>
```

### MCP Playwright Evidence Requirements

**Every task MUST include these in the final report:**

```markdown
## MCP Playwright Validation

**URL:** http://localhost:63436/<path>
**Tools Used:**
1. `mcp_playwright_browser_navigate` → [result]
2. `mcp_playwright_browser_snapshot` → [elements found]
3. `mcp_playwright_browser_click` → [interaction result]
4. `mcp_playwright_browser_take_screenshot` → test-results/<task-id>.png
5. `mcp_playwright_browser_evaluate` → [data extracted]

**Pass/Fail:** ✅ PASS | ❌ FAIL (with reason)
```

---

## Detailed Task Specifications (Agentic-Ready)

Below are fully specified tasks with everything an AI agent needs to execute autonomously.

---

### Task: LA-001 - Remove Word-List-First Screens

**Branch:** `feature/LA-001-remove-word-lists`

**Prerequisites:** None (PRIORITY - do this first)

**Files to Change:**
- `src/components/lesson/ChallengeRenderer.js` - Remove/skip word-list rendering
- `src/data/lessons/*.js` - Update lesson flow to start with exercise

**Implementation Steps:**
1. Identify any `renderWordList()` or similar function in ChallengeRenderer.js
2. Remove or comment out word-list rendering logic
3. Ensure `startLesson()` immediately renders first exercise
4. Update lesson data files to not include `wordList` as first step
5. Add CSS to hide any residual word-list elements

**Definition of Done Checklist:**
- [ ] No word-list screen appears before first exercise
- [ ] First screen is always an active exercise (input/click/drag)
- [ ] Lesson can still access word data internally (just not displayed first)
- [ ] Playwright Scenario 8 passes
- [ ] No DOM element with class containing "word-list" visible

**Test Commands:**
```bash
npx playwright test tests/e2e/lesson.e2e.test.js --grep "practice-first"
```

**MCP Playwright Validation:**
```
1. mcp_playwright_browser_navigate("http://localhost:63436/learn")
2. mcp_playwright_browser_click on any lesson card
3. mcp_playwright_browser_snapshot - capture first screen
4. mcp_playwright_browser_evaluate(() => {
     return document.querySelector('[class*="word-list"]') !== null;
   }) - must return false
5. mcp_playwright_browser_evaluate(() => {
     return document.querySelector('input, button[data-exercise], .tile') !== null;
   }) - must return true (exercise element exists)
6. mcp_playwright_browser_take_screenshot("test-results/LA-001-practice-first.png")
```

**Commit:**
```bash
git commit -m "[LA-001] Remove word-list-first screens (Sources: 1, 2)

Implementation:
- Removed renderWordList() from ChallengeRenderer.js
- Updated lesson flow to start with first exercise
- Practice-first pattern now enforced

Testing:
- E2E: lesson.e2e.test.js - ✅
- MCP Playwright: Scenario 8 - ✅

Evidence:
- Screenshot: test-results/LA-001-practice-first.png
- No word-list DOM elements found"
```

---

### Task: LA-002 - Add English Titles to All Lessons

**Branch:** `feature/LA-002-english-titles`

**Prerequisites:** None

**Files to Change:**
- `src/components/lesson/LessonCard.js` - Display English title prominently
- `src/data/lessons/*.js` - Add `titleEn` field to all lesson metadata

**Implementation Steps:**
1. Add `titleEn` field to every lesson object in data files
2. Update LessonCard.js to render `titleEn` as primary title
3. Optionally show Portuguese title as subtitle (smaller)
4. Ensure title is visible on grid view and detail view

**Definition of Done Checklist:**
- [ ] Every lesson has `titleEn` field in metadata
- [ ] LessonCard displays English title prominently
- [ ] No Portuguese-only titles visible on lesson grid
- [ ] Playwright Scenario 7 passes

**Test Commands:**
```bash
npx playwright test tests/e2e/lesson.e2e.test.js --grep "english-titles"
```

**MCP Playwright Validation:**
```
1. mcp_playwright_browser_navigate("http://localhost:63436/learn")
2. mcp_playwright_browser_snapshot - capture lesson grid
3. mcp_playwright_browser_evaluate(() => {
     const cards = document.querySelectorAll('.lesson-card');
     return Array.from(cards).map(c => c.querySelector('.title')?.textContent);
   }) - verify all titles are English
4. mcp_playwright_browser_take_screenshot("test-results/LA-002-english-titles.png")
```

**Commit:**
```bash
git commit -m "[LA-002] Add English titles to all lessons (Sources: 2, 30)

Implementation:
- Added titleEn field to all lesson metadata
- LessonCard now displays English title prominently
- Portuguese available as subtitle

Testing:
- MCP Playwright: Scenario 7 - ✅

Evidence:
- Screenshot: test-results/LA-002-english-titles.png"
```

---

### Task: LA-003 - Add Subline Descriptions

**Branch:** `feature/LA-003-subline-descriptions`

**Prerequisites:** LA-002 (English titles)

**Files to Change:**
- `src/components/lesson/LessonCard.js` - Add subline element
- `src/data/lessons/*.js` - Add `descriptionEn` field to all lessons

**Implementation Steps:**
1. Add `descriptionEn` field to every lesson object
2. Update LessonCard.js to render description under title
3. Style subline as smaller, muted text
4. Keep descriptions concise (max 10 words)

**Definition of Done Checklist:**
- [ ] Every lesson has `descriptionEn` field
- [ ] Subline visible under title on all cards
- [ ] Descriptions are in English
- [ ] Playwright Scenario 7 passes

**Test Commands:**
```bash
npx playwright test tests/e2e/lesson.e2e.test.js --grep "sublines"
```

**MCP Playwright Validation:**
```
1. mcp_playwright_browser_navigate("http://localhost:63436/learn")
2. mcp_playwright_browser_evaluate(() => {
     const cards = document.querySelectorAll('.lesson-card');
     return Array.from(cards).every(c => 
       c.querySelector('.subline, .description')?.textContent?.length > 0
     );
   }) - must return true
3. mcp_playwright_browser_take_screenshot("test-results/LA-003-sublines.png")
```

**Commit:**
```bash
git commit -m "[LA-003] Add subline descriptions to lessons (Sources: 2, 30)

Implementation:
- Added descriptionEn to all lesson metadata
- LessonCard displays subline under title
- Concise English descriptions

Testing:
- MCP Playwright: Scenario 7 - ✅

Evidence:
- Screenshot: test-results/LA-003-sublines.png"
```

---

### Task: LA-004 - Implement Fundamentals Gate (80%)

**Branch:** `feature/LA-004-fundamentals-gate`

**Prerequisites:** TM-001 (User-prefixed storage)

**Files to Change:**
- `src/services/ProgressTracker.js` - Add accuracy check for prerequisites
- `src/services/LessonService.js` - Implement unlock logic
- `src/components/lesson/LessonCard.js` - Show lock icon + requirement

**Implementation Steps:**
1. Add `prerequisites` array to lesson metadata (list of required lesson IDs)
2. Implement `canUnlockLesson(lessonId, userId)` in LessonService
3. Check if all prerequisites have ≥80% accuracy
4. Show lock icon on LessonCard if locked
5. Display "Complete X with 80% to unlock" message

**Definition of Done Checklist:**
- [ ] Lessons have `prerequisites` field in metadata
- [ ] `canUnlockLesson()` checks 80% threshold
- [ ] Locked lessons show lock icon
- [ ] Clicking locked lesson shows requirement message
- [ ] Unit test confirms gate logic
- [ ] Building Blocks lessons unlock first (no prereqs)

**Test Commands:**
```bash
npx playwright test tests/unit/lessonService.test.js --grep "gate"
npx playwright test tests/unit/progressTracker.test.js --grep "accuracy"
```

**MCP Playwright Validation:**
```
1. Clear user progress: mcp_playwright_browser_evaluate(() => localStorage.clear())
2. mcp_playwright_browser_navigate("http://localhost:63436/learn")
3. mcp_playwright_browser_snapshot - verify some lessons locked
4. mcp_playwright_browser_click on locked lesson
5. mcp_playwright_browser_snapshot - verify requirement message shown
6. mcp_playwright_browser_take_screenshot("test-results/LA-004-locked.png")
7. Seed 80% progress on prereq lesson
8. mcp_playwright_browser_navigate to refresh
9. Verify lesson now unlocked
10. mcp_playwright_browser_take_screenshot("test-results/LA-004-unlocked.png")
```

**Commit:**
```bash
git commit -m "[LA-004] Implement 80% fundamentals gate (Sources: 17, 21, 30)

Implementation:
- Added prerequisites field to lesson metadata
- canUnlockLesson() checks 80% accuracy threshold
- Lock icon + requirement message on locked lessons
- Building Blocks tier has no prerequisites

Testing:
- Unit tests: lessonService.test.js, progressTracker.test.js - ✅
- MCP Playwright: gate behavior verified - ✅

Evidence:
- Screenshots: test-results/LA-004-locked.png, LA-004-unlocked.png"
```

---

### Task: LA-005 - Reorder Lessons by Tier

**Branch:** `feature/LA-005-lesson-ordering`

**Prerequisites:** LA-004 (Fundamentals gate)

**Files to Change:**
- `src/data/lessons/*.js` - Add `tier` and `order` fields
- `src/services/LessonService.js` - Sort lessons by tier then order
- `src/data/index.js` - Update lesson export order

**Implementation Steps:**
1. Add `tier` field: 1 = Building Blocks, 2 = Essential, 3 = Daily Topics
2. Add `order` field for position within tier
3. Update `getAllLessons()` to sort by tier, then order
4. Verify Building Blocks appear first in UI

**Definition of Done Checklist:**
- [ ] All lessons have `tier` and `order` fields
- [ ] Lessons sorted: Building Blocks → Essential → Daily Topics
- [ ] Within each tier, lessons sorted by `order`
- [ ] Unit test confirms sort order

**Test Commands:**
```bash
npx playwright test tests/unit/lessonService.test.js --grep "order"
```

**MCP Playwright Validation:**
```
1. mcp_playwright_browser_navigate("http://localhost:63436/learn")
2. mcp_playwright_browser_evaluate(() => {
     const cards = document.querySelectorAll('.lesson-card');
     return Array.from(cards).map(c => c.dataset.tier);
   }) - verify order is [1,1,1,...,2,2,...,3,3,...]
3. mcp_playwright_browser_take_screenshot("test-results/LA-005-order.png")
```

**Commit:**
```bash
git commit -m "[LA-005] Reorder lessons by tier (Sources: 17, 21, 30)

Implementation:
- Added tier (1/2/3) and order fields to all lessons
- Building Blocks (1) → Essential (2) → Daily Topics (3)
- getAllLessons() sorts by tier then order

Testing:
- Unit tests: lessonService.test.js - ✅
- MCP Playwright: order verified - ✅

Evidence:
- Screenshot: test-results/LA-005-order.png"
```

---

### Task: LA-006 - Implement Word Order Builder

**Branch:** `feature/LA-006-word-order-builder`

**Prerequisites:** None (can start immediately)

**Files to Change:**
- `src/components/lesson/ChallengeRenderer.js` - Add word-order exercise type
- `src/data/lessons/*.js` - Add word-order challenges to lesson data

**Implementation Steps:**
1. Add `renderWordOrderExercise()` function to ChallengeRenderer.js
2. Implement drag-and-drop or click-to-place tile interaction
3. Add distractor word injection (minimum 2 foils per sentence)
4. Implement hint display after 1 failed attempt
5. Add telemetry: `attempt_time`, `correctness`, `confusion_pairs`, `hint_used`, `distractor_selected`
6. Create sample word-order exercises in lesson data files

**Definition of Done Checklist:**
- [ ] Renders word tiles in randomized order
- [ ] Includes ≥2 distractor words visually distinct
- [ ] Validates syntax and agreement on submit
- [ ] Shows hint after 1 fail (not immediately)
- [ ] Emits all telemetry events on submit
- [ ] Unit test covers ordering logic + distractor rejection
- [ ] Playwright screenshot confirms rendering
- [ ] No word-list screen precedes this exercise

**Test Commands:**
```bash
npx playwright test tests/unit/challengeRenderer.test.js --grep "word-order"
npx playwright test tests/e2e/lesson.e2e.test.js --grep "word-order"
```

**MCP Playwright Validation:**
```
1. mcp_playwright_browser_navigate("http://localhost:63436/learn")
2. mcp_playwright_browser_click on lesson with word-order exercise
3. mcp_playwright_browser_snapshot - verify tiles visible
4. mcp_playwright_browser_click on tiles in wrong order
5. Verify hint appears after failure
6. mcp_playwright_browser_click on tiles in correct order
7. mcp_playwright_browser_take_screenshot("test-results/LA-006-word-order.png")
8. mcp_playwright_browser_evaluate(() => window.telemetryEvents) - confirm events
```

**Commit:**
```bash
git add src/components/lesson/ChallengeRenderer.js src/data/lessons/
git commit -m "[LA-006] Implement word-order builder exercise (Sources: 1, 2, 24, 52)

Implementation:
- Added renderWordOrderExercise() with drag-and-drop tiles
- Implemented distractor injection (min 2 foils)
- Added hint after 1 failed attempt
- Telemetry: attempt_time, correctness, confusion_pairs, hint_used

Testing:
- Unit tests: challengeRenderer.test.js - ✅
- E2E tests: lesson.e2e.test.js - ✅
- MCP Playwright: Scenario 2 - ✅

Evidence:
- Screenshot: test-results/LA-006-word-order.png"
```

---

### Task: LA-007 - Implement Sentence Builder with Distractors

**Branch:** `feature/LA-007-sentence-builder`

**Prerequisites:** LA-006 (Word order builder - similar pattern)

**Files to Change:**
- `src/components/lesson/ChallengeRenderer.js` - Add sentence builder exercise
- `src/data/lessons/*.js` - Add sentence builder challenges

**Implementation Steps:**
1. Add `renderSentenceBuilderExercise()` function
2. Display target sentence in English
3. Show word bank with correct words + ≥2 distractors
4. Distractors should be plausible (same category)
5. Log wrong picks but allow exercise to continue
6. Validate final sentence matches target translation

**Definition of Done Checklist:**
- [ ] Word bank displays correct + distractor words
- [ ] Distractors are plausible (e.g., drinks category for café)
- [ ] Wrong picks logged but exercise continues
- [ ] Correct sentence validated on submit
- [ ] Telemetry: `wrong_token_picks`, `attempt_count`, `time_per_selection`

**Test Commands:**
```bash
npx playwright test tests/unit/challengeRenderer.test.js --grep "sentence-builder"
```

**MCP Playwright Validation:**
```
1. mcp_playwright_browser_navigate to sentence builder lesson
2. mcp_playwright_browser_snapshot - verify word bank visible
3. mcp_playwright_browser_click on wrong word (distractor)
4. mcp_playwright_browser_evaluate(() => window.wrongPicks) - verify logged
5. mcp_playwright_browser_click on correct words in order
6. mcp_playwright_browser_take_screenshot("test-results/LA-007-sentence-builder.png")
```

**Commit:**
```bash
git commit -m "[LA-007] Implement sentence builder with distractors (Sources: 1, 14, 52)

Implementation:
- Added renderSentenceBuilderExercise()
- Word bank includes correct words + plausible distractors
- Wrong picks logged for learning analytics
- Telemetry: wrong_token_picks, attempt_count, time_per_selection

Testing:
- Unit tests: challengeRenderer.test.js - ✅
- MCP Playwright: word bank verified - ✅

Evidence:
- Screenshot: test-results/LA-007-sentence-builder.png"
```

---

### Task: LA-008 - Implement Cloze Translation

**Branch:** `feature/LA-008-cloze-translation`

**Prerequisites:** None

**Files to Change:**
- `src/components/lesson/ChallengeRenderer.js` - Add cloze exercise
- `src/data/lessons/*.js` - Add cloze challenges

**Implementation Steps:**
1. Add `renderClozeExercise()` function
2. Display sentence with _____ blank
3. Support keyboard input OR word bank click (configurable)
4. Implement accent tolerance (accept "cafe" for "café", note if missing)
5. Categorize errors: `spelling_error` vs `lexical_error` vs `correct`
6. Show different feedback per error type

**Definition of Done Checklist:**
- [ ] Blank renders clearly in sentence
- [ ] Accepts keyboard input with accent tolerance
- [ ] Categorizes error type correctly
- [ ] Shows different feedback for spelling vs lexical errors
- [ ] Telemetry: `latency`, `error_type`, `attempts`, `accent_used`
- [ ] Playwright Scenario 2 passes

**Test Commands:**
```bash
npx playwright test tests/e2e/lesson.e2e.test.js --grep "cloze"
```

**MCP Playwright Validation:**
```
1. mcp_playwright_browser_navigate to cloze lesson
2. mcp_playwright_browser_snapshot - verify blank visible
3. mcp_playwright_browser_type("cafe") - without accent
4. mcp_playwright_browser_click submit
5. mcp_playwright_browser_snapshot - verify feedback mentions accent
6. mcp_playwright_browser_take_screenshot("test-results/LA-008-cloze.png")
```

**Commit:**
```bash
git commit -m "[LA-008] Implement cloze translation exercise (Sources: 1, 14, 23)

Implementation:
- Added renderClozeExercise() with blank in context
- Accent-tolerant input with feedback
- Error categorization: spelling vs lexical
- Telemetry: latency, error_type, attempts, accent_used

Testing:
- E2E: lesson.e2e.test.js - ✅
- MCP Playwright: Scenario 2 - ✅

Evidence:
- Screenshot: test-results/LA-008-cloze.png"
```

---

### Task: LA-009 - Implement Picture Flashcard

**Branch:** `feature/LA-009-picture-flashcard`

**Prerequisites:** LA-021 (Asset preload) recommended

**Files to Change:**
- `src/components/lesson/LessonCard.js` - Add picture flashcard view
- `src/components/lesson/ChallengeRenderer.js` - Add picture selection
- `assets/` folder - Add required images

**Implementation Steps:**
1. Add `renderPictureFlashcardExercise()` function
2. Display 3-6 images in grid
3. Play audio/show text of target word
4. User clicks matching image
5. All images must have alt text
6. Preload images before rendering

**Definition of Done Checklist:**
- [ ] 3+ images render in grid
- [ ] Images preloaded (no lazy-load failures)
- [ ] Alt text present on all images
- [ ] Correct selection triggers success feedback
- [ ] Wrong selection triggers try-again feedback
- [ ] Telemetry: `chosen_option`, `asset_load_success`, `time_to_select`
- [ ] Playwright Scenario 2 passes

**Test Commands:**
```bash
npx playwright test tests/e2e/lesson.e2e.test.js --grep "picture"
```

**MCP Playwright Validation:**
```
1. mcp_playwright_browser_navigate to picture flashcard lesson
2. mcp_playwright_browser_snapshot - verify images visible
3. mcp_playwright_browser_evaluate(() => {
     const imgs = document.querySelectorAll('.flashcard-image');
     return Array.from(imgs).every(img => img.complete && img.alt);
   }) - must return true
4. mcp_playwright_browser_click on wrong image
5. mcp_playwright_browser_snapshot - verify try-again feedback
6. mcp_playwright_browser_click on correct image
7. mcp_playwright_browser_take_screenshot("test-results/LA-009-picture.png")
```

**Commit:**
```bash
git commit -m "[LA-009] Implement picture flashcard exercise (Sources: 1, 4, 15, 47)

Implementation:
- Added renderPictureFlashcardExercise()
- 3-6 images in grid with preloading
- Alt text on all images
- Audio plays target word
- Telemetry: chosen_option, asset_load_success, time_to_select

Testing:
- E2E: lesson.e2e.test.js - ✅
- MCP Playwright: Scenario 2 - ✅

Evidence:
- Screenshot: test-results/LA-009-picture.png"
```

---

### Task: LA-010 - Implement Image→Type Exercise (pastel→pastry)

**Branch:** `feature/LA-010-image-type-exercise`

**Prerequisites:** LA-021 (Asset preload system) recommended but not blocking

**Files to Change:**
- `src/components/lesson/ChallengeRenderer.js` - Add image-type exercise
- `assets/` folder - Add subject-matched images
- `src/data/lessons/*.js` - Add image-type challenges

**Implementation Steps:**
1. Add `renderImageTypeExercise()` function
2. Display image BEFORE input field (critical - practice-first)
3. Implement accent-tolerant text input (ã, ç, etc.)
4. Add immediate feedback on submit
5. Add telemetry: `keystroke_count`, `response_time`, `accent_correct`
6. Ensure NO word-list screen precedes this exercise

**Definition of Done Checklist:**
- [ ] Image displays BEFORE input field (not after)
- [ ] No word list shown first - this IS the first view
- [ ] Accepts accented characters (ã, ç, etc.)
- [ ] Feedback on submit is immediate
- [ ] Telemetry captures keystrokes and timing
- [ ] Playwright screenshot shows image + input field together
- [ ] Image URL matches subject (verified via evaluate)

**Test Commands:**
```bash
npx playwright test tests/e2e/lesson.e2e.test.js --grep "image-type"
```

**MCP Playwright Validation:**
```
1. mcp_playwright_browser_navigate("http://localhost:63436/learn")
2. mcp_playwright_browser_click on image-type lesson
3. mcp_playwright_browser_snapshot - verify image present BEFORE input
4. mcp_playwright_browser_evaluate(() => {
     const img = document.querySelector('.exercise-image');
     return img ? img.src : null;
   }) - verify image URL is subject-matched
5. mcp_playwright_browser_type("pastel") in input field
6. mcp_playwright_browser_click submit button
7. mcp_playwright_browser_take_screenshot("test-results/LA-010-image-type.png")
8. mcp_playwright_browser_evaluate(() => window.telemetryEvents)
```

**Commit:**
```bash
git commit -m "[LA-010] Implement image→type exercise (Sources: 4, 7, 8)

Implementation:
- Added renderImageTypeExercise() with image-first layout
- Accent-tolerant input (normalizes ã→a for comparison, notes if missing)
- Immediate feedback with correct/incorrect styling
- Telemetry: keystroke_count, response_time, accent_correct

Testing:
- E2E: lesson.e2e.test.js - ✅
- MCP Playwright: Scenario 3 - ✅

Evidence:
- Screenshot: test-results/LA-010-image-type.png
- Image URL verified as subject-matched"
```

---

### Task: LA-011 - Implement Audio→Type Dictation

**Branch:** `feature/LA-011-audio-dictation`

**Prerequisites:** Voice services working

**Files to Change:**
- `src/components/lesson/ChallengeRenderer.js` - Add dictation exercise
- `src/services/VoiceService.js` - Ensure TTS integration
- `src/services/TTSService.js` - Edge-TTS pt-PT voices

**Implementation Steps:**
1. Add `renderDictationExercise()` function
2. Auto-play audio on exercise start (Edge-TTS pt-PT)
3. Add replay button (unlimited replays)
4. Add speed slider (0.5x - 1.5x) that affects playback
5. Calculate WER score on submit
6. Voice configurable: Duarte (male) or Raquel (female) from admin

**Definition of Done Checklist:**
- [ ] Audio plays on exercise start
- [ ] Replay button works (unlimited)
- [ ] Speed slider visibly moves and affects playback
- [ ] WER score calculated and displayed
- [ ] Telemetry: `wer_score`, `replay_count`, `speed_used`, `time_to_submit`
- [ ] Playwright Scenario 5 passes

**Test Commands:**
```bash
npx playwright test tests/e2e/voice.e2e.test.js --grep "dictation"
```

**MCP Playwright Validation:**
```
1. mcp_playwright_browser_navigate to dictation lesson
2. mcp_playwright_browser_evaluate(() => {
     const audio = document.querySelector('audio');
     return audio && audio.currentTime > 0;
   }) - verify audio played
3. mcp_playwright_browser_click on speed slider, drag to 0.75
4. mcp_playwright_browser_evaluate(() => {
     return document.querySelector('.speed-slider')?.value;
   }) - verify < 1.0
5. mcp_playwright_browser_type transcript
6. mcp_playwright_browser_click submit
7. mcp_playwright_browser_take_screenshot("test-results/LA-011-dictation.png")
```

**Commit:**
```bash
git commit -m "[LA-011] Implement audio→type dictation (Sources: 5, 38, 39)

Implementation:
- Added renderDictationExercise() with auto-play
- Replay button + speed slider (0.5x-1.5x)
- WER scoring on submit
- Edge-TTS pt-PT voices (Duarte/Raquel)
- Telemetry: wer_score, replay_count, speed_used

Testing:
- E2E: voice.e2e.test.js - ✅
- MCP Playwright: Scenario 5 - ✅

Evidence:
- Screenshot: test-results/LA-011-dictation.png"
```

---

### Task: LA-012 - Implement Audio→Pick MCQ

**Branch:** `feature/LA-012-audio-mcq`

**Prerequisites:** LA-011 (Audio infrastructure)

**Files to Change:**
- `src/components/lesson/ChallengeRenderer.js` - Add audio MCQ

**Implementation Steps:**
1. Add `renderAudioMCQExercise()` function
2. Play audio of Portuguese phrase
3. Display 4 English translation options
4. Randomize option order each attempt
5. Distractors should be plausible (similar structure)

**Definition of Done Checklist:**
- [ ] 4 options displayed clearly
- [ ] Order randomized (not alphabetical)
- [ ] Correct answer validated
- [ ] Distractors are plausible
- [ ] Telemetry: `chosen_option`, `was_distractor`, `audio_replay_count`

**Test Commands:**
```bash
npx playwright test tests/unit/challengeRenderer.test.js --grep "audio-mcq"
```

**MCP Playwright Validation:**
```
1. mcp_playwright_browser_navigate to audio MCQ lesson
2. mcp_playwright_browser_snapshot - verify 4 options visible
3. mcp_playwright_browser_evaluate(() => {
     const opts = document.querySelectorAll('.mcq-option');
     return opts.length === 4;
   })
4. mcp_playwright_browser_click on correct option
5. mcp_playwright_browser_take_screenshot("test-results/LA-012-audio-mcq.png")
```

**Commit:**
```bash
git commit -m "[LA-012] Implement audio→pick MCQ (Sources: 1, 52)

Implementation:
- Added renderAudioMCQExercise()
- 4 options with randomized order
- Plausible distractors (similar structure)
- Telemetry: chosen_option, was_distractor, audio_replay_count

Testing:
- Unit tests: challengeRenderer.test.js - ✅

Evidence:
- Screenshot: test-results/LA-012-audio-mcq.png"
```

---

### Task: LA-013 - Implement Minimal Pair Picker

**Branch:** `feature/LA-013-minimal-pairs`

**Prerequisites:** LA-011 (Audio infrastructure)

**Files to Change:**
- `src/services/PronunciationService.js` - Add minimal pair logic
- `src/components/lesson/ChallengeRenderer.js` - Add minimal pair UI

**Implementation Steps:**
1. Add `renderMinimalPairExercise()` function
2. Display two audio buttons for similar words (e.g., avô/avó)
3. Prompt: "Select 'avô' (grandfather)"
4. On wrong answer, explain IPA difference
5. Log confusion to user's phoneme profile

**Definition of Done Checklist:**
- [ ] Two audio options clearly labeled
- [ ] Both play distinct audio files
- [ ] Selection captured correctly
- [ ] Confusion logged to user's phoneme profile
- [ ] Feedback includes IPA explanation
- [ ] Telemetry: `confusion_matrix` entry, `attempts`

**Test Commands:**
```bash
npx playwright test tests/unit/pronunciationService.test.js --grep "minimal"
```

**MCP Playwright Validation:**
```
1. mcp_playwright_browser_navigate to minimal pair lesson
2. mcp_playwright_browser_click first audio button
3. mcp_playwright_browser_click second audio button
4. mcp_playwright_browser_click wrong option
5. mcp_playwright_browser_snapshot - verify IPA feedback shown
6. mcp_playwright_browser_take_screenshot("test-results/LA-013-minimal-pair.png")
```

**Commit:**
```bash
git commit -m "[LA-013] Implement minimal pair picker (Sources: 32, 38, 50)

Implementation:
- Added renderMinimalPairExercise()
- Two audio buttons for similar phonemes
- IPA explanation on wrong answer
- Confusion logged to phoneme profile
- Telemetry: confusion_matrix, attempts

Testing:
- Unit tests: pronunciationService.test.js - ✅

Evidence:
- Screenshot: test-results/LA-013-minimal-pair.png"
```

---

### Task: LA-014 - Implement Word-Image Match Grid

**Branch:** `feature/LA-014-match-grid`

**Prerequisites:** LA-021 (Asset preload)

**Files to Change:**
- `src/components/lesson/ChallengeRenderer.js` - Add match grid

**Implementation Steps:**
1. Add `renderMatchGridExercise()` function
2. Display 4-6 words on left, 4-6 images on right
3. Shuffle both columns independently
4. Implement line-drawing or click-pair matching
5. All pairs must match to complete

**Definition of Done Checklist:**
- [ ] Grid displays shuffled words and images
- [ ] Matching interaction works (line or click)
- [ ] All pairs must match to complete
- [ ] Per-pair telemetry logged
- [ ] Telemetry: `attempts_per_pair`, `total_time`, `wrong_matches`

**Test Commands:**
```bash
npx playwright test tests/unit/challengeRenderer.test.js --grep "match-grid"
```

**MCP Playwright Validation:**
```
1. mcp_playwright_browser_navigate to match grid lesson
2. mcp_playwright_browser_snapshot - verify grid layout
3. mcp_playwright_browser_click on word, then matching image
4. mcp_playwright_browser_evaluate(() => window.matchedPairs?.length)
5. Complete all pairs
6. mcp_playwright_browser_take_screenshot("test-results/LA-014-match-grid.png")
```

**Commit:**
```bash
git commit -m "[LA-014] Implement word-image match grid (Sources: 1, 4, 8)

Implementation:
- Added renderMatchGridExercise()
- 4-6 word-image pairs, both shuffled
- Click-pair matching interaction
- Per-pair telemetry: attempts_per_pair, total_time, wrong_matches

Testing:
- Unit tests: challengeRenderer.test.js - ✅

Evidence:
- Screenshot: test-results/LA-014-match-grid.png"
```

---

### Task: LA-015 - Implement Grammar Transform

**Branch:** `feature/LA-015-grammar-transform`

**Prerequisites:** None

**Files to Change:**
- `src/components/lesson/ChallengeRenderer.js` - Add grammar transform
- `src/data/ai-reference/grammar-patterns.js` - Grammar rules reference

**Implementation Steps:**
1. Add `renderGrammarTransformExercise()` function
2. Prompt: "Change to past tense: eu falo"
3. Validate morphological correctness (not just string match)
4. Categorize errors: tense/person/gender/number

**Definition of Done Checklist:**
- [ ] Prompt clearly states transformation required
- [ ] Validates morphology (not just string match)
- [ ] Categorizes errors correctly
- [ ] References grammar-patterns.js for rules
- [ ] Telemetry: `error_category`, `transform_type`, `attempts`

**Test Commands:**
```bash
npx playwright test tests/unit/challengeRenderer.test.js --grep "grammar"
```

**MCP Playwright Validation:**
```
1. mcp_playwright_browser_navigate to grammar transform lesson
2. mcp_playwright_browser_snapshot - verify prompt visible
3. mcp_playwright_browser_type("eu falei")
4. mcp_playwright_browser_click submit
5. mcp_playwright_browser_take_screenshot("test-results/LA-015-grammar.png")
```

**Commit:**
```bash
git commit -m "[LA-015] Implement grammar transform (Sources: 20, 24, 49)

Implementation:
- Added renderGrammarTransformExercise()
- Morphological validation (tense/person/gender/number)
- Uses grammar-patterns.js for rules
- Error categorization in telemetry

Testing:
- Unit tests: challengeRenderer.test.js - ✅

Evidence:
- Screenshot: test-results/LA-015-grammar.png"
```

---

### Task: LA-016 - Implement Dialogue Reorder

**Branch:** `feature/LA-016-dialogue-reorder`

**Prerequisites:** LA-011 (Audio infrastructure)

**Files to Change:**
- `src/components/lesson/ChallengeRenderer.js` - Add dialogue reorder
- Audio assets for dialogue clips

**Implementation Steps:**
1. Add `renderDialogueReorderExercise()` function
2. Display 2-4 audio clips in shuffled order
3. Each clip plays when clicked
4. User drags/clicks to arrange in correct conversation order
5. Validate logical flow on submit

**Definition of Done Checklist:**
- [ ] Multiple clips play independently
- [ ] Drag/click to reorder works
- [ ] Order validated on submit
- [ ] Telemetry: `mis_order_count`, `clips_played`, `total_time`

**Test Commands:**
```bash
npx playwright test tests/unit/challengeRenderer.test.js --grep "dialogue"
```

**MCP Playwright Validation:**
```
1. mcp_playwright_browser_navigate to dialogue lesson
2. mcp_playwright_browser_click on each clip to play
3. mcp_playwright_browser_drag clips to reorder
4. mcp_playwright_browser_click submit
5. mcp_playwright_browser_take_screenshot("test-results/LA-016-dialogue.png")
```

**Commit:**
```bash
git commit -m "[LA-016] Implement dialogue reorder (Sources: 9, 29)

Implementation:
- Added renderDialogueReorderExercise()
- 2-4 audio clips, shuffled
- Drag/click to reorder
- Telemetry: mis_order_count, clips_played, total_time

Testing:
- Unit tests: challengeRenderer.test.js - ✅

Evidence:
- Screenshot: test-results/LA-016-dialogue.png"
```

---

### Task: LA-017 - Implement Pronunciation Shadowing

**Branch:** `feature/LA-017-pronunciation-shadowing`

**Prerequisites:** LA-011 (Audio), PronunciationService working

**Files to Change:**
- `src/services/PronunciationService.js` - Add shadowing scoring
- `src/services/PhoneticScorer.js` - Per-phoneme analysis
- `src/components/lesson/ChallengeRenderer.js` - Add shadowing UI

**Implementation Steps:**
1. Add `renderShadowingExercise()` function
2. Play target audio with transcript visible
3. User clicks record and repeats phrase
4. Compare recording to target via PhoneticScorer
5. Display per-phoneme feedback (green/yellow/red)
6. Show IPA differences for problem phonemes

**Definition of Done Checklist:**
- [ ] Target audio plays with transcript shown
- [ ] Recording captures user audio
- [ ] Phonetic scoring returns per-phoneme
- [ ] Per-phoneme feedback displayed (green/yellow/red)
- [ ] IPA differences explained
- [ ] Telemetry: `per_phoneme_accuracy[]`, `overall_score`, `problem_phonemes[]`

**Test Commands:**
```bash
npx playwright test tests/unit/phoneticScorer.test.js
npx playwright test tests/unit/pronunciationService.test.js --grep "shadowing"
```

**MCP Playwright Validation:**
```
1. mcp_playwright_browser_navigate to shadowing lesson
2. mcp_playwright_browser_click play target
3. mcp_playwright_browser_click record button
4. Wait 3 seconds
5. mcp_playwright_browser_click stop
6. mcp_playwright_browser_snapshot - verify phoneme feedback visible
7. mcp_playwright_browser_take_screenshot("test-results/LA-017-shadowing.png")
```

**Commit:**
```bash
git commit -m "[LA-017] Implement pronunciation shadowing (Sources: 16, 35, 50)

Implementation:
- Added renderShadowingExercise()
- Records user audio, compares to target
- Per-phoneme scoring with IPA feedback
- Telemetry: per_phoneme_accuracy, overall_score, problem_phonemes

Testing:
- Unit tests: phoneticScorer.test.js, pronunciationService.test.js - ✅

Evidence:
- Screenshot: test-results/LA-017-shadowing.png"
```

---

### Task: LA-018 - Implement Number Comprehension

**Branch:** `feature/LA-018-number-comprehension`

**Prerequisites:** LA-011 (Audio)

**Files to Change:**
- `src/components/lesson/ChallengeRenderer.js` - Add number exercise
- Number assets (finger images for 1-10)

**Implementation Steps:**
1. Add `renderNumberExercise()` function
2. Play number audio in Portuguese
3. For 1-10: show finger image
4. For 11+: show digit display
5. User types numeric answer
6. Calculate "off-by" error magnitude

**Definition of Done Checklist:**
- [ ] Audio plays number clearly
- [ ] Finger/digit image visible alongside audio
- [ ] Numeric input accepts only digits
- [ ] Feedback shows correct/incorrect
- [ ] Telemetry: `off_by_error`, `response_time`
- [ ] Playwright Scenario 4 passes

**Test Commands:**
```bash
npx playwright test tests/e2e/lesson.e2e.test.js --grep "number"
```

**MCP Playwright Validation:**
```
1. mcp_playwright_browser_navigate to number lesson
2. mcp_playwright_browser_click play audio
3. mcp_playwright_browser_snapshot - verify finger image (for 1-10)
4. mcp_playwright_browser_type("5")
5. mcp_playwright_browser_click submit
6. mcp_playwright_browser_take_screenshot("test-results/LA-018-number.png")
```

**Commit:**
```bash
git commit -m "[LA-018] Implement number comprehension (Sources: 40, 59, 60)

Implementation:
- Added renderNumberExercise()
- Finger images for 1-10, digits for 11+
- Off-by error calculation
- Telemetry: off_by_error, response_time

Testing:
- E2E: lesson.e2e.test.js - ✅
- MCP Playwright: Scenario 4 - ✅

Evidence:
- Screenshot: test-results/LA-018-number.png"
```

---

### Task: LA-019 - Implement Rapid Recall

**Branch:** `feature/LA-019-rapid-recall`

**Prerequisites:** Multiple exercises implemented

**Files to Change:**
- `src/components/lesson/ChallengeRenderer.js` - Add rapid recall mode
- Timer utility

**Implementation Steps:**
1. Add `renderRapidRecallExercise()` function
2. Display visible countdown timer (30-60s configurable)
3. Flash card appears: image + audio
4. User types answer quickly
5. Auto-advance after answer or 5s timeout
6. Calculate items/second + accuracy at end

**Definition of Done Checklist:**
- [ ] Timer displays and counts down visibly
- [ ] Items cycle with auto-advance
- [ ] Score calculated at end
- [ ] Items per second + accuracy shown
- [ ] Telemetry: `items_per_second`, `accuracy`, `timeout_count`

**Test Commands:**
```bash
npx playwright test tests/unit/challengeRenderer.test.js --grep "rapid"
```

**MCP Playwright Validation:**
```
1. mcp_playwright_browser_navigate to rapid recall lesson
2. mcp_playwright_browser_snapshot - verify timer visible
3. mcp_playwright_browser_type first answer
4. mcp_playwright_browser_snapshot - verify auto-advanced
5. Wait for timer to end
6. mcp_playwright_browser_take_screenshot("test-results/LA-019-rapid.png")
```

**Commit:**
```bash
git commit -m "[LA-019] Implement rapid recall (Sources: 23, 27, 51)

Implementation:
- Added renderRapidRecallExercise()
- Countdown timer (30-60s)
- Auto-advance after answer or timeout
- Score: items/second + accuracy
- Telemetry: items_per_second, accuracy, timeout_count

Testing:
- Unit tests: challengeRenderer.test.js - ✅

Evidence:
- Screenshot: test-results/LA-019-rapid.png"
```

---

### Task: LA-020 - Implement Multi-Modal Dual Coding

**Branch:** `feature/LA-020-dual-coding`

**Prerequisites:** LA-011 (Audio), LA-021 (Assets)

**Files to Change:**
- `src/components/lesson/ChallengeRenderer.js` - Add dual coding exercise

**Implementation Steps:**
1. Add `renderDualCodingExercise()` function
2. Present word with text + image + audio simultaneously
3. Audio auto-plays on load
4. User types English translation
5. After submit, ask "Which helped you remember?" (text/image/audio)
6. Log modality preference for future lessons

**Definition of Done Checklist:**
- [ ] All three modalities render simultaneously
- [ ] Audio plays on load
- [ ] User can click to replay audio
- [ ] Translation validated
- [ ] Modality preference captured
- [ ] Telemetry: `modality_clicked`, `modality_preference`, `recall_success`

**Test Commands:**
```bash
npx playwright test tests/unit/challengeRenderer.test.js --grep "dual-coding"
```

**MCP Playwright Validation:**
```
1. mcp_playwright_browser_navigate to dual coding lesson
2. mcp_playwright_browser_snapshot - verify text + image + audio controls
3. mcp_playwright_browser_type("cat")
4. mcp_playwright_browser_click submit
5. mcp_playwright_browser_click "image" preference
6. mcp_playwright_browser_take_screenshot("test-results/LA-020-dual.png")
```

**Commit:**
```bash
git commit -m "[LA-020] Implement multi-modal dual coding (Sources: 25, 26, 47)

Implementation:
- Added renderDualCodingExercise()
- Text + image + audio presented simultaneously
- Modality preference survey after answer
- Telemetry: modality_clicked, modality_preference, recall_success

Testing:
- Unit tests: challengeRenderer.test.js - ✅

Evidence:
- Screenshot: test-results/LA-020-dual.png"
```

---

### Task: LA-021 - Asset Preload System

**Branch:** `feature/LA-021-asset-preload`

**Prerequisites:** None (can be done early or late)

**Files to Change:**
- `src/utils/assetLoader.js` - Create asset preloader
- `src/components/lesson/LessonCard.js` - Use preloader

**Implementation Steps:**
1. Create `preloadAssets(urls)` utility function
2. Load all images before lesson renders
3. Require alt text on all images
4. Fail build if asset missing or invalid
5. Log asset load times for performance monitoring

**Definition of Done Checklist:**
- [ ] All images preloaded before render
- [ ] No lazy-load failures during exercises
- [ ] Alt text required on every image
- [ ] Build fails if asset missing
- [ ] Telemetry: `asset_load_time`, `asset_failures`

**Test Commands:**
```bash
npx playwright test tests/unit/assetLoader.test.js
```

**MCP Playwright Validation:**
```
1. mcp_playwright_browser_navigate to image-heavy lesson
2. mcp_playwright_browser_evaluate(() => {
     const imgs = document.querySelectorAll('img');
     return Array.from(imgs).every(img => img.complete && img.naturalWidth > 0);
   }) - must return true (all loaded)
3. mcp_playwright_browser_evaluate(() => {
     const imgs = document.querySelectorAll('img');
     return Array.from(imgs).every(img => img.alt && img.alt.length > 0);
   }) - must return true (all have alt)
4. mcp_playwright_browser_take_screenshot("test-results/LA-021-preload.png")
```

**Commit:**
```bash
git commit -m "[LA-021] Implement asset preload system (Sources: 4, 15, 47)

Implementation:
- Created preloadAssets() utility
- All images preloaded before render
- Alt text required (enforced)
- Build fails on missing assets
- Telemetry: asset_load_time, asset_failures

Testing:
- Unit tests: assetLoader.test.js - ✅

Evidence:
- Screenshot: test-results/LA-021-preload.png
- All images loaded and have alt text"
```

---

### Task: AI-001 - Phase 1 Static Seed Generation

**Branch:** `feature/AI-001-static-seed`

**Prerequisites:** None (foundation task)

**Files to Change:**
- `src/services/ai/AIAgent.js` - Add phase detection and template generation

**Implementation Steps:**
1. Add `getInteractionCount(userId)` function
2. If count < 50, use template-based generation
3. Create `generateFromTemplate(lessonId, options)` function
4. Use fixed exercise type mix: word_order, cloze, picture_flashcard
5. No profiler signals consumed in this phase
6. Telemetry still captured for future phases

**Definition of Done Checklist:**
- [ ] AIAgent detects interaction count < 50
- [ ] Uses template-based generation (no profiler signals)
- [ ] Exercise mix follows default distribution
- [ ] Telemetry captured for future phases
- [ ] Unit test confirms phase detection

**Test Commands:**
```bash
npx playwright test tests/unit/aiService.test.js --grep "phase-1"
```

**MCP Playwright Validation:**
```
1. Clear user data: mcp_playwright_browser_evaluate(() => localStorage.clear())
2. mcp_playwright_browser_navigate to lesson
3. mcp_playwright_browser_evaluate(() => window.aiPhase) - should be 1
4. Complete 10 exercises
5. mcp_playwright_browser_evaluate(() => window.aiPhase) - still 1
6. mcp_playwright_browser_take_screenshot("test-results/AI-001-phase1.png")
```

**Commit:**
```bash
git commit -m "[AI-001] Implement Phase 1 static seed generation (Sources: 17, 37)

Implementation:
- Added phase detection based on interaction count
- Template-based generation for < 50 interactions
- Fixed exercise mix: word_order, cloze, picture_flashcard
- No profiler signals consumed yet
- Telemetry captured for future phases

Testing:
- Unit tests: aiService.test.js - ✅

Evidence:
- Screenshot: test-results/AI-001-phase1.png"
```

---

### Task: AI-002 - Phase 2 Adaptive Selection

**Branch:** `feature/AI-002-adaptive-selection`

**Prerequisites:** AI-001 (Phase 1), TM-002 (Events)

**Files to Change:**
- `src/services/ai/AIAgent.js` - Add adaptive logic
- `src/services/learning/LearnerProfiler.js` - Consume signals

**Implementation Steps:**
1. Detect 50+ interactions → switch to Phase 2
2. Consume LearnerProfiler signals:
   - `pronunciation_weak_phonemes[]`
   - `confusion_pairs[]`
   - `avg_response_latency`
   - `repeated_fail_words[]`
3. Adjust exercise mix based on weaknesses
4. Start interleaving (20% review from prior tier)

**Definition of Done Checklist:**
- [ ] AIAgent detects 50+ interactions
- [ ] Consumes LearnerProfiler signals
- [ ] Exercise mix changes based on weaknesses
- [ ] Interleaving begins (20% review)
- [ ] Unit test confirms signal consumption
- [ ] Playwright Scenario 6 passes

**Test Commands:**
```bash
npx playwright test tests/unit/aiService.test.js --grep "phase-2"
npx playwright test tests/unit/learnerProfiler.test.js
```

**MCP Playwright Validation:**
```
1. Seed user with 60 interactions + weak phoneme /ão/
2. mcp_playwright_browser_navigate to lesson
3. mcp_playwright_browser_evaluate(() => window.aiPhase) - should be 2
4. mcp_playwright_browser_snapshot - verify minimal pair or shadowing exercise
5. mcp_playwright_browser_take_screenshot("test-results/AI-002-phase2.png")
```

**Commit:**
```bash
git commit -m "[AI-002] Implement Phase 2 adaptive selection (Sources: 19, 21, 37)

Implementation:
- Phase 2 activates at 50+ interactions
- Consumes LearnerProfiler signals
- Exercise mix adapts to weaknesses
- 20% review items interleaved
- Telemetry includes profiler signals

Testing:
- Unit tests: aiService.test.js, learnerProfiler.test.js - ✅
- MCP Playwright: Scenario 6 - ✅

Evidence:
- Screenshot: test-results/AI-002-phase2.png"
```

---

### Task: AI-003 - Phase 3 Portfolio-Based

**Branch:** `feature/AI-003-portfolio-based`

**Prerequisites:** AI-002 (Phase 2), AI-006 (FSRS)

**Files to Change:**
- `src/services/ai/AIAgent.js` - Add portfolio logic
- `src/services/learning/FSRSEngine.js` - FSRS integration

**Implementation Steps:**
1. Detect 200+ interactions → switch to Phase 3
2. Use FSRS scheduling for review ratio (10-30%)
3. Generate custom mini-lessons for weak areas
4. Add save/discard flow for generated lessons
5. Include performance predictions

**Definition of Done Checklist:**
- [ ] AIAgent detects 200+ interactions
- [ ] FSRS scheduling determines review items
- [ ] Custom lesson generation works
- [ ] Save/discard flow implemented
- [ ] Telemetry includes FSRS intervals
- [ ] Integration test for full adaptive path

**Test Commands:**
```bash
npx playwright test tests/unit/aiService.test.js --grep "phase-3"
npx playwright test tests/integration/aiPipeline.test.js
```

**MCP Playwright Validation:**
```
1. Seed user with 250 interactions
2. mcp_playwright_browser_navigate to lesson
3. mcp_playwright_browser_evaluate(() => window.aiPhase) - should be 3
4. mcp_playwright_browser_snapshot - verify FSRS-based review
5. mcp_playwright_browser_take_screenshot("test-results/AI-003-phase3.png")
```

**Commit:**
```bash
git commit -m "[AI-003] Implement Phase 3 portfolio-based generation (Sources: 22, 37)

Implementation:
- Phase 3 activates at 200+ interactions
- FSRS scheduling for review (10-30%)
- Custom mini-lesson generation
- Save/discard flow for user approval
- Performance predictions

Testing:
- Unit tests: aiService.test.js - ✅
- Integration tests: aiPipeline.test.js - ✅

Evidence:
- Screenshot: test-results/AI-003-phase3.png"
```

---

### Task: AI-004 - Rescue Technique Rotation

**Branch:** `feature/AI-004-rescue-technique-rotation`

**Prerequisites:** TM-002 (Event emission) should be complete

**Files to Change:**
- `src/services/learning/StuckWordsService.js` - Implement rotation logic
- `src/data/ai-reference/mnemonic-patterns.js` - Reference for techniques

**Implementation Steps:**
1. Track failure count per word per user
2. On 3rd fail of same word, trigger rescue technique
3. Rotate through techniques: keyword_mnemonic → minimal_pair → memory_palace → input_flood → image_association
4. Log rescue event to telemetry
5. Each subsequent fail cycles to next technique

**Rescue Technique Rotation:**
| Fail Count | Technique | Implementation |
|------------|-----------|----------------|
| 3 | Keyword Mnemonic | English word sounds like Portuguese |
| 4 | Minimal Pair | Compare with similar-sounding word |
| 5 | Memory Palace | Associate with physical location |
| 6 | Input Flood | Multiple sentences with target word |
| 7 | Image Association | Strong visual connection |
| 8+ | Cycle back to 3 | Repeat rotation |

**Definition of Done Checklist:**
- [ ] Failure count tracked per word per user
- [ ] Rescue triggers on 3rd fail (not before)
- [ ] Different technique on each subsequent fail
- [ ] Technique logged to telemetry: `stuck_word_rescue` event
- [ ] Unit test confirms rotation sequence
- [ ] Techniques actually display to user (not just logged)

**Test Commands:**
```bash
npx playwright test tests/unit/stuckWordsService.test.js
```

**MCP Playwright Validation:**
```
1. Seed user with 2 failures on word "obrigado"
2. mcp_playwright_browser_navigate to lesson with "obrigado"
3. mcp_playwright_browser_click wrong answer (3rd fail)
4. mcp_playwright_browser_snapshot - verify rescue technique displayed
5. mcp_playwright_browser_evaluate(() => {
     return window.lastRescueTechnique;
   }) - confirm "keyword_mnemonic"
6. Repeat for 4th fail - should be "minimal_pair"
7. mcp_playwright_browser_take_screenshot("test-results/AI-004-rescue.png")
```

**Commit:**
```bash
git commit -m "[AI-004] Implement rescue technique rotation (Sources: 7, 32, 42, 43, 44, 47)

Implementation:
- StuckWordsService tracks per-word failure count
- Rescue triggers at fail count >= 3
- Rotation: keyword_mnemonic → minimal_pair → memory_palace → input_flood → image_association
- Cycles back after 5 techniques

Testing:
- Unit tests: stuckWordsService.test.js - ✅
- MCP Playwright: rescue technique verified - ✅

Evidence:
- Screenshot: test-results/AI-004-rescue.png
- Telemetry: stuck_word_rescue events firing"
```

---

### Task: AI-005 - Dynamic AI Tips from Performance

**Branch:** `feature/AI-005-dynamic-tips`

**Prerequisites:** AI-002 (LearnerProfiler), TM-002 (Events)

**Files to Change:**
- `src/services/ai/AITipGenerator.js` - Create tip generator
- `src/data/ai-reference/phonemes.js` - Phoneme reference
- `src/data/ai-reference/grammar-patterns.js` - Grammar reference
- `src/data/ai-reference/mnemonic-patterns.js` - Memory tips

**Implementation Steps:**
1. Create `generateTips(userId, exerciseResult, context)` function
2. Consume signals: pronunciation scores, confusion pairs, latency, hint usage
3. Generate tips from reference data (NEVER hardcode)
4. Rotate tips - no repeats within session
5. Maximum 2 tips per exercise

**Definition of Done Checklist:**
- [ ] Tips generated from user data (not hardcoded)
- [ ] Uses reference material (phonemes.js, grammar-patterns.js)
- [ ] Rotates tips within session
- [ ] Max 2 tips per exercise enforced
- [ ] Telemetry: `ai_tip_shown` with tipId, category

**Test Commands:**
```bash
npx playwright test tests/unit/aiTipGenerator.test.js
```

**MCP Playwright Validation:**
```
1. Seed user with weak phoneme /ão/
2. mcp_playwright_browser_navigate to exercise
3. Complete with pronunciation error
4. mcp_playwright_browser_snapshot - verify tip displayed
5. mcp_playwright_browser_evaluate(() => window.lastTip) - verify generated
6. mcp_playwright_browser_take_screenshot("test-results/AI-005-tips.png")
```

**Commit:**
```bash
git commit -m "[AI-005] Implement dynamic AI tips (Sources: 48, 36)

Implementation:
- Created AITipGenerator with generateTips()
- Uses phonemes.js, grammar-patterns.js, mnemonic-patterns.js
- Tips rotate within session (no repeats)
- Max 2 tips per exercise
- Never hardcoded

Testing:
- Unit tests: aiTipGenerator.test.js - ✅

Evidence:
- Screenshot: test-results/AI-005-tips.png"
```

---

### Task: AI-006 - FSRS Integration for Review

**Branch:** `feature/AI-006-fsrs-integration`

**Prerequisites:** TM-002 (Events track word performance)

**Files to Change:**
- `src/services/learning/FSRSEngine.js` - Implement FSRS scheduler
- `src/services/ai/AIAgent.js` - Use FSRS for review selection

**Implementation Steps:**
1. Implement FSRS algorithm (based on Anki's algorithm)
2. Calculate next review interval per word
3. `getDueItems(userId)` returns items due for review
4. Calculate review ratio (10-30% based on due items)
5. Integrate with AIAgent for lesson generation

**Definition of Done Checklist:**
- [ ] FSRS algorithm implemented
- [ ] Next review intervals calculated correctly
- [ ] getDueItems() returns due items
- [ ] 10-30% review items interleaved
- [ ] Unit test confirms FSRS calculations

**Test Commands:**
```bash
npx playwright test tests/unit/fsrsEngine.test.js
```

**MCP Playwright Validation:**
```
1. Seed user with varied word performance
2. mcp_playwright_browser_navigate to lesson
3. mcp_playwright_browser_evaluate(() => {
     return window.lessonConfig?.reviewRatio;
   }) - verify 0.10-0.30
4. mcp_playwright_browser_take_screenshot("test-results/AI-006-fsrs.png")
```

**Commit:**
```bash
git commit -m "[AI-006] Implement FSRS integration (Sources: 22, 24)

Implementation:
- FSRSEngine with interval calculation
- getDueItems() returns due review words
- Review ratio 10-30% based on due items
- Integrated with AIAgent

Testing:
- Unit tests: fsrsEngine.test.js - ✅

Evidence:
- Screenshot: test-results/AI-006-fsrs.png"
```

---

### Task: AI-007 - Encouragement Tips at < 70%

**Branch:** `feature/AI-007-encouragement-tips`

**Prerequisites:** AI-005 (AITipGenerator)

**Files to Change:**
- `src/services/ai/AITipGenerator.js` - Add encouragement logic

**Implementation Steps:**
1. Check `profile.recentAccuracy` before generating tips
2. If < 70%, always include encouragement tip
3. Use mnemonic-patterns.js for encouragement templates
4. Generate (never hardcode) - include user's recent success
5. Encouragement tip counts toward 2-tip max

**Definition of Done Checklist:**
- [ ] Encouragement triggers at accuracy < 70%
- [ ] Tips are generated (not hardcoded)
- [ ] References user's actual progress
- [ ] Counts toward 2-tip maximum
- [ ] Unit test confirms threshold

**Test Commands:**
```bash
npx playwright test tests/unit/aiTipGenerator.test.js --grep "encouragement"
```

**MCP Playwright Validation:**
```
1. Seed user with 60% recent accuracy
2. mcp_playwright_browser_navigate to exercise
3. Complete exercise
4. mcp_playwright_browser_snapshot - verify encouragement tip shown
5. mcp_playwright_browser_evaluate(() => window.lastTip?.category) - "encouragement"
6. mcp_playwright_browser_take_screenshot("test-results/AI-007-encourage.png")
```

**Commit:**
```bash
git commit -m "[AI-007] Implement encouragement tips at <70% (Sources: 18, 48)

Implementation:
- Encouragement triggers when accuracy < 70%
- Generated from user's actual progress
- Uses mnemonic-patterns.js templates
- Never hardcoded
- Counts toward 2-tip max

Testing:
- Unit tests: aiTipGenerator.test.js - ✅

Evidence:
- Screenshot: test-results/AI-007-encourage.png"
```

---

### Task: TM-001 - User-Prefixed Storage Keys

**Branch:** `feature/TM-001-user-prefixed-storage`

**Prerequisites:** None (PRIORITY - do early)

**Files to Change:**
- All services using localStorage
- `src/services/userStorage.js` - Create helper

**Implementation Steps:**
1. Create `userStorage.js` with `get(key)`, `set(key, value)`
2. All methods auto-prefix with `${userId}_`
3. Find/replace all direct localStorage calls
4. Add validation that key has prefix

**Definition of Done Checklist:**
- [ ] All keys use `${userId}_` prefix
- [ ] No direct localStorage calls remain
- [ ] userStorage.js enforces prefix
- [ ] Unit test checks all storage calls

**Test Commands:**
```bash
npx playwright test tests/unit/userStorage.test.js
```

**MCP Playwright Validation:**
```
1. Login as user "test123"
2. Complete exercise
3. mcp_playwright_browser_evaluate(() => {
     const keys = Object.keys(localStorage);
     return keys.filter(k => !k.startsWith('test123_'));
   }) - should return [] (no unprefixed keys)
4. mcp_playwright_browser_take_screenshot("test-results/TM-001-prefix.png")
```

**Commit:**
```bash
git commit -m "[TM-001] Implement user-prefixed storage keys (Sources: 56)

Implementation:
- Created userStorage.js helper
- Auto-prefixes all keys with userId
- Replaced all direct localStorage calls
- Validation enforces prefix

Testing:
- Unit tests: userStorage.test.js - ✅

Evidence:
- Screenshot: test-results/TM-001-prefix.png
- No unprefixed keys in localStorage"
```

---

### Task: TM-002 - Implement All Required Events

**Branch:** `feature/TM-002-telemetry-events`

**Prerequisites:** None

**Files to Change:**
- `src/services/Logger.js` - Ensure logging infrastructure
- `src/services/eventStreaming.js` - Event emission
- `src/components/lesson/ChallengeRenderer.js` - Emit events on interactions

**Required Events:**
| Event | Required Fields | When Emitted |
|-------|-----------------|--------------|
| `answer_attempt` | wordId, lessonId, correctness, responseTime, hintUsed, attemptNumber, exerciseType | On any answer submit |
| `pronunciation_score` | wordId, overallScore, phonemeBreakdown[], timestamp | After pronunciation check |
| `lesson_complete` | lessonId, duration, accuracy, exerciseTypesUsed[], rescueLessonsTriggered | On lesson finish |
| `word_skipped` | wordId, reason (timeout/manual), exerciseType | When user skips |
| `ai_tip_shown` | tipId, category, triggerSignal, userId | When tip displays |
| `stuck_word_rescue` | wordId, technique, attemptNumber, wasSuccessful | When rescue triggers |
| `exercise_interaction` | exerciseType, interactionType (click/type/drag), timestamp | On any interaction |

**Definition of Done Checklist:**
- [ ] All 7 event types emitted at correct times
- [ ] All required fields present in payloads
- [ ] Events use `${userId}_` prefix for storage
- [ ] Unit tests validate event schemas
- [ ] Events visible in browser console via Logger
- [ ] Events stream to AI pipeline via EventStreaming

**Test Commands:**
```bash
npx playwright test tests/unit/logger.test.js
npx playwright test tests/unit/eventStreaming.test.js
```

**MCP Playwright Validation:**
```
1. mcp_playwright_browser_navigate to any lesson
2. Complete an exercise
3. mcp_playwright_browser_evaluate(() => {
     return JSON.parse(localStorage.getItem('telemetry_events') || '[]');
   })
4. Verify answer_attempt event present with all fields
5. Skip a word
6. mcp_playwright_browser_evaluate - verify word_skipped event
7. Complete lesson
8. mcp_playwright_browser_evaluate - verify lesson_complete event
9. mcp_playwright_browser_take_screenshot("test-results/TM-002-events.png")
```

**Commit:**
```bash
git commit -m "[TM-002] Implement all required events (Sources: 57)

Implementation:
- All 7 event types now emitted
- Payloads validated with required fields
- Events use userId prefix
- Logger and EventStreaming integrated

Testing:
- Unit tests: logger.test.js, eventStreaming.test.js - ✅

Evidence:
- Screenshot: test-results/TM-002-events.png"
```

---

### Task: TM-003 - Event Payload Validation

**Branch:** `feature/TM-003-payload-validation`

**Prerequisites:** TM-002 (Events exist)

**Files to Change:**
- `tests/unit/eventSchemas.test.js` - Create schema tests
- `src/services/eventStreaming.js` - Add validation

**Implementation Steps:**
1. Define JSON schema for each event type
2. Add validation in EventStreaming.emit()
3. Throw error on missing required fields
4. Unit tests for all 7 event schemas

**Definition of Done Checklist:**
- [ ] Payloads match schema
- [ ] Missing fields throw error
- [ ] All 7 schemas tested
- [ ] Runtime validation active

**Test Commands:**
```bash
npx playwright test tests/unit/eventSchemas.test.js
```

**MCP Playwright Validation:**
```
1. mcp_playwright_browser_navigate to lesson
2. mcp_playwright_browser_evaluate(() => {
     try {
       EventStreaming.emit('answer_attempt', {}); // missing fields
       return false;
     } catch(e) { return true; }
   }) - should return true (error thrown)
3. mcp_playwright_browser_take_screenshot("test-results/TM-003-validation.png")
```

**Commit:**
```bash
git commit -m "[TM-003] Implement event payload validation (Sources: 57)

Implementation:
- JSON schemas for all 7 event types
- Validation in EventStreaming.emit()
- Missing fields throw errors
- Runtime validation active

Testing:
- Unit tests: eventSchemas.test.js - ✅

Evidence:
- Screenshot: test-results/TM-003-validation.png"
```

---

### Task: TM-004 - Isolation Verification

**Branch:** `feature/TM-004-isolation-verification`

**Prerequisites:** TM-001 (User-prefixed storage)

**Files to Change:**
- `tests/integration/userIsolation.test.js` - Create isolation tests

**Implementation Steps:**
1. Create test with two users in same browser
2. User A saves progress
3. User B logs in - should see no User A data
4. Verify no cross-contamination
5. Test with concurrent activity

**Definition of Done Checklist:**
- [ ] Two users in same browser have separate data
- [ ] No cross-contamination
- [ ] Integration test passes
- [ ] Edge case: rapid user switching

**Test Commands:**
```bash
npx playwright test tests/integration/userIsolation.test.js
```

**MCP Playwright Validation:**
```
1. Login as user "alice"
2. Complete exercise, save progress
3. mcp_playwright_browser_evaluate(() => {
     return Object.keys(localStorage).filter(k => k.startsWith('alice_')).length;
   }) - should be > 0
4. Logout, login as "bob"
5. mcp_playwright_browser_evaluate(() => {
     return Object.keys(localStorage).filter(k => k.startsWith('bob_')).length;
   }) - should be 0 (fresh user)
6. mcp_playwright_browser_evaluate(() => {
     const aliceKeys = Object.keys(localStorage).filter(k => k.startsWith('alice_'));
     return aliceKeys.every(k => !k.includes('bob'));
   }) - should be true
7. mcp_playwright_browser_take_screenshot("test-results/TM-004-isolation.png")
```

**Commit:**
```bash
git commit -m "[TM-004] Implement isolation verification (Sources: 56)

Implementation:
- Integration test for multi-user isolation
- Two users in same browser verified
- No cross-contamination
- Edge case: rapid switching tested

Testing:
- Integration tests: userIsolation.test.js - ✅

Evidence:
- Screenshot: test-results/TM-004-isolation.png"
```

---

### Task: TV-001 - MCP Playwright Scenario 1 (App Load)

**Branch:** `test/TV-001-app-load-scenario`

**Prerequisites:** App must be running

**Files to Change:**
- `tests/e2e/appLoad.e2e.test.js` - Create test file

**Implementation Steps:**
1. Navigate to http://localhost:63436
2. Verify page renders without errors
3. Check main navigation visible
4. Verify no console errors
5. Capture screenshot evidence

**Definition of Done Checklist:**
- [ ] Scenario passes with screenshot
- [ ] No console errors
- [ ] Main navigation visible
- [ ] Page loads within 5 seconds

**Test Commands:**
```bash
npx playwright test tests/e2e/appLoad.e2e.test.js
```

**MCP Playwright Validation:**
```
1. mcp_playwright_browser_navigate("http://localhost:63436")
2. mcp_playwright_browser_snapshot - verify structure
3. mcp_playwright_browser_console_messages({onlyErrors: true}) - should be []
4. mcp_playwright_browser_take_screenshot("test-results/TV-001-app-load.png")
```

**Commit:**
```bash
git commit -m "[TV-001] MCP Playwright Scenario 1 - App Load

Implementation:
- App load test with MCP Playwright
- Console error check
- Navigation visibility verified

Testing:
- E2E: appLoad.e2e.test.js - ✅

Evidence:
- Screenshot: test-results/TV-001-app-load.png
- Console errors: 0"
```

---

### Task: TV-002 - MCP Playwright Scenario 2 (Lesson Smoke)

**Branch:** `test/TV-002-lesson-smoke`

**Prerequisites:** LA-006, LA-008, LA-009 implemented

**Files to Change:**
- `tests/e2e/lessonSmoke.e2e.test.js` - Create test file

**Implementation Steps:**
1. Navigate to lesson grid
2. Verify English titles visible
3. Click first lesson
4. Verify first screen is exercise (not word list)
5. Complete word-order, cloze, picture exercises
6. Capture screenshots at each step
7. Extract and log image URLs

**Definition of Done Checklist:**
- [ ] All 4 screenshots captured
- [ ] Image URLs logged
- [ ] Telemetry verified
- [ ] First screen is exercise

**Test Commands:**
```bash
npx playwright test tests/e2e/lessonSmoke.e2e.test.js
```

**MCP Playwright Validation:**
```
1. mcp_playwright_browser_navigate("http://localhost:63436/learn")
2. mcp_playwright_browser_take_screenshot("test-results/TV-002-grid.png")
3. mcp_playwright_browser_click on first lesson
4. mcp_playwright_browser_take_screenshot("test-results/TV-002-exercise1.png")
5. Complete exercise
6. mcp_playwright_browser_take_screenshot("test-results/TV-002-exercise2.png")
7. mcp_playwright_browser_evaluate(() => {
     const imgs = document.querySelectorAll('img');
     return Array.from(imgs).map(i => i.src);
   })
8. mcp_playwright_browser_take_screenshot("test-results/TV-002-exercise3.png")
```

**Commit:**
```bash
git commit -m "[TV-002] MCP Playwright Scenario 2 - Lesson Smoke (Sources: 1, 4)

Implementation:
- Full lesson smoke test
- 4 screenshots captured
- Image URLs logged
- Telemetry verified

Testing:
- E2E: lessonSmoke.e2e.test.js - ✅

Evidence:
- Screenshots: TV-002-grid.png, TV-002-exercise1-3.png"
```

---

### Task: TV-003 - MCP Playwright Scenario 3 (Image Typing)

**Branch:** `test/TV-003-image-typing`

**Prerequisites:** LA-010 implemented

**Files to Change:**
- `tests/e2e/imageTyping.e2e.test.js` - Create test file

**Implementation Steps:**
1. Navigate to image-type lesson
2. Verify image present before input
3. Extract image URL
4. Verify URL is subject-matched (not gradient/abstract)
5. Verify no word-list screen preceded

**Definition of Done Checklist:**
- [ ] Image URL is subject-matched
- [ ] No word-list screen
- [ ] Screenshot captured

**Test Commands:**
```bash
npx playwright test tests/e2e/imageTyping.e2e.test.js
```

**MCP Playwright Validation:**
```
1. mcp_playwright_browser_navigate to image-type lesson
2. mcp_playwright_browser_evaluate(() => {
     return document.querySelector('[class*="word-list"]') === null;
   }) - must be true
3. mcp_playwright_browser_evaluate(() => {
     const img = document.querySelector('.exercise-image');
     return img?.src;
   }) - verify subject-matched URL
4. mcp_playwright_browser_take_screenshot("test-results/TV-003-image.png")
```

**Commit:**
```bash
git commit -m "[TV-003] MCP Playwright Scenario 3 - Image Typing (Sources: 4, 7, 8)

Implementation:
- Image typing scenario test
- Image URL verified as subject-matched
- No word-list screen confirmed

Testing:
- E2E: imageTyping.e2e.test.js - ✅

Evidence:
- Screenshot: test-results/TV-003-image.png"
```

---

### Task: TV-004 - MCP Playwright Scenario 4 (Numbers)

**Branch:** `test/TV-004-numbers`

**Prerequisites:** LA-018 implemented

**Files to Change:**
- `tests/e2e/numberComprehension.e2e.test.js` - Create test file

**Implementation Steps:**
1. Navigate to number lesson
2. Verify finger image visible (for 1-10)
3. Verify audio plays
4. Test numeric input

**Definition of Done Checklist:**
- [ ] Finger image visible
- [ ] Audio plays
- [ ] Numeric input works
- [ ] Screenshot captured

**Test Commands:**
```bash
npx playwright test tests/e2e/numberComprehension.e2e.test.js
```

**MCP Playwright Validation:**
```
1. mcp_playwright_browser_navigate to number lesson
2. mcp_playwright_browser_click play audio
3. mcp_playwright_browser_evaluate(() => {
     const audio = document.querySelector('audio');
     return audio?.currentTime > 0;
   }) - verify played
4. mcp_playwright_browser_snapshot - verify finger image
5. mcp_playwright_browser_type("5")
6. mcp_playwright_browser_take_screenshot("test-results/TV-004-number.png")
```

**Commit:**
```bash
git commit -m "[TV-004] MCP Playwright Scenario 4 - Numbers (Sources: 40, 59, 60)

Implementation:
- Number comprehension test
- Finger image verified
- Audio playback verified

Testing:
- E2E: numberComprehension.e2e.test.js - ✅

Evidence:
- Screenshot: test-results/TV-004-number.png"
```

---

### Task: TV-005 - MCP Playwright Scenario 5 (Dictation)

**Branch:** `test/TV-005-dictation`

**Prerequisites:** LA-011 implemented

**Files to Change:**
- `tests/e2e/dictation.e2e.test.js` - Create test file

**Implementation Steps:**
1. Navigate to dictation lesson
2. Verify audio plays
3. Test speed slider interaction
4. Verify slider affects playback rate
5. Check WER score displays

**Definition of Done Checklist:**
- [ ] Speed slider affects playback
- [ ] WER score shown
- [ ] Screenshot captured

**Test Commands:**
```bash
npx playwright test tests/e2e/dictation.e2e.test.js
```

**MCP Playwright Validation:**
```
1. mcp_playwright_browser_navigate to dictation lesson
2. mcp_playwright_browser_click play
3. mcp_playwright_browser_click speed slider, drag to 0.75
4. mcp_playwright_browser_evaluate(() => {
     const audio = document.querySelector('audio');
     return audio?.playbackRate;
   }) - verify < 1.0
5. mcp_playwright_browser_type transcript
6. mcp_playwright_browser_click submit
7. mcp_playwright_browser_snapshot - verify WER score
8. mcp_playwright_browser_take_screenshot("test-results/TV-005-dictation.png")
```

**Commit:**
```bash
git commit -m "[TV-005] MCP Playwright Scenario 5 - Dictation (Sources: 38, 39)

Implementation:
- Dictation test with speed control
- Slider affects playback rate
- WER score displayed

Testing:
- E2E: dictation.e2e.test.js - ✅

Evidence:
- Screenshot: test-results/TV-005-dictation.png"
```

---

### Task: TV-006 - MCP Playwright Scenario 6 (Adaptive)

**Branch:** `test/TV-006-adaptive`

**Prerequisites:** AI-002 implemented

**Files to Change:**
- `tests/e2e/adaptive.e2e.test.js` - Create test file

**Implementation Steps:**
1. Seed profile with specific weaknesses
2. Navigate to lesson
3. Verify exercise selection differs from default
4. Compare with new user

**Definition of Done Checklist:**
- [ ] Seeded profile loads correctly
- [ ] Exercise mix differs from default
- [ ] Screenshot of both profiles

**Test Commands:**
```bash
npx playwright test tests/e2e/adaptive.e2e.test.js
```

**MCP Playwright Validation:**
```
1. Clear storage, navigate to lesson
2. mcp_playwright_browser_evaluate(() => window.exerciseTypes) - capture default
3. mcp_playwright_browser_take_screenshot("test-results/TV-006-new.png")
4. Seed profile with weak /ão/ phoneme + 60 interactions
5. Navigate to lesson
6. mcp_playwright_browser_evaluate(() => window.exerciseTypes) - should differ
7. mcp_playwright_browser_take_screenshot("test-results/TV-006-seeded.png")
```

**Commit:**
```bash
git commit -m "[TV-006] MCP Playwright Scenario 6 - Adaptive (Sources: 37)

Implementation:
- Adaptive path verification
- Seeded vs new user comparison
- Exercise mix differs based on profile

Testing:
- E2E: adaptive.e2e.test.js - ✅

Evidence:
- Screenshots: TV-006-new.png, TV-006-seeded.png"
```

---

### Task: TV-007 - MCP Playwright Scenario 7 (Titles)

**Branch:** `test/TV-007-titles`

**Prerequisites:** LA-002, LA-003 implemented

**Files to Change:**
- `tests/e2e/titles.e2e.test.js` - Create test file

**Implementation Steps:**
1. Navigate to lesson grid
2. Extract all titles
3. Verify all are English
4. Verify sublines exist

**Definition of Done Checklist:**
- [ ] All English titles visible
- [ ] All sublines visible
- [ ] Screenshot captured

**Test Commands:**
```bash
npx playwright test tests/e2e/titles.e2e.test.js
```

**MCP Playwright Validation:**
```
1. mcp_playwright_browser_navigate("http://localhost:63436/learn")
2. mcp_playwright_browser_evaluate(() => {
     const cards = document.querySelectorAll('.lesson-card');
     return Array.from(cards).map(c => ({
       title: c.querySelector('.title')?.textContent,
       subline: c.querySelector('.subline')?.textContent
     }));
   })
3. Verify all titles are English, all sublines exist
4. mcp_playwright_browser_take_screenshot("test-results/TV-007-titles.png")
```

**Commit:**
```bash
git commit -m "[TV-007] MCP Playwright Scenario 7 - Titles

Implementation:
- Title verification test
- All English titles confirmed
- All sublines present

Testing:
- E2E: titles.e2e.test.js - ✅

Evidence:
- Screenshot: test-results/TV-007-titles.png"
```

---

### Task: TV-008 - MCP Playwright Scenario 8 (Practice-First)

**Branch:** `test/TV-008-practice-first`

**Prerequisites:** LA-001 implemented

**Files to Change:**
- `tests/e2e/practiceFirst.e2e.test.js` - Create test file

**Implementation Steps:**
1. Navigate to any lesson
2. Verify first screen is exercise
3. Verify no word-list DOM element

**Definition of Done Checklist:**
- [ ] First screen is exercise
- [ ] No word-list DOM
- [ ] Screenshot captured

**Test Commands:**
```bash
npx playwright test tests/e2e/practiceFirst.e2e.test.js
```

**MCP Playwright Validation:**
```
1. mcp_playwright_browser_navigate to any lesson
2. mcp_playwright_browser_evaluate(() => {
     return document.querySelector('[class*="word-list"]') === null;
   }) - must be true
3. mcp_playwright_browser_evaluate(() => {
     return document.querySelector('input, button[data-exercise], .tile') !== null;
   }) - must be true
4. mcp_playwright_browser_take_screenshot("test-results/TV-008-practice.png")
```

**Commit:**
```bash
git commit -m "[TV-008] MCP Playwright Scenario 8 - Practice-First (Sources: 2)

Implementation:
- Practice-first verification
- No word-list DOM confirmed
- First screen is exercise

Testing:
- E2E: practiceFirst.e2e.test.js - ✅

Evidence:
- Screenshot: test-results/TV-008-practice.png"
```

---

### Task: TV-009 - Unit Tests for Exercise Types

**Branch:** `test/TV-009-exercise-unit-tests`

**Prerequisites:** LA-006 through LA-020 implemented

**Files to Change:**
- `tests/unit/exerciseTypes.test.js` - Create comprehensive tests

**Implementation Steps:**
1. Create unit test for each of 15 exercise types
2. Test rendering logic
3. Test validation logic
4. Test telemetry emission

**Definition of Done Checklist:**
- [ ] All 15 types have tests
- [ ] Render tests pass
- [ ] Validation tests pass
- [ ] Telemetry tests pass

**Test Commands:**
```bash
npx playwright test tests/unit/exerciseTypes.test.js
```

**Commit:**
```bash
git commit -m "[TV-009] Unit tests for all 15 exercise types

Implementation:
- Unit tests for all 15 exercise types
- Render, validation, telemetry coverage

Testing:
- Unit tests: exerciseTypes.test.js - ✅"
```

---

### Task: TV-010 - Integration Tests for AI Pipeline

**Branch:** `test/TV-010-ai-integration`

**Prerequisites:** AI-001 through AI-007 implemented

**Files to Change:**
- `tests/integration/aiPipeline.test.js` - Create integration tests

**Implementation Steps:**
1. Test AIAgent → LearnerProfiler → StuckWordsService flow
2. Test phase transitions (1→2→3)
3. Test rescue technique triggering
4. Test tip generation pipeline

**Definition of Done Checklist:**
- [ ] Full pipeline flow tested
- [ ] Phase transitions work
- [ ] Rescue triggers correctly
- [ ] Tips generate correctly

**Test Commands:**
```bash
npx playwright test tests/integration/aiPipeline.test.js
```

**Commit:**
```bash
git commit -m "[TV-010] Integration tests for AI pipeline

Implementation:
- AIAgent → LearnerProfiler → StuckWordsService flow
- Phase transition tests
- Rescue and tip generation tests

Testing:
- Integration tests: aiPipeline.test.js - ✅"
```

---

### Task: LM-001 - Model Registry Implementation

**Branch:** `feature/LM-001-model-registry`

**Prerequisites:** None

**Files to Change:**
- `src/config/models.config.js` - Create registry
- `src/services/ai/AIAgent.js` - Use registry

**Implementation Steps:**
1. Create MODEL_REGISTRY object
2. Define ollama-qwen, ollama-llama, openai-gpt4, anthropic-claude
3. Include: provider, modelId, endpoint, contextLimit, costWeight, capabilities
4. Set DEFAULT_MODEL and FALLBACK_MODEL

**Definition of Done Checklist:**
- [ ] Registry schema implemented
- [ ] Multiple models defined
- [ ] Default and fallback set
- [ ] Unit test confirms structure

**Test Commands:**
```bash
npx playwright test tests/unit/modelsConfig.test.js
```

**MCP Playwright Validation:**
```
1. mcp_playwright_browser_navigate to app
2. mcp_playwright_browser_evaluate(() => {
     return Object.keys(window.MODEL_REGISTRY || {});
   }) - verify multiple models
3. mcp_playwright_browser_take_screenshot("test-results/LM-001-registry.png")
```

**Commit:**
```bash
git commit -m "[LM-001] Implement model registry (Sources: 55)

Implementation:
- MODEL_REGISTRY with 4 models
- Provider, contextLimit, capabilities defined
- DEFAULT_MODEL: ollama-qwen
- FALLBACK_MODEL: ollama-qwen

Testing:
- Unit tests: modelsConfig.test.js - ✅

Evidence:
- Screenshot: test-results/LM-001-registry.png"
```

---

### Task: LM-002 - Model Selection from Config

**Branch:** `feature/LM-002-model-selection`

**Prerequisites:** LM-001 (Registry)

**Files to Change:**
- `src/services/ai/AIAgent.js` - Add selection logic

**Implementation Steps:**
1. Add `selectModel(config)` function
2. Read model preference from config
3. Switch model at runtime via config change
4. No code change needed to switch models

**Definition of Done Checklist:**
- [ ] Config change switches model
- [ ] No code change needed
- [ ] Unit test confirms switching

**Test Commands:**
```bash
npx playwright test tests/unit/aiAgent.test.js --grep "model-selection"
```

**Commit:**
```bash
git commit -m "[LM-002] Implement model selection from config (Sources: 55)

Implementation:
- selectModel() reads from config
- Runtime model switching
- No code changes needed

Testing:
- Unit tests: aiAgent.test.js - ✅"
```

---

### Task: LM-003 - Fallback to Local on Failure

**Branch:** `feature/LM-003-fallback`

**Prerequisites:** LM-002 (Model selection)

**Files to Change:**
- `src/services/ai/AIAgent.js` - Add fallback logic

**Implementation Steps:**
1. Test remote model connectivity before use
2. On failure, log warning and fall back to Ollama
3. Retry remote periodically
4. Always have local Ollama as safety net

**Definition of Done Checklist:**
- [ ] Remote failure falls back to Ollama
- [ ] Fallback logged
- [ ] Unit test confirms fallback

**Test Commands:**
```bash
npx playwright test tests/unit/aiAgent.test.js --grep "fallback"
```

**Commit:**
```bash
git commit -m "[LM-003] Implement fallback to local (Sources: 55)

Implementation:
- Remote model failure detection
- Automatic fallback to Ollama
- Fallback logged for monitoring

Testing:
- Unit tests: aiAgent.test.js - ✅"
```

---

### Task: LM-004 - Model Logging Per Turn

**Branch:** `feature/LM-004-model-logging`

**Prerequisites:** LM-002 (Model selection)

**Files to Change:**
- `src/services/ai/AIAgent.js` - Add logging

**Implementation Steps:**
1. Log model ID with every AI response
2. Include: modelId, provider, promptTokens, responseTokens, durationMs
3. Use Logger.info('ai_model_usage', {...})

**Definition of Done Checklist:**
- [ ] Every response logs model ID
- [ ] Includes token counts and duration
- [ ] Unit test confirms logging

**Test Commands:**
```bash
npx playwright test tests/unit/aiAgent.test.js --grep "logging"
```

**Commit:**
```bash
git commit -m "[LM-004] Implement model logging per turn (Sources: 55)

Implementation:
- ai_model_usage event on every response
- modelId, provider, tokens, duration logged

Testing:
- Unit tests: aiAgent.test.js - ✅"
```

---

### Task: LM-005 - Context Capping Per Model

**Branch:** `feature/LM-005-context-capping`

**Prerequisites:** LM-001 (Registry with contextLimit)

**Files to Change:**
- `src/services/ai/AIAgent.js` - Add truncation

**Implementation Steps:**
1. Check prompt length against model.contextLimit
2. If exceeds, truncate with warning
3. Use `truncateContext(prompt, limit)` helper
4. Log when truncation occurs

**Definition of Done Checklist:**
- [ ] Context respects model metadata
- [ ] Truncation if needed
- [ ] Warning logged on truncation

**Test Commands:**
```bash
npx playwright test tests/unit/aiAgent.test.js --grep "context"
```

**Commit:**
```bash
git commit -m "[LM-005] Implement context capping (Sources: 55)

Implementation:
- Context length check per model
- Truncation with warning log
- Respects contextLimit metadata

Testing:
- Unit tests: aiAgent.test.js - ✅"
```

---

### Task: LM-006 - Provider-Agnostic Prompts

**Branch:** `feature/LM-006-agnostic-prompts`

**Prerequisites:** LM-001 (Multiple providers)

**Files to Change:**
- `src/services/ai/AIAgent.js` - Add sanitization
- All prompt files

**Implementation Steps:**
1. Create `sanitizePrompt(prompt, model)` function
2. Strip provider-specific tokens ([INST], <|im_start|>, etc.)
3. Apply to all prompts before sending
4. Test with multiple providers

**Definition of Done Checklist:**
- [ ] No provider-specific tokens
- [ ] Strip formatting before send
- [ ] Works with all registered models

**Test Commands:**
```bash
npx playwright test tests/unit/aiAgent.test.js --grep "sanitize"
```

**Commit:**
```bash
git commit -m "[LM-006] Implement provider-agnostic prompts (Sources: 55)

Implementation:
- sanitizePrompt() strips provider tokens
- [INST], <|im_start|>, etc. removed
- Works with all providers

Testing:
- Unit tests: aiAgent.test.js - ✅"
```

---

## Task Dependency Graph

```
                    ┌─────────────┐
                    │   TM-001    │ (User-prefixed storage)
                    │   TM-002    │ (Event emission)
                    └──────┬──────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
    ┌─────────┐      ┌─────────┐      ┌─────────┐
    │ LA-001  │      │ AI-001  │      │ LM-001  │
    │ LA-002  │      │ AI-002  │      │ LM-002  │
    │   ...   │      │   ...   │      │   ...   │
    │ LA-021  │      │ AI-007  │      │ LM-006  │
    └────┬────┘      └────┬────┘      └────┬────┘
         │                │                │
         └────────────────┼────────────────┘
                          │
                          ▼
                    ┌─────────────┐
                    │   TV-001    │
                    │   TV-002    │ (MCP Playwright Scenarios)
                    │     ...     │
                    │   TV-010    │
                    └─────────────┘
```

**Recommended Execution Order:**
1. **TM-001, TM-002** - Telemetry foundation (parallel)
2. **LA-001 through LA-005** - Core lesson architecture
3. **LA-006 through LA-020** - Exercise types (can parallelize)
4. **AI-001 through AI-007** - AI adaptation (sequential)
5. **LM-001 through LM-006** - LLM interchangeability
6. **TV-001 through TV-010** - Validation scenarios (after features)
7. **LA-021** - Asset preload (anytime, independent)

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

