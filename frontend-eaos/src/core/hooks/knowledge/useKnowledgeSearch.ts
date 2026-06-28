/**
 * Knowledge hooks — TanStack Query + mutations for the Knowledge Hub.
 *
 * Phase 6, Tasks 6.5 + 6.7 (per EAOS-api-contract.md §8.17 +
 * EAOS-frontend-data-layer.md §3.4).
 *
 * Exports:
 *   useKnowledgeList          → GET    /knowledge
 *   useKnowledgeEntry         → GET    /knowledge/{id}
 *   useKnowledgeSearch        → GET    /knowledge/search
 *   useRagAsk                 → POST   /knowledge/rag-ask (blocking)
 *   useStreamRagAsk           → POST   /knowledge/rag-ask/stream (SSE)
 *   useKnowledgeCitations     → GET    /knowledge/{id}/citations
 *   useCreateKnowledge        → POST   /knowledge
 *   useUpdateKnowledge        → PATCH  /knowledge/{id}
 *   useDeleteKnowledge        → DELETE /knowledge/{id}
 *
 * SOLID:
 *   - SRP — each hook owns one query or mutation.
 *   - OCP — adding new knowledge mutations (e.g. useArchiveKnowledge) is
 *     a one-line addition that mirrors an existing hook.
 *   - DIP — hooks depend on the OpenAPI types + @neurecore/ui tokens,
 *     not on raw fetch.
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
import type { PaginatedResponse } from '@neurecore/ui/types';
import { restClient } from '@/infrastructure/api/RestClient';
import { QUERY_STALE_TIMES } from '@/config/query-stale-times';

// ─── Types (mirror backend KnowledgeEntryResponseDto + search DTOs) ────

export type KnowledgeType =
  | 'POLICY'
  | 'SOP'
  | 'PLAYBOOK'
  | 'TEMPLATE'
  | 'PROMPT'
  | 'REGULATION'
  | 'CONTRACT'
  | 'REPORT'
  | 'DOCUMENTATION'
  | 'FAQ'
  | 'GUIDE'
  | 'BRIEFING';

export const KNOWLEDGE_TYPES: KnowledgeType[] = [
  'POLICY',
  'SOP',
  'PLAYBOOK',
  'TEMPLATE',
  'PROMPT',
  'REGULATION',
  'CONTRACT',
  'REPORT',
  'DOCUMENTATION',
  'FAQ',
  'GUIDE',
  'BRIEFING',
];

export type KnowledgeStatus = 'draft' | 'published' | 'archived';

export interface KnowledgeEntry {
  id: string;
  tenantId: string;
  type: KnowledgeType;
  title: string;
  content: string;
  tags: string[];
  departmentId?: string;
  entityTypes: string[];
  source: string;
  sourceUrl?: string;
  authorId?: string;
  status: KnowledgeStatus;
  version: string;
  language: string;
  chunkCount: number;
  retrievalCount: number;
  lastRetrievedAt?: string;
  effectiveFrom: string;
  effectiveTo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeSearchHit {
  id: string;
  title: string;
  type: KnowledgeType;
  excerpt: string;
  relevanceScore: number;
  highlights?: string[];
  departmentId?: string;
  tags?: string[];
}

export interface KnowledgeSearchResponse {
  results: KnowledgeSearchHit[];
  took: number;
  query: string;
}

export interface KnowledgeCitation {
  knowledgeEntryId: string;
  label: string;
  span: string;
  confidence: number;
  chunkIndex: number;
}

export interface RagAskInput {
  question: string;
  contextEntityType?: string;
  contextEntityId?: string;
  types?: KnowledgeType[];
  tags?: string[];
  departmentId?: string;
  topK?: number;
  maxContextTokens?: number;
}

export interface RagAnswer {
  answer: string;
  citations: KnowledgeCitation[];
  model: string;
  tokensUsed: { input: number; output: number; total: number };
  confidence: number;
  durationMs: number;
}

export interface RagCitationUsage {
  invocationId: string;
  knowledgeEntryId: string;
  question: string;
  score: number;
  createdAt: string;
}

export type RagStreamEvent =
  | { type: 'start'; citations: KnowledgeCitation[] }
  | { type: 'delta'; text: string }
  | { type: 'done'; citations?: KnowledgeCitation[]; tokensUsed?: { input: number; output: number; total: number }; durationMs?: number }
  | { type: 'error'; message: string };

export interface CreateKnowledgeInput {
  type: KnowledgeType;
  title: string;
  content: string;
  tags?: string[];
  departmentId?: string;
  entityTypes?: string[];
  sourceUrl?: string;
  status?: KnowledgeStatus;
  language?: string;
}

export type UpdateKnowledgeInput = Partial<CreateKnowledgeInput>;

export interface KnowledgeListFilters {
  page?: number;
  limit?: number;
  type?: KnowledgeType;
  status?: KnowledgeStatus;
  departmentId?: string;
  tags?: string;
}

// ─── Reads ────────────────────────────────────────────────────────────

export function useKnowledgeList(
  tenantId: string | undefined,
  filters: KnowledgeListFilters = {},
): UseQueryResult<PaginatedResponse<KnowledgeEntry>> {
  return useQuery({
    queryKey: queryKeys.knowledge.list(tenantId ?? '_', filters as Record<string, unknown>),
    queryFn: ({ signal }) =>
      restClient.get<PaginatedResponse<KnowledgeEntry>>(
        API_ENDPOINTS.knowledge.list,
        { signal, params: filters as Record<string, string | number | boolean | undefined> },
      ),
    staleTime: QUERY_STALE_TIMES.KNOWLEDGE_SEARCH,
    enabled: !!tenantId,
  });
}

export function useKnowledgeEntry(
  tenantId: string | undefined,
  entryId: string | undefined,
): UseQueryResult<KnowledgeEntry> {
  return useQuery({
    queryKey: queryKeys.knowledge.detail(tenantId ?? '_', entryId ?? '_'),
    queryFn: ({ signal }) =>
      restClient.get<KnowledgeEntry>(
        API_ENDPOINTS.knowledge.detail(entryId!),
        { signal },
      ),
    staleTime: QUERY_STALE_TIMES.KNOWLEDGE_SEARCH,
    enabled: !!tenantId && !!entryId,
  });
}

export function useKnowledgeSearch(
  tenantId: string | undefined,
  query: string,
  filters: Omit<KnowledgeListFilters, 'page' | 'limit'> & { limit?: number; vectorWeight?: number } = {},
): UseQueryResult<KnowledgeSearchResponse> {
  return useQuery({
    queryKey: queryKeys.knowledge.search(tenantId ?? '_', query),
    queryFn: ({ signal }) =>
      restClient.get<KnowledgeSearchResponse>(
        API_ENDPOINTS.knowledge.search,
        {
          signal,
          params: { query, ...filters },
        },
      ),
    staleTime: QUERY_STALE_TIMES.KNOWLEDGE_SEARCH,
    enabled: !!tenantId && query.trim().length > 0,
  });
}

export function useKnowledgeCitations(
  tenantId: string | undefined,
  entryId: string | undefined,
): UseQueryResult<{ items: RagCitationUsage[] }> {
  return useQuery({
    queryKey: queryKeys.knowledge.citations(tenantId ?? '_', entryId ?? '_'),
    queryFn: ({ signal }) =>
      restClient.get<{ items: RagCitationUsage[] }>(
        API_ENDPOINTS.knowledge.citations(entryId!),
        { signal },
      ),
    enabled: !!tenantId && !!entryId,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────

export function useCreateKnowledge(
  tenantId: string | undefined,
): UseMutationResult<KnowledgeEntry, Error, CreateKnowledgeInput> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateKnowledgeInput) =>
      restClient.post<KnowledgeEntry>(API_ENDPOINTS.knowledge.create, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.knowledge.all(tenantId ?? '_') });
    },
  });
}

export function useUpdateKnowledge(
  tenantId: string | undefined,
): UseMutationResult<KnowledgeEntry, Error, { id: string; data: UpdateKnowledgeInput }> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) =>
      restClient.patch<KnowledgeEntry>(API_ENDPOINTS.knowledge.update(id), data),
    onSuccess: (entry) => {
      qc.invalidateQueries({ queryKey: queryKeys.knowledge.all(tenantId ?? '_') });
      qc.setQueryData(queryKeys.knowledge.detail(tenantId ?? '_', entry.id), entry);
    },
  });
}

export function useDeleteKnowledge(
  tenantId: string | undefined,
): UseMutationResult<void, Error, string> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      restClient.delete<void>(API_ENDPOINTS.knowledge.delete(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.knowledge.all(tenantId ?? '_') });
    },
  });
}

export function useRagAsk(
  tenantId: string | undefined,
): UseMutationResult<RagAnswer, Error, RagAskInput> {
  return useMutation({
    mutationFn: (input: RagAskInput) =>
      restClient.post<RagAnswer>(API_ENDPOINTS.knowledge.ragAsk, input),
  });
}

/**
 * Streaming RAG via SSE — yields typed events.
 *
 * Usage:
 *   const { start, cancel } = useStreamRagAsk(tenantId);
 *   start({ question: '…' }, {
 *     onStart: (citations) => …,
 *     onDelta: (text) => …,
 *     onDone: (citations, tokens, durationMs) => …,
 *     onError: (msg) => …,
 *   });
 */
export function useStreamRagAsk(tenantId: string | undefined) {
  let abort: AbortController | null = null;

  return {
    start: async (
      input: RagAskInput,
      handlers: {
        onStart?: (citations: KnowledgeCitation[]) => void;
        onDelta?: (text: string) => void;
        onDone?: (
          citations: KnowledgeCitation[] | undefined,
          tokens: { input: number; output: number; total: number } | undefined,
          durationMs?: number,
        ) => void;
        onError?: (message: string) => void;
      },
    ): Promise<void> => {
      abort?.abort();
      abort = new AbortController();
      const url = API_ENDPOINTS.knowledge.ragAskStream;

      let resp: Response;
      try {
        resp = await fetch(url, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
            'X-Tenant-ID': tenantId ?? '',
          },
          body: JSON.stringify(input),
          signal: abort.signal,
        });
      } catch (err) {
        handlers.onError?.(err instanceof Error ? err.message : String(err));
        return;
      }

      if (!resp.ok || !resp.body) {
        handlers.onError?.(`HTTP ${resp.status}`);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      const processEvent = (eventName: string, data: string) => {
        try {
          const parsed = JSON.parse(data) as RagStreamEvent;
          switch (parsed.type) {
            case 'start':
              handlers.onStart?.(parsed.citations);
              return;
            case 'delta':
              handlers.onDelta?.(parsed.text);
              return;
            case 'done':
              handlers.onDone?.(parsed.citations, parsed.tokensUsed, parsed.durationMs);
              return;
            case 'error':
              handlers.onError?.(parsed.message);
              return;
          }
          // Backwards-compat — backend sends `done` event with the event
          // name `done` but the JSON may not carry `type`.
          void eventName;
        } catch {
          /* ignore */
        }
      };

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });

          let sep: number;
          while ((sep = buf.indexOf('\n\n')) !== -1) {
            const block = buf.slice(0, sep);
            buf = buf.slice(sep + 2);
            let ev: string | null = null;
            let data = '';
            for (const line of block.split('\n')) {
              if (line.startsWith('event: ')) ev = line.slice(7).trim();
              else if (line.startsWith('data: ')) data += line.slice(6);
            }
            if (ev && data) processEvent(ev, data);
          }
        }
      } catch (err) {
        handlers.onError?.(err instanceof Error ? err.message : String(err));
      }
    },

    cancel: (): void => {
      abort?.abort();
      abort = null;
    },
  };
}