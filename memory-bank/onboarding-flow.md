# NeureCore — Onboarding Wizard Reference

**Last Updated:** 2026-06-27 (Session 15)
**Audience:** Frontend + backend engineers maintaining `/onboarding/setup`
**Status:** Live on `hq.neurecore.com` (Vercel auto-deploy) + `brain.neurecore.com/api/v1` (Contabo PID 672683)

---

## 1. Overview

The onboarding wizard is a 6-step flow shown to any tenant user whose `Tenant.onboardingCompletedAt` is `null`. It is gated by `frontend-tenant/src/app/login/page.tsx` which redirects to `/onboarding/setup` if the timestamp is missing.

```
/onboarding/setup  (single page, single file, ~580 lines)
└── Stepper at top (company → plan → template → review → team → complete)
```

**Single source file:**
- Frontend: `frontend-tenant/src/app/onboarding/setup/page.tsx` (the entire wizard, inline-rendered)
- Service: `frontend-tenant/src/services/onboarding.service.ts` (API client + types)
- Backend controller: `backend/src/modules/onboarding/onboarding.controller.ts`
- Backend service: `backend/src/modules/onboarding/onboarding.service.ts`

Because the wizard is a single monolithic page, any change to "Step X" means editing the same file. Be careful with `AnimatePresence` and the per-step state variables.

---

## 2. Steps & data flow

| # | Step ID | UI | State mutation | API call | Auto-advance? |
|---|---|---|---|---|---|
| 1 | `company` | Name + industry inputs | `setCompanyName`, `setIndustry` | `PATCH /onboarding/state` (on Continue) | No — explicit Continue |
| 2 | `plan` | Grid of selectable tier cards | `setSelectedTierId` | `POST /onboarding/select-tier` (on Continue) | No — explicit Continue (since Session 14) |
| 3 | `template` | Grid of selectable department templates | `setSelectedTemplateSlug`, `setDeploymentSummary` | `POST /onboarding/select-template` | No — Continue after deployment |
| 4 | `review` | Counts of created departments/agents | `setStep('team')` | None | No — "Looks good" button |
| 5 | `team` | Repeatable email+role inputs | `setInvites`, `setInviteErrors`, `setIssuedTokens` | `POST /onboarding/invite-members` | No — "Send invites" or "Skip for now" |
| 6 | `complete` | Success card + invite-link table | `router.push('/command-center')` | `POST /onboarding/complete` | — |

**Initial load:** `Promise.all([getState, tiersService.list(), departmentTemplatesService.list()])`. If any reject, the whole page shows the generic error banner and the wizard is stuck on skeletons until reload. This is the most common source of the "blank Step 2" symptom — `tiersService.list()` failing or returning `[]` (e.g. backend down, JWT expired, network proxy stripping the response).

---

## 3. Step-by-step behaviour (post Session 14)

### Step 1 — Company
- Required: `companyName.trim()` (industry is optional)
- Continue disabled until name is non-empty
- No Back (this is the first step)

### Step 2 — Plan
- Renders `tiers.map(...)` as a 1/2/4-column responsive grid
- Clicking a card → highlights it (primary border + ring + `aria-pressed=true`) but does NOT call the API
- Empty-state: dashed border card with Retry button (calls `window.location.reload()`)
- Continue button → calls `selectTier(tierId)` then advances to `template`
- Back button → returns to `company` (no API call)

### Step 3 — Template
- Renders `templates.map(...)` as a 2-column grid
- Clicking a card calls `selectTemplate(slug)` which deploys departments + agents
- Empty-state: explanatory text + Back button + "Skip templates" button
- After deployment, auto-advances to `review`
- Back button → returns to `plan`

### Step 4 — Review
- Shows counts from `deploymentSummary`
- "Back" button → `template` (does NOT re-deploy)
- "Looks good" → `team`

### Step 5 — Team
- Email validation regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- Invalid emails are listed in `inviteErrors` and the request is blocked
- Valid invites → `inviteMembers(valid)` → returns `{tokens: string[]}`
- `issuedTokens` is now stored as `{email, token}[]` so the Complete step can pair each token with its recipient email
- "Skip for now" → `complete` with empty `issuedTokens`

### Step 6 — Complete
- Shows invite-link table: `${window.location.origin}/invite/${token}` per recipient (scrollable, `max-h-40`)
- Admin can copy each link and distribute manually
- "Open command center" → calls `complete()` then `router.push('/command-center')`

---

## 4. Common failure modes & troubleshooting

### Symptom: "Choose your plan" step is empty

**Most likely causes (in order, with confirmed live root cause from Session 15):**
1. **`GET /tiers` returns 401 — the wizard user has no JWT yet.** The global `JwtAuthGuard` blocks anon reads. Fixed in Session 15 by adding `@Public()` to the read endpoints. Verify on Contabo:
   ```bash
   curl -s -o /dev/null -w "%{http_code}\n" https://brain.neurecore.com/api/v1/tiers
   # Should be 200. If 401, the @Public() decorator got lost during a build/dist sync.
   ```
2. **Backend `GET /tiers` returning `[]`.** Check Contabo: `curl -H "Authorization: Bearer $TOKEN" https://brain.neurecore.com/api/v1/tiers | jq '.data | length'`. If zero, the seed migration didn't run or tiers were deactivated.
3. **Backend `/tiers` endpoint down.** Check `pm2 logs neurecore-backend --lines 200` for stack traces.
4. **Vercel env var missing.** `NEXT_PUBLIC_API_BASE_URL` (or equivalent) not set in Vercel dashboard → CORS / 404 from API. Check browser console for the base URL being hit.

**Quick sanity check from the browser console:**
```js
fetch('/api/v1/tiers', { credentials: 'include' }).then(r => r.json()).then(console.log)
```

### Symptom: Stuck on skeletons forever

Means `useEffect` never resolved. Either `user` is still `null` (auth check) or `Promise.all` rejected and the `finally` set loading=false but `setError` fired. Check for the red error banner at the top of the page.

### Symptom: Template deployment succeeds but Review shows 0/0

`deploymentSummary` is `null` because `selectTemplate` response didn't include `departmentsCreated` / `agentsCreated`. Check `backend/src/modules/onboarding/onboarding.service.ts` `selectTemplate` — the response shape must match `SelectTemplateResult`.

### Symptom: Invite links not visible on Complete step

Means `issuedTokens.length === 0`. Either:
- All invite inputs were empty (user clicked "Skip for now")
- API returned `tokens: []` despite successful invites (backend bug — check `onboarding.service.ts` `inviteMembers`)
- User did not reach Step 5 (came from a state where `tierId` is set but `templateSlug` is empty — `complete()` is called with no team step)

---

## 5. State restore on reload

The wizard calls `onboardingService.getState()` on mount. If the user reloads mid-flow:
- `state.step` → restored (mapped: `account` → `company`)
- `state.company.name/industry` → restored to inputs
- `state.tierId` → restored to `selectedTierId` (Plan card will appear pre-selected if user navigates back to it)
- `state.templateSlug` → restored to `selectedTemplateSlug`

**Note:** `deploymentSummary` is NOT persisted server-side. If the user reloads on the Review step, the summary card will be hidden — but they can still navigate forward.

---

## 6. Deploying changes

The onboarding wizard is frontend-only code (`frontend-tenant/src/app/onboarding/setup/page.tsx`). To ship a fix:

```bash
cd /home/najeeb/Linux-Dev/neurecore-base/neurecore
git add frontend-tenant/src/app/onboarding/setup/page.tsx
git commit -m "fix(onboarding): <describe change>"
git push origin main   # Vercel auto-deploys to hq.neurecore.com
```

**Never run `vercel deploy --prod` directly** — see `vercel-operations.md`. Duplicate-path bug.

If the change also touches `onboarding.service.ts` types, verify the corresponding backend DTO (`backend/src/modules/onboarding/dto/onboarding.dto.ts`) still matches — frontend types are mirrored, not shared.

---

## 7. Tests / verification checklist

Before merging an onboarding change:

- [ ] Visit `https://hq.neurecore.com/onboarding/setup` as a fresh tenant
- [ ] Step 1: empty name → Continue disabled. Name + Continue → Step 2.
- [ ] Step 2: no tier selected → Continue disabled. Select a tier → Continue enabled. Click Continue → backend `POST /onboarding/select-tier` returns 200 + step 3 loads.
- [ ] Step 2 with `tiers=[]` (temporarily delete from localStorage cache and force fresh state): empty-state card shows with Retry button.
- [ ] Step 3: select template → backend creates departments/agents → Review shows correct counts.
- [ ] Step 5: invalid email → blocked with inline error, no API call made.
- [ ] Step 5: valid emails → Complete step shows `${origin}/invite/${token}` per email.
- [ ] Reload mid-flow on each step → state restored, no duplicate deploy calls.
- [ ] Browser back button works between all steps without losing selections.

---

## 8. Related files

- `frontend-tenant/src/app/onboarding/setup/page.tsx` — the wizard
- `frontend-tenant/src/services/onboarding.service.ts` — API client
- `frontend-tenant/src/services/tiers.service.ts` — `/tiers` client + `Tier` type
- `frontend-tenant/src/services/department-templates.service.ts` — templates client
- `frontend-tenant/src/app/login/page.tsx` — redirects users with `!onboardingCompletedAt`
- `frontend-tenant/src/app/command-center/page.tsx` — post-onboarding landing
- `backend/src/modules/onboarding/*` — controller, service, DTOs, module
- `backend/src/modules/tiers/*` — tier CRUD used by onboarding
- `memory-bank/vercel-operations.md` — deploy procedure
- `memory-bank/contabo-operations.md` — backend deploy/debug