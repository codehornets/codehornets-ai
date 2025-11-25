import { AggregateRoot, UniqueId } from '../shared-kernel';
import {
  ReportType,
  ReportStatus,
  ReportFormat,
  ReportConfig,
  ReportData,
  ReportSchedule,
} from './report.types';
import { ReportCreatedEvent, ReportGeneratedEvent } from './report.events';

export interface ReportProps {
  name: string;
  description?: string;
  type: ReportType;
  status: ReportStatus;
  format: ReportFormat;
  clientId?: UniqueId;
  config: ReportConfig;
  data?: ReportData;
  schedule?: ReportSchedule;
  fileUrl?: string;
  error?: string;
}

export class Report extends AggregateRoot<ReportProps> {
  private constructor(props: ReportProps, id?: UniqueId) {
    super(props, id);
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get type(): ReportType {
    return this.props.type;
  }

  get status(): ReportStatus {
    return this.props.status;
  }

  get format(): ReportFormat {
    return this.props.format;
  }

  get clientId(): UniqueId | undefined {
    return this.props.clientId;
  }

  get config(): ReportConfig {
    return this.props.config;
  }

  get data(): ReportData | undefined {
    return this.props.data;
  }

  get schedule(): ReportSchedule | undefined {
    return this.props.schedule;
  }

  get fileUrl(): string | undefined {
    return this.props.fileUrl;
  }

  get error(): string | undefined {
    return this.props.error;
  }

  public static create(
    props: Omit<ReportProps, 'status' | 'data' | 'fileUrl' | 'error'>,
    id?: UniqueId
  ): Report {
    const report = new Report(
      {
        ...props,
        status: ReportStatus.PENDING,
      },
      id
    );
    report.addDomainEvent(new ReportCreatedEvent(report.id.value, report.name, report.type));
    return report;
  }

  public static reconstitute(props: ReportProps, id: UniqueId): Report {
    return new Report(props, id);
  }

  public startGeneration(): void {
    this.props.status = ReportStatus.GENERATING;
    this.props.error = undefined;
    this.touch();
  }

  public complete(data: ReportData, fileUrl?: string): void {
    this.props.status = ReportStatus.COMPLETED;
    this.props.data = data;
    this.props.fileUrl = fileUrl;
    this.touch();
    this.addDomainEvent(new ReportGeneratedEvent(this.id.value, this.name));
  }

  public fail(error: string): void {
    this.props.status = ReportStatus.FAILED;
    this.props.error = error;
    this.touch();
  }

  public updateConfig(config: Partial<ReportConfig>): void {
    this.props.config = { ...this.props.config, ...config };
    this.touch();
  }

  public setSchedule(schedule: ReportSchedule): void {
    this.props.schedule = schedule;
    this.touch();
  }

  public removeSchedule(): void {
    this.props.schedule = undefined;
    this.touch();
  }

  public isScheduled(): boolean {
    return this.props.schedule !== undefined;
  }
}
