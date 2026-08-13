import request from 'supertest';
import { app } from '../src/server';
import { atsStore } from '../src/models/store';
import { sanitizeNoSQL } from '../src/middlewares/security.middleware';
import { s3ProductionService } from '../src/services/storage/s3.production.service';

import { seedDatabase } from '../src/seed';

describe('Security Hardening & Protection Suite (Phase 14 QA)', () => {
  let adminToken: string;
  let recruiterToken: string;
  let candidateToken: string;

  beforeAll(async () => {
    await seedDatabase();

    // 1. Admin login
    const adminRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@verity.ai', password: 'VerityAdmin@2026' });
    adminToken = adminRes.body.data.tokens.accessToken;

    // 2. Recruiter login
    const recRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'recruiter@innovatecorp.com', password: 'Recruiter@2026' });
    recruiterToken = recRes.body.data.tokens.accessToken;

    // 3. Candidate login
    const candRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'candidate@elena.dev', password: 'Candidate@2026' });
    candidateToken = candRes.body.data.tokens.accessToken;
  });

  describe('Session Invalidation & Token Revocation', () => {
    it('should invalidate access token immediately upon logout', async () => {
      // Register a temporary user
      const tempEmail = `logout-test-${Date.now()}@example.com`;
      const regRes = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: tempEmail,
          password: 'Password123!',
          firstName: 'Temp',
          lastName: 'User',
          role: 'candidate',
        });

      const userToken = regRes.body.data.tokens.accessToken;
      const refreshTok = regRes.body.data.tokens.refreshToken;

      // Verify token works before logout
      const beforeLogout = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${userToken}`);
      expect(beforeLogout.status).toBe(200);

      // Perform Logout
      const logoutRes = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ refreshToken: refreshTok });
      expect(logoutRes.status).toBe(200);

      // Verify token is rejected after logout (401)
      const afterLogout = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${userToken}`);
      expect(afterLogout.status).toBe(401);
    });

    it('should rotate refresh token and revoke the previous token', async () => {
      const tempEmail = `refresh-test-${Date.now()}@example.com`;
      const regRes = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: tempEmail,
          password: 'Password123!',
          firstName: 'Refresh',
          lastName: 'Test',
          role: 'candidate',
        });

      const initialRefreshToken = regRes.body.data.tokens.refreshToken;

      // 1. Use refresh token to get new tokens
      const refreshRes1 = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: initialRefreshToken });
      expect(refreshRes1.status).toBe(200);
      expect(refreshRes1.body.data.tokens.refreshToken).toBeDefined();

      // 2. Attempt to reuse the old refresh token -> Must be rejected (401)
      const refreshRes2 = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: initialRefreshToken });
      expect(refreshRes2.status).toBe(401);
    });
  });

  describe('NoSQL Injection Defense', () => {
    it('should recursively strip MongoDB operator keys ($gt, $ne, $where) from payloads', () => {
      const maliciousPayload = {
        email: 'user@example.com',
        password: { $gt: '' },
        filter: { 'nested.field': true, $where: 'sleep(5000)' },
      };

      const sanitized = sanitizeNoSQL(maliciousPayload);
      expect(sanitized.email).toBe('user@example.com');
      expect(sanitized.password).toEqual({});
      expect(sanitized.filter).toEqual({});
    });
  });

  describe('File Upload Security & Extension Validation', () => {
    it('should reject executable and script extensions', () => {
      const exeValidation = s3ProductionService.validateFile('application/octet-stream', 1024, 'malware.exe');
      expect(exeValidation.valid).toBe(false);

      const shValidation = s3ProductionService.validateFile('text/x-sh', 1024, 'exploit.sh');
      expect(shValidation.valid).toBe(false);
    });

    it('should sanitize dangerous filenames against directory traversal', () => {
      const sanitized = s3ProductionService.sanitizeFileName('../../../etc/passwd\0.pdf');
      expect(sanitized).not.toContain('..');
      expect(sanitized).not.toContain('/');
      expect(sanitized).not.toContain('\0');
    });

    it('should reject files exceeding the 10MB limit', () => {
      const oversized = 15 * 1024 * 1024; // 15MB
      const sizeValidation = s3ProductionService.validateFile('application/pdf', oversized, 'large_resume.pdf');
      expect(sizeValidation.valid).toBe(false);
    });
  });

  describe('Administrative Audit Trail Inspection', () => {
    it('should allow Admin to query immutable audit trail', async () => {
      const res = await request(app)
        .get('/api/v1/admin/audits')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should deny non-admin users from accessing audit logs', async () => {
      const res = await request(app)
        .get('/api/v1/admin/audits')
        .set('Authorization', `Bearer ${candidateToken}`);

      expect(res.status).toBe(403);
    });
  });
});
