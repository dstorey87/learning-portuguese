/**
 * Navigation E2E Tests
 * 
 * Tests that the navigation bar is visible and functional.
 * These tests catch regressions where navigation disappears.
 */

import { test, expect } from '@playwright/test';

const HOME_URL = 'http://localhost:4321';

test.describe('Navigation Bar E2E Tests', () => {
    
    test('NAV-E001: Bottom navigation bar is visible on home page', async ({ page }) => {
        await page.goto(HOME_URL);
        
        // The bottom nav must be visible
        await expect(page.locator('#bottomNav')).toBeVisible();
        await expect(page.locator('.bottom-nav')).toBeVisible();
    });
    
    test('NAV-E002: All 4 navigation tabs are present', async ({ page }) => {
        await page.goto(HOME_URL);
        
        // Must have exactly 4 tabs
        await expect(page.locator('.nav-tab')).toHaveCount(4);
        
        // Each tab should have data-page attribute
        await expect(page.locator('.nav-tab[data-page="home"]')).toBeVisible();
        await expect(page.locator('.nav-tab[data-page="learn"]')).toBeVisible();
        await expect(page.locator('.nav-tab[data-page="practice"]')).toBeVisible();
        await expect(page.locator('.nav-tab[data-page="profile"]')).toBeVisible();
    });
    
    test('NAV-E003: Home tab is active by default', async ({ page }) => {
        await page.goto(HOME_URL);
        
        const homeTab = page.locator('.nav-tab[data-page="home"]');
        await expect(homeTab).toHaveClass(/active/);
    });
    
    test('NAV-E004: Clicking Learn tab navigates to Learn page', async ({ page }) => {
        await page.goto(HOME_URL);
        
        await page.locator('.nav-tab[data-page="learn"]').click();
        
        // Learn tab should now be active
        await expect(page.locator('.nav-tab[data-page="learn"]')).toHaveClass(/active/);
        // Home tab should not be active
        await expect(page.locator('.nav-tab[data-page="home"]')).not.toHaveClass(/active/);
        // Learn page content should be visible
        await expect(page.locator('#page-learn')).toHaveClass(/active/);
    });
    
    test('NAV-E005: Clicking Practice tab navigates to Practice page', async ({ page }) => {
        await page.goto(HOME_URL);
        
        await page.locator('.nav-tab[data-page="practice"]').click();
        
        await expect(page.locator('.nav-tab[data-page="practice"]')).toHaveClass(/active/);
        await expect(page.locator('#page-practice')).toHaveClass(/active/);
    });
    
    test('NAV-E006: Clicking Profile tab navigates to Profile page', async ({ page }) => {
        await page.goto(HOME_URL);
        
        await page.locator('.nav-tab[data-page="profile"]').click();
        
        await expect(page.locator('.nav-tab[data-page="profile"]')).toHaveClass(/active/);
        await expect(page.locator('#page-profile')).toHaveClass(/active/);
    });
    
    test('NAV-E007: Navigation tabs have icons and labels', async ({ page }) => {
        await page.goto(HOME_URL);
        
        // Each tab should have an icon
        await expect(page.locator('.nav-tab .nav-icon')).toHaveCount(4);
        // Each tab should have a label
        await expect(page.locator('.nav-tab .nav-label')).toHaveCount(4);
        
        // Verify specific labels
        await expect(page.locator('.nav-label').filter({ hasText: 'Home' })).toBeVisible();
        await expect(page.locator('.nav-label').filter({ hasText: 'Learn' })).toBeVisible();
        await expect(page.locator('.nav-label').filter({ hasText: 'Practice' })).toBeVisible();
        await expect(page.locator('.nav-label').filter({ hasText: 'Profile' })).toBeVisible();
    });
    
    test('NAV-E008: Navigation persists after page interaction', async ({ page }) => {
        await page.goto(HOME_URL);
        
        // Navigate to Learn
        await page.locator('.nav-tab[data-page="learn"]').click();
        await expect(page.locator('#bottomNav')).toBeVisible();
        
        // Navigate to Practice
        await page.locator('.nav-tab[data-page="practice"]').click();
        await expect(page.locator('#bottomNav')).toBeVisible();
        
        // Navigate to Profile
        await page.locator('.nav-tab[data-page="profile"]').click();
        await expect(page.locator('#bottomNav')).toBeVisible();
        
        // Navigate back Home
        await page.locator('.nav-tab[data-page="home"]').click();
        await expect(page.locator('#bottomNav')).toBeVisible();
    });
    
    test('NAV-E009: Only one page is visible at a time', async ({ page }) => {
        await page.goto(HOME_URL);
        
        // Home page should be active
        await expect(page.locator('#page-home.active')).toBeVisible();
        await expect(page.locator('#page-learn.active')).toHaveCount(0);
        await expect(page.locator('#page-practice.active')).toHaveCount(0);
        await expect(page.locator('#page-profile.active')).toHaveCount(0);
        
        // Switch to Learn
        await page.locator('.nav-tab[data-page="learn"]').click();
        await expect(page.locator('#page-learn.active')).toBeVisible();
        await expect(page.locator('#page-home.active')).toHaveCount(0);
    });
    
    test('NAV-E010: Hash navigation works (#learn, #practice, #profile)', async ({ page }) => {
        // Navigate directly to Learn via hash
        await page.goto(HOME_URL + '#learn');
        await expect(page.locator('#page-learn')).toHaveClass(/active/);
        
        // Navigate directly to Practice via hash
        await page.goto(HOME_URL + '#practice');
        await expect(page.locator('#page-practice')).toHaveClass(/active/);
        
        // Navigate directly to Profile via hash
        await page.goto(HOME_URL + '#profile');
        await expect(page.locator('#page-profile')).toHaveClass(/active/);
    });
    
    test('NAV-E011: Top header bar is visible', async ({ page }) => {
        await page.goto(HOME_URL);
        
        // Top header should exist
        await expect(page.locator('.top-header')).toBeVisible();
        
        // Header should have stats
        await expect(page.locator('#heartsDisplay')).toBeVisible();
        await expect(page.locator('#streakBadge')).toBeVisible();
        await expect(page.locator('#xpBadge')).toBeVisible();
    });
    
    test('NAV-E012: Logo button exists and is clickable', async ({ page }) => {
        await page.goto(HOME_URL + '#learn');
        
        // Click logo should go to home
        await page.locator('#logoBtn').click();
        await expect(page.locator('#page-home')).toHaveClass(/active/);
    });
    
    test('NAV-E013: Navigation has correct z-index (stays on top)', async ({ page }) => {
        await page.goto(HOME_URL);
        
        const nav = page.locator('#bottomNav');
        const zIndex = await nav.evaluate(el => window.getComputedStyle(el).zIndex);
        
        // Navigation should have high z-index
        expect(parseInt(zIndex, 10)).toBeGreaterThanOrEqual(100);
    });
    
    test('NAV-E014: Navigation is fixed at bottom', async ({ page }) => {
        await page.goto(HOME_URL);
        
        const nav = page.locator('#bottomNav');
        const position = await nav.evaluate(el => window.getComputedStyle(el).position);
        
        // Should be fixed positioning
        expect(position).toBe('fixed');
    });
    
    test('NAV-E015: Footer is visible below content', async ({ page }) => {
        await page.goto(HOME_URL);
        
        await expect(page.locator('.footer')).toBeVisible();
        await expect(page.locator('#appVersion')).toContainText('v0.9.0');
    });
});
