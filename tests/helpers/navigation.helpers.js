/**
 * E2E Test Helpers
 * 
 * Common utilities for E2E tests that handle both desktop and mobile viewports
 */

/**
 * Navigate to a page by ID
 * Works on both desktop (sidebar) and mobile (bottom nav) viewports
 * 
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {string} pageId - Page ID to navigate to (e.g., 'learn', 'practice', 'profile')
 */
export async function navigateToPage(page, pageId) {
    // Try bottom nav first (mobile)
    const bottomNavTab = page.locator(`.bottom-nav .nav-tab[data-page="${pageId}"]`);
    const isBottomNavVisible = await bottomNavTab.isVisible().catch(() => false);
    
    if (isBottomNavVisible) {
        await bottomNavTab.click();
    } else {
        // Try sidebar (desktop/tablet)
        const sidebarItem = page.locator(`.sidebar .sidebar-item[data-page="${pageId}"]`);
        const isSidebarVisible = await sidebarItem.isVisible().catch(() => false);
        
        if (isSidebarVisible) {
            await sidebarItem.click();
        } else {
            // Fallback: Use URL hash navigation
            const currentUrl = page.url();
            const baseUrl = currentUrl.split('#')[0];
            await page.goto(`${baseUrl}#${pageId}`);
        }
    }
    
    // Wait for navigation to complete
    await page.waitForTimeout(300);
}

/**
 * Get the current active page ID
 * @param {import('@playwright/test').Page} page - Playwright page
 * @returns {Promise<string>} Current page ID
 */
export async function getCurrentPage(page) {
    const hash = await page.evaluate(() => window.location.hash.replace('#', '') || 'home');
    return hash;
}

/**
 * Check if a page is currently visible
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {string} pageId - Page ID to check
 * @returns {Promise<boolean>}
 */
export async function isPageVisible(page, pageId) {
    const pageEl = page.locator(`.page[data-page="${pageId}"].active`);
    return await pageEl.isVisible().catch(() => false);
}

/**
 * Wait for page to be ready (lessons loaded, etc.)
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {number} timeout - Timeout in ms
 */
export async function waitForPageReady(page, timeout = 5000) {
    // Wait for any loading spinners to disappear
    await page.waitForSelector('.loading', { state: 'hidden', timeout }).catch(() => {});
    // Wait for main content to be visible
    await page.waitForSelector('main', { state: 'visible', timeout }).catch(() => {});
}

/**
 * Click a navigation item by page ID (any viewport)
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {string} pageId - Page ID
 */
export async function clickNavItem(page, pageId) {
    // Combined selector that works for both bottom nav and sidebar
    const navSelector = `.nav-tab[data-page="${pageId}"], .sidebar-item[data-page="${pageId}"]`;
    const navItem = page.locator(navSelector).first();
    
    // If not visible, use hash navigation
    if (!await navItem.isVisible().catch(() => false)) {
        const currentUrl = page.url();
        const baseUrl = currentUrl.split('#')[0];
        await page.goto(`${baseUrl}#${pageId}`);
        await page.waitForTimeout(200);
        return;
    }
    
    await navItem.click();
    await page.waitForTimeout(200);
}
