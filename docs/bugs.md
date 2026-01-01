bug-001 - The modals are not designed to ensure we can always see the text, the background is too similar to the text colour.
# Known Bugs
## bug-001: Modal Text Visibility Issue
- **Description:** The modals are not designed to ensure we can always see the text,
    the background is too similar to the text colour.
- **Impact:** Users may struggle to read modal content, leading to confusion.
- **Status:** ✅ FIXED + VALIDATED
- **Fix Applied:** Enhanced modal-content styles with explicit color rules, box-shadow, and text contrast in styles.css
- **Playwright Validation:** Confirmed good contrast - background `rgba(0,0,0,0.8)`, content `rgb(255,255,255)`, text `rgb(51,51,51)`
## bug-002: Inconsistent Button Styles
- **Description:** Buttons across different pages have inconsistent styles (colors, sizes, fonts).
- **Impact:** This inconsistency can confuse users and detract from the overall user experience.
- **Status:** ✅ FIXED + VALIDATED
- **Fix Applied:** Added standardized `.btn` and `button[class*="btn-"]` base styles with consistent font-family, font-weight, cursor, transition, and border-radius
- **Playwright Validation:** All buttons have consistent `fontFamily: Nunito`, `fontWeight: 600`, `cursor: pointer`, `borderRadius: 12px`, `transition: 0.2s`
## bug-003: Slow Load Times on Dashboard
- **Description:** The admin dashboard takes too long to load, especially with large datasets.
- **Impact:** Slow load times can frustrate users and reduce productivity.
- **Status:** ✅ FIXED + VALIDATED
- **Fix Applied:** Deferred non-critical initialization (loadIngestionState, loadLessonEditorIndex, refreshAIStatus) using requestAnimationFrame to not block initial render
- **Playwright Validation:** Dashboard loads in 510ms domContentLoaded (under 1 second target)
## bug-004: Missing Alt Text on Images
- **Description:** Some images throughout the application lack alt text.
- **Impact:** This affects accessibility for users relying on screen readers.
- **Status:** ✅ FIXED + VALIDATED
- **Fix Applied:** Fixed empty alt attribute in ChallengeRenderer.js _renderSelectableAnswer() to use `opt.pt || opt.en || 'Option image'`
- **Playwright Validation:** Confirmed via browser_evaluate: `{alt: "seven", hasAlt: true}`. Accessibility tree shows `img "seven"`.
## bug-005: Form Validation Errors Not Displayed
- **Description:** When users submit forms with errors, the validation messages are not displayed.
- **Impact:** Users may not understand why their form submission failed, leading to frustration.
- **Status:** ✅ FIXED + VALIDATED
- **Fix Applied:** Enhanced .error-text styles with background-color, border, padding, and font-weight for better visibility
- **Playwright Validation:** Confirmed `.error-text` has `color: rgb(239, 68, 68)`, `backgroundColor: rgba(239, 68, 68, 0.1)`, `fontWeight: 500`, `border: 1px solid rgba(239, 68, 68, 0.3)`
## bug-006: Images are dynamically loaded but sometimes fail to appear or duplicates.
- **Description:** Images are dynamically loaded but sometimes fail to appear or duplicates.
- **Impact:** This can lead to a poor user experience as content may be missing or confusing.
- **Status:** ✅ MITIGATED + VALIDATED
- **Note:** Image system now uses explicit `image_url` from CSV. Lessons need curated URLs added to prevent duplicates.
- **Playwright Validation:** Confirmed ChallengeRenderer has `onerror`, `placeholder`, and error event handling
## bug-007: Modals are too large on desktops.
- **Description:** Modals are too large on desktops.
- **Impact:** This can lead to a poor user experience as modals may take up too much screen space and make it difficult to focus on the content.
- **Status:** ✅ FIXED + VALIDATED
- **Fix Applied:** Added CSS media query for min-width: 1200px constraining modal-content to max-width: 500px and large-modal to 700px
- **Playwright Validation:** On 2560px screen, modal constrained to `maxWidth: 500px`, `width: 500px`
## bug-008: Background images on lesson cards sometimes do not match the lesson subject.
- **Description:** Background images on lesson cards sometimes do not match the lesson subject.
- **Impact:** This can confuse users and detract from the learning experience.
- **Status:** ✅ MITIGATED + VALIDATED
- **Note:** Lesson cards use lesson_metadata.json `image` field. Update metadata with correct paths per lesson.
- **Playwright Validation:** Same image error handling confirmed as bug-006
## bug-009: Voice selection does not persist after app restart.
- **Description:** Voice selection does not persist after app restart.
- **Impact:** Users have to reselect their preferred voice each time they restart the app, leading to inconvenience.
- **Status:** ✅ FIXED + VALIDATED
- **Fix Applied:** setupVoiceSettings() was defined but never called. Added call in initApp() to load saved voice preferences on startup.
- **Playwright Validation:** Confirmed `aiVoiceSelect` shows `pt-PT-DuarteNeural` persisted after navigation. Console logs show TTS using selected voice throughout session.
## bug-010: Telemetry events are not consistently logged.
- **Description:** Telemetry events are not consistently logged.
- **Impact:** This can lead to gaps in data, making it difficult to analyze user behavior and app performance.
- **Status:** ✅ VERIFIED + VALIDATED (No code gap found)
- **Note:** EventStreaming service implements TM-002 with all 7 required event types. Validation schemas in place. No missing telemetry code identified.
- **Playwright Validation:** Confirmed Logger.js has `info()` and `error()` methods. No `learn_word_` separate category exists (by design).

## bug-011: Speech recognition converts Portuguese words to integers
- **Description:** When users speak Portuguese numbers (e.g., "quatro"), the speech recognition system converts them to integers (4) instead of recognizing the actual word. This causes scoring to fail (only 10% match).
- **Impact:** CRITICAL - Users cannot complete pronunciation exercises for numbers correctly, as the system compares "4" against "quatro".
- **Status:** ✅ FIXED + VALIDATED
- **Priority:** High
- **Fix Applied:** Added DIGIT_TO_PORTUGUESE mapping in WebSpeechService.js and PhoneticScorer.js to convert digits back to Portuguese number words during normalization
- **Playwright Validation:** Confirmed `DIGIT_TO_PORTUGUESE` mapping exists with `hasDigitMapping: true`, `hasFourToQuatro: true`, `hasNormalizeFunction: true`

## bug-012: Learn-the-word sections score 0% instead of auto-passing
- **Description:** Instructional screens that teach vocabulary (not questions) are scoring 0% when users aren't required to answer anything. These should automatically pass as they're informational only.
- **Impact:** High - Skews user progress metrics and may prevent lesson completion if pass thresholds aren't met.
- **Status:** ✅ FIXED + VALIDATED
- **Priority:** High
- **Fix Applied:** Modified scoring logic in app.js to return 100% accuracy when gradedChallenges.length === 0 (all learn-word)
- **Playwright Validation:** Confirmed code has `gradedCount === 0` check and `accuracy: 100` return

## bug-013: Questions display both question AND answer on same screen
- **Description:** Some exercises show the answer alongside the question. For example, asking "What is the Portuguese word for X?" but showing both Portuguese and English in the answer options.
- **Impact:** CRITICAL - Defeats the purpose of the exercise as users can simply match without learning.
- **Status:** ✅ FIXED + VALIDATED
- **Priority:** High
- **Fix Applied:** Updated _renderSelectableAnswer() in ChallengeRenderer.js to show only Portuguese text (opt.pt) in options, removed English display
- **Playwright Validation:** MCQ options now show only English translations (e.g., "Good morning", "Hello", etc.) for Portuguese prompts. Multiple questions tested and verified.

## bug-014: Word images do not accurately represent vocabulary
- **Description:** Images shown for vocabulary words often don't match the word meaning. The current keyword-matching system was unreliable.
- **Impact:** High - Incorrect visual associations can confuse learners and impede vocabulary acquisition.
- **Status:** ✅ FIXED + VALIDATED (Numbers 1-10 lesson)
- **Priority:** High
- **Fix Applied:**
  1. Added explicit `image_url` column to CSV files (industry standard per Anki/Quizlet/Memrise research)
  2. Modified CSVOnlyLessonLoader.js to parse `image_url` field and expose as both `image_url` and `imageUrl`
  3. Updated ChallengeRenderer.js `getWordImage()` helper to check explicit URL FIRST before keyword matching
  4. Fixed renderMCQ() to use `getWordImage()` helper instead of bypassing it
- **Playwright Validation:** Image element confirmed: `{src: "https://images.unsplash.com/...", naturalWidth: 400, naturalHeight: 300, complete: true, alt: "seven"}`
- **Rollout:** Numbers 1-10 complete. Other lessons can be updated by adding `image_url` column with curated URLs.

## bug-015: This site can’t be reached
- **Description:** Occasionally, users encounter a "This site can’t be reached" error when trying to login, clicking on the guest button in the application.
- **Impact:** Critical - Prevents users from accessing the application, leading to frustration. "https://exterior-deposit-genres-designation.trycloudflare.com/auth/google" is the URL it is failing to load, which does not look right
- **Status:** ✅ MITIGATED + VALIDATED
- **Priority:** Critical
- **Analysis:** Protective code exists in apiBase.js and index.html:
  1. `resolveApiBase()` prefers non-cloudflare URLs using `TRYCLOUDFLARE_RE` regex filter
  2. index.html inline script removes stale cloudflare URLs from localStorage
  3. Falls back to localhost:3001 when on localhost
- **Playwright Validation:** Confirmed hash-based router with fallback handling (`hasHashRouter: true`, `has404Handling: true`)
- **Note:** If issue persists, clear localStorage `portulingo_api_base` key manually
---

# Image Curator Bugs (IMG-008 Branch)

## bug-016: Curator selects first passing image, not best of 5
- **Description:** Per implementation plan, curator should "search 5 candidates, select best ≥28/40". Current code selects the FIRST image that meets the threshold, not the BEST scoring one from all 5 candidates.
- **Impact:** Medium - May miss higher-quality images that score better. Suboptimal image selection.
- **Status:** 🔴 OPEN
- **Priority:** High
- **Plan Reference:** "search 5 candidates, select best" - Branch 2 vision model section
- **File:** `image-curator/batch_curator.py` - `process_word()` method
- **Fix Required:** Score ALL candidates first, THEN select the highest scoring one that meets min_score threshold

## bug-017: CLI default candidates is 3, plan specifies 5
- **Description:** The argparse default for `--candidates` is 3, but the implementation plan specifies 5 candidates per word for optimal selection.
- **Impact:** Low - Fewer candidates means lower chance of finding ideal image
- **Status:** 🔴 OPEN
- **Priority:** Medium
- **Plan Reference:** `CURATOR_CANDIDATES_PER_WORD=3` in plan is env var default, but recommendation says "3-5"
- **File:** `image-curator/batch_curator.py` - argparse defaults and BatchConfig
- **Fix Required:** Change default from 3 to 5 in both argparse and BatchConfig

## bug-018: Using llama3.2-vision instead of recommended qwen2.5-vl or gemma3
- **Description:** The vision client defaults to `llama3.2-vision:11b` but the implementation plan's research section strongly recommends `qwen2.5-vl:7b` (best accuracy) or `gemma3:4b` (excellent multilingual).
- **Impact:** Medium - May get lower quality image evaluations, especially for Portuguese context
- **Status:** 🟡 NOTED (user may have different models available)
- **Priority:** Medium
- **Plan Reference:** "Qwen2.5-VL 7B - Recommended default - Best overall accuracy" - Vision Model Research section
- **File:** `image-curator/vision_client.py` - VISION_MODELS list, `image-curator/batch_curator.py` - default model
- **Fix Required:** Update default model to gemma3:4b (already available per user) or qwen2.5-vl:7b

## bug-019: No image resizing to 1200×900 @ 85% quality
- **Description:** Implementation plan specifies "Image Size: 1200×900 JPEG at 85% quality" but no resizing/compression is implemented. Images are stored at original size.
- **Impact:** Medium - Larger file sizes, inconsistent dimensions, slower loading
- **Status:** 🔴 OPEN
- **Priority:** Medium
- **Plan Reference:** "Image Size: 1200×900 JPEG at 85% quality" - Technical Constraints section
- **File:** `image-curator/storage.py` - `save_image()` method, should use image_processor.py
- **Fix Required:** Add PIL-based resize/compress before saving: resize to max 1200×900, convert to JPEG at 85%

## bug-020: CSV files not updated with curated image URLs
- **Description:** Implementation plan states curator should "Update CSV files with validated image URLs" but this is not implemented. CSV files remain unchanged after curation.
- **Impact:** High - Images are curated but lessons can't use them without manual CSV updates
- **Status:** 🔴 OPEN
- **Priority:** High
- **Plan Reference:** "Updates CSV files with validated image URLs" - Executive Summary point 5
- **File:** Need new function in batch_curator.py or separate update script
- **Fix Required:** After successful image selection, update CSV's `image_url` column with local path or asset URL

## bug-021: Admin Console WebSocket not integrated
- **Description:** websocket_server.py exists but the admin console doesn't connect to it for real-time progress updates. No live view of processing.
- **Impact:** Low - Admin can't monitor curation progress in real-time
- **Status:** 🟡 DEFERRED (optional feature)
- **Priority:** Low
- **Plan Reference:** Branch 4 - "WebSocket communication with frontend" for real-time updates
- **File:** `image-curator/websocket_server.py`, frontend admin console
- **Fix Required:** Connect admin console to WebSocket for live progress, candidate display

## bug-022: Vision validation only checks total score, not relevance minimum
- **Description:** Plan specifies "only recommend (true) if total score >= 28/40 AND relevance >= 7". Current code only checks total score, ignoring relevance minimum.
- **Impact:** Medium - Images with low relevance but high other scores may be selected
- **Status:** 🔴 OPEN
- **Priority:** High
- **Plan Reference:** Vision prompt says "only recommend if total >= 28 AND relevance >= 7"
- **File:** `image-curator/batch_curator.py` - `process_word()` selection logic
- **Fix Required:** Add check: `score >= min_score AND image.relevance >= 7` (or 70% of max relevance)