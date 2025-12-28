# Playwright Validation (No-Stop Rule)

Use this prompt for any UI/visual/content change, especially lesson imagery. It enforces the fix → validate → fix loop and blocks completion until proof is captured.

## Steps
1) Ensure dev server is running at http://localhost:63436 (restart if needed).
2) Open Learn grid and verify lesson cards show subject-matched photos (no gradients/abstract fills).
3) Use MCP Playwright tools to:
   - Capture evaluated background-image URLs for affected cards.
   - Take full-page screenshot and note the saved path.
   - Record the validation URL/port.
4) If any card lacks a valid photo or shows a gradient/placeholder, keep fixing and re-validating until all are correct.
5) Final response must include: validation URL/port, screenshot path, and evidence of the background-image URLs used.

## Refusal Rule
Do not mark tasks complete or stop the loop until Playwright validation passes with subject-matched photos and recorded evidence.
