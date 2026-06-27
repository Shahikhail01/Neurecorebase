# NeureCore — EAOS Active Context

**Last updated:** 2026-06-27 18:00
**Phase:** 1 (Foundations) — **v1.3 plan published**; previous Tier A+B complete but PLAN was insufficient
**Branch:** `eaos-base` (pushed to `origin`)
**Status:** User caught an important plan-quality issue. I deferred too much in Phase 1 (annotations, Prisma EAOS-1 schema, packages/ui internals, tenant-context migration). v1.3 of the roadmap now expands Phase 1 to 5 sub-phases (A, B, C, D, E) with all critical tasks included. Awaiting user decision on what to ship next.

---

## Current focus

**Phase 1 — Tier A + Tier B complete.** 5 new commits on `eaos-base` since Phase 0 wrap:

| Commit | Task | Files |
|---|---|---|
| `506d511e` | 1.1 + 1.7 (swagger + OpenAPI bootstrap) | `backend/package.json`, `nest-cli.json`, `main.ts` |
| `36e9ebc5` | 1.2 (PaginationDto, IdParamDto, PaginatedResponse, ActionResult) | `backend/src/common/{dto,responses}/` |
| `4a5fdfb6` | 1.4 (TenantContextService + AsyncLocalStorage middleware) | `backend/src/common/context/`, `app.module.ts` |
| `80a2ed31` | 1.8 + 1.9 (agents.findAll → PaginatedResponse, agents.pause → ActionResult) | `backend/src/modules/agents/` |
| `94d6242c` | 1.18-1.27 (frontend-eaos bootstrap: Next.js 15, providers, Toaster, placeholder) | `pnpm-workspace.yaml`, `frontend-eaos/**` |

**Next:** Tier A is complete; Tier B is complete. The user (correctly) called out that I deferred too much in the v1.2 plan. v1.3 of the roadmap expands Phase 1 to 5 sub-phases (A, B, C, D, E) with all critical tasks included.

**The user's correction (verbatim from session):** *"WHY DID YOU IN THE FIRST PLACE KEEP THESE TASKS IN PHASE 1, you should have anticipated things clearly."*

**My honest assessment:** the v1.2 plan shipped abstractions (`TenantContextService`, `@nestjs/swagger` setup, `frontend-eaos/` shell) without their consumers. That's a textbook DIP/SRP violation:
- `TenantContextService` was added in 1A but no service reads it. The 15+ duplicate `resolveTenantId` methods were never migrated to use it. **Dead weight.**
- `@nestjs/swagger` was set up in 1A but only `agents` was annotated. The generated `openapi.json` is essentially empty for every other endpoint. **Defeats the purpose.**
- The Prisma EAOS-1 schema was deferred, but Phase 3 (entity workspace) cannot start without it. **Blocking dependency disguised as a deferral.**
- `packages/ui` was deferred as "premature extraction" but `<Can>`, `<EmptyState>`, `<LoadingState>`, `<ErrorState>` are required by every page per NUWS §3.1a. **The Toaster was needed; so are the rest.**

**v1.3 fix (new):** Phase 1 is now divided into 5 sub-phases with explicit "CRITICAL" markers on the deferred-from-v1.2 tasks:
- **1A** Backend core (envelopes, tenant context, OpenAPI bootstrap) — v1.2 ✓
- **1B** Backend annotation roll-out (CRITICAL — was deferred) — 9 tasks, ~2 weeks
- **1C** Frontend scaffold + design system (CRITICAL — was deferred) — 19 tasks, ~1 week
- **1D** EAOS-1 Prisma schema (CRITICAL — was deferred) — 3 tasks, ~3 days
- **1E** Tenant-context migration roll-out (CRITICAL — was missing entirely) — 8 tasks, ~1 week

Total Phase 1 tasks: 48 (was 27 in v1.2). Every task now has explicit SOLID adherence and a real consumer.

### Phase 1 status

**Backend (6/10 done):**
- ✅ 1.1: Install `@nestjs/swagger` + nest-cli plugin
- ✅ 1.2: `PaginationDto` + `IdParamDto` + envelope types (`PaginatedResponse<T>`, `ActionResult<T>`)
- ⏭ 1.3: `resolve-tenant-context.ts` (already done in Phase 0 task 0.5; no-op)
- ✅ 1.4: `TenantContextService` + `TenantContextMiddleware` (AsyncLocalStorage)
- ⬜ 1.5: Annotate EVERY controller with `@ApiTags`, `@ApiOperation`, etc. — **DEFERRED** (~3-5 days mechanical)
- ⬜ 1.6: Annotate EVERY DTO with `@ApiProperty` — **DEFERRED** (~2-3 days)
- ✅ 1.7: OpenAPI generation wired (writes to `backend/openapi/openapi.json` on every boot)
- ✅ 1.8: `agents.findAll` → `PaginatedResponse<AgentResponseDto>` (proof of pattern)
- ✅ 1.9: `agents.pause` → `ActionResult<AgentResponseDto>` (proof of pattern)
- ⬜ 1.10: Add EAOS-1 Prisma models — **DEFERRED** (needs user review of schema)

**`packages/ui/` (0/7 done):**
- ⬜ 1.11-1.17: All deferred — building the shared design system is a multi-day effort that should follow the 10-panel scaffolding in EAOS-1 (avoid premature extraction)

**`frontend-eaos/` (4/10 done):**
- ✅ 1.18: Bootstrap Next.js 15.0.3 + React 19 + TypeScript 5.7 + Tailwind 3.4
- ✅ 1.19: Install deps (TanStack Query, react-hook-form, zod, socket.io-client, lucide-react, next-themes, date-fns, openapi-typescript, tailwind-merge)
- ✅ 1.20: `app/layout.tsx` with `<Providers>` (ThemeProvider + QueryClientProvider + Toaster)
- ✅ 1.21: `app/providers.tsx` with `QueryClientProvider` (default staleTime 30s, retry 2, etc.)
- ⬜ 1.22: Set up `openapi-typescript` codegen pipeline (script is in package.json; runs against backend openapi.json once backend has annotations)
- ⬜ 1.23: Apply design tokens — **partially done** (tokens in `tailwind.config.ts`); full coverage when `packages/ui` ships
- ⬜ 1.24: `config/feature-flags.ts` — **DEFERRED** (no features to flag yet)
- ✅ 1.25: Added to `pnpm-workspace.yaml`
- ⬜ 1.26: Set up Vercel project — **DEFERRED** (user action; requires Vercel account)
- ✅ 1.27: Placeholder page (`/`) — "EAOS — coming soon"

### Phase 1 exit criteria

- [x] Backend `nest build` succeeds
- [x] Backend `tsc --noEmit` passes
- [x] `frontend-eaos` `tsc --noEmit` passes
- [x] `frontend-eaos` `next build` succeeds ("Compiled successfully" + 4 static pages)
- [x] `pnpm-workspace.yaml` includes `frontend-eaos`
- [x] OpenAPI bootstrap code in main.ts (writes to `backend/openapi/openapi.json` at boot)
- [ ] `backend/openapi/openapi.json` actually generated — needs DB-connected server start (verify in dev)
- [ ] `<Can permission="agent.spawn">` placeholder on a real page — **DEFERRED** (no real page yet)
- [ ] Vercel deployment of `frontend-eaos` succeeds — **DEFERRED** (user action)
- [ ] `agents.controller.ts:findAll` returns `PaginatedResponse<AgentResponseDto>` — **CODE DONE**, runtime verify deferred
- [ ] `agents.controller.ts:pause` returns `ActionResult<AgentResponseDto>` — **CODE DONE**, runtime verify deferred

### Rollback plan

All Phase 1 changes are additive:
- New `frontend-eaos/` doesn't affect existing backend or frontend-admin
- New `TenantContextMiddleware` is no-op for routes without `req.user` (no breakage)
- `PaginatedResponse<T>` / `ActionResult<T>` only used by the new agents.findAll/pause (other endpoints still use legacy shapes; backward compat preserved per spec §12)
- OpenAPI generation only writes to disk on successful boot; write failure is non-blocking

---

## Recent changes (last 7 days)

| Date | Change | Doc reference |
|---|---|---|
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
| 7 | **Phase 0 + Phase 1 PR review.** 9 commits on `eaos-base` awaiting user review and merge to `main`. | **AWAITING** | User | impl-plan §9, roadmap §4 §5 |
| 8 | **Phase 1.5/1.6 — annotate every controller/DTO.** ~3-5 days of mechanical work. Can be done in parallel with EAOS-1 frontend work. | **DECIDED-DEFER** | User decision on whether to proceed or skip | roadmap §5 |

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
