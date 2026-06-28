export const EAOS_ENTITY_TYPES = [
  'DEPARTMENT',
  'AGENT',
  'USER',
  'PROJECT',
  'GOAL',
  'TASK',
  'WORKFLOW',
  'ROUTINE',
  'TOOL_INTEGRATION',
  'EXPENSE',
  'INVOICE',
  'KNOWLEDGE_ENTRY',
  'TEMPLATE',
] as const;

export type EaosEntityType = (typeof EAOS_ENTITY_TYPES)[number];