import { CandidateConsentSettings } from '@ats/shared';
import { atsStore } from '../../models/store';

export class ConsentService {
  /**
   * Get or initialize candidate consent settings
   */
  async getConsentSettings(candidateId: string): Promise<CandidateConsentSettings> {
    const existing = await atsStore.getCandidateConsent(candidateId);
    if (existing) return existing;

    const defaultConsent: CandidateConsentSettings = {
      candidateId,
      allowCrossJobReuse: true,
      allowCrossOrgSharing: true,
      excludedOrganizations: [],
      allowedCapabilities: [],
      updatedAt: new Date().toISOString(),
    };

    await atsStore.saveCandidateConsent(defaultConsent);
    return defaultConsent;
  }

  /**
   * Update candidate consent settings
   */
  async updateConsentSettings(
    candidateId: string,
    updates: Partial<Omit<CandidateConsentSettings, 'candidateId' | 'updatedAt'>>
  ): Promise<CandidateConsentSettings> {
    const current = await this.getConsentSettings(candidateId);

    const updated: CandidateConsentSettings = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await atsStore.saveCandidateConsent(updated);
    return updated;
  }

  /**
   * Check if candidate consent allows evidence sharing for a specific capability & target organization
   */
  async isSharingAllowed(
    candidateId: string,
    capabilityName: string,
    targetOrganizationId?: string
  ): Promise<boolean> {
    const consent = await this.getConsentSettings(candidateId);

    if (!consent.allowCrossJobReuse) return false;

    if (targetOrganizationId && consent.excludedOrganizations?.includes(targetOrganizationId)) {
      return false;
    }

    if (consent.allowedCapabilities && consent.allowedCapabilities.length > 0) {
      const isAllowed = consent.allowedCapabilities.some(
        (c) => c.toLowerCase() === capabilityName.toLowerCase()
      );
      if (!isAllowed) return false;
    }

    return true;
  }
}

export const consentService = new ConsentService();
