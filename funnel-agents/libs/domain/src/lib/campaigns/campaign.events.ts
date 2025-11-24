import { BaseDomainEvent } from '../shared-kernel';
import { CampaignType, CampaignMetrics } from './campaign.types';

export class CampaignCreatedEvent extends BaseDomainEvent {
  public readonly eventType = 'campaign.created';
  public readonly name: string;
  public readonly type: CampaignType;

  constructor(campaignId: string, name: string, type: CampaignType) {
    super(campaignId);
    this.name = name;
    this.type = type;
  }
}

export class CampaignStartedEvent extends BaseDomainEvent {
  public readonly eventType = 'campaign.started';

  constructor(campaignId: string) {
    super(campaignId);
  }
}

export class CampaignPausedEvent extends BaseDomainEvent {
  public readonly eventType = 'campaign.paused';

  constructor(campaignId: string) {
    super(campaignId);
  }
}

export class CampaignCompletedEvent extends BaseDomainEvent {
  public readonly eventType = 'campaign.completed';
  public readonly metrics?: CampaignMetrics;

  constructor(campaignId: string, metrics?: CampaignMetrics) {
    super(campaignId);
    this.metrics = metrics;
  }
}

export class CampaignCancelledEvent extends BaseDomainEvent {
  public readonly eventType = 'campaign.cancelled';

  constructor(campaignId: string) {
    super(campaignId);
  }
}
