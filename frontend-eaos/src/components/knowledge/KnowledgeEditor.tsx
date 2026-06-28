'use client';

/**
 * KnowledgeEditor — create / edit form for a KnowledgeEntry.
 *
 * Phase 6, Task 6.5 (per EAOS-frontend-data-layer.md §3.4 + NUWS §2.10).
 *
 * Form fields match the backend CreateKnowledgeDto:
 *   - type (KnowledgeType select)
 *   - title
 *   - content (large textarea)
 *   - tags (comma-separated)
 *   - status (draft / published / archived)
 *
 * On submit: calls onSubmit (mutation handled by parent) — editor is
 * stateful but headless. Parents can render anywhere — the Knowledge
 * Hub page uses it; an entity workspace could too.
 */

import { useEffect, useState } from 'react';
import {
  KNOWLEDGE_TYPES,
  type CreateKnowledgeInput,
  type KnowledgeEntry,
  type KnowledgeType,
} from '@/core/hooks/knowledge';

interface KnowledgeEditorProps {
  /** Pre-fill values (for edit mode). */
  initial?: KnowledgeEntry;
  /** Submit handler — parent passes the mutation result. */
  onSubmit: (input: CreateKnowledgeInput) => void;
  /** Disable while mutation is pending. */
  pending?: boolean;
  /** Error to display. */
  error?: string | null;
}

const DEFAULTS: CreateKnowledgeInput = {
  type: 'POLICY',
  title: '',
  content: '',
  tags: [],
  status: 'published',
  language: 'en',
};

export function KnowledgeEditor({
  initial,
  onSubmit,
  pending,
  error,
}: KnowledgeEditorProps) {
  const [form, setForm] = useState<CreateKnowledgeInput>(() =>
    initial
      ? {
          type: initial.type,
          title: initial.title,
          content: initial.content,
          tags: initial.tags ?? [],
          status: initial.status,
          language: initial.language,
        }
      : DEFAULTS,
  );

  useEffect(() => {
    if (initial) {
      setForm({
        type: initial.type,
        title: initial.title,
        content: initial.content,
        tags: initial.tags ?? [],
        status: initial.status,
        language: initial.language,
      });
    }
  }, [initial]);

  const handle = (k: keyof CreateKnowledgeInput, v: unknown) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!form.title.trim() || !form.content.trim() || pending) return;
        onSubmit({
          ...form,
          tags: (form.tags ?? []).filter(Boolean),
        });
      }}
      className="flex flex-col gap-4"
    >
      {error && (
        <div
          role="alert"
          className="rounded-md border border-state-error bg-red-50 p-3 text-sm text-state-error dark:bg-red-950/30"
        >
          {error}
        </div>
      )}

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Type</span>
        <select
          value={form.type}
          onChange={(e) => handle('type', e.target.value as KnowledgeType)}
          className="rounded-md border border-canvas-300 bg-canvas-50 px-3 py-2 dark:border-canvas-700 dark:bg-canvas-800"
          disabled={pending}
        >
          {KNOWLEDGE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Title</span>
        <input
          type="text"
          required
          maxLength={200}
          value={form.title}
          onChange={(e) => handle('title', e.target.value)}
          className="rounded-md border border-canvas-300 bg-canvas-50 px-3 py-2 dark:border-canvas-700 dark:bg-canvas-800"
          disabled={pending}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Content</span>
        <textarea
          required
          rows={12}
          maxLength={200_000}
          value={form.content}
          onChange={(e) => handle('content', e.target.value)}
          className="rounded-md border border-canvas-300 bg-canvas-50 px-3 py-2 font-mono text-sm dark:border-canvas-700 dark:bg-canvas-800"
          disabled={pending}
        />
        <span className="text-xs text-canvas-500">
          {form.content.length.toLocaleString()} / 200,000 chars
        </span>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Tags (comma-separated)</span>
        <input
          type="text"
          value={(form.tags ?? []).join(', ')}
          onChange={(e) =>
            handle(
              'tags',
              e.target.value
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean),
            )
          }
          className="rounded-md border border-canvas-300 bg-canvas-50 px-3 py-2 dark:border-canvas-700 dark:bg-canvas-800"
          disabled={pending}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Status</span>
        <select
          value={form.status}
          onChange={(e) =>
            handle(
              'status',
              e.target.value as 'draft' | 'published' | 'archived',
            )
          }
          className="rounded-md border border-canvas-300 bg-canvas-50 px-3 py-2 dark:border-canvas-700 dark:bg-canvas-800"
          disabled={pending}
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </label>

      <button
        type="submit"
        disabled={pending || !form.title.trim() || !form.content.trim()}
        className="self-start rounded-md bg-canvas-900 px-4 py-2 text-sm font-medium text-canvas-50 transition hover:bg-canvas-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-canvas-100 dark:text-canvas-900 dark:hover:bg-canvas-200"
      >
        {pending ? 'Saving…' : initial ? 'Save changes' : 'Create entry'}
      </button>
    </form>
  );
}

export default KnowledgeEditor;