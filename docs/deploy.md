# Production deploy (EC2 + Docker + GHCR)

Pipeline: push to `main` → **CI** (lint, format, prisma, tests, docker build check)
→ **CD** (build & push `ghcr.io/<owner>/galleries_manager:sha-<short>` + `latest`,
copy stack files to EC2, run `scripts/deploy.sh`, health-gate `/api/v1/health`).

## One-time EC2 setup

```bash
# Ubuntu 22.04/24.04, Docker only — no Node/nvm/systemd needed
sudo apt update && sudo apt install -y docker.io docker-compose-plugin
sudo usermod -aG docker $USER   # re-login afterwards

sudo mkdir -p /opt/galleries_manager
sudo chown "$USER:$USER" /opt/galleries_manager

# Secrets file (0600, never committed — see .env.example for all keys)
cp .env.example /opt/galleries_manager/.env.prod
chmod 600 /opt/galleries_manager/.env.prod
nano /opt/galleries_manager/.env.prod   # set POSTGRES_PASSWORD, JWT_SECRET, RESEND_*, APP_URL, ...
```

Security group: open `22` (SSH, ideally your IP only) and `3000` (API, or `80/443` once a reverse proxy is added).

## GitHub configuration

Secrets (`Settings → Secrets and variables → Actions`):

| Secret          | Value                              |
| --------------- | ---------------------------------- |
| `EC2_HOST`      | EC2 public IP or hostname          |
| `EC2_USER`      | `ubuntu` (or your SSH user)        |
| `EC2_SSH_KEY`   | private key matching EC2 `~/.ssh/authorized_keys` |
| `EC2_SSH_PORT`  | optional, defaults to `22`         |

No registry credentials needed — GHCR uses the built-in `GITHUB_TOKEN`.
Protect `main`: require the **CI** workflow to pass before merge.
Optional manual approval: set the `production` environment to require reviewers.

## Operation

```bash
# On EC2 — status / logs
cd /opt/galleries_manager
docker compose -f docker-compose.prod.yml --env-file .env.prod ps
docker compose -f docker-compose.prod.yml --env-file .env.prod logs -f app

# Rollback to a previous image
IMAGE=ghcr.io/<owner>/galleries_manager:sha-<previous> ./scripts/deploy.sh

# Redeploy without a new build (Actions → CD → Run workflow → image_tag)
```

Backups: `pgdata` / `redisdata` / `uploads` are named volumes.
Snapshot them before risky changes: `docker run --rm -v galleries-manager-prod_pgdata:/data -v /backup:/backup ubuntu tar czf /backup/pgdata.tgz -C /data .`
