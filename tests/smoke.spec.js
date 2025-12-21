import { test, expect } from '@playwright/test';

const HOME_URL = 'http://localhost:4321/';

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

  await page.getByRole('link', { name: /My Vault/i }).click();
  await page.locator('#vault').scrollIntoViewIfNeeded();
  await expect(page.locator('#srsBuckets')).toBeVisible();
  await expect(page.locator('#reviewPrompt')).toBeVisible();
});

test('tips, plans, and AI coach render and gate correctly', async ({ page }) => {
  await page.goto(HOME_URL);

  await page.getByRole('link', { name: /Tips/i }).click();
  await page.locator('#tips').scrollIntoViewIfNeeded();
  await expect(page.getByRole('heading', { name: /EU Portuguese Tips/i })).toBeVisible();
  const tipCount = await page.locator('.tip-card').count();
  expect(tipCount).toBeGreaterThan(1);

  await page.getByRole('link', { name: /Plans/i }).click();
  await page.locator('#plans').scrollIntoViewIfNeeded();
  await expect(page.getByText(/Free Tier/i)).toBeVisible();
  await expect(page.locator('#paidPlanLocked')).toBeVisible();

  await page.getByRole('link', { name: /AI Coach/i }).click();
  await page.locator('#coach').scrollIntoViewIfNeeded();
  await expect(page.getByRole('heading', { name: /AI Coach/i })).toBeVisible();
  await expect(page.locator('#aiHints .hint-row').first()).toBeVisible();
  await expect(page.getByRole('button', { name: /Hear in EU-PT/i })).toBeVisible();
});
