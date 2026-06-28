import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export type EmptyStateVariant =
  | 'firstRun'
  | 'noData'
  | 'noPermission'
  | 'noResults'
  | 'integrationDisconnected'
  | 'aiGeneratedNothing';

interface EmptyStateProps {
  variant: EmptyStateVariant;
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

const VARIANT_CONTENT: Record<
  EmptyStateVariant,
  { title: string; description: string; actionLabel?: string }
> = {
  firstRun: {
    title: 'Welcome',
    description: 'Get started by creating your first item here.',
    actionLabel: 'Create',
  },
  noData: {
    title: 'Nothing here yet',
    description: 'Start by adding your first item.',
    actionLabel: 'Add',
  },
  noPermission: {
    title: 'Access denied',
    description: "You don't have permission to view this content.",
    actionLabel: 'Request access',
  },
  noResults: {
    title: 'No matches found',
    description: 'Try adjusting your search or filters.',
    actionLabel: 'Clear filters',
  },
  integrationDisconnected: {
    title: 'Integration disconnected',
    description: 'Reconnect to restore functionality.',
    actionLabel: 'Reconnect',
  },
  aiGeneratedNothing: {
    title: 'AI found nothing notable',
    description: 'Try different parameters or inputs.',
    actionLabel: 'Try again',
  },
};

function Illustration({
  variant,
}: {
  variant: EmptyStateVariant;
}): ReactNode {
  const illustrations: Record<EmptyStateVariant, ReactNode> = {
    firstRun: (
      <svg
        width="80"
        height="80"
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="12"
          y="16"
          width="56"
          height="48"
          rx="4"
          className="fill-canvas-100 dark:fill-canvas-800"
        />
        <rect
          x="20"
          y="24"
          width="40"
          height="4"
          rx="2"
          className="fill-canvas-300 dark:fill-canvas-600"
        />
        <rect
          x="20"
          y="32"
          width="28"
          height="4"
          rx="2"
          className="fill-canvas-200 dark:fill-canvas-700"
        />
        <circle
          cx="40"
          cy="52"
          r="12"
          className="fill-state-info/20"
        />
        <path
          d="M40 46v12M34 52h12"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="text-state-info"
        />
      </svg>
    ),
    noData: (
      <svg
        width="80"
        height="80"
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="12"
          y="20"
          width="56"
          height="40"
          rx="4"
          className="fill-canvas-100 dark:fill-canvas-800"
        />
        <rect
          x="20"
          y="32"
          width="40"
          height="4"
          rx="2"
          className="fill-canvas-200 dark:fill-canvas-700"
        />
        <rect
          x="20"
          y="40"
          width="32"
          height="4"
          rx="2"
          className="fill-canvas-200 dark:fill-canvas-700"
        />
        <circle
          cx="56"
          cy="56"
          r="12"
          className="fill-canvas-50 dark:fill-canvas-900 stroke-canvas-300 dark:stroke-canvas-600"
          strokeWidth="2"
        />
        <path
          d="M52 56h8M56 52v8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="text-canvas-400"
        />
      </svg>
    ),
    noPermission: (
      <svg
        width="80"
        height="80"
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="16"
          y="28"
          width="48"
          height="36"
          rx="4"
          className="fill-canvas-100 dark:fill-canvas-800"
        />
        <path
          d="M40 20c8.837 0 16 5.373 16 12s-7.163 12-16 12-16-5.373-16-12 7.163-12 16-12z"
          className="fill-canvas-100 dark:fill-canvas-800"
        />
        <circle
          cx="40"
          cy="32"
          r="8"
          className="fill-canvas-50 dark:fill-canvas-900 stroke-canvas-300 dark:stroke-canvas-600"
          strokeWidth="2"
        />
        <rect
          x="36"
          y="44"
          width="8"
          height="12"
          rx="4"
          className="fill-state-warning"
        />
      </svg>
    ),
    noResults: (
      <svg
        width="80"
        height="80"
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="36"
          cy="36"
          r="20"
          className="fill-canvas-100 dark:fill-canvas-800"
        />
        <circle
          cx="36"
          cy="36"
          r="20"
          className="stroke-canvas-300 dark:stroke-canvas-600"
          strokeWidth="2"
        />
        <path
          d="M50 50l16 16"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          className="text-canvas-400"
        />
        <path
          d="M28 36h16M36 28v16"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="text-canvas-400"
        />
      </svg>
    ),
    integrationDisconnected: (
      <svg
        width="80"
        height="80"
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="12"
          y="24"
          width="24"
          height="32"
          rx="4"
          className="fill-canvas-100 dark:fill-canvas-800"
        />
        <rect
          x="44"
          y="24"
          width="24"
          height="32"
          rx="4"
          className="fill-canvas-100 dark:fill-canvas-800"
        />
        <path
          d="M36 40h8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="4 4"
          className="text-state-warning"
        />
        <path
          d="M20 36h8M52 36h8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="text-canvas-400"
        />
      </svg>
    ),
    aiGeneratedNothing: (
      <svg
        width="80"
        height="80"
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="40"
          cy="40"
          r="24"
          className="fill-state-info/10"
        />
        <path
          d="M40 24c8.837 0 16 5.373 16 12s-7.163 12-16 12-16-5.373-16-12 7.163-12 16-12z"
          className="fill-canvas-100 dark:fill-canvas-800"
        />
        <circle
          cx="40"
          cy="36"
          r="6"
          className="fill-canvas-200 dark:fill-canvas-700"
        />
        <path
          d="M32 52c0 4.418 3.582 8 8 8s8-3.582 8-8"
          className="stroke-canvas-300 dark:stroke-canvas-600"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  };

  return illustrations[variant];
}

export function EmptyState({
  variant,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const content = VARIANT_CONTENT[variant];
  const displayTitle = title ?? content.title;
  const displayDescription = description ?? content.description;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-8',
        className,
      )}
    >
      <div className="mb-4">
        <Illustration variant={variant} />
      </div>
      <h3 className="text-base font-semibold text-canvas-900 dark:text-canvas-50">
        {displayTitle}
      </h3>
      <p className="mt-1 text-sm text-canvas-500 dark:text-canvas-400">
        {displayDescription}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
