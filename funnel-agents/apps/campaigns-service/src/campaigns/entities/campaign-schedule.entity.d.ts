import { BaseDbEntity } from '@funnelagents/infrastructure';
export declare enum RecurrenceType {
    NONE = "none",
    DAILY = "daily",
    WEEKLY = "weekly",
    MONTHLY = "monthly",
    CUSTOM = "custom"
}
export declare enum ScheduleStatus {
    PENDING = "pending",
    ACTIVE = "active",
    PAUSED = "paused",
    COMPLETED = "completed",
    CANCELLED = "cancelled"
}
export declare class CampaignScheduleEntity extends BaseDbEntity {
    campaign_id: string;
    start_date: Date;
    end_date?: Date;
    recurrence: RecurrenceType;
    cron_expression?: string;
    recurrence_config?: Record<string, any>;
    status: ScheduleStatus;
    next_run_at?: Date;
    last_run_at?: Date;
    run_count: number;
    max_runs?: number;
    timezone: string;
}
