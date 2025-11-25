import { PaginationParams, PaginatedResult } from '@funnelagents/domain';
import { CampaignChannelRepository } from '../repositories/campaign-channel.repository';
import { CampaignChannelEntity } from '../entities/campaign-channel.entity';
import { CreateCampaignChannelDto, UpdateCampaignChannelDto } from '../dto/campaign-channel.dto';
export declare class CampaignChannelsService {
    private readonly channelRepository;
    private readonly logger;
    constructor(channelRepository: CampaignChannelRepository);
    findAll(filters?: any, params?: PaginationParams): Promise<PaginatedResult<CampaignChannelEntity>>;
    findById(id: string): Promise<CampaignChannelEntity>;
    findByCampaignId(campaignId: string): Promise<CampaignChannelEntity[]>;
    create(data: CreateCampaignChannelDto): Promise<CampaignChannelEntity>;
    update(id: string, data: UpdateCampaignChannelDto): Promise<CampaignChannelEntity>;
    delete(id: string): Promise<void>;
    activateChannel(id: string): Promise<CampaignChannelEntity>;
    pauseChannel(id: string): Promise<CampaignChannelEntity>;
    completeChannel(id: string): Promise<CampaignChannelEntity>;
    recordChannelExecution(id: string, success: boolean): Promise<void>;
    findScheduledChannels(): Promise<CampaignChannelEntity[]>;
}
