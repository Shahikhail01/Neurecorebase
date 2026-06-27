# NeureCore — EAOS RBAC & Authorization Model

**Document Version:** 1.0
**Date:** 2026-06-27
**Status:** EAOS RBAC Specification — binding for EAOS-1/2/3
**Audience:** Backend, Frontend, Security, Product
**Supersedes:** — (first formal RBAC spec; previous authorization was encoded directly in 64 `@Roles` decorators without a written model)
**Related:** `EAOS-implementation-plan.md` v2.6, `EAOS-NUWS-principles.md` v1.2, `EAOS-api-contract.md` v1.0, `EAOS-pricing-plans.md` v1.2

---

## 0. Purpose

This document defines the **authorization model** for NeureCore: who can do what, under which conditions, with which exceptions, and where the enforcement lives. It is written *after* a thorough audit of the existing code (2026-06-27) and is binding for all new code. It explicitly **closes dead code** (the unused `PermissionsGuard` system), **removes duplication** (two `RolesGuard` files, two `UserRole` enums), and **introduces the missing layers** (resource-level ACL, action-level policy, UI permission gating).

The authorization model has **four layers** that compose:

1. **Role** — coarse tenant/platform identity (the `@Roles` layer, already exists).
2. **Resource ownership** — "is this user the owner/responsibleTeam/AI-assistant of this entity?" (new in EAOS-1).
3. **Action policy** — "is this AI Action allowed on this entity type for this user's tier?" (new in EAOS-3).
4. **Row-level security (Prisma)** — every query includes `where: { tenantId }` (already exists, manual).

All four layers must pass for a request to succeed. Failure at any layer returns the standardized `403 Forbidden` error envelope (`EAOS-api-contract.md` §3.4).

---

## 0a. Document Relationships

```
EAOS-pricing-plans.md   ──►  Tier caps (maxUsers, maxAgents, …) used by Layer 1 + Layer 3
EAOS-NUWS-principles.md ──►  UI permission gating (Layer 1 visibility) used by frontend
EAOS-api-contract.md    ──►  @Roles, @TierLimit, @Public decorators + error envelopes
EAOS-frontend-data-layer.md ──►  useCan(), <Can> component, useRole() hook
EAOS-implementation-plan.md ──►  SOLID refactor targets
EAOS-rbac-model.md      ──►  (this document — the canonical RBAC spec)
```

---

## 1. Existing State (Audit 2026-06-27)

Findings from the codebase audit that this spec must adopt, override, or fix.

### 1.1 What is already correct and MUST be preserved

| Element | Current location | Status |
|---|---|---|
| `UserRole` Prisma enum (8 values) | `prisma/schema.prisma:15-24` | Adopt as the **single source of truth**. |
| `@Roles(...)` decorator | `common/decorators/roles.decorator.ts:5` | Adopt. |
| Global `RolesGuard` (the one in `auth/guards/`) | `modules/auth/guards/roles.guard.ts:30-31` | Adopt. Delete the duplicate in `security/`. |
| `@Public()` to opt out of JWT | `common/decorators/roles.decorator.ts:13` | Adopt. |
| `@TierLimit(...)` + `TierLimitsGuard` | `common/decorators/tier-limit.decorator.ts`, `common/guards/tier-limits.guard.ts` | Adopt. Currently used only 2x — must expand. |
| Strict role equality (no hierarchy) | `auth/guards/roles.guard.ts:30-31` | Adopt. |
| JWT carries `role` + `tenantId | null` + `jti` | `modules/auth/interfaces/token.interface.ts:4-12` | Adopt. |
| `user.tenantId` always read at request time (not just from JWT) | `modules/auth/strategies/jwt.strategy.ts:27-55` | Adopt. |
| Explicit `tenantId === user.tenantId` check for OWNER (only one place) | `modules/tenants/tenants.controller.ts:55-63` | Adopt pattern. Promote to middleware. |
| Tier field on Tenant (FK to `Tier`) | `prisma/schema.prisma:277-278` | Adopt. |
| `AuditLog` model (compliance audit) | `prisma/schema.prisma:432-454` | Adopt. **But:** currently the global `AuditInterceptor` only logs to console; the DB is mostly empty. **Fix in §8.** |

### 1.2 What is broken and MUST be fixed by this spec

| Problem | Spec decision (binding) |
|---|---|
| **Two `RolesGuard` files** (`auth/guards/roles.guard.ts` and `security/guards/roles.guard.ts`); `tiers.controller.ts` uses the divergent one | **Delete `security/guards/roles.guard.ts`.** It reads from a divergent `UserRole` enum and is never registered globally. The single `auth/guards/roles.guard.ts` is the only `RolesGuard`. |
| **Two `UserRole` enums** (Prisma has 8 values; `shared/types/security.types.ts:80-87` has 6 different values, including `MANAGER` and `GUEST` which the DB never produces) | **Delete `security.types.ts:UserRole`.** Delete `ROLE_PERMISSIONS` from `security.types.ts`. Delete `PermissionsGuard` and `RequirePermissions` decorator from `security/guards/permissions.guard.ts`. See §3 for the new permission model. |
| **`PermissionsGuard` + `RequirePermissions` + `Permission` enum + `ROLE_PERMISSIONS` declared but never invoked** (1115 lines of dead code) | **Replaced by this spec's permission system.** The 28 `Permission` enum values are partially reused as **action permissions** (§3); the role→permission mapping is rebuilt with a single source of truth. |
| **Audit interceptor is global but doesn't write to `AuditLog` DB** (`common/interceptors/audit.interceptor.ts` only `console.log`s) | **Fix in §8:** the interceptor must call `AuditService.log()` for every mutating request, and only `console.log` for read requests. |
| **`Agent.permissions` and `AgentTemplate.permissions` are JSON arrays consumed only by `IStructuredToolRegistry.getByPermissions()` as an LLM hint, never enforced** | **Promote to a first-class field.** Used for Layer-3 action policy (§5). |
| **`tools.controller.ts` is largely unauthenticated** (`POST /tools/execute` and `POST /tools/:id/execute` have no `@Roles` and no `JwtAuthGuard` on the controller) | **Fix in §4.5:** every `/tools/*` endpoint requires `@Roles(ADMIN, OWNER)` minimum; tool execution is also gated by tool ownership. |
| **Tenant resolution (`resolveTenantId`) duplicated 15+ times** | **Extracted to `common/utils/resolve-tenant-context.ts`.** See `EAOS-api-contract.md` §6.2. |
| **Tier limits enforced via guard for 2 of 7 limits** (`maxUsers` and `maxDepartments` only) | **Expand `@TierLimit` usage.** New checklist in §4.4. |
| **Frontend has only `useTenantAuth` (coarse: tenant-or-not) and no permission helpers** (`<Can>`, `useCan`, `hasPermission`) | **Add in `EAOS-frontend-data-layer.md` §10.** Wire to this spec's permission system. |
| **WorkspaceShell shows same tabs and "+ New" buttons to all roles** | **Add per-tab and per-button permission gating.** Wire to this spec. |
| **`OnboardingInvitation.role` accepts any `UserRole` value, including `SUPER_ADMIN`** (the form could invite someone as `SUPER_ADMIN`, who then has `tenantId: null` and platform-wide access) | **Restrict to tenant roles in the invitation flow** (§3.5). |

### 1.3 What is MISSING and must be added

| Gap | Spec section |
|---|---|
| Resource-level authorization (per-entity ACL beyond tenant scope) | §5 — `EntityOwnerGuard` |
| Action-level authorization (AI Action policy) | §6 — `ActionAuthorizationGuard` |
| Cross-tenant denial at the controller layer (single check at `tenants.controller.ts:findOne`) | §4.6 — `TenantContextMiddleware` + per-tenant scope check |
| Per-user rate limiting on AI actions | §7.3 — per-user quota |
| Tier restriction on tools/agents (no `tierRequired` model) | §6.2 — `AIActionDefinition.tierRequired` (per `EAOS-implementation-plan.md` §4.6) |
| Approval-policy enforcement (`ApprovalRequest.requiredRole` is set but never consulted) | §9 — Approval system binding |
| UI permission gating components | `EAOS-frontend-data-layer.md` §10 — `<Can>`, `useCan`, `useRole` |
| Per-tenant custom roles | **OUT OF SCOPE for v1** (see §3.4 — open decisions) |
| Department role (e.g., "head of department") | **OUT OF SCOPE for v1** (see §3.4) |
| "Share with another user" / per-resource ACL | **OUT OF SCOPE for v1** (see §3.4) |
| Agent impersonation / "act on behalf of" | **OUT OF SCOPE for v1** (see §3.4) |

---

## 2. The `UserRole` Enum (Locked)

The single source of truth is the Prisma enum. Eight values, no others.

| Value | Scope | Tenant? | Purpose |
|---|---|---|---|
| `SUPER_ADMIN` | Platform | `tenantId: null` | Highest. Can create/suspend tenants, change tiers, see all platform data. |
| `PLATFORM_ADMIN` | Platform | `tenantId: null` | Tenant lifecycle (create, suspend, change tier). Read all platform data. |
| `SECURITY_OFFICER` | Platform | `tenantId: null` | Read audit logs, security events. No write. |
| `SUPPORT` | Platform | `tenantId: null` | Read-only across tenants for support purposes. |
| `OWNER` | Tenant | `tenantId: <tenant>` | One per tenant (the only role that can change tier-billing details). Full tenant admin. |
| `ADMIN` | Tenant | `tenantId: <tenant>` | Full tenant admin except billing. |
| `USER` | Tenant | `tenantId: <tenant>` | Standard user. Read + assigned-write. |
| `AUDITOR` | Tenant | `tenantId: <tenant>` | Read-only across tenant. Audit/compliance role. |

**Rules:**

1. **One user has exactly one `UserRole`.** Multi-role per user is not supported in v1.
2. **`tenantId` is non-null for tenant roles** (`OWNER`, `ADMIN`, `USER`, `AUDITOR`). It is **null** for platform roles.
3. **There is no hierarchy.** A `USER` is not implicitly allowed in `@Roles(UserRole.ADMIN)`. The `RolesGuard` does strict equality.
4. **The OWNER constraint** — at most one `OWNER` per tenant. Enforced in `users.service.ts:update` (existing). New in this spec: enforced also at `POST /tenants` (the user who creates the tenant becomes OWNER; no second OWNER can be created via `POST /users` with `role: OWNER`).
5. **The duplicate `UserRole` in `shared/types/security.types.ts` is deleted.** The Prisma enum is the only `UserRole`. Frontend mirrors the Prisma enum directly via `import { UserRole } from '@prisma/client'`-equivalent (hand-mirrored in `frontend-tenant/src/types/auth.types.ts:5-13` — already correct, no change needed).

---

## 3. Permissions

### 3.1 Why we are NOT using a `Permission` enum + role-permission map

The existing `shared/types/security.types.ts` declares 28 granular `Permission` values and a `ROLE_PERMISSIONS: Record<UserRole, Permission[]>` map. This is the textbook RBAC design — and it is **completely unused**. The actual authorization in the codebase is done by ~64 `@Roles(...)` decorators that hardcode the role-to-endpoint mapping. Why? Two reasons:

1. **Permissions become decoupled from roles.** A `USER` can have `PERMISSION_FINANCE_READ` only if we associate that permission to the role. But most apps need **conditional** permissions (e.g., a `USER` can read finance if they're assigned to a project that has finance). That's row-level security, not RBAC.
2. **Maintenance burden.** Every new endpoint requires a permission decision + role mapping + matrix update. The `@Roles` approach makes the decision **at the endpoint** (one decorator, one source of truth).

So this spec uses a **two-layer model**:

- **Layer 1 (Role)**: coarse `@Roles` decorator on controllers. Source of truth: Prisma `UserRole`.
- **Layer 2 (Action)**: fine-grained per-AI-Action policy enforced at invocation time (EAOS-3). Source of truth: `AIActionDefinition` (per `EAOS-implementation-plan.md` §4.6).

The `Permission` enum and `ROLE_PERMISSIONS` map are **deleted** from `security.types.ts`. The 28 permission values are partially **reused as the set of action types** in the `AIActionDefinition` model (e.g. `AI_SUMMARY`, `AI_RISK_DETECT`, `AI_FORECAST`, `AI_DELEGATE`, etc.). See `EAOS-implementation-plan.md` §4.6 for the AI Action model.

### 3.2 What replaces the permission system

For v1, the **canonical authorization surfaces** are:

1. **Endpoint-level** — `@Roles(UserRole.X, UserRole.Y)` on the controller method. This is the primary defense. Already used.
2. **Resource-level** — `EntityOwnerGuard` checks `resource.tenantId === req.user.tenantId` and optionally `resource.ownerId === req.user.id`. New in §5.
3. **Action-level** — `ActionAuthorizationGuard` checks the AI Action's `tierRequired`, the user's tier, the entity's entity type vs the action's `supportedEntities`, and the user's per-tenant AI credit budget. New in §6.
4. **Tier-limit** — `@TierLimit('maxUsers' | ...)` checks the tenant's tier cap vs current count. New in §4.4.
5. **Field-level** — DTO field visibility (e.g., `passwordHash` never in response). Enforced via `XxxResponseDto` and `class-transformer` `@Exclude()`. New in `EAOS-api-contract.md` §5.

### 3.3 The minimal permission vocabulary (frontend)

For UI gating, the frontend needs a small fixed vocabulary (per `EAOS-frontend-data-layer.md` §10):

```typescript
// frontend-tenant/src/auth/permissions.ts (new)
export type Permission =
  | 'entity.read' | 'entity.write' | 'entity.delete'
  | 'entity.lifecycle.transition' | 'entity.lifecycle.archive'
  | 'agent.spawn' | 'agent.pause' | 'agent.archive'
  | 'task.create' | 'task.assign' | 'task.delete'
  | 'workflow.create' | 'workflow.execute'
  | 'routine.create' | 'routine.execute'
  | 'finance.read' | 'finance.write' | 'finance.invoice'
  | 'audit.read.tenant' | 'audit.read.platform'
  | 'tenant.settings' | 'tenant.billing' | 'tenant.members'
  | 'ai_action.invoke' | 'ai_action.configure';
```

**Mapping** (`auth/permissions.ts`, derived from `EAOS-rbac-model.md` §4):

```typescript
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  SUPER_ADMIN:       ['*'],   // wildcard — has every permission
  PLATFORM_ADMIN:    ['tenant.settings', 'audit.read.platform', 'entity.read', /* + most non-billing */],
  SECURITY_OFFICER:  ['audit.read.platform', 'audit.read.tenant', 'entity.read'],
  SUPPORT:           ['entity.read'],
  OWNER:             ['*'],   // all tenant permissions
  ADMIN:             ['entity.*', 'agent.*', 'task.*', 'workflow.*', 'routine.*',
                      'finance.*', 'audit.read.tenant', 'tenant.settings',
                      'tenant.members', 'ai_action.*'],
  USER:              ['entity.read', 'entity.write', 'task.create', 'task.assign',
                      'finance.read', 'ai_action.invoke'],
  AUDITOR:           ['entity.read', 'audit.read.tenant', 'finance.read'],
};
```

**Wildcard `*`** is a frontend-only convention for "this role has all permissions." The backend never sees it.

### 3.4 Out-of-scope (deferred to v2+)

| Feature | Why deferred | When |
|---|---|---|
| **Per-tenant custom roles** | Requires `RoleDefinition` table, role-template UI, and a permission-editor UI. Significant scope. | v2 (after 100 paying customers) |
| **Department-scoped roles** (e.g., "head of marketing") | Requires a per-Department permission assignment model. | v2 |
| **Per-resource sharing / ACL** (share a doc with a specific user) | Requires a generic `ResourceGrant` table and a UI to manage grants. Conflicts with row-level "user can read anything in their tenant" default. | v2 (Enterprise tier requirement) |
| **Agent impersonation** ("act as this AI Employee on behalf of user X") | Requires a session-impersonation flow + audit trail. | v2 |
| **Field-level redaction** (e.g., "USER can see budget but not line items") | Requires per-user field-level permission model. | v2 |

---

## 4. Endpoint Authorization Matrix

This is the **canonical matrix** for all EAOS surface endpoints. `EAOS-api-contract.md` §8 lists every endpoint; this section specifies the role(s) required for each.

### 4.1 Auth, users, tenants, tiers

| Endpoint | Method | Roles | Tier Limit | Notes |
|---|---|---|---|---|
| `/auth/login` | POST | `@Public()` | — | Throttled 10/60s/IP |
| `/auth/register` | POST | `@Public()` | — | Self-signup tier-gated |
| `/auth/refresh` | POST | `@Public()` | — | Throttled 60/60s/IP |
| `/auth/logout` | POST | any auth | — | |
| `/auth/me` | GET | any auth | — | |
| `/users` | GET | `SUPER_ADMIN, PLATFORM_ADMIN, SECURITY_OFFICER, SUPPORT` | — | |
| `/users` | POST | `SUPER_ADMIN, PLATFORM_ADMIN, OWNER` | `@TierLimit('maxUsers')` | |
| `/users/{id}` | GET | self OR (`SUPER_ADMIN, PLATFORM_ADMIN, SECURITY_OFFICER, SUPPORT, OWNER of same tenant, ADMIN of same tenant`) | — | |
| `/users/{id}` | PATCH | self (limited fields) OR (`SUPER_ADMIN, PLATFORM_ADMIN, OWNER of same tenant, ADMIN of same tenant`) | — | |
| `/users/{id}/deactivate` | POST | `SUPER_ADMIN, PLATFORM_ADMIN, OWNER of same tenant` | — | |
| `/tenants` | GET | `SUPER_ADMIN, PLATFORM_ADMIN, SECURITY_OFFICER, SUPPORT` | — | |
| `/tenants` | POST | `SUPER_ADMIN` | — | Creates tenant + OWNER user |
| `/tenants/me/current` | GET | any auth | — | Returns caller's tenant |
| `/tenants/{id}` | GET | `SUPER_ADMIN, PLATFORM_ADMIN, SECURITY_OFFICER, SUPPORT` OR (`OWNER/ADMIN/USER/AUDITOR` of that tenant) | — | |
| `/tenants/{id}/suspend` | POST | `SUPER_ADMIN` | — | |
| `/tenants/{id}/change-tier` | POST | `SUPER_ADMIN, PLATFORM_ADMIN` | — | |
| `/tiers` | GET | `SUPER_ADMIN` | — | |
| `/tiers` | POST | `SUPER_ADMIN` | — | |
| `/tiers/{id}` | PATCH | `SUPER_ADMIN` | — | |
| `/tiers/agent-pool` | GET/POST/PATCH | `SUPER_ADMIN` | — | |

### 4.2 Entities (EAOS workspace, NEW in EAOS-1)

For every `GET /api/v1/entities/{type}/{id}/...` endpoint:

| Endpoint | Roles | Resource-Level |
|---|---|---|
| `GET /entities/{type}/{id}` (workspace data) | any auth in same tenant OR platform role | `EntityOwnerGuard` enforces tenant match |
| `PATCH /entities/{type}/{id}` | `OWNER, ADMIN` of tenant OR `SUPER_ADMIN, PLATFORM_ADMIN` | `EntityOwnerGuard` |
| `POST /entities/{type}/{id}/labels` | `OWNER, ADMIN, USER` (labeling is open) | `EntityOwnerGuard` |
| `DELETE /entities/{type}/{id}/labels/{labelId}` | same as creator OR `OWNER, ADMIN` | `EntityOwnerGuard` |
| `POST /entities/{type}/{id}/watch` | any auth in same tenant | `EntityOwnerGuard` |
| `POST /entities/{type}/{id}/favorite` | any auth | `EntityOwnerGuard` |
| `POST /entities/{type}/{id}/lifecycle/transition` | `OWNER, ADMIN, USER` (depending on transition — see below) | `EntityOwnerGuard` + transition-specific permission |

**Per-transition permissions** (state machine):

| Transition | Allowed roles |
|---|---|
| `DRAFT → PENDING_APPROVAL` (Submit) | owner (`resource.ownerId === user.id`), `OWNER`, `ADMIN` |
| `PENDING_APPROVAL → ACTIVE` (Approve) | `OWNER`, `ADMIN`, or assigned approver |
| `ACTIVE → PAUSED` | `OWNER`, `ADMIN` |
| `ACTIVE → SUSPENDED` | `OWNER`, `ADMIN` OR system (policy violation) |
| `ANY → ARCHIVED` | `OWNER`, `ADMIN` |
| `ARCHIVED → DRAFT` (Restore) | `OWNER`, `ADMIN` |
| `ANY → DELETED` (permanent) | `OWNER` (destructive, requires 2-step confirmation per NUWS §3.3) |

These are stored on the `StateTransition.requiresPermission` field (per `EAOS-implementation-plan.md` §1.3) and enforced by `EntityLifecycleGuard`.

### 4.3 Departments

| Endpoint | Roles | Tier Limit |
|---|---|---|
| `GET /departments` | any auth in same tenant | — |
| `POST /departments` | `OWNER, ADMIN` of tenant OR `SUPER_ADMIN` | `@TierLimit('maxDepartments')` |
| `GET /departments/{id}` | any auth in same tenant | — |
| `PATCH /departments/{id}` | `OWNER, ADMIN` of tenant OR `SUPER_ADMIN` | — |
| `DELETE /departments/{id}` | `OWNER` OR `SUPER_ADMIN` | — |
| `POST /departments/{id}/members` | `OWNER, ADMIN` | — |
| `DELETE /departments/{id}/members/{userId}` | `OWNER, ADMIN` | — |

### 4.4 Agents (AI Employees)

| Endpoint | Roles | Tier Limit |
|---|---|---|
| `GET /agents` | any auth in same tenant | — |
| `POST /agents` | `OWNER, ADMIN` of tenant OR `SUPER_ADMIN` | `@TierLimit('maxAgents')` |
| `GET /agents/{id}` | any auth in same tenant | — |
| `PATCH /agents/{id}` | `OWNER, ADMIN` of tenant OR `SUPER_ADMIN` | — |
| `POST /agents/{id}/pause` | `OWNER, ADMIN` | — |
| `POST /agents/{id}/resume` | `OWNER, ADMIN` | — |
| `POST /agents/{id}/archive` | `OWNER, ADMIN` | — |
| `POST /agents/{id}/deprecate` | `OWNER, ADMIN` | — |
| `POST /agents/{id}/dispatch` | any auth in same tenant | Throttled 30/60s/user |
| `POST /agents/{id}/restore` | `OWNER, ADMIN` | — |
| `GET /agents/streaming/sessions/{id}/events` (SSE) | session owner OR platform role (fix existing gap) | `@SkipThrottle()` |

**Migration note:** currently `agents.controller.ts` has `@Roles(UserRole.SUPER_ADMIN)` on create/update/delete (`agents.controller.ts:111, 128, 146, 230`) and `@Roles(SUPER_ADMIN, OWNER, ADMIN)` on archive/deprecate/restore (`:248, 262, 276`). The spec widens create/update/delete to include `OWNER, ADMIN` (per the table above) — **breaking change**, see §11.

### 4.5 Tools, integrations, AI Actions

| Endpoint | Roles | Notes |
|---|---|---|
| `GET /tools` | any auth in same tenant | Lists tenant tools + built-ins |
| `POST /tools/register` | `OWNER, ADMIN` | (fixes existing unauthenticated endpoint) |
| `GET /tools/{id}` | any auth in same tenant | |
| `POST /tools/execute` | `OWNER, ADMIN, USER` | **Fix existing gap** — currently unauthenticated |
| `POST /tools/{id}/execute` | `OWNER, ADMIN, USER` AND tool ownership check | **Fix existing gap** |
| `DELETE /tools/{id}` | `OWNER, ADMIN` of owning tenant OR `SUPER_ADMIN` | |
| `POST /ai-actions/execute` | `OWNER, ADMIN, USER` | + `ActionAuthorizationGuard` (§6) |
| `GET /ai-actions/{invocationId}` | invoker OR `OWNER, ADMIN` | |
| `GET /integrations` | any auth in same tenant | |
| `POST /integrations/{providerId}/connect` | `OWNER, ADMIN` | |
| `DELETE /integrations/{id}` | `OWNER, ADMIN` | |

### 4.6 Tasks, projects, goals, workflows, routines

| Endpoint | Roles |
|---|---|
| `GET /tasks` | any auth in same tenant |
| `POST /tasks` | any auth in same tenant |
| `PATCH /tasks/{id}` | task creator OR assignee OR `OWNER, ADMIN` |
| `DELETE /tasks/{id}` | task creator OR `OWNER, ADMIN` |
| `POST /tasks/{id}/assign` | `OWNER, ADMIN` OR task creator |
| `POST /tasks/{id}/delegate` | task assignee OR `OWNER, ADMIN` |
| `GET /projects` | any auth in same tenant |
| `POST /projects` | `OWNER, ADMIN, USER` |
| `GET /goals` | any auth in same tenant |
| `POST /goals` | `OWNER, ADMIN, USER` |
| `GET /workflows` | any auth in same tenant |
| `POST /workflows` | `OWNER, ADMIN` |
| `POST /workflows/{id}/execute` | `OWNER, ADMIN, USER` (depending on workflow visibility) |
| `GET /routines` | any auth in same tenant |
| `POST /routines` | `OWNER, ADMIN` |
| `POST /routines/{id}/execute` | `OWNER, ADMIN, USER` |

**Migration note:** the existing department workspace (`frontend-tenant/src/app/departments/[id]/workspace/page.tsx:392-414`) shows "+ New" buttons for tasks/workflows/routines/projects/goals to **all** users. Backend currently rejects (with `ForbiddenException` for non-`OWNER/ADMIN` users on workflows/routines). Frontend must hide these buttons per role (see `EAOS-frontend-data-layer.md` §10).

### 4.7 Finance, costs, billing

| Endpoint | Roles |
|---|---|
| `GET /finance/invoices` | `OWNER, ADMIN, USER` |
| `POST /finance/invoices` | `OWNER, ADMIN` |
| `POST /finance/invoices/{id}/mark-paid` | `OWNER, ADMIN` |
| `POST /finance/expenses` | any auth in same tenant (USER can log expenses) |
| `GET /finance/billing` | `OWNER` (only OWNER sees tenant billing) |
| `PATCH /finance/billing` | `OWNER` |
| `GET /costs` | `OWNER, ADMIN, USER` (own usage) |
| `GET /costs/tenant` | `OWNER, ADMIN` |

### 4.8 Audit, observability, security

| Endpoint | Roles |
|---|---|
| `GET /audit-logs/platform` | `SUPER_ADMIN, PLATFORM_ADMIN, SECURITY_OFFICER, AUDITOR` |
| `GET /audit-logs/tenant` | any auth in same tenant (scoped to their tenant) |
| `GET /audit-logs/{id}` | same as `GET /audit-logs/tenant` |
| `GET /observability/summary` | `SUPER_ADMIN, PLATFORM_ADMIN` |
| `GET /observability/metrics` | `SUPER_ADMIN, PLATFORM_ADMIN` |
| `GET /security/events` | `SUPER_ADMIN, PLATFORM_ADMIN, SECURITY_OFFICER` |
| `POST /security/events/{id}/acknowledge` | `SUPER_ADMIN, PLATFORM_ADMIN, SECURITY_OFFICER` |

### 4.9 Memory, knowledge

| Endpoint | Roles |
|---|---|
| `GET /memory/{id}` | owning agent's tenant |
| `POST /memory/purge` | `OWNER, ADMIN` |
| `GET /knowledge` | any auth in same tenant |
| `POST /knowledge` | `OWNER, ADMIN, USER` |
| `PATCH /knowledge/{id}` | creator OR `OWNER, ADMIN` |
| `DELETE /knowledge/{id}` | creator OR `OWNER, ADMIN` |
| `GET /knowledge/search` | any auth in same tenant |
| `POST /knowledge/rag-ask` | any auth in same tenant (consumes AI credits) |

### 4.10 Mission Feed, Command Palette, AI Roster, Compare

| Endpoint | Roles |
|---|---|
| `GET /mission-feed` | any auth in same tenant |
| `POST /mission-feed/{id}/dismiss` | any auth (dismissed per user) |
| `GET /ai-roster` | any auth in same tenant |
| `POST /ai-roster/{id}/pause` | `OWNER, ADMIN` |
| `GET /compare` | any auth in same tenant (all entities must be in same tenant) |
| `POST /compare` | any auth (creator) |

Command Palette is **client-side only** — no new server endpoints.

### 4.11 MarketPlace (solution packs)

| Endpoint | Roles |
|---|---|
| `GET /marketplace/packs` | any auth (browses public catalog) |
| `GET /marketplace/packs/{slug}` | any auth |
| `POST /marketplace/packs/{slug}/install` | `OWNER, ADMIN` |
| `DELETE /marketplace/packs/{slug}` | `OWNER, ADMIN` |
| `GET /marketplace/agent-templates` | any auth (existing) |
| `GET /marketplace/connectors` | any auth (existing) |

### 4.12 Realtime

| Channel | Allowed |
|---|---|
| WebSocket (auto-join `user:{sub}` and `tenant:{tenantId}`) | any authenticated user |
| SSE `/agents/streaming/sessions/{id}/events` | session owner OR platform role |

---

## 5. Resource-Level Authorization (EntityOwnerGuard) — NEW

The `@Roles` decorator decides if a user can hit an endpoint **at all**. But once they're on the endpoint, the question is: do they have access to **this specific resource**? Currently this is enforced manually (e.g. `tenants.controller.ts:55-63` for `findOne`, and ad-hoc in service methods). This spec introduces a single guard.

### 5.1 The guard

```typescript
// backend/src/common/guards/entity-owner.guard.ts (new)

@Injectable()
export class EntityOwnerGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tenantContext: TenantContextService,
  ) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const user = req.user as ValidatedUser;

    // 1. Platform roles always pass.
    if (isPlatformRole(user.role)) return true;

    // 2. Resolve tenant context. This throws Forbidden if missing.
    const ctx_ = this.tenantContext.get();

    // 3. The resource (already loaded into req.resource by the controller) must
    //    belong to the caller's tenant. Cross-tenant access denied.
    const resource = req.resource;
    if (!resource) {
      throw new InternalServerError('EntityOwnerGuard used without req.resource; controller must load resource first.');
    }
    if (resource.tenantId !== ctx_.tenantId) {
      throw new ForbiddenException({
        code: 'CROSS_TENANT_ACCESS',
        message: 'You cannot access resources outside your tenant.',
      });
    }
    return true;
  }
}
```

### 5.2 Usage pattern

```typescript
@Get(':id')
@Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.USER, UserRole.AUDITOR)
@UseGuards(JwtAuthGuard, RolesGuard, EntityOwnerGuard)
async findOne(
  @Param() params: IdParamDto,
  @Req() req: Request,
) {
  req.resource = await this.agentsService.findOneOrFail(params.id);
  return AgentResponseDto.fromEntity(req.resource);
}
```

The controller loads the resource into `req.resource` (and returns 404 if not found); the guard checks the tenant. The service method no longer needs the manual `tenantId` filter — the guard guarantees the resource is in the right tenant. (This is the path to removing the 100+ manual `tenantId` filters in service code.)

### 5.3 What it does NOT do

- It does **not** check `resource.ownerId === user.id`. That's a different concern (per-resource ownership vs tenant membership) and is left to service code or to a future `ResourceOwnerGuard` (P2 — see open decisions).
- It does **not** check field-level visibility. That's `XxxResponseDto`.
- It does **not** check tier limits. That's `@TierLimit`.

---

## 6. Action-Level Authorization (ActionAuthorizationGuard) — NEW

AI Actions are user-invocable operations with policy. The policy is stored in the `AIActionDefinition` (per `EAOS-implementation-plan.md` §4.6). The guard enforces the policy at invocation time.

### 6.1 The guard

```typescript
// backend/src/modules/ai-actions/guards/action-authorization.guard.ts (new)

@Injectable()
export class ActionAuthorizationGuard implements CanActivate {
  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const dto = req.body as ExecuteAIActionDto;
    const user = req.user as ValidatedUser;

    // 1. Look up the AI Action in the registry.
    const action = this.registry.getById(dto.action);
    if (!action) throw new NotFoundException({ code: 'AI_ACTION_NOT_FOUND', message: dto.action });

    // 2. Check the entity type is supported.
    if (!action.supportedEntities.includes(dto.entityType)) {
      throw new BadRequestException({
        code: 'AI_ACTION_NOT_SUPPORTED',
        message: `${dto.action} does not support ${dto.entityType}`,
      });
    }

    // 3. Check the user's tier meets the action's tier requirement.
    const tenant = await this.tenantsService.findOne(user.tenantId);
    if (!this.tierMeetsRequirement(tenant.tier, action.costModel.tierRequired)) {
      throw new ForbiddenException({
        code: 'TIER_TOO_LOW',
        message: `${dto.action} requires ${action.costModel.tierRequired} tier.`,
        upgradeUrl: '/billing/upgrade',
      });
    }

    // 4. Check the tenant has remaining AI credits for this period.
    const usage = await this.quotasService.getUsage(tenant.id, 'ai_credits', 'monthly');
    if (usage.consumed + action.costModel.tokensEstimate > usage.max) {
      throw new ForbiddenException({
        code: 'AI_CREDITS_EXHAUSTED',
        message: 'AI credits exhausted for this period.',
        upgradeUrl: '/billing/upgrade',
      });
    }

    // 5. Check the user has permission to invoke the action.
    if (!action.requiredPermissions.every(p => userHasPermission(user, p))) {
      throw new ForbiddenException({
        code: 'AI_ACTION_PERMISSION_DENIED',
        message: `You lack permission for ${dto.action}.`,
      });
    }

    return true;
  }
}
```

### 6.2 Action tier requirements

The `AIActionDefinition.costModel.tierRequired` field is one of:
- `COMMUNITY` — available to all tiers
- `STARTER` — Starter and above
- `PRO` — Business (called `BUSINESS` in `EAOS-pricing-plans.md` v1.1) and above
- `ENTERPRISE` — Enterprise only

**Default policy for v1:**

- `ai:summary`, `ai:risks`, `ai:recommend`, `ai:explain` — `COMMUNITY` (every user can use the basic AI).
- `ai:forecast`, `ai:optimize`, `ai:analyze` — `STARTER` (light compute).
- `ai:delegate`, `ai:workflow` — `PRO` (mutations, cost).
- All Solution Pack-specific actions — `PRO` minimum; pack publisher can raise to `ENTERPRISE`.

**Per-tier AI credits** (per `EAOS-pricing-plans.md` v1.1):

| Tier | Monthly AI Credits | Approx. cost per `ai:summary` |
|---|---|---|
| Community | 10,000 | ~500 tokens |
| Starter | 100,000 | ~500 tokens |
| Business | 2,000,000 | ~500 tokens |
| Enterprise | Unlimited | — |

The `tenants.tier.aiCredits` field stores the cap. Usage tracked in `QuotaUsage` (`prisma/schema.prisma:982-1001`).

### 6.3 Per-user rate limits on AI actions

In addition to the per-IP throttle (§4 of `EAOS-api-contract.md`), per-user limits:

- `USER` role: 60 AI invocations / 60s
- `ADMIN`: 120 / 60s
- `OWNER`: 240 / 60s
- Platform roles: 600 / 60s

These are enforced in `ActionAuthorizationGuard` step 6 (skipped above for brevity) using a Redis-backed counter keyed by `userId + actionId + period`.

---

## 7. Tier Limits (Expanded)

The current `@TierLimit` decorator is used in only 2 places. This spec **expands** the enforcement to all 7 cap fields defined in `common/decorators/tier-limit.decorator.ts:6-7`.

### 7.1 Where each limit MUST be enforced

| Limit | Enforced on | Decorator / guard | Status |
|---|---|---|---|
| `maxUsers` | `POST /users` | `@TierLimit('maxUsers')` | (exists, `users.controller.ts:91`) |
| `maxDepartments` | `POST /departments` | `@TierLimit('maxDepartments')` | (exists, `departments.controller.ts:65`) |
| `maxAgents` | `POST /agents` (spawn) | `@TierLimit('maxAgents')` | (new — currently enforced ad-hoc in `deployment.service.ts:86`) |
| `maxApiCalls` | All `POST` endpoints (consume API quota) | `@TierLimit('maxApiCalls')` on a meta-route OR middleware | (new — currently no enforcement) |
| `maxConversationMessages` | `POST /chat/messages` | `@TierLimit('maxConversationMessages')` | (new — currently no enforcement) |
| `maxStorageGB` | `POST /files/upload` | `@TierLimit('maxStorageGB')` | (new — currently no enforcement) |
| `maxFileSizeMB` | `POST /files/upload` (per-file check) | `@TierLimit('maxFileSizeMB')` | (new — currently no enforcement) |

### 7.2 TierLimitKey expansion

```typescript
// common/decorators/tier-limit.decorator.ts (modified)
export type TierLimitKey =
  | 'maxUsers' | 'maxAgents' | 'maxDepartments'
  | 'maxStorageGB' | 'maxApiCalls'
  | 'maxConversationMessages' | 'maxFileSizeMB'
  | 'aiCredits';   // ← NEW
```

### 7.3 TierLimitsGuard

Existing implementation at `common/guards/tier-limits.guard.ts` needs:

1. **Add `aiCredits` counter** — sum of `AIActionInvocation.tokensUsed` for the current month.
2. **Add `maxApiCalls` counter** — sum of `QuotaUsage` rows where `quotaKey='api_calls'` for today.
3. **Add `maxStorageGB` counter** — sum of file sizes for the tenant.
4. **Add `maxFileSizeMB` check** — per-file, not aggregate. Different code path.
5. **Add `maxConversationMessages` counter** — count of `MemoryEntry` rows (already partial).
6. **Throw standardized error** with the current shape `{code:'TIER_LIMIT_EXCEEDED', limit, current, max, tier, upgradeUrl}` — already in place at line 55.

---

## 8. Audit Logging (Fix)

The global `AuditInterceptor` (`common/interceptors/audit.interceptor.ts`) is registered as `APP_INTERCEPTOR` in `app.module.ts:144` but only `console.log`s. The `AuditService.log()` (which writes to the `AuditLog` DB) is called from almost nothing. This is a real compliance gap.

### 8.1 New behavior

| Event | Log to DB? | Severity | Notes |
|---|---|---|---|
| Every 2xx response to a `POST / PATCH / DELETE / PUT` request | Yes | `info` | Includes actor, action, resource, resourceId, tenantId, IP, userAgent, status, result |
| Every 4xx response | Yes | `warning` (4xx) or `error` (5xx) | Includes the error code |
| Every 5xx response | Yes | `error` | |
| Every successful login | Yes | `info` | With `actor.email`, IP, userAgent |
| Every failed login | Yes | `warning` | (brute-force signal) |
| Every token refresh | Yes (rate-limited to once per user per hour) | `info` | |
| Every state transition (Lifecycle) | Yes | `info` | `details: { from, to, reason }` |
| Every AI Action invocation | Yes | `info` | `details: { actionId, tokensUsed, cost }` |
| Every tier-limit rejection | Yes | `warning` | |
| Every permission denial | Yes | `warning` | |
| Read (`GET`) requests | **No** (do not log) | — | Volume concern |

### 8.2 Implementation

`AuditInterceptor` calls `AuditService.log(event)` on every mutating request. `AuditService` writes to the `AuditLog` table asynchronously (fire-and-forget) so it does not block the request.

```typescript
// common/interceptors/audit.interceptor.ts (modified)
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(ctx: ExecutionContext, next: CallHandler) {
    const req = ctx.switchToHttp().getRequest();
    const method = req.method;
    if (isReadMethod(method)) return next.handle();  // skip reads

    const start = Date.now();
    return next.handle().pipe(
      tap({
        next: () => this.auditService.log(makeEvent(req, 'success', Date.now() - start)),
        error: (err) => this.auditService.log(makeEvent(req, 'error', Date.now() - start, err)),
      }),
    );
  }
}
```

### 8.3 Audit retention

- Default: 365 days.
- Enterprise tier: configurable per tenant.
- Audit logs are **immutable**. There is no `DELETE` endpoint for `AuditLog`. The only deletion is the background retention job (admin-only).

---

## 9. Approval System (Reactivation)

The `ApprovalRequest` model exists (`prisma/schema.prisma:811-843`) with a `requiredRole` field, but no code consults it. This spec reactivates the approval flow.

### 9.1 When is an approval required?

| Action | Approval required? | Approver roles |
|---|---|---|
| Tenant suspend | No (only `SUPER_ADMIN` can do it) | — |
| Tier change | No (`SUPER_ADMIN, PLATFORM_ADMIN`) | — |
| Agent archive | No (`OWNER, ADMIN`) | — |
| Lifecycle: `ACTIVE → DELETED` (permanent delete) | **Yes** | `OWNER` (must be different person from requester) |
| Lifecycle: `PENDING_APPROVAL → ACTIVE` (entity activation) | **Yes** | `OWNER, ADMIN` (must be different from creator) |
| AI Action: `ai:workflow` (create/modify workflow) | **Yes** if the workflow is tenant-wide | `OWNER, ADMIN` |
| Finance: invoice over $10K | **Yes** | `OWNER` |
| Tool: delete a built-in tool override | **Yes** | `OWNER` |

### 9.2 Approval lifecycle

```
DRAFT
  ↓ (submit)
PENDING_APPROVAL
  ↓ (approve)              ↓ (reject)
APPROVED                 REJECTED
  ↓ (execute action)        ↓ (back to DRAFT or terminate)
EXECUTED
```

### 9.3 Storage

The `ApprovalRequest` model needs to be reviewed for the following fields (some may be missing):

```prisma
model ApprovalRequest {
  id              String   @id @default(uuid())
  tenantId        String
  requesterId     String   // who requested
  action          String   // "DELETE_ENTITY", "ACTIVATE_ENTITY", etc.
  resource        String   // entity type
  resourceId      String
  requiredRole    String?  // e.g., "OWNER"
  status          String   @default("PENDING") // PENDING, APPROVED, REJECTED, EXECUTED
  approverId      String?
  approvedAt      DateTime?
  rejectionReason String?
  expiresAt       DateTime // approval expires (default 7 days)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([tenantId, status])
  @@index([tenantId, requesterId])
}
```

### 9.4 Enforcement

The `ApprovalService.requireApproval(action, resource, requester)` method is called by services before performing approval-required actions. If no pending `ApprovalRequest` exists in the `APPROVED` state, the action is rejected with `403 APPROVAL_REQUIRED` and a link to the approval queue.

Frontend: the Collaboration panel shows a "Pending Approvals" section per NUWS §2.6.

---

## 10. Tenant Context Enforcement (EAOS-1)

This is the single new middleware that **replaces all 15+ duplicate `resolveTenantId` methods**. Already specified in `EAOS-api-contract.md` §6.3. The authorization angle:

- `TenantContextMiddleware` (new) runs after `JwtAuthGuard` resolves the user.
- It calls `resolveTenantContext(user, req)` and seeds `AsyncLocalStorage` via `TenantContextService.run(ctx, () => next())`.
- Services that previously took `tenantId` as an argument now read `tenantContextService.tenantId` inside the request scope.
- The middleware also enforces: if `user.role` is a tenant role (`OWNER, ADMIN, USER, AUDITOR`) and the request is to a different tenant, **deny with 403 CROSS_TENANT_ACCESS**.

This is the **central choke point** for tenant isolation. Combined with the `EntityOwnerGuard` (§5), it makes cross-tenant access structurally impossible (rather than enforced by 100+ manual `where: { tenantId }` filters that can be forgotten).

---

## 11. Migration Plan

### 11.1 Breaking changes this spec introduces

1. **Agent create/update/delete widened from `SUPER_ADMIN` only to `OWNER, ADMIN` + `SUPER_ADMIN`.** The current `agents.controller.ts:111, 128, 146, 230` rejects `OWNER/ADMIN`. Migrating to the new behavior is a **privilege escalation** for tenant admins — must be explicitly approved in the migration.
2. **Tool execution now requires auth.** The current `POST /tools/execute` is unauthenticated. Securing it is a real-world bug fix; no backwards-compat needed.
3. **Streaming controller auth added.** Currently SSE accepts any `sessionId`. After this spec, the session is checked against the user.
4. **Audit interceptor now writes to DB.** This is a behavior change, not a contract change, but it has performance implications — must add a per-tenant log throttle if needed.
5. **Tenant resolution moves from explicit param to AsyncLocalStorage.** Service signatures change (`findOne(id)` instead of `findOne(id, tenantId)`). Internal refactor, no wire change.

### 11.2 Migration order

1. **Phase 1 — Dead-code removal (no behavior change).** Delete `security/guards/roles.guard.ts`, `security/guards/permissions.guard.ts`, `security.types.ts:UserRole`, `security.types.ts:ROLE_PERMISSIONS`, `security.types.ts:Permission`. Update `tiers.controller.ts` to use the global guard.
2. **Phase 2 — Authenticate `tools/*` and `agents/streaming/*`.** Wrap existing endpoints with `JwtAuthGuard` + appropriate `@Roles`. Behavior change; communicate in changelog.
3. **Phase 3 — Widen agent permissions.** Update `agents.controller.ts:111, 128, 146, 230` to include `OWNER, ADMIN`. Communicate as privilege escalation; document in changelog.
4. **Phase 4 — Add `EntityOwnerGuard` + `TenantContextService`.** Migrate one controller at a time, starting with high-value entities (departments, agents, projects).
5. **Phase 5 — Add `ActionAuthorizationGuard`.** Land in EAOS-3 alongside AI Actions.
6. **Phase 6 — Expand `@TierLimit` usage.** One limit at a time.
7. **Phase 7 — Audit interceptor writes to DB.** Performance-test first.
8. **Phase 8 — Approval system reactivation.** Land with EAOS-3 Lifecycle work.

### 11.3 Feature flag

`USE_NEW_RBAC` env flag (read by both backend and frontend) gates Phases 2-7 so we can roll out per tenant. The flag is per-tenant, not global, so enterprise customers can opt in early.

---

## 12. Frontend Permission Gating

See `EAOS-frontend-data-layer.md` §10 for the full implementation. Summary:

- `useRole()` hook returns current user's role.
- `<Can permission="agent.spawn">` component conditionally renders children.
- `useCan(permission)` hook returns boolean.
- `ROLE_PERMISSIONS` map derived from §3.3 of this document.
- The frontend **never** uses role strings directly (always goes through permissions). This is the only way to keep the UI consistent when new roles are added.
- The WorkspaceShell tabs are filtered by permission:
  - Costs tab requires `finance.read`
  - Admin actions (Settings, Members) require `tenant.settings` and `tenant.members`
  - Lifecycle tab actions filtered by `entity.lifecycle.transition` etc.
- All "+ New" buttons are wrapped in `<Can>`.

---

## 13. Open Decisions Deferred

These are the same items from `EAOS-implementation-plan.md` §14.2 plus RBAC-specific ones:

1. **Per-tenant custom roles** — v2.
2. **Department-scoped roles** — v2.
3. **Per-resource sharing / ACL** — v2.
4. **Agent impersonation** — v2.
5. **Field-level redaction** — v2.
6. **AI Action approval for high-cost invocations** — partly handled by Tier 2 limits; full approval flow is P2.
7. **Audit log export for compliance** — exists in code, gated by tier feature flag (`allowAuditExport`). P2 to make tenant-configurable.

---

**End of document.**
