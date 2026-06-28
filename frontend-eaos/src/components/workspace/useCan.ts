'use client';

import type { Permission } from '@neurecore/ui/auth';
import { hasPermission } from '@neurecore/ui/auth';
import { useRole } from './useRole';

export function useCan(permission: Permission | Permission[]): boolean {
  const role = useRole();
  if (!role) return false;
  return hasPermission(role, permission);
}