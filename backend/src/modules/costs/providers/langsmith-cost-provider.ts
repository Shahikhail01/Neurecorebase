/**
 * LangSmith Cost Provider
 *
 * Implements ICostAggregationProvider using LangSmith tracing data
 * Following SOLID: Single Responsibility, Dependency Inversion
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import type {
  ICostAggregationProvider,
  CostSummary,
  CostTimelinePoint,
} from '../interfaces/cost.interface';
import { costPer1KTokens } from './cost-constants';

@Injectable()
export class LangSmithCostProvider implements ICostAggregationProvider {
  private readonly logger = new Logger(LangSmithCostProvider.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get aggregated cost summary for a tenant
   *
   * Uses ExecutionLog records which contain costUsd from LLM calls
   * Falls back to token-based estimation if no direct cost recorded
   */
  async getCostByTenant(
    tenantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<CostSummary> {
    const records = await this.prisma.executionLog.findMany({
      where: {
        agent: { tenantId },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        costUsd: true,
        tokensUsed: true,
        success: true,
      },
    });

    const agentRecords = await this.prisma.executionLog.findMany({
      where: {
        agent: { tenantId },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        agent: {
          select: { model: true },
        },
      },
    });

    // Calculate totals from actual costUsd if available
    let totalCostCents = 0;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    const byModel: Record<string, number> = {};
    const byProvider: Record<string, number> = {};

    for (const record of agentRecords) {
      // Use actual cost if available, otherwise estimate
      const costUsd = record.costUsd
        ? Number(record.costUsd) * 100 // Convert to cents
        : this.estimateCost(
            record.tokensUsed,
            record.agent?.model ?? 'unknown',
          );

      totalCostCents += costUsd;
      totalInputTokens += Math.floor(record.tokensUsed * 0.6); // Rough estimate
      totalOutputTokens += Math.floor(record.tokensUsed * 0.4);

      // Aggregate by model
      const model = record.agent?.model ?? 'unknown';
      byModel[model] = (byModel[model] ?? 0) + costUsd;
    }

    return {
      totalCostCents: Math.round(totalCostCents),
      totalInputTokens,
      totalOutputTokens,
      recordCount: records.length,
      byModel,
      byProvider,
    };
  }

  /**
   * Get cost breakdown by specific agent
   */
  async getCostByAgent(
    tenantId: string,
    agentId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<CostSummary> {
    const records = await this.prisma.executionLog.findMany({
      where: {
        agentId,
        agent: { tenantId },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        agent: {
          select: { model: true },
        },
      },
    });

    let totalCostCents = 0;
    let totalTokens = 0;

    for (const record of records) {
      const costUsd = record.costUsd
        ? Number(record.costUsd) * 100
        : this.estimateCost(
            record.tokensUsed,
            record.agent?.model ?? 'unknown',
          );
      totalCostCents += costUsd;
      totalTokens += record.tokensUsed;
    }

    return {
      totalCostCents: Math.round(totalCostCents),
      totalInputTokens: Math.floor(totalTokens * 0.6),
      totalOutputTokens: Math.floor(totalTokens * 0.4),
      recordCount: records.length,
    };
  }

  /**
   * Get cost breakdown by LLM model
   */
  async getCostByModel(
    tenantId: string,
    model: string,
    startDate: Date,
    endDate: Date,
  ): Promise<CostSummary> {
    const records = await this.prisma.executionLog.findMany({
      where: {
        agent: {
          tenantId,
          model,
        },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    let totalCostCents = 0;
    let totalTokens = 0;

    for (const record of records) {
      const costUsd = record.costUsd
        ? Number(record.costUsd) * 100
        : this.estimateCost(record.tokensUsed, model);
      totalCostCents += costUsd;
      totalTokens += record.tokensUsed;
    }

    return {
      totalCostCents: Math.round(totalCostCents),
      totalInputTokens: Math.floor(totalTokens * 0.6),
      totalOutputTokens: Math.floor(totalTokens * 0.4),
      recordCount: records.length,
    };
  }

  /**
   * Get cost breakdown by provider (inferred from model name)
   */
  async getCostByProvider(
    tenantId: string,
    provider: string,
    startDate: Date,
    endDate: Date,
  ): Promise<CostSummary> {
    // Map provider to model patterns
    const providerModelPatterns: Record<string, string[]> = {
      OPENAI: ['gpt-', 'o1-', 'o3-'],
      ANTHROPIC: ['claude-'],
      MINIMAX: ['MiniMax'],
      DEEPSEEK: ['deepseek'],
    };

    const patterns = providerModelPatterns[provider.toUpperCase()] ?? [];
    const agentRecords = await this.prisma.executionLog.findMany({
      where: {
        agent: { tenantId },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        agent: {
          select: { model: true },
        },
      },
    });

    // Filter by provider patterns
    const filteredRecords = agentRecords.filter((record) => {
      const model = record.agent?.model ?? '';
      return patterns.some((pattern) => model.toLowerCase().includes(pattern));
    });

    let totalCostCents = 0;
    let totalTokens = 0;

    for (const record of filteredRecords) {
      const costUsd = record.costUsd
        ? Number(record.costUsd) * 100
        : this.estimateCost(
            record.tokensUsed,
            record.agent?.model ?? 'unknown',
          );
      totalCostCents += costUsd;
      totalTokens += record.tokensUsed;
    }

    return {
      totalCostCents: Math.round(totalCostCents),
      totalInputTokens: Math.floor(totalTokens * 0.6),
      totalOutputTokens: Math.floor(totalTokens * 0.4),
      recordCount: filteredRecords.length,
    };
  }

  /**
   * Estimate cost based on token count and model
   * Used when actual costUsd is not recorded
   */
  private estimateCost(tokens: number, model: string): number {
    const normalizedModel = model.toLowerCase();

    // Find matching model in constants
    for (const [pattern, rates] of Object.entries(costPer1KTokens)) {
      if (normalizedModel.includes(pattern.toLowerCase())) {
        const inputCost = (tokens * 0.6 * rates.input) / 1000;
        const outputCost = (tokens * 0.4 * rates.output) / 1000;
        return (inputCost + outputCost) * 100; // Return cents
      }
    }

    // Default: assume GPT-4o-mini rates
    const inputCost = (tokens * 0.6 * 0.15) / 1000;
    const outputCost = (tokens * 0.4 * 0.6) / 1000;
    return (inputCost + outputCost) * 100;
  }
}
