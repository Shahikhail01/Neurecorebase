'use client';

import { useEffect, type ReactNode } from 'react';
import type { EntityType } from '@neurecore/ui/types';
import { Can } from './Can';

interface AdministrationModalProps {
  open: boolean;
  onClose: () => void;
  type: EntityType;
  id: string;
}

/**
 * AdministrationModal — Phase 3, Task 3.16.
 *
 * Gear-icon modal in workspace header (NUWS §1.2). Houses permissions,
 * settings, audit config, billing, API keys, subscriptions, and timestamps
 * that previously lived in an Administration panel.
 */
export function AdministrationModal({
  open,
  onClose,
  type,
  id,
}: AdministrationModalProps): ReactNode {
  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Entity administration"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-lg border border-canvas-200 bg-canvas-0 p-6 shadow-xl dark:border-canvas-700 dark:bg-canvas-900"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-canvas-200 pb-3 dark:border-canvas-700">
          <h2 className="text-lg font-semibold">
            Administration · {type}/{id.slice(0, 8)}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-canvas-500 hover:bg-canvas-100 dark:hover:bg-canvas-800"
            aria-label="Close"
          >
            ✕
          </button>
        </header>

        <div className="mt-4 space-y-4">
          <Can permission="tenant.settings">
            <section>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-canvas-500">
                Settings
              </h3>
              <p className="mt-1 text-sm text-canvas-600 dark:text-canvas-400">
                Entity-specific configuration. Phase 3 ships the modal shell;
                settings UI ships in Phase 4.
              </p>
            </section>
          </Can>

          <Can permission="audit.read.tenant">
            <section>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-canvas-500">
                Audit configuration
              </h3>
              <p className="mt-1 text-sm text-canvas-600 dark:text-canvas-400">
                Audit logging preferences for this entity.
              </p>
            </section>
          </Can>

          <Can permission="tenant.billing">
            <section>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-canvas-500">
                Billing
              </h3>
              <p className="mt-1 text-sm text-canvas-600 dark:text-canvas-400">
                Subscription and usage details.
              </p>
            </section>
          </Can>

          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-canvas-500">
              Timestamps
            </h3>
            <p className="mt-1 text-sm text-canvas-600 dark:text-canvas-400">
              Created and modified timestamps live here (read-only; lifecycle
              history is in the Lifecycle panel).
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}