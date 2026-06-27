# NeureCore — EAOS Active Context

**Last updated:** 2026-06-27 15:34
**Phase:** 0 (Safety Lockdown) — about to start
**Status:** Planning complete. All 7 architectural docs published. Ready to begin Phase 0.

---

## Current focus

**Starting Phase 0: Safety Lockdown (Week 1).** Per [`EAOS-implementation-roadmap.md` §4](./EAOS-implementation-roadmap.md).

Phase 0 closes every active security gap identified in the codebase audits. No new features, no refactors. **Target: ship within 1 week.**

### Phase 0 task list (from roadmap §4)

**Backend (5 tasks):**
- 0.1: Delete `backend/src/modules/security/guards/roles.guard.ts` and `security.types.ts:UserRole`/`Permission`/`ROLE_PERMISSIONS`
- 0.2: Add `JwtAuthGuard` + `@Roles()` to `backend/src/modules/tools/tools.controller.ts:execute`, `:execute/:id`, `:id/status`
- 0.3: Add session-ownership check to `backend/src/modules/agents/streaming/agent-streaming.controller.ts:71-132` SSE
- 0.4: Wire `AuditInterceptor` to `AuditService.log()` for all `POST/PATCH/DELETE` in `backend/src/common/interceptors/audit.interceptor.ts`
- 0.5: Add explicit `entity.tenantId === user.tenantId` check to all `findOne` methods (single example today: `tenants.controller.ts:55-63`)

**Frontend (2 tasks):**
- 0.6: Fix wrong-token-key bug in 11+ files (use `tokenManager.getAccessToken()` instead of `localStorage.getItem('accessToken')`)
- 0.7: Wire `<Toaster />` to the existing `ToastStrategy` in `frontend-tenant/src/core/services/notification/`

### Phase 0 success criteria

- [ ] `grep -r "execute" backend/src/modules/tools/tools.controller.ts` shows every method has a guard
- [ ] SSE rejects mismatched `userId` with 403
- [ ] `AuditLog` DB table has > 0 rows from a test mutating request
- [ ] `security/guards/roles.guard.ts` does not exist
- [ ] All raw `fetch` calls in `service-desk/`, `intelligence/`, `finance/` use `tokenManager.getAccessToken()`
- [ ] Manual test: trigger a 401 → toast appears in UI

---

## Recent changes (last 7 days)

| Date | Change | Doc reference |
|---|---|---|
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
| 3 | **Phase 9 — when to start?** Recommend parallel with Phase 3. | **AWAITING** | Engineering lead decision | roadmap §13 |
| 4 | **Observability backend for Phase 5.** AI Actions cannot ship without per-tenant credit caps + per-user rate limits + kill-switch flag. | **AWAITING** | Confirm backend is ready | roadmap §9 |
| 5 | **Migration deadline for `localStorage` tokens.** Dual-support period = 90 days from Phase 9 rollout. | **AWAITING** | Confirm deadline | api-contract §4.1, roadmap §13 |
| 6 | **Tier 2/3 docs timing** (component catalog, observability, i18n, a11y, perf budgets, testing strategy). Written when their phase starts, OR in advance? | **AWAITING** | Engineering lead decision | roadmap §2 |

See [`02-decisions-log.md`](./02-decisions-log.md) for the full decision history.
See [`05-phase-tracker.md`](./05-phase-tracker.md) for per-phase status.

---

## Active conversations

None at this time.

---

## Blockers

None currently. Ready to start Phase 0.

---

## Session notes

### Session — 2026-06-27 (EAOS planning + docs)

**Outcome:** All 7 architectural EAOS docs published. Roadmap defined. Ready to start implementation.

**Work completed:**
- 4 original EAOS docs reviewed and updated to v2.6 / v1.2 (impl-plan, NUWS, pricing)
- 3 new spec docs created (api-contract, rbac-model, frontend-data-layer)
- 1 roadmap doc created (11-phase plan with risk, exit criteria, rollback)
- All 8 open UI questions resolved (Mission Feed personalization, Mini-Graph P2, etc.)
- Codebase audits performed on backend (35 modules), RBAC system, and frontend (12 Zustand stores)
- 6 open decisions raised for user input

**Lessons:**
- The codebase had **half-finished migrations** sitting unused (new `RestClient` + repositories in `core/services/`, but pages still use legacy `api.ts`). The new docs are designed to **complete** these migrations, not start fresh.
- Multiple parallel implementations of the same concept (two `RolesGuard`, two `UserRole` enums, two HTTP clients, two socket implementations). Each doc explicitly retires the duplicates.
- The audit findings (e.g. unauthenticated `/tools/execute`, SSE without auth, audit interceptor only `console.log`s) are real security gaps that **must close before any new work**. Hence Phase 0.

**Next session:** Start Phase 0 tasks 0.1–0.7 per roadmap §4.

---

**End of active context.**
