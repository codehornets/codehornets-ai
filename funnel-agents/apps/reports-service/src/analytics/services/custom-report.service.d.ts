import { Repository } from 'typeorm';
import { TaskEntity, AgentEntity, LeadEntity, CampaignEntity, DealEntity } from '../entities';
import { CustomReportDto, CustomReportResultDto } from '../dto/custom-report.dto';
import { CacheService } from './cache.service';
export declare class CustomReportService {
    private readonly taskRepository;
    private readonly agentRepository;
    private readonly leadRepository;
    private readonly campaignRepository;
    private readonly dealRepository;
    private readonly cacheService;
    private readonly logger;
    constructor(taskRepository: Repository<TaskEntity>, agentRepository: Repository<AgentEntity>, leadRepository: Repository<LeadEntity>, campaignRepository: Repository<CampaignEntity>, dealRepository: Repository<DealEntity>, cacheService: CacheService);
    /**
     * Generate custom report based on dynamic query
     */
    generateCustomReport(dto: CustomReportDto): Promise<CustomReportResultDto>;
    /**
     * Get repository for entity type
     */
    private getRepository;
    /**
     * Apply filters to query builder
     */
    private applyFilters;
    /**
     * Calculate metrics from data
     */
    private calculateMetrics;
    /**
     * Group data by specified fields
     */
    private groupData;
    /**
     * Build summary statistics
     */
    private buildSummary;
    private calculateAvgCompletionTime;
    private calculateSuccessRate;
    private calculateConversionRate;
    private calculateTotalValue;
    private calculateAvgDealSize;
    private calculateROI;
    private sumField;
    private avgField;
    private countByField;
}
