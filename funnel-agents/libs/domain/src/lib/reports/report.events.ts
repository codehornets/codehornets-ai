import { BaseDomainEvent } from '../shared-kernel';
import { ReportType } from './report.types';

export class ReportCreatedEvent extends BaseDomainEvent {
  public readonly eventType = 'report.created';
  public readonly name: string;
  public readonly type: ReportType;

  constructor(reportId: string, name: string, type: ReportType) {
    super(reportId);
    this.name = name;
    this.type = type;
  }
}

export class ReportGeneratedEvent extends BaseDomainEvent {
  public readonly eventType = 'report.generated';
  public readonly name: string;

  constructor(reportId: string, name: string) {
    super(reportId);
    this.name = name;
  }
}

export class ReportFailedEvent extends BaseDomainEvent {
  public readonly eventType = 'report.failed';
  public readonly error: string;

  constructor(reportId: string, error: string) {
    super(reportId);
    this.error = error;
  }
}

export class ReportScheduledEvent extends BaseDomainEvent {
  public readonly eventType = 'report.scheduled';
  public readonly frequency: string;

  constructor(reportId: string, frequency: string) {
    super(reportId);
    this.frequency = frequency;
  }
}
