/**
 * Goals Module - Business Logic Service
 *
 * Following SOLID principles:
 * - Single Responsibility: Only handles goal business logic
 * - Dependency Inversion: Uses IGoalRepository interface
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { TenantContextService } from '../../common/context/tenant-context.service';
import type { IGoalRepository } from './interfaces/goal.interface';
import type { Goal, GoalWithChildren } from './interfaces/goal.interface';
import type {
  CreateGoalInput,
  UpdateGoalInput,
  ListGoalsOptions,
} from './interfaces/goal.interface';

export const GOAL_REPOSITORY = 'GOAL_REPOSITORY';

@Injectable()
export class GoalsService {
  private readonly logger = new Logger(GoalsService.name);

  constructor(
    @Inject(GOAL_REPOSITORY) private readonly repository: IGoalRepository,
    private readonly tenantContext: TenantContextService,
  ) {}

  async create(input: CreateGoalInput) {
    if (input.parentId) {
      const parent = await this.repository.findById(input.parentId);
      if (!parent) {
        throw new NotFoundException(`Parent goal ${input.parentId} not found`);
      }
    }

    return this.repository.create(input);
  }

  async findById(id: string) {
    const goal = await this.repository.findById(id);
    if (!goal) {
      throw new NotFoundException(`Goal ${id} not found`);
    }
    return goal;
  }

  async findAll(options?: ListGoalsOptions) {
    return this.repository.findAll(options ?? {});
  }

  async findRootGoals() {
    return this.repository.findRootGoals();
  }

  async findByParentId(parentId: string) {
    const parent = await this.repository.findById(parentId);
    if (!parent) {
      throw new NotFoundException(`Goal ${parentId} not found`);
    }
    return this.repository.findByParentId(parentId);
  }

  async update(id: string, input: UpdateGoalInput) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Goal ${id} not found`);
    }

    if (input.parentId !== undefined && input.parentId !== null) {
      if (input.parentId === id) {
        throw new BadRequestException('Goal cannot be its own parent');
      }
      const parent = await this.repository.findById(input.parentId);
      if (!parent) {
        throw new NotFoundException(`Parent goal ${input.parentId} not found`);
      }
    }

    return this.repository.update(id, input);
  }

  async delete(id: string) {
    const goal = await this.repository.findById(id);
    if (!goal) {
      throw new NotFoundException(`Goal ${id} not found`);
    }

    const children = await this.repository.findByParentId(id);
    if (children.length > 0) {
      throw new BadRequestException(
        `Cannot delete goal with ${children.length} child goals. Delete or reassign children first.`,
      );
    }

    await this.repository.delete(id);
  }

  async updateProgress(id: string, progress: number) {
    const goal = await this.repository.findById(id);
    if (!goal) {
      throw new NotFoundException(`Goal ${id} not found`);
    }

    if (progress < 0 || progress > 100) {
      throw new BadRequestException('Progress must be between 0 and 100');
    }

    return this.repository.updateProgress(id, progress);
  }

  async getGoalTree(): Promise<GoalWithChildren[]> {
    const allGoals = await this.repository.findAll({ limit: 1000 });

    const goalMap = new Map<string, Goal & { children: Goal[] }>();
    const rootGoals: (Goal & { children: Goal[] })[] = [];

    for (const goal of allGoals.data) {
      goalMap.set(goal.id, { ...goal, children: [] });
    }

    for (const goal of allGoals.data) {
      const node = goalMap.get(goal.id)!;
      if (goal.parentId) {
        const parent = goalMap.get(goal.parentId);
        if (parent) {
          parent.children.push(node);
        } else {
          rootGoals.push(node);
        }
      } else {
        rootGoals.push(node);
      }
    }

    return rootGoals;
  }

  async calculateProgressWithChildren(id: string): Promise<number> {
    const goal = await this.repository.findById(id);
    if (!goal) {
      throw new NotFoundException(`Goal ${id} not found`);
    }

    const children = await this.repository.findByParentId(id);

    if (children.length === 0) {
      return goal.progress;
    }

    let totalProgress = goal.progress;
    let weight = 1;

    for (const child of children) {
      const childProgress = await this.calculateProgressWithChildren(child.id);
      totalProgress += childProgress;
      weight += 1;
    }

    return Math.round(totalProgress / weight);
  }
}
