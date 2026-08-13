import { Request, Response, NextFunction } from 'express';
import { interviewEngine } from '../services/interview/interview.engine';
import { atsStore } from '../models/store';
import { ApiError } from '../utils/errors';

export const startInterviewSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { candidateId, jobId, mode, interviewId } = req.body;

    if (!candidateId || !jobId) {
      throw ApiError.badRequest('Candidate ID and Job ID are required');
    }

    const job = await atsStore.getJobById(jobId);
    if (!job) throw ApiError.notFound('Job requisition not found');

    const session = await interviewEngine.startInterviewSession(
      candidateId,
      jobId,
      job.organizationId,
      mode || 'ai_assisted',
      interviewId
    );

    res.status(201).json({ success: true, data: session });
  } catch (err) {
    next(err);
  }
};

export const getInterviewSessionById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = await atsStore.getInterviewSessionById(req.params.id);
    if (!session) throw ApiError.notFound('Interview session not found');

    const isCandidate = req.user?.role === 'candidate';
    if (isCandidate && req.user?.candidateProfileId !== session.candidateId) {
      throw ApiError.forbidden('Access denied to interview session');
    }

    res.json({ success: true, data: session });
  } catch (err) {
    next(err);
  }
};

export const recordResponse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = req.params.id;
    const { candidateResponse } = req.body;

    if (!candidateResponse) {
      throw ApiError.badRequest('Candidate response is required');
    }

    const result = await interviewEngine.recordResponseAndAnalyze(sessionId, candidateResponse);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const acceptOrAddFollowUp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = req.params.id;
    const { questionText, capabilityName, questionType } = req.body;

    if (!questionText || !capabilityName) {
      throw ApiError.badRequest('Question text and capability name are required');
    }

    const session = await interviewEngine.addNextQuestionTurn(
      sessionId,
      questionText,
      capabilityName,
      questionType || 'follow_up'
    );

    res.json({ success: true, data: session });
  } catch (err) {
    next(err);
  }
};

export const completeInterviewSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = req.params.id;
    const { interviewerNotes } = req.body;

    const session = await interviewEngine.completeInterviewSession(sessionId, interviewerNotes);
    res.json({ success: true, data: session });
  } catch (err) {
    next(err);
  }
};
