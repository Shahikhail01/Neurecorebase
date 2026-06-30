# Observability — Stack Overview

**Last Updated:** 2026-06-30
**Last Verified:** 2026-06-30 (live inspection)
**Audience:** DevOps, SRE, backend engineers

---

## Overview

Observability stack runs on Contabo via Docker with `network_mode: host`.

```
/opt/neurecore/observability/
├── docker-compose.yml
├── prometheus/
│   ├── prometheus.yml
│   └── alerts.yml
├── alertmanager/
│   └── alertmanager.yml
├── grafana/
│   ├── provisioning/
│   └── dashboards/
└── scripts/
    └── smoke.sh
```

---

## Services

| Service | Image | Port | URL |
|---|---|---|---|
| Prometheus | prom/prometheus:v2.55.1 | 9090 | http://127.0.0.1:9090 |
| Alertmanager | prom/alertmanager:v0.27.0 | 9093 | http://127.0.0.1:9093 |
| Grafana | grafana/grafana:11.3.0 | 3200 | http://127.0.0.1:3200 |

---

## Prometheus

### Scrape Configuration

Location: `prometheus/prometheus.yml`

Scrape target: `neurecore-backend` at `127.0.0.1:3003/api/v1/metrics`

### Metrics Collected

Backend metrics at `/api/metrics`:
- `neurecore_ai_action_invocations_total{status, actionId}`
- `neurecore_ai_action_duration_seconds{actionId}`
- `neurecore_ai_action_tokens_total{direction, actionId}`
- `neurecore_ai_action_cost_usd_total{model, actionId}`
- `neurecore_ai_action_errors_total{actionId, errorType}`
- `neurecore_node_*` — Node.js default metrics

---

## Alertmanager

### Configuration

Location: `alertmanager/alertmanager.yml`

Alert rules defined in `prometheus/alerts.yml`:
- `AIActionSingleInvocationTooLarge` — Single call >10K tokens
- `AIActionCostCapApproaching` — Per-action hourly cost >$1
- `AIActionErrorRateHigh` — Errors >10% over 5m
- `BackendMetricsScrapeFailing` — Prometheus can't scrape backend
- `AIActionLatencyHigh` — p95 latency >30s

---

## Grafana

### Access

```
URL: http://127.0.0.1:3200
Username: admin
Password: neurecore-obs-2026
```

### Dashboards

Located at `grafana/dashboards/`:
- AI Action Latency
- AI Action Tokens
- AI Action Cost
- AI Action Errors

### Datasources

Prometheus provisioned at `grafana/provisioning/datasources/prometheus.yml`.

---

## Smoke Test

Run the smoke test to verify all components:

```bash
ssh contabo 'cd /opt/neurecore/observability && bash scripts/smoke.sh'
```

Expected output:
```
PASS: 8
FAIL: 0
```

### Checks Performed

1. Prometheus is up
2. Prometheus scrapes backend
3. Backend /api/metrics reachable
4. Alertmanager is up
5. Grafana is healthy
6. Grafana datasource loaded
7. Grafana dashboards loaded
8. Alert rules loaded

---

## Docker Commands

```bash
# View containers
docker ps

# View logs
docker logs neurecore-prometheus --tail 50
docker logs neurecore-alertmanager --tail 50
docker logs neurecore-grafana --tail 50

# Restart stack
cd /opt/neurecore/observability
docker compose restart

# Full restart
docker compose down
docker compose up -d

# View compose status
docker compose ps
```

---

## Related Documents

- `02-monitoring.md` — Monitoring details, dashboards
