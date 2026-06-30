# NeureCore — Production System State

**Status:** Current Production Baseline (2026-06-30)
**Purpose:** Executive summary of the production system after One-Source Contabo Consolidation

---

## System Overview

NeureCore is an Enterprise AI Operating System (EAOS) hosted on a single Contabo VPS. The consolidation moved all services (backend and frontends) from Vercel/Contabo hybrid to Contabo-only deployment.

### Architecture Diagram

```
Internet
    │
    ▼
LiteSpeed Web Server (109.123.248.253:80/443)
    │
    ├──► hq.neurecore.com ──────► 127.0.0.1:3011 (neurecore-eaos)
    ├──► cc.neurecore.com ──────► 127.0.0.1:3020 (neurecore-admin)
    ├──► brain.neurecore.com ───► 127.0.0.1:3003 (neurecore-backend)
    │
    ▼
Contabo VPS (109.123.248.253)
    ├── PM2 (Process Manager)
    │   ├── neurecore-backend (port 3003)
    │   ├── neurecore-cors-proxy (port 3004)
    │   ├── neurecore-eaos (port 3011)
    │   └── neurecore-admin (port 3020)
    ├── Docker Containers
    │   ├── neurecore-prometheus (port 9090)
    │   ├── neurecore-alertmanager (port 9093)
    │   └── neurecore-grafana (port 3200)
    ├── Redis (port 6379)
    └── LiteSpeed
```

---

## Verified Production State (2026-06-30)

### Services

| Service | Version | Port | URL | Status |
|---|---|---|---|---|
| Backend (NestJS) | NestJS 11 | 3003 | https://brain.neurecore.com/api/v1 | ✅ Online |
| frontend-eaos | Next.js 16.2.9 | 3011 | https://hq.neurecore.com | ✅ Online |
| frontend-admin | Next.js 15 | 3020 | https://cc.neurecore.com/admin | ✅ Online |
| LiteSpeed | Enterprise | 80/443 | — | ✅ Online |
| Prometheus | v2.55.1 | 9090 | http://127.0.0.1:9090 | ✅ Online |
| Alertmanager | v0.27.0 | 9093 | http://127.0.0.1:9093 | ✅ Online |
| Grafana | 11.3.0 | 3200 | http://127.0.0.1:3200 | ✅ Online |
| Redis | — | 6379 | 127.0.0.1:6379 | ✅ Online |

### PM2 Processes

```
neurecore-backend      online  (NestJS backend, port 3003)
neurecore-cors-proxy   online  (CORS proxy, port 3004)
neurecore-eaos         online  (EAOS frontend, port 3011)
neurecore-admin        online  (Admin frontend, port 3020)
```

### DNS Records (All → 109.123.248.253)

| Domain | Type | Value | Purpose |
|---|---|---|---|
| hq.neurecore.com | A | 109.123.248.253 | EAOS tenant frontend |
| cc.neurecore.com | A | 109.123.248.253 | Admin console |
| brain.neurecore.com | A | 109.123.248.253 | API backend |

### SSL/TLS

- Let's Encrypt certificates for all three domains
- Auto-renewal configured via LiteSpeed ACME
- Certificates stored at `/etc/letsencrypt/live/{domain}/`

### Database

- **Provider:** Neon PostgreSQL
- **Connection:** Pooled via `DATABASE_URL`, direct via `DATABASE_URL_UNPOOLED`
- **Prisma Client:** Version 5.22.0
- **Migrations:** Applied via `prisma migrate deploy`

### AI Integrations

- **MiniMax API** — Primary LLM provider
- **Google AI** — Gemini integration
- **Brevo** — Email/SMTP relay

---

## Frontend Stack

### frontend-eaos
- **Framework:** Next.js 16.2.9 + Turbopack + React 19
- **UI:** Tailwind CSS 3.4, Tremor, Lucide icons
- **Data:** TanStack Query 5, Zustand (UI state only)
- **Auth:** Cookie-based (httpOnly, Secure, SameSite=Strict)
- **API:** REST + SSE + Socket.IO

### frontend-admin
- **Framework:** Next.js 15 (App Router)
- **UI:** Tailwind CSS, Radix UI, Recharts
- **Auth:** Cookie-based (shared with EAOS)
- **basePath:** `/admin`

---

## Backend Stack

- **Framework:** NestJS 11
- **Database:** Prisma 5.22.0 + Neon PostgreSQL
- **Cache:** Upstash Redis + local Redis
- **Auth:** Passport JWT + httpOnly cookies
- **API:** REST with OpenAPI 3.1 (Swagger)
- **Metrics:** Prometheus via `/api/metrics`

### Key Backend Modules

| Module | Purpose |
|---|---|
| `agents` | AI agent management |
| `ai-actions` | AI action orchestration |
| `auth` | Authentication, JWT, sessions |
| `chat` | Real-time chat |
| `departments` | Organization structure |
| `entities` | Entity/workspace management |
| `knowledge` | RAG pipeline |
| `marketplace` | Solution marketplace |
| `models` | AI model configuration |
| `orchestration` | LangGraph orchestration |
| `routines` | Routine/script execution |
| `tenants` | Multi-tenant management |
| `tools` | Tool registry, execution |
| `users` | User management |

---

## Deployment

### Local Development
```bash
# Backend
cd /home/najeeb/Linux-Dev/neurecore-base/neurecore/backend
npm run start:dev

# frontend-eaos
cd /home/najeeb/Linux-Dev/neurecore-base/neurecore/frontend-eaos
npm run dev

# frontend-admin
cd /home/najeeb/Linux-Dev/neurecore-base/neurecore/frontend-admin
npm run dev
```

### Production Deploy
```bash
cd /home/najeeb/Linux-Dev/neurecore-base/neurecore/deployment/scripts
./deploy-all.sh [eaos|admin|both]
```

---

## Observability

| Service | URL | Credentials |
|---|---|---|
| Prometheus | http://127.0.0.1:9090 | — |
| Grafana | http://127.0.0.1:3200 | admin / neurecore-obs-2026 |
| Alertmanager | http://127.0.0.1:9093 | — |

### Key Metrics
- `neurecore_ai_action_invocations_total` — AI action call count
- `neurecore_ai_action_duration_seconds` — AI action latency
- `neurecore_ai_action_tokens_total` — Token usage
- `neurecore_ai_action_cost_usd_total` — Cost tracking

---

## Known Issues

1. **CSRF exemptions incomplete** — Only `/api/v1/auth/login` and `/api/v1/auth/refresh` are CSRF-exempt; `/register` and `/google` require CSRF tokens
2. **`defaultBudgetPerDay` column missing** — Tier budget column absent in database (planned migration)

---

## Directory Structure

```
/opt/neurecore/
├── backend/
│   └── backend/                 # NestJS application
│       ├── src/                 # TypeScript source
│       ├── dist/                # Compiled JavaScript
│       ├── prisma/              # Schema + migrations
│       └── node_modules/         # Dependencies
├── frontend-eaos/               # EAOS frontend (Next.js 16)
├── frontend-admin/               # Admin frontend (Next.js 15)
├── observability/               # Docker Compose (Prometheus, Grafana, Alertmanager)
└── deployment/                  # Deployment scripts
```

---

**Last Verified:** 2026-06-30
**Verified By:** Live inspection of Contabo production server
