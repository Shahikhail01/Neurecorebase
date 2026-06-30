# Frontend — EAOS (Tenant Frontend)

**Last Updated:** 2026-06-30
**Last Verified:** 2026-06-30 (live inspection)
**Audience:** Frontend developers, UI engineers

---

## Overview

EAOS (Enterprise AI Operating System) tenant frontend built with Next.js 16.

- **Location:** `/opt/neurecore/frontend-eaos/` (production) or `/home/najeeb/Linux-Dev/neurecore-base/neurecore/frontend-eaos/` (local)
- **Port:** 3011
- **URL:** https://hq.neurecore.com
- **PM2:** neurecore-eaos

---

## Tech Stack

| Concern | Library | Version |
|---|---|---|
| Framework | Next.js | 16.2.9 |
| Runtime | React | 19.0.0 |
| Bundler | Turbopack | (Next.js built-in) |
| Styling | Tailwind CSS | 3.4.14 |
| UI Components | Tremor | 3.18.7 |
| Icons | Lucide | latest |
| Data Fetching | TanStack Query | 5.59 |
| Forms | react-hook-form + zod | 7.53 / 3.23 |
| WebSockets | Socket.IO client | 4.8.1 |
| Theme | next-themes | 0.4.3 |
| State (UI) | Zustand | 5.0+ |

---

## Directory Structure

```
frontend-eaos/
├── src/
│   ├── app/                      # Next.js App Router pages
│   │   ├── agents/
│   │   ├── entity/
│   │   ├── knowledge/
│   │   ├── login/
│   │   ├── marketplace/
│   │   ├── register/
│   │   ├── retail/
│   │   └── ...
│   ├── components/
│   │   └── ui/                  # Reusable UI components
│   ├── infrastructure/
│   │   ├── api/                 # RestClient, API layer
│   │   ├── auth/                # CookieManager
│   │   ├── socket/              # Socket.IO client
│   │   └── sse/                 # SSE client
│   └── lib/                     # Utilities
├── public/                      # Static assets
├── package.json
└── next.config.mjs
```

---

## Authentication

### Cookie Manager

Located at `src/infrastructure/auth/CookieManager.ts`:

| Cookie | Purpose |
|---|---|
| `__Host-nc_at` | Access token |
| `__Host-nc_rt` | Refresh token |
| `__Host-nc_csrf` | CSRF token |

### RestClient

Located at `src/infrastructure/api/RestClient.ts`:

- Uses `credentials: 'include'` for cookie auth
- Adds `X-CSRF-Token` header for mutating requests
- Handles token refresh automatically

### API Configuration

```typescript
// Environment
NEXT_PUBLIC_API_URL=https://brain.neurecore.com/api/v1
```

---

## Data Fetching

### TanStack Query

All server state is fetched via TanStack Query v5:

```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['agents'],
  queryFn: () => api.get<Agent[]>('/agents'),
});
```

### Mutations

```typescript
const mutation = useMutation({
  mutationFn: (newAgent) => api.post('/agents', newAgent),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['agents'] });
  },
});
```

---

## Build & Deploy

### Local Development

```bash
cd /home/najeeb/Linux-Dev/neurecore-base/neurecore/frontend-eaos
npm run dev
```

### Production Build

```bash
cd /home/najeeb/Linux-Dev/neurecore-base/neurecore/frontend-eaos
NEXT_PUBLIC_API_URL=https://brain.neurecore.com/api/v1 \
  NEXT_PUBLIC_APP_NAME=NeureCore \
  NEXT_PUBLIC_APP_VERSION=1.0.0 \
  NEXT_PUBLIC_DEFAULT_THEME=dark \
  npm run build
```

### Deploy Script

```bash
cd /home/najeeb/Linux-Dev/neurecore-base/neurecore/deployment/scripts
./deploy-all.sh eaos
```

---

## PM2 Management

```bash
# Check status
ssh contabo 'pm2 list | grep neurecore-eaos'

# View logs
ssh contabo 'pm2 logs neurecore-eaos --lines 50'

# Restart
ssh contabo 'pm2 restart neurecore-eaos'
```

---

## Troubleshooting

### Build Failures

```bash
# Clean build - MUST use correct NEXT_PUBLIC_API_URL
ssh contabo 'cd /opt/neurecore/frontend-eaos && rm -rf .next && \
  NEXT_PUBLIC_API_URL=https://brain.neurecore.com/api/v1 npx next build'
```

**Important:** `NEXT_PUBLIC_API_URL` MUST be set at build time. Next.js embeds env vars at build time, not runtime.

### Chunk Loading Failures (HTTP 500 on JS files)

**Symptom:** Login page loads HTML but JS chunks return 500.

**Diagnosis:**
```bash
# Check chunks exist
ssh contabo 'ls /opt/neurecore/frontend-eaos/.next/static/chunks/ | wc -l'

# Check which port Next.js is actually on
ssh contabo 'netstat -tlnp | grep next'
```

**Fix:**
```bash
# Kill all Next.js processes
ssh contabo 'pkill -9 -f "next-server"'
ssh contabo 'pkill -9 -f "3011"'
sleep 2

# Start fresh
ssh contabo 'cd /opt/neurecore/frontend-eaos && node node_modules/.bin/next start --hostname 127.0.0.1 --port 3011 &'
sleep 3

# Verify
curl -s https://hq.neurecore.com/_next/static/chunks/3obfewke3_gct.js | head -c 100
```

### Static Assets 404

Ensure `.next/static` is copied to `.next/standalone/`:

```bash
ssh contabo 'cp -r /opt/neurecore/frontend-eaos/.next/static /opt/neurecore/frontend-eaos/.next/standalone/.next/static'
```

### Cookie Issues

- Verify `__Host-` prefix requires HTTPS
- Check `credentials: 'include'` in RestClient
- Verify CSRF header is sent for mutations

### Port 3011 Conflict

Multiple Next.js processes may conflict. Always check `netstat -tlnp | grep next` before starting.

---

## Known Issues

### PM2 Process Management (2026-06-30)

The `neurecore-eaos` PM2 process may fail to start correctly due to port conflicts. Currently running as standalone process. See `../troubleshooting/01-troubleshooting.md` for resolution.

### Cookie Manager False Positive

`CookieManager.hasAuthCookies()` returns false for cross-domain cookies (HQ domain vs API domain). This does NOT indicate actual auth failure - the auth works correctly via `/auth/me` endpoint. Do NOT block login based on this check.

---

## Related Documents

- `../backend/01-backend.md` — Backend architecture
- `../security/01-authentication.md` — Auth system
- `../deployment/01-deployment.md` — Deployment procedures
