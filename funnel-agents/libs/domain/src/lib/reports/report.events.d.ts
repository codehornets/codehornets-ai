import { BaseDomainEvent } from '../shared-kernel';
import { ReportType } from './report.types';
export declare class ReportCreatedEvent extends BaseDomainEvent {
    readonly eventType = "report.created";
    readonly name: string;
    readonly type: ReportType;
    constructor(reportId: string, name: string, type: ReportType);
}
export declare class ReportGeneratedEvent extends BaseDomainEvent {
    readonly eventType = "report.generated";
    readonly name: string;
    constructor(reportId: string, name: string);
}
export declare class ReportFailedEvent extends BaseDomainEvent {
    readonly eventType = "report.failed";
    readonly error: string;
    constructor(reportId: string, error: string);
}
export declare class ReportScheduledEvent extends BaseDomainEvent {
    readonly eventType = "report.scheduled";
    readonly frequency: string;
    constructor(reportId: string, frequency: string);
}
