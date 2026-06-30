# Troubleshooting Guide

**Last Updated:** 2026-06-30
**Last Verified:** 2026-06-30
**Audience:** All engineers

---

## Quick Diagnostics

### Check All Services

```bash
ssh contabo 'pm2 list'
ssh contabo 'curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3003/api/v1/health'
ssh contabo 'curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3011/'
ssh contabo 'curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3020/admin/login'
ssh contabo 'docker ps'
```

---

## Backend Issues

### Backend Not Responding

1. Check PM2 status:
   ```bash
   ssh contabo 'pm2 list | grep neurecore-backend'
   ```

2. Check logs:
   ```bash
   ssh contabo 'pm2 logs neurecore-backend --lines 50'
   ```

3. Restart backend:
   ```bash
   ssh contabo 'pm2 restart neurecore-backend && sleep 12'
   ```

4. Verify:
   ```bash
   curl -s http://127.0.0.1:3003/api/v1/health
   ```

### Port 3003 Already in Use

1. Find the process:
   ```bash
   ssh contabo 'lsof -i :3003'
   ```

2. Kill if orphaned:
   ```bash
   ssh contabo 'pkill -f "dist/src/main.js"'
   ```

3. Restart:
   ```bash
   ssh contabo 'pm2 restart neurecore-backend'
   ```

### Metrics Endpoint 404

The `/api/metrics` endpoint should work. If 404:

1. Check Express adapter setup in `main.ts`
2. Verify MetricsService is bootstrapped
3. Check for startup errors in logs

---

## Frontend Issues

### EAOS Returns 404

1. Check PM2:
   ```bash
   ssh contabo 'pm2 list | grep neurecore-eaos'
   ```

2. Check port:
   ```bash
   ssh contabo 'curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3011/'
   ```

3. Restart:
   ```bash
   ssh contabo 'pm2 restart neurecore-eaos'
   ```

### Admin Returns 404

1. Check LiteSpeed vhost config:
   ```bash
   ssh contabo 'cat /usr/local/lsws/conf/vhosts/cc.neurecore.com/vhost.conf'
   ```

2. Verify catch-all rewrite exists:
   ```apache
   RewriteRule ^(.*)$ http://neurecore_admin/$1 [P,L]
   ```

3. Restart LiteSpeed:
   ```bash
   ssh contabo '/usr/local/lsws/bin/lswsctrl restart'
   ```

### Static Assets 404

1. Check .next/static exists:
   ```bash
   ssh contabo 'ls /opt/neurecore/frontend-eaos/.next/standalone/.next/static/'
   ```

2. Copy if missing:
   ```bash
   ssh contabo 'cp -r /opt/neurecore/frontend-eaos/.next/static /opt/neurecore/frontend-eaos/.next/standalone/.next/'
   ```

---

## LiteSpeed Issues

### LiteSpeed Won't Restart

1. Check config syntax:
   ```bash
   ssh contabo '/usr/local/lsws/bin/lswsctrl fullstatus'
   ```

2. Check vhost configs:
   ```bash
   ssh contabo 'ls -la /usr/local/lsws/conf/vhosts/*/vhost.conf'
   ```

### Rewrite Rules Not Working

**Symptom:** `/login` returns 404 instead of proxying to `/admin/login`.

**Cause:** Missing `[P,L]` catch-all rule.

**Fix:** Add to rewrite rules:
```apache
RewriteRule ^(.*)$ http://neurecore_admin/$1 [P,L]
```

---

## Frontend-EAOS Chunk Loading Failures

### Symptom

Login page returns HTTP 500 for JS chunks (`/_next/static/chunks/*.js`). Browser console shows:
```
ChunkLoadError: Failed to load chunk
```

### Diagnosis

1. Check if chunks exist on server:
   ```bash
   ssh contabo 'ls /opt/neurecore/frontend-eaos/.next/static/chunks/ | head -10'
   ```

2. Check if Next.js process is running on correct port (3011):
   ```bash
   ssh contabo 'netstat -tlnp | grep 3011'
   ```

3. Check BUILD_ID matches:
   ```bash
   ssh contabo 'cat /opt/neurecore/frontend-eaos/.next/BUILD_ID'
   ```

### Causes & Fixes

**Cause 1: Multiple Next.js processes conflicting**

Stale processes on wrong ports cause LiteSpeed to proxy to wrong instance.

Fix:
```bash
ssh contabo 'pkill -9 -f "next-server"'
ssh contabo 'pkill -9 -f "3011"'
sleep 2
cd /opt/neurecore/frontend-eaos
node node_modules/.bin/next start --hostname 127.0.0.1 --port 3011 &
```

**Cause 2: Build has wrong API URL**

If API calls go to wrong URL (e.g., `localhost:3000`), chunks won't load properly.

Fix - rebuild on Contabo directly:
```bash
ssh contabo 'cd /opt/neurecore/frontend-eaos && rm -rf .next'
ssh contabo 'cd /opt/neurecore/frontend-eaos && NEXT_PUBLIC_API_URL=https://brain.neurecore.com/api/v1 npx next build'
ssh contabo 'cd /opt/neurecore/frontend-eaos && node node_modules/.bin/next start --hostname 127.0.0.1 --port 3011 &'
```

**Cause 3: PM2 port conflict**

PM2 may start process on wrong port or fail to bind.

Fix - start directly without PM2 for now:
```bash
ssh contabo 'cd /opt/neurecore/frontend-eaos && node node_modules/.bin/next start --hostname 127.0.0.1 --port 3011 &'
```

### Verify Fix

```bash
# Check chunks load
curl -s https://hq.neurecore.com/_next/static/chunks/3obfewke3_gct.js | head -c 100

# Should return JavaScript code, not 500
```

### Production Recommendation

Currently EAOS runs as a standalone process, not managed by PM2. For production resilience, set up proper PM2 configuration or systemd service.

---

## Database Issues

### Prisma Migration Failed

1. Check status:
   ```bash
   ssh contabo 'cd /opt/neurecore/backend/backend && \
     export $(grep -v "^#" .env | grep -E "DATABASE_URL|DATABASE_URL_UNPOOLED" | xargs) && \
     ./node_modules/.bin/prisma migrate status'
   ```

2. If pending migrations:
   ```bash
   ssh contabo 'cd /opt/neurecore/backend/backend && \
     export $(grep -v "^#" .env | grep -E "DATABASE_URL|DATABASE_URL_UNPOOLED" | xargs) && \
     ./node_modules/.bin/prisma migrate deploy'
   ```

### Database Connection Failed

1. Check DATABASE_URL:
   ```bash
   ssh contabo 'grep DATABASE_URL /opt/neurecore/backend/backend/.env'
   ```

2. Test connection:
   ```bash
   ssh contabo 'cd /opt/neurecore/backend/backend && \
     export $(grep -v "^#" .env | grep "DATABASE_URL" | head -1 | xargs) && \
     ./node_modules/.bin/prisma db execute --stdin <<< "SELECT 1"'
   ```

---

## Observability Issues

### Prometheus Not Scraping

1. Check Prometheus:
   ```bash
   ssh contabo 'curl -s http://127.0.0.1:9090/-/ready'
   ```

2. Check target:
   ```bash
   ssh contabo 'curl -s http://127.0.0.1:9090/api/v1/targets'
   ```

3. Check backend metrics:
   ```bash
   curl -s http://127.0.0.1:3003/api/metrics | head -5
   ```

### Grafana Not Loading

1. Check container:
   ```bash
   ssh contabo 'docker ps | grep grafana'
   ```

2. Check logs:
   ```bash
   ssh contabo 'docker logs neurecore-grafana --tail 50'
   ```

3. Restart:
   ```bash
   ssh contabo 'cd /opt/neurecore/observability && docker compose restart grafana'
   ```

### Smoke Test Failing

```bash
ssh contabo 'cd /opt/neurecore/observability && bash scripts/smoke.sh'
```

Check output for specific failures.

---

## Authentication Issues

### Login Not Working

1. Check cookies are set:
   - Open DevTools → Application → Cookies
   - Look for `__Host-nc_at`, `__Host-nc_rt`, `__Host-nc_csrf`

2. Check backend auth:
   ```bash
   curl -v -X POST https://brain.neurecore.com/api/v1/auth/login \
     -H 'Content-Type: application/json' \
     -d '{"email":"test@example.com","password":"Test123!"}'
   ```

3. Check CSRF:
   ```bash
   curl -X POST https://brain.neurecore.com/api/v1/agents \
     -H 'X-CSRF-Token: <token>' \
     -b '__Host-nc_at=<token>; __Host-nc_csrf=<token>'
   ```

### Token Expired

Tokens expire. Frontend should auto-refresh. If not:

1. Check refresh endpoint works
2. Check refresh token cookie
3. Clear cookies and re-login

---

## Disk Space Issues

### Disk Full

```bash
ssh contabo 'df -h /opt/neurecore'
```

Clean up:
```bash
# Remove old builds
ssh contabo 'rm -rf /opt/neurecore/frontend-eaos/.next'
ssh contabo 'rm -rf /opt/neurecore/frontend-admin/.next'

# Clean PM2 logs
ssh contabo 'pm2 flush'

# Docker cleanup
ssh contabo 'docker system prune -a'
```

---

## Emergency Contacts

For critical production issues:

1. Check logs first
2. Use PM2 revert if recent deploy
3. Restart affected service
4. Escalate if unresolved

---

## Related Documents

- `../deployment/02-contabo-operations.md` — Contabo operations
- `../deployment/03-rollback.md` — Rollback procedures
- `../observability/01-observability.md` — Observability stack
