import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { IStorageService, UploadResult } from './storage.interface';
import { config } from '../../config';
import { logger } from '../../utils/logger';

export class LocalStorageService implements IStorageService {
  private uploadDir: string;
  private signingSecret = 'verity_storage_secure_signing_secret_2026';

  constructor() {
    this.uploadDir = config.storage.uploadDir;
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(file: Express.Multer.File, folder = 'resumes'): Promise<UploadResult> {
    const ext = path.extname(file.originalname);
    const filename = `${Date.now()}-${uuidv4()}${ext}`;
    const key = `${folder}/${filename}`;
    const targetFilePath = path.join(this.uploadDir, filename);

    await fs.promises.writeFile(targetFilePath, file.buffer);
    logger.info(`[Storage] Saved document to local disk: ${key}`);

    // Generate secure signed access URL
    const signedUrl = await this.getSignedDownloadUrl(key, 3600);

    return {
      fileUrl: signedUrl,
      key,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };
  }

  async getFileBuffer(key: string): Promise<Buffer> {
    const filename = path.basename(key);
    const localPath = path.join(this.uploadDir, filename);
    if (fs.existsSync(localPath)) {
      return fs.promises.readFile(localPath);
    }
    throw new Error(`Storage error: file ${key} not found.`);
  }

  async getSignedDownloadUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    const filename = path.basename(key);
    const expiresAt = Date.now() + expiresInSeconds * 1000;
    const signature = crypto
      .createHmac('sha256', this.signingSecret)
      .update(`${filename}:${expiresAt}`)
      .digest('hex');

    return `/api/v1/storage/download?key=${encodeURIComponent(key)}&expires=${expiresAt}&sig=${signature}`;
  }

  async deleteFile(key: string): Promise<void> {
    const filename = path.basename(key);
    const localPath = path.join(this.uploadDir, filename);
    if (fs.existsSync(localPath)) {
      await fs.promises.unlink(localPath);
      logger.info(`[Storage] Deleted document: ${key}`);
    }
  }
}
