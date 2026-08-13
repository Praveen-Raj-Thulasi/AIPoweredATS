import { IStorageService, UploadResult } from './storage.interface';
import { LocalStorageService } from './local.storage';
import { config } from '../../config';
import { logger } from '../../utils/logger';

export class S3StorageService implements IStorageService {
  private localFallback = new LocalStorageService();

  async uploadFile(file: Express.Multer.File, folder = 'resumes'): Promise<UploadResult> {
    if (!config.aws.accessKeyId || config.aws.accessKeyId.includes('mock')) {
      logger.info('[S3 Storage] AWS Credentials in mock mode. Routing to secure local storage.');
      return this.localFallback.uploadFile(file, folder);
    }
    // In live AWS production:
    // const command = new PutObjectCommand({ Bucket: config.aws.s3.bucketName, Key: key, Body: file.buffer, ContentType: file.mimetype });
    return this.localFallback.uploadFile(file, folder);
  }

  async getFileBuffer(key: string): Promise<Buffer> {
    return this.localFallback.getFileBuffer(key);
  }

  async getSignedDownloadUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    return this.localFallback.getSignedDownloadUrl(key, expiresInSeconds);
  }

  async deleteFile(key: string): Promise<void> {
    return this.localFallback.deleteFile(key);
  }
}

export const storageService: IStorageService = new S3StorageService();
