'use client';

import { BarChart, Card, Title } from '@tremor/react';

export interface BarChartVisualizationProps {
  title: string;
  subtitle?: string;
  data: Array<Record<string, string | number>>;
  index: string;
  categories: string[];
  colors?: Array<'blue' | 'emerald' | 'rose' | 'amber' | 'violet' | 'cyan'>;
  loading?: boolean;
  error?: Error | null;
}

export function BarChartVisualization({
  title,
  subtitle,
  data,
  index,
  categories,
  colors = ['blue'],
  loading,
  error,
}: BarChartVisualizationProps) {
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
        <BarChart
          className="mt-4 h-72"
          data={data}
          index={index}
          categories={categories}
          colors={colors}
          showLegend={categories.length > 1}
        />
      )}
    </Card>
  );
}