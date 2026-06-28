'use client';

import { useParams } from 'next/navigation';
import { WorkspaceProvider } from '@/components/workspace/WorkspaceProvider';
import { WorkspaceShell } from '@/components/workspace/WorkspaceShell';
import { EAOS_ENTITY_TYPES, type EaosEntityType } from '@/lib/eaos-entity-types';
import { ErrorState } from '@neurecore/ui';

export default function EntityPage() {
  const params = useParams<{ type: string; id: string }>();
  const type = params?.type;
  const id = params?.id;

  if (!type || !id) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <ErrorState error={new Error('Missing entity type or id.')} />
      </div>
    );
  }

  if (!EAOS_ENTITY_TYPES.includes(type as EaosEntityType)) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <ErrorState error={new Error(`Unknown entity type: ${type}`)} />
      </div>
    );
  }

  return (
    <WorkspaceProvider type={type as EaosEntityType} id={id}>
      <WorkspaceShell type={type as EaosEntityType} id={id} />
    </WorkspaceProvider>
  );
}