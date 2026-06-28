'use client';

/**
 * CitationChip — inline citation badge + SlideOver preview.
 *
 * Phase 5, Task 5.7. Per `EAOS-NUWS-principles.md` §2.3 (citation chips):
 *   - Chip is a clickable badge inline with the AI output text.
 *   - Click opens a slide-over at `/knowledge/{id}/preview`.
 *   - Slide-over has an "Open full page" link to `/knowledge/{id}`.
 *
 * The slide-over is a lightweight, self-contained panel that does NOT
 * require a new backend route — it fetches `GET /api/v1/knowledge/{id}`
 * directly and renders a styled summary.
 *
 * SOLID:
 *   - SRP — chip + slide-over own only the citation UI.
 *   - OCP — supports any citation shape via the `citation` prop.
 */

import { useState } from 'react';
import type { AiActionCitation } from '@/core/hooks/ai-actions';
import { restClient } from '@/infrastructure/api/RestClient';

interface CitationChipProps {
  citation: AiActionCitation;
  /** Override the chip label (defaults to `citation.label`). */
  label?: string;
}

export function CitationChip({ citation, label }: CitationChipProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mx-0.5 inline-flex items-center gap-1 rounded-md border border-canvas-300 bg-canvas-100 px-1.5 py-0.5 font-mono text-[10px] font-medium text-canvas-700 transition hover:bg-canvas-200 dark:border-canvas-700 dark:bg-canvas-800 dark:text-canvas-200 dark:hover:bg-canvas-700"
        aria-label={`Citation: ${label ?? citation.label}`}
        title={`Confidence ${(citation.confidence * 100).toFixed(0)}%`}
      >
        <span aria-hidden className="text-canvas-500">⎘</span>
        <span className="max-w-[12rem] truncate">{label ?? citation.label}</span>
        {citation.span && (
          <span className="text-canvas-400">· {citation.span}</span>
        )}
      </button>

      <CitationSlideOver
        citation={citation}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

interface SlideOverProps {
  citation: AiActionCitation;
  open: boolean;
  onClose: () => void;
}

interface KnowledgePreview {
  id: string;
  title: string;
  excerpt?: string;
  source?: string;
  url?: string;
}

export function CitationSlideOver({ citation, open, onClose }: SlideOverProps) {
  const [data, setData] = useState<KnowledgePreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPreview = async () => {
    if (data || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await restClient.get<KnowledgePreview>(
        `/knowledge/${encodeURIComponent(citation.knowledgeEntryId)}`,
      );
      setData(res);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;
  // Lazy fetch when first opened.
  void fetchPreview();

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex h-full w-full max-w-md flex-col gap-4 overflow-y-auto bg-canvas-50 p-6 shadow-2xl dark:bg-canvas-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-canvas-500">
              Citation
            </p>
            <h2 className="text-lg font-semibold text-canvas-900 dark:text-canvas-50">
              {citation.label}
            </h2>
            {citation.span && (
              <p className="mt-1 font-mono text-xs text-canvas-500">
                {citation.span}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-canvas-500 hover:bg-canvas-200 dark:hover:bg-canvas-800"
            aria-label="Close citation preview"
          >
            ✕
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-canvas-500">
          <span>Confidence</span>
          <ConfidenceMeter value={citation.confidence} />
          <span className="font-mono">
            {(citation.confidence * 100).toFixed(0)}%
          </span>
        </div>

        <div className="rounded-md border border-canvas-200 bg-canvas-100 p-3 text-sm dark:border-canvas-700 dark:bg-canvas-800">
          {loading && <p className="text-canvas-500">Loading preview…</p>}
          {error && (
            <p className="text-state-error">
              Failed to load preview: {error}
            </p>
          )}
          {data && (
            <>
              {data.excerpt && (
                <p className="text-canvas-700 dark:text-canvas-200">
                  {data.excerpt}
                </p>
              )}
              {data.source && (
                <p className="mt-2 text-xs text-canvas-500">Source: {data.source}</p>
              )}
            </>
          )}
        </div>

        <a
          href={`/knowledge/${encodeURIComponent(citation.knowledgeEntryId)}`}
          className="self-start rounded-md border border-canvas-300 px-3 py-1.5 text-sm font-medium text-canvas-800 hover:bg-canvas-100 dark:border-canvas-700 dark:text-canvas-100 dark:hover:bg-canvas-800"
        >
          Open full page →
        </a>
      </div>
    </div>
  );
}

function ConfidenceMeter({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(1, value));
  const color =
    pct >= 0.75
      ? 'bg-state-success'
      : pct >= 0.45
        ? 'bg-state-warning'
        : 'bg-state-error';
  return (
    <span className="relative inline-block h-1.5 w-16 overflow-hidden rounded-full bg-canvas-200 dark:bg-canvas-700">
      <span
        className={`absolute inset-y-0 left-0 ${color}`}
        style={{ width: `${pct * 100}%` }}
      />
    </span>
  );
}
