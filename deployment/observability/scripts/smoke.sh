#!/usr/bin/env bash
# Observability smoke test — runs after `docker compose up` on Contabo.
# Verifies every link in the metrics chain.

set -u

PROM=${PROM_URL:-http://127.0.0.1:9090}
GRAF=${GRAF_URL:-http://127.0.0.1:3200}
ALERT=${ALERT_URL:-http://127.0.0.1:9093}
BACKEND=${BACKEND_URL:-http://127.0.0.1:3003}
METRICS_PATH=${METRICS_PATH:-/api/metrics}

PASS=0
FAIL=0
declare -a FAILURES

check() {
  local name=$1; shift
  if "$@" >/dev/null 2>&1; then
    echo "  ✓ $name"
    PASS=$((PASS + 1))
  else
    echo "  ✗ $name"
    FAIL=$((FAIL + 1))
    FAILURES+=("$name")
  fi
}

http_status() {
  curl -s -o /dev/null -w '%{http_code}' "$1"
}

http_status_auth() {
  curl -s -o /dev/null -w '%{http_code}' -u "${GRAF_AUTH:-admin:neurecore-obs-2026}" "$1"
}

echo "→ Prometheus"
check "Prometheus is up"            test "$(http_status $PROM/-/ready)" = "200"
check "Prometheus scrapes backend"  test "$(http_status $PROM/api/v1/query?query=up)" = "200"
check "Backend /api/metrics reachable"  test "$(http_status $BACKEND$METRICS_PATH)" = "200"

echo "→ Alertmanager"
check "Alertmanager is up"          test "$(http_status $ALERT/-/ready)" = "200"

echo "→ Grafana"
check "Grafana is healthy"          test "$(http_status $GRAF/api/health)" = "200"
check "Grafana datasource loaded"  test "$(http_status_auth $GRAF/api/datasources)" = "200"
check "Grafana dashboards loaded"  test "$(http_status_auth $GRAF/api/search?folderIds=NeureCore)" = "200"

echo "→ Alert rules loaded"
RULES=$(curl -s $PROM/api/v1/rules | grep -c 'neurecore-ai-actions')
check "neurecore-ai-actions rules loaded" test "$RULES" -gt "0"

echo ""
echo "PASS: $PASS"
echo "FAIL: $FAIL"
if [ "$FAIL" -gt 0 ]; then
  echo ""
  echo "Failed checks:"
  for f in "${FAILURES[@]}"; do
    echo "  - $f"
  done
  exit 1
fi
echo "All checks passed ✓"