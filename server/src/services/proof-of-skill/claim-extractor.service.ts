import { v4 as uuidv4 } from 'uuid';
import { Candidate, CandidateClaim, EvidenceItem } from '@ats/shared';

export class ClaimExtractorService {
  /**
   * Extracts structured claims and initial resume evidence items from parsed candidate data
   */
  extractClaimsFromCandidate(candidate: Candidate, organizationId?: string): {
    claims: CandidateClaim[];
    initialEvidence: EvidenceItem[];
  } {
    const claims: CandidateClaim[] = [];
    const initialEvidence: EvidenceItem[] = [];

    const skills = candidate.skills || [];
    const now = new Date().toISOString();

    skills.forEach((skill) => {
      const claimId = uuidv4();
      const evidenceId = uuidv4();

      claims.push({
        id: claimId,
        candidateId: candidate.id,
        organizationId: organizationId || candidate.organizationId,
        capabilityName: skill,
        claimedProficiency: 'advanced',
        claimSource: 'Resume / Candidate Submission',
        excerpt: `Candidate listed ${skill} on submitted resume profile.`,
        verificationState: 'UNVERIFIED',
        createdAt: now,
      });

      // Also create initial resume-level evidence item (weight 0.2)
      initialEvidence.push({
        id: evidenceId,
        candidateId: candidate.id,
        organizationId: organizationId || candidate.organizationId,
        capabilityName: skill,
        sourceType: 'resume',
        title: `Resume Text Claim: ${skill}`,
        summary: `Mentioned in candidate technical profile / work history summary.`,
        rawContent: candidate.summary,
        state: 'partially_supports',
        reliabilityWeight: 0.2,
        stageRecorded: 'applied',
        createdAt: now,
      });
    });

    // Check experience records for project evidence
    if (candidate.experience && candidate.experience.length > 0) {
      candidate.experience.forEach((exp) => {
        const desc = exp.description || '';
        skills.forEach((skill) => {
          if (desc.toLowerCase().includes(skill.toLowerCase())) {
            initialEvidence.push({
              id: uuidv4(),
              candidateId: candidate.id,
              organizationId: organizationId || candidate.organizationId,
              capabilityName: skill,
              sourceType: 'project',
              title: `Production Experience at ${exp.company} (${exp.title})`,
              summary: desc,
              state: 'supports',
              reliabilityWeight: 0.6,
              stageRecorded: 'applied',
              createdAt: now,
            });
          }
        });
      });
    }

    return { claims, initialEvidence };
  }
}

export const claimExtractor = new ClaimExtractorService();
