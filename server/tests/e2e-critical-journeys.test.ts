import request from 'supertest';
import { app } from '../src/server';
import { seedDatabase } from '../src/seed';

describe('End-to-End Critical Journey Workflows (Phase 14 QA)', () => {
  beforeAll(async () => {
    await seedDatabase();
  });

  describe('Journey 1: Recruiter Hiring & Decision Intelligence Workflow', () => {
    let recruiterToken: string;
    let createdJobId: string;
    let candidateId = 'cand-1';

    it('Step 1: Recruiter logs in', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'recruiter@innovatecorp.com', password: 'Recruiter@2026' });

      expect(res.status).toBe(200);
      recruiterToken = res.body.data.tokens.accessToken;
      expect(recruiterToken).toBeDefined();
    });

    it('Step 2: Recruiter creates a new Job Requisition', async () => {
      const res = await request(app)
        .post('/api/v1/jobs')
        .set('Authorization', `Bearer ${recruiterToken}`)
        .send({
          title: 'Senior Distributed Systems Architect',
          department: 'Engineering',
          location: 'San Francisco, CA',
          type: 'full-time',
          experienceLevel: 'senior',
          description: 'Architect and scale high-throughput Kafka streaming pipelines and Kubernetes clusters.',
          requirements: ['Kubernetes', 'Go', 'Kafka', 'System Architecture'],
          status: 'published',
        });

      expect(res.status).toBe(201);
      createdJobId = res.body.data.id;
      expect(createdJobId).toBeDefined();
    });

    it('Step 3: Recruiter compiles AI Capability Model for the Job', async () => {
      const res = await request(app)
        .post(`/api/v1/jobs/${createdJobId}/capabilities/compile`)
        .set('Authorization', `Bearer ${recruiterToken}`);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.capabilities.length).toBeGreaterThan(0);
    });

    it('Step 4: Recruiter approves the Capability Model', async () => {
      const res = await request(app)
        .post(`/api/v1/jobs/${createdJobId}/capabilities/approve`)
        .set('Authorization', `Bearer ${recruiterToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('approved');
    });

    it('Step 5: Recruiter inspects Candidate Decision Readiness', async () => {
      const res = await request(app)
        .get(`/api/v1/candidates/${candidateId}/decision-readiness?jobId=${createdJobId}`)
        .set('Authorization', `Bearer ${recruiterToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.readinessState).toBeDefined();
      expect(res.body.data.consistencyItems.length).toBeGreaterThan(0);
      expect(res.body.data.nextBestActions.length).toBeGreaterThan(0);
    });

    it('Step 6: Recruiter records human-in-the-loop hiring decision with justification', async () => {
      const res = await request(app)
        .post(`/api/v1/candidates/${candidateId}/decisions`)
        .set('Authorization', `Bearer ${recruiterToken}`)
        .send({
          jobId: createdJobId,
          action: 'make_offer',
          reason: 'Candidate demonstrated exceptional distributed consensus and Kubernetes depth across assessment and interview signals.',
          aiAdvisoryState: 'READY',
          evidenceStateSnapshot: { overallVerificationRate: 85, verifiedCount: 4, readinessScore: 90 },
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.action).toBe('make_offer');
    });
  });

  describe('Journey 2: Candidate Verification & Living Passport Workflow', () => {
    let candidateToken: string;
    let candidateId = 'cand-1';
    let activeSessionId: string;

    it('Step 1: Candidate logs into their portal', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'candidate@elena.dev', password: 'Candidate@2026' });

      expect(res.status).toBe(200);
      candidateToken = res.body.data.tokens.accessToken;
      expect(candidateToken).toBeDefined();
    });

    it('Step 2: Candidate inspects their current applications', async () => {
      const res = await request(app)
        .get('/api/v1/applications')
        .set('Authorization', `Bearer ${candidateToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('Step 3: Candidate starts adaptive assessment challenge', async () => {
      const res = await request(app)
        .post('/api/v1/assessments/sessions')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({ jobId: 'job-1' });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.status).toBe('in_progress');
      activeSessionId = res.body.data.id;
    });

    it('Step 4: Candidate completes assessment challenge', async () => {
      const res = await request(app)
        .post(`/api/v1/assessments/sessions/${activeSessionId}/submit`)
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({
          answer: 'opt_1',
          code: `export async function processData(items: string[]) {\n  try { return items.filter(Boolean); } catch (e) { return []; }\n}`,
          timeSpentSeconds: 45,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.attempt).toBeDefined();
    });

    it('Step 5: Candidate views updated Living Capability Passport', async () => {
      const res = await request(app)
        .get(`/api/v1/candidates/${candidateId}/passport`)
        .set('Authorization', `Bearer ${candidateToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.candidateId).toBe(candidateId);
      expect(res.body.data.passportId).toBeDefined();
      expect(res.body.data.verificationHash).toBeDefined();
    });
  });
});
