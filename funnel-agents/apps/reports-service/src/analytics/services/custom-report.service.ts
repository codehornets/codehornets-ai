import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import {
  TaskEntity,
  AgentEntity,
  LeadEntity,
  CampaignEntity,
  DealEntity,
} from '../entities';
import { CustomReportDto, CustomReportEntity, CustomReportResultDto } from '../dto/custom-report.dto';
import { CacheService } from './cache.service';

@Injectable()
export class CustomReportService {
  private readonly logger = new Logger(CustomReportService.name);

  constructor(
    @InjectRepository(TaskEntity)
    private readonly taskRepository: Repository<TaskEntity>,
    @InjectRepository(AgentEntity)
    private readonly agentRepository: Repository<AgentEntity>,
    @InjectRepository(LeadEntity)
    private readonly leadRepository: Repository<LeadEntity>,
    @InjectRepository(CampaignEntity)
    private readonly campaignRepository: Repository<CampaignEntity>,
    @InjectRepository(DealEntity)
    private readonly dealRepository: Repository<DealEntity>,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Generate custom report based on dynamic query
   */
  async generateCustomReport(dto: CustomReportDto): Promise<CustomReportResultDto> {
    this.logger.log(`Generating custom report for entity: ${dto.entity}`);

    // Check cache first
    const cacheKey = this.cacheService.generateKey(
      `custom-report:${dto.entity}`,
      dto.workspaceId || 'global',
      { metrics: dto.metrics, filters: dto.filters, groupBy: dto.groupBy },
    );

    const cached = await this.cacheService.get<CustomReportResultDto>(cacheKey);
    if (cached) {
      this.logger.log('Returning cached custom report');
      return cached;
    }

    // Build query
    const repository = this.getRepository(dto.entity);
    const queryBuilder = repository.createQueryBuilder(dto.entity);

    // Apply filters
    this.applyFilters(queryBuilder, dto);

    // Fetch data
    const data = await queryBuilder.getMany();

    // Calculate metrics
    const metrics = this.calculateMetrics(data, dto.metrics, dto.entity);

    // Group data if requested
    const groupedData = dto.groupBy
      ? this.groupData(data, dto.groupBy)
      : data;

    // Build summary
    const summary = this.buildSummary(data, metrics);

    const result: CustomReportResultDto = {
      entity: dto.entity,
      metrics,
      data: groupedData,
      summary,
      generatedAt: new Date().toISOString(),
    };

    // Cache result
    await this.cacheService.set(cacheKey, result, 5 * 60 * 1000); // 5 minutes

    return result;
  }

  /**
   * Get repository for entity type
   */
  private getRepository(entity: CustomReportEntity): Repository<any> {
    switch (entity) {
      case CustomReportEntity.TASKS:
        return this.taskRepository;
      case CustomReportEntity.AGENTS:
        return this.agentRepository;
      case CustomReportEntity.LEADS:
        return this.leadRepository;
      case CustomReportEntity.CAMPAIGNS:
        return this.campaignRepository;
      case CustomReportEntity.DEALS:
        return this.dealRepository;
      default:
        throw new BadRequestException(`Unknown entity: ${entity}`);
    }
  }

  /**
   * Apply filters to query builder
   */
  private applyFilters(queryBuilder: SelectQueryBuilder<any>, dto: CustomReportDto): void {
    const entity = dto.entity;

    // Workspace filter
    if (dto.workspaceId) {
      queryBuilder.andWhere(`${entity}.workspace_id = :workspaceId`, {
        workspaceId: dto.workspaceId,
      });
    }

    // Date range filters
    if (dto.startDate) {
      queryBuilder.andWhere(`${entity}.created_at >= :startDate`, {
        startDate: new Date(dto.startDate),
      });
    }

    if (dto.endDate) {
      queryBuilder.andWhere(`${entity}.created_at <= :endDate`, {
        endDate: new Date(dto.endDate),
      });
    }

    // Custom filters
    if (dto.filters) {
      Object.entries(dto.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          const paramName = key.replace('.', '_');

          if (Array.isArray(value)) {
            queryBuilder.andWhere(`${entity}.${key} IN (:...${paramName})`, {
              [paramName]: value,
            });
          } else if (typeof value === 'string' && value.includes('%')) {
            queryBuilder.andWhere(`${entity}.${key} LIKE :${paramName}`, {
              [paramName]: value,
            });
          } else {
            queryBuilder.andWhere(`${entity}.${key} = :${paramName}`, {
              [paramName]: value,
            });
          }
        }
      });
    }
  }

  /**
   * Calculate metrics from data
   */
  private calculateMetrics(
    data: any[],
    metricNames: string[],
    entity: CustomReportEntity,
  ): Record<string, any> {
    const metrics: Record<string, any> = {};

    metricNames.forEach((metric) => {
      switch (metric) {
        case 'count':
          metrics.count = data.length;
          break;

        case 'avg_completion_time':
          if (entity === CustomReportEntity.TASKS) {
            metrics.avg_completion_time = this.calculateAvgCompletionTime(data);
          }
          break;

        case 'success_rate':
          if (entity === CustomReportEntity.TASKS) {
            metrics.success_rate = this.calculateSuccessRate(data);
          }
          break;

        case 'conversion_rate':
          if (entity === CustomReportEntity.LEADS || entity === CustomReportEntity.DEALS) {
            metrics.conversion_rate = this.calculateConversionRate(data);
          }
          break;

        case 'total_value':
          if (entity === CustomReportEntity.DEALS) {
            metrics.total_value = this.calculateTotalValue(data);
          }
          break;

        case 'avg_deal_size':
          if (entity === CustomReportEntity.DEALS) {
            metrics.avg_deal_size = this.calculateAvgDealSize(data);
          }
          break;

        case 'total_budget':
        case 'total_spent':
          if (entity === CustomReportEntity.CAMPAIGNS) {
            metrics[metric] = this.sumField(data, metric.replace('total_', ''));
          }
          break;

        case 'roi':
          if (entity === CustomReportEntity.CAMPAIGNS) {
            metrics.roi = this.calculateROI(data);
          }
          break;

        case 'avg_score':
          if (entity === CustomReportEntity.LEADS) {
            metrics.avg_score = this.avgField(data, 'score');
          }
          break;

        default:
          // Try to calculate as simple count by field
          metrics[metric] = this.countByField(data, metric);
      }
    });

    return metrics;
  }

  /**
   * Group data by specified fields
   */
  private groupData(data: any[], groupBy: string[]): any[] {
    const grouped = new Map<string, any[]>();

    data.forEach((item) => {
      const key = groupBy.map((field) => item[field]).join('|');

      if (!grouped.has(key)) {
        grouped.set(key, []);
      }

      grouped.get(key)!.push(item);
    });

    return Array.from(grouped.entries()).map(([key, items]) => {
      const groupKeys = key.split('|');
      const groupObj: any = {};

      groupBy.forEach((field, index) => {
        groupObj[field] = groupKeys[index];
      });

      return {
        ...groupObj,
        count: items.length,
        items,
      };
    });
  }

  /**
   * Build summary statistics
   */
  private buildSummary(data: any[], metrics: Record<string, any>): Record<string, any> {
    return {
      totalRecords: data.length,
      ...metrics,
      generatedAt: new Date().toISOString(),
    };
  }

  // Metric calculation helpers

  private calculateAvgCompletionTime(tasks: any[]): number {
    const completedTasks = tasks.filter(
      (t) => t.status === 'COMPLETED' && t.startedAt && t.completedAt,
    );

    if (completedTasks.length === 0) return 0;

    const totalTime = completedTasks.reduce((sum, task) => {
      const time = new Date(task.completedAt).getTime() - new Date(task.startedAt).getTime();
      return sum + time;
    }, 0);

    return Number((totalTime / completedTasks.length / 1000).toFixed(2)); // seconds
  }

  private calculateSuccessRate(tasks: any[]): number {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter((t) => t.status === 'COMPLETED').length;
    return Number(((completed / tasks.length) * 100).toFixed(2));
  }

  private calculateConversionRate(items: any[]): number {
    if (items.length === 0) return 0;
    const converted = items.filter(
      (item) => item.status === 'converted' || item.status === 'won' || item.status === 'closed',
    ).length;
    return Number(((converted / items.length) * 100).toFixed(2));
  }

  private calculateTotalValue(deals: any[]): number {
    return Number(
      deals.reduce((sum, deal) => sum + (Number(deal.amount) || 0), 0).toFixed(2),
    );
  }

  private calculateAvgDealSize(deals: any[]): number {
    if (deals.length === 0) return 0;
    const total = this.calculateTotalValue(deals);
    return Number((total / deals.length).toFixed(2));
  }

  private calculateROI(campaigns: any[]): number {
    const totalSpent = campaigns.reduce((sum, c) => sum + (Number(c.spent) || 0), 0);
    const totalBudget = campaigns.reduce((sum, c) => sum + (Number(c.budget) || 0), 0);

    if (totalSpent === 0) return 0;

    // Simple ROI calculation (would need revenue data for accurate ROI)
    return Number((((totalBudget - totalSpent) / totalSpent) * 100).toFixed(2));
  }

  private sumField(items: any[], field: string): number {
    return Number(
      items.reduce((sum, item) => sum + (Number(item[field]) || 0), 0).toFixed(2),
    );
  }

  private avgField(items: any[], field: string): number {
    if (items.length === 0) return 0;
    const total = this.sumField(items, field);
    return Number((total / items.length).toFixed(2));
  }

  private countByField(items: any[], field: string): Record<string, number> {
    const counts: Record<string, number> = {};

    items.forEach((item) => {
      const value = item[field] || 'unknown';
      counts[value] = (counts[value] || 0) + 1;
    });

    return counts;
  }
}
