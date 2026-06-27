# NeureCore — EAOS Decisions Log

**Last updated:** 2026-06-27 18:00
**Purpose:** Chronological log of all architectural, product, and process decisions made during EAOS planning and implementation. Each entry: decision, rationale, trade-offs, doc reference.

**Format:** Newest first. Use ISO date prefix.

---

## 2026-06-27 (continued)

### D-024 · Phase 1 v1.3 expansion: ship abstractions with consumers (correction to v1.2)

**Decision:** Restructure Phase 1 from 27 tasks (v1.2) to 48 tasks (v1.3) across 5 sub-phases. v1.2 was insufficient because I shipped abstractions (`TenantContextService`, `@nestjs/swagger` setup, `frontend-eaos/` shell) without their consumers. v1.3 makes the consumer-side tasks explicit and marks the four "CRITICAL" deferrals from v1.2:

1. **Task 1B (backend annotation roll-out, 9 tasks)** — annotating every controller + DTO so the OpenAPI artifact is comprehensive. Without this, the frontend codegen pipeline (Phase 2) cannot work.
2. **Task 1C (frontend scaffold + design system, 19 tasks)** — `packages/ui` primitives (`<EmptyState>`, `<LoadingState>`, `<ErrorState>`, `<Can>`, query keys, hooks). Required by every page per NUWS §3.1a.
3. **Task 1D (EAOS-1 Prisma schema, 3 tasks)** — 11 new models (`EntityState`, `StateHistory`, `EntityOwnership`, `EntityLabel`, `UserFavorite`, `UserRecentAccess`, `EntityWatcher`, `EntityHealth`, `EntityRelationship`, `WorkspaceLayout`, `CapabilityConfig`). Required for Phase 3 (entity workspace).
4. **Task 1E (tenant-context migration, 8 tasks)** — actually consuming the `TenantContextService` by migrating 15+ duplicate `resolveTenantId` methods. Without this, the service is dead weight (DIP violation).

**Rationale:** the user pointed out (verbatim): *"WHY DID YOU IN THE FIRST PLACE KEEP THESE TASKS IN PHASE 1, you should have anticipated things clearly."* I had rationalised each deferral individually but failed to see the systemic violation: every deferral was a **blocking dependency disguised as a deferral**.

**Trade-offs accepted:**
- Phase 1 grows from ~2 weeks to ~4 weeks. Worth it — the alternative was shipping an unusable foundation.
- Each sub-phase is independently shippable and reviewable as its own commit, so the slower cadence doesn't block the rest of the team.
- Every task in v1.3 has an explicit SOLID principle cited. The plan itself now embodies the same principles the code is held to.

**Doc references:**
- `EAOS-implementation-roadmap.md` v1.3 (this is the change)
- `01-active-context.md` updated to reflect the v1.3 plan
- `EAOS-NUWS-principles.md` §7.5 design tokens, §3.1a empty states, §7.5.4 density — all referenced
- `EAOS-rbac-model.md` §3.3 ROLE_PERMISSIONS, §5 EntityOwnerGuard, §10 EntityOwnerGuard — all referenced

**Status:** Approved by user feedback 2026-06-27 18:00. Awaiting user decision on which sub-phases to ship next.

---

## 2026-06-27 (continued)

### D-025 · Phase 1 execution order: sequential, priority-ordered (1D → 1B → 1E → 1C)

**Decision:** Execute Phase 1 sub-phases in this order:
1. **1D** (Prisma EAOS-1 schema) — 3 tasks, unblocks Phase 3
2. **1B** (Annotation roll-out) — 10 tasks, makes OpenAPI comprehensive
3. **1E** (Tenant-context migration) — 8 tasks, fixes the DIP violation
4. **1C** (Frontend packages/ui) — 19 tasks, required by every page

**Rationale:** the user said "Sequential, priority-ordered". This order reflects:
- **1D first** because the EAOS-1 Prisma schema is the strictest blocking dependency for Phase 3 (entity workspace). Without it, Phase 3 cannot start.
- **1B second** because the OpenAPI artifact is the single source of truth for the frontend codegen pipeline (Phase 2) and the entire EAOS-1 frontend work. Annotating only `agents` (as v1.2 did) leaves every other endpoint undefined.
- **1E third** because the `TenantContextService` was shipped in 1A but still has zero consumers (DIP violation). After 1B, the canonical envelopes are in place; after 1E, services use them through the AsyncLocalStorage-backed service.
- **1C last** because the `packages/ui` primitives are the foundation for every page. After 1D+1B+1E, the backend is solid; building the frontend on a solid backend is lower risk.

**Trade-offs accepted:**
- This is strictly serial, not parallel. A 2-pair team could parallelize (backend does 1B+1D+1E, frontend does 1C). For 1 pair, serial is correct.
- 1E comes after 1B but is the smallest. That's fine; 1B is the heaviest.
- 1C is deferred to the end. The frontend-eaos placeholder is functional but doesn't use the new primitives yet.

**Doc references:**
- `EAOS-implementation-roadmap.md` v1.3 §5
- `01-active-context.md` (D-025)
- `03-implementation-log.md` (D-025)

**Status:** Approved 2026-06-27 19:00. 1D done ✅ (commit `3d7a2b14`). 1B in progress (4/10 tasks done as of 20:13, commit `af81470d`).

---

## 2026-06-27 (continued)

### D-023 · Delete `frontend-tenant/` immediately (no production users, no release)

**Decision:** Delete the entire `frontend-tenant/` folder. No "frozen" intermediate state, no 90-day redirect window, no Phase 10 decommission task.

**Rationale:**
- NeureCore has not been released; there are no customers using `frontend-tenant/` in production.
- The "frozen + 90-day redirect + decommission in Phase 10" plan from D-022 was written assuming production users exist. They don't.
- Deleting immediately removes the temptation for engineers to "just patch it here real quick" and eliminates the dual-implementation risk.
- The frontend tech debt (1,251-line workspace page, half-finished SOLID migration, wrong-token-key bug, silently-dropped toasts, 12 Zustand stores with hand-rolled `loading`/`error`) disappears with the folder.
- The `VERCEL_OIDC_TOKEN` and other secrets in `.env.local` need to be rotated (the folder contained a live Vercel token in a non-gitignored env file; that token was visible in tool output and should be revoked).

**Trade-offs accepted:**
- No "safety net" if `frontend-eaos/` has issues at launch. (Mitigation: `frontend-eaos/` is a clean build, not a rewrite — the patterns are proven; the work is in design + polish, not in untangling.)
- Cannot run both apps side-by-side. (Acceptable: no users to migrate.)
- Phase 0 tasks 0.6 and 0.7 (wrong-token-key bug, Toaster wiring) are eliminated entirely — there is no "old frontend" to fix.
- Phase 9 dual-support window (90 days) becomes unnecessary — the backend ships httpOnly cookies as the only auth path for `frontend-eaos/`. No legacy `Authorization: Bearer` header fallback to maintain.
- Phase 10 tasks 10.13–10.15 (parity verification, 301 redirect, delete) are already done.

**Cleanup actions (immediate):**
- Delete `frontend-tenant/` folder.
- Rotate the Vercel OIDC token in Vercel dashboard (was leaked in `.env.local` content exposed during pre-deletion verification).
- Revoke the Vercel project for `frontend-tenant` (the `hq.neurecore.com` deployment).
- Update all 10 EAOS docs to reflect the new architecture: single frontend, no frozen, no dual-support, no 90-day redirect.

**Doc references:**
- This decision supersedes the "frozen" and "Phase 10 decommission" language in every doc.
- Specifically removes Phase 0 tasks 0.6 and 0.7; removes Phase 9 dual-support language; removes Phase 10 tasks 10.13–10.15.

**Status:** Approved 2026-06-27 16:11.

---

### D-022 · Build EAOS as a new frontend (`frontend-eaos`); freeze `frontend-tenant`

**Decision:**
- Create a new app `frontend-eaos/` as a clean-slate Next.js 15 + Tailwind 3.4 implementation of the EAOS surface.
- Deploy at `eaos.neurecore.com/{tenantCompanyName}` (subdomain + path; each tenant gets their own URL segment).
- Extract a shared `packages/ui/` package (design tokens, design-system components, permission hooks, `useCan` / `<Can>`, query keys factory) consumed by both `frontend-eaos` and `frontend-tenant`.
- Backend switches to **httpOnly + Secure + SameSite=Strict cookie auth FIRST** (the Phase 9 work is pulled forward). Both frontends use cookie auth from day 1; no localStorage dance in the new app.
- `frontend-tenant/` is **FROZEN** for the duration of the build (6–12 months). No new features. Critical security fixes only (CVEs, auth bypasses). All EAOS work happens in `frontend-eaos/`.
- `frontend-tenant/` is **decommissioned** only after `frontend-eaos` reaches feature parity + a 90-day 301 redirect from old routes to new.

**Rationale:**
- The existing `frontend-tenant/` has 6+ weeks of accumulated cleanup debt (dual HTTP clients, dual socket implementations, half-finished SOLID migration sitting unused in `core/services/`, 12 Zustand stores, 1,251-line workspace page, wrong-token-key bug in 11+ files, silently-dropped toasts).
- TanStack Query migration alone is a 3-week risky refactor (Phase 2 of original roadmap); the new EAOS workspace would be entirely rewritten anyway (Phase 3 replaces the 1,251-line page).
- Zero regression risk to existing users during a 6–12 month build.
- The spec docs (`EAOS-frontend-data-layer.md` §3.11–3.12) were already designed assuming a "retire the dual layers" end state; doing this in a new app makes that end state the starting state.
- The shared `packages/ui/` package ensures both frontends render identically; no design drift during the 6–12 month transition.
- Cookie auth from day 1 means the new frontend never has the `localStorage` XSS problem.

**Trade-offs accepted:**
- Two frontends to maintain during transition (~6–12 months).
- Two Vercel projects, two deployment pipelines.
- Stakeholders must understand the "two frontends" model.
- `packages/ui` extraction is upfront cost (~1 day) but pays back over the build.
- The cookie-auth cutover is a backend breaking change that requires coordination with any existing tenant that has a long-lived session (mitigated by 90-day dual-support per `EAOS-frontend-data-layer.md` §4.1).

**Doc references:**
- [`00-index.md`](./00-index.md) — folder structure now lists `frontend-eaos/` and `packages/ui/`
- [`EAOS-implementation-plan.md` §11](./EAOS-implementation-plan.md) — file structure updated to `frontend-eaos/`
- [`EAOS-NUWS-principles.md` Appendix D](./EAOS-NUWS-principles.md) — file structure updated
- [`EAOS-frontend-data-layer.md` §14](./EAOS-frontend-data-layer.md) — file structure updated; migration scope reduced
- [`EAOS-implementation-roadmap.md` Phase 1, 9, 10](./EAOS-implementation-roadmap.md) — scaffolding added; Phase 9 pulled forward; Phase 10 includes frontend-tenant decommission

**Status:** Approved 2026-06-27 15:57.

---

## 2026-06-27

### D-021 · OpenAPI 3.1 generation adopted (no `@nestjs/swagger` existed)

**Decision:** Add `@nestjs/swagger` dependency; configure `nest-cli.json` plugin with `classValidatorShim: true, introspectComments: true`; annotate every controller and DTO; commit `backend/openapi/openapi.json` to version control; generate `frontend-tenant/src/api/generated/types.ts` via `openapi-typescript`.

**Rationale:**
- No OpenAPI artifact exists today (verified by `grep @nestjs/swagger` returning 0 hits). Frontends hand-mirror types — drift is inevitable.
- Backend has 35 modules; codegen scales where hand-maintained types don't.
- The success/error envelopes are already consistent (`{ status, data, meta }`) — codegen will lock that.

**Trade-offs accepted:**
- Every existing controller/DTO gets annotated — a one-time cost of ~3 days of mechanical work.
- Codegen output must be committed (gitignored intermediates only), so PRs that change controllers always include the regenerated types.

**Doc reference:** [`EAOS-api-contract.md` §11](./EAOS-api-contract.md)

---

### D-020 · httpOnly + Secure + SameSite=Strict cookies for tokens (Phase 9)

**Decision:** Replace `localStorage` JWT storage with httpOnly cookies (`__Host-nc_at` for access, `__Host-nc_rt` for refresh). Implement CSRF via double-submit cookie pattern. Dual-support period: 90 days (legacy `Authorization: Bearer` header still works).

**Rationale:**
- `localStorage` is XSS-readable. httpOnly cookies are not.
- The `__Host-` prefix prevents subdomain cookie theft.
- Dual-support avoids breaking existing clients during migration.

**Trade-offs accepted:**
- Cross-origin Socket.IO requires `withCredentials: true`; SSE requires cookie-based auth (no custom headers in `EventSource`).
- CSRF implementation adds 1 middleware; frontend must read CSRF token from non-httpOnly cookie for mutating requests.

**Doc reference:** [`EAOS-frontend-data-layer.md` §4](./EAOS-frontend-data-layer.md), [`EAOS-api-contract.md` §4.1](./EAOS-api-contract.md), [`EAOS-implementation-roadmap.md` §13](./EAOS-implementation-roadmap.md)

---

### D-019 · TanStack Query is the single data-fetching library

**Decision:** Adopt `@tanstack/react-query` ^5.59 as the single data-fetching library. Retire: `CacheManager.ts`, `storeEventBridge.ts`, `services/unwrap.ts`, the dual HTTP clients, the dual socket implementations, and 6 of 12 Zustand stores (data stores).

**Rationale:**
- The codebase has no canonical data-fetching library; every page re-implements `loading`/`error`/`refetch` with `useState` + `useEffect`.
- TanStack Query's `useQuery`/`useMutation`/`useInfiniteQuery`/`staleTime`/`invalidateQueries` cover 80% of existing patterns in 20% of the code.
- A half-finished migration already exists in `core/services/` and `core/repositories/` — TanStack Query completes it.
- DevTools win is significant.

**Trade-offs accepted:**
- Bundle size: +~15KB gzipped. Acceptable.
- Migration effort: 3 weeks (Phase 2 in roadmap).
- The new `RestClient` stays as the `queryFn` source; TanStack Query owns caching.

**Doc reference:** [`EAOS-frontend-data-layer.md` §1, §3](./EAOS-frontend-data-layer.md), [`EAOS-implementation-roadmap.md` §6](./EAOS-implementation-roadmap.md)

---

### D-018 · Tremor is the chart library

**Decision:** Use `@tremor/react` for all charts. Replaces ad-hoc Recharts usage. Native dark-mode support; built on Recharts (escape hatch for custom viz).

**Rationale:**
- Native dark mode avoids the "auto-invert" anti-pattern (per NUWS §7.5.3).
- Opinionated = less custom-chart code to maintain.
- Tremor's design tokens align with NUWS §7.5.

**Trade-offs accepted:**
- Vendor lock-in to Tremor's component model.
- If a Solution Pack needs a viz Tremor can't express, revisit Visx. P2.

**Doc reference:** [`EAOS-implementation-plan.md` §14.2 Q7](./EAOS-implementation-plan.md), [`EAOS-NUWS-principles.md` §7.5](./EAOS-NUWS-principles.md)

---

### D-017 · 4-layer authorization model (Role → Resource → Action → Row)

**Decision:** Authorization is enforced at 4 layers that compose: (1) Role via `@Roles` decorator; (2) Resource via `EntityOwnerGuard`; (3) Action via `ActionAuthorizationGuard`; (4) Row via Prisma `where: { tenantId }` (and soon `AsyncLocalStorage` via `TenantContextService`).

**Rationale:**
- Layer 1 (Role) is the coarse primary defense — already used 64+ times across controllers.
- Layer 2 (Resource) closes the "user A accessing user B's entity" gap that today relies on 100+ manual `where` clauses.
- Layer 3 (Action) enforces AI Action policy (tier requirement, credit cap, entity type compatibility) — new in EAOS-3.
- Layer 4 (Row) is the existing per-query `tenantId` filter; will be replaced by `TenantContextService` in EAOS-1.

**Trade-offs accepted:**
- Three new guards to maintain (`EntityOwnerGuard`, `ActionAuthorizationGuard`, `TenantContextMiddleware`).
- Some "permission" granularity the old `Permission` enum promised is now lost — accepted because most apps need row-level, not role-level, granularity.

**Doc reference:** [`EAOS-rbac-model.md` §0](./EAOS-rbac-model.md)

---

### D-016 · `Permission` enum + `ROLE_PERMISSIONS` map deleted as dead code

**Decision:** Delete `backend/src/shared/types/security.types.ts:UserRole` (divergent enum), `:Permission` (28 values), `:ROLE_PERMISSIONS` (never invoked). Delete `backend/src/modules/security/guards/roles.guard.ts` (duplicate) and `permissions.guard.ts` (never wired).

**Rationale:**
- Audited: zero controllers import `RequirePermissions` or `PermissionsGuard`.
- Two `UserRole` enums exist (Prisma has 8, `security.types.ts` has 6 with `MANAGER`/`GUEST` that the DB never produces). Divergence is a bug waiting to happen.
- The 28 `Permission` values will be partially reused as AI Action categories in `AIActionDefinition` (Phase 5).

**Trade-offs accepted:**
- The "textbook RBAC" pattern (role → permission map) is abandoned in favor of direct `@Roles` + new resource/action guards. Pro: less indirection. Con: less reusable.

**Doc reference:** [`EAOS-rbac-model.md` §1.2, §3.1, §11](./EAOS-rbac-model.md)

---

### D-015 · `tools.controller.ts` endpoints require auth (security fix)

**Decision:** Add `JwtAuthGuard` + `@Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.USER)` to `tools.controller.ts:execute`, `:execute/:id`, `:id/status`. Currently unauthenticated.

**Rationale:**
- Audited: `POST /tools/execute` has no `@Roles` and no `JwtAuthGuard`. Anyone can call it.
- This is a real exploitable gap. Closes in Phase 0.

**Trade-offs accepted:**
- Existing integrations may need a refresh — communicate in changelog.
- This is a privilege floor (must be authenticated), not a ceiling (tier/permission still applied per-tool).

**Doc reference:** [`EAOS-rbac-model.md` §4.5](./EAOS-rbac-model.md), [`EAOS-implementation-roadmap.md` §4 task 0.2](./EAOS-implementation-roadmap.md)

---

### D-014 · SSE sessions require ownership check (security fix)

**Decision:** Add session-ownership check to `agent-streaming.controller.ts:71-132` SSE endpoint. Reject if `session.userId !== req.user.id` unless platform role.

**Rationale:**
- Audited: SSE accepts any `sessionId`. Anyone with a valid JWT can subscribe to any session's events.
- Closes in Phase 0.

**Trade-offs accepted:**
- Per-tenant "watch another user's session" UI is P2.

**Doc reference:** [`EAOS-rbac-model.md` §9.2, §4.4](./EAOS-rbac-model.md), [`EAOS-implementation-roadmap.md` §4 task 0.3](./EAOS-implementation-roadmap.md)

---

### D-013 · Audit interceptor writes to `AuditLog` DB (security fix)

**Decision:** Modify `backend/src/common/interceptors/audit.interceptor.ts` to call `AuditService.log()` on every `POST/PATCH/DELETE` (and login/logout events). Read (`GET`) requests are not logged. Async fire-and-forget.

**Rationale:**
- Audited: interceptor is registered as `APP_INTERCEPTOR` but only `console.log`s. `AuditService.log()` is called from almost no controller. The `AuditLog` DB is mostly empty.
- This is a real compliance gap.

**Trade-offs accepted:**
- Volume: ~10x more `AuditLog` rows. Default retention 365 days (configurable per Enterprise tenant).
- Performance: async write, no request blocking.

**Doc reference:** [`EAOS-rbac-model.md` §8](./EAOS-rbac-model.md), [`EAOS-implementation-roadmap.md` §4 task 0.4](./EAOS-implementation-roadmap.md)

---

### D-012 · Wrong-token-key bug fixed (frontend)

**Decision:** Replace `localStorage.getItem('accessToken')` with `tokenManager.getAccessToken()` in 11+ files. Canonical token key is `nc_access_token` (renamed from `hq_access_token` for clarity).

**Rationale:**
- Audited: `service-desk/page.tsx`, `intelligence/page.tsx`, `finance/page.tsx` (and others) use the wrong key. Requests silently sent unauthenticated; backend may return 200 with empty data; page silently renders zeros.

**Trade-offs accepted:**
- One-time token key rename; both old and new keys read during migration window.

**Doc reference:** [`EAOS-frontend-data-layer.md` §4.2](./EAOS-frontend-data-layer.md), [`EAOS-implementation-roadmap.md` §4 task 0.6](./EAOS-implementation-roadmap.md)

---

### D-011 · Toaster wired to existing ToastStrategy (frontend)

**Decision:** Add `<Toaster />` component to `app/layout.tsx` that listens for `window` `hq:toast` CustomEvents. The existing `ToastStrategy.ts` already fires these events but has no listener — toasts are silently dropped.

**Rationale:**
- Audited: `NotificationService` with `ToastStrategy` is fully implemented but no `<Toaster />` mounts anywhere. CustomEvent has no listener.

**Trade-offs accepted:**
- One new component, ~15 lines.

**Doc reference:** [`EAOS-frontend-data-layer.md` §8.3](./EAOS-frontend-data-layer.md), [`EAOS-implementation-roadmap.md` §4 task 0.7](./EAOS-implementation-roadmap.md)

---

### D-010 · Mission Feed = tenant default + per-user opt-in

**Decision:** `GET /mission-feed` returns tenant-level prioritization by default. Per-user opt-in (showing watched + owned entities first) is enabled per-user via `PATCH /mission-feed/preferences`. Compute cost is bounded: personalization is a re-rank of the same tenant-level candidates.

**Rationale:**
- Per-user personalization is more useful but expensive (compute per dashboard load).
- Re-ranking the existing tenant candidates is cheap.

**Trade-offs accepted:**
- Opt-in means most users start with the same view as their tenant peers. Discoverability of the opt-in toggle is a UX concern (P2).

**Doc reference:** [`EAOS-implementation-plan.md` §14.2 Q1](./EAOS-implementation-plan.md), [`EAOS-NUWS-principles.md` §5.4](./EAOS-NUWS-principles.md), [`EAOS-implementation-roadmap.md` §9 task 5.11](./EAOS-implementation-roadmap.md)

---

### D-009 · Mini-Graph = scrollable list v1 (graph layout is P2)

**Decision:** Mini-Graph renders as a scrollable list of typed relationships, grouped by relationship type (parent / children / operates-in / collaborates-with / assigned-to). No graph layout library (dagre/elk) in v1.

**Rationale:**
- For entities with 100+ relationships, a graph layout is slow and visually noisy.
- The list form scales better and matches the entity-by-entity navigation model.

**Trade-offs accepted:**
- Visual graph is P2. Revisit if user research shows demand.

**Doc reference:** [`EAOS-implementation-plan.md` §14.2 Q2](./EAOS-implementation-plan.md), [`EAOS-NUWS-principles.md` §5.6](./EAOS-NUWS-principles.md)

---

### D-008 · Compare View = read-only v1

**Decision:** `/compare?ids=...` supports up to 4 entities, side-by-side, with differences highlighted. No bulk-edit operations ("apply this KPI definition to all selected"). Read-only.

**Rationale:**
- Bulk-edit requires merge/conflict UX that's hard to get right. Defer to P2.

**Trade-offs accepted:**
- v1 supports deep-linking and sharing; that's the immediate value.

**Doc reference:** [`EAOS-implementation-plan.md` §14.2 Q3](./EAOS-implementation-plan.md), [`EAOS-NUWS-principles.md` §5.7](./EAOS-NUWS-principles.md)

---

### D-007 · Density = global per-user + Operations override

**Decision:** Users choose Compact / Default / Comfortable globally. Operations workspaces may override (finance users can lock Operations to Compact regardless of global setting). All other panels honor the global preference.

**Rationale:**
- One-size-fits-all density frustrates finance users (who want Compact) and executives (who want Comfortable on dashboards).
- Operations is the panel where density matters most for productivity.

**Trade-offs accepted:**
- Per-workspace override adds complexity to `DensityProvider`. Reasonable scope.

**Doc reference:** [`EAOS-implementation-plan.md` §14.2 Q4](./EAOS-implementation-plan.md), [`EAOS-NUWS-principles.md` §7.5.4](./EAOS-NUWS-principles.md), [`EAOS-frontend-data-layer.md` §1](./EAOS-frontend-data-layer.md)

---

### D-006 · Font = Inter only (v1)

**Decision:** No tenant-uploaded fonts in v1. Inter (UI) + JetBrains Mono (code) only.

**Rationale:**
- Font loading performance: tenant-uploaded fonts can be 100KB+ and require FOUT/FOIT handling.
- i18n text-width variability.
- Predictable design system.

**Trade-offs accepted:**
- Tenants who want brand-specific fonts must request Enterprise custom branding (P2).

**Doc reference:** [`EAOS-implementation-plan.md` §14.2 Q5](./EAOS-implementation-plan.md), [`EAOS-NUWS-principles.md` §7.5.1](./EAOS-NUWS-principles.md)

---

### D-005 · AI Roster = dedicated `/ai-roster` route (not `/agents`)

**Decision:** New route `/ai-roster` with grid view, group-by-template, status filters, lifecycle controls, cost attribution. Distinct from `/agents` (entity list filtered to AI_EMPLOYEE type).

**Rationale:**
- "Unlimited AI Employees" pricing promise needs a dedicated management surface.
- `/agents` is insufficient: lacks group-by-template, status filtering, lifecycle controls, cost attribution.
- The "Unlimited AI Employees" promise is only credible if users can browse/distinguish/manage.

**Trade-offs accepted:**
- New route + UI in EAOS-1. Implementation cost is 1-2 weeks.

**Doc reference:** [`EAOS-pricing-plans.md` §0a](./EAOS-pricing-plans.md), [`EAOS-implementation-plan.md` §14.2 Q6](./EAOS-implementation-plan.md)

---

### D-004 · Citation chips = slide-over + "Open full page" link

**Decision:** Click a citation chip → opens the source `KnowledgeEntry` in a slide-over (right-side drawer, 480px wide). Slide-over header has an "Open full page" link to `/knowledge/{entryId}` in a new tab.

**Rationale:**
- Slide-over preserves workspace context.
- Full-page is one click away for users who want to read deeply.
- Avoids modal nesting.

**Doc reference:** [`EAOS-implementation-plan.md` §14.2 Q8](./EAOS-implementation-plan.md), [`EAOS-NUWS-principles.md` §2.3](./EAOS-NUWS-principles.md)

---

### D-003 · AI Action (registry) vs Ask AI (UI)

**Decision:** "AI Action" is the **registry/developer term** (entry in `AIActionRegistry`). "Ask AI" is the **user-facing UI label**. Three coordinated surfaces: Intelligence panel, Command Palette Ask-AI mode (`⌘K` then `?`), Automation panel quick-fire row, plus global top-bar button.

**Rationale:**
- Two concepts previously conflated: AI Actions (work operations) and Quick Actions (buttons).
- "Ask AI" is the verb; "AI Action" is the noun. Both have their place.

**Trade-offs accepted:**
- Documentation needs to be precise about which term to use where.

**Doc reference:** [`EAOS-implementation-plan.md` §0 Glossary, §4.5](./EAOS-implementation-plan.md), [`EAOS-NUWS-principles.md` §2.6, §5.5](./EAOS-NUWS-principles.md)

---

### D-002 · Capability count = 10 panels + 1 modal

**Decision:** Resolved the v2.4 (11 capabilities) vs NUWS v1.0 (9 capabilities) contradiction: **10 capability panels + 1 Administration modal**. Lifecycle promoted from buried-in-Admin to first-class CORE panel #10. Administration demoted to gear-icon modal (already implied by NUWS v1.0).

**Rationale:**
- The state machine is too important to hide.
- 10 panels is a clean number (one row of 5 in compact mode).
- The modal pattern for Admin is well-established (Linear, Notion, etc.).

**Trade-offs accepted:**
- Breaks the v2.4 11-capability mental model. Communicate in changelog.
- The EAOS-implementation-plan v2.4 → v2.5 transition is a semantic change for anyone tracking capability count.

**Doc reference:** [`EAOS-implementation-plan.md` §1.2, §0a changelog](./EAOS-implementation-plan.md), [`EAOS-NUWS-principles.md` §2](./EAOS-NUWS-principles.md)

---

### D-001 · EAOS workspace is "container, not page" (philosophy)

**Decision:** A workspace is the 10-capability-panel contract for any entity. Not a page. Not a layout. The UI is one interpretation of the contract; the contract is what persists.

**Rationale:**
- UIs change every 2-3 years. The data model outlasts them.
- A "container not page" framing forces the data model to be complete enough to render any future UI.

**Trade-offs accepted:**
- More upfront work to define capabilities (vs. ad-hoc page design).
- Slower to ship early; faster to evolve later.

**Doc reference:** [`EAOS-implementation-plan.md` §0b, §1.1](./EAOS-implementation-plan.md), [`EAOS-NUWS-principles.md` §0](./EAOS-NUWS-principles.md)

---

**End of decisions log.**
