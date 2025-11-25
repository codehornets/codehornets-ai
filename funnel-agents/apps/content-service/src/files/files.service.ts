import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { File } from './entities/file.entity';
import { StorageService } from './services/storage.service';
import * as path from 'path';

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(File)
    private readonly fileRepository: Repository<File>,
    private readonly storageService: StorageService,
  ) {}

  async saveFile(
    file: any,
    workspace_id?: string,
    uploaded_by?: string,
  ): Promise<File> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file type
    if (!this.storageService.validateFileType(file.mimetype)) {
      throw new BadRequestException(
        `File type ${file.mimetype} is not allowed`,
      );
    }

    // Validate file size (10MB default)
    const maxSize = 10 * 1024 * 1024;
    if (!this.storageService.validateFileSize(file.size, maxSize)) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`,
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const sanitizedName = file.originalname
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase();
    const filename = `${timestamp}-${Math.random().toString(36).substring(7)}-${sanitizedName}${ext}`;

    // Upload file
    const { url, path: filePath } = await this.storageService.uploadFile(
      file.buffer,
      filename,
      file.mimetype,
    );

    // Generate thumbnail for images
    let thumbnailUrl: string | undefined;
    if (this.storageService.isImageFile(file.mimetype)) {
      const thumbnail = await this.storageService.generateThumbnail(
        file.buffer,
        filename,
      );
      if (thumbnail) {
        thumbnailUrl = thumbnail.url;
      }
    }

    // Save file metadata to database
    const fileEntity = this.fileRepository.create({
      filename,
      original_name: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: filePath,
      url,
      thumbnail_url: thumbnailUrl,
      workspace_id,
      uploaded_by,
    });

    return this.fileRepository.save(fileEntity);
  }

  async findOne(id: string): Promise<File | null> {
    return this.fileRepository.findOne({ where: { id } });
  }

  async findByFilename(filename: string): Promise<File | null> {
    return this.fileRepository.findOne({ where: { filename } });
  }

  getFilePath(filename: string): string {
    return path.join(this.uploadDir, filename);
  }

  async delete(id: string): Promise<void> {
    const file = await this.findOne(id);
    if (file && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    await this.fileRepository.delete(id);
  }
}
