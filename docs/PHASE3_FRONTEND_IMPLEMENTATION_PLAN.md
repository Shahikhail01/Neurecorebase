# NeureCore Gold — Phase 3 Frontend Implementation Plan
## Complete UI/UX: Corporate Operating System

**Status**: In Progress  
**Scope**: Both frontends (`frontend-tenant` port 3001, `frontend-admin` port 3002)  
**Goal**: Fulfil the full u-concept — a corporate operating system, not a SaaS dashboard  
**Principles**: SOLID throughout — Single Responsibility for every component, Open/Closed via prop interfaces, Liskov via consistent component contracts, Interface Segregation via focused hooks, Dependency Inversion via service abstractions

---

## Current State Assessment

### What exists (scaffolded but incomplete)
| Portal | Current State |
|---|---|
| Tenant Portal | 13 routes, all as plain data tables, light `bg-gray-50` theme, no charts |
| Admin Portal | 12 routes, stat cards + tables, dark shell but no charts, no card grids |
| Both | No Recharts/ECharts installed, no Framer Motion, no command palette, no persistent activity stream, no org-tree sidebar, no right panel |

---

## What's New in This Update (Critical Features Added)

This plan now includes **4 major differentiating features** that were previously deferred to Phase 4/5:

### ✅ NEW: Conversational Control Interface (Task 6.6)
- Chat panel in both portals (floating panel or sidebar)
- Natural language queries: "Why did cost increase?" → fetches metrics + explains
- Action suggestions: "Pause 3 agents" → LLM interprets + proposes action with validation
- Data-aware: responses include inline charts, tables, metrics
- **Market differentiator**: Most AI platforms are chatbots; this one uses chat strategically for control

### ✅ NEW: Live Animated Brain Visualization (Task 6.5)  
- Static brain map upgraded to animated organizational mind
- Real-time agent activity: pulse rings, thinking indicators, task-flow animations
- Socket.IO listeners: agents update graph in real-time without page refresh
- Playback controls: slow down/speed up animations to understand flow
- **Market differentiator**: Watch your digital organization think — no competitor offers this

### ✅ NEW: Task Delegation UI (Task 6.7)
- Dedicated 6-step delegation flow (description → dept → agent → params → authority → review)
- Authority levels explicit: EXECUTE (full autonomy) vs APPROVE_ME (human approval per step)
- Budget caps per task, deadline management, template saving
- **Why it matters**: Transforms task assignment from API call to human-like delegation experience

### ✅ NEW: Strategy Room (Task 6.8)
- What-if planning: adjust tenant growth, token costs, automation level
- Real-time forecast updates (6mo / 12mo / 24mo projections)
- Save scenarios, compare side-by-side, export as PDF
- **Business value**: Executive decision-making: "What if we double agent adoption?"

---

## New Dependencies Required

Install in **both** frontends:

```bash
# charts + animation + utilities
pnpm add recharts framer-motion @radix-ui/react-dialog @radix-ui/react-tooltip
pnpm add @radix-ui/react-dropdown-menu cmdk date-fns

# visual workflow builder (tenant only)
pnpm add reactflow     # frontend-tenant only

# graph visualization (admin only)
pnpm add @visx/network d3  # frontend-admin only

# conversational control + chat UI
pnpm add zustand react-markdown

# dev types
pnpm add -D @types/d3
```

**Note**: Socket.IO already installed for real-time updates used by animated Brain visualization and conversation streaming.

---

## SOLID Architecture Principles Applied

### S — Single Responsibility
Every file does exactly one thing:
- `components/charts/` — only chart primitives
- `components/agent-card/` — only agent card display
- `hooks/useAgentMetrics.ts` — only metric fetching/transformation
- `services/analytics.service.ts` — only analytics API calls

### O — Open/Closed
All components accept extension via props without modification:
```typescript
// BAD: hardcoded behavior
function AgentCard() { /* fixed look */ }

// GOOD: open for extension, closed for modification
interface AgentCardProps {
  agent: Agent;
  variant?: 'compact' | 'full' | 'inspector';
  onAction?: (action: AgentCardAction) => void;
  renderExtra?: () => React.ReactNode;
}
```

### L — Liskov Substitution
All chart components fulfil the same `ChartProps` contract:
```typescript
interface ChartProps<T> {
  data: T[];
  loading?: boolean;
  height?: number;
  className?: string;
}
// LineChart, BarChart, AreaChart are all substitutable
```

### I — Interface Segregation
Hooks expose only what consumers need — no monolithic hooks:
```typescript
// BAD: one hook with everything
const { agents, tasks, workflows, metrics, charts } = useDashboard();

// GOOD: focused hooks
const { agents, updateStatus } = useAgentStore();
const { kpis, loading } = useDashboardKpis();
const { stream, dismiss } = useActivityStream();
```

### D — Dependency Inversion
All data fetching goes through service layer — components never call `api` directly:
```typescript
// BAD: component imports api directly
const res = await api.get('/agents');

// GOOD: component depends on abstraction
const agentService = useAgentService(); // injected via context
const data = await agentService.findAll(opts);
```

---

## Task 1 — Design System & Theme

**Duration**: 1 day  
**Applies to**: Both frontends

### 1.1 Tenant Portal: Switch to Dark Executive Theme

Replace `bg-gray-50` with `bg-gray-950` across the entire tenant portal. Update `TenantShell`, `layout.tsx`, and all page backgrounds.

**Semantic Color Token System** — add to `tailwind.config.js` both portals:
```javascript
colors: {
  surface: {
    DEFAULT: '#09090b',   // primary background
    raised: '#111113',    // cards
    overlay: '#18181b',   // modals, panels
    border: '#27272a',    // borders
  },
  status: {
    profit:   '#22c55e',  // green  — revenue, success, healthy
    risk:     '#ef4444',  // red    — errors, budget exceeded, danger
    ops:      '#3b82f6',  // blue   — running, operational, active
    strategy: '#a855f7',  // purple — planning, scheduled, strategic
    warn:     '#f59e0b',  // amber  — warnings, pending, moderate
    neutral:  '#71717a',  // zinc   — idle, inactive, draft
  },
  kpi: {
    large:  '3rem',       // headline numbers
    medium: '1.875rem',   // card numbers
    small:  '1.25rem',    // inline metrics
  },
}
```

### 1.2 Shared Component Contracts

Create `src/types/ui.types.ts` in both frontends:
```typescript
export type StatusColor = 'profit' | 'risk' | 'ops' | 'strategy' | 'warn' | 'neutral';

export interface KpiTileProps {
  label: string;
  value: string | number;
  delta?: number;        // % change from last period
  deltaLabel?: string;
  color: StatusColor;
  icon?: React.ReactNode;
  loading?: boolean;
}

export interface AgentCardAction =
  | 'pause' | 'resume' | 'retrain' | 'audit' | 'inspect' | 'delete';

export type ChartTimeRange = '1h' | '24h' | '7d' | '30d' | '90d';
```

---

## Task 2 — Shared Component Library

**Duration**: 2 days  
**Applies to**: Both frontends (each builds their own — no shared code)

### 2.1 KPI Tile (upgraded)

**File**: `src/components/kpi/KpiTile.tsx`

Replaces the current simple `Tile` component. Adds delta indicator, trends sparkline, loading skeleton, and Framer Motion entrance animation.

```
KpiTile
├── props: KpiTileProps (I — Interface Segregation)
├── renders: label, value, delta badge, optional sparkline
├── animation: framer-motion fadeInUp on mount
└── skeleton: shown when loading=true
```

### 2.2 Agent Card

**File**: `src/components/agent-card/AgentCard.tsx`

Three variants controlled by `variant` prop (O — Open/Closed):
- `compact` — small grid tile: name, status dot, workload ring
- `full` — card: name, role, status, workload bar, success rate, cost, action buttons
- `inspector` — right panel: full profile (permissions, budget, tools, decision history)

```typescript
// S — Single Responsibility: card only renders, emits actions up
<AgentCard
  agent={agent}
  variant="full"
  onAction={(action) => handleAgentAction(agent.id, action)}
/>
```

### 2.3 Top Bar

**File**: `src/components/layout/TopBar.tsx`

Single Responsibility: global header strip only.

```
TopBar
├── Left: breadcrumb / page title
├── Center: CommandBox (search/command input — opens CommandPalette)
├── Right:
│   ├── AlertsBell (count badge, opens alerts dropdown)
│   ├── ApprovalsChip (pending count badge)
│   └── UserAvatar (name, role, logout)
```

### 2.4 Right Inspector Panel

**File**: `src/components/layout/InspectorPanel.tsx`

Sliding right panel (400px). Controlled by `useInspectorStore` (Zustand). Any page can open it by calling `inspector.open({ type: 'agent', id })`.

```
InspectorPanel
├── props: open, onClose, type ('agent'|'task'|'workflow'), id
├── renders: content based on type (D — Dependency Inversion via type→component map)
└── animation: framer-motion x: 0 ↔ 400 slide
```

**Inspector content components** (separate files — S):
- `AgentInspector.tsx` — role, permissions, budget, tools, performance KPIs, last 5 decisions
- `TaskInspector.tsx` — execution trace, step-by-step log, token usage, eval score
- `WorkflowInspector.tsx` — steps list, last run, trigger info

### 2.5 Bottom Activity Stream

**File**: `src/components/layout/ActivityStream.tsx`

Persistent strip at bottom of shell. Receives events from Socket.IO via `useActivityStream` hook. Auto-scrolls horizontally.

```
ActivityStream
├── height: 44px collapsed, 240px expanded (toggle)
├── events: ring-buffer of last 50 WebSocket events
├── colors: semantic status colors per event type
└── S — only renders, stream logic lives in useActivityStream hook
```

### 2.6 Command Palette

**File**: `src/components/command-palette/CommandPalette.tsx`

Built on `cmdk`. Opens on `Ctrl+K` / `Cmd+K`.

```
CommandPalette
├── Groups: Navigation, Agents, Tasks, Actions, Recent
├── Keyboard: ↑↓ navigate, Enter select, Esc close
└── D — commands registered via CommandRegistry (not hardcoded)
```

**Command Registry** (`src/services/command-registry.ts`):
```typescript
// O — Open/Closed: any module can register commands without modifying palette
interface Command {
  id: string;
  label: string;
  group: string;
  icon?: React.ReactNode;
  shortcut?: string;
  action: () => void;
}
class CommandRegistry {
  register(command: Command): void;
  unregister(id: string): void;
  search(query: string): Command[];
}
```

### 2.7 Data Table (enhanced)

**File**: `src/components/data-table/DataTable.tsx`

Replaces all plain `<table>` usages. Accepts column definitions, supports sorting, filtering, pagination, row-click → inspector open.

```typescript
// L — row renderer is substitutable: provide renderRow or use default
interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  loading?: boolean;
  onRowClick?: (row: T) => void;
  renderEmpty?: () => React.ReactNode;
  pagination?: PaginationProps;
}
```

---

## Task 3 — Chart Component Library

**Duration**: 1.5 days  
**All charts follow the same `ChartProps<T>` contract (L — Liskov)**

### 3.1 Chart Files

| Component | File | Purpose |
|---|---|---|
| `AreaChart` | `src/components/charts/AreaChart.tsx` | Revenue / cost over time |
| `BarChart` | `src/components/charts/BarChart.tsx` | Dept performance, cost breakdown |
| `LineChart` | `src/components/charts/LineChart.tsx` | Agent success rate trends |
| `DonutChart` | `src/components/charts/DonutChart.tsx` | Task status distribution |
| `Sparkline` | `src/components/charts/Sparkline.tsx` | Inline mini trend in KPI tiles |
| `ChartSkeleton` | `src/components/charts/ChartSkeleton.tsx` | Loading placeholder |

All use Recharts. All accept `timeRange: ChartTimeRange` prop. All render `<ChartSkeleton>` when `loading=true` (O — extension via props).

---

## Task 4 — Shell Upgrades (Both Portals)

**Duration**: 1 day

### 4.1 Tenant Shell

**File**: `src/components/TenantShell.tsx` — upgrade existing file.

Changes:
1. Add `<TopBar>` above content area
2. Add `<ActivityStream>` pinned to bottom
3. Add `<InspectorPanel>` absolutely positioned right side
4. Add `<CommandPalette>` (rendered once at shell level, shown/hidden via store)
5. Sidebar: upgrade flat nav list → `<OrgTree>` component

**Org Tree** (`src/components/sidebar/OrgTree.tsx`):
```
OrgTree
├── S — only renders hierarchy, data from useDepartmentStore
├── Nodes: Company root → Departments → Agents under each dept
├── Collapse/expand per node (local state)
├── Active agent highlighted (status dot color)
└── Right-click context menu: edit dept, add agent, view dept
```

### 4.2 Admin Shell

**File**: `src/components/AdminShell.tsx` — upgrade existing file.

Changes:
1. Add `<TopBar>` with platform-wide metrics (total tenants, active agents, alerts)
2. Add `<ActivityStream>` at bottom
3. Add `<InspectorPanel>`
4. Add `<CommandPalette>`
5. Sidebar stays as flat nav (admin doesn't need org tree)

---

## Task 5 — Tenant Portal: Page Upgrades

**Duration**: 5 days

### 5.1 Dashboard (upgrade existing)

**File**: `src/app/dashboard/page.tsx`

Current: 4 KPI tiles + live activity log table  
Target: full command-center dashboard

**Sections to add**:

```
Row 1 — KPI Tiles (upgraded with delta + sparkline)
  Active Agents | Running Tasks | Completed Today | Active Workflows

Row 2 — Charts (Recharts, time range selector: 1h / 24h / 7d / 30d)
  Left (60%): AreaChart — task completions + failures over time
  Right (40%): DonutChart — task status distribution

Row 3 — Agent Performance + Top Risks
  Left (50%): BarChart — agent success rates ranked
  Right (50%): Risk/Alert panel (color-coded by severity)

Row 4 — Activity Stream (standalone inline version, 10 latest events)
```

**SOLID**:
- S: each row is its own component (`DashboardKpiRow`, `DashboardChartRow`, `DashboardRiskRow`)
- D: all data via hooks (`useDashboardKpis`, `useDashboardCharts`) — no direct `api` calls in page

### 5.2 Agents (upgrade existing)

**File**: `src/app/agents/page.tsx`

Current: paginated table  
Target: card grid + table toggle

```
ViewToggle: [Grid | Table] buttons

Grid View:
  <AgentCard variant="full" /> per agent
  - name, role badge, status dot
  - workload progress bar (0-100%)
  - success rate badge
  - cost today
  - action buttons: Pause | Inspect | Audit

Table View:
  Existing table (kept — O principle: extend, don't remove)

Click any card/row → opens <InspectorPanel type="agent" />
```

**New hook**: `src/hooks/useAgentMetrics.ts` — fetches and transforms observability metrics per agent (S — single concern).

### 5.3 Departments (upgrade existing)

**File**: `src/app/departments/page.tsx`

Current: hierarchical table with indent  
Target: tree view + KPI per dept

```
Left (30%): interactive org tree (DeptTree component)
  - click dept → selects and shows detail on right
  - drag-to-restructure (parent reassignment)

Right (70%): selected department detail
  - dept name, description, agent count
  - BarChart: agent performance within dept
  - KPI tiles: tasks completed, avg success rate, cost this month
  - Agent Cards (compact variant) for all agents in dept
  - Edit dept button (modal)
```

### 5.4 Tasks (upgrade existing)

**File**: `src/app/tasks/page.tsx`

Current: paginated list  
Target: Kanban view + list toggle

```
ViewToggle: [Kanban | List] buttons

Kanban View:
  Columns: QUEUED | RUNNING | COMPLETED | FAILED | CANCELLED
  Each column: draggable task cards
  Drag card between columns → PATCH /tasks/:id/status

List View:
  Existing table (kept)

Click task → <InspectorPanel type="task" />
```

**New component**: `src/components/kanban/KanbanBoard.tsx` (S — only Kanban layout, drag logic in `useKanban` hook).

### 5.5 Workflows (upgrade existing)

**File**: `src/app/workflows/new/page.tsx` — major upgrade

Current: basic form  
Target: visual node-based workflow builder using ReactFlow

```
WorkflowBuilder layout:
  Left panel (200px): Node palette
    - Trigger nodes (webhook, schedule, manual)
    - Agent nodes (drag onto canvas)
    - Condition nodes (if/else branch)
    - Action nodes (notify, webhook, approve)

  Center canvas: ReactFlow canvas
    - Drag from palette → creates node
    - Connect nodes → creates edge
    - Double-click node → configure it (side drawer)
    - Auto-layout button

  Right panel (240px): selected node properties
    - Node-specific config form
    - Validation status

  Bottom: Save Draft | Activate | Cancel
```

**SOLID**:
- S: `WorkflowBuilder.tsx` = layout only; `WorkflowCanvas.tsx` = ReactFlow logic; `NodePalette.tsx` = palette only; `NodeConfigPanel.tsx` = config form
- O: new node types added by registering in `NodeTypeRegistry` without modifying builder
- D: workflow persistence via `useWorkflowBuilderStore` — builder never calls API directly

### 5.6 Analytics (upgrade existing)

**File**: `src/app/analytics/page.tsx`

Current: 4 KPI cards + progress bar + log table  
Target: full analytics suite

```
Time Range Selector: 1h | 24h | 7d | 30d | 90d (applies to all charts)

Row 1 — KPI Tiles
  Total Tasks | Avg Success Rate | Total Cost | Tokens Used | ROI Estimate

Row 2 — Trend Charts
  Left: LineChart — success rate over time per agent
  Right: AreaChart — cumulative cost over time

Row 3 — Breakdowns
  Left: BarChart — tasks per agent (top 10)
  Right: BarChart — cost per agent (top 10)

Row 4 — Execution Log Table
  Searchable, filterable — reuse <DataTable>
  Columns: Agent, Task, Steps, Status, Tokens, Cost, Eval Score, Duration
```

---

## Task 6 — Admin Portal: Page Upgrades

**Duration**: 4 days

### 6.1 Overview (upgrade existing)

**File**: `src/app/overview/page.tsx`

Current: KPI stat cards + table  
Target: full mission-control dashboard

```
Row 1 — Status Banner
  ● All Systems Operational / ⚠ Degraded / ✗ Outage
  (color: green/amber/red — semantic color system)

Row 2 — Real-time KPI Tiles (auto-refresh 15s)
  Total Tenants | Active Agents (all) | Tasks/Hour | Error Rate | Revenue Today | Cost Today

Row 3 — Charts
  Left (60%): AreaChart — tenant signups over time, revenue trend
  Right (40%): DonutChart — agent status distribution across platform

Row 4 — Heatmap + Region Load
  ErrorHeatmap component: 24h × 7d grid, color = error density
  (built with CSS grid + semantic colors — no extra library)

Row 5 — Top Tenants Table (reuse <DataTable>)
  Tenant | Plan | Agents | Tasks Today | Cost Today | Status
  Click row → opens <InspectorPanel type="tenant" />
```

### 6.2 Agent Fleet (upgrade existing)

**File**: `src/app/agents/page.tsx`

Current: paginated table  
Target: card grid matching tenant portal agent grid

```
Filters: Tenant | Type | Status | Load (High/Medium/Low)
ViewToggle: [Grid | Table]

Grid View:
  <AgentCard variant="full" /> — same component as tenant (L — Liskov)
  Plus: tenant name badge on each card

Metrics shown per card:
  workload %, success rate, cost today, tenant name

Bulk Actions toolbar (when ≥1 selected):
  Pause Selected | Restart Failed | Drain Gradually
```

### 6.3 Monitoring (upgrade existing)

**File**: `src/app/monitoring/page.tsx`

Current: 4 metric cards + table  
Target: full infrastructure cockpit

```
Row 1 — Service Health Grid
  Each service (API, PostgreSQL, Redis, WebSocket) as a card:
    Status: ● UP / ⚠ DEGRADED / ✗ DOWN
    Latency sparkline (last 30 values)
    Uptime %

Row 2 — Charts
  Left: LineChart — API latency p50/p95/p99 over time
  Right: AreaChart — requests/min + error rate

Row 3 — System Metrics Table
  CPU | Memory | Disk | Network — updated every 30s

Row 4 — Queue Depth + Cache Stats
  Two small stat cards: BullMQ queue depth | Redis hit rate %
```

### 6.4 Billing (upgrade existing)

**File**: `src/app/billing/page.tsx`

Current: KPI cards + bar chart (basic)  
Target: revenue analytics suite

```
Row 1 — KPI Tiles
  Platform Revenue | Platform Cost | Gross Margin % | Avg Cost/Tenant | Unpaid Accounts

Row 2 — Revenue Charts
  Left: AreaChart — daily revenue vs cost (dual axis)
  Right: BarChart — revenue by plan (STARTER/PRO/ENTERPRISE/CUSTOM)

Row 3 — Cost-per-Tenant BarChart (top 20 tenants by cost)

Row 4 — Unpaid / Anomalies Table
  Flag tenants with usage spike or overdue billing
```

### 6.5 Security (upgrade existing)

**File**: `src/app/security/page.tsx`

Current: tabbed governance + audit table  
Target: security operations center

```
Tabs: [Governance Rules | Audit Logs | Threat Detection | Anomalies]

Governance Rules tab (existing, polished):
  Rules table + create rule modal

Audit Logs tab (existing, upgraded with DataTable):
  Full-text search, filter by tenant/user/action/result
  Export CSV button

Threat Detection tab (new):
  Alert cards: suspicious login, injection attempt, anomalous spend
  Each card: severity badge, timestamp, tenant, description, action buttons (Freeze Tenant | Revoke Tokens | Dismiss)

Anomalies tab (new):
  BarChart: spending spikes per tenant
  Table: unusual agent behavior events
```

### 6.6 Logs & Trace Viewer (upgrade `audit` page)

**File**: `src/app/audit/page.tsx`

Current: simple event table  
Target: trace viewer

```
Left (30%): Timeline navigator
  Collapsible day/hour groups
  Click time range → filters main view

Right (70%): Event detail view
  EventTimeline component: vertically stacked event cards
  Each event card: expand → shows full payload, agent reasoning, tool calls
  Export selected as JSON button

Filter bar (top):
  Date range picker | Tenant | Agent | Action | Result (success/failure)
```

### 6.7 Platform Brain Map (new page — admin only)

**File**: `src/app/brain/page.tsx`  
**Route**: `/brain`

The signature differentiating feature per u-concept §10.

```
Full-screen interactive graph using @visx/network + d3-force:

Node types:
  ● Tenant (large purple circle)
    ○ Department (medium blue circle, child of tenant)
      · Agent (small green/red/blue dot based on status)

Edge types:
  — Tenant→Department hierarchy lines
  — Agent→Task active connection lines (animated dash when task running)

Interactions:
  - Zoom/pan (d3-zoom)
  - Click node → opens InspectorPanel
  - Hover node → tooltip (name, status, KPIs)
  - Drag node → repositions (layout persists in localStorage)
  - Toggle: show/hide idle agents
  - Toggle: show/hide connections

Legend:
  ● Running  ● Idle  ● Error  ● Paused

Animation:
  - Framer Motion pulse on agents with active tasks
  - Edge animates when task is flowing agent→agent
  - New nodes (tenant/agent created) slide-in
```

**SOLID**:
- S: `BrainMap.tsx` = graph layout only; `BrainMapControls.tsx` = zoom/filter controls; `BrainMapLegend.tsx` = legend; `useBrainMapData.ts` = data fetching + transformation
- O: new node types added via `NodeTypeRegistry` without modifying graph engine
- D: graph data from `useBrainMapData` — component never fetches directly

Add to `AdminShell.tsx` nav: "Brain Map" link with a ◉ icon.

---

## Task 6.5 — Admin Brain Map: Animated Living Visualization

**Duration**: 2 days  
**File**: `src/app/brain/page.tsx` — enhanced implementation

Upgrade the static org graph to a truly **living organizational mind** visualization that differentiates NeureCore in the market.

**New Node Animations**:
- Agents actively running tasks: animated pulse ring + status-colored glow (green=running, red=error)
- Thinking indicator: mini animated loader inside agent node when agent is executing multi-step reasoning
- Task flow animation: animated line from source agent → target agent when task passes between agents

**New Edge Animations**:
- Active task edges: dashed lines that animate left-to-right when data/task flows
- Color-coded by status: green (success), red (error), blue (in-progress), amber (queued)

**Real-time Updates**:
- Socket.IO listener for `agent:task-started`, `agent:task-completed`, `agent:thinking`, `agent:idle`
- Nodes update without re-render — use D3 transitions underneath Visx (S: layer separation)
- New agents/tasks appear with animated slide-in

**Interactions**:
- Click running agent → preview task/reasoning in a tooltip (read-only)
- Double-click agent → open full InspectorPanel
- Watch checkbox: highlight a department or agent and watch only their activity
- Playback controls: speed up/slow down animation (1x, 2x, 0.5x)

**Architectural**:
```typescript
// S — Separate concerns
├── BrainMapCanvas.tsx       — Visx graph + D3 layout only
├── useBrainMapAnimations.ts — Framer Motion + socket listeners
├── useBrainMapData.ts       — fetch tenant/dept/agent/task data
└── BrainMapControlPanel.tsx — playback controls, watches, filters
```

**Visual Impact**:
This alone becomes the signature "wow" feature—watching your digital organization think in real-time.

---

## Task 6.6 — Conversational Control Mode

**Duration**: 2.5 days  
**Applies to**: Both portals  
**Principle**: Add chat interface WITHOUT becoming a chatbot — maintain corporate OS feel

**Feature**: Users can ask natural language questions about data/metrics or request actions. AI-powered UI understands intent and either:
1. **Answers with data**: "Why did revenue drop?" → fetches relevant metrics, explains
2. **Suggests actions**: "Reduce expenses by 10%" → proposes department cost cuts, needs approval
3. **Executes delegated task**: "Pause all sales agents" → multi-step action with confirmation

### 6.6.1 Chat Panel Component

**File**: `src/components/chat/ConversationPanel.tsx`

```
ConversationPanel
├── Messages thread (scrollable)
│   ├── User message (right-aligned, blue background)
│   ├── Assistant response (left-aligned, darker background)
│   │   ├── Text (markdown-rendered)
│   │   ├── Data visualization (optional: inline chart/table)
│   │   └── Action buttons (if action suggested)
│   └── Timestamp badges
└── Input box
    ├── Textarea (auto-expand, Ctrl+Enter to send)
    ├── Auto-suggestions as user types (recent agents, common queries)
    └── Send button + slash-command menu (/)
```

**Slash Commands** (e.g., `/agents` suggests agent-related queries):
- `/agents` — agent-related queries
- `/costs` — expense & budget queries
- `/tasks` — task status & delegation
- `/workflows` — workflow queries
- `/approval` — approval queries
- `/debug` — system/error queries

### 6.6.2 Backend Integration: Chat Service

**Endpoint** (new):
```
POST /api/chat/messages
Request: { query: string, context?: 'agent'|'task'|'workflow' }
Response: {
  type: 'info' | 'action' | 'error';
  message: string;           // markdown
  data?: any;                // charts, tables, metrics
  suggestion?: {             // optional: suggested action
    action: string;          // 'pause_agent', 'assign_task', etc.
    agentId?: string;
    params: Record<string, any>;
    requiresApproval: boolean;
  };
  tokens: {
    input: number;
    output: number;
  };
}
```

**LLM-powered interpretation** (backend responsibility):
- Extract intent + entities from query using LLM
- Map to available APIs (agents, tasks, metrics)
- Generate markdown response with insights
- Optionally suggest next action with parameters
- All responses traced in audit logs

### 6.6.3 Tenant Portal: Chat in Dashboard

**Place**: Floating chat bubble (bottom-right corner) or slide-out sidebar (toggle).

**Behavior**:
- Starts minimized (icon only)
- Click → expands horizontal panel on right (250px)
- Default messages: "What's the status of my agents?" / "Show me cost breakdown" / "How many tasks completed today?"
- User types query → sends to backend
- Response streams (token-by-token) using Server-Sent Events
- If response includes data (chart), render inline

**SOLID**:
```typescript
// S – only UI
<ConversationPanel messages={msgs} onSend={send} />

// D – data & intent logic server-side  
const response = await chatService.chat(query);

// O – new intent types added server-side without modifying panel
```

### 6.6.4 Admin Portal: Chat for System Queries

**Place**: Same floating chat.

**Scope**: Extended to platform-level queries:
- "Which tenants are using the most tokens?"
- "List all tenants with errors in last 24h"
- "Pause all agents on tenant X"
- "Show me billing anomalies"

**Auto-actions** (admin safety):
- Dangerous actions (delete tenant, pause all) require voice confirmation (read button label aloud)
- Audit log automatically tagged: `source: "conversational_control"`

---

## Task 6.7 — Task Delegation UI (Tenant Portal)

**Duration**: 1.5 days  
**File**: `src/app/tasks/delegate/page.tsx` + modal variant  
**Principle**: Replicate human-style delegation: "Hey Bob, can you handle this by Friday?"

**Dedicated Delegation Flow**:

```
Step 1: Task Description
  Input: title + description
  Auto-suggest: recent task patterns (copy from history)

Step 2: Department Selection
  Radio/dropdown: select target department
  Auto-populated agents list shown (right pane)

Step 3: Agent Assignment
  Click an agent card → selects them
  Shows: capacity, success rate, current workload

Step 4: Parameters
  Deadline picker (date + time)
  Priority: LOW | MEDIUM | HIGH | CRITICAL
  Budget cap (optional): max tokens/cost agent can spend

Step 5: Authority Level (new!)
  Slider: EXECUTE (full autonomy) ↔ APPROVE_ME (needs human approval per step)
  Explanation: at EXECUTE, agent runs fully autonomously; at APPROVE_ME, agent pauses before each tool call for your approval

Step 6: Review + Delegate
  Summary of all params
  Button: "🚀 Delegate Task"
  Button: "Save as Template" (saves task pattern for reuse)
```

**New Model Fields**:
```typescript
interface Task {
  // existing
  id: string;
  title: string;
  status: string;
  
  // new — authority level
  authorityLevel: 'EXECUTE' | 'APPROVE_THRESHOLD' | 'APPROVE_ME';
  budgetCap?: number;
  requiredApprovals: Array<{ step: number; approved: boolean; review?: string }>;
}
```

**Modal Variant**: Quick delegation from anywhere:
- Agent card → "Assign Task" button → opens modal with delegation flow
- Task card → "Reassign" button → opens modal (pre-populates current assignment)
- Dashboard → "Quick Delegate" button → modal for one-off tasks

**SOLID**:
```typescript
// S – form only
<DelegationForm onSubmit={submit} />

// O – step components added without modifying form
function DelegationForm() {
  return <>
    <StepDescription ... />    // swappable
    <StepDepartment ... />
    <StepAgent ... />
    <StepParameters ... />
    <StepAuthority ... />
    <StepReview ... />
  </>
}
```

---

## Task 6.8 — Strategy Room (Admin Portal)

**Duration**: 2 days  
**File**: `src/app/strategy/page.tsx` — new admin-only page  
**Principle**: "What-if" planning using simulated scenarios

**Page Layout**:
```
Left Panel (280px):
  Scenario Builder
  ├── Scenario name + description
  ├── Base parameters (from current state)
  ├── Adjustable sliders:
  │   ├── Tenant growth rate (baseline +0% to +50%)
  │   ├── Avg token spend per agent (-20% to +50%)
  │   ├── New models adoption (0-100%)
  │   ├── Automation level (-30% cost to +20% cost)
  │   └── Headcount (add virtual "agents allocated")
  │
  └── Duration: 6mo / 12mo / 24mo forecast

Center Canvas (1000px):
  Time-series charts responding to scenario changes (real-time)
  ├── Projected Revenue
  ├── Projected Cost
  ├── Gross Margin %
  └── Break-even month (highlighted if <0)

Right Panel (240px):
  Key Metrics Dashboard
  ├── Tenant Growth Forecast
  ├── Total Revenue (6/12/24mo)
  ├── Total Cost (6/12/24mo)
  ├── Margin (%)
  ├── Capital Required
  └── Payback Period (months)

Bottom Action Bar:
  [Save Scenario] [Compare (open multiple)] [Export PDF] [Share Link]
```

**Forecasting Models** (backend):
```
POST /api/strategy/forecast
Request: {
  baselineMetrics: {...},
  parameters: {
    tenantGrowth: 0.15,
    tokenMultiplier: 1.2,
    modelAdoptionRate: 0.4,
    automationSavings: -0.1,
  },
  months: 12
}
Response: {
  forecasts: Array<{
    month: number;
    revenue: number;
    cost: number;
    margin: number;
  }>;
  summary: {
    totalRevenue: number;
    totalCost: number;
    avgMargin: number;
    breakEven: number | null;
  };
}
```

**Scenarios Tab**:
- Save multiple scenarios (e.g., "Aggressive Growth", "Conservative", "Best Case")
- Table view: scenario name | parameters | projected revenue | margin
- Click scenario → load into forecast canvas
- Bulk delete old scenarios

**Comparison Mode**:
- Select 2-3 scenarios → overlay their forecast lines on same chart
- Legend color-coded per scenario
- Hover → tooltip shows exact values

**SOLID**:
```typescript
// S – form only
<ScenarioBuilder scenario={s} onChange={update} />

// S – chart only
<ForecastChart data={projections} scenarios={[s1, s2]} />

// D – forecast logic server-side
const result = await strategyService.forecast(params);
```

**UI Polish**:
- Responsive sliders (nice knobs, not boring inputs)
- Framer Motion: scenario changes smoothly animate chart updates (not instant)
- Export generates PDF with charts + scenario parameters

---

## Task 7 — Global UX Features

**Duration**: 1.5 days

### 7.1 Keyboard Command Palette (both portals)

Trigger: `Ctrl+K` (Windows) / `Cmd+K` (Mac)

**Tenant Portal commands**:
```
Navigation:    Go to Dashboard, Agents, Tasks, Workflows, Approvals...
Actions:       New Agent, New Task, New Workflow, New Department
Search:        Find agent by name, Find task by ID
Recent:        Last 5 visited pages
```

**Admin Portal commands**:
```
Navigation:    Go to Overview, Tenants, Agent Fleet, Brain Map...
Actions:       Create Tenant, Suspend Tenant, View Audit Logs
Search:        Find tenant by name, Find agent by ID
Shortcuts:     Open Brain Map, Refresh Metrics
```

### 7.2 Notification Bell + Approval Badge

Both portals `<TopBar>` right side:
- `<AlertsBell>`: badge count from WebSocket `system:alert` events; click → dropdown of last 5 alerts
- `<ApprovalsChip>` (tenant only): count from `GET /approvals?status=PENDING`; click → navigate to `/approvals`

### 7.3 Global Search (TopBar center)

Clicking the TopBar command box or pressing `Ctrl+K` opens `<CommandPalette>`.

---

## Task 8 — New Shared Hooks

**Duration**: 1 day — create in both frontends independently (no shared code — D principle)

| Hook | File | Responsibility |
|---|---|---|
| `useDashboardKpis` | `hooks/useDashboardKpis.ts` | Fetch + poll KPI values with delta calculation |
| `useDashboardCharts` | `hooks/useDashboardCharts.ts` | Fetch time-series data for charts |
| `useAgentMetrics` | `hooks/useAgentMetrics.ts` | Map observability logs to per-agent stats |
| `useActivityStream` | `hooks/useActivityStream.ts` | Socket.IO ring buffer, dismiss, clear |
| `useCommandPalette` | `hooks/useCommandPalette.ts` | Open/close, register/unregister commands |
| `useInspector` | `hooks/useInspector.ts` | Open/close inspector panel with payload |
| `useTimeRange` | `hooks/useTimeRange.ts` | Selected chart time range, shared across page |
| `useChartData` | `hooks/useChartData.ts` | Fetch + transform data for given time range |
| `useChat` | `hooks/useChat.ts` (NEW) | Send message, stream responses, manage history |
| `useChatSuggestions` | `hooks/useChatSuggestions.ts` (NEW) | Auto-complete suggestions based on context |
| `useBrainMapAnimations` | `hooks/useBrainMapAnimations.ts` (admin only, NEW) | Socket.IO listeners + D3/Framer Motion |
| `useStrategyForecast` | `hooks/useStrategyForecast.ts` (admin only, NEW) | Fetch forecasts on scenario param changes |

---

## Task 9 — New Zustand Stores

| Store | File | State |
|---|---|---|
| `useInspectorStore` | `stores/inspectorStore.ts` | `{ open, type, id }` |
| `useCommandStore` | `stores/commandStore.ts` | `{ open, query, commands[] }` |
| `useActivityStore` | `stores/activityStore.ts` | `{ events[], add, dismiss, clear }` |
| `useThemeStore` | `stores/themeStore.ts` | `{ mode: 'dark' \| 'light' }` — dark always for now |
| `useChatStore` | `stores/chatStore.ts` (NEW) | `{ messages[], history, clearHistory(), setMessages() }` |
| `useStrategyStore` | `stores/strategyStore.ts` (admin only, NEW) | `{ scenarios[], currentScenario, addScenario(), deleteScenario() }` |

---

## Task 10 — New API Service Methods

Extend existing service files (I — Interface Segregation: add methods, don't bloat existing ones):

**`services/analytics.service.ts`** (both portals):
```typescript
interface IAnalyticsService {
  getDashboardKpis(): Promise<DashboardKpis>;
  getTimeSeriesData(metric: string, range: ChartTimeRange): Promise<TimeSeriesPoint[]>;
  getAgentMetrics(agentId?: string): Promise<AgentMetrics[]>;
  getCostBreakdown(range: ChartTimeRange): Promise<CostBreakdown>;
}
```

**`services/chat.service.ts`** (both portals, NEW):
```typescript
interface IChatService {
  sendMessage(query: string, context?: string): Promise<ChatResponse>;
  // ChatResponse includes type ('info'|'action'|'error'), markdown message, optional data/suggestion
  getRecentMessages(limit: number): Promise<ConversationMessage[]>;
  clearHistory(): Promise<void>;
  getSuggestions(query: string): Promise<string[]>;
}
```

**`services/admin-metrics.service.ts`** (frontend-admin only):
```typescript
interface IAdminMetricsService {
  getPlatformKpis(): Promise<PlatformKpis>;
  getTenantCosts(range: ChartTimeRange): Promise<TenantCost[]>;
  getBrainMapData(): Promise<BrainMapGraph>;
  getSystemHealth(): Promise<ServiceHealth[]>;
}
```

**`services/admin-strategy.service.ts`** (frontend-admin only, NEW):
```typescript
interface IStrategyService {
  forecast(params: ForecastParams, months: number): Promise<ForecastResult>;
  // params: { tenantGrowth, tokenMultiplier, modelAdoptionRate, automationSavings }
  saveScenario(scenario: Scenario): Promise<Scenario>;
  listScenarios(): Promise<Scenario[]>;
  deleteScenario(scenarioId: string): Promise<void>;
  compareScenarios(scenarioIds: string[]): Promise<ComparisonResult>;
}
```

---

## Implementation Sequence

Execute in this order to maintain working state at all times:

```
Week 1 — Foundation (Tasks 1 + 2 + 3)
  Day 1: Design system + dark theme + tailwind tokens (both portals)
  Day 2-3: Shared component library (KpiTile, AgentCard, TopBar, DataTable)
  Day 4-5: Chart library (all 6 chart components)

Week 2 — Shell + Global Features (Tasks 4 + 7 + 8 + 9)
  Day 1: Shell upgrades (TopBar + ActivityStream + InspectorPanel mount points)
  Day 2: Inspector panels (AgentInspector, TaskInspector)
  Day 3: OrgTree sidebar (tenant portal)
  Day 4: Command Palette + keyboard shortcut
  Day 5: Hooks + stores

Week 3 — Tenant Portal Pages (Task 5)
  Day 1: Dashboard upgrade (charts + risk panel)
  Day 2: Agents page → card grid + toggle
  Day 3: Departments → tree view
  Day 4: Tasks → Kanban board
  Day 5: Workflows → ReactFlow builder

Week 4 — Brain Map + Conversational Control (Task 6.5 + 6.6)
  Day 1-2: Brain Map static implementation + Socket.IO listeners
  Day 3-4: Brain Map animations (Framer Motion + D3 transitions)
  Day 5: Conversation Panel setup (both portals) + chat service integration

Week 5 — Task Delegation + Advanced Admin (Task 6.7 + 6.1-6.4)
  Day 1-2: Delegation UI form (multi-step, authority levels, templates)
  Day 3: Admin Overview → mission control
  Day 4: Admin Agent Fleet → card grid + bulk actions
  Day 5: Admin Monitoring + Billing upgrades

Week 6 — Strategy Room + Polish (Task 6.8)
  Day 1-2: Strategy Room scenario builder + forecast service integration
  Day 3: Scenario comparison + export
  Day 4: Security tabs + Audit trace viewer (admin)
  Day 5: Framer Motion passes (all entry animations) + final QA

**Alternative (Parallel Track)**: 
With 2 frontend engineers (one on tenant-portal, one on frontend-admin), can complete in **3.5 weeks**:
- Week 1: Both do foundation (design system, components, charts) — synchronized
- Weeks 2-3: Tenant engineer does tenant features, admin engineer does admin features in parallel
- Week 3.5: Integration testing, animations, QA
```

---

## File Structure After Completion

### Tenant Portal (`frontend-tenant/src/`)

```
components/
  agent-card/
    AgentCard.tsx          ← S: card rendering only
    AgentCard.types.ts     ← types
    index.ts
  charts/
    AreaChart.tsx
    BarChart.tsx
    LineChart.tsx
    DonutChart.tsx
    Sparkline.tsx
    ChartSkeleton.tsx
    chart.types.ts         ← shared ChartProps<T>
    index.ts
  command-palette/
    CommandPalette.tsx     ← S: palette UI only
    CommandRegistry.ts     ← D: command registration
    index.ts
  data-table/
    DataTable.tsx          ← L: generic, substitutable
    DataTable.types.ts
    index.ts
  chat/
    ConversationPanel.tsx  ← S: chat UI only (NEW)
    MessageThread.tsx      ← S: message display (NEW)
    InputBox.tsx           ← S: input + suggestions (NEW)
    chat.types.ts          ← (NEW)
    index.ts               ← (NEW)
  delegation/
    DelegationForm.tsx     ← S: multi-step form (NEW)
    StepDescription.tsx    ← S: step component (NEW)
    StepDepartment.tsx     ← S: step component (NEW)
    StepAgent.tsx          ← S: step component (NEW)
    StepParameters.tsx     ← S: step component (NEW)
    StepAuthority.tsx      ← S: step component (NEW)
    StepReview.tsx         ← S: step component (NEW)
    delegation.types.ts    ← (NEW)
    index.ts               ← (NEW)
  kanban/
    KanbanBoard.tsx        ← S: layout only
    KanbanCard.tsx
    index.ts
  kpi/
    KpiTile.tsx            ← O: extended via props
    KpiTile.types.ts
    index.ts
  layout/
    TopBar.tsx             ← S: header bar only
    ActivityStream.tsx     ← S: stream display only
    InspectorPanel.tsx     ← S: sliding panel frame
    OrgTree.tsx            ← S: sidebar org tree
    index.ts
  inspector/
    AgentInspector.tsx     ← S: agent detail only
    TaskInspector.tsx      ← S: task detail only
    WorkflowInspector.tsx  ← S: workflow detail only
    index.ts
  workflow-builder/
    WorkflowBuilder.tsx    ← S: builder layout
    WorkflowCanvas.tsx     ← S: ReactFlow canvas
    NodePalette.tsx        ← S: palette only
    NodeConfigPanel.tsx    ← S: node config form
    nodes/
      AgentNode.tsx
      TriggerNode.tsx
      ConditionNode.tsx
      ActionNode.tsx
    index.ts
hooks/
  useDashboardKpis.ts
  useDashboardCharts.ts
  useAgentMetrics.ts
  useActivityStream.ts
  useCommandPalette.ts
  useInspector.ts
  useTimeRange.ts
  useChartData.ts
  useKanban.ts
  useChat.ts                ← (NEW) chat message stream
  useChatSuggestions.ts     ← (NEW) slash command suggestions
services/
  analytics.service.ts      ← D: abstraction over API
  api.ts                    ← existing
  socket.ts                 ← existing
  command-registry.ts
  chat.service.ts           ← (NEW) conversational API
stores/
  inspectorStore.ts
  commandStore.ts
  activityStore.ts
  themeStore.ts
  chatStore.ts              ← (NEW) conversation history
  agentStore.ts             ← existing
  taskStore.ts              ← existing
  workflowStore.ts          ← existing
types/
  ui.types.ts               ← KpiTileProps, AgentCardAction…
  chart.types.ts
  chat.types.ts             ← (NEW) ConversationMessage, ChatResponse
  delegation.types.ts       ← (NEW) DelegationFormData, AuthorityLevel
  api.types.ts              ← existing
```

### Admin Portal — additions mirrored separately (no shared code):

```
components/
  (same structure as tenant — independent copies)
  brain-map/
    BrainMap.tsx           ← admin-only (UPGRADED: animated)
    BrainMapCanvas.tsx     ← admin-only (UPGRADED: D3 animations)
    BrainMapControls.tsx   ← admin-only (NEW: playback + watch)
    BrainMapLegend.tsx
    brain-map.types.ts
    index.ts
  chat/
    ConversationPanel.tsx  ← S: chat UI only (mirrored)
    MessageThread.tsx      ← S: message display (mirrored)
    InputBox.tsx           ← S: input + suggestions (mirrored)
    chat.types.ts
    index.ts
  strategy/
    ScenarioBuilder.tsx    ← S: parameter controls (NEW)
    ForecastChart.tsx      ← S: chart rendering (NEW)
    MetricsDashboard.tsx   ← S: KPI summary (NEW)
    ScenarioComparison.tsx ← S: overlay multiple scenarios (NEW)
    strategy.types.ts      ← (NEW)
    index.ts               ← (NEW)
hooks/
  useBrainMapAnimations.ts  ← admin-only (NEW: Socket.IO + Framer Motion)
  useBrainMapData.ts        ← admin-only
  useStrategyForecast.ts    ← admin-only (NEW)
services/
  admin-metrics.service.ts  ← admin-only service
  admin-strategy.service.ts ← admin-only (NEW) scenario forecasting
  chat.service.ts           ← mirrored from tenant
stores/
  chatStore.ts              ← mirrored from tenant
  strategyStore.ts          ← admin-only (NEW) saved scenarios
types/
  strategy.types.ts         ← admin-only (NEW) Scenario, Forecast
  chat.types.ts             ← mirrored from tenant
```

---

## Task 11 — Backend Integration Points (New Features)

For the 4 newly-added features to work, backend must implement these endpoints by Phase 3 completion.

### 11.1 Conversational Control API

```
POST /api/chat/messages
Request Body:
{
  "query": string;              // user question or command
  "context"?: 'agent'|'task'|'workflow'|'system';
  "conversationId"?: string;    // for multi-turn conversation
}

Response (200):
{
  "id": string;                 // message ID for threading
  "type": "info" | "action" | "error" | "data";
  "message": string;            // markdown-rendered response
  "data"?: {                    // optional: returned metrics/chart data
    "Chart"?: { type: 'area'|'bar'|'line'|'donut', data: any[] };
    "Table"?: { headers: string[], rows: any[] };
    "Metrics"?: Record<string, number>;
  };
  "suggestion"?: {              // optional: suggested action
    "action": string;           // 'pause_agent'|'assign_task'|'update_dept'
    "agentId"?: string;
    "params": Record<string, any>;
    "requiresApproval": boolean;
    "confirmationMessage": string;
  };
  "tokens": { input: number; output: number };
  "timestamp": string;          // ISO 8601
}

GET /api/chat/history?limit=50
Response: { data: ConversationMessage[] }

DELETE /api/chat/history
Response: { success: boolean }

POST /api/chat/suggestions
Request: { query: string }
Response: { suggestions: string[] }
```

**Backend Logic**:
- Use LLM to extract intent + entities from query (slot filling)
- Map to available APIs (agents, tasks, metrics, etc.)
- Generate markdown response with insights
- If action suggested, validate against user permissions
- All requests logged in audit trail with source: `conversational_control`

### 11.2 Brain Map Real-Time Animation API

No new endpoints needed — existing agents/departments/tasks APIs extended with real-time events:

```
WebSocket Events (existing, used by conversational brain):

// Agent activity
socket.on('agent:task-started', { agentId, taskId, timestamp })
socket.on('agent:task-completed', { agentId, taskId, result, timestamp })
socket.on('agent:thinking', { agentId, reasoning, timestamp })
socket.on('agent:idle', { agentId, timestamp })
socket.on('agent:error', { agentId, error, timestamp })

// Task flow
socket.on('task:assigned', { taskId, fromAgent, toAgent, timestamp })
socket.on('task:completed', { taskId, agentId, success, timestamp })
```

Ensure backend broadcast these events on all agent state transitions.

### 11.3 Task Delegation UI API

```
POST /api/tasks/delegate
Request Body:
{
  "title": string;
  "description": string;
  "departmentId": string;
  "agentId": string;
  "deadline": ISO8601 timestamp;
  "priority": 'LOW'|'MEDIUM'|'HIGH'|'CRITICAL';
  "authorityLevel": 'EXECUTE'|'APPROVE_THRESHOLD'|'APPROVE_ME';
  "budgetCap"?: number;
  "template"?: boolean;          // save as reusable template
}

Response (201):
{
  "id": string;
  "status": "PENDING";
  "createdAt": ISO8601;
  // agent will start executing
}

GET /api/tasks/templates
Response: { data: TaskTemplate[] }
  // Templates created via delegation form with template=true

POST /api/tasks/:id/authority-level
Request: { level: 'EXECUTE'|'APPROVE_THRESHOLD'|'APPROVE_ME' }
Response: { updated: true }
```

**New Task Model Fields** (backend):
```typescript
interface Task {
  // existing
  id: string;
  title: string;
  description?: string;
  agentId: string;
  status: TaskStatus;
  
  // new — authority tracking
  authorityLevel: 'EXECUTE' | 'APPROVE_THRESHOLD' | 'APPROVE_ME';
  budgetCap?: number;
  requiredApprovals?: Array<{
    stepNumber: number;
    status: 'pending' | 'approved' | 'rejected';
    hint: string;  // what the agent is about to do
    reviewedBy?: string;
    review?: string;
  }>;
  
  // hooks into approval workflow
  approvalsRequired: Approval[];
}
```

### 11.4 Strategy Room API

```
POST /api/strategy/forecast
Request Body:
{
  "parameters": {
    "tenantGrowth": number;           // 0.0-1.0 (15% = 0.15)
    "tokenMultiplier": number;        // 0.5-3.0
    "modelAdoptionRate": number;      // 0.0-1.0
    "automationSavings": number;      // -0.5 to 0.5 (cost reduction)
    "agentsAllocated"?: number;       // additional virtual agents
  };
  "months": number;                   // forecast horizon (6, 12, 24)
}

Response (200):
{
  "forecasts": Array<{
    "month": number;
    "date": ISO8601;
    "tenants": number;
    "agents": number;
    "revenue": number;
    "cost": number;
    "margin": number;
    "marginPercent": number;
  }>;
  "summary": {
    "totalRevenue": number;
    "totalCost": number;
    "avgMarginPercent": number;
    "breakEvenMonth": number | null;
    "assumptions": string[];
  };
}

POST /api/strategy/scenarios
Request: { name, description, parameters }
Response: { id, createdAt, ... }

GET /api/strategy/scenarios
Response: { data: Scenario[] }

GET /api/strategy/scenarios/:id/forecast
Response: { forecasts[], summary }

POST /api/strategy/scenarios/:id/compare?with=:otherId
Response: { scenario1, scenario2, differences, chartOverlay }

DELETE /api/strategy/scenarios/:id
Response: { deleted: true }

POST /api/strategy/scenarios/:id/export
Response: { pdf: base64 | Buffer }
```

**Backend Logic**:
- Use existing tenant metrics as baseline
- Apply parameter multipliers to historical trends
- Linear or exponential growth models (configurable)
- Validate assumptions (e.g., token multiplier can't exceed 3x)
- Cache forecasts for 5 minutes (they're deterministic)

---

## Definition of Done

Each task is complete when all of the following hold:

- [ ] TypeScript compiles clean (`pnpm type-check` exits 0)
- [ ] Zero ESLint errors (`pnpm lint` exits 0)
- [ ] Component renders in dark theme with correct semantic colors
- [ ] All data goes through service layer (no direct `api` calls in components)
- [ ] Each file has one clear responsibility
- [ ] Framer Motion entrance animation present on cards/panels
- [ ] Component works at 1280px and 1920px viewport widths
- [ ] Keyboard navigable (Tab, Enter, Esc where applicable)
- [ ] Loading state shown while data fetches
- [ ] Empty state shown when no data
- [ ] (New) Chat feature: message streaming works without page reload
- [ ] (New) Brain Map: Socket.IO events trigger animations smoothly
- [ ] (New) Task Delegation: all 6 steps render correctly, validation works
- [ ] (New) Strategy Room: scenario parameter changes update forecast in <500ms

---

These advanced features are **NOT in this plan** — deliberately deferred:

| Feature | Reason deferred |
|---|---|
| Advanced conversational features (custom LLM fine-tuning) | Phase 4: requires specific model customization |
| Mobile responsive layouts | Phase 4: desktop-first for MVP |
| Full agent-to-agent decision visualization | Phase 5: requires multi-agent collaboration framework |
| Advanced forecasting with ML models | Phase 4: requires time-series forecasting expertise |
| Multi-window split views | Phase 4: browser API complexity |
| Voice control interface | Phase 5: requires speech-to-text integration |

---

**Total estimated frontend engineering time (Phase 3)**: ~6 weeks (1 engineer)  
**Can be parallelised to ~3.5 weeks** with 2 frontend engineers working on tenant portal and admin portal simultaneously (they share no code).

**MVP Feature Complete**: All features in u-concept §1-§10 will be production-ready by end of Phase 3 except advanced ML forecasting and voice interfaces.

