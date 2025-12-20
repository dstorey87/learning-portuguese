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

Next enforcement actions
- [ ] Ensure VS Code has "Use instruction files" enabled so .github/copilot-instructions.md is loaded for Copilot Chat.
- [ ] Load .github/instructions/enforcement.prompt.md in Copilot Chat when starting tasks to reinforce the workflow.

Current change set
- [x] Remove all audio functionality, voice UI, and audio.js for a clean slate.
- [x] Remove the dashboard Voice Settings card to simplify the user dashboard layout.
- [x] Move default local/webServer port off 4174 to avoid conflicts with MCP servers.
- [x] Seeded voice state defaults (source selection, bundled download flags, progress tracking) to support the audio reintroduction work.
- [ ] Reintroduce audio with EU-PT-only voices (free/no-signup), on-demand bundled model, and dashboard picker. (In progress: dashboard detects EU-PT system voices, saves a preferred key, plays the demo phrase, reloads a clean voice state from storage defaults; bundled download flow and source routing mostly scaffolded; diagnostics UI now present to show availability/selection/last playback.)
- [x] Add refreshed voice settings layout (picker + demo phrase) styling to support the upcoming audio reintroduction.

Next steps
- [ ] Ship EU-PT voice layer: system voices first, on-demand Piper medium fallback, no BR voices.
- [ ] Add dashboard voice picker (system vs bundled), sample-play with demo phrase, and saved default voice; allow disabling bundled voices when system voice exists.
- [ ] Implement on-demand download flow for bundled voice (size notice, progress, caching/eviction, offline retry) and global playback routing through the chosen voice.
- [ ] Update docs and tests to match the new voice flow (free-only, no sign-up) and keep text-only fallback path valid until voice assets are downloaded.

Notes
- Do not drop any of the above requirements when implementing.
- Keep the experience amazing-looking and inspired by leading language apps.

