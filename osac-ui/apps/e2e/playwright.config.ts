import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig, devices } from '@playwright/test';

import { AUTH_FILE } from './src/auth-file';

const baseURL = process.env.E2E_BASE_URL;
if (!baseURL) {
  throw new Error('E2E_BASE_URL must be set to the URL of a running osac-ui instance.');
}
try {
  const { protocol } = new URL(baseURL);
  if (protocol !== 'http:' && protocol !== 'https:') {
    throw new Error(`unsupported protocol "${protocol}"`);
  }
} catch (error) {
  throw new Error(
    `E2E_BASE_URL must be an absolute http(s) URL of a running osac-ui instance, got "${baseURL}": ${(error as Error).message}`,
  );
}

const specFile = process.env.E2E_SPEC_FILE;
if (!specFile) {
  throw new Error(
    'E2E_SPEC_FILE must be set to the path of a single spec file to run. It can live anywhere on ' +
      'disk — it does not need to be under apps/e2e/src.',
  );
}
const resolvedSpecFile = path.resolve(specFile);
if (!fs.existsSync(resolvedSpecFile)) {
  throw new Error(`E2E_SPEC_FILE does not exist: ${resolvedSpecFile}`);
}

// Playwright's testDir is always scanned recursively, so it can't just point at
// the spec file's own directory — that directory might be large or partially
// unreadable (e.g. /tmp itself). Instead, copy the single spec into a scratch
// directory this harness owns and always keeps to exactly one file.
const dirname = path.dirname(fileURLToPath(import.meta.url));
const scratchDir = path.join(dirname, '.e2e-run');
fs.rmSync(scratchDir, { recursive: true, force: true });
fs.mkdirSync(scratchDir, { recursive: true });
const scratchSpecFile = path.join(scratchDir, path.basename(resolvedSpecFile));
fs.copyFileSync(resolvedSpecFile, scratchSpecFile);

export default defineConfig({
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
    // testing against these environments always needs curl -k). Opt-in only —
    // this flow submits a real Keycloak password, so TLS verification stays on
    // by default.
    ignoreHTTPSErrors: process.env.E2E_IGNORE_HTTPS_ERRORS === 'true',
  },
  projects: [
    {
      name: 'setup',
      testDir: './src',
      testMatch: /auth\.setup\.ts/,
      // Traces record fill() arguments — never trace the project that types the
      // real Keycloak password, even if a future CI run retries it.
      use: { ...devices['Desktop Chrome'], trace: 'off' },
    },
    {
      name: 'chromium',
      testDir: scratchDir,
      testMatch: path.basename(scratchSpecFile),
      use: { ...devices['Desktop Chrome'], storageState: AUTH_FILE },
      dependencies: ['setup'],
    },
  ],
});
