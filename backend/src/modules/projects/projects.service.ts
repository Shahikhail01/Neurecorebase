import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { TenantContextService } from '../../common/context/tenant-context.service';
import type { IProjectRepository } from './interfaces/project.interface';

// DI Token
export const PROJECT_REPOSITORY = 'PROJECT_REPOSITORY';

export interface CreateProjectInput {
  name: string;
  description?: string;
  departmentId?: string;
  targetDate?: Date;
  goalIds?: string[];
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  status?: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  departmentId?: string;
  targetDate?: Date;
  goalIds?: string[];
  metadata?: Record<string, unknown>;
}

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    @Inject(PROJECT_REPOSITORY) private readonly repository: IProjectRepository,
    private readonly tenantContext: TenantContextService,
  ) {}

  async create(input: CreateProjectInput) {
    this.logger.log(`Creating project: ${input.name}`);

    if (!input.name || input.name.trim().length === 0) {
      throw new BadRequestException('Project name is required');
    }

    return this.repository.create(input);
  }

  async findById(id: string) {
    const project = await this.repository.findById(id);

    if (!project) {
      throw new NotFoundException(`Project ${id} not found`);
    }

    return project;
  }

  async findAll(
    options?: {
      status?: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
      departmentId?: string;
      search?: string;
      page?: number;
      limit?: number;
    },
  ) {
    return this.repository.findAll(options ?? {});
  }

  async findByDepartment(departmentId: string) {
    return this.repository.findByDepartment(departmentId);
  }

  async update(id: string, input: UpdateProjectInput) {
    await this.findById(id);

    return this.repository.update(id, input);
  }

  async delete(id: string) {
    await this.findById(id);

    await this.repository.delete(id);
    this.logger.log(`Deleted project ${id}`);
  }

  async addGoal(projectId: string, goalId: string) {
    await this.findById(projectId);

    return this.repository.addGoal(projectId, goalId);
  }

  async removeGoal(projectId: string, goalId: string) {
    await this.findById(projectId);

    return this.repository.removeGoal(projectId, goalId);
  }

  async getProjectStats() {
    const { data: allProjects, total } = await this.repository.findAll({
      limit: 1000,
    });

    const activeProjects = allProjects.filter((p) => p.status === 'ACTIVE');
    const completedProjects = allProjects.filter(
      (p) => p.status === 'COMPLETED',
    );
    const archivedProjects = allProjects.filter((p) => p.status === 'ARCHIVED');

    return {
      totalProjects: total,
      activeProjects: activeProjects.length,
      completedProjects: completedProjects.length,
      archivedProjects: archivedProjects.length,
      byDepartment: this.groupByDepartment(allProjects),
      upcomingDeadlines: this.getUpcomingDeadlines(allProjects),
    };
  }

  private groupByDepartment(projects: { departmentId: string | null }[]) {
    const grouped: Record<string, number> = {};
    for (const project of projects) {
      const deptId = project.departmentId || 'unassigned';
      grouped[deptId] = (grouped[deptId] || 0) + 1;
    }
    return grouped;
  }

  private getUpcomingDeadlines(projects: { targetDate: Date | null }[]) {
    const now = new Date();
    const thirtyDaysFromNow = new Date(
      now.getTime() + 30 * 24 * 60 * 60 * 1000,
    );

    return projects
      .filter(
        (p) =>
          p.targetDate &&
          new Date(p.targetDate) > now &&
          new Date(p.targetDate) <= thirtyDaysFromNow,
      )
      .map((p) => p.targetDate);
  }
}
