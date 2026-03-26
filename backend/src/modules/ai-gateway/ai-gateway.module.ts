/**
 * AI Gateway Module
 *
 * Provides unified interface for AI agent communication via OpenClaw protocol.
 * OpenClaw enables secure, structured communication between agents and external AI services.
 */

import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenClawGatewayService } from './openclaw-gateway.service';
import { LangSmithTracingService } from './langsmith-tracing.service';

/**
 * OpenClaw Gateway configuration
 */
export interface OpenClawConfig {
  endpoint: string;
  apiKey: string;
  timeout: number;
  retryAttempts: number;
  enableTracing: boolean;
}

/**
 * Agent communication message
 */
export interface AgentMessage {
  id: string;
  agentId: string;
  action: string;
  payload: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  timestamp: number;
}

/**
 * Agent response
 */
export interface AgentResponse {
  success: boolean;
  data?: unknown;
  error?: string;
  traceId?: string;
}

@Global()
@Module({
  providers: [
    {
      provide: 'OPENCLAW_CONFIG',
      useFactory: (config: ConfigService): OpenClawConfig => ({
        endpoint:
          config.get<string>('OPENCLAW_ENDPOINT') ??
          'https://api.openclaw.ai/v1',
        apiKey: config.get<string>('OPENCLAW_API_KEY') ?? '',
        timeout: config.get<number>('OPENCLAW_TIMEOUT') ?? 30000,
        retryAttempts: config.get<number>('OPENCLAW_RETRY_ATTEMPTS') ?? 3,
        enableTracing: config.get<boolean>('OPENCLAW_ENABLE_TRACING') ?? true,
      }),
      inject: [ConfigService],
    },
    OpenClawGatewayService,
    LangSmithTracingService,
  ],
  exports: [OpenClawGatewayService, LangSmithTracingService, 'OPENCLAW_CONFIG'],
})
export class AIGatewayModule {}
