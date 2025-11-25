import { ContentType } from '../entities/content.entity';
export declare class CreateTemplateDto {
    name: string;
    description?: string;
    content_type: ContentType;
    category?: string;
    template_body: string;
    variables: Record<string, any>;
    metadata?: Record<string, any>;
    thumbnail_url?: string;
    created_by?: string;
}
export declare class UpdateTemplateDto {
    name?: string;
    description?: string;
    category?: string;
    template_body?: string;
    variables?: Record<string, any>;
    metadata?: Record<string, any>;
    thumbnail_url?: string;
    is_active?: boolean;
}
export declare class RenderTemplateDto {
    template_id: string;
    variable_values: Record<string, any>;
}
export declare class QueryTemplateDto {
    content_type?: ContentType;
    category?: string;
    is_active?: boolean;
    search?: string;
}
