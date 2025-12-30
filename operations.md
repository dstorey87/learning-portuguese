# Operations (Workflow)

This repo follows a strict branch-first workflow and test/documentation gates.

## 1) Branching (mandatory)
- Never commit directly to `main`.
- One task = one branch.
- Branch naming: `<type>/<task-id>-<short-description>`
  - Types: `feature/`, `fix/`, `refactor/`, `docs/`, `test/`, `chore/`

Commands:
- `git checkout main`
- `git pull origin main`
- `git checkout -b <type>/<task-id>-<short-description>`

## 2) Testing (mandatory)
Prefer targeted tests while iterating; run full suite before merge.

Targeted examples (Playwright):
- `npx playwright test tests/e2e/lesson.e2e.test.js`
- `npx playwright test --grep "NAV-E001"`

MCP Playwright (UI/visual/content changes):
- Use MCP Playwright tools (`mcp_playwright_browser_navigate`, `mcp_playwright_browser_click`, `mcp_playwright_browser_type`, `mcp_playwright_browser_take_screenshot`, `mcp_playwright_browser_evaluate`) on http://localhost:63436.
- Capture screenshots and note asset URLs for all exercised flows; failures must be fixed and re-run before completion.
- Mandatory flows when lessons/UX change: practice-first lesson entry, word-order/cloze/picture exercises, image typing (e.g., pastel), numbers with finger image, voice dictation with speed slider, adaptive lesson mix after profile seed.

Before merge:
- `npm test`

## 3) Documentation & plan updates (mandatory)
- Keep these aligned with delivered behavior:
  - `initial_plan.md` (short, stable overview)
  - `IMPLEMENTATION_PLAN.md` (single source of truth for feature status/spec)
  - `README.md` (only when relevant to user-facing behavior)

## 4) AI event logging (mandatory)
All user interactions that affect learning must emit events.

Minimum pattern:
- Log locally via `src/services/Logger.js`
- Stream via `src/services/eventStreaming.js`

## 5) Merge policy (mandatory)
After tests pass:
- Merge to `main` immediately
- Push `main`
- Delete the task branch locally and on origin

Commands:
- `git checkout main`
- `git pull origin main`
- `git merge <branch-name>`
- `git push origin main`
- `git branch -d <branch-name>`
- `git push origin --delete <branch-name>`

## 6) Source of truth
If instructions conflict, priority is:
1) `.github/copilot-instructions.md`
2) `operations.md`
3) `IMPLEMENTATION_PLAN.md`
4) `initial_plan.md`
