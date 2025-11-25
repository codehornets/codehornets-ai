import { ReportTemplateService } from '../services/report-template.service';
import { CreateReportTemplateDto, UpdateReportTemplateDto, ReportTemplateResponseDto, CloneTemplateDto } from '../dto/report-template.dto';
import { ReportType } from '../entities/scheduled-report.entity';
export declare class ReportTemplatesController {
    private readonly templateService;
    constructor(templateService: ReportTemplateService);
    create(dto: CreateReportTemplateDto): Promise<ReportTemplateResponseDto>;
    findAll(workspaceId?: string): Promise<ReportTemplateResponseDto[]>;
    findByType(type: ReportType, workspaceId?: string): Promise<ReportTemplateResponseDto[]>;
    findOne(id: string, workspaceId?: string): Promise<ReportTemplateResponseDto>;
    update(id: string, dto: UpdateReportTemplateDto, workspaceId?: string): Promise<ReportTemplateResponseDto>;
    remove(id: string, workspaceId?: string): Promise<void>;
    clone(dto: CloneTemplateDto): Promise<ReportTemplateResponseDto>;
    seedDefaultTemplates(): Promise<{
        message: string;
    }>;
}
