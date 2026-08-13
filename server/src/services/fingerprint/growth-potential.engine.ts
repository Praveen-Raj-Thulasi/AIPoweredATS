import {
  AssessmentSession,
  InterviewSessionState,
  EvidenceItem,
  ExplainabilityTrace,
} from '@ats/shared';

export interface GrowthPotentialCalculationResult {
  growthPotential: number; // 0 - 100%
  learningVelocityScore: number; // 0 - 100%
  growthEvidence: string[];
  traces: ExplainabilityTrace[];
}

export class GrowthPotentialEngine {
  /**
   * Estimates growth potential based on observed learning progression, transfer test results,
   * attempt score deltas, and adaptability across assessment/interview event traces.
   */
  calculateGrowthPotential(
    capabilityName: string,
    currentScore: number,
    assessments: AssessmentSession[],
    interviews: InterviewSessionState[],
    evidenceItems: EvidenceItem[]
  ): GrowthPotentialCalculationResult {
    const traces: ExplainabilityTrace[] = [];
    const growthEvidence: string[] = [];

    let baselineGrowth = Math.max(50, currentScore);
    let learningVelocityScore = 65;

    // 1. Check Assessment Cognitive Level Mastery & Attempt Score Deltas
    const relevantAttempts = assessments
      .flatMap((s) => s.attempts)
      .filter((a) => a.capabilityName.toLowerCase() === capabilityName.toLowerCase());

    if (relevantAttempts.length >= 2) {
      const firstAttempt = relevantAttempts[0];
      const lastAttempt = relevantAttempts[relevantAttempts.length - 1];
      const delta = lastAttempt.score - firstAttempt.score;

      if (delta > 0) {
        baselineGrowth += Math.min(15, Math.round(delta * 0.4));
        learningVelocityScore += 15;
        growthEvidence.push(
          `Observed +${delta}% score improvement across iterative challenge attempts`
        );
        traces.push({
          sourceType: 'assessment_delta',
          eventTitle: `Attempt Progression on ${capabilityName}`,
          scoreImpact: Math.min(15, Math.round(delta * 0.4)),
          rationale: `Candidate demonstrated rapid adaptation between challenge iterations (initial: ${firstAttempt.score}%, final: ${lastAttempt.score}%).`,
          timestamp: lastAttempt.evaluatedAt,
        });
      }
    }

    // 2. Check Level 5 Transfer Test Performance
    const transferAttempt = relevantAttempts.find((a) => a.level === 5 && a.isPassed);
    if (transferAttempt) {
      baselineGrowth += 12;
      learningVelocityScore += 18;
      growthEvidence.push(
        `Successfully passed Level 5 Transfer Challenge applying ${capabilityName} in adjacent distributed paradigm`
      );
      traces.push({
        sourceType: 'transfer_challenge',
        eventTitle: `Level 5 Conceptual Transfer Mastery`,
        scoreImpact: 12,
        rationale: `Candidate scored ${transferAttempt.score}% on conceptual transfer without rote memorization.`,
        timestamp: transferAttempt.evaluatedAt,
      });
    }

    // 3. Check Interview Probe Depth & Responsiveness to Hints
    const relevantTurns = interviews
      .flatMap((s) => s.turns)
      .filter((t) => t.capabilityName.toLowerCase() === capabilityName.toLowerCase() && t.turnEvaluation);

    if (relevantTurns.length >= 2) {
      const highReasoningTurns = relevantTurns.filter(
        (t) => (t.turnEvaluation?.technicalReasoningScore || 0) >= 80
      );
      if (highReasoningTurns.length > 0) {
        baselineGrowth += 8;
        growthEvidence.push(
          `Articulated deep architectural trade-off justification across ${relevantTurns.length} interview turns`
        );
        traces.push({
          sourceType: 'interview_turn',
          eventTitle: `Multi-Turn Technical Probe Defense`,
          scoreImpact: 8,
          rationale: `Candidate demonstrated consistent explanation depth and handled progressive constraints during interview probes.`,
          timestamp: relevantTurns[0].timestamp,
        });
      }
    }

    // 4. Multi-Source Evidence Diversity Boost
    const distinctSources = new Set(
      evidenceItems
        .filter((e) => e.capabilityName.toLowerCase() === capabilityName.toLowerCase())
        .map((e) => e.sourceType)
    );

    if (distinctSources.size >= 3) {
      baselineGrowth += 6;
      growthEvidence.push(
        `Substantiated across ${distinctSources.size} distinct verification stages (coding task, panel interview, project)`
      );
    }

    if (growthEvidence.length === 0) {
      growthEvidence.push(
        `Baseline growth estimation based on initial competency evidence and self-directed project submissions.`
      );
    }

    const finalGrowth = Math.min(96, Math.max(45, Math.round(baselineGrowth)));
    const finalVelocity = Math.min(98, Math.max(50, Math.round(learningVelocityScore)));

    return {
      growthPotential: finalGrowth,
      learningVelocityScore: finalVelocity,
      growthEvidence,
      traces,
    };
  }
}

export const growthPotentialEngine = new GrowthPotentialEngine();
