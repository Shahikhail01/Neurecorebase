'use client';

import type { ReactNode } from 'react';
import type { Permission } from '@neurecore/ui/auth';
import { useCan } from './useCan';

export function Can({
  permission,
  children,
  fallback,
}: {
  permission: Permission | Permission[];
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const allowed = useCan(permission);
  if (!allowed) return <>{fallback ?? null}</>;
  return <>{children}</>;
}