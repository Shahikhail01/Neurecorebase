/**
 * Root placeholder — Phase 1, Task 1.27.
 *
 * Scaffolds the home route. Real routing comes in EAOS-1 (per the
 * entity workspace plan). For now this proves the toolchain works.
 */

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-canvas-50 px-6 py-24 dark:bg-canvas-950 sm:py-32">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-state-info">
          NeureCore
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-canvas-900 dark:text-canvas-50 sm:text-6xl">
          EAOS — coming soon
        </h1>
        <p className="mt-6 text-lg leading-8 text-canvas-600 dark:text-canvas-400">
          The Enterprise AI Operating System is being built on a clean
          foundation: NestJS 11 + Next.js 15 + TanStack Query + httpOnly
          cookies. No legacy code, no tech debt.
        </p>
        <p className="mt-4 text-sm text-canvas-500 dark:text-canvas-500">
          Phase 1, Task 1.27 placeholder. Real workspace arrives in
          EAOS-1 (per{' '}
          <code className="font-mono text-state-info">
            memory-bank/EAOS/EAOS-implementation-roadmap.md
          </code>
          ).
        </p>
      </div>
    </main>
  );
}
