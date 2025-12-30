# Lesson System Architecture (Essentials)

Goal: make lessons fully data-driven so AI/custom lessons render without code changes.

## Problems to solve
- Legacy/legacy data split (data.js vs building-blocks) and challenge arrays ignored.
- Fixed challenge sequence hardcoded in app.js/ChallengeRenderer; hardcoded images/mnemonics/dialogues.
- Topic tiers and prerequisites partially hardcoded; schemas not enforced.

## What to keep/do
- Single JSON-driven lesson format with schemas (lesson/word/challenge) in src/data/schema/ (or equivalent).
- Render the `challenges` array provided by each lesson; if empty, auto-generate but prefer author-provided data.
- Store topic metadata, grammar cards, dialogues, and mnemonics in data files, not app.js.
- Use lesson images from lesson data (with credit/alt), not hardcoded URLs.
- Respect tier order: Building Blocks → Essential → Daily Topics; enforce prerequisites.
- Support AI/custom lessons by writing them to the same format and loading dynamically.

## Minimal action plan
1) Wire LessonLoader to validate lessons against schemas and supply `lesson.challenges` directly to ChallengeRenderer.
2) Remove hardcoded challenge sequences and assets from app.js; rely on lesson data.
3) Centralize mnemonics/grammar/dialogues into data files and reference by ID.
4) Ensure technique rotation applies to standard and AI/custom lessons; rescue lessons appear after repeated failures.
