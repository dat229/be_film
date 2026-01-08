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

  async onModuleInit() {
    try {
      this.client = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
      });

      this.client.on('error', (err) => {
        this.logger.error('Redis Client lỗi:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        this.logger.log('Redis Client kết nối thành công.');
        this.isConnected = true;
      });

      await this.client.connect();
    } catch (error) {
      this.logger.warn('Redis kết nối lỗi:', (error as Error).message);
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
