import { useQuery } from '@tanstack/react-query';
import { API_ENDPOINTS } from '@neurecore/ui/endpoints';
import { queryKeys } from '@neurecore/ui/query';
import { QUERY_STALE_TIMES } from '@/config/query-stale-times';
import { restClient } from '@/infrastructure/api/RestClient';
import type { PaginatedResponse } from '@neurecore/ui/types';
import type { ActivityEvent } from './entity.types';
import type { EntityType } from '@neurecore/ui/types';

export interface ActivityFilter {
  page?: number;
  limit?: number;
  type?: string;
  userId?: string;
  [key: string]: string | number | boolean | undefined;
}

export function useEntityActivity(type: EntityType, id: string, filter?: ActivityFilter) {
  return useQuery({
    queryKey: [...queryKeys.entity.activity(type, id), filter],
    queryFn: ({ signal }) =>
      restClient.get<PaginatedResponse<ActivityEvent>>(
        API_ENDPOINTS.entity.ACTIVITY(type, id),
        { signal, params: filter },
      ),
    staleTime: QUERY_STALE_TIMES.ENTITY_ACTIVITY,
    enabled: !!id && !!type,
  });
}
