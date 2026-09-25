# syntax=docker/dockerfile:1
# Multi-stage production image for galleries-manager (Node 24, Express, Prisma 7).
# Principles: small layers, reproducible installs, non-root runtime, proper
# signal handling (node directly, not npm), built-in HEALTHCHECK.

ARG NODE_VERSION=24-bookworm-slim

# ---------- deps: install all node_modules (cached unless manifests change) ----------
FROM node:${NODE_VERSION} AS deps
WORKDIR /app
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci

# ---------- build: generate Prisma Client (no DB connection needed) ----------
FROM node:${NODE_VERSION} AS build
WORKDIR /app
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json prisma.config.js ./
COPY prisma ./prisma
RUN npx prisma generate

# ---------- runner: production-only deps + app source ----------
FROM node:${NODE_VERSION} AS runner
ENV NODE_ENV=production
WORKDIR /app
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl wget \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json prisma.config.js ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY prisma ./prisma
COPY src ./src
COPY storage ./storage

RUN mkdir -p /app/storage/uploads/users /app/storage/uploads/galleries /app/storage/uploads/products \
  && chown -R node:node /app

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/v1/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

CMD ["node", "src/server.js"]
