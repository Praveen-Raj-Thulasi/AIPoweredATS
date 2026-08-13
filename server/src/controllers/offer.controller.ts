import { Request, Response, NextFunction } from 'express';
import { atsStore } from '../models/store';
import { notificationService } from '../services/notification';
import { ApiError } from '../utils/errors';

export const getOffers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { applicationId, candidateId, status } = req.query;

    const list = await atsStore.getOffers({
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

export const createOffer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = req.organizationId;
    if (!orgId) throw ApiError.forbidden('Organization context required to generate offers');

    const {
      applicationId,
      baseSalary,
      currency,
      equity,
      bonus,
      startDate,
      expirationDate,
      customTerms,
    } = req.body;

    if (!applicationId || !baseSalary || !startDate || !expirationDate) {
      throw ApiError.badRequest('Application ID, base salary, start date, and expiration date are required');
    }

    const application = await atsStore.getApplicationById(applicationId, orgId);
    if (!application) throw ApiError.notFound('Application not found');

    const candidate = await atsStore.getCandidateById(application.candidateId, orgId);
    const job = await atsStore.getJobById(application.jobId, orgId);

    const offer = await atsStore.createOffer({
      organizationId: orgId,
      applicationId,
      candidateId: application.candidateId,
      jobId: application.jobId,
      candidateName: candidate ? `${candidate.firstName} ${candidate.lastName}` : 'Candidate',
      candidateEmail: candidate?.email,
      jobTitle: job?.title || application.jobTitle,
      baseSalary: Number(baseSalary),
      currency: currency || 'USD',
      equity,
      bonus,
      startDate,
      expirationDate,
      customTerms,
      status: 'draft',
      createdBy: req.user!.userId,
    });

    await atsStore.logAuditEvent({
      userId: req.user?.userId,
      userEmail: req.user?.email,
      organizationId: orgId,
      action: 'offer.create_draft',
      resource: 'offer',
      resourceId: offer.id,
      status: 'success',
      metadata: { baseSalary, currency },
    });

    res.status(201).json({ success: true, data: offer });
  } catch (err) {
    next(err);
  }
};

export const sendOffer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const offer = await atsStore.getOfferById(req.params.id, req.organizationId);
    if (!offer) throw ApiError.notFound('Offer not found');

    const updated = await atsStore.updateOffer(
      offer.id,
      {
        status: 'sent',
        sentAt: new Date().toISOString(),
      },
      req.organizationId
    );

    // Update application stage to 'offer'
    await atsStore.updateApplicationStage(offer.applicationId, 'offer', req.user!.email, req.organizationId);

    // Send candidate notification
    if (updated) {
      await notificationService.sendOfferNotification(updated);
    }

    await atsStore.logAuditEvent({
      userId: req.user?.userId,
      userEmail: req.user?.email,
      organizationId: req.organizationId,
      action: 'offer.send',
      resource: 'offer',
      resourceId: offer.id,
      status: 'success',
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

export const respondToOffer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { decision } = req.body; // 'accepted' | 'rejected'
    if (!['accepted', 'rejected'].includes(decision)) {
      throw ApiError.badRequest('Decision must be either "accepted" or "rejected"');
    }

    const offer = await atsStore.getOfferById(req.params.id);
    if (!offer) throw ApiError.notFound('Offer not found');

    // If candidate, ensure candidate owns this offer
    if (req.user?.role === 'candidate' && offer.candidateId !== req.user.candidateProfileId) {
      throw ApiError.forbidden('You do not have permission to respond to this offer');
    }

    const updated = await atsStore.updateOffer(offer.id, {
      status: decision as any,
      respondedAt: new Date().toISOString(),
    });

    // Automatically update Application stage to 'hired' if accepted, or 'rejected'
    const targetStage = decision === 'accepted' ? 'hired' : 'rejected';
    await atsStore.updateApplicationStage(offer.applicationId, targetStage, req.user!.email);

    await atsStore.logAuditEvent({
      userId: req.user?.userId,
      userEmail: req.user?.email,
      organizationId: offer.organizationId,
      action: `offer.${decision}`,
      resource: 'offer',
      resourceId: offer.id,
      status: 'success',
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};
