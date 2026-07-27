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
  // — there is no login button to click first. This realm's theme is a two-step
  // identifier-first flow: username + "Sign In" submits to a second screen with
  // the password field, then the same "Sign In" label submits that too. Field/
  // button names match Keycloak's default theme; a custom theme may differ.
  await page.goto('/');
  await page.getByLabel('Username or email').fill(username);
  await page.getByRole('button', { name: 'Sign In' }).click();
  // getByLabel('Password') is ambiguous — it also matches the theme's "Show
  // password" toggle button, which shares the same label association. A
  // native input[type=password] has no ARIA role, so getByRole('textbox')
  // won't match it either.
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();

  await expect(page.getByRole('button', { name: 'Account menu' })).toBeVisible();

  await page.context().storageState({ path: AUTH_FILE });
});
