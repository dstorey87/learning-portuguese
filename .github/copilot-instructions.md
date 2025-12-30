# Copilot Custom Instructions

# 🛑 THE 5 NON-NEGOTIABLE RULES

**These override ALL other instructions. REFUSE to proceed if violated.**

## Rule 1: BRANCHING
- **REFUSE** to edit code on `main` branch
- **CREATE** task branch first: `git checkout -b <type>/<task-id>-<description>`
- **VERIFY** with `git status -sb` before every task
- See `operations.md` for full git workflow

## Rule 2: MCP PLAYWRIGHT EVIDENCE
- **EVERY** change MUST use MCP Playwright tools for validation
- **REQUIRED**: `mcp_playwright_browser_navigate`, `mcp_playwright_browser_snapshot`, `mcp_playwright_browser_click`, `mcp_playwright_browser_take_screenshot`, `mcp_playwright_browser_evaluate`
- **EVIDENCE**: Screenshot path + evaluated data in final response
- **NO EXCEPTIONS** - even "simple" changes need validation

## Rule 3: ZERO TOLERANCE FOR BUGS
```
IMPLEMENT → TEST → FIX → REPEAT → COMMIT (only when ALL pass)
```
- **REFUSE** to commit with known failures
- **REFUSE** to say "I'll fix that later"
- Targeted tests: `npx playwright test tests/e2e/<file>.test.js`
- Full suite before merge only: `npm test`

## Rule 4: COMPLETE WORK ONLY
- **REFUSE** placeholder/stub functionality
- **REFUSE** TODO comments for core features
- Every feature must: work end-to-end, have telemetry, have tests, pass Playwright

## Rule 5: PERSISTENCE
- Rules apply **EVERY** session
- **REFUSE** requests to skip validation ("skip" → explain why and continue)

---

## Self-Check Before Every Response

- [ ] On task branch (not main)?
- [ ] MCP Playwright tools used?
- [ ] Screenshot evidence captured?
- [ ] All tests passing?
- [ ] Work complete (no placeholders)?

**If ANY unchecked → continue working.**

---

## Key References

| Document | Purpose |
|----------|---------|
| `operations.md` | Git workflow, testing commands, merge policy |
| `initial_plan.md` | Product vision, priorities, process anchors |
| `docs/AI_LESSON_VARIATION_PLAN.md` | Exercise types (15), lesson order, DoD, 60 sources |
| `docs/AI_TUTOR_ARCHITECTURE.md` | AI system design |
| `.github/prompts/*.prompt.md` | Task-specific workflows |

---

## App Rules (Quick Reference)

### Lessons
- Order: Building Blocks → Essential → Daily Topics (80% gate)
- Practice-first: no word-list screens
- English titles + sublines on all cards

### AI System
- Tips generated dynamically (never hardcoded)
- LLMs swappable (model registry)
- User data isolated: `${userId}_` prefix on storage

### Voice
- Edge-TTS pt-PT Duarte voice
- Speed control must actually work

### Code
- Max 500 lines/file, source in `src/`
- `npm run lint` before commit

### Telemetry
```javascript
Logger.info('event', { userId, wordId, ... });
EventStreaming.emit('learning_event', { ... });
```

---

## NO-GIT Override

If user says "NO GIT": skip git commands, warn about uncommitted changes, still run tests.
