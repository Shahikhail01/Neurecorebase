# Deployment — Procedures

**Last Updated:** 2026-06-30
**Last Verified:** 2026-06-30
**Audience:** All engineers deploying to production

---

## Overview

All services are deployed to Contabo VPS (109.123.248.253). The deployment process uses rsync to sync source code and builds on the server.

---

## Deploy Scripts

Main deployment script: `/home/najeeb/Linux-Dev/neurecore-base/neurecore/deployment/scripts/deploy-all.sh`

```bash
cd /home/najeeb/Linux-Dev/neurecore-base/neurecore/deployment/scripts
./deploy-all.sh [eaos|admin|both]
```

---

## Deploy All (Both Frontends + LiteSpeed Reload)

```bash
./deploy-all.sh both
```

This:
1. Rsyncs frontend-eaos source to Contabo
2. Builds frontend-eaos on Contabo
3. Rsyncs frontend-admin source to Contabo
4. Builds frontend-admin on Contabo
5. Restarts PM2 processes
6. Reloads LiteSpeed
7. Runs health checks

---

## Deploy EAOS Only

```bash
./deploy-all.sh eaos
```

---

## Deploy Admin Only

```bash
./deploy-all.sh admin
```

---

## Backend Deploy (Manual)

### 1. Sync Source

```bash
rsync -avz \
  --exclude='node_modules' --exclude='dist' --exclude='.next' \
  --exclude='tsconfig.tsbuildinfo' --exclude='.env.local' \
  /home/najeeb/Linux-Dev/neurecore-base/neurecore/backend/src/ \
  contabo:/opt/neurecore/backend/backend/src/

rsync -avz /home/najeeb/Linux-Dev/neurecore-base/neurecore/backend/prisma/ \
  contabo:/opt/neurecore/backend/backend/prisma/
```

### 2. Apply Migrations

```bash
ssh contabo 'cd /opt/neurecore/backend/backend && \
  export $(grep -v "^#" .env | grep -E "DATABASE_URL|DATABASE_URL_UNPOOLED" | xargs) && \
  ./node_modules/.bin/prisma migrate deploy'
```

### 3. Generate Prisma Client

```bash
ssh contabo 'cd /opt/neurecore/backend/backend && \
  export $(grep -v "^#" .env | grep -E "DATABASE_URL|DATABASE_URL_UNPOOLED" | xargs) && \
  ./node_modules/.bin/prisma generate'
```

### 4. Build

```bash
ssh contabo 'cd /opt/neurecore/backend/backend && \
  ./node_modules/.bin/nest build'
```

### 5. Restart

```bash
ssh contabo 'pm2 restart neurecore-backend && sleep 12'
```

### 6. Verify

```bash
curl -s http://127.0.0.1:3003/api/v1/health
```

---

## Frontend Deploy (Manual)

### 1. Rsync Source

```bash
rsync -avz \
  --exclude='node_modules' --exclude='.next' --exclude='tsconfig.tsbuildinfo' \
  --exclude='.env.local' --exclude='.vercel' \
  /home/najeeb/Linux-Dev/neurecore-base/neurecore/frontend-eaos/ \
  contabo:/opt/neurecore/frontend-eaos/
```

### 2. Install & Build

```bash
ssh contabo 'cd /opt/neurecore/frontend-eaos && \
  npm install --legacy-peer-deps --include=dev && \
  NEXT_PUBLIC_API_URL=https://brain.neurecore.com/api/v1 \
    NEXT_PUBLIC_APP_NAME=NeureCore \
    NEXT_PUBLIC_APP_VERSION=1.0.0 \
    NEXT_PUBLIC_DEFAULT_THEME=dark \
  npm run build'
```

### 3. Restart Next.js

```bash
# Kill existing process on port 3011
ssh contabo 'pkill -f "next-server.*3011" || true; sleep 2'

# Start fresh
ssh contabo 'cd /opt/neurecore/frontend-eaos && \
  node node_modules/.bin/next start --hostname 127.0.0.1 --port 3011 &'

# Or use PM2 (create a wrapper script to avoid PM2 arg parsing issues)
ssh contabo 'pm2 delete neurecore-eaos 2>/dev/null || true; \
  echo "#!/bin/bash\ncd /opt/neurecore/frontend-eaos\nexec node node_modules/.bin/next start --hostname 127.0.0.1 --port 3011" > /opt/neurecore/frontend-eaos/start.sh && \
  chmod +x /opt/neurecore/frontend-eaos/start.sh && \
  pm2 start /opt/neurecore/frontend-eaos/start.sh --name neurecore-eaos && pm2 save'
```

---

## Health Checks

After any deploy, verify:

```bash
# Backend
curl -s http://127.0.0.1:3003/api/v1/health

# EAOS
curl -sk --resolve hq.neurecore.com:443:109.123.248.253 \
  https://hq.neurecore.com/ | grep -oE "NeureCore|EAOS"

# Admin
curl -sk --resolve cc.neurecore.com:443:109.123.248.253 \
  https://cc.neurecore.com/admin/login | grep -oE "Login|Admin"

# Metrics
curl -s http://127.0.0.1:3003/api/metrics | head -5
```

---

## Pre-Deploy Checklist

- [ ] Run linting locally
- [ ] Run tests locally
- [ ] Verify build succeeds locally
- [ ] Check disk space on Contabo (`df -h /opt/neurecore`)
- [ ] Check PM2 status (`pm2 list`)
- [ ] Note current git commit

---

## Post-Deploy Checklist

- [ ] Health check passes
- [ ] Logs show no errors
- [ ] Features work as expected
- [ ] No new console errors

---

## Related Documents

- `02-contabo-operations.md` — Contabo-specific operations
- `03-rollback.md` — Rollback procedures
- `04-environments.md` — Environment variables
