export declare enum AgentDomain {
    OFFER = "Offer",
    MARKETING = "Marketing",
    SALES = "Sales",
    FULFILLMENT = "Fulfillment",
    FEEDBACK_LOOP = "Feedback Loop",
    OPERATIONS = "Operations",
    CUSTOMER_SUPPORT = "Customer Support",
    LEADERSHIP = "Leadership",
    INNOVATION = "Innovation",
    ENABLEMENT = "Enablement",
    BUSINESS_DEVELOPMENT = "Business Development"
}
export declare enum AgentStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    TRAINING = "training"
}
export declare enum AgentType {
    MARKET_RESEARCHER = "market_researcher",
    CONTENT_CREATOR = "content_creator",
    LEAD_QUALIFIER = "lead_qualifier",
    SEO_SPECIALIST = "seo_specialist",
    EMAIL_MARKETER = "email_marketer",
    REPORTING_ANALYST = "reporting_analyst",
    SOCIAL_MEDIA_MANAGER = "social_media_manager",
    COMPETITOR_ANALYST = "competitor_analyst",
    ORCHESTRATOR = "orchestrator",
    CUSTOM = "custom"
}
export declare enum AgentTool {
    WEB_SEARCH = "Web search",
    CLIENT_DOCS = "Client docs",
    CRM = "CRM",
    AD_PLATFORMS = "Ad platforms",
    EMAIL_DRAFTS = "Email drafts",
    ANALYTICS = "Analytics"
}
export declare const AGENT_SKILLS: readonly ["Market Research", "Copywriting", "Data Analysis", "SEO", "Social Media", "Email Marketing", "Content Strategy", "Lead Generation", "Competitor Analysis", "Ad Management", "Web Analytics", "CRM Management", "Sales Outreach", "Customer Service", "Project Management", "Creative Design", "Video Production"];
export declare class CreateAgentDto {
    name: string;
    description?: string;
    type?: AgentType;
    domain: AgentDomain;
    status: AgentStatus;
    skills: string[];
    tools?: string[];
    settings?: Record<string, any>;
    prompt_template?: string;
    model?: string;
}
export declare class UpdateAgentDto {
    name?: string;
    description?: string;
    type?: AgentType;
    domain?: AgentDomain;
    status?: AgentStatus;
    skills?: string[];
    tools?: string[];
    settings?: Record<string, any>;
    prompt_template?: string;
    model?: string;
}
export declare class AgentResponseDto {
    id: string;
    name: string;
    description?: string;
    type?: AgentType;
    domain: AgentDomain;
    status: AgentStatus;
    skills: string[];
    tools?: string[];
    success_rate?: number;
    tasks_completed?: number;
    avg_completion_time?: number;
    settings?: Record<string, any>;
    prompt_template?: string;
    model?: string;
    created_at: Date;
    updated_at: Date;
}
export declare class AgentFilterDto {
    domain?: AgentDomain;
    status?: AgentStatus;
    skill?: string;
}
