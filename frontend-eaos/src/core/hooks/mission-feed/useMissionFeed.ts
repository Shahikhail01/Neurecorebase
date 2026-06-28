import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { API_ENDPOINTS } from '@neurecore/ui/endpoints';
import { queryKeys } from '@neurecore/ui/query';
import { QUERY_STALE_TIMES } from '@/config/query-stale-times';
import { restClient } from '@/infrastructure/api/RestClient';
import type { PaginatedResponse } from '@neurecore/ui/types';

export interface MissionFeedItem {
  id: string;
  type: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  entityType?: string;
  entityId?: string;
  dismissed: boolean;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

interface MissionFeedResponse extends PaginatedResponse<MissionFeedItem> {
  pagination: {
    nextCursor?: string;
    hasMore: boolean;
  };
}

export function useMissionFeed(tenantId: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.missionFeed.list(tenantId),
    queryFn: ({ pageParam, signal }) =>
      restClient.get<MissionFeedResponse>(API_ENDPOINTS.missionFeed.list, {
        signal,
        params: {
          cursor: pageParam ?? undefined,
          limit: 20,
        },
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.nextCursor ?? null,
    staleTime: QUERY_STALE_TIMES.MISSION_FEED,
    enabled: !!tenantId,
  });
}

export function useDismissMissionFeedItem(tenantId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) =>
      restClient.post(API_ENDPOINTS.missionFeed.dismiss(itemId)),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: queryKeys.missionFeed.all(tenantId),
      });
    },
  });
}
