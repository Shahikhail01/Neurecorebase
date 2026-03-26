# NeureCore Deployment Guide

## Overview

This guide covers deploying the NeureCore platform to Vercel with support for multiple environments (development, staging, production).

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Vercel Platform                           │
├─────────────────────────────────────────────────────────────────┤
│  Tenant Portal (frontend-tenant)    Admin Portal (frontend-admin) │
│  https://tenant.neurecore.com       https://admin.neurecore.com  │
├─────────────────────────────────────────────────────────────────┤
│                    API Routes / Serverless Functions             │
├─────────────────────────────────────────────────────────────────┤
│  Database (PostgreSQL)              Cache (Redis/Upstash)       │
│  Neon / Vercel Postgres             Upstash                      │
├─────────────────────────────────────────────────────────────────┤
│  Monitoring: Sentry, Vercel Analytics, Datadog (optional)       │
└─────────────────────────────────────────────────────────────────┘
```

## Prerequisites

- Node.js 20+
- pnpm
- Vercel CLI (`npm i -g vercel`)
- PostgreSQL database (Neon or Vercel Postgres)
- Redis (Upstash)
- GitHub repository

## Environment Setup

### 1. Clone the repository

```bash
git clone https://github.com/your-org/neurecore.git
cd neurecore
```

### 2. Install dependencies

```bash
# Install root dependencies
pnpm install

# Install workspace dependencies
cd backend && pnpm install
cd ../frontend-tenant && pnpm install
cd ../frontend-admin && pnpm install
```

### 3. Configure environment variables

Copy the example environment files and fill in your values:

```bash
cp deployment/environments/development.env.example deployment/environments/development.env
cp deployment/environments/staging.env.example deployment/environments/staging.env
cp deployment/environments/production.env.example deployment/environments/production.env
```

### 4. Required environment variables

#### Backend

| Variable             | Description                       | Required |
| -------------------- | --------------------------------- | -------- |
| `DATABASE_URL`       | PostgreSQL connection string      | Yes      |
| `REDIS_URL`          | Redis connection string           | Yes      |
| `JWT_SECRET`         | JWT signing secret (min 32 chars) | Yes      |
| `JWT_REFRESH_SECRET` | Refresh token secret              | Yes      |
| `SENTRY_DSN`         | Sentry DSN for error tracking     | No       |

#### Frontend

| Variable                 | Description          | Required |
| ------------------------ | -------------------- | -------- |
| `NEXT_PUBLIC_API_URL`    | Backend API URL      | Yes      |
| `NEXT_PUBLIC_SOCKET_URL` | WebSocket server URL | Yes      |

## Deployment

### Automatic Deployment (GitHub Actions)

The repository is configured with automatic deployments:

- **Development**: Deploys on push to `develop` branch
- **Staging**: Deploys on push to `develop` branch
- **Production**: Deploys on push to `main` branch

### Manual Deployment

#### Using the deployment script:

```bash
# Deploy to development
./deployment/scripts/deploy.sh development

# Deploy to staging
./deployment/scripts/deploy.sh staging

# Deploy to production
./deployment/scripts/deploy.sh production
```

#### Using Vercel CLI:

```bash
# Login to Vercel
vercel login

# Pull environment
vercel pull --yes --environment=development --token=<your-token>

# Build
vercel build

# Deploy
vercel deploy --prod
```

## Database Setup

### Running migrations

```bash
# Development
export DATABASE_URL="postgresql://..."
./deployment/scripts/migrate.sh up

# Production
export DATABASE_URL="postgresql://..."
./deployment/scripts/migrate.sh up
```

### Database commands

```bash
# Check migration status
./deployment/scripts/migrate.sh status

# Create new migration
./deployment/scripts/migrate.sh create add_new_table

# Rollback last migration
./deployment/scripts/migrate.sh down

# Seed database
./deployment/scripts/migrate.sh seed
```

## Rollback Procedures

### Via GitHub Actions

1. Go to the Actions tab in your GitHub repository
2. Select "Rollback Deployment"
3. Choose the environment (staging/production)
4. Optionally specify a deployment ID
5. Click "Run workflow"

### Via Vercel Dashboard

1. Go to Vercel Dashboard
2. Select your project
3. Go to Deployments
4. Find the working deployment
5. Click "..." and select "Promote to Production"

### Via CLI

```bash
vercel rollback <deployment-id> --yes --prod
```

## Monitoring

### Vercel Analytics

Access analytics at: https://vercel.com/dashboard

### Sentry Integration

1. Create a Sentry project
2. Add `SENTRY_DSN` to environment variables
3. Errors will automatically be captured

### Health Checks

```
Production:
- Tenant Portal: https://tenant.neurecore.com/api/health
- Admin Portal: https://admin.neurecore.com/api/health
- API: https://api.neurecore.com/api/v1/health

Staging:
- Tenant Portal: https://tenant-staging.neurecore.com/api/health
- Admin Portal: https://admin-staging.neurecore.com/api/health
```

## Troubleshooting

### Common Issues

#### Build failures

1. Check Node.js version compatibility
2. Clear `.next` cache: `rm -rf frontend-tenant/.next frontend-admin/.next`
3. Reinstall dependencies: `rm -rf node_modules && pnpm install`

#### Database connection errors

1. Verify `DATABASE_URL` is correct
2. Check database is accessible from Vercel (use Vercel Postgres or Neon)
3. Verify IP allowlist includes Vercel IPs

#### Environment variable errors

1. Check all required environment variables are set in Vercel Project Settings
2. Use `@` prefix for Vercel secrets
3. Redeploy after adding new environment variables

### Logs

```bash
# View Vercel function logs
vercel logs neurecore

# View specific deployment
vercel logs neurecore --deployment=<deployment-id>
```

## Security

### Best Practices

1. **Never commit secrets** - Use Vercel Environment Variables
2. **Use strong JWT secrets** - Minimum 32 characters
3. **Enable HTTPS** - Always in production
4. **Configure CORS** - Restrict to your domains
5. **Rate limiting** - Configure in `vercel.json`

### Secrets Management

Store secrets in Vercel Project Settings:

1. Go to Vercel Dashboard
2. Select project
3. Go to Settings > Environment Variables
4. Add variables with `@` prefix for secrets

## CI/CD Pipeline

### Workflows

1. **Build & Test** - Runs on every PR and push
2. **Deploy to Staging** - Runs on push to `develop`
3. **Deploy to Production** - Runs on push to `main`
4. **Security Scan** - Runs daily and on every push
5. **Rollback** - Manual trigger

### Quality Gates

- Type checking passes
- Lint warnings fixed
- Unit tests pass
- Security scan passes
- Build succeeds
- Smoke tests pass

## Support

For issues or questions:

- Email: support@neurecore.com
- Slack: #neurecore-deployments
- Documentation: https://docs.neurecore.com
