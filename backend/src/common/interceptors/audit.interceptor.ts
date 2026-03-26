/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Audit Interceptor - Security Event Logging
 * ═══════════════════════════════════════════════════════════════════════════
 * Logs all API requests for security audit and compliance.
 * Follows SOLID principles - Single Responsibility for audit logging.
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Reflector } from '@nestjs/core';

export const AUDIT_KEY = 'audit';

/**
 * Audit metadata options
 */
export interface AuditOptions {
  action: string;
  resource: string;
  includeBody?: boolean;
  includeResponse?: boolean;
}

export const Audit =
  (options: AuditOptions) =>
  (target: object, key: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(AUDIT_KEY, options, descriptor.value);
    return descriptor;
  };

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse();

    const auditId = uuidv4();
    const startTime = Date.now();

    // Get audit metadata
    const auditOptions = this.reflector.getAllAndOverride<AuditOptions>(
      AUDIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Extract user information
    const user = (request as any).user;
    const userId = user?.id;
    const tenantId = user?.tenantId;

    // Log request
    this.logRequest(auditId, request, auditOptions, userId, tenantId);

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime;
          this.logResponse(
            auditId,
            request,
            response,
            duration,
            auditOptions,
            data,
          );
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          this.logError(auditId, request, error, duration, auditOptions);
        },
      }),
    );
  }

  /**
   * Log incoming request
   */
  private logRequest(
    auditId: string,
    request: Request,
    options: AuditOptions | undefined,
    userId?: string,
    tenantId?: string,
  ): void {
    const logData = {
      auditId,
      type: 'REQUEST',
      timestamp: new Date().toISOString(),
      method: request.method,
      path: request.path,
      query: request.query,
      userId,
      tenantId,
      ip: this.extractIp(request),
      userAgent: request.headers['user-agent'],
      action: options?.action,
      resource: options?.resource,
    };

    // Include body for non-GET requests (but exclude sensitive data)
    if (
      options?.includeBody &&
      ['POST', 'PUT', 'PATCH'].includes(request.method)
    ) {
      const sanitizedBody = this.sanitizeBody(request.body);
      Object.assign(logData, { body: sanitizedBody });
    }

    this.logger.log(JSON.stringify(logData));
  }

  /**
   * Log response
   */
  private logResponse(
    auditId: string,
    request: Request,
    response: any,
    duration: number,
    options: AuditOptions | undefined,
    data: unknown,
  ): void {
    const logData = {
      auditId,
      type: 'RESPONSE',
      timestamp: new Date().toISOString(),
      method: request.method,
      path: request.path,
      statusCode: response.statusCode,
      duration: `${duration}ms`,
      action: options?.action,
      resource: options?.resource,
    };

    // Include response if requested
    if (options?.includeResponse) {
      Object.assign(logData, { response: this.sanitizeResponse(data) });
    }

    this.logger.log(JSON.stringify(logData));
  }

  /**
   * Log error
   */
  private logError(
    auditId: string,
    request: Request,
    error: Error,
    duration: number,
    options: AuditOptions | undefined,
  ): void {
    const logData = {
      auditId,
      type: 'ERROR',
      timestamp: new Date().toISOString(),
      method: request.method,
      path: request.path,
      statusCode: 500,
      duration: `${duration}ms`,
      error: error.message,
      action: options?.action,
      resource: options?.resource,
    };

    this.logger.error(JSON.stringify(logData));
  }

  /**
   * Extract client IP from request
   */
  private extractIp(request: Request): string {
    const forwardedFor = request.headers['x-forwarded-for'];
    if (forwardedFor) {
      return Array.isArray(forwardedFor)
        ? forwardedFor[0].split(',')[0].trim()
        : forwardedFor.split(',')[0].trim();
    }

    const realIp = request.headers['x-real-ip'];
    if (realIp) {
      return Array.isArray(realIp) ? realIp[0] : realIp;
    }

    return request.ip || request.socket?.remoteAddress || 'unknown';
  }

  /**
   * Sanitize request body
   */
  private sanitizeBody(body: unknown): unknown {
    if (!body || typeof body !== 'object') return body;

    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'apiKey',
      'creditCard',
    ];
    const sanitized = { ...body } as Record<string, unknown>;

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * Sanitize response data
   */
  private sanitizeResponse(data: unknown): unknown {
    if (!data || typeof data !== 'object') return data;

    const sensitiveFields = ['password', 'token', 'secret', 'apiKey'];
    const sanitized = Array.isArray(data) ? [] : {};

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitizeResponse(item));
    }

    for (const [key, value] of Object.entries(
      data as Record<string, unknown>,
    )) {
      if (sensitiveFields.includes(key.toLowerCase())) {
        (sanitized as Record<string, unknown>)[key] = '[REDACTED]';
      } else if (typeof value === 'object') {
        (sanitized as Record<string, unknown>)[key] =
          this.sanitizeResponse(value);
      } else {
        (sanitized as Record<string, unknown>)[key] = value;
      }
    }

    return sanitized;
  }
}
