/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Roles Guard - Role-based Access Control
 * ═══════════════════════════════════════════════════════════════════════════
 * Guards routes based on required roles.
 * Follows SOLID principles - Single Responsibility for role checking.
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../../shared/types/security.types';
import { ROLES_KEY } from '../../../common/decorators/roles.decorator';

/**
 * Roles Guard
 * Checks if the user has the required role to access a route
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get required roles from metadata
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no roles required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Get user from request
    const request = context.switchToHttp().getRequest();
    const user = request.user as
      | {
          role: UserRole;
        }
      | undefined;

    // If no user, deny access
    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // Check if user has required role
    const hasRole = requiredRoles.some((role) => user.role === role);

    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied. Required roles: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
