/**
 * TV-001: App Load & Render E2E Tests
 * 
 * MCP Playwright Scenario 1: Validates that the app loads correctly
 * and all main UI elements are visible without errors.
 * 
 * Pass Criteria:
 * - Page renders without errors
 * - Main navigation visible
 * - No console errors
 */

import { test, expect } from '@playwright/test';

test.describe('TV-001: App Load & Render', () => {
    
    test('should load the app without errors', async ({ page }) => {
        // Collect console errors
        const consoleErrors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text());
            }
        });
        
        // Navigate to the app
        await page.goto('http://localhost:4321');
        
        // Wait for page to be fully loaded
        await page.waitForLoadState('domcontentloaded');
        
        // Verify page title
        const title = await page.title();
        expect(title).toContain('Portuguese');
        
        // Verify no console errors
        expect(consoleErrors).toHaveLength(0);
    });
    
    test('should display main navigation', async ({ page }) => {
        await page.goto('http://localhost:4321');
        await page.waitForLoadState('domcontentloaded');
        
        // Verify navigation is visible
        const nav = page.locator('nav');
        await expect(nav).toBeVisible();
        
        // Verify navigation buttons
        const homeButton = page.locator('nav button:has-text("Home")');
        const learnButton = page.locator('nav button:has-text("Learn")');
        const practiceButton = page.locator('nav button:has-text("Practice")');
        const profileButton = page.locator('nav button:has-text("Profile")');
        
        await expect(homeButton).toBeVisible();
        await expect(learnButton).toBeVisible();
        await expect(practiceButton).toBeVisible();
        await expect(profileButton).toBeVisible();
    });
    
    test('should display header with user info', async ({ page }) => {
        await page.goto('http://localhost:4321');
        await page.waitForLoadState('domcontentloaded');
        
        // Verify header/banner is visible
        const header = page.locator('[role="banner"], header');
        await expect(header).toBeVisible();
        
        // Verify user info section
        const guestButton = page.locator('button:has-text("Guest")');
        await expect(guestButton).toBeVisible();
    });
    
    test('should display main content area', async ({ page }) => {
        await page.goto('http://localhost:4321');
        await page.waitForLoadState('domcontentloaded');
        
        // Verify main content
        const main = page.locator('main');
        await expect(main).toBeVisible();
        
        // Verify heading
        const heading = page.locator('h1');
        await expect(heading).toBeVisible();
        await expect(heading).toContainText('Portuguese');
    });
    
    test('should display call-to-action button', async ({ page }) => {
        await page.goto('http://localhost:4321');
        await page.waitForLoadState('domcontentloaded');
        
        // Verify CTA button
        const ctaButton = page.locator('button:has-text("Start Learning")');
        await expect(ctaButton).toBeVisible();
    });
    
    test('should display version info in footer', async ({ page }) => {
        await page.goto('http://localhost:4321');
        await page.waitForLoadState('domcontentloaded');
        
        // Verify version is displayed
        const versionText = page.locator('text=v0.9.0');
        await expect(versionText).toBeVisible();
    });
    
    test('should have functional theme toggle', async ({ page }) => {
        await page.goto('http://localhost:4321');
        await page.waitForLoadState('domcontentloaded');
        
        // Verify theme toggle button
        const themeToggle = page.locator('button:has-text("🌙"), button:has-text("☀️")');
        await expect(themeToggle).toBeVisible();
    });
    
    test('should display stats (hearts, streak, stars)', async ({ page }) => {
        await page.goto('http://localhost:4321');
        await page.waitForLoadState('domcontentloaded');
        
        // Verify stats are visible
        const hearts = page.locator('text=❤️');
        const streak = page.locator('text=🔥');
        const stars = page.locator('text=⭐');
        
        await expect(hearts).toBeVisible();
        await expect(streak).toBeVisible();
        await expect(stars).toBeVisible();
    });
    
    test('should have AI Tutor button', async ({ page }) => {
        await page.goto('http://localhost:4321');
        await page.waitForLoadState('domcontentloaded');
        
        // Wait for AI button to appear (may load after initial render)
        await page.waitForTimeout(1000);
        
        // Verify AI Tutor button
        const aiTutorButton = page.locator('button:has-text("AI Tutor"), button:has-text("🤖")');
        await expect(aiTutorButton).toBeVisible();
    });
    
});
