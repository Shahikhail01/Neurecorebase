#!/bin/bash
# =============================================================================
# Phase 6: Hybrid Podman Setup for NeureCore Agents
# =============================================================================
# Purpose: Deploy agents in Podman containers while backend stays on PM2
# Target: Contabo VPS (brain.neurecore.com)
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║      Phase 6: Hybrid Podman Agent Deployment                ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"

# =============================================================================
# Configuration
# =============================================================================
DEPLOY_DIR="/opt/neurecore/podman"
AGENT_IMAGE="localhost/neurecore/agent:latest"
POD_NAME="neurecore-agents"

# =============================================================================
# Step 1: Check prerequisites
# =============================================================================
echo -e "\n${GREEN}[1/8] Checking prerequisites...${NC}"

# Check if running as root or sudo
if [ "$EUID" -ne 0 ]; then 
    echo -e "${YELLOW}⚠️  This script should be run as root or with sudo${NC}"
    echo -e "${YELLOW}   Continuing anyway...${NC}"
fi

# Check Podman installation
if ! command -v podman &> /dev/null; then
    echo -e "${YELLOW}⚠️  Podman not installed. Installing...${NC}"
    
    # Install Podman (Ubuntu/Debian)
    if command -v apt-get &> /dev/null; then
        sudo apt-get update
        sudo apt-get install -y podman
    elif command -v yum &> /dev/null; then
        sudo yum install -y podman
    elif command -v dnf &> /dev/null; then
        sudo dnf install -y podman
    else
        echo -e "${RED}✗ Cannot install Podman - package manager not supported${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Podman installed${NC}"
else
    echo -e "${GREEN}✓ Podman already installed: $(podman --version)${NC}"
fi

# =============================================================================
# Step 2: Create deployment directory
# =============================================================================
echo -e "\n${GREEN}[2/8] Creating deployment directory...${NC}"

sudo mkdir -p "$DEPLOY_DIR"/{agent-policies,workspaces,logs}
sudo chown -R neure-worker:neure-worker "$DEPLOY_DIR"

echo -e "${GREEN}✓ Deployment directory: $DEPLOY_DIR${NC}"

# =============================================================================
# Step 3: Copy agent policies
# =============================================================================
echo -e "\n${GREEN}[3/8] Copying agent policies...${NC}"

# Copy policy documents to deployment directory
if [ -d "/mnt/data/Web Dev/NeureCore/docs/POLICIES" ]; then
    sudo cp -r /mnt/data/Web\ Dev/NeureCore/docs/POLICIES/* "$DEPLOY_DIR/agent-policies/"
    sudo chown -R neure-worker:neure-worker "$DEPLOY_DIR/agent-policies"
    echo -e "${GREEN}✓ Agent policies copied${NC}"
else
    echo -e "${YELLOW}⚠️  Agent policies directory not found locally${NC}"
    echo -e "${YELLOW}   Please copy policies manually or clone repo first${NC}"
fi

# =============================================================================
# Step 4: Build agent container image
# =============================================================================
echo -e "\n${GREEN}[4/8] Building agent container image...${NC}"

# Create agent container directory
PODMAN_DIR="$DEPLOY_DIR/podman"
sudo mkdir -p "$PODMAN_DIR"

# Copy Dockerfile and scripts
sudo cp /mnt/data/Web\ Dev/NeureCore/deployment/podman/agent-container/Dockerfile "$PODMAN_DIR/"
sudo cp -r /mnt/data/Web\ Dev/NeureCore/deployment/podman/agent-container/scripts "$PODMAN_DIR/"

# Build the image as neure-worker (non-root)
sudo -u neure-worker podman build \
    --tag neurecore/agent:latest \
    --format docker \
    "$PODMAN_DIR"

echo -e "${GREEN}✓ Agent image built: $AGENT_IMAGE${NC}"

# =============================================================================
# Step 5: Create workspaces with proper permissions
# =============================================================================
echo -e "\n${GREEN}[5/8] Setting up agent workspaces...${NC}"

# Create isolated workspaces for each agent type
for agent in finance supplychain audit; do
    sudo mkdir -p "$DEPLOY_DIR/workspaces/$agent"
    sudo chmod 700 "$DEPLOY_DIR/workspaces/$agent"
    sudo chown neure-worker:neure-worker "$DEPLOY_DIR/workspaces/$agent"
done

# Create shared read-only policy mount
sudo mkdir -p "$DEPLOY_DIR/policies"
sudo chmod 755 "$DEPLOY_DIR/policies"
sudo chown root:root "$DEPLOY_DIR/policies"

echo -e "${GREEN}✓ Workspaces created with 700 permissions${NC}"

# =============================================================================
# Step 6: Update agent-pod.yaml with correct paths
# =============================================================================
echo -e "\n${GREEN}[6/8] Updating Pod configuration...${NC}"

# Generate final pod YAML with actual paths
cat > /tmp/agent-pod-final.yaml << EOF
# =============================================================================
# NeureCore Agent Pod - Generated by Phase 6 deployment
# =============================================================================
apiVersion: v1
kind: Pod
metadata:
  name: $POD_NAME
  labels:
    app: neurecore
    component: agents
spec:
  shareNamespace:
    - ipc
    - uts
  
  containers:
    - name: finance-agent
      image: $AGENT_IMAGE
      command: ["/usr/local/bin/agent-entrypoint.sh"]
      env:
        - name: AGENT_TYPE
          value: "finance-analyst"
        - name: AGENT_POLICY
          value: "/workspace/policies/finance-analyst.md"
        - name: AGENT_WORKSPACE
          value: "/workspace/finance"
      resources:
        requests:
          memory: "128Mi"
          cpu: "50m"
        limits:
          memory: "512Mi"
          cpu: "500m"
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        runAsGroup: 1000
        readOnlyRootFilesystem: false
        allowPrivilegeEscalation: false
        capabilities:
          drop: ["ALL"]
      volumeMounts:
        - name: finance-workspace
          mountPath: /workspace/finance
        - name: agent-policies
          mountPath: /workspace/policies
      stdin: true
      stdinOnce: true
      tty: true

    - name: supplychain-agent
      image: $AGENT_IMAGE
      command: ["/usr/local/bin/agent-entrypoint.sh"]
      env:
        - name: AGENT_TYPE
          value: "supply-chain-specialist"
        - name: AGENT_POLICY
          value: "/workspace/policies/supply-chain-specialist.md"
        - name: AGENT_WORKSPACE
          value: "/workspace/supplychain"
      resources:
        requests:
          memory: "128Mi"
          cpu: "50m"
        limits:
          memory: "512Mi"
          cpu: "500m"
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        runAsGroup: 1000
        readOnlyRootFilesystem: false
        allowPrivilegeEscalation: false
        capabilities:
          drop: ["ALL"]
      volumeMounts:
        - name: supplychain-workspace
          mountPath: /workspace/supplychain
        - name: agent-policies
          mountPath: /workspace/policies
      stdin: true
      stdinOnce: true
      tty: true

    - name: audit-agent
      image: $AGENT_IMAGE
      command: ["/usr/local/bin/agent-entrypoint.sh"]
      env:
        - name: AGENT_TYPE
          value: "audit-compliance-officer"
        - name: AGENT_POLICY
          value: "/workspace/policies/audit-compliance-officer.md"
        - name: AGENT_WORKSPACE
          value: "/workspace/audit"
      resources:
        requests:
          memory: "128Mi"
          cpu: "50m"
        limits:
          memory: "512Mi"
          cpu: "500m"
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        runAsGroup: 1000
        readOnlyRootFilesystem: false
        allowPrivilegeEscalation: false
        capabilities:
          drop: ["ALL"]
      volumeMounts:
        - name: audit-workspace
          mountPath: /workspace/audit
        - name: agent-policies
          mountPath: /workspace/policies
      stdin: true
      stdinOnce: true
      tty: true

  volumes:
    - name: finance-workspace
      emptyDir:
        medium: Memory
        sizeLimit: "256Mi"
    - name: supplychain-workspace
      emptyDir:
        medium: Memory
        sizeLimit: "256Mi"
    - name: audit-workspace
      emptyDir:
        medium: Memory
        sizeLimit: "256Mi"
    - name: agent-policies
      hostPath:
        path: $DEPLOY_DIR/agent-policies
        type: Directory

  restartPolicy: OnFailure
EOF

sudo mv /tmp/agent-pod-final.yaml "$DEPLOY_DIR/agent-pod.yaml"
echo -e "${GREEN}✓ Pod configuration updated${NC}"

# =============================================================================
# Step 7: Start the agent pod
# =============================================================================
echo -e "\n${GREEN}[7/8] Starting agent pod...${NC}"

# Stop existing pod if running
sudo -u neure-worker podman pod stop "$POD_NAME" 2>/dev/null || true
sudo -u neure-worker podman pod rm "$POD_NAME" 2>/dev/null || true

# Start the pod
cd "$DEPLOY_DIR"
sudo -u neure-worker podman play kube --network=none "$DEPLOY_DIR/agent-pod.yaml"

echo -e "${GREEN}✓ Agent pod started: $POD_NAME${NC}"

# =============================================================================
# Step 8: Verify deployment
# =============================================================================
echo -e "\n${GREEN}[8/8] Verifying deployment...${NC}"

echo -e "\n${BLUE}Pod Status:${NC}"
sudo -u neure-worker podman pod ps | grep "$POD_NAME" || echo "Pod not found"

echo -e "\n${BLUE}Container Status:${NC}"
sudo -u neure-worker podman ps -a --format "table {{.ID}}\t{{.Names}}\t{{.Status}}\t{{.Image}}" | grep agent || echo "No agent containers"

echo -e "\n${BLUE}Resource Usage:${NC}"
sudo -u neure-worker podman stats --no-stream || echo "Could not get stats"

# =============================================================================
# Summary
# =============================================================================
echo -e "\n${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              Phase 6 Deployment Complete                      ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${GREEN}Architecture:${NC}"
echo "  ┌─────────────────────────────────────────────────────┐"
echo "  │              Contabo VPS (12 GB RAM)                 │"
echo "  ├─────────────────────────────────────────────────────┤"
echo "  │  ┌─────────────┐  ┌─────────────────────────────┐  │"
echo "  │  │   PM2       │  │      Podman Pod             │  │"
echo "  │  │  Backend    │  │  ┌─────────┐ ┌─────────┐   │  │"
echo "  │  │  (NestJS)   │  │  │ Finance │ │ Supply  │   │  │"
echo "  │  │             │  │  │ Agent   │ │ Chain   │   │  │"
echo "  │  │             │  │  └─────────┘ │ Agent   │   │  │"
echo "  │  │             │  │  ┌─────────┐ └─────────┘   │  │"
echo "  │  │             │  │  │  Audit  │               │  │"
echo "  │  │             │  │  │ Agent   │               │  │"
echo "  │  └─────────────┘  └─────────────────────────────┘  │"
echo "  └─────────────────────────────────────────────────────┘"

echo -e "\n${GREEN}Management Commands:${NC}"
echo "  View pod:     sudo -u neure-worker podman pod ps"
echo "  View logs:    sudo -u neure-worker podman logs $POD_NAME"
echo "  Stop pod:     sudo -u neure-worker podman pod stop $POD_NAME"
echo "  Start pod:    sudo -u neure-worker podman pod start $POD_NAME"
echo "  Remove pod:   sudo -u neure-worker podman pod rm $POD_NAME"
echo "  Resource use: sudo -u neure-worker podman stats --no-stream"

echo -e "\n${YELLOW}Note: Agent containers communicate with backend via REST API${NC}"
echo -e "${YELLOW}      Update backend config to use containerized agents${NC}"
