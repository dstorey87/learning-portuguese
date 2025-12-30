# MCP Playwright Validation - REQUIRED

**This prompt enforces MCP Playwright usage. Load for ANY task involving UI, visuals, or functionality.**

---

## 🛑 NON-NEGOTIABLE: Playwright Evidence Required

Every task MUST include MCP Playwright validation. No exceptions. No "I'll check later."

---

## Required Tool Sequence

### 1. Navigate to Page
```
Tool: mcp_playwright_browser_navigate
URL: http://localhost:63436/<relevant-path>
```

### 2. Capture Structure
```
Tool: mcp_playwright_browser_snapshot
Purpose: Get accessibility tree, verify elements exist
```

### 3. Test Interactions
```
Tool: mcp_playwright_browser_click
Purpose: Click buttons, links, interactive elements
Verify: Expected behavior occurs
```

### 4. Type Input (if applicable)
```
Tool: mcp_playwright_browser_type
Purpose: Test form inputs, text fields
```

### 5. Take Screenshot
```
Tool: mcp_playwright_browser_take_screenshot
Filename: <task-id>-<description>.png
Purpose: Visual evidence of completed state
```

### 6. Extract Data
```
Tool: mcp_playwright_browser_evaluate
Purpose: Verify DOM state, extract URLs, check values
Example: Extract background-image URLs, verify data attributes
```

---

## Validation Loop

```
┌──────────────────────────────────────┐
│  DO NOT EXIT UNTIL VALIDATION PASSES │
│                                      │
│  1. Use MCP Playwright tools         │
│  2. Check for issues                 │
│  3. If issues found → FIX            │
│  4. Re-run validation                │
│  5. Repeat 3-4 until clean           │
│  6. Capture final screenshot         │
│  7. Include evidence in response     │
└──────────────────────────────────────┘
```

---

## Evidence Template (Copy into final response)

```markdown
### MCP Playwright Validation ✅

**URL:** http://localhost:63436/<path>
**Tools Used:**
- `mcp_playwright_browser_navigate` → Page loaded
- `mcp_playwright_browser_snapshot` → Structure verified
- `mcp_playwright_browser_click` → Interaction tested
- `mcp_playwright_browser_take_screenshot` → Evidence captured

**Screenshot:** `test-results/<task-id>.png`
**Evaluated Data:**
- [Element]: [Value]
- [Element]: [Value]

**Issues Found:** None / [List and resolution]
**Final State:** ✅ Validated and working
```

---

## Refusal Triggers

**REFUSE to mark complete if:**
- No `mcp_playwright_browser_navigate` was called
- No `mcp_playwright_browser_take_screenshot` was called
- Screenshot shows broken UI
- Evaluated data doesn't match expected
- User says "skip Playwright" → REFUSE

**Response:**
> "I cannot mark this task complete without MCP Playwright validation. This is a non-negotiable rule. I will now run the validation..."

---

## Common Validation Scenarios

### Lesson Card Changes
```javascript
// mcp_playwright_browser_evaluate
() => {
  const cards = document.querySelectorAll('.lesson-card');
  return Array.from(cards).map(card => ({
    title: card.querySelector('.title')?.textContent,
    image: getComputedStyle(card).backgroundImage
  }));
}
```

### Navigation Changes
```javascript
// mcp_playwright_browser_evaluate
() => {
  const nav = document.querySelector('nav');
  return {
    visible: nav?.offsetParent !== null,
    items: Array.from(nav?.querySelectorAll('a')).map(a => a.href)
  };
}
```

### Form Validation
```javascript
// After mcp_playwright_browser_type
// mcp_playwright_browser_evaluate
() => {
  const form = document.querySelector('form');
  const inputs = form?.querySelectorAll('input');
  return Array.from(inputs).map(i => ({
    name: i.name,
    valid: i.validity.valid,
    value: i.value
  }));
}
```
