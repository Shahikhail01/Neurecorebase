'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MissionFeedBanner } from '@/components/mission-feed/MissionFeedBanner';
import { useAuthUser, useLogout } from '@/core/hooks/auth/useAuth';
import { restClient } from '@/infrastructure/api/RestClient';
import { Button } from '@neurecore/ui/components';

interface Department {
  id: string;
  name: string;
  type: string;
}

export default function HomePage() {
  const router = useRouter();
  const { data: user, isLoading } = useAuthUser();
  const logout = useLogout();

  const { data: departments } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: async () => {
      const data = await restClient.get<{ data?: Department[] }>('/departments', { skipCsrf: true });
      return (data as unknown as { data?: Department[] })?.data ?? (Array.isArray(data) ? data : []);
    },
    enabled: !!user?.tenantId,
  });

  const firstDept = departments?.[0];

  // If no auth cookies and not currently authenticated, bounce to /login.
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login?next=/');
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-canvas-50 dark:bg-canvas-950">
        <p className="text-sm text-canvas-500">Loading…</p>
      </main>
    );
  }

  if (!user) {
    // Effect above will redirect — render a brief placeholder.
    return null;
  }

  const handleLogout = async () => {
    try {
      await logout.mutateAsync();
      router.replace('/login');
    } catch {
      // Even if the server call fails, the onSettled cleared the local cache.
      router.replace('/login');
    }
  };

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
            <p className="mt-1 text-sm text-canvas-500">
              Signed in as <strong>{user.email}</strong> ({user.role})
            </p>
          </div>
          <nav className="flex gap-3 text-sm">
            {firstDept ? (
              <Link
                href={`/entity/department/${firstDept.id}`}
                className="rounded-md border border-canvas-200 px-3 py-1 text-canvas-700 hover:bg-canvas-100 dark:border-canvas-700 dark:text-canvas-300 dark:hover:bg-canvas-900"
              >
                Browse entities
              </Link>
            ) : (
              <Link
                href="/agents"
                className="rounded-md border border-canvas-200 px-3 py-1 text-canvas-700 hover:bg-canvas-100 dark:border-canvas-700 dark:text-canvas-300 dark:hover:bg-canvas-900"
              >
                Browse entities
              </Link>
            )}
            <Link
              href="/retail"
              className="rounded-md border border-canvas-200 px-3 py-1 text-canvas-700 hover:bg-canvas-100 dark:border-canvas-700 dark:text-canvas-300 dark:hover:bg-canvas-900"
            >
              Retail pack
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              disabled={logout.isPending}
            >
              {logout.isPending ? 'Signing out…' : 'Sign out'}
            </Button>
          </nav>
        </header>

        <MissionFeedBanner tenantId={user.tenantId ?? 'default'} role={user.role} />

        <p className="text-sm text-canvas-500">
          Open an entity workspace at <code className="font-mono">/entity/[type]/[id]</code>.
          Use the banner above to act on AI-prioritized items.
        </p>
      </div>
    </main>
  );
}