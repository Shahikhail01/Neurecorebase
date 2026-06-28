'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, LoadingState, ErrorState } from '@neurecore/ui/components';
import { API_ENDPOINTS } from '@neurecore/ui/endpoints';
import { queryKeys } from '@neurecore/ui/query';
import { restClient } from '@/infrastructure/api/RestClient';
import type { PaginatedResponse } from '@neurecore/ui/types';

interface Agent {
  id: string;
  name: string;
  type: string;
  status: string;
}

async function fetchAgents(): Promise<PaginatedResponse<Agent>> {
  return restClient.get<PaginatedResponse<Agent>>(API_ENDPOINTS.agents.list);
}

async function createAgent(data: Partial<Agent>): Promise<Agent> {
  return restClient.post<Agent>(API_ENDPOINTS.agents.create, data);
}

export default function TestQueryPage() {
  const qc = useQueryClient();

  const {
    data,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: queryKeys.agents.list('demo-tenant'),
    queryFn: fetchAgents,
    enabled: false,
  });

  const createMutation = useMutation({
    mutationFn: createAgent,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.agents.all('demo-tenant') });
    },
  });

  return (
    <main className="min-h-screen bg-canvas-50 px-6 py-12 dark:bg-canvas-950">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold text-canvas-900 dark:text-canvas-50">
          TanStack Query + REST Hook Demo
        </h1>
        <p className="mt-2 text-canvas-600 dark:text-canvas-400">
          Phase 1, Task 1.30 — proving the OpenAPI codegen + REST hook chain
          is wired end-to-end.
        </p>

        <section className="mt-8 rounded-lg border border-canvas-200 bg-canvas-50 p-6 dark:border-canvas-700 dark:bg-canvas-900">
          <h2 className="text-lg font-semibold text-canvas-900 dark:text-canvas-50">
            Agent List Query
          </h2>
          <p className="mt-1 text-sm text-canvas-500 dark:text-canvas-400">
            Query key: {JSON.stringify(queryKeys.agents.list('demo-tenant'))}
          </p>
          <div className="mt-4 flex gap-3">
            <Button
              variant="primary"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              {isFetching ? 'Fetching...' : 'Fetch Agents'}
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                createMutation.mutate({ name: 'Test Agent', type: 'test' })
              }
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Creating...' : 'Create Agent'}
            </Button>
          </div>

          <div className="mt-4 min-h-[200px]">
            {isLoading && <LoadingState label="Loading agents..." />}
            {error && (
              <ErrorState
                error={error as Error}
                onRetry={() => refetch()}
              />
            )}
            {data && (
              <div className="rounded border border-canvas-200 p-4 dark:border-canvas-700">
                <p className="text-sm text-canvas-600 dark:text-canvas-400">
                  Total agents: {data.meta.total}
                </p>
                <pre className="mt-2 max-h-48 overflow-auto text-xs text-canvas-700 dark:text-canvas-300">
                  {JSON.stringify(data.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </section>

        <section className="mt-8 rounded-lg border border-canvas-200 bg-canvas-50 p-6 dark:border-canvas-700 dark:bg-canvas-900">
          <h2 className="text-lg font-semibold text-canvas-900 dark:text-canvas-50">
            Query Keys Factory
          </h2>
          <pre className="mt-4 overflow-x-auto rounded bg-canvas-100 p-4 text-xs text-canvas-700 dark:bg-canvas-800 dark:text-canvas-300">
            {JSON.stringify(queryKeys, null, 2)}
          </pre>
        </section>

        <section className="mt-8 rounded-lg border border-canvas-200 bg-canvas-50 p-6 dark:border-canvas-700 dark:bg-canvas-900">
          <h2 className="text-lg font-semibold text-canvas-900 dark:text-canvas-50">
            API Endpoints Registry
          </h2>
          <pre className="mt-4 overflow-x-auto rounded bg-canvas-100 p-4 text-xs text-canvas-700 dark:bg-canvas-800 dark:text-canvas-300">
            {JSON.stringify(API_ENDPOINTS, null, 2)}
          </pre>
        </section>
      </div>
    </main>
  );
}
