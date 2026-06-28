import { useQuery } from '@tanstack/react-query';
import { API_ENDPOINTS } from '@neurecore/ui/endpoints';
import { queryKeys } from '@neurecore/ui/query';
import type { InsightsPanel, EntityType } from '@neurecore/ui/types';
import { restClient } from '@/infrastructure/api/RestClient';

export function useEntityInsights(type: EntityType, id: string) {
  return useQuery({
    queryKey: queryKeys.entity.insights(type, id),
    queryFn: ({ signal }) =>
      restClient.get<InsightsPanel>(API_ENDPOINTS.entity.INSIGHTS(type, id), { signal }),
    enabled: !!id && !!type,
  });
}