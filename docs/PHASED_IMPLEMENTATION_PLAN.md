# NeureCore Gold - Phased Implementation Plan

## Executive Summary

A phased architecture for building an AI-Agent Operated Business Platform with:
- **Separated Architecture**: Frontend (Standalone), Backend (API Service)
- **Communication**: HTTP/WebSocket only
- **Code Strategy**: No shared code (Unified Deploy capability)
- **Principles**: SOLID compliance throughout
- **Stability**: Latest stable resources only
- **Deliverable**: Production-ready MVP by end of Phase 3

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Layer (Frontend)                   │
├─────────────────────┬───────────────────────────────────────┤
│  Tenant Portal      │      Super Admin Portal                │
│  (Next.js)          │      (Next.js)                         │
└─────────────────────┴───────────────────────────────────────┘
                      ↕ (HTTP/WebSocket)
┌─────────────────────────────────────────────────────────────┐
│           API Gateway + Authentication                       │
└─────────────────────────────────────────────────────────────┘
                      ↕ (Internal APIs)
┌─────────────────────────────────────────────────────────────┐
│                    Backend Services                          │
├──────────────┬──────────────┬──────────────┬────────────────┤
│ Identity &   │ Agent Runtime│ Orchestration│ Memory & Tools  │
│ Auth Service │ Service      │ Service      │ Service         │
├──────────────┼──────────────┼──────────────┼────────────────┤
│ Governance   │ Observability│ Model Routing│ Integration     │
│ Service      │ Service      │ Service      │ Service         │
└──────────────┴──────────────┴──────────────┴────────────────┘
                      ↕ (Event-driven)
┌─────────────────────────────────────────────────────────────┐
│              Infrastructure & Data Layer                     │
├───────────────┬────────────┬──────────────┬────────────────┤
│ PostgreSQL    │ Vector DB  │ Message Queue│ Redis Cache    │
│ (SQL/Tenant)  │ (Embeddings)│ (Events)    │ (Sessions)     │
└───────────────┴────────────┴──────────────┴────────────────┘
```

---

## Phase 1: Foundation & Core Infrastructure (Weeks 1-6)

### Goals
- Establish backend core architecture
- Implement basic authentication & tenant isolation
- Create API gateway & foundational services
- Build basic frontend scaffold
- Setup development infrastructure

### Tasks

#### 1.1 Project Setup & Infrastructure
- **Duration**: 1 week
- **Deliverables**:
  - Repository structure (backend, frontend, docs)
  - Docker compose for local development
  - Database initialization scripts
  - CI/CD pipeline scaffolding

**Backend Stack**:
- Node.js 20 LTS
- NestJS 10 (framework, SOLID-friendly)
- PostgreSQL 16 (relational data)
- Redis 7 (caching, sessions)
- Docker & Docker Compose
- TypeScript 5.x
- Zod for validation

**Frontend Stack**:
- Next.js 14 (app router)
- React 18.x
- TypeScript 5.x
- Tailwind CSS 3.x
- Zustand for state management
- WebSocket client

**Tools**:
- LangChain 0.1.x (latest stable)
- OpenAI SDK 4.x (for model access)
- Prisma 5.x (ORM)
- Jest for testing

#### 1.2 Identity & Authentication Service
- **Duration**: 2 weeks
- **Deliverables**:
  ```
  POST /api/auth/register
  POST /api/auth/login
  POST /api/auth/refresh
  POST /api/auth/logout
  GET  /api/auth/profile
  ```
- **Implementation**:
  - User model & roles (owner, admin, user)
  - Tenant model & data isolation
  - JWT authentication
  - Role-based access control (RBAC)
  - Session management with Redis
  - Password hashing (bcrypt)

**SOLID Principles Applied**:
- Single Responsibility: `AuthService`, `TokenService`, `PasswordService`
- Open/Closed: Abstract role provider
- Liskov Substitution: Auth strategy interface
- Interface Segregation: Minimal auth contract
- Dependency Inversion: Inject services

#### 1.3 API Gateway & Express Setup
- **Duration**: 1 week
- **Deliverables**:
  - Request/response standardization
  - Error handling middleware
  - Request logging
  - CORS configuration
  - Rate limiting

#### 1.4 Basic Frontend Scaffold
- **Duration**: 1 week
- **Setup for**:
  - Tenant Portal structure (pages)
  - Super Admin Portal structure (pages)
  - Layout components (sidebar, top bar)
  - WebSocket client setup

#### 1.5 Database Schema (Phase 1)
- **Duration**: 1 week
- **Tables**:
  - users
  - tenants
  - roles
  - permissions
  - sessions
  - audit_logs

**Tech**: Prisma migrations for version control

### Deliverables
✅ Backend running on `http://localhost:3000`  
✅ Frontend running on `http://localhost:3001` (tenant), `http://localhost:3002` (admin)  
✅ Basic login/registration working  
✅ Tenant isolation enforced  
✅ Docker setup for local development  
✅ CI/CD pipeline configured  

---

## Phase 2: Agent Runtime & Core Services (Weeks 7-12)

### Goals
- Implement Agent Runtime with LangChain & OpenClaw patterns
- Build Orchestration Service
- Implement Memory & Tools domain
- Create basic frontend dashboards
- Establish WebSocket real-time communication

### Tasks

#### 2.1 Agent Runtime Service
- **Duration**: 3 weeks
- **Deliverables**:
  ```
  Agent Lifecycle Management:
  POST   /api/agents                   (create agent)
  GET    /api/agents                   (list tenant agents)
  GET    /api/agents/:id               (get agent details)
  PUT    /api/agents/:id               (update agent)
  PATCH  /api/agents/:id/permissions   (update permissions)
  DELETE /api/agents/:id               (delete agent)
  
  Agent Execution:
  POST   /api/agents/:id/task          (assign task)
  GET    /api/agents/:id/status        (real-time status)
  POST   /api/agents/:id/pause         (pause agent)
  POST   /api/agents/:id/resume        (resume agent)
  ```

- **Implementation Components**:
  - `Agent` base class (SOLID: interface-based)
  - `AgentPlanner` - LangChain-based goal decomposition
  - `AgentExecutor` - Task execution engine
  - `AgentEvaluator` - Reflection & learning
  - `AgentRegistry` - Agent lifecycle management
  - Agent types: CoreAgent, FunctionalAgent, ExecutiveAgent, MetaAgent

**LangChain Integration**:
- Use `LLMChain` for reasoning
- `AgentExecutor` for multi-step execution
- Memory abstractions for conversation history
- Tool binding for external system calls

**OpenClaw Patterns**:
- Goal decomposition into sub-tasks
- Multi-step execution planning
- Agent collaboration framework
- Reflection loop implementation

**SOLID Principles**:
- Single Responsibility: Each agent type has single purpose
- Open/Closed: Plugin new agent types without modifying core
- Liskov Substitution: All agents follow Agent contract
- Interface Segregation: `IPlanner`, `IExecutor`, `IEvaluator`
- Dependency Inversion: Inject LLM, memory, tools

#### 2.2 Memory & Embedding Service
- **Duration**: 2 weeks
- **Dependencies**: Vector DB (Supabase pgvector or Weaviate)
- **Deliverables**:
  ```
  Memory Types:
  - Short-term: Session context (Redis)
  - Long-term: Knowledge base (Vector DB)
  - Graph: Relationships & context (PostgreSQL)
  
  POST   /api/memory/store              (store info)
  POST   /api/memory/query              (semantic search)
  GET    /api/memory/context/:agentId   (get agent context)
  DELETE /api/memory/:id                (clear memory)
  ```

- **Implementation**:
  - Embedding service (OpenAI embeddings)
  - Vector store abstraction
  - Context retrieval for agents
  - Semantic search engine

#### 2.3 Tool Integration Service
- **Duration**: 2 weeks
- **Deliverables**:
  ```
  Tool Management:
  POST   /api/tools/register             (register tool)
  GET    /api/tools                      (list available tools)
  POST   /api/tools/:id/execute          (execute tool)
  GET    /api/tools/:id/status           (check execution)
  
  Built-in Tool Examples:
  - Email sender
  - Database querier
  - API caller
  - File reader/writer
  - Calculator
  ```

- **Implementation**:
  - Tool interface abstraction
  - Tool executor with sandboxing
  - Tool registry
  - Execution history tracking
  - Error handling & retries

**SOLID**:
- `ITool` interface
- Tool adapters as implementations
- Dependency injection of tools to agents

#### 2.4 Orchestration Service
- **Duration**: 2 weeks
- **Deliverables**:
  ```
  Task Management:
  POST   /api/tasks                      (create task)
  GET    /api/tasks                      (list tasks)
  GET    /api/tasks/:id                  (task details)
  PUT    /api/tasks/:id/status           (update status)
  
  Workflow Management:
  POST   /api/workflows                  (create workflow)
  GET    /api/workflows                  (list workflows)
  POST   /api/workflows/:id/execute      (execute workflow)
  GET    /api/workflows/:id/status       (workflow status)
  ```

- **Implementation**:
  - Task router & scheduler
  - Dependency resolver
  - Retry logic with exponential backoff
  - Failure recovery
  - Event emission for async operations

#### 2.5 Frontend: Tenant Portal Basics
- **Duration**: 2 weeks
- **Pages/Components**:
  - Dashboard (KPI tiles, activity feed)
  - Agent Management (list, create, view)
  - Basic Workflow visualizer
  - Settings page
  - Real-time status updates (WebSocket)

- **State Management**:
  - Zustand stores for agents, tasks, workflows
  - Local caching strategy
  - Optimistic updates

#### 2.6 Frontend: Super Admin Portal Basics
- **Duration**: 1 week
- **Pages/Components**:
  - Platform Overview
  - Tenant Management list
  - Basic monitoring dashboard
  - System logs viewer

#### 2.7 WebSocket Communication Layer
- **Duration**: 1 week
- **Implementation**:
  - Socket.IO server in NestJS
  - Authentication for WebSocket connections
  - Event namespaces (by tenant)
  - Real-time event broadcasting
  - Automatic reconnection handling

**Events**:
- `agent:status_updated`
- `task:completed`
- `agent:error`
- `memory:updated`
- `system:alert`

#### 2.8 Database Schema Expansion (Phase 2)
- **Tables**:
  - agents
  - agent_templates
  - tasks
  - workflows
  - tool_integrations
  - memory_entries
  - embeddings (vector)
  - execution_logs
  - events

### Deliverables
✅ Agent runtime with LangChain/OpenClaw integration  
✅ Multiple agent types deployable  
✅ Memory & embedding system working  
✅ Basic tool integration system  
✅ Task orchestration working  
✅ Real-time WebSocket communication  
✅ Tenant portal showing agent status  
✅ Super admin basic monitoring  
✅ All services running in Docker  

---

## Phase 3: Governance, Observability & Deployment Ready (Weeks 13-18)

### Goals
- Implement Governance & compliance rules
- Complete Observability & monitoring
- Add approval workflows
- Complete tenant portal UI/UX
- Complete super admin portal UI/UX
- Production-ready deployment configuration
- **Status**: Ready for MVP deployment

### Tasks

#### 3.1 Governance Service
- **Duration**: 2 weeks
- **Deliverables**:
  ```
  POST   /api/governance/rules           (create rule)
  GET    /api/governance/rules           (list rules)
  POST   /api/governance/validate        (validate action)
  GET    /api/governance/audit/:agentId  (agent audit trail)
  ```

- **Implementation**:
  - Rule engine (spending limits, authority scope)
  - Policy validator
  - Compliance checker
  - Audit trail logging
  - Risk scorer

**Rules Examples**:
- Max spending per agent per day
- Authority hierarchy enforcement
- Data access control
- Time-based permissions
- Approval requirements for high-risk actions

#### 3.2 Observability & Monitoring Service
- **Duration**: 2 weeks
- **Stack**: Prometheus + Grafana (for local), prepared for cloud solutions
- **Deliverables**:
  ```
  GET    /api/observability/metrics      (agent metrics)
  GET    /api/observability/traces       (execution traces)
  GET    /api/observability/costs        (cost tracking)
  GET    /api/observability/health       (system health)
  ```

- **Metrics Tracked**:
  - Agent success rate
  - Task completion time
  - Token usage per agent
  - Cost per tenant
  - Error rate
  - API latency
  - Memory usage (semantic search)

- **Implementation**:
  - Custom metrics collectors
  - Prometheus exporter format
  - Structured logging (JSON)
  - Trace context propagation (OpenTelemetry-compatible)
  - Cost calculation engine

#### 3.3 Approval Workflow System
- **Duration**: 2 weeks
- **Deliverables**:
  ```
  POST   /api/approvals                  (create approval request)
  GET    /api/approvals                  (list pending)
  PUT    /api/approvals/:id/approve      (approve)
  PUT    /api/approvals/:id/reject       (reject)
  GET    /api/approvals/:id/history      (approval history)
  ```

- **Implementation**:
  - Approval request model
  - Approval workflow engine
  - Notification system (email, in-app)
  - Approval hierarchy
  - History & audit trail

#### 3.4 Model Routing Service
- **Duration**: 1 week
- **Deliverables**:
  ```
  POST   /api/models/select              (get optimal model)
  GET    /api/models/available           (list models)
  GET    /api/models/usage               (usage analytics)
  ```

- **Implementation**:
  - Model selector algorithm
  - Cost vs quality optimizer
  - Fallback model selection
  - Model usage tracking
  - Cost ceiling enforcement

**Models Supported**:
- GPT-4 (high complexity, planning)
- GPT-3.5 (routine tasks, cost-effective)
- Claude 3 (reasoning-heavy tasks)
- Local models (fallback, privacy)

#### 3.5 Tenant Portal: Complete UI/UX
- **Duration**: 3 weeks
- **Pages to Complete**:
  1. **Dashboard**
     - Revenue KPIs
     - Cost breakdown
     - Agent activity feed
     - Top risks/alerts
     - 7-day trend graphs

  2. **Agents Module**
     - Agent card grid (status, workload, health)
     - Create agent wizard
     - Agent detail view (profile, permissions, tools, budget)
     - Agent performance analytics
     - Edit & delete actions

  3. **Departments Module**
     - Department tree view
     - Create/edit/delete departments
     - Assign agents to departments
     - Department performance KPIs

  4. **Tasks Module**
     - Task list with filtering
     - Create task modal
     - Task detail view (execution trace)
     - Kanban board view
     - Task reassignment

  5. **Workflows Module**
     - Visual workflow builder
     - Workflow list
     - Drag-and-drop flow design
     - Execution history
     - Template library

  6. **Approvals Module**
     - Pending approvals list
     - Approval detail view
     - Approve/reject actions
     - Approval history
     - Bulk actions

  7. **Analytics Module**
     - Agent productivity metrics
     - Cost analysis
     - ROI calculation
     - Trend analysis
     - Custom report builder

  8. **Settings Module**
     - Agent authority levels
     - Tool integrations management
     - API keys
     - Webhooks configuration
     - Notification preferences

- **UI Components** (reusable):
  - AgentCard
  - KPITile
  - WorkflowNode
  - ApprovalModal
  - ActivityTimeline
  - CommandConsole
  - AlertBanner
  - DataTable (virtualized)

#### 3.6 Super Admin Portal: Complete UI/UX
- **Duration**: 2 weeks
- **Pages to Complete**:
  1. **Platform Overview (Mission Control)**
     - Real-time system status (green/yellow/red)
     - Tenant count & growth
     - Revenue per hour
     - Active agents count
     - Error heatmap
     - Region load map
     - Model usage distribution

  2. **Tenants Management**
     - Tenant table (searchable, sortable)
     - Create new tenant
     - Tenant detail inspector
     - Impersonate tenant
     - Suspend/resume tenant
     - Adjust limits & plans
     - Audit tenant data
     - Resource allocation

  3. **Agent Fleet Control**
     - Global agent grid (all tenants)
     - Agent cards: workload, success rate, cost
     - Filter by tenant/type/load/status
     - Bulk agent actions
     - Drain agents gradually
     - Restart failed agents

  4. **Model Management**
     - Model availability status
     - Token usage chart
     - Cost per tenant breakdown
     - Peak usage times
     - Model routing rules editor
     - Throttle controls
     - Model switch scheduling

  5. **Security Center**
     - Suspicious behavior alerts
     - Injection attack logs
     - Anomaly detection results
     - Spending anomalies
     - Abnormal agent actions
     - Freeze tenant button
     - Revoke tokens
     - Block IP addresses
     - Disable specific agents

  6. **Billing & Revenue**
     - Revenue breakdown by plan
     - Unpaid accounts list
     - Usage spike alerts
     - Margin analysis
     - Cost per tenant
     - Billing adjustments
     - Credit system
     - Refund issuance

  7. **Logs & Trace Viewer**
     - Searchable event timeline
     - Filter by: time, tenant, agent, action
     - Agent reasoning logs
     - API requests log
     - Error traces
     - Decision history
     - Tool execution logs
     - Export & download

  8. **Marketplace Admin**
     - Plugin approval queue
     - Agent template approval
     - Workflow template approval
     - Commission management
     - Remove malicious items
     - Performance metrics

  9. **Infrastructure Monitor**
     - Server status & uptime
     - Database performance
     - Queue depth
     - Cache hit rates
     - Disk usage
     - Network latency

- **Platform Brain Map** (unique feature):
  - Interactive graph visualization
  - Nodes: tenants, agents, workloads
  - Show connections & relationships
  - Zoomable/draggable like galaxy map
  - Click to inspect, drag to reassign

#### 3.7 Notification System
- **Duration**: 1 week
- **Deliverables**:
  - In-app notifications (real-time via WebSocket)
  - Email notifications
  - Notification preferences per user
  - Notification history

#### 3.8 Production Deployment Configuration
- **Duration**: 2 weeks
- **Deliverables**:
  - Kubernetes manifests (optional but prepared)
  - Docker production images
  - Environment configuration (staging, production)
  - Database backup strategy
  - Redis persistence
  - SSL/TLS setup
  - Load balancer configuration
  - Health check endpoints
  - Readiness/liveness probes
  - Horizontal scaling setup

**Infrastructure Options** (documented & ready):
- AWS ECS + RDS + ElastiCache
- Kubernetes (self-hosted or managed)
- DigitalOcean App Platform
- Heroku (for quick start)

#### 3.9 CI/CD Pipeline Completion
- **Duration**: 1 week
- **GitHub Actions Workflows**:
  - Lint & format check
  - Unit tests
  - Integration tests
  - Build Docker images
  - Push to registry
  - Deploy to staging
  - Smoke tests
  - Deploy to production (manual trigger)

#### 3.10 Database Schema Completion (Phase 3)
- **Additional Tables**:
  - governance_rules
  - approval_requests
  - notifications
  - metrics
  - cost_tracking
  - api_keys
  - oauth_tokens

### Deliverables
✅ Governance & compliance system working  
✅ Observability & monitoring complete  
✅ Approval workflows functional  
✅ Tenant portal fully featured  
✅ Super admin portal fully featured  
✅ Real-time notifications  
✅ Production deployment configured  
✅ CI/CD pipeline automated  
✅ **Zero-downtime deployment capability**  
✅ **System ready for MVP production deployment**  

---

## Phase 4+: Feature Expansion & Enhancement (Post-MVP)

### Phase 4: Advanced Analytics, Intelligence & Hardening (Weeks 19-26)

> **Implementation Status (as of 2026-02-19)**
>
> | Sub-phase | Status | Key files |
> |-----------|--------|-----------|
> | 4.1 Architecture & Design | ✅ Complete | `docs/analytics.md`, `docs/connectors.md` |
> | 4.2 Analytics Engine | ✅ Complete | `modules/analytics/`, `model-runner/` |
> | 4.3 CRM Connectors + OAuth | ✅ Complete | `modules/connectors/`, `services/oauth-token.service.ts`, `services/crypto.service.ts`, `services/sync-scheduler.service.ts` |
> | 4.4 Financial Module | ✅ Complete | `modules/finance/` — InvoiceService, BillingCalculatorService, TaxService, BillingEventsService |
> | 4.5 Reliability & Hardening | ✅ Complete | `modules/reliability/` — QuotaEvaluatorService, QuotaEnforcerService, SpendingCapService, CircuitBreakerService, QuotaGuard |
> | 4.6 Testing, Observability & Safety | ✅ Complete | `test/e2e/billing.e2e-spec.ts`, `test/e2e/crm-sync.e2e-spec.ts`, `infrastructure/tracing/tracing.ts`, 6 new unit test files |

Phase 4 moves beyond MVP features to focus on advanced analytics, platform intelligence, reliability hardening, and SOLID-driven extensibility. The goals are to (1) provide actionable, predictive insights for tenants and platform operators, (2) enable safe third-party integrations, (3) harden runtime and governance boundaries, and (4) keep the codebase open for extension and closed for modifications via well-defined interfaces.

#### Goals
- Deliver a production-grade analytics engine (batch + real-time) with clear APIs
- Introduce safe, pluggable CRM connectors and financial features
- Harden agent runtime (quotas, circuit breakers, throttles)
- Extend test coverage and add chaos / resilience tests
- Apply and document SOLID-driven design for all new modules

#### 4.1 Architecture & Design (SOLID-first)
- Define interfaces for analytics and integrations: `IAnalyticsProvider`, `ICRMConnector`, `IFinancialService`.
- Keep responsibilities small: `AnalyticsService` (orchestrates), `FeatureStore` (stores features), `ModelScorer` (scores predictions).
- Use the Open/Closed principle: register new model scorers through provider adapters; do not modify core scoring pipelines.
- Apply Dependency Inversion: controllers depend on `IAnalyticsProvider` abstractions and receive concrete implementations via DI (see `backend/src/modules/analytics/**`).
- Interface Segregation: split heavy interfaces (e.g., `ICRMConnector`) into `IContactSync`, `ILeadSync`, `IOpportunitySync` where appropriate.

#### 4.2 Advanced Analytics Engine (Weeks 19-22)
- Deliverables:
  - Batch feature pipelines (daily/weekly) + streaming feature updates for real-time scores
  - Predictive models: revenue forecast, churn risk, agent success likelihood
  - Anomaly detection: unsupervised detectors for cost spikes, agent drift
  - Exposed REST API: `POST /api/analytics/score`, `GET /api/analytics/report/:id`, `GET /api/analytics/models`
- Implementation notes:
  - Store features in a time-series / feature-store like table (`analytics_features`) and cache hot features in Redis.
  - Model execution runs in an isolated worker (container) with resource limits and a well-defined `IModelRunner` interface.
  - Keep prediction logic behind an abstraction so models (off-the-shelf or custom) can be swapped without changing callers.

#### 4.3 CRM & External Integrations (Weeks 20-23)
- Deliverables:
  - Pluggable connector system with adapters: Salesforce, HubSpot, Pipedrive + generic REST connector
  - Background sync scheduler with idempotent retries
  - OAuth connector flow + secrets stored per-tenant (encrypted)
  - Admin UI pages to register connectors (Super Admin / Tenant Settings)
- SOLID rules:
  - `ICRMConnector` is minimal; compose behaviour via smaller interfaces like `IContactSync`.
  - Connectors implement adapter pattern and register with `ConnectorRegistry`.
  - Use Dependency Inversion—controllers request `IConnectorFactory` to obtain connectors by name.

#### 4.4 Financial Module & Billing Enhancements (Weeks 21-24)
- Deliverables:
  - Invoice generation microservice (`POST /api/finance/invoices/generate`)
  - Expense tracking and budget enforcement per-tenant
  - Billing events stream (Kafka/Bull) for downstream processing
  - Tax reporting skeleton, exportable CSV/PDF reports
- Implementation notes:
  - Keep financial domain services small and testable: `InvoiceService`, `BillingCalculator`, `TaxService`.
  - Ensure strong domain boundaries; return money-related events to observability and governance systems.

#### 4.5 Reliability, Hardening & Runtime Controls (Weeks 22-25)
- Deliverables:
  - Quotas and rate-limits per tenant/agent (enforced in `backend/src/common/guards`)
  - Circuit breakers and bulkheads in agent execution paths
  - Spending caps: soft warnings + hard stops with approval paths
  - Resource monitoring and auto-throttling hooks
  - Chaos/resilience tests (fault injection for queues, DB latency, model timeouts)
- SOLID-driven design:
  - Abstract `IQuotaService` and `IThrottler` so different strategies can be swapped.
  - Single Responsibility: `QuotaEvaluator` only evaluates; `QuotaEnforcer` only acts.

#### 4.6 Testing, Observability & Safety (Weeks 23-26)
- Deliverables:
  - Extend unit/integration coverage for new modules (`analytics`, `connectors`, `finance`).
  - Golden-path e2e scenarios for billing and CRM sync.
  - Performance benchmarks for model scoring and vector queries.
  - End-to-end tracing for analytics requests (OpenTelemetry spans across pipeline).
  - Security review for connector OAuth flows and secrets handling.

#### 4.7 Data & Migrations
- Add tables and migrations (Prisma): `analytics_models`, `analytics_features`, `connectors`, `invoices`, `expenses`, `tenant_limits`.
- Provide seed scripts for demo models and sample analytics features (see `prisma/seed-tenant.cjs`).

#### 4.8 Acceptance Criteria
- Analytics API latency: p95 < 500ms for cached features, p95 < 2s for cold model runs.
- Predictive models produce verifiable baseline metrics (accuracy/precision/recall above agreed thresholds).
- CRM connectors perform idempotent syncs and recover from transient failures automatically.
- Financial module can generate an invoice for a tenant and emit a billing event.
- Quotas & spending caps prevent runaway agent execution in staged tests.
- All new code follows SOLID patterns and includes interface definitions in `backend/src/modules/*/interfaces`.

#### 4.9 Deliverables & Owners
- `backend/src/modules/analytics` — AnalyticsService, ModelRunner, FeatureStore (owner: Backend/ML)
- `backend/src/modules/connectors` — ConnectorRegistry, adapters (owner: Integrations)
- `backend/src/modules/finance` — InvoiceService, BillingCalculator (owner: Finance)
- `frontend-admin` & `frontend-tenant` — UIs for connector management and billing (owner: Frontend)
- Docs: Update `docs/PHASED_IMPLEMENTATION_PLAN.md` and add `docs/analytics.md` and `docs/connectors.md` (owner: Tech Writer)

#### 4.10 Timeline Summary
- Weeks 19-22: Analytics engine MVP + feature pipelines
- Weeks 20-23: CRM connectors + OAuth flows
- Weeks 21-24: Financial module MVP
- Weeks 22-25: Runtime hardening and quotas
- Weeks 23-26: Testing, observability, acceptance

---

---

### Phase 5: Advanced Agent Capabilities (Weeks 25-30)

#### 5.1 Multi-Agent Collaboration
- Agent-to-agent communication
- Consensus decision-making
- Conflict resolution
- Task delegation between agents
- Team performance optimization

#### 5.2 Fine-tuning & Custom Models
- Model fine-tuning pipeline
- Custom model training for domain knowledge
- Model versioning
- A/B testing framework for models

#### 5.3 Advanced Memory Systems
- Hierarchical memory management
- Semantic memory networks
- Skill memory abstraction
- Long-term learning system
- Memory compression for efficiency

---

### Phase 6: Enterprise Features (Weeks 31-36)

#### 6.1 SSO & Identity Integration
- SAML 2.0 support
- OKTA integration
- Azure AD integration
- Custom OIDC providers

#### 6.2 Compliance & Audit
- SOC 2 compliance features
- GDPR data deletion
- Audit trail improvements
- Compliance report generation
- Data residency options

#### 6.3 Advanced Security
- IP whitelisting per tenant
- VPC peering support
- Encryption at rest
- Field-level encryption
- Secret key rotation

---

### Phase 7: Marketplace & Ecosystem (Weeks 37-42)

#### 7.1 Plugin Marketplace
- Plugin development SDK
- Plugin installation UI
- Plugin versioning
- Rating & review system
- Commission system

#### 7.2 Template Library
- Workflow templates
- Agent templating system
- Industry-specific templates
- Template marketplace

#### 7.3 Integration Hub
- Pre-built connectors
- Webhook system
- API marketplace
- Data sync scheduling

---

### Phase 8: Scalability & Performance (Weeks 43-48)

#### 8.1 Performance Optimization
- Vector DB optimization
- Query result caching strategies
- Agent execution parallelization
- Response streaming for large datasets

#### 8.2 Global Distribution
- Multi-region deployment
- CDN integration
- Data replication strategy
- Region failover

---

## Technology Stack - Complete Reference

### Backend Services
```
Runtime: Node.js 20 LTS
Framework: NestJS 10.x
Language: TypeScript 5.x
ORM: Prisma 5.x
Validation: Zod
Testing: Jest 29.x

AI/ML:
- LangChain 0.1.x (orchestration, chains, memory)
- OpenAI SDK 4.x (GPT models)
- Anthropic SDK (Claude)
- Embedding: OpenAI embeddings API

Data:
- PostgreSQL 16 (primary DB)
- Supabase pgvector (vector storage)
- Redis 7 (caching, sessions, pubsub)
- Bull (task queue)

Observability:
- Pino (logging)
- OpenTelemetry (tracing)
- Prometheus (metrics)
- Grafana (visualization)

DevOps:
- Docker & Docker Compose
- GitHub Actions (CI/CD)
- Kubernetes (optional/future)
```

### Frontend Stack
```
Framework: Next.js 14.x (app router)
Runtime: React 18.x
Language: TypeScript 5.x
Styling: Tailwind CSS 3.x
State: Zustand
UI Components: Headless UI
Icons: Heroicons
Forms: React Hook Form
Validation: Zod
Data Tables: TanStack Table (React Table)
WebSocket: Socket.IO client
HTTP: Axios or Fetch API
Visualization: Recharts + ECharts
Charts: Framer Motion (animations)
Testing: Vitest + React Testing Library
```

### Infrastructure
```
Container Registry: Docker Hub / GitHub Container Registry
Deployment Options:
- AWS ECS (managed container service)
- Kubernetes (self-hosted or EKS)
- DigitalOcean App Platform
- Heroku (for MVP testing)

Databases:
- PostgreSQL 16 (managed: AWS RDS, DigitalOcean, Supabase)
- Redis 7 (managed: AWS ElastiCache, DigitalOcean, Upstash)

Observability Stack:
- Logs: ELK Stack or Datadog
- Metrics: Prometheus + Grafana
- Traces: Jaeger (open-source) or Datadog APM

Email: SendGrid or Mailgun
Storage: S3-compatible (AWS S3, MinIO)
```

---

## Code Organization & SOLID Architecture

### Backend Project Structure
```
backend/
├── src/
│   ├── common/
│   │   ├── filters/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   ├── pipes/
│   │   └── decorators/
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── services/
│   │   │   ├── controllers/
│   │   │   ├── entities/
│   │   │   └── dtos/
│   │   │
│   │   ├── agents/
│   │   │   ├── services/
│   │   │   │   ├── agent.service.ts
│   │   │   │   ├── planner.service.ts
│   │   │   │   ├── executor.service.ts
│   │   │   │   └── registry.service.ts
│   │   │   ├── interfaces/
│   │   │   │   ├── agent.interface.ts
│   │   │   │   ├── planner.interface.ts
│   │   │   │   └── executor.interface.ts
│   │   │   ├── entities/
│   │   │   ├── dtos/
│   │   │   └── controllers/
│   │   │
│   │   ├── memory/
│   │   │   ├── services/
│   │   │   ├── interfaces/
│   │   │   └── strategies/
│   │   │
│   │   ├── tools/
│   │   │   ├── services/
│   │   │   ├── interfaces/
│   │   │   ├── adapters/
│   │   │   └── executors/
│   │   │
│   │   ├── tasks/
│   │   ├── workflows/
│   │   ├── governance/
│   │   ├── observability/
│   │   └── notifications/
│   │
│   ├── infrastructure/
│   │   ├── database/
│   │   ├── cache/
│   │   ├── queue/
│   │   └── websocket/
│   │
│   └── app.module.ts
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── docker-compose.yml
├── Dockerfile
└── package.json
```

### Frontend Project Structure
```
frontend/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (tenant)/
│   │   │   ├── dashboard/
│   │   │   ├── agents/
│   │   │   ├── tasks/
│   │   │   ├── workflows/
│   │   │   ├── approvals/
│   │   │   ├── analytics/
│   │   │   ├── settings/
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (admin)/
│   │   │   ├── overview/
│   │   │   ├── tenants/
│   │   │   ├── agents/
│   │   │   ├── models/
│   │   │   ├── security/
│   │   │   ├── billing/
│   │   │   ├── logs/
│   │   │   ├── marketplace/
│   │   │   └── layout.tsx
│   │   │
│   │   └── layout.tsx
│   │
│   ├── components/
│   │   ├── common/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── ActivityStream.tsx
│   │   │   └── ...
│   │   │
│   │   ├── tenant/
│   │   │   ├── AgentCard.tsx
│   │   │   ├── KPITile.tsx
│   │   │   ├── WorkflowNode.tsx
│   │   │   ├── ApprovalModal.tsx
│   │   │   └── ...
│   │   │
│   │   └── admin/
│   │       ├── PlatformBrainMap.tsx
│   │       ├── TenantInspector.tsx
│   │       └── ...
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useAgent.ts
│   │   ├── useWebSocket.ts
│   │   └── ...
│   │
│   ├── store/
│   │   ├── authStore.ts
│   │   ├── agentStore.ts
│   │   ├── taskStore.ts
│   │   └── ...
│   │
│   ├── services/
│   │   ├── api.ts
│   │   ├── socket.ts
│   │   └── ...
│   │
│   ├── types/
│   │   ├── api.ts
│   │   ├── agent.ts
│   │   └── ...
│   │
│   └── styles/
│       └── globals.css
│
├── public/
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

### SOLID Principles Implementation

**Single Responsibility Principle**:
- Each service handles one domain (AgentService, TaskService, MemoryService)
- Controllers delegate to services
- Each utility file has one purpose

**Open/Closed Principle**:
- Abstract base Agent class
- Tool interface for extensibility
- Service interfaces for implementations
- New agent types can be added without modifying existing code

**Liskov Substitution Principle**:
- All agent types implement IAgent contract
- All tools implement ITool interface
- All memory strategies implement IMemoryStrategy
- Substitutable without breaking functionality

**Interface Segregation Principle**:
- Minimal interfaces (IAgent, ITool, IPlanner, etc.)
- Clients depend on specific interfaces, not broad ones
- Separate interfaces for different concerns

**Dependency Inversion Principle**:
- Services depend on abstractions (interfaces)
- Dependency injection via NestJS providers
- No hard dependencies on implementations
- Configuration-driven behavior

---

## Communication Protocol

### HTTP API Standards
```
All endpoints follow REST conventions:
- GET    /api/resource              (list)
- POST   /api/resource              (create)
- GET    /api/resource/:id          (read)
- PUT    /api/resource/:id          (update)
- DELETE /api/resource/:id          (delete)

Request/Response Format:
{
  "status": "success" | "error",
  "data": { ... },
  "error": { "code": "...", "message": "..." },
  "meta": { "timestamp": "...", "requestId": "..." }
}

Status Codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Server Error
```

### WebSocket Events
```
Real-time events via Socket.IO:

Namespace: /socket
Authentication: JWT in connection query

Events (Server → Client):
- agent:status_updated
- task:completed
- task:failed
- agent:error
- memory:updated
- approval:pending
- system:alert
- execution:trace_step

Events (Client → Server):
- agent:request_status
- task:execute
- agent:pause
- agent:resume
```

---

## Testing Strategy

### Unit Tests
- Service business logic
- Utility functions
- Individual components

### Integration Tests
- Database queries
- API endpoints
- Service interactions
- WebSocket events

### E2E Tests
- Complete user workflows
- Agent execution flows
- Approval processes

### Performance Tests
- Task execution benchmarks
- Memory query performance
- API response times

---

## Security Considerations

### Implementation Checklist
- [ ] Tenant data isolation enforced
- [ ] JWT token rotation
- [ ] Rate limiting on all endpoints
- [ ] Input validation (Zod)
- [ ] SQL injection prevention (Prisma)
- [ ] CORS properly configured
- [ ] HTTPS/TLS in production
- [ ] Secrets management (environment variables)
- [ ] Tool execution sandboxing
- [ ] Audit logging all actions
- [ ] API key rotation capability
- [ ] RBAC enforcement

---

## Monitoring & Observability

### Key Metrics
- Request latency (p50, p95, p99)
- Error rate by endpoint
- Agent success rate
- Token usage per tenant
- Cost per agent
- Memory query performance
- Queue depth & latency
- Cache hit rate

### Logging
- Structured JSON logging
- Log levels: ERROR, WARN, INFO, DEBUG
- Correlation IDs for tracing requests
- Sensitive data masking

### Alerting
- Error rate > 5%
- Response time > 2s
- Agent failure rate > 10%
- Spending anomalies
- Storage nearing capacity

---

## Deployment Checklist (Phase 3 Completion)

### Before Production Deployment
- [ ] All tests passing (100% critical paths)
- [ ] Code review completed
- [ ] Security audit completed
- [ ] Database backups configured
- [ ] Monitoring & alerting set up
- [ ] Runbooks for common issues
- [ ] Team trained on deployment
- [ ] Rollback plan documented
- [ ] Performance testing completed
- [ ] Load testing baseline established
- [ ] Documentation complete
- [ ] Disaster recovery tested

### Phase 3 Deployment Readiness
After completing Phase 3, the system is ready for:
- ✅ MVP production deployment
- ✅ Real tenant onboarding
- ✅ 24/7 monitoring
- ✅ Basic support operations
- ✅ Horizontal scaling (if needed)

---

## Success Metrics

### By End of Phase 1
- [ ] All core services deployed locally
- [ ] Authentication working
- [ ] Basic API responding to requests
- [ ] Frontend scaffold rendering

### By End of Phase 2
- [ ] Multiple agent types operational
- [ ] Real-time WebSocket communication
- [ ] Agent executing tasks with tools
- [ ] Memory system persisting data
- [ ] Basic UI functional

### By End of Phase 3 (MVP Ready)
- [ ] Complete tenant portal functional
- [ ] Complete super admin portal functional
- [ ] All SOLID principles applied
- [ ] Governance rules enforced
- [ ] Observability collecting metrics
- [ ] Zero shared code between frontend/backend
- [ ] Production deployment configured
- [ ] CI/CD fully automated
- [ ] **Ready for real-world MVP deployment**

---

## Risk Management

### Identified Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|-----------|
| LangChain API changes | High | Medium | Pin versions, monitor releases, test compatibility |
| Vector DB performance | High | Medium | Benchmark early, shard strategy planned, fallback options |
| Multi-tenant data leak | Critical | Low | Isolation at DB layer, query middleware validation |
| Agent runaway costs | High | Medium | Spending limits enforced, model routing optimization |
| WebSocket scaling | Medium | Low | Connection pooling, horizontal scaling plan |
| Auth token hijacking | High | Low | HTTPS enforced, token rotation, secure storage |

---

## Next Steps

1. **Immediately**: Create repository structure & initialize projects
2. **Week 1**: Start Phase 1 setup (infrastructure)
3. **Week 3**: Begin Phase 2 planning (agent runtime design)
4. **Week 7**: Start Phase 2 implementation
5. **Weekly**: Team sync-ups with progress tracking
6. **Bi-weekly**: Architecture & design reviews
7. **End of Phase 3**: Production deployment readiness review

---

## Appendix: Command Reference

### Development Setup
```bash
# Clone and setup backend
git clone <repo>
cd backend
npm install
docker-compose up -d
npx prisma migrate dev

# Setup frontend
cd ../frontend
npm install
npm run dev
```

### Deployment Commands
```bash
# Build for production
docker build -t neurecore-backend:latest .

# Push to registry
docker push <registry>/neurecore-backend:latest

# Deploy (Kubernetes example)
kubectl apply -f k8s/

# Check deployment status
kubectl rollout status deployment/backend
```

### Testing
```bash
npm test                    # Unit tests
npm run test:integration   # Integration tests
npm run test:e2e          # End-to-end tests
npm run test:coverage     # Coverage report
```

---

**Document Version**: 1.0  
**Last Updated**: February 2026  
**Status**: Ready for Implementation
