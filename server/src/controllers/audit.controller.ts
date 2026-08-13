import { Request, Response, NextFunction } from 'express';
import { atsStore } from '../models/store';
import { ApiError } from '../utils/errors';

export const auditController = {
  /**
   * Retrieves paginated audit logs with multi-attribute filtering.
   */
  async getAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const { action, userId, organizationId, resource, status, limit } = req.query;

      const orgId = req.user?.role === 'admin' && organizationId ? (organizationId as string) : req.organizationId;
      const parsedLimit = Math.min(parseInt(limit as string || '100', 10), 500);

      const allLogs = await atsStore.getAuditLogs(orgId, parsedLimit);

      let filtered = allLogs;
      if (action) {
        filtered = filtered.filter((l) => l.action.toLowerCase().includes((action as string).toLowerCase()));
      }
      if (userId) {
        filtered = filtered.filter((l) => l.userId === userId);
      }
      if (resource) {
        filtered = filtered.filter((l) => l.resource === resource);
      }
      if (status) {
        filtered = filtered.filter((l) => l.status === status);
      }

      res.json({
        success: true,
        data: filtered,
        total: filtered.length,
      });
    } catch (error) {
      next(error);
    }
  },
};
