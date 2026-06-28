/**
 * useAiActions — Phase 5, Tasks 5.6 + 5.8 + 5.9 + 5.10.
 *
 * Single hook module exposing the AI Action surface to every frontend
 * consumer (Intelligence panel, Command Palette, Automation panel
 * quick-fire, global "Ask AI" button).
 *
 * Hooks exported:
 *   - `useAvailableAiActions(entityType?)`
 *       GET /ai-actions/available — list every action the current user
 *       can invoke. Powers Command Palette + Automation panel.
 *   - `useExecuteAiAction()`
 *       POST /ai-actions/execute — kicks off an invocation.
 *   - `useAiActionInvocation(invocationId)`
 *       GET /ai-actions/:id — poll the result.
 *   - `useStreamAiAction(invocationId, onChunk)`
 *       SSE — receive token deltas live (Phase 5, Task 5.4 client).
 *   - `useCancelAiAction()`
 *       POST /ai-actions/:id/cancel.
 *
 * SOLID:
 *   - SRP — one hook per concern; the file stays a thin façade over
 *     `restClient` / `sseClient` / TanStack Query.
 *   - DIP — all hooks depend on the generated `API_ENDPOINTS` contract
 *     and the typed `AIActionDefinition` envelope; no raw `fetch`.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { API_ENDPOINTS } from '@neurecore/ui/endpoints';
import { restClient } from '@/infrastructure/api/RestClient';
import { sseClient } from '@/infrastructure/sse/SSEClient';

export type AiActionTier = 'COMMUNITY' | 'STARTER' | 'PRO' | 'ENTERPRISE';

export type AiActionCategory =
  | 'INTELLIGENCE'
  | 'ANALYSIS'
  | 'OPTIMIZATION'
  | 'EXECUTION'
  | 'REPORTING';

export type AiActionCapability =
  | 'intelligence'
  | 'operations'
  | 'insights'
  | 'automation'
  | 'collaboration';

export interface AiActionCitation {
  knowledgeEntryId: string;
  label: string;
  confidence: number;
  span?: string;
}

export interface AiActionResult {
  output: unknown;
  citations?: AiActionCitation[];
  model?: string;
  tokensUsed?: { input?: number; output?: number; total?: number };
  estimatedCostUsd?: number;
  confidence?: number;
  metadata?: Record<string, unknown>;
}

export interface AiActionDefinition {
  id: string;
  name: string;
  description: string;
  category: AiActionCategory;
  capability: AiActionCapability;
  tags: string[];
  supportedEntities: string[];
  requiredPermissions: string[];
  requiresStreaming: boolean;
  timeoutMs: number;
  maxRetries: number;
  costModel: {
    type: 'per_invocation' | 'per_token' | 'included_in_tier';
    tokensEstimate: number;
    tierRequired: AiActionTier;
  };
  version: string;
  status: 'draft' | 'stable' | 'deprecated';
}

export interface AvailableAiActionsResponse {
  items: AiActionDefinition[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ExecuteAiActionInput {
  action: string;
  entityType?: string;
  entityId?: string;
  parameters?: Record<string, unknown>;
  idempotencyKey?: string;
}

export interface AiActionInvocation {
  id: string;
  tenantId: string;
  actionId: string;
  entityType?: string | null;
  entityId?: string | null;
  invokedById: string;
  input: Record<string, unknown>;
  output: unknown;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  tokensUsed: number;
  estimatedCostUsd: number | null;
  durationMs: number | null;
  errorMessage: string | null;
  streamUrl: string | null;
  startedAt: string;
  completedAt: string | null;
}

export type AiActionStreamEvent =
  | { type: 'connected'; invocationId: string; timestamp: number }
  | {
      type: 'start';
      invocationId: string;
      timestamp: number;
      data?: { actionId?: string; entityType?: string; entityId?: string };
    }
  | {
      type: 'delta';
      invocationId: string;
      timestamp: number;
      data?: { delta?: string };
    }
  | {
      type: 'citation';
      invocationId: string;
      timestamp: number;
      data?: { citation?: AiActionCitation };
    }
  | {
      type: 'complete';
      invocationId: string;
      timestamp: number;
      data?: { result?: AiActionResult };
    }
  | {
      type: 'error';
      invocationId: string;
      timestamp: number;
      error?: string;
    }
  | {
      type: 'cancelled';
      invocationId: string;
      timestamp: number;
      error?: string;
    }
  | {
      type: 'heartbeat';
      invocationId: string;
      timestamp: number;
      data?: { alive?: boolean };
    };

// ── List available actions ────────────────────────────────────────────

export function useAvailableAiActions(entityType?: string) {
  return useQuery({
    queryKey: queryKeysAiActions.available(entityType),
    queryFn: ({ signal }) =>
      restClient.get<AvailableAiActionsResponse>(
        entityType
          ? `${API_ENDPOINTS.aiActions.execute.replace('/execute', '/available')}?entityType=${encodeURIComponent(entityType)}`
          : API_ENDPOINTS.aiActions.execute.replace('/execute', '/available'),
        { signal },
      ),
    staleTime: 60_000,
  });
}

// ── Execute an AI Action ───────────────────────────────────────────────

export function useExecuteAiAction() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: ExecuteAiActionInput) =>
      restClient.post<AiActionInvocation>(API_ENDPOINTS.aiActions.execute, input),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['ai-actions', 'invocations'] });
      qc.setQueryData(queryKeysAiActions.detail(data.id), data);
    },
  });
}

// ── Poll invocation ────────────────────────────────────────────────────

export function useAiActionInvocation(
  invocationId: string | null | undefined,
  options?: { enabled?: boolean; refetchInterval?: number },
) {
  return useQuery({
    queryKey: invocationId
      ? queryKeysAiActions.detail(invocationId)
      : ['ai-actions', 'invocation', '__noop'],
    queryFn: ({ signal }) =>
      restClient.get<AiActionInvocation>(
        API_ENDPOINTS.aiActions.detail(invocationId as string),
        { signal },
      ),
    enabled: Boolean(invocationId) && (options?.enabled ?? true),
    refetchInterval: options?.refetchInterval ?? 1500,
  });
}

// ── SSE stream ─────────────────────────────────────────────────────────

export interface UseStreamAiActionArgs {
  /**
   * Currently-active invocation id. Hook is dormant while null/undefined.
   */
  invocationId: string | null | undefined;
  /** Called for every event. */
  onEvent: (event: AiActionStreamEvent) => void;
  /** Whether the consumer has signalled "Stop" (abort). */
  aborted?: boolean;
}

export function useStreamAiAction({
  invocationId,
  onEvent,
  aborted,
}: UseStreamAiActionArgs) {
  const handlerRef = useRef(onEvent);
  handlerRef.current = onEvent;

  const [isConnected, setConnected] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    if (!invocationId || aborted) return;
    setConnected(false);
    setLastError(null);

    const close = sseClient.open<AiActionStreamEvent>(
      API_ENDPOINTS.aiActions.stream(invocationId),
      (event) => {
        if (event.type === 'connected') setConnected(true);
        if (event.type === 'error') {
          setLastError(
            typeof event.data === 'string' ? event.data : 'stream error',
          );
        }
        try {
          handlerRef.current(event.data);
        } catch (err) {
          console.error('[useStreamAiAction] handler threw', err);
        }
      },
    );
    return () => {
      close();
      setConnected(false);
    };
  }, [invocationId, aborted]);

  return { isConnected, lastError };
}

// ── Cancel ─────────────────────────────────────────────────────────────

export function useCancelAiAction() {
  return useMutation({
    mutationFn: (invocationId: string) =>
      restClient.post<{ status: string; invocationId: string }>(
        `${API_ENDPOINTS.aiActions.detail(invocationId)}/cancel`,
        {},
      ),
  });
}

// ── Convenience: invoke + stream in one call ───────────────────────────

export interface UseInvokeAndStreamArgs {
  onDelta?: (delta: string, accumulated: string) => void;
  onCitation?: (citation: AiActionCitation) => void;
  onComplete?: (result: AiActionResult | undefined) => void;
  onError?: (error: string) => void;
}

export interface UseInvokeAndStreamReturn {
  run: (input: ExecuteAiActionInput) => Promise<AiActionInvocation>;
  stop: () => void;
  reset: () => void;
  invocationId: string | null;
  status: 'idle' | 'streaming' | 'completed' | 'failed' | 'cancelled';
  text: string;
  citations: AiActionCitation[];
  result?: AiActionResult;
  error?: string;
  isConnected: boolean;
}

export function useInvokeAndStream(
  args: UseInvokeAndStreamArgs = {},
): UseInvokeAndStreamReturn {
  const execute = useExecuteAiAction();
  const cancel = useCancelAiAction();

  const [invocationId, setInvocationId] = useState<string | null>(null);
  const [aborted, setAborted] = useState(false);
  const [text, setText] = useState('');
  const [citations, setCitations] = useState<AiActionCitation[]>([]);
  const [result, setResult] = useState<AiActionResult | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [status, setStatus] = useState<UseInvokeAndStreamReturn['status']>(
    'idle',
  );

  const reset = useCallback(() => {
    setInvocationId(null);
    setAborted(false);
    setText('');
    setCitations([]);
    setResult(undefined);
    setError(undefined);
    setStatus('idle');
  }, []);

  const run = useCallback(
    async (input: ExecuteAiActionInput) => {
      reset();
      setStatus('streaming');
      try {
        const invocation = await execute.mutateAsync(input);
        setInvocationId(invocation.id);
        return invocation;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        setStatus('failed');
        args.onError?.(msg);
        throw err;
      }
    },
    [execute, reset, args],
  );

  const stop = useCallback(() => {
    setAborted(true);
    if (invocationId) {
      void cancel.mutate(invocationId);
    }
  }, [cancel, invocationId]);

  useStreamAiAction({
    invocationId,
    aborted,
    onEvent: (event) => {
      switch (event.type) {
        case 'delta': {
          const delta = event.data?.delta ?? '';
          setText((prev) => {
            const next = prev + delta;
            args.onDelta?.(delta, next);
            return next;
          });
          break;
        }
        case 'citation': {
          const c = event.data?.citation;
          if (c) {
            setCitations((prev) => [...prev, c]);
            args.onCitation?.(c);
          }
          break;
        }
        case 'complete': {
          const r = event.data?.result;
          setResult(r);
          setStatus('completed');
          args.onComplete?.(r);
          break;
        }
        case 'cancelled': {
          setStatus('cancelled');
          break;
        }
        case 'error': {
          const msg = event.error ?? 'stream error';
          setError(msg);
          setStatus('failed');
          args.onError?.(msg);
          break;
        }
        default:
          break;
      }
    },
  });

  return {
    run,
    stop,
    reset,
    invocationId,
    status,
    text,
    citations,
    result,
    error,
    isConnected: false,
  };
}

export const queryKeysAiActions = {
  available: (entityType?: string) =>
    ['ai-actions', 'available', entityType ?? '*'] as const,
  detail: (invocationId: string) =>
    ['ai-actions', 'invocation', invocationId] as const,
};
