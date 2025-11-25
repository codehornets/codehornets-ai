/**
 * Factory functions for creating test Agent entities
 */
export interface AgentFactoryOptions {
    id?: string;
    workspace_id?: string;
    name?: string;
    description?: string;
    type?: 'lead_qualifier' | 'content_writer' | 'email_sender' | 'data_analyst' | 'custom';
    status?: 'active' | 'inactive' | 'training';
    model?: string;
    system_prompt?: string;
    capabilities?: string[];
    configuration?: Record<string, any>;
}
export declare function createMockAgent(options?: AgentFactoryOptions): {
    id: string;
    workspace_id: string;
    name: string;
    description: string;
    type: "lead_qualifier" | "custom" | "content_writer" | "email_sender" | "data_analyst";
    status: "active" | "inactive" | "training";
    model: string;
    system_prompt: string;
    capabilities: string[];
    configuration: Record<string, any>;
    created_at: Date;
    updated_at: Date;
};
export declare function createMockAgents(count: number, baseOptions?: AgentFactoryOptions): {
    id: string;
    workspace_id: string;
    name: string;
    description: string;
    type: "lead_qualifier" | "custom" | "content_writer" | "email_sender" | "data_analyst";
    status: "active" | "inactive" | "training";
    model: string;
    system_prompt: string;
    capabilities: string[];
    configuration: Record<string, any>;
    created_at: Date;
    updated_at: Date;
}[];
export declare function createMockLeadQualifierAgent(options?: AgentFactoryOptions): {
    id: string;
    workspace_id: string;
    name: string;
    description: string;
    type: "lead_qualifier" | "custom" | "content_writer" | "email_sender" | "data_analyst";
    status: "active" | "inactive" | "training";
    model: string;
    system_prompt: string;
    capabilities: string[];
    configuration: Record<string, any>;
    created_at: Date;
    updated_at: Date;
};
export declare function createMockContentWriterAgent(options?: AgentFactoryOptions): {
    id: string;
    workspace_id: string;
    name: string;
    description: string;
    type: "lead_qualifier" | "custom" | "content_writer" | "email_sender" | "data_analyst";
    status: "active" | "inactive" | "training";
    model: string;
    system_prompt: string;
    capabilities: string[];
    configuration: Record<string, any>;
    created_at: Date;
    updated_at: Date;
};
