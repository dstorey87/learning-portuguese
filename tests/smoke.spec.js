import { test, expect } from '@playwright/test';

const HOME_URL = 'http://localhost:4321/';

test('home loads with key sections', async ({ page }) => {
  await page.goto(HOME_URL);

  // Home page hero section
  await expect(page).toHaveTitle(/Learn European Portuguese/i);
  await expect(page.getByRole('heading', { name: /Master European Portuguese/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Start Learning Free/i })).toBeVisible();

  // Check version in footer
  await expect(page.getByText('v0.9.0')).toBeVisible();

  // Navigate to Learn page to see lessons
  await page.goto(HOME_URL + '#learn');
  await expect(page.locator('.lesson-card').first()).toBeVisible();
  await expect(page.locator('#lessonGrid')).toBeVisible();
  await expect(page.locator('#topicFilters')).toBeVisible();

  // Navigate to Practice page to see Vault
  await page.goto(HOME_URL + '#practice');
  await expect(page.locator('#srsBuckets')).toBeVisible();
  await expect(page.locator('#reviewPrompt')).toBeVisible();
});

test('tips, plans, and AI tutor render correctly', async ({ page }) => {
  await page.goto(HOME_URL);

  // Navigate to Profile page (contains tips, plans, dashboard, coach)
  await page.goto(HOME_URL + '#profile');

  // Tips section
  await page.locator('#tips').scrollIntoViewIfNeeded();
  await expect(page.getByRole('heading', { name: /EU Portuguese Tips/i })).toBeVisible();
  const tipCount = await page.locator('.tip-card').count();
  expect(tipCount).toBeGreaterThan(1);

  // Plans section
  await page.locator('#plans').scrollIntoViewIfNeeded();
  await expect(page.getByText(/Free Tier/i)).toBeVisible();
  await expect(page.locator('#paidPlanLocked')).toBeVisible();

  // AI Tutor section (renamed from AI Coach)
  await page.locator('#coach').scrollIntoViewIfNeeded();
  await expect(page.getByRole('heading', { name: /AI Tutor/i })).toBeVisible();
  
  // Check AI Tutor UI elements
  await expect(page.locator('#aiVoiceSelect')).toBeVisible();
  await expect(page.locator('#testVoiceBtn')).toBeVisible();
  await expect(page.locator('#practicePhrase')).toBeVisible();
  await expect(page.getByRole('button', { name: /Load Whisper/i })).toBeVisible();
});
