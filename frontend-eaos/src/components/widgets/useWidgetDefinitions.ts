'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { restClient } from '@/infrastructure/api/RestClient';
import type { WidgetDefinition, EaosEntityTypeForWidget } from './widget.types';
import { widgetRegistry } from './WidgetRegistry';

const WIDGETS_PATH = '/api/v1/widgets';

/**
 * useWidgetDefinitions — fetch and hydrate the client-side registry.
 *
 * Returning the list directly (rather than going through the registry
 * singleton) keeps it easy to use the hook in multiple components
 * concurrently; the registry hydrate runs in a `useEffect`.
 */
export function useWidgetDefinitions(
  entityType?: EaosEntityTypeForWidget,
) {
  const query = useQuery({
    queryKey: ['widgets', 'definitions', entityType ?? 'all'],
    queryFn: ({ signal }) =>
      restClient.get<WidgetDefinition[]>(
        entityType ? `${WIDGETS_PATH}?entityType=${entityType}` : WIDGETS_PATH,
        { signal },
      ),
    staleTime: 10 * 60_000,
  });

  useEffect(() => {
    if (query.data && query.data.length > 0) {
      widgetRegistry.hydrate(query.data);
    }
  }, [query.data]);

  return query;
}