import { ContentType, ContentStatus, ContentChannel } from '../entities/content.entity';
export declare class QueryContentDto {
    type?: ContentType;
    status?: ContentStatus;
    channel?: ContentChannel;
    workspace_id?: string;
    campaign_id?: string;
    author_id?: string;
    sort_by?: 'created_at' | 'updated_at' | 'published_at';
    sort_order?: 'ASC' | 'DESC';
    page?: number;
    limit?: number;
}
