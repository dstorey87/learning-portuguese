# PortuLingo - Learn European Portuguese 🇵🇹

A free, interactive website for learning European Portuguese word-by-word, inspired by Duolingo.

Current version: **0.9.0**

## Features

✅ **100% Free Hosting** - Designed for GitHub Pages, Netlify, or Vercel
✅ **Word-by-Word Learning** - Focus on memorizing individual words
✅ **Intermediate + Advanced Packs** - Vida Diária and Trabalho lessons with richer sentences and gendered forms
✅ **Expanded Beginner Path** - Added politeness, numbers, cafe survival, and navigation basics to the free track
✅ **Phrase-Hack Cheats** - Rapid replies, mini-dialogues, and travel/restaurant “get unstuck fast” phrases to accelerate early wins
✅ **Personal Vault** - Track all words you've learned
✅ **Quick Review Quiz** - Multiple-choice drill that pulls from your SRS buckets
✅ **SRS Buckets + Lesson Insights** - Bucketed review levels plus per-lesson accuracy and time-on-task
✅ **Vault Search & Sort** - Filter learned words by Portuguese/English
✅ **User Dashboard** - Monitor progress and manage settings
✅ **Completed Lesson Badges** - See which lessons you’ve finished
✅ **Lesson Practice Packs** - Each lesson now ships hero imagery, fill-in-the-blank drills, EU-PT speech checks (Web Speech API), and a mixed quiz (MCQ + fill + speech) with scoring
✅ **Versioned Build** - Footer badge shows current app version
✅ **Premium Paywall** - Unlock advanced features (placeholder for payment integration)
✅ **Progress Tracking** - Streak counter and completion percentage
✅ **Responsive Design** - Works on desktop and mobile
✅ **Theme Toggle + Tighter UI** - Navbar light/dark switch with persisted preference and compact buttons/cards
🖼️ **Illustrated Hero & Mood Strip** - Visual cards for Lisbon, coast, and travel vibes to make the landing less plain
🖼️ **Real Lisbon + Coast Photography** - Hero now uses Unsplash shots (tram + Atlantic) and ships a built-in favicon to avoid missing-icon 404s
🎧 **EU-PT Voice Layer** - System-first voices (no sign-up) with on-demand bundled Piper EU-PT (tugão, medium) download; dashboard picker with demo phrase preview and diagnostics.
🧠 **AI Tutor (local, free)** - Tracks mistakes/successes per word and serves tailored hints + quick checks; speaks hints with EU-PT voices when available.
📊 **Skill Dashboard + Fix Packs** - Auto-detects trouble areas (nasal vowels, gender, ser/estar, por/para, tenses) with targeted drills and one-tap reviews.
💡 **Tips & Learning Plans** - Free 2025 toolbox (note-taking, free apps, drills) plus Free Tier and Premium hero plans with timelines and proficiency targets.

### v0.9.0 New Features (Duolingo-Style UI Overhaul)

📱 **Page-Based Navigation**:
  - 🏠 **Home Page** - Hero section with call-to-action, quick stats overview
  - 📚 **Learn Page** - All lessons with topic filters and lesson grid
  - 🎯 **Practice Page** - Personal Vault with SRS flashcards and review quizzes
  - 👤 **Profile Page** - Dashboard, Tips, Plans, and AI Tutor sections

❤️ **Hearts System (Lives)**:
  - 💔 **5 Hearts Max** - Lose a heart for each wrong answer
  - ⏰ **30-Minute Refill** - Hearts regenerate one at a time
  - 🚫 **Out of Hearts Modal** - Shows countdown timer when depleted
  - 👑 **Admin Mode** - Unlimited hearts for testing (triple-click logo, password: portulingo2025)

⭐ **XP & Streak System**:
  - 📈 **Earn XP** - 10 XP per correct answer, 50 XP bonus on lesson completion
  - 🔥 **Daily Streak** - Tracks consecutive days of learning
  - 🏅 **Visual Badges** - XP and streak counters in top header

🎨 **Modern UI Refresh**:
  - 📱 **Fixed Bottom Navigation** - 4-tab bar (Home, Learn, Practice, Profile)
  - 🔝 **Compact Top Header** - Logo, hearts, streak, and XP always visible
  - ✨ **Nunito Font** - Clean, modern typography
  - 🎭 **Login/Hearts Modals** - Smooth slide-up animations
  - #️⃣ **Hash Routing** - Deep linking to pages (#home, #learn, #practice, #profile)

### v0.8.0 New Features (Rock-Solid Pronunciation System)

🎤 **Dedicated Pronunciation Challenge Phase**:
  - 📝 **Rich Word Teaching Cards** - Each word shows IPA, pronunciation guide, etymology, memory tricks, example sentences, grammar notes, usage context, and cultural insights
  - 🔊 **Auto-Play Audio** - Words auto-play when displayed for passive listening
  - 🧠 **Word Knowledge Database** - 25+ detailed word entries with EU-PT pronunciation guidance
  - 🎯 **Pronunciation Practice Phase** - After learning words, a dedicated phase tests speaking each word aloud
  - 📊 **Score Meter UI** - Visual progress bar showing pronunciation accuracy with pass/fail markers
  - 💡 **Phoneme-Specific Tips** - Detailed feedback on Portuguese sounds (nasals, sibilants, digraphs, etc.)
  - 🔄 **Multiple Attempts** - Up to 3 attempts per word with best-score tracking
  - ✅ **65% Pass Threshold** - Must achieve passing score to continue without marking word as "weak"

🗣️ **Enhanced AI Speech Recognition**:
  - 🔬 **Portuguese Phoneme Analysis** - Detects 7 phoneme pattern categories: nasals (ão, ã), sibilants (S→SH), vowel reduction, digraphs (lh, nh), rhotics (rr), stress patterns, cedilla (ç)
  - 📏 **Fuzzy Matching** - Levenshtein distance scoring with close-match detection (30% threshold)
  - 🎯 **Word-Level Analysis** - Identifies matched, missed, and close-match words
  - 💬 **Alternative Transcript Checking** - Checks multiple Web Speech API interpretations for best match
  - 🏆 **Rating System** - Excellent (90+), Good (75+), Fair (60+), Needs Work (40+), Try Again
  - 🔧 **Robust Error Handling** - Graceful degradation for no-speech, audio-capture, not-allowed, network, aborted errors

🎨 **Lesson Completion UI**:
  - 🟢 **Passed Lessons** - Green border (85%+ accuracy required)
  - 🟠 **Needs Work** - Orange border with encouragement message
  - 📊 **Stats Display** - Accuracy %, hearts remaining, words learned, weak words list
  - 🔄 **Retry Option** - One-click lesson restart for practice

### v0.7.0 New Features (Enhanced Flashcards + Language Fundamentals)

🃏 **Enhanced Flashcard System**:
  - 💡 **Memory Tips** - Contextual learning aids with 6 categories (greetings, numbers, food, questions, polite, verbs) with 4-7 tips per category
  - 📁 **Flashcard Groups** - Create custom groups, move cards between groups, filter by group
  - 📱 **Anki Export** - Export flashcards to Anki-compatible .txt format with import instructions for AnkiDroid/AnkiMobile
  - 📄 **CSV Export** - Export to spreadsheets with all metadata (Portuguese, English, Type, Group, Memory Tip, Note, Difficulty)
  - 📊 **Stats Dashboard** - Cards Saved, Groups count, Due for Review indicators
  - 🔄 **Smart Review** - Priority-based spaced repetition (hard cards first, never-reviewed first)
  - 🐢 **Slower Default Voice** - Changed from 1.0x to 0.6x for better comprehension

📚 **Language Fundamentals** (10 new lessons):
  - 📅 Days of the Week (Segunda-feira through Domingo)
  - 📆 Months of the Year (Janeiro through Dezembro)
  - 🔢 Numbers 20-100 (vinte, trinta... cem, mil)
  - ⏰ Time & Clock (hora, minuto, meio-dia, de manhã)
  - 🎨 Colors (vermelho, azul, verde, amarelo, etc.)
  - 👨‍👩‍👧‍👦 Family Members (mãe, pai, filho/filha, irmão/irmã)
  - ✨ Common Verbs (ser, estar, ter, fazer, ir, vir)
  - 🌤️ Seasons & Weather (primavera, verão, sol, chuva)
  - ❓ Question Words (o quê, quem, onde, quando, porquê)
  - 📝 Common Adjectives (grande, pequeno, bom/boa, fácil)

### v0.6.0 Features

🎤 **AI Tutor with Neural Voices** - Honest feedback from local AI using Ollama LLM (qwen2.5:7b default). No false praise — mistakes are clearly identified like a real teacher would.
🎙️ **6 Microsoft Neural Portuguese Voices** - Edge-TTS backend with high-quality voices:
  - 🇵🇹 Portugal: Raquel (Female, default), Duarte (Male)
  - 🇧🇷 Brazil: Francisca (Female), António (Male), Thalita (Female, Multilingual), Macério (Male, Multilingual)
🎯 **Pronunciation Practice** - Record yourself speaking and get instant AI feedback on your pronunciation.
🗣️ **Whisper Speech Recognition** - Optional Whisper model via @xenova/transformers for high-accuracy speech-to-text (Web Speech API fallback).
📊 **Pronunciation Scoring** - Visual score bar showing pronunciation accuracy compared to target phrase.
🖥️ **Edge-TTS Server** - Local Express backend (`npm run server`) for neural TTS — no API keys or cloud services required.
🔊 **Voice Selection UI** - Choose from 6 neural voices in the AI Tutor section with instant preview.
📡 **AI Status Dashboard** - Real-time status indicators for Edge-TTS, Whisper, and Ollama services.

### v0.5.0 Features

🌐 **English → Portuguese Translator** - Phrase dictionary (40+ common phrases) with word-by-word fallback (70+ words). Includes grammar notes and cultural context for nuanced translations.
📝 **Personal Notepad** - Save words and phrases to a personal notepad. CRUD operations with localStorage persistence. Speak button for TTS playback of saved items.
🎚️ **Voice Speed Control** - Slider (0.5x–2.0x) to adjust TTS playback speed for listening practice at your own pace.
👥 **Voice Gender Filter** - Filter available voices by male/female/all to find your preferred pronunciation model.
🎤 **6 High-Quality EU-PT Voices** - 3 female (Joana, Sofia, Helena) + 3 male (Duarte, Ricardo, Miguel) voices from Piper, Coqui, and eSpeak-NG. Recommended voices marked with ⭐, premium quality with 💎.
🎤 **Karaoke-Style Word Highlighting** - Character-by-character highlighting synced to TTS playback. Portuguese text glows as it's spoken, English translation highlights in sync. Progress bar, compact clickable text, and "🔊 Click to hear" hints. Sentences use word-by-word highlighting with Web Speech API boundary events.

## Free Hosting Options

### GitHub Pages (Recommended)
1. Create a GitHub account
2. Create a new repository named `learning-portuguese`
3. Upload all files (index.html, styles.css, app.js)
4. Go to Settings → Pages
5. Select main branch as source
6. Your site will be live at `https://yourusername.github.io/learning-portuguese`

### Netlify
1. Sign up at netlify.com
2. Drag and drop the folder
3. Get instant deployment

### Vercel
1. Sign up at vercel.com
2. Import your GitHub repository
✅ **Login-Gated Lessons** - Sign in to access beyond Basic Greetings
3. Auto-deploy on every update

## Technology & Voice Sources

- Frontend: HTML, CSS, JavaScript (ES modules), Playwright for UI tests, ESLint for linting.
- Hosting: static-friendly (GitHub Pages/Netlify/Vercel); local dev on port 4310.
- System voices (no accounts, offline once installed):
	- iOS/macOS: Siri “Joana”/“Inês” EU Portuguese; one-time download in Accessibility → Spoken Content.
	- Android/Pixel/Samsung: Google/Samsung TTS “Português (Portugal)” high-quality; one-time download in TTS settings.
	- Windows 11: Natural voices “Duarte”/“Fernanda” after installing the Portuguese (Portugal) language pack.
- Bundled on-demand (no sign-up, downloaded only when requested): Piper EU-PT medium model (default bundled voice). Estimated download: ~50–120 MB; cached locally with a clear/delete control. Playback requires an online HTTP TTS endpoint you supply (JSON POST with text/lang/voiceKey/modelUrl → binary audio response). A ready-to-run FastAPI/uvicorn server is provided under `tts-server/` (Dockerfile included); enable CORS for your site origin.
- Exclusions: No cloud API keys required, no `pt-BR` voices, no time-limited free-tier dependencies. Optional Coqui/Silero models may be added later if they meet EU-PT quality without sign-up.
- Demo phrase for previews (covers nasal vowels/prosody): “Olá! Vamos praticar português europeu: pão, coração, obrigado, vinte e oito.”

Planned audio flow
- System-first: use the installed EU-PT voice on the device. If a system voice exists, users can opt to disable bundled voices entirely.
- On-demand bundle: if no system EU-PT voice is present, offer to download the Piper medium model on first play; show size + progress; allow cancel; cache it locally with versioning/eviction controls.
- Picker UI (Dashboard): grouped dropdown (System vs Bundled), sample-play button using the demo phrase, “disable bundled voices” toggle, and “save default voice” action persisted locally.
- Playback routing: all lesson audio will go through a single voice service that enforces EU-PT-only selection and never falls back to BR Portuguese; text-only path remains available until a voice is installed/downloaded.

Roadmap highlights
- [x] Intermediate and advanced lessons
- [ ] Payment gateway integration (Stripe/PayPal)
- [ ] Mobile app version
- [ ] Spaced repetition algorithm (basic buckets live; expand scheduling)
- [ ] Community features
- [ ] Achievement system
- [x] Smarter review quizzes (multiple choice + spaced repetition)

## Getting Started

Simply open `index.html` in a web browser, or deploy to any of the free hosting platforms above.

## Manual End-to-End Test Plan (v0.6.0)

Local serve/test port: 4321. Ensure nothing else is running on 4321 before `npm test`; Playwright starts its own server for this repo and will fail or read the wrong UI if another app is bound there.

- Load site, ensure version pill shows v0.6.0.
- Toggle Dark Mode from the navbar switch, refresh page, confirm preference persists and UI remains legible.
- Use vault search to filter a word, switch sort between Portuguese/English, clear filters.
- Start Basic Greetings lesson, verify lesson hero image appears, play a word audio, complete it, confirm streak increments and vault shows learned words.
- In a lesson, try the new practice packs: fill-in-the-blank (English → Portuguese) and speech check (browser speech recognition, lang pt-PT). Verify feedback shows green/red; on unsupported browsers, see the fallback message.
- Run the lesson test: Start Quiz → answer MCQ + fill + speech; see score summary update Lesson Insights accuracy/time; SRS buckets should update when correct/incorrect answers are recorded.
- After completing a lesson, check Lesson Insights (dashboard) shows average accuracy/time and the SRS chips in the vault show bucket counts; repeat another lesson to see time-on-task update.
- Visit AI Coach: verify Skill Dashboard shows baseline stats; after a few review answers, see fix packs populate and the “Drill now” buttons open the multiple-choice review scoped to that skill.
- In Dashboard → Voice Settings, verify EU-PT system voice detection, save a default voice, refresh the page, and play the demo phrase to confirm the selection and state reload cleanly; ensure diagnostics lines show availability, selected voice, and last playback even without system voices installed. Toggle “Disable Bundled Voices” when a system voice is detected and re-enable/download to confirm the bundled path remains optional. Use “Download Bundled Voice” to stream/cache the Piper EU-PT (tugão, medium) model with SHA-256 validation — confirm the size prompt/confirmation and offline guard, then cancel mid-download and delete to clear; confirm diagnostics update accordingly. Configure the “Bundled TTS API URL” with an online endpoint that accepts `{ text, lang, voiceKey, modelUrl }` JSON and returns audio/wav or audio/ogg (e.g., run the provided `tts-server/` FastAPI service or your own endpoint), then play the demo phrase using the bundled source to confirm streamed playback. (Only this bundled voice is currently provided.)
- **Translator (v0.5.0):** Navigate to the Translator section. Type an English phrase like "hello, how are you" and click "Translate to PT". Verify the Portuguese translation appears with grammar notes. Click "Speak Portuguese" to hear the TTS playback. Click "Save to Notepad" and confirm the alert and that the notepad count increments.
- **Notepad (v0.5.0):** Navigate to the Notepad section. Verify saved items from translator appear. Manually add a new item using the add form (Portuguese, English, Notes fields). Click "Speak" on an item to hear TTS. Click "Delete" on an item to remove it. Confirm notepad count updates correctly.
- **Voice Speed (v0.5.0):** Adjust the Voice Speed slider (0.5x–2.0x). Play audio and confirm playback speed changes accordingly.
- **Voice Gender Filter (v0.5.0):** Use the Gender Filter dropdown to filter voices by male/female/all. Confirm the voice source dropdown updates to show only matching voices.
- Open dashboard: progress updates, account status is Free Plan.
- Run Quick Review Quiz: complete 3-5 multiple-choice questions, ensure correct options highlight green, wrong picks highlight red, and SRS chips update counts.
- AI Coach: after a wrong quiz answer, see a hint appear in AI Coach; play the word audio; use “Quick review” to retry.
- Tips/Plans: navigate to Tips and Plans sections; confirm free plan is visible and paid plan gates details until Premium is unlocked.
- Attempt Travel Basics lesson (gated) as free user: paywall appears.
- Click Subscribe in paywall: premium unlocks, paywall hides, gated lessons become accessible.
- Re-open dashboard: progress reflects unlocked lessons and premium status text.
- Use Reset Progress: vault clears, streak resets, progress returns to 0%.
- Audio (in progress): Voice picker and playback are being reintroduced with EU-PT-only voices. Bundled download streams and caches the Piper EU-PT (tugão, medium) model with hash verification, falling back to simulated progress only if the network blocks the download; verify picker groups (System vs Bundled), sample play of the demo phrase, diagnostics text (availability/selection/last playback), and that no BR voice appears.
- Canonical plan lives in initial_plan.md; update it with each change set.
- Tests gate changes: npm test (eslint + Playwright). Add Playwright cases for new UI paths.
- Perform a quick browser sanity check on touched UI using Playwright/mcp browser tools.
- Enable Copilot instruction files in VS Code (Settings → GitHub Copilot → Advanced → Use instruction files) so .github/copilot-instructions.md is applied to every chat.
- For Copilot Chat prompt seeding, use .github/instructions/enforcement.prompt.md to auto-apply the workflow steps.

## Contributor Checklist (must-do per change)

1. Update plan in initial_plan.md to reflect the change scope.
2. Implement the change; keep structure professional and refactor when needed.
3. Add or adjust tests for the change (Playwright/UI and any additional coverage).
4. Run `npm test` and fix failures immediately, rerunning until green.
5. Do an interactive browser poke on the changed surface (e.g., launch local serve + Playwright tools).
6. Update docs (README.md and relevant sections) and align visible version text if applicable.
7. Stage changes cleanly for commit (one logical unit).

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (may require user interaction for audio)

---

**License:** Free to use and modify
**Created:** 2025







