import { Content } from './content.entity';
export declare class ContentVersion {
    id: string;
    content_id: string;
    content: Content;
    version_number: number;
    title: string;
    description?: string;
    body?: string;
    metadata?: Record<string, any>;
    file_url?: string;
    thumbnail_url?: string;
    changed_by?: string;
    change_summary?: string;
    created_at: Date;
}
