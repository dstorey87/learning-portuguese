bug-001 - The modals are not designed to ensure we can always see the text, the background is too similar to the text colour.
# Known Bugs
## bug-001: Modal Text Visibility Issue
- **Description:** The modals are not designed to ensure we can always see the text,
    the background is too similar to the text colour.
- **Impact:** Users may struggle to read modal content, leading to confusion.
- **Status:** Open
- **Proposed Fix:** Redesign modal styles to enhance text visibility by increasing contrast between text and background.
## bug-002: Inconsistent Button Styles
- **Description:** Buttons across different pages have inconsistent styles (colors, sizes, fonts).
- **Impact:** This inconsistency can confuse users and detract from the overall user experience.
- **Status:** Open  
- **Proposed Fix:** Standardize button styles across the application according to the design system.
## bug-003: Slow Load Times on Dashboard
- **Description:** The admin dashboard takes too long to load, especially with large datasets.
- **Impact:** Slow load times can frustrate users and reduce productivity.
- **Status:** Open
- **Proposed Fix:** Optimize data fetching and rendering processes to improve load times.
## bug-004: Missing Alt Text on Images
- **Description:** Some images throughout the application lack alt text.
- **Impact:** This affects accessibility for users relying on screen readers.
- **Status:** Open
- **Proposed Fix:** Audit all images and add appropriate alt text to enhance accessibility.
## bug-005: Form Validation Errors Not Displayed
- **Description:** When users submit forms with errors, the validation messages are not displayed.
- **Impact:** Users may not understand why their form submission failed, leading to frustration.
- **Status:** Open
- **Proposed Fix:** Implement proper error handling to display validation messages clearly to users.
## bug-006: Images are dynamically loaded but sometimes fail to appear or duplicates.
- **Description:** Images are dynamically loaded but sometimes fail to appear or duplicates.
- **Impact:** This can lead to a poor user experience as content may be missing or confusing.
- **Status:** Open
- **Proposed Fix:** Investigate the image loading mechanism and implement error handling to ensure images load correctly without duplication.
## bug-007: Modals are too large on desktops.
- **Description:** Modals are too large on desktops.
- **Impact:** This can lead to a poor user experience as modals may take up too much screen space and make it difficult to focus on the content.
- **Status:** Open
- **Proposed Fix:** Adjust modal sizing to be more responsive and appropriate for desktop screens.
## bug-008: Background images on lesson cards sometimes do not match the lesson subject.
- **Description:** Background images on lesson cards sometimes do not match the lesson subject.
- **Impact:** This can confuse users and detract from the learning experience.
- **Status:** Open
- **Proposed Fix:** Review the image assignment logic and ensure that lesson cards consistently display subject-matched images.
## bug-009: Voice selection does not persist after app restart.
- **Description:** Voice selection does not persist after app restart.
- **Impact:** Users have to reselect their preferred voice each time they restart the app, leading to inconvenience.
- **Status:** Open
- **Proposed Fix:** Implement persistent storage for voice selection settings to retain user preferences across sessions.
## bug-010: Telemetry events are not consistently logged.
- **Description:** Telemetry events are not consistently logged.
- **Impact:** This can lead to gaps in data, making it difficult to analyze user behavior and app performance.
- **Status:** Open
- **Proposed Fix:** Review and enhance the telemetry logging mechanism to ensure all relevant events are captured consistently.


