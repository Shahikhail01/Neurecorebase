#!/bin/bash
# =============================================================================
# Phase 5: Low-Privilege User Isolation for NeureCore Backend
# =============================================================================
# Purpose: Run backend under dedicated neure-worker user instead of root
# Target: Contabo VPS (brain.neurecore.com)
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Phase 5: Low-Privilege User Isolation ===${NC}"

# -----------------------------------------------------------------------------
# Step 1: Create dedicated neure-worker user
# -----------------------------------------------------------------------------
echo -e "${GREEN}[1/4] Creating neure-worker user...${NC}"

# Check if user exists
if id "neure-worker" &>/dev/null; then
    echo "  ✓ neure-worker user already exists"
else
    sudo useradd -r -s /bin/false -m -d /opt/neurecore neure-worker
    echo "  ✓ Created neure-worker user"
fi

# -----------------------------------------------------------------------------
# Step 2: Create workspace directory with proper permissions
# -----------------------------------------------------------------------------
echo -e "${GREEN}[2/4] Setting up workspace directory...${NC}"

sudo mkdir -p /opt/neurecore/agent-workspace
sudo mkdir -p /opt/neurecore/logs
sudo chown -R neure-worker:neure-worker /opt/neurecore
sudo chmod 755 /opt/neurecore
sudo chmod 700 /opt/neurecore/agent-workspace
sudo chmod 755 /opt/neurecore/logs

echo "  ✓ Workspace directory configured"
echo "    - /opt/neurecore: 755 (drwxr-xr-x)"
echo "    - /opt/neurecore/agent-workspace: 700 (drwx------)"
echo "    - /opt/neurecore/logs: 755 (drwxr-xr-x)"

# -----------------------------------------------------------------------------
# Step 3: Stop current backend
# -----------------------------------------------------------------------------
echo -e "${GREEN}[3/4] Stopping current backend...${NC}"

pm2 stop neurecore-backend 2>/dev/null || true
echo "  ✓ Backend stopped"

# -----------------------------------------------------------------------------
# Step 4: Update PM2 ecosystem config to run as neure-worker
# -----------------------------------------------------------------------------
echo -e "${GREEN}[4/4] Updating PM2 to run as neure-worker...${NC}"

# Create updated ecosystem config
cat > /tmp/ecosystem-privileged.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'neurecore-backend',
      script: 'dist/main.js',
      cwd: '/opt/neurecore/backend',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      // Run as neure-worker user for security isolation
      // This requires PM2 to be started with sudo
      exec_single: './node_modules/.bin/ts-node -r tsconfig-paths/register',
      // Comment out exec_single above and uncomment below for compiled JS:
      // exec_single: 'node',
    },
  ],
};
EOF

# For compiled version, create separate config
cat > /tmp/ecosystem-lowpriv.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'neurecore-backend',
      script: 'dist/main.js',
      cwd: '/opt/neurecore/backend',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};
EOF

# Copy configs to server location
sudo cp /tmp/ecosystem-lowpriv.config.js /opt/neurecore/ecosystem.config.js
sudo chown neure-worker:neure-worker /opt/neurecore/ecosystem.config.js

# -----------------------------------------------------------------------------
# Step 5: Restart PM2 as neure-worker
# Note: This step requires sudo and user switching
# -----------------------------------------------------------------------------
echo -e "${YELLOW}[5/5] Restarting PM2 as neure-worker...${NC}"
echo -e "${YELLOW}    This requires manual execution with sudo:${NC}"
echo ""
echo "    sudo -u neure-worker pm2 start /opt/neurecore/ecosystem.config.js --env production"
echo "    sudo -u neure-worker pm2 save"
echo ""
echo -e "${GREEN}=== Phase 5 Script Complete ===${NC}"
echo ""
echo "To complete the migration, run these commands on the server:"
echo "  1. sudo -u neure-worker pm2 start /opt/neurecore/ecosystem.config.js --env production"
echo "  2. sudo -u neure-worker pm2 save"
echo "  3. pm2 status  # Verify it's running"
echo "  4. ps aux | grep neurecore  # Verify user is neure-worker"
