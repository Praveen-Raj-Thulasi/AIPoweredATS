import {
  CapabilityFingerprint,
  DimensionScore,
  CapabilityGrowthMetric,
  FingerprintDimension,
  CandidateCapability,
  JobCapabilityModel,
  Candidate,
} from '@ats/shared';
import { growthPotentialEngine } from './growth-potential.engine';
import { atsStore } from '../../models/store';

export class FingerprintService {
  /**
   * Generates a comprehensive, multidimensional Capability Fingerprint for a candidate
   */
  async generateFingerprint(
    candidateId: string,
    jobId?: string
  ): Promise<CapabilityFingerprint> {
    const candidate = await atsStore.getCandidateById(candidateId);
    const candidateName = candidate ? `${candidate.firstName} ${candidate.lastName}` : 'Candidate';

    const candidateCapabilities = await atsStore.getCandidateCapabilities(candidateId);
    const evidenceItems = await atsStore.getEvidenceItems(candidateId);
    const assessments = await atsStore.getAssessmentSessionsByCandidateId(candidateId);
    const interviews = await atsStore.getInterviewSessionsByCandidateId(candidateId);

    // 1. Calculate Capability Growth Metrics
    const capabilities: CapabilityGrowthMetric[] = candidateCapabilities.map((cap) => {
      const growthResult = growthPotentialEngine.calculateGrowthPotential(
        cap.capabilityName,
        cap.confidenceScore,
        assessments,
        interviews,
        evidenceItems
      );

      // Determine Freshness Status
      const updatedDate = new Date(cap.updatedAt || Date.now());
      const daysOld = Math.round((Date.now() - updatedDate.getTime()) / (1000 * 60 * 60 * 24));
      const freshnessStatus =
        daysOld <= 30
          ? 'active_last_30_days'
          : daysOld <= 180
          ? 'recent_last_6_months'
          : 'stale_over_1_year';

      return {
        capabilityName: cap.capabilityName,
        category: cap.category,
        currentCapability: cap.confidenceScore,
        evidenceConfidence: cap.evidenceQualityScore || cap.confidenceScore,
        evidenceState: cap.verificationState,
        freshnessStatus,
        freshnessDate: cap.updatedAt || new Date().toISOString(),
        growthPotential: growthResult.growthPotential,
        growthEvidence: growthResult.growthEvidence,
        traces: growthResult.traces,
      };
    });

    // 2. Synthesize 8 Core Fingerprint Dimensions
    const dimensions: DimensionScore[] = [
      this.computeDimension(
        'technical_capability',
        'Technical Execution',
        capabilities,
        evidenceItems,
        'languages_frameworks'
      ),
      this.computeDimension(
        'problem_solving',
        'Algorithmic Problem Solving',
        capabilities,
        evidenceItems,
        'testing_quality'
      ),
      this.computeDimension(
        'debugging',
        'Root-Cause Debugging',
        capabilities,
        evidenceItems,
        'systems_architecture'
      ),
      this.computeDimension(
        'system_design',
        'Distributed System Architecture',
        capabilities,
        evidenceItems,
        'systems_architecture'
      ),
      this.computeDimension(
        'communication',
        'Technical Communication & Clarity',
        capabilities,
        evidenceItems,
        'soft_skills'
      ),
      this.computeDimension(
        'adaptability',
        'Adaptability Under Constraints',
        capabilities,
        evidenceItems,
        'cloud_devops'
      ),
      this.computeDimension(
        'transferability',
        'Conceptual Transferability',
        capabilities,
        evidenceItems,
        'domain_knowledge'
      ),
      this.computeDimension(
        'ai_collaboration',
        'AI Assisted Engineering',
        capabilities,
        evidenceItems,
        'languages_frameworks'
      ),
    ];

    const overallGrowthPotential =
      capabilities.length > 0
        ? Math.round(capabilities.reduce((acc, c) => acc + c.growthPotential, 0) / capabilities.length)
        : 75;

    const learningVelocityScore =
      dimensions.find((d) => d.dimension === 'transferability')?.score || 80;

    return {
      candidateId,
      candidateName,
      jobId,
      dimensions,
      capabilities,
      overallGrowthPotential,
      learningVelocityScore,
      evaluatedAt: new Date().toISOString(),
    };
  }

  private computeDimension(
    dimension: FingerprintDimension,
    label: string,
    capabilities: CapabilityGrowthMetric[],
    evidence: any[],
    targetCategory: string
  ): DimensionScore {
    const matchingCaps = capabilities.filter(
      (c) => c.category === targetCategory || capabilities.length <= 3
    );
    const avgScore =
      matchingCaps.length > 0
        ? Math.round(matchingCaps.reduce((acc, c) => acc + c.currentCapability, 0) / matchingCaps.length)
        : 70;

    const avgConfidence =
      matchingCaps.length > 0
        ? Math.round(matchingCaps.reduce((acc, c) => acc + c.evidenceConfidence, 0) / matchingCaps.length)
        : 65;

    const evidenceCount = evidence.length;

    return {
      dimension,
      label,
      score: Math.min(98, Math.max(25, avgScore)),
      confidence: Math.min(98, Math.max(30, avgConfidence)),
      evidenceCount,
      evidenceSummary: `Synthesized across ${matchingCaps.length} competencies and ${evidenceCount} verified evidence items.`,
    };
  }
}

export const fingerprintService = new FingerprintService();
