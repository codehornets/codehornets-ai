import { Repository } from 'typeorm';
import { ContentAnalytics } from '../entities/content-analytics.entity';
import { Content } from '../entities/content.entity';
import { TrackAnalyticsDto, QueryAnalyticsDto, ContentPerformanceDto } from '../dto/analytics.dto';
export declare class AnalyticsService {
    private readonly analyticsRepository;
    private readonly contentRepository;
    constructor(analyticsRepository: Repository<ContentAnalytics>, contentRepository: Repository<Content>);
    trackEvent(dto: TrackAnalyticsDto): Promise<ContentAnalytics>;
    getAnalytics(query: QueryAnalyticsDto): Promise<ContentAnalytics[]>;
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
    getPerformanceByChannel(dto: ContentPerformanceDto): Promise<Array<{
        channel: string;
        views: number;
        clicks: number;
        shares: number;
        likes: number;
        comments: number;
        conversions: number;
        engagement_rate: number;
    }>>;
    getTopPerformingContent(dto: ContentPerformanceDto): Promise<Array<{
        content_id: string;
        content: Content;
        metrics: {
            views: number;
            clicks: number;
            shares: number;
            likes: number;
            comments: number;
            conversions: number;
            engagement_rate: number;
        };
    }>>;
}
