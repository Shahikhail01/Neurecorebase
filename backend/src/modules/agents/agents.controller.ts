import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { AgentsService } from './services/agents.service';
import { AgentExecutorService } from './services/agent-executor.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { DispatchTaskDto } from './dto/dispatch-task.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { resolveTenantContext } from '../../common/utils/resolve-tenant-context';
import { assertSameTenant } from '../../common/utils/assert-same-tenant';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedResponse } from '../../common/responses/paginated.response';
import { ActionResult } from '../../common/responses/action-result.response';
import type { AgentResponseDto } from './dto/agent-response.dto';
import type { JwtPayload } from '../auth/interfaces/token.interface';
import { AgentStatus, AgentType } from '@prisma/client';
import { UserRole } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiOkResponse, ApiProduces } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

class UpdatePermissionsDto {
  @IsArray()
  @IsString({ each: true })
  permissions!: string[];

  @IsOptional()
  @IsString()
  budgetPerDay?: string;
}

@Controller({ path: 'agents', version: '1' })
@ApiTags('agents')
@ApiBearerAuth('JWT')
export class AgentsController {
  constructor(
    private readonly agentsService: AgentsService,
    private readonly executorService: AgentExecutorService,
  ) {}

  private resolveTenantId(user: JwtPayload, tenantId?: string): string {
    if (user.role === UserRole.SUPER_ADMIN) {
      if (!tenantId)
        throw new BadRequestException('tenantId is required for SUPER_ADMIN');
      return tenantId;
    }
    if (!user.tenantId) throw new ForbiddenException('Tenant context required');
    return user.tenantId;
  }

  // ─── List ────────────────────────────────────────────────

  /**
   * Phase 1, Task 1.8: returns the canonical `PaginatedResponse<AgentResponseDto>`
   * envelope (per `EAOS-api-contract.md` §3.2). Replaces the legacy shape
   * `{ data, total, page, limit, totalPages }` returned by `findAll`.
   */
  @Get()
  @ApiOperation({ summary: 'List agents (paginated)' })
  @ApiOkResponse({ description: 'Paginated list of agents' })
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query() pagination: PaginationDto,
    @Query('tenantId') tenantId?: string,
    @Query('departmentId') departmentId?: string,
    @Query('status') status?: AgentStatus,
    @Query('type') type?: AgentType,
  ): Promise<PaginatedResponse<AgentResponseDto>> {
    const ctx = resolveTenantContext(user, { query: { tenantId } });

    const { data, total, page, limit } = await this.agentsService.findAll({
      tenantId: ctx.tenantId,
      departmentId,
      status,
      type,
      page: pagination.page,
      limit: pagination.limit,
    });

    return {
      items: data as unknown as AgentResponseDto[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  // ─── Read one ────────────────────────────────────────────

  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @Query('tenantId') tenantId?: string,
  ) {
    // Phase 0 (FIX-007): use the canonical tenant-context resolver.
    const ctx = resolveTenantContext(user, {
      query: { tenantId },
    });
    const agent = await this.agentsService.findOne(id, ctx.tenantId);
    // Defense-in-depth: explicit check even though the service's
    // findFirst already filters by `where: { id, tenantId }`. If a future
    // service method forgets the tenantId filter, this catches it.
    assertSameTenant(user, (agent as { tenantId?: string | null })?.tenantId, {
      resourceType: 'agent',
      resourceId: id,
    });
    return agent;
  }

  // ─── Status ──────────────────────────────────────────────

  @Get(':id/status')
  getStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @Query('tenantId') tenantId?: string,
  ) {
    return this.agentsService.findOne(id, this.resolveTenantId(user, tenantId));
  }

  // ─── Create ──────────────────────────────────────────────

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  create(
    @Body() dto: CreateAgentDto,
    @CurrentUser() user: JwtPayload,
    @Query('tenantId') tenantId?: string,
  ) {
    const effectiveTenantId = dto.tenantId ?? tenantId;
    return this.agentsService.create(
      dto,
      this.resolveTenantId(user, effectiveTenantId),
      user.sub,
    );
  }

  // ─── Update ──────────────────────────────────────────────

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAgentDto,
    @CurrentUser() user: JwtPayload,
    @Query('tenantId') tenantId?: string,
  ) {
    return this.agentsService.update(
      id,
      dto,
      this.resolveTenantId(user, tenantId),
    );
  }

  // ─── Permissions ─────────────────────────────────────────

  /** PATCH /agents/:id/permissions — update allowed actions & budget */
  @Patch(':id/permissions')
  @Roles(UserRole.SUPER_ADMIN)
  updatePermissions(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePermissionsDto,
    @CurrentUser() user: JwtPayload,
    @Query('tenantId') tenantId?: string,
  ) {
    return this.agentsService.update(
      id,
      {
        permissions: dto.permissions,
        budgetPerDay: dto.budgetPerDay,
      } as UpdateAgentDto,
      this.resolveTenantId(user, tenantId),
    );
  }

  /** PATCH /agents/:id/integration-config — WS-3.3 update per-agent integration identity */
  @Patch(':id/integration-config')
  @HttpCode(HttpStatus.OK)
  updateIntegrationConfig(
    @Param('id', ParseUUIDPipe) id: string,
    @Body()
    dto: {
      emailAlias?: string;
      emailProvider?: 'gmail' | 'brevo';
      emailDisplayName?: string;
      emailSignature?: string;
      googleDriveFolderId?: string;
    },
    @CurrentUser() user: JwtPayload,
    @Query('tenantId') tenantId?: string,
  ) {
    const tid = this.resolveTenantId(user, tenantId);
    return this.agentsService.update(
      id,
      {
        emailAlias: dto.emailAlias,
        emailProvider: dto.emailProvider,
        emailDisplayName: dto.emailDisplayName,
        emailSignature: dto.emailSignature,
        googleDriveFolderId: dto.googleDriveFolderId,
      } as never,
      tid,
    );
  }

  // ─── Pause ───────────────────────────────────────────────

  /**
   * Phase 1, Task 1.9: returns the canonical `ActionResult<AgentResponseDto>`
   * envelope (per `EAOS-api-contract.md` §3.3). Replaces the legacy
   * `{ message, agent }` ad-hoc shape.
   */
  @Post(':id/pause')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Pause an agent' })
  async pause(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @Query('tenantId') tenantId?: string,
  ): Promise<ActionResult<AgentResponseDto>> {
    const agent = await this.agentsService.updateStatus(
      id,
      AgentStatus.PAUSED,
      this.resolveTenantId(user, tenantId),
    );
    return {
      success: true,
      message: 'Agent paused',
      data: agent as unknown as AgentResponseDto,
    };
  }

  // ─── Resume ──────────────────────────────────────────────

  @Post(':id/resume')
  @HttpCode(HttpStatus.OK)
  async resume(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @Query('tenantId') tenantId?: string,
  ) {
    const agent = await this.agentsService.updateStatus(
      id,
      AgentStatus.IDLE,
      this.resolveTenantId(user, tenantId),
    );
    return { message: 'Agent resumed', agent };
  }

  // ─── Delete ──────────────────────────────────────────────

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @Query('tenantId') tenantId?: string,
  ) {
    return this.agentsService.remove(id, this.resolveTenantId(user, tenantId));
  }

  // ─── Phase 1 Gap 7 — Lifecycle: archive + deprecate ──────
  //
  // Soft-delete operations preserving audit trail.
  //   archive    = hidden from active lists (ARCHIVED status)
  //   deprecate  = still listed but flagged (DEPRECATED status)
  // Both tenant-scoped via resolveTenantId; OWNER/ADMIN allowed.

  @Patch(':id/archive')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.ADMIN)
  archive(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @Query('tenantId') tenantId?: string,
  ) {
    return this.agentsService.setStatus(
      id,
      this.resolveTenantId(user, tenantId),
      'ARCHIVED',
    );
  }

  @Patch(':id/deprecate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.ADMIN)
  deprecate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @Query('tenantId') tenantId?: string,
  ) {
    return this.agentsService.setStatus(
      id,
      this.resolveTenantId(user, tenantId),
      'DEPRECATED',
    );
  }

  @Patch(':id/restore')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.ADMIN)
  restore(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @Query('tenantId') tenantId?: string,
  ) {
    return this.agentsService.setStatus(
      id,
      this.resolveTenantId(user, tenantId),
      'IDLE',
    );
  }

  // ─── Dispatch task to agent ──────────────────────────────

  @Post(':id/dispatch')
  @HttpCode(HttpStatus.ACCEPTED)
  async dispatch(
    @Param('id', ParseUUIDPipe) agentId: string,
    @Body() dto: DispatchTaskDto,
    @CurrentUser() user: JwtPayload,
    @Query('tenantId') tenantId?: string,
  ) {
    // Fire-and-forget; client tracks progress via WebSocket
    void this.executorService.executeTask(
      dto.taskId,
      agentId,
      this.resolveTenantId(user, tenantId),
    );
    return { message: 'Task dispatched', taskId: dto.taskId, agentId };
  }

  /** POST /agents/:id/task — spec alias for /dispatch */
  @Post(':id/task')
  @HttpCode(HttpStatus.ACCEPTED)
  async dispatchTask(
    @Param('id', ParseUUIDPipe) agentId: string,
    @Body() dto: DispatchTaskDto,
    @CurrentUser() user: JwtPayload,
    @Query('tenantId') tenantId?: string,
  ) {
    void this.executorService.executeTask(
      dto.taskId,
      agentId,
      this.resolveTenantId(user, tenantId),
    );
    return { message: 'Task dispatched', taskId: dto.taskId, agentId };
  }

  // ─── Cancel task ─────────────────────────────────────────

  @Post(':id/cancel/:taskId')
  @HttpCode(HttpStatus.OK)
  cancel(@Param('taskId', ParseUUIDPipe) taskId: string) {
    return this.executorService.cancelTask(taskId);
  }
}
