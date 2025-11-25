import { BaseDbEntity } from '@funnelagents/infrastructure';
export declare enum ChannelType {
    EMAIL = "email",
    SMS = "sms",
    SOCIAL_MEDIA = "social_media",
    WEBHOOK = "webhook",
    PUSH_NOTIFICATION = "push_notification"
}
export declare enum ChannelStatus {
    DRAFT = "draft",
    ACTIVE = "active",
    PAUSED = "paused",
    COMPLETED = "completed",
    FAILED = "failed"
}
export declare class CampaignChannelEntity extends BaseDbEntity {
    campaign_id: string;
    channel_type: ChannelType;
    status: ChannelStatus;
    description?: string;
    configuration?: Record<string, any>;
    send_count: number;
    success_count: number;
    failure_count: number;
    scheduled_at?: Date;
    started_at?: Date;
    completed_at?: Date;
}
