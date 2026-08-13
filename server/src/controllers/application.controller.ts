import { Request, Response, NextFunction } from 'express';
import { atsStore } from '../models/store';
import { aiService } from '../services/ai.service';
import { ApiError } from '../utils/errors';
import { ApplicationStage } from '@ats/shared';

export const getApplications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const jobId = req.query.jobId as string | undefined;

    // If candidate, only return their own applications (IDOR Protection)
    if (req.user?.role === 'candidate') {
      const candidateApps = await atsStore.getApplications(undefined, jobId, req.user.candidateProfileId);
      return res.json({ success: true, data: candidateApps });
    }

    // If recruiter, return applications strictly within their organization
    const apps = await atsStore.getApplications(req.organizationId, jobId);
    res.json({ success: true, data: apps });
  } catch (err) {
    next(err);
  }
};

export const getApplicationById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const app = await atsStore.getApplicationById(req.params.id, req.organizationId);
    if (!app) {
      throw ApiError.notFound('Application not found or access denied');
    }

    // If candidate, ensure candidate owns this application
    if (req.user?.role === 'candidate' && app.candidateId !== req.user.candidateProfileId) {
      throw ApiError.forbidden('You do not have permission to view this application');
    }

    res.json({ success: true, data: app });
  } catch (err) {
    next(err);
  }
};

export const updateApplicationStage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { stage, actorName } = req.body;
    if (!stage) {
      throw ApiError.badRequest('Stage is required');
    }

    const updated = await atsStore.updateApplicationStage(
      req.params.id,
      stage as ApplicationStage,
      actorName || req.user?.email || 'Recruiting Team',
      req.organizationId
    );

    if (!updated) {
      throw ApiError.notFound('Application not found or access denied');
    }

    await atsStore.logAuditEvent({
      userId: req.user?.userId,
      userEmail: req.user?.email,
      organizationId: req.organizationId,
      action: 'application.stage_change',
      resource: 'application',
      resourceId: updated.id,
      status: 'success',
      metadata: { newStage: stage },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

export const addApplicationNote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { authorName, authorRole, content } = req.body;
    if (!content) {
      throw ApiError.badRequest('Note content is required');
    }

    const updated = await atsStore.addApplicationNote(
      req.params.id,
      {
        authorName: authorName || req.user?.email || 'Hiring Manager',
        authorRole: authorRole || 'Interviewer',
        content,
      },
      req.organizationId
    );

    if (!updated) {
      throw ApiError.notFound('Application not found or access denied');
    }

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

export const reEvaluateApplication = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const app = await atsStore.getApplicationById(req.params.id, req.organizationId);
    if (!app || !app.candidate) {
      throw ApiError.notFound('Application or Candidate not found');
    }

    const job = await atsStore.getJobById(app.jobId, req.organizationId);
    if (!job) {
      throw ApiError.notFound('Job not found');
    }

    const newScore = await aiService.evaluateCandidateFit(job, app.candidate);

    const updated = await atsStore.getApplicationById(app.id, req.organizationId);
    if (updated) {
      updated.aiScoreCard = newScore;
    }

    await atsStore.logAuditEvent({
      userId: req.user?.userId,
      userEmail: req.user?.email,
      organizationId: req.organizationId,
      action: 'application.ai_rescore',
      resource: 'application',
      resourceId: app.id,
      status: 'success',
      metadata: { overallScore: newScore.overallScore },
    });

    res.json({ success: true, data: { application: updated, aiScoreCard: newScore } });
  } catch (err) {
    next(err);
  }
};
