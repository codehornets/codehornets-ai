import { PaginationParams, ReportType, ReportStatus } from '@funnelagents/domain';

export class ListReportsQuery {
  constructor(
    public readonly filters?: {
      type?: ReportType;
      status?: ReportStatus;
      clientId?: string;
      scheduled?: boolean;
      search?: string;
    },
    public readonly pagination?: PaginationParams
  ) {}
}

export interface ReportListDto {
  id: string;
  name: string;
  type: ReportType;
  status: ReportStatus;
  format: string;
  isScheduled: boolean;
  createdAt: Date;
}
