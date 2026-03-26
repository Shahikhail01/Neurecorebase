# Vercel Deployment Fix - All Three Projects

## Investigation Summary

### Current Vercel Project Links Found:

| Location           | Vercel Project Name | Project ID                       |
| ------------------ | ------------------- | -------------------------------- |
| `.vercel/` (root)  | neurecore-cc        | prj_sxIw50EZNvAhWcBeMq9gwKzvKaw6 |
| `backend/.vercel/` | neurecore-back      | prj_cMFmGQ81ZiBtSwBLWgDWZNbczP7z |
| frontend-admin/    | NOT LINKED          | -                                |
| frontend-tenant/   | NOT LINKED          | -                                |

### Root Cause Analysis

**Error:** `The provided path '/mnt/LinuxData/Web Dev/NeureCore/[project]/[project]' does not exist.`

This error occurs because:

1. Each Vercel project has its subdirectory name (e.g., "backend", "frontend-admin", "frontend-tenant") set as the **Root Directory** in Vercel dashboard settings
2. Vercel then tries to find that subdirectory relative to the repo root, resulting in double paths like `backend/backend`, `frontend-admin/frontend-admin`
3. The symlink resolution of `/home/najeeb/LinuxData` → `/mnt/LinuxData` adds another layer of complexity

---

## Solution: Fix Root Directory for All Projects

### Option A: Fix via Vercel Dashboard (Recommended)

#### Step 1: Navigate to Each Project in Vercel Dashboard

1. **Backend Project** (`neurecore-back`)
   - URL: https://vercel.com/dashboard/neurecore-back
   - Settings → General → Root Directory

2. **Frontend Admin Project** (`neurecore-cc`)
   - URL: https://vercel.com/dashboard/neurecore-cc
   - Settings → General → Root Directory

3. **Frontend Tenant Project** (check Vercel dashboard for project name)
   - URL: https://vercel.com/dashboard
   - Find the tenant frontend project
   - Settings → General → Root Directory

#### Step 2: Change Root Directory Setting

For each project:

| Project         | Current Root Directory | New Root Directory |
| --------------- | ---------------------- | ------------------ |
| neurecore-back  | backend                | .                  |
| neurecore-cc    | frontend-admin         | .                  |
| frontend-tenant | frontend-tenant        | .                  |

**Important:** Set Root Directory to `.` (dot = current directory) NOT the subdirectory name.

#### Step 3: Save and Redeploy

1. Click **Save** in Vercel dashboard
2. Go to **Deployments** tab
3. Click **Redeploy** on the latest deployment

---

### Option B: Re-link Projects via Vercel CLI

If you prefer CLI, re-link each project with correct root directory:

```bash
# Install Vercel CLI if needed
npm install -g vercel

# Login to Vercel
vercel login

# ==========================================
# BACKEND PROJECT
# ==========================================
cd /home/najeeb/LinuxData/Web\ Dev/NeureCore

# Remove old .vercel (backup first)
cp -r backend/.vercel backend/.vercel.backup
rm -rf backend/.vercel

# Link to existing project
vercel link --project=neurecore-back

# When prompted for root directory, enter: .
# OR use --yes flag
vercel link --yes --cwd=backend

# Deploy
vercel --prod --cwd=backend

# ==========================================
# FRONTEND-ADMIN PROJECT
# ==========================================

# Remove any existing .vercel
rm -rf frontend-admin/.vercel 2>/dev/null

# Link to existing project (neurecore-cc)
vercel link --yes --cwd=frontend-admin

# Deploy
vercel --prod --cwd=frontend-admin

# ==========================================
# FRONTEND-TENANT PROJECT
# ==========================================

# Create new project or link to existing
rm -rf frontend-tenant/.vercel 2>/dev/null

# Link (create new or existing)
vercel link --yes --cwd=frontend-tenant

# Deploy
vercel --prod --cwd=frontend-tenant
```

---

## Project-Specific Instructions

### 1. Backend Project (neurecore-back)

**Current State:**

- `.vercel/` exists in `backend/` directory
- Linked to project: `neurecore-back`
- vercel.json configured with NestJS settings

**Error:** `The provided path '/mnt/LinuxData/Web Dev/NeureCore/backend/backend' does not exist.`

**Fix Steps:**

1. Go to https://vercel.com/dashboard/neurecore-back/settings
2. Find **General** → **Root Directory**
3. Change from `backend` to `.`
4. Click **Save**
5. Redeploy

**Alternative (re-link):**

```bash
cd /home/najeeb/LinuxData/Web\ Dev/NeureCore
rm -rf backend/.vercel
vercel link --yes --cwd=backend
vercel --prod --cwd=backend
```

---

### 2. Frontend-Admin Project (neurecore-cc)

**Current State:**

- No `.vercel/` directory in `frontend-admin/`
- Uses root `.vercel/` which is linked to `neurecore-cc`
- vercel.json configured with Next.js settings

**Error:** `The provided path '/mnt/LinuxData/Web Dev/NeureCore/frontend-admin/frontend-admin' does not exist.`

**Fix Steps:**

1. Go to https://vercel.com/dashboard/neurecore-cc/settings
2. Find **General** → **Root Directory**
3. Change from `frontend-admin` to `.`
4. Click **Save**
5. Redeploy

**Alternative (re-link with new subdirectory):**

```bash
cd /home/najeeb/LinuxData/Web\ Dev/NeureCore
rm -rf frontend-admin/.vercel 2>/dev/null
vercel link --yes --cwd=frontend-admin
vercel --prod --cwd=frontend-admin
```

---

### 3. Frontend-Tenant Project

**Current State:**

- No `.vercel/` directory in `frontend-tenant/`
- Needs to be linked to its own Vercel project
- vercel.json configured with Next.js settings

**Error:** `The provided path '/mnt/LinuxData/Web Dev/NeureCore/frontend-tenant/frontend-tenant' does not exist.`

**Fix Steps:**

**Option 1 - Use existing project (if exists):**

1. Find the tenant frontend project in Vercel dashboard
2. Settings → General → Root Directory
3. Change from `frontend-tenant` to `.`
4. Save and Redeploy

**Option 2 - Create new project:**

```bash
cd /home/najeeb/LinuxData/Web\ Dev/NeureCore
vercel login
vercel link --yes --cwd=frontend-tenant
# Follow prompts to create new project
vercel --prod --cwd=frontend-tenant
```

---

## Verification Steps

After fixing each project, verify the deployment:

### Check 1: Build Logs

In Vercel dashboard → Deployments → Click on latest deployment:

- Should see build command: `pnpm build` or `npm run build`
- Build should run from correct directory

### Check 2: Directory Structure

- Backend: Should look for `/mnt/LinuxData/Web Dev/NeureCore/backend/`
- Frontend-admin: Should look for `/mnt/LinuxData/Web Dev/NeureCore/frontend-admin/`
- Frontend-tenant: Should look for `/mnt/LinuxData/Web Dev/NeureCore/frontend-tenant/`

### Check 3: Environment Variables

Ensure all required secrets are set in each project's Settings → Environment Variables:

**Backend (neurecore-back):**

- DATABASE_URL
- REDIS_URL
- JWT_SECRET
- JWT_REFRESH_SECRET
- ENCRYPTION_KEY
- OPENAI_API_KEY

**Frontend-admin (neurecore-cc):**

- NEXT_PUBLIC_API_URL
- NEXT_PUBLIC_SOCKET_URL
- NEXT_PUBLIC_APP_URL
- JWT_SECRET
- JWT_REFRESH_SECRET

**Frontend-tenant:**

- NEXT_PUBLIC_API_URL
- NEXT_PUBLIC_SOCKET_URL
- NEXT_PUBLIC_APP_URL

---

## Rollback Instructions

If deployment fails after changes:

1. **Via Dashboard:**
   - Go to Vercel Dashboard → Deployments
   - Find last working deployment
   - Click "..." → "Promote to Production"

2. **Via CLI:**
   ```bash
   vercel rollback neurecore-back
   vercel rollback neurecore-cc
   vercel rollback <tenant-project-name>
   ```

---

## Summary

| Project         | Vercel Project    | Root Directory Fix      | Action                  |
| --------------- | ----------------- | ----------------------- | ----------------------- |
| Backend         | neurecore-back    | `backend` → `.`         | Dashboard or re-link    |
| Frontend-admin  | neurecore-cc      | `frontend-admin` → `.`  | Dashboard or re-link    |
| Frontend-tenant | [check dashboard] | `frontend-tenant` → `.` | Dashboard or create new |

**Key Takeaway:** Never set Root Directory to the subdirectory name when the project is inside that subdirectory. Always use `.` (current directory) for projects located in subdirectories.
