# Departments & Prebuilt Business AI Agents — SuperAdmin Implementation Audit

**Date:** Feb 19, 2026  
**Updated:** March 18, 2026
**Status:** Phase 1 ~95% Complete - Integration Testing

---

## Executive Summary

The backend has **solid foundational data models and CRUD APIs** for both Departments and Agent Templates. The frontend-admin portal has **agent listing and basic controls**, but lacks SuperAdmin-specific workflows for **creating, managing, deploying, and monitoring prebuilt agent templates to tenants**.

### Quick Stats

- ✅ **Backend Database Schema:** Department, Agent, AgentTemplate tables fully designed
- ✅ **Backend CRUD APIs:** ~80% implemented (controllers, services)
- ⚠️ **SuperAdmin Frontend:** ~20% implemented (missing template marketplace, deployment flows)
- ❌ **Tenant Agent Template Sync:** Not yet implemented

---

## PART 1: DEPARTMENTS CONCEPT & IMPLEMENTATION

### 1.1 What the Concept Says

From [docs/concept.md](docs/concept.md#6-agent-system-architecture):

- **Departments = organizational units** that group agents by business function (Finance, Sales, Ops, etc.)
- **Hierarchical structure** (parent/child relationships) mirroring real org charts
- **Department head agent** optionally assigned to lead the department
- **Department-scoped agents** inherit department context, KPIs, budgets, authority rules
- **UI = left sidebar org tree** (draggable, collapsible) + department analytics/workflows

### 1.2 Backend Implementation Status

#### ✅ Completed

| Component      | Status | Details                                                                                                                            |
| -------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| Prisma Schema  | ✅     | `Department` model with `parentId` (self-relation), `headAgentId`, `status`, metadata                                              |
| Database Enums | ✅     | `DepartmentStatus: { ACTIVE, INACTIVE }`                                                                                           |
| Controller     | ✅     | [backend/src/modules/departments/departments.controller.ts](backend/src/modules/departments/departments.controller.ts)             |
| Service        | ✅     | [backend/src/modules/departments/services/departments.service.ts](backend/src/modules/departments/services/departments.service.ts) |
| CRUD Endpoints | ✅     | `GET /api/v1/departments`, `POST`, `PATCH`, `DELETE` (tenant-scoped)                                                               |
| DTO Validation | ✅     | [backend/src/modules/departments/dto/department.dto.ts](backend/src/modules/departments/dto/department.dto.ts)                     |

#### ❌ Not Yet Implemented

| Gap                             | Impact                                                   | Fix                                                                |
| ------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------ |
| SuperAdmin department templates | Admins can't create org-chart blueprints for new tenants | Create `DepartmentTemplate` model + CRUD endpoints                 |
| Bulk department creation        | Slow onboarding for new tenants                          | Add batch endpoint `/departments/create-from-template/:templateId` |
| Department KPI aggregation      | Can't track dept performance                             | Add `@Get(':id/metrics')` endpoint that sums agent metrics         |
| Parent-child cycle validation   | Data corruption risk                                     | Add constraint check in `update()` method                          |

#### Frontend Not Started

- ❌ Department management page in SuperAdmin UI
- ❌ Org chart visualization component
- ❌ Department template library

---

## PART 2: PREBUILT BUSINESS AI AGENTS — DETAILED BREAKDOWN

### 2.1 What the Concept Says

From [docs/concept.md](docs/concept.md#6-agent-system-architecture) & [docs/agent-dsk](docs/agent-dsk):

- **Agent Types:** CORE, FUNCTIONAL, EXECUTIVE, META
- **Prebuilt templates** for each tier (Starter, Growth, Enterprise, Autonomous)
- **Templates include:** name, role, permissions, systemPrompt, model, config, tools
- **Marketplace of agents** — SuperAdmin publishes; tenants deploy instances
- **Agent spawning** — tenant creates agent from template (copy + customize)
- **Authority levels:** Auto, Recommend, Approval-required

### 2.2 Backend Implementation Status

#### ✅ Completed

| Component                      | Status | Details                                                                                                                                |
| ------------------------------ | ------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| **AgentTemplate Schema**       | ✅     | `AgentTemplate` with `isPublic`, `version`, tenantId (platform vs org-specific)                                                        |
| **Agent Schema**               | ✅     | `Agent` with `templateId`, `type`, `status`, `budgetPerDay`, `permissions`, `config`                                                   |
| **AgentTemplate Controller**   | ✅     | [backend/src/modules/agent-templates/agent-templates.controller.ts](backend/src/modules/agent-templates/agent-templates.controller.ts) |
| **AgentTemplate Service**      | ✅     | [backend/src/modules/agent-templates/agent-templates.service.ts](backend/src/modules/agent-templates/agent-templates.service.ts)       |
| **Template CRUD (SuperAdmin)** | ✅     | `POST /api/v1/agent-templates/platform` (create platform template)                                                                     |
| **Template visibility**        | ✅     | Public templates (tenantId=null, isPublic=true) visible to all tenants                                                                 |
| **Agent CRUD (Tenant)**        | ✅     | `POST /api/v1/agents` (create agent from template or blank)                                                                            |
| **Tenant-specific templates**  | ✅     | Tenants can create private templates (isPublic=false, has tenantId)                                                                    |
| **DTO validation**             | ✅     | `CreateAgentTemplateDto`, `CreateAgentDto` with proper class-validator decorators                                                      |

#### ⚠️ Partially Implemented

| Component                    | Status | Details                                                                                                                                                                                    |
| ---------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Agent Executor**           | ⚠️     | [backend/src/modules/agents/services/agent-executor.service.ts](backend/src/modules/agents/services/agent-executor.service.ts) exists but needs LangChain integration for actual reasoning |
| **Agent Templates → Agents** | ⚠️     | Service supports `templateId` field but **no endpoint to spawn from template** with pre-filled fields                                                                                      |
| **Template categorization**  | ⚠️     | Can filter by `type` but no tagging system (industry, dept-specific)                                                                                                                       |

#### ❌ Not Yet Implemented

| Gap                                          | Impact                                                        | Effort | Fix                                                                                               |
| -------------------------------------------- | ------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------- |
| **SuperAdmin Agent Template marketplace UI** | Admins can't browse/create/manage platform templates visually | High   | Create `/agent-templates` page in frontend-admin with CRUD forms                                  |
| **Spawn agent from template endpoint**       | Tedious to create agents from templates (no auto-fill)        | Medium | Add `POST /agents/from-template/:templateId` that copies all fields except `name`, `budgetPerDay` |
| **Prebuilt templates seed data**             | New installations have no starter agents                      | Low    | Add Prisma seed script with 10-15 prebuilt templates (CFO, Sales, Ops, etc.)                      |
| **Template version management**              | Can't rollback bad template updates                           | Medium | Add `version` field tracking + `/templates/:id/versions` endpoint                                 |
| **Bulk tenant agent deployment**             | Can't push agents to many tenants at once                     | Medium | Add `POST /tenants/:id/deploy-agents` with template list                                          |
| **Agent authority/approval rules**           | No enforcement of spending limits, approval chains            | High   | Integrate Governance module + ApprovalRequest checks before agent acts                            |
| **Clone agent with custom name**             | Users must manually fill all fields after cloning             | Low    | Add `POST /agents/:id/clone` endpoint                                                             |

---

## PART 3: FRONTEND-ADMIN CURRENT STATE

### 3.1 What Already Exists

#### ✅ Routes & Pages

| Route         | Page                                                                                 | Status                                          |
| ------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------- |
| `/agents`     | [frontend-admin/src/app/agents/page.tsx](frontend-admin/src/app/agents/page.tsx)     | ✅ Lists all agents across tenants with filters |
| `/tenants`    | [frontend-admin/src/app/tenants/page.tsx](frontend-admin/src/app/tenants/page.tsx)   | ✅ Lists tenants, basic info                    |
| `/overview`   | [frontend-admin/src/app/overview/page.tsx](frontend-admin/src/app/overview/page.tsx) | ✅ KPIs, charts, quick nav                      |
| `/users`      | [frontend-admin/src/app/users/page.tsx](frontend-admin/src/app/users/page.tsx)       | ✅ Lists users by role                          |
| `/audit`      | [frontend-admin/src/app/audit/page.tsx](frontend-admin/src/app/audit/page.tsx)       | ✅ Audit log viewer                             |
| `/monitoring` |                                                                                      | ⚠️ Stub exists                                  |
| `/brain`      |                                                                                      | ⚠️ Stub exists (brain map visualization)        |

#### ✅ Components

- `AgentCard` — tile-based agent display with status, workload
- `KpiTile` — metric dashboard tiles
- `AdminShell` — layout wrapper with sidebar, top bar
- `DataTable` — reusable table component
- `Inspector` — right-panel detail viewer

#### ✅ Utilities

- `api.service.ts` — HTTP client with JWT auth
- `useAdminAuth` hook — role-based auth guard
- `unwrapList()` — response unwrapping helper

### 3.2 What's Missing

#### ❌ **Agent Template Management Page**

- **Path:** `/agent-templates` (doesn't exist)
- **Needed UI:**
  - List platform templates (searchable, filterable by type)
  - Create new platform template (form with fields: name, description, type, model, systemPrompt, instructions, permissions, config)
  - Edit / Delete templates
  - Preview template details in inspector panel
  - Version history viewer
  - Clone templates

#### ❌ **Departments Management Page**

- **Path:** `/departments` (doesn't exist)
- **Needed UI:**
  - Hierarchical org-chart tree view
  - Create/Edit department form
  - Assign head agent to department
  - Audit department changes
  - Bulk import org structure

#### ❌ **Tenant Agent Deployment Workflow**

- **Missing flow:**
  1. Admin selects tenant
  2. Admin chooses agents to deploy (from template library)
  3. Admin customizes agent configs per-tenant
  4. Admin deploys (batch create agents)
  5. UI confirms deployment status

#### ❌ **Agent Template Marketplace**

- **Visual difference:** Current agent page = **global fleet view** (all agents across all tenants)
- **Missing:** **Template library view** (curated templates, ratings, usage stats)

---

## PART 4: SUPERADMIN MANAGEMENT FLOWS — WHAT NEEDS BUILDING

### 4.1 The Complete SuperAdmin Workflow for Departments

```
SuperAdmin Portal
  └─ Departments (NEW PAGE)
      ├─ View organization templates
      │   ├─ List predefined org structures (Startup, Scale-up, Enterprise)
      │   └─ Import template → populate departments for selected tenant
      ├─ Manage department library
      │   ├─ + Create new department template
      │   ├─ Search / filter
      │   ├─ Edit → name, description, parent dept, head agent role
      │   └─ Delete
      └─ Per-tenant org management (via Tenants page)
          ├─ Select tenant
          ├─ View current org tree
          ├─ Add department
          ├─ Assign head agent
          ├─ Audit changes
```

### 4.2 The Complete SuperAdmin Workflow for Agents & Templates

```
SuperAdmin Portal
  └─ Agent Templates (NEW PAGE)
      ├─ Template Library
      │   ├─ Filters: Type (CORE, FUNCTIONAL, EXECUTIVE), Status, Industry
      │   ├─ List: name | type | version | tenants using | last updated
      │   ├─ Search: by name, description
      │   └─ Actions per template:
      │       ├─ View details (inspector right panel)
      │       ├─ Edit configuration
      │       ├─ View version history
      │       ├─ Clone as new template
      │       ├─ Publish/unpublish
      │       └─ Delete
      ├─ Create new template form
      │   ├─ Name, Description, Type
      │   ├─ Model selection (dropdown: gpt-4o, claude-opus, etc)
      │   ├─ System Prompt editor (with syntax highlighting)
      │   ├─ Instructions editor
      │   ├─ Permissions (checklist: can_email, can_transfer_funds, etc)
      │   ├─ Config (JSON editor for advanced settings)
      │   ├─ Save as draft / Publish
      │   └─ Preview rendered template
      └─ Bulk deployment
          ├─ Select template(s)
          ├─ Choose tenant(s) to deploy to
          ├─ Customize per-tenant (budget, authority level)
          └─ Execute bulk agent creation
```

---

## PART 5: DETAILED IMPLEMENTATION ROADMAP

### Phase 5A: Backend Enhancements (1-2 weeks)

#### Task 1: Add SuperAdmin Department Template Management

```typescript
// New: DepartmentTemplate model
model DepartmentTemplate {
  id: String @id @default(uuid())
  name: String          // "Startup", "Scale-up", "Enterprise"
  description: String?
  structure: Json       // Array of {name, parentId, type}
  isPublic: Boolean @default(true)
  createdAt: DateTime
  updatedAt: DateTime
}

// New endpoints:
POST   /api/v1/department-templates              (SuperAdmin: create)
GET    /api/v1/department-templates              (SuperAdmin: list)
POST   /api/v1/tenants/:tenantId/departments/bulk (SuperAdmin: deploy org template)
```

#### Task 2: Add "Spawn from Template" Endpoint

```typescript
// New endpoint:
POST /api/v1/agents/from-template/:templateId
Request:
{
  "name": "My Sales Bot v2",
  "tenantId": "...",
  "customizations": { "budgetPerDay": 50 }
}
// Copies all template fields, returns new Agent record
```

#### Task 3: Seed Platform Templates

```javascript
// New: prisma/seed-templates.ts
// Create ~15 prebuilt templates:
// - CFO (finance), Sales Manager, Operations, Marketing, HR, etc.
// Run: npm run seed:templates
```

#### Task 4: Add Template Version Tracking

```typescript
// Extend AgentTemplate:
version: String @default("1.0.0")
previousVersionId: String?

// Add endpoint:
GET /api/v1/agent-templates/:id/versions
GET /api/v1/agent-templates/:id/versions/:versionId/diff
```

#### Task 5: Add KPI Aggregation to Departments

```typescript
// New endpoint:
GET /api/v1/departments/:id/metrics
Response:
{
  "totalAgents": 3,
  "totalTasks": 145,
  "successRate": 94.2,
  "avgCostPerTask": 0.32,
  "spending": { "today": 45.23, "month": 1203.45 }
}
```

---

### Phase 5B: Frontend Admin Pages (2-3 weeks)

#### Task 1: Agent Templates Management Page

```
Path: /agent-templates
Components needed:
  ├─ TemplateLibraryPage.tsx
  │   ├─ Search + Filters (Type, Status, Model, Industry tag)
  │   ├─ TemplateGrid.tsx (card-based) OR TemplateTable.tsx
  │   ├─ Create template button → modal/form
  │   ├─ Inspector panel (right side) when template selected
  │   └─ Bulk actions (delete, publish, deploy)
  ├─ TemplateForm.tsx (reusable create/edit form)
  │   ├─ Text inputs (name, description)
  │   ├─ Dropdown (type, model)
  │   ├─ TextArea + syntax highlighting (systemPrompt, instructions)
  │   ├─ Checkbox group (permissions)
  │   ├─ JSON editor (config)
  │   └─ Submit buttons (save draft, publish)
  ├─ TemplateInspector.tsx (right panel details)
  │   ├─ Template metadata
  │   ├─ Version info + rollback link
  │   ├─ Tenants using this template
  │   ├─ Clone / Edit / Delete buttons
  │   └─ Deployment history
  └─ VersionHistoryModal.tsx
      ├─ Timeline of versions
      ├─ Diff viewer
      └─ Rollback action
```

#### Task 2: Departments Management Page

```
Path: /departments (or under /admin/governance/departments)
Components needed:
  ├─ DepartmentsPage.tsx
  │   ├─ OrgChartTree.tsx (Framer Motion + React Flow?)
  │   │   ├─ Draggable departments
  │   │   ├─ Click → edit/delete
  │   │   └─ + Add department button
  │   ├─ DepartmentForm.tsx (modal for create/edit)
  │   │   ├─ Name, Description
  │   │   ├─ Parent department dropdown
  │   │   ├─ Head agent selector
  │   │   └─ Status toggle (ACTIVE/INACTIVE)
  │   ├─ OrgTemplateImporter.tsx (modal)
  │   │   ├─ Select org template from library
  │   │   ├─ Preview structure
  │   │   └─ Deploy to tenant
  │   └─ DepartmentInspector.tsx (right panel)
  │       ├─ Agents in this department
  │       ├─ KPI summary
  │       └─ Audit log
  └─ DepartmentMetricsCard.tsx (dashboard widget on overview)
      └─ Department health/performance
```

#### Task 3: Tenant Agent Deployment Workflow

```
Path: /tenants/:tenantId/agents (or new sub-tab on /tenants)
UI components:
  ├─ TenantAgentsPage.tsx
  │   ├─ "Deploy agents" CTA button
  │   ├─ Current agents list
  │   └─ Deployment history
  ├─ DeployAgentsModal.tsx
  │   ├─ Step 1: Select templates from library
  │   ├─ Step 2: Customize per agent (name, budget, authority)
  │   ├─ Step 3: Review + Deploy
  │   └─ Step 4: Confirmation + status tracker
  └─ AgentDeploymentCard.tsx (shows deployment progress)
```

#### Task 4: Update /agents Page (SuperAdmin Context)

```
Enhancement to existing page:
  ├─ Add column: "Template version"
  ├─ Add bulk action: "Rollback agent to older template version"
  ├─ Add filter: "Show only agents from template X"
  ├─ Inspector → show agent-template relationship + diff
  └─ Context menu → "Clone agent to other tenant"
```

---

### Phase 5C: Integrations & Polish (1-2 weeks)

#### Task 1: Connect Governance Module

- Approval workflow for agent creation (if budget > threshold)
- Spending limit enforcement per department
- Authority rule validation before agent acts

#### Task 2: Add WebSocket Events

- Real-time template updates across admins
- Agent deployment progress streaming
- Department org chart sync across all admin sessions

#### Task 3: Add Marketplace/Rating System (Optional V2)

- Star rating on templates by tenants
- Usage statistics (# agents spawned from template)
- Community-contributed templates

#### Task 4: Add Analytics

- Template performance dashboard (success rate, avg cost)
- Department KPI aggregation
- Org-wide agent fleet health summary on overview page

---

## PART 6: EXACT IMPLEMENTATION CHECKLIST

### Backend

**Sprint 1 (Days 1-5):**

- [ ] Create `DepartmentTemplate` Prisma model + migration
- [ ] Create `POST /api/v1/department-templates` endpoint (SuperAdmin only)
- [ ] Create `GET /api/v1/department-templates` with filtering
- [ ] Create `POST /api/v1/agents/from-template/:templateId` endpoint
- [ ] Add `GET /api/v1/departments/:id/metrics` endpoint
- [ ] Write seed script for 15 prebuilt agent templates
- [ ] Add unit tests for all new endpoints

**Sprint 2 (Days 6-10):**

- [ ] Version tracking for `AgentTemplate` (prev version, changelog)
- [ ] `POST /api/v1/tenants/:tenantId/departments/bulk-create` endpoint
- [ ] `POST /api/v1/tenants/:tenantId/agents/bulk-deploy` endpoint
- [ ] Validate parent-child cycles in departments
- [ ] Add `departmentId` field to `Agent` model (optional department assignment)
- [ ] E2E tests for deployment workflows

### Frontend Admin

**Sprint 1 (Days 1-7):**

- [ ] Create `/agent-templates` route & page structure
- [ ] Build `TemplateForm.tsx` (create/edit)
- [ ] Build `TemplateGrid.tsx` or `TemplateTable.tsx` (list)
- [ ] Build `TemplateInspector.tsx` (right panel)
- [ ] Connect to backend API (`GET`, `POST`, `PATCH`, `DELETE` templates)
- [ ] Add search + filtering
- [ ] Test with mock data

**Sprint 2 (Days 8-14):**

- [ ] Create `/admin/departments` page (or sub-route under governance)
- [ ] Build `OrgChartTree.tsx` (Framer Motion or React Flow)
- [ ] Build `DepartmentForm.tsx` modal
- [ ] Build `OrgTemplateImporter.tsx` for bulk deployment
- [ ] Build `DepartmentInspector.tsx` (right panel)
- [ ] Connect to backend API

**Sprint 3 (Days 15-18):**

- [ ] Create tenant agent deployment workflow in `/tenants/:id/agents`
- [ ] Build `DeployAgentsModal.tsx` (multi-step wizard)
- [ ] Build `AgentDeploymentCard.tsx` (progress tracker)
- [ ] Update `/agents` page: add template reference column, bulk actions
- [ ] Add WebSocket integration for real-time updates
- [ ] Polish, accessibility, dark mode testing

---

## PART 7: API ENDPOINT REFERENCE

### SuperAdmin-Only Endpoints (To Implement)

```
# Department Templates
POST   /api/v1/department-templates              (create)
GET    /api/v1/department-templates              (list)
GET    /api/v1/department-templates/:id          (read one)
PATCH  /api/v1/department-templates/:id          (update)
DELETE /api/v1/department-templates/:id          (delete)

# Agent from Template
POST   /api/v1/agents/from-template/:templateId  (spawn agent from template)

# Bulk Deployments
POST   /api/v1/tenants/:tenantId/departments/bulk-create  (deploy org structure)
POST   /api/v1/tenants/:tenantId/agents/bulk-deploy       (deploy multiple agents)

# Templates (Existing SuperAdmin Routes - Via /platform path)
POST   /api/v1/agent-templates/platform          (create platform template)
GET    /api/v1/agent-templates/platform          (list platform templates)
GET    /api/v1/agent-templates/platform/:id      (read one)
PATCH  /api/v1/agent-templates/platform/:id      (update)
DELETE /api/v1/agent-templates/platform/:id      (delete)

# Metrics
GET    /api/v1/departments/:id/metrics           (dept KPI aggregation)
```

### Existing Endpoints Already Available

```
# Departments (Tenant-scoped, but SuperAdmin can impersonate)
GET    /api/v1/departments
POST   /api/v1/departments
PATCH  /api/v1/departments/:id
DELETE /api/v1/departments/:id

# Agents (Tenant-scoped)
GET    /api/v1/agents
POST   /api/v1/agents           (create blank agent)
PATCH  /api/v1/agents/:id
DELETE /api/v1/agents/:id

# Agent Templates (Tenant-visible)
GET    /api/v1/agent-templates  (see public + tenant-specific)
POST   /api/v1/agent-templates  (create tenant private template)
```

---

## PART 8: DATA MODEL ADDITIONS

### Prisma Schema Additions Needed

```prisma
// ─── Department Template (NEW) ─────────────────────────────────
model DepartmentTemplate {
  id          String   @id @default(uuid())
  name        String
  slug        String   @unique
  description String?  @db.Text
  structure   Json     @default("[]")  // [{ name, parentId?, type? }]
  preview     String?  // HTML preview of org chart
  isPublic    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([isPublic])
  @@map("department_templates")
}

// ─── Enhance Agent Model ──────────────────────────────────────
// Add to existing Agent:
  departmentId  String?                      // Which department agent belongs to
  department    Department?  @relation(fields: [departmentId], references: [id])
  templateId    String?                      // Track which template spawned this agent
  templateVersion String?                    // Snapshot template version at creation time

// ─── Enhance AgentTemplate Model ──────────────────────────────
// Add to existing AgentTemplate:
  version      String  @default("1.0.0")    // Semantic version
  previousId   String?                        // Link to prior version
  changelog    String?  @db.Text             // What changed from prior version
  usageCount   Int      @default(0)          // # agents spawned from this template
  rating       Float?                        // Average tenant rating
  tags         Json    @default("[]")        // ["finance", "startup", "usa"]
```

---

## SUMMARY: EFFORT ESTIMATES

| Component                                    | Status   | Days           | Priority       |
| -------------------------------------------- | -------- | -------------- | -------------- |
| **Backend:** DepartmentTemplate model + CRUD | todo     | 2-3            | P0             |
| **Backend:** Spawn-from-template endpoint    | todo     | 1-2            | P0             |
| **Backend:** Department metrics              | todo     | 1              | P1             |
| **Backend:** Seed templates                  | todo     | 1-2            | P1             |
| **Backend:** Bulk deployment endpoints       | todo     | 2-3            | P1             |
| **Frontend:** Agent Templates page           | todo     | 3-4            | P0             |
| **Frontend:** Departments page               | todo     | 3-4            | P0             |
| **Frontend:** Tenant deployment workflow     | todo     | 2-3            | P0             |
| **Frontend:** Updates & refinements          | todo     | 2              | P2             |
| **Testing:** Unit + E2E tests                | todo     | 3-4            | P1             |
| **Documentation:** API docs + user guide     | todo     | 1-2            | P2             |
| **TOTAL**                                    | **todo** | **22-28 days** | **~5-6 weeks** |

---

## QUICK START: What to Do First

**If starting TODAY:**

1. **Day 1-2:** Backend
   - Add `DepartmentTemplate` model & migration
   - Write CRUD service + controller
   - Write seed script (15 templates)

2. **Day 3-4:** Backend
   - Add `POST /agents/from-template/:id` endpoint
   - Add `GET /departments/:id/metrics` endpoint

3. **Day 5-6:** Frontend
   - Create `/agent-templates` page skeleton
   - Build `TemplateForm.tsx` & `TemplateGrid.tsx`
   - Wire up to APIs

4. **Day 7-10:** Frontend
   - Create `/departments` page & `OrgChartTree.tsx`
   - Build `DepartmentForm.tsx`
   - Test E2E

5. **Day 11+:** Deployment workflows, polish, testing

---

## Questions for Product/Design Team

1. **Org structure:** Should department hierarchy be unlimited depth, or 3-level max (company → division → team)?
2. **Agent assignment:** Can an agent belong to multiple departments, or one only?
3. **Template versioning:** Keep all historical versions, or auto-clean old ones?
4. **Bulk deployment:** Should it rollback if one agent fails, or best-effort?
5. **Template rating:** Public marketplace feature, or internal only?

---

## Related Documentation

- [docs/concept.md](docs/concept.md) — Full system architecture
- [docs/agent-dsk](docs/agent-dsk) — Agent system spec
- [docs/u-concept](docs/u-concept) — Tenant UI vision
- [docs/SA-concept](docs/SA-concept) — SuperAdmin UI vision
- [backend/prisma/schema.prisma](backend/prisma/schema.prisma) — Current data model
