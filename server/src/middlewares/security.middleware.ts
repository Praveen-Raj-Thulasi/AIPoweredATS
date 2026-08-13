import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { ApiError } from '../utils/errors';

/**
 * Strips MongoDB/NoSQL operator keys ($ and .) recursively to prevent query injection.
 */
export function sanitizeNoSQL(target: any): any {
  if (target === null || target === undefined) return target;
  if (typeof target !== 'object') return target;

  if (Array.isArray(target)) {
    return target.map((item) => sanitizeNoSQL(item));
  }

  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(target)) {
    if (key.startsWith('$') || key.includes('.')) {
      continue; // Drop dangerous operator keys
    }
    clean[key] = sanitizeNoSQL(value);
  }
  return clean;
}

export const nosqlInjectionGuard = (req: Request, res: Response, next: NextFunction) => {
  if (req.body) req.body = sanitizeNoSQL(req.body);
  if (req.query) req.query = sanitizeNoSQL(req.query);
  if (req.params) req.params = sanitizeNoSQL(req.params);
  next();
};

/**
 * Strips privileged ownership and security fields from request bodies on user updates
 * to prevent IDOR and privilege escalation attacks.
 */
export const ownershipFieldGuard = (req: Request, res: Response, next: NextFunction) => {
  if (req.user && req.body && typeof req.body === 'object' && !req.originalUrl.includes('/auth/register')) {
    // If not admin, strip system-controlled ownership fields
    if (req.user.role !== 'admin') {
      delete req.body.organizationId;
      delete req.body.userId;
      delete req.body.candidateProfileId;
      delete req.body.role;
      delete req.body.status;
      delete req.body.id;
    }
  }
  next();
};

/**
 * Basic XSS string escaping for candidate text submissions.
 */
export const xssSanitizer = (req: Request, res: Response, next: NextFunction) => {
  const sanitizeString = (str: string): string => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  };

  const sanitizeObj = (obj: any): any => {
    if (!obj || typeof obj !== 'object') {
      return typeof obj === 'string' ? sanitizeString(obj) : obj;
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObj);
    }
    const clean: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) {
      clean[k] = sanitizeObj(v);
    }
    return clean;
  };

  // Only sanitize JSON inputs that are not rich code submissions or raw buffers
  if (req.body && !req.originalUrl.includes('/assessments/run-sandbox')) {
    req.body = sanitizeObj(req.body);
  }
  next();
};

/**
 * Tiered Rate Limiters
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // 15 login/register attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Too many authentication attempts. Please try again after 15 minutes.',
      statusCode: 429,
    },
  },
});

export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 40, // 40 AI invocations per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'AI inference rate limit exceeded. Please wait a moment before sending more queries.',
      statusCode: 429,
    },
  },
});

export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 25, // 25 uploads per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'File upload rate limit exceeded. Please try again later.',
      statusCode: 429,
    },
  },
});

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // 300 general requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'API rate limit reached. Please reduce request frequency.',
      statusCode: 429,
    },
  },
});
