# @osac/e2e

Playwright browser tests for manually verifying `osac-ui` against a **live,
already-deployed** cluster — the running proxy, SPA, Keycloak realm, and
`fulfillment-service` backend all in one real environment.

This is not a CI suite. There is no mock server for `fulfillment-service`
and no way to run this hermetically — it exists for AI agents to manually confirm a
change actually works end-to-end against a real deployment, the way you'd
otherwise do by hand in a browser.

## Prerequisites

- A reachable `osac-ui` deployment (any HTTPS URL that serves it).
- A Keycloak user on that deployment's realm to log in as. This package
  doesn't provision one — use an existing test account, or create one on the
  target environment first.
- Playwright's browser binaries installed once per machine (see Setup below).

## Setup

```bash
pnpm install
pnpm --filter @osac/e2e exec playwright install chromium
```

## Running

Required environment variables:

| Variable        | Description                                                                                        |
| --------------- | --------------------------------------------------------------------------------------------------- |
| `E2E_BASE_URL`  | Full URL of the `osac-ui` deployment to test, e.g. `https://osac-ui-<namespace>.<cluster-domain>` |
| `E2E_USERNAME`  | Username of a Keycloak test user on that deployment's realm                                       |
| `E2E_PASSWORD`  | Password for that user                                                                             |
| `E2E_SPEC_FILE` | Path to the single spec file to run — see [Writing a test](#writing-a-test)                        |

```bash
E2E_BASE_URL=https://... E2E_USERNAME=... E2E_PASSWORD=... E2E_SPEC_FILE=/tmp/check.spec.ts pnpm e2e
```

(`pnpm e2e` is a root-level shortcut for `pnpm --filter @osac/e2e run
test:e2e`.) None of these have defaults — each is required, so a missing value
fails immediately with a clear error instead of silently pointing at the wrong
environment or running the wrong spec.

Optional:

| Variable                  | Description                                                                                          |
| -------------------------- | ----------------------------------------------------------------------------------------------------- |
| `E2E_IGNORE_HTTPS_ERRORS` | Set to `true` to trust self-signed/cluster-internal CA certs, common on dev and lab clusters. Off by default because this flow submits a real Keycloak password — only enable it against clusters you trust. |

Testing against a local `pnpm dev` instance instead of a remote deployment:

```bash
E2E_USERNAME=... E2E_PASSWORD=... E2E_SPEC_FILE=/tmp/check.spec.ts pnpm e2e:dev
```

`pnpm e2e:dev` sets `E2E_BASE_URL=http://localhost:5173` for you — still
requires `pnpm dev` running in another terminal, and still needs
`E2E_USERNAME`/`E2E_PASSWORD`.

## How authentication works

`osac-ui` has no test-mode auth bypass — every login goes through a real
Keycloak realm via the app's normal OIDC flow. Rather than repeating that
flow (and Keycloak's own login page) for every test, this harness follows
Playwright's standard pattern for testing authenticated apps:

1. A `setup` project (`src/auth.setup.ts`) runs once per test run. It opens
   the app, which auto-redirects to Keycloak when unauthenticated, fills in
   `E2E_USERNAME`/`E2E_PASSWORD` on Keycloak's real login form, and saves the
   resulting browser session (cookies) to `.auth/user.json`.
2. Every real test (the `chromium` project) declares a dependency on `setup`
   and loads that saved session before the test body runs — so tests start
   already logged in, and the login flow only ever runs once per invocation.

`.auth/user.json` contains a live, real session (the actual `osac-access`
cookie) — it's gitignored and must never be committed or shared. It's
regenerated fresh every time you run `pnpm e2e`.

If the target realm's login page uses a custom Keycloak theme, the field/
button selectors in `auth.setup.ts` (written against Keycloak's default
theme) may need adjusting.

## Writing a test

There's no persisted test suite here. This package provides the harness (auth
+ config) only; test specs are throwaway, written ad hoc for a specific
manual-verification task (typically by an AI agent working through a change)
and run once. They don't live in this package at all — `E2E_SPEC_FILE` points
Playwright at a single spec file anywhere on disk, and the copy the harness
makes internally lives in a gitignored scratch dir, so there's nothing under
`apps/e2e` to ever commit or manually clean up.

Write the spec anywhere, e.g. `/tmp/check.spec.ts`:

```bash
cat > /tmp/check.spec.ts <<'EOF'
import { expect, test } from '@playwright/test';

test('loads the authenticated dashboard', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('button', { name: 'Account menu' })).toBeVisible();
});
EOF
```

It runs in the `chromium` project — already authenticated via `auth.setup.ts`,
no need to handle login in the test itself. Run it with:

```bash
E2E_BASE_URL=... E2E_USERNAME=... E2E_PASSWORD=... E2E_SPEC_FILE=/tmp/check.spec.ts pnpm e2e
```

`E2E_SPEC_FILE` is always required — there's no default spec, so a wrong or
missing path fails immediately instead of silently running nothing (or the
wrong thing).
