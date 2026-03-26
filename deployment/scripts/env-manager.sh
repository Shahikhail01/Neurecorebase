#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# Environment Manager for NeureCore
# ═══════════════════════════════════════════════════════════════════════════
# Manages environment variables across local, staging, and production.
# Uses Vercel CLI for remote environment management.
#
# Usage:
#   ./env-manager.sh list              # List all environments
#   ./env-manager.sh export            # Export local env to file
#   ./env-manager.sh import <env>      # Import env from file to Vercel
#   ./env-manager.sh sync <env>        # Sync local env to Vercel

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check Vercel CLI
check_vercel() {
    if ! command -v vercel >/dev/null 2>&1; then
        log_error "Vercel CLI not installed. Install with: npm i -g vercel"
        exit 1
    fi
}

# List environments
list_envs() {
    log_info "Local environments:"
    ls -la "$SCRIPT_DIR/../environments/" | grep -E "\.env$" | awk '{print "  - " $9}'
    
    log_info "Vercel environments:"
    vercel env ls 2>/dev/null || log_warn "Run 'vercel link' first"
}

# Export local env
export_env() {
    local env=${1:-development}
    local env_file="$SCRIPT_DIR/../environments/$env.env"
    
    if [ ! -f "$env_file" ]; then
        log_error "Environment file not found: $env_file"
        exit 1
    fi
    
    log_info "Exporting $env environment..."
    
    # Export non-secret variables
    grep -v "^#" "$env_file" | grep -v "^$" | while read -r line; do
        key=$(echo "$line" | cut -d'=' -f1)
        value=$(echo "$line" | cut -d'=' -f2-)
        
        # Skip empty values
        [ -z "$value" ] && continue
        
        echo "$key=$value"
    done > "$SCRIPT_DIR/../environments/${env}-exported.env"
    
    log_info "Exported to: ${env}-exported.env"
    log_warn "Review and remove secrets before sharing!"
}

# Import env to Vercel
import_env() {
    local env=${1:-development}
    local env_file="$SCRIPT_DIR/../environments/${env}.env"
    
    if [ ! -f "$env_file" ]; then
        log_error "Environment file not found: $env_file"
        exit 1
    fi
    
    log_info "Importing $env environment to Vercel..."
    
    check_vercel
    
    # Import each variable
    grep -v "^#" "$env_file" | grep -v "^$" | while read -r line; do
        key=$(echo "$line" | cut -d'=' -f1)
        value=$(echo "$line" | cut -d'=' -f2-)
        
        # Skip empty values
        [ -z "$value" ] && continue
        
        echo "Adding $key..."
        echo "$value" | vercel env add "$key" "$env" 2>/dev/null || true
    done
    
    log_info "Import completed"
}

# Sync local to Vercel
sync_env() {
    local env=${1:-development}
    
    log_info "Syncing $env environment..."
    import_env "$env"
    
    log_info "Sync completed"
}

# Main
main() {
    local command=${1:-list}
    local arg=${2:-}
    
    case $command in
        list)
            list_envs
            ;;
        export)
            export_env "$arg"
            ;;
        import)
            check_vercel
            import_env "$arg"
            ;;
        sync)
            check_vercel
            sync_env "$arg"
            ;;
        *)
            echo "Usage: $0 {list|export|import|sync} [environment]"
            exit 1
            ;;
    esac
}

main "$@"
