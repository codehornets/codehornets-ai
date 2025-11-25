export declare class TaskTemplateDto {
    title: string;
    description?: string;
    agent_domain?: string;
    priority?: string;
}
export declare class CreateCampaignTemplateDto {
    name: string;
    description?: string;
    category: string;
    default_settings?: Record<string, any>;
    default_agents?: string[];
    default_tasks?: TaskTemplateDto[];
    is_public?: boolean;
}
declare const UpdateCampaignTemplateDto_base: import("@nestjs/common").Type<Partial<CreateCampaignTemplateDto>>;
export declare class UpdateCampaignTemplateDto extends UpdateCampaignTemplateDto_base {
}
export declare class CampaignTemplateResponseDto {
    id: string;
    name: string;
    description?: string;
    category: string;
    default_settings?: Record<string, any>;
    default_agents?: string[];
    default_tasks?: TaskTemplateDto[];
    is_public: boolean;
    created_at: Date;
    updated_at: Date;
}
export {};
