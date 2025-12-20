## Plan: Enforce Workflow Guardrails

Codify the mandatory workflow (plan-first, test-loop, doc updates) into the repo, align docs and tests, and wire scripts so changes are always paired with Playwright/browser verification and documentation touchpoints.

### Steps
1. Add an enforceable ops charter with the rules and test loop, referenced from README.md and initial_plan.md (new operations.md).
2. Update initial_plan.md with the current workstream, mapping changes to tasks/tests, and link to the ops charter.
3. Align versioning and behavior expectations in README.md and tests/smoke.spec.js (e.g., displayed version text, manual test list).
4. Extend automation in package.json and playwright.config.js to include the mandated Playwright/browser run and doc-update gate in the change workflow.
5. Add a contributor checklist in README.md tying code changes to required tests, fixes, retests, and documentation updates.

### Further Considerations
1. Prefer ops file name? Option A: operations.md; Option B: governance.md; Option C: contributing.md.
2. Should the browser test gate run on every `npm test` or as a separate `npm run verify`?
