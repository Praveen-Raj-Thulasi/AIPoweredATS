import { redisCache } from '../../utils/redis';
import { logger } from '../../utils/logger';

export class TokenBlacklistService {
  private inMemoryBlacklist = new Map<string, number>();

  /**
   * Blacklists a revoked JWT token until its natural expiration.
   */
  async blacklistToken(token: string, expiresInSeconds = 7 * 24 * 3600): Promise<void> {
    if (!token) return;

    const expiresAt = Date.now() + expiresInSeconds * 1000;
    this.inMemoryBlacklist.set(token, expiresAt);

    // Persist in Redis if available
    const key = `auth:blacklist:${token}`;
    await redisCache.set(key, { blacklisted: true, at: new Date().toISOString() }, expiresInSeconds);

    logger.info(`[Token Blacklist] Token blacklisted successfully (TTL: ${expiresInSeconds}s)`);
  }

  /**
   * Checks whether a token has been explicitly revoked or logged out.
   */
  async isTokenBlacklisted(token: string): Promise<boolean> {
    if (!token) return false;

    // Check memory store
    const expiresAt = this.inMemoryBlacklist.get(token);
    if (expiresAt) {
      if (Date.now() < expiresAt) {
        return true;
      }
      this.inMemoryBlacklist.delete(token);
    }

    // Check Redis store
    const key = `auth:blacklist:${token}`;
    const redisVal = await redisCache.get(key);
    return redisVal !== null;
  }
}

export const tokenBlacklistService = new TokenBlacklistService();
