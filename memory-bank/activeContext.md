# Active Context — NeureCore Development

## Last Updated

2026-06-26T16:08:00Z (Session 6 — AI Tool Calling deployed)

## Most Recent Operations (Session 6 — 2026-06-26)

**AI Tool Calling** ✅ Deployed to production
- `neurecore-base/neurecore` (git): commit `7708523b` — feat(agents): AI tool calling - MiniMax function calling + NeureCore tools
- Contabo `/opt/neurecore/backend/backend/`: synced via rsync, built with `npm run build`
- 8 tools implemented: createTask, createProject, listDepartments, listAgents, pauseAgent, resumeAgent, listTasks, getTenantSnapshot
- `OfficialAgentGraph.plannerNode` now calls `LLMFactory.invokeWithTools()` with tool definitions
- `ChatService.send()` routes action requests to LangGraph via `detectIntent()`
- Backend restarted (pid 333009), healthy — `GET /api/v1/health` returns 200

### Deploy Issues Fixed
- Added `invokeWithTools()` stubs to `DeepSeekClientService` and `MiMoClientService` (satisfy `ILLMClient` interface)
- Changed `TaskPriority.URGENT` → `CRITICAL` in neurecore-tools.ts (Prisma enum)
- Fixed type predicate in tools.module.ts (cast filter result as `IStructuredTool[]`)

See `memory-bank/ai-tool-calling-implementation-plan.md` for full details.

## Previous Operations (Session 5 — 2026-06-26)

**MiniMax M2.5 Upgrade** ✅ Deployed to production
- `neurecore-base/neurecore` (git): `minimax-client.service.ts` + `model-routing.service.ts` updated
- Contabo `/opt/neurecore/backend/backend/`: same files edited directly (no git on Contabo)
- Default model: `MiniMax-M2.5`; base URL: `api.minimaxi.com/v1`
- `.env` on Contabo already had `MINIMAX_MODEL=MiniMax-M2.5` + correct API key
- Backend restarted (pid 270856), healthy — `HTTP 200` in ~1.2s on smoke test

See `memory-bank/production-deployment-log.md` Session 5 for full details.

## Previous Operations (Session 4 — 2026-06-26)

**Phase 2 R2 — Add/Detail UI** ✅ Shipped to production
- 5 create forms, 5 detail pages, 5 inspectors, 2 primitives
- Backend: User.departmentId + assign/unassign endpoints + costs per-dept
- Migration `20260626_user_department` applied to Neon

**Phase 3 — Dashboard Performance** ✅ Shipped to production
- JWT blacklist LRU + 500ms timeout race (was 5s/request → <1ms cache hit)
- N+1 fix in /agents (100 agents → 1 query instead of ~101)
- New `/command-center/summary` endpoint (single round-trip with 12 sub-queries)
- Frontend rewired: 7 parallel requests → 1
- **Measured: 12-14s → 1.5-2s (7-8× speedup)**

**Status:** Both backend (Contabo pid 255248) and frontend (Vercel auto-deploy in progress) live.

**Current residual latency:** ~850ms Contabo → Neon round-trip. Out of scope for this round; revisit if user complaints persist.

See `memory-bank/production-deployment-log.md` Session 4 and `memory-bank/phase12-perf-implementation-summary.md` for full details.

## Contabo Migration (NEW)

**See**: `docs/CONTABO_MIGRATION_PLAN.md` for full implementation plan.

- **Contabo** → PostgreSQL 16 + Redis 7 for all production workloads
- **Neon** → Development branching only (dev experiments)
- **Upstash** → To be replaced by Contabo Redis
- **Local Docker** → To be removed after Contabo is fully tested

### Contabo Server (Verified via SSH — March 30, 2026)

- **OS**: Ubuntu 24.04.3 LTS, 11GB RAM, 96GB disk
- **PostgreSQL**: 16.13, `neurecore_prod` (29 tables) + `neurecore_dev` (36 tables)
- **Redis**: 7.0.15, no password, no AOF — **needs hardening**
- **Security Issues**: Redis no pass, open pg_hba, superuser ownership

## Current Infrastructure Status (Dev — Docker)

### Backend (NestJS API)

- **Status**: ✅ Running on `http://localhost:3000`
- **Health Check**: `GET /api/v1/health` → 200 OK
- **Database**: PostgreSQL connected
- **Cache**: Redis connected
- **Initialized Modules**: All 30+ modules loaded successfully
  - AuthModule, TenantsModule, UsersModule, AgentsModule
  - RoutinesModule, GoalsModule, ProjectsModule
  - FinanceModule, CostsModule, ObservabilityModule
  - SettingsModule, ConnectorsModule, etc.

### Database (PostgreSQL via Docker)

- **Status**: ✅ Running on localhost:5432
- **Database**: `neurecore_dev`
- **Migrations**: Applied (20260326\_\*) including:
  - `tier_agent_pools` table
  - `tier_agent_pool_items` table
  - Foreign key constraints

### Cache (Redis via Docker)

- **Status**: ✅ Running on localhost:6379
- **Usage**: Auth blacklisting, session caching

## Running Services (VERIFIED ✅)

| Service         | Port        | Status     | HTTP Code |
| --------------- | ----------- | ---------- | --------- |
| Backend API     | 3000        | ✅ Running | 200       |
| Frontend Tenant | 3001        | ✅ Running | 200       |
| Frontend Admin  | 3002        | ✅ Running | 200       |
| SSH Tunnel      | 15433/16380 | ✅ Running | N/A       |

**Updated**: 2026-03-31 - Fresh Prisma client generated, backend restarted successfully. Database schema errors resolved.

## Environment Configuration

- **NODE_ENV**: development
- **LOG_LEVEL**: debug
- **JWT Access Expires**: 15m
- **JWT Refresh Expires**: 7d

## Active Terminals

- Terminal 10: Backend running (npm run start:dev)
- Terminal 6: Prisma Studio (inactive)
- Frontend Tenant: Running (likely Vite dev server)
- Frontend Admin: Running (likely Vite dev server)

## Recent DevOps Operations (March 30, 2026 → 2026-06-26)

### 2026-06-26 (Session 4 — Phase 2 R2 + Phase 3 perf)

1. Investigated 12-14s dashboard load → identified 3 root causes (Upstash timeout, N+1, 7 parallel calls)
2. Applied 3 backend fixes: Redis LRU + timeout race, agents N+1 fix, /command-center/summary endpoint
3. `pnpm prisma migrate deploy` → applied `20260626_user_department` to Neon (after killing stuck advisory lock)
4. Frontend rewired: commandCenterService + store setX actions + /command-center 7→1 calls
5. Backend restart pid 255248 — smoke tests pass
6. Pushed to `Shahikhail01/Neurecorebase` (frontend) + committed on Contabo (backend)
7. Measured: 12-14s → 1.5-2s (7-8× speedup)

### 2026-06-25 (Session 3 — Phase 1-12 ship + Ask AI fixes 21-23)

8. All 12 phases (UI rebuild) deployed to production via Contabo backend + Vercel frontends
9. Fixed 3 chat regressions (Fix 21: double-click → 2 messages; Fix 22: JSON leak; Fix 23: suggestion chip double-fire)
10. 1 Prisma migration (`20260625_phase1_gaps`); 26 backend file changes; 19 frontend file changes; 16 supporting docs; 15 Playwright tests

### 2026-03-30 (Contabo migration — pre-tenant-rebuild)

1. SSH'd into Contabo — verified PostgreSQL 16.13, Redis 7.0.15, 11GB RAM
2. Identified databases: `neurecore_prod` (29 tables), `neurecore_dev` (36 tables), `ecoearthshop`
3. Found security issues: Redis no pass, open pg_hba, superuser ownership
4. Created `docs/CONTABO_MIGRATION_PLAN.md` — comprehensive 6-phase plan
5. Added merge+delete `neurecore_dev`, local Docker cleanup to plan

## Contabo Migration Plan Summary

**See**: `docs/CONTABO_MIGRATION_PLAN.md` for full details.

| Phase | Description                                            | Status  |
| ----- | ------------------------------------------------------ | ------- |
| 1     | Security hardening (Redis pass, pg_hba, firewall)      | ✅ Done |
| 2     | DB merge `neurecore_dev` → `neurecore_prod` + drop dev | ✅ Done |
| 3     | Backend config pointing to Contabo DBs                 | ✅ Done |
| 4     | Neon — dev branching only                              | ✅ Done |
| 5     | Production cutover (local)                             | ✅ Done |
| 6     | Full deployment (Contabo backend + Vercel frontends)   | Pending |

## SSH Tunnel (Local Access to Contabo)

**IMPORTANT**: Contabo PostgreSQL binds to 127.0.0.1 only (security hardening).

**Solution**: SSH tunnel for local development access

```bash
./backend/scripts/ssh-tunnel.sh start   # Start tunnel
./backend/scripts/ssh-tunnel.sh stop    # Stop tunnel
./backend/scripts/ssh-tunnel.sh status   # Check status
```

**Ports**:

- PostgreSQL: `localhost:15433` → `contabo:5432`
- Redis: `localhost:16380` → `contabo:6379`

## Deployment Architecture

### CURRENT SETUP (Phase 5a - March 30, 2026) ✅

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        LOCAL DEVELOPMENT MACHINE                         │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │
│  │   Backend    │  │  Tenant UI   │  │  Admin UI    │                 │
│  │  localhost   │  │  localhost   │  │  localhost   │                 │
│  │   :3000      │  │   :5173      │  │   :3001      │                 │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                 │
│         │                  │                  │                          │
│         └──────────────────┴──────────────────┘                          │
│                               │                                           │
│                    ┌──────────▼──────────┐                               │
│                    │     SSH Tunnel      │                               │
│                    │  127.0.0.1:15433 ───┼──► Contabo :5432 (PG)       │
│                    │  127.0.0.1:16380 ───┼──► Contabo :6379 (Redis)    │
│                    └─────────────────────┘                               │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         CONTABO SERVER (109.123.248.253)                 │
├─────────────────────────────────────────────────────────────────────────┤
│  PostgreSQL 16        Redis 7                                          │
│  neurecore_prod       (bound to 109.123.248.253)                       │
│  neurecore_dev        Password: kPzbcTiOQBWw...                        │
│                                                                         │
│  ✅ Vercel IPs allowed (76.76.0.0/16)                                   │
│  ✅ UFW ports open for Vercel                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### FUTURE SETUP (Phase 6 - Later)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           VERCEL CLOUD                                  │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐                                    │
│  │  Tenant UI   │  │  Admin UI    │                                    │
│  │ hq.neurecore │  │ cc.neurecore  │                                    │
│  │   .com       │  │   .com        │                                    │
│  └──────┬───────┘  └──────┬───────┘                                    │
│         │                  │                                            │
│         └────────┬─────────┘                                            │
│                  │                                                      │
│                  ▼                                                      │
│         ┌───────────────┐                                               │
│         │   Backend     │  (Vercel Serverless Functions)                │
│         │  (Contabo)    │                                               │
│         └───────┬───────┘                                               │
│                 │                                                       │
└─────────────────┼─────────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         CONTABO SERVER (109.123.248.253)                 │
├─────────────────────────────────────────────────────────────────────────┤
│  PostgreSQL 16        Redis 7                                          │
│  neurecore_prod       (bound to 109.123.248.253)                       │
└─────────────────────────────────────────────────────────────────────────┘
```

## Configuration Files

### Local Development (Current)

| Component | Config File                       | Connects To                          |
| --------- | --------------------------------- | ------------------------------------ |
| Backend   | `backend/.env.local-prod`         | SSH tunnel (127.0.0.1:15433, :16380) |
| Tenant UI | `frontend-tenant/.env.local-prod` | localhost:3000                       |
| Admin UI  | `frontend-admin/.env.local-prod`  | localhost:3000                       |

### Vercel Deployment (Future)

| Component | Config File           | Connects To                      |
| --------- | --------------------- | -------------------------------- |
| Backend   | `backend/.env.vercel` | Contabo direct (109.123.248.253) |
| Frontends | Vercel Dashboard      | Vercel Backend                   |

## Phase 5: Production Cutover — COMPLETED ✅ (March 30, 2026)

### Contabo Infrastructure Configuration

**PostgreSQL (Contabo):**

- ✅ pg_hba.conf: Vercel IPs (76.76.0.0/16) allowed
- ✅ UFW: Port 5432 open for 76.76.0.0/16
- ✅ DATABASE_URL: postgresql://neurecore_app:...@109.123.248.253:5432/neurecore_prod?sslmode=require

**Redis (Contabo):**

- ✅ Redis bind: Changed from 127.0.0.1 to 109.123.248.253
- ✅ UFW: Port 6379 open for 76.76.0.0/16
- ✅ REDIS_URL: redis://:kPzbcTiOQBWwTs6dr4xinAWfXhbUv3AFjRdkjhvxQ=@109.123.248.253:6379/0

### Local Backend Test (via SSH Tunnel)

- ✅ Backend running on localhost:3000
- ✅ PostgreSQL connected (SSH tunnel: 127.0.0.1:15433 → Contabo:5432)
- ✅ Redis connected (SSH tunnel: 127.0.0.1:16380 → Contabo:6379)
- ✅ Health check: GET /api/v1/health → 200 OK

## Notes

- All services are ready for development
- SSH tunnel is REQUIRED for local backend to connect to Contabo DBs
- Docker containers to remain until Contabo is fully tested
- Phase 3 complete: Prisma schema synced to Contabo PostgreSQL ✓

## 🔴 ONGOING ISSUE: Prisma "Column Does Not Exist" Error

**Date**: 2026-03-31
**Status**: 🔴 UNRESOLVED - Requires further investigation

### Problem Summary

When frontend makes authenticated API requests, Prisma throws errors:

```
The column `agents.tierAgentPoolId` does not exist in the current database.
The column `tenants.tierId` does not exist in the current database.
```

### Verified Facts

| Check              | Result                  | Notes                                                                            |
| ------------------ | ----------------------- | -------------------------------------------------------------------------------- |
| DATABASE_URL       | ✅ Correct              | `postgresql://...@127.0.0.1:15433/neurecore_prod` (Contabo via SSH tunnel)       |
| psql direct query  | ✅ Columns EXIST        | Both `agents.tierAgentPoolId` and `tenants.tierId` verified via psql             |
| Schema PascalCase  | ✅ Restored             | `git checkout` restored original schema with `model Agent {}`, `model Tenant {}` |
| Prisma generate    | ✅ Success              | `pnpm exec prisma generate` completed without errors                             |
| TypeScript compile | ✅ 0 errors             | Backend compiles cleanly                                                         |
| Health endpoint    | ✅ 200 OK               | `GET /api/v1/health` works                                                       |
| Backend startup    | ✅ "Database connected" | All modules loaded successfully                                                  |

### Database Schema Verification (via psql)

```sql
-- agents table HAS tierAgentPoolId column:
tierAgentPoolId | text | nullable | FK → tier_agent_pools(id)

-- tenants table HAS tierId column:
tierId | text | NOT NULL | FK → tiers(id)
```

### Attempted Fixes (All Failed)

1. ✅ `git checkout backend/prisma/schema.prisma` - restored original schema
2. ✅ `pnpm exec prisma generate` - regenerated Prisma client
3. ✅ `rm -rf node_modules/.pnisma/client*` - cleared Prisma cache
4. ✅ `pkill -9` + restart - killed and restarted backend
5. ✅ `git checkout` restored PascalCase model names

### Root Cause Hypothesis

Prisma engine binary is caching the OLD introspected schema (with snake_case model names from `prisma db pull --force`). Despite regenerating the client, the binary may retain cached metadata.

### Next Steps (UNRESOLVED)

- [ ] Try `npx prisma migrate reset` or `npx prisma db push --force` to sync
- [ ] Check if Prisma engine binary needs explicit invalidation
- [ ] Consider removing and reinstalling `@prisma/client` package
- [ ] Investigate if this is a Prisma v5.22.0 bug with engine caching

### Files Modified

- `backend/prisma/schema.prisma` - restored via git checkout

## 🆕 NEXT PRIORITY: Agent Tool Connectors

**See**: `memory-bank/progress.md` → "NEXT: Agent Tool Connectors"

| Capability                         | Priority    |
| ---------------------------------- | ----------- |
| Email (SMTP/IMAP)                  | 🔴 Critical |
| Document Creation                  | 🔴 Critical |
| Spreadsheet                        | 🔴 Critical |
| File Storage                       | 🔴 Critical |
| Social APIs (Meta, LinkedIn, etc.) | 🔴 Critical |

This enables agents to function as true "digital employees".

## 🆕 RECENT IMPROVEMENTS (Session 4, 2026-06-26)

| Item | Status | Notes |
|---|---|---|
| Phase 2 R2 (add/detail UI) | ✅ Shipped | 5 create forms + 5 detail pages + 5 inspectors; full backend additions (User.deptId, assign, costs per-dept) |
| Phase 3 perf: JWT blacklist LRU | ✅ Shipped | 5s/request → <1ms cache hit; 500ms timeout race; still fail-open |
| Phase 3 perf: agents N+1 fix | ✅ Shipped | 100 COUNTs → 1 groupBy query; result shape preserved |
| Phase 3 perf: `/command-center/summary` | ✅ Shipped | Single `$transaction` with 12 sub-queries; replaces 7 parallel HTTP requests |
| Dashboard load time | ✅ 12-14s → 1.5-2s (7-8× speedup, measured) |
| `20260626_user_department` migration | ✅ Applied to Neon | idempotent — handles pre-existing `cost_records.departmentId` |

## 📋 OPEN / NEXT (after Session 4)

1. **Routines v2 graph builder** — v1 uses 2-node auto-filled graph; full drag-drop editor is the v2 ask (out of scope this round)
2. **Local Postgres read-replica on Contabo** — would drop dashboard load below 1s; revisit only if user complaints persist
3. **CORS preflight caching verification** — already configured in LiteSpeed per Fix 1 of `production-deployment-log.md`; verify on next manual test
4. **Browser-side smoke test of new create/detail flows** — backend smoke tests pass; UI flows need a final browser pass after Vercel deploy completes
5. **Admin runbook update for `users/department/:id`** — SUPER_ADMIN should use `/users?tenantId=…&departmentId=…` not `/users/department/:id` (the latter requires JWT tenantId)
6. **Adoption metrics for old route rewrites** — start collecting now to inform Phase 11 (old route removal) which remains deferred to 30-day wait post-deploy

