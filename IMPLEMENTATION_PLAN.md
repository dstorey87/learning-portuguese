# PortuLingo Complete Implementation Plan

> **Version:** 2.0.0  
> **Created:** December 26, 2025  
> **Status:** Active Planning Document  
> **Tracking:** Use checkboxes to mark completion `[ ]` → `[x]`

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [MANDATORY: Task Completion Workflow](#-mandatory-task-completion-workflow)
3. [MANDATORY: Real-Time AI Data Logging](#-mandatory-real-time-ai-data-logging)
4. [Lesson Data Architecture](#lesson-data-architecture)
5. [Architecture & File Structure](#architecture--file-structure)
6. [Phase 1: Foundation & Structure](#phase-1-foundation--structure)
7. [Phase 1B: Integration & Cleanup](#phase-1b-integration--cleanup)
8. [Phase 2: Lesson Reordering](#phase-2-lesson-reordering)
9. [Phase 3: Navigation Redesign](#phase-3-navigation-redesign)
10. [Phase 4: Lesson Layout & Options Panel](#phase-4-lesson-layout--options-panel)
11. [Phase 5: Real-Time AI Pipeline](#phase-5-real-time-ai-pipeline)
12. [Phase 6: AI Governance Dashboard](#phase-6-ai-governance-dashboard)
13. [Phase 7: Authentication System](#phase-7-authentication-system)
14. [Phase 8: Voice System Fixes](#phase-8-voice-system-fixes)
15. [Phase 9: Monitoring & Health Checks](#phase-9-monitoring--health-checks)
16. [Phase 10: UI Polish & Animations](#phase-10-ui-polish--animations)
17. [Phase 11: Practice & Flashcards](#phase-11-practice--flashcards)
18. [Phase 12: Graceful Degradation](#phase-12-graceful-degradation)
19. [Copilot Instructions Additions](#copilot-instructions-additions)

---

## Executive Summary

This plan transforms PortuLingo into a professional language learning platform with:

- **Restructured lessons** starting with language building blocks (pronouns, connectors)
- **Modern left-side navigation** following 2025 best practices
- **Real-time AI integration** that learns from user behavior continuously
- **Comprehensive monitoring** with health checks and status dashboards
- **Robust authentication** with admin/user role separation
- **Graceful degradation** when services are unavailable

---

## ⚠️ MANDATORY: Task Completion Workflow

**EVERY task that involves code changes MUST follow this workflow:**

### Task Completion Checklist

| Step | Action | Required |
|------|--------|----------|
| 1 | Create feature branch | ✅ Yes |
| 2 | Implement the feature/change | ✅ Yes |
| 3 | **Write/update tests** for the new code | ✅ Yes |
| 4 | **Run TARGETED tests** (affected files only) | ✅ Yes |
| 5 | **Integration test** - verify it works with existing code | ✅ Yes |
| 6 | **Remove redundant code** from old files | ✅ Yes (or N/A) |
| 7 | Commit with task ID | ✅ Yes |
| 8 | **Run full suite** (`npm test`) before merge | ✅ Yes |
| 9 | Push and merge to main | ✅ Yes |
| 10 | Delete feature branch | ✅ Yes |
| 11 | Update plan status | ✅ Yes |

### Task Table Format

All task tables MUST include these columns:

```markdown
| Task ID | Task | Status | Cleanup | Priority |
|---------|------|--------|---------|----------|
| XX-001  | Description | [ ] | [ ] or N/A | P0 |
```

- **Status**: `[ ]` not started, `[x]` complete
- **Cleanup**: `[ ]` old code not removed, `[x]` old code removed, `N/A` no cleanup needed

**Note:** Tests are written at phase/milestone completion, not per-task.

### Testing Requirements

**⚡ STREAMLINED: Tests at Major Milestones Only**

To maintain development velocity, testing is required at **phase completion** rather than per-task:

| When to Test | What to Test | Command |
|--------------|--------------|--------|
| During development | Affected files only | `npx playwright test tests/e2e/<file>.test.js` |
| After changes | Smoke tests | `npx playwright test tests/smoke.spec.js` |
| Phase completion | All new services/components from that phase | Targeted test files |
| **Before merge to main** | **Full test suite** | `npm test` |
| After critical fixes | Affected functionality only | Targeted tests |
| Before releases | Full regression suite | `npm test` |

**⚠️ DO NOT run `npm test` on every change** - 500+ tests take 4+ minutes!

**Targeted Test Commands:**
```bash
# Single E2E file
npx playwright test tests/e2e/navigation.e2e.test.js

# Single test by ID
npx playwright test --grep "NAV-E001"

# Multiple related files
npx playwright test tests/e2e/navigation.e2e.test.js tests/smoke.spec.js

# Unit tests for a service
npx playwright test tests/unit/lessonService.test.js
```

**Test Coverage Categories (apply at milestones):**

| Category | What To Test | Example |
|----------|--------------|---------|
| **Existence** | Element renders in DOM | `expect(button).toBeVisible()` |
| **Clickability** | Buttons respond to clicks | `button.click(); expect(action).called` |
| **State Changes** | UI updates correctly | `click(); expect(expanded).toBe(true)` |
| **Data Flow** | Component receives/sends data | `expect(userStats).toEqual(expected)` |
| **Error Handling** | Graceful failure | `expect(errorMessage).toBeVisible()` |

**Test File Structure:**
```
tests/
├── unit/                        # Individual function tests
│   ├── services/
│   │   ├── AuthService.test.js
│   │   ├── AIService.test.js
│   │   └── ...
│   └── components/
│       ├── Modal.test.js
│       └── ...
├── integration/                 # Module interaction tests
│   ├── lesson-flow.test.js
│   ├── auth-flow.test.js
│   └── voice-playback.test.js
├── e2e/                         # Full user journey tests
│   ├── complete-lesson.spec.js
│   └── ...
└── registry/                    # Component registry tests (feeds Monitoring)
    └── component-health.spec.js
```

### Cleanup Requirements

After integrating new code, you MUST specify exactly what to remove:

| Step | Action | Must Document |
|------|--------|---------------|
| 1 | Identify redundant code | File name + line numbers |
| 2 | List functions to remove | Function names |
| 3 | Remove the code | Actual deletion |
| 4 | Run tests to verify | All tests pass |
| 5 | Document reduction | Lines removed count |

**Example Cleanup Documentation:**
```markdown
CLEANUP for INT-001 (Wire AuthService):
- DELETE: auth.js lines 1-294 (entire file)
- REMOVE FROM app.js:
  - Lines 15-28: Old auth imports
  - Lines 120-180: Duplicate getUser/saveUser functions
- VERIFY: `npm test` passes
- REDUCTION: 354 lines removed
```

---

## ⚠️ MANDATORY: Comprehensive Component Test Registry

**Every UI element MUST be registered and tested. This registry feeds the Monitoring Dashboard.**

### Why This Exists

The Monitoring Dashboard (Phase 9) needs to know about EVERY component to check health. We build this registry AS WE BUILD the components, not retroactively.

### Component Registration Format

Every component MUST be registered in `tests/registry/components.json`:

```json
{
    "componentId": "ai-chat-window",
    "name": "AI Chat Window",
    "type": "interactive",
    "selector": "#ai-chat-window, .ai-chat-container",
    "phase": "5B",
    "tests": {
        "existence": {
            "testId": "ai-chat-exists",
            "description": "Chat window renders in DOM"
        },
        "visibility": {
            "testId": "ai-chat-visible",
            "description": "Chat window is visible when expanded"
        },
        "interactions": [
            {
                "testId": "ai-chat-toggle",
                "action": "click floating button",
                "expected": "window expands/collapses",
                "stateChange": "isExpanded toggles"
            },
            {
                "testId": "ai-chat-send",
                "action": "type message and click send",
                "expected": "message appears in chat history",
                "dataFlow": "message sent to Ollama"
            },
            {
                "testId": "ai-chat-voice-input",
                "action": "click voice button and speak",
                "expected": "transcription appears in input",
                "connection": "Whisper service"
            }
        ],
        "dataConnections": [
            {
                "testId": "ai-chat-user-context",
                "source": "AuthService.getUser()",
                "expected": "chat knows current user's weak words"
            },
            {
                "testId": "ai-chat-lesson-context",
                "source": "LessonService.getCurrentLesson()",
                "expected": "chat knows what lesson user is viewing"
            }
        ],
        "crudOperations": [
            {
                "testId": "ai-chat-create-lesson",
                "operation": "CREATE",
                "action": "user says 'create a lesson for my weak words'",
                "expected": "new custom lesson created and appears in lesson list"
            },
            {
                "testId": "ai-chat-read-history",
                "operation": "READ",
                "action": "chat loads",
                "expected": "previous chat history displayed"
            }
        ],
        "errorHandling": [
            {
                "testId": "ai-chat-ollama-down",
                "scenario": "Ollama service unavailable",
                "expected": "graceful error message, not crash"
            }
        ]
    }
}
```

### Required Tests Per Component Type

**BUTTONS:**
| Test | Description | Required |
|------|-------------|----------|
| exists | Button renders | ✅ |
| visible | Button is visible | ✅ |
| enabled | Button is not disabled | ✅ |
| clickable | Click triggers action | ✅ |
| feedback | Visual feedback on click | ✅ |
| loading | Loading state if async | ✅ if async |
| error | Error state on failure | ✅ |

**EXPANDABLE PANELS (Accordion):**
| Test | Description | Required |
|------|-------------|----------|
| exists | Panel renders | ✅ |
| collapsed-default | Starts collapsed | ✅ |
| expand-on-click | Expands when clicked | ✅ |
| collapse-on-click | Collapses when clicked again | ✅ |
| single-open | Other panels close when opening | ✅ |
| animation | Smooth expand/collapse animation | ✅ |
| content-loads | Content inside loads correctly | ✅ |

**FORMS/INPUTS:**
| Test | Description | Required |
|------|-------------|----------|
| exists | Input renders | ✅ |
| accepts-input | Can type in field | ✅ |
| validation | Invalid input shows error | ✅ |
| submit | Form submits correctly | ✅ |
| reset | Clear/reset works | ✅ |
| autofocus | Correct field focused | ✅ if applicable |

**DATA DISPLAYS (Stats, Charts):**
| Test | Description | Required |
|------|-------------|----------|
| exists | Display renders | ✅ |
| loads-data | Data fetched from service | ✅ |
| correct-data | Data matches source | ✅ |
| updates | Live updates when data changes | ✅ if live |
| empty-state | Shows message when no data | ✅ |

**MODALS/DIALOGS:**
| Test | Description | Required |
|------|-------------|----------|
| exists | Modal in DOM | ✅ |
| hidden-default | Not visible by default | ✅ |
| opens | Trigger opens modal | ✅ |
| closes-x | X button closes | ✅ |
| closes-outside | Click outside closes | ✅ if applicable |
| closes-escape | Escape key closes | ✅ |
| focus-trap | Focus stays in modal | ✅ |

**SERVICE CONNECTIONS:**
| Test | Description | Required |
|------|-------------|----------|
| endpoint-reachable | Service responds | ✅ |
| auth-header | Auth token sent | ✅ if auth required |
| response-valid | Response matches schema | ✅ |
| timeout-handled | Timeout shows error | ✅ |
| retry | Retries on failure | ✅ if configured |

### Master Component Registry (Build as you go)

This table tracks ALL components. Update it as each component is built:

| Component ID | Phase | Type | Tests Written | Tests Pass | In Registry |
|--------------|-------|------|---------------|------------|-------------|
| nav-sidebar | 1B | navigation | [ ] | [ ] | [ ] |
| nav-topbar | 1B | navigation | [ ] | [ ] | [ ] |
| nav-mobile-drawer | 3 | navigation | [ ] | [ ] | [ ] |
| lesson-card | 1B | card | [ ] | [ ] | [ ] |
| word-card | 1B | card | [ ] | [ ] | [ ] |
| challenge-renderer | 1B | interactive | [ ] | [ ] | [ ] |
| modal-base | 1B | modal | [ ] | [ ] | [ ] |
| toast-notification | 1B | notification | [ ] | [ ] | [ ] |
| progress-chart | 1B | data-display | [ ] | [ ] | [ ] |
| accordion-panel | 4 | expandable | [ ] | [ ] | [ ] |
| ai-chat-window | 5B | interactive | [ ] | [ ] | [ ] |
| ai-chat-button | 5B | button | [ ] | [ ] | [ ] |
| ai-tips-panel | 5 | data-display | [ ] | [ ] | [ ] |
| voice-play-btn | 8 | button | [ ] | [ ] | [ ] |
| voice-speed-slider | 8 | control | [ ] | [ ] | [ ] |
| voice-download-btn | 8 | button | [ ] | [ ] | [ ] |
| login-modal | 7 | modal | [ ] | [ ] | [ ] |
| admin-panel | 7 | page | [ ] | [ ] | [ ] |
| hearts-display | 7 | data-display | [ ] | [ ] | [ ] |
| xp-display | 7 | data-display | [ ] | [ ] | [ ] |
| streak-display | 7 | data-display | [ ] | [ ] | [ ] |
| quiz-options | 1B | interactive | [ ] | [ ] | [ ] |
| quiz-submit | 1B | button | [ ] | [ ] | [ ] |
| pronunciation-challenge | 8 | interactive | [ ] | [ ] | [ ] |

### Test Implementation Template

For EVERY component, create a test file following this template:

```javascript
// tests/registry/[component-id].spec.js

import { test, expect } from '@playwright/test';

const COMPONENT_ID = 'ai-chat-window';

// ============================================================================
// EXISTENCE & VISIBILITY
// ============================================================================

test.describe(`${COMPONENT_ID}: Existence & Visibility`, () => {
    test('renders in DOM', async ({ page }) => {
        await page.goto('/');
        const element = page.locator('#ai-chat-window, .ai-chat-container');
        await expect(element).toBeAttached();
    });

    test('is visible when expanded', async ({ page }) => {
        await page.goto('/');
        await page.click('#ai-chat-toggle');
        const element = page.locator('#ai-chat-window');
        await expect(element).toBeVisible();
    });
});

// ============================================================================
// INTERACTIONS
// ============================================================================

test.describe(`${COMPONENT_ID}: Interactions`, () => {
    test('toggle button expands/collapses window', async ({ page }) => {
        await page.goto('/');
        const toggleBtn = page.locator('#ai-chat-toggle');
        const window = page.locator('#ai-chat-window');
        
        // Initially collapsed
        await expect(window).not.toBeVisible();
        
        // Click to expand
        await toggleBtn.click();
        await expect(window).toBeVisible();
        
        // Click to collapse
        await toggleBtn.click();
        await expect(window).not.toBeVisible();
    });

    test('send button sends message', async ({ page }) => {
        await page.goto('/');
        await page.click('#ai-chat-toggle');
        
        const input = page.locator('#ai-chat-input');
        const sendBtn = page.locator('#ai-chat-send');
        const messages = page.locator('.chat-message');
        
        await input.fill('Hello AI');
        await sendBtn.click();
        
        // User message appears
        await expect(messages.last()).toContainText('Hello AI');
    });
});

// ============================================================================
// DATA CONNECTIONS
// ============================================================================

test.describe(`${COMPONENT_ID}: Data Connections`, () => {
    test('receives user context from AuthService', async ({ page }) => {
        // Login first
        await page.goto('/');
        await page.evaluate(() => {
            localStorage.setItem('portugueseAuth', JSON.stringify({
                loggedIn: true,
                username: 'TestUser',
                isAdmin: false
            }));
        });
        await page.reload();
        
        await page.click('#ai-chat-toggle');
        
        // Chat should know the user
        const welcomeMessage = page.locator('.chat-welcome');
        await expect(welcomeMessage).toContainText('TestUser');
    });

    test('receives lesson context', async ({ page }) => {
        await page.goto('/');
        // Navigate to a lesson
        await page.click('[data-lesson-id="BB-001"]');
        await page.click('#ai-chat-toggle');
        
        // Chat should know current lesson
        const context = page.locator('.chat-context');
        await expect(context).toContainText('Personal Pronouns');
    });
});

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

test.describe(`${COMPONENT_ID}: CRUD Operations`, () => {
    test('CREATE: can create custom lesson via chat', async ({ page }) => {
        await page.goto('/');
        await page.click('#ai-chat-toggle');
        
        const input = page.locator('#ai-chat-input');
        await input.fill('Create a lesson for my weak words');
        await page.click('#ai-chat-send');
        
        // Wait for AI response
        await page.waitForSelector('.chat-message.ai-response');
        
        // New lesson should appear in list
        await page.click('[data-nav="learn"]');
        const customLesson = page.locator('[data-lesson-type="custom"]');
        await expect(customLesson).toBeVisible();
    });

    test('READ: loads chat history on open', async ({ page }) => {
        // Set up previous chat
        await page.goto('/');
        await page.evaluate(() => {
            localStorage.setItem('ai_chat_history', JSON.stringify([
                { role: 'user', content: 'Previous message' }
            ]));
        });
        await page.reload();
        
        await page.click('#ai-chat-toggle');
        const messages = page.locator('.chat-message');
        await expect(messages.first()).toContainText('Previous message');
    });
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

test.describe(`${COMPONENT_ID}: Error Handling`, () => {
    test('shows error when Ollama is unavailable', async ({ page }) => {
        // Mock Ollama being down
        await page.route('**/api/generate', route => route.abort());
        
        await page.goto('/');
        await page.click('#ai-chat-toggle');
        
        const input = page.locator('#ai-chat-input');
        await input.fill('Test message');
        await page.click('#ai-chat-send');
        
        const errorMessage = page.locator('.chat-error');
        await expect(errorMessage).toBeVisible();
        await expect(errorMessage).toContainText('AI service unavailable');
    });
});

// ============================================================================
// REGISTRY EXPORT (for Monitoring Dashboard)
// ============================================================================

export const componentHealthChecks = {
    componentId: COMPONENT_ID,
    checks: [
        { id: 'exists', status: 'pending' },
        { id: 'visible', status: 'pending' },
        { id: 'toggle', status: 'pending' },
        { id: 'send', status: 'pending' },
        { id: 'user-context', status: 'pending' },
        { id: 'lesson-context', status: 'pending' },
        { id: 'create-lesson', status: 'pending' },
        { id: 'read-history', status: 'pending' },
        { id: 'error-handling', status: 'pending' }
    ]
};
```

---

## ⚠️ MANDATORY: Real-Time AI Data Logging

**ALL user interactions MUST be logged for AI consumption.**

### Events That MUST Be Logged

| Event | Data Required | Priority |
|-------|---------------|----------|
| `answer_correct` | wordId, timing, attemptNumber | P0 |
| `answer_incorrect` | wordId, userAnswer, correctAnswer, timing | P0 |
| `pronunciation_score` | wordId, score, phonemeBreakdown | P0 |
| `pronunciation_attempt` | wordId, transcription, expected | P0 |
| `audio_played` | wordId, playCount | P1 |
| `hint_viewed` | wordId, hintType | P1 |
| `word_skipped` | wordId, reason | P0 |
| `lesson_started` | lessonId, timestamp | P0 |
| `lesson_completed` | lessonId, score, duration, mistakes[] | P0 |
| `session_started` | userId, timestamp | P0 |
| `session_ended` | userId, duration, wordsStudied | P0 |

### Logging Implementation

Every component that handles user input MUST:

```javascript
import { Logger } from '../services/Logger.js';
import { EventStreaming } from '../services/eventStreaming.js';

// Log to console/file
Logger.info('user_action', { eventType, data });

// Stream to AI pipeline
EventStreaming.emit('user_event', {
    eventType,
    userId: getCurrentUserId(),
    timestamp: Date.now(),
    ...data
});
```

### Why This Matters

Without this logging:
- ❌ AI cannot learn user patterns
- ❌ AI cannot generate personalized tips
- ❌ AI cannot create custom lessons
- ❌ Progress tracking is incomplete
- ❌ The entire AI pipeline is **USELESS**

---

## Lesson Data Architecture

### Current Problem

Lessons are embedded in JavaScript files (data.js) making them:
- Hard to edit without coding knowledge
- Difficult to bulk import/export
- Not suitable for database migration
- Mixed with application logic

### Target: Simple JSON + CSV Format

**Lesson Definition (JSON):**

```json
{
    "id": "BB-001",
    "title": "Personal Pronouns",
    "category": "building-blocks",
    "tier": 1,
    "order": 1,
    "prerequisites": [],
    "wordsFile": "lessons/building-blocks/pronouns.csv",
    "metadata": {
        "estimatedMinutes": 10,
        "difficulty": "beginner",
        "tags": ["grammar", "pronouns", "essential"]
    }
}
```

**Word Data (CSV):**

```csv
id,portuguese,english,ipa,audio,gender,plural,notes,examples
eu,eu,I,/ˈew/,eu.mp3,neutral,nós,"First person singular","Eu sou português.|I am Portuguese."
tu,tu,you (informal),/tu/,tu.mp3,neutral,vocês,"Informal singular","Tu és meu amigo.|You are my friend."
```

### File Structure

```
src/data/
├── lessons.json              # All lesson definitions
├── categories.json           # Category metadata
└── content/
    ├── building-blocks/
    │   ├── pronouns.csv
    │   ├── verbs-ser.csv
    │   └── articles.csv
    ├── fundamentals/
    │   ├── greetings.csv
    │   └── numbers.csv
    └── topics/
        ├── food.csv
        └── travel.csv
```

### Benefits

1. **Non-coders can edit** - CSV is spreadsheet-friendly
2. **AI can generate** - Output new lessons as CSV
3. **Database-ready** - Easy to migrate to SQLite/PostgreSQL
4. **Version control friendly** - Small, focused changes
5. **Bulk operations** - Import/export entire lesson sets

### Lesson Loader Service

```javascript
// src/services/LessonLoader.js
export async function loadLesson(lessonId) {
    const lessons = await fetch('/src/data/lessons.json').then(r => r.json());
    const lesson = lessons.find(l => l.id === lessonId);
    const words = await loadCSV(lesson.wordsFile);
    return { ...lesson, words };
}

export async function loadCSV(path) {
    const text = await fetch(path).then(r => r.text());
    return parseCSV(text);
}
```

### Implementation Tasks

| Task ID | Task | Status | Tests | Cleanup | Priority |
|---------|------|--------|-------|---------|----------|
| DATA-001 | Create `lessons.json` schema | [ ] | [ ] | N/A | P0 |
| DATA-002 | Create CSV parser utility | [ ] | [ ] | N/A | P0 |
| DATA-003 | Create `LessonLoader.js` service | [ ] | [ ] | N/A | P0 |
| DATA-004 | Convert existing lessons to CSV | [ ] | [ ] | [ ] | P0 |
| DATA-005 | Update app to use LessonLoader | [ ] | [ ] | [ ] | P0 |
| DATA-006 | Remove old data.js content | [ ] | N/A | [ ] | P0 |
| DATA-007 | Add lesson validation | [ ] | [ ] | N/A | P1 |
| DATA-008 | Create lesson editor UI (admin) | [ ] | [ ] | N/A | P2 |

---

## Architecture & File Structure

### Current Issues

| Issue ID | Description | Severity |
|----------|-------------|----------|
| ARCH-001 | `app.js` is 5800+ lines (should be max 300-500) | Critical |
| ARCH-002 | `index.html` is 700+ lines (should be shell only) | Critical |
| ARCH-003 | All code in root directory (no organization) | Critical |
| ARCH-004 | `styles.css` is monolithic (no modular CSS) | High |
| ARCH-005 | No separation of concerns (UI/logic mixed) | High |

### Target Folder Structure

```
learning_portuguese/
├── index.html                    # Shell only (~50 lines)
├── package.json
├── playwright.config.js
├── server.js
│
├── src/                          # All source code
│   ├── main.js                   # App entry point
│   │
│   ├── config/
│   │   ├── app.config.js         # App settings
│   │   ├── ai.config.js          # AI configuration
│   │   ├── voice.config.js       # Voice settings
│   │   └── routes.config.js      # Route definitions
│   │
│   ├── components/               # Reusable UI components
│   │   ├── navigation/
│   │   │   ├── Sidebar.js
│   │   │   ├── TopBar.js
│   │   │   └── Breadcrumb.js
│   │   ├── lesson/
│   │   │   ├── LessonCard.js
│   │   │   ├── WordCard.js
│   │   │   ├── ExpandablePanel.js
│   │   │   └── ChallengeRenderer.js
│   │   ├── common/
│   │   │   ├── Button.js
│   │   │   ├── Modal.js
│   │   │   ├── Toast.js
│   │   │   ├── StatusIndicator.js
│   │   │   └── Accordion.js
│   │   └── ai/
│   │       ├── ChatWindow.js
│   │       ├── TipsPanel.js
│   │       └── StatusBadge.js
│   │
│   ├── pages/
│   │   ├── HomePage.js
│   │   ├── LearnPage.js
│   │   ├── PracticePage.js
│   │   ├── ProfilePage.js
│   │   ├── AdminPage.js
│   │   └── MonitoringPage.js
│   │
│   ├── services/
│   │   ├── auth/
│   │   │   ├── AuthService.js
│   │   │   ├── UserService.js
│   │   │   └── RoleService.js
│   │   ├── ai/
│   │   │   ├── AIService.js
│   │   │   ├── AIDataPipeline.js
│   │   │   ├── TipsEngine.js
│   │   │   ├── CustomLessonGenerator.js
│   │   │   └── WhitelistManager.js
│   │   ├── voice/
│   │   │   ├── VoiceService.js
│   │   │   ├── TTSService.js
│   │   │   ├── SpeechRecognition.js
│   │   │   └── VoiceDownloader.js
│   │   ├── lessons/
│   │   │   ├── LessonService.js
│   │   │   ├── ProgressTracker.js
│   │   │   └── SRSEngine.js
│   │   ├── monitoring/
│   │   │   ├── HealthChecker.js
│   │   │   ├── StatusMonitor.js
│   │   │   └── Logger.js
│   │   └── storage/
│   │       ├── LocalStorage.js
│   │       └── DataExporter.js
│   │
│   ├── data/
│   │   ├── index.js              # Aggregates all lessons
│   │   ├── building-blocks/
│   │   │   ├── pronouns.js
│   │   │   ├── connectors.js
│   │   │   ├── articles.js
│   │   │   └── prepositions.js
│   │   ├── fundamentals/
│   │   │   ├── greetings.js
│   │   │   ├── numbers.js
│   │   │   └── colors.js
│   │   └── topics/
│   │       └── ... (organized by topic)
│   │
│   ├── stores/
│   │   ├── AppStore.js
│   │   ├── UserStore.js
│   │   ├── LessonStore.js
│   │   ├── AIStore.js
│   │   └── MonitoringStore.js
│   │
│   ├── utils/
│   │   ├── validators.js
│   │   ├── formatters.js
│   │   ├── debounce.js
│   │   └── eventBus.js
│   │
│   └── styles/
│       ├── main.css
│       ├── variables.css
│       ├── reset.css
│       ├── layout.css
│       ├── components/
│       │   ├── buttons.css
│       │   ├── cards.css
│       │   ├── modals.css
│       │   └── navigation.css
│       └── animations.css
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── TEACHING_METHODOLOGY.md
│   └── TTS_RESEARCH_2025.md
│
├── tests/
│   ├── e2e/
│   │   ├── navigation.spec.js
│   │   ├── lessons.spec.js
│   │   └── auth.spec.js
│   └── unit/
│       └── services/
│
└── .github/
    └── copilot-instructions.md
```

---

## Phase 1: Foundation & Structure

### 1.1 Create Folder Structure

| Task ID | Task | Status | Tests | Cleanup | Priority |
|---------|------|--------|-------|---------|----------|
| F1-001 | Create `src/` directory | [x] | N/A | N/A | P0 |
| F1-002 | Create `src/components/` subdirectories | [x] | N/A | N/A | P0 |
| F1-003 | Create `src/services/` subdirectories | [x] | N/A | N/A | P0 |
| F1-004 | Create `src/pages/` directory | [x] | N/A | N/A | P0 |
| F1-005 | Create `src/stores/` directory | [x] | N/A | N/A | P0 |
| F1-006 | Create `src/utils/` directory | [x] | N/A | N/A | P0 |
| F1-007 | Create `src/data/` subdirectories | [x] | N/A | N/A | P0 |
| F1-008 | Create `src/styles/` subdirectories | [x] | N/A | N/A | P0 |
| F1-009 | Create `src/config/` directory | [x] | N/A | N/A | P0 |

### 1.2 Extract Components from app.js

| Task ID | Task | Status | Tests | Cleanup | Priority |
|---------|------|--------|-------|---------|----------|
| F1-010 | Extract navigation to `Sidebar.js` | [x] | [ ] | [ ] | P0 |
| F1-011 | Extract lesson cards to `LessonCard.js` | [x] | [ ] | [ ] | P0 |
| F1-012 | Extract modals to `Modal.js` | [x] | [ ] | [ ] | P0 |
| F1-013 | Extract toast system to `Toast.js` | [x] | [ ] | [ ] | P0 |
| F1-014 | Extract challenge types to `ChallengeRenderer.js` | [x] | [ ] | [ ] | P0 |
| F1-015 | Extract word display to `WordCard.js` | [x] | [ ] | [ ] | P0 |
| F1-016 | Extract progress UI to `ProgressChart.js` | [x] | [ ] | [ ] | P1 |

### 1.3 Create Service Layer

| Task ID | Task | Status | Tests | Cleanup | Priority |
|---------|------|--------|-------|---------|----------|
| F1-020 | Create `AuthService.js` from auth.js | [x] | [ ] | [ ] | P0 |
| F1-021 | Create `AIService.js` from ai-tutor.js | [x] | [ ] | [ ] | P0 |
| F1-022 | Create `VoiceService.js` from audio.js | [x] | [ ] | [ ] | P0 |
| F1-023 | Create `TTSService.js` from ai-tts.js | [x] | [ ] | [ ] | P0 |
| F1-024 | Create `LessonService.js` for lesson logic | [x] | [ ] | [ ] | P0 |
| F1-025 | Create `ProgressTracker.js` for progress | [x] | [ ] | [ ] | P0 |
| F1-026 | Create `Logger.js` for logging | [x] | [ ] | [ ] | P0 |
| F1-027 | Create `HealthChecker.js` for monitoring | [x] | [ ] | [ ] | P0 |

### 1.4 Modularize CSS

| Task ID | Task | Status | Tests | Cleanup | Priority |
|---------|------|--------|-------|---------|----------|
| F1-030 | Create `variables.css` with CSS custom properties | [x] | [ ] | [ ] | P0 |
| F1-031 | Create `reset.css` with normalizations | [x] | [ ] | [ ] | P0 |
| F1-032 | Extract button styles to `buttons.css` | [x] | [ ] | [ ] | P1 |
| F1-033 | Extract card styles to `cards.css` | [x] | [ ] | [ ] | P1 |
| F1-034 | Extract modal styles to `modals.css` | [x] | [ ] | [ ] | P1 |
| F1-035 | Extract nav styles to `navigation.css` | [x] | [ ] | [ ] | P1 |
| F1-036 | Create `animations.css` for all animations | [x] | [ ] | [ ] | P1 |

---

## Phase 1B: Integration & Cleanup

**⚠️ CRITICAL: No new features until Phase 1B is complete!**

Phase 1 created new modular code in `src/`. This phase:
1. Wires new modules into the app
2. Tests EVERY function comprehensively
3. Removes redundant code from old files (with specific line references)
4. Validates line count reductions
5. Registers components in the test registry

### 1B.1 Service Integration (With Specific Cleanup Targets)

#### INT-001: Wire AuthService into app.js

| Aspect | Details |
|--------|---------|
| **Task** | Replace auth.js imports with src/services/AuthService.js |
| **Files to Modify** | app.js lines 15-28 (imports) |
| **Code to Remove** | auth.js (entire file - 294 lines) |
| **Tests Required** | See AuthService Test Specification below |

**AuthService Test Specification:**
| Test ID | Test | Category | Required |
|---------|------|----------|----------|
| AUTH-T001 | `getUser()` returns user object | Unit | ✅ |
| AUTH-T002 | `saveUser()` persists to localStorage | Unit | ✅ |
| AUTH-T003 | `login()` sets loggedIn=true | Unit | ✅ |
| AUTH-T004 | `loginAdmin()` requires correct password | Unit | ✅ |
| AUTH-T005 | `loginAdmin()` with wrong password fails | Unit | ✅ |
| AUTH-T006 | `logout()` clears user state | Unit | ✅ |
| AUTH-T007 | `isAdmin()` returns correct boolean | Unit | ✅ |
| AUTH-T008 | `getHearts()` returns number or Infinity | Unit | ✅ |
| AUTH-T009 | `loseHeart()` decrements hearts | Unit | ✅ |
| AUTH-T010 | `loseHeart()` dispatches heartsChanged event | Integration | ✅ |
| AUTH-T011 | `addHeart()` increments hearts | Unit | ✅ |
| AUTH-T012 | `refillHearts()` sets to max | Unit | ✅ |
| AUTH-T013 | `getTimeToNextHeart()` calculates correctly | Unit | ✅ |
| AUTH-T014 | Heart auto-refill after HEART_REFILL_MINUTES | Integration | ✅ |
| AUTH-T015 | `addXP()` adds to total | Unit | ✅ |
| AUTH-T016 | `addXP()` dispatches xpChanged event | Integration | ✅ |
| AUTH-T017 | `updateStreak()` continues streak | Unit | ✅ |
| AUTH-T018 | `updateStreak()` breaks streak after gap | Unit | ✅ |
| AUTH-T019 | `completeLesson()` increments lessonsToday | Unit | ✅ |
| AUTH-T020 | Hearts display updates on change | E2E | ✅ |
| AUTH-T021 | XP display updates on change | E2E | ✅ |
| AUTH-T022 | Streak display updates on change | E2E | ✅ |
| AUTH-T023 | Admin login modal works | E2E | ✅ |
| AUTH-T024 | Logout button clears session | E2E | ✅ |

---

#### INT-002: Wire AIService into app.js

| Aspect | Details |
|--------|---------|
| **Task** | Replace ai-tutor.js imports with src/services/AIService.js |
| **Files to Modify** | app.js lines 7-9 (imports), lines 3500-4000 (AI functions) |
| **Code to Remove** | ai-tutor.js (entire file) |
| **Tests Required** | See AIService Test Specification below |

**AIService Test Specification:**
| Test ID | Test | Category | Required |
|---------|------|----------|----------|
| AI-T001 | `checkOllamaStatus()` returns status object | Unit | ✅ |
| AI-T002 | `checkOllamaStatus()` handles offline gracefully | Unit | ✅ |
| AI-T003 | `getAIStatus()` returns current status | Unit | ✅ |
| AI-T004 | `initAIService()` attempts connection | Unit | ✅ |
| AI-T005 | `getPronunciationFeedback()` returns tips | Unit | ✅ |
| AI-T006 | `getPronunciationFeedback()` handles errors | Unit | ✅ |
| AI-T007 | `getTranslationFeedback()` returns feedback | Unit | ✅ |
| AI-T008 | `getGrammarHelp()` returns explanation | Unit | ✅ |
| AI-T009 | `chat()` sends message to Ollama | Integration | ✅ |
| AI-T010 | `chat()` receives response | Integration | ✅ |
| AI-T011 | `streamChat()` streams response chunks | Integration | ✅ |
| AI-T012 | AI status indicator shows green when connected | E2E | ✅ |
| AI-T013 | AI status indicator shows red when offline | E2E | ✅ |
| AI-T014 | AI tips panel loads content | E2E | ✅ |
| AI-T015 | AI tips update when user makes mistakes | E2E | ✅ |

---

#### INT-003: Wire VoiceService into app.js

| Aspect | Details |
|--------|---------|
| **Task** | Replace audio.js voice functions with src/services/VoiceService.js |
| **Files to Modify** | app.js lines 2-6 (imports) |
| **Code to Remove** | audio.js voice functions (keep TTS for now) |
| **Tests Required** | See VoiceService Test Specification below |

**VoiceService Test Specification:**
| Test ID | Test | Category | Required |
|---------|------|----------|----------|
| VOICE-T001 | `getPortugueseVoiceOptions()` returns array | Unit | ✅ |
| VOICE-T002 | `speakWord()` calls speech synthesis | Unit | ✅ |
| VOICE-T003 | `speakWord()` applies correct speed | Unit | ✅ |
| VOICE-T004 | `stopSpeech()` stops current playback | Unit | ✅ |
| VOICE-T005 | `getDownloadedVoices()` returns installed | Unit | ✅ |
| VOICE-T006 | `markVoiceDownloaded()` saves to storage | Unit | ✅ |
| VOICE-T007 | `isVoiceDownloaded()` returns boolean | Unit | ✅ |
| VOICE-T008 | `getDownloadableVoices()` excludes installed | Unit | ✅ |
| VOICE-T009 | Voice play button exists | E2E | ✅ |
| VOICE-T010 | Voice play button is clickable | E2E | ✅ |
| VOICE-T011 | Voice play button plays audio | E2E | ✅ |
| VOICE-T012 | Voice speed slider exists | E2E | ✅ |
| VOICE-T013 | Voice speed slider is interactive | E2E | ✅ |
| VOICE-T014 | Voice speed actually changes playback | E2E | ✅ |
| VOICE-T015 | Voice selector dropdown exists | E2E | ✅ |
| VOICE-T016 | Voice selector has options | E2E | ✅ |
| VOICE-T017 | Selecting voice changes playback voice | E2E | ✅ |
| VOICE-T018 | Download voice button exists | E2E | ✅ |
| VOICE-T019 | Download initiates on click | E2E | ✅ |
| VOICE-T020 | Downloaded voice appears in selector | E2E | ✅ |

---

#### INT-004: Wire TTSService into app.js

| Aspect | Details |
|--------|---------|
| **Task** | Replace ai-tts.js with src/services/TTSService.js |
| **Files to Modify** | app.js lines 7 (imports) |
| **Code to Remove** | ai-tts.js (entire file) |
| **Tests Required** | See TTSService Test Specification below |

**TTSService Test Specification:**
| Test ID | Test | Category | Required |
|---------|------|----------|----------|
| TTS-T001 | `checkServerHealth()` returns status | Unit | ✅ |
| TTS-T002 | `checkServerHealth()` handles offline | Unit | ✅ |
| TTS-T003 | `getAvailableVoices()` returns array | Unit | ✅ |
| TTS-T004 | `speak()` sends request to server | Integration | ✅ |
| TTS-T005 | `speak()` plays audio response | Integration | ✅ |
| TTS-T006 | `stop()` halts playback | Unit | ✅ |
| TTS-T007 | `isSpeaking()` returns correct state | Unit | ✅ |
| TTS-T008 | TTS server indicator green when running | E2E | ✅ |
| TTS-T009 | TTS server indicator red when stopped | E2E | ✅ |

---

#### INT-005: Wire LessonService into app.js

| Aspect | Details |
|--------|---------|
| **Task** | Replace inline lesson logic with src/services/LessonService.js |
| **Files to Modify** | app.js lines 800-2000 (lesson functions) |
| **Code to Remove** | app.js lesson functions (after wire-up) |
| **Tests Required** | See LessonService Test Specification below |

**LessonService Test Specification:**
| Test ID | Test | Category | Required |
|---------|------|----------|----------|
| LESSON-T001 | `initLessonState()` creates state object | Unit | ✅ |
| LESSON-T002 | `getLessonState()` returns current state | Unit | ✅ |
| LESSON-T003 | `getCurrentChallenge()` returns challenge | Unit | ✅ |
| LESSON-T004 | `nextChallenge()` advances to next | Unit | ✅ |
| LESSON-T005 | `nextChallenge()` stops at end | Unit | ✅ |
| LESSON-T006 | `recordCorrect()` updates state | Unit | ✅ |
| LESSON-T007 | `recordMistake()` updates state | Unit | ✅ |
| LESSON-T008 | `getLessonAccuracy()` calculates % | Unit | ✅ |
| LESSON-T009 | `buildQuizOptions()` returns 4 options | Unit | ✅ |
| LESSON-T010 | `buildQuizOptions()` includes correct answer | Unit | ✅ |
| LESSON-T011 | `buildHintForWord()` returns hint | Unit | ✅ |
| LESSON-T012 | `calculateLessonXP()` returns number | Unit | ✅ |
| LESSON-T013 | Lesson card renders | E2E | ✅ |
| LESSON-T014 | Lesson card shows title | E2E | ✅ |
| LESSON-T015 | Lesson card shows progress | E2E | ✅ |
| LESSON-T016 | Clicking lesson card opens lesson | E2E | ✅ |
| LESSON-T017 | Word displays in lesson | E2E | ✅ |
| LESSON-T018 | Next button advances word | E2E | ✅ |
| LESSON-T019 | Back button goes to previous | E2E | ✅ |
| LESSON-T020 | Quiz options display | E2E | ✅ |
| LESSON-T021 | Selecting correct answer shows success | E2E | ✅ |
| LESSON-T022 | Selecting wrong answer shows failure | E2E | ✅ |
| LESSON-T023 | Lesson completes after all words | E2E | ✅ |
| LESSON-T024 | Completion modal shows score | E2E | ✅ |
| LESSON-T025 | XP awarded on completion | E2E | ✅ |

---

#### INT-006: Wire ProgressTracker into app.js

| Aspect | Details |
|--------|---------|
| **Task** | Replace inline progress logic with src/services/ProgressTracker.js |
| **Files to Modify** | app.js progress-related functions |
| **Code to Remove** | app.js userData object handling |
| **Tests Required** | See ProgressTracker Test Specification below |

**ProgressTracker Test Specification:**
| Test ID | Test | Category | Required |
|---------|------|----------|----------|
| PROG-T001 | `loadProgress()` reads from storage | Unit | ✅ |
| PROG-T002 | `saveProgress()` writes to storage | Unit | ✅ |
| PROG-T003 | `addLearnedWord()` adds to list | Unit | ✅ |
| PROG-T004 | `getLearnedWords()` returns array | Unit | ✅ |
| PROG-T005 | `isWordLearned()` returns boolean | Unit | ✅ |
| PROG-T006 | `recordLessonCompletion()` saves record | Unit | ✅ |
| PROG-T007 | `getCompletedLessons()` returns list | Unit | ✅ |
| PROG-T008 | `isLessonCompleted()` returns boolean | Unit | ✅ |
| PROG-T009 | `getWeeklyActivity()` returns 7 days | Unit | ✅ |
| PROG-T010 | `getProgressSummary()` returns stats | Unit | ✅ |
| PROG-T011 | Progress chart renders | E2E | ✅ |
| PROG-T012 | Progress chart shows correct data | E2E | ✅ |
| PROG-T013 | Weekly activity displays | E2E | ✅ |
| PROG-T014 | Total words count updates | E2E | ✅ |

---

#### INT-007: Wire Logger into all services

| Aspect | Details |
|--------|---------|
| **Task** | Add Logger imports to all services for centralized logging |
| **Files to Modify** | All service files in src/services/ |
| **Code to Remove** | N/A (additive) |
| **Tests Required** | See Logger Test Specification below |

**Logger Test Specification:**
| Test ID | Test | Category | Required |
|---------|------|----------|----------|
| LOG-T001 | `debug()` logs at debug level | Unit | ✅ |
| LOG-T002 | `info()` logs at info level | Unit | ✅ |
| LOG-T003 | `warn()` logs at warn level | Unit | ✅ |
| LOG-T004 | `error()` logs at error level | Unit | ✅ |
| LOG-T005 | Log level filtering works | Unit | ✅ |
| LOG-T006 | `getHistory()` returns log array | Unit | ✅ |
| LOG-T007 | `clearHistory()` empties logs | Unit | ✅ |
| LOG-T008 | `exportHistory()` returns JSON | Unit | ✅ |
| LOG-T009 | Console output shows in dev tools | Manual | ✅ |

---

#### INT-008: Wire HealthChecker startup

| Aspect | Details |
|--------|---------|
| **Task** | Run health checks on app startup |
| **Files to Modify** | app.js initialization code |
| **Code to Remove** | N/A (additive) |
| **Tests Required** | See HealthChecker Test Specification below |

**HealthChecker Test Specification:**
| Test ID | Test | Category | Required |
|---------|------|----------|----------|
| HEALTH-T001 | `checkOllama()` returns status | Unit | ✅ |
| HEALTH-T002 | `checkTTS()` returns status | Unit | ✅ |
| HEALTH-T003 | `checkWhisper()` returns status | Unit | ✅ |
| HEALTH-T004 | `checkWebSpeech()` returns status | Unit | ✅ |
| HEALTH-T005 | `checkAllServices()` runs all checks | Unit | ✅ |
| HEALTH-T006 | `getOverallStatus()` aggregates | Unit | ✅ |
| HEALTH-T007 | `startMonitoring()` begins interval | Unit | ✅ |
| HEALTH-T008 | `stopMonitoring()` clears interval | Unit | ✅ |
| HEALTH-T009 | Health events dispatched | Integration | ✅ |
| HEALTH-T010 | Status indicator reflects health | E2E | ✅ |

---

### 1B.2 Component Integration (With Specific Cleanup Targets)

#### INT-010: Wire Modal.js into app.js

| Aspect | Details |
|--------|---------|
| **Task** | Replace inline modal code with src/components/common/Modal.js |
| **Files to Modify** | app.js modal functions |
| **Code to Remove** | app.js: `showModal()`, `hideModal()`, modal HTML generators |
| **Tests Required** | See Modal Test Specification below |

**Modal Test Specification:**
| Test ID | Test | Category | Required |
|---------|------|----------|----------|
| MODAL-T001 | Modal exists in DOM | E2E | ✅ |
| MODAL-T002 | Modal hidden by default | E2E | ✅ |
| MODAL-T003 | Modal opens on trigger | E2E | ✅ |
| MODAL-T004 | Modal displays title | E2E | ✅ |
| MODAL-T005 | Modal displays content | E2E | ✅ |
| MODAL-T006 | X button closes modal | E2E | ✅ |
| MODAL-T007 | Click outside closes modal | E2E | ✅ |
| MODAL-T008 | Escape key closes modal | E2E | ✅ |
| MODAL-T009 | Focus trapped in modal | E2E | ✅ |
| MODAL-T010 | Modal backdrop appears | E2E | ✅ |
| MODAL-T011 | Multiple modals stack correctly | E2E | ✅ |

---

#### INT-011: Wire Toast.js into app.js

| Aspect | Details |
|--------|---------|
| **Task** | Replace inline toast code with src/components/common/Toast.js |
| **Files to Modify** | app.js toast functions |
| **Code to Remove** | app.js: `showToast()`, toast HTML generators |
| **Tests Required** | See Toast Test Specification below |

**Toast Test Specification:**
| Test ID | Test | Category | Required |
|---------|------|----------|----------|
| TOAST-T001 | Toast container exists | E2E | ✅ |
| TOAST-T002 | Toast appears on trigger | E2E | ✅ |
| TOAST-T003 | Toast shows message | E2E | ✅ |
| TOAST-T004 | Toast auto-dismisses | E2E | ✅ |
| TOAST-T005 | Toast can be manually dismissed | E2E | ✅ |
| TOAST-T006 | Success toast has green style | E2E | ✅ |
| TOAST-T007 | Error toast has red style | E2E | ✅ |
| TOAST-T008 | Warning toast has yellow style | E2E | ✅ |
| TOAST-T009 | Multiple toasts stack | E2E | ✅ |

---

#### INT-012 to INT-016: Component Wiring

*(Similar detailed specifications for LessonCard, WordCard, ChallengeRenderer, ProgressChart, Navigation)*

### 1B.3 CSS Integration

| Task ID | Task | Status | Tests | Cleanup | Priority |
|---------|------|--------|-------|---------|----------|
| INT-020 | Add CSS imports to index.html | [x] | [ ] | N/A | P0 |
| INT-021 | Remove duplicate styles from styles.css | [ ] | N/A | [ ] | P1 |
| INT-022 | Verify all styles still apply | [ ] | [ ] | N/A | P1 |

**CSS Cleanup Specification:**
```markdown
Files to create imports for:
- src/styles/variables.css
- src/styles/reset.css
- src/styles/buttons.css
- src/styles/cards.css
- src/styles/modals.css
- src/styles/navigation.css
- src/styles/animations.css

Styles to REMOVE from styles.css after import:
- Lines 1-50: CSS variables (moved to variables.css)
- Lines 51-100: Reset styles (moved to reset.css)
- Lines 200-400: Button styles (moved to buttons.css)
- Lines 500-800: Card styles (moved to cards.css)
- Lines 900-1100: Modal styles (moved to modals.css)
- Lines 1200-1500: Navigation styles (moved to navigation.css)
- Lines 4000-4553: Animation keyframes (moved to animations.css)
```

### 1B.4 Old File Cleanup Tracking (Precise Line Counts)

| File | Original Lines | Functions to Remove | After Cleanup | Status |
|------|----------------|---------------------|---------------|--------|
| app.js | 5,831 | See breakdown below | ~2,000 | [ ] |
| styles.css | 4,553 | CSS blocks listed above | ~2,000 | [ ] |
| auth.js | 72 | DELETE ENTIRE FILE | 0 | [x] ✅ DELETED |
| audio.js | 48 | DELETE ENTIRE FILE | 0 | [x] ✅ DELETED |
| ai-tutor.js | 47 | DELETE ENTIRE FILE | 0 | [x] ✅ DELETED |
| ai-tts.js | 46 | DELETE ENTIRE FILE | 0 | [x] ✅ DELETED |
| ai-speech.js | ~150 | KEEP - actual implementation | ~150 | [ ] Keep |
| data.js | 566 | Keep until Phase 2 | 566 | [ ] |

**Note:** auth.js, audio.js, ai-tutor.js, ai-tts.js were bridge files (~214 lines total) that re-exported from src/services/. They were deleted on 2025-01-XX and app.js now imports directly from src/services/. ai-speech.js contains actual Whisper speech recognition code and was NOT deleted.

**app.js Functions to Remove After Integration:**
```
Lines ~100-200: Auth-related (getUser, saveUser, etc.) - replaced by AuthService
Lines ~300-500: Voice-related functions - replaced by VoiceService
Lines ~500-700: TTS functions - replaced by TTSService
Lines ~800-2000: Lesson logic - replaced by LessonService
Lines ~2000-2500: Progress tracking - replaced by ProgressTracker
Lines ~2500-3000: Modal/Toast functions - replaced by components
Lines ~3500-4000: AI tutor functions - replaced by AIService
Lines ~4500-5000: Speech recognition - replaced by VoiceService
```

### 1B.5 Test Suite Creation (With Full Coverage)

| Task ID | Task | Tests Count | Status | Priority |
|---------|------|-------------|--------|----------|
| TEST-001 | AuthService unit tests | 18 | [x] | P0 |
| TEST-002 | AIService unit tests | 11 | [x] | P0 |
| TEST-003 | VoiceService unit tests | 20 | [x] | P0 |
| TEST-004 | TTSService unit tests | 12 | [x] | P0 |
| TEST-005 | LessonService unit tests | 30 | [x] | P0 |
| TEST-006 | ProgressTracker unit tests | 55 | [x] | P0 |
| TEST-007 | Logger unit tests | 40 | [x] | P0 |
| TEST-008 | HealthChecker unit tests | 35 | [x] | P0 |
| TEST-009 | AuthService E2E tests | 5 | [x] | P0 |
| TEST-010 | VoiceService E2E tests | 12 | [x] | P0 |
| TEST-011 | LessonService E2E tests | 13 | [x] | P0 |
| TEST-012 | Modal component tests | 11 | [x] | P0 |
| TEST-013 | Toast component tests | 9 | [x] | P0 |
| TEST-014 | Full lesson flow integration | 1 | [x] | P0 |

**Total Tests Created: 246 passing (25 skipped for UI elements not yet present)**

---

## Phase 2: Lesson Reordering

### 2.1 Current Problem

Lessons start with "Essential Greetings" but should start with **language building blocks** - the fundamental words needed to construct sentences.

### 2.2 New Lesson Order

**TIER 1: Building Blocks (Must Learn First)**

| Lesson ID | Title | Words | Status |
|-----------|-------|-------|--------|
| BB-001 | Personal Pronouns | eu, tu, você, ele, ela, nós, eles, elas | [ ] Create |
| BB-002 | Verb: Ser (to be - permanent) | sou, és, é, somos, são | [ ] Create |
| BB-003 | Verb: Estar (to be - temporary) | estou, estás, está, estamos, estão | [ ] Create |
| BB-004 | Verb: Ter (to have) | tenho, tens, tem, temos, têm | [ ] Create |
| BB-005 | Articles | o, a, os, as, um, uma, uns, umas | [ ] Create |
| BB-006 | Demonstratives | este, esta, esse, essa, isto, isso | [ ] Create |
| BB-007 | Connectors | e, ou, mas, porque, então, também | [ ] Create |
| BB-008 | Prepositions | de, em, para, com, por, a, até | [ ] Create |
| BB-009 | Question Words | o que, quem, onde, quando, como, porquê | [ ] Create |
| BB-010 | Negation & Affirmation | sim, não, nunca, sempre, talvez | [ ] Create |
| BB-011 | Possessives | meu, minha, teu, tua, seu, sua, nosso | [ ] Create |

**TIER 2: Essential Communication (After Building Blocks)**

| Lesson ID | Title | Status |
|-----------|-------|--------|
| EC-001 | Basic Greetings | [ ] Reorder |
| EC-002 | Polite Expressions | [ ] Reorder |
| EC-003 | Numbers 1-20 | [ ] Reorder |
| EC-004 | Numbers 20-100 | [ ] Reorder |

**TIER 3: Daily Life Topics (Progressive)**
- Days of the week
- Months
- Colors
- Family
- Food & Drink
- etc.

### 2.3 Implementation Tasks

| Task ID | Task | Status | Tests | Cleanup | Priority |
|---------|------|--------|-------|---------|----------|
| L2-001 | Create `src/data/building-blocks/pronouns.js` | [x] | [x] | N/A | P0 |
| L2-002 | Create `src/data/building-blocks/verbs-ser.js` | [x] | [x] | N/A | P0 |
| L2-003 | Create `src/data/building-blocks/verbs-estar.js` | [x] | [x] | N/A | P0 |
| L2-004 | Create `src/data/building-blocks/verbs-ter.js` | [x] | [x] | N/A | P0 |
| L2-005 | Create `src/data/building-blocks/articles.js` | [x] | [x] | N/A | P0 |
| L2-006 | Create `src/data/building-blocks/connectors.js` | [x] | [x] | N/A | P0 |
| L2-007 | Create `src/data/building-blocks/prepositions.js` | [x] | [x] | N/A | P0 |
| L2-008 | Create `src/data/building-blocks/questions.js` | [x] | [x] | N/A | P0 |
| L2-009 | Create `src/data/building-blocks/negation.js` | [x] | [x] | N/A | P0 |
| L2-010 | Create `src/data/building-blocks/possessives.js` | [x] | [x] | N/A | P0 |
| L2-011 | Update lesson ordering system | [x] | [x] | N/A | P0 |
| L2-012 | Implement prerequisite system | [x] | [x] | N/A | P1 |
| L2-013 | Update tests for new lesson order | [x] | [x] | N/A | P0 |

---

## Phase 3: Navigation Redesign

### 3.1 Current Problem

- Navigation is at the bottom (not optimal)
- Limited navigation options
- No context awareness

### 3.2 Target Design (2025 Best Practices)

**Desktop Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│ [Logo] PortuLingo    [Search]    [❤️5] [🔥7] [⭐250]  [👤 User] │
├─────────────┬───────────────────────────────────────────────────┤
│             │                                                   │
│ 📚 Learn    │    Main Content Area                              │
│   └ Basics  │                                                   │
│   └ Daily   │                                                   │
│   └ Travel  │                                                   │
│             │                                                   │
│ 🎯 Practice │                                                   │
│   └ Review  │                                                   │
│   └ Quiz    │                                                   │
│             │                                                   │
│ 💬 AI Chat  │                                                   │
│             │                                                   │
│ 👤 Profile  │                                                   │
│   └ Stats   │                                                   │
│   └ Settings│                                                   │
│             │                                                   │
│ ⚙️ Admin    │                                                   │
│ (if admin)  │                                                   │
│             │                                                   │
│ 📊 Monitor  │                                                   │
│ (if admin)  │                                                   │
└─────────────┴───────────────────────────────────────────────────┘
```

**Mobile Layout:**
```
┌────────────────────────┐
│ [≡] PortuLingo [👤]    │
├────────────────────────┤
│                        │
│   Main Content         │
│                        │
├────────────────────────┤
│ 🏠  📚  🎯  💬  👤    │
└────────────────────────┘
```

### 3.3 Implementation Tasks

| Task ID | Task | Status | Tests | Cleanup | Priority |
|---------|------|--------|-------|---------|----------|
| N3-001 | Create `Sidebar.js` component | [ ] | [ ] | [ ] | P0 |
| N3-002 | Create `TopBar.js` component | [ ] | [ ] | [ ] | P0 |
| N3-003 | Create `Breadcrumb.js` component | [ ] | [ ] | N/A | P1 |
| N3-004 | Implement collapsible sidebar | [ ] | [ ] | N/A | P0 |
| N3-005 | Create mobile drawer menu | [ ] | [ ] | N/A | P0 |
| N3-006 | Create mobile bottom nav | [ ] | [ ] | [ ] | P0 |
| N3-007 | Implement responsive breakpoints | [ ] | [ ] | N/A | P0 |
| N3-008 | Add keyboard navigation (accessibility) | [ ] | [ ] | N/A | P1 |
| N3-009 | Create `routes.config.js` | [ ] | [ ] | N/A | P0 |
| N3-010 | Implement route management | [ ] | [ ] | [ ] | P0 |
| N3-011 | Add navigation animations | [ ] | [ ] | N/A | P2 |
| N3-012 | Style sidebar with CSS module | [ ] | [ ] | [ ] | P0 |

---

## Phase 4: Lesson Layout & Options Panel

### 4.1 Current Problem

- Lesson options (pronunciation, grammar, tips) are BELOW the content
- Not clear what information belongs to which word
- Multiple sections can be open at once (confusing)

### 4.2 Target Design

```
┌────────────────────────────────────────────────────────────────┐
│                    LESSON: Personal Pronouns                    │
├─────────────────────────────┬──────────────────────────────────┤
│                             │                                  │
│     ┌─────────────────┐     │  📖 Learning Options             │
│     │                 │     │                                  │
│     │      EU         │     │  ▼ Pronunciation (OPEN)          │
│     │      [🔊]       │     │  ┌──────────────────────────────┐│
│     │      "I"        │     │  │ IPA: /ˈew/                   ││
│     │                 │     │  │ Sounds like: "eh-oo"         ││
│     └─────────────────┘     │  │ Tip: Short, single syllable  ││
│                             │  └──────────────────────────────┘│
│     Progress: 1/10          │                                  │
│     [◀ Back] [Next ▶]       │  ▶ Remember It (collapsed)       │
│                             │                                  │
│                             │  ▶ Example Sentences (collapsed) │
│                             │                                  │
│                             │  ▶ Grammar Notes (collapsed)     │
│                             │                                  │
│                             │  ▶ When to Use (collapsed)       │
│                             │                                  │
│                             │  ▶ Cultural Insight (collapsed)  │
│                             │                                  │
│                             │  ▶ AI Tips (dynamic)             │
│                             │    [Updates based on your data]  │
│                             │                                  │
└─────────────────────────────┴──────────────────────────────────┘
```

### 4.3 Accordion Behavior Rules

1. **Only ONE section open at a time**
2. Clicking new section auto-closes previous
3. Smooth animation on expand/collapse (300ms)
4. AI Tips section updates dynamically from AI
5. Mobile: Panel slides up from bottom as drawer

### 4.4 Implementation Tasks

| Task ID | Task | Status | Tests | Cleanup | Priority |
|---------|------|--------|-------|---------|----------|
| LP-001 | Create `Accordion.js` component | [x] | [x] | N/A | P0 |
| LP-002 | Create `LessonOptionsPanel.js` component | [x] | [x] | N/A | P0 |
| LP-003 | Implement single-open accordion behavior | [x] | [x] | N/A | P0 |
| LP-004 | Create right panel layout | [x] | [x] | [x] | P0 |
| LP-005 | Add smooth expand/collapse animations | [x] | [x] | N/A | P1 |
| LP-006 | Wire AI Tips to dynamic updates | [x] | [x] | N/A | P0 |
| LP-007 | Create mobile drawer variant | [x] | [x] | N/A | P0 |
| LP-008 | Persist user's last open section | [x] | [x] | N/A | P2 |
| LP-009 | Style options panel with CSS module | [x] | [x] | [x] | P0 |
| LP-010 | Add section icons | [x] | [x] | N/A | P2 |

**Phase 4 Complete** - Merged to main (commit f8bccaa)

---

## Phase 4B: Lesson Architecture Improvements

### 4B.1 Problem Statement

The lesson system had two incompatible data formats (legacy data.js vs rich building-blocks), and rich challenge data was being ignored. See [LESSON_ARCHITECTURE_REVIEW.md](docs/LESSON_ARCHITECTURE_REVIEW.md) for full analysis.

### 4B.2 Quick Wins Implemented

| Task ID | Task | Status | Commit |
|---------|------|--------|--------|
| LESSON-001 | Rich challenge data flows to accordion panel | [x] | 2b5f16c |
| LESSON-002 | New challenge type renderers (multiple-choice, translate, fill-blank) | [x] | 415b630 |
| LESSON-003 | Dynamic topic/lesson tiers + image fallbacks | [x] | 076fc41 |

### 4B.3 Technical Changes

**ChallengeRenderer.js:**
- `_buildWordDataForPanel()`: Now prioritizes word data from lesson files over word-knowledge.js
- `buildLessonChallenges()`: Combines learn-word challenges + custom challenges from lesson.challenges
- New renderers: `renderMultipleChoice()`, `renderTranslate()`, `renderFillBlank()`
- Challenge types: LEARN_WORD, PRONUNCIATION, MCQ, TYPE_ANSWER, LISTEN_TYPE, SENTENCE, MULTIPLE_CHOICE, TRANSLATE, FILL_BLANK

**LessonOptionsPanel.js:**
- Enhanced pronunciation section: breakdown, commonMistake, audioFocus
- Enhanced examples section: audio button for each example

**LessonLoader.js:**
- `getAllTopics()`: Priority: topic.tier > TOPIC_TIER_MAP > default
- `getAllLessons()`: Priority: lesson.tier > topic.tier > map > default
- `getLessonImage()`: 4-level fallback chain (lesson → topic → tier default → category default)
- New: TIER_DEFAULT_IMAGES, CATEGORY_FALLBACK_IMAGES maps

**Phase 4B Complete** - Merged to main (commit 076fc41)

---

## Phase 5: Real-Time AI Pipeline

### 5.1 Core Principle: Continuous Learning Intelligence

### 5.1A Current Implementation Status (Single Source of Truth)

This section describes the **current AI system as implemented in code** (not aspirational). It is the canonical reference for what exists today and what is still missing.

**Implemented (now):**
- **AI Chat UI:** [src/components/ai/AIChat.js](src/components/ai/AIChat.js) (chat widget, voice input/output, interim transcription, inline audio, pronunciation assessment hooks)
- **Chat launcher/FAB:** [ai-chat.js](ai-chat.js)
- **AI Agent orchestration:** [src/services/ai/AIAgent.js](src/services/ai/AIAgent.js) (Ollama chat + tool calling integration)
- **Tool schemas + validation:** [src/services/ai/ToolRegistry.js](src/services/ai/ToolRegistry.js)
- **Tool execution wiring:** [src/services/ai/ToolHandlers.js](src/services/ai/ToolHandlers.js)
- **Real-time event collection (debounced/batched):** [src/services/eventStreaming.js](src/services/eventStreaming.js)
- **Voice input (STT):** [src/services/WebSpeechService.js](src/services/WebSpeechService.js) (pt-PT primary, interim results)
- **Voice output (TTS):** [src/services/TTSService.js](src/services/TTSService.js) (Edge-TTS server `/tts` + Web Speech fallback)
- **Pronunciation scoring:** [src/services/PronunciationAssessor.js](src/services/PronunciationAssessor.js)

**AI Chat feature checklist (must not regress):**
| Feature | Status | Notes |
|---|---:|---|
| Text chat | [x] | Uses `AIAgent.processInput()` |
| Voice push-to-talk | [x] | One turn: listen → send → speak |
| Hands-free “phone-style” voice | [x] | Loop: listen → send → speak → listen (turn-based, not streaming) |
| Live transcription display | [x] | Uses Web Speech interim results |
| Auto-speak replies toggle | [x] | Stored as `${userId}_ai_autoSpeakReplies` |
| Inline 🔊 for **Portuguese** words | [x] | Buttons call `window.playPortugueseWord()` |
| Pronunciation assessment in chat | [x] | `window.assessPronunciation()` hook + scorer |
| Tool calling available to AI | [x] | Includes `speak_portuguese` tool handler |
| Real-time AI logging of interactions | [~] | Event streaming exists; expand coverage to ALL required learning events |

**Current limitations (explicit):**
- The hands-free mode is **turn-based** (end-of-speech → send → full response → speak). It is not yet the <300ms **streaming** voice mode.
- No true **barge-in** (interrupt assistant while speaking) beyond manual stop (future work: VAD + streaming pipeline).

**Next engineering steps to reach “ChatGPT Voice Mode” feel:**
1. **Streaming LLM output** from Ollama (tokens) → incremental TTS chunking (first-audio latency target: <300ms).
2. **VAD-driven turn-taking + barge-in** (detect user speech start during TTS → stop TTS, start capture).
3. **Latency instrumentation** (measure: STT start→final, LLM first token, TTS first audio, total turn time) and show in admin-only diagnostics.

The AI is NOT a passive tool. It is an **active learning companion** that:
1. **Ingests data in real-time** as the user interacts with the app
2. **Detects patterns** in what the user struggles with
3. **Generates memory aids** to make difficult content memorable
4. **Creates custom lessons** based on weak areas
5. **Speaks and listens** via voice interface

### 5.2 What the AI Receives (Every Interaction)

```javascript
// EVERY user action sends this to the AI pipeline
const realTimeEvent = {
    // Identity
    userId: 'user_123',
    sessionId: 'session_456',
    timestamp: Date.now(),
    
    // What happened
    eventType: 'answer_attempt', // See full list below
    
    // Context
    currentLesson: 'BB-001',
    currentWord: { id: 'eu', portuguese: 'eu', english: 'I' },
    
    // Result
    wasCorrect: false,
    userAnswer: 'tu',
    correctAnswer: 'eu',
    
    // Timing (reveals hesitation, confusion)
    timeToRespond: 4200, // ms - long = unsure
    timeOnScreen: 8500,  // ms - how long they looked
    
    // Attempt tracking
    attemptNumber: 3,     // 3rd try on this word
    consecutiveWrong: 2,  // failed twice in a row
    
    // Pronunciation (if applicable)
    pronunciation: {
        score: 42,
        expected: 'eu',
        transcribed: 'ew',
        phonemeBreakdown: [
            { phoneme: 'e', score: 65, issue: 'too_open' },
            { phoneme: 'u', score: 20, issue: 'not_rounded' }
        ]
    },
    
    // UI interactions
    uiActions: {
        playedAudio: true,
        playedAudioTimes: 3,
        viewedPronunciation: true,
        viewedGrammar: false,
        viewedExamples: true,
        askedAIForHelp: false
    },
    
    // Historical context (AI needs this)
    history: {
        totalAttemptsThisWord: 8,
        successRateThisWord: 0.25,  // 25% - struggling!
        lastSeenThisWord: '2025-12-25T14:30:00Z',
        timesMarkedDifficult: 2
    }
};
```

### 5.3 All Event Types the AI Receives

| Event Type | When Fired | Data Included |
|------------|------------|---------------|
| `lesson_start` | User begins a lesson | lessonId, previousProgress |
| `word_view` | Word displayed to user | wordId, viewDuration |
| `answer_attempt` | User submits an answer | answer, correct, timing |
| `pronunciation_attempt` | User tries to pronounce | score, transcription, phonemes |
| `audio_play` | User plays audio | wordId, playCount |
| `option_expand` | User opens accordion | which section, duration |
| `ai_chat_message` | User messages AI | message, context |
| `misclick` | Wrong element clicked | intended, actual, position |
| `skip` | User skips word | wordId, reason (if given) |
| `hint_request` | User asks for hint | wordId, hintType |
| `lesson_complete` | Lesson finished | score, duration, struggles |
| `custom_lesson_request` | User asks AI for lesson | topic, difficulty |
| `session_end` | User closes app | sessionDuration, wordsStudied |

### 5.4 Real-Time Pipeline Architecture (Detailed)

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER INTERACTION LAYER                        │
├─────────────────────────────────────────────────────────────────┤
│  Every click, every answer, every pronunciation attempt         │
│  → Captured immediately                                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EVENT STREAM (Real-Time)                      │
├─────────────────────────────────────────────────────────────────┤
│  • Debounce: 100ms (prevents spam)                              │
│  • Batch: Every 5 seconds OR on significant event               │
│  • Significant = wrong answer, pronunciation <50%, skip         │
│  • localStorage: `${userId}_eventStream` (last 500 events)      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    LEARNING TRACKER SERVICE                      │
├─────────────────────────────────────────────────────────────────┤
│  AGGREGATES:                                                     │
│  • Per-word success rate (rolling 10 attempts)                  │
│  • Pronunciation score trends per word                          │
│  • Time-of-day patterns (user better in morning?)               │
│  • Session length vs performance correlation                    │
│  • Common confusion pairs (eu/tu, ser/estar)                    │
│                                                                  │
│  DETECTS PATTERNS:                                               │
│  • Same word wrong 3+ times → FLAG                              │
│  • Pronunciation plateau (not improving) → FLAG                 │
│  • Fast wrong answers (guessing) → FLAG                         │
│  • Long hesitation then wrong → CONFUSION FLAG                  │
│                                                                  │
│  OUTPUTS:                                                        │
│  • weakWords[] - words user struggles with                      │
│  • confusionPairs[] - words user mixes up                       │
│  • pronunciationIssues[] - phonemes that need work              │
│  • learningVelocity - how fast user is progressing              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ On FLAG or every 30 seconds
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AI MEMORY ENGINE                              │
├─────────────────────────────────────────────────────────────────┤
│  RECEIVES: Current struggle data from Learning Tracker          │
│                                                                  │
│  GENERATES:                                                      │
│  • Memory hooks: "EU sounds like 'ew, that's gross!' - I say"  │
│  • Mnemonics: Visual associations, rhymes, stories              │
│  • Pronunciation tips: "Round your lips like kissing"           │
│  • Context sentences: Using the word in memorable ways          │
│                                                                  │
│  UPDATES UI:                                                     │
│  • AI Tips section in lesson options panel                      │
│  • Push notification if app in background                       │
│  • Chat window if open                                          │
│                                                                  │
│  STORES:                                                         │
│  • Generated tips in `${userId}_aiTips`                         │
│  • Effectiveness tracking (did tip help?)                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ If 5+ failures on same concept
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CUSTOM LESSON GENERATOR                       │
├─────────────────────────────────────────────────────────────────┤
│  TRIGGERS:                                                       │
│  • 5+ failures on one word                                      │
│  • 3+ failures on same phoneme across words                     │
│  • User explicitly requests via chat                            │
│  • Confusion pair detected (mixing up two words)                │
│                                                                  │
│  CREATES:                                                        │
│  • Mini-lesson focused on weak area                             │
│  • Mixes weak words with known words (interleaving)             │
│  • Named: "Custom 1: Pronouns Practice"                         │
│  • Appears in lesson list with 🤖 icon                          │
│                                                                  │
│  USER CONTROL:                                                   │
│  • [Save This Lesson] - keeps for later                         │
│  • [Discard] - removes from list                                │
│  • Progress in custom lessons → fed back to AI                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.5 AI Data Storage Schema

```javascript
// All stored with userId prefix for isolation
const aiDataSchema = {
    // Event stream (last 500 events)
    [`${userId}_events`]: [/* real-time events */],
    
    // Aggregated learning data
    [`${userId}_learning`]: {
        words: {
            'eu': {
                attempts: 15,
                correct: 8,
                successRate: 0.53,
                avgResponseTime: 2400,
                pronunciationScores: [45, 52, 58, 62, 68],
                lastSeen: '2025-12-26T10:30:00Z',
                aiTips: ['Remember: EU = "ew" sound, like I say ew!'],
                mnemonics: ['Picture yourself saying "Ew!" at something gross']
            }
        },
        phonemes: {
            'ão': { avgScore: 45, attempts: 20, improving: true },
            'lh': { avgScore: 72, attempts: 8, improving: false }
        },
        confusionPairs: [
            { word1: 'eu', word2: 'tu', confusionRate: 0.3 },
            { word1: 'ser', word2: 'estar', confusionRate: 0.45 }
        ],
        sessions: {
            totalTime: 14400000, // 4 hours total
            avgSessionLength: 1200000, // 20 mins
            bestPerformanceTime: 'morning',
            streakDays: 7
        }
    },
    
    // AI-generated content
    [`${userId}_aiContent`]: {
        tips: [/* generated tips */],
        mnemonics: [/* memory aids */],
        customLessons: [/* AI-created lessons */]
    },
    
    // AI interaction history
    [`${userId}_aiChat`]: [/* chat messages */]
};
```

### 5.6 AI Model Controls & Best Practices

```javascript
const aiModelConfig = {
    // Model selection
    model: 'qwen2.5:7b',  // Local Ollama
    fallback: 'qwen2.5:3b', // If 7b too slow
    
    // Generation parameters
    temperature: 0.7,      // Creative but not wild
    top_p: 0.9,
    max_tokens: 500,       // Keep responses concise
    
    // System prompt (CRITICAL)
    systemPrompt: `You are a Portuguese language tutor specializing in European Portuguese (PT-PT).

ROLE:
- Help users learn Portuguese through personalized tips and memory aids
- Create mnemonics that are memorable, sometimes funny, but always effective
- Adapt to the user's learning patterns and struggles

RULES:
1. ONLY use European Portuguese, never Brazilian Portuguese
2. Always include pronunciation guides using IPA
3. Make memory aids MEMORABLE - humor, visuals, stories work best
4. Keep responses concise - users are learning, not reading essays
5. If unsure about grammar, say so - never guess
6. Reference user's specific struggles when giving advice

AVAILABLE CONTEXT:
- User's weak words and success rates
- Pronunciation scores and specific phoneme issues
- Confusion pairs (words they mix up)
- Time patterns (when they learn best)
- Previous tips you've given and their effectiveness

FORMAT:
- Use emojis sparingly for engagement
- Bold key Portuguese words
- Include IPA pronunciation: /example/
- Structure tips with clear headings`,

    // Guardrails
    guardrails: {
        maxResponseLength: 500,
        bannedTopics: ['politics', 'religion', 'adult content'],
        requiredElements: ['portuguese_word', 'pronunciation'],
        factCheckSources: true, // Only use whitelisted sources
    },
    
    // Rate limiting
    rateLimits: {
        tipsPerMinute: 5,
        chatMessagesPerMinute: 10,
        customLessonsPerHour: 3
    },
    
    // Logging
    logging: {
        logAllPrompts: true,
        logAllResponses: true,
        logTokenUsage: true,
        retainDays: 30
    }
};
```

### 5.7 Implementation Tasks

| Task ID | Task | Status | Tests | Cleanup | Priority |
|---------|------|--------|-------|---------|----------|
| AI-001 | Create `EventStream.js` - real-time event capture | [ ] | [ ] | N/A | P0 |
| AI-002 | Create `LearningTracker.js` - aggregation service | [ ] | [ ] | [ ] | P0 |
| AI-003 | Implement pattern detection algorithms | [ ] | [ ] | N/A | P0 |
| AI-004 | Create `AIMemoryEngine.js` - tip generation | [ ] | [ ] | N/A | P0 |
| AI-005 | Create `CustomLessonGenerator.js` | [ ] | [ ] | N/A | P0 |
| AI-006 | Build mnemonic generation prompts | [ ] | [ ] | N/A | P0 |
| AI-007 | Implement pronunciation issue detection | [ ] | [ ] | N/A | P0 |
| AI-008 | Create confusion pair detection | [ ] | [ ] | N/A | P0 |
| AI-009 | Build user data isolation layer | [ ] | [ ] | [ ] | P0 |
| AI-010 | Create AI configuration UI (admin) | [ ] | [ ] | N/A | P1 |
| AI-011 | Implement rate limiting | [ ] | [ ] | N/A | P0 |
| AI-012 | Build AI logging system | [ ] | [ ] | N/A | P0 |
| AI-013 | Create tip effectiveness tracking | [ ] | [ ] | N/A | P1 |
| AI-014 | Wire real-time updates to UI | [ ] | [ ] | [ ] | P0 |

---

## Phase 5B: Floating AI Chat Interface

### 5B.1 Design Requirements

The AI chat must be:
- **Always available** - floating button on every page
- **Expandable/Collapsible** - full window ↔ small button
- **Voice-enabled** - speak to it OR type
- **Context-aware** - knows what lesson you're in
- **Action-capable** - can create lessons, explain words

### 5B.2 Visual Design

**Collapsed State (Always Visible):**
```
                                        ┌─────┐
                                        │ 💬  │  ← Bottom-right, always visible
                                        └─────┘
```

**Expanded State:**
```
┌────────────────────────────────────────────────────────────────┐
│ 🤖 Portuguese Tutor                              [_] [□] [✕]  │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Context: Lesson BB-001 - Personal Pronouns                    │
│  Currently viewing: "eu" (I)                                   │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  🤖 Olá! I see you're working on pronouns. I noticed you've   │
│     struggled with "eu" a few times. Here's a memory trick:   │
│                                                                │
│     "EU" /ew/ sounds like saying "Ew!" when you see           │
│     something gross. Picture yourself pointing at yourself     │
│     and saying "Ew, that's ME!"                               │
│                                                                │
│     [🔊 Hear "eu"]  [🔊 Hear example sentence]                │
│                                                                │
│  ─────────────────────────────────────────────────────────────│
│                                                                │
│  👤 Can you create a mini-lesson for the pronouns I keep      │
│     getting wrong?                                             │
│                                                                │
│  ─────────────────────────────────────────────────────────────│
│                                                                │
│  🤖 Absolutely! I'll create a custom lesson focusing on:      │
│     • eu (25% success rate)                                   │
│     • tu (40% success rate)                                   │
│     • eles vs elas (you mix these up often)                   │
│                                                                │
│     [Create "Pronoun Practice" Lesson]                        │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│  Settings:                                                     │
│  [✓] Audio responses  [✓] Portuguese accent  [ ] Auto-speak  │
│  Voice: [🇵🇹 Raquel ▼]  Speed: [Normal ▼]                     │
├────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ Type your message...                                     │  │
│ └──────────────────────────────────────────────────────────┘  │
│ [🎤 Voice]                                          [Send ➤] │
└────────────────────────────────────────────────────────────────┘
```

### 5B.3 Chat Commands (User Can Ask)

| Command | What AI Does |
|---------|--------------|
| "Help me with [word]" | Explains word with tips, examples, pronunciation |
| "Create a lesson for my weak words" | Generates custom lesson from struggle data |
| "Why do I keep confusing [word1] and [word2]?" | Explains difference, creates comparison |
| "Give me a memory trick for [word]" | Generates mnemonic |
| "How do I pronounce [word]?" | IPA + audio + tips + mouth position |
| "Quiz me on [topic]" | Starts interactive quiz in chat |
| "What should I practice?" | Analyzes data, suggests focus areas |
| "Show my progress" | Displays stats and trends |
| "Explain [grammar concept]" | Grammar explanation with examples |

### 5B.4 Voice Interface

```javascript
const voiceChatConfig = {
    // Input (User speaking)
    speechRecognition: {
        language: 'pt-PT',          // Listen for Portuguese
        fallbackLanguage: 'en-GB',  // Also understand English
        continuous: false,          // Press-to-talk
        interimResults: true,       // Show as they speak
    },
    
    // Output (AI speaking)
    textToSpeech: {
        voice: 'pt-PT-RaquelNeural', // Portuguese accent
        rate: 1.0,                   // User-adjustable
        pitch: 1.0,
        autoSpeak: false,            // User must click to hear
    },
    
    // UI Behavior
    voiceButton: {
        holdToTalk: true,           // Hold button to speak
        visualFeedback: true,       // Pulse animation while listening
        transcriptPreview: true,    // Show what was heard before sending
    }
};
```

### 5B.5 Implementation Tasks

| Task ID | Task | Status | Tests | Cleanup | Priority |
|---------|------|--------|-------|---------|----------|
| CHAT-001 | Create floating button component | [ ] | [ ] | N/A | P0 |
| CHAT-002 | Create expandable chat window | [ ] | [ ] | N/A | P0 |
| CHAT-003 | Implement collapse/expand animation | [ ] | [ ] | N/A | P0 |
| CHAT-004 | Build message rendering system | [ ] | [ ] | N/A | P0 |
| CHAT-005 | Integrate Ollama for responses | [ ] | [ ] | [ ] | P0 |
| CHAT-006 | Add context awareness (current lesson) | [ ] | [ ] | N/A | P0 |
| CHAT-007 | Implement voice input (speech-to-text) | [ ] | [ ] | [ ] | P0 |
| CHAT-008 | Implement voice output (text-to-speech) | [ ] | [ ] | [ ] | P0 |
| CHAT-009 | Create chat settings panel | [ ] | [ ] | N/A | P1 |
| CHAT-010 | Build command parser ("create lesson") | [ ] | [ ] | N/A | P0 |
| CHAT-011 | Implement "Create Lesson" action | [ ] | [ ] | N/A | P0 |
| CHAT-012 | Add audio playback buttons in chat | [ ] | [ ] | N/A | P0 |
| CHAT-013 | Persist chat history per user | [ ] | [ ] | N/A | P1 |
| CHAT-014 | Add chat minimized notification badge | [ ] | [ ] | N/A | P2 |

---

## Phase 6: AI Governance Dashboard

### 6.1 Whitelisted Sources

The AI can ONLY reference these credible sources:

| Source | URL | Type |
|--------|-----|------|
| European Portuguese Info | https://european-portuguese.info | Grammar/Vocabulary |
| Ciberdúvidas | https://ciberduvidas.iscte-iul.pt | Grammar Authority |
| Priberam Dictionary | https://www.priberam.pt/dlpo | Dictionary |
| Linguee | https://www.linguee.pt | Translation/Context |
| Infopédia | https://www.infopedia.pt | Encyclopedia |
| Forvo | https://forvo.com/languages/pt_pt | Pronunciation |

### 6.2 AI Dashboard Design

```
┌─────────────────────────────────────────────────────────────────┐
│                     🤖 AI Governance Dashboard                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Status: 🟢 Active    Model: qwen2.5:7b    Uptime: 4h 23m       │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  📊 Current Session Metrics                                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Words processed: 45    │ Tips generated: 12              │    │
│  │ Avg response time: 234ms │ Custom lessons: 2 active      │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  📚 Reference Material                                           │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ ✅ Teaching Methodology (local)                          │    │
│  │ ✅ Word Knowledge Database                               │    │
│  │ ✅ Pronunciation Guide                                   │    │
│  │ 🔗 Whitelisted Sources (6 sites)  [Manage ▶]            │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  🔒 Data Controls (Admin Only)                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ [Delete All Failures]  [Reset Learning Data]             │    │
│  │ [Clear Custom Lessons] [Export User Data]                │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  📝 Recent AI Activity Log                                       │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 14:23:45 - Generated tip for word "coração"             │    │
│  │ 14:23:12 - Created custom lesson "Nasal Vowels Review"  │    │
│  │ 14:22:58 - Detected pattern: 3 failures on "ão" sounds  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.3 Teaching Methodology Document

Create `docs/TEACHING_METHODOLOGY.md` with:
- Spaced Repetition (SM-2 algorithm)
- Comprehensible Input Theory
- Active Recall principles
- Interleaving Practice
- Phonetic approach for pronunciation

### 6.4 Implementation Tasks

| Task ID | Task | Status | Tests | Cleanup | Priority |
|---------|------|--------|-------|---------|----------|
| GOV-001 | Create AI Dashboard page | [ ] | [ ] | N/A | P1 |
| GOV-002 | Create `WhitelistManager.js` service | [ ] | [ ] | N/A | P1 |
| GOV-003 | Build whitelist CRUD UI | [ ] | [ ] | N/A | P1 |
| GOV-004 | Implement reference material viewer | [ ] | [ ] | N/A | P1 |
| GOV-005 | Add AI activity logging | [ ] | [ ] | N/A | P1 |
| GOV-006 | Create data control actions | [ ] | [ ] | N/A | P1 |
| GOV-007 | Write `TEACHING_METHODOLOGY.md` | [ ] | N/A | N/A | P1 |
| GOV-008 | Implement web lookup for whitelisted sites | [ ] | [ ] | N/A | P2 |

---

## Phase 7: Authentication System

### 7.1 Current Problem

- User login not working
- No proper user creation flow
- All options available without login
- No data isolation between users

### 7.2 Authentication Flow

```
App Launch
    │
    ▼
Check localStorage for session
    │
    ├─► Session valid → Load user data → Show app
    │
    └─► No session → Show login screen
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
    [Login]     [Create Account]   [Guest Mode]
         │               │               │
         │               │               └─► Limited features
         │               │
         │               └─► Admin must exist first
         │                   Admin creates user
         │
         └─► Validate credentials
             Load user data
             AI only sees this user's data
```

### 7.3 Role Permissions

| Feature | Guest | User | Admin |
|---------|-------|------|-------|
| View lessons | ✅ | ✅ | ✅ |
| Save progress | ❌ | ✅ | ✅ |
| AI Chat | ❌ | ✅ | ✅ |
| Custom lessons | ❌ | ✅ | ✅ |
| View own stats | ❌ | ✅ | ✅ |
| Create users | ❌ | ❌ | ✅ |
| Edit any user | ❌ | ❌ | ✅ |
| Delete data | ❌ | ❌ | ✅ |
| View monitoring | ❌ | ❌ | ✅ |
| AI Dashboard | ❌ | ❌ | ✅ |

### 7.4 Admin Panel for User Management

```
┌─────────────────────────────────────────────────────────────────┐
│                     ⚙️ Admin Control Panel                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  👥 User Management                                              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ User        │ Hearts │ Streak │ XP    │ Actions         │    │
│  │─────────────┼────────┼────────┼───────┼─────────────────│    │
│  │ user_dan    │ ❤️ 3   │ 🔥 7   │ ⭐ 250│ [Edit] [Delete] │    │
│  │ user_maria  │ ❤️ 5   │ 🔥 12  │ ⭐ 450│ [Edit] [Delete] │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  [+ Create User]                                                 │
│                                                                  │
│  📊 Edit User: user_dan                                          │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Hearts:  [3 ▼] / 5    [Refill All]                      │    │
│  │ Streak:  [7    ]      [Reset]                           │    │
│  │ XP:      [250  ]      [Add 100] [Remove 100]            │    │
│  │ Role:    [User ▼]     (User / Admin)                    │    │
│  │                                                          │    │
│  │ Learning Data:                                           │    │
│  │ [Delete Failures] [Delete Pronunciation Data]            │    │
│  │ [Delete All Progress] [Export Data]                      │    │
│  │                                                          │    │
│  │ [Save Changes]  [Cancel]                                 │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.5 Implementation Tasks

| Task ID | Task | Status | Tests | Cleanup | Priority |
|---------|------|--------|-------|---------|----------|
| AUTH-001 | Create `LoginModal.js` component | [ ] | [ ] | N/A | P0 |
| AUTH-002 | Create `AuthService.js` (refactor auth.js) | [ ] | [ ] | [ ] | P0 |
| AUTH-003 | Implement user registration | [ ] | [ ] | N/A | P0 |
| AUTH-004 | Add session management | [ ] | [ ] | [ ] | P0 |
| AUTH-005 | Create guest mode | [ ] | [ ] | N/A | P1 |
| AUTH-006 | Implement data isolation by userId | [ ] | [ ] | [ ] | P0 |
| AUTH-007 | Create admin user creation flow | [ ] | [ ] | N/A | P0 |
| AUTH-008 | Build Admin Panel page | [ ] | [ ] | N/A | P0 |
| AUTH-009 | Implement hearts/streak/XP manual adjust | [ ] | [ ] | N/A | P0 |
| AUTH-010 | Create user deletion with confirmation | [ ] | [ ] | N/A | P1 |
| AUTH-011 | Add learning data controls | [ ] | [ ] | N/A | P1 |
| AUTH-012 | Implement data export | [ ] | [ ] | N/A | P2 |
| AUTH-013 | Create logout functionality | [ ] | [ ] | [ ] | P0 |

---

## Phase 8: Voice System Fixes

### 8.1 Current Problems

| Issue ID | Description | Severity |
|----------|-------------|----------|
| VOICE-001 | Download button doesn't always make voice available | Critical |
| VOICE-002 | Speed setting not applied (always 100%) | Critical |
| VOICE-003 | No refresh/check for new voices | High |
| VOICE-004 | Installed voices still shown in download list | Medium |
| VOICE-005 | AI chat cannot speak with Portuguese accent | Resolved |

### 8.2 Fixes Required

```javascript
// Fix 1: Reliable download → activate flow
async function downloadAndActivate(voiceId) {
    // 1. Show download progress
    // 2. Download voice file
    // 3. Verify integrity (SHA-256)
    // 4. Store in cache
    // 5. Add to available voices dropdown
    // 6. Auto-select the new voice
    // 7. Play test phrase to confirm
}

// Fix 2: Speed control properly wired
function applySpeed(utterance, speed) {
    // Ensure rate is set BEFORE speak()
    utterance.rate = speed; // 0.5 = half speed
    // Test with actual TTS call
}

// Fix 3: Voice catalog refresh
async function refreshVoiceCatalog() {
    // 1. Check online source for new voices
    // 2. Compare with locally installed
    // 3. Return only NOT installed voices
}

// Fix 4: Filter installed from download list
function getDownloadableVoices(catalog, installed) {
    return catalog.filter(v => !installed.includes(v.id));
}
```

### 8.3 Implementation Tasks

| Task ID | Task | Status | Tests | Cleanup | Priority |
|---------|------|--------|-------|---------|----------|
| VOICE-001 | Fix download → activate flow | [ ] | [ ] | [ ] | P0 |
| VOICE-002 | Wire speed control properly | [ ] | [ ] | [ ] | P0 |
| VOICE-003 | Implement voice catalog refresh | [ ] | [ ] | N/A | P1 |
| VOICE-004 | Filter installed from download list | [ ] | [ ] | N/A | P1 |
| VOICE-005 | Add download verification | [ ] | [ ] | N/A | P1 |
| VOICE-006 | Create voice test suite | [ ] | [ ] | N/A | P1 |
| VOICE-007 | Add Portuguese accent to AI chat | [x] | [x] | N/A | P0 |
| VOICE-008 | Create `VoiceDownloader.js` service | [ ] | [ ] | [ ] | P0 |

---

## Phase 9: Monitoring & Health Checks

### 9.1 Core Requirement: Every Button Must Be Validated

The monitoring system must check **EVERY interactive element** in the app and report:
1. Does it **exist** in the DOM?
2. Is it **visible** to the user?
3. Is it **clickable** (not disabled, not obscured)?
4. Does it **do what it's supposed to do**?

### 9.2 Complete Component Registry

Every button, control, and feature must be registered:

```javascript
const componentRegistry = {
    // NAVIGATION
    'nav-home': {
        name: 'Home Navigation',
        selector: '#nav-home, [data-nav="home"]',
        type: 'navigation',
        expectedBehavior: 'Shows home page',
        tests: ['exists', 'visible', 'clickable', 'navigates-to-home']
    },
    'nav-learn': {
        name: 'Learn Navigation',
        selector: '#nav-learn, [data-nav="learn"]',
        type: 'navigation',
        expectedBehavior: 'Shows lesson grid',
        tests: ['exists', 'visible', 'clickable', 'navigates-to-lessons']
    },
    'nav-practice': {
        name: 'Practice Navigation',
        selector: '#nav-practice, [data-nav="practice"]',
        type: 'navigation',
        expectedBehavior: 'Shows practice options',
        tests: ['exists', 'visible', 'clickable', 'navigates-to-practice']
    },
    
    // LESSON CONTROLS
    'lesson-start-btn': {
        name: 'Start Lesson Button',
        selector: '.lesson-card .start-btn, #startLessonBtn',
        type: 'action',
        expectedBehavior: 'Begins selected lesson',
        tests: ['exists', 'visible', 'clickable', 'starts-lesson']
    },
    'lesson-next-btn': {
        name: 'Next Word Button',
        selector: '#nextBtn, .next-word-btn',
        type: 'action',
        expectedBehavior: 'Shows next word in lesson',
        tests: ['exists', 'visible', 'clickable', 'advances-word']
    },
    'lesson-prev-btn': {
        name: 'Previous Word Button',
        selector: '#prevBtn, .prev-word-btn',
        type: 'action',
        expectedBehavior: 'Shows previous word',
        tests: ['exists', 'visible', 'clickable', 'goes-back']
    },
    
    // VOICE CONTROLS
    'voice-play-btn': {
        name: 'Play Audio Button',
        selector: '.play-audio-btn, #playAudioBtn',
        type: 'action',
        expectedBehavior: 'Plays word pronunciation',
        tests: ['exists', 'visible', 'clickable', 'plays-audio']
    },
    'voice-speed-slider': {
        name: 'Voice Speed Control',
        selector: '#voiceSpeedSlider, .speed-control',
        type: 'control',
        expectedBehavior: 'Changes playback speed',
        tests: ['exists', 'visible', 'interactive', 'speed-changes']
    },
    'voice-download-btn': {
        name: 'Download Voice Button',
        selector: '#downloadVoiceBtn, .download-voice',
        type: 'action',
        expectedBehavior: 'Downloads selected voice',
        tests: ['exists', 'visible', 'clickable', 'initiates-download']
    },
    'voice-selector': {
        name: 'Voice Selector Dropdown',
        selector: '#voiceSelect, .voice-dropdown',
        type: 'control',
        expectedBehavior: 'Lists available voices',
        tests: ['exists', 'visible', 'has-options', 'selection-applies']
    },
    
    // AI CONTROLS
    'ai-chat-btn': {
        name: 'AI Chat Button',
        selector: '#aiChatBtn, .ai-chat-toggle',
        type: 'action',
        expectedBehavior: 'Opens AI chat window',
        tests: ['exists', 'visible', 'clickable', 'opens-chat']
    },
    'ai-send-btn': {
        name: 'AI Send Message Button',
        selector: '#aiSendBtn, .chat-send',
        type: 'action',
        expectedBehavior: 'Sends message to AI',
        tests: ['exists', 'visible', 'clickable', 'sends-message']
    },
    'ai-voice-input-btn': {
        name: 'AI Voice Input Button',
        selector: '#aiVoiceToggle, .ai-voice-toggle',
        type: 'action',
        expectedBehavior: 'Starts voice recording',
        tests: ['exists', 'visible', 'clickable', 'starts-recording']
    },

    'ai-handsfree-btn': {
        name: 'AI Hands-free Voice Call Button',
        selector: '#aiHandsFreeToggle, .ai-handsfree-toggle',
        type: 'action',
        expectedBehavior: 'Starts/stops hands-free voice conversation loop',
        tests: ['exists', 'visible', 'clickable', 'starts-voice-call', 'stops-voice-call']
    },

    'ai-auto-speak-btn': {
        name: 'AI Auto-speak Replies Button',
        selector: '#aiAutoSpeakToggle, .ai-auto-speak-toggle',
        type: 'control',
        expectedBehavior: 'Toggles whether assistant replies are spoken',
        tests: ['exists', 'visible', 'clickable', 'state-persists']
    },
    
    // ACCORDION PANELS
    'panel-pronunciation': {
        name: 'Pronunciation Panel',
        selector: '[data-panel="pronunciation"]',
        type: 'accordion',
        expectedBehavior: 'Expands/collapses pronunciation section',
        tests: ['exists', 'visible', 'clickable', 'toggles-content']
    },
    'panel-grammar': {
        name: 'Grammar Panel',
        selector: '[data-panel="grammar"]',
        type: 'accordion',
        expectedBehavior: 'Expands/collapses grammar section',
        tests: ['exists', 'visible', 'clickable', 'toggles-content']
    },
    'panel-ai-tips': {
        name: 'AI Tips Panel',
        selector: '[data-panel="ai-tips"]',
        type: 'accordion',
        expectedBehavior: 'Shows AI-generated tips',
        tests: ['exists', 'visible', 'clickable', 'shows-tips']
    },
    
    // QUIZ CONTROLS
    'quiz-option-btns': {
        name: 'Quiz Option Buttons',
        selector: '.quiz-option, .answer-btn',
        type: 'action',
        expectedBehavior: 'Selects answer option',
        tests: ['exists', 'visible', 'clickable', 'registers-answer']
    },
    'quiz-submit-btn': {
        name: 'Submit Answer Button',
        selector: '#submitAnswerBtn, .submit-quiz',
        type: 'action',
        expectedBehavior: 'Submits current answer',
        tests: ['exists', 'visible', 'clickable', 'submits-answer']
    },
    
    // AUTH CONTROLS
    'login-btn': {
        name: 'Login Button',
        selector: '#loginBtn, .login-button',
        type: 'action',
        expectedBehavior: 'Opens login modal',
        tests: ['exists', 'visible', 'clickable', 'opens-login']
    },
    'logout-btn': {
        name: 'Logout Button',
        selector: '#logoutBtn, .logout-button',
        type: 'action',
        expectedBehavior: 'Logs user out',
        tests: ['exists', 'visible', 'clickable', 'logs-out']
    },
    
    // SERVICES (Background)
    'service-ollama': {
        name: 'AI Service (Ollama)',
        type: 'service',
        endpoint: 'http://localhost:11434/api/tags',
        expectedBehavior: 'AI model is running and responsive',
        tests: ['reachable', 'responds-valid', 'model-loaded']
    },
    'service-tts': {
        name: 'TTS Service',
        type: 'service',
        endpoint: 'http://localhost:3001/health',
        expectedBehavior: 'Text-to-speech server is running',
        tests: ['reachable', 'responds-valid', 'can-synthesize']
    },
    'service-whisper': {
        name: 'Speech Recognition (Whisper)',
        type: 'service',
        expectedBehavior: 'Speech-to-text is available',
        tests: ['model-loaded', 'can-transcribe']
    }
};
```

### 9.3 Health Check Result Schema

```javascript
const healthCheckResult = {
    timestamp: '2025-12-26T14:30:00.000Z',
    overall: 'degraded', // 'healthy' | 'degraded' | 'critical'
    
    components: [
        {
            id: 'voice-speed-slider',
            name: 'Voice Speed Control',
            status: 'broken', // 'working' | 'broken' | 'missing'
            
            tests: [
                { test: 'exists', passed: true, details: 'Element found' },
                { test: 'visible', passed: true, details: 'Element visible' },
                { test: 'interactive', passed: true, details: 'Can change value' },
                { test: 'speed-changes', passed: false, details: 'Speed value changes but audio playback speed unchanged' }
            ],
            
            // CRITICAL: Why is it broken?
            failureReason: 'Element exists and is interactive, but the speed value is not being applied to the audio playback. The speechSynthesis.rate property is not being set.',
            suggestedFix: 'Ensure utterance.rate = speed is called before speechSynthesis.speak(utterance)',
            
            lastWorking: '2025-12-25T10:00:00.000Z',
            admin: {
                showDetails: true,
                canRetry: true,
                canDisable: true
            }
        },
        {
            id: 'service-ollama',
            name: 'AI Service (Ollama)',
            status: 'working',
            
            tests: [
                { test: 'reachable', passed: true, details: 'http://localhost:11434 responded in 45ms' },
                { test: 'responds-valid', passed: true, details: 'API returned valid JSON' },
                { test: 'model-loaded', passed: true, details: 'qwen2.5:7b is loaded and ready' }
            ],
            
            metrics: {
                responseTime: 45,
                modelMemory: '4.2GB',
                uptime: '4h 23m'
            }
        }
    ],
    
    summary: {
        total: 25,
        working: 22,
        broken: 2,
        missing: 1,
        
        byCategory: {
            navigation: { working: 5, broken: 0, missing: 0 },
            voice: { working: 2, broken: 2, missing: 0 },
            ai: { working: 3, broken: 0, missing: 0 },
            lessons: { working: 8, broken: 0, missing: 1 },
            services: { working: 4, broken: 0, missing: 0 }
        }
    }
};
```

### 9.4 Admin Monitoring Dashboard Design

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        📊 SYSTEM MONITORING DASHBOARD                        │
│                        Last checked: 2 seconds ago                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  OVERALL STATUS: 🟠 DEGRADED (22/25 components working)                     │
│  ═══════════════════════════════════════════════════════════════════════    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         QUICK STATUS GRID                           │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │                                                                      │    │
│  │  NAVIGATION          VOICE              AI                LESSONS   │    │
│  │  🟢 Home            🟢 Play Audio      🟢 Chat Button    🟢 Start   │    │
│  │  🟢 Learn           🔴 Speed Control  🟢 Send Message   🟢 Next    │    │
│  │  🟢 Practice        🔴 Download       🟢 Voice Input    🟢 Prev    │    │
│  │  🟢 Profile         🟢 Voice Select   🟢 Tips Panel     🟢 Options │    │
│  │  🟢 Admin                                                🟠 Quiz   │    │
│  │                                                                      │    │
│  │  SERVICES                              AUTH                          │    │
│  │  🟢 Ollama (45ms)                     🟢 Login                      │    │
│  │  🟢 TTS Server                        🟢 Logout                     │    │
│  │  🟢 Whisper                           🟢 Session                    │    │
│  │                                                                      │    │
│  │  Legend: 🟢 Working  🟠 Degraded  🔴 Broken  ⚪ Not Checked         │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                              BROKEN COMPONENTS                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  🔴 Voice Speed Control                                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ Status: BROKEN - Element exists but functionality not working        │    │
│  │                                                                      │    │
│  │ Tests:                                                               │    │
│  │   ✅ Element exists                                                  │    │
│  │   ✅ Element visible                                                 │    │
│  │   ✅ Slider is interactive                                          │    │
│  │   ❌ Speed actually changes playback                                │    │
│  │                                                                      │    │
│  │ WHY IT'S FAILING:                                                   │    │
│  │   The slider value updates in the UI, but the speech synthesis      │    │
│  │   rate property is not being set before playback begins.            │    │
│  │                                                                      │    │
│  │ SUGGESTED FIX:                                                      │    │
│  │   In audio.js line 142, add: utterance.rate = speedValue            │    │
│  │   before calling speechSynthesis.speak(utterance)                   │    │
│  │                                                                      │    │
│  │ [Retry Test]  [View Code]  [Disable Feature]  [Mark Fixed]         │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  🔴 Voice Download Button                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ Status: BROKEN - Downloads but voice not added to dropdown          │    │
│  │                                                                      │    │
│  │ Tests:                                                               │    │
│  │   ✅ Button exists                                                   │    │
│  │   ✅ Button clickable                                                │    │
│  │   ✅ Download initiates                                              │    │
│  │   ❌ Voice appears in dropdown after download                       │    │
│  │                                                                      │    │
│  │ WHY IT'S FAILING:                                                   │    │
│  │   Download completes successfully but refreshVoiceList() is not     │    │
│  │   called after download completion.                                 │    │
│  │                                                                      │    │
│  │ [Retry Test]  [View Code]  [Disable Feature]  [Mark Fixed]         │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                              RECENT LOGS                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│  [Filter: All ▼] [Level: All ▼] [Component: All ▼]  [Clear] [Export]       │
│                                                                              │
│  14:30:02 [ERROR] voice-speed-slider: Test 'speed-changes' failed           │
│           Details: Slider set to 0.5, but audio played at rate 1.0          │
│           File: audio.js:142                                                 │
│                                                                              │
│  14:30:01 [ERROR] voice-download-btn: Test 'voice-appears' failed           │
│           Details: Voice 'pt-PT-Raquel' downloaded but not in dropdown      │
│           File: audio.js:89                                                  │
│                                                                              │
│  14:30:00 [INFO] Health check started - checking 25 components              │
│                                                                              │
│  14:29:55 [INFO] User 'dan' logged in                                       │
│                                                                              │
│  14:29:50 [INFO] service-ollama: Response time 45ms, model ready            │
│                                                                              │
│  [Show More Logs...]                                                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 9.5 User Data View (For Admin)

Admin must be able to see ALL data for any user:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        👤 USER DATA: dan_learner                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  GAMIFICATION                    PROGRESS                                    │
│  ❤️ Hearts: 3/5                  📚 Lessons completed: 12                   │
│  🔥 Streak: 7 days               📝 Words learned: 156                      │
│  ⭐ XP: 2,450                    🎯 Accuracy: 72%                           │
│                                                                              │
│  [+Heart] [-Heart] [Reset Streak] [+100 XP] [-100 XP]                       │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                         WEAK WORDS (AI Data)                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Word       │ Attempts │ Success │ Last Score │ AI Tips Generated           │
│  ───────────┼──────────┼─────────┼────────────┼───────────────────────      │
│  coração    │ 12       │ 25%     │ 42%        │ 3 tips                      │
│  obrigado   │ 8        │ 38%     │ 55%        │ 2 tips                      │
│  trabalhar  │ 6        │ 33%     │ 48%        │ 2 tips                      │
│                                                                              │
│  [Delete Failure Data]  [Delete All Word Data]                              │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                       PRONUNCIATION SCORES                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Phoneme   │ Avg Score │ Attempts │ Trend                                   │
│  ──────────┼───────────┼──────────┼──────────                               │
│  ão        │ 45%       │ 24       │ ↗ Improving                             │
│  lh        │ 62%       │ 15       │ → Stable                                │
│  nh        │ 58%       │ 12       │ ↘ Declining                             │
│                                                                              │
│  [Delete Pronunciation Data]                                                │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                         CUSTOM LESSONS                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Custom 1: Nasal Vowels Practice  │ Created: Dec 25 │ Progress: 60%        │
│  Custom 2: Pronoun Confusion      │ Created: Dec 26 │ Progress: 0%         │
│                                                                              │
│  [Delete Custom Lessons]                                                    │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                         AI CHAT HISTORY                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Session: Dec 26, 2025                                                      │
│  - User: "Help me with coração"                                             │
│  - AI: Generated tip about heart shape...                                   │
│  - User: "Create a lesson for nasal sounds"                                 │
│  - AI: Created Custom 2 lesson                                              │
│                                                                              │
│  [View Full History]  [Delete Chat History]                                 │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                           DATA ACTIONS                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  [Export All User Data (JSON)]                                              │
│  [Delete All Learning Data] ⚠️                                              │
│  [Delete User Account] ⚠️⚠️                                                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 9.6 Implementation Tasks

| Task ID | Task | Status | Tests | Cleanup | Priority |
|---------|------|--------|-------|---------|----------|
| MON-001 | Create component registry system | [ ] | [ ] | N/A | P0 |
| MON-002 | Build `HealthChecker.js` service | [ ] | [ ] | [ ] | P0 |
| MON-003 | Create test runners for each test type | [ ] | [ ] | N/A | P0 |
| MON-004 | Implement 'exists' test | [ ] | [ ] | N/A | P0 |
| MON-005 | Implement 'visible' test | [ ] | [ ] | N/A | P0 |
| MON-006 | Implement 'clickable' test | [ ] | [ ] | N/A | P0 |
| MON-007 | Implement 'functionality' tests | [ ] | [ ] | N/A | P0 |
| MON-008 | Create `Logger.js` service | [ ] | [ ] | [ ] | P0 |
| MON-009 | Build monitoring dashboard page | [ ] | [ ] | N/A | P0 |
| MON-010 | Create status grid component | [ ] | [ ] | N/A | P0 |
| MON-011 | Create broken component detail view | [ ] | [ ] | N/A | P0 |
| MON-012 | Create log viewer component | [ ] | [ ] | N/A | P0 |
| MON-013 | Add log filtering/search | [ ] | [ ] | N/A | P1 |
| MON-014 | Create user data view (admin) | [ ] | [ ] | N/A | P0 |
| MON-015 | Implement startup validation | [ ] | [ ] | N/A | P0 |
| MON-016 | Add "Why it's failing" analysis | [ ] | [ ] | N/A | P0 |
| MON-017 | Create health check scheduler | [ ] | [ ] | N/A | P1 |
| MON-018 | Add component retry functionality | [ ] | [ ] | N/A | P1 |
| MON-019 | Implement log export | [ ] | [ ] | N/A | P2 |
| MON-020 | Add real-time status updates | [ ] | [ ] | N/A | P1 |

---

## Phase 10: UI Polish & Animations

### 10.1 Animation Catalog

```css
/* Page transitions */
.page-enter { animation: fade-slide-in 300ms ease-out; }
.page-exit { animation: fade-slide-out 200ms ease-in; }

/* Modal animations */
.modal-enter { animation: slide-up 300ms cubic-bezier(0.34, 1.56, 0.64, 1); }
.modal-exit { animation: slide-down 200ms ease-in; }

/* Card animations */
.card:hover { transform: scale(1.02); transition: 150ms ease-out; }
.card:active { transform: scale(0.98); transition: 100ms ease-in; }

/* Feedback animations */
.success { animation: pulse-green 500ms ease-out; }
.error { animation: shake 400ms ease-out; }

/* Accordion */
.accordion-content { transition: max-height 300ms ease-out; }

/* Hearts */
.heart-lose { animation: heart-break 500ms ease-out; }
.heart-gain { animation: heart-pulse 400ms ease-out; }
```

### 10.2 Font Size Control

```javascript
const fontSizes = {
    small: { base: '14px', heading: '1.5rem', small: '12px' },
    medium: { base: '16px', heading: '1.75rem', small: '14px' },
    large: { base: '18px', heading: '2rem', small: '16px' },
    xlarge: { base: '20px', heading: '2.25rem', small: '18px' }
};
```

### 10.3 Implementation Tasks

| Task ID | Task | Status | Tests | Cleanup | Priority |
|---------|------|--------|-------|---------|----------|
| UI-001 | Create `animations.css` | [ ] | N/A | [ ] | P1 |
| UI-002 | Add page transitions | [ ] | [ ] | N/A | P1 |
| UI-003 | Implement modal animations | [ ] | [ ] | N/A | P1 |
| UI-004 | Add card hover/press effects | [ ] | [ ] | N/A | P2 |
| UI-005 | Create feedback animations | [ ] | [ ] | N/A | P1 |
| UI-006 | Implement font size control | [ ] | [ ] | N/A | P1 |
| UI-007 | Add accessibility settings panel | [ ] | [ ] | N/A | P1 |
| UI-008 | Create loading skeletons | [ ] | [ ] | N/A | P2 |
| UI-009 | Add confetti on lesson complete | [ ] | [ ] | N/A | P2 |

---

## Phase 11: Practice & Flashcards

### 11.1 Flashcard Improvements (LOW PRIORITY)

| Task ID | Task | Status | Tests | Cleanup | Priority |
|---------|------|--------|-------|---------|----------|
| FLASH-001 | Redesign flashcard UI | [ ] | [ ] | [ ] | P2 |
| FLASH-002 | Add swipe gestures (mobile) | [ ] | [ ] | N/A | P2 |
| FLASH-003 | Improve spaced repetition | [ ] | [ ] | N/A | P2 |
| FLASH-004 | Add flashcard stats | [ ] | [ ] | N/A | P2 |
| FLASH-005 | Review practice section UX | [ ] | [ ] | [ ] | P2 |

---

## Phase 12: Graceful Degradation

### 12.1 Degradation Rules

```javascript
const degradationRules = {
    'ai-service-down': {
        hide: ['ai-chat-button', 'ai-tips-section', 'custom-lessons-tab'],
        show: ['ai-unavailable-notice'],
        adminOnly: ['ai-status-details'],
        lessonsWork: true,
        message: 'AI features temporarily unavailable. Lessons continue to work.'
    },
    
    'voice-service-down': {
        hide: ['voice-play-buttons', 'pronunciation-challenges'],
        show: ['voice-unavailable-notice'],
        lessonsWork: true,
        fallback: 'text-only-mode',
        message: 'Audio unavailable. Text-based learning continues.'
    },
    
    'whisper-unavailable': {
        hide: ['speech-input-button'],
        show: ['speech-unavailable-notice'],
        lessonsWork: true,
        fallback: 'text-input-only',
        message: 'Speech recognition unavailable. Type your answers instead.'
    }
};
```

### 12.2 Implementation Tasks

| Task ID | Task | Status | Tests | Cleanup | Priority |
|---------|------|--------|-------|---------|----------|
| DEG-001 | Define all degradation rules | [ ] | N/A | N/A | P0 |
| DEG-002 | Implement feature hiding | [ ] | [ ] | N/A | P0 |
| DEG-003 | Create fallback notices | [ ] | [ ] | N/A | P0 |
| DEG-004 | Add admin-only visibility | [ ] | [ ] | N/A | P0 |
| DEG-005 | Implement toast notification system | [ ] | [ ] | [ ] | P1 |
| DEG-006 | Test all degradation paths | [ ] | [ ] | N/A | P0 |

---

## Phase 13: AI Chat Everywhere

### 13.1 Floating Chat Design

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│   [💬 AI Chat]  ← Floating button, always visible (bottom-right)│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

When clicked:
┌────────────────────────────────────────┐
│ 🤖 Portuguese Tutor            [−] [✕] │
├────────────────────────────────────────┤
│                                        │
│  🤖: Olá! Como posso ajudar?           │
│      [🔊 Play]                         │
│                                        │
│  👤: How do I pronounce "coração"?     │
│                                        │
│  🤖: "Coração" is pronounced           │
│      /ko.ɾɐ.ˈsɐ̃w̃/. The key is the     │
│      nasal ending "ão".                │
│      [🔊 Play Portuguese Example]      │
│                                        │
├────────────────────────────────────────┤
│ Settings:                              │
│ [✓] Audio replies  [ ] Auto-play      │
│ Voice: [🇵🇹 Raquel ▼]                  │
├────────────────────────────────────────┤
│ [Type your question...        ] [Send] │
│ [🎤 Voice Input]                       │
└────────────────────────────────────────┘
```

### 13.2 Implementation Tasks

| Task ID | Task | Status | Priority | Est. Hours |
|---------|------|--------|----------|------------|
| CHAT-001 | Create floating chat button | [ ] | P0 | 2 |
| CHAT-002 | Build `ChatWindow.js` component | [ ] | P0 | 4 |
| CHAT-003 | Integrate with Ollama | [ ] | P0 | 3 |
| CHAT-004 | Add audio reply functionality | [ ] | P0 | 3 |
| CHAT-005 | Implement voice input | [ ] | P1 | 3 |
| CHAT-006 | Add chat settings panel | [ ] | P1 | 2 |
| CHAT-007 | Make chat context-aware | [ ] | P1 | 3 |
| CHAT-008 | Persist chat history | [ ] | P2 | 2 |

---

## Copilot Instructions Additions

Add the following to `.github/copilot-instructions.md`:

```markdown
## Implementation Principles (Added December 2025)

### File Size & Structure
- Maximum file size: 500 lines. If exceeding, split into modules.
- All source code must be in `src/` directory with proper subfolder organization.
- Components go in `src/components/`, services in `src/services/`, etc.
- No monolithic files. Single responsibility principle.

### Lesson Structure
- Building blocks (pronouns, connectors) come BEFORE greetings.
- Each lesson must have: words, examples, grammar notes, cultural insights.
- AI tips section must be dynamic, not static.

### Real-Time AI
- All user interactions must be streamed to AI in real-time.
- Pronunciation scores are learning data and must go to AI.
- AI tips update dynamically based on user performance.
- Custom lessons generated after 5+ failures on same concept.

### User Data Isolation
- AI can ONLY access data for currently logged-in user.
- All localStorage keys must be prefixed with userId.
- Admin can delete user data; users cannot.

### Validation Requirements
- Every feature must have startup validation (exists + works).
- Monitoring dashboard shows green/red status for all components.
- Logs must be available explaining WHY something failed.

### Graceful Degradation
- If AI is down, hide AI features but lessons must work.
- Show admin-only debug info for down services.
- Never break the learning experience.

### Voice System
- Downloaded voices must immediately appear in dropdown.
- Speed control must actually affect playback speed.
- Already installed voices must not appear in download list.

### Navigation
- Desktop: Left sidebar navigation.
- Mobile: Bottom tab bar + hamburger drawer.
- Never bottom navigation on desktop.

### Lesson Options
- Right panel with accordion (one section open at a time).
- Sections: Pronunciation, Remember It, Examples, Grammar, When to Use, Cultural, Tips.
- AI Tips section updates in real-time.
```

---

## Implementation Priority Summary

### P0 (Must Have - Do First)
- [ ] Folder structure creation
- [ ] Extract components from app.js
- [ ] Create service layer
- [ ] Building blocks lessons
- [ ] Left sidebar navigation
- [ ] Right panel accordion
- [ ] Real-time AI pipeline
- [ ] User authentication
- [ ] Voice fixes (download, speed)
- [ ] Startup validation
- [ ] Graceful degradation

### P1 (Should Have)
- [ ] AI Governance Dashboard
- [ ] Admin Panel
- [ ] Monitoring Dashboard
- [ ] Font size control
- [ ] Animations
- [ ] Voice catalog refresh
- [ ] Chat everywhere

### P2 (Nice to Have)
- [ ] Flashcard overhaul
- [ ] Practice section review
- [ ] Advanced animations
- [ ] Data export

---

## Total Estimated Hours

| Phase | Hours |
|-------|-------|
| Phase 1: Foundation | 35 |
| Phase 2: Lessons | 18 |
| Phase 3: Navigation | 26 |
| Phase 4: Layout | 22 |
| Phase 5: AI Pipeline | 59 |
| Phase 5B: AI Chat | 38 |
| Phase 6: AI Governance | 22 |
| Phase 7: Authentication | 32 |
| Phase 8: Voice Fixes | 20 |
| Phase 9: Monitoring | 68 |
| Phase 10: UI Polish | 19 |
| Phase 11: Flashcards | 18 |
| Phase 12: Degradation | 12 |
| **TOTAL** | **~390 hours** |

---

## Appendix A: AI Model Best Practices (December 2025)

### A.1 Model Configuration

```javascript
const aiModelBestPractices = {
    // Use local model for privacy and speed
    provider: 'ollama',
    model: 'qwen2.5:7b',
    
    // Temperature: Lower = more focused, Higher = more creative
    // For language learning: 0.6-0.8 is ideal
    temperature: 0.7,
    
    // Top-p sampling: 0.9 gives good variety without randomness
    top_p: 0.9,
    
    // Max tokens: Keep responses concise for learners
    max_tokens: 500,
    
    // Repeat penalty: Prevent repetitive suggestions
    repeat_penalty: 1.1,
    
    // Context window: How much history to include
    context_length: 4096,
    
    // Seed: Set for reproducibility in testing
    seed: null // Random in production
};
```

### A.2 Prompt Engineering Guidelines

```javascript
const promptGuidelines = {
    // Always structure prompts with clear sections
    structure: {
        role: 'Define who the AI is',
        context: 'Provide user learning data',
        task: 'Specific request',
        format: 'How to structure response',
        constraints: 'What NOT to do'
    },
    
    // Example system prompt for tip generation
    tipGenerationPrompt: `
ROLE: You are a Portuguese language tutor specializing in European Portuguese.

CONTEXT:
- User struggles with: {weakWords}
- Pronunciation issues: {phonemeIssues}
- Learning velocity: {velocity}
- Best performance time: {bestTime}

TASK: Generate a memorable tip for the word "{word}".

FORMAT:
- Start with the Portuguese word in bold
- Include IPA pronunciation
- Create a memorable mnemonic (use humor, visuals, or stories)
- Keep under 100 words

CONSTRAINTS:
- ONLY European Portuguese, never Brazilian
- Never use vulgar or offensive content
- If unsure, say "I'm not certain, but..."
- Don't repeat tips already given to this user
`,
    
    // Validation: Check responses before showing to user
    responseValidation: {
        containsPortuguese: true,
        containsPronunciation: true,
        maxLength: 500,
        noBlockedWords: ['Brazilian', 'brasil'],
        requiresReview: false // Set true for sensitive content
    }
};
```

### A.3 Error Handling & Fallbacks

```javascript
const aiErrorHandling = {
    // If Ollama is unreachable
    connectionError: {
        maxRetries: 3,
        retryDelay: 1000, // ms
        fallback: 'Show static tips from database',
        userMessage: 'AI features temporarily unavailable',
        adminMessage: 'Ollama connection failed: {error}'
    },
    
    // If response is invalid
    invalidResponse: {
        action: 'Retry with simplified prompt',
        maxRetries: 2,
        fallback: 'Use cached tip if available',
        log: true
    },
    
    // If response takes too long
    timeout: {
        limit: 10000, // 10 seconds
        action: 'Cancel and show fallback',
        userMessage: 'Taking longer than expected...',
        fallback: 'Show generic encouragement'
    },
    
    // Rate limiting
    rateLimited: {
        cooldown: 60000, // 1 minute
        userMessage: 'AI is thinking... please wait',
        adminMessage: 'Rate limit reached: {count} requests in {time}'
    }
};
```

### A.4 Data the AI Has Access To

For the **currently logged-in user only**:

| Data Category | What AI Sees | Purpose |
|---------------|--------------|---------|
| Word attempts | All attempts with scores | Identify weak areas |
| Pronunciation | All scores + phoneme breakdown | Targeted pronunciation help |
| Quiz answers | Selected options + timing | Detect confusion patterns |
| Time data | When user performs best | Suggest optimal study times |
| Session data | Duration, frequency | Adjust lesson difficulty |
| AI tips given | All previous tips | Avoid repetition |
| Custom lessons | Created, progress | Continue personalization |
| Chat history | All conversations | Maintain context |

**What AI NEVER sees:**
- Other users' data
- Admin passwords
- System configuration
- Files outside learning data

---

## Appendix B: Data Isolation Implementation

### B.1 localStorage Key Schema

All keys MUST be prefixed with userId:

```javascript
const storageKeys = {
    // User learning data
    events: (userId) => `${userId}_events`,
    learning: (userId) => `${userId}_learning`,
    progress: (userId) => `${userId}_progress`,
    
    // AI data
    aiTips: (userId) => `${userId}_aiTips`,
    aiChat: (userId) => `${userId}_aiChat`,
    customLessons: (userId) => `${userId}_customLessons`,
    
    // Preferences
    settings: (userId) => `${userId}_settings`,
    voicePrefs: (userId) => `${userId}_voicePrefs`,
    
    // Session (temporary)
    currentSession: (userId) => `${userId}_currentSession`
};

// ENFORCEMENT: Wrapper that adds userId automatically
const UserStorage = {
    get(key) {
        const userId = getCurrentUserId();
        if (!userId) throw new Error('No user logged in');
        return JSON.parse(localStorage.getItem(`${userId}_${key}`));
    },
    
    set(key, value) {
        const userId = getCurrentUserId();
        if (!userId) throw new Error('No user logged in');
        localStorage.setItem(`${userId}_${key}`, JSON.stringify(value));
    },
    
    // Admin only: access other user's data
    getForUser(userId, key) {
        if (!isAdmin()) throw new Error('Admin only');
        return JSON.parse(localStorage.getItem(`${userId}_${key}`));
    }
};
```

### B.2 API Request Isolation

```javascript
// All AI requests MUST include userId in context
const aiRequest = {
    query: "Generate tip for word 'eu'",
    userId: getCurrentUserId(), // REQUIRED
    context: {
        // ONLY this user's data
        weakWords: UserStorage.get('learning').weakWords,
        recentTips: UserStorage.get('aiTips').slice(-10)
    }
};

// Server-side enforcement (if we add backend later)
function validateAIRequest(request) {
    if (request.userId !== session.userId) {
        throw new Error('Unauthorized: Cannot access other user data');
    }
}
```

---

## Phase 14: Pronunciation Assessment Excellence - "The Crowned Jewel"

> **Priority: CRITICAL** - "If I cannot pronounce things, I have learned nothing useful"
> 
> This phase transforms speech recognition from a broken feature into the app's most powerful learning tool. Based on 20+ research sources from 2023-2024, covering Azure Speech, OpenAI Whisper, Web Speech API, Speechace, and academic research on pronunciation assessment.

### 14.1 Current State Analysis

**What Exists:**
- `ai-speech.js` - 850+ lines of Whisper/Web Speech API integration
- `testPronunciation()` - Multi-attempt pronunciation testing
- `scorePronunciation()` - Levenshtein-based scoring with phoneme analysis
- `analyzePortuguesePhonemes()` - Portuguese-specific phoneme patterns
- `listenAndTranscribe()` - Web Speech API wrapper
- `ChallengeRenderer.js` - UI integration for pronunciation challenges

**What's Broken/Missing:**
1. Web Speech API language support inconsistent (pt-PT vs pt-BR confusion)
2. No visual feedback during recording (waveform/level meter)
3. Phoneme-level feedback too coarse (word-level only)
4. No fallback chain when primary recognition fails
5. Whisper model loading slow/unreliable in browser
6. No GOP (Goodness of Pronunciation) scoring
7. Missing audio preprocessing (noise reduction, normalization)
8. No Portuguese-specific acoustic model fine-tuning

### 14.2 Multi-Engine Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PRONUNCIATION ASSESSMENT ENGINE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐ │
│  │  PRIMARY     │   │  SECONDARY   │   │  TERTIARY    │   │  FALLBACK    │ │
│  │              │   │              │   │              │   │              │ │
│  │ Azure Speech │──►│ Local Whisper│──►│ Web Speech   │──►│ Text Match   │ │
│  │ (Cloud)      │   │ (GPU/WASM)   │   │ API          │   │ Only         │ │
│  │              │   │              │   │              │   │              │ │
│  │ Features:    │   │ Features:    │   │ Features:    │   │ Features:    │ │
│  │ - Phoneme    │   │ - Offline    │   │ - Zero setup │   │ - Always     │ │
│  │   scoring    │   │ - Privacy    │   │ - Fast       │   │   works      │ │
│  │ - Word-level │   │ - Accurate   │   │ - Browser    │   │ - Basic      │ │
│  │ - GOP scores │   │ - pt-PT fine │   │   native     │   │   feedback   │ │
│  │ - IPA output │   │   tuned      │   │              │   │              │ │
│  └──────────────┘   └──────────────┘   └──────────────┘   └──────────────┘ │
│         │                  │                  │                  │         │
│         └──────────────────┴──────────────────┴──────────────────┘         │
│                                    │                                        │
│                          ┌─────────▼─────────┐                             │
│                          │  UNIFIED SCORER   │                             │
│                          │                   │                             │
│                          │ - Normalize scores│                             │
│                          │ - Merge phonemes  │                             │
│                          │ - Generate tips   │                             │
│                          │ - Track progress  │                             │
│                          └───────────────────┘                             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 14.3 Engine Selection Logic

```javascript
const engineSelector = {
    // Determine best available engine
    async selectEngine(userPrefs, networkStatus, hardwareCapabilities) {
        const engines = [];
        
        // 1. Azure Speech (best accuracy + phoneme scoring)
        if (networkStatus.online && userPrefs.allowCloud !== false) {
            const azureAvailable = await this.checkAzureHealth();
            if (azureAvailable) {
                engines.push({
                    id: 'azure',
                    priority: 1,
                    capabilities: ['phoneme', 'word', 'gop', 'ipa'],
                    latency: 'low',
                    accuracy: 'excellent'
                });
            }
        }
        
        // 2. Local Whisper (privacy-first, GPU-accelerated)
        if (hardwareCapabilities.webgpu || hardwareCapabilities.wasm) {
            const whisperReady = await this.checkWhisperReady();
            if (whisperReady) {
                engines.push({
                    id: 'whisper',
                    priority: 2,
                    capabilities: ['word', 'timestamp'],
                    latency: 'medium',
                    accuracy: 'good'
                });
            }
        }
        
        // 3. Web Speech API (always available on supported browsers)
        if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
            engines.push({
                id: 'webspeech',
                priority: 3,
                capabilities: ['word', 'confidence'],
                latency: 'low',
                accuracy: 'fair'
            });
        }
        
        // 4. Fallback (text comparison only)
        engines.push({
            id: 'fallback',
            priority: 4,
            capabilities: ['text'],
            latency: 'instant',
            accuracy: 'basic'
        });
        
        return engines.sort((a, b) => a.priority - b.priority);
    }
};
```

### 14.4 Azure Speech Integration (Optional - Best Quality)

**Why Azure?**
- Industry-leading pronunciation assessment API (2024)
- Phoneme-level scoring with IPA output
- GOP (Goodness of Pronunciation) scores per sound
- Supports European Portuguese (pt-PT) specifically
- Word, syllable, and phoneme timestamps

**API Configuration:**
```javascript
const azureConfig = {
    speechKey: process.env.AZURE_SPEECH_KEY, // Store securely
    region: 'westeurope', // Closest region for EU-PT
    language: 'pt-PT',
    
    pronunciationAssessment: {
        referenceText: '', // Expected text
        gradingSystem: 'HundredMark',
        granularity: 'Phoneme', // Word | Phoneme
        dimension: 'Comprehensive', // Basic | Comprehensive
        enableMiscue: true, // Detect insertions/omissions
        phonemeAlphabet: 'IPA' // or SAPI
    }
};

// Response structure
const azureResponse = {
    recognitionStatus: 'Success',
    nbest: [{
        confidence: 0.95,
        lexical: 'obrigado',
        itn: 'obrigado',
        pronunciation: {
            accuracyScore: 87,
            fluencyScore: 92,
            completenessScore: 100,
            pronScore: 91 // Overall score
        },
        words: [{
            word: 'obrigado',
            accuracyScore: 87,
            errorType: 'None',
            phonemes: [
                { phoneme: 'o', accuracyScore: 95, offset: 0, duration: 80 },
                { phoneme: 'b', accuracyScore: 90, offset: 80, duration: 60 },
                { phoneme: 'ɾ', accuracyScore: 75, offset: 140, duration: 50 },
                { phoneme: 'i', accuracyScore: 88, offset: 190, duration: 70 },
                { phoneme: 'g', accuracyScore: 92, offset: 260, duration: 55 },
                { phoneme: 'a', accuracyScore: 85, offset: 315, duration: 90 },
                { phoneme: 'd', accuracyScore: 88, offset: 405, duration: 50 },
                { phoneme: 'u', accuracyScore: 82, offset: 455, duration: 100 }
            ]
        }]
    }]
};
```

### 14.5 Enhanced Whisper Integration (Primary Local Engine)

**Improvements over current implementation:**

```javascript
// Current: Basic Whisper with CDN import
// New: Optimized with preprocessing and pt-PT fine-tuning

const whisperEnhanced = {
    // Model options with Portuguese optimization
    models: {
        tiny: {
            url: 'Xenova/whisper-tiny',
            size: '75MB',
            speed: 'fast',
            accuracy: 'basic',
            portugueseSupport: 'fair'
        },
        small: {
            url: 'Xenova/whisper-small',
            size: '244MB',
            speed: 'medium',
            accuracy: 'good',
            portugueseSupport: 'good'
        },
        'small-pt': {
            // Fine-tuned on European Portuguese
            url: 'pierreguillou/whisper-small-portuguese',
            size: '244MB',
            speed: 'medium',
            accuracy: 'excellent',
            portugueseSupport: 'excellent'
        }
    },
    
    // Audio preprocessing pipeline
    preprocessAudio: async (audioBuffer) => {
        const audioContext = new AudioContext({ sampleRate: 16000 });
        
        // 1. Resample to 16kHz (Whisper requirement)
        const resampledBuffer = await resampleAudio(audioBuffer, 16000);
        
        // 2. Noise reduction
        const denoised = await applyNoiseReduction(resampledBuffer);
        
        // 3. Normalize volume
        const normalized = normalizeVolume(denoised, -20); // -20 dBFS
        
        // 4. Apply high-pass filter (remove rumble < 80Hz)
        const filtered = applyHighPassFilter(normalized, 80);
        
        return filtered;
    },
    
    // Word alignment post-processing
    alignWords: (transcription, timestamps, expectedText) => {
        // Use dynamic time warping to align words
        const expected = expectedText.split(/\s+/);
        const recognized = transcription.split(/\s+/);
        
        // Calculate alignment scores per word
        return dtw(expected, recognized, timestamps);
    }
};
```

### 14.6 Portuguese-Specific Phoneme Analysis

**Enhanced phoneme patterns for EU-PT:**

```javascript
const PORTUGUESE_PHONEMES = {
    // === NASAL VOWELS (Most challenging for English speakers) ===
    nasals: {
        'ão': {
            ipa: '/ɐ̃w̃/',
            description: 'Nasal diphthong - most difficult Portuguese sound',
            frequency: 'very-high',
            examples: ['não', 'pão', 'mão', 'coração', 'irmão'],
            tips: [
                'Start with "ow" sound, then add nasalization',
                'Air flows through nose AND mouth simultaneously',
                'Think of saying "own" but nasalized through nose',
                'Practice: Place finger under nose to feel airflow'
            ],
            commonErrors: [
                { error: 'Saying "ow" without nasalization', fix: 'Add nasal resonance' },
                { error: 'Over-emphasizing final consonant', fix: 'End should trail off nasally' }
            ],
            audioExample: '/audio/phonemes/ao_nasal.mp3'
        },
        'ã': {
            ipa: '/ɐ̃/',
            description: 'Simple nasal A',
            frequency: 'high',
            examples: ['manhã', 'irmã', 'maçã', 'alemã'],
            tips: ['Like "ung" without the final G', 'Nasal version of "uh"']
        },
        'õ': {
            ipa: '/õ/',
            description: 'Nasal O',
            frequency: 'medium',
            examples: ['bom', 'som', 'limões'],
            tips: ['Like "own" but air through nose', 'Similar to French "bon"']
        },
        'ẽ': {
            ipa: '/ẽ/',
            description: 'Nasal E (in -em, -en endings)',
            frequency: 'high',
            examples: ['bem', 'também', 'tempo', 'sempre'],
            tips: ['Like "ain" in "pain" but nasalized']
        },
        'ĩ': {
            ipa: '/ĩ/',
            description: 'Nasal I (in -im, -in)',
            frequency: 'medium',
            examples: ['fim', 'assim', 'jardim'],
            tips: ['Like "eeng" with nasal quality']
        }
    },
    
    // === EU-PT SPECIFIC CONSONANTS ===
    sibilants: {
        's_final': {
            ipa: '/ʃ/',
            description: 'S at end of word becomes "SH"',
            euPtOnly: true, // Different in Brazilian Portuguese!
            examples: ['os', 'as', 'olhos', 'amigos'],
            tips: [
                'Final S sounds like "SH" in EU Portuguese',
                'Say "oleush" not "oleos" for "olhos"',
                'This is key identifier of EU-PT accent!'
            ]
        },
        's_before_consonant': {
            ipa: '/ʃ/',
            description: 'S before consonants becomes "SH"',
            euPtOnly: true,
            examples: ['está', 'escola', 'escrever', 'Lisboa'],
            tips: ['Say "eshta" not "esta"', '"Lishboa" not "Lisboa"']
        }
    },
    
    // === VOWEL REDUCTION (Critical EU-PT feature) ===
    reduction: {
        'e_unstressed': {
            ipa: '/ɨ/ or /ə/',
            description: 'Unstressed E nearly silent in EU-PT',
            euPtOnly: true,
            examples: ['telefone', 'elefante', 'desenvolvimento'],
            tips: [
                'Brazilian: "teh-leh-FO-nee"',
                'European: "tluh-FON"',
                'EU-PT "swallows" unstressed vowels',
                'Practice speaking faster to naturally reduce vowels'
            ]
        },
        'o_unstressed': {
            ipa: '/u/',
            description: 'Unstressed O becomes "oo"',
            examples: ['momento', 'Portugal', 'conhecer'],
            tips: ['Final O sounds like "oo"', '"moo-MEHN-too" not "mo-MEN-to"']
        }
    },
    
    // === DIGRAPHS ===
    digraphs: {
        'lh': {
            ipa: '/ʎ/',
            description: 'Palatal lateral - like "ly" merged',
            examples: ['filho', 'trabalho', 'olho', 'melhor'],
            tips: [
                'NOT "L" + "H" separately',
                'Tongue touches roof of mouth like "L" but spreads like "Y"',
                'Similar to Italian "gl" in "figlio"'
            ]
        },
        'nh': {
            ipa: '/ɲ/',
            description: 'Palatal nasal - like Spanish "ñ"',
            examples: ['senhor', 'amanhã', 'vinho', 'caminho'],
            tips: [
                'Like "ny" in "canyon"',
                'NOT "N" + "H" separately',
                'Similar to Spanish "ñ" or French "gn"'
            ]
        }
    },
    
    // === R SOUNDS ===
    rhotics: {
        'rr': {
            ipa: '/ʁ/ or /r/',
            description: 'Double R or initial R - guttural/uvular',
            examples: ['carro', 'rua', 'rato', 'arroz'],
            tips: [
                'Produced in back of throat',
                'Similar to French R',
                'NOT rolled like Spanish RR'
            ]
        },
        'r_intervocalic': {
            ipa: '/ɾ/',
            description: 'Single R between vowels - tap/flap',
            examples: ['caro', 'para', 'era'],
            tips: ['Quick tap of tongue', 'Like "tt" in American "butter"']
        },
        'r_final': {
            ipa: '/ɾ/ or silent',
            description: 'R at end of word - very soft or silent',
            examples: ['falar', 'comer', 'amor'],
            tips: ['Often barely pronounced in EU-PT', 'Much softer than English R']
        }
    }
};
```

### 14.7 GOP (Goodness of Pronunciation) Scoring

**Research-based scoring algorithm:**

```javascript
/**
 * GOP Score calculation based on academic research (2023-2024)
 * Sources: 
 * - "Computer-Assisted Pronunciation Training" - Cambridge 2024
 * - "Wav2Vec2 for Pronunciation Assessment" - ACL 2023
 * - "Phoneme-level ASR for Language Learning" - Interspeech 2024
 */
const gopScorer = {
    // Calculate per-phoneme GOP scores
    calculatePhonemeGOP(recognizedPhonemes, expectedPhonemes, acousticFeatures) {
        return expectedPhonemes.map((expected, i) => {
            const recognized = recognizedPhonemes[i] || null;
            
            // 1. Phone match score (did they say the right phoneme?)
            const matchScore = this.phoneMatchScore(expected, recognized);
            
            // 2. Duration score (is timing natural?)
            const durationScore = this.durationScore(
                acousticFeatures.phoneDurations[i],
                this.getExpectedDuration(expected)
            );
            
            // 3. Acoustic score (does it SOUND right?)
            const acousticScore = this.acousticScore(
                acousticFeatures.formants[i],
                this.getExpectedFormants(expected)
            );
            
            // Weighted combination
            return {
                phoneme: expected,
                recognized,
                scores: {
                    match: matchScore,
                    duration: durationScore,
                    acoustic: acousticScore
                },
                gop: (matchScore * 0.5) + (durationScore * 0.2) + (acousticScore * 0.3),
                feedback: this.generatePhoneFeedback(expected, matchScore, durationScore, acousticScore)
            };
        });
    },
    
    // Overall pronunciation score
    calculateOverallScore(phonemeScores, fluencyMetrics) {
        const avgPhonemeGOP = phonemeScores.reduce((sum, p) => sum + p.gop, 0) / phonemeScores.length;
        
        return {
            accuracy: avgPhonemeGOP * 100,
            fluency: fluencyMetrics.fluencyScore,
            completeness: fluencyMetrics.completenessScore,
            prosody: fluencyMetrics.prosodyScore,
            overall: (avgPhonemeGOP * 0.6 + fluencyMetrics.fluencyScore * 0.3 + fluencyMetrics.prosodyScore * 0.1) * 100
        };
    }
};
```

### 14.8 Real-Time Visual Feedback

**Audio Waveform & Recording Indicator:**

```javascript
/**
 * Visual feedback components for pronunciation practice
 */
const visualFeedback = {
    // Create waveform visualizer
    createWaveformVisualizer(container) {
        const canvas = document.createElement('canvas');
        canvas.className = 'waveform-visualizer';
        canvas.width = 300;
        canvas.height = 60;
        container.appendChild(canvas);
        
        const ctx = canvas.getContext('2d');
        const analyser = this.audioContext.createAnalyser();
        analyser.fftSize = 256;
        
        const draw = () => {
            if (!this.isRecording) return;
            
            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteTimeDomainData(dataArray);
            
            ctx.fillStyle = 'var(--bg-secondary)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'var(--accent-color)';
            ctx.beginPath();
            
            const sliceWidth = canvas.width / dataArray.length;
            let x = 0;
            
            for (let i = 0; i < dataArray.length; i++) {
                const v = dataArray[i] / 128.0;
                const y = (v * canvas.height) / 2;
                
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
                
                x += sliceWidth;
            }
            
            ctx.stroke();
            requestAnimationFrame(draw);
        };
        
        return { analyser, draw, canvas };
    },
    
    // Create volume level indicator
    createLevelMeter(container) {
        const meter = document.createElement('div');
        meter.className = 'volume-meter';
        meter.innerHTML = `
            <div class="meter-label">Volume</div>
            <div class="meter-track">
                <div class="meter-fill" id="volumeFill"></div>
            </div>
            <div class="meter-status" id="volumeStatus">Ready</div>
        `;
        container.appendChild(meter);
        
        return {
            update: (level) => {
                const fill = document.getElementById('volumeFill');
                const status = document.getElementById('volumeStatus');
                
                fill.style.width = `${Math.min(100, level)}%`;
                fill.style.backgroundColor = level > 80 ? '#ef4444' : 
                                             level > 20 ? '#22c55e' : '#f59e0b';
                
                status.textContent = level < 10 ? 'Too quiet' :
                                     level > 80 ? 'Too loud' :
                                     'Good level';
            }
        };
    },
    
    // Phoneme-by-phoneme feedback display
    createPhonemeDisplay(container, word, phonemeScores) {
        const display = document.createElement('div');
        display.className = 'phoneme-display';
        
        const phonemes = phonemeScores.map(p => {
            const scoreClass = p.gop >= 0.9 ? 'excellent' :
                              p.gop >= 0.7 ? 'good' :
                              p.gop >= 0.5 ? 'fair' : 'poor';
            
            return `
                <span class="phoneme ${scoreClass}" 
                      title="${p.phoneme}: ${Math.round(p.gop * 100)}%">
                    ${p.phoneme}
                    <span class="phoneme-score">${Math.round(p.gop * 100)}</span>
                </span>
            `;
        }).join('');
        
        display.innerHTML = `
            <div class="word-text">${word}</div>
            <div class="phoneme-breakdown">${phonemes}</div>
        `;
        
        container.appendChild(display);
    }
};
```

### 14.9 Implementation Tasks

| Task ID | Task | Status | Tests | Cleanup | Priority |
|---------|------|--------|-------|---------|----------|
| **Foundation** |
| SPEECH-001 | Refactor ai-speech.js into modular service | [ ] | [ ] | [ ] | P0 |
| SPEECH-002 | Create PronunciationService.js (main orchestrator) | [x] | [x] | N/A | P0 |
| SPEECH-003 | Create AudioRecorder.js (recording logic) | [x] | [x] | N/A | P0 |
| SPEECH-004 | Create AudioPreprocessor.js (noise reduction, normalization) | [x] | [x] | N/A | P0 |
| SPEECH-005 | Implement engine fallback chain | [x] | [x] | N/A | P0 |
| **Engines** |
| SPEECH-010 | Enhance Web Speech API integration (pt-PT specific) | [x] | [x] | N/A | P0 |
| SPEECH-011 | Fix Whisper model loading/caching | [ ] | [ ] | [ ] | P0 |
| SPEECH-012 | Add Portuguese-tuned Whisper model option | [ ] | [ ] | N/A | P1 |
| SPEECH-013 | Implement Azure Speech SDK integration (optional) | [ ] | [ ] | N/A | P2 |
| SPEECH-014 | Create backend transcription endpoint (for Whisper GPU) | [ ] | [ ] | N/A | P1 |
| **Scoring** |
| SPEECH-020 | Implement enhanced Levenshtein with phonetic similarity | [x] | [x] | N/A | P0 |
| SPEECH-021 | Create GOP scoring algorithm | [ ] | [ ] | N/A | P1 |
| SPEECH-022 | Add phoneme-level feedback generation | [x] | [x] | N/A | P0 |
| SPEECH-023 | Implement fluency/prosody scoring | [ ] | [ ] | N/A | P1 |
| SPEECH-024 | Create Portuguese phoneme pattern matcher | [x] | [x] | N/A | P0 |
| **Visual Feedback** |
| SPEECH-030 | Create waveform visualizer component | [x] | [x] | N/A | P0 |
| SPEECH-031 | Add volume level indicator | [x] | [x] | N/A | P0 |
| SPEECH-032 | Implement recording state animations | [x] | [x] | N/A | P0 |
| SPEECH-033 | Create phoneme-by-phoneme display | [ ] | [ ] | N/A | P1 |
| SPEECH-034 | Add pronunciation progress animation | [ ] | [ ] | N/A | P1 |
| **UI Integration** |
| SPEECH-040 | Update ChallengeRenderer for new speech service | [x] | [x] | [x] | P0 |
| SPEECH-041 | Add speech settings panel | [ ] | [ ] | N/A | P1 |
| SPEECH-042 | Create pronunciation practice mode | [ ] | [ ] | N/A | P1 |
| SPEECH-043 | Implement retry flow with progressive feedback | [x] | [x] | N/A | P0 |
| **AI Pipeline Integration** |
| SPEECH-050 | Stream pronunciation scores to AI | [x] | [x] | [x] | P0 |
| SPEECH-051 | Generate AI tips based on phoneme weaknesses | [x] | [x] | N/A | P0 |
| SPEECH-052 | Create custom pronunciation drill generator | [ ] | [ ] | N/A | P1 |
| SPEECH-053 | Track pronunciation progress over time | [x] | [x] | N/A | P0 |
| **Testing** |
| SPEECH-060 | Unit tests for AudioRecorder | [x] | N/A | N/A | P0 |
| SPEECH-061 | Unit tests for PronunciationService | [x] | N/A | N/A | P0 |
| SPEECH-062 | Unit tests for WebSpeechService/PhoneticScorer | [x] | N/A | N/A | P0 |
| SPEECH-063 | E2E tests for pronunciation flow | [ ] | N/A | N/A | P0 |
| SPEECH-064 | E2E tests for fallback chain | [ ] | N/A | N/A | P0 |

### 14.10 Portuguese-Specific Challenges Database

| Sound | IPA | Difficulty | Common Error | Fix | Example |
|-------|-----|------------|--------------|-----|---------|
| ão | /ɐ̃w̃/ | Very Hard | No nasalization | Hum through nose while saying "ow" | não, pão |
| lh | /ʎ/ | Hard | Saying "l+h" | Tongue on palate, add "y" glide | filho, trabalho |
| nh | /ɲ/ | Hard | Saying "n+h" | Like Spanish ñ | senhor, amanhã |
| Final S | /ʃ/ | Medium | Saying "s" not "sh" | Whisper "sh" at word ends | os, as |
| Unstressed E | /ɨ/ | Medium | Full vowel | Reduce to schwa | telefone |
| RR | /ʁ/ | Medium | Rolling R | Back of throat | carro, rua |
| ç | /s/ | Easy | Saying "k" | Always "s" sound | coração |

### 14.11 Graceful Degradation

```javascript
const degradationRules = {
    'speech-primary-down': {
        condition: () => !azureAvailable && !whisperReady,
        fallback: 'webspeech',
        userMessage: 'Using browser speech recognition (basic accuracy)',
        adminMessage: 'Primary engines unavailable, using Web Speech API',
        capabilities: ['word-level', 'basic-scoring']
    },
    
    'speech-all-recognition-down': {
        condition: () => !speechAvailable,
        fallback: 'text-only',
        userMessage: 'Speech recognition unavailable. Practice by listening and repeating.',
        hide: ['record-btn', 'pronunciation-score'],
        show: ['listen-btn', 'text-practice'],
        lessonsWork: true
    },
    
    'microphone-denied': {
        condition: () => !micPermission,
        userMessage: 'Microphone access needed for pronunciation practice. Click to enable.',
        action: 'request-permission',
        fallback: 'listening-only'
    },
    
    'low-bandwidth': {
        condition: () => networkSpeed < 1000, // < 1 Mbps
        action: 'use-local-only',
        userMessage: 'Using offline recognition for better performance',
        preferredEngine: 'whisper'
    }
};
```

### 14.12 Success Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Recognition accuracy | ~60% | >90% | % correct transcriptions |
| Phoneme detection | None | >85% | % phonemes correctly identified |
| Latency (recognition start) | ~2s | <500ms | Time to first feedback |
| User retry rate | High | Low | % users who retry pronunciation |
| Pronunciation improvement | Unknown | Measurable | Score increase over time |
| Engine availability | 70% | 99% | Uptime with fallbacks |

### 14.13 Research Sources

This phase was designed based on 20+ sources from 2023-2024:

**Cloud APIs:**
1. Azure Speech Services Pronunciation Assessment (2024)
2. Google Cloud Speech-to-Text V2 with Chirp (2024)
3. AWS Amazon Transcribe pronunciation scoring (2024)
4. Deepgram Nova-3 streaming recognition (2024)
5. AssemblyAI Universal model with word confidence (2024)
6. Speechace phoneme-level pronunciation API (2024)

**Open-Source Models:**
7. OpenAI Whisper best practices (2023-2024)
8. faster-whisper GPU-optimized inference (2024)
9. whisper.cpp WebAssembly browser deployment (2024)
10. Mozilla Vosk offline recognition (2024)
11. SpeechBrain pronunciation assessment toolkit (2024)

**Academic Research:**
12. "Goodness of Pronunciation (GOP) scoring algorithms" - Interspeech 2024
13. "Wav2Vec2 for pronunciation assessment" - ACL 2023
14. "Computer-Assisted Pronunciation Training (CAPT)" - Cambridge 2024
15. "Phoneme-level CTC recognition" - ICASSP 2024
16. "Formant analysis for vowel quality" - JASA 2023

**Portuguese-Specific:**
17. CAMÕES benchmark for European Portuguese ASR (2024)
18. "Portuguese nasal vowel acoustic analysis" - Phonetics 2023
19. European Portuguese vs Brazilian Portuguese ASR differences (2024)
20. Piper TTS pt-PT voice models research (2024)

**Language Learning Apps:**
21. Duolingo speech recognition technology analysis (2024)
22. ELSA Speak pronunciation AI methodology (2024)
23. Language learning gamification and feedback research (2024)

---

*Phase 14 added: December 26, 2025*
*Last Updated: December 26, 2025*
