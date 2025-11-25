import { BaseDomainEvent } from '../shared-kernel';
import { CampaignType, CampaignMetrics } from './campaign.types';
export declare class CampaignCreatedEvent extends BaseDomainEvent {
    readonly eventType = "campaign.created";
    readonly name: string;
    readonly type: CampaignType;
    constructor(campaignId: string, name: string, type: CampaignType);
}
export declare class CampaignStartedEvent extends BaseDomainEvent {
    readonly eventType = "campaign.started";
    constructor(campaignId: string);
}
export declare class CampaignPausedEvent extends BaseDomainEvent {
    readonly eventType = "campaign.paused";
    constructor(campaignId: string);
}
export declare class CampaignCompletedEvent extends BaseDomainEvent {
    readonly eventType = "campaign.completed";
    readonly metrics?: CampaignMetrics;
    constructor(campaignId: string, metrics?: CampaignMetrics);
}
export declare class CampaignCancelledEvent extends BaseDomainEvent {
    readonly eventType = "campaign.cancelled";
    constructor(campaignId: string);
}
