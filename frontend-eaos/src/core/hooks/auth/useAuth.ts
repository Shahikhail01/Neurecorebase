'use client';

/**
 * useAuth — Phase 9 (Auth Hardening).
 *
 * Per `EAOS-frontend-data-layer.md` §4.3 + `EAOS-implementation-roadmap.md` §13.
 *
 * Single source of truth for the authenticated user identity. Wraps the
 * `/auth/me` endpoint via TanStack Query. Re-fetches on window focus and
 * reconnect, so cross-tab logout and refresh-then-401 invalidate correctly.
 *
 * The user data is also exposed as `useAuthStore` (Zustand) so non-Query
 * code (e.g. layout shell, navigation) can read it synchronously without
 * suspending on the network.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { restClient } from '@/infrastructure/api/RestClient';
import { cookieManager } from '@/infrastructure/auth/CookieManager';
import { API_ENDPOINTS } from '@neurecore/ui/endpoints';
import type { UserRole } from '@neurecore/ui/types';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  tenantId: string | null;
  isActive: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginResult {
  user: AuthUser;
  tokens: AuthTokens;
}

export interface LoginInput {
  email: string;
  password: string;
}

export const AUTH_QUERY_KEY = ['auth', 'me'] as const;

export function useAuthUser(options?: { enabled?: boolean }) {
  return useQuery<AuthUser | null>({
    queryKey: AUTH_QUERY_KEY,
    queryFn: async ({ signal }) => {
      // If cookies aren't present at all, skip the round-trip.
      if (!cookieManager.hasAuthCookies()) return null;
      try {
        return await restClient.get<AuthUser>(API_ENDPOINTS.auth.me, {
          signal,
          skipCsrf: true, // GET — never sends CSRF anyway
        });
      } catch (err: unknown) {
        const status = (err as { status?: number })?.status;
        // 401 = not authenticated. Treat as logged-out (not an error).
        if (status === 401) return null;
        throw err;
      }
    },
    staleTime: 5 * 60_000,
    retry: false,
    enabled: options?.enabled ?? true,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation<LoginResult, Error, LoginInput>({
    mutationFn: async (input) => {
      const result = await restClient.post<LoginResult>(
        API_ENDPOINTS.auth.login,
        input,
        { skipCsrf: true }, // pre-auth endpoint
      );
      return result;
    },
    onSuccess: (data) => {
      // Cache the user identity so layout / nav can read it immediately.
      qc.setQueryData(AUTH_QUERY_KEY, data.user);
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: async () => {
      await restClient.post<void>(API_ENDPOINTS.auth.logout, undefined, {
        skipCsrf: true, // logout should work even if the cookie expired
      });
    },
    onSettled: () => {
      cookieManager.clearAuthCookies();
      qc.clear();
      qc.setQueryData(AUTH_QUERY_KEY, null);
    },
  });
}

/**
 * Tiny effect hook — calls /auth/me on mount and sets the query cache.
 * Useful at the top of the React tree so the cache is warm before any
 * consumer mounts.
 */
export function useEnsureAuthUser() {
  const qc = useQueryClient();
  useEffect(() => {
    if (cookieManager.hasAuthCookies()) {
      qc.prefetchQuery({
        queryKey: AUTH_QUERY_KEY,
        queryFn: async () => {
          try {
            return await restClient.get<AuthUser>(API_ENDPOINTS.auth.me);
          } catch (err: unknown) {
            const status = (err as { status?: number })?.status;
            if (status === 401) return null;
            throw err;
          }
        },
        staleTime: 5 * 60_000,
      });
    }
  }, [qc]);
}