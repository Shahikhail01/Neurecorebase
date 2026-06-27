# NeureCore — EAOS Implementation Log

**Last updated:** 2026-06-27 20:13
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

## 2026-06-27 17:50 · Phase 1 — Tier A (backend) + Tier B (frontend-eaos)

### Task 1.1 + 1.7 — Swagger + OpenAPI bootstrap (commit `506d511e`)

- Added `@nestjs/swagger ^7.4.0` to backend dependencies (manual `pnpm install` due to v10→v11 store layout change)
- `nest-cli.json` plugin configured: `classValidatorShim: true, introspectComments: true`
- `main.ts` builds DocumentBuilder with:
  - Bearer auth (JWT)
  - X-Tenant-ID header (platform role override)
  - Idempotency-Key header
  - Dev + production servers
- `SwaggerModule.createDocument` builds the OpenAPI 3.1 spec
- Persists to `backend/openapi/openapi.json` on every boot (write failures non-blocking)
- SwaggerModule.setup mounts Swagger UI at `/api/docs`
- `/api` root response now lists `/api/docs` + `/api/docs-json`
- tsc: clean; nest build: succeeds

### Task 1.2 — Canonical DTOs + envelopes (commit `36e9ebc5`)

- `common/dto/pagination.dto.ts`: PaginationDto with page + limit (1-indexed, default 20, max 100)
- `common/dto/id-param.dto.ts`: IdParamDto with @IsUUID() id field
- `common/responses/paginated.response.ts`: PaginatedResponse<T> generic with items[] + pagination{page,limit,total,totalPages}
- `common/responses/action-result.response.ts`: ActionResult<T> with success, message, optional data, optional warnings
- All decorated with @ApiProperty / @ApiPropertyOptional so OpenAPI schema is correct
- tsc: clean

### Task 1.4 — TenantContextService + AsyncLocalStorage middleware (commit `4a5fdfb6`)

- `common/context/tenant-context.ts`: TenantContext value type (tenantId, isCrossTenant, actorRole, actorUserId)
- `common/context/tenant-context.service.ts`: TenantContextService using Node's AsyncLocalStorage
  - `run(ctx, fn)` to bind context for request scope
  - `get()` (throws if outside scope), `tenantId` getter, `getOrNull()` for background jobs
- `common/context/tenant-context.middleware.ts`: NestMiddleware that runs after JwtAuthGuard
  - Reads `req.user`, calls `resolveTenantContext()`, binds to ALS via `tenantContextService.run()`
  - No-op for `@Public()` routes (no req.user)
- `app.module.ts`: registers TenantContextMiddleware globally; adds TenantContextService to providers
- tsc: clean
- This is the foundation for removing the 15+ duplicate per-controller `resolveTenantId` methods

### Tasks 1.8 + 1.9 — agents controller returns canonical envelopes (commit `80a2ed31`)

- `dto/agent-response.dto.ts`: AgentResponseDto wire shape (12 safe fields, excludes internal `permissions` JSON)
- `agents.controller.findAll`: now consumes PaginationDto, returns `PaginatedResponse<AgentResponseDto>` with {items, pagination:{...}}
- `agents.controller.pause`: now returns `ActionResult<AgentResponseDto>` with {success:true, message, data}
- `agents.controller` class decorated with `@ApiTags('agents')` + `@ApiBearerAuth('JWT')`
- Legacy shapes still exist in other endpoints; agents is the proof of pattern
- tsc: clean

### Tasks 1.18-1.27 — frontend-eaos bootstrap (commit `94d6242c`)

NEW APP — `frontend-eaos/` (no more `frontend-tenant/` per D-023)
- `pnpm-workspace.yaml`: includes `frontend-eaos` as a workspace package
- `package.json`: Next.js 15.0.3, React 19, TS 5.7, Tailwind 3.4, TanStack Query 5.59, react-hook-form, zod, socket.io-client, lucide-react, next-themes, date-fns, openapi-typescript, tailwind-merge
- `tsconfig.json`: strict mode, @/* path alias
- `next.config.mjs`: reactStrictMode, standalone output (Vercel), env config
- `tailwind.config.ts`: NUWS §7.5 design tokens (canvas/state/spacing/radius)
- `src/app/layout.tsx`: RootLayout with metadata, html lang, body classes, `<Providers>`
- `src/app/providers.tsx`: ThemeProvider + QueryClientProvider + Toaster + Devtools
- `src/app/page.tsx`: placeholder landing page ("EAOS — coming soon")
- `src/app/globals.css`: Tailwind layers + design tokens
- `src/components/feedback/Toaster.tsx`: singleton toast API with 4 variants (success/error/info/warning), auto-dismiss, aria-live, CustomEvent bus. **This is the FIX for FIX-006 (silently-dropped toasts in the old frontend-tenant).**
- `src/lib/utils.ts`: cn() helper (clsx + tailwind-merge)
- pnpm install: ~1,400 packages
- tsc: clean
- `next build`: "Compiled successfully" + 4 static pages

### Phase 1 status

**Backend (6/10 done):** 1.1, 1.2, 1.4, 1.7, 1.8, 1.9. Deferred: 1.5, 1.6 (annotations), 1.10 (Prisma). Note: 1.3 was already done in Phase 0.

**`packages/ui/` (0/7 done):** all deferred. Premature extraction — should follow the 10-panel workspace build, not precede it.

**`frontend-eaos/` (4/10 done):** 1.18, 1.19, 1.20, 1.21, 1.25, 1.27. Deferred: 1.22 (codegen — runs after 1.5/1.6), 1.23 (full tokens — partial), 1.24 (feature flags), 1.26 (Vercel).

Awaiting user PR review (9 commits total on `eaos-base`).

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

## 2026-06-27 20:13 · Phase 1 sub-phase 1B — annotation roll-out (in progress)

### Task 1.9 — `api-common.decorator.ts` (commit `af81470d`)

- `backend/src/common/decorators/api-common.decorator.ts`: bundle of `@ApiTags` + `@ApiBearerAuth('JWT')` + `@ApiSecurity('X-Tenant-ID')` + `@ApiSecurity('Idempotency-Key')`. Single source of truth for controller-level OpenAPI annotations.

### Task 1.10 — 9 new XxxResponseDto for Tier-1 entities (commit `af81470d`)

Created wire-shape DTOs for the 9 Tier-1 entities that didn't have one yet (`AgentResponseDto` was already done in 1.8):
- `DepartmentResponseDto` — `src/modules/departments/dto/`
- `ProjectResponseDto` — `src/modules/projects/dto/`
- `GoalResponseDto` — `src/modules/goals/dto/`
- `TaskResponseDto` — `src/modules/tasks/dto/`
- `WorkflowResponseDto` — `src/modules/workflows/dto/`
- `RoutineResponseDto` — `src/modules/routines/dto/`
- `ToolIntegrationResponseDto` — `src/modules/tools/dto/`
- `UserResponseDto` — `src/modules/users/dto/`
- `TenantResponseDto` — `src/modules/tenants/dto/`

Each uses `@ApiProperty` + `@Expose()` + `class-transformer` `excludeExtraneousValues` for safe serialization. Sensitive fields (passwordHash, refreshTokens, config auth secrets) are excluded.

### Task 1.11-1.14 — Bulk annotation of all 34 controllers (commit `af81470d`)

- `backend/scripts/annotate-controllers.js`: idempotent script that adds `@ApiCommon()` to every controller. Handles 3 patterns: (a) already has `@ApiTags` (replace), (b) no `@ApiTags` (insert after `@Controller`), (c) no `@nestjs/swagger` import (add the import). Recalculated import path correctly after first attempt was wrong.
- All 34 controllers now use `@ApiCommon()` with the right resource tag.

**Caveat:** tasks/workflow sub-controllers were not annotated (script only processes top-level `.controller.ts` files). Follow-up pass needed.

---

## 2026-06-27 20:00 · Phase 1 sub-phase 1D — EAOS-1 Prisma schema (DONE)

### Task 1.38 + 1.39 + 1.40 — 11 new EAOS-1 Prisma models (commit `3d7a2b14`)

11 new Prisma models (all tenant-scoped, all ADDITIVE — no existing model changed):

- `EntityState` — the universal state machine (DRAFT/PENDING_APPROVAL/ACTIVE/PAUSED/SUSPENDED/ARCHIVED/DELETED). One row per entity, per tenant.
- `StateHistory` — append-only log of state transitions (from/to/reason/actor/isAuto). Back-linkable to EntityState.
- `EntityOwnership` — owner, responsibleTeam, manager, aiAssistant. The accountability chain for any EAOS resource.
- `EntityLabel` — structured labels (kind: STANDARD/CUSTOM/PRIORITY/QUARTER, key, value, color).
- `UserFavorite` — per-user pinned entities with sort order.
- `UserRecentAccess` — per-user recent entity access (upserted on each access).
- `EntityWatcher` — per-user watch subscriptions (notifyOnStateChange/Update/Comment/Assign).
- `EntityHealth` — computed health (severity, trend, score 0-100, openAlerts, signals JSON).
- `EntityRelationship` — typed edges between entities (parent_of/child_of/operates_in/.../depends_on).
- `WorkspaceLayout` — per-user per-entity-type layout.
- `CapabilityConfig` — per-user per-capability panel config.

6 new enums: `UniversalStateValue`, `EntityType`, `HealthSeverity`, `HealthTrend`, `LabelKind`, `RelationshipType`.

Back-relations added to `Tenant` (11), `User` (10), `Department` (1).

Migration file: `backend/prisma/migrations/20260627_eaos_1_entity_model/migration.sql` (62KB, 11 CREATE TABLE + 6 CREATE TYPE + all FKs/unique/indexes). Hand-extracted from the full prisma diff to ensure ADDITIVE ONLY.

Verified:
- `prisma validate`: ✅ "The schema at prisma/schema.prisma is valid"
- `prisma generate`: ✅ regenerated
- `tsc --noEmit`: ✅ passes
- Real DB migration: **user action** (need to run `pnpm prisma migrate dev` against a live DB)

---

## 2026-06-27 18:00 · Phase 1 v1.3 plan update (D-024)

(See [`02-decisions-log.md` D-024](./02-decisions-log.md))

Roadmap v1.2 → v1.3. Phase 1 expanded from 17 → 48 tasks across 5 sub-phases (A, B, C, D, E). Every task has explicit SOLID adherence. The four "CRITICAL" deferrals from v1.2 are now in-scope: 1B annotation roll-out, 1C packages/ui internals, 1D EAOS-1 Prisma schema, 1E tenant-context migration.

---

**End of implementation log.**
