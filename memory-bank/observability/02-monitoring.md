# Observability — Monitoring

**Last Updated:** 2026-06-30
**Last Verified:** 2026-06-30
**Audience:** DevOps, SRE, engineers

---

## Key Metrics

### AI Action Metrics

| Metric | Type | Labels | Description |
|---|---|---|---|
| `neurecore_ai_action_invocations_total` | Counter | status, actionId | Total AI action calls |
| `neurecore_ai_action_duration_seconds` | Histogram | actionId | Action latency |
| `neurecore_ai_action_tokens_total` | Counter | direction, actionId | Token usage (input/output) |
| `neurecore_ai_action_cost_usd_total` | Counter | model, actionId | Cost in USD |
| `neurecore_ai_action_errors_total` | Counter | actionId, errorType | Error count |

### Node.js Metrics

Standard Node.js metrics via prom-client:
- CPU usage
- Memory usage
- Event loop lag
- GC stats

---

## Alert Rules

| Alert | Severity | Trigger | Action |
|---|---|---|---|
| `AIActionSingleInvocationTooLarge` | Critical | >10K tokens in 5m | Investigate |
| `AIActionCostCapApproaching` | Warning | >$1/hour per action | Monitor |
| `AIActionErrorRateHigh` | Critical | >10% errors in 5m | Investigate |
| `BackendMetricsScrapeFailing` | Critical | Prometheus can't scrape 5m | Check backend |
| `AIActionLatencyHigh` | Warning | p95 >30s for 10m | Investigate |

---

## Dashboards

### AI Action Latency
- p50, p95, p99 latency per action
- Latency trend over time

### AI Action Tokens
- Total tokens per action
- Input vs output breakdown
- Token trend

### AI Action Cost
- Cost per action
- Cumulative cost
- Cost trend

### AI Action Errors
- Error rate per action
- Error types breakdown
- Error trend

---

## Query Examples

### Invocations by Status

```promql
sum(neurecore_ai_action_invocations_total) by (status)
```

### Latency Percentiles

```promql
histogram_quantile(0.95, neurecore_ai_action_duration_seconds)
```

### Cost per Action

```promql
sum(neurecore_ai_action_cost_usd_total) by (actionId)
```

### Error Rate

```promql
sum(rate(neurecore_ai_action_errors_total[5m])) by (actionId)
/
sum(rate(neurecore_ai_action_invocations_total[5m])) by (actionId)
```

---

## Grafana Access

```
URL: http://127.0.0.1:3200
Username: admin
Password: neurecore-obs-2026
```

---

## Related Documents

- `01-observability.md` — Stack overview
