import { Injectable, Logger } from '@nestjs/common';
import { PrismaInboxRepository } from './repositories/prisma-inbox.repository';
import { OpenClawInboxNotifier } from './notifiers/openclaw-inbox.notifier';
import { TenantContextService } from '../../common/context/tenant-context.service';
import type { InboxItemInput } from './interfaces/inbox.interface';

@Injectable()
export class InboxService {
  private readonly logger = new Logger(InboxService.name);

  constructor(
    private readonly repository: PrismaInboxRepository,
    private readonly notifier: OpenClawInboxNotifier,
    private readonly tenantContext: TenantContextService,
  ) {}

  async getInbox(userId: string, options?: {
    status?: 'UNREAD' | 'READ' | 'ARCHIVED';
    kind?: string;
    limit?: number;
    offset?: number;
  }) {
    return this.repository.findByUser(userId, {
      status: options?.status as any,
      kind: options?.kind as any,
      limit: options?.limit,
      offset: options?.offset,
    });
  }

  async getInboxSummary(userId: string) {
    const tenantId = this.tenantContext.tenantId;
    const [unread, total] = await Promise.all([
      this.repository.getUnreadCount(userId),
      this.repository.findByUser(userId, { limit: 1 }),
    ]);
    return {
      unreadCount: unread,
      totalCount: Array.isArray(total) ? total.length : 0,
    };
  }

  async sendNotification(userId: string, input: InboxItemInput) {
    const item = await this.repository.create(userId, input);
    await this.notifier.notify(userId, input);
    return item;
  }

  async broadcastNotification(userIds: string[], input: InboxItemInput) {
    const results = await Promise.allSettled(
      userIds.map((userId) => this.sendNotification(userId, input)),
    );
    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    this.logger.log(
      `Broadcast notification sent to ${successCount}/${userIds.length} users`,
    );
    return { successCount, totalCount: userIds.length };
  }

  async markRead(id: string, userId: string) {
    await this.repository.markRead(id, userId);
    return { success: true };
  }

  async markArchived(id: string, userId: string) {
    await this.repository.markArchived(id, userId);
    return { success: true };
  }

  async markAllRead(userId: string) {
    await this.repository.markAllRead(userId);
    return { success: true };
  }

  async getInboxItem(id: string) {
    return this.repository.findById(id);
  }

  async cleanupOldItems(olderThanDays = 30) {
    const count = await this.repository.cleanupOldItems(olderThanDays);
    this.logger.log(`Cleaned up ${count} old inbox items`);
    return { deletedCount: count };
  }

  async sendApprovalNotification(
    approverUserId: string,
    approvalId: string,
    title: string,
    requestedByName?: string,
  ) {
    return this.sendNotification(approverUserId, {
      kind: 'APPROVAL',
      title: `Approval Required: ${title}`,
      body: requestedByName
        ? `${requestedByName} is waiting for your approval`
        : 'An approval request requires your attention',
      priority: 'HIGH',
      entityType: 'ApprovalRequest',
      entityId: approvalId,
      actionUrl: `/approvals/${approvalId}`,
    });
  }

  async sendBudgetAlert(
    adminUserId: string,
    policyName: string,
    threshold: number,
    currentSpend: number,
    limit: number,
  ) {
    return this.sendNotification(adminUserId, {
      kind: 'BUDGET_ALERT',
      title: `Budget Alert: ${policyName}`,
      body: `Spending has reached ${threshold}% of limit ($${currentSpend.toFixed(2)} / $${limit.toFixed(2)})`,
      priority: threshold >= 90 ? 'URGENT' : 'HIGH',
      entityType: 'BudgetPolicy',
      entityId: policyName,
      actionUrl: `/costs/budgets`,
    });
  }

  async sendFailedTaskNotification(
    userId: string,
    taskId: string,
    taskTitle: string,
    errorMessage?: string,
  ) {
    return this.sendNotification(userId, {
      kind: 'FAILED_TASK',
      title: `Task Failed: ${taskTitle}`,
      body: errorMessage ?? 'A task failed to complete successfully',
      priority: 'HIGH',
      entityType: 'Task',
      entityId: taskId,
      actionUrl: `/tasks/${taskId}`,
    });
  }
}
