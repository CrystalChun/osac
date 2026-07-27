import { expect, test as setup } from '@playwright/test';

import { AUTH_FILE } from './auth-file';

setup('authenticate', async ({ page }) => {
  const username = process.env.E2E_USERNAME;
  const password = process.env.E2E_PASSWORD;
  if (!username || !password) {
    throw new Error('E2E_USERNAME and E2E_PASSWORD must be set to a valid Keycloak test user.');
  }

  // The app checks /api/login/info on load and, if unauthenticated, immediately
  // redirects the browser to Keycloak itself (apps/app-frontend/src/hooks/oidc-login.tsx)
  // — there is no login button to click first. Field/button names below match
  // Keycloak's default login theme; a custom realm theme may need different selectors.
  await page.goto('/');
  await page.getByLabel('Username or email').fill(username);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();

  await expect(page.getByRole('button', { name: 'Account menu' })).toBeVisible();

  await page.context().storageState({ path: AUTH_FILE });
});
