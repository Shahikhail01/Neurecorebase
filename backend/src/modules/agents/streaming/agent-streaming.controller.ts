/**
 * Agent Streaming Controller
 *
 * Provides Server-Sent Events (SSE) endpoint for real-time agent execution streaming.
 */

import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Res,
  HttpCode,
  HttpStatus,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  AgentStreamingService,
  AgentStreamingEvent,
  StreamingEventType,
} from './agent-streaming.service';
import { AgentExecutorService } from '../services/agent-executor.service';
import { StructuredToolRegistry } from '../../tools/structured-tool.registry';
import { SkipThrottle } from '@nestjs/throttler';

@Controller('api/v1/agents/streaming')
@SkipThrottle()
export class AgentStreamingController {
  constructor(
    private readonly streamingService: AgentStreamingService,
    private readonly agentExecutor: AgentExecutorService,
    private readonly toolRegistry: StructuredToolRegistry,
  ) {}

  /**
   * Create a new streaming session
   */
  @Post('sessions')
  @HttpCode(HttpStatus.CREATED)
  createSession(
    @Query('taskId') taskId: string,
    @Query('userId') userId?: string,
    @Query('tenantId') tenantId?: string,
  ): { sessionId: string; url: string } {
    if (!taskId) {
      throw new BadRequestException('taskId is required');
    }

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    this.streamingService.createSession({
      taskId,
      sessionId,
      userId,
      tenantId,
    });

    return {
      sessionId,
      url: `/api/v1/agents/streaming/sessions/${sessionId}/events`,
    };
  }

  /**
   * Get streaming events for a session (SSE endpoint)
   */
  @Get('sessions/:sessionId/events')
  getEvents(@Param('sessionId') sessionId: string, @Res() res: Response): void {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const session = this.streamingService.getSession(sessionId);
    if (!session) {
      res
        .status(HttpStatus.NOT_FOUND)
        .send(`data: ${JSON.stringify({ error: 'Session not found' })}\n\n`);
      return;
    }

    res.write(
      `data: ${JSON.stringify({
        type: StreamingEventType.CONNECTED,
        timestamp: Date.now(),
        sessionId,
        data: { sessionId, taskId: session.taskId },
      })}\n\n`,
    );

    const stream$ = this.streamingService.getStream(sessionId);
    if (!stream$) {
      res
        .status(HttpStatus.NOT_FOUND)
        .send(`data: ${JSON.stringify({ error: 'Stream not available' })}\n\n`);
      return;
    }

    const subscription = stream$.subscribe({
      next: (event: AgentStreamingEvent) => {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
        if (
          event.type === StreamingEventType.COMPLETE ||
          event.type === StreamingEventType.CANCELLED ||
          event.type === StreamingEventType.ERROR
        ) {
          res.end();
        }
      },
      error: (error: Error) => {
        res.write(
          `data: ${JSON.stringify({
            type: StreamingEventType.ERROR,
            timestamp: Date.now(),
            sessionId,
            error: error.message,
          })}\n\n`,
        );
        res.end();
      },
      complete: () => res.end(),
    });

    res.on('close', () => {
      subscription.unsubscribe();
      this.streamingService.closeSession(sessionId);
    });
  }

  /**
   * Execute an agent task with streaming
   */
  @Post('sessions/:sessionId/execute')
  @HttpCode(HttpStatus.ACCEPTED)
  executeWithStreaming(
    @Param('sessionId') sessionId: string,
    @Query('goal') goal: string,
    @Query('agentId') agentId: string = 'default',
    @Query('tenantId') tenantId?: string,
  ): { taskId: string; status: string } {
    if (!goal) {
      throw new BadRequestException('goal is required');
    }

    const session = this.streamingService.getSession(sessionId);
    if (!session) {
      throw new NotFoundException('Session not found');
    }

    const taskId = session.taskId;

    // Execute in background (fire and forget)
    void this.executeAgentTask(sessionId, taskId, agentId, tenantId);

    return { taskId, status: 'started' };
  }

  /**
   * Execute agent task with streaming updates
   */
  private async executeAgentTask(
    sessionId: string,
    taskId: string,
    agentId: string,
    tenantId?: string,
  ): Promise<void> {
    try {
      this.streamingService.emitStart(sessionId, taskId);

      const result = await this.agentExecutor.executeTask(
        taskId,
        agentId,
        tenantId || 'default',
      );

      // Process results with streaming
      if (result.steps && result.steps.length > 0) {
        for (let i = 0; i < result.steps.length; i++) {
          const step = result.steps[i];
          const stepDescription = `Step ${i + 1}`;

          this.streamingService.emitStepStart(
            sessionId,
            taskId,
            i,
            result.steps.length,
            {
              id: step.stepId,
              description: stepDescription,
            },
          );

          if (step.success && step.output) {
            this.streamingService.emitStepComplete(
              sessionId,
              taskId,
              i,
              result.steps.length,
              {
                id: step.stepId,
                description: stepDescription,
              },
              step.output,
            );
          } else if (step.error) {
            this.streamingService.emitStepError(
              sessionId,
              taskId,
              i,
              result.steps.length,
              {
                id: step.stepId,
                description: stepDescription,
              },
              step.error,
            );
          } else {
            this.streamingService.emitStepComplete(
              sessionId,
              taskId,
              i,
              result.steps.length,
              {
                id: step.stepId,
                description: stepDescription,
              },
            );
          }
        }
      }

      this.streamingService.emitComplete(sessionId, taskId, result);
    } catch (error) {
      this.streamingService.emit(sessionId, {
        type: StreamingEventType.ERROR,
        timestamp: Date.now(),
        sessionId,
        taskId,
        error: error instanceof Error ? error.message : String(error),
      });
      this.streamingService.closeSession(sessionId);
    }
  }

  /**
   * Cancel a streaming session
   */
  @Delete('sessions/:sessionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  cancelSession(@Param('sessionId') sessionId: string): void {
    const session = this.streamingService.getSession(sessionId);
    if (!session) {
      throw new NotFoundException('Session not found');
    }
    this.streamingService.cancelSession(sessionId);
  }

  /**
   * Get session status
   */
  @Get('sessions/:sessionId')
  getSessionStatus(@Param('sessionId') sessionId: string): {
    sessionId: string;
    taskId: string;
    connectedAt: number;
    active: boolean;
  } {
    const session = this.streamingService.getSession(sessionId);
    if (!session) {
      throw new NotFoundException('Session not found');
    }
    return {
      sessionId: session.sessionId,
      taskId: session.taskId,
      connectedAt: session.connectedAt,
      active: true,
    };
  }

  /**
   * List active sessions
   */
  @Get('sessions')
  listSessions(): {
    sessions: Array<{ sessionId: string; taskId: string; connectedAt: number }>;
  } {
    const sessions = this.streamingService.getActiveSessions();
    return {
      sessions: sessions.map((s) => ({
        sessionId: s.sessionId,
        taskId: s.taskId,
        connectedAt: s.connectedAt,
      })),
    };
  }

  /**
   * Get available tools for streaming
   */
  @Get('tools')
  listTools(): {
    tools: Array<{ name: string; description: string; category: string }>;
  } {
    const tools = this.toolRegistry.getToolDefinitions();
    return {
      tools: tools.map((t) => ({
        name: t.name,
        description: t.description,
        category: t.category,
      })),
    };
  }
}
