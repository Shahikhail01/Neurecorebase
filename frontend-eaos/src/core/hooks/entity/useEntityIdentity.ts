import { useQuery } from '@tanstack/react-query';
import { API_ENDPOINTS } from '@neurecore/ui/endpoints';
import { queryKeys } from '@neurecore/ui/query';
import type { IdentityPanel, EntityType } from '@neurecore/ui/types';
import { restClient } from '@/infrastructure/api/RestClient';

export function useEntityIdentity(type: EntityType, id: string) {
  return useQuery({
    queryKey: queryKeys.entity.identity(type, id),
    queryFn: ({ signal }) =>
      restClient.get<IdentityPanel>(API_ENDPOINTS.entity.IDENTITY(type, id), { signal }),
    enabled: !!id && !!type,
  });
}