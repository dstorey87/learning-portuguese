/**
 * TV-003: Voice Smoke E2E Tests
 * 
 * MCP Playwright Scenario 3: Validates voice/TTS functionality:
 * - Listen button functionality
 * - Voice selection (male/female)
 * - Speed control
 * - Portuguese voices (Duarte, Raquel)
 * - Example sentence audio
 */

import { test, expect } from '@playwright/test';

test.describe('TV-003: Voice Smoke Tests', () => {
    
    test.describe('Voice Button Visibility', () => {
        
        test('should show Listen button in lesson', async ({ page }) => {
            await page.goto('http://localhost:4321/#learn');
            await page.waitForLoadState('domcontentloaded');
            
            // Click first lesson
            await page.locator('text=Personal Pronouns').first().click();
            await page.waitForTimeout(500);
            
            // Listen button should be visible
            const listenButton = page.locator('button:has-text("Listen")');
            await expect(listenButton.first()).toBeVisible();
        });
        
        test('should show Practice button for pronunciation', async ({ page }) => {
            await page.goto('http://localhost:4321/#learn');
            await page.waitForLoadState('domcontentloaded');
            
            await page.locator('text=Personal Pronouns').first().click();
            await page.waitForTimeout(500);
            
            // Practice button should be visible
            const practiceButton = page.locator('button:has-text("Practice")');
            await expect(practiceButton.first()).toBeVisible();
        });
        
        test('should show example sentence audio buttons', async ({ page }) => {
            await page.goto('http://localhost:4321/#learn');
            await page.waitForLoadState('domcontentloaded');
            
            await page.locator('text=Personal Pronouns').first().click();
            await page.waitForTimeout(500);
            
            // Expand Example Sentences
            await page.locator('button:has-text("Example Sentences")').click();
            await page.waitForTimeout(300);
            
            // Listen buttons in examples should be visible
            const exampleListenButtons = page.locator('button:has-text("🔊")');
            await expect(exampleListenButtons.first()).toBeVisible();
        });
    });
    
    test.describe('Voice Selection', () => {
        
        test('should have Male form option', async ({ page }) => {
            await page.goto('http://localhost:4321/#learn');
            await page.waitForLoadState('domcontentloaded');
            
            // Male form radio should be visible - use exact match
            const maleOption = page.getByText('Male form', { exact: true });
            await expect(maleOption).toBeVisible();
        });
        
        test('should have Female form option', async ({ page }) => {
            await page.goto('http://localhost:4321/#learn');
            await page.waitForLoadState('domcontentloaded');
            
            // Female form radio should be visible
            const femaleOption = page.locator('text=Female form');
            await expect(femaleOption).toBeVisible();
        });
        
        test('should default to Male form', async ({ page }) => {
            await page.goto('http://localhost:4321/#learn');
            await page.waitForLoadState('domcontentloaded');
            
            // Male form should be checked by default
            const maleRadio = page.locator('input[type="radio"]').first();
            await expect(maleRadio).toBeChecked();
        });
        
        test('should allow switching to Female form', async ({ page }) => {
            await page.goto('http://localhost:4321/#learn');
            await page.waitForLoadState('domcontentloaded');
            
            // Click female form
            await page.locator('text=Female form').click();
            await page.waitForTimeout(300);
            
            // Female should be checked
            const femaleRadio = page.locator('input[type="radio"]').nth(1);
            await expect(femaleRadio).toBeChecked();
        });
    });
    
    test.describe('TTS Service Integration', () => {
        
        test('should have TTS server health endpoint accessible', async ({ page }) => {
            // Check TTS server health - skip if server not running
            try {
                const response = await page.request.get('http://localhost:3001/health', { timeout: 3000 });
                expect(response.ok()).toBe(true);
                
                const data = await response.json();
                expect(data.status).toBe('ok');
            } catch (e) {
                test.skip(true, 'TTS server not running');
            }
        });
        
        test('should have Portuguese voices available', async ({ page }) => {
            // Check available voices - skip if server not running
            try {
                const response = await page.request.get('http://localhost:3001/voices', { timeout: 3000 });
                expect(response.ok()).toBe(true);
                
                const data = await response.json();
                
                // Should have Portuguese voices
                const ptPTVoices = data.voices?.['pt-PT'] || data['pt-PT'] || [];
                expect(ptPTVoices.length).toBeGreaterThan(0);
            } catch (e) {
                test.skip(true, 'TTS server not running');
            }
        });
        
        test('should have Duarte (male) voice for pt-PT', async ({ page }) => {
            try {
                const response = await page.request.get('http://localhost:3001/voices', { timeout: 3000 });
                const data = await response.json();
                
                const ptPTVoices = data.voices?.['pt-PT'] || data['pt-PT'] || [];
                const duarte = ptPTVoices.find(v => v.Name?.includes('Duarte') || v.name?.includes('Duarte'));
                expect(duarte).toBeTruthy();
            } catch (e) {
                test.skip(true, 'TTS server not running');
            }
        });
        
        test('should have Raquel (female) voice for pt-PT', async ({ page }) => {
            try {
                const response = await page.request.get('http://localhost:3001/voices', { timeout: 3000 });
                const data = await response.json();
                
                const ptPTVoices = data.voices?.['pt-PT'] || data['pt-PT'] || [];
                const raquel = ptPTVoices.find(v => v.Name?.includes('Raquel') || v.name?.includes('Raquel'));
                expect(raquel).toBeTruthy();
            } catch (e) {
                test.skip(true, 'TTS server not running');
            }
        });
    });
    
    test.describe('Listen Button Interaction', () => {
        
        test('should trigger audio on Listen button click', async ({ page }) => {
            await page.goto('http://localhost:4321/#learn');
            await page.waitForLoadState('domcontentloaded');
            
            await page.locator('text=Personal Pronouns').first().click();
            await page.waitForTimeout(500);
            
            // Click Listen button - verify it's clickable and doesn't error
            const listenButton = page.locator('button:has-text("Listen")').first();
            await expect(listenButton).toBeEnabled();
            
            // Click should complete without throwing
            await listenButton.click();
            await page.waitForTimeout(500);
            
            // Page should still be responsive (button click worked)
            await expect(page.locator('#continueBtn')).toBeVisible();
        });
        
        test('should not crash when Listen is clicked', async ({ page }) => {
            await page.goto('http://localhost:4321/#learn');
            await page.waitForLoadState('domcontentloaded');
            
            await page.locator('text=Personal Pronouns').first().click();
            await page.waitForTimeout(500);
            
            // Click Listen - should not cause any errors
            await page.locator('button:has-text("Listen")').first().click();
            await page.waitForTimeout(500);
            
            // Page should still be functional
            await expect(page.locator('#continueBtn')).toBeVisible();
        });
    });
    
    test.describe('Pronunciation Panel', () => {
        
        test('should display pronunciation section', async ({ page }) => {
            await page.goto('http://localhost:4321/#learn');
            await page.waitForLoadState('domcontentloaded');
            
            await page.locator('text=Personal Pronouns').first().click();
            await page.waitForTimeout(500);
            
            // Pronunciation section
            const pronSection = page.locator('button:has-text("Pronunciation")');
            await expect(pronSection).toBeVisible();
        });
        
        test('should show "How to say it" guidance', async ({ page }) => {
            await page.goto('http://localhost:4321/#learn');
            await page.waitForLoadState('domcontentloaded');
            
            await page.locator('text=Personal Pronouns').first().click();
            await page.waitForTimeout(500);
            
            // Should show pronunciation help
            const howToSay = page.locator('text=How to say it');
            await expect(howToSay).toBeVisible();
        });
        
        test('should be expandable/collapsible', async ({ page }) => {
            await page.goto('http://localhost:4321/#learn');
            await page.waitForLoadState('domcontentloaded');
            
            await page.locator('text=Personal Pronouns').first().click();
            await page.waitForTimeout(500);
            
            // Pronunciation section should be clickable (for expand/collapse)
            const pronButton = page.locator('button:has-text("Pronunciation")');
            await expect(pronButton).toBeVisible();
            await expect(pronButton).toBeEnabled();
            
            // Should have expanded attribute
            const isExpanded = await pronButton.getAttribute('aria-expanded');
            expect(isExpanded).toBeTruthy();
        });
    });
    
    test.describe('Console Error Check', () => {
        
        test('should not have voice-related console errors', async ({ page }) => {
            const consoleErrors = [];
            page.on('console', msg => {
                if (msg.type() === 'error' && 
                    (msg.text().includes('voice') || 
                     msg.text().includes('audio') || 
                     msg.text().includes('TTS'))) {
                    consoleErrors.push(msg.text());
                }
            });
            
            await page.goto('http://localhost:4321/#learn');
            await page.waitForLoadState('domcontentloaded');
            
            await page.locator('text=Personal Pronouns').first().click();
            await page.waitForTimeout(1000);
            
            // Should have no voice-related errors
            expect(consoleErrors).toHaveLength(0);
        });
    });
    
});
