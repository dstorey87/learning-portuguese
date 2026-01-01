# Operations (Workflow)

This repo follows a strict branch-first workflow with MCP Playwright validation gates.

## 1) Branching (mandatory)
- Never commit directly to `main`
- One task = one branch
- Branch naming: `<type>/<task-id>-<short-description>`
  - Types: `feature/`, `fix/`, `refactor/`, `docs/`, `test/`, `chore/`

```bash
git fetch origin
git checkout -b <type>/<task-id>-<short-description> origin/main
```

## 2) Testing (mandatory)

### Targeted tests (while iterating)
```bash
npx playwright test tests/e2e/<file>.e2e.test.js
npx playwright test --grep "TEST-ID"
npx playwright test tests/unit/<service>.test.js
```

### MCP Playwright validation (UI/visual/content changes)
Use MCP tools on http://localhost:63436:
- `mcp_playwright_browser_navigate` - go to page
- `mcp_playwright_browser_snapshot` - capture structure
- `mcp_playwright_browser_click` - test interactions
- `mcp_playwright_browser_take_screenshot` - visual evidence
- `mcp_playwright_browser_evaluate` - extract/verify data

**Mandatory flows to validate:**
- Practice-first lesson entry (no word-list screens)
- Exercise types: word-order, cloze, picture, image-typing, numbers
- Voice features: dictation, speed slider
- Adaptive lesson mix after profile changes

### Full suite (before merge)
```bash
npm test
```

## 3) Merge policy (mandatory)
- Never check out or commit on `main` locally
- Rebase task branch on latest default before opening PR:
  ```bash
  git fetch origin
  git rebase origin/main
  ```
- Run required tests (targeted + full) and capture MCP Playwright evidence
- Open PR from task branch to `main`; merge performed by reviewer/automation
- After merge: clean up local branch and start the next task branch from `origin/main` (without checking out `main`):
  ```bash
  git fetch origin
  git branch -D <branch-name>
  git checkout -b <type>/<task-id>-<short-description> origin/main
  ```

## 4) AI event logging (mandatory)
All learning interactions must emit events via:
- `src/services/Logger.js` (local logging)
- `src/services/eventStreaming.js` (AI pipeline)

## 5) Source of truth priority
1. `.github/copilot-instructions.md` (rules)
2. `operations.md` (workflow)
3. `docs/AI_LESSON_VARIATION_PLAN.md` (implementation)
4. `initial_plan.md` (vision)
