/**
 * Shared Error Types for NeureCore
 *
 * This module provides a comprehensive error type system that can be used
 * across both backend and frontend applications.
 *
 * Following SOLID principles:
 * - Single Responsibility: Each error type has a specific purpose
 * - Open/Closed: New error types can be added through extension
 */

// ============================================
// ERROR CODE ENUMERATION
// ============================================

/**
 * Centralized error codes for the entire application
 * Organized by category for easy debugging and logging
 */
export const ErrorCode = {
  // Validation Errors (1xxx)
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_REQUEST: "INVALID_REQUEST",
  INVALID_PARAMETER: "INVALID_PARAMETER",
  MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD",
  INVALID_FORMAT: "INVALID_FORMAT",

  // Authentication Errors (2xxx)
  AUTHENTICATION_FAILED: "AUTHENTICATION_FAILED",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  TOKEN_INVALID: "TOKEN_INVALID",
  REFRESH_TOKEN_EXPIRED: "REFRESH_TOKEN_EXPIRED",
  CREDENTIALS_INVALID: "CREDENTIALS_INVALID",
  ACCOUNT_LOCKED: "ACCOUNT_LOCKED",
  ACCOUNT_DISABLED: "ACCOUNT_DISABLED",
  MFA_REQUIRED: "MFA_REQUIRED",
  MFA_INVALID: "MFA_INVALID",

  // Authorization Errors (3xxx)
  PERMISSION_DENIED: "PERMISSION_DENIED",
  FORBIDDEN: "FORBIDDEN",
  INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS",
  RESOURCE_ACCESS_DENIED: "RESOURCE_ACCESS_DENIED",

  // Not Found Errors (4xxx)
  NOT_FOUND: "NOT_FOUND",
  USER_NOT_FOUND: "USER_NOT_FOUND",
  RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND",
  ENDPOINT_NOT_FOUND: "ENDPOINT_NOT_FOUND",

  // Conflict Errors (5xxx)
  CONFLICT: "CONFLICT",
  DUPLICATE_ENTRY: "DUPLICATE_ENTRY",
  RESOURCE_ALREADY_EXISTS: "RESOURCE_ALREADY_EXISTS",
  VERSION_CONFLICT: "VERSION_CONFLICT",

  // Rate Limiting (6xxx)
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  QUOTA_EXCEEDED: "QUOTA_EXCEEDED",

  // Business Logic Errors (7xxx)
  BUSINESS_RULE_VIOLATION: "BUSINESS_RULE_VIOLATION",
  INSUFFICIENT_BALANCE: "INSUFFICIENT_BALANCE",
  PLAN_LIMIT_REACHED: "PLAN_LIMIT_REACHED",
  OPERATION_NOT_ALLOWED: "OPERATION_NOT_ALLOWED",
  WORKFLOW_ERROR: "WORKFLOW_ERROR",

  // External Service Errors (8xxx)
  EXTERNAL_SERVICE_ERROR: "EXTERNAL_SERVICE_ERROR",
  THIRD_PARTY_API_ERROR: "THIRD_PARTY_API_ERROR",
  PAYMENT_GATEWAY_ERROR: "PAYMENT_GATEWAY_ERROR",
  EMAIL_SERVICE_ERROR: "EMAIL_SERVICE_ERROR",

  // Database Errors (9xxx)
  DATABASE_ERROR: "DATABASE_ERROR",
  RECORD_NOT_FOUND: "RECORD_NOT_FOUND",
  UNIQUE_CONSTRAINT_VIOLATION: "UNIQUE_CONSTRAINT_VIOLATION",
  FOREIGN_KEY_VIOLATION: "FOREIGN_KEY_VIOLATION",

  // Server Errors (10xxx)
  INTERNAL_ERROR: "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  MAINTENANCE_MODE: "MAINTENANCE_MODE",
  FEATURE_NOT_IMPLEMENTED: "FEATURE_NOT_IMPLEMENTED",

  // Circuit Breaker (11xxx)
  CIRCUIT_BREAKER_OPEN: "CIRCUIT_BREAKER_OPEN",
  CIRCUIT_BREAKER_HALF_OPEN: "CIRCUIT_BREAKER_HALF_OPEN",
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

// ============================================
// ERROR CATEGORIES
// ============================================

/**
 * Error categories for high-level classification
 */
export enum ErrorCategory {
  VALIDATION = "VALIDATION",
  AUTHENTICATION = "AUTHENTICATION",
  AUTHORIZATION = "AUTHORIZATION",
  NOT_FOUND = "NOT_FOUND",
  CONFLICT = "CONFLICT",
  RATE_LIMIT = "RATE_LIMIT",
  BUSINESS_LOGIC = "BUSINESS_LOGIC",
  EXTERNAL_SERVICE = "EXTERNAL_SERVICE",
  DATABASE = "DATABASE",
  INTERNAL = "INTERNAL",
}

/**
 * Maps error codes to their categories
 */
export const ErrorCodeCategoryMap: Record<ErrorCodeType, ErrorCategory> = {
  // Validation
  [ErrorCode.VALIDATION_ERROR]: ErrorCategory.VALIDATION,
  [ErrorCode.INVALID_REQUEST]: ErrorCategory.VALIDATION,
  [ErrorCode.INVALID_PARAMETER]: ErrorCategory.VALIDATION,
  [ErrorCode.MISSING_REQUIRED_FIELD]: ErrorCategory.VALIDATION,
  [ErrorCode.INVALID_FORMAT]: ErrorCategory.VALIDATION,

  // Authentication
  [ErrorCode.AUTHENTICATION_FAILED]: ErrorCategory.AUTHENTICATION,
  [ErrorCode.TOKEN_EXPIRED]: ErrorCategory.AUTHENTICATION,
  [ErrorCode.TOKEN_INVALID]: ErrorCategory.AUTHENTICATION,
  [ErrorCode.REFRESH_TOKEN_EXPIRED]: ErrorCategory.AUTHENTICATION,
  [ErrorCode.CREDENTIALS_INVALID]: ErrorCategory.AUTHENTICATION,
  [ErrorCode.ACCOUNT_LOCKED]: ErrorCategory.AUTHENTICATION,
  [ErrorCode.ACCOUNT_DISABLED]: ErrorCategory.AUTHENTICATION,
  [ErrorCode.MFA_REQUIRED]: ErrorCategory.AUTHENTICATION,
  [ErrorCode.MFA_INVALID]: ErrorCategory.AUTHENTICATION,

  // Authorization
  [ErrorCode.PERMISSION_DENIED]: ErrorCategory.AUTHORIZATION,
  [ErrorCode.FORBIDDEN]: ErrorCategory.AUTHORIZATION,
  [ErrorCode.INSUFFICIENT_PERMISSIONS]: ErrorCategory.AUTHORIZATION,
  [ErrorCode.RESOURCE_ACCESS_DENIED]: ErrorCategory.AUTHORIZATION,

  // Not Found
  [ErrorCode.NOT_FOUND]: ErrorCategory.NOT_FOUND,
  [ErrorCode.USER_NOT_FOUND]: ErrorCategory.NOT_FOUND,
  [ErrorCode.RESOURCE_NOT_FOUND]: ErrorCategory.NOT_FOUND,
  [ErrorCode.ENDPOINT_NOT_FOUND]: ErrorCategory.NOT_FOUND,

  // Conflict
  [ErrorCode.CONFLICT]: ErrorCategory.CONFLICT,
  [ErrorCode.DUPLICATE_ENTRY]: ErrorCategory.CONFLICT,
  [ErrorCode.RESOURCE_ALREADY_EXISTS]: ErrorCategory.CONFLICT,
  [ErrorCode.VERSION_CONFLICT]: ErrorCategory.CONFLICT,

  // Rate Limiting
  [ErrorCode.RATE_LIMIT_EXCEEDED]: ErrorCategory.RATE_LIMIT,
  [ErrorCode.QUOTA_EXCEEDED]: ErrorCategory.RATE_LIMIT,

  // Business Logic
  [ErrorCode.BUSINESS_RULE_VIOLATION]: ErrorCategory.BUSINESS_LOGIC,
  [ErrorCode.INSUFFICIENT_BALANCE]: ErrorCategory.BUSINESS_LOGIC,
  [ErrorCode.PLAN_LIMIT_REACHED]: ErrorCategory.BUSINESS_LOGIC,
  [ErrorCode.OPERATION_NOT_ALLOWED]: ErrorCategory.BUSINESS_LOGIC,
  [ErrorCode.WORKFLOW_ERROR]: ErrorCategory.BUSINESS_LOGIC,

  // External Service
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: ErrorCategory.EXTERNAL_SERVICE,
  [ErrorCode.THIRD_PARTY_API_ERROR]: ErrorCategory.EXTERNAL_SERVICE,
  [ErrorCode.PAYMENT_GATEWAY_ERROR]: ErrorCategory.EXTERNAL_SERVICE,
  [ErrorCode.EMAIL_SERVICE_ERROR]: ErrorCategory.EXTERNAL_SERVICE,

  // Database
  [ErrorCode.DATABASE_ERROR]: ErrorCategory.DATABASE,
  [ErrorCode.RECORD_NOT_FOUND]: ErrorCategory.DATABASE,
  [ErrorCode.UNIQUE_CONSTRAINT_VIOLATION]: ErrorCategory.DATABASE,
  [ErrorCode.FOREIGN_KEY_VIOLATION]: ErrorCategory.DATABASE,

  // Server Errors
  [ErrorCode.INTERNAL_ERROR]: ErrorCategory.INTERNAL,
  [ErrorCode.SERVICE_UNAVAILABLE]: ErrorCategory.INTERNAL,
  [ErrorCode.MAINTENANCE_MODE]: ErrorCategory.INTERNAL,
  [ErrorCode.FEATURE_NOT_IMPLEMENTED]: ErrorCategory.INTERNAL,

  // Circuit Breaker
  [ErrorCode.CIRCUIT_BREAKER_OPEN]: ErrorCategory.EXTERNAL_SERVICE,
  [ErrorCode.CIRCUIT_BREAKER_HALF_OPEN]: ErrorCategory.EXTERNAL_SERVICE,
};

// ============================================
// ERROR INTERFACES
// ============================================

/**
 * Base interface for all API errors
 */
export interface ApiError {
  code: ErrorCodeType;
  message: string;
  details?: Record<string, unknown>;
  timestamp?: string;
  requestId?: string;
}

/**
 * Extended error with additional context for debugging
 */
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

/**
 * Error response structure returned by the API
 */
export interface ApiErrorResponse {
  status: "error";
  error: ApiError;
  meta: {
    timestamp: string;
    requestId: string;
    version?: string;
  };
}

/**
 * Success response structure
 */
export interface ApiSuccessResponse<T> {
  status: "success";
  data: T;
  meta: {
    timestamp: string;
    requestId?: string;
  };
}

/**
 * Unified API response type
 */
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// ============================================
// ERROR SEVERITY LEVELS
// ============================================

/**
 * Error severity levels for logging and monitoring
 */
export enum ErrorSeverity {
  DEBUG = "debug",
  INFO = "info",
  WARNING = "warning",
  ERROR = "error",
  CRITICAL = "critical",
}

/**
 * Maps error categories to severity levels
 */
export const CategoryToSeverity: Record<ErrorCategory, ErrorSeverity> = {
  [ErrorCategory.VALIDATION]: ErrorSeverity.INFO,
  [ErrorCategory.AUTHENTICATION]: ErrorSeverity.WARNING,
  [ErrorCategory.AUTHORIZATION]: ErrorSeverity.WARNING,
  [ErrorCategory.NOT_FOUND]: ErrorSeverity.INFO,
  [ErrorCategory.CONFLICT]: ErrorSeverity.WARNING,
  [ErrorCategory.RATE_LIMIT]: ErrorSeverity.WARNING,
  [ErrorCategory.BUSINESS_LOGIC]: ErrorSeverity.WARNING,
  [ErrorCategory.EXTERNAL_SERVICE]: ErrorSeverity.ERROR,
  [ErrorCategory.DATABASE]: ErrorSeverity.ERROR,
  [ErrorCategory.INTERNAL]: ErrorSeverity.CRITICAL,
};

// ============================================
// HTTP STATUS CODE MAPPING
// ============================================

/**
 * Maps error codes to HTTP status codes
 */
export const ErrorCodeToStatusCode: Record<ErrorCodeType, number> = {
  // Validation (4xx)
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.INVALID_REQUEST]: 400,
  [ErrorCode.INVALID_PARAMETER]: 400,
  [ErrorCode.MISSING_REQUIRED_FIELD]: 400,
  [ErrorCode.INVALID_FORMAT]: 400,

  // Authentication (401)
  [ErrorCode.AUTHENTICATION_FAILED]: 401,
  [ErrorCode.TOKEN_EXPIRED]: 401,
  [ErrorCode.TOKEN_INVALID]: 401,
  [ErrorCode.REFRESH_TOKEN_EXPIRED]: 401,
  [ErrorCode.CREDENTIALS_INVALID]: 401,
  [ErrorCode.ACCOUNT_LOCKED]: 401,
  [ErrorCode.ACCOUNT_DISABLED]: 401,
  [ErrorCode.MFA_REQUIRED]: 401,
  [ErrorCode.MFA_INVALID]: 401,

  // Authorization (403)
  [ErrorCode.PERMISSION_DENIED]: 403,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.INSUFFICIENT_PERMISSIONS]: 403,
  [ErrorCode.RESOURCE_ACCESS_DENIED]: 403,

  // Not Found (404)
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.USER_NOT_FOUND]: 404,
  [ErrorCode.RESOURCE_NOT_FOUND]: 404,
  [ErrorCode.ENDPOINT_NOT_FOUND]: 404,

  // Conflict (409)
  [ErrorCode.CONFLICT]: 409,
  [ErrorCode.DUPLICATE_ENTRY]: 409,
  [ErrorCode.RESOURCE_ALREADY_EXISTS]: 409,
  [ErrorCode.VERSION_CONFLICT]: 409,

  // Rate Limiting (429)
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 429,
  [ErrorCode.QUOTA_EXCEEDED]: 429,

  // Business Logic (400)
  [ErrorCode.BUSINESS_RULE_VIOLATION]: 400,
  [ErrorCode.INSUFFICIENT_BALANCE]: 400,
  [ErrorCode.PLAN_LIMIT_REACHED]: 400,
  [ErrorCode.OPERATION_NOT_ALLOWED]: 400,
  [ErrorCode.WORKFLOW_ERROR]: 400,

  // External Service (502)
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 502,
  [ErrorCode.THIRD_PARTY_API_ERROR]: 502,
  [ErrorCode.PAYMENT_GATEWAY_ERROR]: 502,
  [ErrorCode.EMAIL_SERVICE_ERROR]: 502,

  // Database (500)
  [ErrorCode.DATABASE_ERROR]: 500,
  [ErrorCode.RECORD_NOT_FOUND]: 500,
  [ErrorCode.UNIQUE_CONSTRAINT_VIOLATION]: 500,
  [ErrorCode.FOREIGN_KEY_VIOLATION]: 500,

  // Server Errors (5xx)
  [ErrorCode.INTERNAL_ERROR]: 500,
  [ErrorCode.SERVICE_UNAVAILABLE]: 503,
  [ErrorCode.MAINTENANCE_MODE]: 503,
  [ErrorCode.FEATURE_NOT_IMPLEMENTED]: 501,

  // Circuit Breaker (503)
  [ErrorCode.CIRCUIT_BREAKER_OPEN]: 503,
  [ErrorCode.CIRCUIT_BREAKER_HALF_OPEN]: 503,
};

// ============================================
// USER-FRIENDLY ERROR MESSAGES
// ============================================

/**
 * User-friendly error messages for display in the UI
 */
export const UserFriendlyMessages: Partial<Record<ErrorCodeType, string>> = {
  // Authentication
  [ErrorCode.AUTHENTICATION_FAILED]:
    "Invalid credentials. Please check your email and password.",
  [ErrorCode.TOKEN_EXPIRED]: "Your session has expired. Please log in again.",
  [ErrorCode.TOKEN_INVALID]: "Session invalid. Please log in again.",
  [ErrorCode.REFRESH_TOKEN_EXPIRED]:
    "Your session has expired. Please log in again.",
  [ErrorCode.CREDENTIALS_INVALID]: "Invalid email or password.",
  [ErrorCode.ACCOUNT_LOCKED]:
    "Your account has been locked. Please contact support.",
  [ErrorCode.ACCOUNT_DISABLED]:
    "Your account has been disabled. Please contact support.",

  // Authorization
  [ErrorCode.PERMISSION_DENIED]:
    "You don't have permission to perform this action.",
  [ErrorCode.FORBIDDEN]: "Access denied.",
  [ErrorCode.INSUFFICIENT_PERMISSIONS]:
    "You don't have the required permissions.",

  // Not Found
  [ErrorCode.NOT_FOUND]: "The requested resource was not found.",
  [ErrorCode.USER_NOT_FOUND]: "User not found.",
  [ErrorCode.RESOURCE_NOT_FOUND]: "The requested resource was not found.",

  // Conflict
  [ErrorCode.DUPLICATE_ENTRY]: "This item already exists.",
  [ErrorCode.RESOURCE_ALREADY_EXISTS]: "This resource already exists.",

  // Rate Limiting
  [ErrorCode.RATE_LIMIT_EXCEEDED]: "Too many requests. Please try again later.",
  [ErrorCode.QUOTA_EXCEEDED]: "You have exceeded your quota.",

  // Business Logic
  [ErrorCode.INSUFFICIENT_BALANCE]: "Insufficient balance for this operation.",
  [ErrorCode.PLAN_LIMIT_REACHED]: "You have reached your plan limit.",
  [ErrorCode.OPERATION_NOT_ALLOWED]: "This operation is not allowed.",

  // Server Errors
  [ErrorCode.INTERNAL_ERROR]: "Something went wrong. Please try again later.",
  [ErrorCode.SERVICE_UNAVAILABLE]:
    "Service temporarily unavailable. Please try again later.",
  [ErrorCode.MAINTENANCE_MODE]:
    "System is under maintenance. Please try again later.",
};

/**
 * Get user-friendly message for an error code
 */
export function getUserFriendlyMessage(code: ErrorCodeType): string {
  return (
    UserFriendlyMessages[code] ??
    "An unexpected error occurred. Please try again."
  );
}
