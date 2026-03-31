# NeureCore — Contabo Migration Plan

## Moving from Local Docker + Neon/Upstash to Contabo-Managed PostgreSQL + Redis

**Date:** 2026-03-30  
**Status:** Draft  
**Target:** Production deployment on Contabo (Ubuntu 24.04 LTS)

---

## 1. Current State Assessment

### 1.1 Contabo Server Specifications

| Resource       | Value                                    |
| -------------- | ---------------------------------------- |
| **OS**         | Ubuntu 24.04.3 LTS (Noble Numbat)        |
| **RAM**        | 11 GiB (4.8 GiB used, 6.9 GiB available) |
| **Disk**       | 96 GiB (55 GiB used, 42 GiB available)   |
| **PostgreSQL** | 16.13 (Ubuntu package) ✅ Running        |
| **Redis**      | 7.0.15 ✅ Running                        |

### 1.2 Existing Contabo Databases

| Database         | Owner       | Tables | Purpose                         |
| ---------------- | ----------- | ------ | ------------------------------- |
| `neurecore_prod` | `neurecore` | 29     | Production (from prod instance) |
| `neurecore_dev`  | `postgres`  | 36     | Development (from local Docker) |
| `ecoearthshop`   | `ecoearth`  | —      | Other project (leave untouched) |

**⚠️ Issue:** `neurecore_prod` is owned by `postgres` (superuser) while `neurecore_dev` uses proper `neurecore` user. This violates least-privilege principles.

### 1.3 Existing PostgreSQL Users

| User        | Privileges                              |
| ----------- | --------------------------------------- |
| `postgres`  | Superuser — **not for application use** |
| `neurecore` | Regular user — **correct for app**      |
| `ecoearth`  | Regular user — other project            |

### 1.4 Current Security Posture

| Area                  | Status                                 | Risk                                     |
| --------------------- | -------------------------------------- | ---------------------------------------- |
| **PostgreSQL SSL**    | ✅ Enabled (self-signed snakeoil cert) | Low — but use proper cert in prod        |
| **Redis Password**    | ❌ No password (`requirepass` empty)   | **HIGH**                                 |
| **Redis Binding**     | ✅ Localhost only (`127.0.0.1`)        | Low                                      |
| **Redis Persistence** | ⚠️ RDB only, no AOF                    | Medium — data loss risk                  |
| **pg_hba.conf**       | ⚠️ `host all all 0.0.0.0/0 md5`        | **HIGH** — too permissive                |
| **Firewall**          | ✅ Port 5432 restricted to all         | Medium — should be app-specific IPs only |
| **Neon Credentials**  | ⚠️ Exposed in `.env.production`        | **CRITICAL** — revoke and rotate         |

### 1.5 Prisma Schema Overview

**36 models** covering: agents, tasks, workflows, routines, goals, projects, departments, users, tenants, sessions, refresh_tokens, api_keys, oauth_tokens, memory_entries, audit_logs, invoices, billing_events, cost_records, budget_policies, quota_usage, analytics_models, analytics_features, crm_connectors, tool_integrations, notifications, approval_requests, execution_logs, agent_templates, department_templates, governance_rules, routine_runs, routine_triggers, tenant_metrics, tenant_limits

**Key security model:** Multi-tenancy with `tenantId` on all tenant-scoped tables.

---

## 2. Migration Architecture

### 2.1 Target Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Contabo VPS (11GB RAM)                    │
│                                                              │
│  ┌──────────────────┐     ┌──────────────────────────────┐  │
│  │  PostgreSQL 16    │     │  Redis 7.0                    │  │
│  │  neurecore_prod   │     │  Auth sessions, cache,        │  │
│  │  (main + vectors)│     │  token blacklist              │  │
│  │  SSL + md5 auth   │     │  Password + AOF enabled      │  │
│  └──────────────────┘     └──────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Backend (NestJS) — :3000                            │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Neon (dev branches only)
                              ▼
```

### 2.2 Contabo Resources Allocation

| Service      | RAM Allocation | Notes                           |
| ------------ | -------------- | ------------------------------- |
| PostgreSQL   | ~2 GiB         | Shared buffers + working memory |
| Redis        | ~1 GiB         | Maxmemory + AOF buffer          |
| OS + Other   | ~2 GiB         | Kernel, SSH, monitoring         |
| **Headroom** | ~6 GiB         | For backend, agents, spikes     |

---

## 3. Security Hardening Plan

### 3.1 PostgreSQL Hardening

#### 3.1.1 User & Permission Setup

```bash
# Create dedicated application user (already exists: neurecore)
# Ensure neurecore user has CONNECT + CREATE privileges on neurecore_prod only

sudo -u postgres psql -c "GRANT CONNECT ON DATABASE neurecore_prod TO neurecore;"
sudo -u postgres psql -d neurecore_prod -c "GRANT USAGE ON SCHEMA public TO neurecore;"
sudo -u postgres psql -d neurecore_prod -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO neurecore;"
sudo -u postgres psql -d neurecore_prod -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO neurecore;"
```

#### 3.1.2 pg_hba.conf — Restrictive Rules

Replace the overly permissive `host all all 0.0.0.0/0 md5` rule:

```conf
# Local socket — peer auth for postgres admin
local   all             postgres                                peer

# Local connections — md5 for app user
local   neurecore_prod  neurecore                              md5
host    neurecore_prod  neurecore      127.0.0.1/32            md5
host    neurecore_prod  neurecore      ::1/128                 scram-sha-256

# IPv4 local connections for other users
host    all             all             127.0.0.1/32            scram-sha-256
host    all             all             ::1/128                 scram-sha-256

# PRODUCTION: Add your specific backend IP ranges
# Example: host neurecore_prod neurecore 10.0.0.0/8 md5
```

#### 3.1.3 PostgreSQL Config Tuning (postgresql.conf)

```bash
# SSL Configuration — use proper certificates
ssl = on
ssl_cert_file = '/etc/ssl/certs/ssl-cert-snakeoil.pem'  # Replace with Let's Encrypt in prod
ssl_key_file = '/etc/ssl/private/ssl-cert-snakeoil.key'

# Memory — for 11GB server, allocate ~2GB to PostgreSQL
shared_buffers = 512MB
effective_cache_size = 2GB
work_mem = 32MB
maintenance_work_mem = 128MB

# Connections
max_connections = 100
superuser_reserved_connections = 3

# Write Ahead Log
wal_level = replica
max_wal_senders = 3
archive_mode = on

# Logging — capture slow queries for security audit
log_destination = 'csvlog'
logging_collector = on
log_min_duration_statement = 1000  # Log queries > 1s
log_connections = on
log_disconnections = on

# Statement timeout
statement_timeout = 30s

# Row security — enforce tenant isolation
row_security = on
```

### 3.2 Redis Hardening

#### 3.2.1 Enable Password Authentication

```bash
# Generate strong password
openssl rand -base64 32

# Apply via CLI (persistently via config)
redis-cli config set requirepass "YOUR_STRONG_PASSWORD_HERE"
redis-cli config rewrite  # Save to /etc/redis/redis.conf
```

#### 3.2.2 Enable AOF Persistence

```bash
redis-cli config set appendonly yes
redis-cli config set appendfsync everysec
redis-cli config rewrite
```

#### 3.2.3 Redis Config Hardening

```conf
# /etc/redis/redis.conf — Key changes
bind 127.0.0.1                    # Already correct
port 6379
protected-mode yes               # Already correct
requirepass YOUR_STRONG_PASSWORD  # ADD THIS
appendonly yes                    # ADD THIS
appendfsync everysec             # ADD THIS

# Memory management
maxmemory 1gb
maxmemory-policy allkeys-lru

# Disable dangerous commands
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command DEBUG ""
rename-command SHUTDOWN ""

# Slow log for security monitoring
slowlog-log-slower-than 1000
slowlog-max-len 128
```

### 3.3 Firewall — Restrict PostgreSQL Access

```bash
# Remove broad 5432 rule, replace with specific IPs
# Contabo server — only allow from your specific backend IP(s)
sudo ufw delete allow 5432/tcp
sudo ufw allow from YOUR_BACKEND_IP to any port 5432 proto tcp
# For local development, allow your home IP:
sudo ufw allow from YOUR_HOME_IP to any port 5432 proto tcp
sudo ufw reload
```

### 3.4 Credential Rotation

**CRITICAL — Do before production migration:**

1. **Rotate Neon credentials** — The current `.env.production` contains live Neon tokens. Since Contabo will replace Neon for prod, **revoke these immediately after migration**.
2. **Generate new Redis password** — Don't use the server's current Redis without a password.
3. **Generate strong JWT secret** — Current `JWT_SECRET` in `.env.production` is weak (`dev-super-secret-change-in-production-min-32-chars`).

---

## 4. Migration Steps

### Phase 1: Prepare Contabo (Security First)

- [ ] **4.1** Set Redis password and enable AOF persistence
- [ ] **4.2** Harden `pg_hba.conf` — remove `0.0.0.0/0` rule
- [ ] **4.3** Restrict firewall — limit PostgreSQL port to known IPs
- [ ] **4.4** Transfer ownership of `neurecore_prod` tables to `neurecore` user
- [ ] **4.5** Create `neurecore` role with proper permissions (no superuser)
- [ ] **4.6** Verify Contabo PostgreSQL SSL connectivity
- [ ] **4.7** Enable PostgreSQL WAL archiving + point-in-time recovery

### Phase 2: Database Migration

- [ ] **4.8** Backup Contabo `neurecore_prod` (existing data)
- [ ] **4.9** Compare schema between Docker (36 tables) vs Contabo (29 tables) — identify missing tables
- [ ] **4.10** Export data from Docker-based `neurecore_dev` (36 tables)
- [ ] **4.11** Import to Contabo `neurecore_prod`
- [ ] **4.12** Run Prisma migrations on Contabo to ensure schema consistency
- [ ] **4.13** Verify all 36 tables exist on Contabo with correct schemas
- [ ] **4.14** Validate data integrity (row counts, key relationships)
- [ ] **4.15** Verify all tenantId relationships and row-level security
- [ ] **4.16** Drop `neurecore_dev` database from Contabo — merge complete
- [ ] **4.17** Backup verification — test restore from pg_dump

### Phase 3: Backend Configuration

- [ ] **4.17** Create Contabo-specific `.env` with new connection strings
- [ ] **4.18** Update `RedisService` to use Contabo Redis with password
- [ ] **4.19** Configure PgBouncer (optional) for connection pooling if needed
- [ ] **4.20** Test local backend connection to Contabo PostgreSQL + Redis
- [ ] **4.21** Run backend test suite against Contabo database

### Phase 4: Neon — Development Branching Only

- [ ] **4.22** Create new Neon project for development branching only
- [ ] **4.23** Update `.env.development` with new Neon URL
- [ ] **4.24** Document branching workflow: `neurecore/neurecore` → Neon branch for dev experiments

### Phase 5: Production Cutover

- [ ] **4.25** Deploy updated backend to Contabo
- [ ] **4.26** Point DNS/backend to Contabo PostgreSQL + Redis
- [ ] **4.27** Monitor for 24-48 hours — connections, queries, errors
- [ ] **4.28** Revoke old Neon credentials (from `.env.production`)

### Phase 6: Local Docker Cleanup (After Contabo is Fully Tested)

- [ ] **4.29** Stop local Docker PostgreSQL and Redis containers
- [ ] **4.30** Remove `backend/docker-compose.yml` local service definitions (keep file for reference)
- [ ] **4.31** Update `backend/DEPLOY.md` — remove Docker Compose instructions
- [ ] **4.32** Update `.gitignore` to confirm no `.env` files are committed
- [ ] **4.33** Update `memory-bank/activeContext.md` — reflect Contabo-only infra

---

## 5. Implementation Commands

### 5.1 Redis Hardening (Execute on Contabo)

```bash
# Step 1: Set Redis password
ssh contabo 'redis-cli config set requirepass "$(openssl rand -base64 32)"'
ssh contabo 'redis-cli config rewrite'

# Step 2: Enable AOF
ssh contabo 'redis-cli config set appendonly yes'
ssh contabo 'redis-cli config set appendfsync everysec'
ssh contabo 'redis-cli config rewrite'

# Step 3: Verify
ssh contabo 'redis-cli ping'  # Should require auth
```

### 5.2 PostgreSQL User Fix (Execute on Contabo)

```bash
# Fix neurecore_prod ownership
ssh contabo 'sudo -u postgres psql -d neurecore_prod -c "REASSIGN OWNED BY postgres TO neurecore;"'
ssh contabo 'sudo -u postgres psql -d neurecore_prod -c "GRANT ALL ON SCHEMA public TO neurecore;"'

# Create proper role
ssh contabo 'sudo -u postgres psql -c "CREATE ROLE neurecore_app LOGIN PASSWORD '\''$(openssl rand -base64 24)'\'' NOSUPERUSER NOCREATEDB NOCREATEROLE;"'
```

### 5.3 Database Merge Commands (neurecore_dev → neurecore_prod)

```bash
# Step 1: Export data from neurecore_dev (local Docker)
docker exec neurecore_postgres pg_dump -U neurecore neurecore_dev > neurecore_dev_backup.sql

# Step 2: Drop existing neurecore_prod tables (CAUTION: backup first!)
ssh contabo 'sudo -u postgres psql -d neurecore_prod -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"'

# Step 3: Import data into Contabo neurecore_prod
cat neurecore_dev_backup.sql | ssh contabo 'sudo -u postgres psql -d neurecore_prod'

# Step 4: Verify row counts match
ssh contabo 'sudo -u postgres psql -d neurecore_prod -c "SELECT count(*) FROM tenants;"'
ssh contabo 'sudo -u postgres psql -d neurecore_prod -c "SELECT count(*) FROM users;"'

# Step 5: After verification — drop neurecore_dev from Contabo
ssh contabo 'sudo -u postgres dropdb neurecore_dev'
```

### 5.5 Local Docker Cleanup (After Contabo is Fully Tested)

```bash
# Stop containers
cd backend && docker compose down

# Remove volumes (CAUTION: this destroys local data — ensure Contabo migration is verified first)
docker compose down -v

# Remove docker-compose.yml references from DEPLOY.md and docs
```

### 5.3 Backend .env Template (Contabo)

```env
# ─── Database (PostgreSQL - Contabo) ──────────────────────────────────────
DATABASE_URL=postgresql://neurecore:YOUR_PASSWORD@127.0.0.1:5432/neurecore_prod?sslmode=require
DATABASE_URL_UNPOOLED=postgresql://neurecore:YOUR_PASSWORD@127.0.0.1:5432/neurecore_prod?sslmode=require

# ─── Cache (Redis - Contabo) ───────────────────────────────────────────────
REDIS_URL=redis://:YOUR_REDIS_PASSWORD@127.0.0.1:6379/0

# ─── JWT ───────────────────────────────────────────────────────────────────
JWT_SECRET=$(openssl rand -base64 64)

# ─── Development Branching (Neon only) ─────────────────────────────────────
# DATABASE_URL_DEV=postgresql://neondb_owner:TOKEN@ep-xxx.neon.tech/neondb?sslmode=require
```

---

## 6. Monitoring & Maintenance

### 6.1 Recommended Monitors

| Metric                 | Alert Threshold | Tool                          |
| ---------------------- | --------------- | ----------------------------- |
| PostgreSQL connections | > 80/100        | Built-in                      |
| Redis memory           | > 900MB / 1GB   | Built-in                      |
| Slow queries           | > 1 second      | PostgreSQL `log_min_duration` |
| Failed auth attempts   | > 5/min         | PostgreSQL log parsing        |
| Disk usage             | > 80%           | `df -h` cron                  |

### 6.2 Backup Strategy

- **PostgreSQL:** Daily `pg_dump` via cron + WAL archiving for PITR
- **Redis:** AOF + periodic `BGSAVE` snapshots
- **Off-site:** Backup to separate storage or S3-compatible bucket

### 6.3 Update Cadence

| Task                     | Frequency                    |
| ------------------------ | ---------------------------- |
| Ubuntu security patches  | Weekly (unattended-upgrades) |
| PostgreSQL minor updates | Monthly                      |
| Redis updates            | Monthly                      |
| Password rotation        | Quarterly                    |
| Credential audit         | Bi-annually                  |

---

## 7. Risk Assessment

| Risk                                    | Likelihood   | Impact       | Mitigation                                          |
| --------------------------------------- | ------------ | ------------ | --------------------------------------------------- |
| Data loss during migration              | Low          | **Critical** | Full backup before migration                        |
| Downtime during cutover                 | Medium       | High         | Blue-green deployment, rollback plan                |
| Redis password loss                     | Low          | **Critical** | Store in password manager                           |
| PostgreSQL over-connection              | Medium       | Medium       | PgBouncer pooling, max_connections cap              |
| Tenant data leakage                     | **Critical** | **Critical** | Row-level security + tenantId enforcement in Prisma |
| Credential exposure in git              | Medium       | **Critical** | `.gitignore` .env, use secret manager               |
| Neon tokens still active post-migration | Low          | High         | Revoke immediately after cutover                    |

---

## 8. Files to Modify

| File                                                | Change                                       |
| --------------------------------------------------- | -------------------------------------------- |
| `backend/src/infrastructure/cache/redis.service.ts` | Add Contabo Redis password support           |
| `backend/.env.production`                           | Replace Neon with Contabo connection strings |
| `backend/docker-compose.yml`                        | Remove local Postgres/Redis services         |
| `backend/DEPLOY.md`                                 | Update deployment docs for Contabo           |
| Contabo `/etc/postgresql/16/main/pg_hba.conf`       | Restrictive access rules                     |
| Contabo `/etc/redis/redis.conf`                     | Password + AOF + disabled commands           |
| Contabo `/etc/postgresql/16/main/postgresql.conf`   | Tuning + WAL + logging                       |
| `memory-bank/activeContext.md`                      | Update infra status post-migration           |

---

## 9. Verification Checklist

After implementation, verify:

- [ ] `neurecore_prod` owned by `neurecore` user (not `postgres`)
- [ ] Redis requires password (`redis-cli ping` → ERR AUTH)
- [ ] Redis AOF file exists at `/var/lib/redis/appendonly.aof`
- [ ] `pg_hba.conf` has no `0.0.0.0/0` entries
- [ ] Firewall only allows known IPs to port 5432
- [ ] Backend connects via `127.0.0.1` with SSL
- [ ] All 36 Prisma tables present in Contabo `neurecore_prod`
- [ ] Tenant isolation queries include `tenantId` filter
- [ ] JWT secret is strong (64+ chars)
- [ ] Neon credentials revoked from Neon dashboard
- [ ] Backup restoration tested
