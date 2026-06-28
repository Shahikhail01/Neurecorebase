import { useQuery } from '@tanstack/react-query';
import { API_ENDPOINTS } from '@neurecore/ui/endpoints';
import { queryKeys } from '@neurecore/ui/query';
import type { CollaborationPanel, EntityType } from '@neurecore/ui/types';
import { restClient } from '@/infrastructure/api/RestClient';

export function useEntityCollaboration(type: EntityType, id: string) {
  return useQuery({
    queryKey: queryKeys.entity.collaboration(type, id),
    queryFn: ({ signal }) =>
      restClient.get<CollaborationPanel>(API_ENDPOINTS.entity.COLLABORATION(type, id), { signal }),
    enabled: !!id && !!type,
  });
}