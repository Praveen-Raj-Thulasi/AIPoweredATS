import { Request, Response, NextFunction } from 'express';
import { atsStore } from '../models/store';
import { ApiError } from '../utils/errors';

export const getJobs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, department, search, page, limit, sortOrder } = req.query;

    const result = await atsStore.getJobs({
      organizationId: req.user?.role === 'candidate' ? undefined : req.organizationId,
      status: (status as string) || (req.user?.role === 'candidate' ? 'published' : 'all'),
      department: department as string,
      search: search as string,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 20,
      sortOrder: (sortOrder as 'asc' | 'desc') || 'desc',
    });

    res.json({ success: true, data: result.data, meta: result.meta });
  } catch (err) {
    next(err);
  }
};

export const getJobById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const job = await atsStore.getJobById(req.params.id, req.user?.role === 'candidate' ? undefined : req.organizationId);
    if (!job) {
      throw ApiError.notFound('Job not found or access denied');
    }
    res.json({ success: true, data: job });
  } catch (err) {
    next(err);
  }
};

export const createJob = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = req.organizationId;
    if (!orgId) {
      throw ApiError.forbidden('An active organization context is required to create a job');
    }

    const {
      title,
      department,
      location,
      type,
      experienceLevel,
      minYearsExperience,
      maxYearsExperience,
      salaryMin,
      salaryMax,
      currency,
      description,
      responsibilities,
      requirements,
      requiredSkills,
      preferredSkills,
      education,
      status,
      openingsCount,
    } = req.body;

    if (!title || !department || !description) {
      throw ApiError.badRequest('Title, Department, and Description are required');
    }

    const newJob = await atsStore.createJob({
      organizationId: orgId,
      title,
      department,
      location: location || 'Remote',
      type: type || 'full-time',
      experienceLevel: experienceLevel || 'senior',
      minYearsExperience: minYearsExperience ? Number(minYearsExperience) : 3,
      maxYearsExperience: maxYearsExperience ? Number(maxYearsExperience) : undefined,
      salaryMin: salaryMin ? Number(salaryMin) : undefined,
      salaryMax: salaryMax ? Number(salaryMax) : undefined,
      currency: currency || 'USD',
      description,
      responsibilities: Array.isArray(responsibilities) ? responsibilities : [],
      requirements: Array.isArray(requirements) ? requirements : [],
      requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : [],
      preferredSkills: Array.isArray(preferredSkills) ? preferredSkills : [],
      education,
      status: status || 'published',
      openingsCount: openingsCount ? Number(openingsCount) : 1,
      createdBy: req.user?.userId,
    });

    await atsStore.logAuditEvent({
      userId: req.user?.userId,
      userEmail: req.user?.email,
      organizationId: orgId,
      action: 'job.create',
      resource: 'job',
      resourceId: newJob.id,
      status: 'success',
    });

    res.status(201).json({ success: true, data: newJob });
  } catch (err) {
    next(err);
  }
};

export const updateJob = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updated = await atsStore.updateJob(req.params.id, req.body, req.organizationId);
    if (!updated) {
      throw ApiError.notFound('Job not found or access denied');
    }

    await atsStore.logAuditEvent({
      userId: req.user?.userId,
      userEmail: req.user?.email,
      organizationId: req.organizationId,
      action: 'job.update',
      resource: 'job',
      resourceId: updated.id,
      status: 'success',
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

export const duplicateJob = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = req.organizationId!;
    const duplicated = await atsStore.duplicateJob(req.params.id, orgId, req.user!.userId);
    if (!duplicated) {
      throw ApiError.notFound('Original job not found');
    }

    await atsStore.logAuditEvent({
      userId: req.user?.userId,
      userEmail: req.user?.email,
      organizationId: orgId,
      action: 'job.duplicate',
      resource: 'job',
      resourceId: duplicated.id,
      status: 'success',
      metadata: { originalJobId: req.params.id },
    });

    res.status(201).json({ success: true, data: duplicated });
  } catch (err) {
    next(err);
  }
};

export const archiveJob = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updated = await atsStore.updateJob(req.params.id, { status: 'archived' }, req.organizationId);
    if (!updated) {
      throw ApiError.notFound('Job not found');
    }

    await atsStore.logAuditEvent({
      userId: req.user?.userId,
      userEmail: req.user?.email,
      organizationId: req.organizationId,
      action: 'job.archive',
      resource: 'job',
      resourceId: updated.id,
      status: 'success',
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};
