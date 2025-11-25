import { ContentChannel } from '../entities/content.entity';
import { AnalyticsEventType } from '../entities/content-analytics.entity';
export declare class TrackAnalyticsDto {
    content_id: string;
    event_type: AnalyticsEventType;
    channel?: ContentChannel;
    count?: number;
    metadata?: Record<string, any>;
}
export declare class QueryAnalyticsDto {
    content_id?: string;
    event_type?: AnalyticsEventType;
    channel?: ContentChannel;
    start_date?: string;
    end_date?: string;
}
export declare class ContentPerformanceDto {
    start_date?: string;
    end_date?: string;
    channel?: ContentChannel;
    limit?: number;
}
