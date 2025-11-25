import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PaginationParams, PaginatedResult } from '@funnelagents/domain';
import { CampaignChannelRepository } from '../repositories/campaign-channel.repository';
import { CampaignChannelEntity, ChannelStatus } from '../entities/campaign-channel.entity';
import {
  CreateCampaignChannelDto,
  UpdateCampaignChannelDto,
} from '../dto/campaign-channel.dto';

@Injectable()
export class CampaignChannelsService {
  private readonly logger = new Logger(CampaignChannelsService.name);

  constructor(
    private readonly channelRepository: CampaignChannelRepository,
  ) {}

  async findAll(
    filters?: any,
    params?: PaginationParams,
  ): Promise<PaginatedResult<CampaignChannelEntity>> {
    if (filters && Object.keys(filters).length > 0) {
      return this.channelRepository.findWithFilters(filters, params);
    }
    return this.channelRepository.findAll(params);
  }

  async findById(id: string): Promise<CampaignChannelEntity> {
    const channel = await this.channelRepository.findById(id);
    if (!channel) {
      throw new NotFoundException(`Campaign channel with ID ${id} not found`);
    }
    return channel;
  }

  async findByCampaignId(campaignId: string): Promise<CampaignChannelEntity[]> {
    return this.channelRepository.findByCampaignId(campaignId);
  }

  async create(data: CreateCampaignChannelDto): Promise<CampaignChannelEntity> {
    const channel: any = {
      campaign_id: data.campaign_id,
      channel_type: data.channel_type,
      description: data.description,
      configuration: data.configuration,
      scheduled_at: data.scheduled_at ? new Date(data.scheduled_at) : undefined,
      status: ChannelStatus.DRAFT,
      send_count: 0,
      success_count: 0,
      failure_count: 0,
    };

    return this.channelRepository.save(channel);
  }

  async update(
    id: string,
    data: UpdateCampaignChannelDto,
  ): Promise<CampaignChannelEntity> {
    const channel = await this.findById(id);

    if (data.channel_type !== undefined) channel.channel_type = data.channel_type;
    if (data.description !== undefined) channel.description = data.description;
    if (data.status !== undefined) channel.status = data.status;
    if (data.configuration !== undefined) {
      channel.configuration = { ...channel.configuration, ...data.configuration };
    }
    if (data.scheduled_at !== undefined) {
      channel.scheduled_at = new Date(data.scheduled_at);
    }

    // Track status transitions
    if (data.status === ChannelStatus.ACTIVE && !channel.started_at) {
      channel.started_at = new Date();
    }
    if (data.status === ChannelStatus.COMPLETED && !channel.completed_at) {
      channel.completed_at = new Date();
    }

    return this.channelRepository.save(channel);
  }

  async delete(id: string): Promise<void> {
    const channel = await this.findById(id);
    await this.channelRepository.delete(channel.id);
  }

  async activateChannel(id: string): Promise<CampaignChannelEntity> {
    this.logger.log(`Activating channel ${id}`);
    return this.update(id, { status: ChannelStatus.ACTIVE });
  }

  async pauseChannel(id: string): Promise<CampaignChannelEntity> {
    this.logger.log(`Pausing channel ${id}`);
    return this.update(id, { status: ChannelStatus.PAUSED });
  }

  async completeChannel(id: string): Promise<CampaignChannelEntity> {
    this.logger.log(`Completing channel ${id}`);
    return this.update(id, { status: ChannelStatus.COMPLETED });
  }

  async recordChannelExecution(
    id: string,
    success: boolean,
  ): Promise<void> {
    await this.channelRepository.incrementSendCount(id, success);
  }

  async findScheduledChannels(): Promise<CampaignChannelEntity[]> {
    return this.channelRepository.findScheduledChannels();
  }
}
