export declare enum ReportFormat {
    PDF = "pdf",
    CSV = "csv",
    EXCEL = "excel",
    JSON = "json"
}
export declare enum ReportType {
    TASK_ANALYTICS = "task_analytics",
    AGENT_ANALYTICS = "agent_analytics",
    DOMAIN_ANALYTICS = "domain_analytics",
    CUSTOM = "custom",
    TEMPLATE = "template"
}
export declare class ScheduledReportEntity {
    id: string;
    name: string;
    reportType: ReportType;
    workspaceId: string;
    schedule: string;
    recipients: string[];
    format: ReportFormat;
    config: Record<string, any>;
    templateId: string;
    isActive: boolean;
    lastSentAt: Date;
    nextSendAt: Date;
    lastError: string;
    sendCount: number;
    createdAt: Date;
    updatedAt: Date;
}
