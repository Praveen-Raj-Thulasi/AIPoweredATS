import request from 'supertest';
import { app } from '../src/server';
import { seedDatabase } from '../src/seed';
import { fingerprintService } from '../src/services/fingerprint/fingerprint.service';
import { candidateComparator } from '../src/services/fingerprint/candidate-comparator.service';

describe('VERITY Phase 7 - Capability Fingerprint and Growth Potential Tests', () => {
  let recruiterToken: string;

  beforeAll(async () => {
    await seedDatabase();

    const rec1 = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'recruiter@innovatecorp.com', password: 'Recruiter@2026' });
    recruiterToken = rec1.body.data.tokens.accessToken;
  });

  describe('1. FingerprintService Multidimensional Synthesis', () => {
    it('should generate an 8-dimensional Capability Fingerprint with growth metrics', async () => {
      const fingerprint = await fingerprintService.generateFingerprint('cand-1', 'job-1');

      expect(fingerprint.candidateId).toBe('cand-1');
      expect(fingerprint.dimensions.length).toBe(8);

      const requiredDimensions = [
        'technical_capability',
        'problem_solving',
        'debugging',
        'system_design',
        'communication',
        'adaptability',
        'transferability',
        'ai_collaboration',
      ];

      requiredDimensions.forEach((dim) => {
        const found = fingerprint.dimensions.find((d) => d.dimension === dim);
        expect(found).toBeDefined();
        expect(found?.score).toBeGreaterThan(0);
        expect(found?.confidence).toBeGreaterThan(0);
      });

      expect(fingerprint.capabilities.length).toBeGreaterThan(0);
      const firstCap = fingerprint.capabilities[0];
      expect(firstCap.currentCapability).toBeDefined();
      expect(firstCap.evidenceConfidence).toBeDefined();
      expect(firstCap.growthPotential).toBeGreaterThan(0);
      expect(firstCap.growthEvidence.length).toBeGreaterThan(0);
    });
  });

  describe('2. Candidate Comparator Service Structured Comparison', () => {
    it('should produce structured side-by-side comparison without opaque winner score', async () => {
      const report = await candidateComparator.compareCandidates('job-1', ['cand-1', 'cand-2']);

      expect(report.jobId).toBe('job-1');
      expect(report.candidates.length).toBe(2);

      report.candidates.forEach((cand) => {
        expect(cand.candidateId).toBeDefined();
        expect(cand.overallMatchScore).toBeGreaterThan(0);
        expect(cand.averageConfidence).toBeGreaterThan(0);
        expect(cand.overallGrowthPotential).toBeGreaterThan(0);
        expect(cand.decisionReadiness).toBeDefined();
        expect(cand.dimensionScores).toBeDefined();
      });
    });
  });

  describe('3. REST API Endpoints', () => {
    it('should fetch candidate fingerprint via GET /api/v1/candidates/:id/fingerprint', async () => {
      const res = await request(app)
        .get('/api/v1/candidates/cand-1/fingerprint?jobId=job-1')
        .set('Authorization', `Bearer ${recruiterToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.dimensions.length).toBe(8);
      expect(res.body.data.overallGrowthPotential).toBeDefined();
    });

    it('should compare candidates via POST /api/v1/jobs/:id/compare-candidates', async () => {
      const res = await request(app)
        .post('/api/v1/jobs/job-1/compare-candidates')
        .set('Authorization', `Bearer ${recruiterToken}`)
        .send({ candidateIds: ['cand-1', 'cand-2'] });

      expect(res.status).toBe(200);
      expect(res.body.data.candidates.length).toBe(2);
    });
  });
});
