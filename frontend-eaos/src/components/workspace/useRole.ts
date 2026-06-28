'use client';

import { useQuery } from '@tanstack/react-query';
import { restClient } from '@/infrastructure/api/RestClient';
import { API_ENDPOINTS } from '@neurecore/ui/endpoints';
import type { UserRole } from '@neurecore/ui/types';

interface MeResponse {
  user?: { role: UserRole };
  role?: UserRole;
}

export function useRole(): UserRole | null {
  const { data } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: ({ signal }) =>
      restClient.get<MeResponse>(API_ENDPOINTS.auth.me, { signal }),
    staleTime: 5 * 60_000,
    retry: false,
  });
  if (!data) return null;
  return data.role ?? data.user?.role ?? null;
}