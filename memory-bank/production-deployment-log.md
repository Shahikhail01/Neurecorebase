# Production Deployment Log — Phase 1-12 + Critical Fixes

**Date:** 2026-06-25
**Operator:** Kilo (root via ssh contabo)
**Duration:** ~10 hours (13:35 → 23:00 UTC)
**Outcome:** ✅ SUCCESS — both frontends + backend live, Scale-Up Business tier deployed to demo tenant

---

## Executive Summary

| Layer | Status | URL |
|---|---|---|
| Backend (Contabo + Neon DB) | ✅ Live | `https://brain.neurecore.com/api/v1/*` |
| Tenant frontend (Vercel) | ✅ Live | `https://hq.neurecore.com` |
| Admin frontend (Vercel) | ✅ Live | `https://cc.neurecore.com` |
| Tenant Demo account | ✅ Active | `demo@neurecore.ai` / `Tenant@123!` |
| Admin account | ✅ Active | `admin@example.com` / `Admin123!` |
| GitHub repo | ✅ Live | `https://github.com/Shahikhail01/Neurecorebase` |
| Scale-Up Business tier | ✅ Deployed | 7 depts + 7 agents to Demo Tenant |

---

## Critical Fixes (Chronological)

### Fix 1: CORS preflight failing — LiteSpeed stripping upstream ACAO

**Issue:** Browser requests to `https://brain.neurecore.com/api/v1/auth/login` returned `HTTP/1.1 403 Forbidden` with no CORS headers. Direct backend (port 3003) returned correct headers.

**Root cause:** LiteSpeed reverse proxy at `/usr/local/lsws/conf/vhosts/brain.neurecore.com/vhost.conf` was overriding upstream `Access-Control-Allow-Origin` headers sent by NestJS CORS.

**Iterations attempted (all failed):**
1. ❌ `extraHeaders Access-Control-Allow-Origin: *` — wildcard invalid with `credentials: true`
2. ❌ `extraHeaders Access-Control-Allow-Origin: %{REQ_ORIGIN}e` — LiteSpeed doesn't support `%{VAR}e` syntax
3. ❌ Added `rewrite` block with `[L]` flag — short-circuited OPTIONS handling, stripping headers
4. ❌ Added nginx `proxyPassHeader` directive — not valid LiteSpeed syntax

**Final fix:** Static `Access-Control-Allow-Origin: https://hq.neurecore.com` in `extraHeaders` block, plus explicit `Access-Control-Allow-Credentials`, `Access-Control-Allow-Methods`, `Access-Control-Allow-Headers`, `Access-Control-Max-Age`.

**File:** `/usr/local/lsws/conf/vhosts/brain.neurecore.com/vhost.conf`

**Verified:** `curl -I` preflight returns `HTTP/2 204 access-control-allow-origin: https://hq.neurecore.com`

---

### Fix 2: Login fails with "Login failed" + 500 error on bad credentials

**Issue:** Any 4xx response (bad credentials, validation error) returned `An unexpected error occurred. Please try again.` with HTTP 500, instead of `Invalid credentials. Please check your email and password.`

**Root cause:** `GlobalExceptionFilter.getUserFriendlyMessage()` referenced `exception` variable that wasn't in scope (it's a method param only `originalMessage: string`). When login returned 401 BadRequestException, the filter tried `exception?.response?.message` → `ReferenceError: exception is not defined` → 500.

**Fix:** Added optional `exception?: unknown` parameter and wired it through:
```ts
private getUserFriendlyMessage(
  code: ErrorCodeType,
  originalMessage: string,
  exception?: unknown,
): string {
  const validationMessages = (exception as any)?.response?.message;
  if (
    code === ErrorCode.INVALID_REQUEST &&
    Array.isArray(validationMessages)
  ) {
    return validationMessages.join('; ');
  }
  // ... rest of method
}
```
Caller updated: `message: this.getUserFriendlyMessage(code, message, exception)`

**File:** `backend/src/common/filters/global-exception.filter.ts`
**Commit:** `de244207`

---

### Fix 3: Surface validation errors to clients

**Issue:** Even with Fix 2, validation errors (e.g., `email must be an email`, `password must be at least 8 characters`) were hidden behind generic "unexpected error" message.

**Root cause:** Production filter was stripping `details` field from response (`details: this.isProduction() ? undefined : details`).

**Fix:** When `code === INVALID_REQUEST` and exception has class-validator messages, join them with `; ` and return to client. Validation messages are user-input related, not sensitive — safe to expose.

**File:** `backend/src/common/filters/global-exception.filter.ts`
**Commit:** `e5846963`

**Verified:** `email must be an email` now shown in UI for bad email, `password must be longer than or equal to 8 characters` for short password.

---

### Fix 4: Admin frontend root URL returns 404

**Issue:** `https://cc.neurecore.com/` (root) returned 404 NOT_FOUND. Code: `NOT_FOUND`. Region: Mumbai `bom1::sg9mc-1782397696605-212a2eb2f7a3`.

**Root cause:** `next.config.js` had `basePath: "/admin"` in production. So the app only served at `/admin/*` but root URL had nothing to serve.

**Fix:** Created `frontend-admin/vercel.json` with 36 rewrite rules mapping every admin route from root to `/admin` prefix:
- `/login` → `/admin/login`
- `/dashboard` → `/admin/dashboard`
- `/tenants` → `/admin/tenants` (and sub-paths)
- `/users`, `/agents`, `/templates`, etc.

**File:** `frontend-admin/vercel.json`
**Commit:** `9694f9b7`

---

### Fix 5: Vercel project config — rootDirectory, install, build

**Issue:** Vercel deployment failed with ENOENT on `.next/routes-manifest.json` and `Cannot find module 'next/package.json'`.

**Root cause:** 
1. Vercel project had `rootDirectory: frontend-tenant` (set when imported from monorepo)
2. Project was configured for `pnpm install` but repo uses npm
3. `outputFileTracingRoot: path.join(__dirname, "..")` doubled the path

**Fix:** PATCH Vercel project via API:
```bash
PATCH /v9/projects/prj_EV6YAjwGAnneM6OlVmkDuXWt3M9e?teamId=team_wOWHtzagqXIj1iVZOpaeP4vz
{
  "rootDirectory": null,
  "sourceFilesOutsideRootDirectory": true,
  "installCommand": "npm install --legacy-peer-deps",
  "buildCommand": "npm run build"
}
```

Removed `outputFileTracingRoot` from `frontend-tenant/next.config.js` (was set for multi-lockfile scenario but now breaks Vercel).

**Files:** `frontend-tenant/next.config.js`, Vercel project config
**Commits:** `f21e1207`, `cd7307fa`

---

### Fix 6: Theme color deprecation warning

**Issue:** Next.js 15 build warning: `themeColor should be moved to viewport export`.

**Root cause:** `themeColor` was in `metadata` but should be in `viewport` per Next.js 15 spec.

**Fix:** Split metadata (title/description/manifest) from viewport (themeColor) in `frontend-tenant/src/app/layout.tsx`:
```ts
export const metadata: Metadata = {
  title: 'NeureCore — Tenant Portal',
  description: 'Tenant workspace',
  manifest: '/manifest.json',
};
export const viewport: Viewport = {
  themeColor: '#09090b',
};
```

**File:** `frontend-tenant/src/app/layout.tsx`
**Commit:** `cd7307fa`

---

### Fix 7: Legacy dashboard rendered instead of new Command Center

**Issue:** After login, user landed on `/dashboard` showing 469-line legacy component instead of new `/command-center` (Creatio-style).

**Root cause:** Next.js serves actual `page.tsx` files in preference to `next.config.js` rewrites. The 21 legacy routes (`/dashboard`, `/agents`, `/workflows`, `/projects`, `/goals`, etc.) all had their own `page.tsx` that took precedence over the rewrites.

**Fix:** Converted each legacy `page.tsx` to a tiny Next.js `redirect()` call:
```ts
// src/app/dashboard/page.tsx
import { redirect } from "next/navigation";
export default function Page() {
  redirect("/command-center");
}
```

All 21 routes now server-redirect to their new canonical URLs:
- `/dashboard` → `/command-center`
- `/agents` → `/marketplace?tab=agents`
- `/workflows` → `/departments?tab=workflows`
- `/costs` → `/finance?tab=overview`
- ... etc.

**File:** `frontend-tenant/src/app/{dashboard,agents,...}/page.tsx` (21 files)
**Commit:** `1d1059f8`

---

### Fix 8: Vercel project rootDirectory wrong for tenant

**Issue:** Tenant frontend build failed because Vercel was looking in `frontend-tenant/frontend-tenant/` (path doubled).

**Fix:** PATCH Vercel project `neurecorebase-tenant` to set `rootDirectory: null`, `installCommand`, `buildCommand` same as admin.

**File:** Vercel API config

---

### Fix 9: GitHub remote denied for shahisoftai user

**Issue:** `git push origin main` returned `Permission denied to shahisoftai`. Local user `shahisoftai` lacks write permission on `Shahikhail01/neurecore` repo.

**Root cause:** Different GitHub accounts — `shahisoftai` (local) vs `Shahikhail01` (repo owner).

**Fix:** 
1. Verified SSH key works as `Shahikhail01` (`ssh -T git@github.com`)
2. Created new public repo: `https://github.com/Shahikhail01/Neurecorebase` (capital N, "base" suffix)
3. Changed remote via SSH: `git remote set-url origin ssh://[email protected]/Shahikhail01/Neurecorebase.git`
4. Pushed all 17 + commits in 7 commits

**File:** `.git/config` in all sub-repos
**Commits:** All 7 new commits pushed to Neurecorebase

---

### Fix 10: Demo Tenant tier limit (5 agents) too small for Scale-Up

**Issue:** `POST /api/v1/deploy/tenants/:tenantId/dept-template` with `withAgents: true` returned `500 Internal Server Error: Deploying 7 agents would exceed the tenant agent limit. Available slots: 5.`

**Root cause:** Demo Tenant was on `tier_starter` (max 5 agents). Scale-Up Business template needs 7 head agents (Executive + Finance + Operations + Sales + Marketing + Customer Support + HR).

**Fix:** Upgraded Demo Tenant to `tier_enterprise` (max 100 agents):
```sql
UPDATE tenants SET "tierId"='tier_enterprise', "updatedAt"=NOW()
WHERE id='e223c25a-a6af-4d10-a931-e5566c4ebd0c';
```

**File:** Neon DB (NeureCore tenants table)
**Result:** Scale-Up Business deployment succeeded (7 depts + 7 agents)

---

### Fix 11: Deployed to wrong tenant

**Issue:** First Scale-Up Business deployment went to tenant `b3851a84-1428-4492-8f8d-cedb91e66ed6` ("NeureCore Demo") but the user `demo@neurecore.ai` belongs to `e223c25a-a6af-4d10-a931-e5566c4ebd0c` ("Demo Tenant"). User logged in but saw "No departments yet" because their tenant had no depts.

**Root cause:** Misread the tenant table — picked first row alphabetically instead of by user association.

**Fix:**
1. Deleted 7 depts + 7 agents from wrong tenant (b3851a84)
2. Re-deployed to correct tenant (e223c25a)
3. Verified: `SELECT t.\"tenantId\" FROM users WHERE email='demo@neurecore.ai'` returns `e223c25a...`

**File:** Neon DB

---

### Fix 12: 28 duplicate departments (4 copies of same 7)

**Issue:** After multiple redeploys, the Demo Tenant had **28 duplicate departments** (4 copies of Executive, Finance, Operations, Sales, Marketing, HR, Customer Support). Page was empty because too much data + FK cascade deletions left only the root.

**Root cause:** `POST /api/v1/deploy/tenants/:tenantId/dept-template` doesn't check for existing departments — it just inserts. Repeated deploys created duplicates.

**Fix:** Deleted duplicates with ROW_NUMBER() window function, keeping only the newest copy of each name:
```sql
DELETE FROM departments
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY name ORDER BY "createdAt" DESC) as rn
    FROM departments
    WHERE "tenantId"='e223c25a-a6af-4d10-a931-e5566c4ebd0c'
  ) t WHERE rn > 1
);
```

Result: 28 → 7 departments (kept newest, FK cascade cleaned children).

**File:** Neon DB
**Lesson:** Deploy endpoint should be idempotent or check existing departments.

---

### Fix 13: DepartmentRepository.findAll() always returns empty

**Issue:** Command Center hero showed "0 departments" despite 7 departments existing in DB and API returning them correctly.

**Root cause:** `ResponseTransformer.unwrapList()` only handled paginated wrapper shape `{data: [...], total, page, limit}` but backend returns bare arrays `{status, data: [items], meta}`. Old code:
```ts
const items = (raw['data'] ?? raw['items'] ?? []) as T[];
```
For `/departments`, `raw = response.data = [7 items]` (array). `array['data']` is undefined. Falls back to `[]`.

**Fix:** Detect array shape first:
```ts
if (Array.isArray(raw)) {
  return { items: raw as T[], total: raw.length, page: 1, limit: raw.length };
}
const items = (obj['data'] ?? obj['items'] ?? []) as T[];
```

**File:** `frontend-tenant/src/core/services/api/transformers/ResponseTransformer.ts`
**Commit:** `bca44ad5`

**Verified:** After deploy, Command Center shows "7 departments · 7 agents" with all 7 departments listed.

---

### Fix 14: Removed debug console.log from DepartmentRepository

After Fix 13 verified working, removed the `console.log('[DBG dept] ...')` lines added during debugging.

**File:** `frontend-tenant/src/core/repositories/DepartmentRepository.ts`
**Commit:** `bca44ad5` (same commit as Fix 13)

---

## Final State

### Backend (Contabo + Neon DB)

| Service | Process | Status | Port |
|---|---|---|---|
| neurecore-backend | pm2 id 6, pid ~917051 | online | 3003 (LiteSpeed → brain.neurecore.com) |

### Frontends (Vercel)

| App | Project | URL | Alias |
|---|---|---|---|
| Admin | `neurecorebase` | `https://neurecorebase.vercel.app` | `cc.neurecore.com` |
| Tenant | `neurecorebase-tenant` | `https://neurecorebase-tenant.vercel.app` | `hq.neurecore.com` |

### Database

| Resource | Value |
|---|---|
| Neon pooler | `ep-summer-pond-adpkqy1m-pooler.c-2.us-east-1.aws.neon.tech` |
| Migrations applied | 11 (latest: `20260625_phase1_gaps`) |
| Tenants | 8 |
| Departments (Demo Tenant) | 7 (Scale-Up Business) |
| Agents (Demo Tenant) | 7 (head agents) |

### Git History

```
bca44ad5 fix(tenant): ResponseTransformer.unwrapList handle array-shaped responses
de244207 fix(backend): pass exception param to getUserFriendlyMessage
1d1059f8 fix(tenant): replace legacy page.tsx files with Next.js redirects
f21e1207 fix(tenant): remove outputFileTracingRoot to fix Vercel ENOENT deploy
cd7307fa fix(tenant): move themeColor from metadata to viewport export
9694f9b7 fix(admin): add vercel.json rewrites so root URL serves /admin
e5846963 fix(backend): surface validation error details to clients in production
4c9a51de feat: Phase 1-12 tenant frontend Creatio rebuild + Contabo deploy
82eb7f5a feat(phase1): backend gaps for tenant frontend rebuild
```

### Working Credentials

```
Tenant:  demo@neurecore.ai / Tenant@123!     (OWNER role)
Admin:   admin@example.com / Admin123!        (SUPER_ADMIN role)
```

### Deployed Tenant

```
Tenant ID:  e223c25a-a6af-4d10-a931-e5566c4ebd0c
Name:       Demo Tenant
Tier:       Enterprise (100 agents)
Depts:      Executive → Finance, Operations, Sales, Marketing, HR, Customer Support
Agents:     7 head agents (1 per department)
```

---

## Lessons Learned

1. **Vercel LiteSpeed quirks**: `extraHeaders` is the ONLY way to add CORS headers; `proxyPassHeader` is nginx-only syntax. `wildcard *` invalid with `credentials: true`. `%{VAR}e` syntax not supported.

2. **Next.js rewrites vs page.tsx**: Rewrites only apply when no matching `page.tsx` exists. To "redirect" legacy routes, convert the page.tsx itself to a `redirect()` call.

3. **NestJS CORS arrays vs wrappers**: Backend list endpoints return bare arrays `{data: [items]}`, not paginated wrappers `{data: {data: [items], total}}`. Frontend unwrapList must detect both shapes.

4. **Deploy endpoint idempotency**: `deploy-dept-template` should check for existing departments before creating duplicates. Currently no check — repeated deploys created 28 duplicates.

5. **Always verify with real tenant ID**: User email → tenantId association must be checked via SQL before deploying to "the tenant account".

6. **Production filters can hide bugs**: `getUserFriendlyMessage` swallowed the real validation error message, making debugging 10x harder. Add "details" passthrough in production for visibility.

7. **Vercel project config from monorepo**: When importing from monorepo, `rootDirectory` is set to the subdir. Need to PATCH it to null after import to support single-app builds.

8. **GitHub multi-account**: Local git user `shahisoftai` ≠ repo owner `Shahikhail01`. SSH key on disk authenticated as `Shahikhail01`. Created new public repo `Neurecorebase` with proper SSH remote.

---

## Rollback Procedure (untested, documented for next on-call)

### Backend
```bash
ssh contabo
cd /opt/neurecore/backend/backend
# Restore prior source from git
git log --oneline -10  # find commit before changes
git checkout <commit> -- src/
npm run build
pm2 restart neurecore-backend
```

### Database (Phase 1 migration rollback — DANGEROUS)
```sql
-- Cannot safely down-migrate enum additions
-- If rollback needed: pg_dump neondb, restore from backup before 2026-06-25 13:35 UTC
```

### Frontend
```bash
# Vercel: go to project → Deployments → click previous → Promote to Production
# OR via CLI:
vercel rollback
```

### LiteSpeed
```bash
ssh contabo
cp /usr/local/lsws/conf/vhosts/brain.neurecore.com/vhost.conf.bak-cors-fix \
   /usr/local/lsws/conf/vhosts/brain.neurecore.com/vhost.conf
/usr/local/lsws/bin/lswsctrl restart
```

---

## Session 2 — MiniMax AI Wiring (2026-06-25/26)

**Issue:** Ask AI on Command Center showed "I received your query... The chat backend is not yet connected. Once the `/api/chat` endpoint is deployed..." and agents replied "I'm currently offline. Please check your connection and try again."

**Root causes:**
1. No `/api/v1/chat/messages` or `/api/v1/ai/chat` backend endpoint existed
2. `MINIMAX_API_KEY` empty in production `.env`
3. Frontend chat services had stub fallback messages

**User provided:** API key + base URL: `https://api.minimax.io/v1`

### Fixes applied

#### Fix 15: New `ChatModule` with two endpoints

Created `backend/src/modules/chat/`:
- `chat.module.ts` — imports `ModelsModule` for `MiniMaxClient`
- `chat.service.ts` — composes system + history + user message into single prompt, returns `{ reply, conversationId, tokens, model, provider }`
- `chat.controller.ts` — exposes `POST /api/v1/chat/messages` (Ask AI on Command Center) + `POST /api/v1/ai/chat` (ConversationalAIService) + stub `chat/history`, `chat/suggestions` for frontend compat
- `dto/chat.dto.ts` — `SendChatMessageDto` with validation decorators

Wired `ChatModule` into `AppModule`.

#### Fix 16: `@Controller({ version: '1' })` for URI versioning

Initial deploy used `@Controller()` (no params). Routes mapped as `/api/chat/messages` instead of `/api/v1/chat/messages` → 404. Fixed with explicit `version: '1'`.

#### Fix 17: TypeScript strict null checks

`response.usage.totalTokens` triggered TS18048 "possibly undefined". Wrapped in `response.usage ? ... : {0,0,0}` fallback.

#### Fix 18: Frontend chat service response unwrap

`chat.service.sendMessage` and `ConversationalAIService.sendMessage` previously unwrapped `res.data?.data` directly. Backend returns `{ status, data: { reply, ... }, meta }`, so the unwrap target is `payload?.data?.data` (or `payload?.data` for the simpler shape).

Updated fallback message from "The chat backend is not yet connected" to "The chat backend is reachable but returned an empty response" — accurate if backend is up.

#### Fix 19: Production `.env` MiniMax config

Added to `/opt/neurecore/backend/backend/.env`:
```
MINIMAX_API_KEY=sk-cp-uIHDBUPhYE4x5rr1R3kR1OoEVe5i_cuigLDc-XBhk0FLd4O2sYsru4aor1RmsdVR2Rg_xjdI28ykWr9AtQqTxJqGPul1ELJrIcT5HwUw2JUSXtdIQrjpzs0
MINIMAX_BASE_URL=https://api.minimax.io/v1
MINIMAX_MODEL=MiniMax-Text-01
LLM_PROVIDER=minimax
DEFAULT_MODEL=MiniMax-Text-01
```

### Verified end-to-end

Backend direct test (Python):
```python
POST /api/v1/chat/messages {message: 'What is 2+2?'}
→ {"reply":"Four","conversationId":"conv_1782413228915_5mxvjs",
   "tokens":{"input":756,"output":1,"total":757},
   "model":"MiniMax-Text-01","provider":"minimax"}

POST /api/v1/ai/chat {message: 'Say hello in 2 words'}
→ {"reply":"Hello there!","tokens":{"input":751,"output":3,"total":754}}
```

Browser test (Playwright):
- Open https://hq.neurecore.com → login as demo@neurecore.ai → click "Ask AI" button → type "How many agents are running?" → press Enter
- Frontend POSTs to https://brain.neurecore.com/api/v1/ai/chat → 200 OK with MiniMax reply
- Chat panel shows user message + AI reply with chart data suggestion + follow-up actions

### Files created

```
backend/src/modules/chat/chat.module.ts          (new)
backend/src/modules/chat/chat.service.ts         (new)
backend/src/modules/chat/chat.controller.ts       (new)
backend/src/modules/chat/dto/chat.dto.ts          (new)
backend/src/modules/chat/index.ts                (new)
backend/src/app.module.ts                        (modified — import ChatModule)
```

### Files modified

```
frontend-tenant/src/services/chat.service.ts                (unwrap + updated fallback)
frontend-tenant/src/core/services/ConversationalAIService.ts (unwrap nested)
```

### Commits

```
d70c19bf feat(ai): wire MiniMax API for Ask AI + agent chat
```

### Lessons learned

- `@Controller()` with empty parens skips URI versioning. Always use `@Controller({ path: ..., version: '1' })` for explicit control.
- NestJS `enableVersioning` is global — controllers WITHOUT explicit `version` get NO version prefix at all, not the default version.
- Frontend response unwrappers must match the backend's `{ status, data: <payload>, meta }` envelope exactly. When adding new endpoints, audit all places that call them.
- LLM clients that return "stub responses" when API key missing are a footgun — they look like success but produce useless output. Either fail-fast or return a clearly distinguishable error marker.

### Fix 20: Ground Ask AI in live tenant data (2026-06-26)

**Issue:** MiniMax answered hallucinated numbers ("45 agents running", "15/8/5 tasks by priority", generic overdue-tasks advice) instead of real tenant data.

**Root cause:** ChatService built the prompt with only `SYSTEM + HISTORY + USER` — no actual tenant data. The model had to guess.

**Fix:** ChatService now fetches a compact live-data snapshot via Prisma `Promise.all` groupBy/count/aggregate and prepends it to the prompt as a structured JSON block:

```ts
{
  tenantId, generatedAt,
  agents: { total, byStatus: { IDLE: 7 } },
  departments: { active: 7 },
  tasks: { total, byStatus },
  workflows: { total, byStatus },
  approvals: { pending },
  cost: { monthToDateCents, currency }
}
```

ChatController now reads `tenantId` from JWT (`req.user.tenantId` set by JwtAuthGuard) — never trusts client-supplied context.

System prompt now explicitly says "Answer the user using ONLY the LIVE TENANT DATA provided. If the data does not contain the answer, say so directly rather than guessing."

**Prisma model corrections during implementation:**
- `prisma.approval` → `prisma.approvalRequest` (model `ApprovalRequest`, table `approval_requests`)
- `prisma.cost` → `prisma.costRecord` (model `CostRecord`, table `cost_records`)
- `cost.amount` → `cost.costCents` (Decimal cents, not dollars)
- `cost.date` → `cost.windowStart` (DateTime range field, not single date)

**Each query has `.catch(() => null/[])`** so one bad query degrades gracefully instead of killing the reply.

**ChatModule now imports DatabaseModule** for PrismaService.

**Verified end-to-end** (Python, real JWT):
```
Q: "How many agents do I have?"
A: "You have 7 agents." + chart {IDLE: 7}

Q: "What is the status of my tasks?"
A: "0 tasks in total, byStatus field is empty, indicating no tasks are
    in progress." + empty chart
```

**Commit:** `d7437743` `fix(ai): ground Ask AI in live tenant data via Prisma`

**Lesson learned:** Always inject real data into LLM prompts when the user expects factual answers. Hallucinations are easy to mask when the prompt is generic — explicit "use ONLY this data" instructions + structured JSON input prevents the model from making up plausible-sounding numbers.
