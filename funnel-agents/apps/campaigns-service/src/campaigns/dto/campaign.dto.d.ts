import { CampaignStatus, CampaignPriority } from '../entities/campaign.entity';
export declare class CreateCampaignDto {
    name: string;
    description?: string;
    workspace_id?: string;
    status?: CampaignStatus;
    priority?: CampaignPriority;
    goal?: string;
    start_date?: string;
    end_date?: string;
    team_members?: string[];
    agent_ids?: string[];
    settings?: Record<string, any>;
    progress?: number;
}
declare const UpdateCampaignDto_base: import("@nestjs/common").Type<Partial<CreateCampaignDto>>;
export declare class UpdateCampaignDto extends UpdateCampaignDto_base {
}
export declare class CampaignResponseDto {
    id: string;
    name: string;
    description?: string;
    workspace_id?: string;
    status: CampaignStatus;
    priority: CampaignPriority;
    goal?: string;
    start_date?: Date;
    end_date?: Date;
    team_members?: string[];
    agent_ids?: string[];
    settings?: Record<string, any>;
    progress?: number;
    created_at: Date;
    updated_at: Date;
}
export declare class CreateFromTemplateDto {
    template_id: string;
    name: string;
    description?: string;
    workspace_id?: string;
    settings?: Record<string, any>;
    create_default_tasks?: boolean;
}
export {};
