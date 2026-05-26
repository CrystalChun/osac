# OSAC — VM-as-a-Service Frontend

OSAC is a fullstack demo application for an OpenShift-based VM-as-a-Service platform. It provides a multi-tenant UI built with React + PatternFly 6, backed by a Fastify BFF (Backend-for-Frontend) that can run against built-in mock data or proxy to a real upstream fulfillment API.

---

## Table of contents

- [Repository layout](#repository-layout)
- [Prerequisites](#prerequisites)
- [Quick start (mock mode)](#quick-start-mock-mode)
- [Running modes explained](#running-modes-explained)
- [Authorization (dev mode and fulfillment RBAC)](#authorization-dev-mode-and-fulfillment-rbac)
- [Demo personas and entry points](#demo-personas-and-entry-points)
- [What is implemented](#what-is-implemented)
- [What needs real integration or further testing](#what-needs-real-integration-or-further-testing)
- [Build and container](#build-and-container)
- [OpenShift deployment](#openshift-deployment)
- [Workspace scripts reference](#workspace-scripts-reference)
- [Project structure](#project-structure)

---

## Repository layout

```
osac/
├── apps/
│   ├── app-backend/        # Fastify BFF — serves API and embeds SPA in prod
│   ├── app-frontend/       # React SPA (PatternFly 6, React Router, TanStack Query)
│   └── e2e/                # Cypress end-to-end tests
├── libs/
│   ├── api-contracts/      # Shared TypeScript types + mock data
│   ├── config/             # Shared ESLint, Prettier, tsconfig base
│   └── ui-components/      # Shared PatternFly components (LightDarkToggle, VmStatusLabel, …)
├── deploy/
│   ├── dev/                # OpenShift manifests — development namespace
│   └── integration/        # OpenShift manifests — integration namespace
├── Containerfile           # Multi-stage build (SPA + BFF → single image)
└── package.json            # Root pnpm workspace scripts
```

---

## Prerequisites


| Tool    | Minimum version |
| ------- | --------------- |
| Node.js | 20              |
| pnpm    | 9               |


Install pnpm if you don't have it:

```bash
npm install -g pnpm
```

Install all workspace dependencies from the repo root:

```bash
pnpm install
```

---

## Quick start (mock mode)

Mock mode uses built-in fixture data — no external services needed.

Open **two terminals** from the repo root:

**Terminal 1 — BFF:**

```bash
pnpm dev:backend
# Server starts on http://localhost:3001
# Logs: {"msg":"OSAC BFF running at http://0.0.0.0:3001 [mode=mock]"}
```

**Terminal 2 — SPA:**

```bash
pnpm dev:frontend
# Vite dev server starts on http://localhost:5173
# All /api/* requests are proxied to :3001 automatically
```

Open [http://localhost:5173](http://localhost:5173).

---

## Running modes explained

### Mock mode (default)

The BFF serves all data from in-memory fixtures defined in `libs/api-contracts/src/mock-data.ts`. No upstream API is needed. VM state is persisted within the BFF process lifetime (restarting the BFF resets it).

```bash
# Explicit (same as default):
OSAC_API_MODE=mock pnpm dev:backend
```

Mocked endpoints:


| Endpoint                                           | Description                                   |
| -------------------------------------------------- | --------------------------------------------- |
| `GET /api/fulfillment/v1/compute_instances`        | List VMs (Northstar + Bluestone fixture data) |
| `POST /api/fulfillment/v1/compute_instances`       | Create VM (stored in process memory)          |
| `PATCH /api/fulfillment/v1/compute_instances/:id`  | Update VM power state / spec                  |
| `DELETE /api/fulfillment/v1/compute_instances/:id` | Delete VM                                     |
| `GET /api/fulfillment/v1/compute_instance_templates` | List VM templates                              |
| `GET /api/fulfillment/v1/organizations`            | List tenant organizations                     |
| `GET /api/fulfillment/v1/virtual_networks`         | List virtual networks                         |
| `GET /api/fulfillment/v1/subnets`                  | List subnets                                  |
| `GET /api/fulfillment/v1/security_groups`          | List security groups                          |
| `GET /api/fulfillment/v1/capabilities`             | Auth capabilities stub                        |
| `GET /health`                                      | Health probe                                  |
| `GET /ready`                                       | Readiness probe                               |


### Dev mode (real upstream API)

Set `OSAC_API_MODE=dev` and `FULFILLMENT_API_URL` so the BFF can forward browser traffic to the fulfillment REST gateway. The BFF **exits at startup** if `dev` is set without a valid `FULFILLMENT_API_URL`.

```bash
OSAC_API_MODE=dev \
FULFILLMENT_API_URL=https://fulfillment.your-env.example.com \
pnpm dev:backend
```

**Today:** in dev mode the BFF proxies `**/api/fulfillment/v1/*`**, `**/api/events/v1/*`**, and `**/api/osac/public/v1/***` to `FULFILLMENT_API_URL`, forwards inbound `Authorization` unchanged, and returns upstream status and headers. Responses are **buffered** in the BFF (full body read before reply) as a documented Undici/Fastify workaround — see `docs/specs/backend-fulfillment.yaml` (`bff_proxy_matrix_dev.implementation_notes`); true streaming for long-lived event watches is a follow-up. **`TEMP_FULFILLMENT_STATIC_BEARER`** on the BFF can supply upstream Bearer when the client sends none (**not** on `GET /api/fulfillment/v1/capabilities`); **`TEMP_FULFILLMENT_STATIC_BEARER_FORCE=1`** (dev only) overrides an expired browser JWT on other routes. **`VITE_DEV_BEARER_TOKEN`** on the SPA fills Bearer in dev when sessionStorage has no token (see `apps/app-frontend/.env.example`). **`OSAC_API_MODE=dev` requires `FULFILLMENT_API_URL`** or the BFF exits at startup. TLS to a private PKI uses **`FULFILLMENT_TLS_CA_FILE`** or the temporary **`TEMP_FULFILLMENT_TLS_INSECURE=1`** (dev only; refused in production). Details: [docs/runbook.md](docs/runbook.md). See [Authorization (dev mode and fulfillment RBAC)](#authorization-dev-mode-and-fulfillment-rbac). Much of the SPA still reads `DEMO_*` fixtures and `VM_TEMPLATES` from `libs/api-contracts` even in dev mode.

**Spec target — non-mock flow:** `docs/specs/backend-fulfillment.yaml` → `context.osac_real_api_integration` — wire full **OIDC Authorization Code + PKCE** from `GET /api/fulfillment/v1/capabilities`, extend the SPA client and TanStack hooks for organizations, users, networks, and events, replace mock-only data where fulfillment has resources, align TypeScript with published fulfillment OpenAPI (or codegen), and treat utilization charts as an explicit gap or product-owned metrics API. **Mock mode (`OSAC_API_MODE=mock`) stays unchanged.**

> **Note:** Interactive OIDC in the SPA is still incomplete vs that spec; dev mode can use a pasted JWT when capabilities list trusted issuers (see [Authorization](#authorization-dev-mode-and-fulfillment-rbac) and [What needs real integration](#what-needs-real-integration-or-further-testing)).

### Environment variables reference


| Variable              | Default   | Description                                                                  |
| --------------------- | --------- | ---------------------------------------------------------------------------- |
| `PORT`                | `3001`    | BFF listen port                                                              |
| `HOST`                | `0.0.0.0` | BFF listen host                                                              |
| `LOG_LEVEL`           | `info`    | Fastify log level (`trace` / `debug` / `info` / `warn` / `error`)            |
| `OSAC_API_MODE`       | `mock`    | `mock` — built-in fixtures; `dev` — proxy to upstream                        |
| `FULFILLMENT_API_URL` | *(unset)* | Required when `OSAC_API_MODE=dev`. Base URL of the upstream fulfillment API. |
| `FULFILLMENT_TLS_CA_FILE` | *(unset)* | Optional PEM bundle for BFF → fulfillment TLS (private PKI). |
| `TEMP_FULFILLMENT_TLS_INSECURE` | *(unset)* | Set to `1` for dev-only upstream TLS verification off; refused when `NODE_ENV=production`. |
| `TEMP_FULFILLMENT_STATIC_BEARER` | *(unset)* | TEMP: upstream `Authorization: Bearer …` when the client sends no non-empty Bearer (not used on `GET /api/fulfillment/v1/capabilities` — see runbook). |
| `TEMP_FULFILLMENT_STATIC_BEARER_FORCE` | *(unset)* | TEMP dev only: replace client Bearer on proxied routes except that GET capabilities (see runbook). |
| `NODE_ENV`            | *(unset)* | Set to `production` in the container image                                   |


Copy `apps/app-backend/.env.example` to `apps/app-backend/.env` and adjust values for your environment.

**SPA (Vite dev):** optional `VITE_DEV_BEARER_TOKEN` — see `apps/app-frontend/.env.example`. Public API contract: [buf.build/osac-project/public-api](https://buf.build/osac-project/public-api) (this repo uses REST via the BFF proxy until Connect/gRPC-Web is confirmed on the live gateway).

---

## Authorization (dev mode and fulfillment RBAC)

In **mock mode** (`OSAC_API_MODE=mock`), the BFF serves fixtures. The SPA does not need a real identity provider or `Authorization` header for those routes.

In **dev mode** (`OSAC_API_MODE=dev` with `FULFILLMENT_API_URL`), the SPA should call the BFF with `Authorization: Bearer <access_token>` on requests that proxy to fulfillment. The BFF forwards the request (including that header) to the upstream fulfillment REST gateway. Between the browser and fulfillment-service, the cluster typically runs an **API gateway + Authorino**: Authorino validates the JWT, runs policy (for example OPA: admin vs client and allowed operations), maps **JWT `groups`** (or equivalent claims) to **tenant scope**, and injects `**x-subject`** (`user` + `tenants`) for fulfillment-service. The service then enforces tenancy and resource-level access. The browser never receives `x-subject`; it is an edge-to-service contract.

**Current SPA behavior (dev path):** the sign-in page loads `GET /api/fulfillment/v1/capabilities`. If `authn.trustedTokenIssuers` is non-empty, the UI treats dev sign-in as **paste a JWT access token** (stored for subsequent API calls). Full **OIDC Authorization Code + PKCE** against that issuer is the spec target; see `docs/specs/backend-fulfillment.yaml` → `context.osac_real_api_integration`.

### End-to-end sequence (SPA → Authorino → fulfillment-service)

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant SPA as OSAC SPA
    participant IdP as OIDC IdP<br/>(e.g. Keycloak)
    participant BFF as OSAC BFF
    participant GW as API gateway<br/>(e.g. Envoy)
    participant Auth as Authorino<br/>(JWT + OPA)
    participant FS as fulfillment-service

    U->>SPA: Choose persona / navigate
    SPA->>IdP: Authorization Code + PKCE<br/>(issuer from capabilities)
    IdP-->>SPA: access_token (JWT)<br/>claims: sub, username, groups, …

    SPA->>BFF: HTTPS /api/...<br/>Authorization: Bearer JWT
    Note over BFF: Dev: proxy passthrough<br/>Mock: fixtures only

    BFF->>GW: Forward request<br/>Authorization: Bearer JWT
    GW->>Auth: ext_authz / auth check<br/>(method + identity)

    Auth->>Auth: Verify JWT (issuer, sig, exp)
    Auth->>Auth: OPA: admin vs client,<br/>allowed RPC/method list
    Auth->>Auth: Derive tenants from JWT groups<br/>(or * for admin)

    alt Authorized
        Auth-->>GW: OK + inject headers<br/>x-subject: {"user","tenants"}
        GW->>FS: Forward request + x-subject<br/>(+ Bearer per deployment)
        FS->>FS: Read subject from context<br/>tenant scope + resource checks
        FS-->>GW: JSON / stream response
        GW-->>BFF: Response
        BFF-->>SPA: Response
        SPA-->>U: UI update
    else Denied (Authorino)
        Auth-->>GW: 403 Forbidden
        GW-->>BFF: 403
        BFF-->>SPA: 403
        SPA-->>U: Error / re-auth
    end
```



### Where `x-subject` fits (edge vs application)

```mermaid
flowchart LR
  subgraph edge["Edge (Authorino)"]
    JWT[JWT Bearer]
    OPA[OPA policy<br/>admin / client / allowlist]
    XS[x-subject header<br/>user + tenants from groups]
    JWT --> OPA --> XS
  end
  subgraph app["fulfillment-service"]
    CTX[Subject in request context]
    TEN[Tenancy + resource RBAC]
    JWT -.->|after allow| XS --> CTX --> TEN
  end
```



---

## Demo personas and entry points

The welcome page (`/`) is a **booth operator entry screen**, not a customer-facing login. It uses **three role columns** (Provider Admin, Tenant Admin, Tenant User). Under **Tenant Admin** and **Tenant User**, pick **Northstar Bank** or **Bluestone Financial** to set `tenantId` + role, then continue to sign-in. **Provider Admin** uses **Enter** (Vertexa / cross-tenant context).


| Entry surface                 | Role            | What they see after login                                                        |
| ----------------------------- | --------------- | -------------------------------------------------------------------------------- |
| **Provider Admin → Enter**    | `providerAdmin` | Cross-tenant dashboard, organizations, global templates, infrastructure topology |
| **Tenant User → org button**  | `tenantUser`    | VM dashboard, My VMs, template catalog, recent activities                        |
| **Tenant Admin → org button** | `tenantAdmin`   | Admin dashboard, users, quota, networks, template catalog                        |


All paths navigate to `**/sign-in`** in the **same tab**. Sign-in is a **single institutional screen** (`InstitutionalSignInPage`): copy, trusted-issuer alert, and accents follow the **selected tenant** via `components/login/institutionalBranding.ts` — there are no separate routed pages per bank.

You can also deep-link directly to a persona by appending a query parameter (cold load):

```
http://localhost:5173/?osac-entry=northstar-user
http://localhost:5173/?osac-entry=northstar-admin
http://localhost:5173/?osac-entry=evergreen-user
http://localhost:5173/?osac-entry=evergreen-admin
```

(`evergreen-*` is the **tenant id** for Bluestone Financial in code and config; the welcome UI labels it “Bluestone”.)

---

## What is implemented

```mermaid
flowchart TB
  subgraph Users["Clients"]
    UI[osac-ui / consoles]
    CLI[fulfillment-cli archived]
  end

  subgraph Core["Core runtime"]
    FS[fulfillment-service API + DB]
    OP[osac-operator CRDs + reconcile]
  end

  subgraph Deploy["Integration & install"]
    INS[osac-installer]
  end

  subgraph Auto["Automation"]
    AAP[osac-aap]
  end

  subgraph Platform["Hub / cloud stack"]
    ACM[ACM / MCE / HCP]
    VIRT[OCP-Virt / KubeVirt]
    OVN[OVN UDN / Tenant networking]
    KC[Keycloak / OIDC]
    AUTH[Authorino / gateway policy]
  end

  subgraph More["Other org repos public listing"]
    DOC[docs]
    EP[enhancement-proposals]
    TI[osac-test-infra]
    GC[github-config]
    WS[osac-workspace]
    HM[host-management-openstack]
    ISS[issues]
  end

  UI --> FS
  CLI -.->|archived| FS
  FS --> OP
  FS --> KC
  INS --> FS
  INS --> OP
  INS --> AAP
  OP --> AAP
  OP --> ACM
  OP --> VIRT
  OP --> OVN
  OP --> AUTH
  DOC -.-> DOC
  TI -.->|e2e| INS


### Frontend (React SPA)


| Area                               | Status | Notes                                                                                                               |
| ---------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------- |
| Welcome / role selection page      | ✅      | Three role columns; org buttons for tenant admin/user; Provider Enter                                               |
| Institutional sign-in (`/sign-in`) | ✅      | One `InstitutionalSignInPage`; tenant-aware branding + `LoginForm`                                                  |
| Application shell                  | ✅      | Masthead, role-based sidebar nav, breadcrumbs, light/dark toggle                                                    |
| Tenant user dashboard              | ✅      | VM power-state stat cards, create VM                                                                                |
| My VMs — card view                 | ✅      | Power filter, search, card grid                                                                                     |
| My VMs — table view                | ✅      | Compact sortable table                                                                                              |
| VM detail drawer                   | ✅      | Overview, Networking, Conditions tabs; power actions                                                                |
| Create VM wizard                   | ✅      | Modal wizard; steps under `components/vm/createVmWizard/`. POSTs to BFF.                                            |
| Template catalog                   | ✅      | Searchable gallery, detail drawer, launches wizard                                                                  |
| Recent activities feed             | ✅      | Mock: derived from VM list. **Dev (spec):** `GET /api/events/v1/events` — see `docs/specs/backend-fulfillment.yaml` |
| Tenant admin dashboard             | ✅      | Summary stats, navigation tiles                                                                                     |
| Tenant admin — Users               | ✅      | Table of demo users                                                                                                 |
| Tenant admin — Quota control       | ✅      | Resource consumption visualization                                                                                  |
| Tenant admin — Networks            | ✅      | Network topology graph                                                                                              |
| Provider admin dashboard           | ✅      | Cross-tenant summary, navigation tiles                                                                              |
| Provider — Tenant organizations    | ✅      | Organization list                                                                                                   |
| Provider — Infrastructure topology | ✅      | Platform-wide VM topology                                                                                           |
| Provider — Global templates        | ✅      | Reuses template catalog (provisioning blocked for provider context)                                                 |
| Multi-tenant data isolation        | ✅      | Each tenant tab sees its own VM set                                                                                 |
| Light / dark theme                 | ✅      | Per-tenant default, togglable in masthead                                                                           |
| RBAC — nav and route guards        | ✅      | Nav items and routes are role-gated                                                                                 |


### Backend (Fastify BFF)


| Area                      | Status | Notes                                                                                                                                                               |
| ------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mock fulfillment routes   | ✅      | Full CRUD for VMs; read-only for templates, orgs, networks                                                                                                          |
| Upstream proxy (dev mode) | ✅      | `/api/fulfillment/v1/`*, `/api/events/v1/`*, `/api/osac/public/v1/*` — buffered passthrough + TLS upstream (`fulfillmentUpstream.ts`); **spec:** `docs/specs/backend-fulfillment.yaml` `bff_proxy_matrix_dev` |
| Health / readiness probes | ✅      | `/health` and `/ready`                                                                                                                                              |
| SPA static file serving   | ✅      | Serves `public/` in production; SPA fallback for client-side routing                                                                                                |
| CORS                      | ✅      | Open in dev, disabled in production                                                                                                                                 |
| Event stream endpoint     | ✅      | Mock: static JSON; **dev:** proxy `/api/events/v1/`* to fulfillment (buffered passthrough today — streaming follow-up per spec)                                                                            |
| Console access            | ✅      | Mock: stub URLs; **dev:** proxy `/api/osac/public/v1/`* to fulfillment                                                                                              |


### Shared libraries


| Library                                                          | Status |
| ---------------------------------------------------------------- | ------ |
| `@osac/api-contracts` — TypeScript types                         | ✅      |
| `@osac/api-contracts` — Mock data (VMs, templates, orgs, events) | ✅      |
| `@osac/ui-components` — `LightDarkToggle`                        | ✅      |
| `@osac/ui-components` — `VmStatusLabel`                          | ✅      |
| `@osac/ui-components` — `PlaceholderPage`                        | ✅      |
| `@osac/ui-components` — `NetworkTopologyPage`                    | ✅      |


---

## What needs real integration or further testing

Authoritative checklist for the **dev/real** integration target: `docs/specs/backend-fulfillment.yaml` → `**context.osac_real_api_integration`** (mock mode invariant is spelled out there). The following areas work in mock mode but require additional work before the SPA fully satisfies that contract:

### Authentication (highest priority)

- **Mock mode:** the institutional sign-in screen still simulates a short loading delay then sets `isLoggedIn = true` client-side (no real IdP).
- **Dev mode (partial):** when `GET /api/fulfillment/v1/capabilities` returns `authn.trustedTokenIssuers`, the sign-in flow can store a **pasted JWT access token** for `Authorization: Bearer` on BFF calls. This exercises upstream + Authorino when the cluster is wired correctly; it is not a full browser OIDC flow.
- **Integration needed:** Implement **Authorization Code + PKCE** against the issuer from capabilities; refresh / logout UX; attach the acquired token to all proxied BFF requests. See [Authorization](#authorization-dev-mode-and-fulfillment-rbac).
- The BFF passes `Authorization` through to the upstream in dev mode for proxied prefixes.

### Per-tenant data scoping

- In mock mode, all tenants share the same `vmStore` in the BFF process. A real environment must scope requests by tenant (namespace, org ID, or equivalent). The frontend passes no tenant identifier in API calls today.
- **Integration needed:** Add a tenant header or use tenant-namespaced API paths. The BFF proxy must enforce tenant isolation or delegate it to the upstream.

### VM power actions (PATCH)

- **My VMs:** Start / Stop / Restart call `PATCH` via `usePatchVm`. Pending badges via `useVmPowerActionDisplay` + `vmPowerPendingStore` (survives navigation). Power PATCH does not immediately refetch the list; pending actions poll every **10s**. Restart: **Restarting** → **Starting** → **running** per list GET (ignores stale terminal states).

### VM actions not in menu (clone / migrate)

- **Clone** and **Migrate** are not shown in `VmActionsMenu` until fulfillment supports them (UI commented with `RESTORE` markers). Create-from-template remains the supported wizard path.

### VM deletion

- **My VMs:** Delete in `VmActionsMenu` — confirm modal shows **Deleting** on confirm (`usePendingVmDeletes`). If not stopped, **PATCH stop** then `DELETE`. Card removed when list GET omits the VM (not on first server `deleting` state).

### VM creation — request body shape

- `createComputeInstance()` POSTs **ComputeInstance** JSON at the **root** (the gateway rejects a top-level `"object"` key). The body is built with `serializeComputeInstanceForCreate()` (proto JSON / snake_case). The mock BFF may still accept `{ "object": … }` for local tests.

### Quota page

- `AdminQuotaPage` displays static quota numbers from `libs/api-contracts/src/mock-data.ts`. There is no API call.
- **Integration needed:** Add a `/api/private/v1/quota` endpoint in the BFF and a `useQuota()` hook in the frontend.

### Users page

- `AdminUsersPage` shows a hardcoded list of demo users from mock data. There is no user management API.
- **Integration needed:** Add user list / invite / remove endpoints (private API) and wire the page to them.

### Real-time events / SSE

- **Spec (dev mode):** Dashboard and full-page recent activities **SHOULD** use fulfillment’s `GET /api/events/v1/events` (Events watch) with the BFF proxying that path when `OSAC_API_MODE=dev`, same Authorization passthrough as `/api/fulfillment/v1/`*. See `docs/specs/backend-fulfillment.yaml` (`context.osac_bff_runtime_modes`, flow `tenant-user-dashboard-activities`).
- **Current code:** The BFF proxies `/api/events/v1/`* in dev mode; in mock mode it still returns a static JSON array. The frontend does not yet open an `EventSource` / stream consumer against the live watch.
- **Integration needed:** Implement SSE or chunked stream handling and consume it in the dashboard + recent-activities pages per the spec.

### Network topology — real data

- `NetworkTopologyPage` groups VMs by their `spec.subnet` field. In mock data these are populated. A real environment must return `spec.subnet` (or equivalent) from the upstream.
- Test with real VMs to verify grouping logic.

### E2E tests — coverage

- Three Cypress specs exist: `welcome-and-role-selection`, `institutional-sign-in`, `application-shell-session`. They cover the happy path only.
- **Needed:** Specs for VM CRUD, wizard steps, admin flows, provider flows, and error states.

### Storybook

- `libs/ui-components` is configured for Storybook but no story files (`.stories.tsx`) exist.
- **Needed:** Stories for `LightDarkToggle`, `VmStatusLabel`, `PlaceholderPage`, `NetworkTopologyPage`.

### Placeholder pages

- Several sidebar nav items navigate to routes that render `<PlaceholderPage />`:
  - `/admin/storage` — Storage
  - `/admin/org-settings` — Organization settings
  - `/admin/security` — Security & Compliance (tenant)
  - `/provider/allocation` — Resource allocation
  - `/provider/security` — Security & Compliance (provider)
  - `/provider/settings` — Platform settings

---

## Build and container

### Production build (SPA + BFF compiled)

```bash
pnpm build
```



This runs `tsc` on the backend and `vite build` on the frontend. The SPA output lands in `apps/app-backend/public/` so the BFF can serve it.

### Container image

```bash
# Build
podman build -t osac:latest -f Containerfile .

# Run in mock mode
podman run --rm -p 8080:8080 -e OSAC_API_MODE=mock osac:latest

# Run in dev/proxy mode
podman run --rm -p 8080:8080 \
  -e OSAC_API_MODE=dev \
  -e FULFILLMENT_API_URL=https://fulfillment.your-env.example.com \
  osac:latest
```

The container exposes port `8080`. The BFF serves the SPA at `/` and the API at `/api/*`.

---

## OpenShift deployment

Manifests live in `deploy/dev/` and `deploy/integration/`.

```bash
# Create namespace
oc new-project osac-dev

# Apply all manifests
oc apply -f deploy/dev/

# Watch rollout
oc rollout status deployment/osac -n osac-dev
```

The `configmap.yaml` in each environment folder controls `OSAC_API_MODE`, `FULFILLMENT_API_URL`, and `LOG_LEVEL`. Edit it before applying to switch between mock and real API modes.

To expose the service externally:

```bash
oc expose svc/osac -n osac-dev
oc get route osac -n osac-dev
```

---

## Workspace scripts reference

Run all scripts from the **repo root**:


| Script                     | Description                                                 |
| -------------------------- | ----------------------------------------------------------- |
| `pnpm dev:backend`         | Start BFF in mock mode with hot-reload (`tsx watch`)        |
| `pnpm dev:frontend`        | Start Vite dev server with HMR on `:5173`                   |
| `pnpm build`               | Production build for all packages                           |
| `pnpm lint`                | ESLint across all packages                                  |
| `pnpm check:pf-primitives` | Guardrail: disallowed raw HTML for layout in `app-frontend` |
| `pnpm test`                | Vitest unit tests across all packages                       |
| `pnpm storybook`           | Start Storybook for `@osac/ui-components`                   |
| `pnpm build-storybook`     | Build static Storybook                                      |
| `pnpm e2e:ci`              | Run Cypress E2E tests headlessly                            |


---

## Project structure

```
libs/api-contracts/src/
  types.ts          # All shared TypeScript interfaces (ComputeInstance, ClusterTemplate, …)
  mock-data.ts      # Fixture data — VMs, templates, orgs, users, quota, events
  index.ts          # Re-exports everything

apps/app-frontend/src/
  App.tsx           # Routes: /, /sign-in, /* → AppShell when logged in
  api/
    client.ts       # Typed fetch functions → /api/fulfillment/v1/*
    hooks.ts        # TanStack Query hooks (useComputeInstances, useComputeInstanceTemplates, …)
  contexts/
    SessionContext.tsx  # Auth state, tenant/role, theme, topology handoff, persona selection
  pages/
    auth/
      WelcomePage.tsx     # Role columns + org entry (welcome-and-role-selection)
      SignInPage.tsx      # Wraps InstitutionalSignInPage (institutional-sign-in)
      index.ts            # Barrel re-exports
    shell/
      AppShell.tsx        # Authenticated chrome + nested routes
      ShellMasthead.tsx   # Masthead, sovereignty strip, toolbar, user menu
      ShellSidebar.tsx    # Role-based nav (see shellNav.ts)
      ShellBreadcrumb.tsx
      shellNav.ts         # Nav model per role
      shellRoutes.ts      # Placeholder routes for admin/provider
      index.ts
    tenant/               # Tenant user surfaces (VMaaS)
      DashboardPage.tsx, VmListPage.tsx, CatalogPage.tsx, RecentActivitiesPage.tsx
      index.ts
    admin/                # Tenant admin
      AdminDashboardPage.tsx, AdminUsersPage.tsx, AdminQuotaPage.tsx, AdminNetworksPage.tsx
      index.ts
    provider/             # Provider admin
      ProviderAdminDashboardPage.tsx, ProviderTenantOrgsPage.tsx, ProviderInfraTopologyPage.tsx
      index.ts
  components/
    layout/
      PageHeader.tsx      # Shared page title + optional description + actions
      index.ts
    dashboard/            # Tenant dashboard tiles / metrics (where used)
    login/
      InstitutionalSignInPage.tsx  # Single sign-in shell; uses institutionalBranding.ts
      LoginForm.tsx                # Shared email/password form
      institutionalBranding.ts     # Per-tenant strings and trusted-issuer copy
    vm/
      CreateVmWizard.tsx           # Modal orchestrator + ref handle (open / template / clone)
      createVmWizard/              # Wizard steps, types, constants, stepIds
      VmDetailDrawer.tsx, VmTable.tsx, VmActionsMenu.tsx, TemplateCard.tsx, …

apps/app-backend/src/
  index.ts          # Fastify listen — assertFulfillmentDevReady, buildApp
  startupConfig.ts # OSAC_API_MODE=dev requires valid FULFILLMENT_API_URL
  fulfillmentUpstream.ts # Undici Agent for FULFILLMENT_TLS_CA_FILE / TEMP_FULFILLMENT_TLS_INSECURE
  app.ts            # buildApp() — composable app for tests + production
  bff-contract.*.test.ts  # Vitest inject() — mock + dev proxy contract (see backend-fulfillment bff_test_harness)
  routes/
    fulfillmentProxyConfig.ts # Shared proxy route options (fulfillmentFetch, static bearer)
    fulfillment.ts  # /api/fulfillment/v1/* — mock + proxy
    upstreamProxy.ts # buffered passthrough to FULFILLMENT_API_URL (dev); fulfillmentUpstream.ts TLS Agent
    events.ts       # /api/events/v1/* — mock + proxy
    console.ts      # /api/osac/public/v1/* — mock + proxy
```

**Routing recap:** `App.tsx` imports shell and auth pages from `pages/shell` and `pages/auth`. Logged-in routes live under `AppShell` (`pages/shell/AppShell.tsx`) and map to `tenant/`*, `admin/`*, and `provider/*` paths per role (see `docs/specs/ui-flows/application-shell-session.yaml` for the canonical matrix).