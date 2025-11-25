import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { File } from './entities/file.entity';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class FilesService {
  private readonly uploadDir = path.join(process.cwd(), 'storage', 'uploads');

  constructor(
    @InjectRepository(File)
    private readonly fileRepository: Repository<File>,
  ) {
    // Ensure upload directory exists
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async saveFile(
    file: any,
    workspace_id?: string,
    uploaded_by?: string,
  ): Promise<File> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Generate unique filename
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `${timestamp}-${Math.random().toString(36).substring(7)}${ext}`;
    const filePath = path.join(this.uploadDir, filename);

    // Save file to disk
    fs.writeFileSync(filePath, file.buffer);

    // Generate URL (in production, this would be a CDN or storage URL)
    const baseUrl = process.env.CONTENT_SERVICE_BASE_URL || 'http://localhost:3004';
    const url = `${baseUrl}/files/${filename}`;

    // Save file metadata to database
    const fileEntity = this.fileRepository.create({
      filename,
      original_name: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: filePath,
      url,
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
