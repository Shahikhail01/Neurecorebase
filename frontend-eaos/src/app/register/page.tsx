'use client';

/**
 * Register Page — EAOS.
 *
 * Cookie-only auth — on success the backend sets
 * `__Host-nc_at` + `__Host-nc_rt` + `__Host-nc_csrf` cookies.
 * Google Sign-In uses Google Identity Services (GIS).
 */

import { Suspense, useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@neurecore/ui/components';
import { cn } from '@/lib/utils';
import { useAuthUser, useRegister, useGoogleSignIn } from '@/core/hooks/auth/useAuth';
import { cookieManager } from '@/infrastructure/auth/CookieManager';
import { toast } from '@/components/feedback/Toaster';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            element: HTMLElement,
            config: { theme?: string; size?: string; text?: string; shape?: string; width?: number }
          ) => void;
          prompt: () => void;
        };
      };
    };
  }
}

const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(64),
  lastName: z.string().min(1, 'Last name is required').max(64),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(72),
});

type RegisterFormInput = z.infer<typeof registerSchema>;

function GoogleSignInButton({ onError }: { onError: (msg: string) => void }) {
  const router = useRouter();
  const googleSignIn = useGoogleSignIn();
  const [loading, setLoading] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const lastCredentialRef = useRef<string | null>(null);

  const completeSignIn = useCallback(async (credential: string, intent: 'signin' | 'link' = 'signin') => {
    setLoading(true);
    try {
      const result = await googleSignIn.mutateAsync({ idToken: credential, intent });
      if (result.status === 'ok') {
        if (!cookieManager.hasAuthCookies()) {
          toast.error('Cookies blocked', 'Your browser is blocking httpOnly cookies.');
          return;
        }
        toast.success('Welcome!', 'Signed up successfully');
        router.replace('/');
      } else if (result.status === 'existing_unlinked') {
        lastCredentialRef.current = credential;
        const event = new CustomEvent('eaos:google-account-exists', { detail: result });
        window.dispatchEvent(event);
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      onError(e?.message ?? 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  }, [googleSignIn, router, onError]);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || initializedRef.current) return;
    initializedRef.current = true;

    const initGoogle = () => {
      if (!window.google?.accounts?.id) {
        setTimeout(initGoogle, 100);
        return;
      }
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response) => {
          await completeSignIn(response.credential);
        },
      });
      if (buttonRef.current) {
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline',
          size: 'large',
          text: 'signup_with',
          shape: 'rectangular',
          width: 280,
        });
      }
    };

    if (!document.getElementById('google-identity-services-script')) {
      const script = document.createElement('script');
      script.id = 'google-identity-services-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initGoogle;
      document.head.appendChild(script);
    } else {
      initGoogle();
    }
  }, [completeSignIn]);

  useEffect(() => {
    const handler = () => {
      if (lastCredentialRef.current) {
        void completeSignIn(lastCredentialRef.current, 'link');
      }
    };
    window.addEventListener('eaos:google-link-account', handler);
    return () => window.removeEventListener('eaos:google-link-account', handler);
  }, [completeSignIn]);

  return (
    <div className={cn('flex justify-center', loading ? 'opacity-50 pointer-events-none' : '')}>
      <div ref={buttonRef} />
    </div>
  );
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams?.get('next') ?? '/';

  const { data: existingUser, isLoading: isCheckingAuth } = useAuthUser();
  const register = useRegister();

  const form = useForm<RegisterFormInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { firstName: '', lastName: '', email: '', password: '' },
  });

  useEffect(() => {
    if (!isCheckingAuth && existingUser) {
      router.replace(next);
    }
  }, [isCheckingAuth, existingUser, router, next]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const result = await register.mutateAsync(values);
      if (!cookieManager.hasAuthCookies()) {
        toast.error('Cookies blocked', 'Your browser is blocking httpOnly cookies.');
        return;
      }
      toast.success(`Welcome, ${result.user.firstName || result.user.email}!`, 'Account created');
      router.replace(next);
    } catch (err: unknown) {
      const e = err as { status?: number; message?: string };
      if (e?.status === 409) {
        form.setError('email', { type: 'manual', message: 'Email already registered' });
        return;
      }
      toast.error('Registration failed', e?.message ?? 'Please try again');
    }
  });

  const handleGoogleError = useCallback((msg: string) => {
    toast.error('Google sign-in failed', msg);
  }, []);

  return (
    <div className="w-full max-w-md space-y-6 rounded-lg border border-canvas-200 bg-canvas-50 p-8 dark:border-canvas-700 dark:bg-canvas-900">
      <header className="space-y-1 text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-state-info">
          NeureCore
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-canvas-900 dark:text-canvas-50">
          Create your account
        </h1>
        <p className="text-sm text-canvas-600 dark:text-canvas-400">
          Enterprise AI Operating System
        </p>
      </header>

      <div className="space-y-4">
        <GoogleSignInButton onError={handleGoogleError} />
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-canvas-200 dark:border-canvas-700" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-canvas-50 px-2 text-canvas-400 dark:bg-canvas-900">Or continue with email</span>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="firstName" className="block text-sm font-medium text-canvas-700 dark:text-canvas-300">
              First name
            </label>
            <input
              id="firstName"
              type="text"
              autoComplete="given-name"
              placeholder="Jane"
              {...form.register('firstName')}
              className={cn(
                'block w-full rounded-md border bg-canvas-50 px-3 py-2 text-sm text-canvas-900 placeholder:text-canvas-400',
                'dark:bg-canvas-900 dark:text-canvas-50',
                'focus:outline-none focus:ring-2 focus:ring-state-info',
                form.formState.errors.firstName
                  ? 'border-state-critical'
                  : 'border-canvas-300 dark:border-canvas-600',
              )}
            />
            {form.formState.errors.firstName && (
              <p className="text-xs text-state-critical">{form.formState.errors.firstName.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="lastName" className="block text-sm font-medium text-canvas-700 dark:text-canvas-300">
              Last name
            </label>
            <input
              id="lastName"
              type="text"
              autoComplete="family-name"
              placeholder="Smith"
              {...form.register('lastName')}
              className={cn(
                'block w-full rounded-md border bg-canvas-50 px-3 py-2 text-sm text-canvas-900 placeholder:text-canvas-400',
                'dark:bg-canvas-900 dark:text-canvas-50',
                'focus:outline-none focus:ring-2 focus:ring-state-info',
                form.formState.errors.lastName
                  ? 'border-state-critical'
                  : 'border-canvas-300 dark:border-canvas-600',
              )}
            />
            {form.formState.errors.lastName && (
              <p className="text-xs text-state-critical">{form.formState.errors.lastName.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="email" className="block text-sm font-medium text-canvas-700 dark:text-canvas-300">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            {...form.register('email')}
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
            <p className="text-xs text-state-critical">{form.formState.errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="block text-sm font-medium text-canvas-700 dark:text-canvas-300">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            {...form.register('password')}
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
            <p className="text-xs text-state-critical">{form.formState.errors.password.message}</p>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          disabled={register.isPending}
        >
          {register.isPending ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <footer className="text-center text-xs text-canvas-500 dark:text-canvas-400">
        Already have an account?{' '}
        <Link href={`/login?next=${encodeURIComponent(next)}`} className="text-state-info hover:underline">
          Sign in
        </Link>
      </footer>
    </div>
  );
}

function RegisterFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas-50 dark:bg-canvas-950">
      <p className="text-sm text-canvas-500">Loading…</p>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterFallback />}>
      <main className="flex min-h-screen items-center justify-center bg-canvas-50 px-4 dark:bg-canvas-950">
        <RegisterForm />
      </main>
    </Suspense>
  );
}
