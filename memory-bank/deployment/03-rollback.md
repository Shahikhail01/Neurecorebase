# Deployment — Rollback & Disaster Recovery

**Last Updated:** 2026-06-30
**Last Verified:** 2026-06-30
**Audience:** Engineers performing rollback or recovery

---

## Quick Rollback

### PM2 Revert

PM2 maintains ecosystem file history. Use `pm2 revert`:

```bash
ssh contabo 'pm2 revert neurecore-backend'
ssh contabo 'pm2 revert neurecore-eaos'
ssh contabo 'pm2 revert neurecore-admin'
```

---

## Backend Rollback

### Option 1: PM2 Revert

```bash
ssh contabo 'pm2 revert neurecore-backend'
sleep 12
curl -s http://127.0.0.1:3003/api/v1/health
```

### Option 2: Restore dist from Backup

```bash
ssh contabo 'cd /opt/neurecore/backend/backend'
ssh contabo 'pm2 stop neurecore-backend'
ssh contabo 'rm -rf dist/'
ssh contabo 'tar -xzf /tmp/dist-backup-<DATE>.tar.gz'
ssh contabo 'pm2 start neurecore-backend'
sleep 12
```

### Option 3: Rebuild from Source

If source is still in sync:

```bash
ssh contabo 'cd /opt/neurecore/backend/backend && ./node_modules/.bin/nest build'
ssh contabo 'pm2 restart neurecore-backend'
sleep 12
```

---

## Frontend Rollback

### EAOS

```bash
ssh contabo 'pm2 revert neurecore-eaos'
```

Or redeploy previous version:
```bash
ssh contabo 'cd /opt/neurecore/frontend-eaos && git checkout <previous-commit>'
ssh contabo 'npm run build && pm2 restart neurecore-eaos'
```

### Admin

```bash
ssh contabo 'pm2 revert neurecore-admin'
```

---

## Database Rollback

**WARNING:** Database rollbacks are destructive. Only do if absolutely necessary.

### Revert Migration

```bash
ssh contabo 'cd /opt/neurecore/backend/backend'
ssh contabo 'export $(grep -v "^#" .env | grep -E "DATABASE_URL|DATABASE_URL_UNPOOLED" | xargs)'
ssh contabo './node_modules/.bin/prisma migrate resolve --rolled-back "<MIGRATION_NAME>"'
```

Note: Prisma has no automatic migrate down. Write a forward-only rollback migration.

### Restore from Backup

If Neon has point-in-time recovery:

1. Contact Neon support
2. Request PITR to specific timestamp
3. Verify data restored

---

## DNS Rollback

To revert DNS to Vercel:

```bash
# 1. Login to DNS provider
# 2. Change A records:
#    hq.neurecore.com    CNAME cname.vercel-dns.com
#    cc.necurecore.com   CNAME cname.vercel-dns.com
# 3. Wait for propagation
sleep 120
dig +short hq.neurecore.com
```

---

## Full Disaster Recovery

### Scenario: Complete Server Loss

1. Provision new Contabo VPS
2. Install dependencies (Node 20, npm, PM2, Docker)
3. Clone repositories from GitHub
4. Restore secrets from `.env` files (backup should exist)
5. Follow deployment procedures
6. Update DNS

### Scenario: Data Corruption

1. Stop backend to prevent further damage
2. Assess scope of corruption
3. Restore from Neon PITR if available
4. Restart backend
5. Verify data integrity

---

## Backup Strategy

### On Contabo

- PM2 ecosystem backups: `~/.pm2/dump.pm2`
- Database snapshots: `/opt/neurecore/db-snapshots/`

### On Neon

- Automatic PITR enabled
- Point-in-time recovery available

### Critical Files to Backup

- `/opt/neurecore/backend/backend/.env`
- `/opt/neurecore/backend/backend/dist/` (built)
- PM2 state

---

## Rollback Decision Tree

```
Issue detected
    │
    ├── Backend unhealthy?
    │   └── pm2 revert neurecore-backend
    │
    ├── EAOS unhealthy?
    │   └── pm2 revert neurecore-eaos
    │
    ├── Admin unhealthy?
    │   └── pm2 revert neurecore-admin
    │
    ├── LiteSpeed issues?
    │   └── lswsctrl restart
    │
    └── Database issues?
        └── Contact Neon support / PITR
```

---

## Related Documents

- `01-deployment.md` — Deployment procedures
- `02-contabo-operations.md` — Contabo operations
- `../observability/01-observability.md` — Observability
