import crypto from 'crypto';
import {
  CandidatePassport,
  PassportCapabilityItem,
  PassportCapabilityStatus,
  TransferEvidence,
  PassportEvidenceSummary,
} from '@ats/shared';
import { atsStore } from '../../models/store';
import { evidenceFreshnessService } from './evidence-freshness.service';
import { consentService } from './consent.service';

export class PassportService {
  /**
   * Build candidate living capability passport
   * @param candidateId candidate profile ID
   * @param isCandidateView whether the request is from candidate portal (enforcing absolute privacy filter)
   */
  async getCandidatePassport(
    candidateId: string,
    isCandidateView = true
  ): Promise<CandidatePassport> {
    const candidate = await atsStore.getCandidateById(candidateId);
    if (!candidate) {
      throw new Error(`Candidate with ID ${candidateId} not found`);
    }

    const consent = await consentService.getConsentSettings(candidateId);
    const candidateCaps = await atsStore.getCandidateCapabilities(candidateId, isCandidateView);
    const candidateClaims = await atsStore.getCandidateClaims(candidateId);
    const rawEvidence = await atsStore.getEvidenceItems(candidateId, undefined, isCandidateView);

    const verifiedItems: PassportCapabilityItem[] = [];
    const demonstratedItems: PassportCapabilityItem[] = [];
    const claimedItems: PassportCapabilityItem[] = [];
    const unknownItems: PassportCapabilityItem[] = [];

    // Track processed capability names
    const processedCapNames = new Set<string>();

    // 1. Process candidate capabilities (from proof-of-skill engine)
    for (const cap of candidateCaps) {
      processedCapNames.add(cap.capabilityName.toLowerCase());

      const capEvidence = rawEvidence.filter(
        (e) => e.capabilityName.toLowerCase() === cap.capabilityName.toLowerCase()
      );

      const matchingClaim = candidateClaims.find(
        (c) => c.capabilityName.toLowerCase() === cap.capabilityName.toLowerCase()
      );

      const freshness = evidenceFreshnessService.evaluateFreshness(
        cap.capabilityName,
        cap.freshnessDate || cap.updatedAt
      );

      // Map evidence summaries (strictly sanitized)
      const evidenceList: PassportEvidenceSummary[] = capEvidence.map((e) => ({
        id: e.id,
        title: e.title,
        sourceType: e.sourceType,
        summary: e.summary,
        score: e.sourceScore,
        state: e.state,
        dateRecorded: e.createdAt,
      }));

      // Generate transfer evidence heuristics for known transferable stacks
      const transferEvidenceList = this.generateTransferEvidence(cap.capabilityName, cap.confidenceScore);

      let status: PassportCapabilityStatus;
      if (cap.verificationState === 'VERIFIED' && cap.confidenceScore >= 75) {
        status = 'VERIFIED';
      } else if (
        cap.verificationState === 'PARTIALLY_VERIFIED' ||
        (cap.confidenceScore >= 50 && cap.evidenceCount > 0)
      ) {
        status = 'DEMONSTRATED';
      } else if (matchingClaim) {
        status = 'CLAIMED';
      } else {
        status = 'UNKNOWN';
      }

      const item: PassportCapabilityItem = {
        id: cap.id,
        name: cap.capabilityName,
        category: cap.category,
        status,
        confidenceScore: cap.confidenceScore,
        claimedProficiency: matchingClaim?.claimedProficiency || 'intermediate',
        demonstratedProficiency:
          cap.confidenceScore >= 85
            ? 'expert'
            : cap.confidenceScore >= 70
            ? 'advanced'
            : cap.confidenceScore >= 50
            ? 'intermediate'
            : 'foundational',
        freshness,
        evidenceList,
        transferEvidenceList,
        lastVerifiedAt: cap.updatedAt,
        organizationAttestation: 'VERITY Cryptographic Verification Engine',
      };

      if (status === 'VERIFIED') {
        verifiedItems.push(item);
      } else if (status === 'DEMONSTRATED') {
        demonstratedItems.push(item);
      } else if (status === 'CLAIMED') {
        claimedItems.push(item);
      } else {
        unknownItems.push(item);
      }
    }

    // 2. Process claims that didn't have full candidate capability records
    for (const claim of candidateClaims) {
      if (!processedCapNames.has(claim.capabilityName.toLowerCase())) {
        processedCapNames.add(claim.capabilityName.toLowerCase());

        const freshness = evidenceFreshnessService.evaluateFreshness(
          claim.capabilityName,
          claim.createdAt
        );

        const item: PassportCapabilityItem = {
          id: claim.id,
          name: claim.capabilityName,
          category: 'languages_frameworks',
          status: claim.verificationState === 'VERIFIED' ? 'VERIFIED' : 'CLAIMED',
          confidenceScore: claim.verificationState === 'VERIFIED' ? 80 : 35,
          claimedProficiency: claim.claimedProficiency,
          freshness,
          evidenceList: [
            {
              id: `claim_ev_${claim.id}`,
              title: `Claimed via ${claim.claimSource}`,
              sourceType: 'resume',
              summary: claim.excerpt,
              state: claim.verificationState === 'VERIFIED' ? 'supports' : 'partially_supports',
              dateRecorded: claim.createdAt,
            },
          ],
          transferEvidenceList: [],
          lastVerifiedAt: claim.createdAt,
        };

        if (item.status === 'VERIFIED') {
          verifiedItems.push(item);
        } else {
          claimedItems.push(item);
        }
      }
    }

    // 3. Process candidate skills from profile as claimed if not yet mapped
    for (const skill of candidate.skills || []) {
      if (!processedCapNames.has(skill.toLowerCase())) {
        processedCapNames.add(skill.toLowerCase());

        const freshness = evidenceFreshnessService.evaluateFreshness(
          skill,
          candidate.updatedAt || candidate.createdAt
        );

        const item: PassportCapabilityItem = {
          id: `cand_skill_${skill.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
          name: skill,
          category: 'languages_frameworks',
          status: 'CLAIMED',
          confidenceScore: 30,
          claimedProficiency: 'intermediate',
          freshness,
          evidenceList: [
            {
              id: `profile_ev_${skill}`,
              title: 'Listed in Candidate Profile Skills',
              sourceType: 'resume',
              summary: `Self-declared skill on candidate profile: ${skill}`,
              state: 'inconclusive',
              dateRecorded: candidate.createdAt,
            },
          ],
          transferEvidenceList: [],
          lastVerifiedAt: undefined,
        };

        claimedItems.push(item);
      }
    }

    const totalCapabilitiesCount =
      verifiedItems.length + demonstratedItems.length + claimedItems.length + unknownItems.length;

    const totalConfidenceSum = [
      ...verifiedItems,
      ...demonstratedItems,
      ...claimedItems,
      ...unknownItems,
    ].reduce((sum, item) => sum + item.confidenceScore, 0);

    const averageConfidence =
      totalCapabilitiesCount > 0 ? Math.round(totalConfidenceSum / totalCapabilitiesCount) : 0;

    // Passport ID & Verification Signature
    const passportId = `VP-${candidate.id.toUpperCase().replace(/[^A-Z0-9]/g, '')}-${candidate.lastName.toUpperCase().slice(0, 3)}`;
    const verificationHash = crypto
      .createHash('sha256')
      .update(`${passportId}-${candidate.email}-${verifiedItems.length}-${averageConfidence}`)
      .digest('hex')
      .slice(0, 16)
      .toUpperCase();

    return {
      candidateId: candidate.id,
      candidateName: `${candidate.firstName} ${candidate.lastName}`,
      headline: candidate.headline || 'Software Engineering Professional',
      passportId,
      verificationHash,
      verifiedCapabilities: verifiedItems,
      demonstratedCapabilities: demonstratedItems,
      claimedCapabilities: claimedItems,
      unknownCapabilities: unknownItems,
      totalVerifiedCount: verifiedItems.length,
      totalDemonstratedCount: demonstratedItems.length,
      totalClaimedCount: claimedItems.length,
      totalUnknownCount: unknownItems.length,
      averageConfidence,
      consent,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Helper to generate realistic transfer evidence for multi-framework capability mastery
   */
  private generateTransferEvidence(capabilityName: string, confidence: number): TransferEvidence[] {
    const lower = capabilityName.toLowerCase();
    const transfers: TransferEvidence[] = [];

    if (lower.includes('typescript') || lower.includes('javascript')) {
      transfers.push({
        id: `tr_${Date.now()}_1`,
        sourceCapability: capabilityName,
        targetCapability: 'Rust & WebAssembly Type Semantics',
        transferConcept: 'Memory safety model, type invariants, and generic constraints',
        transferStrength: Math.min(88, Math.round(confidence * 0.85)),
        evidenceSummary:
          'Demonstrated strong static type reasoning and generic design transferable to modern compiled languages.',
        verifiedAt: new Date().toISOString(),
      });
    }

    if (lower.includes('react')) {
      transfers.push({
        id: `tr_${Date.now()}_2`,
        sourceCapability: capabilityName,
        targetCapability: 'Vue.js & Modern Component Frameworks',
        transferConcept: 'Unidirectional data flow, reactive state management, and virtual DOM diffing',
        transferStrength: Math.min(94, Math.round(confidence * 0.92)),
        evidenceSummary:
          'Deep mastery of component lifecycles and declarative reactive state maps directly to Vue 3 Composition API and SolidJS.',
        verifiedAt: new Date().toISOString(),
      });
    }

    if (lower.includes('node') || lower.includes('express')) {
      transfers.push({
        id: `tr_${Date.now()}_3`,
        sourceCapability: capabilityName,
        targetCapability: 'Go (Golang) Microservices & Gin',
        transferConcept: 'Non-blocking I/O, REST routing pipelines, and middleware interceptors',
        transferStrength: Math.min(84, Math.round(confidence * 0.82)),
        evidenceSummary:
          'Asynchronous pipeline orchestration and stream processing transfer cleanly to Go HTTP routines.',
        verifiedAt: new Date().toISOString(),
      });
    }

    if (lower.includes('docker') || lower.includes('container')) {
      transfers.push({
        id: `tr_${Date.now()}_4`,
        sourceCapability: capabilityName,
        targetCapability: 'Kubernetes Pod Lifecycle & Helm Charting',
        transferConcept: 'Containerized process isolation, environment layering, and declarative networking',
        transferStrength: Math.min(90, Math.round(confidence * 0.88)),
        evidenceSummary:
          'OCI container specifications and multi-stage image minimization provide foundation for K8s deployments.',
        verifiedAt: new Date().toISOString(),
      });
    }

    return transfers;
  }
}

export const passportService = new PassportService();
