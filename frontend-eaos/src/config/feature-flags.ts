import type { UserRole } from '@neurecore/ui/types';

type FeatureFlagConfig = {
  default?: boolean;
  rolloutPct?: number;
  ownerRoles?: UserRole[];
  userOverrideable?: boolean;
  emergencyKill?: boolean;
};

/**
 * Phase 10 cleanup (`EAOS-implementation-roadmap.md` §14 task 10.8): flags
 * that have reached 100% rollout are retired. The remaining flags:
 *
 * - `USE_MISSION_FEED` — read by `MissionFeedBanner`. Kept for one release
 *   cycle so we can flip it off if a regression slips through.
 * - `USE_COMMAND_PALETTE` — at 25% rollout, active development.
 * - `USE_COMPARE_VIEW` — at 0% (alpha), not yet shipped.
 * - `USE_PERSONALIZED_MISSION_FEED` — per-user opt-in.
 * - `DISABLE_AI_ACTIONS` — kill-switch (exempt from the 90-day retirement
 *   rule per `EAOS-implementation-roadmap.md` §15).
 *
 * Retired flags (had reached 100% rollout at the time of cleanup):
 *
 * - `USE_NEW_WORKSPACE` — Phase 3 EAOS workspace is the only workspace
 *   since Phase 3 completion (2026-06-27). Per D-023 the legacy
 *   `/departments/[id]/workspace` route was deleted in full.
 * - `USE_RBAC_PHASE_2` — Phase 0 already shipped the RBAC hardening
 *   (`tools.controller.ts` JwtAuthGuard, divergent `UserRole` enum
 *   removed). Flag had no consumers.
 * - `USE_AI_ACTIONS` — never registered in this map; the backend's
 *   `FeatureFlagService` had a dead registration that was also removed
 *   in this phase.
 */
export const FEATURE_FLAGS: Record<string, FeatureFlagConfig> = {
  USE_MISSION_FEED: { default: true, rolloutPct: 100 },
  USE_COMMAND_PALETTE: { default: false, rolloutPct: 25 },
  USE_COMPARE_VIEW: { default: false, rolloutPct: 0 },
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
