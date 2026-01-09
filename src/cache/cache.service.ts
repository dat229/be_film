import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private client: RedisClientType;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  private getRedisUrl(): string | null {
    return (
      process.env.REDIS_URL ||
      process.env.REDISCLOUD_URL ||
      process.env.REDIS_TLS_URL ||
      process.env.REDIS_HOST ||
      (process.env.REDIS_HOST && process.env.REDIS_PORT
        ? `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
        : null) ||
      null
    );
  }

  async onModuleInit() {
    const redisUrl = this.getRedisUrl();

    if (!redisUrl) {
      this.logger.warn(
        'Redis URL không được cấu hình. Cache service sẽ hoạt động ở chế độ không có cache.',
      );
      this.isConnected = false;
      return;
    }

    if (
      redisUrl === 'redis://localhost:6379' &&
      process.env.NODE_ENV === 'production'
    ) {
      this.logger.warn(
        'Đang ở môi trường production nhưng Redis URL là localhost. Cache service sẽ không hoạt động.',
      );
      this.isConnected = false;
      return;
    }

    await this.connect(redisUrl);
  }

  private async connect(redisUrl: string) {
    try {
      this.client = createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > this.maxReconnectAttempts) {
              this.logger.warn(
                `Đã thử kết nối Redis.`,
              );
              return false;
            }
            const delay = Math.min(
              this.reconnectDelay * Math.pow(2, retries),
              30000,
            );
            this.logger.log(
              `Thử kết nối lại redis sau ${delay}ms`,
            );
            return delay;
          },
        },
      });

      this.client.on('error', (err) => {
        if (!this.isConnected) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          this.logger.error('Redis Client lỗi:', errorMessage);
        }
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        this.logger.log('Redis client kết nối thành công.');
        this.isConnected = true;
        this.reconnectAttempts = 0;
      });

      this.client.on('reconnecting', () => {
        this.logger.log('Đang kết nối lại redis.');
      });

      await this.client.connect();
    } catch (error) {
      this.logger.warn(
        `Redis kết nối lỗi: ${(error as Error).message}. Cache service sẽ hoạt động ở chế độ không có cache.`,
      );
      this.isConnected = false;
    }
  }

  async onModuleDestroy() {
    if (this.client && this.isConnected) {
      await this.client.quit();
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected) return null;

    try {
      const value = await this.client.get(key);
      if (value) {
        return JSON.parse(value) as T;
      }
      return null;
    } catch (error) {
      this.logger.error(`Lỗi lấy key cache: ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    if (!this.isConnected) return;

    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await this.client.setEx(key, ttlSeconds, serialized);
      } else {
        await this.client.set(key, serialized);
      }
    } catch (error) {
      this.logger.error(`Lỗi set key cache: ${key}:`, error);
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.isConnected) return;

    try {
      await this.client.del(key);
    } catch (error) {
      this.logger.error(`Lỗi xóa cache: ${key}:`, error);
    }
  }

  async deletePattern(pattern: string): Promise<void> {
    if (!this.isConnected) return;

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
    } catch (error) {
      this.logger.error(`Lỗi xóa nhiều key cache: ${pattern}:`, error);
    }
  }

  isAvailable(): boolean {
    return this.isConnected;
  }

  async clear(): Promise<void> {
    if (!this.isConnected) return;

    try {
      await this.client.flushAll();
    } catch (error) {
      this.logger.error('Lỗi clear cache:', error);
    }
  }

  getClient(): RedisClientType | null {
    return this.isConnected ? this.client : null;
  }

  // tự tăng view
  async increment(key: string, ttlSeconds?: number): Promise<number> {
    if (!this.isConnected) return 0;

    try {
      const result = await this.client.incr(key);
      if (ttlSeconds && result === 1) {
        await this.client.expire(key, ttlSeconds);
      }
      return result;
    } catch (error) {
      this.logger.error(`Lỗi increment key: ${key}:`, error);
      return 0;
    }
  }

  async getKeys(pattern: string): Promise<string[]> {
    if (!this.isConnected) return [];

    try {
      return await this.client.keys(pattern);
    } catch (error) {
      this.logger.error(`Lỗi lấy keys với pattern: ${pattern}:`, error);
      return [];
    }
  }
}
