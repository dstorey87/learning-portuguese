# AI Tutor Review 2.0

## Purpose
Single source of truth for AI tutor guardrails and acceptance.

## Non‑negotiables
- **Per-user isolation:** Key every AI input/output to the active user; set userId in userStorage, ProgressTracker, event stream, profiler before any AI call.
- **Continuous ingestion:** Stream lesson/quiz/pronunciation/AI events in near real time; do not idle or drop.
- **Detection/rescue:** After ≥3 failures in a short window, auto-create rescue lessons mixing weak + topic words.
- **Technique rotation:** Rotate techniques across all lessons (mnemonics, multi-sensory, minimal pairs, memory palace, context flood, spaced retrieval, varied challenges).
- **Admin visibility:** Dynamic user list, login-as, AI action feed (recent window) without relogging.
- **Performance posture:** Stay within budgets; avoid heavyweight polling.
- **Voice path:** WebSpeechService (STT) + TTSService (Edge-TTS) until VAD/Whisper is ready.

## Required behaviors
1) **Per-user context thread**
   - On login, set and persist `currentUserId`; all storage keys and event payloads use this ID.
   - LearnerProfiler, ProgressTracker, event stream, and tool handlers must reject/guard against missing user IDs.

2) **Event flow into AI**
   - Batch/debounce but forward quickly so prompts include fresh weaknesses, confusion pairs, pronunciation issues, timing/hesitation.
   - Keep the last 500–1000 events per user for admin audit and AI context.

3) **Adaptive remediation**
   - On struggling flag, enqueue rescue lesson generation using multiple techniques and mixing known/weak words.
   - Rotate techniques per user/word; no back-to-back repeats.
   - Vary baseline challenges (MCQ/type/listen/pronounce/sentence).

4) **Admin audit surface**
   - Dashboard shows user list, AI action feed (time-windowed), rescue triggers, lessons created, tool calls, and processing status.
   - Impersonation: "Log in as" per user with a way back to admin; everything time-stamped to userId/sessionId.

5) **Quality/guardrails**
   - Enforce European Portuguese only; include IPA and pronunciation tips when generating lessons.
   - Avoid hallucinated translations—prefer lookup tools or curated data.
   - Respect lesson protection rules: AI-generated lessons are deletable by admin; system lessons are not.

## Acceptance criteria
- Logging in sets `currentUserId` and prevents reads/writes under `guest/default` for authenticated users.
- Event stream delivers per-user batches to the AI/Profiler; admin can see the last N actions for a user.
- After 3 failures on a word, a rescue lesson is generated with varied techniques and appears in the user’s lesson list.
- Standard lessons also show technique variation (not just custom AI lessons).
- Admin dashboard lists users and supports one-click "Log in as" with a visible AI action feed.
