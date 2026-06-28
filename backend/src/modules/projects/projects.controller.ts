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
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiCommon } from '../../common/decorators/api-common.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProjectsService } from './projects.service';
import {
  CreateProjectDto,
  UpdateProjectDto,
  ListProjectsDto,
} from './dto/project.dto';
import { PaginatedResponse } from '../../common/responses/paginated.response';
import { ActionResult } from '../../common/responses/action-result.response';
import type { ProjectResponseDto } from './dto/project-response.dto';
import { TenantIsolated } from '../../common/guards/tenant-isolated.decorator';

@Controller({ path: 'projects', version: '1' })
@ApiCommon('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  async create(@Body() dto: CreateProjectDto) {
    return this.projectsService.create({
      name: dto.name,
      description: dto.description,
      departmentId: dto.departmentId,
      targetDate: dto.targetDate ? new Date(dto.targetDate) : undefined,
      goalIds: dto.goalIds,
    });
  }

  @Get()
  async findAll(@Query() query: ListProjectsDto): Promise<PaginatedResponse<ProjectResponseDto>> {
    const page = query.page ? Number(query.page) : 1;
    const limit = query.limit ? Number(query.limit) : 20;
    const { data, total } = await this.projectsService.findAll({
      status: query.status,
      departmentId: query.departmentId,
      search: query.search,
      page,
      limit,
    });
    return {
      items: data as unknown as ProjectResponseDto[],
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
  }

  @Get('stats')
  async getStats() {
    return this.projectsService.getProjectStats();
  }

  @Get('department/:departmentId')
  async findByDepartment(@Param('departmentId') departmentId: string) {
    return this.projectsService.findByDepartment(departmentId);
  }

  @Get(':id')
  @TenantIsolated()
  async findOne(@Param('id') id: string) {
    return this.projectsService.findById(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.update(id, {
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
  async delete(@Param('id') id: string) {
    await this.projectsService.delete(id);
  }

  @Post(':id/goals/:goalId')
  async addGoal(
    @Param('id') id: string,
    @Param('goalId') goalId: string,
  ): Promise<ActionResult<ProjectResponseDto>> {
    const project = await this.projectsService.addGoal(id, goalId);
    return {
      success: true,
      message: 'Goal added to project',
      data: project as unknown as ProjectResponseDto,
    };
  }

  @Delete(':id/goals/:goalId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeGoal(
    @Param('id') id: string,
    @Param('goalId') goalId: string,
  ) {
    await this.projectsService.removeGoal(id, goalId);
  }
}
