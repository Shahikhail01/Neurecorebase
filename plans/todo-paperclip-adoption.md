# Paperclip Features Adoption — Todo List

**Status**: Ready for Implementation  
**Priority**: Based on AI Stack Synergy (LangChain/LangGraph 90%, OpenClaw 70%, LangSmith 80%)  
**Design**: All implementation MUST follow SOLID principles

---

## SOLID Principles Guidelines

Every module, service, and component must adhere to:

| Principle                 | Application                                                                          |
| ------------------------- | ------------------------------------------------------------------------------------ |
| **S**ingle Responsibility | Each service does ONE thing (e.g., `CostAggregationService` only aggregates costs)   |
| **O**pen/Closed           | Extend via dependency injection, never modify existing modules                       |
| **L**iskov Substitution   | Use interfaces for all dependencies; swap implementations without breaking           |
| **I**nterface Segregation | Small, focused interfaces (e.g., `ICostProvider`, not `IAllThingsProvider`)          |
| **D**ependency Inversion  | Depend on abstractions (`ICostRepository`), not concretions (`PrismaCostRepository`) |

---

## Priority Ranking (by AI Stack Synergy)

| Rank  | Feature            | Synergy Score | Leverage                    |
| ----- | ------------------ | ------------- | --------------------------- |
| **1** | Routines/Workflows | 🟢 90%        | Extend `OfficialAgentGraph` |
| **2** | Cost Tracking      | 🟢 80%        | LangSmith + LLMFactory      |
| **3** | Unified Inbox      | 🟢 70%        | OpenClaw Gateway            |
| **4** | Approval Workflows | 🟢 85%        | LangGraph Interrupts        |
| **5** | Goals System       | 🟡 50%        | LangGraph decomposition     |
| **6** | Dashboard          | 🟢 70%        | LangSmith Metrics API       |
| **7** | Projects           | 🟡 40%        | Grouping mechanism          |
| **8** | Org Chart          | 🟡 30%        | UI-heavy feature            |

---

## Implementation Order

### Priority 1: Routines/Workflows ⭐ (Synergy: 90%)

**Why First**: LangGraph IS a workflow engine. Paperclip's "routines" = LangGraph state machines with cron/webhook triggers.

**Files to Extend/Modify**:

- [`backend/src/modules/agents/langgraph/langgraph-official.ts`](backend/src/modules/agents/langgraph/langgraph-official.ts) — Add `RoutineGraph` class
- [`backend/src/modules/agents/langgraph/checkpoint.service.ts`](backend/src/modules/agents/langgraph/checkpoint.service.ts) — Add routine persistence

**Todo List**:

- [ ] **S.O.L.I.D. Interface**: Create `IRoutineExecutor` interface in `backend/src/modules/routines/interfaces/`

  ```typescript
  // Single Responsibility: One interface for routine execution
  export interface IRoutineExecutor {
    execute(
      routineId: string,
      input?: Record<string, unknown>,
    ): Promise<RoutineRun>;
    schedule(routineId: string, cron: string): void;
    cancel(routineId: string): Promise<void>;
  }
  ```

- [ ] **SOLID Service**: Create `RoutineExecutionService` implementing `IRoutineExecutor`
  - Inject `OfficialAgentGraph` (Dependency Inversion)
  - Use `AgentCheckpointService` for state persistence (Open/Closed)
  - Do NOT modify `OfficialAgentGraph` directly (Open/Closed)

- [ ] **Database**: Add Prisma model `Routine` and `RoutineTrigger`

  ```prisma
  model Routine {
    id                 String   @id @default(cuid())
    tenantId           String
    title              String
    status             RoutineStatus @default(ACTIVE)
    concurrencyPolicy  ConcurrencyPolicy @default(COALESCE)
    createdAt          DateTime @default(now())
    triggers           RoutineTrigger[]
  }

  model RoutineTrigger {
    id               String   @id @default(cuid())
    routineId        String
    kind             TriggerKind  // SCHEDULE | WEBHOOK | EVENT
    cronExpression   String?
    webhookSecret    String?
    enabled          Boolean  @default(true)
    nextRunAt        DateTime?
    routine          Routine  @relation(fields: [routineId], references: [id])
  }
  ```

- [ ] **Controller**: Create `routines.controller.ts` (thin, delegates to service)

- [ ] **Webhook Endpoint**: `POST /api/v1/webhooks/:secret` (trigger routines via OpenClaw)

- [ ] **Frontend**: Create `frontend-tenant/src/pages/routines/page.tsx`
  - Copy Paperclip's cron builder UI from [`Temp/paperclip-master/ui/src/pages/Routines.tsx`](Temp/paperclip-master/ui/src/pages/Routines.tsx)

---

### Priority 2: Cost Tracking ⭐ (Synergy: 80%)

**Why Second**: Cost data ALREADY exists in LangSmith + LLMFactory. Need to expose via new endpoints.

**Files to Extend/Modify**:

- [`backend/src/modules/models/services/llm-factory.service.ts`](backend/src/modules/models/services/llm-factory.service.ts) — Add cost aggregation methods
- [`backend/src/modules/ai-gateway/langsmith-tracing.service.ts`](backend/src/modules/ai-gateway/langsmith-tracing.service.ts) — Add `getCostBreakdown()`

**Todo List**:

- [ ] **S.O.L.I.D. Interface**: Create `ICostAggregationProvider` interface

  ```typescript
  export interface ICostAggregationProvider {
    getCostByTenant(tenantId: string, period: DateRange): Promise<CostSummary>;
    getCostByAgent(
      tenantId: string,
      agentId: string,
      period: DateRange,
    ): Promise<CostSummary>;
    getCostByModel(
      tenantId: string,
      model: string,
      period: DateRange,
    ): Promise<CostSummary>;
  }
  ```

- [ ] **SOLID Service**: Create `LangSmithCostProvider` implementing `ICostAggregationProvider`
  - Inject `LangSmithTracingService` (Dependency Inversion)
  - Inject `LLMFactory` (Dependency Inversion)
  - No direct Prisma dependency in this service (Single Responsibility)

- [ ] **Repository Layer**: Create `CostRecordRepository` for persistence

  ```typescript
  export interface ICostRecordRepository {
    save(record: CostRecord): Promise<void>;
    findByTenant(tenantId: string, period: DateRange): Promise<CostRecord[]>;
  }
  ```

- [ ] **Database**: Add `CostRecord` model

  ```prisma
  model CostRecord {
    id            String   @id @default(cuid())
    tenantId      String
    agentId       String?
    runId         String?  // Links to LangSmith run
    provider      String   // OPENAI, ANTHROPIC, MINIMAX
    model         String
    inputTokens   Int
    outputTokens  Int
    costCents     Decimal
    windowStart   DateTime
    windowEnd     DateTime
    createdAt     DateTime @default(now())
  }
  ```

- [ ] **Controller**: `GET /api/v1/costs/summary`, `GET /api/v1/costs/timeline`

- [ ] **Frontend**: Create `frontend-tenant/src/pages/costs/page.tsx`
  - Copy Paperclip's cost breakdown UI from [`Temp/paperclip-master/ui/src/pages/Costs.tsx`](Temp/paperclip-master/ui/src/pages/Costs.tsx)

---

### Priority 3: Unified Inbox ⭐ (Synergy: 70%)

**Why Third**: OpenClaw Gateway already has `notify()`. Wire it to inbox items.

**Files to Extend/Modify**:

- [`backend/src/modules/ai-gateway/openclaw-gateway.service.ts`](backend/src/modules/ai-gateway/openclaw-gateway.service.ts) — Enhance `notify()` method

**Todo List**:

- [ ] **S.O.L.I.D. Interface**: Create `IInboxNotifier` interface

  ```typescript
  export interface IInboxNotifier {
    notify(userId: string, item: InboxItem): Promise<void>;
    notifyBatch(userId: string, items: InboxItem[]): Promise<void>;
  }
  ```

- [ ] **SOLID Service**: Create `OpenClawInboxNotifier` implementing `IInboxNotifier`
  - Inject `OpenClawGatewayService` (Dependency Inversion)
  - Map inbox item kinds to OpenClaw channels

- [ ] **Database**: Add `InboxItem` model

  ```prisma
  model InboxItem {
    id          String      @id @default(cuid())
    tenantId    String
    userId      String
    kind        InboxKind   // APPROVAL, FAILED_TASK, AGENT_ALERT, BUDGET_ALERT
    entityType  String
    entityId    String
    title       String
    body        String?
    status      InboxStatus @default(UNREAD)
    priority    Priority    @default(MEDIUM)
    createdAt   DateTime    @default(now())
    readAt      DateTime?
    archivedAt  DateTime?
  }
  ```

- [ ] **Service**: Create `InboxService`
  - Inject `IInboxNotifier` (not concrete `OpenClawInboxNotifier`)
  - Inject `ICostRecordRepository` for budget alerts
  - Emit WebSocket events for real-time updates

- [ ] **Controller**: `GET /api/v1/inbox`, `PATCH /api/v1/inbox/:id/read`, `PATCH /api/v1/inbox/:id/archive`

- [ ] **WebSocket Gateway**: Add `inbox:new` event emission

- [ ] **Frontend**: Create `frontend-tenant/src/pages/inbox/page.tsx`
  - Copy Paperclip's swipe-to-archive from [`Temp/paperclip-master/ui/src/pages/Inbox.tsx`](Temp/paperclip-master/ui/src/pages/Inbox.tsx)
  - Add badge counter to sidebar

---

### Priority 4: Approval Workflows ⭐ (Synergy: 85%)

**Why Fourth**: LangGraph interrupts = human-in-the-loop approvals. Existing `AgentCheckpointService` provides state persistence.

**Todo List**:

- [ ] **S.O.L.I.D. Interface**: Create `IApprovalWorkflow` interface

  ```typescript
  export interface IApprovalWorkflow {
    requestApproval(request: ApprovalRequest): Promise<Approval>;
    approve(approvalId: string, note?: string): Promise<void>;
    reject(approvalId: string, note?: string): Promise<void>;
    getPending(tenantId: string, approverId: string): Promise<Approval[]>;
  }
  ```

- [ ] **SOLID Service**: Create `LangGraphApprovalWorkflow` implementing `IApprovalWorkflow`
  - Inject `AgentCheckpointService` for interrupt state (Dependency Inversion)
  - Inject `IInboxNotifier` for notifications
  - Inject `IRoutineExecutor` for post-approval execution

- [ ] **Database**: Add `Approval` model

  ```prisma
  model Approval {
    id                 String   @id @default(cuid())
    tenantId           String
    requestedByAgentId String
    approverUserId     String
    kind               ApprovalKind  // BUDGET_SPEND, DATA_ACCESS, AGENT_ACTION
    title             String
    payload            Json
    status             ApprovalStatus @default(PENDING)
    priority           Priority @default(MEDIUM)
    dueAt              DateTime?
    decisionNote       String?
    decidedAt          DateTime?
    createdAt          DateTime @default(now())
  }
  ```

- [ ] **Controller**: `POST /api/v1/approvals`, `GET /api/v1/approvals`, `POST /api/v1/approvals/:id/approve`, `POST /api/v1/approvals/:id/reject`

- [ ] **Frontend**: Create `frontend-tenant/src/pages/approvals/page.tsx`
  - Copy Paperclip's approval cards from [`Temp/paperclip-master/ui/src/pages/Approvals.tsx`](Temp/paperclip-master/ui/src/pages/Approvals.tsx)

---

### Priority 5: Goals System 🟡 (Synergy: 50%)

**Why Fifth**: LangGraph sequential edges for goal decomposition, but less critical than workflows.

**Todo List**:

- [ ] **S.O.L.I.D. Interface**: Create `IGoalDecomposer` interface

  ```typescript
  export interface IGoalDecomposer {
    decompose(goal: Goal): Promise<Goal[]>;
    linkSubGoals(parentId: string, childIds: string[]): Promise<void>;
    getProgress(goalId: string): Promise<number>;
  }
  ```

- [ ] **SOLID Service**: Create `LangGraphGoalDecomposer` implementing `IGoalDecomposer`
  - Inject `OfficialAgentGraph` for decomposition logic
  - Inject `GoalRepository` for persistence

- [ ] **Database**: Add `Goal` model

  ```prisma
  model Goal {
    id           String   @id @default(cuid())
    tenantId     String
    title        String
    description  String?
    level        GoalLevel  // COMPANY, DEPARTMENT, TEAM, INDIVIDUAL
    status       GoalStatus @default(ACTIVE)
    parentId     String?
    ownerAgentId String?
    ownerUserId  String?
    progress     Int      @default(0)
    targetDate   DateTime?
    createdAt    DateTime @default(now())
    updatedAt    DateTime @updatedAt
    parent       Goal?    @relation("GoalHierarchy", fields: [parentId], references: [id])
    children     Goal[]   @relation("GoalHierarchy")
  }
  ```

- [ ] **Controller**: CRUD + `GET /api/v1/goals/tree` (hierarchical)

- [ ] **Frontend**: Create `frontend-tenant/src/pages/goals/page.tsx`
  - Copy Paperclip's `GoalTree` from [`Temp/paperclip-master/ui/src/components/GoalTree.tsx`](Temp/paperclip-master/ui/src/components/GoalTree.tsx)

---

### Priority 6: Dashboard 🟢 (Synergy: 70%)

**Why Sixth**: LangSmith Metrics API provides most data. Build UI on top.

**Todo List**:

- [ ] **S.O.L.I.D. Interface**: Create `IDashboardMetricsProvider` interface

  ```typescript
  export interface IDashboardMetricsProvider {
    getSummary(tenantId: string): Promise<DashboardSummary>;
    getActivityTimeline(
      tenantId: string,
      days: number,
    ): Promise<ActivityData[]>;
    getAgentHealth(tenantId: string): Promise<AgentHealth>;
  }
  ```

- [ ] **SOLID Service**: Create `LangSmithDashboardProvider` implementing `IDashboardMetricsProvider`
  - Inject `LangSmithTracingService` (Dependency Inversion)
  - Inject `ICostAggregationProvider` (Interface Segregation)
  - Inject `InboxService` for pending counts

- [ ] **Controller**: `GET /api/v1/dashboard/summary`

- [ ] **Frontend**: Enhance existing dashboard
  - Add `MetricCard` components with trend indicators
  - Copy Paperclip's `ActivityCharts` from [`Temp/paperclip-master/ui/src/components/ActivityCharts.tsx`](Temp/paperclip-master/ui/src/components/ActivityCharts.tsx)

---

### Priority 7: Projects 🟡 (Synergy: 40%)

**Why Seventh**: Grouping mechanism with less AI dependency.

**Todo List**:

- [ ] **S.O.L.I.D. Interface**: Create `IProjectManager` interface

  ```typescript
  export interface IProjectManager {
    create(data: CreateProjectDto): Promise<Project>;
    linkGoal(projectId: string, goalId: string): Promise<void>;
    getProjectSummary(projectId: string): Promise<ProjectSummary>;
  }
  ```

- [ ] **Database**: Add `Project` model

  ```prisma
  model Project {
    id           String   @id @default(cuid())
    tenantId     String
    name         String
    description  String?
    status       ProjectStatus @default(ACTIVE)
    goalIds      String[]
    targetDate   DateTime?
    createdAt    DateTime @default(now())
    updatedAt    DateTime @updatedAt
  }
  ```

- [ ] **Controller**: CRUD for projects

- [ ] **Frontend**: Create `frontend-tenant/src/pages/projects/page.tsx`
  - Copy Paperclip's project list from [`Temp/paperclip-master/ui/src/pages/Projects.tsx`](Temp/paperclip-master/ui/src/pages/Projects.tsx)

---

### Priority 8: Org Chart 🟡 (Synergy: 30%)

**Why Last**: Primarily UI feature with minimal AI leverage.

**Todo List**:

- [ ] **S.O.L.I.D. Interface**: Create `IOrgHierarchyProvider` interface

  ```typescript
  export interface IOrgHierarchyProvider {
    getOrgTree(tenantId: string): Promise<OrgNode[]>;
  }
  ```

- [ ] **SOLID Service**: Create `DepartmentOrgProvider` implementing `IOrgHierarchyProvider`
  - Build tree from existing Department structure

- [ ] **Controller**: `GET /api/v1/org/tree`

- [ ] **Frontend**: Create `frontend-tenant/src/pages/org-chart/page.tsx`
  - Copy Paperclip's SVG org chart from [`Temp/paperclip-master/ui/src/pages/OrgChart.tsx`](Temp/paperclip-master/ui/src/pages/OrgChart.tsx)

---

## Module Structure (SOLID-compliant)

```
backend/src/modules/
├── routines/
│   ├── interfaces/
│   │   └── i-routine-executor.interface.ts    # IS
│   ├── dto/
│   │   └── *.dto.ts                            # Input validation
│   ├── routines.service.ts                      # SRP: CRUD only
│   ├── routine-execution.service.ts            # SRP: Execution logic
│   ├── routine-graph.ts                        # SRP: LangGraph wrapper
│   ├── routines.controller.ts                  # SRP: HTTP handling
│   └── routines.module.ts                      # DI configuration
│
├── costs/
│   ├── interfaces/
│   │   ├── i-cost-aggregation-provider.ts      # IS
│   │   └── i-cost-record-repository.ts         # IS
│   ├── dto/
│   ├── langsmith-cost-provider.ts               # SRP: LangSmith integration
│   ├── cost-record-repository.ts               # SRP: Prisma persistence
│   ├── costs.service.ts                        # SRP: Orchestration
│   ├── costs.controller.ts
│   └── costs.module.ts
│
├── inbox/
│   ├── interfaces/
│   │   └── i-inbox-notifier.ts                 # IS
│   ├── dto/
│   ├── openclaw-inbox-notifier.ts              # SRP: OpenClaw integration
│   ├── inbox.service.ts                        # SRP: Business logic
│   ├── inbox.controller.ts
│   └── inbox.module.ts
│
├── approvals/
│   ├── interfaces/
│   │   └── i-approval-workflow.ts              # IS
│   ├── dto/
│   ├── langgraph-approval-workflow.ts          # SRP: LangGraph interrupts
│   ├── approvals.service.ts                    # SRP: Orchestration
│   ├── approvals.controller.ts
│   └── approvals.module.ts
│
├── goals/
│   ├── interfaces/
│   │   └── i-goal-decomposer.ts                # IS
│   ├── dto/
│   ├── langgraph-goal-decomposer.ts            # SRP: Goal decomposition
│   ├── goals.service.ts
│   ├── goals.controller.ts
│   └── goals.module.ts
│
├── dashboard/
│   ├── interfaces/
│   │   └── i-dashboard-metrics-provider.ts     # IS
│   ├── dto/
│   ├── langsmith-dashboard-provider.ts          # SRP: Metrics from LangSmith
│   ├── dashboard.service.ts
│   ├── dashboard.controller.ts
│   └── dashboard.module.ts
│
├── projects/
│   ├── interfaces/
│   │   └── i-project-manager.ts                # IS
│   ├── dto/
│   ├── projects.service.ts
│   ├── projects.controller.ts
│   └── projects.module.ts
│
└── org/
    ├── interfaces/
    │   └── i-org-hierarchy-provider.ts         # IS
    ├── dto/
    ├── department-org-provider.ts               # SRP: Org tree from departments
    ├── org.service.ts
    ├── org.controller.ts
    └── org.module.ts
```

---

## Interface Segregation Examples

### BEFORE (Violates ISP):

```typescript
interface IDataService {
  getCosts(): Promise<Cost[]>;
  getInboxItems(): Promise<InboxItem[]>;
  getApprovals(): Promise<Approval[]>;
  getGoals(): Promise<Goal[]>;
}
// ❌ Fat interface - consumers must depend on methods they don't use
```

### AFTER (Follows ISP):

```typescript
interface ICostProvider {
  getCosts(): Promise<Cost[]>;
}

interface IInboxProvider {
  getInboxItems(): Promise<InboxItem[]>;
  markRead(id: string): Promise<void>;
}

interface IApprovalProvider {
  getApprovals(): Promise<Approval[]>;
  approve(id: string): Promise<void>;
}

interface IGoalProvider {
  getGoals(): Promise<Goal[]>;
  decomposeGoal(id: string): Promise<Goal[]>;
}
```

---

## Dependency Injection Example

```typescript
// routines.module.ts
@Module({
  imports: [AgentsModule, LangSmithModule],
  controllers: [RoutinesController],
  providers: [
    // Concrete implementations
    RoutineExecutionService,
    PrismaRoutineRepository,

    // Interface bindings (KEY: Swap implementations without changing consumers)
    {
      provide: IRoutineExecutor,
      useClass: RoutineExecutionService,
    },
    {
      provide: IRoutineRepository,
      useClass: PrismaRoutineRepository,
    },
  ],
  exports: [RoutineExecutionService], // Export abstraction, not concrete
})
export class RoutinesModule {}
```

---

## Open/Closed Example

### BEFORE (Violates OCP):

```typescript
class CostService {
  getCostsByTenant(tenantId: string): Cost[] {
    // Direct Prisma dependency - modifying DB requires changing this class
    return this.prisma.costRecord.findMany({ where: { tenantId } });
  }
}
```

### AFTER (Follows OCP):

```typescript
// New feature: Add Redis caching without modifying CostService
class CostService {
  constructor(
    private costProvider: ICostAggregationProvider, // Inject abstraction
  ) {}

  async getCostsByTenant(tenantId: string): Promise<CostSummary> {
    // Can swap ICostAggregationProvider implementation without changing this code
    return this.costProvider.getCostByTenant(tenantId);
  }
}

// RedisCachingCostProvider implements ICostAggregationProvider
// Add caching WITHOUT modifying CostService
```

---

## Effort Summary

| Priority  | Feature            | Hours      | AI Leverage |
| --------- | ------------------ | ---------- | ----------- |
| 1         | Routines/Workflows | 16-20      | 90%         |
| 2         | Cost Tracking      | 8-10       | 80%         |
| 3         | Unified Inbox      | 12-15      | 70%         |
| 4         | Approval Workflows | 14-18      | 85%         |
| 5         | Goals System       | 18-22      | 50%         |
| 6         | Dashboard          | 10-12      | 70%         |
| 7         | Projects           | 8-10       | 40%         |
| 8         | Org Chart          | 12-14      | 30%         |
| **TOTAL** |                    | **98-121** | **~65%**    |

**vs Building from Scratch**: ~200+ hours  
**Savings**: ~80-100 hours by leveraging existing AI infrastructure
