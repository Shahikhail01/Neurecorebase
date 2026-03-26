# Vercel Deployment Fix - Frontend Admin

## Issue Summary

**Error:** `The provided path '/mnt/LinuxData/Web Dev/NeureCore/frontend-admin/frontend-admin' does not exist.`

**Root Causes:**

1. **Symlink Resolution:** `/home/najeeb/LinuxData` is a symlink to `/mnt/LinuxData`
2. **Double Directory Path:** Vercel is looking for `frontend-admin/frontend-admin` instead of just `frontend-admin`

This indicates the Vercel project has `frontend-admin` set as the **Root Directory** in the project settings, causing Vercel to:

1. Navigate to the project root (`/mnt/LinuxData/Web Dev/NeureCore/`)
2. Then apply the Root Directory setting (`frontend-admin/`)
3. Resulting in the incorrect path: `frontend-admin/frontend-admin/`

---

## Solution: Update Root Directory via Vercel Dashboard

### Step-by-Step Instructions

1. **Navigate to Vercel Dashboard**
   - Go to: https://vercel.com/dashboard
   - Select the project: `neurecore-cc` or `frontend-cc`

2. **Access Project Settings**
   - Click on the project name
   - Go to **Settings** tab (gear icon)
   - Scroll to **General** section

3. **Fix Root Directory**
   - Find the **Root Directory** setting
   - Change from: `frontend-admin`
   - Change to: `.` (dot, meaning current directory) or leave empty

   **Important:** The Root Directory should be `.` (current directory) NOT `frontend-admin`

4. **Save Changes**
   - Click **Save** to apply the changes

5. **Trigger New Deployment**
   - Go to **Deployments** tab
   - Click **Redeploy** on the latest deployment, or push a small change to trigger auto-deploy

---

## Alternative: Re-link Project via CLI

If you have Vercel CLI installed locally, you can re-link the project:

```bash
# Navigate to project root
cd /home/najeeb/LinuxData/Web\ Dev/NeureCore

# Install Vercel CLI if needed
npm install -g vercel

# Login to Vercel
vercel login

# Remove old .vercel directory if exists
rm -rf frontend-admin/.vercel

# Link to existing project
vercel link --confirm

# When prompted:
# - Select "Link to existing project"
# - Choose "neurecore-cc" or "frontend-cc"
# - For root directory, select "." (current directory) NOT "frontend-admin"

# Deploy
vercel --prod
```

---

## Verify the Fix

After updating the Root Directory setting:

1. **Check Deployment Logs**
   - In Vercel dashboard, go to Deployments
   - Verify the build log shows:
     ```
     $ pnpm build
     ```
   - The build command should run from `frontend-admin/` directory

2. **Expected Directory Structure**
   - Build should look for: `/mnt/LinuxData/Web Dev/NeureCore/frontend-admin/`
   - NOT: `/mnt/LinuxData/Web Dev/NeureCore/frontend-admin/frontend-admin/`

---

## Troubleshooting

### If Issue Persists

1. **Check Git Repository Settings**
   - Ensure GitHub repo is properly connected
   - Verify the correct branch is set for production deployments

2. **Environment Variables**
   - Verify all required secrets are set in Vercel Project Settings
   - See [`docs/VERCEL_DEPLOYMENT.md`](docs/VERCEL_DEPLOYMENT.md) for required secrets

3. **Build Command Verification**
   - The build command in vercel.json is: `pnpm build`
   - Ensure pnpm is available or update to `npm run build`

### Common Issues

| Issue            | Solution                                                  |
| ---------------- | --------------------------------------------------------- |
| Path not found   | Update Root Directory to `.` in dashboard                 |
| Double directory | Root Directory is incorrectly set to `frontend-admin`     |
| Symlink issues   | Use absolute path `/mnt/LinuxData/...` in Vercel settings |

---

## Rollback Instructions

If the deployment fails after changes:

1. Go to Vercel Dashboard → Deployments
2. Find the last working deployment
3. Click "..." → "Promote to Production"

Or use CLI:

```bash
vercel rollback neurecore-cc
```
