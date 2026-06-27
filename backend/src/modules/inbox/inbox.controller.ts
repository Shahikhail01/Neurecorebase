/**
 * Inbox Controller
 *
 * REST API endpoints for unified inbox
 * Following SOLID: Single Responsibility - only handles HTTP
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ApiCommon } from '../../common/decorators/api-common.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InboxService } from './inbox.service';
import { IsIn, IsOptional, IsString } from 'class-validator';

class SendNotificationDto {
  @IsString()
  userId: string;

  @IsString()
  kind:
    | 'APPROVAL'
    | 'FAILED_TASK'
    | 'AGENT_ALERT'
    | 'BUDGET_ALERT'
    | 'MENTION'
    | 'SYSTEM';

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

  @IsString()
  entityType: string;

  @IsString()
  entityId: string;

  @IsOptional()
  @IsString()
  actionUrl?: string;
}

/**
 * Phase 1 Gap 6 — added URI versioning (`/api/v1/inbox`) and
 * `resolveTenantId()` helper for SUPER_ADMIN cross-tenant access.
 */
@Controller({ path: 'inbox', version: '1' })
@ApiCommon('inbox')
@UseGuards(JwtAuthGuard)
export class InboxController {
  constructor(private readonly inboxService: InboxService) {}

  private resolveTenantId(
    user: { tenantId?: string; role?: string },
    tenantId?: string,
  ): string {
    if (user.role === 'SUPER_ADMIN') {
      if (!tenantId) {
        throw new BadRequestException('tenantId is required for SUPER_ADMIN');
      }
      return tenantId;
    }
    if (!user.tenantId) throw new ForbiddenException('Tenant context required');
    return user.tenantId;
  }

  /**
   * Get all inbox items for current user
   * GET /api/v1/inbox
   */
  @Get()
  async getInbox(
    @Req() req: { user: { tenantId: string; id: string; role?: string } },
    @Query('status') status?: 'UNREAD' | 'READ' | 'ARCHIVED',
    @Query('kind') kind?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('tenantId') tenantId?: string,
  ) {
    return this.inboxService.getInbox(
      this.resolveTenantId(req.user, tenantId),
      req.user.id,
      {
        status,
        kind,
        limit: limit ? parseInt(limit, 10) : undefined,
        offset: offset ? parseInt(offset, 10) : undefined,
      },
    );
  }

  /**
   * Get inbox summary (unread count)
   * GET /api/v1/inbox/summary
   */
  @Get('summary')
  async getInboxSummary(
    @Req() req: { user: { tenantId: string; id: string; role?: string } },
    @Query('tenantId') tenantId?: string,
  ) {
    return this.inboxService.getInboxSummary(
      this.resolveTenantId(req.user, tenantId),
      req.user.id,
    );
  }

  /**
   * Get single inbox item
   * GET /api/v1/inbox/:id
   */
  @Get(':id')
  async getInboxItem(@Param('id') id: string) {
    return this.inboxService.getInboxItem(id);
  }

  /**
   * Mark item as read
   * PATCH /api/v1/inbox/:id/read
   */
  @Patch(':id/read')
  async markRead(
    @Param('id') id: string,
    @Req() req: { user: { id: string } },
  ) {
    return this.inboxService.markRead(id, req.user.id);
  }

  /**
   * Mark item as archived
   * PATCH /api/v1/inbox/:id/archive
   */
  @Patch(':id/archive')
  async markArchived(
    @Param('id') id: string,
    @Req() req: { user: { id: string } },
  ) {
    return this.inboxService.markArchived(id, req.user.id);
  }

  /**
   * Mark all items as read
   * POST /api/v1/inbox/mark-all-read
   */
  @Post('mark-all-read')
  async markAllRead(
    @Req() req: { user: { tenantId: string; id: string; role?: string } },
    @Query('tenantId') tenantId?: string,
  ) {
    return this.inboxService.markAllRead(
      this.resolveTenantId(req.user, tenantId),
      req.user.id,
    );
  }

  /**
   * Send notification to a user (admin only)
   * POST /api/v1/inbox/send
   */
  @Post('send')
  async sendNotification(
    @Body() dto: SendNotificationDto,
    @Req() req: { user: { tenantId: string; role?: string } },
    @Query('tenantId') tenantId?: string,
  ) {
    return this.inboxService.sendNotification(
      this.resolveTenantId(req.user, tenantId),
      dto.userId,
      {
        kind: dto.kind,
        title: dto.title,
        body: dto.body,
        priority: dto.priority,
        entityType: dto.entityType,
        entityId: dto.entityId,
        actionUrl: dto.actionUrl,
      },
    );
  }

  /**
   * Broadcast notification to multiple users (admin only)
   * POST /api/v1/inbox/broadcast
   */
  @Post('broadcast')
  async broadcastNotification(
    @Body() body: { userIds: string[]; notification: SendNotificationDto },
    @Req() req: { user: { tenantId: string; role?: string } },
    @Query('tenantId') tenantId?: string,
  ) {
    return this.inboxService.broadcastNotification(
      this.resolveTenantId(req.user, tenantId),
      body.userIds,
      {
        kind: body.notification.kind,
        title: body.notification.title,
        body: body.notification.body,
        priority: body.notification.priority,
        entityType: body.notification.entityType,
        entityId: body.notification.entityId,
        actionUrl: body.notification.actionUrl,
      },
    );
  }

  /**
   * Cleanup old archived items (admin only)
   * DELETE /api/v1/inbox/cleanup
   */
  @Delete('cleanup')
  async cleanupOldItems(@Query('days') days?: string) {
    return this.inboxService.cleanupOldItems(days ? parseInt(days, 10) : 30);
  }
}
