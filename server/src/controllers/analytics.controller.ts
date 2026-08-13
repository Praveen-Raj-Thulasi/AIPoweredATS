import { Request, Response } from 'express';
import { atsStore } from '../models/store';
import { AnalyticsFilterParams } from '@ats/shared';

export const getDashboardAnalytics = async (req: Request, res: Response) => {
  try {
    const metrics = await atsStore.getDashboardMetrics(req.organizationId);
    res.json({ success: true, data: metrics });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getRecruitmentIntelligence = async (req: Request, res: Response) => {
  try {
    const { timeRange, startDate, endDate, jobId, recruiterId, department } = req.query;

    const filters: AnalyticsFilterParams = {
      timeRange: (timeRange as any) || '30d',
      startDate: startDate as string,
      endDate: endDate as string,
      jobId: jobId as string,
      recruiterId: recruiterId as string,
      department: department as string,
    };

    const metrics = await atsStore.getRecruitmentIntelligence(req.organizationId, filters);
    res.json({ success: true, data: metrics });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

