# NeureCore — EAOS Frontend Data Layer Specification

**Document Version:** 1.2
**Date:** 2026-06-27
**Status:** EAOS Frontend Data Layer Spec — binding for `frontend-eaos/`
**Audience:** Frontend, Backend (for contract alignment), QA
**Supersedes:** v1.1 (D-023: `frontend-tenant/` deleted in full per no production users / no release. The "frozen" intermediate state and 90-day redirect are obsolete. Single tenant frontend. The backend ships httpOnly cookies as the **sole** auth path for `frontend-eaos/` — no dual-support window, no `Authorization: Bearer` fallback needed.)
**Related:** `EAOS-api-contract.md` v1.0, `EAOS-rbac-model.md` v1.0, `EAOS-NUWS-principles.md` v1.4, `EAOS-implementation-plan.md` v2.8

---

## 0. Purpose

This document specifies the **frontend data layer** for NeureCore: the libraries, patterns, and conventions for fetching, caching, mutating, streaming, and reacting to server data. It is written *after* a thorough audit of the existing frontend (2026-06-27) which found:

- A half-finished migration from a legacy `api.ts` Axios singleton to a new "SOLID-clean" `RestClient` + repository layer.
- Two parallel HTTP clients, two parallel Socket.IO wrappers, two parallel `ApiResponse<T>` types, two parallel error systems.
- No canonical data-fetching library (no TanStack Query, no SWR). Every page re-implements `loading`/`error`/`refetch` with `useState` + `useEffect` + `useCallback`.
- Token storage in `localStorage` (XSS-vulnerable), with **wrong-key bugs** silently sending unauthenticated requests from 11+ files.
- A working `CacheManager` and `EventBus` that are partially redundant with what TanStack Query provides out of the box.
- 12 Zustand stores, all hand-rolled, all with their own `loading`/`error` state.

This spec **completes the migration** the codebase has already started — but **in a new app (`frontend-eaos/`) per D-022**, not in-place. The old `frontend-tenant/` is frozen; all new code lands in `frontend-eaos/`. The new app standardizes on **TanStack Query v5** as the single data-fetching library, keeps **Zustand** for UI-only state, ships **httpOnly cookies** from day 1 (no localStorage), and consumes a shared **`packages/ui/`** package for design tokens, components, permission hooks, and query keys.

---

## 0a. Document Relationships

```
EAOS-api-contract.md        ──►  HTTP + WebSocket + SSE wire format
EAOS-rbac-model.md          ──►  useCan / <Can> / useRole (Section 10)
EAOS-NUWS-principles.md     ──►  WorkspaceShell loading behavior, streaming, Mission Feed
EAOS-implementation-plan.md ──►  File structure for the new data layer
EAOS-frontend-data-layer.md ──►  (this document — the canonical data layer spec)
```

---

## 1. Stack (Locked)

| Concern | Library | Version | Rationale |
|---|---|---|---|
| Data fetching (server state) | **TanStack Query** (`@tanstack/react-query`) | `^5.59` | Best DevTools, `useInfiniteQuery` for future, symmetric mutation/invalidation. See §3. |
| HTTP client | **Axios** via existing `RestClient` | `^1.7` | Already in use; the new `core/services/api/clients/RestClient.ts` is the binding wrapper. |
| WebSocket client | **Socket.IO client** via existing `SocketManager` | `^4.8` | Already in use; the new `core/infrastructure/socket/SocketManager.ts` is binding. |
| UI state (local) | **Zustand** | `^5.0` | Already in use. Use for ephemeral UI state only (modals, sidebars, form drafts). |
| Forms | **react-hook-form** + **zod** | `^7.53` / `^3.23` | New. The codebase has 50+ hand-rolled `useState` forms; this is a Tier 1 cleanup. |
| Date utilities | `date-fns` | `^4.1` | Already in use. |
| Charts | **Tremor** | latest | Locked in `EAOS-implementation-plan.md` §14.2 Q7. Replaces ad-hoc Recharts. |
| Icons | **Lucide** | latest | Locked in `EAOS-implementation-plan.md` v2.6. |
| Theme / dark mode | **next-themes** | latest | Locked in `EAOS-implementation-plan.md` v2.6. |
| Validation schemas | **zod** | `^3.23` | New. Used both client-side (forms) and for runtime validation of API responses. |
| OpenAPI client codegen | **openapi-typescript** | `^7` | New. Generates `ApiResponse` types from the OpenAPI artifact (`EAOS-api-contract.md` §11). |
| **NOT installed:** | | | |
| — `swr` | — | — | TanStack Query wins. |
| — `redux` / `@reduxjs/toolkit` | — | — | Zustand covers our needs. |
| — `jotai` / `recoil` | — | — | Same. |
| — `react-virtuoso` / `react-window` | — | — | TBD in §11 (Tier 2). |
| — `msw` | — | — | TBD in §12 (Tier 2). |

---

## 2. HTTP Client

### 2.1 The single HTTP client: `RestClient`

**The legacy `src/services/api.ts` is retired.** Every fetch in the app goes through the new `core/services/api/clients/RestClient.ts` (existing at `frontend-tenant/src/core/services/api/clients/RestClient.ts:1-160`).

```typescript
// core/services/api/clients/RestClient.ts (binding)
export class RestClient implements IApiClient {
  async get<T>(path: string, config?: RequestConfig): Promise<T>;
  async post<T>(path: string, body?: unknown, config?: RequestConfig): Promise<T>;
  async patch<T>(path: string, body?: unknown, config?: RequestConfig): Promise<T>;
  async put<T>(path: string, body?: unknown, config?: RequestConfig): Promise<T>;
  async delete<T>(path: string, config?: RequestConfig): Promise<T>;

  // Streaming (LLM agent output, AI Actions)
  stream<T>(path: string, body: unknown, onChunk: (chunk: T) => void, signal?: AbortSignal): Promise<void>;

  // SSE (AI streaming — see §5.2)
  openSSE(path: string, onEvent: (e: SSEEvent) => void, signal?: AbortSignal): () => void;
}
```

**Why the new client wins over the legacy:**

| Capability | Legacy `api.ts` | New `RestClient` |
|---|---|---|
| Timeout | ❌ None | ✅ 30s default, configurable |
| 401 refresh race | ❌ Fires N parallel refreshes | ✅ Serialized `refreshInFlight` Promise |
| `AbortController` | ❌ Not threaded | ✅ Signal propagated |
| Streaming | ❌ | ✅ `stream()` + `openSSE()` |
| Typed errors | ⚠️ Partial | ✅ Throws `AppError` with `code` |
| Interface | ❌ Concrete class | ✅ `IApiClient` interface (DI-swappable) |

### 2.2 Base URL & environment

```typescript
// config/api.config.ts (binding)
export const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1',
  socketURL: process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:3000',
  timeoutMs: 30_000,
  retry: { maxRetries: 2, retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000) },
  defaultHeaders: { 'Content-Type': 'application/json', Accept: 'application/json' },
} as const;
```

**No hardcoded URLs in components.** Always `import { API_CONFIG }` or `import { API_ENDPOINTS }`.

### 2.3 Endpoint registry

```typescript
// shared/constants/api-endpoints.ts (existing, expanded to all EAOS endpoints per EAOS-api-contract.md §8)
export const API_ENDPOINTS = {
  // EAOS workspace
  ENTITY: {
    BASE: (type: string, id: string) => `/entities/${type}/${id}`,
    WORKSPACE_SUMMARY: (type: string, id: string) => `/entities/${type}/${id}/workspace/summary`,
    INTELLIGENCE: (type: string, id: string) => `/entities/${type}/${id}/intelligence`,
    LIFECYCLE: (type: string, id: string) => `/entities/${type}/${id}/lifecycle`,
    LIFECYCLE_TRANSITION: (type: string, id: string) => `/entities/${type}/${id}/lifecycle/transition`,
    ACTIVITY: (type: string, id: string) => `/entities/${type}/${id}/activity`,
    HEALTH: (type: string, id: string) => `/entities/${type}/${id}/health`,
  },
  // ... per EAOS-api-contract.md §8
} as const;
```

**All path construction goes through `API_ENDPOINTS`.** No inline `'/agents/${id}'` strings.

### 2.4 Interceptors

| Interceptor | Status | Notes |
|---|---|---|
| Auth header (`Authorization: Bearer`) | **In `RestClient`** | Reads from `TokenManager` |
| 401 → refresh → retry | **In `RestClient`** | Serialized |
| Request correlation ID (`X-Request-ID`) | **Add** | UUID v4 per request. Echoed in response. |
| Error normalization | **In `RestClient`** | Throws `AppError(code, message, details)` |
| Global retry (5xx, network) | **Add** | 2 retries with exponential backoff |
| Request cancellation (`AbortController`) | **In `RestClient`** | All methods accept `signal` |
| Global error toast | **Add** (Tier 1) | Wire `NotificationService` to actual `<Toaster />` |
| Telemetry (request duration, error rate) | **Add** (Tier 2) | Send to observability backend |

### 2.5 Request lifecycle

```
Component: useQuery({ queryKey, queryFn })
  ↓
TanStack Query: call queryFn
  ↓
queryFn: () => restClient.get<DepartmentResponseDto>('/departments/abc')
  ↓
RestClient: axios.get with auth header, timeout, signal
  ↓
Backend: response with envelope { status: 'success', data: <DepartmentResponseDto>, meta: {...} }
  ↓
RestClient: unwrap envelope, return data
  ↓
queryFn: validate against zod schema (in dev only)
  ↓
TanStack Query: cache, return
  ↓
Component: { data, isLoading, error } — re-render
```

---

## 3. TanStack Query — The Single Data-Fetching Library

This is the **largest change** in this spec. The current state of every page re-implementing `loading`/`error`/`refetch` is replaced.

### 3.1 Provider

```typescript
// app/providers.tsx (new, in src/app/)
'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,           // 30s fresh
      gcTime: 5 * 60_000,          // 5min garbage collection
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: true,
    },
    mutations: {
      retry: 0,                    // mutations don't retry
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

**`Providers` wraps `app/layout.tsx`** (alongside `ThemeProvider` and `AppInitializer`).

### 3.2 Per-entity staleTime

```typescript
// config/query-stale-times.ts (new)
export const QUERY_STALE_TIMES = {
  ENTITY_WORKSPACE: 30_000,        // 30s — intelligence regenerates
  ENTITY_INTELLIGENCE: 60_000,     // 1min — AI summary is expensive
  ENTITY_ACTIVITY: 10_000,         // 10s — near real-time
  ENTITY_HEALTH: 30_000,
  ENTITY_LIFECYCLE: 60_000,
  MISSION_FEED: 60_000,
  AI_ROSTER: 30_000,
  KNOWLEDGE_SEARCH: 5 * 60_000,    // 5min — search is expensive
  USER_FAVORITES: 60_000,
  USER_RECENTS: 30_000,
  DASHBOARD_KPIS: 30_000,
  CHART_DATA: 60_000,
} as const;
```

### 3.3 Query keys — factory pattern

```typescript
// shared/query-keys.ts (new)
export const queryKeys = {
  entity: {
    all: (tenantId: string) => ['entity', tenantId] as const,
    workspace: (type: string, id: string) => ['entity', type, id, 'workspace'] as const,
    intelligence: (type: string, id: string) => ['entity', type, id, 'intelligence'] as const,
    activity: (type: string, id: string) => ['entity', type, id, 'activity'] as const,
    lifecycle: (type: string, id: string) => ['entity', type, id, 'lifecycle'] as const,
  },
  missionFeed: {
    all: (tenantId: string) => ['mission-feed', tenantId] as const,
    list: (tenantId: string) => ['mission-feed', tenantId, 'list'] as const,
  },
  aiRoster: {
    all: (tenantId: string) => ['ai-roster', tenantId] as const,
    list: (tenantId: string, filters: object) => ['ai-roster', tenantId, 'list', filters] as const,
  },
  // ... per resource
} as const;
```

**Why this matters:** `queryClient.invalidateQueries({ queryKey: queryKeys.entity.all(tenantId) })` invalidates every entity query in the tenant. `queryKeys.entity.workspace(type, id)` invalidates only the workspace. Type-safe.

### 3.4 Hooks — per-resource

For every resource, there is a `use<Entity>.ts` file that exports:

```typescript
// hooks/useEntity.ts (new — pattern)
export function useEntity(type: EntityType, id: string) {
  return useQuery({
    queryKey: queryKeys.entity.workspace(type, id),
    queryFn: ({ signal }) => restClient.get<EntityWorkspaceResponse>(
      API_ENDPOINTS.ENTITY.WORKSPACE_SUMMARY(type, id),
      { signal },
    ),
    staleTime: QUERY_STALE_TIMES.ENTITY_WORKSPACE,
    enabled: !!id,                  // don't fetch until we have an id
  });
}

export function useEntityIntelligence(type: EntityType, id: string) {
  return useQuery({
    queryKey: queryKeys.entity.intelligence(type, id),
    queryFn: ({ signal }) => restClient.get<IntelligenceResponse>(
      API_ENDPOINTS.ENTITY.INTELLIGENCE(type, id),
      { signal },
    ),
    staleTime: QUERY_STALE_TIMES.ENTITY_INTELLIGENCE,
  });
}

export function useRefreshIntelligence(type: EntityType, id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => restClient.post(API_ENDPOINTS.ENTITY.INTELLIGENCE_REFRESH(type, id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.entity.intelligence(type, id) }),
  });
}

export function useEntityActivity(type: EntityType, id: string, filter?: ActivityFilter) {
  return useQuery({
    queryKey: [...queryKeys.entity.activity(type, id), filter],
    queryFn: ({ signal }) => restClient.get<PaginatedResponse<ActivityEvent>>(
      API_ENDPOINTS.ENTITY.ACTIVITY(type, id),
      { params: filter, signal },
    ),
    staleTime: QUERY_STALE_TIMES.ENTITY_ACTIVITY,
  });
}

export function useTransitionLifecycle(type: EntityType, id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: LifecycleTransitionInput) => restClient.post(
      API_ENDPOINTS.ENTITY.LIFECYCLE_TRANSITION(type, id),
      input,
    ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.entity.lifecycle(type, id) });
      qc.invalidateQueries({ queryKey: queryKeys.entity.intelligence(type, id) });
      qc.invalidateQueries({ queryKey: queryKeys.entity.activity(type, id) });
    },
  });
}
```

**Per EAOS workspace panel, this pattern is repeated 10x** (one file per capability: `useIdentityPanel`, `useContextPanel`, ..., `useLifecyclePanel`).

### 3.5 The workspace composite hook

The WorkspaceShell needs all 10 capabilities at once. Naïvely this is 10 parallel queries (waterfall). Per `EAOS-api-contract.md` §13.1, we use **Strategy B: two-tier fetch**.

```typescript
// hooks/useEntityWorkspace.ts (new)
export function useEntityWorkspace(type: EntityType, id: string) {
  // Tier 1: critical data (Identity + Intelligence + Health + Lifecycle) in one call.
  const summary = useQuery({
    queryKey: queryKeys.entity.workspace(type, id),
    queryFn: ({ signal }) => restClient.get<EntityWorkspaceSummaryResponse>(
      API_ENDPOINTS.ENTITY.WORKSPACE_SUMMARY(type, id),
      { signal },
    ),
    staleTime: QUERY_STALE_TIMES.ENTITY_WORKSPACE,
  });

  // Tier 2: lazy per-panel data fetched on demand (only when tab is active).
  // Implemented as separate hooks called by each panel component.

  return { summary, /* ... panel hooks are called inside each panel */ };
}
```

**First paint:** Summary endpoint resolves → Identity + Intelligence + Health + Lifecycle panels render. ~300KB payload, <1.5s target.

**Tab switch:** Panel-specific hook fires → panel renders. ~50KB payload, <500ms target.

### 3.6 Realtime integration (the half-built bridge)

The existing `storeEventBridge.ts` (`core/infrastructure/socket/storeEventBridge.ts:1-83`) updates Zustand stores on socket events. With TanStack Query, this becomes:

```typescript
// infrastructure/socket/queryEventBridge.ts (new)
export function installQueryEventBridge(qc: QueryClient, socket: SocketManager) {
  const bus = socket.eventBus;

  // agent status change → invalidate agent queries
  bus.on('agent:status_updated', (e) => {
    qc.invalidateQueries({ queryKey: ['agents', e.tenantId] });
    qc.setQueryData(['agent', e.agentId], (prev: Agent | undefined) =>
      prev ? { ...prev, status: e.status, subState: e.subState } : prev,
    );
  });

  // intelligence refreshed → invalidate the entity intelligence
  bus.on('intelligence:refreshed', (e) => {
    qc.invalidateQueries({ queryKey: queryKeys.entity.intelligence(e.entityType, e.entityId) });
  });

  // lifecycle transition → invalidate lifecycle, intelligence, activity
  bus.on('lifecycle:transitioned', (e) => {
    qc.invalidateQueries({ queryKey: queryKeys.entity.lifecycle(e.entityType, e.entityId) });
    qc.invalidateQueries({ queryKey: queryKeys.entity.intelligence(e.entityType, e.entityId) });
    qc.invalidateQueries({ queryKey: queryKeys.entity.activity(e.entityType, e.entityId) });
  });

  // mission feed recomputed → invalidate mission feed
  bus.on('mission_feed:updated', () => {
    qc.invalidateQueries({ queryKey: ['mission-feed'] });
  });

  // new notification → add to notification query cache (or invalidate)
  bus.on('notification:new', (e) => {
    qc.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
  });
}
```

This **replaces** `storeEventBridge.ts`. Realtime updates flow directly into the query cache. Components re-render automatically.

### 3.7 Optimistic updates

```typescript
// useEntityOperations.ts (new)
export function useAssignTask(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { assigneeId: string }) => restClient.post(
      `/tasks/${taskId}/assign`,
      input,
    ),
    onMutate: async (input) => {
      // Cancel any in-flight refetches so they don't overwrite our optimistic update.
      await qc.cancelQueries({ queryKey: ['tasks', taskId] });

      // Snapshot current value.
      const previous = qc.getQueryData<Task>(['tasks', taskId]);

      // Optimistically update.
      qc.setQueryData<Task>(['tasks', taskId], (old) =>
        old ? { ...old, assigneeId: input.assigneeId, status: 'assigned' } : old,
      );

      return { previous };
    },
    onError: (err, _input, context) => {
      // Roll back on error.
      if (context?.previous) {
        qc.setQueryData(['tasks', taskId], context.previous);
      }
    },
    onSettled: () => {
      // Always refetch to ensure server is source of truth.
      qc.invalidateQueries({ queryKey: ['tasks', taskId] });
    },
  });
}
```

### 3.8 Infinite queries (for long lists)

For lists expected to grow beyond 10K items (Mission Feed, Activity, AI Roster):

```typescript
// useMissionFeed.ts
export function useMissionFeed() {
  return useInfiniteQuery({
    queryKey: queryKeys.missionFeed.list(currentTenantId),
    queryFn: ({ pageParam, signal }) => restClient.get<PaginatedResponse<MissionFeedItem>>(
      API_ENDPOINTS.MISSION_FEED.LIST,
      { params: { cursor: pageParam, limit: 20 }, signal },
    ),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.pagination.nextCursor ?? null,
    staleTime: QUERY_STALE_TIMES.MISSION_FEED,
  });
}
```

For v1, all endpoints use offset/limit (`PaginatedResponse` per `EAOS-api-contract.md` §3.2). Cursor support is P2.

### 3.9 Polling (replaces ad-hoc `setInterval`)

The existing `useDashboardKpis`, `useAgentMetrics`, `useChartData`, `useHealthMonitor` polling hooks (each with their own `setInterval` pattern) collapse to:

```typescript
// useDashboardKpis.ts (new, replaces existing)
export function useDashboardKpis() {
  return useQuery({
    queryKey: ['dashboard-kpis', currentTenantId],
    queryFn: ({ signal }) => restClient.get<KpiSummaryResponse>(
      API_ENDPOINTS.ANALYTICS.DASHBOARD_KPIS,
      { signal },
    ),
    refetchInterval: 30_000,        // poll every 30s
    refetchIntervalInBackground: false,  // pause when tab is hidden
  });
}
```

**TanStack Query** handles visibility detection, abort-on-unmount, jitter, and pause-on-background automatically. ~50 lines of `setInterval` code deleted per hook.

### 3.10 What goes in TanStack Query vs Zustand

| Data | Lives in | Why |
|---|---|---|
| Server data (entities, tasks, KPIs, etc.) | **TanStack Query** | Server is source of truth, has cache, dedupes, refetches |
| AI roster | **TanStack Query** | Same |
| Mission Feed | **TanStack Query** | Same |
| User identity (auth user) | **Zustand** | Hydrated from `localStorage`; auth-specific |
| Auth tokens | **TokenManager** (singleton) | Not in either store — used by `RestClient` interceptor |
| Theme / density / language | **Zustand** (`uiPreferencesStore`) | Persisted UI prefs |
| Modal open/close, sidebar collapsed, inspector open | **Zustand** (UI stores) | Ephemeral UI state |
| Form drafts (before submit) | **react-hook-form** | Form-specific; not global |
| Notification bell unread count | **TanStack Query** (`['notifications', 'unread-count']`) | It's server data, just a count |
| Active filter / sort on a table | **URL search params** (or local component state) | Shareable, bookmarkable |
| Selected entity in a list | **URL search params** | Same |
| Command palette open/closed | **Zustand** (`commandStore`) | UI state |
| Chat draft (in-progress message) | **react-hook-form** or local `useState` | Form draft |
| Activity stream (50 events ring buffer) | **TanStack Query** + component state for ring buffer | Server data, but the "show last 50 in bell" pattern needs windowing |
| Streaming session state (LLM output) | **Zustand** (`useStreamingStore`) | High-frequency, ephemeral, not a server resource |
| Density override per workspace | **Zustand** (`uiPreferencesStore`) | Persisted UI pref |
| Per-user Mission Feed opt-in | **Zustand** (`uiPreferencesStore`) + `PATCH /mission-feed/preferences` | UI pref + server mutation |

### 3.11 Migration from existing stores

The current 12 Zustand stores (in `src/stores/` and `src/shared/stores/`) collapse as follows:

| Existing store | New location | Notes |
|---|---|---|
| `authStore` | **Zustand** (kept) | Auth state is client-only |
| `agentStore` | **TanStack Query** (`['agents', tenantId, filters]`) | Server data |
| `taskStore` | **TanStack Query** (`['tasks', tenantId, filters]`) | Server data |
| `workflowStore` | **TanStack Query** (`['workflows', tenantId, filters]`) | Server data |
| `departmentStore` | **TanStack Query** (`['departments', tenantId, filters]`) | Server data |
| `chatStore` (ring buffer 100) | **TanStack Query** + `useRef` for ring buffer | Per-conversation |
| `activityStore` (ring buffer 50) | **TanStack Query** + `useRef` for ring buffer | Per-entity |
| `commandStore` (UI) | **Zustand** (kept) | UI state |
| `inspectorStore` (UI) | **Zustand** (kept) | UI state |
| `notificationStore` | **TanStack Query** | Server data; bell uses `['notifications', 'unread-count']` |
| `uiPreferencesStore` | **Zustand** (kept) | UI prefs |
| `voiceProfileStore` | **Zustand** (kept) | UI prefs |

**Net result:** ~6 stores deleted, 4 kept (UI-only), TanStack Query owns the rest.

### 3.12 The CacheManager — retired

`src/core/infrastructure/cache/CacheManager.ts` is **retired**. TanStack Query provides:

- `staleTime` (replaces `cache.invalidate(prefix)`)
- `gcTime` (replaces manual GC, which was never started anyway)
- `invalidateQueries({ queryKey })` (replaces `cache.invalidate('agents')`)
- `setQueryData` (replaces `cache.set('agent:123', ...)`)

The `BaseRepository.cacheKey` pattern is replaced by the `queryKeys` factory.

---

## 4. Authentication

### 4.1 Token storage

**Current state:** JWT in `localStorage` (XSS-vulnerable). Per `frontend-tenant/src/core/infrastructure/auth/TokenManager.ts:1-90`.

**Target state (this spec):** **httpOnly + Secure + SameSite=Strict cookies** issued by the backend.

- Access token: 15 min, in httpOnly cookie (`__Host-nc_at`).
- Refresh token: 7 days, in httpOnly cookie (`__Host-nc_rt`).
- CSRF: backend uses SameSite=Strict + double-submit cookie pattern. Frontend reads CSRF token from a non-httpOnly cookie for mutating requests.

**Why this matters:** localStorage tokens are readable by any script on the page (XSS exfiltration). httpOnly cookies are not.

**Backend changes required** (per `EAOS-api-contract.md` §7.1):
- `POST /auth/login` response sets cookies via `Set-Cookie` headers.
- `POST /auth/refresh` rotates both cookies.
- `POST /auth/logout` clears both cookies.
- `req.cookies.__Host-nc_at` is the access token source; the `Authorization: Bearer` header is no longer required (but supported for back-compat during migration).

**Migration:** dual-support for 90 days. New login flow sets cookies; legacy `localStorage` tokens still work via the existing `Authorization` header path. After 90 days, the `localStorage` path is removed.

### 4.2 Token key canonicalization (immediate fix, before httpOnly migration)

Until httpOnly cookies ship, **fix the wrong-key bug** in 11+ files:

- **Canonical key:** `nc_access_token` (renamed from `hq_access_token` for clarity).
- **Migration:** `TokenManager` reads both old and new keys, writes to new.
- All raw `fetch()` calls in `service-desk/page.tsx`, `intelligence/page.tsx`, `finance/page.tsx` etc. **must** use `tokenManager.getAccessToken()` instead of `localStorage.getItem('accessToken')`.

### 4.3 Auth flow

```
Login
  ↓
POST /auth/login { email, password }
  ↓
Response 200: { status: 'success', data: { user }, meta }
  Set-Cookie: __Host-nc_at=<jwt>; HttpOnly; Secure; SameSite=Strict
  Set-Cookie: __Host-nc_rt=<jwt>; HttpOnly; Secure; SameSite=Strict
  ↓
Frontend: setUser(user) in Zustand; navigate to dashboard
  ↓
On every request: cookies auto-included; backend reads from req.cookies
  ↓
On 401:
  RestClient: call POST /auth/refresh (cookies auto-included)
    Success: server returns new cookies; retry original
    Failure: clear auth, redirect to /login
  ↓
On hard refresh:
  AppInitializer:
    1. Check if cookies present
    2. If yes, call GET /auth/me
       Success: setUser(user)
       401: clear, redirect
    3. If no cookies, stay logged out
```

### 4.4 Logout

```typescript
// services/auth.service.ts (binding)
async logout() {
  await restClient.post('/auth/logout');   // server clears cookies
  queryClient.clear();                       // wipe all cached data
  useAuthStore.getState().clear();           // clear user
  window.location.href = '/login';           // hard redirect (no cached pages)
}
```

### 4.5 Tenant context on the frontend

```typescript
// hooks/useTenant.ts (new)
export function useTenant() {
  const user = useAuthStore((s) => s.user);
  if (!user) throw new Error('useTenant must be inside <RequireAuth>');
  if (!user.tenantId) {
    // Platform role. Tenant is provided per-request.
    return { tenantId: null, isPlatform: true };
  }
  return { tenantId: user.tenantId, isPlatform: false };
}
```

The query keys factory always includes `tenantId` (or `'platform'` for cross-tenant queries), so a single `queryClient.invalidateQueries({ queryKey: queryKeys.entity.all(tenantId) })` invalidates only the right tenant.

---

## 5. Realtime

### 5.1 WebSocket — `SocketManager` (binding)

The new `core/infrastructure/socket/SocketManager.ts` is the single Socket.IO client. The legacy `services/socket.ts` is retired.

```typescript
// infrastructure/socket/SocketManager.ts (binding interface)
export interface ISocketManager {
  connect(): void;
  disconnect(): void;
  isConnected(): boolean;
  getEventBus(): EventBus;       // strongly-typed event emitter
  on<T>(event: ServerEvent, handler: (payload: T) => void): () => void;  // returns unsubscribe
}

export const SOCKET_EVENTS = [
  'agent:status_updated', 'agent:error',
  'task:started', 'task:completed', 'task:failed',
  'memory:updated',
  'system:alert',
  'workflow:status_changed',
  'governance:triggered',
  'notification:new',
  'approval:requested',
  'intelligence:refreshed',       // EAOS-1
  'mission_feed:updated',         // EAOS-1
  'lifecycle:transitioned',       // EAOS-1
  'audit:logged',                 // compliance dashboards
] as const;

export type ServerEvent = typeof SOCKET_EVENTS[number];
```

**Connection lifecycle:** `AppInitializer` calls `socketManager.connect()` when auth user transitions `null → user`; `disconnect()` on `user → null`.

**Reconnection:** `SocketManager` (existing config) uses `reconnection: true, reconnectionAttempts: 5, reconnectionDelay: 2000`.

**Auth at connect:** `auth: { token: tokenManager.getAccessToken() }` — once we move to httpOnly cookies, the Socket.IO client uses `withCredentials: true` and cookies are sent on the upgrade request.

### 5.2 SSE — LLM streaming

For agent streaming, the existing `src/services/agent-streaming.service.ts` (375 lines) wraps `EventSource`. The implementation works but has issues:

- **No auth.** `EventSource` does not support custom headers.
- **The fix:** with httpOnly cookies, the browser sends cookies on the SSE request automatically. No auth header needed.
- **Until httpOnly ships:** pass the access token as a `?token=` query param (the SSE endpoint MUST validate this and reject mismatches; `EAOS-api-contract.md` §9.2 requires this fix in EAOS-1).

```typescript
// infrastructure/sse/SSEClient.ts (new, replaces agent-streaming.service.ts)
export class SSEClient {
  open<T = unknown>(
    path: string,
    onEvent: (event: SSEEvent<T>) => void,
    options?: { signal?: AbortSignal; token?: string },
  ): () => void;
}

interface SSEEvent<T = unknown> {
  type: string;        // e.g. 'STEP_COMPLETE'
  data: T;
  id?: string;
  retry?: number;
}
```

`SSEClient` uses native `EventSource` (which already handles reconnection with `retry: 3000` from server). The wrapper adds:
- `signal` (AbortController) for cancellation.
- Type-safe event handlers.
- Auto-reconnect with exponential backoff (5s, 10s, 30s, max 5min).

### 5.3 Streaming LLM responses from AI Actions

For the Intelligence panel and Command Palette Ask-AI mode, AI responses stream token-by-token. Two delivery options:

| Option | When | Implementation |
|---|---|---|
| **SSE (HTTP)** | Standalone requests (one-off AI Action invocations from the command palette) | `SSEClient` (§5.2) |
| **WebSocket** | Continuous subscriptions (Intelligence panel updates triggered by background regen) | `SocketManager.on('intelligence:refreshed', ...)` |

Per `EAOS-api-contract.md` §13.2, the canonical flow is:

1. `POST /ai-actions/execute` (mutates, returns 202 with `invocationId`).
2. Client opens `SSE /ai-actions/{invocationId}/stream` (or subscribes to WebSocket `intelligence:refreshed` event).
3. Tokens stream in.
4. On `COMPLETE`, client invalidates the entity intelligence query.

### 5.4 Mission Feed realtime

`bus.on('mission_feed:updated', invalidateMissionFeed)` is the only realtime hook. Mission Feed recomputation is server-side; the client just reacts.

---

## 6. Forms

### 6.1 Stack

- **react-hook-form** (`^7.53`)
- **zod** (`^3.23`) for schemas (shared with backend via OpenAPI)
- **@hookform/resolvers/zod** for the bridge

### 6.2 Pattern

```typescript
// components/forms/CreateTaskForm.tsx (new pattern)
const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  assigneeId: z.string().uuid().optional(),
  priority: z.enum(['p0_critical', 'p1_high', 'p2_medium', 'p3_low']),
  dueDate: z.date().optional(),
});

type CreateTaskInput = z.infer<typeof createTaskSchema>;

export function CreateTaskForm({ entityRef, onSuccess }: Props) {
  const form = useForm<CreateTaskInput>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: { priority: 'p2_medium' },
  });

  const createTask = useCreateTask();
  const onSubmit = form.handleSubmit(async (values) => {
    await createTask.mutateAsync({ ...values, entityRef });
    onSuccess();
  });

  return <Form {...form}>...</Form>;
}
```

### 6.3 Shared schemas

Schemas are defined **once** in `shared/schemas/` and imported by both:

- **Backend DTOs** — generated from zod schema via `@nestjs/swagger` (config: `introspectComments: true` + manual `@ApiProperty({ type: 'string', format: 'uuid' })`).
- **Frontend forms** — direct import.
- **Frontend API response validation** — same zod schema validates responses at runtime (dev mode only; zero runtime cost in prod).

**This is the single source of truth for entity shape.** No more hand-maintained `domain.types.ts` mirror.

---

## 7. Caching Strategy

### 7.1 Server-side cache

None. Documented in `EAOS-api-contract.md` §7.5.

### 7.2 Client-side cache

TanStack Query cache is the single client-side cache. All previous layers (Zustand persisted stores, `CacheManager`, manual `setInterval` polling) are retired.

### 7.3 Cache keys + invalidation strategy

```typescript
// Mutation invalidation — by example
export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTaskInput) => restClient.post('/tasks', input),
    onSuccess: (data, variables) => {
      // 1. Invalidate the entity's task list
      qc.invalidateQueries({ queryKey: queryKeys.entity.activity(variables.entityRef.type, variables.entityRef.id) });
      // 2. Invalidate any open task list
      qc.invalidateQueries({ queryKey: ['tasks'] });
      // 3. Optionally: optimistically add the new task to the cache
      qc.setQueryData<Task[]>(['tasks', 'recent'], (old) =>
        old ? [data, ...old] : [data],
      );
    },
  });
}
```

### 7.4 Cache persistence

TanStack Query cache is **in-memory** by default. Persistence options:

- **Tier 1 (now):** `persistQueryClient` from `@tanstack/react-query-persist-client` writing to **IndexedDB** (not localStorage — too small for query data).
- **Tier 2 (after Tier 1 ships):** persist `auth` and `userFavorites` only (high-value, low-volatility data). Other queries refetch on app start.

### 7.5 Per-resource TTLs

Defined in `config/query-stale-times.ts` (§3.2). Replaces the unused per-entity TTLs in `api.config.ts:10`.

---

## 8. Error Handling

### 8.1 Error type

```typescript
// lib/errors.ts (refactored — single source of truth, replaces core/infrastructure/ErrorHandler.ts)
export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly status?: number,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export enum ErrorCode {
  UNAUTHORIZED = 'AUTHENTICATION_FAILED',
  FORBIDDEN = 'PERMISSION_DENIED',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION = 'VALIDATION_ERROR',
  CONFLICT = 'CONFLICT',
  RATE_LIMIT = 'RATE_LIMIT_EXCEEDED',
  TIER_LIMIT = 'TIER_LIMIT_EXCEEDED',
  AI_CREDITS = 'AI_CREDITS_EXHAUSTED',
  CROSS_TENANT = 'CROSS_TENANT_ACCESS',
  APPROVAL_REQUIRED = 'APPROVAL_REQUIRED',
  NETWORK = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  SERVER = 'SERVER_ERROR',
  UNKNOWN = 'UNKNOWN_ERROR',
}
```

### 8.2 Global error handler

```typescript
// lib/errorHandler.ts (new)
export function setupGlobalErrorHandler(qc: QueryClient) {
  // Query errors → toast + (optionally) redirect on 401
  qc.setDefaultOptions({
    queries: {
      throwOnError: false,
      onError: (err) => {
        if (err instanceof AppError) {
          if (err.code === ErrorCode.UNAUTHORIZED) {
            // 401 handled in RestClient; shouldn't reach here
          }
          if (err.code === ErrorCode.RATE_LIMIT) {
            toast.warning('Too many requests. Please slow down.');
            return;
          }
          // All other errors: silent (component decides whether to show)
        }
      },
    },
  });

  // Window-level errors → Sentry (when wired in Tier 2)
  if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled rejection:', event.reason);
      // Sentry.captureException(event.reason) — Tier 2
    });
  }
}
```

### 8.3 Toasts (wire the dead system)

`core/services/notification/NotificationService.ts` exists with a `ToastStrategy` that fires `hq:toast` CustomEvent with **no listener**. The fix:

```typescript
// shared/components/Toaster.tsx (new — wire the existing strategy)
import { Toast } from '@/components/ui/Toast';

export function Toaster() {
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      Toast.show(detail);   // shadcn/ui Sonner or similar
    };
    window.addEventListener('hq:toast', handler);
    return () => window.removeEventListener('hq:toast', handler);
  }, []);

  return null;
}
```

Mount `<Toaster />` in `app/layout.tsx`. The existing `ToastStrategy` works once the listener exists.

### 8.4 Loading & error UI (shared components)

```typescript
// shared/components/states/
export function LoadingState({ label = 'Loading…' }: { label?: string }): JSX.Element;
export function ErrorState({ error, onRetry }: { error: Error; onRetry?: () => void }): JSX.Element;
export function EmptyState({ illustration, title, action }: { ... }): JSX.Element;  // one of 6 from EAOS-NUWS §3.1a
```

Every panel uses these. The current 50+ `if (loading) return <div>Loading…</div>` blocks are deleted.

---

## 9. WorkspaceShell Loading (concrete migration)

The current `src/app/departments/[id]/workspace/page.tsx` (1,251 lines) collapses as follows:

```typescript
// app/entity/[type]/[id]/page.tsx (new — replaces /departments/[id]/workspace)
'use client';

import { useEntityWorkspace, useEntityIntelligence } from '@/hooks/entity';
import { WorkspaceProvider } from '@/components/workspace/WorkspaceProvider';
import { WorkspaceShell } from '@/components/workspace/WorkspaceShell';

export default function EntityWorkspacePage({ params }: { params: { type: string; id: string } }) {
  return (
    <WorkspaceProvider type={params.type} id={params.id}>
      <WorkspaceShell />
    </WorkspaceProvider>
  );
}

// WorkspaceShell.tsx (new — uses hooks from §3.4)
function WorkspaceShell() {
  const { type, id } = useWorkspaceContext();
  const { summary, isLoading, error } = useEntityWorkspace(type, id);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  if (!summary.data) return <EmptyState illustration="not-found" title="Entity not found" />;

  return (
    <>
      <IntelligencePanel data={summary.data.intelligence} />
      <div className="grid grid-cols-2 gap-4">
        <IdentityPanel data={summary.data.identity} />
        <OperationsPanel entityRef={{ type, id }} />
        <ResourcesPanel entityRef={{ type, id }} />
        <InsightsPanel entityRef={{ type, id }} />
      </div>
      <TabRail>
        <ContextTab /> <CollaborationTab /> <ResourcesTab /> <AutomationTab />
        <ActivityTab /> <LifecycleTab />
      </TabRail>
    </>
  );
}
```

**Net result:** ~1,200 lines of imperative fetching → ~150 lines of declarative `useQuery` calls + UI components.

---

## 10. Permission Gating (UI side)

Per `EAOS-rbac-model.md` §3.3, the frontend uses a permission vocabulary, not raw role checks.

### 10.1 `useRole` and `useCan`

```typescript
// auth/useRole.ts (new)
export function useRole(): UserRole | null {
  return useAuthStore((s) => s.user?.role ?? null);
}

// auth/useCan.ts (new)
import { ROLE_PERMISSIONS } from './permissions';

export function useCan(permission: Permission | Permission[]): boolean {
  const role = useRole();
  if (!role) return false;
  const perms = ROLE_PERMISSIONS[role];
  if (perms.includes('*')) return true;
  const list = Array.isArray(permission) ? permission : [permission];
  return list.every((p) => perms.includes(p));
}
```

### 10.2 `<Can>` component

```typescript
// auth/Can.tsx (new)
export function Can({
  permission,
  fallback = null,
  children,
}: {
  permission: Permission | Permission[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  return useCan(permission) ? <>{children}</> : <>{fallback}</>;
}
```

### 10.3 Usage

```tsx
// In WorkspaceShell — hide "Costs" tab for non-finance users:
<TabRail>
  {permissions.has('finance.read') && <Tab id="costs" label="Costs" />}
  {permissions.has('entity.lifecycle.transition') && <Tab id="lifecycle" label="Lifecycle" />}
</TabRail>

// Hide "+ New" buttons:
<Can permission="task.create">
  <Button onClick={openCreateTask}>+ New Task</Button>
</Can>

// Conditionally render admin actions:
<Can permission="tenant.settings">
  <Link href="/admin/settings">Settings</Link>
</Can>
```

### 10.4 The `ROLE_PERMISSIONS` map

Located at `auth/permissions.ts` (new). Mirrors the backend's role→permission matrix from `EAOS-rbac-model.md` §3.3. **The two MUST stay in sync.** The CI check is a snapshot test that diffs the two files.

### 10.5 Replacing `useTenantAuth`

The current `useTenantAuth` hook does only one thing: redirect non-tenant users. It is kept. New hooks (`useRole`, `useCan`) add the missing pieces.

---

## 11. Performance

### 11.1 Bundle & code-splitting

- `next/dynamic` for heavy panels (Insights with charts, Mission Feed, Workflow Builder).
- `optimizePackageImports: ['framer-motion', 'zustand', '@tremor/react', 'lucide-react']` in `next.config.js`.
- `bundle-analyzer` added in dev (`@next/bundle-analyzer`).

### 11.2 Memoization

- `React.memo` on KpiCard, AgentCard, MissionFeedItem, EntityTableRow, etc.
- `useShallow` for Zustand selectors that return objects.
- Avoid `useMemo` for cheap derivations.

### 11.3 Virtualization (Tier 2)

For lists > 100 rows (Activity timeline, AI Roster, Mission Feed):

- `react-virtuoso` for variable-height items (Activity timeline has multi-line entries).
- `react-window` for fixed-height tables (AI Roster rows).

P2 unless list growth proves blocking.

### 11.4 Images

- Adopt `next/image` everywhere (currently 0 usages).
- Required for the logo, avatars, knowledge preview thumbnails.

### 11.5 Performance budgets (per `EAOS-NUWS-principles.md` §7.4)

| Surface | LCP | INP | CLS | Bundle (initial) |
|---|---|---|---|---|
| `/` (dashboard) | < 1.5s | < 200ms | < 0.1 | < 200KB JS |
| `/entity/[type]/[id]` (workspace) | < 2.0s | < 300ms | < 0.1 | < 250KB JS (rest is lazy) |
| `/ai-roster` | < 1.5s | < 200ms | < 0.1 | < 150KB JS |
| `/marketplace/*` | < 1.5s | < 200ms | < 0.1 | < 200KB JS |

Measured via Lighthouse CI in the e2e pipeline.

---

## 12. Testing

### 12.1 Unit tests (Tier 2)

Vitest + React Testing Library. **Currently zero unit tests in the codebase** — this is the biggest gap to close.

Test coverage targets:
- All `use*` hooks (query + mutation): 100%.
- All `<*Panel>` components: 90%.
- `RestClient` interceptor logic: 100%.
- `RolePermissions` matrix: 100% (snapshot test against backend).

### 12.2 E2E tests (existing)

`@playwright/test` already installed. Existing `tests/e2e/smoke.spec.ts` expands to:

- Login → dashboard → entity workspace → run AI Action → verify cache invalidation.
- Permission denial: USER tries to delete an agent → button not visible.
- Cross-tenant denial: USER-A tries to access USER-B's department via direct URL → 403.
- Realtime: trigger lifecycle transition in tab A → tab B's panel updates within 1s.

### 12.3 API mocking (Tier 2)

`msw` (Mock Service Worker) for unit tests. Intercepts `restClient` calls at the network level, returns canned responses. Tests run without a backend.

### 12.4 Visual regression (Tier 2)

`chromatic` or `percy` for the 6 empty states + design system components. Tier 2 because it requires Storybook first.

### 12.5 AI output regression (Tier 2)

Custom test harness: AI Action invocations recorded as "golden" responses (semantic similarity, not byte-equal). Run on every model upgrade.

---

## 13. Feature Flags

Two competing systems exist (`config/feature-flags.ts` static map + `useFeatureFlag.ts` env-based). This spec consolidates to **one** system.

```typescript
// config/feature-flags.ts (refactored)
export const FEATURE_FLAGS = {
  // Tenant-onboarding flags (gated per-tenant)
  USE_NEW_WORKSPACE: { default: false, ownerRoles: ['SUPER_ADMIN'] },
  USE_MISSION_FEED: { default: true, rolloutPct: 100 },
  USE_COMMAND_PALETTE: { default: false, rolloutPct: 25 },  // gradual rollout
  USE_COMPARE_VIEW: { default: false, rolloutPct: 0 },     // alpha
  USE_RBAC_PHASE_2: { default: false, ownerRoles: ['SUPER_ADMIN'] },  // tool auth fix

  // Per-tenant opt-in (set by `Tenant.featureFlags` field)
  USE_PERSONALIZED_MISSION_FEED: { default: false, userOverrideable: true },

  // Kill switches
  DISABLE_AI_ACTIONS: { default: false, emergencyKill: true },
} as const;

export function isFeatureEnabled(
  flag: keyof typeof FEATURE_FLAGS,
  context: { role?: UserRole; tenantFlags?: Record<string, boolean>; userFlags?: Record<string, boolean> },
): boolean;
```

**Server-side flags** (e.g. `DISABLE_AI_ACTIONS` for incident response) are evaluated by the backend and returned in the `/auth/me` response. Frontend never trusts client-side flag values for security-sensitive flags.

---

## 14. File Structure (per `EAOS-implementation-plan.md` §11.2 + this spec; v1.2 final layout)

**Per D-022 + D-023:** the **only** tenant frontend is `frontend-eaos/`. `frontend-tenant/` was deleted in full (no production users, no release). The shared `packages/ui/` package is the canonical source for permission hooks, query keys factory, design tokens, and primitives. No dual-frontend, no 90-day redirect, no legacy support window.

```
neurecore-base/neurecore/
├── backend/                    # shared; refactored in place
├── frontend-admin/             # platform console; RBAC updates only
├── frontend-tenant/            # FROZEN; no new data-layer work here
├── frontend-eaos/              # NEW — full EAOS implementation
└── packages/
    └── ui/                     # shared design system + permission hooks + query keys

frontend-eaos/src/
├── app/
│   ├── layout.tsx                       # Wraps with <Providers> + <Toaster> + <ThemeProvider>
│   ├── providers.tsx                    # QueryClientProvider, ThemeProvider, AppInitializer
│   ├── [tenantSlug]/
│   │   ├── (workspace)/
│   │   │   ├── entity/[type]/[id]/
│   │   │   │   ├── page.tsx             # WorkspaceShell — renders 10 capability panels + modal
│   │   │   │   ├── graph/page.tsx       # P2; v1 = mini-graph slide-over
│   │   │   │   └── compare/page.tsx     # /compare?ids=... (read-only v1)
│   │   │   ├── mission-feed/page.tsx    # /mission-feed
│   │   │   ├── ai-roster/page.tsx      # /ai-roster (per §14.2 Q6 + Pricing §0a)
│   │   │   └── dashboard/page.tsx       # /dashboard (Mission Feed + 8-pillar)
│   │   ├── login/page.tsx
│   │   └── onboarding/page.tsx
│   ├── api/                             # Generated API client (codegen output)
│   │   └── generated/
│   │       ├── types.ts                 # From openapi-typescript
│   │       └── client.ts                # Typed restClient wrappers per endpoint
│   ├── knowledge/                       # /knowledge (EAOS-4)
│   └── marketplace/                     # /marketplace (EAOS-5)
│
├── auth/                                # Permission system (re-exports from @neurecore/ui)
│
├── components/
│   ├── workspace/                       # NEW — replaces frontend-tenant/app/departments/[id]/workspace
│   ├── widgets/                         # Tremor wrappers
│   ├── citation/                        # CitationChip + CitationSlideOver
│   ├── density/                         # DensityProvider + useDensity + DensityToggle
│   └── (re-exports from @neurecore/ui for primitives)
│
├── infrastructure/
│   ├── api/RestClient.ts                # Wraps axios
│   ├── socket/SocketManager.ts          # Socket.IO
│   ├── sse/SSEClient.ts                 # EventSource wrapper
│   ├── socket/queryEventBridge.ts       # Replaces storeEventBridge
│   └── auth/CookieManager.ts            # httpOnly cookies (Phase 9 pulled forward)
│
├── config/
│   ├── api.config.ts                    # baseURL, timeouts
│   ├── query-stale-times.ts             # Per-entity staleTime
│   ├── feature-flags.ts                 # Consolidated single system
│   └── tenant-routing.ts                # {tenantCompanyName} → tenantId
│
└── services/                            # Thin — TanStack Query owns the rest
    └── tenant-context.ts                # Resolves {tenantCompanyName} from URL

packages/ui/src/                         # SHARED
├── tokens/                              # colors, typography, spacing, density
├── components/                          # primitives, feedback, data
├── auth/                                # permissions.ts, useRole, useCan, Can
├── query/                               # queryKeys, useListQuery, useDetailQuery, mutations
├── endpoints/                           # API_ENDPOINTS registry
└── index.ts
```

---

## 15. Migration Plan (v1.2 — D-023: no migration, no legacy; just build)

**Per D-022 + D-023:** there is **no migration**. `frontend-tenant/` was deleted in full on 2026-06-27 (no production users, no release). EAOS is built in a **new** app (`frontend-eaos/`) from day 1, with TanStack Query as the default, httpOnly cookies as the **sole** auth path, and `packages/ui/` for shared design system. No "frozen" intermediate state, no 90-day redirect, no dual-support window.

The remaining work for `frontend-eaos/` is essentially **the build phases of Phase 1 and Phase 2 of v1.0 §15**, condensed because there is no legacy code to coexist with. See [`EAOS-implementation-roadmap.md` Phase 1 + Phase 2](./EAOS-implementation-roadmap.md) for the authoritative plan.

### What was the "migration" in v1.0 / v1.1 (now obsolete)

- v1.0: 6 phases of incremental migration on `frontend-tenant/`.
- v1.1 (D-022): replaced by the new-app build, with `frontend-tenant/` "frozen" for the transition.
- **v1.2 (D-023):** even the frozen intermediate state is gone. `frontend-tenant/` is deleted. The only work is to build `frontend-eaos/` correctly from day 1.

### Build phases for `frontend-eaos/` (per roadmap Phase 1 + 2)

The build is **incremental** so the app remains shippable at every step.

### Phase 1 — Foundations (1-2 weeks)

- [ ] Add `@tanstack/react-query`, `@tanstack/react-query-devtools`, `react-hook-form`, `zod`, `@hookform/resolvers`, `openapi-typescript`, `@tanstack/react-query-persist-client` to `package.json`.
- [ ] Create `app/providers.tsx` with `QueryClientProvider`.
- [ ] Create `shared/query-keys.ts`.
- [ ] Create `config/query-stale-times.ts`.
- [ ] Create `auth/permissions.ts` mirroring backend matrix.
- [ ] Create `auth/useRole.ts`, `auth/useCan.ts`, `auth/Can.tsx`.
- [ ] Wire `<Toaster />` to the dead `ToastStrategy`.
- [ ] Fix the wrong-token-key bug in 11+ files (`tokenManager.getAccessToken()`).
- [ ] Set up OpenAPI codegen pipeline.

### Phase 2 — Retire the dual layers (2-3 weeks)

- [ ] Delete `src/services/api.ts` (legacy axios).
- [ ] Delete `src/services/socket.ts` (legacy socket).
- [ ] Delete `src/core/infrastructure/cache/CacheManager.ts`.
- [ ] Delete `src/core/infrastructure/socket/storeEventBridge.ts`.
- [ ] Delete `src/services/unwrap.ts`.
- [ ] Replace all `import api from '@/services/api'` with `import { restClient } from '@/core/services/api/clients/RestClient'`.
- [ ] Replace all `import { getSocket } from '@/services/socket'` with `import { socketManager } from '@/core/infrastructure/socket/SocketManager'`.
- [ ] Delete the 6 data stores (agentStore, taskStore, workflowStore, departmentStore, chatStore, activityStore). Their consumers migrate to `useQuery` hooks.

### Phase 3 — Entity workspace (3-4 weeks)

- [ ] Create `core/hooks/entity/useEntity*.ts` for all 10 capabilities.
- [ ] Create `app/entity/[type]/[id]/page.tsx` with the new `WorkspaceShell`.
- [ ] Implement the 10 panel components (per `EAOS-NUWS-principles.md`).
- [ ] Implement Mission Feed, Command Palette, Mini-Graph, Compare View.
- [ ] Implement AI Roster page.
- [ ] Apply `<Can>` gating throughout the new workspace.
- [ ] Add the 30-day redirect from `/departments/[id]/workspace` to `/entity/department/{id}`.

### Phase 4 — httpOnly cookie auth (1-2 weeks)

- [ ] Backend: switch to httpOnly cookies (per `EAOS-api-contract.md` §4.1).
- [ ] Frontend: remove `localStorage` token reading; rely on cookies.
- [ ] Update Socket.IO client to `withCredentials: true`.
- [ ] Update SSE client to use cookies.
- [ ] Add CSRF token handling.

### Phase 5 — Forms + validation (2-3 weeks)

- [ ] Convert each `useState` form to `react-hook-form` + `zod`.
- [ ] Generate zod schemas from OpenAPI.
- [ ] Add `<Form>`, `<FormField>`, `<FormItem>` from shadcn/ui.

### Phase 6 — Polish (ongoing)

- [ ] Adopt `next/image` everywhere.
- [ ] Adopt `next/dynamic` for heavy panels.
- [ ] Add `bundle-analyzer` to CI.
- [ ] Add virtualisation for long lists (Tier 2).
- [ ] Add unit tests (Vitest + RTL) for hooks and panels.

---

## 16. Open Decisions Deferred

These are non-blocking for EAOS-1/2/3:

1. **GraphQL gateway** (Strategy C in `EAOS-api-contract.md` §13.1) — revisit if REST + summary endpoint is insufficient.
2. **Service Worker for offline** — v2+.
3. **`next/dynamic` for ALL pages** — TBD; only heavy panels need it.
4. **PersistQueryClient** to IndexedDB — Tier 2.
5. **msw for tests** — Tier 2.
6. **react-virtuoso for long lists** — Tier 2 unless list growth proves blocking.
7. **Sentry integration** — env vars exist, SDK not installed. Tier 2.
8. **Bundle analyzer** — Tier 2.
9. **Storybook + visual regression** — Tier 2.
10. **AI output regression tests** — Tier 2.

---

**End of document.**
