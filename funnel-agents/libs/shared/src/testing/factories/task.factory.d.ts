/**
 * Factory functions for creating test Task entities
 */
export interface TaskFactoryOptions {
    id?: string;
    workspace_id?: string;
    title?: string;
    description?: string;
    type?: 'lead_qualification' | 'content_generation' | 'email_outreach' | 'data_analysis' | 'custom';
    status?: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    assigned_agent_id?: string;
    input_data?: Record<string, any>;
    output_data?: Record<string, any>;
    error?: string;
}
export declare function createMockTask(options?: TaskFactoryOptions): {
    id: string;
    workspace_id: string;
    title: string;
    description: string;
    type: "custom" | "lead_qualification" | "content_generation" | "data_analysis" | "email_outreach";
    status: "pending" | "running" | "completed" | "cancelled" | "failed";
    priority: "low" | "medium" | "high" | "urgent";
    assigned_agent_id: string | null;
    input_data: Record<string, any>;
    output_data: Record<string, any> | null;
    error: string | null;
    created_at: Date;
    updated_at: Date;
    started_at: Date | null;
    completed_at: Date | null;
};
export declare function createMockTasks(count: number, baseOptions?: TaskFactoryOptions): {
    id: string;
    workspace_id: string;
    title: string;
    description: string;
    type: "custom" | "lead_qualification" | "content_generation" | "data_analysis" | "email_outreach";
    status: "pending" | "running" | "completed" | "cancelled" | "failed";
    priority: "low" | "medium" | "high" | "urgent";
    assigned_agent_id: string | null;
    input_data: Record<string, any>;
    output_data: Record<string, any> | null;
    error: string | null;
    created_at: Date;
    updated_at: Date;
    started_at: Date | null;
    completed_at: Date | null;
}[];
export declare function createMockPendingTask(options?: TaskFactoryOptions): {
    id: string;
    workspace_id: string;
    title: string;
    description: string;
    type: "custom" | "lead_qualification" | "content_generation" | "data_analysis" | "email_outreach";
    status: "pending" | "running" | "completed" | "cancelled" | "failed";
    priority: "low" | "medium" | "high" | "urgent";
    assigned_agent_id: string | null;
    input_data: Record<string, any>;
    output_data: Record<string, any> | null;
    error: string | null;
    created_at: Date;
    updated_at: Date;
    started_at: Date | null;
    completed_at: Date | null;
};
export declare function createMockRunningTask(options?: TaskFactoryOptions): {
    id: string;
    workspace_id: string;
    title: string;
    description: string;
    type: "custom" | "lead_qualification" | "content_generation" | "data_analysis" | "email_outreach";
    status: "pending" | "running" | "completed" | "cancelled" | "failed";
    priority: "low" | "medium" | "high" | "urgent";
    assigned_agent_id: string | null;
    input_data: Record<string, any>;
    output_data: Record<string, any> | null;
    error: string | null;
    created_at: Date;
    updated_at: Date;
    started_at: Date | null;
    completed_at: Date | null;
};
export declare function createMockCompletedTask(options?: TaskFactoryOptions): {
    id: string;
    workspace_id: string;
    title: string;
    description: string;
    type: "custom" | "lead_qualification" | "content_generation" | "data_analysis" | "email_outreach";
    status: "pending" | "running" | "completed" | "cancelled" | "failed";
    priority: "low" | "medium" | "high" | "urgent";
    assigned_agent_id: string | null;
    input_data: Record<string, any>;
    output_data: Record<string, any> | null;
    error: string | null;
    created_at: Date;
    updated_at: Date;
    started_at: Date | null;
    completed_at: Date | null;
};
export declare function createMockFailedTask(options?: TaskFactoryOptions): {
    id: string;
    workspace_id: string;
    title: string;
    description: string;
    type: "custom" | "lead_qualification" | "content_generation" | "data_analysis" | "email_outreach";
    status: "pending" | "running" | "completed" | "cancelled" | "failed";
    priority: "low" | "medium" | "high" | "urgent";
    assigned_agent_id: string | null;
    input_data: Record<string, any>;
    output_data: Record<string, any> | null;
    error: string | null;
    created_at: Date;
    updated_at: Date;
    started_at: Date | null;
    completed_at: Date | null;
};
