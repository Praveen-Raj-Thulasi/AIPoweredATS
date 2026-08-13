import { Request, Response, NextFunction } from 'express';
import { capabilityCompiler } from '../services/ai/capability-compiler.service';
import { atsStore } from '../models/store';
import { ApiError } from '../utils/errors';

export const compileJobCapabilities = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = req.organizationId;
    if (!orgId) throw ApiError.forbidden('Organization context required to compile capabilities');

    const job = await atsStore.getJobById(req.params.id, orgId);
    if (!job) throw ApiError.notFound('Job requisition not found');

    const model = await capabilityCompiler.compileJobToCapabilityModel(job, orgId, req.user!.userId);

    res.status(201).json({ success: true, data: model });
  } catch (err) {
    next(err);
  }
};

export const getJobCapabilityModel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const model = await atsStore.getJobCapabilityModelByJobId(
      req.params.id,
      req.user?.role === 'candidate' ? undefined : req.organizationId
    );

    if (!model) {
      throw ApiError.notFound('No capability model has been compiled for this job yet');
    }

    res.json({ success: true, data: model });
  } catch (err) {
    next(err);
  }
};

export const updateJobCapabilityModel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = req.organizationId;
    if (!orgId) throw ApiError.forbidden('Organization context required');

    const { capabilities, relationships, modificationSummary } = req.body;
    if (!Array.isArray(capabilities)) {
      throw ApiError.badRequest('Capabilities must be provided as an array');
    }

    const updated = await capabilityCompiler.updateCapabilityModel(
      req.params.id,
      orgId,
      capabilities,
      relationships || [],
      req.user!.userId,
      modificationSummary
    );

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

export const approveJobCapabilityModel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = req.organizationId;
    if (!orgId) throw ApiError.forbidden('Organization context required');

    const approved = await capabilityCompiler.approveCapabilityModel(
      req.params.id,
      orgId,
      req.user!.userId
    );

    res.json({ success: true, data: approved });
  } catch (err) {
    next(err);
  }
};
