import { Repository } from 'typeorm';
import { ReportTemplateEntity } from '../entities/report-template.entity';
import { CreateReportTemplateDto, UpdateReportTemplateDto, ReportTemplateResponseDto, CloneTemplateDto } from '../dto/report-template.dto';
import { ReportType } from '../entities/scheduled-report.entity';
export declare class ReportTemplateService {
    private readonly templateRepository;
    private readonly logger;
    constructor(templateRepository: Repository<ReportTemplateEntity>);
    /**
     * Create a new report template
     */
    create(dto: CreateReportTemplateDto, createdBy?: string): Promise<ReportTemplateResponseDto>;
    /**
     * Get all templates for a workspace
     */
    findAll(workspaceId?: string): Promise<ReportTemplateResponseDto[]>;
    /**
     * Get template by ID
     */
    findOne(id: string, workspaceId?: string): Promise<ReportTemplateResponseDto>;
    /**
     * Update template
     */
    update(id: string, dto: UpdateReportTemplateDto, workspaceId?: string): Promise<ReportTemplateResponseDto>;
    /**
     * Delete template
     */
    remove(id: string, workspaceId?: string): Promise<void>;
    /**
     * Clone template to create custom version
     */
    clone(dto: CloneTemplateDto, createdBy?: string): Promise<ReportTemplateResponseDto>;
    /**
     * Get templates by type
     */
    findByType(type: ReportType, workspaceId?: string): Promise<ReportTemplateResponseDto[]>;
    /**
     * Seed default templates
     */
    seedDefaultTemplates(): Promise<void>;
    /**
     * Convert entity to response DTO
     */
    private toResponseDto;
}
