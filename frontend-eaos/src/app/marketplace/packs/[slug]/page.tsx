'use client';

/**
 * /marketplace/packs/[slug] — Solution Pack detail page.
 *
 * Phase 7, Task 7.15 (per EAOS-implementation-plan.md §5.4 + §11).
 *
 * Shows:
 *   - Pack metadata (icon, name, tier, status, version)
 *   - Description + shortDescription
 *   - Impact preview (counts of new entity subtypes / widgets / actions / …)
 *   - Mission Feed preview items ("after install, you'll see…")
 *   - Theming impact (accent color, rationale)
 *   - Entity subtypes contributed
 *   - Widget contributions
 *   - AI action contributions
 *   - Knowledge seeds (count + first 3 titles)
 *   - Integrations contributed
 *   - Workflow templates
 *   - Install button (opens InstallPackDialog)
 */

import { Suspense, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Button,
  EmptyState,
  ErrorState,
  LoadingState,
  cn,
} from '@neurecore/ui';
import {
  useInstallSolutionPack,
  useSolutionPack,
  useUninstallSolutionPack,
  type SolutionPack,
} from '@/core/hooks/solution-packs';
import { InstallPackDialog } from '@/components/marketplace/InstallPackDialog';

function getTenantId(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const parts = window.location.pathname.split('/').filter(Boolean);
  const known = new Set(['knowledge', 'entity', 'agents', 'empty', 'test-query', 'marketplace', 'packs']);
  const candidate = parts.find((p) => !known.has(p));
  return candidate;
}

export default function PackDetailPage() {
  return (
    <Suspense fallback={<LoadingState label="Loading pack…" />}>
      <PackDetailInner />
    </Suspense>
  );
}

function PackDetailInner() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const tenantId = useMemo(() => getTenantId(), []);
  const slug = params?.slug;

  const packQuery = useSolutionPack(tenantId, slug);
  const uninstall = useUninstallSolutionPack(tenantId);
  const install = useInstallSolutionPack(tenantId);
  const [showInstall, setShowInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  if (packQuery.isLoading) {
    return <LoadingState label="Loading pack…" />;
  }
  if (packQuery.isError || !packQuery.data) {
    return (
      <ErrorState
        error={packQuery.error ?? 'The pack may have been removed or you may not have access.'}
        onRetry={() => packQuery.refetch()}
      />
    );
  }
  const pack = packQuery.data;

  const handleUninstall = async () => {
    if (!confirm(`Uninstall "${pack.name}"? This removes all pack-contributed content.`)) {
      return;
    }
    await uninstall.mutateAsync({ slug: pack.slug });
    setIsInstalled(false);
    router.push('/marketplace');
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
      <button
        type="button"
        onClick={() => router.back()}
        className="self-start text-xs text-canvas-600 hover:underline dark:text-canvas-300"
      >
        ← Back to marketplace
      </button>

      <header className="flex flex-wrap items-start gap-4">
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl text-xl font-bold"
          style={{ backgroundColor: `${pack.color}22`, color: pack.color }}
          aria-hidden
        >
          {pack.icon.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-canvas-900 dark:text-canvas-50">{pack.name}</h1>
            <TierBadge tier={pack.tierRequired} />
            <StatusBadge status={pack.status} />
            <span className="rounded bg-canvas-200 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-canvas-700 dark:bg-canvas-700 dark:text-canvas-200">
              {pack.category}
            </span>
            <span className="rounded bg-canvas-200 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-canvas-700 dark:bg-canvas-700 dark:text-canvas-200">
              v{pack.version}
            </span>
          </div>
          <p className="mt-2 text-sm text-canvas-600 dark:text-canvas-300">
            {pack.description}
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2">
          <Button
            variant="primary"
            onClick={() => setShowInstall(true)}
            disabled={pack.status === 'draft' || pack.status === 'deprecated' || install.isPending}
          >
            {isInstalled ? 'Re-install' : 'Install'}
          </Button>
          <Button
            variant="ghost"
            onClick={handleUninstall}
            disabled={uninstall.isPending}
          >
            {uninstall.isPending ? 'Uninstalling…' : 'Uninstall'}
          </Button>
        </div>
      </header>

      {showInstall ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-canvas-900/60 p-4"
          onClick={() => setShowInstall(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-2xl rounded-xl bg-canvas-50 shadow-2xl dark:bg-canvas-950"
            onClick={(e) => e.stopPropagation()}
          >
            <InstallPackDialog
              tenantId={tenantId}
              slug={pack.slug}
              packName={pack.name}
              onClose={() => setShowInstall(false)}
              onInstalled={() => {
                setShowInstall(false);
                setIsInstalled(true);
                void packQuery.refetch();
              }}
            />
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Section title="Entity subtypes">
          {pack.extensions.entitySubtypes && pack.extensions.entitySubtypes.length > 0 ? (
            <ul className="space-y-2">
              {pack.extensions.entitySubtypes.map((s) => (
                <li
                  key={`${s.baseType}-${s.subtype}`}
                  className="flex items-center gap-3 rounded-lg border border-canvas-200 bg-white p-2 dark:border-canvas-800 dark:bg-canvas-950"
                >
                  <span className="text-sm font-mono text-canvas-600 dark:text-canvas-300">
                    {s.baseType}
                  </span>
                  <span className="text-canvas-400">→</span>
                  <span className="text-sm font-medium text-canvas-900 dark:text-canvas-50">
                    {s.label}
                  </span>
                  <code className="ml-auto rounded bg-canvas-100 px-1.5 py-0.5 text-[10px] text-canvas-700 dark:bg-canvas-800 dark:text-canvas-200">
                    {s.subtype}
                  </code>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              variant="noData"
              title="No entity subtypes contributed"
              description="This pack does not add new entity shapes."
            />
          )}
        </Section>

        <Section title="Widgets">
          {pack.extensions.widgetExtensions && pack.extensions.widgetExtensions.length > 0 ? (
            <ul className="space-y-2">
              {pack.extensions.widgetExtensions.map((w) => (
                <li
                  key={w.id}
                  className="rounded-lg border border-canvas-200 bg-white p-2 dark:border-canvas-800 dark:bg-canvas-950"
                >
                  <div className="text-sm font-medium text-canvas-900 dark:text-canvas-50">
                    {w.title}
                  </div>
                  {w.subtitle ? (
                    <div className="text-xs text-canvas-600 dark:text-canvas-300">
                      {w.subtitle}
                    </div>
                  ) : null}
                  <div className="mt-1 flex gap-2 text-[10px] uppercase tracking-wide text-canvas-500">
                    <span>{w.aggregationType}</span>
                    <span>·</span>
                    <span>{w.defaultVisualization}</span>
                    <span>·</span>
                    <span>{w.category}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState variant="noData" title="No widgets contributed" />
          )}
        </Section>

        <Section title="AI actions">
          {pack.extensions.aiActionExtensions && pack.extensions.aiActionExtensions.length > 0 ? (
            <ul className="space-y-2">
              {pack.extensions.aiActionExtensions.map((a) => (
                <li
                  key={a.id}
                  className="rounded-lg border border-canvas-200 bg-white p-2 dark:border-canvas-800 dark:bg-canvas-950"
                >
                  <div className="text-sm font-medium text-canvas-900 dark:text-canvas-50">
                    {a.name}
                  </div>
                  <div className="text-xs text-canvas-600 dark:text-canvas-300">{a.description}</div>
                  <div className="mt-1 text-[10px] uppercase tracking-wide text-canvas-500">
                    {a.category} · {a.capability} · tier {a.tierRequired}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState variant="noData" title="No AI actions contributed" />
          )}
        </Section>

        <Section title="Knowledge seeds">
          {pack.extensions.knowledgePacks && pack.extensions.knowledgePacks.length > 0 ? (
            <ul className="space-y-2">
              {pack.extensions.knowledgePacks.slice(0, 5).map((k) => (
                <li
                  key={k.title}
                  className="rounded-lg border border-canvas-200 bg-white p-2 dark:border-canvas-800 dark:bg-canvas-950"
                >
                  <div className="text-sm font-medium text-canvas-900 dark:text-canvas-50">
                    {k.title}
                  </div>
                  <div className="text-[10px] uppercase tracking-wide text-canvas-500">{k.type}</div>
                </li>
              ))}
              {pack.extensions.knowledgePacks.length > 5 ? (
                <li className="text-xs text-canvas-600 dark:text-canvas-300">
                  +{pack.extensions.knowledgePacks.length - 5} more
                </li>
              ) : null}
            </ul>
          ) : (
            <EmptyState variant="noData" title="No knowledge seeds contributed" />
          )}
        </Section>

        <Section title="Integrations">
          {pack.extensions.integrationDefinitions && pack.extensions.integrationDefinitions.length > 0 ? (
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {pack.extensions.integrationDefinitions.map((i) => (
                <li
                  key={i.providerId}
                  className="rounded-lg border border-canvas-200 bg-white p-2 dark:border-canvas-800 dark:bg-canvas-950"
                >
                  <div className="text-sm font-medium text-canvas-900 dark:text-canvas-50">
                    {i.name}
                  </div>
                  <div className="text-xs text-canvas-600 dark:text-canvas-300">{i.description}</div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState variant="noData" title="No integrations contributed" />
          )}
        </Section>

        <Section title="Workflow templates">
          {pack.extensions.workflowTemplates && pack.extensions.workflowTemplates.length > 0 ? (
            <ul className="space-y-2">
              {pack.extensions.workflowTemplates.map((w) => (
                <li
                  key={w.slug}
                  className="rounded-lg border border-canvas-200 bg-white p-2 dark:border-canvas-800 dark:bg-canvas-950"
                >
                  <div className="text-sm font-medium text-canvas-900 dark:text-canvas-50">
                    {w.name}
                  </div>
                  <div className="text-xs text-canvas-600 dark:text-canvas-300">{w.description}</div>
                  <div className="mt-1 text-[10px] uppercase tracking-wide text-canvas-500">
                    trigger: {w.trigger}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState variant="noData" title="No workflow templates contributed" />
          )}
        </Section>
      </div>

      <PackPreviewSection pack={pack} />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-canvas-200 bg-canvas-50 p-4 dark:border-canvas-800 dark:bg-canvas-900">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-canvas-600 dark:text-canvas-300">
        {title}
      </h2>
      {children}
    </section>
  );
}

function TierBadge({ tier }: { tier: SolutionPack['tierRequired'] }) {
  return (
    <span
      className={cn(
        'rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide',
        tier === 'ENTERPRISE'
          ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200'
          : tier === 'PRO'
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
            : 'bg-canvas-200 text-canvas-700 dark:bg-canvas-700 dark:text-canvas-200',
      )}
    >
      {tier}
    </span>
  );
}

function StatusBadge({ status }: { status: SolutionPack['status'] }) {
  return (
    <span
      className={cn(
        'rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide',
        status === 'stable'
          ? 'bg-state-healthy/15 text-state-healthy'
          : status === 'beta'
            ? 'bg-state-warning/15 text-state-warning'
            : status === 'deprecated'
              ? 'bg-state-critical/15 text-state-critical'
              : 'bg-canvas-200 text-canvas-600 dark:bg-canvas-700 dark:text-canvas-300',
      )}
    >
      {status}
    </span>
  );
}

function PackPreviewSection({ pack }: { pack: SolutionPack }) {
  const items = pack.extensions.previewMissionFeed ?? [];
  if (items.length === 0) return null;
  return (
    <section className="rounded-lg border border-canvas-200 bg-canvas-50 p-4 dark:border-canvas-800 dark:bg-canvas-900">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-canvas-600 dark:text-canvas-300">
        After install, you&apos;ll see…
      </h2>
      <ul className="space-y-2">
        {items.map((m, i) => (
          <li
            key={i}
            className="rounded-lg border border-canvas-200 bg-white p-3 dark:border-canvas-800 dark:bg-canvas-950"
          >
            <div className="text-sm font-medium text-canvas-900 dark:text-canvas-50">{m.title}</div>
            <div className="mt-1 text-xs text-canvas-600 dark:text-canvas-300">{m.description}</div>
          </li>
        ))}
      </ul>
    </section>
  );
}