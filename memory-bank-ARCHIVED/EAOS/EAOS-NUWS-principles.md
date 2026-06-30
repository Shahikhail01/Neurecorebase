# NeureCore Universal Workspace Specification (NUWS)

**Document Version:** 1.4
**Date:** 2026-06-27
**Status:** NUWS Core Specification — THE CONSTITUTION
**Audience:** Engineering, Design, Product
**Supersedes:** v1.3 (D-023: `frontend-tenant/` deleted in full per no production users / no release. The "frozen" status and 90-day redirect from v1.3 are no longer needed. Single tenant frontend: `frontend-eaos/`. All references that previously said "frozen" or "90-day" are obsolete; this v1.4 makes that explicit.)

---

## 0a. Changelog (v1.0 → v1.1)

| Section | Change | Rationale |
|---|---|---|
| §2 (capabilities) | Lifecycle promoted from "buried in Administration" (impl plan v2.4) to **first-class CORE panel #10**. Administration demoted to a **modal** opened via gear icon (already implied by v1.0 §7.1). Total workspace panels = **10** (not 9 or 11). | Resolves contradiction with `EAOS-implementation-plan.md` §1.2. State machine is too important to hide. |
| §2.1 Identity | Add **Health Signals sub-panel** (expandable from the health dot). Status + Health + Avatar consolidated into one pill. | A "Healthy" badge without underlying signals is decorative. |
| §2.3 Intelligence | Add **streaming-by-default**, **inline citation chips**, **confidence thermometer**, **sticky "Do First" CTA**. | NUWS already required these (§3.3, §6.2); this version is explicit. |
| §2.4 Operations | Default view = **Kanban**, not Table. Per-task **AI Delegation button** on every row. | Matches "Action First" + "AI is Native" principles. |
| §2.5 Resources | Human team and AI team rendered with **identical avatar card component**; only icon differs (👤 vs 🤖). | Reinforces that AI Employees are first-class team members. |
| §2.6 Collaboration | **Persistent AI chat input** docked at the bottom of every workspace. | AI chat is primary navigation surface; must always be one keystroke away. |
| §2.7 Insights | **Click-to-expand KPIs** (no modal). Per-KPI **"Explain this"** inline AI action. | Avoids context-switching. |
| §2.8 Automation | Workflows show a **thumbnail preview** (not a link). | Visual-first matching "Intelligence First" principle. |
| §2.9 Activity | **Filter chips** at top: All / Human / AI / Workflow / State Changes. AI-interpreted events get a 🤖 badge. | Makes audit log scannable. |
| §2.10 Lifecycle (NEW) | Current state as large badge + transition buttons + history timeline + AI "why is this Draft?" prompt. | New first-class capability. |
| §3.1 | **6 named empty states** defined: First Run, No Data, No Permission, No Results, Integration Disconnected, AI Generated Nothing. Each with action prompt. | Empty states were required but not enumerated. |
| §3.4 (NEW) | **Activity vs Collaboration split rule** codified: Activity = read-only timeline (audit-grade); Collaboration = write surface (chat, comments, approvals, mentions). | Avoids the overlap flagged in review. |
| §5.1 | Workspace Shell rewritten as **two-tier tab system** (top 4 primary + bottom rail of remaining 6) with collapsible Intelligence hero band and persistent left icon rail. | Respects "5–7 actions visible" cognitive load limit. |
| §5.3 Mobile | Intelligence panel **collapsed by default**, shows 1-line summary. | Concrete rule (was vague). |
| §5.4 (NEW) | **Mission Feed** — dashboard-only persistent banner surfacing top 3 items needing attention. | "Work finds the user" was a principle without a UI. |
| §5.5 (NEW) | **Command Palette (⌘K)** — two modes: navigate (default) and ask-AI (prefix `?`). | Power-user navigation + ambient AI. |
| §5.6 (NEW) | **Cross-Entity Mini-Graph** — slide-over showing 1-hop relationships, click to navigate. | The data model supports it; UI didn't expose it. |
| §5.7 (NEW) | **Multi-Entity Compare View** at `/compare?ids=a,b,c`. | Power-user feature for executives. |
| §7.2 | Visual encoding unchanged. | — |
| §7.5 (NEW) | **Design Tokens**: typography (Inter + JetBrains Mono), neutral chrome, dark-mode-first requirement, density toggle (Compact/Default/Comfortable). | Spec gave state colors but no design system. |
| §8.1 | Compliance checklist expanded with new items (citation chips, AI delegation, empty state library, ⌘K, dark mode, design tokens). | — |
| Appendix B | Glossary: add **Ask AI**, **Mission Feed**, **Mini-Graph**, **Compare View**, **Health Signals**, **Empty State**, **Design Token**, **Panel** vs **Modal**. | — |
| Appendix C | Document relationships updated (impl plan and NUWS now aligned). | — |

### 0b. Changelog (v1.1 → v1.2)

| Section | Change | Rationale |
|---|---|---|
| §7.5 | **Locked implementation choices:** Tremor (charts), Lucide (icons), next-themes (theme), density = global + Operations override. | Locks the implementation stack so all future work references the same libraries. |
| Appendix D | Added visual reference values (shell dimensions, z-index scale, spacing scale, border radius). | Binding values for all component implementations. |

### 0c. Changelog (v1.2 → v1.3 — D-022)

| Section | Change | Rationale |
|---|---|---|
| Header | Bumped to v1.3; added supersession note about D-022. | The behavioral contract is unchanged; only the target app is now `frontend-eaos/` instead of `frontend-tenant/`. |
| Appendix D | File structure references redirect to `frontend-eaos/`; the `packages/ui/` shared package is the new canonical source for design tokens, components, and permission hooks. | Per D-022. |
| Glossary (Appendix B) | Add **frontend-eaos**, **frontend-tenant** (frozen), **packages/ui**. | Document the new architecture. |

### 0d. Changelog (v1.3 → v1.4 — D-023)

| Section | Change | Rationale |
|---|---|---|
| Header | Bumped to v1.4; the "frozen" status and 90-day redirect are obsolete. | `frontend-tenant/` was deleted in full per D-023. |
| Appendix D | "Target app" note simplified — single tenant frontend, no legacy. | No dual support. |
| Glossary (Appendix B) | **Remove `frontend-tenant` (frozen) entry.** It no longer exists. Keep `frontend-eaos` and `packages/ui`. | The "frozen" concept is gone. |

---

## 0. Document Purpose

This document defines the **behavioral contract** for every entity in NeureCore. It is the constitution from which all UI specifications derive.

**The critical distinction:**

```
Traditional UI docs:     "Here's what this page looks like."
NUWS:                   "Here's what every entity must behave like."
```

A page template defines appearance. A behavioral contract defines essence. Appearance can change; essence must not.

**What this document is:**
- The authoritative contract every entity workspace must satisfy
- The foundation for all widget, panel, and component specifications
- The reference document for UX decisions when new entity types are added

**What this document is NOT:**
- A page mockup or wireframe
- A component library specification
- A design system (colors, typography, spacing)

After this document is approved, all subsequent UI work — Workspace Templates, Explorer, Analytics, AI Employee, Manufacturing, Retail, Healthcare, or any future entity — references this contract rather than inventing new patterns.

---

## Part I — Philosophy

### 1. Definition

**The NeureCore Universal Workspace (NUWS)** is the standard interaction environment for every entity within the Enterprise AI Operating System.

**The core proposition:**

> Every entity in NeureCore — whether a Department, AI Employee, Project, Manufacturing Plant, Retail Store, Farm, Customer, Warehouse, Hospital, or any future entity — operates within the same behavioral contract. The content changes. The interaction language does not.

**What NUWS is NOT:**
- A page template (which is a visual prescription)
- A layout grid (which is a spatial prescription)
- A component library (which is an implementation prescription)

NUWS is a **behavioral contract**. It defines what must happen, not how it looks.

### 2. Core Principles

#### 2.1 Entity First

Everything in NeureCore is an Entity.

The workspace never changes because of the entity type. Only the data changes.

```
Entity Examples (current):
├── DEPARTMENT (Sales, Marketing, HR, Finance, Operations, etc.)
├── AI_EMPLOYEE (Marketing Director AI, Sales Agent, etc.)
├── PROJECT (Q3 Campaign, Product Launch, etc.)
├── CUSTOMER (Acme Corp, etc.)
├── FACILITY (Plant Detroit, Store NYC, Hospital General, Farm Texas, etc.)
├── ASSET (Server Rack A, Forklift #12, etc.)
├── KNOWLEDGE (Policy #12, SOP: Onboarding, etc.)
├── WORKFLOW (Order Fulfillment, Employee Onboarding, etc.)
└── [Any future entity type]

Future entities (Retail, Manufacturing, Healthcare, etc.) MUST satisfy this contract:
├── Every new entity type gets a workspace
├── The workspace follows the same 9-capability structure
├── Only the data and initial widgets differ
└── No new interaction patterns are invented
```

#### 2.2 Intelligence First

The first thing users see is not raw data. It is **understood** data.

```
Traditional CRM:
  Customers → List → Filter → Open Record → Interpret

NUWS Workspace:
  Customer → AI Summary → Risks → Recommendations → [Drill into data if needed]
```

AI-generated intelligence precedes raw data in every workspace. This is non-negotiable.

**Every workspace opens with:**
- AI Summary (what is the current state?)
- Entity Health (is everything healthy?)
- Risks (what requires attention?)
- Opportunities (what could be improved?)
- Recommendations (what should I do next?)

#### 2.3 Action First

Every workspace answers three questions before any user action:

```
1. What requires my attention?
2. What should I do next?
3. What can AI do for me right now?
```

Users should never need to search for work. Work should find the user.

#### 2.4 Context Everywhere

Every entity explains its place in the organization.

```
AI Employee: Marketing Director AI
├── Reports to: Chief Marketing Officer (AI)
├── Manages: [Campaign AI, Content AI, SEO AI, Analytics AI]
├── Works in: Marketing Department
├── Collaborates with: Sales AI, Product AI, Finance AI
├── Responsible for: 12 active campaigns
├── Created by: Platform Administrator
└── Active since: 2026-01-15

The AI Employee does not exist in isolation.
Its workspace shows its full context.
```

Context chains are navigable. Clicking any related entity navigates to its workspace.

#### 2.5 Progressive Disclosure

```
Simple first. Advanced when needed. Never overwhelm.

Layer 1 — At a glance (no scroll):
  AI Summary + Health + Primary Actions

Layer 2 — Immediate context (1 scroll):
  Active operations + Key resources + Quick insights

Layer 3 — Full detail (explicit request):
  Complete data, history, analytics, configuration

Layer 4 — Expert controls (explicit request):
  Advanced settings, API, integrations, debugging
```

Users who want depth find it. Users who want speed get it immediately.

#### 2.6 AI is Native

AI is never a separate module or a special mode.

```
AI is not:   "Click here to use AI"
AI is:        AI is present in every section, every list, every form

Every list has:         AI-assisted search
Every form has:         AI-assisted input
Every report has:       AI-generated narrative
Every KPI card has:     AI-generated explanation
Every table has:        AI column recommendations
Every timeline has:     AI event summarization
Every dashboard has:    AI anomaly alerts
```

AI capabilities are woven into the fabric of every interaction.

#### 2.7 Workspace Over Application

Users do not open modules. They enter workspaces.

```
Traditional ERP:          Open Sales Module → Find Customer → Open Customer Record → View Opportunities
NeureCore:               Enter Customer Workspace → See everything about customer in context

Users think in entities, not modules.
The workspace is the entity.
```

---

## Part II — Universal Workspace Contract

Every workspace MUST expose these **10 capabilities as panels**. This is the contract.

### The 10 Capability Panels

| # | Capability | What It Defines |
|---|---|---|
| 1 | **Identity** | Who or what this entity is |
| 2 | **Context** | How this entity relates to everything else |
| 3 | **Intelligence** | AI-generated understanding of this entity |
| 4 | **Operations** | Current work associated with this entity |
| 5 | **Resources** | People, AI, documents, assets, budget assigned |
| 6 | **Collaboration** | How work is coordinated (write surface) |
| 7 | **Insights** | KPIs, trends, reports, forecasts |
| 8 | **Automation** | Workflows, triggers, integrations |
| 9 | **Activity** | Complete history and audit trail (read surface) |
| 10 | **Lifecycle** | State machine, transitions, history, automated transitions |

**Administration is NOT a panel.** It is opened via the gear icon in the workspace header as a **modal** containing permissions, settings, API keys, billing, and audit configuration. This reconciles with `EAOS-implementation-plan.md` §1.2 (which listed Administration as a CORE capability) by treating it as CORE-but-modal rather than CORE-as-panel.

**Activity vs Collaboration split rule (§3.4):**
- **Activity** = read-only, chronological, audit-grade timeline. Always sorted newest first.
- **Collaboration** = write surface: chat, comments, approvals, mentions, scheduling.

The split is non-negotiable. Audit-grade history must not be polluted with chat messages.

### 2.1 Identity Capability

**Purpose:** Defines who or what this entity is.

**Must include:**
```
Identity
├── name              — Primary identifier
├── type             — Entity type (DEPARTMENT, AI_EMPLOYEE, FACILITY, etc.)
├── subtype          — Further classification (manufacturing-plant, retail-store, etc.)
├── icon             — Visual identifier
├── avatar           — Image where applicable (AI employees, facilities, customers)
├── description      — Human-readable description
├── status           — Universal state (DRAFT, ACTIVE, PAUSED, SUSPENDED, ARCHIVED)
├── subState         — Entity-specific state (idle, on_track, operational, etc.)
├── health           — Computed health (healthy, warning, critical, unknown)
├── owner            — Primary accountable person or AI
├── responsibleTeam  — Team accountable
├── tags             — Labels (strategic, vip, p1_high, Q3, 2026, etc.)
├── createdBy         — Who created this entity
├── createdAt         — When created
├── lastModifiedBy   — Who last modified
├── lastModifiedAt   — When last modified
└── version          — For entities with versioning
```

**Identity Panel UI:**
```
┌─────────────────────────────────────────────────────────┐
│ IDENTITY                                       [⚙ Admin] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ [Avatar]  Marketing Department                          │
│           ┌──────────────────────────────────────────┐  │
│           │ ● ACTIVE  ● HEALTHY   ● Lifecycle: v3    │  │
│           └──────────────────────────────────────────┘  │
│                                                         │
│ Owner: Sarah Chen (CMO)                                 │
│ Team: Executive                                         │
│                                                         │
│ Tags: ● Strategic  ● Q3  ● 2026  ● VIP                 │
│                                                         │
│ Created: 2024-01-15  |  Modified: Today                │
│                                                         │
│ ▸ Health Signals (3)                          [↻]       │
│   error_rate        0.4%   ● normal                    │
│   budget_usage     62%     ● normal                    │
│   goal_progress    78%     ● warning  ↑                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Identity UX rules (v1.1):**
- **Avatar + Status + Health must be one horizontal pill** (`[👤 Sarah ●ACTIVE ●HEALTHY]`). Never split across rows.
- **Lifecycle indicator** is a small dot inside the pill; the *full* state machine lives in the Lifecycle panel (§2.10).
- **Tags rendered as colored chips**, not text. Clicking a chip filters the entire workspace by that label.
- **Health Signals is a collapsible sub-section within Identity** (default collapsed). When health is `warning` or `critical`, expand automatically. Clicking a signal deep-links to its source widget in the Insights panel.

### 2.2 Context Capability

**Purpose:** Explains how this entity relates to everything else.

**Must include:**
```
Context
├── parent             — Parent entity in hierarchy (if any)
├── children          — Direct child entities
├── ancestors         — Full hierarchy path to root
├── siblings           — Entities at same hierarchy level
├── organizationPath   — Breadcrumb: Enterprise → Division → Department → Team
├── location          — Physical: address, coordinates, timezone
├── relationships     — Typed connections to other entities
│   ├── type         — "operates-in", "manages", "supplies-to", "collaborates-with"
│   ├── target       — The related entity
│   └── metadata      — Relationship-specific data
├── dependencies      — Entities this depends on
├── dependents       — Entities that depend on this
└── geographicScope   — Region, country, global
```

**Context Panel UI:**
```
┌─────────────────────────────────────────────┐
│ CONTEXT                                    │
│                                             │
│ Enterprise: Acme Corporation                │
│   └── Executive                            │
│       └── Marketing (this)                  │
│                                             │
│ Children:                                   │
│   ├── Campaign Team                        │
│   ├── Content Team                         │
│   └── Analytics Team                        │
│                                             │
│ Relationships:                              │
│   ├── operates-in → Sales Department       │
│   ├── collaborates-with → Product AI        │
│   └── supports → Customer Success           │
│                                             │
│ Location: Austin, TX  |  UTC-5            │
└─────────────────────────────────────────────┘
```

### 2.3 Intelligence Capability

**Purpose:** AI-generated understanding of the current state, risks, and recommendations.

**This is the most important capability. It appears first in every workspace.**

**Must include:**
```
Intelligence
├── summary            — AI-generated briefing of current state
├── health             — Computed health status with signals
├── risks              — Identified risks with severity and probability
├── opportunities      — Identified opportunities with potential impact
├── recommendations   — Ranked action items with rationale
├── forecasts          — Predicted future states with confidence
├── confidence         — AI confidence in summary (0-100%)
├── sources           — What data the AI used
├── lastGenerated      — When this intelligence was computed
└── refreshAction      — How to regenerate
```

**Intelligence Panel UI (always at top of workspace):**
```
┌─────────────────────────────────────────────────────────────────┐
│ 🤖 Intelligence                                      [↻] [⤢]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  SUMMARY                                                        │
│  Pipeline at $4.2M¹ — on track for Q3 target of $5M.         │
│  3 deals at risk of slipping. Marketing AI deployed           │
│  12 campaigns with 84% avg engagement rate.²                  │
│                                                                 │
│  Confidence:  ████████████░░  94%   [Why?]   Model: gpt-x      │
│                                                                 │
│  ⚠ RISKS (3)            💡 OPPORTUNITIES (2)                 │
│  ├── Deal #1234 may    │  ├── Upsell $200K to                │
│  │   miss close date   │  │   Acme (high confidence)         │
│  ├── Content team at   │  └── Launch LinkedIn campaign       │
│  │   95% capacity      │      for $45K (medium conf)         │
│  └── Q3 budget at 92%  │                                     │
│                                                                 │
│  📋 RECOMMENDATIONS                                            │
│  1. 🔴 Review Deal #1234 with Sales AI    (AI: 96% conf)     │
│  2. 🟡 Redistribute content tasks         (AI: 87% conf)     │
│  3. 🟢 Pre-approve Q4 budget adjustment   (AI: 78% conf)     │
│                                                                 │
│  [Delegate to AI]  [View Full Analysis]                       │
│                                                                 │
│ ┌───────────────────────────────────────────────────────────┐ │
│ │ 🔴 DO FIRST: Review Deal #1234 with Sales AI    [Start]    │ │
│ └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘

¹ Q3 Sales Forecast — see Knowledge: "Q3 Sales Methodology"
² Campaign Performance Dashboard, last refreshed 5m ago
```

**Intelligence UX rules (v1.1):**
- **Streaming by default** — tokens appear live with a "Stop" button. Never block the workspace on AI completion.
- **Inline citations** as superscript chips. Click a chip to open the source knowledge entry in a slide-over.
- **Confidence is a color-coded thermometer bar**, not a raw percentage. "Why?" tooltip lists contributing signals (data freshness, model version, sample size).
- **"Do First" recommendation is a persistent sticky CTA** at the bottom of the panel. Always visible without scrolling on desktop.
- **Refresh button (↻)** regenerates the entire summary. Show last-generated timestamp below the confidence bar.
- **Regenerate + Feedback** (👍 / 👎) are required on every AI output per §3.3.

### 2.4 Operations Capability

**Purpose:** Current work associated with this entity.

**Must include:**
```
Operations
├── tasks             — Work items assigned or relevant
├── projects          — Active projects
├── workflows         — Running or scheduled workflows
├── goals             — Objectives and key results
├── cases             — Support cases, service requests
├── orders            — Orders, shipments, fulfillment
├── activities        — Meetings, calls, events scheduled
├── workload          — Aggregate capacity vs demand
└── calendar          — Upcoming scheduled items
```

**Operations Panel UI:**
```
┌─────────────────────────────────────────────────────────┐
│ OPERATIONS                            [Kanban|List|Gantt] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [12 Tasks] [3 Projects] [2 Workflows running]          │
│                                                         │
│  ┌─────────┬─────────┬─────────┬─────────┐            │
│  │ TO DO 4 │ DOING 5 │ BLOCK 1│ DONE 47 │            │
│  ├─────────┼─────────┼─────────┼─────────┤            │
│  │ Q3 brief│ Review  │ Vendor  │ Brief v1│            │
│  │ →Assign │ pipeline│ contract│ ✓ Done  │            │
│  │         │ →AI     │         │         │            │
│  │ Launch  │ Plan Q4 │         │ Pitch   │            │
│  │ email   │ budget  │         │ deck ✓  │            │
│  └─────────┴─────────┴─────────┴─────────┘            │
│                                                         │
│  Assigned to You: 5    |   AI can auto-complete: 8     │
│  [+ New Task]  [Delegate to AI]                         │
└─────────────────────────────────────────────────────────┘
```

**Operations UX rules (v1.1):**
- **Default view is Kanban**, not Table. Calendar and Gantt are secondary toggles. This matches the "Action First" principle — tasks are visible work, not data.
- **Per-task AI Delegation button** (`→AI`) on every row. One click to assign to an AI Employee. This is the "AI is Native" principle made literal.
- **"AI can auto-complete: N"** is an explicit affordance — never hidden behind a settings page.
- **Swimlanes by owner** (Human vs AI vs Unassigned) are the secondary grouping, not the default.

### 2.5 Resources Capability

**Purpose:** People, AI, documents, assets, and budget assigned to this entity.

**Must include:**
```
Resources
├── humanTeam          — Assigned human members
├── aiTeam             — Assigned AI employees
├── documents           — Files, attachments, records
├── knowledge          — Linked knowledge entries (policies, SOPs, playbooks)
├── assets             — Equipment, inventory, real assets
├── budget             — Financial resources (allocated, spent, remaining)
├── allocatedCapacity  — Human hours, AI tokens, storage quota
└── integrations       — Connected external systems
```

**Resources Panel UI:**
```
┌─────────────────────────────────────────────────────────┐
│ RESOURCES                                       [+ Add] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  HUMAN TEAM (8)            AI TEAM (5)                 │
│  ┌───────────────┐        ┌───────────────────┐       │
│  │ 👤 Sarah C.   │        │ 🤖 Marketing Dir  │       │
│  │  CMO           │        │  Director         │       │
│  │  ● Online      │        │  ● busy  →        │       │
│  ├───────────────┤        ├───────────────────┤       │
│  │ 👤 John M.    │        │ 🤖 Campaign AI    │       │
│  │  Analyst       │        │  Specialist       │       │
│  │  ● Away        │        │  ● idle           │       │
│  └───────────────┘        └───────────────────┘       │
│                                                         │
│  BUDGET                     DOCUMENTS (24)             │
│  ┌────────────────┐         ┌───────────────────┐      │
│  │ Allocated: $500K│         │ 📄 Q3 Brief       │      │
│  │ Spent: $312K    │         │ 📄 Brand Guide    │      │
│  │ Remaining: $188K│         │ 📄 Campaign Plan  │      │
│  │ ████████░░ 62% │         │ +21 more          │      │
│  └────────────────┘         └───────────────────┘      │
└─────────────────────────────────────────────────────────┘
```

**Resources UX rules (v1.1):**
- **Human team and AI team MUST be rendered with the identical avatar card component**. Only the leading icon (👤 vs 🤖) and the presence/status indicator differ. This reinforces that AI Employees are first-class team members, not "tools."
- **AI Employee cards show sub-state** (`busy`, `idle`, `error`, `training`, `offline`) — same as human presence indicators. Sub-state is clickable to open the AI Employee's own workspace.
- **Budget** uses a percentage bar with `Allocated / Spent / Remaining` semantics. Hover reveals period (e.g., "Q3 2026").
- **Documents section** shows last-modified preview and `+N more` for overflow. Search within section is mandatory per §3.2.

### 2.6 Collaboration Capability

**Purpose:** How work is coordinated among team members and AI.

**Must include:**
```
Collaboration
├── conversations     — AI-assisted chat threads
├── comments           — Discussion threads on entities
├── meetings           — Scheduled and past meetings
├── approvals          — Pending and completed approvals
├── mentions           — @mentions of this entity
├── notifications      — Alerts for this entity
└── sharing            — Who has access, sharing settings
```

**Collaboration Panel UI:**
```
┌─────────────────────────────────────────────────────────┐
│ COLLABORATION                       [+ Conversation]    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  💬 Ask AI about this entity...            [↵ to send]  │
│                                                         │
│  RECENT CONVERSATIONS                                   │
│  ├── Marketing AI: Q3 campaign strategy                 │
│  │   [View Thread]                              2h ago  │
│  ├── Sarah Chen: Budget approval request                │
│  │   [View Thread]                              Yesterday│
│  └── Content Team: Campaign deliverables                │
│      [View Thread]                              2d ago  │
│                                                         │
│  PENDING APPROVALS (2)                                  │
│  ├── ✅ Budget Increase — $50K                         │
│  │   Requested by Finance AI                  [Review]   │
│  └── ⏳ Brand Refresh — Campaign #7                     │
│      Requested by Content AI                  [Review]   │
│                                                         │
│  [New Conversation]  [Schedule Meeting]                 │
└─────────────────────────────────────────────────────────┘
```

**Collaboration UX rules (v1.1):**
- **Persistent AI chat input** is docked at the top of this panel AND in the global footer (§5.5 Command Palette). The `↵` sends; `⇧↵` inserts a newline.
- This is the **write surface** of the workspace. Activity (§2.9) is the read surface. The two must never be conflated.
- **Approvals always show the requester with avatar + role + AI/Human badge**. Never show approvals as anonymous rows.

### 2.7 Insights Capability

**Purpose:** Performance measurement and analytics.

**Must include:**
```
Insights
├── kpis               — Key performance indicators with current values
├── trends             — Historical trend data
├── reports            — Generated and scheduled reports
├── forecasts          — Predictive projections
├── comparisons        — vs target, vs period, vs benchmark
├── exports            — Available export formats
└── aiNarratives       — AI-generated explanations of metrics
```

**Insights Panel UI:**
```
┌─────────────────────────────────────────────────────────┐
│ INSIGHTS                                      [↻]      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  KEY METRICS (4 max on first paint)                     │
│  ┌──────────────┐ ┌──────────────┐                    │
│  │ Pipeline     │ │ Win Rate     │                    │
│  │ $4.2M        │ │ 34%          │                    │
│  │ ↑ 12% vs Q2  │ │ ↑ 4% vs Q2   │                    │
│  │ ████████░░░  │ │ ███████░░░░  │                    │
│  │ [Explain]    │ │ [Explain]    │                    │
│  └──────────────┘ └──────────────┘                    │
│  ┌──────────────┐ ┌──────────────┐                    │
│  │ CAC          │ │ NPS          │                    │
│  │ $1,240       │ │ 72           │                    │
│  │ ↓ 8% vs Q2   │ │ ↑ 3pts vs Q2 │                    │
│  │ [Explain]    │ │ [Explain]    │                    │
│  └──────────────┘ └──────────────┘                    │
│                                                         │
│  Click any KPI to expand inline (no modal).             │
│                                                         │
│  [View Full Analytics]  [Generate Report]              │
└─────────────────────────────────────────────────────────┘
```

**Insights UX rules (v1.1):**
- **Maximum 4 hero KPI cards on first paint** (per §4.2 cognitive load limit).
- **Click-to-expand inline** (not a modal). Expanding a KPI reveals the underlying chart, breakdown, and a "Compare to: [Period ▼]" selector.
- **Every KPI card has an "Explain" link** invoking `ai:explain` inline. Result appears as a popover above the card. This is the "AI is Native" principle for analytics.
- **Sparkline in every KPI card** — never just a number.
- **Trend arrows** (`↑ ↓ →`) plus delta values (e.g., `↑ 12% vs Q2`). Color-coded: green up is good, red up is bad — context-aware (rising costs are bad).

### 2.8 Automation Capability

**Purpose:** Workflows, triggers, and integrations associated with this entity.

**Must include:**
```
Automation
├── workflows          — Active automation workflows
├── triggers           — Event-based triggers
├── schedules          — Time-based automation schedules
├── integrations        — Connected external systems
│   ├── name          — Integration name (Shopify, SAP, Epic)
│   ├── type          — Integration category
│   ├── status        — Connected, Error, Disabled
│   └── lastSync      — Last successful sync
├── webhooks          — Outbound event notifications
└── aiActions         — Available AI actions for this entity
```

**Automation Panel UI:**
```
┌─────────────────────────────────────────────────────────┐
│ AUTOMATION                          [+ Workflow] [+ Int] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ACTIVE WORKFLOWS (3)                                   │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Campaign Launch          ● Running    [Open]    │   │
│  │ ▣─▣─▣─▢─▢  Stage 3/5       Last run: 2h ago    │   │
│  ├─────────────────────────────────────────────────┤   │
│  │ Lead Nurturing           ● Running    [Open]    │   │
│  │ ▣─▣─▣─▣─▣  Stage 5/5 ✓     Last run: 12m ago   │   │
│  ├─────────────────────────────────────────────────┤   │
│  │ Budget Approval          ○ Paused     [Open]    │   │
│  │ ▢─▢─▢─▢─▢  Stage 0/5       Paused 3d ago       │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  INTEGRATIONS                                            │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🟢 Google Workspace    Last sync: 5m            │   │
│  │ 🟢 Salesforce          Last sync: 12m           │   │
│  │ 🔴 SAP                 Error: Auth required     │   │
│  │ ⚫ Stripe              Not connected            │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  AI ACTIONS AVAILABLE ON THIS ENTITY (12)   [Browse]   │
│  ⚡ Summarize  ⚡ Find Risks  ⚡ Forecast  +9 more      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Automation UX rules (v1.1):**
- **Workflow rows show a thumbnail preview** of the DAG (stages as `▣─▣─▣─▢─▢` glyphs), not just a name + status. Click opens the React Flow builder in a **slide-over drawer** (not a new route) — preserves workspace context.
- **Integration rows** are colored dots (🟢🟡🔴⚫) with last-sync timestamp on hover. Errors expand inline with a "Fix" button.
- **AI Actions available on this entity** are surfaced here as quick-fire buttons. This is one of three AI surfaces (Intelligence panel + Command Palette + here); each has a distinct purpose (deep analysis, navigation, quick action).

### 2.9 Activity Capability

**Purpose:** Complete history of everything that happened.

**Must include:**
```
Activity
├── timeline           — Chronological event log
│   ├── timestamp
│   ├── actor          — User or AI who performed
│   ├── action         — What happened
│   ├── target         — What was affected
│   ├── aiSummary      — AI interpretation of event
│   └── metadata       — Event-specific data
├── humanActions      — Actions by humans
├── aiActions         — Actions by AI employees
├── workflowEvents     — Workflow execution history
├── stateChanges      — Status and state transitions
├── approvalHistory    — Approval decisions
└── auditLog          — Compliance-grade audit trail
```

**Activity Panel UI:**
```
┌─────────────────────────────────────────────────────────┐
│ ACTIVITY                            [Export] [Audit]    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [ All ] [ Human 3 ] [ AI 7 ] [ Workflow 4 ] [ State 1 ]│
│                                                         │
│  ● Today                                                │
│   ┌─────────────────────────────────────────────────┐  │
│   │ 🤖 Marketing AI                                  │  │
│   │ Generated Q3 summary report                      │  │
│   │ 2:34 PM    [View AI summary]                     │  │
│   └─────────────────────────────────────────────────┘  │
│   ┌─────────────────────────────────────────────────┐  │
│   │ 👤 Sarah Chen                                    │  │
│   │ Approved $50K budget increase                    │  │
│   │ 11:22 AM                                         │  │
│   └─────────────────────────────────────────────────┘  │
│   ┌─────────────────────────────────────────────────┐  │
│   │ 🔄 Workflow: Campaign Launch                     │  │
│   │ Completed Stage 2: Content Review                │  │
│   │ 9:15 AM                                          │  │
│   └─────────────────────────────────────────────────┘  │
│                                                         │
│  ● Yesterday                                            │
│   ...                                                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Activity UX rules (v1.1):**
- **Filter chips at top**: All / Human / AI / Workflow / State Changes. Default: All. Counts shown in each chip.
- **AI-interpreted events get a 🤖 badge** so users learn to recognize AI actions at a glance. "View AI summary" expands the event's `aiSummary` field if present.
- This is the **read-only, audit-grade timeline**. Chat, comments, and approvals live in **Collaboration** (§2.6). The split is non-negotiable.
- **Virtualized scrolling** for >100 events. Lazy-load deep history.
- **Export Log** = CSV / JSON / PDF (per §3.2). **View Audit Trail** opens a read-only compliance-grade view (no edit affordances).

### 2.10 Lifecycle Capability (NEW in v1.1)

**Purpose:** Expose the universal entity state machine as a first-class CORE panel. Lifecycle was buried in Administration in `EAOS-implementation-plan.md` v2.4 §1.2; this specification elevates it because state transitions are too important to hide behind a gear icon.

**Must include:**
```
Lifecycle
├── currentState        — Universal state (DRAFT | ACTIVE | PAUSED | PENDING_APPROVAL | SUSPENDED | ARCHIVED | DELETED)
├── subState            — Entity-specific (e.g., "on_track", "idle", "operational")
├── enteredAt           — When current state was entered
├── enteredBy           — User or AI who triggered transition
├── availableTransitions — Buttons for each valid next state (from current)
├── transitionRules     — Conditions, approvals, permissions required
├── stateHistory        — Chronological transition log with durations
├── autoTransitions     — Scheduled or rule-based transitions (cron + condition)
└── whyNotActive        — AI-generated explanation when state is non-ACTIVE
```

**Lifecycle Panel UI:**
```
┌─────────────────────────────────────────────────────────┐
│ LIFECYCLE                                       [↻]    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  CURRENT STATE                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │ ● DRAFT                                          │   │
│  │ Entered 2026-06-10 by Sarah Chen (CMO)          │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  💡 WHY NOT ACTIVE?                                     │
│  "Marketing plan not finalized. 3 deliverables pending: │
│   Q3 budget approval, brand refresh review, campaign   │
│   list from Sales AI."  [Take me there →]              │
│                                                         │
│  AVAILABLE TRANSITIONS                                  │
│  [ Submit for Approval ]                                │
│     Requires: 2 of 3 deliverables complete             │
│                                                         │
│  STATE HISTORY                                          │
│  ●─── DRAFT          2026-06-01 → today  (26 days)    │
│       Created by Sarah Chen                            │
│                                                         │
│  AUTO TRANSITIONS                                       │
│  ⏰ Auto-archive 90 days after ACTIVE if no activity    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Lifecycle UX rules (v1.1):**
- **Current state as a large colored badge** (never a dropdown). Available transitions are **buttons** below, not menu items.
- **`whyNotActive` AI prompt** is shown when state is non-ACTIVE. This turns a passive state badge into actionable guidance — aligns with "Action First."
- **State history as a horizontal timeline** with durations, not a list. `26 days` between transitions is visible at a glance.
- **Auto transitions** are listed explicitly so users know when the system will act without them.
- **Click any past state** to view what was true about the entity at that point (snapshot view — uses Prisma temporal features).

---

## Part III — Universal Rules

These rules apply to every section, every capability, every panel, and every element.

### 3.1 Required States

Every section MUST support these states:

| State | Meaning | UI Treatment |
|---|---|---|
| **Loading** | Data is being fetched | Skeleton shimmer. Never blank screen. |
| **Empty** | No data exists yet | Illustrated empty state from the standard library (§3.1a). |
| **Error** | Data fetch failed | Error message with retry action. |
| **Offline** | Device is offline | Banner with last-synced timestamp. |
| **Permission Denied** | User cannot view | "You don't have access" with request access option. |
| **Read Only** | User can view but not edit | Visual indicator + disabled controls. |

#### 3.1a Empty State Library (NEW in v1.1)

The "Empty" state MUST use one of these six canonical illustrations. Each is a single SVG + headline + 1-line description + primary action button. Consistency is mandatory — no bespoke empty states.

| State ID | When Shown | Headline | Primary Action |
|---|---|---|---|
| **First Run** | Tenant just created the entity type | "Welcome to {EntityType}" | "Create your first {Entity}" |
| **No Data** | Entity exists but has no records | "Nothing here yet" | "Add the first one" |
| **No Permission** | User cannot view resources but can see they exist | "You don't have access to this content" | "Request access" |
| **No Results** | Search/filter returned nothing | "No matches for {query}" | "Clear filters" |
| **Integration Disconnected** | Panel depends on an integration that's down | "{IntegrationName} is disconnected" | "Reconnect" |
| **AI Generated Nothing** | AI action ran successfully but produced empty output | "AI found nothing notable" | "Try different parameters" |

All six empty states share the same visual layout (centered illustration, headline above, action below, secondary text link).

### 3.2 Required Interactions

Every section MUST support:

```
Every section SHALL support:
├── Search              — Find within section data
├── Filter             — Narrow by attribute (status, type, date, owner)
├── Sort               — Order by column, date, relevance
├── Group              — Cluster by category
├── Export             — Download as CSV, PDF, JSON
└── Refresh           — Reload latest data

Every section SHALL expose:
├── Context Menu       — Right-click or ⋯ menu
├── Quick Actions      — Frequently used actions pinned
├── AI Actions         — Context-aware AI operations
└── Keyboard Shortcuts — Power-user shortcuts

Every collection SHALL support:
├── Single Selection   — Click to select
├── Multi Selection    — Checkbox or Shift+Click
├── Bulk Actions       — Act on multiple items
├── Inline Actions     — Quick edit without opening
└── Drag & Drop       — Reorder where meaningful
```

### 3.4 Activity vs Collaboration Boundary (NEW in v1.1)

To prevent the data-model overlap flagged in review, the following split is mandatory:

| Concern | Lives In | Why |
|---|---|---|
| Chat messages | Collaboration | Write surface; users expect replies |
| Comments on entities | Collaboration | Conversational; can be edited/deleted by author |
| Approvals (pending/completed) | Collaboration | Active workflow items |
| @mentions | Collaboration | Notification target |
| Meetings, scheduling | Collaboration | Forward-looking; can change |
| Timeline events (who did what when) | **Activity** | Audit-grade; immutable |
| State transitions | **Activity** | Audit trail requirement |
| AI-generated actions | **Activity** | Compliance + cost attribution |
| Workflow executions | **Activity** | Run history |
| Audit log | **Activity** (read-only mode) | Compliance |

**Rule:** if the event is **immutable historical fact**, it belongs in Activity. If the event is **active work to be done or replied to**, it belongs in Collaboration.

### 3.3 Required Behaviors

```
Every destructive action:
├── MUST require confirmation dialog
├── MUST state the consequence clearly
└── SHOULD offer "undo" within 30 seconds if reversible

Every long-running operation:
├── MUST show progress indicator
├── MUST show estimated time remaining
└── MUST allow cancellation

Every AI-generated content:
├── MUST show confidence level
├── MUST cite sources when applicable
├── MUST allow regeneration
└── MUST allow feedback (thumbs up/down)

Every notification:
├── MUST be actionable (click to navigate)
├── MUST be dismissible
└── MUST respect user notification preferences
```

---

## Part IV — Information Hierarchy

This hierarchy defines what appears first and what requires explicit navigation.

### 4.1 Information Priority (Top to Bottom)

```
LAYER 1 — At a Glance (No scroll required on desktop):
├── Identity (name, type, icon, status)
├── Health (colored indicator + summary)
├── AI Intelligence (summary + top 3 risks + top 3 recommendations)
└── Primary Action (most common operation, one-click)

LAYER 2 — Immediate Context (1 scroll or single tab):
├── Active Operations (tasks, projects, workflows — most urgent first)
├── Key Resources (team, AI, budget summary)
├── Quick Insights (top 4 KPIs with sparklines)
└── Recent Activity (last 5 events)

LAYER 3 — Full Detail (explicit navigation or tab):
├── All data for the capability
├── Complete lists and tables
├── Full history and audit
└── Search within section

LAYER 4 — Expert Controls (explicit navigation):
├── API access and webhooks
├── Advanced configuration
├── Debug tools and logs
└── Integration settings
```

### 4.2 Cognitive Load Limits

```
Maximum 5–7 primary actions visible at once.
Maximum 4 hero KPI cards on first view.
Maximum 3 navigation levels before search is preferred.
Critical information MUST be visible without scrolling on desktop.
AI recommendations MUST be concise by default; expandable for detail.
```

### 4.3 Interaction Depth Rules

```
One-click access to:
├── Primary action
├── AI summary refresh
├── Context menu
└── Navigation to related entity

Two-click maximum to:
├── Create new entity (task, project, workflow)
├── Assign work to team member or AI
└── Run AI action

Three-click maximum to:
├── Open any secondary panel
├── Access settings
└── Generate standard report
```

---

## Part V — Universal Layout

### 5.1 Workspace Shell

Every workspace follows this structure:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [Logo] [Search ⌘K]  …  [🤖 Ask AI]  [🔔 3] [👤]                            │ ← Global bar
├──────┬───────────────────────────────────────────────────────────────────────┤
│ Ico  │ ← Back   Marketing Department / Q3 Campaign                          │
│ Rail │ Enterprise › Executive › Marketing › Q3 Campaign   [⭐][👁][⋯]      │ ← Header
│ ┌──┐ │                                                                       │
│ │📂│ │ ┌─────────────────────────────────────────────────────────────────┐ │
│ │🏢│ │ │ 🤖 INTELLIGENCE                              [↻] [⤢] [⋯]        │ │
│ │👥│ │ │ Q3 pipeline $4.2M — on track for $5M target. 3 deals at risk.   │ │
│ │🤖│ │ │ Conf 94% │ ⚠3 Risks │ 💡2 Opps │ 📋 3 Recommendations [Do First] │ │
│ │📦│ │ └─────────────────────────────────────────────────────────────────┘ │
│ │📚│ │                                                                       │
│ │⚙ │ │ ┌──────────────────┐ ┌──────────────────────────────────────────┐  │
│ └──┘ │ │ 🆔 IDENTITY       │ │ ⚙ OPERATIONS                  [Kanban]   │  │
│      │ │ ● ACTIVE ●HEALTHY│ │ Tasks 12 │ Projects 3 │ Workflows 2      │  │
│ ⭐  │ │ Owner: Sarah C.   │ │ ┌────────┐ ┌────────┐ ┌────────┐         │  │
│ 🕐  │ │ Tags: Q3 2026 VIP │ │ │Kanban  │ │List    │ │Gantt   │         │  │
│ 👁  │ └──────────────────┘ └──────────────────────────────────────────┘  │
│      │ ┌──────────────────┐ ┌──────────────────────────────────────────┐  │
│      │ │ 👥 RESOURCES      │ │ 📊 INSIGHTS                              │  │
│      │ │ Human 8 │ AI 5    │ │ [KPI][KPI][KPI][KPI]                     │  │
│      │ │ Budget: ████ 62%  │ │ [──────── Trend Chart ────────]          │  │
│      │ └──────────────────┘ └──────────────────────────────────────────┘  │
├──────┴───────────────────────────────────────────────────────────────────────┤
│ Top tier (always visible):  [Intelligence] [Identity] [Operations] [Insights]│
│ Bottom rail (scrollable):   [Context] [Collaboration] [Resources]           │
│                            [Automation] [Activity] [Lifecycle]              │
│ Persistent dock:            [🤖 Ask AI]                  [⚙ Admin]        │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Workspace Shell UX rules (v1.1):**
- **Two-tier tab system**: top tier holds the **4 primary capabilities** (Intelligence, Identity, Operations, Insights) — always visible. Bottom rail holds the remaining **6 capabilities** (Context, Collaboration, Resources, Automation, Activity, Lifecycle), horizontally scrollable on narrow viewports. This respects the cognitive load limit of 5–7 visible actions.
- **Intelligence is a full-width collapsible hero band** at the top, sitting above the 2-column grid. Never crammed into a side rail.
- **Left icon rail is persistent** across all workspaces: entity types (📂 🏢 👥 🤖 📦 📚), then below them Favorites (⭐), Recents (🕐), Watched (👁). Width = 56px collapsed / 220px expanded.
- **Global "Ask AI" button** in the top bar — always one click away regardless of where the user is. Opens the Command Palette in ask-AI mode (§5.5).
- **Admin is a gear icon** in the workspace header — opens a modal, never a panel.

### 5.2 Panel Anatomy

Every panel follows this anatomy:

```
┌─────────────────────────────────────────────────┐
│ PANEL HEADER                          [Actions] │
├─────────────────────────────────────────────────┤
│ Panel content (scrollable)                       │
│                                                 │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Panel Header always includes:**
- Panel name (title)
- Refresh action (↻)
- Expand/collapse toggle
- Context menu (⋮)

**Panel content area:**
- Scrollable independently
- Virtualized for large lists
- Skeleton loading state

### 5.3 Responsive Behavior

| Viewport | Layout Adaptation |
|---|---|
| **Desktop (>1280px)** | Full 2-column grid, all panels visible, Intelligence expanded by default |
| **Laptop (1024-1280px)** | Narrower panels; Identity and Operations visible, rest in tabs; Intelligence collapsed to 1-line summary by default |
| **Tablet (768-1024px)** | Single column, tabs for capabilities, left icon rail collapsed to icons only |
| **Mobile (<768px)** | Single column, Intelligence collapsed to 1-line summary, tabs mandatory, persistent "Ask AI" docked at bottom |

**Mobile-specific rules:**
- The Intelligence hero band shows **one line of summary + a "Tap to expand" affordance**. Never expanded by default on mobile.
- The persistent **"Ask AI" dock** at the bottom of every workspace is the only AI surface on mobile (Command Palette ⌘K opens as full-screen on mobile).
- The **Mission Feed (§5.4)** replaces the global top bar on mobile (one swipe-down reveals it).

---

### 5.4 Mission Feed (NEW in v1.1)

The Mission Feed is the dashboard-only surface that operationalizes the "Action First" principle: **work finds the user.**

**Where it appears:**
- The **global dashboard** (route `/`), as a persistent banner at the top of the page.
- Replaces the global top bar on **mobile** (swipe-down reveals it).

**What it contains:**
```
┌─────────────────────────────────────────────────────────────────────────┐
│ TODAY                                                                 │
│ 3 items need your attention                          [Dismiss all]    │
│                                                                         │
│ 🔴  Deal #1234 close-date slipping        Marketing › Q3 Campaign      │
│     AI: 96% — review with Sales AI         [Open]   [Delegate]         │
│                                                                         │
│ 🟡  Plant Detroit OEE dropped to 81%       Operations › Plant Detroit   │
│     AI: 84% — predictive maintenance due  [Open]   [Schedule]          │
│                                                                         │
│ 🟢  Acme Corp upsell window open ($200K)   Sales › Acme Corp            │
│     AI: 78% — expires Friday                [Open]   [Brief me]         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Mission Feed UX rules:**
- **Maximum 5 items** shown at once. Aggregate the rest into a "+12 more" link that opens the full attention queue.
- Each item shows: severity icon, one-line description, breadcrumb to the entity, AI confidence, and **3 actions max** (Open / Delegate / one contextual).
- **Recomputed on dashboard load** AND every 5 minutes while dashboard is visible. Items dismissed do not return for 24 hours.
- **No "mark all read."** Mission Feed is for actionable items only; reading happens via [Open].
- **Items are AI-generated, not user-curated.** The user trusts the AI's prioritization (this is the bet of "Intelligence First"). Show "Show reasoning" on hover.

### 5.5 Command Palette (NEW in v1.1)

The Command Palette (⌘K / Ctrl-K) is the **primary power-user navigation surface** and the **ambient AI entry point**.

**Two modes:**

| Prefix | Mode | What Happens |
|---|---|---|
| (none) | **Navigate** | Searches entities, settings, knowledge, commands. Enter to open. |
| `?` | **Ask AI** | Routes the query to the current entity's intelligence. Streams answer inline. |

**Navigate mode behavior:**
```
⌘K ▸
┌─────────────────────────────────────────────────────────────────┐
│ 🔍 Search NeureCore...                                          │
├─────────────────────────────────────────────────────────────────┤
│ 📂 Entities                                                     │
│   → Marketing Department                                        │
│   → Q3 Campaign                                                 │
│   → Acme Corp                                                   │
│ ⚙ Settings                                                      │
│   → Integrations                                                │
│   → User Preferences                                            │
│ 📚 Knowledge                                                    │
│   → Q3 Sales Methodology                                        │
│ ⚡ Quick Commands                                               │
│   → Create new task                                             │
│   → Invite team member                                          │
└─────────────────────────────────────────────────────────────────┘
```

**Ask-AI mode behavior:**
```
⌘K ▸ ?What's at risk in Q3?
┌─────────────────────────────────────────────────────────────────┐
│ 💬 Ask AI — context: Marketing Department › Q3 Campaign       │
├─────────────────────────────────────────────────────────────────┤
│ Streaming answer...                                              │
│ "Three risks identified: (1) Deal #1234 may miss close date¹    │
│ ... (continues streaming)"                                       │
│                                                                 │
│ Citations:                                                       │
│  ¹ Q3 Sales Methodology (Knowledge)                            │
│                                                                 │
│ [Insert into chat]  [Open in Intelligence panel]               │
└─────────────────────────────────────────────────────────────────┘
```

**Command Palette UX rules:**
- **Always available** (⌘K on desktop, persistent dock button on mobile).
- **Recent + Favorites appear above search results** when the palette opens empty.
- **Keyboard-first**: arrow keys to navigate, Enter to select, Esc to close, ⇧↵ for newline in Ask-AI mode.
- **Privacy**: Ask-AI queries are scoped to the currently active workspace unless the user explicitly expands scope.

### 5.6 Cross-Entity Mini-Graph (NEW in v1.1)

Every workspace exposes a **mini-graph button** in the header (top-right, next to ⭐/👁/⋯). Clicking opens a slide-over showing 1-hop typed relationships from the current entity.

```
[Header] Q3 Campaign  [⭐][👁][●Mini-Graph][⋯]
                                 │
                                 ▼
┌────────────────────────────── Slide-over ──────────────────────────────┐
│ Q3 Campaign — Connected Entities                          [⤢ Full]   │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│ parent (1)                                                            │
│   └── Marketing Department                              [Open →]    │
│                                                                       │
│ children (4)                                                          │
│   ├── Q3 Email Blast                              [Open →]           │
│   ├── Q3 Retargeting Ads                          [Open →]           │
│   ├── Q3 Brand Refresh                            [Open →]           │
│   └── Q3 Webinar Series                           [Open →]           │
│                                                                       │
│ operates-in (2)                                                       │
│   ├── Sales Department (sister)                    [Open →]           │
│   └── Product Marketing (cross-dept)               [Open →]           │
│                                                                       │
│ collaborates-with (3)                                                 │
│   ├── Sales AI                                     [Open →]           │
│   ├── Content AI                                   [Open →]           │
│   └── Analytics AI                                 [Open →]           │
│                                                                       │
│ assigned to (5)                                                       │
│   ├── 👤 Sarah Chen (Owner)                        [Open →]           │
│   ├── 👤 John M.                                    [Open →]          │
│   ├── 🤖 Campaign AI                                [Open →]          │
│   └── ...                                                              │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

**Mini-Graph UX rules:**
- **1-hop only by default.** "⤢ Full" opens the full graph (route `/entity/{type}/{id}/graph`) for power users.
- **Relationship types are grouped** (parent / children / operates-in / collaborates-with / assigned-to) using the typed `EntityRelationship` model from `EAOS-implementation-plan.md` §6.
- **Click any node to navigate** to that entity's workspace. Slide-over closes; back button returns to origin.
- **Avatar + role shown** for human/AI relationships (e.g., `👤 Sarah Chen (Owner)`).

### 5.7 Multi-Entity Compare View (NEW in v1.1)

**Route:** `/compare?ids={type}:{id},{type}:{id},...` (up to 4 entities).

**Purpose:** Executive workflows like "Compare Q2 vs Q3 campaigns" or "Compare Store NYC vs Store LA vs Store SF."

```
┌────────────────────────────────────────────────────────────────────────┐
│ Compare 3 entities                                  [+ Add] [Share]  │
├────────────────────────────────────────────────────────────────────────┤
│              │ Store NYC      │ Store LA      │ Store SF           │
│ Health       │ ● Healthy      │ ● Warning     │ ● Healthy           │
│ Intelligence │ Pipeline $2.1M │ Pipeline $1.4M│ Pipeline $1.8M     │
│ Operations   │ 12 tasks       │ 23 tasks      │ 15 tasks            │
│ Resources    │ 8 human, 2 AI  │ 6 human, 2 AI │ 7 human, 2 AI       │
│ Insights     │ NPS 72         │ NPS 58        │ NPS 68              │
└────────────────────────────────────────────────────────────────────────┘
```

**Compare UX rules:**
- **Side-by-side columns** with synchronized rows (one row per capability field). Same row alignment makes comparisons obvious.
- **Up to 4 entities** at once. Adding a 5th disables the "Add" button with a tooltip.
- **Differences highlighted**: cells where values differ from the median get a subtle colored bar on the left edge.
- **Deep-linkable**: the URL is the entire state — share `?ids=facility:store-nyc,facility:store-la`.
- **Empty state:** "Select entities to compare" with a drag-drop surface or a typeahead.

---

## Part VI — Universal Behaviors

### 6.1 Entity Navigation

```
Enter Entity Workspace:
  User clicks entity → Workspace loads with all 9 capabilities
  URL: /entity/{type}/{id}  (e.g., /entity/department/sales-nyc)

Navigate to Related Entity:
  User clicks "Sales AI" in Context panel → Sales AI workspace opens
  Back button returns to previous workspace

Breadcrumb Navigation:
  Enterprise → Executive → Marketing → Campaign Team
  Each crumb is clickable, navigates to that entity's workspace
```

### 6.2 AI Action Invocation

```
Standard Flow:
  1. User sees AI Actions panel or invokes via ⌘K
  2. User selects action (e.g., "Generate Summary")
  3. System shows loading state with progress
  4. AI processes, result appears inline or in panel
  5. User can accept, modify, or regenerate

Streaming Flow:
  For long outputs, results stream in real-time
  Token count and estimated time shown
```

### 6.3 State Transitions

```
Lifecycle State Change:
  1. User clicks state badge or "Change State" in Identity
  2. Available transitions shown based on current state
  3. User selects target state
  4. If approval required → approval workflow triggered
  5. If auto-transition → system processes immediately
  6. State badge updates, activity logged
```

### 6.4 Workspace Configuration

```
Configure Workspace:
  User clicks ⚙️ in panel header
  Configuration modal opens:
    ├── Show/hide panels
    ├── Reorder panels
    ├── Set default visualization (card vs table vs chart)
    ├── Configure refresh interval
    └── Set notification preferences

Save Layout:
  User configures → Saves as personal default
  User can also save as shared default (admin only)
```

---

## Part VII — Design Rules

### 7.1 Non-Negotiable Rules

```
Information Priority:
  1. Identity (always visible or one-click away)
  2. Health (colored indicator always visible)
  3. AI Intelligence (always first expanded panel)
  4. Urgent Actions (badge count on tabs)
  5. Current Operations
  6. Resources
  7. Insights
  8. Activity
  9. Administration

Interaction Principles:
  1. One-click access to common actions
  2. Two-click maximum to operational work
  3. Consistent placement of actions across all workspaces
  4. AI assistance available in every major interaction
  5. Destructive actions always require confirmation or policy approval
```

### 7.2 Visual Encoding

```
Health Status Colors:
  ● Healthy:    Green (#10B981)
  ● Warning:    Yellow (#F59E0B)
  ● Critical:   Red (#EF4444)
  ● Unknown:    Gray (#6B7280)

State Colors:
  ● Active:     Green
  ● Paused:     Yellow
  ● Suspended:  Orange
  ● Archived:   Gray
  ● Draft:      Blue
  ● Pending:    Purple

Action Severity:
  🔴 Do First (AI: >90% confidence)
  🟡 Consider (AI: 70-90% confidence)
  🟢 Optional (AI: <70% confidence)
```

### 7.3 Accessibility

```
Keyboard Navigation:
  ├── Tab order follows visual hierarchy
  ├── Enter to select/activate
  ├── Escape to close/cancel
  ├── Arrow keys for list navigation
  └── ⌘K for command palette

Screen Reader:
  ├── All panels have ARIA labels
  ├── Health status announced with color + text
  ├── AI confidence announced
  └── Action outcomes announced

Contrast:
  ├── WCAG AA minimum for all text
  ├── Critical indicators use shapes + color (not color alone)
  └── Focus indicators visible
```

### 7.4 Performance

```
Page Load:
  ├── First contentful paint: <1.5s
  ├── Interactive (Intelligence visible): <3s
  └── Full workspace: <5s

Panel Refresh:
  ├── Auto-refresh interval: configurable (30s to 1hr)
  ├── Manual refresh: immediate
  └── AI regeneration: streaming with progress

Large Lists:
  ├── Virtual scrolling for >100 items
  ├── Pagination for exports
  └── Lazy load for deep history
```

### 7.5 Design Tokens (NEW in v1.1, updated to v1.2)

The visual encoding rules in §7.2 specify colors for state and health. v1.1 adds the full design token system. v1.2 locks the chart library and density system. These are binding.

**Locked implementation choices (v1.2):**
- **Chart library:** Tremor (`@tremor/react`). Native dark-mode support; built on Recharts. See `EAOS-implementation-plan.md` §11.2a + §14.2 Q7.
- **Icon library:** Lucide (`lucide-react`).
- **Theme switcher:** `next-themes`.
- **Density:** global per-user setting with Operations-workspace override. See `EAOS-implementation-plan.md` §14.2 Q4.

#### 7.5.1 Typography

| Role | Family | Weight | Usage |
|---|---|---|---|
| UI body | Inter | 400 | All paragraph text, labels, table cells |
| UI metadata | Inter | 500 | Tags, badges, secondary metadata |
| Section heads | Inter | 600 | Panel titles, modal titles, section headers |
| Display | Inter | 700 | **Only** the entity name in the workspace header |
| Monospace | JetBrains Mono | 400 | Entity IDs, codes, JSON, command palette hints |

**Type scale:** 12 / 13 / 14 (body) / 16 / 20 / 24 / 32 / 48 px. Body text is **14px on desktop, 16px on mobile** for readability.

#### 7.5.2 Color

**Chrome (UI surfaces):**
- Neutral grayscale palette, 10 steps from `#0A0A0A` to `#FAFAFA` (light mode); inverted in dark mode.
- Backgrounds use steps 50–100; text uses steps 700–900; borders use steps 200–300.
- **State/health colors (§7.2) only appear on things that carry state.** Never decorate chrome with color.

**Per-tenant theming:**
- Tenants can configure **logo, primary accent color, and font** (Inter only — not arbitrary fonts).
- Per-tenant accent color is applied at the workspace shell border, primary buttons, and the active tab indicator only. Never inside charts or text.
- **Solution Packs can ship vertical-specific accent palettes** (Healthcare = teal, Manufacturing = amber, Logistics = slate). These are applied to the workspace shell of entities where the pack's subtypes apply.

#### 7.5.3 Dark Mode (REQUIRED from day 1)

- **Default to system preference.** No flash of light theme on load.
- **AI summaries often read better on dark backgrounds** during long sessions; this is one reason dark mode is P0, not P2.
- Charts must be **re-designed for dark mode**, not auto-inverted. Specifically: dark backgrounds need slightly higher saturation on line colors to maintain legibility.
- The **Intelligence panel** uses a slightly elevated background (one step lighter than the workspace shell) so it reads as a distinct surface.

#### 7.5.4 Density Toggle

Users choose between three densities; the choice is persisted per user:

| Density | Row height | Padding | Use case |
|---|---|---|---|
| **Compact** | 28px | 4px | Power users, finance, ops dashboards |
| **Default** | 36px | 8px | Standard workspace use |
| **Comfortable** | 48px | 12px | Executives, presentations, accessibility |

The density applies to all tables, lists, and Kanban cards. Panel headers, KPIs, and the Intelligence hero band do NOT shrink — they remain at Default density even in Compact mode.

#### 7.5.5 Iconography

- **Lucide** as the icon library (open-source, consistent stroke weight, MIT).
- **4px stroke weight** at 16/20/24px sizes.
- **Status icons always paired with color + shape** — never color alone (WCAG compliance).

---

## Part VIII — Implementation Contract

### 8.1 Compliance Checklist

Every workspace implementation MUST satisfy:

```
IDENTITY:
  [ ] Name, type, icon, avatar displayed
  [ ] Status badge (colored, always visible)
  [ ] Health indicator (colored, always visible)
  [ ] Owner and team shown
  [ ] Tags/labels displayed
  [ ] Created/modified timestamps

INTELLIGENCE:
  [ ] AI Summary is first expanded panel
  [ ] Top 3 risks shown with severity
  [ ] Top 3 recommendations shown with confidence
  [ ] "Do First" action highlighted
  [ ] Refresh action available
  [ ] Confidence percentage shown

OPERATIONS:
  [ ] Active tasks/projects shown first
  [ ] Count badges on tabs
  [ ] Create action available
  [ ] Kanban/list view toggle

RESOURCES:
  [ ] Human team listed with avatars
  [ ] AI team listed with avatars
  [ ] Budget with progress bar
  [ ] Document count shown

COLLABORATION:
  [ ] AI conversation input always visible
  [ ] Pending approvals shown
  [ ] @mention count shown
  [ ] Persistent AI chat input docked at top

INSIGHTS:
  [ ] KPI cards with sparklines
  [ ] Trend indicators (↑↓)
  [ ] Comparison to period/target
  [ ] Maximum 4 KPI cards on first paint
  [ ] Click-to-expand inline (no modal)
  [ ] Per-KPI "Explain" link invoking ai:explain

AUTOMATION:
  [ ] Active workflow count
  [ ] Integration status indicators
  [ ] Error states clearly shown
  [ ] Workflow thumbnails (not just name + status)
  [ ] AI Actions available on this entity listed

ACTIVITY:
  [ ] Timeline with actor icons
  [ ] Filter chips: All / Human / AI / Workflow / State Changes
  [ ] Export available
  [ ] AI events carry 🤖 badge

LIFECYCLE (v1.1):
  [ ] Current state as large colored badge
  [ ] Available transitions rendered as buttons (not dropdowns)
  [ ] State history as horizontal timeline with durations
  [ ] `whyNotActive` AI prompt when state is non-ACTIVE
  [ ] Auto transitions listed explicitly

CROSS-CUTTING (v1.1):
  [ ] Command Palette (⌘K) supports both Navigate and Ask-AI modes
  [ ] Mission Feed present on dashboard
  [ ] Mini-Graph button in workspace header opens 1-hop relationship slide-over
  [ ] Compare View available at /compare?ids=...
  [ ] Global "Ask AI" button in top bar
  [ ] Admin is a gear-icon modal, not a panel
  [ ] Dark mode supported, defaults to system preference
  [ ] Design tokens (typography, color, density, iconography) applied consistently
  [ ] Per-tenant theming (logo, accent color, font)
  [ ] Density toggle (Compact / Default / Comfortable) persisted per user

REQUIRED STATES:
  [ ] Loading skeleton shown
  [ ] Empty state from the canonical 6 (§3.1a) — no bespoke empty states
  [ ] Error state with retry
  [ ] Permission denied handled
  [ ] Read-only mode indicated

REQUIRED INTERACTIONS:
  [ ] Search in every section
  [ ] Filter in every section
  [ ] Sort in every table
  [ ] Export available
  [ ] Context menu on every entity
  [ ] AI Actions accessible from 3 surfaces: Intelligence panel, Command Palette, Automation panel
  [ ] Per-task AI Delegation button on every Operations row

INTELLIGENCE-SPECIFIC (v1.1):
  [ ] Streaming-by-default with Stop button
  [ ] Inline citation chips (superscript) — click opens source slide-over
  [ ] Confidence as color-coded thermometer (not raw %)
  [ ] "Do First" recommendation is persistent sticky CTA
  [ ] Regenerate + feedback (👍/👎) on every AI output
  [ ] Last-generated timestamp shown below confidence bar
```

### 8.2 The NUWS Inheritance Rule

**Every future entity specification MUST inherit from this contract.**

```
NEW ENTITY: Hospital
  INHERITS: All 10 capabilities
  PROVIDES: Hospital-specific data in each capability
  DOES NOT: Invent new interaction patterns
  RESULT: Nurses, doctors, administrators all learn ONE workspace pattern

NEW ENTITY: Farm
  INHERITS: All 10 capabilities
  PROVIDES: Farm-specific data (crops, livestock, irrigation)
  DOES NOT: Create new workflow for "livestock management"
  RESULT: Farm managers learn ONE workspace pattern

NEW ENTITY: Retail Store
  INHERITS: All 10 capabilities
  PROVIDES: Store-specific data (inventory, POS, foot traffic)
  DOES NOT: Create a special "retail mode"
  RESULT: Store managers learn ONE workspace pattern
```

### 8.3 Exception Process

** Deviations from this contract require:**

```
1. Written proposal explaining:
   - Why the standard pattern doesn't fit
   - The proposed alternative
   - How it maintains user learnability

2. User research supporting the deviation

3. Engineering sign-off on implementation cost

4. UX lead approval

5. Addition to this document as a documented exception
```

---

## Appendix A — Universal Element Contract

Every visual element in NeureCore conforms to this contract:

| Property | Requirement |
|---|---|
| **Identity** | Element has unique ID, name, category |
| **Purpose** | Element exists for exactly one reason |
| **Applicable Entities** | Documented which entity types can use this element |
| **Applicable Capabilities** | Documented which capabilities use this element |
| **Inputs** | Data sources and requirements documented |
| **Outputs** | Data produced, events fired, actions triggered |
| **States** | Loading, empty, error, read-only, disabled all handled |
| **Actions** | User actions and AI actions documented |
| **Permissions** | RBAC requirements documented |
| **Configuration** | User-configurable options documented |
| **Responsive** | Desktop, tablet, mobile behavior documented |
| **Accessibility** | Keyboard, screen reader, contrast documented |
| **Performance** | Refresh strategy, lazy loading, caching documented |
| **Telemetry** | Usage metrics emitted |

---

## Appendix B — Glossary

| Term | Definition |
|---|---|
| **NUWS** | NeureCore Universal Workspace Specification — the behavioral contract for every entity |
| **Entity** | Any object managed by NeureCore (Department, AI Employee, Facility, etc.) |
| **Workspace** | The 10-capability container for an entity. Not a page — a contract. |
| **Capability** | One of 10 named areas every workspace exposes (Identity, Intelligence, etc.) |
| **Panel** | A UI region rendering one of the 10 capabilities (not Administration, which is a modal) |
| **Modal** | An overlay surface for actions not represented as a panel (Administration, Configuration, Lifecycle transition confirmation) |
| **Widget** | A visualization within a panel |
| **AI Action** | (Developer term) An invocation of AI to perform work on entity data, registered in the AIActionRegistry |
| **Ask AI** | (UI term) The user-facing label for invoking AI. Opens the Command Palette in ask-AI mode (§5.5) or the persistent chat input in Collaboration (§2.6). Surfaces include the Intelligence panel, the global top-bar button, and the Automation panel's quick-fire row. |
| **Mission Feed** | The dashboard-only persistent banner surfacing top AI-prioritized items needing user attention (§5.4) |
| **Command Palette** | The ⌘K global overlay with Navigate and Ask-AI modes (§5.5) |
| **Mini-Graph** | The 1-hop relationship slide-over opened from the workspace header (§5.6) |
| **Compare View** | The `/compare?ids=...` route for side-by-side comparison of up to 4 entities (§5.7) |
| **Health Signals** | The expandable sub-section within Identity showing the underlying signals contributing to an entity's health badge (§2.1) |
| **Empty State** | One of the six canonical illustrations (First Run, No Data, No Permission, No Results, Integration Disconnected, AI Generated Nothing) defined in §3.1a |
| **Design Token** | A binding visual primitive (color, type scale, spacing, density) defined in §7.5 |
| **Density** | One of Compact / Default / Comfortable row-height modes (§7.5.4) |
| **`frontend-eaos`** (v1.3) | The new EAOS application. Served at `eaos.neurecore.com/{tenantCompanyName}`. The target of all new EAOS work per D-022. | UI layer |
| **`packages/ui`** (v1.4) | Shared design system + permission hooks + query keys factory. | UI layer |
| **Universal Entity Property** | A property (State, Ownership, Labels, Health) that applies to all entities |
| **Entity Health** | A computed status with signals, trend, and alerts |
| **Progressive Disclosure** | Simple first, advanced on request, never overwhelming |
| **Behavioral Contract** | Defines what must happen, not how it looks |

---

## Appendix C — Document Relationships

```
EAOS-implementation-plan.md
  └── Defines: Entity model, capabilities, data structures
  └── References: NUWS for behavioral contract
  └── (v2.4) Lists 10 capability panels + Administration (modal)
  └── (v2.4) Updated to align with NUWS v1.1

NUWS-principles.md (this document)
  └── Defines: Behavioral contract for UI/UX
  └── Referenced by: All workspace and component specifications
  └── (v1.1) Adds Lifecycle as panel #10, Administration as modal
  └── (v1.1) Adds Mission Feed, Command Palette, Mini-Graph, Compare View, Design Tokens

pricing-plans.md
  └── Defines: Tiers, credits, solution packs
  └── Independent of: UI specification
  └── (v1.0) Adds AI Roster UI requirement (see "Unlimited AI Employees" section)

new_neurecore.md
  └── Defines: Current UI implementation (pages, routes)
  └── References: NUWS for behavioral contract

daily-tools-integration-plan.md
  └── Defines: AI tool implementations
  └── Independent of: UI specification
```

---

## Appendix D — Visual Reference (v1.1; locked in v1.2; redirected to `frontend-eaos/` in v1.3)

The following reference values must be applied consistently across all NeureCore UIs. These are not page mockups — they are binding values for components.

**Target app (per D-022 + D-023):** all new components land in `frontend-eaos/`. The shared `packages/ui/` package is the canonical source for these values. There is no other tenant frontend; `frontend-tenant/` was deleted in full per D-023.

### Shell dimensions (desktop, 1280px+)

| Surface | Width / Height |
|---|---|
| Global top bar | 56px tall, full-width |
| Left icon rail (collapsed) | 56px wide |
| Left icon rail (expanded) | 220px wide |
| Workspace header | 64px tall |
| Intelligence hero band | max-height 280px (collapsed: 56px) |
| Panel min width | 320px |
| Panel max width | 720px |
| Tab tier height | 44px tall |
| Bottom rail height | 40px tall |
| Persistent Ask-AI dock | 56px tall |

### Z-index scale

| Layer | z-index | Used for |
|---|---|---|
| Base | 0 | Workspace content |
| Sticky panel headers | 10 | Panel headers that stick on scroll |
| Tab rail | 20 | Sticky tab bars |
| Global top bar | 50 | Always on top of workspace content |
| Mini-graph slide-over | 100 | Relationship panel |
| Modal | 200 | Lifecycle transitions, Admin, confirmations |
| Command Palette | 300 | ⌘K overlay |
| Toast / notification | 400 | Mission Feed dismissals, AI completion |
| Critical alert | 500 | Destructive action confirmations, payment failures |

### Spacing scale (multiples of 4px)

`4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96` px. No other spacing values are allowed.

### Border radius scale

`4 (inputs, tags) / 8 (buttons, cards) / 12 (panels, modals) / 16 (workspace shell) / 9999 (pills, avatars)`.
