import { defineConfig, devices } from '@playwright/test';

import { AUTH_FILE } from './src/auth-file';

const baseURL = process.env.E2E_BASE_URL;
if (!baseURL) {
  throw new Error('E2E_BASE_URL must be set to the URL of a running osac-ui instance.');
}

export default defineConfig({
  testDir: './src',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'html',
  expect: {
    timeout: 15_000,
  },
  use: {
    baseURL,
    trace: 'on-first-retry',
    // Dev/lab cluster routes commonly present a self-signed or cluster-internal
    // CA cert that Chromium doesn't trust by default (the same reason manual
    // testing against these environments always needs curl -k).
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
      // Traces record fill() arguments — never trace the project that types the
      // real Keycloak password, even if a future CI run retries it.
      use: { ...devices['Desktop Chrome'], trace: 'off' },
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: AUTH_FILE },
      dependencies: ['setup'],
    },
  ],
});
