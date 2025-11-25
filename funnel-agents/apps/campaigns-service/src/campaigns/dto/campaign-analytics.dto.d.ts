import { AnalyticEventType } from '../entities/campaign-analytics.entity';
export declare class CreateAnalyticEventDto {
    campaign_id: string;
    event_type: AnalyticEventType;
    metadata?: Record<string, any>;
    entity_id?: string;
    entity_type?: string;
    workspace_id?: string;
    event_timestamp?: string;
}
export declare class CampaignAnalyticsQueryDto {
    campaign_id?: string;
    start_date?: string;
    end_date?: string;
    workspace_id?: string;
    event_type?: AnalyticEventType;
}
export declare class CampaignPerformanceDto {
    campaign_id: string;
    campaign_name: string;
    total_leads: number;
    converted_leads: number;
    conversion_rate: number;
    emails_sent: number;
    emails_opened: number;
    open_rate: number;
    emails_clicked: number;
    click_rate: number;
    tasks_completed: number;
    agent_executions: number;
    agent_performance?: Record<string, any>;
    daily_metrics?: Array<{
        date: string;
        leads: number;
        conversions: number;
        emails_sent: number;
        emails_opened: number;
    }>;
}
