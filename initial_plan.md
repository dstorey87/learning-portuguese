# Initial Plan (Canonical)

This file is a short, stable overview of product goals and working process.
For detailed feature specs and engineering status, see `IMPLEMENTATION_PLAN.md`.

## Product vision
- Publish a free-to-host website for learning **European Portuguese (pt-PT)** that feels like a Duolingo-style experience.
- Browser-first, PWA-friendly, and suitable for Android/iOS wrappers.
- Premium layer with a strategic paywall; minimal ads until users finish basics.
- AI tutor stays per-user with admin visibility (impersonation) for testing and support.

## Non-negotiable requirements
- Hosting must be 100% free (static-friendly stack preferred).
- Only European Portuguese (voices, spelling, examples).
- Duolingo-like lesson + practice experience.
- Learned words “vault” for review.
- Audio everywhere: tap/hover to hear PT; EN/extra audio can be premium-gated.
- AI conversation practice with **2-way voice** (like ChatGPT voice), with live transcription.
- AI consumes only the logged-in user’s data (no guest/default bleed or cross-user mixing).
- Admin can impersonate users from a dynamic list to audit AI actions in-session.
- Teaching techniques vary across all lessons; repeated failures trigger rotated rescue flows.
- AI tutor evaluates user behavior continuously (no idle periods) and updates context with fresh events.

## Current priorities
1) **Reliable 2-way voice AI chat (pt-PT)**
   - Hands-free loop (listen → respond → speak → listen)
   - Auto-speak replies toggle
   - Live transcription UI while listening
2) **Real-time learning telemetry for AI (per-user)**
   - Every learning interaction emits events to the AI pipeline
   - Active user ID is required and threaded through storage/profiler/tool handlers
3) **Custom lessons driven by learning data**
   - After repeated failures on a concept, generate a mini-lesson and offer it to the user
   - Rescue lessons mix struggling words with new topics and rotate techniques (mnemonics, multi-sensory drills, minimal pairs, memory palace, context flood, spaced retrieval)
4) **Admin observability + login-as**
   - Admin dashboard lists users with “Log in as” controls and shows recent AI actions (by time window/session)

## Process anchors
- Workflow and quality gates: see `operations.md`.
- Detailed plan (single source of truth for feature status): see `IMPLEMENTATION_PLAN.md`.
- AI tutor guardrails and acceptance: see `docs/AI_TUTOR_REVIEW_2.0.md`.

## Definition of Done (per change)
- Changes are on a task branch (never directly on `main`).
- Targeted tests run for affected areas; run full `npm test` before merge.
- Plans/docs updated if scope/status changed.
- AI features preserve per-user isolation, emit required telemetry, and expose admin observability when applicable.
Tracking checklist (implementation-facing)

