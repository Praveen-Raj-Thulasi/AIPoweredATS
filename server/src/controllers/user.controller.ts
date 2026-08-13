import { Request, Response, NextFunction } from 'express';
import { atsStore } from '../models/store';
import { ApiError } from '../utils/errors';
import { hashPassword, comparePassword, validatePasswordStrength } from '../utils/security';

export const userController = {
  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await atsStore.findUserById(req.user!.userId);
      if (!user) throw ApiError.notFound('User not found');
      const { passwordHash: _, ...safeUser } = user;
      res.json({ success: true, data: safeUser });
    } catch (err) {
      next(err);
    }
  },

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const { firstName, lastName, avatarUrl } = req.body;
      const updated = await atsStore.updateUser(req.user!.userId, {
        firstName,
        lastName,
        avatarUrl,
      });
      if (!updated) throw ApiError.notFound('User not found');
      const { passwordHash: _, ...safeUser } = updated;
      res.json({ success: true, data: safeUser });
    } catch (err) {
      next(err);
    }
  },

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = await atsStore.findUserById(req.user!.userId);
      if (!user) throw ApiError.notFound('User not found');

      const isMatch = await comparePassword(currentPassword, user.passwordHash);
      if (!isMatch) {
        throw ApiError.badRequest('Current password does not match');
      }

      const validation = validatePasswordStrength(newPassword);
      if (!validation.isValid) {
        throw ApiError.badRequest(validation.message!);
      }

      const passwordHash = await hashPassword(newPassword);
      await atsStore.updateUser(user.id, { passwordHash });

      await atsStore.logAuditEvent({
        userId: user.id,
        userEmail: user.email,
        organizationId: user.organizationId,
        action: 'user.password_change',
        resource: 'user',
        resourceId: user.id,
        status: 'success',
      });

      res.json({ success: true, data: { message: 'Password changed successfully' } });
    } catch (err) {
      next(err);
    }
  },

  async listOrganizationMembers(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.organizationId;
      if (!orgId) throw ApiError.badRequest('No organization context available');

      const members = await atsStore.getAllUsers(orgId);
      res.json({ success: true, data: members });
    } catch (err) {
      next(err);
    }
  },
};
