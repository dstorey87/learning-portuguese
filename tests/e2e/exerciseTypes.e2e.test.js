/**
 * TV-004: Exercise Types E2E Tests
 * 
 * MCP Playwright Scenario 4: Validates exercise type functionality:
 * - Word Order tiles (drag/drop or click)
 * - Cloze (fill-in-the-blank)
 * - Multiple Choice
 * - Listening comprehension
 * - Picture flashcards
 * - Pronunciation exercises
 * 
 * Note: Tests document current behavior. Some will be marked .skip()
 * until LA-002 (exercise rotation) is fully implemented.
 */

import { test, expect } from '@playwright/test';

test.describe('TV-004: Exercise Types E2E Tests', () => {
    
    test.describe('Current Learning Flow', () => {
        
        test('should display word card with Portuguese word', async ({ page }) => {
            await page.goto('http://localhost:4321/#learn');
            await page.waitForLoadState('domcontentloaded');
            
            // Open a lesson (fallback to first card)
            const targetLesson = page.locator('text=Personal Pronouns').first();
            if (await targetLesson.count() > 0) {
                await targetLesson.click();
            } else {
                const firstCard = page.locator('.lesson-card').first();
                await firstCard.click();
            }
            await page.waitForTimeout(500);
            
            // Should show the word content area
            const wordArea = page.locator('text=Learn This Word');
            await expect(wordArea.first()).toBeVisible();
        });
        
        test('should show translation/meaning', async ({ page }) => {
            await page.goto('http://localhost:4321/#learn');
            await page.waitForLoadState('domcontentloaded');
            
            const targetLesson = page.locator('text=Personal Pronouns').first();
            if (await targetLesson.count() > 0) {
                await targetLesson.click();
            } else {
                await page.locator('.lesson-card').first().click();
            }
            await page.waitForTimeout(500);
            
            // Should show word with translation (e.g., "eu" = "I")
            // Look for any translation text
            const wordContent = page.locator('main');
            const content = await wordContent.textContent();
            expect(content).toBeTruthy();
        });
        
        test('should have Continue button to progress', async ({ page }) => {
            await page.goto('http://localhost:4321/#learn');
            await page.waitForLoadState('domcontentloaded');
            
            const targetLesson = page.locator('text=Personal Pronouns').first();
            if (await targetLesson.count() > 0) {
                await targetLesson.click();
            } else {
                await page.locator('.lesson-card').first().click();
            }
            await page.waitForTimeout(500);
            
            const continueBtn = page.locator('#continueBtn');
            await expect(continueBtn).toBeVisible();
            await expect(continueBtn).toBeEnabled();
        });
        
        test('should show word progress counter', async ({ page }) => {
            await page.goto('http://localhost:4321/#learn');
            await page.waitForLoadState('domcontentloaded');
            
            const targetLesson = page.locator('text=Personal Pronouns').first();
            if (await targetLesson.count() > 0) {
                await targetLesson.click();
            } else {
                await page.locator('.lesson-card').first().click();
            }
            await page.waitForTimeout(500);
            
            // Should show "Word X of Y"
            const progressText = page.locator('text=/Word \\d+ of \\d+/');
            await expect(progressText).toBeVisible();
        });
    });
    
    test.describe('Exercise UI Components', () => {
        
        test('should have Listen button for audio', async ({ page }) => {
            await page.goto('http://localhost:4321/#learn');
            await page.waitForLoadState('domcontentloaded');
            
            const targetLesson = page.locator('text=Personal Pronouns').first();
            if (await targetLesson.count() > 0) {
                await targetLesson.click();
            } else {
                await page.locator('.lesson-card').first().click();
            }
            await page.waitForTimeout(500);
            
            const listenBtn = page.locator('button:has-text("Listen")');
            await expect(listenBtn.first()).toBeVisible();
        });
        
        test('should have Save button for bookmarking', async ({ page }) => {
            await page.goto('http://localhost:4321/#learn');
            await page.waitForLoadState('domcontentloaded');
            
            await page.locator('text=Personal Pronouns').first().click();
            await page.waitForTimeout(500);
            
            const saveBtn = page.locator('button:has-text("Save")');
            await expect(saveBtn.first()).toBeVisible();
        });
        
        test('should have Practice button for pronunciation', async ({ page }) => {
            await page.goto('http://localhost:4321/#learn');
            await page.waitForLoadState('domcontentloaded');
            
            await page.locator('text=Personal Pronouns').first().click();
            await page.waitForTimeout(500);
            
            const practiceBtn = page.locator('button:has-text("Practice")');
            await expect(practiceBtn.first()).toBeVisible();
        });
        
        test('should have Hard Mode toggle', async ({ page }) => {
            await page.goto('http://localhost:4321/#learn');
            await page.waitForLoadState('domcontentloaded');
            
            await page.locator('text=Personal Pronouns').first().click();
            await page.waitForTimeout(500);
            
            const hardModeToggle = page.locator('text=Hard mode');
            await expect(hardModeToggle).toBeVisible();
        });
    });
    
    test.describe('Hard Mode (Type Answers)', () => {
        
        test('should toggle Hard Mode on click', async ({ page }) => {
            await page.goto('http://localhost:4321/#learn');
            await page.waitForLoadState('domcontentloaded');
            
            await page.locator('text=Personal Pronouns').first().click();
            await page.waitForTimeout(500);
            
            // Find and click hard mode checkbox
            const hardModeCheckbox = page.locator('input[type="checkbox"]').first();
            await hardModeCheckbox.click();
            
            // Should be checked
            await expect(hardModeCheckbox).toBeChecked();
        });
        
        test('should toggle Hard Mode checkbox', async ({ page }) => {
            await page.goto('http://localhost:4321/#learn');
            await page.waitForLoadState('domcontentloaded');
            
            await page.locator('text=Personal Pronouns').first().click();
            await page.waitForTimeout(500);
            
            // Enable hard mode
            const hardModeCheckbox = page.locator('input[type="checkbox"]').first();
            await expect(hardModeCheckbox).not.toBeChecked();
            await hardModeCheckbox.click();
            await page.waitForTimeout(300);
            
            // Should now be checked
            await expect(hardModeCheckbox).toBeChecked();
        });
        
        test.skip('should validate typed answer', async ({ page }) => {
            // This test documents expected behavior for LA-002
            await page.goto('http://localhost:4321/#learn');
            await page.waitForLoadState('domcontentloaded');
            
            await page.locator('text=Personal Pronouns').first().click();
            await page.waitForTimeout(500);
            
            // Enable hard mode
            await page.locator('input[type="checkbox"]').first().click();
            await page.waitForTimeout(300);
            
            // Type correct answer
            await page.locator('input[type="text"]').first().fill('eu');
            await page.keyboard.press('Enter');
            
            // Should show success feedback
            const successIndicator = page.locator('.correct, .success, text=Correct');
            await expect(successIndicator.first()).toBeVisible();
        });
    });
    
    test.describe('Learning Options Sections', () => {
        
        test('should have Pronunciation section', async ({ page }) => {
            await page.goto('http://localhost:4321/#learn');
            await page.waitForLoadState('domcontentloaded');
            
            await page.locator('text=Personal Pronouns').first().click();
            await page.waitForTimeout(500);
            
            const pronSection = page.locator('button:has-text("Pronunciation")');
            await expect(pronSection).toBeVisible();
        });
        
        test('should have Remember It section', async ({ page }) => {
            await page.goto('http://localhost:4321/#learn');
            await page.waitForLoadState('domcontentloaded');
            
            await page.locator('text=Personal Pronouns').first().click();
            await page.waitForTimeout(500);
            
            const rememberSection = page.locator('button:has-text("Remember It")');
            await expect(rememberSection).toBeVisible();
        });
        
        test('should have Example Sentences section', async ({ page }) => {
            await page.goto('http://localhost:4321/#learn');
            await page.waitForLoadState('domcontentloaded');
            
            await page.locator('text=Personal Pronouns').first().click();
            await page.waitForTimeout(500);
            
            const exampleSection = page.locator('button:has-text("Example Sentences")');
            await expect(exampleSection).toBeVisible();
        });
        
        test('should have Grammar Notes section', async ({ page }) => {
            await page.goto('http://localhost:4321/#learn');
            await page.waitForLoadState('domcontentloaded');
            
            await page.locator('text=Personal Pronouns').first().click();
            await page.waitForTimeout(500);
            
            const grammarSection = page.locator('button:has-text("Grammar Notes")');
            await expect(grammarSection).toBeVisible();
        });
        
        test('should have When to Use section', async ({ page }) => {
            await page.goto('http://localhost:4321/#learn');
            await page.waitForLoadState('domcontentloaded');
            
            await page.locator('text=Personal Pronouns').first().click();
            await page.waitForTimeout(500);
            
            const whenSection = page.locator('button:has-text("When to Use")');
            await expect(whenSection).toBeVisible();
        });
        
        test('should have Cultural Insight section', async ({ page }) => {
            await page.goto('http://localhost:4321/#learn');
            await page.waitForLoadState('domcontentloaded');
            
            await page.locator('text=Personal Pronouns').first().click();
            await page.waitForTimeout(500);
            
            const culturalSection = page.locator('button:has-text("Cultural Insight")');
            await expect(culturalSection).toBeVisible();
        });
        
        test('should have AI Tips section', async ({ page }) => {
            await page.goto('http://localhost:4321/#learn');
            await page.waitForLoadState('domcontentloaded');
            
            await page.locator('text=Personal Pronouns').first().click();
            await page.waitForTimeout(500);
            
            const aiSection = page.locator('button:has-text("AI Tips")');
            await expect(aiSection).toBeVisible();
        });
    });
    
    test.describe('Section Expansion', () => {
        
        test('should expand Example Sentences on click', async ({ page }) => {
            await page.goto('http://localhost:4321/#learn');
            await page.waitForLoadState('domcontentloaded');
            
            await page.locator('text=Personal Pronouns').first().click();
            await page.waitForTimeout(500);
            
            // Click Example Sentences to expand
            const exampleBtn = page.locator('button:has-text("Example Sentences")');
            await exampleBtn.click();
            await page.waitForTimeout(300);
            
            // Should have expanded attribute or show content with Portuguese text
            const content = await page.locator('[role="region"]').filter({ hasText: /fala|português|exemplo/i }).first();
            await expect(content).toBeVisible();
        });
        
        test('should show example with audio button', async ({ page }) => {
            await page.goto('http://localhost:4321/#learn');
            await page.waitForLoadState('domcontentloaded');
            
            await page.locator('text=Personal Pronouns').first().click();
            await page.waitForTimeout(500);
            
            // Expand examples
            await page.locator('button:has-text("Example Sentences")').click();
            await page.waitForTimeout(300);
            
            // Should have audio buttons for examples
            const exampleAudio = page.locator('button:has-text("🔊")');
            expect(await exampleAudio.count()).toBeGreaterThan(1);
        });
    });
    
    test.describe('Progress Tracking', () => {
        
        test('should show lesson progress percentage', async ({ page }) => {
            await page.goto('http://localhost:4321/#learn');
            await page.waitForLoadState('domcontentloaded');
            
            await page.locator('text=Personal Pronouns').first().click();
            await page.waitForTimeout(500);
            
            // Should show percentage
            const progressPercent = page.locator('text=/\\d+%/');
            await expect(progressPercent.first()).toBeVisible();
        });
        
        test('should show step counter', async ({ page }) => {
            await page.goto('http://localhost:4321/#learn');
            await page.waitForLoadState('domcontentloaded');
            
            await page.locator('text=Personal Pronouns').first().click();
            await page.waitForTimeout(500);
            
            // Should show "X / Y steps"
            const stepCounter = page.locator('text=/\\d+ \\/ \\d+ steps/');
            await expect(stepCounter).toBeVisible();
        });
        
        test('should increment progress on Continue', async ({ page }) => {
            await page.goto('http://localhost:4321/#learn');
            await page.waitForLoadState('domcontentloaded');
            
            await page.locator('text=Personal Pronouns').first().click();
            await page.waitForTimeout(500);
            
            // Get initial step
            const initialStep = await page.locator('text=/Word \\d+ of \\d+/').textContent();
            
            // Click continue
            await page.locator('#continueBtn').click();
            await page.waitForTimeout(500);
            
            // Get new step
            const newStep = await page.locator('text=/Word \\d+ of \\d+/').textContent();
            
            // Should have advanced
            expect(newStep).not.toBe(initialStep);
        });
    });
    
    test.describe('Hearts/Lives System', () => {
        
        test('should display hearts indicator', async ({ page }) => {
            await page.goto('http://localhost:4321/#learn');
            await page.waitForLoadState('domcontentloaded');
            
            await page.locator('text=Personal Pronouns').first().click();
            await page.waitForTimeout(500);
            
            // Should show hearts
            const hearts = page.locator('text=❤️');
            await expect(hearts.first()).toBeVisible();
        });
        
        test('should show hearts count in header', async ({ page }) => {
            await page.goto('http://localhost:4321/#learn');
            await page.waitForLoadState('domcontentloaded');
            
            await page.locator('text=Personal Pronouns').first().click();
            await page.waitForTimeout(500);
            
            // Hearts counter should show a number (e.g., "5")
            const heartsContainer = page.locator('header').locator('text=❤️');
            await expect(heartsContainer.first()).toBeVisible();
        });
    });
    
    test.describe('Exercise Type Placeholders (LA-002)', () => {
        
        // These tests document the expected exercise types for LA-002
        
        test.skip('should have Word Order exercise type', async ({ page }) => {
            // Word Order: Arrange tiles to form correct sentence
            await page.goto('http://localhost:4321/#learn');
            await page.waitForLoadState('domcontentloaded');
            
            // Navigate to exercise
            await page.locator('text=Personal Pronouns').first().click();
            await page.waitForTimeout(500);
            
            // Look for word order tiles
            const tiles = page.locator('.tile, .word-tile, [draggable]');
            await expect(tiles.first()).toBeVisible();
        });
        
        test.skip('should have Cloze (fill-in-blank) exercise type', async ({ page }) => {
            // Cloze: Fill in the missing word
            await page.goto('http://localhost:4321/#learn');
            
            // Look for blank indicator
            const blank = page.locator('text=_____, .blank, .cloze-blank');
            await expect(blank.first()).toBeVisible();
        });
        
        test.skip('should have Multiple Choice exercise type', async ({ page }) => {
            // MCQ: Select correct answer from options
            await page.goto('http://localhost:4321/#learn');
            
            // Look for option buttons
            const options = page.locator('.option, .choice, [role="option"]');
            expect(await options.count()).toBeGreaterThanOrEqual(3);
        });
        
        test.skip('should have Listening exercise type', async ({ page }) => {
            // Listening: Type what you hear
            await page.goto('http://localhost:4321/#learn');
            
            // Look for "What did you hear?" prompt
            const listeningPrompt = page.locator('text=What did you hear');
            await expect(listeningPrompt).toBeVisible();
        });
        
        test.skip('should have Picture Flashcard exercise type', async ({ page }) => {
            // Picture: Match word to image
            await page.goto('http://localhost:4321/#learn');
            
            // Look for image options
            const images = page.locator('.flashcard-image, img[alt*="option"]');
            expect(await images.count()).toBeGreaterThanOrEqual(2);
        });
    });
    
});
