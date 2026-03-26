/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Shared Configuration Types and Interfaces
 * ═══════════════════════════════════════════════════════════════════════════
 * Common types and interfaces used across frontend and backend.
 * Provides a single source of truth for shared configuration.
 */

/**
 * Application Environment Type
 */
export type Environment = "development" | "production" | "test";

/**
 * Storage Provider Type
 */
export type StorageProvider = "local" | "s3" | "gcs";

/**
 * Theme Type
 */
export type Theme = "light" | "dark" | "system";

/**
 * API Configuration Interface
 * Shared between frontend applications
 */
export interface ApiConfig {
  /** Base URL for API requests */
  baseUrl: string;
  /** Request timeout in milliseconds */
  timeout: number;
  /** API version prefix */
  apiPrefix: string;
}

/**
 * Frontend URL Configuration
 */
export interface FrontendUrls {
  /** URL for the tenant frontend */
  tenantUrl: string;
  /** URL for the admin frontend */
  adminUrl: string;
}

/**
 * Feature Flags Configuration
 */
export interface FeatureFlags {
  /** Enable analytics tracking */
  analytics: boolean;
  /** Enable debug mode */
  debug: boolean;
  /** Enable maintenance mode */
  maintenance: boolean;
  /** Enable voice commands */
  voiceCommands: boolean;
  /** Enable workflow automation */
  workflowAutomation: boolean;
  /** Enable advanced reporting */
  advancedReporting: boolean;
  /** Enable connectors */
  connectors: boolean;
  /** Enable notifications */
  notifications: boolean;
  /** Enable audit logging */
  auditLog: boolean;
}

/**
 * Database Configuration Interface
 */
export interface DatabaseConfig {
  /** Primary database connection string */
  url: string;
  /** Direct database connection (bypasses pgbouncer) */
  urlUnpooled?: string;
  /** Database pool size */
  poolSize: number;
  /** Connection timeout in seconds */
  connectionTimeout: number;
  /** Statement timeout in seconds */
  statementTimeout: number;
}

/**
 * Cache Configuration Interface
 */
export interface CacheConfig {
  /** Redis connection URL */
  redisUrl: string;
  /** Upstash REST URL */
  upstashRestUrl?: string;
  /** Upstash REST Token */
  upstashRestToken?: string;
  /** Default cache TTL in seconds */
  defaultTtl: number;
  /** Short cache TTL in seconds */
  shortTtl: number;
  /** Long cache TTL in seconds */
  longTtl: number;
}

/**
 * JWT Configuration Interface
 */
export interface JwtConfig {
  /** JWT secret key */
  secret: string;
  /** Access token expiration */
  accessExpires: string;
  /** Refresh token expiration */
  refreshExpires: string;
  /** JWT algorithm */
  algorithm: "HS256" | "HS384" | "HS512";
  /** JWT issuer */
  issuer?: string;
  /** JWT audience */
  audience?: string;
}

/**
 * Rate Limiting Configuration Interface
 */
export interface RateLimitConfig {
  /** Time window in milliseconds */
  ttl: number;
  /** Maximum requests per window */
  limit: number;
  /** Auth endpoint limit */
  authLimit: number;
  /** API endpoint limit */
  apiLimit: number;
  /** Upload endpoint limit */
  uploadLimit: number;
}

/**
 * CORS Configuration Interface
 */
export interface CorsConfig {
  /** Enable CORS */
  enabled: boolean;
  /** Allowed origins (comma-separated) */
  origins?: string;
  /** Allow credentials */
  credentials: boolean;
  /** Allowed methods */
  methods: string;
  /** Allowed headers */
  headers: string;
}

/**
 * Security Configuration Interface
 */
export interface SecurityConfig {
  /** Session secret */
  sessionSecret?: string;
  /** Session cookie name */
  sessionCookieName: string;
  /** Session cookie secure flag */
  sessionCookieSecure: boolean;
  /** Session cookie same site policy */
  sessionCookieSameSite: "strict" | "lax" | "none";
  /** Session max age in milliseconds */
  sessionMaxAge: number;
  /** Enable CSRF protection */
  csrfEnabled: boolean;
  /** Enable Helmet.js */
  helmetEnabled: boolean;
  /** API key header name */
  apiKeyHeader: string;
  /** Enable IP-based rate limiting */
  rateLimitByIp: boolean;
}

/**
 * AI/LLM Configuration Interface
 */
export interface AiConfig {
  /** OpenAI API Key */
  openaiApiKey?: string;
  /** OpenAI Organization ID */
  openaiOrganization?: string;
  /** OpenAI Project ID */
  openaiProject?: string;
  /** Anthropic API Key */
  anthropicApiKey?: string;
  /** Default model to use */
  defaultModel: string;
  /** Default temperature (0-2) */
  defaultTemperature: number;
  /** Default max tokens */
  defaultMaxTokens: number;
  /** Enable streaming responses */
  streamingEnabled: boolean;
  /** Enable function calling */
  functionCallingEnabled: boolean;
}

/**
 * Monitoring Configuration Interface
 */
export interface MonitoringConfig {
  /** Sentry DSN */
  sentryDsn?: string;
  /** Sentry environment */
  sentryEnvironment?: string;
  /** Sentry trace sample rate */
  sentryTraceSampleRate: number;
  /** Enable OpenTelemetry */
  otelEnabled: boolean;
  /** OpenTelemetry OTLP endpoint */
  otelExporterEndpoint?: string;
  /** OpenTelemetry service name */
  otelServiceName: string;
  /** Log format */
  logFormat: "json" | "pretty";
  /** Pretty print logs */
  logPrettyPrint: boolean;
}

/**
 * Upload Configuration Interface
 */
export interface UploadConfig {
  /** Maximum file size in bytes */
  maxFileSize: number;
  /** Maximum files per request */
  maxFilesPerRequest: number;
  /** Allowed file types (MIME types) */
  allowedFileTypes: string;
  /** Upload directory */
  uploadDir: string;
  /** Storage provider type */
  storageType: StorageProvider;
  /** S3 bucket name */
  s3Bucket?: string;
  /** S3 region */
  s3Region?: string;
  /** AWS access key ID */
  awsAccessKeyId?: string;
  /** AWS secret access key */
  awsSecretAccessKey?: string;
}

/**
 * Email Configuration Interface
 */
export interface EmailConfig {
  /** Email provider type */
  provider: "smtp" | "sendgrid" | "ses" | "mailgun";
  /** SMTP host */
  smtpHost?: string;
  /** SMTP port */
  smtpPort: number;
  /** SMTP username */
  smtpUser?: string;
  /** SMTP password */
  smtpPassword?: string;
  /** SMTP from address */
  smtpFrom?: string;
  /** Use TLS for SMTP */
  smtpSecure: boolean;
  /** SendGrid API key */
  sendgridApiKey?: string;
  /** Mailgun API key */
  mailgunApiKey?: string;
  /** Mailgun domain */
  mailgunDomain?: string;
  /** Email from name */
  fromName: string;
}

/**
 * WebSocket Configuration Interface
 */
export interface WebSocketConfig {
  /** Enable WebSocket */
  enabled: boolean;
  /** Ping interval in milliseconds */
  pingInterval: number;
  /** Ping timeout in milliseconds */
  pingTimeout: number;
}

/**
 * App Info Configuration
 */
export interface AppInfo {
  /** Application name */
  name: string;
  /** Application version */
  version: string;
  /** Node environment */
  environment: Environment;
  /** Port */
  port: number;
  /** API prefix */
  apiPrefix: string;
}

/**
 * Complete Environment Configuration
 * Combines all configuration sections
 */
export interface EnvironmentConfiguration {
  // App
  app: AppInfo;

  // Frontend URLs
  frontend: FrontendUrls;

  // API
  api: ApiConfig;

  // Database
  database: DatabaseConfig;

  // Cache
  cache: CacheConfig;

  // JWT
  jwt: JwtConfig;

  // Rate Limiting
  rateLimit: RateLimitConfig;

  // CORS
  cors: CorsConfig;

  // Security
  security: SecurityConfig;

  // AI
  ai: AiConfig;

  // Features
  features: FeatureFlags;

  // Monitoring
  monitoring: MonitoringConfig;

  // Upload
  upload: UploadConfig;

  // Email
  email: EmailConfig;

  // WebSocket
  webSocket: WebSocketConfig;
}

/**
 * Configuration Validator Interface
 */
export interface IConfigurationValidator {
  validate(rawEnv: Record<string, unknown>): EnvironmentConfiguration;
  getValidationErrors(): unknown;
  isProduction(): boolean;
  isDevelopment(): boolean;
  isTest(): boolean;
}

/**
 * Configuration Factory
 * Creates configuration objects based on environment
 */
export interface ConfigurationFactory {
  create(): Promise<EnvironmentConfiguration>;
  createForEnvironment(env: Environment): Promise<EnvironmentConfiguration>;
}

/**
 * Type-safe environment variable getter
 */
export type EnvGetter<T> = (key: string) => T;
export type EnvGetterOrDefault<T> = (key: string, defaultValue: T) => T;
