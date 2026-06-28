/**
 * Solution Pack hooks — TanStack Query + mutations.
 *
 * Phase 7, Task 7.13 (per `EAOS-api-contract.md` §8.19 +
 * `EAOS-frontend-data-layer.md` §3).
 *
 * Exports:
 *   useSolutionPacks             → GET    /solution-packs
 *   useSolutionPack              → GET    /solution-packs/{slug}
 *   useSolutionPackPreview       → GET    /solution-packs/{slug}/preview
 *   useInstallSolutionPack       → POST   /solution-packs/{slug}/install
 *   useUninstallSolutionPack     → DELETE /solution-packs/{slug}
 *   useInstalledPacks            → GET    /solution-packs/installed
 *   usePackInstallHistory        → GET    /solution-packs/installed/history
 *
 * SOLID: SRP — one hook per query/mutation; OCP — new operations are a
 * one-line addition that mirrors an existing hook; DIP — hooks depend
 * on @neurecore/ui tokens + RestClient, not raw fetch.
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { API_ENDPOINTS } from '@neurecore/ui/endpoints';
import { queryKeys } from '@neurecore/ui/query';

// ─── Types (mirror backend interfaces in solution-pack.interface.ts) ──

export type SolutionPackCategory = 'VERTICAL' | 'HORIZONTAL';
export type SolutionPackStatus = 'draft' | 'beta' | 'stable' | 'deprecated';
export type PackTierRequired = 'COMMUNITY' | 'STARTER' | 'PRO' | 'ENTERPRISE';
export type SolutionPackOwnerKind = 'SEED' | 'PLATFORM' | 'TENANT';

export interface PackEntitySubtype {
  baseType: string;
  subtype: string;
  label: string;
  icon: string;
  color?: string;
  description?: string;
}

export interface PackWidgetExtension {
  id: string;
  capability: string;
  capabilityDomain: string;
  title: string;
  subtitle?: string;
  icon?: string;
  aggregationType: string;
  defaultVisualization: string;
  visualizations: string[];
  entityTypes: string[];
  refreshInterval: number;
  category: 'CORE' | 'CONTEXTUAL' | 'INDUSTRY_SPECIFIC';
  description?: string;
}

export interface PackAIActionExtension {
  id: string;
  name: string;
  description: string;
  category: string;
  capability: string;
  tags: string[];
  supportedEntities: string[];
  requiresStreaming: boolean;
  timeoutMs: number;
  tierRequired: PackTierRequired;
  tokensEstimate: number;
  surfaces?: string[];
}

export interface PackKnowledgeSeed {
  title: string;
  type: string;
  content: string;
  tags?: string[];
  language?: string;
  departmentId?: string;
  source?: string;
  sourceUrl?: string;
}

export interface PackIntegrationDefinition {
  providerId: string;
  name: string;
  category: string;
  description: string;
  icon?: string;
}

export interface PackKPITemplate {
  id: string;
  label: string;
  unit: string;
  aggregation: string;
  dataSourceEntityType: string;
  description?: string;
}

export interface PackWorkflowTemplate {
  slug: string;
  name: string;
  description: string;
  trigger: string;
}

export interface PackPreviewMissionFeedItem {
  category: 'AI_INSIGHT' | 'SYSTEM' | 'PACK_INSTALLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  title: string;
  description: string;
  actionPayload?: Record<string, unknown>;
}

export interface PackThemingImpact {
  accentColor?: string;
  cssVariables?: Record<string, string>;
  logoUrl?: string;
  rationale?: string;
}

export interface SolutionExtensions {
  entitySubtypes?: PackEntitySubtype[];
  widgetExtensions?: PackWidgetExtension[];
  aiActionExtensions?: PackAIActionExtension[];
  knowledgePacks?: PackKnowledgeSeed[];
  integrationDefinitions?: PackIntegrationDefinition[];
  kpiTemplates?: PackKPITemplate[];
  workflowTemplates?: PackWorkflowTemplate[];
  previewMissionFeed?: PackPreviewMissionFeedItem[];
  themingImpact?: PackThemingImpact;
}

export interface SolutionPack {
  id: string;
  slug: string;
  name: string;
  version: string;
  category: SolutionPackCategory;
  description: string;
  shortDescription: string;
  icon: string;
  color: string;
  tierRequired: PackTierRequired;
  status: SolutionPackStatus;
  ownerKind: SolutionPackOwnerKind;
  ownerId: string | null;
  extensions: SolutionExtensions;
  requiresPacks: string[];
  conflictsWith: string[];
  tags: string[];
  monthlyPriceUsd: number;
  estimatedAiCredits: number;
  sortOrder: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TenantInstalledPack {
  id: string;
  tenantId: string;
  solutionPackId: string;
  packSlug: string;
  packVersion: string;
  extensionsSnapshot: SolutionExtensions;
  installedById: string | null;
  installedAt: string;
  uninstalledAt: string | null;
  uninstalledById: string | null;
  themingImpact: PackThemingImpact;
}

export type PackValidationFailureCode =
  | 'PACK_NOT_FOUND'
  | 'PACK_NOT_PUBLISHED'
  | 'TIER_INSUFFICIENT'
  | 'TIER_REQUIRED'
  | 'DEPENDENCY_MISSING'
  | 'CONFLICT'
  | 'ALREADY_INSTALLED'
  | 'OWNER_REQUIRED'
  | 'INTEGRATIONS_MISSING';

export interface PackValidationFailure {
  code: PackValidationFailureCode;
  message: string;
  relatedPackSlug?: string;
  tenantTier?: PackTierRequired;
  requiredTier?: PackTierRequired;
}

export interface PackInstallImpact {
  newEntitySubtypes: number;
  newWidgets: number;
  newAiActions: number;
  newKnowledgeEntries: number;
  newIntegrations: number;
  newKpiTemplates: number;
  newWorkflowTemplates: number;
  missionFeedPreview: PackPreviewMissionFeedItem[];
  themingImpact: PackThemingImpact;
}

export interface PackInstallPreview {
  pack: SolutionPack;
  alreadyInstalled: boolean;
  canInstall: boolean;
  blockers: PackValidationFailure[];
  impact: PackInstallImpact;
}

export interface PackInstallResult {
  installedPack: TenantInstalledPack;
  impact: PackInstallImpact;
  knowledgeEntryIds: string[];
  missionFeedItemIds: string[];
  durationMs: number;
}

export interface PackUninstallResult {
  uninstalledPackId: string;
  packSlug: string;
  knowledgeEntriesDeleted: number;
  missionFeedItemsDismissed: number;
  widgetsUnregistered: number;
  aiActionsUnregistered: number;
  durationMs: number;
}

export interface PackInstallationLogEntry {
  id: string;
  tenantId: string;
  solutionPackId: string;
  action: string;
  success: boolean;
  errorMessage: string | null;
  performedById: string | null;
  performedAt: string;
}

export interface SolutionPacksFilters {
  category?: SolutionPackCategory;
  status?: SolutionPackStatus;
  tierRequired?: PackTierRequired;
  q?: string;
  installedOnly?: boolean;
}

// ─── RestClient lazy import (avoids circular deps in tests) ───────────

async function getRestClient() {
  const mod = await import('@/infrastructure/api/RestClient');
  return mod.restClient;
}

// ─── Reads ────────────────────────────────────────────────────────────

export function useSolutionPacks(
  tenantId: string | undefined,
  filters: SolutionPacksFilters = {},
): UseQueryResult<SolutionPack[]> {
  return useQuery({
    queryKey: queryKeys.solutionPacks.list(tenantId ?? '_', filters as Record<string, unknown>),
    queryFn: async ({ signal }) => {
      const restClient = await getRestClient();
      return restClient.get<SolutionPack[]>(API_ENDPOINTS.solutionPacks.list, {
        signal,
        params: filters as Record<string, string | number | boolean | undefined>,
      });
    },
    enabled: !!tenantId,
    staleTime: 60_000,
  });
}

export function useSolutionPack(
  tenantId: string | undefined,
  slug: string | undefined,
): UseQueryResult<SolutionPack> {
  return useQuery({
    queryKey: queryKeys.solutionPacks.detail(tenantId ?? '_', slug ?? '_'),
    queryFn: async ({ signal }) => {
      const restClient = await getRestClient();
      return restClient.get<SolutionPack>(API_ENDPOINTS.solutionPacks.detail(slug!), { signal });
    },
    enabled: !!tenantId && !!slug,
    staleTime: 60_000,
  });
}

export function useSolutionPackPreview(
  tenantId: string | undefined,
  slug: string | undefined,
): UseQueryResult<PackInstallPreview> {
  return useQuery({
    queryKey: queryKeys.solutionPacks.preview(tenantId ?? '_', slug ?? '_'),
    queryFn: async ({ signal }) => {
      const restClient = await getRestClient();
      return restClient.get<PackInstallPreview>(API_ENDPOINTS.solutionPacks.preview(slug!), {
        signal,
      });
    },
    enabled: !!tenantId && !!slug,
    staleTime: 30_000,
  });
}

export function useInstalledPacks(
  tenantId: string | undefined,
): UseQueryResult<TenantInstalledPack[]> {
  return useQuery({
    queryKey: queryKeys.solutionPacks.installed(tenantId ?? '_'),
    queryFn: async ({ signal }) => {
      const restClient = await getRestClient();
      return restClient.get<TenantInstalledPack[]>(API_ENDPOINTS.solutionPacks.installed, {
        signal,
      });
    },
    enabled: !!tenantId,
    staleTime: 30_000,
  });
}

export function usePackInstallHistory(
  tenantId: string | undefined,
  limit = 50,
): UseQueryResult<PackInstallationLogEntry[]> {
  return useQuery({
    queryKey: queryKeys.solutionPacks.history(tenantId ?? '_'),
    queryFn: async ({ signal }) => {
      const restClient = await getRestClient();
      return restClient.get<PackInstallationLogEntry[]>(API_ENDPOINTS.solutionPacks.history, {
        signal,
        params: { limit },
      });
    },
    enabled: !!tenantId,
    staleTime: 30_000,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────

export function useInstallSolutionPack(
  tenantId: string | undefined,
): UseMutationResult<
  PackInstallResult,
  { message?: string; failures?: PackValidationFailure[] },
  { slug: string; acceptWarnings?: boolean; idempotencyKey?: string }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input) => {
      const restClient = await getRestClient();
      return restClient.post<PackInstallResult>(
        API_ENDPOINTS.solutionPacks.install(input.slug),
        {
          acceptWarnings: input.acceptWarnings,
          idempotencyKey: input.idempotencyKey,
        },
      );
    },
    onSuccess: () => {
      if (!tenantId) return;
      void qc.invalidateQueries({ queryKey: queryKeys.solutionPacks.all(tenantId) });
      void qc.invalidateQueries({ queryKey: queryKeys.marketplace.all(tenantId) });
      void qc.invalidateQueries({ queryKey: queryKeys.missionFeed.all(tenantId) });
      void qc.invalidateQueries({ queryKey: queryKeys.knowledge.all(tenantId) });
    },
  });
}

export function useUninstallSolutionPack(
  tenantId: string | undefined,
): UseMutationResult<
  PackUninstallResult,
  { message?: string },
  { slug: string }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input) => {
      const restClient = await getRestClient();
      return restClient.delete<PackUninstallResult>(
        API_ENDPOINTS.solutionPacks.uninstall(input.slug),
      );
    },
    onSuccess: () => {
      if (!tenantId) return;
      void qc.invalidateQueries({ queryKey: queryKeys.solutionPacks.all(tenantId) });
      void qc.invalidateQueries({ queryKey: queryKeys.marketplace.all(tenantId) });
      void qc.invalidateQueries({ queryKey: queryKeys.knowledge.all(tenantId) });
    },
  });
}