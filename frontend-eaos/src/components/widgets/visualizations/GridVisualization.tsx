'use client';

import { Card, Title, Text } from '@tremor/react';

export interface GridCard {
  id: string;
  label: string;
  value: string | number;
  badge?: { label: string; color: 'emerald' | 'amber' | 'rose' | 'blue' | 'gray' };
}

export interface GridVisualizationProps {
  title: string;
  subtitle?: string;
  cards: GridCard[];
  loading?: boolean;
  error?: Error | null;
}

function badgeClass(color: NonNullable<GridCard['badge']>['color']): string {
  switch (color) {
    case 'emerald':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
    case 'amber':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
    case 'rose':
      return 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200';
    case 'blue':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'gray':
    default:
      return 'bg-canvas-100 text-canvas-700 dark:bg-canvas-800 dark:text-canvas-300';
  }
}

/**
 * Grid visualization — multi-card layout (e.g. workforce status).
 */
export function GridVisualization({
  title,
  subtitle,
  cards,
  loading,
  error,
}: GridVisualizationProps) {
  if (error) {
    return (
      <Card>
        <Text className="text-state-critical">{error.message}</Text>
      </Card>
    );
  }
  return (
    <Card>
      <Title>{title}</Title>
      {subtitle ? (
        <Text className="text-xs text-canvas-500 dark:text-canvas-400">
          {subtitle}
        </Text>
      ) : null}
      {loading ? (
        <p className="mt-4 text-sm text-canvas-500">Loading…</p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
          {cards.map((c) => (
            <div
              key={c.id}
              className="rounded-md border border-canvas-200 bg-canvas-50 p-3 dark:border-canvas-700 dark:bg-canvas-900"
            >
              <div className="flex items-start justify-between">
                <span className="text-xs text-canvas-500">{c.label}</span>
                {c.badge ? (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${badgeClass(c.badge.color)}`}
                  >
                    {c.badge.label}
                  </span>
                ) : null}
              </div>
              <div className="mt-1 text-lg font-semibold">{c.value}</div>
            </div>
          ))}
          {cards.length === 0 ? (
            <p className="col-span-full text-xs text-canvas-400">No items.</p>
          ) : null}
        </div>
      )}
    </Card>
  );
}