import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { decisionReadinessService } from '../services/decision/decision-readiness.service';
import { atsStore } from '../models/store';
import { ApiError } from '../utils/errors';
import { RecruiterDecisionAction, DecisionReadinessState } from '@ats/shared';

export const getDecisionReadiness = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const candidateId = req.params.id;
    const { jobId } = req.query;

    if (!jobId) {
      throw ApiError.badRequest('Job ID query parameter is required');
    }

    const evaluation = await decisionReadinessService.evaluateReadiness(
      candidateId,
      jobId as string,
      req.organizationId
    );

    res.json({ success: true, data: evaluation });
  } catch (err) {
    next(err);
  }
};

export const recordDecision = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const candidateId = req.params.id;
    const orgId = req.organizationId || 'org-1';

    const { jobId, action, reason, aiAdvisoryState, evidenceStateSnapshot } = req.body;

    if (!jobId || !action || !reason || !reason.trim()) {
      throw ApiError.badRequest('Job ID, action, and mandatory justification reason are required');
    }

    const decisionRecord = await atsStore.recordDecision({
      id: uuidv4(),
      candidateId,
      jobId,
      organizationId: orgId,
      recruiterId: req.user?.userId || 'unknown-recruiter',
      recruiterEmail: req.user?.email || 'recruiter@verity.ai',
      action: action as RecruiterDecisionAction,
      aiAdvisoryState: (aiAdvisoryState as DecisionReadinessState) || 'INSUFFICIENT_EVIDENCE',
      evidenceStateSnapshot: evidenceStateSnapshot || { overallVerificationRate: 75, verifiedCount: 3, readinessScore: 80 },
      reason: reason.trim(),
      timestamp: new Date().toISOString(),
    });

    await atsStore.logAuditEvent({
      userId: req.user?.userId,
      organizationId: orgId,
      action: `candidate.decision.${action}`,
      resource: 'candidate_decision',
      resourceId: decisionRecord.id,
      status: 'success',
      metadata: { candidateId, jobId, action, reason },
    });

    res.status(201).json({ success: true, data: decisionRecord });
  } catch (err) {
    next(err);
  }
};

export const getDecisionHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const candidateId = req.params.id;
    const history = await atsStore.getDecisionHistoryByCandidateId(candidateId);
    res.json({ success: true, data: history });
  } catch (err) {
    next(err);
  }
};
