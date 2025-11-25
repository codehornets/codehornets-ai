import { CampaignAnalyticsRepository } from '../repositories/campaign-analytics.repository';
import { CampaignRepository } from '../repositories/campaign.repository';
import { CampaignAnalyticsEntity } from '../entities/campaign-analytics.entity';
import { CreateAnalyticEventDto, CampaignPerformanceDto } from '../dto/campaign-analytics.dto';
export declare class CampaignAnalyticsService {
    private readonly analyticsRepository;
    private readonly campaignRepository;
    private readonly logger;
    constructor(analyticsRepository: CampaignAnalyticsRepository, campaignRepository: CampaignRepository);
    trackEvent(data: CreateAnalyticEventDto): Promise<CampaignAnalyticsEntity>;
    getCampaignPerformance(campaignId: string, startDate?: Date, endDate?: Date): Promise<CampaignPerformanceDto>;
    private aggregateDailyMetrics;
    private getAgentPerformance;
}
