import { cn } from '../../lib/cn';

interface LoadingStateProps {
  label?: string;
  className?: string;
}

export function LoadingState({
  label = 'Loading…',
  className,
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 p-8',
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <div className="relative h-8 w-8">
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-canvas-200 dark:border-canvas-700 border-t-state-info" />
      </div>
      <span className="text-sm text-canvas-500 dark:text-canvas-400">
        {label}
      </span>
    </div>
  );
}
