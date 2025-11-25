import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as sharp from 'sharp';

export interface StorageProvider {
  upload(
    file: Buffer,
    filename: string,
    mimetype: string,
  ): Promise<{ url: string; path: string }>;
  delete(filePath: string): Promise<void>;
  getUrl(filename: string): string;
}

@Injectable()
export class LocalStorageProvider implements StorageProvider {
  private readonly uploadDir: string;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.uploadDir = path.join(process.cwd(), 'storage', 'uploads');
    this.baseUrl =
      configService.get('CONTENT_SERVICE_BASE_URL') ||
      'http://localhost:3004';

    // Ensure upload directory exists
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async upload(
    file: Buffer,
    filename: string,
    mimetype: string,
  ): Promise<{ url: string; path: string }> {
    const filePath = path.join(this.uploadDir, filename);
    fs.writeFileSync(filePath, file);

    return {
      url: `${this.baseUrl}/files/${filename}`,
      path: filePath,
    };
  }

  async delete(filePath: string): Promise<void> {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  getUrl(filename: string): string {
    return `${this.baseUrl}/files/${filename}`;
  }
}

// S3 Storage Provider (requires AWS SDK)
// Uncomment and configure when AWS SDK is available
/*
import { S3 } from 'aws-sdk';

@Injectable()
export class S3StorageProvider implements StorageProvider {
  private readonly s3: S3;
  private readonly bucket: string;
  private readonly region: string;

  constructor(private readonly configService: ConfigService) {
    this.bucket = configService.get('AWS_S3_BUCKET') || '';
    this.region = configService.get('AWS_REGION') || 'us-east-1';

    this.s3 = new S3({
      region: this.region,
      accessKeyId: configService.get('AWS_ACCESS_KEY_ID'),
      secretAccessKey: configService.get('AWS_SECRET_ACCESS_KEY'),
    });
  }

  async upload(
    file: Buffer,
    filename: string,
    mimetype: string,
  ): Promise<{ url: string; path: string }> {
    const params = {
      Bucket: this.bucket,
      Key: filename,
      Body: file,
      ContentType: mimetype,
      ACL: 'public-read',
    };

    const result = await this.s3.upload(params).promise();

    return {
      url: result.Location,
      path: result.Key,
    };
  }

  async delete(key: string): Promise<void> {
    await this.s3
      .deleteObject({
        Bucket: this.bucket,
        Key: key,
      })
      .promise();
  }

  getUrl(filename: string): string {
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${filename}`;
  }
}
*/

@Injectable()
export class StorageService {
  private provider: StorageProvider;

  constructor(
    private readonly configService: ConfigService,
    private readonly localProvider: LocalStorageProvider,
  ) {
    const storageType = configService.get('STORAGE_TYPE', 'local');

    switch (storageType) {
      case 's3':
        // this.provider = new S3StorageProvider(configService);
        // For now, fall back to local
        this.provider = localProvider;
        break;
      case 'local':
      default:
        this.provider = localProvider;
        break;
    }
  }

  async uploadFile(
    file: Buffer,
    filename: string,
    mimetype: string,
  ): Promise<{ url: string; path: string }> {
    return this.provider.upload(file, filename, mimetype);
  }

  async deleteFile(filePath: string): Promise<void> {
    return this.provider.delete(filePath);
  }

  getFileUrl(filename: string): string {
    return this.provider.getUrl(filename);
  }

  // Generate thumbnail for images
  async generateThumbnail(
    file: Buffer,
    filename: string,
    width = 300,
    height = 300,
  ): Promise<{ url: string; path: string } | null> {
    try {
      const thumbnailBuffer = await sharp(file)
        .resize(width, height, {
          fit: 'cover',
          position: 'center',
        })
        .jpeg({ quality: 80 })
        .toBuffer();

      const ext = path.extname(filename);
      const baseName = path.basename(filename, ext);
      const thumbnailFilename = `${baseName}_thumb.jpg`;

      return this.uploadFile(
        thumbnailBuffer,
        thumbnailFilename,
        'image/jpeg',
      );
    } catch (error) {
      console.error('Failed to generate thumbnail:', error);
      return null;
    }
  }

  // Validate file type
  isImageFile(mimetype: string): boolean {
    return mimetype.startsWith('image/');
  }

  isVideoFile(mimetype: string): boolean {
    return mimetype.startsWith('video/');
  }

  isDocumentFile(mimetype: string): boolean {
    const documentTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
    ];
    return documentTypes.includes(mimetype);
  }

  getAllowedMimeTypes(): string[] {
    return [
      // Images
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      // Videos
      'video/mp4',
      'video/webm',
      'video/ogg',
      // Documents
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
      'application/json',
    ];
  }

  validateFileType(mimetype: string): boolean {
    return this.getAllowedMimeTypes().includes(mimetype);
  }

  validateFileSize(size: number, maxSize = 10 * 1024 * 1024): boolean {
    // Default 10MB
    return size <= maxSize;
  }
}
