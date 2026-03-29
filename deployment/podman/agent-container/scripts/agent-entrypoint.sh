#!/bin/bash
# =============================================================================
# NeureCore Agent Entrypoint - Container security hardening
# =============================================================================
# This script runs inside the agent container with:
# - Non-root user (neure-agent:1000)
# - Restricted filesystem (read-only where possible)
# - Network isolation
# - Resource limits
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[AGENT]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# =============================================================================
# Security Hardening
# =============================================================================

log "Applying security hardening..."

# 1. Clear any inherited environment variables
unset AGENT_SECRET API_KEY DATABASE_URL REDIS_URL

# 2. Create ephemeral workspace
AGENT_WS="/workspace/agent-$$-$(date +%s)"
mkdir -p "$AGENT_WS"
cd "$AGENT_WS"

log "Created ephemeral workspace: $AGENT_WS"

# 3. Set resource limits (if ulimit is available)
ulimit -v 1048576 2>/dev/null || true  # 1GB virtual memory
ulimit -u 512 2>/dev/null || true      # max processes
ulimit -f 1048576 2>/dev/null || true  # max file size (1GB)
ulimit -t 3600 2>/dev/null || true     # max CPU time (1 hour)

# 4. Disable dangerous binaries
for bin in su sudo passwd shutdown reboot halt poweroff init; do
    chmod 000 "/usr/sbin/$bin" 2>/dev/null || true
done

# 5. Set secure PATH (only system directories)
export PATH="/usr/local/bin:/usr/bin:/bin"

# 6. Set umask for new files (no world-readable)
umask 0077

# =============================================================================
# Cleanup on exit
# =============================================================================

cleanup() {
    log "Cleaning up workspace..."
    rm -rf "$AGENT_WS" 2>/dev/null || true
}

trap cleanup EXIT

# =============================================================================
# Wait for task or process agent loop
# =============================================================================

log "Agent container ready"
log "Workspace: $AGENT_WS"
log "User: $(whoami) (UID: $(id -u))"

# If AGENT_TASK is provided, execute it
if [ -n "$AGENT_TASK" ]; then
    log "Executing task from AGENT_TASK env..."
    eval "$AGENT_TASK"
else
    # Otherwise wait for tasks via named pipe
    log "Waiting for tasks via /workspace/task.sock..."
    
    # Create task socket for IPC
    if [ -S "/workspace/task.sock" ]; then
        exec 3<>/workspace/task.sock
        
        while read -r line <&3; do
            log "Received task: $line"
            
            # Process task (this would be replaced with actual agent logic)
            # For now, just echo back
            echo "Task completed: $line" >&3
        done
    else
        # No socket, just idle
        log "No task socket found. Idling..."
        tail -f /dev/null
    fi
fi
