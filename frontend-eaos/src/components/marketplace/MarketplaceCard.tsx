'use client';

/**
 * MarketplaceCard — unified card for the 8 marketplace tabs.
 *
 * Phase 7, Task 7.14 (per `EAOS-implementation-plan.md` §11.2).
 *
 * Renders a clickable card with icon, name, description, tier badge, and
 * install state. The whole card is a link to the detail page (when
 * `href` is provided) or a button (when `onClick` is provided).
 */

import Link from 'next/link';
import { Button, cn } from '@neurecore/ui';
import type { MarketplaceItem } from '@/core/hooks/marketplace';

interface MarketplaceCardProps {
  item: MarketplaceItem;
  href?: string;
  onClick?: () => void;
  rightAction?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  };
}

export function MarketplaceCard({ item, href, onClick, rightAction }: MarketplaceCardProps) {
  const body = (
    <div
      className={cn(
        'group relative flex h-full flex-col gap-3 rounded-xl border p-4 transition',
        'border-canvas-300 bg-canvas-50 hover:border-canvas-400 hover:shadow-sm',
        'dark:border-canvas-700 dark:bg-canvas-900 dark:hover:border-canvas-600',
      )}
      style={{ borderLeftColor: item.color, borderLeftWidth: 4 }}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg"
          style={{ backgroundColor: `${item.color}22`, color: item.color }}
          aria-hidden
        >
          <span className="font-mono text-sm uppercase">{item.icon.slice(0, 2)}</span>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-canvas-900 dark:text-canvas-50">
            {item.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-xs text-canvas-600 dark:text-canvas-300">
            {item.shortDescription || item.description || '—'}
          </p>
        </div>
        {item.installed ? (
          <span className="shrink-0 rounded-full bg-state-healthy/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-state-healthy">
            Installed
          </span>
        ) : null}
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 pt-2">
        <div className="flex flex-wrap gap-1.5">
          {item.tierRequired ? (
            <span
              className={cn(
                'rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide',
                item.tierRequired === 'ENTERPRISE'
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200'
                  : item.tierRequired === 'PRO'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                    : 'bg-canvas-200 text-canvas-700 dark:bg-canvas-700 dark:text-canvas-200',
              )}
            >
              {item.tierRequired}
            </span>
          ) : null}
          {item.category ? (
            <span className="rounded bg-canvas-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-canvas-600 dark:bg-canvas-800 dark:text-canvas-300">
              {item.category}
            </span>
          ) : null}
        </div>
        {rightAction ? (
          <Button
            type="button"
            variant={rightAction.variant ?? 'primary'}
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              rightAction.onClick();
            }}
          >
            {rightAction.label}
          </Button>
        ) : null}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block focus:outline-none">
        {body}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="block w-full text-left focus:outline-none"
      >
        {body}
      </button>
    );
  }
  return body;
}