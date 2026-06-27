# NeureCore — EAOS Active Context

**Last updated:** 2026-06-27 20:13
**Phase:** 1 (Foundations) — **sequential, priority-ordered execution in progress** (per D-025)
**Branch:** `eaos-base` (pushed to `origin`)
**Status:** Phase 0 done. Phase 1 sub-phases 1D (Prisma EAOS-1 schema) and 1B (annotation roll-out) partially done. 1B Tasks 1.15-1.18 (runtime OpenAPI verification + list/action migration) still in progress. 1E (tenant-context migration) and 1C (frontend packages/ui) pending.

---

## Honest progress snapshot — what is actually done

**Phase 0 (Safety Lockdown) — DONE ✅ (5/5 backend, 4 commits)**
- 0.1 dead code removal (D-016), 0.2 tools auth (D-015), 0.3 SSE auth (D-014), 0.4 audit interceptor (D-013), 0.5 tenant isolation helpers (D-016) — all done on `eaos-base`.

**Phase 1A (Backend core) — DONE ✅ (8/8)**
- 1.1 swagger install + nest-cli plugin, 1.2 DTOs, 1.4 TenantContextService + AsyncLocalStorage middleware, 1.7 OpenAPI bootstrap in main.ts. Plus the canonical envelopes (1.3 PaginatedResponse, ActionResult) and the resolve-tenant-context utility (resolved in 0.5).

**Phase 1B (Annotation roll-out) — PARTIAL ⚠ (4/10)**
- ✅ 1.9 `api-common.decorator.ts` bundle helper (NEW, single source of truth for `@ApiTags` + `@ApiBearerAuth` + `@ApiSecurity X-Tenant-ID` + `@ApiSecurity Idempotency-Key`).
- ✅ 1.10 9 new XxxResponseDto for Tier-1 entities (Department, Project, Goal, Task, Workflow, Routine, ToolIntegration, User, Tenant — Agent was already done in 1.8).
- ✅ 1.11-1.14 ALL 34 controllers annotated with `@ApiCommon()` via `scripts/annotate-controllers.js` (idempotent, single source of truth).
- ⬜ 1.15 Verify `openapi.json` has ≥200 paths (DEFERRED — requires running backend in dev mode, needs DB).
- ⬜ 1.16 Commit `openapi.json` + add `check-openapi-coverage.sh` CI gate (DEFERRED — needs 1.15).
- ⬜ 1.17-1.18 Migrate ALL list endpoints to `PaginatedResponse<T>` + ALL action endpoints to `ActionResult<T>` — `agents.findAll` and `agents.pause` are done; `departments.findAll` partially migrated (in working tree, uncommitted).
- ⚠ **Note:** Tasks/workflow sub-controllers were NOT annotated — only top-level controllers in those modules were processed by the script. Will require a follow-up pass.

**Phase 1C (Frontend scaffold + design system) — DEFERRED ⏭ (0/19)**
- New pending: build `packages/ui/` (tokens, primitives, hooks, API_ENDPOINTS, placeholder pages).

**Phase 1D (EAOS-1 Prisma schema) — DONE ✅ (3/3)**
- ✅ 1.38 Added 11 new Prisma models (EntityState, StateHistory, EntityOwnership, EntityLabel, UserFavorite, UserRecentAccess, EntityWatcher, EntityHealth, EntityRelationship, WorkspaceLayout, CapabilityConfig) + 6 enums (UniversalStateValue, EntityType, HealthSeverity, HealthTrend, LabelKind, RelationshipType) + back-relations on Tenant (11), User (10), Department (1).
- ✅ 1.39 Migration `20260627_eaos_1_entity_model/migration.sql` created (62KB, 11 CREATE TABLE + 6 CREATE TYPE + all FKs/unique/indexes). Hand-extracted from the full prisma diff to ensure ADDITIVE ONLY.
- ✅ 1.40 Schema validates (`prisma validate` ✅, `prisma generate` ✅, `tsc --noEmit` ✅). Real-DB migration run is user action.

**Phase 1E (Tenant-context migration roll-out) — DEFERRED ⏭ (0/8)**
- 0% done. `TenantContextService` was shipped in 1A but still has no consumers. The 15+ duplicate per-controller `resolveTenantId` methods remain.

**Phase 2-10 — DEFERRED ⏭**
- Phase 2 (Frontend data layer hooks): 0/9 done.
- Phase 3 (Entity workspace, 10 panels + modal): not started, blocked on Phase 1D ✅ (now unblocked) and Phase 1B ✅ (in progress) and Phase 1E (pending) and Phase 1C (pending).
- Phases 4-10: not started.

---

## What's actually on disk (verified)

**Branch `eaos-base`, 12 commits on top of `main`:**
- `c00dff57` WIP: Phase 0 tasks 0.1 + 0.2
- `795702dd` Task 0.3 (SSE auth)
- `8d6fe982` Task 0.4 (audit interceptor → DB)
- `4ef6ef97` Task 0.5 (tenant isolation helpers)
- `36e9ebc5` Phase 1 task 1.2 (DTOs + envelopes)
- `4a5fdfb6` Phase 1 task 1.4 (TenantContextService + middleware)
- `80a2ed31` Phase 1 tasks 1.8 + 1.9 (agents envelopes)
- `94d6242c` Phase 1 tasks 1.18-1.27 (frontend-eaos bootstrap)
- `686bff74` Phase 1 doc updates
- `d888b528` Phase 1 v1.3 plan update (D-024)
- `3d7a2b14` Phase 1D: 11 new Prisma models (EAOS-1)
- `af81470d` Phase 1B: 34 controllers annotated + 9 new DTOs

**All pushed to `origin/eaos-base`.** Uncommitted in working tree: 1 file modified (`backend/src/modules/departments/departments.controller.ts` — partial `findAll` migration to `PaginatedResponse<DepartmentResponseDto>`, uncommitted because tsc verification was aborted by the user).

**Monorepo structure (verified on disk):**
- `backend/` — Phase 0 + 1A + 1B + 1D work, tsc clean.
- `frontend-eaos/` — Next.js 15 + React 19 + TanStack Query 5.59 + Toaster, builds clean (4 static pages).
- `frontend-admin/` — untouched.
- `packages/ui/` — **NOT YET BUILT** (1C pending).
- `frontend-tenant/` — **deleted** per D-023; backup at `/home/najeeb/Linux-Dev/archives/frontend-tenant-main-ccb946c6-2026-06-27.tar.gz` (2.4M, 415 files).
- `pnpm-workspace.yaml` — includes `backend`, `frontend-admin`, `frontend-eaos`.

---

## Current focus

**Phase 1 sequential, priority-ordered execution (per D-025, this morning).** Per [`EAOS-implementation-roadmap.md` v1.3 §5](./EAOS-implementation-roadmap.md), Phase 1 has 5 sub-phases (A, B, C, D, E) with 48 tasks. The order is:

1. ✅ **1D** (Prisma EAOS-1 schema) — DONE (commit `3d7a2b14`)
2. 🟡 **1B** (Annotation roll-out) — IN PROGRESS
3. ⏭ **1E** (Tenant-context migration)
4. ⏭ **1C** (Frontend packages/ui)

**Active work:** 1B Tasks 1.17-1.18 — migrate the remaining list endpoints to `PaginatedResponse<T>` and action endpoints to `ActionResult<T>`. `agents.findAll` and `agents.pause` are done. `departments.findAll` is partially migrated (uncommitted; tsc was being verified when the user paused to record progress).

### Phase 1 task list (from roadmap v1.3 §5)

**1A Backend core (8/8 done):** 1.1 swagger ✅, 1.2 DTOs ✅, 1.4 TenantContextService + middleware ✅, 1.7 OpenAPI bootstrap ✅, plus the canonical envelopes (1.3) and the resolve-tenant-context utility (1.3, resolved in 0.5).

**1B Annotation roll-out (4/10 done):**
- ✅ 1.9 `api-common.decorator.ts` bundle helper
- ✅ 1.10 9 new XxxResponseDto for Tier-1 entities
- ✅ 1.11-1.14 ALL 34 controllers annotated with `@ApiCommon()` via `scripts/annotate-controllers.js`
- ⬜ 1.15 Verify `openapi.json` has ≥200 paths (DEFERRED — needs running DB)
- ⬜ 1.16 Commit `openapi.json` + add `check-openapi-coverage.sh` CI gate (DEFERRED)
- ⬜ 1.17-1.18 Migrate ALL list endpoints to `PaginatedResponse<T>` + ALL action endpoints to `ActionResult<T>` (in progress; agents done, departments partial)
- ⚠ tasks/workflow sub-controllers not annotated — follow-up needed

**1C Frontend scaffold + design system (0/19):** all pending

**1D EAOS-1 Prisma schema (3/3 done):** ✅ all done in commit `3d7a2b14`

**1E Tenant-context migration (0/8):** all pending (DIP violation still in place — `TenantContextService` was shipped in 1A but has no consumers)

### Phase 1 success criteria (overall)

- [ ] `backend/openapi.json` has ≥200 paths and ≥100 schemas
- [ ] `pnpm --filter @neurecore/ui build` produces ESM + CJS + types
- [ ] `pnpm --filter frontend-eaos dev` starts on port 3003
- [ ] All list endpoints return `PaginatedResponse<T>`
- [ ] All action endpoints return `ActionResult<T>`
- [ ] No `resolveTenantId` duplicates remain
- [ ] Prisma migration runs cleanly on a fresh dev DB (user action)

---

## Recent changes (last 7 days)

| Date | Change | Doc reference |
|---|---|---|
| 2026-06-27 20:13 | **Phase 1 1B in progress:** 34 controllers annotated with `@ApiCommon()`; 9 new XxxResponseDto for Tier-1 entities. Migration to `PaginatedResponse<T>` in progress (`agents` done; `departments` partial, uncommitted; 18+ more to go). Commit `af81470d`. | 03-implementation-log |
| 2026-06-27 20:00 | **Phase 1 1D DONE:** 11 new EAOS-1 Prisma models + 6 enums + back-relations + 62KB additive migration. Commit `3d7a2b14`. | 03-implementation-log, migration: `prisma/migrations/20260627_eaos_1_entity_model/` |
| 2026-06-27 19:00 | **D-025 (this morning):** Phase 1 execution order = sequential, priority-ordered (1D → 1B → 1E → 1C). | 02-decisions-log D-025 |
| 2026-06-27 18:00 | **D-024:** Phase 1 v1.2 → v1.3 expansion. 5 sub-phases (A, B, C, D, E) with all critical tasks. Every task has explicit SOLID adherence. | 02-decisions-log D-024, roadmap v1.3 |
| 2026-06-27 17:50 | Phase 1 Tier A+B: 5 commits shipped (swagger, DTOs, TenantContext, agents migration, frontend-eaos bootstrap) | 03-implementation-log |
| 2026-06-27 16:55 | Phase 0 complete: tasks 0.3, 0.4, 0.5 done | 03-implementation-log |
| 2026-06-27 16:11 | **D-023:** Deleted `frontend-tenant/` (no prod users, no release). Tasks 0.6/0.7 eliminated. Phase 9 dual-support dropped. Phase 10 decommission tasks already done. | 02-decisions-log D-023 |
| 2026-06-27 15:57 | **D-022:** Build EAOS as new `frontend-eaos/`; freeze `frontend-tenant/`; extract `packages/ui/`; cookie auth from day 1 | 02-decisions-log D-022 |
| 2026-06-27 15:45 | Branch `eaos-base` created and pushed to `origin`; commit `c00dff57` (Phase 0 tasks 0.1 + 0.2 + docs) | 03-implementation-log |
| 2026-06-27 | Created `EAOS-implementation-roadmap.md` v1.0 (11-phase plan) | new |
| 2026-06-27 | Created `EAOS-frontend-data-layer.md` v1.0 (TanStack Query spec) | new |
| 2026-06-27 | Created `EAOS-rbac-model.md` v1.0 (4-layer auth spec) | new |
| 2026-06-27 | Created `EAOS-api-contract.md` v1.0 (REST/WS/SSE wire format) | new |
| 2026-06-27 | `EAOS-pricing-plans.md` v1.0 → v1.2 (added §0a AI Roster requirement) | §0a |
| 2026-06-27 | `EAOS-NUWS-principles.md` v1.0 → v1.2 (added Lifecycle, Mission Feed, Command Palette, Mini-Graph, Compare View, design tokens) | major |
| 2026-06-27 | `EAOS-implementation-plan.md` v2.4 → v2.6 (reconciled capability count, added Ask AI terminology, resolved all 8 §14.2 open questions) | major |
| 2026-06-27 | Resolved 8 open UI decisions from `EAOS-implementation-plan.md` §14.2 | §14.2 |
| 2026-06-27 | Promoted Lifecycle from buried-in-Admin to first-class CORE panel #10 | impl-plan §1.2, NUWS §2.10 |
| 2026-06-27 | Demoted Administration from CORE-as-panel to CORE-as-modal (gear icon) | impl-plan §1.2, NUWS §1.2 |
| 2026-06-27 | Renamed "AI Action" → "Ask AI" in user-facing UI (registry term unchanged) | impl-plan §4.5 |
| 2026-06-27 | Added 5 new UI surfaces: Mission Feed, Command Palette, Mini-Graph, Compare View, AI Roster | NUWS §5.4–5.7, pricing §0a |

---

## Open threads (need decision or input)

| # | Thread | Status | Owner needed | Doc ref |
|---|---|---|---|---|
| 1 | **Phase 3 task 3.10 — privilege escalation.** Widening agent create/update/delete to include `OWNER, ADMIN` is a security-relevant change. | **BLOCKED** | Product + security lead sign-off required | rbac §4.4 |
| 2 | **Phase 8 — which vertical first?** Recommend Retail. | **AWAITING** | Product decision | roadmap §12 |
| 3 | **Observability backend for Phase 5.** AI Actions cannot ship without per-tenant credit caps + per-user rate limits + kill-switch flag. | **AWAITING** | Confirm backend is ready | roadmap §9 |
| 4 | **Cookie auth (sole auth path).** Per D-023, the backend ships httpOnly cookies as the only auth path for `frontend-eaos/`. Confirm cookie set names, CSRF approach. | **AWAITING** | Engineering lead | api-contract §4.1, frontend-data-layer §4.1 |
| 5 | **Tier 2/3 docs timing** (component catalog, observability, i18n, a11y, perf budgets, testing strategy). Written when their phase starts, OR in advance? | **AWAITING** | Engineering lead decision | roadmap §2 |
| 6 | **Vercel OIDC token rotation.** The token in `frontend-tenant/.env.local` (deleted) was visible in a tool output. Revoke in Vercel dashboard, generate a new one for `frontend-eaos/.env.local`. | **ACTION** | User | D-023 |
| 7 | **Phase 0 + Phase 1 PR review.** 12 commits on `eaos-base` awaiting user review and merge to `main`. | **AWAITING** | User | impl-plan §9, roadmap §4 §5 |
| 8 | **Prisma migration on a live DB.** `20260627_eaos_1_entity_model` is in `prisma/migrations/` and the schema is validated. Need to run `pnpm prisma migrate dev` against a real DB to confirm 11 tables + 6 enums are created. | **ACTION** | User (needs DB) | roadmap §5 task 1.40 |
| 9 | **Tasks/workflow sub-controllers not annotated.** The `scripts/annotate-controllers.js` script only processes top-level `.controller.ts` files. Sub-controllers in `modules/tasks/` (if any) and `modules/workflows/` (if any) need a follow-up pass. | **AWAITING** | Investigate in 1B | roadmap §5 tasks 1.11-1.14 |

See [`02-decisions-log.md`](./02-decisions-log.md) for the full decision history.
See [`05-phase-tracker.md`](./05-phase-tracker.md) for per-phase status.

---

## Active conversations

None at this time.

---

## Blockers

None currently. Phase 1 Tier A+B complete. Awaiting user review of PR.

---

## Session notes

### Session — 2026-06-27 (Phase 1 Tier A + B)

**Outcome:** Backend foundation (Tier A) and frontend-eaos bootstrap (Tier B) complete. 5 commits shipped, ~1,400 lines of new code. Tier C (annotations) and Tier D (packages/ui internals) deferred to user-directed follow-up.

**Commits on `eaos-base` this session:**
- `506d511e` — Tasks 1.1 + 1.7: swagger install, OpenAPI bootstrap
- `36e9ebc5` — Task 1.2: PaginationDto, IdParamDto, envelope types
- `4a5fdfb6` — Task 1.4: TenantContextService + AsyncLocalStorage middleware
- `80a2ed31` — Tasks 1.8 + 1.9: agents controller returns canonical envelopes
- `94d6242c` — Tasks 1.18-1.27: frontend-eaos bootstrap (Next.js 15, providers, Toaster, placeholder)

**Approach taken:**
- **Tier A (backend foundation):** focused on the high-leverage pieces — OpenAPI generation, canonical envelopes, AsyncLocalStorage tenant context. These unlock the rest of Phase 1 + EAOS-1.
- **Tier B (frontend scaffold):** the minimum to get `pnpm install` and `next build` working. Toaster + providers are the foundation; everything else is page content.
- **Tier C/D (deferred):** 1.5/1.6 (annotate every controller/DTO) is a mechanical 3-5 day task; 1.10 (Prisma EAOS-1 models) needs user review of the schema; 1.11-1.17 (packages/ui internals) should follow the 10-panel workspace build, not precede it.

**Key decisions in this session:**
- Used `clsx` + `tailwind-merge` for the `cn()` helper (industry standard).
- pnpm v11 store layout change forced a `--no-frozen-lockfile` reinstall; resolved by re-running install.
- TenantContextService is a per-instance singleton; the ALS store is request-scoped.
- Toaster is intentionally simple (no external lib) — when `packages/ui` ships (Task 1.12), it becomes a thin wrapper.

**Lessons:**
- Don't extract `packages/ui/` before you have real components to put in it. Premature extraction = the package is empty/abstract and has no real consumers.
- AsyncLocalStorage is the cleanest way to make `tenantId` available to deep service calls without threading the parameter through every method signature. NestJS does this elegantly via the middleware.
- Per-instance `QueryClient` in `useState` initializer is the canonical TanStack Query pattern (one client per app instance, not per render).

**Next session (user decides):**
1. **Option A — Annotate (1.5/1.6):** mechanical 3-5 day task. Worth doing if the team values OpenAPI accuracy now.
2. **Option B — Skip annotations, jump to EAOS-1 frontend work:** the agents migration (1.8/1.9) is enough proof; the rest can be annotated as we touch the code.
3. **Option C — Add the EAOS-1 Prisma models (1.10):** unlocks the entity workspace in EAOS-1.
4. **Option D — User reviews the 9 commits and merges to `main` first**, then we continue.

---

**End of active context.**
