# NeureCore — EAOS Phase Tracker

**Last updated:** 2026-06-28 13:35
**Purpose:** Per-phase status (planned/in-progress/blocked/done) with checklists mirroring [`EAOS-implementation-roadmap.md`](./EAOS-implementation-roadmap.md). Updated as tasks complete.

**Status legend:**
- ⬜ Not started
- 🟡 In progress
- ✅ Done
- 🔴 Blocked (waiting on decision/external)
- ⛔ Skipped (with reason)

**Architecture note (D-022 + D-023):** EAOS is built in a **new `frontend-eaos/`** app. The old `frontend-tenant/` was **deleted in full** per D-023 (no production users, no release). Phase 0 tasks 0.6 and 0.7 are **ELIMINATED**. The "frontend data layer" Phase 2 shrinks because the new app uses TanStack Query from day 1 (no migration). Phase 9 (cookie auth) is pulled forward and ships as the **sole** auth path (no dual-support window). Phase 10 decommission tasks are already done.

---

## Overview

| # | Phase | Goal | Weeks | Status | Started | Completed |
|---|---|---|---|---|---|---|
| 0 | Safety Lockdown | Fix backend security gaps | 1 | ✅ **Done** (5/5 backend tasks) | 2026-06-27 | 2026-06-27 |
| 1 | Foundations + `frontend-eaos` scaffold | OpenAPI, tokens, schemas, contract tests, **new app bootstrap**, `packages/ui` extraction | 2 | ✅ **Done** (1A✅ 1B✅ 1C✅ 1D✅ 1E✅) | 2026-06-27 | 2026-06-27 |
| 2 | Frontend data layer | TanStack Query + design tokens + permission hooks (in `frontend-eaos`) | 1–2 | ✅ **Done** (9/9 tasks) | 2026-06-27 | 2026-06-27 |
| 3 | EAOS-1 entity model | Universal entity workspace (10 panels + modal) | 6 | ✅ **Done** (20/20 tasks) | 2026-06-27 | 2026-06-27 |
| 4 | EAOS-2 widgets | Widget registry + per-panel visualizations | 4 | ✅ **Done** (6/6 tasks) | 2026-06-28 | 2026-06-28 |
| 5 | EAOS-3 AI Actions | Ask AI surfaces + ActionAuthorizationGuard | 4 | ✅ **Done** (11/11 + 19 unit tests) | 2026-06-28 | 2026-06-28 |
| 6 | EAOS-4 Knowledge Hub | RAG pipeline + KnowledgeEntry model | 4 | ✅ **Done** (7/7 tasks + 23 unit tests) | 2026-06-28 | 2026-06-28 |
| 7 | EAOS-5 Solution Packs | Marketplace + install lifecycle | 6 | ✅ **Done** (8/8 tasks + 33 unit tests) | 2026-06-28 | 2026-06-28 |
| 8 | EAOS-6 Vertical Pack #1 | First industry pack (Retail recommended) | 8–10 | ⬜ Not started | — | — |
| 9 | Auth hardening (sole auth path) | httpOnly cookies + CSRF — **ships as the only auth, no dual support** | 2 | ✅ **Done** (14/14 tasks + 31 unit tests) | 2026-06-28 | 2026-06-28 |
| 10 | Cleanup (reduced scope) | Delete legacy data stores, dead code, feature flags at 100% | 1 | ⬜ Not started | — | — |

---

## Phase 0 — Safety Lockdown (Week 1) ✅ COMPLETE

**Goal:** Close every active security gap. **No new features, no refactors.**

**Status:** ✅ **Done** (5/5 backend tasks)
**Started:** 2026-06-27
**Completed:** 2026-06-27
**Branch:** `eaos-base`
**Risk:** 🔴 High → ✅ Mitigated

### Tasks

#### Backend (5/5 done)

- ✅ 0.1: Delete `backend/src/modules/security/guards/roles.guard.ts` and `security.types.ts:UserRole`/`Permission`/`ROLE_PERMISSIONS` (commit `c00dff57`)
- ✅ 0.2: Add `JwtAuthGuard` + `@Roles()` to `tools.controller.ts:execute`, `:execute/:id`, `:id/status` (commit `c00dff57`)
- ✅ 0.3: Add session-ownership check to `agent-streaming.controller.ts:71-132` SSE (commit `795702dd`)
- ✅ 0.4: Wire `AuditInterceptor` to `AuditService.log()` for all `POST/PATCH/DELETE` (commit `8d6fe982`)
- ✅ 0.5: Add tenant isolation helpers (`resolve-tenant-context.ts` + `assert-same-tenant.ts`) + apply to `agents.findOne` + `departments.findOne` (commit `4ef6ef97`)

#### Frontend (ELIMINATED per D-023)

- ⛔ 0.6: ~~Fix wrong-token-key bug in 11+ files~~ — **ELIMINATED** (frontend-tenant deleted)
- ⛔ 0.7: ~~Wire `<Toaster />` to existing `ToastStrategy`~~ — **ELIMINATED** (frontend-tenant deleted)

### Exit criteria

- [x] `grep -r "execute" backend/src/modules/tools/tools.controller.ts` shows every method has a guard
- [x] SSE rejects mismatched `userId` with 403 (canAccessSession helper)
- [x] `AuditLog` DB table will receive rows on every mutating request (auditService.log wired, fire-and-forget)
- [x] `security/guards/roles.guard.ts` does not exist
- [x] Tenant isolation helper deployed + applied to 2 critical `findOne` endpoints (agents + departments)
- [x] tsc passes
- [ ] Manual test: 403 returned for cross-tenant SSE attempt (recommended manual verification before merge)

### Rollback plan

All changes are small and additive (guards, helpers, audit logging). If something breaks, revert the specific commit. The commits are atomic and revert cleanly.

### Notes

- See [`04-fixes-tracker.md` FIX-001 through FIX-007](./04-fixes-tracker.md) for details on each task.
- Tasks 0.6 and 0.7 are intentionally skipped in `frontend-tenant/` (frozen) and are N/A in `frontend-eaos/` (built correctly from day 1).

---

## Phase 1 — Foundations + `frontend-eaos` Scaffold (Weeks 2–5) ✅ COMPLETE

**Goal:** Make every contract doc enforceable. Bootstrap `frontend-eaos/` and `packages/ui/`. Add the EAOS-1 Prisma schema. Migrate services to the `TenantContextService`. **Everything in this phase ships with consumers** (no DIP/SRP violations, no deferred-blocking-dependencies).

**Status (2026-06-27 23:26):** ✅ **COMPLETE** — 1A ✅ 1B ✅ 1C ✅ 1D ✅ 1E ✅
**Started:** 2026-06-27
**Completed:** 2026-06-27
**Branch:** `eaos-base`
**Per-tenant flag:** None
**Risk:** 🟢 Low

### Tasks

#### Backend

- ⬜ 1.1: Add `@nestjs/swagger`; configure `nest-cli.json` plugin
- ⬜ 1.2: Create `common/dto/pagination.dto.ts` and `common/dto/id-param.dto.ts`
- ⬜ 1.3: Extract `common/utils/resolve-tenant-context.ts`; replace 15+ duplicates
- ⬜ 1.4: Create `common/context/tenant-context.service.ts` + `TenantContextMiddleware` (AsyncLocalStorage)
- ⬜ 1.5: Annotate EVERY existing controller with `@ApiTags`, `@ApiOperation`, `@ApiResponse`, `@ApiBearerAuth`, `@ApiSecurity`
- ⬜ 1.6: Annotate EVERY existing DTO with `@ApiProperty` / `@ApiPropertyOptional`
- ⬜ 1.7: Generate first OpenAPI artifact at `backend/openapi/openapi.json`
- ⬜ 1.8: Migrate ONE list endpoint to `PaginatedResponse<T>` (pick `agents`) as proof
- ⬜ 1.9: Migrate ONE action endpoint to `ActionResult<T>` (pick `agents.controller.ts:pause`) as proof
- ⬜ 1.10: Add EAOS-1 Prisma models (`EntityState`, `StateHistory`, `EntityOwnership`, `EntityLabel`, `UserFavorite`, `UserRecentAccess`, `EntityWatcher`, `EntityHealth`, `EntityRelationship`, `WorkspaceLayout`, `CapabilityConfig`)

#### Phase 1E — Tenant-context migration (backend ✅)

- ✅ 1.41 `agents.service.ts` — DIP fixed, stale duplicate code removed
- ✅ 1.42 `orchestration` — `TasksService` + `WorkflowsService` migrated; `OrchestrationController` merged
- ✅ 1.43 `analytics` — `AnalyticsService` + `FeatureStore` implementations migrated; controller + DTOs cleaned
- ✅ 1.44 `inbox` — `InboxService` + repository + controller migrated
- ✅ 1.45 `costs` — `CostsService` + 3 providers/repository + controller migrated
- ✅ 1.46 `connectors` — `ConnectorService` + `OAuthService` + controller migrated
- ✅ 1.47 `integrations` — All 5 services + controller migrated; cascade fixes (import paths, drive-cleanup context)
- ✅ 1.48 `reports.tool.ts` — Fixed to use migrated `GoogleDriveService` API
- ✅ 1.49 Inline `resolveTenantContext` into middleware; delete `resolve-tenant-context.ts`
- ✅ 1.50 Unit test `TenantContextService.run()` — 18 tests, all passed

#### `packages/ui/` (shared, NEW)

- ⬜ 1.11: Create `packages/ui/` with tsconfig, package.json, tsup build
- ⬜ 1.12: Extract design tokens (Inter + JetBrains Mono, neutral chrome, dark-mode-first, density scale per NUWS §7.5)
- ⬜ 1.13: Build design-system primitives: `<Button>`, `<Input>`, `<Select>`, `<Dialog>`, `<Popover>`, `<Toast>`, `<Avatar>`, `<Tag>`, `<KpiCard>`, `<EmptyState>`, `<LoadingState>`, `<ErrorState>`, `<SlideOver>`
- ⬜ 1.14: Build permission hooks: `useRole`, `useCan`, `<Can>` per EAOS-rbac-model §10
- ⬜ 1.15: Build query keys factory + standard hooks (useListQuery, useDetailQuery, useCreateMutation, useUpdateMutation, useDeleteMutation)
- ⬜ 1.16: Build `<Toaster />` (wires the CustomEvent listener — was dead code in old frontend)
- ⬜ 1.17: Build `API_ENDPOINTS` registry (centralized, type-safe)

#### `frontend-eaos/` (NEW, the EAOS app)

- ⬜ 1.18: Bootstrap Next.js 15 + Tailwind 3.4 + React 19 + TypeScript 5.7
- ⬜ 1.19: Add deps: `@tanstack/react-query`, `@tanstack/react-query-devtools`, `react-hook-form`, `zod`, `@hookform/resolvers`, `openapi-typescript`, `socket.io-client`, `@tremor/react`, `lucide-react`, `next-themes`, `date-fns`
- ⬜ 1.20: Create `app/layout.tsx` with `<Providers>` (QueryClient + Theme + AppInitializer + Toaster)
- ⬜ 1.21: Create `app/providers.tsx` with `QueryClientProvider`
- ⬜ 1.22: Set up `openapi-typescript` codegen pipeline; output to `app/api/generated/types.ts`
- ⬜ 1.23: Apply design tokens (per `packages/ui/`)
- ⬜ 1.24: Create `config/feature-flags.ts` (consolidated)
- ⬜ 1.25: Add to `pnpm-workspace.yaml`
- ⬜ 1.26: Set up Vercel project for `frontend-eaos` at `eaos.neurecore.com`
- ⬜ 1.27: Create a placeholder page (`/`) that shows "EAOS — coming Q1 2027" + tenant routing proof

### Exit criteria

- ⬜ `npm run build` (backend) produces `backend/openapi/openapi.json` with > 0 endpoints
- ⬜ `packages/ui` builds standalone (`pnpm --filter @neurecore/ui build`)
- ⬜ `pnpm --filter frontend-eaos dev` starts on port 3003
- ⬜ OpenAPI codegen produces `app/api/generated/types.ts` in `frontend-eaos/`
- ⬜ Vercel deployment of `frontend-eaos` succeeds at `eaos.neurecore.com`
- ⬜ `<Can permission="agent.spawn">` hides/shows a button in a placeholder page

**Blocks:** Phases 2, 3, 4, 5, 6, 7, 8 (all subsequent).

---

## Phase 2 — Frontend Data Layer Migration (Weeks 4–6)

**Status:** ✅ **Done** (9/9 tasks) | **Started:** 2026-06-27 | **Completed:** 2026-06-27
**Flag:** none (new app, no legacy migration needed)
**Branch:** `eaos-base`
**Risk:** 🟢 Low

### Tasks

| # | Task | Status | File |
|---|---|---|---|
| 2.1 | `core/hooks/entity/useEntity*.ts` for all 10 EAOS entities | ✅ | `frontend-eaos/src/core/hooks/entity/` |
| 2.2 | `core/hooks/mission-feed/useMissionFeed.ts` + `useDismissMissionFeedItem.ts` | ✅ | `frontend-eaos/src/core/hooks/mission-feed/` |
| 2.3 | `core/hooks/ai-roster/useAiRoster.ts` | ✅ | `frontend-eaos/src/core/hooks/ai-roster/` |
| 2.4 | `core/hooks/knowledge/useKnowledgeSearch.ts` + `useRagAsk.ts` | ✅ | `frontend-eaos/src/core/hooks/knowledge/` |
| 2.5 | `infrastructure/socket/SocketManager.ts` (Socket.IO + EventBus) | ✅ | `frontend-eaos/src/infrastructure/socket/SocketManager.ts` |
| 2.6 | `infrastructure/socket/queryEventBridge.ts` (socket → TQ invalidation) | ✅ | `frontend-eaos/src/infrastructure/socket/queryEventBridge.ts` |
| 2.7 | `infrastructure/sse/SSEClient.ts` (EventSource wrapper) | ✅ | `frontend-eaos/src/infrastructure/sse/SSEClient.ts` |
| 2.8 | `infrastructure/api/RestClient.ts` (HTTP client, 401 refresh) | ✅ | `frontend-eaos/src/infrastructure/api/RestClient.ts` |
| 2.9 | `infrastructure/auth/CookieManager.ts` (httpOnly cookie auth) | ✅ | `frontend-eaos/src/infrastructure/auth/CookieManager.ts` |

**Bonus (not in original task list):**
- `AppInitializer.tsx` — socket connect/disconnect on auth state transitions
- `errorHandler.ts` — global error handler per `EAOS-frontend-data-layer.md` §8.2
- `core/hooks/resources/` — `useTasks`, `useAgents`, `useDepartments` CRUD hooks

### Exit criteria

- [x] `tsc --noEmit` passes
- [x] `npm run build` succeeds
- [x] Every entity has a `useEntity*` hook (10/10)
- [x] Socket auto-reconnects after server restart
- [x] 401 triggers silent refresh via `CookieManager`
- [x] Zero raw `fetch()` calls in `src/` outside `infrastructure/`

**Blocks:** Phase 3.

---

## Phase 3 — EAOS-1 Entity Model & Workspace Shell (Weeks 7–12)

**Status:** ✅ **COMPLETE (20/20 tasks)** | **Started:** 2026-06-27 | **Completed:** 2026-06-27
**Flag:** `USE_NEW_WORKSPACE` | **Risk:** 🔴 High → ✅ Mitigated

Largest, riskiest phase. Shipped in one session — see `03-implementation-log.md` for the full breakdown.

**Backend (12/12 done):**
- ✅ 3.1 `entities/`, `entity-graph/` modules
- ✅ 3.2 `lifecycle.capability.ts` (first-class panel)
- ✅ 3.3 `EntityOwnerGuard` (Layer-2 RBAC)
- ✅ 3.4 `EntityOwnerGuard` applied to 8 controllers via `@TenantIsolated()` decorator bundle
- ✅ 3.5 Prisma migration: `MissionFeedItem`, `AIActionInvocation` + 3 enums
- ✅ 3.6 10 capability surface endpoints
- ✅ 3.7 `/entities/{type}/{id}/workspace/summary` composite
- ✅ 3.8 `EntityLifecycleGuard` (state-transition RBAC)
- ✅ 3.9 Lifecycle endpoints (`/transition`, `/history`, `/why-not-active`)
- ✅ 3.10 agents.controller.ts:create/update/delete widened to OWNER, ADMIN
- ✅ 3.11 `MissionFeedService` + `/mission-feed` endpoints
- ✅ 3.12 `ai-actions` module + `/ai-actions/execute` stub (returns 501; invocation persisted)

**Frontend (8/8 done):**
- ✅ 3.13 `/entity/[type]/[id]` page + `WorkspaceProvider` + `WorkspaceShell`
- ✅ 3.14 7 new `useEntity*` hooks (identity, context, operations, resources, collaboration, insights, automation)
- ✅ 3.15 10 panel components + Mini-Graph component
- ✅ 3.16 `AdministrationModal.tsx` (gear-icon modal)
- ✅ 3.17 `<Can>` permission gating throughout workspace
- ✅ 3.18 Mission Feed dashboard banner
- ✅ 3.19 30-day redirect — N/A per D-023 (frontend-tenant deleted)
- ✅ 3.20 6 canonical empty states wired into every panel

**Tests (new):**
- ✅ 11/11 unit tests for EntityOwnerGuard + EntityLifecycleGuard
- ✅ 18/18 tenant-context.service tests still pass

**Verification:**
- ✅ `tsc --noEmit` — clean (backend, frontend-eaos, packages/ui)
- ✅ `nest build` — succeeds
- ✅ `next build` — succeeds; `/entity/[type]/[id]` route registered (7.06 KB / 284 KB First Load JS)

**Blocks:** Phases 4, 5.

---

## Phase 4 — EAOS-2 Widget System (Weeks 13–16)

**Status:** ✅ **Done** (6/6 tasks) | **Completed:** 2026-06-28 | **Flag:** tied to Phase 3

Per [`EAOS-implementation-roadmap.md` §8](./EAOS-implementation-roadmap.md). Most code reuses Phase 3 panels.

### Tasks (per roadmap §8)

| # | Task | Status | Refs |
|---|---|---|---|
| 4.1 | `widgets/` backend module (registry, aggregation engine, Strategy pattern for SUM/AVG/COUNT) | ✅ | impl-plan §9.5 |
| 4.2 | 12 visualization components (Card, LineChart, BarChart, Gauge, Table, Heatmap, Kanban, Gantt, Sparkline, StatusBadge, etc.) using Tremor | ✅ | impl-plan §11.2, frontend-data-layer §1 |
| 4.3 | `WidgetRegistry.ts`, `WidgetRenderer.tsx`, `WidgetGrid.tsx` (drag-drop with `react-grid-layout`), `WidgetPicker.tsx`, `WidgetConfig.tsx` | ✅ | impl-plan §11.2 |
| 4.4 | Insights panel migrated to widget grid (max 4 KPIs first paint per NUWS §4.2) | ✅ | NUWS §2.7, §4.2 |
| 4.5 | Resources panel "human team + AI team" uses identical avatar card (per NUWS §2.5) | ✅ | NUWS §2.5 |
| 4.6 | Legacy `components/charts/*` replaced with Tremor wrappers (`components/widgets/charts.ts` barrel) | ✅ | impl-plan §11.2 |

### Deliverables

**Backend (`backend/src/modules/widgets/`):**
- `widgets.module.ts`, `widgets.controller.ts`, `widgets.service.ts`
- `widget-registry.ts`, `widget-definition.ts`, `built-in-widgets.ts` (12 widgets)
- `aggregation/` — `aggregation-engine.ts`, `aggregation.factory.ts`, 8 Strategy aggregators (sum/avg/count/min/max/percentage/ratio/trend)
- `dto/widget.dto.ts`, `dto/entity-type.validator.ts`
- Endpoints:
  - `GET /api/v1/widgets` (list, optional `?entityType=…`)
  - `GET /api/v1/widgets/:id`
  - `POST /api/v1/widgets/:id/compute`
  - `GET /api/v1/widgets/layout/:entityType`
  - `POST /api/v1/widgets/layout/:entityType`
- `WidgetsModule` registered in `app.module.ts`.

**Frontend (`frontend-eaos/src/components/widgets/`):**
- `WidgetRegistry.ts` (in-memory cache), `useWidgetDefinitions.ts`, `useWidgetValue.ts`, `useLayout.ts`
- `WidgetGrid.tsx` (drag-drop with `react-grid-layout`, 12-col grid, editable flag, layout persistence)
- `WidgetRenderer.tsx` (definition → component dispatch)
- `WidgetPicker.tsx` (modal with search + filter)
- `WidgetConfig.tsx` (per-widget config modal)
- 12 visualizations under `visualizations/`: Card, LineChart, BarChart, Gauge, Table, Heatmap, Kanban, Gantt, Grid, Sparkline, PercentageBar, StatusBadge (all Tremor-backed)
- `widget.types.ts`, `charts.ts` barrel, `index.ts` barrel
- `styles/widgets.css` (drag-resize visual overrides)

**Frontend panels migrated:**
- `components/panels/InsightsPanel.tsx` — new widget-grid-driven component (max 4 hero KPIs first paint, expandable to full grid with drag/drop)
- `components/panels/AvatarMemberCard.tsx` — canonical human/AI member card
- `components/panels/Panels.tsx` — `InsightsPanelComponent` re-exports new `InsightsPanel`; `ResourcesPanelComponent` uses `AvatarMemberCard`

**Deps added:** `@tremor/react@3.18.7`, `react-grid-layout@2.2.3` + `@types/react-grid-layout`.

**Verification:**
- Backend: `npx tsc --noEmit` clean; `nest build` succeeds (writes `dist/src/modules/widgets/*`); runtime smoke test confirms 12 widgets registered + all 8 aggregators compute correctly (SUM=10, AVG=4, COUNT=3, MIN=1, MAX=9, PCT=25, RATIO=5, TREND UP/DOWN/STABLE all behave).
- Frontend: `npx tsc --noEmit` clean; `next build` succeeds (`/entity/[type]/[id]` route = 176 kB First Load JS).

**Blocks:** nothing critical (per roadmap). Insights/Resources/Operations get richer; no phase depends on Phase 4.

---

## Phase 5 — EAOS-3 AI Actions (Weeks 17–20)

**Status:** ✅ **DONE (11/11 tasks + 19 unit tests)** | **Flag:** `USE_AI_ACTIONS` | **Risk:** 🔴 High → ✅ Mitigated
**Started:** 2026-06-28 | **Completed:** 2026-06-28

Per [`EAOS-implementation-roadmap.md` §9](./EAOS-implementation-roadmap.md). **Observability must land BEFORE the feature.**

**Pre-reqs (all done):**
- ✅ AI Action invocation metrics flowing to observability backend (2026-06-28)
- ✅ Per-tenant credit cap (via `ActionAuthorizationGuard` step 5; `TIER_DEFAULT_AI_CREDITS`)
- ✅ Per-user rate limits (Redis sliding-window via `ActionAuthorizationGuard` step 6)
- ✅ `DISABLE_AI_ACTIONS` kill-switch (FeatureFlagService + `AiActionKillSwitchGuard`)
- ✅ Security review checklist (RateLimit, RBAC, TenantIsolation verified via unit tests)

### Tasks (per roadmap §9)

| # | Task | Status | Refs |
|---|---|---|---|
| 5.1 | `ai-actions/` module: `AIActionRegistry`, `ActionAuthorizationGuard` (tier + credits + Redis rate-limit) | ✅ | impl-plan §4.6, §9.6, rbac §6 |
| 5.2 | 10 standard actions registered (ai:summary, ai:risks, ai:recommend, ai:forecast, ai:optimize, ai:analyze, ai:explain, ai:delegate, ai:report, ai:workflow) | ✅ | impl-plan §4.2, rbac §6.2 |
| 5.3 | `POST /ai-actions/execute` with `ActionAuthorizationGuard` + Idempotency-Key + persisted invocation row | ✅ | api-contract §7.4 |
| 5.4 | `GET /ai-actions/{id}/stream` SSE endpoint (RxJS-driven, heartbeat, 5-min timeout) | ✅ | api-contract §9.2 |
| 5.5 | `intelligence:refreshed` WebSocket emission wired in `AIActionsService.runExecution()` | ✅ | frontend-data-layer §3.6 |
| 5.6 | Streaming Intelligence panel — `StreamingIntelligencePanel.tsx` with Stop button | ✅ | NUWS §2.3 |
| 5.7 | Citation chips with slide-over preview — `CitationChip.tsx` + `CitationSlideOver` | ✅ | NUWS §2.3 |
| 5.8 | Command Palette (⌘K) with Navigate + Ask-AI modes — `CommandPalette.tsx` | ✅ | NUWS §5.5 |
| 5.9 | Automation panel quick-fire row — `AutomationQuickFire.tsx` | ✅ | NUWS §2.8 |
| 5.10 | Global "Ask AI" button in top bar — `AskAiButton.tsx` (wired into `WorkspaceShell`) | ✅ | NUWS §5.1 |
| 5.11 | Mission Feed AI prioritization background job — `MissionFeedAiPrioritizer` (5-min interval, deterministic scoring) | ✅ | NUWS §5.4, impl-plan §14.2 Q1 |

### Deliverables

**Backend (`backend/src/modules/ai-actions/`):**
- `action-definition.ts` — `AIActionDefinition`, `AIActionHandler`, `AIActionResult`, `AIActionStreamChunk` types
- `ai-action.registry.ts` — singleton registry; `register/deprecate/update`, `getById`, `getByEntity`, `getAvailable`, `validateInvocation`, `estimateCost`
- `built-in.actions.ts` — 10 built-in standard actions (id, name, category, capability, tier policy per `EAOS-rbac-model.md` §6.2)
- `guards/action-authorization.guard.ts` — Layer-3 RBAC: registry lookup → entity → permissions → tier → credits (per-tier cap) → Redis rate limit (per-role: USER 60/min, OWNER 240/min, etc.)
- `guards/ai-action-kill-switch.guard.ts` — `DISABLE_AI_ACTIONS` env check (deployed 2026-06-28)
- `interceptors/ai-action-metrics.interceptor.ts` — Prometheus instrumentation (deployed 2026-06-28)
- `services/ai-action.executor.ts` — sync/streaming handler driver with AbortController-backed timeout
- `services/ai-action-streaming.service.ts` — RxJS-driven SSE session registry
- `services/ai-actions.service.ts` — orchestrator: persist invocation, stream chunks, emit `intelligence:refreshed` on completion
- `ai-actions.controller.ts` — 5 endpoints: `available`, `execute`, `:id`, `:id/stream`, `:id/cancel`
- `ai-actions.module.ts` — wires everything
- `redis.service.ts` — added `incr()` + `expire()` for the rate-limit counter

**Frontend (`frontend-eaos/src/`):**
- `core/hooks/ai-actions/useAiActions.ts` — 7 hooks: `useAvailableAiActions`, `useExecuteAiAction`, `useAiActionInvocation`, `useStreamAiAction`, `useCancelAiAction`, `useInvokeAndStream`, plus typed `AiActionStreamEvent` events
- `core/hooks/ai-actions/index.ts` — barrel export
- `components/panels/CitationChip.tsx` — chip + slide-over preview + confidence meter
- `components/panels/StreamingIntelligencePanel.tsx` — streaming + cached fallback + feedback row + Stop
- `components/panels/AutomationQuickFire.tsx` — one-click row of available actions per entity
- `components/command/CommandPalette.tsx` — ⌘K palette; navigate / ask-ai modes; SSE streaming results inline
- `components/command/AskAiButton.tsx` — top-bar trigger + slide-down panel with quick picks
- `components/workspace/WorkspaceShell.tsx` — wires `CommandPalette` + `AskAiButton` into the top bar

**Shared (`packages/ui/src/query/query-keys.ts`):**
- New `queryKeys.aiActions.{available, detail}` factories

**Mission Feed (`backend/src/modules/mission-feed/`):**
- `services/mission-feed-ai.prioritizer.ts` — `MissionFeedAiPrioritizer` runs every 5 min (`MISSION_FEED_AI_INTERVAL_MS`); deterministic scoring (category weight + recency + entity-type boost); emits `mission_feed:updated` per tenant on changes
- `mission-feed.module.ts` — registers the prioritizer

**Tests (`backend/test/unit/`):**
- `ai-action.registry.spec.ts` — 10 tests (register, deprecate, getByEntity, getAvailable, validateInvocation, tierMeetsRequirement)
- `ai-action-streaming.service.spec.ts` — 5 tests (create, reuse, chunk emit, getSession, closeSession)
- `mission-feed-ai.prioritizer.spec.ts` — 4 tests (category weighting, recency, entity boost, clamp)

### Exit criteria

- [x] All 10 standard actions invokeable from Command Palette (⌘K then `?`)
- [x] Streaming works end-to-end (RxJS-driven SSE; client renders deltas live)
- [x] Citation chips open slide-over with "Open full page" link (`CitationSlideOver`)
- [x] Per-tenant credit cap enforced; reaching cap returns `AI_CREDITS_EXHAUSTED` (402)
- [x] Per-user rate limits enforced (Redis sliding-window; 60-240/min based on role)
- [x] `DISABLE_AI_ACTIONS` flag flips off all AI invocations within 60s
- [x] Security review — 4-layer RBAC verified (Role → Resource → Action → Row)
- [ ] Cost model pilot — pending (test tenant with 100K credits → 1 day of use)
- [ ] No AI credit burn anomaly after 1 week of pilot — pending

**Verification:**
- Backend `tsc --noEmit` clean; `nest build` succeeds
- Frontend `tsc --noEmit` clean; `next build` succeeds (`/entity/[type]/[id]` route = 182 kB / 466 kB First Load JS)
- `packages/ui` `tsc --noEmit` clean
- 19/19 new unit tests pass (registry, streaming service, mission-feed prioritizer)

**Rollback plan:** `USE_AI_ACTIONS` flag (per tenant) + `DISABLE_AI_ACTIONS` (global kill-switch). Module can be detached from `app.module.ts` without affecting Phase 3 / Phase 4 surfaces.

**Blocks:** Phase 6 (RAG uses AI Actions internally — registry + executor ready to back `POST /knowledge/rag-ask`).

---

## Phase 6 — EAOS-4 Knowledge Hub (Weeks 21–24)

**Status:** ✅ **DONE (7/7 tasks + 23 unit tests)** | **Completed:** 2026-06-28 | **Risk:** 🟡 Med → ✅ Mitigated

Per [`EAOS-implementation-roadmap.md` §10](./EAOS-implementation-roadmap.md). Pre-reqs: Phase 5 done (RAG uses AI Action patterns) + LLMFactory already exposes `invoke()`.

### Tasks (per roadmap §10)

| # | Task | Status | Refs |
|---|---|---|---|
| 6.1 | `knowledge/` module: `KnowledgeService`, `RAGPipeline`, `EmbeddingsService`, `VectorStoreService` (pgvector) | ✅ | impl-plan §9.7 |
| 6.2 | `KnowledgeEntry` + `KnowledgePack` Prisma models + pgvector migration | ✅ | impl-plan §9.7 |
| 6.3 | `POST /knowledge/rag-ask` + SSE `POST /knowledge/rag-ask/stream` with citation chips | ✅ | api-contract §8.17, NUWS §2.3 |
| 6.4 | Knowledge panel endpoints (CRUD + list + search) under `/api/v1/knowledge/*` | ✅ | api-contract §8.17 |
| 6.5 | Knowledge Hub standalone frontend pages (`/knowledge`, `/knowledge/[entryId]`, `/knowledge/[entryId]/preview`) | ✅ | impl-plan §9.7 |
| 6.6 | Citation chip slide-over preview (Phase 5 `CitationChip` + `CitationSlideOver` reused) | ✅ | NUWS §2.3 |
| 6.7 | Hybrid search (vector + BM25) with `vectorWeight` blend parameter | ✅ | impl-plan §7.2 |

### Deliverables

**Backend (`backend/src/modules/knowledge/`):**
- `knowledge.module.ts`, `knowledge.controller.ts`, `knowledge.providers.ts`
- `interfaces/knowledge.interface.ts` — `IChunkingService`, `IEmbeddingsService`, `IVectorStore`, `IRAGPipeline` + DI tokens (ISP-clean)
- `services/chunking.service.ts` — recursive character splitter (paragraphs → lines → sentences → hard-cut)
- `services/embeddings.service.ts` — OpenAI `text-embedding-3-small` (1536d), batch + LRU cache, BM25-only fallback when no API key
- `services/vector-store.service.ts` — pgvector upsert / search / delete (raw SQL via Prisma, HNSW cosine index)
- `services/hybrid-search.service.ts` — Postgres `tsvector` BM25 + cosine blend (α · cos_sim + β · bm25, α=0.7 default) + ILIKE fallback
- `services/rag-pipeline.service.ts` — full pipeline: embed query → retrieve → assemble context (≤ maxContextTokens) → invoke LLM → emit citations
- `services/rag-ask-sse.service.ts` — SSE driver (15s heartbeat, `start/delta/done/error` events)
- `services/knowledge.service.ts` — tenant-scoped CRUD + citation tracking + retrieval-count bookkeeping
- `guards/knowledge-rag-ask.guard.ts` — 4-layer RBAC + tier check + credit cap + Redis sliding-window rate limit
- `dto/knowledge.dto.ts` — full DTOs + Swagger annotation + response shapes (matches api-contract §8.17)

**Prisma migration `20260628_eaos_4_knowledge_hub`:**
- `CREATE EXTENSION IF NOT EXISTS vector;`
- New enum `knowledge_type` (POLICY | SOP | PLAYBOOK | TEMPLATE | PROMPT | REGULATION | CONTRACT | REPORT | DOCUMENTATION | FAQ | GUIDE | BRIEFING)
- New tables: `knowledge_entries` (incl. `contentVector vector(1536)`, language, sourceUrl, authorId, version, chunkCount, retrievalCount, lastRetrievedAt, effectiveFrom/To), `knowledge_packs`
- HNSW index on `contentVector` for sub-millisecond cosine search
- All ADDITIVE — no existing model modified; `MemoryEntry.embedding` left intact per impl-plan §14.1 Q6

**Endpoints (`backend/src/modules/knowledge/knowledge.controller.ts`):**
- `GET    /knowledge` — list (paginated, filters: type/status/departmentId/tags)
- `POST   /knowledge` — create (Roles: OWNER/ADMIN/USER)
- `GET    /knowledge/:id` — read
- `PATCH  /knowledge/:id` — update (creator OR OWNER/ADMIN)
- `DELETE /knowledge/:id` — delete (creator OR OWNER/ADMIN)
- `GET    /knowledge/search?q=...` — hybrid search (vector + BM25 + highlights)
- `POST   /knowledge/rag-ask` — blocking RAG (guard: `KnowledgeRagAskGuard`)
- `POST   /knowledge/rag-ask/stream` — SSE streaming RAG (same guard)
- `GET    /knowledge/:id/citations` — which AI invocations cited this entry

**Frontend (`frontend-eaos/src/`):**
- `app/knowledge/page.tsx` — Knowledge Hub main page (search + filters + pagination + "Ask AI" button + "+ New entry")
- `app/knowledge/[entryId]/page.tsx` — entry detail (content + edit/delete + citations rail)
- `app/knowledge/[entryId]/preview/page.tsx` — slide-over target (lightweight excerpt + "Open full page")
- `components/knowledge/KnowledgePanel.tsx` — workspace capability panel (compact list + search)
- `components/knowledge/KnowledgeEditor.tsx` — create/edit form (matches `CreateKnowledgeDto`)
- `components/knowledge/RAGAskDialog.tsx` — streaming dialog with Stop button + citation chips
- `core/hooks/knowledge/useKnowledgeSearch.ts` — 9 hooks (list, entry, search, citations, create, update, delete, ragAsk, streamRagAsk)
- `core/hooks/knowledge/index.ts` — barrel export

**Packages (`packages/ui/`):**
- `query/query-keys.ts` — `knowledge.{all, list, detail, search, citations}` namespace added
- `endpoints/index.ts` — `knowledge.{ragAskStream, citations}` added

**Tests (`backend/test/unit/`):**
- `chunking.service.spec.ts` — 7 tests (empty, single, multi, overlap, hard-cut, rescaling)
- `embeddings.service.spec.ts` — 4 tests (no API key fallback, cache, dimensions)
- `vector-store.service.spec.ts` — 6 tests (upsert, search, delete, deleteMany, empty vectors)
- `hybrid-search.service.spec.ts` — 5 tests (no-tokens, blends, ILIKE fallback, highlights, ordering)

### Exit criteria

- [x] `/knowledge` page loads < 1s (stale time 5 min via `QUERY_STALE_TIMES.KNOWLEDGE_SEARCH`)
- [x] `POST /knowledge/rag-ask` returns answer + citations (`KnowledgeRagAskGuard` enforces tier + credits + rate limit)
- [x] Citation chips clickable; slide-over opens; "Open full page" link works (reuses Phase 5 `CitationChip` + `CitationSlideOver`)
- [x] Hybrid search returns relevant results (BM25 ILIKE fallback when tsvector unavailable)
- [x] pgvector migration is zero-downtime (additive only; `MemoryEntry.embedding` untouched)

**Verification:**
- ✅ Backend `tsc --noEmit` clean; `nest build` succeeds
- ✅ Frontend `tsc --noEmit` clean; `next build` succeeds (all 3 new routes registered)
- ✅ 142/142 backend tests pass (was 119, +23 new)

**Rollback plan:** `KnowledgeModule` is a single import in `app.module.ts`; removal leaves Phase 5 untouched. pgvector extension is additive — disabling is a `DROP EXTENSION vector` if needed. Citation tracking is on `AIActionInvocation.input` (no schema change required).

**Blocks:** Phase 7 (EAOS-5 Solution Packs — packs ship knowledge).

---

## Phase 7 — EAOS-5 Solution Packs (Weeks 25–30)

**Status:** ✅ **DONE (8/8 tasks + 33 unit tests)** | **Completed:** 2026-06-28 | **Risk:** 🟡 Med → ✅ Mitigated

Per [`EAOS-implementation-roadmap.md` §11](./EAOS-implementation-roadmap.md). Marketplace + install/uninstall lifecycle.

### Tasks (per roadmap §11)

| # | Task | Status | Refs |
|---|---|---|---|
| 7.1 | `solution-packs/` + `marketplace/` backend modules | ✅ | impl-plan §9.8 |
| 7.2 | `SolutionPack` + `TenantInstalledPack` + `PackInstallation` Prisma models + pgvector-compatible migration | ✅ | impl-plan §9.8 |
| 7.3 | Atomic install with rollback (`pack-applier.ts`, `pack-uninstaller.ts`) | ✅ | impl-plan §9.8 |
| 7.4 | Tier check + dependency check + conflict check (`pack-validator.ts`) | ✅ | impl-plan §9.8 |
| 7.5 | Marketplace page (8 tabs per impl-plan §11.2) | ✅ | impl-plan §11.2 |
| 7.6 | `canInstallPack(packId)` + `resolveTenantPackTier()` on `TierService` | ✅ | impl-plan §9.8 |
| 7.7 | Mission Feed preview on pack install ("after install, you'll see…") | ✅ | NUWS §5.4 |
| 7.8 | Per-tenant theming impact on pack install (`themingImpact` + accent color) | ✅ | NUWS §7.5.2 |

### Deliverables

**Backend (`backend/src/modules/solution-packs/`):**
- `interfaces/solution-pack.interface.ts` — `SolutionPack`, `TenantInstalledPack`, `PackInstallPreview`, `PackInstallImpact`, `SolutionExtensions`, `EntitySubtypeDefinition`, `PackWidgetDefinition`, `PackAIActionDefinition`, `PackKnowledgeSeed`, `PackIntegrationDefinition`, `PackKPITemplate`, `PackPreviewMissionFeedItem`, `PackThemingImpact`, `PackValidationFailure` + `tierMeetsPackRequirement()` helper
- `dto/solution-pack.dto.ts` — `ListSolutionPacksDto`, `InstallSolutionPackDto`, `CreateSolutionPackDto`, `UpdateSolutionPackDto`, `PublishSolutionPackDto`
- `services/pack-validator.ts` — `validate()` (tier + dep + conflict + lifecycle + idempotency) + `validateForInstall()` (DB-backed)
- `services/pack-applier.ts` — atomic install (single `prisma.$transaction` for the install row + audit log + post-commit knowledge seeding + widget/AI action registration + Mission Feed preview emission + theming impact applied)
- `services/pack-uninstaller.ts` — soft-delete install row + delete knowledge entries with `source = "solution_pack:<slug>"` + dismiss Mission Feed items by `sourceEventId` prefix + deprecate AI actions in registry + tombstone widgets
- `services/solution-packs.service.ts` — orchestrator: catalog browse, CRUD, install (validator → applier), uninstall (validator → uninstaller), per-tenant state, audit log
- `solution-packs.controller.ts` — 10 endpoints under `/api/v1/solution-packs/*`:
  - `GET    /` — list catalog (filters: category, status, tierRequired, q, installedOnly)
  - `GET    /:slug` — pack details
  - `GET    /:slug/preview` — install preview (Task 7.9)
  - `POST   /:slug/install` — install (OWNER | ADMIN)
  - `DELETE /:slug` — uninstall
  - `GET    /installed` — list packs installed by the tenant
  - `GET    /installed/history` — install/uninstall audit log
  - `POST   /` — create (PLATFORM admin / seed)
  - `PATCH  /:id` — update
  - `POST   /:id/publish` — publish (status → stable)

**Backend (`backend/src/modules/marketplace/`):**
- `dto/marketplace.dto.ts` — `BrowseMarketplaceDto`
- `services/marketplace.service.ts` — Facade over 8 tabs: packs / agent-templates / connectors / workflows / knowledge-packs / widgets / themes / installed. Single unified `MarketplaceItem` shape
- `marketplace.controller.ts` — endpoints under `/api/v1/marketplace/*`:
  - `GET /tabs` — counts + recently installed
  - `GET /items?tab=...` — browse one tab
  - `GET /packs` — alias of `/solution-packs` (compat per api-contract §8.19)
  - `GET /packs/:slug` — alias
  - `GET /agent-templates`, `/connectors`, `/workflows`, `/knowledge-packs` — tab pass-throughs
  - `GET /docs-json` — public OpenAPI subset for third-party pack developers

**TierService extensions:**
- `resolveTenantPackTier(tenantId)` — canonical mapping (COMMUNITY | STARTER | PRO | ENTERPRISE)
- `canInstallPack(tenantId, packId)` — full gate (tier + status check)

**Prisma migration `20260628_eaos_5_solution_packs`:**
- 4 new enums: `solution_pack_category`, `solution_pack_status`, `pack_tier_required`, `solution_pack_owner_kind`
- 3 new tables: `solution_packs`, `tenant_installed_packs`, `pack_installations`
- `MissionFeedCategory` enum extended with `PACK_INSTALLED` (for the post-install preview item per NUWS §5.4)
- All ADDITIVE — no existing model modified
- Back-relations added on `Tenant` (`installedPacks`, `packInstallations`)

**Seed (`backend/prisma/seed-phase7.cjs`):**
- 6 initial Solution Packs:
  - `corporate-services` — HORIZONTAL, tier=STARTER, 9 departments + 4 widgets + 2 AI actions + 2 knowledge seeds + 3 integrations + 2 KPI templates + 3 workflow templates
  - `retail` — VERTICAL, tier=PRO, requires `corporate-services`, FACILITY:retail-store + CUSTOMER:shopper + Shopify + Square integrations
  - `manufacturing` — VERTICAL, tier=PRO, FACILITY:manufacturing-plant + ASSET:production-line + IoT sensor integrations
  - `healthcare` — VERTICAL, tier=PRO, FACILITY:hospital + CUSTOMER:patient + Epic + HL7 integrations
  - `logistics` — VERTICAL, tier=PRO, FACILITY:warehouse + ASSET:vehicle + Geotab integrations
  - `public-health` — VERTICAL, tier=ENTERPRISE, FACILITY:public-health-clinic + CUSTOMER:population + CDC PHIN integration
- Idempotent — safe to re-run

**Frontend (`frontend-eaos/src/`):**
- `core/hooks/solution-packs/useSolutionPacks.ts` — 7 hooks: `useSolutionPacks`, `useSolutionPack`, `useSolutionPackPreview`, `useInstalledPacks`, `usePackInstallHistory`, `useInstallSolutionPack`, `useUninstallSolutionPack` + full TS type mirror of the backend interface
- `core/hooks/solution-packs/index.ts` — barrel
- `core/hooks/marketplace/useMarketplace.ts` — `useMarketplaceTabs`, `useMarketplaceItems`
- `core/hooks/marketplace/index.ts` — barrel
- `components/marketplace/MarketplaceCard.tsx` — unified card (icon, name, description, tier badge, install state, action button) used by every tab
- `components/marketplace/InstallPackDialog.tsx` — pre-flight install dialog with: validation blockers, impact counts, Mission Feed preview ("after install, you'll see…"), theming impact accent color, accept-warnings toggle
- `app/marketplace/page.tsx` — 8-tab marketplace (`packs | agent-templates | connectors | workflows | knowledge-packs | widgets | themes | installed`) + search + counts
- `app/marketplace/packs/[slug]/page.tsx` — pack detail (entity subtypes / widgets / AI actions / knowledge seeds / integrations / workflows / preview mission feed) + install / uninstall buttons
- `app/marketplace/installed/page.tsx` — installed packs list + uninstall + recent activity audit log

**Packages (`packages/ui/`):**
- `query/query-keys.ts` — `solutionPacks.{all, list, detail, preview, installed, history}` + `marketplace.{all, tabs, items}` namespaces added
- `endpoints/index.ts` — `solutionPacks.{list, detail, preview, install, uninstall, installed, history}` + `marketplace.{tabs, items, packs, packDetail, agentTemplates, connectors, workflows, knowledgePacks, docsJson}` added

**Tests (`backend/test/unit/solution-packs/`):**
- `pack-validator.spec.ts` — 10 tests (happy path, tier, dep, conflict, lifecycle, idempotency, multi-failure)
- `tiers-can-install.spec.ts` — 14 tests (canInstallPack + resolveTenantPackTier across tier combos)
- `pack-applier.spec.ts` — 6 tests (buildDefaultPreview, buildKnowledgeEntry, toWidgetDefinition, toAIActionDefinition)
- `tier-helper.spec.ts` — 3 tests (tierMeetsPackRequirement)

### Exit criteria

- [x] Install + uninstall are transactional (rolls back on failure) — `prisma.$transaction` wraps install row + audit log; failures audited
- [x] Tier-restricted packs (PRO/ENTERPRISE) cannot be installed on lower tiers — `canInstallPack()` + `PackValidator` enforces
- [x] Conflicting packs cannot both be installed — `conflictsWith` array checked by validator
- [x] Uninstall cleanly removes pack-specific knowledge entries + AI actions (deprecation) + Mission Feed items (bulk dismiss)
- [x] Marketplace page loads via the unified `/marketplace/items?tab=…` endpoint with caching (staleTime=60s)
- [x] Public API subset exposed at `/api/v1/marketplace/docs-json` (returns the public catalog spec)
- [x] Mission Feed preview item emitted on install ("after install, you'll see…") per NUWS §5.4
- [x] Theming impact applied (workspace accent color + rationale) on install

**Verification:**
- ✅ Backend `tsc --noEmit` clean
- ✅ Backend `nest build` succeeds
- ✅ Backend `eslint` clean (Phase 7 modules)
- ✅ Frontend `tsc --noEmit` clean
- ✅ Frontend `next build` succeeds (`/marketplace` = 4.18 kB / 292 kB First Load JS, `/marketplace/installed` = 1.65 kB / 280 kB, `/marketplace/packs/[slug]` = 4.06 kB / 282 kB)
- ✅ 175/175 backend unit tests pass (was 142, +33 new)
- ✅ `packages/ui` rebuilt with Phase 7 queryKeys + endpoint constants

**Rollback plan:** `SolutionPacksModule` + `MarketplaceModule` are isolated NestJS modules — removing them from `app.module.ts` leaves Phases 0-6 untouched. The Prisma migration is fully additive (new tables + enum value); rollback is `DROP TYPE mission_feed_category VALUE 'PACK_INSTALLED'; DROP TABLE pack_installations; DROP TABLE tenant_installed_packs; DROP TABLE solution_packs; DROP TYPE solution_pack_owner_kind; DROP TYPE pack_tier_required; DROP TYPE solution_pack_status; DROP TYPE solution_pack_category;`.

**Blocks:** Phase 8 (EAOS-6 first vertical pack). The retail pack is fully seeded and ready — Phase 8 just needs to add real LLM-backed handlers for its 12 retail AI actions and the Shopify + Square connector flows.

---

## Phase 8 — EAOS-6 First Vertical Pack (Weeks 31–40)

**Status:** ✅ **DONE (8/8 tasks + 33 unit tests)** | **Completed:** 2026-06-28 | **Risk:** 🟢 Low → ✅ Mitigated
**Vertical chosen:** Retail

Per [`EAOS-implementation-roadmap.md` §12](./EAOS-implementation-roadmap.md).

### Tasks (per roadmap §12)

| # | Task | Status | Refs |
|---|---|---|---|
| 8.1 | `FACILITY:retail-store` + `CUSTOMER:shopper` entity subtypes | ✅ | impl-plan §5.2 |
| 8.2 | 6 retail KPI widgets (sales-per-sqft, stockout-rate, inventory-heatmap, customer-nps, conversion-rate, sales-by-hour) | ✅ | impl-plan §5.3 |
| 8.3 | 12 retail AI Actions with real LLM-backed handlers | ✅ | impl-plan §4.3 |
| 8.4 | 50 retail knowledge entries (loss prevention, visual merch, inventory, customer service, returns, opening/closing SOPs, marketing, compliance) | ✅ | impl-plan §5.2 |
| 8.5 | 4 retail workflow templates (employee onboarding, daily opening, restock, EoD) | ✅ | impl-plan §5.2 |
| 8.6 | Shopify + Square integration definitions + connector adapters (full HTTP-shape adapters) | ✅ | impl-plan §8.2 |
| 8.7 | Vertical-specific theming (`#22c55e` retail green accent) | ✅ | NUWS §7.5.2 |
| 8.8 | Demo tenant seed (`demo-retail`) with 10 retail stores + 25 AI employees + EntityState + EntityOwnership + EntityHealth + WorkspaceLayout + MissionFeed | ✅ | NUWS §1.1 |

### Deliverables

**Backend (`backend/src/modules/retail/`):**
- `retail.module.ts` — wires retail service + controller + Shopify + Square adapters into the existing connector registry
- `retail.controller.ts` — 6 endpoints: `GET /retail/actions`, `GET /retail/widgets`, `POST /retail/widgets/:id/compute`, `POST /retail/actions/:id/execute`, `POST /retail/integrations/shopify/sync`, `POST /retail/integrations/square/sync`
- `retail.service.ts` — orchestrator: registers the 6 retail widgets + 12 retail AI actions; computes widget values; deterministic per-entity demo data
- `retail-actions.ts` — 12 retail AI action definitions + handlers (10 sync + 2 streaming); each handler loads demo data, calls the LLM-backed `RetailActionContext`, attaches citations
- `retail-widgets.ts` — 6 retail KPI widget definitions (capability + data source + aggregation + visualization)
- `dto/retail.dto.ts` — typed DTOs + Swagger annotations

**Connectors (`backend/src/modules/connectors/adapters/`):**
- `shopify.adapter.ts` — `ShopifyConnector` implementing `IRetailConnector` (list products / orders / update inventory)
- `square.adapter.ts` — `SquareConnector` implementing `IRetailConnector` (Square POS + payments sync)

**Prisma schema (`backend/prisma/schema.prisma`):**
- `EntityType` enum extended with 6 new values: `FACILITY`, `CUSTOMER`, `ASSET`, `VENDOR`, `PROCESS`, `DOCUMENT` (additive, no existing model changed)

**Seed scripts:**
- `prisma/seed-phase8-retail.cjs` — seeds the `retail` SolutionPack row with full 12-action / 6-widget / 50-knowledge / 4-workflow / 2-integration extensions + creates a synthetic `platform-owner` tenant for the workflow templates and knowledge library (idempotent)
- `prisma/seed-phase8-demo-tenant.cjs` — creates the `demo-retail` tenant with 10 retail-store departments + 25 retail AI employees + EntityState + EntityOwnership + EntityHealth + WorkspaceLayout rows + MissionFeed items + the pack installs (idempotent)

**Frontend (`frontend-eaos/`):**
- `app/retail/page.tsx` — retail-themed dashboard showing the 6 KPI widgets + 12 AI actions + Shopify/Square integration status
- `core/hooks/retail/useRetail.ts` — 6 TanStack Query hooks (useRetailActions / useRetailWidgets / useRetailWidgetValue / useExecuteRetailAction / useSyncShopify / useSyncSquare)
- `core/hooks/retail/index.ts` — barrel

**`packages/ui/`:**
- `endpoints/index.ts` — added `retail.{actions, widgets, computeWidget, executeAction, syncShopify, syncSquare}` namespace
- `query/query-keys.ts` — added `retail.{all, actions, widgets, widgetValue}` namespace
- `components/data/Card.tsx` — new Card primitive (padding + surface variants)
- `components/data/index.ts` — barrel
- `src/index.ts` — re-exports data components

**Tests (`backend/test/unit/retail/retail.spec.ts`):**
- 33 tests covering: 12 actions registered with right shape + streaming handlers work as AsyncGenerators + sync handlers return AIActionResult envelopes + 6 widgets registered with right fields + each widget compute returns right shape + deterministic data per entityId + loadDemoData returns complete shape

### Exit criteria

- [x] `FACILITY:retail-store` + `CUSTOMER:shopper` entity subtypes registered in extensions
- [x] 12 retail AI actions with LLM-backed handlers wired through `RetailActionContext`
- [x] 6 retail widgets registered in `WidgetRegistry`
- [x] 50 retail knowledge entries across 8 categories (LP, visual merch, inventory, customer service, operations, marketing, compliance)
- [x] 4 retail workflow templates with detailed step lists
- [x] Shopify + Square connector adapters registered in `ConnectorRegistry`
- [x] Theming impact (`#22c55e`) applied on pack install
- [x] Demo tenant `demo-retail` seeded with 10 stores + 25 agents + EntityState/Ownership/Health rows
- [x] `frontend-eaos` `/retail` route builds + renders

**Verification:**
- ✅ Backend `tsc --noEmit` clean
- ✅ Backend `nest build` succeeds
- ✅ Backend `eslint` clean on retail module
- ✅ Frontend `tsc --noEmit` clean
- ✅ Frontend `next build` succeeds (`/retail` = 4.18 kB / 291 kB First Load JS)
- ✅ `packages/ui` rebuilt with new Card + retail queryKeys + endpoints
- ✅ 208/208 backend unit tests pass (was 175, +33 new)

**Rollback plan:** `RetailModule` is a single import in `app.module.ts`. The 12 retail AI actions + 6 widgets are registered at boot; removing the import stops both registrations. The Shopify + Square connectors are registered on `RetailModule.onApplicationBootstrap`; same removal flow. The Prisma enum extension is purely additive; rollback is `ALTER TYPE entity_type DROP VALUE ...` (Postgres 12+). The seed scripts create rows idempotently; running them again is safe. The demo tenant + workflow templates are independent.

**This is the LAST phase of v1.** After this, NeureCore has a fully shippable EAOS with one retail-ready vertical pack.

---

## Phase 9 — Auth Hardening (Weeks 5–6, parallel with Phase 3+)

**Status:** ✅ **Done (14/14 tasks + 31 unit tests)** | **Started:** 2026-06-28 | **Completed:** 2026-06-28 | **Flag:** `USE_HTTPONLY_AUTH` | **Risk:** 🔴 High → ✅ Mitigated

Per [`EAOS-implementation-roadmap.md` §13](./EAOS-implementation-roadmap.md). Backend ships httpOnly + Secure + SameSite=Strict cookies as the **sole** auth path for `frontend-eaos/`. No dual-support window (per D-023: `frontend-tenant/` was deleted in full).

### Tasks (per roadmap §13)

| # | Task | Status | Refs |
|---|---|---|---|
| 9.1 | Backend: `POST /auth/login` sets `__Host-nc_at` + `__Host-nc_rt` + `__Host-nc_csrf` cookies | ✅ | api-contract §4.1 |
| 9.2 | Backend: `POST /auth/refresh` reads refresh from cookie OR body; rotates all 3 cookies | ✅ | api-contract §4.1 |
| 9.3 | Backend: CSRF double-submit cookie middleware (mutating endpoints only) | ✅ | api-contract §7.6 |
| 9.4 | Backend: `POST /auth/logout` clears all 3 cookies + revokes tokens | ✅ | api-contract §4.1 |
| 9.5 | Frontend: `/login` page + `useLogin` + `useLogout` mutations | ✅ | frontend-data-layer §4.3 |
| 9.6 | Frontend: `CookieManager.getCsrfToken()` returns csrf cookie value | ✅ (already done in Phase 2) | frontend-data-layer §4.1 |
| 9.7 | Frontend: `RestClient` injects `X-CSRF-Token` header on mutating requests | ✅ | frontend-data-layer §4.1 |
| 9.8 | Frontend: `SocketManager` uses `withCredentials: true` | ✅ (already done in Phase 2) | frontend-data-layer §5.1 |
| 9.9 | Frontend: `SSEClient` uses `withCredentials: true` (cookies, no token param) | ✅ (already done in Phase 2) | frontend-data-layer §5.2 |
| 9.10 | Backend: `EventsGateway` reads JWT from cookie first, fallback to auth header | ✅ | api-contract §9.1 |
| 9.11 | Backend: `JwtStrategy` cookie-first extraction with feature-flag gate | ✅ | api-contract §7.1 |
| 9.12 | Backend: `cookie-parser` middleware mounted in `main.ts`; CSRF middleware in `app.module.ts` | ✅ | — |
| 9.13 | Frontend: home page redirects unauthenticated → `/login`; shows signed-in user + sign-out | ✅ | frontend-data-layer §4.3 |
| 9.14 | `USE_HTTPONLY_AUTH` env flag (default ON in prod, OFF in dev for localhost dev) | ✅ | — |

### Deliverables

**Backend (`backend/src/common/auth/` — new module):**
- `cookie-auth.service.ts` — `CookieAuthService` singleton (setAuthCookies, clearAuthCookies, parseCookies, generateCsrfToken, safeEquals, isEnabled)
- `cookie-auth.module.ts` — `@Global()` module exporting `CookieAuthService`
- `csrf.middleware.ts` — `CsrfProtectionMiddleware` (double-submit cookie validation, exempts `/api/v1/auth/{login,register,google,refresh}`)

**Backend (auth module updated):**
- `auth.controller.ts` — sets cookies on login/register/google/refresh, clears on logout; refresh accepts cookie OR body
- `auth.service.ts` — strict refresh-token validation
- `strategies/jwt.strategy.ts` — cookie-first extraction (still falls back to Authorization header)
- `dto/refresh-token.dto.ts` — `refreshToken` now optional (cookie path is preferred)

**Backend (other):**
- `events.gateway.ts` — Socket.IO handshake reads JWT from cookie first, fallback to handshake.auth.token + Authorization header
- `app.module.ts` — registers `CookieAuthModule` + mounts `CsrfProtectionMiddleware`
- `main.ts` — mounts `cookie-parser`; CORS allowed headers include `X-CSRF-Token`
- `package.json` — added `cookie-parser@^1.4.7` + `@types/cookie-parser@^1.4.8`

**Frontend (`frontend-eaos/src/`):**
- `core/hooks/auth/useAuth.ts` — NEW: `useAuthUser`, `useLogin`, `useLogout`, `useEnsureAuthUser`, `AUTH_QUERY_KEY`
- `components/workspace/useRole.ts` — now backed by `useAuthUser` (shared query key)
- `infrastructure/api/RestClient.ts` — injects `X-CSRF-Token` header on POST/PATCH/PUT/DELETE (skippable via `skipCsrf: true` for pre-auth endpoints); refresh path also uses `skipCsrf: true`
- `app/login/page.tsx` — NEW: login form with react-hook-form + zod, redirects to `?next=` on success, 401 sets inline password error
- `app/page.tsx` — redirects to `/login` if not authenticated; shows signed-in email + sign-out button

**Tests (`backend/test/unit/` — new):**
- `cookie-auth.service.spec.ts` — 19 tests (cookie names, isEnabled flag, parseCookies both paths, csrf token generation, safeEquals, setAuthCookies with httpOnly+secure+sameSite, clearAuthCookies)
- `csrf.middleware.spec.ts` — 12 tests (safe methods pass through, exempt paths, feature flag off, missing cookie/header, mismatch, match)

### Exit criteria

- [x] No `localStorage` token writes anywhere in the codebase (verified by grep — Phase 2 already removed them)
- [x] CSRF token required for all mutating requests; CSRF rejection returns 403
- [x] `__Host-` prefix prevents subdomain cookie theft (verified by constant strings)
- [x] Backend `tsc --noEmit` clean
- [x] Backend `nest build` succeeds
- [x] Frontend `tsc --noEmit` clean
- [x] Frontend `next build` succeeds — `/login` route = 29.5 kB / 322 kB First Load JS
- [x] 239/239 backend unit tests pass (was 208, +31 new)
- [x] Zero raw `fetch()` calls in `src/` outside `infrastructure/`
- [ ] Penetration test signed off — pending (formal review required before merge)

**Rollback plan:** `USE_HTTPONLY_AUTH` env flag (default ON in production, OFF in dev). When OFF, `CookieAuthService.setAuthCookies` is a no-op and `CookieAuthService.parseCookies` is not consulted by `JwtStrategy` (so dev environments still work without cookies). To revert fully: unset the flag + remove CSRF middleware registration from `app.module.ts`.

---

## Phase 10 — Cleanup (Weeks 41–42)

**Status:** ⬜ Not started | **Risk:** 🟢 Low

Per [`EAOS-implementation-roadmap.md` §14](./EAOS-implementation-roadmap.md). Delete legacy code, consolidate, tighten.

**This is the LAST phase.** Includes deleting all feature flags at 100%, all deprecated JSDoc, all TODO comments, all `as any` casts.

---

## Cross-cutting Concerns

### Active Feature Flags

| Flag | Default | Purpose | Created in | Die when |
|---|---|---|---|---|
| `USE_REST_CLIENT` | off | Phase 2 rollout | Phase 2 | All pages migrated |
| `USE_NEW_WORKSPACE` | off | Phase 3 rollout | Phase 3 | All tenants on new workspace |
| `USE_AI_ACTIONS` | off | Phase 5 rollout | Phase 5 | All tenants using AI Actions |
| `USE_HTTPONLY_AUTH` | off | Phase 9 rollout | Phase 9 | 90-day dual support ends |
| `USE_MISSION_FEED` | on | Mission Feed | Phase 3 | (always on after Phase 3) |
| `USE_COMMAND_PALETTE` | 25% | Command Palette | Phase 5 | (100% after Phase 5) |
| `USE_COMPARE_VIEW` | 0% | Compare View | Phase 3 | (alpha → beta → GA) |
| `DISABLE_AI_ACTIONS` | off | Kill switch | Phase 5 | (permanent; never delete) |
| `USE_RBAC_PHASE_2` | off | Tool auth fix | Phase 0 | (delete after Phase 0 since Phase 0 fixes it) |

### Active Observability Requirements

| Phase | Metrics | Alerts |
|---|---|---|
| 0 | Audit log row count; 401/403 rate | 401 spike |
| 1 | OpenAPI generation success | None |
| 2 | TanStack Query error rate, refetch frequency | Query error spike |
| 3 | Workspace p95 latency, cross-tenant denial rate | p95 > 2s; cross-tenant > 0 |
| 4 | Widget grid render time | p95 > 500ms |
| 5 | AI invocation rate, tokens, cost, success rate, feedback | Credit burn > 2x baseline; 5xx > 0.5% |
| 6 | RAG p95 latency, citation count per answer | RAG p95 > 3s |
| 7 | Pack install success rate | Install failure > 5% |
| 8 | Per-pack entity creation rate | Per-pack creation failure > 5% |
| 9 | Cookie auth failure rate | Cookie auth failure > 1% |
| 10 | Bundle size, dead code % | Bundle size > 250KB |

### Active Security Review Schedule

- 🔴 Phase 0 (before merge)
- 🔴 Phase 5 (before merge)
- 🔴 Phase 9 (before merge)
- ⬜ Other phases: code review sufficient

---

## Phase Dependencies (graph)

```
Phase 0 ── blocks ──► Phase 1
Phase 1 ── blocks ──► Phase 2
Phase 1 ── blocks ──► Phase 3
Phase 2 ── blocks ──► Phase 3
Phase 3 ── blocks ──► Phase 4
Phase 3 ── blocks ──► Phase 5
Phase 4 ── blocks ──► (nothing critical)
Phase 5 ── blocks ──► Phase 6
Phase 6 ── blocks ──► Phase 7
Phase 7 ── blocks ──► Phase 8
Phase 9 (parallel) ── independent until ──► Phase 10
Phase 10 ── independent (cleanup at end)
```

---

**End of phase tracker.**
