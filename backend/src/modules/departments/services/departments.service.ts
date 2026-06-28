import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { TenantContextService } from '../../../common/context/tenant-context.service';
import type { DepartmentStatus } from '@prisma/client';

export interface CreateDeptInput {
  name: string;
  description?: string;
  status?: DepartmentStatus;
  headAgentId?: string;
  parentId?: string;
}

@Injectable()
export class DepartmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async findAll() {
    return this.prisma.department.findMany({
      where: { tenantId: this.tenantContext.tenantId },
      include: {
        children: true,
        parent: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const dept = await this.prisma.department.findFirst({
      where: { id, tenantId: this.tenantContext.tenantId },
      include: { children: true, parent: { select: { id: true, name: true } } },
    });
    if (!dept) throw new NotFoundException(`Department ${id} not found`);
    return dept;
  }

  async create(input: CreateDeptInput) {
    return this.prisma.department.create({
      data: {
        name: input.name,
        description: input.description,
        status: input.status ?? 'ACTIVE',
        headAgentId: input.headAgentId,
        parentId: input.parentId,
        tenantId: this.tenantContext.tenantId,
      },
    });
  }

  async update(
    id: string,
    data: Partial<Omit<CreateDeptInput, 'tenantId'>>,
  ) {
    await this.findOne(id);
    return this.prisma.department.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.department.delete({ where: { id } });
  }
}
