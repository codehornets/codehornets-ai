import { CampaignTemplatesService } from '../services/campaign-templates.service';
import { CreateCampaignTemplateDto, UpdateCampaignTemplateDto } from '../dto/campaign-template.dto';
import { CampaignTemplateQueryDto } from '../dto/query.dto';
export declare class CampaignTemplatesController {
    private readonly templatesService;
    constructor(templatesService: CampaignTemplatesService);
    findAll(query: CampaignTemplateQueryDto): Promise<import("../../../../../libs/domain/src").PaginatedResult<import("..").CampaignTemplateEntity>>;
    findById(id: string): Promise<import("..").CampaignTemplateEntity>;
    create(data: CreateCampaignTemplateDto): Promise<import("..").CampaignTemplateEntity>;
    update(id: string, data: UpdateCampaignTemplateDto): Promise<import("..").CampaignTemplateEntity>;
    delete(id: string): Promise<void>;
}
