/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Security Types - Shared TypeScript Interfaces
 * ═══════════════════════════════════════════════════════════════════════════
 * Type-safe security interfaces following SOLID principles.
 * Used by both backend and frontend applications.
 */

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Permission Types
 * ═══════════════════════════════════════════════════════════════════════════
 */

export enum Permission {
  // User Management
  USER_CREATE = 'user:create',
  USER_READ = 'user:read',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  USER_LIST = 'user:list',

  // Tenant Management
  TENANT_CREATE = 'tenant:create',
  TENANT_READ = 'tenant:read',
  TENANT_UPDATE = 'tenant:update',
  TENANT_DELETE = 'tenant:delete',
  TENANT_LIST = 'tenant:list',

  // Department Management
  DEPARTMENT_CREATE = 'department:create',
  DEPARTMENT_READ = 'department:read',
  DEPARTMENT_UPDATE = 'department:update',
  DEPARTMENT_DELETE = 'department:delete',

  // Agent Management
  AGENT_CREATE = 'agent:create',
  AGENT_READ = 'agent:read',
  AGENT_UPDATE = 'agent:update',
  AGENT_DELETE = 'agent:delete',
  AGENT_EXECUTE = 'agent:execute',

  // Tool Management
  TOOL_CREATE = 'tool:create',
  TOOL_READ = 'tool:read',
  TOOL_UPDATE = 'tool:update',
  TOOL_DELETE = 'tool:delete',
  TOOL_EXECUTE = 'tool:execute',

  // Audit & Compliance
  AUDIT_READ = 'audit:read',
  AUDIT_EXPORT = 'audit:export',

  // Settings
  SETTINGS_READ = 'settings:read',
  SETTINGS_UPDATE = 'settings:update',

  // Analytics
  ANALYTICS_READ = 'analytics:read',
  ANALYTICS_EXPORT = 'analytics:export',

  // Billing
  BILLING_READ = 'billing:read',
  BILLING_MANAGE = 'billing:manage',

  // File Upload
  FILE_UPLOAD = 'file:upload',
  FILE_DELETE = 'file:delete',
}

export type PermissionKey = keyof typeof Permission;
export type PermissionValue = (typeof Permission)[PermissionKey];

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Role Types
 * ═══════════════════════════════════════════════════════════════════════════
 */

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  USER = 'USER',
  GUEST = 'GUEST',
}

/**
 * Role to Permission mapping
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: Object.values(Permission),
  [UserRole.OWNER]: [
    Permission.USER_CREATE,
    Permission.USER_READ,
    Permission.USER_UPDATE,
    Permission.USER_DELETE,
    Permission.USER_LIST,
    Permission.TENANT_READ,
    Permission.TENANT_UPDATE,
    Permission.DEPARTMENT_CREATE,
    Permission.DEPARTMENT_READ,
    Permission.DEPARTMENT_UPDATE,
    Permission.DEPARTMENT_DELETE,
    Permission.AGENT_CREATE,
    Permission.AGENT_READ,
    Permission.AGENT_UPDATE,
    Permission.AGENT_DELETE,
    Permission.AGENT_EXECUTE,
    Permission.TOOL_CREATE,
    Permission.TOOL_READ,
    Permission.TOOL_UPDATE,
    Permission.TOOL_DELETE,
    Permission.TOOL_EXECUTE,
    Permission.AUDIT_READ,
    Permission.AUDIT_EXPORT,
    Permission.SETTINGS_READ,
    Permission.SETTINGS_UPDATE,
    Permission.ANALYTICS_READ,
    Permission.ANALYTICS_EXPORT,
    Permission.BILLING_READ,
    Permission.BILLING_MANAGE,
    Permission.FILE_UPLOAD,
    Permission.FILE_DELETE,
  ],
  [UserRole.ADMIN]: [
    Permission.USER_CREATE,
    Permission.USER_READ,
    Permission.USER_UPDATE,
    Permission.USER_DELETE,
    Permission.USER_LIST,
    Permission.DEPARTMENT_CREATE,
    Permission.DEPARTMENT_READ,
    Permission.DEPARTMENT_UPDATE,
    Permission.DEPARTMENT_DELETE,
    Permission.AGENT_CREATE,
    Permission.AGENT_READ,
    Permission.AGENT_UPDATE,
    Permission.AGENT_DELETE,
    Permission.AGENT_EXECUTE,
    Permission.TOOL_CREATE,
    Permission.TOOL_READ,
    Permission.TOOL_UPDATE,
    Permission.TOOL_DELETE,
    Permission.TOOL_EXECUTE,
    Permission.AUDIT_READ,
    Permission.SETTINGS_READ,
    Permission.SETTINGS_UPDATE,
    Permission.ANALYTICS_READ,
    Permission.ANALYTICS_EXPORT,
    Permission.BILLING_READ,
    Permission.FILE_UPLOAD,
    Permission.FILE_DELETE,
  ],
  [UserRole.MANAGER]: [
    Permission.USER_READ,
    Permission.USER_LIST,
    Permission.DEPARTMENT_READ,
    Permission.AGENT_READ,
    Permission.AGENT_EXECUTE,
    Permission.TOOL_READ,
    Permission.TOOL_EXECUTE,
    Permission.AUDIT_READ,
    Permission.SETTINGS_READ,
    Permission.ANALYTICS_READ,
    Permission.FILE_UPLOAD,
  ],
  [UserRole.USER]: [
    Permission.USER_READ,
    Permission.AGENT_READ,
    Permission.AGENT_EXECUTE,
    Permission.TOOL_READ,
    Permission.TOOL_EXECUTE,
    Permission.ANALYTICS_READ,
    Permission.FILE_UPLOAD,
  ],
  [UserRole.GUEST]: [Permission.AGENT_READ, Permission.TOOL_READ],
};

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Security Event Types
 * ═══════════════════════════════════════════════════════════════════════════
 */

export enum SecurityEventType {
  // Authentication Events
  LOGIN_SUCCESS = 'auth:login:success',
  LOGIN_FAILED = 'auth:login:failed',
  LOGOUT = 'auth:logout',
  TOKEN_REFRESHED = 'auth:token:refreshed',
  TOKEN_REFRESH_FAILED = 'auth:token:refresh:failed',
  PASSWORD_CHANGED = 'auth:password:changed',
  PASSWORD_RESET_REQUESTED = 'auth:password:reset:requested',
  PASSWORD_RESET_COMPLETED = 'auth:password:reset:completed',

  // Authorization Events
  ACCESS_DENIED = 'auth:access:denied',
  PERMISSION_DENIED = 'auth:permission:denied',
  ROLE_CHANGED = 'auth:role:changed',

  // Rate Limiting Events
  RATE_LIMIT_EXCEEDED = 'security:rate-limit:exceeded',
  RATE_LIMIT_BLOCKED = 'security:rate-limit:blocked',

  // Input Validation Events
  INPUT_VALIDATION_FAILED = 'security:validation:failed',
  SQL_INJECTION_ATTEMPT = 'security:sql-injection:attempt',
  XSS_ATTEMPT = 'security:xss:attempt',
  CSRF_VIOLATION = 'security:csrf:violation',

  // Security Violations
  SUSPICIOUS_REQUEST = 'security:suspicious:request',
  INVALID_TOKEN = 'security:token:invalid',
  TOKEN_EXPIRED = 'security:token:expired',
  ACCOUNT_LOCKED = 'security:account:locked',
  ACCOUNT_UNLOCKED = 'security:account:unlocked',

  // File Upload Events
  FILE_UPLOAD_BLOCKED = 'security:file:blocked',
  MALICIOUS_FILE_DETECTED = 'security:file:malicious',

  // Session Events
  SESSION_CREATED = 'security:session:created',
  SESSION_DESTROYED = 'security:session:destroyed',
  CONCURRENT_SESSION_DETECTED = 'security:session:concurrent',
}

/**
 * Security Event Severity
 */
export enum SecurityEventSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

/**
 * Security Event Interface
 */
export interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  severity: SecurityEventSeverity;
  message: string;
  userId?: string;
  tenantId?: string;
  ipAddress?: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Security Configuration Interfaces
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * JWT Configuration Interface
 */
export interface IJwtConfig {
  secret: string;
  accessExpiresIn: string;
  refreshExpiresIn: string;
  algorithm: 'HS256' | 'HS384' | 'HS512';
  issuer?: string;
  audience?: string;
}

/**
 * Rate Limiting Configuration Interface
 */
export interface IRateLimitConfig {
  ttl: number;
  limit: number;
  authLimit: number;
  apiLimit: number;
  uploadLimit: number;
  storageType: 'memory' | 'redis';
}

/**
 * CORS Configuration Interface
 */
export interface ICorsConfig {
  enabled: boolean;
  origins: string[];
  credentials: boolean;
  methods: string[];
  headers: string[];
  maxAge?: number;
}

/**
 * Security Headers Configuration Interface
 */
export interface ISecurityHeadersConfig {
  contentSecurityPolicy: boolean;
  strictTransportSecurity: boolean;
  xContentTypeOptions: boolean;
  xFrameOptions: boolean;
  xXSSProtection: boolean;
  referrerPolicy: boolean;
  permissionsPolicy: boolean;
}

/**
 * Session Configuration Interface
 */
export interface ISessionConfig {
  secret: string;
  cookieName: string;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  maxAge: number;
  httpOnly: boolean;
}

/**
 * Token Payload Interface
 */
export interface ITokenPayload {
  sub: string;
  email: string;
  role: UserRole;
  tenantId?: string;
  permissions: Permission[];
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
}

/**
 * Token Pair Interface
 */
export interface ITokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

/**
 * Authentication Result Interface
 */
export interface IAuthResult {
  user: IUserSecurityInfo;
  tokens: ITokenPair;
}

/**
 * User Security Info Interface
 */
export interface IUserSecurityInfo {
  id: string;
  email: string;
  role: UserRole;
  tenantId?: string;
  permissions: Permission[];
  isActive: boolean;
  lastLoginAt?: Date;
}

/**
 * Rate Limit Result Interface
 */
export interface IRateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

/**
 * Security Validation Result Interface
 */
export interface ISecurityValidationResult {
  valid: boolean;
  errors: string[];
  sanitized?: Record<string, unknown>;
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Request Security Context
 * ═══════════════════════════════════════════════════════════════════════════
 */

export interface ISecurityContext {
  userId?: string;
  tenantId?: string;
  ipAddress: string;
  userAgent: string;
  endpoint: string;
  method: string;
  timestamp: Date;
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Masked Data Types
 * ═══════════════════════════════════════════════════════════════════════════
 */

export type MaskableField =
  | 'password'
  | 'passwordHash'
  | 'token'
  | 'refreshToken'
  | 'accessToken'
  | 'secret'
  | 'apiKey'
  | 'creditCard'
  | 'ssn'
  | 'phone'
  | 'email';

export interface IMaskedData {
  field: string;
  originalLength: number;
  maskedValue: string;
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Frontend Security Types
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Secure Storage Keys
 */
export enum SecureStorageKey {
  ACCESS_TOKEN = 'nc_at',
  REFRESH_TOKEN = 'nc_rt',
  USER_DATA = 'nc_ud',
  CSRF_TOKEN = 'nc_csrf',
}

/**
 * API Client Security Options
 */
export interface IApiClientSecurityOptions {
  includeAuthToken: boolean;
  includeCsrfToken: boolean;
  timeout: number;
  retryOnUnauthorized: boolean;
}

/**
 * XSS Sanitization Options
 */
export interface IXssSanitizationOptions {
  allowAttributes: string[];
  allowTags: string[];
  stripIgnoreTag: boolean;
}
