import { v4 as uuidv4 } from 'uuid';
import {
  CapabilityConsistencyItem,
  NextBestAction,
  Capability,
} from '@ats/shared';

export class NextActionEngine {
  /**
   * Evaluates capability consistency reports and prioritizes actionable next verification steps
   */
  recommendNextActions(
    consistencyItems: CapabilityConsistencyItem[],
    jobCapabilities: Capability[]
  ): NextBestAction[] {
    const actions: NextBestAction[] = [];

    // 1. High Priority: Resolve Conflicting Evidence
    const conflicts = consistencyItems.filter((i) => i.consistencyStatus === 'conflicting_evidence');
    conflicts.forEach((c) => {
      actions.push({
        id: uuidv4(),
        actionType: 'technical_follow_up',
        title: `Resolve Signal Conflict: ${c.capabilityName}`,
        targetCapability: c.capabilityName,
        rationale: `Candidate exhibited conflicting signals during assessment/interview. Focused panel review recommended.`,
        estimatedInformationGain: 90,
        recommendedStage: 'interview',
      });
    });

    // 2. Medium Priority: Verify Critical Unsupported Claims
    const unsupported = consistencyItems.filter((i) => i.consistencyStatus === 'unsupported_claim');
    unsupported.forEach((u) => {
      const cap = jobCapabilities.find((jc) => jc.name.toLowerCase() === u.capabilityName.toLowerCase());
      const isCritical = cap?.importance === 'critical' || cap?.importance === 'high';

      if (isCritical) {
        actions.push({
          id: uuidv4(),
          actionType: 'debugging_challenge',
          title: `Assign Hands-On Coding Task: ${u.capabilityName}`,
          targetCapability: u.capabilityName,
          rationale: `Substantiate core requisition competency with adaptive Level 2/3 challenge.`,
          estimatedInformationGain: 80,
          recommendedStage: 'assessment',
        });
      }
    });

    // 3. Test Transfer on Already-Verified Critical Skills
    const verified = consistencyItems.filter((i) => i.consistencyStatus === 'consistent_evidence');
    if (verified.length > 0 && actions.length < 3) {
      actions.push({
        id: uuidv4(),
        actionType: 'transfer_test',
        title: `Execute Transfer Test on ${verified[0].capabilityName}`,
        targetCapability: verified[0].capabilityName,
        rationale: `Candidate mastered baseline execution. Verify conceptual transfer to distributed scale.`,
        estimatedInformationGain: 70,
        recommendedStage: 'assessment',
      });
    }

    return actions.slice(0, 3);
  }
}

export const nextActionEngine = new NextActionEngine();
