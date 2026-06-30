# Security — CSRF Protection

**Last Updated:** 2026-06-30
**Last Verified:** 2026-06-30
**Audience:** All engineers

---

## Overview

CSRF (Cross-Site Request Forgery) protection uses the double-submit cookie pattern. All mutating requests require a CSRF token.

---

## Implementation

### Cookie

```
Cookie: __Host-nc_csrf=<csrf-token>
```

### Header

```
X-CSRF-Token: <csrf-token>
```

---

## CSRF Middleware

Location: `backend/src/common/auth/csrf.middleware.ts`

Applied globally in `app.module.ts`:
```typescript
app.use(CsrfProtectionMiddleware)
```

---

## Exempted Endpoints

| Endpoint | Method | Reason |
|---|---|---|
| `/api/v1/auth/login` | POST | Public login |
| `/api/v1/auth/refresh` | POST | Token refresh |

**Note:** `/register` and `/google` auth endpoints are NOT currently exempt and require CSRF tokens.

---

## Frontend Handling

### RestClient

Automatically reads `__Host-nc_csrf` cookie and adds `X-CSRF-Token` header for:
- POST
- PUT
- PATCH
- DELETE

### SSE/Socket

Uses `withCredentials: true` for cross-site requests.

---

## Testing CSRF

### Valid Request

```bash
curl -X POST https://brain.neurecore.com/api/v1/agents \
  -H 'Content-Type: application/json' \
  -H 'X-CSRF-Token: <valid-token>' \
  -b '__Host-nc_csrf=<valid-token>; __Host-nc_at=<access-token>' \
  -d '{"name": "Test"}'
```

### Invalid/Missing CSRF

```bash
curl -X POST https://brain.neurecore.com/api/v1/agents \
  -H 'Content-Type: application/json' \
  -b '__Host-nc_at=<access-token>' \
  -d '{"name": "Test"}'
# Expected: 403 Forbidden
```

---

## Related Documents

- `01-authentication.md` — Auth overview
- `03-rbac.md` — RBAC
