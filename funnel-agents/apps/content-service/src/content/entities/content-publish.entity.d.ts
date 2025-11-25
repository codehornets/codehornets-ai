import { Content, ContentChannel } from './content.entity';
export declare enum PublishStatus {
    SCHEDULED = "scheduled",
    PUBLISHING = "publishing",
    PUBLISHED = "published",
    FAILED = "failed",
    CANCELLED = "cancelled"
}
export declare class ContentPublish {
    id: string;
    content_id: string;
    content: Content;
    channel: ContentChannel;
    status: PublishStatus;
    scheduled_at?: Date;
    published_at?: Date;
    channel_content?: string;
    channel_metadata?: Record<string, any>;
    error_message?: string;
    published_by?: string;
    created_at: Date;
    updated_at: Date;
}
