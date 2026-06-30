# Reference — Known Issues

**Last Updated:** 2026-06-30
**Last Verified:** 2026-06-30
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
