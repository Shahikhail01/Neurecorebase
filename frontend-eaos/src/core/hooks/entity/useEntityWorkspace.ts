import { useQuery } from '@tanstack/react-query';
import { API_ENDPOINTS } from '@neurecore/ui/endpoints';
import { queryKeys } from '@neurecore/ui/query';
import { QUERY_STALE_TIMES } from '@/config/query-stale-times';
import { restClient } from '@/infrastructure/api/RestClient';
import type { EntityWorkspaceSummary } from './entity.types';
import type { EntityType } from '@neurecore/ui/types';

export function useEntityWorkspace(type: EntityType, id: string) {
  return useQuery({
    queryKey: queryKeys.entity.workspace(type, id),
    queryFn: ({ signal }) =>
      restClient.get<EntityWorkspaceSummary>(
        API_ENDPOINTS.entity.WORKSPACE_SUMMARY(type, id),
        { signal },
      ),
    staleTime: QUERY_STALE_TIMES.ENTITY_WORKSPACE,
    enabled: !!id && !!type,
  });
}