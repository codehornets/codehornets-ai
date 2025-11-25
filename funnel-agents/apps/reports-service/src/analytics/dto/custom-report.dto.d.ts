export declare enum CustomReportEntity {
    TASKS = "tasks",
    AGENTS = "agents",
    LEADS = "leads",
    CAMPAIGNS = "campaigns",
    DEALS = "deals"
}
export declare class CustomReportDto {
    entity: CustomReportEntity;
    metrics: string[];
    filters?: Record<string, any>;
    groupBy?: string[];
    workspaceId?: string;
    startDate?: string;
    endDate?: string;
}
export declare class CustomReportResultDto {
    entity: string;
    metrics: Record<string, any>;
    data: any[];
    summary: Record<string, any>;
    generatedAt: string;
}
