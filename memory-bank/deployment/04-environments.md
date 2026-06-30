# Deployment — Environment Variables

**Last Updated:** 2026-06-30
**Last Verified:** 2026-06-30
**Audience:** Engineers managing configuration

---

## Overview

Environment variables are stored in `.env` files on Contabo. Never commit secrets to git.

---

## Backend Environment

**Location:** `/opt/neurecore/backend/backend/.env`

### Required Variables

```bash
# Application
NODE_ENV=production
PORT=3003
BACKEND_PORT=3003
API_PREFIX=/api/v1
LOG_LEVEL=info

# Frontend URLs
TENANT_FRONTEND_URL=https://hq.neurecore.com
ADMIN_FRONTEND_URL=https://cc.neurecore.com

# Database
DATABASE_URL=postgresql://user:pass@host/database?pool=true
DATABASE_URL_UNPOOLED=postgresql://user:pass@host/database
POSTGRES_URL=postgresql://user:pass@host/database
POSTGRES_PRISMA_URL=postgresql://user:pass@host/database
DATABASE_POOL_SIZE=...
DATABASE_CONNECTION_TIMEOUT=...
DATABASE_STATEMENT_TIMEOUT=...

# Redis
REDIS_URL=redis://127.0.0.1:6379
UPSTASH_REDIS_URL=...
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...

# Auth
JWT_SECRET=<32+ character secret>

# OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=https://brain.neurecore.com/api/v1/auth/google/callback

# Email
BREVO_API_KEY=...

# AI
MINIMAX_API_KEY=...
MINIMAX_MODEL=...
```

---

## Frontend Environment

### EAOS

**Build-time variables:**

```bash
NEXT_PUBLIC_API_URL=https://brain.neurecore.com/api/v1
NEXT_PUBLIC_APP_NAME=NeureCore
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_DEFAULT_THEME=dark
```

### Admin

```bash
NEXT_PUBLIC_API_URL=https://brain.neurecore.com/api/v1
NODE_ENV=production
```

---

## Observability Environment

**Location:** `/opt/neurecore/observability/.env`

```bash
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=neurecore-obs-2026
```

---

## Secret Management

### DO

- ✅ Store secrets in `.env` files on Contabo
- ✅ Use strong, random JWT_SECRET (32+ chars)
- ✅ Rotate secrets periodically
- ✅ Keep backups of `.env` files

### DON'T

- ❌ Commit `.env` files to git
- ❌ Log secrets
- ❌ Share secrets in Slack/email
- ❌ Use placeholder values in production

---

## Rotating Secrets

### JWT_SECRET

**WARNING:** Rotating JWT_SECRET logs everyone out immediately.

```bash
# 1. Generate new secret
openssl rand -base64 32

# 2. Update .env on Contabo
ssh contabo 'nano /opt/neurecore/backend/backend/.env'

# 3. Restart backend
ssh contabo 'pm2 restart neurecore-backend'

# 4. Verify
curl -s http://127.0.0.1:3003/api/v1/health
```

### BREVO_API_KEY

```bash
# 1. Get new key from Brevo dashboard
# 2. Update .env
ssh contabo 'nano /opt/neurecore/backend/backend/.env'

# 3. No restart needed (loaded at runtime)
```

---

## Related Documents

- `01-deployment.md` — Deployment procedures
- `02-contabo-operations.md` — Contabo operations
- `../security/01-authentication.md` — Auth secrets
