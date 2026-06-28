/**
 * Widget types — frontend mirror of `backend/src/modules/widgets/widget-definition.ts`.
 *
 * These shapes are returned by `/api/v1/widgets` (list) and
 * `/api/v1/widgets/:id/compute` (compute). The client uses them to render
 * the appropriate Visualization component.
 *
 * SOLID: this file is the contract boundary between backend and frontend
 * for the EAOS-2 Widget System. Mirroring types locally (instead of
 * importing the backend file directly) keeps the frontend build
 * backend-independent.
 */

export type WidgetCapability =
  | 'FINANCIAL_PERFORMANCE'
  | 'WORKFORCE_STATUS'
  | 'OPERATIONAL_EFFICIENCY'
  | 'AI_PERFORMANCE'
  | 'RISK_POSTURE'
  | 'CUSTOMER_HEALTH'
  | 'PREDICTIVE_FORECAST'
  | 'DOCUMENT_MANAGEMENT'
  | 'KNOWLEDGE_ACCESS'
  | 'COLLABORATION'
  | 'AUTOMATION_STATUS'
  | 'COMPLIANCE_STATUS'
  | 'INVENTORY_STATUS'
  | 'QUALITY_METRICS';

export type AggregationType =
  | 'SUM'
  | 'AVG'
  | 'COUNT'
  | 'MIN'
  | 'MAX'
  | 'PERCENTAGE'
  | 'RATIO'
  | 'TREND'
  | 'CUSTOM';

export type Visualization =
  | 'CARD'
  | 'LINE_CHART'
  | 'BAR_CHART'
  | 'GAUGE'
  | 'TABLE'
  | 'HEATMAP'
  | 'KANBAN'
  | 'GANTT'
  | 'GRID'
  | 'SPARKLINE'
  | 'PERCENTAGE_BAR'
  | 'STATUS_BADGE';

export type EaosEntityTypeForWidget =
  | 'AGENT'
  | 'DEPARTMENT'
  | 'PROJECT'
  | 'GOAL'
  | 'TASK'
  | 'WORKFLOW'
  | 'ROUTINE'
  | 'KNOWLEDGE'
  | 'INTEGRATION'
  | 'TOOL';

export interface WidgetSize {
  w: number;
  h: number;
}

export interface ConfigField {
  key: string;
  label: string;
  type: 'select' | 'number' | 'text' | 'boolean' | 'dateRange';
  defaultValue: unknown;
  options?: Array<{ value: string; label: string }>;
  required?: boolean;
}

export interface WidgetDefinition {
  id: string;
  capability: WidgetCapability;
  capabilityDomain: string;
  visualization: Visualization;
  defaultVisualization: Visualization;
  visualizations: Visualization[];
  title: string;
  subtitle?: string;
  icon?: string;
  refreshInterval: number;
  defaultSize: WidgetSize;
  minSize: WidgetSize;
  maxSize: WidgetSize;
  configurableFields: ConfigField[];
  entityTypes: EaosEntityTypeForWidget[];
  category: 'CORE' | 'CONTEXTUAL' | 'INDUSTRY_SPECIFIC';
}

export interface AggregationResult {
  widgetId: string;
  computation: string;
  aggregationType: string;
  value: number | string | null;
  rawCount: number;
  computedAt: string;
}

export interface GridItem {
  i: string;
  size: WidgetSize;
  config?: Record<string, unknown>;
}

export interface SavedLayout {
  items: GridItem[];
  density?: 'compact' | 'default' | 'comfortable';
}