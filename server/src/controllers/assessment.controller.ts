import { Request, Response, NextFunction } from 'express';
import { assessmentEngine } from '../services/assessment/assessment.engine';
import { uncertaintyEngine } from '../services/assessment/uncertainty.engine';
import { atsStore } from '../models/store';
import { ApiError } from '../utils/errors';

export const startSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { jobId, candidateId: requestedCandidateId } = req.body;
    const isCandidate = req.user?.role === 'candidate';

    const candidateId = isCandidate ? req.user?.candidateProfileId : requestedCandidateId;
    if (!candidateId) throw ApiError.badRequest('Candidate ID is required');
    if (!jobId) throw ApiError.badRequest('Job ID is required');

    const job = await atsStore.getJobById(jobId);
    if (!job) throw ApiError.notFound('Job requisition not found');

    const session = await assessmentEngine.startSession(
      candidateId,
      jobId,
      job.organizationId
    );

    // Sanitize challenge options (hide isCorrect flag from candidate)
    if (session.currentChallenge?.options) {
      session.currentChallenge.options = session.currentChallenge.options.map((o) => ({
        id: o.id,
        text: o.text,
      }));
    }

    res.status(201).json({ success: true, data: session });
  } catch (err) {
    next(err);
  }
};

export const getSessionById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = await atsStore.getAssessmentSessionById(req.params.id);
    if (!session) throw ApiError.notFound('Assessment session not found');

    const isCandidate = req.user?.role === 'candidate';
    if (isCandidate && req.user?.candidateProfileId !== session.candidateId) {
      throw ApiError.forbidden('Access denied to assessment session');
    }

    // Sanitize challenge options for candidates
    if (isCandidate && session.currentChallenge?.options) {
      session.currentChallenge.options = session.currentChallenge.options.map((o) => ({
        id: o.id,
        text: o.text,
      }));
    }

    res.json({ success: true, data: session });
  } catch (err) {
    next(err);
  }
};

export const submitAttempt = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = req.params.id;
    const { answer, code, timeSpentSeconds } = req.body;

    const session = await atsStore.getAssessmentSessionById(sessionId);
    if (!session) throw ApiError.notFound('Assessment session not found');

    const candidateId = session.candidateId;
    const result = await assessmentEngine.submitAttemptAndAdapt(
      sessionId,
      { answer: answer || '', code, timeSpentSeconds: timeSpentSeconds || 60 },
      candidateId
    );

    // Sanitize challenge options for next challenge
    if (result.session.currentChallenge?.options) {
      result.session.currentChallenge.options = result.session.currentChallenge.options.map((o) => ({
        id: o.id,
        text: o.text,
      }));
    }

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const getCandidateUncertainty = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const candidateId = req.params.id;
    const { jobId } = req.query;

    if (!jobId) throw ApiError.badRequest('Job ID query parameter is required');

    const jobCapModel = await atsStore.getJobCapabilityModelByJobId(jobId as string);
    if (!jobCapModel) throw ApiError.notFound('Capability model not found for job');

    const candidateCaps = await atsStore.getCandidateCapabilities(candidateId);
    const metrics = uncertaintyEngine.computeUncertainty(
      candidateId,
      jobCapModel.capabilities,
      candidateCaps
    );

    res.json({ success: true, data: metrics });
  } catch (err) {
    next(err);
  }
};
