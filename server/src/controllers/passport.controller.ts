import { Request, Response } from 'express';
import { passportService } from '../services/passport/passport.service';
import { consentService } from '../services/passport/consent.service';
import { evidenceReuseService } from '../services/passport/evidence-reuse.service';
import { evidenceFreshnessService } from '../services/passport/evidence-freshness.service';
import { logger } from '../utils/logger';

export async function getCandidatePassport(req: Request, res: Response): Promise<void> {
  try {
    const candidateId = req.params.id;
    const isCandidate = req.user?.role === 'candidate';

    const passport = await passportService.getCandidatePassport(candidateId, isCandidate);
    res.status(200).json({ success: true, data: passport });
  } catch (error: any) {
    logger.error('Error in getCandidatePassport controller', { error: error.message });
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch candidate passport' });
  }
}

export async function getConsentSettings(req: Request, res: Response): Promise<void> {
  try {
    const candidateId = req.params.id;
    const consent = await consentService.getConsentSettings(candidateId);
    res.status(200).json({ success: true, data: consent });
  } catch (error: any) {
    logger.error('Error in getConsentSettings controller', { error: error.message });
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch consent settings' });
  }
}

export async function updateConsentSettings(req: Request, res: Response): Promise<void> {
  try {
    const candidateId = req.params.id;
    const { allowCrossJobReuse, allowCrossOrgSharing, excludedOrganizations, allowedCapabilities } = req.body;

    const updated = await consentService.updateConsentSettings(candidateId, {
      allowCrossJobReuse,
      allowCrossOrgSharing,
      excludedOrganizations,
      allowedCapabilities,
    });

    res.status(200).json({
      success: true,
      message: 'Candidate consent preferences updated successfully',
      data: updated,
    });
  } catch (error: any) {
    logger.error('Error in updateConsentSettings controller', { error: error.message });
    res.status(500).json({ success: false, error: error.message || 'Failed to update consent settings' });
  }
}

export async function checkEvidenceReuse(req: Request, res: Response): Promise<void> {
  try {
    const candidateId = req.params.id;
    const { targetJobId } = req.body;

    if (!targetJobId) {
      res.status(400).json({ success: false, error: 'targetJobId is required' });
      return;
    }

    const reuseAnalysis = await evidenceReuseService.analyzeEvidenceReuse(candidateId, targetJobId);
    res.status(200).json({ success: true, data: reuseAnalysis });
  } catch (error: any) {
    logger.error('Error in checkEvidenceReuse controller', { error: error.message });
    res.status(500).json({ success: false, error: error.message || 'Failed to analyze evidence reuse' });
  }
}

export async function evaluateFreshness(req: Request, res: Response): Promise<void> {
  try {
    const { capabilityName, evidenceDate } = req.body;

    if (!capabilityName) {
      res.status(400).json({ success: false, error: 'capabilityName is required' });
      return;
    }

    const evaluation = evidenceFreshnessService.evaluateFreshness(capabilityName, evidenceDate);
    res.status(200).json({ success: true, data: evaluation });
  } catch (error: any) {
    logger.error('Error in evaluateFreshness controller', { error: error.message });
    res.status(500).json({ success: false, error: error.message || 'Failed to evaluate capability freshness' });
  }
}
