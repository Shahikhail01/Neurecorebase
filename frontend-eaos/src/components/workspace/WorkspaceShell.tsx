'use client';

import { useState, type ReactNode } from 'react';
import { useEntityWorkspace } from '@/core/hooks/entity';
import { EmptyState, ErrorState, LoadingState } from '@neurecore/ui';
import type { EntityType } from '@neurecore/ui/types';
import {
  IdentityPanelComponent,
  ContextPanelComponent,
  IntelligencePanelComponent,
  OperationsPanelComponent,
  ResourcesPanelComponent,
  CollaborationPanelComponent,
  InsightsPanelComponent,
  AutomationPanelComponent,
  ActivityPanelComponent,
  LifecyclePanelComponent,
} from '@/components/panels/Panels';
import { AdministrationModal } from '@/components/workspace/AdministrationModal';
import { CommandPalette } from '@/components/command/CommandPalette';
import { AskAiButton } from '@/components/command/AskAiButton';

export type CapabilityKey =
  | 'identity'
  | 'intelligence'
  | 'context'
  | 'operations'
  | 'resources'
  | 'collaboration'
  | 'insights'
  | 'automation'
  | 'activity'
  | 'lifecycle';

const TAB_DEFINITIONS: Array<{
  key: CapabilityKey;
  label: string;
  render: (type: EntityType, id: string) => ReactNode;
}> = [
  { key: 'identity', label: 'Identity', render: (t, i) => <IdentityPanelComponent type={t} id={i} /> },
  { key: 'intelligence', label: 'Intelligence', render: (t, i) => <IntelligencePanelComponent type={t} id={i} /> },
  { key: 'context', label: 'Context', render: (t, i) => <ContextPanelComponent type={t} id={i} /> },
  { key: 'operations', label: 'Operations', render: (t, i) => <OperationsPanelComponent type={t} id={i} /> },
  { key: 'resources', label: 'Resources', render: (t, i) => <ResourcesPanelComponent type={t} id={i} /> },
  { key: 'collaboration', label: 'Collaboration', render: (t, i) => <CollaborationPanelComponent type={t} id={i} /> },
  { key: 'insights', label: 'Insights', render: (t, i) => <InsightsPanelComponent type={t} id={i} /> },
  { key: 'automation', label: 'Automation', render: (t, i) => <AutomationPanelComponent type={t} id={i} /> },
  { key: 'activity', label: 'Activity', render: (t, i) => <ActivityPanelComponent type={t} id={i} /> },
  { key: 'lifecycle', label: 'Lifecycle', render: (t, i) => <LifecyclePanelComponent type={t} id={i} /> },
];

export function WorkspaceShell({
  type,
  id,
}: {
  type: EntityType;
  id: string;
}) {
  const [tab, setTab] = useState<CapabilityKey>('identity');
  const [adminOpen, setAdminOpen] = useState(false);
  const { data, isLoading, error, refetch } = useEntityWorkspace(type, id);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingState label="Loading workspace..." />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <ErrorState
          error={(error as Error) ?? new Error('Workspace not found')}
          onRetry={refetch}
        />
      </div>
    );
  }

  const active = TAB_DEFINITIONS.find((t) => t.key === tab) ?? TAB_DEFINITIONS[0];

  return (
    <div className="min-h-screen bg-canvas-50 text-canvas-900 dark:bg-canvas-950 dark:text-canvas-50">
      <header className="border-b border-canvas-200 bg-canvas-0 px-6 py-4 dark:border-canvas-800 dark:bg-canvas-900">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wider text-canvas-500">
              {data.identity.type}
            </p>
            <h1 className="truncate text-2xl font-semibold">{data.identity.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <CommandPalette
              scope={{ entityType: type, entityId: id }}
            />
            <AskAiButton scope={{ entityType: type, entityId: id }} />
            <button
              type="button"
              onClick={() => setAdminOpen(true)}
              className="rounded-md border border-canvas-200 bg-canvas-50 px-3 py-1 text-sm font-medium hover:bg-canvas-100 dark:border-canvas-700 dark:bg-canvas-900 dark:hover:bg-canvas-800"
              aria-label="Open administration settings"
            >
              Administration
            </button>
          </div>
        </div>
      </header>

      <nav className="flex gap-1 overflow-x-auto border-b border-canvas-200 bg-canvas-0 px-4 dark:border-canvas-800 dark:bg-canvas-900">
        {TAB_DEFINITIONS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium ${
              tab === t.key
                ? 'border-state-info text-state-info'
                : 'border-transparent text-canvas-600 hover:text-canvas-900 dark:text-canvas-400 dark:hover:text-canvas-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main className="px-6 py-6">{active.render(type, id)}</main>

      <AdministrationModal
        open={adminOpen}
        onClose={() => setAdminOpen(false)}
        type={type}
        id={id}
      />

      {data.intelligence.risks.length === 0 &&
        tab === 'identity' && (
          <div className="px-6 pb-6">
            <EmptyState
              variant="firstRun"
              title="New entity"
              description="Add labels, run AI insights, and assign a team to get started."
            />
          </div>
        )}
    </div>
  );
}