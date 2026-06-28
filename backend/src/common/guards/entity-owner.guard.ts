/**
 * EntityOwnerGuard — Resource-level authorization (Layer 2 of RBAC).
 *
 * Phase 3, Task 3.3 (per `EAOS-rbac-model.md` §5).
 *
 * Verifies that `req.resource.tenantId` matches the caller's tenant. The
 * controller is responsible for loading the resource into `req.resource`
 * BEFORE this guard runs. The guard does NOT check field-level visibility
 * or per-resource ownership beyond tenant scope (that is left to service
 * code or a future `ResourceOwnerGuard`).
 *
 * Usage pattern:
 *   @Get(':id')
 *   @UseGuards(JwtAuthGuard, RolesGuard, EntityOwnerGuard)
 *   async findOne(@Param('id') id: string, @Req() req: Request) {
 *     req.resource = await this.service.findOneOrFail(id);
 *     return req.resource;
 *   }
 *
 * Platform roles (SUPER_ADMIN, PLATFORM_ADMIN, SECURITY_OFFICER, SUPPORT)
 * are allowed to access any tenant's resources (their `isCrossTenant`
 * override is honored by the `TenantContextMiddleware`).
 */

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { TenantContextService } from '../context/tenant-context.service';

export const SKIP_ENTITY_OWNER_KEY = 'skipEntityOwner';

const PLATFORM_ROLES: ReadonlySet<UserRole> = new Set([
  UserRole.SUPER_ADMIN,
  UserRole.PLATFORM_ADMIN,
  UserRole.SECURITY_OFFICER,
  UserRole.SUPPORT,
]);

export interface ResourceWithTenant {
  tenantId: string | null;
}

@Injectable()
export class EntityOwnerGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tenantContext: TenantContextService,
  ) {}

  canActivate(ctx: ExecutionContext): boolean {
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_ENTITY_OWNER_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (skip) return true;

    const req = ctx.switchToHttp().getRequest<{
      user?: { role: UserRole };
      resource?: ResourceWithTenant | null;
    }>();

    if (!req.user) {
      throw new ForbiddenException({
        code: 'NO_AUTHENTICATED_USER',
        message: 'Authentication required.',
      });
    }

    // 1. Platform roles always pass (they have cross-tenant authority).
    if (PLATFORM_ROLES.has(req.user.role)) return true;

    // 2. Resolve tenant context. Throws Forbidden if missing.
    const ctx_ = this.tenantContext.get();

    // 3. The resource (already loaded into req.resource by the controller)
    //    must belong to the caller's tenant. Cross-tenant access denied.
    const resource = req.resource;
    if (!resource) {
      throw new InternalServerErrorException(
        'EntityOwnerGuard used without req.resource; controller must load resource first.',
      );
    }
    if (resource.tenantId !== ctx_.tenantId) {
      throw new ForbiddenException({
        code: 'CROSS_TENANT_ACCESS',
        message: 'You cannot access resources outside your tenant.',
      });
    }
    return true;
  }
}

/**
 * Skips the EntityOwnerGuard for the marked handler/class.
 * Use this on public read endpoints that should not be tenant-scoped
 * (e.g. health probes, public catalog browsing).
 */
export const SkipEntityOwner = () =>
  // Reflector metadata — read by EntityOwnerGuard
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  (require('@nestjs/common').SetMetadata as (k: string, v: unknown) => MethodDecorator)(
    SKIP_ENTITY_OWNER_KEY,
    true,
  );
