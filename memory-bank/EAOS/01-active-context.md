# NeureCore — EAOS Active Context

**Last updated:** 2026-06-27 16:55
**Phase:** 0 (Safety Lockdown) — **ALL 5 BACKEND TASKS DONE**
**Branch:** `eaos-base` (pushed to `origin`)
**Status:** Phase 0 backend complete. Ready for PR review. Next: Phase 1 (scaffold `frontend-eaos/` + `packages/ui/`).

---

## Current focus

**Phase 0 backend complete.** All 5 backend security tasks shipped. Phase 0 frontend tasks were eliminated (per D-023 — `frontend-tenant/` deleted, no old frontend to fix). The 4 commits on `eaos-base`:

| Commit | Task | Files |
|---|---|---|
| `c00dff57` | 0.1, 0.2 (D-016, D-015) | tools.controller, tiers/* import fix, security.types.ts rewrite, removed dead guards |
| `795702dd` | 0.3 (D-014) | agent-streaming.controller: JwtAuthGuard + session ownership check |
| `8d6fe982` | 0.4 (D-013) | audit.interceptor: wires AuditService.log() for POST/PATCH/DELETE |
| `4ef6ef97` | 0.5 (D-016) | resolve-tenant-context.ts + assert-same-tenant.ts; applied to agents + departments findOne |

**Next:** Phase 1 — scaffold `frontend-eaos/` + `packages/ui/`. See [`EAOS-implementation-roadmap.md` §5](./EAOS-implementation-roadmap.md) for the 17-task plan.

### Phase 0 status

**Backend (5/5 done):**
- ✅ 0.1: Delete `backend/src/modules/security/guards/roles.guard.ts` and `security.types.ts:UserRole`/`Permission`/`ROLE_PERMISSIONS` (commit `c00dff57`)
- ✅ 0.2: Add `JwtAuthGuard` + `@Roles()` to `tools.controller.ts:execute`, `:execute/:id`, `:id/status` (commit `c00dff57`)
- ✅ 0.3: Add session-ownership check to `agent-streaming.controller.ts:71-132` SSE (commit `795702dd`)
- ✅ 0.4: Wire `AuditInterceptor` to `AuditService.log()` for all `POST/PATCH/DELETE` (commit `8d6fe982`)
- ✅ 0.5: Add tenant isolation helpers + apply to `agents.findOne` + `departments.findOne` (commit `4ef6ef97`)

**Frontend (eliminated per D-023):**
- ⛔ 0.6: ~~Fix wrong-token-key bug in 11+ files~~ — **ELIMINATED** (frontend-tenant deleted)
- ⛔ 0.7: ~~Wire `<Toaster />` to existing `ToastStrategy`~~ — **ELIMINATED** (frontend-tenant deleted)

### Phase 0 success criteria

- [x] SSE rejects mismatched `userId` with 403 (canAccessSession helper)
- [x] `AuditLog` DB table will receive rows on every mutating request (auditService.log wired)
- [x] Tenant isolation helper deployed + applied to 2 critical `findOne` endpoints (agents + departments)
- [x] tsc passes (no errors)
- [ ] Phase 0 backend code reviewed and merged to `main` (user action)

---

## Recent changes (last 7 days)

| Date | Change | Doc reference |
|---|---|---|
| 2026-06-27 16:55 | Phase 0 complete: tasks 0.3, 0.4, 0.5 done (commits `795702dd`, `8d6fe982`, `4ef6ef97`) | 03-implementation-log |
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
| 7 | **Phase 0 PR review.** All 5 backend tasks shipped; awaiting user review and merge to `main`. | **AWAITING** | User | impl-plan §9, roadmap §4 |

See [`02-decisions-log.md`](./02-decisions-log.md) for the full decision history.
See [`05-phase-tracker.md`](./05-phase-tracker.md) for per-phase status.

---

## Active conversations

None at this time.

---

## Blockers

None currently. Phase 0 backend done. Ready for user PR review, then Phase 1.

---

## Session notes

### Session — 2026-06-27 (Phase 0 backend completion)

**Outcome:** All 5 Phase 0 backend tasks shipped. Phase 0 complete on the backend side. Awaiting user PR review.

**Commits on `eaos-base` this session:**
- `795702dd` — Task 0.3 (D-014): SSE session ownership check
- `8d6fe982` — Task 0.4 (D-013): AuditInterceptor writes to DB
- `4ef6ef97` — Task 0.5 (D-016): Tenant isolation helpers + apply to 2 endpoints

**Approach taken:**
- Task 0.3: `JwtAuthGuard` at class level + `@CurrentUser()` + private `canAccessSession` helper as the single chokepoint. Platform roles bypass. Session creation no longer accepts `?userId=` query param.
- Task 0.4: Inject `AuditService` into `AuditInterceptor`. Skip GET. Fire-and-forget via `void promise.catch()`. Action format `api.POST /path/:id` (UUIDs normalized to `:id` to avoid cardinality explosion).
- Task 0.5: Two helpers created in `common/utils/`. Applied to `agents.findOne` and `departments.findOne` as proof of pattern. Existing `where: { tenantId }` Prisma filters in service methods are already correct (return 404 for cross-tenant lookups); `assertSameTenant` is belt-and-suspenders.

**Lessons:**
- `assertSameTenant` adds defense-in-depth even when services already filter. Future service methods that forget the `tenantId` filter will be caught at the controller level.
- The `canAccessSession` helper pattern (boolean predicate, not throwing) is cleaner than having the controller call `assertSameTenant` + handle NotFoundException in two branches.

**Next session:**
1. User reviews Phase 0 PR (4 commits, ~440 lines of changes)
2. User merges to `main` (or addresses review feedback first)
3. Begin Phase 1: scaffold `frontend-eaos/` + `packages/ui/` per roadmap §5 (17 tasks)
4. Decide on cookie auth implementation details (Phase 9 work, pulled forward per D-023)
5. Vercel OIDC token rotation (user action)

---

**End of active context.**
