# NeureCore Gold — Development Plan

**Goal**: Create a platform where Admins provision specialized AI agents (HR, Finance, etc.) and Users configure them on their company desktop.

**Current Status**: Phase 1 (Foundation) is 98% complete. Agent infrastructure (LangGraph, Streaming, Tools) is implemented but requires integration and testing.

---

## Phase 1: Immediate Implementation (Dev & Production Ready)

**Objective**: Stabilize the current system, fix Vercel deployment issues, and ensure the core agent loop works end-to-end.

### 1.1 Infrastructure & Deployment

- [ ] **Fix Vercel Domain Linking**:
  - Link `cc.neurecore.com` to `neurecore-cc` project.
  - Link `brain.neurecore.com` to `neurecore-back` project.
  - Verify backend API routing on Vercel (NestJS serverless function paths).
- [ ] **Database Migration**:
  - Run `npx prisma migrate status` on production (Neon) to verify all migrations are applied.
  - If needed, apply pending migrations.
- [ ] **Environment Variables**:
  - Ensure all required env vars are set in Vercel (especially `JWT_SECRET`, `DATABASE_URL`, `REDIS_URL`, `MIMO_API_KEY`, `OPENCLAW_API_KEY`).

### 1.2 Agent Execution Core

- [ ] **Integrate Official LangGraph**:
  - Replace custom `AgentStateMachine` with `OfficialAgentGraph` in `agents.module.ts`.
  - Update `AgentExecutorService` to use the official graph execution.
  - Verify state transitions (Plan → Execute → Tool → Evaluate).
- [ ] **Fix Streaming Integration**:
  - Ensure `AgentStreamingService` emits events during LangGraph execution.
  - Verify SSE endpoint `/api/v1/agents/streaming/sessions/:id/events` streams events correctly.
  - Test frontend `agent-streaming.service.ts` connection and event handling.
- [ ] **Tool Registry Activation**:
  - Verify `StructuredToolRegistry` is populated with built-in tools (Calculator, HTTP).
  - Ensure `AgentExecutorService` can fetch and execute tools via the registry.

### 1.3 Frontend Connectivity

- [ ] **Tenant Portal Agent Desktop**:
  - Verify `frontend-tenant` can fetch agents via `AgentRepository`.
  - Test agent configuration UI (update instructions, permissions).
  - Test task dispatch to agent (via SSE streaming).
- [ ] **Admin Portal Agent Management**:
  - Verify Admin can create/update agent templates.
  - Test `POST /deploy/agents/from-template/:templateId` to spawn agents for tenants.

### 1.4 Testing & Validation

- [ ] **Unit Tests**:
  - Run `npm run test:cov` in backend.
  - Target 70% coverage for `agents`, `tools`, `streaming` modules.
- [ ] **Integration Tests**:
  - Test agent creation → task dispatch → execution → result retrieval.
  - Test SSE streaming end-to-end.
- [ ] **Manual Testing**:
  - Login as Admin → Create Agent Template → Deploy to Tenant.
  - Login as Tenant → View Agent → Configure → Dispatch Task → Monitor Streaming.

---

## Phase 2: Feature Completion

**Objective**: Complete the agent ecosystem with memory, multi-agent patterns, and enhanced tooling.

### 2.1 Agent Memory & Context

- [ ] **Conversation Memory**:
  - Implement Redis-backed memory storage (`MemoryEntry` model).
  - Add memory retrieval to agent planning/execution.
  - Support short-term, long-term, and episodic memory types.
- [ ] **Context Window Management**:
  - Implement token counting and truncation strategies.
  - Add system prompt templating with dynamic context injection.

### 2.2 Multi-Agent Patterns

- [ ] **Supervisor/Worker Pattern**:
  - Create `SupervisorAgent` that delegates tasks to specialized workers.
  - Implement routing logic based on task type.
- [ ] **Hierarchical Agents**:
  - Support department-based agent hierarchies (Head Agent → Department Agents).
  - Integrate with `Department` model in Prisma.
- [ ] **Parallel Execution**:
  - Allow multiple agents to execute tasks concurrently.
  - Implement task queue with priority levels.

### 2.3 Enhanced Tooling

- [ ] **File Operations**:
  - Create `FileTool` for reading/writing files (sandboxed).
  - Integrate with agent execution context.
- [ ] **Database Tool**:
  - Create `DatabaseTool` for querying tenant data (read-only).
  - Enforce row-level security (RLS) via `tenantId`.
- [ ] **HTTP Request Tool**:
  - Enhance `HttpRequestEnhancedTool` with auth headers, retries, and error handling.
  - Support OAuth2 flows for external APIs.

### 2.4 Observability & Debugging

- [ ] **LangSmith Tracing**:
  - Integrate `LangSmithTracingService` into agent execution.
  - Track latency, token usage, and cost per run.
- [ ] **Execution Logs**:
  - Persist detailed logs to `ExecutionLog` model.
  - Add frontend UI for viewing agent execution history.

---

## Phase 3: Enhanced Features (Admin & User Power)

**Objective**: Give Admins deep control over the platform and Users rich configuration options.

### 3.1 Admin Controls

- [ ] **Agent Template Marketplace**:
  - Platform-wide templates (public) vs. tenant-specific templates.
  - Template versioning and rollback.
- [ ] **Performance Monitoring**:
  - Dashboard for agent performance metrics (success rate, latency, cost).
  - Alerting for anomalous behavior (governance rules).
- [ ] **Budget & Quota Management**:
  - Set daily/weekly spend limits per agent/tenant.
  - Enforce quotas via `ReliabilityModule`.
- [ ] **Governance & Approvals**:
  - Configure approval workflows for sensitive tasks.
  - Audit trail for all agent actions.

### 3.2 User Desktop Enhancements

- [ ] **Agent Configuration UI**:
  - Visual editor for agent instructions (markdown support).
  - Permission matrix (toggle allowed actions).
  - Budget slider (daily spend cap).
- [ ] **Workflow Builder**:
  - Drag-and-drop interface for creating agent workflows.
  - Export/import workflow definitions.
- [ ] **Real-time Collaboration**:
  - Multi-user editing of agent configurations.
  - Presence indicators (who's viewing/editing).

### 3.3 Integration & Extensibility

- [ ] **API Keys & Webhooks**:
  - Allow users to generate API keys for their agents.
  - Webhook notifications for agent events.
- [ ] **Custom Tools**:
  - User-uploaded tool definitions (JSON schema).
  - Tool sandboxing and security review.
- [ ] **Model Switching**:
  - User-selectable LLM models per agent (MiMo, DeepSeek, MiniMax).
  - Cost optimization based on task complexity.

---

## Phase 4: Production Hardening

**Objective**: Ensure scalability, security, and reliability for production workloads.

### 4.1 Performance & Scaling

- [ ] **Horizontal Scaling**:
  - Stateless agent execution (no in-memory state).
  - Redis cluster for session management.
- [ ] **Database Optimization**:
  - Index optimization for frequent queries (agents, tasks, logs).
  - Connection pooling and query batching.
- [ ] **Caching Layer**:
  - Semantic cache for repeated LLM queries.
  - Tool result caching.

### 4.2 Security & Compliance

- [ ] **Data Isolation**:
  - Verify row-level security on all database queries.
  - Encrypt sensitive data (API keys, credentials).
- [ ] **Audit Logging**:
  - Comprehensive audit trail for all admin and user actions.
  - Log retention policies.
- [ ] **Rate Limiting**:
  - Per-tenant LLM API quotas.
  - DDoS protection for streaming endpoints.

### 4.3 Reliability & Monitoring

- [ ] **Circuit Breakers**:
  - LLM API failure handling (fallback models).
  - Tool execution timeouts and retries.
- [ ] **Health Checks**:
  - Deep health checks for all dependencies (DB, Redis, LLM APIs).
  - Alerting for degraded performance.
- [ ] **Disaster Recovery**:
  - Database backups (Neon).
  - Rollback procedures for deployments.

---

## Immediate Next Steps (This Week)

1.  **Fix Vercel domains** (Admin & Backend).
2.  **Run database migration status** on production.
3.  **Integrate Official LangGraph** into agent execution.
4.  **Test SSE streaming** end-to-end (Backend → Frontend).
5.  **Manual test**: Admin deploys agent → User configures → User dispatches task.

**Estimated Effort**: 3-5 days (Phase 1 completion).
