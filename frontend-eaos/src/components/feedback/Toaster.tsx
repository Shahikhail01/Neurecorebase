/**
 * Toaster — Phase 1, Task 1.16.
 *
 * Per `EAOS-frontend-data-layer.md` §8.3: the old frontend-tenant had a
 * `ToastStrategy` that fired `window` CustomEvent `hq:toast` with NO
 * listener, so toasts were silently dropped. This component is the
 * single listener that actually renders them.
 *
 * For now this is a simple in-component toast queue (no external lib).
 * When `packages/ui/` ships (Task 1.12), this becomes a thin wrapper
 * around the shared <Toaster />.
 */

'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastVariant = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  durationMs: number;
}

const VARIANT_STYLES: Record<ToastVariant, { icon: ReactNode; bg: string; iconColor: string }> = {
  success: {
    icon: <CheckCircle2 className="size-5" />,
    bg: 'bg-state-healthy/10 border-state-healthy/30',
    iconColor: 'text-state-healthy',
  },
  error: {
    icon: <AlertCircle className="size-5" />,
    bg: 'bg-state-critical/10 border-state-critical/30',
    iconColor: 'text-state-critical',
  },
  info: {
    icon: <Info className="size-5" />,
    bg: 'bg-state-info/10 border-state-info/30',
    iconColor: 'text-state-info',
  },
  warning: {
    icon: <AlertCircle className="size-5" />,
    bg: 'bg-state-warning/10 border-state-warning/30',
    iconColor: 'text-state-warning',
  },
};

/**
 * Singleton toast API. Import `toast` from anywhere and call
 * `toast.success('Saved')`, `toast.error('Failed')`, etc.
 */
export const toast = {
  success: (title: string, description?: string) =>
    show({ title, description, variant: 'success', durationMs: 4000 }),
  error: (title: string, description?: string) =>
    show({ title, description, variant: 'error', durationMs: 8000 }),
  info: (title: string, description?: string) =>
    show({ title, description, variant: 'info', durationMs: 4000 }),
  warning: (title: string, description?: string) =>
    show({ title, description, variant: 'warning', durationMs: 6000 }),
};

function show(input: Omit<Toast, 'id'>) {
  const event = new CustomEvent('eaos:toast', { detail: input });
  window.dispatchEvent(event);
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as Omit<Toast, 'id'>;
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      setToasts((prev) => [...prev, { ...detail, id }]);
    };
    window.addEventListener('eaos:toast', handler);
    return () => window.removeEventListener('eaos:toast', handler);
  }, []);

  // Auto-dismiss
  useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map((t) =>
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== t.id));
      }, t.durationMs),
    );
    return () => timers.forEach(clearTimeout);
  }, [toasts]);

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-50 flex flex-col items-end gap-2 p-4 sm:right-0 sm:items-end sm:p-6"
    >
      {toasts.map((t) => {
        const style = VARIANT_STYLES[t.variant];
        return (
          <div
            key={t.id}
            role="status"
            className={cn(
              'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-md border p-4 shadow-lg backdrop-blur',
              style.bg,
              'bg-canvas-50/95 dark:bg-canvas-900/95',
            )}
          >
            <span className={cn('flex-shrink-0', style.iconColor)}>
              {style.icon}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-canvas-900 dark:text-canvas-50">
                {t.title}
              </p>
              {t.description && (
                <p className="mt-1 text-sm text-canvas-600 dark:text-canvas-400">
                  {t.description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() =>
                setToasts((prev) => prev.filter((x) => x.id !== t.id))
              }
              className="flex-shrink-0 text-canvas-400 hover:text-canvas-600 dark:hover:text-canvas-200"
              aria-label="Dismiss"
            >
              <X className="size-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
