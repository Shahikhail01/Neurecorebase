import { useQuery } from '@tanstack/react-query';
import { API_ENDPOINTS } from '@neurecore/ui/endpoints';
import { queryKeys } from '@neurecore/ui/query';
import type { AutomationPanel, EntityType } from '@neurecore/ui/types';
import { restClient } from '@/infrastructure/api/RestClient';

export function useEntityAutomation(type: EntityType, id: string) {
  return useQuery({
    queryKey: queryKeys.entity.automation(type, id),
    queryFn: ({ signal }) =>
      restClient.get<AutomationPanel>(API_ENDPOINTS.entity.AUTOMATION(type, id), { signal }),
    enabled: !!id && !!type,
  });
}