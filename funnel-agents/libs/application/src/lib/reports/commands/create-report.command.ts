import { ReportType, ReportFormat, ReportConfig, ReportSchedule } from '@funnelagents/domain';

export class CreateReportCommand {
  constructor(
    public readonly name: string,
    public readonly type: ReportType,
    public readonly format: ReportFormat,
    public readonly config: ReportConfig,
    public readonly description?: string,
    public readonly clientId?: string,
    public readonly schedule?: ReportSchedule
  ) {}
}

export interface CreateReportResult {
  id: string;
  name: string;
  type: ReportType;
  format: ReportFormat;
  status: string;
  createdAt: Date;
}
