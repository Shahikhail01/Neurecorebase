import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_ENDPOINTS } from '@neurecore/ui/endpoints';
import { queryKeys } from '@neurecore/ui/query';
import { restClient } from '@/infrastructure/api/RestClient';
import type { PaginatedResponse } from '@neurecore/ui/types';

export interface Agent {
  id: string;
  name: string;
  type: string;
  status: string;
  subState?: string;
  capabilities: string[];
  lastActiveAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgentFilters {
  status?: string;
  type?: string;
  page?: number;
  limit?: number;
  [key: string]: string | number | boolean | undefined;
}

export function useAgents(tenantId: string, filters?: AgentFilters) {
  return useQuery({
    queryKey: queryKeys.agents.list(tenantId, filters),
    queryFn: ({ signal }) =>
      restClient.get<PaginatedResponse<Agent>>(API_ENDPOINTS.agents.list, {
        signal,
        params: filters,
      }),
    enabled: !!tenantId,
  });
}

export function useAgent(id: string) {
  return useQuery({
    queryKey: queryKeys.agents.detail(id),
    queryFn: ({ signal }) =>
      restClient.get<Agent>(API_ENDPOINTS.agents.detail(id), { signal }),
    enabled: !!id,
  });
}

export function useCreateAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<Agent>) =>
      restClient.post<Agent>(API_ENDPOINTS.agents.create, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agents'] });
    },
  });
}

export function useUpdateAgent(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<Agent>) =>
      restClient.patch<Agent>(API_ENDPOINTS.agents.update(id), input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.agents.detail(id) });
      qc.invalidateQueries({ queryKey: ['agents'] });
    },
  });
}

export function useDeleteAgent(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => restClient.delete(API_ENDPOINTS.agents.delete(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agents'] });
    },
  });
}

export function usePauseAgent(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => restClient.post(API_ENDPOINTS.agents.pause(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.agents.detail(id) });
      qc.invalidateQueries({ queryKey: ['agents'] });
    },
  });
}

export function useResumeAgent(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => restClient.post(API_ENDPOINTS.agents.resume(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.agents.detail(id) });
      qc.invalidateQueries({ queryKey: ['agents'] });
    },
  });
}
