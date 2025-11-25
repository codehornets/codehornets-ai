import { BaseDbEntity } from '@funnelagents/infrastructure';
export declare enum AnalyticEventType {
    EMAIL_SENT = "email_sent",
    EMAIL_OPENED = "email_opened",
    EMAIL_CLICKED = "email_clicked",
    EMAIL_BOUNCED = "email_bounced",
    LEAD_CREATED = "lead_created",
    LEAD_CONVERTED = "lead_converted",
    TASK_COMPLETED = "task_completed",
    AGENT_EXECUTED = "agent_executed",
    CAMPAIGN_STARTED = "campaign_started",
    CAMPAIGN_PAUSED = "campaign_paused",
    CAMPAIGN_COMPLETED = "campaign_completed"
}
export declare class CampaignAnalyticsEntity extends BaseDbEntity {
    campaign_id: string;
    event_type: AnalyticEventType;
    metadata?: Record<string, any>;
    entity_id?: string;
    entity_type?: string;
    workspace_id?: string;
    event_timestamp: Date;
}
