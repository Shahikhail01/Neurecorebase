'use client';

/**
 * /knowledge/[entryId] — single knowledge entry view.
 *
 * Phase 6, Task 6.5.
 *
 * Layout:
 *   - Header (type, title, status, tags, edit/delete buttons)
 *   - Content (full text, monospace for readability)
 *   - Footer (retrieval count, last retrieved, last updated)
 *   - Right rail: "Ask AI about this entry" + "Citations of this entry"
 *
 * SOLID: SRP — page is composition over hooks.
 */

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ErrorState,
  LoadingState,
} from '@neurecore/ui/components';
import { Can } from '@/components/workspace/Can';
import {
  useDeleteKnowledge,
  useKnowledgeCitations,
  useKnowledgeEntry,
  useUpdateKnowledge,
} from '@/core/hooks/knowledge';
import { KnowledgeEditor } from '@/components/knowledge/KnowledgeEditor';
import { RAGAskDialog } from '@/components/knowledge/RAGAskDialog';

function getTenantId(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const parts = window.location.pathname.split('/').filter(Boolean);
  const known = new Set(['knowledge', 'entity', 'agents', 'empty', 'test-query']);
  return parts.find((p) => !known.has(p));
}

export default function KnowledgeEntryPage() {
  const router = useRouter();
  const params = useParams<{ entryId: string }>();
  const tenantId = useMemo(() => getTenantId(), []);
  const entryId = params?.entryId;
  const [editing, setEditing] = useState(false);
  const [askOpen, setAskOpen] = useState(false);

  const entry = useKnowledgeEntry(tenantId, entryId);
  const citations = useKnowledgeCitations(tenantId, entryId);
  const update = useUpdateKnowledge(tenantId);
  const remove = useDeleteKnowledge(tenantId);

  if (entry.isLoading) return <LoadingState label="Loading entry…" />;
  if (entry.error || !entry.data) {
    return (
      <main className="mx-auto w-full max-w-3xl p-6">
        <ErrorState
          error={entry.error as unknown as Error}
          onRetry={() => entry.refetch()}
        />
      </main>
    );
  }

  const e = entry.data;

  return (
    <main className="mx-auto flex w-full max-w-5xl gap-6 p-6">
      <article className="flex-1">
        <header className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-canvas-500">
              {e.type} · {e.status}
              {e.version !== '1.0.0' && ` · v${e.version}`}
            </p>
            <h1 className="mt-1 text-2xl font-semibold">{e.title}</h1>
            {e.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {e.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-md bg-canvas-200 px-2 py-0.5 text-xs text-canvas-700 dark:bg-canvas-700 dark:text-canvas-200"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAskOpen(true)}
              className="rounded-md border border-canvas-300 px-3 py-1.5 text-sm hover:bg-canvas-100 dark:border-canvas-700 dark:hover:bg-canvas-800"
            >
              Ask AI
            </button>
            <Can permission="entity.write">
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="rounded-md border border-canvas-300 px-3 py-1.5 text-sm hover:bg-canvas-100 dark:border-canvas-700 dark:hover:bg-canvas-800"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Delete "${e.title}"?`)) {
                    remove.mutate(e.id, {
                      onSuccess: () => router.push('/knowledge'),
                    });
                  }
                }}
                className="rounded-md border border-state-error px-3 py-1.5 text-sm text-state-error hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                Delete
              </button>
            </Can>
          </div>
        </header>

        <section className="rounded-md border border-canvas-200 bg-canvas-100 p-4 dark:border-canvas-700 dark:bg-canvas-800">
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-canvas-800 dark:text-canvas-100">
            {e.content}
          </pre>
        </section>

        <footer className="mt-4 flex flex-wrap gap-4 text-xs text-canvas-500">
          <span>Created: {new Date(e.createdAt).toLocaleString()}</span>
          <span>Updated: {new Date(e.updatedAt).toLocaleString()}</span>
          <span>{e.retrievalCount} retrievals</span>
          {e.lastRetrievedAt && (
            <span>
              Last retrieved: {new Date(e.lastRetrievedAt).toLocaleString()}
            </span>
          )}
          <span>{e.chunkCount} chunks</span>
        </footer>
      </article>

      <aside className="w-72 shrink-0">
        <div className="sticky top-6 flex flex-col gap-4">
          <h2 className="text-sm font-semibold">Citations of this entry</h2>
          {citations.isLoading && <LoadingState label="Loading…" />}
          {citations.data && citations.data.items.length === 0 && (
            <p className="text-sm text-canvas-500">
              No AI invocations have cited this entry yet.
            </p>
          )}
          <ul className="flex flex-col gap-2">
            {citations.data?.items.map((c) => (
              <li
                key={c.invocationId}
                className="rounded-md border border-canvas-200 p-3 text-xs dark:border-canvas-700"
              >
                <p className="text-canvas-700 dark:text-canvas-200">
                  {c.question || '(no question)'}
                </p>
                <p className="mt-1 font-mono text-canvas-500">
                  {new Date(c.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <RAGAskDialog
        tenantId={tenantId}
        open={askOpen}
        onClose={() => setAskOpen(false)}
        initialQuestion={`Tell me about: ${e.title}`}
      />

      {editing && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="knowledge-edit-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setEditing(false)}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-2xl flex-col gap-4 overflow-y-auto rounded-lg bg-canvas-50 p-6 shadow-2xl dark:bg-canvas-900"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-center justify-between">
              <h2
                id="knowledge-edit-title"
                className="text-lg font-semibold"
              >
                Edit knowledge entry
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
              initial={e}
              pending={update.isPending}
              error={update.error?.message ?? null}
              onSubmit={(input) =>
                update.mutate(
                  { id: e.id, data: input },
                  { onSuccess: () => setEditing(false) },
                )
              }
            />
          </div>
        </div>
      )}
    </main>
  );
}