'use client';

/**
 * AskAiButton — Phase 5, Task 5.10.
 *
 * Global "Ask AI" button in the top bar. Lives in the page chrome and
 * opens a slide-down chat that runs Ask-AI against the current entity
 * (if any) or the workspace as a whole.
 *
 * SOLID: SRP — owns only the button + slide-down surface. Streaming
 * comes from `useInvokeAndStream` (DIP).
 */

import { useCallback, useState } from 'react';
import { useCan } from '@/components/workspace/useCan';
import {
  useInvokeAndStream,
  useAvailableAiActions,
} from '@/core/hooks/ai-actions';
import { CitationChip } from '@/components/panels/CitationChip';
import type { AiActionDefinition } from '@/core/hooks/ai-actions';

export interface AskAiButtonProps {
  scope?: { entityType: string; entityId: string };
}

export function AskAiButton({ scope }: AskAiButtonProps) {
  const canAsk = useCan('ai_action.invoke');
  const [open, setOpen] = useState(false);
  if (!canAsk) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="rounded-md border border-state-info bg-state-info/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-state-info transition hover:bg-state-info/20"
        aria-label="Open Ask AI"
        aria-expanded={open}
      >
        Ask AI
      </button>
      {open && <AskAiPanel scope={scope} onClose={() => setOpen(false)} />}
    </>
  );
}

function AskAiPanel({
  scope,
  onClose,
}: {
  scope?: { entityType: string; entityId: string };
  onClose: () => void;
}) {
  const { data } = useAvailableAiActions(scope?.entityType);
  const actions = data?.items ?? [];
  const [picked, setPicked] = useState<AiActionDefinition | null>(null);

  const invoke = useInvokeAndStream();

  const onPick = useCallback(
    async (a: AiActionDefinition) => {
      setPicked(a);
      try {
        await invoke.run({
          action: a.id,
          ...(scope ?? {}),
          idempotencyKey: `topbar:${a.id}:${Date.now()}`,
        });
      } catch {
        /* surfaced via hook state */
      }
    },
    [invoke, scope],
  );

  const quick = actions.filter((a) =>
    ['ai:summary', 'ai:risks', 'ai:recommend', 'ai:explain'].includes(a.id),
  );

  return (
    <div
      role="dialog"
      aria-label="Ask AI panel"
      className="fixed right-4 top-16 z-40 w-full max-w-md overflow-hidden rounded-lg border border-canvas-300 bg-canvas-50 shadow-2xl dark:border-canvas-700 dark:bg-canvas-900"
    >
      <div className="flex items-center justify-between border-b border-canvas-200 px-4 py-2 dark:border-canvas-700">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-state-info">
            Ask AI
          </p>
          {scope && (
            <p className="font-mono text-[10px] text-canvas-500">
              scope: {scope.entityType}/{scope.entityId.slice(0, 8)}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Ask AI"
          className="rounded p-1 text-canvas-500 hover:bg-canvas-200 dark:hover:bg-canvas-800"
        >
          ✕
        </button>
      </div>

      {!picked ? (
        <div className="grid grid-cols-2 gap-2 p-3">
          {quick.length === 0 ? (
            <p className="col-span-2 p-3 text-center text-sm text-canvas-500">
              No quick actions available for your tier/permissions.
            </p>
          ) : (
            quick.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => void onPick(a)}
                className="rounded-md border border-canvas-300 bg-canvas-100 p-2 text-left text-xs hover:bg-canvas-200 dark:border-canvas-700 dark:bg-canvas-800 dark:hover:bg-canvas-700"
              >
                <div className="font-medium text-canvas-900 dark:text-canvas-50">
                  {a.name}
                </div>
                <div className="text-canvas-500">{a.description}</div>
              </button>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-2 p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold uppercase tracking-wider text-canvas-500">
              {picked.name} ·{' '}
              {invoke.status === 'streaming'
                ? 'streaming…'
                : invoke.status === 'completed'
                  ? 'done'
                  : invoke.status === 'cancelled'
                    ? 'cancelled'
                    : invoke.status === 'failed'
                      ? 'failed'
                      : 'idle'}
            </span>
            <div className="flex gap-2">
              {invoke.status === 'streaming' && (
                <button
                  type="button"
                  onClick={invoke.stop}
                  className="text-state-error hover:underline"
                >
                  Stop
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  invoke.reset();
                  setPicked(null);
                }}
                className="text-canvas-500 hover:underline"
              >
                Back
              </button>
            </div>
          </div>
          <pre className="max-h-72 overflow-y-auto whitespace-pre-wrap rounded-md border border-canvas-200 bg-canvas-100 p-3 text-xs text-canvas-800 dark:border-canvas-700 dark:bg-canvas-800 dark:text-canvas-100">
            {typeof invoke.result?.output === 'string'
              ? invoke.result.output
              : invoke.text || invoke.error || '…'}
          </pre>
          {invoke.citations.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {invoke.citations.map((c, i) => (
                <CitationChip key={`${c.knowledgeEntryId}-${i}`} citation={c} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
