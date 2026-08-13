import request from 'supertest';
import { app } from '../src/server';
import { seedDatabase } from '../src/seed';
import { atsStore } from '../src/models/store';

describe('VERITY Resume Ingestion & Auto Claims Extraction Tests', () => {
  let recruiterToken: string;

  beforeAll(async () => {
    await seedDatabase();

    const rec1 = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'recruiter@innovatecorp.com', password: 'Recruiter@2026' });
    recruiterToken = rec1.body.data.tokens.accessToken;
  });

  it('should upload a resume, create a candidate, and automatically extract claims and initial evidence', async () => {
    const resumeContent = `
      Elena Rostova
      Email: elena.rostova.test@innovatecorp.com
      Phone: +1 (415) 555-0199
      Skills: TypeScript, React, Node.js, AWS

      Experience:
      Software Engineer at Technology Solutions (2022 - Present)
      Engineered web systems using TypeScript, React, and Node.js.
    `;

    const res = await request(app)
      .post('/api/v1/candidates/upload-resume')
      .set('Authorization', `Bearer ${recruiterToken}`)
      .field('jobId', 'job-1')
      .attach('resume', Buffer.from(resumeContent, 'utf-8'), 'elena_resume.txt');

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.candidate).toBeDefined();
    
    const candidateId = res.body.data.candidate.id;
    expect(res.body.data.candidate.firstName).toBe('Elena');
    expect(res.body.data.candidate.lastName).toBe('Rostova');
    expect(res.body.data.candidate.email).toBe('elena.rostova.test@innovatecorp.com');
    expect(res.body.data.candidate.skills).toContain('TypeScript');
    expect(res.body.data.candidate.skills).toContain('React');
    expect(res.body.data.candidate.skills).toContain('Node.js');

    // Verify that claims were automatically extracted
    const claims = await atsStore.getCandidateClaims(candidateId);
    expect(claims.length).toBeGreaterThanOrEqual(3);
    expect(claims.some((c) => c.capabilityName === 'TypeScript')).toBe(true);
    expect(claims.some((c) => c.capabilityName === 'React')).toBe(true);

    // Verify that initial evidence items were created
    const evidence = await atsStore.getEvidenceItems(candidateId);
    expect(evidence.length).toBeGreaterThanOrEqual(3);
    expect(evidence.some((e) => e.capabilityName === 'TypeScript' && e.sourceType === 'resume')).toBe(true);
    expect(evidence.some((e) => e.capabilityName === 'TypeScript' && e.sourceType === 'project')).toBe(true);
  });
});
