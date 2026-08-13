import {
  EvidenceReuseAnalysis,
  Job,
  CapabilityImportance,
} from '@ats/shared';
import { atsStore } from '../../models/store';
import { evidenceFreshnessService } from './evidence-freshness.service';
import { consentService } from './consent.service';

export class EvidenceReuseService {
  /**
   * Analyze cross-job evidence reuse for a candidate applying to a target job
   */
  async analyzeEvidenceReuse(
    candidateId: string,
    targetJobId: string
  ): Promise<EvidenceReuseAnalysis> {
    const job = await atsStore.getJobById(targetJobId);
    if (!job) {
      throw new Error(`Target Job not found: ${targetJobId}`);
    }

    const consent = await consentService.getConsentSettings(candidateId);
    const existingCaps = await atsStore.getCandidateCapabilities(candidateId);
    const jobCapModel = await atsStore.getJobCapabilityModelByJobId(targetJobId, job.organizationId);

    // Get required capabilities for the target job
    const targetCapabilities: { name: string; importance: CapabilityImportance }[] = [];

    if (jobCapModel && jobCapModel.capabilities?.length > 0) {
      jobCapModel.capabilities.forEach((c) => {
        targetCapabilities.push({ name: c.name, importance: c.importance });
      });
    } else {
      (job.requiredSkills || []).forEach((skill) => {
        targetCapabilities.push({ name: skill, importance: 'critical' });
      });
    }

    const reusableCapabilities: EvidenceReuseAnalysis['reusableCapabilities'] = [];
    const requiredNewAssessments: EvidenceReuseAnalysis['requiredNewAssessments'] = [];

    let totalSavedMinutes = 0;

    for (const targetCap of targetCapabilities) {
      const match = existingCaps.find(
        (c) =>
          c.capabilityName.toLowerCase().includes(targetCap.name.toLowerCase()) ||
          targetCap.name.toLowerCase().includes(c.capabilityName.toLowerCase())
      );

      const isConsentGranted = await consentService.isSharingAllowed(
        candidateId,
        targetCap.name,
        job.organizationId
      );

      if (
        match &&
        (match.verificationState === 'VERIFIED' || match.verificationState === 'PARTIALLY_VERIFIED') &&
        isConsentGranted
      ) {
        const freshness = evidenceFreshnessService.evaluateFreshness(
          match.capabilityName,
          match.freshnessDate || match.updatedAt
        );

        if (freshness.status !== 'STALE') {
          reusableCapabilities.push({
            capabilityName: targetCap.name,
            confidence: match.confidenceScore,
            freshnessStatus: freshness.status,
            evidenceCount: match.evidenceCount || 1,
          });
          // 40 minutes saved per reused verified capability
          totalSavedMinutes += 40;
          continue;
        }
      }

      // If not reusable, candidate needs targeted assessment
      const rationale = !match
        ? `No prior verified evidence recorded for ${targetCap.name}.`
        : !isConsentGranted
        ? `Evidence exists but candidate consent does not permit cross-job reuse for this competency.`
        : `Prior evidence is stale and requires updated verification.`;

      requiredNewAssessments.push({
        capabilityName: targetCap.name,
        importance: targetCap.importance,
        rationale,
      });
    }

    const explanation =
      reusableCapabilities.length > 0
        ? `Reused verified evidence for ${reusableCapabilities.length} competencies (${reusableCapabilities
            .map((c) => c.capabilityName)
            .join(', ')}). Candidate will only be assessed on remaining ${requiredNewAssessments.length} target areas, saving ~${totalSavedMinutes} minutes of assessment fatigue.`
        : `No prior verified evidence could be reused. Candidate will complete full evaluation.`;

    return {
      targetJobId,
      targetJobTitle: job.title,
      reusableCapabilities,
      requiredNewAssessments,
      assessmentTimeSavedMinutes: totalSavedMinutes,
      reuseAllowedByConsent: consent.allowCrossJobReuse,
      explanation,
    };
  }
}

export const evidenceReuseService = new EvidenceReuseService();
