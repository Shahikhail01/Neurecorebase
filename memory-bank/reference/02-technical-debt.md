# Reference — Technical Debt

**Last Updated:** 2026-06-30
**Last Verified:** 2026-06-30
**Audience:** All engineers

---

## Technical Debt Items

### 1. Missing Database Column

**Item:** `Tier.defaultBudgetPerDay` column missing
**Severity:** Medium
**Effort:** Low (1 migration)

The Prisma schema references a column that doesn't exist in the database.

---

### 2. CSRF Exemptions

**Item:** `/register` and `/google` endpoints not CSRF-exempt
**Severity:** Low
**Effort:** Low (1 line change in csrf.middleware.ts)

These endpoints require CSRF tokens but should be exempt.

---

### 3. Audit Log Database Writes

**Item:** AuditInterceptor only logs to console, not to DB
**Severity:** Medium
**Effort:** Medium

`AuditInterceptor` should write to `AuditLog` table, not just console.log.

---

### 4. Duplicate RolesGuard

**Item:** Two RolesGuard files exist
**Severity:** Low
**Effort:** Low (delete one file)

- `auth/guards/roles.guard.ts` (correct)
- `security/guards/roles.guard.ts` (duplicate, divergent)

---

### 5. Dead Permissions Code

**Item:** `PermissionsGuard`, `RequirePermissions`, `Permission` enum, `ROLE_PERMISSIONS` unused
**Severity:** Low
**Effort:** Medium (cleanup)

1115 lines of dead code should be removed per RBAC spec.

---

### 6. Tenant Resolution Duplication

**Item:** `resolveTenantId` duplicated 15+ times
**Severity:** Low
**Effort:** Low (extract to utility)

Should be extracted to `common/utils/resolve-tenant-context.ts`.

---

### 7. TierLimits Expansion

**Item:** `@TierLimit` used only 2x of 7 possible limits
**Severity:** Low
**Effort:** Medium

Should expand to cover all tier limits.

---

## Future Improvements

### High Priority

1. Fix CSRF exemptions
2. Add missing `defaultBudgetPerDay` migration
3. Remove dead RolesGuard

### Medium Priority

1. Implement AuditInterceptor DB writes
2. Expand TierLimits usage
3. Extract TenantContext utility

### Low Priority

1. Code cleanup of unused permissions system
2. Performance optimization for dashboard queries

---

## Related Documents

- `01-known-issues.md` — Known issues
- `03-decisions.md` — Architectural decisions
