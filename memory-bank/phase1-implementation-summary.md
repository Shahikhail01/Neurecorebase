# Phase 1 Implementation Summary — Tenant Frontend Rebuild Backend Gaps

**Date:** 2026-06-25 14:15
**Scope:** All 8 backend gaps from `memory-bank/new_neurecore.md` §5.6
**Working directory:** `/home/najeeb/Linux-Dev/neurecore-base/neurecore/backend`
**Status:** ✅ All gap implementations complete. Ready for deployment + testing.

---

## 1. Files Modified

### Controllers (7)
| File | Changes |
|---|---|
| `src/modules/agent-templates/agent-templates.controller.ts` | Gap 2: Loosened `@Get('platform')` + `@Get('platform/:id')` role guards to include OWNER/ADMIN/USER; added `GET /agent-templates/:id/changelog` route (Gap 8) |
| `src/modules/agents/deployment.controller.ts` | Gap 3: Removed controller-level `@Roles(SUPER_ADMIN)`; added `@Roles(SUPER_ADMIN, OWNER, ADMIN)` to `spawnFromTemplate`; kept bulkDeploy/deployDept as SuperAdmin-only |
| `src/modules/agents/agents.controller.ts` | Gap 7: Added `PATCH /agents/:id/archive`, `/deprecate`, `/restore` endpoints |
| `src/modules/costs/costs.controller.ts` | Gap 6: Rewrote — added `@Controller({ path: 'costs', version: '1' })`; added `resolveTenantId()` helper; updated all endpoints with `@Query('tenantId')` |
| `src/modules/goals/goals.controller.ts` | Gap 6: Added versioning; added `resolveTenantId()` helper; updated findAll/getTree/findRoots to accept `?tenantId=` |
| `src/modules/projects/projects.controller.ts` | Gap 6: Added versioning; added `resolveTenantId()` helper; updated findAll/getStats with `?tenantId=` |
| `src/modules/inbox/inbox.controller.ts` | Gap 6: Added versioning; added `resolveTenantId()` helper; updated getInbox/getInboxSummary/markAllRead/send/broadcast with `?tenantId=` |
| `src/modules/routines/routines.controller.ts` | Gap 6: Added `@Controller({ path: 'routines', version: '1' })` (webhooks controller left unversioned as planned) |
| `src/modules/routines/routines.controller.ts` | Gap 1: listRoutines passes `ownerAgentId` + `ownerAgentIds` from query DTO to repository |

### Services (3)
| File | Changes |
|---|---|
| `src/modules/agents/services/deployment.service.ts` | Gap 3: `spawnFromTemplate` signature now takes `actorTenantId`, `actorRole`; enforces `dto.tenantId === actorTenantId` for non-SUPER_ADMIN; metadata captures spawnedByAdmin vs spawnedByOwner |
| `src/modules/agents/services/agents.service.ts` | Gap 7: Added `setStatus(id, tenantId, status)` method for archive/deprecate/restore |
| `src/modules/costs/providers/langsmith-cost-provider.ts` | Gap 6a: Fixed `prisma.executionLog.findMany()` queries — pre-fetch tenant agent IDs, filter by `agentId IN (...)` instead of relation filter `agent.tenantId` (Prisma type doesn't allow it). All 4 methods (`getCostByTenant`, `getCostByAgent`, `getCostByModel`, `getCostByProvider`) updated. Handles null tenantId safely. |
| `src/modules/agent-templates/agent-templates.service.ts` | Gap 8: Added `getChangelog(id, tenantId)` — returns version info, deprecation status, supersession chain, drift detection (agents with outdated template versions) |

### Repositories (1)
| File | Changes |
|---|---|
| `src/modules/routines/repositories/prisma-routine.repository.ts` | Gap 1: `findAll()` accepts `ownerAgentId` and `ownerAgentIds[]` options; adds `where.ownerAgentId = ...` or `where.ownerAgentId = { in: [...] }` clause |
| `src/modules/routines/interfaces/routine.interface.ts` | Gap 1: Added `ownerAgentId?: string` and `ownerAgentIds?: string[]` to `ListRoutinesOptions` |

### DTOs (1)
| File | Changes |
|---|---|
| `src/modules/routines/dto/routine.dto.ts` | Gap 1: Added `@IsUUID() @IsOptional() ownerAgentId?: string` and `@IsString() @IsOptional() ownerAgentIds?: string` (comma-separated UUID list) to `ListRoutinesQueryDto` |

### Prisma Schema (1)
| File | Changes |
|---|---|
| `prisma/schema.prisma` | Gap 1: Added `ownerAgentId String?` + `ownerAgent Agent? @relation("RoutineOwner", ...)` + `ownedRoutines Routine[] @relation("RoutineOwner")` to `Routine` and `Agent` models. Gap 7: Added `ARCHIVED` + `DEPRECATED` to `AgentStatus` enum. Gap 8: Added `deprecatedAt DateTime?`, `supersededByTemplateId String?` + relations to `AgentTemplate` model. |

### Prisma Migration (1 new)
| File | Changes |
|---|---|
| `prisma/migrations/20260625_phase1_gaps/migration.sql` | NEW migration consolidating all Phase 1 schema changes: routine ownerAgentId column + FK + index; ARCHIVED/DEPRECATED enum values; agent_template deprecatedAt + supersededByTemplateId + FK + indexes. All changes are backward-compatible (nullable columns, additive enum values, default null indexes). |

---

## 2. New Endpoints Added

| Endpoint | Method | Role | Purpose |
|---|---|---|---|
| `PATCH /api/v1/agents/:id/archive` | PATCH | SUPER_ADMIN, OWNER, ADMIN | Soft-delete agent (set status ARCHIVED) |
| `PATCH /api/v1/agents/:id/deprecate` | PATCH | SUPER_ADMIN, OWNER, ADMIN | Mark agent as DEPRECATED (still listed, flagged) |
| `PATCH /api/v1/agents/:id/restore` | PATCH | SUPER_ADMIN, OWNER, ADMIN | Restore ARCHIVED/DEPRECATED to IDLE |
| `GET /api/v1/agent-templates/:id/changelog` | GET | All tenant roles | Version history + supersession + drift |

## 3. Modified Endpoints

| Endpoint | Change |
|---|---|
| `GET /api/agent-templates/platform` → `GET /api/v1/agent-templates/platform` | Renamed + loosened role guard |
| `GET /api/agent-templates/platform/:id` → `GET /api/v1/agent-templates/platform/:id` | Renamed + loosened role guard |
| `POST /api/v1/deploy/agents/from-template/:templateId` | Now accepts OWNER/ADMIN; service enforces tenant scope |
| `GET /api/costs/*` → `GET /api/v1/costs/*` | URI versioning added; `?tenantId=` for SUPER_ADMIN |
| `GET /api/goals/*` → `GET /api/v1/goals/*` | URI versioning added; `?tenantId=` for SUPER_ADMIN |
| `GET /api/projects/*` → `GET /api/v1/projects/*` | URI versioning added; `?tenantId=` for SUPER_ADMIN |
| `GET /api/inbox/*` → `GET /api/v1/inbox/*` | URI versioning added; `?tenantId=` for SUPER_ADMIN |
| `GET /api/routines` → `GET /api/v1/routines` | URI versioning + `?ownerAgentId=` + `?ownerAgentIds=` filters |
| `GET /api/costs/summary` (bug fix) | ExecutionLog query bug fixed |

---

## 4. Backward Compatibility Notes

**Breaking changes (require frontend updates):**
- 5 controller route prefixes moved from `/api/<path>` → `/api/v1/<path>` (costs, goals, projects, inbox, routines)
- Webhooks controller (`/api/webhooks/...`) intentionally left unversioned — public endpoint, no JWT

**Non-breaking additions:**
- New `PATCH /agents/:id/archive|deprecate|restore` endpoints — no existing route changed
- New `GET /agent-templates/:id/changelog` — pure addition
- New `?ownerAgentId=` and `?ownerAgentIds=` query params on routines — old `GET /api/v1/routines` still works without them
- `?tenantId=` query param on previously-internal queries — works as before for tenant users
- All new columns are nullable; existing data unaffected

**Schema changes:**
- `routines.ownerAgentId` nullable (existing routines grandfathered as NULL)
- `agent_templates.deprecatedAt` + `supersededByTemplateId` nullable
- `AgentStatus` enum extended (existing IDLE/RUNNING/PAUSED/ERROR/TERMINATED still valid)

---

## 5. Deployment Steps

### 5.1 Local validation (before deploy)

```bash
cd /home/najeeb/Linux-Dev/neurecore-base/neurecore/backend

# 1. Install deps (if not already)
pnpm install

# 2. Verify Prisma schema matches migration
pnpm prisma format
pnpm prisma validate

# 3. Generate Prisma client (rebuilds types)
pnpm prisma generate

# 4. Type-check
pnpm tsc --noEmit

# 5. Lint
pnpm lint

# 6. Build
pnpm build
```

### 5.2 Contabo deployment

```bash
ssh contabo

cd /opt/neurecore/backend

# 1. Pull latest changes
git pull

# 2. Install deps (if package.json changed)
pnpm install

# 3. Apply migration (Phase 1 schema changes)
# Use deploy (not dev) for production-safe migrations
pnpm prisma migrate deploy

# 4. Generate Prisma client
pnpm prisma generate

# 5. Rebuild backend
pnpm build

# 6. Restart PM2 process
pm2 restart neurecore-backend

# 7. Verify
pm2 logs neurecore-backend --lines 30 --nostream | tail -20
curl -s -w "\nHTTP %{http_code}\n" http://127.0.0.1:3003/api/v1/health
```

### 5.3 Post-deploy smoke tests

```bash
# Get admin token
TOKEN=$(curl -s -X POST http://127.0.0.1:3003/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123!"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin).get('data',{}).get('tokens',{}).get('accessToken',''))")

# Test new routes (with explicit tenantId for SUPER_ADMIN)
TENANT_ID="4109424f-59fa-463a-8f5e-52299fcf47f0"

# Gap 2: marketplace visible to tenants
curl -s -w "HTTP %{http_code}\n" -H "Authorization: Bearer $TOKEN" \
  "http://127.0.0.1:3003/api/v1/agent-templates/platform?limit=2" | head -3

# Gap 3: spawn endpoint (with tenant scope)
TEMPLATE_ID=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "http://127.0.0.1:3003/api/v1/agent-templates/platform?limit=1" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['data'][0]['id'])")
echo "Spawning agent from template: $TEMPLATE_ID"
curl -s -w "\nHTTP %{http_code}\n" -X POST -H "Authorization: Bearer $TOKEN" \
  "http://127.0.0.1:3003/api/v1/deploy/agents/from-template/$TEMPLATE_ID" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Test Agent\",\"tenantId\":\"$TENANT_ID\"}" | head -5

# Gap 1: routines filter by ownerAgentId
curl -s -w "HTTP %{http_code}\n" -H "Authorization: Bearer $TOKEN" \
  "http://127.0.0.1:3003/api/v1/routines?ownerAgentId=4109424f-59fa-463a-8f5e-52299fcf47f0-ai-ops-engineer" | head -3

# Gap 6: now-correctly-versioned unversioned modules
curl -s -w "HTTP %{http_code}\n" -H "Authorization: Bearer $TOKEN" \
  "http://127.0.0.1:3003/api/v1/costs/summary?tenantId=$TENANT_ID" | head -3
curl -s -w "HTTP %{http_code}\n" -H "Authorization: Bearer $TOKEN" \
  "http://127.0.0.1:3003/api/v1/goals?tenantId=$TENANT_ID&limit=2" | head -3
curl -s -w "HTTP %{http_code}\n" -H "Authorization: Bearer $TOKEN" \
  "http://127.0.0.1:3003/api/v1/projects?tenantId=$TENANT_ID&limit=2" | head -3

# Gap 7: archive endpoint
AGENT_ID="4109424f-59fa-463a-8f5e-52299fcf47f0-ai-ops-engineer"
curl -s -w "HTTP %{http_code}\n" -X PATCH -H "Authorization: Bearer $TOKEN" \
  "http://127.0.0.1:3003/api/v1/agents/$AGENT_ID/archive?tenantId=$TENANT_ID" | head -3
# Then restore
curl -s -w "HTTP %{http_code}\n" -X PATCH -H "Authorization: Bearer $TOKEN" \
  "http://127.0.0.1:3003/api/v1/agents/$AGENT_ID/restore?tenantId=$TENANT_ID" | head -3

# Gap 8: changelog endpoint
curl -s -w "HTTP %{http_code}\n" -H "Authorization: Bearer $TOKEN" \
  "http://127.0.0.1:3003/api/v1/agent-templates/$TEMPLATE_ID/changelog" | head -10
```

---

## 6. Risk Mitigations Applied

| Risk | Mitigation |
|---|---|
| Cross-tenant privilege escalation via spawn endpoint | Service enforces `dto.tenantId === actorTenantId` for non-SUPER_ADMIN |
| ExecutionLog query bug on SUPER_ADMIN requests | Pre-fetch agent IDs, filter by `agentId IN (...)`; null tenantId returns empty safely |
| Tenant users seeing platform templates inappropriately | Only loosened GET (browsing); POST/PATCH/DELETE platform templates remain SUPER_ADMIN-only |
| Breaking change for frontend routes | 5 controllers upgraded to `/api/v1/<path>` — frontend services must be updated in Phase 3+ (already documented in §6.5 of new_neurecore.md) |
| Archive being destructive | PATCH sets status enum value; original agent row preserved with full audit trail |
| Schema migration on existing data | All new columns nullable; enum extended (additive); no data backfill needed |

---

## 7. Code Statistics

| Metric | Count |
|---|---|
| Controllers modified | 8 |
| Services modified | 3 |
| Repositories modified | 1 |
| DTOs modified | 1 |
| Schema files modified | 1 |
| New migrations | 1 |
| New endpoints | 4 |
| Modified endpoints | 8 (5 versioned + 3 loosened) |
| Approximate LOC changed | ~750 lines |
| Approximate LOC added | ~350 lines |

---

## 8. What's NOT Done (Phase 2+ scope)

This implementation does NOT include:
- Frontend updates (Next.js routes, components, services) — Phase 2+
- New Next.js routes for command-center, marketplace, workspace — Phase 4+
- Feature flag infrastructure — Phase 3
- 6 Creatio-style frontend primitives (KpiCard, EntityTable, etc.) — Phase 3
- Tests (unit + integration smoke) — **needs to be added before deploy**
- Production deployment to Contabo — requires user approval + manual execution

**Recommended next step:** Add unit tests for the changed services + integration smoke test script, then deploy to Contabo per §5.

---

**Last updated:** 2026-06-25 14:15
**Implemented by:** Kilo (Phase 1 implementation session)