/**
 * TenantContextMiddleware — populates the AsyncLocalStorage tenant context
 * for every authenticated request.
 *
 * Phase 1, Task 1.4 (per `EAOS-api-contract.md` §6.3 + `EAOS-rbac-model.md` §10).
 *
 * MUST run AFTER the JWT guard (so `req.user` is populated) and BEFORE
 * the controller method. Wires the resolved TenantContext into ALS via
 * `TenantContextService.run(ctx, next)`.
 *
 * Wired in `AppModule.configure(consumer)` as:
 *   consumer.apply(JwtAuthGuard, RolesGuard, TenantContextMiddleware)
 *          .forRoutes('*');
 *
 * The middleware is a no-op for routes that don't have an authenticated
 * user (e.g. @Public() routes) — it just calls next() and returns. The
 * TenantContextService.get() will throw if a service later tries to read
 * the context, which is the correct behavior.
 */

import {
  Injectable,
  NestMiddleware,
} from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { resolveTenantContext } from '../utils/resolve-tenant-context';
import { TenantContextService } from './tenant-context.service';
import type { JwtPayload } from '../../modules/auth/interfaces/token.interface';

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  constructor(private readonly tenantContext: TenantContextService) {}

  use(req: Request, _res: Response, next: NextFunction): void {
    const user = req.user as JwtPayload | undefined;
    if (!user) {
      // Unauthenticated or @Public() route. Don't seed a context.
      // Service code that reads the context will throw if it shouldn't.
      next();
      return;
    }

    let ctx;
    try {
      ctx = resolveTenantContext(user, {
        query: req.query as Record<string, unknown>,
        headers: req.headers as Record<string, string | string[] | undefined>,
        body: req.body as { tenantId?: string },
      });
    } catch {
      // resolveTenantContext throws for platform roles without override or
      // tenant roles without user.tenantId. For now, let the request
      // proceed without a context — the route-level @Roles guard or the
      // controller's explicit check will reject it. The TenantContextService
      // will throw on read if a service tries to use it without a context.
      next();
      return;
    }

    // Bind the context to the request lifetime.
    this.tenantContext.run(
      { ...ctx, actorUserId: user.sub },
      () => next(),
    );
  }
}
