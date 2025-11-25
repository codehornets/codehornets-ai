import { ClientProxy } from '@nestjs/microservices';
import { CampaignScheduleRepository } from '../repositories/campaign-schedule.repository';
import { CampaignRepository } from '../repositories/campaign.repository';
import { CampaignScheduleEntity } from '../entities/campaign-schedule.entity';
import { CreateCampaignScheduleDto, UpdateCampaignScheduleDto } from '../dto/campaign-schedule.dto';
export declare class CampaignSchedulingService {
    private readonly scheduleRepository;
    private readonly campaignRepository;
    private readonly schedulerClient;
    private readonly logger;
    constructor(scheduleRepository: CampaignScheduleRepository, campaignRepository: CampaignRepository, schedulerClient: ClientProxy);
    findByCampaignId(campaignId: string): Promise<CampaignScheduleEntity | null>;
    create(data: CreateCampaignScheduleDto): Promise<CampaignScheduleEntity>;
    update(id: string, data: UpdateCampaignScheduleDto): Promise<CampaignScheduleEntity>;
    delete(id: string): Promise<void>;
    activateSchedule(scheduleId: string): Promise<CampaignScheduleEntity>;
    pauseSchedule(scheduleId: string): Promise<CampaignScheduleEntity>;
    /**
     * Cron job to check and execute due schedules
     * Runs every 5 minutes
     */
    processDueSchedules(): Promise<void>;
    private executeSchedule;
    private calculateNextRun;
    private registerWithScheduler;
    private unregisterFromScheduler;
}
