/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Security Module - Main Module
 * ═══════════════════════════════════════════════════════════════════════════
 * Comprehensive security module following SOLID principles.
 * Provides authentication, authorization, rate limiting, and security middleware.
 */

import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { SecurityController } from './security.controller';
import { SecurityHeadersMiddleware } from './middleware/security-headers.middleware';
import { RateLimitMiddleware } from './middleware/rate-limit.middleware';
import { CsrfMiddleware } from './middleware/csrf.middleware';
import { SanitizationMiddleware } from './middleware/sanitization.middleware';

import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { ThrottlerGuard } from './guards/throttler.guard';

import { RateLimitService } from './services/rate-limit.service';
import { SecurityEventService } from './services/security-event.service';
import { InputSanitizationService } from './services/input-sanitization.service';
import { DataMaskingService } from './services/data-masking.service';
import { TokenValidationService } from './services/token-validation.service';

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            name: 'default',
            ttl: config.get<number>('THROTTLE_TTL', 60000),
            limit: config.get<number>('THROTTLE_LIMIT', 60),
          },
          {
            name: 'auth',
            ttl: config.get<number>('THROTTLE_TTL', 60000),
            limit: config.get<number>('THROTTLE_AUTH_LIMIT', 10),
          },
          {
            name: 'api',
            ttl: config.get<number>('THROTTLE_TTL', 60000),
            limit: config.get<number>('THROTTLE_API_LIMIT', 100),
          },
          {
            name: 'upload',
            ttl: config.get<number>('THROTTLE_TTL', 60000),
            limit: config.get<number>('THROTTLE_UPLOAD_LIMIT', 5),
          },
        ],
      }),
    }),
  ],
  controllers: [SecurityController],
  providers: [
    // Global Guards
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Services
    RateLimitService,
    SecurityEventService,
    InputSanitizationService,
    DataMaskingService,
    TokenValidationService,
    // Guards
    JwtAuthGuard,
    RolesGuard,
    PermissionsGuard,
    ThrottlerGuard,
  ],
  exports: [
    RateLimitService,
    SecurityEventService,
    InputSanitizationService,
    DataMaskingService,
    TokenValidationService,
    JwtAuthGuard,
    RolesGuard,
    PermissionsGuard,
    ThrottlerGuard,
  ],
})
export class SecurityModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply security middleware to all routes
    consumer.apply(SecurityHeadersMiddleware).forRoutes('*');

    // Apply rate limiting after security headers
    consumer
      .apply(RateLimitMiddleware)
      .exclude('/health', '/healthz')
      .forRoutes('*');

    // Apply CSRF protection (only for state-changing methods)
    consumer
      .apply(CsrfMiddleware)
      .exclude('/health', '/healthz', '/api/v1/auth/login')
      .forRoutes('*');

    // Apply input sanitization last
    consumer.apply(SanitizationMiddleware).forRoutes('*');
  }
}
