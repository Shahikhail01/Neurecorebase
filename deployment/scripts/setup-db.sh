#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# Database Setup Script for NeureCore
# ═══════════════════════════════════════════════════════════════════════════
# Sets up the database for different environments.
# Supports PostgreSQL (Neon, Vercel Postgres, Supabase)
#
# Usage:
#   ./setup-db.sh development    # Setup development database
#   ./setup-db.sh staging        # Setup staging database
#   ./setup-db.sh production     # Setup production database

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_ROOT/backend"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Environment configuration
case "${1:-development}" in
    development)
        ENV_FILE="$SCRIPT_DIR/../environments/development.env"
        ;;
    staging)
        ENV_FILE="$SCRIPT_DIR/../environments/staging.env"
        ;;
    production)
        ENV_FILE="$SCRIPT_DIR/../environments/production.env"
        ;;
    *)
        log_error "Invalid environment: $1"
        echo "Usage: $0 {development|staging|production}"
        exit 1
        ;;
esac

# Load environment
if [ -f "$ENV_FILE" ]; then
    log_info "Loading environment from $ENV_FILE"
    set -a
    source "$ENV_FILE"
    set +a
else
    log_warn "Environment file not found: $ENV_FILE"
    log_info "Using existing DATABASE_URL if set"
fi

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    if ! command -v psql >/dev/null 2>&1; then
        log_error "psql is not installed"
        exit 1
    fi
    
    if [ -z "${DATABASE_URL:-}" ]; then
        log_error "DATABASE_URL is not set"
        exit 1
    fi
    
    log_info "Prerequisites check passed"
}

# Create database
create_database() {
    log_info "Creating database..."
    
    # Extract db name from connection string
    DB_NAME=$(echo "$DATABASE_URL" | sed -E 's/.*\/([^?]+).*/\1/')
    
    # Check if database exists
    if psql "$DATABASE_URL" -c "SELECT 1" >/dev/null 2>&1; then
        log_info "Database already exists: $DB_NAME"
    else
        log_info "Creating database: $DB_NAME"
        # Create database
        psql "$DATABASE_URL" -c "CREATE DATABASE $DB_NAME" || true
    fi
}

# Run migrations
run_migrations() {
    log_info "Running migrations..."
    
    cd "$BACKEND_DIR"
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        pnpm install --frozen-lockfile
    fi
    
    # Generate Prisma client
    pnpm prisma generate
    
    # Run migrations
    pnpm prisma migrate deploy
    
    log_info "Migrations completed"
}

# Seed database
seed_database() {
    log_info "Seeding database..."
    
    cd "$BACKEND_DIR"
    
    # Run seeds
    pnpm prisma db seed || log_warn "Seeding not configured"
    
    log_info "Database seeded"
}

# Verify setup
verify_setup() {
    log_info "Verifying setup..."
    
    cd "$BACKEND_DIR"
    
    # Check tables
    TABLE_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'")
    log_info "Tables created: $TABLE_COUNT"
    
    # Check connection
    if psql "$DATABASE_URL" -c "SELECT 1" >/dev/null 2>&1; then
        log_info "Database connection: OK"
    else
        log_error "Database connection failed"
        exit 1
    fi
}

# Main
main() {
    local env=${1:-development}
    
    log_info "Setting up database for $env environment..."
    
    check_prerequisites
    create_database
    run_migrations
    seed_database
    verify_setup
    
    log_info "Database setup completed successfully!"
}

main "$@"
