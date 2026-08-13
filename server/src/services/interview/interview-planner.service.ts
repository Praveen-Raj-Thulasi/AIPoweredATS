import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { JobCapabilityModel, CandidateCapability, InterviewPlan } from '@ats/shared';
import { aiProvider } from '../ai/bedrock.provider';
import { logger } from '../../utils/logger';

const InterviewPlanSchema = z.object({
  plannedCompetencies: z.array(
    z.object({
      capabilityName: z.string(),
      keyProbeQuestions: z.array(z.string()).min(1),
      targetProficiency: z.enum(['foundational', 'intermediate', 'advanced', 'expert']),
    })
  ),
});

export class InterviewPlannerService {
  /**
   * Synthesizes a structured, capability-driven interview plan tailored to candidate gaps
   */
  async generateInterviewPlan(
    jobCapabilityModel: JobCapabilityModel,
    candidateCapabilities: CandidateCapability[],
    candidateId: string,
    jobId: string
  ): Promise<InterviewPlan> {
    const prompt = `
Generate a structured, capability-linked technical interview plan for Job: ${jobCapabilityModel.originalJdSnapshot.title}.

TARGET CAPABILITIES & EXPECTED PROFICIENCIES:
${jobCapabilityModel.capabilities
  .map((c) => `- ${c.name} (${c.importance} importance, expected: ${c.expectedProficiency})`)
  .join('\n')}

CURRENT CANDIDATE VERIFICATION GAPS:
${candidateCapabilities
  .map((cc) => `- ${cc.capabilityName}: ${cc.verificationState} (${cc.confidenceScore}% confidence)`)
  .join('\n')}

REQUIREMENTS:
- For each target capability, formulate 2-3 deep, open-ended probe questions.
- Focus on real-world system architecture, failure modes, trade-offs, and production experiences.
- Avoid generic trivia.
`;

    try {
      const response = await aiProvider.generateStructured(prompt, InterviewPlanSchema, {
        temperature: 0.3,
        systemPrompt:
          'You are a Principal Engineering Interview Architect. Generate rigorous, capability-driven technical probe questions that separate memorized theory from production experience.',
      });

      return {
        id: uuidv4(),
        jobId,
        candidateId,
        plannedCompetencies: response.data.plannedCompetencies,
      };
    } catch (err: any) {
      logger.warn(`[Interview Planner] AI plan generation error, falling back to deterministic plan: ${err.message}`);
      return this.generateFallbackPlan(jobCapabilityModel, candidateId, jobId);
    }
  }

  private generateFallbackPlan(
    jobCapabilityModel: JobCapabilityModel,
    candidateId: string,
    jobId: string
  ): InterviewPlan {
    return {
      id: uuidv4(),
      jobId,
      candidateId,
      plannedCompetencies: jobCapabilityModel.capabilities.map((c) => ({
        capabilityName: c.name,
        targetProficiency: c.expectedProficiency,
        keyProbeQuestions: [
          `Can you walk me through how you designed or implemented ${c.name} in a production environment?`,
          `What trade-offs or bottlenecks did you encounter while utilizing ${c.name}, and how did you resolve them?`,
          `How would you architect a resilient fallback if the ${c.name} component encountered a cascading failure?`,
        ],
      })),
    };
  }
}

export const interviewPlanner = new InterviewPlannerService();
