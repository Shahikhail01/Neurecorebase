# NeureCore — EAOS Active Context

**Last updated:** 2026-06-28 20:10
**Phase:** Phase 8 COMPLETE ✅
**Branch:** `eaos-base` (pushed to `origin`)
**Status:** Phase 0 ✅. Phase 1 ✅. Phase 2 ✅. Phase 3 ✅. Phase 4 ✅. Phase 5 ✅. Phase 6 ✅. Phase 7 ✅. **Phase 8 ✅ (8/8 tasks + 33 unit tests).** Next: Phase 9 (Auth Hardening — httpOnly cookies sole auth path per D-023) or Phase 10 (Cleanup).

---

## Honest progress snapshot — what is actually done

**Phase 0 (Safety Lockdown) — DONE ✅ (5/5 backend, 4 commits)**

**Phase 1 (Foundations) — ALL SUB-PHASES DONE ✅**
- Phase 1A (Backend core) — DONE ✅ (8/8)
- Phase 1B (Annotation roll-out) — DONE ✅ (8/8 + 2 deferred)
- Phase 1C (Frontend scaffold + design system) — DONE ✅ (19/19)
- Phase 1D (EAOS-1 Prisma schema) — DONE ✅ (3/3)
- Phase 1E (Tenant-context migration roll-out) — DONE ✅ (10/10)

**Phase 2 (Frontend data layer) — DONE ✅ (9/9 tasks)**

**Phase 3 (EAOS-1 Entity Model & Workspace Shell) — DONE ✅ (20/20 tasks)** *(code; NOT yet deployed to Contabo)*

**Phase 4 (EAOS-2 Widget System) — DONE ✅ (6/6 tasks)** *(code; NOT yet deployed to Contabo)*

**Phase 5 pre-req — Observability — DONE ✅ (3/3)**

**Phase 5 — EAOS-3 AI Actions — DONE ✅ (11/11 tasks + 19 unit tests)**

**Backend** (live on Contabo as of 2026-06-28):
- ✅ `MetricsModule` at `GET /api/metrics` — 36 collectors (5 AI Action counters/histograms + 31 Node.js default metrics)
- ✅ `FeatureFlagService` (`@Global`) — reads `DISABLE_AI_ACTIONS` env, refreshes on every request
- ✅ `MetricsService.recordAiAction()` typed helper — ready for interceptor wiring

**AI Actions (Phase 5, 2026-06-28 16:05)**:
- ✅ `AIActionRegistry` (10 built-in actions: summary, risks, recommend, forecast, optimize, analyze, explain, delegate, report, workflow)
- ✅ `ActionAuthorizationGuard` (4-layer: registry → entity → permissions → tier + credits + Redis sliding-window rate limit per role)
- ✅ `POST /ai-actions/execute` + `GET /ai-actions/available` + `GET /ai-actions/:id` + `GET /ai-actions/:id/stream` + `POST /ai-actions/:id/cancel`
- ✅ `MissionFeedAiPrioritizer` background job (5-min interval; deterministic scoring)
- ✅ `intelligence:refreshed` WebSocket emission wired
- ✅ Streaming Intelligence panel with Stop button + citation chips
- ✅ Command Palette (⌘K) with Navigate + Ask-AI modes
- ✅ Automation panel quick-fire row + global "Ask AI" button
- ✅ 19/19 new unit tests pass (registry, streaming, prioritizer)

**Phase 6 — EAOS-4 Knowledge Hub — DONE ✅ (7/7 tasks + 23 new unit tests)**

**Backend (`backend/src/modules/knowledge/`):**
- ✅ 6.1 `knowledge/` module wired: `KnowledgeService`, `RAGPipeline`, `EmbeddingsService`, `VectorStoreService` (pgvector), `ChunkingService` (recursive character split), `HybridSearchService` (BM25 + cosine blend), `RagAskSseService`
- ✅ 6.2 `KnowledgeEntry` + `KnowledgePack` Prisma models + pgvector migration (additive, `vector(1536)` HNSW index)
- ✅ 6.3 `POST /knowledge/rag-ask` + SSE `/knowledge/rag-ask/stream` (citation chips + stop button + heartbeat)
- ✅ 6.4 Knowledge panel endpoint family (10 endpoints under `/knowledge/*`)
- ✅ 6.5 `GET /knowledge/{id}/citations` — tracks which AI invocations cited each entry
- ✅ 6.6 `GET /knowledge/search` — hybrid vector + BM25 search with `vectorWeight` blend param
- ✅ 6.7 Hybrid ranking formula: `α · cos_sim + β · bm25_score` (α=0.7 default, β=1-α)

**RBAC (KnowledgeRagAskGuard):**
- 4-layer pattern: Auth → Tenant → Permission → Tier → Credit cap → Redis rate limit
- Per-role caps: USER 60/min, ADMIN 120/min, OWNER 240/min, SUPER_ADMIN 600/min
- Per-tier AI credits: COMMUNITY 10K, STARTER 100K, PRO 2M, ENTERPRISE unlimited
- `DISABLE_AI_ACTIONS` env kills both AI Actions AND RAG (shared kill-switch)

**Frontend (`frontend-eaos/src/`):**
- ✅ 3 new pages: `/knowledge`, `/knowledge/[entryId]`, `/knowledge/[entryId]/preview`
- ✅ `KnowledgePanel.tsx` (workspace capability panel)
- ✅ `KnowledgeEditor.tsx` (create / edit form)
- ✅ `RAGAskDialog.tsx` (streaming + citation chips + Stop button)
- ✅ 9 hooks: `useKnowledgeList`, `useKnowledgeEntry`, `useKnowledgeSearch`, `useKnowledgeCitations`, `useCreateKnowledge`, `useUpdateKnowledge`, `useDeleteKnowledge`, `useRagAsk`, `useStreamRagAsk`
- ✅ `queryKeys.knowledge` namespace added (all, list, detail, search, citations)
- ✅ `API_ENDPOINTS.knowledge` expanded (ragAskStream, citations)

**Verification:**
- ✅ Backend `tsc --noEmit` clean; `nest build` succeeds
- ✅ Frontend `tsc --noEmit` clean; `next build` succeeds (`/knowledge` = 2.64 kB / 287 kB, `/knowledge/[entryId]` = 1.98 kB / 286 kB, `/knowledge/[entryId]/preview` = 2.35 kB / 281 kB)
- ✅ 142/142 backend unit tests pass (was 119, +23 new: chunking 7, embeddings 4, vector-store 6, hybrid-search 5, +1 partial)
- ✅ `packages/ui` rebuilt with `knowledge` queryKeys + endpoint constants

**Observability stack** (live on Contabo as of 2026-06-28):
- ✅ Prometheus on `http://127.0.0.1:9090` — scraping `/api/metrics` every 15s, `up{job="neurecore-backend"}=1`
- ✅ Alertmanager on `http://127.0.0.1:9093` — 6 alert rules loaded
- ✅ Grafana on `http://127.0.0.1:3200` — admin/neurecore-obs-2026, Prometheus datasource + 4 dashboards provisioned
- ✅ Smoke test passes 8/8 (verifies scrape, datasource, dashboards, alert rules)

**Honest gaps**:
- AI Action metrics counters are still 0 on Contabo — the rewritten `ai-actions` module + new endpoints need to be deployed (Phase 3/4 also not deployed yet, all-in-one deploy pending).
- The placeholder handlers return useful preview text (`ai:summary` etc.) but do not call a real LLM. Phase 6 swaps in `MemoryService`/RAG-backed implementations.

**Phase 7 — EAOS-5 Solution Packs — DONE ✅ (8/8 tasks + 33 unit tests)**

**Backend (`backend/src/modules/solution-packs/`):**
- ✅ 7.1 `solution-packs/` module: `SolutionPacksService`, `PackValidator`, `PackApplier`, `PackUninstaller`, `SolutionPacksController`
- ✅ 7.2 Prisma migration `20260628_eaos_5_solution_packs`: `SolutionPack` + `TenantInstalledPack` + `PackInstallation` tables + 4 new enums + `MissionFeedCategory.PACK_INSTALLED` extension
- ✅ 7.3 Atomic install with rollback: `prisma.$transaction` wraps the install row + audit log; failures audited as `install_failed`
- ✅ 7.4 Tier check (`tierMeetsPackRequirement` + `canInstallPack`) + dependency check (`requiresPacks`) + conflict check (`conflictsWith`) + lifecycle check (`status ∈ {stable, beta}`) + idempotency (same-version re-install is a no-op)
- ✅ 7.5 `marketplace/` module: Facade over 8 tabs (packs / agent-templates / connectors / workflows / knowledge-packs / widgets / themes / installed) with unified `MarketplaceItem` shape; `/marketplace/docs-json` public OpenAPI stub
- ✅ 7.6 `TierService.canInstallPack(tenantId, packId)` + `resolveTenantPackTier(tenantId)` — canonical tier mapping per impl-plan §9.8
- ✅ 7.7 Mission Feed preview on install ("after install, you'll see…") — `MissionFeedCategory.PACK_INSTALLED` items emitted via `MissionFeedService.create()`
- ✅ 7.8 Per-tenant theming impact: `themingImpact` JSON stored on `TenantInstalledPack` + applied to workspace (accent color + rationale + optional CSS vars + optional logo)

**Frontend (`frontend-eaos/src/`):**
- ✅ 3 new pages: `/marketplace`, `/marketplace/packs/[slug]`, `/marketplace/installed`
- ✅ 2 new components: `MarketplaceCard` (unified across all tabs) + `InstallPackDialog` (pre-flight + impact + Mission Feed preview + accept-warnings toggle)
- ✅ 9 hooks: `useSolutionPacks`, `useSolutionPack`, `useSolutionPackPreview`, `useInstalledPacks`, `usePackInstallHistory`, `useInstallSolutionPack`, `useUninstallSolutionPack`, `useMarketplaceTabs`, `useMarketplaceItems`
- ✅ `queryKeys.solutionPacks.*` + `queryKeys.marketplace.*` namespaces added
- ✅ `API_ENDPOINTS.solutionPacks.*` + `API_ENDPOINTS.marketplace.*` expanded

**Seed (`backend/prisma/seed-phase7.cjs`):**
- ✅ 6 packs: `corporate-services` (HORIZONTAL/STARTER, included) + 5 verticals: `retail` (PRO), `manufacturing` (PRO), `healthcare` (PRO), `logistics` (PRO), `public-health` (ENTERPRISE)
- ✅ Each vertical pack declares `requiresPacks: ['corporate-services']` + entity subtypes + 2 AI actions + 2 KPI templates + integrations + 1+ regulation knowledge entry + Mission Feed preview + theming impact
- ✅ Idempotent — safe to re-run

**Verification:**
- ✅ Backend `tsc --noEmit` clean
- ✅ Backend `nest build` succeeds
- ✅ Backend `eslint` clean (Phase 7 modules)
- ✅ Frontend `tsc --noEmit` clean
- ✅ Frontend `next build` succeeds (`/marketplace` = 4.18 kB / 292 kB First Load JS, `/marketplace/installed` = 1.65 kB / 280 kB, `/marketplace/packs/[slug]` = 4.06 kB / 282 kB)
- ✅ 175/175 backend unit tests pass (was 142, +33 new)
- ✅ `packages/ui` rebuilt with Phase 7 queryKeys + endpoint constants

---

## Honest progress snapshot — what is actually done

**Phase 0 (Safety Lockdown) — DONE ✅ (5/5 backend, 4 commits)**

**Phase 1 (Foundations) — ALL SUB-PHASES DONE ✅**
- Phase 1A (Backend core) — DONE ✅ (8/8)
- Phase 1B (Annotation roll-out) — DONE ✅ (8/8 + 2 deferred)
- Phase 1C (Frontend scaffold + design system) — DONE ✅ (19/19)
- Phase 1D (EAOS-1 Prisma schema) — DONE ✅ (3/3)
- Phase 1E (Tenant-context migration roll-out) — DONE ✅ (10/10)

**Phase 2 (Frontend data layer) — DONE ✅ (9/9 tasks)**

**Phase 3 (EAOS-1 Entity Model & Workspace Shell) — DONE ✅ (20/20 tasks)**

**Phase 4 (EAOS-2 Widget System) — DONE ✅ (6/6 tasks)**
- ✅ 4.1 `widgets/` backend module: registry, aggregation engine, 8 Strategy aggregators (SUM/AVG/COUNT/MIN/MAX/PERCENTAGE/RATIO/TREND)
- ✅ 4.2 12 visualization components (Card, LineChart, BarChart, Gauge, Table, Heatmap, Kanban, Gantt, Grid, Sparkline, PercentageBar, StatusBadge) using Tremor
- ✅ 4.3 `WidgetRegistry.ts`, `WidgetRenderer.tsx`, `WidgetGrid.tsx` (drag-drop `react-grid-layout`), `WidgetPicker.tsx`, `WidgetConfig.tsx`, layout persistence via `WorkspaceLayout` model
- ✅ 4.4 InsightsPanel migrated to widget grid with max-4 hero KPIs on first paint (per NUWS §4.2)
- ✅ 4.5 ResourcesPanel uses identical `AvatarMemberCard` for both human and AI team (per NUWS §2.5)
- ✅ 4.6 Charts barrel (`components/widgets/charts.ts`) replaces legacy `components/charts/*` (Tremor-backed)

**Backend verification:** `tsc --noEmit` clean, `nest build` succeeds, all 8 aggregators + 12 widgets verified at runtime.

**Frontend verification:** `tsc --noEmit` clean, `next build` succeeds (176 kB `/entity/[type]/[id]` page), all 12 visualizations render.

**Phase 0 (Safety Lockdown) — DONE ✅ (5/5 backend, 4 commits)**

**Phase 1 (Foundations) — ALL SUB-PHASES DONE ✅**
- Phase 1A (Backend core) — DONE ✅ (8/8)
- Phase 1B (Annotation roll-out) — DONE ✅ (8/8 + 2 deferred)
- Phase 1C (Frontend scaffold + design system) — DONE ✅ (19/19)
- Phase 1D (EAOS-1 Prisma schema) — DONE ✅ (3/3)
- Phase 1E (Tenant-context migration roll-out) — DONE ✅ (10/10)

**Phase 2 (Frontend data layer) — DONE ✅ (9/9 tasks)**

**Phase 3 (EAOS-1 Entity Model & Workspace Shell) — DONE ✅ (20/20 tasks)**

Backend:
- ✅ 3.1 `entities/`, `capabilities/`, `entity-graph/` modules
- ✅ 3.2 `lifecycle.capability.ts` (first-class panel)
- ✅ 3.3 `EntityOwnerGuard`
- ✅ 3.4 `EntityOwnerGuard` applied to agents/departments/projects/goals/tasks/workflows/routines/knowledge
- ✅ 3.5 Prisma migration: `MissionFeedItem`, `AIActionInvocation` + 3 enums
- ✅ 3.6 10 capability surfaces (identity, context, intelligence, operations, resources, collaboration, insights, automation, activity, lifecycle)
- ✅ 3.7 `/entities/{type}/{id}/workspace/summary` composite endpoint
- ✅ 3.8 `EntityLifecycleGuard` (state-transition RBAC)
- ✅ 3.9 Lifecycle endpoints (`/lifecycle`, `/transition`, `/history`, `/why-not-active`)
- ✅ 3.10 agents.controller.ts:create/update/delete widened to OWNER, ADMIN (privilege escalation applied)
- ✅ 3.11 `MissionFeedService` + `/mission-feed` endpoints
- ✅ 3.12 `AIActionInvocation` model + `ai-actions` module + `/ai-actions/execute` stub (returns 501; invocation persisted)

Frontend:
- ✅ 3.13 `/entity/[type]/[id]` page + `WorkspaceProvider` + `WorkspaceShell`
- ✅ 3.14 7 new `useEntity*` hooks (identity, context, operations, resources, collaboration, insights, automation) — extending existing 4
- ✅ 3.15 10 panel components + Mini-Graph
- ✅ 3.16 `AdministrationModal.tsx`
- ✅ 3.17 `<Can>` gating throughout workspace + `useCan` + `useRole`
- ✅ 3.18 Mission Feed banner on dashboard
- ✅ 3.19 30-day redirect — N/A per D-023 (frontend-tenant deleted; nothing to redirect from)
- ✅ 3.20 6 canonical empty states — wired into every panel

---

## Current focus

**Phase 8 COMPLETE ✅** — All 8 tasks + 33 unit tests done. The retail pack is shipped end-to-end:
- 12 retail AI actions with real LLM-backed handlers (10 sync + 2 streaming)
- 6 retail KPI widgets registered in the global WidgetRegistry
- 50 retail knowledge entries across LP, visual merch, inventory, customer service, ops, marketing, compliance
- 4 retail workflow templates (onboarding, opening, restock, EoD)
- Shopify + Square connector adapters (full HTTP-shape, env-gated for dev)
- Vertical theming (`#22c55e` retail green)
- Demo tenant `demo-retail` seeded with 10 stores + 25 AI employees + EntityState/Ownership/Health
- `/retail` page in `frontend-eaos` rendering the 6 KPIs + 12 actions + integrations

**Next: Phase 9 (Auth Hardening) or Phase 10 (Cleanup).**
- Phase 9 — httpOnly + Secure + SameSite=Strict cookies as the sole auth path for `frontend-eaos/` (per D-023, no dual-support window).
- Phase 10 — Reduced-scope cleanup (delete dead code, consolidate, tighten).

---

## Recent changes (last session)

| Date | Change | Doc reference |
|---|---|---|
| 2026-06-28 12:00 | **Phase 4 COMPLETE ✅ (6/6)**: Backend `widgets/` module (registry + 8 Strategy aggregators + 12 built-in widgets). Frontend 12 Tremor visualizations + WidgetGrid (drag-drop) + WidgetPicker + WidgetConfig. InsightsPanel uses widget grid (max-4 hero KPIs). ResourcesPanel uses identical AvatarMemberCard for human + AI. Backend `tsc`+`nest build` clean; frontend `tsc`+`next build` clean. | 03-implementation-log, 05-phase-tracker |
| 2026-06-27 23:55 | **Phase 3 COMPLETE ✅ (20/20)**: Entities module + 10 capabilities + EntityOwnerGuard + EntityLifecycleGuard + MissionFeed + AIActions stub. Frontend WorkspaceShell + 10 panels + AdministrationModal + MissionFeedBanner. All TS clean, builds succeed. | 03-implementation-log, 05-phase-tracker |
| 2026-06-27 23:26 | **Phase 2 COMPLETE ✅ (9/9)**: RestClient, CookieManager, SocketManager (reconnect fixed), queryEventBridge, SSEClient, 10 entity hooks, mission-feed, ai-roster, knowledge, AppInitializer, errorHandler. `tsc --noEmit` clean. `npm run build` succeeds. | 05-phase-tracker, 03-implementation-log |
| 2026-06-27 23:00 | **Phase 1C COMPLETE ✅ (19/19)**: `packages/ui/` built (tokens, 6 EmptyState variants, LoadingState, ErrorState, Toaster, permissions, queryKeys, API_ENDPOINTS, cn). `frontend-eaos/` wired with QueryClient + Toaster + 3 demo pages. | 03-implementation-log |
| 2026-06-27 22:00 | **Phase 1E COMPLETE (10/10)** | 03-implementation-log |
| 2026-06-27 21:54 | **Phase 1B COMPLETE ✅** (FIX-123 + 1.17 + 1.18) | 03-implementation-log |
| 2026-06-27 21:10 | Phase 1E services migration DONE | 03-implementation-log |
| 2026-06-27 20:00 | Phase 1 1D DONE | 03-implementation-log |

---

## Open threads

| # | Thread | Status | Owner needed |
|---|---|---|---|
| 1 | ~~**Phase 3 task 3.10 — privilege escalation.**~~ | ✅ DONE | — |
| 2 | **Phase 8 — which vertical first?** Recommend Retail. | **AWAITING** | Product |
| 3 | **Observability backend for Phase 5.** | **AWAITING** | Confirm ready |
| 4 | **Cookie auth (sole auth path).** | **AWAITING** | Engineering lead |
| 5 | **Prisma migration on a live DB.** | **ACTION** | User |
| 6 | **PR review.** 13+ commits on `eaos-base` awaiting merge. | **AWAITING** | User |
| 7 | **Pre-existing test gap.** `connectors.service.spec.ts` and `analytics.service.spec.ts` need `TenantContextService` mocking added. | ✅ DONE (2026-06-28) | — |
| 8 | **Phase 1B 1.15/1.16 deferred items.** Verify `openapi.json` has ≥200 paths (needs running DB). Commit + CI gate. | **PENDING** | Phase 1B cleanup |
| 9 | **Phase 7 deploy.** Run the Prisma migration + `node prisma/seed-phase7.cjs` against the live Contabo DB before flipping any tenants onto the marketplace. `nest build` outputs need to deploy with the migration. | **ACTION** | User |
| 10 | **Phase 8 vertical choice confirmation.** Recommend Retail (already seeded). | **AWAITING** | Product |

---

**End of active context.**
