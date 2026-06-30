# Infrastructure — SSL/TLS Certificates

**Last Updated:** 2026-06-30
**Last Verified:** 2026-06-30 (live inspection)
**Audience:** Engineers managing certificates, TLS, or HTTPS configuration

---

## Certificate Overview

All NeureCore domains use Let's Encrypt certificates managed by LiteSpeed.

| Domain | Certificate Path | Expiry | Status |
|---|---|---|---|
| hq.neurecore.com | `/etc/letsencrypt/live/hq.neurecore.com/` | Auto-renew | ✅ Valid |
| cc.neurecore.com | `/etc/letsencrypt/live/cc.neurecore.com/` | Auto-renew | ✅ Valid |
| brain.neurecore.com | `/etc/letsencrypt/live/brain.neurecore.com/` | Auto-renew | ✅ Valid |

---

## Certificate Files

Each certificate directory contains:

```
/etc/letsencrypt/live/{domain}/
├── privkey.pem          # Private key (keep secret!)
├── fullchain.pem        # Certificate + intermediates
├── cert.pem             # Certificate only
└── chain.pem            # Intermediate certificates
```

---

## Certificate Verification

### Check Certificate Expiry

```bash
ssh contabo 'openssl x509 -in /etc/letsencrypt/live/hq.neurecore.com/fullchain.pem -noout -dates'
```

### Check Certificate Details

```bash
ssh contabo 'openssl x509 -in /etc/letsencrypt/live/hq.neurecore.com/fullchain.pem -text -noout | head -30'
```

### Test HTTPS Connection

```bash
curl -sk https://hq.neurecore.com/ --resolve hq.neurecore.com:443:109.123.248.253 | head -5
```

---

## Certificate Renewal

### Automatic Renewal

LiteSpeed's ACME module handles automatic renewal before expiry.

### Manual Renewal (if needed)

```bash
ssh contabo 'certbot renew'
```

Or for specific domain:

```bash
ssh contabo 'certbot certonly --webroot -w /usr/local/lsws/Example/html -d hq.neurecore.com'
```

---

## Vhost SSL Configuration

Each vhost SSL section in `vhost.conf`:

```apache
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

### SSL Protocol Settings

- `sslProtocol 24` = TLS 1.2 + TLS 1.3 (modern, secure)
- `enableECDHE` = Elliptic Curve for forward secrecy
- `enableSpdy 15` = HTTP/2 + HTTP/3 support

---

## Certificate issuance for New Domains

### Option 1: LiteSpeed ACME (Preferred)

LiteSpeed Enterprise has built-in ACME support. Enable via WebAdmin console or:

```bash
ssh contabo 'certbot certonly --webroot -w /usr/local/lsws/Example/html -d newdomain.neurecore.com'
```

### Option 2: Certbot

```bash
ssh contabo 'certbot certonly --webroot -w /usr/local/lsws/Example/html \
  -d newdomain.neurecore.com -d www.newdomain.neurecore.com \
  --non-interactive --agree-tos -m admin@neurecore.com'
```

**Important:** Use `--webroot` against LiteSpeed's existing HTTP root. Do NOT use `--standalone` mode as it requires stopping LiteSpeed.

---

## Troubleshooting

### Certificate Not Found

**Symptom:** LiteSpeed fails to start or vhost returns SSL error.

**Fix:**
1. Verify cert exists: `ls /etc/letsencrypt/live/{domain}/`
2. Check vhost.conf paths are correct
3. Check file permissions (lsadm should own)

### Mixed Content Warnings

**Symptom:** Browser shows "mixed content" warnings.

**Cause:** Page loads over HTTPS but includes HTTP resources.

**Fix:** Ensure all resources (images, scripts, stylesheets) use HTTPS URLs.

### OCSP Stapling Error

**Symptom:** SSL handshake warnings in browser.

**Fix:** Verify `enableStapling 1` is set and restart LiteSpeed.

---

## Security Notes

- **Never expose privkey.pem** — It contains the private key
- **Certificates are world-readable** — Only private key needs protection
- **Renewal failures** — Monitor for expiry; Let's Encrypt renews at 90 days
- **Backup certificates** — They're in `/etc/letsencrypt/` which survives upgrades

---

## Related Documents

- `01-infrastructure.md` — Server details
- `02-litespeed.md` — LiteSpeed vhost configuration
- `03-dns.md` — DNS configuration
