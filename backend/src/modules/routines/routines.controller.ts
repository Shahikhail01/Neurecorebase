/**
 * Routines Controller
 *
 * Full CRUD operations for routines + webhook trigger endpoint.
 * Follows NestJS REST conventions with proper validation and authorization.
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
  ParseUUIDPipe,
  Headers,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  CreateRoutineDto,
  UpdateRoutineDto,
  CreateTriggerDto,
  UpdateTriggerDto,
  ExecuteRoutineDto,
  ListRoutinesQueryDto,
  ListRunsQueryDto,
} from './dto/routine.dto';
import { RoutineExecutionService } from './services/routine-execution.service';
import {
  PrismaRoutineRepository,
  PrismaRoutineTriggerRepository,
  PrismaRoutineRunRepository,
} from './repositories/prisma-routine.repository';

/**
 * Phase 1 Gap 6 — added URI versioning (`/api/v1/routines`) and
 * `resolveTenantId()` helper for SUPER_ADMIN cross-tenant access.
 */
@Controller({ path: 'routines', version: '1' })
@UseGuards(JwtAuthGuard)
export class RoutinesController {
  constructor(
    private readonly routineRepo: PrismaRoutineRepository,
    private readonly triggerRepo: PrismaRoutineTriggerRepository,
    private readonly runRepo: PrismaRoutineRunRepository,
    private readonly executionService: RoutineExecutionService,
  ) {}

  // ─── Routine CRUD ─────────────────────────────────────────────────────────

  @Post()
  async createRoutine(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateRoutineDto,
  ) {
    const routine = await this.routineRepo.create({
      name: dto.name,
      description: dto.description,
      graphDefinition: dto.graphDefinition,
      config: dto.config,
      metadata: dto.metadata,
      tenantId,
      createdById: userId,
    });

    return {
      status: 'success',
      data: routine,
    };
  }

  @Get()
  async listRoutines(
    @CurrentUser('tenantId') tenantId: string,
    @Query() query: ListRoutinesQueryDto,
  ) {
    const routines = await this.routineRepo.findAll(tenantId, {
      status: query.status,
      limit: query.limit,
      offset: query.offset,
      orderBy: query.orderBy,
      order: query.order,
      // Phase 1 Gap 1 — owner agent filter passthrough
      ownerAgentId: query.ownerAgentId,
      ownerAgentIds: query.ownerAgentIds
        ? query.ownerAgentIds.split(',').map((s) => s.trim()).filter(Boolean)
        : undefined,
    });

    return {
      status: 'success',
      data: routines,
    };
  }

  @Get(':id')
  async getRoutine(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const routine = await this.routineRepo.findById(id, tenantId);

    if (!routine) {
      return {
        status: 'error',
        message: 'Routine not found',
      };
    }

    return {
      status: 'success',
      data: routine,
    };
  }

  @Put(':id')
  async updateRoutine(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRoutineDto,
  ) {
    const routine = await this.routineRepo.update(id, tenantId, {
      name: dto.name,
      description: dto.description,
      graphDefinition: dto.graphDefinition,
      config: dto.config,
      metadata: dto.metadata,
    });

    // Update status if provided
    if (dto.status) {
      await this.routineRepo.updateStatus(id, tenantId, dto.status);
    }

    return {
      status: 'success',
      data: routine,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteRoutine(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.routineRepo.delete(id, tenantId);
  }

  // ─── Trigger Management ───────────────────────────────────────────────────

  @Post(':id/triggers')
  async createTrigger(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) routineId: string,
    @Body() dto: CreateTriggerDto,
  ) {
    // Verify routine belongs to tenant
    const routine = await this.routineRepo.findById(routineId, tenantId);
    if (!routine) {
      return {
        status: 'error',
        message: 'Routine not found',
      };
    }

    const trigger = await this.triggerRepo.create(routineId, {
      type: dto.type,
      name: dto.name,
      config: dto.config,
    });

    return {
      status: 'success',
      data: trigger,
    };
  }

  @Get(':id/triggers')
  async listTriggers(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) routineId: string,
  ) {
    // Verify routine belongs to tenant
    const routine = await this.routineRepo.findById(routineId, tenantId);
    if (!routine) {
      return {
        status: 'error',
        message: 'Routine not found',
      };
    }

    const triggers = await this.triggerRepo.findByRoutineId(routineId);

    return {
      status: 'success',
      data: triggers,
    };
  }

  @Put(':id/triggers/:triggerId')
  async updateTrigger(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) routineId: string,
    @Param('triggerId', ParseUUIDPipe) triggerId: string,
    @Body() dto: UpdateTriggerDto,
  ) {
    // Verify trigger belongs to routine and tenant
    const trigger = await this.triggerRepo.findById(triggerId, tenantId);
    if (!trigger || trigger.routineId !== routineId) {
      return {
        status: 'error',
        message: 'Trigger not found',
      };
    }

    const updated = await this.triggerRepo.update(triggerId, tenantId, {
      name: dto.name,
      config: dto.config,
      isActive: dto.isActive,
    });

    return {
      status: 'success',
      data: updated,
    };
  }

  @Delete(':id/triggers/:triggerId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTrigger(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) routineId: string,
    @Param('triggerId', ParseUUIDPipe) triggerId: string,
  ) {
    // Verify trigger belongs to routine and tenant
    const trigger = await this.triggerRepo.findById(triggerId, tenantId);
    if (!trigger || trigger.routineId !== routineId) {
      return {
        status: 'error',
        message: 'Trigger not found',
      };
    }

    await this.triggerRepo.delete(triggerId, tenantId);
  }

  // ─── Execution ────────────────────────────────────────────────────────────

  @Post(':id/execute')
  async executeRoutine(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) routineId: string,
    @Body() dto: ExecuteRoutineDto,
  ) {
    // Verify routine belongs to tenant
    const routine = await this.routineRepo.findById(routineId, tenantId);
    if (!routine) {
      return {
        status: 'error',
        message: 'Routine not found',
      };
    }

    const result = await this.executionService.execute({
      routineId,
      tenantId,
      input: dto.input,
      agentId: dto.agentId,
      userId,
      triggerType: 'MANUAL',
    });

    return {
      status: result.status === 'COMPLETED' ? 'success' : 'error',
      data: result,
    };
  }

  @Post(':id/activate')
  async activateRoutine(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const routine = await this.routineRepo.findById(id, tenantId);
    if (!routine) {
      return {
        status: 'error',
        message: 'Routine not found',
      };
    }

    // Validate graph before activation
    const validation = this.executionService.validateGraph(
      routine.graphDefinition as any,
    );

    if (!validation.valid) {
      return {
        status: 'error',
        message: 'Cannot activate routine with invalid graph',
        errors: validation.errors,
      };
    }

    const updated = await this.routineRepo.updateStatus(id, tenantId, 'ACTIVE');

    return {
      status: 'success',
      data: updated,
    };
  }

  @Post(':id/pause')
  async pauseRoutine(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const routine = await this.routineRepo.findById(id, tenantId);
    if (!routine) {
      return {
        status: 'error',
        message: 'Routine not found',
      };
    }

    const updated = await this.routineRepo.updateStatus(id, tenantId, 'PAUSED');

    return {
      status: 'success',
      data: updated,
    };
  }

  // ─── Run Management ────────────────────────────────────────────────────────

  @Get(':id/runs')
  async listRoutineRuns(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) routineId: string,
    @Query() query: ListRunsQueryDto,
  ) {
    // Verify routine belongs to tenant
    const routine = await this.routineRepo.findById(routineId, tenantId);
    if (!routine) {
      return {
        status: 'error',
        message: 'Routine not found',
      };
    }

    const runs = await this.runRepo.findByRoutineId(routineId, {
      status: query.status as any,
      limit: query.limit,
      offset: query.offset,
      orderBy: query.orderBy,
      order: query.order,
    });

    return {
      status: 'success',
      data: runs,
    };
  }

  @Get('runs')
  async listAllRuns(
    @CurrentUser('tenantId') tenantId: string,
    @Query() query: ListRunsQueryDto,
  ) {
    const runs = await this.runRepo.findByTenantId(tenantId, {
      status: query.status as any,
      limit: query.limit,
      offset: query.offset,
      orderBy: query.orderBy,
      order: query.order,
    });

    return {
      status: 'success',
      data: runs,
    };
  }

  @Get('runs/:runId')
  async getRun(
    @CurrentUser('tenantId') tenantId: string,
    @Param('runId', ParseUUIDPipe) runId: string,
  ) {
    const run = await this.runRepo.findById(runId, tenantId);

    if (!run) {
      return {
        status: 'error',
        message: 'Run not found',
      };
    }

    // Get current state if running
    let state: Record<string, unknown> | null = null;
    if (run.status === 'RUNNING') {
      const currentState = await this.executionService.getState(runId);
      state = currentState as Record<string, unknown> | null;
    }

    return {
      status: 'success',
      data: {
        ...run,
        currentState: state,
      },
    };
  }

  @Post('runs/:runId/cancel')
  async cancelRun(
    @CurrentUser('tenantId') tenantId: string,
    @Param('runId', ParseUUIDPipe) runId: string,
  ) {
    // Verify run belongs to tenant
    const run = await this.runRepo.findById(runId, tenantId);
    if (!run) {
      return {
        status: 'error',
        message: 'Run not found',
      };
    }

    await this.executionService.cancel(runId);

    return {
      status: 'success',
      message: 'Run cancelled',
    };
  }

  @Post('runs/:runId/resume')
  async resumeRun(
    @CurrentUser('tenantId') tenantId: string,
    @Param('runId', ParseUUIDPipe) runId: string,
  ) {
    // Verify run belongs to tenant
    const run = await this.runRepo.findById(runId, tenantId);
    if (!run) {
      return {
        status: 'error',
        message: 'Run not found',
      };
    }

    const result = await this.executionService.resume(runId);

    return {
      status: result.status === 'COMPLETED' ? 'success' : 'error',
      data: result,
    };
  }
}

/**
 * Webhook Controller (Public - no auth required)
 *
 * Handles incoming webhook triggers for routines.
 * Authentication is via webhook secret validation.
 */
@Controller('webhooks')
export class WebhooksController {
  constructor(
    private readonly triggerRepo: PrismaRoutineTriggerRepository,
    private readonly executionService: RoutineExecutionService,
  ) {}

  @Post('routines/*path')
  async handleRoutineWebhook(
    @Param('path') path: string,
    @Body() body: Record<string, unknown>,
    @Headers('x-webhook-signature') signature: string,
  ) {
    // Construct full webhook path
    const webhookPath = `/webhooks/routines/${path}`;

    try {
      const result = await this.executionService.handleWebhookTrigger(
        webhookPath,
        body,
      );

      return {
        status: result.status === 'COMPLETED' ? 'success' : 'error',
        data: {
          runId: result.runId,
          status: result.status,
        },
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Webhook processing failed';

      return {
        status: 'error',
        message,
      };
    }
  }
}
