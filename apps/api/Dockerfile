# syntax=docker/dockerfile:1
# PreSeedHealer API image.
# Build from the REPO ROOT (the API needs the npm workspace packages):
#   docker build -f apps/api/Dockerfile -t preseedhealer-api .

ARG NODE_VERSION=22

# ── 1. Build: install all deps (incl. tsup) and bundle the API ──────────────
FROM node:${NODE_VERSION}-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY packages/types/package.json packages/types/
COPY packages/tsconfig/package.json packages/tsconfig/
RUN npm ci --include=dev --workspace @preseedhealer/api --include-workspace-root

COPY packages ./packages
COPY apps/api ./apps/api
RUN npm run build --workspace @preseedhealer/api

# ── 2. Prod deps only (workspace packages are bundled into dist by tsup) ────
FROM node:${NODE_VERSION}-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY packages/types/package.json packages/types/
COPY packages/tsconfig/package.json packages/tsconfig/
RUN npm ci --omit=dev --workspace @preseedhealer/api --ignore-scripts \
  && npm cache clean --force \
  && mkdir -p apps/api/node_modules

# ── 3. Runtime ──────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION}-alpine AS runtime
ENV NODE_ENV=production \
    PORT=4000 \
    UPLOAD_DIR=/var/data/uploads
WORKDIR /app/apps/api

COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/apps/api/node_modules ./node_modules
COPY --from=build /app/apps/api/dist ./dist
COPY apps/api/package.json ./

# Runs as root so it can write to a mounted persistent disk (Render disks are root-owned).
RUN mkdir -p "$UPLOAD_DIR"

EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/api/v1/health" >/dev/null || exit 1

CMD ["node", "--enable-source-maps", "dist/server.js"]
