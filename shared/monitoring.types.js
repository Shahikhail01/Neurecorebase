"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricType = exports.HealthCheckStatus = exports.HealthStatus = void 0;
var HealthStatus;
(function (HealthStatus) {
    HealthStatus["HEALTHY"] = "healthy";
    HealthStatus["DEGRADED"] = "degraded";
    HealthStatus["UNHEALTHY"] = "unhealthy";
    HealthStatus["UNKNOWN"] = "unknown";
})(HealthStatus || (exports.HealthStatus = HealthStatus = {}));
var HealthCheckStatus;
(function (HealthCheckStatus) {
    HealthCheckStatus["PASS"] = "pass";
    HealthCheckStatus["FAIL"] = "fail";
    HealthCheckStatus["WARN"] = "warn";
})(HealthCheckStatus || (exports.HealthCheckStatus = HealthCheckStatus = {}));
var MetricType;
(function (MetricType) {
    MetricType["COUNTER"] = "counter";
    MetricType["GAUGE"] = "gauge";
    MetricType["HISTOGRAM"] = "histogram";
    MetricType["SUMMARY"] = "summary";
})(MetricType || (exports.MetricType = MetricType = {}));
//# sourceMappingURL=monitoring.types.js.map