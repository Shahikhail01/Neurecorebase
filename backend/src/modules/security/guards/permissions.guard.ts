/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Permissions Guard - Permission-based Access Control
 * ═══════════════════════════════════════════════════════════════════════════
 * Guards routes based on required permissions.
 * Follows SOLID principles - Single Responsibility for permission checking.
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  Permission,
  ROLE_PERMISSIONS,
  UserRole,
} from '../../../shared/types/security.types';

/**
 * Key for storing required permissions in metadata
 */
export const PERMISSIONS_KEY = 'permissions';

/**
 * Set of required permissions for a route
 */
export const RequirePermissions =
  (...permissions: Permission[]) =>
  (target: object, key: string | symbol, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(PERMISSIONS_KEY, permissions, descriptor.value);
    return descriptor;
  };

/**
 * Permissions Guard
 * Checks if the user has the required permissions to access a route
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get required permissions from metadata
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no permissions required, allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    // Get user from request
    const request = context.switchToHttp().getRequest();
    const user = request.user as
      | {
          role: UserRole;
          permissions?: Permission[];
        }
      | undefined;

    // If no user, deny access
    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // Get user's permissions (from role or explicitly assigned)
    const userPermissions = this.getUserPermissions(user);

    // Check if user has all required permissions
    const hasAllPermissions = requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );

    if (!hasAllPermissions) {
      throw new ForbiddenException(
        `Missing required permissions: ${requiredPermissions.join(', ')}`,
      );
    }

    return true;
  }

  /**
   * Get user's permissions based on role and explicitly assigned permissions
   */
  private getUserPermissions(user: {
    role: UserRole;
    permissions?: Permission[];
  }): Permission[] {
    // Start with role-based permissions
    const rolePermissions = ROLE_PERMISSIONS[user.role] || [];

    // Add explicitly assigned permissions
    const explicitPermissions = user.permissions || [];

    // Return unique permissions
    return [...new Set([...rolePermissions, ...explicitPermissions])];
  }
}
