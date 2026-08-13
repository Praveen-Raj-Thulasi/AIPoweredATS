import { Request, Response } from 'express';
import { aiService } from '../services/ai.service';
import { atsStore } from '../models/store';
import { emailService } from '../services/email.service';
import { logger } from '../utils/logger';

export const generateJobDescription = async (req: Request, res: Response) => {
  try {
    const { title, department, experienceLevel, keySkills } = req.body;
    if (!title || !department) {
      return res.status(400).json({ success: false, error: 'Title and department are required' });
    }

    const jd = await aiService.generateJobDescription({
      title,
      department,
      experienceLevel: experienceLevel || 'senior',
      keySkills: Array.isArray(keySkills) ? keySkills : [],
    });

    res.json({ success: true, data: jd });
  } catch (err: any) {
    logger.error('Error in AI JD generator:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

export const semanticTalentSearch = async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ success: false, error: 'Search query is required' });
    }

    const allCandidates = await atsStore.getAllCandidates();
    const rankedResults = await aiService.searchCandidatesSemantically(allCandidates, query);

    res.json({ success: true, data: rankedResults });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const sendCandidateEmail = async (req: Request, res: Response) => {
  try {
    const { to, candidateName, jobTitle, companyName, templateType, customMessage, interviewDetails } = req.body;
    if (!to || !templateType) {
      return res.status(400).json({ success: false, error: 'Recipient email and templateType are required' });
    }

    const record = await emailService.sendCandidateEmail({
      to,
      candidateName: candidateName || 'Candidate',
      jobTitle: jobTitle || 'Position',
      companyName: companyName || 'InnovateCorp Technologies',
      templateType,
      customMessage,
      interviewDetails,
    });

    res.json({ success: true, data: record });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getEmailHistory = async (req: Request, res: Response) => {
  try {
    const history = await emailService.getEmailHistory();
    res.json({ success: true, data: history });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
