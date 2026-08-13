import { passportService } from '../src/services/passport/passport.service';
import { evidenceFreshnessService } from '../src/services/passport/evidence-freshness.service';
import { consentService } from '../src/services/passport/consent.service';
import { atsStore } from '../src/models/store';

describe('Living Capability Passport & Evidence Freshness Suite (Phase 14 QA)', () => {
  describe('Evidence Half-Life & Volatility Calculations', () => {
    it('should evaluate recent evidence as ACTIVE with high freshness score', () => {
      const recentDate = new Date().toISOString(); // Today
      const evaluation = evidenceFreshnessService.evaluateFreshness('Distributed Systems', recentDate);

      expect(evaluation.status).toBe('ACTIVE');
      expect(evaluation.freshnessScore).toBeGreaterThanOrEqual(88);
      expect(evaluation.isReverificationRecommended).toBe(false);
    });

    it('should evaluate older evidence with aging freshness status', () => {
      const fifteenMonthsAgo = new Date(Date.now() - 450 * 24 * 3600 * 1000).toISOString();
      const evaluation = evidenceFreshnessService.evaluateFreshness('React Architecture', fifteenMonthsAgo);

      expect(['FRESH', 'AGING', 'STALE']).toContain(evaluation.status);
      expect(evaluation.freshnessScore).toBeLessThan(90);
    });

    it('should flag stale evidence for reverification', () => {
      const threeYearsAgo = new Date(Date.now() - 1100 * 24 * 3600 * 1000).toISOString();
      const evaluation = evidenceFreshnessService.evaluateFreshness('Generative AI Prompt Engineering', threeYearsAgo);

      expect(evaluation.status).toBe('STALE');
      expect(evaluation.isReverificationRecommended).toBe(true);
      expect(evaluation.recommendationReason).toBeDefined();
    });
  });

  describe('Living Capability Passport Aggregation & Consent Settings', () => {
    it('should aggregate candidate passport from historical evidence with audit hash', async () => {
      const candidate = await atsStore.createCandidate({
        firstName: 'Elena',
        lastName: 'Rostova',
        email: 'elena.rostova@example.com',
        headline: 'Staff Infrastructure Engineer',
        skills: ['Kubernetes', 'Go', 'Cassandra'],
        experience: [],
        education: [],
        status: 'active',
        tags: [],
        comments: [],
      });

      // Add verified evidence
      await atsStore.addEvidenceEvent({
        id: `ev-${Date.now()}`,
        candidateId: candidate.id,
        capabilityName: 'Kubernetes Cluster Architecture',
        eventType: 'coding_challenge_completed',
        title: 'Multi-region K8s Deployment Assessment',
        sourceType: 'coding_task',
        description: 'Built highly-available multi-region K8s deployment pipeline.',
        actorName: 'VERITY Assessment Engine',
        actorRole: 'system',
        score: 92,
        state: 'supports',
        timestamp: new Date().toISOString(),
      });

      const passport = await passportService.getCandidatePassport(candidate.id);

      expect(passport).toBeDefined();
      expect(passport.candidateId).toBe(candidate.id);
      expect(passport.passportId).toBeDefined();
      expect(passport.verificationHash).toBeDefined();
      expect(passport.consent.allowCrossJobReuse).toBe(true);
    });

    it('should respect candidate consent settings updates', async () => {
      const candidate = await atsStore.createCandidate({
        firstName: 'David',
        lastName: 'Kim',
        email: 'david.kim@example.com',
        headline: 'ML Platform Engineer',
        skills: ['PyTorch', 'Rust'],
        experience: [],
        education: [],
        status: 'active',
        tags: [],
        comments: [],
      });

      const updated = await consentService.updateConsentSettings(candidate.id, {
        allowCrossJobReuse: false,
        allowCrossOrgSharing: false,
      });

      expect(updated.allowCrossJobReuse).toBe(false);
      expect(updated.allowCrossOrgSharing).toBe(false);
    });
  });
});
