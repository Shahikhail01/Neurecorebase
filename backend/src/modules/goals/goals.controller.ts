/**
 * Goals Module - REST API Controller
 *
 * Following SOLID:
 * - Single Responsibility: Only handles HTTP requests
 * - Thin controller: Delegates to GoalsService
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GoalsService } from './goals.service';
import { CreateGoalDto, UpdateGoalDto, ListGoalsDto } from './dto/goal.dto';

@Controller({ path: 'goals', version: '1' })
@UseGuards(JwtAuthGuard)
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  /**
   * Phase 1 Gap 6 — resolve target tenant based on caller role.
   */
  private resolveTenantId(
    user: { tenantId?: string; role?: string },
    tenantId?: string,
  ): string {
    if (user.role === 'SUPER_ADMIN') {
      if (!tenantId) {
        throw new BadRequestException('tenantId is required for SUPER_ADMIN');
      }
      return tenantId;
    }
    if (!user.tenantId) throw new ForbiddenException('Tenant context required');
    return user.tenantId;
  }

  /**
   * Create a new goal
   * POST /api/v1/goals
   */
  @Post()
  async create(
    @Body() dto: CreateGoalDto,
    @Req() req: { user: { tenantId: string; role?: string } },
  ) {
    return this.goalsService.create(req.user.tenantId, {
      tenantId: req.user.tenantId,
      title: dto.title,
      description: dto.description,
      level: dto.level,
      parentId: dto.parentId,
      ownerAgentId: dto.ownerAgentId,
      ownerUserId: dto.ownerUserId,
      departmentId: dto.departmentId,
      targetDate: dto.targetDate ? new Date(dto.targetDate) : undefined,
    });
  }

  /**
   * List all goals for tenant
   * GET /api/v1/goals
   */
  @Get()
  async findAll(
    @Query() query: ListGoalsDto,
    @Req() req: { user: { tenantId: string; role?: string } },
    @Query('tenantId') tenantId?: string,
  ) {
    const tenant = this.resolveTenantId(req.user, tenantId);
    return this.goalsService.findAll({
      tenantId: tenant,
      ...query,
    });
  }

  /**
   * Get goal tree (hierarchical)
   * GET /api/v1/goals/tree
   */
  @Get('tree')
  async getTree(
    @Req() req: { user: { tenantId: string; role?: string } },
    @Query('tenantId') tenantId?: string,
  ) {
    return this.goalsService.getGoalTree(
      this.resolveTenantId(req.user, tenantId),
    );
  }

  /**
   * Get root goals only
   * GET /api/v1/goals/roots
   */
  @Get('roots')
  async findRoots(
    @Req() req: { user: { tenantId: string; role?: string } },
    @Query('tenantId') tenantId?: string,
  ) {
    return this.goalsService.findRootGoals(
      this.resolveTenantId(req.user, tenantId),
    );
  }

  /**
   * Get single goal by ID
   * GET /api/v1/goals/:id
   */
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Req() req: { user: { tenantId: string; role?: string } },
  ) {
    return this.goalsService.findById(id, req.user.tenantId);
  }

  /**
   * Get child goals
   * GET /api/v1/goals/:id/children
   */
  @Get(':id/children')
  async findChildren(
    @Param('id') id: string,
    @Req() req: { user: { tenantId: string } },
  ) {
    return this.goalsService.findByParentId(id, req.user.tenantId);
  }

  /**
   * Update goal
   * PUT /api/v1/goals/:id
   */
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateGoalDto,
    @Req() req: { user: { tenantId: string } },
  ) {
    return this.goalsService.update(id, req.user.tenantId, {
      ...dto,
      targetDate: dto.targetDate ? new Date(dto.targetDate) : undefined,
      completedAt: dto.completedAt ? new Date(dto.completedAt) : undefined,
    });
  }

  /**
   * Update goal progress
   * PATCH /api/v1/goals/:id/progress
   */
  @Patch(':id/progress')
  async updateProgress(
    @Param('id') id: string,
    @Body('progress') progress: number,
    @Req() req: { user: { tenantId: string } },
  ) {
    return this.goalsService.updateProgress(id, req.user.tenantId, progress);
  }

  /**
   * Delete goal
   * DELETE /api/v1/goals/:id
   */
  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @Req() req: { user: { tenantId: string } },
  ) {
    await this.goalsService.delete(id, req.user.tenantId);
    return { success: true };
  }
}
