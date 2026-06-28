'use client';

import { Bot, User } from 'lucide-react';

export type ResourceMemberKind = 'human' | 'ai';

export interface AvatarMemberCardProps {
  id: string;
  name: string;
  /** Role for humans; status / role for AI employees. */
  subtitle?: string | null;
  kind: ResourceMemberKind;
  /** Optional badge (e.g. "Owner", "Lead"). */
  badge?: string | null;
  /** Optional click handler — links to the member's workspace. */
  onClick?: () => void;
}

/**
 * AvatarMemberCard — the canonical "human OR AI" card.
 *
 * Per `EAOS-NUWS-principles.md` §2.5: the Resources panel uses an
 * identical avatar card for the human team AND the AI team. Same shape,
 * same layout, same click behaviour. The only visual differentiator is
 * the icon (User vs Bot) and the subtle accent line colour.
 *
 * SOLID: SRP — this component renders ONE member. It has no idea what a
 * "team" is. Composition (parent) handles grouping.
 */
export function AvatarMemberCard({
  id,
  name,
  subtitle,
  kind,
  badge,
  onClick,
}: AvatarMemberCardProps) {
  const Icon = kind === 'ai' ? Bot : User;
  const accent =
    kind === 'ai'
      ? 'from-blue-500/20 to-violet-500/20 ring-blue-400/30'
      : 'from-emerald-500/20 to-teal-500/20 ring-emerald-400/30';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Open ${name}`}
      className={`group relative flex w-full items-center gap-3 rounded-md border border-canvas-200 bg-gradient-to-r ${accent} p-3 text-left transition-colors hover:bg-canvas-50 dark:border-canvas-700 dark:hover:bg-canvas-900`}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-canvas-100 ring-1 ring-inset dark:bg-canvas-800">
        <Icon
          className={`h-5 w-5 ${kind === 'ai' ? 'text-blue-600 dark:text-blue-400' : 'text-emerald-600 dark:text-emerald-400'}`}
          aria-hidden
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-canvas-900 dark:text-canvas-50">
            {name}
          </span>
          {badge ? (
            <span className="rounded-full bg-canvas-200 px-2 py-0.5 text-xs text-canvas-700 dark:bg-canvas-700 dark:text-canvas-300">
              {badge}
            </span>
          ) : null}
        </div>
        {subtitle ? (
          <div className="truncate text-xs text-canvas-500 dark:text-canvas-400">
            {subtitle}
          </div>
        ) : null}
      </div>
    </button>
  );
}