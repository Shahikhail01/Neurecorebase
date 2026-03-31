# Troubleshooting Guide

## Common Deployment Issues

### Build Failures

#### Issue: `Module not found` errors

**Symptoms:**

```
Module not found: Cannot resolve module 'some-module'
```

**Solutions:**

1. Clear the build cache:

   ```bash
   rm -rf frontend-tenant/.next frontend-admin/.next
   ```

2. Reinstall dependencies:

   ```bash
   cd frontend-tenant && rm -rf node_modules && pnpm install
   cd ../frontend-admin && rm -rf node_modules && pnpm install
   ```

3. Check for missing peer dependencies:
   ```bash
   pnpm install --strict-peer-dependencies
   ```

#### Issue: TypeScript compilation errors

**Symptoms:**

```
error TS2307: Cannot find module '@/some/path'
```

**Solutions:**

1. Check `tsconfig.json` paths configuration:

   ```json
   {
     "compilerOptions": {
       "baseUrl": ".",
       "paths": {
         "@/*": ["./src/*"]
       }
     }
   }
   ```

2. Regenerate types:
   ```bash
   cd backend && pnpm prisma generate
   ```

### Database Issues

#### Issue: `Connection refused` errors

**Symptoms:**

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solutions:**

1. Verify DATABASE_URL is set correctly
2. For production, ensure database allows Vercel IPs
3. Check if using connection pooling (required for Vercel)

#### Issue: Migration failures

**Symptoms:**

```
Error: P3009
```

**Solutions:**

1. Reset migration state (development only):

   ```bash
   cd backend
   pnpm prisma migrate resolve --rolled-back <migration_name>
   ```

2. For fresh start:
   ```bash
   pnpm prisma migrate reset --force
   ```

### Environment Variable Issues

#### Issue: Variables not loading

**Symptoms:**

```
undefined is not a function for process.env.VAR_NAME
```

**Solutions:**

1. Check variable is set in Vercel Project Settings
2. Redeploy after adding new variables
3. Use `NEXT_PUBLIC_` prefix for client-side variables
4. Restart Vercel dev server

#### Issue: Secrets not working

**Symptoms:**

```
Error: Environment variable not found
```

**Solutions:**

1. Use `@` prefix for Vercel secrets:
   ```
   DATABASE_URL=@neurecore-database-url
   ```
2. Verify secret exists in Vercel Project Settings
3. Check secrets are scoped to correct environment

### Runtime Issues

#### Issue: 500 Internal Server Error

**Solutions:**

1. Check Vercel function logs:

   ```bash
   vercel logs neurecore --follow
   ```

2. Check Sentry for error details
3. Verify environment variables match between local and production

#### Issue: Function timeout

**Symptoms:**

```
Function execution time exceeded
```

**Solutions:**

1. Increase function timeout in `vercel.json`:

   ```json
   {
     "functions": {
       "api/**/*.ts": {
         "maxDuration": 60
       }
     }
   }
   ```

2. Optimize database queries
3. Implement caching

#### Issue: Out of memory

**Symptoms:**

```
FATAL ERROR: CALL_AND_RETRY_LAST Allocation failed
```

**Solutions:**

1. Increase memory in `vercel.json`:

   ```json
   {
     "functions": {
       "api/**/*.ts": {
         "memory": 3008
       }
     }
   }
   ```

2. Reduce bundle size
3. Implement pagination

### Network Issues

#### Issue: CORS errors

**Symptoms:**

```
Access to fetch at 'https://api...' has been blocked by CORS policy
```

**Solutions:**

1. Update CORS configuration in backend
2. Check `vercel.json` headers configuration
3. Verify origin is in allowed list

#### Issue: WebSocket connection failed

**Solutions:**

1. Check WebSocket server is running
2. Verify `NEXT_PUBLIC_SOCKET_URL` is correct
3. Check firewall rules

### Contabo Backend Issues

#### Issue: 502 Bad Gateway from brain.neurecore.com

**Symptoms:**

- HTTPS requests to `https://brain.neurecore.com/api/*` return HTTP 502
- Nginx logs show `connect() failed (111: Connection refused) while connecting to upstream`

**Diagnostics:**

1. Check if backend is running:
   ```bash
   ssh contabo
   pm2 list
   ```
2. Verify Nginx upstream configuration:
   ```bash
   cat /etc/nginx/sites-available/brain.neurecore.com
   ```
3. Test backend directly (bypass Nginx):
   ```bash
   curl -v http://localhost:3003/api/v1/health
   ```
4. Check Nginx error logs:
   ```bash
   tail -f /var/log/nginx/error.log
   ```

**Solutions:**

1. Restart backend via PM2:
   ```bash
   pm2 restart neurecore-backend
   ```
2. If backend is not running, start it:
   ```bash
   cd /opt/neurecore/backend/backend
   npm run build
   pm2 start dist/src/main.js --name neurecore-backend
   ```
3. Verify Nginx upstream points to correct port (default 3003):
   ```nginx
   location /api/ {
       proxy_pass http://127.0.0.1:3003;
   }
   ```
4. Reload Nginx after configuration changes:
   ```bash
   sudo nginx -t && sudo systemctl reload nginx
   ```

#### Issue: PM2 process missing or crashed

**Symptoms:**

- `pm2 list` shows no `neurecore-backend` process
- Backend logs are empty

**Solutions:**

1. Navigate to backend directory and start:
   ```bash
   cd /opt/neurecore/backend/backend
   pm2 start dist/src/main.js --name neurecore-backend
   ```
2. Save PM2 process list for automatic restart:
   ```bash
   pm2 save
   pm2 startup
   ```
3. Enable PM2 logs:
   ```bash
   pm2 logs neurecore-backend --lines 100
   ```

#### Issue: Database connection failures

**Symptoms:**

- Backend logs show `PrismaClientInitializationError`
- `Error: connect ECONNREFUSED` for Neon PostgreSQL

**Solutions:**

1. Verify `DATABASE_URL` environment variable is set in `/opt/neurecore/backend/backend/.env`
2. Test database connectivity:
   ```bash
   psql $DATABASE_URL -c "SELECT 1"
   ```
3. Ensure Neon allows Contabo IP (`109.123.248.253`) in firewall rules
4. Restart backend after fixing environment variables

#### Issue: Pending Prisma migrations

**Symptoms:**

- New features missing database tables
- API returns `P2021` (table does not exist) errors

**Solutions:**

1. Run migrations on Contabo:
   ```bash
   cd /opt/neurecore/backend/backend
   npx prisma migrate deploy
   ```
2. Generate Prisma client:
   ```bash
   npx prisma generate
   ```
3. Restart backend after migration

### Performance Issues

#### Issue: Slow page load

**Solutions:**

1. Check Vercel Analytics
2. Enable Edge Caching
3. Optimize images with `next/image`
4. Implement code splitting

#### Issue: High latency

**Solutions:**

1. Deploy to multiple regions
2. Use CDN for static assets
3. Implement Redis caching
4. Optimize database queries

## Getting Help

### Logs

```bash
# View Vercel logs
vercel logs neurecore

# View specific deployment
vercel logs neurecore --deployment=<deployment-id>

# Follow logs in real-time
vercel logs neurecore --follow
```

### Diagnostics

```bash
# Check deployment status
vercel ls

# View deployment details
vercel inspect <deployment-id>
```

### Support Channels

- **Slack**: #neurecore-deployments
- **Email**: support@neurecore.com
- **GitHub Issues**: https://github.com/your-org/neurecore/issues
