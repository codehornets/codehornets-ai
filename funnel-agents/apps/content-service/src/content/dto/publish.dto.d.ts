import { ContentChannel } from '../entities/content.entity';
import { PublishStatus } from '../entities/content-publish.entity';
export declare class SchedulePublishDto {
    content_id: string;
    channel: ContentChannel;
    scheduled_at?: string;
    channel_content?: string;
    channel_metadata?: Record<string, any>;
    published_by?: string;
}
export declare class UpdatePublishStatusDto {
    status: PublishStatus;
    error_message?: string;
    channel_metadata?: Record<string, any>;
}
export declare class CancelPublishDto {
    cancellation_reason?: string;
}
