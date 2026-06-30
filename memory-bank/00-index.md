# NeureCore — Memory Bank Index

**Status:** Production Baseline (2026-06-30)
**Purpose:** Single authoritative source of truth for all future development, deployment, operations, troubleshooting, and maintenance.
**Supersedes:** All previous Memory Bank documentation (archived in `memory-bank-ARCHIVED/`)

---

## Document Structure

```
memory-bank/
├── 00-index.md                     ← This file
├── 00-system-state.md              ← Executive summary of current production system
│
├── infrastructure/
│   ├── 01-infrastructure.md        ← Contabo VPS topology, directory layout
│   ├── 02-litespeed.md            ← LiteSpeed configuration, vhosts, reverse proxy
│   ├── 03-dns.md                  ← DNS configuration, records, cutover history
│   └── 04-ssl.md                  ← SSL/TLS certificates, Let's Encrypt, renewal
│
├── backend/
│   ├── 01-backend.md               ← NestJS backend architecture, modules, runtime
│   ├── 02-api.md                  ← API contracts, versioning, endpoints
│   ├── 03-database.md             ← Prisma schema, migrations, Neon PostgreSQL
│   └── 04-ai-platform.md          ← AI integrations, tool registry, orchestrator
│
├── frontend-eaos/
│   └── 01-frontend-eaos.md         ← EAOS tenant frontend architecture
│
├── frontend-admin/
│   └── 01-frontend-admin.md         ← Admin console frontend architecture
│
├── security/
│   ├── 01-authentication.md        ← Cookie-based auth, JWT, session management
│   ├── 02-csrf.md                 ← CSRF protection, double-submit pattern
│   └── 03-rbac.md                ← Role-based access control, permissions
│
├── deployment/
│   ├── 01-deployment.md            ← Deployment procedures, scripts, workflow
│   ├── 02-contabo-operations.md   ← Contabo server operations, PM2 management
│   ├── 03-rollback.md              ← Rollback procedures, disaster recovery
│   └── 04-environments.md         ← Environment variables, configuration
│
├── observability/
│   ├── 01-observability.md         ← Prometheus, Grafana, Alertmanager setup
│   └── 02-monitoring.md           ← Metrics, alerts, dashboards
│
├── reference/
│   ├── 01-known-issues.md         ← Known bugs, limitations, workarounds
│   ├── 02-technical-debt.md       ← Technical debt, future improvements
│   ├── 03-decision-log.md         ← Architectural decisions, rationale
│   └── 04-development-standards.md ← Code standards, patterns, conventions
│
└── troubleshooting/
    └── 01-troubleshooting.md       ← Common issues, diagnostic commands, fixes
```
memory-bank/
├── 00-index.md                     ← This file
├── 00-system-state.md              ← Executive summary of current production system
│
├── infrastructure/
│   ├── 01-infrastructure.md        ← Contabo VPS topology, directory layout
│   ├── 02-litespeed.md            ← LiteSpeed configuration, vhosts, reverse proxy
│   ├── 03-dns.md                  ← DNS configuration, records, cutover history
│   └── 04-ssl.md                  ← SSL/TLS certificates, Let's Encrypt, renewal
│
├── backend/
│   ├── 01-backend.md               ← NestJS backend architecture, modules, runtime
│   ├── 02-api.md                  ← API contracts, versioning, endpoints
│   ├── 03-database.md             ← Prisma schema, migrations, Neon PostgreSQL
│   └── 04-ai-platform.md          ← AI integrations, tool registry, orchestrator
│
├── frontend-eaos/
│   └── 01-frontend-eaos.md         ← EAOS tenant frontend architecture
│
├── frontend-admin/
│   └── 01-frontend-admin.md         ← Admin console frontend architecture
│
├── security/
│   ├── 01-authentication.md        ← Cookie-based auth, JWT, session management
│   ├── 02-csrf.md                 ← CSRF protection, double-submit pattern
│   └── 03-rbac.md                 ← Role-based access control, permissions
│
├── deployment/
│   ├── 01-deployment.md            ← Deployment procedures, scripts, workflow
│   ├── 02-contabo-operations.md   ← Contabo server operations, PM2 management
│   ├── 03-rollback.md              ← Rollback procedures, disaster recovery
│   └── 04-environments.md         ← Environment variables, configuration
│
├── observability/
│   ├── 01-observability.md         ← Prometheus, Grafana, Alertmanager setup
│   └── 02-monitoring.md           ← Metrics, alerts, dashboards
│
├── reference/
│   ├── 01-known-issues.md         ← Known bugs, limitations, workarounds
│   ├── 02-technical-debt.md       ← Technical debt, future improvements
│   ├── 03-decision-log.md         ← Architectural decisions, rationale
│   └── 04-development-standards.md ← Code standards, patterns, conventions
│
└── troubleshooting/
    └── 01-troubleshooting.md       ← Common issues, diagnostic commands, fixes
```

---

## Quick Facts (Verified Production State — 2026-06-30)

| Component | Location | Port | Status |
|---|---|---|---|
| Backend (NestJS) | Contabo `/opt/neurecore/backend/backend/` | 3003 | ✅ Online |
| frontend-eaos (Next.js 16) | Contabo `/opt/neurecore/frontend-eaos/` | 3011 | ✅ Online |
| frontend-admin (Next.js 15) | Contabo `/opt/neurecore/frontend-admin/` | 3020 | ✅ Online |
| LiteSpeed (Reverse Proxy) | Contabo | 80/443 | ✅ Online |
| Prometheus | Contabo Docker | 9090 | ✅ Online |
| Alertmanager | Contabo Docker | 9093 | ✅ Online |
| Grafana | Contabo Docker | 3200 | ✅ Online |
| Redis | Contabo | 6379 | ✅ Online |
| Database | Neon PostgreSQL | 5432 | ✅ Online |

**DNS Records (All pointing to Contabo 109.123.248.253):**
- `hq.neurecore.com` → Contabo (EAOS tenant frontend)
- `cc.neurecore.com` → Contabo (Admin console)
- `brain.neurecore.com` → Contabo (API backend)

**PM2 Processes:**
- `neurecore-backend` — NestJS backend
- `neurecore-cors-proxy` — CORS proxy on 127.0.0.1:3004
- `neurecore-eaos` — EAOS frontend
- `neurecore-admin` — Admin frontend

---

## Reading Order for New Engineers

1. `00-system-state.md` — Production overview
2. `infrastructure/01-infrastructure.md` — Server topology
3. `backend/01-backend.md` — Backend architecture
4. `security/01-authentication.md` — Auth system
5. `deployment/01-deployment.md` — How to deploy
6. `troubleshooting/01-troubleshooting.md` — Common issues

---

## Document Version Policy

- Every document has a `Last Verified` date in its header
- Every document has a `Last Updated` date
- Production facts are verified against live Contabo server
- Code references are verified against local codebase at `/home/najeeb/Linux-Dev/neurecore-base/neurecore/`

---

**Last Updated:** 2026-06-30
**Source of Truth:** Verified against live Contabo production server (109.123.248.253)
