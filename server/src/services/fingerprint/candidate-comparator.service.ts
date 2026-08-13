import {
  CandidateComparisonReport,
  CandidateComparisonItem,
  DecisionReadiness,
  FingerprintDimension,
  JobCapabilityModel,
} from '@ats/shared';
import { fingerprintService } from './fingerprint.service';
import { atsStore } from '../../models/store';
import { ApiError } from '../../utils/errors';

export class CandidateComparatorService {
  /**
   * Generates a structured, multi-dimensional candidate comparison report for a job requisition
   */
  async compareCandidates(
    jobId: string,
    candidateIds: string[]
  ): Promise<CandidateComparisonReport> {
    const job = await atsStore.getJobById(jobId);
    if (!job) throw ApiError.notFound('Job requisition not found');

    const jobCapModel = await atsStore.getJobCapabilityModelByJobId(jobId);
    const requiredCapNames = jobCapModel
      ? jobCapModel.capabilities.map((c) => c.name)
      : job.requiredSkills;

    const candidates: CandidateComparisonItem[] = [];

    for (const candId of candidateIds) {
      const candidate = await atsStore.getCandidateById(candId);
      if (!candidate) continue;

      const fingerprint = await fingerprintService.generateFingerprint(candId, jobId);

      const dimensionScores: Record<FingerprintDimension, number> = {} as any;
      fingerprint.dimensions.forEach((d) => {
        dimensionScores[d.dimension] = d.score;
      });

      const capabilityScores: Record<
        string,
        { current: number; confidence: number; growth: number; state: any }
      > = {};

      let totalCurrent = 0;
      let totalConf = 0;
      let verifiedCount = 0;

      fingerprint.capabilities.forEach((c) => {
        capabilityScores[c.capabilityName] = {
          current: c.currentCapability,
          confidence: c.evidenceConfidence,
          growth: c.growthPotential,
          state: c.evidenceState,
        };
        totalCurrent += c.currentCapability;
        totalConf += c.evidenceConfidence;
        if (c.evidenceState === 'VERIFIED') verifiedCount += 1;
      });

      const capCount = fingerprint.capabilities.length || 1;
      const overallMatchScore = Math.round(totalCurrent / capCount);
      const averageConfidence = Math.round(totalConf / capCount);

      // Determine Decision Readiness
      let decisionReadiness: DecisionReadiness = 'insufficient_evidence';
      if (verifiedCount >= 3 && averageConfidence >= 80) {
        decisionReadiness = 'ready_for_offer';
      } else if (averageConfidence >= 50) {
        decisionReadiness = 'needs_targeted_verification';
      }

      // Identify Key Strengths & Critical Gaps
      const keyStrengths = fingerprint.capabilities
        .filter((c) => c.currentCapability >= 80)
        .map((c) => `${c.capabilityName} (${c.currentCapability}%)`);

      const criticalGaps = fingerprint.capabilities
        .filter((c) => c.currentCapability < 55 || c.evidenceState === 'INSUFFICIENT_EVIDENCE')
        .map((c) => `${c.capabilityName} (Unverified / Low Confidence)`);

      candidates.push({
        candidateId: candId,
        candidateName: `${candidate.firstName} ${candidate.lastName}`,
        overallMatchScore,
        averageConfidence,
        overallGrowthPotential: fingerprint.overallGrowthPotential,
        decisionReadiness,
        keyStrengths: keyStrengths.slice(0, 3),
        criticalGaps: criticalGaps.slice(0, 3),
        dimensionScores,
        capabilityScores,
      });
    }

    return {
      jobId,
      jobTitle: job.title,
      candidates,
      evaluatedAt: new Date().toISOString(),
    };
  }
}

export const candidateComparator = new CandidateComparatorService();
