# Backend — Database (Prisma/Neon PostgreSQL)

**Last Updated:** 2026-06-30
**Last Verified:** 2026-06-30
**Audience:** Backend engineers, database administrators

---

## Overview

- **ORM:** Prisma 5.22.0
- **Database:** Neon PostgreSQL (cloud-hosted)
- **Schema:** `/opt/neurecore/backend/backend/prisma/schema.prisma`
- **Migrations:** `/opt/neurecore/backend/backend/prisma/migrations/`

---

## Connection

### Neon PostgreSQL

```
ep-summer-pond-adpkqy1m-pooler.c-2.us-east-1.aws.neon.tech
```

### Connection URLs

| Variable | Purpose | Type |
|---|---|---|
| `DATABASE_URL` | Pooled connections | Neon |
| `DATABASE_URL_UNPOOLED` | Direct connections (migrations) | Neon |
| `POSTGRES_URL` | Alternative | Neon |
| `POSTGRES_PRISMA_URL` | Prisma direct | Neon |

---

## Prisma Schema

Key models in `schema.prisma`:

### User & Auth

```prisma
enum UserRole {
  SUPER_ADMIN
  ADMIN
  OWNER
  MANAGER
  AGENT
  VIEWER
}

model User {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String
  firstName     String?
  lastName      String?
  role          UserRole  @default(AGENT)
  tenantId      String?
  tenant        Tenant?   @relation(fields: [tenantId], references: [id])
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

### Tenant

```prisma
model Tenant {
  id          String   @id @default(uuid())
  name        String
  slug        String   @unique
  tierId      String?
  tier        Tier?    @relation(fields: [tierId], references: [id])
  users      User[]
  agents     Agent[]
  departments Department[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### Tier (Pricing)

```prisma
model Tier {
  id                  String   @id @default(uuid())
  name                String
  slug                String   @unique
  maxUsers            Int
  maxAgents           Int
  maxDepartments      Int
  aiCreditsMonthly    Int
  priceMonthly        Float
  tenants            Tenant[]
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
}
```

### Agent

```prisma
model Agent {
  id            String   @id @default(uuid())
  name          String
  description   String?
  tenantId      String
  tenant        Tenant   @relation(fields: [tenantId], references: [id])
  model         String?
  instructions  String?
  permissions   Json?
  status        AgentStatus @default(ACTIVE)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

---

## Prisma Commands

```bash
cd /opt/neurecore/backend/backend

# Load env
export $(grep -v "^#" .env | grep -E "DATABASE_URL|DATABASE_URL_UNPOOLED" | xargs)

# Generate client (required after schema changes)
./node_modules/.bin/prisma generate

# Check migration status
./node_modules/.bin/prisma migrate status

# Apply pending migrations
./node_modules/.bin/prisma migrate deploy

# Create new migration (local only)
./node_modules/.bin/prisma migrate dev --name add_new_field

# Reset database (DANGER - local only)
./node_modules/.bin/prisma migrate reset

# View database schema
./node_modules/.bin/prisma db pull
```

---

## Migration Workflow

### 1. Edit Schema

Edit `prisma/schema.prisma` to add/modify models.

### 2. Create Migration (Local)

```bash
./node_modules/.bin/prisma migrate dev --name describe_change
```

### 3. Sync to Contabo

Rsync the migration folder:
```bash
rsync -avz prisma/migrations/<new_migration>/ contabo:/opt/neurecore/backend/backend/prisma/migrations/
```

Also sync schema.prisma:
```bash
rsync -avz prisma/schema.prisma contabo:/opt/neurecore/backend/backend/prisma/
```

### 4. Apply on Contabo

```bash
ssh contabo 'cd /opt/neurecore/backend/backend && \
  export $(grep -v "^#" .env | grep -E "DATABASE_URL|DATABASE_URL_UNPOOLED" | xargs) && \
  ./node_modules/.bin/prisma migrate deploy'
```

### 5. Generate Client on Contabo

```bash
ssh contabo 'cd /opt/neurecore/backend/backend && \
  export $(grep -v "^#" .env | grep -E "DATABASE_URL|DATABASE_URL_UNPOOLED" | xargs) && \
  ./node_modules/.bin/prisma generate'
```

### 6. Rebuild Backend

```bash
ssh contabo 'cd /opt/neurecore/backend/backend && \
  ./node_modules/.bin/nest build && \
  pm2 restart neurecore-backend'
```

---

## Important Notes

### DO NOT

- ❌ Run `prisma migrate reset` in production
- ❌ Upload `node_modules/` from local (use Contabo's)
- ❌ Skip `prisma generate` after schema changes
- ❌ Apply migration before backing up
- ❌ Use `git pull` on Contabo (use rsync)

### DO

- ✅ Always create migrations locally with `prisma migrate dev`
- ✅ Always sync migrations via rsync
- ✅ Always generate client on Contabo after schema change
- ✅ Always restart PM2 after rebuild

---

## Known Issues

### Missing Column: `defaultBudgetPerDay`

The `Tier` model references `defaultBudgetPerDay` column which doesn't exist in the database. Planned migration pending.

---

## Related Documents

- `01-backend.md` — Backend architecture
- `02-api.md` — API contracts
- `../deployment/02-contabo-operations.md` — Contabo procedures
