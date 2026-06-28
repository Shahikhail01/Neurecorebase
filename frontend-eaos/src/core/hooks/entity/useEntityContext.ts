import { useQuery } from '@tanstack/react-query';
import { API_ENDPOINTS } from '@neurecore/ui/endpoints';
import { queryKeys } from '@neurecore/ui/query';
import type { ContextPanel, EntityType } from '@neurecore/ui/types';
import { restClient } from '@/infrastructure/api/RestClient';

export function useEntityContext(type: EntityType, id: string) {
  return useQuery({
    queryKey: queryKeys.entity.context(type, id),
    queryFn: ({ signal }) =>
      restClient.get<ContextPanel>(API_ENDPOINTS.entity.CONTEXT(type, id), { signal }),
    enabled: !!id && !!type,
  });
}