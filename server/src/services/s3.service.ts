import { s3ProductionService, StoredFileResult } from './storage/s3.production.service';

export interface UploadResult {
  fileUrl: string;
  key: string;
  originalName: string;
  mimeType: string;
  size: number;
}

export class S3Service {
  async uploadFile(file: Express.Multer.File): Promise<UploadResult> {
    const res: StoredFileResult = await s3ProductionService.uploadFile(file, 'resumes');
    return {
      fileUrl: res.fileUrl,
      key: res.key,
      originalName: res.originalName,
      mimeType: res.mimeType,
      size: res.sizeBytes,
    };
  }

  async getFileBuffer(filePathOrUrl: string): Promise<Buffer> {
    return s3ProductionService.getFileBuffer(filePathOrUrl);
  }
}

export const s3Service = new S3Service();

