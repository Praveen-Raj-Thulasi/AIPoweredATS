import { Request, Response, NextFunction } from 'express';
import { atsStore } from '../models/store';
import { ApiError } from '../utils/errors';

export const organizationController = {
  async getCurrentOrganization(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.organizationId;
      if (!orgId) throw ApiError.badRequest('No organization context available');

      const organization = await atsStore.findOrganizationById(orgId);
      if (!organization) throw ApiError.notFound('Organization not found');

      res.json({ success: true, data: organization });
    } catch (err) {
      next(err);
    }
  },

  async updateCurrentOrganization(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.organizationId;
      if (!orgId) throw ApiError.badRequest('No organization context available');

      const { name, domain, logoUrl, settings } = req.body;
      const organization = await atsStore.findOrganizationById(orgId);
      if (!organization) throw ApiError.notFound('Organization not found');

      const updated = {
        ...organization,
        name: name ?? organization.name,
        domain: domain ?? organization.domain,
        logoUrl: logoUrl ?? organization.logoUrl,
        settings: settings ? { ...organization.settings, ...settings } : organization.settings,
        updatedAt: new Date().toISOString(),
      };

      await atsStore.createOrganization(updated); // Update in store

      await atsStore.logAuditEvent({
        userId: req.user?.userId,
        userEmail: req.user?.email,
        organizationId: orgId,
        action: 'organization.update',
        resource: 'organization',
        resourceId: orgId,
        status: 'success',
      });

      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  },
};
