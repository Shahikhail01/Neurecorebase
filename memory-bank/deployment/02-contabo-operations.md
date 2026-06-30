# Deployment — Contabo Operations

**Last Updated:** 2026-06-30
**Last Verified:** 2026-06-30
**Audience:** Engineers working on Contabo server

---

## SSH Access

```bash
ssh contabo
```

Alias configured in `~/.ssh/config`:
```
Host contabo
  HostName 109.123.248.253
  User root
  Port 22
```

---

## PM2 Management

### List All Processes

```bash
pm2 list
```

### View Specific Process

```bash
pm2 show neurecore-backend
pm2 show neurecore-eaos
pm2 show neurecore-admin
```

### View Logs

```bash
pm2 logs neurecore-backend --lines 50
pm2 logs neurecore-eaos --lines 50
pm2 logs neurecore-admin --lines 50
```

### Restart Process

```bash
pm2 restart neurecore-backend
pm2 restart neurecore-eaos
pm2 restart neurecore-admin
```

### Stop Process

```bash
pm2 stop neurecore-backend
```

### Save PM2 State

```bash
pm2 save
```

---

## Backend Operations

### Check Backend Health

```bash
curl -s http://127.0.0.1:3003/api/v1/health
```

### Check Backend Metrics

```bash
curl -s http://127.0.0.1:3003/api/metrics | head -10
```

### View Backend Logs

```bash
tail -50 /root/.pm2/logs/neurecore-backend-out.log
tail -50 /root/.pm2/logs/neurecore-backend-error.log
```

### Rebuild Backend

```bash
cd /opt/neurecore/backend/backend
./node_modules/.bin/nest build
pm2 restart neurecore-backend
```

### Restart Backend Only

```bash
pm2 restart neurecore-backend
sleep 12
curl -s http://127.0.0.1:3003/api/v1/health
```

---

## Frontend Operations

### Check EAOS

```bash
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3011/
```

### Check Admin

```bash
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3020/admin/login
```

### Restart EAOS

```bash
pm2 restart neurecore-eaos
```

**Note:** If EAOS fails to start (port conflict), start manually:
```bash
cd /opt/neurecore/frontend-eaos
node node_modules/.bin/next start --hostname 127.0.0.1 --port 3011 &
```

### Restart Admin

```bash
pm2 restart neurecore-admin
```

---

## Observability Operations

### Check Docker Containers

```bash
docker ps
```

### Check Prometheus

```bash
curl -s http://127.0.0.1:9090/-/ready
```

### Check Grafana

```bash
curl -s http://127.0.0.1:3200/api/health
```

### Check Alertmanager

```bash
curl -s http://127.0.0.1:9093/-/ready
```

### Restart Observability Stack

```bash
cd /opt/neurecore/observability
docker compose restart
```

### View Prometheus Logs

```bash
docker logs neurecore-prometheus --tail 50
```

### View Grafana Logs

```bash
docker logs neurecore-grafana --tail 50
```

### Run Smoke Test

```bash
cd /opt/neurecore/observability
bash scripts/smoke.sh
```

---

## LiteSpeed Operations

### Restart LiteSpeed

```bash
/usr/local/lsws/bin/lswsctrl restart
sleep 5
```

### Check LiteSpeed Status

```bash
/usr/local/lsws/bin/lswsctrl fullstatus
```

### Graceful Reload

```bash
/usr/local/lsws/bin/lswsctrl reload
```

---

## Directory Locations

| Service | Directory |
|---|---|
| Backend | `/opt/neurecore/backend/backend/` |
| EAOS | `/opt/neurecore/frontend-eaos/` |
| Admin | `/opt/neurecore/frontend-admin/` |
| Observability | `/opt/neurecore/observability/` |
| PM2 Logs | `/root/.pm2/logs/` |

---

## Disk Space

```bash
df -h /opt/neurecore
du -sh /opt/neurecore/backend/*
```

Minimum 5GB free required for deployments.

---

## Important Notes

### DO

- ✅ Use rsync for file transfers (not git pull)
- ✅ Build on Contabo (use its node_modules)
- ✅ Save PM2 state after changes (`pm2 save`)
- ✅ Check logs when things go wrong
- ✅ Verify health after restart

### DON'T

- ❌ Use `git pull` on Contabo (use rsync)
- ❌ Upload node_modules from local
- ❌ Use `pnpm` on Contabo (broken)
- ❌ Deploy on Fridays without rollback plan
- ❌ Skip health check after restart

---

## Related Documents

- `01-deployment.md` — Deployment procedures
- `03-rollback.md` — Rollback procedures
- `../observability/01-observability.md` — Observability stack
