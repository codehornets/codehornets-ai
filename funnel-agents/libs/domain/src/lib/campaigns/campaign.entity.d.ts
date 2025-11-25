import { AggregateRoot, UniqueId, Money, DateRange } from '../shared-kernel';
import { CampaignStatus, CampaignType, CampaignMetrics, CampaignTarget } from './campaign.types';
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
export declare class Campaign extends AggregateRoot<CampaignProps> {
    private constructor();
    get name(): string;
    get description(): string | undefined;
    get type(): CampaignType;
    get status(): CampaignStatus;
    get clientId(): UniqueId;
    get budget(): Money | undefined;
    get dateRange(): DateRange | undefined;
    get target(): CampaignTarget | undefined;
    get metrics(): CampaignMetrics | undefined;
    static create(props: Omit<CampaignProps, 'status' | 'metrics'>, id?: UniqueId): Campaign;
    static reconstitute(props: CampaignProps, id: UniqueId): Campaign;
    start(): void;
    pause(): void;
    resume(): void;
    complete(): void;
    cancel(): void;
    updateMetrics(metrics: Partial<CampaignMetrics>): void;
}
