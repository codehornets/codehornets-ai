import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContentVersion } from '../entities/content-version.entity';
import { Content } from '../entities/content.entity';
import * as diff from 'diff';

@Injectable()
export class VersionService {
  constructor(
    @InjectRepository(ContentVersion)
    private readonly versionRepository: Repository<ContentVersion>,
    @InjectRepository(Content)
    private readonly contentRepository: Repository<Content>,
  ) {}

  async createVersion(
    contentId: string,
    changeSummary?: string,
    changedBy?: string,
  ): Promise<ContentVersion> {
    const content = await this.contentRepository.findOne({
      where: { id: contentId },
    });

    if (!content) {
      throw new NotFoundException(`Content with ID ${contentId} not found`);
    }

    // Get the latest version number
    const latestVersion = await this.versionRepository
      .createQueryBuilder('version')
      .where('version.content_id = :contentId', { contentId })
      .orderBy('version.version_number', 'DESC')
      .getOne();

    const versionNumber = latestVersion ? latestVersion.version_number + 1 : 1;

    const version = this.versionRepository.create({
      content_id: contentId,
      version_number: versionNumber,
      title: content.title,
      description: content.description,
      body: content.body,
      metadata: content.metadata,
      file_url: content.file_url,
      thumbnail_url: content.thumbnail_url,
      change_summary: changeSummary,
      changed_by: changedBy,
    });

    return this.versionRepository.save(version);
  }

  async getVersionHistory(contentId: string): Promise<ContentVersion[]> {
    return this.versionRepository.find({
      where: { content_id: contentId },
      order: { version_number: 'DESC' },
    });
  }

  async getVersion(versionId: string): Promise<ContentVersion> {
    const version = await this.versionRepository.findOne({
      where: { id: versionId },
    });

    if (!version) {
      throw new NotFoundException(`Version with ID ${versionId} not found`);
    }

    return version;
  }

  async compareVersions(
    version1Id: string,
    version2Id: string,
  ): Promise<{
    version1: ContentVersion;
    version2: ContentVersion;
    diff: {
      title?: any[];
      description?: any[];
      body?: any[];
    };
  }> {
    const version1 = await this.getVersion(version1Id);
    const version2 = await this.getVersion(version2Id);

    const result: any = {
      version1,
      version2,
      diff: {},
    };

    // Compare title
    if (version1.title !== version2.title) {
      result.diff.title = diff.diffWords(
        version1.title || '',
        version2.title || '',
      );
    }

    // Compare description
    if (version1.description !== version2.description) {
      result.diff.description = diff.diffWords(
        version1.description || '',
        version2.description || '',
      );
    }

    // Compare body
    if (version1.body !== version2.body) {
      result.diff.body = diff.diffWords(
        version1.body || '',
        version2.body || '',
      );
    }

    return result;
  }

  async rollbackToVersion(
    contentId: string,
    versionId: string,
    rollbackReason?: string,
    userId?: string,
  ): Promise<Content> {
    const content = await this.contentRepository.findOne({
      where: { id: contentId },
    });

    if (!content) {
      throw new NotFoundException(`Content with ID ${contentId} not found`);
    }

    const version = await this.getVersion(versionId);

    if (version.content_id !== contentId) {
      throw new NotFoundException(
        `Version ${versionId} does not belong to content ${contentId}`,
      );
    }

    // Create a new version before rollback
    await this.createVersion(
      contentId,
      `Rollback to version ${version.version_number}${rollbackReason ? `: ${rollbackReason}` : ''}`,
      userId,
    );

    // Apply the rollback
    content.title = version.title;
    content.description = version.description;
    content.body = version.body;
    content.metadata = version.metadata;
    content.file_url = version.file_url;
    content.thumbnail_url = version.thumbnail_url;

    return this.contentRepository.save(content);
  }

  async deleteVersion(versionId: string): Promise<void> {
    const version = await this.getVersion(versionId);
    await this.versionRepository.remove(version);
  }
}
