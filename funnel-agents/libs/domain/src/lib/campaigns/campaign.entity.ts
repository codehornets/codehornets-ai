import { AggregateRoot, UniqueId, Money, DateRange } from '../shared-kernel';
import { CampaignStatus, CampaignType, CampaignMetrics, CampaignTarget } from './campaign.types';
import { CampaignCreatedEvent, CampaignStartedEvent, CampaignCompletedEvent } from './campaign.events';

export interface CampaignProps {
  name: string;
  description?: string;
  type: CampaignType;
  status: CampaignStatus;
  clientId: UniqueId;
  budget?: Money;
  dateRange?: DateRange;
  target?: CampaignTarget;
  metrics?: CampaignMetrics;
}

export class Campaign extends AggregateRoot<CampaignProps> {
  private constructor(props: CampaignProps, id?: UniqueId) {
    super(props, id);
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get type(): CampaignType {
    return this.props.type;
  }

  get status(): CampaignStatus {
    return this.props.status;
  }

  get clientId(): UniqueId {
    return this.props.clientId;
  }

  get budget(): Money | undefined {
    return this.props.budget;
  }

  get dateRange(): DateRange | undefined {
    return this.props.dateRange;
  }

  get target(): CampaignTarget | undefined {
    return this.props.target;
  }

  get metrics(): CampaignMetrics | undefined {
    return this.props.metrics;
  }

  public static create(
    props: Omit<CampaignProps, 'status' | 'metrics'>,
    id?: UniqueId
  ): Campaign {
    const campaign = new Campaign(
      {
        ...props,
        status: CampaignStatus.DRAFT,
        metrics: {
          impressions: 0,
          clicks: 0,
          conversions: 0,
          spend: 0,
          revenue: 0,
          roi: 0,
        },
      },
      id
    );
    campaign.addDomainEvent(
      new CampaignCreatedEvent(campaign.id.value, campaign.name, campaign.type)
    );
    return campaign;
  }

  public static reconstitute(props: CampaignProps, id: UniqueId): Campaign {
    return new Campaign(props, id);
  }

  public start(): void {
    if (this.status !== CampaignStatus.DRAFT && this.status !== CampaignStatus.SCHEDULED) {
      throw new Error('Campaign can only be started from draft or scheduled status');
    }
    this.props.status = CampaignStatus.RUNNING;
    this.touch();
    this.addDomainEvent(new CampaignStartedEvent(this.id.value));
  }

  public pause(): void {
    if (this.status !== CampaignStatus.RUNNING) {
      throw new Error('Campaign can only be paused when running');
    }
    this.props.status = CampaignStatus.PAUSED;
    this.touch();
  }

  public resume(): void {
    if (this.status !== CampaignStatus.PAUSED) {
      throw new Error('Campaign can only be resumed when paused');
    }
    this.props.status = CampaignStatus.RUNNING;
    this.touch();
  }

  public complete(): void {
    this.props.status = CampaignStatus.COMPLETED;
    this.touch();
    this.addDomainEvent(new CampaignCompletedEvent(this.id.value, this.metrics));
  }

  public cancel(): void {
    this.props.status = CampaignStatus.CANCELLED;
    this.touch();
  }

  public updateMetrics(metrics: Partial<CampaignMetrics>): void {
    this.props.metrics = { ...this.props.metrics, ...metrics } as CampaignMetrics;
    if (this.props.metrics.spend > 0) {
      this.props.metrics.roi =
        ((this.props.metrics.revenue - this.props.metrics.spend) / this.props.metrics.spend) * 100;
    }
    this.touch();
  }
}
