# NeureCore — EAOS REST + Realtime API Contract

**Document Version:** 1.0
**Date:** 2026-06-27
**Status:** EAOS API Contract — binding for EAOS-1/2/3
**Audience:** Backend, Frontend, QA, Partners
**Supersedes:** — (first publication; previously only TypeScript interfaces existed in `EAOS-implementation-plan.md`)
**Related:** `EAOS-implementation-plan.md` v2.6, `EAOS-NUWS-principles.md` v1.2, `EAOS-rbac-model.md` v1.0, `EAOS-frontend-data-layer.md` v1.0

---

## 0. Purpose

This document is the **single binding source of truth** for the NeureCore HTTP + WebSocket + SSE API surface. It is written *after* a thorough audit of the existing backend (2026-06-27) and *intentionally reuses* the patterns the codebase has already converged on. Its job is to:

1. **Standardize** the patterns that are already consistent across the codebase.
2. **Resolve** the inconsistencies that audit found (see §13 for the audit summary).
3. **Introduce** OpenAPI 3.1 generation (currently absent — no `@nestjs/swagger`).
4. **List** every endpoint the EAOS workspace surface (NUWS v1.2) will require, even those not yet implemented.

This is **not** a Swagger dump. It is the spec that the OpenAPI artifact, the frontend `restClient`, and the backend NestJS controllers all derive from. Code generation in both directions is the goal.

---

## 0a. Document Relationships

```
EAOS-implementation-plan.md     ─┐
EAOS-NUWS-principles.md         ─┤
EAOS-rbac-model.md              ─┼─►  EAOS-api-contract.md  ──►  OpenAPI 3.1 spec  ──►  generated client SDK
EAOS-frontend-data-layer.md     ─┤                                          ──►  NestJS controllers
EAOS-pricing-plans.md           ─┘
```

---

## 1. Existing State (Audit 2026-06-27)

Findings from the codebase audit that this spec must either adopt or explicitly override.

### 1.1 What is already consistent and MUST be preserved

| Pattern | Current location | Status |
|---|---|---|
| Global prefix `/api` + URI versioning `v1` | `backend/src/main.ts:22-23` | Adopt. Every route is `/api/v1/...`. |
| Success envelope `{ status: 'success', data, meta: { timestamp, requestId } }` | `backend/src/common/interceptors/transform-response.interceptor.ts:14-36` | Adopt verbatim. |
| Error envelope `{ status: 'error', error: { code, message, details? }, meta: { timestamp, requestId } }` | `backend/src/common/filters/global-exception.filter.ts:104-115` | Adopt verbatim. |
| Global guards in order: Throttler → JwtAuth → Roles | `backend/src/app.module.ts:129-145` | Adopt. New endpoints MUST work with this order. |
| `@Public()` to bypass JWT | `backend/src/common/decorators/roles.decorator.ts:13` | Adopt. |
| `@Roles(UserRole.X, UserRole.Y)` + global `RolesGuard` | `backend/src/modules/auth/guards/roles.guard.ts:30-31` | Adopt. Strict equality, no hierarchy. |
| `@TierLimit('maxUsers' | 'maxAgents' | ...)` + `TierLimitsGuard` | `backend/src/common/decorators/tier-limit.decorator.ts`, `common/guards/tier-limits.guard.ts` | Adopt for any endpoint that consumes a tier-capped resource. **Currently used only 2x — must expand.** |
| UUID path params via `@Param('id', ParseUUIDPipe)` | every controller | Adopt. No integer IDs anywhere. |
| `class-validator` for DTO validation | every DTO | Adopt. No `zod` in NestJS DTOs. |
| Prisma enums re-exported in DTOs (`import { UserRole } from '@prisma/client'`) | every DTO | Adopt. |
| Correlation IDs via `X-Request-ID` / `X-Correlation-ID` headers | `backend/src/common/middleware/request-logger.middleware.ts:85-86` | Adopt. Frontend must echo. |
| Rate limit default 100 req / 60s / IP | `backend/src/app.module.ts:60` via `@nestjs/throttler` | Adopt. Per-endpoint overrides via `@Throttle()`. |
| WebSocket on root namespace, JWT at connect, user/tenant rooms | `backend/src/modules/events/events.gateway.ts:17-20, 36-43, 62-65` | Adopt. |
| WebSocket event naming `<resource>:<verb_past_tense>` with `timestamp` | `events.gateway.ts` (emit* helpers) | Adopt. |
| SSE implemented manually with `@Res()` + `text/event-stream` | `backend/src/modules/agents/streaming/agent-streaming.controller.ts:71-132` | Adopt pattern. Keep manual SSE (not `@Sse()` decorator) because it allows session lifecycle control. |

### 1.2 What is inconsistent and MUST be fixed by this spec

| Inconsistency | Spec decision (binding) |
|---|---|
| **List responses return 4 different shapes** (raw array, `{data, total, page, limit, totalPages}`, `{items, total, page, limit}`, `{providers: [...]}`) | **All list responses use `PaginatedResponse<T>`** (defined §3.2). Migration: existing controllers that return raw arrays are non-compliant; must be wrapped before EAOS-1 ships. |
| **Action responses are ad-hoc** (`{message, agent}`, `{success: true}`, `{ok: true}`, `{acknowledged: true}`, `{reset, ...}`, `{purged: count}`, `{url}`, `{reply, ...}`) | **Standardize on `ActionResult<T>` envelope** (defined §3.3). All POST/PATCH that return a side-effect result use this. Mutations that return the affected entity return `EntityResponse<T>`. |
| **`page` / `limit` query type** — sometimes string, sometimes int DTO, sometimes piped | **Standard `PaginationDto`** (defined §4.1). All controllers use it. |
| **`resolveTenantId(user, ?queryTenantId)` helper duplicated 15+ times** | **Extract to `common/utils/resolve-tenant-context.ts`**. The single canonical function is defined in §6.2. Migration: replace all 15 duplicates. |
| **`PaginatedResponse<T>` type defined in `common/types/api-response.types.ts:23-35` but never used** | **Adopt as the single list response type.** Reference it in every controller. |
| **Two `RolesGuard` implementations** (`auth/guards/roles.guard.ts` and `security/guards/roles.guard.ts`); tiers module uses the divergent one | **Delete the duplicate.** `security/guards/roles.guard.ts` and its divergent `UserRole` from `security.types.ts` are removed. `tiers.controller.ts` uses the global guard. |
| **Two `UserRole` enums** (Prisma + `shared/types/security.types.ts`) | **Delete `security.types.ts:UserRole`.** Prisma is the single source of truth. |
| **Token key naming mismatch in frontend** (`hq_access_token` vs `accessToken`) | **Document the canonical key in `EAOS-frontend-data-layer.md` §4.2.** All raw `fetch()` calls that use the wrong key are bugs. |
| **Two `ApiResponse<T>` definitions in frontend** (`types/api.types.ts` and `core/services/api/interfaces/IApiClient.ts`) | **Backend uses one envelope (this spec); frontend uses the same one.** Delete the duplicate. |
| **No `@ApiTags` / `@ApiOperation` / `@ApiProperty` annotations** | **Adopt `@nestjs/swagger` and annotate every controller/DTO.** See §11. |

### 1.3 What is MISSING and must be added

| Gap | Spec section |
|---|---|
| No OpenAPI / Swagger artifact | §11 — `@nestjs/swagger` adoption + OpenAPI 3.1 spec generation |
| No shared `PaginationDto` | §4.1 |
| No shared `IdParamDto` (UUID path params) | §4.2 |
| No `TenantContextService` / AsyncLocalStorage | §6.1 |
| No cursor pagination | §3.2 (only offset/limit for now; cursor is P2) |
| No `Idempotency-Key` support | §7.4 |
| No `X-Total-Count` / `Link` headers | §3.2 (use body `meta.pagination`, not headers) |
| No per-endpoint rate limits | §7.3 |
| No API versioning migration plan for v2 | §10 |
| No standardized response output DTOs (only input DTOs exist) | §5 — every entity has a paired `XxxResponseDto` |
| No `application/problem+json` (RFC 7807) | §3.4 — error envelope is NeureCore-internal; RFC 7807 is P2 |
| No `AIActionDefinition` model in schema | backend module — separate concern; see `EAOS-implementation-plan.md` §4.6 |
| `tools.controller.ts:execute` is unauthenticated | §8.1 — every `/tools/*` endpoint requires `@Roles(ADMIN, OWNER)` minimum |

---

## 2. Base URL, Versioning, Headers

### 2.1 Base URL

```
https://api.neurecore.com/api/v1   (production)
http://localhost:3000/api/v1        (development)
```

Frontend env: `NEXT_PUBLIC_API_URL` (already canonical per `EAOS-frontend-data-layer.md` §2.1).

### 2.2 Versioning

- **URI versioning** at the segment level. All controllers use `@Controller({ path, version: '1' })`.
- The next major version is `v2`, **not** `v1.1`. A `v2` route can coexist with `v1` for 6 months.
- Minor additive changes (new optional fields, new endpoints) ship in the current `v1`.
- Breaking changes (removed fields, changed semantics, changed auth) require `v2`.

### 2.3 Request headers (required for all non-public endpoints)

| Header | Required | Notes |
|---|---|---|
| `Authorization: Bearer <jwt>` | Yes (unless `@Public()`) | JWT issued by `/auth/login` or `/auth/refresh`. Lifetime: 15 min. |
| `X-Request-ID` | No | Echoed in response. If absent, server generates a UUID v4. |
| `X-Tenant-ID` | No | Override only for `SUPER_ADMIN` / `PLATFORM_ADMIN` / `SECURITY_OFFICER` / `SUPPORT`. Otherwise ignored. See §6.2. |
| `Idempotency-Key` | Recommended for mutating endpoints | UUID v4. See §7.4. |
| `Content-Type` | Yes for body | `application/json` only. |
| `Accept` | No | `application/json` default. |

### 2.4 Response headers (always present)

| Header | Notes |
|---|---|
| `X-Request-ID` | Echoes the request ID. Used for support tickets and trace lookup. |
| `X-RateLimit-Limit` | Per-endpoint request limit. |
| `X-RateLimit-Remaining` | Remaining in current window. |
| `X-RateLimit-Reset` | Unix epoch seconds when window resets. |
| `Cache-Control` | Varies by endpoint; see §9. |

---

## 3. Envelopes

### 3.1 Success envelope

Every successful (2xx) response wraps its payload in:

```json
{
  "status": "success",
  "data": <payload>,
  "meta": {
    "timestamp": "2026-06-27T14:53:29.123Z",
    "requestId": "9d2e1f4a-3b6c-4e8a-9f0b-1a2b3c4d5e6f"
  }
}
```

The `data` field is one of:
- A single entity (entity GET, mutation returning affected entity)
- A `PaginatedResponse<T>` (list GET — §3.2)
- An `ActionResult<T>` (action POST/PATCH — §3.3)
- `null` (204 No Content — interceptor returns `{ status: 'success', data: null, meta }`)

### 3.2 Paginated response

```typescript
interface PaginatedResponse<T> {
  items: T[];             // ← canonical key is `items`, not `data` or raw array
  pagination: {
    page: number;         // 1-indexed
    limit: number;        // page size
    total: number;        // total matching records (before page slicing)
    totalPages: number;   // ceil(total / limit)
  };
}
```

**Migration rule:** every existing controller that returns `{ data, total, page, limit, totalPages }` (e.g. `agents.controller.ts:94-100`, `agent-templates.service.ts:54`) or `{ items, total, page, limit }` (e.g. `users.service.ts:70`) is **renamed** to `{ items, pagination: {...} }`. The interceptor's auto-wrap is unaffected.

### 3.3 Action result

For endpoints that perform a side effect (most `POST` / `PATCH` / `DELETE` that don't return a full entity):

```typescript
interface ActionResult<T = unknown> {
  success: true;
  message: string;        // human-readable, e.g. "Agent paused"
  data?: T;              // optional affected entity (e.g. the paused agent)
  warnings?: string[];    // non-fatal advisories, e.g. "AI Action is rate-limited"
}
```

**Migration rule:** every controller returning `{ message, agent }`, `{ success: true }`, `{ ok: true }`, `{ acknowledged: true }`, `{ reset, ... }`, `{ purged: count }` is wrapped to `{ success: true, message, data: <previous body> }`. The `message` field is required.

### 3.4 Error envelope

Already in production. Preserved verbatim.

```json
{
  "status": "error",
  "error": {
    "code": "PERMISSION_DENIED",
    "message": "You don't have permission to perform this action.",
    "details": { "field": "email", "reason": "invalid format" }
  },
  "meta": {
    "timestamp": "2026-06-27T14:53:29.123Z",
    "requestId": "9d2e1f4a-3b6c-4e8a-9f0b-1a2b3c4d5e6f"
  }
}
```

Error codes are the constants from `backend/src/common/types/api-response.types.ts` (10 high-level codes) extended by `backend/src/common/errors/app-errors.ts` (~50 granular codes). Both sets are part of the contract; clients SHOULD switch on the granular codes, falling back to the high-level ones.

In production, `details` is **stripped** for non-validation errors (prevents leaking internals). Validation errors (`VALIDATION_ERROR`, 422) always include `details` for the field-level diagnostics.

### 3.5 Standard HTTP status code mapping

| Status | When | Body |
|---|---|---|
| 200 OK | Successful GET, PATCH that returns entity | Success envelope |
| 201 Created | Successful POST that creates a resource | Success envelope with `Location` header |
| 202 Accepted | Async dispatch (e.g. agent task dispatch) | Success envelope with `{ taskId, status: 'started' }` |
| 204 No Content | Successful DELETE | Success envelope with `data: null` |
| 400 Bad Request | Malformed request, missing query, etc. | Error envelope `INVALID_REQUEST` |
| 401 Unauthorized | Missing / invalid / expired JWT | Error envelope `AUTHENTICATION_FAILED` |
| 403 Forbidden | Role check failed, cross-tenant denied | Error envelope `PERMISSION_DENIED` |
| 404 Not Found | Resource not found or not in tenant | Error envelope `NOT_FOUND` |
| 409 Conflict | Duplicate entry, state conflict | Error envelope `CONFLICT` |
| 422 Unprocessable Entity | Validation failed (DTO) | Error envelope `VALIDATION_ERROR` with `details` |
| 429 Too Many Requests | Rate limit exceeded | Error envelope `RATE_LIMIT_EXCEEDED` |
| 500 Internal Server Error | Unhandled exception | Error envelope `INTERNAL_ERROR` (no `details` in prod) |
| 503 Service Unavailable | Dependency down, circuit open | Error envelope `SERVICE_UNAVAILABLE` with `Retry-After` header |

---

## 4. Pagination, Filtering, Sorting

### 4.1 Pagination DTO (canonical, all controllers use this)

```typescript
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(1000)
  page: number = 1;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
  limit: number = 20;

  // Cursor pagination is P2; for v1, only offset/limit.
  // sort, order, search are filter-DTO-specific.
}
```

**File:** `backend/src/common/dto/pagination.dto.ts` (new in this spec). Every existing `@Query('page') page = '1'` style inline param is replaced with `@Query() pagination: PaginationDto`.

### 4.2 Id param DTO (canonical for path params)

```typescript
import { IsUUID } from 'class-validator';

export class IdParamDto {
  @IsUUID() id!: string;
}
```

**File:** `backend/src/common/dto/id-param.dto.ts` (new). Usage: `@Param() params: IdParamDto` instead of `@Param('id', ParseUUIDPipe) id: string`. Equivalent runtime behavior, but typed for OpenAPI generation.

### 4.3 Filter DTOs

Each resource has a `XxxFilterDto` that extends `PaginationDto`:

```typescript
export class AgentFilterDto extends PaginationDto {
  @IsOptional() @IsString() @MaxLength(100)
  search?: string;

  @IsOptional() @IsEnum(AgentType)
  type?: AgentType;

  @IsOptional() @IsEnum(AgentStatus)
  status?: AgentStatus;

  @IsOptional() @IsUUID()
  departmentId?: string;

  @IsOptional() @IsString() @MaxLength(50)
  sort?: string;       // e.g. 'createdAt' or 'name'

  @IsOptional() @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc' = 'desc';
}
```

**Conventions:**
- `search` is a full-text search over the entity's primary text columns (name, description).
- `sort` is a column name. If absent, default is `createdAt desc`.
- For entity-specific filters, see the resource spec.

---

## 5. Entity Response DTOs

Currently the codebase returns raw Prisma entities from controllers. This spec requires **paired response DTOs** for every entity exposed via the API. The DTO uses `class-transformer`'s `@Expose()` / `@Exclude()` to control serialization. This makes the wire contract explicit and lets Prisma schema evolve without breaking clients.

### 5.1 Pattern

```typescript
// Request
export class CreateAgentDto { ... }  // input

// Response
export class AgentResponseDto {
  @Expose() id: string;
  @Expose() name: string;
  @Expose() type: AgentType;
  @Expose() status: AgentStatus;
  @Expose() createdAt: Date;
  @Expose() updatedAt: Date;
  // Intentionally NO passwordHash, internalMetadata, etc.

  static fromEntity(entity: Agent): AgentResponseDto {
    return plainToInstance(AgentResponseDto, entity, { excludeExtraneousValues: true });
  }
}
```

**File location:** `backend/src/modules/<module>/dto/response/` (one DTO per file, mirroring the existing input DTO layout).

**Services** return `AgentResponseDto.fromEntity(...)` instead of raw Prisma `Agent`. This is the breaking change vs. the current codebase; see §13 for migration order.

### 5.2 EAOS-specific entity response DTOs (this spec covers)

The following entities MUST have `XxxResponseDto` defined before EAOS-1 ships:

| Entity | DTO | Notes |
|---|---|---|
| Agent | `AgentResponseDto` | Excludes `permissions` (internal). |
| Department | `DepartmentResponseDto` | Includes `memberCount`, `agentCount` aggregates. |
| Tenant | `TenantResponseDto` | Excludes `billing` details (separate `/billing` resource). |
| User | `UserResponseDto` | Excludes `passwordHash`. Exposes only safe fields. |
| Project | `ProjectResponseDto` | |
| Goal | `GoalResponseDto` | |
| Task | `TaskResponseDto` | |
| Workflow | `WorkflowResponseDto` | |
| Routine | `RoutineResponseDto` | |
| KnowledgeEntry | `KnowledgeEntryResponseDto` | Excludes `contentVector` (use `/knowledge/{id}/search` for semantic). |
| EntityState (EAOS) | `EntityStateResponseDto` | |
| EntityHealth (EAOS) | `EntityHealthResponseDto` | |
| EntityOwnership (EAOS) | `EntityOwnershipResponseDto` | |
| AIActionInvocation | `AIActionInvocationResponseDto` | |
| SolutionPack | `SolutionPackResponseDto` | |
| MissionFeedItem (EAOS) | `MissionFeedItemResponseDto` | |
| ActivityEvent (EAOS) | `ActivityEventResponseDto` | |

---

## 6. Tenant Context

### 6.1 Problem statement

Currently, tenant resolution is a private method on every controller, duplicated 15+ times. There is no central `TenantContextService`, no `AsyncLocalStorage`, no middleware that sets `request.tenantId`. Each service method takes `tenantId` as the first argument and every Prisma `where` clause includes it manually. This is fragile: forgetting `tenantId` in one service method is a security incident.

### 6.2 Canonical resolver

```typescript
// backend/src/common/utils/resolve-tenant-context.ts (new)

export interface TenantContext {
  tenantId: string;          // always set after resolution
  isCrossTenant: boolean;    // true when platform role overrode via header
  actorRole: UserRole;
}

export function resolveTenantContext(
  user: ValidatedUser,
  request: { headers: Record<string, string | string[] | undefined>; query: Record<string, unknown> },
  body?: { tenantId?: string },
): TenantContext {
  // 1. Platform roles may override via header, query, or body.
  if (isPlatformRole(user.role)) {
    const override =
      (body?.tenantId as string | undefined) ??
      (request.query.tenantId as string | undefined) ??
      (request.headers['x-tenant-id'] as string | undefined);
    if (!override) {
      throw new BadRequestException({
        code: 'TENANT_REQUIRED',
        message: `${user.role} must specify tenantId via header, query, or body.`,
      });
    }
    return { tenantId: override, isCrossTenant: true, actorRole: user.role };
  }

  // 2. Tenant roles must use their own tenant.
  if (!user.tenantId) {
    throw new ForbiddenException({
      code: 'TENANT_CONTEXT_MISSING',
      message: 'User has no tenant context.',
    });
  }
  return { tenantId: user.tenantId, isCrossTenant: false, actorRole: user.role };
}

function isPlatformRole(role: UserRole): boolean {
  return role === UserRole.SUPER_ADMIN
    || role === UserRole.PLATFORM_ADMIN
    || role === UserRole.SECURITY_OFFICER
    || role === UserRole.SUPPORT;
}
```

### 6.3 AsyncLocalStorage binding (EAOS-1)

For EAOS-1, a new `TenantContextMiddleware` runs **before** the JWT guard and seeds an `AsyncLocalStorage` store with the resolved `TenantContext`. Services then read it via a `TenantContextService`:

```typescript
// backend/src/common/context/tenant-context.service.ts (new)

@Injectable()
export class TenantContextService {
  private readonly als = new AsyncLocalStorage<TenantContext>();

  run<T>(ctx: TenantContext, fn: () => T): T {
    return this.als.run(ctx, fn);
  }

  get(): TenantContext {
    const ctx = this.als.getStore();
    if (!ctx) throw new Error('TenantContext accessed outside request scope.');
    return ctx;
  }

  get tenantId(): string { return this.get().tenantId; }
}
```

After EAOS-1, services **stop accepting `tenantId` as a parameter** and read from `TenantContextService.get()`. The 15+ duplicate `resolveTenantId` methods are deleted.

**Migration:** introduce in EAOS-1 alongside the entity refactor. Until then, the explicit-parameter pattern continues.

---

## 7. Cross-Cutting Concerns

### 7.1 Authentication

- **Mechanism:** JWT (HS256, 15-minute access token, 7-day refresh token).
- **Issued by:** `POST /auth/login`, `POST /auth/register`, `POST /auth/refresh`, `POST /auth/google`.
- **Required claims:** `sub` (userId), `email`, `role`, `tenantId | null`, `jti` (unique per token, used for revocation), `iat`, `exp`.
- **Refresh rotation:** the refresh token is rotated on every use; old token is invalidated via Redis blacklist with a TTL matching its original expiry.
- **Revocation:** logout calls `POST /auth/logout` which adds the token's `jti` to the Redis blacklist; subsequent requests with the same `jti` are rejected.
- **Secret length:** `JWT_SECRET` env must be ≥ 32 chars in production. CI fails the deploy otherwise.

### 7.2 Authorization

Full role/permission matrix in **`EAOS-rbac-model.md`**. This document only specifies the wire surface:

- **Role on every JWT.** `req.user.role` is the source of truth; do not trust client-supplied roles.
- **Endpoint-level:** `@Roles(UserRole.X, UserRole.Y)` decorator. Strict equality, no hierarchy. **Documented in `EAOS-rbac-model.md` §3.**
- **Resource-level:** `EntityOwnerGuard` (new in EAOS-1) verifies `resource.ownerId === user.id` or `resource.tenantId === user.tenantId`. Used for entity-level reads (entity workspace page).
- **Action-level:** `ActionAuthorizationGuard` (new in EAOS-1) wraps `POST /ai-actions/execute` and verifies: tier allows the action, user has invoked-credits, action is allowed on the target entity type. See `EAOS-implementation-plan.md` §4.6.

### 7.3 Rate limits

- **Global default:** 100 req / 60s / IP. Existing (`@nestjs/throttler`, `app.module.ts:60`).
- **Per-endpoint overrides** (this spec locks these):

| Endpoint | Limit | Reason |
|---|---|---|
| `POST /auth/login` | 10 / 60s / IP | Brute-force protection |
| `POST /auth/refresh` | 60 / 60s / IP | Heavy usage expected |
| `POST /ai-actions/execute` | 60 / 60s / user | AI credit burn protection |
| `POST /agents/{id}/dispatch` | 30 / 60s / user | AI cost control |
| `GET /agents/streaming/sessions/{id}/events` (SSE) | `@SkipThrottle()` | Long-lived connection |
| `GET /health` | `@SkipThrottle()` | Liveness probe |
| `GET /metrics` | `@SkipThrottle()` | Prometheus scrape |
| `*` (all other endpoints) | 100 / 60s / IP (default) | |

Per-endpoint override syntax (existing pattern):
```typescript
@Post('login')
@Throttle({ default: { limit: 10, ttl: 60_000 } })
async login(@Body() dto: LoginDto) { ... }
```

### 7.4 Idempotency

Mutating endpoints (`POST` creating a resource, `POST` triggering a side effect) SHOULD support `Idempotency-Key`:

- **Header:** `Idempotency-Key: <uuid-v4>`.
- **Behavior:** if the same `Idempotency-Key` is seen within 24 hours for the same `(userId, endpoint, key)`, the cached response is returned without re-executing.
- **Storage:** Redis with 24h TTL.
- **Required for:** `POST /ai-actions/execute` (most important — AI invocations are expensive), `POST /agents/{id}/dispatch`, `POST /payments/charge`.
- **Optional for:** all other mutating endpoints.

This is **not yet implemented** (gap #6 from audit). Implementation: EAOS-2 alongside AI Actions work.

### 7.5 Caching

- **Server-side:** none for v1. (Adding server-side cache requires a coherence strategy; deferred.)
- **Client-side:** `Cache-Control` is `no-store` for all authenticated responses by default. Public endpoints (e.g. `/health`, `/marketplace/templates`) may set `public, max-age=N`.
- **ETag / Last-Modified:** P2. Not implemented in v1.

### 7.6 CORS

- **Production:** `Access-Control-Allow-Origin` is set to the requesting tenant's allowed frontend origin(s), per `Tenant.allowedOrigins` field (gap — not yet on the schema; see §13 migration).
- **Development:** `*`.
- **Credentials:** `Access-Control-Allow-Credentials: true` (required for httpOnly refresh-token cookies — see §11.2 of `EAOS-frontend-data-layer.md`).

### 7.7 Localization

- `Accept-Language` header is honored. `data` field strings are translated via i18n keys; entity names/descriptions are stored in the user's preferred language.
- v1 supports: `en`, `es`, `fr`, `de`, `ar`, `zh-CN`. Other languages fall back to `en`.
- See `EAOS-i18n.md` (to be written, Tier 3 per `EAOS-implementation-plan.md` §14).

---

## 8. EAOS Resource Catalog

This is the **EAOS-required API surface** for the 10 capability panels + 1 modal in `EAOS-NUWS-principles.md` v1.2. Every resource is listed with its endpoints. Resources that are already implemented in the existing codebase are marked **(exists)**. Resources that need to be added are marked **(new)**.

### 8.1 Identity capability

| Method | Path | Purpose | Status |
|---|---|---|---|
| GET | `/api/v1/entities/{type}/{id}` | Universal entity workspace data (Identity, Health Signals, Lifecycle) | (new) |
| PATCH | `/api/v1/entities/{type}/{id}` | Update entity fields | (new) |
| POST | `/api/v1/entities/{type}/{id}/labels` | Add label to entity | (new) |
| DELETE | `/api/v1/entities/{type}/{id}/labels/{labelId}` | Remove label | (new) |
| POST | `/api/v1/entities/{type}/{id}/watch` | Watch entity | (new) |
| DELETE | `/api/v1/entities/{type}/{id}/watch` | Unwatch | (new) |
| POST | `/api/v1/entities/{type}/{id}/favorite` | Pin to favorites | (new) |
| DELETE | `/api/v1/entities/{type}/{id}/favorite` | Unpin | (new) |
| GET | `/api/v1/users/me/favorites` | List user's favorite entities | (new) |
| GET | `/api/v1/users/me/recent` | List user's recent entity access | (new) |
| GET | `/api/v1/users/me/watching` | List watched entities | (new) |
| GET | `/api/v1/entities/{type}/{id}/health` | Computed health + signals | (new) |

### 8.2 Context capability

| Method | Path | Purpose | Status |
|---|---|---|---|
| GET | `/api/v1/entities/{type}/{id}/ancestors` | Full path to root | (new) |
| GET | `/api/v1/entities/{type}/{id}/children` | Direct children | (new) |
| GET | `/api/v1/entities/{type}/{id}/siblings` | Same-level entities | (new) |
| GET | `/api/v1/entities/{type}/{id}/relationships` | All typed relationships | (new) |
| POST | `/api/v1/entities/{type}/{id}/relationships` | Create typed relationship | (new) |
| DELETE | `/api/v1/entities/{type}/{id}/relationships/{relId}` | Remove relationship | (new) |
| GET | `/api/v1/entities/{type}/{id}/graph` | 1-hop mini-graph data | (new, per `EAOS-NUWS-principles.md` §5.6 — P2 visual layout, v1 = JSON list) |

### 8.3 Intelligence capability

| Method | Path | Purpose | Status |
|---|---|---|---|
| GET | `/api/v1/entities/{type}/{id}/intelligence` | Current intelligence summary (AI Summary, Risks, Opportunities, Recommendations, Confidence, Last-generated) | (new) |
| POST | `/api/v1/entities/{type}/{id}/intelligence/refresh` | Regenerate intelligence | (new) |
| POST | `/api/v1/entities/{type}/{id}/intelligence/feedback` | Submit thumbs up/down on a recommendation | (new) |
| GET | `/api/v1/entities/{type}/{id}/intelligence/history` | Past regenerations | (new) |

### 8.4 Operations capability

| Method | Path | Purpose | Status |
|---|---|---|---|
| GET | `/api/v1/entities/{type}/{id}/tasks` | List tasks for entity | (partial — uses `tasks` resource filtered by entityRef) |
| GET | `/api/v1/entities/{type}/{id}/projects` | List projects | (partial — uses `projects` resource) |
| GET | `/api/v1/entities/{type}/{id}/workflows` | List workflows | (partial) |
| GET | `/api/v1/entities/{type}/{id}/goals` | List goals | (partial) |
| GET | `/api/v1/entities/{type}/{id}/routines` | List routines | (partial) |
| GET | `/api/v1/entities/{type}/{id}/workload` | Aggregate capacity vs demand | (new) |
| GET | `/api/v1/entities/{type}/{id}/calendar` | Calendar events for entity | (new) |

**Note:** Operations is currently served by separate resources (`/tasks`, `/projects`, etc.) with an `entityId` filter. The `/entities/{type}/{id}/...` routes above are new — they are conveniences that fetch multiple resources in a single round-trip (needed for the Operations panel's initial load to avoid waterfall requests).

### 8.5 Resources capability

| Method | Path | Purpose | Status |
|---|---|---|---|
| GET | `/api/v1/entities/{type}/{id}/resources` | All-in-one: human team, AI team, budget, documents, knowledge, integrations, assets | (new) |
| GET | `/api/v1/entities/{type}/{id}/human-team` | Humans assigned | (new) |
| GET | `/api/v1/entities/{type}/{id}/ai-team` | AI Employees assigned | (new) |
| GET | `/api/v1/entities/{type}/{id}/budget` | Budget summary (allocated/spent/remaining) | (new) |
| GET | `/api/v1/entities/{type}/{id}/documents` | Attached documents | (new) |
| GET | `/api/v1/entities/{type}/{id}/knowledge` | Linked knowledge entries | (new) |
| GET | `/api/v1/entities/{type}/{id}/integrations` | Connected external systems | (new) |
| GET | `/api/v1/entities/{type}/{id}/assets` | Equipment, inventory, real assets | (new) |

### 8.6 Collaboration capability

| Method | Path | Purpose | Status |
|---|---|---|---|
| GET | `/api/v1/entities/{type}/{id}/conversations` | Chat threads on entity | (partial) |
| POST | `/api/v1/entities/{type}/{id}/conversations` | Start new thread | (new) |
| GET | `/api/v1/entities/{type}/{id}/approvals` | Pending + completed | (new) |
| POST | `/api/v1/entities/{type}/{id}/approvals/{approvalId}/decide` | Approve / reject | (new) |
| GET | `/api/v1/entities/{type}/{id}/mentions` | @mentions of this entity | (new) |
| GET | `/api/v1/entities/{type}/{id}/meetings` | Scheduled + history | (new) |
| POST | `/api/v1/entities/{type}/{id}/meetings` | Schedule meeting | (new) |
| GET | `/api/v1/conversations/{id}/messages` | Message history | (new) |
| POST | `/api/v1/conversations/{id}/messages` | Send message | (new) |

### 8.7 Insights capability

| Method | Path | Purpose | Status |
|---|---|---|---|
| GET | `/api/v1/entities/{type}/{id}/insights` | All KPIs + analytics in one call | (new) |
| GET | `/api/v1/entities/{type}/{id}/kpis` | Just the hero KPIs (max 4) | (new) |
| GET | `/api/v1/entities/{type}/{id}/kpis/{kpiId}/explain` | AI explanation of a single KPI (per NUWS §2.7 "Explain" link) | (new) |
| GET | `/api/v1/entities/{type}/{id}/analytics` | Configurable analytics views | (new) |
| GET | `/api/v1/entities/{type}/{id}/reports` | Generated + scheduled reports | (new) |
| POST | `/api/v1/entities/{type}/{id}/reports` | Generate new report | (new) |

### 8.8 Automation capability

| Method | Path | Purpose | Status |
|---|---|---|---|
| GET | `/api/v1/entities/{type}/{id}/automations` | Active automations | (new) |
| GET | `/api/v1/entities/{type}/{id}/integrations` | (duplicate of §8.5; canonical is §8.5) | |
| GET | `/api/v1/entities/{type}/{id}/ai-actions/available` | List AI Actions available for this entity type | (new) |
| POST | `/api/v1/ai-actions/execute` | Execute an AI Action | (new) |
| GET | `/api/v1/ai-actions/{invocationId}` | Get invocation status + result | (new) |
| GET | `/api/v1/entities/{type}/{id}/webhooks` | Outbound webhooks | (new) |
| POST | `/api/v1/entities/{type}/{id}/webhooks` | Register webhook | (new) |
| GET | `/api/v1/integrations` | List tenant integrations (all kinds) | (exists, `integrations.controller.ts`) |
| POST | `/api/v1/integrations/{id}/sync` | Trigger manual sync | (new) |

### 8.9 Activity capability

| Method | Path | Purpose | Status |
|---|---|---|---|
| GET | `/api/v1/entities/{type}/{id}/activity` | Activity timeline, paginated, filterable by `actorType` (human/ai/workflow) | (new) |
| GET | `/api/v1/entities/{type}/{id}/audit` | Compliance-grade audit log (subset of activity) | (exists, `audit.controller.ts`) |
| GET | `/api/v1/audit-logs/tenant` | Tenant-scoped audit log | (exists) |
| GET | `/api/v1/audit-logs/platform` | Platform audit log (SUPER_ADMIN) | (exists) |

### 8.10 Lifecycle capability (NEW in NUWS v1.1)

| Method | Path | Purpose | Status |
|---|---|---|---|
| GET | `/api/v1/entities/{type}/{id}/lifecycle` | Current state + available transitions | (new) |
| POST | `/api/v1/entities/{type}/{id}/lifecycle/transition` | Execute state transition | (new) |
| GET | `/api/v1/entities/{type}/{id}/lifecycle/history` | State history with durations | (new) |
| POST | `/api/v1/entities/{type}/{id}/lifecycle/auto-transitions` | Define a scheduled transition | (new) |
| GET | `/api/v1/entities/{type}/{id}/lifecycle/why-not-active` | AI explanation when non-ACTIVE | (new) |
| GET | `/api/v1/entities/{type}/{id}/snapshots/{timestamp}` | Temporal point-in-time view | (new, requires Prisma temporal) |

### 8.11 Administration modal (gear icon, not a panel)

| Method | Path | Purpose | Status |
|---|---|---|---|
| GET | `/api/v1/entities/{type}/{id}/permissions` | Permission grants | (new) |
| PATCH | `/api/v1/entities/{type}/{id}/permissions` | Replace permission grants | (new) |
| GET | `/api/v1/entities/{type}/{id}/settings` | Entity-specific config | (new) |
| PATCH | `/api/v1/entities/{type}/{id}/settings` | Update settings | (new) |
| GET | `/api/v1/entities/{type}/{id}/api-keys` | API keys | (new) |
| POST | `/api/v1/entities/{type}/{id}/api-keys` | Create key | (new) |
| DELETE | `/api/v1/entities/{type}/{id}/api-keys/{keyId}` | Revoke key | (new) |
| GET | `/api/v1/entities/{type}/{id}/billing` | Billing info (if billable) | (new) |
| GET | `/api/v1/entities/{type}/{id}/audit-config` | Audit preferences | (new) |

### 8.12 Auth, user, tenant, tier (already exist)

Standard CRUD on auth, users, tenants, tiers is in the existing controllers. This spec requires them to be wrapped in the standardized envelopes (§3.2 and §3.3) and the new response DTOs (§5). The list of existing controllers is in `backend/src/modules/{auth,users,tenants,tiers}/*/`.

### 8.13 Mission Feed (per NUWS §5.4)

| Method | Path | Purpose | Status |
|---|---|---|---|
| GET | `/api/v1/mission-feed` | Current Mission Feed items for the dashboard | (new) |
| POST | `/api/v1/mission-feed/{itemId}/dismiss` | Dismiss an item (24h) | (new) |
| GET | `/api/v1/mission-feed/preferences` | Get user's personalization preferences | (new) |
| PATCH | `/api/v1/mission-feed/preferences` | Update preferences | (new) |

### 8.14 Command Palette (per NUWS §5.5)

The Command Palette is **purely client-side** (filters cached data + invokes existing endpoints). **No new backend routes.** Documented in `EAOS-frontend-data-layer.md`.

### 8.15 AI Roster (per NUWS §5.4 + EAOS-pricing-plans §0a)

| Method | Path | Purpose | Status |
|---|---|---|---|
| GET | `/api/v1/ai-roster` | Full AI Roster, filterable, groupable | (new) |
| GET | `/api/v1/ai-roster/by-template/{templateId}` | Instances of a template | (new) |
| GET | `/api/v1/ai-roster/credits` | Credit consumption per AI Employee this period | (new) |
| POST | `/api/v1/ai-roster/{id}/pause` | Pause an AI Employee | (new) |
| POST | `/api/v1/ai-roster/{id}/resume` | Resume | (new) |
| POST | `/api/v1/ai-roster/{id}/archive` | Archive | (new) |

### 8.16 Compare View (per NUWS §5.7)

| Method | Path | Purpose | Status |
|---|---|---|---|
| GET | `/api/v1/compare?ids=department:abc,department:def&ids=facility:xyz` | Compare up to 4 entities | (new) |
| GET | `/api/v1/compare/{comparisonId}` | Resume a saved comparison | (new) |
| POST | `/api/v1/compare` | Save a comparison for sharing | (new) |

### 8.17 Knowledge Hub (per NUWS §2.10 + `EAOS-implementation-plan.md` §7)

| Method | Path | Purpose | Status |
|---|---|---|---|
| GET | `/api/v1/knowledge` | List Knowledge entries | (exists, `memory.controller.ts:73` — needs rename to `knowledge`) |
| POST | `/api/v1/knowledge` | Create entry | (exists) |
| GET | `/api/v1/knowledge/{id}` | Read entry | (exists) |
| PATCH | `/api/v1/knowledge/{id}` | Update | (exists) |
| DELETE | `/api/v1/knowledge/{id}` | Soft delete | (exists) |
| GET | `/api/v1/knowledge/search?q=...` | Full-text + semantic search | (exists via `memory.service.ts:search`) |
| POST | `/api/v1/knowledge/rag-ask` | RAG Q&A with citations (per NUWS §2.3) | (new) |
| GET | `/api/v1/knowledge/{id}/citations` | Where this entry has been cited | (new) |

### 8.18 Streaming (SSE, per `agent-streaming.controller.ts`)

| Method | Path | Purpose | Status |
|---|---|---|---|
| POST | `/api/v1/agents/streaming/sessions` | Create streaming session | (exists) |
| GET | `/api/v1/agents/streaming/sessions/{id}/events` | SSE stream of `AgentStreamingEvent` | (exists) |
| POST | `/api/v1/agents/streaming/sessions/{id}/execute` | Fire-and-forget execute | (exists) |
| GET | `/api/v1/agents/streaming/sessions/{id}` | Session metadata | (exists) |
| GET | `/api/v1/agents/streaming/sessions` | List active | (exists) |
| DELETE | `/api/v1/agents/streaming/sessions/{id}` | Close session | (exists) |
| GET | `/api/v1/agents/streaming/tools` | Available tool definitions | (exists) |

The existing `@Controller('api/v1/agents/streaming')` hand-rolled full path is **deprecated**; the new path convention moves it to standard `@Controller({ path: 'agents/streaming', version: '1' })` (Nest will prepend `/api/v1/`). See `agent-streaming.controller.ts:11` for the hand-roll.

### 8.19 Marketplace (per `EAOS-implementation-plan.md` §5)

| Method | Path | Purpose | Status |
|---|---|---|---|
| GET | `/api/v1/marketplace/packs` | List Solution Packs | (new, `solution-packs` module planned) |
| GET | `/api/v1/marketplace/packs/{slug}` | Pack details | (new) |
| POST | `/api/v1/marketplace/packs/{slug}/install` | Install pack | (new) |
| DELETE | `/api/v1/marketplace/packs/{slug}` | Uninstall | (new) |
| GET | `/api/v1/marketplace/agent-templates` | Browse agent templates | (exists, `agent-templates.controller.ts`) |
| GET | `/api/v1/marketplace/connectors` | Browse connectors | (exists) |
| GET | `/api/v1/marketplace/workflows` | Browse workflow templates | (new) |
| GET | `/api/v1/marketplace/knowledge-packs` | Browse knowledge packs | (new) |

---

## 9. Realtime (WebSocket + SSE)

### 9.1 WebSocket — `events.gateway.ts`

Already implemented and correct. Documented here for the contract.

- **URL:** `wss://api.neurecore.com/` (root namespace). `NEXT_PUBLIC_SOCKET_URL` env on frontend.
- **Auth:** JWT in `auth.token` or `Authorization` header at `io.connect` time.
- **Rooms (auto-joined):** `user:{sub}`, `tenant:{tenantId}`.
- **Client→server messages:** only `ping` → `pong`.

**Server→client events (canonical list):**

| Event | Payload | Triggered by |
|---|---|---|
| `agent:status_updated` | `{ agentId, status, subState, timestamp }` | Agent lifecycle |
| `agent:error` | `{ agentId, taskId, error, timestamp }` | Agent failure |
| `task:started` | `{ taskId, agentId, timestamp }` | Task dispatch |
| `task:completed` | `{ taskId, agentId, success, error?, timestamp }` | Task success |
| `task:failed` | `{ taskId, agentId, error, timestamp }` | Task failure |
| `memory:updated` | `{ agentId, entryId, timestamp }` | Memory write |
| `system:alert` | `{ level, message, timestamp }` | System alert |
| `workflow:status_changed` | `{ workflowId, status, timestamp }` | Workflow state change |
| `governance:triggered` | `{ agentId, allowed, triggeredRules, requiresApproval, timestamp }` | Governance rule |
| `notification:new` | `{ notificationId, type, message, link, timestamp }` | New notification |
| `approval:requested` | `{ approvalId, requesterId, resource, timestamp }` | New approval request |
| `intelligence:refreshed` | `{ entityType, entityId, intelligenceId, timestamp }` | Background regen of Intelligence panel |
| `mission_feed:updated` | `{ added: number, removed: number, timestamp }` | Mission Feed recomputation |
| `lifecycle:transitioned` | `{ entityType, entityId, fromState, toState, actor, timestamp }` | State machine transition |
| `audit:logged` | `{ auditId, severity, timestamp }` | Audit log write (real-time for compliance dashboards) |

### 9.2 SSE — `agent-streaming.controller.ts`

Already implemented. Already `@SkipThrottle()`. Documented for completeness.

- **Event format:** standard SSE `data: {json}\n\n` with `event: <type>` optional.
- **Event types (in `AgentStreamingEvent`):** `CONNECTED`, `START`, `STEP_START`, `STEP_COMPLETE`, `STEP_ERROR`, `COMPLETE`, `CANCELLED`, `ERROR`.
- **Auth:** currently **none** (gap!). The existing controller at `agent-streaming.controller.ts:71-132` accepts the session ID and assumes the requester owns the session. **Fix in EAOS-1:** add a session-ownership check (session stores `userId`; reject if `userId !== currentUser.id` unless platform role).

### 9.3 Push subscription model

For EAOS-specific push (Intelligence refresh, Mission Feed, Lifecycle transitions), clients use the WebSocket. They do **not** poll the HTTP endpoints for these. The HTTP endpoints in §8 are only for initial load and explicit refresh.

---

## 10. Versioning & Deprecation

- **Current version:** `v1` (locked).
- **Deprecation policy:** when an endpoint is deprecated, the response includes `Deprecation: true` and `Sunset: <date>` headers. `Deprecation: true` continues for 6 months after `Sunset`. After that, the endpoint returns `410 Gone`.
- **Field-level deprecation:** deprecated fields return their value but add a `X-Deprecated-Field: <name>` response header.
- **Migration announcements:** published in `/api/v1/changelog` (new) and pushed via `system:alert` WebSocket event.

---

## 11. OpenAPI 3.1 Generation

This is the **largest new addition** in this spec.

### 11.1 Tooling

- **Library:** `@nestjs/swagger` (existing NestJS integration).
- **Spec version:** OpenAPI 3.1.0.
- **UI:** Swagger UI at `/api/docs` (development and Enterprise-tier production; gated behind `SUPER_ADMIN` in production).
- **CLI generator:** `nest-cli` + `@nestjs/swagger` plugin for DTO → schema inference. `nest-cli.json` plugin block:
  ```json
  {
    "plugins": [{
      "name": "@nestjs/swagger",
      "options": {
        "classValidatorShim": true,
        "introspectComments": true
      }
    }]
  }
  ```

### 11.2 Annotation rules

**Every controller** MUST add:
- `@ApiTags('<TagName>')` at the class level. Tag name = resource name (plural, kebab-case).
- `@ApiOperation({ summary, description? })` on every method.
- `@ApiResponse({ status, description, type })` on every method.
- `@ApiBearerAuth()` on every controller except `@Public()` ones.
- `@ApiParam({ name, type, format })` on path params.
- `@ApiQuery({ name, required, type, description })` on query params.
- `@ApiSecurity('tenant')` on endpoints that require tenant context (or `@ApiSecurity('platform')` on platform-only endpoints).

**Every DTO** MUST add:
- `@ApiProperty({ description, example, required? })` on every field.
- `@ApiPropertyOptional()` on optional fields.
- For enum fields: `enum: UserRole, enumName: 'UserRole'`.

### 11.3 Generation flow

```
NestJS controllers + DTOs
        │
        ├── @nestjs/swagger plugin
        │       │
        │       ▼
        │   OpenAPI 3.1 JSON (at /api/docs-json)
        │       │
        │       ▼
        │   openapi-typescript (npm)
        │       │
        │       ▼
        │   frontend-tenant/src/api/generated/types.ts
        │       │
        │       ▼
        │   TanStack Query hooks (codegen layer)
        │       │
        │       ▼
        │   useQuery / useMutation (type-safe)
```

CI fails if controllers are added/modified without regenerating the OpenAPI spec.

### 11.4 Output artifact

- **Path:** `backend/openapi/openapi.json` (committed, version-controlled).
- **CDN:** `https://api.neurecore.com/api/v1/docs-json` (live, current).
- **Partners:** the public `marketplace` module exposes a subset of the spec at `/api/v1/marketplace/docs-json` for third-party Solution Pack developers.

---

## 12. Backwards Compatibility & Migration

### 12.1 Breaking changes this spec introduces

1. **List response key renamed** from `data` (or `items` or raw array) to `items` (with `pagination` wrapper). Frontend must update.
2. **Action responses wrapped** in `ActionResult<T>`. Frontend must unwrap or treat body as `{ success, message, data? }`.
3. **Response DTOs** strip internal fields (e.g. `passwordHash`, `permissions` JSON). Frontend relying on these fields breaks.
4. **Pagination params** now come from a DTO. Old `?page=1&limit=20` still works (the DTO binds them), but controllers no longer accept them as inline strings.
5. **Tenant resolution** helper moves to `common/utils/`. Direct uses of `user.tenantId` in services become `tenantContext.tenantId` after EAOS-1 ships.

### 12.2 Migration order

To minimize risk, migration is in 4 phases:

1. **Phase 1 — Adopt OpenAPI annotations** (no breaking change). Annotate every existing controller/DTO with `@ApiTags`, `@ApiOperation`, etc. Generate the OpenAPI artifact. Frontend may continue using its hand-written types.
2. **Phase 2 — Standardize list responses** (breaking for frontend). Migrate one controller at a time: agents → departments → projects → goals → tasks → workflows → routines → audit → integrations → tools → users → tenants. Frontend `unwrapList` already handles multiple shapes; update it once per migration.
3. **Phase 3 — Standardize action responses** (breaking for frontend). Same one-controller-at-a-time pattern.
4. **Phase 4 — Response DTOs** (most breaking). Services return `XxxResponseDto.fromEntity()`. This is a large change; recommend doing it module-by-module with the rest of the EAOS entity refactor.

### 12.3 Versioning strategy during migration

- During Phases 2-3, the new shapes ship under the same `v1` URL but the frontend must be updated in lockstep. **No `v1.1` period.**
- Phase 4 (response DTOs) introduces internal serialization changes; the wire contract is stable but the *content* changes (fewer fields). Frontends reading the missing fields break.
- A feature flag `USE_NEW_API_SHAPES` (in `EAOS-frontend-data-layer.md` §13) lets the frontend opt into the new shapes per route.

---

## 13. EAOS-Specific Notes

### 13.1 Entity workspace loading strategy

The Intelligence panel demands the AI summary on first paint. To meet the <3s target (NUWS §7.4), the workspace page cannot waterfall 11+ requests. Three strategies are available:

- **Strategy A: Single composite endpoint** `GET /api/v1/entities/{type}/{id}/workspace` returns ALL 10 capabilities in one call. Pros: one round-trip. Cons: payload is huge; partial failures fail the whole thing.
- **Strategy B: Two-tier fetch** `GET /api/v1/entities/{type}/{id}/workspace/summary` (Identity, Intelligence, Health, Lifecycle) + lazy per-panel fetches. Pros: fast first paint, lazy deep loads. Cons: two round-trips minimum.
- **Strategy C: GraphQL** (one query, partial success). Pros: ideal. Cons: requires new gateway infra.

**Decision (binding):** Strategy B for EAOS-1 (and probably forever). The summary endpoint is a new resource added in §8 (Identity §8.1). The summary endpoint is `Cache-Control: private, max-age=30` — Intel summary is fresh for 30s.

### 13.2 AI Action invocation lifecycle

`POST /api/v1/ai-actions/execute`:

```
Request:
{
  "action": "ai:summary",        // AI Action ID
  "entityType": "DEPARTMENT",
  "entityId": "uuid",
  "parameters": { ... },
  "context": {
    "includeHistory": true,
    "includeKnowledge": true,
    "includeRelated": false
  },
  "outputPreference": {
    "format": "text",
    "verbosity": "standard"
  }
}

Response (202 Accepted):
{
  "status": "success",
  "data": {
    "invocationId": "uuid",
    "status": "started",
    "estimatedDurationMs": 4000
  },
  ...
}
```

**Client then subscribes:**
- WebSocket `intelligence:refreshed` event (for streaming into the Intelligence panel).
- Or polls `GET /api/v1/ai-actions/{invocationId}` for status.

When `status === 'completed'`, the response includes the AI Action output and citation chips:

```typescript
interface AIActionInvocationResponse {
  invocationId: string;
  status: 'started' | 'in_progress' | 'completed' | 'failed';
  output?: unknown;                  // action-specific
  citations?: Citation[];            // for knowledge-backed outputs
  metadata: {
    model: string;
    tokensUsed: number;
    durationMs: number;
    confidence: number;
    errors?: string[];
  };
}
```

### 13.3 Streaming citations

Citation chips (per NUWS §2.3) point to `KnowledgeEntry` IDs. Click handling:
- Frontend opens slide-over at `/knowledge/{entryId}/preview` (lightweight).
- Slide-over has "Open full page" link to `/knowledge/{entryId}` (full record).

**No new backend route** — reuses existing `GET /api/v1/knowledge/{id}`. The slide-over URL is a frontend route, not a backend route.

### 13.4 Mission Feed (EAOS-1)

`GET /api/v1/mission-feed` response:

```typescript
interface MissionFeedResponse {
  items: MissionFeedItem[];
  computedAt: string;          // ISO timestamp
  recomputeIn: number;         // seconds until next recompute
}

interface MissionFeedItem {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  aiConfidence: number;        // 0-1
  entityRef: { type: string; id: string };
  breadcrumb: string[];        // ['Sales', 'Q3 Campaign', 'Acme Corp']
  actions: Array<{
    label: string;
    action: 'open' | 'delegate' | 'schedule' | 'dismiss' | 'brief';
    target?: string;           // entity/AI-Action ID
  }>;
  reasoning?: string;          // "Show reasoning" hover
  expiresAt?: string;
}
```

**Computation:** tenant-level default. Background job recomputes every 5 min (configurable per tenant). The response is cached server-side. Per-user opt-in (per `EAOS-implementation-plan.md` §14.2 Q1) adds a `userId` filter to the query and uses a per-user cache.

---

## 14. Implementation Checklist

| # | Task | Phase | Owner | Status |
|---|---|---|---|---|
| 1 | Add `@nestjs/swagger` to `package.json` | EAOS-1 | Backend | (new) |
| 2 | Configure `nest-cli.json` plugin | EAOS-1 | Backend | (new) |
| 3 | Annotate every existing controller with `@ApiTags`, `@ApiOperation`, `@ApiResponse`, `@ApiBearerAuth` | EAOS-1 | Backend | (new) |
| 4 | Annotate every existing DTO with `@ApiProperty` | EAOS-1 | Backend | (new) |
| 5 | Generate first OpenAPI artifact | EAOS-1 | Backend | (new) |
| 6 | Create `PaginationDto` and `IdParamDto` in `common/dto/` | EAOS-1 | Backend | (new) |
| 7 | Extract `resolveTenantContext` to `common/utils/` | EAOS-1 | Backend | (new) |
| 8 | Migrate list responses to `PaginatedResponse<T>` (per-controller) | EAOS-1/2 | Backend | (new) |
| 9 | Migrate action responses to `ActionResult<T>` (per-controller) | EAOS-1/2 | Backend | (new) |
| 10 | Create paired `XxxResponseDto` for every entity | EAOS-1/2/3 | Backend | (new) |
| 11 | Implement `TenantContextService` + middleware | EAOS-1 | Backend | (new) |
| 12 | Implement `Idempotency-Key` middleware | EAOS-2 | Backend | (new) |
| 13 | Implement per-endpoint `@Throttle()` overrides | EAOS-1 | Backend | (new) |
| 14 | Add `Tenant.allowedOrigins` to schema | EAOS-1 | Backend | (new) |
| 15 | Delete duplicate `security/guards/roles.guard.ts` and `security.types.ts:UserRole` | EAOS-1 | Backend | (new) |
| 16 | Fix `agent-streaming.controller.ts` SSE auth | EAOS-1 | Backend | (new) |
| 17 | Move streaming controller to standard `@Controller({ path, version })` | EAOS-1 | Backend | (new) |
| 18 | Add `application/problem+json` support | P2 | Backend | (deferred) |
| 19 | Add cursor pagination | P2 | Backend | (deferred) |
| 20 | Add ETag / Last-Modified | P2 | Backend | (deferred) |
| 21 | Generate `frontend-tenant/src/api/generated/types.ts` from OpenAPI | EAOS-1 | Frontend | (new) |
| 22 | Build `restClient`-backed `queryFn` factory | EAOS-1 | Frontend | (new) |
| 23 | Update `unwrapList` to handle only the new `PaginatedResponse` shape | EAOS-2 | Frontend | (new) |
| 24 | Update frontend handlers for `ActionResult` | EAOS-2 | Frontend | (new) |

---

## 15. Open Decisions Deferred to EAOS-2/3

1. **Strategy C (GraphQL)** — revisit if Strategy B is insufficient.
2. **`application/problem+json` (RFC 7807)** — non-blocking; the custom envelope is fine.
3. **ETag / Last-Modified** — nice-to-have for cache efficiency.
4. **Cursor pagination** — needed when lists exceed 10K items (Mission Feed at enterprise scale).
5. **Public API for Solution Pack developers** — separate OpenAPI subset, gated by `marketplace` module.
6. **Webhooks v2 with retry/backoff** — P2; current implementation is fire-and-forget.

---

**End of document.**
