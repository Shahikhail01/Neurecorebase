'use client';

/**
 * RAGAskDialog — modal dialog for asking the Knowledge Hub a question.
 *
 * Phase 6, Task 6.6 (per EAOS-NUWS-principles.md §5.5 + §2.3).
 *
 * Flow:
 *   1. User types a question, hits "Ask".
 *   2. Backend streams `start → delta* → done` events.
 *   3. Citations appear as chips beneath the streaming answer.
 *   4. Click a chip → CitationSlideOver (Phase 5 component) opens.
 *
 * Streams via `useStreamRagAsk` (Phase 6 hook).
 *
 * SOLID:
 *   - SRP — modal + streaming + citations rendering.
 *   - OCP — `renderCitation` prop allows custom chip renderers.
 */

import { useEffect, useRef, useState } from 'react';
import { CitationChip } from '@/components/panels/CitationChip';
import type {
  KnowledgeCitation,
  RagStreamEvent,
} from '@/core/hooks/knowledge';
import { useStreamRagAsk } from '@/core/hooks/knowledge';

interface RAGAskDialogProps {
  tenantId?: string;
  open: boolean;
  onClose: () => void;
  /** Optional initial question (e.g. when invoked from a "Ask AI" button). */
  initialQuestion?: string;
}

export function RAGAskDialog({
  tenantId,
  open,
  onClose,
  initialQuestion,
}: RAGAskDialogProps) {
  const [question, setQuestion] = useState(initialQuestion ?? '');
  const [streaming, setStreaming] = useState(false);
  const [answer, setAnswer] = useState('');
  const [citations, setCitations] = useState<KnowledgeCitation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<{
    tokensUsed?: { input: number; output: number; total: number };
    durationMs?: number;
    model?: string;
  }>({});
  const textRef = useRef<HTMLDivElement>(null);

  const stream = useStreamRagAsk(tenantId);

  useEffect(() => {
    if (open) setQuestion(initialQuestion ?? '');
    if (!open) {
      setAnswer('');
      setCitations([]);
      setError(null);
      setMeta({});
    }
  }, [open, initialQuestion]);

  useEffect(() => {
    if (textRef.current) {
      textRef.current.scrollTop = textRef.current.scrollHeight;
    }
  }, [answer]);

  if (!open) return null;

  const handleAsk = async () => {
    if (!question.trim() || streaming) return;
    setStreaming(true);
    setAnswer('');
    setCitations([]);
    setError(null);
    setMeta({});

    await stream.start(
      { question: question.trim() },
      {
        onStart: (c) => setCitations(c),
        onDelta: (text) =>
          setAnswer((prev) => {
            // Coalesce typing animation by appending raw text — the
            // backend already paces tokens with ~8ms gaps.
            return prev + text;
          }),
        onDone: (c, tokens, durationMs) => {
          if (c) setCitations(c);
          setMeta((m) => ({ ...m, tokensUsed: tokens, durationMs }));
          setStreaming(false);
        },
        onError: (msg) => {
          setError(msg);
          setStreaming(false);
        },
      },
    );
  };

  const handleCancel = () => {
    stream.cancel();
    setStreaming(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rag-ask-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex h-[80vh] w-full max-w-2xl flex-col gap-4 overflow-hidden rounded-lg bg-canvas-50 p-6 shadow-2xl dark:bg-canvas-900"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between">
          <h2
            id="rag-ask-title"
            className="text-lg font-semibold text-canvas-900 dark:text-canvas-50"
          >
            Ask the Knowledge Hub
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-canvas-500 hover:bg-canvas-200 dark:hover:bg-canvas-800"
            aria-label="Close"
          >
            ✕
          </button>
        </header>

        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask anything about your policies, SOPs, playbooks…"
          rows={3}
          aria-label="Your question"
          disabled={streaming}
          className="w-full resize-none rounded-md border border-canvas-300 bg-canvas-100 px-3 py-2 text-sm dark:border-canvas-700 dark:bg-canvas-800"
        />

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAsk}
            disabled={!question.trim() || streaming}
            className="rounded-md bg-canvas-900 px-4 py-2 text-sm font-medium text-canvas-50 transition hover:bg-canvas-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-canvas-100 dark:text-canvas-900 dark:hover:bg-canvas-200"
          >
            {streaming ? 'Thinking…' : 'Ask'}
          </button>
          {streaming && (
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-md border border-canvas-300 px-4 py-2 text-sm font-medium text-canvas-800 hover:bg-canvas-100 dark:border-canvas-700 dark:text-canvas-100 dark:hover:bg-canvas-800"
            >
              Stop
            </button>
          )}
          <span className="text-xs text-canvas-500">
            {citations.length > 0 && `${citations.length} citation${citations.length === 1 ? '' : 's'}`}
          </span>
        </div>

        {error && (
          <div className="rounded-md border border-state-error bg-red-50 p-3 text-sm text-state-error dark:bg-red-950/30">
            {error}
          </div>
        )}

        <div
          ref={textRef}
          className="flex-1 overflow-y-auto rounded-md border border-canvas-200 bg-canvas-100 p-4 dark:border-canvas-700 dark:bg-canvas-800"
        >
          {answer ? (
            <>
              <pre className="whitespace-pre-wrap font-sans text-sm text-canvas-900 dark:text-canvas-50">
                {answer}
              </pre>

              {citations.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1">
                  {citations.map((c, i) => (
                    <CitationChip
                      key={`${c.knowledgeEntryId}-${i}`}
                      citation={{
                        knowledgeEntryId: c.knowledgeEntryId,
                        label: `[${i + 1}] ${c.label}`,
                        span: c.span,
                        confidence: c.confidence,
                      }}
                    />
                  ))}
                </div>
              )}

              {meta.tokensUsed && (
                <p className="mt-4 font-mono text-xs text-canvas-500">
                  {meta.model ?? 'unknown'} · {meta.tokensUsed.total} tokens
                  {meta.durationMs
                    ? ` · ${meta.durationMs}ms`
                    : ''}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-canvas-500">
              The answer will appear here, with citations you can click.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default RAGAskDialog;
// Re-export so consumers can use the streamed event type.
export type { RagStreamEvent };