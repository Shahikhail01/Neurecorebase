#!/bin/bash
# NeureCore Frontend Deployment Script
# Deploys both tenant (port 3001) and admin (port 3002) Next.js apps
set -e
LOG=/tmp/deploy-frontends.log
exec > >(tee -a $LOG) 2>&1

echo "=========================================="
echo "NeureCore Frontend Deployment - $(date)"
echo "=========================================="

# ---- TENANT FRONTEND ----
echo ""
echo ">>> [1/6] Installing framer-motion in tenant..."
cd /var/www/neurecore-tenant
npm install framer-motion --legacy-peer-deps --save
echo ">>> framer-motion installed"

echo ""
echo ">>> [2/6] Building tenant frontend..."
npm run build
echo ">>> TENANT_BUILD_COMPLETE"

# Copy static files into standalone
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public 2>/dev/null || true
echo ">>> Tenant static files copied"

# ---- ADMIN FRONTEND ----
echo ""
echo ">>> [3/6] Building admin frontend..."
cd /var/www/neurecore-admin
npm run build
echo ">>> ADMIN_BUILD_COMPLETE"

# Copy static files into standalone
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public 2>/dev/null || true
echo ">>> Admin static files copied"

# ---- PM2 ----
echo ""
echo ">>> [4/6] Starting frontends with PM2..."

# Stop existing processes if any
pm2 delete neurecore-tenant 2>/dev/null || true
pm2 delete neurecore-admin 2>/dev/null || true

# Start tenant on port 3001
PORT=3001 pm2 start /var/www/neurecore-tenant/.next/standalone/server.js \
  --name neurecore-tenant \
  --env production \
  -- --port 3001 --hostname 0.0.0.0

# Start admin on port 3002
PORT=3002 pm2 start /var/www/neurecore-admin/.next/standalone/server.js \
  --name neurecore-admin \
  --env production \
  -- --port 3002 --hostname 0.0.0.0

pm2 save
echo ">>> PM2 processes started"

# ---- LITESPEED VHOST CONFIG ----
echo ""
echo ">>> [5/6] Updating LiteSpeed vhost for app.shahisoft.store..."

cat > /usr/local/lsws/conf/vhosts/app.shahisoft.store/vhost.conf << 'VHCONF'
docRoot                   /home/shahisoft.store/app.shahisoft.store
vhDomain                  $VH_NAME
vhAliases                 www.$VH_NAME
adminEmails               asmin@shahisoft.store
enableGzip                1
enableIpGeo               1

index  {
  useServer               0
  indexFiles              index.php, index.html
}

errorlog $VH_ROOT/logs/shahisoft.store.error_log {
  useServer               0
  logLevel                WARN
  rollingSize             10M
}

accesslog $VH_ROOT/logs/shahisoft.store.access_log {
  useServer               0
  logFormat               "%h %l %u %t \"%r\" %>s %b \"%{Referer}i\" \"%{User-Agent}i\""
  logHeaders              5
  rollingSize             10M
  keepDays                10
  compressArchive         1
}

phpIniOverride  {

}

module cache {
 storagePath /usr/local/lsws/cachedata/$VH_NAME
}

scripthandler  {
  add                     lsapi:shahi79574879 php
}

extprocessor shahi79574879 {
  type                    lsapi
  address                 UDS://tmp/lshttpd/shahi79574879.sock
  maxConns                10
  env                     LSAPI_CHILDREN=10
  initTimeout             60
  retryTimeout            0
  persistConn             1
  pcKeepAliveTimeout      1
  respBuffer              0
  autoStart               1
  path                    /usr/local/lsws/lsphp83/bin/lsphp
  extUser                 shahi7957
  extGroup                shahi7957
  memSoftLimit            1024M
  memHardLimit            1024M
  procSoftLimit           400
  procHardLimit           500
}

rewrite  {
  enable                  1
  autoLoadHtaccess        1
}

context /.well-known/acme-challenge {
  location                /home/shahisoft.store/app.shahisoft.store/.well-known/acme-challenge
  allowBrowse             1

  rewrite  {
    enable                  0
  }
  addDefaultCharset       off

  phpIniOverride  {

  }
}


vhssl  {
  keyFile                 /etc/letsencrypt/live/app.shahisoft.store/privkey.pem
  certFile                /etc/letsencrypt/live/app.shahisoft.store/fullchain.pem
  certChain               1
  sslProtocol             24
  enableECDHE             1
  renegProtection         1
  sslSessionCache         1
  enableSpdy              15
  enableStapling           1
  ocspRespMaxAge           86400
}

extprocessor tenant_backend {
  type                    proxy
  address                 127.0.0.1:3001
  maxConns                200
  initTimeout             60
  retryTimeout            0
  respBuffer              0
}

extprocessor admin_backend {
  type                    proxy
  address                 127.0.0.1:3002
  maxConns                200
  initTimeout             60
  retryTimeout            0
  respBuffer              0
}

context /admin {
  type                    proxy
  handler                 admin_backend
  addDefaultCharset       off
}

context / {
  type                    proxy
  handler                 tenant_backend
  addDefaultCharset       off
}
VHCONF

echo ">>> LiteSpeed vhost updated"

# ---- RESTART LITESPEED ----
echo ""
echo ">>> [6/6] Restarting LiteSpeed..."
/usr/local/lsws/bin/lswsctrl restart
sleep 3
echo ">>> LiteSpeed restarted"

# ---- HEALTH CHECK ----
echo ""
echo ">>> Health Checks..."
sleep 2
curl -s -o /dev/null -w "Tenant (3001): HTTP %{http_code}\n" http://127.0.0.1:3001 || echo "Tenant not ready yet"
curl -s -o /dev/null -w "Admin (3002): HTTP %{http_code}\n" http://127.0.0.1:3002/admin || echo "Admin not ready yet"

echo ""
echo "=========================================="
echo "DEPLOYMENT COMPLETE - $(date)"
echo "Tenant: https://app.shahisoft.store"
echo "Admin:  https://app.shahisoft.store/admin"
echo "=========================================="
