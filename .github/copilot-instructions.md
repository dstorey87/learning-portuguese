# Copilot Custom Instructions

These directives must be loaded (VS Code: Settings → GitHub Copilot → Advanced → enable instruction files) so Copilot follows the enforced workflow.

---

# 🛑 THE 5 NON-NEGOTIABLE RULES

**These rules override ALL other instructions. Copilot MUST refuse to proceed if any rule is violated.**

## Rule 1: BRANCHING (Always work on task branches)

- **REFUSE** to make any code changes if on `main` branch
- **CREATE** a task branch BEFORE any file edits: `git checkout -b <type>/<task-id>-<description>`
- **VERIFY** branch with `git status -sb` before every task
- **MERGE** to main only after ALL tests pass and Playwright validation complete

## Rule 2: MCP PLAYWRIGHT EVIDENCE (Non-negotiable validation)

- **EVERY** UI/visual/functional change MUST be validated with MCP Playwright tools
- **REQUIRED TOOLS** (use on EVERY task):
  - `mcp_playwright_browser_navigate` - Navigate to the page
  - `mcp_playwright_browser_snapshot` - Capture accessibility tree
  - `mcp_playwright_browser_click` - Test interactions
  - `mcp_playwright_browser_take_screenshot` - Capture visual evidence
  - `mcp_playwright_browser_evaluate` - Extract data/verify state
- **EVIDENCE REQUIRED**: Screenshot path + evaluated data in final response
- **REFUSE** to mark any task complete without Playwright evidence
- **NO EXCEPTIONS**: Even "simple" changes need validation

## Rule 3: ZERO TOLERANCE FOR BUGS (Develop → Test → Fix Loop)

```
┌─────────────────────────────────────────────────────────┐
│  MANDATORY LOOP - DO NOT EXIT UNTIL ALL TESTS PASS     │
│                                                         │
│  1. Implement change                                    │
│  2. Run targeted tests (npx playwright test <file>)    │
│  3. If ANY failure → FIX IMMEDIATELY                   │
│  4. Run tests again                                     │
│  5. Repeat steps 3-4 until ALL PASS                    │
│  6. Run Playwright MCP validation                       │
│  7. If visual issues → FIX IMMEDIATELY                 │
│  8. Repeat steps 6-7 until validated                   │
│  9. Only then: commit, push, merge                     │
└─────────────────────────────────────────────────────────┘
```

- **REFUSE** to commit with known failures
- **REFUSE** to say "I'll fix that later" or "that's a known issue"
- **REFUSE** to mark task complete with failing tests
- **CONTINUE** the loop until zero failures, no matter how long

## Rule 4: COMPLETE WORK ONLY (No loose/snagging work)

- **REFUSE** to implement placeholder or stub functionality
- **REFUSE** to add "TODO" comments for core functionality
- **REFUSE** to ship features that don't actually work end-to-end
- **EVERY** feature must:
  - Actually function (not just render)
  - Have telemetry/logging
  - Have tests that verify behavior
  - Pass Playwright validation
- **"Basic functionality"** that doesn't benefit the app = REJECTED

## Rule 5: PERSISTENCE (Rules apply to EVERY session)

- These rules apply to **EVERY conversation**, not just the first
- **READ** this file at the start of every task
- **VERIFY** compliance before responding
- **REFUSE** requests that violate these rules, even if user asks
- If user says "skip validation" → **REFUSE** and explain why

---

### ⚠️ ENFORCEMENT: Copilot Self-Check Before EVERY Response

Before completing any task, verify:

- [ ] Am I on a task branch (not main)?
- [ ] Have I used MCP Playwright tools to validate?
- [ ] Do I have screenshot evidence?
- [ ] Are ALL tests passing?
- [ ] Is the work complete (not placeholder)?
- [ ] Have I fixed every bug found?

**If ANY checkbox is unchecked → DO NOT mark task complete. Continue working.**

---

## ⚠️ MANDATORY: Branching & Change Control (NON-OPTIONAL)

**This is the highest priority rule. NO EXCEPTIONS. Every change MUST follow this process.**

### Branch Creation (BEFORE any code changes)
1. **Create a new branch** for every task, change, or task ID:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b <branch-name>
   ```
2. **Branch naming convention**: `<type>/<task-id>-<short-description>`
   - Types: `feature/`, `fix/`, `refactor/`, `docs/`, `test/`, `chore/`
   - Examples:
     - `feature/AI-001-real-time-event-streaming`
     - `fix/VOX-003-speed-control-not-working`
     - `refactor/F1-002-split-app-js`
     - `docs/DOC-001-update-readme`

### Work Isolation
3. **ALL changes happen ONLY in the task branch** - never directly on main.
4. **One task = One branch** - do not mix unrelated changes.
5. **If interrupted by a new task**, stash or commit current work, then create a new branch for the interruption.

### Commit & Push
6. **Commit with clear, descriptive messages** tied to the task ID:
   ```bash
   git add <files>
   git commit -m "[TASK-ID] Description of change"
   ```
   - Examples:
     - `[AI-001] Add real-time event streaming to AI pipeline`
     - `[F1-002] Split app.js into modular components`
     - `[VOX-003] Fix voice speed control affecting playback`
7. **Push the branch to remote** after commits:
   ```bash
   git push -u origin <branch-name>
   ```

### Completion & Merge (IMMEDIATE - DO NOT DEFER)
8. **After all tests pass**, merge IMMEDIATELY - do not leave work in branches:
   ```bash
   git checkout main
   git pull origin main
   git merge <branch-name>
   git push origin main
   ```
9. **Switch back to main** after merge is complete.
10. **Delete the feature branch** after successful merge:
    ```bash
    git branch -d <branch-name>
    git push origin --delete <branch-name>
    ```

### ⚠️ CRITICAL: Merge Policy
- **ALWAYS merge to main immediately after task completion** - do not accumulate branches.
- Changes are too interconnected to cherry-pick later.
- Each completed task MUST be in main before starting the next task.
- The site must always reflect the latest merged state.
- **NO long-lived feature branches** - branch → work → test → merge → delete.

### Why This Is Mandatory
- ✅ Every change is isolated and traceable
- ✅ Can always roll back to a previous state
- ✅ No work is done directly on main branch
- ✅ Each task maps to a specific branch and commit history
- ✅ Code review possible before merge
- ✅ Parallel work without conflicts

### Enforcement
- Default behavior: **Copilot MUST refuse to make changes** if not on a task-specific branch.
- Default behavior: **Before ANY file edit**, verify current branch is NOT main.
- Default behavior: **If on main**, first create the appropriate task branch.

### Enforcement Override: NO-GIT Mode (User-Directed)

If the user explicitly instructs **NO GIT** (e.g., "do not run git commands"), then:

- Copilot MUST NOT run any git commands (no `checkout`, `pull`, `commit`, `push`, `merge`, `stash`, branch deletes).
- Copilot MAY proceed with file edits on the current branch (even if it is `main`).
- Copilot MUST clearly warn that changes will be uncommitted/unmerged unless the user performs git steps manually.
- Copilot MUST continue to run targeted tests relevant to the change.

---

## Mandatory Workflow
- Always read operations.md, initial_plan.md, and IMPLEMENTATION_PLAN.md before responding; keep changes aligned to the active plan.
- **Before any code change, ensure you are on the correct task branch (see Branching section above).**
- After code changes, run **TARGETED tests only** for the affected files/features.
- If any check fails, fix immediately, rerun the same checks, and loop until all green; no deferrals.
- Re-test the original change once fixes pass to confirm it still holds.
- No bugs allowed: continue the fix/test loop until zero failures.

## Lesson Variation & DoD Enforcement (MANDATORY)
- Use docs/AI_LESSON_VARIATION_PLAN.md as the single source for exercise definitions, task scopes, DoD, and prioritized sources; do not invent new flows without adding them there first.
- Honor practice-first sequencing: quiz/check before reveal; interleave rescue flows after failures (mnemonics, minimal pairs, memory palace, input flood) per plan.
- Enforce lesson ordering: Building Blocks → Essential Communication → Daily Topics; do not surface greetings before building blocks.
- Each exercise type must meet its DoD (correct assets/audio, telemetry hooks, validation steps, targeted tests) before marking done.
- AI Tips must be dynamic from user performance (AITipGenerator + reference data) and cannot be hardcoded text.
- LLMs must remain swappable (Edge/remote/other); keep prompts/configs in one place and avoid provider lock-in.
- **Reference enforcement:** Every task must cite source(s) from the Source Table in AI_LESSON_VARIATION_PLAN.md; include source numbers in commit messages.
- **15 exercise types defined:** Word order, sentence builder, cloze, picture flashcard, image→type, audio→type, audio→pick, minimal pairs, word-image grid, grammar transform, dialogue reorder, pronunciation shadowing, number comprehension, rapid recall, multi-modal dual coding.
- **Fundamentals gate:** Lessons locked until prior tier reaches 80% accuracy; enforced via ProgressTracker + LessonService.
- **No word-list-first:** Every lesson opens with an active exercise; MCP Playwright Scenario 8 must pass.
- **English titles required:** All lesson cards must show English title + descriptive subline; Scenario 7 must pass.

## Playwright Validation Loop (MANDATORY for UI/visual changes)
- Do not rely on code review alone; always inspect the live page with Playwright for any UI/visual/content change (images, layout, navigation, gradients).
- Use the MCP Playwright tools to interact: navigate with `mcp_playwright_browser_navigate`, click/interact with `mcp_playwright_browser_click`, and capture state (evaluate/snapshot/screenshot) to confirm behavior.
- For image-related work (e.g., lesson thumbnails), verify in Playwright that elements render with non-empty `background-image`/`src`, unique URLs, and visible assets on the actual page.
- Stay in a fix loop: implement change → Playwright validation → adjust → repeat until the Playwright check confirms success.
- When reporting, mention the URL/port used for validation and the observed Playwright results.
- Lesson imagery rule: for lesson cards/thumbnails you must prove subject-matched photos (no gradients/abstract fills). Use Playwright to capture a screenshot and include the saved path plus evidence that the remote image URL matches the lesson’s English keywords/subject. Do not mark the task complete until a fresh Playwright run shows the correct photo.
- No-stop rule: do not conclude or pause a task with UI changes until you have visually validated every affected element and fixed any discrepancies; remain in the fix→validate loop until the UI matches the required behavior.
- Refusal rule: if asked to skip, pause, or stop before Playwright validation passes, explicitly refuse and keep working; final responses for UI changes must include the validation URL/port and screenshot path.
- Use the dedicated prompt: when doing UI/visual/content changes, load and follow [.github/prompts/playwright-validate.prompt.md](../.github/prompts/playwright-validate.prompt.md) so the fix→validate loop, evidence capture, and refusal rule are enforced.

### ⚡ TARGETED TESTING (NOT FULL SUITE)

**DO NOT run `npm test` on every change** - it takes 4+ minutes with 500+ tests!

Instead, use targeted test commands:

| Scenario | Command |
|----------|--------|
| Single test file | `npx playwright test tests/e2e/navigation.e2e.test.js` |
| Single test by name | `npx playwright test --grep "NAV-E001"` |
| Affected E2E tests | `npx playwright test tests/e2e/<affected>.e2e.test.js` |
| Unit tests only | `npx playwright test tests/unit/<service>.test.js` |
| Smoke tests | `npx playwright test tests/smoke.spec.js` |
| Full suite | `npm test` (ONLY before merge to main) |

---

## ⚠️ MANDATORY: Testing & Cleanup (NON-OPTIONAL)

**Every code change MUST include testing and cleanup. NO EXCEPTIONS.**

### Testing Requirements

For EVERY new file or significant change:

1. **Unit Tests** - Test functions in isolation
   - Location: `tests/unit/<service-name>.test.js`
   - Must test: normal cases, edge cases, error handling
   
2. **Integration Tests** - Test modules work together
   - Location: `tests/integration/`
   - Must verify: data flows correctly between services

3. **E2E Tests** - Test user-facing functionality
   - Location: `tests/` (Playwright)
   - Must verify: UI works as expected

### After Every Feature Task

```markdown
| Task | Tests Written | Tests Pass | Cleanup Done |
|------|---------------|------------|--------------|
| XXX  | [ ]           | [ ]        | [ ] or N/A   |
```

- If `Tests Written = [ ]`, task is NOT complete
- If `Tests Pass = [ ]`, task is NOT complete  
- If `Cleanup Done = [ ]` (and cleanup is required), task is NOT complete

### Cleanup Requirements

After integrating new code:

1. **Identify** redundant code in old files
2. **Remove** duplicate code from old files
3. **Verify** app still works after removal
4. **Document** line count reduction

---

## ⚠️ MANDATORY: Real-Time AI Logging (NON-OPTIONAL)

**ALL user interactions MUST be logged for AI consumption.**

### Required Logging

Every user action that affects learning MUST emit an event:

```javascript
import { Logger } from '../services/Logger.js';
import { EventStreaming } from '../services/eventStreaming.js';

// 1. Log to console/history
Logger.info('user_action', { eventType, wordId, result });

// 2. Stream to AI pipeline
EventStreaming.emit('learning_event', {
    eventType: 'answer_attempt',
    userId,
    timestamp: Date.now(),
    wordId,
    wasCorrect,
    userAnswer,
    correctAnswer,
    responseTime,
    attemptNumber
});
```

### Events That MUST Be Logged

| Event | Required Data | Consequence if Missing |
|-------|---------------|------------------------|
| `answer_correct` | wordId, timing | AI can't track progress |
| `answer_incorrect` | wordId, userAnswer, correctAnswer | AI can't identify weaknesses |
| `pronunciation_score` | wordId, score, phonemes | AI can't help pronunciation |
| `lesson_complete` | lessonId, score, duration | AI can't recommend next steps |
| `word_skipped` | wordId | AI can't detect frustration |

### Why This Is Critical

Without logging:
- ❌ AI is blind to user behavior
- ❌ No personalized tips possible
- ❌ No custom lesson generation
- ❌ Progress tracking incomplete
- ❌ **THE ENTIRE AI PIPELINE IS USELESS**

---

## Documentation & Planning
- Update documentation (README.md and relevant docs) after successful changes.
- Update the plan (initial_plan.md and IMPLEMENTATION_PLAN.md) to reflect scope, status, and decisions for each change.
- Keep version strings consistent across code, README, and tests when touched.

## Git Hygiene (Extended)
- **NEVER commit directly to main** - always use task branches.
- Keep diffs minimal and related; avoid unrelated churn. Stage logically related changes together.
- Prefer small, reviewable commits; ensure tests/docs/plan are included with the change.
- Use meaningful commit messages with task ID prefix: `[TASK-ID] Description`.

## Structure & Quality
- Review and maintain a professional folder/file structure; refactor when it drifts.
- Add best-practice tests alongside new features (Playwright or other appropriate coverage).

## Execution Notes
- Serve locally with `npm run serve` (port 4174) when running Playwright or manual browser checks.
- Surface failures with clear paths/lines and propose fixes immediately.

---

## Implementation Principles (Added December 2025)

### File Size & Structure Rules
- **Maximum file size: 500 lines.** If exceeding, split into modules immediately.
- All source code must be in `src/` directory with proper subfolder organization:
  - `src/components/` - Reusable UI components
  - `src/services/` - Business logic and API calls
  - `src/pages/` - Page-level components
  - `src/stores/` - State management
  - `src/data/` - Lesson content files
  - `src/utils/` - Utility functions
  - `src/styles/` - Modular CSS files
  - `src/config/` - Configuration files
- No monolithic files. Single responsibility principle.
- Extract repeated code into reusable components/functions.

### Lesson Structure Rules
- Building blocks (pronouns, connectors, articles) come BEFORE greetings.
- Lesson order: Building Blocks → Essential Communication → Daily Topics.
- Each word must have: pronunciation guide, examples, grammar notes, cultural insights.
- AI tips section must be dynamic (updated by AI based on user performance), never static.

### Real-Time AI Pipeline Rules
- All user interactions must be streamed to AI in real-time (debounced, batched).
- Track: correct/incorrect, pronunciation scores, time spent, misclicks, quiz choices.
- Pronunciation scores ARE learning data and MUST be fed to AI.
- AI tips update dynamically based on user performance patterns.
- After 5+ failures on same concept, AI generates custom mini-lesson.
- Custom lessons can be saved or discarded by user.

### User Data Isolation Rules
- AI can ONLY access data for currently logged-in user (enforced).
- All localStorage keys must be prefixed with userId: `${userId}_progress`, `${userId}_scores`.
- Admin can delete user data (failures, scores, all); users cannot delete their own data.
- Different users' data must NEVER mix.

### Validation Requirements
- Every feature must have startup validation checking both EXISTS and WORKS.
- Monitoring dashboard shows green/red/amber status for all components.
- Logs must explain WHY something failed, not just that it failed.
- Distinguish between: element exists + works, element exists but broken, element missing.

### Graceful Degradation Rules
- If AI is down: hide AI features, but lessons MUST still work.
- If voice is down: hide audio buttons, but text learning MUST still work.
- Show admin-only debug info for down services; hide from regular users.
- Never break the learning experience due to optional feature failures.

### Voice System Rules
- Downloaded voices must immediately appear in dropdown and be selectable.
- Speed control must actually affect playback speed (verify before marking complete).
- Already installed voices must NOT appear in download list.
- Provide voice refresh button to check for new available voices.
- AI chat must be able to speak with Portuguese accent.

### Navigation Rules
- Desktop: Left sidebar navigation (collapsible).
- Mobile: Bottom tab bar + hamburger drawer menu.
- Never use bottom navigation on desktop.
- All nav items must show current location context.

### Lesson Options Panel Rules
- Right panel with accordion behavior (only ONE section open at a time).
- Sections: Pronunciation, Remember It, Example Sentences, Grammar Notes, When to Use, Cultural Insight, AI Tips.
- AI Tips section updates in real-time based on user's learning data.
- Mobile: Panel becomes bottom drawer.

### Authentication Rules
- No features available without login (except guest mode with limited access).
- Admin must create user accounts; users cannot self-register without admin.
- Hearts, streaks, XP must be manually adjustable by admin.
- Role-based access: Guest < User < Admin.

### Code Quality Enforcement
- Run `npm run lint` before committing.
- Dead code must be removed, not commented out.
- Every new feature needs corresponding tests.
- Functions should be <50 lines; extract if larger.
