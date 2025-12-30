# Agent Runbook (Concise)

Use when touching AI/lesson features; defer to operations.md for workflow.

## Canonical refs
- Guardrails: docs/AI_TUTOR_REVIEW_2.0.md
- Architecture: docs/AI_TUTOR_ARCHITECTURE.md
- Pedagogy: docs/AI_PEDAGOGY_BIBLE.md

## Workflow
- Stay on a task branch; update plans/docs when scope changes.
- Run targeted tests for touched areas; full suite before merge.
- Emit learning events (Logger + eventStreaming) for every user interaction.

## Guardrails
- Per-user isolation only; set currentUserId before any AI call.
- Stream events fast (seconds), keep last ~500 for audit; prompt must stay fresh.
- Rotate techniques; trigger rescue after ≥3 failures.
- Admin surface: user list, login-as, AI action feed (time windowed).

## Voice/Lessons
- Voice path now: WebSpeechService (STT) + TTSService Edge-TTS (output); avoid VAD/Whisper until ready.
- Render lesson-provided challenges; no hardcoded assets; follow schemas when present.
