# NeureCore — Enterprise AI Operating System Specification

**Document Version:** 2.6  
**Date:** 2026-06-27  
**Status:** EAOS Core Specification  
**Audience:** Engineering, product, architecture  
**Supersedes:** v2.5 (resolves all 8 open UI questions in §14.2; locks decisions: Mission Feed = tenant-default + per-user opt-in, Mini-Graph = scrollable list v1, Compare = read-only v1, Density = global + Operations override, font = Inter only, AI Roster = dedicated `/ai-roster` route, chart library = Tremor, citation chips = slide-over with full-page link)  
**Related:** `daily-tools-integration-plan.md`, `agent-implementation.md`, `new_neurecore.md`, `EAOS-NUWS-principles.md` (v1.1, THE CONSTITUTION for UI)

---

## 0c. Changelog (v2.4 → v2.5)

| Section | Change | Rationale |
|---|---|---|
| §0 Glossary | Add **Ask AI**, **Panel**, **Modal**, **Health Signals**, **Mission Feed**, **Command Palette**, **Mini-Graph**, **Compare View**, **Design Token**, **Density**. | New binding terms introduced by NUWS v1.1. |
| §0 Glossary | Clarify **AI Action** (registry/developer term) vs **Ask AI** (UI term). | Two concepts previously conflated. |
| §1.2 Capability Classification | Resolve count contradiction with NUWS v1.1: **10 capability panels + 1 modal (Administration)**. | Previously this doc listed 11 CORE capabilities; NUWS listed 9. Now both agree on 10 panels. |
| §1.2 Lifecycle classification | Promote **Lifecycle from CORE-but-buried-in-Admin** to **first-class CORE panel**. | State machine is too important to hide. |
| §1.2 Administration classification | Mark Administration as **CORE-but-modal**, not CORE-as-panel. | NUWS §2.1 already implied this; codify it. |
| §1.5 Capability Definitions | Add **Lifecycle** capability definition (data model already exists; new file `lifecycle.capability.ts`). | First-class CORE panel. |
| §1.5 Capability Definitions | Activity vs Collaboration boundary explicitly codified (Activity = read-only/audit; Collaboration = write/chat/approvals). | Per NUWS §3.4. |
| §3 Widget System | Widget sizing constraints now respect NUWS §4.2 cognitive load limits (max 4 hero KPIs on first paint). | Cross-doc alignment. |
| §4.5 AI Actions UI Pattern | Rename AI Actions Panel → **Ask AI Panel** in user-facing UI. Registry/internal term remains "AI Action." | Distinguishes user-facing surface from registry concept. |
| §5 Solution Packs | Solution Pack install wizard must surface **Mission Feed** preview ("after install, you'll see…") and **tenant theming** impact. | Pack install affects dashboard surface. |
| §6 Entity Relationships | **Mini-Graph** UI requirement added (uses `EntityRelationship` model). | New UI surface; data model already supports it. |
| §7 Knowledge | **Citation chips** in AI-generated answers are mandatory UI per NUWS §2.3. | Already implied; now binding. |
| §9 Implementation Phases | EAOS-1 (Core Entity Model) frontmatter now lists **10 capability panels** instead of 9. New `LifecyclePanel.tsx` and `lifecycle.capability.ts` files. | Aligns with new capability count. |
| §9.1 SOLID | Add design-token enforcement to PR checklist (no arbitrary spacing/color/font values; tokens from NUWS §7.5/Appendix D). | Prevents design drift. |
| §10 Architectural Principles | Add **UI principles**: Entity First, Ask AI Native, Intelligence First, Progressive Disclosure, Density-Responsive, Dark-Mode-First. | Bind implementation to NUWS principles. |
| §14 Open Questions | Resolve Q1, Q3, Q10; defer Q4 (custom widget code), Q6 (embedding migration). | Status updates. |
| §14.2 New UI Questions | **All 8 RESOLVED** in v2.6. Decisions: Mission Feed = tenant-default + per-user opt-in; Mini-Graph = scrollable list v1 (graph layout P2); Compare = read-only v1; Density = global + Operations override; font = Inter only; AI Roster = dedicated `/ai-roster` route; chart library = **Tremor**; citation chips = slide-over with full-page link. | Locks implementation choices before EAOS-1/2 frontend work. |
| §11.2 File Structure | Add `/ai-roster` route + `RosterView.tsx`. Add Tremor to `package.json` notes. Add `DensityOverride` for Operations workspaces. | Reflects the 8 resolved decisions. |

---

## 0. Glossary of Terms

This document uses the following terms precisely. All future EAOS documents MUST reference this glossary rather than redefining these terms.

| Term | Definition | Used In |
|---|---|---|
| **Entity** | Any discrete object managed by NeureCore (Department, AI Employee, Facility, etc.) | Everywhere |
| **Workspace** | The 10-capability-panel + 1-modal container for an Entity. Not a page — a contract. (Updated in v2.5; was 11-capability in v2.4.) | Everywhere |
| **Capability** | One of 10 named areas that every Workspace exposes as a panel (Identity, Intelligence, Operations, Resources, Collaboration, Insights, Automation, Activity, Lifecycle, Context). Administration is a **modal**, not a capability panel. | Everywhere |
| **Panel** | The UI region that renders a Capability. A Panel contains Widgets. **One panel per Capability.** | UI layer |
| **Modal** | An overlay surface for actions not represented as a panel. Administration is the single CORE modal. | UI layer |
| **Universal Entity Property** | A property (Entity State, Ownership, Labels, Favorites, Watch, Health) that applies to ALL entities regardless of type | Everywhere |
| **Entity State** | The universal state machine every entity follows: DRAFT → PENDING_APPROVAL → ACTIVE → PAUSED → SUSPENDED → ARCHIVED → DELETED | Everywhere |
| **Entity Health** | A computed status (healthy/warning/critical) with signals, trend, and alerts for every entity | Everywhere |
| **Health Signals** | The individual metrics (error_rate, budget_usage, goal_progress, etc.) that contribute to an entity's health badge. Surfaced as an expandable sub-section within Identity (NUWS §2.1). | UI layer |
| **Ownership** | The accountability hierarchy for an entity: owner, responsibleTeam, manager, aiAssistant, createdBy, lastModifiedBy | Everywhere |
| **Labels** | Structured tags (standard + custom + priority + quarters) attached to every entity | Everywhere |
| **Widget** | A visualization of data within a Panel. One Capability may have multiple Widgets. | UI layer |
| **Module** | A backend NestJS code module (`backend/src/modules/X/`) | Backend |
| **AI Employee** | An Agent that represents a job function (Marketing Director AI, not just "agent") | Everywhere |
| **AI Action** | **(Registry/developer term.)** An invocation of AI to perform work on Entity data (ai:summary, ai:forecast, etc.). Registered in `AIActionRegistry`. | AI layer |
| **Ask AI** | **(UI term.)** The user-facing label for invoking AI capabilities. Surfaces include: Intelligence panel, Command Palette Ask-AI mode (`⌘K` then `?`), global top-bar button, persistent chat in Collaboration panel, quick-fire row in Automation panel. Distinct from "AI Action" (registry term). | UI layer |
| **AIActionRegistry** | The system of record for all AI Actions — makes them installable, discoverable, and governable | AI layer |
| **Solution Pack** | A versioned package that adds Entity subtypes, Widgets, AI Actions, and Knowledge for a vertical | Extensibility |
| **Knowledge Entry** | A single item in the Knowledge Hub (policy, SOP, playbook, FAQ, etc.) | Knowledge |
| **Knowledge Pack** | A bundle of Knowledge Entries installed as part of a Solution Pack | Extensibility |
| **Integration** | A connection to an external system (Shopify, SAP, Epic) | Integrations |
| **RAG** | Retrieval-Augmented Generation — the pipeline for answering questions from Knowledge | AI layer |
| **Mission Feed** | The dashboard-only persistent banner surfacing AI-prioritized items needing user attention (NUWS §5.4) | UI layer |
| **Command Palette** | The `⌘K` global overlay with Navigate and Ask-AI modes (NUWS §5.5) | UI layer |
| **Mini-Graph** | The 1-hop relationship slide-over opened from the workspace header (NUWS §5.6) | UI layer |
| **Compare View** | The `/compare?ids=...` route for side-by-side comparison of up to 4 entities (NUWS §5.7) | UI layer |
| **Design Token** | A binding visual primitive (color, type scale, spacing, density) defined in NUWS §7.5 | UI layer |
| **Density** | One of Compact / Default / Comfortable row-height modes (NUWS §7.5.4) | UI layer |

---

## 0b. Philosophy

**The problem with UI-driven design:** It describes what users see, not what the system *is*. UIs change every 2-3 years. A true operating system specification must outlast multiple UI generations.

**The entity-capability approach:** Define what every *thing* in NeureCore is, what it *can do*, and what *data* it manages. The UI becomes an interpretation of that data, not the definition of it.

**What NeureCore IS:**

NeureCore is an Enterprise AI Operating System. Everything in NeureCore is an **Entity**. Entities have **Capabilities**. Capabilities are satisfied by **Widgets** (visualizations) and **AI Actions** (work operations). These produce **Data**.

```
Entity
 └── Capabilities (10 per workspace)
      ├── Widgets (visualizations)
      └── AI Actions (work operations)
           └── Data (managed by entity)
```

**Document relationships:**
- This document (EAOS-implementation-plan.md) defines the **Entity model and Capabilities**.
- `daily-tools-integration-plan.md` defines the **AI Action implementations** (AI tools).
- `agent-implementation.md` defines the **agent runtime** (LangGraph, streaming).
- `new_neurecore.md` defines the **UI implementation** (pages, routes, feature flags).
- Implementation phase documents define **timelines and deliverables**.

---

## 1. The Universal Workspace Framework

### 1.1 Definition

A **Workspace** is the container for any entity in NeureCore. Every entity — whether a Department, Project, AI Employee, Customer, Asset, Manufacturing Plant, Warehouse, Hospital, Farm, or any future entity type — exists within this framework.

**The workspace is not a page. It is a contract.**

The contract states: "This entity MUST expose these 10 capabilities. Each capability MUST provide these data types. The UI MAY render them however it chooses."

### 1.2 Capability Classification

Every workspace exposes **10 capability panels** plus a single **Administration modal**. The Administration modal is CORE-present (always accessible via gear icon) but is not rendered as a panel — it opens as an overlay. This reconciles v2.4's 11-capability list with `EAOS-NUWS-principles.md` v1.1's 10-capability constitution.

| # | Capability | Classification | Surface | Meaning |
|---|---|---|---|---|
| 1 | **Identity** | **CORE** | Panel | Always present. Cannot be disabled or removed. Includes universal Entity Health badge and expandable Health Signals sub-section (NUWS §2.1). |
| 2 | **Context** | **CORE** | Panel | Always present. Cannot be disabled or removed. |
| 3 | **Intelligence** | **CORE** | Panel | Always present. Provides AI-generated summary, risks, recommendations. First panel shown above the 2-column grid (NUWS §5.1). |
| 4 | **Operations** | **CORE** | Panel | Always present. Manages work items. |
| 5 | **Resources** | **CORE** | Panel | Always present. Manages people, AI, assets, finances. |
| 6 | **Collaboration** | **CORE** | Panel | Always present. **Write surface only**: chat, approvals, comments, mentions, scheduling. (Read-only audit-grade timeline lives in Activity per NUWS §3.4.) |
| 7 | **Insights** | **CORE** | Panel | Always present. KPIs and analytics exist but may be empty. Max 4 KPIs on first paint (NUWS §4.2). |
| 8 | **Automation** | **CONTEXTUAL** | Panel | Present if entity has automations configured. Hidden when empty. |
| 9 | **Activity** | **CORE** | Panel | Always present. Read-only, audit-grade timeline. Filter chips: All / Human / AI / Workflow / State Changes (NUWS §2.9). |
| 10 | **Lifecycle** | **CORE** | Panel | Always present. Entity state machine: Draft → Pending Approval → Active → Paused → Suspended → Archived → Deleted. **First-class panel** in v2.5 — promoted from Administration (NUWS §2.10). |
| — | **Administration** | **CORE** | **Modal** | Always accessible via gear icon in workspace header. Permissions, settings, API keys, billing, audit configuration. **Not a panel.** |

**Classification rules:**
- **CORE (panel)**: Always rendered. Cannot be hidden. Empty state is valid (use one of the 6 canonical empty states per NUWS §3.1a).
- **CORE (modal)**: Always accessible via gear icon. Opens as overlay (NUWS Appendix D z-index 200). Never a tab.
- **CONTEXTUAL**: Rendered when entity has relevant data. Hidden when empty.
- **INDUSTRY-SPECIFIC**: Provided by Solution Packs. Hidden unless relevant pack installed.

### 1.3 Universal Entity Lifecycle (CORE)

Every entity in NeureCore follows a standard state machine. This is NOT buried in Administration — it is a **first-class CORE capability** exposed in the Lifecycle panel of every workspace.

**Standard Entity States:**

```
DRAFT
  ↓ (submit / deploy)
PENDING_APPROVAL
  ↓ (approve / reject)
ACTIVE
  ↓ (suspend / policy violation)
SUSPENDED
  ↓ (reactivate / archive)
ARCHIVED
  ↓ (restore / permanent delete)
DELETED
```

**State transitions apply to:**

| Entity | Draft | Pending Approval | Active | Suspended | Archived |
|---|---|---|---|---|---|
| AI Employee | ✅ (template → spawn) | ✅ (approval for new hire) | ✅ | ✅ | ✅ |
| Department | ✅ (planning) | ✅ | ✅ | ✅ | ✅ |
| Project | ✅ (proposal) | ✅ | ✅ | ✅ | ✅ |
| Customer | ✅ (lead) | ✅ | ✅ | ✅ | ✅ |
| Facility | ✅ (planned) | ✅ | ✅ | ✅ | ✅ |
| Asset | ✅ (procurement) | ✅ | ✅ | ✅ | ✅ |
| Document | ✅ (draft) | ✅ (review) | ✅ | ✅ | ✅ |
| Workflow | ✅ (design) | ✅ | ✅ | ✅ | ✅ |
| Knowledge Entry | ✅ (draft) | ✅ (moderation) | ✅ | ✅ | ✅ |

**Lifecycle State Model:**

```typescript
interface EntityLifecycle {
  state: LifecycleState;
  previousStates: LifecycleState[];    // Audit trail of all prior states
  enteredAt: DateTime;                 // When current state was entered
  enteredBy: EntityRef;               // User or AI who triggered transition
  transitions: LifecycleTransition[];    // Available transitions from current state
  autoTransitions: AutoTransition[];   // Scheduled/time-based transitions
  stateMetadata: JSON;                // State-specific data (e.g., suspension reason)
}

type LifecycleState =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "ACTIVE"
  | "SUSPENDED"
  | "ARCHIVED"
  | "DELETED";

interface LifecycleTransition {
  to: LifecycleState;
  trigger: "manual" | "automatic" | "scheduled";
  triggeredBy?: EntityRef;            // Who/what triggered (null for automatic)
  triggeredAt?: DateTime;
  approvalRequired?: boolean;
  approvalFrom?: EntityRef[];
  condition?: string;                  // e.g., "budget > 0"
}

interface AutoTransition {
  from: LifecycleState;
  to: LifecycleState;
  schedule: string;                   // Cron expression
  condition?: string;                // e.g., "days_in_state > 30"
}
```

**Lifecycle Capability in Workspace Panel:**

```
Lifecycle — [PROJECT: Q3 Marketing Campaign]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Current State: ● ACTIVE
Entered: 2026-06-15 by Marketing Director AI

Available Transitions:
  ● Suspend     → (manual, owner only)
  ● Archive     → (manual, owner only)
  ● Submit      → (if DRAFT, approval required)

State History:
  2026-06-01 DRAFT         → Sarah Chen
  2026-06-10 PENDING_APPROVAL → System (auto)
  2026-06-12 ACTIVE        → VP Marketing (approved)
  2026-06-15 (current)     → Marketing Director AI

Scheduled Transitions:
  Auto-Archive when: endDate passed + 30 days
```

### 1.4 Universal Entity Properties

These 6 properties are NOT capabilities. They are **universal properties** that apply to every entity in NeureCore. They are foundational — without them, every entity type reinvents the same concepts.

---

#### 1.4.1 Entity State

Every entity exposes a standard state field. This is the single most impactful structural addition.

```typescript
interface EntityState {
  state: UniversalState;
  subState: string;    // Entity-specific: "idle"|"busy"|"error" for AI_EMPLOYEE
  enteredAt: DateTime;
  enteredBy: EntityRef;
  availableTransitions: StateTransition[];
  stateHistory: StateHistoryEntry[];
}

type UniversalState = "DRAFT" | "ACTIVE" | "PAUSED" | "PENDING_APPROVAL" | "SUSPENDED" | "ARCHIVED" | "DELETED";

interface StateTransition {
  to: UniversalState;
  label: string;
  requiresPermission: Permission;
  requiresApproval: boolean;
  auto?: boolean;
}
```

**Sub-states by entity type:**

| Entity | Sub-states |
|---|---|
| AI_EMPLOYEE | `idle` `busy` `error` `training` `offline` |
| PROJECT | `on_track` `at_risk` `blocked` `completed` |
| DEPARTMENT | `operational` `degraded` `restructuring` |
| CUSTOMER | `active` `churning` `at_risk` `inactive` |
| FACILITY | `operational` `maintenance` `down` `closed` |
| ASSET | `running` `idle` `maintenance` `decommissioned` |
| TASK | `pending` `in_progress` `blocked` `completed` |

**Impact:** Filters, automations, AI reasoning, reporting — all become generic across entities.

---

#### 1.4.2 Ownership

Every entity exposes ownership hierarchy. Distinct from permissions.

```typescript
interface EntityOwnership {
  owner: EntityRef;              // Primary accountable
  responsibleTeam: EntityRef;     // Team accountable
  manager: EntityRef;             // Owner's manager
  aiAssistant: EntityRef;        // AI agent assigned
  createdBy: EntityRef;
  createdAt: DateTime;
  lastModifiedBy: EntityRef;
  lastModifiedAt: DateTime;
  delegatedTo: EntityRef;        // Temporary delegation
  delegationExpiresAt: DateTime;
}
```

**Impact:** Accountability, delegation workflows, AI routing decisions.

---

#### 1.4.3 Labels

First-class structured tags. Every organization invents these — make them standard.

```typescript
interface EntityLabels {
  standard: StandardLabel[];      // strategic, confidential, vip, high_risk, etc.
  custom: CustomLabel[];          // Tenant-defined
  priority?: PriorityLabel;       // p0_critical, p1_high, p2_medium, p3_low
  quarters: string[];            // ["Q3", "Q4"]
  years: string[];               // ["2026"]
}

type StandardLabel = "strategic" | "confidential" | "vip" | "high_risk" | "low_risk" | "internal_only" | "external" | "poc" | "pilot" | "production";
type PriorityLabel = "p0_critical" | "p1_high" | "p2_medium" | "p3_low";
```

**Impact:** Label-based filtering, automation triggers, AI context.

---

#### 1.4.4 Favorites and Recent

User-specific quick access to frequently visited entities.

```typescript
interface UserEntityAccess {
  userId: string;
  favorites: EntityRef[];        // Max 20 pinned entities
  recents: RecentAccess[];       // Last 50 accessed
}

interface RecentAccess {
  entity: EntityRef;
  accessedAt: DateTime;
  accessCount: number;
  lastAccessDuration: number;    // ms
}
```

**Impact:** Executives revisit the same entities daily. Reduces navigation friction.

---

#### 1.4.5 Watch / Follow

Follow entities without owning them. Personal Activity Feed.

```typescript
interface EntityWatch {
  entityId: string;
  watchers: Watcher[];          // Who is watching
}

interface Watcher {
  userId: string;
  watchedAt: DateTime;
  watchLevel: "all_changes" | "major_events" | "digest";
}

interface UserWatchPreferences {
  userId: string;
  defaultWatchLevel: WatchLevel;
  muteAll: boolean;
  notificationChannel: "in_app" | "email" | "slack";
}
```

**Impact:** Non-owners track entities. Activity Feed becomes personalized.

---

#### 1.4.6 Entity Health

Every entity exposes a computed health status.

```typescript
interface EntityHealth {
  status: HealthStatus;          // healthy | warning | critical | unknown
  signals: HealthSignal[];        // What contributed to this score
  trend: "improving" | "stable" | "declining";
  alerts: HealthAlert[];
  computedAt: DateTime;
  computedBy: "system" | "ai";
}

type HealthStatus = "healthy" | "warning" | "critical" | "unknown";

interface HealthSignal {
  name: string;                  // "error_rate", "budget_usage"
  value: number;
  threshold: number;
  status: "normal" | "warning" | "critical";
}
```

**Health signals by entity type:**

| Entity | Signals |
|---|---|
| AI_EMPLOYEE | error_rate, response_time, budget_usage, uptime |
| DEPARTMENT | budget_usage, goal_progress, open_risks, team_utilization |
| PROJECT | schedule_variance, budget_variance, open_blockers |
| FACILITY | uptime, throughput, quality_rate, incident_count |
| CUSTOMER | engagement_score, health_score, renewal_date, nps |
| ASSET | uptime, performance_vs_baseline, error_count |

**Impact:** Universal health dashboard. CEO sees AI Workforce Health, Facility Health, Project Health — all in the same framework.

---

### 1.5 Capability Definitions

#### Identity

```
Identity
├── name           (String)       — Primary identifier
├── description    (String)       — Human-readable description
├── type           (Enum)        — DEPARTMENT | PROJECT | AI_EMPLOYEE | CUSTOMER | ASSET | FACILITY | ...
├── subtype        (String?)      — Further classification (e.g., "manufacturing-plant", "retail-store")
├── icon           (String)       — Emoji or icon identifier
├── color          (String?)      — Brand color for this entity
├── state: EntityState           — Universal state (State + subState + history)
├── ownership: EntityOwnership    — Owner, team, manager, AI assistant, createdBy, modifiedBy
├── labels: EntityLabels        — Standard labels, custom labels, priority, quarters, years
├── health: EntityHealth         — Computed health status + signals
├── createdAt      (DateTime)
├── updatedAt      (DateTime)
└── metadata       (JSON)        — Type-specific extension data
```

**Note:** Entity State, Ownership, Labels, Favorites, Watch, and Health are NOT inside a specific capability — they are universal properties of every entity and appear in the Identity section of every workspace.

#### Context

```
Context
├── parent         (EntityRef?)   — Parent entity in hierarchy
├── children       (EntityRef[])  — Child entities
├── ancestors      (EntityRef[])  — Full path to root
├── siblings       (EntityRef[])  — Entities at same hierarchy level
├── location       (Location?)    — Physical or virtual location
│   ├── address    (String?)
│   ├── coordinates (GeoPoint?)
│   └── timezone  (String?)
├── relationships  (Relationship[]) — Typed connections to other entities
│   ├── type      (String)       — "operates-in", "supplies", "manages"
│   ├── target    (EntityRef)
│   └── metadata   (JSON)
├── industry       (String?)      — Industry classification
├── departmentType (String?)      — For DEPARTMENTS: "sales" | "marketing" | "hr" | ...
└── customContext  (JSON)        — Type-specific context data
```

#### Intelligence

```
Intelligence
├── summary        (AIGenerated)   — AI-generated briefing of current state
├── predictions    (Prediction[])  — Forward-looking forecasts
│   ├── metric     (String)
│   ├── forecast   (Value)
│   ├── confidence (Float)
│   └── model      (String)
├── risks          (Risk[])        — Identified risks and their severity
│   ├── title      (String)
│   ├── severity   (Enum)          — CRITICAL | HIGH | MEDIUM | LOW
│   ├── probability (Float)
│   └── mitigation (String?)
├── recommendations (Recommendation[]) — AI-suggested actions
│   ├── action     (String)
│   ├── rationale  (String)
│   ├── impact     (Float)
│   └── effort     (Enum)          — HIGH | MEDIUM | LOW
├── confidence     (Float)         — Overall AI confidence in summary
├── generatedAt    (DateTime)
├── modelVersion   (String)
└── contextUsed    (String[])      — IDs of knowledge entries used
```

#### Operations

```
Operations
├── tasks          (Task[])
├── workflows      (Workflow[])
├── projects       (Project[])
├── goals          (Goal[])
├── routines       (Routine[])     — Recurring automated operations
├── milestones     (Milestone[])
├── dependencies   (Dependency[])   — Cross-entity task dependencies
├── workload       (WorkloadSummary) — Aggregate capacity vs demand
└── calendar       (CalendarEvent[]) — Scheduled operations
```

#### Resources

```
Resources
├── humanTeam      (User[])        — Assigned human team members
├── aiTeam         (Agent[])       — Assigned AI agents
├── budget         (Budget)         — Financial resources allocated
│   ├── allocated  (Decimal)
│   ├── spent      (Decimal)
│   ├── remaining  (Decimal)
│   └── period     (String)
├── documents      (Document[])     — Attached files and content
├── assets         (Asset[])        — Equipment, inventory, real assets
├── knowledge      (KnowledgeRef[]) — Linked knowledge entries
├── integrations   (Integration[])  — Connected external systems
└── allocatedCapacity (Capacity)    — Resource capacity details
    ├── humanHoursPerWeek (Float)
    ├── aiTokenBudget (Decimal)
    └── storageQuota (Bytes)
```

#### Collaboration

```
Collaboration
├── conversations  (Conversation[]) — AI-assisted chat threads
├── meetings      (Meeting[])
│   ├── scheduled  (MeetingSlot[])
│   └── history    (Meeting[])
├── comments      (Comment[])       — Discussion threads on entities
├── approvals     (Approval[])      — Pending and completed approvals
├── notifications (Notification[])  — Alerts and reminders
├── mentions      (Mention[])       — @mentions of this entity
└── sharing       (Share[])        — Access sharing configuration
```

#### Insights

```
Insights
├── kpis          (KPI[])          — Key performance indicators
│   ├── name      (String)
│   ├── value     (Value)
│   ├── target    (Value?)
│   ├── trend     (Enum)           — UP | DOWN | STABLE
│   ├── sparkline (DataPoint[])
│   └── status    (Enum)           — ON_TRACK | AT_RISK | OFF_TRACK
├── analytics     (AnalyticsView[]) — Configurable analytics
├── reports       (Report[])        — Generated and scheduled reports
├── trends        (Trend[])         — Historical trend analysis
├── benchmarks    (Benchmark[])     — Comparison to industry/past
└── exports       (ExportConfig[])  — Available export formats
```

#### Automation

```
Automation
├── automations   (Automation[])   — Active automation rules
│   ├── name      (String)
│   ├── trigger   (Trigger)
│   ├── condition (Condition?)
│   ├── action    (Action)
│   └── status    (Enum)
├── triggers      (Trigger[])       — Event-based automation triggers
├── schedules     (ScheduledJob[])  — Time-based automation
├── integrations  (Integration[])   — External system connections
│   ├── name      (String)
│   ├── type      (String)          — "shopify", "sap", "epic"
│   ├── status    (Enum)
│   └── lastSync  (DateTime?)
└── webhooks      (Webhook[])       — Outbound event notifications
```

#### Activity

```
Activity
├── timeline      (ActivityEvent[]) — Chronological event log
│   ├── timestamp (DateTime)
│   ├── actor     (EntityRef)      — Who or what caused it
│   ├── action    (String)         — "created", "updated", "completed"
│   ├── target    (EntityRef?)     — Affected entity
│   ├── metadata  (JSON)
│   └── aiSummary (String?)        — AI interpretation of event
├── auditLog      (AuditEntry[])   — Compliance-grade audit trail
├── events        (Event[])         — System-generated events
└── alerts       (Alert[])         — System alerts and warnings
```

#### Lifecycle (NEW first-class CORE panel in v2.5)

Promoted from "buried in Administration" (v2.4) to a first-class CORE capability panel. State transitions are too important to hide behind a gear icon.

```
Lifecycle
├── currentState         (UniversalState)        — DRAFT | PENDING_APPROVAL | ACTIVE | PAUSED | SUSPENDED | ARCHIVED | DELETED
├── subState             (String?)               — Entity-specific ("on_track", "idle", "operational", "busy")
├── enteredAt            (DateTime)
├── enteredBy            (EntityRef)
├── availableTransitions (StateTransition[])     — Buttons rendered in panel (NUWS §2.10)
├── transitionRules      (TransitionRule[])      — Conditions, approvals, permissions required per transition
├── stateHistory         (StateHistoryEntry[])   — Chronological with durations
├── autoTransitions      (AutoTransition[])      — Cron + condition for system-driven transitions
├── whyNotActive         (AIGenerated?)          — LLM explanation when state ≠ ACTIVE (NUWS §2.10)
└── snapshots            (EntitySnapshot[])      — Temporal point-in-time state (Prisma temporal queries)
```

#### Administration (MODAL in v2.5 — no longer a panel)

Administration is accessed via the **gear icon in the workspace header**. It opens as a **modal** (NUWS Appendix D z-index 200), not a tab. Fields related to lifecycle state have moved to the new **Lifecycle** panel.

```
Administration (modal contents)
├── permissions   (Permission[])   — Who can access and what they can do
│   ├── principal (EntityRef)      — User, role, or team
│   ├── actions   (Permission[])   — Allowed actions
│   └── scope     (JSON)           — Scope of permission
├── settings      (Settings)        — Entity-specific configuration
├── auditConfig   (AuditConfig)    — Audit logging preferences
├── billing       (BillingInfo?)   — For billable entity types
├── apiKeys       (ApiKey[])       — API access for this entity
├── subscriptions (Subscription[])  — Active plans and add-ons
└── createdModified (Timestamps)    — Created, last-modified dates (read-only here; lifecycle lives in Lifecycle panel)
```

---

## 2. Entity Types

### 2.1 Core Entity Taxonomy

NeureCore defines these entity types out of the box:

| Entity Type | Subtypes | Examples |
|---|---|---|
| `DEPARTMENT` | corporate, retail-store, manufacturing-plant, hospital, farm, warehouse | Sales, Store NYC, Plant Detroit |
| `PROJECT` | campaign, initiative, engagement, research | Q3 Marketing Campaign, Product Launch |
| `AI_EMPLOYEE` | director, specialist, analyst, coordinator | Marketing Director AI, Sales Agent |
| `HUMAN_EMPLOYEE` | full-time, contractor, part-time | Sarah Chen, John Smith |
| `CUSTOMER` | enterprise, smb, consumer, patient, guest | Acme Corp, Patient #12345 |
| `ASSET` | equipment, vehicle, property, inventory | Forklift #12, Server Rack A |
| `FACILITY` | office, plant, warehouse, hospital, farm, store | HQ, Plant Detroit, Farm Texas |
| `VENDOR` | supplier, service-provider, integrator | Shopify, SAP, Epic |
| `PROCESS` | workflow, routine, procedure | Order Fulfillment, Onboarding |
| `KNOWLEDGE` | policy, sop, playbook, template | HR Policy #12, Sales Playbook |
| `DOCUMENT` | contract, invoice, report, presentation | Q3 Report, MSA with Acme |
| `CONTAINER` | folder, project, workspace, solution | Q3 Folder, Marketing Workspace |

### 2.2 Entity Type Registry

```typescript
interface EntityTypeDefinition {
  type: EntityType;
  subtypes: string[];                          // Allowed subtypes
  workspaceCapabilities: Capability[];         // Which of 10 capabilities are active
  requiredCapabilities: Capability[];          // Which MUST be present
  defaultCapabilities: Capability[];            // Which are on by default
  capabilityDefaults: Record<Capability, CapabilityConfig>; // Default config per capability
  fieldSchema: JsonSchema;                     // Type-specific Identity + Context fields
  kpiTemplates: KPITemplate[];                 // Suggested KPIs for this entity type
  relationshipTypes: RelationshipType[];         // What this entity can relate to
}

interface EntityTypeRegistry {
  getDefinition(type: EntityType): EntityTypeDefinition;
  getSubtypes(type: EntityType): string[];
  getCapabilities(type: EntityType): Capability[];
  getDefaultWidgets(type: EntityType, capability: Capability): WidgetDefinition[];
}
```

### 2.3 Entity Type Examples

**DEPARTMENT (Sales)**
```
Identity:     name="Sales", type=DEPARTMENT, subtype=sales, owner=VP Sales
Context:      parent=Executive, children=[AE Team, Sales Ops]
Intelligence: summary="Pipeline at $4.2M, 3 deals at risk, Q3 target 85% achieved"
Operations:   tasks=127, workflows=8, projects=5, goals=12
Resources:    humanTeam=24, aiTeam=5, budget=$2.4M
Insights:     KPIs: Revenue, Pipeline, Win Rate, Avg Deal Size, CSAT
```

**AI_EMPLOYEE (Marketing Director AI)**
```
Identity:     name="Marketing Director AI", type=AI_EMPLOYEE, owner=CEO
Context:      parent=Marketing dept, manages=["Campaign AI", "Content AI", "SEO AI"]
Intelligence: summary="3 campaigns running, $45K budget consumed, 12% CTR avg"
Operations:   activeTasks=8, delegatedTasks=34, completedThisWeek=23
Resources:    memory=2.4MB, contextWindow=128K tokens, dailyBudget=$50
Insights:     KPIs: Campaign ROI, Content Output, Lead Quality Score
```

**FACILITY (Manufacturing Plant Detroit)**
```
Identity:     name="Plant Detroit", type=FACILITY, subtype=manufacturing-plant
Context:      location={coords: [42.3314, -83.0458], timezone: "America/Detroit"}
Intelligence: summary="OEE at 87%, 2 equipment alerts, shift 2 running at 95% capacity"
Operations:   productionLines=6, activeOrders=34, downtimeIncidents=1
Resources:    workers=127, aiAgents=8, equipment=45, inventoryValue=$3.2M
Insights:     KPIs: OEE, Defect Rate, On-Time Delivery, Safety Incidents, Energy Usage
Automation:   predictive-maintenance, quality-check, inventory-reorder
```

---

## 3. The Widget Capability System

### 3.1 The 4-Layer Widget Architecture

Instead of widget categories, widgets are defined by 4 layers:

```
┌─────────────────────────────────────────────────────┐
│  WIDGET                                            │
├─────────────────────────────────────────────────────┤
│  Layer 1: CAPABILITY                               │
│  "What business need does this serve?"             │
│                                                     │
│  Layer 2: DATA SOURCE                              │
│  "What data does this capability need?"             │
│                                                     │
│  Layer 3: AGGREGATION                              │
│  "How is the data processed?"                       │
│                                                     │
│  Layer 4: VISUALIZATION                             │
│  "How is the result shown?"                         │
└─────────────────────────────────────────────────────┘
```

### 3.2 Capability → Visualization Matrix

| Capability | Data Sources | Aggregation | Visualizations |
|---|---|---|---|
| Financial Performance | Revenue, Cost, Profit, Budget, Spend | Sum, Avg, % of Budget, Variance | Card, Line Chart, Bar Chart, Gauge, Table |
| Workforce Status | Headcount, Utilization, Hours, Output | Count, Avg Utilization, % Active | Grid, Table, Heatmap, Timeline |
| Operational Efficiency | Tasks, Cycle Time, Throughput, Defects | Count, Avg, % Complete, Rate | Kanban, Gantt, Bar Chart, Table |
| AI Performance | Tokens, Cost, Tasks Completed, Quality | Sum, Avg, % Success, ROI | Card, Line Chart, Table, Gauge |
| Risk Posture | Open Risks, Severity, Probability, Mitigation | Count by Severity, Trend | Heatmap, Table, Card |
| Customer Health | NPS, CSAT, Tickets, Churn Risk | Score, Trend, Count | Gauge, Line Chart, Table |
| Predictive Forecast | Historical Data, Seasonality, Trend | 3-month, 6-month, 12-month | Line Chart, Area Chart, Table |

### 3.3 Widget Definition Schema

```typescript
interface WidgetDefinition {
  id: string;                           // Unique identifier: "financial-revenue-card"
  
  // Layer 1: Capability
  capability: WidgetCapability;         // What business need
  capabilityDomain: string;             // "financial" | "workforce" | "operational" | "ai"
  
  // Layer 2: Data Source
  dataSources: DataSourceRef[];          // Which data entities/fields
  requiredCapabilities: Capability[];   // Which workspace capabilities must exist
  
  // Layer 3: Aggregation
  aggregationType: AggregationType;     // SUM | AVG | COUNT | MIN | MAX | % | RATIO | TREND
  aggregationParams: JSON;              // Specific params (groupBy, timeRange, etc.)
  computation: string;                  // "costSum" | "taskCountByStatus" | "revenueVsTarget"
  
  // Layer 4: Visualization
  visualizations: Visualization[];       // ALL ways this capability can be shown
  defaultVisualization: Visualization;  // Which visualization is default
  
  // Sizing
  minSize: WidgetSize;
  maxSize: WidgetSize;
  defaultSize: WidgetSize;
  
  // Configuration
  configurableFields: ConfigField[];    // Which params users can change
  refreshInterval: number;              // Auto-refresh in ms (0 = manual)
  
  // Display
  title: string;                        // Default title
  subtitle: string?;                    // Optional subtitle
  icon: string?;                        // Optional icon
}

type WidgetCapability =
  | "FINANCIAL_PERFORMANCE"
  | "WORKFORCE_STATUS"
  | "OPERATIONAL_EFFICIENCY"
  | "AI_PERFORMANCE"
  | "RISK_POSTURE"
  | "CUSTOMER_HEALTH"
  | "PREDICTIVE_FORECAST"
  | "DOCUMENT_MANAGEMENT"
  | "KNOWLEDGE_ACCESS"
  | "COLLABORATION"
  | "AUTOMATION_STATUS"
  | "COMPLIANCE_STATUS"
  | "INVENTORY_STATUS"
  | "QUALITY_METRICS";

type Visualization =
  | "CARD"           // Single value with trend
  | "LINE_CHART"     // Time series
  | "BAR_CHART"      // Categorical comparison
  | "GAUGE"          // Single metric vs target
  | "TABLE"          // Tabular data
  | "HEATMAP"        // 2D density
  | "KANBAN"         // Status columns
  | "GANTT"          // Timeline
  | "GRID"           // Multi-card layout
  | "SPARKLINE"      // Inline trend
  | "PERCENTAGE_BAR" // Progress bar
  | "STATUS_BADGE";  // Colored status indicator

interface DataSourceRef {
  entity: EntityType;           // Which entity type
  field: string;               // Which field path
  requiredPermission: Permission; // READ | WRITE | ADMIN
}
```

### 3.4 Widget Examples by Capability

**Financial Performance (same capability, 4 visualizations):**
```
Widget ID: financial-revenue
Capability: FINANCIAL_PERFORMANCE
Data Source: CostRecord.revenue, Task.completedValue
Aggregation: SUM over timeRange

Visualizations:
├── CARD     → "Revenue This Month: $847,293 ↑12%"
├── LINE     → 12-month revenue trend
├── BAR      → Revenue by department
└── GAUGE    → Revenue vs target ($1.2M)
```

**AI Performance (same capability, 4 visualizations):**
```
Widget ID: ai-performance
Capability: AI_PERFORMANCE
Data Source: Agent.dailyCost, Agent.tasksCompleted, Agent.roi
Aggregation: SUM, AVG, RATIO

Visualizations:
├── CARD     → "AI Cost Today: $127.47"
├── LINE     → AI cost over time
├── TABLE    → Per-agent cost breakdown
└── GAUGE    → ROI vs budget allocation
```

---

## 4. AI Actions System

### 4.1 Definition

Every workspace MUST expose AI Actions. These are not Widgets — they are work operations that invoke AI agents to perform tasks on the workspace's data.

**AI Actions are NeureCore's signature collaboration model: Human initiates, AI executes, Human reviews.**

**Note:** Standard AI Actions are implemented as tools in the AI tool registry (see `daily-tools-integration-plan.md` phases C-F). Entity-specific AI Actions are additional tools registered by Solution Packs.

### 4.2 Standard AI Actions (All Workspaces)

These actions are available on every workspace:

| Action | Description | Output |
|---|---|---|
| `ai:summary` | Generate an AI summary of the workspace state | Text summary + key highlights |
| `ai:risks` | Identify risks and concerns | List of risks with severity |
| `ai:recommend` | Suggest next best actions | Ranked action list with rationale |
| `ai:forecast` | Predict future state | Forecast values with confidence intervals |
| `ai:optimize` | Find optimization opportunities | Optimization suggestions with impact |
| `ai:analyze` | Perform deep analysis | Analysis report with findings |
| `ai:explain` | Explain a metric or trend | Plain-English explanation |
| `ai:delegate` | Assign work to AI agents | Task creation + agent assignment |
| `ai:report` | Generate a structured report | Formatted report document |
| `ai:workflow` | Create or modify a workflow | Workflow definition |

### 4.3 Entity-Specific AI Actions

Beyond standard actions, each entity type provides specialized actions:

**DEPARTMENT:**
```
ai:department:rebalance-workload   → Redistribute tasks across team members
ai:department:headcount-forecast   → Predict staffing needs
ai:department:budget-optimization  → Suggest budget reallocation
```

**AI_EMPLOYEE:**
```
ai:agent:performance-review        → Generate performance summary
ai:agent:context-briefing          → Prepare context for next task
ai:agent:memory-summary            → Summarize agent's knowledge state
```

**FACILITY (Manufacturing Plant):**
```
ai:facility:oee-analysis          → Analyze OEE factors
ai:facility:maintenance-prediction → Predict equipment failures
ai:facility:quality-report         → Generate quality control report
```

**CUSTOMER:**
```
ai:customer:health-score           → Calculate customer health score
ai:customer:churn-risk             → Assess churn probability
ai:customer:next-best-action       → Recommend engagement strategy
```

### 4.4 AI Action Invocation

```typescript
interface AIActionRequest {
  action: string;                    // "ai:summary", "ai:forecast", etc.
  workspaceId: string;               // Target workspace entity
  workspaceType: EntityType;
  parameters?: Record<string, unknown>; // Action-specific params
  context?: {
    includeHistory: boolean;         // Include recent activity
    includeKnowledge: boolean;        // Include relevant knowledge
    includeRelated: boolean;          // Include related entities
  };
  outputPreference?: {
    format: "text" | "json" | "report" | "chart";
    verbosity: "brief" | "standard" | "detailed";
  };
}

interface AIActionResponse {
  action: string;
  status: "completed" | "in_progress" | "failed";
  output: unknown;                   // Action-specific output
  metadata: {
    model: string;
    tokensUsed: number;
    durationMs: number;
    confidence: number;
    citations?: string[];            // Knowledge entries used
    errors?: string[];
  };
}
```

### 4.5 Ask AI UI Pattern (UI surface for AI Actions)

> **Naming convention (v2.5):** "AI Action" remains the **registry/developer term** (entry in `AIActionRegistry`). The **user-facing surface** is labeled **"Ask AI"**. This avoids confusing users who would otherwise see two different "Actions" concepts (Quick Actions vs AI Actions).

Every workspace exposes AI capabilities through **three coordinated Ask AI surfaces** (NUWS §2.6 + §5.5):

1. **Intelligence panel** — streaming summary, risks, recommendations (the primary deep-dive surface)
2. **Command Palette Ask-AI mode** (`⌘K` then `?`) — ambient AI for navigation-augmented queries
3. **Automation panel quick-fire row** — one-click actions like "Summarize", "Find Risks", "Forecast"

Plus a **persistent "Ask AI" button** in the global top bar.

**Quick-fire Ask AI row (Automation panel):**

```
┌─────────────────────────────────────────────────────┐
│  Ask AI                                       [⚙]  │
├─────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────┐   │
│  │ 💬 Ask anything about this workspace...      │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  Quick Actions                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ Summary  │ │ Find Risk│ │ Forecast  │          │
│  └──────────┘ └──────────┘ └──────────┘          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ Optimize │ │ Analyze  │ │ Explain   │          │
│  └──────────┘ └──────────┘ └──────────┘          │
│                                                     │
│  Recent Actions                                     │
│  • Generated Q3 Summary (2 min ago)                │
│  • Found 3 risks in pipeline (1 hour ago)           │
│  • Forecasted Q4 revenue (3 hours ago)              │
│                                                     │
│  [View all actions →]                               │
└─────────────────────────────────────────────────────┘
```

**Ask AI UX rules (binding, per NUWS §2.3 + §2.6):**
- Streaming responses are mandatory (never block).
- Inline citation chips are mandatory on any answer drawing from Knowledge.
- Confidence shown as color-coded thermometer (NUWS §7.5.2).
- 👍/👎 feedback on every output.
- Last-generated timestamp visible.

### 4.6 AI Action Registry

AI Actions are **installable, discoverable, and governable**. The `AIActionRegistry` is the system of record for every AI Action available in NeureCore — analogous to how `EntityTypeRegistry` is the system of record for entity types.

**Why a formal registry:**
- Solution Packs can register new AI Actions
- Actions can be discovered via capability and entity type filters
- Governance: cost, permissions, and timeout are centrally enforced
- Reusability: same action used across different entity types

**AIActionDefinition Schema:**

```typescript
interface AIActionDefinition {
  // Identity
  id: string;                          // "ai:summary", "ai:department:rebalance-workload"
  name: string;                        // "Generate Summary"
  description: string;                  // "Creates an AI summary of the entity's current state"

  // Classification
  category: AIActionCategory;          // INTELLIGENCE | ANALYSIS | OPTIMIZATION | EXECUTION | REPORTING
  capability: Capability;               // Which capability this action belongs to
  tags: string[];                     // ["summary", "briefing", "status"]

  // Eligibility
  supportedEntities: EntityType[];     // Which entity types can use this action
  requiredCapabilities: Capability[];   // Entity must have these capabilities
  requiredPermissions: Permission[];    // User must have these permissions to invoke

  // Dependencies
  requiredKnowledge: KnowledgeType[];  // Which knowledge types improve this action
  requiredIntegrations: string[];      // Which integrations must be connected
  requiresStreaming: boolean;           // Does this action support SSE streaming

  // Execution
  inputSchema: JsonSchema;             // Zod schema for action parameters
  outputSchema: JsonSchema;           // Zod schema for action output
  timeoutMs: number;                  // Max execution time (default: 60000)
  maxRetries: number;                // Retry count on failure (default: 2)

  // Cost governance
  costModel: AICostModel;             // How this action is priced
  tokenBudget: number;               // Estimated token cost per invocation

  // Lifecycle
  version: string;                   // Semantic version
  status: "draft" | "stable" | "deprecated";
  deprecates: string[];             // IDs of older versions this replaces

  // Metadata
  author: string;                   // Who created this action
  documentationUrl: string;         // Link to usage docs
  examples: AIActionExample[];       // Usage examples
}

type AIActionCategory =
  | "INTELLIGENCE"    // Summaries, predictions, insights
  | "ANALYSIS"        // Deep dives, root cause, explanations
  | "OPTIMIZATION"    // Efficiency improvements, recommendations
  | "EXECUTION"       // Task creation, delegation, automation
  | "REPORTING";     // Reports, exports, summaries

interface AICostModel {
  type: "per_invocation" | "per_token" | "included_in_tier";
  tokensEstimate: number;              // Estimated tokens per call
  tierRequired: Tier;                // STARTER | GROWTH | PRO | ENTERPRISE
}

interface AIActionExample {
  title: string;                     // "Generate a department summary"
  parameters: Record<string, unknown>; // Example parameters
  outputPreview: string;             // Short example output
}
```

**Registry Operations:**

```typescript
interface AIActionRegistry {
  // Discovery
  getAll(): AIActionDefinition[];                          // All registered actions
  getById(id: string): AIActionDefinition | undefined;    // Lookup by ID
  getByEntity(entityType: EntityType): AIActionDefinition[];  // Actions for entity type
  getByCapability(capability: Capability): AIActionDefinition[]; // Actions for capability
  getByCategory(category: AIActionCategory): AIActionDefinition[];

  // Filtering
  getAvailable(entityType: EntityType, permissions: Permission[], tier: Tier): AIActionDefinition[];

  // Governance
  validateInvocation(actionId: string, userPermissions: Permission[], tier: Tier): ValidationResult;
  estimateCost(actionId: string): CostEstimate;

  // Lifecycle
  register(action: AIActionDefinition): void;
  deprecate(actionId: string, supersededBy: string): void;
  update(actionId: string, patch: Partial<AIActionDefinition>): void;
}

interface ValidationResult {
  allowed: boolean;
  reason?: string;                  // Why blocked (missing permission, tier, integration)
  missingPermissions?: Permission[];
  missingIntegrations?: string[];
}

interface CostEstimate {
  estimatedTokens: number;
  estimatedLatencyMs: number;
  tierRequired: Tier;
}
```

**Built-in Standard Actions (Registry Entries):**

| ID | Name | Category | Entities | Capability | Cost Model |
|---|---|---|---|---|---|
| `ai:summary` | Generate Summary | INTELLIGENCE | * | Intelligence | per_token |
| `ai:risks` | Find Risks | ANALYSIS | * | Intelligence | per_token |
| `ai:recommend` | Recommend Actions | OPTIMIZATION | * | Intelligence | per_token |
| `ai:forecast` | Forecast | INTELLIGENCE | * | Intelligence | per_token |
| `ai:optimize` | Optimize | OPTIMIZATION | * | Intelligence | per_token |
| `ai:analyze` | Analyze | ANALYSIS | * | Intelligence | per_token |
| `ai:explain` | Explain | ANALYSIS | * | Intelligence | per_token |
| `ai:delegate` | Delegate Work | EXECUTION | * | Operations | per_token |
| `ai:report` | Generate Report | REPORTING | * | Insights | per_token |
| `ai:workflow` | Create Workflow | EXECUTION | * | Automation | per_token |
| `ai:department:rebalance-workload` | Rebalance Workload | OPTIMIZATION | DEPARTMENT | Operations | per_token |
| `ai:agent:performance-review` | Performance Review | ANALYSIS | AI_EMPLOYEE | Insights | per_token |
| `ai:facility:oee-analysis` | OEE Analysis | ANALYSIS | FACILITY:manufacturing-plant | Insights | per_token |
| `ai:customer:health-score` | Customer Health | INTELLIGENCE | CUSTOMER | Intelligence | per_token |

**How Solution Packs Register Actions:**

```typescript
// In a Solution Pack's extensions:
{
  aiActionExtensions: [
    {
      id: "ai:retail:inventory-alert",
      name: "Inventory Alert",
      category: "OPTIMIZATION",
      supportedEntities: ["FACILITY:retail-store"],
      requiredIntegrations: ["shopify"],
      costModel: { type: "per_token", tokensEstimate: 500, tierRequired: "PRO" },
      // ... full AIActionDefinition fields
    }
  ]
}

// On pack install → ActionRegistry.register() is called
// On pack uninstall → ActionRegistry.deprecate() is called
```

**SOLID Notes for AIActionRegistry:**
- `AIActionRegistry` is a singleton (stateless, like `EntityTypeRegistry`)
- Each `AIActionDefinition` is a value object — immutable after registration
- `getAvailable()` implements ISP: caller only sees fields they need (entity, permissions, tier)
- `validateInvocation()` enforces DIP: registry validates, action execution doesn't

---

## 5. Solution Packs (Vertical Extensions)

### 5.1 Solution Pack Definition

A **Solution Pack** is a versioned package that extends the EAOS. It does NOT modify core capabilities — it adds industry-specific Entity Subtypes, Widgets, AI Actions, Knowledge, and Integrations.

**What a Solution Pack provides (extending, not replacing):**

| Extension | What It Adds | Classification |
|---|---|---|
| Entity Subtype | `FACILITY:manufacturing-plant` | Industry-specific Entity |
| Widget Extension | OEE visualization, defect rate heatmap | Industry-specific Widget |
| AI Action Extension | `ai:facility:oee-analysis` | Industry-specific AI Action |
| Knowledge Pack | 50 pre-populated SOPs, playbooks | Industry-specific Knowledge |
| Integration | SAP connector, Epic connector | Industry-specific Integration |

1. **Entity Type Extensions** — New subtypes (e.g., `FACILITY:manufacturing-plant`)
2. **Capability Extensions** — New capabilities or enhanced defaults
3. **Widget Extensions** — New capability→visualization combinations
4. **AI Action Extensions** — New entity-specific actions
5. **Knowledge Packs** — Pre-populated knowledge entries
6. **Workflow Templates** — Pre-built automation flows
7. **Integration Connectors** — External system connections

### 5.2 Solution Pack Schema

```typescript
interface SolutionPack {
  id: string;
  name: string;                          // "Retail", "Manufacturing", "Healthcare"
  slug: string;                          // "retail", "manufacturing", "healthcare"
  version: string;                       // "1.0.0"
  category: "VERTICAL" | "HORIZONTAL";   // Industry vs cross-industry
  description: string;
  icon: string;
  prerequisites: Prerequisites;
  
  // What this pack provides
  extensions: SolutionExtensions;
  
  // Dependencies
  requiresPacks: string[];               // Other pack slugs required
  conflictsWith: string[];               // Incompatible packs
  
  // Lifecycle
  status: "draft" | "beta" | "stable" | "deprecated";
  changelog: ChangelogEntry[];
  
  createdAt: DateTime;
  updatedAt: DateTime;
}

interface SolutionExtensions {
  entitySubtypes: EntitySubtypeDefinition[];
  capabilityOverrides: CapabilityOverride[];     // Override capability defaults
  widgetExtensions: WidgetDefinition[];           // New widgets
  aiActionExtensions: AIActionDefinition[];      // New actions
  knowledgePacks: KnowledgePack[];               // Pre-populated knowledge
  workflowTemplates: WorkflowTemplate[];
  integrationDefinitions: IntegrationDefinition[];
  kpiTemplates: KPITemplate[];
}

interface EntitySubtypeDefinition {
  entityType: EntityType;
  subtype: string;                              // "manufacturing-plant"
  label: string;                                // "Manufacturing Plant"
  icon: string;
  capabilityOverrides: CapabilityOverride[];
  fieldSchema: JsonSchema;                      // Additional Identity/Context fields
  defaultWidgets: WidgetPlacement[];             // Default widget layout
  suggestedIntegrations: string[];              // Suggested integration types
}
```

### 5.3 Initial Solution Packs

| Pack | Category | Entity Subtypes Added | Widgets Added | AI Actions Added |
|---|---|---|---|---|
| **Corporate Services** | HORIZONTAL | — | 5 financial, 4 workforce | 8 department-specific |
| **Retail** | VERTICAL | FACILITY:retail-store, CUSTOMER:shopper | 6 retail KPIs, 4 inventory | 12 retail-specific |
| **Manufacturing** | VERTICAL | FACILITY:manufacturing-plant, ASSET:production-line | 8 OEE, 6 quality | 15 manufacturing-specific |
| **Healthcare** | VERTICAL | FACILITY:hospital, CUSTOMER:patient | 7 clinical KPIs, 5 operational | 20 healthcare-specific |
| **Logistics** | VERTICAL | FACILITY:warehouse, ASSET:vehicle | 6 logistics KPIs, 5 fleet | 12 logistics-specific |

### 5.4 Installing a Solution Pack

```
Tenant installs "Retail Pack"
         ↓
System validates:
  ✓ Tier requirement (PRO or ENTERPRISE)
  ✓ No conflicting packs installed
  ✓ Required integrations available
         ↓
Atomic install:
  1. Register entity subtype: FACILITY:retail-store
  2. Extend capabilities for retail-store entities
  3. Register 6 new retail widgets
  4. Register 12 new AI actions
  5. Create knowledge entries (return policies, playbooks)
  6. Register workflow templates (order fulfillment, restock)
  7. Register integration definitions (Shopify, Square)
         ↓
Pack is now part of the EAOS. Tenant can create retail-store entities.
```

---

## 6. Entity Relationships & Navigation

### 6.1 The Entity Graph

All entities exist in a typed graph:

```
CEO (HUMAN_EMPLOYEE)
  └── manages
        ├── CFO (HUMAN_EMPLOYEE)
        │     └── manages
        │           └── Finance Department (DEPARTMENT)
        │                 ├── contains → 5 AI Agents (AI_EMPLOYEE)
        │                 ├── contains → 12 Humans (HUMAN_EMPLOYEE)
        │                 └── contains → 34 Active Projects (PROJECT)
        │                       └── Project Q3 Campaign (PROJECT)
        │                             └── contains → Tasks, Workflows
        │
        └── COO (HUMAN_EMPLOYEE)
              └── manages
                    ├── Sales Department (DEPARTMENT)
                    │     └── FACILITY: Store NYC (FACILITY:retail-store)
                    │           └── contains → Inventory (ASSET)
                    │
                    └── Plant Detroit (FACILITY:manufacturing-plant)
                          └── contains → Production Line 1 (ASSET:production-line)
```

### 6.2 Universal Entity Navigation

Any entity can navigate to any related entity without knowing the type:

```typescript
interface EntityNavigation {
  // Navigate to related entities by relationship type
  navigateTo(direction: "up" | "down" | "sibling", relationship?: string): EntityRef[];
  
  // Get all entities of a type connected to this entity
  getConnectedEntities(type: EntityType, maxDepth?: number): EntityRef[];
  
  // Get the full ancestor path
  getAncestry(): EntityRef[];
  
  // Get all children (recursive)
  getDescendants(): EntityRef[];
}
```

### 6.3 Cross-Entity Intelligence

The Intelligence capability aggregates data across related entities:

```
Executive Dashboard (DEPARTMENT:Executive)
Intelligence:
  ├── summary: "Company health strong. Revenue up 15% QoQ.
  │   Sales pipeline $12M. Manufacturing OEE 87%.
  │   3 risks identified in supply chain."
  ├── predictions:
  │   ├── Revenue (Q4): $4.2M ± 8%
  │   ├── Customer Churn: 3 accounts at risk
  │   └── Inventory Shortage: 4 SKUs likely
  └── recommendations:
      ├── Increase marketing spend by 10% (predicted 8% revenue lift)
      ├── Initiate supplier diversification for component X
      └── Schedule maintenance for Line 3 (predicted failure 14 days)
```

---

## 7. Knowledge Architecture

### 7.1 Knowledge Entry Structure

```typescript
interface KnowledgeEntry {
  id: string;
  tenantId: string;
  
  // Classification
  type: KnowledgeType;
  title: string;
  content: string;                   // Full text content
  contentVector: Vector;             // Embedding for semantic search
  language: string;                 // ISO 639-1
  
  // Organization
  tags: string[];
  departmentId?: string;             // Which department owns this
  entityTypes: EntityType[];         // Which entity types this applies to
  
  // Provenance
  source: "uploaded" | "ai-generated" | "imported" | "manual";
  sourceUrl?: string;
  authorId?: string;
  
  // Relationships
  relatedEntries: EntityRef[];       // Linked knowledge entries
  linkedEntities: EntityRef[];      // Entities this knowledge applies to
  
  // Lifecycle
  status: "draft" | "published" | "archived";
  version: string;
  effectiveFrom: DateTime;
  effectiveTo?: DateTime;
  
  // RAG metadata
  chunkCount: number;                // How many chunks for retrieval
  lastRetrievedAt?: DateTime;
  retrievalCount: number;
  
  createdAt: DateTime;
  updatedAt: DateTime;
}

type KnowledgeType =
  | "POLICY"        // Company policies
  | "SOP"           // Standard operating procedures
  | "PLAYBOOK"      // Domain-specific playbooks
  | "TEMPLATE"      // Document templates
  | "PROMPT"        // AI prompt templates
  | "REGULATION"    // Compliance regulations
  | "CONTRACT"      // Legal contracts
  | "REPORT"        // Generated reports
  | "DOCUMENTATION" // Technical documentation
  | "FAQ"           // Q&A pairs
  | "GUIDE"         // How-to guides
  | "BRIEFING";     // AI-generated briefings
```

### 7.2 RAG Pipeline

```
User Query or AI Action
         ↓
Query Embedding (MiniMax via LLMFactory)
         ↓
Vector Search (pgvector — cosine similarity)
  + Keyword Boost (BM25 hybrid)
         ↓
Top-K Knowledge Entries (K=10 by default)
         ↓
Context Assembly
  - Chunk entries (max 4000 tokens total)
  - Append citations
  - Mark relevance scores
         ↓
LLM Generate Response
         ↓
Response + Citations
  + "Based on: [Entry #1], [Entry #3]"
```

---

## 8. Integration Architecture

### 8.1 Integration Framework

```typescript
interface IntegrationDefinition {
  id: string;
  name: string;                    // "Shopify", "SAP", "Epic"
  category: IntegrationCategory;
  type: string;                    // "ecommerce", "erp", "ehr", "crm"
  
  // Capabilities this integration provides
  capabilities: IntegrationCapability[];
  
  // Authentication
  authType: "oauth2" | "api-key" | "webhook" | "saml";
  authConfig: AuthConfig;
  
  // Data sync
  syncTriggers: SyncTrigger[];
  syncDirection: "pull" | "push" | "bidirectional";
  
  // Entity mapping
  entityMappings: EntityMapping[];
  
  // Status
  status: "available" | "connected" | "error" | "disabled";
}

interface IntegrationCapability {
  name: string;                    // "inventory-sync", "order-sync"
  entityType: EntityType;         // Which entity this populates
  fields: MappedField[];           // Source → Destination field mappings
  syncFrequency: "realtime" | "hourly" | "daily" | "manual";
}
```

### 8.2 Out-of-the-Box Integrations

| Integration | Category | Entity Types | Capabilities |
|---|---|---|---|
| **Google Workspace** | Productivity | AI_EMPLOYEE | Email, Calendar, Drive, Sheets |
| **Shopify** | Ecommerce | CUSTOMER:shopper, FACILITY:retail-store, ASSET:inventory | Orders, Inventory, Customers |
| **SAP** | ERP | FACILITY:manufacturing-plant, ASSET:production-line | Production, Inventory, Finance |
| **Epic** | EHR | FACILITY:hospital, CUSTOMER:patient | Clinical, Scheduling, Billing |
| **Stripe** | Payments | CUSTOMER, PROJECT | Invoicing, Revenue |
| **Salesforce** | CRM | CUSTOMER, OPPORTUNITY | Contacts, Opportunities |
| **HubSpot** | Marketing | CUSTOMER, PROJECT | Marketing, Lead |
| **Slack** | Communication | * | Notifications, Alerts |
| **QuickBooks** | Accounting | FINANCE | Invoicing, Expenses |

---

## 9. Implementation Phases

### How to Read This Section

Each phase entry uses this format:

```
EXISTING CODE:
  [Module] — description of what exists
  Location: backend/src/modules/X/

SOLID REFACTORING REQUIRED:
  [Violation] — description and fix needed

NEW IMPLEMENTATION:
  [New Module] — what to build
  Extends: [existing module if any]
```

---

## 9.1 SOLID Architecture Requirements (All Phases)

**These principles apply to ALL new code and ALL refactoring:**

| Principle | Requirement |
|---|---|
| **SRP** | Each class/service has ONE reason to change. `AgentService` must be split (see §9.2). No service exceeds 300 lines without justification. |
| **OCP** | Use the Strategy pattern for widget visualizations. New visualization types added without modifying existing code. |
| **LSP** | `EntityTypeRegistry.getDefinition()` returns `EntityTypeDefinition` — subtypes are substitutable. |
| **ISP** | Split large interfaces. `IMemoryService` (5 methods) → `IMemoryStorage` + `IVectorSearch` + `IContextAssembler`. |
| **DIP** | All dependencies injected via constructors. No `new SomeClass()` inside service methods. |

**Code review checklist (enforced in PRs):**
- [ ] No class over 300 lines without documented exception
- [ ] No service instantiating dependencies with `new`
- [ ] All interfaces have a corresponding `I` prefix
- [ ] All modules use NestJS dependency injection (no manual `new`)
- [ ] **NEW in v2.5:** No arbitrary spacing/color/font values in frontend code — every visual primitive comes from `design-system/tokens.ts` (NUWS §7.5 / Principle 10.6.7)
- [ ] **NEW in v2.5:** Every new component has all 6 required states from NUWS §3.1 (loading/empty/error/offline/permission-denied/read-only)
- [ ] **NEW in v2.5:** Empty states use one of the 6 canonical illustrations from `design-system/EmptyStates/` — no bespoke empty states
- [ ] **NEW in v2.5:** Any new AI output renders streaming-by-default with citation chips and confidence thermometer (NUWS §2.3)

---

## 9.2 Critical SOLID Refactoring: AgentService Split

**VIOLATION (HIGH PRIORITY — must fix before EAOS-1):**

`AgentService` (~600 lines) handles: agent lifecycle + task assignment + department assignment + Google Drive folder creation + email alias + budget management.

**Required split:**

```
AgentService (lifecycle only)
├── create / read / update / delete / pause / resume / archive / deprecate
├── spawn from template
└── NOT: folder creation, email alias, budget

AgentDriveFolderService (NEW — single responsibility)
├── createAgentFolder()
├── getOrCreateAgentFolder()
└── Called by: AgentService after agent creation

AgentEmailService (NEW — single responsibility)
├── configureEmailAlias()
├── resolveEmailProvider()
└── Called by: AgentService after agent creation

AgentBudgetService (NEW — single responsibility)
├── allocateBudget()
├── trackUsage()
├── checkLimits()
└── Called by: AgentService + CostService
```

**Files affected:**
- `backend/src/modules/agents/agents.service.ts` — split out Drive/Email/Budget
- `backend/src/modules/agents/agents.module.ts` — import new services
- No interface changes to calling code (Facade pattern keeps API stable)

---

## 9.3 Critical SOLID Refactoring: MemoryService Split

**VIOLATION (HIGH PRIORITY — must fix before EAOS-4):**

`MemoryService` couples vector search logic with storage. `IMemoryService` has 5 methods doing too much.

**Required split:**

```
IMemoryService (interface — thin)
├── store()
├── retrieve()
├── search()
├── delete()
└── updateMetadata()

IMemoryStorage (NEW interface)
├── store(entry: MemoryEntry): Promise<void>
├── get(id: string): Promise<MemoryEntry>
├── delete(id: string): Promise<void>
└── query(filter: MemoryQuery): Promise<MemoryEntry[]>

IVectorSearch (NEW interface)
├── index(entries: MemoryEntry[]): Promise<void>
├── search(query: string, topK: number): Promise<SearchResult[]>
├── deleteFromIndex(ids: string[]): Promise<void>
└── Uses: pgvector when available, in-memory cosine fallback

MemoryService (refactored — orchestrates storage + search)
├── storage: IMemoryStorage
├── vectorSearch: IVectorSearch
├── assembleContext(): Promise<string>   // For AI actions
└── Implements: IMemoryService
```

**Files affected:**
- `backend/src/modules/memory/memory.service.ts` — split into 3 services
- `backend/src/modules/memory/interfaces/` — add new interfaces
- `backend/src/modules/tools/built-in/context.tool.ts` — update DI to use `IVectorSearch`
- `backend/src/modules/tools/built-in/chat.tool.ts` — update DI to use `IMemoryStorage`

---

## 9.4 Phase EAOS-1: Core Entity Model (4 weeks)

**Goal:** Implement the Universal Workspace Framework with entity registry and capability interfaces.

### EXISTING CODE:

| Module | What Exists | Location |
|---|---|---|
| `agents` | `Agent` model (CORE/FUNCTIONAL/EXECUTIVE/META types), agent CRUD | `modules/agents/` |
| `departments` | `Department` model (hierarchical), department CRUD | `modules/departments/` |
| `projects` | `Project` model linked to goals/depts | `modules/projects/` |
| `goals` | `Goal` model (COMPANY/DEPT/TEAM/INDIVIDUAL hierarchy) | `modules/goals/` |
| `routines` | `Routine` model with `ownerAgentId` (Phase 1 gap fix) | `modules/routines/` |
| `tenants` | `Tenant` model, onboarding | `modules/tenants/` |

**NO existing code for:** Entity Type Registry, Capability Framework, Entity Graph API

### SOLID REFACTORING REQUIRED:

1. **`DepartmentService`** — add `getAncestry()` and `getDescendants()` methods using existing `parentId` hierarchy. No structural refactor needed.

2. **`AgentService`** — split per §9.2 BEFORE EAOS-1 work begins. EAOS-1 depends on clean agent lifecycle API.

### NEW IMPLEMENTATION:

| New Module | Purpose | Extends | SOLID Notes |
|---|---|---|---|
| `entities` module | `EntityTypeRegistry`, `EntityDefinition`, typed entity CRUD | None | Registry uses Strategy pattern for entity types |
| `capabilities` module | 10 capability interfaces + default implementations | `entities` | Each capability is a separate interface |
| `entity-graph` module | Entity relationship traversal, ancestry, descendants | `entities` | Repository pattern for graph queries |

**Backend new files:**
```
backend/src/modules/entities/
├── entities.module.ts
├── entity-registry.ts          → EntityTypeRegistry (singleton, stateless)
├── entity-type.definition.ts   → EntityTypeDefinition interface
├── entity.service.ts           → CRUD orchestration
├── entity.repository.ts         → Prisma queries (tenant-isolated)
└── dto/

backend/src/modules/capabilities/
├── capabilities.module.ts
├── i-capability.ts             → Base interface for all 10 panels
├── identity.capability.ts       → Identity capability implementation (incl. Health Signals sub-data)
├── context.capability.ts        → Context capability implementation
├── intelligence.capability.ts  → Intelligence (ai:summary, ai:risks, ai:recommend)
├── operations.capability.ts     → Tasks, workflows, projects, goals, routines
├── resources.capability.ts      → Human team, AI team, budget, docs, assets
├── collaboration.capability.ts  → WRITE surface only (chat, approvals, comments, mentions)
├── insights.capability.ts       → KPIs, analytics, reports
├── automation.capability.ts     → Automations, triggers, integrations
├── activity.capability.ts       → READ-ONLY timeline, audit log (per NUWS §3.4 split)
├── lifecycle.capability.ts      → NEW in v2.5: state machine, transitions, whyNotActive, snapshots
└── administration.capability.ts → Permissions, settings (modal-only; consumed by AdministrationModal.tsx)
```

**Prisma changes:**
- NO new models for core entities (Agent, Department, Project, Goal, Routine already exist)
- New: `WorkspaceLayout` model (user's custom widget layouts per entity)
- New: `EntityRelationship` model (typed relationships between any entities)
- New: `CapabilityConfig` model (per-entity capability settings)

**Frontend new files:**
```
frontend-tenant/src/components/workspace/
├── WorkspaceShell.tsx            → Universal shell (replaces /departments/[id]/workspace)
├── WorkspaceProvider.tsx         → Context: current entity, capabilities
├── IdentityPanel.tsx             → Identity capability renderer
├── ContextPanel.tsx             → Context capability renderer
├── IntelligencePanel.tsx        → Intelligence capability renderer
└── ... (one file per capability)
```

**Refactoring existing frontend:**
- `/departments/[id]/workspace/page.tsx` (~1251 LOC) → refactor INTO WorkspaceShell + capability panels
- Extract current 9 tabs into capability panels

---

## 9.5 Phase EAOS-2: Widget System (4 weeks)

**Goal:** Implement the 4-layer widget capability system (Capability → Data Source → Aggregation → Visualization).

### EXISTING CODE:

| Module | What Exists | Location |
|---|---|---|
| `kpi/` | `KpiTile.tsx` | `frontend-tenant/src/components/kpi/` |
| `charts/` | `DonutChart`, `LineChart`, `AreaChart`, `BarChart`, `Sparkline` | `frontend-tenant/src/components/charts/` |
| `creatio/` | `KpiCard`, `EntityTable`, `DetailPanel`, `StatusBadge`, `QuickAction` | `frontend-tenant/src/components/creatio/` |
| `inspector/` | `*Inspector.tsx` files | `frontend-tenant/src/components/inspector/` |
| `workflow/` | `ReactFlowBuilder.tsx` | `frontend-tenant/src/components/workflow/` |

**NO existing code for:** Widget Registry, Widget Builder UI, Widget persistence, Widget Grid

### SOLID REFACTORING REQUIRED:

1. **Chart components** — extract a common `BaseChart` class. Current charts duplicate axis scaling, tooltip, and legend logic.

2. **KpiTile** → rename to `KpiCardWidget` and add to widget registry. Current `KpiTile` is hardcoded — must become a registered widget with configurable data source.

### NEW IMPLEMENTATION:

| New Module | Purpose | Extends | SOLID Notes |
|---|---|---|---|
| `widgets` module (backend) | Widget registry, widget definitions, aggregation engine | None | Strategy pattern for aggregations |
| Widget Grid (frontend) | Drag-drop widget layout | None | Composite pattern for widget tree |
| Widget Registry (frontend) | Client-side widget definitions | None | Registry pattern |

**Backend new files:**
```
backend/src/modules/widgets/
├── widgets.module.ts
├── widget-registry.ts             → GlobalWidgetRegistry singleton
├── widget-definition.ts           → WidgetDefinition interface
├── aggregation/
│   ├── aggregation-engine.ts     → Computes SUM, AVG, COUNT, etc.
│   ├── aggregation.factory.ts    → Strategy pattern: creates correct aggregator
│   └── aggregators/
│       ├── sum.aggregator.ts
│       ├── avg.aggregator.ts
│       ├── count.aggregator.ts
│       └── ... (each is a Strategy)
└── dto/
```

**Prisma changes:**
- `WorkspaceLayout` — already listed in EAOS-1
- No new models

**Frontend new files:**
```
frontend-tenant/src/components/widgets/
├── WidgetRegistry.ts               → All widget definitions
├── WidgetRenderer.tsx              → Selects visualization based on user preference
├── WidgetGrid.tsx                 → Drag-drop grid (react-grid-layout)
├── WidgetPicker.tsx               → Add widget modal
├── visualizations/
│   ├── Card.tsx                   → "CARD" visualization
│   ├── LineChart.tsx             → "LINE_CHART" (delegates to existing LineChart)
│   ├── BarChart.tsx              → "BAR_CHART"
│   ├── Gauge.tsx                 → "GAUGE"
│   ├── Table.tsx                 → "TABLE"
│   ├── Heatmap.tsx               → "HEATMAP"
│   ├── Kanban.tsx                → "KANBAN"
│   ├── Gantt.tsx                → "GANTT"
│   ├── Sparkline.tsx             → "SPARKLINE"
│   └── StatusBadge.tsx           → "STATUS_BADGE"
└── WidgetConfig.tsx              → Widget-specific configuration form
```

**Reuse existing components:**
- `components/charts/LineChart.tsx` → `visualizations/LineChart.tsx` imports it
- `components/charts/BarChart.tsx` → `visualizations/BarChart.tsx` imports it
- `components/kpi/KpiTile.tsx` → `visualizations/Card.tsx` imports it
- `components/creatio/KpiCard.tsx` → deprecate, move logic to `Card.tsx`

---

## 9.6 Phase EAOS-3: AI Actions System (4 weeks)

**Goal:** Implement AI Actions as first-class workspace operations backed by existing tool infrastructure.

### EXISTING CODE:

| Module | What Exists | Location | EAOS Relevance |
|---|---|---|---|
| `tools` | `StructuredToolRegistry`, `BaseStructuredTool`, 79 tools | `modules/tools/` | **HIGH** — AI Actions are tools |
| `tools/built-in/context.tool.ts` | `search_memory`, `load_drive`, `load_history`, `load_all` | Phase F | `ai:context` action |
| `tools/built-in/chat.tool.ts` | `ask`, `remember` | Phase F | `ai:ask` action |
| `tools/built-in/reports.tool.ts` | `generate`, `export_pdf` | Phase D | `ai:report` action |
| `tools/built-in/query.tool.ts` | `translate`, `execute`, `ask` | Phase E | `ai:analyze` action |
| `tools/built-in/explain.tool.ts` | `explain_rows`, `explain_aggregation` | Phase E | `ai:explain` action |
| `neurecore-tools.ts` | 66 CRUD tools | Phase 1 | Base for entity operations |

**EXISTING TOOLS → AI ACTION MAPPING:**

| AI Action | Implementation | Status |
|---|---|---|
| `ai:summary` | NEW — invokes Intelligence capability, formats as text | NEW |
| `ai:risks` | NEW — risk detection tool | NEW |
| `ai:recommend` | Extends `QueryTool` + `ExplainTool` | NEW |
| `ai:forecast` | Extends `AnalyticsService` forecasting | NEW |
| `ai:optimize` | NEW — optimization tool | NEW |
| `ai:analyze` | `QueryTool` + `ExplainTool` already exist | EXTEND |
| `ai:explain` | `ExplainTool` already exists | USE EXISTING |
| `ai:delegate` | Extends existing task creation + agent assignment | EXTEND |
| `ai:report` | `ReportsTool` already exists | USE EXISTING |
| `ai:workflow` | Extends `RoutineService` | EXTEND |

### SOLID REFACTORING REQUIRED:

1. **`StructuredToolRegistry`** — add `getByCapability(capability)` method. Current `getByCategory()` exists but category≠capability. Add new enum `ToolCapability` mapping tools to EAOS capabilities.

2. **Tool naming** — tools are named by entity (`createTask`, `listAgents`) not by EAOS action. Add `capability: WidgetCapability` field to `WidgetDefinition` and map tools to actions.

### NEW IMPLEMENTATION:

| New Module | Purpose | Extends | SOLID Notes |
|---|---|---|---|
| `ai-actions` module | `AIActionRegistry`, action execution, queue | `tools` | Decorator pattern for action registration |
| Action result store | Persist action history, outputs | `memory` | Uses existing `MemoryEntry` model |

**Backend new files:**
```
backend/src/modules/ai-actions/
├── ai-actions.module.ts
├── ai-actions.controller.ts        → POST /ai-actions/execute
├── ai-actions.service.ts            → Orchestrates action → tool → response
├── action-registry.ts              → Maps ai:summary → tools
├── action-definition.ts            → AIActionDefinition interface
├── action-queue.ts                 → Async execution queue (BullMQ or in-memory)
├── standard-actions/
│   ├── summary.action.ts           → `ai:summary` — Intelligence capability
│   ├── risks.action.ts            → `ai:risks`
│   ├── recommend.action.ts        → `ai:recommend`
│   ├── forecast.action.ts         → `ai:forecast`
│   ├── optimize.action.ts         → `ai:optimize`
│   └── (analyze, explain, delegate, report, workflow — use existing tools)
└── dto/
```

**Frontend new files:**
```
frontend-tenant/src/components/ai-actions/
├── AIActionsPanel.tsx             → Replaces any inline AI buttons
├── AIActionButton.tsx             → Individual action trigger
├── AIActionOutput.tsx             → Renders action result
├── ActionHistory.tsx              → Past actions list
└── ActionConfig.tsx              → Action-specific configuration
```

**Reuse existing:**
- `components/chat/ConversationPanel.tsx` → adapt for AI Actions panel
- `tools/built-in/*.tool.ts` → register in action registry

---

## 9.7 Phase EAOS-4: Knowledge Hub (4 weeks)

**Goal:** Implement unified knowledge management with structured RAG pipeline.

### EXISTING CODE:

| Module | What Exists | Location | EAOS Relevance |
|---|---|---|---|
| `memory` | `MemoryEntry` model (SHORT_TERM/LONG_TERM/EPISODIC), `MemoryService` with vector search, `ContextTool` (search_memory, load_drive, load_history, load_all) | `modules/memory/` | **HIGH** — foundation for knowledge |
| `integrations` | Google Drive integration, `GoogleDriveService` | `modules/integrations/` | Source for knowledge |
| `context.tool.ts` | Already has `load_drive` — loads Drive file content | Phase F | Knowledge retrieval |

**PARTIAL implementation:**
- `MemoryEntry` exists with `content` + `embedding` field (JSON-serialized float[])
- `MemoryService.search()` uses in-memory cosine similarity
- No `KnowledgeEntry` model exists
- No chunking strategy implemented
- No structured RAG pipeline

### SOLID REFACTORING REQUIRED:

1. **`MemoryService`** — MUST split per §9.3 BEFORE EAOS-4. RAG pipeline depends on clean `IVectorSearch` interface.

2. **`MemoryEntry` rename** — `MemoryEntry` is for agent memory. Knowledge Hub needs a separate `KnowledgeEntry` model. Do NOT co-mingle.

### NEW IMPLEMENTATION:

| New Module | Purpose | Extends | SOLID Notes |
|---|---|---|---|
| `knowledge` module | `KnowledgeService`, `KnowledgeController`, chunking, RAG | NEW | Single responsibility: knowledge only |
| `rag-pipeline` | `RAGPipeline` service | `knowledge` | Pipeline pattern: embed → retrieve → assemble → generate |
| Embeddings service | Generate embeddings via LLMFactory | `models` | Factory pattern for embedding providers |

**Prisma new models:**
```prisma
model KnowledgeEntry {
  id            String   @id @default(uuid())
  tenantId     String
  type         KnowledgeType  // POLICY, SOP, PLAYBOOK, TEMPLATE, PROMPT, FAQ, etc.
  title        String
  content      String           // Full text
  contentVector Unsupported("vector(1536)")?  // pgvector — replaces JSON blob
  tags         String[]
  departmentId  String?
  entityTypes  String[]         // Which entity types this applies to
  source       String           // "uploaded", "ai-generated", "imported"
  status       String @default("published")   // "draft", "published", "archived"
  version      String @default("1.0.0")
  chunkCount   Int @default(1)
  retrievalCount Int @default(0)

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([tenantId, type])
  @@index([tenantId, status])
}

model KnowledgePack {
  id            String   @id @default(uuid())
  tenantId     String
  solutionPackId String?   // If installed via solution pack
  name          String
  description   String?
  entries       KnowledgeEntry[]
  installedAt   DateTime @default(now())
}
```

**Backend new files:**
```
backend/src/modules/knowledge/
├── knowledge.module.ts
├── knowledge.controller.ts       → CRUD + search + ask
├── knowledge.service.ts           → CRUD, linking to entities
├── rag-pipeline.ts               → Full RAG: embed → retrieve → assemble → generate
├── chunker.service.ts            → Text chunking (recursive character split)
├── embeddings.service.ts          → LLMFactory.invokeEmbedding()
├── vector-store.service.ts        → pgvector operations (upsert, search, delete)
└── dto/
    ├── create-knowledge.dto.ts
    ├── search-knowledge.dto.ts
    └── rag-ask.dto.ts
```

**Reuse existing:**
- `modules/models/services/llm-factory.service.ts` → for `invokeEmbedding()`
- `modules/integrations/google/google-drive.service.ts` → `load_drive` in `ContextTool`
- `modules/memory/memory.service.ts` → AFTER split, reuse `IVectorSearch`

**Frontend new files:**
```
frontend-tenant/src/app/knowledge/
├── page.tsx                      → Knowledge Hub main page
├── search/page.tsx              → Dedicated search
└── [entryId]/page.tsx          → Single entry view

frontend-tenant/src/components/knowledge/
├── KnowledgePanel.tsx            → Capability panel for Knowledge
├── KnowledgeSearch.tsx           → Search interface
├── KnowledgeEditor.tsx          → Create/edit entries
├── KnowledgeViewer.tsx           → Entry detail
└── RAGAnswer.tsx                → RAG-generated answer with citations
```

---

## 9.8 Phase EAOS-5: Solution Pack Architecture (6 weeks)

**Goal:** Enable vertical extensions via Solution Packs.

### EXISTING CODE:

| Module | What Exists | Location | EAOS Relevance |
|---|---|---|---|
| `agent-templates` | 104 platform templates, `AgentTemplate` model with `deprecatedAt`, `supersededByTemplateId` | `modules/agent-templates/` | **HIGH** — templates are part of packs |
| `department-templates` | 9 department templates | `modules/departments/` | **HIGH** — dept templates are part of packs |
| `tiers` | Tier definitions with feature flags | `modules/tiers/` | Restricts pack access by tier |
| Frontend `/marketplace` | 3-tab marketplace page (My Agents, Templates, Connectors) | `frontend-tenant/src/app/marketplace/` | **HIGH** — UI exists |

**PARTIAL implementation:**
- Frontend marketplace page exists
- Backend has NO dedicated marketplace module
- NO solution pack model (bundle of templates + workflows + knowledge + widgets)
- NO install/uninstall lifecycle
- NO pack versioning

### SOLID REFACTORING REQUIRED:

1. **`MarketplaceController`** — does not exist. Frontend `/marketplace` calls `agent-templates` + `integrations` directly. Create a proper `MarketplaceController` with unified browse/search API.

2. **`TierService`** — add `canInstallPack(packId)` method. Current tier limits are hardcoded in service methods.

### NEW IMPLEMENTATION:

| New Module | Purpose | Extends | SOLID Notes |
|---|---|---|---|
| `solution-packs` module | `SolutionPack` CRUD, install/uninstall, validation | None | Transaction pattern for atomic install |
| `marketplace` module (backend) | Unified marketplace browse/search | `solution-packs` + `agent-templates` | Facade pattern |

**Prisma new models:**
```prisma
model SolutionPack {
  id            String   @id @default(uuid())
  slug          String   @unique
  name          String
  version       String   @default("1.0.0")
  category      String   // "VERTICAL" | "HORIZONTAL"
  description   String
  icon          String
  tierRequired  String   @default("PRO")
  status        String   @default("draft")  // "draft", "beta", "stable", "deprecated"
  installedAt   DateTime?
  installedById String?
  
  extensions    Json     // Full extensions object (subtypes, widgets, actions, etc.)
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([slug])
  @@index([status])
}
```

**Backend new files:**
```
backend/src/modules/solution-packs/
├── solution-packs.module.ts
├── solution-packs.controller.ts    → browse, install, uninstall, validate
├── solution-packs.service.ts      → Atomic install with rollback
├── pack-validator.ts              → Tier check, dependency check, conflict check
├── pack-applier.ts                → Applies extensions: creates entities, registers widgets, etc.
├── pack-uninstaller.ts             → Clean removal with data migration options
└── dto/

backend/src/modules/marketplace/
├── marketplace.module.ts          → Combines packs + templates + integrations
├── marketplace.controller.ts       → Unified browse/search API
└── marketplace.service.ts         → Aggregates from solution-packs + agent-templates
```

**Reuse existing:**
- `agent-templates.controller.ts` → already handles platform template browsing
- `department-templates` → already handles dept template browsing
- Frontend `/marketplace/page.tsx` → extend with 5 more tabs

**Frontend new files:**
```
frontend-tenant/src/app/marketplace/
├── page.tsx                      → 8-tab marketplace (extend existing 3)
├── solutions/page.tsx           → Solution pack browse
├── solutions/[slug]/page.tsx    → Pack detail + install
├── solutions/install/page.tsx   → Install wizard
├── workflows/page.tsx           → Workflow template browse
├── knowledge-packs/page.tsx    → Knowledge pack browse
├── widgets/page.tsx             → Widget pack browse
└── themes/page.tsx             → Theme browse
```

---

## 9.9 Phase EAOS-6: Vertical Solution Packs (8-12 weeks)

**Goal:** Build first industry-specific solution packs.

### NO EXISTING CODE FOR:
- Retail pack, Manufacturing pack, Healthcare pack — entirely new

### Implementation:

Each pack is a **data pack + configuration**. No new code modules — packs are installed as data.

**Pack structure (JSON configuration installed into existing models):**

```
Retail Pack v1.0.0
├── Entity Subtypes:
│   └── FACILITY:retail-store
│       └── Widgets: ["sales-card", "inventory-heatmap", "customer-nps-gauge"]
├── AI Actions: [ai:store:inventory-alert, ai:store:visual-merchandising, ...]
├── Knowledge Pack: [Return Policy #1, Store Playbook, ...]
├── Workflow Templates: [New Employee Onboarding]
└── Integrations: [Shopify, Square]
```

**Effort per pack:** 8-10 weeks each (knowledge content creation is the bottleneck, not code)

---

## 10. Key Architectural Principles

### 10.1 Entity First, UI Second

The database schema defines entities and capabilities. The UI interprets them. If the UI is rebuilt, the entity model remains.

### 10.2 Capabilities Are Universal

The 10 capabilities apply to every entity. A retail store and a hospital have the same workspace structure — only the data differs.

### 10.3 Widgets Are Composable

Any capability can render in any visualization. Users configure their view; the system provides the data.

### 10.4 AI Actions Are Entry Points

AI is not a widget. AI Actions are how humans engage AI to work on entity data. The output may become a widget, a document, or a task.

### 10.5 Solution Packs Extend, Not Fork

Each pack adds subtypes, widgets, and actions. It does not create a separate product. The core EAOS remains identical regardless of installed packs.

### 10.6 UI Principles (NEW in v2.5)

These UI principles are binding. Every implementation decision traces back to at least one of them. Detailed contract is in `EAOS-NUWS-principles.md` v1.1; this section names them.

| # | Principle | One-line rule |
|---|---|---|
| 10.6.1 | **Entity First** | Every UI surface interprets entities; the entity model is the source of truth. UI is disposable; entities are not. |
| 10.6.2 | **Ask AI Native** | AI is present in every section, every list, every form. Not a separate module. "Ask AI" surfaces appear at five locations (Intelligence, Command Palette, global top bar, Collaboration chat, Automation quick-fire). |
| 10.6.3 | **Intelligence First** | Every workspace opens with AI-generated understanding (Intelligence panel), not raw data. The first thing users see is *understood* data. |
| 10.6.4 | **Progressive Disclosure** | Simple first, advanced on request. Max 4 KPIs on first paint. Max 5–7 actions visible. 3-click maximum to expert controls. |
| 10.6.5 | **Density-Responsive** | Users choose Compact / Default / Comfortable. The choice is persisted per user. No fixed density. |
| 10.6.6 | **Dark-Mode-First** | Dark mode is P0. Charts are designed for dark mode, not auto-inverted. System preference is the default. |
| 10.6.7 | **Tokenized Design** | No arbitrary spacing, color, or font values. Every visual primitive comes from NUWS §7.5 design tokens. PR review rejects violations. |
| 10.6.8 | **Activity vs Collaboration Split** | Activity is read-only/audit-grade. Collaboration is write surface. Never conflate (NUWS §3.4). |
| 10.6.9 | **Lifecycle Visible** | Every entity exposes its state machine in a first-class panel. State transitions are buttons, not dropdowns. "Why not active?" is an AI prompt, not a buried setting. |
| 10.6.10 | **Work Finds the User** | Mission Feed, notifications, and Watched entities surface pending work without navigation. Users should never need to search for what's next. |

---

## 11. File Structure

### Backend
```
backend/src/modules/
├── entities/                    # EAOS-1
│   ├── entities.module.ts
│   ├── entities.controller.ts
│   ├── entities.service.ts
│   ├── entity-registry.ts       # Entity type definitions
│   ├── capabilities/            # 10 capability interfaces
│   └── dto/
│
├── widgets/                     # EAOS-2
│   ├── widgets.module.ts
│   ├── widget-registry.ts
│   ├── widget-engine.ts        # Aggregation + visualization selection
│   └── dto/
│
├── ai-actions/                 # EAOS-3
│   ├── ai-actions.module.ts
│   ├── ai-actions.controller.ts
│   ├── ai-actions.service.ts
│   ├── standard-actions/       # 10 standard implementations
│   └── dto/
│
├── knowledge/                  # EAOS-4
│   ├── knowledge.module.ts
│   ├── knowledge.controller.ts
│   ├── knowledge.service.ts
│   ├── embeddings.service.ts
│   ├── rag-pipeline.ts
│   └── dto/
│
├── solution-packs/             # EAOS-5
│   ├── solution-packs.module.ts
│   ├── pack-registry.ts
│   ├── pack-applier.ts
│   └── dto/
│
└── predictions/               # EAOS-7
    ├── predictions.module.ts
    ├── predictions.service.ts
    └── forecast-models/
```

### Frontend
```
frontend-tenant/src/
├── app/
│   └── entity/[type]/[id]/
│       └── page.tsx            # Universal entity workspace
│
├── components/
│   ├── workspace/
│   │   ├── WorkspaceShell.tsx  # 10-capability layout
│   │   ├── IdentityPanel.tsx
│   │   ├── ContextPanel.tsx
│   │   ├── IntelligencePanel.tsx
│   │   ├── OperationsPanel.tsx
│   │   ├── ResourcesPanel.tsx
│   │   ├── CollaborationPanel.tsx
│   │   ├── InsightsPanel.tsx
│   │   ├── AutomationPanel.tsx
│   │   ├── ActivityPanel.tsx
│   │   └── AdministrationPanel.tsx
│   │
│   ├── ai-actions/
│   │   ├── AIActionsPanel.tsx
│   │   ├── AIActionButton.tsx
│   │   └── AIActionOutput.tsx
│   │
│   ├── widgets/
│   │   ├── WidgetRegistry.tsx
│   │   ├── WidgetRenderer.tsx   # Selects visualization
│   │   ├── visualizations/
│   │   │   ├── Card.tsx
│   │   │   ├── LineChart.tsx
│   │   │   ├── BarChart.tsx
│   │   │   ├── Gauge.tsx
│   │   │   ├── Table.tsx
│   │   │   └── ...
│   │   └── WidgetGrid.tsx
│   │
│   └── knowledge/
│       ├── KnowledgePanel.tsx
│       ├── KnowledgeSearch.tsx
│       └── RAGAnswer.tsx
```

---

## 11. File Structure (Existing vs New)

**Legend:** `[NEW]` = must be created | `[EXTEND]` = exists, must be modified | `[REUSE]` = exists as-is

### 11.1 Backend Module Structure

```
backend/src/modules/
├── [EXTEND] agents/                    # EAOS-1 refactor: split AgentService → AgentDriveFolder + AgentEmail + AgentBudget
│   ├── agents.service.ts               # AFTER SPLIT: lifecycle only (~200 lines)
│   ├── agents.controller.ts
│   ├── agent-drive-folder.service.ts   # [NEW] from split
│   ├── agent-email.service.ts          # [NEW] from split
│   └── agent-budget.service.ts         # [NEW] from split
│
├── [EXTEND] memory/                    # EAOS-4 refactor: split IMemoryService → IStorage + IVectorSearch
│   ├── memory.service.ts               # AFTER SPLIT: orchestrates storage + search
│   ├── interfaces/
│   │   ├── i-memory-storage.ts       # [NEW] interface from split
│   │   └── i-vector-search.ts        # [NEW] interface from split
│   ├── memory-storage.service.ts       # [NEW] implements IStorage
│   └── vector-search.service.ts       # [NEW] implements IVectorSearch (pgvector)
│
├── [EXTEND] tools/                     # EAOS-3: add ToolCapability field, getByCapability()
│   ├── tools.module.ts
│   ├── structured-tool.registry.ts     # EXTEND: add getByCapability()
│   ├── built-in/                      # REUSE: all existing tools
│   │   ├── neurecore-tools.ts        # 66 CRUD tools
│   │   ├── email.tool.ts             # Phase C
│   │   ├── documents.tool.ts          # Phase D
│   │   ├── reports.tool.ts            # Phase D
│   │   ├── query.tool.ts             # Phase E
│   │   ├── explain.tool.ts            # Phase E
│   │   ├── context.tool.ts            # Phase F
│   │   └── chat.tool.ts               # Phase F
│
├── [NEW] entities/                    # EAOS-1
│   ├── entities.module.ts
│   ├── entities.controller.ts
│   ├── entities.service.ts
│   ├── entity-registry.ts             # EntityTypeRegistry singleton
│   ├── entity-type.definition.ts
│   ├── entity.repository.ts
│   └── dto/
│
├── [NEW] capabilities/                # EAOS-1
│   ├── capabilities.module.ts
│   ├── i-capability.ts
│   ├── identity.capability.ts
│   ├── context.capability.ts
│   ├── intelligence.capability.ts
│   ├── operations.capability.ts
│   ├── resources.capability.ts
│   ├── collaboration.capability.ts
│   ├── insights.capability.ts
│   ├── automation.capability.ts
│   ├── activity.capability.ts
│   └── administration.capability.ts
│
├── [NEW] entity-graph/               # EAOS-1
│   ├── entity-graph.module.ts
│   ├── entity-graph.service.ts        # Ancestry, descendants, traversal
│   └── entity-graph.repository.ts
│
├── [NEW] widgets/                    # EAOS-2
│   ├── widgets.module.ts
│   ├── widget-registry.ts
│   ├── widget-definition.ts
│   ├── aggregation/
│   │   ├── aggregation-engine.ts
│   │   └── aggregators/              # Strategy: Sum, Avg, Count, etc.
│   └── dto/
│
├── [NEW] ai-actions/                 # EAOS-3
│   ├── ai-actions.module.ts
│   ├── ai-actions.controller.ts        # POST /ai-actions/execute
│   ├── ai-actions.service.ts
│   ├── action-registry.ts
│   ├── action-queue.ts
│   └── standard-actions/
│       ├── summary.action.ts
│       ├── risks.action.ts
│       ├── recommend.action.ts
│       ├── forecast.action.ts
│       └── optimize.action.ts
│
├── [NEW] knowledge/                   # EAOS-4
│   ├── knowledge.module.ts
│   ├── knowledge.controller.ts
│   ├── knowledge.service.ts
│   ├── rag-pipeline.ts
│   ├── chunker.service.ts
│   ├── embeddings.service.ts
│   ├── vector-store.service.ts
│   └── dto/
│
├── [NEW] solution-packs/              # EAOS-5
│   ├── solution-packs.module.ts
│   ├── solution-packs.controller.ts
│   ├── solution-packs.service.ts
│   ├── pack-validator.ts
│   ├── pack-applier.ts
│   └── pack-uninstaller.ts
│
├── [NEW] marketplace/                 # EAOS-5
│   ├── marketplace.module.ts
│   ├── marketplace.controller.ts       # Unified browse/search
│   └── marketplace.service.ts
│
├── [EXTEND] agent-templates/          # EAOS-5: add pack-aware query
├── [EXTEND] department-templates/     # EAOS-5: add pack-aware query
├── [EXTEND] departments/              # EAOS-1: add getAncestry(), getDescendants()
├── [EXTEND] integrations/             # REUSE: Google, Brevo, existing adapters
├── [EXTEND] models/                  # REUSE: LLMFactory — add invokeEmbedding()
├── [EXTEND] analytics/                # EAOS-7: add forecasting models
├── [EXTEND] routines/                # REUSE: LangGraph routine engine
├── [EXTEND] workflows/               # REUSE: DAG orchestration
├── [EXTEND] goals/                   # REUSE: OKR hierarchy
├── [EXTEND] projects/               # REUSE: project management
├── [EXTEND] finance/                 # REUSE: invoicing
├── [EXTEND] costs/                   # REUSE: cost tracking
├── [EXTEND] audit/                   # REUSE: audit logging
├── [EXTEND] observability/           # REUSE: telemetry
├── [EXTEND] notifications/          # REUSE: notifications
├── [EXTEND] governance/              # REUSE: approvals
├── [EXTEND] tenants/                # REUSE: tenant management
├── [EXTEND] auth/                  # REUSE: authentication
├── [EXTEND] events/                # REUSE: WebSocket gateway
└── [EXTEND] tiers/                  # EAOS-5: add canInstallPack()

EXISTING — NO CHANGE NEEDED:
  ├── agents/langgraph/              # REUSE: LangGraph agent runtime
  ├── agents/streaming/              # REUSE: SSE streaming
  ├── ai-gateway/                   # REUSE: OpenClaw + LangSmith
  ├── connectors/                    # REUSE: CRM adapters
  └── onboarding/                   # REUSE: onboarding state machine
```

### 11.2 Frontend File Structure

```
frontend-tenant/src/
├── app/
│   ├── [EXTEND] command-center/     # EAOS-1: replace with 8-pillar + Mission Feed (NEW in v2.5)
│   │                                # Mission Feed at top, then 8-pillar grid below
│   │                                # Mission Feed = tenant-level default + per-user opt-in (§14.2 Q1)
│   ├── [NEW] ai-roster/            # NEW in v2.6: dedicated route (per §14.2 Q6 + Pricing §0a)
│   │   ├── page.tsx                # Full AI Roster management surface
│   │   └── [aiEmployeeId]/page.tsx # Redirect to /entity/ai-employee/{id}
│   ├── [EXTEND] marketplace/         # EAOS-5: add 5 tabs (Solutions, Workflows, etc.)
│   ├── [NEW] entity/[type]/[id]/   # EAOS-1: universal entity workspace
│   │   ├── page.tsx                # WorkspaceShell — renders 10 capability panels
│   │   ├── graph/page.tsx          # NEW in v2.5: full mini-graph (P2; v1 = slide-over only)
│   │   └── compare/page.tsx        # NEW in v2.5: /compare?ids=... route (read-only v1 per §14.2 Q3)
│   ├── [NEW] knowledge/            # EAOS-4
│   │   ├── page.tsx
│   │   ├── search/page.tsx
│   │   └── [entryId]/page.tsx      # Target of citation chip "Open full page" link (§14.2 Q8)
│   └── [EXTEND] departments/[id]/workspace/  # EAOS-1: refactor INTO entity workspace
│
├── components/
│   ├── [NEW] workspace/
│   │   ├── WorkspaceShell.tsx       # Universal shell — two-tier tab system, left icon rail
│   │   ├── WorkspaceProvider.tsx    # React context: current entity + capabilities
│   │   ├── IdentityPanel.tsx        # Includes Health Signals sub-section (NEW in v2.5)
│   │   ├── ContextPanel.tsx
│   │   ├── IntelligencePanel.tsx    # Streaming + citation chips + sticky Do-First CTA
│   │   ├── OperationsPanel.tsx      # Kanban default + per-task AI delegation
│   │   ├── ResourcesPanel.tsx       # Human + AI team rendered with identical card component
│   │   ├── CollaborationPanel.tsx   # Persistent AI chat input docked at top
│   │   ├── InsightsPanel.tsx        # Max 4 KPIs first paint, inline-expand, per-KPI Explain
│   │   ├── AutomationPanel.tsx      # Workflow thumbnails, AI quick-fire row
│   │   ├── ActivityPanel.tsx        # Filter chips, AI 🤖 badges
│   │   ├── LifecyclePanel.tsx       # NEW in v2.5: state badge, transition buttons, timeline, whyNotActive
│   │   └── AdministrationModal.tsx  # Renamed in v2.5: gear-icon modal (NOT a panel)
│   │
│   ├── [NEW] mission-feed/          # NEW in v2.5
│   │   ├── MissionFeed.tsx          # Dashboard-only persistent banner
│   │   └── MissionItem.tsx          # Severity icon + breadcrumb + 3 actions
│   │
│   ├── [NEW] command-palette/       # Refactored in v2.5
│   │   ├── CommandPalette.tsx       # ⌘K overlay, Navigate + Ask-AI modes
│   │   ├── NavigateMode.tsx
│   │   ├── AskAIMode.tsx            # Streaming answer inline
│   │   └── useCommandPalette.ts
│   │
│   ├── [NEW] mini-graph/            # NEW in v2.5
│   │   ├── MiniGraph.tsx            # Slide-over from workspace header
│   │   └── FullGraph.tsx            # /entity/[type]/[id]/graph page
│   │
│   ├── [NEW] compare/               # NEW in v2.5
│   │   └── CompareView.tsx          # /compare?ids=... page (read-only v1 per §14.2 Q3)
│   │
│   ├── [NEW] ai-roster/             # NEW in v2.6
│   │   ├── RosterGrid.tsx           # Filterable grid (by dept/role/status/sub-state)
│   │   ├── RosterGroup.tsx          # Group-by-template grouping
│   │   ├── RosterRow.tsx            # Avatar, name, sub-state, credits consumed, lifecycle controls
│   │   └── CostAttribution.tsx      # Per-AI-Employee credit consumption this period
│   │
│   ├── [NEW] citation/              # NEW in v2.6
│   │   ├── CitationChip.tsx         # Superscript inline chip rendering
│   │   └── CitationSlideOver.tsx    # Slide-over with "Open full page" link (§14.2 Q8)
│   │
│   ├── [NEW] density/               # NEW in v2.6
│   │   ├── DensityProvider.tsx      # Global density context (Compact/Default/Comfortable)
│   │   ├── useDensity.ts            # Hook: returns current density + per-workspace override
│   │   └── DensityToggle.tsx        # UI: 3-state segmented control in user settings
│   │
│   ├── [NEW] charts/                # Locked in v2.6: Tremor (per §14.2 Q7)
│   │   ├── TremorProvider.tsx       # Wraps <TremorRaw> with theme/density tokens
│   │   ├── KpiCard.tsx              # Tremor <Card> wrapper, dark-mode-aware
│   │   ├── LineAreaChart.tsx        # Tremor <AreaChart>
│   │   ├── BarChart.tsx             # Tremor <BarChart>
│   │   └── DonutChart.tsx           # Tremor <DonutChart>
│   │
│   ├── [DEPRECATE] charts/ (old)    # Phase out in v2.6 — replace imports with Tremor wrappers
│   │   └── (legacy) LineChart.tsx, BarChart.tsx, AreaChart.tsx, Sparkline.tsx
│   │
│   ├── [RENAME] ai-actions/ → ask-ai/  # v2.5: directory rename to reflect UI terminology
│   │   ├── AskAIPanel.tsx           # Was AIActionsPanel
│   │   ├── QuickActionButton.tsx    # Was AIActionButton
│   │   ├── AskAIOutput.tsx          # Was AIActionOutput (streaming, citation chips)
│   │   ├── ActionHistory.tsx
│   │   └── ActionConfig.tsx
│   │
│   ├── [NEW] widgets/
│   │   ├── WidgetRegistry.ts         # Widget definitions (12 visualization types)
│   │   ├── WidgetRenderer.tsx       # Selects visualization: Card | Line | Bar | Gauge | Table | Heatmap | Kanban | Gantt | Sparkline | Badge
│   │   ├── WidgetGrid.tsx           # Drag-drop layout (react-grid-layout)
│   │   ├── WidgetPicker.tsx         # Add widget modal
│   │   ├── WidgetConfig.tsx         # Widget-specific config form
│   │   └── visualizations/
│   │       ├── Card.tsx            # Imports: components/kpi/KpiTile.tsx
│   │       ├── LineChart.tsx        # Imports: components/charts/LineChart.tsx
│   │       ├── BarChart.tsx         # Imports: components/charts/BarChart.tsx
│   │       ├── Gauge.tsx            # [NEW]
│   │       ├── Table.tsx            # [NEW] based on DataTable
│   │       ├── Heatmap.tsx          # [NEW]
│   │       ├── Kanban.tsx            # Imports: existing kanban logic
│   │       ├── Gantt.tsx            # [NEW]
│   │       ├── Sparkline.tsx         # Imports: components/charts/Sparkline.tsx
│   │       └── StatusBadge.tsx       # Imports: components/creatio/StatusBadge.tsx
│   │
│   ├── [NEW] design-system/         # NEW in v2.5: bind NUWS §7.5 design tokens
│   │   ├── tokens.ts                # Spacing, color, type scale, density exports
│   │   ├── themes.ts                # Light + dark mode + per-tenant overrides
│   │   ├── EmptyStates/             # 6 canonical illustrations (NUWS §3.1a)
│   │   │   ├── FirstRun.tsx
│   │   │   ├── NoData.tsx
│   │   │   ├── NoPermission.tsx
│   │   │   ├── NoResults.tsx
│   │   │   ├── IntegrationDisconnected.tsx
│   │   │   └── AIGeneratedNothing.tsx
│   │   └── DensityProvider.tsx      # Compact / Default / Comfortable context
│   │
│   ├── [EXTEND] kpi/               # EAOS-2: rename KpiTile → Card in widget registry
│   ├── [EXTEND] charts/            # EAOS-2: replace legacy charts with Tremor wrappers (locked in v2.6 §14.2 Q7)
│   ├── [EXTEND] creatio/           # EAOS-2: KpiCard → deprecate, use Card.tsx
│   ├── [EXTEND] inspector/         # EAOS-1: split into capability panels
│   ├── [EXTEND] forms/             # EAOS-2: widget config forms
│   ├── [EXTEND] layout/            # EAOS-1: TopBar, IconRail (now left icon rail per NUWS §5.1)
│   │
│   └── [NEW] knowledge/
│       ├── KnowledgePanel.tsx        # Capability panel
│       ├── KnowledgeSearch.tsx
│       ├── KnowledgeEditor.tsx
│       ├── KnowledgeViewer.tsx
│       └── RAGAnswer.tsx            # With mandatory citation chips (NUWS §2.3)
│
└── services/
    ├── [NEW] entity.service.ts     # Entity CRUD (wraps API)
    ├── [NEW] widget.service.ts     # Widget registry client
    ├── [NEW] ai-actions.service.ts # Renamed mentally to ask-ai.service.ts in v2.5; registry name unchanged
    ├── [EXTEND] agents.service.ts # Keep for agent-specific ops
    ├── [EXTEND] knowledge.service.ts # [NEW] — or create new if separate from memory
    ├── [NEW] mission-feed.service.ts # NEW in v2.5 (tenant-default + per-user opt-in per §14.2 Q1)
    ├── [NEW] compare.service.ts     # NEW in v2.5 (read-only v1 per §14.2 Q3)
    ├── [NEW] ai-roster.service.ts   # NEW in v2.6: AI Roster queries (by dept/role/status/template)
    ├── [NEW] density.service.ts     # NEW in v2.6: persists per-user density preference
    └── [EXTEND] marketplace.service.ts # EAOS-5: extend for packs
```

### 11.2a Key Dependencies (locked in v2.6)

| Package | Version target | Purpose | Locked in |
|---|---|---|---|
| `@tremor/react` | latest stable | Charts, KPI cards, dark-mode native | §14.2 Q7 |
| `lucide-react` | latest stable | Icon library (NUWS §7.5.5) | NUWS v1.1 |
| `react-grid-layout` | ^1.4 | Drag-drop widget grid | EAOS-2 |
| `dagre` (deferred) | — | Mini-Graph layout — NOT included in v1 (P2 per §14.2 Q2) | §14.2 Q2 |
| `react-flow` | ^11 | Workflow builder in Automation panel | Existing |
| `zod` | ^3 | Schema validation (entity, AI action, knowledge) | Existing |
| `next-themes` | latest stable | Dark-mode-default theme switcher | NUWS §7.5.3 |

### 11.3 Prisma Schema Changes

```prisma
# NEW MODELS (EAOS-1 through EAOS-5)

# ============================================================================
# UNIVERSAL ENTITY PROPERTIES (EAOS-1) — Apply to ALL entities
# ============================================================================

# Every entity has a lifecycle entry
model EntityState {
  id          String @id @default(uuid())
  tenantId    String
  entityId    String
  entityType  String   // DEPARTMENT | PROJECT | AI_EMPLOYEE | CUSTOMER | FACILITY | ...
  state       String   @default("DRAFT")  // UniversalState
  subState    String?  // Entity-specific: "idle", "on_track", etc.
  enteredAt   DateTime @default(now())
  enteredById String?
  @@unique([entityId])
  @@index([tenantId, entityType])
  @@index([tenantId, state])
}

# State transition history (immutable audit log)
model StateHistory {
  id          String @id @default(uuid())
  tenantId    String
  entityId    String
  entityType  String
  fromState   String
  toState     String
  timestamp   DateTime @default(now())
  byId        String?   // User or AI who triggered
  reason      String?
  @@index([tenantId, entityId])
}

# Ownership hierarchy (every entity has an owner)
model EntityOwnership {
  id                  String @id @default(uuid())
  tenantId            String
  entityId             String @unique
  entityType           String
  ownerId              String
  ownerType            String   // "user" | "ai_employee"
  responsibleTeamId   String?
  managerId           String?
  aiAssistantId       String?
  delegatedToId       String?
  delegationExpiresAt  DateTime?
  createdById         String
  createdAt           DateTime @default(now())
  lastModifiedById    String
  lastModifiedAt      DateTime @updatedAt
  @@index([tenantId])
  @@index([tenantId, ownerId])
}

# Labels (standard + custom + priority per entity)
model EntityLabel {
  id          String @id @default(uuid())
  tenantId    String
  entityId    String
  entityType  String
  labelType   String   // "standard" | "custom" | "priority" | "quarter" | "year"
  labelName   String   // "strategic" | "p1_high" | "Q3" | "2026"
  labelValue  String?  // For custom labels
  color       String?  // Optional display color
  createdAt   DateTime @default(now())
  @@index([tenantId, entityId])
  @@index([tenantId, labelType, labelName])
}

# Favorites (user-specific, stored per-user)
model UserFavorite {
  id          String @id @default(uuid())
  userId      String
  tenantId    String
  entityId    String
  entityType  String
  pinnedAt    DateTime @default(now())
  @@unique([userId, entityId])
  @@index([userId])
}

# User's recent entity access
model UserRecentAccess {
  id          String @id @default(uuid())
  userId      String
  tenantId    String
  entityId    String
  entityType  String
  accessedAt  DateTime @default(now())
  accessCount Int      @default(1)
  lastDurationMs Int?
  @@index([userId, accessedAt])
}

# Watch/Follow (who is watching what)
model EntityWatcher {
  id          String @id @default(uuid())
  entityId    String
  entityType  String
  userId      String
  watchLevel  String   @default("major_events")  // all_changes | major_events | digest
  watchedAt   DateTime @default(now())
  @@unique([entityId, userId])
  @@index([userId])
}

# Entity health computation
model EntityHealth {
  id          String @id @default(uuid())
  tenantId    String
  entityId    String @unique
  entityType  String
  status      String @default("unknown")  // healthy | warning | critical | unknown
  trend       String @default("stable")      // improving | stable | declining
  signals     Json   // [{name, value, threshold, status}]
  alerts      Json   // [{id, severity, message, suggestedAction}]
  computedAt  DateTime @default(now())
  computedBy  String   @default("system")  // system | ai
  @@index([tenantId, status])
}

# ============================================================================
# EAOS-1: Entity Relationships + Workspace Layout
# ============================================================================


model EntityRelationship {
  id          String @id @default(uuid())
  tenantId    String
  sourceId   String
  sourceType String   // EntityType enum value
  targetId   String
  targetType String
  relationType String  // "owns", "manages", "operates-in", "supplies"
  metadata    Json?
  createdAt   DateTime @default(now())
  @@index([tenantId, sourceId, sourceType])
  @@index([tenantId, targetId, targetType])
}

model WorkspaceLayout {
  id          String @id @default(uuid())
  tenantId    String
  userId      String
  entityId    String
  entityType  String
  widgets     Json   // [{widgetId, position, size, config}]
  isDefault   Boolean @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  @@unique([userId, entityId])
  @@index([tenantId])
}

model CapabilityConfig {
  id          String @id @default(uuid())
  tenantId    String
  entityId    String
  capability  String   // Capability name
  enabled     Boolean @default(true)
  config      Json    // Per-capability settings
  @@unique([entityId, capability])
  @@index([tenantId])
}

# EAOS-4: Knowledge Hub
model KnowledgeEntry {
  id            String @id @default(uuid())
  tenantId     String
  type         String   // POLICY, SOP, PLAYBOOK, TEMPLATE, PROMPT, FAQ, etc.
  title        String
  content      String
  contentVector Unsupported("vector(1536)")?  // pgvector — replaces JSON blob
  tags         String[]
  departmentId  String?
  entityTypes  String[]
  source       String   @default("manual")
  status       String   @default("published")  // draft, published, archived
  version      String   @default("1.0.0")
  chunkCount   Int      @default(1)
  retrievalCount Int     @default(0)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  @@index([tenantId, type])
  @@index([tenantId, status])
}

model KnowledgePack {
  id             String @id @default(uuid())
  tenantId      String
  solutionPackId String?
  name          String
  description   String?
  installedAt   DateTime @default(now())
}

# EAOS-5: Solution Packs
model SolutionPack {
  id            String @id @default(uuid())
  slug          String @unique
  name          String
  version       String @default("1.0.0")
  category      String   // VERTICAL | HORIZONTAL
  description   String
  icon          String
  tierRequired  String @default("PRO")
  status        String @default("draft")  // draft, beta, stable, deprecated
  extensions    Json    // Full extensions object
  installedAt   DateTime?
  installedById String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  @@index([slug])
  @@index([status])
}

# MODELS TO ADD FIELDS (migrations, no model changes)

# Agent — add fields for AI Workforce Profiles (EAOS-1)
# agent.dailyCost, agent.weeklyRoi, agent.workloadPct, agent.confidenceScore, agent.healthStatus

# AgentTemplate — already has version, deprecatedAt, supersededByTemplateId (Phase 1 gaps)
```

---

## 12. SOLID Compliance Checklist

**All EAOS code MUST pass this checklist before merge:**

### SRP (Single Responsibility)
- [ ] No service class exceeds 300 lines
- [ ] `AgentService` is split into `AgentService` + `AgentDriveFolderService` + `AgentEmailService` + `AgentBudgetService`
- [ ] `MemoryService` is split into `MemoryService` + `MemoryStorageService` + `VectorSearchService`
- [ ] Each capability (Identity, Context, etc.) is its own class

### OCP (Open/Closed)
- [ ] New visualization types added via Strategy pattern, not modifying existing visualization classes
- [ ] New aggregation types (SUM, AVG, etc.) added via Strategy, not modifying `AggregationEngine`
- [ ] New entity subtypes registered in `EntityTypeRegistry`, not hardcoded in service methods

### LSP (Liskov Substitution)
- [ ] `EntityTypeDefinition` subtypes are substitutable for base type
- [ ] `IVectorSearch` has pgvector implementation AND in-memory fallback — both satisfy the interface
- [ ] All tool implementations satisfy `IStructuredTool` — no implementation-specific assumptions in calling code

### ISP (Interface Segregation)
- [ ] `IMemoryService` split: `IMemoryStorage` + `IVectorSearch` + `IContextAssembler`
- [ ] `IAgentService` not required by tools that only need email or drive functionality
- [ ] `IWidgetDefinition` does not include visualization-specific methods

### DIP (Dependency Inversion)
- [ ] All service dependencies injected via constructors (no `new Class()` inside service methods)
- [ ] `IAgentsService`, `IMemoryStorage`, `IVectorSearch` injected into `ContextTool` constructor
- [ ] Widget aggregators created via `AggregatorFactory` (Strategy), not instantiated directly

### Code Review Enforcement
```typescript
// PR template must include:
// 1. Lines of code per file (reject if any file > 300 lines)
// 2. No `new ClassName()` inside service methods (grep check)
// 3. Interface prefix `I` on all interfaces
// 4. Each capability has its own file
```

---

## 13. Why This Is an Operating System

### 12.1 What Makes Something an Operating System?

| OS Property | EAOS Implementation |
|---|---|
| **Manages hardware** | Manages entities, data, AI agents |
| **Provides abstraction** | Entity → Capability → Widget hides complexity |
| **Has a file system** | Knowledge Hub + Document management |
| **Supports multitasking** | Multiple AI agents per workspace |
| **Has a process scheduler** | Workflow + Routine execution engine |
| **Provides security** | RBAC + capability-based permissions |
| **Is extensible** | Solution Packs add new entity types |
| **Has an API** | Full REST + WebSocket API |

### 12.2 What This Enables

**Adding Healthcare:**
1. Define `FACILITY:hospital` subtype
2. Add clinical KPIs (readmission rate, length of stay)
3. Add 25 healthcare AI actions
4. Register Epic + HL7 integrations
5. Add 50 clinical knowledge entries
6. Result: NeureCore now manages hospitals. Zero changes to the 10-capability framework.

**Adding Agriculture:**
1. Define `FACILITY:farm` subtype
2. Add agricultural KPIs (yield, crop health, irrigation)
3. Add IoT sensor integrations
4. Add weather + satellite data sources
5. Result: NeureCore manages farms. Same framework.

**Adding Logistics:**
1. Define `FACILITY:warehouse`, `ASSET:vehicle`
2. Add fleet tracking + route optimization
3. Add supply chain AI actions
4. Result: NeureCore manages logistics. Still the same.

---

## 14. Open Questions

### 14.1 Status (updated in v2.5)

| # | Question | Status | Resolution |
|---|---|---|---|
| 1 | Solution Pack pricing | **OPEN** | — |
| 2 | Prediction model ownership | **OPEN** | — |
| 3 | Knowledge moderation | **RESOLVED** | Default = auto-publish with 24-hour soft-delete window. Admins can require approval per-Knowledge-type. |
| 4 | Widget custom code | **OPEN** | — (now P1: design system + sandbox story needed) |
| 5 | AI Action cost attribution | **RESOLVED** | Tenant pays for all AI Actions invoked by their users. Pack publishers do NOT bear compute cost. Attribution logged per `AIActionInvocation` row for revenue-share accounting. |
| 6 | Embedding storage migration | **OPEN** | Deferred — not blocking EAOS-1/2/3. |
| 7 | Routine ↔ Workflow | **RESOLVED** | Stay separate. Routines = LLM-driven autonomous tasks (LangGraph). Workflows = human-designed DAGs. UI surfaces them as one "Routines + Workflows" tab in Operations but with distinct edit affordances. |
| 8 | Agent service split timing | **RESOLVED** | Confirmed: AgentService split (§9.2) MUST complete before EAOS-1. Tracked in EAOS-0.5 prep work. |
| 9 | MemoryService split timing | **RESOLVED** | Confirmed: MemoryService split (§9.3) MUST complete before EAOS-4. |
| 10 | WorkspaceShell vs current pages | **RESOLVED** | Coexist during transition. `/departments/[id]/workspace` redirects to `/entity/department/{id}` with a 30-day 301 + banner. New routes ship immediately. |

### 14.2 New Open Questions (raised by v2.5 UI work)

| # | Question | Status | Resolution |
|---|---|---|---|
| 1 | Mission Feed personalization | **RESOLVED** | **Tenant-level default + per-user opt-in for v1.** Tenant admins set the default prioritization policy (by department, by role, by severity). Individual users can opt in to a personalized feed (opt-in = "show my watched entities + my owned entities first"). Compute cost is bounded: personalization is a re-rank of the same tenant-level candidates, not a separate model run. |
| 2 | Mini-Graph performance | **RESOLVED** | **Scrollable list for v1.** When relationship count > 50, render as grouped lists (parent / children / operates-in / collaborates-with / assigned-to) per NUWS §5.6 mockup — no graph layout library required. Graph layout (dagre / elk) is **P2**; revisit only if user research shows executives actively want a visual graph. |
| 3 | Compare View scope | **RESOLVED** | **Read-only for v1.** No bulk-edit operations ("apply this KPI definition to all selected"). Edit affordances would require careful merge/conflict UX — defer to P2. v1 supports deep-linking and sharing. |
| 4 | Density toggle scope | **RESOLVED** | **Global with per-workspace overrides for Operations specifically.** User sets a global preference (Compact / Default / Comfortable). Operations workspaces may override (a finance user can lock Operations to Compact regardless of global setting). All other panels honor the global preference. Per-tenant admin default = Default. |
| 5 | Per-tenant font | **RESOLVED** | **Inter only for v1.** No tenant-uploaded fonts. Reduces font-loading performance cost, eliminates i18n text-width variability, and keeps the design system predictable. Re-evaluate after Enterprise tier ships. |
| 6 | AI Roster view | **RESOLVED** | **`/ai-roster` is a dedicated route — distinct from `/agents`.** The existing `/agents` page (entity list filtered to AI_EMPLOYEE type) is insufficient: it lacks group-by-template, status filtering, lifecycle controls, and cost attribution. New route + UI required (see Pricing §0a). Implemented in EAOS-1 frontend alongside the entity workspace. |
| 7 | Chart library (dark-mode) | **RESOLVED** | **Tremor for v1.** Tremor ships native dark-mode support, is opinionated (less custom-chart code to maintain), and is built on Recharts under the hood (preserves escape hatch for custom viz). Re-evaluate Visx only if a Solution Pack needs a visualization Tremor can't express. Lock this choice before EAOS-2 begins. |
| 8 | Citation chip source rendering | **RESOLVED** | **Slide-over with "Open full page" link.** Click a citation chip → opens the source Knowledge entry in a slide-over (right-side drawer, 480px wide). The slide-over header includes an "Open full page" link that navigates to `/knowledge/{entryId}` in a new tab. Slide-over preserves workspace context; full-page is one click away for users who want to read deeply. |
