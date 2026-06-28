import { AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/cn';
import { Button } from './Button';

interface ErrorStateProps {
  error: Error | string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ error, onRetry, className }: ErrorStateProps) {
  const message = typeof error === 'string' ? error : error.message;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 p-8 text-center',
        className,
      )}
      role="alert"
    >
      <div className="rounded-full bg-state-critical/10 p-3">
        <AlertCircle className="size-6 text-state-critical" />
      </div>
      <div>
        <p className="text-sm font-medium text-canvas-900 dark:text-canvas-50">
          Something went wrong
        </p>
        <p className="mt-1 text-sm text-canvas-500 dark:text-canvas-400">
          {message}
        </p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="size-4" />
          Try again
        </Button>
      )}
    </div>
  );
}
