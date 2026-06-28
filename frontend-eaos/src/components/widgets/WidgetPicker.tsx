'use client';

import { useState, useMemo } from 'react';
import { Dialog, DialogPanel, Title, Text, Button, TextInput } from '@tremor/react';
import { Search } from 'lucide-react';
import type { WidgetDefinition, EaosEntityTypeForWidget } from './widget.types';

export interface WidgetPickerProps {
  open: boolean;
  onClose: () => void;
  entityType: EaosEntityTypeForWidget;
  available: WidgetDefinition[];
  alreadyAddedIds: Set<string>;
  onAdd: (definition: WidgetDefinition) => void;
}

/**
 * WidgetPicker — modal for selecting widgets to add to the grid.
 *
 * Filters by entity-type applicability + a free-text search across
 * title + capability + subtitle. "Already added" widgets are shown
 * greyed-out with a badge so the user can't double-add the same widget.
 */
export function WidgetPicker({
  open,
  onClose,
  entityType,
  available,
  alreadyAddedIds,
  onAdd,
}: WidgetPickerProps) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return available;
    return available.filter((w) =>
      [w.title, w.subtitle ?? '', w.capability, w.id]
        .join(' ')
        .toLowerCase()
        .includes(q),
    );
  }, [available, query]);

  return (
    <Dialog open={open} onClose={onClose} static={true}>
      <DialogPanel className="max-w-2xl">
        <Title>Add a widget</Title>
        <Text className="mt-1 text-xs text-canvas-500">
          Choose from {available.length} widgets available for {entityType}.
        </Text>
        <div className="mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-canvas-400" aria-hidden />
            <TextInput
              placeholder="Search widgets…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <ul className="mt-4 max-h-96 space-y-2 overflow-auto">
          {filtered.length === 0 ? (
            <Text>No widgets match your search.</Text>
          ) : (
            filtered.map((w) => {
              const added = alreadyAddedIds.has(w.id);
              return (
                <li
                  key={w.id}
                  className={`flex items-start justify-between gap-3 rounded-md border p-3 ${
                    added
                      ? 'border-canvas-200 bg-canvas-50 opacity-60 dark:border-canvas-700 dark:bg-canvas-900'
                      : 'border-canvas-200 hover:border-blue-400 dark:border-canvas-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{w.title}</span>
                      {added ? (
                        <span className="rounded-full bg-canvas-200 px-2 py-0.5 text-xs dark:bg-canvas-700">
                          Added
                        </span>
                      ) : null}
                    </div>
                    {w.subtitle ? (
                      <Text className="text-xs text-canvas-500">{w.subtitle}</Text>
                    ) : null}
                    <Text className="text-xs text-canvas-400">
                      {w.capability} · {w.defaultVisualization}
                    </Text>
                  </div>
                  <Button
                    size="xs"
                    variant="secondary"
                    disabled={added}
                    onClick={() => onAdd(w)}
                  >
                    {added ? 'Already added' : 'Add'}
                  </Button>
                </li>
              );
            })
          )}
        </ul>
        <div className="mt-6 flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogPanel>
    </Dialog>
  );
}