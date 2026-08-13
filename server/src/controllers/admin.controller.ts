import { Request, Response, NextFunction } from 'express';
import { atsStore } from '../models/store';
import { ApiError } from '../utils/errors';

export const adminController = {
  async getSystemOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await atsStore.getAllUsers();
      const orgs = await atsStore.getAllOrganizations();
      const jobs = await atsStore.getAllJobs();
      const apps = await atsStore.getApplications();
      const auditLogs = await atsStore.getAuditLogs(undefined, 10);

      res.json({
        success: true,
        data: {
          totalUsers: users.length,
          totalOrganizations: orgs.length,
          totalJobs: jobs.length,
          totalApplications: apps.length,
          usersByRole: {
            admin: users.filter((u) => u.role === 'admin').length,
            recruiter: users.filter((u) => u.role === 'recruiter').length,
            candidate: users.filter((u) => u.role === 'candidate').length,
          },
          recentAuditLogs: auditLogs,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await atsStore.getAllUsers();
      res.json({ success: true, data: users });
    } catch (err) {
      next(err);
    }
  },

  async getAllOrganizations(req: Request, res: Response, next: NextFunction) {
    try {
      const orgs = await atsStore.getAllOrganizations();
      res.json({ success: true, data: orgs });
    } catch (err) {
      next(err);
    }
  },

  async updateUserStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['active', 'pending', 'suspended', 'deactivated'].includes(status)) {
        throw ApiError.badRequest('Invalid account status');
      }

      const updated = await atsStore.updateUser(id, { status });
      if (!updated) throw ApiError.notFound('User not found');

      await atsStore.logAuditEvent({
        userId: req.user?.userId,
        userEmail: req.user?.email,
        action: 'admin.update_user_status',
        resource: 'user',
        resourceId: id,
        status: 'success',
        metadata: { newStatus: status },
      });

      const { passwordHash: _, ...safeUser } = updated;
      res.json({ success: true, data: safeUser });
    } catch (err) {
      next(err);
    }
  },

  async updateUserRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!['admin', 'recruiter', 'candidate'].includes(role)) {
        throw ApiError.badRequest('Invalid user role');
      }

      const updated = await atsStore.updateUser(id, { role });
      if (!updated) throw ApiError.notFound('User not found');

      await atsStore.logAuditEvent({
        userId: req.user?.userId,
        userEmail: req.user?.email,
        action: 'admin.update_user_role',
        resource: 'user',
        resourceId: id,
        status: 'success',
        metadata: { newRole: role },
      });

      const { passwordHash: _, ...safeUser } = updated;
      res.json({ success: true, data: safeUser });
    } catch (err) {
      next(err);
    }
  },

  async getAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.query.organizationId as string | undefined;
      const limit = parseInt(req.query.limit as string || '50', 10);
      const logs = await atsStore.getAuditLogs(orgId, limit);
      res.json({ success: true, data: logs });
    } catch (err) {
      next(err);
    }
  },
};
