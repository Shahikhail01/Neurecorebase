# Security — Authentication

**Last Updated:** 2026-06-30
**Last Verified:** 2026-06-30 (code inspection)
**Audience:** All engineers

---

## Overview

NeureCore uses cookie-based authentication as the sole authentication mechanism. There is NO `Authorization: Bearer` token authentication.

---

## Cookie Authentication

### Cookie Names & Flags

| Cookie | Purpose | Flags |
|---|---|---|
| `__Host-nc_at` | Access Token (JWT) | httpOnly, Secure, SameSite=Strict |
| `__Host-nc_rt` | Refresh Token | httpOnly, Secure, SameSite=Strict |
| `__Host-nc_csrf` | CSRF Token | httpOnly, Secure, SameSite=Strict |

### Cookie Requirements

- **`__Host-` prefix:** Requires HTTPS and prevents subdomain cookie theft
- **`httpOnly`:** Cannot be accessed by JavaScript (XSS protection)
- **`Secure`:** Only sent over HTTPS
- **`SameSite=Strict`:** Not sent on cross-site requests

---

## Backend Implementation

### Cookie Auth Service

Location: `backend/src/common/auth/cookie-auth.service.ts`

```typescript
// Cookie names
export const ACCESS_TOKEN_COOKIE = '__Host-nc_at';
export const REFRESH_TOKEN_COOKIE = '__Host-nc_rt';
export const CSRF_TOKEN_COOKIE = '__Host-nc_csrf';

// Cookie options
const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'strict' as const,
  path: '/',
};
```

### JWT Strategy

Location: `backend/src/modules/auth/strategies/jwt.strategy.ts`

Reads access token from cookie via `cookieExtractor`.

### Auth Controller

Location: `backend/src/modules/auth/controllers/auth.controller.ts`

Sets cookies on login/register via `attachAuthCookies()`.

---

## Frontend Implementation

### CookieManager

Location: `frontend-eaos/src/infrastructure/auth/CookieManager.ts`

Knows all three cookie names and provides helper methods.

### RestClient

Location: `frontend-eaos/src/infrastructure/api/RestClient.ts`

- Sets `credentials: 'include'` for all requests
- Adds `X-CSRF-Token` header from cookie for mutations

### SSE/Socket

Both use `withCredentials: true`.

---

## Token Flow

### Login

```
1. User submits credentials
2. Backend validates, creates JWT, sets cookies
3. Browser stores cookies (httpOnly, not accessible to JS)
```

### Authenticated Request

```
1. Browser automatically sends cookies with request
2. Backend JWT strategy extracts token from cookie
3. Request proceeds if token valid
```

### Token Refresh

```
1. Access token expires
2. Frontend calls /auth/refresh with refresh token cookie
3. Backend validates refresh token, issues new access token
4. New cookies set
```

### Logout

```
1. Frontend calls /auth/logout
2. Backend clears cookies
3. Session terminated
```

---

## CSRF Protection

### Double-Submit Pattern

1. Server sets `__Host-nc_csrf` cookie (httpOnly)
2. Frontend reads cookie value
3. Frontend sends `X-CSRF-Token` header with request
4. Backend validates header matches cookie

### CSRF Exemptions

Only these endpoints are CSRF-exempt:
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`

### CSRF Middleware

Location: `backend/src/common/auth/csrf.middleware.ts`

Applied globally in `app.module.ts`.

---

## JWT Structure

```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "role": "OWNER",
  "tenantId": "tenant-id",
  "jti": "token-id",
  "iat": 1234567890,
  "exp": 1234571490
}
```

---

## Security Notes

### DO

- ✅ Always use HTTPS in production
- ✅ Keep JWT_SECRET 32+ characters
- ✅ Use `__Host-` prefix for cookies
- ✅ Send CSRF token on mutations

### DON'T

- ❌ Store tokens in localStorage (XSS vulnerable)
- ❌ Disable `httpOnly` flag
- ❌ Use `sameSite: none` without Secure
- ❌ Log JWT_SECRET or refresh tokens

---

## Related Documents

- `02-csrf.md` — CSRF protection details
- `03-rbac.md` — Role-based access control
- `../backend/01-backend.md` — Backend auth implementation
