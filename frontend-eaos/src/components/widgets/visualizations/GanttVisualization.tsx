'use client';

import { Card, Title, Text } from '@tremor/react';

export interface GanttBar {
  id: string;
  label: string;
  start: number; // percentage 0-100
  end: number;   // percentage 0-100
  color?: 'blue' | 'emerald' | 'amber' | 'rose';
}

export interface GanttVisualizationProps {
  title: string;
  subtitle?: string;
  bars: GanttBar[];
  /** Optional axis labels for the start/end of the timeline. */
  axisLabels?: { start: string; end: string };
  loading?: boolean;
  error?: Error | null;
}

function colorClass(c?: GanttBar['color']): string {
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
 * Gantt visualization — horizontal timeline of overlapping intervals.
 *
 * Implemented as a stack of CSS-positioned bars (no chart library; Tremor
 * has no native Gantt). Coordinates are normalized to percentages so the
 * widget scales with its grid cell.
 */
export function GanttVisualization({
  title,
  subtitle,
  bars,
  axisLabels,
  loading,
  error,
}: GanttVisualizationProps) {
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
        <div className="mt-4">
          {axisLabels ? (
            <div className="mb-2 flex justify-between text-xs text-canvas-500">
              <span>{axisLabels.start}</span>
              <span>{axisLabels.end}</span>
            </div>
          ) : null}
          <ul className="space-y-2">
            {bars.map((b) => (
              <li key={b.id} className="relative h-7">
                <span className="absolute left-0 top-0 z-10 px-2 text-xs leading-7">
                  {b.label}
                </span>
                <div className="absolute inset-y-1 inset-x-0 rounded-sm bg-canvas-100 dark:bg-canvas-800" />
                <div
                  className={`absolute inset-y-1 rounded-sm ${colorClass(b.color)} opacity-80`}
                  style={{
                    left: `${Math.max(0, Math.min(100, b.start))}%`,
                    width: `${Math.max(0, Math.min(100, b.end - b.start))}%`,
                  }}
                  title={`${b.label} (${b.start}%–${b.end}%)`}
                />
              </li>
            ))}
            {bars.length === 0 ? (
              <li className="text-xs text-canvas-400">No bars.</li>
            ) : null}
          </ul>
        </div>
      )}
    </Card>
  );
}