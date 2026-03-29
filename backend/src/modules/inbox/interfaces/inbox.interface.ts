/**
 * Inbox Module - Interface Segregation
 *
 * Following SOLID principles for unified inbox notifications
 */

// ─── Inbox Notifier Interface ───────────────────────────────────────────────

/**
 * Interface for sending notifications to various channels
 * Single Responsibility: Only handles notification delivery
 */
export interface IInboxNotifier {
  /**
   * Send a notification to a user
   */
  notify(userId: string, item: InboxItemInput): Promise<void>;

  /**
   * Send multiple notifications to a user
   */
  notifyBatch(userId: string, items: InboxItemInput[]): Promise<void>;

  /**
   * Send to multiple channels (inbox, email, slack, etc.)
   */
  notifyMultiChannel(
    userId: string,
    item: InboxItemInput,
    channels: string[],
  ): Promise<void>;
}

/**
 * Input for creating an inbox item
 */
export interface InboxItemInput {
  kind: InboxKind;
  title: string;
  body?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  entityType: string;
  entityId: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Inbox item kinds
 */
export type InboxKind =
  | 'APPROVAL'
  | 'FAILED_TASK'
  | 'AGENT_ALERT'
  | 'BUDGET_ALERT'
  | 'MENTION'
  | 'SYSTEM';

/**
 * Inbox item status
 */
export type InboxStatus = 'UNREAD' | 'READ' | 'ARCHIVED' | 'DISMISSED';

// ─── Inbox Repository Interface ──────────────────────────────────────────────

/**
 * Interface for inbox item persistence
 * Single Responsibility: Only handles InboxItem CRUD
 */
export interface IInboxRepository {
  /**
   * Create a new inbox item
   */
  create(
    tenantId: string,
    userId: string,
    input: InboxItemInput,
  ): Promise<InboxItem>;

  /**
   * Find all items for a user
   */
  findByUser(
    tenantId: string,
    userId: string,
    options?: FindInboxOptions,
  ): Promise<InboxItem[]>;

  /**
   * Find item by ID
   */
  findById(id: string): Promise<InboxItem | null>;

  /**
   * Mark item as read
   */
  markRead(id: string, userId: string): Promise<void>;

  /**
   * Mark item as archived
   */
  markArchived(id: string, userId: string): Promise<void>;

  /**
   * Mark all items as read for a user
   */
  markAllRead(tenantId: string, userId: string): Promise<void>;

  /**
   * Get unread count for a user
   */
  getUnreadCount(tenantId: string, userId: string): Promise<number>;

  /**
   * Delete old archived items
   */
  cleanupOldItems(olderThanDays: number): Promise<number>;
}

/**
 * Options for finding inbox items
 */
export interface FindInboxOptions {
  status?: InboxStatus;
  kind?: InboxKind;
  limit?: number;
  offset?: number;
}

/**
 * Inbox item structure
 */
export interface InboxItem {
  id: string;
  tenantId: string;
  userId: string;
  kind: InboxKind;
  title: string;
  body?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: InboxStatus;
  entityType: string;
  entityId: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
  readAt?: Date;
  archivedAt?: Date;
  createdAt: Date;
}
