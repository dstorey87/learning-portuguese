# Initial Plan (Canonical)

Short, stable overview of product goals. For implementation details, see `docs/AI_LESSON_VARIATION_PLAN.md`.

## Product Vision
- Free-to-host **European Portuguese (pt-PT)** learning website
- Duolingo-style experience with AI tutor
- Browser-first, PWA-friendly
- Premium layer with strategic paywall

## Non-Negotiable Requirements
- Free hosting (static-friendly stack)
- European Portuguese only (voices, spelling, examples)
- Practice-first lessons (no word-list screens)
- Audio everywhere (tap/hover for PT pronunciation)
- 2-way voice AI chat with live transcription
- Per-user AI data isolation (no cross-user mixing)
- Admin can impersonate users for testing

## Current Priorities
1. **Lesson Architecture** - 15 exercise types per `docs/AI_LESSON_VARIATION_PLAN.md`
2. **Voice AI Chat** - Hands-free pt-PT conversation
3. **Learning Telemetry** - Real-time events to AI pipeline
4. **Custom Lessons** - AI generates rescue lessons after failures
5. **Admin Dashboard** - User list, impersonation, AI action logs

## Key Documents
| Document | Purpose |
|----------|---------|
| `operations.md` | Git workflow, testing, merge policy |
| `docs/AI_LESSON_VARIATION_PLAN.md` | Exercise types, DoD, 60 sources |
| `docs/AI_TUTOR_ARCHITECTURE.md` | AI system design |
| `.github/copilot-instructions.md` | Development rules |

## Definition of Done (per change)
- On task branch (not main)
- Targeted tests pass
- MCP Playwright validation with evidence
- Full suite passes before merge
- Per-user isolation preserved
- Telemetry events emitted

