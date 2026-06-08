# Mock Data in OSAC

This document captures how mock data was used in the original Fastify BFF (`apps/app-backend`) and how it continues to be used in the React SPA. It serves as a reference for anyone adding real API integrations.

---

## Overview

Mock data existed at two layers:

1. **`libs/api-contracts/src/mock-data.ts`** — shared canonical fixtures imported by both the old BFF and the SPA.
2. **`apps/app-backend/src/mock-vm-store.ts`** — a mutable in-process `Map<string, ComputeInstance>` seeded from `mock-data.ts`; only existed in the Fastify BFF.

The Fastify BFF has been removed. The Go chi proxy (`proxy/`) is a pure proxy — it has no mock mode. The SPA still imports some fixtures client-side (see [SPA client-side fixtures](#spa-client-side-fixtures)).

---

## BFF mock endpoints (Fastify — removed)

These endpoints existed only when `OSAC_API_MODE=mock`. They are no longer served by the new proxy. A real upstream (`FULFILLMENT_API_URL`) is now always required.

### `/api/fulfillment/v1/*`

| Method   | Path                                            | Mock behaviour                                                                      |
| -------- | ----------------------------------------------- | ----------------------------------------------------------------------------------- |
| `GET`    | `/capabilities`                                 | Always returned `{ authn: { trustedTokenIssuers: [] } }` (no real IdP).            |
| `GET`    | `/compute_instance_templates`                   | Returned paginated `VM_TEMPLATES` from `mock-data.ts` (filter, limit, offset).      |
| `GET`    | `/compute_instance_templates/:id`               | Returned single template or 404.                                                    |
| `GET`    | `/compute_instances`                            | Returned paginated VMs from `vmStore` (filter by name/state, limit, offset).        |
| `GET`    | `/compute_instances/:id`                        | Returned single VM from `vmStore` or 404.                                           |
| `POST`   | `/compute_instances`                            | Created VM in `vmStore` (in-process memory); assigned `id = vm-created-<timestamp>`.|
| `PATCH`  | `/compute_instances/:id`                        | Merged partial update into existing VM in `vmStore`.                                |
| `DELETE` | `/compute_instances/:id`                        | Removed VM from `vmStore`.                                                          |
| `GET`    | `/organizations`                                | Returned `DEMO_ORGANIZATIONS` from `mock-data.ts`.                                  |
| `GET`    | `/clusters`                                     | Derived from `DEMO_ORGANIZATIONS` (id + displayName).                               |
| `GET`    | `/virtual_networks`                             | Three hardcoded networks (prod, dev, mgmt).                                          |
| `GET`    | `/subnets`                                      | Three hardcoded subnets.                                                             |
| `GET`    | `/security_groups`                              | Three hardcoded security groups.                                                     |

### `/api/events/v1/*`

| Method | Path      | Mock behaviour                                                                       |
| ------ | --------- | ------------------------------------------------------------------------------------ |
| `GET`  | `/events` | Returned paginated slice of 50 synthetic events (VM_STARTED, VM_STOPPED, etc.).      |

### `/api/osac/public/v1/*`

| Method | Path                                                    | Mock behaviour                                                                       |
| ------ | ------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `GET`  | `/console/:resourceType/:resourceId/access`             | Returned `{ available, reason?, supportedTypes }` based on resource type string.     |

### `/api/osac/bff/v1/create-vm-wizard/*` (always mock, not mode-gated)

The create-VM wizard BFF extension maintained an in-process session `Map` and implemented multi-step validation. It was never proxied upstream (even in dev mode). Steps: `template → customization → review`.

| Method   | Path                             | Behaviour                                                                      |
| -------- | -------------------------------- | ------------------------------------------------------------------------------ |
| `POST`   | `/sessions`                      | Starts a wizard session; returns `sessionId` + active step state.              |
| `GET`    | `/sessions/:sessionId`           | Returns current session state.                                                 |
| `POST`   | `/sessions/:sessionId/advance`   | Validates current step, merges draft, advances to next step.                   |
| `POST`   | `/sessions/:sessionId/back`      | Goes back one step.                                                            |
| `POST`   | `/sessions/:sessionId/finalize`  | Validates all steps, creates VM in `vmStore`, deletes session.                 |
| `DELETE` | `/sessions/:sessionId`           | Abandons session (204 No Content).                                             |

> **Note:** Clone (`entry=clone_drawer`) and non-template deployment methods returned 503 (stubs with `RESTORE` markers in source). Only the `template` path was active.

---

## `vmStore` — mutable in-process VM store

`apps/app-backend/src/mock-vm-store.ts` seeded a `Map<string, ComputeInstance>` from:

```ts
buildVmsForTenant('northstar')  // ~20 VMs
buildVmsForTenant('evergreen')  // ~13 VMs
```

Both tenants' VMs lived in a single store (no tenant isolation). Mutations (create, patch, delete, wizard finalize) persisted for the lifetime of the BFF process; restarting reset everything. Tests used `resetMockVmStore()` in `afterEach`.

---

## `libs/api-contracts/src/mock-data.ts` — canonical fixtures

This file still exists and is imported by the SPA. Key exports:

| Export                           | Description                                                                   |
| -------------------------------- | ----------------------------------------------------------------------------- |
| `VM_TEMPLATES`                   | Array of `ClusterTemplate` — template catalog data (was used by BFF + SPA).   |
| `buildVmsForTenant(tenant)`      | Generates seeded `ComputeInstance[]` for a given tenant id.                   |
| `DEMO_ORGANIZATIONS`             | `Organization[]` for Northstar, Bluestone Financial, Vertexa.                 |
| `DEMO_QUOTA`                     | Static quota numbers per tenant (CPU, memory, storage).                        |
| `NORTHSTAR_USERS`                | Static user list for Northstar (admin UI).                                     |
| `EVERGREEN_USERS`                | Static user list for Evergreen/Bluestone (admin UI).                           |
| `DEMO_TENANT_LABEL`              | Display names for tenant IDs.                                                  |
| `DEMO_TENANT_SOVEREIGNTY`        | Per-tenant region/compliance metadata for masthead strip.                      |
| `DEMO_TENANT_DISPLAY_USER/ADMIN` | Demo persona display names.                                                    |
| `DEMO_TENANT_LOGIN_EMAIL_*`      | Pre-filled email addresses for demo sign-in.                                   |
| `demoLoginEmailForRole()`        | Helper: returns correct email for a given tenant + role combo.                 |
| `buildRecentActivities(vms)`     | Derives a recent-activities feed from a VM list (client-side only).            |

---

## SPA client-side fixtures

Several pages still import mock data **directly from `@osac/api-contracts`** without an API call. These need real API endpoints for a production integration:

| Page / component                          | Fixture used                                 | Integration needed                                     |
| ----------------------------------------- | -------------------------------------------- | ------------------------------------------------------ |
| `AdminQuotaPage`                          | `DEMO_QUOTA`                                 | `/api/private/v1/quota` endpoint + `useQuota()` hook   |
| `AdminUsersPage`                          | `NORTHSTAR_USERS` / `EVERGREEN_USERS`        | User management API endpoints                          |
| `ProviderTenantOrgsPage`                  | `DEMO_ORGANIZATIONS`                         | `GET /api/fulfillment/v1/organizations` (already proxied)|
| `ProviderAdminDashboardPage`              | `DEMO_ORGANIZATIONS`                         | Same                                                   |
| `RecentActivitiesPage`, dashboard section | `buildRecentActivities(vms)`                 | `GET /api/events/v1/events` with SSE/streaming          |
| Shell / branding                          | `DEMO_TENANT_SOVEREIGNTY`, display names     | Tenant metadata API or OIDC claims                     |
| `WelcomePage`, `SignInPage`               | `DEMO_TENANT_LOGIN_EMAIL_*`, persona helpers | Remove when real OIDC login is wired                   |

---

## Proxy routes (new Go chi proxy)

The Go proxy at `proxy/` forwards the following path prefixes to `FULFILLMENT_API_URL`:

| Prefix                      | Forwarded to                          |
| --------------------------- | ------------------------------------- |
| `/api/fulfillment/v1/*`     | `$FULFILLMENT_API_URL` + original path|
| `/api/events/v1/*`          | `$FULFILLMENT_API_URL` + original path|
| `/api/osac/public/v1/*`     | `$FULFILLMENT_API_URL` + original path|

`/health` and `/ready` are handled locally.

> The create-VM wizard (`/api/osac/bff/v1/create-vm-wizard/*`) is **not proxied**. If that endpoint is needed it must be implemented in the upstream fulfillment service or a new BFF layer.
