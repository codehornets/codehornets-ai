import { CampaignChannelsService } from '../services/campaign-channels.service';
import { CreateCampaignChannelDto, UpdateCampaignChannelDto } from '../dto/campaign-channel.dto';
export declare class CampaignChannelsController {
    private readonly channelsService;
    constructor(channelsService: CampaignChannelsService);
    findAll(query: any): Promise<import("../../../../../libs/domain/src").PaginatedResult<import("../entities/campaign-channel.entity").CampaignChannelEntity>>;
    findByCampaignId(campaignId: string): Promise<import("../entities/campaign-channel.entity").CampaignChannelEntity[]>;
    findById(id: string): Promise<import("../entities/campaign-channel.entity").CampaignChannelEntity>;
    create(data: CreateCampaignChannelDto): Promise<import("../entities/campaign-channel.entity").CampaignChannelEntity>;
    update(id: string, data: UpdateCampaignChannelDto): Promise<import("../entities/campaign-channel.entity").CampaignChannelEntity>;
    delete(id: string): Promise<void>;
    activate(id: string): Promise<import("../entities/campaign-channel.entity").CampaignChannelEntity>;
    pause(id: string): Promise<import("../entities/campaign-channel.entity").CampaignChannelEntity>;
}
