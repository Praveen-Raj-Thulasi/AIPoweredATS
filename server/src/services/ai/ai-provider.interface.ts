import { z } from 'zod';

export type TaskComplexity = 'lightweight' | 'standard' | 'complex';

export interface AIRetryPolicy {
  maxRetries: number;
  baseDelayMs: number;
}

export interface AIProviderOptions {
  temperature?: number;
  maxTokens?: number;
  modelName?: string;
  systemPrompt?: string;
  taskComplexity?: TaskComplexity;
  timeoutMs?: number;
  cacheResponse?: boolean;
  retryPolicy?: AIRetryPolicy;
  organizationId?: string;
}

export interface StructuredAIResponse<T> {
  data: T;
  rawResponse: string;
  modelName: string;
  providerName: string;
  inputTokens?: number;
  outputTokens?: number;
  tokensUsed?: number;
  estimatedCostUsd?: number;
  isCached?: boolean;
  durationMs: number;
}

export interface IAIProvider {
  name: string;
  generateCompletion(prompt: string, options?: AIProviderOptions): Promise<string>;
  generateStructured<T>(
    prompt: string,
    schema: z.ZodType<T>,
    options?: AIProviderOptions
  ): Promise<StructuredAIResponse<T>>;
}

