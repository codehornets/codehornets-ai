import { PaginationParams, PaginatedResult } from '@funnelagents/domain';
import { CampaignRepository, CampaignFilters } from '../repositories/campaign.repository';
import { CampaignTemplateRepository } from '../repositories/campaign-template.repository';
import { CampaignEntity } from '../entities/campaign.entity';
import { CreateCampaignDto, UpdateCampaignDto, CreateFromTemplateDto } from '../dto/campaign.dto';
import { CampaignTasksService } from './campaign-tasks.service';
export declare class CampaignsService {
    private readonly campaignRepository;
    private readonly templateRepository;
    private readonly tasksService;
    private readonly logger;
    constructor(campaignRepository: CampaignRepository, templateRepository: CampaignTemplateRepository, tasksService: CampaignTasksService);
    findAll(filters?: CampaignFilters, params?: PaginationParams): Promise<PaginatedResult<CampaignEntity>>;
    findById(id: string): Promise<CampaignEntity>;
    create(data: CreateCampaignDto): Promise<CampaignEntity>;
    update(id: string, data: UpdateCampaignDto): Promise<CampaignEntity>;
    delete(id: string): Promise<void>;
    createFromTemplate(data: CreateFromTemplateDto): Promise<CampaignEntity>;
}
