import { ChannelType, ChannelStatus } from '../entities/campaign-channel.entity';
export declare class CreateCampaignChannelDto {
    campaign_id: string;
    channel_type: ChannelType;
    description?: string;
    configuration?: Record<string, any>;
    scheduled_at?: string;
}
declare const UpdateCampaignChannelDto_base: import("@nestjs/common").Type<Partial<CreateCampaignChannelDto>>;
export declare class UpdateCampaignChannelDto extends UpdateCampaignChannelDto_base {
    status?: ChannelStatus;
}
export declare class CampaignChannelResponseDto {
    id: string;
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
    created_at: Date;
    updated_at: Date;
}
export declare class EmailChannelConfigDto {
    template_id: string;
    from_email: string;
    from_name: string;
    subject: string;
    reply_to?: string;
    cc?: string[];
    bcc?: string[];
    track_opens?: boolean;
    track_clicks?: boolean;
}
export declare class SmsChannelConfigDto {
    provider: string;
    from_number: string;
    message_template: string;
    character_limit?: number;
}
export declare class SocialMediaChannelConfigDto {
    platform: string;
    account_id: string;
    content: string;
    media_urls?: string[];
    hashtags?: string[];
}
export {};
