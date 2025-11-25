import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, IsNull } from 'typeorm';
import {
  ContentPublish,
  PublishStatus,
} from '../entities/content-publish.entity';
import { Content } from '../entities/content.entity';
import {
  SchedulePublishDto,
  UpdatePublishStatusDto,
  CancelPublishDto,
} from '../dto/publish.dto';

@Injectable()
export class PublishService {
  constructor(
    @InjectRepository(ContentPublish)
    private readonly publishRepository: Repository<ContentPublish>,
    @InjectRepository(Content)
    private readonly contentRepository: Repository<Content>,
  ) {}

  async schedulePublish(dto: SchedulePublishDto): Promise<ContentPublish> {
    // Verify content exists
    const content = await this.contentRepository.findOne({
      where: { id: dto.content_id },
    });

    if (!content) {
      throw new NotFoundException(`Content with ID ${dto.content_id} not found`);
    }

    // Check if already scheduled for this channel
    const existing = await this.publishRepository.findOne({
      where: {
        content_id: dto.content_id,
        channel: dto.channel,
        status: PublishStatus.SCHEDULED,
      },
    });

    if (existing) {
      throw new BadRequestException(
        `Content is already scheduled for ${dto.channel}`,
      );
    }

    const publish = this.publishRepository.create({
      content_id: dto.content_id,
      channel: dto.channel,
      scheduled_at: dto.scheduled_at ? new Date(dto.scheduled_at) : new Date(),
      channel_content: dto.channel_content,
      channel_metadata: dto.channel_metadata,
      published_by: dto.published_by,
      status: PublishStatus.SCHEDULED,
    });

    return this.publishRepository.save(publish);
  }

  async updatePublishStatus(
    publishId: string,
    dto: UpdatePublishStatusDto,
  ): Promise<ContentPublish> {
    const publish = await this.publishRepository.findOne({
      where: { id: publishId },
    });

    if (!publish) {
      throw new NotFoundException(`Publish with ID ${publishId} not found`);
    }

    publish.status = dto.status;

    if (dto.status === PublishStatus.PUBLISHED) {
      publish.published_at = new Date();
    }

    if (dto.error_message) {
      publish.error_message = dto.error_message;
    }

    if (dto.channel_metadata) {
      publish.channel_metadata = {
        ...publish.channel_metadata,
        ...dto.channel_metadata,
      };
    }

    return this.publishRepository.save(publish);
  }

  async cancelPublish(
    publishId: string,
    dto: CancelPublishDto,
  ): Promise<ContentPublish> {
    const publish = await this.publishRepository.findOne({
      where: { id: publishId },
    });

    if (!publish) {
      throw new NotFoundException(`Publish with ID ${publishId} not found`);
    }

    if (
      publish.status !== PublishStatus.SCHEDULED &&
      publish.status !== PublishStatus.PUBLISHING
    ) {
      throw new BadRequestException(
        `Cannot cancel publish with status ${publish.status}`,
      );
    }

    publish.status = PublishStatus.CANCELLED;
    publish.error_message = dto.cancellation_reason;

    return this.publishRepository.save(publish);
  }

  async getContentPublishes(contentId: string): Promise<ContentPublish[]> {
    return this.publishRepository.find({
      where: { content_id: contentId },
      order: { scheduled_at: 'DESC' },
    });
  }

  async getScheduledPublishes(limit = 100): Promise<ContentPublish[]> {
    return this.publishRepository.find({
      where: {
        status: PublishStatus.SCHEDULED,
        scheduled_at: LessThanOrEqual(new Date()),
      },
      order: { scheduled_at: 'ASC' },
      take: limit,
      relations: ['content'],
    });
  }

  async getUpcomingPublishes(limit = 50): Promise<ContentPublish[]> {
    return this.publishRepository.find({
      where: {
        status: PublishStatus.SCHEDULED,
      },
      order: { scheduled_at: 'ASC' },
      take: limit,
      relations: ['content'],
    });
  }

  async getPublishById(publishId: string): Promise<ContentPublish> {
    const publish = await this.publishRepository.findOne({
      where: { id: publishId },
      relations: ['content'],
    });

    if (!publish) {
      throw new NotFoundException(`Publish with ID ${publishId} not found`);
    }

    return publish;
  }

  async deletePublish(publishId: string): Promise<void> {
    const publish = await this.publishRepository.findOne({
      where: { id: publishId },
    });

    if (!publish) {
      throw new NotFoundException(`Publish with ID ${publishId} not found`);
    }

    await this.publishRepository.remove(publish);
  }

  // Format content for specific channel
  formatContentForChannel(content: Content, channel: string): string {
    // This is a simple implementation - extend with channel-specific formatting
    let formatted = content.body || '';

    switch (channel) {
      case 'twitter':
        // Truncate to 280 characters
        if (formatted.length > 280) {
          formatted = formatted.substring(0, 277) + '...';
        }
        break;
      case 'linkedin':
        // Keep full content, add hashtags
        if (content.metadata?.hashtags) {
          formatted += '\n\n' + content.metadata.hashtags.join(' ');
        }
        break;
      case 'instagram':
        // Add hashtags at the end
        if (content.metadata?.hashtags) {
          formatted += '\n.\n.\n.\n' + content.metadata.hashtags.join(' ');
        }
        break;
      default:
        // Keep as is
        break;
    }

    return formatted;
  }
}
