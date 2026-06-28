/**
 * WidgetRegistry (client) — typed lookup of every widget definition
 * fetched from the backend.
 *
 * The registry is hydrated from `GET /api/v1/widgets`. After hydration,
 * the client can:
 *   - look up a definition by id (O(1))
 *   - filter by entity type
 *   - cache results for the session
 *
 * The registry is intentionally a thin in-memory cache; persistence is
 * the backend's `WorkspaceLayout` table (per `EAOS-NUWS-principles.md` §5.1).
 */

import type { WidgetDefinition, EaosEntityTypeForWidget } from './widget.types';

export class WidgetRegistry {
  private readonly byId = new Map<string, WidgetDefinition>();

  hydrate(definitions: WidgetDefinition[]): void {
    this.byId.clear();
    for (const d of definitions) this.byId.set(d.id, d);
  }

  get(id: string): WidgetDefinition | undefined {
    return this.byId.get(id);
  }

  has(id: string): boolean {
    return this.byId.has(id);
  }

  list(): WidgetDefinition[] {
    return Array.from(this.byId.values());
  }

  listForEntityType(t: EaosEntityTypeForWidget): WidgetDefinition[] {
    return this.list().filter((w) => w.entityTypes.includes(t));
  }

  count(): number {
    return this.byId.size;
  }
}

/** Singleton — the WidgetGrid is mounted once per workspace. */
export const widgetRegistry = new WidgetRegistry();