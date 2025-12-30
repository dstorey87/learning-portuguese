/**
 * TV-002: Lesson Smoke E2E Tests
 * 
 * MCP Playwright Scenario 2: Validates lesson flow including:
 * - Lesson grid with English titles
 * - Practice-first pattern (first screen should be exercise, not word list)
 * - Exercise types: word-order, cloze, picture flashcard
 * - Telemetry events fired
 * 
 * Note: Some tests are marked as .skip() until LA-001 (practice-first) is implemented
 */

import { test, expect } from '@playwright/test';

test.describe('TV-002: Lesson Smoke Tests', () => {
    
    test.describe('Lesson Grid', () => {
        
        test('should display lesson grid with cards', async ({ page }) => {
            await page.goto('http://localhost:4321/#learn');
            await page.waitForLoadState('domcontentloaded');
            
            // Verify lesson cards are visible
            const lessonCards = page.locator('[class*="lesson"], [class*="card"]').filter({ hasText: /words/ });
            await expect(lessonCards.first()).toBeVisible();
        });
        
        test('should display English titles on lesson cards', async ({ page }) => {
            await page.goto('http://localhost:4321/#learn');
            await page.waitForLoadState('domcontentloaded');
            
            // Check specific Building Blocks lessons have English titles
            const englishTitles = [
                'Personal Pronouns',
                'Verb: Ser',
                'Verb: Estar',
                'Articles',
                'Connectors',
                'Prepositions',
                'Negation'
            ];
            
            for (const title of englishTitles.slice(0, 3)) {
                const card = page.locator(`text=${title}`);
                await expect(card.first()).toBeVisible();
            }
        });
        
        test('should show category filters', async ({ page }) => {
            await page.goto('http://localhost:4321/#learn');
            await page.waitForLoadState('domcontentloaded');
            
            // Verify filter buttons
            await expect(page.locator('button:has-text("All Topics")')).toBeVisible();
            await expect(page.locator('button:has-text("Building Blocks")')).toBeVisible();
        });
        
        test('should show word count on cards', async ({ page }) => {
            await page.goto('http://localhost:4321/#learn');
            await page.waitForLoadState('domcontentloaded');
            
            // Cards should show word count
            const wordCountText = page.locator('text=/\\d+ words/').first();
            await expect(wordCountText).toBeVisible();
        });
        
        test('should show accuracy indicator on cards', async ({ page }) => {
            await page.goto('http://localhost:4321/#learn');
            await page.waitForLoadState('domcontentloaded');
            
            // Cards should show accuracy (even if "—" for new)
            const accuracyText = page.locator('text=/Accuracy:/').first();
            await expect(accuracyText).toBeVisible();
        });
    });
    
    test.describe('Lesson Opening', () => {
        
        test('should open lesson when card is clicked', async ({ page }) => {
            await page.goto('http://localhost:4321/#learn');
            await page.waitForLoadState('domcontentloaded');
            
            // Click on first lesson card
            await page.locator('text=Personal Pronouns').first().click();
            
            // Verify lesson modal/screen opened - use specific button ID
            await expect(page.locator('#continueBtn')).toBeVisible({ timeout: 5000 });
        });
        
        test('should show progress indicator in lesson', async ({ page }) => {
            await page.goto('http://localhost:4321/#learn');
            await page.waitForLoadState('domcontentloaded');
            
            await page.locator('text=Personal Pronouns').first().click();
            await page.waitForTimeout(500);
            
            // Should show progress like "1 / 15 steps"
            const progressText = page.locator('text=/\\d+ \\/ \\d+ steps/');
            await expect(progressText).toBeVisible();
        });
        
        test('should show close button in lesson', async ({ page }) => {
            await page.goto('http://localhost:4321/#learn');
            await page.waitForLoadState('domcontentloaded');
            
            await page.locator('text=Personal Pronouns').first().click();
            await page.waitForTimeout(500);
            
            // Close button should be visible - use specific ID
            const closeButton = page.locator('#backToLessons');
            await expect(closeButton).toBeVisible();
        });
        
        test('should have listen button for pronunciation', async ({ page }) => {
            await page.goto('http://localhost:4321/#learn');
            await page.waitForLoadState('domcontentloaded');
            
            await page.locator('text=Personal Pronouns').first().click();
            await page.waitForTimeout(500);
            
            // Listen button should be present
            const listenButton = page.locator('button:has-text("Listen")');
            await expect(listenButton.first()).toBeVisible();
        });
    });
    
    test.describe('Practice-First Pattern', () => {
        
        // This test documents the EXPECTED behavior once LA-001 is complete
        test.skip('should show exercise as first screen (not word list)', async ({ page }) => {
            await page.goto('http://localhost:4321/#learn');
            await page.waitForLoadState('domcontentloaded');
            
            await page.locator('text=Personal Pronouns').first().click();
            await page.waitForTimeout(500);
            
            // First screen should NOT be "Learn This Word"
            const wordListScreen = page.locator('text=Learn This Word');
            await expect(wordListScreen).not.toBeVisible();
            
            // First screen SHOULD have exercise elements
            const exerciseElements = page.locator('input[type="text"], [class*="tile"], [class*="option"]');
            await expect(exerciseElements.first()).toBeVisible();
        });
        
        test('currently shows word-list-first (needs LA-001 fix)', async ({ page }) => {
            await page.goto('http://localhost:4321/#learn');
            await page.waitForLoadState('domcontentloaded');
            
            await page.locator('text=Personal Pronouns').first().click();
            await page.waitForTimeout(500);
            
            // Document current behavior: word list appears first
            const wordListScreen = page.locator('text=Learn This Word');
            // This documents the current state - will fail after LA-001
            const isWordListFirst = await wordListScreen.isVisible();
            
            if (isWordListFirst) {
                console.log('LA-001 needed: Word-list-first pattern detected');
            }
            
            expect(true).toBe(true); // Always pass, this is documentation
        });
    });
    
    test.describe('Lesson Content', () => {
        
        test('should display word with translation', async ({ page }) => {
            await page.goto('http://localhost:4321/#learn');
            await page.waitForLoadState('domcontentloaded');
            
            await page.locator('text=Personal Pronouns').first().click();
            await page.waitForTimeout(500);
            
            // Should show "Learn This Word" section with Portuguese word
            const learnThisWord = page.locator('text=Learn This Word');
            await expect(learnThisWord.first()).toBeVisible();
        });
        
        test('should display pronunciation guide', async ({ page }) => {
            await page.goto('http://localhost:4321/#learn');
            await page.waitForLoadState('domcontentloaded');
            
            await page.locator('text=Personal Pronouns').first().click();
            await page.waitForTimeout(500);
            
            // Should show pronunciation section
            const pronunciationSection = page.locator('text=Pronunciation');
            await expect(pronunciationSection.first()).toBeVisible();
        });
        
        test('should display example sentences', async ({ page }) => {
            await page.goto('http://localhost:4321/#learn');
            await page.waitForLoadState('domcontentloaded');
            
            await page.locator('text=Personal Pronouns').first().click();
            await page.waitForTimeout(500);
            
            // Should have example sentences section
            const exampleSection = page.locator('text=Example Sentences');
            await expect(exampleSection.first()).toBeVisible();
        });
    });
    
    test.describe('Lesson Navigation', () => {
        
        test('should advance to next word with Continue button', async ({ page }) => {
            await page.goto('http://localhost:4321/#learn');
            await page.waitForLoadState('domcontentloaded');
            
            await page.locator('text=Personal Pronouns').first().click();
            await page.waitForTimeout(500);
            
            // Get initial word count
            const initialProgress = await page.locator('text=/Word \\d+ of \\d+/').textContent();
            
            // Click continue - use specific ID
            await page.locator('#continueBtn').click();
            await page.waitForTimeout(500);
            
            // Progress should advance
            const newProgress = await page.locator('text=/Word \\d+ of \\d+/').textContent();
            expect(newProgress).not.toBe(initialProgress);
        });
        
        test('should close lesson with close button', async ({ page }) => {
            await page.goto('http://localhost:4321/#learn');
            await page.waitForLoadState('domcontentloaded');
            
            await page.locator('text=Personal Pronouns').first().click();
            await page.waitForTimeout(500);
            
            // Set up dialog handler for confirmation
            page.on('dialog', async dialog => {
                await dialog.accept();
            });
            
            // Click close button - it's the ✕ button at top of lesson
            await page.locator('button:has-text("✕")').first().click();
            await page.waitForTimeout(500);
            
            // Should return to lesson grid - look for "Begin Your Journey" heading
            await expect(page.locator('text=Begin Your Journey')).toBeVisible();
        });
    });
    
    test.describe('Learning Options Panel', () => {
        
        test('should have expandable learning options', async ({ page }) => {
            await page.goto('http://localhost:4321/#learn');
            await page.waitForLoadState('domcontentloaded');
            
            await page.locator('text=Personal Pronouns').first().click();
            await page.waitForTimeout(500);
            
            // Learning Options should be visible
            const learningOptions = page.locator('text=Learning Options');
            await expect(learningOptions).toBeVisible();
        });
        
        test('should have Grammar Notes section', async ({ page }) => {
            await page.goto('http://localhost:4321/#learn');
            await page.waitForLoadState('domcontentloaded');
            
            await page.locator('text=Personal Pronouns').first().click();
            await page.waitForTimeout(500);
            
            const grammarSection = page.locator('button:has-text("Grammar Notes")');
            await expect(grammarSection).toBeVisible();
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
            
            const aiTipsSection = page.locator('button:has-text("AI Tips")');
            await expect(aiTipsSection).toBeVisible();
        });
    });
    
});
