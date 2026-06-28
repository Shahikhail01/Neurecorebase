import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_ENDPOINTS } from '@neurecore/ui/endpoints';
import { queryKeys } from '@neurecore/ui/query';
import { restClient } from '@/infrastructure/api/RestClient';
import type { PaginatedResponse } from '@neurecore/ui/types';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assigneeId?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskFilters {
  status?: string;
  priority?: string;
  assigneeId?: string;
  page?: number;
  limit?: number;
  [key: string]: string | number | boolean | undefined;
}

export function useTasks(tenantId: string, filters?: TaskFilters) {
  return useQuery({
    queryKey: queryKeys.tasks.list(tenantId, filters),
    queryFn: ({ signal }) =>
      restClient.get<PaginatedResponse<Task>>(API_ENDPOINTS.tasks.list, {
        signal,
        params: filters,
      }),
    enabled: !!tenantId,
  });
}

export function useTask(id: string) {
  return useQuery({
    queryKey: queryKeys.tasks.detail(id),
    queryFn: ({ signal }) =>
      restClient.get<Task>(API_ENDPOINTS.tasks.detail(id), { signal }),
    enabled: !!id,
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<Task>) =>
      restClient.post<Task>(API_ENDPOINTS.tasks.create, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useUpdateTask(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<Task>) =>
      restClient.patch<Task>(API_ENDPOINTS.tasks.update(id), input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.tasks.detail(id) });
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useDeleteTask(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => restClient.delete(API_ENDPOINTS.tasks.delete(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useAssignTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, assigneeId }: { taskId: string; assigneeId: string }) =>
      restClient.post(API_ENDPOINTS.tasks.assign(taskId), { assigneeId }),
    onSuccess: (_data, { taskId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.tasks.detail(taskId) });
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
