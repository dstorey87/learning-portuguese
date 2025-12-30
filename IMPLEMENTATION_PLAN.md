# PortuLingo Implementation Plan

> **Version:** 4.0.0 | **Updated:** 2025-12-30 | **For:** AI Agents

---

## 📊 STATUS DASHBOARD

| Metric | Value | Target |
|--------|-------|--------|
| **Completion** | ~40% | 100% |
| **Core Services** | Built | Integrated |
| **AI Intelligence** | Basic | Research-Backed |

### Current Focus

| Priority | Task | Status |
|----------|------|--------|
| **P0** | AI Pedagogy Integration | [ ] In Progress |
| **P0** | Service Integration (app.js cleanup) | [ ] Blocked |
| **P1** | Admin Dashboard | [ ] Not Started |
| **P1** | Monitoring Dashboard | [ ] Not Started |

---

## 🎯 PHASE OVERVIEW

| Phase | Name | Status | Notes |
|-------|------|--------|-------|
| 1 | Foundation & Structure | ✅ DONE | Services created in src/ |
| 2 | Building Blocks Lessons | ✅ DONE | 10 lesson files |
| 3 | Navigation | ✅ DONE | 8 components |
| 4 | Lesson Layout & Accordion | ✅ DONE | Right panel working |
| 5 | AI Pipeline | 🔄 IN PROGRESS | Core built, needs pedagogy |
| 6 | AI Governance | [ ] NOT STARTED | Dashboard needed |
| 7 | Authentication | ✅ DONE | AuthService complete |
| 8 | Voice System | 🔄 PARTIAL | TTS working, fixes needed |
| 9 | Monitoring | [ ] NOT STARTED | Critical for debugging |
| 14 | Pronunciation | ✅ DONE | 5 services, 55 tests |

---

## 🔴 IMMEDIATE TASKS

### AI Pedagogy Integration (Current Sprint)

The AI must be trained on evidence-based teaching methodology.

| Task ID | Task | Status | File |
|---------|------|--------|------|
| PED-001 | Create AI_PEDAGOGY_BIBLE.md | [x] | docs/AI_PEDAGOGY_BIBLE.md |
| PED-002 | Integrate pedagogy into system prompts | [ ] | src/services/ai/AIAgent.js |
| PED-003 | Add FSRS algorithm from ts-fsrs | [ ] | src/services/FSRSEngine.js |
| PED-004 | Wire LearnerProfiler to event stream | [ ] | src/services/LearnerProfiler.js |
| PED-005 | Create stuck-word rescue techniques | [x] | src/services/ai/StuckWordsService.js |
| PED-006 | Implement mnemonic generation | [x] | Uses pedagogy prompts |

### Service Integration (Blocked - app.js too large)

| Task ID | Task | Status | Blocker |
|---------|------|--------|---------|
| INT-001 | Import AuthService properly | [ ] | app.js 5000+ lines |
| INT-002 | Import LessonService properly | [ ] | app.js 5000+ lines |
| INT-003 | Import VoiceService properly | [ ] | app.js 5000+ lines |
| INT-020 | Add CSS @import statements | [ ] | styles.css 6000+ lines |

**Decision Required:** Should we refactor app.js first, or wire services into current monolith?

---

## 📁 ARCHITECTURE

```
learning_portuguese/
├── app.js              # Main app (5,000+ lines - NEEDS SPLIT)
├── server.js           # TTS backend ✅
├── docs/
│   ├── AI_PEDAGOGY_BIBLE.md  # AI teaching methodology ✅ NEW
│   └── TTS_RESEARCH_2025.md  # Voice research
├── src/
│   ├── components/     # 22 components ✅
│   ├── services/       # 32 services ✅
│   │   ├── ai/         # AI Agent, Tools, Memory
│   │   └── ...
│   ├── data/           # 16 lesson files ✅
│   └── styles/         # 12 CSS modules ✅
└── tests/              # 300+ tests ✅
```

---

## 🤖 AI INTELLIGENCE UPGRADE

### The Problem

Current AI knows facts but doesn't understand *how to teach effectively*.

### The Solution

1. **AI Pedagogy Bible** (`docs/AI_PEDAGOGY_BIBLE.md`) - Research-backed teaching principles
2. **System Prompt Injection** - Feed pedagogy rules into every AI interaction
3. **FSRS Integration** - Evidence-based spaced repetition scheduling
4. **Adaptive Intervention** - AI detects patterns and acts

### Research Sources Integrated

| Theory | Source | Application |
|--------|--------|-------------|
| Input Hypothesis | Krashen (1985-2024) | i+1 content sequencing |
| FSRS Algorithm | open-spaced-repetition | Review scheduling |
| Active Recall | Roediger & Karpicke | Quiz-first approach |
| Dual Coding | Paivio/Mayer | Audio + visual + text |
| Interleaving | Rohrer (2015) | Mix topics in practice |

### AI Teaching Techniques

| Technique | When Used | Implementation |
|-----------|-----------|----------------|
| Keyword Mnemonic | Word stuck 3+ times | Generate English sound-alike |
| Memory Palace | Theme lessons | Associate with familiar places |
| Minimal Pairs | Pronunciation issues | Compare similar sounds |
| Input Flood | Phoneme weakness | Surround with target sound |
| Chunking | Sentence building | Word → phrase → sentence |

### Implementation Tasks

| Task ID | Task | Status | Priority |
|---------|------|--------|----------|
| AI-INTEL-001 | Add pedagogy to AIAgent system prompt | [ ] | P0 |
| AI-INTEL-002 | Create technique selector based on failure type | [ ] | P0 |
| AI-INTEL-003 | Implement mnemonic generation prompt | [x] | P0 |
| AI-INTEL-004 | Add ts-fsrs for scheduling | [ ] | P0 |
| AI-INTEL-005 | Wire pronunciation scores to LearnerProfiler | [x] | P0 |
| AI-INTEL-006 | Create custom lesson generator with interleaving | [ ] | P1 |

---

## 👤 USER DATA ISOLATION (COMPLETE)

All services now use user-prefixed storage keys:

```javascript
// Pattern: ${userId}_keyname
ProgressTracker.setCurrentUser(userId);  // Sets context
const progress = ProgressTracker.loadProgress();  // Uses user's data only
```

| Service | Key Pattern | Status |
|---------|------------|--------|
| ProgressTracker | `${userId}_portulingo_progress` | ✅ |
| StuckWordsService | `${userId}_stuckWords` | ✅ |
| LearnerProfiler | `${userId}_learner_profile` | ✅ |
| EventStreaming | `${userId}_eventBatch` | ✅ |
| AIChat History | `${userId}_ai_chat_history` | ✅ |

---

## 🗣️ VOICE SYSTEM STATUS

### Working

- ✅ TTS Server (Edge-TTS via server.py)
- ✅ Web Speech API integration
- ✅ Portuguese voice playback
- ✅ Pronunciation assessment (5 services)

### Needs Work

| Issue | Fix Required | Priority |
|-------|--------------|----------|
| Speed slider not applied | Wire rate to utterance | P0 |
| Download doesn't activate | Refresh dropdown after download | P1 |
| No voice refresh button | Add catalog check | P2 |

---

## 📊 MONITORING DASHBOARD (NOT STARTED)

Admin needs visibility into:

1. Component health (exists, visible, works)
2. Service status (Ollama, TTS, Whisper)
3. User learning data (per-user view)
4. AI activity log

### Implementation Tasks

| Task ID | Task | Status | Priority |
|---------|------|--------|----------|
| MON-001 | Create component registry | [ ] | P1 |
| MON-002 | Build HealthChecker service | [x] | P1 |
| MON-003 | Create monitoring page | [ ] | P1 |
| MON-004 | Add user data admin view | [ ] | P1 |

---

## ⚙️ ADMIN DASHBOARD (NOT STARTED)

Admin capabilities needed:

- Create/edit users
- Adjust hearts/XP/streaks manually
- Delete user learning data
- View AI activity
- Manage whitelist sources

### Implementation Tasks

| Task ID | Task | Status | Priority |
|---------|------|--------|----------|
| ADMIN-001 | Create admin page layout | [ ] | P1 |
| ADMIN-002 | User list with "Log in as" | [ ] | P1 |
| ADMIN-003 | Hearts/XP/Streak controls | [ ] | P1 |
| ADMIN-004 | Data deletion controls | [ ] | P1 |

---

## 🚨 GRACEFUL DEGRADATION

| Service Down | User Experience | Admin Experience |
|--------------|-----------------|------------------|
| Ollama | AI features hidden, lessons work | Full error details |
| TTS | Audio hidden, text works | Full error details |
| Whisper | Voice input hidden, type works | Full error details |

---

## ✅ COMPLETED PHASES (Reference)

### Phase 1: Foundation ✅
- Created src/ directory structure
- Extracted 22 components from app.js
- Created 32 services
- Built 12 CSS modules

### Phase 2: Building Blocks ✅
- 10 lesson files (pronouns, articles, verbs, etc.)
- Proper tier ordering
- Prerequisites system

### Phase 3: Navigation ✅
- Sidebar component
- TopBar component  
- Mobile drawer
- Bottom nav (mobile)

### Phase 4: Lesson Layout ✅
- Right panel accordion
- Single-section-open behavior
- AI Tips panel
- Mobile drawer variant

### Phase 7: Authentication ✅
- AuthService with 23 tests
- Login modal
- Role-based access (Guest/User/Admin)
- Hearts/XP/Streak system

### Phase 14: Pronunciation ✅
- PronunciationService
- AudioRecorder
- AudioPreprocessor
- PhoneticScorer
- WebSpeechService
- 55 unit tests passing

---

## 🧭 NEXT STEPS (Priority Order)

1. **AI Pedagogy Integration** - Make AI actually intelligent
   - Inject pedagogy into system prompts
   - Add FSRS scheduling
   - Create technique-based interventions

2. **Voice Speed Fix** - Critical UX issue
   - Wire slider value to utterance.rate

3. **Admin Dashboard** - For debugging and management
   - User management
   - AI activity view

4. **Monitoring Dashboard** - For debugging
   - Component health checks
   - Service status

5. **app.js Refactor** - Technical debt
   - Split into modules
   - Wire all services properly

---

## 📋 AI AGENT INSTRUCTIONS

### When Implementing Tasks:

1. **Read** `docs/AI_PEDAGOGY_BIBLE.md` before any AI work
2. **Check** this STATUS DASHBOARD
3. **Fix** bugs before features
4. **Update** this file when done: `[ ]` → `[x]`
5. **Test** targeted tests only (not full suite)

### Branch Naming:

- `feature/AI-XXX-description`
- `fix/BUG-XXX-description`
- `refactor/REF-XXX-description`
- `docs/DOC-XXX-description`

### Commit Format:

```
[TASK-ID] Brief description

- Detail 1
- Detail 2
```

---

*Streamlined: 2025-12-30*
*Previous version: 4,082 lines → Now: ~300 lines*
