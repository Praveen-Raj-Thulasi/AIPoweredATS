import { atsStore } from '../src/models/store';

describe('Analytics & Recruitment Intelligence Suite (Phase 14 QA)', () => {
  it('should compute complete server-side recruitment intelligence metrics with metadata', async () => {
    const org = await atsStore.createOrganization({
      name: 'Analytics Test Org',
      slug: 'analytics-test-org',
      plan: 'enterprise',
      status: 'active',
      createdBy: 'user-admin-1',
    });

    const metrics = await atsStore.getRecruitmentIntelligence(org.id, { timeRange: '30d' });

    expect(metrics).toBeDefined();
    expect(metrics.atsMetrics).toBeDefined();
    expect(metrics.proofOfAbilityMetrics).toBeDefined();
    expect(metrics.recruiterMetrics).toBeDefined();
    expect(metrics.jobAnalytics).toBeDefined();
    expect(metrics.metadata).toBeDefined();

    // ATS Funnel Checks
    expect(metrics.atsMetrics.funnel.length).toBe(7);
    expect(metrics.atsMetrics.funnel[0].stage).toBe('applied');
    expect(metrics.atsMetrics.overallFunnelConversionRate).toBeGreaterThanOrEqual(0);

    // Proof of Ability Checks
    expect(metrics.proofOfAbilityMetrics.overallVerificationRate).toBeGreaterThanOrEqual(0);
    expect(metrics.proofOfAbilityMetrics.evidenceSufficiencyAverage).toBeGreaterThanOrEqual(0);
    expect(metrics.proofOfAbilityMetrics.adaptiveDepthDistribution.length).toBe(6);
    expect(metrics.proofOfAbilityMetrics.adaptiveDepthDistribution[0].levelName).toBe('Knowledge');
    expect(metrics.proofOfAbilityMetrics.adaptiveDepthDistribution[5].levelName).toBe('Explanation');

    // Job Intelligence Checks
    expect(metrics.jobAnalytics.hardestCapabilitiesToVerify.length).toBeGreaterThan(0);
    expect(metrics.jobAnalytics.hardestCapabilitiesToVerify[0].primaryBottleneck).toBeDefined();
    expect(metrics.jobAnalytics.hardestCapabilitiesToVerify[0].recommendedRemedy).toBeDefined();

    // Metadata & Data Lineage Integrity Checks
    expect(metrics.metadata.capability_verification_rate).toBeDefined();
    expect(metrics.metadata.capability_verification_rate.definition).toBeDefined();
    expect(metrics.metadata.capability_verification_rate.calculationFormula).toBeDefined();
    expect(metrics.metadata.capability_verification_rate.source).toContain('proofOfSkillEngine');
  });

  it('should support time range filtering and scoping', async () => {
    const metrics7d = await atsStore.getRecruitmentIntelligence('org-1', { timeRange: '7d' });
    const metrics1y = await atsStore.getRecruitmentIntelligence('org-1', { timeRange: '1y' });

    expect(metrics7d.metadata.capability_verification_rate.timeRange).toContain('7D');
    expect(metrics1y.metadata.capability_verification_rate.timeRange).toContain('1Y');
  });
});
