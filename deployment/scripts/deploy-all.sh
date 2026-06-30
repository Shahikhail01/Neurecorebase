#!/bin/bash
# deploy-all.sh — One-Source Contabo Consolidation Deploy Script
# Usage: ./deploy-all.sh [eaos|admin|both]
# Defaults to deploying both frontends.

set -euo pipefail

DEPLOY_TARGET="${1:-both}"
CONTABO_HOST="contabo"
CONTABO_USER="root"
SRC_BASE="/home/najeeb/Linux-Dev/neurecore-base/neurecore"
REMOTE_BASE="/opt/neurecore"

log() { echo "[$(date '+%H:%M:%S')] $*"; }
die() { echo "[ERROR] $*" >&2; exit 1; }

command -v rsync >/dev/null 2>&1 || die "rsync required"
command -v ssh >/dev/null 2>&1 || die "ssh required"

ssh_cmd() { ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 "$CONTABO_USER@$CONTABO_HOST" "$@"; }

log "Starting deploy: $DEPLOY_TARGET"

rsync_front() {
  local src="$1" dest="$2" name="$3"
  log "Syncing $name..."
  rsync -az --exclude='node_modules' --exclude='.next' --exclude='tsconfig.tsbuildinfo' --exclude='.env.local' --exclude='.vercel' \
    "$SRC_BASE/$src/" "$CONTABO_USER@$CONTABO_HOST:$REMOTE_BASE/$dest/" || die "$name rsync failed"
  log "$name source synced"
}

build_and_restart() {
  local dir="$1" name="$2" port="$3"
  log "Installing deps for $name..."
  ssh_cmd "cd $REMOTE_BASE/$dir && npm install --legacy-peer-deps --include=dev --engine-strict=false 2>&1 | tail -5"
  
  log "Building $name (port $port)..."
  ssh_cmd "cd $REMOTE_BASE/$dir && NEXT_PUBLIC_API_URL=https://brain.neurecore.com/api/v1 NODE_ENV=production npm run build 2>&1 | tail -10"
  
  if ssh_cmd "test -f $REMOTE_BASE/$dir/.next/standalone/server.js"; then
    ssh_cmd "cp -r $REMOTE_BASE/$dir/.next/static $REMOTE_BASE/$dir/.next/standalone/.next/static 2>/dev/null || true"
    ssh_cmd "cp -r $REMOTE_BASE/$dir/public $REMOTE_BASE/$dir/.next/standalone/public 2>/dev/null || true"
    local server="$REMOTE_BASE/$dir/.next/standalone/server.js"
    local standalone_subdir="$REMOTE_BASE/$dir/.next/standalone/frontend-admin/server.js"
    if ssh_cmd "test -f $standalone_subdir"; then
      server="$standalone_subdir"
    fi
  else
    local server="$REMOTE_BASE/$dir/.next/server.js"
  fi
  
  log "Restarting $name on port $port..."
  ssh_cmd "pm2 delete $name 2>/dev/null || true; PORT=$port pm2 start $server --name $name -- --port $port --hostname 127.0.0.1; pm2 save"
  log "$name deployed on port $port"
}

deploy_eaos() {
  rsync_front "frontend-eaos" "frontend-eaos" "EAOS"
  build_and_restart "frontend-eaos" "neurecore-eaos" "3011"
}

deploy_admin() {
  if ssh_cmd "grep -q \"output.*standalone\" $REMOTE_BASE/frontend-admin/next.config.js" 2>/dev/null; then
    : # already has standalone
  else
    log "Adding output:standalone to frontend-admin next.config.js"
    ssh_cmd "sed -i 's|const nextConfig = {|const nextConfig = { output: \"standalone\",|' $REMOTE_BASE/frontend-admin/next.config.js 2>/dev/null || true"
  fi
  rsync_front "frontend-admin" "frontend-admin" "Admin"
  build_and_restart "frontend-admin" "neurecore-admin" "3020"
}

reload_litespeed() {
  log "Reloading LiteSpeed..."
  ssh_cmd "/usr/local/lsws/bin/lswsctrl restart && sleep 8"
  log "LiteSpeed reloaded"
}

health_check() {
  log "Running health checks..."
  local errors=0
  
  local backend_status
  backend_status=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3003/api/v1/health) || backend_status="000"
  if [[ "$backend_status" == "200" ]]; then
    log "  ✓ Backend health"
  else
    log "  ✗ Backend health (got $backend_status)"
    ((errors++))
  fi
  
  local eaos_status
  eaos_status=$(curl -sk -o /dev/null -w "%{http_code}" --resolve hq.neurecore.com:443:109.123.248.253 https://hq.neurecore.com/) || eaos_status="000"
  if [[ "$eaos_status" == "200" ]]; then
    log "  ✓ EAOS (hq.neurecore.com)"
  else
    log "  ✗ EAOS (got $eaos_status)"
    ((errors++))
  fi
  
  local admin_status
  admin_status=$(curl -sk -o /dev/null -w "%{http_code}" --resolve cc.neurecore.com:443:109.123.248.253 https://cc.neurecore.com/admin/login) || admin_status="000"
  if [[ "$admin_status" == "200" ]]; then
    log "  ✓ Admin (cc.neurecore.com)"
  else
    log "  ✗ Admin (got $admin_status)"
    ((errors++))
  fi
  
  local metrics_status
  metrics_status=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3003/api/metrics) || metrics_status="000"
  if [[ "$metrics_status" == "200" ]]; then
    log "  ✓ Metrics (/api/metrics)"
  else
    log "  ✗ Metrics (got $metrics_status)"
    ((errors++))
  fi
  
  if [[ $errors -gt 0 ]]; then
    die "Health checks failed: $errors error(s)"
  fi
  log "All health checks passed"
}

case "$DEPLOY_TARGET" in
  eaos)
    deploy_eaos
    ;;
  admin)
    deploy_admin
    ;;
  both)
    deploy_eaos
    deploy_admin
    ;;
  *)
    die "Usage: $0 [eaos|admin|both]"
    ;;
esac

reload_litespeed
health_check

log "Deploy complete!"
