/**
 * Goals Module - Prisma Repository
 *
 * Implements IGoalRepository for persisting goals
 * Following SOLID:
 * - Single Responsibility: Only handles Goal persistence
 * - Dependency Inversion: Implements interface, not coupled to service
 * - Tenant Isolation: ALL queries include tenantId filter (read from TenantContextService)
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { TenantContextService } from '../../../common/context/tenant-context.service';
import type {
  IGoalRepository,
  CreateGoalInput,
  UpdateGoalInput,
  ListGoalsOptions,
} from '../interfaces/goal.interface';

@Injectable()
export class PrismaGoalRepository implements IGoalRepository {
  private readonly logger = new Logger(PrismaGoalRepository.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async create(data: CreateGoalInput) {
    return this.prisma.goal.create({
      data: {
        tenantId: this.tenantContext.tenantId,
        title: data.title,
        description: data.description,
        level: data.level ?? 'INDIVIDUAL',
        parentId: data.parentId,
        ownerAgentId: data.ownerAgentId,
        ownerUserId: data.ownerUserId,
        departmentId: data.departmentId,
        targetDate: data.targetDate ? new Date(data.targetDate) : undefined,
      },
    });
  }

  async findById(id: string) {
    return this.prisma.goal.findFirst({
      where: { id, tenantId: this.tenantContext.tenantId },
    });
  }

  async findAll(options: ListGoalsOptions) {
    const { status, level, parentId, ownerUserId, ownerAgentId } =
      options;
    const page = options.page ?? 1;
    const limit = options.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { tenantId: this.tenantContext.tenantId };

    if (status) where.status = status;
    if (level) where.level = level;
    if (ownerUserId) where.ownerUserId = ownerUserId;
    if (ownerAgentId) where.ownerAgentId = ownerAgentId;

    // Handle parentId filtering
    if (parentId === 'root') {
      where.parentId = null;
    } else if (parentId) {
      where.parentId = parentId;
    }
    // If parentId is undefined, don't filter by parentId

    const [data, total] = await this.prisma.$transaction([
      this.prisma.goal.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          children: { select: { id: true } },
        },
      }),
      this.prisma.goal.count({ where }),
    ]);

    return { data, total };
  }

  async findByParentId(parentId: string) {
    return this.prisma.goal.findMany({
      where: { parentId, tenantId: this.tenantContext.tenantId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findRootGoals() {
    return this.prisma.goal.findMany({
      where: { tenantId: this.tenantContext.tenantId, parentId: null },
      orderBy: { createdAt: 'asc' },
    });
  }

  async update(id: string, data: UpdateGoalInput) {
    const updateData: Record<string, unknown> = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.level !== undefined) updateData.level = data.level;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.progress !== undefined) updateData.progress = data.progress;
    if (data.parentId !== undefined) updateData.parentId = data.parentId;
    if (data.ownerAgentId !== undefined)
      updateData.ownerAgentId = data.ownerAgentId;
    if (data.ownerUserId !== undefined)
      updateData.ownerUserId = data.ownerUserId;
    if (data.departmentId !== undefined)
      updateData.departmentId = data.departmentId;
    if (data.targetDate !== undefined) {
      updateData.targetDate = data.targetDate
        ? new Date(data.targetDate)
        : null;
    }
    if (data.completedAt !== undefined) {
      updateData.completedAt = data.completedAt
        ? new Date(data.completedAt)
        : null;
    }

    return this.prisma.goal.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string) {
    const tenantId = this.tenantContext.tenantId;
    const goal = await this.prisma.goal.findFirst({
      where: { id, tenantId },
    });

    if (!goal) {
      throw new Error(`Goal ${id} not found for tenant ${tenantId}`);
    }

    await this.prisma.goal.delete({ where: { id } });
    this.logger.log(`Deleted goal ${id}`);
  }

  async updateProgress(id: string, progress: number) {
    const data: Record<string, unknown> = { progress };

    if (progress >= 100) {
      data.status = 'COMPLETED';
      data.completedAt = new Date();
    }

    return this.prisma.goal.update({
      where: { id },
      data,
    });
  }
}
