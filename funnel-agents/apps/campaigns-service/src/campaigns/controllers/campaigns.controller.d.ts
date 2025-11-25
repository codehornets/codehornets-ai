import { CampaignsService } from '../services/campaigns.service';
import { CreateCampaignDto, UpdateCampaignDto, CreateFromTemplateDto } from '../dto/campaign.dto';
import { CampaignQueryDto } from '../dto/query.dto';
export declare class CampaignsController {
    private readonly campaignsService;
    constructor(campaignsService: CampaignsService);
    findAll(query: CampaignQueryDto): Promise<import("../../../../../libs/domain/src").PaginatedResult<import("..").CampaignEntity>>;
    findById(id: string): Promise<import("..").CampaignEntity>;
    create(data: CreateCampaignDto): Promise<import("..").CampaignEntity>;
    update(id: string, data: UpdateCampaignDto): Promise<import("..").CampaignEntity>;
    delete(id: string): Promise<void>;
    createFromTemplate(data: CreateFromTemplateDto): Promise<import("..").CampaignEntity>;
}
