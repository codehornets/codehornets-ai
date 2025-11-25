import { BaseDbEntity } from '@funnelagents/infrastructure';
export interface TaskTemplate {
    title: string;
    description?: string;
    agent_domain?: string;
    priority?: string;
}
export declare class CampaignTemplateEntity extends BaseDbEntity {
    name: string;
    description?: string;
    category: string;
    default_settings?: Record<string, any>;
    default_agents?: string[];
    default_tasks?: TaskTemplate[];
    is_public: boolean;
}
