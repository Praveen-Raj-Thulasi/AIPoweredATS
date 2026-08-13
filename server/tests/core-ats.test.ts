import request from 'supertest';
import { app } from '../src/server';
import { seedDatabase } from '../src/seed';

describe('VERITY Phase 2 - Core ATS Foundation Tests', () => {
  let recruiterToken: string;
  let candidateToken: string;
  let competitorRecruiterToken: string;

  beforeAll(async () => {
    await seedDatabase();

    // Recruiter (Org 1)
    const rec1 = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'recruiter@innovatecorp.com', password: 'Recruiter@2026' });
    recruiterToken = rec1.body.data.tokens.accessToken;

    // Candidate
    const cand = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'candidate@elena.dev', password: 'Candidate@2026' });
    candidateToken = cand.body.data.tokens.accessToken;

    // Competitor Recruiter (Org 2)
    const rec2 = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'recruiter@apexcloud.io', password: 'ApexRecruiter@2026' });
    competitorRecruiterToken = rec2.body.data.tokens.accessToken;
  });

  describe('1. Job Management (CRUD, Duplicate, Archive, Filter)', () => {
    let createdJobId: string;

    it('should create a new job with full fields', async () => {
      const res = await request(app)
        .post('/api/v1/jobs')
        .set('Authorization', `Bearer ${recruiterToken}`)
        .send({
          title: 'Principal Backend Architect',
          department: 'Core Infrastructure',
          location: 'San Francisco, CA',
          type: 'full-time',
          experienceLevel: 'lead',
          minYearsExperience: 7,
          salaryMin: 190000,
          salaryMax: 250000,
          description: 'Lead the backend distributed systems team.',
          responsibilities: ['Design distributed caching layers'],
          requirements: ['7+ years experience with Go and AWS'],
          requiredSkills: ['Go', 'AWS', 'Redis', 'PostgreSQL'],
          preferredSkills: ['Kubernetes', 'Terraform'],
          status: 'published',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Principal Backend Architect');
      expect(res.body.data.organizationId).toBe('org-1');
      createdJobId = res.body.data.id;
    });

    it('should duplicate an existing job into a draft', async () => {
      const res = await request(app)
        .post(`/api/v1/jobs/${createdJobId}/duplicate`)
        .set('Authorization', `Bearer ${recruiterToken}`);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toContain('(Copy)');
      expect(res.body.data.status).toBe('draft');
    });

    it('should archive a job requisition', async () => {
      const res = await request(app)
        .post(`/api/v1/jobs/${createdJobId}/archive`)
        .set('Authorization', `Bearer ${recruiterToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('archived');
    });

    it('should filter jobs by status and search keyword', async () => {
      const res = await request(app)
        .get('/api/v1/jobs?status=published&search=Full-Stack')
        .set('Authorization', `Bearer ${recruiterToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('2. Candidate Tags & Recruiter Comments', () => {
    it('should add tags to candidate profile', async () => {
      const res = await request(app)
        .patch('/api/v1/candidates/cand-1/tags')
        .set('Authorization', `Bearer ${recruiterToken}`)
        .send({ tags: ['TypeScript Expert', 'Top Candidate', 'System Design Strong'] });

      expect(res.status).toBe(200);
      expect(res.body.data.tags).toContain('System Design Strong');
    });

    it('should add recruiter comments to candidate', async () => {
      const res = await request(app)
        .post('/api/v1/candidates/cand-1/comments')
        .set('Authorization', `Bearer ${recruiterToken}`)
        .send({ content: 'Excellent problem solving during initial tech screening.' });

      expect(res.status).toBe(200);
      expect(res.body.data.comments.length).toBeGreaterThan(0);
    });
  });

  describe('3. Configurable 8-Stage Pipeline Transitions', () => {
    it('should move application through pipeline stages: applied -> screening -> assessment -> interview -> evaluation -> offer -> hired', async () => {
      const stages = ['screening', 'assessment', 'interview', 'evaluation', 'offer', 'hired'];

      for (const stage of stages) {
        const res = await request(app)
          .patch('/api/v1/applications/app-1/stage')
          .set('Authorization', `Bearer ${recruiterToken}`)
          .send({ stage, actorName: 'Sarah Jenkins' });

        expect(res.status).toBe(200);
        expect(res.body.data.stage).toBe(stage);
      }
    });
  });

  describe('4. Interview Scheduling & Feedback Workflow', () => {
    let interviewId: string;

    it('should schedule an interview with interviewer assignment and meeting link', async () => {
      const res = await request(app)
        .post('/api/v1/interviews')
        .set('Authorization', `Bearer ${recruiterToken}`)
        .send({
          applicationId: 'app-1',
          scheduledAt: new Date(Date.now() + 86400000).toISOString(),
          durationMinutes: 60,
          interviewType: 'technical',
          interviewerNames: ['Alex Thorne', 'Sarah Jenkins'],
          meetingLink: 'https://meet.google.com/verity-tech-round',
          notes: 'Prepare coding challenge in TypeScript.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('scheduled');
      interviewId = res.body.data.id;
    });

    it('should submit feedback for completed interview', async () => {
      const res = await request(app)
        .post(`/api/v1/interviews/${interviewId}/feedback`)
        .set('Authorization', `Bearer ${recruiterToken}`)
        .send({
          rating: 5,
          recommendation: 'strong_hire',
          summary: 'Exemplary performance on concurrent data structures and live coding.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('completed');
      expect(res.body.data.feedback.rating).toBe(5);
    });
  });

  describe('5. Offer Management Workflow', () => {
    let offerId: string;

    it('should create an offer package draft', async () => {
      const res = await request(app)
        .post('/api/v1/offers')
        .set('Authorization', `Bearer ${recruiterToken}`)
        .send({
          applicationId: 'app-1',
          baseSalary: 185000,
          currency: 'USD',
          equity: '0.20% Stock Options',
          bonus: '10% Annual Performance',
          startDate: '2026-09-01T00:00:00.000Z',
          expirationDate: '2026-08-30T00:00:00.000Z',
          customTerms: 'Relocation assistance included.',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('draft');
      expect(res.body.data.baseSalary).toBe(185000);
      offerId = res.body.data.id;
    });

    it('should dispatch the offer to candidate (sets status to sent)', async () => {
      const res = await request(app)
        .post(`/api/v1/offers/${offerId}/send`)
        .set('Authorization', `Bearer ${recruiterToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('sent');
    });

    it('should allow candidate to accept the offer and auto-move application to hired', async () => {
      const res = await request(app)
        .post(`/api/v1/offers/${offerId}/respond`)
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({ decision: 'accepted' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('accepted');

      // Verify application stage is now 'hired'
      const appRes = await request(app)
        .get('/api/v1/applications/app-1')
        .set('Authorization', `Bearer ${recruiterToken}`);

      expect(appRes.body.data.stage).toBe('hired');
    });
  });

  describe('6. Multi-Tenant Organization Isolation in Core ATS', () => {
    it('should deny Recruiter in Org 2 from accessing Org 1 interviews or offers', async () => {
      // Recruiter 2 tries to view Org 1 offers
      const res = await request(app)
        .get('/api/v1/offers')
        .set('Authorization', `Bearer ${competitorRecruiterToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every((o: any) => o.organizationId === 'org-2')).toBe(true);
    });
  });
});
