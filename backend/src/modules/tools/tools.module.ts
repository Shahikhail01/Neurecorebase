import { Module, OnModuleInit } from '@nestjs/common';
import { ToolsController } from './tools.controller';
import { ToolsService } from './tools.service';
import { StructuredToolRegistry } from './structured-tool.registry';
import { HttpRequestTool } from './built-in/http-request.tool';
import { CalculatorTool } from './built-in/calculator.tool';
import { CalculatorEnhancedTool } from './built-in/calculator-enhanced.tool';
import { HttpRequestEnhancedTool } from './built-in/http-request-enhanced.tool';
import {
  CreateTaskTool,
  CreateProjectTool,
  ListDepartmentsTool,
  ListAgentsTool,
  PauseAgentTool,
  ResumeAgentTool,
  ListTasksTool,
  GetTenantSnapshotTool,
} from './built-in/neurecore-tools';
import type { IStructuredTool } from './interfaces/structured-tool.interface';

@Module({
  controllers: [ToolsController],
  providers: [
    HttpRequestTool,
    CalculatorTool,
    CalculatorEnhancedTool,
    HttpRequestEnhancedTool,
    CreateTaskTool,
    CreateProjectTool,
    ListDepartmentsTool,
    ListAgentsTool,
    PauseAgentTool,
    ResumeAgentTool,
    ListTasksTool,
    GetTenantSnapshotTool,
    ToolsService,
    StructuredToolRegistry,
  ],
  exports: [ToolsService, StructuredToolRegistry],
})
export class ToolsModule implements OnModuleInit {
  constructor(
    private readonly registry: StructuredToolRegistry,
    private readonly httpTool: HttpRequestTool,
    private readonly calcTool: CalculatorTool,
    private readonly calcEnhanced: CalculatorEnhancedTool,
    private readonly httpEnhanced: HttpRequestEnhancedTool,
    private readonly createTask: CreateTaskTool,
    private readonly createProject: CreateProjectTool,
    private readonly listDepts: ListDepartmentsTool,
    private readonly listAgents: ListAgentsTool,
    private readonly pauseAgent: PauseAgentTool,
    private readonly resumeAgent: ResumeAgentTool,
    private readonly listTasks: ListTasksTool,
    private readonly getSnapshot: GetTenantSnapshotTool,
  ) {}

  onModuleInit(): void {
    const tools: IStructuredTool[] = [
      this.httpTool,
      this.calcTool,
      this.calcEnhanced,
      this.httpEnhanced,
      this.createTask,
      this.createProject,
      this.listDepts,
      this.listAgents,
      this.pauseAgent,
      this.resumeAgent,
      this.listTasks,
      this.getSnapshot,
    ].filter((t): t is IStructuredTool => t !== null && t !== undefined);

    this.registry.setTools(tools);
  }
}
