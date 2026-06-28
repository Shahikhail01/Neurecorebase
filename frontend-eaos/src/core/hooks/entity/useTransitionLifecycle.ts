import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { LifecyclePanel, EntityType, LifecycleState } from '@neurecore/ui/types';
import { API_ENDPOINTS } from '@neurecore/ui/endpoints';
import { queryKeys } from '@neurecore/ui/query';
import { restClient } from '@/infrastructure/api/RestClient';

export interface TransitionInput {
  to: LifecycleState;
  from?: LifecycleState;
  reason?: string;
}

export function useTransitionLifecycle(type: EntityType, id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: TransitionInput) =>
      restClient.post<LifecyclePanel>(
        API_ENDPOINTS.entity.LIFECYCLE_TRANSITION(type, id),
        input,
      ),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.entity.lifecycle(type, id), data);
      qc.invalidateQueries({ queryKey: queryKeys.entity.workspace(type, id) });
      qc.invalidateQueries({ queryKey: queryKeys.entity.activity(type, id) });
    },
  });
}