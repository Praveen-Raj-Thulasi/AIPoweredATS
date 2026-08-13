import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { atsStore } from '../models/store';
import {
  hashPassword,
  comparePassword,
  validatePasswordStrength,
  generateTokens,
  verifyRefreshToken,
} from '../utils/security';
import { ApiError } from '../utils/errors';
import { tokenBlacklistService } from '../services/security/token-blacklist.service';
import { config } from '../config';
import { logger } from '../utils/logger';

// Zod Validation Schemas
export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    role: z.enum(['candidate', 'recruiter']).default('candidate'),
    // If recruiter:
    organizationName: z.string().optional(),
    organizationSlug: z.string().optional(),
    // If candidate:
    phone: z.string().optional(),
    headline: z.string().optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().optional(),
  }),
});

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, firstName, lastName, role, organizationName, organizationSlug, phone, headline } = req.body;

      // 1. Password strength check
      const passwordValidation = validatePasswordStrength(password);
      if (!passwordValidation.isValid) {
        throw ApiError.badRequest(passwordValidation.message!);
      }

      // 2. Email uniqueness check
      const existingUser = await atsStore.findUserByEmail(email);
      if (existingUser) {
        throw ApiError.conflict('An account with this email address already exists');
      }

      // 3. Hash password
      const passwordHash = await hashPassword(password);

      let organizationId: string | undefined;
      let organization = null;
      let candidateProfileId: string | undefined;

      // 4. Handle Recruiter Organization creation
      if (role === 'recruiter') {
        const orgName = organizationName || `${firstName}'s Company`;
        const baseSlug = organizationSlug || orgName.toLowerCase().replace(/[^a-z0-9]/g, '-');
        let finalSlug = baseSlug;

        // Check slug collision
        let existingOrg = await atsStore.findOrganizationBySlug(finalSlug);
        if (existingOrg) {
          finalSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;
        }

        organization = await atsStore.createOrganization({
          name: orgName,
          slug: finalSlug,
          plan: 'growth',
          status: 'active',
          createdBy: 'temp_id',
          settings: {
            enableAiScreening: true,
            defaultCurrency: 'USD',
            autoReplyEmail: true,
          },
        });
        organizationId = organization.id;
      }

      // 5. Handle Candidate profile creation
      if (role === 'candidate') {
        const candidate = await atsStore.createCandidate({
          firstName,
          lastName,
          email,
          phone,
          headline: headline || 'Software Engineering Professional',
          skills: ['JavaScript', 'TypeScript'],
          experience: [],
          education: [],
          status: 'active',
          tags: [],
          comments: [],
        });
        candidateProfileId = candidate.id;
      }

      // 6. Create User record
      const user = await atsStore.createUser({
        email,
        passwordHash,
        firstName,
        lastName,
        role: role as any,
        organizationId,
        candidateProfileId,
        status: 'active',
        lastLoginAt: new Date().toISOString(),
      });

      // Link creator to organization if recruiter
      if (organization) {
        organization.createdBy = user.id;
      }
      if (candidateProfileId) {
        await atsStore.createCandidate({
          id: candidateProfileId,
          userId: user.id,
          firstName,
          lastName,
          email,
          skills: [],
          experience: [],
          education: [],
          status: 'active',
          tags: [],
          comments: [],
        } as any);
      }

      // 7. Generate Tokens
      const tokens = generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        candidateProfileId: user.candidateProfileId,
        status: user.status,
      });

      // 8. Audit Log Event
      await atsStore.logAuditEvent({
        userId: user.id,
        userEmail: user.email,
        organizationId: user.organizationId,
        action: 'auth.register',
        resource: 'user',
        resourceId: user.id,
        status: 'success',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: { role: user.role, organizationId: user.organizationId },
      });

      // 9. Set HTTP-only Cookie for refresh token
      res.cookie(config.jwt.cookieName, tokens.refreshToken, {
        httpOnly: true,
        secure: config.nodeEnv === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.cookie('verity_access_token', tokens.accessToken, {
        httpOnly: true,
        secure: config.nodeEnv === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000,
      });

      logger.info(`User registered: ${user.email} [Role: ${user.role}]`);

      const { passwordHash: _, ...safeUser } = user;
      res.status(201).json({
        success: true,
        data: {
          user: safeUser,
          organization,
          tokens,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      // 1. Find user by email
      const user = await atsStore.findUserByEmail(email);
      if (!user) {
        // Audit log failed attempt
        await atsStore.logAuditEvent({
          userEmail: email,
          action: 'auth.login_failed',
          resource: 'user',
          status: 'failure',
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          metadata: { reason: 'User not found' },
        });
        throw ApiError.unauthorized('Invalid email address or password');
      }

      // 2. Check password
      const isMatch = await comparePassword(password, user.passwordHash);
      if (!isMatch) {
        await atsStore.logAuditEvent({
          userId: user.id,
          userEmail: user.email,
          organizationId: user.organizationId,
          action: 'auth.login_failed',
          resource: 'user',
          resourceId: user.id,
          status: 'failure',
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          metadata: { reason: 'Incorrect password' },
        });
        throw ApiError.unauthorized('Invalid email address or password');
      }

      // 3. Check account status
      if (user.status !== 'active') {
        await atsStore.logAuditEvent({
          userId: user.id,
          userEmail: user.email,
          action: 'auth.login_blocked',
          resource: 'user',
          resourceId: user.id,
          status: 'failure',
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          metadata: { status: user.status },
        });
        throw new ApiError(403, `Account cannot sign in: status is '${user.status}'`);
      }

      // 4. Update last login
      await atsStore.updateUser(user.id, { lastLoginAt: new Date().toISOString() });

      // 5. Generate tokens
      const tokens = generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        candidateProfileId: user.candidateProfileId,
        status: user.status,
      });

      // 6. Fetch organization if applicable
      let organization = null;
      if (user.organizationId) {
        organization = await atsStore.findOrganizationById(user.organizationId);
      }

      // 7. Audit Log Event
      await atsStore.logAuditEvent({
        userId: user.id,
        userEmail: user.email,
        organizationId: user.organizationId,
        action: 'auth.login_success',
        resource: 'user',
        resourceId: user.id,
        status: 'success',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      // 8. Set secure cookies
      res.cookie(config.jwt.cookieName, tokens.refreshToken, {
        httpOnly: true,
        secure: config.nodeEnv === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.cookie('verity_access_token', tokens.accessToken, {
        httpOnly: true,
        secure: config.nodeEnv === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000,
      });

      logger.info(`User logged in: ${user.email} [Role: ${user.role}]`);

      const { passwordHash: _, ...safeUser } = user;
      res.json({
        success: true,
        data: {
          user: safeUser,
          organization,
          tokens,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw ApiError.unauthorized();
      }

      const user = await atsStore.findUserById(req.user.userId);
      if (!user) {
        throw ApiError.notFound('User not found');
      }

      let organization = null;
      if (user.organizationId) {
        organization = await atsStore.findOrganizationById(user.organizationId);
      }

      const { passwordHash: _, ...safeUser } = user;
      res.json({
        success: true,
        data: {
          user: safeUser,
          organization,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.body.refreshToken || (req.cookies && req.cookies[config.jwt.cookieName]);
      if (!token) {
        throw ApiError.unauthorized('Refresh token is required');
      }

      // Check if refresh token is blacklisted
      const isRevoked = await tokenBlacklistService.isTokenBlacklisted(token);
      if (isRevoked) {
        throw ApiError.unauthorized('Refresh token has been revoked or reused. Please log in again.');
      }

      let payload;
      try {
        payload = verifyRefreshToken(token);
      } catch {
        throw ApiError.unauthorized('Invalid or expired refresh token');
      }

      const user = await atsStore.findUserById(payload.userId);
      if (!user || user.status !== 'active') {
        throw ApiError.unauthorized('User not found or deactivated');
      }

      // Token Rotation: Invalidate the used refresh token
      await tokenBlacklistService.blacklistToken(token, 7 * 24 * 3600);

      const newTokens = generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        candidateProfileId: user.candidateProfileId,
        status: user.status,
      });

      res.cookie(config.jwt.cookieName, newTokens.refreshToken, {
        httpOnly: true,
        secure: config.nodeEnv === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.cookie('verity_access_token', newTokens.accessToken, {
        httpOnly: true,
        secure: config.nodeEnv === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000,
      });

      res.json({
        success: true,
        data: {
          tokens: newTokens,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      // Invalidate current access token
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const accessToken = authHeader.substring(7);
        await tokenBlacklistService.blacklistToken(accessToken, 15 * 60);
      } else if (req.cookies && req.cookies.verity_access_token) {
        await tokenBlacklistService.blacklistToken(req.cookies.verity_access_token, 15 * 60);
      }

      // Invalidate refresh token
      const refreshToken = req.body.refreshToken || (req.cookies && req.cookies[config.jwt.cookieName]);
      if (refreshToken) {
        await tokenBlacklistService.blacklistToken(refreshToken, 7 * 24 * 3600);
      }

      if (req.user) {
        await atsStore.logAuditEvent({
          userId: req.user.userId,
          userEmail: req.user.email,
          organizationId: req.user.organizationId,
          action: 'auth.logout',
          resource: 'user',
          resourceId: req.user.userId,
          status: 'success',
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        });
      }

      res.clearCookie(config.jwt.cookieName);
      res.clearCookie('verity_access_token');

      res.json({
        success: true,
        data: { message: 'Logged out successfully' },
      });
    } catch (error) {
      next(error);
    }
  },
};
