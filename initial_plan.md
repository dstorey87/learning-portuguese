Product vision
- Publish a free-to-host website for learning European Portuguese that feels like a Duolingo-style experience, usable in any browser and friendly to Android/iOS app shells.
- Premium layer with strategic paywall; minimal ads until users finish basics (hello/please/thank you).
- Creator-quality experience: visually strong, engaging, and inspired by proven language-learning methods.

Non-negotiable requirements
- Hosting must be 100% free (static-friendly stack preferred).
- Duolingo-like section for lessons and practice; browser-first, app-friendly.
- Paywall for advanced content; ads held back until post-basics.
- Learned words vault: every learned word stored for personal review in its own section.
- Word-by-word learning path (basics → intermediate → advanced) that remains engaging.
- Audio everywhere: hover/tap to hear EN and PT; EN/extra audio unlocks with premium.
- Only European Portuguese (voices, examples, spelling).

Core feature set
- Lesson flows: word-by-word drills, sentences, spaced review, streaks.
- Vault: searchable/sortable list of learned words with revisit audio.
- Audio layer: hover/tap playback, gender switch, EN/PT playback; premium unlocks extra voices/audio.
- Paywall: basic greetings free; gated premium units beyond the intro band.
- Cross-platform: PWA-friendly for Android/iOS wrapping; keep everything browser-usable.
- Dashboard: progress, streak, premium status, quick review entry points.

Experience/engagement ideas (keep from earlier asks)
- Human pronunciation feedback path and/or tutor booking surface.
- AI conversation practice for PT-EU, with voice input/output.
- Visual design: bold cards/graphics, dynamic feel akin to top learning apps.

Roadmap draft
1) Foundation: free static hosting, PWA baseline, core lesson player, vault, basic audio (PT-EU voice), paywall scaffold.
2) Engagement: streaks, badges, spaced review, vault search/sort, gender/voice toggles.
3) Premium layer: unlock EN audio, extra voices, advanced units, reduced ads.
4) Conversational layer: AI chat, pronunciation feedback/human review hooks.

Process anchors
- Canonical workflow and rules live in operations.md; follow its checklist for every change.
- Plan updates are required per change; keep this file in sync with delivered work.

Tracking checklist (implementation-facing)
- [ ] Free hosting target chosen (e.g., GitHub Pages/Netlify/Vercel free tier).
- [ ] Lesson player: Duolingo-like drills; browser and mobile friendly.
- [ ] Paywall: gates post-basics; minimal ads pre-paywall.
- [ ] Learned words vault with review (audio restored with EU-PT voices only).
- [ ] Word-by-word path across levels (basic/intermediate/advanced) with engagement hooks.
- [ ] Audio layer: EU-PT only, free/no-signup voices; system-first, on-demand bundled Piper medium fallback; no BR voices ever.
- [ ] EU Portuguese only (voices and content).
- [ ] Dashboard for progress, streak, premium state.
- [ ] Optional: human pronunciation pipeline + AI conversation practice.

Active workstream (v0.4.0 memory science enhancement)
- [x] Align visible version badge, README, and tests to v0.4.0.
- [x] Add ops guardrails (operations.md) and contributor workflow references in README.
- [x] Ensure Playwright + lint run as gate (`npm test`), plus manual browser check for changed UI.
- [x] Keep manual test plan current to match implemented flows.
- [x] Layer lesson practice packs: hero imagery per lesson, fill-in-the-blank drills, EU-PT speech checks (Web Speech API) with fallback, and mixed lesson quizzes (MCQ + fill + speech) that feed streak/SRS/accuracy.
- [x] Implement SM-2 Spaced Repetition System with 5 levels (L1=1d, L2=3d, L3=7d, L4=14d, L5=30d intervals) with ease factor adjustments (1.3-2.5).
- [x] Add Mnemonic Memory Aids with phonetic guides and memory hooks for 16+ key words (obrigado, olá, bom/boa, etc.).
- [x] Implement Listening Comprehension mode (audio-only drills with speed control: 0.75x/1x/1.25x).
- [x] Add Interleaved Review mode (cross-lesson word mixing for better retention).
- [x] Build Progress Analytics Dashboard with retention curves, forgetting curves, weak word tracking, and study stats.
- [x] Create Real-World Dialogues system with 3 interactive scenarios (café ordering, asking directions, shopping at market) with branching nodes, grammar notes, and cultural context.
- [x] Implement Grammar Context Cards (ser/estar, por/para, gender agreement, plurals) with automatic triggers during practice.
- [x] Add Export/Import Data functionality (JSON backup/restore for all user progress).
- [x] Wire up navigation and UI for all new features (buttons, modals, analytics charts, dialogue player).

Current change set
- [x] Remove all audio functionality, voice UI, and audio.js for a clean slate.
- [x] Remove the dashboard Voice Settings card to simplify the user dashboard layout.
- [x] Move default local/webServer port off 4174 to avoid conflicts with MCP servers.
- [x] Seeded voice state defaults (source selection, bundled download flags, progress tracking) to support the audio reintroduction work.
- [x] Reintroduce audio with EU-PT-only voices (free/no-signup), on-demand bundled model, and dashboard picker. Dashboard detects EU-PT system voices, saves a preferred key, plays the demo phrase, reloads a clean voice state from storage defaults; diagnostics UI shows availability/selection/last playback. Bundled download streams with progress, validates SHA-256, writes to cache when available, supports cancel/delete, offline guard, per-voice metadata, and system-first routing with bundled opt-out. Bundled catalog is Piper EU-PT (tugão, medium) only; bundled playback is routed via a user-provided HTTP TTS endpoint (JSON `{text, lang, voiceKey, modelUrl}` → audio). Reference FastAPI/uvicorn server with Dockerfile lives in `tts-server/` for quick hosting; playback still depends on deploying that or another reachable endpoint.
- [x] Add refreshed voice settings layout (picker + demo phrase) styling to support the upcoming audio reintroduction.
- [x] Implement comprehensive memory science techniques: SM-2 SRS (5 levels), mnemonics (16+ words), listening drills, interleaved review, progress analytics (charts + stats), dialogues (3 scenarios), grammar cards (4 categories), export/import data.
- [x] Add navigation link for Dialogues section and ensure proper routing.
- [x] Fix all lint errors and maintain test coverage (3/3 Playwright tests passing).

v0.5.0 feature set (completed)
- [x] Translator section: English → EU Portuguese translation with phrase dictionary (40+ common phrases) and word-by-word fallback (70+ words). Includes grammar notes and cultural context.
- [x] Personal notepad: CRUD operations (add/delete), localStorage persistence, speak button for TTS playback of saved items.
- [x] Voice speed control: slider (0.5x–2.0x) wired to voiceState for TTS playback rate adjustment.
- [x] Voice gender filter: dropdown to filter voice list by male/female/all voices.
- [x] CSS styling: new translator-section, notepad-section, voice-controls-grid with responsive mobile layouts.
- [x] Version bump: 0.4.0 → 0.5.0 across package.json, index.html footer, and test assertions.
- [x] All 3 Playwright tests passing; browser verification confirms translator and notepad work end-to-end.
- [x] **6 High-Quality EU-PT Voice Catalog** (3 female + 3 male):
  - 👩 **Female voices**: Joana (Piper, recommended ⭐), Sofia (Coqui), Helena (eSpeak-NG)
  - 👨 **Male voices**: Duarte (Piper, recommended ⭐), Ricardo (Coqui), Miguel (eSpeak-NG)
  - Voice picker now groups voices by gender with quality indicators (💎 high, standard, basic)
  - "Coming soon" labels for voices pending model hosting
  - Voice count badge: "🎤 6 EU-PT Voices (3F/3M)"
- [x] **Karaoke-Style Word Highlighting**:
  - Character-by-character highlighting during TTS playback
  - Portuguese text highlights in accent color with glow effect
  - English translation highlights in sync (proportional mapping)
  - Progress bar shows playback position
  - Compact clickable text cards (no bulky buttons)
  - "🔊 Click to hear" hint that fades during playback
  - Sentence cards with word-by-word highlighting for phrases
  - Uses Web Speech API onboundary events when available
- [x] **Voice Selection UX Improvement**:
  - Voice selection now auto-persists immediately on change (no save button needed)
  - "Confirm" button changed to ghost style (optional confirmation)
  - Diagnostics message updates instantly: "✓ Voice activated and saved."
- [x] **Comprehensive PT-PT TTS Research (2025)**:
  - Created docs/TTS_RESEARCH_2025.md with full analysis of 10+ TTS providers
  - Edge-TTS identified as best free option (3 PT-PT neural voices)
  - Chatterbox Multilingual for self-hosted voice cloning (22 languages)
  - Azure/Polly for enterprise (Duolingo uses Polly)
  - Fish Audio for voice cloning API
  - Documented what language learning apps use (Babbel/Pimsleur use recordings)
  - Ranked options by quality, cost, and integration difficulty
  - Recommended implementation strategy (Edge-TTS proxy → voice cloning)
- [x] **Simplified Voice UI**:
  - Single voice dropdown (replaced complex source/gender/filter UI)
  - Collapsible "📥 Download More Voices" section with download buttons
  - Shows downloadable voices (Joana Piper ~60MB) with progress tracking
  - Downloaded voices automatically appear in the main dropdown
  - Removed: voice source select, gender filter, voice diagnostics, bundled API URL input
  - Clean, minimal voice settings card focused on usability

Next steps
- [ ] Ship EU-PT voice layer: system voices first, on-demand Piper medium fallback, no BR voices; disable bundled when a system voice is present if the user opts out. (Remaining: host a default HTTP TTS endpoint with CORS and wire a default URL/health check for the bundled path.)
- [ ] Finalize dashboard voice picker behavior (auto/system/bundled), demo play, saved default voice, and graceful diagnostics even when voices are missing. (Remaining: add automated coverage for bundled path once a test endpoint is available; ensure default URL prefill once hosted.)
- [ ] Implement on-demand download flow for bundled voice (size notice, progress, caching/eviction, offline retry) and enforce playback routing through the chosen source. (Core download + hash + cache + cancel/delete shipped; HTTP endpoint playback path added; remaining: optional additional bundled voices and e2e test covering bundled playback when endpoint is reachable.)
- [ ] Update docs and tests to match the revised voice flow (free-only, no sign-up) and keep text-only fallback path valid until voice assets are downloaded.

v0.6.0 feature set (completed)
- [x] **AI Tutor with Neural TTS**: Honest feedback from local Ollama LLM (qwen2.5:7b default, llama3.1:8b fallback). Clearly identifies mistakes like a real teacher — no false praise.
- [x] **Edge-TTS Backend**: Express server (`npm run server` on port 3001) using `edge-tts` npm package for high-quality Microsoft neural voices.
- [x] **6 Neural Portuguese Voices**:
  - 🇵🇹 Portugal: Raquel (Female, default), Duarte (Male)
  - 🇧🇷 Brazil: Francisca (Female), António (Male), Thalita (Female, Multilingual), Macério (Male, Multilingual)
- [x] **Whisper Speech Recognition**: @xenova/transformers CDN integration for high-accuracy speech-to-text. Falls back to Web Speech API when Whisper unavailable.
- [x] **Pronunciation Practice**: Record yourself speaking with instant AI feedback and visual score bar.
- [x] **AI Status Dashboard**: Real-time status indicators for Edge-TTS server, Whisper model, and Ollama LLM.
- [x] **Voice Selection UI**: Choose from 6 neural voices in AI Tutor section with instant preview.
- [x] New dependencies: express@^4.18.2, cors@^2.8.5, edge-tts@^1.0.1, concurrently@^8.2.2 (dev).
- [x] New scripts: `npm run server` (starts TTS server), `npm run dev` (concurrently runs frontend + server).
- [x] All 3 Playwright tests passing; version bump 0.5.0 → 0.6.0.

v0.7.0 feature set (completed)
- [x] **Enhanced Flashcard System**:
  - Memory tips: Contextual learning aids with 6 categories (greetings, numbers, food, questions, polite, verbs, general) with 4-7 tips per category. Each flashcard gets a relevant memory tip.
  - Flashcard groups: Create custom groups (Default, etc.), move cards between groups, filter cards by group.
  - Anki export: Export flashcards to Anki-compatible .txt format with tags (portuguese, type, group). Includes import instructions.
  - CSV export: Export flashcards to CSV for spreadsheets with all metadata (Portuguese, English, Type, Group, Memory Tip, Note, Review Count, Difficulty).
  - Enhanced UI: Stats row (Cards Saved, Groups, Due for Review), group manager, export section, search/filter cards.
  - Spaced repetition improvements: Priority-based review (hard cards first, never-reviewed first), correct streak tracking.
  - Voice speed fix: Changed default from 1.0x to 0.6x (40% slower) for better comprehension.
- [x] **Language Fundamentals Topic** (10 new lessons):
  - Days of the Week (Segunda-feira through Domingo, + dia/semana/fim de semana)
  - Months of the Year (Janeiro through Dezembro, + mês/ano)
  - Numbers 20-100 (vinte e um, trinta, quarenta... cem, mil)
  - Time & Clock (hora, minuto, meio-dia, meia-noite, de manhã, etc.)
  - Colors (vermelho, azul, verde, amarelo, laranja, roxo, cor-de-rosa, branco, preto, cinzento)
  - Family Members (mãe, pai, filho/filha, irmão/irmã, avô/avó, tio/tia, primo/prima, marido, mulher, família)
  - Common Verbs (ser, estar, ter, fazer, ir, vir, poder, querer, saber, conhecer)
  - Seasons & Weather (primavera, verão, outono, inverno, sol, chuva, vento, nuvem, quente, frio)
  - Question Words (o quê, quem, onde, quando, porquê, como, quanto, qual)
  - Common Adjectives (grande, pequeno, bom/boa, mau/má, novo, velho, bonito, fácil, difícil, rápido)

v0.8.0 feature set (completed)
- [x] **Dedicated Pronunciation Challenge Phase**:
  - New lesson phase after learn-word: user must say each word aloud
  - 3 attempts per word with 65% pass threshold
  - Visual score meter with pass marker at 65%
  - Attempt tracking (1 of 3) with progressive hints
  - Failed words tracked as "weak words" for later review
  - Rich UI: record button, recording indicator, result comparison
- [x] **Enhanced AI Speech Recognition**:
  - Portuguese phoneme analysis engine with 7 pattern categories
  - Categories: nasals (ão, ões), sibilants (s, ç), vowel reduction, digraphs (nh, lh), rhotics, stress patterns, cedilla
  - Fuzzy matching for similar sounds (e.g., "bom" ≈ "boom")
  - Specific feedback on what user might be saying wrong
  - Smart scoring with partial credit for close pronunciations
- [x] **Word Knowledge Database** (word-knowledge.js):
  - 25+ detailed word entries with IPA transcription
  - Phoneme breakdowns, pronunciation tips, common mistakes
  - Example sentences and memory hooks
  - Fallback generator for words not in database
- [x] **Rich Teaching Cards** for learn-word phase:
  - Large word display with IPA pronunciation
  - Tips section with pronunciation guidance
  - Common mistakes and memory hooks
  - Listen button with native audio

v0.9.0 feature set (completed)
- [x] **Page-Based Navigation Architecture**:
  - Home page: Hero section with call-to-action, quick stats overview
  - Learn page: Lesson grid with topic filters, all lessons accessible
  - Practice page: Personal Vault with SRS flashcards and review quizzes
  - Profile page: Dashboard, Tips, Plans, and AI Tutor sections
  - Hash routing (#home, #learn, #practice, #profile) for deep linking
  - Fixed bottom navigation bar with 4 tabs
- [x] **Hearts System (Lives)**:
  - 5 hearts max, lose 1 per wrong answer
  - 30-minute automatic refill per heart
  - Hearts modal with countdown timer when depleted
  - Hearts persist via localStorage
  - Hearts display in top header
- [x] **Admin Mode**:
  - Triple-click logo to trigger login modal
  - Password: "portulingo2025"
  - Admin gets unlimited hearts (Infinity)
  - Admin badge displayed in header when active
- [x] **XP & Streak System**:
  - 10 XP per correct answer
  - 50 XP bonus on lesson completion
  - Daily streak tracking (consecutive learning days)
  - Visual badges in top header
- [x] **auth.js Module**:
  - Complete user state management
  - Hearts management (getHearts, hasHearts, loseHeart, refillHearts)
  - XP tracking (addXP, getXP)
  - Streak management (updateStreak, getStreak)
  - Admin login/logout with password verification
  - Heart refill timer with background processing
- [x] **Modern UI Refresh**:
  - Compact top header (60px) with logo, hearts, streak, XP
  - Fixed bottom navigation bar (70px) with icons and labels
  - Nunito font (replaced Poppins)
  - Smooth modal animations (slide-up)
  - Page fade-in transitions
  - Responsive design preserved
- [x] **Quiz Integration**:
  - Hearts check before starting lesson
  - Lose heart on wrong answer
  - Gain XP on correct answer
  - Hearts modal when out of hearts
  - XP bonus on lesson completion
- [x] All 3 Playwright tests updated and passing
- [x] Version bump 0.8.0 → 0.9.0

v0.10.0 roadmap (pending)
- [ ] User accounts: Backend integration (JWT/OAuth) for real user persistence
- [ ] Leaderboards: Weekly/monthly XP rankings among users
- [ ] Friend system: Add friends, see their progress
- [ ] Achievements: Badges for milestones (10-day streak, 100 XP, complete beginner path)
- [ ] Offline mode: Service worker for offline access to downloaded content

New scope (AI hints + tips + plans)
- [ ] Add local, free “AI” hinting that tracks user mistakes/success per lesson and surfaces tailored guidance (no remote APIs; use existing voice layer for spoken hints when available).
- [ ] Add a TIPS section with 2025-free resources, note-taking methods, and recommended mobile/desktop tools for learning EU Portuguese.
- [ ] Add Free Tier and Paid Tier learning plans with milestones, timelines, and proficiency definitions; gate premium details to premium users when applicable.
- [ ] Update README and tests to reflect the new hinting/tips/plan features; keep version text aligned.

Expanded execution order (full app build-out)
1) Lessons & content depth: add intermediate/advanced topics, richer sentences/gendered forms; add SRS buckets and switch vault quiz to multiple-choice; track per-lesson accuracy and time-on-task. **Progress:** Intermediate + advanced packs shipped (Vida Diária, Trabalho), SRS buckets visible in vault, quick review is now multiple choice, per-lesson accuracy/time tracked in dashboard insights. Remaining: continue sentence richness/gender coverage and refine scheduling weights.
	- Added: Expanded beginner runway with politeness, numbers, cafe survival, navigation basics, rapid replies, mini dialogues, and phrase-hack travel/restaurant cheats to make it feel like a fast-start “cheat sheet.”
	- Added: Lesson-level practice pack for all lessons: hero imagery, fill blanks, speak-and-check, and a per-lesson mixed quiz with scoring that feeds SRS/accuracy.
2) AI Coach maturity: expand heuristics (tenses, ser/estar, por/para, nasal vowels, gender, liaison), surface per-skill dashboards, add targeted “fix packs” for repeated errors. **Progress:** Skill dashboard live with heuristics for nasal vowels, gender, ser/estar, por/para, and tenses; fix packs and skill-scoped review buttons added. Remaining: deeper liaison/tone heuristics and per-skill history charts.
3) Voice layer finalization: default bundled TTS endpoint with health check/CORS note; inline playback tests for system vs bundled; optional cached sample to prove path without external TTS.
4) Premium gating & flows: gate advanced lessons/quizzes/plan details; mock checkout toggle; show unlock summaries and UI state changes.
5) Vault & review polish: filters for difficulty/recency, SRS buckets displayed; audio hover/tap; richer review (multiple-choice/spaced sets).
6) UI/UX polish: navigation anchors and mobile layout for new sections; accessibility labels and focus states. **Progress:** Light/dark theme toggle, compact buttons, new hero visuals/mood strip with real photography, favicon added to clear 404, denser cards. Remaining: anchors/focus styling and deeper mobile tweaks.
7) Docs & tests: README/manual test plan updates; Playwright coverage for SRS quiz, premium gating, AI Coach hints, bundled voice states; version alignment when visible.

 Notes
 - Do not drop any of the above requirements when implementing.
 - Keep the experience amazing-looking and inspired by leading language apps.
 - Keep Playwright pointed at this workspace: the test webServer now always starts fresh (no reuse of an existing server on :4321), so ensure port 4321 is free before running tests.

