import { useQuery } from '@tanstack/react-query';
import { API_ENDPOINTS } from '@neurecore/ui/endpoints';
import { queryKeys } from '@neurecore/ui/query';
import type { ResourcesPanel, EntityType } from '@neurecore/ui/types';
import { restClient } from '@/infrastructure/api/RestClient';

export function useEntityResources(type: EntityType, id: string) {
  return useQuery({
    queryKey: queryKeys.entity.resources(type, id),
    queryFn: ({ signal }) =>
      restClient.get<ResourcesPanel>(API_ENDPOINTS.entity.RESOURCES(type, id), { signal }),
    enabled: !!id && !!type,
  });
}