# Bugs

## Open Bugs (Prioritized)

### bug-028: Persistent 404 errors in console during Admin page usage

- **Impact:** Medium - May indicate missing resources or broken API calls; clutters console making debugging harder.
- **Status:** ?? OPEN
- **Description:** Browser console shows repeated 404s during admin interactions.
- **Validation:** Pending (MCP Playwright)

---

## Fixed but NOT Validated (treat as open)

### bug-033: /api/curator/start crashes with unsupported flag

- **Status:** ✅ FIXED (ws-driven start; CLI supports --no-vision)
- **Description:** Node start/stop now delegates to the Python websocket server and batch_curator exposes the `--no-vision` flag, removing the crash.
- **File:** server.js (`/api/curator/start` -> ws), image-curator/batch_curator.py (CLI args)
- **Validation:** Playwright suite executed (admin auth smoke); curator run path to be rechecked in next ws-driven session

### bug-034: WebSocket curator updates never start

- **Status:** ✅ FIXED
- **Description:** server.js now spawns the Python websocket_server on boot and keeps a ws client connected; UI auto-connects and receives status/progress/candidates.
- **File:** server.js, image-curator/websocket_server.py
- **Validation:** Playwright run (admin auth smoke); live ws run recommended

### bug-035: GPUManager API mismatch breaks websocket_server

- **Status:** ✅ FIXED
- **Description:** GPUManager now implements async `initialize()` and `get_stats()` and websocket_server consumes those helpers without crashing.
- **File:** image-curator/websocket_server.py, image-curator/gpu_manager.py
- **Validation:** Lint + Playwright smoke; GPU telemetry to be checked in next ws session

### bug-036: Curator status/progress in API are placeholders

- **Status:** ✅ FIXED
- **Description:** Node status now reflects live websocket-fed state (progress, current word, GPU stats, API keys) instead of placeholders.
- **File:** server.js (`/api/curator/status`)
- **Validation:** Playwright run (admin auth smoke); live run recommended

### bug-019: No image resizing to 1200x900 @ 85% quality

- **Status:** ✅ FIXED
- **Description:** Added image_processor resizing to 1200x900 @85% JPEG and wired into batch download path with width/height persisted.
- **File:** image-curator/image_processor.py, image-curator/batch_curator.py, image-curator/storage.py
- **Validation:** Lint + Playwright run; next curator batch should verify dimensions

### bug-036a: Admin paywall shown when clicking crown (was bug-031)

- **Status:** ✅ FIXED
- **Description:** Paywall modal now short-circuits for admin users.
- **Validation:** Playwright run (admin auth smoke)

### bug-036b: APIKeyManager container warning (was bug-030)

- **Status:** ✅ FIXED
- **Description:** Init now re-renders the wrapper when missing and silently no-ops if the panel isn’t present.
- **Validation:** Playwright run (admin auth smoke)

### bug-021: Admin WebSocket integration missing

- **Status:** ✅ FIXED
- **Description:** Websocket server is auto-started; admin console auto-connects and listens for progress/candidates/selected events.
- **Validation:** Playwright run (admin auth smoke); live ws run recommended

### bug-016: Curator selects first passing image, not best

- **Status:** ?? FIXED, pending validation
- **Fix:** Score all candidates; pick highest meeting thresholds.
- **Validation:** Pending (MCP Playwright)

### bug-017: CLI default candidates is 3 (plan says 5)

- **Status:** ?? FIXED, pending validation
- **Fix:** Defaults set to 5.
- **Validation:** Pending (MCP Playwright)

### bug-018: Vision model default not per plan

- **Status:** ?? FIXED, pending validation
- **Fix:** Default model set to gemma3:4b per plan.
- **Validation:** Pending (MCP Playwright)

### bug-020: CSV not updated with curated image URLs

- **Status:** ?? FIXED, pending validation
- **Fix:** `_update_csv_image_url()` writes image_url back to lesson CSV.
- **Validation:** Pending (MCP Playwright)

### bug-022: Vision validation ignores relevance minimum

- **Status:** ?? FIXED, pending validation
- **Fix:** Enforce total >=28 AND relevance >=7.
- **Validation:** Pending (MCP Playwright)

### bug-023: Missing /api/curator/* endpoints

- **Status:** ?? FIXED, pending validation
- **Fix:** Added start/stop/status routes in server.js.
- **Validation:** Pending (MCP Playwright)

### bug-024: Admin console model dropdown outdated

- **Status:** ?? FIXED, pending validation
- **Fix:** Added gemma3:4b default; updated options list.
- **Validation:** Pending (MCP Playwright)

### bug-025: Admin console defaults wrong

- **Status:** ?? FIXED, pending validation
- **Fix:** Defaults now gemma3:4b and 5 candidates.
- **Validation:** Pending (MCP Playwright)

### bug-026: Admin console GPU text crash on undefined array

- **Status:** ?? FIXED, pending validation
- **Fix:** Null-safe access to GPU info; dashboard renders.
- **Validation:** Pending (MCP Playwright)

### bug-032: Image library database missing word_id column

- **Status:** ?? FIXED, pending validation
- **Fix:** Added word_id column + migration.
- **Validation:** Pending (MCP Playwright)

---

## Resolved Bugs (Validated)

### bug-001: Modal Text Visibility Issue

- **Status:** ✅ FIXED + VALIDATED
- **Fix:** Strengthened modal contrast in styles.css; verified via Playwright (rgba(0,0,0,0.8) background, white content, text rgb(51,51,51)).

### bug-002: Inconsistent Button Styles

- **Status:** ✅ FIXED + VALIDATED
- **Fix:** Standardized `.btn` styles (Nunito 600, borderRadius 12px, transitions).

### bug-003: Slow Load Times on Dashboard

- **Status:** ✅ FIXED + VALIDATED
- **Fix:** Deferred non-critical init; domContentLoaded ~510ms.

### bug-004: Missing Alt Text on Images

- **Status:** ✅ FIXED + VALIDATED
- **Fix:** ChallengeRenderer now sets alt fallback; Playwright shows `img "seven"` in tree.

### bug-005: Form Validation Errors Not Displayed

- **Status:** ✅ FIXED + VALIDATED
- **Fix:** Styled `.error-text` for visibility (red bg/border); Playwright confirmed.

### bug-006: Dynamically Loaded Images Fail/Duplicate

- **Status:** ✅ MITIGATED + VALIDATED
- **Note:** Uses explicit `image_url` from CSV; error handlers in ChallengeRenderer.

### bug-007: Modals Too Large on Desktops

- **Status:** ✅ FIXED + VALIDATED
- **Fix:** Max-width constraints for modal-content/large-modal.

### bug-008: Lesson Card Background Mismatch

- **Status:** ✅ MITIGATED + VALIDATED
- **Note:** Uses lesson_metadata `image`; requires curated updates.

### bug-009: Voice Selection Not Persisting

- **Status:** ✅ FIXED + VALIDATED
- **Fix:** Call setupVoiceSettings() on initApp(); Playwright shows persisted voice.

### bug-010: Telemetry Events Not Consistently Logged

- **Status:** ✅ VERIFIED + VALIDATED
- **Note:** EventStreaming implements TM-002; no missing telemetry found.

### bug-011: Speech Recognition Converts Numbers to Integers

- **Status:** ✅ FIXED + VALIDATED
- **Fix:** DIGIT_TO_PORTUGUESE mapping in WebSpeechService/PhoneticScorer.

### bug-012: Learn-the-word Sections Score 0%

- **Status:** ✅ FIXED + VALIDATED
- **Fix:** Return 100% when graded challenges are zero.

### bug-013: Questions Show Answers on Same Screen

- **Status:** ✅ FIXED + VALIDATED
- **Fix:** Options show only Portuguese prompts; Playwright confirmed.

### bug-014: Word Images Not Matching Vocabulary

- **Status:** ✅ FIXED + VALIDATED (Numbers 1-10)
- **Fix:** Added `image_url` column; loaders and renderers use explicit URLs.

### bug-015: "This site can't be reached" on guest login

- **Status:** ✅ MITIGATED + VALIDATED
- **Fix:** API base resolver filters cloudflare; fallback to localhost; index.html cleanup.

### bug-027: Image Management "Scan All Lessons" returns 0

- **Status:** ✅ FIXED + VALIDATED
- **Fix:** Await lesson metadata; parse CSV correctly; coverage shows totals (345/11/334); Playwright evidence .playwright-mcp/admin-image-coverage.png.

### bug-029: Admin collapsible panels not collapsing

- **Status:** ✅ FIXED + VALIDATED
- **Fix:** Re-init collapsible after refresh; Playwright confirms collapsed state.

---

## Validation Notes

- All validations must be performed with MCP Playwright tools (navigate, snapshot, click, evaluate, screenshot). No manual verification counts.
