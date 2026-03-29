# Contabo GitHub Auto-Deploy Guide

## Overview

This guide covers connecting **brain.neurecore.com** (backend on Contabo VPS) to GitHub for automatic deployments.

---

## Architecture

```
GitHub Push
    │
    ▼
GitHub Actions (workflow_dispatch or webhook)
    │
    ▼
SSH to Contabo (109.123.248.253)
    │
    ▼
cd /opt/neurecore/backend && git pull
    │
    ▼
npm run build && pm2 restart neurecore-backend
```

---

## Option 1: GitHub Actions with SSH (RECOMMENDED)

### Prerequisites

1. **SSH Access to Contabo** (already configured)

   ```bash
   ssh contabo  # or ssh root@109.123.248.253
   ```

2. **Deploy Key or Personal Access Token** for GitHub

### Step 1: Create a Deploy Key on GitHub

```bash
# Generate a new SSH key for deployment (no passphrase)
ssh-keygen -t ed25519 -f deploy_key -N ""

# Copy the public key
cat deploy_key.pub
```

1. Go to GitHub → Repository → Settings → Deploy Keys
2. Add the public key with read-only access (no write access needed)
3. Save the private key for GitHub Secrets

### Step 2: Add Secrets to GitHub

Go to GitHub → Repository → Settings → Secrets and add:

| Secret Name            | Value                                    |
| ---------------------- | ---------------------------------------- |
| `CONTABO_HOST`         | `109.123.248.253`                        |
| `CONTABO_PORT`         | `22`                                     |
| `CONTABO_USERNAME`     | `root` (or `neure-worker` after Phase 5) |
| `CONTABO_SSH_KEY`      | Paste entire private key content         |
| `CONTABO_BACKEND_PATH` | `/opt/neurecore/backend`                 |
| `CONTABO_PM2_PROCESS`  | `neurecore-backend`                      |

### Step 3: Create GitHub Actions Workflow

Create `.github/workflows/deploy-contabo.yml`:

```yaml
name: Deploy to Contabo Backend

on:
  push:
    branches:
      - main # Auto-deploy on main push
  workflow_dispatch: # Manual trigger

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0 # For git operations

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: |
          cd backend
          npm ci

      - name: Generate Prisma Client
        run: |
          cd backend
          npx prisma generate

      - name: Build
        run: |
          cd backend
          npm run build

      - name: Deploy to Contabo
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.CONTABO_HOST }}
          port: ${{ secrets.CONTABO_PORT }}
          username: ${{ secrets.CONTABO_USERNAME }}
          key: ${{ secrets.CONTABO_SSH_KEY }}
          script: |
            cd ${{ secrets.CONTABO_BACKEND_PATH }}
            git pull origin main
            npm ci
            npx prisma generate
            npm run build
            pm2 restart ${{ secrets.CONTABO_PM2_PROCESS }}

      - name: Health Check
        run: |
          sleep 5
          curl -f https://brain.neurecore.com/api/v1/health || exit 1
```

---

## Option 2: Git Post-Receive Hook (Alternative)

For this approach, the Contabo server pulls from GitHub when a webhook hits.

### Step 1: Setup Git Repository on Contabo

```bash
# SSH to Contabo
ssh contabo

# Create a bare git repository
sudo mkdir -p /var/repo/neurecore-backend.git
cd /var/repo/neurecore-backend.git
sudo git init --bare

# Create post-receive hook
sudo cat > hooks/post-receive << 'EOF'
#!/bin/bash
TARGET="/opt/neurecore/backend"
GIT_DIR="/var/repo/neurecore-backend.git"

while read oldrev newrev refname; do
    branch=$(echo $refname | sed 's|refs/heads/||')
    if [ "$branch" = "main" ]; then
        echo "Deploying main branch..."
        cd $TARGET || exit 1
        git pull origin main

        # Rebuild and restart
        npm ci
        npx prisma generate
        npm run build
        pm2 restart neurecore-backend
        echo "Deployment complete!"
    fi
done
EOF

sudo chmod +x hooks/post-receive
```

### Step 2: Add Webhook in GitHub

1. Go to GitHub → Repository → Settings → Webhooks
2. Add webhook:
   - Payload URL: `https://brain.neurecore.com/api/webhook/deploy` (you'd need to create this endpoint)
   - Content type: `application/json`
   - Events: Push

### Step 3: Add Remote to Local Clone

```bash
# On your local machine
git remote add contabo root@109.123.248.253:/var/repo/neurecore-backend.git

# Push to both GitHub and Contabo
git push origin main
git push contabo main
```

---

## Option 3: Simple Manual Pull (No Auto-Deploy)

For a lightweight approach without webhooks:

```bash
# SSH to Contabo
ssh contabo

# Pull latest changes manually
cd /opt/neurecore/backend
git pull origin main

# Rebuild
npm ci
npx prisma generate
npm run build

# Restart PM2
pm2 restart neurecore-backend
```

---

## Comparison

| Method                    | Complexity | Auto-Deploy | Rollback     | Security                  |
| ------------------------- | ---------- | ----------- | ------------ | ------------------------- |
| **GitHub Actions + SSH**  | Medium     | ✅          | ✅ (via SHA) | ✅ (encrypted secrets)    |
| **Git Post-Receive Hook** | High       | ✅          | ⚠️ Manual    | ⚠️ Needs webhook endpoint |
| **Manual Pull**           | Low        | ❌          | ⚠️ Manual    | ✅ Full control           |

**Recommendation**: Use **Option 1 (GitHub Actions + SSH)** for the best balance of automation, security, and rollback capability.

---

## CyberPanel Considerations

CyberPanel does **not** have built-in GitHub integration like cPanel's "Git Version Control" or Plesk's Git support. The options above work regardless of CyberPanel since they rely on:

1. Standard SSH access (CyberPanel doesn't block this)
2. Standard git commands
3. PM2 for process management

### CyberPanel Specific Notes

- CyberPanel uses **OpenLiteSpeed** as web server (not nginx directly)
- The backend at port 4000 is proxied via CyberPanel's nginx configuration
- You can find nginx config at: `/usr/local/lsws/conf/vhosts/`

To check nginx config for brain.neurecore.com:

```bash
ssh contabo
cat /usr/local/lsws/conf/vhosts/brain.neurecore.com/vhost.conf
```

---

## Security Best Practices

1. **Use a dedicated deploy key** (not personal SSH key)
2. **Use `neure-worker` user** (after Phase 5 isolation) instead of `root`
3. **Limit SSH access** by IP in CyberPanel firewall
4. **Store secrets in GitHub Secrets** (never in workflow files)
5. **Verify webhook signatures** if using Option 2

---

## Rollback Procedure

### Via GitHub Actions (Option 1)

```bash
# Find the previous commit SHA
git log --oneline -10

# Go to GitHub Actions → Deploy to Contabo → Re-run with previous SHA
```

### Via SSH (Any Option)

```bash
ssh contabo
cd /opt/neurecore/backend

# Check git log for previous version
git log --oneline -5

# Reset to previous commit
git reset --hard <previous-sha>

# Rebuild and restart
npm run build
pm2 restart neurecore-backend
```

---

## Troubleshooting

### SSH Connection Fails

```bash
# Test SSH connection manually
ssh -i deploy_key -o StrictHostKeyChecking=no root@109.123.248.253

# Add host key to known_hosts
ssh-keyscan -H 109.123.248.253 >> ~/.ssh/known_hosts
```

### PM2 Process Not Found

```bash
ssh contabo
pm2 list
pm2 restart neurecore-backend
```

### Build Fails on Server

```bash
ssh contabo
cd /opt/neurecore/backend
npm ci
npm run build
```

### Health Check Fails

```bash
ssh contabo
pm2 logs neurecore-backend --lines 50
curl http://127.0.0.1:4000/api/v1/health
```
