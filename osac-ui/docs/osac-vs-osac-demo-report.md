# OSAC implementation comparison report

## Scope

This report compares the newly implemented `Projects/osac` app stack against the prototype behavior in `Projects/osac-demo`.

## Architecture differences

- `Projects/osac-demo` is a single frontend demo app, while `Projects/osac` is a pnpm monorepo with:
  - `apps/osac-backend` Fastify BFF
  - `apps/osac-frontend` React UI
  - `libs/api-contracts` shared API contracts
  - `libs/ui-components` shared PatternFly component library
  - `apps/e2e` Cypress suite
- `Projects/osac` adds explicit API mode isolation:
  - `dev` mode: fulfillment proxy
  - `mock` mode: full mock responses from BFF

## Flow coverage

`Projects/osac` now includes explicit flow registration and route mapping for all FLOW-INDEX IDs through:

- `apps/osac-frontend/src/shared/constants/flow-ids.ts`
- `apps/osac-frontend/src/shared/constants/flow-routes.ts`
- `apps/osac-frontend/src/flows/flow-registry.ts`

Each flow has dedicated machine/guard/transition files in `apps/osac-frontend/src/flows/*`.

## UI system differences

- `osac-demo` uses direct app-local UI composition.
- `osac` extracts reusable surfaces to `libs/ui-components` with colocated stories and PatternFly 6 primitives:
  - shell, nav, table, wizard, drawer, alerts, feedback, chart and activity components

## Test and deployment maturity

- `osac` adds workspace-level `typecheck`, `test`, `build`, and `lint` scripts.
- Backend and frontend unit tests pass in current workspace.
- Cypress specs are scaffolded per flow ID for traceability.
- Container and OpenShift manifests are added under `Containerfile`, `deploy/dev`, and `deploy/integration`.

## Gaps to close after scaffold

- Replace placeholder flow views with full behavior from each `docs/specs/ui-flows/*.yaml`.
- Expand backend proxy surface to full contract parity for all required fulfillment endpoints.
- Run full Cypress execution in CI/runtime environment with backend + frontend process orchestration.
