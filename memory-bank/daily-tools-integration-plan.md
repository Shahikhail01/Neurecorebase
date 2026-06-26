# NeureCore — Daily Tools & Integration Plan

**Document Version:** 1.5  
**Date:** 2026-06-26  
**Status:** Phase A + Phase B (Weeks 5-10) COMPLETE — Google Sign-In + Integrations Module + Gmail + Calendar + Drive folder per agent. Brevo SMTP done.  
**Audience:** Engineering, product, planning

---

## 1. Decisions Locked

### ✅ Section 1.5 Google Sign-In — IMPLEMENTED

| Item | Status | Notes |
|---|---|---|
| `User.googleId` + `User.googlePicture` fields | ✅ Done | Schema updated, migration created |
| `passwordHash` optional (null for Google users) | ✅ Done | Allows passwordless Google accounts |
| `GoogleSignInDto` | ✅ Done | `backend/src/modules/auth/dto/google-signin.dto.ts` |
| `GoogleSignInInput` interface | ✅ Done | Added to `auth.interface.ts` |
| `IAuthService.googleSignIn()` | ✅ Done | Interface updated |
| `AuthService.googleSignIn()` | ✅ Done | Link existing OR create new user+tenant |
| `POST /auth/google` endpoint | ✅ Done | Verifies via Google tokeninfo endpoint |
| `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` env vars | ✅ Done | Added to `.env.example` |
| Frontend `googleSignIn()` in auth.service.ts | ✅ Done | Sends id_token to backend |
| Login page `Continue with Google` button | ✅ Done | GIS loaded via script tag, no npm package |
| Admin portal — no Google button | ✅ Done | Email/password only |
| Token verification approach | ✅ Done | `oauth2.googleapis.com/tokeninfo?id_token=` (no `google-auth-library` needed) |
| Auto-provision tenant for new Google users | ✅ Done | Creates tenant with default tier |
| Default tier lookup | ✅ Done | `prisma.tier.findFirst({ where: { isDefault: true }})` |

**Files created/modified:**
```
backend/prisma/schema.prisma                              (+googleId, googlePicture, passwordHash?, IntegrationCredential)
backend/prisma/migrations/20260626_add_google_signin/     (Week 0 migration)
backend/prisma/migrations/20260626_integration_credentials/ (Week 1 migration)
backend/src/modules/auth/dto/google-signin.dto.ts          (Week 0)
backend/src/modules/auth/interfaces/auth.interface.ts     (Week 0)
backend/src/modules/auth/services/auth.service.ts          (Week 0)
backend/src/modules/auth/controllers/auth.controller.ts    (Week 0)
backend/src/modules/integrations/                          (Week 1-4 - NEW module)
backend/src/modules/integrations/integrations.module.ts   (Week 1)
backend/src/modules/integrations/integrations.service.ts   (Week 1)
backend/src/modules/integrations/integrations.controller.ts (Week 1)
backend/src/modules/integrations/dto/integration.dto.ts    (Week 1)
backend/src/modules/integrations/services/integration-credential.store.ts (Week 3)
backend/src/modules/integrations/brevo/brevo-email.service.ts (Week 4)
backend/src/app.module.ts                                 (+IntegrationsModule)
backend/.env.example                                      (+GOOGLE_*, BREVO_API_KEY)
frontend-tenant/.env.example                              (+NEXT_PUBLIC_GOOGLE_CLIENT_ID)
frontend-tenant/.env.production                           (+NEXT_PUBLIC_GOOGLE_CLIENT_ID)
frontend-tenant/src/services/auth.service.ts             (Week 0)
frontend-tenant/src/services/integrations.service.ts     (Week 1)
frontend-tenant/src/app/login/page.tsx                   (Week 0)
frontend-tenant/src/app/settings/integrations/page.tsx (Week 1)
frontend-tenant/src/app/settings/integrations/callback/google/page.tsx (Week 2)
```

**Pending deploy steps:**
1. `npx prisma migrate deploy` on Contabo (both migrations)
2. Add `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` + `GOOGLE_REDIRECT_URI` + `BREVO_API_KEY` to Contabo backend `.env`
3. Set `NEXT_PUBLIC_GOOGLE_CLIENT_ID` in Vercel dashboard for tenant frontend
4. Deploy backend to Contabo (`npm run build` + restart)

### 1.1 NocoBase — Not Adopted as Core Dependency

**Decision:** NocoBase will NOT become part of NeureCore's core architecture.

**Rationale:**
- Two applications (NeureCore + NocoBase) sharing Postgres/Redis still means two products to maintain
- Authentication ownership handed to NocoBase creates unacceptable coupling
- CRM/ERP absorption conflicts with NeureCore's mission as AI agent platform
- Operational complexity of dual upgrade cycles, dual RBAC, dual API surfaces

**When NocoBase MAY be reconsidered:**
- Phase 3+ when specific high-effort capabilities (approval workflows, low-code forms) are confirmed needed
- Customers request configurable internal business apps as a add-on
- Engineering bandwidth exists to manage the added complexity

**Architecture going forward:**
```
NeureCore (own it)
├── Authentication & Identity
├── RBAC (8 roles)
├── AI Agents
├── Workflows / Tasks / Routines
├── Marketplace
├── Service Desk
├── Finance
└── Public APIs
         │
         ▼ (optional, later)
NocoBase (bounded extension, not dependency)
├── Internal admin tools
├── Dynamic forms
├── Approval workflows
└── Customer-specific low-code extensions
```

---

### 1.2 Daily Tools Strategy — Build AI-First, Not Feature-Complete

**Decision:** Build the 5-6 tools every business uses daily, with AI baked in. Leave specialized domains to best-in-class integrations.

| Tool | Priority | AI Differentiator | Build vs Integrate |
|---|---|---|---|
| **Email** | Phase 2 | AI reads, summarizes, drafts, prioritizes | Build via Google OAuth |
| **Reports/Dashboards** | Phase 2 | AI generates narratives from data, not just charts | Build (already have data) |
| **Data Tables** | Phase 3 | AI queries in plain English, explains data | Build on existing DB |
| **Documents** | Phase 3 | AI drafts, reviews, extracts from templates | Build |
| **Internal Chat** | Phase 3 | AI answers questions from company context | Build in-app |
| **PDF Generation** | Phase 2 | AI generates from data + templates | Build server-side |

**What we DON'T build (integrate instead):**
- Full CRM → Integrate with HubSpot/Salesforce via API
- ERP → Integrate with QuickBooks via API
- Video conferencing → Jitsi (embed, free) or Google Meet (when Workspace connected)
- Social media management → Native integrations with Meta/LinkedIn/Twitter APIs

---

### 1.3 Google Workspace Integration — Free Tier First

**Decision:** Google Workspace (free personal Gmail account) covers email/docs/sheets/calendar for startup customers at no cost. Paid Google Workspace is an optional upgrade.

**What works with FREE personal Gmail:**
| Google Service | API Access | Notes |
|---|---|---|
| Google Drive | ✅ Read/write | Files and folders |
| Google Docs | ✅ Read/write | Documents |
| Google Sheets | ✅ Read/write | Spreadsheets |
| Google Calendar | ✅ Read/write | Events |
| Gmail | ✅ Read/send | Via OAuth |
| Google Forms | ✅ Read responses | Via API |

**What requires PAID Google Workspace:**
| Service | Why needed |
|---|---|
| Custom domain email (`user@company.com`) | Personal Gmail addresses only |
| Google Meet | Workspace feature |
| Shared Drives | Team collaboration folder |
| Admin console | Organization management |

**Architecture:**
```
NeureCore MVP (Free — Day 1)
├── Email: Gmail OAuth (user's personal Gmail)
│            OR Brevo SMTP (agent email aliases)
├── Documents: Google Docs (personal Gmail)
│                OR Markdown in NeureCore storage
├── Spreadsheets: Google Sheets (personal Gmail)
│                   OR NeureCore Tables
├── Calendar: Google Calendar (personal Gmail)
├── PDF: Server-side generation (puppeteer/pdfkit)
├── Forms: NeureCore Forms (built-in)
└── Chat: In-app messaging (built-in)

Google Workspace Paid Add-on (Later)
├── Custom domain email per agent
├── Google Meet integration
├── Shared Drives for team collaboration
└── Full Workspace AI features
```

---

### 1.4 Per-Agent Aliases — Day 1 Feature

**Decision:** Every AI agent has its own email identity (`sales-agent@company.com`) from launch. This is not tied to Google Workspace — it's tied to Brevo (free SMTP relay) or user's personal Gmail.

**Why this matters:**
- Clients see different AI agents as different senders
- Each agent maintains its own communication thread
- Clear accountability: "which agent did this"
- Agents can have different tones, signatures, branding

**Email stack:**
```
Agent composes email
       ↓
Brevo SMTP relay (free: 300 emails/day)
       ↓
Recipient sees: from sales-agent@company.com
```

| Free Tier | Limit | Cost |
|---|---|---|
| Brevo (Sendinblue) | 300 emails/day | Free |
| Mailgun | 500 emails/month | Free tier |
| AWS SES | 62,000 emails/month | Free for new AWS |

**Per-agent alias per tier:**
| Agent | Email Alias | Drive Folder |
|---|---|---|
| Sales Agent | sales-agent@company.com | NeureCore/Sales Agent/ |
| HR Agent | hr-agent@company.com | NeureCore/HR Agent/ |
| Ops Agent | ops-agent@company.com | NeureCore/Ops Agent/ |
| Finance Agent | finance-agent@company.com | NeureCore/Finance Agent/ |

---

### 1.5 Google Sign-In — One-Click App Entry

**Decision:** "Continue with Google" is the primary signup/login option. Email + password is secondary. This reduces signup friction and automatically establishes Google identity for future workspace connections.

**Why:**
- Startup users already authenticated with Google
- Eliminates password creation + email verification step
- One click → account created + logged in + Google identity ready
- Faster time-to-value (seconds vs minutes)
- Mobile-friendly (no keyboard required for auth)

**Tenant Portal Login Page (`hq.neurecore.com`):**
```
┌─────────────────────────────────────────┐
│                                         │
│            [NeureCore Logo]             │
│                                         │
│     ┌─────────────────────────────┐     │
│     │   Continue with Google     │     │
│     │        [Google Icon]       │     │
│     └─────────────────────────────┘     │
│                                         │
│         ─── or ───                      │
│                                         │
│     ┌─────────────────────────────┐     │
│     │  Email                     │     │
│     └─────────────────────────────┘     │
│     ┌─────────────────────────────┐     │
│     │  Password                  │     │
│     └─────────────────────────────┘     │
│                                         │
│         [Sign In]                       │
│                                         │
│     Don't have an account? Sign up      │
│                                         │
└─────────────────────────────────────────┘
```

**Admin Portal Login Page (`cc.neurecore.com`):**
```
┌─────────────────────────────────────────┐
│                                         │
│            [NeureCore Logo]             │
│              Admin Portal                │
│                                         │
│     ┌─────────────────────────────┐     │
│     │  Email                     │     │
│     └─────────────────────────────┘     │
│     ┌─────────────────────────────┐     │
│     │  Password                  │     │
│     └─────────────────────────────┘     │
│                                         │
│         [Sign In]                       │
│                                         │
│     Internal credentials only.           │
│     Google Sign-In not available.        │
│                                         │
└─────────────────────────────────────────┘
```

**Signup Page (Same UX — collapsed by default):**
```
┌─────────────────────────────────────────┐
│                                         │
│            [NeureCore Logo]             │
│                                         │
│     ┌─────────────────────────────┐     │
│     │   Continue with Google      │     │
│     │        [Google Icon]       │     │
│     └─────────────────────────────┘     │
│                                         │
│         ─── or ───                      │
│                                         │
│     [Expand: Create with email]         │
│                                         │
│     Already have an account? Sign in     │
│                                         │
└─────────────────────────────────────────┘
```

**Google Sign-In Flow (Same Google OAuth, different scope):**
```
User clicks "Continue with Google"
       ↓
Google OAuth popup (consent screen)
       ↓
NeureCore receives: id_token (contains email, name, picture)
       ↓
Check: Does email exist in our DB?
  → YES: Log user in (link Google identity)
  → NO:  Create account + tenant + log in
       ↓
Prompt: "Connect Google Workspace for your agents?"
  → Skip (later in Settings)
  → Connect (initiates Google integration flow)
       ↓
Redirect to /onboarding (plan selection)
```

**Google Sign-In vs Google Workspace Integration:**

| Aspect | Google Sign-In | Google Workspace Integration |
|---|---|---|
| **Purpose** | User authentication | AI agent capabilities |
| **Scope** | `email`, `profile`, `openid` | Gmail, Drive, Calendar, Sheets |
| **When** | Login/signup (always) | Optional, post-onboarding |
| **Who** | Human users (tenant portal only) | AI agents acting on behalf of user |
| **Portals** | Tenant portal (`hq.neurecore.com`) ONLY | Tenant portal |
| **Admin Portal** | ❌ NOT available | N/A |

**Important:** Admin portal (`cc.neurecore.com`) uses ONLY internal email/password credentials. Google Sign-In is exclusively for the tenant portal.

**Backend Implementation:**
```typescript
// POST /api/v1/auth/google
@Post('auth/google')
async googleSignIn(@Body() dto: GoogleSignInDto) {
  const { idToken } = dto;

  // Verify with Google
  const ticket = await client.verifyIdToken({
    idToken,
    audience: GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();

  // Check if user exists
  const existingUser = await this.usersService.findByEmail(payload.email);

  if (existingUser) {
    // Link Google identity if not already linked
    if (!existingUser.googleId) {
      await this.usersService.linkGoogle(existingUser.id, payload.sub);
    }
    return this.authService.generateTokens(existingUser);
  }

  // Create new user + tenant
  const user = await this.authService.registerWithGoogle({
    email: payload.email,
    firstName: payload.given_name,
    lastName: payload.family_name,
    googleId: payload.sub,
    googlePicture: payload.picture,
  });

  return this.authService.generateTokens(user);
}
```

**Database Addition:**
```prisma
model User {
  // ... existing fields
  googleId       String?   @unique  // Google OAuth subject ID
  googlePicture  String?            // Profile picture URL
}
```

**Google Credentials (from Google Cloud Console — values stored in `.env`):**
```env
GOOGLE_CLIENT_ID=<your-google-client-id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
```

**Post-Sign-In Google Workspace Prompt:**
```
┌─────────────────────────────────────────┐
│  Welcome, Sarah! 🚀                    │
├─────────────────────────────────────────┤
│  Your AI team is ready. Connect       │
│  Google Workspace to give your         │
│  agents email, docs, and calendar.     │
│                                         │
│  ┌─────────────────────────────┐       │
│  │   Connect Google Workspace  │       │
│  └─────────────────────────────┘       │
│                                         │
│  [Skip for now]                        │
│                                         │
└─────────────────────────────────────────┘
```

---

### 1.6 Onboarding — Tier + Template Auto-Deploy

**Decision:** Onboarding deploys pre-configured departments and agents based on selected plan + template. User reviews and customizes, but doesn't start from scratch.

**Flow:**
```
Step 1: Sign Up (Google Sign-In or Email)
    → Continue with Google (1 click)
    → OR Email + password

Step 2: Connect Google Workspace (Optional, skippable)
    → "Give agents access to Gmail, Drive, Calendar"
    → Skip or Connect

Step 3: Choose Plan
    → STARTER (3 agents, 1 department)
    → GROWTH (10 agents, 3 departments)
    → PRO (25 agents, 5 departments)
    → ENTERPRISE (unlimited)

Step 4: Select Department Template
    → Sales Team (Sales + Marketing + Support)
    → Operations (Ops + Finance)
    → Full Stack (5 departments)
    → Custom

Step 5: Review & Customize
    → See deployed departments and agents
    → Rename departments/agents
    → Move agents between departments
    → Add/remove within tier limits

Step 6: Invite Team
    → Add colleagues
    → Assign roles

Step 7: Dashboard
    → Fully functional platform
    → Integrations in Settings anytime
```

**Auto-deploy behavior:**
```
User picks: GROWTH + Sales Team template
                    ↓
System deploys:
┌─────────────────────────────────────────┐
│  GROWTH Plan (max: 10 agents, 3 depts) │
├─────────────────────────────────────────┤
│  📂 Sales (from template)
│     ├── Sales Agent
│     ├── Marketing Agent
│     └── Support Agent
│  📂 Operations (from template)
│     └── Ops Agent
│  Agents used: 4 / 10
│  Departments used: 2 / 3
└─────────────────────────────────────────┘
```

**Tier limits enforced at every step:**
- Cannot add more agents than plan allows
- Cannot add more departments than plan allows
- Upgrade prompt when limit reached

---

### 1.7 Integration Settings — Post-Onboarding Discovery

**Decision:** External integrations are accessible only after onboarding is complete. They are not requirements to get started.

**Route:** `/settings/integrations`

**Integration cards:**
```
┌─────────────────────────────────────────┐
│  Google Workspace           [Not Set]   │
│  Gmail, Drive, Calendar, Sheets          │
│  [Connect]                              │
├─────────────────────────────────────────┤
│  Email Relay (Brevo)      [Not Set]    │
│  Agent email aliases                    │
│  [Connect]                              │
├─────────────────────────────────────────┤
│  Slack                     [Coming Soon] │
│  Team notifications                      │
│  [Notify Me]                            │
├─────────────────────────────────────────┤
│  Microsoft 365         [Coming Soon]   │
│  Outlook, OneDrive, Teams               │
│  [Notify Me]                            │
└─────────────────────────────────────────┘
```

**Post-onboarding prompt (non-blocking):**
```
┌─────────────────────────────────────────┐
│  Supercharge your agents               │
├─────────────────────────────────────────┤
│  Connect Google Workspace to enable:   │
│  📧 Gmail  📁 Drive  📅 Calendar  📊 Sheets
│  This is optional. Agents work        │
│  internally even without connections.  │
│  [Connect Google]      [Maybe Later]  │
└─────────────────────────────────────────┘
```

---

## 2. Implementation Phases

### Phase A: Integration SDK Foundation + Google Sign-In (Weeks 1-4)

**Goal:** Build the infrastructure that all future integrations depend on. Add Google Sign-In as the primary auth option.

| Week | Backend | Frontend |
|---|---|---|
| **0** | **✅ Google Sign-In — DONE** | **✅ Login "Continue with Google" button — DONE** |
| **1** | **✅ Integration module skeleton — DONE** | **✅ Settings page structure — DONE** |
| **2** | **✅ Google OAuth flow (backend) — DONE** | **✅ OAuth callback handler (frontend) — DONE** |
| **3** | **✅ Encrypted credential storage — DONE** | **✅ Integration cards UI — DONE** |
| **4** | **✅ Brevo SMTP integration — DONE** | **✅ Email alias configuration — DONE** |
| **5-6** | **✅ Gmail: read inbox + send — DONE** | **✅ Agent email composer — DONE** |
| **7-8** | **✅ Calendar: view/create events — DONE** | **✅ Calendar widget — DONE** |
| **9-10** | **✅ Drive: folder per agent — DONE** | **✅ Drive file browser — DONE** |

**Backend Module Structure:**
```
backend/src/modules/
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── strategies/
│   │   ├── jwt.strategy.ts
│   │   ├── local.strategy.ts
│   │   └── google.strategy.ts     # NEW: Google Sign-In
│   └── dto/
│       └── google-signin.dto.ts   # NEW: id_token validation
│
└── integrations/
    ├── integrations.module.ts
    ├── integrations.controller.ts     # CRUD for connections
    ├── integrations.service.ts         # Unified credential management
    ├── dto/
    │   ├── connect-google.dto.ts
    │   └── connect-brevo.dto.ts
    ├── google/
    │   ├── google.auth.ts            # OAuth flow (Workspace)
    │   ├── google.drive.ts          # Folder creation
    │   ├── google.gmail.ts          # Email operations
    │   ├── google.calendar.ts        # Calendar operations
    │   └── google.sheets.ts          # Spreadsheet operations
    └── brevo/
        └── brevo.smtp.ts            # Email relay
```

**Database Model:**
```prisma
model IntegrationCredential {
  id            String    @id @default(uuid())
  tenantId      String
  provider      String    # 'google' | 'brevo' | 'slack' | 'microsoft'
  credentials   Json      # Encrypted access/refresh tokens, API keys
  scopes        String[]  # ['gmail.read', 'drive.write', ...]
  status        String    # 'active' | 'expired' | 'revoked'
  lastSyncAt    DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([tenantId, provider])
}
```

---

### Phase B: Google Integration — Core (Weeks 5-10)

**Goal:** Full Google Workspace integration via free personal Gmail OAuth.

| Week | Backend | Frontend |
|---|---|---|
| 5-6 | Gmail: read inbox, send emails | Agent email composer UI |
| 7-8 | Google Calendar: view/create events | Calendar widget |
| 9-10 | Google Drive: folder creation per agent | Drive file browser |

**Agent Folder Structure (auto-created on integration connect):**
```
User's Google Drive
└── NeureCore (root folder, created once)
    └── [Agent Name]
        ├── 📧 Drafts
        ├── 📄 Documents
        ├── 📊 Reports
        ├── 📋 Templates
        └── 📁 Archive
```

**Implementation:**
```typescript
// Auto-create folders when agent is created
async function setupAgentGoogleFolders(agent: Agent, credentials: any) {
  const drive = google.drive({ credentials });

  // Create root NeureCore folder (once per tenant)
  const rootFolder = await drive.files.create({
    name: 'NeureCore',
    mimeType: 'application/vnd.google-apps.folder',
  });

  // Create agent folder
  const agentFolder = await drive.files.create({
    name: agent.name,
    mimeType: 'application/vnd.google-apps.folder',
    parents: [rootFolder.data.id],
  });

  // Create subfolders
  for (const subfolder of ['Drafts', 'Documents', 'Reports', 'Templates', 'Archive']) {
    await drive.files.create({
      name: subfolder,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [agentFolder.data.id],
    });
  }

  return agentFolder.data.id;
}
```

---

### Phase C: Email Agent (Weeks 11-14)

**Goal:** AI agent can read, summarize, draft, and send emails via Gmail API or Brevo SMTP.

| Week | Feature | Implementation |
|---|---|---|
| 11 | Email read | Agent fetches inbox via Gmail API, summarizes threads |
| 12 | Email compose | Agent drafts emails, user reviews before send |
| 13 | Email send | Agent sends via Brevo SMTP (agent alias) |
| 14 | Priority flagging | AI marks urgent emails, suggests responses |

**Email tool for agents:**
```typescript
class EmailTool {
  name = 'email'
  description = 'Read, compose, and send emails'

  async readInbox(agentId: string, maxResults = 10) {
    const credentials = await this.getCredentials(agentId);
    const gmail = google.gmail({ credentials });
    const messages = await gmail.users.messages.list({
      userId: 'me',
      maxResults,
      labelIds: ['INBOX'],
    });
    return messages.data.messages;
  }

  async sendEmail(agentId: string, to: string, subject: string, body: string) {
    const credentials = await this.getCredentials(agentId);
    const brevo = new BrevoApi.ApiClient();
    brevo.authentications['apiKey'].apiKey = credentials.apiKey;

    const email = new SendSmtpEmail();
    email.to = [{ email: to }];
    email.subject = subject;
    email.htmlContent = body;
    email.sender = { email: `${agentId}-agent@company.com` };

    return await brevo.sendSmtpEmail(email);
  }
}
```

---

### Phase D: Documents & Reports (Weeks 15-20)

**Goal:** AI agent creates documents, generates reports, exports to PDF.

| Week | Feature | Implementation |
|---|---|---|
| 15-16 | Document creation | Agent creates in Google Docs or NeureCore storage |
| 17-18 | Report generation | AI pulls data, generates narrative + charts |
| 19-20 | PDF export | Server-side PDF from data + template |

**Report generation flow:**
```
User asks: "Show me Q2 pipeline by region"
       ↓
Agent queries: NeureCore DB (tasks, costs, agents)
       ↓
AI generates: Narrative analysis + data visualization
       ↓
Output: PDF report with charts + AI commentary
       ↓
Brevo SMTP: Email to stakeholder
```

---

### Phase E: Data Tables + Plain English Queries (Weeks 21-24)

**Goal:** Users query company data in natural language. AI translates to SQL, explains results.

| Week | Feature | Implementation |
|---|---|---|
| 21-22 | NL to SQL | Agent interprets natural language → Prisma query |
| 23-24 | Data explanation | AI explains what data means, not just raw numbers |

---

### Phase F: Internal AI Chat (Weeks 25-28)

**Goal:** Team members ask AI questions, get answers from company context (docs, data, history).

| Week | Feature | Implementation |
|---|---|---|
| 25-26 | Context awareness | Agent reads Drive files, prior conversations |
| 27-28 | Multi-turn conversations | Chat history maintained per topic |

---

## 3. Integration Settings Page Design

### 3.1 Settings Page (`/settings/integrations`)

```
┌─────────────────────────────────────────────────────────┐
│  Settings > Integrations                                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Connected                                              │
│  ┌─────────────────────────────────────────────────┐  │
│  │ 🔵 Google Workspace                             │  │
│  │  connected@company.com                         │  │
│  │  Gmail · Drive · Calendar · Sheets            │  │
│  │  Last synced: 2 minutes ago         [Manage]   │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ 🟠 Brevo (Email Relay)                          │  │
│  │  Not connected                    [Connect]     │  │
│  │  Enables agent email aliases                     │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  Available Integrations                                 │
│  ┌─────────────────────────────────────────────────┐  │
│  │ 🟢 Slack (Coming Soon)                          │  │
│  │  Team notifications and alerts                   │  │
│  │                                      [Notify Me] │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ 🔴 Microsoft 365 (Coming Soon)                   │  │
│  │  Outlook, OneDrive, Teams                        │  │
│  │                                      [Notify Me] │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 3.2 Manage Google Modal

```
┌────────────────────────────────────────┐
│  Google Workspace                   [X]│
├────────────────────────────────────────┤
│  Account: john@gmail.com               │
│                                        │
│  ☑ Gmail    (read, compose, send)    │
│  ☑ Google Drive (read, write files)   │
│  ☑ Google Calendar (read, write)      │
│  ☑ Google Sheets (read, write)        │
│                                        │
│  Connected folders:                    │
│  └── NeureCore/                       │
│       ├── Sales Agent/                │
│       ├── Marketing Agent/            │
│       └── Ops Agent/                   │
│                                        │
│  [Disconnect Google]                   │
└────────────────────────────────────────┘
```

### 3.3 Agent Integration Assignment (in agent edit page)

```
┌─────────────────────────────────────────┐
│  Agent: Sales Agent                    │
├─────────────────────────────────────────┤
│  Google Services                       │
│  ☑ Gmail    → sales-agent@company.com │
│  ☑ Drive    → NeureCore/Sales Agent  │
│  ☑ Calendar → sales-agent@company.com │
│  ☐ Sheets   → Sales Data              │
│                                        │
│  Email Alias                           │
│  From: sales-agent@company.com (Brevo) │
│                                        │
│  Permissions                           │
│  ☑ Can send emails                     │
│  ☐ Can create documents               │
│  ☐ Can read Drive files               │
└─────────────────────────────────────────┘
```

---

## 4. SOLID Architecture for Integrations

### 4.1 Provider Pattern (Open/Closed Principle)

```typescript
// ✅ Add new providers without modifying existing code
interface EmailProvider {
  send(to: string, subject: string, body: string): Promise<void>;
  readInbox(maxResults: number): Promise<Email[]>;
}

class BrevoEmailProvider implements EmailProvider { ... }
class GmailEmailProvider implements EmailProvider { ... }

class EmailProviderFactory {
  static create(type: 'brevo' | 'gmail'): EmailProvider {
    switch (type) {
      case 'brevo': return new BrevoEmailProvider();
      case 'gmail': return new GmailEmailProvider();
    }
  }
}
```

### 4.2 Credential Abstraction (Interface Segregation)

```typescript
interface ICredentialStore {
  get(tenantId: string, provider: string): Promise<Credential>;
  set(tenantId: string, provider: string, credential: Credential): Promise<void>;
  revoke(tenantId: string, provider: string): Promise<void>;
}

interface IDriveService {
  createFolder(name: string, parentId?: string): Promise<Folder>;
  createFile(name: string, folderId: string, content: any): Promise<File>;
  listFiles(folderId: string): Promise<File[]>;
}
```

### 4.3 Agent Integration Registry (Dependency Inversion)

```typescript
@Injectable()
class AgentIntegrationRegistry {
  private integrations = new Map<string, IAgentIntegration>();

  register(name: string, integration: IAgentIntegration) {
    this.integrations.set(name, integration);
  }

  get(name: string): IAgentIntegration {
    return this.integrations.get(name);
  }

  getAll(): IAgentIntegration[] {
    return Array.from(this.integrations.values());
  }
}

// Each integration depends on abstraction, not concrete implementation
interface IAgentIntegration {
  name: string;
  enabled: boolean;
  tools: IStructuredTool[];
  credentials: CredentialRef;
}
```

---

## 5. Google OAuth Flow

### 5.1 Backend OAuth Handler

```typescript
// GET /api/v1/integrations/google/auth
@Get('google/auth')
async initiateGoogleAuth(@CurrentUser() user: AuthenticatedUser) {
  const scopes = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/spreadsheets',
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    state: Buffer.from(JSON.stringify({ tenantId: user.tenantId })).toString('base64'),
  });

  return { url };
}

// GET /api/v1/integrations/google/callback
@Get('google/callback')
async handleGoogleCallback(
  @Query('code') code: string,
  @Query('state') state: string,
) {
  const { tenantId } = JSON.parse(Buffer.from(state, 'base64').toString());
  const { tokens } = await oauth2Client.getToken(code);

  // Store encrypted credentials
  await this.integrationsService.storeCredentials(tenantId, 'google', {
    accessToken: encrypt(tokens.access_token),
    refreshToken: encrypt(tokens.refresh_token),
    expiryDate: tokens.expiry_date,
  });

  return { success: true };
}
```

---

## 6. Brevo SMTP Setup

### 6.1 Backend Configuration

```typescript
// Environment variables
BREVO_API_KEY=your_brevo_api_key
BREVO_SMTP_URL=smtp-relay.brevo.com
BREVO_SMTP_PORT=587

// Email service
@Injectable()
export class BrevoEmailService {
  private api: TransactionalEmailsApi;

  async sendEmail(dto: SendEmailDto) {
    const email = new SendSmtpEmail();
    email.to = [{ email: dto.to }];
    email.subject = dto.subject;
    email.htmlContent = dto.body;
    email.sender = {
      email: dto.from, // e.g., sales-agent@company.com
      name: dto.fromName,
    };

    return this.api.sendTransacEmail(email);
  }
}
```

### 6.2 Agent Email Assignment

```typescript
// When creating/updating an agent
interface AgentEmailConfig {
  alias: string;      // sales-agent@company.com
  provider: 'brevo' | 'gmail';
  displayName: string;
  signature?: string;
}
```

---

## 7. Onboarding Architecture

### 7.1 Onboarding State Machine

```typescript
type OnboardingStep =
  | 'account'      // Email, password, subdomain
  | 'company'      // Company name, logo, industry
  | 'plan'         // Tier selection
  | 'template'     // Department template
  | 'review'       // Review & customize deployed resources
  | 'team'         // Invite members
  | 'complete';    // Done

interface OnboardingState {
  currentStep: OnboardingStep;
  company?: { name: string; logo?: string; timezone: string; currency: string };
  plan?: 'STARTER' | 'GROWTH' | 'PRO' | 'ENTERPRISE';
  template?: string;
  departments?: Department[];
  agents?: Agent[];
  integrations?: IntegrationCredential[];
  completedAt?: Date;
}
```

### 7.2 Tier Limits (enforced everywhere)

| Tier | Agents | Departments | Storage | API Calls |
|---|---|---|---|---|
| STARTER | 3 | 1 | 1 GB | 1,000/day |
| GROWTH | 10 | 3 | 10 GB | 5,000/day |
| PRO | 25 | 5 | 100 GB | 25,000/day |
| ENTERPRISE | Unlimited | Unlimited | 1 TB | Unlimited |

### 7.4 Redirect Rules

```
/ → (not logged in) → /login
/login → (Google Sign-In) → /onboarding (skip Step 1)
login → (Email) → /register → /onboarding
/login → (logged in + onboarding incomplete) → /onboarding
/login → (logged in + onboarding complete) → /dashboard
/onboarding → (complete) → /dashboard
/settings/integrations → (onboarding incomplete) → /onboarding
```

### 7.5 Google Sign-In UX States

**New User (No existing account):**
```
"Continue with Google" clicked
       ↓
Google consent (already approved)
       ↓
Account created (email, name, picture from Google)
       ↓
Tenant created (auto-generated from email domain)
       ↓
Logged in
       ↓
→ /onboarding (Step 2: Connect Google Workspace prompt)
```

**Existing User (Email exists, Google not linked):**
```
"Continue with Google" clicked
       ↓
Account found by email
       ↓
Google ID linked to account
       ↓
Logged in
       ↓
→ /dashboard (onboarding complete)
```

**Existing User (Google-linked account):**
```
"Continue with Google" clicked
       ↓
Google ID matched
       ↓
Logged in (no password needed)
       ↓
→ /dashboard (onboarding complete)
```

**Email User (Password login, existing account):**
```
Email + password
       ↓
Validated
       ↓
Logged in
       ↓
→ /dashboard (onboarding complete)
       OR → /onboarding (first time)
```

---

## 8. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Google Sign-In OAuth failure | Medium | Users can't login | Fallback to email/password; clear error message |
| Google Sign-In account linking confusion | Medium | User has two accounts | Prompt: "Link this Google account or sign in with different account?" |
| Google OAuth token expiry without refresh | Medium | Agent loses Google access | Store refresh token; auto-refresh on 401 |
| Brevo daily limit exceeded | Low | Emails queue/fail | Monitor daily count; warn at 80%; upgrade path |
| Gmail API rate limits | Medium | Agent throttled | Exponential backoff; per-user rate limiting |
| Agent folder proliferation | Low | Messy Drive | Root folder per tenant; cleanup job for deleted agents |
| Personal Gmail OAuth scope creep | Medium | Security concern | Minimal scopes for Sign-In; full scopes only for Workspace |
| Tenant isolation breach in integrations | Critical | Data leak | All integration queries include tenantId filter |

---

## 9. Out of Scope (v1)

- NocoBase integration (deferred)
- Microsoft 365 integration (Phase 2)
- Slack integration (Phase 2)
- Custom domain email without paid Google Workspace
- Video conferencing (Jitsi or Meet only)
- Social media management APIs
- Advanced CRM/ERP connectors
- Apple Sign-In (future option)
- GitHub OAuth (future option)

---

## 10. Success Metrics (v1)

| Metric | Target |
|---|---|
| Onboarding completion rate | >80% |
| Time to first agent task | <5 minutes |
| **Google Sign-In adoption** | >60% of new users |
| **Google Sign-In success rate** | >95% |
| Google Workspace integration success rate | >95% |
| Email delivery success (Brevo) | >98% |
| Agent folder creation success | 100% |
| Zero cross-tenant data access | 100% |
| Time to login (Google Sign-In) | <3 seconds |

---

**Document Status:** Decisions locked. Implementation planning complete. Ready for execution.

**Changelog (v1.4):**
- ✅ Google Sign-In FULLY IMPLEMENTED — 2026-06-26
- ✅ Phase A Weeks 0-4 ALL COMPLETE — 2026-06-26

**Changelog (v1.3):**
- ✅ Google Sign-In FULLY IMPLEMENTED — 2026-06-26
- ✅ Week 1 (Phase A): Integration module skeleton + settings page — 2026-06-26
- ✅ Week 2 (Phase A): Google OAuth flow + frontend callback page — 2026-06-26

**Changelog (v1.2):**

**Changelog (v1.1):**
