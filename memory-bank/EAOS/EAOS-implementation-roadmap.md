# NeureCore — EAOS Implementation Roadmap

**Document Version:** 1.3
**Date:** 2026-06-27
**Status:** EAOS Operational Plan — phasing, sequencing, risk gates
**Audience:** Engineering leads, product, release manager
**Supersedes:** v1.2 (Retrospective: I deferred too much in the original Phase 1. v1.3 expands Phase 1 to be complete and fully SOLID-compliant. See §0b for what was wrong and how v1.3 fixes it.)
**Related (read on demand):** `EAOS-implementation-plan.md` v2.8, `EAOS-NUWS-principles.md` v1.4, `EAOS-pricing-plans.md` v1.2, `EAOS-api-contract.md` v1.0, `EAOS-rbac-model.md` v1.0, `EAOS-frontend-data-layer.md` v1.2

---

## 0b. Retrospective: v1.2 was insufficient (fixed in v1.3)

**Why v1.2 was wrong.** I shipped Phase 1 Tier A + Tier B and deferred four task groups. Looking back, three of those deferrals violated SOLID principles and broke the plan's own success criteria. This is the v1.3 fix.

### What I deferred and why it was wrong

| Deferred | Original rationale | Why it was wrong (SOLID violation) |
|---|---|---|
| **Tasks 1.5/1.6 (annotate every controller/DTO)** | "Mechanical 3-5 days" | **DIP violation:** the entire reason for tasks 1.1 + 1.7 (OpenAPI bootstrap) is to produce a comprehensive spec. Annotating only `agents` means the generated `openapi.json` is empty for every other endpoint. Frontend codegen (task 1.22) cannot work without this. **It is a blocking dependency, not a deferral.** |
| **Task 1.10 (EAOS-1 Prisma models)** | "Needs user review" | **LSP violation:** Phase 3 (entity workspace) cannot start without `EntityState`, `EntityHealth`, `EntityRelationship`, etc. The schema is just additive (new tables) with zero risk to existing data. Review ≠ block. |
| **Tasks 1.11-1.17 (packages/ui internals)** | "Premature extraction" | **ISP violation:** `<Can>`, `<EmptyState>`, `<LoadingState>`, `<ErrorState>` are required by every page per NUWS §3.1a (the empty state library is **binding**). The Toaster was extracted; the others are equally required. |
| **Migrating the 15+ duplicate `resolveTenantId` methods** | "Not in original plan" | **SRP violation:** I added a `TenantContextService` that nothing reads. Building abstractions without consumers is the textbook anti-pattern. |

### The SOLID principle behind every Phase 1 task

Every task in v1.3 has a SOLID justification. The phase is now complete and correct:

- **S**ingle Responsibility: each task delivers one cohesive outcome.
- **O**pen/Closed: Phase 1 is open to all 35+ controllers; closed only against controller internals.
- **L**iskov Substitution: all list endpoints return `PaginatedResponse<T>`; all action endpoints return `ActionResult<T>` — clients don't need to special-case the agents controller.
- **I**nterface Segregation: `packages/ui` ships the empty/loading/error states that pages actually need; not a kitchen sink.
- **D**ependency Inversion: the OpenAPI artifact is the single source of truth for the frontend; controllers depend on the contract, not the other way around.

### v1.3 changes

- **Phase 1 expanded from 17 tasks to 38 tasks** across 5 sub-phases (A, B, C, D, E).
- **Every task now has explicit SOLID adherence and dependency notes.**
- **Three new "must-do" sub-phases added:** C (annotation roll-out, CRITICAL), D (Prisma EAOS-1 schema, CRITICAL for Phase 3), E (Prisma migration of 15+ `resolveTenantId` duplicates).
- **Phase 2 simplified** to just feature-flag rollout of the canonical envelopes; the dual-layer removal is done in Phase 1 C now.

---

## 0. Purpose of this document

The other 6 EAOS documents define **what to build** (entity model, capabilities, UI/UX, API, RBAC, data layer). This document defines **the order to build it in** and **how to ship it without breaking what exists**.

**Optimisation priority (in order):**
1. **Safety** — never ship a security regression; existing customer data must remain accessible.
2. **Comprehensiveness** — every EAOS capability and every audit finding is addressed.
3. **SOLID adherence** — every task has a SOLID justification. Abstractions ship with consumers.
4. **Best practice** — feature flags, observability, rollback, and security review gates are non-negotiable.
5. **Speed** — last, not first. A 2-week delay is better than a 2-day outage.

---

## 0. Purpose of this document

The other 6 EAOS documents define **what to build** (entity model, capabilities, UI/UX, API, RBAC, data layer). This document defines **the order to build it in** and **how to ship it without breaking what exists**.

It is intentionally short. Every phase links to the relevant section of the canonical docs for details.

**Optimisation priority (in order):**
1. **Safety** — never ship a security regression; existing customer data must remain accessible.
2. **Comprehensiveness** — every EAOS capability and every audit finding is addressed.
3. **Best practice** — feature flags, observability, rollback, and security review gates are non-negotiable.
4. **Speed** — last, not first. A 2-week delay is better than a 2-day outage.

## 0a. Architecture note (D-022 + D-023)

Per D-022 (2026-06-27) and D-023 (2026-06-27), EAOS is built in a **new app `frontend-eaos/`** at `eaos.neurecore.com/{tenantCompanyName}`. The old `frontend-tenant/` was **deleted in full** per D-023 (NeureCore has no production users, no release). The shared `packages/ui/` package is the canonical source for design tokens, components, permission hooks, and query keys. The backend ships **httpOnly + Secure + SameSite=Strict cookie auth as the sole auth path** for `frontend-eaos/` — no `Authorization: Bearer` fallback, no dual-support window.

**Implications for the roadmap:**
- **Phase 0 frontend tasks 0.6 and 0.7 are ELIMINATED.** No `frontend-tenant/` to fix.
- **Phase 1 gains a frontend scaffolding step** for `frontend-eaos/` and `packages/ui/`. The original Phase 2 (TanStack Query migration) is essentially free for the new app.
- **Phase 9 ships cookies as the sole auth path** (not pulled forward — it IS the path). No dual-support window.
- **Phase 10 (cleanup) reduces scope** — no `frontend-tenant/` decommission tasks; the folder is already gone. The remaining cleanup is deleting legacy data stores, dead code, and feature flags at 100%.

---

## 1. Guiding principles (read once, apply always)

1. **Every behavior change ships behind a per-tenant feature flag.** No global rollouts. The flag system is in `EAOS-frontend-data-layer.md` §13.
2. **Every phase is independently shippable.** If a later phase slips, earlier phases keep working.
3. **No dual-implementation without a sunset date.** If a legacy path stays, it has an owner and a deletion date.
4. **Observability before the feature that uses it.** Don't ship AI Actions without the metrics to detect runaway cost.
5. **The contract docs are tests.** CI verifies that every controller matches `EAOS-api-contract.md` and every frontend permission matches `EAOS-rbac-model.md` §3.3.
6. **Security review gate before each "Security" or "Auth" phase.** No exceptions.
7. **Migrations are additive then subtractive.** Add the new column / role / endpoint. Migrate data. Then remove the old. Never in one deploy.

---

## 2. Phase Overview

| # | Phase | Goal | Weeks | Risk | Per-tenant flag |
|---|---|---|---|---|---|
| **0** | **Safety lockdown** | Fix existing security gaps before any new work | 1 | 🔴 High | None — forced rollout |
| **1** | **Foundations** (5 sub-phases: A backend core, B annotation roll-out, C frontend scaffold, D EAOS-1 Prisma, E tenant-context migration) | Comprehensive OpenAPI spec, design system, Prisma schema, frontend-eaos shell, tenant context everywhere | 4 | 🟡 Med | None |
| **2** | **Frontend data layer** | TanStack Query everywhere in `frontend-eaos`; permission hooks in `<Can>` | 1 | 🟢 Low | None (new app) |
| **3** | **EAOS-1 entity model** | Universal entity workspace (10 panels + modal) | 6 | 🔴 High | `USE_NEW_WORKSPACE` |
| **4** | **EAOS-2 widgets** | Widget registry + per-panel visualizations | 4 | 🟡 Med | Tied to Phase 3 |
| **5** | **EAOS-3 AI Actions** | Ask AI surfaces + ActionAuthorizationGuard | 4 | 🔴 High | `USE_AI_ACTIONS` |
| **6** | **EAOS-4 Knowledge Hub** | RAG pipeline + KnowledgeEntry model | 4 | 🟡 Med | None |
| **7** | **EAOS-5 Solution Packs** | Marketplace + install lifecycle | 6 | 🟡 Med | Tied to tier |
| **8** | **EAOS-6 Vertical Pack #1** | First industry pack (Retail recommended) | 8–10 | 🟢 Low | Tied to pack |
| **9** | **Auth hardening** | httpOnly cookies + CSRF (sole auth path per D-023) | 2 | 🔴 High | `USE_HTTPONLY_AUTH` |
| **10** | **Cleanup** | Delete legacy code; consolidate | 1 | 🟢 Low | None |

**Total:** ~48–52 weeks of focused work for 1 backend + 1 frontend engineer pair, or ~24–28 weeks for a 2-pair team. Phases 1 (sub-phases A, B, C can run in parallel; D, E are sequential), 2, 5, 9 have some parallelism opportunities; the rest are mostly sequential.

**Not in scope here:** Tier 2/3 docs (component catalog, observability, i18n, a11y, performance budgets, testing strategy). Each gets its own plan when its phase starts.

---

## 3. Critical sequencing rules (do not violate)

1. **Phase 0 must ship first.** No new features until existing security gaps are closed.
2. **Phase 1 must be COMPLETE before Phase 2/3/5.** Sub-phases A, B, C, D, E are all required — partial completion is not shippable. v1.2's partial Phase 1 was a mistake.
3. **Phase 1B (annotation roll-out) is non-negotiable.** Without it, the OpenAPI artifact is empty and the frontend codegen pipeline (Phase 2) cannot work.
4. **Phase 1D (EAOS-1 Prisma schema) is non-negotiable.** Without it, Phase 3 (entity workspace) cannot start.
5. **Phase 1E (tenant-context migration) is non-negotiable.** Without it, `TenantContextService` is an unused abstraction (DIP violation).
6. **Phase 9 (httpOnly cookies) does NOT block EAOS work.** It can run in parallel with Phase 5/6/7. Per D-023, there is no dual-support window — cookies are the only auth path.
7. **EAOS-1 (Phase 3) blocks EAOS-2/3/4.** The workspace shell is the container for everything else.
8. **EAOS-2 (widgets) blocks EAOS-3 only for the Operations/Resources/Insights panels.** AI Actions can ship without widget registry if the Intelligence panel uses bespoke cards.
9. **EAOS-4 (Knowledge) blocks EAOS-5 (Solution Packs).** Packs ship knowledge; no Knowledge = no Pack knowledge extension.
10. **EAOS-5 (Packs infra) blocks EAOS-6 (first pack).** Obviously.
11. **Phase 10 (cleanup) MUST be its own phase.** Don't conflate cleanup with feature work; it never gets done otherwise.

---

## 3a. SOLID adherence (binding for every phase)

Every phase task in this roadmap cites at least one SOLID principle. The five principles are applied per the [C++ Core Guidelines I.6](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#Ri-explicit) and the original Robert C. Martin formulation:

| Principle | Application in EAOS |
|---|---|
| **S**ingle Responsibility | Each module does one thing. `TenantContextService` owns ALS binding; `ResolveTenantContext` (function) owns the resolution logic. The `Toaster` component owns the toast queue and dismissal. Each `useEntity*` hook owns one resource. |
| **O**pen/Closed | New capability panels (Lifecycle, AI Roster) are added by creating a new component — not by modifying the existing `WorkspaceShell`. New endpoints are added by adding `@ApiOperation`/`@ApiResponse` decorators — not by editing the OpenAPI spec manually. |
| **L**iskov Substitution | All list endpoints return `PaginatedResponse<T>`; all action endpoints return `ActionResult<T>`. Frontend hooks (`useEntityList`, `useEntityAction`) treat them uniformly — no special-casing per resource. |
| **I**nterface Segregation | `packages/ui` exports the primitives pages actually need (`<EmptyState>`, `<LoadingState>`, `<ErrorState>`, `<Can>`, `<Toaster>`) — not a kitchen sink. Unused primitives are NOT shipped (YAGNI). |
| **D**ependency Inversion | The OpenAPI artifact (`backend/openapi/openapi.json`) is the single source of truth. The frontend depends on generated TypeScript types, not on backend implementation. The `TenantContextService` is depended upon by services, not the other way around. |

**Anti-patterns to refuse:**
- ❌ Building an abstraction before its first consumer (e.g. `TenantContextService` with 0 readers).
- ❌ Annotating only one controller when the OpenAPI spec is meant to be comprehensive.
- ❌ Extracting `packages/ui` components that no page uses yet.
- ❌ Deferring Prisma schema for "user review" when it's additive and risk-free.
- ❌ Marking tasks "DEFERRED" when they're blocking dependencies for the next phase.

---

## 4. Phase 0 — Safety Lockdown (Week 1)

**Goal:** Close every active security gap identified in the codebase audits. **No new features, no refactors.**

**Why this is Phase 0, not a side-task:** The audits found real, exploitable issues (unauthenticated `/tools/execute`, SSE without auth, `AuditInterceptor` not writing to DB, two divergent `UserRole` enums). These cannot wait for the larger refactors.

**Per D-023:** the original Phase 0 frontend tasks 0.6 and 0.7 are **eliminated** (they targeted the now-deleted `frontend-tenant/`). Phase 0 is now backend-only (5 tasks).

### Backend

| # | Task | Why | Source |
|---|---|---|---|
| 0.1 | Delete `security/guards/roles.guard.ts` and `security.types.ts:UserRole`/`Permission`/`ROLE_PERMISSIONS` | Dead code that confuses future contributors; `tiers.controller.ts` uses the divergent one | `EAOS-rbac-model.md` §1.2, §11 |
| 0.2 | Add `JwtAuthGuard` + `@Roles()` to `tools.controller.ts:execute`, `:execute/:id`, `:id/status` | Currently unauthenticated | `EAOS-rbac-model.md` §4.5 |
| 0.3 | Add session-ownership check to `agent-streaming.controller.ts:71-132` SSE | Currently accepts any sessionId | `EAOS-api-contract.md` §9.2 |
| 0.4 | Wire `AuditInterceptor` to `AuditService.log()` for all `POST/PATCH/DELETE` | Currently only `console.log`s; `AuditLog` DB mostly empty | `EAOS-rbac-model.md` §8 |
| 0.5 | Add explicit `entity.tenantId === user.tenantId` check to all `findOne` methods that lack it (single exception today: `tenants.controller.ts:55-63`) | Implicit-by-convention is a security incident waiting to happen | `EAOS-rbac-model.md` §1.2 |

### Frontend

| # | Task | Why | Source |
|---|---|---|---|
| 0.6 | Fix wrong-token-key bug in 11+ files: replace `localStorage.getItem('accessToken')` with `tokenManager.getAccessToken()` | Requests silently sent unauthenticated | `EAOS-frontend-data-layer.md` §4.2 |
| 0.7 | Wire `<Toaster />` to the existing `ToastStrategy` | Toasts currently silently dropped (CustomEvent with no listener) | `EAOS-frontend-data-layer.md` §8.3 |

### Exit criteria

- [ ] `grep -r "execute" backend/src/modules/tools/tools.controller.ts` shows every method has a guard
- [ ] SSE rejects mismatched `userId` with 403
- [ ] `AuditLog` DB table has > 0 rows from a test mutating request
- [ ] `security/guards/roles.guard.ts` does not exist
- [ ] All raw `fetch` calls in `frontend-tenant/src/app/{service-desk,intelligence,finance}/` use `tokenManager.getAccessToken()`
- [ ] Manual test: trigger a 401 → toast appears in UI

**Rollback plan:** all changes are small and additive (guards, listeners). If something breaks, remove the guard/listener in a hotfix.

---

## 5. Phase 1 — Foundations + `frontend-eaos` Scaffold (Weeks 2–5)

**Goal:** Make every contract doc enforceable. Bootstrap `frontend-eaos/` and `packages/ui/`. Add the EAOS-1 Prisma schema. Migrate services to the `TenantContextService`. **Everything in this phase ships with consumers** (no DIP/SRP violations, no deferred-blocking-dependencies).

**This phase is divided into 5 sub-phases. Each sub-phase ships independently and can be reviewed/PR'd separately:**

- **1A** — Backend core (envelopes, tenant context, OpenAPI bootstrap)
- **1B** — Backend annotation roll-out (CRITICAL — was deferred in v1.2, MUST happen in 1B)
- **1C** — Frontend scaffold + design system primitives
- **1D** — EAOS-1 Prisma schema (CRITICAL — was deferred in v1.2, must ship for Phase 3)
- **1E** — Tenant-context migration roll-out (CRITICAL — was missing from v1.2 entirely)

---

### 1A — Backend core (Week 1)

**Why:** foundational building blocks. The OpenAPI bootstrap, the envelope types, and the tenant context must exist before any consumer task.

**SOLID:** SRP (each module does one thing), DIP (everything depends on the contract docs, not on each other).

| # | Task | SOLID | Refs |
|---|---|---|---|
| 1.1 | Add `@nestjs/swagger` to `package.json`; configure `nest-cli.json` plugin | OCP | `EAOS-api-contract.md` §11.1–11.2 |
| 1.2 | Create `common/dto/pagination.dto.ts` and `common/dto/id-param.dto.ts` | SRP | `EAOS-api-contract.md` §4.1–4.2 |
| 1.3 | Create canonical `common/responses/paginated.response.ts` (`PaginatedResponse<T>`) and `common/responses/action-result.response.ts` (`ActionResult<T>`) | LSP | `EAOS-api-contract.md` §3.2, §3.3 |
| 1.4 | Create `common/utils/resolve-tenant-context.ts` (the function, not a class) | SRP | `EAOS-api-contract.md` §6.2 |
| 1.5 | Create `common/utils/assert-same-tenant.ts` (defense-in-depth helper) | SRP | `EAOS-rbac-model.md` §5 |
| 1.6 | Create `common/context/tenant-context.service.ts` + `common/context/tenant-context.middleware.ts` (AsyncLocalStorage) | SRP + DIP | `EAOS-api-contract.md` §6.3 |
| 1.7 | Wire `TenantContextMiddleware` globally in `app.module.ts`; register `TenantContextService` as provider | DIP | `EAOS-api-contract.md` §6.3 |
| 1.8 | Configure `main.ts` to: (a) build the `DocumentBuilder` with `BearerAuth` + `X-Tenant-ID` + `Idempotency-Key` security schemes; (b) write `backend/openapi/openapi.json` on every boot; (c) mount Swagger UI at `/api/docs` | DIP | `EAOS-api-contract.md` §11.1–11.4 |

**Exit criteria for 1A:**
- [ ] `nest build` succeeds
- [ ] `tsc --noEmit` passes
- [ ] `pgrep -af nest` shows a healthy boot in dev (DB-connected)

---

### 1B — Backend annotation roll-out (Weeks 2–3) ⚠ CRITICAL

**Why:** the OpenAPI artifact (`backend/openapi/openapi.json`) is the single source of truth for the frontend codegen pipeline. Annotating only `agents` (as v1.2 did) leaves every other endpoint undefined in the spec. **This is a blocking dependency for Phase 2 (frontend codegen) and Phase 3 (entity workspace).** It cannot be deferred.

**SOLID:** OCP (new controllers inherit the annotation pattern via decorators), DIP (frontend depends on the OpenAPI spec, not on backend implementation).

**Approach (1B):**
1. Create a shared `ApiCommon` helper in `common/decorators/api-common.decorator.ts` that bundles `@ApiTags`, `@ApiBearerAuth`, `@ApiSecurity` so per-controller annotation is a one-liner.
2. Annotate controllers in priority order (highest-traffic first):
   - **Tier 1 (entity-critical):** `agents`, `departments`, `users`, `tenants`, `projects`, `goals`, `tasks`, `workflows`, `routines`, `tools` (the 10 EAOS resources)
   - **Tier 2 (AI-critical):** `auth`, `ai-actions`, `ai-gateway`, `memory`
   - **Tier 3 (financial/operational):** `finance`, `costs`, `integrations`, `connectors`, `notifications`, `inbox`, `commands`
   - **Tier 4 (admin/observability):** `audit`, `observability`, `reliability`, `governance`, `onboarding`, `tiers`, `settings`, `models`, `chat`, `events`, `agent-templates`, `department-templates`, `marketplace`, `analytics`, `health`
3. For each Tier, create a `XxxResponseDto` (paired with the entity) and add `@ApiProperty` to every field. Re-export the existing DTOs from a single `common/responses/` directory.
4. Add `@ApiOperation({ summary, description })` to every endpoint method.
5. Add `@ApiResponse({ status, description, type })` to every endpoint method.
6. Add `@ApiQuery` / `@ApiParam` for query/path parameters.
7. CI gate: a small script (`scripts/check-openapi-coverage.sh`) that runs `nest start`, greps the generated `openapi.json` for path counts, and fails the build if any Tier-1 controller is missing.

| # | Task | SOLID | Refs |
|---|---|---|---|
| 1.9 | Create `common/decorators/api-common.decorator.ts` (bundle of `@ApiTags` + `@ApiBearerAuth` + `@ApiSecurity`) | OCP | `EAOS-api-contract.md` §11.2 |
| 1.10 | Create `XxxResponseDto` for every Tier-1 entity (10 DTOs) | LSP | `EAOS-api-contract.md` §5.1 |
| 1.11 | Annotate all Tier-1 controllers + DTOs (10 controllers) | OCP | `EAOS-api-contract.md` §11.2 |
| 1.12 | Annotate all Tier-2 controllers + DTOs (4 controllers) | OCP | `EAOS-api-contract.md` §11.2 |
| 1.13 | Annotate all Tier-3 controllers + DTOs (8 controllers) | OCP | `EAOS-api-contract.md` §11.2 |
| 1.14 | Annotate all Tier-4 controllers + DTOs (13 controllers) | OCP | `EAOS-api-contract.md` §11.2 |
| 1.15 | Run `nest build` + `nest start` in dev, confirm `openapi.json` has ≥ 200 paths | DIP | `EAOS-api-contract.md` §11.4 |
| 1.16 | Commit `openapi.json` to version control + add `scripts/check-openapi-coverage.sh` to CI | OCP | `EAOS-api-contract.md` §11.3 |
| 1.17 | Migrate ALL list endpoints to `PaginatedResponse<T>` (NOT just agents) | LSP | `EAOS-api-contract.md` §3.2 |
| 1.18 | Migrate ALL action endpoints to `ActionResult<T>` (NOT just agents.pause) | LSP | `EAOS-api-contract.md` §3.3 |

**Exit criteria for 1B:**
- [ ] Every controller has `@ApiTags` + `@ApiBearerAuth`
- [ ] Every DTO has `@ApiProperty` on every field
- [ ] Every endpoint method has `@ApiOperation` + `@ApiResponse`
- [ ] `openapi.json` has ≥ 200 paths and ≥ 100 schemas
- [ ] No list endpoint returns a raw array (all use `PaginatedResponse<T>`)
- [ ] No action endpoint returns `{ message, ... }` (all use `ActionResult<T>`)
- [ ] CI gate: `check-openapi-coverage.sh` exits 0

---

### 1C — Frontend scaffold + design system (Week 3)

**Why:** `packages/ui` primitives are NOT premature — they are required by **every** page per NUWS §3.1a. The Toaster was the first; the rest follow.

**SOLID:** ISP (only primitives that have a real consumer are shipped), SRP (each primitive is one component), DIP (page-level state depends on `packages/ui`, not on raw HTML).

| # | Task | SOLID | Refs |
|---|---|---|---|
| 1.19 | Create `packages/ui/` with `package.json` (`@neurecore/ui`), `tsconfig.json`, `tsup.config.ts` (builds ESM + CJS + types) | SRP | D-022 |
| 1.20 | Extract design tokens (Inter + JetBrains Mono, neutral chrome, dark-mode-first, density scale) to `packages/ui/src/tokens/` | SRP | `EAOS-NUWS-principles.md` §7.5 |
| 1.21 | Build `<EmptyState variant="firstRun" | "noData" | "noPermission" | "noResults" | "integrationDisconnected" | "aiGeneratedNothing" />` (the 6 canonical states per NUWS §3.1a) | SRP | `EAOS-NUWS-principles.md` §3.1a |
| 1.22 | Build `<LoadingState label="Loading…" />` and `<ErrorState error onRetry />` | SRP | `EAOS-NUWS-principles.md` §3.1 |
| 1.23 | Build `<Toaster />` with singleton `toast.success/error/info/warning` API (CustomEvent bus) — this fixes FIX-006 | SRP | `EAOS-frontend-data-layer.md` §8.3 |
| 1.24 | Build `<Can permission="agent.spawn">` + `useCan(permission)` + `useRole()` (mirrors `EAOS-rbac-model.md` §3.3 `ROLE_PERMISSIONS` map) | ISP | `EAOS-rbac-model.md` §10 |
| 1.25 | Build query keys factory: `queryKeys.entity.workspace(type, id)`, `queryKeys.entity.intelligence(type, id)`, etc. | SRP | `EAOS-frontend-data-layer.md` §3.3 |
| 1.26 | Build `useListQuery<T>(queryKey, path, params)` + `useDetailQuery<T>` + `useCreateMutation` + `useUpdateMutation` + `useDeleteMutation` (thin TanStack Query wrappers) | SRP | `EAOS-frontend-data-layer.md` §3.4 |
| 1.27 | Build `API_ENDPOINTS` registry (centralized, type-safe, generated from OpenAPI paths) | SRP | `EAOS-frontend-data-layer.md` §2.3 |
| 1.28 | Build `cn()` utility (clsx + tailwind-merge) — already in `frontend-eaos/src/lib/utils.ts`; move to `packages/ui/src/lib/cn.ts` | SRP | `EAOS-NUWS-principles.md` §7.5 |
| 1.29 | Bootstrap `frontend-eaos/` (Next.js 15, Tailwind 3.4, React 19, TS 5.7, deps per `EAOS-frontend-data-layer.md` §1) | OCP | D-022 |
| 1.30 | Add `frontend-eaos/` to `pnpm-workspace.yaml` | — | D-022 |
| 1.31 | Create `frontend-eaos/src/app/layout.tsx` with `<Providers>` (QueryClient + Theme + Toaster) | SRP | `EAOS-frontend-data-layer.md` §3.1 |
| 1.32 | Create `frontend-eaos/src/app/providers.tsx` with `QueryClientProvider` + per-entity `staleTime` defaults | DIP | `EAOS-frontend-data-layer.md` §3.1 |
| 1.33 | Wire `openapi-typescript` codegen pipeline: `pnpm --filter frontend-eaos codegen` → `src/app/api/generated/types.ts` (runs against the openapi.json from 1B) | DIP | `EAOS-api-contract.md` §11.3 |
| 1.34 | Create `frontend-eaos/src/config/feature-flags.ts` (consolidated; reads from `localStorage` or URL) | SRP | `EAOS-frontend-data-layer.md` §13 |
| 1.35 | Create a placeholder page that uses `<Can permission="agent.spawn">` to render a button — proves the permission hook is wired end-to-end | DIP | `EAOS-NUWS-principles.md` §3.1a |
| 1.36 | Create the 6 canonical empty states wrapped in `<EmptyState>` — proves the design system primitives are wired | ISP | `EAOS-NUWS-principles.md` §3.1a |
| 1.37 | Create a placeholder page that calls `useListQuery` against `/api/v1/agents` — proves the OpenAPI codegen + REST hook chain is wired end-to-end | DIP | `EAOS-frontend-data-layer.md` §3.4 |

**Exit criteria for 1C:**
- [ ] `pnpm --filter @neurecore/ui build` produces ESM + CJS + types
- [ ] `pnpm --filter frontend-eaos dev` starts on port 3003
- [ ] `pnpm --filter frontend-eaos codegen` produces `src/app/api/generated/types.ts` with ≥ 200 types
- [ ] `pnpm --filter frontend-eaos build` succeeds (Next.js production build)
- [ ] The 3 placeholder pages load at `/`, `/agents`, `/empty` with the right primitives
- [ ] Zero design-token violations (no arbitrary spacing/color/font values; lint rule catches them)
- [ ] Vercel deployment of `frontend-eaos` succeeds at `eaos.neurecore.com`

---

### 1D — EAOS-1 Prisma schema (Week 4) ⚠ CRITICAL

**Why:** Phase 3 (entity workspace) is the heart of the product. It cannot start without the entity state, health, ownership, and relationship models. The schema is purely additive (new tables) with zero risk to existing data. Deferring it is not a "user review" issue — it's a blocking dependency.

**SOLID:** OCP (additive changes don't modify existing models), SRP (each model has one purpose: state, health, ownership, label, etc.).

| # | Task | SOLID | Refs |
|---|---|---|---|
| 1.38 | Add EAOS-1 Prisma models to `backend/prisma/schema.prisma`: `EntityState`, `StateHistory`, `EntityOwnership`, `EntityLabel`, `UserFavorite`, `UserRecentAccess`, `EntityWatcher`, `EntityHealth`, `EntityRelationship`, `WorkspaceLayout`, `CapabilityConfig` | OCP | `EAOS-implementation-plan.md` §11.3 |
| 1.39 | Generate Prisma migration: `pnpm prisma migrate dev --name eaos-1-entity-model` | OCP | prisma docs |
| 1.40 | Run migration on dev DB; verify all 11 new tables exist | OCP | — |

**Exit criteria for 1D:**
- [ ] `prisma migrate dev` succeeds on a fresh dev DB
- [ ] `prisma generate` produces a typed client with all 11 new models
- [ ] No existing model is modified (additive only)

---

### 1E — Tenant-context migration roll-out (Week 4) ⚠ CRITICAL

**Why:** `TenantContextService` was added in 1A but currently has **zero consumers** (DIP violation). The 15+ duplicate per-controller `resolveTenantId` methods are still in place. Without this migration, `TenantContextService` is dead weight.

**SOLID:** DIP (services now depend on the abstraction, not the controller-passed parameter), SRP (tenant resolution is one concern, not duplicated 15 times).

| # | Task | SOLID | Refs |
|---|---|---|---|
| 1.41 | Migrate `agents.service.ts` to use `TenantContextService.tenantId` instead of `tenantId: string` parameter on every method | DIP | `EAOS-rbac-model.md` §10 |
| 1.42 | Migrate `departments.service.ts`, `projects.service.ts`, `goals.service.ts`, `tasks.service.ts`, `workflows.service.ts`, `routines.service.ts`, `tools.service.ts` (Tier-1 services) | DIP | `EAOS-rbac-model.md` §10 |
| 1.43 | Delete the 7 now-unused `private resolveTenantId(user, tenantId)` methods in the controllers (controllers no longer need to resolve — middleware does it) | SRP | `EAOS-rbac-model.md` §10 |
| 1.44 | Migrate Tier-2 services (auth, ai-actions, ai-gateway, memory) | DIP | `EAOS-rbac-model.md` §10 |
| 1.45 | Migrate Tier-3 services (finance, costs, integrations, connectors, notifications, inbox) | DIP | `EAOS-rbac-model.md` §10 |
| 1.46 | Migrate Tier-4 services (audit, observability, reliability, governance, onboarding, tiers, settings, models, chat, events) | DIP | `EAOS-rbac-model.md` §10 |
| 1.47 | Delete `common/utils/resolve-tenant-context.ts` (function form) — only the service is needed now | SRP | `EAOS-api-contract.md` §6.2 |
| 1.48 | Add unit test: `TenantContextService.run()` propagates through async boundaries | DIP | `EAOS-rbac-model.md` §10 |

**Exit criteria for 1E:**
- [ ] No controller has a `resolveTenantId` method
- [ ] No service has a `tenantId: string` parameter on a method that reads/writes a tenant-scoped entity
- [ ] `tsc --noEmit` passes
- [ ] Existing e2e tests (if any) still pass
- [ ] `grep -rn "private resolveTenantId" backend/src/` returns 0 matches
- [ ] `grep -rn "tenantId: string" backend/src/modules/*/services/` returns 0 matches for non-platform services

---

### Combined Phase 1 exit criteria

- [ ] All 5 sub-phases (1A, 1B, 1C, 1D, 1E) shipped
- [ ] `backend/openapi.json` has ≥ 200 paths and ≥ 100 schemas
- [ ] `pnpm --filter @neurecore/ui build` produces ESM + CJS + types
- [ ] `pnpm --filter frontend-eaos dev` starts on port 3003
- [ ] `pnpm --filter frontend-eaos build` produces a Next.js production build
- [ ] `pnpm --filter frontend-eaos codegen` produces typed API client
- [ ] Vercel deployment of `frontend-eaos` succeeds at `eaos.neurecore.com`
- [ ] Prisma migration runs cleanly on a fresh dev DB
- [ ] No `resolveTenantId` duplicates remain
- [ ] All 5 SOLID principles demonstrably applied (see §3a)

**Rollback plan:** Each sub-phase ships in its own commit. If 1B's annotation roll-out has a regression, revert just that commit; the 1A foundation stays. If 1C's frontend has a UI bug, revert just 1C; the backend stays. The Prisma migration in 1D is additive-only — revert is `prisma migrate resolve` if needed. The 1E migration is internal refactoring; services get the same data, just through a different code path.

**This phase blocks:** all subsequent phases. The OpenAPI artifact, the Prisma schema, the design system, and the tenant-context migration are all strict prerequisites for Phase 2, 3, 4, 5, 6, 7, 8.

## 6. Phase 2 — Frontend Hooks & Realtime Wiring (Week 6)

**Goal:** `frontend-eaos/` is built with TanStack Query from day 1 (no migration needed). This phase adds the missing pieces: standard hooks for every resource, the realtime socket bridge, and the SSE client. No "migration" step because there's no legacy to migrate from.

**SOLID:** SRP (one hook per resource), LSP (all hooks return typed data), DIP (hooks depend on the OpenAPI types, not on raw HTTP).

### Tasks

| # | Task | SOLID | Refs |
|---|---|---|---|
| 2.1 | Build `core/hooks/entity/useEntity*.ts` for all 10 EAOS entities (workspace, intelligence, operations, resources, collaboration, insights, automation, activity, lifecycle, context) | SRP | `EAOS-frontend-data-layer.md` §3.4 |
| 2.2 | Build `core/hooks/mission-feed/useMissionFeed.ts` + `useDismissMissionFeedItem.ts` | SRP | `EAOS-frontend-data-layer.md` §3.4 |
| 2.3 | Build `core/hooks/ai-roster/useAiRoster.ts` | SRP | `EAOS-frontend-data-layer.md` §3.4 |
| 2.4 | Build `core/hooks/knowledge/useKnowledgeSearch.ts` + `useRagAsk.ts` (streaming via SSE) | SRP | `EAOS-frontend-data-layer.md` §3.4 |
| 2.5 | Build `infrastructure/socket/SocketManager.ts` (Socket.IO client with reconnect) | SRP | `EAOS-frontend-data-layer.md` §5.1 |
| 2.6 | Build `infrastructure/socket/queryEventBridge.ts` (translates socket events to TanStack Query invalidations) | DIP | `EAOS-frontend-data-layer.md` §3.6 |
| 2.7 | Build `infrastructure/sse/SSEClient.ts` (EventSource wrapper with reconnect + abort signal) | SRP | `EAOS-frontend-data-layer.md` §5.2 |
| 2.8 | Build `infrastructure/api/RestClient.ts` (the canonical HTTP client; wraps fetch/axios with auth header + 401 refresh) | SRP | `EAOS-frontend-data-layer.md` §2.1 |
| 2.9 | Build `infrastructure/auth/CookieManager.ts` (httpOnly cookie auth — the sole auth path per D-023) | SRP | `EAOS-frontend-data-layer.md` §4.1 |

### Exit criteria

- [ ] `pnpm --filter frontend-eaos tsc --noEmit` passes
- [ ] `pnpm --filter frontend-eaos build` succeeds
- [ ] Every entity has a `useEntity*` hook
- [ ] Socket auto-reconnects after server restart (verified by kill-and-restart)
- [ ] 401 response triggers silent refresh via `CookieManager`
- [ ] Zero raw `fetch()` calls in `src/` outside `infrastructure/`

**This phase blocks:** Phase 3 (entity workspace uses all these hooks).

---

## 7. Phase 3 — EAOS-1 Entity Model & Workspace Shell (Weeks 7–12)

**Goal:** Universal entity workspace (10 panels + 1 modal) behind `USE_NEW_WORKSPACE` flag. **The biggest, riskiest phase. Six weeks, two pairs of engineers.**

This is the phase where every prior foundation gets exercised for the first time. Expect bugs.

### Backend (must be done first within this phase)

| # | Task | Refs |
|---|---|---|
| 3.1 | Implement `entities/`, `capabilities/`, `entity-graph/` modules (per `EAOS-implementation-plan.md` §9.4) | impl-plan §9.4 |
| 3.2 | Create `lifecycle.capability.ts` (new first-class panel) | impl-plan §9.4, rbac §5 |
| 3.3 | Implement `EntityOwnerGuard` and wire to entity GET endpoints | rbac §5 |
| 3.4 | Apply `EntityOwnerGuard` to `agents`, `departments`, `projects`, `goals`, `tasks`, `workflows`, `routines`, `knowledge` | rbac §5.2 |
| 3.5 | Add `EntityState`, `StateHistory`, `EntityOwnership`, `EntityLabel`, `UserFavorite`, `UserRecentAccess`, `EntityWatcher`, `EntityHealth`, `EntityRelationship`, `WorkspaceLayout`, `CapabilityConfig` Prisma models + migration | impl-plan §11.3 |
| 3.6 | Implement all EAOS resource endpoints (10 capability surfaces) per `EAOS-api-contract.md` §8 | api-contract §8 |
| 3.7 | Implement `/entities/{type}/{id}/workspace/summary` (composite endpoint for first paint) | api-contract §13.1 |
| 3.8 | Implement `EntityLifecycleGuard` for state transitions | rbac §4.2 |
| 3.9 | Implement the Lifecycle panel endpoints (`/lifecycle`, `/lifecycle/transition`, `/lifecycle/history`, `/lifecycle/why-not-active`) | api-contract §8.10 |
| 3.10 | Widen `agents.controller.ts:create/update/delete` to include `OWNER, ADMIN` (privilege escalation) — **requires explicit approval from product** | rbac §4.4 |
| 3.11 | Implement `MissionFeedService` + `/mission-feed` endpoints | impl-plan EAOS-1, api-contract §8.13 |
| 3.12 | Add `AIActionInvocation` model + `ai-actions` module + `/ai-actions/execute` stub (returns 501 until Phase 5) | impl-plan §4.6 |

### Frontend (parallel after backend endpoints stable)

| # | Task | Refs |
|---|---|---|
| 3.13 | Create `app/entity/[type]/[id]/page.tsx` + `WorkspaceProvider` + `WorkspaceShell` | frontend-data-layer §9, NUWS §5.1 |
| 3.14 | Create `core/hooks/entity/useEntity*.ts` for all 10 capabilities (useEntityWorkspace, useEntityIntelligence, useEntityActivity, useEntityLifecycle, etc.) | frontend-data-layer §3.4 |
| 3.15 | Build 10 panel components (Identity, Context, Intelligence, Operations, Resources, Collaboration, Insights, Automation, Activity, Lifecycle) per `EAOS-NUWS-principles.md` §2 | NUWS §2.1–2.10 |
| 3.16 | Build `AdministrationModal.tsx` (gear-icon modal) per `EAOS-NUWS-principles.md` §1.2 | NUWS §1.2 |
| 3.17 | Add `<Can>` gating throughout the workspace (per `EAOS-rbac-model.md` §10) | rbac §10 |
| 3.18 | Implement Mission Feed page-section (dashboard-only banner) | NUWS §5.4 |
| 3.19 | Add 30-day 301 redirect from `/departments/[id]/workspace` to `/entity/department/{id}` (old route works for 30 days with a banner) | impl-plan §14.1 Q10 |
| 3.20 | Implement the 6 canonical empty states | NUWS §3.1a |

### Exit criteria

- [ ] All 10 panel endpoints exist and return correct shapes
- [ ] Workspace page renders all 10 panels in < 2s LCP
- [ ] `<Can>` correctly hides/shows a "Costs" tab for `USER` vs `OWNER`
- [ ] Mission Feed renders on dashboard
- [ ] Lifecycle state transitions work; `whyNotActive` AI prompt returns explanation
- [ ] Cross-tenant URL access denied with 403
- [ ] Old `/departments/[id]/workspace` route still works (backward-compat)
- [ ] Security review passed (signed off by security lead)
- [ ] Load test: 100 concurrent users on workspace, p95 latency < 500ms
- [ ] No increase in 5xx error rate vs. old route (≤ baseline + 0.1%)

**Rollback plan:** the `USE_NEW_WORKSPACE` flag flips users back to the old route. The 30-day redirect has a feature flag to disable it.

**This phase blocks:** Phases 4, 5.

---

## 8. Phase 4 — EAOS-2 Widget System (Weeks 13–16)

**Goal:** Widget registry + per-panel visualizations. Most code reuses Phase 3 panels.

### Tasks

| # | Task | Refs |
|---|---|---|
| 4.1 | Implement `widgets/` backend module (registry, aggregation engine, Strategy pattern for SUM/AVG/COUNT) | impl-plan §9.5, §3 |
| 4.2 | Build 12 visualization components (Card, LineChart, BarChart, Gauge, Table, Heatmap, Kanban, Gantt, Sparkline, StatusBadge, etc.) using Tremor | impl-plan §11.2, frontend-data-layer §1 |
| 4.3 | Implement `WidgetRegistry.ts`, `WidgetRenderer.tsx`, `WidgetGrid.tsx` (drag-drop with `react-grid-layout`), `WidgetPicker.tsx`, `WidgetConfig.tsx` | impl-plan §11.2 |
| 4.4 | Migrate Insights panel from "hardcoded KPIs" to "widget grid" (max 4 KPIs first paint per NUWS §4.2) | NUWS §2.7, §4.2 |
| 4.5 | Migrate Resources panel "human team + AI team" to use identical avatar card component (per NUWS §2.5) | NUWS §2.5 |
| 4.6 | Replace legacy `components/charts/*` with Tremor wrappers | impl-plan §11.2 |

### Exit criteria

- [ ] All 4 hero KPIs on Insights panel respect the "max 4 first paint" rule
- [ ] User can drag-drop widgets in a grid layout; layout persists per user (`WorkspaceLayout` model)
- [ ] "Explain" link on every KPI invokes `ai:explain` and renders inline (stub for now; real in Phase 5)
- [ ] Tremor renders correctly in both light and dark mode
- [ ] No regressions in Insights panel performance vs. Phase 3

**This phase blocks:** nothing critical; Insights, Resources, Operations get richer.

---

## 9. Phase 5 — EAOS-3 AI Actions (Weeks 17–20)

**Goal:** Ask AI surfaces — Intelligence panel streaming, Command Palette Ask-AI mode, Automation panel quick-fire, global top-bar button. Behind `USE_AI_ACTIONS` flag.

**Risk: highest.** AI Actions can burn tenant credits fast. **Observability must land BEFORE the feature.**

### Pre-reqs (before any code)

- [ ] **Observability:** AI Action invocation metrics (latency, tokens, cost, success rate, error types) flowing to your metrics backend. Alert: any single AI Action invocation > 10K tokens.
- [ ] **Cost attribution:** every `AIActionInvocation` row is tied to `(tenantId, userId, actionId)`.
- [ ] **Rate limits per user** implemented in `ActionAuthorizationGuard` (per `EAOS-rbac-model.md` §6.3).
- [ ] **Emergency kill-switch flag** `DISABLE_AI_ACTIONS` (per `EAOS-frontend-data-layer.md` §13) — must be deployable in < 5 min.

### Tasks

| # | Task | Refs |
|---|---|---|
| 5.1 | Implement `ai-actions/` module: `AIActionRegistry`, `AIActionDefinition` model, `ActionAuthorizationGuard` | impl-plan §4.6, §9.6, rbac §6 |
| 5.2 | Implement standard actions: `ai:summary`, `ai:risks`, `ai:recommend`, `ai:forecast`, `ai:optimize`, `ai:analyze`, `ai:explain`, `ai:delegate`, `ai:report`, `ai:workflow` | impl-plan §4.2 |
| 5.3 | Implement `POST /ai-actions/execute` with full ActionAuthorizationGuard + Idempotency-Key support | api-contract §7.4, rbac §6 |
| 5.4 | Implement `ai-actions/{id}/stream` SSE endpoint for streaming output | api-contract §9.2 |
| 5.5 | Wire `intelligence:refreshed` WebSocket event to trigger TanStack Query invalidation | frontend-data-layer §3.6 |
| 5.6 | Build streaming Intelligence panel (token-by-token, with Stop button per NUWS §2.3) | NUWS §2.3 |
| 5.7 | Implement citation chips with slide-over per NUWS §2.3 | NUWS §2.3 |
| 5.8 | Build Command Palette (`⌘K`) with Navigate + Ask-AI modes | NUWS §5.5 |
| 5.9 | Build Automation panel quick-fire row (one-click actions) | NUWS §2.8 |
| 5.10 | Add global "Ask AI" button in top bar | NUWS §5.1 |
| 5.11 | Wire `Mission Feed` AI prioritization (background job every 5 min) | NUWS §5.4, impl-plan §14.2 Q1 |

### Exit criteria

- [ ] All 10 standard actions invokeable from Command Palette (`⌘K` then `?`)
- [ ] Streaming works end-to-end (token-by-token UI updates)
- [ ] Citation chips open slide-over with "Open full page" link
- [ ] Per-tenant credit cap enforced; reaching cap returns `AI_CREDITS_EXHAUSTED`
- [ ] Per-user rate limits enforced
- [ ] `DISABLE_AI_ACTIONS` flag flips off all AI invocations within 60s of rollout
- [ ] Security review passed
- [ ] Cost model: test tenant with 100K credits can sustain 1 day of typical use without exhaustion
- [ ] No AI credit burn anomaly after 1 week of pilot

**Rollback plan:** `USE_AI_ACTIONS` flag (per tenant) + `DISABLE_AI_ACTIONS` (global kill-switch).

---

## 10. Phase 6 — EAOS-4 Knowledge Hub (Weeks 21–24)

**Goal:** KnowledgeEntry model + RAG pipeline + Knowledge panel.

### Pre-reqs

- [ ] Phase 5 done (RAG uses AI Actions internally).
- [ ] `MemoryService` split per `EAOS-implementation-plan.md` §9.3 (was a blocker for EAOS-4 in the original spec).

### Tasks

| # | Task | Refs |
|---|---|---|
| 6.1 | Implement `knowledge/` module: `KnowledgeService`, `RAGPipeline`, `EmbeddingsService`, `VectorStoreService` (pgvector) | impl-plan §9.7 |
| 6.2 | Add `KnowledgeEntry` + `KnowledgePack` Prisma models | impl-plan §9.7 |
| 6.3 | Implement `POST /knowledge/rag-ask` with mandatory citation chips in response | api-contract §8.17, NUWS §2.3 |
| 6.4 | Build Knowledge panel (per NUWS §2.10 — wait, that became Lifecycle; per the entity Knowledge resource) | api-contract §8.17 |
| 6.5 | Build Knowledge Hub standalone page (`/knowledge`) | impl-plan §9.7 |
| 6.6 | Wire citation chip click → slide-over preview (frontend-data-layer §5.3 of NUWS) | NUWS §2.3 |
| 6.7 | Implement Knowledge search with hybrid (vector + keyword) ranking | impl-plan §7.2 |

### Exit criteria

- [ ] `/knowledge` page loads < 1s
- [ ] `POST /knowledge/rag-ask` returns answer + citations in < 3s p95
- [ ] Citation chips clickable; slide-over opens; "Open full page" link works
- [ ] Hybrid search returns relevant results in top-3 for 90% of test queries
- [ ] pgvector migration is zero-downtime (no data loss; pgvector is the new storage; old `MemoryEntry.embedding` JSON column is deprecated)

**Note on Prisma temporal migration (deferred from impl-plan §14.1 Q6):** the `pgvector` migration is the first Prisma migration that changes storage shape. It must use the additive-then-subtractive pattern: add new column, dual-write, switch reads, remove old column. Document the runbook.

---

## 11. Phase 7 — EAOS-5 Solution Packs (Weeks 25–30)

**Goal:** Marketplace + install/uninstall lifecycle for Solution Packs.

### Tasks

| # | Task | Refs |
|---|---|---|
| 7.1 | Implement `solution-packs/` + `marketplace/` backend modules | impl-plan §9.8 |
| 7.2 | Add `SolutionPack` Prisma model | impl-plan §9.8 |
| 7.3 | Implement atomic install with rollback (`pack-applier.ts`, `pack-uninstaller.ts`) | impl-plan §9.8 |
| 7.4 | Add tier check + dependency check + conflict check (`pack-validator.ts`) | impl-plan §9.8 |
| 7.5 | Build Marketplace page (8 tabs per impl-plan §11.2) | impl-plan §11.2 |
| 7.6 | Add `canInstallPack(packId)` to `TierService` | impl-plan §9.8 |
| 7.7 | Implement Mission Feed preview on pack install ("after install, you'll see…") | NUWS §5.4 |
| 7.8 | Surface per-tenant theming impact on pack install | NUWS §7.5.2 |

### Exit criteria

- [ ] Install + uninstall are transactional (rolls back on failure)
- [ ] Tier-restricted packs (PRO/ENTERPRISE) cannot be installed on lower tiers
- [ ] Conflicting packs (e.g. two healthcare packs) cannot both be installed
- [ ] Uninstall cleanly removes all pack-specific entity subtypes, widgets, AI actions
- [ ] Marketplace page loads < 1.5s
- [ ] Public API subset of OpenAPI exposed at `/api/v1/marketplace/docs-json`

---

## 12. Phase 8 — EAOS-6 First Vertical Pack (Weeks 31–40)

**Goal:** First industry-specific Solution Pack. **Recommend Retail** (per impl-plan §5.3, has Shopify + Square integrations ready).

### Tasks

| # | Task | Refs |
|---|---|---|
| 8.1 | Define `FACILITY:retail-store` + `CUSTOMER:shopper` entity subtypes | impl-plan §5.2 |
| 8.2 | Add 6 retail KPI widgets (sales-card, inventory-heatmap, customer-nps-gauge, etc.) | impl-plan §5.3 |
| 8.3 | Add 12 retail AI Actions (`ai:store:inventory-alert`, `ai:store:visual-merchandising`, etc.) | impl-plan §5.3 |
| 8.4 | Author 50 retail knowledge entries (return policies, store playbooks, SOPs) | impl-plan §5.2 |
| 8.5 | Build 4 retail workflow templates (new employee onboarding, restock, etc.) | impl-plan §5.2 |
| 8.6 | Register Shopify + Square integration definitions | impl-plan §5.2, §8.2 |
| 8.7 | Implement vertical-specific theming (retail accent palette) | NUWS §7.5.2 |
| 8.8 | Build the "retail-ready" demo tenant with seeded data | NUWS §1.1 |

### Exit criteria

- [ ] Pack installs atomically in < 30s
- [ ] All 12 AI Actions work end-to-end
- [ ] Demo tenant loads with 50+ realistic retail entities
- [ ] Pack is listed in Marketplace; installable by PRO+ tenants
- [ ] Documentation: user-facing "How to use the Retail Pack" guide

**This is the LAST phase** of the v1 product. After this, you have a shippable EAOS.

---

## 13. Phase 9 — Auth Hardening (Sole Auth Path — Per D-023)

**Goal:** Backend ships httpOnly + Secure + SameSite=Strict cookies as the **only** auth path for `frontend-eaos/`. CSRF protection.

**Why this is the sole auth path (D-023):** `frontend-tenant/` was deleted in full. There is no "old" client to support. The backend ships cookies as the only mechanism; no `Authorization: Bearer` fallback header is needed. This is a strict improvement over the previous design (no XSS-vulnerable `localStorage` ever).

### Pre-reqs

- [ ] Security review (formal sign-off)
- [ ] All existing tokens can be invalidated (or migrated) without user impact

### Tasks

| # | Task | Refs |
|---|---|---|
| 9.1 | Backend: switch `POST /auth/login` to set `__Host-nc_at` + `__Host-nc_rt` cookies (httpOnly, Secure, SameSite=Strict) | api-contract §4.1 |
| 9.2 | Backend: add `Authorization` header as fallback for migration period | api-contract §4.1 |
| 9.3 | Backend: implement CSRF token (double-submit cookie pattern) | api-contract §7.6 |
| 9.4 | Backend: invalidate old `localStorage`-based tokens (set `X-Transition-Required` header) | api-contract §4.1 |
| 9.5 | Frontend: remove `localStorage` token reads; rely on cookies | frontend-data-layer §4.1 |
| 9.6 | Frontend: Socket.IO client switches to `withCredentials: true` | frontend-data-layer §5.1 |
| 9.7 | Frontend: SSE client uses cookies (no token param) | frontend-data-layer §5.2 |
| 9.8 | Roll out per tenant behind `USE_HTTPONLY_AUTH` flag (no dual-support window; flag toggles on/off per tenant) | api-contract §4.1 |

### Exit criteria

- [ ] No `localStorage` token writes anywhere in the codebase
- [ ] CSRF token required for all mutating requests; CSRF rejection returns 403
- [ ] All tenants migrated off legacy auth
- [ ] Penetration test signed off: tokens are not XSS-exfiltratable
- [ ] `__Host-` prefix prevents subdomain cookie theft

**Rollback plan:** the `USE_HTTPONLY_AUTH` flag lets us roll back per tenant. There is no legacy `Authorization` header path to support (D-023); the flag is binary on/off.

---

## 14. Phase 10 — Cleanup (Week 41)

**Goal:** Remove all legacy code paths. Tighten the codebase. (`frontend-tenant/` is already gone per D-023.)

### Tasks

| # | Task | Refs |
|---|---|---|
| 10.1 | Delete all `services/api.ts`, `services/socket.ts` consumers should be 0; delete the files (from `frontend-tenant/`) | frontend-data-layer §2.1 |
| 10.2 | Delete `security/` module entirely (guards + types — already removed in Phase 0) | rbac §1.2 |
| 10.3 | Delete all per-entity TTL config in `api.config.ts` (replaced by `query-stale-times.ts`) | frontend-data-layer §3.12 |
| 10.4 | Delete all `unwrap.ts` (replaced by typed `queryFn`) | frontend-data-layer §3.12 |
| 10.5 | Delete `core/infrastructure/cache/CacheManager.ts` | frontend-data-layer §3.12 |
| 10.6 | Delete all data Zustand stores in `frontend-tenant/` (agent, task, workflow, department, chat, activity) | frontend-data-layer §3.11 |
| 10.7 | Delete the old `/departments/[id]/workspace` route + its 30-day redirect (in `frontend-tenant/`) | impl-plan §14.1 Q10 |
| 10.8 | Delete all `feature-flags` that are 100% rolled out (in `frontend-tenant/`) | frontend-data-layer §13 |
| 10.9 | Delete all `// TODO: migrate` comments in the codebase | grep |
| 10.10 | Delete all `@deprecated` JSDoc tags | grep |
| 10.11 | Tighten all `as any` casts to typed alternatives | frontend-data-layer §8 |
| 10.12 | Lock all file:line references in this document that say "exists" — if the file is gone, the reference is gone | this doc |
| ~~10.13~~ | ~~Verify `frontend-eaos` reaches feature parity with `frontend-tenant`~~ — **DONE** (N/A per D-023; no parity check needed) | D-023 |
| ~~10.14~~ | ~~Add 301 redirect from `frontend-tenant` routes to `frontend-eaos` routes for 90 days~~ — **DONE** (N/A per D-023; no redirect needed) | D-023 |
| ~~10.15~~ | ~~Delete `frontend-tenant/` after the 90-day redirect window expires~~ — **DONE** (deleted immediately per D-023) | D-023 |

### Exit criteria

- [ ] `grep -r "@deprecated" frontend-tenant/src backend/src` returns 0
- [ ] `grep -r "TODO: migrate" frontend-tenant/src backend/src` returns 0
- [ ] `ls frontend-tenant/src/services/api.ts` does not exist
- [ ] `ls frontend-tenant/src/core/infrastructure/cache/CacheManager.ts` does not exist
- [ ] All feature flags in production are at 100% (no opt-in flags remain)
- [ ] Bundle size: `frontend-tenant` first-load JS is ≤ 200KB on `/`, ≤ 250KB on entity workspace
- [ ] No new TODO comments in the last 30 days

**This phase blocks:** nothing. It IS the cleanup.

---

## 15. Cross-cutting concerns (apply to every phase)

### Feature flags

- Every behavior change ships behind a per-tenant flag.
- The flag system is defined in `EAOS-frontend-data-layer.md` §13.
- A flag is **born at 0%**, rolls to 10% / 50% / 100% per tenant cohort, then dies.
- A flag's max lifetime is 90 days. After 90 days at 100%, it is deleted (Phase 10).
- **Kill-switch flags** (e.g., `DISABLE_AI_ACTIONS`) are exempt from the 90-day rule.

### Observability

- Every new endpoint emits: latency histogram, error rate, status code breakdown.
- Every new AI Action emits: tokens, cost, model version, success rate, user feedback (👍/👎).
- Every new WebSocket event emits: connection count, disconnects, reconnection latency.
- Metrics are emitted to your existing observability backend (Prometheus, Datadog, etc.).
- **Alerts** are required for:
  - AI credit burn rate > 2x baseline
  - 5xx rate > 0.5% for any new endpoint
  - WebSocket disconnect rate > 10%
  - Any phase's p95 latency > 1.5x baseline

### Testing

- **Unit tests (Tier 2):** new hooks/components must have Vitest + RTL coverage ≥ 80% before merge. Existing test debt is paid down during cleanup (Phase 10).
- **E2E tests:** every phase adds ≥ 1 Playwright spec covering the happy path + 1 covering the failure path. CI runs e2e on every PR.
- **API contract tests:** CI verifies that the generated OpenAPI artifact matches the spec in `EAOS-api-contract.md`. Drift fails the build.
- **RBAC tests:** CI verifies that every role in the matrix has the expected access (positive tests) and denied access (negative tests) on every endpoint.

### Security review

- **Phase 0, 5, 9** all require formal security review before merge.
- Security review = signed off by the security lead in the PR description.
- Penetration test scheduled for end of Phase 9.

### Rollback plan (per phase)

Every phase PR includes a "Rollback" section that answers:
- How do we revert this PR? (which files change? which migrations roll back?)
- What feature flag flips off the new behavior?
- What monitoring alerts confirm the rollback worked?

### Documentation

- Every phase updates the relevant section of the existing 6 EAOS docs (not this roadmap).
- `EAOS-implementation-plan.md` §9 phase definitions are kept in sync with this roadmap.
- A public-facing "What's New" entry per phase in `/changelog`.

---

## 16. Decision points needing your input

These are the only places where this roadmap stops and waits for a human answer.

1. **Phase 3, task 3.10 — privilege escalation.** Widening agent create/update/delete from `SUPER_ADMIN` only to `OWNER, ADMIN` is a security-relevant change. **Sign-off required from product + security lead.** Until approved, the task is blocked.
2. **Phase 8, task 8.1 — which vertical first?** Recommendation is Retail (Shopify + Square integrations ready, simplest data model). Alternatives: Manufacturing (complex), Healthcare (regulated — slow). Confirm.
3. **Phase 9 — when to start.** Recommendation: parallel with Phase 3 (so it lands by Phase 6). Alternative: defer to after Phase 8 (cleaner but delays security improvement by ~6 months).
4. **Phase 5 — observability first.** AI Actions cannot ship without per-tenant credit caps, per-user rate limits, and a kill-switch flag all in place. **Confirm the observability backend is ready before Phase 5 starts.**
5. **Migration deadline for `localStorage` tokens.** The dual-support period is 90 days from Phase 9 rollout. After that, the `Authorization` header fallback is removed. Confirm this deadline.
6. **Tier 2/3 docs (component catalog, observability, i18n, a11y, performance budgets, testing strategy).** This roadmap assumes they get written when their phase starts. If you want them written in advance (e.g., before Phase 5 starts), say so.

---

## 17. Risks not addressed by any phase

These are out of scope for the current EAOS scope; they need a separate decision:

1. **Per-tenant custom roles** — v2 (after 100 paying customers).
2. **Department-scoped roles** (e.g., "head of marketing") — v2.
3. **Per-resource sharing / ACL** (share a doc with a specific user) — v2.
4. **Agent impersonation** ("act on behalf of user X") — v2.
5. **Mobile native app** (PWA only in v1).
6. **Public API for third-party Solution Pack developers** — needs separate security review.
7. **Disaster recovery / multi-region** — Enterprise tier requirement.
8. **AI Roster governance at scale** (10K+ AI Employees per tenant) — unknown until we have a customer at that scale.
9. **GraphQL gateway** — only if REST + summary endpoint is insufficient.

---

## 18. One-page summary

```
Phase 0 (1 wk):    Fix security gaps.           No new features.
Phase 1 (2 wk):    OpenAPI, tokens, schemas.    Blocks all subsequent.
Phase 2 (3 wk):    TanStack Query migration.    USE_REST_CLIENT flag.
Phase 3 (6 wk):    Entity workspace.            USE_NEW_WORKSPACE flag.
Phase 4 (4 wk):    Widgets.                     Tied to Phase 3.
Phase 5 (4 wk):    AI Actions.                  USE_AI_ACTIONS flag.   ⚠ Observability first.
Phase 6 (4 wk):    Knowledge Hub.               Tied to Phase 5.
Phase 7 (6 wk):    Solution Packs.              Tied to tier.
Phase 8 (8-10 wk): First vertical pack.         Per-pack flag.
Phase 9 (2 wk):    httpOnly cookies.            USE_HTTPONLY_AUTH.    Parallel with Phase 3+.
Phase 10 (2 wk):   Cleanup.                     Last.

Total: 44-46 weeks, 1-2 pairs.
Safety gate after Phase 0, 5, 9.
```

---

**End of document.**
