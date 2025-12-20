# Copilot Custom Instructions

These directives must be loaded (VS Code: Settings → GitHub Copilot → Advanced → enable instruction files) so Copilot follows the enforced workflow.

## Mandatory Workflow
- Always read operations.md and initial_plan.md before responding; keep changes aligned to the active plan.
- After every code change, run lint + Playwright UI tests via `npm test`; use browser-driven checks (mcp_playwright_browser_* tools) on the affected UI.
- If any check fails, fix immediately, rerun the same checks, and loop until all green; no deferrals.
- Re-test the original change once fixes pass to confirm it still holds.
- No bugs allowed: continue the fix/test loop until zero failures.

## Documentation & Planning
- Update documentation (README.md and relevant docs) after successful changes.
- Update the plan (initial_plan.md) to reflect scope, status, and decisions for each change.
- Keep version strings consistent across code, README, and tests when touched.

## Git Hygiene
- Keep diffs minimal and related; avoid unrelated churn. Stage logically related changes together.
- Prefer small, reviewable commits; ensure tests/docs/plan are included with the change.

## Structure & Quality
- Review and maintain a professional folder/file structure; refactor when it drifts.
- Add best-practice tests alongside new features (Playwright or other appropriate coverage).

## Execution Notes
- Serve locally with `npm run serve` (port 4174) when running Playwright or manual browser checks.
- Surface failures with clear paths/lines and propose fixes immediately.
