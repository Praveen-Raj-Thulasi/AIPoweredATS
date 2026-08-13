import request from 'supertest';
import { app } from '../src/server';
import { seedDatabase } from '../src/seed';
import { uncertaintyEngine } from '../src/services/assessment/uncertainty.engine';
import { evaluationService } from '../src/services/assessment/evaluation.service';

describe('VERITY Phase 5 - Adaptive Proof-of-Ability Assessment Engine Tests', () => {
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

  describe('1. UncertaintyEngine Information Gain Prioritization', () => {
    it('should prioritize critical low-confidence competencies over low-importance ones', () => {
      const jobCaps: any[] = [
        { name: 'TypeScript', importance: 'critical', expectedProficiency: 'advanced' },
        { name: 'HTML & CSS', importance: 'low', expectedProficiency: 'intermediate' },
        { name: 'Distributed Systems', importance: 'high', expectedProficiency: 'advanced' },
      ];

      const candidateCaps: any[] = [
        { capabilityName: 'TypeScript', confidenceScore: 20, verificationState: 'INSUFFICIENT_EVIDENCE', evidenceCount: 0 },
        { capabilityName: 'HTML & CSS', confidenceScore: 10, verificationState: 'INSUFFICIENT_EVIDENCE', evidenceCount: 0 },
        { capabilityName: 'Distributed Systems', confidenceScore: 90, verificationState: 'VERIFIED', evidenceCount: 3 },
      ];

      const metrics = uncertaintyEngine.computeUncertainty('cand-1', jobCaps, candidateCaps);

      expect(metrics.competencies.length).toBe(3);
      // Critical (TypeScript) has weight 4 * (100 - 20) = 320. Low (HTML) has 1 * (100 - 10) = 90.
      expect(metrics.competencies[0].capabilityName).toBe('TypeScript');
      expect(metrics.competencies[0].priorityScore).toBeGreaterThan(metrics.competencies[1].priorityScore);

      const target = uncertaintyEngine.selectNextTarget(metrics, []);
      expect(target?.capabilityName).toBe('TypeScript');
      expect(target?.level).toBe(1);
    });

    it('should recommend Level 5 Transfer Challenge for already-verified competencies', () => {
      const jobCaps: any[] = [
        { name: 'Node.js Runtime', importance: 'critical', expectedProficiency: 'advanced' },
      ];

      const candidateCaps: any[] = [
        { capabilityName: 'Node.js Runtime', confidenceScore: 95, verificationState: 'VERIFIED', evidenceCount: 3 },
      ];

      const metrics = uncertaintyEngine.computeUncertainty('cand-1', jobCaps, candidateCaps);
      expect(metrics.competencies[0].recommendedLevel).toBe(5); // Transfer Level
    });
  });

  describe('2. EvaluationService Deterministic Scoring', () => {
    it('should correctly score and pass valid coding attempt', () => {
      const challenge: any = {
        id: 'c1',
        capabilityName: 'TypeScript',
        category: 'languages_frameworks',
        level: 2,
        type: 'coding',
        title: 'Implement Type Guard',
        evaluationRubric: [
          { criteria: 'Correctness', maxPoints: 50, description: 'Passes test cases' },
          { criteria: 'Cleanliness', maxPoints: 50, description: 'Clean typing' },
        ],
      };

      const result = evaluationService.evaluateAttempt(challenge, 'cand-1', {
        answer: '',
        code: `export function isValidUser(user: any): boolean {\n  try {\n    return user && typeof user.name === 'string';\n  } catch (err) {\n    return false;\n  }\n}`,
        timeSpentSeconds: 120,
      });

      expect(result.isPassed).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(70);
    });

    it('should fail incomplete attempt with default placeholder code', () => {
      const challenge: any = {
        id: 'c2',
        capabilityName: 'TypeScript',
        category: 'languages_frameworks',
        level: 2,
        type: 'coding',
        title: 'Implement Type Guard',
        evaluationRubric: [
          { criteria: 'Correctness', maxPoints: 100, description: 'Passes test cases' },
        ],
      };

      const result = evaluationService.evaluateAttempt(challenge, 'cand-1', {
        answer: '',
        code: `// Your code here`,
        timeSpentSeconds: 10,
      });

      expect(result.isPassed).toBe(false);
      expect(result.score).toBeLessThanOrEqual(30);
    });
  });

  describe('3. Adaptive Assessment Session Lifecycle API', () => {
    let activeSessionId: string;

    it('should start adaptive assessment session with sanitized options', async () => {
      const res = await request(app)
        .post('/api/v1/assessments/sessions')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({ jobId: 'job-1' });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.status).toBe('in_progress');
      expect(res.body.data.currentChallenge).toBeDefined();

      activeSessionId = res.body.data.id;

      // Candidate must not receive 'isCorrect' answer key
      if (res.body.data.currentChallenge.options) {
        expect(res.body.data.currentChallenge.options.every((o: any) => o.isCorrect === undefined)).toBe(true);
      }
    });

    it('should submit attempt, evaluate deterministically, and advance adaptively', async () => {
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
      expect(res.body.data.attempt.score).toBeGreaterThanOrEqual(0);
    });

    it('should fetch candidate uncertainty heatmap for recruiter', async () => {
      const res = await request(app)
        .get('/api/v1/candidates/cand-1/assessments/uncertainty?jobId=job-1')
        .set('Authorization', `Bearer ${recruiterToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.competencies.length).toBeGreaterThan(0);
      expect(res.body.data.overallUncertaintyScore).toBeDefined();
    });
  });
});
