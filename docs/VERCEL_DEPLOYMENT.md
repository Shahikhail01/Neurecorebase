# Vercel Deployment Guide

> **Status**: Deployment Complete (March 2026)
>
> - Backend: ✅ Deployed to Vercel
> - Frontends: ✅ Deployed to Vercel
> - Database: ✅ Neon PostgreSQL
> - Cache: ✅ Upstash Redis

---

This document outlines the Vercel deployment configuration for the NeureCore platform.

## Project Overview

| Project         | Vercel Name      | Domain              | Directory        |
| --------------- | ---------------- | ------------------- | ---------------- |
| Backend API     | neurecore-back   | brain.neurecore.com | backend/         |
| Admin Frontend  | neurecore-cc     | cc.neurecore.com    | frontend-admin/  |
| Tenant Frontend | neurecore-tenant | neurecore.com       | frontend-tenant/ |

### Local development ports

Use these ports when running services locally (dev):

- Backend API: `http://localhost:3000` (NestJS)
- Frontend - Tenant: `http://localhost:3001` (Next.js)
- Frontend - Admin: `http://localhost:3002` (Next.js)

## Configuration Files

### 1. Backend (brain.neurecore.com)

**File:** [`backend/vercel.json`](backend/vercel.json)

- Framework: NestJS
- Build Command: `npm run build`
- Runtime: Node.js 20.x
- Region: iad1 (Virginia)

**Entry Point:** [`backend/api/index.ts`](backend/api/index.ts)

The backend uses a serverless function handler for Vercel deployment.

### 2. Admin Frontend (cc.neurecore.com)

**File:** [`frontend-admin/vercel.json`](frontend-admin/vercel.json)

- Framework: Next.js 15
- Build Command: `pnpm build`
- Output Directory: .next
- Region: iad1 (Virginia)

### 3. Tenant Frontend (neurecore.com)

**File:** [`frontend-tenant/vercel.json`](frontend-tenant/vercel.json)

- Framework: Next.js 15.5
- Build Command: `pnpm build`
- Output Directory: .next
- Region: iad1 (Virginia)

## Environment Variables

All environment variables are stored as Vercel Project Secrets. Reference format: `@secret-name`

### Required Secrets for All Projects

| Secret Name                   | Description                  |
| ----------------------------- | ---------------------------- |
| @neurecore-database-url       | PostgreSQL connection string |
| @neurecore-redis-url          | Redis connection string      |
| @neurecore-jwt-secret         | JWT signing secret           |
| @neurecore-jwt-refresh-secret | Refresh token secret         |
| @neurecore-encryption-key     | Data encryption key          |
| @neurecore-openai-api-key     | OpenAI API key               |

### Frontend-Specific Secrets

| Secret Name             | Description                                   |
| ----------------------- | --------------------------------------------- |
| @neurecore-api-base-url | Backend API URL (https://brain.neurecore.com) |
| @neurecore-socket-url   | WebSocket server URL                          |
| @neurecore-app_URL      | Frontend application URL                      |

## Deployment Commands

### Install Vercel CLI

```bash
npm install -g vercel
```

### Login to Vercel

```bash
vercel login
```

### Deploy Each Project

**Backend:**

```bash
cd backend
vercel --prod
```

**Admin Frontend:**

```bash
cd frontend-admin
vercel --prod
```

**Tenant Frontend:**

```bash
cd frontend-tenant
vercel --prod
```

## Domain Configuration

### DNS Records

Add the following A records and CNAME records through your DNS provider:

| Type  | Name                | Value                |
| ----- | ------------------- | -------------------- |
| A     | brain.neurecore.com | 76.76.21.21          |
| A     | cc.neurecore.com    | 76.76.21.21          |
| CNAME | neurecore.com       | cname.vercel-dns.com |

### Vercel Domains Panel

After creating each Vercel project, add the domain in:

1. Go to Project Settings → Domains
2. Add the domain (e.g., brain.neurecore.com)
3. Follow the verification instructions

## CI/CD Integration

Each project has GitHub integration enabled in [`vercel.json`](backend/vercel.json):

```json
"github": {
  "enabled": true,
  "autoJobCancelation": true
}
```

Pushes to the main branch will automatically trigger deployments.

## Cron Jobs

### Backend

No cron jobs configured.

### Admin Frontend

- `/api/cron/health-check` - Every 5 minutes
- `/api/cron/cleanup` - Daily at 2:00 AM

### Tenant Frontend

- `/api/cron/cleanup` - Daily at 2:00 AM
- `/api/cron/analytics-aggregate` - Daily at 3:00 AM

## Security Headers

All projects include security headers:

- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin

## Troubleshooting

### Backend Cold Starts

The backend uses serverless functions which may experience cold starts. Consider:

- Using Vercel Pro for faster function execution
- Setting up warming cron jobs

### Environment Variables Not Loading

1. Verify secrets are set in Vercel Project Settings
2. Redeploy the project after updating secrets

### Build Failures

- Ensure pnpm is available or update build command to use npm
- Check that all dependencies are in package.json

## Rollback Instructions

If a deployment fails:

1. **Via Vercel Dashboard:**
   - Go to Deployments
   - Find the last working deployment
   - Click "..." → "Promote to Production"

2. **Via CLI:**
   ```bash
   vercel rollback <project-name>
   ```

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel CLI Reference](https://vercel.com/cli)
- [Vercel Serverless Functions](https://vercel.com/docs/serverless-functions)
