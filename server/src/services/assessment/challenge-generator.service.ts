import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import {
  AssessmentChallenge,
  AssessmentLevel,
  AssessmentType,
  CapabilityCategory,
  ASSESSMENT_LEVEL_LABELS,
} from '@ats/shared';
import { aiProvider } from '../ai/bedrock.provider';
import { logger } from '../../utils/logger';

export const AssessmentChallengeSchema = z.object({
  title: z.string().min(3),
  type: z.enum([
    'mcq',
    'coding',
    'debugging',
    'scenario',
    'architecture',
    'written_explanation',
    'transfer_challenge',
  ]),
  prompt: z.string().min(15),
  contextScenario: z.string().optional(),
  starterCode: z.string().optional(),
  testCases: z
    .array(
      z.object({
        id: z.string(),
        input: z.string(),
        expectedOutput: z.string(),
        isHidden: z.boolean().optional(),
      })
    )
    .optional(),
  options: z
    .array(
      z.object({
        id: z.string(),
        text: z.string(),
        isCorrect: z.boolean().optional(),
      })
    )
    .optional(),
  evaluationRubric: z.array(
    z.object({
      criteria: z.string(),
      maxPoints: z.number(),
      description: z.string(),
    })
  ),
  timeLimitSeconds: z.number().min(30).max(1800),
  transferConcept: z.string().optional(),
});

export class ChallengeGeneratorService {
  /**
   * Generates a targeted Proof-of-Ability challenge for a specific capability and cognitive level
   */
  async generateChallenge(
    capabilityName: string,
    category: CapabilityCategory,
    level: AssessmentLevel,
    transferConcept?: string
  ): Promise<AssessmentChallenge> {
    logger.info(
      `[Challenge Generator] Generating Level ${level} (${ASSESSMENT_LEVEL_LABELS[level]}) challenge for ${capabilityName}...`
    );

    const prompt = this.buildPrompt(capabilityName, category, level, transferConcept);

    try {
      const response = await aiProvider.generateStructured(prompt, AssessmentChallengeSchema, {
        temperature: 0.3,
        systemPrompt:
          'You are a Principal Engineering Assessor. Generate strict, production-grade technical evaluation challenges. For coding/debugging, provide clean starter code. For scenarios, establish real constraints.',
      });

      return {
        id: uuidv4(),
        capabilityName,
        category,
        level,
        levelName: ASSESSMENT_LEVEL_LABELS[level],
        type: response.data.type,
        title: response.data.title,
        prompt: response.data.prompt,
        contextScenario: response.data.contextScenario,
        starterCode: response.data.starterCode,
        testCases: response.data.testCases,
        options: response.data.options,
        evaluationRubric: response.data.evaluationRubric,
        timeLimitSeconds: response.data.timeLimitSeconds,
        transferConcept: response.data.transferConcept || transferConcept,
      };
    } catch (err: any) {
      logger.warn(
        `[Challenge Generator] AI generation schema validation error, creating deterministic fallback challenge: ${err.message}`
      );
      return this.generateFallbackChallenge(capabilityName, category, level, transferConcept);
    }
  }

  private buildPrompt(
    capabilityName: string,
    category: CapabilityCategory,
    level: AssessmentLevel,
    transferConcept?: string
  ): string {
    return `
TARGET CAPABILITY: ${capabilityName}
CATEGORY: ${category}
COGNITIVE ASSESSMENT LEVEL: Level ${level} - ${ASSESSMENT_LEVEL_LABELS[level]}
${transferConcept ? `TRANSFER CONTEXT: Candidate has demonstrated ${capabilityName}. Now test conceptual transfer to: ${transferConcept}` : ''}

LEVEL REQUIREMENTS:
- Level 1 (Knowledge): Conceptual MCQ or architectural explanation checking foundational mechanics.
- Level 2 (Application): Implementation coding task with test cases.
- Level 3 (Debugging): Broken code with race conditions, memory leaks, or logical bugs to fix.
- Level 4 (Scenario): Production incident or scale bottleneck requiring architectural triage.
- Level 5 (Transfer Challenge): Applying the core concept in an adjacent stack or distributed paradigm.
- Level 6 (Explanation): In-depth trade-off defense and justification.

Generate a complete AssessmentChallenge JSON object conforming to the schema.
`;
  }

  private generateFallbackChallenge(
    capabilityName: string,
    category: CapabilityCategory,
    level: AssessmentLevel,
    transferConcept?: string
  ): AssessmentChallenge {
    if (level === 2) {
      // Coding Application
      return {
        id: uuidv4(),
        capabilityName,
        category,
        level: 2,
        levelName: 'Application',
        type: 'coding',
        title: `Implement Production ${capabilityName} Algorithm`,
        prompt: `Implement a high-throughput algorithm using ${capabilityName} that handles concurrent requests and minimizes memory allocation.`,
        starterCode: `// Implement your solution for ${capabilityName}\nexport function executeTask(input: any[]): any {\n  // Your code here\n  return input.filter(Boolean);\n}`,
        testCases: [
          { id: 't1', input: '[1, 2, 3, null]', expectedOutput: '[1, 2, 3]' },
          { id: 't2', input: '[]', expectedOutput: '[]' },
        ],
        evaluationRubric: [
          { criteria: 'Correctness & Test Case Pass Rate', maxPoints: 50, description: 'All unit and edge tests pass.' },
          { criteria: 'Algorithmic Complexity & Memory Efficiency', maxPoints: 30, description: 'Optimal time and space complexity.' },
          { criteria: 'Code Cleanliness & Idiomatic Practices', maxPoints: 20, description: 'Clean typing, error handling, and structure.' },
        ],
        timeLimitSeconds: 600,
      };
    }

    if (level === 3) {
      // Debugging
      return {
        id: uuidv4(),
        capabilityName,
        category,
        level: 3,
        levelName: 'Debugging',
        type: 'debugging',
        title: `Debug Concurrency & Resource Leak in ${capabilityName}`,
        prompt: `The following ${capabilityName} implementation suffers from an unhandled promise rejection and race condition under load. Identify and fix the defect.`,
        starterCode: `async function processQueue(items: string[]) {\n  const results = [];\n  for (const item of items) {\n    // Bug: Unbounded parallel promises without error boundary\n    fetch(item).then(res => results.push(res));\n  }\n  return results;\n}`,
        evaluationRubric: [
          { criteria: 'Root Cause Identification', maxPoints: 40, description: 'Correctly identifies race condition and unhandled error.' },
          { criteria: 'Bug Fix & Concurrency Safety', maxPoints: 40, description: 'Resolves race condition using safe primitives.' },
          { criteria: 'Defensive Error Handling', maxPoints: 20, description: 'Graceful degradation.' },
        ],
        timeLimitSeconds: 480,
      };
    }

    if (level === 5) {
      // Transfer Challenge
      return {
        id: uuidv4(),
        capabilityName,
        category,
        level: 5,
        levelName: 'Transfer',
        type: 'transfer_challenge',
        title: `Transfer ${capabilityName} Principles to ${transferConcept || 'Distributed Architectures'}`,
        prompt: `You have demonstrated proficiency in single-node ${capabilityName}. Explain how you would adapt the identical caching and concurrency concepts when migrating to ${transferConcept || 'a multi-region distributed cluster'}.`,
        evaluationRubric: [
          { criteria: 'Conceptual Transfer Accuracy', maxPoints: 50, description: 'Direct translation of core mechanics to new paradigm.' },
          { criteria: 'Distributed Failure Modes Handling', maxPoints: 30, description: 'Addresses split-brain, network partitions, and replication lag.' },
          { criteria: 'Trade-off Articulation', maxPoints: 20, description: 'Clear reasoning of latency vs consistency.' },
        ],
        timeLimitSeconds: 600,
        transferConcept: transferConcept || 'Distributed Architectures',
      };
    }

    // Default Knowledge / Scenario
    return {
      id: uuidv4(),
      capabilityName,
      category,
      level: 1,
      levelName: 'Knowledge',
      type: 'mcq',
      title: `${capabilityName} Architecture & Core Mechanics`,
      prompt: `Which of the following best describes the core operational lifecycle and memory management model of ${capabilityName}?`,
      options: [
        { id: 'opt_1', text: 'Optimistic lock-free concurrency with non-blocking event loop I/O.', isCorrect: true },
        { id: 'opt_2', text: 'Pessimistic thread-locking on every I/O call without pooling.', isCorrect: false },
        { id: 'opt_3', text: 'Pure client-side rendering without runtime garbage collection.', isCorrect: false },
        { id: 'opt_4', text: 'Stateless RPC with zero memory caching layer.', isCorrect: false },
      ],
      evaluationRubric: [
        { criteria: 'Conceptual Accuracy', maxPoints: 100, description: 'Selection of correct architectural principle.' },
      ],
      timeLimitSeconds: 120,
    };
  }
}

export const challengeGenerator = new ChallengeGeneratorService();
