import request from 'supertest';
import { app } from '../src/server';
import { seedDatabase } from '../src/seed';
import { proofOfSkillEngine } from '../src/services/proof-of-skill/proof-of-skill.engine';

describe('VERITY Phase 4 - Candidate Capability Model and Proof-of-Skill Tests', () => {
  let recruiterToken: string;
  let competitorRecruiterToken: string;
  let candidateToken: string;

  beforeAll(async () => {
    await seedDatabase();

    const rec1 = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'recruiter@innovatecorp.com', password: 'Recruiter@2026' });
    recruiterToken = rec1.body.data.tokens.accessToken;

    const rec2 = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'recruiter@apexcloud.io', password: 'ApexRecruiter@2026' });
    competitorRecruiterToken = rec2.body.data.tokens.accessToken;

    const cand = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'candidate@elena.dev', password: 'Candidate@2026' });
    candidateToken = cand.body.data.tokens.accessToken;
  });

  describe('1. Proof-of-Skill Engine Deterministic Verification Logic', () => {
    it('should classify a claim with zero evidence as INSUFFICIENT_EVIDENCE', () => {
      const result = proofOfSkillEngine.evaluateCapability(
        'cand-1',
        'Kubernetes',
        'cloud_devops',
        [],
        [
          {
            id: 'claim-1',
            candidateId: 'cand-1',
            capabilityName: 'Kubernetes',
            claimedProficiency: 'advanced',
            claimSource: 'Resume',
            excerpt: 'Listed Kubernetes in skills section',
            verificationState: 'UNVERIFIED',
            createdAt: new Date().toISOString(),
          },
        ]
      );

      expect(result.verificationState).toBe('INSUFFICIENT_EVIDENCE');
      expect(result.confidenceScore).toBeLessThanOrEqual(30);
      expect(result.recommendedAction).toContain('Assign technical assessment or coding task');
    });

    it('should classify contradicted evidence as CONTRADICTED regardless of resume claim', () => {
      const result = proofOfSkillEngine.evaluateCapability(
        'cand-1',
        'Go Concurrency',
        'languages_frameworks',
        [
          {
            id: 'ev-1',
            candidateId: 'cand-1',
            capabilityName: 'Go Concurrency',
            sourceType: 'resume',
            title: 'Resume claim',
            summary: 'Claimed 5 years Go experience',
            state: 'supports',
            reliabilityWeight: 0.2,
            stageRecorded: 'applied',
            createdAt: new Date().toISOString(),
          },
          {
            id: 'ev-2',
            candidateId: 'cand-1',
            capabilityName: 'Go Concurrency',
            sourceType: 'interview',
            title: 'Technical Panel Interview',
            summary: 'Candidate failed basic goroutine channel synchronization question.',
            state: 'contradicts', // Contradiction
            reliabilityWeight: 0.85,
            stageRecorded: 'interview',
            createdAt: new Date().toISOString(),
          },
        ],
        []
      );

      expect(result.verificationState).toBe('CONTRADICTED');
      expect(result.confidenceScore).toBeLessThanOrEqual(20);
      expect(result.recommendedAction).toContain('Contradiction detected');
    });

    it('should classify multi-stage verified evidence (assessment + interview) as VERIFIED with high confidence', () => {
      const result = proofOfSkillEngine.evaluateCapability(
        'cand-1',
        'TypeScript',
        'languages_frameworks',
        [
          {
            id: 'ev-1',
            candidateId: 'cand-1',
            capabilityName: 'TypeScript',
            sourceType: 'resume',
            title: 'Resume text',
            summary: 'Production TS engineer',
            state: 'supports',
            reliabilityWeight: 0.2,
            stageRecorded: 'applied',
            createdAt: new Date().toISOString(),
          },
          {
            id: 'ev-2',
            candidateId: 'cand-1',
            capabilityName: 'TypeScript',
            sourceType: 'coding_task',
            title: 'Coding Task: Strict Generics',
            summary: 'Scored 98% on AST type guards',
            sourceScore: 98,
            state: 'supports',
            reliabilityWeight: 1.0,
            stageRecorded: 'assessment',
            createdAt: new Date().toISOString(),
          },
          {
            id: 'ev-3',
            candidateId: 'cand-1',
            capabilityName: 'TypeScript',
            sourceType: 'interview',
            title: 'Technical Deep Dive',
            summary: 'Exemplary explanation of conditional type distribution.',
            sourceScore: 95,
            state: 'supports',
            reliabilityWeight: 0.85,
            stageRecorded: 'interview',
            createdAt: new Date().toISOString(),
          },
        ],
        []
      );

      expect(result.verificationState).toBe('VERIFIED');
      expect(result.confidenceScore).toBeGreaterThanOrEqual(85);
      expect(result.evidenceDiversityScore).toBeGreaterThanOrEqual(90);
    });
  });

  describe('2. Claims Extraction & Evidence Ingestion API', () => {
    it('should extract claims and initial resume evidence for candidate', async () => {
      const res = await request(app)
        .post('/api/v1/candidates/cand-1/claims/extract')
        .set('Authorization', `Bearer ${recruiterToken}`);

      expect(res.status).toBe(201);
      expect(res.body.data.claimsCount).toBeGreaterThanOrEqual(1);
    });

    it('should add new cross-stage evidence and prevent exact duplicates', async () => {
      const evidencePayload = {
        capabilityName: 'TypeScript',
        sourceType: 'coding_task',
        title: 'Verity Core Coding Challenge',
        summary: 'Candidate solved algorithmic and generic type constraint challenge in 22 minutes.',
        sourceScore: 96,
        state: 'supports',
        stageRecorded: 'assessment',
      };

      // 1. Add first instance
      const res1 = await request(app)
        .post('/api/v1/candidates/cand-1/evidence')
        .set('Authorization', `Bearer ${recruiterToken}`)
        .send(evidencePayload);

      expect(res1.status).toBe(201);

      // 2. Add duplicate instance - must be deduplicated
      const res2 = await request(app)
        .post('/api/v1/candidates/cand-1/evidence')
        .set('Authorization', `Bearer ${recruiterToken}`)
        .send(evidencePayload);

      expect(res2.status).toBe(201);
      expect(res2.body.data.id).toBe(res1.body.data.id);
    });
  });

  describe('3. Recruiter Manual Override & Audit Logging', () => {
    it('should allow recruiter to manually override verification state with mandatory reason', async () => {
      const res = await request(app)
        .post('/api/v1/candidates/cand-1/capabilities/override')
        .set('Authorization', `Bearer ${recruiterToken}`)
        .send({
          capabilityName: 'TypeScript',
          verificationState: 'VERIFIED',
          overrideReason: 'Recruiter verified public open source contributions and production PR history.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.isManualOverride).toBe(true);
      expect(res.body.data.verificationState).toBe('VERIFIED');
      expect(res.body.data.overrideReason).toContain('open source contributions');

      // Check evidence timeline for audit record
      const timelineRes = await request(app)
        .get('/api/v1/candidates/cand-1/evidence/timeline')
        .set('Authorization', `Bearer ${recruiterToken}`);

      expect(timelineRes.status).toBe(200);
      expect(timelineRes.body.data.some((e: any) => e.eventType === 'manual_override')).toBe(true);
    });

    it('should reject manual override missing justification reason', async () => {
      const res = await request(app)
        .post('/api/v1/candidates/cand-1/capabilities/override')
        .set('Authorization', `Bearer ${recruiterToken}`)
        .send({
          capabilityName: 'TypeScript',
          verificationState: 'VERIFIED',
          // missing overrideReason
        });

      expect(res.status).toBe(400);
    });
  });

  describe('4. Candidate Privacy Boundaries & Tenant Isolation', () => {
    it('should strip private recruiter notes when candidate accesses their capability profile', async () => {
      // 1. Add private recruiter note
      await request(app)
        .post('/api/v1/candidates/cand-1/evidence')
        .set('Authorization', `Bearer ${recruiterToken}`)
        .send({
          capabilityName: 'React',
          sourceType: 'recruiter_observation',
          title: 'Private Recruiter Internal Note',
          summary: 'Candidate was slightly hesitant on Redux migration question.',
          state: 'partially_supports',
          isPrivateRecruiterNote: true, // PRIVATE FLAG
        });

      // 2. Candidate fetches their own capabilities
      const res = await request(app)
        .get('/api/v1/candidates/cand-1/capabilities')
        .set('Authorization', `Bearer ${candidateToken}`);

      expect(res.status).toBe(200);

      // Verify private recruiter note is NOT leaked to candidate
      const reactCap = res.body.data.capabilities.find((c: any) => c.capabilityName === 'React');
      if (reactCap && reactCap.evidenceItems) {
        expect(reactCap.evidenceItems.some((e: any) => e.title === 'Private Recruiter Internal Note')).toBe(false);
      }
    });

    it('should deny Candidate from accessing another candidate capabilities', async () => {
      const res = await request(app)
        .get('/api/v1/candidates/cand-2/capabilities')
        .set('Authorization', `Bearer ${candidateToken}`);

      expect(res.status).toBe(403);
    });

    it('should isolate candidate evidence across multi-tenant organizations', async () => {
      const res = await request(app)
        .get('/api/v1/candidates/cand-1/capabilities')
        .set('Authorization', `Bearer ${competitorRecruiterToken}`);

      expect(res.status).toBe(404);
    });
  });
});
