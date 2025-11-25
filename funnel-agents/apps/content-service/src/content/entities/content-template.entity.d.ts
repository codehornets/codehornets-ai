import { ContentType } from './content.entity';
export declare class ContentTemplate {
    id: string;
    name: string;
    description?: string;
    content_type: ContentType;
    category?: string;
    template_body: string;
    variables: Record<string, any>;
    metadata?: Record<string, any>;
    thumbnail_url?: string;
    is_active: boolean;
    created_by?: string;
    created_at: Date;
    updated_at: Date;
}
