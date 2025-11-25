/**
 * Factory functions for creating test Campaign entities
 */
export interface CampaignFactoryOptions {
    id?: string;
    workspace_id?: string;
    name?: string;
    description?: string;
    type?: 'email' | 'social' | 'content' | 'multi_channel';
    status?: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'archived';
    start_date?: Date;
    end_date?: Date;
    target_audience?: Record<string, any>;
    configuration?: Record<string, any>;
    metrics?: {
        sent?: number;
        delivered?: number;
        opened?: number;
        clicked?: number;
        converted?: number;
    };
}
export declare function createMockCampaign(options?: CampaignFactoryOptions): {
    id: string;
    workspace_id: string;
    name: string;
    description: string;
    type: "content" | "email" | "social" | "multi_channel";
    status: "active" | "archived" | "draft" | "scheduled" | "paused" | "completed";
    start_date: Date;
    end_date: Date;
    target_audience: Record<string, any>;
    configuration: Record<string, any>;
    metrics: {
        sent?: number;
        delivered?: number;
        opened?: number;
        clicked?: number;
        converted?: number;
    };
    created_at: Date;
    updated_at: Date;
};
export declare function createMockCampaigns(count: number, baseOptions?: CampaignFactoryOptions): {
    id: string;
    workspace_id: string;
    name: string;
    description: string;
    type: "content" | "email" | "social" | "multi_channel";
    status: "active" | "archived" | "draft" | "scheduled" | "paused" | "completed";
    start_date: Date;
    end_date: Date;
    target_audience: Record<string, any>;
    configuration: Record<string, any>;
    metrics: {
        sent?: number;
        delivered?: number;
        opened?: number;
        clicked?: number;
        converted?: number;
    };
    created_at: Date;
    updated_at: Date;
}[];
export declare function createMockActiveCampaign(options?: CampaignFactoryOptions): {
    id: string;
    workspace_id: string;
    name: string;
    description: string;
    type: "content" | "email" | "social" | "multi_channel";
    status: "active" | "archived" | "draft" | "scheduled" | "paused" | "completed";
    start_date: Date;
    end_date: Date;
    target_audience: Record<string, any>;
    configuration: Record<string, any>;
    metrics: {
        sent?: number;
        delivered?: number;
        opened?: number;
        clicked?: number;
        converted?: number;
    };
    created_at: Date;
    updated_at: Date;
};
export declare function createMockEmailCampaign(options?: CampaignFactoryOptions): {
    id: string;
    workspace_id: string;
    name: string;
    description: string;
    type: "content" | "email" | "social" | "multi_channel";
    status: "active" | "archived" | "draft" | "scheduled" | "paused" | "completed";
    start_date: Date;
    end_date: Date;
    target_audience: Record<string, any>;
    configuration: Record<string, any>;
    metrics: {
        sent?: number;
        delivered?: number;
        opened?: number;
        clicked?: number;
        converted?: number;
    };
    created_at: Date;
    updated_at: Date;
};
