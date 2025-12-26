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
| 4 | **Run all tests** (`npm test`) | ✅ Yes |
| 5 | **Integration test** - verify it works with existing code | ✅ Yes |
| 6 | **Remove redundant code** from old files | ✅ Yes (or N/A) |
| 7 | Commit with task ID | ✅ Yes |
| 8 | Push and merge to main | ✅ Yes |
| 9 | Delete feature branch | ✅ Yes |
| 10 | Update plan status | ✅ Yes |

### Task Table Format

All task tables MUST include these columns:

```markdown
| Task ID | Task | Status | Tests | Cleanup | Priority |
|---------|------|--------|-------|---------|----------|
| XX-001  | Description | [ ] | [ ] | [ ] or N/A | P0 |
```

- **Status**: `[ ]` not started, `[x]` complete
- **Tests**: `[ ]` tests not written, `[x]` tests pass
- **Cleanup**: `[ ]` old code not removed, `[x]` old code removed, `N/A` no cleanup needed

### Testing Requirements

Every new service/component MUST have:

1. **Unit tests** - Test individual functions work correctly
2. **Integration tests** - Test it works with other modules
3. **Playwright tests** - Test UI interactions if applicable

Test files go in:
- `tests/unit/` - Unit tests
- `tests/integration/` - Integration tests  
- `tests/` - E2E Playwright tests

### Cleanup Requirements

After integrating new code:

1. **Identify redundant code** in old files (app.js, styles.css, etc.)
2. **Remove the duplicate code** from old files
3. **Verify app still works** after removal
4. **Track line count reduction** in commit message

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

| Task ID | Task | Status | Priority |
|---------|------|--------|----------|
| F1-001 | Create `src/` directory | [x] | P0 |
| F1-002 | Create `src/components/` subdirectories | [x] | P0 |
| F1-003 | Create `src/services/` subdirectories | [x] | P0 |
| F1-004 | Create `src/pages/` directory | [x] | P0 |
| F1-005 | Create `src/stores/` directory | [x] | P0 |
| F1-006 | Create `src/utils/` directory | [x] | P0 |
| F1-007 | Create `src/data/` subdirectories | [x] | P0 |
| F1-008 | Create `src/styles/` subdirectories | [x] | P0 |
| F1-009 | Create `src/config/` directory | [x] | P0 |

### 1.2 Extract Components from app.js

| Task ID | Task | Status | Priority | Est. Hours |
|---------|------|--------|----------|------------|
| F1-010 | Extract navigation to `Sidebar.js` | [x] | P0 | 2 |
| F1-011 | Extract lesson cards to `LessonCard.js` | [x] | P0 | 2 |
| F1-012 | Extract modals to `Modal.js` | [x] | P0 | 2 |
| F1-013 | Extract toast system to `Toast.js` | [x] | P0 | 1 |
| F1-014 | Extract challenge types to `ChallengeRenderer.js` | [x] | P0 | 3 |
| F1-015 | Extract word display to `WordCard.js` | [x] | P0 | 2 |
| F1-016 | Extract progress UI to `ProgressChart.js` | [x] | P1 | 2 |

### 1.3 Create Service Layer

| Task ID | Task | Status | Priority | Est. Hours |
|---------|------|--------|----------|------------|
| F1-020 | Create `AuthService.js` from auth.js | [x] | P0 | 2 |
| F1-021 | Create `AIService.js` from ai-tutor.js | [x] | P0 | 3 |
| F1-022 | Create `VoiceService.js` from audio.js | [x] | P0 | 3 |
| F1-023 | Create `TTSService.js` from ai-tts.js | [x] | P0 | 2 |
| F1-024 | Create `LessonService.js` for lesson logic | [x] | P0 | 4 |
| F1-025 | Create `ProgressTracker.js` for progress | [x] | P0 | 3 |
| F1-026 | Create `Logger.js` for logging | [x] | P0 | 2 |
| F1-027 | Create `HealthChecker.js` for monitoring | [x] | P0 | 3 |

### 1.4 Modularize CSS

| Task ID | Task | Status | Priority | Est. Hours |
|---------|------|--------|----------|------------|
| F1-030 | Create `variables.css` with CSS custom properties | [x] | P0 | 1 |
| F1-031 | Create `reset.css` with normalizations | [x] | P0 | 0.5 |
| F1-032 | Extract button styles to `buttons.css` | [x] | P1 | 1 |
| F1-033 | Extract card styles to `cards.css` | [x] | P1 | 1 |
| F1-034 | Extract modal styles to `modals.css` | [x] | P1 | 1 |
| F1-035 | Extract nav styles to `navigation.css` | [x] | P1 | 1 |
| F1-036 | Create `animations.css` for all animations | [x] | P1 | 2 |

---

## Phase 1B: Integration & Cleanup

**⚠️ CRITICAL: No new features until Phase 1B is complete!**

Phase 1 created new modular code in `src/`. This phase:
1. Wires new modules into the app
2. Tests everything works
3. Removes redundant code from old files
4. Validates line count reductions

### 1B.1 Service Integration

| Task ID | Task | Status | Tests | Cleanup | Priority |
|---------|------|--------|-------|---------|----------|
| INT-001 | Wire AuthService into app.js | [ ] | [ ] | [ ] | P0 |
| INT-002 | Wire AIService into app.js | [ ] | [ ] | [ ] | P0 |
| INT-003 | Wire VoiceService into app.js | [ ] | [ ] | [ ] | P0 |
| INT-004 | Wire TTSService into app.js | [ ] | [ ] | [ ] | P0 |
| INT-005 | Wire LessonService into app.js | [ ] | [ ] | [ ] | P0 |
| INT-006 | Wire ProgressTracker into app.js | [ ] | [ ] | [ ] | P0 |
| INT-007 | Wire Logger into all services | [ ] | [ ] | N/A | P0 |
| INT-008 | Wire HealthChecker startup | [ ] | [ ] | N/A | P0 |

### 1B.2 Component Integration

| Task ID | Task | Status | Tests | Cleanup | Priority |
|---------|------|--------|-------|---------|----------|
| INT-010 | Wire Modal.js into app.js | [ ] | [ ] | [ ] | P0 |
| INT-011 | Wire Toast.js into app.js | [ ] | [ ] | [ ] | P0 |
| INT-012 | Wire LessonCard.js into app.js | [ ] | [ ] | [ ] | P0 |
| INT-013 | Wire WordCard.js into app.js | [ ] | [ ] | [ ] | P0 |
| INT-014 | Wire ChallengeRenderer.js into app.js | [ ] | [ ] | [ ] | P0 |
| INT-015 | Wire ProgressChart.js into app.js | [ ] | [ ] | [ ] | P1 |
| INT-016 | Wire Navigation.js into app.js | [ ] | [ ] | [ ] | P0 |

### 1B.3 CSS Integration

| Task ID | Task | Status | Tests | Cleanup | Priority |
|---------|------|--------|-------|---------|----------|
| INT-020 | Add CSS imports to index.html | [ ] | [ ] | N/A | P0 |
| INT-021 | Remove duplicate styles from styles.css | [ ] | N/A | [ ] | P0 |
| INT-022 | Verify all styles still apply | [ ] | [ ] | N/A | P0 |

### 1B.4 Old File Cleanup Tracking

| File | Original Lines | After Cleanup | Reduction | Status |
|------|----------------|---------------|-----------|--------|
| app.js | 5,531 | TBD | TBD | [ ] |
| styles.css | 4,553 | TBD | TBD | [ ] |
| auth.js | TBD | DELETE | 100% | [ ] |
| audio.js | TBD | DELETE | 100% | [ ] |
| ai-tutor.js | TBD | DELETE | 100% | [ ] |
| ai-tts.js | TBD | DELETE | 100% | [ ] |
| ai-speech.js | TBD | DELETE | 100% | [ ] |
| data.js | 566 | DELETE | 100% | [ ] |

### 1B.5 Test Suite Creation

| Task ID | Task | Status | Priority |
|---------|------|--------|----------|
| TEST-001 | Create unit tests for AuthService | [ ] | P0 |
| TEST-002 | Create unit tests for AIService | [ ] | P0 |
| TEST-003 | Create unit tests for VoiceService | [ ] | P0 |
| TEST-004 | Create unit tests for TTSService | [ ] | P0 |
| TEST-005 | Create unit tests for LessonService | [ ] | P0 |
| TEST-006 | Create unit tests for ProgressTracker | [ ] | P0 |
| TEST-007 | Create unit tests for Logger | [ ] | P0 |
| TEST-008 | Create unit tests for HealthChecker | [ ] | P0 |
| TEST-009 | Create integration test: full lesson flow | [ ] | P0 |
| TEST-010 | Create integration test: auth flow | [ ] | P0 |
| TEST-011 | Create integration test: voice playback | [ ] | P0 |
| TEST-012 | Create Playwright test: lesson completion | [ ] | P0 |
| TEST-013 | Create Playwright test: quiz answering | [ ] | P0 |
| TEST-014 | Create Playwright test: navigation | [ ] | P0 |

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

| Task ID | Task | Status | Priority | Est. Hours |
|---------|------|--------|----------|------------|
| L2-001 | Create `src/data/building-blocks/pronouns.js` | [ ] | P0 | 2 |
| L2-002 | Create `src/data/building-blocks/verbs-ser.js` | [ ] | P0 | 2 |
| L2-003 | Create `src/data/building-blocks/verbs-estar.js` | [ ] | P0 | 2 |
| L2-004 | Create `src/data/building-blocks/verbs-ter.js` | [ ] | P0 | 2 |
| L2-005 | Create `src/data/building-blocks/articles.js` | [ ] | P0 | 1 |
| L2-006 | Create `src/data/building-blocks/connectors.js` | [ ] | P0 | 1 |
| L2-007 | Create `src/data/building-blocks/prepositions.js` | [ ] | P0 | 1 |
| L2-008 | Create `src/data/building-blocks/questions.js` | [ ] | P0 | 1 |
| L2-009 | Create `src/data/building-blocks/negation.js` | [ ] | P0 | 1 |
| L2-010 | Create `src/data/building-blocks/possessives.js` | [ ] | P0 | 1 |
| L2-011 | Update lesson ordering system | [ ] | P0 | 2 |
| L2-012 | Implement prerequisite system | [ ] | P1 | 3 |
| L2-013 | Update tests for new lesson order | [ ] | P0 | 2 |

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

| Task ID | Task | Status | Priority | Est. Hours |
|---------|------|--------|----------|------------|
| N3-001 | Create `Sidebar.js` component | [ ] | P0 | 4 |
| N3-002 | Create `TopBar.js` component | [ ] | P0 | 3 |
| N3-003 | Create `Breadcrumb.js` component | [ ] | P1 | 2 |
| N3-004 | Implement collapsible sidebar | [ ] | P0 | 2 |
| N3-005 | Create mobile drawer menu | [ ] | P0 | 3 |
| N3-006 | Create mobile bottom nav | [ ] | P0 | 2 |
| N3-007 | Implement responsive breakpoints | [ ] | P0 | 2 |
| N3-008 | Add keyboard navigation (accessibility) | [ ] | P1 | 2 |
| N3-009 | Create `routes.config.js` | [ ] | P0 | 1 |
| N3-010 | Implement route management | [ ] | P0 | 3 |
| N3-011 | Add navigation animations | [ ] | P2 | 2 |
| N3-012 | Style sidebar with CSS module | [ ] | P0 | 2 |

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

| Task ID | Task | Status | Priority | Est. Hours |
|---------|------|--------|----------|------------|
| LP-001 | Create `Accordion.js` component | [ ] | P0 | 2 |
| LP-002 | Create `ExpandablePanel.js` component | [ ] | P0 | 2 |
| LP-003 | Implement single-open accordion behavior | [ ] | P0 | 2 |
| LP-004 | Create right panel layout | [ ] | P0 | 3 |
| LP-005 | Add smooth expand/collapse animations | [ ] | P1 | 2 |
| LP-006 | Wire AI Tips to dynamic updates | [ ] | P0 | 4 |
| LP-007 | Create mobile drawer variant | [ ] | P0 | 3 |
| LP-008 | Persist user's last open section | [ ] | P2 | 1 |
| LP-009 | Style options panel with CSS module | [ ] | P0 | 2 |
| LP-010 | Add section icons | [ ] | P2 | 1 |

---

## Phase 5: Real-Time AI Pipeline

### 5.1 Core Principle: Continuous Learning Intelligence

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

| Task ID | Task | Status | Priority | Est. Hours |
|---------|------|--------|----------|------------|
| AI-001 | Create `EventStream.js` - real-time event capture | [ ] | P0 | 4 |
| AI-002 | Create `LearningTracker.js` - aggregation service | [ ] | P0 | 6 |
| AI-003 | Implement pattern detection algorithms | [ ] | P0 | 5 |
| AI-004 | Create `AIMemoryEngine.js` - tip generation | [ ] | P0 | 6 |
| AI-005 | Create `CustomLessonGenerator.js` | [ ] | P0 | 8 |
| AI-006 | Build mnemonic generation prompts | [ ] | P0 | 4 |
| AI-007 | Implement pronunciation issue detection | [ ] | P0 | 4 |
| AI-008 | Create confusion pair detection | [ ] | P0 | 3 |
| AI-009 | Build user data isolation layer | [ ] | P0 | 4 |
| AI-010 | Create AI configuration UI (admin) | [ ] | P1 | 3 |
| AI-011 | Implement rate limiting | [ ] | P0 | 2 |
| AI-012 | Build AI logging system | [ ] | P0 | 3 |
| AI-013 | Create tip effectiveness tracking | [ ] | P1 | 3 |
| AI-014 | Wire real-time updates to UI | [ ] | P0 | 4 |

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

| Task ID | Task | Status | Priority | Est. Hours |
|---------|------|--------|----------|------------|
| CHAT-001 | Create floating button component | [ ] | P0 | 2 |
| CHAT-002 | Create expandable chat window | [ ] | P0 | 4 |
| CHAT-003 | Implement collapse/expand animation | [ ] | P0 | 2 |
| CHAT-004 | Build message rendering system | [ ] | P0 | 3 |
| CHAT-005 | Integrate Ollama for responses | [ ] | P0 | 4 |
| CHAT-006 | Add context awareness (current lesson) | [ ] | P0 | 3 |
| CHAT-007 | Implement voice input (speech-to-text) | [ ] | P0 | 4 |
| CHAT-008 | Implement voice output (text-to-speech) | [ ] | P0 | 3 |
| CHAT-009 | Create chat settings panel | [ ] | P1 | 2 |
| CHAT-010 | Build command parser ("create lesson") | [ ] | P0 | 4 |
| CHAT-011 | Implement "Create Lesson" action | [ ] | P0 | 4 |
| CHAT-012 | Add audio playback buttons in chat | [ ] | P0 | 2 |
| CHAT-013 | Persist chat history per user | [ ] | P1 | 2 |
| CHAT-014 | Add chat minimized notification badge | [ ] | P2 | 1 |

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

| Task ID | Task | Status | Priority | Est. Hours |
|---------|------|--------|----------|------------|
| GOV-001 | Create AI Dashboard page | [ ] | P1 | 4 |
| GOV-002 | Create `WhitelistManager.js` service | [ ] | P1 | 3 |
| GOV-003 | Build whitelist CRUD UI | [ ] | P1 | 3 |
| GOV-004 | Implement reference material viewer | [ ] | P1 | 2 |
| GOV-005 | Add AI activity logging | [ ] | P1 | 2 |
| GOV-006 | Create data control actions | [ ] | P1 | 3 |
| GOV-007 | Write `TEACHING_METHODOLOGY.md` | [ ] | P1 | 4 |
| GOV-008 | Implement web lookup for whitelisted sites | [ ] | P2 | 4 |

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

| Task ID | Task | Status | Priority | Est. Hours |
|---------|------|--------|----------|------------|
| AUTH-001 | Create `LoginModal.js` component | [ ] | P0 | 3 |
| AUTH-002 | Create `AuthService.js` (refactor auth.js) | [ ] | P0 | 3 |
| AUTH-003 | Implement user registration | [ ] | P0 | 3 |
| AUTH-004 | Add session management | [ ] | P0 | 2 |
| AUTH-005 | Create guest mode | [ ] | P1 | 2 |
| AUTH-006 | Implement data isolation by userId | [ ] | P0 | 4 |
| AUTH-007 | Create admin user creation flow | [ ] | P0 | 3 |
| AUTH-008 | Build Admin Panel page | [ ] | P0 | 4 |
| AUTH-009 | Implement hearts/streak/XP manual adjust | [ ] | P0 | 2 |
| AUTH-010 | Create user deletion with confirmation | [ ] | P1 | 2 |
| AUTH-011 | Add learning data controls | [ ] | P1 | 3 |
| AUTH-012 | Implement data export | [ ] | P2 | 2 |
| AUTH-013 | Create logout functionality | [ ] | P0 | 1 |

---

## Phase 8: Voice System Fixes

### 8.1 Current Problems

| Issue ID | Description | Severity |
|----------|-------------|----------|
| VOICE-001 | Download button doesn't always make voice available | Critical |
| VOICE-002 | Speed setting not applied (always 100%) | Critical |
| VOICE-003 | No refresh/check for new voices | High |
| VOICE-004 | Installed voices still shown in download list | Medium |
| VOICE-005 | AI chat cannot speak with Portuguese accent | High |

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

| Task ID | Task | Status | Priority | Est. Hours |
|---------|------|--------|----------|------------|
| VOICE-001 | Fix download → activate flow | [ ] | P0 | 4 |
| VOICE-002 | Wire speed control properly | [ ] | P0 | 2 |
| VOICE-003 | Implement voice catalog refresh | [ ] | P1 | 3 |
| VOICE-004 | Filter installed from download list | [ ] | P1 | 1 |
| VOICE-005 | Add download verification | [ ] | P1 | 2 |
| VOICE-006 | Create voice test suite | [ ] | P1 | 2 |
| VOICE-007 | Add Portuguese accent to AI chat | [ ] | P0 | 3 |
| VOICE-008 | Create `VoiceDownloader.js` service | [ ] | P0 | 3 |

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
        selector: '#aiVoiceBtn, .voice-input',
        type: 'action',
        expectedBehavior: 'Starts voice recording',
        tests: ['exists', 'visible', 'clickable', 'starts-recording']
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

| Task ID | Task | Status | Priority | Est. Hours |
|---------|------|--------|----------|------------|
| MON-001 | Create component registry system | [ ] | P0 | 4 |
| MON-002 | Build `HealthChecker.js` service | [ ] | P0 | 6 |
| MON-003 | Create test runners for each test type | [ ] | P0 | 8 |
| MON-004 | Implement 'exists' test | [ ] | P0 | 1 |
| MON-005 | Implement 'visible' test | [ ] | P0 | 1 |
| MON-006 | Implement 'clickable' test | [ ] | P0 | 1 |
| MON-007 | Implement 'functionality' tests | [ ] | P0 | 6 |
| MON-008 | Create `Logger.js` service | [ ] | P0 | 3 |
| MON-009 | Build monitoring dashboard page | [ ] | P0 | 6 |
| MON-010 | Create status grid component | [ ] | P0 | 3 |
| MON-011 | Create broken component detail view | [ ] | P0 | 3 |
| MON-012 | Create log viewer component | [ ] | P0 | 4 |
| MON-013 | Add log filtering/search | [ ] | P1 | 2 |
| MON-014 | Create user data view (admin) | [ ] | P0 | 4 |
| MON-015 | Implement startup validation | [ ] | P0 | 4 |
| MON-016 | Add "Why it's failing" analysis | [ ] | P0 | 4 |
| MON-017 | Create health check scheduler | [ ] | P1 | 2 |
| MON-018 | Add component retry functionality | [ ] | P1 | 2 |
| MON-019 | Implement log export | [ ] | P2 | 1 |
| MON-020 | Add real-time status updates | [ ] | P1 | 3 |

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

| Task ID | Task | Status | Priority | Est. Hours |
|---------|------|--------|----------|------------|
| UI-001 | Create `animations.css` | [ ] | P1 | 3 |
| UI-002 | Add page transitions | [ ] | P1 | 2 |
| UI-003 | Implement modal animations | [ ] | P1 | 2 |
| UI-004 | Add card hover/press effects | [ ] | P2 | 2 |
| UI-005 | Create feedback animations | [ ] | P1 | 2 |
| UI-006 | Implement font size control | [ ] | P1 | 2 |
| UI-007 | Add accessibility settings panel | [ ] | P1 | 3 |
| UI-008 | Create loading skeletons | [ ] | P2 | 2 |
| UI-009 | Add confetti on lesson complete | [ ] | P2 | 1 |

---

## Phase 11: Practice & Flashcards

### 11.1 Flashcard Improvements (LOW PRIORITY)

| Task ID | Task | Status | Priority | Est. Hours |
|---------|------|--------|----------|------------|
| FLASH-001 | Redesign flashcard UI | [ ] | P2 | 4 |
| FLASH-002 | Add swipe gestures (mobile) | [ ] | P2 | 3 |
| FLASH-003 | Improve spaced repetition | [ ] | P2 | 4 |
| FLASH-004 | Add flashcard stats | [ ] | P2 | 3 |
| FLASH-005 | Review practice section UX | [ ] | P2 | 4 |

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

| Task ID | Task | Status | Priority | Est. Hours |
|---------|------|--------|----------|------------|
| DEG-001 | Define all degradation rules | [ ] | P0 | 2 |
| DEG-002 | Implement feature hiding | [ ] | P0 | 2 |
| DEG-003 | Create fallback notices | [ ] | P0 | 2 |
| DEG-004 | Add admin-only visibility | [ ] | P0 | 1 |
| DEG-005 | Implement toast notification system | [ ] | P1 | 2 |
| DEG-006 | Test all degradation paths | [ ] | P0 | 3 |

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

*Last Updated: December 26, 2025*
