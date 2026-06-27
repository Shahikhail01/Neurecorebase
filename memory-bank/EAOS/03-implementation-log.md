# NeureCore — EAOS Implementation Log

**Last updated:** 2026-06-27
**Purpose:** Chronological log of code changes, file references, and shipped features for the EAOS implementation. Newest first.

**Format:** `## DATE · phase N · short title`, then a brief description with file:line references and PR link (when applicable).

---

## 2026-06-27 · Phase — Planning

### Created all 7 architectural EAOS documents

- `EAOS-implementation-plan.md` — v2.4 → v2.6 (reconciled capability count, Ask AI terminology, resolved all 8 §14.2 questions)
- `EAOS-NUWS-principles.md` — v1.0 → v1.2 (added Lifecycle, Mission Feed, Command Palette, Mini-Graph, Compare View, Design Tokens, 6 empty states)
- `EAOS-pricing-plans.md` — v1.0 → v1.2 (added §0a AI Roster requirement)
- `EAOS-api-contract.md` — v1.0 (new, REST/WS/SSE wire format, all EAOS endpoints, OpenAPI generation)
- `EAOS-rbac-model.md` — v1.0 (new, 4-layer auth model, all endpoint permissions, EntityOwnerGuard, ActionAuthorizationGuard)
- `EAOS-frontend-data-layer.md` — v1.0 (new, TanStack Query spec, RestClient, SocketManager, SSEClient, httpOnly cookies, permission hooks)
- `EAOS-implementation-roadmap.md` — v1.0 (new, 11-phase plan with risk, exit criteria, rollback)

### Created 6 operational EAOS documents

- `00-index.md` — master navigation
- `01-active-context.md` — current state
- `02-decisions-log.md` — this file's companion (chronological decisions)
- `03-implementation-log.md` — this file
- `04-fixes-tracker.md` — bugs and fixes
- `05-phase-tracker.md` — per-phase status

### Codebase audits performed (research only, no code changed)

- **Backend API patterns** — 35 modules, 39 controllers, no `@nestjs/swagger`, dual `RolesGuard` files, 4 different list response shapes, 15+ duplicate `resolveTenantId` methods, manual SSE without auth, unauthenticated `/tools/execute`
- **RBAC implementation** — 8 `UserRole` values in Prisma (single source of truth), 2 parallel `UserRole` enums (Prisma vs `security.types.ts`), `PermissionsGuard` + 28-permission enum declared but never invoked, `AuditInterceptor` only `console.log`s (DB mostly empty), `OnboardingInvitation.role` accepts any role including `SUPER_ADMIN`
- **Frontend data layer** — 2 parallel HTTP clients, 2 parallel socket implementations, 2 parallel `ApiResponse<T>` types, 2 parallel endpoint lookup mechanisms, no TanStack Query / SWR, 12 Zustand stores (data + UI mixed), `localStorage` token with wrong-key bug in 11+ files, `ToastStrategy` fires CustomEvent with no listener, half-finished SOLID migration sitting unused in `core/services/`

---

## 2026-06-27 15:45 · Phase 0 — Branch setup + initial commit

### Created `eaos-base` branch

- `git checkout -b eaos-base` from `main` (commit `ccb946c6`)
- Pushed to `origin` (Shahikhail01/Neurecorebase)
- Branch URL: https://github.com/Shahikhail01/Neurecorebase/pull/new/eaos-base

### Initial commit `c00dff57`

- **Phase 0 task 0.1 (dead code removal):** deleted `backend/src/modules/security/guards/roles.guard.ts` and `permissions.guard.ts`; rewrote `backend/src/shared/types/security.types.ts` to drop divergent `UserRole` + `Permission` + `ROLE_PERMISSIONS`; updated `tiers/agent-pool` controllers to use canonical `auth/RolesGuard`
- **Phase 0 task 0.2 (tools auth):** rewrote `backend/src/modules/tools/tools.controller.ts` with `@UseGuards(JwtAuthGuard, RolesGuard)` + per-method `@Roles`; added `ToolsService.assertIntegrationAccess` for tenant-ownership chokepoint
- **13 EAOS doc files:** all of `memory-bank/EAOS/` (7 architectural + 6 operational)
- tsc: passes (no type errors)
- Doc updates: `EAOS-implementation-plan.md` v2.4 → v2.6, `EAOS-NUWS-principles.md` v1.0 → v1.2, `EAOS-pricing-plans.md` v1.0 → v1.2

### Pending in working tree (uncommitted)

None — all Phase 0/0.1-0.2 work + EAOS docs are committed to `eaos-base`.

---

## 2026-06-27 16:11 · D-023 — Deleted `frontend-tenant/`

### Deleted the entire `frontend-tenant/` folder

- Verified contents: 1.2GB (mostly `node_modules`, which is gitignored)
- Confirmed `.env.local` and `.env.production` are gitignored (not in any commit)
- ⚠️ Found a live `VERCEL_OIDC_TOKEN` in `.env.local` — flagged for rotation
- `rm -rf frontend-tenant/`
- Monorepo now contains only: `backend/`, `frontend-admin/`, `frontend-eaos/` (new, not yet built), `packages/ui/` (new, not yet built)

### Doc updates (v2.7 → v2.8)

- `02-decisions-log.md` — D-023 added
- `00-index.md` — remove "frozen" status, single-frontend architecture
- `01-active-context.md` — tasks 0.6/0.7 eliminated; Vercel OIDC rotation added as open thread
- `04-fixes-tracker.md` — FIX-005, FIX-006 marked ✅ (fixed by deletion)
- `05-phase-tracker.md` — Phase 0: 0.6/0.7 removed; Phase 9: dual-support language removed; Phase 10: tasks 10.13-10.15 marked ✅ (done)
- `EAOS-implementation-plan.md` v2.7 → v2.8 — remove "frontend-tenant (frozen)" everywhere
- `EAOS-NUWS-principles.md` v1.3 → v1.4 — remove `frontend-tenant` glossary entry
- `EAOS-frontend-data-layer.md` v1.1 → v1.2 — update §14 to single-frontend
- `EAOS-implementation-roadmap.md` v1.1 → v1.2 — remove Phase 10 decommission; remove Phase 9 dual-support

---

## 2026-06-27 16:30 · Phase 0 — Tasks 0.3, 0.4, 0.5 (backend)

### Task 0.3 — SSE session-ownership check (commit `795702dd`)

- `backend/src/modules/agents/streaming/agent-streaming.controller.ts`: 124 lines changed
- Added `JwtAuthGuard` at class level (was previously unauthenticated)
- New `@CurrentUser() user: JwtPayload` on all session-bearing methods
- New private `canAccessSession(user, session)` is the single chokepoint for cross-tenant/cross-user denial
- Platform roles (SUPER_ADMIN, PLATFORM_ADMIN, SECURITY_OFFICER, SUPPORT) bypass
- `createSession` no longer accepts `?userId=` / `?tenantId=` query params (was a hijack vector); userId/tenantId are derived from the authenticated user
- `listSessions` is now scoped to caller's tenant (unless platform role)
- tsc: clean

### Task 0.4 — AuditInterceptor writes to DB (commit `8d6fe982`)

- `backend/src/common/interceptors/audit.interceptor.ts`: 156 lines changed
- Inject `AuditService` (was Reflector only)
- Skip `GET/HEAD/OPTIONS` (volume concern)
- On `POST/PUT/PATCH/DELETE`: fire-and-forget call to `auditService.log()`
- Action format: `api.POST /tools/:id` (UUIDs normalized to `:id` to avoid cardinality explosion)
- Resource extracted from `request.params` (id, entityId, userId)
- `AuditLog.tenantId` set from `user.tenantId` (tenant-scoped queries now work)
- Result: `success` for 2xx, `failure` for 4xx/5xx
- Console logging preserved (ops-friendly); DB write is the compliance trail
- Audit-write failure is non-blocking (request flow never broken)
- tsc: clean

### Task 0.5 — Tenant isolation helpers (commit `4ef6ef97`)

- `backend/src/common/utils/resolve-tenant-context.ts`: 117 lines, NEW
- `backend/src/common/utils/assert-same-tenant.ts`: 70 lines, NEW
- Applied to `agents.findOne` and `departments.findOne` as proof of pattern
- `resolveTenantContext` matches `EAOS-api-contract.md` §6.2 spec; supports platform role override via header/query/body
- `assertSameTenant` is the defense-in-depth check on loaded entities (matches `EAOS-rbac-model.md` §5)
- Both helpers are platform-role-aware
- Full migration of 15+ duplicate per-controller `resolveTenantId` methods is scheduled for Phase 1
- tsc: clean

### Phase 0 — backend complete

All 5 backend tasks shipped. 4 commits total on `eaos-base`:
- `c00dff57` — Tasks 0.1, 0.2
- `795702dd` — Task 0.3
- `8d6fe982` — Task 0.4
- `4ef6ef97` — Task 0.5

Awaiting user PR review and merge to `main`.

---

## 2026-06-27 15:57 · Decision recorded: D-022

### Build EAOS as a new frontend (`frontend-eaos`)

- `frontend-tenant/` is FROZEN (no new features; critical security fixes only)
- New `frontend-eaos/` will be a clean-slate Next.js 15 + Tailwind app
- Shared `packages/ui/` package for design tokens, components, permission hooks
- Backend switches to httpOnly + Secure + SameSite=Strict cookie auth FIRST (Phase 9 work pulled forward)
- URL: `eaos.neurecore.com/{tenantCompanyName}`
- Decommissioning `frontend-tenant/` only after feature parity + 90-day 301 redirect

### Doc updates (v2.6 → v2.7)

- `EAOS-implementation-plan.md` — redirect file structure to `frontend-eaos/`
- `EAOS-NUWS-principles.md` Appendix D — same
- `EAOS-frontend-data-layer.md` §14 — same + note reduced migration scope
- `EAOS-implementation-roadmap.md` — add scaffolding to Phase 1; note Phase 9 pulled forward; Phase 10 includes frontend-tenant decommission
- `00-index.md`, `01-active-context.md`, `02-decisions-log.md`, `04-fixes-tracker.md`, `05-phase-tracker.md` — operational updates

---

## Pre-2026-06-27 (historical, for context)

Before the EAOS docs were created, the codebase had accumulated the following from earlier phases (referenced in `memory-bank/phase{1-12}-implementation-summary.md`):

- Phase 1-12: onboarding, agents, departments, projects, goals, tasks, workflows, routines, costs, finance, integrations, etc.
- All stored in Prisma models already.
- The Department workspace page at `frontend-tenant/src/app/departments/[id]/workspace/page.tsx` (1,251 lines) was the pre-EAOS workspace prototype.

These are NOT in scope for this log. They predate the EAOS workspace contract and will be gradually replaced by the EAOS-1 entity workspace per `EAOS-implementation-roadmap.md` Phase 3.

---

## Planned (no code yet)

### Phase 0 — Safety Lockdown (Week 1)

Per [`EAOS-implementation-roadmap.md` §4](./EAOS-implementation-roadmap.md), 7 tasks:

**Backend:**
- 0.1: Delete `backend/src/modules/security/guards/roles.guard.ts` and `security.types.ts:UserRole`/`Permission`/`ROLE_PERMISSIONS`
- 0.2: Add `JwtAuthGuard` + `@Roles()` to `tools.controller.ts:execute`, `:execute/:id`, `:id/status`
- 0.3: Add session-ownership check to `agent-streaming.controller.ts:71-132` SSE
- 0.4: Wire `AuditInterceptor` to `AuditService.log()` for all `POST/PATCH/DELETE`
- 0.5: Add explicit `entity.tenantId === user.tenantId` check to all `findOne` methods

**Frontend:**
- 0.6: Fix wrong-token-key bug in 11+ files
- 0.7: Wire `<Toaster />` to existing `ToastStrategy`

---

**End of implementation log.**
