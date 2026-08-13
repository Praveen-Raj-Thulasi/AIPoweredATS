import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import path from 'path';
import { storageService } from '../services/storage';
import { ApiError } from '../utils/errors';

const SIGNING_SECRET = 'verity_storage_secure_signing_secret_2026';

export const downloadSecureFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { key, expires, sig } = req.query;

    if (!key || !expires || !sig) {
      throw ApiError.badRequest('Invalid secure download link');
    }

    const expiresAt = parseInt(expires as string, 10);
    if (Date.now() > expiresAt) {
      throw ApiError.forbidden('Secure download link has expired');
    }

    const filename = path.basename(key as string);
    const expectedSignature = crypto
      .createHmac('sha256', SIGNING_SECRET)
      .update(`${filename}:${expiresAt}`)
      .digest('hex');

    if (sig !== expectedSignature) {
      throw ApiError.forbidden('Invalid download signature');
    }

    const buffer = await storageService.getFileBuffer(key as string);
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'application/octet-stream';
    if (ext === '.pdf') contentType = 'application/pdf';
    else if (ext === '.docx') contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
};
