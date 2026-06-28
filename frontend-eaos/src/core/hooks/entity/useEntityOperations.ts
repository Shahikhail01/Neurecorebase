import { useQuery } from '@tanstack/react-query';
import { API_ENDPOINTS } from '@neurecore/ui/endpoints';
import { queryKeys } from '@neurecore/ui/query';
import type { OperationsPanel, EntityType } from '@neurecore/ui/types';
import { restClient } from '@/infrastructure/api/RestClient';

export function useEntityOperations(type: EntityType, id: string) {
  return useQuery({
    queryKey: queryKeys.entity.operations(type, id),
    queryFn: ({ signal }) =>
      restClient.get<OperationsPanel>(API_ENDPOINTS.entity.OPERATIONS(type, id), { signal }),
    enabled: !!id && !!type,
  });
}