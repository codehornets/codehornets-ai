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
export declare class CampaignAnalyticsRepository extends BaseRepository<CampaignAnalyticsEntity> {
    constructor(repository: Repository<CampaignAnalyticsEntity>);
    findWithFilters(filters: CampaignAnalyticsFilters, params?: any): Promise<any>;
    countByEventType(campaignId: string, eventType: AnalyticEventType, startDate?: Date, endDate?: Date): Promise<number>;
    getEventsByDay(campaignId: string, startDate?: Date, endDate?: Date): Promise<Array<{
        date: string;
        event_type: string;
        count: number;
    }>>;
}
