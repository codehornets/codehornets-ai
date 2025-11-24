import { Injectable } from '@nestjs/common';
import {
  Content,
  IContentRepository,
  ContentFilters,
  ContentType,
  ContentStatus,
  UniqueId,
} from '@funnelagents/domain';
import { PaginationParams, PaginatedResult } from '@funnelagents/domain';

@Injectable()
export class ContentService {
  constructor(private readonly contentRepository: IContentRepository) {}

  async findById(id: string): Promise<Content | null> {
    return this.contentRepository.findById(id);
  }

  async findAll(params?: PaginationParams): Promise<PaginatedResult<Content>> {
    return this.contentRepository.findAll(params);
  }

  async findWithFilters(
    filters: ContentFilters,
    params?: PaginationParams
  ): Promise<PaginatedResult<Content>> {
    return this.contentRepository.findWithFilters(filters, params);
  }

  async create(data: {
    title: string;
    body: string;
    type: ContentType;
    clientId?: string;
    campaignId?: string;
    metadata?: {
      seoTitle?: string;
      seoDescription?: string;
      keywords?: string[];
    };
    tags?: string[];
  }): Promise<Content> {
    const content = Content.create({
      title: data.title,
      body: data.body,
      type: data.type,
      clientId: data.clientId ? UniqueId.fromString(data.clientId) : undefined,
      campaignId: data.campaignId ? UniqueId.fromString(data.campaignId) : undefined,
      metadata: data.metadata,
      tags: data.tags,
    });

    return this.contentRepository.save(content);
  }

  async update(id: string, title: string, body: string, notes?: string): Promise<Content> {
    const content = await this.contentRepository.findById(id);
    if (!content) {
      throw new Error(`Content with id ${id} not found`);
    }

    content.update(title, body, notes);
    return this.contentRepository.save(content);
  }

  async submitForReview(id: string): Promise<Content> {
    const content = await this.contentRepository.findById(id);
    if (!content) {
      throw new Error(`Content with id ${id} not found`);
    }

    content.submitForReview();
    return this.contentRepository.save(content);
  }

  async approve(id: string): Promise<Content> {
    const content = await this.contentRepository.findById(id);
    if (!content) {
      throw new Error(`Content with id ${id} not found`);
    }

    content.approve();
    return this.contentRepository.save(content);
  }

  async publish(id: string): Promise<Content> {
    const content = await this.contentRepository.findById(id);
    if (!content) {
      throw new Error(`Content with id ${id} not found`);
    }

    content.publish();
    return this.contentRepository.save(content);
  }

  async archive(id: string): Promise<Content> {
    const content = await this.contentRepository.findById(id);
    if (!content) {
      throw new Error(`Content with id ${id} not found`);
    }

    content.archive();
    return this.contentRepository.save(content);
  }

  async delete(id: string): Promise<void> {
    const exists = await this.contentRepository.exists(id);
    if (!exists) {
      throw new Error(`Content with id ${id} not found`);
    }

    return this.contentRepository.delete(id);
  }
}
