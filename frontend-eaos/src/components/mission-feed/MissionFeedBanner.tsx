'use client';

import { useMissionFeed, useDismissMissionFeedItem } from '@/core/hooks/mission-feed';
import { isFeatureEnabled } from '@/config/feature-flags';
import type { MissionFeedItem } from '@/core/hooks/mission-feed';
import type { UserRole } from '@neurecore/ui/types';

interface MissionFeedBannerProps {
  tenantId: string;
  role?: UserRole;
}

/**
 * MissionFeedBanner — Phase 3, Task 3.18.
 *
 * Dashboard-only persistent banner per NUWS §5.4. Surfaces the top
 * AI-prioritized item needing user attention. The flag `USE_MISSION_FEED`
 * gates the feature; defaults to ON per `05-phase-tracker.md`.
 */
export function MissionFeedBanner({ tenantId, role }: MissionFeedBannerProps) {
  if (!isFeatureEnabled('USE_MISSION_FEED', { role })) return null;

  const { data } = useMissionFeed(tenantId);
  // Backend returns `{ items, pagination }` shape per the legacy mission-feed
  // hook contract; the pages may have data or items depending on the path.
  const top: MissionFeedItem | undefined =
    (data?.pages?.[0] as unknown as { items?: MissionFeedItem[] })?.items?.[0] ??
    (data?.pages?.[0] as unknown as { data?: MissionFeedItem[] })?.data?.[0];
  if (!top || top.dismissed) return null;

  return <MissionFeedItemView item={top} tenantId={tenantId} />;
}

function MissionFeedItemView({
  item,
  tenantId,
}: {
  item: MissionFeedItem;
  tenantId: string;
}) {
  const dismiss = useDismissMissionFeedItem(tenantId);
  const color =
    item.priority === 'critical'
      ? 'border-state-error bg-state-error/10'
      : item.priority === 'high'
        ? 'border-state-warning bg-state-warning/10'
        : 'border-state-info bg-state-info/10';

  return (
    <div
      role="status"
      className={`mb-4 flex items-start justify-between gap-3 rounded-md border ${color} p-3`}
    >
      <div>
        <p className="text-sm font-medium text-canvas-900 dark:text-canvas-50">
          {item.title}
        </p>
        {item.description && (
          <p className="mt-1 text-xs text-canvas-600 dark:text-canvas-400">
            {item.description}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => dismiss.mutate(item.id)}
        disabled={dismiss.isPending}
        className="shrink-0 rounded-md border border-canvas-200 bg-canvas-50 px-2 py-1 text-xs text-canvas-700 hover:bg-canvas-100 disabled:opacity-50 dark:border-canvas-700 dark:bg-canvas-900 dark:text-canvas-300"
      >
        {dismiss.isPending ? '…' : 'Dismiss'}
      </button>
    </div>
  );
}