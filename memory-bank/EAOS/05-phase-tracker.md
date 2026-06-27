# NeureCore — EAOS Phase Tracker

**Last updated:** 2026-06-27 15:57
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
| 0 | Safety Lockdown | Fix backend security gaps | 1 | 🟡 In progress (2/5 done) | 2026-06-27 | — |
| 1 | Foundations + `frontend-eaos` scaffold | OpenAPI, tokens, schemas, contract tests, **new app bootstrap**, `packages/ui` extraction | 2 | ⬜ Not started | — | — |
| 2 | Frontend data layer | TanStack Query + design tokens + permission hooks (in `frontend-eaos`; smaller scope) | 1–2 | ⬜ Not started | — | — |
| 3 | EAOS-1 entity model | Universal entity workspace (10 panels + modal) | 6 | ⬜ Not started | — | — |
| 4 | EAOS-2 widgets | Widget registry + per-panel visualizations | 4 | ⬜ Not started | — | — |
| 5 | EAOS-3 AI Actions | Ask AI surfaces + ActionAuthorizationGuard | 4 | ⬜ Not started | — | — |
| 6 | EAOS-4 Knowledge Hub | RAG pipeline + KnowledgeEntry model | 4 | ⬜ Not started | — | — |
| 7 | EAOS-5 Solution Packs | Marketplace + install lifecycle | 6 | ⬜ Not started | — | — |
| 8 | EAOS-6 Vertical Pack #1 | First industry pack (Retail recommended) | 8–10 | ⬜ Not started | — | — |
| 9 | Auth hardening (sole auth path) | httpOnly cookies + CSRF — **ships as the only auth, no dual support** | 2 | ⬜ Not started | — | — |
| 10 | Cleanup (reduced scope) | Delete legacy data stores, dead code, feature flags at 100% | 1 | ⬜ Not started | — | — |

---

## Phase 0 — Safety Lockdown (Week 1)

**Goal:** Close every active security gap. **No new features, no refactors.**

**Status:** 🟡 In progress (2/5 backend tasks done)
**Started:** 2026-06-27
**Target completion:** —
**Branch:** `eaos-base`
**Risk:** 🔴 High

### Tasks

#### Backend

- ✅ 0.1: Delete `backend/src/modules/security/guards/roles.guard.ts` and `security.types.ts:UserRole`/`Permission`/`ROLE_PERMISSIONS` (commit `c00dff57`)
- ✅ 0.2: Add `JwtAuthGuard` + `@Roles()` to `tools.controller.ts:execute`, `:execute/:id`, `:id/status` (commit `c00dff57`)
- ⬜ 0.3: Add session-ownership check to `agent-streaming.controller.ts:71-132` SSE
- ⬜ 0.4: Wire `AuditInterceptor` to `AuditService.log()` for all `POST/PATCH/DELETE`
- ⬜ 0.5: Add explicit `entity.tenantId === user.tenantId` check to all `findOne` methods

#### Frontend (ELIMINATED per D-023)

- ⛔ 0.6: ~~Fix wrong-token-key bug in 11+ files~~ — **ELIMINATED** (frontend-tenant deleted)
- ⛔ 0.7: ~~Wire `<Toaster />` to existing `ToastStrategy`~~ — **ELIMINATED** (frontend-tenant deleted)

### Exit criteria

- ✅ `grep -r "execute" backend/src/modules/tools/tools.controller.ts` shows every method has a guard
- ✅ `security/guards/roles.guard.ts` does not exist
- ⬜ SSE rejects mismatched `userId` with 403
- ⬜ `AuditLog` DB table has > 0 rows from a test mutating request
- ⬜ Tenant isolation helper deployed + applied to ≥ 1 critical `findOne` endpoint
- ⬜ tsc passes
- ⬜ Manual test: 403 returned for cross-tenant SSE attempt

### Rollback plan

All changes are small and additive (guards, listeners). If something breaks, remove the guard/listener in a hotfix.

### Notes

- See [`04-fixes-tracker.md` FIX-001 through FIX-007](./04-fixes-tracker.md) for details on each task.
- Tasks 0.6 and 0.7 are intentionally skipped in `frontend-tenant/` (frozen) and are N/A in `frontend-eaos/` (built correctly from day 1).

---

## Phase 1 — Foundations + `frontend-eaos` Scaffold (Weeks 2–3)

**Goal:** Make the contract docs enforceable. Every subsequent phase depends on this. **Also bootstrap the new `frontend-eaos/` app and `packages/ui/` shared library.**

**Status:** ⬜ Not started
**Started:** —
**Target completion:** —
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

**Status:** ⬜ Not started | **Flag:** `USE_REST_CLIENT`

Tasks, exit criteria, and rollback per [`EAOS-implementation-roadmap.md` §6](./EAOS-implementation-roadmap.md).

**Blocks:** Phase 3.

---

## Phase 3 — EAOS-1 Entity Model & Workspace Shell (Weeks 7–12)

**Status:** ⬜ Not started | **Flag:** `USE_NEW_WORKSPACE` | **Risk:** 🔴 High

Largest, riskiest phase. 6 weeks, 2 pairs of engineers. Per [`EAOS-implementation-roadmap.md` §7](./EAOS-implementation-roadmap.md).

**Blockers:**
- 🔴 **Task 3.10 (privilege escalation)** — widening agent create/update/delete to include `OWNER, ADMIN` needs product + security sign-off. Cannot start until approved.

**Blocks:** Phases 4, 5.

---

## Phase 4 — EAOS-2 Widget System (Weeks 13–16)

**Status:** ⬜ Not started | **Flag:** tied to Phase 3

Per [`EAOS-implementation-roadmap.md` §8](./EAOS-implementation-roadmap.md). Most code reuses Phase 3 panels.

**Blocks:** nothing critical.

---

## Phase 5 — EAOS-3 AI Actions (Weeks 17–20)

**Status:** ⬜ Not started | **Flag:** `USE_AI_ACTIONS` | **Risk:** 🔴 High

Per [`EAOS-implementation-roadmap.md` §9](./EAOS-implementation-roadmap.md). **Observability must land BEFORE the feature.**

**Pre-reqs:**
- 🔴 AI Action invocation metrics flowing to observability backend
- 🔴 Per-tenant credit cap implemented
- 🔴 Per-user rate limits implemented
- 🔴 `DISABLE_AI_ACTIONS` kill-switch flag deployable in < 5 min
- ⬜ Security review scheduled

**Blocks:** Phase 6 (RAG uses AI Actions internally).

---

## Phase 6 — EAOS-4 Knowledge Hub (Weeks 21–24)

**Status:** ⬜ Not started

Per [`EAOS-implementation-roadmap.md` §10](./EAOS-implementation-roadmap.md). Pre-reqs: Phase 5 done + `MemoryService` split.

**Note:** pgvector migration is the first Prisma migration that changes storage shape. Must use additive-then-subtractive pattern.

**Blocks:** Phase 7.

---

## Phase 7 — EAOS-5 Solution Packs (Weeks 25–30)

**Status:** ⬜ Not started

Per [`EAOS-implementation-roadmap.md` §11](./EAOS-implementation-roadmap.md). Marketplace + install/uninstall lifecycle.

**Blocks:** Phase 8.

---

## Phase 8 — EAOS-6 First Vertical Pack (Weeks 31–40)

**Status:** ⬜ Not started | **Recommended:** Retail pack

Per [`EAOS-implementation-roadmap.md` §12](./EAOS-implementation-roadmap.md).

**Blockers:**
- 🔴 Vertical choice confirmation (recommend Retail)

**This is the LAST phase of v1.**

---

## Phase 9 — Auth Hardening (Weeks 5–6, parallel with Phase 3+)

**Status:** ⬜ Not started | **Flag:** `USE_HTTPONLY_AUTH` | **Risk:** 🔴 High

Per [`EAOS-implementation-roadmap.md` §13](./EAOS-implementation-roadmap.md). Switches to httpOnly + Secure + SameSite=Strict cookies. 90-day dual support.

**Pre-reqs:**
- ⬜ Security review (formal sign-off)
- ⬜ All existing tokens can be invalidated (or migrated) without user impact

**Runs in parallel with Phase 3+** because dual-support is 90 days.

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
