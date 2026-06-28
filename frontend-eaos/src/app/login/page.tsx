'use client';

/**
 * Login Page — Phase 9 (Auth Hardening).
 *
 * Per `EAOS-implementation-roadmap.md` §13 task 9.5 + `EAOS-frontend-data-layer.md` §4.3.
 *
 * Cookie-only auth — there is no token input. On success the backend sets
 * `__Host-nc_at` + `__Host-nc_rt` + `__Host-nc_csrf` cookies; the SPA reads
 * them via `cookieManager.getCsrfToken()` on subsequent requests.
 *
 * The form uses native <input> elements + react-hook-form. Validation is
 * minimal: email format + non-empty password. Backend rejects invalid
 * credentials with 401 (caught below).
 */

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@neurecore/ui/components';
import { cn } from '@/lib/utils';
import { useAuthUser, useLogin } from '@/core/hooks/auth/useAuth';
import { cookieManager } from '@/infrastructure/auth/CookieManager';
import { toast } from '@/components/feedback/Toaster';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormInput = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams?.get('next') ?? '/';

  const { data: existingUser, isLoading: isCheckingAuth } = useAuthUser();
  const login = useLogin();

  const form = useForm<LoginFormInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  // If already authenticated, bounce to the next page.
  useEffect(() => {
    if (!isCheckingAuth && existingUser) {
      router.replace(next);
    }
  }, [isCheckingAuth, existingUser, router, next]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const result = await login.mutateAsync(values);
      // Cookies were set by the backend response. Confirm before navigating.
      if (!cookieManager.hasAuthCookies()) {
        toast.error(
          'Cookies blocked',
          'Your browser is blocking httpOnly cookies. Check site settings and try again.',
        );
        return;
      }
      toast.success(
        `Welcome, ${result.user.firstName || result.user.email}`,
        'Logged in successfully',
      );
      router.replace(next);
    } catch (err: unknown) {
      const e = err as { code?: string; status?: number; message?: string };
      if (e?.status === 401 || e?.code === 'AUTHENTICATION_FAILED') {
        form.setError('password', {
          type: 'manual',
          message: 'Invalid email or password',
        });
        return;
      }
      if (e?.status === 429) {
        toast.error('Too many attempts', 'Please wait a moment before retrying.');
        return;
      }
      toast.error(
        'Sign-in failed',
        e?.message ?? 'An unexpected error occurred. Please try again.',
      );
    }
  });

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas-50 px-4 dark:bg-canvas-950">
      <div className="w-full max-w-md space-y-6 rounded-lg border border-canvas-200 bg-canvas-50 p-8 dark:border-canvas-700 dark:bg-canvas-900">
        <header className="space-y-1 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-state-info">
            NeureCore
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-canvas-900 dark:text-canvas-50">
            Sign in to EAOS
          </h1>
          <p className="text-sm text-canvas-600 dark:text-canvas-400">
            Enterprise AI Operating System
          </p>
        </header>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="space-y-1">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-canvas-700 dark:text-canvas-300"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              {...form.register('email')}
              aria-invalid={!!form.formState.errors.email}
              className={cn(
                'block w-full rounded-md border bg-canvas-50 px-3 py-2 text-sm text-canvas-900 placeholder:text-canvas-400',
                'dark:bg-canvas-900 dark:text-canvas-50',
                'focus:outline-none focus:ring-2 focus:ring-state-info',
                form.formState.errors.email
                  ? 'border-state-critical'
                  : 'border-canvas-300 dark:border-canvas-600',
              )}
            />
            {form.formState.errors.email && (
              <p className="text-xs text-state-critical">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-canvas-700 dark:text-canvas-300"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              {...form.register('password')}
              aria-invalid={!!form.formState.errors.password}
              className={cn(
                'block w-full rounded-md border bg-canvas-50 px-3 py-2 text-sm text-canvas-900 placeholder:text-canvas-400',
                'dark:bg-canvas-900 dark:text-canvas-50',
                'focus:outline-none focus:ring-2 focus:ring-state-info',
                form.formState.errors.password
                  ? 'border-state-critical'
                  : 'border-canvas-300 dark:border-canvas-600',
              )}
            />
            {form.formState.errors.password && (
              <p className="text-xs text-state-critical">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            disabled={login.isPending}
          >
            {login.isPending ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <footer className="space-y-2 text-center text-xs text-canvas-500 dark:text-canvas-400">
          <p>
            New to NeureCore?{' '}
            <Link
              href={`/register?next=${encodeURIComponent(next)}`}
              className="text-state-info hover:underline"
            >
              Create an account
            </Link>
          </p>
          <p className="pt-2 text-[10px] text-canvas-400">
            Phase 9 — httpOnly + Secure + SameSite=Strict cookies.
            No localStorage tokens.
          </p>
        </footer>
      </div>
    </main>
  );
}

function LoginFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas-50 dark:bg-canvas-950">
      <p className="text-sm text-canvas-500">Loading…</p>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}