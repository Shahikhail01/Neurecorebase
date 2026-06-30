# Backend — API Contracts

**Last Updated:** 2026-06-30
**Last Verified:** 2026-06-30 (code inspection)
**Audience:** Frontend developers, API consumers, backend engineers

---

## API Overview

- **Base URL:** `https://brain.neurecore.com/api/v1`
- **Versioning:** URI versioning (`/api/v1/`)
- **Format:** JSON
- **Auth:** Cookie-based (httpOnly cookies)
- **OpenAPI:** `https://brain.neurecore.com/api/docs`

---

## Response Envelope

All API responses follow a standard envelope:

### Success

```json
{
  "status": "success",
  "data": { ... }
}
```

### Error

```json
{
  "status": "error",
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token"
  }
}
```

### Paginated Response

```json
{
  "status": "success",
  "data": {
    "data": [ ... ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

---

## Authentication Endpoints

### POST /auth/login

Login with email/password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "user": { "id": "...", "email": "...", "role": "..." },
    "tokens": {
      "accessToken": "...",
      "refreshToken": "..."
    }
  }
}
```

**Sets cookies:** `__Host-nc_at`, `__Host-nc_rt`, `__Host-nc_csrf`

### POST /auth/register

Register new user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "Password123!",
  "firstName": "John",
  "lastName": "Doe",
  "companyName": "Acme Inc"
}
```

### POST /auth/refresh

Refresh access token using refresh token cookie.

**Response:** New access token + updated cookies.

### GET /auth/me

Get current authenticated user.

**Requires:** Valid `__Host-nc_at` cookie.

**Response:**
```json
{
  "status": "success",
  "data": {
    "id": "...",
    "email": "...",
    "role": "OWNER",
    "tenantId": "...",
    "tenant": { ... }
  }
}
```

---

## Agent Endpoints

### GET /agents

List agents for current tenant.

**Query params:**
- `limit` (default: 20)
- `offset` (default: 0)
- `search` (optional)

### POST /agents

Create new agent.

### GET /agents/:id

Get agent by ID.

### PATCH /agents/:id

Update agent.

### DELETE /agents/:id

Delete agent.

---

## Tool Endpoints

### GET /tools

List available tools.

### POST /tools/execute

Execute a tool.

**Request:**
```json
{
  "toolName": "web_search",
  "parameters": { "query": "..." }
}
```

---

## Tenant Endpoints

### GET /tenants

Get current tenant.

### PATCH /tenants/:id

Update tenant settings.

---

## CSRF

Mutating endpoints (POST, PATCH, PUT, DELETE) require `X-CSRF-Token` header except for:
- `/api/v1/auth/login`
- `/api/v1/auth/refresh`

CSRF token value is in the `__Host-nc_csrf` cookie. Frontend reads cookie and sends as header.

---

## Rate Limiting

- **Limit:** 100 requests per 60 seconds per IP
- **Response:** 429 Too Many Requests when exceeded

---

## Error Codes

| Code | HTTP Status | Description |
|---|---|---|
| UNAUTHORIZED | 401 | Missing or invalid auth |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| VALIDATION_ERROR | 400 | Invalid request data |
| RATE_LIMITED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Server error |

---

## Related Documents

- `01-backend.md` — Backend architecture
- `03-database.md` — Prisma schema
- `../security/01-authentication.md` — Auth system
