import { AnalyticsService } from '../services/analytics.service';
import { TrackAnalyticsDto, QueryAnalyticsDto, ContentPerformanceDto } from '../dto/analytics.dto';
export declare class AnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
    trackEvent(dto: TrackAnalyticsDto): Promise<import("../entities/content-analytics.entity").ContentAnalytics>;
    getAnalytics(query: QueryAnalyticsDto): Promise<import("../entities/content-analytics.entity").ContentAnalytics[]>;
    getContentMetrics(contentId: string): Promise<{
        views: number;
        clicks: number;
        shares: number;
        likes: number;
        comments: number;
        conversions: number;
        total_engagement: number;
        engagement_rate: number;
    }>;
    getPerformanceByChannel(dto: ContentPerformanceDto): Promise<{
        channel: string;
        views: number;
        clicks: number;
        shares: number;
        likes: number;
        comments: number;
        conversions: number;
        engagement_rate: number;
    }[]>;
    getTopPerformingContent(dto: ContentPerformanceDto): Promise<{
        content_id: string;
        content: import("../entities/content.entity").Content;
        metrics: {
            views: number;
            clicks: number;
            shares: number;
            likes: number;
            comments: number;
            conversions: number;
            engagement_rate: number;
        };
    }[]>;
}
