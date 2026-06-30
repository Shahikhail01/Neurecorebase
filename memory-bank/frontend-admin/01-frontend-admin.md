# Frontend — Admin Console

**Last Updated:** 2026-06-30
**Last Verified:** 2026-06-30 (live inspection)
**Audience:** Frontend developers, admin UI engineers

---

## Overview

Admin console for NeureCore platform management.

- **Location:** `/opt/neurecore/frontend-admin/` (production) or `/home/najeeb/Linux-Dev/neurecore-base/neurecore/frontend-admin/` (local)
- **Port:** 3020
- **URL:** https://cc.neurecore.com/admin
- **PM2:** neurecore-admin
- **basePath:** `/admin`

---

## Tech Stack

| Concern | Library | Version |
|---|---|---|
| Framework | Next.js | 15 (App Router) |
| Runtime | React | 19.0.0 |
| Styling | Tailwind CSS | 3.4.17 |
| UI Components | Radix UI | latest |
| Charts | Recharts | 3.7.0 |
| State | Zustand | 5.0.3 |
| Auth | Shared cookies | (with EAOS) |
| HTTP | Axios | 1.7.9 |
| WebSockets | Socket.IO client | 4.8.1 |

---

## Directory Structure

```
frontend-admin/
├── src/
│   ├── app/                      # Next.js App Router pages
│   │   ├── admin/               # basePath prefix
│   │   │   ├── agents/
│   │   │   ├── agent-templates/
│   │   │   ├── billing/
│   │   │   ├── brain/
│   │   │   ├── connectors/
│   │   │   ├── models/
│   │   │   ├── monitoring/
│   │   │   ├── overview/
│   │   │   ├── security/
│   │   │   ├── settings/
│   │   │   ├── tenants/
│   │   │   ├── users/
│   │   │   └── login/
│   │   └── layout.tsx
│   ├── components/
│   └── lib/
├── public/
├── package.json
└── next.config.js
```

---

## URL Rewriting

Admin console uses LiteSpeed rewrite rules to map Vercel-style URLs:

| Original URL | Rewritten to |
|---|---|
| `/` | `/admin` |
| `/login` | `/admin/login` |
| `/agents` | `/admin/agents` |
| `/agent-templates` | `/admin/agent-templates` |
| `/billing` | `/admin/billing` |
| `/brain` | `/admin/brain` |
| `/connectors` | `/admin/connectors` |
| `/models` | `/admin/models` |
| `/monitoring` | `/admin/monitoring` |
| `/overview` | `/admin/overview` |
| `/security` | `/admin/security` |
| `/settings` | `/admin/settings` |
| `/tenants` | `/admin/tenants` |
| `/users` | `/admin/users` |

---

## Authentication

Admin shares authentication with EAOS via cookies:
- `__Host-nc_at`
- `__Host-nc_rt`
- `__Host-nc_csrf`

No separate login page — redirected to admin login if not authenticated.

---

## Build & Deploy

### Local Development

```bash
cd /home/najeeb/Linux-Dev/neurecore-base/neurecore/frontend-admin
npm run dev
```

### Production Build

```bash
cd /home/najeeb/Linux-Dev/neurecore-base/neurecore/frontend-admin
NEXT_PUBLIC_API_URL=https://brain.neurecore.com/api/v1 \
  NODE_ENV=production \
  npm run build
```

### Deploy Script

```bash
cd /home/najeeb/Linux-Dev/neurecore-base/neurecore/deployment/scripts
./deploy-all.sh admin
```

---

## PM2 Management

```bash
# Check status
ssh contabo 'pm2 list | grep neurecore-admin'

# View logs
ssh contabo 'pm2 logs neurecore-admin --lines 50'

# Restart
ssh contabo 'pm2 restart neurecore-admin'
```

---

## Troubleshooting

### Rewrite Rules Not Working

Check LiteSpeed vhost configuration:
```bash
ssh contabo 'cat /usr/local/lsws/conf/vhosts/cc.neurecore.com/vhost.conf'
```

Ensure catch-all proxy rule exists:
```apache
RewriteRule ^(.*)$ http://neurecore_admin/$1 [P,L]
```

### Static Assets 404

Check that `.next/standalone` has static assets:
```bash
ssh contabo 'ls /opt/neurecore/frontend-admin/.next/standalone/.next/static/'
```

---

## Related Documents

- `../backend/01-backend.md` — Backend architecture
- `../security/01-authentication.md` — Auth system
- `../infrastructure/02-litespeed.md` — LiteSpeed rewrites
- `../deployment/01-deployment.md` — Deployment procedures
