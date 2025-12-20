import { test, expect } from '@playwright/test';

const HOME_URL = 'http://localhost:4310/';

test('home loads with key sections', async ({ page }) => {
  await page.goto(HOME_URL);

  await expect(page).toHaveTitle(/Learn European Portuguese/i);
  await expect(page.getByRole('heading', { name: /Master European Portuguese/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Start Learning Free/i })).toBeVisible();

  await expect(page.locator('.lesson-card').first()).toBeVisible();
  await expect(page.locator('#lessonGrid')).toBeVisible();
  await expect(page.locator('#topicFilters')).toBeVisible();

  await expect(page.getByRole('link', { name: /My Vault/i })).toBeVisible();
  await expect(page.getByText('v0.4.0')).toBeVisible();
});
