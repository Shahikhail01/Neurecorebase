export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    me: '/auth/me',
  },
  entity: {
    BASE: (type: string, id: string) => `/entities/${type}/${id}`,
    WORKSPACE_SUMMARY: (type: string, id: string) =>
      `/entities/${type}/${id}/workspace/summary`,
    IDENTITY: (type: string, id: string) =>
      `/entities/${type}/${id}/identity`,
    CONTEXT: (type: string, id: string) =>
      `/entities/${type}/${id}/context`,
    INTELLIGENCE: (type: string, id: string) =>
      `/entities/${type}/${id}/intelligence`,
    OPERATIONS: (type: string, id: string) =>
      `/entities/${type}/${id}/operations`,
    RESOURCES: (type: string, id: string) =>
      `/entities/${type}/${id}/resources`,
    COLLABORATION: (type: string, id: string) =>
      `/entities/${type}/${id}/collaboration`,
    INSIGHTS: (type: string, id: string) =>
      `/entities/${type}/${id}/insights`,
    AUTOMATION: (type: string, id: string) =>
      `/entities/${type}/${id}/automation`,
    ACTIVITY: (type: string, id: string) =>
      `/entities/${type}/${id}/activity`,
    LIFECYCLE: (type: string, id: string) =>
      `/entities/${type}/${id}/lifecycle`,
    LIFECYCLE_TRANSITION: (type: string, id: string) =>
      `/entities/${type}/${id}/lifecycle/transition`,
    LIFECYCLE_HISTORY: (type: string, id: string) =>
      `/entities/${type}/${id}/lifecycle/history`,
    LIFECYCLE_WHY_NOT_ACTIVE: (type: string, id: string) =>
      `/entities/${type}/${id}/lifecycle/why-not-active`,
    GRAPH: (type: string, id: string) =>
      `/entities/${type}/${id}/graph`,
    LABELS: (type: string, id: string) =>
      `/entities/${type}/${id}/labels`,
    LABEL: (type: string, id: string, labelId: string) =>
      `/entities/${type}/${id}/labels/${labelId}`,
    FAVORITE: (type: string, id: string) =>
      `/entities/${type}/${id}/favorite`,
    WATCH: (type: string, id: string) =>
      `/entities/${type}/${id}/watch`,
    HEALTH: (type: string, id: string) => `/entities/${type}/${id}/health`,
  },
  agents: {
    list: '/agents',
    detail: (id: string) => `/agents/${id}`,
    create: '/agents',
    update: (id: string) => `/agents/${id}`,
    delete: (id: string) => `/agents/${id}`,
    pause: (id: string) => `/agents/${id}/pause`,
    resume: (id: string) => `/agents/${id}/resume`,
    archive: (id: string) => `/agents/${id}/archive`,
    restore: (id: string) => `/agents/${id}/restore`,
    dispatch: (id: string) => `/agents/${id}/dispatch`,
    dispatchTask: (id: string) => `/agents/${id}/dispatch-task`,
    cancel: (id: string) => `/agents/${id}/cancel`,
    streaming: {
      sessions: (id: string) => `/agents/streaming/sessions/${id}`,
      events: (id: string) => `/agents/streaming/sessions/${id}/events`,
    },
  },
  departments: {
    list: '/departments',
    detail: (id: string) => `/departments/${id}`,
    create: '/departments',
    update: (id: string) => `/departments/${id}`,
    delete: (id: string) => `/departments/${id}`,
    members: (id: string) => `/departments/${id}/members`,
    addMember: (id: string) => `/departments/${id}/members`,
    removeMember: (id: string, userId: string) =>
      `/departments/${id}/members/${userId}`,
  },
  projects: {
    list: '/projects',
    detail: (id: string) => `/projects/${id}`,
    create: '/projects',
    update: (id: string) => `/projects/${id}`,
    delete: (id: string) => `/projects/${id}`,
    addGoal: (id: string) => `/projects/${id}/goals`,
  },
  goals: {
    list: '/goals',
    detail: (id: string) => `/goals/${id}`,
    create: '/goals',
    update: (id: string) => `/goals/${id}`,
    delete: (id: string) => `/goals/${id}`,
  },
  tasks: {
    list: '/tasks',
    detail: (id: string) => `/tasks/${id}`,
    create: '/tasks',
    update: (id: string) => `/tasks/${id}`,
    delete: (id: string) => `/tasks/${id}`,
    assign: (id: string) => `/tasks/${id}/assign`,
    delegate: (id: string) => `/tasks/${id}/delegate`,
  },
  users: {
    list: '/users',
    detail: (id: string) => `/users/${id}`,
    create: '/users',
    update: (id: string) => `/users/${id}`,
    deactivate: (id: string) => `/users/${id}/deactivate`,
    assignDepartment: (id: string) => `/users/${id}/assign-department`,
    unassignDepartment: (id: string) => `/users/${id}/unassign-department`,
  },
  tenants: {
    list: '/tenants',
    detail: (id: string) => `/tenants/${id}`,
    create: '/tenants',
    update: (id: string) => `/tenants/${id}`,
    suspend: (id: string) => `/tenants/${id}/suspend`,
    changeTier: (id: string) => `/tenants/${id}/change-tier`,
    current: '/tenants/me/current',
  },
  routines: {
    list: '/routines',
    listRuns: (id: string) => `/routines/${id}/runs`,
    listAllRuns: '/routines/all-runs',
    detail: (id: string) => `/routines/${id}`,
    create: '/routines',
    update: (id: string) => `/routines/${id}`,
    delete: (id: string) => `/routines/${id}`,
    execute: (id: string) => `/routines/${id}/execute`,
    activate: (id: string) => `/routines/${id}/activate`,
    pause: (id: string) => `/routines/${id}/pause`,
    cancelRun: (id: string, runId: string) =>
      `/routines/${id}/runs/${runId}/cancel`,
    resumeRun: (id: string, runId: string) =>
      `/routines/${id}/runs/${runId}/resume`,
    handleWebhook: (id: string, webhookId: string) =>
      `/routines/${id}/webhooks/${webhookId}`,
  },
  workflows: {
    list: '/workflows',
    detail: (id: string) => `/workflows/${id}`,
    create: '/workflows',
    update: (id: string) => `/workflows/${id}`,
    delete: (id: string) => `/workflows/${id}`,
    execute: (id: string) => `/workflows/${id}/execute`,
  },
  audit: {
    list: '/audit-logs',
    tenant: (tenantId: string) => `/audit-logs/tenant/${tenantId}`,
    byAgent: (agentId: string) => `/audit-logs/agent/${agentId}`,
  },
  costs: {
    tenant: '/costs/tenant',
    detail: (id: string) => `/costs/${id}`,
  },
  finance: {
    invoices: '/finance/invoices',
    invoice: (id: string) => `/finance/invoices/${id}`,
    markPaid: (id: string) => `/finance/invoices/${id}/mark-paid`,
    expenses: '/finance/expenses',
    expense: (id: string) => `/finance/expenses/${id}`,
    billing: '/finance/billing',
  },
  integrations: {
    list: '/integrations',
    detail: (id: string) => `/integrations/${id}`,
    connect: (providerId: string) => `/integrations/${providerId}/connect`,
    disconnect: (id: string) => `/integrations/${id}/disconnect`,
  },
  connectors: {
    list: '/connectors',
    detail: (id: string) => `/connectors/${id}`,
    authorize: (id: string) => `/connectors/${id}/authorize`,
    callback: (id: string) => `/connectors/${id}/callback`,
  },
  notifications: {
    list: '/notifications',
    detail: (id: string) => `/notifications/${id}`,
    markRead: (id: string) => `/notifications/${id}/read`,
    markAllRead: '/notifications/read-all',
  },
  inbox: {
    list: '/inbox',
    detail: (id: string) => `/inbox/${id}`,
    update: (id: string) => `/inbox/${id}`,
  },
  aiActions: {
    execute: '/ai-actions/execute',
    detail: (id: string) => `/ai-actions/${id}`,
    stream: (id: string) => `/ai-actions/${id}/stream`,
  },
  missionFeed: {
    list: '/mission-feed',
    dismiss: (id: string) => `/mission-feed/${id}/dismiss`,
  },
  aiRoster: {
    list: '/ai-roster',
    pause: (id: string) => `/ai-roster/${id}/pause`,
  },
  knowledge: {
    list: '/knowledge',
    detail: (id: string) => `/knowledge/${id}`,
    create: '/knowledge',
    update: (id: string) => `/knowledge/${id}`,
    delete: (id: string) => `/knowledge/${id}`,
    search: '/knowledge/search',
    ragAsk: '/knowledge/rag-ask',
    ragAskStream: '/knowledge/rag-ask/stream',
    citations: (id: string) => `/knowledge/${id}/citations`,
  },
  solutionPacks: {
    list: '/solution-packs',
    detail: (slug: string) => `/solution-packs/${slug}`,
    preview: (slug: string) => `/solution-packs/${slug}/preview`,
    install: (slug: string) => `/solution-packs/${slug}/install`,
    uninstall: (slug: string) => `/solution-packs/${slug}`,
    installed: '/solution-packs/installed',
    history: '/solution-packs/installed/history',
  },
  marketplace: {
    tabs: '/marketplace/tabs',
    items: '/marketplace/items',
    packs: '/marketplace/packs',
    packDetail: (slug: string) => `/marketplace/packs/${slug}`,
    agentTemplates: '/marketplace/agent-templates',
    connectors: '/marketplace/connectors',
    workflows: '/marketplace/workflows',
    knowledgePacks: '/marketplace/knowledge-packs',
    docsJson: '/marketplace/docs-json',
  },
  retail: {
    actions: '/retail/actions',
    widgets: '/retail/widgets',
    computeWidget: (id: string) => `/retail/widgets/${id}/compute`,
    executeAction: (id: string) => `/retail/actions/${id}/execute`,
    syncShopify: '/retail/integrations/shopify/sync',
    syncSquare: '/retail/integrations/square/sync',
  },
} as const;

export type API_ENDPOINTS = typeof API_ENDPOINTS;
