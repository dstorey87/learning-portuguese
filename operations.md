# Operating Rules and Enforcement

These rules are mandatory for every change. Treat this file as the source of truth for workflow enforcement. Copilot should also load .github/copilot-instructions.md in VS Code (GitHub Copilot > Advanced > Use instruction files) so the model follows these rules automatically. For prompt-file workflows, .github/instructions/enforcement.prompt.md can be used to seed actions in Copilot Chat.

## Non-Negotiable Workflow
- Work from an up-to-date plan in initial_plan.md; update the plan for every change batch.
- After each change, run lint and browser tests (Playwright) plus any added best-practice tests.
- Use browser-driven checks (mcp_playwright_browser_* tools) to exercise the changed surface when applicable.
- If a failure occurs, fix immediately, rerun the same tests, and loop until green. Do not defer fixes.
- Re-run the original change’s tests after fixes to confirm the change still holds.
- No bugs permitted: keep the loop until zero failing checks.
- Update documentation (README.md and/or relevant docs) after each successful change.
- Keep Git history clean: stage related changes together, avoid unrelated churn, and prefer small, reviewable commits.
- Continuously review structure for professionalism; refactor folders/files when they drift.

## Testing Expectations
- Default gate: `npm test` (eslint + Playwright UI tests with webServer on :4174).
- Add targeted Playwright specs or other best-practice tests alongside new features.
- For UI changes, run an interactive browser check using mcp_playwright_browser_* (navigate, click, assert visibility) on the affected flow.

## Documentation Expectations
- Bump and align version text across code, README.md, and tests when version-visible changes ship.
- Keep manual test plan current in README.md and link back to these rules.

## Plan & Traceability
- Canonical plan: initial_plan.md. Update checkpoints/tasks when work is done or added.
- Note any gating decisions or deferrals in the plan to keep intent explicit.

## Git Hygiene
- Use feature branches when possible; group logically-related changes.
- Ensure commits include: updated plan, updated docs, updated tests.

## Quick Checklist (run per change)
1) Update plan entry in initial_plan.md for this change.
2) Implement change.
3) Add/adjust tests (Playwright + unit/logic if applicable).
4) Run `npm test` (eslint + Playwright).
5) Run manual browser poke with mcp_playwright_browser_* on touched UI.
6) Fix issues, repeat tests until green.
7) Update README.md/docs and version text if visible.
8) Stage for commit with clean diff.
