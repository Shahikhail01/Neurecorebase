'use client';

/**
 * /marketplace/installed — Installed Solution Packs management.
 *
 * Phase 7, Task 7.16.
 *
 * Lists every pack installed by the current tenant, with version + install
 * date + theming impact. Provides per-row uninstall with confirmation.
 *
 * Also shows the recent install/uninstall audit log so admins can see
 * who did what.
 */

import { Suspense, useMemo } from 'react';
import {
  Button,
  EmptyState,
  ErrorState,
  LoadingState,
  cn,
} from '@neurecore/ui';
import {
  useInstalledPacks,
  usePackInstallHistory,
  useUninstallSolutionPack,
} from '@/core/hooks/solution-packs';

function getTenantId(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const parts = window.location.pathname.split('/').filter(Boolean);
  const known = new Set(['knowledge', 'entity', 'agents', 'empty', 'test-query', 'marketplace', 'packs', 'installed']);
  const candidate = parts.find((p) => !known.has(p));
  return candidate;
}

export default function InstalledPacksPage() {
  return (
    <Suspense fallback={<LoadingState label="Loading installed packs…" />}>
      <InstalledPacksInner />
    </Suspense>
  );
}

function InstalledPacksInner() {
  const tenantId = useMemo(() => getTenantId(), []);
  const installedQuery = useInstalledPacks(tenantId);
  const historyQuery = usePackInstallHistory(tenantId, 20);
  const uninstall = useUninstallSolutionPack(tenantId);

  if (installedQuery.isLoading) {
    return <LoadingState label="Loading installed packs…" />;
  }
  if (installedQuery.isError) {
    return (
      <ErrorState
        error={installedQuery.error ?? 'Could not load installed packs'}
        onRetry={() => installedQuery.refetch()}
      />
    );
  }

  const installed = installedQuery.data ?? [];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
      <header>
        <h1 className="text-2xl font-bold text-canvas-900 dark:text-canvas-50">Installed Packs</h1>
        <p className="mt-1 text-sm text-canvas-600 dark:text-canvas-300">
          Manage Solution Packs installed on this tenant.
        </p>
      </header>

      {installed.length === 0 ? (
        <EmptyState
          variant="noData"
          title="No packs installed yet"
          description="Browse the marketplace to install your first pack."
          action={
            <a
              href="/marketplace"
              className="rounded-md bg-state-info px-3 py-1.5 text-xs font-medium text-white hover:bg-state-info/90"
            >
              Open marketplace
            </a>
          }
        />
      ) : (
        <ul className="space-y-3">
          {installed.map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-center gap-4 rounded-lg border border-canvas-200 bg-canvas-50 p-4 dark:border-canvas-800 dark:bg-canvas-900"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-canvas-900 dark:text-canvas-50">
                    {row.packSlug}
                  </span>
                  <span className="rounded bg-canvas-200 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-canvas-700 dark:bg-canvas-700 dark:text-canvas-200">
                    v{row.packVersion}
                  </span>
                </div>
                <div className="mt-1 text-xs text-canvas-600 dark:text-canvas-300">
                  Installed {row.installedAt.slice(0, 10)}
                  {row.themingImpact?.accentColor ? (
                    <span className="ml-3 inline-flex items-center gap-1">
                      <span
                        className="inline-block h-3 w-3 rounded"
                        style={{ backgroundColor: row.themingImpact.accentColor }}
                        aria-hidden
                      />
                      accent applied
                    </span>
                  ) : null}
                </div>
              </div>
              <Button
                variant="danger"
                size="sm"
                onClick={async () => {
                  if (!confirm(`Uninstall "${row.packSlug}"?`)) return;
                  await uninstall.mutateAsync({ slug: row.packSlug });
                  void installedQuery.refetch();
                  void historyQuery.refetch();
                }}
                disabled={uninstall.isPending}
              >
                {uninstall.isPending ? 'Uninstalling…' : 'Uninstall'}
              </Button>
            </li>
          ))}
        </ul>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-canvas-600 dark:text-canvas-300">
          Recent activity
        </h2>
        {historyQuery.isLoading ? (
          <LoadingState label="Loading history…" />
        ) : historyQuery.data && historyQuery.data.length > 0 ? (
          <ul className="divide-y divide-canvas-200 rounded-lg border border-canvas-200 dark:divide-canvas-800 dark:border-canvas-800">
            {historyQuery.data.map((h) => (
              <li
                key={h.id}
                className="flex items-center gap-3 px-3 py-2 text-xs"
              >
                <span
                  className={cn(
                    'rounded px-1.5 py-0.5 font-mono uppercase tracking-wide',
                    h.success
                      ? 'bg-state-healthy/15 text-state-healthy'
                      : 'bg-state-critical/15 text-state-critical',
                  )}
                >
                  {h.action}
                </span>
                <span className="flex-1 text-canvas-700 dark:text-canvas-200">
                  {h.errorMessage ?? 'OK'}
                </span>
                <span className="text-canvas-500">{h.performedAt.slice(0, 19).replace('T', ' ')}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-canvas-600 dark:text-canvas-300">No activity yet.</p>
        )}
      </section>
    </div>
  );
}