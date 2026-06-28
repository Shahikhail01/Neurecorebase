'use client';

import { useState } from 'react';
import { Dialog, DialogPanel, Title, Text, Button } from '@tremor/react';
import type { ConfigField } from './widget.types';

export interface WidgetConfigProps {
  open: boolean;
  onClose: () => void;
  widgetTitle: string;
  fields: ConfigField[];
  initialValues?: Record<string, unknown>;
  onSave: (values: Record<string, unknown>) => void;
}

/**
 * WidgetConfig — per-widget configuration modal.
 *
 * Renders a dynamic form from the widget's `configurableFields` schema
 * (declared in the widget definition). One control type per field
 * (select / number / text / boolean / dateRange). Saved values flow back
 * to the parent via `onSave` and are merged into the GridItem's
 * `config`, which is then passed to `useWidgetValue` as `params`.
 */
export function WidgetConfig({
  open,
  onClose,
  widgetTitle,
  fields,
  initialValues,
  onSave,
}: WidgetConfigProps) {
  const [values, setValues] = useState<Record<string, unknown>>(() => {
    const seed: Record<string, unknown> = {};
    for (const f of fields) seed[f.key] = initialValues?.[f.key] ?? f.defaultValue;
    return seed;
  });

  function update(key: string, value: unknown) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <Dialog open={open} onClose={onClose} static={true}>
      <DialogPanel className="max-w-lg">
        <Title>Configure {widgetTitle}</Title>
        <Text className="mt-1 text-xs text-canvas-500">
          Adjust widget settings. Saved values are remembered per user.
        </Text>
        <div className="mt-4 space-y-3">
          {fields.length === 0 ? (
            <Text>This widget has no configurable options.</Text>
          ) : (
            fields.map((f) => (
              <div key={f.key} className="space-y-1">
                <label className="block text-sm font-medium" htmlFor={`cfg-${f.key}`}>
                  {f.label}
                  {f.required ? <span className="ml-1 text-state-critical">*</span> : null}
                </label>
                {f.type === 'select' ? (
                  <select
                    id={`cfg-${f.key}`}
                    className="w-full rounded-md border border-canvas-200 bg-canvas-50 px-2 py-1 text-sm dark:border-canvas-700 dark:bg-canvas-900"
                    value={String(values[f.key] ?? '')}
                    onChange={(e) => update(f.key, e.target.value)}
                  >
                    {(f.options ?? []).map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                ) : f.type === 'number' ? (
                  <input
                    id={`cfg-${f.key}`}
                    type="number"
                    className="w-full rounded-md border border-canvas-200 bg-canvas-50 px-2 py-1 text-sm dark:border-canvas-700 dark:bg-canvas-900"
                    value={Number(values[f.key] ?? 0)}
                    onChange={(e) => update(f.key, Number(e.target.value))}
                  />
                ) : f.type === 'boolean' ? (
                  <input
                    id={`cfg-${f.key}`}
                    type="checkbox"
                    checked={Boolean(values[f.key])}
                    onChange={(e) => update(f.key, e.target.checked)}
                  />
                ) : (
                  <input
                    id={`cfg-${f.key}`}
                    type="text"
                    className="w-full rounded-md border border-canvas-200 bg-canvas-50 px-2 py-1 text-sm dark:border-canvas-700 dark:bg-canvas-900"
                    value={String(values[f.key] ?? '')}
                    onChange={(e) => update(f.key, e.target.value)}
                  />
                )}
              </div>
            ))
          )}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onSave(values);
              onClose();
            }}
          >
            Save
          </Button>
        </div>
      </DialogPanel>
    </Dialog>
  );
}