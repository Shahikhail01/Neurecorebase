'use client';

import { useWidgetValue } from './useWidgetValue';
import type { WidgetDefinition, AggregationResult } from './widget.types';
import type { EntityType as EaosEntityType } from '@neurecore/ui/types';

import { CardVisualization } from './visualizations/CardVisualization';
import { LineChartVisualization } from './visualizations/LineChartVisualization';
import { BarChartVisualization } from './visualizations/BarChartVisualization';
import { GaugeVisualization } from './visualizations/GaugeVisualization';
import { TableVisualization } from './visualizations/TableVisualization';
import { HeatmapVisualization } from './visualizations/HeatmapVisualization';
import { KanbanVisualization } from './visualizations/KanbanVisualization';
import { GanttVisualization } from './visualizations/GanttVisualization';
import { GridVisualization } from './visualizations/GridVisualization';
import { SparklineVisualization } from './visualizations/SparklineVisualization';
import { PercentageBarVisualization } from './visualizations/PercentageBarVisualization';
import { StatusBadgeVisualization } from './visualizations/StatusBadgeVisualization';

export interface WidgetRendererProps {
  definition: WidgetDefinition;
  entityType: EaosEntityType | string;
  entityId: string;
  /** Override config from the GridItem (user-saved). */
  config?: Record<string, unknown>;
  /** Skip network — render placeholder. Used for hero KPIs that render before fetch. */
  staticValue?: AggregationResult;
}

/**
 * WidgetRenderer — picks the right Visualization component for the
 * definition and computes the value via `useWidgetValue`.
 *
 * SOLID: SRP — this file does only "definition → component" dispatch.
 * Visualization implementations know nothing about widgets or grids.
 */
export function WidgetRenderer({
  definition,
  entityType,
  entityId,
  config,
  staticValue,
}: WidgetRendererProps) {
  const args =
    entityType && entityId && !staticValue
      ? {
          widgetId: definition.id,
          entityType: String(entityType),
          entityId,
          params: config,
        }
      : null;

  const { data, isLoading, error } = useWidgetValue(args, {
    refreshInterval: definition.refreshInterval > 0 ? definition.refreshInterval : undefined,
  });

  const viz = definition.defaultVisualization;
  const value = staticValue?.value ?? data?.value ?? null;

  switch (viz) {
    case 'CARD':
      return (
        <CardVisualization
          title={definition.title}
          subtitle={definition.subtitle}
          value={value}
          loading={isLoading}
          error={error as Error | null}
        />
      );

    case 'SPARKLINE':
      return (
        <SparklineVisualization
          title={definition.title}
          subtitle={definition.subtitle}
          series={
            typeof value === 'number'
              ? [value]
              : []
          }
          loading={isLoading}
          error={error as Error | null}
        />
      );

    case 'LINE_CHART':
      // LINE_CHART is rendered identically to BarChart for now; the
      // data shape (per-day buckets) requires a dedicated fetcher in
      // a follow-up. We render an empty-state card when value is null.
      return (
        <LineChartVisualization
          title={definition.title}
          subtitle={definition.subtitle}
          data={[]}
          index="date"
          categories={['value']}
          loading={isLoading}
          error={error as Error | null}
        />
      );

    case 'BAR_CHART':
      return (
        <BarChartVisualization
          title={definition.title}
          subtitle={definition.subtitle}
          data={[]}
          index="label"
          categories={['value']}
          loading={isLoading}
          error={error as Error | null}
        />
      );

    case 'GAUGE':
      return (
        <GaugeVisualization
          title={definition.title}
          subtitle={definition.subtitle}
          value={value}
          loading={isLoading}
          error={error as Error | null}
        />
      );

    case 'TABLE':
      return (
        <TableVisualization
          title={definition.title}
          subtitle={definition.subtitle}
          columns={[
            { key: 'metric', label: 'Metric' },
            { key: 'value', label: 'Value' },
          ]}
          rows={
            value !== null && value !== undefined
              ? [{ metric: definition.title, value: String(value) }]
              : []
          }
          loading={isLoading}
          error={error as Error | null}
        />
      );

    case 'HEATMAP':
      return (
        <HeatmapVisualization
          title={definition.title}
          subtitle={definition.subtitle}
          cells={[]}
          rows={[]}
          cols={[]}
          loading={isLoading}
          error={error as Error | null}
        />
      );

    case 'KANBAN':
      return (
        <KanbanVisualization
          title={definition.title}
          subtitle={definition.subtitle}
          columns={[]}
          loading={isLoading}
          error={error as Error | null}
        />
      );

    case 'GANTT':
      return (
        <GanttVisualization
          title={definition.title}
          subtitle={definition.subtitle}
          bars={[]}
          loading={isLoading}
          error={error as Error | null}
        />
      );

    case 'GRID':
      return (
        <GridVisualization
          title={definition.title}
          subtitle={definition.subtitle}
          cards={
            value !== null && value !== undefined
              ? [{ id: definition.id, label: definition.title, value: String(value) }]
              : []
          }
          loading={isLoading}
          error={error as Error | null}
        />
      );

    case 'PERCENTAGE_BAR':
      return (
        <PercentageBarVisualization
          title={definition.title}
          subtitle={definition.subtitle}
          value={typeof value === 'number' ? value : 0}
          loading={isLoading}
          error={error as Error | null}
        />
      );

    case 'STATUS_BADGE':
      return (
        <StatusBadgeVisualization
          title={definition.title}
          subtitle={definition.subtitle}
          status={value === null || value === undefined ? 'NEUTRAL' : String(value)}
          loading={isLoading}
          error={error as Error | null}
        />
      );

    default:
      return (
        <CardVisualization
          title={definition.title}
          subtitle={`Unsupported visualization: ${String(viz)}`}
          value={value}
          loading={isLoading}
          error={error as Error | null}
        />
      );
  }
}