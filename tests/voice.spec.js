import { test, expect } from '@playwright/test';

const HOME_URL = 'http://localhost:4321/';

// Light smoke to ensure the dashboard voice settings and diagnostics render.
test('dashboard voice settings shows diagnostics', async ({ page }) => {
  await page.goto(HOME_URL);

  await page.getByRole('link', { name: /Dashboard/i }).click();
  await page.locator('#dashboard').scrollIntoViewIfNeeded();

  const voiceCard = page.locator('#voiceSourceSelect');
  await expect(voiceCard).toBeVisible();

  await expect(page.locator('#voiceStatus')).toBeVisible();
  await expect(page.locator('#voiceAvailability')).toBeVisible();
  await expect(page.locator('#voiceSelection')).toBeVisible();
  await expect(page.locator('#voiceLastUsed')).toBeVisible();

  await expect(page.locator('#voiceSourceSelect')).toHaveCount(1);
  await expect(page.locator('#voiceSelect')).toHaveCount(1);

  // Diagnostics text should not be empty even in headless environments without voices.
  await expect(page.locator('#voiceStatus')).not.toHaveText('');
  await expect(page.locator('#voiceAvailability')).not.toHaveText('');
  await expect(page.locator('#voiceSelection')).not.toHaveText('');
  await expect(page.locator('#voiceLastUsed')).not.toHaveText('');
});
