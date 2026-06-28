'use client';

import { useMemo } from 'react';
import {
  FEATURE_FLAGS,
  isFeatureEnabled,
  type FeatureFlagKey,
} from './feature-flags';
import { useRole } from '@/components/workspace/useRole';

interface FeatureFlagOptions {
  role?: ReturnType<typeof useRole>;
  tenantFlags?: Record<string, boolean>;
  userFlags?: Record<string, boolean>;
}

export function useFeatureFlag(
  flag: FeatureFlagKey,
  options?: { role?: ReturnType<typeof useRole> },
): boolean {
  const role = useRole();
  const effectiveRole = options?.role ?? role;
  return useMemo(
    () =>
      isFeatureEnabled(flag, {
        role: effectiveRole ?? undefined,
      }),
    [flag, effectiveRole],
  );
}

export { FEATURE_FLAGS };