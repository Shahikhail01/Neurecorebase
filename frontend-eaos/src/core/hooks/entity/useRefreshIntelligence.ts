import { useMutation, useQueryClient } from '@tanstack/react-query';
import { API_ENDPOINTS } from '@neurecore/ui/endpoints';
import { queryKeys } from '@neurecore/ui/query';
import { restClient } from '@/infrastructure/api/RestClient';
import type { EntityType } from '@neurecore/ui/types';

export function useRefreshIntelligence(type: EntityType, id: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () =>
      restClient.post(API_ENDPOINTS.entity.INTELLIGENCE(type, id)),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: queryKeys.entity.intelligence(type, id),
      });
    },
  });
}
