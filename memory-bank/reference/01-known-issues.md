# Reference — Known Issues

**Last Updated:** 2026-07-01
**Last Verified:** 2026-07-01
**Audience:** All engineers

---

## Known Issues

### 1. CSRF Exemptions Incomplete

**Severity:** Low
**Status:** Known limitation

The CSRF middleware only exempts:
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`

**NOT exempted (require CSRF token):**
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/google`

**Impact:** Registration and Google OAuth flows require CSRF token.

**Workaround:** Frontend should handle CSRF for these flows.

---

### 2. Missing `defaultBudgetPerDay` Column

**Severity:** Medium
**Status:** Planned migration pending

The `Tier` model references `defaultBudgetPerDay` column which doesn't exist in the database.

**Impact:** Tier budget limits may not enforce correctly.

**Workaround:** Manual monitoring of tier limits.

---

### 3. Metrics Endpoint History

**Severity:** Medium (was)
**Status:** Fixed

Previously `/api/metrics` returned 404. This was fixed in the One-Source consolidation by adding explicit Express middleware in `main.ts`.

**Verification:**
```bash
curl -s http://127.0.0.1:3003/api/metrics | head -5
```

---

### 4. Phase 8 Seed Schema Mismatches

**Severity:** High
**Status:** Fixed (2026-07-01)

The `seed-phase8-demo-tenant.cjs` script had multiple Prisma field name mismatches vs the actual DB schema:

| Field | Seed Used | Actual Schema |
|---|---|---|
| `Tenant.status` | `'ACTIVE'` (string) | `TenantStatus` enum |
| `Agent.status` | `'ACTIVE'` | `AgentStatus.IDLE` |
| `EntityState.currentState` | `state:` | `currentState:` |
| `EntityHealth.severity` | `status:` | `severity:` |
| `EntityLabel` | `labelName:` / `labelType:` | `kind:` / `key:` / `value:` |
| `WorkspaceLayout` | `widgets:` field | `layout:` field |
| `WorkspaceLayout` unique key | `userId_tenantId_entityType` | `userId_entityType` |

**Fix:** Updated seed script to use correct field names and wrap entity metadata writes in per-field try/catch blocks.

---

### 5. Marketplace Installed Page Empty

**Severity:** High
**Status:** Fixed (2026-07-01)

`src/app/marketplace/installed/page.tsx` used `getTenantId()` which extracted tenant from URL path. On `/marketplace/installed`, the tenant extraction returned `undefined`, disabling the `useInstalledPacks()` query (enabled: !!tenantId).

**Fix:** Replaced URL-based tenant extraction with `useAuthUser()` hook.

---

### 6. Retail Page Auth Context

**Severity:** High
**Status:** Fixed (2026-07-01)

`src/app/retail/page.tsx` passed hardcoded `'default'` as tenantId to all retail hooks. This bypassed auth filtering but could cause incorrect data routing.

**Fix:** Use `useAuthUser().tenantId` for all retail hook calls.

---

### 7. FACILITY Not in EAOS_ENTITY_TYPES

**Severity:** Medium
**Status:** Fixed (2026-07-01)

`src/lib/eaos-entity-types.ts` did not include `'FACILITY'`. The retail page and entity workspace use `FACILITY:retail-store` entity subtype.

**Fix:** Added `'FACILITY'` to the `EAOS_ENTITY_TYPES` constant array.

---

## Historical Issues (Resolved)

### 4. Zombie PM2 Entries

**Status:** Resolved (2026-06-30)

`neurecore-tenant` and `neurecore-admin` zombie PM2 entries were removed during consolidation.

### 5. DNS Cutover Required

**Status:** Resolved (2026-06-30)

`hq.neurecore.com` and `cc.neurecore.com` DNS were pointing to Vercel. DNS cutover completed.

### 6. LiteSpeed Rewrite Catch-All

**Status:** Resolved (2026-06-30)

Admin vhost rewrite rules were missing the `[P,L]` catch-all proxy, causing 404s. Fixed by adding:
```apache
RewriteRule ^(.*)$ http://neurecore_admin/$1 [P,L]
```

---

## Limitations

### No Authorization: Bearer Fallback

The system uses cookie-based auth only. There is no `Authorization: Bearer` token support.

### No Native PostgreSQL

Database is Neon PostgreSQL (cloud). No local Postgres replica.

### pnpm Broken on Contabo

Do not use `pnpm` on Contabo. Use npm or the direct binaries in `node_modules/.bin/`.

---

## Related Documents

- `02-technical-debt.md` — Technical debt
- `../troubleshooting/01-troubleshooting.md` — Troubleshooting
