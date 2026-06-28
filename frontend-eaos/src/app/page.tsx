'use client';

import Link from 'next/link';
import { MissionFeedBanner } from '@/components/mission-feed/MissionFeedBanner';
import { useRole } from '@/components/workspace/useRole';

export default function HomePage() {
  const role = useRole();

  return (
    <main className="min-h-screen bg-canvas-50 px-6 py-12 dark:bg-canvas-950 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-state-info">
              NeureCore
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-canvas-900 dark:text-canvas-50">
              EAOS — Workspace
            </h1>
          </div>
          <nav className="flex gap-3 text-sm">
            <Link
              href="/entity/department"
              className="rounded-md border border-canvas-200 px-3 py-1 text-canvas-700 hover:bg-canvas-100 dark:border-canvas-700 dark:text-canvas-300 dark:hover:bg-canvas-900"
            >
              Browse entities
            </Link>
          </nav>
        </header>

        <MissionFeedBanner tenantId="default" role={role ?? undefined} />

        <p className="text-sm text-canvas-500">
          Open an entity workspace at <code className="font-mono">/entity/[type]/[id]</code>.
          Use the banner above to act on AI-prioritized items.
        </p>
      </div>
    </main>
  );
}