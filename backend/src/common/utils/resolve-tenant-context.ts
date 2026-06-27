/**
 * ═══════════════════════════════════════════════════════════════════════════
 * resolve-tenant-context.ts — Single canonical helper for tenant resolution
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Phase 0 (FIX-007, EAOS-rbac-model.md §10): This is the single chokepoint for
 * resolving the tenant context for an authenticated request. It replaces 15+
 * private `resolveTenantId` methods that were duplicated across controllers.
 *
 * Rules (per EAOS-api-contract.md §6.2):
 *   1. Platform roles (SUPER_ADMIN, PLATFORM_ADMIN, SECURITY_OFFICER, SUPPORT)
 *      may override via `?tenantId=...` query, `X-Tenant-ID` header, or
 *      `body.tenantId`. If none provided, throws 400 TENANT_REQUIRED.
 *   2. Tenant roles (OWNER, ADMIN, USER, AUDITOR) MUST use their own
 *      `user.tenantId`. If missing, throws 403 TENANT_CONTEXT_MISSING.
 *
 * Usage:
 *   @Get(':id')
 *   findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
 *     const ctx = resolveTenantContext(user, { query: { tenantId: ... } });
 *     return this.agentsService.findOne(id, ctx.tenantId);
 *   }
 */

import {
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import type { JwtPayload } from '../../modules/auth/interfaces/token.interface';

const PLATFORM_ROLES: ReadonlySet<UserRole> = new Set([
  UserRole.SUPER_ADMIN,
  UserRole.PLATFORM_ADMIN,
  UserRole.SECURITY_OFFICER,
  UserRole.SUPPORT,
]);

export interface TenantContextInput {
  /** Express request query object (from req.query). */
  query?: Record<string, unknown>;
  /** Express request headers (lowercased keys preferred). */
  headers?: Record<string, string | string[] | undefined>;
  /** Parsed request body (for POST/PUT/PATCH that may carry tenantId). */
  body?: { tenantId?: string };
}

export interface ResolvedTenantContext {
  /** The tenantId to scope this request to. */
  tenantId: string;
  /** True if a platform role overrode their own tenant via header/query/body. */
  isCrossTenant: boolean;
  /** The actor's role, for downstream policy checks. */
  actorRole: UserRole;
}

function isPlatformRole(role: UserRole): boolean {
  return PLATFORM_ROLES.has(role);
}

function extractOverride(
  input: TenantContextInput | undefined,
): string | undefined {
  if (!input) return undefined;
  const fromBody = input.body?.tenantId;
  if (typeof fromBody === 'string' && fromBody.length > 0) return fromBody;
  const fromQuery = input.query?.tenantId;
  if (typeof fromQuery === 'string' && fromQuery.length > 0) return fromQuery;
  const fromHeader = input.headers?.['x-tenant-id'];
  if (typeof fromHeader === 'string' && fromHeader.length > 0) return fromHeader;
  if (Array.isArray(fromHeader) && fromHeader[0]) return fromHeader[0];
  return undefined;
}

/**
 * Resolve the tenant context for the current request.
 * Throws BadRequestException for platform roles with no override.
 * Throws ForbiddenException for tenant roles with no user.tenantId.
 */
export function resolveTenantContext(
  user: JwtPayload,
  input?: TenantContextInput,
): ResolvedTenantContext {
  if (!user) {
    throw new ForbiddenException({
      code: 'NO_AUTHENTICATED_USER',
      message: 'Authentication required.',
    });
  }

  if (isPlatformRole(user.role)) {
    const override = extractOverride(input);
    if (!override) {
      throw new BadRequestException({
        code: 'TENANT_REQUIRED',
        message: `${user.role} must specify tenantId via header, query, or body.`,
      });
    }
    return {
      tenantId: override,
      isCrossTenant: true,
      actorRole: user.role,
    };
  }

  if (!user.tenantId) {
    throw new ForbiddenException({
      code: 'TENANT_CONTEXT_MISSING',
      message: 'User has no tenant context.',
    });
  }
  return {
    tenantId: user.tenantId,
    isCrossTenant: false,
    actorRole: user.role,
  };
}
