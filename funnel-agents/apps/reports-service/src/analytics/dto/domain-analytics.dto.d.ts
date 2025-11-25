export interface DomainMetrics {
    domain: string;
    agent_count: number;
    active_count: number;
    total_tasks: number;
    completed_tasks: number;
    success_rate: number;
    avg_completion_time: number;
}
export declare class DomainAnalyticsDto {
    domains: DomainMetrics[];
    constructor(data: Partial<DomainAnalyticsDto>);
}
