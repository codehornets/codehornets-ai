import { PaginationParams, CampaignStatus, CampaignType } from '@funnelagents/domain';

export class ListCampaignsQuery {
  constructor(
    public readonly filters?: {
      clientId?: string;
      status?: CampaignStatus;
      type?: CampaignType;
      search?: string;
    },
    public readonly pagination?: PaginationParams
  ) {}
}

export interface CampaignListDto {
  id: string;
  name: string;
  type: CampaignType;
  status: CampaignStatus;
  clientId: string;
  createdAt: Date;
}
