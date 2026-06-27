# NeureCore — EAOS Documentation Index

**Last updated:** 2026-06-27
**Purpose:** Master navigation for all EAOS documentation. Start here.

---

## Overview

This folder contains **7 architectural/contract documents** (define WHAT to build and HOW it should behave) and **6 operational/working documents** (track CURRENT work and DECISIONS). All docs cross-reference each other; none should be read in isolation.

**Folder structure (sorted):**

```
EAOS/
├── 00-index.md                 ← this file
├── 01-active-context.md        ← what's happening now
├── 02-decisions-log.md         ← why we chose what we chose
├── 03-implementation-log.md    ← what was built
├── 04-fixes-tracker.md         ← bugs, security issues, fixes
├── 05-phase-tracker.md         ← per-phase status
├── EAOS-api-contract.md
├── EAOS-frontend-data-layer.md
├── EAOS-implementation-plan.md
├── EAOS-implementation-roadmap.md
├── EAOS-NUWS-principles.md
├── EAOS-pricing-plans.md
└── EAOS-rbac-model.md
```

**Frontend architecture (per D-022 + D-023, 2026-06-27):**

The EAOS workspace is built as a **new frontend** (`frontend-eaos/`). The previous `frontend-tenant/` was **deleted** in full per D-023 (NeureCore has not been released, no production users). The monorepo now has one tenant frontend.

```
neurecore/
├── backend/                    # shared, refactored in place
├── frontend-admin/             # platform console; RBAC updates only
├── frontend-eaos/              # EAOS — the only tenant frontend
└── packages/
    └── ui/                     # shared design system + permission hooks
```

URL: `https://eaos.neurecore.com/{tenantCompanyName}`. No legacy frontend to maintain. No 90-day redirect. No dual-support window for cookies. See [`02-decisions-log.md` D-022 + D-023](./02-decisions-log.md).

---

## Architectural & Contract Documents (read on demand)

| # | Doc | Version | Purpose | When to read |
|---|---|---|---|---|
| 1 | [`EAOS-implementation-plan.md`](./EAOS-implementation-plan.md) | v2.6 | Entity model, 10 capabilities, backend/frontend file structure, Prisma schema, SOLID rules, open questions | When designing modules, DB changes, or capability panel data shapes |
| 2 | [`EAOS-NUWS-principles.md`](./EAOS-NUWS-principles.md) | v1.2 | UI/UX constitution: 10 capability panels, design tokens, accessibility, 6 canonical empty states, compliance checklist | When designing any UI surface, component, or layout |
| 3 | [`EAOS-pricing-plans.md`](./EAOS-pricing-plans.md) | v1.2 | Tier definitions (Community/Starter/Business/Enterprise), AI credits, Solution Pack pricing, AI Roster requirement | When working on billing, tier limits, AI Roster, or Solution Pack install |
| 4 | [`EAOS-api-contract.md`](./EAOS-api-contract.md) | v1.0 | REST + WebSocket + SSE wire format, all EAOS endpoints, envelopes, OpenAPI 3.1 generation, rate limits, idempotency | When building/using any API endpoint, controller, or client |
| 5 | [`EAOS-rbac-model.md`](./EAOS-rbac-model.md) | v1.0 | 4-layer authorization (Role → Resource → Action → Row), 8 roles, all endpoint permissions, audit logging, EntityOwnerGuard, ActionAuthorizationGuard | When adding any endpoint, permission, role, or UI permission gate |
| 6 | [`EAOS-frontend-data-layer.md`](./EAOS-frontend-data-layer.md) | v1.0 | TanStack Query setup, RestClient, SocketManager, SSEClient, httpOnly cookies, `<Can>` permission hook, feature flag system | When building any frontend feature, hook, form, or service |
| 7 | [`EAOS-implementation-roadmap.md`](./EAOS-implementation-roadmap.md) | v1.0 | 11-phase implementation plan with sequencing, risk, exit criteria, rollback plans | When planning work, deciding what to ship next, or estimating effort |

---

## Operational Documents (updated regularly)

| # | Doc | Purpose | Update cadence |
|---|---|---|---|
| 1 | [`01-active-context.md`](./01-active-context.md) | What's being worked on RIGHT NOW, recent changes, open threads, blockers | Daily during active work |
| 2 | [`02-decisions-log.md`](./02-decisions-log.md) | Chronological log of all architectural/product decisions with rationale and trade-offs | When a decision is made |
| 3 | [`03-implementation-log.md`](./03-implementation-log.md) | Chronological log of code changes, file:line references, PRs, and shipped features | When a PR is merged |
| 4 | [`04-fixes-tracker.md`](./04-fixes-tracker.md) | Bugs, security issues, and their fixes (especially the audit findings) with severity and status | When a bug is found or fixed |
| 5 | [`05-phase-tracker.md`](./05-phase-tracker.md) | Per-phase status (planned/in-progress/blocked/done) with checklists mirroring the roadmap | When phase status changes or tasks complete |

---

## Document Relationships

```
ARCHITECTURAL DOCS (define WHAT and HOW)
├── EAOS-implementation-plan.md  ← entity model, file structure, Prisma
├── EAOS-NUWS-principles.md     ← UI/UX behavior contract
├── EAOS-pricing-plans.md       ← tier system
├── EAOS-api-contract.md        ← HTTP/WS/SSE wire format
├── EAOS-rbac-model.md          ← authorization model
├── EAOS-frontend-data-layer.md ← frontend data fetching
└── EAOS-implementation-roadmap.md ← sequencing & phases

OPERATIONAL DOCS (track CURRENT work)
├── 00-index.md                 ← this file
├── 01-active-context.md        ← what's happening now
├── 02-decisions-log.md         ← why we chose what we chose
├── 03-implementation-log.md    ← what was built
├── 04-fixes-tracker.md         ← bugs and fixes
└── 05-phase-tracker.md         ← per-phase status
```

**Reading direction:**
- Architectural docs are **read-only**; they change rarely (versioned, changelog at top).
- Operational docs are **read-and-write**; they update frequently.

---

## Reading order for a new team member

1. `00-index.md` ← this file
2. `EAOS-implementation-plan.md` §0–§1 (entity model philosophy, 10 capabilities)
3. `EAOS-NUWS-principles.md` §1–§2 (workspace contract)
4. `EAOS-implementation-roadmap.md` §2 (phase overview)
5. `01-active-context.md` (what's happening now)
6. `05-phase-tracker.md` (where we are in the plan)
7. As needed: `EAOS-api-contract.md`, `EAOS-rbac-model.md`, `EAOS-frontend-data-layer.md`

---

## Conventions

- **Numbering:** architectural docs use `EAOS-{name}.md`; operational docs use `NN-{name}.md` (00- through 05-) so they sort together at the top of the folder.
- **Versions:** every architectural doc has a `Document Version` field in its header. Operational docs have a `Last updated` date.
- **Cross-references:** use relative links (`./EAOS-impl-plan.md`) within the EAOS folder. Use absolute paths (`/home/najeeb/Linux-Dev/...`) for code references.
- **Changelogs:** architectural docs include a "Changelog" section at the top (v1.0 → v1.1, etc.) for version history. Operational docs rely on "Last updated" + chronological entries.
- **No emojis** in operational doc bodies (architectural docs use them in mockups to indicate UI elements; operational docs are working notes).

---

## Cross-references to memory-bank/ root

The `memory-bank/` root has parallel tracking for the wider NeureCore project:

- `activeContext.md` — project-wide active context (vs. `01-active-context.md` which is EAOS-scoped)
- `progress.md` — feature/phase progress for non-EAOS work
- `phase{1-12}-implementation-summary.md` — historical phase summaries
- `p0-a/b/c/d-*.md` — design review records
- `systemPatterns.md`, `techContext.md`, `productContext.md`, `projectBrief.md` — project-wide contexts (Cline memory bank convention)

EAOS operational docs are **scoped to EAOS work only**. Project-wide changes (e.g., Contabo deploys, Vercel frontends) continue to be tracked in memory-bank/ root.

---

**End of index.**
