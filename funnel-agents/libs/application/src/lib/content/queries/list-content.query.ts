import { PaginationParams, ContentType, ContentStatus } from '@funnelagents/domain';

export class ListContentQuery {
  constructor(
    public readonly filters?: {
      type?: ContentType;
      status?: ContentStatus;
      clientId?: string;
      campaignId?: string;
      tags?: string[];
      search?: string;
    },
    public readonly pagination?: PaginationParams
  ) {}
}

export interface ContentListDto {
  id: string;
  title: string;
  type: ContentType;
  status: ContentStatus;
  currentVersion: number;
  createdAt: Date;
}
