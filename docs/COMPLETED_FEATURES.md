# PortuLingo - Completed Features (Concise)

> Last Updated: 2025-12-30
> Purpose: Quick reference of what is done and working.

## Summary
- Core structure: 32 services, 22 components, 13 CSS modules, data and config in place.
- Lessons: Building Blocks tier (10 files) verified and indexed; lesson layout components ready.
- Navigation: Sidebar/TopBar/Breadcrumb/MobileDrawer/BottomNav all built and wired.
- AI chat: AIChat supports streaming, voice input, TTS output (pt-PT).
- Auth: AuthService functions complete with tests; role gating in place.
- Pronunciation: PronunciationService/Assessor/Scorer/Audio pipeline implemented and tested.
- AI Pipeline: Pedagogy integrated, LearnerProfiler wired, stuck-word detection at 3 failures.
- Admin Dashboard: User list, "Login as" impersonation, AI action feed (time-windowed).
- Tests: Unit/E2E coverage exists for chat, auth, pronunciation, and core services.

## Recent Additions (2025-12-30)
- **AI Pedagogy Integration**: AIAgent.js system prompt includes full pedagogy from AI_PEDAGOGY_BIBLE.md
- **LearnerProfiler Wiring**: aiPipeline.js now creates per-user profilers and routes events to processEvent()
- **Stuck Word Auto-Trigger**: When a word hits 3 failures, StuckWordsService dispatches 'word-became-stuck' event
- **Rescue Lesson Generation**: aiPipeline listens for stuck events and triggers AI rescue lesson generation
- **Admin Dashboard**: AdminDashboard.js with user list, login-as, AI action feed, rescue tracking
- **AuthService Extensions**: getAllUsers() and loginAsUser() for admin impersonation
- **AI Tutor Cleanup**: Removed unused AI tutor status/Whisper controls and legacy TTS/Ollama status hooks from app.js to keep lint clean

## Notes
- See IMPLEMENTATION_PLAN.md for in-progress work and blockers.
- Remaining admin work: Hearts/XP/Streak manual controls, data deletion
