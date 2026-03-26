/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Configuration Module
 * ═══════════════════════════════════════════════════════════════════════════
 * Global configuration module for NestJS application.
 * Provides type-safe configuration access throughout the application.
 */

import { Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { validate } from './env.loader';
import { ConfigurationService } from './configuration.service';

/**
 * Configuration Module
 * Import this once in AppModule with isGlobal: true
 */
@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      validate,
      envFilePath: ['.env.production', '.env.development', '.env'],
      // Load from process.env for Vercel deployment
      ignoreEnvFile: process.env.VERCEL === 'true',
    }),
  ],
  providers: [ConfigurationService],
  exports: [ConfigurationService, NestConfigModule],
})
export class ConfigurationModule {}

// Re-export types for convenience
export * from './env.loader';
export { ConfigurationService } from './configuration.service';
