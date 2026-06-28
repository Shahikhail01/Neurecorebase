import type { EntityType, LifecycleState, HealthStatus } from '@neurecore/ui/types';

export interface IdentityPanelData {
  id: string;
  type: EntityType;
  name: string;
  description: string | null;
  ownerId: string | null;
  createdAt: string;
  updatedAt: string;
  state: LifecycleState;
  subState: string | null;
  health: HealthStatus;
  risks: string[];
  recommendations: string[];
  lastRefreshedAt: string;
}

export interface IntelligencePanelData {
  id: string;
  type: string;
  summary: string;
  health: HealthStatus;
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
  lastRefreshedAt: string;
}

export interface ActivityEvent {
  id: string;
  type: string;
  description: string;
  userId: string;
  userName: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface LifecyclePanelData {
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

export interface HealthPanelData {
  status: HealthStatus;
  score: number;
  checks: Array<{
    name: string;
    status: HealthStatus;
    message?: string;
  }>;
  lastCheckedAt: string;
}

export interface EntityWorkspaceSummary {
  identity: IdentityPanelData;
  intelligence: IntelligencePanelData;
  lifecycle: LifecyclePanelData;
}