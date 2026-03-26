#!/bin/bash
# Deploy frontends using pnpm (framer-motion already installed)

echo "=== [1/5] Building tenant frontend ($(date)) ==="
cd /var/www/neurecore-tenant
npm run build
echo "=== TENANT_BUILT ==="

echo ""
echo "=== [2/5] Copying tenant static assets ==="
cp -r .next/static .next/standalone/.next/static
if [ -d public ]; then cp -r public .next/standalone/public; fi

echo ""
echo "=== [3/5] Building admin frontend ==="
cd /var/www/neurecore-admin
npm run build
echo "=== ADMIN_BUILT ==="

echo ""
echo "=== [4/5] Copying admin static assets ==="
cp -r .next/static .next/standalone/.next/static
if [ -d public ]; then cp -r public .next/standalone/public; fi

echo ""
echo "=== [5/5] Starting PM2 processes ==="
pm2 delete neurecore-tenant 2>/dev/null || true
pm2 delete neurecore-admin 2>/dev/null || true

PORT=3001 pm2 start /var/www/neurecore-tenant/.next/standalone/server.js \
  --name neurecore-tenant -- --port 3001 --hostname 0.0.0.0

PORT=3002 pm2 start /var/www/neurecore-admin/.next/standalone/server.js \
  --name neurecore-admin -- --port 3002 --hostname 0.0.0.0

pm2 save

echo ""
echo "=== ALL_DONE $(date) ==="
