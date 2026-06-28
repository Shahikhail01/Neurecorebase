'use client';

import { Card, Title, ProgressBar, Text } from '@tremor/react';

export interface GaugeVisualizationProps {
  title: string;
  subtitle?: string;
  value: number | string | null;
  /** Maximum value the gauge represents (e.g. 100 for percent). Default 100. */
  max?: number;
  /** Threshold above which the gauge is "good" (green). Default 70. */
  healthyThreshold?: number;
  loading?: boolean;
  error?: Error | null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function severityColor(percent: number, healthy: number): 'emerald' | 'amber' | 'rose' {
  if (percent >= healthy) return 'emerald';
  if (percent >= healthy * 0.5) return 'amber';
  return 'rose';
}

/**
 * Gauge visualization — single metric vs target (0..max).
 *
 * Tremor's `ProgressBar` is the closest native primitive. We render the
 * value above the bar + a percentage label inside for parity with a
 * traditional gauge look (Tremor has no `Gauge` component in its free
 * set; this is the canonical substitute).
 */
export function GaugeVisualization({
  title,
  subtitle,
  value,
  max = 100,
  healthyThreshold = 70,
  loading,
  error,
}: GaugeVisualizationProps) {
  if (error) {
    return (
      <Card>
        <Text className="text-state-critical">{error.message}</Text>
      </Card>
    );
  }
  const numeric =
    typeof value === 'number'
      ? value
      : value === null || value === undefined
        ? null
        : Number(value);
  const percent =
    numeric === null || !Number.isFinite(numeric)
      ? 0
      : clamp((numeric / max) * 100, 0, 100);
  const color = severityColor(percent, healthyThreshold);

  return (
    <Card>
      <Title>{title}</Title>
      {subtitle ? (
        <Text className="text-xs text-canvas-500 dark:text-canvas-400">
          {subtitle}
        </Text>
      ) : null}
      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-2xl font-semibold">
          {loading ? '…' : numeric === null ? '—' : numeric.toFixed(1)}
        </span>
        <span className="text-xs text-canvas-500">/ {max}</span>
      </div>
      <ProgressBar
        className="mt-3"
        value={percent}
        color={color}
        showAnimation
      />
    </Card>
  );
}