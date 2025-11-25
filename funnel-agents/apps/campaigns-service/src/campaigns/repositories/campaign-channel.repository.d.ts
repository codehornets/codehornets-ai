import { Repository } from 'typeorm';
import { BaseRepository } from '@funnelagents/infrastructure';
import { CampaignChannelEntity, ChannelType, ChannelStatus } from '../entities/campaign-channel.entity';
export interface CampaignChannelFilters {
    campaign_id?: string;
    channel_type?: ChannelType;
    status?: ChannelStatus;
}
export declare class CampaignChannelRepository extends BaseRepository<CampaignChannelEntity> {
    constructor(repository: Repository<CampaignChannelEntity>);
    findWithFilters(filters: CampaignChannelFilters, params?: any): Promise<any>;
    findByCampaignId(campaignId: string): Promise<CampaignChannelEntity[]>;
    findScheduledChannels(): Promise<CampaignChannelEntity[]>;
    incrementSendCount(channelId: string, success: boolean): Promise<void>;
}
