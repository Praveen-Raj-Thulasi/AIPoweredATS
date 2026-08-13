import { createClient } from 'redis';
import { config } from '../config';
import { logger } from './logger';

class CacheService {
  private client: ReturnType<typeof createClient> | null = null;
  private isConnected = false;
  private memoryStore = new Map<string, { value: string; expiresAt: number | null }>();

  constructor() {
    this.init();
  }

  private async init() {
    try {
      this.client = createClient({
        url: config.redis.url,
        socket: {
          connectTimeout: 2000,
          reconnectStrategy: () => false, // Don't crash in loop if redis is down
        },
      });

      this.client.on('error', (err) => {
        if (this.isConnected) {
          logger.warn(`Redis Error: ${err.message}`);
        }
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        logger.info('Connected to Redis server');
      });

      await this.client.connect().catch(() => {
        logger.warn(`Could not connect to Redis at ${config.redis.url}. Using In-Memory Cache fallback.`);
        this.isConnected = false;
      });
    } catch {
      logger.warn('Redis initialization skipped. Using In-Memory Cache fallback.');
      this.isConnected = false;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.isConnected && this.client) {
      try {
        const data = await this.client.get(key);
        return data ? JSON.parse(data) : null;
      } catch (err) {
        logger.error(`Redis get error for key ${key}:`, err);
      }
    }

    // In-memory fallback
    const item = this.memoryStore.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.memoryStore.delete(key);
      return null;
    }
    try {
      return JSON.parse(item.value);
    } catch {
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const serialized = JSON.stringify(value);

    if (this.isConnected && this.client) {
      try {
        if (ttlSeconds) {
          await this.client.setEx(key, ttlSeconds, serialized);
        } else {
          await this.client.set(key, serialized);
        }
        return;
      } catch (err) {
        logger.error(`Redis set error for key ${key}:`, err);
      }
    }

    // In-memory fallback
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.memoryStore.set(key, { value: serialized, expiresAt });
  }

  async del(key: string): Promise<void> {
    if (this.isConnected && this.client) {
      try {
        await this.client.del(key);
      } catch (err) {
        logger.error(`Redis del error for key ${key}:`, err);
      }
    }
    this.memoryStore.delete(key);
  }

  async flush(): Promise<void> {
    if (this.isConnected && this.client) {
      try {
        await this.client.flushAll();
      } catch (err) {
        logger.error('Redis flush error:', err);
      }
    }
    this.memoryStore.clear();
  }
}

export const redisCache = new CacheService();
