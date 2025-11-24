export enum AgentType {
  CONTENT_WRITER = 'content_writer',
  SEO_OPTIMIZER = 'seo_optimizer',
  SOCIAL_MANAGER = 'social_manager',
  EMAIL_MARKETER = 'email_marketer',
  AD_SPECIALIST = 'ad_specialist',
  DATA_ANALYST = 'data_analyst',
  LEAD_QUALIFIER = 'lead_qualifier',
  ORCHESTRATOR = 'orchestrator',
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
