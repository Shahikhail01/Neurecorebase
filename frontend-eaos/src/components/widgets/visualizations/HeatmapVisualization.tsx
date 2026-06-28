'use client';

import { Card, Title, Text } from '@tremor/react';

export interface HeatmapCell {
  row: string;
  col: string;
  value: number;
}

export interface HeatmapVisualizationProps {
  title: string;
  subtitle?: string;
  cells: HeatmapCell[];
  rows: string[];
  cols: string[];
  loading?: boolean;
  error?: Error | null;
}

function intensity(value: number, max: number): string {
  if (max <= 0) return 'bg-tremor-background';
  const pct = value / max;
  if (pct >= 0.85) return 'bg-rose-500';
  if (pct >= 0.65) return 'bg-rose-400';
  if (pct >= 0.45) return 'bg-amber-400';
  if (pct >= 0.25) return 'bg-amber-200';
  if (pct > 0) return 'bg-emerald-200';
  return 'bg-tremor-background';
}

/**
 * Heatmap visualization — 2D density grid (rows × cols).
 *
 * Implemented as a CSS grid rather than relying on a chart library
 * (Tremor has no native Heatmap). Each cell is coloured by its relative
 * intensity within the data set. For datasets > 100 cells, the renderer
 * warns via the `subtitle` slot.
 */
export function HeatmapVisualization({
  title,
  subtitle,
  cells,
  rows,
  cols,
  loading,
  error,
}: HeatmapVisualizationProps) {
  if (error) {
    return (
      <Card>
        <Text className="text-state-critical">{error.message}</Text>
      </Card>
    );
  }
  const max = cells.reduce((m, c) => (c.value > m ? c.value : m), 0);
  const lookup = new Map<string, number>();
  for (const c of cells) lookup.set(`${c.row}::${c.col}`, c.value);

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
      ) : rows.length === 0 || cols.length === 0 ? (
        <p className="mt-4 text-sm text-canvas-500">No data.</p>
      ) : (
        <div className="mt-4 overflow-auto">
          <div
            className="grid gap-1"
            style={{
              gridTemplateColumns: `minmax(96px, max-content) repeat(${cols.length}, minmax(64px, 1fr))`,
            }}
          >
            <div />
            {cols.map((c) => (
              <div key={c} className="text-center text-xs font-medium text-canvas-500">
                {c}
              </div>
            ))}
            {rows.map((r) => (
              <div key={r} className="contents">
                <div className="py-2 pr-2 text-right text-xs font-medium text-canvas-500">
                  {r}
                </div>
                {cols.map((c) => {
                  const value = lookup.get(`${r}::${c}`) ?? 0;
                  return (
                    <div
                      key={`${r}-${c}`}
                      className={`flex h-10 items-center justify-center rounded-sm text-xs text-white ${intensity(value, max)}`}
                      title={`${r} · ${c}: ${value}`}
                    >
                      {value > 0 ? value : ''}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}