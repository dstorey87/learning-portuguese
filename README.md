# PortuLingo - Learn European Portuguese 🇵🇹

A free, interactive website for learning European Portuguese word-by-word, inspired by Duolingo.

Current version: **0.4.0**

## Features

✅ **100% Free Hosting** - Designed for GitHub Pages, Netlify, or Vercel
✅ **Word-by-Word Learning** - Focus on memorizing individual words
✅ **Personal Vault** - Track all words you've learned
✅ **Quick Review Quiz** - Drill yourself on learned words
✅ **Vault Search & Sort** - Filter learned words by Portuguese/English
✅ **User Dashboard** - Monitor progress and manage settings
✅ **Completed Lesson Badges** - See which lessons you’ve finished
✅ **Versioned Build** - Footer badge shows current app version
✅ **Premium Paywall** - Unlock advanced features (placeholder for payment integration)
✅ **Progress Tracking** - Streak counter and completion percentage
✅ **Responsive Design** - Works on desktop and mobile
🎧 **EU-PT Voice Layer (in progress)** - System-first voices (no sign-up) with on-demand bundled Piper medium fallback; dashboard picker with demo phrase preview and diagnostics (availability/selection/last playback); no BR voices ever. Bundled download remains simulated while we finish the offline model path.

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

## Technology & Voice Sources (EU-PT only)

- Frontend: HTML, CSS, JavaScript (ES modules), Playwright for UI tests, ESLint for linting.
- Hosting: static-friendly (GitHub Pages/Netlify/Vercel); local dev on port 4310.
- System voices (no accounts, offline once installed):
	- iOS/macOS: Siri “Joana”/“Inês” EU Portuguese; one-time download in Accessibility → Spoken Content.
	- Android/Pixel/Samsung: Google/Samsung TTS “Português (Portugal)” high-quality; one-time download in TTS settings.
	- Windows 11: Natural voices “Duarte”/“Fernanda” after installing the Portuguese (Portugal) language pack.
- Bundled on-demand (no sign-up, downloaded only when requested): Piper EU-PT medium model (default bundled voice). Estimated download: ~50–120 MB; cached locally with a clear/delete control.
- Exclusions: No cloud API keys required, no `pt-BR` voices, no time-limited free-tier dependencies. Optional Coqui/Silero models may be added later if they meet EU-PT quality without sign-up.
- Demo phrase for previews (covers nasal vowels/prosody): “Olá! Vamos praticar português europeu: pão, coração, obrigado, vinte e oito.”

Planned audio flow
- System-first: use the installed EU-PT voice on the device. If a system voice exists, users can opt to disable bundled voices entirely.
- On-demand bundle: if no system EU-PT voice is present, offer to download the Piper medium model on first play; show size + progress; allow cancel; cache it locally with versioning/eviction controls.
- Picker UI (Dashboard): grouped dropdown (System vs Bundled), sample-play button using the demo phrase, “disable bundled voices” toggle, and “save default voice” action persisted locally.
- Playback routing: all lesson audio will go through a single voice service that enforces EU-PT-only selection and never falls back to BR Portuguese; text-only path remains available until a voice is installed/downloaded.

Roadmap highlights
- [ ] Intermediate and advanced lessons
- [ ] Payment gateway integration (Stripe/PayPal)
- [ ] Mobile app version
- [ ] Spaced repetition algorithm
- [ ] Community features
- [ ] Achievement system
- [ ] Smarter review quizzes (multiple choice + spaced repetition)

## Getting Started

Simply open `index.html` in a web browser, or deploy to any of the free hosting platforms above.

## Manual End-to-End Test Plan (v0.4.0)

Local serve/test port: 4310.

- Load site, ensure version pill shows v0.4.0.
- Toggle Dark Mode, refresh page, confirm preference persists and UI remains legible.
- Use vault search to filter a word, switch sort between Portuguese/English, clear filters.
- Start Basic Greetings lesson, complete it, confirm streak increments and vault shows learned words.
- In Dashboard → Voice Settings, verify EU-PT system voice detection, save a default voice, refresh the page, and play the demo phrase to confirm the selection and state reload cleanly; ensure diagnostics lines show availability, selected voice, and last playback even without system voices installed.
- Open dashboard: progress updates, account status is Free Plan.
- Run Quick Review Quiz: complete 3-5 questions, verify scoring and correct/incorrect states.
- Attempt Travel Basics lesson (gated) as free user: paywall appears.
- Click Subscribe in paywall: premium unlocks, paywall hides, gated lessons become accessible.
- Re-open dashboard: progress reflects unlocked lessons and premium status text.
- Use Reset Progress: vault clears, streak resets, progress returns to 0%.
- Audio (in progress): Voice picker and playback are being reintroduced with EU-PT-only voices. Bundled download is simulated while the offline model pipeline is finalized; verify picker groups (System vs Bundled), sample play of the demo phrase, diagnostics text (availability/selection/last playback), and that no BR voice appears.
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
