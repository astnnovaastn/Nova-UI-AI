import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 90_000,
  fullyParallel: false,
  use: { baseURL: 'http://127.0.0.1:5173', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER === '1'
    ? undefined
    : { command: 'npm run dev -- --host 127.0.0.1', url: 'http://127.0.0.1:5173', reuseExistingServer: true, timeout: 120_000 },
  projects: [
    { name: 'calendar-desktop', use: { viewport: { width: 1440, height: 900 } } },
    { name: 'calendar-mobile', use: { ...devices['Pixel 5'], viewport: { width: 390, height: 844 } } },
  ],
});
