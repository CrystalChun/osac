# osac-ui

Web console for the [Open Sovereign AI Cloud (OSAC)](https://github.com/osac-project/) project — a self-service platform for deploying OpenShift clusters, virtual machines, and bare metal hosts. pnpm monorepo with React 19 + PatternFly 6 (frontend) and a Go chi reverse proxy (BFF with OIDC authentication).

## Critical Rules

- **PatternFly 6** is the design system — prefer PatternFly components, tokens, and utilities over custom markup
- **TypeScript strict mode** — no enums, use string unions or const maps; prefer interfaces over type aliases for public props
- **One component per file** — keep page files focused on composition and data wiring; extract subcomponents
- **No inline styles** except for dynamic values that cannot be expressed in CSS
- **Default exports** for React components; **named exports** for everything else (utilities, hooks, types, constants)
- **No `console.log`** — ESLint enforces this
- **Arrow function style** — `func-style: expression` is enforced

## Dev Environment

Prerequisites: Node.js 20+, pnpm 9+, Go 1.23+

```bash
pnpm install                   # Install dependencies

# Start development servers
FULFILLMENT_API_URL=https://... pnpm dev    # Go proxy and Vite on :5173

# Build
pnpm build                     # TypeScript check + Vite build + Go binary

# Test
pnpm test                      # Vitest unit tests
pnpm e2e:ci                    # Cypress E2E tests

# Lint and format
pnpm lint                      # ESLint + Prettier + i18n sync check
pnpm format                    # Prettier write

# Type generation
pnpm gen-types                 # Regenerate TS types from protobuf

# Translations
pnpm i18n                      # Extract t() keys and update libs/i18n/locales/en/translation.json

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
│   ├── i18n/                  # Translation extraction config + generated locale files
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
| `@osac/i18n` | Translation extraction config (`i18next.config.ts`) + generated locale files |
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
- **Default exports** for React components; **named exports** for everything else (utilities, hooks, types, constants)
- **One component per file**: split each meaningful component into its own file in the same feature area (e.g., `feature-name/SubView.tsx`); keep page files focused on composition, data wiring, and layout. Exception: a tiny non-exported helper may stay if the file remains short
- Do not add dependencies without aligning with existing stack and license policy; prefer patterns already present in the target package

### Styling

1. Prefer PatternFly CSS classes and utility classes
2. Avoid custom CSS files for routine UI — stay within PatternFly's supported customization paths
3. Never replace PatternFly tokens with arbitrary colors, spacing, or typography
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

## Internationalization (i18n)

The app uses [i18next](https://www.i18next.com/) + [react-i18next](https://react.i18next.com/) with English string keys (the English text itself is the key). Translation files are generated by scanning source code for `t()` calls and `<Trans>` components.

### Generated file — do not edit by hand

`libs/i18n/locales/en/translation.json` is the single source of truth for translations. It is generated by `i18next-cli` and must not be edited manually. Update it by modifying source strings and running:

```bash
pnpm i18n
```

Commit the updated `translation.json` alongside the source changes. `pnpm lint` runs the same check in CI mode (`--ci`) and **fails if the file is out of sync** with the source.

### Using translations in components

Always import `useTranslation` from `@osac/ui-components/hooks/useTranslation` — never directly from `react-i18next`. ESLint enforces this.

```tsx
import { useTranslation } from '@osac/ui-components/hooks/useTranslation';

const MyComponent = () => {
  const { t } = useTranslation();
  return <h1>{t('Page title')}</h1>;
};
```

For pure (non-component) utilities that need translations, accept `t: TFunction` as a parameter (imported from `i18next`) and call `useTranslation` in the component that invokes them:

```ts
import type { TFunction } from 'i18next';

export const getLabels = (t: TFunction) => ({
  save: t('Save'),
  cancel: t('Cancel'),
});
```

### Rules

- **Good:** `t('This is OK', { someVar })` — hardcoded string key, extractable by the parser
- **Bad:** `t(usingAVariable)` — dynamic key, not extractable; the CI i18n check will not catch missing translations

### Translation files at runtime

`vite-plugin-static-copy` copies `libs/i18n/locales/` into the Vite build output (`dist/locales/`). The Go proxy serves these as static files. The i18next HTTP backend loads them at runtime from `/locales/{{lng}}/{{ns}}.json`.

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
| `PORT` | No | Listen port (default: `8080`) |
| `HOST` | No | Listen host (default: `0.0.0.0`) |
| `BASE_UI_URL` | No | Public base URL of the UI — used to compute the `/callback` redirect URI; derived from the SPA's `redirect_base` query parameter if unset |
| `OIDC_CLIENT_ID` | No | OIDC client ID (default: `osac-ui`) |
| `OIDC_TLS_CA_FILE` | No | Custom CA bundle for the OIDC IdP |
| `OIDC_TLS_INSECURE` | No | Skip TLS verification for the OIDC IdP (dev only) |
| `FULFILLMENT_TLS_CA_FILE` | No | Custom CA bundle for the fulfillment service |
| `FULFILLMENT_TLS_INSECURE` | No | Skip TLS verification for the fulfillment service (dev only) |

Proxied paths: `/api/fulfillment/v1/*`, `/api/events/v1/*`, `/api/osac/public/v1/*`

## CI

GitHub Actions (`.github/workflows/`):
- **lint.yaml** — ESLint + Prettier + i18n sync check (TS/TSX) + golangci-lint (Go proxy) on PRs
- **container-build.yaml** — `podman build` on PRs (no push)
- **publish-image.yaml** — build + push to `ghcr.io/` on main and `v*` tags
- **publish-charts.yaml** — Helm chart to GHCR on `v*` tags

## Documentation

| Area | Location |
|------|----------|
| Feature specs and acceptance criteria | `docs/specs/` |
| Statechart definitions (XState) | `docs/specs/statecharts/` |
| Development and deployment runbook | `docs/runbook.md` |
