/**
 * Marketplace hooks — TanStack Query wrappers over the unified marketplace API.
 *
 * Phase 7, Task 7.13 (per `EAOS-api-contract.md` §8.19).
 *
 * Exports:
 *   useMarketplaceTabs             → GET /marketplace/tabs   (counts + recent)
 *   useMarketplaceItems            → GET /marketplace/items?tab=…&q=…
 */

import {
  useQuery,
  type UseQueryResult,
} from '@tanstack/react-query';
import { API_ENDPOINTS } from '@neurecore/ui/endpoints';
import { queryKeys } from '@neurecore/ui/query';

export type MarketplaceTab =
  | 'packs'
  | 'agent-templates'
  | 'connectors'
  | 'workflows'
  | 'knowledge-packs'
  | 'widgets'
  | 'themes'
  | 'installed';

export interface MarketplaceItem {
  id: string;
  tab: MarketplaceTab;
  slug: string;
  name: string;
  shortDescription: string;
  description?: string;
  icon: string;
  color: string;
  tierRequired?: string;
  category?: string;
  tags?: string[];
  installed?: boolean;
  meta?: Record<string, unknown>;
}

export interface MarketplaceSummary {
  counts: Record<MarketplaceTab, number>;
  recentlyInstalled: MarketplaceItem[];
}

async function getRestClient() {
  const mod = await import('@/infrastructure/api/RestClient');
  return mod.restClient;
}

export function useMarketplaceTabs(
  tenantId: string | undefined,
): UseQueryResult<MarketplaceSummary> {
  return useQuery({
    queryKey: queryKeys.marketplace.tabs(tenantId ?? '_'),
    queryFn: async ({ signal }) => {
      const restClient = await getRestClient();
      return restClient.get<MarketplaceSummary>(API_ENDPOINTS.marketplace.tabs, { signal });
    },
    enabled: !!tenantId,
    staleTime: 60_000,
  });
}

export function useMarketplaceItems(
  tenantId: string | undefined,
  tab: MarketplaceTab,
  q?: string,
  installedOnly = false,
): UseQueryResult<MarketplaceItem[]> {
  return useQuery({
    queryKey: queryKeys.marketplace.items(tenantId ?? '_', tab, q),
    queryFn: async ({ signal }) => {
      const restClient = await getRestClient();
      return restClient.get<MarketplaceItem[]>(API_ENDPOINTS.marketplace.items, {
        signal,
        params: { tab, q, installedOnly },
      });
    },
    enabled: !!tenantId,
    staleTime: 60_000,
  });
}