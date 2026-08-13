export interface UploadResult {
  fileUrl: string;
  key: string;
  originalName: string;
  mimeType: string;
  size: number;
}

export interface IStorageService {
  uploadFile(file: Express.Multer.File, folder?: string): Promise<UploadResult>;
  getFileBuffer(key: string): Promise<Buffer>;
  getSignedDownloadUrl(key: string, expiresInSeconds?: number): Promise<string>;
  deleteFile(key: string): Promise<void>;
}
