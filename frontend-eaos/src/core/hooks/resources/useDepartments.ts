import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_ENDPOINTS } from '@neurecore/ui/endpoints';
import { queryKeys } from '@neurecore/ui/query';
import { restClient } from '@/infrastructure/api/RestClient';
import type { PaginatedResponse } from '@neurecore/ui/types';

export interface Department {
  id: string;
  name: string;
  description?: string;
  type?: string;
  managerId?: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentFilters {
  type?: string;
  parentId?: string;
  page?: number;
  limit?: number;
  [key: string]: string | number | boolean | undefined;
}

export function useDepartments(tenantId: string, filters?: DepartmentFilters) {
  return useQuery({
    queryKey: queryKeys.departments.list(tenantId, filters),
    queryFn: ({ signal }) =>
      restClient.get<PaginatedResponse<Department>>(
        API_ENDPOINTS.departments.list,
        { signal, params: filters },
      ),
    enabled: !!tenantId,
  });
}

export function useDepartment(id: string) {
  return useQuery({
    queryKey: queryKeys.departments.detail(id),
    queryFn: ({ signal }) =>
      restClient.get<Department>(API_ENDPOINTS.departments.detail(id), {
        signal,
      }),
    enabled: !!id,
  });
}

export function useCreateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<Department>) =>
      restClient.post<Department>(API_ENDPOINTS.departments.create, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['departments'] });
    },
  });
}

export function useUpdateDepartment(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<Department>) =>
      restClient.patch<Department>(API_ENDPOINTS.departments.update(id), input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.departments.detail(id) });
      qc.invalidateQueries({ queryKey: ['departments'] });
    },
  });
}

export function useDeleteDepartment(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => restClient.delete(API_ENDPOINTS.departments.delete(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['departments'] });
    },
  });
}
