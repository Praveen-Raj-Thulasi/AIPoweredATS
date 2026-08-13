import { Request, Response, NextFunction } from 'express';
import { atsStore } from '../models/store';
import { storageService } from '../services/storage';
import { resumeParser } from '../services/parser';
import { aiService } from '../services/ai.service';
import { ApiError } from '../utils/errors';
import { claimExtractor } from '../services/proof-of-skill/claim-extractor.service';

export const getCandidates = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, tag, status, page, limit } = req.query;

    const result = await atsStore.getCandidates({
      organizationId: req.organizationId,
      search: search as string,
      tag: tag as string,
      status: status as string,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 20,
    });

    res.json({ success: true, data: result.data, meta: result.meta });
  } catch (err) {
    next(err);
  }
};

export const getCandidateById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const candidate = await atsStore.getCandidateById(req.params.id, req.organizationId);
    if (!candidate) {
      throw ApiError.notFound('Candidate not found or access denied');
    }
    res.json({ success: true, data: candidate });
  } catch (err) {
    next(err);
  }
};

export const uploadResume = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const file = req.file;
    if (!file) {
      throw ApiError.badRequest('No resume file uploaded');
    }

    const { jobId } = req.body;
    let targetJob = null;
    let organizationId = req.organizationId;

    if (jobId) {
      targetJob = await atsStore.getJobById(jobId);
      if (!targetJob) {
        throw ApiError.notFound('Target job not found');
      }
      organizationId = targetJob.organizationId;
    }

    // 1. Upload via Storage Service (Private S3/Local abstraction)
    const uploadResult = await storageService.uploadFile(file, 'resumes');

    // 2. Parse text via Parser Service Abstraction
    const parsedData = await resumeParser.parse(file.buffer, file.mimetype, file.originalname);

    // 3. Create Candidate Profile
    const candidate = await atsStore.createCandidate({
      organizationId,
      userId: req.user?.role === 'candidate' ? req.user.userId : undefined,
      firstName: parsedData.extractedName?.firstName || 'New',
      lastName: parsedData.extractedName?.lastName || 'Applicant',
      email: parsedData.extractedEmail || req.user?.email || `applicant_${Date.now()}@example.com`,
      phone: parsedData.extractedPhone,
      location: 'Remote',
      headline: parsedData.headline,
      summary: parsedData.summary,
      skills: parsedData.extractedSkills.length > 0 ? parsedData.extractedSkills : ['Engineering'],
      experience: parsedData.extractedExperience,
      education: parsedData.extractedEducation,
      status: 'active',
      tags: ['New Applicant'],
      comments: [],
      resumeUrl: uploadResult.fileUrl,
      resumeKey: uploadResult.key,
      resumeFileName: uploadResult.originalName,
      resumeRawText: parsedData.rawText,
      resumeParsingStatus: parsedData.parsingStatus,
      parserMetadata: parsedData.parserMetadata,
    });

    // 3.5. Extract Claims and Initial Evidence from Candidate Profile automatically
    const { claims, initialEvidence } = claimExtractor.extractClaimsFromCandidate(candidate, organizationId);
    await atsStore.saveCandidateClaims(claims);
    for (const item of initialEvidence) {
      await atsStore.addEvidenceItem(item);
    }

    let application = null;

    // 4. If applied to job, create application and run AI screening
    if (targetJob) {
      const aiScoreCard = await aiService.evaluateCandidateFit(targetJob, candidate);

      application = await atsStore.createApplication({
        organizationId: targetJob.organizationId,
        jobId: targetJob.id,
        jobTitle: targetJob.title,
        candidateId: candidate.id,
        stage: 'applied',
        status: 'active',
        aiScoreCard,
        notes: [],
        timeline: [
          {
            id: `tl_${Date.now()}`,
            stage: 'applied',
            title: 'Application Received',
            description: `Resume parsed via ${parsedData.parserMetadata.engine} v${parsedData.parserMetadata.version}`,
            timestamp: new Date().toISOString(),
            actorName: 'Candidate Ingestion System',
          },
          {
            id: `tl_${Date.now() + 1}`,
            stage: 'applied',
            title: 'AI Fit Evaluation Completed',
            description: `Match score: ${aiScoreCard.overallScore}% (${aiScoreCard.recommendation.toUpperCase()})`,
            timestamp: new Date().toISOString(),
            actorName: 'AI Engine',
          },
        ],
      });
    }

    res.status(201).json({
      success: true,
      data: {
        candidate,
        application,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const addComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { content } = req.body;
    if (!content) throw ApiError.badRequest('Comment content is required');

    const updated = await atsStore.addCandidateComment(
      req.params.id,
      {
        authorId: req.user!.userId,
        authorName: `${req.user!.email}`,
        authorRole: req.user!.role,
        content,
      },
      req.organizationId
    );

    if (!updated) throw ApiError.notFound('Candidate not found');
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

export const updateTags = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tags } = req.body;
    if (!Array.isArray(tags)) throw ApiError.badRequest('Tags must be an array of strings');

    const updated = await atsStore.updateCandidateTags(req.params.id, tags, req.organizationId);
    if (!updated) throw ApiError.notFound('Candidate not found');
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};
