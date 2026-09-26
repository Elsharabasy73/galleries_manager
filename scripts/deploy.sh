#!/usr/bin/env bash
# Idempotent production deploy for a single EC2 host.
# Runs ON EC2 (called by the CD workflow via SSH).
# Required env: IMAGE=ghcr.io/<owner>/galleries_manager:<tag>
# Required file: /opt/galleries_manager/.env.prod (0600, never committed)
set -euo pipefail
cd /opt/galleries_manager

: "${IMAGE:?IMAGE must be set, e.g. ghcr.io/<owner>/galleries_manager:sha-abcdefg}"
if [ ! -f .env.prod ]; then
  echo "ERROR: .env.prod not found. Create it first (see .env.example)." >&2
  exit 1
fi

# shellcheck disable=SC1091
PORT="$(grep -E '^PORT=' .env.prod | cut -d= -f2 | tail -n1)"
PORT="${PORT:-3000}"

export IMAGE
echo "==> Deploying $IMAGE"

echo "==> Pulling images"
docker compose -f docker-compose.prod.yml --env-file .env.prod pull

echo "==> Starting postgres + redis"
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d postgres redis

echo "==> Waiting for postgres + redis to be healthy"
for i in $(seq 1 30); do
  if docker compose -f docker-compose.prod.yml --env-file .env.prod ps postgres redis \
    | grep -q "healthy"; then
    break
  fi
  sleep 2
  if [ "$i" = 30 ]; then
    echo "ERROR: postgres/redis did not become healthy" >&2
    docker compose -f docker-compose.prod.yml --env-file .env.prod ps
    exit 1
  fi
done

echo "==> Running Prisma migrations (one-off container)"
docker compose -f docker-compose.prod.yml --env-file .env.prod run --rm app \
  npx prisma migrate deploy

echo "==> Starting app"
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d app

echo "==> Health gate: /api/v1/health"
for i in $(seq 1 30); do
  if curl -fsS "http://127.0.0.1:${PORT}/api/v1/health" >/dev/null; then
    echo "==> Healthy"
    break
  fi
  sleep 2
  if [ "$i" = 30 ]; then
    echo "ERROR: app did not become healthy" >&2
    docker compose -f docker-compose.prod.yml --env-file .env.prod ps
    docker compose -f docker-compose.prod.yml --env-file .env.prod logs --tail=100 app
    exit 1
  fi
done

echo "==> Pruning dangling images"
docker image prune -f >/dev/null || true
echo "==> Deployment complete: $IMAGE"
