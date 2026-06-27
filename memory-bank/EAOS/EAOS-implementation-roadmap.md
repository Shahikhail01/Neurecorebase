# NeureCore — EAOS Implementation Roadmap

**Document Version:** 1.0
**Date:** 2026-06-27
**Status:** EAOS Operational Plan — phasing, sequencing, risk gates
**Audience:** Engineering leads, product, release manager
**Supersedes:** — (replaces the EAOS-1/2/3/4/5/6 phase definitions in `EAOS-implementation-plan.md` §9 with a risk-driven, safety-first ordering)
**Related (read on demand):** `EAOS-implementation-plan.md` v2.6, `EAOS-NUWS-principles.md` v1.2, `EAOS-pricing-plans.md` v1.2, `EAOS-api-contract.md` v1.0, `EAOS-rbac-model.md` v1.0, `EAOS-frontend-data-layer.md` v1.0

---

## 0. Purpose of this document

The other 6 EAOS documents define **what to build** (entity model, capabilities, UI/UX, API, RBAC, data layer). This document defines **the order to build it in** and **how to ship it without breaking what exists**.

It is intentionally short. Every phase links to the relevant section of the canonical docs for details.

**Optimisation priority (in order):**
1. **Safety** — never ship a security regression; existing customer data must remain accessible.
2. **Comprehensiveness** — every EAOS capability and every audit finding is addressed.
3. **Best practice** — feature flags, observability, rollback, and security review gates are non-negotiable.
4. **Speed** — last, not first. A 2-week delay is better than a 2-day outage.

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
| **1** | **Foundations** | OpenAPI, design tokens, shared schemas, contract tests | 2 | 🟢 Low | None |
| **2** | **Frontend data layer** | TanStack Query migration; retire dual layers | 3 | 🟡 Med | `USE_REST_CLIENT` |
| **3** | **EAOS-1 entity model** | Universal entity workspace (10 panels + modal) | 6 | 🔴 High | `USE_NEW_WORKSPACE` |
| **4** | **EAOS-2 widgets** | Widget registry + per-panel visualizations | 4 | 🟡 Med | Tied to Phase 3 |
| **5** | **EAOS-3 AI Actions** | Ask AI surfaces + ActionAuthorizationGuard | 4 | 🔴 High | `USE_AI_ACTIONS` |
| **6** | **EAOS-4 Knowledge Hub** | RAG pipeline + KnowledgeEntry model | 4 | 🟡 Med | None |
| **7** | **EAOS-5 Solution Packs** | Marketplace + install lifecycle | 6 | 🟡 Med | Tied to tier |
| **8** | **EAOS-6 Vertical Pack #1** | First industry pack (Retail recommended) | 8–10 | 🟢 Low | Tied to pack |
| **9** | **Auth hardening** | httpOnly cookies + CSRF | 2 | 🔴 High | `USE_HTTPONLY_AUTH` |
| **10** | **Cleanup** | Delete legacy code; consolidate | 2 | 🟢 Low | None |

**Total:** ~44–46 weeks of focused work for 1 backend + 1 frontend engineer pair, or ~22–24 weeks for a 2-pair team. Phases 1, 2, 3, 5, 9 have some parallelism opportunities; the rest are mostly sequential.

**Not in scope here:** Tier 2/3 docs (component catalog, observability, i18n, a11y, performance budgets, testing strategy). Each gets its own plan when its phase starts.

---

## 3. Critical sequencing rules (do not violate)

1. **Phase 0 must ship first.** No new features until existing security gaps are closed.
2. **Phase 1 must precede Phase 2/3/5.** OpenAPI types and shared schemas are required by everything else.
3. **Phase 9 (httpOnly cookies) does NOT block EAOS work.** It can run in parallel with Phase 5/6/7 because the dual-support period is 90 days.
4. **EAOS-1 (Phase 3) blocks EAOS-2/3/4.** The workspace shell is the container for everything else.
5. **EAOS-2 (widgets) blocks EAOS-3 only for the Operations/Resources/Insights panels.** AI Actions can ship without widget registry if the Intelligence panel uses bespoke cards.
6. **EAOS-4 (Knowledge) blocks EAOS-5 (Solution Packs).** Packs ship knowledge; no Knowledge = no Pack knowledge extension.
7. **EAOS-5 (Packs infra) blocks EAOS-6 (first pack).** Obviously.
8. **Phase 10 (cleanup) MUST be its own phase.** Don't conflate cleanup with feature work; it never gets done otherwise.

---

## 4. Phase 0 — Safety Lockdown (Week 1)

**Goal:** Close every active security gap identified in the codebase audits. **No new features, no refactors.**

**Why this is Phase 0, not a side-task:** The audits found real, exploitable issues (unauthenticated `/tools/execute`, SSE without auth, `AuditInterceptor` not writing to DB, two divergent `UserRole` enums). These cannot wait for the larger refactors.

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

## 5. Phase 1 — Foundations (Weeks 2–3)

**Goal:** Make the contract docs enforceable. Every subsequent phase depends on this.

### Backend

| # | Task | Refs |
|---|---|---|
| 1.1 | Add `@nestjs/swagger` to `package.json`; configure `nest-cli.json` plugin | `EAOS-api-contract.md` §11.1–11.2 |
| 1.2 | Create `common/dto/pagination.dto.ts` and `common/dto/id-param.dto.ts` | `EAOS-api-contract.md` §4.1–4.2 |
| 1.3 | Extract `common/utils/resolve-tenant-context.ts`; replace 15+ duplicates | `EAOS-api-contract.md` §6.2 |
| 1.4 | Create `common/context/tenant-context.service.ts` + `TenantContextMiddleware` (AsyncLocalStorage) | `EAOS-api-contract.md` §6.3 |
| 1.5 | Annotate EVERY existing controller with `@ApiTags`, `@ApiOperation`, `@ApiResponse`, `@ApiBearerAuth`, `@ApiSecurity` | `EAOS-api-contract.md` §11.2 |
| 1.6 | Annotate EVERY existing DTO with `@ApiProperty` / `@ApiPropertyOptional` | `EAOS-api-contract.md` §11.2 |
| 1.7 | Generate first OpenAPI artifact at `backend/openapi/openapi.json` | `EAOS-api-contract.md` §11.3 |
| 1.8 | Migrate ONE list endpoint to `PaginatedResponse<T>` (pick `agents`) as proof | `EAOS-api-contract.md` §3.2 |
| 1.9 | Migrate ONE action endpoint to `ActionResult<T>` (pick `agents.controller.ts:pause`) as proof | `EAOS-api-contract.md` §3.3 |
| 1.10 | Add `prisma/schema.prisma`: `EntityState`, `StateHistory`, `EntityOwnership`, `EntityLabel`, `UserFavorite`, `UserRecentAccess`, `EntityWatcher`, `EntityHealth`, `EntityRelationship`, `WorkspaceLayout`, `CapabilityConfig` (EAOS-1 schema, but add the Prisma migration now to avoid later deploy drama) | `EAOS-implementation-plan.md` §11.3 |

### Frontend

| # | Task | Refs |
|---|---|---|
| 1.11 | Add `@tanstack/react-query`, `@tanstack/react-query-devtools`, `react-hook-form`, `zod`, `@hookform/resolvers`, `openapi-typescript`, `@tanstack/react-query-persist-client` to `package.json` | `EAOS-frontend-data-layer.md` §1 |
| 1.12 | Create `app/providers.tsx` with `QueryClientProvider` + `<Toaster />` | `EAOS-frontend-data-layer.md` §3.1, §8.3 |
| 1.13 | Create `config/query-stale-times.ts` | `EAOS-frontend-data-layer.md` §3.2 |
| 1.14 | Create `shared/query-keys.ts` (factory pattern, empty stubs OK) | `EAOS-frontend-data-layer.md` §3.3 |
| 1.15 | Create `auth/permissions.ts` mirroring `EAOS-rbac-model.md` §3.3 | `EAOS-frontend-data-layer.md` §10.4 |
| 1.16 | Create `auth/useRole.ts`, `auth/useCan.ts`, `auth/Can.tsx` | `EAOS-frontend-data-layer.md` §10.1–10.3 |
| 1.17 | Create `config/feature-flags.ts` (single consolidated system) | `EAOS-frontend-data-layer.md` §13 |
| 1.18 | Set up `openapi-typescript` codegen; output to `app/api/generated/types.ts` | `EAOS-frontend-data-layer.md` §1, `EAOS-api-contract.md` §11.3 |
| 1.19 | Create `shared/components/states/LoadingState.tsx`, `ErrorState.tsx`, `EmptyState.tsx` (6 canonical) | `EAOS-frontend-data-layer.md` §8.4, `EAOS-NUWS-principles.md` §3.1a |
| 1.20 | Apply design tokens (NUWS §7.5) — Inter + JetBrains Mono, neutral palette, dark-mode-default, spacing scale, density toggle | `EAOS-NUWS-principles.md` §7.5 |

### Exit criteria

- [ ] `npm run build` (backend) produces `backend/openapi/openapi.json` with > 0 endpoints
- [ ] `npm run codegen` (frontend) produces typed `app/api/generated/types.ts` matching the OpenAPI artifact
- [ ] OpenAPI artifact is committed and version-controlled
- [ ] `agents.controller.ts:findAll` returns `PaginatedResponse<AgentResponseDto>`; frontend `unwrapList` still works (backward-compat for that one shape)
- [ ] `agents.controller.ts:pause` returns `ActionResult<AgentResponseDto>`; frontend handler updated to read `{ success, message, data }`
- [ ] One page (e.g. `agents/page.tsx`) successfully uses `useQuery` for the new `agents` endpoint as proof
- [ ] `<Can permission="agent.spawn">` hides/shows a button based on role in dev

**Rollback plan:** OpenAPI annotations are zero-runtime-cost (decorators only). The `agents` proof migration is a single controller; if it breaks, revert that PR. Prisma EAOS-1 schema additions are additive (new tables only); no risk to existing data.

**This phase blocks:** all subsequent phases.

---

## 6. Phase 2 — Frontend Data Layer Migration (Weeks 4–6)

**Goal:** Retire `services/api.ts`, `services/socket.ts`, `CacheManager`, `storeEventBridge`. Every page uses TanStack Query. **Behind `USE_REST_CLIENT` flag.**

### Tasks

| # | Task | Refs |
|---|---|---|
| 2.1 | Delete `src/services/api.ts` and `src/services/socket.ts` after switching all imports to `RestClient` / `SocketManager` | `EAOS-frontend-data-layer.md` §2.1, §5.1 |
| 2.2 | Delete `core/infrastructure/cache/CacheManager.ts` and the per-entity TTL config in `api.config.ts` | `EAOS-frontend-data-layer.md` §3.12 |
| 2.3 | Delete `core/infrastructure/socket/storeEventBridge.ts`; replace with `infrastructure/socket/queryEventBridge.ts` that invalidates TanStack Query keys | `EAOS-frontend-data-layer.md` §3.6 |
| 2.4 | Migrate polling hooks (`useDashboardKpis`, `useAgentMetrics`, `useChartData`, `useHealthMonitor`) to `useQuery({ refetchInterval })` | `EAOS-frontend-data-layer.md` §3.9 |
| 2.5 | Delete `stores/agentStore.ts`, `stores/taskStore.ts`, `stores/workflowStore.ts`, `stores/departmentStore.ts`, `stores/chatStore.ts`, `stores/activityStore.ts` after migrating consumers to TanStack Query hooks | `EAOS-frontend-data-layer.md` §3.11 |
| 2.6 | Delete `services/unwrap.ts` (4-shape normaliser) — no longer needed; TanStack Query returns typed data | `EAOS-frontend-data-layer.md` §3.12 |
| 2.7 | Wire `useStreamingStore` to use new `SSEClient` instead of legacy `agent-streaming.service.ts` | `EAOS-frontend-data-layer.md` §5.2 |

### Migration order (per page)

1. Migrate one page at a time, behind `USE_REST_CLIENT` flag.
2. Convert each `useState`/`useEffect` fetch block to `useQuery`.
3. Convert each mutation handler to `useMutation`.
4. Verify the page works identically to before.
5. **Remove** the `USE_REST_CLIENT` flag for that page.
6. After 100% of pages migrated, remove the flag system entirely.

### Exit criteria

- [ ] `grep -r "from '@/services/api'" frontend-tenant/src` returns 0
- [ ] `grep -r "from '@/services/socket'" frontend-tenant/src` returns 0
- [ ] `ls frontend-tenant/src/stores` shows only UI stores (`authStore`, `commandStore`, `inspectorStore`, plus `shared/stores/{notificationStore, uiPreferencesStore, voiceProfileStore}`)
- [ ] `CacheManager.ts` is deleted
- [ ] All polling hooks use `refetchInterval`
- [ ] `unwrapList` is deleted
- [ ] LCP for `/` (dashboard) ≤ 1.5s on staging
- [ ] LCP for `/entity/department/abc` ≤ 2.0s on staging (proves the new shell pattern works)

**Rollback plan:** the `USE_REST_CLIENT` flag lets us turn off the migration per tenant. If a page is broken, flip the flag for that tenant's pages.

**This phase blocks:** Phase 3 (entity workspace depends on TanStack Query hooks).

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

## 13. Phase 9 — Auth Hardening (Weeks 5–6, parallel with Phase 3+)

**Goal:** Switch from `localStorage` JWT to httpOnly + Secure + SameSite=Strict cookies. CSRF protection.

**Why this is Phase 9 and not earlier:** it's a high-risk change that can run in parallel with feature work because the dual-support period is 90 days.

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
| 9.8 | Roll out per tenant behind `USE_HTTPONLY_AUTH` flag; dual-support 90 days | api-contract §4.1 |

### Exit criteria

- [ ] No `localStorage` token writes anywhere in the codebase
- [ ] CSRF token required for all mutating requests; CSRF rejection returns 403
- [ ] All tenants migrated off legacy auth
- [ ] Penetration test signed off: tokens are not XSS-exfiltratable
- [ ] `__Host-` prefix prevents subdomain cookie theft

**Rollback plan:** the `USE_HTTPONLY_AUTH` flag lets us roll back per tenant. During dual-support, the legacy `Authorization` header path still works.

---

## 14. Phase 10 — Cleanup (Weeks 41–42)

**Goal:** Remove all legacy code paths. Tighten the codebase.

### Tasks

| # | Task | Refs |
|---|---|---|
| 10.1 | Delete all `services/api.ts`, `services/socket.ts` consumers should be 0; delete the files | frontend-data-layer §2.1 |
| 10.2 | Delete `security/` module entirely (guards + types — already removed in Phase 0) | rbac §1.2 |
| 10.3 | Delete all per-entity TTL config in `api.config.ts` (replaced by `query-stale-times.ts`) | frontend-data-layer §3.12 |
| 10.4 | Delete all `unwrap.ts` (replaced by typed `queryFn`) | frontend-data-layer §3.12 |
| 10.5 | Delete `core/infrastructure/cache/CacheManager.ts` | frontend-data-layer §3.12 |
| 10.6 | Delete all data Zustand stores (agent, task, workflow, department, chat, activity) | frontend-data-layer §3.11 |
| 10.7 | Delete the old `/departments/[id]/workspace` route + its 30-day redirect | impl-plan §14.1 Q10 |
| 10.8 | Delete all `feature-flags` that are 100% rolled out | frontend-data-layer §13 |
| 10.9 | Delete all `// TODO: migrate` comments in the codebase | grep |
| 10.10 | Delete all `@deprecated` JSDoc tags | grep |
| 10.11 | Tighten all `as any` casts to typed alternatives | frontend-data-layer §8 |
| 10.12 | Lock all file:line references in this document that say "exists" — if the file is gone, the reference is gone | this doc |

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
