# Infrastructure — LiteSpeed Configuration

**Last Updated:** 2026-06-30
**Last Verified:** 2026-06-30 (live inspection)
**Audience:** Engineers configuring reverse proxy, vhosts, or URL routing

---

## Overview

LiteSpeed Web Server acts as the reverse proxy on Contabo, terminating TLS and routing requests to backend services based on hostname.

```
Internet → LiteSpeed (443) → [Vhost Routing] → Backend Services
                                           ├── hq.neurecore.com → 127.0.0.1:3011
                                           ├── cc.neurecore.com → 127.0.0.1:3020
                                           └── brain.neurecore.com → 127.0.0.1:3003
```

---

## Vhost Configuration

### Vhost Directory
```
/usr/local/lsws/conf/vhosts/
```

### NeureCore Vhosts

| Vhost | Document Root | Backend Port | Purpose |
|---|---|---|---|
| `hq.neurecore.com/` | `/home/neurecore.com/hq/html` | 3011 | EAOS frontend |
| `cc.neurecore.com/` | `/home/neurecore.com/cc/html` | 3020 | Admin frontend |
| `brain.neurecore.com/` | — | 3003 | API backend |

---

## Vhost Configuration Files

### hq.neurecore.com (EAOS)

```apache
docRoot                   /home/neurecore.com/hq/html
vhDomain                  $VH_NAME
vhAliases                 www.$VH_NAME
adminEmails               admin@neurecore.com
enableGzip                1

index  {
  useServer               0
}

errorlog $VH_ROOT/logs/$VH_NAME.error_log { useServer 0; logLevel WARN; rollingSize 10M }
accesslog $VH_ROOT/logs/$VH_NAME.access_log { useServer 0; rollingSize 10M; keepDays 10 }

extprocessor neurecore_eaos {
  type                    proxy
  address                 127.0.0.1:3011
  maxConns                200
  initTimeout             60
  retryTimeout            0
  respBuffer              0
}

rewrite  {
  enable                  1
  autoLoadHtaccess        0
  rules                   <<<END_RULES
RewriteCond %{REQUEST_URI} ^/\.well-known/acme-challenge/
RewriteRule .* - [L]
RewriteRule ^(.*)$ http://neurecore_eaos/$1 [P,L]
END_RULES
}

context /.well-known/acme-challenge {
  location                /usr/local/lsws/Example/html/.well-known/acme-challenge
  allowBrowse             1
  rewrite  { enable 0 }
  addDefaultCharset       off
  phpIniOverride  { }
}

context / {
  type                    proxy
  handler                 neurecore_eaos
  addDefaultCharset       off
}

vhssl {
  keyFile                 /etc/letsencrypt/live/hq.neurecore.com/privkey.pem
  certFile                /etc/letsencrypt/live/hq.neurecore.com/fullchain.pem
  certChain               1
  sslProtocol             24
  enableECDHE             1
  renegProtection         1
  sslSessionCache         1
  enableSpdy              15
  enableStapling          1
  ocspRespMaxAge          86400
}
```

### cc.neurecore.com (Admin)

Key difference: Uses rewrite rules to map Vercel-style URLs (e.g., `/login` → `/admin/login`):

```apache
# 19 specific rewrite rules + 1 catch-all [P,L] proxy
RewriteRule ^/?$                          /admin                              [L]
RewriteRule ^/?login$                     /admin/login                        [L]
RewriteRule ^/?agents(/.*)?$              /admin/agents$1                     [L]
RewriteRule ^/?agent-templates(/.*)?$     /admin/agent-templates$1            [L]
# ... (19 total rewrites matching Vercel configuration)
RewriteRule ^(.*)$ http://neurecore_admin/$1 [P,L]
```

**Critical:** The catch-all `RewriteRule ^(.*)$ http://neurecore_admin/$1 [P,L]` is required. Without it, `[L]` rules stop before proxying to the extprocessor, resulting in 404s.

---

## LiteSpeed Management

### Restart LiteSpeed

```bash
ssh contabo '/usr/local/lsws/bin/lswsctrl restart'
sleep 5
```

### Check LiteSpeed Status

```bash
ssh contabo '/usr/local/lsws/bin/lswsctrl fullstatus'
```

### Graceful Reload (no downtime)

```bash
ssh contabo '/usr/local/lsws/bin/lswsctrl reload'
```

---

## ACME/Let's Encrypt

Certificates are managed via LiteSpeed's built-in ACME module or certbot.

### Certificate Locations

```
/etc/letsencrypt/live/
├── hq.neurecore.com/
│   ├── privkey.pem
│   ├── fullchain.pem
│   └── ...
├── cc.neurecore.com/
│   └── ...
└── brain.neurecore.com/
    └── ...
```

### Certificate Renewal

- LiteSpeed auto-renews via ACME
- Manual renewal if needed:
  ```bash
  ssh contabo 'certbot renew'
  ```

### Verify Certificates

```bash
ssh contabo 'ls -la /etc/letsencrypt/live/hq.neurecore.com/'
ssh contabo 'openssl x509 -in /etc/letsencrypt/live/hq.neurecore.com/fullchain.pem -text -noout | head -20'
```

---

## Troubleshooting

### Vhost Not Routing

1. Check vhost.conf exists: `ls /usr/local/lsws/conf/vhosts/hq.neurecore.com/vhost.conf`
2. Check LiteSpeed restarted without error
3. Check backend service is running on target port
4. Test locally: `curl http://127.0.0.1:3011/`

### 404 on Proxy

**Symptom:** Rewrites work but proxy returns 404.

**Cause:** Missing `[P,L]` catch-all in rewrite rules.

**Fix:** Add `RewriteRule ^(.*)$ http://neurecore_eaos/$1 [P,L]` at end of rewrite rules.

### TLS Certificate Error

**Symptom:** Browser shows certificate error.

**Fix:**
1. Verify cert exists: `ls /etc/letsencrypt/live/{domain}/`
2. Check vhost.conf paths are correct
3. Restart LiteSpeed

---

## Related Documents

- `01-infrastructure.md` — Server details
- `03-dns.md` — DNS configuration
- `04-ssl.md` — SSL/TLS certificates
