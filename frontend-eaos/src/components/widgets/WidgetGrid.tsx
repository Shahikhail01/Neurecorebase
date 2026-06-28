'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import GridLayout, { type Layout } from 'react-grid-layout';
import { Plus, Settings, X } from 'lucide-react';
import { useWidgetDefinitions } from './useWidgetDefinitions';
import { useLoadLayout, useSaveLayout } from './useLayout';
import { WidgetRenderer } from './WidgetRenderer';
import { WidgetPicker } from './WidgetPicker';
import { WidgetConfig } from './WidgetConfig';
import type {
  GridItem,
  WidgetDefinition,
  EaosEntityTypeForWidget,
} from './widget.types';

import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import '@/styles/widgets.css';

export interface WidgetGridProps {
  entityType: EaosEntityTypeForWidget;
  entityId: string;
  /** Whether the user can edit the grid (draggable + add/remove). */
  editable?: boolean;
  /** Initial items to render before the load completes. */
  initialItems?: GridItem[];
  /** Called whenever the layout is persisted (drag/resize/add/remove). */
  onLayoutChange?: (items: GridItem[]) => void;
}

/**
 * WidgetGrid — the drag-droppable grid of widgets for a workspace.
 *
 * Uses `react-grid-layout` for drag/resize. Layouts are persisted via
 * `useSaveLayout` (POST /widgets/layout/:entityType) and rehydrated via
 * `useLoadLayout` on mount.
 *
 * The grid renders a "WidgetPicker" + "WidgetConfig" modal for adding
 * new widgets and editing per-widget config. Removing a widget simply
 * drops it from the local items array (persisted on the next save).
 */
export function WidgetGrid({
  entityType,
  entityId,
  editable = true,
  initialItems,
  onLayoutChange,
}: WidgetGridProps) {
  const { data: defs = [], isLoading: defsLoading } = useWidgetDefinitions(entityType);
  const loadLayout = useLoadLayout(entityType);
  const saveLayout = useSaveLayout();

  const [items, setItems] = useState<GridItem[]>(initialItems ?? []);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [configFor, setConfigFor] = useState<WidgetDefinition | null>(null);
  const didHydrate = useRef(false);

  // Hydrate from saved layout on first load
  useEffect(() => {
    if (didHydrate.current) return;
    if (loadLayout.data && loadLayout.data.length > 0) {
      setItems(loadLayout.data);
      didHydrate.current = true;
    } else if (loadLayout.data && !loadLayout.isLoading) {
      // Saved empty — still mark hydrated so we don't override.
      didHydrate.current = true;
    }
  }, [loadLayout.data, loadLayout.isLoading]);

  // Hydrate from `initialItems` if no saved layout exists yet
  useEffect(() => {
    if (didHydrate.current) return;
    if (initialItems && initialItems.length > 0 && !loadLayout.data) {
      setItems(initialItems);
      didHydrate.current = true;
    }
  }, [initialItems, loadLayout.data]);

  const alreadyAddedIds = useMemo(
    () => new Set(items.map((i) => i.i)),
    [items],
  );

  const reactGridLayout = useMemo<Layout[]>(() => {
    return items.map((it) => ({
      i: it.i,
      x: 0,
      y: it.size.h, // placeholders; react-grid-layout will recompute
      w: it.size.w,
      h: it.size.h,
      minW: 1,
      maxW: 12,
      minH: 1,
      maxH: 24,
    }));
  }, [items]);

  const persist = useCallback(
    (next: GridItem[]) => {
      setItems(next);
      saveLayout.mutate({ entityType, items: next });
      onLayoutChange?.(next);
    },
    [entityType, saveLayout, onLayoutChange],
  );

  function onLayoutChangeRGL(_l: Layout[]) {
    // We don't sync every keystroke — debouncing happens on drag-end
    // via onDragStop/onResizeStop. This no-op keeps the prop optional.
  }

  function onDragStop(l: Layout[]) {
    const next = mergeRGL(items, l);
    persist(next);
  }

  function onResizeStop(l: Layout[]) {
    const next = mergeRGL(items, l);
    persist(next);
  }

  function addWidget(def: WidgetDefinition) {
    const newItem: GridItem = {
      i: def.id,
      size: def.defaultSize,
      config: undefined,
    };
    const next = [...items, newItem];
    persist(next);
    setPickerOpen(false);
  }

  function removeWidget(widgetId: string) {
    const next = items.filter((i) => i.i !== widgetId);
    persist(next);
  }

  function openConfig(widgetId: string) {
    const def = defs.find((d) => d.id === widgetId);
    if (def) setConfigFor(def);
  }

  function saveConfig(widgetId: string, values: Record<string, unknown>) {
    const next = items.map((i) =>
      i.i === widgetId ? { ...i, config: { ...(i.config ?? {}), ...values } } : i,
    );
    persist(next);
  }

  if (defsLoading && items.length === 0) {
    return (
      <div className="p-6 text-sm text-canvas-500">Loading widgets…</div>
    );
  }

  if (items.length === 0 && !editable) {
    return (
      <div className="p-6 text-sm text-canvas-500">
        No widgets configured for this view.
      </div>
    );
  }

  return (
    <div className="widget-grid-container">
      {editable ? (
        <div className="mb-3 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Add widget
          </button>
        </div>
      ) : null}

      <GridLayout
        className="layout"
        layout={reactGridLayout}
        cols={12}
        rowHeight={32}
        width={1200}
        margin={[12, 12]}
        containerPadding={[0, 0]}
        isDraggable={editable}
        isResizable={editable}
        onLayoutChange={onLayoutChangeRGL}
        onDragStop={onDragStop}
        onResizeStop={onResizeStop}
        compactType="vertical"
        preventCollision={false}
      >
        {items.map((it) => {
          const def = defs.find((d) => d.id === it.i);
          if (!def) {
            return (
              <div key={it.i} className="rounded-md border border-canvas-200 bg-canvas-50 p-4 dark:border-canvas-700 dark:bg-canvas-900">
                <div className="text-sm font-medium">{it.i}</div>
                <div className="mt-1 text-xs text-canvas-500">
                  Widget definition not loaded.
                </div>
              </div>
            );
          }
          return (
            <div
              key={it.i}
              className="relative rounded-md border border-canvas-200 bg-white dark:border-canvas-700 dark:bg-canvas-950"
            >
              {editable ? (
                <div className="absolute right-2 top-2 z-10 flex gap-1">
                  {def.configurableFields.length > 0 ? (
                    <button
                      type="button"
                      aria-label="Configure widget"
                      onClick={() => openConfig(def.id)}
                      className="rounded-md bg-canvas-100 p-1 text-canvas-500 hover:bg-canvas-200 dark:bg-canvas-800 dark:hover:bg-canvas-700"
                    >
                      <Settings className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                  <button
                    type="button"
                    aria-label="Remove widget"
                    onClick={() => removeWidget(def.id)}
                    className="rounded-md bg-canvas-100 p-1 text-canvas-500 hover:bg-canvas-200 dark:bg-canvas-800 dark:hover:bg-canvas-700"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : null}
              <div className="h-full w-full overflow-hidden p-2">
                <WidgetRenderer
                  definition={def}
                  entityType={entityType}
                  entityId={entityId}
                  config={it.config}
                />
              </div>
            </div>
          );
        })}
      </GridLayout>

      <WidgetPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        entityType={entityType}
        available={defs}
        alreadyAddedIds={alreadyAddedIds}
        onAdd={addWidget}
      />

      {configFor ? (
        <WidgetConfig
          open={!!configFor}
          onClose={() => setConfigFor(null)}
          widgetTitle={configFor.title}
          fields={configFor.configurableFields}
          initialValues={
            items.find((i) => i.i === configFor.id)?.config
          }
          onSave={(values) => saveConfig(configFor.id, values)}
        />
      ) : null}
    </div>
  );
}

function mergeRGL(current: GridItem[], l: Layout[]): GridItem[] {
  const map = new Map(l.map((x) => [x.i, x]));
  return current.map((it) => {
    const found = map.get(it.i);
    if (!found) return it;
    return { ...it, size: { w: found.w, h: found.h } };
  });
}