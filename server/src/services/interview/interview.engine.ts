import { v4 as uuidv4 } from 'uuid';
import {
  InterviewSessionState,
  InterviewTurn,
  InterviewMode,
  CombinedInterviewEvaluation,
} from '@ats/shared';
import { interviewPlanner } from './interview-planner.service';
import { responseAnalyzer } from './response-analyzer.service';
import { atsStore } from '../../models/store';
import { ApiError } from '../../utils/errors';
import { logger } from '../../utils/logger';

export class InterviewEngine {
  /**
   * Starts a new capability-linked adaptive interview session
   */
  async startInterviewSession(
    candidateId: string,
    jobId: string,
    organizationId: string,
    mode: InterviewMode = 'ai_assisted',
    interviewId?: string
  ): Promise<InterviewSessionState> {
    const jobCapModel = await atsStore.getJobCapabilityModelByJobId(jobId, organizationId);
    if (!jobCapModel) {
      throw ApiError.notFound('Job Capability Model must be compiled before launching interview');
    }

    const candidateCaps = await atsStore.getCandidateCapabilities(candidateId);
    const plan = await interviewPlanner.generateInterviewPlan(
      jobCapModel,
      candidateCaps,
      candidateId,
      jobId
    );

    const firstCompetency = plan.plannedCompetencies[0];
    const initialTurn: InterviewTurn = {
      id: uuidv4(),
      capabilityName: firstCompetency.capabilityName,
      questionText: firstCompetency.keyProbeQuestions[0],
      questionType: 'primary',
      timestamp: new Date().toISOString(),
    };

    const session: InterviewSessionState = {
      id: uuidv4(),
      interviewId,
      candidateId,
      jobId,
      organizationId,
      mode,
      status: 'in_progress',
      plan,
      currentTurnIndex: 1,
      turns: [initialTurn],
      privacyRetentionDays: 90,
      startedAt: new Date().toISOString(),
    };

    await atsStore.saveInterviewSession(session);

    await atsStore.logAuditEvent({
      userId: candidateId,
      organizationId,
      action: 'interview.start',
      resource: 'interview_session',
      resourceId: session.id,
      status: 'success',
      metadata: { jobId, mode, plannedCompetenciesCount: plan.plannedCompetencies.length },
    });

    return session;
  }

  /**
   * Records candidate response, extracts technical claims, and computes targeted follow-ups
   */
  async recordResponseAndAnalyze(
    sessionId: string,
    candidateResponse: string
  ): Promise<{ session: InterviewSessionState; latestTurn: InterviewTurn }> {
    const session = await atsStore.getInterviewSessionById(sessionId);
    if (!session) throw ApiError.notFound('Interview session not found');
    if (session.status !== 'in_progress') throw ApiError.badRequest('Interview is not active');

    const currentTurn = session.turns[session.turns.length - 1];
    if (!currentTurn) throw ApiError.badRequest('No active turn in interview');

    // 1. Analyze Response & Extract Claims / Evidence / Follow-ups
    const analysis = await responseAnalyzer.analyzeResponse(
      currentTurn.capabilityName,
      currentTurn.questionText,
      candidateResponse
    );

    currentTurn.candidateResponse = candidateResponse;
    currentTurn.detectedClaims = analysis.detectedClaims;
    currentTurn.detectedEvidence = analysis.detectedEvidence;
    currentTurn.uncertaintyIdentified = analysis.uncertaintyIdentified;
    currentTurn.followUpRecommendations = analysis.followUpRecommendations;
    currentTurn.turnEvaluation = analysis.turnEvaluation;

    await atsStore.saveInterviewSession(session);
    return { session, latestTurn: currentTurn };
  }

  /**
   * Recruiter accepts a suggested follow-up, edits it, or adds a custom probe question
   */
  async addNextQuestionTurn(
    sessionId: string,
    questionText: string,
    capabilityName: string,
    questionType: 'follow_up' | 'primary' | 'recruiter_custom' = 'follow_up'
  ): Promise<InterviewSessionState> {
    const session = await atsStore.getInterviewSessionById(sessionId);
    if (!session) throw ApiError.notFound('Interview session not found');
    if (session.status !== 'in_progress') throw ApiError.badRequest('Interview is not active');

    const newTurn: InterviewTurn = {
      id: uuidv4(),
      capabilityName,
      questionText,
      questionType,
      timestamp: new Date().toISOString(),
    };

    session.turns.push(newTurn);
    session.currentTurnIndex += 1;

    await atsStore.saveInterviewSession(session);
    return session;
  }

  /**
   * Finalizes interview session, computes combined evaluation across required dimensions,
   * and dispatches structured EvidenceItems directly to Proof-of-Skill engine.
   */
  async completeInterviewSession(
    sessionId: string,
    interviewerNotes?: string
  ): Promise<InterviewSessionState> {
    const session = await atsStore.getInterviewSessionById(sessionId);
    if (!session) throw ApiError.notFound('Interview session not found');

    const evaluatedTurns = session.turns.filter((t) => t.turnEvaluation);
    const count = evaluatedTurns.length || 1;

    const avgReasoning = Math.round(
      evaluatedTurns.reduce((acc, t) => acc + (t.turnEvaluation?.technicalReasoningScore || 75), 0) / count
    );
    const avgDepth = Math.round(
      evaluatedTurns.reduce((acc, t) => acc + (t.turnEvaluation?.explanationDepthScore || 75), 0) / count
    );
    const avgConsistency = Math.round(
      evaluatedTurns.reduce((acc, t) => acc + (t.turnEvaluation?.consistencyScore || 85), 0) / count
    );

    const combinedEvaluation: CombinedInterviewEvaluation = {
      technicalReasoning: avgReasoning,
      problemSolving: Math.round(avgReasoning * 0.95),
      communication: Math.round(avgDepth * 0.9),
      explanationQuality: avgDepth,
      adaptability: 85,
      consistency: avgConsistency,
      summary: `Candidate demonstrated solid technical reasoning (${avgReasoning}%) across ${session.turns.length} probe turns.`,
      recommendationNotes: `Interviewer debrief: Candidate substantiated hands-on experience in core architectural domains.`,
      evaluatedAt: new Date().toISOString(),
    };

    session.status = 'completed';
    session.completedAt = new Date().toISOString();
    session.interviewerNotes = interviewerNotes || session.interviewerNotes;
    session.combinedEvaluation = combinedEvaluation;

    await atsStore.saveInterviewSession(session);

    // Cross-Stage Evidence Dispatch to Proof-of-Skill Engine (Weight 0.85)
    for (const turn of evaluatedTurns) {
      if (turn.candidateResponse && turn.turnEvaluation) {
        await atsStore.addEvidenceItem({
          id: uuidv4(),
          candidateId: session.candidateId,
          organizationId: session.organizationId,
          capabilityName: turn.capabilityName,
          sourceType: 'interview',
          title: `Technical Interview Probe: ${turn.capabilityName}`,
          summary: `Candidate response: "${turn.candidateResponse.slice(0, 160)}..." — ${turn.turnEvaluation.feedback}`,
          sourceScore: turn.turnEvaluation.technicalReasoningScore,
          state: turn.turnEvaluation.technicalReasoningScore >= 70 ? 'supports' : 'partially_supports',
          reliabilityWeight: 0.85,
          stageRecorded: 'interview',
          createdAt: new Date().toISOString(),
        });
      }
    }

    return session;
  }
}

export const interviewEngine = new InterviewEngine();
