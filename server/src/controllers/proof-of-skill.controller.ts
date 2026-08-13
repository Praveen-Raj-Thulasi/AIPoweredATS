import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { proofOfSkillEngine } from '../services/proof-of-skill/proof-of-skill.engine';
import { claimExtractor } from '../services/proof-of-skill/claim-extractor.service';
import { atsStore } from '../models/store';
import { ApiError } from '../utils/errors';
import { VerificationState, EvidenceSourceType } from '@ats/shared';

export const getCandidateCapabilities = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const candidateId = req.params.id;
    const isCandidate = req.user?.role === 'candidate';

    // Privacy boundary: Candidate can only access their own profile
    if (isCandidate && req.user?.candidateProfileId !== candidateId) {
      throw ApiError.forbidden('Access denied to candidate capability profile');
    }

    const candidate = await atsStore.getCandidateById(candidateId, isCandidate ? undefined : req.organizationId);
    if (!candidate) throw ApiError.notFound('Candidate not found');

    const claims = await atsStore.getCandidateClaims(candidateId);
    const evidence = await atsStore.getEvidenceItems(candidateId, undefined, isCandidate);

    // If job context provided, evaluate against job capabilities
    const { jobId } = req.query;
    let targetCapabilities = candidate.skills.map((s) => ({
      name: s,
      category: 'languages_frameworks' as any,
    }));

    if (jobId) {
      const jobCapModel = await atsStore.getJobCapabilityModelByJobId(jobId as string, isCandidate ? undefined : req.organizationId);
      if (jobCapModel) {
        targetCapabilities = jobCapModel.capabilities.map((c) => ({
          name: c.name,
          category: c.category,
        }));
      }
    }

    const evaluation = proofOfSkillEngine.evaluateCandidate(
      candidateId,
      targetCapabilities,
      evidence,
      claims,
      jobId as string
    );

    // Save evaluated capabilities
    for (const cap of evaluation.capabilities) {
      await atsStore.saveCandidateCapability({
        ...cap,
        organizationId: req.organizationId || candidate.organizationId,
      });
    }

    res.json({ success: true, data: evaluation });
  } catch (err) {
    next(err);
  }
};

export const extractClaims = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const candidateId = req.params.id;
    const candidate = await atsStore.getCandidateById(candidateId, req.organizationId);
    if (!candidate) throw ApiError.notFound('Candidate not found');

    const { claims, initialEvidence } = claimExtractor.extractClaimsFromCandidate(candidate, req.organizationId);

    await atsStore.saveCandidateClaims(claims);
    for (const item of initialEvidence) {
      await atsStore.addEvidenceItem(item);
    }

    res.status(201).json({
      success: true,
      data: {
        claimsCount: claims.length,
        evidenceCount: initialEvidence.length,
        claims,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const addEvidence = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const candidateId = req.params.id;
    const orgId = req.organizationId;

    const {
      capabilityName,
      sourceType,
      title,
      summary,
      rawContent,
      sourceUrl,
      sourceScore,
      state,
      reliabilityWeight,
      isPrivateRecruiterNote,
      stageRecorded,
    } = req.body;

    if (!capabilityName || !sourceType || !title || !summary) {
      throw ApiError.badRequest('Capability name, source type, title, and summary are required');
    }

    const item = await atsStore.addEvidenceItem({
      id: uuidv4(),
      candidateId,
      organizationId: orgId,
      capabilityName,
      sourceType: sourceType as EvidenceSourceType,
      title,
      summary,
      rawContent,
      sourceUrl,
      sourceScore: sourceScore ? Number(sourceScore) : undefined,
      state: state || 'supports',
      reliabilityWeight: reliabilityWeight ? Number(reliabilityWeight) : 0.7,
      isPrivateRecruiterNote: !!isPrivateRecruiterNote,
      authorName: req.user ? `${req.user.email} (${req.user.role})` : 'System',
      stageRecorded: stageRecorded || 'interview',
      createdAt: new Date().toISOString(),
    });

    await atsStore.logAuditEvent({
      userId: req.user?.userId,
      organizationId: orgId,
      action: 'evidence.add',
      resource: 'evidence',
      resourceId: item.id,
      status: 'success',
      metadata: { candidateId, capabilityName, sourceType, state },
    });

    res.status(201).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
};

export const overrideCapabilityVerification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const candidateId = req.params.id;
    const orgId = req.organizationId;

    const { capabilityName, verificationState, overrideReason } = req.body;

    if (!capabilityName || !verificationState || !overrideReason) {
      throw ApiError.badRequest('Capability name, verificationState, and overrideReason are mandatory');
    }

    const updated = await atsStore.overrideCandidateCapability(
      candidateId,
      capabilityName,
      verificationState as VerificationState,
      overrideReason,
      req.user ? `${req.user.email}` : 'Recruiter',
      orgId
    );

    await atsStore.logAuditEvent({
      userId: req.user?.userId,
      organizationId: orgId,
      action: 'capability.manual_override',
      resource: 'candidate_capability',
      resourceId: updated?.id,
      status: 'success',
      metadata: { candidateId, capabilityName, verificationState, overrideReason },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

export const getEvidenceTimeline = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const candidateId = req.params.id;
    const events = await atsStore.getEvidenceEvents(candidateId);
    res.json({ success: true, data: events });
  } catch (err) {
    next(err);
  }
};

export const requestCandidateEvidence = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const candidateId = req.params.id;
    const orgId = req.organizationId || 'org-1';
    const { jobId, capabilityName, requestType, instructions, dueInDays, urgency } = req.body;

    if (!capabilityName || !requestType || !instructions) {
      throw ApiError.badRequest('Capability name, request type, and instructions are required');
    }

    const event = await atsStore.addEvidenceEvent({
      id: `ev_req_${uuidv4().substring(0, 8)}`,
      candidateId,
      organizationId: orgId,
      capabilityName,
      eventType: 'evidence_requested',
      title: `Evidence Requested: ${requestType.replace(/_/g, ' ').toUpperCase()}`,
      description: instructions,
      actorName: req.user ? `${req.user.email}` : 'Recruiter',
      actorRole: 'recruiter',
      stageName: 'Assessment',
      state: 'inconclusive',
      reliabilityWeight: 0.8,
      details: {
        jobId,
        requestType,
        dueInDays: dueInDays || 5,
        urgency: urgency || 'normal',
        requestedAt: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    });

    await atsStore.logAuditEvent({
      userId: req.user?.userId,
      organizationId: orgId,
      action: 'evidence.request_sent',
      resource: 'candidate_evidence_request',
      resourceId: event.id,
      status: 'success',
      metadata: { candidateId, jobId, capabilityName, requestType },
    });

    res.status(201).json({ success: true, data: event });
  } catch (err) {
    next(err);
  }
};

