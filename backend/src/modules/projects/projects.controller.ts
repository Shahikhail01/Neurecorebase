/**
 * Projects Module - Controller
 *
 * Following SOLID:
 * - Single Responsibility: HTTP request handling only
 * - Controller receives data, delegates to service
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ApiCommon } from '../../common/decorators/api-common.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProjectsService } from './projects.service';
import {
  CreateProjectDto,
  UpdateProjectDto,
  ListProjectsDto,
} from './dto/project.dto';

/**
 * Phase 1 Gap 6 — added URI versioning (`/api/v1/projects`) and
 * `resolveTenantId()` helper for SUPER_ADMIN cross-tenant access.
 */
@Controller({ path: 'projects', version: '1' })
@ApiCommon('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

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

  @Post()
  async create(
    @Body() dto: CreateProjectDto,
    @Req() req: { user: { tenantId: string; role?: string } },
  ) {
    return this.projectsService.create(req.user.tenantId, {
      tenantId: req.user.tenantId,
      name: dto.name,
      description: dto.description,
      departmentId: dto.departmentId,
      targetDate: dto.targetDate ? new Date(dto.targetDate) : undefined,
      goalIds: dto.goalIds,
    });
  }

  @Get()
  async findAll(
    @Query() query: ListProjectsDto,
    @Req() req: { user: { tenantId: string; role?: string } },
    @Query('tenantId') tenantId?: string,
  ) {
    return this.projectsService.findAll(
      this.resolveTenantId(req.user, tenantId),
      {
        status: query.status,
        departmentId: query.departmentId,
        search: query.search,
        page: query.page ? Number(query.page) : undefined,
        limit: query.limit ? Number(query.limit) : undefined,
      },
    );
  }

  @Get('stats')
  async getStats(
    @Req() req: { user: { tenantId: string; role?: string } },
    @Query('tenantId') tenantId?: string,
  ) {
    return this.projectsService.getProjectStats(
      this.resolveTenantId(req.user, tenantId),
    );
  }

  @Get('department/:departmentId')
  async findByDepartment(
    @Param('departmentId') departmentId: string,
    @Req() req: { user: { tenantId: string; role?: string } },
  ) {
    return this.projectsService.findByDepartment(
      departmentId,
      req.user.tenantId,
    );
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Req() req: { user: { tenantId: string } },
  ) {
    return this.projectsService.findById(id, req.user.tenantId);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
    @Req() req: { user: { tenantId: string } },
  ) {
    return this.projectsService.update(id, req.user.tenantId, {
      name: dto.name,
      description: dto.description,
      status: dto.status,
      departmentId: dto.departmentId,
      targetDate: dto.targetDate ? new Date(dto.targetDate) : undefined,
      goalIds: dto.goalIds,
      metadata: dto.metadata,
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param('id') id: string,
    @Req() req: { user: { tenantId: string } },
  ) {
    await this.projectsService.delete(id, req.user.tenantId);
  }

  @Post(':id/goals/:goalId')
  async addGoal(
    @Param('id') id: string,
    @Param('goalId') goalId: string,
    @Req() req: { user: { tenantId: string } },
  ) {
    return this.projectsService.addGoal(id, req.user.tenantId, goalId);
  }

  @Delete(':id/goals/:goalId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeGoal(
    @Param('id') id: string,
    @Param('goalId') goalId: string,
    @Req() req: { user: { tenantId: string } },
  ) {
    await this.projectsService.removeGoal(id, req.user.tenantId, goalId);
  }
}
