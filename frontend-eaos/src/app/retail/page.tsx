'use client';

/**
 * Retail Page — Phase 8 (per `EAOS-implementation-roadmap.md` §12).
 *
 * Surfaces:
 *   - 6 retail KPI widgets (Sales per Sq Ft, Stockout Rate, etc.)
 *   - 12 retail AI actions (inventory-forecast, visual-merch, etc.)
 *   - Shopify + Square integration status
 *
 * The page is the entry point to the retail pack's first vertical
 * experience. Tenants with the pack installed land here; tenants
 * without it see the install CTA.
 */

import Link from 'next/link';
import { useState } from 'react';
import {
  Card,
  Button,
  LoadingState,
  ErrorState,
  EmptyState,
  cn,
} from '@neurecore/ui';
import {
  useRetailActions,
  useRetailWidgets,
  useRetailWidgetValue,
  useExecuteRetailAction,
  useSyncShopify,
  useSyncSquare,
  type RetailActionSummary,
  type RetailWidgetSummary,
  type RetailActionId,
} from '@/core/hooks/retail';

const DEMO_ENTITY_TYPE = 'FACILITY';
const DEMO_ENTITY_ID = 'soho-flagship';

const ICON_MAP: Record<string, string> = {
  square: '▣',
  'package-x': '◌',
  'layout-grid': '▦',
  smile: '☺',
  target: '◉',
  clock: '◷',
};

const RETAIL_GREEN = '#22c55e';

export default function RetailPage() {
  const actions = useRetailActions('default');
  const widgets = useRetailWidgets('default');
  const syncShopify = useSyncShopify('default');
  const syncSquare = useSyncSquare('default');

  return (
    <main
      className="min-h-screen bg-canvas-50 px-6 py-12 dark:bg-canvas-950 sm:py-16"
      style={{ ['--retail-accent' as string]: RETAIL_GREEN }}
    >
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: RETAIL_GREEN }}
            >
              EAOS-6 · Retail Pack
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-canvas-900 dark:text-canvas-50">
              Retail Workspace
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-canvas-600 dark:text-canvas-400">
              The first vertical pack. Adds <strong>FACILITY:retail-store</strong>,
              {' '}<strong>CUSTOMER:shopper</strong> entity subtypes,
              6 retail KPIs, 12 AI actions, 50 knowledge entries, and 4
              workflow templates.
            </p>
          </div>
          <nav className="flex flex-col gap-2 text-sm">
            <Link
              href="/marketplace/packs/retail"
              className="rounded-md border px-3 py-1 text-canvas-700 hover:bg-canvas-100 dark:text-canvas-300 dark:hover:bg-canvas-900"
              style={{ borderColor: RETAIL_GREEN }}
            >
              View in Marketplace
            </Link>
            <Link
              href="/marketplace/installed"
              className="rounded-md border border-canvas-200 px-3 py-1 text-canvas-700 hover:bg-canvas-100 dark:border-canvas-700 dark:text-canvas-300 dark:hover:bg-canvas-900"
            >
              Installed packs
            </Link>
          </nav>
        </header>

        {/* ─── KPIs (Widgets) ─────────────────────────────────────── */}
        <section className="mb-12">
          <h2 className="mb-4 text-lg font-semibold text-canvas-900 dark:text-canvas-50">
            Retail KPIs
          </h2>
          {widgets.isLoading && <LoadingState label="Loading retail widgets…" />}
          {widgets.isError && (
            <ErrorState
              error="Failed to load retail widgets. Confirm the retail pack is installed."
              onRetry={() => widgets.refetch()}
            />
          )}
          {widgets.data && widgets.data.items.length === 0 && (
            <EmptyState
              variant="firstRun"
              title="No retail widgets installed"
              description="Install the Retail Pack from the Marketplace to enable retail KPIs."
              action={
                <Link
                  href="/marketplace/packs/retail"
                  className="inline-flex items-center justify-center rounded-md border border-canvas-300 px-4 py-2 text-sm font-medium text-canvas-700 hover:bg-canvas-100 dark:border-canvas-600 dark:text-canvas-300 dark:hover:bg-canvas-800"
                >
                  Open Marketplace
                </Link>
              }
            />
          )}
          {widgets.data && widgets.data.items.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {widgets.data.items.map((w) => (
                <RetailWidgetCard
                  key={w.id}
                  widget={w}
                  entityType={DEMO_ENTITY_TYPE}
                  entityId={DEMO_ENTITY_ID}
                />
              ))}
            </div>
          )}
        </section>

        {/* ─── AI Actions ─────────────────────────────────────────── */}
        <section className="mb-12">
          <h2 className="mb-4 text-lg font-semibold text-canvas-900 dark:text-canvas-50">
            Retail AI Actions
          </h2>
          {actions.isLoading && <LoadingState label="Loading retail actions…" />}
          {actions.isError && (
            <ErrorState
              error="Failed to load retail actions."
              onRetry={() => actions.refetch()}
            />
          )}
          {actions.data && actions.data.items.length === 0 && (
            <EmptyState
              variant="firstRun"
              title="No retail AI actions installed"
              description="Install the Retail Pack to access 12 retail-specific AI actions."
            />
          )}
          {actions.data && actions.data.items.length > 0 && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {actions.data.items.map((a) => (
                <RetailActionCard
                  key={a.id}
                  action={a}
                  entityType={DEMO_ENTITY_TYPE}
                  entityId={DEMO_ENTITY_ID}
                />
              ))}
            </div>
          )}
        </section>

        {/* ─── Integrations ──────────────────────────────────────── */}
        <section className="mb-12">
          <h2 className="mb-4 text-lg font-semibold text-canvas-900 dark:text-canvas-50">
            Integrations
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card padding="md" surface="flat">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-canvas-900 dark:text-canvas-50">
                    Shopify
                  </h3>
                  <p className="mt-1 text-sm text-canvas-600 dark:text-canvas-400">
                    Sync products, orders, customers, and inventory.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => syncShopify.mutate()}
                  disabled={syncShopify.isPending}
                >
                  {syncShopify.isPending ? 'Syncing…' : 'Test sync'}
                </Button>
              </div>
              {syncShopify.data && (
                <p className="mt-2 text-xs text-canvas-500">
                  {syncShopify.data.message}
                </p>
              )}
            </Card>
            <Card padding="md" surface="flat">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-canvas-900 dark:text-canvas-50">
                    Square
                  </h3>
                  <p className="mt-1 text-sm text-canvas-600 dark:text-canvas-400">
                    POS + payments sync from Square locations.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => syncSquare.mutate()}
                  disabled={syncSquare.isPending}
                >
                  {syncSquare.isPending ? 'Syncing…' : 'Test sync'}
                </Button>
              </div>
              {syncSquare.data && (
                <p className="mt-2 text-xs text-canvas-500">
                  {syncSquare.data.message}
                </p>
              )}
            </Card>
          </div>
        </section>

        <footer className="mt-16 border-t border-canvas-200 pt-6 text-xs text-canvas-500 dark:border-canvas-700">
          <p>
            Phase 8 — EAOS-6 First Vertical Pack (Retail).{' '}
            <Link href="/entity/department" className="underline">
              Browse departments
            </Link>{' '}
            ·{' '}
            <Link href="/marketplace" className="underline">
              Marketplace
            </Link>
          </p>
        </footer>
      </div>
    </main>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────

function RetailWidgetCard({
  widget,
  entityType,
  entityId,
}: {
  widget: RetailWidgetSummary;
  entityType: string;
  entityId: string;
}) {
  const value = useRetailWidgetValue('default', widget.id, entityType, entityId, {
    days: 30,
  });

  return (
    <Card padding="md" surface="flat" className="flex flex-col">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-xl">{ICON_MAP[widget.icon ?? ''] ?? '◆'}</span>
        <h3 className="text-sm font-semibold text-canvas-900 dark:text-canvas-50">
          {widget.title}
        </h3>
      </div>
      {widget.subtitle && (
        <p className="mb-3 text-xs text-canvas-500">{widget.subtitle}</p>
      )}
      <div className="flex-1">
        {value.isLoading && <LoadingState label="" />}
        {value.isError && (
          <p className="text-xs text-state-warning">
            Could not compute (entity may not exist).
          </p>
        )}
        {value.data && (
          <pre className="overflow-x-auto rounded bg-canvas-100 p-2 text-xs text-canvas-700 dark:bg-canvas-900 dark:text-canvas-300">
            {JSON.stringify(value.data.data, null, 2)}
          </pre>
        )}
      </div>
    </Card>
  );
}

function RetailActionCard({
  action,
  entityType,
  entityId,
}: {
  action: RetailActionSummary;
  entityType: string;
  entityId: string;
}) {
  const execute = useExecuteRetailAction('default');
  const [result, setResult] = useState<string | null>(null);

  return (
    <Card padding="sm" surface="flat" className="flex flex-col">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-canvas-900 dark:text-canvas-50">
            {action.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-xs text-canvas-500">
            {action.description}
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            {action.tags.slice(0, 3).map((t) => (
              <span
                key={t}
                className="rounded-full bg-canvas-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-canvas-700 dark:bg-canvas-900 dark:text-canvas-300"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-[10px] uppercase tracking-wide text-canvas-400">
          {action.category} · {action.tierRequired}
        </span>
        <Button
          size="sm"
          variant="primary"
          disabled={execute.isPending || action.requiresStreaming}
          onClick={() => {
            execute.mutate(
              {
                actionId: action.id as RetailActionId,
                entityType,
                entityId,
              },
              {
                onSuccess: (data) => {
                  const out = (data as { output?: string }).output ?? '';
                  setResult(typeof out === 'string' ? out : JSON.stringify(out, null, 2));
                },
                onError: (err) => {
                  setResult(`Error: ${err.message}`);
                },
              },
            );
          }}
          title={action.requiresStreaming ? 'Use /ai-actions/:id/stream' : 'Run action'}
        >
          {execute.isPending ? 'Running…' : 'Run'}
        </Button>
      </div>
      {result && (
        <pre className="mt-3 max-h-48 overflow-auto rounded bg-canvas-100 p-2 text-xs text-canvas-700 dark:bg-canvas-900 dark:text-canvas-300">
          {result}
        </pre>
      )}
    </Card>
  );
}