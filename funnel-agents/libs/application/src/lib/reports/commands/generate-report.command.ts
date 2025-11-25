import { ReportData } from '@funnelagents/domain';

export class GenerateReportCommand {
  constructor(public readonly reportId: string) {}
}

export class CompleteReportGenerationCommand {
  constructor(
    public readonly reportId: string,
    public readonly data: ReportData,
    public readonly fileUrl?: string
  ) {}
}

export interface GenerateReportResult {
  id: string;
  status: string;
  fileUrl?: string;
  generatedAt?: Date;
}
