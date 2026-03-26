import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ToolsService } from './tools.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { JwtPayload } from '../auth/interfaces/token.interface';

@Controller({ path: 'tools', version: '1' })
export class ToolsController {
  constructor(private readonly toolsService: ToolsService) {}

  // ─── List built-in tools ─────────────────────────────────

  @Get()
  listBuiltIn() {
    return this.toolsService.list();
  }

  // ─── List integrations for tenant ───────────────────────

  @Get('integrations')
  listIntegrations(@CurrentUser() user: JwtPayload) {
    return this.toolsService.findIntegrations(user.tenantId!);
  }

  // ─── Register a new tool integration ────────────────────

  @Post('register')
  @Roles('ADMIN', 'OWNER')
  registerIntegration(
    @Body()
    body: {
      name: string;
      description?: string;
      type?: string;
      config?: Record<string, unknown>;
    },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.toolsService.registerIntegration(user.tenantId!, body);
  }

  // ─── Execute by tool name (built-in) ─────────────────────

  @Post('execute')
  execute(
    @Body('tool') tool: string,
    @Body('input') input: Record<string, unknown>,
  ) {
    return this.toolsService.execute(tool, input);
  }

  // ─── Get execution status / stats for integration ───────────

  @Get(':id/status')
  getStatus(@Param('id', ParseUUIDPipe) id: string) {
    return this.toolsService.getToolStatus(id);
  }

  // ─── Execute a specific integration by id ─────────────────

  @Post(':id/execute')
  @HttpCode(HttpStatus.OK)
  executeById(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('input') input: Record<string, unknown>,
    @Body('agentId') agentId?: string,
    @Body('taskId') taskId?: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.toolsService.executeById(id, input ?? {}, {
      agentId,
      taskId,
      tenantId: user?.tenantId ?? undefined,
    });
  }
}
