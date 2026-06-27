# NeureCore — Daily Tools & Integration Gaps: Implementation Plan

**Document Version:** 1.1
**Date:** 2026-06-27
**Status:** 📋 READY FOR IMPLEMENTATION
**Changelog:**
- v1.1 (2026-06-27): Review-driven refinements
  - WS-1.1 acceptance uses DB-neutral check
  - WS-2.2 template expansion validates template ⊆ tenant tier pool
  - Removed `Tenant.onboardingState Json` (replaced by typed `OnboardingStatePayload`)
  - WS-3.1 scope toggles replaced with read-only badges + optional "Reauthorize" button
  - WS-6.1 `withGmailRetry` rewritten to take `fetcher: () => Promise<Response>` (Node fetch doesn't expose `.status` on throw)
  - WS-6.2 Drive cleanup: only `TERMINATED` agents >90d old; 7-day notification grace; tenant-configurable retention; ARCHIVED preserved
  - WS-6.2 per-tenant quota counter committed to Upstash Redis
  - WS-7.1 `maxDepartments` decision locked: add column + backfill tiers
**Source:** Full audit of `memory-bank/daily-tools-integration-plan.md`
**Audience:** Engineering

---

## 0. Goal of This Document

The audit identified that all 6 implementation phases (A–F) have backend code shipped, but a substantial list of UI, schema, architecture, risk-mitigation, and deploy gaps remain. This document organizes those gaps into **8 workstreams (WS-1 … WS-8)** that can be implemented in priority order, with concrete tasks, file targets, and acceptance criteria per item.

**Top-level priority order:**
1. **WS-1 Deploy existing Phase C–F code** (highest ROI — unblocks all 7 tools for users)
2. **WS-2 Onboarding flow** (biggest UX gap; blocks `command-center/page.tsx:404` reference)
3. **WS-3 Settings UI gaps** (Manage Google Modal, Agent Integration Assignment)
4. **WS-4 Architecture refactors** (provider interface, credential/drive interfaces, agent integration registry)
5. **WS-5 Agent email gaps** (signature field, Brevo daily-limit monitoring)
6. **WS-6 Risk mitigations** (Drive folder cleanup, account-linking prompt, Gmail backoff)
7. **WS-7 Tier limits enforcement** (storage, departments, API calls)
8. **WS-8 Telemetry / metrics** (instrumentation for Section 10 success metrics)

---

## 1. Confirmed Current State (from code reads)

| Area | Verified |
|---|---|
| Phases A–F backend tools shipped | ✅ All 7 tools (`email`, `documents`, `reports`, `query`, `explain`, `context`, `chat`) exist in `backend/src/modules/tools/built-in/` |
| Agent model has Phase C fields | ✅ `emailAlias`, `emailProvider`, `emailDisplayName` on `Agent` (schema.prisma:519-521) |
| Phase C migration exists but NOT applied | ✅ `prisma/migrations/20260627_agent_email_alias/` exists, pending Contabo deploy |
| Settings `/integrations` page | ✅ 4 cards (Google, Brevo, Slack, M365) — inline Connect/Disconnect only |
| Manage Google Modal route | 🔴 `/settings/integrations/google` linked but route file missing |
| `AgentIntegrationRegistry` | 🔴 Only `StructuredToolRegistry` exists in tools module; no per-agent integration grouping |
| `EmailProvider` interface / factory | 🔴 `EmailTool.resolveSender` switch-case directly uses `BrevoEmailService` + `GoogleGmailService` |
| `ICredentialStore` / `IDriveService` | ⚠️ `PrismaIntegrationCredentialStore` is concrete; `GoogleDriveService` concrete |
| `Agent.emailSignature` | 🔴 Not in schema |
| Brevo daily counter | 🔴 No usage tracking, no 80% warning, no 300/day throttle |
| Drive folder cleanup job | 🔴 No scheduled task |
| Tier limit enforcement | ⚠️ Only `maxAgents` enforced (in `tier-provisioning.service.ts:189,235` and `deployment.service.ts:86,149,302`). NOT enforced: `maxUsers`, `maxStorageGB`, `maxApiCalls`, `maxConversationMessages`, `maxFileSizeMB`, `maxDepartments`. |
| Onboarding state machine | 🔴 No `OnboardingState`, no controller/service. No `/onboarding/setup` route. |
| Redirect rules | 🔴 Login always → `/command-center`. No onboarding-completion check. |
| `Tenant.onboardingCompletedAt` | 🔴 No field |
| Gmail API retry/backoff | ⚠️ Refresh-on-401 works (`google-auth.client.ts:67`). No exponential backoff, no per-user rate limit. |

---

## 2. Workstreams (WS-1 … WS-8)

### WS-1 — Deploy Phase C–F to Production  🚨 HIGHEST PRIORITY

**Why:** All 7 tools are built. None work for real users until the Contabo backend has the schema applied + new build deployed + (already done) env vars in place.

**Tasks:**

| ID | Task | Owner | Done When |
|---|---|---|---|
| WS-1.1 | Apply `prisma migrate deploy` on Contabo for `20260627_agent_email_alias` | Ops (manual via SSH) | Migration row in `_prisma_migrations` table has `20260627_agent_email_alias` with `finished_at IS NOT NULL`; `Agent` model exposes `emailAlias` via Prisma client |
| WS-1.2 | Rebuild backend on Contabo: `pnpm install && pnpm build && restart` (PM2/systemd) | Ops | Health endpoint shows all 7 tools registered (`GET /api/v1/tools/list` returns `email`, `documents`, `reports`, `query`, `explain`, `context`, `chat`) |
| WS-1.3 | Verify `NEXT_PUBLIC_GOOGLE_CLIENT_ID` set in Vercel for `neurecorebase-tenant` (was flagged manual since Session 6) | Najeeb (manual) | Login page "Continue with Google" button works end-to-end on Vercel preview |
| WS-1.4 | Smoke test: ask Sales agent via chat to call `email(action='send')` | QA | Email lands in inbox from `<slug>-agent@neurecore.app` |
| WS-1.5 | Smoke test: ask Sales agent `documents(action='create')` and `reports(action='generate')` | QA | File appears in Drive `NeureCore/<Agent>/Documents/` and `/Reports/` |
| WS-1.6 | Smoke test: ask agent `query(action='ask', question="how many overdue critical tasks")` | QA | Returns count + rows |
| WS-1.7 | Smoke test: ask agent `chat(action='ask', topic='q3-pricing')` from two sessions | QA | Second session sees prior turn |

**Files / commands touched:**
- `contabo` (ssh credentials file) → SSH
- `deployment/scripts/rebuild-and-deploy.sh` (existing)
- `prisma/migrations/20260627_agent_email_alias/`

**Acceptance:** All 7 tools executable from a chat in the deployed tenant portal.

---

### WS-2 — Onboarding Flow  🚨 HIGH PRIORITY

**Why:** `frontend-tenant/src/app/command-center/page.tsx:404` references `/onboarding/setup` but the route doesn't exist. Without onboarding, Google-Sign-In users land in `/command-center` with the default tier and an empty org. No plan selection, no template deploy, no team invite.

**2.1 Schema additions**

New migration `20260627_onboarding`:
```prisma
model Tenant {
  // ... existing
  onboardingCompletedAt DateTime?
  onboardingStep       String? // 'account'|'company'|'plan'|'template'|'review'|'team'|'complete'
}

model OnboardingInvitation {
  id        String   @id @default(uuid())
  tenantId  String
  tenant    Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  email     String
  role      UserRole @default(USER)
  token     String   @unique
  acceptedAt DateTime?
  expiresAt DateTime
  invitedById String?
  invitedBy   User?   @relation(fields: [invitedById], references: [id])
  createdAt DateTime @default(now())
  @@index([tenantId])
  @@index([token])
  @@map("onboarding_invitations")
}
```

**Note on state persistence:** The original draft included `Tenant.onboardingState Json` for wizard step data. **Removed in v1.1 of this plan.** Wizard step data will instead live on the typed `OnboardingStatePayload` interface (in `interfaces/onboarding.interface.ts`), serialized on each `PUT /onboarding/state` call into a typed column or returned back to the client for re-submission. Storing unstructured JSON at the DB level creates drift between the schema and the wizard's actual shape.

**2.2 Backend module `onboarding/`**

New module at `backend/src/modules/onboarding/`:
- `onboarding.module.ts` — registers controller + service
- `onboarding.controller.ts` — endpoints:
  - `GET /onboarding/state` → current state for tenant
  - `PUT /onboarding/state` → update partial state
  - `POST /onboarding/select-tier` → sets tier, creates tenant limit snapshot
  - `POST /onboarding/select-template` → expands department template into Departments + Agents
  - `POST /onboarding/invite` → creates OnboardingInvitation rows
  - `POST /onboarding/complete` → sets `onboardingCompletedAt`, runs final checks
  - `POST /onboarding/accept-invite/:token` → public, creates User + links to tenant
- `onboarding.service.ts` — state machine logic + template expansion
- `interfaces/onboarding.interface.ts` — `OnboardingStep` union, `OnboardingState` type
- `dto/onboarding.dto.ts`

**Template expansion logic (in `onboarding.service.ts:selectTemplate`):**
```
Validate: template.tierAgentPools ⊆ tenant.tier.tierAgentPools
  (every agent-pool entry referenced by template must be available to the tenant's tier)
  Else: throw ForbiddenException('Template not available on current tier. Upgrade required.')
For each department in template.structure:
  Create Department { tenantId, name, slug, type }
For each agent slot in template (filtered to tenant's tier pool):
  Create Agent { tenantId, name, departmentId, tierAgentPoolId, templateId, isSelected=true }
Return list of created Departments + Agents
```

**2.3 Frontend `/onboarding/setup` route**

New file `frontend-tenant/src/app/onboarding/setup/page.tsx`:
- Multi-step wizard (using existing shadcn/ui `Tabs` + `Card` components)
- Step 1: Company info (name, logo URL, timezone, currency) — pre-fills if Google Sign-In
- Step 2: Plan selection (cards for STARTER / GROWTH / PRO / ENTERPRISE)
- Step 3: Template selection (cards for "Startup", "Sales", "Operations", "Full Stack", "Custom")
- Step 4: Review deployed departments + agents (list with rename inputs, agent toggle, within-tier limits shown)
- Step 5: Invite team (email input → role select → send invites)
- Step 6: Done → redirects to `/command-center`

Backend uses existing `GET /tiers` for plan list and `GET /department-templates` for templates.

**2.4 Redirect rules**

Create `frontend-tenant/src/components/auth/OnboardingGuard.tsx` — wrapper that:
- If user logged in AND `tenant.onboardingCompletedAt` is null → redirect to `/onboarding/setup`
- If user logged in AND `tenant.onboardingCompletedAt` set → continue

Apply in the appropriate auth-gated layout (confirm path during Sprint 1 — check `frontend-tenant/src/app/layout.tsx` root vs an existing `(authenticated)` route group before implementation).

Update `frontend-tenant/src/app/login/page.tsx`:
- After successful login (Google or email), check `GET /tenants/me` for `onboardingCompletedAt`
- If null → `router.push('/onboarding/setup')`
- Else → `router.push(returnTo || '/command-center')`

**2.5 Acceptance criteria**

- [ ] New Google Sign-In user lands on `/onboarding/setup` not `/command-center`
- [ ] Selecting GROWTH + "Sales Team" template creates 3 departments + 4 agents
- [ ] User can rename a department/agent before completing
- [ ] Inviting a teammate creates `OnboardingInvitation` row + sends email (or shows invite link)
- [ ] On complete, `tenant.onboardingCompletedAt` is set; user lands in `/command-center` with full org
- [ ] Re-login skips onboarding

---

### WS-3 — Settings UI Gaps  🚨 HIGH PRIORITY

**3.1 Manage Google Modal — scope toggles + folder list + disconnect**

New file `frontend-tenant/src/app/settings/integrations/google/page.tsx`:
- Reads `GET /integrations` to get current Google scopes + `tenant.googleDriveRootFolderId`
- Shows 4 checkboxes: Gmail, Drive, Calendar, Sheets (each maps to the OAuth scopes)
  - Read-only badges (not checkboxes) labeled "Granted during OAuth — reconnect to change" — scope changes require disconnect + reconnect in v1
  - Optional: a "Reauthorize Google" button next to scopes that re-triggers OAuth with a scoped subset of permissions
- Lists Drive folder tree under `NeureCore/` (calls new `GET /integrations/google/drive-folders` backend endpoint, see 3.2)
- "Disconnect" button with confirmation modal (replaces the inline `confirm()` in current `page.tsx:371`)

**3.2 New backend endpoints**

Add to `backend/src/modules/integrations/integrations.controller.ts`:
- `GET /integrations/google/drive-folders` → lists children of `tenant.googleDriveRootFolderId` via existing `GoogleDriveService`
- `GET /integrations/usage/brevo` → returns `{ sentToday, dailyLimit: 300, warningThreshold: 240 }`

**3.3 Agent Integration Assignment UI**

In the existing agent edit page (find at `frontend-tenant/src/app/agents/[id]/page.tsx` or `frontend-tenant/src/components/agents/`), add a new "Integrations" section:
- Email alias text input (`Agent.emailAlias`)
- Email provider radio (`brevo` / `gmail`)
- Email display name input (`Agent.emailDisplayName`)
- Email signature textarea (`Agent.emailSignature` — see WS-5 for the schema add)
- Drive folder ID (read-only display — shows `Agent.googleDriveFolderId`)
- Permissions toggles (uses existing `Agent.permissions` JSON: `email:read`, `email:send`, `drive:read`, `drive:write`, `calendar:read`, `calendar:write`, `sheets:read`, `sheets:write`)

New backend endpoint:
- `PATCH /agents/:id/integration-config` → updates email fields + permissions

In `backend/src/modules/agents/agents.controller.ts` (or wherever the agent CRUD lives), add the new route + service method.

**3.4 Acceptance**

- [ ] `/settings/integrations/google` page exists with scope checkboxes (informational) + folder tree
- [ ] Disconnect Google from the modal triggers backend revoke and refreshes card
- [ ] Agent edit page shows integration section; saving updates backend
- [ ] Setting email alias on Sales agent results in `FROM: sales-agent@…` when agent sends email

---

### WS-4 — SOLID Architecture Refactors  🟡 MEDIUM PRIORITY

**4.1 `EmailProvider` interface + factory**

New file `backend/src/modules/integrations/email/interfaces/email-provider.interface.ts`:
```typescript
export interface EmailProvider {
  readonly name: 'gmail' | 'brevo';
  send(input: ProviderSendInput): Promise<ProviderSendResult>;
  // readInbox is provider-specific; keep on services for now (provider interface focused on send)
}

export interface ProviderSendInput {
  tenantId: string;
  from: string;
  fromName?: string;
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  body: string;
  html?: boolean;
  signature?: string;
}

export interface ProviderSendResult {
  provider: 'gmail' | 'brevo';
  messageId: string;
  threadId?: string;
}
```

New file `backend/src/modules/integrations/email/gmail-email.provider.ts` — wraps `GoogleGmailService.sendEmail`, returns `ProviderSendResult`.
New file `backend/src/modules/integrations/email/brevo-email.provider.ts` — wraps `BrevoEmailService.sendEmail`, applies signature HTML.

New file `backend/src/modules/integrations/email/email-provider.factory.ts`:
```typescript
@Injectable()
export class EmailProviderFactory {
  constructor(
    private readonly gmail: GmailEmailProvider,
    private readonly brevo: BrevoEmailProvider,
  ) {}

  forSend(tenantId, preferred: 'gmail'|'brevo'|'auto'): Promise<EmailProvider>
}
```

Refactor `EmailTool.send` (in `backend/src/modules/tools/built-in/email.tool.ts:222-281`) to use `EmailProviderFactory.forSend(...)` instead of directly calling `this.gmail.sendEmail` / `this.brevo.sendEmail`. Remove the switch-case in `resolveSender`.

Add `IntegrationsModule.providers += [GmailEmailProvider, BrevoEmailProvider, EmailProviderFactory]` and export from `IntegrationsModule` so `ToolsModule` (which already imports `IntegrationsModule` via forwardRef) can inject the factory.

**4.2 `ICredentialStore` + `IDriveService` interfaces**

New file `backend/src/modules/integrations/services/credential-store.interface.ts`:
```typescript
export interface ICredentialStore {
  save(tenantId, provider, credentials, label?): Promise<void>;
  get(tenantId, provider): Promise<IntegrationCredentials | null>;
  delete(tenantId, provider): Promise<void>;
  exists(tenantId, provider): Promise<boolean>;
  updateStatus(tenantId, provider, status): Promise<void>;
}
```

Add `implements ICredentialStore` to `PrismaIntegrationCredentialStore` (line 19). No body changes — just satisfies the contract.

New file `backend/src/modules/integrations/services/drive-service.interface.ts`:
```typescript
export interface IDriveService {
  createFolder(name, parentId?): Promise<Folder>;
  createFile(name, folderId, content, mimeType?): Promise<File>;
  listFiles(folderId, q?): Promise<DriveFile[]>;
  deleteFile(fileId): Promise<void>;
  share(fileId, email, role): Promise<void>;
}
```

Add `implements IDriveService` to `GoogleDriveService`. The interface lives in `backend/src/modules/integrations/google/` directory.

**4.3 `AgentIntegrationRegistry`**

New file `backend/src/modules/integrations/registry/agent-integration.registry.ts`:
```typescript
export interface IAgentIntegration {
  name: string;
  category: 'communication' | 'storage' | 'calendar' | 'data';
  resolveTools(tenantId, agentId): Promise<IStructuredTool[]>;
  hasCredentials(tenantId): Promise<boolean>;
}

@Injectable()
export class AgentIntegrationRegistry {
  private integrations = new Map<string, IAgentIntegration>();
  register(name, integration): void;
  get(name): IAgentIntegration | undefined;
  list(): IAgentIntegration[];
  availableForTenant(tenantId): Promise<IAgentIntegration[]>; // filter by credentials
}
```

Concrete implementations (each in its own file):
- `GoogleWorkspaceIntegration` — wraps Gmail + Calendar + Drive + Sheets tools, requires `IntegrationProvider.GOOGLE`
- `BrevoEmailIntegration` — wraps Brevo-based email (uses Brevo-only path), requires `IntegrationProvider.BREVO`

Register in `IntegrationsModule.onModuleInit()`:
```typescript
onModuleInit() {
  this.registry.register('google', new GoogleWorkspaceIntegration(...));
  this.registry.register('brevo', new BrevoEmailIntegration(...));
}
```

`StructuredToolRegistry` (in `backend/src/modules/tools/`) gets a new method `getToolsForAgent(tenantId, agentId)` that consults `AgentIntegrationRegistry.availableForTenant(tenantId)` and only returns tools whose integration has credentials.

**4.4 Acceptance**

- [ ] `EmailTool` no longer references `this.gmail`/`this.brevo` directly in send flow; only uses `factory.forSend(...)`
- [ ] Adding a new email provider (e.g., `SendgridEmailProvider`) requires only creating the class + 1 line in factory — no EmailTool edit
- [ ] `PrismaIntegrationCredentialStore` typed as `ICredentialStore` in DI tokens (NestJS string symbol token)
- [ ] `GoogleDriveService` typed as `IDriveService`
- [ ] Tools registry filters unavailable integrations per tenant

---

### WS-5 — Agent Email Gaps  🟡 MEDIUM PRIORITY

**5.1 Add `Agent.emailSignature`**

New migration `20260628_agent_email_signature`:
```prisma
model Agent {
  // ...
  emailSignature String? @db.Text // HTML or plain-text appended to outbound emails
}
```

Update `BrevoEmailProvider.send` (from WS-4.1) to append signature:
```typescript
const finalHtml = input.signature
  ? `${input.body}<br><br><div class="signature">${escapeHtml(input.signature)}</div>`
  : input.body;
```

Update `GmailEmailProvider.send` similarly (Gmail API accepts `htmlContent` + raw body).

Update `EmailTool.send` (or new `EmailInput` schema) to accept `signature` override; default to `agent.emailSignature`.

**5.2 Brevo daily-limit monitoring**

New Prisma model `BrevoUsageCounter`:
```prisma
model BrevoUsageCounter {
  id        String   @id @default(uuid())
  tenantId  String
  date      DateTime @db.Date // date only, midnight UTC
  sentCount Int      @default(0)
  @@unique([tenantId, date])
  @@index([tenantId])
  @@map("brevo_usage_counters")
}
```

New service `BrevoUsageService` (`backend/src/modules/integrations/brevo/brevo-usage.service.ts`):
- `recordSend(tenantId)` — UPSERT counter for today, increment by 1
- `getTodayCount(tenantId)` — returns count
- `checkLimit(tenantId)` — throws `BadRequestException('Brevo daily limit (300) reached. Upgrade plan or wait until tomorrow.')` if ≥300
- `getStatus(tenantId)` — `{ sentToday, dailyLimit: 300, warningThreshold: 240, isAtWarning, isAtLimit }`

Inject into `BrevoEmailProvider.send`:
```typescript
async send(input) {
  await this.usage.checkLimit(input.tenantId);
  // ... send via Brevo API ...
  await this.usage.recordSend(input.tenantId);
}
```

Expose `GET /integrations/usage/brevo` returning `BrevoUsageService.getStatus(tenantId)`.

Frontend `BrevoIntegrationCard` (in `settings/integrations/page.tsx:134`): show small "X/300 emails today" badge; if at warning, show yellow toast in dashboard; if at limit, show red banner.

**5.3 Acceptance**

- [ ] Agent edit page exposes `Email Signature` textarea
- [ ] Sending email from Brevo includes the agent's signature at the bottom
- [ ] Sending 240th email triggers warning notification (dashboard toast or email)
- [ ] Sending 301st email throws clear error message; UI shows red banner

---

### WS-6 — Risk Mitigations  🟡 MEDIUM PRIORITY

**6.1 Gmail API rate-limit exponential backoff**

New file `backend/src/modules/integrations/google/gmail-rate-limiter.ts`:
```typescript
export async function withGmailRetry<T>(
  fetcher: () => Promise<Response>,
  parser: (res: Response) => Promise<T>,
  opts: { maxAttempts?: number; baseMs?: number } = {},
): Promise<T> {
  const { maxAttempts = 4, baseMs = 500 } = opts;
  let attempt = 0;
  while (true) {
    const res = await fetcher();
    if (res.ok) return parser(res);
    const status = res.status;
    const retryable = status === 429 || (status >= 500 && status < 600);
    if (!retryable || attempt >= maxAttempts - 1) {
      throw new GmailApiError(status, await res.text().catch(() => 'unknown'));
    }
    const delay = baseMs * 2 ** attempt + Math.random() * 100;
    await new Promise(r => setTimeout(r, delay));
    attempt++;
  }
}
```

Notes:
- Node 18+ `fetch` returns a `Response`; transient errors don't throw with `.status`. The original `err.status ?? err.response.status` pattern will never trigger retries on real network failures. The new signature passes the fetcher in and inspects `res.status`.
- Wrap Gmail API calls in `GoogleGmailService` and `EmailTool.flag` (`email.tool.ts:285`).

Per-tenant counter (Upstash Redis — already in production stack):
- Key shape: `gmail:quota:{tenantId}:{minuteBucket}` where `minuteBucket = floor(now / 60_000)`
- Use `INCR` + first-write `EXPIRE 90` (covers a minute plus jitter)
- If counter > 250 quota units/min/tenant → short-circuit with HTTP 429 + `Retry-After` header

**6.2 Drive folder cleanup job**

New file `backend/src/modules/integrations/google/drive-cleanup.service.ts`:
```typescript
@Injectable()
export class DriveCleanupService {
  @Cron('0 3 * * *') // 3 AM daily
  async cleanupOrphanFolders() {
    // Only TERMINATED agents older than 90 days (preserve ARCHIVED audit trail)
    const candidates = await this.prisma.agent.findMany({
      where: {
        status: 'TERMINATED',
        googleDriveFolderId: { not: null },
        updatedAt: { lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
      },
    });
    for (const agent of candidates) {
      // Send 7-day notification to tenant admins via NotificationService first
      // After 7-day grace window, on next cron tick:
      const children = await this.drive.listFiles(agent.googleDriveFolderId);
      if (children.length === 0) {
        await this.drive.deleteFile(agent.googleDriveFolderId);
      } else {
        // log warning, skip (do NOT delete non-empty folders automatically)
      }
    }
  }
}
```

Notes:
- `ARCHIVED` agents are preserved (soft-delete audit-trail policy in `schema.prisma:50`); only `TERMINATED` agents beyond a 90-day window are eligible.
- Tenants are notified 7 days before any deletion (via `NotificationService`).
- Retention is configurable per tenant via `Tenant.settings.retentionDays`.
- Register in `IntegrationsModule.providers`. Needs `@nestjs/schedule` (verify installed — should already be in the stack).

**6.3 "Link or different account?" UI prompt**

When Google Sign-In returns an email that matches an existing user WITHOUT `googleId` linked, the audit's #2 risk notes users may not realize they're signing into a different account.

Currently in `auth.service.ts:150-166`: silent auto-link. Change to:
- Backend returns `{ status: 'existing_unlinked', user: {...} }` (no tokens issued)
- Frontend shows modal: "An account already exists for jane@acme.com. Link your Google sign-in to this account, or sign in with a different Google account?"
  - "Link account" → backend completes link + issues tokens
  - "Use different account" → re-triggers Google Sign-In flow

Update `GoogleSignInDto` (existing) and `IAuthService.googleSignIn` interface to handle 3 return shapes: `new_user`, `existing_linked`, `existing_unlinked`.

**6.4 Acceptance**

- [ ] Gmail 429 triggers automatic backoff retry (4 attempts, 500ms→8s exponential)
- [ ] Deleted/archived agents' empty Drive folders are removed nightly (verified by checking Drive after 24h)
- [ ] Google Sign-In with an existing unlinked email shows "Link or different account?" modal

---

### WS-7 — Tier Limits Enforcement  🟢 LOW PRIORITY (after WS-2)

**7.1 Extend `ITierLimits` enforcement**

Existing: `maxAgents` enforced (3 files: `tier-provisioning.service.ts:189,235`, `deployment.service.ts:86,149,302`).

Add enforcement (each is a small middleware/guard):

| Limit | Where to enforce |
|---|---|
| `maxUsers` | `users.service.ts:createUser` — reject if `count(users where tenantId) >= tier.maxUsers` |
| `maxStorageGB` | Document upload tools (`documents.tool.ts:create`, `reports.tool.ts:generate`) — sum file sizes; reject if would exceed |
| `maxApiCalls` | Existing `QuotaUsage` model (schema.prisma:965). Add a service `QuotaEnforcementService` that increments per-tenant per-day; reject when exceeded |
| `maxConversationMessages` | Chat service / `chat.tool.ts:remember` — count conversation turns; reject new turn if exceeded |
| `maxFileSizeMB` | Document upload — reject if `file.size > tier.maxFileSizeMB` |
| `maxDepartments` | `departments.service.ts:createDepartment` — reject if `count(departments where tenantId) >= tier.maxDepartments` |

**Decision (locked):** Add `maxDepartments Int @default(1)` to the `Tier` model — keeps enforcement centralized and consistent with how `maxAgents/maxUsers/maxStorageGB/maxApiCalls` are already modeled. New migration `20260628_tier_max_departments`. Backfill tiers: STARTER=1, GROWTH=3, PRO=5, ENTERPRISE=999 (sentinel for "unlimited").

**7.2 TierLimitsGuard (NestJS Guard)**

New `backend/src/common/guards/tier-limits.guard.ts`:
- Reads `@TierLimit('type')` decorator from route handler
- Checks tenant's tier against the relevant limit
- Throws `ForbiddenException` with structured error `{ code: 'TIER_LIMIT_EXCEEDED', limit: 'maxUsers', current, max, upgradeUrl: '/settings/billing' }`

Use on agent/user/department/file-creation routes.

**7.3 Acceptance**

- [ ] STARTER tenant cannot create a 4th agent
- [ ] STARTER tenant cannot create a 2nd department
- [ ] STARTER tenant cannot exceed 1 GB of Drive uploads (returns 413 with clear message)
- [ ] STARTER tenant sees 1000-API-call/day cap enforced; counter visible in `/settings/billing`

---

### WS-8 — Telemetry & Success Metrics  🟢 LOW PRIORITY

**8.1 Event instrumentation**

Add lightweight analytics events to a new `TelemetryService` (`backend/src/modules/observability/telemetry.service.ts`):

| Metric | Where to record |
|---|---|
| `auth.google_signin.started` / `.success` / `.failure` | `auth.service.ts:googleSignIn` |
| `onboarding.started` / `.step_completed` / `.completed` | `onboarding.service.ts` |
| `integration.google.connect.started` / `.success` / `.failure` | `integrations.controller.ts` |
| `email.sent.success` / `.failure` | `BrevoEmailProvider.send` / `GmailEmailProvider.send` |
| `document.created.success` / `.failure` | `documents.tool.ts:create` |
| `report.generated.success` / `.failure` | `reports.tool.ts:generate` |
| `tool.cross_tenant_attempt` (security) | All tool inputs where `tenantId` filter is enforced |

Storage: write to existing `TenantMetric` model (schema.prisma:881) with `type=METRIC_TYPE.COUNTER`, plus optionally batch-flush to analytics destination (PostHog, or just keep in DB for now).

**8.2 Cross-tenant test suite**

New `backend/test/security/cross-tenant-isolation.e2e-spec.ts`:
- Spin up 2 test tenants
- For each tool (`query`, `email`, `documents`, `reports`, `context`, `chat`):
  - Attempt to access tenant-A resource from tenant-B context
  - Assert 403/404 returned; no rows leak
- CI gate: must pass before deploy

**8.3 Login timing**

`auth.controller.ts` measures `Date.now()` before/after `authService.googleSignIn` and `authService.login`; emits to `TenantMetric` as `auth.login.duration_ms`.

**8.4 Acceptance**

- [ ] Backend logs/metrics show counts of Google Sign-In success/failure
- [ ] Onboarding completion % calculable from `Tenant.onboardingCompletedAt IS NOT NULL` vs total
- [ ] CI runs cross-tenant test; deploy blocked on failure
- [ ] Login duration visible in metrics table

---

## 3. Recommended Implementation Sequence

**Sprint 1 (1–2 days)** — Deploy + critical onboarding
1. WS-1.1 → WS-1.7 (deploy)
2. WS-2.1 → WS-2.4 (onboarding schema + module + route + redirect)
3. WS-3.1 → WS-3.2 (Manage Google Modal — depends on existing routes)

**Sprint 2 (1–2 days)** — UI gaps + email polish
4. WS-3.3 (Agent Integration Assignment UI)
5. WS-5.1 (email signature)
6. WS-6.3 (link-account prompt)

**Sprint 3 (2–3 days)** — Architecture
7. WS-4.1 (EmailProvider interface + factory)
8. WS-4.2 (ICredentialStore + IDriveService)
9. WS-4.3 (AgentIntegrationRegistry)

**Sprint 4 (1–2 days)** — Risk + limits
10. WS-5.2 (Brevo daily counter)
11. WS-6.1 (Gmail backoff)
12. WS-6.2 (Drive cleanup)
13. WS-7.1 → WS-7.2 (tier limits)

**Sprint 5 (1 day)** — Telemetry
14. WS-8.1 → WS-8.3

---

## 4. Cross-Cutting Conventions (must follow)

- **SOLID:** All new abstractions behind interfaces; tools depend on abstractions.
- **Tenant isolation:** Every tool input + every DB query filters by `tenantId` (audit Section 8 #8).
- **Encryption:** All new credential columns encrypted via existing `CryptoService`.
- **Backwards compatibility:** All migrations add nullable columns / default values; old code keeps working.
- **Audit logging:** All onboarding + integration-connect/disconnect actions write to `AuditLog`.
- **Error UX:** All user-facing errors include: human-readable message, action to take, link to docs.
- **No code comments** (per project standard).
- **Frontend:** Use existing `shadcn/ui` components in `frontend-tenant/src/components/ui/`; match existing card/dialog patterns.
- **Backend:** Use existing `PrismaService` for DB; existing `Logger` for logging.

---

## 5. Out of Scope (per Section 9 of plan)

Confirmed deferred to Phase 2+:
- NocoBase integration
- Microsoft 365 integration (Slack + M365 cards stay as "Coming Soon")
- Custom domain email without paid Google Workspace
- Apple/GitHub Sign-In
- Slack integration
- Video conferencing
- CRM/ERP connectors

---

## 6. Acceptance: Definition of Done for the Whole Gap Closure

When all workstreams complete:

1. **A new Google Sign-In user** lands on `/onboarding/setup` → completes plan + template → invites 1 teammate → lands in `/command-center` with a fully deployed org within 5 minutes.
2. **A user can configure per-agent email aliases, providers, display names, and signatures** from the agent edit page; outbound emails include the signature.
3. **The Manage Google Modal** shows scopes, folder tree, and a clean disconnect flow.
4. **EmailTool/DocumentsTool/ReportsTool/QueryTool/ExplainTool/ContextTool/ChatTool** are all reachable from a chat and produce expected results.
5. **Brevo daily limit** is enforced with friendly warning + hard cap; no silent failures.
6. **Adding a new email provider** requires no edits to `EmailTool` (OCP).
7. **Cross-tenant isolation** is CI-tested.
8. **Drive folders** for archived agents are auto-cleaned nightly.
9. **Tier limits** (users, agents, departments, storage, API calls) are enforced everywhere.
10. **Metrics** (Section 10) are all measurable.

---

**Document Status:** 📋 Ready for implementation. Workstreams sequenced by ROI. Sprint plan covers ~7–10 working days of effort across all gaps.