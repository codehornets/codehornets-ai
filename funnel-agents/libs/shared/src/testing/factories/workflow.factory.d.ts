/**
 * Factory functions for creating test Workflow entities
 */
export interface WorkflowFactoryOptions {
    id?: string;
    workspace_id?: string;
    name?: string;
    description?: string;
    trigger_type?: 'manual' | 'schedule' | 'webhook' | 'event';
    trigger_config?: Record<string, any>;
    status?: 'draft' | 'active' | 'paused' | 'archived';
    nodes?: any[];
    edges?: any[];
}
export declare function createMockWorkflow(options?: WorkflowFactoryOptions): {
    id: string;
    workspace_id: string;
    name: string;
    description: string;
    trigger_type: "event" | "schedule" | "webhook" | "manual";
    trigger_config: Record<string, any>;
    status: "active" | "archived" | "draft" | "paused";
    nodes: any[];
    edges: any[];
    created_at: Date;
    updated_at: Date;
};
export declare function createMockWorkflows(count: number, baseOptions?: WorkflowFactoryOptions): {
    id: string;
    workspace_id: string;
    name: string;
    description: string;
    trigger_type: "event" | "schedule" | "webhook" | "manual";
    trigger_config: Record<string, any>;
    status: "active" | "archived" | "draft" | "paused";
    nodes: any[];
    edges: any[];
    created_at: Date;
    updated_at: Date;
}[];
export declare function createMockActiveWorkflow(options?: WorkflowFactoryOptions): {
    id: string;
    workspace_id: string;
    name: string;
    description: string;
    trigger_type: "event" | "schedule" | "webhook" | "manual";
    trigger_config: Record<string, any>;
    status: "active" | "archived" | "draft" | "paused";
    nodes: any[];
    edges: any[];
    created_at: Date;
    updated_at: Date;
};
export declare function createMockScheduledWorkflow(options?: WorkflowFactoryOptions): {
    id: string;
    workspace_id: string;
    name: string;
    description: string;
    trigger_type: "event" | "schedule" | "webhook" | "manual";
    trigger_config: Record<string, any>;
    status: "active" | "archived" | "draft" | "paused";
    nodes: any[];
    edges: any[];
    created_at: Date;
    updated_at: Date;
};
