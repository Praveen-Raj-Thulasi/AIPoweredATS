import {
  CandidateCapability,
  Capability,
  CapabilityImportance,
  AssessmentLevel,
  UncertaintyMetrics,
} from '@ats/shared';

const IMPORTANCE_WEIGHTS: Record<CapabilityImportance, number> = {
  critical: 4.0,
  high: 3.0,
  medium: 2.0,
  low: 1.0,
};

export class UncertaintyEngine {
  /**
   * Evaluates the candidate's capability profile against job requirements and computes
   * information gain priorities to select the highest-value unresolved competency.
   */
  computeUncertainty(
    candidateId: string,
    jobCapabilities: Capability[],
    candidateCapabilities: CandidateCapability[]
  ): UncertaintyMetrics {
    const competencies = jobCapabilities.map((reqCap) => {
      const candidateCap = candidateCapabilities.find(
        (c) => c.capabilityName.toLowerCase() === reqCap.name.toLowerCase()
      );

      const confidence = candidateCap ? candidateCap.confidenceScore : 0;
      const uncertaintyScore = Math.max(0, 100 - confidence);
      const importanceWeight = IMPORTANCE_WEIGHTS[reqCap.importance] || 2.0;

      // Priority = Importance Weight * Uncertainty Score
      const priorityScore = Math.round(importanceWeight * uncertaintyScore);

      // Determine recommended cognitive level (1-6)
      let recommendedLevel: AssessmentLevel = 1;
      if (candidateCap) {
        if (candidateCap.verificationState === 'VERIFIED') {
          // If already verified on fundamentals, test conceptual transfer!
          recommendedLevel = 5; // Transfer level
        } else if (candidateCap.verificationState === 'PARTIALLY_VERIFIED') {
          // If partial (e.g. passed basic code), test debugging or scenario
          recommendedLevel = 3; // Debugging or Scenario
        } else if (candidateCap.verificationState === 'CONTRADICTED') {
          // If contradicted, test specific scenario/debugging
          recommendedLevel = 3;
        } else {
          // Insufficient evidence or unverified
          recommendedLevel = candidateCap.evidenceCount > 0 ? 2 : 1;
        }
      }

      return {
        capabilityName: reqCap.name,
        importance: reqCap.importance,
        confidenceScore: confidence,
        uncertaintyScore,
        priorityScore,
        recommendedLevel,
      };
    });

    // Sort competencies by highest information gain priority
    competencies.sort((a, b) => b.priorityScore - a.priorityScore);

    const overallUncertaintyScore =
      competencies.length > 0
        ? Math.round(
            competencies.reduce((acc, c) => acc + c.uncertaintyScore, 0) / competencies.length
          )
        : 0;

    return {
      candidateId,
      overallUncertaintyScore,
      competencies,
    };
  }

  /**
   * Selects the next highest-value competency and level to evaluate
   */
  selectNextTarget(
    metrics: UncertaintyMetrics,
    evaluatedNamesInSession: string[] = []
  ): { capabilityName: string; level: AssessmentLevel } | null {
    const unvisited = metrics.competencies.filter(
      (c) => !evaluatedNamesInSession.includes(c.capabilityName.toLowerCase())
    );

    if (unvisited.length > 0) {
      return {
        capabilityName: unvisited[0].capabilityName,
        level: unvisited[0].recommendedLevel,
      };
    }

    if (metrics.competencies.length > 0) {
      return {
        capabilityName: metrics.competencies[0].capabilityName,
        level: 5, // Fallback to transfer challenge
      };
    }

    return null;
  }
}

export const uncertaintyEngine = new UncertaintyEngine();
