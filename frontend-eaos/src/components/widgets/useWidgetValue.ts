'use client';

import { useQuery } from '@tanstack/react-query';
import { restClient } from '@/infrastructure/api/RestClient';
import type { AggregationResult } from './widget.types';

const COMPUTE_PATH = (id: string) => `/api/v1/widgets/${id}/compute`;

interface ComputeArgs {
  widgetId: string;
  entityType: string;
  entityId: string;
  params?: Record<string, unknown>;
}

/**
 * useWidgetValue — fetch a single widget's computed value.
 *
 * Hits `POST /api/v1/widgets/:id/compute`. The widget-id is part of the
 * query key so per-widget updates invalidate independently.
 */
export function useWidgetValue(
  args: ComputeArgs | null,
  options?: { enabled?: boolean; refreshInterval?: number },
) {
  return useQuery({
    queryKey: ['widgets', 'compute', args?.widgetId, args?.entityId, args?.params],
    queryFn: ({ signal }) =>
      restClient.post<AggregationResult>(
        COMPUTE_PATH(args!.widgetId),
        {
          type: args!.entityType,
          entityId: args!.entityId,
          params: args!.params,
        },
        { signal },
      ),
    enabled:
      (options?.enabled ?? true) &&
      !!args?.widgetId &&
      !!args?.entityType &&
      !!args?.entityId,
    refetchInterval: options?.refreshInterval ?? false,
    staleTime: 30_000,
  });
}