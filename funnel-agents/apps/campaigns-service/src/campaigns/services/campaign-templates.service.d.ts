import { PaginationParams, PaginatedResult } from '@funnelagents/domain';
import { CampaignTemplateRepository, CampaignTemplateFilters } from '../repositories/campaign-template.repository';
import { CampaignTemplateEntity } from '../entities/campaign-template.entity';
import { CreateCampaignTemplateDto, UpdateCampaignTemplateDto } from '../dto/campaign-template.dto';
export declare class CampaignTemplatesService {
    private readonly templateRepository;
    constructor(templateRepository: CampaignTemplateRepository);
    findAll(filters?: CampaignTemplateFilters, params?: PaginationParams): Promise<PaginatedResult<CampaignTemplateEntity>>;
    findById(id: string): Promise<CampaignTemplateEntity>;
    create(data: CreateCampaignTemplateDto): Promise<CampaignTemplateEntity>;
    update(id: string, data: UpdateCampaignTemplateDto): Promise<CampaignTemplateEntity>;
    delete(id: string): Promise<void>;
}
