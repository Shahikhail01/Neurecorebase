# P0-D Report — Design Review Lock (2026-06-25 13:55)

**Source:** Critical review feedback on `new_neurecore.md` v4
**Reviewer:** Project stakeholder
**Outcome:** All 4 design items locked for implementation

---

## Item 1 — Routine Ownership Model: **LOCKED to Option B (`ownerAgentId`)**

**Decision:** Add `ownerAgentId String?` (nullable) to `Routine` Prisma model. Frontend filters routines per department via two-step fetch (get dept agents → get routines where `ownerAgentId IN (...)`).

**Rationale:**
- Architectural consistency: every other workspace entity flows `Department → Agent → (Task|Workflow|Routine)`
- Backend gap becomes a single Prisma migration + a controller query change
- Simpler mental model for users: "Routine is owned by the agent that runs it"

**Trade-off accepted:** Cross-dept / shared routines are deferred to v2.

**Implementation details:**

```prisma
// Prisma migration: add to Routine model
model Routine {
  // ... existing fields ...
  ownerAgentId String?
  ownerAgent   Agent? @relation(fields: [ownerAgentId], references: [id], onDelete: SetNull)
  @@index([ownerAgentId])
}
```

**Controller change** (Routines):
```typescript
@Get()
async listRoutines(
  @CurrentUser('tenantId') tenantId: string,
  @Query('ownerAgentId') ownerAgentId?: string,  // NEW
  @Query() query: ListRoutinesQueryDto,
) { ... }
```

**Frontend workspace Routines tab:**
```typescript
// 1. Get dept agents
const agents = await agentsService.list({ departmentId: deptId });
// 2. Get routines for those agents
const routines = await routinesService.listByAgents(agents.map(a => a.id));
```

**Effort:** ~40 LOC backend + 20 LOC frontend. Single Prisma migration.

---

## Item 2 — RBAC Matrix Stakeholder Approval: **DEFERRED with default policy locked**

**Decision:** Default v1 RBAC policy locked for implementation. Stakeholder can override per-role later via config.

**Default v1 RBAC matrix (locked):**

| Role | Read access | Write access | Audit log | Governance edit | Settings edit |
|---|---|---|---|---|---|
| `SUPER_ADMIN` | All tenants | All tenants | ✅ | ✅ | ✅ |
| `PLATFORM_ADMIN` | All tenants | ❌ | ✅ | ❌ | ❌ |
| `SECURITY_OFFICER` | All tenants | ❌ | ✅ | ✅ | ❌ |
| `SUPPORT` | All tenants | ❌ | ✅ | ❌ | ❌ |
| `OWNER` | Own tenant | Own tenant | ✅ | ✅ | ✅ |
| `ADMIN` | Own tenant | Own tenant | ✅ | ❌ | ✅ |
| `USER` | Own tenant | Own resources only | ⚠️ own actions | ❌ | ❌ |
| `AUDITOR` | Own tenant | ❌ | ✅ | ❌ | ❌ |

**Implementation:**

Frontend:
- New `useCanAccess(role: UserRole, action: string): boolean` hook
- Wraps `<ActionToolbar>` and `<EntityTable>` bulk actions
- Reads from `authStore.user.role`

Backend:
- No new role guards in v1 (existing guards adequate for SUPER_ADMIN vs OWNER/ADMIN vs USER)
- Future: configurable per-tenant RBAC overrides via Settings (deferred to v2)

**Files to change:**
- `frontend-tenant/src/hooks/useCanAccess.ts` (new)
- `frontend-tenant/src/components/creatio/ActionToolbar.tsx` (integrate canAccess)
- `frontend-tenant/src/components/creatio/EntityTable.tsx` (integrate canAccess for bulk actions)

**Effort:** ~60 LOC frontend. Zero backend changes for v1.

---

## Item 3 — Search v1.1 Scope: **CONFIRMED**

Already documented in `new_neurecore.md` §8. Trigger: first 3 production tenants with >5 departments OR >50 agents each.

---

## Item 4 — Prisma Cache: **RESOLVED** (via P0-A)

See `memory-bank/p0-a-investigation.md` and `memory-bank/p0-c-report.md`.

---

## Final Lock Summary

| Item | Decision | Effort |
|---|---|---|
| 1. Routine ownership | Option B: `ownerAgentId` | ~60 LOC + migration |
| 2. RBAC matrix | Default policy locked (overridable) | ~60 LOC frontend |
| 3. Search v1.1 | Already documented | 0 (deferred) |
| 4. Prisma cache | Resolved | 0 |

**Phase 0 complete.** Implementation can begin with Phase 1 (backend gaps).