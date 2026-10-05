import { defineConfig } from '@playwright/test';

// Uses the installed Chrome (no browser download). Tests run against the built site so
// Pagefind search works exactly as in production.
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:4321', channel: 'chrome' },
  webServer: {
    command: 'pnpm build && pnpm preview --port 4321',
    url: 'http://localhost:4321',
    reuseExistingServer: true,
    timeout: 240_000,
  },
});
