import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReportTemplateEntity } from '../entities/report-template.entity';
import {
  CreateReportTemplateDto,
  UpdateReportTemplateDto,
  ReportTemplateResponseDto,
  CloneTemplateDto,
} from '../dto/report-template.dto';
import { ReportType } from '../entities/scheduled-report.entity';

@Injectable()
export class ReportTemplateService {
  private readonly logger = new Logger(ReportTemplateService.name);

  constructor(
    @InjectRepository(ReportTemplateEntity)
    private readonly templateRepository: Repository<ReportTemplateEntity>,
  ) {}

  /**
   * Create a new report template
   */
  async create(dto: CreateReportTemplateDto, createdBy?: string): Promise<ReportTemplateResponseDto> {
    this.logger.log(`Creating report template: ${dto.name}`);

    const template = this.templateRepository.create({
      ...dto,
      createdBy,
    });

    const saved = await this.templateRepository.save(template);

    return this.toResponseDto(saved);
  }

  /**
   * Get all templates for a workspace
   */
  async findAll(workspaceId?: string): Promise<ReportTemplateResponseDto[]> {
    const query = this.templateRepository.createQueryBuilder('template');

    if (workspaceId) {
      query.where('template.workspace_id = :workspaceId OR template.is_public = true', {
        workspaceId,
      });
    } else {
      query.where('template.is_public = true');
    }

    query.orderBy('template.created_at', 'DESC');

    const templates = await query.getMany();

    return templates.map((t) => this.toResponseDto(t));
  }

  /**
   * Get template by ID
   */
  async findOne(id: string, workspaceId?: string): Promise<ReportTemplateResponseDto> {
    const query = this.templateRepository.createQueryBuilder('template').where('template.id = :id', { id });

    if (workspaceId) {
      query.andWhere('(template.workspace_id = :workspaceId OR template.is_public = true)', {
        workspaceId,
      });
    }

    const template = await query.getOne();

    if (!template) {
      throw new NotFoundException(`Template not found: ${id}`);
    }

    return this.toResponseDto(template);
  }

  /**
   * Update template
   */
  async update(
    id: string,
    dto: UpdateReportTemplateDto,
    workspaceId?: string,
  ): Promise<ReportTemplateResponseDto> {
    const template = await this.templateRepository.findOne({
      where: { id, ...(workspaceId && { workspaceId }) },
    });

    if (!template) {
      throw new NotFoundException(`Template not found: ${id}`);
    }

    if (template.isPublic) {
      throw new BadRequestException('Cannot modify public templates');
    }

    Object.assign(template, dto);

    const updated = await this.templateRepository.save(template);

    this.logger.log(`Updated template: ${id}`);

    return this.toResponseDto(updated);
  }

  /**
   * Delete template
   */
  async remove(id: string, workspaceId?: string): Promise<void> {
    const template = await this.templateRepository.findOne({
      where: { id, ...(workspaceId && { workspaceId }) },
    });

    if (!template) {
      throw new NotFoundException(`Template not found: ${id}`);
    }

    if (template.isPublic) {
      throw new BadRequestException('Cannot delete public templates');
    }

    await this.templateRepository.remove(template);

    this.logger.log(`Deleted template: ${id}`);
  }

  /**
   * Clone template to create custom version
   */
  async clone(dto: CloneTemplateDto, createdBy?: string): Promise<ReportTemplateResponseDto> {
    const original = await this.templateRepository.findOne({
      where: { id: dto.templateId },
    });

    if (!original) {
      throw new NotFoundException(`Template not found: ${dto.templateId}`);
    }

    this.logger.log(`Cloning template: ${original.name}`);

    const cloned = this.templateRepository.create({
      name: dto.name || `${original.name} (Copy)`,
      description: original.description,
      reportType: original.reportType,
      workspaceId: dto.workspaceId,
      isPublic: false,
      metrics: original.metrics,
      filters: original.filters,
      groupBy: original.groupBy,
      charts: original.charts,
      createdBy,
    });

    const saved = await this.templateRepository.save(cloned);

    return this.toResponseDto(saved);
  }

  /**
   * Get templates by type
   */
  async findByType(type: ReportType, workspaceId?: string): Promise<ReportTemplateResponseDto[]> {
    const query = this.templateRepository
      .createQueryBuilder('template')
      .where('template.report_type = :type', { type });

    if (workspaceId) {
      query.andWhere('(template.workspace_id = :workspaceId OR template.is_public = true)', {
        workspaceId,
      });
    } else {
      query.andWhere('template.is_public = true');
    }

    query.orderBy('template.created_at', 'DESC');

    const templates = await query.getMany();

    return templates.map((t) => this.toResponseDto(t));
  }

  /**
   * Seed default templates
   */
  async seedDefaultTemplates(): Promise<void> {
    this.logger.log('Seeding default report templates');

    const templates = [
      {
        name: 'Weekly Summary',
        description: 'Comprehensive weekly performance report',
        reportType: ReportType.CUSTOM,
        isPublic: true,
        metrics: [
          'count',
          'success_rate',
          'avg_completion_time',
          'conversion_rate',
          'total_value',
        ],
        filters: {},
        groupBy: [],
        charts: {
          taskTrend: { type: 'line', metric: 'count' },
          successRate: { type: 'bar', metric: 'success_rate' },
          agentPerformance: { type: 'bar', metric: 'tasks_completed' },
        },
      },
      {
        name: 'Agent Performance',
        description: 'Detailed agent performance metrics',
        reportType: ReportType.AGENT_ANALYTICS,
        isPublic: true,
        metrics: ['tasks_completed', 'success_rate', 'avg_completion_time', 'avg_feedback_rating'],
        filters: {},
        groupBy: ['domain'],
        charts: {
          topPerformers: { type: 'bar', metric: 'tasks_completed', limit: 10 },
          successRateByDomain: { type: 'pie', metric: 'success_rate' },
        },
      },
      {
        name: 'Campaign ROI',
        description: 'Campaign performance and ROI analysis',
        reportType: ReportType.CUSTOM,
        isPublic: true,
        metrics: ['total_budget', 'total_spent', 'roi', 'conversion_rate'],
        filters: {},
        groupBy: ['status'],
        charts: {
          budgetVsSpent: { type: 'bar', metrics: ['budget', 'spent'] },
          roi: { type: 'line', metric: 'roi' },
        },
      },
      {
        name: 'Sales Pipeline',
        description: 'Deal pipeline and conversion funnel',
        reportType: ReportType.CUSTOM,
        isPublic: true,
        metrics: ['count', 'total_value', 'avg_deal_size', 'conversion_rate'],
        filters: {},
        groupBy: ['stage', 'status'],
        charts: {
          funnel: { type: 'funnel', metric: 'count', groupBy: 'stage' },
          dealValue: { type: 'bar', metric: 'total_value' },
        },
      },
      {
        name: 'Lead Generation',
        description: 'Lead acquisition and quality metrics',
        reportType: ReportType.CUSTOM,
        isPublic: true,
        metrics: ['count', 'avg_score', 'conversion_rate'],
        filters: {},
        groupBy: ['source', 'status'],
        charts: {
          leadsBySource: { type: 'pie', metric: 'count', groupBy: 'source' },
          scoreDistribution: { type: 'histogram', metric: 'score' },
        },
      },
    ];

    for (const templateData of templates) {
      const existing = await this.templateRepository.findOne({
        where: { name: templateData.name, isPublic: true },
      });

      if (!existing) {
        const template = this.templateRepository.create(templateData);
        await this.templateRepository.save(template);
        this.logger.log(`Created template: ${templateData.name}`);
      }
    }

    this.logger.log('Default templates seeded');
  }

  /**
   * Convert entity to response DTO
   */
  private toResponseDto(template: ReportTemplateEntity): ReportTemplateResponseDto {
    return {
      id: template.id,
      name: template.name,
      description: template.description,
      reportType: template.reportType,
      isPublic: template.isPublic,
      metrics: template.metrics,
      filters: template.filters,
      groupBy: template.groupBy,
      charts: template.charts,
      createdAt: template.createdAt,
    };
  }
}
