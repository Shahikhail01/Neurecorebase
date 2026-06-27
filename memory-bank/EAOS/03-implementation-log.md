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
