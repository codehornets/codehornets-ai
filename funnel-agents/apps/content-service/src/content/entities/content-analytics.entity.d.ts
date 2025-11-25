import { Content, ContentChannel } from './content.entity';
export declare enum AnalyticsEventType {
    VIEW = "view",
    CLICK = "click",
    SHARE = "share",
    LIKE = "like",
    COMMENT = "comment",
    CONVERSION = "conversion"
}
export declare class ContentAnalytics {
    id: string;
    content_id: string;
    content: Content;
    event_type: AnalyticsEventType;
    channel?: ContentChannel;
    count: number;
    metadata?: Record<string, any>;
    created_at: Date;
    updated_at: Date;
}
