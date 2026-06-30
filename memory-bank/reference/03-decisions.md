# Reference — Decision Log

**Last Updated:** 2026-06-30
**Last Verified:** 2026-06-30
**Audience:** All engineers

---

## Architectural Decisions

### Cookie-Based Auth Only

**Date:** 2026-06-27
**Decision:** Use httpOnly cookies as sole authentication mechanism
**Rationale:** XSS protection, no localStorage vulnerability
**Alternatives Considered:** Bearer tokens (rejected - XSS vulnerable)

### Single Contabo Deployment

**Date:** 2026-06-30
**Decision:** Consolidate all services on Contabo VPS
**Rationale:** Simplified operations, reduced costs
**Alternatives Considered:** Vercel/Contabo hybrid (rejected - complexity)

### Next.js 16 for EAOS

**Date:** 2026-06-29
**Decision:** Use Next.js 16 for new EAOS frontend
**Rationale:** Turbopack, React 19, latest features
**Alternatives Considered:** Next.js 15 (rejected - older)

### Next.js 15 for Admin

**Date:** 2026-06-29
**Decision:** Use Next.js 15 for Admin frontend
**Rationale:** Stability, compatibility
**Alternatives Considered:** Next.js 16 (rejected - too new)

### LiteSpeed Reverse Proxy

**Date:** Pre-consolidation
**Decision:** Use LiteSpeed as reverse proxy
**Rationale:** Already installed on Contabo, good performance
**Alternatives Considered:** nginx (not installed)

### Neon PostgreSQL

**Date:** Pre-consolidation
**Decision:** Use Neon cloud PostgreSQL
**Rationale:** Serverless, auto-scaling, PITR
**Alternatives Considered:** Local Postgres (rejected - no HA)

### TanStack Query v5

**Date:** 2026-06-27
**Decision:** Use TanStack Query for data fetching in EAOS
**Rationale:** Best DevTools, good infinite query support
**Alternatives Considered:** SWR (rejected - less features)

---

## Key Implementation Decisions

### No Authorization: Bearer

**Date:** 2026-06-27
**Decision:** No Bearer token fallback
**Rationale:** Cookie auth is sole mechanism
**Impact:** Frontend must use cookies exclusively

### CSRF Double-Submit

**Date:** 2026-06-27
**Decision:** Use double-submit cookie pattern
**Rationale:** Standard, works with cookies
**Impact:** All mutations require X-CSRF-Token header

### Tenant Isolation via Prisma

**Date:** Pre-consolidation
**Decision:** All queries include tenantId filter
**Rationale:** Simple, effective isolation
**Impact:** Every query must include tenantId

---

## Related Documents

- `02-technical-debt.md` — Technical debt items
