import { Module } from '@nestjs/common';
import {
  TasksController,
  WorkflowsController,
} from './orchestration.controller';
import { TasksService } from './services/tasks.service';
import { WorkflowsService } from './services/workflows.service';

@Module({
  controllers: [TasksController, WorkflowsController],
  providers: [TasksService, WorkflowsService],
  exports: [TasksService, WorkflowsService],
})
export class OrchestrationModule {}
