export type Environment = "development" | "production" | "test";
export type StorageProvider = "local" | "s3" | "gcs";
export type Theme = "light" | "dark" | "system";
export interface ApiConfig {
    baseUrl: string;
    timeout: number;
    apiPrefix: string;
}
export interface FrontendUrls {
    tenantUrl: string;
    adminUrl: string;
}
export interface FeatureFlags {
    analytics: boolean;
    debug: boolean;
    maintenance: boolean;
    voiceCommands: boolean;
    workflowAutomation: boolean;
    advancedReporting: boolean;
    connectors: boolean;
    notifications: boolean;
    auditLog: boolean;
}
export interface DatabaseConfig {
    url: string;
    urlUnpooled?: string;
    poolSize: number;
    connectionTimeout: number;
    statementTimeout: number;
}
export interface CacheConfig {
    redisUrl: string;
    upstashRestUrl?: string;
    upstashRestToken?: string;
    defaultTtl: number;
    shortTtl: number;
    longTtl: number;
}
export interface JwtConfig {
    secret: string;
    accessExpires: string;
    refreshExpires: string;
    algorithm: "HS256" | "HS384" | "HS512";
    issuer?: string;
    audience?: string;
}
export interface RateLimitConfig {
    ttl: number;
    limit: number;
    authLimit: number;
    apiLimit: number;
    uploadLimit: number;
}
export interface CorsConfig {
    enabled: boolean;
    origins?: string;
    credentials: boolean;
    methods: string;
    headers: string;
}
export interface SecurityConfig {
    sessionSecret?: string;
    sessionCookieName: string;
    sessionCookieSecure: boolean;
    sessionCookieSameSite: "strict" | "lax" | "none";
    sessionMaxAge: number;
    csrfEnabled: boolean;
    helmetEnabled: boolean;
    apiKeyHeader: string;
    rateLimitByIp: boolean;
}
export interface AiConfig {
    openaiApiKey?: string;
    openaiOrganization?: string;
    openaiProject?: string;
    anthropicApiKey?: string;
    defaultModel: string;
    defaultTemperature: number;
    defaultMaxTokens: number;
    streamingEnabled: boolean;
    functionCallingEnabled: boolean;
}
export interface MonitoringConfig {
    sentryDsn?: string;
    sentryEnvironment?: string;
    sentryTraceSampleRate: number;
    otelEnabled: boolean;
    otelExporterEndpoint?: string;
    otelServiceName: string;
    logFormat: "json" | "pretty";
    logPrettyPrint: boolean;
}
export interface UploadConfig {
    maxFileSize: number;
    maxFilesPerRequest: number;
    allowedFileTypes: string;
    uploadDir: string;
    storageType: StorageProvider;
    s3Bucket?: string;
    s3Region?: string;
    awsAccessKeyId?: string;
    awsSecretAccessKey?: string;
}
export interface EmailConfig {
    provider: "smtp" | "sendgrid" | "ses" | "mailgun";
    smtpHost?: string;
    smtpPort: number;
    smtpUser?: string;
    smtpPassword?: string;
    smtpFrom?: string;
    smtpSecure: boolean;
    sendgridApiKey?: string;
    mailgunApiKey?: string;
    mailgunDomain?: string;
    fromName: string;
}
export interface WebSocketConfig {
    enabled: boolean;
    pingInterval: number;
    pingTimeout: number;
}
export interface AppInfo {
    name: string;
    version: string;
    environment: Environment;
    port: number;
    apiPrefix: string;
}
export interface EnvironmentConfiguration {
    app: AppInfo;
    frontend: FrontendUrls;
    api: ApiConfig;
    database: DatabaseConfig;
    cache: CacheConfig;
    jwt: JwtConfig;
    rateLimit: RateLimitConfig;
    cors: CorsConfig;
    security: SecurityConfig;
    ai: AiConfig;
    features: FeatureFlags;
    monitoring: MonitoringConfig;
    upload: UploadConfig;
    email: EmailConfig;
    webSocket: WebSocketConfig;
}
export interface IConfigurationValidator {
    validate(rawEnv: Record<string, unknown>): EnvironmentConfiguration;
    getValidationErrors(): unknown;
    isProduction(): boolean;
    isDevelopment(): boolean;
    isTest(): boolean;
}
export interface ConfigurationFactory {
    create(): Promise<EnvironmentConfiguration>;
    createForEnvironment(env: Environment): Promise<EnvironmentConfiguration>;
}
export type EnvGetter<T> = (key: string) => T;
export type EnvGetterOrDefault<T> = (key: string, defaultValue: T) => T;
