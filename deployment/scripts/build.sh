#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# Build Script for NeureCore Applications
# ═══════════════════════════════════════════════════════════════════════════
# This script builds all NeureCore applications for deployment.
# Supports building individual apps or all at once.
#
# Usage:
#   ./build.sh              # Build all applications
#   ./build.sh backend      # Build only backend
#   ./build.sh frontend-tenant  # Build only tenant frontend
#   ./build.sh frontend-admin   # Build only admin frontend
#
# Environment: production

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BUILD_OUTPUT_DIR="$PROJECT_ROOT/dist"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

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

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Setup environment
setup_environment() {
    log_info "Setting up build environment..."

    # Check Node.js
    if ! command_exists node; then
        log_error "Node.js is not installed. Please install Node.js 20+"
        exit 1
    fi

    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 20 ]; then
        log_error "Node.js version must be 20 or higher. Current: $(node -v)"
        exit 1
    fi

    # Check pnpm
    if ! command_exists pnpm; then
        log_warn "pnpm not found. Installing..."
        npm install -g pnpm
    fi

    # Create output directory
    mkdir -p "$BUILD_OUTPUT_DIR"

    log_info "Environment setup complete"
}

# Build backend
build_backend() {
    log_info "Building backend..."
    
    cd "$PROJECT_ROOT/backend"
    
    # Install dependencies
    pnpm install --frozen-lockfile
    
    # Generate Prisma client
    pnpm prisma generate
    
    # Build TypeScript
    pnpm build
    
    # Copy build output
    cp -r dist "$BUILD_OUTPUT_DIR/backend"
    
    log_info "Backend build complete"
}

# Build frontend-tenant
build_frontend_tenant() {
    log_info "Building tenant portal..."
    
    cd "$PROJECT_ROOT/frontend-tenant"
    
    # Install dependencies
    pnpm install --frozen-lockfile
    
    # Build
    pnpm build
    
    # Copy build output
    cp -r .next "$BUILD_OUTPUT_DIR/frontend-tenant"
    
    log_info "Tenant portal build complete"
}

# Build frontend-admin
build_frontend_admin() {
    log_info "Building admin portal..."
    
    cd "$PROJECT_ROOT/frontend-admin"
    
    # Install dependencies
    pnpm install --frozen-lockfile
    
    # Build
    pnpm build
    
    # Copy build output
    cp -r .next "$BUILD_OUTPUT_DIR/frontend-admin"
    
    log_info "Admin portal build complete"
}

# Build all applications
build_all() {
    log_info "Building all NeureCore applications..."
    
    setup_environment
    
    # Build in parallel for speed
    build_backend &
    BACKEND_PID=$!
    
    build_frontend_tenant &
    TENANT_PID=$!
    
    build_frontend_admin &
    ADMIN_PID=$!
    
    # Wait for all builds
    wait $BACKEND_PID
    wait $TENANT_PID
    wait $ADMIN_PID
    
    log_info "All applications built successfully!"
    log_info "Build output: $BUILD_OUTPUT_DIR"
}

# Main execution
main() {
    case "${1:-all}" in
        backend)
            setup_environment
            build_backend
            ;;
        frontend-tenant)
            setup_environment
            build_frontend_tenant
            ;;
        frontend-admin)
            setup_environment
            build_frontend_admin
            ;;
        all)
            build_all
            ;;
        *)
            echo "Usage: $0 {backend|frontend-tenant|frontend-admin|all}"
            exit 1
            ;;
    esac
}

main "$@"
