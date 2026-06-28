'use client';

/**
 * InstallPackDialog — pre-flight install dialog with Mission Feed preview.
 *
 * Phase 7, Task 7.15 (per `EAOS-NUWS-principles.md` §5.4 — "after install,
 * you'll see…").
 *
 * Shows:
 *   - Validation blockers (tier, deps, conflicts)
 *   - Projected impact counts
 *   - Mission Feed preview items
 *   - Theming impact accent color
 *   - Accept-warnings toggle (when applicable)
 *
 * Calls `useInstallSolutionPack` on confirm.
 */

import { useState } from 'react';
import {
  Button,
  ErrorState,
  LoadingState,
  cn,
} from '@neurecore/ui';
import {
  useInstallSolutionPack,
  useSolutionPackPreview,
  type PackValidationFailure,
} from '@/core/hooks/solution-packs';

interface InstallPackDialogProps {
  tenantId: string | undefined;
  slug: string;
  packName: string;
  onClose: () => void;
  onInstalled?: () => void;
}

const BLOCKER_TONE: Record<PackValidationFailure['code'], string> = {
  PACK_NOT_FOUND: 'border-state-critical/40 bg-state-critical/5 text-state-critical',
  PACK_NOT_PUBLISHED: 'border-state-warning/40 bg-state-warning/5 text-state-warning',
  TIER_INSUFFICIENT: 'border-state-warning/40 bg-state-warning/5 text-state-warning',
  TIER_REQUIRED: 'border-state-warning/40 bg-state-warning/5 text-state-warning',
  DEPENDENCY_MISSING: 'border-state-info/40 bg-state-info/5 text-state-info',
  CONFLICT: 'border-state-critical/40 bg-state-critical/5 text-state-critical',
  ALREADY_INSTALLED: 'border-state-healthy/40 bg-state-healthy/5 text-state-healthy',
  OWNER_REQUIRED: 'border-state-warning/40 bg-state-warning/5 text-state-warning',
  INTEGRATIONS_MISSING: 'border-state-info/40 bg-state-info/5 text-state-info',
};

export function InstallPackDialog({
  tenantId,
  slug,
  packName,
  onClose,
  onInstalled,
}: InstallPackDialogProps) {
  const previewQuery = useSolutionPackPreview(tenantId, slug);
  const install = useInstallSolutionPack(tenantId);
  const [acceptWarnings, setAcceptWarnings] = useState(false);

  if (previewQuery.isLoading) {
    return (
      <div className="p-6">
        <LoadingState label="Checking pre-flight…" />
      </div>
    );
  }

  if (previewQuery.isError || !previewQuery.data) {
    return (
      <div className="p-6">
        <ErrorState
          error={previewQuery.error ?? 'Could not load install preview. Please retry.'}
          onRetry={() => previewQuery.refetch()}
        />
      </div>
    );
  }

  const { pack, alreadyInstalled, canInstall, blockers, impact } = previewQuery.data;
  const onlyWarnings = blockers.every((b) =>
    ['DEPENDENCY_MISSING', 'INTEGRATIONS_MISSING', 'ALREADY_INSTALLED'].includes(b.code),
  );
  const blockingFailures = blockers.filter(
    (b) => b.code !== 'ALREADY_INSTALLED' && b.code !== 'DEPENDENCY_MISSING' && b.code !== 'INTEGRATIONS_MISSING',
  );
  const showWarningsToggle = onlyWarnings && blockers.length > 0 && !alreadyInstalled;

  const submit = async () => {
    const result = await install.mutateAsync({ slug, acceptWarnings });
    onInstalled?.();
    void result;
  };

  return (
    <div className="flex max-h-[80vh] flex-col gap-4 overflow-y-auto p-6">
      <div>
        <h2 className="text-lg font-semibold text-canvas-900 dark:text-canvas-50">
          {alreadyInstalled ? `${packName} is already installed` : `Install ${packName}`}
        </h2>
        <p className="mt-1 text-sm text-canvas-600 dark:text-canvas-300">
          {alreadyInstalled
            ? 'Re-installing the same version is a no-op (idempotent).'
            : 'After install, the pack is active in your workspace.'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <ImpactChip label="Entity subtypes" value={impact.newEntitySubtypes} />
        <ImpactChip label="Widgets" value={impact.newWidgets} />
        <ImpactChip label="AI actions" value={impact.newAiActions} />
        <ImpactChip label="Knowledge" value={impact.newKnowledgeEntries} />
        <ImpactChip label="Integrations" value={impact.newIntegrations} />
        <ImpactChip label="Workflows" value={impact.newWorkflowTemplates} />
      </div>

      {impact.themingImpact?.accentColor ? (
        <div className="flex items-center gap-3 rounded-lg border border-canvas-300 bg-canvas-50 px-3 py-2 dark:border-canvas-700 dark:bg-canvas-900">
          <div
            className="h-6 w-6 rounded"
            style={{ backgroundColor: impact.themingImpact.accentColor }}
            aria-hidden
          />
          <p className="text-xs text-canvas-600 dark:text-canvas-300">
            {impact.themingImpact.rationale ?? 'Workspace accent color will change.'}
          </p>
        </div>
      ) : null}

      {impact.missionFeedPreview.length > 0 ? (
        <div className="rounded-lg border border-canvas-300 bg-canvas-50 p-3 dark:border-canvas-700 dark:bg-canvas-900">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-canvas-600 dark:text-canvas-300">
            After install, you&apos;ll see…
          </h4>
          <ul className="mt-2 space-y-1.5">
            {impact.missionFeedPreview.map((m, i) => (
              <li
                key={i}
                className="flex items-start gap-2 rounded border border-canvas-200 bg-white p-2 text-xs dark:border-canvas-800 dark:bg-canvas-950"
              >
                <span
                  className={cn(
                    'mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full',
                    m.priority === 'HIGH'
                      ? 'bg-state-critical'
                      : m.priority === 'MEDIUM'
                        ? 'bg-state-info'
                        : 'bg-canvas-400',
                  )}
                  aria-hidden
                />
                <div>
                  <div className="font-medium text-canvas-900 dark:text-canvas-50">{m.title}</div>
                  <div className="mt-0.5 text-canvas-600 dark:text-canvas-300">{m.description}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {blockers.length > 0 ? (
        <div className="space-y-1.5">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-canvas-600 dark:text-canvas-300">
            {blockingFailures.length > 0 ? 'Cannot install' : 'Warnings'}
          </h4>
          {blockers.map((b) => (
            <div
              key={b.code}
              className={cn(
                'rounded-lg border px-3 py-2 text-xs',
                BLOCKER_TONE[b.code] ?? 'border-canvas-300 bg-canvas-50 text-canvas-700',
              )}
            >
              <span className="font-semibold">{b.code}</span>
              <span className="ml-2">{b.message}</span>
            </div>
          ))}
        </div>
      ) : null}

      {showWarningsToggle ? (
        <label className="flex items-center gap-2 text-xs text-canvas-700 dark:text-canvas-200">
          <input
            type="checkbox"
            checked={acceptWarnings}
            onChange={(e) => setAcceptWarnings(e.target.checked)}
            className="h-4 w-4 rounded border-canvas-300"
          />
          <span>I understand the warnings and want to proceed.</span>
        </label>
      ) : null}

      {install.isError ? (
        <ErrorState
          error={
            (install.error as { message?: string })?.message ??
            'The pack could not be installed. Try again or contact support.'
          }
        />
      ) : null}

      <div className="mt-auto flex items-center justify-end gap-2 border-t border-canvas-200 pt-3 dark:border-canvas-800">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={submit}
          disabled={
            !canInstall ||
            install.isPending ||
            (blockingFailures.length > 0) ||
            (showWarningsToggle && !acceptWarnings)
          }
        >
          {install.isPending ? 'Installing…' : alreadyInstalled ? 'Re-install' : 'Install'}
        </Button>
      </div>
    </div>
  );
}

function ImpactChip({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-canvas-200 bg-white p-2 text-center dark:border-canvas-800 dark:bg-canvas-950">
      <div className="text-lg font-semibold text-canvas-900 dark:text-canvas-50">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-canvas-600 dark:text-canvas-300">
        {label}
      </div>
    </div>
  );
}