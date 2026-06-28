'use client';

import { useAuthUser } from '@/core/hooks/auth/useAuth';
import type { UserRole } from '@neurecore/ui/types';

/**
 * useRole — returns the current user's role (or null if not authenticated).
 *
 * Phase 9: now backed by the canonical `useAuthUser` hook (shared query key
 * `['auth', 'me']`) so every component sees the same user identity.
 */
export function useRole(): UserRole | null {
  const { data } = useAuthUser();
  return data?.role ?? null;
}