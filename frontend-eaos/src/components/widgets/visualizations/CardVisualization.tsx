'use client';

import { Card, Metric, Text, Title, Flex, BadgeDelta } from '@tremor/react';
import type { AggregationResult } from '../widget.types';

export interface CardVisualizationProps {
  title: string;
  subtitle?: string;
  value: AggregationResult['value'];
  trend?: 'UP' | 'DOWN' | 'STABLE';
  format?: 'number' | 'currency' | 'percent';
  loading?: boolean;
  error?: Error | null;
}

function formatValue(value: AggregationResult['value'], format: CardVisualizationProps['format']): string {
  if (value === null || value === undefined) return '—';
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) return String(value);
  if (format === 'currency') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(num);
  }
  if (format === 'percent') {
    return `${num.toFixed(1)}%`;
  }
  return new Intl.NumberFormat('en-US').format(num);
}

function deltaForTrend(trend?: CardVisualizationProps['trend']): {
  deltaType: 'increase' | 'decrease' | 'unchanged';
  delta: string;
} {
  if (trend === 'UP') return { deltaType: 'increase', delta: '+' };
  if (trend === 'DOWN') return { deltaType: 'decrease', delta: '−' };
  return { deltaType: 'unchanged', delta: '·' };
}

/**
 * Card visualization — single metric tile (KPI).
 *
 * Per NUWS §2.7, the Insights panel may show up to 4 of these on first
 * paint. Uses Tremor's `Card` + `Metric` primitives.
 */
export function CardVisualization({
  title,
  subtitle,
  value,
  trend,
  format,
  loading,
  error,
}: CardVisualizationProps) {
  if (error) {
    return (
      <Card>
        <Text className="text-state-critical">{error.message}</Text>
      </Card>
    );
  }
  const formatted = formatValue(value, format);
  const { deltaType, delta } = deltaForTrend(trend);

  return (
    <Card decoration="top" decorationColor="blue">
      <Flex alignItems="start">
        <div>
          <Text>{title}</Text>
          {subtitle ? (
            <Text className="text-xs text-canvas-500 dark:text-canvas-400">
              {subtitle}
            </Text>
          ) : null}
        </div>
        {trend ? <BadgeDelta deltaType={deltaType}>{delta}</BadgeDelta> : null}
      </Flex>
      <Metric className="mt-2">{loading ? '…' : formatted}</Metric>
    </Card>
  );
}