'use client';

import { Card, Title, Text } from '@tremor/react';
import { useState } from 'react';

export interface KanbanCard {
  id: string;
  title: string;
  subtitle?: string;
}

export interface KanbanColumn {
  id: string;
  label: string;
  cards: KanbanCard[];
}

export interface KanbanVisualizationProps {
  title: string;
  subtitle?: string;
  columns: KanbanColumn[];
  loading?: boolean;
  error?: Error | null;
}

/**
 * Kanban visualization — status columns of cards.
 *
 * Read-only in v1 (per `EAOS-implementation-plan.md` §3.4 — kanban is a
 * visualization, not an editor). Cards are clickable to navigate to the
 * underlying entity (handler passed by parent).
 */
export function KanbanVisualization({
  title,
  subtitle,
  columns,
  loading,
  error,
  onCardClick,
}: KanbanVisualizationProps & { onCardClick?: (id: string) => void }) {
  const [hovered, setHovered] = useState<string | null>(null);
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
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {columns.map((col) => (
            <div
              key={col.id}
              className="rounded-md border border-canvas-200 bg-canvas-50 p-3 dark:border-canvas-700 dark:bg-canvas-900"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-canvas-500">
                  {col.label}
                </span>
                <span className="text-xs text-canvas-500">{col.cards.length}</span>
              </div>
              <ul className="space-y-2">
                {col.cards.map((c) => (
                  <li
                    key={c.id}
                    className={`cursor-pointer rounded-sm bg-canvas-100 p-2 text-sm shadow-sm transition-colors hover:bg-canvas-200 dark:bg-canvas-800 dark:hover:bg-canvas-700 ${
                      hovered === c.id ? 'ring-1 ring-blue-500' : ''
                    }`}
                    onMouseEnter={() => setHovered(c.id)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => onCardClick?.(c.id)}
                  >
                    <div className="font-medium">{c.title}</div>
                    {c.subtitle ? (
                      <div className="mt-0.5 text-xs text-canvas-500">{c.subtitle}</div>
                    ) : null}
                  </li>
                ))}
                {col.cards.length === 0 ? (
                  <li className="text-xs text-canvas-400">No items.</li>
                ) : null}
              </ul>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}