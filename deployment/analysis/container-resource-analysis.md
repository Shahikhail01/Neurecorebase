# Containerization Resource Analysis — NeureCore on Contabo VPS

## Hardware Context

| Resource | Specification    |
| -------- | ---------------- |
| **RAM**  | 12 GB total      |
| **CPU**  | 4 vCPUs          |
| **Disk** | ~200 GB SSD      |
| **OS**   | Ubuntu 22.04 LTS |

---

## Current Production Stack (No Containers)

### Memory Breakdown

| Component           | Typical RAM   | Peak RAM | Notes               |
| ------------------- | ------------- | -------- | ------------------- |
| **NestJS Backend**  | 300-500 MB    | 800 MB   | Under load          |
| **PostgreSQL 16**   | 150-300 MB    | 500 MB   | Buffer pools        |
| **Redis 7**         | 50-100 MB     | 150 MB   | Persistence on      |
| **PM2 Manager**     | 20-50 MB      | 50 MB    | Minimal overhead    |
| **Nginx**           | 20-30 MB      | 50 MB    | Reverse proxy       |
| **System/OS**       | 1-2 GB        | 2 GB     | Baseline            |
| **OpenClaw Agent**  | 500 MB - 2 GB | 2 GB     | Per agent session   |
| **Agent Workspace** | 100-500 MB    | 1 GB     | Temp files          |
| **Headroom**        | ~2-4 GB       | -        | For spikes & growth |

### Estimated Total: 2.5 - 5 GB typical, 7-9 GB peak

---

## Container Overhead Analysis

### Podman vs Docker

| Runtime    | Daemon                | Memory Overhead | Root Access   |
| ---------- | --------------------- | --------------- | ------------- |
| **Docker** | Required (150-300 MB) | ~500 MB base    | Root required |
| **Podman** | Rootless (no daemon)  | ~100-200 MB     | Rootless      |

**Recommendation:** Podman for rootless operation.

### Per-Container Memory

| Container                | Base RAM   | With Workload |
| ------------------------ | ---------- | ------------- |
| **Minimal Python agent** | 50-100 MB  | 200-500 MB    |
| **Node.js microservice** | 50-80 MB   | 150-300 MB    |
| **Database container**   | 200-400 MB | 500 MB+       |

### Scenario Analysis

#### Scenario A: Full Containerization (NOT RECOMMENDED)

```
┌─────────────────────────────────────────────┐
│ Contabo VPS (12 GB RAM)                      │
├─────────────────────────────────────────────┤
│  Container Runtime:     ~200 MB              │
│  Postgres Container:     ~400 MB              │
│  Redis Container:        ~150 MB              │
│  Nginx Container:       ~100 MB               │
│  Backend Container:     ~500 MB               │
│  Agent Containers (2x): ~800 MB               │
│  OS/Other:              ~2 GB                  │
├─────────────────────────────────────────────┤
│  TOTAL:               ~4.35 GB                │
│  Remaining for agents: ~7.65 GB               │
└─────────────────────────────────────────────┘

⚠️ Risk: Container overhead + reduced headroom
```

#### Scenario B: Hybrid (Backend on PM2, Agents in Podman)

```
┌─────────────────────────────────────────────┐
│ Contabo VPS (12 GB RAM)                      │
├─────────────────────────────────────────────┤
│  Podman Runtime:       ~100 MB               │
│  Postgres (native):     ~300 MB               │
│  Redis (native):       ~100 MB               │
│  Nginx (native):        ~50 MB               │
│  Backend (PM2):        ~500 MB               │
│  Agent Podman Pod:     ~600 MB (2 agents)    │
│  OS/Other:             ~2 GB                 │
├─────────────────────────────────────────────┤
│  TOTAL:               ~3.65 GB                │
│  Remaining:           ~8.35 GB               │
└─────────────────────────────────────────────┘

✅ Benefit: Agent isolation without full containerization
```

#### Scenario C: Native (Current) with Phase 5

```
┌─────────────────────────────────────────────┐
│ Contabo VPS (12 GB RAM)                      │
├─────────────────────────────────────────────┤
│  Postgres:            ~300 MB               │
│  Redis:               ~100 MB               │
│  Nginx:                ~50 MB               │
│  Backend (PM2):       ~500 MB               │
│  OpenClaw (in-process): ~600 MB             │
│  OS/Other:             ~2 GB                │
├─────────────────────────────────────────────┤
│  TOTAL:               ~3.55 GB               │
│  Remaining:           ~8.45 GB               │
└─────────────────────────────────────────────┘

✅ Benefit: Least overhead, simplest operations
```

---

## Security Comparison

| Aspect                   | Native + PM2          | Hybrid (Podman)      | Full Containers     |
| ------------------------ | --------------------- | -------------------- | ------------------- |
| **Process Isolation**    | User namespace        | Container boundaries | Full isolation      |
| **Filesystem**           | chown + chmod         | Overlay FS + user    | Full container FS   |
| **Network**              | iptables/namespaces   | Podman networking    | Full network ns     |
| **Resource Limits**      | cgroups via PM2       | Podman resource ctrl | Full cgroup control |
| **Privilege Escalation** | Limited by user       | Container runtime    | Seccomp/AppArmor    |
| **Secret Management**    | SecretProviderService | Same + K8s secrets   | Vault integration   |

---

## Recommendation Matrix

| Factor                     | Native + Phase 5 | Hybrid Podman | Full Containers |
| -------------------------- | ---------------- | ------------- | --------------- |
| **RAM Efficiency**         | ⭐⭐⭐⭐⭐       | ⭐⭐⭐        | ⭐⭐            |
| **Security Isolation**     | ⭐⭐⭐           | ⭐⭐⭐⭐      | ⭐⭐⭐⭐⭐      |
| **Operational Complexity** | ⭐⭐⭐⭐⭐       | ⭐⭐⭐        | ⭐⭐            |
| **Agent Isolation**        | ⭐⭐             | ⭐⭐⭐⭐      | ⭐⭐⭐⭐⭐      |
| **Current Fit (12GB)**     | ⭐⭐⭐⭐⭐       | ⭐⭐⭐        | ⭐              |

---

## Decision Framework

### Choose Native + Phase 5 (Current) IF:

- Agents run in-process or via API calls (OpenClaw gateway)
- No untrusted user code execution
- Team prefers simpler operations
- RAM headroom needed for scaling

### Choose Hybrid (Podman for Agents) IF:

- Agents execute arbitrary code that needs sandboxing
- Per-agent resource limits needed
- Want container benefits without full refactor
- 8+ GB RAM available for agents

### Choose Full Containers IF:

- Multiple tenants with strict isolation requirements
- Enterprise/compliance needs (SOC 2, HIPAA)
- Kubernetes migration planned
- GPU passthrough required

---

## Conclusion

**For NeureCore at current scale (12GB RAM, single Contabo VPS):**

1. **Phase 5 (neure-worker user)** provides adequate isolation for current threat model
2. **Hybrid Podman** is viable if agent code execution needs sandboxing
3. **Full containers** add overhead without proportional benefit yet

**Recommended Path:**

```
Now:        Implement Phase 5 (neure-worker user) ← URGENT
Near-term:  Monitor OpenClaw agent memory usage
6 months:   Re-evaluate if agent count grows or RAM pressure increases
```

**If you want containerization from the start for security best practices:**

- Use **Hybrid Podman approach** (backend on PM2, agents in containers)
- This gives agent isolation with minimal overhead (~200MB Podman + ~600MB agent containers)
- Remaining headroom: ~8GB for agent workloads
