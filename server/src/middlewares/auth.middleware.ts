import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JWTPayload } from '../utils/security';
import { tokenBlacklistService } from '../services/security/token-blacklist.service';
import { atsStore } from '../models/store';
import { ApiError } from '../utils/errors';
import { UserRole } from '@ats/shared';

// Augment Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      organizationId?: string;
    }
  }
}

/**
 * Authentication Middleware
 * Validates JWT access token from Authorization header or cookie and checks blacklist.
 */
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies && req.cookies.verity_access_token) {
      token = req.cookies.verity_access_token;
    }

    if (!token) {
      return next(ApiError.unauthorized('Authentication token is missing'));
    }

    // Check if token has been revoked or logged out
    const isRevoked = await tokenBlacklistService.isTokenBlacklisted(token);
    if (isRevoked) {
      return next(ApiError.unauthorized('Session has been invalidated. Please log in again.'));
    }

    let payload: JWTPayload;
    try {
      payload = verifyAccessToken(token);
    } catch (err: any) {
      return next(ApiError.unauthorized('Invalid or expired authentication token'));
    }

    // Verify user exists and is active in database
    const user = await atsStore.findUserById(payload.userId);
    if (!user) {
      return next(ApiError.unauthorized('User account no longer exists'));
    }

    if (user.status !== 'active') {
      return next(
        new ApiError(403, `Account access denied: status is currently '${user.status}'`)
      );
    }

    // Attach verified user payload
    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      candidateProfileId: user.candidateProfileId,
      status: user.status,
    };

    if (user.organizationId) {
      req.organizationId = user.organizationId;
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Role-Based Authorization Middleware
 * Enforces allowed roles (never trusts client-supplied role values)
 */
export const requireRoles = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(`Access requires one of the following roles: [${allowedRoles.join(', ')}]`)
      );
    }

    next();
  };
};

/**
 * Multi-Tenant Organization Isolation Middleware
 * Ensures recruiters only access data within their assigned organization
 */
export const requireOrganizationIsolation = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(ApiError.unauthorized());
  }

  // Admins can access all organizations or optionally filter by query param
  if (req.user.role === 'admin') {
    const queryOrg = req.query.organizationId as string | undefined;
    if (queryOrg) {
      req.organizationId = queryOrg;
    }
    return next();
  }

  // Recruiters MUST have an organization assigned
  if (req.user.role === 'recruiter') {
    if (!req.user.organizationId) {
      return next(ApiError.forbidden('Recruiter is not associated with any active organization'));
    }
    req.organizationId = req.user.organizationId;
    return next();
  }

  // Candidates do not have an organization scope constraint
  next();
};

/**
 * Candidate Isolation Middleware
 * Ensures candidates can only access their own profile, applications, and passport data.
 */
export const requireCandidateIsolation = (paramKey = 'candidateId') => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }

    // Recruiters and Admins can access candidate records according to their org
    if (req.user.role === 'recruiter' || req.user.role === 'admin') {
      return next();
    }

    // For Candidates: Must match candidateProfileId or userId
    const targetCandidateId = req.params[paramKey];
    if (
      req.user.candidateProfileId &&
      targetCandidateId &&
      req.user.candidateProfileId !== targetCandidateId &&
      req.user.userId !== targetCandidateId
    ) {
      return next(ApiError.forbidden('Access denied: You cannot access or modify another candidate\'s records.'));
    }

    next();
  };
};

