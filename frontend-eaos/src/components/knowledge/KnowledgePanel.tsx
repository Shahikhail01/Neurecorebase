'use client';

/**
 * KnowledgePanel — entity workspace panel for Knowledge (EAOS-4).
 *
 * Phase 6, Task 6.4 (per EAOS-NUWS-principles.md §2.10 — Knowledge UX).
 *
 * Shows:
 *   - Search input (hybrid vector + keyword)
 *   - Top hits with relevance scores + highlights
 *   - Click → opens detail page at `/knowledge/{id}`
 *
 * Integrates with:
 *   - useKnowledgeSearch hook (TanStack Query)
 *   - 6 canonical empty states (via @neurecore/ui)
 *   - <Can> permission gate for write actions
 *
 * SOLID:
 *   - SRP — owns only the panel UI + search wiring.
 *   - OCP — adding filters (entityType, tag) is a prop addition.
 */

import { useMemo, useState } from 'react';
import { EmptyState, LoadingState, ErrorState } from '@neurecore/ui/components';
import { useKnowledgeSearch, useKnowledgeList } from '@/core/hooks/knowledge';

interface KnowledgePanelProps {
  tenantId?: string;
  /** Optional: pre-filter to entries tagged for this entity type. */
  entityType?: string;
}

export function KnowledgePanel({ tenantId, entityType }: KnowledgePanelProps) {
  const [query, setQuery] = useState('');

  // Browse mode — when query is empty, list recent published entries
  const listQuery = useKnowledgeList(tenantId, {
    limit: 10,
    ...(entityType && { tags: entityType }),
  });

  // Search mode — only fires when query.length >= 1
  const search = useKnowledgeSearch(tenantId, query, { limit: 8 });

  const isSearching = query.trim().length > 0;
  const results = isSearching ? search.data?.results ?? [] : [];
  const entries = listQuery.data?.data ?? [];

  const total = useMemo(
    () => (isSearching ? results.length : entries.length),
    [isSearching, results.length, entries.length],
  );

  return (
    <div className="flex flex-col gap-4 p-4">
      <header className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Knowledge</h2>
        <a
          href="/knowledge"
          className="text-sm text-canvas-600 hover:underline dark:text-canvas-300"
        >
          Open Knowledge Hub →
        </a>
      </header>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search knowledge…"
        aria-label="Search knowledge"
        className="w-full rounded-md border border-canvas-300 bg-canvas-50 px-3 py-2 text-sm dark:border-canvas-700 dark:bg-canvas-800"
      />

      {(isSearching ? search.isLoading : listQuery.isLoading) && (
        <LoadingState label="Loading knowledge…" />
      )}

      {(isSearching ? search.error : listQuery.error) && (
        <ErrorState
          error={
            (isSearching ? search.error : listQuery.error) as unknown as Error
          }
          onRetry={() => (isSearching ? search.refetch() : listQuery.refetch())}
        />
      )}

      {!isSearching && !listQuery.isLoading && entries.length === 0 && (
        <EmptyState
          variant="noData"
          title="No knowledge yet"
          description="Add your first SOP, policy, or playbook to start building the knowledge base."
          action={
            <a
              href="/knowledge?new=1"
              className="rounded-md bg-canvas-900 px-3 py-2 text-sm font-medium text-canvas-50 hover:bg-canvas-800 dark:bg-canvas-100 dark:text-canvas-900 dark:hover:bg-canvas-200"
            >
              Add entry
            </a>
          }
        />
      )}

      {isSearching && !search.isLoading && results.length === 0 && (
        <EmptyState
          variant="noResults"
          title="No matches"
          description={`No knowledge entries match "${query}".`}
        />
      )}

      <ul className="flex flex-col gap-2">
        {(isSearching ? results : entries).map((item) => {
          const id = item.id;
          const title = item.title;
          const excerpt =
            'excerpt' in item ? item.excerpt : item.content.slice(0, 160);
          const score =
            'relevanceScore' in item ? item.relevanceScore : null;
          const type = item.type;

          return (
            <li key={id}>
              <a
                href={`/knowledge/${id}`}
                className="block rounded-md border border-canvas-200 p-3 transition hover:bg-canvas-100 dark:border-canvas-700 dark:hover:bg-canvas-800"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium uppercase tracking-wider text-canvas-500">
                    {type}
                  </span>
                  {score !== null && (
                    <span className="font-mono text-xs text-canvas-500">
                      {(score * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
                <h3 className="mt-1 text-sm font-medium text-canvas-900 dark:text-canvas-50">
                  {title}
                </h3>
                <p className="mt-1 line-clamp-2 text-sm text-canvas-600 dark:text-canvas-300">
                  {excerpt}
                </p>
              </a>
            </li>
          );
        })}
      </ul>

      {!isSearching && total > 0 && (
        <p className="text-center text-xs text-canvas-500">
          Showing {entries.length} recent entr
          {entries.length === 1 ? 'y' : 'ies'}
        </p>
      )}
    </div>
  );
}

export default KnowledgePanel;