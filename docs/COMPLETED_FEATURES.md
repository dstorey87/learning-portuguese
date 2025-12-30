# PortuLingo - Completed Features Archive

> **Last Updated:** 2025-12-30
> **Purpose:** Archive completed tasks from AI_LESSON_VARIATION_PLAN.md + quick reference of legacy features.

---

## Task Archive Rules

**MANDATORY:** When ANY task from AI_LESSON_VARIATION_PLAN.md is completed and merged to main:

1. **CUT** the full task specification from AI_LESSON_VARIATION_PLAN.md
2. **PASTE** it into the appropriate Track section below
3. **ADD** completion metadata (date, commit hash, evidence)
4. **UPDATE** the Statistics table at the bottom
5. **COMMIT** both files in the same commit

**Why:** Keeps AI_LESSON_VARIATION_PLAN.md small enough for AI agent context windows.

---

## Task Completion Template

```markdown
### [TASK-ID] - Task Name

**Completed:** YYYY-MM-DD | **Commit:** [hash]
**Branch:** feature/TASK-ID-description

**Implementation Summary:**
- What was built
- Key decisions made
- Files changed

**Testing Evidence:**
- Unit tests: [file] - ✅
- E2E tests: [file] - ✅
- MCP Playwright: Scenario X - ✅

**Screenshots:** test-results/TASK-ID.png

**Telemetry Verified:** [events confirmed]

**Sources Consulted:** [#] Source - Key insight
```

---

## Track 1: Lesson Architecture (LA-XXX)

### [LA-001] - Practice-First Flow
**Completed:** 2025-12-30 | **Commit:** b97b21d
**Branch:** feature/LA-001-practice-first-flow

**Implementation Summary:**
- Removed "Learn This Word" word-list-first screens
- First view is now an active MCQ exercise (guessing mode)
- Added first-exposure support: auto-play audio, encouraging hints
- Reordered challenge building: exercises first, learn-word reference after

**Files Changed:**
- src/services/LessonService.js - buildLessonChallenges reordered
- src/components/lesson/ChallengeRenderer.js - buildLessonChallenges + renderMCQ enhanced
- src/styles/lessons.css - First-exposure styles

**Testing Evidence:**
- Unit tests: tests/unit/lessonService.test.js - ✅ 43 passing
- MCP Playwright: Lesson opens with MCQ exercise, not word display
- Screenshot: .playwright-mcp/LA-001-practice-first-evidence.png

**Sources Consulted:** [1] AI_LESSON_VARIATION_PLAN.md LA-001

---

## Track 2: AI Adaptation (AI-XXX)

*No completed tasks yet.*

---

## Track 3: Telemetry (TM-XXX)

### [TM-001] - User-prefixed Storage Keys
**Completed:** 2025-12-30 | **Commit:** ba38fea
**Branch:** feature/TM-001-user-prefixed-storage

**Implementation Summary:**
- Verified all localStorage keys use `${userId}_` prefix pattern
- userStorage.js helper already implements correct pattern
- ProgressTracker, StuckWordsService, LearnerProfiler all correctly isolated

**Testing Evidence:**
- Unit tests: tests/unit/userStorage.test.js - ✅ 17 tests passing
- MCP Playwright: Scenario validated storage keys

---

### [TM-002] - Telemetry Event Types
**Completed:** 2025-12-30 | **Commit:** 28f7a4d
**Branch:** feature/TM-002-telemetry-events

**Implementation Summary:**
- Implemented all 7 required event types in eventStreaming.js:
  1. answer_attempt, 2. pronunciation_score, 3. lesson_complete
  4. word_skipped, 5. ai_tip_shown, 6. stuck_word_rescue, 7. exercise_interaction
- Added EVENT_TYPES constants for type safety
- Added dedicated emit methods with validation warnings

**Testing Evidence:**
- Unit tests: tests/unit/eventStreaming.test.js - ✅ 34 tests passing
- MCP Playwright: All 7 event types verified

---

### [TM-003] - Event Payload Validation
**Completed:** 2025-12-30 | **Commit:** 2fa4df5
**Branch:** feature/TM-003-payload-validation

**Implementation Summary:**
- Added EVENT_SCHEMAS with JSON schema for all 7 event types
- validateEventPayload() function with strict mode option
- Type checking, required field validation, enum constraints

**Testing Evidence:**
- Unit tests: tests/unit/eventSchemas.test.js - ✅ 49 tests passing
- MCP Playwright: Schema validation confirmed

---

### [TM-004] - User Isolation Verification
**Completed:** 2025-12-30 | **Commit:** 3edb2d2
**Branch:** feature/TM-004-isolation-verification

**Implementation Summary:**
- Integration tests verifying user data isolation
- Multi-user scenarios with separate storage keys

**Testing Evidence:**
- Integration tests: tests/integration/userIsolation.test.js
- Screenshot: .playwright-mcp/TM-004-isolation-verification.png

---

## Track 4: Testing & Validation (TV-XXX)

### [TV-001] - App Load E2E Tests
**Completed:** 2025-12-30 | **Commit:** 1bec36a
**Branch:** test/TV-001-app-load

**Implementation Summary:**
- App loads without errors
- Navigation works
- Core UI elements visible

**Testing Evidence:**
- E2E tests: tests/e2e/appLoad.e2e.test.js - ✅ All passing

---

### [TV-002] - Lesson Smoke E2E Tests
**Completed:** 2025-12-30 | **Commit:** feffed6
**Branch:** test/TV-002-lesson-smoke

**Implementation Summary:**
- Lesson grid with English titles
- Lesson opening and navigation
- Progress tracking
- Learning options panels

**Testing Evidence:**
- E2E tests: tests/e2e/lessonSmoke.e2e.test.js - ✅ 19 passing, 1 skipped (LA-001)
- Screenshot: .playwright-mcp/TV-002-lesson-smoke.png

---

### [TV-003] - Voice Smoke E2E Tests
**Completed:** 2025-12-30 | **Commit:** 01272ba
**Branch:** test/TV-003-voice-smoke

**Implementation Summary:**
- Voice button visibility
- Male/Female voice selection
- TTS service integration (graceful skip if offline)
- Pronunciation panel

**Testing Evidence:**
- E2E tests: tests/e2e/voiceSmoke.e2e.test.js - ✅ 13 passing, 4 skipped (TTS offline)
- Screenshot: .playwright-mcp/TV-003-voice-smoke.png

---

### [TV-004] - Exercise Types E2E Tests
**Completed:** 2025-12-30 | **Commit:** 345096d
**Branch:** test/TV-004-exercise-types

**Implementation Summary:**
- Current learning flow tests
- Exercise UI components
- Hard mode toggle
- Learning options sections
- Progress tracking
- Hearts/Lives system
- Placeholder tests for LA-002 exercise types

**Testing Evidence:**
- E2E tests: tests/e2e/exerciseTypes.e2e.test.js - ✅ 24 passing, 6 skipped (LA-002)
- Screenshot: .playwright-mcp/TV-004-exercise-types.png

---

## Track 5: LLM Interchangeability (LM-XXX)

*No completed tasks yet.*

---

## Task Statistics

| Track | Total | Completed | Remaining |
|-------|-------|-----------|-----------|
| LA (Lesson Architecture) | 21 | **1** | **20** |
| AI (AI Adaptation) | 7 | 0 | 7 |
| TM (Telemetry) | 4 | **4** | **0** |
| TV (Testing & Validation) | 10 | **4** | **6** |
| LM (LLM Interchangeability) | 6 | 0 | 6 |
| **TOTAL** | **48** | **9** | **39** |

---

## Legacy Features (Pre-Task System)

### Summary
- Core structure: 32 services, 22 components, 13 CSS modules, data and config in place.
- Lessons: Building Blocks tier (10 files) verified and indexed; lesson layout components ready.
- Navigation: Sidebar/TopBar/Breadcrumb/MobileDrawer/BottomNav all built and wired.
- AI chat: AIChat supports streaming, voice input, TTS output (pt-PT).
- Auth: AuthService functions complete with tests; role gating in place.
- Pronunciation: PronunciationService/Assessor/Scorer/Audio pipeline implemented and tested.
- AI Pipeline: Pedagogy integrated, LearnerProfiler wired, stuck-word detection at 3 failures.
- Admin Dashboard: User list, "Login as" impersonation, AI action feed (time-windowed).
- Tests: Unit/E2E coverage exists for chat, auth, pronunciation, and core services.

### Recent Additions (2025-12-30)
- **AI Pedagogy Integration**: AIAgent.js system prompt includes full pedagogy from AI_PEDAGOGY_BIBLE.md
- **LearnerProfiler Wiring**: aiPipeline.js now creates per-user profilers and routes events to processEvent()
- **Stuck Word Auto-Trigger**: When a word hits 3 failures, StuckWordsService dispatches 'word-became-stuck' event
- **Rescue Lesson Generation**: aiPipeline listens for stuck events and triggers AI rescue lesson generation
- **Admin Dashboard**: AdminDashboard.js with user list, login-as, AI action feed, rescue tracking
- **AuthService Extensions**: getAllUsers() and loginAsUser() for admin impersonation
- **AI Tutor Cleanup**: Removed unused AI tutor status/Whisper controls and legacy TTS/Ollama status hooks from app.js to keep lint clean

### Notes
- See IMPLEMENTATION_PLAN.md for in-progress work and blockers.
- Remaining admin work: Hearts/XP/Streak manual controls, data deletion
