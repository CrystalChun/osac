# OSAC runbook

## Local development

1. `pnpm install`
2. `OSAC_API_MODE=mock pnpm --filter @osac/app-backend run dev`
3. `pnpm --filter @osac/app-frontend run dev`
4. Open `http://localhost:5173`

### BFF mode matrix (`OSAC_API_MODE`)

| Mode   | `FULFILLMENT_API_URL` | Behavior |
|--------|------------------------|----------|
| `mock` | ignored                | Mock handlers only |
| `dev`  | required (http(s) URL) | Proxy fulfillment, events, and osac public prefixes to that base URL |
| `dev`  | missing / invalid      | BFF exits at startup with an error |

Example real-upstream dev session:

```bash
OSAC_API_MODE=dev \
FULFILLMENT_API_URL=https://<fulfillment-host>/api \
pnpm --filter @osac/app-backend run dev
```

### TLS to private PKI (BFF → cluster)

- **Recommended:** set `FULFILLMENT_TLS_CA_FILE` to a PEM bundle the BFF trusts for the fulfillment gateway (include issuing CA, not leaf-only).
- **TEMP dev only:** `TEMP_FULFILLMENT_TLS_INSECURE=1` disables TLS verification for that upstream (like `curl -k`). Refused when `NODE_ENV=production`.

### TEMP bearer (until institutional sign-in)

- **BFF:** `TEMP_FULFILLMENT_STATIC_BEARER` — upstream receives `Authorization: Bearer …` only when the browser request has no real Bearer token. **Exception:** it is **not** sent on `GET /api/fulfillment/v1/capabilities` so OIDC discovery matches unauthenticated `curl` (some gateways return an empty body if a Kubernetes SA JWT is sent on that route). If other routes return **401** while capabilities still works, the browser may still be sending an **expired** `Authorization` header (sessionStorage); set **`TEMP_FULFILLMENT_STATIC_BEARER_FORCE=1`** (dev only) so the static bearer replaces it on proxied routes except that GET.
- **SPA (dev):** `VITE_DEV_BEARER_TOKEN` in `.env` (see `apps/app-frontend/.env.example`) — used only when session storage has no token.

### CORS / origins

Default local flow is **same-origin**: the SPA calls `/api` on the Vite dev server, which proxies to the BFF; the BFF calls the cluster. The browser does not need CORS against the cluster for that path. Vite also proxies `/health` and `/ready` to the BFF for dev checks.

### Public API contract (Buf)

The API contract and generated SDKs live at [buf.build/osac-project/public-api](https://buf.build/osac-project/public-api). **This repo uses REST over the BFF proxy** until the live gateway is confirmed to expose Connect/gRPC-Web end-to-end; then you can adopt the Buf Connect client on the wire that matches the gateway.

### Spec note

In dev mode, dashboard activities should use fulfillment `GET /api/events/v1/events` (BFF proxy — see `docs/specs/backend-fulfillment.yaml` `osac_bff_runtime_modes`).

## Storybook

- Run: `pnpm storybook`
- Build static: `pnpm build-storybook`

## Validation

- Lint: `pnpm lint`
- Test: `pnpm test`
- Build: `pnpm build`
- E2E: `pnpm e2e:ci`

### Real fulfillment proxy (manual smoke)

1. Start BFF with `OSAC_API_MODE=dev`, valid `FULFILLMENT_API_URL`, and either `FULFILLMENT_TLS_CA_FILE` or `TEMP_FULFILLMENT_TLS_INSECURE=1` (local dev only).
2. `curl -sS http://localhost:3001/api/fulfillment/v1/capabilities` (with `-H "Authorization: Bearer …"` if the gateway requires it, or set `TEMP_FULFILLMENT_STATIC_BEARER` and omit the header).
3. Confirm the JSON is from the gateway, not mock fixtures (for example compare with mock `GET /api/fulfillment/v1/capabilities` under `OSAC_API_MODE=mock`).
4. Start the SPA with Vite; confirm the browser calls same-origin `/api/...` only (no direct cluster origin in the Network tab).

## Container

- `podman build -t osac:latest -f Containerfile .`
- `podman run --rm -p 8080:8080 osac:latest`

## OpenShift

- Apply manifests from `deploy/dev` or `deploy/integration`.
