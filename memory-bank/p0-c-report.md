# P0-C Report — Endpoint Smoke Tests (2026-06-25 13:55)

**Environment:** Contabo production, backend pid 1253 on port 3003
**Tester:** Kilo (read-only diagnostics)
**Goal:** Confirm whether `/agents?departmentId=`, `/projects?departmentId=`, `/costs/by-agent?departmentId=` work today or require Phase 1 work

---

## 1. Test Methodology

- Logged in as `admin@example.com` (SUPER_ADMIN) via `POST /api/v1/auth/login`
- Tested endpoints with both authenticated and tenant-scoped parameters
- Used real production tenant `4109424f-59fa-463a-8f5e-52299fcf47f0` (has 22 tasks, multiple agents seeded)
- Read PM2 error logs for any 500 root causes

---

## 2. Results Matrix

| Endpoint | Status | Department filter? | Notes |
|---|---|---|---|
| `GET /api/v1/agents?departmentId=<uuid>` | ✅ 200 OK | **YES — works** | Returns filtered agents |
| `GET /api/v1/agents?departmentId=<uuid>&limit=5` | ✅ 200 OK | YES | |
| `GET /api/v1/tasks?departmentId=<uuid>` | ✅ 200 OK | **YES — works** | Returns 20 tasks for prod tenant |
| `GET /api/v1/workflows?departmentId=<uuid>` | ⚠️ 200 OK | Inconclusive | Requires `?tenantId=` for SUPER_ADMIN (BadRequest otherwise). Returns 0 results — prod tenant may have no workflows |
| `GET /api/v1/workflows?tenantId=<id>` | ✅ 200 OK | n/a | 0 workflows for prod tenant |
| `GET /api/v1/goals?tenantId=<id>` | ❌ 404 | n/a | Unversioned route — at `/api/goals` |
| `GET /api/goals?tenantId=<id>` | ❌ **500** | Inconclusive | Internal server error in goals module |
| `GET /api/goals?tenantId=<id>&departmentId=<uuid>` | ❌ **500** | Inconclusive | Same error |
| `GET /api/routines?tenantId=<id>` | ❌ **500** | Inconclusive | Internal server error |
| `GET /api/projects?tenantId=<id>` | ❌ **500** | Inconclusive | Error in `PrismaProjectRepository.findAll` line 74 |
| `GET /api/costs/summary?tenantId=<id>` | ❌ **500** | Inconclusive | **Backend bug** — see §3 |
| `GET /api/inbox/summary` | ❌ Timeout | Inconclusive | Endpoint didn't respond within 10s |

---

## 3. Discovered Backend Bug — `costs/summary` ExecutionLog query

**Error log excerpt:**

```
Invalid `prisma.executionLog.findMany()` invocation:

{
  where: {
    agent: {
      tenantId: null,
      ~~~~~~~~
?     is?: AgentWhereInput | Null,
?     isNot?: AgentWhereInput | Null
    },
    createdAt: {
      gte: new Date("2026-05-26T08:55:23.384Z"),
      lte: new Date("2026-06-25T08:55:23.384Z")
    }
  },
  select: {
    costUsd: true,
    tokensUsed: true,
    success: true
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
```

**Location:** `src/modules/costs/providers/langsmith-cost-provider.ts:34:21` → calls `prisma.executionLog.findMany()`

**Root cause:** The `ExecutionLog` Prisma model likely doesn't have a relation to `Agent` (or has it without `tenantId` accessible). The query tries to filter by `agent.tenantId` but the relation doesn't expose that.

**Severity:** Medium. Affects all cost-related dashboards. Likely affects all tenants, not just admin testing.

**Fix:** Investigate `ExecutionLog` model in Prisma schema. Either:
- (a) Add proper relation to `Agent` if missing
- (b) Change query to use `agentId` filter + join in service
- (c) Update `LangSmithCostProvider` to fetch agents first, then filter executionLogs by `agentId IN (...)`

**Effort:** ~30-60 LOC depending on root cause. Must be fixed in Phase 1 alongside other backend gaps.

---

## 4. Other 500 Errors

Multiple unversioned modules (goals, routines, projects) return 500 when called by SUPER_ADMIN. Likely causes:

1. They use `req.user.tenantId` from JWT — but SUPER_ADMIN JWT has `tenantId: null`
2. They lack `resolveTenantId()` helper that workflows/tasks have
3. They may also have their own query bugs (ExecutionLog type issue)

**Action:** Investigate each module's controller + service in Phase 1. May require:
- Adding `resolveTenantId()` helper to each module
- OR adding `tenantId` query param support like workflows/tasks
- OR scoping queries to use `?tenantId=` for SUPER_ADMIN

---

## 5. Revised Backend Gaps (§5 in new_neurecore.md)

**Add to §5 (new gap):**

### Gap 6 (NEW): Fix unversioned modules for SUPER_ADMIN access (HIGH)

**Today:** 6 controllers (`costs`, `goals`, `inbox`, `projects`, `routines`, `webhooks`) lack:
- URI versioning (`@Controller({ version: '1' })`)
- `resolveTenantId()` helper
- `?tenantId=` query support

**Effect:** When SUPER_ADMIN queries these endpoints, returns 500 (Prisma null tenantId errors) instead of working with explicit tenant scoping.

**Need:**
1. Add URI versioning (`@Controller({ path, version: '1' })`) to all 6 controllers
2. Add `resolveTenantId()` helper to each (copy from workflows)
3. Fix `LangSmithCostProvider` ExecutionLog query (Gap 6a)
4. Fix any other query bugs discovered

**Effort:** ~150-250 LOC + tests

**Files to change:**

| File | Change |
|---|---|
| `costs/costs.controller.ts` | Add `@Controller({ path: 'costs', version: '1' })`, add `resolveTenantId()`, add `@Query('tenantId')` |
| `costs/providers/langsmith-cost-provider.ts` | Fix ExecutionLog query (line 34) |
| `goals/goals.controller.ts` | Add versioning, add `resolveTenantId()` |
| `routines/routines.controller.ts` | Add versioning, add `resolveTenantId()`, support `?ownerAgentId=` etc. |
| `projects/projects.controller.ts` | Add versioning, add `resolveTenantId()` |
| `inbox/inbox.controller.ts` | Add versioning, add `resolveTenantId()` |
| (webhooks stays unversioned — public endpoints) | n/a |

---

## 6. Department Filter Status (Updated)

| Entity | `?departmentId=` filter | Status |
|---|---|---|
| `GET /api/v1/agents` | ✅ WORKS | No backend gap |
| `GET /api/v1/tasks` | ✅ WORKS | No backend gap |
| `GET /api/v1/workflows` | ⚠️ WORKS with caveats | Needs `?tenantId=` for SUPER_ADMIN — usable in tenant context |
| `GET /api/goals` | ❌ CANNOT TEST (500 error) | Module bug blocks verification |
| `GET /api/routines` | ❌ CANNOT TEST (500 error + no agent linkage) | Backend gap (Option B recommended) |
| `GET /api/projects` | ❌ CANNOT TEST (500 error) | Module bug blocks verification |
| `GET /api/costs/by-agent` | ❌ CANNOT TEST (500 error in summary) | Backend bug blocks verification |

**Conclusion:** Tasks and Agents workspace tabs can ship with no backend work. Workflows tab needs `?tenantId=` handling on the frontend for admin testing (no impact on tenant users). Goals/Routines/Projects/Costs tabs need Gap 6 fixed first.

---

## 7. Updated Phase 1 Effort Estimate

| Gap | Description | Effort |
|---|---|---|
| 1 (original) | Add `?departmentId=` to Tasks/Workflows/Routines | **REDUCED** — Tasks/Agents already work; only Routines needs Option B Prisma migration |
| 2 | Loosen marketplace guard | ~5 LOC |
| 3 | Loosen spawn endpoint guard | ~30 LOC |
| 5 | Tenant self-deploy dept template | DEFERRED |
| **6 (NEW)** | Fix unversioned modules for SUPER_ADMIN + ExecutionLog bug | ~150-250 LOC |
| **7 (NEW)** | Add ARCHIVED + DEPRECATED status + archive endpoint | ~30 LOC |
| **8 (NEW)** | Add template deprecation fields + changelog endpoint | ~60 LOC |

**Total v1 backend work:** ~275-375 LOC + 1-2 Prisma migrations + tests.

---

## 8. P0-C Exit Criteria

**Met with caveats:**

- ✅ Confirmed `agents?departmentId=` works
- ✅ Confirmed `tasks?departmentId=` works
- ⚠️ Cannot confirm workflows/goals/routines/projects/costs dept filter due to module bugs
- ❌ New backend bugs discovered (must be added to Phase 1)

**Recommendation:** Proceed to P0-D (design review items). Once P0-D is locked, Phase 1 backend work begins with the expanded gap list.

---

**Last updated:** 2026-06-25 13:55
**Contabo state at time of test:** Backend pid 1253, port 3003, no restarts. No changes made.