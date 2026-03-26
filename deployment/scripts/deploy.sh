#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# Deployment Script for NeureCore to Vercel
# ═══════════════════════════════════════════════════════════════════════════
# This script deploys applications to Vercel with support for multiple
# environments (development, staging, production).
#
# Usage:
#   ./deploy.sh                    # Interactive mode
#   ./deploy.sh development        # Deploy to development
#   ./deploy.sh staging            # Deploy to staging
#   ./deploy.sh production         # Deploy to production
#   ./deploy.sh production --rollback  # Rollback production
#
# Prerequisites:
#   - Vercel CLI installed (npm i -g vercel)
#   - Vercel account connected
#   - Environment variables configured in Vercel

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Default values
ENVIRONMENT="${1:-development}"
ROLLBACK=false
SKIP_BUILD=false

# Parse arguments
for arg in "$@"; do
    case $arg in
        --rollback)
            ROLLBACK=true
            ;;
        --skip-build)
            SKIP_BUILD=true
            ;;
    esac
done

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Vercel CLI
    if ! command -v vercel >/dev/null 2>&1; then
        log_error "Vercel CLI not installed. Install with: npm i -g vercel"
        exit 1
    fi
    
    # Check Node.js
    if ! command -v node >/dev/null 2>&1; then
        log_error "Node.js is not installed"
        exit 1
    fi
    
    log_info "Prerequisites check passed"
}

# Load environment configuration
load_env_config() {
    local env=$1
    local env_file="$SCRIPT_DIR/environments/$env.env"
    
    if [ -f "$env_file" ]; then
        log_info "Loading environment from $env_file"
        set -a
        source "$env_file"
        set +a
    else
        log_warn "Environment file not found: $env_file"
    fi
}

# Deploy frontend-tenant
deploy_frontend_tenant() {
    local env=$1
    log_step "Deploying Tenant Portal to $env..."
    
    cd "$PROJECT_ROOT/frontend-tenant"
    
    local vercel_args=("--yes")
    
    case $env in
        development)
            vercel_args+=("--dev")
            ;;
        staging)
            vercel_args+=("--prebuilt")
            ;;
        production)
            vercel_args+=("--prebuilt" "--prod")
            ;;
    esac
    
    # Add environment variables
    vercel_args+=(
        "-e" "NEXT_PUBLIC_API_URL=https://api-$env.neurecore.com"
        "-e" "NEXT_PUBLIC_SOCKET_URL=wss://ws-$env.neurecore.com"
        "-e" "NEXT_PUBLIC_APP_URL=https://tenant-$env.neurecore.com"
    )
    
    vercel "${vercel_args[@]}"
    
    log_info "Tenant Portal deployed to $env"
}

# Deploy frontend-admin
deploy_frontend_admin() {
    local env=$1
    log_step "Deploying Admin Portal to $env..."
    
    cd "$PROJECT_ROOT/frontend-admin"
    
    local vercel_args=("--yes")
    
    case $env in
        development)
            vercel_args+=("--dev")
            ;;
        staging)
            vercel_args+=("--prebuilt")
            ;;
        production)
            vercel_args+=("--prebuilt" "--prod")
            ;;
    esac
    
    # Add environment variables
    vercel_args+=(
        "-e" "NEXT_PUBLIC_API_URL=https://api-$env.neurecore.com"
        "-e" "NEXT_PUBLIC_SOCKET_URL=wss://ws-$env.neurecore.com"
        "-e" "NEXT_PUBLIC_APP_URL=https://admin-$env.neurecore.com"
    )
    
    vercel "${vercel_args[@]}"
    
    log_info "Admin Portal deployed to $env"
}

# Rollback deployment
rollback_deployment() {
    local env=$1
    log_warn "Rolling back $env deployment..."
    
    # Get deployment list and rollback to previous
    vercel rollback --yes --environment=$env
    
    log_info "Rollback completed for $env"
}

# Main deployment function
deploy() {
    local env=$ENVIRONMENT
    
    log_info "Starting deployment to $env environment..."
    
    # Validate environment
    case $env in
        development|staging|production)
            log_info "Deploying to: $env"
            ;;
        *)
            log_error "Invalid environment: $env"
            echo "Valid environments: development, staging, production"
            exit 1
            ;;
    esac
    
    # Check for rollback
    if [ "$ROLLBACK" = true ]; then
        rollback_deployment $env
        return
    fi
    
    # Load environment configuration
    load_env_config $env
    
    # Deploy frontends
    deploy_frontend_tenant $env
    deploy_frontend_admin $env
    
    log_info "Deployment to $env completed successfully!"
}

# Run health checks after deployment
health_check() {
    local env=$1
    log_step "Running health checks..."
    
    local tenant_url=""
    local admin_url=""
    
    case $env in
        development)
            tenant_url="http://localhost:3001"
            admin_url="http://localhost:3002"
            ;;
        staging)
            tenant_url="https://tenant-staging.neurecore.com"
            admin_url="https://admin-staging.neurecore.com"
            ;;
        production)
            tenant_url="https://tenant.neurecore.com"
            admin_url="https://admin.neurecore.com"
            ;;
    esac
    
    # Check tenant portal
    if curl -sf "$tenant_url/api/health" >/dev/null 2>&1; then
        log_info "Tenant Portal health check: OK"
    else
        log_warn "Tenant Portal health check: FAILED"
    fi
    
    # Check admin portal
    if curl -sf "$admin_url/api/health" >/dev/null 2>&1; then
        log_info "Admin Portal health check: OK"
    else
        log_warn "Admin Portal health check: FAILED"
    fi
}

# Main execution
main() {
    check_prerequisites
    deploy
    
    if [ "$ROLLBACK" = false ]; then
        health_check $ENVIRONMENT
    fi
}

main "$@"
