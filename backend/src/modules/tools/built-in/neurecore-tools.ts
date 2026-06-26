/**
 * NeureCore Agent Tools
 *
 * Tool implementations for agent actions in NeureCore.
 * These tools allow AI agents to perform operations on behalf of users.
 */

import { Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';
import { BaseStructuredTool } from '../structured-tool.base';
import {
  ToolCategory,
  StructuredToolResult,
  ToolExecutionContext,
} from '../interfaces/structured-tool.interface';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

// ─── Input Schemas ────────────────────────────────────────────────────────────

export const CreateTaskInputSchema = z.object({
  title: z.string().min(1).describe('Task title (required)'),
  description: z.string().optional().describe('Task description'),
  departmentId: z.string().optional().describe('Department ID (optional - will use first available if omitted)'),
  agentId: z.string().optional().describe('Agent ID to assign the task to'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM').optional(),
});
export type CreateTaskInput = z.infer<typeof CreateTaskInputSchema>;

export const CreateProjectInputSchema = z.object({
  name: z.string().min(1).describe('Project name (required)'),
  description: z.string().optional().describe('Project description'),
  departmentId: z.string().optional().describe('Department ID'),
  goalIds: z.array(z.string()).optional().describe('Related goal IDs'),
  targetDate: z.string().optional().describe('Target date (ISO 8601 format)'),
});
export type CreateProjectInput = z.infer<typeof CreateProjectInputSchema>;

export const ListDepartmentsInputSchema = z.object({
  status: z.string().default('ACTIVE').optional().describe('Filter by status (ACTIVE, INACTIVE)'),
  limit: z.number().int().positive().max(100).default(20).optional(),
});
export type ListDepartmentsInput = z.infer<typeof ListDepartmentsInputSchema>;

export const ListAgentsInputSchema = z.object({
  departmentId: z.string().optional().describe('Filter by department ID'),
  status: z.string().optional().describe('Filter by agent status (IDLE, RUNNING, PAUSED, ERROR)'),
  limit: z.number().int().positive().max(100).default(20).optional(),
});
export type ListAgentsInput = z.infer<typeof ListAgentsInputSchema>;

export const PauseAgentInputSchema = z.object({
  agentId: z.string().describe('Agent ID to pause'),
});
export type PauseAgentInput = z.infer<typeof PauseAgentInputSchema>;

export const ResumeAgentInputSchema = z.object({
  agentId: z.string().describe('Agent ID to resume'),
});
export type ResumeAgentInput = z.infer<typeof ResumeAgentInputSchema>;

export const ListTasksInputSchema = z.object({
  status: z.string().optional().describe('Filter by task status'),
  agentId: z.string().optional().describe('Filter by agent ID'),
  departmentId: z.string().optional().describe('Filter by department (via agent)'),
  limit: z.number().int().positive().max(100).default(20).optional(),
});
export type ListTasksInput = z.infer<typeof ListTasksInputSchema>;

export const ListProjectsInputSchema = z.object({
  status: z.string().optional().describe('Filter by project status'),
  departmentId: z.string().optional().describe('Filter by department ID'),
  limit: z.number().int().positive().max(100).default(20).optional(),
});
export type ListProjectsInput = z.infer<typeof ListProjectsInputSchema>;

export const GetTenantSnapshotInputSchema = z.object({});
export type GetTenantSnapshotInput = z.infer<typeof GetTenantSnapshotInputSchema>;

// ─── CreateTask Tool ──────────────────────────────────────────────────────────

@Injectable()
export class CreateTaskTool extends BaseStructuredTool {
  readonly name = 'createTask';
  readonly description = 'Create a new task in the NeureCore system. Use this when a user asks to create, add, or register a task.';
  readonly category = ToolCategory.API;
  readonly inputSchema = CreateTaskInputSchema;
  readonly requiredPermissions = ['task:create'];

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  protected async executeImpl(
    input: CreateTaskInput,
    context?: Partial<ToolExecutionContext>,
  ): Promise<StructuredToolResult> {
    if (!context?.tenantId) {
      return { success: false, error: 'Tenant context required' };
    }

    try {
      const task = await this.prisma.task.create({
        data: {
          title: input.title,
          description: input.description,
          priority: input.priority ?? 'MEDIUM',
          tenantId: context.tenantId,
          agentId: input.agentId ?? null,
          status: 'PENDING',
          input: {},
        },
      });

      return {
        success: true,
        data: {
          taskId: task.id,
          title: task.title,
          status: task.status,
          priority: task.priority,
          createdAt: task.createdAt.toISOString(),
        },
        metadata: { model: 'neurecore-task-v1' },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create task',
      };
    }
  }
}

// ─── CreateProject Tool ───────────────────────────────────────────────────────

@Injectable()
export class CreateProjectTool extends BaseStructuredTool {
  readonly name = 'createProject';
  readonly description = 'Create a new project in the NeureCore system. Use this when a user asks to create, add, or register a project.';
  readonly category = ToolCategory.API;
  readonly inputSchema = CreateProjectInputSchema;
  readonly requiredPermissions = ['project:create'];

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  protected async executeImpl(
    input: CreateProjectInput,
    context?: Partial<ToolExecutionContext>,
  ): Promise<StructuredToolResult> {
    if (!context?.tenantId) {
      return { success: false, error: 'Tenant context required' };
    }

    try {
      const project = await this.prisma.project.create({
        data: {
          name: input.name,
          description: input.description,
          tenantId: context.tenantId,
          departmentId: input.departmentId ?? null,
          goalIds: input.goalIds ?? [],
          targetDate: input.targetDate ? new Date(input.targetDate) : null,
          status: 'ACTIVE',
        },
      });

      return {
        success: true,
        data: {
          projectId: project.id,
          name: project.name,
          status: project.status,
          createdAt: project.createdAt.toISOString(),
        },
        metadata: { model: 'neurecore-project-v1' },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create project',
      };
    }
  }
}

// ─── ListDepartments Tool ─────────────────────────────────────────────────────

@Injectable()
export class ListDepartmentsTool extends BaseStructuredTool {
  readonly name = 'listDepartments';
  readonly description = 'List departments in the tenant organization. Use this to find department IDs or names when the user mentions departments.';
  readonly category = ToolCategory.API;
  readonly inputSchema = ListDepartmentsInputSchema;

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  protected async executeImpl(
    input: ListDepartmentsInput,
    context?: Partial<ToolExecutionContext>,
  ): Promise<StructuredToolResult> {
    if (!context?.tenantId) {
      return { success: false, error: 'Tenant context required' };
    }

    try {
      const departments = await this.prisma.department.findMany({
        where: {
          tenantId: context.tenantId,
          status: input.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
        },
        take: input.limit ?? 20,
        select: {
          id: true,
          name: true,
          description: true,
          status: true,
          _count: { select: { agents: true, members: true } },
        },
      });

      return {
        success: true,
        data: {
          departments: departments.map(d => ({
            id: d.id,
            name: d.name,
            description: d.description,
            status: d.status,
            agentCount: d._count.agents,
            memberCount: d._count.members,
          })),
          total: departments.length,
        },
        metadata: { model: 'neurecore-dept-v1' },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list departments',
      };
    }
  }
}

// ─── ListAgents Tool ──────────────────────────────────────────────────────────

@Injectable()
export class ListAgentsTool extends BaseStructuredTool {
  readonly name = 'listAgents';
  readonly description = 'List AI agents. Use this when user asks about agents, their status, or wants to see available agents.';
  readonly category = ToolCategory.API;
  readonly inputSchema = ListAgentsInputSchema;

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  protected async executeImpl(
    input: ListAgentsInput,
    context?: Partial<ToolExecutionContext>,
  ): Promise<StructuredToolResult> {
    if (!context?.tenantId) {
      return { success: false, error: 'Tenant context required' };
    }

    try {
      const where: Record<string, unknown> = { tenantId: context.tenantId };
      if (input.departmentId) where.departmentId = input.departmentId;
      if (input.status) where.status = input.status;

      const agents = await this.prisma.agent.findMany({
        where,
        take: input.limit ?? 20,
        select: {
          id: true,
          name: true,
          type: true,
          status: true,
          departmentId: true,
        },
      });

      return {
        success: true,
        data: {
          agents: agents.map(a => ({
            id: a.id,
            name: a.name,
            type: a.type,
            status: a.status,
            departmentId: a.departmentId,
          })),
          total: agents.length,
        },
        metadata: { model: 'neurecore-agent-v1' },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list agents',
      };
    }
  }
}

// ─── PauseAgent Tool ──────────────────────────────────────────────────────────

@Injectable()
export class PauseAgentTool extends BaseStructuredTool {
  readonly name = 'pauseAgent';
  readonly description = 'Pause an AI agent. Use this when user asks to pause, stop, or deactivate an agent.';
  readonly category = ToolCategory.API;
  readonly inputSchema = PauseAgentInputSchema;
  readonly requiredPermissions = ['agent:pause'];

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  protected async executeImpl(
    input: PauseAgentInput,
    context?: Partial<ToolExecutionContext>,
  ): Promise<StructuredToolResult> {
    if (!context?.tenantId) {
      return { success: false, error: 'Tenant context required' };
    }

    try {
      const agent = await this.prisma.agent.findFirst({
        where: { id: input.agentId, tenantId: context.tenantId },
      });

      if (!agent) {
        return { success: false, error: 'Agent not found' };
      }

      await this.prisma.agent.update({
        where: { id: input.agentId },
        data: { status: 'PAUSED' },
      });

      return {
        success: true,
        data: {
          agentId: agent.id,
          name: agent.name,
          previousStatus: agent.status,
          newStatus: 'PAUSED',
        },
        metadata: { model: 'neurecore-agent-v1' },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to pause agent',
      };
    }
  }
}

// ─── ResumeAgent Tool ──────────────────────────────────────────────────────────

@Injectable()
export class ResumeAgentTool extends BaseStructuredTool {
  readonly name = 'resumeAgent';
  readonly description = 'Resume a paused AI agent. Use this when user asks to resume, start, or reactivate an agent.';
  readonly category = ToolCategory.API;
  readonly inputSchema = ResumeAgentInputSchema;
  readonly requiredPermissions = ['agent:resume'];

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  protected async executeImpl(
    input: ResumeAgentInput,
    context?: Partial<ToolExecutionContext>,
  ): Promise<StructuredToolResult> {
    if (!context?.tenantId) {
      return { success: false, error: 'Tenant context required' };
    }

    try {
      const agent = await this.prisma.agent.findFirst({
        where: { id: input.agentId, tenantId: context.tenantId },
      });

      if (!agent) {
        return { success: false, error: 'Agent not found' };
      }

      await this.prisma.agent.update({
        where: { id: input.agentId },
        data: { status: 'RUNNING' },
      });

      return {
        success: true,
        data: {
          agentId: agent.id,
          name: agent.name,
          previousStatus: agent.status,
          newStatus: 'RUNNING',
        },
        metadata: { model: 'neurecore-agent-v1' },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to resume agent',
      };
    }
  }
}

// ─── ListTasks Tool ───────────────────────────────────────────────────────────

@Injectable()
export class ListTasksTool extends BaseStructuredTool {
  readonly name = 'listTasks';
  readonly description = 'List tasks in the system. Use this when user asks about tasks, their status, or wants to see pending work.';
  readonly category = ToolCategory.API;
  readonly inputSchema = ListTasksInputSchema;

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  protected async executeImpl(
    input: ListTasksInput,
    context?: Partial<ToolExecutionContext>,
  ): Promise<StructuredToolResult> {
    if (!context?.tenantId) {
      return { success: false, error: 'Tenant context required' };
    }

    try {
      const where: Record<string, unknown> = { tenantId: context.tenantId };
      if (input.status) where.status = input.status;
      if (input.agentId) where.agentId = input.agentId;

      const tasks = await this.prisma.task.findMany({
        where,
        take: input.limit ?? 20,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          agentId: true,
          createdAt: true,
        },
      });

      return {
        success: true,
        data: {
          tasks: tasks.map(t => ({
            id: t.id,
            title: t.title,
            status: t.status,
            priority: t.priority,
            agentId: t.agentId,
            createdAt: t.createdAt.toISOString(),
          })),
          total: tasks.length,
        },
        metadata: { model: 'neurecore-task-v1' },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list tasks',
      };
    }
  }
}

// ─── GetTenantSnapshot Tool ───────────────────────────────────────────────────

@Injectable()
export class GetTenantSnapshotTool extends BaseStructuredTool {
  readonly name = 'getTenantSnapshot';
  readonly description = 'Get a live snapshot of the tenant organization data including agents, tasks, workflows, departments, and costs.';
  readonly category = ToolCategory.API;
  readonly inputSchema = GetTenantSnapshotInputSchema;

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  protected async executeImpl(
    _input: unknown,
    context?: Partial<ToolExecutionContext>,
  ): Promise<StructuredToolResult> {
    if (!context?.tenantId) {
      return { success: false, error: 'Tenant context required' };
    }

    try {
      const tenantId = context.tenantId;

      const [agentsByStatus, departmentsCount, tasksByStatus, workflowsByStatus, pendingApprovals, costMonth] =
        await Promise.all([
          this.prisma.agent.groupBy({
            by: ['status'],
            where: { tenantId },
            _count: { _all: true },
          }).catch(() => []),
          this.prisma.department.count({ where: { tenantId, status: 'ACTIVE' } }).catch(() => 0),
          this.prisma.task
            .groupBy({
              by: ['status'],
              where: { tenantId },
              _count: { _all: true },
            })
            .catch(() => []),
          this.prisma.workflow
            .groupBy({
              by: ['status'],
              where: { tenantId },
              _count: { _all: true },
            })
            .catch(() => []),
          this.prisma.approvalRequest
            .count({ where: { tenantId, status: 'PENDING' } })
            .catch(() => 0),
          this.prisma.costRecord
            .aggregate({
              where: {
                tenantId,
                windowStart: {
                  gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                },
              },
              _sum: { costCents: true },
            })
            .catch(() => null),
        ]);

      const agentCounts: Record<string, number> = {};
      let totalAgents = 0;
      for (const row of agentsByStatus) {
        const count = row._count?._all ?? 0;
        agentCounts[row.status] = count;
        totalAgents += count;
      }

      const taskCounts: Record<string, number> = {};
      let totalTasks = 0;
      for (const row of tasksByStatus) {
        const count = row._count?._all ?? 0;
        taskCounts[row.status] = count;
        totalTasks += count;
      }

      const workflowCounts: Record<string, number> = {};
      let totalWorkflows = 0;
      for (const row of workflowsByStatus) {
        const count = row._count?._all ?? 0;
        workflowCounts[row.status] = count;
        totalWorkflows += count;
      }

      return {
        success: true,
        data: {
          tenantId,
          generatedAt: new Date().toISOString(),
          agents: { total: totalAgents, byStatus: agentCounts },
          departments: { active: departmentsCount },
          tasks: { total: totalTasks, byStatus: taskCounts },
          workflows: { total: totalWorkflows, byStatus: workflowCounts },
          approvals: { pending: pendingApprovals },
          cost: {
            monthToDateCents: costMonth?._sum?.costCents
              ? Number(costMonth._sum.costCents)
              : 0,
            currency: 'USD',
          },
        },
        metadata: { model: 'neurecore-snapshot-v1' },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get tenant snapshot',
      };
    }
  }
}
