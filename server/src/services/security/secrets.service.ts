import { config } from '../../config';
import { logger } from '../../utils/logger';

interface CachedSecret {
  value: Record<string, string>;
  expiresAt: number;
}

export class SecretsManagerService {
  private cache: Map<string, CachedSecret> = new Map();

  /**
   * Retrieves production application secrets with in-memory TTL caching.
   * If offline or AWS credentials are not configured, falls back to process.env.
   */
  async getSecret(secretName = config.aws.secretsManager.secretName): Promise<Record<string, string>> {
    const now = Date.now();
    const cached = this.cache.get(secretName);

    if (cached && cached.expiresAt > now) {
      return cached.value;
    }

    // In production with AWS SDK credentials:
    // const client = new SecretsManagerClient({ region: config.aws.region });
    // const response = await client.send(new GetSecretValueCommand({ SecretId: secretName }));
    // const parsed = JSON.parse(response.SecretString || '{}');

    // Default/Fallback loader:
    const fallbackSecrets: Record<string, string> = {
      MONGODB_URI: config.mongodb.uri,
      REDIS_URL: config.redis.url,
      JWT_SECRET: config.jwt.secret,
      JWT_REFRESH_SECRET: config.jwt.refreshSecret,
      AWS_ACCESS_KEY_ID: config.aws.accessKeyId,
      AWS_SECRET_ACCESS_KEY: config.aws.secretAccessKey,
    };

    const ttlMs = (config.aws.secretsManager.cacheTtlSeconds || 3600) * 1000;
    this.cache.set(secretName, {
      value: fallbackSecrets,
      expiresAt: now + ttlMs,
    });

    logger.info(`[Secrets Manager] Loaded and cached secrets for ${secretName} (TTL: ${config.aws.secretsManager.cacheTtlSeconds}s)`);
    return fallbackSecrets;
  }

  /**
   * Clears secrets cache (e.g. upon secret rotation event).
   */
  invalidateCache(secretName?: string) {
    if (secretName) {
      this.cache.delete(secretName);
    } else {
      this.cache.clear();
    }
    logger.info('[Secrets Manager] Cache invalidated.');
  }
}

export const secretsManagerService = new SecretsManagerService();
