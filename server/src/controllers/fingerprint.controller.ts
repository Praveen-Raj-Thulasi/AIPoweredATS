import { Request, Response, NextFunction } from 'express';
import { fingerprintService } from '../services/fingerprint/fingerprint.service';
import { candidateComparator } from '../services/fingerprint/candidate-comparator.service';
import { ApiError } from '../utils/errors';

export const getCandidateFingerprint = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const candidateId = req.params.id;
    const { jobId } = req.query;

    const fingerprint = await fingerprintService.generateFingerprint(candidateId, jobId as string);
    res.json({ success: true, data: fingerprint });
  } catch (err) {
    next(err);
  }
};

export const compareCandidatesForJob = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const jobId = req.params.id;
    const { candidateIds } = req.body;

    if (!Array.isArray(candidateIds) || candidateIds.length === 0) {
      throw ApiError.badRequest('candidateIds array is required');
    }

    const report = await candidateComparator.compareCandidates(jobId, candidateIds);
    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
};
