# AI Tutor Review 2.0

## Purpose
Codify the required behavior for the AI tutor so it continuously adapts to each logged-in user, varies teaching techniques, and exposes its actions to administrators.

## Non‑negotiables
- **Per-user isolation:** Every AI input/output and stored artifact is keyed to the active user (no guest/default mixing). Login must set the userId in `userStorage`, `ProgressTracker`, event stream, and profiler contexts before any AI call.
- **Continuous ingestion:** All lesson/quiz/pronunciation/AI interactions stream into the AI pipeline in near real time; the pipeline must not idle or drop events.
- **Detection thresholds:** Mark a word as "struggling" after ≥3 failures (wrong answers, poor pronunciation, or confusion) within a short window; keep attempt counts per user.
- **Automatic rescue lessons:** When the struggling threshold is hit, auto-create a rescue/custom lesson that blends the weak words with relevant topic content.
- **Technique rotation everywhere:** Rotate teaching techniques across both standard and AI/custom lessons (not just AI lessons). Techniques include keyword mnemonics, multi-sensory drills, minimal pairs, memory palace, context flood, spaced retrieval, and varied challenge types.
- **Admin observability:** Admins can see what the AI is doing for each user (recent actions, lessons created, tool calls, rescue triggers, outcomes) without waiting for logout/login cycles.
- **Admin impersonation:** Provide a dynamic user list with a "Log in as" control per user to enter their session for debugging/audit.
- **Performance posture:** The AI runs continuously within existing resource budgets—no excessive polling or heavyweight jobs.

## Required behaviors
1) **Per-user context thread**
   - On login, set and persist `currentUserId`; all storage keys and event payloads use this ID.
   - LearnerProfiler, ProgressTracker, event stream, and tool handlers must reject/guard against missing user IDs.

2) **Event flow into AI**
   - Batch/debounce user events, but always forward them to the AI/Profiler so the model’s system prompt has up-to-date weaknesses, confusion pairs, pronunciation issues, and timing/hesitation signals.
   - Preserve the last 500–1000 events per user for admin audit and AI context.

3) **Adaptive remediation**
   - When a word is marked struggling, enqueue a rescue lesson generation using multiple techniques and interleaving known vs. weak words.
   - Rotate techniques across repeated attempts; do not reuse the same pattern for the same user/word back-to-back.
   - Apply variation to baseline lesson challenges (MCQ/type/listen/pronounce/sentence) to avoid one-note flows.

4) **Admin audit surface**
   - Dashboard: user list (dynamic) with per-user AI action feed (time-window filter), rescue triggers, lessons created, tool calls, and whether events were processed.
   - Impersonation: "Log in as" button per user that opens their session with their data context; provide a way back to the admin account.
   - All actions are time-stamped and tied to userId/sessionId.

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
