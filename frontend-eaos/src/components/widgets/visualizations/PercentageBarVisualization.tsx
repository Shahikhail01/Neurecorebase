'use client';

import { Card, Title, Text } from '@tremor/react';

export interface PercentageBarVisualizationProps {
  title: string;
  subtitle?: string;
  value: number; // 0..100
  label?: string;
  color?: 'emerald' | 'amber' | 'rose' | 'blue';
  loading?: boolean;
  error?: Error | null;
}

function colorClass(c: PercentageBarVisualizationProps['color']): string {
  switch (c) {
    case 'emerald':
      return 'bg-emerald-500';
    case 'amber':
      return 'bg-amber-500';
    case 'rose':
      return 'bg-rose-500';
    case 'blue':
    default:
      return 'bg-blue-500';
  }
}

/**
 * PercentageBar visualization — progress bar (0..100).
 *
 * Used for goal completion, budget burn, etc. Renders the percentage
 * inside the bar for at-a-glance scanning.
 */
export function PercentageBarVisualization({
  title,
  subtitle,
  value,
  label,
  color = 'blue',
  loading,
  error,
}: PercentageBarVisualizationProps) {
  if (error) {
    return (
      <Card>
        <Text className="text-state-critical">{error.message}</Text>
      </Card>
    );
  }
  const pct = Math.max(0, Math.min(100, value));
  return (
    <Card>
      <Title>{title}</Title>
      {subtitle ? (
        <Text className="text-xs text-canvas-500 dark:text-canvas-400">
          {subtitle}
        </Text>
      ) : null}
      <div className="mt-4">
        <div className="mb-1 flex items-baseline justify-between">
          <span className="text-sm font-medium">{label ?? 'Progress'}</span>
          <span className="text-sm font-semibold">
            {loading ? '…' : `${pct.toFixed(1)}%`}
          </span>
        </div>
        <div
          className="h-3 w-full overflow-hidden rounded-full bg-canvas-100 dark:bg-canvas-800"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className={`h-full ${colorClass(color)} transition-all`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </Card>
  );
}