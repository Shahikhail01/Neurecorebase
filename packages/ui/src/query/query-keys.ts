export const queryKeys = {
  entity: {
    all: (tenantId: string) => ['entity', tenantId] as const,
    workspace: (type: string, id: string) =>
      ['entity', type, id, 'workspace'] as const,
    identity: (type: string, id: string) =>
      ['entity', type, id, 'identity'] as const,
    context: (type: string, id: string) =>
      ['entity', type, id, 'context'] as const,
    intelligence: (type: string, id: string) =>
      ['entity', type, id, 'intelligence'] as const,
    operations: (type: string, id: string) =>
      ['entity', type, id, 'operations'] as const,
    resources: (type: string, id: string) =>
      ['entity', type, id, 'resources'] as const,
    collaboration: (type: string, id: string) =>
      ['entity', type, id, 'collaboration'] as const,
    insights: (type: string, id: string) =>
      ['entity', type, id, 'insights'] as const,
    automation: (type: string, id: string) =>
      ['entity', type, id, 'automation'] as const,
    activity: (type: string, id: string) =>
      ['entity', type, id, 'activity'] as const,
    lifecycle: (type: string, id: string) =>
      ['entity', type, id, 'lifecycle'] as const,
    graph: (type: string, id: string) =>
      ['entity', type, id, 'graph'] as const,
  },
  aiActions: {
    available: (entityType?: string) =>
      ['ai-actions', 'available', entityType ?? '*'] as const,
    detail: (id: string) => ['ai-actions', 'invocation', id] as const,
  },
  missionFeed: {
    all: (tenantId: string) => ['mission-feed', tenantId] as const,
    list: (tenantId: string) => ['mission-feed', tenantId, 'list'] as const,
  },
  aiRoster: {
    all: (tenantId: string) => ['ai-roster', tenantId] as const,
    list: (tenantId: string, filters?: Record<string, unknown>) =>
      ['ai-roster', tenantId, 'list', filters] as const,
  },
  agents: {
    all: (tenantId: string) => ['agents', tenantId] as const,
    list: (tenantId: string, filters?: Record<string, unknown>) =>
      ['agents', tenantId, 'list', filters] as const,
    detail: (id: string) => ['agents', id] as const,
  },
  departments: {
    all: (tenantId: string) => ['departments', tenantId] as const,
    list: (tenantId: string, filters?: Record<string, unknown>) =>
      ['departments', tenantId, 'list', filters] as const,
    detail: (id: string) => ['departments', id] as const,
  },
  projects: {
    all: (tenantId: string) => ['projects', tenantId] as const,
    list: (tenantId: string, filters?: Record<string, unknown>) =>
      ['projects', tenantId, 'list', filters] as const,
    detail: (id: string) => ['projects', id] as const,
  },
  goals: {
    all: (tenantId: string) => ['goals', tenantId] as const,
    list: (tenantId: string, filters?: Record<string, unknown>) =>
      ['goals', tenantId, 'list', filters] as const,
    detail: (id: string) => ['goals', id] as const,
  },
  tasks: {
    all: (tenantId: string) => ['tasks', tenantId] as const,
    list: (tenantId: string, filters?: Record<string, unknown>) =>
      ['tasks', tenantId, 'list', filters] as const,
    detail: (id: string) => ['tasks', id] as const,
  },
  users: {
    all: (tenantId: string) => ['users', tenantId] as const,
    list: (tenantId: string) => ['users', tenantId, 'list'] as const,
    detail: (id: string) => ['users', id] as const,
  },
  tenants: {
    all: () => ['tenants'] as const,
    list: () => ['tenants', 'list'] as const,
    detail: (id: string) => ['tenants', id] as const,
    current: () => ['tenants', 'current'] as const,
  },
  audit: {
    all: (tenantId: string) => ['audit', tenantId] as const,
    list: (tenantId: string, filters?: Record<string, unknown>) =>
      ['audit', tenantId, 'list', filters] as const,
  },
  knowledge: {
    all: (tenantId: string) => ['knowledge', tenantId] as const,
    list: (tenantId: string, filters?: Record<string, unknown>) =>
      ['knowledge', tenantId, 'list', filters] as const,
    detail: (tenantId: string, id: string) =>
      ['knowledge', tenantId, 'detail', id] as const,
    search: (tenantId: string, query: string) =>
      ['knowledge', tenantId, 'search', query] as const,
    citations: (tenantId: string, entryId: string) =>
      ['knowledge', tenantId, 'citations', entryId] as const,
  },
  solutionPacks: {
    all: (tenantId: string) => ['solution-packs', tenantId] as const,
    list: (tenantId: string, filters?: Record<string, unknown>) =>
      ['solution-packs', tenantId, 'list', filters] as const,
    detail: (tenantId: string, slug: string) =>
      ['solution-packs', tenantId, 'detail', slug] as const,
    preview: (tenantId: string, slug: string) =>
      ['solution-packs', tenantId, 'preview', slug] as const,
    installed: (tenantId: string) =>
      ['solution-packs', tenantId, 'installed'] as const,
    history: (tenantId: string) =>
      ['solution-packs', tenantId, 'history'] as const,
  },
  marketplace: {
    all: (tenantId: string) => ['marketplace', tenantId] as const,
    tabs: (tenantId: string) => ['marketplace', tenantId, 'tabs'] as const,
    items: (tenantId: string, tab: string, q?: string) =>
      ['marketplace', tenantId, 'items', tab, q ?? ''] as const,
  },
  retail: {
    all: (tenantId: string) => ['retail', tenantId] as const,
    actions: (tenantId: string) => ['retail', tenantId, 'actions'] as const,
    widgets: (tenantId: string) => ['retail', tenantId, 'widgets'] as const,
    widgetValue: (
      tenantId: string,
      widgetId: string,
      entityType: string,
      entityId: string,
      params?: Record<string, unknown>,
    ) =>
      [
        'retail',
        tenantId,
        'widget',
        widgetId,
        entityType,
        entityId,
        params ?? {},
      ] as const,
  },
} as const;
