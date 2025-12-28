# Fun Learning Adjustments (2025-12-27)

Context: Requested lighter pronunciation gating, no hard stops, and engaging-but-fair helpers.

## What changed
- Pronunciation challenges now allow **Continue** after any attempt (no lock-outs). Retry remains available, but you can move on immediately.
- Failed pronunciation attempts instantly flag the word as **weak** and log the score; the best score still travels with the lesson state.
- Per-attempt scoring is tracked for analytics (`pronunciationLog` + event stream + ProgressTracker), so difficulty can adapt without blocking progress.
- Added **English-only hover gloss** on the English meaning in learn cards for playful hints (memory tip/origin/usage). Portuguese text never receives hover translations to avoid spoilers.
- Continue button messaging reflects whether you passed or are moving on with a flagged word.
- Hero CTA fixed: **Start Learning Free** now jumps straight to the Learn view and works after page load (regression fixed by removing a syntax break in `ChallengeRenderer`).
- Options panel always has starter content: fallback memory/grammar/usage/examples are auto-generated so no section is blank; AI Tips show a starter prompt if there’s no history yet (asks the user to run Personal Pronouns to seed data).
- Speech recognition locked to **pt-PT** with Portuguese-only fallbacks (no silent switch to English). Pronunciation scorer still honors known PT phonetic variations.

## Why this meets the ask
- Keeps it **fun/not rock hard**: no hard stop on pronunciation, gentle retry with optional continue.
- Still **tracks right vs wrong**: weak-word tagging + score logs + best-score map.
- Adds an **engaging helper**: hover gloss gives a small English-side hint only, so Portuguese challenge integrity stays intact.
- Aligns with research direction: maintains pronunciation checks while lowering friction and preserving telemetry for adaptive tips.1
