'use client';

import { useState, useMemo } from 'react';
import { EmptyState, LoadingState, ErrorState } from '@neurecore/ui';
import type { EntityType } from '@neurecore/ui/types';
import { useWidgetDefinitions } from '@/components/widgets/useWidgetDefinitions';
import { WidgetRenderer } from '@/components/widgets/WidgetRenderer';
import { WidgetGrid, type WidgetGridProps } from '@/components/widgets/WidgetGrid';
import type {
  GridItem,
  WidgetDefinition,
  EaosEntityTypeForWidget,
} from '@/components/widgets/widget.types';
import { Button } from '@tremor/react';
import { Maximize2, Minimize2 } from 'lucide-react';

/**
 * Entity-type → widget-id mapping for the "hero KPI" set
 * (max 4 cards per NUWS §4.2). The order matters: the first 4 are
 * rendered on first paint, the rest are hidden behind "Show more".
 */
const HERO_WIDGETS_BY_ENTITY: Record<EaosEntityTypeForWidget, string[]> = {
  AGENT: ['operational-active-tasks-card', 'ai-cost-card', 'customer-health-gauge', 'operational-completion-gauge'],
  DEPARTMENT: [
    'operational-active-tasks-card',
    'financial-revenue-card',
    'workforce-headcount-grid',
    'automation-count-card',
  ],
  PROJECT: [
    'operational-active-tasks-card',
    'operational-completion-gauge',
    'financial-revenue-card',
    'risk-posture-heatmap',
  ],
  GOAL: [
    'operational-completion-gauge',
    'operational-active-tasks-card',
    'risk-posture-heatmap',
    'customer-health-gauge',
  ],
  TASK: ['operational-active-tasks-card', 'operational-completion-gauge', 'ai-cost-card', 'risk-posture-heatmap'],
  WORKFLOW: ['automation-count-card', 'operational-active-tasks-card', 'ai-tasks-table', 'risk-posture-heatmap'],
  ROUTINE: ['automation-count-card', 'operational-active-tasks-card', 'ai-cost-card', 'operational-completion-gauge'],
  KNOWLEDGE: ['knowledge-count-card', 'operational-active-tasks-card', 'risk-posture-heatmap', 'customer-health-gauge'],
  INTEGRATION: ['automation-count-card', 'operational-active-tasks-card', 'risk-posture-heatmap', 'customer-health-gauge'],
  TOOL: ['automation-count-card', 'ai-cost-card', 'operational-active-tasks-card', 'risk-posture-heatmap'],
};

const FALLBACK_HERO = ['financial-revenue-card', 'operational-active-tasks-card', 'ai-cost-card', 'customer-health-gauge'];

export interface InsightsPanelProps {
  type: EntityType;
  id: string;
  /** Initial items rendered before the load completes. */
  initialItems?: GridItem[];
  /** Whether the user can edit the grid (drag/resize/add/remove). */
  editable?: boolean;
}

const HERO_KPI_LIMIT = 4;

/**
 * InsightsPanel — Phase 4 widget grid.
 *
 * Per NUWS §2.7 + §4.2: this panel shows max 4 hero KPIs on first paint.
 * The user can click "Show all widgets" to expand into the full
 * drag-drop grid (which then uses `WidgetGrid` for layout persistence).
 */
export function InsightsPanel({
  type,
  id,
  initialItems,
  editable = true,
}: InsightsPanelProps) {
  const [showAll, setShowAll] = useState(false);

  const entityType = (String(type) as EaosEntityTypeForWidget) ?? 'AGENT';
  const { data: defs = [], isLoading, error } = useWidgetDefinitions(entityType);

  const heroItems = useMemo<GridItem[]>(() => {
    if (initialItems && initialItems.length > 0) return initialItems;
    if (defs.length === 0) return [];
    const wanted = HERO_WIDGETS_BY_ENTITY[entityType] ?? FALLBACK_HERO;
    const items: GridItem[] = [];
    for (const wid of wanted) {
      const def = defs.find((d) => d.id === wid);
      if (def) items.push({ i: def.id, size: { w: 3, h: 2 } });
    }
    // Pad to HERO_KPI_LIMIT with any remaining widgets if hero set was empty
    if (items.length < HERO_KPI_LIMIT) {
      for (const def of defs) {
        if (items.length >= HERO_KPI_LIMIT) break;
        if (items.find((it) => it.i === def.id)) continue;
        items.push({ i: def.id, size: { w: 3, h: 2 } });
      }
    }
    return items.slice(0, HERO_KPI_LIMIT);
  }, [defs, entityType, initialItems]);

  if (isLoading && defs.length === 0) {
    return <LoadingState label="Loading insights..." />;
  }
  if (error) {
    return <ErrorState error={error as Error} onRetry={() => window.location.reload()} />;
  }
  if (defs.length === 0) {
    return (
      <div className="p-6">
        <EmptyState
          variant="noData"
          title="No insights yet"
          description="KPIs will appear here once data flows in."
        />
      </div>
    );
  }

  // Hero view — fixed grid, max 4 cards, no drag.
  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-canvas-900 dark:text-canvas-50">
          Insights
        </h3>
        {editable ? (
          <Button
            size="xs"
            variant="secondary"
            icon={showAll ? Minimize2 : Maximize2}
            onClick={() => setShowAll((s) => !s)}
          >
            {showAll ? 'Show first 4 KPIs' : 'Show all widgets'}
          </Button>
        ) : null}
      </div>

      {showAll ? (
        <FullGrid
          entityType={entityType}
          entityId={id}
          initialItems={heroItems}
          editable={editable}
        />
      ) : (
        <HeroGrid
          items={heroItems}
          defs={defs}
          entityType={entityType}
          entityId={id}
        />
      )}
    </div>
  );
}

interface HeroGridProps {
  items: GridItem[];
  defs: WidgetDefinition[];
  entityType: EaosEntityTypeForWidget;
  entityId: string;
}

/**
 * HeroGrid — the "max 4 KPIs on first paint" layout.
 *
 * Plain CSS grid (no drag). Each cell shows a WidgetRenderer. Pure SSR
 * + paint, no library overhead.
 */
function HeroGrid({ items, defs, entityType, entityId }: HeroGridProps) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-canvas-500">
        No KPIs configured for this entity type.
      </p>
    );
  }
  return (
    <div
      className="grid gap-3"
      style={{
        gridTemplateColumns: `repeat(${Math.min(items.length, 4)}, minmax(0, 1fr))`,
      }}
    >
      {items.map((it) => {
        const def = defs.find((d) => d.id === it.i);
        if (!def) return null;
        return (
          <HeroWidgetCell
            key={it.i}
            def={def}
            entityType={entityType}
            entityId={entityId}
          />
        );
      })}
    </div>
  );
}

interface HeroWidgetCellProps {
  def: WidgetDefinition;
  entityType: EaosEntityTypeForWidget;
  entityId: string;
}

/**
 * HeroWidgetCell — wraps WidgetRenderer in a styled container with an
 * "Explain" link per NUWS §2.7 ("Explain" link on every KPI invokes
 * `ai:explain` and renders inline; stubbed here for Phase 5 wiring).
 */
function HeroWidgetCell({ def, entityType, entityId }: HeroWidgetCellProps) {
  return (
    <div className="flex flex-col">
      <div className="min-h-[112px] flex-1">
        <WidgetRenderer
          definition={def}
          entityType={entityType}
          entityId={entityId}
        />
      </div>
      <a
        href="#explain"
        onClick={(e) => {
          e.preventDefault();
          // Phase 5 stub: emit an event or call /ai-actions/execute?explain.
          // For Phase 4 we surface a console hint so the UX flow is visible.
          // eslint-disable-next-line no-console
          console.info(
            `[Phase 5 stub] ai:explain for ${def.id} on ${entityType}:${entityId}`,
          );
        }}
        className="mt-1 self-end text-xs text-blue-600 hover:underline dark:text-blue-400"
      >
        Explain →
      </a>
    </div>
  );
}

interface FullGridProps extends Pick<WidgetGridProps, 'entityType' | 'entityId' | 'initialItems' | 'editable'> {}

function FullGrid(props: FullGridProps) {
  return <WidgetGrid {...props} />;
}