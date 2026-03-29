# =============================================================================
# NeureCore Agent Container - Minimal secure image for agent execution
# =============================================================================
# Base: Alpine for minimal attack surface
# Non-root user for security
# Read-only filesystem where possible
# =============================================================================

FROM alpine:3.19 AS base

# Install minimal runtime dependencies
RUN apk add --no-cache \
    bash \
    ca-certificates \
    curl \
    jq \
    coreutils \
    findutils \
    grep \
    sed \
    awk \
    tar \
    gzip \
    # Security tools
    iputils \
    net-tools \
    # For Node.js agents
    nodejs \
    npm \
    # Python for ML/AI agents
    python3 \
    py3-pip

# Create non-root user for agent execution
RUN addgroup -g 1000 neure-agent && \
    adduser -u 1000 -G neure-agent -s /bin/bash -D neure-agent

# Create workspace directory
RUN mkdir -p /workspace && \
    chown -R neure-agent:neure-agent /workspace && \
    chmod 755 /workspace

WORKDIR /workspace

# =============================================================================
# Stage 2: Production image with security hardening
# =============================================================================
FROM base AS production

# Copy security scripts
COPY --chown=root:root ./scripts/security/ /usr/local/bin/
RUN chmod 755 /usr/local/bin/*

# Environment variables for agent
ENV AGENT_WORKSPACE=/workspace
ENV AGENT_USER=neure-agent
ENV AGENT_UID=1000
ENV AGENT_GID=1000
ENV PATH=/usr/local/bin:$PATH

# Security: Drop privileges
USER neure-agent

# Default command - waits for agent task
CMD ["bash", "/usr/local/bin/agent-entrypoint.sh"]
