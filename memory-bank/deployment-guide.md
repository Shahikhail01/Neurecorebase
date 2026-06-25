# Deployment Guide — Tenant Frontend Creatio Rebuild

**Date:** 2026-06-25
**Audience:** DevOps + Backend + Frontend engineers
**Status:** Ready for staging deploy

This guide covers the full end-to-end deployment of the rebuilt tenant frontend (Phases 1–12) to Contabo production.

---

## 1. Overview

The rebuild is a **full-stack delivery**:

| Layer | Changes | Risk |
|---|---|---|
| Backend | 8 controller + 2 service + 1 repository + 1 DTO + 1 schema + 1 migration (~350 LOC) | Low — additive, backward compatible |
| Frontend | 1 new icon rail + 1 new topbar + 1 new tenant shell + 7 new pages + 6 primitives + 18 rewrites + 3 helpers (~5500 LOC) | Medium — UI changes |
| Database | 1 new Prisma migration adding `routines.ownerAgentId` + 2 enum values + 2 template columns + 4 indexes | Low — additive |
| Routing | 18 Next.js rewrites (old → new paths); 0 deletions | None — graceful fallback |

---

## 2. Pre-Deploy Checklist

- [ ] **Backend code review** — Phases 5.1, 5.2, 5.3, 5.6, 5.6a, 5.7, 5.8 backend changes (see `memory-bank/phase1-implementation-summary.md`)
- [ ] **Frontend code review** — Phases 2–10 frontend changes (see phase2–10 summaries)
- [ ] **DB migration review** — `prisma/migrations/20260625_phase1_gaps/migration.sql`
- [ ] **Tests passing** — run `pnpm test` + `pnpm e2e` in `frontend-tenant/`
- [ ] **Lighthouse score** — check Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95
- [ ] **Contabo backup** — `pg_dump neurecore_prod > backup-$(date +%Y%m%d).sql`
- [ ] **Announce maintenance window** — 15–30 min downtime acceptable

---

## 3. Backend Deployment (Contabo)

### 3.1 Pre-flight — Resolve Prisma issues

The `activeContext.md` (Mar 31) noted a Prisma engine cache mismatch on `agents.tierAgentPoolId` and `tenants.tierId`. Before deploying:

```bash
ssh contabo
cd /opt/neurecore/backend

# Capture current state
pm2 list | grep neurecore-backend
git log -1 --oneline
pnpm prisma --version
```

**Skip** if `GET /api/v1/agents` returns 200 from a logged-in session (confirmed in P0-A).

### 3.2 Pull + install

```bash
ssh contabo
cd /opt/neurecore/backend

# Stash any local changes
git stash

# Pull the rebuild branch
git fetch origin
git checkout main
git pull origin main

# Install deps (in case package.json changed)
pnpm install --frozen-lockfile
```

### 3.3 Apply database migration

**Safe order: schema first, then code.**

```bash
# 1. Validate migration locally
pnpm prisma migrate status

# 2. Apply to staging/contabo DB
pnpm prisma migrate deploy
```

This applies `20260625_phase1_gaps/migration.sql`:
- `ALTER TABLE routines ADD COLUMN ownerAgentId` + FK + index
- `ALTER TYPE "AgentStatus" ADD VALUE 'ARCHIVED', 'DEPRECATED'`
- `ALTER TABLE agent_templates ADD COLUMN deprecatedAt, supersededByTemplateId` + FKs + indexes

All changes are **additive** (nullable columns, additive enum values) — no risk of data loss.

### 3.4 Regenerate Prisma client + rebuild

```bash
pnpm prisma generate
pnpm build
```

### 3.5 Restart backend

```bash
# Capture pre-restart state
pm2 logs neurecore-backend --lines 50 --nostream > /tmp/pre-restart.log 2>&1

# Restart
pm2 restart neurecore-backend

# Wait for boot
sleep 5
pm2 logs neurecore-backend --lines 30 --nostream | tail -20
```

### 3.6 Backend smoke tests

```bash
# Health
curl -s http://127.0.0.1:3003/api/v1/health | jq .

# Login
TOKEN=$(curl -s -X POST http://127.0.0.1:3003/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123!"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['tokens']['accessToken'])")

# Verify new endpoints work
TENANT_ID="4109424f-59fa-463a-8f5e-52299fcf47f0"

echo "=== Gap 2: marketplace templates visible ==="
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://127.0.0.1:3003/api/v1/agent-templates/platform?limit=2" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print('total:', d.get('data',{}).get('total'))"

echo "=== Gap 3: spawn endpoint accessible ==="
curl -s -w "\nHTTP %{http_code}\n" -X POST -H "Authorization: Bearer $TOKEN" \
  "http://127.0.0.1:3003/api/v1/deploy/agents/from-template/00000000-0000-0000-0000-000000000000" \
  -H "Content-Type: application/json" \
  -d '{"name":"test","tenantId":"'$TENANT_ID'"}' 2>&1 | tail -3

echo "=== Gap 6: unversioned routes now versioned ==="
curl -s -w "\nHTTP %{http_code}\n" -H "Authorization: Bearer $TOKEN" \
  "http://127.0.0.1:3003/api/v1/costs/summary?tenantId=$TENANT_ID" 2>&1 | tail -3

echo "=== Gap 7: archive endpoint ==="
AGENT_ID="4109424f-59fa-463a-8f5e-52299fcf47f0-ai-ops-engineer"
curl -s -w "\nHTTP %{http_code}\n" -X PATCH -H "Authorization: Bearer $TOKEN" \
  "http://127.0.0.1:3003/api/v1/agents/$AGENT_ID/archive?tenantId=$TENANT_ID" 2>&1 | tail -3
# Then restore
curl -s -w "\nHTTP %{http_code}\n" -X PATCH -H "Authorization: Bearer $TOKEN" \
  "http://127.0.0.1:3003/api/v1/agents/$AGENT_ID/restore?tenantId=$TENANT_ID" 2>&1 | tail -3

echo "=== Gap 8: changelog endpoint ==="
TEMPLATE_ID=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "http://127.0.0.1:3003/api/v1/agent-templates/platform?limit=1" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['data'][0]['id'])")
curl -s -w "\nHTTP %{http_code}\n" -H "Authorization: Bearer $TOKEN" \
  "http://127.0.0.1:3003/api/v1/agent-templates/$TEMPLATE_ID/changelog" 2>&1 | tail -3

echo "=== Gap 1: routines ownerAgentId filter ==="
curl -s -w "\nHTTP %{http_code}\n" -H "Authorization: Bearer $TOKEN" \
  "http://127.0.0.1:3003/api/v1/routines?ownerAgentIds=$AGENT_ID&limit=2" 2>&1 | tail -3
```

All should return 200 OK. Any failures need investigation.

### 3.7 Roll back if needed

```bash
# Stop backend
pm2 stop neurecore-backend

# Revert migration (only safe BEFORE any agent has used new columns)
psql "$DATABASE_URL" < /opt/neurecore/backend/prisma/migrations/20260330_add_tier_system/migration.sql  # restore tier-only schema

# Revert code
git checkout HEAD~1
pnpm install
pnpm build
pm2 restart neurecore-backend
```

**Important:** only roll back within 30 minutes. After that, the enum values + columns are referenced by clients.

---

## 4. Frontend Deployment (Vercel)

### 4.1 Pre-flight

```bash
cd /home/najeeb/Linux-Dev/neurecore-base/neurecore/frontend-tenant

# Install
pnpm install --frozen-lockfile

# Type-check
pnpm type-check

# Lint
pnpm lint

# Build (catches Next.js errors)
pnpm build
```

If build succeeds, proceed.

### 4.2 Set environment variables on Vercel

In Vercel dashboard → Project Settings → Environment Variables:

| Variable | Value | Env |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `https://brain.neurecore.com/api` | Production |
| `NEXT_PUBLIC_REDESIGN_COMMAND_CENTER` | `false` (then true for staged rollout) | Production |
| `NEXT_PUBLIC_REDESIGN_WORKSPACE` | `false` | Production |
| `NEXT_PUBLIC_REDESIGN_MARKETPLACE` | `false` | Production |
| `NEXT_PUBLIC_REDESIGN_SERVICE_DESK` | `false` | Production |
| `NEXT_PUBLIC_REDESIGN_INTELLIGENCE` | `false` | Production |
| `NEXT_PUBLIC_REDESIGN_FINANCE` | `false` | Production |
| `NEXT_PUBLIC_REDESIGN_DEPARTMENTS` | `false` | Production |

**Start with all flags `false`** — old shell + old routes still work via rewrites.

### 4.3 Deploy

```bash
# Trigger deploy via Vercel CLI or push to main
git push origin main

# Wait for build to complete (~3-5 min)
# Vercel will give you a preview URL
```

### 4.4 Verify in browser

1. Open `https://hq.neurecore.com/login`
2. Login as `admin@example.com` / `Admin123!`
3. Verify redirected to `/command-center`
4. Click each new route in IconRail: `/marketplace`, `/departments`, `/service-desk`, `/intelligence`, `/finance`
5. Verify charts, KPIs, tables render
6. Click each tab within pages

### 4.5 Stage the rollout (per-feature flag)

After 24h soak with all flags `false` (validating rewrites work):

```bash
# Day 1: enable Command Center
vercel env add NEXT_PUBLIC_REDESIGN_COMMAND_CENTER production  # set to "true"

# Day 3: enable Workspace
vercel env add NEXT_PUBLIC_REDESIGN_WORKSPACE production

# Day 5: enable Marketplace
# Day 7: enable Service Desk, Intelligence, Finance, Departments
```

Each flag-on requires a redeploy (env vars trigger new build).

---

## 5. Rollout Phases (Production)

| Day | Action | Flag |
|---|---|---|
| 0 | Backend deploy (all backend changes) | n/a |
| 0 | Frontend deploy with all flags `false` | n/a |
| 1 | Enable Command Center for 10% tenants via override | `commandCenter` |
| 2 | Expand to 50% tenants | `commandCenter` |
| 3 | 100% tenants on Command Center; enable Workspace | `commandCenter`, `workspace` |
| 5 | Enable Marketplace | `marketplace` |
| 7 | Enable Service Desk, Intelligence, Finance, Departments | `serviceDesk`, `intelligence`, `finance`, `departments` |
| 30 | Check observability — measure direct-hits vs rewrite-hits per old route | n/a |
| 60 | When 95% direct hits, remove old routes + rewrites in single minor release | n/a |

---

## 6. Smoke Tests

### 6.1 Backend (after Phase 3)

```bash
# See phase1-implementation-summary.md §5.3 for full curl list
curl https://brain.neurecore.com/api/v1/health
```

### 6.2 Frontend (Playwright)

```bash
cd /home/najeeb/Linux-Dev/neurecore-base/neurecore/frontend-tenant

# Install Playwright
pnpm add -D @playwright/test
pnpm exec playwright install chromium

# Run smoke tests
pnpm exec playwright test
```

Tests cover (per `tests/e2e/smoke.spec.ts`):
- Login flow → command-center
- Each new route renders
- Tab switching preserves URL state
- Theme cycle works
- Old `/dashboard` redirects to `/command-center`
- ⌘K opens command palette
- No console errors on any of 22 routes
- Mobile viewport (375×812) renders without horizontal overflow

---

## 7. Observability

### 7.1 Key metrics to monitor (first 7 days)

| Metric | Where | Threshold |
|---|---|---|
| `GET /agents?departmentId=` success rate | `?departmentId=` filter | ≥ 99% |
| `GET /routines?ownerAgentIds=` success rate | ownerAgentIds filter | ≥ 99% |
| `GET /costs/summary?tenantId=` success rate | Phase 1 Gap 6a fix | ≥ 99% |
| `POST /deploy/agents/from-template/` success rate | spawn endpoint | ≥ 95% (some 4xx for tenant scope violations OK) |
| `PATCH /agents/:id/archive` success rate | archive endpoint | ≥ 99% |
| Frontend route direct-hit count per route | Vercel logs | rising trend |
| Command Center page load time | Web Vitals | < 2s P75 |
| TTI (Time to Interactive) on marketplace | Web Vitals | < 3s P75 |
| Total bundle size | Vercel build | < 500KB (current ~280KB) |

### 7.2 Alerts

Set up alerts for:
- Backend 5xx rate > 1% sustained 5 min
- `prisma.executionLog.findMany` error rate > 0.1% (Phase 1 Gap 6a fix regression)
- Frontend console error rate > 0.5%
- Any new 4xx on `/api/v1/agent-templates/platform` (regression of Gap 2)

---

## 8. Rollback Procedures

### 8.1 Frontend rollback

Vercel makes this trivial:
1. Go to Deployments → find last working deploy
2. Click "..." → "Promote to Production"

OR revert env vars to disable all flags → all users see old shell.

### 8.2 Backend rollback

```bash
ssh contabo
cd /opt/neurecore/backend

# Revert code (only safe if no client has called new endpoints)
git checkout <last-good-sha>
pnpm install --frozen-lockfile
pnpm build
pm2 restart neurecore-backend

# Revert migration (last resort, requires app outage)
psql "$DATABASE_URL" <<EOF
BEGIN;
ALTER TABLE "routines" DROP COLUMN IF EXISTS "ownerAgentId";
ALTER TABLE "agent_templates" DROP COLUMN IF EXISTS "deprecatedAt";
ALTER TABLE "agent_templates" DROP COLUMN IF EXISTS "supersededByTemplateId";
COMMIT;
EOF
```

**Note:** Postgres enums cannot remove values. ARCHIVED/DEPRECATED stay even after rollback but are unused.

---

## 9. Post-Deploy Verification (Day 1, 7, 30)

### Day 1 (immediately after deploy)

- [ ] Backend smoke tests all pass (curl list above)
- [ ] Frontend smoke tests pass (Playwright)
- [ ] No alerts firing
- [ ] Login + 5 main routes work end-to-end
- [ ] Old `/dashboard`, `/costs`, `/inbox` etc. still work via rewrites

### Day 7 (after 10–100% rollout)

- [ ] No regression in backend error rate
- [ ] Per-route direct-hit count rising (validates adoption)
- [ ] All Phase 1 endpoints hit at least once
- [ ] No client reports of 4xx on the new endpoints

### Day 30 (before Phase 11 old route removal)

- [ ] ≥ 95% direct hits on each new route (vs. rewrites)
- [ ] ≤ 5% old route usage (excluding legacy clients with hardcoded URLs)
- [ ] Decision: schedule old route removal in next minor release

---

## 10. Files Inventory

### Backend files modified

```
backend/src/modules/agent-templates/agent-templates.controller.ts        (Gap 2)
backend/src/modules/agents/deployment.controller.ts                     (Gap 3)
backend/src/modules/agents/services/deployment.service.ts                (Gap 3)
backend/src/modules/agents/services/agents.service.ts                   (Gap 7)
backend/src/modules/agents/agents.controller.ts                          (Gap 7)
backend/src/modules/costs/costs.controller.ts                            (Gap 6)
backend/src/modules/costs/providers/langsmith-cost-provider.ts          (Gap 6a)
backend/src/modules/agent-templates/agent-templates.service.ts            (Gap 8)
backend/src/modules/goals/goals.controller.ts                            (Gap 6)
backend/src/modules/projects/projects.controller.ts                      (Gap 6)
backend/src/modules/inbox/inbox.controller.ts                            (Gap 6)
backend/src/modules/routines/routines.controller.ts                      (Gap 6)
backend/src/modules/routines/dto/routine.dto.ts                          (Gap 1)
backend/src/modules/routines/interfaces/routine.interface.ts             (Gap 1)
backend/src/modules/routines/repositories/prisma-routine.repository.ts    (Gap 1)
backend/prisma/schema.prisma                                             (Gaps 1, 7, 8)
backend/prisma/migrations/20260625_phase1_gaps/migration.sql              (NEW)
```

### Frontend files modified

```
frontend-tenant/tailwind.config.js                                       (Phase 2)
frontend-tenant/src/app/globals.css                                      (Phase 2)
frontend-tenant/next.config.js                                           (Phase 2)
frontend-tenant/src/components/creatio/KpiCard.tsx                       (Phase 2)
frontend-tenant/src/components/creatio/EntityTable.tsx                   (Phase 2)
frontend-tenant/src/components/creatio/DetailPanel.tsx                   (Phase 2)
frontend-tenant/src/components/creatio/ActionToolbar.tsx                 (Phase 2)
frontend-tenant/src/components/creatio/StatusBadge.tsx                   (Phase 2)
frontend-tenant/src/components/creatio/QuickAction.tsx                   (Phase 2)
frontend-tenant/src/components/creatio/index.ts                          (Phase 2)
frontend-tenant/src/hooks/useFeatureFlag.ts                              (Phase 3)
frontend-tenant/src/components/layout/TopBar.tsx                         (Phase 3)
frontend-tenant/src/components/layout/IconRail.tsx                      (Phase 3)
frontend-tenant/src/components/TenantShell.tsx                           (Phase 3)
frontend-tenant/src/app/page.tsx                                        (Phase 4)
frontend-tenant/src/app/login/page.tsx                                  (Phase 4)
frontend-tenant/src/app/register/page.tsx                               (Phase 4)
frontend-tenant/src/shared/constants/routes.ts                           (Phase 4)
frontend-tenant/src/services/register-commands.ts                        (Phase 4)
frontend-tenant/src/app/command-center/page.tsx                          (Phase 4)
frontend-tenant/src/app/departments/[id]/workspace/page.tsx             (Phase 5)
frontend-tenant/src/app/marketplace/page.tsx                             (Phase 6)
frontend-tenant/src/app/service-desk/page.tsx                            (Phase 7)
frontend-tenant/src/app/intelligence/page.tsx                           (Phase 8)
frontend-tenant/src/app/finance/page.tsx                                (Phase 9)
frontend-tenant/src/app/departments/page.tsx                            (Phase 10)
frontend-tenant/playwright.config.ts                                    (Phase 12)
frontend-tenant/tests/e2e/smoke.spec.ts                                 (Phase 12)
```

### Memory bank files created

```
memory-bank/new_neurecore.md                                            (1,109 LOC — main plan)
memory-bank/p0-a-investigation.md                                       (Prisma investigation)
memory-bank/p0-c-report.md                                             (P0-C findings)
memory-bank/p0-d-decisions.md                                          (P0-D locks)
memory-bank/phase1-implementation-summary.md                            (Backend gaps)
memory-bank/phase2-implementation-summary.md                            (Design tokens)
memory-bank/phase3-implementation-summary.md                            (Shell)
memory-bank/phase4-implementation-summary.md                            (Command center)
memory-bank/phase5-implementation-summary.md                            (Workspace)
memory-bank/phase6-implementation-summary.md                            (Marketplace)
memory-bank/phase7-implementation-summary.md                            (Service desk)
memory-bank/phase8-implementation-summary.md                            (Intelligence)
memory-bank/phase9-implementation-summary.md                            (Finance)
memory-bank/phase10-implementation-summary.md                           (Departments)
memory-bank/deployment-guide.md                                        (THIS FILE)
memory-bank/verification-checklist.md                                  (Phase 12 Step 3)
memory-bank/runbook.md                                                 (Phase 12 Step 4)
```

---

**Last updated:** 2026-06-25 16:05
**Document version:** 1.0 — ready for staging deploy