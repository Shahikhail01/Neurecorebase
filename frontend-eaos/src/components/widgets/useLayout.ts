'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { restClient } from '@/infrastructure/api/RestClient';
import type { GridItem } from './widget.types';

interface SaveLayoutArgs {
  entityType: string;
  items: GridItem[];
  density?: 'compact' | 'default' | 'comfortable';
}

/**
 * useSaveLayout — persist the user's grid layout for an entity type.
 *
 * The backend writes to the `WorkspaceLayout` Prisma model (per
 * `EAOS-implementation-plan.md` §11.3). On success, invalidate the
 * matching layout query so re-mounts pick up the change immediately.
 */
export function useSaveLayout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: SaveLayoutArgs) => {
      return restClient.post<{ entityType: string; itemCount: number; updatedAt: string }>(
        `/api/v1/widgets/layout/${args.entityType}`,
        { items: args.items, density: args.density },
      );
    },
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: ['widgets', 'layout', vars.entityType] });
    },
  });
}

/**
 * useLoadLayout — load a saved layout (or empty array if none).
 */
export function useLoadLayout(entityType: string) {
  return useQuery({
    queryKey: ['widgets', 'layout', entityType],
    queryFn: ({ signal }) =>
      restClient.get<GridItem[]>(`/api/v1/widgets/layout/${entityType}`, { signal }),
    enabled: !!entityType,
    staleTime: 5 * 60_000,
  });
}