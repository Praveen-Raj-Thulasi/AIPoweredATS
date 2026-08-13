import crypto from 'crypto';
import { config } from '../../config';
import { logger } from '../../utils/logger';
import { redisCache } from '../../utils/redis';

interface ModelPricing {
  inputPerMillion: number;
  outputPerMillion: number;
}

const MODEL_PRICING: Record<string, ModelPricing> = {
  // Claude 3.5 Sonnet
  'anthropic.claude-3-5-sonnet-20241022-v2:0': { inputPerMillion: 3.0, outputPerMillion: 15.0 },
  'anthropic.claude-3-sonnet-20240229-v1:0': { inputPerMillion: 3.0, outputPerMillion: 15.0 },
  // Claude 3 Haiku (Lightweight / fast)
  'anthropic.claude-3-haiku-20240307-v1:0': { inputPerMillion: 0.25, outputPerMillion: 1.25 },
};

export class AICostTracker {
  private localMemoryCache = new Map<string, { response: any; expiresAt: number }>();
  private orgSpendThisMonth = new Map<string, number>();

  /**
   * Calculates precise estimated dollar cost for an AI inference invocation.
   */
  calculateCost(modelId: string, inputTokens: number, outputTokens: number): number {
    const pricing = MODEL_PRICING[modelId] || MODEL_PRICING['anthropic.claude-3-5-sonnet-20241022-v2:0'];
    const inputCost = (inputTokens / 1_000_000) * pricing.inputPerMillion;
    const outputCost = (outputTokens / 1_000_000) * pricing.outputPerMillion;
    return Math.round((inputCost + outputCost) * 100000) / 100000;
  }

  /**
   * Enforces organizational budget limits before making expensive LLM calls.
   */
  checkBudget(organizationId = 'org-1'): boolean {
    const currentSpend = this.orgSpendThisMonth.get(organizationId) || 0;
    if (currentSpend >= config.ai.monthlyBudgetUsd) {
      logger.warn(`[AI Cost Control] Organization ${organizationId} has exceeded monthly budget of $${config.ai.monthlyBudgetUsd}. Current spend: $${currentSpend}`);
      return false;
    }
    return true;
  }

  /**
   * Records spend after successful generation.
   */
  recordSpend(organizationId = 'org-1', costUsd: number) {
    const current = this.orgSpendThisMonth.get(organizationId) || 0;
    this.orgSpendThisMonth.set(organizationId, current + costUsd);
  }

  /**
   * Computes SHA-256 hash of a prompt for deterministic caching.
   */
  computePromptHash(prompt: string, modelName: string): string {
    return crypto.createHash('sha256').update(`${modelName}:${prompt}`).digest('hex');
  }

  /**
   * Retrieves cached response if prompt was previously compiled.
   */
  async getCachedResponse<T>(prompt: string, modelName: string): Promise<T | null> {
    if (!config.ai.enablePromptResponseCaching) return null;
    const key = `ai:cache:${this.computePromptHash(prompt, modelName)}`;

    // Check memory cache
    const local = this.localMemoryCache.get(key);
    if (local && local.expiresAt > Date.now()) {
      return local.response as T;
    }

    // Check Redis cache
    const redisVal = await redisCache.get<T>(key);
    if (redisVal) {
      return redisVal;
    }

    return null;
  }

  /**
   * Caches prompt response with 24-hour TTL.
   */
  async setCachedResponse(prompt: string, modelName: string, data: any, ttlSeconds = 86400): Promise<void> {
    if (!config.ai.enablePromptResponseCaching) return;
    const key = `ai:cache:${this.computePromptHash(prompt, modelName)}`;

    this.localMemoryCache.set(key, {
      response: data,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });

    await redisCache.set(key, JSON.stringify(data), ttlSeconds);
  }

  /**
   * Scopes candidate profile to only target capability data to prevent unnecessary token consumption.
   */
  scopeCandidatePrompt(candidate: any, targetCapabilityNames?: string[]): Record<string, any> {
    return {
      id: candidate.id,
      headline: candidate.headline,
      skills: targetCapabilityNames
        ? candidate.skills?.filter((s: string) => targetCapabilityNames.some((t) => s.toLowerCase().includes(t.toLowerCase())))
        : candidate.skills?.slice(0, 15),
      recentExperience: candidate.experience?.slice(0, 2).map((e: any) => ({
        title: e.title,
        company: e.company,
        description: e.description?.slice(0, 300),
      })),
    };
  }
}

export const aiCostTracker = new AICostTracker();
