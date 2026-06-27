/**
 * App configuration — Phase 1, Task 1.20.
 *
 * Per `EAOS-frontend-data-layer.md` §1, §3.1, §8.3.
 *
 * This file is intentionally the SINGLE place where all cross-cutting
 * Providers are mounted. The order matters:
 *   1. ThemeProvider (sets the dark/light class on <html>)
 *   2. QueryClientProvider (TanStack Query for server state)
 *   3. Toaster (sits at root so toasts work from anywhere)
 *
 * This is the equivalent of the old frontend-tenant's AppInitializer, but
 * cleaner: no manual localStorage rehydration, no event-bus wiring, no
 * Zustand stores (data lives in TanStack Query; UI-only state lives in
 * component-local Zustand stores per `EAOS-frontend-data-layer.md` §3.10).
 */

'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from 'next-themes';
import { useState, type ReactNode } from 'react';
import { Toaster } from '@/components/feedback/Toaster';

export function Providers({ children }: { children: ReactNode }) {
  // One QueryClient per app instance (stable across renders).
  // Default options match `EAOS-frontend-data-layer.md` §3.1.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000, // 30s — entity data
            gcTime: 5 * 60_000, // 5min garbage collection
            retry: 2,
            retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
            refetchOnWindowFocus: true,
            refetchOnReconnect: true,
            refetchOnMount: true,
          },
          mutations: {
            retry: 0, // mutations don't auto-retry
          },
        },
      }),
  );

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster />
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
        )}
      </QueryClientProvider>
    </ThemeProvider>
  );
}
