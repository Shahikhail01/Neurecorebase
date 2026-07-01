# Reference — Known Issues

**Last Updated:** 2026-06-30
**Last Verified:** 2026-06-30
**Audience:** All engineers

---

## Known Issues

### 1. Entity Workspace - Database Column Case Mismatch (CRITICAL)

**Severity:** Critical
**Status:** PARTIALLY FIXED - Work in Progress

**Root Cause:** PostgreSQL normalizes all identifiers to lowercase. The database has columns like `tenantid`, `entitytype`, `entityid` (lowercase), but the Prisma schema defines them as `tenantId`, `entityType`, `entityId` (camelCase). Without `@map()` annotations, Prisma generates SQL with camelCase column names, causing "column does not exist" errors.

**Affected Tables:**
- `entity_states` (tenantid, entitytype, entityid, currentstate, etc.)
- `entity_labels` (tenantid, entitytype, entityid, etc.)
- `entity_healths` (tenantid, entitytype, entityid, etc.)
- `entity_ownerships` (tenantid, entitytype, entityid, etc.)
- `entity_watchers` (tenantid, entitytype, entityid, etc.)
- `entity_relationships` (tenantid, fromtype, fromid, totype, toid, etc.)
- `user_favorites` (tenantid, userid, entitytype, entityid, etc.)
- `user_recent_accesses` (tenantid, userid, entitytype, entityid, etc.)
- `state_history` (tenantid, entitytype, entityid, fromstate, tostate, etc.)

**What Was Fixed:**
- Added `@map()` annotations to all entity models in `schema.prisma` to map camelCase fields to snake_case columns
- Added `type.toUpperCase()` for entity type params in `entities.controller.ts` to handle lowercase URL params

**What's Still Broken:**
- The `/workspace/summary` endpoint fails with `Cannot read properties of undefined (reading 'toUpperCase')` - indicates a routing issue with composite endpoints
- `/health` and other panel endpoints return 404 - routes may not be implemented or routing is broken
- `workspaceSummary` method is missing proper type parameter handling

**Database State:**
```sql
-- Working tables (have proper columns):
departments: id, name, tenantId (camelCase - WORKS)
entity_labels: tenantid (lowercase - NEEDS @map)

-- Entity tables (have snake_case columns):
entity_labels: tenantid, entitytype, entityid, kind, key, value, color, createdbyid, createdat
entity_states: tenantid, entitytype, entityid, currentstate, substate, enteredat, enteredbyid, metadata
entity_healths: tenantid, entitytype, entityid, severity, trend, score, openalerts, signals, updatedat
```

**Fix Applied to Schema:**
```prisma
model EntityLabel {
  id          String     @id @default(uuid())
  tenantId    String    @map("tenantid")  -- Added
  tenant      Tenant     @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  entityType  EntityType @map("entitytype")  -- Added
  entityId    String    @map("entityid")  -- Added
  kind        LabelKind  @default(CUSTOM)
  key         String    @map("key")
  value       String    @map("value")
  color       String?   @map("color")
  createdById String?   @map("createdbyid")
  createdBy   User?      @relation(...)
  createdAt   DateTime  @default(now()) @map("createdat")
  // ... rest
}
```

**Fix Applied to Controller:**
```typescript
// Before (broken with lowercase URL params like /entities/department/...):
this.identity.get((params.type as EaosEntityType), params.id, tenantId, user.sub);

// After (uppercase the type for database enum):
this.identity.get(params.type.toUpperCase() as EaosEntityType, params.id, tenantId, user.sub);
```

**Pending Issues:**
1. `workspaceSummary` route handler - type parameter undefined at line 132
2. Entity type case inconsistency - URL uses lowercase (`department`) but database stores uppercase (`DEPARTMENT`)
3. Need to verify all 10 panel endpoints work after full fix

**Test Command:**
```bash
# Login first
curl -s -c /tmp/cookies.txt -X POST http://127.0.0.1:3003/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"retail@neurecore.ai","password":"Retail@123!"}'

# Test identity (WORKS with uppercase):
curl -s -b /tmp/cookies.txt "http://127.0.0.1:3003/api/v1/entities/DEPARTMENT/f65bc966-20bb-4b65-a1f5-475d781252fc/identity"

# Test identity with lowercase (NOW WORKS after fix):
curl -s -b /tmp/cookies.txt "http://127.0.0.1:3003/api/v1/entities/department/f65bc966-20bb-4b65-a1f5-475d781252fc/identity"
```

**Related Files:**
- `backend/prisma/schema.prisma` - Entity models with @map annotations
- `backend/src/modules/entities/entities.controller.ts` - Type uppercase fixes
- `backend/src/modules/entities/services/identity.capability.ts` - Entity queries
- `backend/src/modules/entities/services/entity-resolver.service.ts` - Entity resolution

---

### 2. CSRF Exemptions Incomplete

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
