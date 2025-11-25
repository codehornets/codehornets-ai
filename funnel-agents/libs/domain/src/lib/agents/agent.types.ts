export enum AgentType {
  // Specialist roles (matching frontend templates)
  MARKET_RESEARCHER = 'market_researcher',
  CONTENT_CREATOR = 'content_creator',
  LEAD_QUALIFIER = 'lead_qualifier',
  SEO_SPECIALIST = 'seo_specialist',
  EMAIL_MARKETER = 'email_marketer',
  REPORTING_ANALYST = 'reporting_analyst',
  SOCIAL_MEDIA_MANAGER = 'social_media_manager',
  COMPETITOR_ANALYST = 'competitor_analyst',
  // System roles
  ORCHESTRATOR = 'orchestrator',
  CUSTOM = 'custom',
}

export enum AgentDomain {
  GENERAL = 'General',
  OFFER = 'Offer',
  MARKETING = 'Marketing',
  SALES = 'Sales',
  FULFILLMENT = 'Fulfillment',
  FEEDBACK_LOOP = 'Feedback Loop',
  OPERATIONS = 'Operations',
  CUSTOMER_SUPPORT = 'Customer Support',
  LEADERSHIP = 'Leadership',
  INNOVATION = 'Innovation',
  ENABLEMENT = 'Enablement',
  BUSINESS_DEVELOPMENT = 'Business Development',
}

export const AGENT_SKILLS = [
  'Market Research',
  'Copywriting',
  'Data Analysis',
  'SEO',
  'Social Media',
  'Email Marketing',
  'Content Strategy',
  'Lead Generation',
  'Competitor Analysis',
  'Ad Management',
  'Web Analytics',
  'CRM Management',
  'Sales Outreach',
  'Customer Service',
  'Project Management',
  'Creative Design',
  'Video Production',
] as const;

export type AgentSkill = (typeof AGENT_SKILLS)[number];

export enum AgentTool {
  WEB_SEARCH = 'Web search',
  CLIENT_DOCS = 'Client docs',
  CRM = 'CRM',
  AD_PLATFORMS = 'Ad platforms',
  EMAIL_DRAFTS = 'Email drafts',
  ANALYTICS = 'Analytics',
}

export enum AgentStatus {
  IDLE = 'idle',
  BUSY = 'busy',
  OFFLINE = 'offline',
  ERROR = 'error',
}

export interface AgentCapability {
  name: string;
  description: string;
  inputSchema?: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
}

export interface AgentConfig {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  tools?: string[];
  rateLimits?: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
}

export interface AgentMetrics {
  tasksCompleted: number;
  averageExecutionTime: number;
  successRate: number;
  lastActiveAt?: Date;
}
