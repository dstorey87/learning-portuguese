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

Active workstream (v0.4.0 audio reintroduction)
- [x] Align visible version badge, README, and tests to v0.4.0.
- [x] Add ops guardrails (operations.md) and contributor workflow references in README.
- [x] Ensure Playwright + lint run as gate (`npm test`), plus manual browser check for changed UI.
- [x] Keep manual test plan current to match implemented flows.
- [x] Layer lesson practice packs: hero imagery per lesson, fill-in-the-blank drills, EU-PT speech checks (Web Speech API) with fallback, and mixed lesson quizzes (MCQ + fill + speech) that feed streak/SRS/accuracy.

Next enforcement actions
- [ ] Ensure VS Code has "Use instruction files" enabled so .github/copilot-instructions.md is loaded for Copilot Chat.
- [ ] Load .github/instructions/enforcement.prompt.md in Copilot Chat when starting tasks to reinforce the workflow.

Current change set
- [x] Remove all audio functionality, voice UI, and audio.js for a clean slate.
- [x] Remove the dashboard Voice Settings card to simplify the user dashboard layout.
- [x] Move default local/webServer port off 4174 to avoid conflicts with MCP servers.
- [x] Seeded voice state defaults (source selection, bundled download flags, progress tracking) to support the audio reintroduction work.
- [x] Reintroduce audio with EU-PT-only voices (free/no-signup), on-demand bundled model, and dashboard picker. Dashboard detects EU-PT system voices, saves a preferred key, plays the demo phrase, reloads a clean voice state from storage defaults; diagnostics UI shows availability/selection/last playback. Bundled download streams with progress, validates SHA-256, writes to cache when available, supports cancel/delete, offline guard, per-voice metadata, and system-first routing with bundled opt-out. Bundled catalog is Piper EU-PT (tugão, medium) only; bundled playback is routed via a user-provided HTTP TTS endpoint (JSON `{text, lang, voiceKey, modelUrl}` → audio). Reference FastAPI/uvicorn server with Dockerfile lives in `tts-server/` for quick hosting; playback still depends on deploying that or another reachable endpoint.
- [x] Add refreshed voice settings layout (picker + demo phrase) styling to support the upcoming audio reintroduction.

Next steps
- [ ] Ship EU-PT voice layer: system voices first, on-demand Piper medium fallback, no BR voices; disable bundled when a system voice is present if the user opts out. (Remaining: host a default HTTP TTS endpoint with CORS and wire a default URL/health check for the bundled path.)
- [ ] Finalize dashboard voice picker behavior (auto/system/bundled), demo play, saved default voice, and graceful diagnostics even when voices are missing. (Remaining: add automated coverage for bundled path once a test endpoint is available; ensure default URL prefill once hosted.)
- [ ] Implement on-demand download flow for bundled voice (size notice, progress, caching/eviction, offline retry) and enforce playback routing through the chosen source. (Core download + hash + cache + cancel/delete shipped; HTTP endpoint playback path added; remaining: optional additional bundled voices and e2e test covering bundled playback when endpoint is reachable.)
- [ ] Update docs and tests to match the revised voice flow (free-only, no sign-up) and keep text-only fallback path valid until voice assets are downloaded.

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

