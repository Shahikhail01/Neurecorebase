/**
 * Knowledge hooks — barrel exports.
 *
 * Phase 6 (per EAOS-implementation-plan.md §9.7 + EAOS-frontend-data-layer.md §3.4).
 */

export {
  // Types
  KNOWLEDGE_TYPES,
  // Reads
  useKnowledgeList,
  useKnowledgeEntry,
  useKnowledgeSearch,
  useKnowledgeCitations,
  // Mutations
  useCreateKnowledge,
  useUpdateKnowledge,
  useDeleteKnowledge,
  useRagAsk,
  useStreamRagAsk,
} from './useKnowledgeSearch';

export type {
  KnowledgeType,
  KnowledgeStatus,
  KnowledgeEntry,
  KnowledgeSearchHit,
  KnowledgeSearchResponse,
  KnowledgeCitation,
  RagAskInput,
  RagAnswer,
  RagCitationUsage,
  RagStreamEvent,
  CreateKnowledgeInput,
  UpdateKnowledgeInput,
  KnowledgeListFilters,
} from './useKnowledgeSearch';