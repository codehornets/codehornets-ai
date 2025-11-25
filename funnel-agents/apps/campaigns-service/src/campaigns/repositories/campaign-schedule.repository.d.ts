import { Repository } from 'typeorm';
import { BaseRepository } from '@funnelagents/infrastructure';
import { CampaignScheduleEntity } from '../entities/campaign-schedule.entity';
export declare class CampaignScheduleRepository extends BaseRepository<CampaignScheduleEntity> {
    constructor(repository: Repository<CampaignScheduleEntity>);
    findByCampaignId(campaignId: string): Promise<CampaignScheduleEntity | null>;
    findDueSchedules(): Promise<CampaignScheduleEntity[]>;
    updateRunInfo(scheduleId: string, nextRunAt?: Date): Promise<void>;
    markCompleted(scheduleId: string): Promise<void>;
}
