import { Repository } from 'typeorm';
import { ScheduledReportEntity } from '../entities/scheduled-report.entity';
import { CreateScheduledReportDto, UpdateScheduledReportDto, ScheduledReportResponseDto } from '../dto/scheduled-report.dto';
import { ReportSchedulerService } from '../services/report-scheduler.service';
export declare class ScheduledReportsController {
    private readonly scheduledReportRepository;
    private readonly reportSchedulerService;
    constructor(scheduledReportRepository: Repository<ScheduledReportEntity>, reportSchedulerService: ReportSchedulerService);
    create(dto: CreateScheduledReportDto): Promise<ScheduledReportResponseDto>;
    findAll(workspaceId?: string): Promise<ScheduledReportResponseDto[]>;
    findOne(id: string): Promise<ScheduledReportResponseDto>;
    update(id: string, dto: UpdateScheduledReportDto): Promise<ScheduledReportResponseDto>;
    remove(id: string): Promise<void>;
    trigger(id: string): Promise<{
        message: string;
    }>;
    private toResponseDto;
    private calculateNextSendTime;
}
