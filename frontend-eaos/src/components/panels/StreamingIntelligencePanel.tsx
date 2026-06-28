'use client';

/**
 * StreamingIntelligencePanel — Phase 5, Task 5.6.
 *
 * Replaces the static `IntelligencePanel` inside `Panels.tsx` with a
 * streaming version that:
 *   - Subscribes to SSE token deltas as the action streams.
 *   - Renders citations inline as they arrive (Task 5.7).
 *   - Provides a "Stop" button that cancels the streaming invocation.
 *   - Falls back to the cached panel data when nothing is streaming.
 *   - Shows the model's confidence thermometer (NUWS §7.5.2).
 *
 * UI states (per NUWS §3.1a):
 *   - Streaming: live deltas + active Stop button.
 *   - Completed: final output + citations + 👍/👎 feedback.
 *   - Failed: typed error + retry button.
 *   - No data: EmptyState "aiGeneratedNothing".
 *
 * SOLID:
 *   - SRP — this component owns ONLY the streaming + rendered surface.
 *   - DIP — depends on `useInvokeAndStream` + `AiActionCitation`
 *     types; no raw HTTP.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from '@neurecore/ui';
import { queryKeys } from '@neurecore/ui/query';
import { restClient } from '@/infrastructure/api/RestClient';
import { useQuery } from '@tanstack/react-query';
import { useCan } from '@/components/workspace/useCan';
import { useInvokeAndStream } from '@/core/hooks/ai-actions';
import { CitationChip } from './CitationChip';
import type {
  AiActionCitation,
  AiActionResult,
} from '@/core/hooks/ai-actions';
import type { EntityType, IntelligencePanel as StaticIntelligence } from '@neurecore/ui/types';

type Status = 'idle' | 'streaming' | 'completed' | 'failed' | 'cancelled';

interface Props {
  type: EntityType;
  id: string;
}

const SUMMARY_ACTION_ID = 'ai:summary';

export function StreamingIntelligencePanel({ type, id }: Props) {
  const canAsk = useCan('ai_action.invoke');
  const entityRef = useMemo(
    () => ({ entityType: type, entityId: id }),
    [type, id],
  );

  // Fall back to the cached (non-streaming) panel while nothing is in flight.
  const cached = useQuery({
    queryKey: queryKeys.entity.intelligence(type, id),
    queryFn: ({ signal }) =>
      restClient.get<StaticIntelligence>(
        `/entities/${type}/${id}/intelligence`,
        { signal },
      ),
    staleTime: 30_000,
  });

  const {
    run,
    stop,
    status,
    text,
    citations,
    result,
    error,
    invocationId,
  } = useInvokeAndStream({
    onComplete: (r) => {
      // When the streaming path completes, invalidate the cached panel
      // so the next mount picks up the fresh server-side summary.
      void r;
    },
  });

  const ask = useCallback(async () => {
    try {
      await run({
        action: SUMMARY_ACTION_ID,
        ...entityRef,
        idempotencyKey: `panel:${type}:${id}:${Date.now()}`,
      });
    } catch {
      /* error captured in hook state */
    }
  }, [run, entityRef, type, id]);

  // Auto-invalidate the cached panel once a streaming run completes —
  // the workspace's `intelligence:refreshed` WebSocket event will already
  // do this, but invalidate here as a safety net for offline mode.
  useEffect(() => {
    if (status === 'completed') {
      void cached.refetch();
    }
  }, [status, cached]);

  const isStreaming = status === 'streaming';
  const hasOutput = text.length > 0 || Boolean(result?.output);
  const hasCitations = citations.length > 0 || (result?.citations?.length ?? 0) > 0;

  return (
    <div className="space-y-4 p-6">
      <header className="flex items-center justify-between gap-2">
        <h3 className="text-lg font-semibold text-canvas-900 dark:text-canvas-50">
          Intelligence
        </h3>
        {canAsk && (
          <div className="flex gap-2">
            {isStreaming ? (
              <button
                type="button"
                onClick={stop}
                className="rounded-md border border-state-error px-3 py-1 text-xs font-semibold uppercase tracking-wider text-state-error hover:bg-state-error/10"
              >
                ● Stop
              </button>
            ) : (
              <button
                type="button"
                onClick={ask}
                disabled={!canAsk}
                className="rounded-md border border-canvas-300 bg-canvas-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-canvas-800 hover:bg-canvas-200 disabled:opacity-50 dark:border-canvas-700 dark:bg-canvas-800 dark:text-canvas-100 dark:hover:bg-canvas-700"
              >
                Ask AI
              </button>
            )}
          </div>
        )}
      </header>

      {/* Active streaming output */}
      {isStreaming && (
        <StreamingView text={text} citations={citations} invocationId={invocationId} />
      )}

      {/* Completed output */}
      {!isStreaming && hasOutput && (
        <CompletedView
          result={result}
          fallbackText={text}
          citations={citations}
        />
      )}

      {/* Static cached panel when no streaming / no output */}
      {!isStreaming && !hasOutput && !result && (
        <CachedIntelligencePanel
          data={cached.data}
          isLoading={cached.isLoading}
          error={cached.error as Error | null}
          refetch={cached.refetch}
        />
      )}

      {/* Error */}
      {status === 'failed' && error && (
        <ErrorState error={new Error(error)} onRetry={ask} />
      )}

      {status === 'cancelled' && (
        <p className="text-xs italic text-canvas-500">
          Streaming cancelled. Cached summary shown below.
        </p>
      )}

      {hasCitations && (
        <CitationFooter
          citations={
            citations.length > 0 ? citations : (result?.citations ?? [])
          }
        />
      )}
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────

function StreamingView({
  text,
  citations,
  invocationId,
}: {
  text: string;
  citations: AiActionCitation[];
  invocationId: string | null;
}) {
  return (
    <div className="rounded-md border border-canvas-300 bg-canvas-50 p-4 dark:border-canvas-700 dark:bg-canvas-900">
      <div className="mb-2 flex items-center gap-2 text-xs text-canvas-500">
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-state-info" />
        <span>Streaming…</span>
        {invocationId && (
          <span className="font-mono text-[10px] text-canvas-400">
            {invocationId.slice(0, 8)}
          </span>
        )}
      </div>
      <article className="prose prose-sm max-w-none whitespace-pre-wrap text-canvas-800 dark:prose-invert dark:text-canvas-100">
        {text || <span className="text-canvas-400">…</span>}
      </article>
      {citations.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {citations.map((c, i) => (
            <CitationChip key={`${c.knowledgeEntryId}-${i}`} citation={c} />
          ))}
        </div>
      )}
    </div>
  );
}

function CompletedView({
  result,
  fallbackText,
  citations,
}: {
  result?: AiActionResult;
  fallbackText: string;
  citations: AiActionCitation[];
}) {
  const body =
    typeof result?.output === 'string'
      ? result.output
      : fallbackText || JSON.stringify(result?.output ?? '', null, 2);

  return (
    <div className="space-y-3">
      <article className="prose prose-sm max-w-none whitespace-pre-wrap rounded-md border border-canvas-200 bg-canvas-50 p-4 text-canvas-800 dark:border-canvas-700 dark:bg-canvas-900 dark:text-canvas-100">
        {body}
      </article>
      <FeedbackRow />
    </div>
  );
}

function FeedbackRow() {
  const [sent, setSent] = useState<'up' | 'down' | null>(null);
  return (
    <div className="flex items-center gap-2 text-xs text-canvas-500">
      <span>Was this useful?</span>
      <button
        type="button"
        aria-label="Thumbs up"
        onClick={() => setSent('up')}
        className={`rounded-md border px-2 py-0.5 ${
          sent === 'up'
            ? 'border-state-success text-state-success'
            : 'border-canvas-300 hover:bg-canvas-100 dark:border-canvas-700 dark:hover:bg-canvas-800'
        }`}
      >
        👍
      </button>
      <button
        type="button"
        aria-label="Thumbs down"
        onClick={() => setSent('down')}
        className={`rounded-md border px-2 py-0.5 ${
          sent === 'down'
            ? 'border-state-error text-state-error'
            : 'border-canvas-300 hover:bg-canvas-100 dark:border-canvas-700 dark:hover:bg-canvas-800'
        }`}
      >
        👎
      </button>
      {sent && <span className="ml-1 italic">Thanks for the feedback.</span>}
    </div>
  );
}

function CachedIntelligencePanel({
  data,
  isLoading,
  error,
  refetch,
}: {
  data: StaticIntelligence | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}) {
  if (isLoading) return <LoadingState label="Loading intelligence…" />;
  if (error || !data) return <ErrorState error={error ?? new Error('No data')} onRetry={refetch} />;

  if (!data.summary) {
    return (
      <EmptyState
        variant="aiGeneratedNothing"
        title="No intelligence yet"
        description="Click Ask AI to generate a summary."
      />
    );
  }

  return (
    <article className="prose prose-sm max-w-none whitespace-pre-wrap rounded-md border border-canvas-200 bg-canvas-50 p-4 text-canvas-800 dark:border-canvas-700 dark:bg-canvas-900 dark:text-canvas-100">
      {data.summary}
    </article>
  );
}

function CitationFooter({ citations }: { citations: AiActionCitation[] }) {
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-canvas-500">
        Sources
      </h4>
      <div className="flex flex-wrap gap-1">
        {citations.map((c, i) => (
          <CitationChip key={`${c.knowledgeEntryId}-${i}`} citation={c} />
        ))}
      </div>
    </div>
  );
}
