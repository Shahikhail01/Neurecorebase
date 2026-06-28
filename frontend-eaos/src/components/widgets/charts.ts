/**
 * Charts barrel — the canonical chart import surface for `frontend-eaos`.
 *
 * Per `EAOS-implementation-plan.md` §11.2 (Task 4.6): the legacy
 * `components/charts/*` files from the deleted `frontend-tenant/` have
 * been replaced by Tremor-backed visualizations under
 * `@/components/widgets/visualizations/*`.
 *
 * This barrel exists so consumers (panels, dashboards, etc.) import
 * from one stable path even if the underlying implementation moves.
 * The exposed names match the Visualization enum from §3.3.
 */

export { CardVisualization } from './visualizations/CardVisualization';
export { LineChartVisualization } from './visualizations/LineChartVisualization';
export { BarChartVisualization } from './visualizations/BarChartVisualization';
export { GaugeVisualization } from './visualizations/GaugeVisualization';
export { TableVisualization } from './visualizations/TableVisualization';
export { HeatmapVisualization } from './visualizations/HeatmapVisualization';
export { KanbanVisualization } from './visualizations/KanbanVisualization';
export { GanttVisualization } from './visualizations/GanttVisualization';
export { GridVisualization } from './visualizations/GridVisualization';
export { SparklineVisualization } from './visualizations/SparklineVisualization';
export { PercentageBarVisualization } from './visualizations/PercentageBarVisualization';
export { StatusBadgeVisualization } from './visualizations/StatusBadgeVisualization';