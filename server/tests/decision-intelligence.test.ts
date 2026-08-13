import request from 'supertest';
import { app } from '../src/server';
import { seedDatabase } from '../src/seed';
import { consistencyEngine } from '../src/services/decision/consistency.engine';

describe('VERITY Phase 8 - Consistency Engine & Decision Intelligence Tests', () => {
  let recruiterToken: string;

  beforeAll(async () => {
    await seedDatabase();

    const rec1 = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'recruiter@innovatecorp.com', password: 'Recruiter@2026' });
    recruiterToken = rec1.body.data.tokens.accessToken;
  });

  describe('1. ConsistencyEngine Corroboration & Non-Labelling Rule', () => {
    it('should classify contradicted signals as conflicting_evidence rather than fraud', () => {
      const capability: any = {
        name: 'AWS Cloud Architecture',
        category: 'cloud_devops',
        importance: 'high',
      };

      const claims: any[] = [
        {
          capabilityName: 'AWS Cloud Architecture',
          claimSource: 'Resume',
        },
      ];

      const evidence: any[] = [
        {
          capabilityName: 'AWS Cloud Architecture',
          sourceType: 'resume',
          state: 'supports',
        },
        {
          capabilityName: 'AWS Cloud Architecture',
          sourceType: 'project',
          state: 'supports',
        },
        {
          capabilityName: 'AWS Cloud Architecture',
          sourceType: 'interview',
          state: 'contradicts', // Contradicted during live inquiry
        },
      ];

      const result = consistencyEngine.evaluateConsistency(capability, undefined, claims, evidence);

      expect(result.consistencyStatus).toBe('conflicting_evidence');
      expect(result.explanation.toLowerCase()).not.toContain('fraud');
      expect(result.explanation.toLowerCase()).not.toContain('dishonest');
      expect(result.recommendedAction).toBeDefined();
    });

    it('should classify multi-stage corroborated evidence as consistent_evidence', () => {
      const capability: any = {
        name: 'TypeScript',
        category: 'languages_frameworks',
        importance: 'critical',
      };

      const evidence: any[] = [
        { capabilityName: 'TypeScript', sourceType: 'coding_task', state: 'supports' },
        { capabilityName: 'TypeScript', sourceType: 'interview', state: 'supports' },
      ];

      const result = consistencyEngine.evaluateConsistency(capability, undefined, [], evidence);
      expect(result.consistencyStatus).toBe('consistent_evidence');
    });
  });

  describe('2. Decision Readiness Evaluation API', () => {
    it('should compute decision readiness evaluation with next-best actions', async () => {
      const res = await request(app)
        .get('/api/v1/candidates/cand-1/decision-readiness?jobId=job-1')
        .set('Authorization', `Bearer ${recruiterToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.readinessState).toBeDefined();
      expect(res.body.data.consistencyItems.length).toBeGreaterThan(0);
      expect(res.body.data.nextBestActions.length).toBeGreaterThan(0);
    });
  });

  describe('3. Audited Human Decision Execution', () => {
    it('should record recruiter decision with mandatory justification reason', async () => {
      const res = await request(app)
        .post('/api/v1/candidates/cand-1/decisions')
        .set('Authorization', `Bearer ${recruiterToken}`)
        .send({
          jobId: 'job-1',
          action: 'advance',
          reason: 'Candidate exhibited exceptional TypeScript and distributed systems depth across coding and interview rounds.',
          aiAdvisoryState: 'READY',
          evidenceStateSnapshot: { overallVerificationRate: 85, verifiedCount: 4, readinessScore: 90 },
        });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.action).toBe('advance');
      expect(res.body.data.reason).toContain('exceptional TypeScript');

      // Verify audit history retrieval
      const historyRes = await request(app)
        .get('/api/v1/candidates/cand-1/decisions/history')
        .set('Authorization', `Bearer ${recruiterToken}`);

      expect(historyRes.status).toBe(200);
      expect(historyRes.body.data.length).toBeGreaterThan(0);
      expect(historyRes.body.data[0].action).toBe('advance');
    });

    it('should reject human decision missing mandatory justification reason', async () => {
      const res = await request(app)
        .post('/api/v1/candidates/cand-1/decisions')
        .set('Authorization', `Bearer ${recruiterToken}`)
        .send({
          jobId: 'job-1',
          action: 'advance',
          reason: '', // Empty reason
        });

      expect(res.status).toBe(400);
    });
  });
});
