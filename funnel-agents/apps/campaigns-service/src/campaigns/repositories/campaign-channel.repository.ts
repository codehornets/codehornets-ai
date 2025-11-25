import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '@funnelagents/infrastructure';
import { CampaignChannelEntity, ChannelType, ChannelStatus } from '../entities/campaign-channel.entity';

export interface CampaignChannelFilters {
  campaign_id?: string;
  channel_type?: ChannelType;
  status?: ChannelStatus;
}

@Injectable()
export class CampaignChannelRepository extends BaseRepository<CampaignChannelEntity> {
  constructor(
    @InjectRepository(CampaignChannelEntity)
    repository: Repository<CampaignChannelEntity>,
  ) {
    super(repository);
  }

  async findWithFilters(
    filters: CampaignChannelFilters,
    params?: any,
  ): Promise<any> {
    const qb = this.repository.createQueryBuilder('channel');

    if (filters.campaign_id) {
      qb.andWhere('channel.campaign_id = :campaignId', {
        campaignId: filters.campaign_id,
      });
    }

    if (filters.channel_type) {
      qb.andWhere('channel.channel_type = :channelType', {
        channelType: filters.channel_type,
      });
    }

    if (filters.status) {
      qb.andWhere('channel.status = :status', {
        status: filters.status,
      });
    }

    return this.paginate(qb, params);
  }

  async findByCampaignId(campaignId: string): Promise<CampaignChannelEntity[]> {
    return this.repository.find({
      where: { campaign_id: campaignId },
      order: { createdAt: 'DESC' },
    });
  }

  async findScheduledChannels(): Promise<CampaignChannelEntity[]> {
    return this.repository
      .createQueryBuilder('channel')
      .where('channel.status = :status', { status: ChannelStatus.ACTIVE })
      .andWhere('channel.scheduled_at IS NOT NULL')
      .andWhere('channel.scheduled_at <= :now', { now: new Date() })
      .andWhere('channel.started_at IS NULL')
      .getMany();
  }

  async incrementSendCount(channelId: string, success: boolean): Promise<void> {
    const updates: any = {
      send_count: () => 'send_count + 1',
    };

    if (success) {
      updates.success_count = () => 'success_count + 1';
    } else {
      updates.failure_count = () => 'failure_count + 1';
    }

    await this.repository.update(channelId, updates);
  }
}
