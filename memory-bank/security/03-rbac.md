# Security — RBAC (Role-Based Access Control)

**Last Updated:** 2026-06-30
**Last Verified:** 2026-06-30
**Audience:** Backend and frontend engineers

---

## Overview

NeureCore implements a four-layer authorization model:

1. **Role** — Coarse tenant/platform identity
2. **Resource ownership** — Entity-level access
3. **Action policy** — AI action permissions
4. **Row-level security** — Tenant isolation via Prisma

---

## User Roles

Defined in `prisma/schema.prisma`:

```prisma
enum UserRole {
  SUPER_ADMIN    // Platform-wide (no tenant)
  ADMIN         // Tenant admin
  OWNER         // Tenant owner
  MANAGER       // Department manager
  AGENT         // AI agent
  VIEWER        // Read-only
}
```

---

## Authorization Decorators

### @Roles()

```typescript
@Roles(UserRole.ADMIN, UserRole.OWNER)
@Get()
async list() { ... }
```

### @Public()

Exempts endpoint from auth:

```typescript
@Public()
@Get('health')
async health() { ... }
```

### @TierLimit()

Enforces tier-based limits:

```typescript
@TierLimit('maxUsers')
@Post()
async createUser() { ... }
```

---

## Guards

### RolesGuard

Enforces `@Roles()` decorator.

### JwtAuthGuard

Validates JWT and attaches user to request.

### EntityOwnerGuard

Checks resource ownership.

### TierLimitsGuard

Enforces tier limits.

---

## Tenant Isolation

All queries include `where: { tenantId }` to ensure tenant data isolation.

```typescript
const agents = await this.prisma.agent.findMany({
  where: { tenantId: user.tenantId },
});
```

---

## Permission Model

### Roles Hierarchy

No hierarchy — strict role equality. Each role has specific permissions.

### Resource Permissions

| Resource | SUPER_ADMIN | ADMIN | OWNER | MANAGER | AGENT | VIEWER |
|---|---|---|---|---|---|---|
| Users | CRUD | CRUD | R | — | — | R |
| Agents | CRUD | CRUD | CRUD | CRUD | R | R |
| Tenants | CRUD | RU | RU | — | — | — |
| Departments | CRUD | CRUD | CRUD | CRUD | — | R |

---

## Audit Logging

Audit logs are created for mutating operations via `AuditInterceptor`.

---

## Related Documents

- `01-authentication.md` — Auth overview
- `02-csrf.md` — CSRF protection
- `../backend/01-backend.md` — Backend implementation
