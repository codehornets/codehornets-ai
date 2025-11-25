import { AggregateRoot, UniqueId } from '../shared-kernel';
import { ReportType, ReportStatus, ReportFormat, ReportConfig, ReportData, ReportSchedule } from './report.types';
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
export declare class Report extends AggregateRoot<ReportProps> {
    private constructor();
    get name(): string;
    get description(): string | undefined;
    get type(): ReportType;
    get status(): ReportStatus;
    get format(): ReportFormat;
    get clientId(): UniqueId | undefined;
    get config(): ReportConfig;
    get data(): ReportData | undefined;
    get schedule(): ReportSchedule | undefined;
    get fileUrl(): string | undefined;
    get error(): string | undefined;
    static create(props: Omit<ReportProps, 'status' | 'data' | 'fileUrl' | 'error'>, id?: UniqueId): Report;
    static reconstitute(props: ReportProps, id: UniqueId): Report;
    startGeneration(): void;
    complete(data: ReportData, fileUrl?: string): void;
    fail(error: string): void;
    updateConfig(config: Partial<ReportConfig>): void;
    setSchedule(schedule: ReportSchedule): void;
    removeSchedule(): void;
    isScheduled(): boolean;
}
