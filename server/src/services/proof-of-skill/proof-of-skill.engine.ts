import {
  CandidateCapability,
  CandidateClaim,
  EvidenceItem,
  EvidenceSourceType,
  VerificationState,
  ProofOfSkillEvaluation,
  CapabilityCategory,
} from '@ats/shared';

// Source reliability weights based on verifiable signal strength
export const EVIDENCE_SOURCE_WEIGHTS: Record<EvidenceSourceType, number> = {
  coding_task: 1.0,
  transfer_test: 0.95,
  assessment: 0.9,
  interview: 0.85,
  github_project: 0.8,
  portfolio: 0.75,
  certification: 0.7,
  recruiter_observation: 0.65,
  project: 0.6,
  resume: 0.2, // Resume claims have lowest inherent proof weight
};

export class ProofOfSkillEngine {
  /**
   * Evaluates a single candidate capability based on accumulated multi-source evidence and claims
   */
  evaluateCapability(
    candidateId: string,
    capabilityName: string,
    category: CapabilityCategory,
    evidenceItems: EvidenceItem[],
    claims: CandidateClaim[],
    organizationId?: string
  ): CandidateCapability {
    const matchingEvidence = evidenceItems.filter(
      (e) => e.capabilityName.toLowerCase() === capabilityName.toLowerCase()
    );
    const matchingClaims = claims.filter(
      (c) => c.capabilityName.toLowerCase() === capabilityName.toLowerCase()
    );

    // 1. Check for Contradictions
    const hasContradiction = matchingEvidence.some((e) => e.state === 'contradicts');
    if (hasContradiction) {
      return {
        id: `cc_${candidateId}_${capabilityName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        candidateId,
        organizationId,
        capabilityName,
        category,
        verificationState: 'CONTRADICTED',
        confidenceScore: 15,
        evidenceCount: matchingEvidence.length,
        evidenceQualityScore: 20,
        evidenceDiversityScore: 30,
        evidenceBreakdown: this.buildBreakdown(matchingEvidence, matchingClaims),
        evidenceItems: matchingEvidence,
        recommendedAction: `Contradiction detected in assessment or interview feedback. Targeted verification required.`,
        updatedAt: new Date().toISOString(),
      };
    }

    // 2. If no evidence at all
    if (matchingEvidence.length === 0) {
      const hasClaim = matchingClaims.length > 0;
      return {
        id: `cc_${candidateId}_${capabilityName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        candidateId,
        organizationId,
        capabilityName,
        category,
        verificationState: hasClaim ? 'INSUFFICIENT_EVIDENCE' : 'UNVERIFIED',
        confidenceScore: hasClaim ? 20 : 0,
        evidenceCount: 0,
        evidenceQualityScore: 0,
        evidenceDiversityScore: 0,
        evidenceBreakdown: this.buildBreakdown(matchingEvidence, matchingClaims),
        evidenceItems: [],
        recommendedAction: hasClaim
          ? `Candidate claimed ${capabilityName} in resume. Assign technical assessment or coding task to verify.`
          : `No claim or evidence found for ${capabilityName}.`,
        updatedAt: new Date().toISOString(),
      };
    }

    // 3. Calculate Evidence Quality Score (0-100)
    let weightedScoreSum = 0;
    let totalWeights = 0;

    matchingEvidence.forEach((item) => {
      const baseWeight = EVIDENCE_SOURCE_WEIGHTS[item.sourceType] || 0.5;
      const score = item.sourceScore !== undefined ? item.sourceScore : item.state === 'supports' ? 90 : 50;
      weightedScoreSum += score * baseWeight;
      totalWeights += baseWeight;
    });

    const evidenceQualityScore = Math.min(100, Math.round(weightedScoreSum / totalWeights));

    // 4. Calculate Evidence Diversity Score (0-100)
    const distinctSourceTypes = new Set(matchingEvidence.map((e) => e.sourceType));
    // Having >= 3 distinct verifiable sources (e.g. resume + assessment + interview) gives 100% diversity
    const evidenceDiversityScore = Math.min(100, Math.round((distinctSourceTypes.size / 3) * 100));

    // 5. Check High-Fidelity Verification Sources
    const hasVerifiedCodeOrAssessment = matchingEvidence.some(
      (e) => (e.sourceType === 'coding_task' || e.sourceType === 'assessment' || e.sourceType === 'transfer_test') && e.state === 'supports'
    );
    const hasVerifiedInterview = matchingEvidence.some(
      (e) => e.sourceType === 'interview' && e.state === 'supports'
    );
    const hasVerifiedProjectOrGithub = matchingEvidence.some(
      (e) => (e.sourceType === 'github_project' || e.sourceType === 'project' || e.sourceType === 'portfolio') && e.state === 'supports'
    );

    // 6. Compute Final Confidence Score & Verification State
    let confidenceScore = Math.round(evidenceQualityScore * 0.65 + evidenceDiversityScore * 0.35);

    let verificationState: VerificationState = 'INSUFFICIENT_EVIDENCE';
    let recommendedAction = '';

    // Only Resume / Claim
    if (distinctSourceTypes.size === 1 && distinctSourceTypes.has('resume')) {
      verificationState = 'INSUFFICIENT_EVIDENCE';
      confidenceScore = Math.min(30, confidenceScore);
      recommendedAction = `Resume claim only. Verification via coding task or panel interview required.`;
    }
    // High-Fidelity Multi-Source Verification
    else if ((hasVerifiedCodeOrAssessment && hasVerifiedInterview) || (hasVerifiedCodeOrAssessment && hasVerifiedProjectOrGithub)) {
      verificationState = 'VERIFIED';
      confidenceScore = Math.max(85, confidenceScore);
      recommendedAction = `Capability fully substantiated by multi-stage evidence.`;
    }
    // Partial Verification (e.g. Project + Resume or single Assessment without Interview)
    else if (hasVerifiedCodeOrAssessment || hasVerifiedInterview || hasVerifiedProjectOrGithub) {
      verificationState = 'PARTIALLY_VERIFIED';
      confidenceScore = Math.min(80, Math.max(50, confidenceScore));
      recommendedAction = !hasVerifiedInterview
        ? `Substantiate proficiency during upcoming technical panel interview.`
        : `Assign practical coding challenge for end-to-end verification.`;
    } else {
      verificationState = 'INSUFFICIENT_EVIDENCE';
      confidenceScore = Math.min(45, confidenceScore);
      recommendedAction = `Additional proof-of-ability evidence required.`;
    }

    return {
      id: `cc_${candidateId}_${capabilityName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      candidateId,
      organizationId,
      capabilityName,
      category,
      verificationState,
      confidenceScore,
      evidenceCount: matchingEvidence.length,
      evidenceQualityScore,
      evidenceDiversityScore,
      evidenceBreakdown: this.buildBreakdown(matchingEvidence, matchingClaims),
      evidenceItems: matchingEvidence,
      recommendedAction,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Evaluates a candidate against an entire set of required capabilities
   */
  evaluateCandidate(
    candidateId: string,
    capabilities: { name: string; category: CapabilityCategory }[],
    evidenceItems: EvidenceItem[],
    claims: CandidateClaim[],
    jobId?: string
  ): ProofOfSkillEvaluation {
    const evaluatedCaps = capabilities.map((c) =>
      this.evaluateCapability(candidateId, c.name, c.category, evidenceItems, claims)
    );

    const verifiedCount = evaluatedCaps.filter((c) => c.verificationState === 'VERIFIED').length;
    const partiallyVerifiedCount = evaluatedCaps.filter((c) => c.verificationState === 'PARTIALLY_VERIFIED').length;
    const insufficientCount = evaluatedCaps.filter((c) => c.verificationState === 'INSUFFICIENT_EVIDENCE' || c.verificationState === 'UNVERIFIED').length;
    const contradictedCount = evaluatedCaps.filter((c) => c.verificationState === 'CONTRADICTED').length;

    const total = evaluatedCaps.length;
    const overallVerificationRate = total > 0 ? Math.round(((verifiedCount * 1.0 + partiallyVerifiedCount * 0.5) / total) * 100) : 0;

    return {
      candidateId,
      jobId,
      capabilities: evaluatedCaps,
      overallVerificationRate,
      verifiedCount,
      partiallyVerifiedCount,
      insufficientCount,
      contradictedCount,
      evaluatedAt: new Date().toISOString(),
    };
  }

  private buildBreakdown(
    evidence: EvidenceItem[],
    claims: CandidateClaim[]
  ): { sourceType: EvidenceSourceType; status: 'verified' | 'partial' | 'contradicted' | 'missing'; label: string; count: number }[] {
    const sources: { type: EvidenceSourceType; label: string }[] = [
      { type: 'resume', label: 'Resume Claim' },
      { type: 'github_project', label: 'GitHub / Code Project' },
      { type: 'coding_task', label: 'Coding Assessment' },
      { type: 'interview', label: 'Panel Interview' },
      { type: 'recruiter_observation', label: 'Recruiter Observation' },
    ];

    return sources.map((s) => {
      const items = evidence.filter((e) => e.sourceType === s.type);
      const isClaimOnly = s.type === 'resume' && claims.length > 0 && items.length === 0;

      let status: 'verified' | 'partial' | 'contradicted' | 'missing' = 'missing';

      if (items.some((i) => i.state === 'contradicts')) {
        status = 'contradicted';
      } else if (items.some((i) => i.state === 'supports')) {
        status = 'verified';
      } else if (items.some((i) => i.state === 'partially_supports') || isClaimOnly) {
        status = 'partial';
      }

      return {
        sourceType: s.type,
        status,
        label: s.label,
        count: items.length || (isClaimOnly ? 1 : 0),
      };
    });
  }
}

export const proofOfSkillEngine = new ProofOfSkillEngine();
