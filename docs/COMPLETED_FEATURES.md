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

*No completed tasks yet.*

---

## Track 2: AI Adaptation (AI-XXX)

*No completed tasks yet.*

---

## Track 3: Telemetry (TM-XXX)

*No completed tasks yet.*

---

## Track 4: Testing & Validation (TV-XXX)

*No completed tasks yet.*

---

## Track 5: LLM Interchangeability (LM-XXX)

*No completed tasks yet.*

---

## Task Statistics

| Track | Total | Completed | Remaining |
|-------|-------|-----------|-----------|
| LA (Lesson Architecture) | 21 | 0 | 21 |
| AI (AI Adaptation) | 7 | 0 | 7 |
| TM (Telemetry) | 4 | 0 | 4 |
| TV (Testing & Validation) | 10 | 0 | 10 |
| LM (LLM Interchangeability) | 6 | 0 | 6 |
| **TOTAL** | **48** | **0** | **48** |

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
