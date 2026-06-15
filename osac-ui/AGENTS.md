# osac-ui

OSAC web console — VM-as-a-Service frontend for OpenShift. pnpm monorepo with React 19 + PatternFly 6 (frontend) and a Go chi reverse proxy (BFF with OIDC authentication).

## Critical Rules

- **PatternFly 6** is the design system — prefer PatternFly components, tokens, and utilities over custom markup
- **TypeScript strict mode** — no enums, use string unions or const maps; prefer interfaces over type aliases for public props
- **One component per file** — keep page files focused on composition and data wiring; extract subcomponents
- **No inline styles** except for dynamic values that cannot be expressed in CSS
- **Named exports** for components and shared utilities
- **No `console.log`** — ESLint enforces this
- **Arrow function style** — `func-style: expression` is enforced

## Dev Environment

Prerequisites: Node.js 20+, pnpm 9+, Go 1.23+

```bash
pnpm install                   # Install dependencies

# Start development servers
FULFILLMENT_API_URL=https://... pnpm dev:proxy    # Go proxy on :8080
pnpm dev:frontend                                  # Vite on :5173

# Build
pnpm build                     # TypeScript check + Vite build + Go binary

# Test
pnpm test                      # Vitest unit tests
pnpm e2e:ci                    # Cypress E2E tests

# Lint and format
pnpm lint                      # ESLint + Prettier check
pnpm format                    # Prettier write

# Type generation
pnpm gen-types                 # Regenerate TS types from protobuf

# Validate PatternFly usage
pnpm check:pf-primitives

# Container build
podman build -t osac:latest -f Containerfile .
```

## Repository Structure

```text
osac-ui/
├── apps/
│   ├── app-frontend/          # React 19 SPA (Vite + TypeScript + PatternFly 6)
│   └── e2e/                   # Cypress end-to-end tests
├── libs/
│   ├── api-contracts/         # Shared TS types + wire normalizers
│   ├── types/                 # Generated types from protobuf (do not edit)
│   └── ui-components/         # Shared PatternFly 6 component library
├── proxy/                     # Go chi reverse proxy (OIDC auth + API forwarding)
├── deploy/
│   └── chart/                 # Helm chart for Kubernetes deployment
├── docs/
│   ├── specs/                 # Feature specs, statecharts, flow definitions
│   └── runbook.md             # Development and deployment instructions
├── scripts/                   # Helper scripts (PF validation, statechart graphs)
└── pnpm-workspace.yaml        # Workspace: apps/*, libs/*
```

### Workspace Packages

| Package | Purpose |
|---------|---------|
| `@osac/app-frontend` | React SPA — Vite, React 19, TanStack Query, react-router-dom 7 |
| `@osac/e2e` | Cypress E2E tests |
| `@osac/api-contracts` | Shared TS types + wire normalizers (single source of truth for API types) |
| `@osac/types` | Generated protobuf types (do not edit) |
| `@osac/ui-components` | Shared PatternFly 6 components (consumed at source, no build step) |

## Code Style

- **ESLint 9** + TypeScript-ESLint with strict rules
- **Prettier**: single quotes, trailing commas, 100 char print width, 2-space indent
- **Import sorting**: enforced by ESLint `sort-imports`
- **Arrow functions**: `prefer-arrow-callback` + `func-style: expression`
- **Unused vars**: error with `^_` ignore pattern

### TypeScript and React

- Use **TypeScript** with strict project settings; prefer **interfaces** over type aliases for public props; **avoid enums** — use string unions or const maps
- Prefer **functional components** and declarative patterns; use the `function` keyword for named pure helpers when it improves hoisting and stack traces
- Prefer **named exports** for components and shared utilities
- **One component per file**: split each meaningful component into its own file in the same feature area (e.g., `feature-name/SubView.tsx`); keep page files focused on composition, data wiring, and layout. Exception: a tiny non-exported helper may stay if the file remains short
- Do not add dependencies without aligning with existing stack and license policy; prefer patterns already present in the target package

### Styling

1. Prefer PatternFly CSS classes and utility classes
2. Avoid custom CSS files for routine UI — stay within PatternFly's supported customization paths
3. Use [Emotion `css`](https://emotion.sh/docs/css) only when PatternFly cannot express a layout — minimal, scoped
4. Never replace PatternFly tokens with arbitrary colors, spacing, or typography
5. Avoid inline styles (`style={{ ... }}`) except for dynamic values that cannot be expressed in CSS

### UI and Accessibility

- Base UI on [PatternFly 6](https://www.patternfly.org/) — layout, components, tokens, and patterns. For OpenShift-aligned UIs, also follow [OpenShift Console STYLEGUIDE.md](https://github.com/openshift/console/blob/main/STYLEGUIDE.md)
- Prefer accessible queries in tests and implementations: labels, roles, names — avoid `data-testid` unless the team standard requires it
- Meet keyboard and screen-reader expectations implied by the spec (focus order, labels, live regions for async errors)

### React Performance and `memo`

Treat memoization as an optimization, not a correctness tool:
- Do not rely on `memo` to fix broken behavior — fix purity, state placement, or data flow first
- Add `memo` only when justified: the child re-renders often with referentially stable props and its render work is measurably expensive
- `memo` does nothing if props are always new (inline objects/arrays/functions) — prefer narrower props, `children` as JSX, and local state
- Validate with React DevTools Profiler on a production build — reject memoization PRs without evidence
- Prefer structural fixes (state locality, simpler props) before adding `memo`/`useCallback`/`useMemo`
- If the repo enables [React Compiler](https://react.dev/learn/react-compiler), prefer compiler-driven memoization over manual `memo`

## Test

- **Unit tests**: Vitest + React Testing Library + jsdom
- **E2E tests**: Cypress (`apps/e2e/`)
- Assert what the user sees and does — prefer accessible queries (labels, roles, names)
- Cover happy path, loading, empty, and error states when the spec implies them
- Prefer stable, user-facing selectors over brittle DOM structure

## Specs and Traceability

- Implement and test only what documented acceptance criteria require; use stable IDs (`AC-1`, `AC-2`, …) in PR text and tie tests to ACs
- If the spec is ambiguous, do not invent product behavior — document assumptions in the PR or spec under _Open questions_
- Out-of-scope items from the spec must not appear as drive-by features

## Quality Bar

- Match existing formatting, import order, file layout, and naming in the touched package
- No broad refactors unrelated to the current spec; smallest diff that satisfies ACs
- Run linters and tests before considering work done; fix new violations you introduce

## Security

- No secrets, tokens, or credentials in source or tests; use existing env/config patterns
- Sanitize or escape user-controlled content per framework norms; validate inputs at trust boundaries
- Follow authz semantics described in architecture/specs — do not bypass checks for convenience

## Go Proxy

The Go reverse proxy handles OIDC authentication and forwards API requests to the fulfillment service.

| Env Var | Required | Description |
|---------|----------|-------------|
| `FULFILLMENT_API_URL` | Yes | Upstream API base URL |
| `PORT` | No | Listen port (default: 8080) |
| `OIDC_CLIENT_ID` | No | OIDC client ID (default: `osac-ui`) |
| `FULFILLMENT_TLS_CA_FILE` | No | Custom CA bundle path |
| `FULFILLMENT_TLS_INSECURE` | No | Skip TLS verification (dev only) |
| `TEMP_FULFILLMENT_STATIC_BEARER` | No | Inject Bearer token (dev only) |

Proxied paths: `/api/fulfillment/v1/*`, `/api/events/v1/*`, `/api/osac/public/v1/*`

## CI

GitHub Actions (`.github/workflows/`):
- **lint.yaml** — ESLint + Prettier (TS/TSX) + golangci-lint (Go proxy) on PRs
- **container-build.yaml** — `podman build` on PRs (no push)
- **publish-image.yaml** — build + push to `ghcr.io/` on main and `v*` tags
- **publish-charts.yaml** — Helm chart to GHCR on `v*` tags

## Documentation

| Area | Location |
|------|----------|
| Feature specs and acceptance criteria | `docs/specs/` |
| Statechart definitions (XState) | `docs/specs/statecharts/` |
| Development and deployment runbook | `docs/runbook.md` |
