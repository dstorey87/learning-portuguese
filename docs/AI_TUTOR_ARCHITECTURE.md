# AI Tutor Architecture (Concise)

Minimum wiring to ship the AI tutor. Guardrails live in docs/AI_TUTOR_REVIEW_2.0.md.

## Core shape
- AIAgent orchestrates chat + tool calls (qwen2.5, tools on).
- ToolRegistry exposes learning/lesson/TTS/voice/rescue tools; every call carries userId.
- LearnerProfiler consumes event stream batches to summarize weaknesses for prompts.
- eventStreaming batches per-user events and forwards within seconds (<5s).
- Memory: short session window + last N events for admin audit.

## Non-negotiables
- Per-user isolation everywhere; no guest/default bleed.
- Prompt stays fresh from recent events; no idle agent.
- Technique rotation; rescue after ≥3 failures.
- Admin observability: user list, login-as, AI action feed, queue depth.
- Voice: WebSpeechService (STT) + TTSService (Edge-TTS) until VAD/Whisper is ready.

## Critical priorities
1) Identity threading: set currentUserId in userStorage + ProgressTracker; reject missing IDs in handlers/profiler.
2) Events → profiler → prompt: stream batches into LearnerProfiler.processEvent; refresh per user.
3) Lesson path: render lesson-provided challenges; drop hardcoded assets; rotate techniques everywhere.
4) Rescue flow: after 3+ failures, generate rescue lessons mixing weak + topic words with varied techniques.
5) Admin/Gov: dashboard with user list/login-as, AI action feed, and status metrics.

## Reference flows
- Chat: eventStreaming → LearnerProfiler summary → AIAgent prompt → ToolHandlers (stats/stuck/TTS) → response.
- Lesson: stuck words → rescue generator (multi-technique) → lesson list entry with metadata.
- Voice: AIChat WebSpeechService.listen → AIAgent → TTSService.speakPortuguese; show interim transcripts.

## Testing checklist
- Identity guard: authenticated session never reads/writes default/guest keys.
- Event ingestion: profiler receives recent events; prompt includes them.
- Lessons: render provided challenges; rotated techniques; rescue appears after failures.
- Voice: mic uses WebSpeechService (no VAD dependency); TTS is pt-PT.
- Admin: dashboard shows users, login-as, and AI actions feed.
