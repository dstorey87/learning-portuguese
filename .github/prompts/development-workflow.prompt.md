# Development Workflow Prompt

**Load this prompt for ANY development task. It enforces the 5 non-negotiable rules.**

---

## Pre-Flight Checklist (BEFORE starting)

```bash
# 1. Check current branch
git status -sb

# 2. If on main, create task branch
git checkout main
git pull origin main
git checkout -b <type>/<task-id>-<description>
```

**STOP if on main. Create branch first.**

---

## Development Loop (MANDATORY)

```
IMPLEMENT → TEST → FIX → VALIDATE → REPEAT
```

### Step 1: Implement
- Make the code change
- Keep changes focused on one task

### Step 2: Test (Targeted)
```bash
# Run relevant tests only
npx playwright test tests/e2e/<affected>.e2e.test.js
npx playwright test tests/unit/<service>.test.js
```

### Step 3: Fix
- If ANY test fails → fix immediately
- Do NOT proceed with failures
- Loop back to Step 2

### Step 4: Validate with MCP Playwright
```
1. mcp_playwright_browser_navigate to http://localhost:63436
2. mcp_playwright_browser_snapshot to check structure
3. mcp_playwright_browser_click to test interactions
4. mcp_playwright_browser_take_screenshot for evidence
5. mcp_playwright_browser_evaluate to extract data
```

### Step 5: Repeat
- If visual issues found → fix and re-validate
- Continue until ALL checks pass

---

## Completion Checklist (BEFORE marking done)

- [ ] Task branch created (not on main)
- [ ] Code changes complete (no placeholders)
- [ ] Targeted tests written and passing
- [ ] MCP Playwright validation done
- [ ] Screenshot captured and path noted
- [ ] Zero known bugs remaining
- [ ] Lint passes (`npm run lint`)

**Only if ALL boxes checked:**

```bash
# Commit with task ID
git add <files>
git commit -m "[TASK-ID] Description (Sources: X, Y if applicable)"
git push -u origin <branch-name>

# Merge to main
git checkout main
git pull origin main
git merge <branch-name>
git push origin main

# Cleanup
git branch -d <branch-name>
```

---

## Refusal Conditions

**REFUSE to proceed if:**
- On main branch without explicit NO-GIT override
- User asks to skip testing
- User asks to skip Playwright validation
- Known bugs exist and user says "fix later"
- Implementation is placeholder/stub
- Feature doesn't actually work end-to-end

**Response template for refusal:**
> "I cannot proceed because [rule X] would be violated. Specifically: [explanation]. To continue, I need to [required action]."

---

## Evidence Format (Required in final response)

```markdown
## Task Completion Evidence

**Branch:** `<type>/<task-id>-<description>`
**Tests:** `npx playwright test <files>` → ✅ All passed
**Lint:** `npm run lint` → ✅ Clean
**Playwright Validation:**
- URL: http://localhost:63436/<path>
- Screenshot: `test-results/<filename>.png`
- Evaluated data: [relevant extracted values]

**Commits:**
- `[TASK-ID] Description`
- Merged to main: ✅
```
