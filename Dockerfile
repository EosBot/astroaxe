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
COPY --chown=node:node prisma ./prisma
COPY --chown=node:node prisma.config.ts ./prisma.config.ts
COPY --chown=node:node src/lib/config/read-secret.ts ./src/lib/config/read-secret.ts
# Migrar não exige root, e os outros estágios já rodam sem ele.
USER node
CMD ["npx", "prisma", "migrate", "deploy"]

FROM dependencies AS worker-runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
COPY . .
USER node
CMD ["node", "--import", "tsx", "src/worker.ts"]

# Ceremonial ingest: the only image that runs extraction tooling over the private archive.
# It is never part of the public stack, carries no database or Redis client, and runs with
# no network at all (see compose.ingest.yml), so the tools it holds cannot reach outward.
FROM dependencies AS ingest-runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    LC_ALL=C.UTF-8 \
    TESSDATA_PREFIX=/usr/share/tesseract-ocr/5/tessdata
# poppler-utils: pdftotext. tesseract-ocr plus language data: OCR for scanned pages and
# photographs. libarchive-tools: bsdtar, which streams one member out of an OOXML or
# OpenDocument container. The exact resolved versions are captured in the SBOM at scan
# time and recorded per derivative, so an upgrade invalidates derivatives instead of
# silently changing their text.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       poppler-utils \
       tesseract-ocr \
       tesseract-ocr-por \
       tesseract-ocr-eng \
       libarchive-tools \
    && rm -rf /var/lib/apt/lists/*
# A named volume inherits the ownership of the image path it covers. Creating it here as
# node:node is what lets the non-root, read-only container write derivatives at all — a
# root-owned volume would deny every write and look like a corrupt archive.
RUN mkdir -p /var/lib/ceremonial/derivatives \
    && chown -R node:node /var/lib/ceremonial
COPY --chown=node:node scripts ./scripts
COPY --chown=node:node src ./src
COPY --chown=node:node tsconfig.json package.json ./
USER node
ENTRYPOINT ["node", "--conditions=react-server", "--import", "tsx", \
            "scripts/extract-ceremonial-archive.ts"]

FROM dependencies AS development
WORKDIR /app
ENV NODE_ENV=development NEXT_TELEMETRY_DISABLED=1
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0"]
