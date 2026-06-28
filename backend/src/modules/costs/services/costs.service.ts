/**
 * Costs Service
 *
 * Main service for cost tracking and budget management
 * Following SOLID: Single Responsibility, Dependency Inversion
 */

import { Injectable, Logger } from '@nestjs/common';
import { LangSmithCostProvider } from '../providers/langsmith-cost-provider';
import { PrismaCostRecordRepository } from '../repositories/prisma-cost.repository';
import {
  PrismaBudgetPolicyRepository,
  PrismaBudgetIncidentRepository,
} from '../repositories/prisma-budget.repository';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { TenantContextService } from '../../../common/context/tenant-context.service';
import type { CostSummary } from '../interfaces/cost.interface';

@Injectable()
export class CostsService {
  private readonly logger = new Logger(CostsService.name);

  constructor(
    private readonly costProvider: LangSmithCostProvider,
    private readonly costRepository: PrismaCostRecordRepository,
    private readonly budgetRepository: PrismaBudgetPolicyRepository,
    private readonly incidentRepository: PrismaBudgetIncidentRepository,
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  /**
   * Get total cost summary for a tenant
   */
  async getTenantCostSummary(
    startDate: Date,
    endDate: Date,
  ): Promise<CostSummary> {
    return this.costProvider.getCostByTenant(startDate, endDate);
  }

  /**
   * Get cost breakdown by agent
   */
  async getCostByAgent(
    agentId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<CostSummary> {
    return this.costProvider.getCostByAgent(
      agentId,
      startDate,
      endDate,
    );
  }

  /**
   * Get cost breakdown by model
   */
  async getCostByModel(
    model: string,
    startDate: Date,
    endDate: Date,
  ): Promise<CostSummary> {
    return this.costProvider.getCostByModel(
      model,
      startDate,
      endDate,
    );
  }

  /**
   * Get cost breakdown by provider
   */
  async getCostByProvider(
    provider: string,
    startDate: Date,
    endDate: Date,
  ): Promise<CostSummary> {
    return this.costProvider.getCostByProvider(
      provider,
      startDate,
      endDate,
    );
  }

  /**
   * Get cost records for a tenant
   */
  async getCostRecords(
    startDate: Date,
    endDate: Date,
    options?: {
      agentId?: string;
      provider?: string;
      model?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    const records = await this.costRepository.findByTenant(
      startDate,
      endDate,
      options,
    );

    const total = await this.costRepository.getTotalCost(
      startDate,
      endDate,
    );

    return {
      data: records,
      total,
      limit: options?.limit ?? 50,
      offset: options?.offset ?? 0,
    };
  }

  /**
   * Get all budget policies for a tenant
   */
  async getBudgetPolicies() {
    return this.budgetRepository.findByTenant();
  }

  /**
   * Create a new budget policy
   */
  async createBudgetPolicy(input: {
    name: string;
    limitCents: number;
    period: 'DAILY' | 'WEEKLY' | 'MONTHLY';
    scope: 'TENANT' | 'DEPARTMENT' | 'AGENT' | 'MODEL';
    scopeId?: string;
    alertThresholds?: number[];
    action?: 'ALERT' | 'BLOCK' | 'DEGRADE';
  }) {
    const tenantId = this.tenantContext.tenantId;
    return this.budgetRepository.create({ ...input, tenantId });
  }

  /**
   * Update a budget policy
   */
  async updateBudgetPolicy(
    id: string,
    input: {
      name?: string;
      limitCents?: number;
      alertThresholds?: number[];
      action?: 'ALERT' | 'BLOCK' | 'DEGRADE';
    },
  ) {
    return this.budgetRepository.update(id, input);
  }

  /**
   * Delete a budget policy
   */
  async deleteBudgetPolicy(id: string) {
    return this.budgetRepository.delete(id);
  }

  /**
   * Get active budget incidents for a tenant
   */
  async getActiveIncidents() {
    return this.incidentRepository.findActiveByTenant();
  }

  /**
   * Acknowledge a budget incident
   */
  async acknowledgeIncident(id: string) {
    return this.incidentRepository.acknowledge(id);
  }

  /**
   * Resolve a budget incident
   */
  async resolveIncident(id: string) {
    return this.incidentRepository.resolve(id);
  }

  /**
   * Check if any budget thresholds have been breached
   * Called after cost records are created
   */
  async checkBudgetThresholds(
    costCents: number,
  ): Promise<void> {
    const tenantId = this.tenantContext.tenantId;
    const policies = await this.budgetRepository.findActivePolicies();

    for (const policy of policies) {
      const policyAny = policy as Record<string, unknown>;
      const currentSpend = Number(policyAny.currentSpendCents) ?? 0;
      const limitCents = Number(policyAny.limitCents) ?? 0;
      const newSpend = currentSpend + costCents;
      const alertThresholds = (policyAny.alertThresholds as number[]) ?? [
        50, 75, 90,
      ];

      if (limitCents > 0) {
        const utilizationPercent = (newSpend / limitCents) * 100;

        // Check each threshold
        for (const threshold of alertThresholds) {
          if (utilizationPercent >= threshold) {
            // Check if incident already exists for this threshold
            const existingIncidents =
              await this.incidentRepository.findByPolicy(
                policyAny.id as string,
              );
            const hasActiveIncident = (
              existingIncidents as Array<{ threshold: number; status: string }>
            ).some((i) => i.threshold === threshold && i.status === 'ACTIVE');

            if (!hasActiveIncident) {
              // Create new incident
              await this.incidentRepository.create({
                budgetPolicyId: policyAny.id as string,
                threshold,
                totalCents: newSpend,
              });

              this.logger.warn(
                `Budget threshold ${threshold}% breached for policy ${policyAny.name} (${policyAny.id})`,
              );
            }
          }
        }

        // Update current spend
        await this.budgetRepository.updateSpend(
          policyAny.id as string,
          newSpend,
        );
      }
    }
  }

  /**
   * Get cost by agent breakdown with names
   * Phase 2 — optional `departmentId` filter
   */
  async getCostByAgentBreakdown(
    startDate: Date,
    endDate: Date,
    departmentId?: string,
  ) {
    const rows = await this.costRepository.getCostByAgent(
      startDate,
      endDate,
      departmentId,
    );

    // Hydrate agent names (limited cardinality — small N)
    const agentIds = rows.map((r) => r.agentId);
    const agents = agentIds.length
      ? await this.prisma.agent.findMany({
          where: { id: { in: agentIds } },
          select: { id: true, name: true, departmentId: true },
        })
      : [];
    const agentMap = new Map(agents.map((a) => [a.id, a]));

    return rows.map((r) => ({
      ...r,
      agentName: agentMap.get(r.agentId)?.name ?? r.agentId,
      departmentId: agentMap.get(r.agentId)?.departmentId ?? null,
    }));
  }

  /**
   * Get cost by model breakdown
   */
  async getCostByModelBreakdown(
    startDate: Date,
    endDate: Date,
  ) {
    return this.costRepository.getCostByModel(startDate, endDate);
  }

  /**
   * Phase 2 — get per-department cost summary (tenant-scoped).
   */
  async getDepartmentCostSummary(
    departmentId: string,
    startDate: Date,
    endDate: Date,
  ) {
    return this.costRepository.getCostSummaryByDepartment(
      departmentId,
      startDate,
      endDate,
    );
  }
}
