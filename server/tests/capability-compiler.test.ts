import request from 'supertest';
import { app } from '../src/server';
import { seedDatabase } from '../src/seed';
import {
  CapabilitySchema,
  CompiledCapabilityModelSchema,
} from '../src/services/ai/capability-compiler.service';

describe('VERITY Phase 3 - AI Job-to-Capability Compiler Tests', () => {
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

  describe('1. Strict Schema Validation for Malformed / Incomplete LLM Output', () => {
    it('should reject malformed capabilities missing critical fields', () => {
      const malformed = {
        name: 'Java',
        // missing category, importance, expectedProficiency, evaluationMethods
      };

      const result = CapabilitySchema.safeParse(malformed);
      expect(result.success).toBe(false);
    });

    it('should reject invalid enum values from raw LLM output', () => {
      const invalidEnum = {
        name: 'Distributed Caching',
        category: 'systems_architecture',
        description: 'Deep understanding of Redis and Memcached caching tiers.',
        importance: 'super_ultra_high', // Invalid enum
        expectedProficiency: 'wizard', // Invalid enum
        evaluationMethods: ['telepathy_test'], // Invalid enum
      };

      const result = CapabilitySchema.safeParse(invalidEnum);
      expect(result.success).toBe(false);
    });

    it('should reject capability models with empty capabilities array', () => {
      const emptyModel = {
        capabilities: [],
        relationships: [],
      };

      const result = CompiledCapabilityModelSchema.safeParse(emptyModel);
      expect(result.success).toBe(false);
    });

    it('should successfully validate complete multi-dimensional capability model', () => {
      const validModel = {
        capabilities: [
          {
            name: 'Java (JVM Core)',
            category: 'languages_frameworks',
            description: 'Advanced mastery of modern Java 17+, concurrency, and memory optimization.',
            importance: 'critical',
            expectedProficiency: 'advanced',
            evaluationMethods: ['coding_challenge', 'technical_qa', 'debugging_scenario'],
            dependencies: [],
            transferableConcepts: ['C# / .NET', 'Kotlin'],
            evidenceRequirements: ['Production multi-threaded service implementations'],
            freshnessRequirements: 'Active within past 12 months',
          },
        ],
        relationships: [],
      };

      const result = CompiledCapabilityModelSchema.safeParse(validModel);
      expect(result.success).toBe(true);
    });
  });

  describe('2. End-to-End AI Capability Compilation API', () => {
    it('should compile a job description into structured capabilities and relationship graph', async () => {
      const res = await request(app)
        .post('/api/v1/jobs/job-1/capabilities/compile')
        .set('Authorization', `Bearer ${recruiterToken}`);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.capabilities.length).toBeGreaterThanOrEqual(3);
      expect(res.body.data.relationships.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.version).toBe(1);
      expect(res.body.data.status).toBe('pending_review');

      // Verify structure of first capability
      const cap = res.body.data.capabilities[0];
      expect(cap).toHaveProperty('name');
      expect(cap).toHaveProperty('category');
      expect(cap).toHaveProperty('importance');
      expect(cap).toHaveProperty('expectedProficiency');
      expect(cap).toHaveProperty('evaluationMethods');
      expect(cap).toHaveProperty('dependencies');
      expect(cap).toHaveProperty('transferableConcepts');

      // Verify relationship structure
      const rel = res.body.data.relationships[0];
      expect(rel).toHaveProperty('sourceName');
      expect(rel).toHaveProperty('targetName');
      expect(rel).toHaveProperty('relationshipType');
      expect(rel).toHaveProperty('explanation');
    });

    it('should retrieve compiled capability model for a job requisition', async () => {
      const res = await request(app)
        .get('/api/v1/jobs/job-1/capabilities')
        .set('Authorization', `Bearer ${recruiterToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.jobId).toBe('job-1');
    });
  });

  describe('3. Recruiter Modification Workflow (Edit, Add, Remove, Approve)', () => {
    it('should allow recruiter to customize capabilities and increment version', async () => {
      const currentRes = await request(app)
        .get('/api/v1/jobs/job-1/capabilities')
        .set('Authorization', `Bearer ${recruiterToken}`);

      const currentCaps = currentRes.body.data.capabilities;

      // Add a custom capability by recruiter
      const customCap = {
        id: 'custom-cap-1',
        name: 'GraphQL Federation Architecture',
        category: 'systems_architecture',
        description: 'Experience designing supergraph schemas with Apollo Router or Hive.',
        importance: 'high',
        expectedProficiency: 'advanced',
        evaluationMethods: ['system_design', 'technical_qa'],
        dependencies: ['TypeScript & Type Systems'],
        transferableConcepts: ['gRPC', 'REST API Design'],
        evidenceRequirements: ['Designed production federated subgraphs'],
        freshnessRequirements: 'Active within past 18 months',
      };

      const updatedCaps = [...currentCaps, customCap];

      const res = await request(app)
        .put('/api/v1/jobs/job-1/capabilities')
        .set('Authorization', `Bearer ${recruiterToken}`)
        .send({
          capabilities: updatedCaps,
          relationships: currentRes.body.data.relationships,
          modificationSummary: 'Recruiter added GraphQL Federation capability requirement',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.version).toBe(2);
      expect(res.body.data.status).toBe('customized');
      expect(res.body.data.capabilities.some((c: any) => c.name === 'GraphQL Federation Architecture')).toBe(true);
      expect(res.body.data.modifications.length).toBeGreaterThan(1);
    });

    it('should allow recruiter to approve capability model for screening', async () => {
      const res = await request(app)
        .post('/api/v1/jobs/job-1/capabilities/approve')
        .set('Authorization', `Bearer ${recruiterToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('approved');
      expect(res.body.data.approvedBy).toBeDefined();
    });
  });

  describe('4. Multi-Tenant Organization Isolation for Capability Models', () => {
    it('should forbid Recruiter in Org 2 from accessing or modifying Org 1 capability models', async () => {
      const res = await request(app)
        .get('/api/v1/jobs/job-1/capabilities')
        .set('Authorization', `Bearer ${competitorRecruiterToken}`);

      expect(res.status).toBe(404);
    });
  });
});
