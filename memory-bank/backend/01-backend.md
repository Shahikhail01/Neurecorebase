# Backend — NestJS Application

**Last Updated:** 2026-06-30
**Last Verified:** 2026-06-30 (live inspection)
**Audience:** Backend engineers, API developers, deployment engineers

---

## Overview

NestJS 11 backend serving the NeureCore API. Runs on Contabo at `127.0.0.1:3003`, proxied via LiteSpeed at `https://brain.neurecore.com/`.

```
Location: /opt/neurecore/backend/backend/
Port: 3003
Runtime: Node 20.20.2
PM2: neurecore-backend
```

---

## Quick Commands

```bash
# SSH to Contabo
ssh contabo

# View backend logs
pm2 logs neurecore-backend --lines 50

# Check health
curl -s http://127.0.0.1:3003/api/v1/health

# Check metrics
curl -s http://127.0.0.1:3003/api/metrics

# Restart backend
pm2 restart neurecore-backend

# Rebuild backend
cd /opt/neurecore/backend/backend && ./node_modules/.bin/nest build
```

---

## Module Structure

```
backend/src/
├── modules/
│   ├── agents/                # AI agent management
│   ├── ai-actions/            # AI action orchestration
│   ├── ai-gateway/            # AI provider routing
│   ├── analytics/             # Analytics, forecasting
│   ├── audit/                 # Audit logging
│   ├── auth/                  # Authentication, JWT
│   ├── chat/                  # Real-time chat
│   ├── connectors/            # External connectors
│   ├── costs/                 # Cost tracking
│   ├── departments/           # Organization structure
│   ├── department-templates/  # Department templates
│   ├── entities/              # Entity/workspace management
│   ├── events/                # Event system
│   ├── finance/               # Financial data
│   ├── goals/                 # Goal tracking
│   ├── governance/            # Governance policies
│   ├── health/                # Health checks
│   ├── inbox/                 # Inbox/messages
│   ├── integrations/          # Third-party integrations
│   ├── knowledge/             # RAG pipeline, knowledge bases
│   ├── marketplace/           # Solution marketplace
│   ├── memory/                # Agent memory
│   ├── metrics/               # Prometheus metrics
│   ├── mission-feed/          # Activity feed
│   ├── models/                # AI model configuration
│   ├── notifications/         # Notification system
│   ├── observability/         # Observability config
│   ├── onboarding/            # User onboarding
│   ├── orchestration/         # LangGraph orchestration
│   ├── projects/              # Project management
│   ├── reliability/           # Reliability features
│   ├── retail/                # Retail vertical
│   ├── routines/              # Routine/script execution
│   ├── security/              # Security features
│   ├── settings/              # User/tenant settings
│   ├── solution-packs/        # Solution pack management
│   ├── tenants/              # Multi-tenant management
│   ├── tiers/                # Pricing tiers
│   ├── tools/                # Tool registry, execution
│   └── users/                # User management
├── common/
│   ├── auth/                  # Cookie auth, CSRF
│   ├── context/               # Tenant context
│   ├── decorators/            # Custom decorators
│   ├── dto/                   # Shared DTOs
│   ├── feature-flag/           # Feature flags
│   ├── filters/               # Exception filters
│   ├── guards/                # Auth guards
│   ├── interceptors/          # Response/audit interceptors
│   ├── logging/               # Logging service
│   ├── middleware/            # Custom middleware
│   ├── responses/             # Response wrappers
│   └── types/                 # Shared types
├── config/                     # Configuration module
├── infrastructure/
│   ├── cache/                 # Redis cache
│   ├── database/              # Prisma service
│   └── tracing/               # OpenTelemetry tracing
└── shared/                     # Shared utilities
```

---

## Key Endpoints

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/v1/health` | GET | No | Health check |
| `/api/v1/health/ready` | GET | No | Readiness check (DB connected) |
| `/api/v1/health/live` | GET | No | Liveness check |
| `/api/v1/auth/login` | POST | No | Login |
| `/api/v1/auth/register` | POST | No | Registration |
| `/api/v1/auth/refresh` | POST | No | Token refresh |
| `/api/v1/auth/me` | GET | Yes | Current user |
| `/api/v1/agents` | GET/POST | Yes | List/create agents |
| `/api/v1/tools` | GET | Yes | List tools |
| `/api/v1/metrics` | GET | No | Prometheus metrics |
| `/api/docs` | GET | No | Swagger UI |

---

## Configuration

### Environment Variables

Critical environment variables at `/opt/neurecore/backend/backend/.env`:

```
NODE_ENV=production
PORT=3003
BACKEND_PORT=3003
API_PREFIX=/api/v1

TENANT_FRONTEND_URL=https://hq.neurecore.com
ADMIN_FRONTEND_URL=https://cc.neurecore.com

DATABASE_URL=...Neon pooled...
DATABASE_URL_UNPOOLED=...Neon direct...
POSTGRES_URL=...
POSTGRES_PRISMA_URL=...
DATABASE_POOL_SIZE=...
DATABASE_CONNECTION_TIMEOUT=...
DATABASE_STATEMENT_TIMEOUT=...

REDIS_URL=...local redis...
UPSTASH_REDIS_URL=...
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...

JWT_SECRET=...32+ chars...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=...

BREVO_API_KEY=...
MINIMAX_API_KEY=...
MINIMAX_MODEL=...
```

### CORS Configuration

CORS origins in `main.ts`:
```typescript
const defaultOrigins = [
  'http://localhost:3001',
  'http://localhost:3002',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:3002',
  'https://hq.neurecore.com',
  'https://cc.neurecore.com',
];
```

---

## Authentication

### Cookie-Based Auth (Primary)

The backend uses httpOnly cookies as the sole authentication mechanism:

| Cookie | Purpose | Flags |
|---|---|---|
| `__Host-nc_at` | Access token | httpOnly, Secure, SameSite=Strict |
| `__Host-nc_rt` | Refresh token | httpOnly, Secure, SameSite=Strict |
| `__Host-nc_csrf` | CSRF token | httpOnly, Secure, SameSite=Strict |

**Note:** `__Host-` prefix requires HTTPS and prevents subdomain cookie theft.

### CSRF Protection

CSRF middleware is enabled globally. Exempted endpoints:
- `/api/v1/auth/login`
- `/api/v1/auth/refresh`

Other mutating endpoints require `X-CSRF-Token` header.

---

## Database

- **ORM:** Prisma 5.22.0
- **Database:** Neon PostgreSQL (cloud)
- **Migrations:** Applied via `prisma migrate deploy`
- **Schema:** At `prisma/schema.prisma`

### Prisma Commands

```bash
cd /opt/neurecore/backend/backend

# Generate Prisma client
export $(grep -v "^#" .env | grep -E "DATABASE_URL|DATABASE_URL_UNPOOLED" | xargs)
./node_modules/.bin/prisma generate

# Check migration status
export $(grep -v "^#" .env | grep -E "DATABASE_URL|DATABASE_URL_UNPOOLED" | xargs)
./node_modules/.bin/prisma migrate status

# Apply migrations
export $(grep -v "^#" .env | grep -E "DATABASE_URL|DATABASE_URL_UNPOOLED" | xargs)
./node_modules/.bin/prisma migrate deploy
```

---

## Observability

### Prometheus Metrics

Endpoint: `http://127.0.0.1:3003/api/metrics`

Metrics exported:
- `neurecore_ai_action_invocations_total{status, actionId}`
- `neurecore_ai_action_duration_seconds{actionId}`
- `neurecore_ai_action_tokens_total{direction, actionId}`
- `neurecore_ai_action_cost_usd_total{model, actionId}`
- `neurecore_ai_action_errors_total{actionId, errorType}`
- `neurecore_node_*` — Node.js default metrics

---

## Build & Deploy

### Build on Contabo

```bash
cd /opt/neurecore/backend/backend
./node_modules/.bin/nest build
```

### Restart

```bash
pm2 restart neurecore-backend
sleep 12
curl -s http://127.0.0.1:3003/api/v1/health
```

---

## OpenAPI

OpenAPI 3.1 spec is generated at boot and saved to:
```
/opt/neurecore/backend/backend/openapi/openapi.json
```

Swagger UI: `https://brain.neurecore.com/api/docs`

---

## Related Documents

- `02-api.md` — API contracts, endpoints
- `03-database.md` — Prisma schema, migrations
- `../security/01-authentication.md` — Auth system
- `../deployment/02-contabo-operations.md` — Contabo procedures
