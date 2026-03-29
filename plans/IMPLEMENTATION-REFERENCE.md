# NeureCore Paperclip Adoption — Implementation Reference

**Status**: Analysis Complete — Ready for Systematic Implementation  
**Date**: March 28, 2026  
**Design**: Full SOLID Compliance | Modular Architecture

---

## Executive Summary

This document provides a **complete feature-to-code mapping** for the 8 Paperclip features being adopted into NeureCore. It identifies:

1. **What already exists** (leverage existing code)
2. **What needs to be added** (implement new)
3. **Where each piece goes** (precise file locations)
4. **Cross-references** (link related components)

---

## 🔍 Gap Analysis: Existing vs Required

### ✅ ALREADY IMPLEMENTED (Phase 1-4)

| Component                    | Location                                                                                                                         | Status                    |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| **Agent State Machine**      | [`backend/src/modules/agents/langgraph/langgraph-official.ts`](backend/src/modules/agents/langgraph/langgraph-official.ts)       | ✅ Complete               |
| **Agent Checkpoint Service** | [`backend/src/modules/agents/langgraph/checkpoint.service.ts`](backend/src/modules/agents/langgraph/checkpoint.service.ts)       | ✅ Complete               |
| **LangSmith Tracing**        | [`backend/src/modules/ai-gateway/langsmith-tracing.service.ts`](backend/src/modules/ai-gateway/langsmith-tracing.service.ts)     | ✅ Complete               |
| **OpenClaw Gateway**         | [`backend/src/modules/ai-gateway/openclaw-gateway.service.ts`](backend/src/modules/ai-gateway/openclaw-gateway.service.ts)       | ✅ Complete               |
| **LLM Factory (cost calc)**  | [`backend/src/modules/models/services/llm-factory.service.ts`](backend/src/modules/models/services/llm-factory.service.ts:1)     | ✅ Has `calculateCost()`  |
| **ExecutionLog (expenses)**  | [`backend/prisma/schema.prisma:523`](backend/prisma/schema.prisma:523)                                                           | ✅ `costUsd` field exists |
| **ApprovalRequest model**    | [`backend/prisma/schema.prisma:631`](backend/prisma/schema.prisma:631)                                                           | ✅ Exists                 |
| **ApprovalsService**         | [`backend/src/modules/governance/services/approvals.service.ts`](backend/src/modules/governance/services/approvals.service.ts)   | ✅ CRUD + review          |
| **Notification model**       | [`backend/prisma/schema.prisma:667`](backend/prisma/schema.prisma:667)                                                           | ✅ Exists                 |
| **GovernanceRule model**     | [`backend/prisma/schema.prisma:608`](backend/prisma/schema.prisma:608)                                                           | ✅ Exists                 |
| **TenantMetric model**       | [`backend/prisma/schema.prisma:718`](backend/prisma/schema.prisma:718)                                                           | ✅ Exists                 |
| **Workflow model**           | [`backend/prisma/schema.prisma:449`](backend/prisma/schema.prisma:449)                                                           | ✅ Exists (DRAFT)         |
| **Task model**               | [`backend/prisma/schema.prisma:407`](backend/prisma/schema.prisma:407)                                                           | ✅ Exists                 |
| **Department model**         | [`backend/prisma/schema.prisma:559`](backend/prisma/schema.prisma:559)                                                           | ✅ Hierarchical           |
| **AgentExecutor Service**    | [`backend/src/modules/agents/services/agent-executor.service.ts`](backend/src/modules/agents/services/agent-executor.service.ts) | ✅ Exists                 |
| **AgentPlanner Service**     | [`backend/src/modules/agents/services/agent-planner.service.ts`](backend/src/modules/agents/services/agent-planner.service.ts)   | ✅ Exists                 |

### ❌ NOT YET IMPLEMENTED (Must Build)

| Feature                | Backend Module       | Frontend Page                   | Schema Extension                        |
| ---------------------- | -------------------- | ------------------------------- | --------------------------------------- |
| **Routines/Workflows** | `modules/routines/`  | `app/routines/page.tsx`         | Add `Routine`, `RoutineTrigger` models  |
| **Cost Tracking**      | `modules/costs/`     | `app/costs/page.tsx`            | Add `CostRecord`, `BudgetPolicy` models |
| **Unified Inbox**      | `modules/inbox/`     | `app/inbox/page.tsx`            | Add `InboxItem` model                   |
| **Approval Workflows** | Extend `governance/` | Extend `app/approvals/page.tsx` | Extend `ApprovalRequest`                |
| **Goals System**       | `modules/goals/`     | `app/goals/page.tsx`            | Add `Goal` model                        |
| **Dashboard**          | `modules/dashboard/` | Extend `app/dashboard/page.tsx` | No schema needed                        |
| **Projects**           | `modules/projects/`  | `app/projects/page.tsx`         | Add `Project` model                     |
| **Org Chart**          | `modules/org/`       | `app/org-chart/page.tsx`        | No schema needed                        |
| **Activity Feed**      | `modules/activity/`  | `app/activity/page.tsx`         | Use existing `AuditLog`                 |

---

## 📋 Feature 1: Routines/Workflows ⭐ (Priority 1)

**Synergy Score**: 90% — Extends existing `OfficialAgentGraph`

### Existing Code to Leverage:

- [`backend/src/modules/agents/langgraph/langgraph-official.ts`](backend/src/modules/agents/langgraph/langgraph-official.ts) — Core LangGraph state machine
- [`backend/src/modules/agents/langgraph/checkpoint.service.ts`](backend/src/modules/agents/langgraph/checkpoint.service.ts) — State persistence
- [`backend/src/modules/agents/streaming/agent-streaming.service.ts`](backend/src/modules/agents/streaming/agent-streaming.service.ts) — Real-time streaming

### New Files to Create:

```
backend/src/modules/routines/
├── interfaces/
│   ├── i-routine-executor.interface.ts      # IRoutineExecutor
│   └── i-routine-repository.interface.ts   # IRoutineRepository
├── dto/
│   ├── create-routine.dto.ts
│   ├── update-routine.dto.ts
│   ├── create-trigger.dto.ts
│   └── routine-run.dto.ts
├── repositories/
│   └── prisma-routine.repository.ts        # Implements IRoutineRepository
├── routine-execution.service.ts            # Implements IRoutineExecutor
├── routine-graph.ts                        # LangGraph wrapper for routines
├── webhook.controller.ts                   # POST /api/v1/webhooks/:secret
├── routines.controller.ts
└── routines.module.ts
```

### Schema Extensions (Prisma):

```prisma
model Routine {
  id                 String   @id @default(cuid())
  tenantId           String
  title              String
  description        String?
  status             RoutineStatus @default(ACTIVE)
  concurrencyPolicy  ConcurrencyPolicy @default(COALESCE)
  catchUpPolicy      CatchUpPolicy @default(SKIP_MISSED)
  assignedAgentId    String?
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
  triggers           RoutineTrigger[]
  runs               RoutineRun[]

  @@index([tenantId])
  @@index([status])
}

model RoutineTrigger {
  id               String   @id @default(cuid())
  routineId        String
  kind             TriggerKind  // SCHEDULE | WEBHOOK | EVENT
  cronExpression   String?
  webhookSecret    String?
  webhookUrl       String?
  enabled          Boolean  @default(true)
  nextRunAt        DateTime?
  lastRunAt        DateTime?
  routine          Routine  @relation(fields: [routineId], references: [id], onDelete: Cascade)

  @@index([routineId])
}

model RoutineRun {
  id             String   @id @default(cuid())
  routineId      String
  status         RunStatus @default(QUEUED)
  input          Json     @default("{}")
  output         Json?
  error          String?
  startedAt      DateTime?
  completedAt    DateTime?
  routine        Routine  @relation(fields: [routineId], references: [id])

  @@index([routineId])
}

enum RoutineStatus {
  ACTIVE
  PAUSED
  ARCHIVED
}

enum ConcurrencyPolicy {
  COALESCE
  ALWAYS_ENQUEUE
  SKIP
}

enum CatchUpPolicy {
  SKIP_MISSED
  CATCH_UP_CAPPED
}

enum TriggerKind {
  SCHEDULE
  WEBHOOK
  EVENT
}

enum RunStatus {
  QUEUED
  RUNNING
  COMPLETED
  FAILED
  CANCELLED
}
```

### Frontend:

- Create [`frontend-tenant/src/app/routines/page.tsx`](frontend-tenant/src/app/routines/page.tsx)
- Copy cron builder UI from [`Temp/paperclip-master/ui/src/pages/Routines.tsx`](Temp/paperclip-master/ui/src/pages/Routines.tsx)
- Add sidebar link: `/routines`

---

## 📋 Feature 2: Cost Tracking ⭐ (Priority 2)

**Synergy Score**: 80% — Already in LangSmith + LLMFactory

### Existing Code to Leverage:

- [`backend/src/modules/models/services/llm-factory.service.ts:1`](backend/src/modules/models/services/llm-factory.service.ts:1) — Has `calculateCost()`
- [`backend/prisma/schema.prisma:523`](backend/prisma/schema.prisma:523) — `ExecutionLog` has `costUsd`
- [`backend/src/modules/ai-gateway/langsmith-tracing.service.ts`](backend/src/modules/ai-gateway/langsmith-tracing.service.ts) — Traces LLM calls

### New Files to Create:

```
backend/src/modules/costs/
├── interfaces/
│   ├── i-cost-aggregation-provider.interface.ts
│   └── i-cost-record-repository.interface.ts
├── dto/
│   ├── cost-summary.dto.ts
│   ├── cost-timeline.dto.ts
│   └── budget-policy.dto.ts
├── repositories/
│   └── prisma-cost-record.repository.ts
├── providers/
│   └── langsmith-cost-provider.ts         # Implements ICostAggregationProvider
├── costs.service.ts                        # Orchestration
├── budget.service.ts                       # Budget enforcement
├── costs.controller.ts
└── costs.module.ts
```

### Schema Extensions (Prisma):

```prisma
model CostRecord {
  id            String   @id @default(cuid())
  tenantId      String
  agentId       String?
  departmentId  String?
  runId         String?  // Links to LangSmith run
  provider      String   // OPENAI, ANTHROPIC, MINIMAX, DEEPSEEK
  model         String
  inputTokens   Int
  outputTokens  Int
  costCents     Decimal  @db.Decimal(10, 4)
  windowStart   DateTime
  windowEnd     DateTime
  createdAt     DateTime @default(now())

  @@index([tenantId])
  @@index([agentId])
  @@index([createdAt])
  @@index([provider, model])
}

model BudgetPolicy {
  id              String   @id @default(cuid())
  tenantId        String
  name            String
  limitCents      Decimal  @db.Decimal(12, 2)
  period          BudgetPeriod @default(MONTHLY)
  scope           BudgetScope @default(TENANT)
  scopeId         String?  // departmentId or agentId if scope is not TENANT
  alertThresholds Int[]   @default([50, 75, 90]) // percentages
  action          BudgetAction @default(ALERT)
  enabled         Boolean  @default(true)
  currentSpendCents Decimal @default(0) @db.Decimal(12, 2)
  resetAt         DateTime
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([tenantId])
  @@index([scope, scopeId])
}

model BudgetIncident {
  id              String   @id @default(cuid())
  budgetPolicyId  String
  threshold       Int      // percentage triggered
  totalCents      Decimal  @db.Decimal(12, 2)
  status          IncidentStatus @default(ACTIVE)
  acknowledgedAt   DateTime?
  resolvedAt      DateTime?
  createdAt       DateTime @default(now())

  @@index([budgetPolicyId])
}

enum BudgetPeriod {
  DAILY
  WEEKLY
  MONTHLY
}

enum BudgetScope {
  TENANT
  DEPARTMENT
  AGENT
  MODEL
}

enum BudgetAction {
  ALERT
  BLOCK
  DEGRADE
}

enum IncidentStatus {
  ACTIVE
  ACKNOWLEDGED
  RESOLVED
}
```

### Frontend:

- Create [`frontend-tenant/src/app/costs/page.tsx`](frontend-tenant/src/app/costs/page.tsx)
- Copy cost breakdown UI from [`Temp/paperclip-master/ui/src/pages/Costs.tsx`](Temp/paperclip-master/ui/src/pages/Costs.tsx)
- Add sidebar link: `/costs`

---

## 📋 Feature 3: Unified Inbox ⭐ (Priority 3)

**Synergy Score**: 70% — OpenClaw Gateway ready

### Existing Code to Leverage:

- [`backend/src/modules/ai-gateway/openclaw-gateway.service.ts`](backend/src/modules/ai-gateway/openclaw-gateway.service.ts) — Has `notify()` capability
- [`backend/prisma/schema.prisma:667`](backend/prisma/schema.prisma:667) — `Notification` model exists

### New Files to Create:

```
backend/src/modules/inbox/
├── interfaces/
│   └── i-inbox-notifier.interface.ts
├── dto/
│   ├── inbox-item.dto.ts
│   └── inbox-summary.dto.ts
├── notifiers/
│   └── openclaw-inbox.notifier.ts         # Implements IInboxNotifier
├── inbox.service.ts
├── inbox.gateway.ts                        # WebSocket gateway for real-time
├── inbox.controller.ts
└── inbox.module.ts
```

### Schema Extensions (Prisma):

```prisma
model InboxItem {
  id          String      @id @default(cuid())
  tenantId    String
  userId      String
  kind        InboxKind   // APPROVAL, FAILED_TASK, AGENT_ALERT, BUDGET_ALERT, MENTION
  entityType  String      // "ApprovalRequest", "Task", "Agent", "BudgetPolicy"
  entityId    String
  title       String
  body        String?
  priority    Priority    @default(MEDIUM)
  status      InboxStatus @default(UNREAD)
  readAt      DateTime?
  archivedAt  DateTime?
  actionUrl   String?      // Deep link to action
  createdAt   DateTime    @default(now())

  @@index([tenantId, userId])
  @@index([userId, status])
  @@index([createdAt])
}

enum InboxKind {
  APPROVAL
  FAILED_TASK
  AGENT_ALERT
  BUDGET_ALERT
  MENTION
  SYSTEM
}

enum InboxStatus {
  UNREAD
  READ
  ARCHIVED
  DISMISSED
}
```

### Frontend:

- Create [`frontend-tenant/src/app/inbox/page.tsx`](frontend-tenant/src/app/inbox/page.tsx)
- Copy swipe-to-archive from [`Temp/paperclip-master/ui/src/pages/Inbox.tsx`](Temp/paperclip-master/ui/src/pages/Inbox.tsx)
- Add badge counter to sidebar (unread count)
- Add sidebar link: `/inbox`

---

## 📋 Feature 4: Approval Workflows (Priority 4)

**Synergy Score**: 85% — LangGraph interrupts + existing `ApprovalRequest`

### Existing Code to Leverage:

- [`backend/src/modules/governance/services/approvals.service.ts`](backend/src/modules/governance/services/approvals.service.ts:23) — Already has CRUD + review
- [`backend/prisma/schema.prisma:631`](backend/prisma/schema.prisma:631) — `ApprovalRequest` model exists
- [`backend/src/modules/agents/langgraph/checkpoint.service.ts`](backend/src/modules/agents/langgraph/checkpoint.service.ts) — Can persist interrupted states

### What Needs Enhancement:

**Backend Extensions:**

```
backend/src/modules/governance/
├── interfaces/
│   └── i-approval-workflow.interface.ts   # IApprovalWorkflow
├── workflows/
│   └── langgraph-approval.workflow.ts     # Human-in-the-loop via interrupts
├── approvals.controller.ts                 # Extend existing
├── approvals.service.ts                    # Extend existing
└── governance.module.ts                    # Re-export
```

**New DTOs:**

- `ApprovalRequestDto` — Extend with `kind` (BUDGET_SPEND, DATA_ACCESS, AGENT_ACTION)
- `ApprovalDecisionDto` — approve/reject with notes

**LangGraph Integration:**

```typescript
// In LangGraph agent, add approval interrupt:
.addConditionalEdges(
  "evaluate",
  (state) => (state.requiresApproval ? "requestApproval" : "proceed"),
  { requestApproval: "approvalNode", proceed: END },
)
.addNode("approvalNode", async (state) => {
  // Interrupt and wait for human approval
  await graph.invoke(state, {
    interrupt: [{ type: "approval", approverId: state.approverId }],
  });
})
```

### Frontend:

- Extend [`frontend-tenant/src/app/approvals/page.tsx`](frontend-tenant/src/app/approvals/page.tsx)
- Copy approval cards from [`Temp/paperclip-master/ui/src/pages/Approvals.tsx`](Temp/paperclip-master/ui/src/pages/Approvals.tsx)
- Add approval detail view: `/approvals/[id]`

---

## 📋 Feature 5: Goals System (Priority 5)

**Synergy Score**: 50% — LangGraph for decomposition

### New Files to Create:

```
backend/src/modules/goals/
├── interfaces/
│   └── i-goal-decomposer.interface.ts
├── dto/
│   ├── create-goal.dto.ts
│   ├── goal-tree.dto.ts
│   └── goal-progress.dto.ts
├── decomposers/
│   └── langgraph-goal-decomposer.ts      # Goal → sub-goals via LangGraph
├── goals.service.ts
├── goals.controller.ts
└── goals.module.ts
```

### Schema Extensions (Prisma):

```prisma
model Goal {
  id           String    @id @default(cuid())
  tenantId     String
  title        String
  description  String?
  level        GoalLevel // COMPANY, DEPARTMENT, TEAM, INDIVIDUAL
  status       GoalStatus @default(ACTIVE)
  progress     Int       @default(0)  // 0-100
  parentId     String?
  ownerAgentId String?
  ownerUserId  String?
  targetDate   DateTime?
  completedAt  DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  parent       Goal?     @relation("GoalHierarchy", fields: [parentId], references: [id])
  children     Goal[]    @relation("GoalHierarchy")

  @@index([tenantId])
  @@index([parentId])
  @@index([status])
}

enum GoalLevel {
  COMPANY
  DEPARTMENT
  TEAM
  INDIVIDUAL
}

enum GoalStatus {
  ACTIVE
  COMPLETED
  PAUSED
  ARCHIVED
}
```

### Frontend:

- Create [`frontend-tenant/src/app/goals/page.tsx`](frontend-tenant/src/app/goals/page.tsx)
- Create [`frontend-tenant/src/app/goals/[id]/page.tsx`](frontend-tenant/src/app/goals/page.tsx)
- Copy `GoalTree` from [`Temp/paperclip-master/ui/src/components/GoalTree.tsx`](Temp/paperclip-master/ui/src/components/GoalTree.tsx)
- Add sidebar link: `/goals`

---

## 📋 Feature 6: Dashboard (Priority 6)

**Synergy Score**: 70% — LangSmith Metrics API

### Existing Code to Leverage:

- [`backend/src/modules/ai-gateway/langsmith-tracing.service.ts`](backend/src/modules/ai-gateway/langsmith-tracing.service.ts) — Tracing data
- [`backend/prisma/schema.prisma:718`](backend/prisma/schema.prisma:718) — `TenantMetric` model
- [`frontend-tenant/src/app/dashboard/`](frontend-tenant/src/app/dashboard/) — Page already exists

### New Files to Create:

```
backend/src/modules/dashboard/
├── interfaces/
│   └── i-dashboard-metrics-provider.interface.ts
├── providers/
│   └── langsmith-dashboard.provider.ts    # Implements IDashboardMetricsProvider
├── dto/
│   ├── dashboard-summary.dto.ts
│   └── activity-timeline.dto.ts
├── dashboard.service.ts
├── dashboard.controller.ts
└── dashboard.module.ts
```

### Frontend Extensions:

- Enhance [`frontend-tenant/src/app/dashboard/page.tsx`](frontend-tenant/src/app/dashboard/page.tsx)
- Add `MetricCard` components with trend indicators
- Copy `ActivityCharts` from [`Temp/paperclip-master/ui/src/components/ActivityCharts.tsx`](Temp/paperclip-master/ui/src/components/ActivityCharts.tsx)

---

## 📋 Feature 7: Projects (Priority 7)

**Synergy Score**: 40% — Grouping mechanism

### New Files to Create:

```
backend/src/modules/projects/
├── interfaces/
│   └── i-project-manager.interface.ts
├── dto/
│   ├── create-project.dto.ts
│   └── project-summary.dto.ts
├── projects.service.ts
├── projects.controller.ts
└── projects.module.ts
```

### Schema Extensions (Prisma):

```prisma
model Project {
  id           String        @id @default(cuid())
  tenantId     String
  name         String
  description  String?
  status       ProjectStatus @default(ACTIVE)
  goalIds      String[]      @default([])
  departmentId String?
  targetDate   DateTime?
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  @@index([tenantId])
  @@index([status])
}

enum ProjectStatus {
  ACTIVE
  COMPLETED
  ARCHIVED
}
```

### Frontend:

- Create [`frontend-tenant/src/app/projects/page.tsx`](frontend-tenant/src/app/projects/page.tsx)
- Create [`frontend-tenant/src/app/projects/[id]/page.tsx`](frontend-tenant/src/app/projects/page.tsx)
- Copy project list from [`Temp/paperclip-master/ui/src/pages/Projects.tsx`](Temp/paperclip-master/ui/src/pages/Projects.tsx)
- Add sidebar link: `/projects`

---

## 📋 Feature 8: Org Chart (Priority 8)

**Synergy Score**: 30% — Primarily UI

### Existing Code to Leverage:

- [`backend/prisma/schema.prisma:559`](backend/prisma/schema.prisma:559) — `Department` model is hierarchical
- [`backend/prisma/schema.prisma:361`](backend/prisma/schema.prisma:361) — `Agent` model has `departmentId`

### New Files to Create:

```
backend/src/modules/org/
├── interfaces/
│   └── i-org-hierarchy-provider.interface.ts
├── dto/
│   └── org-node.dto.ts
├── providers/
│   └── department-org-provider.ts         # Builds tree from Department
├── org.service.ts
├── org.controller.ts
└── org.module.ts
```

### Frontend:

- Create [`frontend-tenant/src/app/org-chart/page.tsx`](frontend-tenant/src/app/org-chart/page.tsx)
- Copy SVG org chart from [`Temp/paperclip-master/ui/src/pages/OrgChart.tsx`](Temp/paperclip-master/ui/src/pages/OrgChart.tsx)
- Add sidebar link: `/org-chart`

---

## 📋 Feature 9: Activity Feed (Bonus)

**Synergy Score**: 100% — Already in `AuditLog`

### Existing Code to Leverage:

- [`backend/prisma/schema.prisma:305`](backend/prisma/schema.prisma:305) — `AuditLog` model exists
- Backend module: Likely in `audit/` module

### No New Schema Needed

### Frontend:

- Create [`frontend-tenant/src/app/activity/page.tsx`](frontend-tenant/src/app/activity/page.tsx)
- Copy activity feed from [`Temp/paperclip-master/ui/src/pages/Activity.tsx`](Temp/paperclip-master/ui/src/pages/Activity.tsx)
- Add sidebar link: `/activity`

---

## 🗂️ Complete File Structure

```
backend/src/modules/
├── routines/                              # NEW
│   ├── interfaces/
│   │   ├── i-routine-executor.interface.ts
│   │   └── i-routine-repository.interface.ts
│   ├── dto/
│   ├── repositories/
│   ├── routine-execution.service.ts
│   ├── routine-graph.ts
│   ├── webhook.controller.ts
│   ├── routines.controller.ts
│   └── routines.module.ts
│
├── costs/                                 # NEW
│   ├── interfaces/
│   ├── dto/
│   ├── repositories/
│   ├── providers/
│   ├── costs.service.ts
│   ├── budget.service.ts
│   ├── costs.controller.ts
│   └── costs.module.ts
│
├── inbox/                                 # NEW
│   ├── interfaces/
│   ├── dto/
│   ├── notifiers/
│   ├── inbox.service.ts
│   ├── inbox.gateway.ts
│   ├── inbox.controller.ts
│   └── inbox.module.ts
│
├── goals/                                 # NEW
│   ├── interfaces/
│   ├── dto/
│   ├── decomposers/
│   ├── goals.service.ts
│   ├── goals.controller.ts
│   └── goals.module.ts
│
├── dashboard/                             # NEW
│   ├── interfaces/
│   ├── dto/
│   ├── providers/
│   ├── dashboard.service.ts
│   ├── dashboard.controller.ts
│   └── dashboard.module.ts
│
├── projects/                              # NEW
│   ├── interfaces/
│   ├── dto/
│   ├── projects.service.ts
│   ├── projects.controller.ts
│   └── projects.module.ts
│
├── org/                                   # NEW
│   ├── interfaces/
│   ├── dto/
│   ├── providers/
│   ├── org.service.ts
│   ├── org.controller.ts
│   └── org.module.ts
│
├── activity/                              # NEW (or extend audit/)
│   ├── interfaces/
│   ├── dto/
│   ├── activity.service.ts
│   ├── activity.controller.ts
│   └── activity.module.ts
│
└── governance/                            # EXTEND (exists)
    ├── interfaces/
    │   └── i-approval-workflow.interface.ts  # NEW
    ├── workflows/
    │   └── langgraph-approval.workflow.ts     # NEW
    ├── approvals.controller.ts                 # EXTEND
    ├── approvals.service.ts                    # EXTEND
    └── governance.module.ts                    # EXTEND
```

---

## 🔗 Cross-Reference Matrix

| Feature       | Uses                  | Implements                | Emits                 | Depends On                       |
| ------------- | --------------------- | ------------------------- | --------------------- | -------------------------------- |
| **Routines**  | LangGraph             | IRoutineExecutor          | WebSocket events      | AgentExecutor, CheckpointService |
| **Costs**     | LLMFactory, LangSmith | ICostAggregationProvider  | BudgetAlert via Inbox | LangSmithTracing                 |
| **Inbox**     | OpenClaw              | IInboxNotifier            | inbox:new WebSocket   | Notification model               |
| **Approvals** | CheckpointService     | IApprovalWorkflow         | approval:\* via Inbox | Routines, Inbox                  |
| **Goals**     | LangGraph             | IGoalDecomposer           | goal:\* events        | AgentGraph                       |
| **Dashboard** | LangSmith             | IDashboardMetricsProvider | —                     | Costs, Inbox, Agents             |
| **Projects**  | Goals, Routines       | IProjectManager           | project:\* events     | Goals, Routines                  |
| **Org**       | Department, Agent     | IOrgHierarchyProvider     | —                     | —                                |
| **Activity**  | AuditLog              | —                         | activity:\* events    | —                                |

---

## 🚀 Implementation Order

### Phase A: Foundation (Features 1-3)

1. **Routines** — Core workflow engine (leverages LangGraph)
2. **Costs** — Leverage existing ExecutionLog + LLMFactory
3. **Inbox** — Wire OpenClaw to notifications

### Phase B: Enhancement (Features 4-6)

4. **Approvals** — Extend existing governance
5. **Goals** — New hierarchical system
6. **Dashboard** — Aggregate existing data

### Phase C: Organization (Features 7-9)

7. **Projects** — Grouping mechanism
8. **Org Chart** — Visual hierarchy
9. **Activity** — Audit trail

---

## ✅ Verification Checklist

Before marking each feature complete:

- [ ] Schema migration applied (`npx prisma migrate dev`)
- [ ] All interfaces created with `I` prefix
- [ ] All services use constructor injection (no `new`)
- [ ] All Prisma queries include `tenantId` filter
- [ ] DTOs validated with class-validator
- [ ] Controller has proper guards (`@UseGuards`)
- [ ] WebSocket gateway emits real-time events
- [ ] Frontend page created with Paperclip UI reference
- [ ] Sidebar updated with new navigation link
- [ ] Memory Bank updated (`UMB` command)

---

## 📚 Reference Files

- **Paperclip UI Patterns**: [`Temp/paperclip-master/ui/src/pages/`](Temp/paperclip-master/ui/src/pages/)
- **Goals**: [`Temp/paperclip-master/ui/src/pages/Goals.tsx`](Temp/paperclip-master/ui/src/pages/Goals.tsx)
- **Routines**: [`Temp/paperclip-master/ui/src/pages/Routines.tsx`](Temp/paperclip-master/ui/src/pages/Routines.tsx)
- **Inbox**: [`Temp/paperclip-master/ui/src/pages/Inbox.tsx`](Temp/paperclip-master/ui/src/pages/Inbox.tsx)
- **Costs**: [`Temp/paperclip-master/ui/src/pages/Costs.tsx`](Temp/paperclip-master/ui/src/pages/Costs.tsx)
- **Approvals**: [`Temp/paperclip-master/ui/src/pages/Approvals.tsx`](Temp/paperclip-master/ui/src/pages/Approvals.tsx)
- **OrgChart**: [`Temp/paperclip-master/ui/src/pages/OrgChart.tsx`](Temp/paperclip-master/ui/src/pages/OrgChart.tsx)
- **Dashboard**: [`Temp/paperclip-master/ui/src/pages/Dashboard.tsx`](Temp/paperclip-master/ui/src/pages/Dashboard.tsx)
- **Projects**: [`Temp/paperclip-master/ui/src/pages/Projects.tsx`](Temp/paperclip-master/ui/src/pages/Projects.tsx)
- **Activity**: [`Temp/paperclip-master/ui/src/pages/Activity.tsx`](Temp/paperclip-master/ui/src/pages/Activity.tsx)
