export type UserRole =
  | 'SUPER_ADMIN'
  | 'PLATFORM_ADMIN'
  | 'SECURITY_OFFICER'
  | 'SUPPORT'
  | 'OWNER'
  | 'ADMIN'
  | 'USER'
  | 'AUDITOR';

export type EntityType =
  | 'DEPARTMENT'
  | 'AGENT'
  | 'USER'
  | 'PROJECT'
  | 'GOAL'
  | 'TASK'
  | 'WORKFLOW'
  | 'ROUTINE'
  | 'TOOL_INTEGRATION'
  | 'EXPENSE'
  | 'INVOICE'
  | 'KNOWLEDGE_ENTRY'
  | 'TEMPLATE'
  | 'AI_EMPLOYEE'
  | 'HUMAN_EMPLOYEE'
  | 'CUSTOMER'
  | 'ASSET'
  | 'FACILITY'
  | 'VENDOR'
  | 'PROCESS'
  | 'KNOWLEDGE'
  | 'DOCUMENT'
  | 'CONTAINER';

export type LifecycleState =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'ACTIVE'
  | 'PAUSED'
  | 'SUSPENDED'
  | 'ARCHIVED'
  | 'DELETED';

export type HealthStatus = 'healthy' | 'warning' | 'critical' | 'unknown';

export interface EntityRef {
  id: string;
  type: EntityType;
  name: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ActionResult<T = void> {
  success: boolean;
  message: string;
  data?: T;
}

// ─── Phase 3 / EAOS-1 entity panel types ──────────────────────────────────

export interface EntityHealthSummary {
  severity: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  trend: 'IMPROVING' | 'STABLE' | 'DEGRADING';
  score: number;
  openAlerts: number;
  signals: Record<string, unknown>;
}

export interface EntityLabel {
  key: string;
  value: string;
  color: string | null;
}

export interface IdentityPanel {
  id: string;
  type: EntityType;
  name: string;
  description: string | null;
  ownerId: string | null;
  createdAt: string;
  updatedAt: string;
  state: LifecycleState;
  subState: string | null;
  health: EntityHealthSummary;
  labels: EntityLabel[];
  isWatched: boolean;
  isFavorite: boolean;
}

export interface ContextPanel {
  id: string;
  type: string;
  parents: Array<{ type: string; id: string }>;
  children: Array<{ type: string; id: string; name: string | null }>;
  relationships: Array<{
    direction: 'in' | 'out';
    type: string;
    other: { type: string; id: string };
  }>;
  industry: string | null;
  departmentType: string | null;
  metadata: Record<string, unknown>;
}

export interface IntelligencePanel {
  id: string;
  type: string;
  summary: string;
  predictions: Array<{
    metric: string;
    forecast: number | string;
    confidence: number;
    model: string;
  }>;
  risks: Array<{
    title: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    probability: number;
    mitigation: string | null;
  }>;
  recommendations: Array<{
    action: string;
    rationale: string;
    impact: number;
    effort: 'HIGH' | 'MEDIUM' | 'LOW';
  }>;
  confidence: number;
  generatedAt: string;
  modelVersion: string;
  contextUsed: string[];
}

export interface OperationsPanel {
  id: string;
  type: string;
  counts: {
    tasks: number;
    workflows: number;
    goals: number;
    routines: number;
  };
  tasks: Array<{ id: string; title: string; status: string }>;
  workflows: Array<{ id: string; name: string; status: string }>;
  goals: Array<{ id: string; title: string; status: string }>;
  routines: Array<{ id: string; name: string; isActive: boolean }>;
}

export interface ResourcesPanel {
  id: string;
  type: string;
  humanTeam: Array<{ id: string; name: string; role: string | null }>;
  aiTeam: Array<{ id: string; name: string; status: string }>;
  budget: { allocated: number | null; spent: number | null; currency: string };
  integrations: Array<{ id: string; name: string; isActive: boolean }>;
}

export interface CollaborationPanel {
  id: string;
  type: string;
  notifications: Array<{
    id: string;
    title: string;
    read: boolean;
    createdAt: string;
  }>;
  approvals: Array<{
    id: string;
    title: string;
    status: string;
    createdAt: string;
  }>;
  unreadCount: number;
}

export interface InsightsPanel {
  id: string;
  type: string;
  kpis: Array<{
    name: string;
    value: number | string;
    target: number | string | null;
    trend: 'UP' | 'DOWN' | 'STABLE';
    status: 'ON_TRACK' | 'AT_RISK' | 'OFF_TRACK';
  }>;
  trends: Array<{ metric: string; series: number[] }>;
  reports: Array<{ id: string; title: string; generatedAt: string }>;
}

export interface AutomationPanel {
  id: string;
  type: string;
  automations: Array<{
    id: string;
    name: string;
    isActive: boolean;
    trigger: string | null;
  }>;
  routines: Array<{ id: string; name: string; isActive: boolean }>;
  integrations: Array<{ id: string; name: string; isActive: boolean }>;
}

export interface ActivityEntry {
  id: string;
  type: string;
  actor: string | null;
  action: string;
  target: string | null;
  metadata: Record<string, unknown>;
  timestamp: string;
  isAi: boolean;
}

export interface LifecyclePanel {
  id: string;
  type: string;
  currentState: LifecycleState;
  subState: string | null;
  enteredAt: string;
  enteredBy: string | null;
  availableTransitions: Array<{
    to: LifecycleState;
    label: string;
    allowedRoles: string[];
  }>;
  transitionRules: Array<{
    to: LifecycleState;
    label: string;
    allowedRoles: string[];
  }>;
  stateHistory: Array<{
    fromState: LifecycleState;
    toState: LifecycleState;
    transitionedAt: string;
    transitionedBy: string | null;
    reason: string | null;
    isAuto: boolean;
  }>;
  whyNotActive: string | null;
}

export interface MiniGraphNode {
  id: string;
  type: string;
  name: string | null;
  relationship: string;
  direction: 'in' | 'out';
}

export interface MiniGraph {
  center: { id: string; type: string };
  nodes: MiniGraphNode[];
}

export interface WorkspaceSummary {
  identity: IdentityPanel;
  intelligence: IntelligencePanel;
  lifecycle: LifecyclePanel;
}
