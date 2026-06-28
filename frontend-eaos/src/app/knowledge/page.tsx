'use client';

/**
 * /knowledge — Knowledge Hub main page.
 *
 * Phase 6, Task 6.5 (per EAOS-implementation-plan.md §9.7 +
 * EAOS-NUWS-principles.md §2.10).
 *
 * Layout:
 *   ┌──────────────┬──────────────────────────────────┐
 *   │ Filters      │  Top: search input + Ask AI btn  │
 *   │ - type       │  ──────────────────────────────  │
 *   │ - status     │  List / search results           │
 *   │              │                                  │
 *   │ + New entry  │                                  │
 *   └──────────────┴──────────────────────────────────┘
 *
 * SSR-safe: tenantId is read from the cookie via /api/v1/auth/me in a
 * real deployment; for now we read from `window.location.pathname` to
 * derive a tenant slug when present (eaos.neurecore.com/{tenant}).
 *
 * SOLID:
 *   - SRP — page is a thin composition layer over hooks + components.
 */

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { EmptyState, LoadingState } from '@neurecore/ui/components';
import {
  KNOWLEDGE_TYPES,
  useCreateKnowledge,
  useDeleteKnowledge,
  useKnowledgeList,
  useKnowledgeSearch,
  useUpdateKnowledge,
  type KnowledgeEntry,
  type KnowledgeListFilters,
  type KnowledgeSearchHit,
  type KnowledgeType,
} from '@/core/hooks/knowledge';
import { KnowledgeEditor } from '@/components/knowledge/KnowledgeEditor';
import { RAGAskDialog } from '@/components/knowledge/RAGAskDialog';
import { Can } from '@/components/workspace/Can';

function getTenantId(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  // Pathname is /[tenant]/knowledge or just /knowledge
  const parts = window.location.pathname.split('/').filter(Boolean);
  // Skip known static prefixes
  const known = new Set(['knowledge', 'entity', 'agents', 'empty', 'test-query']);
  const candidate = parts.find((p) => !known.has(p));
  return candidate;
}

function KnowledgeHubInner() {
  const router = useRouter();
  const params = useSearchParams();
  const tenantId = useMemo(() => getTenantId(), []);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<KnowledgeListFilters>({});
  const [askOpen, setAskOpen] = useState(false);
  const [editing, setEditing] = useState(false);

  const showNew = params.get('new') === '1';

  const listQuery = useKnowledgeList(tenantId, {
    page: filters.page ?? 1,
    limit: filters.limit ?? 20,
    type: filters.type,
    status: filters.status,
    departmentId: filters.departmentId,
    tags: filters.tags,
  });

  const search = useKnowledgeSearch(tenantId, query, {
    limit: 20,
    type: filters.type,
  });

  const create = useCreateKnowledge(tenantId);
  const update = useUpdateKnowledge(tenantId);
  const remove = useDeleteKnowledge(tenantId);

  const entries = listQuery.data?.data ?? [];
  const results = search.data?.results ?? [];
  const items = query.trim() ? results : entries;

  return (
    <main className="mx-auto flex w-full max-w-7xl gap-6 p-6">
      {/* ── Sidebar (filters + new) ──────────────────────────────── */}
      <aside className="w-64 shrink-0">
        <div className="sticky top-6 flex flex-col gap-4">
          <h1 className="text-xl font-semibold">Knowledge Hub</h1>

          <Can permission="entity.write">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-md bg-canvas-900 px-3 py-2 text-sm font-medium text-canvas-50 hover:bg-canvas-800 dark:bg-canvas-100 dark:text-canvas-900 dark:hover:bg-canvas-200"
            >
              + New entry
            </button>
          </Can>

          <button
            type="button"
            onClick={() => setAskOpen(true)}
            className="rounded-md border border-canvas-300 px-3 py-2 text-sm font-medium text-canvas-800 hover:bg-canvas-100 dark:border-canvas-700 dark:text-canvas-100 dark:hover:bg-canvas-800"
          >
            Ask the knowledge base
          </button>

          <fieldset className="flex flex-col gap-1">
            <legend className="text-xs font-semibold uppercase tracking-wider text-canvas-500">
              Type
            </legend>
            <select
              value={filters.type ?? ''}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  type: (e.target.value || undefined) as KnowledgeType | undefined,
                }))
              }
              className="rounded-md border border-canvas-300 bg-canvas-50 px-2 py-1 text-sm dark:border-canvas-700 dark:bg-canvas-800"
            >
              <option value="">All types</option>
              {KNOWLEDGE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </fieldset>

          <fieldset className="flex flex-col gap-1">
            <legend className="text-xs font-semibold uppercase tracking-wider text-canvas-500">
              Status
            </legend>
            <select
              value={filters.status ?? ''}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  status:
                    (e.target.value as 'draft' | 'published' | 'archived') ||
                    undefined,
                }))
              }
              className="rounded-md border border-canvas-300 bg-canvas-50 px-2 py-1 text-sm dark:border-canvas-700 dark:bg-canvas-800"
            >
              <option value="">All statuses</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </fieldset>
        </div>
      </aside>

      {/* ── Main panel ─────────────────────────────────────────── */}
      <section className="flex-1">
        <div className="flex flex-col gap-4">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search knowledge (hybrid vector + keyword)…"
            aria-label="Search knowledge"
            className="w-full rounded-md border border-canvas-300 bg-canvas-50 px-3 py-2 dark:border-canvas-700 dark:bg-canvas-800"
          />

          {(listQuery.isLoading || search.isLoading) && (
            <LoadingState label="Loading…" />
          )}

          {!listQuery.isLoading && items.length === 0 && !query.trim() && (
            <EmptyState
              variant="firstRun"
              title="Welcome to the Knowledge Hub"
              description="Create your first policy, SOP, or playbook — NeureCore will embed it, index it, and surface it whenever your AI Employees need it."
              action={
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="rounded-md bg-canvas-900 px-3 py-2 text-sm font-medium text-canvas-50 hover:bg-canvas-800 dark:bg-canvas-100 dark:text-canvas-900 dark:hover:bg-canvas-200"
                >
                  Create first entry
                </button>
              }
            />
          )}

          {!search.isLoading && items.length === 0 && query.trim() && (
            <EmptyState
              variant="noResults"
              title="No matches"
              description={`No knowledge entries match "${query}".`}
            />
          )}

          <ul className="flex flex-col gap-2">
            {(items as Array<KnowledgeEntry | KnowledgeSearchHit>).map((item) => {
              const isHit = query.trim().length > 0 && 'relevanceScore' in item;
              const score = isHit ? (item as KnowledgeSearchHit).relevanceScore : null;
              const status = 'status' in item ? (item as KnowledgeEntry).status : undefined;
              return (
                <li key={item.id}>
                  <a
                    href={`/knowledge/${item.id}`}
                    className="block rounded-md border border-canvas-200 p-4 transition hover:bg-canvas-100 dark:border-canvas-700 dark:hover:bg-canvas-800"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium uppercase tracking-wider text-canvas-500">
                        {item.type}
                      </span>
                      <div className="flex items-center gap-2 text-xs text-canvas-500">
                        {score !== null && (
                          <span className="font-mono">
                            {(score * 100).toFixed(0)}% match
                          </span>
                        )}
                        {status !== undefined && status !== 'published' && (
                          <span className="rounded-md bg-canvas-200 px-2 py-0.5 text-canvas-700 dark:bg-canvas-700 dark:text-canvas-200">
                            {status}
                          </span>
                        )}
                      </div>
                    </div>
                    <h3 className="mt-1 text-base font-medium text-canvas-900 dark:text-canvas-50">
                      {item.title}
                    </h3>
                    {'excerpt' in item ? (
                      <p className="mt-1 line-clamp-3 text-sm text-canvas-600 dark:text-canvas-300">
                        {(item as KnowledgeSearchHit).excerpt}
                      </p>
                    ) : (
                      <p className="mt-1 line-clamp-3 text-sm text-canvas-600 dark:text-canvas-300">
                        {(item as KnowledgeEntry).content.slice(0, 320)}
                      </p>
                    )}
{item.tags && item.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {item.tags.map((t: string) => (
                          <span
                            key={t}
                            className="rounded-md bg-canvas-200 px-2 py-0.5 text-xs text-canvas-700 dark:bg-canvas-700 dark:text-canvas-200"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </a>
                </li>
              );
            })}
          </ul>

          {/* Pagination */}
          {!query.trim() && listQuery.data?.meta && (
            <div className="mt-2 flex items-center justify-between text-sm text-canvas-500">
              <span>
                Page {listQuery.data.meta.page} of{' '}
                {listQuery.data.meta.totalPages} ·{' '}
                {listQuery.data.meta.total} total
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={listQuery.data.meta.page <= 1}
                  onClick={() =>
                    setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))
                  }
                  className="rounded-md border border-canvas-300 px-3 py-1 disabled:opacity-50 dark:border-canvas-700"
                >
                  ← Prev
                </button>
                <button
                  type="button"
                  disabled={
                    listQuery.data.meta.page >=
                    listQuery.data.meta.totalPages
                  }
                  onClick={() =>
                    setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))
                  }
                  className="rounded-md border border-canvas-300 px-3 py-1 disabled:opacity-50 dark:border-canvas-700"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Modals ──────────────────────────────────────────────── */}
      <RAGAskDialog
        tenantId={tenantId}
        open={askOpen}
        onClose={() => setAskOpen(false)}
      />

      {editing && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="knowledge-new-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setEditing(false)}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-2xl flex-col gap-4 overflow-y-auto rounded-lg bg-canvas-50 p-6 shadow-2xl dark:bg-canvas-900"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-center justify-between">
              <h2
                id="knowledge-new-title"
                className="text-lg font-semibold"
              >
                New knowledge entry
              </h2>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-md p-1 text-canvas-500 hover:bg-canvas-200 dark:hover:bg-canvas-800"
              >
                ✕
              </button>
            </header>
            <KnowledgeEditor
              pending={create.isPending}
              error={create.error?.message ?? null}
              onSubmit={(input) =>
                create.mutate(input, {
                  onSuccess: (entry) => {
                    setEditing(false);
                    router.push(`/knowledge/${entry.id}`);
                  },
                })
              }
            />
          </div>
        </div>
      )}

      {/* Auto-open ?new=1 */}
      {showNew && !editing && <AutoOpen onOpen={() => setEditing(true)} />}
    </main>
  );
}

function AutoOpen({ onOpen }: { onOpen: () => void }) {
  if (typeof window !== 'undefined') {
    queueMicrotask(onOpen);
  }
  return null;
}

export default function KnowledgeHubPage() {
  return (
    <Suspense fallback={<LoadingState label="Loading knowledge hub…" />}>
      <KnowledgeHubInner />
    </Suspense>
  );
}