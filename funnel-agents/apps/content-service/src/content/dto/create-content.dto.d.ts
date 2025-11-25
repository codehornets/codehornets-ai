import { ContentType, ContentStatus, ContentChannel } from '../entities/content.entity';
export declare class CreateContentDto {
    title: string;
    description?: string;
    body?: string;
    type: ContentType;
    status?: ContentStatus;
    channel?: ContentChannel;
    workspace_id?: string;
    campaign_id?: string;
    author_id?: string;
    file_url?: string;
    thumbnail_url?: string;
    metadata?: Record<string, any>;
    published_at?: Date;
}
