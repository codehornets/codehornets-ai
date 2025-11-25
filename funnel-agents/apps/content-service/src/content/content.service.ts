import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Content, ContentStatus } from './entities/content.entity';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { QueryContentDto } from './dto/query-content.dto';
import { VersionService } from './services/version.service';

@Injectable()
export class ContentService {
  // Valid status transitions
  private readonly validTransitions: Record<ContentStatus, ContentStatus[]> = {
    [ContentStatus.BRIEF]: [
      ContentStatus.DRAFT,
      ContentStatus.ARCHIVED,
    ],
    [ContentStatus.DRAFT]: [
      ContentStatus.REVIEW,
      ContentStatus.BRIEF,
      ContentStatus.ARCHIVED,
    ],
    [ContentStatus.REVIEW]: [
      ContentStatus.APPROVED,
      ContentStatus.DRAFT,
      ContentStatus.ARCHIVED,
    ],
    [ContentStatus.APPROVED]: [
      ContentStatus.PUBLISHED,
      ContentStatus.REVIEW,
      ContentStatus.ARCHIVED,
    ],
    [ContentStatus.PUBLISHED]: [
      ContentStatus.ARCHIVED,
    ],
    [ContentStatus.ARCHIVED]: [],
  };

  constructor(
    @InjectRepository(Content)
    private readonly contentRepository: Repository<Content>,
    @Inject(forwardRef(() => VersionService))
    private readonly versionService: VersionService,
  ) {}

  async create(createContentDto: CreateContentDto): Promise<Content> {
    const content = this.contentRepository.create(createContentDto);
    const savedContent = await this.contentRepository.save(content);

    // Create initial version
    await this.versionService.createVersion(
      savedContent.id,
      'Initial version',
      createContentDto.author_id,
    );

    return savedContent;
  }

  async findAll(query: QueryContentDto): Promise<{
    data: Content[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      type,
      status,
      channel,
      workspace_id,
      campaign_id,
      author_id,
      sort_by = 'created_at',
      sort_order = 'DESC',
      page = 1,
      limit = 10,
    } = query;

    const queryBuilder = this.contentRepository.createQueryBuilder('content');

    // Apply filters
    if (type) {
      queryBuilder.andWhere('content.type = :type', { type });
    }
    if (status) {
      queryBuilder.andWhere('content.status = :status', { status });
    }
    if (channel) {
      queryBuilder.andWhere('content.channel = :channel', { channel });
    }
    if (workspace_id) {
      queryBuilder.andWhere('content.workspace_id = :workspace_id', {
        workspace_id,
      });
    }
    if (campaign_id) {
      queryBuilder.andWhere('content.campaign_id = :campaign_id', {
        campaign_id,
      });
    }
    if (author_id) {
      queryBuilder.andWhere('content.author_id = :author_id', { author_id });
    }

    // Apply sorting
    queryBuilder.orderBy(`content.${sort_by}`, sort_order);

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<Content> {
    const content = await this.contentRepository.findOne({ where: { id } });
    if (!content) {
      throw new NotFoundException(`Content with ID ${id} not found`);
    }
    return content;
  }

  async update(id: string, updateContentDto: UpdateContentDto): Promise<Content> {
    const content = await this.findOne(id);
    Object.assign(content, updateContentDto);
    const savedContent = await this.contentRepository.save(content);

    // Create version after update
    await this.versionService.createVersion(id, 'Content updated');

    return savedContent;
  }

  async updateStatus(id: string, updateStatusDto: UpdateStatusDto): Promise<Content> {
    const content = await this.findOne(id);
    const { status: newStatus } = updateStatusDto;

    // Validate status transition
    const allowedTransitions = this.validTransitions[content.status];
    if (!allowedTransitions.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${content.status} to ${newStatus}. Allowed transitions: ${allowedTransitions.join(', ')}`,
      );
    }

    content.status = newStatus;

    // Set published_at when status changes to published
    if (newStatus === ContentStatus.PUBLISHED && !content.published_at) {
      content.published_at = new Date();
    }

    return this.contentRepository.save(content);
  }

  async remove(id: string): Promise<void> {
    const content = await this.findOne(id);
    await this.contentRepository.remove(content);
  }
}
