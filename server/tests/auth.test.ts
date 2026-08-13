import request from 'supertest';
import { app } from '../src/server';
import { seedDatabase } from '../src/seed';

describe('VERITY Phase 1 - Authentication & Multi-Tenant Authorization Tests', () => {
  beforeAll(async () => {
    await seedDatabase();
  });

  describe('1. Candidate & Recruiter Registration', () => {
    it('should register a new candidate successfully', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'newcandidate@test.com',
          password: 'Password123!',
          firstName: 'John',
          lastName: 'Doe',
          role: 'candidate',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe('newcandidate@test.com');
      expect(res.body.data.user.role).toBe('candidate');
      expect(res.body.data.tokens.accessToken).toBeDefined();
      expect(res.body.data.user.passwordHash).toBeUndefined(); // ensure no password leak
    });

    it('should register a new recruiter and create their organization', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'newrecruiter@quantumleap.com',
          password: 'RecruiterSecure123!',
          firstName: 'Alice',
          lastName: 'Vance',
          role: 'recruiter',
          organizationName: 'QuantumLeap AI',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('recruiter');
      expect(res.body.data.organization).toBeDefined();
      expect(res.body.data.organization.name).toBe('QuantumLeap AI');
      expect(res.body.data.user.organizationId).toBe(res.body.data.organization.id);
    });

    it('should reject registration with weak password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'weakpass@test.com',
          password: 'short',
          firstName: 'Test',
          lastName: 'User',
          role: 'candidate',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject registration if email already exists', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'admin@verity.ai', // already seeded
          password: 'Password123!',
          firstName: 'Dup',
          lastName: 'User',
          role: 'candidate',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });
  });

  describe('2. User Login & Token Verification', () => {
    it('should login seeded Admin with valid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@verity.ai',
          password: 'VerityAdmin@2026',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('admin');
      expect(res.body.data.tokens.accessToken).toBeDefined();
    });

    it('should login seeded Recruiter with valid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'recruiter@innovatecorp.com',
          password: 'Recruiter@2026',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('recruiter');
      expect(res.body.data.organization).toBeDefined();
      expect(res.body.data.organization.id).toBe('org-1');
    });

    it('should reject login with wrong password (401)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'recruiter@innovatecorp.com',
          password: 'WrongPassword123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject login with non-existent email (401)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'doesnotexist@unknown.com',
          password: 'SomePassword123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('3. Protected Routes & Current User (/api/v1/auth/me)', () => {
    it('should reject access to /api/v1/auth/me without token (401)', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should allow access to /api/v1/auth/me with valid Bearer token', async () => {
      // Login first
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'recruiter@innovatecorp.com',
          password: 'Recruiter@2026',
        });

      const token = loginRes.body.data.tokens.accessToken;

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('recruiter@innovatecorp.com');
      expect(res.body.data.organization.id).toBe('org-1');
    });
  });

  describe('4. Role-Based Access Control (RBAC)', () => {
    it('should forbid candidate from accessing Recruiter/Admin routes (403)', async () => {
      // Login candidate
      const candLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'candidate@elena.dev',
          password: 'Candidate@2026',
        });

      const candToken = candLogin.body.data.tokens.accessToken;

      // Candidate tries to access Admin route
      const adminRes = await request(app)
        .get('/api/v1/admin/overview')
        .set('Authorization', `Bearer ${candToken}`);

      expect(adminRes.status).toBe(403);
      expect(adminRes.body.success).toBe(false);

      // Candidate tries to create a job (recruiter only)
      const jobRes = await request(app)
        .post('/api/v1/jobs')
        .set('Authorization', `Bearer ${candToken}`)
        .send({
          title: 'Hacked Job',
          department: 'Eng',
          description: 'Desc',
        });

      expect(jobRes.status).toBe(403);
    });

    it('should allow Admin to access admin overview', async () => {
      const adminLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@verity.ai',
          password: 'VerityAdmin@2026',
        });

      const adminToken = adminLogin.body.data.tokens.accessToken;

      const res = await request(app)
        .get('/api/v1/admin/overview')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalUsers).toBeGreaterThan(0);
    });
  });

  describe('5. Multi-Tenant Organization Data Isolation', () => {
    it('should isolate jobs so Recruiter in Org 1 cannot see or access Jobs in Org 2', async () => {
      // Recruiter 1 (InnovateCorp - org-1)
      const rec1Login = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'recruiter@innovatecorp.com',
          password: 'Recruiter@2026',
        });
      const token1 = rec1Login.body.data.tokens.accessToken;

      // Recruiter 1 fetches jobs
      const jobsRes = await request(app)
        .get('/api/v1/jobs')
        .set('Authorization', `Bearer ${token1}`);

      expect(jobsRes.status).toBe(200);
      const jobs = jobsRes.body.data;
      // All returned jobs must belong strictly to org-1
      expect(jobs.every((j: any) => j.organizationId === 'org-1')).toBe(true);
      expect(jobs.some((j: any) => j.id === 'job-3')).toBe(false); // job-3 belongs to org-2

      // Recruiter 1 explicitly tries to access Job 3 (Org 2) -> 404 (IDOR Protection)
      const directJob3 = await request(app)
        .get('/api/v1/jobs/job-3')
        .set('Authorization', `Bearer ${token1}`);

      expect(directJob3.status).toBe(404);
    });

    it('should allow Recruiter 2 in Org 2 to access Job 3 belonging to Org 2', async () => {
      const rec2Login = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'recruiter@apexcloud.io',
          password: 'ApexRecruiter@2026',
        });
      const token2 = rec2Login.body.data.tokens.accessToken;

      const directJob3 = await request(app)
        .get('/api/v1/jobs/job-3')
        .set('Authorization', `Bearer ${token2}`);

      expect(directJob3.status).toBe(200);
      expect(directJob3.body.data.id).toBe('job-3');
      expect(directJob3.body.data.organizationId).toBe('org-2');
    });
  });
});
