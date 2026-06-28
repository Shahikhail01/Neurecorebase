import type { UserRole } from '../types';

export type Permission =
  | 'entity.read'
  | 'entity.write'
  | 'entity.delete'
  | 'entity.lifecycle.transition'
  | 'entity.lifecycle.archive'
  | 'agent.spawn'
  | 'agent.pause'
  | 'agent.archive'
  | 'task.create'
  | 'task.assign'
  | 'task.delete'
  | 'workflow.create'
  | 'workflow.execute'
  | 'routine.create'
  | 'routine.execute'
  | 'finance.read'
  | 'finance.write'
  | 'finance.invoice'
  | 'audit.read.tenant'
  | 'audit.read.platform'
  | 'tenant.settings'
  | 'tenant.billing'
  | 'tenant.members'
  | 'ai_action.invoke'
  | 'ai_action.configure';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: ['*'] as any,
  PLATFORM_ADMIN: [
    'tenant.settings',
    'audit.read.platform',
    'entity.read',
    'entity.write',
    'task.create',
    'ai_action.invoke',
  ] as Permission[],
  SECURITY_OFFICER: [
    'audit.read.platform',
    'audit.read.tenant',
    'entity.read',
  ] as Permission[],
  SUPPORT: ['entity.read'] as Permission[],
  OWNER: ['*'] as any,
  ADMIN: [
    'entity.read',
    'entity.write',
    'entity.delete',
    'entity.lifecycle.transition',
    'entity.lifecycle.archive',
    'agent.spawn',
    'agent.pause',
    'agent.archive',
    'task.create',
    'task.assign',
    'task.delete',
    'workflow.create',
    'workflow.execute',
    'routine.create',
    'routine.execute',
    'finance.read',
    'finance.write',
    'finance.invoice',
    'audit.read.tenant',
    'tenant.settings',
    'tenant.members',
    'ai_action.invoke',
    'ai_action.configure',
  ] as Permission[],
  USER: [
    'entity.read',
    'entity.write',
    'task.create',
    'task.assign',
    'finance.read',
    'ai_action.invoke',
  ] as Permission[],
  AUDITOR: ['entity.read', 'audit.read.tenant', 'finance.read'] as Permission[],
};

export function hasPermission(
  role: UserRole,
  permission: Permission | Permission[],
): boolean {
  const perms = ROLE_PERMISSIONS[role];
  if (!perms) return false;
  if (perms.includes('*' as any)) return true;

  const list = Array.isArray(permission) ? permission : [permission];
  return list.every((p) => perms.includes(p));
}
