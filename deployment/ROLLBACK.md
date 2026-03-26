# Rollback Procedures

## Overview

This document outlines the procedures for rolling back deployments in different scenarios.

## Types of Rollbacks

### 1. Instant Rollback (Recommended)

- Reverts to previous deployment instantly
- No new build required
- Preserves current database state
- Works for both frontends and backends

### 2. Database Rollback

- Reverts database migrations
- Requires careful planning
- May result in data loss
- Only use when migrations cause critical issues

## Rollback Methods

### Method 1: Via GitHub Actions (Recommended)

1. Navigate to the **Actions** tab in your GitHub repository
2. Select **Rollback Deployment** workflow
3. Click **Run workflow**
4. Select environment:
   - `staging` - For staging environment
   - `production` - For production environment
5. (Optional) Enter specific deployment ID
6. Click **Run workflow**

### Method 2: Via Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Navigate to **Deployments**
4. Find the last known working deployment
5. Click the **...** menu (three dots)
6. Select **Promote to Production**
7. Confirm the action

### Method 3: Via Vercel CLI

```bash
# List recent deployments
vercel ls

# Get deployment ID from the list
# Then rollback to specific deployment
vercel rollback <deployment-id> --yes --prod

# Or rollback to previous deployment
vercel rollback --yes --prod
```

### Method 4: Via Git

```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or checkout previous tag
git checkout tags/v1.2.3 -b revert-branch
git merge revert-branch
git push origin main
```

## Rollback Decision Tree

```
Is the issue critical (data loss, security)?
├── Yes
│   ├── Is database migration the cause?
│   │   ├── Yes → Rollback database migrations
│   │   │   └── ./deployment/scripts/migrate.sh down
│   │   └── No → Instant rollback (frontend/backend)
│   └── Is there data corruption?
│       └── Yes → Contact support immediately
└── No
    ├── Can it wait for next release?
    │   └── Yes → Fix in next deployment
    └── No → Instant rollback (recommended)
```

## Emergency Rollback Checklist

Before performing emergency rollback:

- [ ] Notify team via Slack (#neurecore-alerts)
- [ ] Document current issue in incident tracker
- [ ] Attempt instant rollback first
- [ ] Verify rollback success with health checks
- [ ] Monitor error rates after rollback
- [ ] Schedule post-incident review

## Database Rollback

### Important Warnings

⚠️ **WARNING**: Database rollbacks can result in data loss. Proceed with caution!

- Only rollback migrations if absolutely necessary
- Always backup database before rollback
- Test rollback in staging first

### Database Rollback Procedure

```bash
# Backup database first
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Rollback last migration
cd backend
pnpm prisma migrate rollback

# Or rollback to specific migration
pnpm prisma migrate resolve --rolled-back <migration_name>
```

## Verification Steps

After rollback, verify:

1. **Health checks pass**:

   ```bash
   curl -f https://tenant.neurecore.com/api/health
   curl -f https://admin.neurecore.com/api/health
   curl -f https://api.neurecore.com/api/v1/health
   ```

2. **Error rates normalized**:
   - Check Vercel Analytics
   - Check Sentry dashboard

3. **Core functionality works**:
   - User authentication
   - API endpoints
   - Database connections

## Rollback Metrics

Track rollback metrics:

- Time to detect issue
- Time to initiate rollback
- Time to fully restore
- User impact duration

## Preventing Future Issues

1. **Always test in staging first**
2. **Use feature flags for risky changes**
3. **Implement canary deployments**
4. **Monitor error rates continuously**
5. **Maintain good CI/CD practices**

## Contact Information

For urgent issues:

- **On-call**: oncall@neurecore.com
- **Slack**: #neurecore-emergency
- **Phone**: +1-555-NEURECORE
