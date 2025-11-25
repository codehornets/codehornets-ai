export declare enum TaskType {
    MARKET_RESEARCH = "market_research",
    CONTENT_CREATION = "content_creation",
    LEAD_QUALIFICATION = "lead_qualification",
    SEO_OPTIMIZATION = "seo_optimization",
    EMAIL_CAMPAIGN = "email_campaign",
    SOCIAL_MEDIA_POST = "social_media_post",
    COMPETITOR_ANALYSIS = "competitor_analysis",
    REPORT_GENERATION = "report_generation",
    CUSTOM = "custom"
}
export declare enum ExecutionPriority {
    LOW = "low",
    NORMAL = "normal",
    HIGH = "high",
    CRITICAL = "critical"
}
export declare enum ExecutionStatus {
    PENDING = "pending",
    RUNNING = "running",
    COMPLETED = "completed",
    FAILED = "failed",
    TIMEOUT = "timeout",
    CANCELLED = "cancelled"
}
export declare class AgentInvocationDto {
    agent_id: string;
    task_type: TaskType;
    input_data: Record<string, any>;
    timeout?: number;
    priority?: ExecutionPriority;
    callback_url?: string;
    metadata?: Record<string, any>;
}
export declare class ExecuteAgentDto {
    agentId: string;
    input: Record<string, any>;
    timeout?: number;
    stream?: boolean;
}
export declare class AgentExecutionResultDto {
    success: boolean;
    output_data: Record<string, any>;
    execution_time: number;
    logs: string[];
    metrics?: Record<string, any>;
    error?: {
        code: string;
        message: string;
        details?: any;
    };
    execution_id: string;
    agent_id: string;
    status: ExecutionStatus;
    started_at: Date;
    completed_at: Date;
}
export declare class ExecutionLogDto {
    timestamp: Date;
    level: string;
    message: string;
    metadata?: Record<string, any>;
}
export declare class AgentExecutionStatusDto {
    execution_id: string;
    status: ExecutionStatus;
    progress: number;
    current_step?: string;
    estimated_completion?: Date;
    logs: ExecutionLogDto[];
}
