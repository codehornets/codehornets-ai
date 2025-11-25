import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '@funnelagents/infrastructure';
import { CampaignAnalyticsEntity, AnalyticEventType } from '../entities/campaign-analytics.entity';

export interface CampaignAnalyticsFilters {
  campaign_id?: string;
  event_type?: AnalyticEventType;
  workspace_id?: string;
  entity_id?: string;
  entity_type?: string;
  start_date?: Date;
  end_date?: Date;
}

@Injectable()
export class CampaignAnalyticsRepository extends BaseRepository<CampaignAnalyticsEntity> {
  constructor(
    @InjectRepository(CampaignAnalyticsEntity)
    repository: Repository<CampaignAnalyticsEntity>,
  ) {
    super(repository);
  }

  async findWithFilters(
    filters: CampaignAnalyticsFilters,
    params?: any,
  ): Promise<any> {
    const qb = this.repository.createQueryBuilder('analytics');

    if (filters.campaign_id) {
      qb.andWhere('analytics.campaign_id = :campaignId', {
        campaignId: filters.campaign_id,
      });
    }

    if (filters.event_type) {
      qb.andWhere('analytics.event_type = :eventType', {
        eventType: filters.event_type,
      });
    }

    if (filters.workspace_id) {
      qb.andWhere('analytics.workspace_id = :workspaceId', {
        workspaceId: filters.workspace_id,
      });
    }

    if (filters.entity_id) {
      qb.andWhere('analytics.entity_id = :entityId', {
        entityId: filters.entity_id,
      });
    }

    if (filters.entity_type) {
      qb.andWhere('analytics.entity_type = :entityType', {
        entityType: filters.entity_type,
      });
    }

    if (filters.start_date) {
      qb.andWhere('analytics.event_timestamp >= :startDate', {
        startDate: filters.start_date,
      });
    }

    if (filters.end_date) {
      qb.andWhere('analytics.event_timestamp <= :endDate', {
        endDate: filters.end_date,
      });
    }

    return this.paginate(qb, params);
  }

  async countByEventType(
    campaignId: string,
    eventType: AnalyticEventType,
    startDate?: Date,
    endDate?: Date,
  ): Promise<number> {
    const qb = this.repository
      .createQueryBuilder('analytics')
      .where('analytics.campaign_id = :campaignId', { campaignId })
      .andWhere('analytics.event_type = :eventType', { eventType });

    if (startDate) {
      qb.andWhere('analytics.event_timestamp >= :startDate', { startDate });
    }

    if (endDate) {
      qb.andWhere('analytics.event_timestamp <= :endDate', { endDate });
    }

    return qb.getCount();
  }

  async getEventsByDay(
    campaignId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<Array<{ date: string; event_type: string; count: number }>> {
    const qb = this.repository
      .createQueryBuilder('analytics')
      .select("DATE(analytics.event_timestamp)", 'date')
      .addSelect('analytics.event_type', 'event_type')
      .addSelect('COUNT(*)', 'count')
      .where('analytics.campaign_id = :campaignId', { campaignId })
      .groupBy('date')
      .addGroupBy('analytics.event_type')
      .orderBy('date', 'ASC');

    if (startDate) {
      qb.andWhere('analytics.event_timestamp >= :startDate', { startDate });
    }

    if (endDate) {
      qb.andWhere('analytics.event_timestamp <= :endDate', { endDate });
    }

    return qb.getRawMany();
  }
}
