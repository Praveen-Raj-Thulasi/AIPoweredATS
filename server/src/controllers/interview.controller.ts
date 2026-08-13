import { Request, Response, NextFunction } from 'express';
import { atsStore } from '../models/store';
import { notificationService } from '../services/notification';
import { ApiError } from '../utils/errors';
import { InterviewType, InterviewStatus } from '@ats/shared';

export const getInterviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { applicationId, candidateId, status } = req.query;

    const list = await atsStore.getInterviews({
      organizationId: req.user?.role === 'candidate' ? undefined : req.organizationId,
      applicationId: applicationId as string,
      candidateId: req.user?.role === 'candidate' ? req.user.candidateProfileId : (candidateId as string),
      status: status as string,
    });

    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
};

export const scheduleInterview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = req.organizationId;
    if (!orgId) throw ApiError.forbidden('Organization context required to schedule interviews');

    const {
      applicationId,
      jobId,
      candidateId,
      interviewerNames,
      interviewType,
      scheduledAt,
      durationMinutes,
      meetingLink,
      location,
      notes,
    } = req.body;

    if (!applicationId || !scheduledAt) {
      throw ApiError.badRequest('Application ID and scheduledAt date/time are required');
    }

    const application = await atsStore.getApplicationById(applicationId, orgId);
    if (!application) throw ApiError.notFound('Application not found');

    const candidate = await atsStore.getCandidateById(candidateId || application.candidateId, orgId);
    const job = await atsStore.getJobById(jobId || application.jobId, orgId);

    const interview = await atsStore.createInterview({
      organizationId: orgId,
      applicationId,
      jobId: job?.id || application.jobId,
      candidateId: candidate?.id || application.candidateId,
      jobTitle: job?.title || application.jobTitle,
      candidateName: candidate ? `${candidate.firstName} ${candidate.lastName}` : 'Candidate',
      candidateEmail: candidate?.email,
      interviewerNames: Array.isArray(interviewerNames) ? interviewerNames : ['Hiring Manager'],
      interviewType: (interviewType as InterviewType) || 'technical',
      scheduledAt,
      durationMinutes: durationMinutes ? Number(durationMinutes) : 45,
      meetingLink: meetingLink || 'https://meet.google.com/verity-interview',
      location: location || 'Remote (Google Meet)',
      status: 'scheduled',
      notes,
      createdBy: req.user!.userId,
    });

    // Advance application stage to 'interview' if currently in screening/assessment
    if (['applied', 'screening', 'assessment'].includes(application.stage)) {
      await atsStore.updateApplicationStage(application.id, 'interview', req.user!.email, orgId);
    }

    // Trigger candidate notification
    await notificationService.sendInterviewScheduledNotification(interview);

    await atsStore.logAuditEvent({
      userId: req.user?.userId,
      userEmail: req.user?.email,
      organizationId: orgId,
      action: 'interview.schedule',
      resource: 'interview',
      resourceId: interview.id,
      status: 'success',
      metadata: { scheduledAt, interviewType },
    });

    res.status(201).json({ success: true, data: interview });
  } catch (err) {
    next(err);
  }
};

export const updateInterview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updated = await atsStore.updateInterview(req.params.id, req.body, req.organizationId);
    if (!updated) throw ApiError.notFound('Interview not found');

    await atsStore.logAuditEvent({
      userId: req.user?.userId,
      userEmail: req.user?.email,
      organizationId: req.organizationId,
      action: 'interview.update',
      resource: 'interview',
      resourceId: updated.id,
      status: 'success',
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

export const submitFeedback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rating, recommendation, summary } = req.body;
    if (!rating || !recommendation) {
      throw ApiError.badRequest('Rating and recommendation are required for feedback');
    }

    const updated = await atsStore.updateInterview(
      req.params.id,
      {
        status: 'completed',
        feedback: {
          rating: Number(rating),
          recommendation,
          summary: summary || '',
          submittedAt: new Date().toISOString(),
        },
      },
      req.organizationId
    );

    if (!updated) throw ApiError.notFound('Interview not found');

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};
