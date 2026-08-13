import { TechnologyVolatility, FreshnessStatus, FreshnessEvaluation } from '@ats/shared';

// Volatility mapping catalog
const HIGH_VOLATILITY_PATTERNS = [
  'llm',
  'generative ai',
  'bedrock',
  'langchain',
  'openai',
  'prompt engineering',
  'agentic',
  'transformers',
  'next.js',
  'remix',
  'vite',
  'web3',
  'solidity',
];

const LOW_VOLATILITY_PATTERNS = [
  'sql',
  'database modeling',
  'relational',
  'algorithms',
  'data structures',
  'system design',
  'networking',
  'linux',
  'operating systems',
  'object-oriented',
  'design patterns',
  'concurrency fundamentals',
];

export class EvidenceFreshnessService {
  /**
   * Determine the volatility of a technology/capability based on its name and domain
   */
  getTechnologyVolatility(capabilityName: string): TechnologyVolatility {
    const lower = capabilityName.toLowerCase();

    for (const pattern of HIGH_VOLATILITY_PATTERNS) {
      if (lower.includes(pattern)) return 'high';
    }

    for (const pattern of LOW_VOLATILITY_PATTERNS) {
      if (lower.includes(pattern)) return 'low';
    }

    // Default is medium volatility for most languages & standard cloud/container platforms (e.g. Docker, TypeScript, React, AWS)
    return 'medium';
  }

  /**
   * Freshness window in months based on volatility
   */
  getFreshnessWindowMonths(volatility: TechnologyVolatility): number {
    switch (volatility) {
      case 'high':
        return 12; // 12 months for fast-moving AI & frontend tools
      case 'medium':
        return 24; // 24 months for stable languages & DevOps tools (e.g., Docker, AWS, React)
      case 'low':
        return 36; // 36 months for foundational computer science & SQL
    }
  }

  /**
   * Evaluate freshness of a capability given its last evidence timestamp
   */
  evaluateFreshness(capabilityName: string, evidenceDateString?: string): FreshnessEvaluation {
    const volatility = this.getTechnologyVolatility(capabilityName);
    const freshnessWindowMonths = this.getFreshnessWindowMonths(volatility);

    const evidenceDate = evidenceDateString ? new Date(evidenceDateString) : new Date();
    const now = new Date();

    const diffMs = Math.max(0, now.getTime() - evidenceDate.getTime());
    const ageInMonths = Math.max(0, Math.round((diffMs / (1000 * 60 * 60 * 24 * 30.44)) * 10) / 10);

    let status: FreshnessStatus;
    let freshnessScore: number;
    let isReverificationRecommended = false;
    let recommendationReason: string | undefined;

    if (ageInMonths <= freshnessWindowMonths * 0.5) {
      status = 'ACTIVE';
      freshnessScore = Math.max(88, Math.round(100 - (ageInMonths / (freshnessWindowMonths * 0.5)) * 12));
    } else if (ageInMonths <= freshnessWindowMonths) {
      status = 'FRESH';
      freshnessScore = Math.max(70, Math.round(88 - ((ageInMonths - freshnessWindowMonths * 0.5) / (freshnessWindowMonths * 0.5)) * 18));
    } else if (ageInMonths <= freshnessWindowMonths * 1.5) {
      status = 'AGING';
      freshnessScore = Math.max(45, Math.round(70 - ((ageInMonths - freshnessWindowMonths) / (freshnessWindowMonths * 0.5)) * 25));
      isReverificationRecommended = true;
      recommendationReason = `Evidence is ${ageInMonths} months old in a ${volatility} volatility ecosystem (${freshnessWindowMonths}m window). A brief delta re-verification is recommended to confirm currency.`;
    } else {
      status = 'STALE';
      freshnessScore = Math.max(15, Math.round(45 - Math.min(30, (ageInMonths - freshnessWindowMonths * 1.5) * 5)));
      isReverificationRecommended = true;
      recommendationReason = `Evidence exceeds the ${freshnessWindowMonths}-month threshold for ${capabilityName}. Industry standards have evolved; comprehensive re-verification is advised.`;
    }

    return {
      evidenceDate: evidenceDate.toISOString(),
      ageInMonths,
      volatility,
      freshnessWindowMonths,
      status,
      freshnessScore,
      isReverificationRecommended,
      recommendationReason,
    };
  }
}

export const evidenceFreshnessService = new EvidenceFreshnessService();
