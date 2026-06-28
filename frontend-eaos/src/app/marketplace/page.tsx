'use client';

/**
 * /marketplace — Unified Marketplace page.
 *
 * Phase 7, Task 7.14 (per EAOS-implementation-plan.md §11.2 + §9.8).
 *
 * 8 tabs:
 *   - Packs                → vertical + horizontal Solution Packs
 *   - Agent templates      → re-uses agent-templates table
 *   - Connectors           → CrmConnector rows
 *   - Workflows            → workflow templates
 *   - Knowledge Packs      → knowledge_packs table
 *   - Widgets              → pack-contributed widgets
 *   - Themes               → static theme catalog
 *   - Installed            → tenant_installed_packs
 *
 * Each tab fetches via /marketplace/items and renders the unified
 * <MarketplaceCard>. Packs open a pre-flight <InstallPackDialog>.
 */

import { Suspense, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  EmptyState,
  ErrorState,
  LoadingState,
  cn,
} from '@neurecore/ui';
import {
  useMarketplaceItems,
  useMarketplaceTabs,
  type MarketplaceItem,
  type MarketplaceTab,
} from '@/core/hooks/marketplace';
import { MarketplaceCard } from '@/components/marketplace/MarketplaceCard';
import { InstallPackDialog } from '@/components/marketplace/InstallPackDialog';

const TABS: Array<{ key: MarketplaceTab; label: string }> = [
  { key: 'packs', label: 'Packs' },
  { key: 'agent-templates', label: 'Agent templates' },
  { key: 'connectors', label: 'Connectors' },
  { key: 'workflows', label: 'Workflows' },
  { key: 'knowledge-packs', label: 'Knowledge packs' },
  { key: 'widgets', label: 'Widgets' },
  { key: 'themes', label: 'Themes' },
  { key: 'installed', label: 'Installed' },
];

function getTenantId(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const parts = window.location.pathname.split('/').filter(Boolean);
  const known = new Set([
    'knowledge',
    'entity',
    'agents',
    'empty',
    'test-query',
    'marketplace',
  ]);
  const candidate = parts.find((p) => !known.has(p));
  return candidate;
}

export default function MarketplacePage() {
  return (
    <Suspense fallback={<LoadingState label="Loading marketplace…" />}>
      <MarketplaceInner />
    </Suspense>
  );
}

function MarketplaceInner() {
  const router = useRouter();
  const tenantId = useMemo(() => getTenantId(), []);
  const [tab, setTab] = useState<MarketplaceTab>('packs');
  const [q, setQ] = useState('');
  const [installSlug, setInstallSlug] = useState<string | null>(null);

  const tabsQuery = useMarketplaceTabs(tenantId);
  const itemsQuery = useMarketplaceItems(tenantId, tab, q || undefined);

  const openDetail = (item: MarketplaceItem) => {
    if (item.tab === 'packs') {
      router.push(`/marketplace/packs/${item.slug}`);
    } else if (item.tab === 'installed') {
      router.push(`/marketplace/packs/${item.slug}`);
    } else if (item.tab === 'connectors') {
      router.push(`/marketplace/packs/${item.slug}`);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-canvas-900 dark:text-canvas-50">Marketplace</h1>
        <p className="text-sm text-canvas-600 dark:text-canvas-300">
          Browse, install, and manage Solution Packs, agents, connectors, and more.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2 border-b border-canvas-200 pb-2 dark:border-canvas-800">
        {TABS.map((t) => {
          const count = tabsQuery.data?.counts?.[t.key];
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                'flex items-center gap-2 rounded-t-md px-3 py-2 text-xs font-medium transition',
                tab === t.key
                  ? 'border-b-2 border-state-info text-state-info'
                  : 'text-canvas-600 hover:text-canvas-900 dark:text-canvas-300 dark:hover:text-canvas-50',
              )}
            >
              {t.label}
              {typeof count === 'number' ? (
                <span
                  className={cn(
                    'rounded-full px-1.5 text-[10px]',
                    tab === t.key
                      ? 'bg-state-info/10 text-state-info'
                      : 'bg-canvas-200 text-canvas-600 dark:bg-canvas-700 dark:text-canvas-300',
                  )}
                >
                  {count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={`Search ${tab}…`}
          className="h-9 min-w-[260px] flex-1 rounded-md border border-canvas-300 bg-canvas-50 px-3 text-sm dark:border-canvas-700 dark:bg-canvas-900"
        />
      </div>

      {itemsQuery.isLoading ? (
        <LoadingState label={`Loading ${tab}…`} />
      ) : itemsQuery.isError ? (
        <ErrorState
          error={itemsQuery.error ?? 'Could not load items'}
          onRetry={() => itemsQuery.refetch()}
        />
      ) : itemsQuery.data && itemsQuery.data.length === 0 ? (
        <EmptyState
          variant="noResults"
          title={`No ${tab} match your filters`}
          description="Try clearing the search box or switching tabs."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {(itemsQuery.data ?? []).map((item) => (
            <MarketplaceCard
              key={`${item.tab}-${item.id}`}
              item={item}
              href={item.tab === 'packs' || item.tab === 'installed' ? `/marketplace/packs/${item.slug}` : undefined}
              onClick={item.tab === 'packs' || item.tab === 'installed' ? undefined : () => openDetail(item)}
              rightAction={
                item.tab === 'packs' && !item.installed
                  ? {
                      label: 'Install',
                      onClick: () => setInstallSlug(item.slug),
                    }
                  : undefined
              }
            />
          ))}
        </div>
      )}

      {installSlug ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-canvas-900/60 p-4"
          onClick={() => setInstallSlug(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-2xl rounded-xl bg-canvas-50 shadow-2xl dark:bg-canvas-950"
            onClick={(e) => e.stopPropagation()}
          >
            <InstallPackDialog
              tenantId={tenantId}
              slug={installSlug}
              packName={installSlug}
              onClose={() => setInstallSlug(null)}
              onInstalled={() => {
                setInstallSlug(null);
                void itemsQuery.refetch();
                void tabsQuery.refetch();
              }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}