/**
 * Costs Controller
 *
 * REST API endpoints for cost tracking and budget management
 * Following SOLID: Single Responsibility - only handles HTTP
 *
 * Phase 1 Gap 6 — added URI versioning (`/api/v1/costs`) and
 * `resolveTenantId()` helper for SUPER_ADMIN cross-tenant access.
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CostsService } from './services/costs.service';
import { CreateBudgetPolicyDto, UpdateBudgetPolicyDto } from './dto/cost.dto';
import type { JwtPayload } from '../auth/interfaces/token.interface';

@Controller({ path: 'costs', version: '1' })
@UseGuards(JwtAuthGuard)
export class CostsController {
  constructor(private readonly costsService: CostsService) {}

  /**
   * Phase 1 Gap 6 — resolve target tenant based on caller role.
   *   SUPER_ADMIN: must pass `?tenantId=<uuid>`; throws otherwise.
   *   Other roles: must have tenantId in JWT.
   */
  private resolveTenantId(user: JwtPayload, tenantId?: string): string {
    if (user.role === 'SUPER_ADMIN') {
      if (!tenantId) {
        throw new BadRequestException('tenantId is required for SUPER_ADMIN');
      }
      return tenantId;
    }
    if (!user.tenantId) throw new ForbiddenException('Tenant context required');
    return user.tenantId;
  }

  private parseDateRange(
    startDate?: string,
    endDate?: string,
  ): { start: Date; end: Date } {
    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    return { start, end };
  }

  /**
   * Get cost summary for tenant
   * GET /api/v1/costs/summary
   */
  @Get('summary')
  async getCostSummary(
    @Req() req: { user: JwtPayload },
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('tenantId') tenantId?: string,
  ) {
    const tenant = this.resolveTenantId(req.user, tenantId);
    const { start, end } = this.parseDateRange(startDate, endDate);
    return this.costsService.getTenantCostSummary(tenant, start, end);
  }

  /**
   * Get cost breakdown by agent
   * GET /api/v1/costs/by-agent
   */
  @Get('by-agent')
  async getCostByAgent(
    @Req() req: { user: JwtPayload },
    @Query('agentId') agentId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('tenantId') tenantId?: string,
  ) {
    const tenant = this.resolveTenantId(req.user, tenantId);
    const { start, end } = this.parseDateRange(startDate, endDate);
    return this.costsService.getCostByAgent(tenant, agentId, start, end);
  }

  /**
   * Get cost breakdown by model
   * GET /api/v1/costs/by-model
   */
  @Get('by-model')
  async getCostByModel(
    @Req() req: { user: JwtPayload },
    @Query('model') model: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('tenantId') tenantId?: string,
  ) {
    const tenant = this.resolveTenantId(req.user, tenantId);
    const { start, end } = this.parseDateRange(startDate, endDate);
    return this.costsService.getCostByModel(tenant, model, start, end);
  }

  /**
   * Get cost breakdown by provider
   * GET /api/v1/costs/by-provider
   */
  @Get('by-provider')
  async getCostByProvider(
    @Req() req: { user: JwtPayload },
    @Query('provider') provider: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('tenantId') tenantId?: string,
  ) {
    const tenant = this.resolveTenantId(req.user, tenantId);
    const { start, end } = this.parseDateRange(startDate, endDate);
    return this.costsService.getCostByProvider(tenant, provider, start, end);
  }

  /**
   * Get cost records list
   * GET /api/v1/costs/records
   */
  @Get('records')
  async getCostRecords(
    @Req() req: { user: JwtPayload },
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('agentId') agentId?: string,
    @Query('provider') provider?: string,
    @Query('model') model?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('tenantId') tenantId?: string,
  ) {
    const tenant = this.resolveTenantId(req.user, tenantId);
    const { start, end } = this.parseDateRange(startDate, endDate);

    return this.costsService.getCostRecords(tenant, start, end, {
      agentId,
      provider,
      model,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  // ─── Budget Policy Endpoints ───────────────────────────────────────────────

  /**
   * Get all budget policies
   * GET /api/v1/costs/budgets
   */
  @Get('budgets')
  async getBudgetPolicies(
    @Req() req: { user: JwtPayload },
    @Query('tenantId') tenantId?: string,
  ) {
    return this.costsService.getBudgetPolicies(
      this.resolveTenantId(req.user, tenantId),
    );
  }

  /**
   * Create a new budget policy
   * POST /api/v1/costs/budgets
   */
  @Post('budgets')
  async createBudgetPolicy(
    @Req() req: { user: JwtPayload },
    @Body() dto: CreateBudgetPolicyDto,
    @Query('tenantId') tenantId?: string,
  ) {
    return this.costsService.createBudgetPolicy({
      ...dto,
      tenantId: this.resolveTenantId(req.user, tenantId),
    });
  }

  /**
   * Update a budget policy
   * PATCH /api/v1/costs/budgets/:id
   */
  @Patch('budgets/:id')
  async updateBudgetPolicy(
    @Param('id') id: string,
    @Body() dto: UpdateBudgetPolicyDto,
  ) {
    return this.costsService.updateBudgetPolicy(id, dto);
  }

  /**
   * Delete a budget policy
   * DELETE /api/v1/costs/budgets/:id
   */
  @Delete('budgets/:id')
  async deleteBudgetPolicy(@Param('id') id: string) {
    await this.costsService.deleteBudgetPolicy(id);
    return { success: true };
  }

  /**
   * Get active budget incidents
   * GET /api/v1/costs/incidents
   */
  @Get('incidents')
  async getActiveIncidents(
    @Req() req: { user: JwtPayload },
    @Query('tenantId') tenantId?: string,
  ) {
    return this.costsService.getActiveIncidents(
      this.resolveTenantId(req.user, tenantId),
    );
  }

  /**
   * Acknowledge a budget incident
   * POST /api/v1/costs/incidents/:id/acknowledge
   */
  @Post('incidents/:id/acknowledge')
  async acknowledgeIncident(@Param('id') id: string) {
    await this.costsService.acknowledgeIncident(id);
    return { success: true };
  }

  /**
   * Resolve a budget incident
   * POST /api/v1/costs/incidents/:id/resolve
   */
  @Post('incidents/:id/resolve')
  async resolveIncident(@Param('id') id: string) {
    await this.costsService.resolveIncident(id);
    return { success: true };
  }

  /**
   * Get cost breakdown by agent with names
   * GET /api/v1/costs/breakdown/by-agent
   */
  @Get('breakdown/by-agent')
  async getCostByAgentBreakdown(
    @Req() req: { user: JwtPayload },
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('tenantId') tenantId?: string,
  ) {
    const tenant = this.resolveTenantId(req.user, tenantId);
    const { start, end } = this.parseDateRange(startDate, endDate);
    return this.costsService.getCostByAgentBreakdown(tenant, start, end);
  }

  /**
   * Get cost breakdown by model
   * GET /api/v1/costs/breakdown/by-model
   */
  @Get('breakdown/by-model')
  async getCostByModelBreakdown(
    @Req() req: { user: JwtPayload },
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('tenantId') tenantId?: string,
  ) {
    const tenant = this.resolveTenantId(req.user, tenantId);
    const { start, end } = this.parseDateRange(startDate, endDate);
    return this.costsService.getCostByModelBreakdown(tenant, start, end);
  }
}