export declare enum HealthStatus {
    HEALTHY = "healthy",
    DEGRADED = "degraded",
    UNHEALTHY = "unhealthy",
    UNKNOWN = "unknown"
}
export declare enum HealthCheckStatus {
    PASS = "pass",
    FAIL = "fail",
    WARN = "warn"
}
export interface HealthCheckResult {
    name: string;
    status: HealthCheckStatus;
    message?: string;
    duration?: number;
    metadata?: Record<string, unknown>;
    timestamp: string;
}
export interface HealthResponse {
    status: HealthStatus;
    timestamp: string;
    duration?: number;
    checks: Record<string, HealthCheckResult>;
    version?: string;
    build?: {
        version: string;
        timestamp: string;
        environment: string;
    };
}
export interface DatabaseHealthResult extends HealthCheckResult {
    name: "database";
    metadata?: {
        type: string;
        database?: string;
        activeConnections?: number;
        maxConnections?: number;
        queryLatency?: number;
        readOnly?: boolean;
    };
}
export interface CacheHealthResult extends HealthCheckResult {
    name: "cache";
    metadata?: {
        type: string;
        isUpstash?: boolean;
        memoryUsage?: number;
        connectedClients?: number;
        hitRate?: number;
        latency?: number;
    };
}
export interface ExternalServiceHealthResult extends HealthCheckResult {
    name: string;
    metadata?: {
        url?: string;
        statusCode?: number;
        responseTime?: number;
        circuitOpen?: boolean;
        failures?: number;
    };
}
export interface ApplicationHealthResult extends HealthCheckResult {
    name: "application";
    metadata?: {
        uptime: number;
        activeRequests?: number;
        memoryUsage?: {
            heapUsed: number;
            heapTotal: number;
            external: number;
            rss: number;
        };
        cpuUsage?: number;
        eventLoopLag?: number;
    };
}
export declare enum MetricType {
    COUNTER = "counter",
    GAUGE = "gauge",
    HISTOGRAM = "histogram",
    SUMMARY = "summary"
}
export interface PrometheusMetric {
    name: string;
    help: string;
    type: MetricType;
    values: PrometheusMetricValue[];
}
export interface PrometheusMetricValue {
    value: number;
    labels?: Record<string, string>;
    timestamp?: number;
}
export interface RequestStats {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    requestsByStatus: Record<number, number>;
    avgResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
    p50ResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    requestsPerSecond: number;
}
export interface SystemMetrics {
    cpu: {
        usage: number;
        cores: number;
    };
    memory: {
        used: number;
        total: number;
        percentage: number;
    };
    eventLoop: {
        lag: number;
    };
    heap: {
        used: number;
        total: number;
        percentage: number;
    };
    external: number;
    rss: number;
    timestamp: string;
}
export interface BusinessMetrics {
    activeTenants: number;
    activeUsers: number;
    totalApiCalls: number;
    apiCallsLastHour: number;
    avgApiLatency: number;
    errorRate: number;
}
export interface HealthCheckConfig {
    enabled: boolean;
    timeout?: number;
    interval?: number;
    criticalThreshold?: number;
    warningThreshold?: number;
}
export interface CircuitBreakerConfig {
    failureThreshold: number;
    resetTimeout: number;
    halfOpenMaxAttempts: number;
    enabled: boolean;
}
export interface AlertConfig {
    name: string;
    metric: string;
    condition: "above" | "below" | "equals";
    threshold: number;
    severity: "info" | "warning" | "critical";
    enabled: boolean;
}
export interface MonitoringConfig {
    health: {
        database: HealthCheckConfig;
        cache: HealthCheckConfig;
        external: HealthCheckConfig;
        application: HealthCheckConfig;
    };
    circuitBreaker: {
        [serviceName: string]: CircuitBreakerConfig;
    };
    alerts: AlertConfig[];
    metricsInterval?: number;
}
export interface MetricsResponse {
    metrics: string;
    timestamp: string;
}
export interface DetailedHealthResponse extends HealthResponse {
    system?: SystemMetrics;
    business?: BusinessMetrics;
}
export type HealthCheckFunction = () => Promise<HealthCheckResult> | HealthCheckResult;
export type MetricsCollector = () => Promise<Record<string, number>> | Record<string, number>;
