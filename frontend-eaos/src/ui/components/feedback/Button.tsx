import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

const VARIANT_STYLES = {
  primary:
    'bg-state-info text-white hover:bg-state-info/90 active:bg-state-info/80',
  secondary:
    'bg-canvas-200 text-canvas-900 hover:bg-canvas-300 dark:bg-canvas-700 dark:text-canvas-50 dark:hover:bg-canvas-600',
  outline:
    'border border-canvas-300 bg-transparent hover:bg-canvas-100 dark:border-canvas-600 dark:hover:bg-canvas-800',
  ghost:
    'bg-transparent hover:bg-canvas-100 dark:hover:bg-canvas-800',
  danger:
    'bg-state-critical text-white hover:bg-state-critical/90 active:bg-state-critical/80',
} as const;

const SIZE_STYLES = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
  lg: 'h-10 px-6 text-base gap-2',
} as const;

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-[8px] font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-state-info focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        VARIANT_STYLES[variant],
        SIZE_STYLES[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
