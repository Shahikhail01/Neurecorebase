# Infrastructure — Contabo VPS

**Last Updated:** 2026-06-30
**Last Verified:** 2026-06-30 (live inspection)
**Audience:** Any engineer working on infrastructure, deployment, or recovery

---

## Server Details

| Property | Value |
|---|---|
| **Hostname** | Contabo VPS |
| **IP Address** | 109.123.248.253 |
| **SSH** | `ssh contabo` (alias in `~/.ssh/config`) |
| **SSH User** | root |
| **SSH Port** | 22 (default) |
| **Operating System** | Linux |

---

## Directory Structure

```
/opt/neurecore/                          # Main application directory
├── backend/
│   └── backend/                         # NestJS backend root
│       ├── src/                         # TypeScript source (synced from local)
│       ├── dist/                        # Compiled JavaScript (PM2 runs this)
│       ├── prisma/
│       │   ├── schema.prisma            # Database schema
│       │   └── migrations/              # Prisma migrations
│       ├── node_modules/                 # Dependencies (NEVER upload from local)
│       ├── .env                          # Production secrets (DO NOT overwrite)
│       ├── .env.production               # Template
│       ├── openapi/
│       │   └── openapi.json              # Generated OpenAPI spec
│       └── package.json
├── frontend-eaos/                       # EAOS frontend (Next.js 16)
│   ├── src/
│   ├── .next/
│   └── package.json
├── frontend-admin/                      # Admin frontend (Next.js 15)
│   ├── src/
│   ├── .next/
│   └── package.json
├── observability/                       # Docker observability stack
│   ├── docker-compose.yml
│   ├── prometheus/
│   │   ├── prometheus.yml
│   │   └── alerts.yml
│   ├── alertmanager/
│   │   └── alertmanager.yml
│   ├── grafana/
│   │   ├── provisioning/
│   │   └── dashboards/
│   └── scripts/
│       └── smoke.sh
├── deployment/                          # Shared deployment scripts
│   └── scripts/
│       └── deploy-all.sh                # Main deploy script
└── _archives/                           # Legacy archived files
```

---

## Port Allocation

| Port | Service | Protocol | Owner | Purpose |
|---|---|---|---|---|
| 80 | LiteSpeed | HTTP | LiteSpeed | HTTP, ACME challenges |
| 443 | LiteSpeed | HTTPS | LiteSpeed | HTTPS termination |
| 3003 | neurecore-backend | TCP | PM2 | NestJS API backend |
| 3004 | neurecore-cors-proxy | TCP | PM2 | CORS proxy |
| 3011 | neurecore-eaos | TCP | PM2 | EAOS frontend |
| 3020 | neurecore-admin | TCP | PM2 | Admin frontend |
| 6379 | redis-server | TCP | Redis | Local cache |
| 9090 | prometheus | HTTP | Docker | Prometheus metrics |
| 9093 | alertmanager | HTTP | Docker | Alertmanager |
| 3200 | grafana | HTTP | Docker | Grafana dashboards |

**Ports NOT in use (free):** 3000, 3001, 3002, 3010, 3100, 5000

---

## LiteSpeed Virtual Hosts

```
/usr/local/lsws/conf/vhosts/
├── brain.neurecore.com/          # API backend proxy
├── hq.neurecore.com/             # EAOS frontend proxy
├── cc.neurecore.com/             # Admin frontend proxy
├── shahisoftware.com/            # ShahiSoftware (other tenant)
├── gec5.com/                     # GEC5 (other tenant)
├── ecoearthshop.com/             # EcoEarthShop (other tenant)
├── lifeosa.online/               # LifeOSA (other tenant)
└── [other tenants...]
```

---

## PM2 Process Management

### Active NeureCore Processes

```bash
ssh contabo 'pm2 list'
```

| ID | Name | Port | Status | Uptime |
|---|---|---|---|---|
| 22 | neurecore-backend | 3003 | online | ~4h |
| 7 | neurecore-cors-proxy | 3004 | online | ~14D |
| 26 | neurecore-eaos | 3011 | online | ~4h |
| 24 | neurecore-admin | 3020 | online | ~5h |

### PM2 Logs

```
/root/.pm2/logs/
├── neurecore-backend-out.log
├── neurecore-backend-error.log
├── neurecore-eaos-out.log
├── neurecore-eaos-error.log
├── neurecore-admin-out.log
└── neurecore-admin-error.log
```

### PM2 Commands

```bash
# View all processes
ssh contabo 'pm2 list'

# View specific process
ssh contabo 'pm2 show neurecore-backend'

# View logs
ssh contabo 'pm2 logs neurecore-backend --lines 50'

# Restart process
ssh contabo 'pm2 restart neurecore-backend'

# Stop process
ssh contabo 'pm2 stop neurecore-backend'

# Save PM2 state
ssh contabo 'pm2 save'
```

---

## Docker Services

Observability runs as Docker containers with `network_mode: host`:

```bash
ssh contabo 'docker ps'
```

| Container | Image | Ports | Purpose |
|---|---|---|---|
| neurecore-prometheus | prom/prometheus:v2.55.1 | 9090 | Metrics collection |
| neurecore-alertmanager | prom/alertmanager:v0.27.0 | 9093 | Alert routing |
| neurecore-grafana | grafana/grafana:11.3.0 | 3200 | Dashboards |

### Docker Commands

```bash
# View all containers
ssh contabo 'docker ps'

# View container logs
ssh contabo 'docker logs neurecore-prometheus --tail 50'

# Restart observability stack
ssh contabo 'cd /opt/neurecore/observability && docker compose restart'

# View compose status
ssh contabo 'cd /opt/neurecore/observability && docker compose ps'
```

---

## Disk Space

```bash
ssh contabo 'df -h /opt/neurecore'
```

Minimum 5GB free required for deployments. Two frontend builds consume ~800MB combined.

---

## Node.js

- **System Node:** 20.20.2
- **Backend Runtime:** Node 20.20.2 (no engines constraint)
- **Frontend Builds:** Node 22.20.0 (via nvm)
- **nvm available:** Yes (for frontend builds)

---

## Security Notes

- SSH access via key-based authentication only
- `.env` files contain secrets — never commit or expose
- LiteSpeed runs as privileged user
- Docker containers run in host network mode

---

## Related Documents

- `02-litespeed.md` — LiteSpeed configuration, vhosts
- `03-dns.md` — DNS configuration
- `04-ssl.md` — SSL/TLS certificates
- `../deployment/02-contabo-operations.md` — Operations procedures
