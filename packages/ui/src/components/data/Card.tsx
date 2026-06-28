import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  surface?: 'flat' | 'raised' | 'bordered';
  children: ReactNode;
}

const PAD = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
} as const;

const SURFACE = {
  flat: 'bg-canvas-100 dark:bg-canvas-900',
  raised: 'bg-canvas-50 dark:bg-canvas-950 shadow-sm border border-canvas-200/60 dark:border-canvas-800/60',
  bordered: 'border border-canvas-200 dark:border-canvas-700',
} as const;

export function Card({
  padding = 'md',
  surface = 'raised',
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg',
        PAD[padding],
        SURFACE[surface],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}