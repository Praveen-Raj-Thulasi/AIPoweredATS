import {
  DecisionReadinessEvaluation,
  DecisionReadinessState,
  JobCapabilityModel,
} from '@ats/shared';
import { consistencyEngine } from './consistency.engine';
import { nextActionEngine } from './next-action.engine';
import { atsStore } from '../../models/store';
import { ApiError } from '../../utils/errors';

export class DecisionReadinessService {
  /**
   * Evaluates if enough trustworthy, corroborated evidence exists for a human hiring decision
   */
  async evaluateReadiness(
    candidateId: string,
    jobId: string,
    organizationId?: string
  ): Promise<DecisionReadinessEvaluation> {
    const jobCapModel = await atsStore.getJobCapabilityModelByJobId(jobId, organizationId);
    if (!jobCapModel) {
      throw ApiError.notFound('Job Capability Model must be compiled for decision intelligence');
    }

    const candidateCapabilities = await atsStore.getCandidateCapabilities(candidateId);
    const claims = await atsStore.getCandidateClaims(candidateId);
    const evidence = await atsStore.getEvidenceItems(candidateId);

    // 1. Run Consistency Analysis for each capability
    const consistencyItems = jobCapModel.capabilities.map((reqCap) => {
      const candCap = candidateCapabilities.find(
        (c) => c.capabilityName.toLowerCase() === reqCap.name.toLowerCase()
      );
      return consistencyEngine.evaluateConsistency(reqCap, candCap, claims, evidence);
    });

    const verifiedCount = consistencyItems.filter((i) => i.consistencyStatus === 'consistent_evidence').length;
    const unsupportedCount = consistencyItems.filter((i) => i.consistencyStatus === 'unsupported_claim').length;
    const conflictingCount = consistencyItems.filter((i) => i.consistencyStatus === 'conflicting_evidence').length;
    const missingCount = consistencyItems.filter((i) => i.consistencyStatus === 'missing_evidence').length;

    const total = consistencyItems.length || 1;
    const readinessScore = Math.round(((verifiedCount * 1.0 + (total - conflictingCount - unsupportedCount) * 0.3) / total) * 100);

    // 2. Determine Decision Readiness State
    let readinessState: DecisionReadinessState = 'INSUFFICIENT_EVIDENCE';
    let explanation = '';

    if (conflictingCount > 0) {
      readinessState = 'REQUIRES_REVIEW';
      explanation = `${conflictingCount} capability exhibited conflicting signals across assessment or interview probes. Recruiter review recommended before final decision.`;
    } else if (verifiedCount >= Math.ceil(total * 0.75) && readinessScore >= 75) {
      readinessState = 'READY';
      explanation = `Candidate has demonstrated consistent, multi-stage proof across ${verifiedCount} of ${total} required capabilities. Sufficient evidence exists for offer deliberation.`;
    } else if (verifiedCount >= Math.ceil(total * 0.5) || readinessScore >= 60) {
      readinessState = 'MOSTLY_READY';
      explanation = `Core competencies substantiated. Minor secondary gaps remain (${unsupportedCount} unverified claims).`;
    } else {
      readinessState = 'INSUFFICIENT_EVIDENCE';
      explanation = `Insufficient independent proof across critical competencies (${unsupportedCount} unsupported claims, ${missingCount} unprobed). Additional verification recommended.`;
    }

    // 3. Recommend Next-Best Actions
    const nextBestActions = nextActionEngine.recommendNextActions(consistencyItems, jobCapModel.capabilities);

    return {
      candidateId,
      jobId,
      readinessState,
      readinessScore: Math.min(100, readinessScore),
      explanation,
      consistencyItems,
      nextBestActions,
      verifiedCount,
      unsupportedCount,
      conflictingCount,
      missingCount,
      evaluatedAt: new Date().toISOString(),
    };
  }
}

export const decisionReadinessService = new DecisionReadinessService();
