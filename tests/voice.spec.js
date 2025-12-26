import { test, expect } from '@playwright/test';

const HOME_URL = 'http://localhost:4321/';

// Light smoke to ensure the dashboard voice settings render correctly.
test('dashboard voice settings shows controls', async ({ page }) => {
  await page.goto(HOME_URL);

  // Navigate to Profile page (contains dashboard)
  await page.locator('.nav-tab[data-page="profile"]').click();
  await page.locator('#dashboard').scrollIntoViewIfNeeded();

  // Simplified voice UI: single dropdown + download section
  await expect(page.locator('#voiceSelect')).toBeVisible();
  await expect(page.locator('#voiceStatus')).toBeVisible();
  await expect(page.locator('#voiceDownloadSection')).toBeVisible();
  await expect(page.locator('#voiceSampleBtn')).toBeVisible();

  // Status text should not be empty
  await expect(page.locator('#voiceStatus')).not.toHaveText('');
});
