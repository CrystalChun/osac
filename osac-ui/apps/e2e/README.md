# @osac/e2e

Playwright browser tests for manually verifying `osac-ui` against a **live,
already-deployed** cluster — the running proxy, SPA, Keycloak realm, and
`fulfillment-service` backend all in one real environment.

This is not a CI suite and not a replacement for `osac-test-infra`'s
gRPC-level e2e coverage. There is no mock server for `fulfillment-service`
and no way to run this hermetically — it exists for manually confirming a
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

| Variable       | Description                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------------- |
| `E2E_BASE_URL` | Full URL of the `osac-ui` deployment to test, e.g. `https://osac-ui-<namespace>.<cluster-domain>` |
| `E2E_USERNAME` | Username of a Keycloak test user on that deployment's realm                                       |
| `E2E_PASSWORD` | Password for that user                                                                            |

```bash
E2E_BASE_URL=https://... E2E_USERNAME=... E2E_PASSWORD=... pnpm e2e
```

(`pnpm e2e` is a root-level shortcut for `pnpm --filter @osac/e2e run
test:e2e`.) There's no default for `E2E_BASE_URL` — it's required, so a
missing value fails immediately with a clear error instead of silently
pointing at the wrong environment.

Testing against a local `pnpm dev` instance instead of a remote deployment:

```bash
E2E_USERNAME=... E2E_PASSWORD=... pnpm e2e:dev
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

## Adding tests

New test files go in `src/*.spec.ts` and run in the `chromium` project
(already authenticated — no need to handle login in the test itself). See
`src/smoke.spec.ts` for the minimal example this package started with.
