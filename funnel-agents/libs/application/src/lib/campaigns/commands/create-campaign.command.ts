import { CampaignType } from '@funnelagents/domain';

export class CreateCampaignCommand {
  constructor(
    public readonly name: string,
    public readonly type: CampaignType,
    public readonly clientId: string,
    public readonly description?: string,
    public readonly budget?: { amount: number; currency: string },
    public readonly dateRange?: { start: Date; end: Date }
  ) {}
}

export interface CreateCampaignResult {
  id: string;
  name: string;
  type: CampaignType;
  clientId: string;
  status: string;
  createdAt: Date;
}
