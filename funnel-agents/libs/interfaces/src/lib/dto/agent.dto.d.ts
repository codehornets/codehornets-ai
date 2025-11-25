export declare enum AgentType {
    LEAD_QUALIFIER = "lead_qualifier",
    CONTENT_CREATOR = "content_creator",
    EMAIL_MARKETER = "email_marketer",
    SOCIAL_MEDIA = "social_media",
    ANALYST = "analyst",
    CUSTOM = "custom"
}
export declare enum AgentDomain {
    SALES = "sales",
    MARKETING = "marketing",
    ANALYTICS = "analytics",
    AUTOMATION = "automation",
    CUSTOMER_SERVICE = "customer_service"
}
export declare enum AgentStatus {
    OFFLINE = "offline",
    IDLE = "idle",
    BUSY = "busy",
    ERROR = "error"
}
export declare class CreateAgentDto {
    name: string;
    description?: string;
    type: AgentType;
    domain: AgentDomain;
    capabilities?: Array<{
        name: string;
        description: string;
        parameters?: Record<string, any>;
    }>;
    config?: {
        model?: string;
        temperature?: number;
        maxTokens?: number;
        systemPrompt?: string;
        tools?: string[];
    };
    tools?: string[];
}
export declare class UpdateAgentDto {
    name?: string;
    description?: string;
    status?: AgentStatus;
    capabilities?: Array<{
        name: string;
        description: string;
        parameters?: Record<string, any>;
    }>;
    config?: {
        model?: string;
        temperature?: number;
        maxTokens?: number;
        systemPrompt?: string;
        tools?: string[];
    };
    tools?: string[];
}
export declare class AgentQueryDto {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    status?: AgentStatus;
    type?: AgentType;
    domain?: AgentDomain;
}
