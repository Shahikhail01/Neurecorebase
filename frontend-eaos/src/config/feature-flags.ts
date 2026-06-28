import type { UserRole } from '@neurecore/ui/types';

type FeatureFlagConfig = {
  default?: boolean;
  rolloutPct?: number;
  ownerRoles?: UserRole[];
  userOverrideable?: boolean;
  emergencyKill?: boolean;
};

export const FEATURE_FLAGS: Record<string, FeatureFlagConfig> = {
  USE_NEW_WORKSPACE: { default: false, ownerRoles: ['SUPER_ADMIN'] },
  USE_MISSION_FEED: { default: true, rolloutPct: 100 },
  USE_COMMAND_PALETTE: { default: false, rolloutPct: 25 },
  USE_COMPARE_VIEW: { default: false, rolloutPct: 0 },
  USE_RBAC_PHASE_2: { default: false, ownerRoles: ['SUPER_ADMIN'] },
  USE_PERSONALIZED_MISSION_FEED: { default: false, userOverrideable: true },
  DISABLE_AI_ACTIONS: { default: false, emergencyKill: true },
};

export type FeatureFlagKey = keyof typeof FEATURE_FLAGS;

interface FeatureFlagContext {
  role?: UserRole;
  tenantFlags?: Record<string, boolean>;
  userFlags?: Record<string, boolean>;
}

export function isFeatureEnabled(
  flag: FeatureFlagKey,
  context: FeatureFlagContext = {},
): boolean {
  const config = FEATURE_FLAGS[flag];
  if (!config) return false;

  const { role, tenantFlags = {}, userFlags = {} } = context;

  if (config.emergencyKill && flag in userFlags) {
    return false;
  }

  if (config.ownerRoles && role) {
    if (config.ownerRoles.includes(role)) {
      return tenantFlags[flag] ?? config.default ?? false;
    }
    return false;
  }

  if (config.userOverrideable && flag in userFlags) {
    return userFlags[flag] ?? false;
  }

  if (config.rolloutPct !== undefined) {
    const pct = config.rolloutPct / 100;
    const hash = Math.random();
    return hash < pct;
  }

  return config.default ?? false;
}
