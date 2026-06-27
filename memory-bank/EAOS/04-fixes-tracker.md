# NeureCore — EAOS Fixes Tracker

**Last updated:** 2026-06-27
**Purpose:** Track bugs, security issues, and their fixes found during the EAOS audits and subsequent work. Each entry: ID, severity, status, file references, doc reference.

**Severity scale:**
- 🔴 **Critical** — exploitable in production, data loss or unauthorized access
- 🟠 **High** — security-adjacent, significant UX impact, or compliance violation
- 🟡 **Medium** — correctness bug, performance issue, or significant inconsistency
- 🟢 **Low** — cosmetic, code health, or future-proofing

**Status:** Open / In Progress / Fixed / Won't Fix

---

## Phase 0 Fixes (security lockdown, Week 1)

These are the 7 tasks from [`EAOS-implementation-roadmap.md` §4](./EAOS-implementation-roadmap.md). All must complete in Week 1 before any new feature work.

**Per D-022 + D-023 (2026-06-27):** tasks 0.6 and 0.7 are **ELIMINATED** by deleting `frontend-tenant/`. The bugs they addressed (wrong-token-key, Toaster wiring) cannot exist in the new `frontend-eaos/` because it uses httpOnly cookies from day 1 and includes a wired Toaster in the initial scaffold. The other 5 tasks (0.1–0.5) proceed on the backend regardless.

### FIX-001 · `tools.controller.ts:execute` and related endpoints are unauthenticated

- **Severity:** 🔴 Critical
- **Status:** ✅ **Fixed** (commit `c00dff57` on `eaos-base`)
- **File:** `backend/src/modules/tools/tools.controller.ts:38-86` (rewritten)
- **Description:** `POST /tools/execute`, `POST /tools/:id/execute`, `GET /tools/:id/status` had no `@Roles` decorator and no `JwtAuthGuard` on the controller. Anyone could invoke any tool by name or id. `tools.service.ts:executeById` only optionally read `user?.tenantId` without verifying ownership.
- **Fix applied:** Added `@UseGuards(JwtAuthGuard, RolesGuard)` at class level; added `@Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.USER)` to execute methods; added `ToolsService.assertIntegrationAccess` as the single chokepoint for cross-tenant denial.
- **Doc ref:** [`EAOS-rbac-model.md` §4.5](./EAOS-rbac-model.md)

### FIX-002 · SSE accepts any sessionId without ownership check

- **Severity:** 🔴 Critical
- **Status:** ⬜ Open (Phase 0, task 0.3)
- **File:** `backend/src/modules/agents/streaming/agent-streaming.controller.ts:71-132`
- **Description:** `GET /agents/streaming/sessions/:sessionId/events` accepts the session ID and assumes the requester owns the session. Any user with a valid JWT can subscribe to any session's events.
- **Fix:** Look up the session; reject with 403 if `session.userId !== req.user.id` (unless platform role).
- **Doc ref:** [`EAOS-api-contract.md` §9.2](./EAOS-api-contract.md)

### FIX-003 · AuditInterceptor only `console.log`s; `AuditLog` DB is mostly empty

- **Severity:** 🟠 High (compliance)
- **Status:** ⬜ Open (Phase 0, task 0.4)
- **File:** `backend/src/common/interceptors/audit.interceptor.ts` (full file)
- **Description:** The interceptor is registered as `APP_INTERCEPTOR` (`app.module.ts:144`) but only `console.log`s via `logRequest`/`logResponse`/`logError`. `AuditService.log()` (which writes to DB) is called from almost no controller. Result: the `AuditLog` table is mostly empty. Compliance gap.
- **Fix:** Modify the interceptor to call `AuditService.log()` on every `POST/PATCH/DELETE`. Skip `GET` (volume concern). Fire-and-forget (no request blocking). Add per-tenant log throttle.
- **Doc ref:** [`EAOS-rbac-model.md` §8](./EAOS-rbac-model.md)

### FIX-004 · Two `RolesGuard` implementations with divergent `UserRole` enums

- **Severity:** 🟠 High
- **Status:** ✅ **Fixed** (commit `c00dff57` on `eaos-base`)
- **Files:**
  - `backend/src/modules/security/guards/roles.guard.ts` (duplicate, never wired globally) — **DELETED**
  - `backend/src/modules/security/guards/permissions.guard.ts` (1,115 lines of dead code) — **DELETED**
  - `backend/src/shared/types/security.types.ts` — **REWRITTEN** (removed divergent `UserRole`, `Permission`, `ROLE_PERMISSIONS`; uses Prisma `UserRole` as single source of truth)
  - `backend/src/modules/tiers/tiers.controller.ts:29` — **FIXED** (import from canonical `auth/guards/roles.guard`)
  - `backend/src/modules/tiers/agent-pool.controller.ts:28` — **FIXED** (same)
- **Description:** Two `UserRole` enums existed. The divergent one in `security.types.ts` had 6 values; the Prisma enum has 8. The duplicate `RolesGuard` read from the divergent enum and was used by `tiers.controller.ts` (bypassing the global guard). The `PermissionsGuard` and `RequirePermissions` decorator were fully typed but never invoked anywhere.
- **Fix applied:** All divergent code deleted; tiers now uses the canonical `auth/RolesGuard` which uses Prisma's `UserRole`.
- **Doc ref:** [`EAOS-rbac-model.md` §1.2, §3.1, §11](./EAOS-rbac-model.md)

### FIX-005 · Wrong-token-key bug: 11+ frontend files silently send unauthenticated requests

- **Severity:** 🟠 High (silent data corruption)
- **Status:** ✅ **Fixed** (by deletion of `frontend-tenant/` per D-023, 2026-06-27)
- **Files (in deleted `frontend-tenant/`):**
  - `frontend-tenant/src/app/service-desk/page.tsx:107-120`
  - `frontend-tenant/src/app/finance/page.tsx:178`
  - `frontend-tenant/src/app/intelligence/page.tsx:301, 409, 534, 647`
  - `frontend-tenant/src/app/intelligence/page.tsx` (multiple other places)
- **Description:** Raw `fetch()` calls read `localStorage.getItem('accessToken')` (wrong key). The canonical `TokenManager` uses `hq_access_token` (being renamed to `nc_access_token`). The wrong-key reads return `null`; the request runs unauthenticated; backend returns 200 with empty data; page silently renders zeros.
- **Resolution per D-023:** `frontend-tenant/` deleted in full. The bug class is impossible in the new `frontend-eaos/` because it uses httpOnly cookies from day 1 (no `localStorage` at all).
- **Doc ref:** [`EAOS-frontend-data-layer.md` §4.2](./EAOS-frontend-data-layer.md)

### FIX-006 · Toaster silently drops all toasts

- **Severity:** 🟡 Medium
- **Status:** ✅ **Fixed** (by deletion of `frontend-tenant/` per D-023, 2026-06-27)
- **Files (in deleted `frontend-tenant/`):**
  - `frontend-tenant/src/core/services/notification/NotificationService.ts`
  - `frontend-tenant/src/core/services/notification/ToastStrategy.ts`
  - `frontend-tenant/src/app/layout.tsx`
- **Description:** `NotificationService` with `ToastStrategy` is fully implemented; `ToastStrategy` fires `window` CustomEvent `hq:toast`; no listener exists. Toasts are silently dropped. In-app notifications DO work (via `notificationStore`).
- **Resolution per D-023:** `frontend-tenant/` deleted in full. The new `frontend-eaos/` includes the Toaster wiring in the initial scaffold.
- **Doc ref:** [`EAOS-frontend-data-layer.md` §8.3](./EAOS-frontend-data-layer.md)

### FIX-007 · Inconsistent tenant-isolation enforcement; only one `findOne` explicitly checks cross-tenant

- **Severity:** 🟡 Medium (latent — works by convention)
- **Status:** ⬜ Open (Phase 0, task 0.5)
- **Files:** all `findOne` methods that don't check `resource.tenantId === user.tenantId` explicitly
- **Description:** Only `tenants.controller.ts:55-63` has an explicit cross-tenant check ("OWNER may not read a different tenant"). Everywhere else relies on service methods receiving `tenantId` as a parameter and using it in Prisma `where` clauses. If a future service method forgets the `tenantId` arg, it's a security incident.
- **Fix:** Add a `TenantContextMiddleware` + `EntityOwnerGuard` (introduced in Phase 3, but the middleware can land in Phase 0 as a stop-gap) that throws `CROSS_TENANT_ACCESS` if the resource is not in the user's tenant. Apply to all `findOne` methods.
- **Doc ref:** [`EAOS-rbac-model.md` §5, §10`](./EAOS-rbac-model.md), [`EAOS-api-contract.md` §6.3`](./EAOS-api-contract.md)

---

## Audit-Found Issues (not in Phase 0; scheduled for later phases)

These were found during the audits but are scheduled for later phases per the roadmap.

### FIX-101 · List responses return 4 different shapes

- **Severity:** 🟡 Medium
- **Status:** Scheduled for Phase 1 (`EAOS-api-contract.md` §3.2, §12.2)
- **Files:** all list endpoints
- **Description:** Some return `{ data, total, page, limit, totalPages }` (agents), some `{ items, total, page, limit }` (users), some raw arrays (departments), some `{ providers: [...] }` (connectors).
- **Fix:** Standardize on `PaginatedResponse<T>` per `EAOS-api-contract.md` §3.2.

### FIX-102 · Action responses are ad-hoc

- **Severity:** 🟡 Medium
- **Status:** Scheduled for Phase 1 (`EAOS-api-contract.md` §3.3, §12.2)
- **Description:** `{ message, agent }`, `{ success: true }`, `{ ok: true }`, `{ acknowledged: true }`, `{ reset, ... }`, `{ purged: count }`, `{ url }`.
- **Fix:** Standardize on `ActionResult<T>` per `EAOS-api-contract.md` §3.3.

### FIX-103 · `resolveTenantId` duplicated 15+ times

- **Severity:** 🟡 Medium
- **Status:** Scheduled for Phase 1 (`EAOS-api-contract.md` §6.2)
- **Files:** `agents.controller.ts:45-53`, `departments.controller.ts:31-39`, `finance.controller.ts:24-30`, `reliability.controller.ts:32-38`, etc.
- **Fix:** Extract to `backend/src/common/utils/resolve-tenant-context.ts`.

### FIX-104 · `PaginatedResponse<T>` defined but never used

- **Severity:** 🟢 Low (dead code)
- **Status:** Scheduled for Phase 1
- **File:** `backend/src/common/types/api-response.types.ts:23-35`
- **Fix:** Either adopt (preferred — see FIX-101) or delete.

### FIX-105 · `streaming` controller hand-rolls full path

- **Severity:** 🟢 Low
- **Status:** Scheduled for Phase 1 (`EAOS-api-contract.md` §8.18)
- **File:** `backend/src/modules/agents/streaming/agent-streaming.controller.ts:11` uses `@Controller('api/v1/agents/streaming')` instead of standard `@Controller({ path, version })`
- **Fix:** Move to standard convention.

### FIX-106 · `AppError` subclasses defined but rarely used

- **Severity:** 🟢 Low
- **Status:** P2 (`EAOS-rbac-model.md` §1.2)
- **File:** `backend/src/common/errors/app-errors.ts` (1,115 lines)
- **Description:** Most controllers throw raw Nest `HttpException`s instead of structured `AppError` subclasses.
- **Fix:** Either commit to using them everywhere (replacing raw `HttpException` throws) or trim to what's actually used.

### FIX-107 · `ValidatedUser` interface duplicated in chat controller

- **Severity:** 🟢 Low
- **Status:** P2
- **File:** `frontend-tenant/src/app/chat/page.tsx:15-19` (or wherever the inline copy is)
- **Fix:** Use the canonical `JwtPayload` from `auth/interfaces/token.interface.ts`.

### FIX-108 · Frontend has 2 parallel `ApiResponse<T>` definitions

- **Severity:** 🟢 Low
- **Status:** Scheduled for Phase 2 (`EAOS-frontend-data-layer.md` §1.2)
- **Files:** `frontend-tenant/src/types/api.types.ts`, `frontend-tenant/src/core/services/api/interfaces/IApiClient.ts:11`
- **Fix:** Delete duplicate; use one.

### FIX-109 · Frontend has 2 parallel HTTP clients

- **Severity:** 🟡 Medium
- **Status:** Scheduled for Phase 2 (`EAOS-frontend-data-layer.md` §2.1, §6)
- **Files:**
  - `frontend-tenant/src/services/api.ts` (legacy, used by most pages)
  - `frontend-tenant/src/core/services/api/clients/RestClient.ts` (new, SOLID-clean, used by 0 app pages)
- **Fix:** Retire the legacy `api.ts` once all pages use `restClient` via TanStack Query.

### FIX-110 · Frontend has 2 parallel socket implementations

- **Severity:** 🟡 Medium
- **Status:** Scheduled for Phase 2 (`EAOS-frontend-data-layer.md` §5.1)
- **Files:**
  - `frontend-tenant/src/services/socket.ts` (legacy lazy function)
  - `frontend-tenant/src/core/infrastructure/socket/SocketManager.ts` (new class)
- **Fix:** Retire legacy.

### FIX-111 · `CacheManager.ts` is unused (and its GC is never started)

- **Severity:** 🟢 Low
- **Status:** Scheduled for Phase 2 (`EAOS-frontend-data-layer.md` §3.12)
- **File:** `frontend-tenant/src/core/infrastructure/cache/CacheManager.ts:65-66`
- **Fix:** Delete (TanStack Query replaces it).

### FIX-112 · `storeEventBridge.ts` partially duplicates TanStack Query invalidation

- **Severity:** 🟢 Low
- **Status:** Scheduled for Phase 2 (`EAOS-frontend-data-layer.md` §3.6)
- **File:** `frontend-tenant/src/core/infrastructure/socket/storeEventBridge.ts`
- **Fix:** Replace with `infrastructure/socket/queryEventBridge.ts` that invalidates TanStack Query keys.

### FIX-113 · 6 of 12 Zustand stores are server data, should be TanStack Query

- **Severity:** 🟡 Medium
- **Status:** Scheduled for Phase 2 (`EAOS-frontend-data-layer.md` §3.11)
- **Files:** `agentStore.ts`, `taskStore.ts`, `workflowStore.ts`, `departmentStore.ts`, `chatStore.ts`, `activityStore.ts`
- **Fix:** Delete after migrating consumers to TanStack Query hooks.

### FIX-114 · WorkspaceShell shows same tabs/buttons to all roles

- **Severity:** 🟡 Medium
- **Status:** Scheduled for Phase 3 (`EAOS-rbac-model.md` §10, `EAOS-NUWS-principles.md` §2)
- **File:** `frontend-tenant/src/app/departments/[id]/workspace/page.tsx:79-89, 392-414`
- **Description:** `TABS` array is the same for every role. "+ New Task/Workflow/Routine/Project/Goal" and "Assign User" buttons shown to any authenticated tenant user. Backend rejects non-`OWNER/ADMIN` users on workflows/routines; UI doesn't preempt.
- **Fix:** Add `<Can>` gating throughout the new workspace.

### FIX-115 · `OnboardingInvitation.role` accepts any `UserRole` value

- **Severity:** 🟠 High
- **Status:** Scheduled for Phase 3 (`EAOS-rbac-model.md` §1.2)
- **File:** `backend/prisma/schema.prisma:1522`
- **Description:** The form could invite someone as `SUPER_ADMIN`, who then has `tenantId: null` and platform-wide access.
- **Fix:** Restrict to tenant roles (`OWNER`, `ADMIN`, `USER`, `AUDITOR`) in the invitation flow.

### FIX-116 · `@TierLimit` decorator used only 2x of 7 possible

- **Severity:** 🟡 Medium
- **Status:** Scheduled for Phase 1 (`EAOS-rbac-model.md` §7)
- **Description:** Only `maxUsers` and `maxDepartments` enforced via guard. `maxAgents` enforced ad-hoc in `deployment.service.ts:86`; others not enforced at all.
- **Fix:** Expand `@TierLimit` usage per the spec.

### FIX-117 · `Agent.permissions: Json` is a hint, not enforced

- **Severity:** 🟡 Medium
- **Status:** Scheduled for Phase 5 (`EAOS-rbac-model.md` §1.2)
- **File:** `backend/prisma/schema.prisma:510` (`Agent.permissions`), `:470` (`AgentTemplate.permissions`)
- **Description:** Opaque JSON arrays consumed only by `IStructuredToolRegistry.getByPermissions()` as an LLM hint. Never enforced as an ACL.
- **Fix:** Promote to a first-class field used by `ActionAuthorizationGuard`.

### FIX-118 · Per-user rate limiting on AI actions is absent

- **Severity:** 🟡 Medium
- **Status:** Scheduled for Phase 5 (`EAOS-rbac-model.md` §6.3)
- **Description:** Only coarse 100 req/min/IP global throttle. No per-user AI action rate limit.
- **Fix:** Add per-user rate limit in `ActionAuthorizationGuard`.

### FIX-119 · No tier restriction on tools/agents

- **Severity:** 🟡 Medium
- **Status:** Scheduled for Phase 5 (`EAOS-rbac-model.md` §6.2)
- **Description:** `AIActionDefinition.tierRequired` field doesn't exist; no model.
- **Fix:** Add field; enforce in `ActionAuthorizationGuard`.

### FIX-120 · UI has no `useCan` / `<Can>` / `hasPermission` helpers

- **Severity:** 🟡 Medium
- **Status:** Scheduled for Phase 3 (`EAOS-rbac-model.md` §10, `EAOS-frontend-data-layer.md` §10)
- **Description:** `useTenantAuth` is the only role gate; it's coarse (tenant-or-not). No permission helper exists.
- **Fix:** Add `useRole`, `useCan`, `<Can>` per spec.

### FIX-121 · Per-resource sharing / ACL doesn't exist

- **Severity:** 🟢 Low (out of v1 scope)
- **Status:** P2 (`EAOS-rbac-model.md` §3.4)
- **Description:** No way to share an entity with a specific user beyond tenant/department membership.
- **Fix:** Deferred to v2 (after 100 paying customers).

### FIX-122 · Department-RBAC doesn't exist

- **Severity:** 🟢 Low (out of v1 scope)
- **Status:** P2
- **Description:** `User.departmentId` is a single FK; no notion of "this user is the head of that department."
- **Fix:** Deferred to v2.

---

## Won't Fix (in v1)

### WONTFIX-001 · Per-tenant custom roles

- **Reason:** Requires `RoleDefinition` table, role-template UI, permission-editor UI. Significant scope. Deferred to v2.

### WONTFIX-002 · Agent impersonation ("act on behalf of user X")

- **Reason:** Requires session-impersonation flow + audit trail. Deferred to v2.

### WONTFIX-003 · Field-level redaction (e.g., "USER can see budget but not line items")

- **Reason:** Requires per-user field-level permission model. Deferred to v2.

---

**End of fixes tracker.**
