import { CampaignType, CampaignStatus, CampaignMetrics } from '@funnelagents/domain';

export class GetCampaignQuery {
  constructor(public readonly id: string) {}
}

export interface CampaignDto {
  id: string;
  name: string;
  description?: string;
  type: CampaignType;
  status: CampaignStatus;
  clientId: string;
  budget?: { amount: number; currency: string };
  dateRange?: { start: Date; end: Date };
  metrics?: CampaignMetrics;
  createdAt: Date;
  updatedAt: Date;
}
