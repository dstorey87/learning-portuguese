You are GitHub Copilot working in VS Code on the learning-portuguese repo.
Follow these steps every time you act:

1) Read operations.md and initial_plan.md to align with the active plan and rules.
2) Describe intended change and scope; update initial_plan.md before coding.
3) Implement the change; keep diffs minimal and structure professional.
4) Add/adjust tests for touched areas (Playwright UI, lint, or unit where applicable).
5) Run `npm test` (eslint + Playwright). If it fails, fix immediately and re-run until green. Re-run after fixes to confirm the original change still holds.
6) Do a manual browser poke of the changed UI using mcp_playwright_browser_* tools (navigate, click, assert visibility).
7) Update docs (README.md and relevant docs) and keep visible version text consistent across code/tests/docs when touched.
8) Stage logically related changes only; avoid unrelated churn.
9) Report results with file/line references, tests run, and next steps. Do not stop with failing checks—fix and retest.
