import {
  ReportType,
  ReportStatus,
  ReportFormat,
  ReportConfig,
  ReportData,
  ReportSchedule,
} from '@funnelagents/domain';

export class GetReportQuery {
  constructor(public readonly id: string) {}
}

export interface ReportDto {
  id: string;
  name: string;
  description?: string;
  type: ReportType;
  status: ReportStatus;
  format: ReportFormat;
  clientId?: string;
  config: ReportConfig;
  data?: ReportData;
  schedule?: ReportSchedule;
  fileUrl?: string;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}
