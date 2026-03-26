import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import type UpstashRedisType from '@upstash/redis';
let UpstashRedis: typeof UpstashRedisType | null = null;
try {
  // dynamically require so projects without the package won't crash at import time

  // @ts-ignore
  UpstashRedis = require('@upstash/redis').Redis;
} catch (e) {
  UpstashRedis = null;
}

// Single Responsibility: manages Redis connection and common operations.
// Optimized for Upstash Redis compatibility
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client!: Redis;
  // If using Upstash REST client, this will hold the client instance
  // use `any` to avoid complex typing for the dynamically-required client
  private upstashClient: any = null;
  private isConnected = false;

  constructor(private readonly config?: ConfigService) {}

  onModuleInit(): void {
    const redisUrl = this.config
      ? this.config.get<string>('REDIS_URL', 'redis://localhost:6379/0')
      : process.env.REDIS_URL || 'redis://localhost:6379/0';

    const upstashRestUrl = this.config
      ? this.config.get<string | undefined>('UPSTASH_REDIS_REST_URL')
      : process.env.UPSTASH_REDIS_REST_URL;
    const upstashRestToken = this.config
      ? this.config.get<string | undefined>('UPSTASH_REDIS_REST_TOKEN')
      : process.env.UPSTASH_REDIS_REST_TOKEN;

    // Check if using Upstash (either via REDIS_URL or REST integration)
    const isUpstash =
      Boolean(upstashRestUrl && upstashRestToken) ||
      redisUrl.includes('upstash.io');

    const options: any = {
      // Upstash-specific configuration
      maxRetriesPerRequest: isUpstash ? 10 : 3,
      retryStrategy: (times: number) => {
        // Exponential backoff with longer delays for Upstash
        const delay = isUpstash
          ? Math.min(times * 200, 5000)
          : Math.min(times * 50, 2000);
        this.logger.log(`Redis retry attempt ${times}, waiting ${delay}ms`);
        return delay;
      },
      lazyConnect: false,
      // Increase timeouts for serverless environments
      connectTimeout: 10000,
      commandTimeout: 5000,
      // Disable some commands that Upstash doesn't support well
      skipCommandSet: isUpstash
        ? ['CLIENT', 'CLUSTER', 'DEBUG', 'SLOWLOG', 'MEMORY']
        : [],
    };

    // Prefer Upstash REST client in serverless (Vercel) environments when provided
    if (upstashRestUrl && upstashRestToken && UpstashRedis) {
      this.logger.log('Using Upstash REST client for Redis');
      // @ts-ignore - Upstash client typing imported dynamically
      this.upstashClient = new UpstashRedis({
        url: upstashRestUrl,
        token: upstashRestToken,
      });
      // The Upstash REST client doesn't maintain persistent connections like ioredis
      this.isConnected = true;
      return;
    }

    // Fallback to ioredis for normal Redis URL (including Upstash TCP URL)
    this.client = new Redis(redisUrl, options);

    this.client.on('connect', () => {
      this.isConnected = true;
      this.logger.log('Redis connected');
    });

    this.client.on('ready', () => {
      this.isConnected = true;
      this.logger.log('Redis ready');
    });

    this.client.on('error', (err) => {
      this.isConnected = false;
      this.logger.error('Redis error', err);
    });

    this.client.on('close', () => {
      this.isConnected = false;
      this.logger.log('Redis connection closed');
    });

    this.client.on('reconnecting', () => {
      this.logger.log('Redis reconnecting...');
    });
  }

  onModuleDestroy(): void {
    try {
      if (
        this.upstashClient &&
        typeof this.upstashClient.disconnect === 'function'
      ) {
        // @ts-ignore
        this.upstashClient.disconnect();
      }
    } catch {}
    try {
      if (this.client) this.client.quit();
    } catch {}
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (this.upstashClient) {
      // @ts-ignore
      if (ttlSeconds)
        await this.upstashClient.set(key, value, { ex: ttlSeconds });
      else await this.upstashClient.set(key, value);
      return;
    }
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    if (this.upstashClient) {
      // @ts-ignore
      const res = await this.upstashClient.get(key);
      // Upstash returns null or string
      return res as string | null;
    }
    return this.client.get(key);
  }

  async del(key: string): Promise<void> {
    if (this.upstashClient) {
      // @ts-ignore
      await this.upstashClient.del(key);
      return;
    }
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    if (this.upstashClient) {
      // @ts-ignore
      const v = await this.upstashClient.get(key);
      return v !== null && v !== undefined;
    }
    const count = await this.client.exists(key);
    return count > 0;
  }

  async setJson<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    await this.set(key, JSON.stringify(value), ttlSeconds);
  }

  async getJson<T>(key: string): Promise<T | null> {
    const raw = await this.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  // Blacklist a JWT token (for logout/revocation)
  async blacklistToken(jti: string, ttlSeconds: number): Promise<void> {
    if (!this.isConnected) {
      this.logger.warn('Redis not connected, skipping token blacklist');
      return;
    }
    try {
      await this.set(`bl:${jti}`, '1', ttlSeconds);
    } catch (err) {
      this.logger.warn(`Failed to blacklist token: ${String(err)}`);
    }
  }

  async isTokenBlacklisted(jti: string): Promise<boolean> {
    if (!this.isConnected) {
      this.logger.warn('Redis not connected, failing open for token check');
      // Fail-open: if Redis is down, treat tokens as not blacklisted
      return false;
    }
    try {
      return await this.exists(`bl:${jti}`);
    } catch (err) {
      this.logger.warn(
        `Redis unavailable when checking token blacklist: ${String(err)}`,
      );
      // Fail-open: if Redis is down, treat tokens as not blacklisted to avoid
      // turning authentication failures into 500 Internal Server Errors.
      return false;
    }
  }
}
