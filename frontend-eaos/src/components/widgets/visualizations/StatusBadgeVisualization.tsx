'use client';

import { Card, Title, Text } from '@tremor/react';

export type StatusKind =
  | 'HEALTHY'
  | 'WARNING'
  | 'CRITICAL'
  | 'INFO'
  | 'NEUTRAL'
  | 'OK';

export interface StatusBadgeVisualizationProps {
  title: string;
  subtitle?: string;
  status: StatusKind | string;
  detail?: string;
  loading?: boolean;
  error?: Error | null;
}

function colorClasses(status: string): { dot: string; text: string; bg: string } {
  switch (status.toUpperCase()) {
    case 'HEALTHY':
    case 'OK':
    case 'PASS':
    case 'ACTIVE':
    case 'COMPLETED':
    case 'COMPLIANT':
      return {
        dot: 'bg-emerald-500',
        text: 'text-emerald-700 dark:text-emerald-300',
        bg: 'bg-emerald-50 dark:bg-emerald-900/30',
      };
    case 'WARNING':
    case 'AT_RISK':
    case 'PAUSED':
    case 'PENDING':
      return {
        dot: 'bg-amber-500',
        text: 'text-amber-700 dark:text-amber-300',
        bg: 'bg-amber-50 dark:bg-amber-900/30',
      };
    case 'CRITICAL':
    case 'FAIL':
    case 'OFF_TRACK':
    case 'SUSPENDED':
    case 'NON_COMPLIANT':
      return {
        dot: 'bg-rose-500',
        text: 'text-rose-700 dark:text-rose-300',
        bg: 'bg-rose-50 dark:bg-rose-900/30',
      };
    case 'INFO':
      return {
        dot: 'bg-blue-500',
        text: 'text-blue-700 dark:text-blue-300',
        bg: 'bg-blue-50 dark:bg-blue-900/30',
      };
    case 'NEUTRAL':
    case 'DRAFT':
    default:
      return {
        dot: 'bg-canvas-400',
        text: 'text-canvas-700 dark:text-canvas-300',
        bg: 'bg-canvas-50 dark:bg-canvas-800',
      };
  }
}

/**
 * StatusBadge visualization — colored status indicator.
 *
 * Minimal tile (h=1 row) suitable for a dashboard corner.
 */
export function StatusBadgeVisualization({
  title,
  subtitle,
  status,
  detail,
  loading,
  error,
}: StatusBadgeVisualizationProps) {
  if (error) {
    return (
      <Card>
        <Text className="text-state-critical">{error.message}</Text>
      </Card>
    );
  }
  const colors = colorClasses(status);
  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <Title>{title}</Title>
          {subtitle ? (
            <Text className="text-xs text-canvas-500 dark:text-canvas-400">
              {subtitle}
            </Text>
          ) : null}
        </div>
        <span
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${colors.bg} ${colors.text}`}
        >
          <span className={`h-2 w-2 rounded-full ${colors.dot}`} aria-hidden />
          {loading ? '…' : status}
        </span>
      </div>
      {detail ? (
        <Text className="mt-2 text-xs text-canvas-500 dark:text-canvas-400">
          {detail}
        </Text>
      ) : null}
    </Card>
  );
}