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

/**
 * Wildcard marker meaning "this role has every permission". Frontend-only
 * convention — the backend never sees it (see `EAOS-rbac-model.md` §3.3).
 *
 * Phase 10 cleanup (task 10.11): typed via a dedicated sentinel union
 * member instead of `(Permission[] as any)` casts.
 */
export const WILDCARD = '*' as const;
export type Wildcard = typeof WILDCARD;

/**
 * The internal permission set for a role. A role either has the wildcard
 * (full access) or a finite list of `Permission` values.
 */
export type RolePermissionSet = Wildcard | readonly Permission[];

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissionSet> = {
  SUPER_ADMIN: WILDCARD,
  PLATFORM_ADMIN: [
    'tenant.settings',
    'audit.read.platform',
    'entity.read',
    'entity.write',
    'task.create',
    'ai_action.invoke',
  ],
  SECURITY_OFFICER: [
    'audit.read.platform',
    'audit.read.tenant',
    'entity.read',
  ],
  SUPPORT: ['entity.read'],
  OWNER: WILDCARD,
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
  ],
  USER: [
    'entity.read',
    'entity.write',
    'task.create',
    'task.assign',
    'finance.read',
    'ai_action.invoke',
  ],
  AUDITOR: ['entity.read', 'audit.read.tenant', 'finance.read'],
};

export function hasPermission(
  role: UserRole,
  permission: Permission | Permission[],
): boolean {
  const perms = ROLE_PERMISSIONS[role];
  if (!perms) return false;
  if (perms === WILDCARD) return true;

  const list = Array.isArray(permission) ? permission : [permission];
  return list.every((p) => (perms as readonly Permission[]).includes(p));
}