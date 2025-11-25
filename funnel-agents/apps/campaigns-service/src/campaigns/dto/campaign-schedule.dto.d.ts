import { RecurrenceType, ScheduleStatus } from '../entities/campaign-schedule.entity';
export declare class CreateCampaignScheduleDto {
    campaign_id: string;
    start_date: string;
    end_date?: string;
    recurrence?: RecurrenceType;
    cron_expression?: string;
    recurrence_config?: Record<string, any>;
    max_runs?: number;
    timezone?: string;
}
declare const UpdateCampaignScheduleDto_base: import("@nestjs/common").Type<Partial<CreateCampaignScheduleDto>>;
export declare class UpdateCampaignScheduleDto extends UpdateCampaignScheduleDto_base {
    status?: ScheduleStatus;
}
export declare class CampaignScheduleResponseDto {
    id: string;
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
    created_at: Date;
    updated_at: Date;
}
export {};
