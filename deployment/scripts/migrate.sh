#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# Database Migration Script for NeureCore
# ═══════════════════════════════════════════════════════════════════════════
# Manages database migrations for different environments.
# Supports PostgreSQL (Neon, Vercel Postgres, Supabase)
#
# Usage:
#   ./migrate.sh status           # Check migration status
#   ./migrate.sh up               # Run pending migrations
#   ./migrate.sh down             # Rollback last migration
#   ./migrate.sh reset             # Reset database (dangerous!)
#   ./migrate.sh seed              # Seed database with initial data
#   ./migrate.sh create <name>    # Create new migration

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_ROOT/backend"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Logging
log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check DATABASE_URL
check_database_url() {
    if [ -z "${DATABASE_URL:-}" ]; then
        log_error "DATABASE_URL environment variable is not set"
        log_info "Set it with: export DATABASE_URL='postgresql://...'"
        exit 1
    fi
}

# Run Prisma migration
run_migration() {
    local command=$1
    cd "$BACKEND_DIR"
    
    log_info "Running Prisma migration: $command"
    
    case $command in
        status)
            npx prisma migrate status
            ;;
        up)
            npx prisma migrate deploy
            ;;
        down)
            npx prisma migrate rollback
            ;;
        reset)
            log_warn "This will reset your database! Are you sure?"
            read -p "Type 'yes' to confirm: " confirm
            if [ "$confirm" = "yes" ]; then
                npx prisma migrate reset --force
            else
                log_info "Aborted"
            fi
            ;;
        seed)
            log_info "Seeding database..."
            npx prisma db seed
            ;;
        create)
            local name=$2
            if [ -z "$name" ]; then
                log_error "Migration name required"
                echo "Usage: $0 create <migration-name>"
                exit 1
            fi
            npx prisma migrate dev --name "$name"
            ;;
        *)
            log_error "Unknown command: $command"
            exit 1
            ;;
    esac
}

# Generate Prisma client
generate_client() {
    cd "$BACKEND_DIR"
    log_info "Generating Prisma client..."
    npx prisma generate
}

# Main
main() {
    local command=${1:-status}
    
    check_database_url
    generate_client
    
    if [ $# -gt 1 ]; then
        run_migration "$command" "${2:-}"
    else
        run_migration "$command"
    fi
}

main "$@"
