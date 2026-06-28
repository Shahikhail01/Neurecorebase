'use client';

import { AreaChart, Title, Card } from '@tremor/react';

export interface LineChartVisualizationProps {
  title: string;
  subtitle?: string;
  data: Array<Record<string, string | number>>;
  index: string;
  categories: string[];
  colors?: Array<'blue' | 'emerald' | 'rose' | 'amber' | 'violet'>;
  loading?: boolean;
  error?: Error | null;
}

/**
 * LineChart visualization — time-series trend.
 *
 * Wraps Tremor's `AreaChart` (which renders as a line when `curveType="linear"`
 * is set). The shape follows Tremor's data contract:
 *   - `data`  : array of records keyed by `index` (x-axis) + each category
 *   - `index` : which key holds the x-axis value
 *   - `categories` : which keys become series
 */
export function LineChartVisualization({
  title,
  subtitle,
  data,
  index,
  categories,
  colors = ['blue'],
  loading,
  error,
}: LineChartVisualizationProps) {
  if (error) {
    return (
      <Card>
        <p className="text-state-critical">{error.message}</p>
      </Card>
    );
  }
  return (
    <Card>
      <Title>{title}</Title>
      {subtitle ? <p className="text-xs text-canvas-500">{subtitle}</p> : null}
      {loading || data.length === 0 ? (
        <p className="mt-4 text-sm text-canvas-500">No data to display.</p>
      ) : (
        <AreaChart
          className="mt-4 h-72"
          data={data}
          index={index}
          categories={categories}
          colors={colors}
          showLegend={categories.length > 1}
          showGridLines={false}
          curveType="linear"
        />
      )}
    </Card>
  );
}