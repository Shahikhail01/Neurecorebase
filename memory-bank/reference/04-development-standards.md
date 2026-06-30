# Reference — Development Standards

**Last Updated:** 2026-06-30
**Last Verified:** 2026-06-30
**Audience:** All engineers

---

## Code Standards

### TypeScript

- Use strict TypeScript
- Avoid `any` type
- Use interfaces for object shapes
- Use types for unions/primitives

### Naming Conventions

| Item | Convention | Example |
|---|---|---|
| Files | kebab-case | `cookie-auth.service.ts` |
| Classes | PascalCase | `CookieAuthService` |
| Functions | camelCase | `attachAuthCookies` |
| Constants | UPPER_SNAKE | `ACCESS_TOKEN_COOKIE` |
| Interfaces | PascalCase | `UserResponse` |

### NestJS Modules

- One module per feature/domain
- Use dependency injection
- Export only necessary providers

---

## Git Standards

### Commit Messages

```
type(scope): description

Types: feat, fix, docs, style, refactor, test, chore
```

Examples:
```
feat(auth): add cookie refresh endpoint
fix(agents): handle null agent name
docs(api): update endpoint documentation
```

### Branch Naming

```
<type>/<ticket>-<description>

feature/PROJ-123-add-user-export
fix/PROJ-456-agent-timeout
```

---

## API Design

### REST Conventions

| Method | Action |
|---|---|
| GET | Read/list |
| POST | Create |
| PUT | Full replace |
| PATCH | Partial update |
| DELETE | Delete |

### Response Envelope

Always use standard envelope:
```json
{
  "status": "success" | "error",
  "data": { ... }
}
```

### Error Codes

Use standard error codes:
- `UNAUTHORIZED` (401)
- `FORBIDDEN` (403)
- `NOT_FOUND` (404)
- `VALIDATION_ERROR` (400)
- `RATE_LIMITED` (429)
- `INTERNAL_ERROR` (500)

---

## Testing

### Unit Tests

- Test services, guards, decorators
- Use Jest
- Mock dependencies

### Integration Tests

- Test API endpoints
- Use supertest

---

## Code Review

### Checklist

- [ ] Tests pass
- [ ] Lint passes
- [ ] Types correct
- [ ] Error handling
- [ ] No secrets committed
- [ ] Documentation updated

---

## Related Documents

- `../backend/01-backend.md` — Backend standards
- `../frontend-eaos/01-frontend-eaos.md` — Frontend standards
