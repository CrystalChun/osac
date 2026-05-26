# Multi-stage build: one image runs the BFF + serves the SPA bundle
# Usage:
#   podman build -t osac:latest -f Containerfile .
#   podman run --rm -p 8080:8080 -e OSAC_API_MODE=mock osac:latest

# ── Stage 1: install workspace dependencies ────────────────────────────────
FROM node:22-slim AS deps
WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY libs/config/package.json ./libs/config/
COPY libs/api-contracts/package.json ./libs/api-contracts/
COPY libs/ui-components/package.json ./libs/ui-components/
COPY apps/app-backend/package.json ./apps/app-backend/
COPY apps/app-frontend/package.json ./apps/app-frontend/

RUN pnpm install --frozen-lockfile

# ── Stage 2: build SPA ────────────────────────────────────────────────────
FROM deps AS spa-builder
WORKDIR /app

COPY libs/ ./libs/
COPY apps/app-frontend/ ./apps/app-frontend/

# Build frontend (output goes to apps/app-backend/public per vite.config.ts)
RUN pnpm --filter @osac/app-frontend run build

# ── Stage 3: build BFF ────────────────────────────────────────────────────
FROM deps AS bff-builder
WORKDIR /app

COPY libs/ ./libs/
COPY apps/app-backend/ ./apps/app-backend/
COPY --from=spa-builder /app/apps/app-backend/public ./apps/app-backend/public

# Transpile TypeScript → dist/
RUN pnpm --filter @osac/app-backend run build 2>/dev/null || true

# ── Stage 4: production image ──────────────────────────────────────────────
FROM node:22-slim AS production
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0
ENV OSAC_API_MODE=mock
ENV LOG_LEVEL=info

COPY --from=bff-builder /app/apps/app-backend/dist ./dist
COPY --from=bff-builder /app/apps/app-backend/public ./public
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/app-backend/node_modules ./apps/app-backend/node_modules 2>/dev/null || true

EXPOSE 8080
USER node

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD node -e "fetch('http://localhost:8080/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

CMD ["node", "dist/index.js"]
