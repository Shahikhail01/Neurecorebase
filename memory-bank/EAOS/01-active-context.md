# NeureCore — EAOS Active Context

**Last updated:** 2026-06-27 15:57
**Phase:** 0 (Safety Lockdown) — backend tasks 0.1 + 0.2 done; 0.3–0.7 pending
**Branch:** `eaos-base` (pushed to `origin`)
**Status:** Phase 0 in progress. Major architectural decision: build EAOS as a new frontend (D-022).

---

## Current focus

**Resuming Phase 0 backend tasks (0.3–0.5).** Per [`EAOS-implementation-roadmap.md` §4](./EAOS-implementation-roadmap.md).

Tasks 0.1 and 0.2 are complete and committed on `eaos-base` (commit `c00dff57`). Next up: SSE auth, audit interceptor, tenant isolation helper.

**Phase 0 frontend tasks (0.6, 0.7) are now SKIPPED** for the old `frontend-tenant/` per D-022. They are N/A in the new `frontend-eaos/` (built correctly from day 1).

**Parallel track:** Scaffolding `frontend-eaos/` is a Phase 1 deliverable but can begin in parallel with Phase 0. Includes: `packages/ui/` extraction, Next.js 15 app bootstrap, OpenAPI codegen pipeline, design tokens, permission helpers.

### Phase 0 task list (from roadmap §4)

**Backend (5 tasks):**
- ✅ 0.1: Delete `backend/src/modules/security/guards/roles.guard.ts` and `security.types.ts:UserRole`/`Permission`/`ROLE_PERMISSIONS` (commit `c00dff57`)
- ✅ 0.2: Add `JwtAuthGuard` + `@Roles()` to `backend/src/modules/tools/tools.controller.ts:execute`, `:execute/:id`, `:id/status` (commit `c00dff57`)
- ⬜ 0.3: Add session-ownership check to `backend/src/modules/agents/streaming/agent-streaming.controller.ts:71-132` SSE
- ⬜ 0.4: Wire `AuditInterceptor` to `AuditService.log()` for all `POST/PATCH/DELETE` in `backend/src/common/interceptors/audit.interceptor.ts`
- ⬜ 0.5: Add explicit `entity.tenantId === user.tenantId` check to all `findOne` methods (single example today: `tenants.controller.ts:55-63`)

**Frontend (2 tasks — DEFERRED to `frontend-eaos/` build, not `frontend-tenant/`):**
- ⛔ 0.6: Fix wrong-token-key bug in 11+ files — **N/A in new** (cookie auth from day 1; no localStorage)
- ⛔ 0.7: Wire `<Toaster />` to the existing `ToastStrategy` — **N/A in new** (Toaster is part of the initial scaffold)

### Phase 0 success criteria

- [ ] SSE rejects mismatched `userId` with 403
- [ ] `AuditLog` DB table has > 0 rows from a test mutating request
- [ ] Tenant isolation helper deployed + applied to ≥ 1 critical `findOne` endpoint
- [ ] Phase 0 backend code reviewed and merged to `main`

---

## Recent changes (last 7 days)

| Date | Change | Doc reference |
|---|---|---|
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
| 4 | **Cookie auth cutover (Phase 9 work pulled forward).** Per D-022, the backend switches to httpOnly cookies before `frontend-eaos` ships. Dual-support window = 90 days. Confirm cookie set names, CSRF approach, and rollout sequencing. | **AWAITING** | Engineering lead | api-contract §4.1, frontend-data-layer §4.1 |
| 5 | **Tier 2/3 docs timing** (component catalog, observability, i18n, a11y, perf budgets, testing strategy). Written when their phase starts, OR in advance? | **AWAITING** | Engineering lead decision | roadmap §2 |

See [`02-decisions-log.md`](./02-decisions-log.md) for the full decision history.
See [`05-phase-tracker.md`](./05-phase-tracker.md) for per-phase status.

---

## Active conversations

None at this time.

---

## Blockers

None currently. Ready to resume Phase 0 tasks 0.3–0.5.

---

## Session notes

### Session — 2026-06-27 (D-022 decision + branch setup)

**Outcome:** Major architectural pivot. Building EAOS as new `frontend-eaos/` rather than incrementally modifying `frontend-tenant/`. Branch `eaos-base` created and pushed.

**Work completed:**
- Created `eaos-base` branch and pushed initial commit `c00dff57` (Phase 0 tasks 0.1 + 0.2 + 13 EAOS doc files)
- Recorded D-022 (new frontend decision) in 02-decisions-log.md
- Updated 00-index.md with dual-frontend architecture
- Updated this active context

**Lessons:**
- A clean-slate `frontend-eaos/` saves 6+ weeks of accumulated cleanup debt on `frontend-tenant/`.
- The shared `packages/ui/` package is the only thing keeping the two frontends from drifting visually during the transition.
- Cookie auth from day 1 means the new frontend never inherits the localStorage XSS problem.

**Next session:**
1. Resume Phase 0 backend tasks 0.3, 0.4, 0.5
2. Begin Phase 1 scaffolding: `frontend-eaos/`, `packages/ui/`, OpenAPI codegen pipeline

---

**End of active context.**
