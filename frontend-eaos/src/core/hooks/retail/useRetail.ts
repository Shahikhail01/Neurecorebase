/**
 * Retail hooks — TanStack Query wrappers for the retail backend.
 *
 * Phase 8 (per `EAOS-implementation-roadmap.md` §12).
 *
 * Exports:
 *   useRetailActions      → GET /retail/actions
 *   useRetailWidgets      → GET /retail/widgets
 *   useRetailWidgetValue  → POST /retail/widgets/:id/compute
 *   useExecuteRetailAction → POST /retail/actions/:id/execute
 *   useSyncShopify         → POST /retail/integrations/shopify/sync
 *   useSyncSquare          → POST /retail/integrations/square/sync
 *
 * SOLID: SRP — one hook per endpoint; DIP — depends on API_ENDPOINTS
 * and RestClient, never raw fetch.
 */
'use client';

import {
  useMutation,
  useQuery,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { API_ENDPOINTS } from '@neurecore/ui/endpoints';
import { queryKeys } from '@neurecore/ui/query';
import { restClient } from '@/infrastructure/api/RestClient';

// ─── Types ──────────────────────────────────────────────────────────────

export type RetailActionId =
  | 'retail:inventory-forecast'
  | 'retail:visual-merch'
  | 'retail:nps-analysis'
  | 'retail:replenishment'
  | 'retail:conversion-optimizer'
  | 'retail:loss-prevention'
  | 'retail:staffing-forecast'
  | 'retail:layout-optimize'
  | 'retail:assortment-plan'
  | 'retail:markdown-optimizer'
  | 'retail:demand-sensing'
  | 'retail:shopper-segmentation';

export interface RetailActionSummary {
  id: RetailActionId;
  name: string;
  description: string;
  category: 'INTELLIGENCE' | 'ANALYSIS' | 'OPTIMIZATION' | 'EXECUTION' | 'REPORTING';
  capability: 'intelligence' | 'operations' | 'insights' | 'automation' | 'collaboration';
  tags: string[];
  requiresStreaming: boolean;
  tierRequired: 'COMMUNITY' | 'STARTER' | 'PRO' | 'ENTERPRISE';
  tokensEstimate: number;
}

export interface RetailWidgetSummary {
  id: string;
  title: string;
  subtitle?: string;
  icon?: string;
  capability: string;
  visualizations: string[];
  defaultVisualization: string;
  entityTypes: string[];
}

export interface RetailWidgetValue {
  widgetId: string;
  entityId: string;
  data: unknown;
}

export interface RetailActionResult {
  actionId: RetailActionId;
  output: unknown;
  citations?: Array<{
    knowledgeEntryId: string;
    label: string;
    confidence: number;
  }>;
  model?: string;
  tokensUsed?: { input?: number; output?: number; total?: number };
  estimatedCostUsd?: number;
  confidence?: number;
  metadata?: Record<string, unknown>;
}

// ─── Hooks ──────────────────────────────────────────────────────────────

export function useRetailActions(
  tenantId?: string,
): UseQueryResult<{ items: RetailActionSummary[] }> {
  return useQuery({
    queryKey: queryKeys.retail.actions(tenantId ?? 'default'),
    queryFn: async () => {
      const data = await restClient.get<{ items: RetailActionSummary[] }>(
        API_ENDPOINTS.retail.actions,
      );
      return data;
    },
    enabled: Boolean(tenantId),
    staleTime: 5 * 60 * 1000,
  });
}

export function useRetailWidgets(
  tenantId?: string,
): UseQueryResult<{ items: RetailWidgetSummary[] }> {
  return useQuery({
    queryKey: queryKeys.retail.widgets(tenantId ?? 'default'),
    queryFn: async () => {
      const data = await restClient.get<{ items: RetailWidgetSummary[] }>(
        API_ENDPOINTS.retail.widgets,
      );
      return data;
    },
    enabled: Boolean(tenantId),
    staleTime: 5 * 60 * 1000,
  });
}

export function useRetailWidgetValue(
  tenantId: string | undefined,
  widgetId: string,
  entityType: string,
  entityId: string,
  params?: Record<string, unknown>,
): UseQueryResult<RetailWidgetValue> {
  return useQuery({
    queryKey: queryKeys.retail.widgetValue(
      tenantId ?? 'default',
      widgetId,
      entityType,
      entityId,
      params,
    ),
    queryFn: async () => {
      const data = await restClient.post<RetailWidgetValue>(
        API_ENDPOINTS.retail.computeWidget(widgetId),
        { entityType, entityId, params: params ?? {} },
      );
      return data;
    },
    enabled: Boolean(tenantId && widgetId && entityId),
    staleTime: 60 * 1000,
  });
}

export function useExecuteRetailAction(
  tenantId: string | undefined,
): UseMutationResult<
  RetailActionResult,
  Error,
  {
    actionId: RetailActionId;
    entityType: string;
    entityId: string;
    parameters?: Record<string, unknown>;
  }
> {
  return useMutation({
    mutationFn: async (input) => {
      const data = await restClient.post<RetailActionResult>(
        API_ENDPOINTS.retail.executeAction(input.actionId),
        {
          entityType: input.entityType,
          entityId: input.entityId,
          parameters: input.parameters ?? {},
        },
      );
      return data;
    },
  });
}

export function useSyncShopify(tenantId?: string): UseMutationResult<
  { ok: boolean; integration: string; status: string; message?: string },
  Error,
  void
> {
  return useMutation({
    mutationFn: async () => {
      const data = await restClient.post<{
        ok: boolean;
        integration: string;
        status: string;
        message?: string;
      }>(API_ENDPOINTS.retail.syncShopify, {});
      return data;
    },
  });
}

export function useSyncSquare(tenantId?: string): UseMutationResult<
  { ok: boolean; integration: string; status: string; message?: string },
  Error,
  void
> {
  return useMutation({
    mutationFn: async () => {
      const data = await restClient.post<{
        ok: boolean;
        integration: string;
        status: string;
        message?: string;
      }>(API_ENDPOINTS.retail.syncSquare, {});
      return data;
    },
  });
}