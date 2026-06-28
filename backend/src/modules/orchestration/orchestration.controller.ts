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
} from '@nestjs/common';
import { ApiCommon } from '../../common/decorators/api-common.decorator';
import { TasksService } from './services/tasks.service';
import { WorkflowsService } from './services/workflows.service';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';
import { CreateWorkflowDto, UpdateWorkflowDto } from './dto/workflow.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/interfaces/token.interface';
import type { TaskStatus, WorkflowStatus } from '@prisma/client';
import { TenantIsolated } from '../../common/guards/tenant-isolated.decorator';

@ApiCommon('orchestration')
@Controller({ version: '1' })
export class OrchestrationController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly workflowsService: WorkflowsService,
  ) {}

  // ─── Tasks ────────────────────────────────────────────────

  @Get('tasks')
  findAllTasks(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: TaskStatus,
    @Query('agentId') agentId?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.tasksService.findAll({
      status,
      agentId,
      page: Number(page),
      limit: Number(limit),
    });
  }

  @Get('tasks/:id')
  @TenantIsolated()
  findOneTask(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tasksService.findOne(id);
  }

  @Post('tasks')
  createTask(@Body() dto: CreateTaskDto, @CurrentUser() user: JwtPayload) {
    return this.tasksService.create({
      ...dto,
      createdById: user.sub,
    });
  }

  @Patch('tasks/:id')
  updateTask(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaskDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tasksService.update(id, dto);
  }

  @Delete('tasks/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeTask(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tasksService.remove(id);
  }

  // ─── Workflows ────────────────────────────────────────────

  @Get('workflows')
  findAllWorkflows(
    @Query('status') status?: WorkflowStatus,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.workflowsService.findAll({
      status,
      page: Number(page),
      limit: Number(limit),
    });
  }

  @Get('workflows/:id')
  @TenantIsolated()
  findOneWorkflow(@Param('id', ParseUUIDPipe) id: string) {
    return this.workflowsService.findOne(id);
  }

  @Post('workflows')
  createWorkflow(@Body() dto: CreateWorkflowDto) {
    return this.workflowsService.create(dto);
  }

  @Patch('workflows/:id')
  updateWorkflow(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWorkflowDto,
  ) {
    return this.workflowsService.update(id, dto);
  }

  @Post('workflows/:id/activate')
  activate(@Param('id', ParseUUIDPipe) id: string) {
    return this.workflowsService.activate(id);
  }

  @Post('workflows/:id/execute')
  @HttpCode(HttpStatus.ACCEPTED)
  execute(@Param('id', ParseUUIDPipe) id: string) {
    return this.workflowsService.execute(id);
  }

  @Get('workflows/:id/status')
  getStatus(@Param('id', ParseUUIDPipe) id: string) {
    return this.workflowsService.getStatus(id);
  }

  @Delete('workflows/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeWorkflow(@Param('id', ParseUUIDPipe) id: string) {
    return this.workflowsService.remove(id);
  }
}
