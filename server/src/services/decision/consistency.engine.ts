import {
  Capability,
  CandidateCapability,
  CandidateClaim,
  EvidenceItem,
  CapabilityConsistencyItem,
  ConsistencyCategory,
  NextBestAction,
} from '@ats/shared';
import { v4 as uuidv4 } from 'uuid';

export class ConsistencyEngine {
  /**
   * Analyzes multi-stage evidence signals for a capability and identifies consistency,
   * conflicts, unsupported claims, and gaps without ever labeling candidates as fraudulent.
   */
  evaluateConsistency(
    capability: Capability,
    candidateCapability: CandidateCapability | undefined,
    claims: CandidateClaim[],
    evidence: EvidenceItem[]
  ): CapabilityConsistencyItem {
    const capName = capability.name.toLowerCase();
    const matchingClaims = claims.filter((c) => c.capabilityName.toLowerCase() === capName);
    const matchingEvidence = evidence.filter((e) => e.capabilityName.toLowerCase() === capName);

    const hasResumeClaim =
      matchingClaims.length > 0 || matchingEvidence.some((e) => e.sourceType === 'resume');
    const hasProjectEvidence = matchingEvidence.some(
      (e) => (e.sourceType === 'project' || e.sourceType === 'github_project' || e.sourceType === 'portfolio') && e.state === 'supports'
    );
    const hasAssessmentEvidence = matchingEvidence.some(
      (e) => (e.sourceType === 'assessment' || e.sourceType === 'coding_task' || e.sourceType === 'transfer_test') && e.state === 'supports'
    );
    const hasInterviewEvidence = matchingEvidence.some(
      (e) => e.sourceType === 'interview' && e.state === 'supports'
    );
    const hasObservation = matchingEvidence.some(
      (e) => e.sourceType === 'recruiter_observation' && e.state === 'supports'
    );

    const hasContradiction = matchingEvidence.some((e) => e.state === 'contradicts');

    const sourcesBreakdown = {
      resume: hasResumeClaim,
      projects: hasProjectEvidence,
      assessments: hasAssessmentEvidence,
      interviews: hasInterviewEvidence,
      observations: hasObservation,
    };

    let consistencyStatus: ConsistencyCategory = 'missing_evidence';
    let explanation = '';
    let confidenceScore = candidateCapability ? candidateCapability.confidenceScore : 0;
    let recommendedAction: NextBestAction | undefined = undefined;

    // 1. Conflicting Evidence Check (e.g. positive claim / project vs negative assessment/interview)
    if (hasContradiction) {
      consistencyStatus = 'conflicting_evidence';
      explanation = `Conflicting signals detected between submitted claim/project and live technical assessment or panel feedback.`;
      recommendedAction = {
        id: uuidv4(),
        actionType: 'technical_follow_up',
        title: `Targeted Technical Deep-Dive on ${capability.name}`,
        targetCapability: capability.name,
        rationale: `Resolve conflicting performance signals through focused live architectural inquiry.`,
        estimatedInformationGain: 85,
        recommendedStage: 'interview',
      };
    }
    // 2. Consistent Evidence (Corroborated across 2+ distinct verification stages)
    else if (
      (hasAssessmentEvidence && hasInterviewEvidence) ||
      (hasAssessmentEvidence && hasProjectEvidence) ||
      (hasInterviewEvidence && hasProjectEvidence)
    ) {
      consistencyStatus = 'consistent_evidence';
      explanation = `Demonstrated consistent proficiency across independent coding tasks, projects, and interview probes.`;
    }
    // 3. Unsupported Claim (Appears only on resume / claim without independent proof)
    else if (hasResumeClaim && !hasProjectEvidence && !hasAssessmentEvidence && !hasInterviewEvidence) {
      consistencyStatus = 'unsupported_claim';
      explanation = `Competency claimed on resume, but lacks independent hands-on verification.`;
      recommendedAction = {
        id: uuidv4(),
        actionType: 'debugging_challenge',
        title: `Practical ${capability.name} Debugging Task`,
        targetCapability: capability.name,
        rationale: `Substantiate resume claim through hands-on concurrency/debugging challenge.`,
        estimatedInformationGain: 75,
        recommendedStage: 'assessment',
      };
    }
    // 4. Missing Evidence (No claim, no assessment, no interview)
    else if (!hasResumeClaim && matchingEvidence.length === 0) {
      consistencyStatus = 'missing_evidence';
      explanation = `No evidence or candidate claim recorded for required job capability.`;
      recommendedAction = {
        id: uuidv4(),
        actionType: 'verification_question',
        title: `Inquire into Prior Experience with ${capability.name}`,
        targetCapability: capability.name,
        rationale: `Probe unlisted competency during preliminary screening.`,
        estimatedInformationGain: 60,
        recommendedStage: 'screening',
      };
    }
    // 5. Partial / Stale
    else {
      consistencyStatus = 'unsupported_claim';
      explanation = `Single-source evidence available (e.g. project only); additional cross-stage corroboration recommended.`;
      recommendedAction = {
        id: uuidv4(),
        actionType: 'technical_follow_up',
        title: `Interview Probe: ${capability.name}`,
        targetCapability: capability.name,
        rationale: `Corroborate project experience with live panel questioning.`,
        estimatedInformationGain: 70,
        recommendedStage: 'interview',
      };
    }

    return {
      capabilityName: capability.name,
      category: capability.category,
      consistencyStatus,
      sourcesBreakdown,
      confidenceScore,
      explanation,
      recommendedAction,
    };
  }
}

export const consistencyEngine = new ConsistencyEngine();
