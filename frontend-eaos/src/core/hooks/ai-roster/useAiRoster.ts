import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { API_ENDPOINTS } from '@neurecore/ui/endpoints';
import { queryKeys } from '@neurecore/ui/query';
import { QUERY_STALE_TIMES } from '@/config/query-stale-times';
import { restClient } from '@/infrastructure/api/RestClient';
import type { PaginatedResponse } from '@neurecore/ui/types';

export interface AIRosterEntry {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'paused' | 'error' | 'stopped';
  subState?: string;
  capabilities: string[];
  lastActiveAt?: string;
  taskCount: number;
  successRate: number;
}

export interface AIRosterFilters {
  status?: string;
  type?: string;
  page?: number;
  limit?: number;
  [key: string]: string | number | boolean | undefined;
}

export function useAiRoster(tenantId: string, filters?: AIRosterFilters) {
  return useQuery({
    queryKey: queryKeys.aiRoster.list(tenantId, filters),
    queryFn: ({ signal }) =>
      restClient.get<PaginatedResponse<AIRosterEntry>>(
        API_ENDPOINTS.aiRoster.list,
        { signal, params: filters },
      ),
    staleTime: QUERY_STALE_TIMES.AI_ROSTER,
    enabled: !!tenantId,
  });
}

export function usePauseAiRosterEntry(tenantId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (entryId: string) =>
      restClient.post(API_ENDPOINTS.aiRoster.pause(entryId)),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: queryKeys.aiRoster.all(tenantId),
      });
    },
  });
}
