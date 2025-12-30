# AI Tutor Review 2.0

## Purpose
Ensure the AI tutor operates on per-user data only, continuously analyzes learning signals, adapts teaching techniques, and exposes an admin view to audit AI actions and impersonate users.

## Non-Negotiables
- **Per-user isolation**: AI consumes only the logged-in user's data. Guest/default contexts must never leak into logged-in flows.
- **Continuous analysis**: AI processes events as they happen (no idle gaps) and updates recommendations/lessons in-session.
- **Adaptive techniques**: Teaching methods must vary; repeat failures trigger different techniques and rescue flows.
- **Admin observability**: Admins can view AI actions per user in near real time and impersonate any user via a dynamic list.

## Data & Identity Rules
- Set the active user ID at login and thread it through `userStorage`, `ProgressTracker`, `eventStream`, `LearnerProfiler`, and all AI tool handlers.
- Reject or downgrade to guest if `currentUserId` is missing; never mix users.
- Prefix all persisted keys with `userId_`; block cross-user reads.

## Continuous AI Loop
- Ingest events (`answer_correct/incorrect`, `pronunciation_score`, `lesson_complete`, `word_skipped`, `hint_viewed`, `session_start/end`) via `eventStream` and feed `LearnerProfiler.processEvent`.
- Keep the AI agent warm: refresh the user-specific system prompt when user switches; avoid resetting context during a session.
- Batch + debounce sending but ensure max-latency budget is small (e.g., 5s) before profiler/AI consumes events.

## Struggle Detection & Response
- Mark a word as “struggling” after ≥3 failures (quiz or pronunciation <60%).
- Auto-create a rescue/custom lesson that includes those words **and** new topic words, using varied techniques:
  - Keyword mnemonic (`generate_mnemonic_story`)
  - Multi-sensory drill (`generate_multi_sensory_drill`)
  - Memory palace (`create_memory_palace_scene`)
  - Minimal pairs (`create_minimal_pairs_contrast`)
  - Context flood (`generate_context_flood`)
  - Spaced retrieval plan (`record_answer` / SRS scheduling)
- Rotate techniques across lessons; do not reuse the same sequence if a learner keeps failing.
- Surface per-word tips (phoneme issues, confusion pairs) in the lesson options panel and chat.

## Admin Oversight & Impersonation
- Admin dashboard shows per-user AI activity stream (events consumed, actions taken, lessons generated, techniques applied) in-session.
- Admin user list with “Log in as” button for each user (dynamic, no manual config); returns to admin context on exit.
- Time-windowed filters (last 15m / session) so admins can observe recent AI behavior after user testing.
- Expose AI status (connected model, last event processed, queue depth) to admins.

## Action Items
1. On login/logout: call `userStorage.setCurrentUser` and `ProgressTracker.setCurrentUser`; set `currentUserId` in localStorage for tool handlers.
2. Wire `eventStream` batches into `LearnerProfiler.processEvent` and ensure per-user storage keys.
3. Guarantee `ToolHandlers` pull the active user ID from `userStorage` (fallback to error, not `default`).
4. Implement admin dashboard (user list + impersonate + AI action feed) and route gating.
5. Ensure lesson rendering pulls rescue techniques when a word is marked struggling and varies technique rotation.
6. Add telemetry to show AI actions and last-processed event for auditing.
