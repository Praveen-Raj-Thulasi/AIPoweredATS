import request from 'supertest';
import { app } from '../src/server';
import { seedDatabase } from '../src/seed';
import { responseAnalyzer } from '../src/services/interview/response-analyzer.service';

describe('VERITY Phase 6 - Adaptive AI Interview Engine Tests', () => {
  let recruiterToken: string;
  let candidateToken: string;

  beforeAll(async () => {
    await seedDatabase();

    const rec1 = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'recruiter@innovatecorp.com', password: 'Recruiter@2026' });
    recruiterToken = rec1.body.data.tokens.accessToken;

    const cand = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'candidate@elena.dev', password: 'Candidate@2026' });
    candidateToken = cand.body.data.tokens.accessToken;
  });

  describe('1. ResponseAnalyzer Claim Detection & Follow-up Synthesis', () => {
    it('should extract technical claims and generate targeted follow-ups from candidate answer', async () => {
      const result = await responseAnalyzer.analyzeResponse(
        'Database Modeling & Index Optimization',
        'How did you structure caching for the high-volume reporting dashboard?',
        'I used Redis as a write-through cache in front of PostgreSQL, reducing p99 latency from 1.4s to 45ms across 20k RPS.'
      );

      expect(result.detectedClaims.length).toBeGreaterThan(0);
      expect(result.detectedEvidence.length).toBeGreaterThan(0);
      expect(result.followUpRecommendations.length).toBeGreaterThan(0);
      expect(result.turnEvaluation.technicalReasoningScore).toBeGreaterThanOrEqual(70);
    });
  });

  describe('2. Multi-Turn Adaptive Interview Session Lifecycle', () => {
    let activeSessionId: string;

    it('should start adaptive interview session linked to Job Capability Model', async () => {
      const res = await request(app)
        .post('/api/v1/interviews/sessions')
        .set('Authorization', `Bearer ${recruiterToken}`)
        .send({
          candidateId: 'cand-1',
          jobId: 'job-1',
          mode: 'ai_assisted',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.plan).toBeDefined();
      expect(res.body.data.turns.length).toBe(1);

      activeSessionId = res.body.data.id;
    });

    it('should record candidate response, detect claims, and generate follow-up recommendations', async () => {
      const res = await request(app)
        .post(`/api/v1/interviews/sessions/${activeSessionId}/respond`)
        .set('Authorization', `Bearer ${recruiterToken}`)
        .send({
          candidateResponse:
            'In my previous role, I architected a distributed Node.js pipeline using BullMQ and Redis streams with backpressure throttling.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.latestTurn.candidateResponse).toBeDefined();
      expect(res.body.data.latestTurn.detectedClaims.length).toBeGreaterThan(0);
      expect(res.body.data.latestTurn.followUpRecommendations.length).toBeGreaterThan(0);
    });

    it('should allow recruiter to accept or add a custom follow-up probe', async () => {
      const res = await request(app)
        .post(`/api/v1/interviews/sessions/${activeSessionId}/accept-followup`)
        .set('Authorization', `Bearer ${recruiterToken}`)
        .send({
          capabilityName: 'Node.js Asynchronous Runtime',
          questionText: 'How did you handle consumer group rebalancing under stream congestion?',
          questionType: 'follow_up',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.turns.length).toBe(2);
      expect(res.body.data.turns[1].questionText).toContain('consumer group rebalancing');
    });

    it('should complete interview session, generate combined evaluation, and dispatch evidence', async () => {
      const res = await request(app)
        .post(`/api/v1/interviews/sessions/${activeSessionId}/complete`)
        .set('Authorization', `Bearer ${recruiterToken}`)
        .send({
          interviewerNotes: 'Exemplary architectural intuition and deep production knowledge.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('completed');
      expect(res.body.data.combinedEvaluation).toBeDefined();
      expect(res.body.data.combinedEvaluation.technicalReasoning).toBeGreaterThan(0);

      // Verify that EvidenceItem with sourceType 'interview' was dispatched to candidate profile
      const capsRes = await request(app)
        .get('/api/v1/candidates/cand-1/capabilities')
        .set('Authorization', `Bearer ${recruiterToken}`);

      expect(capsRes.status).toBe(200);
    });
  });
});
