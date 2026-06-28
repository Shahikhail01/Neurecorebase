'use client';

import {
  EmptyState,
  type EmptyStateVariant,
  Button,
} from '@neurecore/ui/components';

const EMPTY_STATE_VARIANTS: EmptyStateVariant[] = [
  'firstRun',
  'noData',
  'noPermission',
  'noResults',
  'integrationDisconnected',
  'aiGeneratedNothing',
];

export default function EmptyPage() {
  return (
    <main className="min-h-screen bg-canvas-50 px-6 py-12 dark:bg-canvas-950">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold text-canvas-900 dark:text-canvas-50">
          Empty State Components
        </h1>
        <p className="mt-2 text-canvas-600 dark:text-canvas-400">
          Phase 1, Task 1.29 — proving the 6 canonical empty states are wired.
        </p>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {EMPTY_STATE_VARIANTS.map((variant) => (
            <div
              key={variant}
              className="rounded-lg border border-canvas-200 bg-canvas-50 p-6 dark:border-canvas-700 dark:bg-canvas-900"
            >
              <h3 className="text-sm font-medium text-canvas-600 dark:text-canvas-400">
                {variant}
              </h3>
              <div className="mt-4 min-h-[200px]">
                <EmptyState
                  variant={variant}
                  action={
                    <Button variant="outline" size="sm">
                      Action
                    </Button>
                  }
                />
              </div>
            </div>
          ))}
        </div>

        <section className="mt-8 rounded-lg border border-canvas-200 bg-canvas-50 p-6 dark:border-canvas-700 dark:bg-canvas-900">
          <h2 className="text-lg font-semibold text-canvas-900 dark:text-canvas-50">
            Custom Content Override
          </h2>
          <p className="mt-1 text-sm text-canvas-500 dark:text-canvas-400">
            Each variant accepts optional title, description, and action overrides.
          </p>
          <div className="mt-4">
            <EmptyState
              variant="noData"
              title="No agents yet"
              description="Spawn your first AI Employee to get started."
              action={<Button variant="primary">Spawn Agent</Button>}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
