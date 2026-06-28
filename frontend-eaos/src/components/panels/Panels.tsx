'use client';

import {
  EmptyState,
  LoadingState,
  ErrorState,
} from '@neurecore/ui';
import { restClient } from '@/infrastructure/api/RestClient';
import { API_ENDPOINTS } from '@neurecore/ui/endpoints';
import { queryKeys } from '@neurecore/ui/query';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  EntityType,
  IdentityPanel as NewIdentityPanel,
  ContextPanel,
  IntelligencePanel as NewIntelligencePanel,
  OperationsPanel,
  ResourcesPanel,
  CollaborationPanel,
  InsightsPanel,
  AutomationPanel,
  MiniGraph,
  LifecyclePanel as NewLifecyclePanel,
  LifecycleState,
} from '@neurecore/ui/types';
import type { PaginatedResponse } from '@neurecore/ui/types';
import type { ActivityEvent } from '@/core/hooks/entity/entity.types';
import { AvatarMemberCard } from './AvatarMemberCard';
import { StreamingIntelligencePanel } from './StreamingIntelligencePanel';
import { AutomationQuickFire } from './AutomationQuickFire';
import { useState } from 'react';

// ─── Shared query helpers ────────────────────────────────────────────────

function useEntityPanel<T>(key: readonly unknown[], path: string) {
  return useQuery({
    queryKey: key,
    queryFn: ({ signal }) => restClient.get<T>(path, { signal }),
  });
}

// ─── Identity Panel ─────────────────────────────────────────────────────

export function IdentityPanelComponent({
  type,
  id,
}: {
  type: EntityType;
  id: string;
}) {
  const { data, isLoading, error, refetch } = useEntityPanel<NewIdentityPanel>(
    queryKeys.entity.identity(type, id),
    API_ENDPOINTS.entity.IDENTITY(type, id),
  );
  if (isLoading) return <LoadingState label="Loading identity..." />;
  if (error || !data) return <ErrorState error={error as Error} onRetry={refetch} />;

  const stateColor =
    data.state === 'ACTIVE'
      ? 'text-state-success'
      : data.state === 'SUSPENDED' || data.state === 'DELETED'
        ? 'text-state-error'
        : 'text-state-warning';

  return (
    <div className="space-y-4 p-6">
      <div>
        <h2 className="text-2xl font-semibold text-canvas-900 dark:text-canvas-50">
          {data.name}
        </h2>
        {data.description && (
          <p className="mt-1 text-sm text-canvas-600 dark:text-canvas-400">
            {data.description}
          </p>
        )}
      </div>
      <div className="flex flex-wrap gap-3 text-xs">
        <span className={`font-mono uppercase tracking-wider ${stateColor}`}>
          ● {data.state}
        </span>
        {data.subState && (
          <span className="text-canvas-500 dark:text-canvas-400">
            {data.subState}
          </span>
        )}
        <span className="text-canvas-500 dark:text-canvas-400">
          Health: {data.health.severity} ({data.health.score}%)
        </span>
      </div>
      {data.labels.length === 0 ? (
        <EmptyState variant="noData" title="No labels" description="Add labels to organize this entity." />
      ) : (
        <div className="flex flex-wrap gap-2">
          {data.labels.map((l, i: number) => (
            <span
              key={i}
              className="rounded-md border border-canvas-200 bg-canvas-100 px-2 py-1 text-xs dark:border-canvas-700 dark:bg-canvas-800"
              style={l.color ? { borderColor: l.color } : undefined}
            >
              {l.key}: {l.value}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Context Panel ──────────────────────────────────────────────────────

export function ContextPanelComponent({
  type,
  id,
}: {
  type: EntityType;
  id: string;
}) {
  const { data, isLoading, error, refetch } = useEntityPanel<ContextPanel>(
    queryKeys.entity.context(type, id),
    API_ENDPOINTS.entity.CONTEXT(type, id),
  );
  if (isLoading) return <LoadingState label="Loading context..." />;
  if (error || !data) return <ErrorState error={error as Error} onRetry={refetch} />;

  return (
    <div className="space-y-4 p-6">
      <h3 className="text-lg font-semibold text-canvas-900 dark:text-canvas-50">
        Context
      </h3>
      {data.relationships.length === 0 ? (
        <EmptyState variant="noData" title="No relationships" />
      ) : (
        <ul className="space-y-2">
          {data.relationships.map((r, i: number) => (
            <li
              key={i}
              className="flex items-center gap-2 text-sm text-canvas-700 dark:text-canvas-300"
            >
              <span className="font-mono text-xs uppercase text-canvas-500">
                {r.direction} · {r.type}
              </span>
              <span className="font-mono text-xs text-canvas-400">
                {r.other.type}/{r.other.id.slice(0, 8)}
              </span>
            </li>
          ))}
        </ul>
      )}
      {data.industry && (
        <p className="text-sm text-canvas-500">Industry: {data.industry}</p>
      )}
      {data.departmentType && (
        <p className="text-sm text-canvas-500">Department type: {data.departmentType}</p>
      )}
    </div>
  );
}

// ─── Intelligence Panel ─────────────────────────────────────────────────

/**
 * Phase 5, Task 5.6: IntelligencePanel now streams via SSE.
 * `StreamingIntelligencePanel` keeps the static cached summary as a
 * fallback and overlays live deltas + citations on top.
 */
export function IntelligencePanelComponent({
  type,
  id,
}: {
  type: EntityType;
  id: string;
}) {
  return <StreamingIntelligencePanel type={type} id={id} />;
}

// ─── Operations Panel ───────────────────────────────────────────────────

export function OperationsPanelComponent({
  type,
  id,
}: {
  type: EntityType;
  id: string;
}) {
  const { data, isLoading, error, refetch } = useEntityPanel<OperationsPanel>(
    queryKeys.entity.operations(type, id),
    API_ENDPOINTS.entity.OPERATIONS(type, id),
  );
  if (isLoading) return <LoadingState label="Loading operations..." />;
  if (error || !data) return <ErrorState error={error as Error} onRetry={refetch} />;

  const total =
    data.counts.tasks + data.counts.workflows + data.counts.goals + data.counts.routines;

  if (total === 0) {
    return (
      <div className="p-6">
        <EmptyState
          variant="firstRun"
          title="No operations yet"
          description="Tasks, workflows, goals, and routines will appear here."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      <h3 className="text-lg font-semibold text-canvas-900 dark:text-canvas-50">
        Operations
      </h3>
      <div className="grid grid-cols-4 gap-3 text-center">
        <div>
          <div className="text-2xl font-bold text-canvas-900 dark:text-canvas-50">
            {data.counts.tasks}
          </div>
          <div className="text-xs text-canvas-500">Tasks</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-canvas-900 dark:text-canvas-50">
            {data.counts.workflows}
          </div>
          <div className="text-xs text-canvas-500">Workflows</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-canvas-900 dark:text-canvas-50">
            {data.counts.goals}
          </div>
          <div className="text-xs text-canvas-500">Goals</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-canvas-900 dark:text-canvas-50">
            {data.counts.routines}
          </div>
          <div className="text-xs text-canvas-500">Routines</div>
        </div>
      </div>
    </div>
  );
}

// ─── Resources Panel ────────────────────────────────────────────────────

export function ResourcesPanelComponent({
  type,
  id,
}: {
  type: EntityType;
  id: string;
}) {
  const { data, isLoading, error, refetch } = useEntityPanel<ResourcesPanel>(
    queryKeys.entity.resources(type, id),
    API_ENDPOINTS.entity.RESOURCES(type, id),
  );
  if (isLoading) return <LoadingState label="Loading resources..." />;
  if (error || !data) return <ErrorState error={error as Error} onRetry={refetch} />;

return (
    <div className="space-y-4 p-6">
      <h3 className="text-lg font-semibold text-canvas-900 dark:text-canvas-50">
        Resources
      </h3>
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-canvas-500">
          Human team
        </h4>
        {data.humanTeam.length === 0 ? (
          <EmptyState variant="noData" title="No team members" />
        ) : (
          <ul className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {data.humanTeam.map((m, i: number) => (
              <li key={i}>
                <AvatarMemberCard
                  id={m.id}
                  name={m.name}
                  subtitle={m.role}
                  kind="human"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.location.href = `/entity/user/${encodeURIComponent(m.id)}`;
                    }
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-canvas-500">
          AI team
        </h4>
        {data.aiTeam.length === 0 ? (
          <EmptyState variant="noData" title="No AI employees assigned" />
        ) : (
          <ul className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {data.aiTeam.map((a, i) => (
              <li key={i}>
                <AvatarMemberCard
                  id={a.id}
                  name={a.name}
                  subtitle={a.status}
                  kind="ai"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.location.href = `/entity/agent/${encodeURIComponent(a.id)}`;
                    }
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ─── Collaboration Panel ────────────────────────────────────────────────

export function CollaborationPanelComponent({
  type,
  id,
}: {
  type: EntityType;
  id: string;
}) {
  const { data, isLoading, error, refetch } = useEntityPanel<CollaborationPanel>(
    queryKeys.entity.collaboration(type, id),
    API_ENDPOINTS.entity.COLLABORATION(type, id),
  );
  if (isLoading) return <LoadingState label="Loading collaboration..." />;
  if (error || !data) return <ErrorState error={error as Error} onRetry={refetch} />;

  const total = data.notifications.length + data.approvals.length;
  if (total === 0) {
    return (
      <div className="p-6">
        <EmptyState
          variant="noData"
          title="Nothing to collaborate on yet"
          description="Notifications and approvals will appear here."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      <h3 className="text-lg font-semibold text-canvas-900 dark:text-canvas-50">
        Collaboration
      </h3>
      {data.unreadCount > 0 && (
        <p className="text-xs text-state-warning">{data.unreadCount} unread</p>
      )}
      {data.notifications.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-canvas-500">
            Notifications
          </h4>
          <ul className="mt-2 space-y-1">
            {data.notifications.slice(0, 5).map((n) => (
              <li key={n.id} className="text-sm text-canvas-700 dark:text-canvas-300">
                {n.title}
              </li>
            ))}
          </ul>
        </div>
      )}
      {data.approvals.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-canvas-500">
            Approvals
          </h4>
          <ul className="mt-2 space-y-1">
            {data.approvals.slice(0, 5).map((a) => (
              <li key={a.id} className="text-sm text-canvas-700 dark:text-canvas-300">
                {a.title} <span className="text-xs text-canvas-500">[{a.status}]</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Insights Panel ─────────────────────────────────────────────────────

/**
 * Phase 4 (EAOS-2): InsightsPanel now renders the WidgetGrid instead of
 * hardcoded KPIs. Per NUWS §2.7 + §4.2: max 4 KPIs on first paint,
 * expandable to the full drag-drop grid.
 *
 * The implementation lives in `./InsightsPanel.tsx`. This wrapper keeps
 * the existing export name for the WorkspaceShell.
 */
export { InsightsPanel as InsightsPanelComponent } from './InsightsPanel';

function InsightsPanel_DEPRECATED({
  type,
  id,
}: {
  type: EntityType;
  id: string;
}) {
  const { data, isLoading, error, refetch } = useEntityPanel<InsightsPanel>(
    queryKeys.entity.insights(type, id),
    API_ENDPOINTS.entity.INSIGHTS(type, id),
  );
  if (isLoading) return <LoadingState label="Loading KPIs..." />;
  if (error || !data) return <ErrorState error={error as Error} onRetry={refetch} />;

  if (data.kpis.length === 0) {
    return (
      <div className="p-6">
        <EmptyState
          variant="noData"
          title="No KPIs yet"
          description="KPIs will appear here once data flows in."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      <h3 className="text-lg font-semibold text-canvas-900 dark:text-canvas-50">
        Insights
      </h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
        {data.kpis.slice(0, 4).map((k, i: number) => (
          <div
            key={i}
            className="rounded-md border border-canvas-200 bg-canvas-50 p-3 dark:border-canvas-700 dark:bg-canvas-900"
          >
            <div className="text-xs uppercase tracking-wider text-canvas-500">
              {k.name}
            </div>
            <div className="mt-1 text-xl font-semibold text-canvas-900 dark:text-canvas-50">
              {String(k.value)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Automation Panel ───────────────────────────────────────────────────

export function AutomationPanelComponent({
  type,
  id,
}: {
  type: EntityType;
  id: string;
}) {
  const { data, isLoading, error, refetch } = useEntityPanel<AutomationPanel>(
    queryKeys.entity.automation(type, id),
    API_ENDPOINTS.entity.AUTOMATION(type, id),
  );
  if (isLoading) return <LoadingState label="Loading automations..." />;
  if (error || !data) return <ErrorState error={error as Error} onRetry={refetch} />;

  const total =
    data.automations.length + data.routines.length + data.integrations.length;
  if (total === 0) {
    return (
      <div className="p-6">
        <EmptyState
          variant="firstRun"
          title="No automations yet"
          description="Routines, integrations, and triggers will appear here."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      <h3 className="text-lg font-semibold text-canvas-900 dark:text-canvas-50">
        Automation
      </h3>
      <p className="text-sm text-canvas-500">
        {data.routines.length} routines · {data.integrations.length} integrations
      </p>
      {/* Phase 5, Task 5.9 — one-click AI Action quick-fire row. */}
      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-canvas-500">
          Quick-fire
        </h4>
        <AutomationQuickFire type={type} id={id} />
      </div>
    </div>
  );
}

// ─── Activity Panel ─────────────────────────────────────────────────────

export function ActivityPanelComponent({
  type,
  id,
}: {
  type: EntityType;
  id: string;
}) {
  const { data, isLoading, error, refetch } = useEntityPanel<PaginatedResponse<ActivityEvent>>(
    [...queryKeys.entity.activity(type, id), { page: 1 }],
    API_ENDPOINTS.entity.ACTIVITY(type, id),
  );
  if (isLoading) return <LoadingState label="Loading activity..." />;
  if (error || !data) return <ErrorState error={error as Error} onRetry={refetch} />;

  const items = (data as unknown as { items: ActivityEvent[] }).items ?? [];

  if (items.length === 0) {
    return (
      <div className="p-6">
        <EmptyState
          variant="noData"
          title="No activity yet"
          description="Actions on this entity will be logged here."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      <h3 className="text-lg font-semibold text-canvas-900 dark:text-canvas-50">
        Activity
      </h3>
      <ul className="space-y-2">
        {items.map((e) => (
          <li
            key={e.id}
            className="border-l-2 border-canvas-300 pl-3 text-sm dark:border-canvas-700"
          >
            <div className="font-medium text-canvas-800 dark:text-canvas-200">
              {e.type}
            </div>
            <div className="text-xs text-canvas-500">
              {e.userName ?? e.userId ?? 'system'} · {new Date(e.timestamp).toLocaleString()}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Lifecycle Panel ────────────────────────────────────────────────────

export function LifecyclePanelComponent({
  type,
  id,
}: {
  type: EntityType;
  id: string;
}) {
  const { data, isLoading, error, refetch } = useEntityPanel<NewLifecyclePanel>(
    queryKeys.entity.lifecycle(type, id),
    API_ENDPOINTS.entity.LIFECYCLE(type, id),
  );
  const qc = useQueryClient();
  const transition = useMutation({
    mutationFn: (input: { to: LifecycleState; from?: LifecycleState }) =>
      restClient.post<NewLifecyclePanel>(
        API_ENDPOINTS.entity.LIFECYCLE_TRANSITION(type, id),
        input,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.entity.lifecycle(type, id) });
      qc.invalidateQueries({ queryKey: queryKeys.entity.workspace(type, id) });
    },
  });
  const [pending, setPending] = useState<string | null>(null);

  if (isLoading) return <LoadingState label="Loading lifecycle..." />;
  if (error || !data) return <ErrorState error={error as Error} onRetry={refetch} />;

  const onTransition = async (to: string) => {
    setPending(to);
    try {
      await transition.mutateAsync({ to: to as LifecycleState, from: data.currentState });
    } catch (err) {
      console.error('transition failed', err);
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-canvas-900 dark:text-canvas-50">
          Lifecycle
        </h3>
        <span className="rounded-md bg-canvas-100 px-2 py-1 font-mono text-xs uppercase tracking-wider dark:bg-canvas-800">
          ● {data.currentState}
        </span>
      </div>
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-canvas-500">
          Available transitions
        </h4>
        {data.availableTransitions.length === 0 ? (
          <EmptyState variant="aiGeneratedNothing" title="No transitions available" />
        ) : (
          <div className="mt-2 flex flex-wrap gap-2">
            {data.availableTransitions.map((t) => (
              <button
                key={t.to}
                disabled={pending === t.to || transition.isPending}
                onClick={() => onTransition(t.to)}
                className="rounded-md border border-canvas-200 bg-canvas-50 px-3 py-1 text-sm font-medium text-canvas-800 hover:bg-canvas-100 disabled:opacity-50 dark:border-canvas-700 dark:bg-canvas-900 dark:text-canvas-200 dark:hover:bg-canvas-800"
              >
                {pending === t.to ? '…' : t.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-canvas-500">
          State history
        </h4>
        {data.stateHistory.length === 0 ? (
          <EmptyState variant="noData" title="No transitions yet" />
        ) : (
          <ul className="mt-2 space-y-1">
            {data.stateHistory.slice(0, 10).map((h, i: number) => (
              <li
                key={i}
                className="text-xs text-canvas-700 dark:text-canvas-300"
              >
                {h.fromState} → <strong>{h.toState}</strong>
                {h.transitionedBy && (
                  <span className="text-canvas-500"> · {h.transitionedBy}</span>
                )}
                <span className="text-canvas-500">
                  {' · '}
                  {new Date(h.transitionedAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      {data.whyNotActive && (
        <p className="text-xs text-canvas-500 italic">{data.whyNotActive}</p>
      )}
    </div>
  );
}

// ─── Mini-Graph (NUWS §5.6) ─────────────────────────────────────────────

export function MiniGraphComponent({
  type,
  id,
}: {
  type: EntityType;
  id: string;
}) {
  const { data, isLoading, error } = useEntityPanel<MiniGraph>(
    queryKeys.entity.graph(type, id),
    API_ENDPOINTS.entity.GRAPH(type, id),
  );
  if (isLoading) return <LoadingState label="Loading graph..." />;
  if (error || !data) return null;
  if (data.nodes.length === 0) {
    return (
      <div className="p-6">
        <EmptyState variant="noData" title="No relationships in graph" />
      </div>
    );
  }
  return (
    <div className="space-y-2 p-6">
      <h3 className="text-lg font-semibold text-canvas-900 dark:text-canvas-50">
        Related
      </h3>
      <ul className="space-y-1">
        {data.nodes.slice(0, 20).map((n, i: number) => (
          <li
            key={i}
            className="text-sm text-canvas-700 dark:text-canvas-300"
          >
            <span className="font-mono text-xs uppercase text-canvas-500">
              {n.direction} · {n.relationship}
            </span>{' '}
            {n.type}/{n.id.slice(0, 8)}
          </li>
        ))}
      </ul>
    </div>
  );
}