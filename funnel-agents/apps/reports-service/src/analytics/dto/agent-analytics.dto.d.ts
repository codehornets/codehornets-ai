export interface AgentMetrics {
    id: string;
    name: string;
    domain: string;
    status: string;
    tasks_completed: number;
    tasks_failed: number;
    success_rate: number;
    avg_completion_time: number;
    avg_feedback_rating: number;
}
export declare class AgentAnalyticsDto {
    total_agents: number;
    active_agents: number;
    agents: AgentMetrics[];
    constructor(data: Partial<AgentAnalyticsDto>);
}
