import { CampaignAnalyticsService } from '../services/campaign-analytics.service';
import { CreateAnalyticEventDto, CampaignAnalyticsQueryDto, CampaignPerformanceDto } from '../dto/campaign-analytics.dto';
export declare class CampaignAnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: CampaignAnalyticsService);
    trackEvent(data: CreateAnalyticEventDto): Promise<import("../entities/campaign-analytics.entity").CampaignAnalyticsEntity>;
    getCampaignPerformance(campaignId: string, query: CampaignAnalyticsQueryDto): Promise<CampaignPerformanceDto>;
}
