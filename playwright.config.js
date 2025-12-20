import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  timeout: 60_000,
  retries: process.env.CI ? 2 : 0,
  use: {
    headless: true,
  },
  webServer: {
    command: 'npx serve -l 4310 --no-port-switching --no-clipboard .',
    url: 'http://localhost:4310',
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
