import { useQuery } from '@tanstack/react-query';
import { API_ENDPOINTS } from '@neurecore/ui/endpoints';
import { queryKeys } from '@neurecore/ui/query';
import { QUERY_STALE_TIMES } from '@/config/query-stale-times';
import { restClient } from '@/infrastructure/api/RestClient';
import type { IntelligencePanelData } from './entity.types';
import type { EntityType } from '@neurecore/ui/types';

export function useEntityIntelligence(type: EntityType, id: string) {
  return useQuery({
    queryKey: queryKeys.entity.intelligence(type, id),
    queryFn: ({ signal }) =>
      restClient.get<IntelligencePanelData>(
        API_ENDPOINTS.entity.INTELLIGENCE(type, id),
        { signal },
      ),
    staleTime: QUERY_STALE_TIMES.ENTITY_INTELLIGENCE,
    enabled: !!id && !!type,
  });
}
