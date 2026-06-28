'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { EntityType } from '@neurecore/ui/types';

interface WorkspaceContextValue {
  type: EntityType;
  id: string;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({
  type,
  id,
  children,
}: WorkspaceContextValue & { children: ReactNode }) {
  return (
    <WorkspaceContext.Provider value={{ type, id }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return ctx;
}