'use client';

/**
 * AutomationQuickFire — Phase 5, Task 5.9.
 *
 * One-click row of AI Actions inside the Automation panel. Each chip
 * invokes the action and shows the streaming result in an inline drawer.
 *
 * Per NUWS §2.8: "Automation panel quick-fire row (one-click actions)".
 * Actions are filtered to those whose `capability === 'automation'` OR
 * the `EXCECUTION` category, plus the top `INTELLIGENCE` actions that
 * are commonly quick-fired (summary, risks, recommend).
 *
 * SOLID: SRP — owns only the quick-fire row UI. Streaming / data fetching
 * lives in `useInvokeAndStream`.
 */

import { useCallback, useState } from 'react';
import {
  EmptyState,
  LoadingState,
} from '@neurecore/ui';
import { useAvailableAiActions, useInvokeAndStream } from '@/core/hooks/ai-actions';
import { CitationChip } from './CitationChip';
import type { AiActionDefinition } from '@/core/hooks/ai-actions';
import type { EntityType } from '@neurecore/ui/types';

interface Props {
  type: EntityType;
  id: string;
}

const QUICK_FIRE_IDS = [
  'ai:summary',
  'ai:risks',
  'ai:recommend',
  'ai:optimize',
  'ai:workflow',
  'ai:delegate',
];

export function AutomationQuickFire({ type, id }: Props) {
  const { data, isLoading } = useAvailableAiActions(type);

  const allActions = data?.items ?? [];
  const actions = allActions.filter(
    (a) =>
      QUICK_FIRE_IDS.includes(a.id) ||
      a.capability === 'automation' ||
      a.category === 'EXECUTION',
  );

  if (isLoading) return <LoadingState label="Loading quick actions…" />;
  if (actions.length === 0) {
    return (
      <EmptyState
        variant="noData"
        title="No quick actions available"
        description="Your tier or permissions don't permit quick-fire AI Actions on this entity."
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {actions.map((a) => (
          <QuickFireChip key={a.id} action={a} entityType={type} entityId={id} />
        ))}
      </div>
    </div>
  );
}

function QuickFireChip({
  action,
  entityType,
  entityId,
}: {
  action: AiActionDefinition;
  entityType: EntityType;
  entityId: string;
}) {
  const [open, setOpen] = useState(false);
  const { run, stop, status, text, citations, result, error } =
    useInvokeAndStream();

  const onClick = useCallback(async () => {
    setOpen(true);
    try {
      await run({
        action: action.id,
        entityType,
        entityId,
        idempotencyKey: `qf:${action.id}:${entityType}:${entityId}:${Date.now()}`,
      });
    } catch {
      /* surfaced via hook state */
    }
  }, [run, action.id, entityType, entityId]);

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={onClick}
        disabled={status === 'streaming'}
        className="w-full rounded-md border border-canvas-300 bg-canvas-50 px-3 py-2 text-left text-sm font-medium text-canvas-800 transition hover:bg-canvas-100 disabled:opacity-50 dark:border-canvas-700 dark:bg-canvas-900 dark:text-canvas-100 dark:hover:bg-canvas-800"
      >
        <div className="flex items-center justify-between gap-2">
          <span>{action.name}</span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-canvas-500">
            {action.costModel.tierRequired}
          </span>
        </div>
        {action.description && (
          <p className="mt-1 text-xs font-normal text-canvas-500">
            {action.description}
          </p>
        )}
      </button>

      {open && status !== 'idle' && (
        <div className="mt-2 rounded-md border border-canvas-200 bg-canvas-100 p-3 text-sm dark:border-canvas-700 dark:bg-canvas-800">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-canvas-500">
              {status === 'streaming' && 'Running…'}
              {status === 'completed' && 'Done'}
              {status === 'failed' && 'Failed'}
              {status === 'cancelled' && 'Cancelled'}
            </span>
            {status === 'streaming' && (
              <button
                type="button"
                onClick={stop}
                className="text-xs text-state-error hover:underline"
              >
                Stop
              </button>
            )}
            {status !== 'streaming' && (
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-xs text-canvas-500 hover:underline"
              >
                Dismiss
              </button>
            )}
          </div>
          <pre className="whitespace-pre-wrap text-xs text-canvas-700 dark:text-canvas-200">
            {typeof result?.output === 'string' ? result.output : text || error || '…'}
          </pre>
          {citations.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {citations.map((c, i) => (
                <CitationChip key={`${c.knowledgeEntryId}-${i}`} citation={c} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
