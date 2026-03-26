export declare const ErrorCode: {
    readonly VALIDATION_ERROR: "VALIDATION_ERROR";
    readonly INVALID_REQUEST: "INVALID_REQUEST";
    readonly INVALID_PARAMETER: "INVALID_PARAMETER";
    readonly MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD";
    readonly INVALID_FORMAT: "INVALID_FORMAT";
    readonly AUTHENTICATION_FAILED: "AUTHENTICATION_FAILED";
    readonly TOKEN_EXPIRED: "TOKEN_EXPIRED";
    readonly TOKEN_INVALID: "TOKEN_INVALID";
    readonly REFRESH_TOKEN_EXPIRED: "REFRESH_TOKEN_EXPIRED";
    readonly CREDENTIALS_INVALID: "CREDENTIALS_INVALID";
    readonly ACCOUNT_LOCKED: "ACCOUNT_LOCKED";
    readonly ACCOUNT_DISABLED: "ACCOUNT_DISABLED";
    readonly MFA_REQUIRED: "MFA_REQUIRED";
    readonly MFA_INVALID: "MFA_INVALID";
    readonly PERMISSION_DENIED: "PERMISSION_DENIED";
    readonly FORBIDDEN: "FORBIDDEN";
    readonly INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS";
    readonly RESOURCE_ACCESS_DENIED: "RESOURCE_ACCESS_DENIED";
    readonly NOT_FOUND: "NOT_FOUND";
    readonly USER_NOT_FOUND: "USER_NOT_FOUND";
    readonly RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND";
    readonly ENDPOINT_NOT_FOUND: "ENDPOINT_NOT_FOUND";
    readonly CONFLICT: "CONFLICT";
    readonly DUPLICATE_ENTRY: "DUPLICATE_ENTRY";
    readonly RESOURCE_ALREADY_EXISTS: "RESOURCE_ALREADY_EXISTS";
    readonly VERSION_CONFLICT: "VERSION_CONFLICT";
    readonly RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED";
    readonly QUOTA_EXCEEDED: "QUOTA_EXCEEDED";
    readonly BUSINESS_RULE_VIOLATION: "BUSINESS_RULE_VIOLATION";
    readonly INSUFFICIENT_BALANCE: "INSUFFICIENT_BALANCE";
    readonly PLAN_LIMIT_REACHED: "PLAN_LIMIT_REACHED";
    readonly OPERATION_NOT_ALLOWED: "OPERATION_NOT_ALLOWED";
    readonly WORKFLOW_ERROR: "WORKFLOW_ERROR";
    readonly EXTERNAL_SERVICE_ERROR: "EXTERNAL_SERVICE_ERROR";
    readonly THIRD_PARTY_API_ERROR: "THIRD_PARTY_API_ERROR";
    readonly PAYMENT_GATEWAY_ERROR: "PAYMENT_GATEWAY_ERROR";
    readonly EMAIL_SERVICE_ERROR: "EMAIL_SERVICE_ERROR";
    readonly DATABASE_ERROR: "DATABASE_ERROR";
    readonly RECORD_NOT_FOUND: "RECORD_NOT_FOUND";
    readonly UNIQUE_CONSTRAINT_VIOLATION: "UNIQUE_CONSTRAINT_VIOLATION";
    readonly FOREIGN_KEY_VIOLATION: "FOREIGN_KEY_VIOLATION";
    readonly INTERNAL_ERROR: "INTERNAL_ERROR";
    readonly SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE";
    readonly MAINTENANCE_MODE: "MAINTENANCE_MODE";
    readonly FEATURE_NOT_IMPLEMENTED: "FEATURE_NOT_IMPLEMENTED";
    readonly CIRCUIT_BREAKER_OPEN: "CIRCUIT_BREAKER_OPEN";
    readonly CIRCUIT_BREAKER_HALF_OPEN: "CIRCUIT_BREAKER_HALF_OPEN";
};
export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];
export declare enum ErrorCategory {
    VALIDATION = "VALIDATION",
    AUTHENTICATION = "AUTHENTICATION",
    AUTHORIZATION = "AUTHORIZATION",
    NOT_FOUND = "NOT_FOUND",
    CONFLICT = "CONFLICT",
    RATE_LIMIT = "RATE_LIMIT",
    BUSINESS_LOGIC = "BUSINESS_LOGIC",
    EXTERNAL_SERVICE = "EXTERNAL_SERVICE",
    DATABASE = "DATABASE",
    INTERNAL = "INTERNAL"
}
export declare const ErrorCodeCategoryMap: Record<ErrorCodeType, ErrorCategory>;
export interface ApiError {
    code: ErrorCodeType;
    message: string;
    details?: Record<string, unknown>;
    timestamp?: string;
    requestId?: string;
}
export interface DetailedApiError extends ApiError {
    category: ErrorCategory;
    statusCode: number;
    isOperational: boolean;
    stack?: string;
    correlationId?: string;
    userId?: string;
    tenantId?: string;
    metadata?: Record<string, unknown>;
}
export interface ApiErrorResponse {
    status: "error";
    error: ApiError;
    meta: {
        timestamp: string;
        requestId: string;
        version?: string;
    };
}
export interface ApiSuccessResponse<T> {
    status: "success";
    data: T;
    meta: {
        timestamp: string;
        requestId?: string;
    };
}
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;
export declare enum ErrorSeverity {
    DEBUG = "debug",
    INFO = "info",
    WARNING = "warning",
    ERROR = "error",
    CRITICAL = "critical"
}
export declare const CategoryToSeverity: Record<ErrorCategory, ErrorSeverity>;
export declare const ErrorCodeToStatusCode: Record<ErrorCodeType, number>;
export declare const UserFriendlyMessages: Partial<Record<ErrorCodeType, string>>;
export declare function getUserFriendlyMessage(code: ErrorCodeType): string;
