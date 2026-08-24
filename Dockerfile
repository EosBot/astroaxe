# syntax=docker/dockerfile:1.7
FROM node:24.19.0-bookworm-slim AS dependencies
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates openssl \
    && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci

FROM dependencies AS builder
WORKDIR /app
ARG SITE_URL=http://localhost
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    SITE_URL=${SITE_URL} \
    DATABASE_URL=postgresql://astroaxe:build-only@127.0.0.1:5432/astroaxe?schema=public
COPY . .
RUN npm run build

FROM node:24.19.0-bookworm-slim AS app-runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs --home-dir /app nextjs
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl --fail --silent http://127.0.0.1:3000/api/health/live >/dev/null || exit 1
CMD ["node", "server.js"]

FROM dependencies AS migrate-runner
WORKDIR /app
ENV NODE_ENV=production
COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts
COPY src/lib/config/read-secret.ts ./src/lib/config/read-secret.ts
CMD ["npx", "prisma", "migrate", "deploy"]

FROM dependencies AS worker-runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
COPY . .
USER node
CMD ["node", "--import", "tsx", "src/worker.ts"]

FROM dependencies AS development
WORKDIR /app
ENV NODE_ENV=development NEXT_TELEMETRY_DISABLED=1
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0"]
