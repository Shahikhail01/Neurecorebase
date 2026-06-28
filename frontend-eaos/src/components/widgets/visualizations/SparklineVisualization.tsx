'use client';

import { Card, Title, Text } from '@tremor/react';

export interface SparklineVisualizationProps {
  title: string;
  subtitle?: string;
  /** Series of values to draw (most recent at the end). */
  series: number[];
  color?: 'blue' | 'emerald' | 'rose' | 'amber' | 'violet';
  loading?: boolean;
  error?: Error | null;
}

function buildPath(values: number[], width: number, height: number): string {
  if (values.length === 0) return '';
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = width / Math.max(1, values.length - 1);
  const pad = 4;
  const innerH = height - pad * 2;
  const innerW = width - pad * 2;
  return values
    .map((v, i) => {
      const x = pad + i * (innerW / Math.max(1, values.length - 1));
      const y = pad + innerH - ((v - min) / range) * innerH;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
}

function colorHex(c: SparklineVisualizationProps['color']): string {
  switch (c) {
    case 'emerald':
      return '#10B981';
    case 'rose':
      return '#F43F5E';
    case 'amber':
      return '#F59E0B';
    case 'violet':
      return '#8B5CF6';
    case 'blue':
    default:
      return '#3B82F6';
  }
}

/**
 * Sparkline visualization — inline trend.
 *
 * Pure SVG path; no chart library needed. Designed to fit a 100×32 cell.
 */
export function SparklineVisualization({
  title,
  subtitle,
  series,
  color = 'blue',
  loading,
  error,
}: SparklineVisualizationProps) {
  if (error) {
    return (
      <Card>
        <Text className="text-state-critical">{error.message}</Text>
      </Card>
    );
  }
  const path = buildPath(series, 200, 40);
  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <Title>{title}</Title>
          {subtitle ? (
            <Text className="text-xs text-canvas-500 dark:text-canvas-400">
              {subtitle}
            </Text>
          ) : null}
        </div>
        <svg viewBox="0 0 200 40" className="h-10 w-32" aria-label={`${title} sparkline`}>
          {path ? (
            <path
              d={path}
              fill="none"
              stroke={colorHex(color)}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}
        </svg>
      </div>
      {loading ? <p className="mt-2 text-xs text-canvas-500">Loading…</p> : null}
    </Card>
  );
}