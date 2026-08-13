import { v4 as uuidv4 } from 'uuid';
import {
  AssessmentSession,
  AssessmentChallenge,
  AssessmentAttempt,
  JobCapabilityModel,
  CandidateCapability,
} from '@ats/shared';
import { uncertaintyEngine } from './uncertainty.engine';
import { challengeGenerator } from './challenge-generator.service';
import { evaluationService } from './evaluation.service';
import { atsStore } from '../../models/store';
import { ApiError } from '../../utils/errors';
import { logger } from '../../utils/logger';

export class AssessmentEngine {
  /**
   * Starts a new adaptive assessment session targeting the highest-uncertainty competencies
   */
  async startSession(
    candidateId: string,
    jobId: string,
    organizationId: string
  ): Promise<AssessmentSession> {
    const jobCapModel = await atsStore.getJobCapabilityModelByJobId(jobId, organizationId);
    if (!jobCapModel) {
      throw ApiError.notFound('Job Capability Model must be compiled before starting assessment');
    }

    const candidateCapabilities = await atsStore.getCandidateCapabilities(candidateId);
    const uncertaintyMetrics = uncertaintyEngine.computeUncertainty(
      candidateId,
      jobCapModel.capabilities,
      candidateCapabilities
    );

    // Select first highest-priority target
    const nextTarget = uncertaintyEngine.selectNextTarget(uncertaintyMetrics, []);
    const initialCap = jobCapModel.capabilities.find(
      (c) => c.name.toLowerCase() === (nextTarget?.capabilityName || '').toLowerCase()
    ) || jobCapModel.capabilities[0];

    const firstChallenge = await challengeGenerator.generateChallenge(
      initialCap.name,
      initialCap.category,
      nextTarget ? nextTarget.level : 1,
      initialCap.transferableConcepts?.[0]
    );

    const session: AssessmentSession = {
      id: uuidv4(),
      candidateId,
      jobId,
      organizationId,
      status: 'in_progress',
      currentChallengeIndex: 1,
      totalChallengesCount: Math.min(5, jobCapModel.capabilities.length),
      currentChallenge: firstChallenge,
      attempts: [],
      uncertaintyBefore: uncertaintyMetrics.overallUncertaintyScore,
      capabilityImpact: [],
      startedAt: new Date().toISOString(),
    };

    await atsStore.saveAssessmentSession(session);

    await atsStore.logAuditEvent({
      userId: candidateId,
      organizationId,
      action: 'assessment.start',
      resource: 'assessment_session',
      resourceId: session.id,
      status: 'success',
      metadata: { jobId, uncertaintyBefore: session.uncertaintyBefore },
    });

    return session;
  }

  /**
   * Submits candidate response for current challenge, evaluates attempt deterministically,
   * updates Proof-of-Skill evidence, and adaptively synthesizes next challenge.
   */
  async submitAttemptAndAdapt(
    sessionId: string,
    submission: { answer: string; code?: string; timeSpentSeconds: number },
    candidateId: string
  ): Promise<{ session: AssessmentSession; attempt: AssessmentAttempt; isSessionComplete: boolean }> {
    const session = await atsStore.getAssessmentSessionById(sessionId);
    if (!session) throw ApiError.notFound('Assessment session not found');
    if (session.status !== 'in_progress') throw ApiError.badRequest('Assessment session is not active');
    if (!session.currentChallenge) throw ApiError.badRequest('No active challenge in session');

    const currentChallenge = session.currentChallenge;

    // 1. Evaluate Attempt Deterministically
    const attempt = evaluationService.evaluateAttempt(currentChallenge, candidateId, submission);

    // 2. Feed High-Fidelity Evidence Item into Proof-of-Skill Model
    await atsStore.addEvidenceItem({
      id: uuidv4(),
      candidateId,
      organizationId: session.organizationId,
      capabilityName: currentChallenge.capabilityName,
      sourceType: currentChallenge.type === 'coding' || currentChallenge.type === 'debugging' ? 'coding_task' : 'assessment',
      title: `Adaptive ${currentChallenge.levelName} Challenge: ${currentChallenge.title}`,
      summary: attempt.feedback,
      sourceScore: attempt.score,
      state: attempt.isPassed ? 'supports' : 'partially_supports',
      reliabilityWeight: currentChallenge.level >= 3 ? 1.0 : 0.9,
      stageRecorded: 'assessment',
      createdAt: new Date().toISOString(),
    });

    // 3. Update attempts list
    const updatedAttempts = [...session.attempts, attempt];

    // 4. Check if session reached target challenge limit
    const isSessionComplete = updatedAttempts.length >= session.totalChallengesCount;

    if (isSessionComplete) {
      session.status = 'completed';
      session.completedAt = new Date().toISOString();
      session.currentChallenge = undefined;
      session.attempts = updatedAttempts;

      // Re-calculate updated uncertainty and capability impact
      const jobCapModel = await atsStore.getJobCapabilityModelByJobId(session.jobId, session.organizationId);
      if (jobCapModel) {
        const candidateCaps = await atsStore.getCandidateCapabilities(candidateId);
        const updatedUncertainty = uncertaintyEngine.computeUncertainty(
          candidateId,
          jobCapModel.capabilities,
          candidateCaps
        );
        session.uncertaintyAfter = updatedUncertainty.overallUncertaintyScore;
      }

      await atsStore.saveAssessmentSession(session);
      return { session, attempt, isSessionComplete: true };
    }

    // 5. Adaptive Step: Compute next highest-value competency or advance level
    const evaluatedNames = updatedAttempts.map((a) => a.capabilityName.toLowerCase());
    const jobCapModel = await atsStore.getJobCapabilityModelByJobId(session.jobId, session.organizationId);
    let nextChallenge: AssessmentChallenge;

    if (jobCapModel) {
      const candidateCaps = await atsStore.getCandidateCapabilities(candidateId);
      const updatedUncertainty = uncertaintyEngine.computeUncertainty(
        candidateId,
        jobCapModel.capabilities,
        candidateCaps
      );

      const nextTarget = uncertaintyEngine.selectNextTarget(updatedUncertainty, evaluatedNames);
      const targetCap = jobCapModel.capabilities.find(
        (c) => c.name.toLowerCase() === (nextTarget?.capabilityName || '').toLowerCase()
      ) || jobCapModel.capabilities[0];

      // If previous attempt on same capability passed, advance cognitive level!
      const level = attempt.isPassed ? Math.min(5, (currentChallenge.level + 1) as any) : 2;

      nextChallenge = await challengeGenerator.generateChallenge(
        targetCap.name,
        targetCap.category,
        level as any,
        targetCap.transferableConcepts?.[0]
      );
    } else {
      nextChallenge = await challengeGenerator.generateChallenge(
        currentChallenge.capabilityName,
        currentChallenge.category,
        5
      );
    }

    session.attempts = updatedAttempts;
    session.currentChallengeIndex += 1;
    session.currentChallenge = nextChallenge;

    await atsStore.saveAssessmentSession(session);
    return { session, attempt, isSessionComplete: false };
  }
}

export const assessmentEngine = new AssessmentEngine();
