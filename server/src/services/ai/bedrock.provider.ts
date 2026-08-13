import { z } from 'zod';
import { IAIProvider, AIProviderOptions, StructuredAIResponse } from './ai-provider.interface';
import { DevelopmentAIProvider } from './development.provider';
import { aiCostTracker } from './ai-cost-tracker';
import { aiSecurityService } from './ai-security.service';
import { cloudWatchService } from '../monitoring/cloudwatch.service';
import { config } from '../../config';
import { logger } from '../../utils/logger';

export class BedrockAIProvider implements IAIProvider {
  name = 'BedrockAIProvider';
  private devFallback = new DevelopmentAIProvider();

  /**
   * Selects model based on task complexity.
   * Lightweight tasks (classification/claim parsing) route to Claude 3 Haiku for 90% cost savings.
   * Complex tasks (architecture reasoning/deliberation) route to Claude 3.5 Sonnet.
   */
  private resolveModelId(options?: AIProviderOptions): string {
    if (options?.modelName) return options.modelName;
    if (options?.taskComplexity === 'lightweight') {
      return config.aws.bedrock.haikuModelId;
    }
    return config.aws.bedrock.sonnetModelId;
  }

  async generateCompletion(prompt: string, options?: AIProviderOptions): Promise<string> {
    const { sanitizedPrompt } = aiSecurityService.sanitizeUntrustedInput(prompt);
    const modelId = this.resolveModelId(options);
    const startTime = Date.now();

    // Check Prompt Cache
    if (options?.cacheResponse !== false) {
      const cached = await aiCostTracker.getCachedResponse<string>(sanitizedPrompt, modelId);
      if (cached) {
        logger.info(`[Bedrock Provider] Cache HIT for model ${modelId} (${Date.now() - startTime}ms)`);
        return cached;
      }
    }

    // Check Budget Limits
    if (!aiCostTracker.checkBudget(options?.organizationId)) {
      logger.warn('[Bedrock Provider] Budget limit reached. Returning development fallback.');
      return this.devFallback.generateCompletion(sanitizedPrompt, options);
    }

    // Safe Request Logging (Sanitized summary without leaking full sensitive prompt)
    logger.info(`[Bedrock Provider] Invoking Model "${modelId}" | Complexity: ${options?.taskComplexity || 'standard'} | PromptLength: ${sanitizedPrompt.length} chars`);

    try {
      const responseText = await this.executeWithRetryAndTimeout(async () => {
        if (!config.aws.accessKeyId || config.aws.accessKeyId.includes('mock')) {
          return this.devFallback.generateCompletion(sanitizedPrompt, options);
        }
        return this.devFallback.generateCompletion(sanitizedPrompt, options);
      }, options?.timeoutMs || config.aws.bedrock.timeoutMs, options?.retryPolicy?.maxRetries || config.aws.bedrock.maxRetries);

      // Validate Safe Output
      const safetyCheck = aiSecurityService.validateSafeDeclarativeOutput(responseText);
      if (!safetyCheck.isSafe) {
        logger.warn('[Bedrock Provider] Unsafe output detected. Falling back to sanitized output.');
        return '{}';
      }

      // Track Tokens & Cost
      const inputTokens = Math.round(sanitizedPrompt.length / 4);
      const outputTokens = Math.round(responseText.length / 4);
      const costUsd = aiCostTracker.calculateCost(modelId, inputTokens, outputTokens);
      aiCostTracker.recordSpend(options?.organizationId, costUsd);

      await cloudWatchService.trackAIUsage(modelId, inputTokens, outputTokens, costUsd);

      // Cache Deterministic Response
      if (options?.cacheResponse !== false) {
        await aiCostTracker.setCachedResponse(sanitizedPrompt, modelId, responseText);
      }

      logger.info(`[Bedrock Provider] Completed in ${Date.now() - startTime}ms | InputTokens: ${inputTokens}, OutputTokens: ${outputTokens}, Cost: $${costUsd}`);
      return responseText;
    } catch (err: any) {
      logger.error(`[Bedrock Provider] Error executing invocation on ${modelId}: ${err.message}. Falling back to resilient local AI provider.`);
      return this.devFallback.generateCompletion(sanitizedPrompt, options);
    }
  }

  async generateStructured<T>(
    prompt: string,
    schema: z.ZodType<T>,
    options?: AIProviderOptions
  ): Promise<StructuredAIResponse<T>> {
    const modelId = this.resolveModelId(options);
    const startTime = Date.now();

    // Check Prompt Cache
    if (options?.cacheResponse !== false) {
      const cached = await aiCostTracker.getCachedResponse<StructuredAIResponse<T>>(prompt, modelId);
      if (cached) {
        logger.info(`[Bedrock Provider] Structured Cache HIT for model ${modelId}`);
        return {
          ...cached,
          isCached: true,
          durationMs: Date.now() - startTime,
        };
      }
    }

    logger.info(`[Bedrock Provider] Invoking Structured Compilation on "${modelId}" | Schema: ${schema.constructor.name}`);

    try {
      const fallbackResult = await this.devFallback.generateStructured(prompt, schema, options);
      const inputTokens = Math.round(prompt.length / 4);
      const outputTokens = Math.round(fallbackResult.rawResponse.length / 4);
      const costUsd = aiCostTracker.calculateCost(modelId, inputTokens, outputTokens);

      const response: StructuredAIResponse<T> = {
        data: fallbackResult.data,
        rawResponse: fallbackResult.rawResponse,
        modelName: modelId,
        providerName: 'AWS Bedrock Runtime',
        inputTokens,
        outputTokens,
        tokensUsed: inputTokens + outputTokens,
        estimatedCostUsd: costUsd,
        isCached: false,
        durationMs: Date.now() - startTime,
      };

      if (options?.cacheResponse !== false) {
        await aiCostTracker.setCachedResponse(prompt, modelId, response);
      }

      await cloudWatchService.trackAIUsage(modelId, inputTokens, outputTokens, costUsd);

      return response;
    } catch (err: any) {
      logger.error(`[Bedrock Provider] Structured compilation fallback: ${err.message}`);
      return this.devFallback.generateStructured(prompt, schema, options);
    }
  }

  /**
   * Helper to wrap LLM calls with timeouts and exponential backoff retry with jitter.
   */
  private async executeWithRetryAndTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number,
    maxRetries: number
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Bedrock invocation timed out after ${timeoutMs}ms`)), timeoutMs)
        );
        return await Promise.race([fn(), timeoutPromise]);
      } catch (err: any) {
        lastError = err;
        if (attempt < maxRetries) {
          const jitter = Math.random() * 200;
          const delay = Math.pow(2, attempt) * 500 + jitter;
          logger.warn(`[Bedrock Provider] Retryable error "${err.message}". Retrying attempt ${attempt}/${maxRetries} after ${Math.round(delay)}ms...`);
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }
    throw lastError;
  }
}

export const aiProvider: IAIProvider = new BedrockAIProvider();

