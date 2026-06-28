import { useQuery } from '@tanstack/react-query';
import { API_ENDPOINTS } from '@neurecore/ui/endpoints';
import { queryKeys } from '@neurecore/ui/query';
import { QUERY_STALE_TIMES } from '@/config/query-stale-times';
import { restClient } from '@/infrastructure/api/RestClient';
import type { LifecyclePanelData } from './entity.types';
import type { EntityType } from '@neurecore/ui/types';

export function useEntityLifecycle(type: EntityType, id: string) {
  return useQuery({
    queryKey: queryKeys.entity.lifecycle(type, id),
    queryFn: ({ signal }) =>
      restClient.get<LifecyclePanelData>(
        API_ENDPOINTS.entity.LIFECYCLE(type, id),
        { signal },
      ),
    staleTime: QUERY_STALE_TIMES.ENTITY_LIFECYCLE,
    enabled: !!id && !!type,
  });
}