# Infrastructure — DNS Configuration

**Last Updated:** 2026-06-30
**Last Verified:** 2026-06-30 (dig commands)
**Audience:** Engineers managing DNS, domain records, or DNS cutover

---

## Current DNS State (2026-06-30)

All NeureCore domains now point to Contabo (109.123.248.253).

```bash
dig +short hq.neurecore.com    # → 109.123.248.253
dig +short cc.neurecore.com    # → 109.123.248.253
dig +short brain.neurecore.com # → 109.123.248.253
```

---

## DNS Records

| Domain | Type | Value | TTL | Purpose |
|---|---|---|---|---|
| hq.neurecore.com | A | 109.123.248.253 | 60s | EAOS tenant frontend |
| cc.neurecore.com | A | 109.123.248.253 | 60s | Admin console |
| brain.neurecore.com | A | 109.123.248.253 | 60s | API backend |

### Historical Note

Prior to One-Source Consolidation (2026-06-30), `hq.neurecore.com` and `cc.neurecore.com` pointed to Vercel edge (`cname.vercel-dns.com → 76.76.21.61`). DNS cutover was performed as part of the consolidation.

---

## DNS Provider

DNS is managed at the domain registrar or Cloudflare. To modify records:

1. Log into DNS provider
2. Navigate to DNS management for `neurecore.com`
3. Update A records for each subdomain
4. Wait for TTL propagation (60s with current TTL)

---

## DNS Cutover Procedure

If DNS needs to be reverted to Vercel or moved to a new host:

### Cutover to New Host

```bash
# 1. Get new IP address
ssh contabo 'curl -s ifconfig.me'

# 2. Login to DNS provider
# 3. Update A records:
#    hq.neurecore.com    A    109.123.248.253
#    cc.neurecore.com    A    109.123.248.253
#    brain.neurecore.com A    109.123.248.253

# 4. Wait and verify
sleep 120
dig +short hq.neurecore.com
dig +short cc.neurecore.com
dig +short brain.neurecore.com
```

### Cutover to Vercel (Rollback)

```bash
# 1. Login to DNS provider
# 2. Update A records back to Vercel:
#    hq.neurecore.com    CNAME cname.vercel-dns.com
#    cc.neurecore.com    CNAME cname.vercel-dns.com

# 3. Wait for TTL
sleep 120

# 4. Verify
dig +short hq.neurecore.com    # should return Vercel IP
```

---

## Subdomains

| Subdomain | Purpose | Status |
|---|---|---|
| hq.neurecore.com | EAOS tenant frontend | ✅ Active |
| cc.neurecore.com | Admin console | ✅ Active |
| brain.neurecore.com | API backend | ✅ Active |
| www.hq.neurecore.com | WWW alias for EAOS | Configured in vhost |
| www.cc.neurecore.com | WWW alias for Admin | Configured in vhost |

---

## DNS Verification Commands

```bash
# Full DNS lookup
dig hq.neurecore.com

# With trace
dig +short hq.neurecore.com

# MX records (if needed)
dig +short mx neurecore.com

# TXT records
dig +short txt neurecore.com

# Reverse DNS
dig -x 109.123.248.253
```

---

## TTL Considerations

- Current TTL: 60 seconds
- Lower TTL before any cutover to minimize downtime
- After cutover, TTL can be increased if desired

---

## Troubleshooting

### DNS Not Resolving

```bash
# Check local resolver cache
dig +short hq.neurecore.com

# Force fresh lookup
dig +short hq.neurecore.com @8.8.8.8
dig +short hq.neurecore.com @1.1.1.1
```

### Propagation Delay

DNS changes can take time to propagate globally despite low TTL. Use `dig` with `@8.8.8.8` (Google DNS) to bypass local resolver cache.

---

## Related Documents

- `01-infrastructure.md` — Server details
- `02-litespeed.md` — LiteSpeed vhost configuration
- `04-ssl.md` — SSL/TLS certificates
