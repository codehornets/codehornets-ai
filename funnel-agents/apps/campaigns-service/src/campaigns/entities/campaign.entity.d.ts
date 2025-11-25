import { BaseDbEntity } from '@funnelagents/infrastructure';
export declare enum CampaignStatus {
    DRAFT = "draft",
    PLANNING = "planning",
    ACTIVE = "active",
    ON_HOLD = "on_hold",
    COMPLETED = "completed",
    ARCHIVED = "archived"
}
export declare enum CampaignPriority {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export declare class CampaignEntity extends BaseDbEntity {
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
}
