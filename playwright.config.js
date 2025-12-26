import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  // Reduce workers to prevent machine slowdown
  workers: process.env.CI ? 4 : 2,
  // Fail fast to save time
  maxFailures: process.env.CI ? 10 : 5,
  use: {
    headless: true,
    // Faster navigation
    navigationTimeout: 10_000,
    actionTimeout: 5_000,
  },
  webServer: {
    command: 'npx serve -l 4321 --no-port-switching --no-clipboard .',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
