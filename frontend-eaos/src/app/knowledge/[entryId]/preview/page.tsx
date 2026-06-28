'use client';

/**
 * /knowledge/[entryId]/preview — lightweight preview (slide-over target).
 *
 * Phase 6, Task 6.6 (per EAOS-NUWS-principles.md §2.3).
 *
 * Minimal page that shows just the excerpt + open-full-page link.
 * Opened from the CitationChip slide-over. Keeps the workspace context
 * intact (rendered inside an iframe or a fresh tab).
 *
 * No edit controls — this is read-only.
 */

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { ErrorState, LoadingState } from '@neurecore/ui/components';
import { useKnowledgeEntry } from '@/core/hooks/knowledge';

function getTenantId(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const parts = window.location.pathname.split('/').filter(Boolean);
  const known = new Set(['knowledge', 'entity', 'preview', 'agents', 'empty']);
  return parts.find((p) => !known.has(p));
}

export default function KnowledgePreviewPage() {
  const params = useParams<{ entryId: string }>();
  const tenantId = useMemo(() => getTenantId(), []);
  const entryId = params?.entryId;

  const entry = useKnowledgeEntry(tenantId, entryId);

  if (entry.isLoading) return <LoadingState label="Loading preview…" />;
  if (entry.error || !entry.data) {
    return (
      <main className="p-6">
        <ErrorState
          error={entry.error as unknown as Error}
          onRetry={() => entry.refetch()}
        />
      </main>
    );
  }

  const e = entry.data;

  return (
    <main className="flex min-h-screen flex-col gap-4 bg-canvas-50 p-6 dark:bg-canvas-900">
      <header>
        <p className="text-xs font-medium uppercase tracking-wider text-canvas-500">
          {e.type}
        </p>
        <h1 className="mt-1 text-xl font-semibold">{e.title}</h1>
      </header>

      <p className="text-sm text-canvas-700 dark:text-canvas-200">
        {e.content.slice(0, 800)}
        {e.content.length > 800 && '…'}
      </p>

      <a
        href={`/knowledge/${e.id}`}
        target="_blank"
        rel="noreferrer"
        className="self-start rounded-md border border-canvas-300 px-3 py-1.5 text-sm font-medium text-canvas-800 hover:bg-canvas-100 dark:border-canvas-700 dark:text-canvas-100 dark:hover:bg-canvas-800"
      >
        Open full page →
      </a>
    </main>
  );
}